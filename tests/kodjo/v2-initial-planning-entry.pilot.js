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
  assert.match(workflow, /!contains\(github\.event\.comment\.body, '\[KODJO_V2\] START_INITIAL_PLAN_REVIEW'\)/);
  assert.match(workflow, /V2_INITIAL_SOURCE_MUST_EQUAL_BASELINE/);
  assert.match(workflow, /V2_INITIAL_PLANNING_APPLICATION_HEAD_MISSING/);
  assert.match(workflow, /V2_INITIAL_PLANNING_APPLICATION_HEAD_MUST_EQUAL_BASELINE/);
  assert.match(workflow, /planning_mode=INITIAL/);
  assert.match(workflow, /planning_contract=kodjo\.plan-impact\.v1/);
  assert.match(workflow, /PLAN_READY_FOR_INDEPENDENT_REVIEW/);
  assert.doesNotMatch(workflow, /APPLICATION_PR=/);
  assert.doesNotMatch(workflow, /pulls\/\$APPLICATION_PR/);
});

test('0.6.29 — le premier plan vérifie les sources produit depuis les blobs Git du baseline exact', () => {
  const workflow = read('.github/workflows/kodjo-v2-slice-initial-plan.yml');
  const verifier = read('scripts/kodjo/verify-initial-product-sources.js');
  assert.match(workflow, /git worktree add --detach \/tmp\/kodjo-v2-initial\/source "\$SOURCE_HEAD"/);
  assert.match(workflow, /verify-initial-product-sources\.js/);
  assert.match(verifier, /V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED/);
  assert.match(verifier, /expected=/);
  assert.match(verifier, /actual=/);
  assert.match(verifier, /nature=SHA256_MISMATCH/);
  assert.match(verifier, /spawnSync\('git', \['show', `\$\{head\}:\$\{file\}`\]/);
  assert.match(verifier, /authority=GIT_BLOB/);
  assert.match(verifier, /baseline_head/);
  assert.doesNotMatch(verifier, /legacyCrlfHash/);
  assert.doesNotMatch(verifier, /fs\.readFileSync\(absolute\)/);
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

test('0.6.29 — le premier plan ferme le périmètre sur un seul niveau d importateurs directs', () => {
  const workflow = read('.github/workflows/kodjo-v2-slice-initial-plan.yml');
  assert.equal((workflow.match(/scan-plan-impact\.js\" scan/g) || []).length, 1);
  assert.doesNotMatch(workflow, /for iteration in 1 2 3 4/);
  assert.doesNotMatch(workflow, /promoted\.json/);
  assert.match(workflow, /contract=ONE_LEVEL_DIRECT_IMPORTS/);
  assert.match(workflow, /INITIAL_PLAN_DIRECT_SCOPE/);
  assert.match(workflow, /INITIAL_PLAN_DIRECT_SCOPE_WARNING/);
  assert.match(workflow, /scope\.length>20/);
});



test('0.6.29 — le contrat de plan bloque divergence scope et tests hors contrat avant revue', () => {
  const initial = read('.github/workflows/kodjo-v2-slice-initial-plan.yml');
  const revision = read('.github/workflows/kodjo-v2-slice-plan.yml');
  const verifier = read('scripts/kodjo/verify-plan-contract-consistency.js');
  for (const workflow of [initial, revision]) {
    assert.match(workflow, /verify-plan-contract-consistency\.js/);
    assert.match(workflow, /KODJO_PLAN_CONTRACT_JSON/);
    assert.match(workflow, /Every new test required by the plan must be named/);
  }
  assert.match(verifier, /scope_allow prose != scope_allow machine/);
  assert.match(verifier, /TEST_CONTRACT_CONSISTENCY/);
  assert.match(verifier, /nouveau test exige sans CREATE autorise/);
  assert.match(verifier, /test en écriture absent de la section Tests/);
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

test('0.6.29 — la revue initiale emporte le registre de migration et matérialise le contexte depuis les blobs Git', () => {
  const workflow = read('.github/workflows/kodjo-v2-slice-initial-plan-review.yml');
  const verifier = read('scripts/kodjo/verify-initial-product-sources.js');
  const migrations = JSON.parse(read('scripts/kodjo/lib/initial-product-source-migrations.json'));
  const bootstrap = JSON.parse(read('.github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json'));

  assert.match(workflow, /Copy-Item -LiteralPath scripts\/kodjo\/verify-initial-product-sources\.js -Destination \$protocol/);
  assert.match(workflow, /Copy-Item -LiteralPath scripts\/kodjo\/lib -Destination \(Join-Path \$protocol 'lib'\) -Recurse/);
  assert.match(workflow, /\$sourceVerifier=Join-Path \$protocol 'verify-initial-product-sources\.js'/);
  assert.match(workflow, /& node \$sourceVerifier \$bootstrapCopy \(Get-Location\)\.Path \$evidence \$context/);
  assert.match(workflow, /Canonical product evidence missing/);
  assert.doesNotMatch(workflow, /Copy-Item -LiteralPath \$sourcePath -Destination \$destination/);
  assert.match(verifier, /initial-product-source-migrations\.json/);
  assert.match(verifier, /materialized=CANONICAL_GIT_BLOBS/);
  assert.match(verifier, /AGGREGATED_SOURCE_FAILURES/);
  assert.match(verifier, /authority=GIT_BLOB/);
  assert.doesNotMatch(workflow, /Get-FileHash -Algorithm SHA256/);
  assert.doesNotMatch(workflow, /Product source hash mismatch at baseline/);

  assert.equal(migrations.schema_version, 'kodjo.protocol.v2.product-source-hash-migrations.v1');
  assert.equal(migrations.migrations.length, 1);
  const migration = migrations.migrations[0];
  assert.equal(migration.slice_id, bootstrap.slice_id);
  assert.equal(migration.baseline_head, bootstrap.baseline_head);
  const I = require('../../scripts/kodjo/lib/slice-identity');
  const productIdentity = I.sha256(I.canonical({ slice_id:bootstrap.slice_id, baseline_head:bootstrap.baseline_head, product_sources:bootstrap.product_sources }));
  assert.equal(migration.product_identity_sha256, productIdentity);
  assert.deepEqual(migration.legacy_product_sources, bootstrap.product_sources);
});

test('0.6.29 — les frontières aval de la revue initiale sont ordonnées et utilisent le chemin Claude déjà éprouvé', () => {
  const initial = read('.github/workflows/kodjo-v2-slice-initial-plan-review.yml');
  const historical = read('.github/workflows/kodjo-v2-slice-plan-review.yml');

  const replay = initial.indexOf('- name: Replay initial V2 plan impact independently');
  const claude = initial.indexOf('- name: Review initial V2 plan with Claude');
  const publish = initial.indexOf('- name: Publish independent initial V2 plan review');
  const preserve = initial.indexOf('- name: Preserve initial V2 review evidence');
  assert.ok(replay >= 0 && replay < claude && claude < publish && publish < preserve);

  for (const token of [
    "@('-p','--output-format','json','--dangerously-skip-permissions')",
    'if (!$json.session_id -or !$json.result)',
    "VERDICT:\\s*APPROVE",
    "VERDICT:\\s*REVISE",
    'PLAN_REVIEW_APPROVED',
    'PLAN_REVISION_REQUIRED',
    'gh issue comment $env:ISSUE_NUMBER',
    '<KODJO_PLAN_IMPACT_REVIEW_JSON>',
  ]) assert.ok(initial.includes(token), `missing initial review boundary token: ${token}`);

  for (const token of [
    "@('-p','--output-format','json','--dangerously-skip-permissions')",
    'if (!$json.session_id -or !$json.result)',
    "VERDICT:\\s*APPROVE",
    "VERDICT:\\s*REVISE",
    'gh issue comment $env:ISSUE_NUMBER',
  ]) assert.ok(historical.includes(token), `historical review no longer proves shared boundary: ${token}`);
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
