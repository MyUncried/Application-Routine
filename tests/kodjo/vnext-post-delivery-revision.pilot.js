'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const CLI=require('../../scripts/kodjo/vnext-chain');
const Chain=require('../../scripts/kodjo/lib/vnext-live-chain');
const Driver=require('../../scripts/kodjo/prepare-vnext12');
const F=require('./helpers/vnext-planning-fixture');
const ROOT=path.resolve(__dirname,'../..');
function temporary(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-post-delivery-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function fixture(t){
 const cwd=temporary(t),git=(...a)=>execFileSync('git',a,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init');git('config','user.name','Test');git('config','user.email','test@example.test');
 for(const file of ['scripts/kodjo','tests/fixtures/vnext12','.github/orchestration/vnext12/VNEXT-12-QUALIF/requirement.md','.github/orchestration/vnext12/VNEXT-12-QUALIF/request.json']){
  fs.mkdirSync(path.dirname(path.join(cwd,file)),{recursive:true});fs.cpSync(path.join(ROOT,file),path.join(cwd,file),{recursive:true});
 }
 git('add','.');git('commit','-m','explicit local test fixture');
 const recipe=Driver.buildRecipe(cwd),produced=Chain.produce(recipe,{cwd});
 const response=p=>JSON.stringify({type:'result',session_id:'TEST-FIXTURE-NO-REAL-MODEL',structured_output:{semantic_review:require('./helpers/review-attestation-fixture').semantic(p.artifacts.reviewContext,[]),native_assessment_observations:[]}});
 return {cwd,recipe,produced,response};
}
function reservation(t){
 const cwd=temporary(t),output=path.join(cwd,'reservation.json'),repository='MyUncried/Application-Routine',issue=269,body='KODJO VNext — Réservation technique du gate\nprepared_chain_hash='+'a'.repeat(64);
 const comment=id=>({id,body,issue_url:'https://api.github.com/repos/'+repository+'/issues/'+issue,html_url:'https://github.com/'+repository+'/issues/'+issue+'#issuecomment-'+id});
 return {cwd,output,repository,issue,body,comment};
}
test('lost reservation response after server creation is reconciled without a second POST',t=>{
 const f=reservation(t),remote=[];let posts=0;
 const invoke=(_bin,args)=>{
  if(args.includes('GET'))return JSON.stringify(remote);
  posts++;remote.push(f.comment(987));throw Error('TEST_RESPONSE_LOST_AFTER_SERVER_CREATION');
 };
 assert.throws(()=>CLI.reserveComment({...f,invoke}),/RESPONSE_LOST/);
 assert.ok(fs.existsSync(f.output+'.intent.json'));
 assert.equal(CLI.reserveComment({...f,invoke}).gate_ref,'issue_comment:987');
 assert.equal(CLI.reserveComment({...f,invoke}).gate_ref,'issue_comment:987');assert.equal(posts,1);
});
test('unknown reservation and duplicate exact remote matches stop without another creation',t=>{
 const f=reservation(t);let posts=0;
 const invoke=(_bin,args)=>{if(args.includes('GET'))return '[]';posts++;throw Error('TEST_UNKNOWN_SERVER_RESULT');};
 assert.throws(()=>CLI.reserveComment({...f,invoke}),/UNKNOWN_SERVER_RESULT/);
 assert.throws(()=>CLI.reserveComment({...f,invoke}),/PREVIOUS_RESULT_UNKNOWN/);assert.equal(posts,1);
 assert.throws(()=>CLI.reserveComment({...f,invoke:(_bin,args)=>{assert.ok(args.includes('GET'));return JSON.stringify([f.comment(987),f.comment(988)]);}}),/REMOTE_AMBIGUOUS/);
});
test('reservation keeps the raw server response before final receipt persistence',t=>{
 const f=reservation(t),raw=JSON.stringify(f.comment(987));let posts=0;
 const invoke=(_bin,args)=>{if(args.includes('GET'))return '[]';posts++;return raw;};
 const result=CLI.reserveComment({...f,invoke});assert.equal(result.gate_ref,'issue_comment:987');
 assert.equal(fs.readFileSync(f.output+'.response.json','utf8'),raw);assert.equal(posts,1);
 const original=JSON.parse(fs.readFileSync(f.output+'.intent.json'));original.body_sha256='b'.repeat(64);fs.writeFileSync(f.output+'.intent.json',JSON.stringify(original));
 assert.throws(()=>CLI.reserveComment({...f,invoke}),/INTENT_MISMATCH/);assert.equal(posts,1);
});
test('lost approval PATCH response reuses the exact reserved comment without resetting its timestamp',t=>{
 const f=reservation(t),prepared={contract_hash:'a'.repeat(64),produced:{artifacts:{planningEnvelope:{issue_id:'github_issue:MyUncried/Application-Routine#269'}}}},gateReservation={gate_ref:'issue_comment:987',repository:f.repository,issue_number:f.issue,prepared_chain_hash:prepared.contract_hash};
 let remote={...f.comment(987),body:CLI.reservationMessage(prepared),updated_at:'TEST_BEFORE'},patches=0;
 const body='EXACT TEST APPROVAL MESSAGE',github={comment:()=>remote};
 const invoke=(_bin,args)=>{assert.ok(args.includes('PATCH'));patches++;remote={...remote,body,updated_at:'TEST_AFTER'};throw Error('TEST_LOST_PATCH_RESPONSE');};
 assert.throws(()=>CLI.publishReservedApproval(prepared,gateReservation,body,{cwd:f.cwd,github,invoke,output:f.output}),/LOST_PATCH_RESPONSE/);
 const recovered=CLI.publishReservedApproval(prepared,gateReservation,body,{cwd:f.cwd,github,invoke,output:f.output});assert.equal(recovered.updated_at,'TEST_AFTER');assert.equal(patches,1);
 remote={...remote,body:'edited unrelated message'};assert.throws(()=>CLI.publishReservedApproval(prepared,gateReservation,body,{cwd:f.cwd,github,invoke}),/REAL_GATE_REQUIRED/);
});
test('CLI approval requires the reserved gate and handoff cannot silently mint a new retry identity',t=>{
 const cwd=temporary(t),file=path.join(cwd,'config.json');fs.writeFileSync(file,'{}');
 assert.throws(()=>CLI.main(['request-approval',file]),/RESERVED_GATE_REQUIRED/);
 assert.throws(()=>CLI.main(['handoff',file,path.join(cwd,'queue.json')]),/FINALIZED_REQUEST_ID_REQUIRED/);
});
test('valid response survives validation archival failure and recovers exact bytes without a new model call',t=>{
 const f=fixture(t),out=temporary(t),raw=f.response(f.produced),original=fs.writeFileSync;let calls=0,writes=0;
 try{
  fs.writeFileSync=function(file,...args){if(String(file).endsWith('initial-review-process.json')&&++writes>1)throw Error('TEST_DIAGNOSTIC_ARCHIVE_FAILURE');return original.call(this,file,...args);};
  assert.throws(()=>Chain.review(f.produced,{cwd:f.cwd,evidenceDirectory:out,claude:'TEST-FIXTURE',invoke:()=>{calls++;return raw;}}),/ARCHIVE_FAILURE/);
 }finally{fs.writeFileSync=original;}
 const saved=fs.readFileSync(path.join(out,'initial-review-response.json'),'utf8');
 const receipt=Chain.reviewOrRecover(f.produced,{cwd:f.cwd,evidenceDirectory:out,invoke:()=>assert.fail('no model call allowed')});
 assert.equal(receipt.raw_result,raw);assert.equal(calls,1);assert.equal(fs.readFileSync(path.join(out,'initial-review-response.json'),'utf8'),saved);
});
test('delivery correction cannot be routed as INITIAL and a REVISION cannot prepare without its causal evidence',t=>{
 const f=fixture(t);
 assert.throws(()=>Chain.produce({...f.recipe,deliveryCorrection:{}},{cwd:f.cwd}),/DELIVERY_CORRECTION_REQUIRES_REVISION/);
 const recipe=structuredClone(f.recipe);recipe.planningInput={...recipe.planningInput,planning_mode:'REVISION',base_plan_hash:f.produced.artifacts.planContract.contract_hash,base_review_hash:'a'.repeat(64),causal_findings:['FND-test-causal'],created_from:{kind:'PLAN_REVIEW_REVISE',refs:['TEST-FIXTURE-ONLY']}};
 const revised=Chain.produce(recipe,{cwd:f.cwd});
 const receipt=Chain.review(revised,{cwd:f.cwd,claude:'TEST-FIXTURE',invoke:()=>f.response(revised)});
 assert.throws(()=>Chain.prepare(revised,receipt,F.transport(),{cwd:f.cwd}),/REVISION_EVIDENCE_REQUIRED/);
});
test('a decision source requires the actual owner and exact repository/issue before planning',()=>{
 const V=require('../../scripts/kodjo/lib/vnext-contract'),Source=require('../../scripts/kodjo/lib/source-manifest');
 const body='AUTHORIZED TEST DECISION',stamp='2026-10-04T10:00:00Z',issue='github_issue:MyUncried/Application-Routine#269';
 const manifest=Source.build({slice_id:'VNEXT-12-QUALIF',product_head:'a'.repeat(40),sources:[{source_kind:'GITHUB_COMMENT',authority:'DECISION',locator:'github_issue_comment:MyUncried/Application-Routine#123',revision:stamp,fingerprint:V.sha256(body),units:[{locator:'FULL_FILE',fingerprint:V.sha256(body),disposition:'REQUIREMENT_SOURCE'}]}]});
 const comment={id:123,body,updated_at:stamp,user:{login:'MyUncried'},issue_url:'https://api.github.com/repos/MyUncried/Application-Routine/issues/269'};
 assert.equal(Chain.observeSources(manifest,ROOT,{comment:()=>comment},issue)[0].content,body);
 for(const patch of [{user:{login:'outsider'}},{issue_url:'https://api.github.com/repos/MyUncried/Application-Routine/issues/270'},{issue_url:'https://api.github.com/repos/Foreign/Repo/issues/269'}])assert.throws(()=>Chain.observeSources(manifest,ROOT,{comment:()=>({...comment,...patch})},issue),/SOURCE_COMMENT_ORIGIN_MISMATCH/);
 assert.throws(()=>Chain.observeSources(manifest,ROOT,{comment:()=>comment}),/DECISION_SOURCE_CONTEXT_REQUIRED/);
});
