'use strict';
const { matrixFingerprint } = require('../../scripts/kodjo/lib/ui-criteria-contract');

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
const { inspectReport } = require('../../scripts/kodjo/lib/implementation-report');
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
    matrix_sha256:matrixFingerprint(matrix),
  };
  return '# Plan\n\n<KODJO_UI_CRITERIA_MATRIX_JSON>\n'+JSON.stringify(matrix)+'\n</KODJO_UI_CRITERIA_MATRIX_JSON>\n' +
    '<KODJO_UI_PLAN_CONTRACT_JSON>\n'+JSON.stringify(uiContract)+'\n</KODJO_UI_PLAN_CONTRACT_JSON>\n';
}


function planFixtureV2() {
  const matrix = {
    schema: 'kodjo.ui-criteria.v2',
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
      assertions:[
        {assertion_id:'UI-001-A01',source:{path:'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md',locator:'CE-X/content'},property_type:'CONTENT',expected:'Contenu canonique présent.',proof_required:['FUNCTIONAL_TEST']},
        {assertion_id:'UI-001-A02',source:{path:'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md',locator:'CE-X/geometry'},property_type:'GEOMETRY',expected:'Géométrie conforme.',proof_required:['VISUAL_COMPARE','DEVICE_CHECK']},
      ],
    }],
    preservation:{
      preserve:[{target:'Navigation',justification:'Acquis gelé.'}],
      change:[{target:'ExampleScreen',justification:'Ouvert par la mission.'}],
      forbidden:[{target:'Shell',justification:'Refonte interdite.'}],
    },
  };
  const assertionIds=matrix.criteria[0].assertions.map(a=>a.assertion_id).sort();
  const uiContract = {
    schema:'kodjo.ui-plan-contract.v1',
    contract_version:2,
    protocol_commit:'a'.repeat(40),
    scan_revision:'b'.repeat(40),
    ui_applicable:true,
    ui_paths:['src/features/example/ExampleScreen.tsx'],
    criterion_count:1,
    assertion_count:assertionIds.length,
    assertion_ids_sha256:sha256(assertionIds),
    matrix_sha256:matrixFingerprint(matrix),
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


test('implementation contract v2: assertions sont liées par hash et exigées dans le rapport', () => {
  const plan=planFixtureV2();
  const blob='e'.repeat(40);
  const {mission,contract}=renderImplementationMission('V2-TEST',plan,blob);
  assert.equal(contract.schema,'kodjo.ui-implementation-contract.v2');
  assert.equal(contract.ui_assertion_count,2);
  assert.match(mission,/ui_assertion_count=2/);
  assert.match(mission,/assertion_results/);
  assert.doesNotThrow(()=>verifyImplementationMission(mission,plan,blob));
  const altered=mission.replace(/ui_assertion_count=2/,'ui_assertion_count=1');
  assert.throws(()=>verifyImplementationMission(altered,plan,blob),/IMPLEMENTATION_CONTRACT_DRIFT/);
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
  const changed = mission.replace(',CLARIFICATION_REQUIRED', '');
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


test('implementation report v2: couvre exactement chaque assertion', () => {
  const expected=[{criterion_id:'UI-001',assertions:[{assertion_id:'UI-001-A01'},{assertion_id:'UI-001-A02'}]}];
  const base={criterion_id:'UI-001',implementation_status:'IMPLEMENTED',files_or_symbols:['src/x.tsx'],component_used:'Existing',tests_run:['jest'],proof_status:'PENDING_DEVICE',preserve_status:'PASS',residual_status:'NONE',
    assertion_results:[
      {assertion_id:'UI-001-A01',implementation_status:'IMPLEMENTED',evidence:'Contenu livré.'},
      {assertion_id:'UI-001-A02',implementation_status:'PENDING_DEVICE',evidence:'Géométrie à contrôler sur appareil.'},
    ]};
  const report='<KODJO_IMPLEMENTATION_CONFORMANCE>'+JSON.stringify({criteria:[base]})+'</KODJO_IMPLEMENTATION_CONFORMANCE>\nKODJO_STOP_STATUS: NONE';
  assert.equal(inspectReport(report,expected).status,'COMPLETE');
  const missing={...base,assertion_results:base.assertion_results.slice(0,1)};
  const bad='<KODJO_IMPLEMENTATION_CONFORMANCE>'+JSON.stringify({criteria:[missing]})+'</KODJO_IMPLEMENTATION_CONFORMANCE>\nKODJO_STOP_STATUS: NONE';
  assert.equal(inspectReport(bad,expected).status,'NON_VERIFIABLE');
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

test('real producer -> mission -> review consumer share normalized matrix hash without rewriting the plan', (t) => {
  const os = require('node:os');
  const { spawnSync } = require('node:child_process');
  const { extractTaggedJson } = require('../../scripts/kodjo/lib/plan-impact');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-hash-chain-'));
  t.after(() => fs.rmSync(dir, { recursive:true, force:true }));
  const matrix = extractTaggedJson(planFixtureV2(), 'KODJO_UI_CRITERIA_MATRIX_JSON');
  const target = matrix.criteria[0].change_targets[0];
  const impact = { scan_revision:'b'.repeat(40), scope_allow:[target], modified_modules:[{path:target}], rows:[] };
  const draft = '<KODJO_PLAN_IMPACT_JSON>'+JSON.stringify(impact)+'</KODJO_PLAN_IMPACT_JSON>\n'+
    '<KODJO_UI_CRITERIA_MATRIX_JSON>'+JSON.stringify(matrix)+'</KODJO_UI_CRITERIA_MATRIX_JSON>\n';
  const planFile = path.join(dir,'plan.md'), output = path.join(dir,'contract.json');
  fs.writeFileSync(planFile,draft);
  const produced = spawnSync(process.execPath,[path.join(root,'scripts/kodjo/verify-ui-plan-criteria.js'),planFile,impact.scan_revision,root,output,'produce','a'.repeat(40)],{encoding:'utf8',windowsHide:true});
  assert.equal(produced.status,0,produced.stderr);
  const contract = JSON.parse(fs.readFileSync(output,'utf8'));
  assert.notEqual(contract.matrix_sha256,sha256(matrix),'fixture must reproduce raw/normalized mismatch');
  const approved = draft+'<KODJO_UI_PLAN_CONTRACT_JSON>'+JSON.stringify(contract)+'</KODJO_UI_PLAN_CONTRACT_JSON>\n';
  fs.writeFileSync(planFile,approved);
  const mission = renderImplementationMission('V2-TEST',approved,'c'.repeat(40));
  assert.equal(mission.contract.ui_matrix_sha256,contract.matrix_sha256);
  assert.doesNotThrow(()=>verifyImplementationMission(mission.mission,approved,'c'.repeat(40)));
  fs.writeFileSync(path.join(dir,'changed.txt'),target+'\n');
  const review = spawnSync(process.execPath,[path.join(root,'scripts/kodjo/verify-ui-implementation-review.js'),'prepare',planFile,path.join(dir,'changed.txt'),path.join(dir,'review-input.json')],{encoding:'utf8',windowsHide:true});
  assert.equal(review.status,0,review.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'review-input.json'))).ui_matrix_sha256,contract.matrix_sha256);
  assert.equal(fs.readFileSync(planFile,'utf8'),approved,'consumers must not rewrite approved bytes');
  const wrongHash = approved.replace(contract.matrix_sha256,sha256(matrix));
  assert.throws(()=>renderImplementationMission('V2-TEST',wrongHash,'c'.repeat(40)),/IMPLEMENTATION_UI_MATRIX_HASH_MISMATCH/);
  const altered = approved.replace('Contrôle exact.','Requirement changed.');
  fs.writeFileSync(planFile,altered);
  const refused = spawnSync(process.execPath,[path.join(root,'scripts/kodjo/verify-ui-implementation-review.js'),'prepare',planFile,path.join(dir,'changed.txt'),path.join(dir,'refused.json')],{encoding:'utf8',windowsHide:true});
  assert.notEqual(refused.status,0); assert.match(refused.stderr,/UI_IMPLEMENTATION_REVIEW_PLAN_DRIFT/);
});
