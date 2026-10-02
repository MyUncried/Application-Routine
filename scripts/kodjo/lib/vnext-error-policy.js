'use strict';

const CATEGORIES = Object.freeze([
  'PREVENTABLE_BY_DETERMINISM',
  'RESIDUAL_AUTOCORRECTABLE',
  'HUMAN_DECISION_REQUIRED',
]);

const PREVENTABLE = new Set([
  'VNEXT_CONTRACT_KEYS_INVALID',
  'VNEXT_CONTRACT_HASH_MISMATCH',
  'VNEXT_SOURCE_MANIFEST_HASH_MISMATCH',
  'VNEXT_PLANNING_ENVELOPE_HASH_MISMATCH',
  'PLAN_SCAN_PATH_INVALID',
  'PLAN_SCAN_PATH_AMBIGUOUS',
  'INITIAL_PLAN_DECISION_CARDINALITY',
  'PLAN_GENERATION_DECISION_MISSING',
  'UI_PLAN_COVERAGE_INCOMPLETE',
  'TEST_CONTRACT_CONSISTENCY',
  'PLAN_SCOPE_CONTRADICTION',
]);

const HUMAN = new Set([
  'CLARIFICATION_REQUIRED',
  'PRODUCT_AMBIGUITY',
  'CHANGE_REQUEST_REQUIRED',
  'SCOPE_EXPANSION_REQUIRED',
  'NATIVE_PRIMITIVE_EXCEPTION_REQUIRED',
]);

const RESIDUAL = new Set([
  'REVISION_PATCH_REJECTED',
  'IMPLEMENTED_WITH_FAILED_CHECKS',
  'ARTIFACT_STORAGE_QUOTA',
  'USAGE_LIMIT',
]);

function classify(input = {}) {
  const diagnostic = String(input.diagnostic || input.status || '');
  if (PREVENTABLE.has(diagnostic) || diagnostic.startsWith('VNEXT_')) {
    return Object.freeze({ category: 'PREVENTABLE_BY_DETERMINISM', auto_retry: false, action: 'FIX_PROTOCOL_CAUSE' });
  }
  if (HUMAN.has(diagnostic)) {
    return Object.freeze({ category: 'HUMAN_DECISION_REQUIRED', auto_retry: false, action: 'WAIT_FOR_DECISION' });
  }
  if (RESIDUAL.has(diagnostic) || /ARTIFACT_STORAGE|QUOTA|USAGE_LIMIT/.test(diagnostic)) {
    return Object.freeze({ category: 'RESIDUAL_AUTOCORRECTABLE', auto_retry: false, action: 'BOUNDED_RECOVERY_OR_WAIT' });
  }
  return Object.freeze({ category: 'HUMAN_DECISION_REQUIRED', auto_retry: false, action: 'DIAGNOSE_UNKNOWN' });
}

module.exports = { CATEGORIES, PREVENTABLE, HUMAN, RESIDUAL, classify };
