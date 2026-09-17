'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
function workflow(name) {
  return fs.readFileSync(path.join(root, '.github', 'workflows', name), 'utf8');
}

test('cycle de vie: les deux revues rejouent le contrat versionné avant Claude', () => {
  for (const name of ['kodjo-v2-slice-initial-plan-review.yml','kodjo-v2-slice-plan-review.yml']) {
    const source=workflow(name);
    assert.match(source,/verify-plan-contract-consistency\.js/);
    assert.match(source,/\bconsume\b/);
    const contractIndex=source.indexOf('Revalidate current plan contract before Claude');
    const claudeIndex=source.indexOf('Review initial V2 plan with Claude') >= 0
      ? source.indexOf('Review initial V2 plan with Claude')
      : source.indexOf('Review V2 plan with Claude');
    assert.ok(contractIndex >= 0 && claudeIndex > contractIndex, `${name}: contract gate must precede Claude`);
  }
});

test('cycle de vie: INITIAL documente son exception au transition verifier et conserve le contrôle produit immuable', () => {
  const source=workflow('kodjo-v2-slice-initial-plan-review.yml');
  assert.match(source,/verify-initial-product-sources\.js/);
  assert.match(source,/deliberately does not use verify-plan-review-transition\.js/);
  assert.doesNotMatch(source,/Copy-Item -LiteralPath scripts\/kodjo\/verify-plan-review-transition\.js/);
});

test('cycle de vie: la revue de révision conserve le contrôle de transition en plus du contrat', () => {
  const source=workflow('kodjo-v2-slice-plan-review.yml');
  assert.match(source,/verify-plan-review-transition\.js/);
  assert.match(source,/verify-plan-contract-consistency\.js/);
});

test('cycle de vie: IMPLEMENT exige plan, revue approuvée et gate utilisateur explicite avant agent', () => {
  const source=workflow('kodjo-v2-implementation-artifact.yml');
  for (const input of ['plan_comment_id','review_comment_id','user_gate_comment_id']) assert.match(source,new RegExp(`\\b${input}:`));
  assert.match(source,/verify-implementation-plan-gate\.js/);
  assert.match(source,/USER_IMPLEMENTATION_APPROVED/);
  const gateIndex=source.indexOf('Validate approved plan and explicit user gate before IMPLEMENT');
  const agentIndex=source.indexOf('Run bounded implementation or targeted correction');
  assert.ok(gateIndex >= 0 && agentIndex > gateIndex, 'implementation gate must precede agent');
});
