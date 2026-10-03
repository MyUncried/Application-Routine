'use strict';
// Generic [KODJO_V2] PLAN_PUBLICATION: a plan assembled and checked locally, committed as a Git blob
// and published by the repository owner. No comment identifier is hard-coded; authority, slice,
// commit, blob and integrity are verified, and the three V2 recognition points use the same recovery.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { recover, isPlanPublication } = require('../../scripts/kodjo/recover-published-plan');

const REPO = 'owner/repo';
const SLICE = 'V2-TEST-01';
const BOOT = '.github/orchestration/v2-slices/' + SLICE + '/slice-bootstrap.json';
const HEAD = 'a'.repeat(40);
const COMMIT = 'b'.repeat(40);
const PLAN_PATH = '.github/orchestration/v2-slices/' + SLICE + '/plan-publication/technical-plan.md';
const ROOT = path.join(__dirname, '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

function planText(overrides = {}) {
  const impact = JSON.stringify({ schema: 'kodjo.plan-impact.v1', scan_revision: overrides.scan || HEAD });
  const ui = JSON.stringify({ schema: overrides.ui || 'kodjo.ui-plan-contract.v1' });
  return '# Plan\n\n' + (overrides.status || 'PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW') + '\n\n<KODJO_PLAN_IMPACT_JSON>\n' + impact +
    '\n</KODJO_PLAN_IMPACT_JSON>\n<KODJO_UI_PLAN_CONTRACT_JSON>\n' + ui + '\n</KODJO_UI_PLAN_CONTRACT_JSON>\n';
}

function fixture(t, opts = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-publication-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.dirname(path.join(root, BOOT)), { recursive: true });
  fs.writeFileSync(path.join(root, BOOT), JSON.stringify({ slice_id: SLICE, repository: REPO, issue_number: 7, baseline_head: HEAD, target_branch: 'main' }));
  const bytes = Buffer.from(opts.plan || planText(), 'utf8');
  const blob = crypto.createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
  const fields = {
    slice_id: SLICE, bootstrap_path: BOOT, source_head: HEAD, plan_commit: COMMIT, plan_path: PLAN_PATH,
    plan_blob: blob, plan_sha256: crypto.createHash('sha256').update(bytes).digest('hex'), plan_size: String(bytes.length),
    ...(opts.fields || {}),
  };
  const body = (opts.marker || '[KODJO_V2] PLAN_PUBLICATION') + '\n' +
    Object.entries(fields).map(([k, v]) => k + '=' + v).join('\n') + (opts.extra || '') + '\n';
  const comment = { id: 99, user: { login: opts.author || 'owner' }, issue_url: 'https://api.github.com/repos/' + REPO + '/issues/' + (opts.issue || 7), body };
  const calls = [];
  const get = (route) => {
    calls.push(route);
    if (route.startsWith('compare/')) return { status: opts.compare || 'ahead' };
    if (route.startsWith('git/trees/')) return { truncated: false, tree: [{ path: PLAN_PATH, sha: opts.treeBlob || blob, type: 'blob' }] };
    if (route.startsWith('git/blobs/')) return { sha: blob, encoding: 'base64', content: (opts.served || bytes).toString('base64') };
    throw new Error('unexpected route ' + route);
  };
  return { root, comment, get, calls, bytes, blob };
}
const run = (f) => recover(f.comment, REPO, f.get, f.root);

test('nominal publication is recovered as a reviewable PLAN_OUTPUT carrying the exact blob bytes', (t) => {
  const f = fixture(t);
  assert.equal(isPlanPublication(f.comment), true);
  const out = run(f);
  const header = out.slice(0, out.indexOf('\n\n') + 2);
  assert.match(header, /^\[KODJO_V2\] PLAN_OUTPUT\n/);
  for (const line of ['slice_id=' + SLICE, 'bootstrap_path=' + BOOT, 'source_head=' + HEAD, 'planning_mode=INITIAL',
    'planning_contract=kodjo.plan-impact.v1', 'ui_planning_contract=kodjo.ui-plan-criteria.v2',
    'published_plan_commit=' + COMMIT, 'published_plan_blob=' + f.blob, 'STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW']) {
    assert.ok(header.split('\n').includes(line), line);
  }
  assert.equal(out.slice(header.length), f.bytes.toString('utf8'));
  assert.deepEqual(f.calls.map((c) => c.split('/')[0] + '/' + c.split('/')[1].split('?')[0]),
    ['compare/' + COMMIT + '...main', 'git/trees', 'git/blobs']);
});

const refusals = [
  ['marker', { marker: '[KODJO_V2] PLAN_OUTPUT' }, /PLAN_PUBLICATION_MARKER_INVALID/],
  ['author is not the repository owner', { author: 'github-actions[bot]' }, /PLAN_PUBLICATION_AUTHORITY_INVALID/],
  ['malformed slice', { fields: { slice_id: 'pre2' } }, /PLAN_PUBLICATION_SLICE_INVALID/],
  ['bootstrap path of another slice', { fields: { bootstrap_path: '.github/orchestration/v2-slices/V2-OTHER/slice-bootstrap.json' } }, /PLAN_PUBLICATION_BOOTSTRAP_PATH_MISMATCH/],
  ['slice without bootstrap', { fields: { slice_id: 'V2-OTHER', bootstrap_path: '.github/orchestration/v2-slices/V2-OTHER/slice-bootstrap.json' } }, /PLAN_PUBLICATION_BOOTSTRAP_MISSING/],
  ['comment on another issue', { issue: 8 }, /PLAN_PUBLICATION_ISSUE_MISMATCH/],
  ['source head differs from bootstrap baseline', { fields: { source_head: 'c'.repeat(40) } }, /PLAN_PUBLICATION_SOURCE_MISMATCH/],
  ['duplicated field', { extra: '\nplan_commit=' + 'd'.repeat(40) }, /PLAN_PUBLICATION_FIELD_INVALID:plan_commit/],
  ['plan outside the slice folder', { fields: { plan_path: 'docs/plan.md' } }, /PLAN_PUBLICATION_PATH_INVALID/],
  ['commit not on target branch', { compare: 'diverged' }, /PLAN_PUBLICATION_COMMIT_NOT_ON_TARGET/],
  ['blob not bound to the commit path', { treeBlob: 'e'.repeat(40) }, /PLAN_PUBLICATION_COMMIT_BINDING_MISMATCH/],
  ['size mismatch', { fields: { plan_size: '1' } }, /PLAN_PUBLICATION_PLAN_INTEGRITY_MISMATCH/],
  ['digest mismatch', { fields: { plan_sha256: 'f'.repeat(64) } }, /PLAN_PUBLICATION_PLAN_INTEGRITY_MISMATCH/],
  ['plan not reviewable', { plan: planText({ status: 'PLAN_STATUS: CLARIFICATION_REQUIRED' }) }, /PLAN_PUBLICATION_PLAN_NOT_REVIEWABLE/],
  ['scan revision differs from source head', { plan: planText({ scan: 'c'.repeat(40) }) }, /PLAN_PUBLICATION_SCAN_REVISION_MISMATCH/],
  ['invalid UI contract', { plan: planText({ ui: 'kodjo.ui-plan-criteria.v2' }) }, /PLAN_PUBLICATION_UI_CONTRACT_INVALID/],
];
for (const [name, opts, code] of refusals) {
  test('refuses: ' + name, (t) => assert.throws(() => run(fixture(t, opts)), code));
}

test('refuses served bytes that differ from the published digest', (t) => {
  const f = fixture(t, { served: Buffer.from(planText() + 'tampered\n', 'utf8') });
  assert.throws(() => run(f), /PLAN_PUBLICATION_PLAN_INTEGRITY_MISMATCH/);
});

test('initial plan review recognizes the generic publication without new hard-coded identifiers', () => {
  const wf = read('.github/workflows/kodjo-v2-slice-initial-plan-review.yml');
  const gate = wf.slice(wf.indexOf('- name: Validate immutable initial V2 review gate'), wf.indexOf('- name: Snapshot protocol verifiers'));
  assert.match(gate, /-eq '\[KODJO_V2\] PLAN_PUBLICATION'\)\{/);
  assert.match(gate, /node scripts\/kodjo\/recover-published-plan\.js \$planId \$recoveredFile/);
  assert.match(gate, /-and -not \$recoveredPublication -and -not \$genericPublication\) \{ throw 'Plan author mismatch' \}/);
  assert.match(gate, /"pinned_publication=\$\(if\(\$recoveredPublication -or \$genericPublication\)/);
  // The PLAN_OUTPUT, slice, bootstrap, contract, status and baseline checks still apply to the recovered body.
  for (const guard of ['Not a V2 PLAN_OUTPUT', 'Plan slice mismatch', 'Plan bootstrap mismatch', 'Plan is not reviewable', 'Initial plan source differs from bootstrap baseline']) {
    assert.ok(gate.includes(guard), guard);
  }
  const ids = (s) => [...s.matchAll(/'(59[0-9]{8})'/g)].map((m) => m[1]);
  assert.deepEqual(ids(gate), ['5913845392', '5916079168', '5918243649', '5920359910', '5930810339', '5939160567']);
});

test('a published plan is never regenerated automatically after REVISE', () => {
  const wf = read('.github/workflows/kodjo-v2-slice-initial-plan-review.yml');
  assert.match(wf, /PINNED_PUBLICATION: \$\{\{ steps\.gate\.outputs\.pinned_publication \}\}/);
  assert.match(wf, /-or \(\$env:PINNED_PUBLICATION -eq 'true'\) -or \(\[string\]\$retry\.status -eq 'USER_VALIDATION'\)/);
});

test('handoff and implementation review use the same verified recovery', () => {
  const handoff = read('scripts/kodjo/materialize-approved-plan-handoff.js');
  assert.match(handoff, /require\('\.\/recover-published-plan'\)\.isPlanPublication\(plan\)/);
  assert.match(handoff, /require\('\.\/recover-published-plan'\)\.recover\(plan, repository, undefined, cwd\)/);
  assert.match(handoff, /&& !recoveredPublication && !genericPublication\) fail\('HANDOFF_PLAN_AUTHOR_MISMATCH'\)/);
  const wf = read('.github/workflows/kodjo-slice-implementation-review.yml');
  const step = wf.slice(wf.indexOf('- name: Validate implementation output and manifest'));
  const branch = step.slice(step.indexOf("= '[KODJO_V2] PLAN_PUBLICATION' ]; then"), step.indexOf('\n            else\n              jq -e --arg issue'));
  assert.match(branch, /node scripts\/kodjo\/recover-published-plan\.js "\$plan" \/tmp\/kodjo-recovered-plan\.md/);
  assert.match(branch, /Recovered published plan differs from authorized plan blob/);
});
