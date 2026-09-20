'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { verifyHandoffFreshness } = require('../../scripts/kodjo/materialize-approved-plan-handoff');
function fixture(t, initial = false) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-drift-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
  const write = (file, body) => { fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true }); fs.writeFileSync(path.join(cwd, file), body); };
  const commit = () => { git('add', '.'); git('commit', '-qm', 'fixture'); return git('rev-parse', 'HEAD'); };
  git('init', '-q'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test'); git('config', 'core.autocrlf', 'false');
  const bootstrapRel = '.github/orchestration/v2-slices/TEST/slice-bootstrap.json';
  const bootstrap = { target_branch: 'main', activation_registry: '.github/orchestration/v2-activation-registry.json', product_sources: [{ path: 'docs/product.md', sha256: crypto.createHash('sha256').update('product').digest('hex') }] };
  write(bootstrapRel, JSON.stringify(bootstrap)); write(bootstrap.activation_registry, '{}'); write('docs/product.md', 'product');
  for (const name of ['technical-plan', 'independent-review', 'planning-mission']) write('.github/orchestration/v2-slices/TEST/' + name + '.md', name);
  write('src/activity.ts', 'baseline'); write('package.json', '{}');
  const sourceHead = commit();
  if (!initial) write('src/activity.ts', 'already delivered PR delta');
  const applicationHead = initial ? sourceHead : commit();
  git('checkout', '-q', sourceHead);
  write('scripts/kodjo/fix.js', 'protocol-only fix'); commit();
  const repository = 'owner/repo';
  const pr = { number: 181, state: 'open', merged: false, base: { ref: 'main', repo: { full_name: repository } }, head: { sha: applicationHead, repo: { full_name: repository } } };
  const identity = initial ? 'planning_mode=INITIAL\n' : `application_pr=181\napplication_head=${applicationHead}\n`;
  const input = { cwd, bootstrap, bootstrapRel, repository, planBody: `source_head=${sourceHead}\n${identity}`, reviewBody: `source_head=${sourceHead}\nprotocol_execution_head=${sourceHead}\n${identity}`, impact: { scan_revision: applicationHead }, readPullRequest: () => pr };
  return { input, pr, git, write, commit, sourceHead, applicationHead };
}
test('revision accepts pre-existing unmerged application delta and a protocol-only repair', t => {
  const f = fixture(t); assert.notEqual(f.applicationHead, f.sourceHead);
  assert.match(f.git('diff', f.applicationHead, 'HEAD', '--', 'src'), /already delivered/);
  assert.doesNotThrow(() => verifyHandoffFreshness(f.input));
});
test('post-plan PR movement is refused even outside app/src', t => {
  const f = fixture(t); f.git('checkout', '-q', f.applicationHead); f.write('package.json', '{"changed":true}'); f.pr.head.sha = f.commit();
  f.git('checkout', '-q', f.sourceHead);
  assert.throws(() => verifyHandoffFreshness(f.input), /HANDOFF_APPLICATION_DRIFT/);
});
for (const [name, mutate] of [
  ['closed', f => { f.pr.state = 'closed'; }], ['merged', f => { f.pr.merged = true; }],
  ['wrong target', f => { f.pr.base.ref = 'other'; }], ['wrong repository', f => { f.pr.head.repo.full_name = 'other/repo'; }],
  ['wrong PR', f => { f.pr.number = 182; }], ['missing PR', f => { f.input.readPullRequest = () => null; }],
]) test('refuses ' + name, t => { const f = fixture(t); mutate(f); assert.throws(() => verifyHandoffFreshness(f.input), /HANDOFF_APPLICATION_PR_MISMATCH/); });
for (const [name, mutate] of [
  ['scan mismatch', f => { f.input.impact.scan_revision = 'a'.repeat(40); }],
  ['review HEAD mismatch', f => { f.input.reviewBody = f.input.reviewBody.replace(f.applicationHead, 'a'.repeat(40)); }],
  ['review PR mismatch', f => { f.input.reviewBody = f.input.reviewBody.replace('application_pr=181', 'application_pr=182'); }],
  ['missing revision provenance', f => { f.input.planBody = `source_head=${f.sourceHead}\n`; }],
]) test('refuses ' + name, t => { const f = fixture(t); mutate(f); assert.throws(() => verifyHandoffFreshness(f.input), /HANDOFF_APPLICATION_IDENTITY_MISMATCH/); });
for (const file of ['docs/product.md', '.github/orchestration/v2-slices/TEST/planning-mission.md', '.github/orchestration/v2-activation-registry.json']) {
  test('refuses post-review protected change: ' + file, t => { const f = fixture(t); f.write(file, 'changed'); f.commit(); assert.throws(() => verifyHandoffFreshness(f.input), /PLAN_REVIEW_PRODUCT_INPUT_CHANGED/); });
}
for (const file of ['src/activity.ts', 'package.json']) test('refuses post-review main application change: ' + file, t => { const f = fixture(t); f.write(file, 'changed'); f.commit(); assert.throws(() => verifyHandoffFreshness(f.input), /PLAN_REVIEW_NON_PROTOCOL_CHANGE/); });
test('API failure refuses admission', t => { const f = fixture(t); f.input.readPullRequest = () => { throw Error('API unavailable'); }; assert.throws(() => verifyHandoffFreshness(f.input), /API unavailable/); });
test('INITIAL remains supported without a PR', t => { const f = fixture(t, true); f.input.readPullRequest = () => { throw Error('must not query PR'); }; assert.doesNotThrow(() => verifyHandoffFreshness(f.input)); });
test('INITIAL cannot disguise a revision', t => { const f = fixture(t, true); f.input.impact.scan_revision = 'a'.repeat(40); assert.throws(() => verifyHandoffFreshness(f.input), /HANDOFF_INITIAL_IDENTITY_MISMATCH/); });
test('workflow grants private PR read permission and invokes the guarded entrypoint', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../../.github/workflows/kodjo-v2-plan-handoff-materialize.yml'), 'utf8');
  assert.match(workflow, /pull-requests: read/); assert.match(workflow, /node scripts\/kodjo\/materialize-approved-plan-handoff\.js/);
});
