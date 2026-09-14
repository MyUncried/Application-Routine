'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const Policy = require('../../scripts/kodjo/resolve-implementation-review-policy');

function evidence(overrides = {}) {
  return {
    operation_kind: 'IMPLEMENT',
    same_slice_id: true,
    same_approved_plan_binding: true,
    within_approved_scope: true,
    introduces_new_requirement: false,
    prior_slice_review_completed: false,
    ...overrides,
  };
}

test('0.6.23 — une nouvelle tranche déclenche exactement une revue', () => {
  assert.deepEqual(Policy.resolveImplementationReviewPolicy(evidence()), {
    status: 'REVIEW_REQUIRED',
    reason: 'INITIAL_SLICE_IMPLEMENTATION',
    review_required: true,
  });
  assert.deepEqual(
    Policy.resolveImplementationReviewPolicy(evidence({ prior_slice_review_completed: true })),
    {
      status: 'REVIEW_SATISFIED',
      reason: 'SLICE_REVIEW_ALREADY_COMPLETED',
      review_required: false,
    }
  );
});

test('0.6.23 — la famille exacte V2-BILAT-01 RESUME_DELTA passe à la validation utilisateur sans nouvelle revue', () => {
  const result = Policy.resolveImplementationReviewPolicy(evidence({
    operation_kind: 'RESUME_DELTA',
    prior_slice_review_completed: false,
  }));
  assert.deepEqual(result, {
    status: 'REVIEW_NOT_REQUIRED',
    reason: 'CORRECTION_WITHIN_APPROVED_SCOPE',
    review_required: false,
  });
});

test('0.6.23 — TARGETED_FIX et CORRECTION restent dispensés dans le périmètre approuvé', () => {
  for (const operation_kind of ['TARGETED_FIX', 'CORRECTION']) {
    assert.equal(
      Policy.resolveImplementationReviewPolicy(evidence({ operation_kind })).review_required,
      false
    );
  }
});

test('0.6.23 — une extension ou un changement de référence déclenche la revue malgré le libellé correctif', () => {
  const cases = [
    { same_slice_id: false },
    { same_approved_plan_binding: false },
    { within_approved_scope: false },
    { introduces_new_requirement: true },
  ];
  for (const changed of cases) {
    const result = Policy.resolveImplementationReviewPolicy(evidence({
      operation_kind: 'RESUME_DELTA',
      ...changed,
    }));
    assert.equal(result.status, 'REVIEW_REQUIRED');
    assert.equal(result.reason, 'NEW_SLICE_OR_SCOPE_EXTENSION');
  }
});

test('0.6.23 — une preuve absente ou une opération inconnue est refusée', () => {
  const missing = evidence({ operation_kind: 'RESUME_DELTA' });
  delete missing.same_approved_plan_binding;
  assert.throws(
    () => Policy.resolveImplementationReviewPolicy(missing),
    /IMPLEMENTATION_REVIEW_POLICY_PROOF_MISSING:same_approved_plan_binding/
  );
  assert.throws(
    () => Policy.resolveImplementationReviewPolicy(evidence({ operation_kind: 'REVIEW_ME' })),
    /IMPLEMENTATION_REVIEW_POLICY_OPERATION_INVALID/
  );
});

test('0.6.23 — la règle normative conserve les contrôles objectifs et interdit toute boucle automatique', () => {
  const spec = fs.readFileSync(
    path.join(root, '.github', 'orchestration', 'KODJO_PROTOCOL_V2_SPEC_0.6.23.md'),
    'utf8'
  );
  assert.match(spec, /USER_VALIDATION_PENDING/);
  assert.match(spec, /Jest, TypeScript, lint, intégrité, provenance, périmètre/);
  assert.match(spec, /Il n'existe aucune boucle automatique de nouvelle revue après correction/);
  assert.match(spec, /ne déclenche ni correction, ni invocation de Claude, ni modification du HEAD/);
  assert.match(spec, /df38ade5e8737ed8f59a3a7472ebe9b168a85145/);
  assert.match(spec, /34872653037/);
  assert.match(spec, /sans créer ni simuler \`kodjo-v2-openai\.yml\`/);
});
