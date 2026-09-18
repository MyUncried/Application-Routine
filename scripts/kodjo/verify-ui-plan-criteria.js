#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { canonicalJson, extractTaggedJson, normalizeRepoPath, sha256, fail } = require('./lib/plan-impact');

const MATRIX_SCHEMA = 'kodjo.ui-criteria.v1';
const CONTRACT_SCHEMA = 'kodjo.ui-plan-contract.v1';
const CONTRACT_VERSION = 1;
const RISK_TYPES = new Set(['FUNCTIONAL','VISUAL','ACCESSIBILITY','DEVICE']);
const PROOF_TYPES = new Set(['FUNCTIONAL_TEST','STATIC_ANALYSIS','VISUAL_COMPARE','ACCESSIBILITY_CHECK','DEVICE_CHECK']);
const COMPONENT_DECISIONS = new Set(['REUSE','EXTEND','CREATE']);
const TEST_PATH = /(?:^|\/)(__tests__|tests?)\/|\.(?:test|spec)\.[^.]+$/;

function isUiPath(value) {
  return /^(?:app\/|src\/features\/|src\/shared\/ui\/|src\/shared\/i18n\/|assets\/icons\/)/.test(value) && !TEST_PATH.test(value);
}
function requireText(value, code, label) {
  if (typeof value !== 'string' || value.trim().length === 0) fail(code, label + ' absent');
  return value.trim();
}
function requireArray(value, code, label) {
  if (!Array.isArray(value)) fail(code, label + ' doit etre un tableau');
  return value;
}
function uniqueStrings(values, code, label) {
  const out = values.map((value) => requireText(value, code, label));
  if (new Set(out).size !== out.length) fail(code, label + ' contient un doublon');
  return out;
}
function validateProtocolCommit(value) {
  if (!/^[0-9a-f]{40}$/i.test(String(value || ''))) fail('UI_PLAN_PROTOCOL_PROVENANCE_MISSING', 'protocol_commit absent ou invalide');
  return String(value).toLowerCase();
}

try {
  const [planFile, revision, gitCwd, outputFile, mode = 'produce', protocolCommitArg] = process.argv.slice(2);
  if (!planFile || !revision || !gitCwd || !outputFile) {
    throw new Error('USAGE: verify-ui-plan-criteria.js <plan.md> <revision> <git_cwd> <output.json> [produce|consume] [protocol_commit]');
  }
  if (!['produce','consume'].includes(mode)) fail('UI_PLAN_CONTRACT_MODE_INVALID', 'mode attendu: produce ou consume');
  if (!/^[0-9a-f]{40}$/i.test(String(revision))) fail('PLAN_SCAN_STALE', 'revision Git invalide: ' + revision);
  const protocolCommit = validateProtocolCommit(protocolCommitArg || process.env.KODJO_PROTOCOL_COMMIT || process.env.GITHUB_SHA);

  const markdown = fs.readFileSync(planFile, 'utf8');
  const impact = extractTaggedJson(markdown, 'KODJO_PLAN_IMPACT_JSON');
  const scope = new Set((impact.scope_allow || []).map((p) => normalizeRepoPath(p, 'scope_allow')));
  const modified = Array.isArray(impact.modified_modules) ? impact.modified_modules : [];
  const rows = Array.isArray(impact.rows) ? impact.rows : [];
  const uiPaths = [...new Set([
    ...modified.map((entry) => normalizeRepoPath(entry.path, 'modified_module')),
    ...rows.filter((row) => row && row.classification === 'MODIFY').map((row) => normalizeRepoPath(row.path, 'matrix.row.path')),
  ].filter(isUiPath))].sort();
  const uiApplicable = uiPaths.length > 0;

  const matrix = extractTaggedJson(markdown, 'KODJO_UI_CRITERIA_MATRIX_JSON', 'UI_PLAN_CRITERIA_MISSING');
  if (!matrix || matrix.schema !== MATRIX_SCHEMA) fail('UI_PLAN_CRITERIA_INVALID', 'schema attendu ' + MATRIX_SCHEMA);

  const criteria = requireArray(matrix.criteria, 'UI_PLAN_CRITERIA_INVALID', 'criteria');
  const preservation = matrix.preservation;
  if (!preservation || typeof preservation !== 'object' || Array.isArray(preservation)) {
    fail('UI_PLAN_PRESERVATION_INVALID', 'preservation absent');
  }
  for (const key of ['preserve','change','forbidden']) requireArray(preservation[key], 'UI_PLAN_PRESERVATION_INVALID', 'preservation.' + key);

  if (uiApplicable && criteria.length === 0) fail('UI_PLAN_CRITERIA_MISSING', 'des modules UI sont modifies mais aucun critere atomique n est fourni');
  if (!uiApplicable && criteria.length > 0) fail('UI_PLAN_CRITERIA_INVALID', 'criteres UI fournis sans module UI modifie');
  if (uiApplicable && preservation.change.length === 0) fail('UI_PLAN_PRESERVATION_INVALID', 'preservation.change vide pour une tranche UI');

  const criterionIds = new Set();
  const coveredTargets = new Set();
  const normalizedCriteria = criteria.map((criterion, index) => {
    if (!criterion || typeof criterion !== 'object' || Array.isArray(criterion)) fail('UI_PLAN_CRITERIA_INVALID', 'criterion[' + index + '] invalide');
    const id = requireText(criterion.criterion_id, 'UI_PLAN_CRITERIA_INVALID', 'criterion_id');
    if (!/^[A-Z0-9][A-Z0-9._-]{2,63}$/.test(id)) fail('UI_PLAN_CRITERIA_INVALID', 'criterion_id invalide: ' + id);
    if (criterionIds.has(id)) fail('UI_PLAN_CRITERIA_INVALID', 'criterion_id duplique: ' + id);
    criterionIds.add(id);

    const source = criterion.source;
    if (!source || typeof source !== 'object' || Array.isArray(source)) fail('UI_PLAN_SOURCE_INVALID', id + ': source absent');
    const sourcePath = normalizeRepoPath(requireText(source.path, 'UI_PLAN_SOURCE_INVALID', id + '.source.path'), id + '.source.path');
    const sourceLocator = requireText(source.locator, 'UI_PLAN_SOURCE_INVALID', id + '.source.locator');
    const requirement = requireText(source.requirement, 'UI_PLAN_SOURCE_INVALID', id + '.source.requirement');

    const riskTypes = uniqueStrings(requireArray(criterion.risk_types, 'UI_PLAN_PROOF_INVALID', id + '.risk_types'), 'UI_PLAN_PROOF_INVALID', id + '.risk_types');
    if (riskTypes.length === 0 || riskTypes.some((risk) => !RISK_TYPES.has(risk))) fail('UI_PLAN_PROOF_INVALID', id + ': risk_types invalides');

    const reuseSearch = uniqueStrings(requireArray(criterion.reuse_search, 'UI_PLAN_REUSE_INVALID', id + '.reuse_search'), 'UI_PLAN_REUSE_INVALID', id + '.reuse_search');
    if (reuseSearch.length === 0) fail('UI_PLAN_REUSE_INVALID', id + ': reuse_search vide');
    const decision = requireText(criterion.component_decision, 'UI_PLAN_REUSE_INVALID', id + '.component_decision');
    if (!COMPONENT_DECISIONS.has(decision)) fail('UI_PLAN_REUSE_INVALID', id + ': component_decision inconnu');
    const selectedComponent = requireText(criterion.selected_component, 'UI_PLAN_REUSE_INVALID', id + '.selected_component');
    const decisionJustification = requireText(criterion.decision_justification, 'UI_PLAN_REUSE_INVALID', id + '.decision_justification');
    if ((decision === 'REUSE' || decision === 'EXTEND') && selectedComponent === 'NONE') fail('UI_PLAN_REUSE_INVALID', id + ': composant requis pour ' + decision);

    const changeTargets = uniqueStrings(requireArray(criterion.change_targets, 'UI_PLAN_TARGET_INVALID', id + '.change_targets'), 'UI_PLAN_TARGET_INVALID', id + '.change_targets')
      .map((target) => normalizeRepoPath(target, id + '.change_target'));
    if (changeTargets.length === 0) fail('UI_PLAN_TARGET_INVALID', id + ': change_targets vide');
    for (const target of changeTargets) {
      if (!scope.has(target)) fail('UI_PLAN_TARGET_INVALID', id + ': cible hors scope_allow: ' + target);
      coveredTargets.add(target);
    }

    const tests = uniqueStrings(requireArray(criterion.tests, 'UI_PLAN_TEST_INVALID', id + '.tests'), 'UI_PLAN_TEST_INVALID', id + '.tests')
      .map((testPath) => normalizeRepoPath(testPath, id + '.test'));
    if (riskTypes.includes('FUNCTIONAL') && tests.length === 0) fail('UI_PLAN_TEST_INVALID', id + ': risque FUNCTIONAL sans test');

    const proofRequired = uniqueStrings(requireArray(criterion.proof_required, 'UI_PLAN_PROOF_INVALID', id + '.proof_required'), 'UI_PLAN_PROOF_INVALID', id + '.proof_required');
    if (proofRequired.length === 0 || proofRequired.some((proof) => !PROOF_TYPES.has(proof))) fail('UI_PLAN_PROOF_INVALID', id + ': proof_required invalide');
    if (riskTypes.includes('VISUAL') && !proofRequired.includes('VISUAL_COMPARE')) fail('UI_PLAN_PROOF_INVALID', id + ': VISUAL exige VISUAL_COMPARE');
    if (riskTypes.includes('ACCESSIBILITY') && !proofRequired.includes('ACCESSIBILITY_CHECK')) fail('UI_PLAN_PROOF_INVALID', id + ': ACCESSIBILITY exige ACCESSIBILITY_CHECK');
    if (riskTypes.includes('DEVICE') && !proofRequired.includes('DEVICE_CHECK')) fail('UI_PLAN_PROOF_INVALID', id + ': DEVICE exige DEVICE_CHECK');
    if (riskTypes.includes('FUNCTIONAL') && !proofRequired.some((proof) => proof === 'FUNCTIONAL_TEST' || proof === 'STATIC_ANALYSIS')) {
      fail('UI_PLAN_PROOF_INVALID', id + ': FUNCTIONAL exige FUNCTIONAL_TEST ou STATIC_ANALYSIS');
    }

    return {
      criterion_id: id,
      source: { path: sourcePath, locator: sourceLocator, requirement },
      risk_types: [...riskTypes].sort(),
      reuse_search: [...reuseSearch].sort(),
      component_decision: decision,
      selected_component: selectedComponent,
      decision_justification: decisionJustification,
      change_targets: [...changeTargets].sort(),
      tests: [...tests].sort(),
      proof_required: [...proofRequired].sort(),
    };
  }).sort((a,b) => a.criterion_id.localeCompare(b.criterion_id));

  for (const uiPath of uiPaths) {
    if (!coveredTargets.has(uiPath)) fail('UI_PLAN_COVERAGE_INCOMPLETE', 'module UI sans critere: ' + uiPath);
  }

  const normalizedPreservation = {};
  for (const key of ['preserve','change','forbidden']) {
    const seen = new Set();
    normalizedPreservation[key] = preservation[key].map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail('UI_PLAN_PRESERVATION_INVALID', key + '[' + index + '] invalide');
      const target = requireText(entry.target, 'UI_PLAN_PRESERVATION_INVALID', key + '.target');
      const justification = requireText(entry.justification, 'UI_PLAN_PRESERVATION_INVALID', key + '.justification');
      if (seen.has(target)) fail('UI_PLAN_PRESERVATION_INVALID', key + ' cible dupliquee: ' + target);
      seen.add(target);
      return { target, justification };
    }).sort((a,b) => a.target.localeCompare(b.target));
  }

  const normalizedMatrix = { schema: MATRIX_SCHEMA, criteria: normalizedCriteria, preservation: normalizedPreservation };
  const matrixSha256 = sha256(normalizedMatrix);

  const hasEmbeddedContract = /<KODJO_UI_PLAN_CONTRACT_JSON>[\s\S]*?<\/KODJO_UI_PLAN_CONTRACT_JSON>/.test(markdown);
  const consume = mode === 'consume' || hasEmbeddedContract;
  if (consume) {
    let embedded;
    try {
      embedded = extractTaggedJson(markdown, 'KODJO_UI_PLAN_CONTRACT_JSON', 'UI_PLAN_PROTOCOL_STALE');
    } catch {
      fail('UI_PLAN_PROTOCOL_STALE', 'plan sans KODJO_UI_PLAN_CONTRACT_JSON versionne');
    }
    if (embedded.schema !== CONTRACT_SCHEMA || Number(embedded.contract_version) < CONTRACT_VERSION) {
      fail('UI_PLAN_PROTOCOL_STALE', 'contrat UI ancien ou inconnu');
    }
    validateProtocolCommit(embedded.protocol_commit);
    if (embedded.scan_revision !== impact.scan_revision ||
        embedded.matrix_sha256 !== matrixSha256 ||
        Boolean(embedded.ui_applicable) !== uiApplicable ||
        canonicalJson(embedded.ui_paths || []) !== canonicalJson(uiPaths) ||
        Number(embedded.criterion_count) !== normalizedCriteria.length) {
      fail('UI_PLAN_CONTRACT_DRIFT', 'contrat UI embarque != contrat recalcule');
    }
  }

  const contract = {
    schema: CONTRACT_SCHEMA,
    contract_version: CONTRACT_VERSION,
    protocol_commit: protocolCommit,
    scan_revision: impact.scan_revision,
    ui_applicable: uiApplicable,
    ui_paths: uiPaths,
    criterion_count: normalizedCriteria.length,
    matrix_sha256: matrixSha256,
  };
  fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(contract, null, 2) + '\n', 'utf8');
  process.stdout.write('[KODJO_V2] UI plan criteria verified — mode=' + (consume ? 'consume' : 'produce') + ' applicable=' + uiApplicable + ' criteria=' + normalizedCriteria.length + '\n');
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
