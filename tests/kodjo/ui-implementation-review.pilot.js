'use strict';
const { matrixFingerprint } = require('../../scripts/kodjo/lib/ui-criteria-contract');

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
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
    matrix_sha256:matrixFingerprint(matrix),
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
  assert.match(wf,/review_prepare=\(prepare/);
  assert.match(wf,/review_validate=\(validate/);
  assert.match(wf,/cumulative_review_base/);
  assert.match(wf,/previous_review_comment_id/);
  assert.match(wf,/review_scope=AFFECTED or INHERITED/);
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


function deltaFixture() {
  const criteria = [
    {
      criterion_id:'UI-001',
      source:{path:'docs/ui.md',locator:'R1',requirement:'Modifier A.'},
      risk_types:['FUNCTIONAL'],
      reuse_search:['src/shared/ui'],
      component_decision:'REUSE',
      selected_component:'A',
      decision_justification:'Delta A.',
      change_targets:['src/A.tsx'],
      tests:['src/A.test.tsx'],
      proof_required:['FUNCTIONAL_TEST','ACCESSIBILITY_CHECK'],
    },
    {
      criterion_id:'UI-002',
      source:{path:'docs/ui.md',locator:'R2',requirement:'Préserver B.'},
      risk_types:['DEVICE'],
      reuse_search:['src/shared/ui'],
      component_decision:'REUSE',
      selected_component:'B',
      decision_justification:'Composant B.',
      change_targets:['src/B.tsx'],
      tests:['src/B.test.tsx'],
      proof_required:['ACCESSIBILITY_CHECK','DEVICE_CHECK'],
    },
  ];
  const matrix={schema:'kodjo.ui-criteria.v1',criteria,preservation:{preserve:[],change:[{target:'A',justification:'Delta A.'}],forbidden:[]}};
  const contract={schema:'kodjo.ui-plan-contract.v1',contract_version:1,protocol_commit:'a'.repeat(40),
    scan_revision:'b'.repeat(40),ui_applicable:true,ui_paths:['src/A.tsx','src/B.tsx'],
    criterion_count:2,matrix_sha256:matrixFingerprint(matrix)};
  return '# Plan\n<KODJO_UI_CRITERIA_MATRIX_JSON>\n'+JSON.stringify(matrix)+'\n</KODJO_UI_CRITERIA_MATRIX_JSON>\n'+
    '<KODJO_UI_PLAN_CONTRACT_JSON>\n'+JSON.stringify(contract)+'\n</KODJO_UI_PLAN_CONTRACT_JSON>\n';
}
function previousDeltaReview() {
  return {
    schema:'kodjo.ui-implementation-review.v1',
    verdict:'REVISE',
    device_gate_required:true,
    criteria:[
      {
        criterion_id:'UI-001',implementation_status:'NON_CONFORME',preserve_status:'PASS',
        evidence:'Ancien défaut A.',
        proof_results:[
          {proof_type:'FUNCTIONAL_TEST',status:'FAIL',evidence:'Ancien test A en échec.'},
          {proof_type:'ACCESSIBILITY_CHECK',status:'PENDING_DEVICE',evidence:'Device restant.'},
        ],
      },
      {
        criterion_id:'UI-002',implementation_status:'NON_VERIFIABLE',preserve_status:'PASS',
        evidence:'B inchangé; seules les preuves appareil restent ouvertes.',
        proof_results:[
          {proof_type:'ACCESSIBILITY_CHECK',status:'PENDING_DEVICE',evidence:'VoiceOver/TalkBack à vérifier.'},
          {proof_type:'DEVICE_CHECK',status:'PENDING_DEVICE',evidence:'Contrôle appareil requis.'},
        ],
      },
    ],
    boundary_results:[],
  };
}
function withDeltaFiles(action) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-delta-review-'));
  try {
    const plan=path.join(dir,'plan.md'),changed=path.join(dir,'changed.txt'),previous=path.join(dir,'previous.md');
    const input=path.join(dir,'input.json'),review=path.join(dir,'review.json'),output=path.join(dir,'output.json');
    fs.writeFileSync(plan,deltaFixture());
    fs.writeFileSync(changed,'src/A.tsx\nsrc/A.test.tsx\n');
    fs.writeFileSync(previous,JSON.stringify(previousDeltaReview()));
    action({dir,plan,changed,previous,input,review,output});
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
}

test('delta review: le diff immédiat affecte uniquement ses critères et hérite les autres',()=>{
  withDeltaFiles(({plan,changed,previous,input})=>{
    const r=run(['prepare',plan,changed,input,'',previous],path.dirname(plan));
    assert.equal(r.status,0,r.stderr);
    const value=JSON.parse(fs.readFileSync(input,'utf8'));
    assert.equal(value.review_mode,'DELTA_WITH_INHERITANCE');
    assert.equal(value.criteria.find(c=>c.criterion_id==='UI-001').review_scope,'AFFECTED');
    const inherited=value.criteria.find(c=>c.criterion_id==='UI-002');
    assert.equal(inherited.review_scope,'INHERITED');
    assert.deepEqual(inherited.affected_paths,[]);
    assert.equal(inherited.inherited_result.implementation_status,'NON_VERIFIABLE');
    assert.equal(inherited.inherited_result.proof_results.find(p=>p.proof_type==='ACCESSIBILITY_CHECK').status,'PENDING_DEVICE');
  });
});

test('delta review: un critère hérité ne peut pas être réinterprété',()=>{
  withDeltaFiles(({plan,changed,previous,input,review,output})=>{
    let r=run(['prepare',plan,changed,input,'',previous],path.dirname(plan));
    assert.equal(r.status,0,r.stderr);
    const prepared=JSON.parse(fs.readFileSync(input,'utf8'));
    const inherited=prepared.criteria.find(c=>c.criterion_id==='UI-002').inherited_result;
    const value={
      schema:'kodjo.ui-implementation-review.v1',verdict:'REVISE',device_gate_required:true,
      criteria:[
        {
          criterion_id:'UI-001',implementation_status:'CONFORME',preserve_status:'PASS',evidence:'A corrigé.',
          proof_results:[
            {proof_type:'FUNCTIONAL_TEST',status:'PASS',evidence:'Test A PASS.'},
            {proof_type:'ACCESSIBILITY_CHECK',status:'PENDING_DEVICE',evidence:'Contrôle appareil restant.'},
          ],
        },
        {...inherited,implementation_status:'NON_CONFORME'},
      ],
      boundary_results:[],
    };
    fs.writeFileSync(review,JSON.stringify(value));
    r=run(['validate',plan,changed,review,output,'',previous],path.dirname(plan));
    assert.notEqual(r.status,0);
    assert.match(r.stderr,/UI_IMPLEMENTATION_REVIEW_INHERITED_DRIFT/);
  });
});

test('delta review: PENDING_DEVICE accessibilité ne bloque pas une approbation technique',()=>{
  withDeltaFiles(({plan,changed,previous,input,review,output})=>{
    let r=run(['prepare',plan,changed,input,'',previous],path.dirname(plan));
    assert.equal(r.status,0,r.stderr);
    const prepared=JSON.parse(fs.readFileSync(input,'utf8'));
    const inherited=prepared.criteria.find(c=>c.criterion_id==='UI-002').inherited_result;
    const value={
      schema:'kodjo.ui-implementation-review.v1',verdict:'APPROVE',device_gate_required:true,
      criteria:[
        {
          criterion_id:'UI-001',implementation_status:'CONFORME',preserve_status:'PASS',evidence:'A corrigé et tests techniques verts.',
          proof_results:[
            {proof_type:'FUNCTIONAL_TEST',status:'PASS',evidence:'Test A PASS.'},
            {proof_type:'ACCESSIBILITY_CHECK',status:'PENDING_DEVICE',evidence:'VoiceOver/TalkBack restant au gate appareil.'},
          ],
        },
        inherited,
      ],
      boundary_results:[],
    };
    fs.writeFileSync(review,JSON.stringify(value));
    r=run(['validate',plan,changed,review,output,'',previous],path.dirname(plan));
    assert.equal(r.status,0,r.stderr);
    assert.equal(JSON.parse(fs.readFileSync(output,'utf8')).verdict,'APPROVE');
  });
});

function nonUiFixture(action) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-non-ui-review-'));
  try {
    const matrix={schema:'kodjo.ui-criteria.v1',criteria:[],preservation:{preserve:[],change:[],forbidden:[]}};
    const contract={schema:'kodjo.ui-plan-contract.v1',ui_applicable:false,criterion_count:0,matrix_sha256:matrixFingerprint(matrix)};
    const plan=path.join(dir,'plan.md'), changed=path.join(dir,'changed.txt'), evidence=path.join(dir,'implementation.md');
    const input=path.join(dir,'input.json'), reviewFile=path.join(dir,'review.json'), output=path.join(dir,'output.json');
    fs.writeFileSync(plan,'# Acceptance\n1. Return zero for an empty array.\nOnly function.ts may change.\n'+
      '<KODJO_UI_CRITERIA_MATRIX_JSON>'+JSON.stringify(matrix)+'</KODJO_UI_CRITERIA_MATRIX_JSON>\n'+
      '<KODJO_UI_PLAN_CONTRACT_JSON>'+JSON.stringify(contract)+'</KODJO_UI_PLAN_CONTRACT_JSON>');
    fs.writeFileSync(changed,'function.ts\n');
    const row={criterion_id:'author-label-empty',implementation_status:'DONE',files_or_symbols:['function.ts'],
      component_used:'N/A',tests_run:['jest'],proof_status:'PASS',preserve_status:'UNCHANGED',residual_status:'NONE'};
    function writeReport(rows=[row],override={}) {
      const report_text='<KODJO_IMPLEMENTATION_CONFORMANCE>'+JSON.stringify({criteria:rows})+'</KODJO_IMPLEMENTATION_CONFORMANCE>\nKODJO_STOP_STATUS: NONE';
      const envelope={request_id:'request',source_head:'a'.repeat(40),truncated:false,report_text,
        original_text_sha256:crypto.createHash('sha256').update(report_text).digest('hex'),machine_evidence:{modified_files:['function.ts'],checks:[{check:'jest',status:'PASS'}],out_of_scope_files:[]},...override};
      fs.writeFileSync(evidence,'base_head='+ 'a'.repeat(40)+'\nv2_request_id=request\nv2_protocol_head='+ 'b'.repeat(40)+'\n<KODJO_IMPLEMENTATION_REPORT_JSON>'+JSON.stringify(envelope)+'</KODJO_IMPLEMENTATION_REPORT_JSON>');
    }
    writeReport();
    const review={schema:'kodjo.ui-implementation-review.v1',verdict:'APPROVE',device_gate_required:false,criteria:[],boundary_results:[],
      non_ui_plan_assessment:{status:'CONFORME',evidence:'All acceptance requirements, scope and report claims checked against plan, diff and tests.',
        requirements:[{plan_requirement:'Acceptance 1: empty array returns zero',status:'CONFORME',evidence:'function.ts initializes zero; real empty-array Jest assertion passes.'},
          {plan_requirement:'Only function.ts may change',status:'CONFORME',evidence:'Exact changed files: function.ts.'}]}};
    const prepare=()=>{const r=run(['prepare',plan,changed,input,evidence],dir);assert.equal(r.status,0,r.stderr);return JSON.parse(fs.readFileSync(input,'utf8'));};
    const validate=()=>{fs.writeFileSync(reviewFile,JSON.stringify(review));return run(['validate',plan,changed,reviewFile,output,evidence],dir);};
    action({row,writeReport,review,prepare,validate});
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
}

test('non-UI report labels do not masquerade as UI IDs; independent full-plan assessment is mandatory',()=>{
  nonUiFixture(({prepare,review,validate})=>{
    const input=prepare();
    assert.equal(input.implementation_report.status,'COMPLETE');
    assert.equal(input.criterion_count,0);
    assert.deepEqual(input.implementation_report.criterion_ids,['author-label-empty']);
    let r=validate();assert.equal(r.status,0,r.stderr);
    delete review.non_ui_plan_assessment;
    r=validate();assert.notEqual(r.status,0);assert.match(r.stderr,/NON_UI_PLAN_ASSESSMENT_REQUIRED/);
  });
});

test('non-UI integrity, structure, stop and duplicate checks remain blocking',()=>{
  nonUiFixture(({row,writeReport,prepare,review,validate})=>{
    for(const [rows,override] of [
      [[row],{truncated:true}], [[row],{original_text_sha256:'0'.repeat(64)}],
      [[row],{request_id:'wrong'}], [[row,row],{}], [[{...row,tests_run:[]}],{}],
      [[row],{report_text:'No structured evidence'}]
    ]){
      writeReport(rows,override);
      assert.equal(prepare().implementation_report.status,'NON_VERIFIABLE');
      review.verdict='APPROVE';assert.notEqual(validate().status,0);
      review.verdict='REVISE';const r=validate();assert.equal(r.status,0,r.stderr);
    }
  });
});

test('non-UI semantic defects and unknown evidence cannot be approved with empty UI criteria',()=>{
  nonUiFixture(({review,validate})=>{
    for(const status of ['NON_CONFORME','NON_VERIFIABLE']) {
      review.non_ui_plan_assessment.requirements[0].status=status;
      review.verdict='APPROVE';assert.notEqual(validate().status,0);
      review.verdict='REVISE';const r=validate();assert.equal(r.status,0,r.stderr);
    }
    review.non_ui_plan_assessment.requirements[0].status='CONFORME';
    review.non_ui_plan_assessment.status='NON_VERIFIABLE';
    review.verdict='APPROVE';assert.notEqual(validate().status,0);
    review.verdict='REVISE';assert.equal(validate().status,0);
  });
});

test('non-UI assessment refuses empty, duplicate or unsubstantiated requirements',()=>{
  nonUiFixture(({review,validate})=>{
    const good=review.non_ui_plan_assessment.requirements;
    for(const requirements of [[],[good[0],good[0]],[{...good[0],evidence:''}],[{...good[0],status:'PASS'}]]) {
      review.non_ui_plan_assessment.requirements=requirements;
      assert.notEqual(validate().status,0);
    }
  });
});
