// Synthetic compatibility transport only; never touches a V2 campaign.
'use strict';
const { matrixFingerprint } = require('../../../scripts/kodjo/lib/ui-criteria-contract');

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..', '..');
const reviewVerifier = path.join(root, 'scripts', 'kodjo', 'verify-ui-implementation-review.js');
const finalVerifier = path.join(root, 'scripts', 'kodjo', 'verify-v2-finalization.js');

function run(script, args, cwd, env) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding:'utf8', env:env||process.env });
}
function planFixture(accessibility = false, accessibilityOnly = false) {
  const matrix = {
    schema:'kodjo.ui-criteria.v1',
    criteria:[{
      criterion_id:'UI-001',
      source:{path:'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md',locator:'CE-X',requirement:'Interaction à vérifier sur appareil.'},
      risk_types:['FUNCTIONAL','VISUAL','DEVICE'],
      reuse_search:['src/shared/ui'],
      component_decision:'REUSE',
      selected_component:'ExistingOverlay',
      decision_justification:'Composant canonique.',
      change_targets:['src/features/example/ExampleScreen.tsx'],
      tests:['src/features/example/__tests__/ExampleScreen.test.tsx'],
      proof_required:['FUNCTIONAL_TEST','VISUAL_COMPARE','DEVICE_CHECK'],
    }],
    preservation:{
      preserve:[{target:'Navigation',justification:'Acquis gelé.'}],
      change:[{target:'ExampleScreen',justification:'Delta autorisé.'}],
      forbidden:[{target:'Shell',justification:'Refonte interdite.'}],
    },
  };
  if(accessibility){matrix.criteria[0].risk_types.push('ACCESSIBILITY');matrix.criteria[0].proof_required.push('ACCESSIBILITY_CHECK');}
  if(accessibilityOnly){matrix.criteria[0].risk_types=['FUNCTIONAL','ACCESSIBILITY'];matrix.criteria[0].proof_required=['FUNCTIONAL_TEST','ACCESSIBILITY_CHECK'];}
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
function reviewValue() {
  return {
    schema:'kodjo.ui-implementation-review.v1',
    verdict:'APPROVE',
    device_gate_required:true,
    criteria:[{
      criterion_id:'UI-001',
      implementation_status:'CONFORME',
      preserve_status:'PASS',
      evidence:'Diff borné.',
      proof_results:[
        {proof_type:'FUNCTIONAL_TEST',status:'PASS',evidence:'Test déterministe PASS.'},
        {proof_type:'VISUAL_COMPARE',status:'PENDING_DEVICE',evidence:'Contrôle humain requis.'},
        {proof_type:'DEVICE_CHECK',status:'PENDING_DEVICE',evidence:'Contrôle appareil requis.'},
      ],
    }],
    boundary_results:[
      {category:'PRESERVE',target:'Navigation',status:'PASS',evidence:'Navigation absente du diff.'},
      {category:'FORBIDDEN',target:'Shell',status:'PASS',evidence:'Shell absent du diff.'},
    ],
  };
}
function fixture(dir, value = reviewValue(), planBody = planFixture(), env) {
  const slice='VNEXT-PROOF-LIFECYCLE';
  const issue=999;
  const head='d'.repeat(40);
  const base='c'.repeat(40);
  const plan=path.join(dir,'plan.md');
  const changed=path.join(dir,'changed.txt');
  const reviewRaw=path.join(dir,'review-raw.json');
  const reviewOut=path.join(dir,'review-contract.json');
  fs.writeFileSync(plan,planBody);
  fs.writeFileSync(changed,'src/features/example/ExampleScreen.tsx\n');
  fs.writeFileSync(reviewRaw,JSON.stringify(value));
  const rv=run(reviewVerifier,['validate',plan,changed,reviewRaw,reviewOut],dir,env);
  assert.equal(rv.status,0,rv.stderr);
  const reviewContract=JSON.parse(fs.readFileSync(reviewOut,'utf8'));

  const queueRel='.github/orchestration/queue/v2/VNEXT-PROOF-LIFECYCLE.json';
  const queuePath=path.join(dir,'.github','orchestration','queue','v2','VNEXT-PROOF-LIFECYCLE.json');
  fs.mkdirSync(path.dirname(queuePath),{recursive:true});
  fs.writeFileSync(queuePath,JSON.stringify({
    schema_version:'kodjo.protocol.v2.lean-request.0.6.13',
    slice_id:slice,
    issue_number:issue,
    authorized_plan:{plan_blob_oid:'e'.repeat(40)},
  }));

  const implementation=[
    '[KODJO_SLICE] IMPLEMENTATION_OUTPUT',
    'slice_id='+slice,
    'increment=LOT_1_OF_1',
    'base_head='+base,
    'head='+head,
    'session_id=550e8400-e29b-41d4-a716-446655440000',
    'plan_comment_id=100',
    'plan_review_comment_id=101',
    'source_implementation_trigger_comment_id=102',
    'continuity_origin=V2_LEAN_QUEUE',
    'v2_queue_path='+queueRel,
    'v2_protocol_head='+base,
    'v2_request_id=550e8400-e29b-41d4-a716-446655440001',
    'application_pr=200',
    'application_branch=kodjo/v2-e2e-ui',
    'STATUT : IMPLEMENTATION_READY_FOR_REVIEW',
    ''
  ].join('\n');
  const review=[
    '[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT',
    'slice_id='+slice,
    'increment=LOT_1_OF_1',
    'base_head='+base,
    'head='+head,
    'session_id=550e8400-e29b-41d4-a716-446655440000',
    'plan_comment_id=100',
    'source_implementation_comment_id=103',
    'source_implementation_trigger_comment_id=102',
    'verdict=APPROVE',
    'device_gate_required='+reviewContract.device_gate_required,
    'STATUT : IMPLEMENTATION_REVIEW_APPROVED',
    '',
    '<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>',
    JSON.stringify(reviewContract),
    '</KODJO_UI_IMPLEMENTATION_REVIEW_JSON>',
    ''
  ].join('\n');
  const visual=[
    '[KODJO_SLICE] VISUAL_APPROVED',
    'slice_id='+slice,
    'source_review_comment_id=104',
    'head='+head,
    ''
  ].join('\n');

  const reviewFile=path.join(dir,'review.md');
  const implFile=path.join(dir,'implementation.md');
  const visualFile=path.join(dir,'visual.md');
  fs.writeFileSync(reviewFile,review);
  fs.writeFileSync(implFile,implementation);
  fs.writeFileSync(visualFile,visual);
  return {slice,issue,head,base,queuePath,reviewFile,implFile,visualFile};
}

module.exports={run,planFixture,reviewValue,fixture,reviewVerifier,finalVerifier};
