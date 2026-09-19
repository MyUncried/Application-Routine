'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const { sha256 } = require('../../scripts/kodjo/lib/plan-impact');

const root = path.resolve(__dirname, '..', '..');
const verifier = path.join(root, 'scripts', 'kodjo', 'verify-ui-implementation-review.js');

function run(args, cwd) {
  return spawnSync(process.execPath, [verifier, ...args], { cwd, encoding:'utf8' });
}
function fixture() {
  const matrix = {
    schema:'kodjo.ui-criteria.v1',
    criteria:[{
      criterion_id:'UI-001',
      source:{path:'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md',locator:'CE-X',requirement:'Conserver le composant canonique.'},
      risk_types:['FUNCTIONAL','VISUAL','DEVICE'],
      reuse_search:['src/shared/ui'],
      component_decision:'REUSE',
      selected_component:'ExistingOverlay',
      decision_justification:'Composant existant.',
      change_targets:['src/features/example/ExampleScreen.tsx'],
      tests:['src/features/example/__tests__/ExampleScreen.test.tsx'],
      proof_required:['FUNCTIONAL_TEST','VISUAL_COMPARE','DEVICE_CHECK'],
    }],
    preservation:{
      preserve:[{target:'Navigation',justification:'Acquis gelé.'}],
      change:[{target:'ExampleScreen',justification:'Delta attendu.'}],
      forbidden:[{target:'Shell',justification:'Refonte interdite.'}],
    },
  };
  const contract = {
    schema:'kodjo.ui-plan-contract.v1',
    contract_version:1,
    protocol_commit:'a'.repeat(40),
    scan_revision:'b'.repeat(40),
    ui_applicable:true,
    ui_paths:['src/features/example/ExampleScreen.tsx'],
    criterion_count:1,
    matrix_sha256:sha256(matrix),
  };
  return '# Plan\n<KODJO_UI_CRITERIA_MATRIX_JSON>\n'+JSON.stringify(matrix)+'\n</KODJO_UI_CRITERIA_MATRIX_JSON>\n'+
    '<KODJO_UI_PLAN_CONTRACT_JSON>\n'+JSON.stringify(contract)+'\n</KODJO_UI_PLAN_CONTRACT_JSON>\n';
}
function validReview() {
  return {
    schema:'kodjo.ui-implementation-review.v1',
    verdict:'APPROVE',
    device_gate_required:true,
    criteria:[{
      criterion_id:'UI-001',
      implementation_status:'CONFORME',
      preserve_status:'PASS',
      evidence:'Diff borné au composant prévu.',
      proof_results:[
        {proof_type:'FUNCTIONAL_TEST',status:'PASS',evidence:'Suite déterministe PASS.'},
        {proof_type:'VISUAL_COMPARE',status:'PENDING_DEVICE',evidence:'Preuve perceptive non disponible dans la revue automatisée.'},
        {proof_type:'DEVICE_CHECK',status:'PENDING_DEVICE',evidence:'Contrôle appareil requis après revue technique.'},
      ],
    }],
    boundary_results:[
      {category:'PRESERVE',target:'Navigation',status:'PASS',evidence:'Aucun fichier de navigation dans le diff.'},
      {category:'FORBIDDEN',target:'Shell',status:'PASS',evidence:'Aucune modification du shell dans le diff.'},
    ],
  };
}

test('implementation review: prépare toutes les exigences du plan et détecte le gate device', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-review-'));
  const plan=path.join(dir,'plan.md'), changed=path.join(dir,'changed.txt'), out=path.join(dir,'input.json');
  fs.writeFileSync(plan,fixture()); fs.writeFileSync(changed,'src/features/example/ExampleScreen.tsx\n');
  const r=run(['prepare',plan,changed,out],dir);
  assert.equal(r.status,0,r.stderr);
  const input=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(input.criterion_count,1);
  assert.equal(input.device_gate_required,true);
  assert.deepEqual(input.criteria[0].proof_required,['DEVICE_CHECK','FUNCTIONAL_TEST','VISUAL_COMPARE']);
});

test('implementation review: refuse un change_target approuvé absent du diff', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-review-'));
  const plan=path.join(dir,'plan.md'), changed=path.join(dir,'changed.txt'), out=path.join(dir,'input.json');
  fs.writeFileSync(plan,fixture()); fs.writeFileSync(changed,'src/features/example/Other.tsx\n');
  const r=run(['prepare',plan,changed,out],dir);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/UI_IMPLEMENTATION_REVIEW_TARGET_NOT_DELIVERED/);
});

test('implementation review: accepte approbation technique avec preuves device explicitement en attente', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-review-'));
  const plan=path.join(dir,'plan.md'), changed=path.join(dir,'changed.txt'), review=path.join(dir,'review.json'), out=path.join(dir,'out.json');
  fs.writeFileSync(plan,fixture()); fs.writeFileSync(changed,'src/features/example/ExampleScreen.tsx\n'); fs.writeFileSync(review,JSON.stringify(validReview()));
  const r=run(['validate',plan,changed,review,out],dir);
  assert.equal(r.status,0,r.stderr);
  assert.equal(JSON.parse(fs.readFileSync(out,'utf8')).verdict,'APPROVE');
});

test('implementation review: refuse qu une revue automatisée certifie une preuve device', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-review-'));
  const plan=path.join(dir,'plan.md'), changed=path.join(dir,'changed.txt'), review=path.join(dir,'review.json'), out=path.join(dir,'out.json');
  const value=validReview();
  value.criteria[0].proof_results.find((p)=>p.proof_type==='DEVICE_CHECK').status='PASS';
  fs.writeFileSync(plan,fixture()); fs.writeFileSync(changed,'src/features/example/ExampleScreen.tsx\n'); fs.writeFileSync(review,JSON.stringify(value));
  const r=run(['validate',plan,changed,review,out],dir);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/UI_IMPLEMENTATION_REVIEW_DEVICE_PROOF_UNSUPPORTED/);
});

test('implementation review: un défaut fonctionnel impose REVISE', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-review-'));
  const plan=path.join(dir,'plan.md'), changed=path.join(dir,'changed.txt'), review=path.join(dir,'review.json'), out=path.join(dir,'out.json');
  const value=validReview();
  value.criteria[0].proof_results.find((p)=>p.proof_type==='FUNCTIONAL_TEST').status='FAIL';
  fs.writeFileSync(plan,fixture()); fs.writeFileSync(changed,'src/features/example/ExampleScreen.tsx\n'); fs.writeFileSync(review,JSON.stringify(value));
  const r=run(['validate',plan,changed,review,out],dir);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/UI_IMPLEMENTATION_REVIEW_VERDICT_INCONSISTENT/);
});

test('implementation review: PARTIELLEMENT_CONFORME ou NON_VERIFIABLE ne peut pas être approuvé', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-review-'));
  const plan=path.join(dir,'plan.md'), changed=path.join(dir,'changed.txt'), review=path.join(dir,'review.json'), out=path.join(dir,'out.json');
  const value=validReview();
  value.criteria[0].implementation_status='PARTIELLEMENT_CONFORME';
  fs.writeFileSync(plan,fixture()); fs.writeFileSync(changed,'src/features/example/ExampleScreen.tsx\n'); fs.writeFileSync(review,JSON.stringify(value));
  const r=run(['validate',plan,changed,review,out],dir);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/UI_IMPLEMENTATION_REVIEW_VERDICT_INCONSISTENT/);
});

test('implementation review: refuse une frontière PRESERVE ou FORBIDDEN non démontrée', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-review-'));
  const plan=path.join(dir,'plan.md'), changed=path.join(dir,'changed.txt'), review=path.join(dir,'review.json'), out=path.join(dir,'out.json');
  const value=validReview();
  value.boundary_results=value.boundary_results.slice(0,1);
  fs.writeFileSync(plan,fixture()); fs.writeFileSync(changed,'src/features/example/ExampleScreen.tsx\n'); fs.writeFileSync(review,JSON.stringify(value));
  const r=run(['validate',plan,changed,review,out],dir);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/UI_IMPLEMENTATION_REVIEW_BOUNDARY_COVERAGE_INCOMPLETE/);
});

test('workflow: V2 ajoute le contrat de revue sans modifier le transport ni le chemin legacy', () => {
  const wf=fs.readFileSync(path.join(root,'.github','workflows','kodjo-slice-implementation-review.yml'),'utf8');
  assert.match(wf,/Prepare criterion-complete UI review input/);
  assert.match(wf,/verify-ui-implementation-review\.js prepare/);
  assert.match(wf,/verify-ui-implementation-review\.js validate/);
  assert.match(wf,/KODJO_UI_IMPLEMENTATION_REVIEW_JSON/);
  assert.match(wf,/device_gate_required/);
  assert.match(wf,/legacy path unchanged/);
  assert.match(wf,/v2_operation_kind=LEGACY/);
  assert.match(wf,/v2_operation_kind=\$\(jq -r '\.operation_kind \/\/ "IMPLEMENT"'/);
  assert.match(wf,/steps\.gate\.outputs\.v2_operation_kind == 'IMPLEMENT'/);
  assert.match(wf,/steps\.gate\.outputs\.v2_operation_kind == 'VISUAL_CORRECTION'/);
  assert.doesNotMatch(wf,/kodjo_ui_implementation_review_ready|repository_dispatch.*ui_implementation/i);
});

test('audit F14: device proof table preserves only PENDING_DEVICE or demonstrated FAIL',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-device-table-'));
  try{
    const plan=path.join(dir,'plan.md'),changed=path.join(dir,'changed.txt'),review=path.join(dir,'review.json'),out=path.join(dir,'out.json');
    fs.writeFileSync(plan,fixture());fs.writeFileSync(changed,'src/features/example/ExampleScreen.tsx\n');
    for(const type of ['VISUAL_COMPARE','DEVICE_CHECK']) for(const status of ['PENDING_DEVICE','FAIL','PASS','NON_VERIFIABLE','',null]){
      const value=validReview();value.criteria[0].proof_results.find(p=>p.proof_type===type).status=status;
      if(status==='FAIL') value.verdict='REVISE';
      fs.writeFileSync(review,JSON.stringify(value));const r=run(['validate',plan,changed,review,out],dir);
      if(['PENDING_DEVICE','FAIL'].includes(status)) assert.equal(r.status,0,r.stderr);
      else assert.notEqual(r.status,0,type+':'+status);
    }
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
