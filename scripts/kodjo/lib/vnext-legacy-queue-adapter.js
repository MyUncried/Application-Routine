'use strict';

const crypto = require('node:crypto');
const V = require('./vnext-contract');
const Approval = require('./approval-handoff-contract');
const Plan = require('./plan-contract');
const { LEAN_REQUEST_SCHEMA, validateQueueRequest } = require('./queue-contract');

const SCHEMA = 'kodjo.vnext.legacy-queue-projection.v1';
const ISSUE_ID = /^github_issue:([^#]+)#([1-9][0-9]*)$/;
const COMMENT_REF = /^issue_comment:[1-9][0-9]*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeRelativePath(value, code, label) {
  V.assertUnicodeExactText(value, code, label);
  if (value.startsWith('/') || value.includes('\\\\') || value.split('/').includes('..')) V.fail(code, label);
  return value;
}

function gitBlobOid(text) {
  const body = Buffer.from(String(text), 'utf8');
  const header = Buffer.from('blob ' + body.length + '\\0', 'utf8');
  return crypto.createHash('sha1').update(Buffer.concat([header, body])).digest('hex');
}

function renderCompatibilityPlan(executionRequest, planContract) {
  V.assertSha64(executionRequest.contract_hash, 'VNEXT_QUEUE_EXECUTION_HASH_INVALID');
  Plan.verifyMarkdownProjection(Plan.renderMarkdown(planContract), planContract);
  return [
    '# KODJO VNext — Projection transport du plan',
    '',
    'vnext_execution_request_hash=' + executionRequest.contract_hash,
    'execution_fingerprint=' + executionRequest.execution_fingerprint,
    'application_head=' + executionRequest.application_head,
    'plan_contract_hash=' + executionRequest.plan_contract_hash,
    '',
    Plan.renderMarkdown(planContract).trimEnd(),
    '',
  ].join('\\n');
}

function renderCompatibilityReview(executionRequest, reviewReport, planPath) {
  safeRelativePath(planPath, 'VNEXT_QUEUE_PLAN_PATH_INVALID', 'plan_path');
  const planName = planPath.split('/').pop();
  return [
    '# KODJO VNext — Projection transport de la revue',
    '',
    'Plan revu : ' + planName,
    'review_report_hash=' + reviewReport.contract_hash,
    'vnext_execution_request_hash=' + executionRequest.contract_hash,
    '',
    'Verdict: APPROVED',
    '',
  ].join('\\n');
}

function renderCompatibilityMission(executionRequest) {
  const scope = executionRequest.write_scope.map((row) => row.path);
  return [
    '# Mission d’implémentation — ' + executionRequest.slice_id,
    '',
    'vnext_execution_request_hash=' + executionRequest.contract_hash,
    'execution_fingerprint=' + executionRequest.execution_fingerprint,
    'application_head=' + executionRequest.application_head,
    'operation_kind=IMPLEMENT',
    'checks=' + executionRequest.checks.join(','),
    '',
    '## Autorisation',
    '',
    'Implémenter exclusivement le périmètre autorisé par l’ExecutionRequest VNext.',
    'Aucun élargissement de scope n’est autorisé.',
    'Le scope opposable de transport est exactement :',
    ...scope.map((p) => '- ' + p),
    '',
    'Tout besoin hors scope doit arrêter l’exécution avant modification.',
    '',
  ].join('\\n');
}

function validateTransport(transport, executionRequest, approvalRecord) {
  V.assertExactKeys(transport, [
    'slice_bootstrap_file', 'slice_bootstrap_sha256', 'plan_path', 'review_path',
    'prompt_file', 'gate_ref', 'request_id', 'created_at',
  ], [], 'VNEXT_QUEUE_TRANSPORT_KEYS_INVALID');
  safeRelativePath(transport.slice_bootstrap_file, 'VNEXT_QUEUE_BOOTSTRAP_PATH_INVALID', 'slice_bootstrap_file');
  safeRelativePath(transport.plan_path, 'VNEXT_QUEUE_PLAN_PATH_INVALID', 'plan_path');
  safeRelativePath(transport.review_path, 'VNEXT_QUEUE_REVIEW_PATH_INVALID', 'review_path');
  safeRelativePath(transport.prompt_file, 'VNEXT_QUEUE_PROMPT_PATH_INVALID', 'prompt_file');
  V.assertSha64(transport.slice_bootstrap_sha256, 'VNEXT_QUEUE_BOOTSTRAP_HASH_INVALID', 'slice_bootstrap_sha256');
  if (!COMMENT_REF.test(transport.gate_ref)) V.fail('VNEXT_QUEUE_GATE_REF_INVALID', transport.gate_ref);
  if (!UUID.test(transport.request_id)) V.fail('VNEXT_QUEUE_REQUEST_ID_INVALID', transport.request_id);
  V.assertIsoDate(transport.created_at, 'VNEXT_QUEUE_CREATED_AT_INVALID', 'created_at');
  if (approvalRecord.transport !== 'GITHUB_REACTION') V.fail('VNEXT_QUEUE_LEGACY_TRANSPORT_REQUIRES_GITHUB_REACTION');
  if (!approvalRecord.evidence_ref.startsWith(transport.gate_ref + '#')) V.fail('VNEXT_QUEUE_GATE_EVIDENCE_MISMATCH');
  if (approvalRecord.decision !== 'APPROVED') V.fail('VNEXT_QUEUE_APPROVAL_REQUIRED');
  return true;
}

function buildLegacyQueueProjection(args) {
  const {
    executionRequest, approvalTarget, approvalRecord, planningEnvelope, requirementRegistry,
    impactGraph, candidateManifest, directImportScan, planContract, reviewContext, reviewReport,
    uiAtomicityContract = null, currentState, transport,
  } = args;
  Approval.validateExecutionRequest(executionRequest, {
    approvalTarget, approvalRecord, planningEnvelope, requirementRegistry, impactGraph,
    candidateManifest, directImportScan, planContract, reviewContext, reviewReport,
    uiAtomicityContract, currentState,
  });
  validateTransport(transport, executionRequest, approvalRecord);
  const issue = ISSUE_ID.exec(executionRequest.issue_id);
  if (!issue) V.fail('VNEXT_QUEUE_ISSUE_ID_UNSUPPORTED', executionRequest.issue_id);

  const planBody = renderCompatibilityPlan(executionRequest, planContract);
  const reviewBody = renderCompatibilityReview(executionRequest, reviewReport, transport.plan_path);
  const missionBody = renderCompatibilityMission(executionRequest);
  const planBlobOid = gitBlobOid(planBody);
  const reviewBlobOid = gitBlobOid(reviewBody);
  const missionBlobOid = gitBlobOid(missionBody);
  const scopeAllow = executionRequest.write_scope.map((row) => row.path);

  const queueRequest = {
    schema_version: LEAN_REQUEST_SCHEMA,
    slice_id: executionRequest.slice_id,
    issue_number: Number(issue[2]),
    source_head: executionRequest.protocol_head,
    baseline_head: executionRequest.baseline_head,
    slice_bootstrap_file: transport.slice_bootstrap_file,
    slice_bootstrap_sha256: transport.slice_bootstrap_sha256,
    mode: 'INITIAL',
    operation_kind: 'IMPLEMENT',
    session_id: null,
    prompt_file: transport.prompt_file,
    scope_allow: scopeAllow,
    checks: [...executionRequest.checks],
    request_id: transport.request_id,
    created_at: transport.created_at,
    authorized_plan: {
      plan_path: transport.plan_path,
      plan_blob_oid: planBlobOid,
      approved_at_commit: executionRequest.protocol_head,
      evidence_kind: 'ARTIFACT_HASH',
    },
    independent_review: {
      review_path: transport.review_path,
      review_blob_oid: reviewBlobOid,
      reviewed_plan_blob_oid: planBlobOid,
      verdict: 'APPROVED',
      evidence_kind: 'ARTIFACT_HASH',
    },
    user_gate: {
      gate_ref: transport.gate_ref,
      gated_reference: executionRequest.protocol_head,
      decision: 'APPROVED',
      user_login: approvalRecord.actor_id,
      evidence_kind: 'ORGANISATIONAL',
    },
  };

  const violations = validateQueueRequest(queueRequest);
  if (violations.length) V.fail('VNEXT_QUEUE_LEGACY_CONTRACT_REFUSED', violations.map((x) => x.diagnostic + ':' + x.property).join(','));
  if (V.canonicalStringify(queueRequest.scope_allow) !== V.canonicalStringify(scopeAllow)) V.fail('VNEXT_QUEUE_SCOPE_WIDENING');
  if (V.canonicalStringify(queueRequest.checks) !== V.canonicalStringify(executionRequest.checks)) V.fail('VNEXT_QUEUE_CHECK_DRIFT');

  return V.sealContract({
    schema_version: SCHEMA,
    execution_request_hash: executionRequest.contract_hash,
    execution_fingerprint: executionRequest.execution_fingerprint,
    projection_mode: 'LEGACY_TRANSPORT_ONLY',
    canonical_authority: 'VNEXT_EXECUTION_REQUEST',
    compatibility_files: {
      plan: { path: transport.plan_path, blob_oid: planBlobOid, content_sha256: V.sha256(planBody), content: planBody },
      review: { path: transport.review_path, blob_oid: reviewBlobOid, content_sha256: V.sha256(reviewBody), content: reviewBody },
      mission: { path: transport.prompt_file, blob_oid: missionBlobOid, content_sha256: V.sha256(missionBody), content: missionBody },
    },
    legacy_queue_request: queueRequest,
    projection_guard: {
      scope_sha256: V.canonicalHash(queueRequest.scope_allow),
      checks_sha256: V.canonicalHash(queueRequest.checks),
      application_head: executionRequest.application_head,
      protocol_head: executionRequest.protocol_head,
      approval_record_hash: approvalRecord.contract_hash,
    },
  });
}

function validateLegacyQueueProjection(projection, executionRequest) {
  V.assertExactKeys(projection, [
    'schema_version', 'execution_request_hash', 'execution_fingerprint', 'projection_mode',
    'canonical_authority', 'compatibility_files', 'legacy_queue_request', 'projection_guard', 'contract_hash',
  ], [], 'VNEXT_QUEUE_PROJECTION_KEYS_INVALID');
  if (projection.schema_version !== SCHEMA) V.fail('VNEXT_QUEUE_PROJECTION_SCHEMA_INVALID');
  V.verifyContractHash(projection, 'VNEXT_QUEUE_PROJECTION_HASH_MISMATCH');
  if (projection.execution_request_hash !== executionRequest.contract_hash
      || projection.execution_fingerprint !== executionRequest.execution_fingerprint) V.fail('VNEXT_QUEUE_PROJECTION_EXECUTION_MISMATCH');
  if (projection.projection_mode !== 'LEGACY_TRANSPORT_ONLY'
      || projection.canonical_authority !== 'VNEXT_EXECUTION_REQUEST') V.fail('VNEXT_QUEUE_PROJECTION_AUTHORITY_INVALID');
  V.assertExactKeys(
    projection.compatibility_files,
    ['plan','review','mission'],
    [],
    'VNEXT_QUEUE_COMPATIBILITY_FILES_KEYS_INVALID',
  );
  const queue = projection.legacy_queue_request;
  const files = [
    ['plan', projection.compatibility_files.plan, queue.authorized_plan.plan_path, queue.authorized_plan.plan_blob_oid],
    ['review', projection.compatibility_files.review, queue.independent_review.review_path, queue.independent_review.review_blob_oid],
    ['mission', projection.compatibility_files.mission, queue.prompt_file, null],
  ];
  for (const [kind, file, expectedPath, expectedBlob] of files) {
    V.assertExactKeys(file, ['path','blob_oid','content_sha256','content'], [], 'VNEXT_QUEUE_COMPATIBILITY_FILE_KEYS_INVALID');
    if (file.path !== expectedPath) V.fail('VNEXT_QUEUE_COMPATIBILITY_PATH_MISMATCH', kind);
    if (file.content_sha256 !== V.sha256(file.content)) V.fail('VNEXT_QUEUE_COMPATIBILITY_CONTENT_HASH_MISMATCH', kind);
    if (file.blob_oid !== gitBlobOid(file.content)) V.fail('VNEXT_QUEUE_COMPATIBILITY_BLOB_MISMATCH', kind);
    if (expectedBlob !== null && file.blob_oid !== expectedBlob) V.fail('VNEXT_QUEUE_COMPATIBILITY_QUEUE_BLOB_MISMATCH', kind);
  }
  if (queue.independent_review.reviewed_plan_blob_oid !== projection.compatibility_files.plan.blob_oid) {
    V.fail('VNEXT_QUEUE_COMPATIBILITY_REVIEW_PLAN_MISMATCH');
  }
  if (!projection.compatibility_files.plan.content.includes(executionRequest.contract_hash)
      || !projection.compatibility_files.review.content.includes(executionRequest.contract_hash)
      || !projection.compatibility_files.mission.content.includes(executionRequest.contract_hash)) {
    V.fail('VNEXT_QUEUE_COMPATIBILITY_EXECUTION_REFERENCE_MISSING');
  }
  const violations = validateQueueRequest(queue);
  if (violations.length) V.fail('VNEXT_QUEUE_PROJECTION_LEGACY_INVALID');
  const exactScope = executionRequest.write_scope.map((row) => row.path);
  if (V.canonicalStringify(queue.scope_allow) !== V.canonicalStringify(exactScope)) V.fail('VNEXT_QUEUE_SCOPE_WIDENING');
  if (V.canonicalStringify(queue.checks) !== V.canonicalStringify(executionRequest.checks)) V.fail('VNEXT_QUEUE_CHECK_DRIFT');
  if (queue.source_head !== executionRequest.protocol_head || queue.baseline_head !== executionRequest.baseline_head) V.fail('VNEXT_QUEUE_HEAD_DRIFT');
  if (projection.projection_guard.scope_sha256 !== V.canonicalHash(queue.scope_allow)
      || projection.projection_guard.checks_sha256 !== V.canonicalHash(queue.checks)
      || projection.projection_guard.application_head !== executionRequest.application_head
      || projection.projection_guard.protocol_head !== executionRequest.protocol_head) V.fail('VNEXT_QUEUE_PROJECTION_GUARD_MISMATCH');
  return true;
}

module.exports = {
  SCHEMA, gitBlobOid, renderCompatibilityPlan, renderCompatibilityReview,
  renderCompatibilityMission, buildLegacyQueueProjection, validateLegacyQueueProjection,
};
