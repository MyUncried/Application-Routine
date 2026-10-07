'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const F=require('./helpers/vnext-proof-lifecycle-fixture');
const V=require('../../scripts/kodjo/lib/vnext-contract');
const Delivery=require('../../scripts/kodjo/lib/vnext-delivery-preservation');
const Post=require('../../scripts/kodjo/lib/vnext-post-acceptance');
const {extractTaggedJson,sha256}=require('../../scripts/kodjo/lib/plan-impact');
function tmp(t){const d=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-proof-lifecycle-'));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));return d;}
function review(t,value,plan=F.planFixture(true,true)) {
 const dir=tmp(t);fs.writeFileSync(path.join(dir,'plan.md'),plan);fs.writeFileSync(path.join(dir,'changed.txt'),'src/features/example/ExampleScreen.tsx\n');
 fs.writeFileSync(path.join(dir,'raw.json'),JSON.stringify(value));
 const result=F.run(F.reviewVerifier,['validate',path.join(dir,'plan.md'),path.join(dir,'changed.txt'),path.join(dir,'raw.json'),path.join(dir,'out.json')],dir);
 result.review=result.status===0?JSON.parse(fs.readFileSync(path.join(dir,'out.json'))):null;
 return result;
}
function accessibility(status){const v=F.reviewValue();v.criteria[0].proof_results=[v.criteria[0].proof_results[0],{proof_type:'ACCESSIBILITY_CHECK',status,evidence:status==='PASS'?'FIXTURE: automated accessibility check executed':'FIXTURE: TalkBack device check outstanding'}];v.criteria[0].implementation_status=status==='PASS'?'CONFORME':'NON_VERIFIABLE';return v;}
function finalize(f,dir){const out=path.join(dir,'final.json');const r=F.run(F.finalVerifier,[f.reviewFile,f.implFile,f.visualFile,f.queuePath,String(f.issue),'104','105',out],dir);return {r,out};}
function baseline(f,dir,out){const body=fs.readFileSync(f.reviewFile,'utf8');return V.sealContract({reference:{},matrix:extractTaggedJson(fs.readFileSync(path.join(dir,'plan.md'),'utf8'),'KODJO_UI_CRITERIA_MATRIX_JSON'),review:extractTaggedJson(body,'KODJO_UI_IMPLEMENTATION_REVIEW_JSON'),finalization:JSON.parse(fs.readFileSync(out)),plan_blob_oid:'e'.repeat(40)});}
function reseal(value){const b=structuredClone(value);delete b.contract_hash;b.finalization.technical_review_sha256=sha256(b.review);return V.sealContract(b);}
for(const status of ['PASS','PENDING_DEVICE'])test('accessibility '+status+': real review CLI -> exact user approval -> finalization -> VNext retained baseline',t=>{
 const dir=tmp(t),f=F.fixture(dir,accessibility(status),F.planFixture(true,true));
 const {r,out}=finalize(f,dir);assert.equal(r.status,0,r.stderr);const b=baseline(f,dir,out);Delivery.validateBaseline(b);
 assert.equal(b.finalization.all_device_proofs_executed,status==='PASS');
 assert.equal(b.finalization.pending_device_proofs.length,status==='PASS'?0:1);
 if(status==='PENDING_DEVICE'){
  assert.equal(b.finalization.pending_device_proofs[0].status,status);
  for(const body of ['',fs.readFileSync(f.visualFile,'utf8').replace(f.head,'f'.repeat(40)),fs.readFileSync(f.visualFile,'utf8').replace('=104','=999')]){
   fs.writeFileSync(f.visualFile,body);assert.notEqual(finalize(f,dir).r.status,0);
  }
 }
});
for(const type of ['FUNCTIONAL_TEST','STATIC_ANALYSIS','VISUAL_COMPARE','DEVICE_CHECK','ACCESSIBILITY_CHECK'])
for(const status of ['PASS','FAIL','NON_VERIFIABLE','PENDING_DEVICE'])test('review proof policy '+type+' / '+status,t=>{
 const raw=F.planFixture(true,true);const matrix=extractTaggedJson(raw,'KODJO_UI_CRITERIA_MATRIX_JSON');
 const c=matrix.criteria[0];if(type!=='ACCESSIBILITY_CHECK'){c.proof_required=[type,'ACCESSIBILITY_CHECK'];c.risk_types=[type==='STATIC_ANALYSIS'||type==='FUNCTIONAL_TEST'?'FUNCTIONAL':type==='VISUAL_COMPARE'?'VISUAL':'DEVICE','ACCESSIBILITY'];}
 const contract=extractTaggedJson(raw,'KODJO_UI_PLAN_CONTRACT_JSON');contract.matrix_sha256=require('../../scripts/kodjo/lib/ui-criteria-contract').matrixFingerprint(matrix);
 const plan='<KODJO_UI_CRITERIA_MATRIX_JSON>'+JSON.stringify(matrix)+'</KODJO_UI_CRITERIA_MATRIX_JSON>\n<KODJO_UI_PLAN_CONTRACT_JSON>'+JSON.stringify(contract)+'</KODJO_UI_PLAN_CONTRACT_JSON>';
 const value=accessibility('PASS');
 if(type==='ACCESSIBILITY_CHECK')value.criteria[0].proof_results[1].status=status;
 else value.criteria[0].proof_results[0]={proof_type:type,status,evidence:'FIXTURE: proof observation'};
 // NON_VERIFIABLE/PENDING_DEVICE status is derived explicitly for the pending-only cases.
 value.criteria[0].implementation_status='CONFORME';
 const result=review(t,value,plan);
 const allowed=type==='ACCESSIBILITY_CHECK'?['PASS','PENDING_DEVICE']:['VISUAL_COMPARE','DEVICE_CHECK'].includes(type)?['PENDING_DEVICE']:['PASS'];
 assert.equal(result.status===0 && result.review.verdict==='APPROVE',allowed.includes(status),result.stderr);
 if(allowed.includes(status)){const dir=tmp(t),f=F.fixture(dir,value,plan);const {r,out}=finalize(f,dir);assert.equal(r.status,0,r.stderr);Delivery.validateBaseline(baseline(f,dir,out));}
 else {
  const dir=tmp(t),valid=structuredClone(value);valid.criteria[0].proof_results.find(p=>p.proof_type===type).status=allowed[0];
  const f=F.fixture(dir,valid,plan),body=fs.readFileSync(f.reviewFile,'utf8');
  const altered=extractTaggedJson(body,'KODJO_UI_IMPLEMENTATION_REVIEW_JSON');altered.criteria[0].proof_results.find(p=>p.proof_type===type).status=status;
  fs.writeFileSync(f.reviewFile,body.replace(/<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>[\s\S]*?<\/KODJO_UI_IMPLEMENTATION_REVIEW_JSON>/,'<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'+JSON.stringify(altered)+'</KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'));
  const {r,out}=finalize(f,dir);
  if(r.status===0)assert.throws(()=>Delivery.validateBaseline(baseline(f,dir,out)),/TECHNICAL_GAP/);
 }
});
test('missing technical evidence and unjustified pending-to-PASS conversion are refused',t=>{
 const missing=accessibility('PASS');missing.criteria[0].proof_results.shift();assert.notEqual(review(t,missing).status,0);
 for(const type of ['FUNCTIONAL_TEST','ACCESSIBILITY_CHECK']){
  const forged=accessibility('PASS');forged.criteria[0].proof_results.find(p=>p.proof_type===type).evidence='';assert.notEqual(review(t,forged).status,0);
 }
 const omittedDir=tmp(t),omitted=F.fixture(omittedDir,accessibility('PASS'),F.planFixture(true,true));
 const body=fs.readFileSync(omitted.reviewFile,'utf8'),changed=extractTaggedJson(body,'KODJO_UI_IMPLEMENTATION_REVIEW_JSON');changed.criteria[0].proof_results.shift();
 fs.writeFileSync(omitted.reviewFile,body.replace(/<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>[\s\S]*?<\/KODJO_UI_IMPLEMENTATION_REVIEW_JSON>/,'<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'+JSON.stringify(changed)+'</KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'));
 const closed=finalize(omitted,omittedDir);
 if(closed.r.status===0)assert.throws(()=>Delivery.validateBaseline(baseline(omitted,omittedDir,closed.out)),/TECHNICAL_GAP/);
 const dir=tmp(t),f=F.fixture(dir,accessibility('PENDING_DEVICE'),F.planFixture(true,true));
 const {r,out}=finalize(f,dir);assert.equal(r.status,0,r.stderr);
 const b=baseline(f,dir,out);b.review.criteria[0].proof_results[1].status='PASS';
 assert.throws(()=>Delivery.validateBaseline(b),/HASH_INVALID|NOT_APPROVED/);
});
test('retained assertion proofs are rechecked even after resealing a forged finalization',t=>{
 const dir=tmp(t),f=F.fixture(dir,accessibility('PASS'),F.planFixture(true,true));const {r,out}=finalize(f,dir);assert.equal(r.status,0,r.stderr);
 const b=baseline(f,dir,out);b.matrix.criteria[0].assertions=[{assertion_id:'A-1',proof_required:['FUNCTIONAL_TEST']}];
 b.review.criteria[0].assertion_results=[{assertion_id:'A-1',status:'CONFORME',proof_results:[{proof_type:'FUNCTIONAL_TEST',status:'FAIL',evidence:'FIXTURE failed'}]}];
 assert.throws(()=>Delivery.validateBaseline(reseal(b)),/TECHNICAL_GAP/);
 b.review.criteria[0].assertion_results=[];assert.throws(()=>Delivery.validateBaseline(reseal(b)),/TECHNICAL_GAP/);
});
test('scoped explicit waiver closes only its pending proof and retains NOT_EXECUTED reservations',t=>{
 const dir=tmp(t),R=require('../../scripts/kodjo/lib/requirement-contract');let raw=F.planFixture();
 const matrix=extractTaggedJson(raw,'KODJO_UI_CRITERIA_MATRIX_JSON'),target=matrix.criteria[0].change_targets[0];
 matrix.criteria[0].proof_required[0]='STATIC_ANALYSIS';const uiPlan=extractTaggedJson(raw,'KODJO_UI_PLAN_CONTRACT_JSON');uiPlan.matrix_sha256=require('../../scripts/kodjo/lib/ui-criteria-contract').matrixFingerprint(matrix);
 raw='<KODJO_UI_CRITERIA_MATRIX_JSON>'+JSON.stringify(matrix)+'</KODJO_UI_CRITERIA_MATRIX_JSON>\n<KODJO_UI_PLAN_CONTRACT_JSON>'+JSON.stringify(uiPlan)+'</KODJO_UI_PLAN_CONTRACT_JSON>';
 const nonUi=[{requirement_type:'TECHNICAL',source:{path:'docs/native.md',locator:'NATIVE-1',requirement:'FIXTURE native behavior'},change_targets:[target],tests:[],proof_required:['STATIC_ANALYSIS','DEVICE_CHECK']}];
 const requirements=R.buildRequirementContract(matrix,nonUi,new Set([target]));
 const tag=(name,value)=>'\n<'+name+'>'+JSON.stringify(value)+'</'+name+'>';
 const plan=raw+tag('KODJO_VNEXT_SCOPE_JSON',{schema:'kodjo.vnext.downstream-scope.v1',plan_contract_hash:'a'.repeat(64),scope_allow:[target]})+tag('KODJO_NON_UI_REQUIREMENTS_JSON',nonUi)+tag('KODJO_REQUIREMENT_CONTRACT_JSON',requirements)+tag('KODJO_TEST_CONTRACT_JSON',R.buildTestContract(requirements))+tag('KODJO_BOUNDARY_CONTRACT_JSON',R.buildBoundaryContract(matrix));
 const waiver={requirement_id:requirements.requirements.find(r=>r.domain==='NON_UI').requirement_id,proof_type:'DEVICE_CHECK',status:'NOT_EXECUTED',decided_by:'FIXTURE owner',decided_on:'2026-10-05',decision:'FIXTURE: accept missing native check for this requirement only',residual_risk:'FIXTURE: native behavior remains unverified',not_satisfied_by:['VISUAL_APPROVED']};
 const derogationFile=path.join(dir,'derogation.json');fs.writeFileSync(derogationFile,JSON.stringify({schema:'kodjo.device-check-derogation.v1',slice_id:'VNEXT-PROOF-LIFECYCLE',derogations:[waiver]}));
 const input=F.reviewValue();input.criteria[0].proof_results[0].proof_type='STATIC_ANALYSIS';input.non_ui_plan_assessment={status:'CONFORME',evidence:'FIXTURE assessment',requirements:[{requirement_id:waiver.requirement_id,status:'NON_VERIFIABLE',evidence:'FIXTURE: scoped waiver',proof_results:[{proof_type:'STATIC_ANALYSIS',status:'PASS',evidence:'FIXTURE executed'},{proof_type:'DEVICE_CHECK',status:'PENDING_DEVICE',evidence:'FIXTURE: NOT_EXECUTED'}]}]};
 const env={...process.env,KODJO_DEVICE_CHECK_DEROGATION_FILE:derogationFile,SLICE_ID:'VNEXT-PROOF-LIFECYCLE'};
 const f=F.fixture(dir,input,plan,env),value=extractTaggedJson(fs.readFileSync(f.reviewFile,'utf8'),'KODJO_UI_IMPLEMENTATION_REVIEW_JSON');
 assert.equal(value.device_check_derogations[0].status,'NOT_EXECUTED');
 const original=fs.readFileSync(f.reviewFile,'utf8');const write=()=>fs.writeFileSync(f.reviewFile,original.replace(/<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>[\s\S]*?<\/KODJO_UI_IMPLEMENTATION_REVIEW_JSON>/,'<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'+JSON.stringify(value)+'</KODJO_UI_IMPLEMENTATION_REVIEW_JSON>'));
 write();const {r,out}=finalize(f,dir);assert.equal(r.status,0,r.stderr);const b=baseline(f,dir,out);Delivery.validateBaseline(b);
 assert.equal(b.finalization.not_executed_proofs[0].residual_risk,waiver.residual_risk);assert.equal(b.finalization.all_device_proofs_executed,false);assert.equal(b.review.non_ui_plan_assessment.requirements[0].proof_results[1].status,'PENDING_DEVICE');
 // Revocation or expansion of scope cannot reproduce the APPROVE review.
 for(const d of [{...waiver,requirement_id:'OTHER'},{...waiver,proof_type:'ACCESSIBILITY_CHECK'},{...waiver,residual_risk:''}]){
  fs.writeFileSync(derogationFile,JSON.stringify({schema:'kodjo.device-check-derogation.v1',slice_id:'VNEXT-PROOF-LIFECYCLE',derogations:[d]}));
  const rejected=F.run(F.reviewVerifier,['validate',path.join(dir,'plan.md'),path.join(dir,'changed.txt'),path.join(dir,'review-raw.json'),path.join(dir,'rejected.json')],dir,env);assert.notEqual(rejected.status,0);
 }
 for(const mutate of [()=>value.device_check_derogations[0].requirement_id='OTHER',()=>value.non_ui_plan_assessment.requirements[0].proof_results[0].status='FAIL']){
  mutate();write();assert.notEqual(finalize(f,dir).r.status,0);
 }
});
test('post-acceptance revision preserves pending assertions and explicit waiver without laundering failures',t=>{
 const f=require('./helpers/vnext-post-acceptance-fixture').fixture();t.after(()=>f.cleanup());
 const b=structuredClone(f.baseline),c=b.matrix.criteria[0],row=b.review.criteria[0];
 c.proof_required.push('ACCESSIBILITY_CHECK');row.proof_results.push({proof_type:'ACCESSIBILITY_CHECK',status:'PENDING_DEVICE',evidence:'FIXTURE: remaining device check'});row.implementation_status='NON_VERIFIABLE';
 c.assertions[0].proof_required.push('ACCESSIBILITY_CHECK');row.assertion_results[0].proof_results.push({proof_type:'ACCESSIBILITY_CHECK',status:'PENDING_DEVICE',evidence:'FIXTURE remaining'});row.assertion_results[0].status='PENDING_DEVICE';
 b.review.device_check_derogations=[{requirement_id:'REQ-FIXTURE',proof_type:'DEVICE_CHECK',status:'NOT_EXECUTED',decided_by:'FIXTURE owner',decision:'FIXTURE scoped acceptance',residual_risk:'FIXTURE still unverified'}];
 b.review.non_ui_plan_assessment={status:'CONFORME',requirements:[{requirement_id:'REQ-FIXTURE',status:'CONFORME',proof_results:[{proof_type:'DEVICE_CHECK',status:'PENDING_DEVICE',evidence:'FIXTURE: NOT_EXECUTED'}]}]};
 const seal=()=>{delete b.contract_hash;return V.sealContract(b);};Post.validateBaseline(seal());
 b.review.device_check_derogations[0].residual_risk='';assert.throws(()=>Post.validateBaseline(seal()),/TECHNICAL_GAP/);
});
