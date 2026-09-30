'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const F = require('./helpers/vnext-planning-fixture');
const V = require('../../scripts/kodjo/lib/vnext-contract');
const Review = require('../../scripts/kodjo/lib/review-contract');
const Register = require('../../scripts/kodjo/lib/vnext-audit-register');
const Adapter = require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter');
const Approval = require('../../scripts/kodjo/lib/approval-handoff-contract');
const Admission = require('../../scripts/kodjo/lib/vnext-queue-admission');

function fixture() {
  const repo = F.fixtureRepo();
  const manifest = F.sourceManifest();
  const envelope = F.makeEnvelope(manifest, repo, 'INITIAL', null);
  const artifacts = F.buildPlanningArtifacts({ repo, manifest, envelope });
  const reviewReport = Review.buildReviewReport({ reviewContext: artifacts.reviewContext, semanticReview: { findings: [] } });
  let state = { ...F.currentState(repo), protocol_head: repo.revision };
  const transport = F.transport();
  const bootstrap = { slice_id: envelope.slice_id, issue_number: 999, repository: 'MyUncried/Application-Routine',
    slice_bootstrap_sha256: transport.slice_bootstrap_sha256, authorized_actors: [],
    activation_registry: '.github/orchestration/v2-activation-registry.json' };
  const files = Adapter.prepareCompatibilityFiles({ ...artifacts, reviewReport, currentState: state, transport });
  function write(file, content) {
    fs.mkdirSync(path.dirname(path.join(repo.cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(repo.cwd, file), content, 'utf8');
  }
  write(transport.slice_bootstrap_file, JSON.stringify(bootstrap));
  write(bootstrap.activation_registry, JSON.stringify({ activations: [{ slice_id: envelope.slice_id, status: 'ACTIVE', issue_number: 999 }] }));
  for (const file of Object.values(files)) write(file.path, file.content);
  execFileSync('git', ['add', '.'], { cwd: repo.cwd });
  execFileSync('git', ['commit', '-m', 'pre-approval immutable transport'], { cwd: repo.cwd });
  state = { ...state, protocol_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo.cwd, encoding: 'utf8' }).trim() };
  const approved = F.approve(artifacts, reviewReport, state);
  const cumulativeRegister = Register.buildRegister({ candidateHead: state.protocol_head, lot: envelope.slice_id,
    phase: 'HANDOFF', authorizedActor: 'MyUncried', revisionCount: 0, revisionLimit: 1, observations: [] });
  const complete = { ...artifacts, reviewReport, ...approved, currentState: state, cumulativeRegister };
  const projection = Adapter.buildLegacyQueueProjection({ ...complete, transport });
  const queueFile = 'queue-fixture.json';
  write(queueFile, JSON.stringify(projection.legacy_queue_request));
  const github = {
    comment: () => ({ id: 12345, issue_url: 'https://api.github.com/repos/MyUncried/Application-Routine/issues/999',
      updated_at: '2026-09-30T00:28:00.000Z',
      body: state.protocol_head + '\n' + Approval.renderApprovalMessage(approved.approvalTarget) }),
    reactions: () => [{ content: '+1', user: { login: 'MyUncried' }, created_at: '2026-09-30T00:29:00.000Z' }],
  };
  return { repo, artifacts: complete, transport, files, projection, queueFile, github, write };
}

test('queue admission: pre-approval Git files stay identical after exact commit approval and reach the real consumer', () => {
  const f = fixture();
  try {
    assert.deepEqual(f.files, f.projection.compatibility_files);
    assert.equal(Admission.verifyQueueAdmission(f).status, 'AUTHORIZED');
    // Checkout edits are not evidence for the immutable Git bytes.
    f.write(f.transport.plan_path, 'locally modified\r\n');
    assert.equal(Admission.verifyQueueAdmission(f).status, 'AUTHORIZED');
  } finally { fs.rmSync(f.repo.cwd, { recursive: true, force: true }); }
});

test('queue admission: approval evidence must authenticate the exact target and owner reaction', () => {
  const f = fixture();
  try {
    const comment = f.github.comment();
    for (const execution_context of [{ mode: 'CLOUD', writer_id: 'CLAUDE:fixture-writer' }, { mode: 'LOCAL', writer_id: 'CODEX:fixture-writer' }]) {
      const state = { ...f.artifacts.currentState, execution_context };
      const planning = { ...f.artifacts };
      delete planning.approvalTarget; delete planning.approvalRecord; delete planning.executionRequest;
      const approved = F.approve(planning, f.artifacts.reviewReport, state);
      assert.throws(() => Adapter.buildLegacyQueueProjection({ ...f.artifacts, ...approved, currentState: state, transport: f.transport }), /WRITER_UNSUPPORTED/);
    }
    assert.throws(() => Admission.verifyQueueAdmission({ ...f, github: { ...f.github,
      comment: () => ({ ...comment, body: f.artifacts.currentState.protocol_head + '\n' + f.artifacts.approvalTarget.contract_hash }) } }), /WRITER_NOT_EXPLICIT/);
    assert.throws(() => Admission.verifyQueueAdmission({ ...f, github: { ...f.github,
      comment: () => ({ ...comment, body: f.artifacts.currentState.protocol_head }) } }), /EXACT_TARGET_ABSENT/);
    assert.throws(() => Admission.verifyQueueAdmission({ ...f, github: { ...f.github, reactions: () => [] } }), /REACTION_NOT_BOUND/);
    assert.throws(() => Admission.verifyQueueAdmission({ ...f, github: { ...f.github,
      comment: () => ({ ...comment, updated_at: '2026-09-30T00:29:30.000Z' }) } }), /REACTION_NOT_BOUND/);
  } finally { fs.rmSync(f.repo.cwd, { recursive: true, force: true }); }
});

test('queue admission: missing committed mission, altered queue and resealed projection are refused', () => {
  const f = fixture();
  try {
    const changed = structuredClone(f.projection);
    changed.compatibility_files.mission.content += 'forged\n';
    const file = changed.compatibility_files.mission;
    file.content_sha256 = V.sha256(file.content); file.blob_oid = Adapter.gitBlobOid(file.content);
    delete changed.contract_hash;
    const forged = V.sealContract(changed);
    assert.throws(() => Admission.verifyQueueAdmission({ ...f, projection: forged }), /PROJECTION_REBUILD_MISMATCH/);
    assert.throws(() => Adapter.verifyCompatibilityFilesAtApprovedCommit(forged, f.artifacts.executionRequest, { cwd: f.repo.cwd }), /APPROVED_FILE_MISMATCH/);
    const absent = structuredClone(f.projection);
    absent.compatibility_files.mission.path = 'absent.md'; absent.legacy_queue_request.prompt_file = 'absent.md';
    delete absent.contract_hash;
    assert.throws(() => Adapter.verifyCompatibilityFilesAtApprovedCommit(V.sealContract(absent), f.artifacts.executionRequest, { cwd: f.repo.cwd }), /APPROVED_FILE_UNAVAILABLE/);
    f.write(f.queueFile, JSON.stringify({ ...f.projection.legacy_queue_request, scope_allow: ['other.js'] }));
    assert.throws(() => Admission.verifyQueueAdmission(f), /REQUEST_MISMATCH/);
  } finally { fs.rmSync(f.repo.cwd, { recursive: true, force: true }); }
});
