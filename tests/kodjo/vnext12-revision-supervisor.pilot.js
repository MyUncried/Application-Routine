'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const Driver = require('../../scripts/kodjo/prepare-vnext12-revision');
const Chain = require('../../scripts/kodjo/lib/vnext-live-chain');
const ROOT = path.resolve(__dirname, '../..');
function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext12-revision-test-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.test');
  for (const p of ['scripts/kodjo', 'tests/fixtures/vnext12', '.github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md', '.github/orchestration/vnext12/VNEXT-12-QUALIF/request.json']) {
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
