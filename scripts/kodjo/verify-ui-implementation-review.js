#!/usr/bin/env node
'use strict';

const { matrixFingerprint, MATRIX_SCHEMA_V2 } = require('./lib/ui-criteria-contract');
const fs = require('node:fs');
const path = require('node:path');
const { extractTaggedJson, sha256, fail } = require('./lib/plan-impact');
const {inspectImplementation}=require('./lib/implementation-report');
const {verifyEmbedded:verifyRequirementContracts}=require('./lib/requirement-contract');

const INPUT_SCHEMA = 'kodjo.ui-implementation-review-input.v1';
const REVIEW_SCHEMA = 'kodjo.ui-implementation-review.v1';
const BLOCKING_PROOFS = new Set(['FUNCTIONAL_TEST','STATIC_ANALYSIS']);
const DEVICE_PROOFS = new Set(['VISUAL_COMPARE','DEVICE_CHECK']);
const DEFERABLE_PROOFS = new Set([...DEVICE_PROOFS,'ACCESSIBILITY_CHECK']);
const IMPLEMENTATION_STATUSES = new Set(['CONFORME','PARTIELLEMENT_CONFORME','NON_CONFORME','NON_VERIFIABLE']);
const ASSERTION_STATUSES = new Set(['CONFORME','NON_CONFORME','NON_VERIFIABLE','PENDING_DEVICE']);
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
function canonicalProofs(proofs) {
  return Array.isArray(proofs) ? proofs.map((proof) => ({
    proof_type:String(proof && proof.proof_type || ''),
    status:String(proof && proof.status || ''),
    evidence:String(proof && proof.evidence || ''),
  })).sort((a,b)=>a.proof_type.localeCompare(b.proof_type)) : [];
}
function canonicalAssertions(assertions) {
  return Array.isArray(assertions) ? assertions.map((assertion) => ({
    assertion_id:String(assertion && assertion.assertion_id || ''),
    status:String(assertion && assertion.status || ''),
    evidence:String(assertion && assertion.evidence || ''),
    proof_results:canonicalProofs(assertion && assertion.proof_results),
  })).sort((a,b)=>a.assertion_id.localeCompare(b.assertion_id)) : [];
}
function canonicalCriterionResult(row) {
  return {
    criterion_id:String(row && row.criterion_id || ''),
    implementation_status:String(row && row.implementation_status || ''),
    preserve_status:String(row && row.preserve_status || ''),
    evidence:String(row && row.evidence || ''),
    proof_results:canonicalProofs(row && row.proof_results),
    ...(Array.isArray(row && row.assertion_results) ? {assertion_results:canonicalAssertions(row.assertion_results)} : {}),
  };
}
function normalizeInheritedResult(row) {
  const normalized = canonicalCriterionResult(row);
  if (normalized.assertion_results) return normalized;
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
  if (!matrix || !['kodjo.ui-criteria.v1',MATRIX_SCHEMA_V2].includes(matrix.schema)) fail('UI_IMPLEMENTATION_REVIEW_PLAN_MATRIX_INVALID', 'schema matrice invalide');
  if (!planContract || planContract.schema !== 'kodjo.ui-plan-contract.v1') fail('UI_IMPLEMENTATION_REVIEW_PLAN_CONTRACT_INVALID', 'schema contrat invalide');
  if (planContract.matrix_sha256 !== matrixFingerprint(matrix)) fail('UI_IMPLEMENTATION_REVIEW_PLAN_DRIFT', 'matrice != contrat approuve');
  const hasRequirementContract=/<KODJO_REQUIREMENT_CONTRACT_JSON>[\s\S]*?<\/KODJO_REQUIREMENT_CONTRACT_JSON>/.test(planBody);
  const requirementContracts=hasRequirementContract?verifyRequirementContracts(planBody):null;
  const nonUiSource=requirementContracts?requirementContracts.requirement_contract.requirements.filter((row)=>row.domain==='NON_UI'):[];

  const assertionMode = matrix.schema === MATRIX_SCHEMA_V2;
  const criteria = Array.isArray(matrix.criteria) ? matrix.criteria : [];
  const criterionIds = criteria.map((c) => String(c && c.criterion_id || '')).sort();
  if (criterionIds.some((id) => !id) || new Set(criterionIds).size !== criterionIds.length) {
    fail('UI_IMPLEMENTATION_REVIEW_CRITERIA_INVALID', 'criterion_id absent ou duplique');
  }
  const assertionIds = criteria.flatMap((criterion)=>Array.isArray(criterion.assertions)?criterion.assertions.map((a)=>String(a&&a.assertion_id||'')):[]).sort();
  if (assertionMode) {
    if (assertionIds.some((id)=>!id) || new Set(assertionIds).size!==assertionIds.length) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTIONS_INVALID','assertion_id absent ou duplique');
    }
    if (Number(planContract.contract_version)<2 ||
        Number(planContract.assertion_count)!==assertionIds.length ||
        planContract.assertion_ids_sha256!==sha256(assertionIds)) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_CONTRACT_MISMATCH','assertions != contrat approuve');
    }
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
    if (assertionMode) {
      for (const criterion of criteria) {
        const prior=previousById.get(String(criterion.criterion_id));
        const expected=(criterion.assertions||[]).map(a=>String(a.assertion_id)).sort();
        const observed=(prior&&prior.assertion_results||[]).map(a=>String(a&&a.assertion_id||'')).sort();
        if (JSON.stringify(expected)!==JSON.stringify(observed)) {
          fail('UI_IMPLEMENTATION_PREVIOUS_REVIEW_ASSERTION_MISMATCH',String(criterion.criterion_id));
        }
      }
    }
  }

  let previousRequirementById=null;
  if(previousReview&&nonUiSource.length){
    const prior=previousReview.non_ui_plan_assessment&&Array.isArray(previousReview.non_ui_plan_assessment.requirements)
      ? previousReview.non_ui_plan_assessment.requirements : [];
    previousRequirementById=new Map(prior.map((row)=>[String(row&&row.requirement_id||''),row]));
    const expected=nonUiSource.map((row)=>row.requirement_id).sort();
    const observed=[...previousRequirementById.keys()].sort();
    if(observed.some((id)=>!id)||previousRequirementById.size!==prior.length||JSON.stringify(expected)!==JSON.stringify(observed)){
      fail('NON_UI_PREVIOUS_REVIEW_COVERAGE_MISMATCH','ancienne revue != requirements approuves');
    }
  }
  const normalizedRequirements=nonUiSource.map((req)=>{
    const targets=[...(req.change_targets||[])].map(String).sort();
    const tests=[...(req.tests||[])].map(String).sort();
    const affectedPaths=[...new Set([...targets,...tests].filter((p)=>changedSet.has(p)))].sort();
    const reviewScope=previousRequirementById&&affectedPaths.length===0?'INHERITED':'AFFECTED';
    const row={...req,review_scope:reviewScope,affected_paths:affectedPaths};
    if(reviewScope==='INHERITED')row.inherited_result=previousRequirementById.get(req.requirement_id);
    return row;
  }).sort((a,b)=>a.requirement_id.localeCompare(b.requirement_id));
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
    const assertions = assertionMode ? (criterion.assertions||[]).map((assertion)=>({
      assertion_id:String(assertion.assertion_id),
      source:assertion.source,
      property_type:String(assertion.property_type),
      expected:String(assertion.expected),
      proof_required:unique(assertion.proof_required||[],'UI_IMPLEMENTATION_REVIEW_ASSERTION_PROOF_INVALID',String(assertion.assertion_id)+'.proof_required').sort(),
      device_proof_required:(assertion.proof_required||[]).some((p)=>DEFERABLE_PROOFS.has(String(p))),
    })).sort((a,b)=>a.assertion_id.localeCompare(b.assertion_id)) : [];
    const normalized = {
      criterion_id: id,
      source: criterion.source,
      component_decision: criterion.component_decision,
      selected_component: criterion.selected_component,
      change_targets: targets,
      tests,
      proof_required: proofs,
      ...(assertionMode ? {assertions} : {}),
      device_proof_required: assertionMode
        ? assertions.some((a)=>a.device_proof_required)
        : proofs.some((p) => DEFERABLE_PROOFS.has(p)),
      review_scope: reviewScope,
      affected_paths: affectedPaths,
    };
    if (reviewScope === 'INHERITED') normalized.inherited_result = normalizeInheritedResult(previousById.get(id));
    return normalized;
  }).sort((a,b) => a.criterion_id.localeCompare(b.criterion_id));

  const preservation = matrix.preservation || { preserve:[], change:[], forbidden:[] };
  const boundaryRequirements=requirementContracts
    ? requirementContracts.boundary_contract.boundaries.map((row)=>({
        category:row.category,target:row.target,locator:row.locator,
        machine_status:row.locator&&row.locator.kind==='PATH' ? (changedSet.has(row.locator.value)?'FAIL':'PASS') : null,
      }))
    : [
        ...(Array.isArray(preservation.preserve) ? preservation.preserve.map((x) => ({ category:'PRESERVE', target:String(x.target || ''),machine_status:null })) : []),
        ...(Array.isArray(preservation.forbidden) ? preservation.forbidden.map((x) => ({ category:'FORBIDDEN', target:String(x.target || ''),machine_status:null })) : []),
      ];
  boundaryRequirements.sort((a,b)=>(a.category+':'+a.target).localeCompare(b.category+':'+b.target));
  const deviceGateRequired = normalizedCriteria.some((c) => c.device_proof_required) ||
    normalizedRequirements.some((r)=>(r.proof_required||[]).some((p)=>DEFERABLE_PROOFS.has(String(p))));

  return {
    schema: INPUT_SCHEMA,
    review_mode: (previousById||previousRequirementById) ? 'DELTA_WITH_INHERITANCE' : 'FULL',
    assertion_mode: assertionMode,
    ui_applicable: uiApplicable,
    ui_matrix_sha256: planContract.matrix_sha256,
    criterion_count: normalizedCriteria.length,
    criterion_ids_sha256: sha256(criterionIds),
    ...(assertionMode ? {assertion_count:assertionIds.length,assertion_ids_sha256:sha256(assertionIds)} : {}),
    non_ui_requirement_count: normalizedRequirements.length,
    non_ui_requirements: normalizedRequirements,
    changed_files: changed,
    criteria: normalizedCriteria,
    preservation,
    boundary_requirements: boundaryRequirements,
    device_gate_required: deviceGateRequired,
  };
}
function validateProof(id, proof) {
  const type=String(proof&&proof.proof_type||'');
  const status=String(proof&&proof.status||'');
  if (!PROOF_STATUSES.has(status)) fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + ':' + type + ':' + status);
  if (DEVICE_PROOFS.has(type)) {
    if (status !== 'PENDING_DEVICE' && status !== 'FAIL') {
      fail('UI_IMPLEMENTATION_REVIEW_DEVICE_PROOF_UNSUPPORTED', id + ':' + type + ' doit rester PENDING_DEVICE sauf defaut demontre');
    }
  } else if (type === 'ACCESSIBILITY_CHECK') {
    if (!['PASS','PENDING_DEVICE','FAIL'].includes(status)) {
      fail('UI_IMPLEMENTATION_REVIEW_ACCESSIBILITY_PROOF_UNSUPPORTED', id + ':' + type + ':' + status);
    }
  } else if (BLOCKING_PROOFS.has(type)) {
    if (!['PASS','FAIL','NON_VERIFIABLE'].includes(status)) {
      fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + ':' + type + ':' + status);
    }
  }
  if (typeof proof?.evidence !== 'string' || !proof.evidence.trim()) {
    fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + ':' + type + ': evidence absente');
  }
  return {type,status};
}
function deriveAssertionStatus(assertion,proofs) {
  let pending=false;
  for(const proof of proofs){
    const {type,status}=validateProof(assertion.assertion_id,proof);
    if(status==='FAIL')return 'NON_CONFORME';
    if(BLOCKING_PROOFS.has(type)&&status!=='PASS')return 'NON_VERIFIABLE';
    if(type==='ACCESSIBILITY_CHECK'&&status==='NON_VERIFIABLE')return 'NON_VERIFIABLE';
    if(status==='PENDING_DEVICE')pending=true;
  }
  return pending?'PENDING_DEVICE':'CONFORME';
}
function aggregateProofStatus(statuses) {
  if(statuses.includes('FAIL'))return 'FAIL';
  if(statuses.includes('NON_VERIFIABLE'))return 'NON_VERIFIABLE';
  if(statuses.includes('PENDING_DEVICE'))return 'PENDING_DEVICE';
  return 'PASS';
}
function deriveCriterionFromAssertions(expected,row) {
  const observed=Array.isArray(row.assertion_results)?row.assertion_results:null;
  if(!observed)fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_RESULTS_MISSING',expected.criterion_id);
  const expectedIds=expected.assertions.map(a=>a.assertion_id).sort();
  const observedIds=observed.map(a=>String(a&&a.assertion_id||'')).sort();
  if(JSON.stringify(expectedIds)!==JSON.stringify(observedIds)) {
    fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_COVERAGE_INCOMPLETE',expected.criterion_id);
  }
  const expectedById=new Map(expected.assertions.map(a=>[a.assertion_id,a]));
  const proofStatuses=new Map();
  const assertionStatuses=[];
  for(const result of observed){
    const id=String(result.assertion_id);
    const assertion=expectedById.get(id);
    if(!ASSERTION_STATUSES.has(String(result.status))) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_STATUS_INVALID',id);
    }
    if(typeof result.evidence!=='string'||!result.evidence.trim()) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_EVIDENCE_MISSING',id);
    }
    const proofs=Array.isArray(result.proof_results)?result.proof_results:null;
    if(!proofs)fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_PROOF_INVALID',id+'.proof_results absent');
    const expectedProofs=[...assertion.proof_required].sort();
    const observedProofs=proofs.map(p=>String(p&&p.proof_type||'')).sort();
    if(JSON.stringify(expectedProofs)!==JSON.stringify(observedProofs)) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_PROOF_COVERAGE_INCOMPLETE',id);
    }
    const derived=deriveAssertionStatus(assertion,proofs);
    if(String(result.status)!==derived) {
      fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_STATUS_DERIVATION_MISMATCH',id+': attendu '+derived);
    }
    assertionStatuses.push(derived);
    for(const proof of proofs){
      const type=String(proof.proof_type), status=String(proof.status);
      if(!proofStatuses.has(type))proofStatuses.set(type,[]);
      proofStatuses.get(type).push(status);
    }
  }
  let criterionStatus='CONFORME';
  if(assertionStatuses.includes('NON_CONFORME'))criterionStatus='NON_CONFORME';
  else if(assertionStatuses.includes('NON_VERIFIABLE')||assertionStatuses.includes('PENDING_DEVICE'))criterionStatus='NON_VERIFIABLE';
  if(String(row.implementation_status)!==criterionStatus) {
    fail('UI_IMPLEMENTATION_REVIEW_CRITERION_DERIVATION_MISMATCH',expected.criterion_id+': attendu '+criterionStatus);
  }
  const criterionProofs=Array.isArray(row.proof_results)?row.proof_results:null;
  if(!criterionProofs)fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID',expected.criterion_id+'.proof_results absent');
  const expectedCriterionProofs=[...expected.proof_required].sort();
  const observedCriterionProofs=criterionProofs.map(p=>String(p&&p.proof_type||'')).sort();
  if(JSON.stringify(expectedCriterionProofs)!==JSON.stringify(observedCriterionProofs)) {
    fail('UI_IMPLEMENTATION_REVIEW_PROOF_COVERAGE_INCOMPLETE',expected.criterion_id);
  }
  for(const proof of criterionProofs){
    validateProof(expected.criterion_id,proof);
    const statuses=proofStatuses.get(String(proof.proof_type))||[];
    if(!statuses.length)fail('UI_IMPLEMENTATION_REVIEW_ASSERTION_PROOF_COVERAGE_INCOMPLETE',expected.criterion_id+':'+proof.proof_type);
    const aggregate=aggregateProofStatus(statuses);
    if(String(proof.status)!==aggregate) {
      fail('UI_IMPLEMENTATION_REVIEW_PROOF_DERIVATION_MISMATCH',expected.criterion_id+':'+proof.proof_type+': attendu '+aggregate);
    }
  }
  const pendingOnly=assertionStatuses.every(s=>s==='CONFORME'||s==='PENDING_DEVICE')&&assertionStatuses.includes('PENDING_DEVICE');
  return {criterionStatus,pendingOnly,assertionStatuses};
}

function machineProofStatus(input,type){
  const checks=input&&input.implementation_report&&input.implementation_report.machine_evidence&&Array.isArray(input.implementation_report.machine_evidence.checks)
    ? input.implementation_report.machine_evidence.checks : [];
  const by=new Map(checks.map((row)=>[String(row&&row.check||''),String(row&&row.status||'')]));
  if(type==='FUNCTIONAL_TEST'){
    const status=by.get('jest');
    return status==='PASS'?'PASS':status==='FAIL'?'FAIL':status?'NON_VERIFIABLE':null;
  }
  if(type==='STATIC_ANALYSIS'){
    const observed=['typescript','lint'].map((name)=>by.get(name)).filter(Boolean);
    if(!observed.length)return null;
    if(observed.includes('FAIL'))return 'FAIL';
    if(observed.every((status)=>status==='PASS'))return 'PASS';
    return 'NON_VERIFIABLE';
  }
  return null;
}
function enforceMachineProof(input,id,type,status){
  if(!BLOCKING_PROOFS.has(type))return;
  const expected=machineProofStatus(input,type);
  if(expected&&status!==expected)fail('UI_IMPLEMENTATION_MACHINE_PROOF_MISMATCH',id+':'+type+': attendu '+expected+' observe '+status);
}
function validateReview(input, review) {
  if (!review || review.schema !== REVIEW_SCHEMA) fail('UI_IMPLEMENTATION_REVIEW_OUTPUT_INVALID', 'schema review invalide');
  review.device_gate_required = Boolean(input.device_gate_required);
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

    if (input.assertion_mode) {
      const derived=deriveCriterionFromAssertions(expected,row);
      if(['NON_CONFORME','NON_VERIFIABLE'].includes(derived.criterionStatus)&&!derived.pendingOnly)blocking=true;
    } else {
      if (['PARTIELLEMENT_CONFORME','NON_CONFORME'].includes(String(row.implementation_status))) blocking = true;
      const proofs = Array.isArray(row.proof_results) ? row.proof_results : null;
      if (!proofs) fail('UI_IMPLEMENTATION_REVIEW_PROOF_INVALID', id + '.proof_results absent');
      const expectedProofs = expected.proof_required.slice().sort();
      const observedProofs = proofs.map((p) => String(p && p.proof_type || '')).sort();
      if (JSON.stringify(expectedProofs) !== JSON.stringify(observedProofs)) {
        fail('UI_IMPLEMENTATION_REVIEW_PROOF_COVERAGE_INCOMPLETE', id);
      }
      for (const proof of proofs) {
        const {type,status}=validateProof(id,proof);
        if (DEVICE_PROOFS.has(type)&&status==='FAIL') blocking=true;
        else if(type==='ACCESSIBILITY_CHECK'&&status==='FAIL')blocking=true;
        else if(BLOCKING_PROOFS.has(type)&&status!=='PASS')blocking=true;
        if(status==='FAIL')blocking=true;
      }
      if (String(row.implementation_status) === 'NON_VERIFIABLE') {
        const deviceOnlyGap = proofs.length > 0 && proofs.every((proof) =>
          String(proof.status) === 'PASS' ||
          (DEFERABLE_PROOFS.has(String(proof.proof_type)) && String(proof.status) === 'PENDING_DEVICE'));
        if (!deviceOnlyGap) blocking = true;
      }
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
    fs.readFileSync(path.resolve(evidenceFile),'utf8'), input.ui_applicable ? input.criteria : undefined);
  if (mode === 'prepare') {
    fs.writeFileSync(path.resolve(third), JSON.stringify(input, null, 2) + '\n', 'utf8');
    process.stdout.write('[KODJO_V2] UI implementation review input prepared — criteria=' + input.criterion_count + ' assertions=' + (input.assertion_count||0) + ' device=' + input.device_gate_required + ' mode=' + input.review_mode + '\n');
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
