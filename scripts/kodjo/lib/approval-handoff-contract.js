'use strict';

const V = require('./vnext-contract');
const PlanningEnvelope = require('./planning-envelope');
const Plan = require('./plan-contract');
const Review = require('./review-contract');
const Ui = require('./ui-atomicity-contract');

const APPROVAL_TARGET_SCHEMA = 'kodjo.vnext.approval-target.v1';
const APPROVAL_RECORD_SCHEMA = 'kodjo.vnext.approval-record.v1';
const EXECUTION_REQUEST_SCHEMA = 'kodjo.vnext.execution-request.v1';

const APPROVAL_DECISIONS = Object.freeze(['APPROVED', 'REJECTED']);
const APPROVAL_TRANSPORTS = Object.freeze([
  'GITHUB_REACTION',
  'GITHUB_COMMENT',
  'CHATGPT_ACTION',
]);
const IMPLEMENTATION_CHECKS = Object.freeze(['jest', 'typescript', 'lint']);

function validateCurrentHeads(planningEnvelope, currentState) {
  V.assertExactKeys(
    currentState,
    ['product_head', 'application_head', 'protocol_head'],
    [],
    'VNEXT_HANDOFF_CURRENT_STATE_KEYS_INVALID',
  );
  V.assertSha40(currentState.product_head, 'VNEXT_HANDOFF_PRODUCT_HEAD_INVALID', 'product_head');
  V.assertSha40(currentState.application_head, 'VNEXT_HANDOFF_APPLICATION_HEAD_INVALID', 'application_head');
  V.assertSha40(currentState.protocol_head, 'VNEXT_HANDOFF_PROTOCOL_HEAD_INVALID', 'protocol_head');

  if (currentState.product_head !== planningEnvelope.product_head) {
    V.fail('VNEXT_APPROVAL_PRODUCT_HEAD_STALE');
  }
  if (currentState.application_head !== planningEnvelope.application_head) {
    V.fail('VNEXT_APPROVAL_APPLICATION_HEAD_STALE');
  }
  return Object.freeze({
    product_head: currentState.product_head,
    application_head: currentState.application_head,
    protocol_head: currentState.protocol_head,
  });
}

function validateApprovedArtifacts({
  planningEnvelope,
  requirementRegistry,
  impactGraph,
  candidateManifest,
  planContract,
  reviewContext,
  reviewReport,
  uiAtomicityContract,
}) {
  PlanningEnvelope.validate(planningEnvelope);
  Review.validateReviewContext(reviewContext);
  Review.validateReviewReport(reviewReport, reviewContext);

  if (reviewContext.planning_envelope_hash !== planningEnvelope.contract_hash) {
    V.fail('VNEXT_APPROVAL_ENVELOPE_BINDING_MISMATCH');
  }
  if (reviewContext.requirement_registry_hash !== requirementRegistry.contract_hash) {
    V.fail('VNEXT_APPROVAL_REQUIREMENT_REGISTRY_MISMATCH');
  }
  if (reviewContext.candidate_manifest_hash !== candidateManifest.contract_hash) {
    V.fail('VNEXT_APPROVAL_CANDIDATE_MANIFEST_MISMATCH');
  }
  if (reviewContext.impact_graph_hash !== impactGraph.contract_hash) {
    V.fail('VNEXT_APPROVAL_IMPACT_GRAPH_MISMATCH');
  }
  if (reviewContext.plan_contract_hash !== planContract.contract_hash) {
    V.fail('VNEXT_APPROVAL_PLAN_CONTEXT_MISMATCH');
  }
  if (reviewReport.plan_contract_hash !== planContract.contract_hash) {
    V.fail('VNEXT_APPROVAL_PLAN_REPORT_MISMATCH');
  }
  if (reviewReport.review_context_hash !== reviewContext.contract_hash) {
    V.fail('VNEXT_APPROVAL_REVIEW_CONTEXT_MISMATCH');
  }
  if (reviewReport.verdict !== 'APPROVE' || reviewReport.blocking_finding_count !== 0) {
    V.fail('VNEXT_APPROVAL_REVIEW_NOT_APPROVED', reviewReport.verdict);
  }

  if (reviewContext.ui_applicable) {
    if (!uiAtomicityContract) V.fail('VNEXT_APPROVAL_UI_CONTRACT_REQUIRED');
    Ui.validateUiAtomicityContract(uiAtomicityContract, {
      requirementRegistry,
      impactGraph,
      candidateManifest,
      planContract,
    });
    if (reviewContext.ui_atomicity_hash !== uiAtomicityContract.contract_hash) {
      V.fail('VNEXT_APPROVAL_UI_CONTEXT_MISMATCH');
    }
    if (reviewReport.ui_atomicity_hash !== uiAtomicityContract.contract_hash) {
      V.fail('VNEXT_APPROVAL_UI_REPORT_MISMATCH');
    }
  } else if (uiAtomicityContract !== null) {
    V.fail('VNEXT_APPROVAL_UI_CONTRACT_UNEXPECTED');
  }
  return true;
}

function buildExecutionCore({
  planningEnvelope,
  requirementRegistry,
  impactGraph,
  candidateManifest,
  planContract,
  reviewContext,
  reviewReport,
  uiAtomicityContract = null,
  currentState,
}) {
  Plan.validatePlanContract(planContract, {
    requirementRegistry,
    impactGraph,
    candidateManifest,
  });
  validateApprovedArtifacts({
    planningEnvelope,
    requirementRegistry,
    impactGraph,
    candidateManifest,
    planContract,
    reviewContext,
    reviewReport,
    uiAtomicityContract,
  });
  const current = validateCurrentHeads(planningEnvelope, currentState);

  const writeScope = planContract.boundaries.write_scope.map((row) => ({
    candidate_id: row.candidate_id,
    path: row.path,
    change_kind: row.change_kind,
  }));
  const preserveScope = planContract.boundaries.preserve_scope.map((row) => ({
    candidate_id: row.candidate_id,
    path: row.path,
  }));

  return Object.freeze({
    slice_id: planningEnvelope.slice_id,
    issue_id: planningEnvelope.issue_id,
    baseline_head: planningEnvelope.baseline_head,
    product_head: planningEnvelope.product_head,
    application_head: planningEnvelope.application_head,
    protocol_head: current.protocol_head,
    planning_mode: planningEnvelope.planning_mode,
    planning_envelope_hash: planningEnvelope.contract_hash,
    plan_contract_hash: planContract.contract_hash,
    review_context_hash: reviewContext.contract_hash,
    review_report_hash: reviewReport.contract_hash,
    ui_atomicity_hash: uiAtomicityContract ? uiAtomicityContract.contract_hash : null,
    operation_kind: 'IMPLEMENT',
    write_scope: writeScope,
    preserve_scope: preserveScope,
    forbidden_policy: planContract.boundaries.forbidden_policy,
    checks: [...IMPLEMENTATION_CHECKS],
  });
}

function buildApprovalTarget(input) {
  const executionCore = buildExecutionCore(input);
  const executionFingerprint = V.canonicalHash(executionCore);
  return V.sealContract({
    schema_version: APPROVAL_TARGET_SCHEMA,
    approval_target_id: V.stableId('APRT', [
      input.planningEnvelope.slice_id,
      executionFingerprint,
    ]),
    action_expected: 'APPROVE_EXACT_EXECUTION',
    execution_fingerprint: executionFingerprint,
    execution_core: executionCore,
    summary: {
      write_scope_count: executionCore.write_scope.length,
      preserve_scope_count: executionCore.preserve_scope.length,
      check_count: executionCore.checks.length,
    },
  });
}

function validateApprovalTarget(target) {
  V.assertExactKeys(
    target,
    [
      'schema_version',
      'approval_target_id',
      'action_expected',
      'execution_fingerprint',
      'execution_core',
      'summary',
      'contract_hash',
    ],
    [],
    'VNEXT_APPROVAL_TARGET_KEYS_INVALID',
  );
  if (target.schema_version !== APPROVAL_TARGET_SCHEMA) {
    V.fail('VNEXT_APPROVAL_TARGET_SCHEMA_INVALID');
  }
  if (target.action_expected !== 'APPROVE_EXACT_EXECUTION') {
    V.fail('VNEXT_APPROVAL_ACTION_INVALID');
  }
  V.assertSha64(
    target.execution_fingerprint,
    'VNEXT_APPROVAL_EXECUTION_FINGERPRINT_INVALID',
    'execution_fingerprint',
  );
  if (V.canonicalHash(target.execution_core) !== target.execution_fingerprint) {
    V.fail('VNEXT_APPROVAL_EXECUTION_FINGERPRINT_MISMATCH');
  }
  V.verifyContractHash(target, 'VNEXT_APPROVAL_TARGET_HASH_MISMATCH');
  return true;
}

function buildApprovalRecord({ approvalTarget, evidence }) {
  validateApprovalTarget(approvalTarget);
  V.assertExactKeys(
    evidence,
    [
      'decision',
      'actor_id',
      'transport',
      'evidence_ref',
      'approved_target_hash',
      'observed_at',
    ],
    [],
    'VNEXT_APPROVAL_EVIDENCE_KEYS_INVALID',
  );
  if (!APPROVAL_DECISIONS.includes(evidence.decision)) {
    V.fail('VNEXT_APPROVAL_DECISION_INVALID', evidence.decision);
  }
  V.assertUnicodeExactText(evidence.actor_id, 'VNEXT_APPROVAL_ACTOR_INVALID', 'actor_id');
  if (!APPROVAL_TRANSPORTS.includes(evidence.transport)) {
    V.fail('VNEXT_APPROVAL_TRANSPORT_INVALID', evidence.transport);
  }
  V.assertUnicodeExactText(evidence.evidence_ref, 'VNEXT_APPROVAL_EVIDENCE_REF_INVALID', 'evidence_ref');
  V.assertSha64(
    evidence.approved_target_hash,
    'VNEXT_APPROVAL_TARGET_REFERENCE_INVALID',
    'approved_target_hash',
  );
  V.assertIsoDate(evidence.observed_at, 'VNEXT_APPROVAL_OBSERVED_AT_INVALID', 'observed_at');
  if (evidence.approved_target_hash !== approvalTarget.contract_hash) {
    V.fail('VNEXT_APPROVAL_TARGET_REFERENCE_MISMATCH');
  }

  return V.sealContract({
    schema_version: APPROVAL_RECORD_SCHEMA,
    approval_record_id: V.stableId('APRV', [
      approvalTarget.contract_hash,
      evidence.actor_id,
      evidence.transport,
      evidence.evidence_ref,
      evidence.decision,
    ]),
    approval_target_hash: approvalTarget.contract_hash,
    execution_fingerprint: approvalTarget.execution_fingerprint,
    decision: evidence.decision,
    actor_id: evidence.actor_id,
    evidence_kind: 'VERIFIED_USER_ACTION',
    transport: evidence.transport,
    evidence_ref: evidence.evidence_ref,
    observed_at: evidence.observed_at,
  });
}

function validateApprovalRecord(record, approvalTarget) {
  V.assertExactKeys(
    record,
    [
      'schema_version',
      'approval_record_id',
      'approval_target_hash',
      'execution_fingerprint',
      'decision',
      'actor_id',
      'evidence_kind',
      'transport',
      'evidence_ref',
      'observed_at',
      'contract_hash',
    ],
    [],
    'VNEXT_APPROVAL_RECORD_KEYS_INVALID',
  );
  if (record.schema_version !== APPROVAL_RECORD_SCHEMA) {
    V.fail('VNEXT_APPROVAL_RECORD_SCHEMA_INVALID');
  }
  V.verifyContractHash(record, 'VNEXT_APPROVAL_RECORD_HASH_MISMATCH');
  validateApprovalTarget(approvalTarget);
  if (record.approval_target_hash !== approvalTarget.contract_hash) {
    V.fail('VNEXT_APPROVAL_RECORD_TARGET_MISMATCH');
  }
  if (record.execution_fingerprint !== approvalTarget.execution_fingerprint) {
    V.fail('VNEXT_APPROVAL_RECORD_EXECUTION_MISMATCH');
  }
  if (!APPROVAL_DECISIONS.includes(record.decision)) {
    V.fail('VNEXT_APPROVAL_DECISION_INVALID', record.decision);
  }
  if (record.evidence_kind !== 'VERIFIED_USER_ACTION') {
    V.fail('VNEXT_APPROVAL_EVIDENCE_KIND_INVALID');
  }
  if (!APPROVAL_TRANSPORTS.includes(record.transport)) {
    V.fail('VNEXT_APPROVAL_TRANSPORT_INVALID', record.transport);
  }
  V.assertIsoDate(record.observed_at, 'VNEXT_APPROVAL_OBSERVED_AT_INVALID', 'observed_at');
  return true;
}

function buildExecutionRequest({
  approvalTarget,
  approvalRecord,
  ...artifacts
}) {
  validateApprovalRecord(approvalRecord, approvalTarget);
  if (approvalRecord.decision !== 'APPROVED') {
    V.fail('VNEXT_HANDOFF_USER_APPROVAL_REQUIRED', approvalRecord.decision);
  }

  const rebuiltTarget = buildApprovalTarget(artifacts);
  if (V.canonicalStringify(rebuiltTarget) !== V.canonicalStringify(approvalTarget)) {
    V.fail('VNEXT_HANDOFF_APPROVAL_STALE');
  }

  const core = rebuiltTarget.execution_core;
  const request = V.sealContract({
    schema_version: EXECUTION_REQUEST_SCHEMA,
    execution_request_id: V.stableId('EXEC', [
      approvalRecord.contract_hash,
      rebuiltTarget.execution_fingerprint,
    ]),
    approval_target_hash: rebuiltTarget.contract_hash,
    approval_record_hash: approvalRecord.contract_hash,
    execution_fingerprint: rebuiltTarget.execution_fingerprint,
    ...core,
  });
  return request;
}

function validateExecutionRequest(request, {
  approvalTarget,
  approvalRecord,
  ...artifacts
}) {
  V.assertExactKeys(
    request,
    [
      'schema_version',
      'execution_request_id',
      'approval_target_hash',
      'approval_record_hash',
      'execution_fingerprint',
      'slice_id',
      'issue_id',
      'baseline_head',
      'product_head',
      'application_head',
      'protocol_head',
      'planning_mode',
      'planning_envelope_hash',
      'plan_contract_hash',
      'review_context_hash',
      'review_report_hash',
      'ui_atomicity_hash',
      'operation_kind',
      'write_scope',
      'preserve_scope',
      'forbidden_policy',
      'checks',
      'contract_hash',
    ],
    [],
    'VNEXT_EXECUTION_REQUEST_KEYS_INVALID',
  );
  if (request.schema_version !== EXECUTION_REQUEST_SCHEMA) {
    V.fail('VNEXT_EXECUTION_REQUEST_SCHEMA_INVALID');
  }
  V.verifyContractHash(request, 'VNEXT_EXECUTION_REQUEST_HASH_MISMATCH');
  const rebuilt = buildExecutionRequest({
    approvalTarget,
    approvalRecord,
    ...artifacts,
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(request)) {
    V.fail('VNEXT_EXECUTION_REQUEST_REBUILD_MISMATCH');
  }
  return true;
}

function renderApprovalMessage(approvalTarget, { approvalUrl = null } = {}) {
  validateApprovalTarget(approvalTarget);
  if (approvalUrl !== null) {
    V.assertUnicodeExactText(approvalUrl, 'VNEXT_APPROVAL_URL_INVALID', 'approvalUrl');
  }
  const core = approvalTarget.execution_core;
  const lines = [
    '[KODJO_VNEXT] USER_APPROVAL_REQUIRED',
    'approval_target_id=' + approvalTarget.approval_target_id,
    'approval_target_hash=' + approvalTarget.contract_hash,
    'execution_fingerprint=' + approvalTarget.execution_fingerprint,
    'application_head=' + core.application_head,
    'plan_contract_hash=' + core.plan_contract_hash,
    'review_report_hash=' + core.review_report_hash,
    'write_scope_count=' + core.write_scope.length,
    'action_expected=APPROVE_EXACT_EXECUTION',
  ];
  if (approvalUrl !== null) lines.push('approval_url=' + approvalUrl);
  lines.push(
    '',
    'Action requise : approuver explicitement cet objet exact, ou ne pas approuver.',
  );
  return lines.join('\n');
}

module.exports = {
  APPROVAL_TARGET_SCHEMA,
  APPROVAL_RECORD_SCHEMA,
  EXECUTION_REQUEST_SCHEMA,
  APPROVAL_DECISIONS,
  APPROVAL_TRANSPORTS,
  IMPLEMENTATION_CHECKS,
  buildExecutionCore,
  buildApprovalTarget,
  validateApprovalTarget,
  buildApprovalRecord,
  validateApprovalRecord,
  buildExecutionRequest,
  validateExecutionRequest,
  renderApprovalMessage,
};
