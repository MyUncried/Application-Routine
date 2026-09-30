'use strict';

const V = require('./vnext-contract');
const PlanningEnvelope = require('./planning-envelope');
const RequirementRegistry = require('./requirement-registry');
const Impact = require('./impact-graph');
const Plan = require('./plan-contract');
const Review = require('./review-contract');
const Ui = require('./ui-atomicity-contract');
const Preserved = require('./vnext-preserved-controls');

const APPROVAL_TARGET_SCHEMA = 'kodjo.vnext.approval-target.v2';
const APPROVAL_RECORD_SCHEMA = 'kodjo.vnext.approval-record.v2';
const EXECUTION_REQUEST_SCHEMA = 'kodjo.vnext.execution-request.v2';

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
    ['product_head', 'application_head', 'protocol_head', 'execution_context', 'native_primitive_decisions'],
    [],
    'VNEXT_HANDOFF_CURRENT_STATE_KEYS_INVALID',
  );
  V.assertSha40(currentState.product_head, 'VNEXT_HANDOFF_PRODUCT_HEAD_INVALID', 'product_head');
  V.assertSha40(currentState.application_head, 'VNEXT_HANDOFF_APPLICATION_HEAD_INVALID', 'application_head');
  V.assertSha40(currentState.protocol_head, 'VNEXT_HANDOFF_PROTOCOL_HEAD_INVALID', 'protocol_head');
  Preserved.validateExecutionContext(currentState.execution_context);
  Preserved.validateNativeShape(currentState.native_primitive_decisions);

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
    execution_context: Preserved.validateExecutionContext(currentState.execution_context),
    native_primitive_decisions: currentState.native_primitive_decisions,
  });
}

function validateApprovedArtifacts({
  planningEnvelope,
  requirementRegistry,
  impactGraph,
  candidateManifest,
  directImportScan,
  planContract,
  reviewContext,
  reviewReport,
  uiAtomicityContract,
}) {
  PlanningEnvelope.validate(planningEnvelope);
  RequirementRegistry.validate(requirementRegistry, planningEnvelope.source_manifest);
  Impact.validateCandidateManifest(candidateManifest);
  Impact.validateImpactGraph(impactGraph, {
    requirementRegistry,
    candidateManifest,
    directImportScan,
  });
  Review.validateReviewContext(reviewContext);
  Review.verifyReviewContext(reviewContext, {
    planningEnvelope, requirementRegistry, impactGraph, candidateManifest,
    directImportScan, planContract, uiAtomicityContract,
  });
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
  const directScanHash = directImportScan ? directImportScan.contract_hash : null;
  if (reviewContext.direct_import_scan_hash !== directScanHash) {
    V.fail('VNEXT_APPROVAL_DIRECT_SCAN_MISMATCH');
  }
  if (directImportScan) {
    Impact.validateDirectImportScan(directImportScan, candidateManifest);
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
  directImportScan,
  planContract,
  reviewContext,
  reviewReport,
  uiAtomicityContract = null,
  currentState,
  resolveNativeEvidence = null,
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
    directImportScan,
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
    execution_context: current.execution_context,
    native_primitive_decisions: Preserved.buildNativeDecisions(current.native_primitive_decisions, { uiAtomicityContract, requirementRegistry, sourceManifest: planningEnvelope.source_manifest, applicationHead: current.application_head, resolveNativeEvidence }),
    planning_mode: planningEnvelope.planning_mode,
    planning_envelope_hash: planningEnvelope.contract_hash,
    direct_import_scan_hash: directImportScan ? directImportScan.contract_hash : null,
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

function validateExecutionCore(core) {
  V.assertExactKeys(
    core,
    [
      'slice_id',
      'issue_id',
      'baseline_head',
      'product_head',
      'application_head',
      'protocol_head',
      'planning_mode',
      'execution_context',
      'native_primitive_decisions',
      'planning_envelope_hash',
      'direct_import_scan_hash',
      'plan_contract_hash',
      'review_context_hash',
      'review_report_hash',
      'ui_atomicity_hash',
      'operation_kind',
      'write_scope',
      'preserve_scope',
      'forbidden_policy',
      'checks',
    ],
    [],
    'VNEXT_EXECUTION_CORE_KEYS_INVALID',
  );
  V.assertSliceId(core.slice_id, 'VNEXT_EXECUTION_CORE_SLICE_INVALID');
  Preserved.validateExecutionContext(core.execution_context);
  Preserved.validateNativeShape(core.native_primitive_decisions);
  V.assertUnicodeExactText(core.issue_id, 'VNEXT_EXECUTION_CORE_ISSUE_INVALID', 'issue_id');
  V.assertSha40(core.baseline_head, 'VNEXT_EXECUTION_CORE_BASELINE_INVALID', 'baseline_head');
  V.assertSha40(core.product_head, 'VNEXT_EXECUTION_CORE_PRODUCT_HEAD_INVALID', 'product_head');
  V.assertSha40(core.application_head, 'VNEXT_EXECUTION_CORE_APPLICATION_HEAD_INVALID', 'application_head');
  V.assertSha40(core.protocol_head, 'VNEXT_EXECUTION_CORE_PROTOCOL_HEAD_INVALID', 'protocol_head');
  if (!['INITIAL', 'REVISION'].includes(core.planning_mode)) {
    V.fail('VNEXT_EXECUTION_CORE_MODE_INVALID', core.planning_mode);
  }
  for (const [label, value] of [
    ['planning_envelope_hash', core.planning_envelope_hash],
    ['plan_contract_hash', core.plan_contract_hash],
    ['review_context_hash', core.review_context_hash],
    ['review_report_hash', core.review_report_hash],
  ]) {
    V.assertSha64(value, 'VNEXT_EXECUTION_CORE_HASH_INVALID', label);
  }
  if (core.direct_import_scan_hash !== null) {
    V.assertSha64(core.direct_import_scan_hash, 'VNEXT_EXECUTION_CORE_DIRECT_SCAN_HASH_INVALID', 'direct_import_scan_hash');
  }
  if (core.ui_atomicity_hash !== null) {
    V.assertSha64(core.ui_atomicity_hash, 'VNEXT_EXECUTION_CORE_UI_HASH_INVALID', 'ui_atomicity_hash');
  }
  if ((core.ui_atomicity_hash === null) !== (core.native_primitive_decisions.length === 0)) V.fail('VNEXT_NATIVE_CORE_SCOPE_MISMATCH');
  for (const row of core.native_primitive_decisions) {
    V.assertSha64(row.assessment_evidence_hash, 'VNEXT_NATIVE_PROOF_HASH_REQUIRED', 'assessment_evidence_hash');
    V.assertUnicodeExactText(row.assessment_evidence_ref, 'VNEXT_NATIVE_PROOF_REFERENCE_REQUIRED', 'assessment_evidence_ref');
  }
  if (core.operation_kind !== 'IMPLEMENT') V.fail('VNEXT_EXECUTION_CORE_OPERATION_INVALID');
  if (!Array.isArray(core.write_scope) || core.write_scope.length === 0) {
    V.fail('VNEXT_EXECUTION_CORE_WRITE_SCOPE_INVALID');
  }
  const writeIds = new Set();
  for (const row of core.write_scope) {
    V.assertExactKeys(
      row,
      ['candidate_id', 'path', 'change_kind'],
      [],
      'VNEXT_EXECUTION_CORE_WRITE_SCOPE_ROW_INVALID',
    );
    V.assertNonEmptyString(row.candidate_id, 'VNEXT_EXECUTION_CORE_CANDIDATE_ID_INVALID');
    V.assertUnicodeExactText(row.path, 'VNEXT_EXECUTION_CORE_PATH_INVALID', 'write_scope.path');
    if (!['MODIFY', 'CREATE', 'DELETE'].includes(row.change_kind)) {
      V.fail('VNEXT_EXECUTION_CORE_CHANGE_KIND_INVALID', row.change_kind);
    }
    if (writeIds.has(row.candidate_id)) V.fail('VNEXT_EXECUTION_CORE_WRITE_SCOPE_DUPLICATE', row.candidate_id);
    writeIds.add(row.candidate_id);
  }
  if (!Array.isArray(core.preserve_scope)) V.fail('VNEXT_EXECUTION_CORE_PRESERVE_SCOPE_INVALID');
  const preserveIds = new Set();
  for (const row of core.preserve_scope) {
    V.assertExactKeys(
      row,
      ['candidate_id', 'path'],
      [],
      'VNEXT_EXECUTION_CORE_PRESERVE_SCOPE_ROW_INVALID',
    );
    V.assertNonEmptyString(row.candidate_id, 'VNEXT_EXECUTION_CORE_CANDIDATE_ID_INVALID');
    V.assertUnicodeExactText(row.path, 'VNEXT_EXECUTION_CORE_PATH_INVALID', 'preserve_scope.path');
    if (preserveIds.has(row.candidate_id)) V.fail('VNEXT_EXECUTION_CORE_PRESERVE_SCOPE_DUPLICATE', row.candidate_id);
    if (writeIds.has(row.candidate_id)) V.fail('VNEXT_EXECUTION_CORE_SCOPE_OVERLAP', row.candidate_id);
    preserveIds.add(row.candidate_id);
  }
  if (core.forbidden_policy !== 'ALL_OUTSIDE_WRITE_SCOPE') {
    V.fail('VNEXT_EXECUTION_CORE_FORBIDDEN_POLICY_INVALID');
  }
  if (V.canonicalStringify(core.checks) !== V.canonicalStringify(IMPLEMENTATION_CHECKS)) {
    V.fail('VNEXT_EXECUTION_CORE_CHECKS_INVALID');
  }
  return true;
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
  validateExecutionCore(target.execution_core);
  if (V.canonicalHash(target.execution_core) !== target.execution_fingerprint) {
    V.fail('VNEXT_APPROVAL_EXECUTION_FINGERPRINT_MISMATCH');
  }
  const expectedTargetId = V.stableId('APRT', [
    target.execution_core.slice_id,
    target.execution_fingerprint,
  ]);
  if (target.approval_target_id !== expectedTargetId) {
    V.fail('VNEXT_APPROVAL_TARGET_ID_MISMATCH');
  }
  V.assertExactKeys(
    target.summary,
    ['write_scope_count', 'preserve_scope_count', 'check_count'],
    [],
    'VNEXT_APPROVAL_SUMMARY_KEYS_INVALID',
  );
  if (target.summary.write_scope_count !== target.execution_core.write_scope.length
      || target.summary.preserve_scope_count !== target.execution_core.preserve_scope.length
      || target.summary.check_count !== target.execution_core.checks.length) {
    V.fail('VNEXT_APPROVAL_SUMMARY_MISMATCH');
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
    ['native_exception_approvals'],
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
  const nativeApprovals = Preserved.validateExceptionApprovals(approvalTarget.execution_core.native_primitive_decisions,
    evidence.native_exception_approvals, evidence.decision);

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
    native_exception_approvals: nativeApprovals,
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
      'native_exception_approvals',
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
  V.assertUnicodeExactText(record.actor_id, 'VNEXT_APPROVAL_ACTOR_INVALID', 'actor_id');
  V.assertUnicodeExactText(record.evidence_ref, 'VNEXT_APPROVAL_EVIDENCE_REF_INVALID', 'evidence_ref');
  if (record.evidence_kind !== 'VERIFIED_USER_ACTION') {
    V.fail('VNEXT_APPROVAL_EVIDENCE_KIND_INVALID');
  }
  if (!APPROVAL_TRANSPORTS.includes(record.transport)) {
    V.fail('VNEXT_APPROVAL_TRANSPORT_INVALID', record.transport);
  }
  V.assertIsoDate(record.observed_at, 'VNEXT_APPROVAL_OBSERVED_AT_INVALID', 'observed_at');
  Preserved.validateExceptionApprovals(approvalTarget.execution_core.native_primitive_decisions,
    record.native_exception_approvals, record.decision);
  const expectedRecordId = V.stableId('APRV', [
    approvalTarget.contract_hash,
    record.actor_id,
    record.transport,
    record.evidence_ref,
    record.decision,
  ]);
  if (record.approval_record_id !== expectedRecordId) {
    V.fail('VNEXT_APPROVAL_RECORD_ID_MISMATCH');
  }
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
      'execution_context',
      'native_primitive_decisions',
      'planning_envelope_hash',
      'direct_import_scan_hash',
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
    'execution_context=' + V.canonicalStringify(core.execution_context),
    'application_head=' + core.application_head,
    'plan_contract_hash=' + core.plan_contract_hash,
    'review_report_hash=' + core.review_report_hash,
    'write_scope_count=' + core.write_scope.length,
    'action_expected=APPROVE_EXACT_EXECUTION',
  ];
  for (const row of core.native_primitive_decisions) lines.push('native_primitive_decision=' + V.canonicalStringify(row));
  for (const id of Preserved.exceptionIds(core.native_primitive_decisions)) lines.push('native_primitive_exception_request=' + id);
  if (Preserved.exceptionIds(core.native_primitive_decisions).length) lines.push('Action requise : autoriser explicitement les exceptions natives listées, ou conserver l’arrêt NATIVE_PRIMITIVE_EXCEPTION_REQUIRED.');
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
  validateExecutionCore,
  buildExecutionCore,
  buildApprovalTarget,
  validateApprovalTarget,
  buildApprovalRecord,
  validateApprovalRecord,
  buildExecutionRequest,
  validateExecutionRequest,
  renderApprovalMessage,
};
