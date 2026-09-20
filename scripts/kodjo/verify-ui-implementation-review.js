#!/usr/bin/env node
'use strict';

const { matrixFingerprint } = require('./lib/ui-criteria-contract');

const fs = require('node:fs');
const path = require('node:path');
const { extractTaggedJson, sha256, fail } = require('./lib/plan-impact');

const {inspectImplementation}=require('./lib/implementation-report');

const INPUT_SCHEMA = 'kodjo.ui-implementation-review-input.v1';
const REVIEW_SCHEMA = 'kodjo.ui-implementation-review.v1';
const BLOCKING_PROOFS = new Set(['FUNCTIONAL_TEST','STATIC_ANALYSIS']);
const DEVICE_PROOFS = new Set(['VISUAL_COMPARE','DEVICE_CHECK']);
const DEFERABLE_PROOFS = new Set([...DEVICE_PROOFS,'ACCESSIBILITY_CHECK']);
const IMPLEMENTATION_STATUSES = new Set(['CONFORME','PARTIELLEMENT_CONFORME','NON_CONFORME','NON_VERIFIABLE']);
const PROOF_STATUSES = new Set(['PASS','FAIL','PENDING_DEVICE','NON_VERIFIABLE']);
const PRESERVE_STATUSES = new Set(['PASS','FAIL','NON_VERIFIABLE']);

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}
function unique(values, code, label) {
  if (!Array.isArray(values)) fail(code, label + ' doit etre un tableau');
  const normalized = values.map((v) => String(v || '').trim());
  if (normalized.some((v) => !v) || new Set(normalized).size !== normalized.length) fail(code, label + ' invalide');
  return normalized;
}
function canonicalCriterionResult(row) {
  const proofs = Array.isArray(row && row.proof_results) ? row.proof_results.map((proof) => ({
    proof_type:String(proof && proof.proof_type || ''),
    status:String(proof && proof.status || ''),
    evidence:String(proof && proof.evidence || ''),
  })).sort((a,b)=>a.proof_type.localeCompare(b.proof_type)) : [];
  return {
    criterion_id:String(row && row.criterion_id || ''),
    implementation_status:String(row && row.implementation_status || ''),
    preserve_status:String(row && row.preserve_status || ''),
    evidence:String(row && row.evidence || ''),
    proof_results:proofs,
  };
}
function normalizeInheritedResult(row) {
  const normalized = canonicalCriterionResult(row);
  const deviceOnlyGap = normalized.preserve_status === 'PASS' && normalized.proof_results.length > 0 &&
    normalized.proof_results.every((proof) =>
      proof.status === 'PASS' || (DEFERABLE_PROOFS.has(proof.proof_type) && proof.status === 'PENDING_DEVICE'));
  if (normalized.implementation_status === 'NON_VERIFIABLE' && deviceOnlyGap) {
    normalized.implementation_status = 'CONFORME';
  }
  return normalized;
}
function readPreviousReview(file) {
  if (!file) return null;
  const body = fs.readFileSync(path.resolve(file), 'utf8').trim();
  if (!body) return null;
  if (body.startsWith('{')) return JSON.parse(body);
  return extractTaggedJson(body, 'KODJO_UI_IMPLEMENTATION_REVIEW_JSON', 'UI_IMPLEMENTATION_PREVIOUS_REVIEW_MISSING');
}
function buildInput(planBody, changedFiles, previousReview) {
  const matrix = extractTaggedJson(planBody, 'KODJO_UI_CRITERIA_MATRIX_JSON', 'UI_IMPLEMENTATION_REVIEW_PLAN_MATRIX_MISSING');
  const planContract = extractTaggedJson(planBody, 'KODJO_UI_PLAN_CONTRACT_JSON', 'UI_IMPLEMENTATION_REVIEW_PLAN_CONTRACT_MISSING');
  if (!matrix || matrix.schema !== 'kodjo.ui-criteria.v1') fail('UI_IMPLEMENTATION_REVIEW_PLAN_MATRIX_INVALID', 'schema matrice invalide');
  if (!planContract || planContract.schema !== 'kodjo.ui-plan-contract.v1') fail('UI_IMPLEMENTATION_REVIEW_PLAN_CONTRACT_INVALID', 'schema contrat invalide');
  if (planContract.matrix_sha256 !== matrixFingerprint(matrix)) fail('UI_IMPLEMENTATION_REVIEW_PLAN_DRIFT', 'matrice != contrat approuve');

  const criteria = Array.isArray(matrix.criteria) ? matrix.criteria : [];
  const criterionIds = criteria.map((c) => String(c && c.criterion_id || '')).sort();
  if (criterionIds.some((id) => !id) || new Set(criterionIds).size !== criterionIds.length) {
    fail('UI_IMPLEMENTATION_REVIEW_CRITERIA_INVALID', 'criterion_id absent ou duplique');
  }

  const changed = unique(changedFiles, 'UI_IMPLEMENTATION_REVIEW_CHANGED_FILES_INVALID', 'changed_files').sort();
  const changedSet = new Set(changed);
  const uiApplicable = Boolean(planContract.ui_applicable);
  if (!uiApplicable && criteria.length) fail('NON_UI_PLAN_HAS_UI_CRITERIA', 'contrat non UI contradictoire');

  let previousById = null;
  if (previousReview) {
    if (previousReview.schema !== REVIEW_SCHEMA || !Array.isArray(previousReview.criteria)) {
      fail('UI_IMPLEMENTATION_PREVIOUS_REVIEW_INVALID', 'ancienne revue invalide');
    }
    previousById = new Map(previousReview.criteria.map((row) => [String(row && row.criterion_id || ''), row]));
    const previousIds = [...previousById.keys()].sort();
    if (previousIds.some((id) => !id) || previousById.size !== previousReview.criteria.length ||
        JSON.stringify(previousIds) !== JSON.stringify(criterionIds)) {
      fail('UI_IMPLEMENTATION_PREVIOUS_REVIEW_COVERAGE_MISMATCH', 'ancienne revue != critères approuvés');
    }
  }

  const normalizedCriteria = criteria.map((criterion) => {
    const id = String(criterion.criterion_id);
    const targets = unique(criterion.change_targets || [], 'UI_IMPLEMENTATION_REVIEW_TARGET_INVALID', id + '.change_targets').sort();
    const missingTargets = targets.filter((target) => !changedSet.has(target));
    const tests = Array.isArray(criterion.tests) ? [...criterion.tests].map(String).sort() : [];
    const affectedPaths = [...new Set([...targets, ...tests].filter((target) => changedSet.has(target)))].sort();
    const reviewScope = previousById && affectedPaths.length === 0 ? 'INHERITED' : 'AFFECTED';
    if (!previousById && uiApplicable && missingTargets.length) {
      fail('UI_IMPLEMENTATION_REVIEW_TARGET_NOT_DELIVERED', id + ': ' + missingTargets.join(','));
    }
    const proofs = unique(criterion.proof_required || [], 'UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + '.proof_required').sort();
    const normalized = {
      criterion_id: id,
      source: criterion.source,
      component_decision: criterion.component_decision,
      selected_component: criterion.selected_component,
      change_targets: targets,
      tests,
      proof_required: proofs,
      device_proof_required: proofs.some((p) => DEFERABLE_PROOFS.has(p)),
      review_scope: reviewScope,
      affected_paths: affectedPaths,
    };
    if (reviewScope === 'INHERITED') normalized.inherited_result = normalizeInheritedResult(previousById.get(id));
    return normalized;
  }).sort((a,b) => a.criterion_id.localeCompare(b.criterion_id));

  const preservation = matrix.preservation || { preserve:[], change:[], forbidden:[] };
  const deviceGateRequired = normalizedCriteria.some((c) => c.device_proof_required);

  return {
    schema: INPUT_SCHEMA,
    review_mode: previousById ? 'DELTA_WITH_INHERITANCE' : 'FULL',
    ui_applicable: uiApplicable,
    ui_matrix_sha256: planContract.matrix_sha256,
    criterion_count: normalizedCriteria.length,
    criterion_ids_sha256: sha256(criterionIds),
    changed_files: changed,
    criteria: normalizedCriteria,
    preservation,
    boundary_requirements: [
      ...(Array.isArray(preservation.preserve) ? preservation.preserve.map((x) => ({ category:'PRESERVE', target:String(x.target || '') })) : []),
      ...(Array.isArray(preservation.forbidden) ? preservation.forbidden.map((x) => ({ category:'FORBIDDEN', target:String(x.target || '') })) : []),
    ].sort((a,b) => (a.category + ':' + a.target).localeCompare(b.category + ':' + b.target)),
    device_gate_required: deviceGateRequired,
  };
}

function validateReview(input, review) {
  if (!review || review.schema !== REVIEW_SCHEMA) fail('UI_IMPLEMENTATION_REVIEW_OUTPUT_INVALID', 'schema review invalide');
  if (Boolean(review.device_gate_required) !== Boolean(input.device_gate_required)) {
    fail('UI_IMPLEMENTATION_REVIEW_DEVICE_GATE_MISMATCH', 'device_gate_required divergent');
  }
  const results = Array.isArray(review.criteria) ? review.criteria : null;
  if (!results) fail('UI_IMPLEMENTATION_REVIEW_OUTPUT_INVALID', 'criteria absent');
  const expectedIds = input.criteria.map((c) => c.criterion_id).sort();
  const observedIds = results.map((r) => String(r && r.criterion_id || '')).sort();
  if (JSON.stringify(expectedIds) !== JSON.stringify(observedIds)) {
    fail('UI_IMPLEMENTATION_REVIEW_COVERAGE_INCOMPLETE', 'criteria reviewer != plan');
  }

  let blocking = false;
  const byId = new Map(input.criteria.map((c) => [c.criterion_id, c]));
  for (const row of results) {
    const id = String(row.criterion_id);
    const expected = byId.get(id);
    if (!IMPLEMENTATION_STATUSES.has(String(row.implementation_status))) {
      fail('UI_IMPLEMENTATION_REVIEW_STATUS_INVALID', id + '.implementation_status');
    }
    if (!PRESERVE_STATUSES.has(String(row.preserve_status))) {
      fail('UI_IMPLEMENTATION_REVIEW_STATUS_INVALID', id + '.preserve_status');
    }
    const reviewScope = expected.review_scope || 'AFFECTED';
    if (reviewScope === 'INHERITED') {
      const observed = canonicalCriterionResult(row);
      const inherited = canonicalCriterionResult(expected.inherited_result);
      if (JSON.stringify(observed) !== JSON.stringify(inherited)) {
        fail('UI_IMPLEMENTATION_REVIEW_INHERITED_DRIFT', id + ': critère non affecté réévalué');
      }
    }
    if (String(row.preserve_status) !== 'PASS') blocking = true;
    if (['PARTIELLEMENT_CONFORME','NON_CONFORME'].includes(String(row.implementation_status))) blocking = true;
    const proofs = Array.isArray(row.proof_results) ? row.proof_results : null;
    if (!proofs) fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + '.proof_results absent');
    const expectedProofs = expected.proof_required.slice().sort();
    const observedProofs = proofs.map((p) => String(p && p.proof_type || '')).sort();
    if (JSON.stringify(expectedProofs) !== JSON.stringify(observedProofs)) {
      fail('UI_IMPLEMENTATION_REVIEW_PROOF_COVERAGE_INCOMPLETE', id);
    }
    for (const proof of proofs) {
      const type = String(proof.proof_type);
      const status = String(proof.status);
      if (!PROOF_STATUSES.has(status)) fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + ':' + type + ':' + status);
      if (DEVICE_PROOFS.has(type)) {
        if (status !== 'PENDING_DEVICE' && status !== 'FAIL') fail('UI_IMPLEMENTATION_REVIEW_DEVICE_PROOF_UNSUPPORTED', id + ':' + type + ' doit rester PENDING_DEVICE sauf defaut demontre');
        if (status === 'FAIL') blocking = true;
      } else if (type === 'ACCESSIBILITY_CHECK') {
        if (!['PASS','PENDING_DEVICE','FAIL'].includes(status)) {
          fail('UI_IMPLEMENTATION_REVIEW_ACCESSIBILITY_PROOF_UNSUPPORTED', id + ':' + type + ':' + status);
        }
        if (status === 'FAIL') blocking = true;
      } else if (BLOCKING_PROOFS.has(type)) {
        if (status !== 'PASS') blocking = true;
      }
      if (status === 'FAIL') blocking = true;
      if (typeof proof.evidence !== 'string' || !proof.evidence.trim()) {
        fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + ':' + type + ': evidence absente');
      }
    }
    if (String(row.implementation_status) === 'NON_VERIFIABLE') {
      const deviceOnlyGap = proofs.length > 0 && proofs.every((proof) =>
        String(proof.status) === 'PASS' ||
        (DEFERABLE_PROOFS.has(String(proof.proof_type)) && String(proof.status) === 'PENDING_DEVICE'));
      if (!deviceOnlyGap) blocking = true;
    }
    if (typeof row.evidence !== 'string' || !row.evidence.trim()) {
      fail('UI_IMPLEMENTATION_REVIEW_OUTPUT_INVALID', id + ': evidence absente');
    }
  }
  const boundaries = Array.isArray(review.boundary_results) ? review.boundary_results : null;
  if (!boundaries) fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_INVALID', 'boundary_results absent');
  const expectedBoundaries = input.boundary_requirements.map((x) => x.category + ':' + x.target).sort();
  const observedBoundaries = boundaries.map((x) => String(x && x.category || '') + ':' + String(x && x.target || '')).sort();
  if (JSON.stringify(expectedBoundaries) !== JSON.stringify(observedBoundaries)) {
    fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_COVERAGE_INCOMPLETE', 'PRESERVE/FORBIDDEN incomplet');
  }
  for (const row of boundaries) {
    if (!['PRESERVE','FORBIDDEN'].includes(String(row.category))) {
      fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_INVALID', 'categorie inconnue');
    }
    if (!PRESERVE_STATUSES.has(String(row.status))) {
      fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_INVALID', String(row.category) + ':' + String(row.target));
    }
    if (String(row.status) !== 'PASS') blocking = true;
    if (typeof row.evidence !== 'string' || !row.evidence.trim()) {
      fail('UI_IMPLEMENTATION_REVIEW_BOUNDARY_INVALID', 'evidence absente');
    }
  }

  // A non-UI plan has no machine-defined functional criterion IDs. Its prose
  // requirements must be assessed independently, never replaced by report IDs.
  if (!input.ui_applicable) {
    const assessment = review.non_ui_plan_assessment;
    const statuses = new Set(['CONFORME','NON_CONFORME','NON_VERIFIABLE']);
    const text = value => typeof value === 'string' && value.trim();
    if (!assessment || !statuses.has(assessment.status) || !text(assessment.evidence) ||
        !Array.isArray(assessment.requirements) || !assessment.requirements.length) {
      fail('NON_UI_PLAN_ASSESSMENT_REQUIRED', 'revue motivee du plan complet requise');
    }
    const requirements = new Set();
    for (const row of assessment.requirements) {
      if (!row || !text(row.plan_requirement) || requirements.has(row.plan_requirement) ||
          !statuses.has(row.status) || !text(row.evidence)) {
        fail('NON_UI_PLAN_ASSESSMENT_INVALID', 'exigence, statut ou preuve absent/duplique');
      }
      requirements.add(row.plan_requirement);
      if (row.status !== 'CONFORME') blocking = true;
    }
    if (assessment.status !== 'CONFORME') blocking = true;
  }

  // F12: completeness is mechanically observable; semantic truth remains the
  // independent reviewer's job. Use its existing NON_VERIFIABLE/REVISE states.
  if (input.implementation_report && input.implementation_report.status !== 'COMPLETE') {
    const affected = results.filter((row) => (byId.get(String(row.criterion_id)).review_scope || 'AFFECTED') === 'AFFECTED');
    if (affected.some(row => row.implementation_status !== 'NON_VERIFIABLE')) {
      fail('UI_IMPLEMENTATION_REPORT_UNVERIFIABLE', input.implementation_report.errors.join('; '));
    }
    blocking = true;
  }
  const verdict = String(review.verdict || '');
  if (!['APPROVE','REVISE'].includes(verdict)) fail('UI_IMPLEMENTATION_REVIEW_VERDICT_INVALID', verdict);
  if (blocking && verdict !== 'REVISE') fail('UI_IMPLEMENTATION_REVIEW_VERDICT_INCONSISTENT', 'blocking => REVISE');
  if (!blocking && verdict !== 'APPROVE') fail('UI_IMPLEMENTATION_REVIEW_VERDICT_INCONSISTENT', 'non-blocking => APPROVE');
  return review;
}

try {
  const args = process.argv.slice(2);
  const mode = args[0], planFile = args[1], changedFile = args[2], third = args[3];
  if (!['prepare','validate'].includes(mode) || !planFile || !changedFile || !third) {
    throw new Error('USAGE: verify-ui-implementation-review.js <prepare|validate> <plan.md> <changed-files.txt> <review.json|output.json> [output.json|implementation.md] [implementation.md|previous-review.md] [previous-review.md]');
  }
  const planBody = fs.readFileSync(path.resolve(planFile), 'utf8');
  const changedFiles = fs.readFileSync(path.resolve(changedFile), 'utf8').split(/\r?\n/).map((x)=>x.trim()).filter(Boolean);
  const outputFile = mode === 'validate' ? args[4] : null;
  const evidenceFile = mode === 'prepare' ? args[4] : args[5];
  const previousFile = mode === 'prepare' ? args[5] : args[6];
  const input = buildInput(planBody, changedFiles, readPreviousReview(previousFile));
  if (evidenceFile) input.implementation_report = inspectImplementation(
    fs.readFileSync(path.resolve(evidenceFile),'utf8'), input.ui_applicable ? input.criteria.map(c=>c.criterion_id) : undefined);
  if (mode === 'prepare') {
    fs.writeFileSync(path.resolve(third), JSON.stringify(input, null, 2) + '\n', 'utf8');
    process.stdout.write('[KODJO_V2] UI implementation review input prepared — criteria=' + input.criterion_count + ' device=' + input.device_gate_required + ' mode=' + input.review_mode + '\n');
  } else {
    if (!outputFile) throw new Error('validate requiert output.json');
    const review = readJson(third);
    validateReview(input, review);
    fs.writeFileSync(path.resolve(outputFile), JSON.stringify(review, null, 2) + '\n', 'utf8');
    process.stdout.write('[KODJO_V2] UI implementation review verified — verdict=' + review.verdict + ' device=' + review.device_gate_required + ' mode=' + input.review_mode + '\n');
  }
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
