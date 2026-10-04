'use strict';

const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
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
  if (value.startsWith('/') || value.includes('\\') || /^[A-Za-z]:/.test(value)
      || value.split('/').some(part => part === '..' || part === '.' || part === '')) V.fail(code, label);
  return value;
}

function gitBlobOid(text) {
  const body = Buffer.from(String(text), 'utf8');
  const header = Buffer.from('blob ' + body.length + '\0', 'utf8');
  return crypto.createHash('sha1').update(Buffer.concat([header, body])).digest('hex');
}

function projectUi(planContract, uiAtomicityContract = null, candidateManifest = null) {
  const legacy = require('./ui-criteria-contract');
  const changes = new Map(planContract.plan_items.flatMap(item => item.change_items).map(row => [row.impact_id, row.path]));
  const proofs = new Map(planContract.plan_items.flatMap(item => item.proof_obligations).map(row => [row.proof_id, row]));
  const candidates = new Map((candidateManifest?.candidates || []).map(row => [row.candidate_id, row]));
  const criteria = (uiAtomicityContract?.criteria || []).map(criterion => {
    const id=criterion.criterion_id.toUpperCase();
    const selected=criterion.component_decision==='CREATE' ? {path:'NONE',export:'NONE'} :
      {path:candidates.get(criterion.selected_component_candidate_id)?.path,export:criterion.selected_component};
    if(criterion.component_decision!=='CREATE' && (!selected.path || !/^(?:default|[A-Za-z_$][A-Za-z0-9_$]*)$/.test(selected.export))) V.fail('VNEXT_QUEUE_COMPONENT_BINDING_UNREPRESENTABLE');
    return {
      criterion_id:id,
      source:{path:criterion.source.locator,locator:criterion.source.unit_locator,requirement:criterion.statement},
      risk_types:criterion.risk_types,
      reuse_search:criterion.reuse_search_candidate_ids.map(candidateId=>{
        const row=candidates.get(candidateId);if(!row)V.fail('VNEXT_QUEUE_REUSE_CANDIDATE_MISSING');return row.path;
      }),
      component_decision:criterion.component_decision,selected_component:selected,
      decision_justification:criterion.decision_justification,
      change_targets:[...new Set(criterion.change_impact_ids.map(impactId=>changes.get(impactId)))].sort(),
      tests:[...new Set(criterion.proof_ids.map(proofId=>proofs.get(proofId)?.target_test_impact_id).filter(Boolean).map(impactId=>changes.get(impactId)).filter(Boolean))].sort(),
      proof_required:criterion.proof_required,
      assertions:criterion.assertions.map(assertion=>({
        assertion_id:id+'-A'+V.sha256(assertion.assertion_id).slice(0,12).toUpperCase(),
        source:{path:criterion.source.locator,locator:criterion.source.unit_locator},
        property_type:assertion.property_type,expected:assertion.subject+': '+assertion.expected,
        proof_required:[...new Set(assertion.proof_ids.map(proofId=>proofs.get(proofId)?.proof_type))].sort(),
      })),
    };
  });
  const preservation = {
    preserve: planContract.boundaries.preserve_scope.map(row => ({ target: row.path, justification: 'Exact approved VNext preserve_scope.' })),
    change: planContract.boundaries.write_scope.map(row => ({ target: row.path, justification: 'Exact approved VNext write_scope: ' + row.change_kind })),
    forbidden: [{ target: 'OUTSIDE_WRITE_SCOPE', justification: planContract.boundaries.forbidden_policy }],
  };
  const matrix = { schema: criteria.length ? legacy.MATRIX_SCHEMA_V2 : legacy.MATRIX_SCHEMA_V1, criteria, preservation };
  const uiPaths = [...new Set(criteria.flatMap(row => row.change_targets))].sort();
  if (planContract.boundaries.write_scope.some(row => legacy.isUiPath(row.path)) && !uiAtomicityContract) V.fail('VNEXT_QUEUE_UI_CONTRACT_REQUIRED');
  legacy.validateMatrix(matrix, { scope: new Set(planContract.boundaries.write_scope.map(row => row.path)), uiPaths });
  return { matrix, uiPaths };
}
function renderCompatibilityPlan(executionRequest, planContract, uiAtomicityContract = null, requirementRegistry = null, candidateManifest = null) {
  Plan.verifyMarkdownProjection(Plan.renderMarkdown(planContract), planContract);
  const { matrix, uiPaths } = projectUi(planContract, uiAtomicityContract, candidateManifest);
  const preservation = planContract.delivery_preservation;
  if (preservation) {
    require('./vnext-delivery-preservation').validate(preservation, planContract.plan_items, planContract.boundaries.write_scope);
    for (const row of preservation.replacements) if (!(uiAtomicityContract?.criteria || []).some(c => c.requirement_id === row.requirement_id)) V.fail('VNEXT_DELIVERY_REPLACEMENT_UI_CRITERION_REQUIRED');
  }
  const fullMatrix = require('./vnext-delivery-preservation').merge(matrix, preservation);
  const assertions = fullMatrix.criteria.flatMap(c => c.assertions || []).map(a => a.assertion_id).sort();
  const contract = { schema: 'kodjo.ui-plan-contract.v1', contract_version: assertions.length ? 2 : 1,
    ...(assertions.length ? {assertion_count: assertions.length, assertion_ids_sha256: require('./plan-impact').sha256(assertions)} : {}),
    protocol_commit: executionRequest.application_head, scan_revision: executionRequest.application_head,
    ui_applicable: fullMatrix.criteria.length > 0, ui_paths: uiPaths, criterion_count: fullMatrix.criteria.length,
    matrix_sha256: require('./ui-criteria-contract').matrixFingerprint(matrix) };
  if (!requirementRegistry || requirementRegistry.contract_hash !== planContract.requirement_registry_hash) V.fail('VNEXT_QUEUE_REQUIREMENT_REGISTRY_REQUIRED');
  const Requirements = require('./requirement-contract');
  const registry = new Map(requirementRegistry.requirements.map(row => [row.requirement_id, row]));
  const uiRequirementIds = new Set((uiAtomicityContract?.criteria || []).map(row => row.requirement_id));
  const impactPaths = new Map(planContract.plan_items.flatMap(item => item.change_items).map(row => [row.impact_id, row.path]));
  const nonUi = planContract.plan_items.filter(item => !uiRequirementIds.has(item.requirement_id) && item.change_items.length).map(item => {
    const requirement = registry.get(item.requirement_id);
    if (!requirement) V.fail('VNEXT_QUEUE_REQUIREMENT_SOURCE_MISSING', item.requirement_id);
    return { requirement_type: ['FUNCTIONAL','DATA','TECHNICAL','MIGRATION','PRESERVATION'].includes(requirement.kind) ? requirement.kind : 'TECHNICAL',
      source: { path: requirement.source.locator, locator: requirement.source.unit_locator,
        requirement: requirement.statement + '\nVNext requirement_id=' + requirement.requirement_id },
      change_targets: item.change_items.map(row => row.path),
      tests: item.proof_obligations.filter(row => row.proof_type === 'FUNCTIONAL_TEST').map(row => impactPaths.get(row.target_test_impact_id)).filter(Boolean),
      proof_required: [...new Set(item.proof_obligations.map(row => row.proof_type))], status: 'DEFINED' };
  });
  const requirementContract = Requirements.buildRequirementContract(fullMatrix, nonUi, new Set(planContract.boundaries.write_scope.map(row => row.path)));
  const json = value => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
  const tagged = (tag, value) => ['<' + tag + '>', json(value), '</' + tag + '>'];
  return [
    '# KODJO VNext — Projection transport du plan',
    '',
    'application_head=' + executionRequest.application_head,
    'plan_contract_hash=' + executionRequest.plan_contract_hash,
    '',
    Plan.renderMarkdown(planContract).trimEnd(),
    '<KODJO_UI_CRITERIA_MATRIX_JSON>', json(matrix), '</KODJO_UI_CRITERIA_MATRIX_JSON>',
    '<KODJO_UI_PLAN_CONTRACT_JSON>', json(contract), '</KODJO_UI_PLAN_CONTRACT_JSON>',
    ...(preservation ? tagged('KODJO_VNEXT_DELIVERY_PRESERVATION_JSON', preservation) : []),
    ...tagged('KODJO_VNEXT_SCOPE_JSON', {schema: 'kodjo.vnext.downstream-scope.v1', plan_contract_hash: planContract.contract_hash, scope_allow: planContract.boundaries.write_scope.map(row => row.path)}),
    ...tagged('KODJO_NON_UI_REQUIREMENTS_JSON', nonUi),
    ...tagged('KODJO_REQUIREMENT_CONTRACT_JSON', requirementContract),
    ...tagged('KODJO_TEST_CONTRACT_JSON', Requirements.buildTestContract(requirementContract)),
    ...tagged('KODJO_BOUNDARY_CONTRACT_JSON', Requirements.buildBoundaryContract(matrix)),
    ...tagged('KODJO_VNEXT_REQUIREMENT_REGISTRY_JSON', requirementRegistry),
    ...(uiAtomicityContract ? ['<KODJO_VNEXT_UI_ATOMICITY_JSON>', json(uiAtomicityContract), '</KODJO_VNEXT_UI_ATOMICITY_JSON>'] : []),
    '',
  ].join('\n');
}

function renderCompatibilityReview(executionRequest, reviewReport, planPath) {
  safeRelativePath(planPath, 'VNEXT_QUEUE_PLAN_PATH_INVALID', 'plan_path');
  const planName = planPath.split('/').pop();
  return [
    '# KODJO VNext — Projection transport de la revue',
    '',
    'Plan revu : ' + planName,
    'review_report_hash=' + reviewReport.contract_hash,
    'plan_contract_hash=' + reviewReport.plan_contract_hash,
    '',
    'Verdict: APPROVED',
    '',
  ].join('\n');
}

function renderCompatibilityMission(executionRequest, planContract = null, planPath = null) {
  const scope = executionRequest.write_scope.map((row) => row.path);
  if (planContract && planContract.contract_hash !== executionRequest.plan_contract_hash) V.fail('VNEXT_QUEUE_MISSION_PLAN_MISMATCH');
  if (planPath !== null) safeRelativePath(planPath, 'VNEXT_QUEUE_PLAN_PATH_INVALID', 'plan_path');
  return [
    '# Mission d’implémentation — ' + executionRequest.slice_id,
    '',
    'plan_contract_hash=' + executionRequest.plan_contract_hash,
    'application_head=' + executionRequest.application_head,
    'operation_kind=IMPLEMENT',
    'execution_context=' + V.canonicalStringify(executionRequest.execution_context),
    ...executionRequest.native_primitive_decisions.map(row => 'native_primitive_decision=' + V.canonicalStringify(row)),
    'checks=' + executionRequest.checks.join(','),
    'Rapport obligatoire: lire les contrats UI et NON_UI du plan opposable. Produire KODJO_IMPLEMENTATION_CONFORMANCE avec criteria (vide si aucun critere UI), et KODJO_REQUIREMENT_CONFORMANCE avec chaque requirement_id NON_UI du KODJO_REQUIREMENT_CONTRACT_JSON, sans omission ni nouvel identifiant.',
    ...(planContract?.delivery_preservation ? ['Lire aussi KODJO_VNEXT_DELIVERY_PRESERVATION_JSON : couvrir tous les retained_criteria dans le rapport, avec preuves fraîches. Leurs change_targets historiques sont des références, jamais des autorisations d’écriture. Ne pas réutiliser une ancienne preuve comme preuve du nouveau HEAD.'] : []),
    'Chaque ligne NON_UI porte implementation_status, files_or_symbols (chemins exacts modifies), tests_run (noms des checks observes: jest, typescript, lint), proof_status et residual_status. Chaque ligne UI ajoute criterion_id, component_used et preserve_status. Aucun test non execute ne peut etre declare PASS.',
    'Encodage: <KODJO_IMPLEMENTATION_CONFORMANCE>{"criteria":[]}</KODJO_IMPLEMENTATION_CONFORMANCE> et <KODJO_REQUIREMENT_CONFORMANCE>{"requirements":[{"requirement_id":"identifiant exact du plan","implementation_status":"IMPLEMENTED","files_or_symbols":["chemin exact"],"tests_run":["check observe"],"proof_status":"preuve observee","residual_status":"NONE ou risque reel"}]}</KODJO_REQUIREMENT_CONFORMANCE>. Les valeurs du modele illustratif ne sont jamais des preuves.',
    'Terminer par exactement une ligne KODJO_STOP_STATUS: NONE, ou un des arrets opposables si necessaire: CHANGE_REQUEST_REQUIRED, SCOPE_EXPANSION_REQUIRED, NATIVE_PRIMITIVE_EXCEPTION_REQUIRED, CLARIFICATION_REQUIRED.',
    '',
    '## Autorisation',
    '',
    'Implémenter exclusivement le périmètre autorisé par l’ExecutionRequest VNext.',
    'Aucun élargissement de scope n’est autorisé.',
    'Le scope opposable de transport est exactement :',
    ...scope.map((p) => '- ' + p),
    '',
    'Tout besoin hors scope doit arrêter l’exécution avant modification.',
    'Toute substitution native sans autorisation explicite doit arrêter en NATIVE_PRIMITIVE_EXCEPTION_REQUIRED avant code.',
    '',
    ...(planContract ? [
      '## Plan exact approuvé à exécuter', '',
      'Lire le plan opposable ' + planPath + ' avant toute modification. Sa projection exacte suit.',
      'Le plan impose les intentions, tests, preuves et préservations. Arrêter en CLARIFICATION_REQUIRED si une exigence est ambiguë.',
      Plan.renderMarkdown(planContract).trimEnd(), '',
    ] : []),
  ].join('\n');
}

// These immutable files must be published BEFORE approving their commit.
// Embedding the later ExecutionRequest (which contains that commit and approval)
// would require the commit to contain its own hash. The sealed queue projection
// carries the ExecutionRequest binding instead.
function prepareTransport(fields) {
  V.assertExactKeys(fields, ['slice_bootstrap_file', 'slice_bootstrap_sha256', 'plan_path', 'review_path', 'prompt_file'], [], 'VNEXT_PREPARATORY_TRANSPORT_KEYS_INVALID');
  for (const key of ['slice_bootstrap_file', 'plan_path', 'review_path', 'prompt_file']) safeRelativePath(fields[key], 'VNEXT_QUEUE_COMPATIBILITY_PATH_INVALID', key);
  V.assertSha64(fields.slice_bootstrap_sha256, 'VNEXT_QUEUE_BOOTSTRAP_HASH_INVALID');
  return { ...fields }; // No gate, request identity or approval exists at preparation.
}
function prepareCompatibilityFiles(args) {
  const { planContract, reviewReport, transport } = args;
  const request = Approval.buildExecutionCore(args);
  const bodies = {
    plan: [transport.plan_path, renderCompatibilityPlan(request, planContract, args.uiAtomicityContract, args.requirementRegistry, args.candidateManifest)],
    review: [transport.review_path, renderCompatibilityReview(request, reviewReport, transport.plan_path)],
    mission: [transport.prompt_file, renderCompatibilityMission(request, planContract, transport.plan_path)],
  };
  return Object.fromEntries(Object.entries(bodies).map(([kind, [filePath, content]]) => {
    safeRelativePath(filePath, 'VNEXT_QUEUE_COMPATIBILITY_PATH_INVALID', kind);
    return [kind, { path: filePath, blob_oid: gitBlobOid(content), content_sha256: V.sha256(content), content }];
  }));
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
    uiAtomicityContract = null, currentState, transport, resolveNativeEvidence = null,
  } = args;
  Approval.validateExecutionRequest(executionRequest, {
    approvalTarget, approvalRecord, planningEnvelope, requirementRegistry, impactGraph,
    candidateManifest, directImportScan, planContract, reviewContext, reviewReport,
    uiAtomicityContract, currentState, resolveNativeEvidence,
  });
  validateTransport(transport, executionRequest, approvalRecord);
  const issue = ISSUE_ID.exec(executionRequest.issue_id);
  if (executionRequest.execution_context.mode !== 'LOCAL'
      || !executionRequest.execution_context.writer_id.startsWith('CLAUDE:')) V.fail('VNEXT_QUEUE_WRITER_UNSUPPORTED');
  if (!issue) V.fail('VNEXT_QUEUE_ISSUE_ID_UNSUPPORTED', executionRequest.issue_id);

  const planBody = renderCompatibilityPlan(executionRequest, planContract, uiAtomicityContract, requirementRegistry, candidateManifest);
  const reviewBody = renderCompatibilityReview(executionRequest, reviewReport, transport.plan_path);
  const missionBody = renderCompatibilityMission(executionRequest, planContract, transport.plan_path);
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
    ...(executionRequest.execution_context.delivery_target ? { delivery_target: { ...executionRequest.execution_context.delivery_target } } : {}),
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
  if (!projection.compatibility_files.plan.content.includes(executionRequest.plan_contract_hash)
      || !projection.compatibility_files.review.content.includes(executionRequest.plan_contract_hash)
      || !projection.compatibility_files.mission.content.includes(executionRequest.plan_contract_hash)) {
    V.fail('VNEXT_QUEUE_COMPATIBILITY_PLAN_REFERENCE_MISSING');
  }
  const violations = validateQueueRequest(queue);
  if (violations.length) V.fail('VNEXT_QUEUE_PROJECTION_LEGACY_INVALID');
  const exactScope = executionRequest.write_scope.map((row) => row.path);
  if (V.canonicalStringify(queue.scope_allow) !== V.canonicalStringify(exactScope)) V.fail('VNEXT_QUEUE_SCOPE_WIDENING');
  if (V.canonicalStringify(queue.checks) !== V.canonicalStringify(executionRequest.checks)) V.fail('VNEXT_QUEUE_CHECK_DRIFT');
  if (queue.source_head !== executionRequest.protocol_head || queue.baseline_head !== executionRequest.baseline_head) V.fail('VNEXT_QUEUE_HEAD_DRIFT');
  if (V.canonicalStringify(queue.delivery_target || null) !== V.canonicalStringify(executionRequest.execution_context.delivery_target || null)) V.fail('VNEXT_QUEUE_DELIVERY_TARGET_DRIFT');
  if (projection.projection_guard.scope_sha256 !== V.canonicalHash(queue.scope_allow)
      || projection.projection_guard.checks_sha256 !== V.canonicalHash(queue.checks)
      || projection.projection_guard.application_head !== executionRequest.application_head
      || projection.projection_guard.protocol_head !== executionRequest.protocol_head) V.fail('VNEXT_QUEUE_PROJECTION_GUARD_MISMATCH');
  return true;
}

function verifyCompatibilityFilesAtApprovedCommit(projection, executionRequest, { cwd }) {
  validateLegacyQueueProjection(projection, executionRequest);
  for (const [kind, file] of Object.entries(projection.compatibility_files)) {
    safeRelativePath(file.path, 'VNEXT_QUEUE_COMPATIBILITY_PATH_INVALID', kind);
    let actual;
    try {
      actual = execFileSync('git', ['show', executionRequest.protocol_head + ':' + file.path],
        { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024 });
    } catch (_) { V.fail('VNEXT_QUEUE_APPROVED_FILE_UNAVAILABLE', kind); }
    if (!actual.equals(Buffer.from(file.content, 'utf8'))) V.fail('VNEXT_QUEUE_APPROVED_FILE_MISMATCH', kind);
  }
  return true;
}

module.exports = {
  SCHEMA, gitBlobOid, projectUi, renderCompatibilityPlan, renderCompatibilityReview,
  renderCompatibilityMission, prepareTransport, prepareCompatibilityFiles, buildLegacyQueueProjection, validateLegacyQueueProjection,
  verifyCompatibilityFilesAtApprovedCommit,
};
