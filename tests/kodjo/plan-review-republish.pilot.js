'use strict';
// Republication sans Claude d'une revue de plan V2 dont seule la publication a échoué (run 37198105017 : sous Windows
// PowerShell 5.1, Get-Content -Raw puis ConvertTo-Json envoyait body comme objet, HTTP 400).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build, readText } = require('../../scripts/kodjo/republish-plan-review');

const ROOT = path.join(__dirname, '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const HEAD = 'a'.repeat(40), APP = 'b'.repeat(40), SESSION = '12345678-1234-1234-1234-123456789abc';
const BOOT = '.github/orchestration/v2-slices/V2-TEST-01/slice-bootstrap.json';
const PLAN = ['[KODJO_V2] PLAN_OUTPUT', 'slice_id=V2-TEST-01', 'bootstrap_path=' + BOOT, 'source_head=' + HEAD, 'application_pr=303',
  'application_head=' + APP, 'STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW', '', '# Plan révisé — é'].join('\n');
const FINDING = { category: 'UI_CRITERION', target_kind: 'CRITERION_ID', target: 'UI-3D89E598F31D', blocking: true, diagnostic: 'Assertion manquante.',
  expected_correction: 'Ajouter l’assertion.', dependency_expansion_required: false, dependency_evidence: '' };
const REVIEW = 'Revue indépendante — é.\n\n<KODJO_REVIEW_FINDINGS_JSON>\n' + JSON.stringify({ findings: [FINDING] }) + '\n</KODJO_REVIEW_FINDINGS_JSON>\n';

function fixture(t, o = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'republish-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'kodjo-v2-plan.md'), o.plan || PLAN);
  fs.writeFileSync(path.join(dir, 'kodjo-v2-plan-review.md'), REVIEW);
  // Out-File de Windows PowerShell : UTF-16LE avec BOM.
  fs.writeFileSync(path.join(dir, 'kodjo-v2-plan-review.json'), Buffer.concat([Buffer.from([0xff, 0xfe]),
    Buffer.from(JSON.stringify({ session_id: SESSION, result: o.result || REVIEW }), 'utf16le')]));
  fs.writeFileSync(path.join(dir, 'kodjo-v2-plan-review-transition.json'), JSON.stringify({ status: 'PASS', source_head: HEAD,
    protocol_execution_head: o.transitionHead || HEAD, bootstrap_path: BOOT }, null, 2));
  for (const n of ['proof', 'contract', 'ui-contract']) fs.writeFileSync(path.join(dir, 'kodjo-v2-plan-review-' + n + '.json'), '{"ok":true}\n');
  const steps = [{ name: 'Review V2 plan with Claude', conclusion: o.claude || 'success' }, { name: 'Publish independent V2 plan review', conclusion: o.publish || 'failure' }];
  return {
    run: { id: 37198105017, path: '.github/workflows/kodjo-v2-slice-plan-review.yml', head_branch: 'main', event: 'workflow_dispatch',
      status: 'completed', conclusion: o.conclusion || 'failure', head_sha: HEAD },
    jobs: [{ steps }], evidenceDir: dir, issueNumber: 288, planId: 5979342848,
    planComment: { body: (o.botPlan ? '[KODJO_V2] PLAN_OUTPUT' : '[KODJO_V2] PLAN_PUBLICATION') + '\nplanning_mode=REVISION\n', issue_url: 'https://api.github.com/repos/o/r/issues/288' },
    recoveredPlan: PLAN,
    issueComments: o.prior ? [{ body: '[KODJO_V2] PLAN_REVIEW_OUTPUT\nsource_plan_comment_id=5979342848\nverdict=REVISE\n' }] : [{ body: '[KODJO_V2] PLAN_PUBLICATION\n' }],
  };
}

test('rebuilds the review publication from preserved evidence, without Claude', (t) => {
  const out = build(fixture(t));
  assert.equal(out.verdict, 'REVISE');
  const lines = out.body.split('\n');
  assert.deepEqual(lines.slice(0, 13), ['[KODJO_V2] PLAN_REVIEW_OUTPUT', 'slice_id=V2-TEST-01', 'bootstrap_path=' + BOOT, 'source_head=' + HEAD,
    'protocol_execution_head=' + HEAD, 'application_pr=303', 'application_head=' + APP, 'source_plan_comment_id=5979342848', 'reviewer=CLAUDE',
    'review_session_id=' + SESSION, 'verdict=REVISE', 'republished_from_run_id=37198105017', 'STATUT : PLAN_REVISION_REQUIRED']);
  assert.ok(out.body.includes('\n\n' + REVIEW));
  for (const tag of ['KODJO_PLAN_IMPACT_REVIEW_JSON', 'KODJO_PLAN_CONTRACT_REVIEW_JSON', 'KODJO_UI_PLAN_CONTRACT_REVIEW_JSON', 'KODJO_PLAN_REVIEW_TRANSITION_JSON', 'KODJO_PLAN_REVIEW_FINDINGS_JSON'])
    assert.equal(out.body.split('<' + tag + '>').length, 2, tag);
  const findings = JSON.parse(out.body.match(/<KODJO_PLAN_REVIEW_FINDINGS_JSON>\n([\s\S]*?)\n<\/KODJO_PLAN_REVIEW_FINDINGS_JSON>/)[1]);
  assert.equal(findings.verdict, 'REVISE');
  assert.equal(findings.findings[0].target, 'UI-3D89E598F31D');
});

test('reads PowerShell evidence in UTF-16LE and UTF-8 with BOM', (t) => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bom-')), 'x');
  t.after(() => fs.rmSync(path.dirname(f), { recursive: true, force: true }));
  fs.writeFileSync(f, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('é', 'utf8')]));
  assert.equal(readText(f), 'é');
});

for (const [name, o, code] of [
  ['run did not fail', { conclusion: 'success' }, /REPUBLISH_RUN_INVALID/],
  ['Claude review not produced', { claude: 'failure' }, /REPUBLISH_REVIEW_NOT_PRODUCED/],
  ['publication step did not fail', { publish: 'success' }, /REPUBLISH_PUBLICATION_NOT_FAILED/],
  ['plan is a bot plan, not a pinned owner publication', { botPlan: true }, /REPUBLISH_PLAN_NOT_PINNED_PUBLICATION/],
  ['reviewed plan differs from the publication', { plan: PLAN + 'x' }, /REPUBLISH_PLAN_EVIDENCE_MISMATCH/],
  ['transition proved at another protocol head', { transitionHead: 'c'.repeat(40) }, /REPUBLISH_TRANSITION_MISMATCH/],
  ['Claude result differs from the preserved review', { result: REVIEW + 'x' }, /REPUBLISH_REVIEW_EVIDENCE_MISMATCH/],
  ['a review is already published for this plan', { prior: true }, /REPUBLISH_REVIEW_ALREADY_PUBLISHED/],
]) test('republication refuses: ' + name, (t) => assert.throws(() => build(fixture(t, o)), code));

test('plan review publishes a raw .NET string body (no Get-Content object under PowerShell 5.1)', () => {
  const wf = read('.github/workflows/kodjo-v2-slice-plan-review.yml');
  const publish = wf.slice(wf.indexOf('- name: Publish independent V2 plan review'), wf.indexOf('- name: Preserve V2 review evidence'));
  assert.match(publish, /\$commentBody=\[IO\.File\]::ReadAllText\(\$commentPath,\[Text\.Encoding\]::UTF8\)/);
  assert.doesNotMatch(publish, /\$commentBody=Get-Content/);
});

test('republication workflow is dispatch-only on main, never calls a model and never replans', () => {
  const wf = read('.github/workflows/kodjo-v2-plan-review-republish.yml');
  assert.match(wf, /on:\n  workflow_dispatch:/);
  assert.doesNotMatch(wf, /issue_comment|workflow_call/);
  assert.match(wf, /if: github\.ref == 'refs\/heads\/main'/);
  assert.match(wf, /node scripts\/kodjo\/republish-plan-review\.js "\$RUN_ID" "\$ISSUE_NUMBER" "\$PLAN_ID"/);
  assert.doesNotMatch(wf, /claude |anthropic|openai|kodjo-v2-slice-plan\.yml/i);
  assert.match(wf, /reason=PINNED_PUBLICATION\\nSTATUT : USER_VALIDATION/);
  assert.match(wf, /if \[ "\$VERDICT" = APPROVE \]; then\n\s+gh workflow run kodjo-v2-plan-handoff-materialize\.yml/);
});
