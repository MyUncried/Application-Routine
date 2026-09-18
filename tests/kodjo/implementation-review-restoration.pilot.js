'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const A = require(path.join(root, 'scripts', 'kodjo', 'extract-plan-acceptance.js'));
const V = require(path.join(root, 'scripts', 'kodjo', 'verify-implementation-review.js'));

const plan = [
  '# Plan',
  '## 9. Critères d’acceptation',
  '| Exigence | Preuve attendue |',
  '|---|---|',
  '| Navigation basse | UI + test |',
  '| Médias | section visible |',
  '## 10. Risques',
].join('\n');

function review(statuses, verdict = 'APPROVE') {
  const criteria = A.extract(plan).criteria.map((c, i) => ({
    ...c,
    status: statuses[i],
    files: ['x.tsx'],
    evidence: ['preuve ' + c.id],
  }));
  const blocking = criteria.filter((c) => c.status === 'PARTIELLEMENT_CONFORME' || c.status === 'NON_CONFORME').length;
  const nonVerifiable = criteria.filter((c) => c.status === 'NON_VERIFIABLE').length;
  return [
    '<KODJO_IMPLEMENTATION_REVIEW_JSON>',
    JSON.stringify({
      schema: 'kodjo.protocol.v2.implementation-review.0.6.38',
      reviewed_head: 'a'.repeat(40),
      criteria_complete: true,
      blocking_count: blocking,
      non_verifiable_count: nonVerifiable,
      criteria,
    }),
    '</KODJO_IMPLEMENTATION_REVIEW_JSON>',
    'VERDICT: ' + verdict,
  ].join('\n');
}

test('restauration — extrait exhaustivement les critères du plan', () => {
  const out = A.extract(plan);
  assert.deepEqual(out.criteria.map((c) => c.id), ['AC-01', 'AC-02']);
  assert.equal(out.criteria[0].requirement, 'Navigation basse');
});

test('restauration — refuse un critère absent', () => {
  const broken = review(['CONFORME', 'CONFORME']).replace(/,\{"id":"AC-02"[\s\S]*?\}\]/, ']');
  assert.throws(() => V.verify(plan, broken, 'a'.repeat(40)));
});

test('restauration — NON_CONFORME impose REVISE', () => {
  assert.throws(() => V.verify(plan, review(['NON_CONFORME', 'CONFORME'], 'APPROVE'), 'a'.repeat(40)),
    /BLOCKING_VERDICT_INVALID/);
  assert.equal(V.verify(plan, review(['NON_CONFORME', 'CONFORME'], 'REVISE'), 'a'.repeat(40)).verdict, 'REVISE');
});

test('restauration — NON_VERIFIABLE reste explicite mais peut atteindre la validation utilisateur', () => {
  const result = V.verify(plan, review(['CONFORME', 'NON_VERIFIABLE'], 'APPROVE'), 'a'.repeat(40));
  assert.equal(result.non_verifiable, 1);
});

test('restauration — le HEAD exact est obligatoire', () => {
  assert.throws(() => V.verify(plan, review(['CONFORME', 'CONFORME']), 'b'.repeat(40)), /HEAD_MISMATCH/);
});

test('restauration — Lean Queue redispatche vers la revue après livraison et checkpoint', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'kodjo-v2-lean-queue.yml'), 'utf8');
  const checkpoint = workflow.indexOf('name: Publish visual application checkpoint');
  const dispatch = workflow.indexOf('name: Dispatch independent implementation review');
  assert.ok(checkpoint >= 0 && dispatch > checkpoint);
  assert.match(workflow, /kodjo_v2_implementation_ready/);
});

test('restauration — la livraison technique ne se déclare plus vérifiée avant revue', () => {
  const supervisor = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'run-queued-request.ps1'), 'utf8');
  assert.doesNotMatch(supervisor, /Verdict: IMPLEMENTED_AND_VERIFIED/);
  assert.match(supervisor, /Verdict: IMPLEMENTATION_CHECKS_PASSED/);
});

test('restauration — le workflow de revue exige la couverture exhaustive', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'kodjo-v2-implementation-review.yml'), 'utf8');
  assert.match(workflow, /extract-plan-acceptance\.js/);
  assert.match(workflow, /verify-implementation-review\.js/);
  assert.match(workflow, /Every acceptance criterion MUST appear exactly once/);
  assert.match(workflow, /USER_VALIDATION_PENDING/);
});
