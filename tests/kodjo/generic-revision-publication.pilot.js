'use strict';
// Owner publication of a REVISION of an already delivered slice ([KODJO_V2] PLAN_PUBLICATION with
// planning_mode=REVISION): verified like an initial publication, plus the revision identity (application PR/HEAD,
// superseded plan and prior review blobs at the source HEAD, scan at the application HEAD). The reconstructed
// header is the one of kodjo-v2-slice-plan.yml, so the review, handoff and implementation paths are unchanged.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { recover } = require('../../scripts/kodjo/recover-published-plan');
const { verify } = require('../../scripts/kodjo/verify-bounded-plan-revision');

const REPO = 'owner/repo';
const SLICE = 'V2-TEST-01';
const DIR = '.github/orchestration/v2-slices/' + SLICE + '/';
const BOOT = DIR + 'slice-bootstrap.json';
const BASELINE = 'a'.repeat(40), SOURCE = 'b'.repeat(40), APP = 'c'.repeat(40), COMMIT = 'd'.repeat(40);
const OLD_PLAN = 'e'.repeat(40), OLD_REVIEW = 'f'.repeat(40);
const ROOT = path.join(__dirname, '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

function plan(o = {}) {
  return '# Plan révisé\n\nPLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW\n\n<KODJO_PLAN_IMPACT_JSON>\n' + JSON.stringify({ schema: 'kodjo.plan-impact.v1', scan_revision: o.scan || APP }) +
    '\n</KODJO_PLAN_IMPACT_JSON>\n<KODJO_UI_PLAN_CONTRACT_JSON>\n' + JSON.stringify({ schema: 'kodjo.ui-plan-contract.v1' }) + '\n</KODJO_UI_PLAN_CONTRACT_JSON>\n' +
    (o.noStatus ? '' : '<KODJO_PLAN_REVISION_STATUS_JSON>\n{"status":"APPROVED_BASE_NEW_CYCLE"}\n</KODJO_PLAN_REVISION_STATUS_JSON>\n');
}
function fixture(t, o = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'revision-pub-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, DIR), { recursive: true });
  fs.writeFileSync(path.join(root, BOOT), JSON.stringify({ slice_id: SLICE, repository: REPO, issue_number: 7, baseline_head: BASELINE, target_branch: 'main' }));
  const bytes = Buffer.from(o.plan || plan(), 'utf8');
  const blob = crypto.createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
  const fields = { planning_mode: 'REVISION', slice_id: SLICE, bootstrap_path: BOOT, source_head: SOURCE, application_pr: '303', application_head: APP,
    supersedes_plan_blob_oid: OLD_PLAN, prior_review_blob_oid: OLD_REVIEW, plan_commit: COMMIT, plan_path: DIR + 'revision/technical-plan.md', plan_blob: blob,
    plan_sha256: crypto.createHash('sha256').update(bytes).digest('hex'), plan_size: String(bytes.length), ...(o.fields || {}) };
  for (const k of o.drop || []) delete fields[k];
  const body = '[KODJO_V2] PLAN_PUBLICATION\n' + Object.entries(fields).map(([k, v]) => k + '=' + v).join('\n') + (o.extra || '') + '\n';
  const comment = { id: 9, user: { login: 'owner' }, issue_url: 'https://api.github.com/repos/' + REPO + '/issues/7', body };
  const get = (route) => {
    if (route.startsWith('compare/' + SOURCE)) return { status: o.sourceCompare || 'ahead' };
    if (route.startsWith('compare/')) return { status: 'ahead' };
    if (route === 'git/trees/' + COMMIT + '?recursive=1') return { truncated: false, tree: [{ path: fields.plan_path, sha: blob, type: 'blob' }] };
    if (route === 'git/trees/' + SOURCE + '?recursive=1') return { truncated: false, tree: [{ path: DIR + 'technical-plan.md', sha: o.sourcePlan || OLD_PLAN, type: 'blob' }, { path: DIR + 'independent-review.md', sha: OLD_REVIEW, type: 'blob' }] };
    if (route === 'git/blobs/' + blob) return { sha: blob, encoding: 'base64', content: bytes.toString('base64') };
    throw new Error('route ' + route);
  };
  return { root, comment, get, bytes };
}
const run = (f) => recover(f.comment, REPO, f.get, f.root);

test('a REVISION publication is recovered with the exact bot revision header and plan bytes', (t) => {
  const f = fixture(t);
  const out = run(f);
  const header = out.slice(0, out.indexOf('\n\n'));
  assert.deepEqual(header.split('\n'), ['[KODJO_V2] PLAN_OUTPUT', 'slice_id=' + SLICE, 'bootstrap_path=' + BOOT, 'source_head=' + SOURCE, 'application_pr=303',
    'application_head=' + APP, 'supersedes_plan_blob_oid=' + OLD_PLAN, 'prior_review_blob_oid=' + OLD_REVIEW, 'planning_contract=kodjo.plan-impact.v1',
    'ui_planning_contract=kodjo.ui-plan-criteria.v2', 'published_plan_commit=' + COMMIT, 'published_plan_blob=' + header.split('published_plan_blob=')[1].split('\n')[0],
    'STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW']);
  assert.doesNotMatch(header, /planning_mode=/);
  assert.equal(out.slice(header.length + 2), f.bytes.toString('utf8'));
});

for (const [name, o, code] of [
  ['unknown planning mode', { fields: { planning_mode: 'BOUNDED' } }, /PLAN_PUBLICATION_MODE_INVALID/],
  ['missing application head', { drop: ['application_head'] }, /PLAN_PUBLICATION_FIELD_INVALID:application_head/],
  ['malformed application PR', { fields: { application_pr: 'pr303' } }, /PLAN_PUBLICATION_REVISION_IDENTITY_INVALID/],
  ['source head not on target', { sourceCompare: 'diverged' }, /PLAN_PUBLICATION_SOURCE_NOT_ON_TARGET/],
  ['superseded plan is not the committed plan at source head', { sourcePlan: '1'.repeat(40) }, /PLAN_PUBLICATION_SUPERSEDED_PLAN_MISMATCH/],
  ['scan not at the application head', { plan: plan({ scan: SOURCE }) }, /PLAN_PUBLICATION_SCAN_REVISION_MISMATCH/],
  ['revision status block missing', { plan: plan({ noStatus: true }) }, /PLAN_PUBLICATION_REVISION_STATUS_MISSING/],
]) test('revision publication refuses: ' + name, (t) => assert.throws(() => run(fixture(t, o)), code));

test('a revision may carry closure fields: the plan header is unchanged, closureInputs binds them', (t) => {
  const plain = run(fixture(t));
  const closure = run(fixture(t, { extra: '\nprior_review_comment_id=1\nprior_findings_path=' + DIR + 'f.json\nprior_findings_blob=' + '1'.repeat(40) +
    '\ncorrection_register_path=' + DIR + 'r.md\ncorrection_register_blob=' + '2'.repeat(40) }));
  assert.equal(closure, plain);
});

test('an INITIAL publication may not carry application fields', (t) => {
  const f = fixture(t, { drop: ['planning_mode'], fields: { source_head: BASELINE } });
  assert.throws(() => run(f), /PLAN_PUBLICATION_INITIAL_APPLICATION_FORBIDDEN/);
});

test('bounded revision: a structured APPROVE base opens a new cycle; REVISE still needs blocking findings', () => {
  const base = '<KODJO_PLAN_IMPACT_JSON>{}</KODJO_PLAN_IMPACT_JSON>';
  const approve = 'verdict=APPROVE\nSTATUT : PLAN_REVIEW_APPROVED\n<KODJO_PLAN_REVIEW_FINDINGS_JSON>\n{"verdict":"APPROVE","findings":[]}\n</KODJO_PLAN_REVIEW_FINDINGS_JSON>\n';
  assert.deepEqual(verify(base, approve, base), { status: 'APPROVED_BASE_NEW_CYCLE' });
  assert.throws(() => verify(base, approve.replace('verdict=APPROVE\nSTATUT : PLAN_REVIEW_APPROVED\n', ''), base), /PLAN_REVISION_REVIEW_INVALID/);
  assert.throws(() => verify(base, approve.replace('"verdict":"APPROVE"', '"verdict":"REVISE"'), base), /PLAN_REVISION_BLOCKING_FINDING_MISSING/);
});

test('revision plan review admits a verified owner publication and never replans a pinned publication', () => {
  const wf = read('.github/workflows/kodjo-v2-slice-plan-review.yml');
  const gate = wf.slice(wf.indexOf('- name: Validate immutable V2 review gate'), wf.indexOf('- name: Snapshot plan verifiers from protocol'));
  assert.match(gate, /-eq '\[KODJO_V2\] PLAN_PUBLICATION'\)\{\n\s+\$recoveredFile=Join-Path \$env:RUNNER_TEMP 'kodjo-v2-recovered-revision\.md'\n\s+node scripts\/kodjo\/recover-published-plan\.js \$planId \$recoveredFile/);
  assert.match(gate, /if \(\$plan\.user\.login -ne 'github-actions\[bot\]' -and -not \$genericPublication\) \{ throw 'Plan author mismatch' \}/);
  assert.ok(gate.indexOf('Application analysis provenance missing') > gate.indexOf('$genericPublication=$true'));
  assert.match(gate, /"pinned_publication=\$\(if\(\$genericPublication\)\{'true'\}else\{'false'\}\)"/);
  const publish = wf.slice(wf.indexOf('- name: Publish independent V2 plan review'), wf.indexOf('- name: Preserve V2 review evidence'));
  const pinned = publish.indexOf("}elseif($env:PINNED_PUBLICATION -eq 'true'){");
  assert.ok(pinned > 0 && pinned < publish.indexOf('gh workflow run kodjo-v2-slice-plan.yml'));
  assert.match(publish.slice(pinned, publish.indexOf('}else{', pinned)), /reason=PINNED_PUBLICATION[\s\S]*exit 0/);
});
