#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { canonicalJson, extractTaggedJson, normalizeRepoPath, sha256, fail } = require('./lib/plan-impact');

const { validateMatrix, isUiPath, MATRIX_SCHEMA_V2 } = require('./lib/ui-criteria-contract');
const CONTRACT_SCHEMA = 'kodjo.ui-plan-contract.v1';
const CONTRACT_VERSION_V1 = 1;
const CONTRACT_VERSION_V2 = 2;

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
  const normalizedMatrix = validateMatrix(matrix, {scope, uiPaths, requireAssertions: mode === 'produce'});
  const normalizedCriteria = normalizedMatrix.criteria;
  const matrixSha256 = sha256(normalizedMatrix);
  const assertionIds = normalizedCriteria.flatMap((criterion) => Array.isArray(criterion.assertions) ? criterion.assertions.map((a) => a.assertion_id) : []).sort();
  const assertionMode = normalizedMatrix.schema === MATRIX_SCHEMA_V2;
  const contractVersion = assertionMode ? CONTRACT_VERSION_V2 : CONTRACT_VERSION_V1;

  const hasEmbeddedContract = /<KODJO_UI_PLAN_CONTRACT_JSON>[\s\S]*?<\/KODJO_UI_PLAN_CONTRACT_JSON>/.test(markdown);
  const consume = mode === 'consume' || hasEmbeddedContract;
  if (consume) {
    let embedded;
    try {
      embedded = extractTaggedJson(markdown, 'KODJO_UI_PLAN_CONTRACT_JSON', 'UI_PLAN_PROTOCOL_STALE');
    } catch {
      fail('UI_PLAN_PROTOCOL_STALE', 'plan sans KODJO_UI_PLAN_CONTRACT_JSON versionne');
    }
    if (embedded.schema !== CONTRACT_SCHEMA || Number(embedded.contract_version) < contractVersion) {
      fail('UI_PLAN_PROTOCOL_STALE', 'contrat UI ancien ou inconnu');
    }
    validateProtocolCommit(embedded.protocol_commit);
    if (embedded.scan_revision !== impact.scan_revision ||
        embedded.matrix_sha256 !== matrixSha256 ||
        Boolean(embedded.ui_applicable) !== uiApplicable ||
        canonicalJson(embedded.ui_paths || []) !== canonicalJson(uiPaths) ||
        Number(embedded.criterion_count) !== normalizedCriteria.length ||
        (assertionMode && (Number(embedded.assertion_count) !== assertionIds.length || embedded.assertion_ids_sha256 !== sha256(assertionIds)))) {
      fail('UI_PLAN_CONTRACT_DRIFT', 'contrat UI embarque != contrat recalcule');
    }
  }

  const contract = {
    schema: CONTRACT_SCHEMA,
    contract_version: contractVersion,
    protocol_commit: protocolCommit,
    scan_revision: impact.scan_revision,
    ui_applicable: uiApplicable,
    ui_paths: uiPaths,
    criterion_count: normalizedCriteria.length,
    ...(assertionMode ? { assertion_count: assertionIds.length, assertion_ids_sha256: sha256(assertionIds) } : {}),
    matrix_sha256: matrixSha256,
  };
  fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(contract, null, 2) + '\n', 'utf8');
  process.stdout.write('[KODJO_V2] UI plan criteria verified — mode=' + (consume ? 'consume' : 'produce') + ' applicable=' + uiApplicable + ' criteria=' + normalizedCriteria.length + ' assertions=' + assertionIds.length + '\n');
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
