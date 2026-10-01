'use strict';

// Production boundary: Git bytes, a real read-only Claude process and fresh
// authenticated GitHub observations. No default fixture or offline approval.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const V = require('./vnext-contract');
const Source = require('./source-manifest');
const Envelope = require('./planning-envelope');
const Requirements = require('./requirement-registry');
const Impact = require('./impact-graph');
const Plan = require('./plan-contract');
const Ui = require('./ui-atomicity-contract');
const Review = require('./review-contract');
const Approval = require('./approval-handoff-contract');
const Register = require('./vnext-audit-register');
const Revision = require('./revision-contract');
const Convergence = require('./audit-convergence-contract');
const Adapter = require('./vnext-legacy-queue-adapter');
const Admission = require('./vnext-queue-admission');
const Auth = require('../verify-authorizations');
const GithubApproval = require('./vnext-github-approval');

const SCHEMA = 'kodjo.vnext.prepared-chain.v1';
function command(bin, args, cwd, input, env = process.env) {
  const r = spawnSync(bin, args, { cwd, input, env, encoding: 'utf8', shell: false,
    windowsHide: true, timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
  if (r.error || r.status !== 0) V.fail('VNEXT_LIVE_PROCESS_FAILED', bin + ': ' + (r.error?.message || r.stderr));
  return String(r.stdout);
}
function git(cwd, ...args) { return command('git', args, cwd); }
function relative(file) {
  if (typeof file !== 'string' || !file || file.includes('\\') || path.posix.isAbsolute(file)
      || /^[A-Za-z]:/.test(file) || file.split('/').some(p => !p || p === '.' || p === '..')) V.fail('VNEXT_LIVE_PATH_INVALID');
  return file;
}
function readGit(cwd, head, file) {
  V.assertSha40(head, 'VNEXT_LIVE_HEAD_INVALID');
  return git(cwd, 'show', head + ':' + relative(file));
}
function unitText(content, locator) {
  if (locator === 'FULL_FILE') return content;
  const m = /^L([1-9][0-9]*)-L([1-9][0-9]*)$/.exec(locator);
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  if (!m || +m[1] > +m[2] || +m[2] > lines.length) V.fail('VNEXT_SOURCE_UNIT_OBSERVATION_REQUIRED', locator);
  return lines.slice(+m[1] - 1, +m[2]).join('\n');
}
function observeSources(manifest, cwd, github = Auth.ghClient()) {
  Source.validate(manifest);
  return manifest.sources.map(source => {
    let content;
    if (source.source_kind === 'GITHUB_COMMENT') {
      const m = /^github_issue_comment:([^#]+)#([1-9][0-9]*)$/.exec(source.locator);
      if (!m) V.fail('VNEXT_SOURCE_COMMENT_LOCATOR_INVALID');
      const comment = github.comment(m[1], m[2]);
      if (String(comment.id) !== m[2] || comment.updated_at !== source.revision) V.fail('VNEXT_SOURCE_COMMENT_STALE');
      content = String(comment.body);
    } else {
      // External snapshots must first be frozen by their source adapter. They
      // are not silently attested by a path or a declarative VERIFIED flag.
      if (source.source_kind === 'FIGMA' || source.source_kind === 'OTHER') V.fail('WAIT_FOR_PROOF', source.locator);
      content = readGit(cwd, source.revision, source.locator);
    }
    if (V.sha256(content) !== source.fingerprint) V.fail('VNEXT_SOURCE_OBSERVATION_HASH_MISMATCH', source.locator);
    for (const unit of source.units) if (V.sha256(unitText(content, unit.locator)) !== unit.fingerprint) V.fail('VNEXT_SOURCE_UNIT_OBSERVATION_MISMATCH', unit.unit_id);
    return { source_id: source.source_id, revision: source.revision, fingerprint: source.fingerprint, content };
  });
}

function observeCandidates(artifacts, cwd) {
  const ids = new Set([...artifacts.planContract.boundaries.write_scope, ...artifacts.planContract.boundaries.preserve_scope].map(r => r.candidate_id));
  return artifacts.candidateManifest.candidates.filter(c => ids.has(c.candidate_id)).map(c => ({
    candidate_id: c.candidate_id, path: c.path, revision: artifacts.candidateManifest.revision,
    content: c.origin === 'CREATE_SLOT_POLICY' ? null : readGit(cwd, artifacts.candidateManifest.revision, c.path),
  }));
}

// Recipe fields are constructor inputs, not pre-approved serialized contracts.
function produce(recipe, { cwd, github } = {}) {
  const sourceManifest = Source.build(recipe.sourceManifestInput);
  const sourceObservations = observeSources(sourceManifest, cwd, github);
  const planningEnvelope = Envelope.build({ ...recipe.planningInput, source_manifest: sourceManifest });
  const requirementRegistry = Requirements.build({ ...recipe.requirementInput,
    planning_envelope_hash: planningEnvelope.contract_hash, source_manifest: sourceManifest });
  Requirements.assertReady(requirementRegistry);
  const candidateManifest = Impact.buildCandidateManifest({ cwd, revision: planningEnvelope.application_head, createSlots: recipe.createSlots || [] });
  const roots = [...new Set(recipe.classifications.filter(c => c.change_kind === 'MODIFY')
    .map(c => c.candidate_id))].filter(id => candidateManifest.candidates.some(c => c.candidate_id === id
      && c.origin === 'GIT_TREE' && c.candidate_kind === 'CODE' && /\.(?:js|jsx|ts|tsx|mjs|cjs)$/.test(c.path)));
  const directImportScan = roots.length ? Impact.scanOneLevelDirectImporters({ cwd, candidateManifest,
    modifyCandidateIds: roots }) : null;
  const impactGraph = Impact.buildImpactGraph({ requirementRegistry, candidateManifest, directImportScan, classifications: recipe.classifications });
  const planContract = Plan.buildPlanContract({ requirementRegistry, candidateManifest, impactGraph, requirementPlans: recipe.requirementPlans });
  const uiAtomicityContract = recipe.uiInput ? Ui.buildUiAtomicityContract({ ...recipe.uiInput,
    requirementRegistry, candidateManifest, impactGraph, planContract }) : null;
  const artifacts = { planningEnvelope, requirementRegistry, candidateManifest, directImportScan,
    impactGraph, planContract, uiAtomicityContract, revisionArtifacts: recipe.revisionArtifacts || null };
  const reviewContext = Review.buildReviewContext(artifacts);
  const producerRevision = git(cwd, 'rev-parse', 'HEAD').trim();
  const reviewerPacket = Review.buildReviewerPacket({ root: cwd, revision: producerRevision, reviewContext });
  return V.sealContract({ schema_version: 'kodjo.vnext.produced-chain.v1', producer_revision: producerRevision,
    artifacts: { ...artifacts, reviewContext }, source_observations: sourceObservations,
    candidate_observations: observeCandidates(artifacts, cwd),
    reviewer_packet: reviewerPacket, execution_context: recipe.executionContext,
    native_assessments: (recipe.nativeAssessments || []).map(row => ({ ...row, evidence_refs: [...row.evidence_refs].sort() })), register_input: recipe.registerInput });
}

function verifyProduced(produced, cwd, github) {
  V.verifyContractHash(produced, 'VNEXT_PRODUCED_CHAIN_HASH_INVALID');
  if (produced.schema_version !== 'kodjo.vnext.produced-chain.v1') V.fail('VNEXT_PRODUCED_CHAIN_SCHEMA_INVALID');
  const a = produced.artifacts;
  Envelope.validate(a.planningEnvelope);
  Requirements.validate(a.requirementRegistry, a.planningEnvelope.source_manifest);
  Impact.verifyCandidateManifestAtHead(a.candidateManifest, { cwd });
  if (a.directImportScan) Impact.verifyDirectImportScanAtHead(a.directImportScan, a.candidateManifest, { cwd });
  Impact.validateImpactGraph(a.impactGraph, a);
  Plan.validatePlanContract(a.planContract, a);
  if (a.uiAtomicityContract) Ui.validateUiAtomicityContract(a.uiAtomicityContract, a);
  Review.verifyReviewContext(a.reviewContext, a);
  const packet = Review.buildReviewerPacket({ root: cwd, revision: produced.producer_revision, reviewContext: a.reviewContext });
  if (V.canonicalStringify(packet) !== V.canonicalStringify(produced.reviewer_packet)) V.fail('VNEXT_REVIEW_PRODUCER_PACKET_STALE');
  const observed = observeSources(a.planningEnvelope.source_manifest, cwd, github);
  if (V.canonicalStringify(observed) !== V.canonicalStringify(produced.source_observations)) V.fail('VNEXT_SOURCE_OBSERVATION_STALE');
  if (V.canonicalStringify(observeCandidates(a, cwd)) !== V.canonicalStringify(produced.candidate_observations)) V.fail('VNEXT_CANDIDATE_OBSERVATION_STALE');
  return a;
}

function review(produced, { cwd, claude = require('./claude-local').resolveClaudeBinary(), github, invoke = command } = {}) {
  const artifacts = verifyProduced(produced, cwd, github);
  const schema = { type: 'object', additionalProperties: false, required: ['semantic_review', 'native_assessment_observations'],
    properties: { semantic_review: Review.reviewerOutputSchema(artifacts.reviewContext),
      native_assessment_observations: { type: 'array', items: { type: 'object', additionalProperties: false,
        required: ['criterion_id', 'assessment_hash', 'verified', 'observed_git_evidence', 'reason'], properties: {
          criterion_id: { type: 'string' }, assessment_hash: { type: 'string' }, verified: { type: 'boolean' },
          observed_git_evidence: { type: 'array', items: { type: 'object', additionalProperties: false,
            required: ['path', 'revision', 'content_sha256'], properties: { path: { type: 'string' }, revision: { type: 'string' }, content_sha256: { type: 'string' } } } },
          reason: { type: 'string' } } } } } };
  // Windows limits the process command line. The full target catalog belongs
  // on stdin with the dossier, not in --json-schema. The transport schema only
  // omits the two unbounded enums; buildReviewReport below still checks every
  // target and dependency against the exact immutable review context.
  const transportSchema = JSON.parse(JSON.stringify(schema));
  const findingProperties = transportSchema.properties.semantic_review.properties.findings.items.properties;
  delete findingProperties.target_id.enum;
  delete findingProperties.dependency_target_ids.items.enum;
  const dossier = { output_schema: schema, produced, native_assessment_subjects: produced.native_assessments.map(assessment => ({ assessment, assessment_hash: V.canonicalHash(assessment) })), instructions: 'Revue indépendante de plan uniquement. Lire les objets Git exacts. Ne pas modifier le dépôt. Refuser une preuve non observée. Pour chaque assessment natif, vérifier le besoin fonctionnel, le choix natif et ses preuves effectives ; ne pas confondre référence et observation. Indiquer verified=false si la preuve ne peut être observée. Ceci ne constitue pas un audit FINAL.' };
  const checkoutSnapshot = () => V.canonicalHash({
    status: git(cwd, 'status', '--porcelain=v1', '-z'), diff: git(cwd, 'diff', 'HEAD', '--binary'),
    untracked: git(cwd, 'ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)
      .map(file => ({ file, hash: V.sha256(fs.readFileSync(path.join(cwd, file))) })),
  });
  const before = checkoutSnapshot();
  const env = { ...process.env };
  for (const key of ['GH_TOKEN', 'GITHUB_TOKEN', 'KODJO_LIVE_GH_TOKEN']) delete env[key];
  const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-review-'));
  fs.writeFileSync(path.join(configDir, 'mcp.json'), JSON.stringify({ mcpServers: {} }));
  fs.writeFileSync(path.join(configDir, 'settings.json'), JSON.stringify({ disableAllHooks: true }));
  let raw;
  try {
    raw = invoke(claude, ['-p', '--restricted', '--permission-mode', 'dontAsk', '--permission-prompts', 'none',
      '--output-format', 'json', '--tools', 'Read,Glob,Grep', '--allowedTools', 'Read,Glob,Grep',
      '--disallowedTools', 'mcp__*', '--strict-mcp-config', '--mcp-config', path.join(configDir, 'mcp.json'),
      '--settings', path.join(configDir, 'settings.json'), '--json-schema', JSON.stringify(transportSchema)], cwd, JSON.stringify(dossier), env);
  } finally { fs.rmSync(configDir, { recursive: true, force: true }); }
  if (checkoutSnapshot() !== before) V.fail('VNEXT_REVIEW_MUTATED_CHECKOUT');
  let result;
  try { result = JSON.parse(raw); } catch (_) { V.fail('VNEXT_REVIEW_OUTPUT_UNPARSEABLE'); }
  if (result.is_error || result.type !== 'result' || !result.session_id || !result.structured_output) V.fail('VNEXT_REVIEW_STRUCTURED_RESULT_REQUIRED');
  const report = Review.buildReviewReport({ reviewContext: artifacts.reviewContext, semanticReview: result.structured_output.semantic_review });
  return V.sealContract({ schema_version: 'kodjo.vnext.live-review-receipt.v1', produced_chain_hash: produced.contract_hash,
    reviewer_packet_hash: produced.reviewer_packet.contract_hash, review_report: report,
    session_id: result.session_id, raw_result: raw, raw_result_sha256: V.sha256(raw),
    native_observations: result.structured_output.native_assessment_observations });
}

function verifyReceipt(produced, receipt) {
  V.verifyContractHash(receipt, 'VNEXT_REVIEW_RECEIPT_HASH_INVALID');
  if (receipt.schema_version !== 'kodjo.vnext.live-review-receipt.v1'
      || receipt.produced_chain_hash !== produced.contract_hash || receipt.reviewer_packet_hash !== produced.reviewer_packet.contract_hash
      || V.sha256(receipt.raw_result) !== receipt.raw_result_sha256) V.fail('VNEXT_REVIEW_RECEIPT_BINDING_MISMATCH');
  const raw = JSON.parse(receipt.raw_result);
  if (raw.is_error || raw.type !== 'result' || raw.session_id !== receipt.session_id || !raw.structured_output) V.fail('VNEXT_REVIEW_RECEIPT_RESULT_INVALID');
  const report = Review.buildReviewReport({ reviewContext: produced.artifacts.reviewContext, semanticReview: raw.structured_output.semantic_review });
  if (V.canonicalStringify(report) !== V.canonicalStringify(receipt.review_report)
      || V.canonicalStringify(raw.structured_output.native_assessment_observations) !== V.canonicalStringify(receipt.native_observations)) V.fail('VNEXT_REVIEW_RECEIPT_RESULT_MISMATCH');
  return report;
}
function validateReceipt(produced, receipt) {
  const report = verifyReceipt(produced, receipt);
  if (report.verdict !== 'APPROVE') V.fail('VNEXT_LIVE_REVIEW_NOT_APPROVED', report.verdict);
}

function revisionEvidenceArtifacts(prepared, artifacts, cwd, github) {
  const evidence = prepared.revision_evidence;
  if (artifacts.planningEnvelope.planning_mode === 'INITIAL') {
    if (evidence) V.fail('VNEXT_LIVE_INITIAL_REVISION_EVIDENCE_FORBIDDEN');
    return artifacts;
  }
  if (!evidence) V.fail('VNEXT_LIVE_REVISION_EVIDENCE_REQUIRED');
  V.assertExactKeys(evidence, ['base_produced', 'base_review_receipt', 'revision_artifacts'], [], 'VNEXT_LIVE_REVISION_EVIDENCE_KEYS_INVALID');
  const base = verifyProduced(evidence.base_produced, cwd, github);
  const previousReport = verifyReceipt(evidence.base_produced, evidence.base_review_receipt);
  if (previousReport.verdict !== 'REVISE' || base.planningEnvelope.planning_mode !== 'INITIAL') V.fail('VNEXT_LIVE_REVISION_BASE_NOT_REVISE');
  // The later outcome is separate from the immutable bytes actually reviewed.
  if (artifacts.revisionArtifacts !== null) V.fail('VNEXT_LIVE_REVIEWED_OUTCOME_MUST_BE_SEPARATE');
  const bundle = evidence.revision_artifacts;
  V.assertExactKeys(bundle, ['base_artifacts', 'allowed_change_set', 'revision_patch', 'revision_outcome', 'previous_review_report', 'finding_ledger'], [], 'VNEXT_LIVE_REVISION_ARTIFACT_KEYS_INVALID');
  const previous = Register.buildRegister({ ...evidence.base_produced.register_input,
    candidateHead: evidence.base_produced.producer_revision, lot: base.planningEnvelope.slice_id, phase: 'REVIEW' });
  const exact = (x, y, code) => { if (V.canonicalStringify(x) !== V.canonicalStringify(y)) V.fail(code); };
  exact(bundle.base_artifacts, { ...base, cumulativeRegister: previous }, 'VNEXT_LIVE_REVISION_BASE_ARTIFACTS_MISMATCH');
  exact(bundle.previous_review_report, previousReport, 'VNEXT_LIVE_REVISION_BASE_REVIEW_MISMATCH');
  exact(prepared.produced.register_input.previous, previous, 'VNEXT_LIVE_REVISION_PREVIOUS_REGISTER_MISMATCH');
  const nextRegister = Register.buildRegister({ ...prepared.produced.register_input,
    candidateHead: prepared.produced.producer_revision, lot: artifacts.planningEnvelope.slice_id, phase: 'REVISION' });
  if (nextRegister.revision_count !== previous.revision_count + 1 || nextRegister.revision_count > nextRegister.revision_limit) V.fail('VNEXT_LIVE_REVISION_BOUND_INVALID');
  const allowed = Revision.buildAllowedChangeSet({ ...base, reviewReport: previousReport });
  exact(bundle.allowed_change_set, allowed, 'VNEXT_LIVE_REVISION_ALLOWED_SET_MISMATCH');
  const outcome = Revision.verifyRevisionOutcome({ allowedChangeSet: allowed, revisionPatch: bundle.revision_patch,
    baseArtifacts: bundle.base_artifacts, nextArtifacts: { ...artifacts, cumulativeRegister: nextRegister },
    nextReviewContext: artifacts.reviewContext, nextReviewReport: prepared.review_receipt.review_report });
  exact(bundle.revision_outcome, outcome, 'VNEXT_LIVE_REVISION_OUTCOME_MISMATCH');
  if (outcome.status !== 'RESOLVED') V.fail('VNEXT_LIVE_REVISION_NOT_RESOLVED');
  const envelope = artifacts.planningEnvelope;
  if (envelope.base_plan_hash !== base.planContract.contract_hash || envelope.base_review_hash !== previousReport.contract_hash) V.fail('VNEXT_LIVE_REVISION_CAUSAL_BASE_MISMATCH');
  exact([...envelope.causal_findings].sort(), [...allowed.blocking_finding_ids].sort(), 'VNEXT_LIVE_REVISION_CAUSAL_FINDINGS_MISMATCH');
  Convergence.validateFindingLedger(bundle.finding_ledger, previousReport, prepared.review_receipt.review_report);
  return { ...artifacts, revisionArtifacts: bundle };
}

function nativeResolver(produced, receipt, cwd) {
  return (assessment, { sourceManifest, applicationHead }) => {
    const rows = receipt.native_observations.filter(x => x.criterion_id === assessment.criterion_id);
    if (rows.length !== 1 || rows[0].verified !== true || rows[0].assessment_hash !== V.canonicalHash(assessment)
        || !rows[0].reason || !rows[0].observed_git_evidence?.length) V.fail('WAIT_FOR_PROOF', assessment.criterion_id);
    for (const evidence of rows[0].observed_git_evidence) {
      if (evidence.revision !== applicationHead && !sourceManifest.sources.some(s => s.revision === evidence.revision)) V.fail('VNEXT_NATIVE_OBSERVATION_REVISION_MISMATCH');
      if (V.sha256(readGit(cwd, evidence.revision, evidence.path)) !== evidence.content_sha256) V.fail('VNEXT_NATIVE_OBSERVATION_BYTES_MISMATCH');
    }
    return V.sealContract({ schema_version: 'kodjo.vnext.native-assessment-evidence.v1', status: 'VERIFIED',
      native_assessment_hash: V.canonicalHash(assessment), source_manifest_hash: sourceManifest.contract_hash,
      application_head: applicationHead, evidence_ref: 'claude_session:' + receipt.session_id + '#' + receipt.contract_hash });
  };
}

function preparedArtifacts(prepared, cwd, protocolHead, github) {
  V.verifyContractHash(prepared, 'VNEXT_PREPARED_CHAIN_HASH_INVALID');
  V.assertExactKeys(prepared, ['schema_version', 'produced', 'review_receipt', 'contract_hash'], ['revision_evidence'], 'VNEXT_PREPARED_CHAIN_KEYS_INVALID');
  if (prepared.schema_version !== SCHEMA) V.fail('VNEXT_PREPARED_CHAIN_SCHEMA_INVALID');
  const observed = verifyProduced(prepared.produced, cwd, github);
  validateReceipt(prepared.produced, prepared.review_receipt);
  const a = revisionEvidenceArtifacts(prepared, observed, cwd, github);
  const state = { product_head: a.planningEnvelope.product_head, application_head: a.planningEnvelope.application_head,
    protocol_head: protocolHead, execution_context: prepared.produced.execution_context,
    native_primitive_decisions: prepared.produced.native_assessments };
  const resolveNativeEvidence = nativeResolver(prepared.produced, prepared.review_receipt, cwd);
  return { ...a, cwd, reviewReport: prepared.review_receipt.review_report, currentState: state, resolveNativeEvidence };
}

function prepare(produced, receipt, transport, { cwd, github, revisionEvidence } = {}) {
  const prepared = V.sealContract({ schema_version: SCHEMA, produced, review_receipt: receipt,
    ...(revisionEvidence ? { revision_evidence: revisionEvidence } : {}) });
  const a = preparedArtifacts(prepared, cwd, produced.producer_revision, github);
  return { prepared, compatibility_files: Adapter.prepareCompatibilityFiles({ ...a, transport }) };
}

function approvalTarget(prepared, { cwd, protocolHead, github } = {}) {
  return Approval.buildApprovalTarget(preparedArtifacts(prepared, cwd, protocolHead, github));
}

function deriveQueue(queue, { cwd, github = Auth.ghClient() } = {}) {
  const bootstrap = JSON.parse(readGit(cwd, queue.source_head, queue.slice_bootstrap_file));
  if (bootstrap.protocol !== 'VNEXT' || !bootstrap.vnext_chain_file) V.fail('VNEXT_CHAIN_BOOTSTRAP_REQUIRED');
  const prepared = JSON.parse(readGit(cwd, queue.source_head, bootstrap.vnext_chain_file));
  const a = preparedArtifacts(prepared, cwd, queue.source_head, github);
  if (a.planningEnvelope.slice_id !== bootstrap.slice_id) V.fail('VNEXT_CHAIN_SLICE_MISMATCH');
  const target = Approval.buildApprovalTarget(a);
  const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(a.planningEnvelope.issue_id);
  if (!issue || Number(issue[2]) !== queue.issue_number || bootstrap.repository !== issue[1]) V.fail('VNEXT_CHAIN_REPOSITORY_MISMATCH');
  const id = /^issue_comment:([1-9][0-9]*)$/.exec(queue.user_gate.gate_ref)?.[1];
  if (!id) V.fail('VNEXT_CHAIN_GATE_REQUIRED');
  const comment = github.comment(issue[1], id);
  const reactions = github.reactions(issue[1], id);
  const now = new Date().toISOString();
  const owner = issue[1].split('/')[0];
  const reaction = GithubApproval.verifyObservation({ repository: issue[1], issueNumber: issue[2],
    head: queue.source_head, target, gateRef: queue.user_gate.gate_ref, comment, reactions, observedAt: now });
  const approvalRecord = Approval.buildApprovalRecord({ approvalTarget: target, evidence: {
    decision: 'APPROVED', actor_id: owner, transport: 'GITHUB_REACTION', evidence_ref: queue.user_gate.gate_ref + '#reaction:' + reaction.id,
    approved_target_hash: target.contract_hash, observed_at: now,
    native_exception_approvals: target.execution_core.native_primitive_decisions.filter(r => r.availability === 'AVAILABLE' && r.primitive !== r.selected_primitive).map(r => r.criterion_id) } });
  const executionRequest = Approval.buildExecutionRequest({ ...a, approvalTarget: target, approvalRecord });
  const input = prepared.produced.register_input;
  if (!input || input.authorizedActor?.toLowerCase() !== owner.toLowerCase()) V.fail('VNEXT_CHAIN_REGISTER_AUTHORITY_REQUIRED');
  const cumulativeRegister = Register.buildRegister({ ...input, candidateHead: queue.source_head, lot: queue.slice_id, phase: 'HANDOFF' });
  const artifacts = { ...a, approvalTarget: target, approvalRecord, executionRequest, cumulativeRegister };
  const transport = { slice_bootstrap_file: queue.slice_bootstrap_file, slice_bootstrap_sha256: queue.slice_bootstrap_sha256,
    plan_path: queue.authorized_plan.plan_path, review_path: queue.independent_review.review_path, prompt_file: queue.prompt_file,
    gate_ref: queue.user_gate.gate_ref, request_id: queue.request_id, created_at: queue.created_at };
  const projection = Adapter.buildLegacyQueueProjection({ ...artifacts, transport });
  // Reuse a single fresh authenticated observation for all gates in this call.
  const observedApi = { ...github, comment: () => comment, reactions: () => reactions };
  return { artifacts, transport, github: observedApi, approvalTarget: target, approvalRecord, executionRequest, projection };
}

function admit(queueFile, { cwd, github = Auth.ghClient(), allowExternalQueueFile = false } = {}) {
  const queue = JSON.parse(fs.readFileSync(path.resolve(cwd, queueFile), 'utf8').replace(/^\uFEFF/, ''));
  const result = deriveQueue(queue, { cwd, github });
  const admission = Admission.verifyQueueAdmission({ queueFile, projection: result.projection,
    artifacts: result.artifacts, transport: result.transport, github: result.github, allowExternalQueueFile });
  return { admission, approvalTarget: result.approvalTarget, approvalRecord: result.approvalRecord,
    executionRequest: result.executionRequest, projection: result.projection };
}

function guard(queueFile, { cwd, github } = {}) {
  const queue = JSON.parse(fs.readFileSync(path.resolve(cwd, queueFile), 'utf8').replace(/^\uFEFF/, ''));
  // Detect the immutable VNext plan as well as the bootstrap marker. Removing
  // a working-copy flag cannot downgrade an approved VNext request to legacy.
  // Legacy malformed requests retain their original diagnostics. They cannot
  // establish a VNext authority because their immutable plan is unavailable.
  let bootstrap = {}, plan = '';
  try { bootstrap = JSON.parse(readGit(cwd, queue.source_head, queue.slice_bootstrap_file)); } catch (_) { /* verified by the legacy consumer */ }
  if (queue.authorized_plan?.approved_at_commit && queue.authorized_plan?.plan_path) {
    try { plan = readGit(cwd, queue.authorized_plan.approved_at_commit, queue.authorized_plan.plan_path); } catch (_) { /* legacy authorization refuses */ }
  }
  const marked = bootstrap.protocol === 'VNEXT' || bootstrap.vnext_chain_file !== undefined
    || plan.startsWith('# KODJO VNext — Projection transport du plan');
  return marked ? admit(queueFile, { cwd, github }) : null;
}

function guardLocalRequest(raw, { cwd, queueFile, github } = {}) {
  let bootstrap = {};
  try { bootstrap = JSON.parse(readGit(cwd, raw.protocol_source_head || raw.source_head, raw.slice_bootstrap_file)); }
  catch (_) { return null; /* normalizeRequest retains its mandatory identity checks */ }
  const marked = bootstrap.protocol === 'VNEXT' || bootstrap.vnext_chain_file !== undefined;
  if (!marked) return null;
  if (!queueFile) V.fail('VNEXT_LOCAL_QUEUE_AUTHORITY_REQUIRED');
  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8').replace(/^\uFEFF/, ''));
  const projected = JSON.parse(JSON.stringify(require('./queue-request').projectQueueRequest(queue)));
  if (V.canonicalStringify(projected) !== V.canonicalStringify(raw)) V.fail('VNEXT_LOCAL_QUEUE_PROJECTION_MISMATCH');
  return admit(queueFile, { cwd, github, allowExternalQueueFile: true });
}

module.exports = { SCHEMA, command, relative, readGit, unitText, observeSources, produce, verifyProduced,
  review, validateReceipt, nativeResolver, preparedArtifacts, prepare, approvalTarget, deriveQueue, admit, guard, guardLocalRequest };
