'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('0.6.29 — une nouvelle tranche V2 possède une entrée de premier plan sans PR applicative', () => {
  const spec = read('.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.29.md');
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

test('0.6.29 — le premier plan vérifie les sources produit au baseline exact avec diagnostic nominatif', () => {
  const workflow = read('.github/workflows/kodjo-v2-slice-initial-plan.yml');
  const verifier = read('scripts/kodjo/verify-initial-product-sources.js');
  assert.match(workflow, /git worktree add --detach \/tmp\/kodjo-v2-initial\/source "\$SOURCE_HEAD"/);
  assert.match(workflow, /verify-initial-product-sources\.js/);
  assert.match(verifier, /V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED/);
  assert.match(verifier, /expected=/);
  assert.match(verifier, /actual=/);
  assert.match(verifier, /nature=SHA256_MISMATCH/);
  assert.match(verifier, /LEGACY_WORKTREE_CRLF_HASH/);
  assert.doesNotMatch(workflow, /test "\$expected" = "\$actual"/);
});

test('0.6.29 — les activations futures hachent le blob Git du HEAD et non les octets du worktree', () => {
  const activation = read('scripts/kodjo/activate-kodjo-v2-slice.js');
  assert.match(activation, /gitBytes\(root,\['show',`\$\{head\}:\$\{normalized\}`\]\)/);
  assert.match(activation, /sha256Bytes\(blob\)/);
  assert.doesNotMatch(activation, /sha256File\(abs\)/);
});

test('0.6.29 — les sorties génératives du plan initial sont structurées puis assemblées mécaniquement', () => {
  const workflow = read('.github/workflows/kodjo-v2-slice-initial-plan.yml');
  assert.equal((workflow.match(/type:\"json_schema\"/g) || []).length, 2);
  assert.match(workflow, /name:\"kodjo_initial_plan\"/);
  assert.match(workflow, /name:\"kodjo_initial_plan_decisions\"/);
  assert.match(workflow, /jq '\.modified_modules' \/tmp\/kodjo-v2-initial\/draft-structured\.json/);
  assert.match(workflow, /printf '<\/KODJO_MODIFIED_MODULES_JSON>\\nPLAN_STATUS: %s/);
  assert.match(workflow, /JSON\.parse\(fs\.readFileSync\('\/tmp\/kodjo-v2-initial\/decisions\.json'/);
  assert.doesNotMatch(workflow, /Return exactly one block and nothing else/);
});

test('0.6.29 — la revue du premier plan n exige pas de PR applicative et rejoue le plan-impact', () => {
  const workflow = read('.github/workflows/kodjo-v2-slice-initial-plan-review.yml');

  assert.match(workflow, /\[KODJO_V2\] START_INITIAL_PLAN_REVIEW/);
  assert.match(workflow, /Plan author mismatch/);
  assert.match(workflow, /planning_mode=INITIAL/);
  assert.match(workflow, /planning_contract=kodjo\\\.plan-impact\\\.v1/);
  assert.match(workflow, /verify-plan-impact\.js/);
  assert.match(workflow, /PLAN_REVIEW_APPROVED/);
  assert.match(workflow, /PLAN_REVISION_REQUIRED/);
  assert.match(workflow, /Checkout exact initial product source/);
  assert.match(workflow, /Build exact product context from checked-out source/);
  assert.doesNotMatch(workflow, /application_pr=/i);
  assert.doesNotMatch(workflow, /pulls\//);
});

test('0.6.29 — un plan initial peut être republié après REVISE sans changer de chemin protocolaire', () => {
  const spec = read('.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.29.md');
  assert.match(spec, /nouvelle invocation `START_INITIAL_PLAN`/);
  assert.match(spec, /PLAN_REVIEW_OUTPUT/);
  assert.match(spec, /nouvel identifiant de commentaire de plan/);
});

test('0.6.29 — le parcours de révision V2 historique est conservé séparément', () => {
  const revision = read('.github/workflows/kodjo-v2-slice-plan.yml');
  const review = read('.github/workflows/kodjo-v2-slice-plan-review.yml');

  assert.match(revision, /\[KODJO_V2\] START_PLAN_REVISION/);
  assert.match(revision, /APPLICATION_PR/);
  assert.match(review, /\[KODJO_V2\] START_PLAN_REVIEW/);
  assert.match(review, /application_pr/);
});

test('0.6.29 — aucun succès de plan ou de revue initiale n autorise l implémentation', () => {
  const spec = read('.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.29.md');
  assert.match(spec, /PLAN_REVIEW_APPROVED` seul/);
  assert.match(spec, /gate utilisateur explicite/);
});
