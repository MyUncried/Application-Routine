'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const verifier = path.join(root, 'scripts', 'kodjo', 'verify-ui-plan-criteria.js');
const protocolCommit = 'a'.repeat(40);

function run(args, cwd) {
  return spawnSync(process.execPath, [verifier, ...args], { cwd, encoding: 'utf8' });
}
function fixture(matrix, embeddedContract = null) {
  const impact = {
    schema:'kodjo.plan-impact.v1',
    scan_revision:'b'.repeat(40),
    scan_sha256:'x',
    modified_modules:[{path:'src/features/example/ExampleScreen.tsx',change:'MODIFY'}],
    rows:[{path:'src/features/example/ExampleScreen.tsx',candidate_kind:'MODIFIED_MODULE',triggered_by:[],risk_score:0,classification:'MODIFY',justification:'ui'}],
    scope_allow:['src/features/example/ExampleScreen.tsx','src/features/example/__tests__/ExampleScreen.test.tsx'],
  };
  let body = '# Plan\n\n<KODJO_PLAN_IMPACT_JSON>\n'+JSON.stringify(impact)+'\n</KODJO_PLAN_IMPACT_JSON>\n';
  body += '<KODJO_UI_CRITERIA_MATRIX_JSON>\n'+JSON.stringify(matrix)+'\n</KODJO_UI_CRITERIA_MATRIX_JSON>\n';
  if (embeddedContract) body += '<KODJO_UI_PLAN_CONTRACT_JSON>\n'+JSON.stringify(embeddedContract)+'\n</KODJO_UI_PLAN_CONTRACT_JSON>\n';
  return body;
}
function validMatrix() {
  return {
    schema:'kodjo.ui-criteria.v1',
    criteria:[{
      criterion_id:'UI-001',
      source:{path:'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md',locator:'CE-X',requirement:'Afficher le contrôle canonique.'},
      risk_types:['FUNCTIONAL','VISUAL','DEVICE'],
      reuse_search:['src/shared/ui','src/features'],
      component_decision:'REUSE',
      selected_component:'ExistingOverlay',
      decision_justification:'Le composant existant couvre le contrat bloquant.',
      change_targets:['src/features/example/ExampleScreen.tsx'],
      tests:['src/features/example/__tests__/ExampleScreen.test.tsx'],
      proof_required:['FUNCTIONAL_TEST','VISUAL_COMPARE','DEVICE_CHECK'],
    }],
    preservation:{
      preserve:[{target:'Navigation existante',justification:'Hors changement demandé.'}],
      change:[{target:'ExampleScreen',justification:'Contrôle UI explicitement modifié.'}],
      forbidden:[{target:'Remplacement du shell',justification:'Aucune refonte autorisée.'}],
    },
  };
}

test('UI plan: matrice atomique valide produit un contrat versionne', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-plan-'));
  const plan=path.join(dir,'plan.md'); const out=path.join(dir,'out.json');
  fs.writeFileSync(plan,fixture(validMatrix()));
  const result=run([plan,'b'.repeat(40),dir,out,'produce',protocolCommit],dir);
  assert.equal(result.status,0,result.stderr);
  const contract=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(contract.schema,'kodjo.ui-plan-contract.v1');
  assert.equal(contract.ui_applicable,true);
  assert.equal(contract.criterion_count,1);
});

test('UI plan: tout module UI modifie doit etre couvert par un critere', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-plan-'));
  const matrix=validMatrix(); matrix.criteria[0].change_targets=['src/features/example/__tests__/ExampleScreen.test.tsx'];
  const plan=path.join(dir,'plan.md'); fs.writeFileSync(plan,fixture(matrix));
  const result=run([plan,'b'.repeat(40),dir,path.join(dir,'out.json'),'produce',protocolCommit],dir);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/UI_PLAN_COVERAGE_INCOMPLETE|UI_PLAN_TARGET_INVALID/);
});

test('UI plan: CREATE ou REUSE exige une recherche de reutilisation explicite', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-plan-'));
  const matrix=validMatrix(); matrix.criteria[0].reuse_search=[];
  const plan=path.join(dir,'plan.md'); fs.writeFileSync(plan,fixture(matrix));
  const result=run([plan,'b'.repeat(40),dir,path.join(dir,'out.json'),'produce',protocolCommit],dir);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/UI_PLAN_REUSE_INVALID/);
});

test('UI plan: le type de preuve doit correspondre au risque', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-plan-'));
  const matrix=validMatrix(); matrix.criteria[0].proof_required=['FUNCTIONAL_TEST'];
  const plan=path.join(dir,'plan.md'); fs.writeFileSync(plan,fixture(matrix));
  const result=run([plan,'b'.repeat(40),dir,path.join(dir,'out.json'),'produce',protocolCommit],dir);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/VISUAL exige VISUAL_COMPARE/);
});

test('UI plan: handoff factice PLAN vers PLAN_REVIEW conserve exactement le contrat atomique', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-plan-e2e-'));
  const plan=path.join(dir,'plan.md');
  const produced=path.join(dir,'produced.json');
  const consumed=path.join(dir,'consumed.json');
  fs.writeFileSync(plan,fixture(validMatrix()));
  const first=run([plan,'b'.repeat(40),dir,produced,'produce',protocolCommit],dir);
  assert.equal(first.status,0,first.stderr);
  const contract=JSON.parse(fs.readFileSync(produced,'utf8'));
  fs.appendFileSync(plan,'<KODJO_UI_PLAN_CONTRACT_JSON>\n'+JSON.stringify(contract)+'\n</KODJO_UI_PLAN_CONTRACT_JSON>\n');
  const second=run([plan,'b'.repeat(40),dir,consumed,'consume',protocolCommit],dir);
  assert.equal(second.status,0,second.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(consumed,'utf8')),contract);
});

test('UI plan: consume refuse un contrat embarque divergent', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-plan-'));
  const matrix=validMatrix();
  const bad={schema:'kodjo.ui-plan-contract.v1',contract_version:1,protocol_commit:protocolCommit,scan_revision:'b'.repeat(40),ui_applicable:true,ui_paths:['src/features/example/ExampleScreen.tsx'],criterion_count:1,matrix_sha256:'0'.repeat(64)};
  const plan=path.join(dir,'plan.md'); fs.writeFileSync(plan,fixture(matrix,bad));
  const result=run([plan,'b'.repeat(40),dir,path.join(dir,'out.json'),'consume',protocolCommit],dir);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/UI_PLAN_CONTRACT_DRIFT/);
});

test('workflows: INITIAL et REVISION produisent la matrice et les revues la rejouent avant Claude', () => {
  const initial=fs.readFileSync(path.join(root,'.github','workflows','kodjo-v2-slice-initial-plan.yml'),'utf8');
  const revision=fs.readFileSync(path.join(root,'.github','workflows','kodjo-v2-slice-plan.yml'),'utf8');
  assert.match(initial,/generate-ui-plan-contract\.js request final/);
  assert.match(initial,/generate-ui-plan-contract\.js decode final/);
  assert.match(revision,/KODJO_UI_CRITERIA_MATRIX_JSON/);
  for (const source of [initial,revision]) {
    assert.match(source,/verify-ui-plan-criteria\.js/);
    assert.match(source,/KODJO_UI_PLAN_CONTRACT_JSON/);
  }
  for (const name of ['kodjo-v2-slice-initial-plan-review.yml','kodjo-v2-slice-plan-review.yml']) {
    const source=fs.readFileSync(path.join(root,'.github','workflows',name),'utf8');
    const gate=source.indexOf('Revalidate UI criteria contract before Claude');
    const reviewer=source.indexOf('Review initial V2 plan with Claude') >= 0 ? source.indexOf('Review initial V2 plan with Claude') : source.indexOf('Review V2 plan with Claude');
    assert.ok(gate >= 0 && reviewer > gate, name+': UI gate must precede reviewer');
    assert.match(source,/source-to-criteria completeness/i);
    assert.match(source,/REUSE|EXTEND|CREATE/);
  }
});
