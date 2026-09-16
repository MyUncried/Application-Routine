'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('0.6.26 — une nouvelle tranche V2 possède une entrée de premier plan sans PR applicative', () => {
  const spec = read('.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.26.md');
  const workflow = read('.github/workflows/kodjo-v2-slice-initial-plan.yml');

  assert.match(spec, /START_INITIAL_PLAN/);
  assert.match(spec, /aucune PR applicative n’est requise/);
  assert.match(workflow, /\[KODJO_V2\] START_INITIAL_PLAN/);
  assert.match(workflow, /V2_INITIAL_SOURCE_MUST_EQUAL_BASELINE/);
  assert.match(workflow, /planning_mode=INITIAL/);
  assert.match(workflow, /planning_contract=kodjo\.plan-impact\.v1/);
  assert.match(workflow, /PLAN_READY_FOR_INDEPENDENT_REVIEW/);
  assert.doesNotMatch(workflow, /APPLICATION_PR=/);
  assert.doesNotMatch(workflow, /pulls\/\$APPLICATION_PR/);
});

test('0.6.26 — la revue du premier plan n exige pas de PR applicative et rejoue le plan-impact', () => {
  const workflow = read('.github/workflows/kodjo-v2-slice-initial-plan-review.yml');

  assert.match(workflow, /\[KODJO_V2\] START_INITIAL_PLAN_REVIEW/);
  assert.match(workflow, /Plan author mismatch/);
  assert.match(workflow, /planning_mode=INITIAL/);
  assert.match(workflow, /planning_contract=kodjo\\\.plan-impact\\\.v1/);
  assert.match(workflow, /verify-plan-impact\.js/);
  assert.match(workflow, /PLAN_REVIEW_APPROVED/);
  assert.match(workflow, /PLAN_REVISION_REQUIRED/);
  assert.doesNotMatch(workflow, /application_pr=/i);
  assert.doesNotMatch(workflow, /pulls\//);
});

test('0.6.26 — le parcours de révision V2 historique est conservé séparément', () => {
  const revision = read('.github/workflows/kodjo-v2-slice-plan.yml');
  const review = read('.github/workflows/kodjo-v2-slice-plan-review.yml');

  assert.match(revision, /\[KODJO_V2\] START_PLAN_REVISION/);
  assert.match(revision, /APPLICATION_PR/);
  assert.match(review, /\[KODJO_V2\] START_PLAN_REVIEW/);
  assert.match(review, /application_pr/);
});

test('0.6.26 — aucun succès de plan ou de revue initiale n autorise l implémentation', () => {
  const spec = read('.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.26.md');
  assert.match(spec, /PLAN_REVIEW_APPROVED` seul/);
  assert.match(spec, /gate utilisateur explicite/);
});
