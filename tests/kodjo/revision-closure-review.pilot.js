'use strict';
// Fermeture bornée d'un REVISE sur le chemin de révision (kodjo-v2-slice-plan-review.yml) et constats antérieurs
// partageant une cible (revue 5980019179 : deux défauts distincts du critère UI-5F3D94866D30).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { verify } = require('../../scripts/kodjo/verify-plan-closure-review');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', '..', rel), 'utf8').replace(/\r\n/g, '\n');
const F = (target, category, diagnostic) => ({ category, target_kind: 'CRITERION_ID', target, blocking: true, diagnostic, expected_correction: 'x',
  dependency_expansion_required: false, dependency_evidence: '' });
const PRIOR = { findings: [F('UI-A', 'UI_CRITERION', 'défaut 1'), F('UI-B', 'UI_CRITERION', 'défaut 2'), F('UI-B', 'PATH', 'défaut 3')] };
const review = (closures) => '| N | Correction examinée | Preuve précise | Fermé | Justification |\n|---|---|---|---|---|\n' +
  closures.map(([n, c]) => '| ' + n + ' | c | e | ' + (c ? 'OUI' : 'NON') + ' | j |').join('\n') + '\n<KODJO_CLOSURE_JSON>\n' +
  JSON.stringify({ closures: closures.map(([finding, closed]) => ({ finding, closed, correction_examined: 'c', evidence: 'e', justification: 'j' })) }) + '\n</KODJO_CLOSURE_JSON>\n';
const open = (n, o = {}) => ({ ...PRIOR.findings[n - 1], diagnostic: 'Prior finding ' + n + ': still open', ...o });

test('shared target: each prior finding is identified by its number', () => {
  assert.deepEqual(verify(review([[1, true], [2, true], [3, false]]), { verdict: 'REVISE', findings: [open(3)] }, PRIOR).open, [3]);
  assert.deepEqual(verify(review([[1, true], [2, false], [3, true]]), { verdict: 'REVISE', findings: [open(2)] }, PRIOR).open, [2]);
  assert.equal(verify(review([[1, true], [2, true], [3, true]]), { verdict: 'APPROVE', findings: [] }, PRIOR).verdict, 'APPROVE');
});

test('shared target: a number designating another target, or a missing number, is refused', () => {
  assert.throws(() => verify(review([[1, false], [2, true], [3, true]]), { verdict: 'REVISE', findings: [open(2, { diagnostic: 'Prior finding 1: x' })] }, PRIOR), /CLOSURE_FINDING_NUMBER_MISMATCH/);
  assert.throws(() => verify(review([[1, true], [2, false], [3, true]]), { verdict: 'REVISE', findings: [open(2, { diagnostic: 'still open' })] }, PRIOR), /CLOSURE_FINDING_NUMBER_MISMATCH/);
  assert.throws(() => verify(review([[1, true], [2, true], [3, false]]), { verdict: 'REVISE', findings: [open(3, { category: 'UI_CRITERION' })] }, PRIOR), /CLOSURE_CATEGORY_CHANGED:3/);
  assert.throws(() => verify(review([[1, true], [2, true], [3, true]]), { verdict: 'REVISE', findings: [open(3)] }, PRIOR), /CLOSURE_CONTRADICTS_FINDINGS:3/);
});

test('revision plan review runs a bounded closure when the publication pins prior findings and a register', () => {
  const wf = read('.github/workflows/kodjo-v2-slice-plan-review.yml');
  const gate = wf.slice(wf.indexOf('- name: Validate immutable V2 review gate'), wf.indexOf('- name: Snapshot plan verifiers from protocol'));
  assert.match(gate, /if\(\$genericPublication\)\{\n\s+\$closureDir=Join-Path \$env:RUNNER_TEMP 'kodjo-v2-closure'\n\s+\$closureOut=node scripts\/kodjo\/recover-published-plan\.js --closure \$planId \$closureDir/);
  assert.match(gate, /"closure_review=\$\(if\(\$closureReview\)\{'true'\}else\{'false'\}\)"/);
  const snapshot = wf.slice(wf.indexOf('- name: Snapshot plan verifiers from protocol'), wf.indexOf('- name: Checkout exact V2 source'));
  assert.match(snapshot, /verify-plan-closure-review\.js/);
  assert.match(snapshot, /verify-pre1-closure-review\.js/);
  const claude = wf.slice(wf.indexOf('- name: Review V2 plan with Claude'), wf.indexOf('- name: Publish independent V2 plan review'));
  assert.match(claude, /CLOSURE_REVIEW: \$\{\{ steps\.gate\.outputs\.closure_review \}\}/);
  assert.match(claude, /BOUNDED CLOSURE REVIEW of a corrected revision plan/);
  assert.match(claude, /FORBIDDEN: new subjects, any additional finding/);
  assert.match(claude, /including the loss of any element of the previously reviewed candidate/);
  assert.ok(claude.indexOf('verify-plan-closure-review.js') > claude.indexOf('normalize-review-findings.js'));
  assert.ok(claude.indexOf("throw 'Closure review exceeded the prior-findings bound'") < claude.indexOf('"session_id=$($json.session_id)"'));
  assert.match(wf, /kodjo-v2-closure-bound\.json/);
});
