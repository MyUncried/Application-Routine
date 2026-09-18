'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const { sha256 } = require('../../scripts/kodjo/lib/plan-impact');
const {
  REQUIRED_STOPS,
  renderImplementationMission,
  verifyImplementationMission,
} = require('../../scripts/kodjo/lib/implementation-contract');
const {
  extractImplementationStopStatus,
  IMPLEMENTATION_STOP_STATUSES,
} = require('../../scripts/kodjo/run-local-claude');

function planFixture() {
  const matrix = {
    schema: 'kodjo.ui-criteria.v1',
    criteria: [{
      criterion_id: 'UI-001',
      source: { path:'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md', locator:'CE-X', requirement:'Contrôle exact.' },
      risk_types:['FUNCTIONAL','VISUAL','DEVICE'],
      reuse_search:['src/shared/ui'],
      component_decision:'REUSE',
      selected_component:'ExistingOverlay',
      decision_justification:'Composant canonique existant.',
      change_targets:['src/features/example/ExampleScreen.tsx'],
      tests:['src/features/example/__tests__/ExampleScreen.test.tsx'],
      proof_required:['FUNCTIONAL_TEST','VISUAL_COMPARE','DEVICE_CHECK'],
    }],
    preservation:{
      preserve:[{target:'Navigation',justification:'Acquis gelé.'}],
      change:[{target:'ExampleScreen',justification:'Ouvert par la mission.'}],
      forbidden:[{target:'Shell',justification:'Refonte interdite.'}],
    },
  };
  const uiContract = {
    schema:'kodjo.ui-plan-contract.v1',
    contract_version:1,
    protocol_commit:'a'.repeat(40),
    scan_revision:'b'.repeat(40),
    ui_applicable:true,
    ui_paths:['src/features/example/ExampleScreen.tsx'],
    criterion_count:1,
    matrix_sha256:sha256(matrix),
  };
  return '# Plan\n\n<KODJO_UI_CRITERIA_MATRIX_JSON>\n'+JSON.stringify(matrix)+'\n</KODJO_UI_CRITERIA_MATRIX_JSON>\n' +
    '<KODJO_UI_PLAN_CONTRACT_JSON>\n'+JSON.stringify(uiContract)+'\n</KODJO_UI_PLAN_CONTRACT_JSON>\n';
}

test('implementation contract: mission est dérivée par hash du plan approuvé sans recopier la matrice', () => {
  const plan = planFixture();
  const blob = 'c'.repeat(40);
  const { mission, contract } = renderImplementationMission('V2-TEST', plan, blob);
  assert.equal(contract.schema, 'kodjo.ui-implementation-contract.v1');
  assert.equal(contract.ui_criterion_count, 1);
  assert.equal(contract.plan_blob_oid, blob);
  assert.deepEqual(contract.required_stops, REQUIRED_STOPS);
  assert.doesNotMatch(mission, /<KODJO_UI_CRITERIA_MATRIX_JSON>/);
  assert.match(mission, /Lire avant tout code le bloc exact/);
  assert.match(mission, /PRESERVE \/ CHANGE \/ FORBIDDEN/);
  assert.match(mission, /KODJO_IMPLEMENTATION_CONFORMANCE/);
  assert.match(mission, /PENDING_DEVICE/);
  assert.doesNotThrow(() => verifyImplementationMission(mission, plan, blob));
});

test('implementation contract: mission liée à un autre plan est refusée', () => {
  const plan = planFixture();
  const { mission } = renderImplementationMission('V2-TEST', plan, 'c'.repeat(40));
  assert.throws(
    () => verifyImplementationMission(mission, plan, 'd'.repeat(40)),
    /IMPLEMENTATION_CONTRACT_DRIFT/
  );
});

test('implementation contract: dérive de matrice après approbation est refusée', () => {
  const plan = planFixture();
  const { mission } = renderImplementationMission('V2-TEST', plan, 'c'.repeat(40));
  const changed = plan.replace('Contrôle exact.', 'Contrôle modifié.');
  assert.throws(
    () => verifyImplementationMission(mission, changed, 'c'.repeat(40)),
    /IMPLEMENTATION_UI_MATRIX_HASH_MISMATCH/
  );
});

test('implementation contract: required stop supprimé de la mission est refusé', () => {
  const plan = planFixture();
  const { mission } = renderImplementationMission('V2-TEST', plan, 'c'.repeat(40));
  const changed = mission.replace(',ASSET_REQUIRED', '');
  assert.throws(
    () => verifyImplementationMission(changed, plan, 'c'.repeat(40)),
    /IMPLEMENTATION_CONTRACT_DRIFT/
  );
});

test('implementation contract: taxonomie des barrières reste canonique et exécutable', () => {
  assert.deepEqual([...IMPLEMENTATION_STOP_STATUSES].sort(), [
    'CHANGE_REQUEST_REQUIRED',
    'CLARIFICATION_REQUIRED',
    'NATIVE_PRIMITIVE_EXCEPTION_REQUIRED',
    'SCOPE_EXPANSION_REQUIRED',
  ].sort());
  assert.equal(extractImplementationStopStatus(JSON.stringify({result:'ok\nKODJO_STOP_STATUS: CHANGE_REQUEST_REQUIRED\n'})), 'CHANGE_REQUEST_REQUIRED');
  assert.equal(extractImplementationStopStatus(JSON.stringify({result:'ok\nKODJO_STOP_STATUS: NONE\n'})), null);
  assert.throws(
    () => extractImplementationStopStatus(JSON.stringify({result:'KODJO_STOP_STATUS: ASSET_REQUIRED\n'})),
    /IMPLEMENTATION_STOP_STATUS_INVALID/
  );
});

test('implementation contract: aucun nouveau canal Lean Queue n est ajouté', () => {
  const materializer = fs.readFileSync(path.join(root,'scripts','kodjo','materialize-approved-plan-handoff.js'),'utf8');
  const generator = fs.readFileSync(path.join(root,'scripts','kodjo','generate-approved-plan-lean-request.js'),'utf8');
  const runner = fs.readFileSync(path.join(root,'scripts','kodjo','run-queued-request.ps1'),'utf8');
  assert.match(materializer,/renderImplementationMission/);
  assert.match(generator,/verifyImplementationMission/);
  assert.match(runner,/verify-implementation-mission\.js/);
  assert.doesNotMatch(generator,/schema_version:\s*'kodjo\.protocol\.v2\.lean-request\.0\.6\.14'/);
  assert.match(generator,/kodjo\.protocol\.v2\.lean-request\.0\.6\.13/);
  const contractGate=runner.indexOf('verify-implementation-mission.js');
  const claudeBoundary=runner.indexOf('start-kodjo-v2.ps1');
  assert.ok(contractGate >= 0 && claudeBoundary > contractGate, 'implementation contract gate must precede Claude');
});
