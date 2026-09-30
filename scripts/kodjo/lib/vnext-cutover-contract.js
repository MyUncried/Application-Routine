'use strict';

const V = require('./vnext-contract');

const PLAN_SCHEMA = 'kodjo.vnext.cutover-plan.v1';
const ACTIVATION_SCHEMA = 'kodjo.vnext.cutover-activation.v1';
const ROLLBACK_SCHEMA = 'kodjo.vnext.cutover-rollback.v1';

const LEGACY = 'LEGACY';
const VNEXT = 'VNEXT';
const ACTIVE = 'ACTIVE';
const CLOSED = 'CLOSED';

function validateLegacyRegistry(registry) {
  V.assertExactKeys(
    registry,
    ['schema_version', 'activations'],
    [],
    'VNEXT_CUTOVER_LEGACY_REGISTRY_KEYS_INVALID',
  );
  V.assertNonEmptyString(
    registry.schema_version,
    'VNEXT_CUTOVER_LEGACY_REGISTRY_SCHEMA_INVALID',
    'schema_version',
  );
  if (!Array.isArray(registry.activations)) {
    V.fail('VNEXT_CUTOVER_LEGACY_ACTIVATIONS_INVALID');
  }
  const ids = new Set();
  for (const row of registry.activations) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      V.fail('VNEXT_CUTOVER_LEGACY_ACTIVATION_INVALID');
    }
    V.assertSliceId(row.slice_id, 'VNEXT_CUTOVER_LEGACY_SLICE_ID_INVALID');
    if (ids.has(row.slice_id)) V.fail('VNEXT_CUTOVER_LEGACY_SLICE_DUPLICATE', row.slice_id);
    ids.add(row.slice_id);
    if (![ACTIVE, CLOSED].includes(row.status)) {
      V.fail('VNEXT_CUTOVER_LEGACY_STATUS_INVALID', row.status);
    }
  }
  return true;
}

function buildCutoverPlan({
  candidateHead,
  candidatePr,
  qualificationRunId,
  qualificationStatus,
  legacyActivationRegistry,
  protectedLegacySliceIds,
}) {
  V.assertSha40(candidateHead, 'VNEXT_CUTOVER_CANDIDATE_HEAD_INVALID', 'candidateHead');
  if (!Number.isInteger(candidatePr) || candidatePr < 1) {
    V.fail('VNEXT_CUTOVER_CANDIDATE_PR_INVALID');
  }
  if (!Number.isInteger(qualificationRunId) || qualificationRunId < 1) {
    V.fail('VNEXT_CUTOVER_QUALIFICATION_RUN_INVALID');
  }
  if (qualificationStatus !== 'QUALIFIED_ON_VNEXT_PERIMETER') {
    V.fail('VNEXT_CUTOVER_QUALIFICATION_STATUS_INVALID', qualificationStatus);
  }
  validateLegacyRegistry(legacyActivationRegistry);

  const protectedIds = V.uniqueStrings(
    protectedLegacySliceIds,
    'VNEXT_CUTOVER_PROTECTED_SLICES_INVALID',
    'protectedLegacySliceIds',
  ).sort();
  const registryById = new Map(
    legacyActivationRegistry.activations.map((row) => [row.slice_id, row]),
  );
  for (const sliceId of protectedIds) {
    if (!registryById.has(sliceId)) {
      V.fail('VNEXT_CUTOVER_PROTECTED_SLICE_UNKNOWN', sliceId);
    }
  }

  const activeLegacySlices = legacyActivationRegistry.activations
    .filter((row) => row.status === ACTIVE)
    .map((row) => row.slice_id)
    .sort();

  const blockers = protectedIds
    .filter((sliceId) => registryById.get(sliceId).status !== CLOSED)
    .sort();

  const readiness = blockers.length === 0 ? 'READY_FOR_ACTIVATION' : 'BLOCKED_BY_ACTIVE_PROTECTED_SLICE';

  return V.sealContract({
    schema_version: PLAN_SCHEMA,
    candidate_head: candidateHead,
    candidate_pr: candidatePr,
    qualification_run_id: qualificationRunId,
    qualification_status: qualificationStatus,
    legacy_registry_hash: V.canonicalHash(legacyActivationRegistry),
    protected_legacy_slice_ids: protectedIds,
    blocking_slice_ids: blockers,
    grandfathered_legacy_slice_ids: activeLegacySlices,
    routing_before_activation: {
      default_protocol: LEGACY,
      existing_legacy_slices: LEGACY,
      new_slices: LEGACY,
    },
    routing_after_activation: {
      default_protocol: VNEXT,
      existing_legacy_slices: LEGACY,
      new_slices: VNEXT,
    },
    activation_readiness: readiness,
    active_workflow_change_allowed: false,
  });
}

function validateCutoverPlan(plan) {
  V.assertExactKeys(
    plan,
    [
      'schema_version',
      'candidate_head',
      'candidate_pr',
      'qualification_run_id',
      'qualification_status',
      'legacy_registry_hash',
      'protected_legacy_slice_ids',
      'blocking_slice_ids',
      'grandfathered_legacy_slice_ids',
      'routing_before_activation',
      'routing_after_activation',
      'activation_readiness',
      'active_workflow_change_allowed',
      'contract_hash',
    ],
    [],
    'VNEXT_CUTOVER_PLAN_KEYS_INVALID',
  );
  if (plan.schema_version !== PLAN_SCHEMA) V.fail('VNEXT_CUTOVER_PLAN_SCHEMA_INVALID');
  V.verifyContractHash(plan, 'VNEXT_CUTOVER_PLAN_HASH_MISMATCH');
  V.assertSha40(plan.candidate_head, 'VNEXT_CUTOVER_CANDIDATE_HEAD_INVALID');
  V.assertSha64(plan.legacy_registry_hash, 'VNEXT_CUTOVER_LEGACY_REGISTRY_HASH_INVALID');
  if (plan.qualification_status !== 'QUALIFIED_ON_VNEXT_PERIMETER') {
    V.fail('VNEXT_CUTOVER_QUALIFICATION_STATUS_INVALID');
  }
  if (!['READY_FOR_ACTIVATION', 'BLOCKED_BY_ACTIVE_PROTECTED_SLICE'].includes(plan.activation_readiness)) {
    V.fail('VNEXT_CUTOVER_READINESS_INVALID');
  }
  if (plan.active_workflow_change_allowed !== false) {
    V.fail('VNEXT_CUTOVER_PREPARATION_MUST_NOT_ACTIVATE');
  }
  if (plan.routing_before_activation.default_protocol !== LEGACY
      || plan.routing_before_activation.existing_legacy_slices !== LEGACY
      || plan.routing_before_activation.new_slices !== LEGACY) {
    V.fail('VNEXT_CUTOVER_PRE_ACTIVATION_ROUTING_INVALID');
  }
  if (plan.routing_after_activation.default_protocol !== VNEXT
      || plan.routing_after_activation.existing_legacy_slices !== LEGACY
      || plan.routing_after_activation.new_slices !== VNEXT) {
    V.fail('VNEXT_CUTOVER_POST_ACTIVATION_ROUTING_INVALID');
  }
  return true;
}

function buildActivationRecord({
  cutoverPlan,
  currentLegacyActivationRegistry,
  approvalEvidence,
  activatedAtProtocolHead,
}) {
  validateCutoverPlan(cutoverPlan);
  validateLegacyRegistry(currentLegacyActivationRegistry);
  if (cutoverPlan.activation_readiness !== 'READY_FOR_ACTIVATION') {
    V.fail('VNEXT_CUTOVER_ACTIVATION_BLOCKED', cutoverPlan.blocking_slice_ids.join(','));
  }
  if (V.canonicalHash(currentLegacyActivationRegistry) !== cutoverPlan.legacy_registry_hash) {
    V.fail('VNEXT_CUTOVER_LEGACY_REGISTRY_STALE');
  }
  V.assertSha40(
    activatedAtProtocolHead,
    'VNEXT_CUTOVER_ACTIVATION_HEAD_INVALID',
    'activatedAtProtocolHead',
  );
  V.assertExactKeys(
    approvalEvidence,
    ['decision', 'actor_id', 'evidence_ref', 'observed_at', 'approved_cutover_plan_hash'],
    [],
    'VNEXT_CUTOVER_APPROVAL_KEYS_INVALID',
  );
  if (approvalEvidence.decision !== 'APPROVED') V.fail('VNEXT_CUTOVER_APPROVAL_REQUIRED');
  V.assertUnicodeExactText(approvalEvidence.actor_id, 'VNEXT_CUTOVER_APPROVAL_ACTOR_INVALID');
  V.assertUnicodeExactText(approvalEvidence.evidence_ref, 'VNEXT_CUTOVER_APPROVAL_REF_INVALID');
  V.assertIsoDate(approvalEvidence.observed_at, 'VNEXT_CUTOVER_APPROVAL_DATE_INVALID');
  if (approvalEvidence.approved_cutover_plan_hash !== cutoverPlan.contract_hash) {
    V.fail('VNEXT_CUTOVER_APPROVAL_PLAN_MISMATCH');
  }

  return V.sealContract({
    schema_version: ACTIVATION_SCHEMA,
    cutover_plan_hash: cutoverPlan.contract_hash,
    candidate_head: cutoverPlan.candidate_head,
    activated_at_protocol_head: activatedAtProtocolHead,
    default_protocol: VNEXT,
    grandfathered_legacy_slice_ids: [...cutoverPlan.grandfathered_legacy_slice_ids],
    actor_id: approvalEvidence.actor_id,
    evidence_ref: approvalEvidence.evidence_ref,
    observed_at: approvalEvidence.observed_at,
    status: 'ACTIVATED',
  });
}

function validateActivationRecord(record, cutoverPlan) {
  V.assertExactKeys(
    record,
    [
      'schema_version',
      'cutover_plan_hash',
      'candidate_head',
      'activated_at_protocol_head',
      'default_protocol',
      'grandfathered_legacy_slice_ids',
      'actor_id',
      'evidence_ref',
      'observed_at',
      'status',
      'contract_hash',
    ],
    [],
    'VNEXT_CUTOVER_ACTIVATION_KEYS_INVALID',
  );
  if (record.schema_version !== ACTIVATION_SCHEMA) V.fail('VNEXT_CUTOVER_ACTIVATION_SCHEMA_INVALID');
  V.verifyContractHash(record, 'VNEXT_CUTOVER_ACTIVATION_HASH_MISMATCH');
  if (record.cutover_plan_hash !== cutoverPlan.contract_hash) V.fail('VNEXT_CUTOVER_ACTIVATION_PLAN_MISMATCH');
  if (record.candidate_head !== cutoverPlan.candidate_head) V.fail('VNEXT_CUTOVER_ACTIVATION_CANDIDATE_MISMATCH');
  if (record.default_protocol !== VNEXT || record.status !== 'ACTIVATED') {
    V.fail('VNEXT_CUTOVER_ACTIVATION_STATE_INVALID');
  }
  return true;
}

function routeSlice({ sliceId, legacyActivationRegistry, activationRecord = null, rollbackRecord = null }) {
  V.assertSliceId(sliceId, 'VNEXT_CUTOVER_ROUTE_SLICE_INVALID');
  validateLegacyRegistry(legacyActivationRegistry);
  const legacyExists = legacyActivationRegistry.activations.some((row) => row.slice_id === sliceId);

  if (rollbackRecord) {
    if (rollbackRecord.status !== 'ROLLED_BACK') V.fail('VNEXT_CUTOVER_ROLLBACK_STATE_INVALID');
    if (rollbackRecord.grandfathered_vnext_slice_ids.includes(sliceId)) return VNEXT;
    return LEGACY;
  }

  if (!activationRecord) return LEGACY;
  if (activationRecord.status !== 'ACTIVATED') V.fail('VNEXT_CUTOVER_ACTIVATION_STATE_INVALID');
  if (legacyExists || activationRecord.grandfathered_legacy_slice_ids.includes(sliceId)) return LEGACY;
  return VNEXT;
}

function buildRollbackRecord({
  activationRecord,
  activeVnextSliceIds,
  approvalEvidence,
  rolledBackAtProtocolHead,
}) {
  if (!activationRecord || activationRecord.status !== 'ACTIVATED') {
    V.fail('VNEXT_CUTOVER_ROLLBACK_ACTIVATION_REQUIRED');
  }
  V.verifyContractHash(activationRecord, 'VNEXT_CUTOVER_ACTIVATION_HASH_MISMATCH');
  const activeVnext = V.uniqueStrings(
    activeVnextSliceIds,
    'VNEXT_CUTOVER_ROLLBACK_ACTIVE_SLICES_INVALID',
    'activeVnextSliceIds',
    { allowEmpty: true },
  ).sort();
  V.assertSha40(
    rolledBackAtProtocolHead,
    'VNEXT_CUTOVER_ROLLBACK_HEAD_INVALID',
    'rolledBackAtProtocolHead',
  );
  V.assertExactKeys(
    approvalEvidence,
    ['decision', 'actor_id', 'evidence_ref', 'observed_at', 'activation_hash'],
    [],
    'VNEXT_CUTOVER_ROLLBACK_APPROVAL_KEYS_INVALID',
  );
  if (approvalEvidence.decision !== 'APPROVED') V.fail('VNEXT_CUTOVER_ROLLBACK_APPROVAL_REQUIRED');
  if (approvalEvidence.activation_hash !== activationRecord.contract_hash) {
    V.fail('VNEXT_CUTOVER_ROLLBACK_ACTIVATION_MISMATCH');
  }
  V.assertUnicodeExactText(approvalEvidence.actor_id, 'VNEXT_CUTOVER_ROLLBACK_ACTOR_INVALID');
  V.assertUnicodeExactText(approvalEvidence.evidence_ref, 'VNEXT_CUTOVER_ROLLBACK_REF_INVALID');
  V.assertIsoDate(approvalEvidence.observed_at, 'VNEXT_CUTOVER_ROLLBACK_DATE_INVALID');

  return V.sealContract({
    schema_version: ROLLBACK_SCHEMA,
    activation_hash: activationRecord.contract_hash,
    rolled_back_at_protocol_head: rolledBackAtProtocolHead,
    default_protocol: LEGACY,
    grandfathered_vnext_slice_ids: activeVnext,
    actor_id: approvalEvidence.actor_id,
    evidence_ref: approvalEvidence.evidence_ref,
    observed_at: approvalEvidence.observed_at,
    status: 'ROLLED_BACK',
  });
}

function validateRollbackRecord(record, activationRecord) {
  V.assertExactKeys(
    record,
    [
      'schema_version',
      'activation_hash',
      'rolled_back_at_protocol_head',
      'default_protocol',
      'grandfathered_vnext_slice_ids',
      'actor_id',
      'evidence_ref',
      'observed_at',
      'status',
      'contract_hash',
    ],
    [],
    'VNEXT_CUTOVER_ROLLBACK_KEYS_INVALID',
  );
  if (record.schema_version !== ROLLBACK_SCHEMA) V.fail('VNEXT_CUTOVER_ROLLBACK_SCHEMA_INVALID');
  V.verifyContractHash(record, 'VNEXT_CUTOVER_ROLLBACK_HASH_MISMATCH');
  if (record.activation_hash !== activationRecord.contract_hash) {
    V.fail('VNEXT_CUTOVER_ROLLBACK_ACTIVATION_MISMATCH');
  }
  if (record.default_protocol !== LEGACY || record.status !== 'ROLLED_BACK') {
    V.fail('VNEXT_CUTOVER_ROLLBACK_STATE_INVALID');
  }
  return true;
}

module.exports = {
  PLAN_SCHEMA,
  ACTIVATION_SCHEMA,
  ROLLBACK_SCHEMA,
  LEGACY,
  VNEXT,
  buildCutoverPlan,
  validateCutoverPlan,
  buildActivationRecord,
  validateActivationRecord,
  routeSlice,
  buildRollbackRecord,
  validateRollbackRecord,
};
