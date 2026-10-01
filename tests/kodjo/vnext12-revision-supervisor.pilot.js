'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const Driver = require('../../scripts/kodjo/prepare-vnext12-revision');
const Chain = require('../../scripts/kodjo/lib/vnext-live-chain');
const V = require('../../scripts/kodjo/lib/vnext-contract');
const F = require('./helpers/vnext-planning-fixture');
const Approval = require('../../scripts/kodjo/lib/approval-handoff-contract');
const ROOT = path.resolve(__dirname, '../..');
function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext12-revision-test-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.test');
  for (const p of ['scripts/kodjo', 'tests/fixtures/vnext12', '.github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md', '.github/orchestration/vnext12/VNEXT-12-QUALIF/request.json', '.github/orchestration/v2-slices/VNEXT-12-QUALIF/slice-bootstrap.json', '.github/orchestration/v2-activation-registry.json']) {
    fs.mkdirSync(path.dirname(path.join(cwd, p)), { recursive: true });
    fs.cpSync(path.join(ROOT, p), path.join(cwd, p), { recursive: true });
  }
  git('add', '.'); git('commit', '-m', 'fixture only; not campaign evidence');
  return cwd;
}
function receipt(cwd, produced, findings) {
  // Explicit fixture adapter: these receipts are never published as run proof.
  return Chain.review(produced, { cwd, claude: 'unit-test-only', invoke: () => JSON.stringify({
    type: 'result', session_id: 'UNIT-TEST-ONLY', structured_output: { semantic_review: { findings }, native_assessment_observations: [] } }) });
}
function setup(t) {
  const cwd = fixture(t), base = Chain.produce(Driver.benchmarkRecipe(cwd), { cwd });
  const report = receipt(cwd, base, [{ category: 'PLAN_GAP', target_type: 'PLAN_ITEM',
    target_id: base.artifacts.planContract.plan_items[0].plan_item_id,
    finding: 'Les intentions 3 contredisent la source 2.', evidence: ['source Git et intentions'],
    required_correction: 'Corriger exclusivement les deux intentions pour obtenir 2.', dependency_target_ids: [] }]);
  const correction = Driver.deriveCorrection(cwd, base, report), next = Chain.produce(correction.recipe, { cwd });
  return { cwd, base, report, correction, next };
}
test('revision supervisor preserves immutable source, scope and causal findings through exactly one correction', t => {
  const f = setup(t), nextReceipt = receipt(f.cwd, f.next, []);
  const artifacts = Driver.completeRevision(f.base, f.report, f.correction, f.next, nextReceipt);
  assert.equal(artifacts.revision_outcome.status, 'RESOLVED');
  assert.equal(f.next.artifacts.planningEnvelope.planning_mode, 'REVISION');
  assert.equal(f.next.register_input.revisionCount, 1);
  assert.deepEqual(f.next.artifacts.planContract.boundaries, f.base.artifacts.planContract.boundaries);
  assert.deepEqual(f.next.artifacts.planningEnvelope.source_manifest, f.base.artifacts.planningEnvelope.source_manifest);
  assert.equal(f.next.artifacts.revisionArtifacts, null, 'post-review outcome must not mutate the reviewed produced object');
});
test('revision publication prepares an exact new dossier and preserves all other registered slices', t => {
  const f = setup(t), nextReceipt = receipt(f.cwd, f.next, []);
  const bundle = Driver.completeRevision(f.base, f.report, f.correction, f.next, nextReceipt);
  const ready = Driver.preparePublication(f.cwd, f.base, f.report, f.next, nextReceipt, bundle);
  const oldRegistry = JSON.parse(fs.readFileSync(path.join(f.cwd, '.github/orchestration/v2-activation-registry.json'), 'utf8'));
  const newRegistry = JSON.parse(ready.publication.find(x => x.path === '.github/orchestration/v2-activation-registry.json').content);
  assert.deepEqual(newRegistry.activations.filter(x => x.slice_id !== 'VNEXT-12-QUALIF'), oldRegistry.activations.filter(x => x.slice_id !== 'VNEXT-12-QUALIF'));
  assert.equal(ready.transport.gate_ref, 'issue_comment:1', 'placeholder is not an operational approval');
  assert.equal(ready.prepared.produced.artifacts.planningEnvelope.planning_mode, 'REVISION');
  assert.equal(Chain.approvalTarget(ready.prepared, { cwd: f.cwd, protocolHead: f.next.producer_revision }).execution_core.planning_mode, 'REVISION');
  for (const row of ready.publication) {
    fs.mkdirSync(path.dirname(path.join(f.cwd, row.path)), { recursive: true });
    fs.writeFileSync(path.join(f.cwd, row.path), row.content);
  }
  const git = (...args) => execFileSync('git', args, { cwd: f.cwd, encoding: 'utf8' }).trim();
  git('add', '.'); git('commit', '-m', 'unit fixture revision dossier; no operational approval');
  const head = git('rev-parse', 'HEAD'), target = Chain.approvalTarget(ready.prepared, { cwd: f.cwd, protocolHead: head });
  const github = { comment: () => ({ id: 1, issue_url: 'https://api.github.com/repos/MyUncried/Application-Routine/issues/269',
    updated_at: '2026-09-30T00:28:00.000Z', body: head + '\n' + Approval.renderApprovalMessage(target) }),
  reactions: () => [{ id: 2, content: '+1', user: { login: 'MyUncried' }, created_at: '2026-09-30T00:29:00.000Z' }] };
  const tr = ready.transport;
  const seed = { slice_id: 'VNEXT-12-QUALIF', issue_number: 269, source_head: head,
    slice_bootstrap_file: tr.slice_bootstrap_file, slice_bootstrap_sha256: tr.slice_bootstrap_sha256,
    authorized_plan: { plan_path: tr.plan_path }, independent_review: { review_path: tr.review_path },
    prompt_file: tr.prompt_file, user_gate: { gate_ref: tr.gate_ref }, request_id: tr.request_id, created_at: tr.created_at };
  const derived = Chain.deriveQueue(seed, { cwd: f.cwd, github });
  assert.equal(derived.artifacts.cumulativeRegister.revision_count, 1);
  fs.writeFileSync(path.join(f.cwd, 'queue.json'), JSON.stringify(derived.projection.legacy_queue_request));
  assert.equal(Chain.admit('queue.json', { cwd: f.cwd, github }).admission.status, 'AUTHORIZED');
  assert.throws(() => Chain.admit('queue.json', { cwd: f.cwd, github: { ...github, reactions: () => [] } }), /OWNER_APPROVAL_REQUIRED/);
});
test('revision supervisor refuses an approved negative benchmark instead of inventing a REVISE', t => {
  const cwd = fixture(t), base = Chain.produce(Driver.benchmarkRecipe(cwd), { cwd });
  assert.throws(() => Driver.deriveCorrection(cwd, base, receipt(cwd, base, [])), /EXPECTED_REAL_REVISE/);
});
test('revision supervisor refuses a corrected plan still rejected by the reviewer', t => {
  const f = setup(t);
  const rejected = receipt(f.cwd, f.next, [{ category: 'PLAN_GAP', target_type: 'PLAN_ITEM',
    target_id: f.next.artifacts.planContract.plan_items[0].plan_item_id, finding: 'Défaut encore présent.',
    evidence: ['unit fixture'], required_correction: 'Ne pas poursuivre.', dependency_target_ids: [] }]);
  assert.throws(() => Driver.completeRevision(f.base, f.report, f.correction, f.next, rejected), /LIVE_REVIEW_NOT_APPROVED/);
});
test('revision supervisor refuses an unrelated change outside the authorized plan correction', t => {
  const f = setup(t);
  const recipe = structuredClone(f.correction.recipe);
  recipe.classifications[0].impact_reason = 'Changement étranger à la correction autorisée.';
  const next = Chain.produce(recipe, { cwd: f.cwd });
  assert.throws(() => Driver.completeRevision(f.base, f.report, f.correction, next, receipt(f.cwd, next, [])), /PRESERV/);
});
test('live revision handoff binds both real-format receipts without rewriting the reviewed proposal', t => {
  const f = setup(t), nextReceipt = receipt(f.cwd, f.next, []);
  const bundle = Driver.completeRevision(f.base, f.report, f.correction, f.next, nextReceipt);
  const evidence = { base_produced: f.base, base_review_receipt: f.report, revision_artifacts: bundle };
  const ready = Chain.prepare(f.next, nextReceipt, F.transport(), { cwd: f.cwd, revisionEvidence: evidence });
  const a = Chain.preparedArtifacts(ready.prepared, f.cwd, f.next.producer_revision);
  assert.deepEqual(a.revisionArtifacts, bundle);
  assert.equal(ready.prepared.produced.contract_hash, f.next.contract_hash);
  assert.equal(nextReceipt.produced_chain_hash, f.next.contract_hash);
  assert.throws(() => Chain.prepare(f.next, nextReceipt, F.transport(), { cwd: f.cwd }), /REVISION_EVIDENCE_REQUIRED/);
  const tampered = structuredClone(ready.prepared);
  tampered.revision_evidence.base_review_receipt.session_id = 'forged-session';
  delete tampered.revision_evidence.base_review_receipt.contract_hash;
  tampered.revision_evidence.base_review_receipt = V.sealContract(tampered.revision_evidence.base_review_receipt);
  delete tampered.contract_hash;
  assert.throws(() => Chain.preparedArtifacts(V.sealContract(tampered), f.cwd, f.next.producer_revision), /RECEIPT_RESULT_INVALID/);
  const wrongBase = structuredClone(ready.prepared);
  wrongBase.revision_evidence.revision_artifacts.base_artifacts.planContract = f.next.artifacts.planContract;
  delete wrongBase.contract_hash;
  assert.throws(() => Chain.preparedArtifacts(V.sealContract(wrongBase), f.cwd, f.next.producer_revision), /BASE_ARTIFACTS_MISMATCH/);
  const wrongOutcome = structuredClone(ready.prepared);
  wrongOutcome.revision_evidence.revision_artifacts.revision_outcome.preserved_target_count = 0;
  delete wrongOutcome.revision_evidence.revision_artifacts.revision_outcome.contract_hash;
  wrongOutcome.revision_evidence.revision_artifacts.revision_outcome = V.sealContract(wrongOutcome.revision_evidence.revision_artifacts.revision_outcome);
  delete wrongOutcome.contract_hash;
  assert.throws(() => Chain.preparedArtifacts(V.sealContract(wrongOutcome), f.cwd, f.next.producer_revision), /OUTCOME_MISMATCH/);
});
