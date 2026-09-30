'use strict';
const { matrixFingerprint } = require('../../scripts/kodjo/lib/ui-criteria-contract');

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const { sha256 } = require('../../scripts/kodjo/lib/plan-impact');

const root = path.resolve(__dirname, '..', '..');
const reviewVerifier = path.join(root, 'scripts', 'kodjo', 'verify-ui-implementation-review.js');
const finalVerifier = path.join(root, 'scripts', 'kodjo', 'verify-v2-finalization.js');

function run(script, args, cwd) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding:'utf8' });
}
function planFixture() {
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
function fixture(dir) {
  const slice='V2-E2E-UI';
  const issue=999;
  const head='d'.repeat(40);
  const base='c'.repeat(40);
  const plan=path.join(dir,'plan.md');
  const changed=path.join(dir,'changed.txt');
  const reviewRaw=path.join(dir,'review-raw.json');
  const reviewOut=path.join(dir,'review-contract.json');
  fs.writeFileSync(plan,planFixture());
  fs.writeFileSync(changed,'src/features/example/ExampleScreen.tsx\n');
  fs.writeFileSync(reviewRaw,JSON.stringify(reviewValue()));
  const rv=run(reviewVerifier,['validate',plan,changed,reviewRaw,reviewOut],dir);
  assert.equal(rv.status,0,rv.stderr);
  const reviewContract=JSON.parse(fs.readFileSync(reviewOut,'utf8'));

  const queueRel='.github/orchestration/queue/v2/V2-E2E-UI.json';
  const queuePath=path.join(dir,'.github','orchestration','queue','v2','V2-E2E-UI.json');
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
    'device_gate_required=true',
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

test('E2E UI: plan/review technique + approbation humaine exact HEAD => READY_TO_CLOSE', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-e2e-'));
  const f=fixture(dir);
  const out=path.join(dir,'final.json');
  const r=run(finalVerifier,[f.reviewFile,f.implFile,f.visualFile,f.queuePath,String(f.issue),'104','105',out],dir);
  assert.equal(r.status,0,r.stderr);
  const result=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(result.final_status,'READY_TO_CLOSE');
  assert.equal(result.device_evidence_satisfied,true);
  assert.equal(result.device_gate_required,true);
  assert.equal(result.head,f.head);
  assert.equal(result.criterion_count,1);
});

test('E2E UI: approbation humaine sur un autre HEAD est refusée', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-e2e-'));
  const f=fixture(dir);
  fs.writeFileSync(f.visualFile,fs.readFileSync(f.visualFile,'utf8').replace(f.head,'f'.repeat(40)));
  const out=path.join(dir,'final.json');
  const r=run(finalVerifier,[f.reviewFile,f.implFile,f.visualFile,f.queuePath,String(f.issue),'104','105',out],dir);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/V2_FINAL_HEAD_MISMATCH/);
});

test('E2E UI: approbation humaine liée à une autre revue est refusée', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-e2e-'));
  const f=fixture(dir);
  fs.writeFileSync(f.visualFile,fs.readFileSync(f.visualFile,'utf8').replace('source_review_comment_id=104','source_review_comment_id=999'));
  const out=path.join(dir,'final.json');
  const r=run(finalVerifier,[f.reviewFile,f.implFile,f.visualFile,f.queuePath,String(f.issue),'104','105',out],dir);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/V2_FINAL_VISUAL_REVIEW_MISMATCH/);
});

test('E2E UI: la finalisation refuse un faux PASS device avant gate humain', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-e2e-'));
  const f=fixture(dir);
  const review=fs.readFileSync(f.reviewFile,'utf8').replace('"status":"PENDING_DEVICE"','"status":"PASS"');
  fs.writeFileSync(f.reviewFile,review);
  const out=path.join(dir,'final.json');
  const r=run(finalVerifier,[f.reviewFile,f.implFile,f.visualFile,f.queuePath,String(f.issue),'104','105',out],dir);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/V2_FINAL_DEVICE_PROOF_PRE_GATE_INVALID/);
});

function deltaFixture() {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-ui-e2e-'));
  const f=fixture(dir);
  const queue=JSON.parse(fs.readFileSync(f.queuePath,'utf8'));
  queue.mode='RESUME_DELTA';
  queue.operation_kind='VISUAL_CORRECTION';
  queue.delivery_target={kind:'EXISTING_PR',application_pr:200,application_head:f.base,branch:'kodjo/v2-e2e-ui'};
  queue.delivery_checkpoint={checkpoint_ref:'issue_comment:777',application_pr:200,application_head:f.base,protocol_head:'a'.repeat(40),delivery_head:f.base,package_run_id:'1',package_artifact_id:'2',attestation_blob_oid:'',evidence_kind:'ORGANISATIONAL'};
  fs.writeFileSync(f.queuePath,JSON.stringify(queue));

  const full=fs.readFileSync(f.reviewFile,'utf8');
  const delta=full
    .replace(/^device_gate_required=true\n/m,'')
    .replace(/\n<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>[\s\S]*?<\/KODJO_UI_IMPLEMENTATION_REVIEW_JSON>\n?/m,'\n')
    .replace(/\n\{[\s\S]*$/,'\nREVIEW_FEEDBACK: Aucun blocage démontré sur le delta visuel.\n');
  fs.writeFileSync(f.reviewFile,delta);

  return {dir,f};
}
function targetedBody(f) {
  return '[KODJO_SLICE] TARGETED_VISUAL_APPROVED_REQUALIFY\n'+
    'slice_id='+f.slice+'\nsource_review_comment_id=104\nhead='+f.head+'\n'+
    'validation_scope=DELTA\ntargeted_result=PASS\nglobal_conformance=NON_CONFORME\nrequalification_scope=FULL_SLICE\n'+
    'source_head='+'a'.repeat(40)+'\nbootstrap_path=.github/orchestration/v2-slices/'+f.slice+'/slice-bootstrap.json\n'+
    'targeted_requirement=Créer ouvre visiblement le menu\n';
}
test('delta/global: legacy VISUAL_APPROVED cannot close a differential correction',()=>{
  const {dir,f}=deltaFixture();
  const out=path.join(dir,'final.json');
  const r=run(finalVerifier,[f.reviewFile,f.implFile,f.visualFile,f.queuePath,String(f.issue),'104','105',out],dir);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/V2_FINAL_GLOBAL_REQUALIFICATION_REQUIRED/);
  assert.equal(fs.existsSync(out),false);
});
test('delta/global: targeted success is retained while the entire slice requires requalification',()=>{
  const {dir,f}=deltaFixture();
  fs.writeFileSync(f.visualFile,targetedBody(f));
  const out=path.join(dir,'targeted.json');
  const r=run(finalVerifier,[f.reviewFile,f.implFile,f.visualFile,f.queuePath,String(f.issue),'104','105',out],dir);
  assert.equal(r.status,0,r.stderr);
  const result=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(result.targeted_result,'PASS');
  assert.equal(result.targeted_device_evidence_satisfied,true);
  assert.equal(result.global_conformance,'NON_CONFORME');
  assert.equal(result.final_status,'REQUALIFICATION_REQUIRED');
  for(const key of ['global_approval','merge_authorized','close_authorized','device_evidence_satisfied']) assert.equal(result[key],false);
  assert.equal(result.human_device_approval_comment_id,'105');
  assert.equal(result.head,f.head);
  assert.match(result.replan_trigger,/START_PLAN_REVISION/);
  const {checkpointBody}=require('../../scripts/kodjo/targeted-requalification');
  const checkpoint=checkpointBody(result);
  assert.ok(checkpoint.includes('Créer ouvre visiblement le menu'));
  assert.ok(!checkpoint.includes('READY_TO_CLOSE'));
});
for(const [label,mutate] of [
  ['scope',s=>s.replace('validation_scope=DELTA','validation_scope=GLOBAL')],
  ['global conformity',s=>s.replace('global_conformance=NON_CONFORME','global_conformance=CONFORME')],
  ['partial requalification',s=>s.replace('requalification_scope=FULL_SLICE','requalification_scope=DELTA')],
  ['head',s=>s.replace('head='+'c'.repeat(40),'head='+'f'.repeat(40))],
  ['review',s=>s.replace('source_review_comment_id=104','source_review_comment_id=999')],
  ['duplicate scope',s=>s+'validation_scope=DELTA\n'],
  ['missing target',s=>s.replace(/^targeted_requirement=.*\n/m,'')],
]) test('delta/global: rejects invalid '+label,()=>{
  const {dir,f}=deltaFixture();
  let body=targetedBody(f);
  if(label==='head') body=body.replace('head='+f.head,'head='+'f'.repeat(40)); else body=mutate(body);
  fs.writeFileSync(f.visualFile,body);
  const out=path.join(dir,'invalid.json');
  const r=run(finalVerifier,[f.reviewFile,f.implFile,f.visualFile,f.queuePath,String(f.issue),'104','105',out],dir);
  assert.notEqual(r.status,0);assert.equal(fs.existsSync(out),false);
});

test('E2E UI: le workflow final conserve le canal VISUAL_APPROVED et le chemin legacy', () => {
  const wf=fs.readFileSync(path.join(root,'.github','workflows','kodjo-slice-finalize.yml'),'utf8');
  assert.match(wf,/\[KODJO_SLICE\] VISUAL_APPROVED/);
  assert.match(wf,/verify-v2-finalization\.js/);
  assert.match(wf,/node \$reviewVerifier validate/);
  assert.match(wf,/STATUT : READY_TO_CLOSE/);
  assert.match(wf,/STATUT : DONE/);
  assert.match(wf,/v2_mode=true/);
  assert.match(wf,/v2_mode=false/);
  assert.doesNotMatch(wf,/repository_dispatch|KODJO_V2_FINAL_APPROVED|NEW_FINALIZATION_QUEUE/);
});

test('D2: VISUAL_APPROVED never replaces technical, functional or preservation evidence',()=>{
  for(const mutate of [
    value=>{value.criteria[0].proof_results[0].status='FAIL';},
    value=>{value.criteria[0].proof_results[0].status='NON_VERIFIABLE';},
    value=>{value.criteria[0].proof_results[0].status='PENDING_DEVICE';},
    value=>{value.criteria[0].implementation_status='NON_VERIFIABLE';},
    value=>{value.criteria[0].preserve_status='FAIL';},
    value=>{value.boundary_results[0].status='NON_VERIFIABLE';},
    value=>{value.boundary_results[1].status='FAIL';},
  ]){
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-d2-'));
    try{
      const f=fixture(dir),value=reviewValue();mutate(value);
      const body=fs.readFileSync(f.reviewFile,'utf8').replace(/<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>[\s\S]*?<\/KODJO_UI_IMPLEMENTATION_REVIEW_JSON>/,'<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'+JSON.stringify(value)+'</KODJO_UI_IMPLEMENTATION_REVIEW_JSON>');
      fs.writeFileSync(f.reviewFile,body);
      const r=run(finalVerifier,[f.reviewFile,f.implFile,f.visualFile,f.queuePath,String(f.issue),'104','105',path.join(dir,'out.json')],dir);
      assert.notEqual(r.status,0);assert.match(r.stderr,/V2_FINAL_(TECHNICAL_PROOF_NOT_PASS|CRITERION_NOT_CLOSED|BOUNDARY_NOT_PASS)/);
    }finally{fs.rmSync(dir,{recursive:true,force:true});}
  }
});

test('delta/global: record, idempotent replay and canonical planning entry require no queue mutation',()=>{
  const {dir,f}=deltaFixture();
  const {main}=require('../../scripts/kodjo/targeted-requalification');
  const repo='MyUncried/Application-Routine';
  const issueUrl='https://api.github.com/repos/'+repo+'/issues/'+f.issue;
  const comments={
    105:{id:105,issue_url:issueUrl,user:{login:'MyUncried'},body:targetedBody(f)},
    104:{id:104,issue_url:issueUrl,user:{login:'github-actions[bot]'},body:fs.readFileSync(f.reviewFile,'utf8')},
    103:{id:103,issue_url:issueUrl,user:{login:'github-actions[bot]'},body:fs.readFileSync(f.implFile,'utf8')},
  };
  let writes=0;
  const transport=(args,input)=>{
    const endpoint=args.find(x=>x.startsWith('repos/'));
    if(args.includes('POST')) {
      assert.equal(endpoint,'repos/'+repo+'/issues/'+f.issue+'/comments');
      writes++;comments[106]={id:106,issue_url:issueUrl,user:{login:'github-actions[bot]'},body:JSON.parse(input).body};
      return JSON.stringify(comments[106]);
    }
    if(endpoint.includes('/issues/comments/')) return JSON.stringify(comments[endpoint.split('/').pop()]);
    if(endpoint.includes('/comments?')) return JSON.stringify([Object.values(comments)]);
    if(endpoint.includes('/pulls/')) return JSON.stringify({state:'open',base:{ref:'main'},head:{sha:f.head,ref:'kodjo/v2-e2e-ui'}});
    if(endpoint.includes('/git/ref/')) return JSON.stringify({object:{sha:f.head}});
    throw new Error('Unexpected API: '+endpoint);
  };
  const queueBefore=fs.readFileSync(f.queuePath,'utf8');
  const cwd=process.cwd();
  try {
    process.chdir(dir);
    const idFile=path.join(dir,'checkpoint-id');
    main(['record',repo,String(f.issue),'105',idFile],transport);
    main(['record',repo,String(f.issue),'105',idFile],transport);
    assert.equal(writes,1);
    assert.equal(fs.readFileSync(idFile,'utf8'),'106\n');
    const trigger=path.join(dir,'trigger');
    main(['resolve',repo,String(f.issue),'106',trigger],transport);
    assert.match(fs.readFileSync(trigger,'utf8'),/START_PLAN_REVISION/);
    assert.equal(JSON.parse(fs.readFileSync(trigger+'.proof.json','utf8')).targeted_result,'PASS');
    assert.equal(fs.readFileSync(f.queuePath,'utf8'),queueBefore);
    comments[106].body+='tampered';
    assert.throws(()=>main(['resolve',repo,String(f.issue),'106',trigger],transport),/CHECKPOINT_DRIFT/);
    comments[105].user.login='someone-else';
    assert.throws(()=>main(['record',repo,String(f.issue),'105',idFile],transport),/AUTHORITY_INVALID/);
  } finally {process.chdir(cwd);}
});
test('delta/global: canonical entry replays evidence before generating a plan',()=>{
  const wf=fs.readFileSync(path.join(root,'.github/workflows/kodjo-v2-slice-plan.yml'),'utf8');
  assert.ok(wf.indexOf('targeted-requalification.js resolve')<wf.indexOf('generate-ui-plan-contract.js request'));
  assert.ok(wf.includes('FULL SLICE REQUALIFICATION REQUIRED'));
  const entry=fs.readFileSync(path.join(root,'.github/workflows/kodjo-v2-targeted-requalification.yml'),'utf8');
  assert.ok(entry.includes('targeted-requalification.js record'));
  assert.ok(entry.includes('gh workflow run kodjo-v2-slice-plan.yml'));
  assert.ok(!entry.includes('lean-queue'));
});

test('delta/global: old complete reviews cannot bypass a recorded global requalification',()=>{
  const {verify}=require('../../scripts/kodjo/verify-global-requalification-state');
  const proof={slice_id:'V2-CAT-01',application_pr:181,plan_blob_oid:'a'.repeat(40)};
  const comments=[{id:106,user:{login:'github-actions[bot]'},body:'[KODJO_V2] TARGETED_VALIDATION_OUTPUT\n<KODJO_TARGETED_VALIDATION_JSON>\n'+JSON.stringify(proof)+'\n</KODJO_TARGETED_VALIDATION_JSON>'}];
  const final={...proof,final_status:'READY_TO_CLOSE',review_mode:'CRITERION_COMPLETE',implementation_review_comment_id:'104',human_device_approval_comment_id:'105'};
  assert.throws(()=>verify(final,comments),/NEW_PLAN_AND_APPROVAL_REQUIRED/);
  final.plan_blob_oid='b'.repeat(40);
  assert.throws(()=>verify(final,comments),/NEW_PLAN_AND_APPROVAL_REQUIRED/);
  final.implementation_review_comment_id='110';final.human_device_approval_comment_id='111';
  assert.equal(verify(final,comments),true);
  final.review_mode='VISUAL_CORRECTION_DELTA';
  assert.throws(()=>verify(final,comments),/FULL_REVIEW_REQUIRED/);
});
