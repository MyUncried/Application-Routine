'use strict';

const V = require('./vnext-contract');
const PlanningEnvelope = require('./planning-envelope');
const RequirementRegistry = require('./requirement-registry');
const Impact = require('./impact-graph');
const Plan = require('./plan-contract');
const Ui = require('./ui-atomicity-contract');
const Review = require('./review-contract');
const Revision = require('./revision-contract');
const Approval = require('./approval-handoff-contract');

const SCHEMA = 'kodjo.vnext.runtime-snapshot.v1';
const STAGES = Object.freeze([
  'ADMISSION',
  'REQUIREMENTS',
  'IMPACT',
  'PLAN',
  'REVIEW',
  'REVISION',
  'USER_APPROVAL',
  'HANDOFF',
]);

function exact(value, rebuilt, code) {
  if (V.canonicalStringify(value) !== V.canonicalStringify(rebuilt)) V.fail(code);
}

function validateRevisionChain({
  planningEnvelope,
  reviewContext,
  reviewReport,
  revisionArtifacts,
}) {
  if (planningEnvelope.planning_mode === 'INITIAL') {
    if (revisionArtifacts !== null) V.fail('VNEXT_RUNTIME_INITIAL_REVISION_ARTIFACTS_FORBIDDEN');
    return Object.freeze({
      stage: 'REVISION',
      status: 'NOT_APPLICABLE',
      evidence_hashes: [],
    });
  }

  if (!revisionArtifacts || typeof revisionArtifacts !== 'object' || Array.isArray(revisionArtifacts)) {
    V.fail('VNEXT_RUNTIME_REVISION_ARTIFACTS_REQUIRED');
  }
  V.assertExactKeys(
    revisionArtifacts,
    ['allowed_change_set', 'revision_patch', 'revision_outcome'],
    [],
    'VNEXT_RUNTIME_REVISION_ARTIFACT_KEYS_INVALID',
  );
  const allowed = revisionArtifacts.allowed_change_set;
  const patch = revisionArtifacts.revision_patch;
  const outcome = revisionArtifacts.revision_outcome;

  Revision.validateAllowedChangeSet(allowed);
  Revision.validateRevisionPatch(patch, allowed);
  V.assertExactKeys(
    outcome,
    [
      'schema_version',
      'allowed_change_set_hash',
      'revision_patch_hash',
      'next_review_context_hash',
      'next_review_report_hash',
      'status',
      'preserved_target_count',
      'authorized_target_count',
      'derived_target_count',
      'new_target_count',
      'contract_hash',
    ],
    [],
    'VNEXT_RUNTIME_REVISION_OUTCOME_KEYS_INVALID',
  );
  if (outcome.schema_version !== Revision.OUTCOME_SCHEMA) {
    V.fail('VNEXT_RUNTIME_REVISION_OUTCOME_SCHEMA_INVALID');
  }
  V.verifyContractHash(outcome, 'VNEXT_RUNTIME_REVISION_OUTCOME_HASH_MISMATCH');
  if (outcome.allowed_change_set_hash !== allowed.contract_hash) {
    V.fail('VNEXT_RUNTIME_REVISION_ALLOWED_SET_MISMATCH');
  }
  if (outcome.revision_patch_hash !== patch.contract_hash) {
    V.fail('VNEXT_RUNTIME_REVISION_PATCH_MISMATCH');
  }
  if (outcome.next_review_context_hash !== reviewContext.contract_hash
      || outcome.next_review_report_hash !== reviewReport.contract_hash) {
    V.fail('VNEXT_RUNTIME_REVISION_REVIEW_MISMATCH');
  }
  if (outcome.status !== 'RESOLVED') V.fail('VNEXT_RUNTIME_REVISION_NOT_RESOLVED', outcome.status);
  if (planningEnvelope.base_plan_hash !== allowed.base_plan_contract_hash) {
    V.fail('VNEXT_RUNTIME_REVISION_BASE_PLAN_MISMATCH');
  }
  if (planningEnvelope.base_review_hash !== allowed.review_report_hash) {
    V.fail('VNEXT_RUNTIME_REVISION_BASE_REVIEW_MISMATCH');
  }
  const causal = [...planningEnvelope.causal_findings].sort();
  if (V.canonicalStringify(causal) !== V.canonicalStringify([...allowed.blocking_finding_ids].sort())) {
    V.fail('VNEXT_RUNTIME_REVISION_FINDINGS_MISMATCH');
  }

  return Object.freeze({
    stage: 'REVISION',
    status: 'RESOLVED',
    evidence_hashes: [allowed.contract_hash, patch.contract_hash, outcome.contract_hash],
  });
}

function buildRuntimeSnapshot({
  planningEnvelope,
  requirementRegistry,
  candidateManifest,
  directImportScan = null,
  impactGraph,
  planContract,
  uiAtomicityContract = null,
  reviewContext,
  reviewReport,
  revisionArtifacts = null,
  approvalTarget,
  approvalRecord,
  executionRequest,
  currentState,
}) {
  PlanningEnvelope.validate(planningEnvelope);
  RequirementRegistry.validate(requirementRegistry, planningEnvelope.source_manifest);
  if (requirementRegistry.planning_envelope_hash !== planningEnvelope.contract_hash) {
    V.fail('VNEXT_RUNTIME_REQUIREMENT_ENVELOPE_MISMATCH');
  }

  Impact.validateCandidateManifest(candidateManifest);
  if (directImportScan) Impact.validateDirectImportScan(directImportScan, candidateManifest);
  Impact.validateImpactGraph(impactGraph, {
    requirementRegistry,
    candidateManifest,
    directImportScan,
  });
  Plan.validatePlanContract(planContract, {
    requirementRegistry,
    impactGraph,
    candidateManifest,
  });

  if (reviewContext.ui_applicable) {
    if (!uiAtomicityContract) V.fail('VNEXT_RUNTIME_UI_CONTRACT_REQUIRED');
    Ui.validateUiAtomicityContract(uiAtomicityContract, {
      requirementRegistry,
      impactGraph,
      candidateManifest,
      planContract,
    });
  } else if (uiAtomicityContract !== null) {
    V.fail('VNEXT_RUNTIME_UI_CONTRACT_UNEXPECTED');
  }

  const rebuiltReviewContext = Review.buildReviewContext({
    planningEnvelope,
    requirementRegistry,
    impactGraph,
    candidateManifest,
    planContract,
    directImportScan,
    uiAtomicityContract,
  });
  exact(reviewContext, rebuiltReviewContext, 'VNEXT_RUNTIME_REVIEW_CONTEXT_REBUILD_MISMATCH');
  Review.validateReviewReport(reviewReport, reviewContext);
  if (reviewReport.verdict !== 'APPROVE') {
    V.fail('VNEXT_RUNTIME_REVIEW_NOT_APPROVED', reviewReport.verdict);
  }

  const revisionStage = validateRevisionChain({
    planningEnvelope,
    reviewContext,
    reviewReport,
    revisionArtifacts,
  });

  const rebuiltApprovalTarget = Approval.buildApprovalTarget({
    planningEnvelope,
    requirementRegistry,
    impactGraph,
    candidateManifest,
    directImportScan,
    planContract,
    reviewContext,
    reviewReport,
    uiAtomicityContract,
    currentState,
  });
  exact(approvalTarget, rebuiltApprovalTarget, 'VNEXT_RUNTIME_APPROVAL_TARGET_REBUILD_MISMATCH');
  Approval.validateApprovalRecord(approvalRecord, approvalTarget);
  if (approvalRecord.decision !== 'APPROVED') {
    V.fail('VNEXT_RUNTIME_USER_NOT_APPROVED', approvalRecord.decision);
  }
  Approval.validateExecutionRequest(executionRequest, {
    approvalTarget,
    approvalRecord,
    planningEnvelope,
    requirementRegistry,
    impactGraph,
    candidateManifest,
    directImportScan,
    planContract,
    reviewContext,
    reviewReport,
    uiAtomicityContract,
    currentState,
  });

  const stages = [
    {
      stage: 'ADMISSION',
      status: 'PASS',
      evidence_hashes: [planningEnvelope.contract_hash],
    },
    {
      stage: 'REQUIREMENTS',
      status: 'PASS',
      evidence_hashes: [requirementRegistry.contract_hash],
    },
    {
      stage: 'IMPACT',
      status: 'PASS',
      evidence_hashes: [
        candidateManifest.contract_hash,
        ...(directImportScan ? [directImportScan.contract_hash] : []),
        impactGraph.contract_hash,
      ],
    },
    {
      stage: 'PLAN',
      status: 'PASS',
      evidence_hashes: [
        planContract.contract_hash,
        ...(uiAtomicityContract ? [uiAtomicityContract.contract_hash] : []),
      ],
    },
    {
      stage: 'REVIEW',
      status: 'APPROVED',
      evidence_hashes: [reviewContext.contract_hash, reviewReport.contract_hash],
    },
    revisionStage,
    {
      stage: 'USER_APPROVAL',
      status: 'APPROVED',
      evidence_hashes: [approvalTarget.contract_hash, approvalRecord.contract_hash],
    },
    {
      stage: 'HANDOFF',
      status: 'READY',
      evidence_hashes: [executionRequest.contract_hash],
    },
  ];

  if (V.canonicalStringify(stages.map((row) => row.stage)) !== V.canonicalStringify(STAGES)) {
    V.fail('VNEXT_RUNTIME_STAGE_ORDER_INVALID');
  }

  const artifactHashes = stages.flatMap((stage) => stage.evidence_hashes);
  return V.sealContract({
    schema_version: SCHEMA,
    slice_id: planningEnvelope.slice_id,
    planning_mode: planningEnvelope.planning_mode,
    application_head: planningEnvelope.application_head,
    protocol_head: executionRequest.protocol_head,
    terminal_state: 'HANDOFF_READY',
    execution_request_hash: executionRequest.contract_hash,
    execution_fingerprint: executionRequest.execution_fingerprint,
    stages,
    chain_hash: V.canonicalHash(artifactHashes),
  });
}

function validateRuntimeSnapshot(snapshot) {
  V.assertExactKeys(
    snapshot,
    [
      'schema_version',
      'slice_id',
      'planning_mode',
      'application_head',
      'protocol_head',
      'terminal_state',
      'execution_request_hash',
      'execution_fingerprint',
      'stages',
      'chain_hash',
      'contract_hash',
    ],
    [],
    'VNEXT_RUNTIME_SNAPSHOT_KEYS_INVALID',
  );
  if (snapshot.schema_version !== SCHEMA) V.fail('VNEXT_RUNTIME_SNAPSHOT_SCHEMA_INVALID');
  V.verifyContractHash(snapshot, 'VNEXT_RUNTIME_SNAPSHOT_HASH_MISMATCH');
  V.assertSliceId(snapshot.slice_id, 'VNEXT_RUNTIME_SLICE_INVALID');
  if (!['INITIAL', 'REVISION'].includes(snapshot.planning_mode)) V.fail('VNEXT_RUNTIME_MODE_INVALID');
  V.assertSha40(snapshot.application_head, 'VNEXT_RUNTIME_APPLICATION_HEAD_INVALID');
  V.assertSha40(snapshot.protocol_head, 'VNEXT_RUNTIME_PROTOCOL_HEAD_INVALID');
  V.assertSha64(snapshot.execution_request_hash, 'VNEXT_RUNTIME_EXECUTION_REQUEST_HASH_INVALID');
  V.assertSha64(snapshot.execution_fingerprint, 'VNEXT_RUNTIME_EXECUTION_FINGERPRINT_INVALID');
  V.assertSha64(snapshot.chain_hash, 'VNEXT_RUNTIME_CHAIN_HASH_INVALID');
  if (snapshot.terminal_state !== 'HANDOFF_READY') V.fail('VNEXT_RUNTIME_TERMINAL_STATE_INVALID');
  if (!Array.isArray(snapshot.stages) || snapshot.stages.length !== STAGES.length
      || V.canonicalStringify(snapshot.stages.map((row) => row.stage)) !== V.canonicalStringify(STAGES)) {
    V.fail('VNEXT_RUNTIME_STAGE_ORDER_INVALID');
  }
  const expectedStatuses = snapshot.planning_mode === 'INITIAL'
    ? ['PASS','PASS','PASS','PASS','APPROVED','NOT_APPLICABLE','APPROVED','READY']
    : ['PASS','PASS','PASS','PASS','APPROVED','RESOLVED','APPROVED','READY'];
  snapshot.stages.forEach((stage, index) => {
    V.assertExactKeys(stage, ['stage','status','evidence_hashes'], [], 'VNEXT_RUNTIME_STAGE_KEYS_INVALID');
    if (stage.status !== expectedStatuses[index]) {
      V.fail('VNEXT_RUNTIME_STAGE_STATUS_INVALID', stage.stage + ':' + stage.status);
    }
    if (!Array.isArray(stage.evidence_hashes)) V.fail('VNEXT_RUNTIME_STAGE_EVIDENCE_INVALID', stage.stage);
    if (stage.stage !== 'REVISION' || stage.status !== 'NOT_APPLICABLE') {
      if (stage.evidence_hashes.length === 0) V.fail('VNEXT_RUNTIME_STAGE_EVIDENCE_MISSING', stage.stage);
    }
    for (const hash of stage.evidence_hashes) {
      V.assertSha64(hash, 'VNEXT_RUNTIME_STAGE_EVIDENCE_HASH_INVALID', stage.stage);
    }
  });
  const expectedChainHash = V.canonicalHash(snapshot.stages.flatMap((stage) => stage.evidence_hashes));
  if (snapshot.chain_hash !== expectedChainHash) V.fail('VNEXT_RUNTIME_CHAIN_HASH_MISMATCH');
  return true;
}

module.exports = {
  SCHEMA,
  STAGES,
  buildRuntimeSnapshot,
  validateRuntimeSnapshot,
};
