'use strict';
// INITIAL handoff when the application baseline predates the slice bootstrap and the
// handoff outputs (technical-plan.md, independent-review.md) do not exist yet (V2-PRE-1).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { verifyHandoffFreshness } = require('../../scripts/kodjo/materialize-approved-plan-handoff');
const { verifyTransition } = require('../../scripts/kodjo/verify-plan-review-transition');

const SLICE = '.github/orchestration/v2-slices/TEST';
const BOOTSTRAP = SLICE + '/slice-bootstrap.json';

function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-initial-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
  const write = (file, body) => { fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true }); fs.writeFileSync(path.join(cwd, file), body); };
  const commit = () => { git('add', '.'); git('commit', '-qm', 'fixture'); return git('rev-parse', 'HEAD'); };
  git('init', '-q'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test'); git('config', 'core.autocrlf', 'false');
  write('src/activity.ts', 'baseline'); write('docs/product.md', 'product');
  const sourceHead = commit();
  const bootstrap = { target_branch: 'main', activation_registry: '.github/orchestration/v2-activation-registry.json', product_sources: [{ path: 'docs/product.md', sha256: crypto.createHash('sha256').update('product').digest('hex') }] };
  write(BOOTSTRAP, JSON.stringify(bootstrap)); write(bootstrap.activation_registry, '{}'); write(SLICE + '/planning-mission.md', 'mission');
  const reviewHead = commit();
  const input = { cwd, bootstrap, bootstrapRel: BOOTSTRAP, repository: 'owner/repo',
    planBody: `source_head=${sourceHead}\nplanning_mode=INITIAL\n`,
    reviewBody: `source_head=${sourceHead}\nprotocol_execution_head=${reviewHead}\nplanning_mode=INITIAL\n`,
    impact: { scan_revision: sourceHead }, readPullRequest: () => { throw Error('must not query PR'); } };
  return { input, git, write, commit, sourceHead, reviewHead };
}

test('INITIAL accepts a baseline older than the bootstrap and not-yet-materialized outputs', t => {
  const f = fixture(t);
  assert.doesNotThrow(() => verifyHandoffFreshness(f.input));
  f.write('scripts/kodjo/fix.js', 'protocol-only fix'); f.commit();
  assert.doesNotThrow(() => verifyHandoffFreshness(f.input));
});

for (const file of ['docs/product.md', SLICE + '/planning-mission.md', BOOTSTRAP, SLICE + '/technical-plan.md', SLICE + '/independent-review.md']) {
  test('INITIAL still refuses a post-review protected change: ' + file, t => {
    const f = fixture(t); f.write(file, 'changed'); f.commit();
    assert.throws(() => verifyHandoffFreshness(f.input), /PLAN_REVIEW_PRODUCT_INPUT_CHANGED/);
  });
}

test('INITIAL still refuses application drift from the baseline', t => {
  const f = fixture(t); f.write('src/activity.ts', 'changed'); const head = f.commit();
  f.input.reviewBody = f.input.reviewBody.replace(f.reviewHead, head);
  assert.throws(() => verifyHandoffFreshness(f.input), /HANDOFF_APPLICATION_DRIFT/);
});

test('INITIAL refuses a baseline that is not an ancestor', t => {
  const f = fixture(t); const top = f.git('rev-parse', 'HEAD');
  f.git('checkout', '-q', '--orphan', 'other'); f.git('rm', '-rqf', '.'); f.write('src/activity.ts', 'baseline'); const orphan = f.commit();
  f.git('checkout', '-q', top);
  f.input.planBody = `source_head=${orphan}\nplanning_mode=INITIAL\n`;
  f.input.reviewBody = `source_head=${orphan}\nprotocol_execution_head=${f.reviewHead}\nplanning_mode=INITIAL\n`;
  f.input.impact.scan_revision = orphan;
  assert.throws(() => verifyHandoffFreshness(f.input), /HANDOFF_INITIAL_BASELINE_NOT_ANCESTOR/);
});

test('a mission report may follow the review; nested or non-Markdown report paths may not', t => {
  const { isClosedProtocolPath } = require('../../scripts/kodjo/verify-plan-review-transition');
  assert.equal(isClosedProtocolPath('.github/orchestration/reports/2026-09-30_MISSION.md'), true);
  assert.equal(isClosedProtocolPath('.github/orchestration/reports/sub/x.md'), false);
  assert.equal(isClosedProtocolPath('.github/orchestration/reports/x.json'), false);
  const f = fixture(t); f.write('.github/orchestration/reports/2026-09-30_MISSION.md', 'report'); f.commit();
  assert.doesNotThrow(() => verifyHandoffFreshness(f.input));
  f.write('.github/orchestration/reports/sub/x.md', 'nested'); f.commit();
  assert.throws(() => verifyHandoffFreshness(f.input), /PLAN_REVIEW_NON_PROTOCOL_CHANGE/);
});

test('transition: only handoff outputs may be absent at both revisions', t => {
  const f = fixture(t);
  assert.doesNotThrow(() => verifyTransition({ cwd: f.input.cwd, sourceHead: f.reviewHead, executionHead: f.reviewHead, bootstrapPath: BOOTSTRAP }));
  f.git('rm', '-q', SLICE + '/planning-mission.md'); const head = f.commit();
  assert.throws(() => verifyTransition({ cwd: f.input.cwd, sourceHead: head, executionHead: head, bootstrapPath: BOOTSTRAP }), /PLAN_REVIEW_PRODUCT_INPUT_CHANGED/);
});
