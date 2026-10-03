'use strict';
// Generic bounded closure of a prior REVISE: a corrected plan publication pins, in the same commit,
// the prior findings and the correction register, and names the prior review (bot PLAN_REVIEW_OUTPUT or
// owner PLAN_REVIEW_RECOVERY bound by the findings digest). The reviewer may only close or keep open
// those findings, under a mechanical bound. No comment identifier is hard-coded.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { closureInputs } = require('../../scripts/kodjo/recover-published-plan');
const { verify } = require('../../scripts/kodjo/verify-plan-closure-review');

const REPO = 'owner/repo';
const SLICE = 'V2-TEST-01';
const DIR = '.github/orchestration/v2-slices/' + SLICE + '/';
const BOOT = DIR + 'slice-bootstrap.json';
const HEAD = 'a'.repeat(40);
const ISSUE = 'https://api.github.com/repos/' + REPO + '/issues/7';
const ROOT = path.join(__dirname, '..', '..');
const sha1 = (b) => crypto.createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const plan = (tag) => Buffer.from('# Plan ' + tag + '\n\nPLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW\n\n<KODJO_PLAN_IMPACT_JSON>\n' +
  JSON.stringify({ schema: 'kodjo.plan-impact.v1', scan_revision: HEAD }) + '\n</KODJO_PLAN_IMPACT_JSON>\n<KODJO_UI_PLAN_CONTRACT_JSON>\n' +
  JSON.stringify({ schema: 'kodjo.ui-plan-contract.v1' }) + '\n</KODJO_UI_PLAN_CONTRACT_JSON>\n', 'utf8');
const FINDINGS = { verdict: 'REVISE', findings: [
  { category: 'MIGRATION', target_kind: 'PATH', target: 'src/a.ts', blocking: true, diagnostic: 'd1', expected_correction: 'e1' },
  { category: 'ARCHITECTURE', target_kind: 'REQUIREMENT_ID', target: 'REQ-1', blocking: false, diagnostic: 'd2', expected_correction: 'e2' },
] };

function fixture(t, opts = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'closure-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, DIR), { recursive: true });
  fs.writeFileSync(path.join(root, BOOT), JSON.stringify({ slice_id: SLICE, repository: REPO, issue_number: 7, baseline_head: HEAD, target_branch: 'main' }));
  const objects = {};
  const store = (bytes) => { const id = sha1(bytes); objects[id] = bytes; return id; };
  const files = { [DIR + 'p1/technical-plan.md']: plan('one'), [DIR + 'p2/technical-plan.md']: plan('two'),
    [DIR + 'p2/prior-findings.json']: Buffer.from(JSON.stringify(opts.findings || FINDINGS), 'utf8'),
    [DIR + 'p2/correction-register.md']: Buffer.from('# Register\n', 'utf8') };
  const trees = { ['1'.repeat(40)]: [DIR + 'p1/technical-plan.md'], ['2'.repeat(40)]: Object.keys(files).filter((f) => !f.includes('/p1/')) };
  const blobs = Object.fromEntries(Object.entries(files).map(([f, b]) => [f, store(b)]));
  const pub = (id, commit, file, extra = '') => ({ id, user: { login: 'owner' }, issue_url: ISSUE, body: ['[KODJO_V2] PLAN_PUBLICATION', 'slice_id=' + SLICE, 'bootstrap_path=' + BOOT,
    'source_head=' + HEAD, 'plan_commit=' + commit, 'plan_path=' + file, 'plan_blob=' + blobs[file], 'plan_sha256=' + sha256(files[file]), 'plan_size=' + files[file].length].join('\n') + extra });
  const closure = opts.closure !== undefined ? opts.closure : ['', 'prior_review_comment_id=20', 'prior_findings_path=' + DIR + 'p2/prior-findings.json',
    'prior_findings_blob=' + (opts.findingsBlob || blobs[DIR + 'p2/prior-findings.json']), 'correction_register_path=' + DIR + 'p2/correction-register.md',
    'correction_register_blob=' + blobs[DIR + 'p2/correction-register.md']].join('\n');
  const recovery = { id: 20, user: { login: opts.priorAuthor || 'owner' }, issue_url: opts.priorIssue || ISSUE, body: [opts.priorMarker || '[KODJO_V2] PLAN_REVIEW_RECOVERY', 'slice_id=' + SLICE,
    'source_plan_comment_id=10', 'derived_verdict=' + (opts.priorVerdict || 'REVISE'), 'findings_sha256=' + (opts.digest || sha256(files[DIR + 'p2/prior-findings.json'])), '', 'review text'].join('\n') };
  const comments = { 10: pub(10, '1'.repeat(40), DIR + 'p1/technical-plan.md'), 20: recovery, 30: pub(30, '2'.repeat(40), DIR + 'p2/technical-plan.md', closure) };
  const get = (route) => {
    if (route.startsWith('issues/comments/')) return comments[route.split('/')[2]];
    if (route.startsWith('compare/')) return { status: 'ahead' };
    if (route.startsWith('git/trees/')) { const c = route.split('/')[2].split('?')[0]; return { truncated: false, tree: trees[c].map((p) => ({ path: p, sha: blobs[p], type: 'blob' })) }; }
    if (route.startsWith('git/blobs/')) { const id = route.split('/')[2]; return { sha: id, encoding: 'base64', content: objects[id].toString('base64') }; }
    throw new Error('route ' + route);
  };
  return { root, get, comments, files };
}
const run = (f) => closureInputs(f.comments[30], REPO, f.get, f.root);

test('closure inputs are recovered from a recovery-bound prior review, with the prior plan', (t) => {
  const f = fixture(t);
  const out = run(f);
  assert.equal(out.priorReviewId, '20');
  assert.equal(out.count, 2);
  assert.deepEqual(JSON.parse(out.findings.toString('utf8')), FINDINGS);
  assert.match(out.priorPlan, /^\[KODJO_V2\] PLAN_OUTPUT\n/);
  assert.ok(out.priorPlan.endsWith(f.files[DIR + 'p1/technical-plan.md'].toString('utf8')));
});

test('a publication without closure fields is a plain publication', (t) => {
  assert.equal(run(fixture(t, { closure: '' })), null);
});

for (const [name, opts, code] of [
  ['incomplete closure fields', { closure: '\nprior_review_comment_id=20' }, /PLAN_CLOSURE_FIELDS_INCOMPLETE/],
  ['findings blob not bound to the plan commit', { findingsBlob: 'f'.repeat(40) }, /PLAN_CLOSURE_BINDING_MISMATCH:prior_findings_path/],
  ['recovery digest differs from the pinned findings', { digest: '0'.repeat(64) }, /PLAN_CLOSURE_FINDINGS_DIGEST_MISMATCH/],
  ['recovery not published by the owner', { priorAuthor: 'someone' }, /PLAN_CLOSURE_PRIOR_AUTHORITY_INVALID/],
  ['prior review not REVISE', { priorVerdict: 'APPROVE' }, /PLAN_CLOSURE_PRIOR_NOT_REVISE/],
  ['prior review on another issue', { priorIssue: ISSUE.replace('/7', '/8') }, /PLAN_CLOSURE_PRIOR_ISSUE_MISMATCH/],
  ['prior comment is not a review', { priorMarker: '[KODJO_V2] PLAN_PUBLICATION' }, /PLAN_CLOSURE_PRIOR_REVIEW_INVALID/],
  ['duplicated prior targets', { findings: { verdict: 'REVISE', findings: [FINDINGS.findings[0], FINDINGS.findings[0]] } }, /PLAN_CLOSURE_TARGETS_NOT_UNIQUE/],
]) test('closure inputs refuse: ' + name, (t) => assert.throws(() => run(fixture(t, opts)), code));

const review = (rows, closures) => '| N | Correction examinée | Preuve précise | Fermé | Justification |\n|---|---|---|---|---|\n' +
  rows.map((n) => '| ' + n + ' | c | e | OUI | j |').join('\n') + '\n<KODJO_CLOSURE_JSON>\n' + JSON.stringify({ closures: closures.map(([finding, closed]) =>
    ({ finding, closed, correction_examined: 'c', evidence: 'e', justification: 'j' })) }) + '\n</KODJO_CLOSURE_JSON>\n';
const open = (n, blocking) => ({ ...FINDINGS.findings[n - 1], blocking, diagnostic: 'Prior finding ' + n + ': still open' });

test('bound: every finding closed derives APPROVE', () => {
  assert.equal(verify(review([1, 2], [[1, true], [2, true]]), { verdict: 'APPROVE', findings: [] }, FINDINGS).verdict, 'APPROVE');
});
test('bound: an open blocking finding derives REVISE', () => {
  assert.deepEqual(verify(review([1, 2], [[1, false], [2, true]]), { verdict: 'REVISE', findings: [open(1, true)] }, FINDINGS).open, [1]);
});
test('bound: an open non-blocking observation keeps APPROVE', () => {
  assert.equal(verify(review([1, 2], [[1, true], [2, false]]), { verdict: 'APPROVE', findings: [open(2, false)] }, FINDINGS).verdict, 'APPROVE');
});
test('bound: an open non-blocking CLARIFICATION keeps REVISE, as lib/review-findings derives it', () => {
  const prior = { findings: [FINDINGS.findings[0], { ...FINDINGS.findings[1], category: 'CLARIFICATION' }] };
  const row = { ...prior.findings[1], diagnostic: 'Prior finding 2: open' };
  assert.equal(verify(review([1, 2], [[1, true], [2, false]]), { verdict: 'REVISE', findings: [row] }, prior).verdict, 'REVISE');
});
test('bound refuses: category changed', () => {
  assert.throws(() => verify(review([1, 2], [[1, false], [2, true]]), { verdict: 'REVISE', findings: [{ ...open(1, true), category: 'OTHER' }] }, FINDINGS), /CLOSURE_CATEGORY_CHANGED:1/);
});
for (const [name, args, code] of [
  ['row outside the prior targets', [review([1, 2], [[1, true], [2, true]]), { verdict: 'REVISE', findings: [{ ...open(1, true), target: 'src/other.ts' }] }], /CLOSURE_FINDING_OUTSIDE_BOUND/],
  ['blocking status changed', [review([1, 2], [[1, true], [2, false]]), { verdict: 'REVISE', findings: [open(2, true)] }], /CLOSURE_BLOCKING_STATUS_CHANGED:2/],
  ['closure record contradicting the findings', [review([1, 2], [[1, true], [2, true]]), { verdict: 'REVISE', findings: [open(1, true)] }], /CLOSURE_CONTRADICTS_FINDINGS:1/],
  ['missing closure entry', [review([1, 2], [[1, true]]), { verdict: 'APPROVE', findings: [] }], /CLOSURE_JSON_COUNT_INVALID/],
  ['missing table row', [review([1], [[1, true], [2, true]]), { verdict: 'APPROVE', findings: [] }], /CLOSURE_TABLE_ROW_COUNT_INVALID/],
]) test('bound refuses: ' + name, () => assert.throws(() => verify(...args, FINDINGS), code));

test('initial plan review wires the generic closure mode without hard-coded identifiers', () => {
  const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/kodjo-v2-slice-initial-plan-review.yml'), 'utf8').replace(/\r\n/g, '\n');
  const gate = wf.slice(wf.indexOf('- name: Validate immutable initial V2 review gate'), wf.indexOf('- name: Snapshot protocol verifiers'));
  assert.match(gate, /node scripts\/kodjo\/recover-published-plan\.js --closure \$planId \$closureDir/);
  assert.match(gate, /if\(\$LASTEXITCODE-ne0\)\{throw 'Verified closure inputs recovery failed'\}/);
  assert.match(gate, /"closure_review=\$\(if\(\$closureReview\)\{'true'\}else\{'false'\}\)"/);
  assert.match(wf, /Copy-Item -LiteralPath scripts\/kodjo\/verify-plan-closure-review\.js -Destination \$protocol/);
  const claude = wf.slice(wf.indexOf('- name: Review initial V2 plan with Claude'), wf.indexOf('- name: Publish independent initial V2 plan review'));
  assert.match(claude, /CLOSURE_REVIEW: \$\{\{ steps\.gate\.outputs\.closure_review \}\}/);
  assert.match(claude, /if\(\$env:CLOSURE_REVIEW -eq 'true'\)\{\n\s+# Fermeture bornée générique/);
  assert.match(claude, /BOUNDED CLOSURE REVIEW of a corrected plan/);
  assert.match(claude, /verify-plan-closure-review\.js" "\$env:RUNNER_TEMP\\kodjo-v2-initial-review\.md" "\$env:RUNNER_TEMP\\kodjo-v2-initial-review-findings\.json" "\$env:RUNNER_TEMP\\kodjo-v2-closure\\prior-findings\.json"/);
  assert.match(claude, /throw 'Closure review exceeded the prior-findings bound'/);
  assert.ok(claude.indexOf('normalize-review-findings.js') < claude.indexOf('verify-plan-closure-review.js'));
});
