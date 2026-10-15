'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const V=require('../../scripts/kodjo/lib/vnext-contract'),B=require('../../scripts/kodjo/lib/vnext-file-bundle'),Chain=require('../../scripts/kodjo/lib/vnext-live-chain'),Review=require('../../scripts/kodjo/lib/review-contract'),C=require('../../scripts/kodjo/lib/vnext-cumulative-review');
const Fixture=require('./helpers/vnext-figma-fixture'),Attestation=require('./helpers/review-attestation-fixture');
function saved(p,ids,{scope=null,session='TEST ONLY',findings=[]}={}){const semantic=Attestation.semantic(p.artifacts.reviewContext,findings);semantic.reviewed_target_ids=ids;const stdout=JSON.stringify({type:'result',session_id:session,structured_output:{semantic_review:semantic,native_assessment_observations:[]}});return V.sealContract({schema_version:'kodjo.vnext.review-response.v1',produced_chain_hash:p.contract_hash,reviewer_packet_hash:p.reviewer_packet.contract_hash,...(scope?{review_scope_hash:scope.contract_hash}:{}),process_result:{status:0,signal:null,error_code:null},stdout,stderr:'',stdout_sha256:V.sha256(stdout)});}
test('partial observations remain explicitly unapproved; cumulative receipt retains actual sessions and cannot complete unread obligations',t=>{
 const f=Fixture.fixture();t.after(()=>f.cleanup());const p=f.produce(),all=Review.TARGET_TYPES.flatMap(type=>p.artifacts.reviewContext.target_catalog[type]);
 const scope=C.scopeFor(p),first=C.record(p,saved(p,all.slice(0,3),{scope,session:'TEST FIRST'}),{scope});assert.equal(first.partial_report.verdict,'REVIEW_INCOMPLETE');assert.throws(()=>Chain.verifyReceipt(p,first),/BINDING_MISMATCH/);
 const ledger=C.append(p,null,first);assert.ok(ledger.coverage.pending_target_ids.length);assert.throws(()=>C.aggregate(p,ledger),/COVERAGE_INCOMPLETE/);assert.equal(C.append(p,ledger,first).contract_hash,ledger.contract_hash);
 const next=C.scopeFor(p,ledger);assert.ok(next.target_ids.every(id=>!first.partial_report.reviewed_target_ids.includes(id)));
 const second=C.record(p,saved(p,next.target_ids,{scope:next,session:'TEST SECOND'}),{scope:next}),completeLedger=C.append(p,ledger,second),receipt=C.aggregate(p,completeLedger);
 assert.equal(Chain.verifyReceipt(p,receipt).verdict,'APPROVE');assert.deepEqual(receipt.session_ids,['TEST FIRST','TEST SECOND']);assert.equal(receipt.session_id,undefined);assert.deepEqual(receipt.ledger.coverage.pending_target_ids,[]);
 assert.throws(()=>C.record(p,saved(p,[all[0]],{scope:next}),{scope:next}),/SCOPE_EXCEEDED/);
 const empty=C.record(p,saved(p,[],{scope}),{scope});assert.throws(()=>C.append(p,null,empty),/NO_PROGRESS_NO_RETRY/);
 const other=C.record(p,saved(p,all.slice(0,2),{scope,session:'TEST CONCURRENT'}),{scope});assert.throws(()=>C.append(p,ledger,other),/NEXT_SCOPE_MISMATCH/);
});
test('an archived partial response is imported without a model call, preserves findings, and never transfers coverage to changed source',t=>{
 const f=Fixture.fixture();t.after(()=>f.cleanup());const p=f.produce(),ctx=p.artifacts.reviewContext,ids=Review.TARGET_TYPES.flatMap(type=>ctx.target_catalog[type]),finding={category:'MISSING_REQUIREMENT',target_type:'SOURCE_UNIT',target_id:ctx.target_catalog.SOURCE_UNIT[0],finding:'TEST ONLY preserved partial finding',evidence:['TEST source'],required_correction:'TEST correct source',dependency_target_ids:[]};
 const original=saved(p,ids.slice(0,2),{findings:[finding]}),r=C.record(p,original),ledger=C.append(p,null,r);assert.equal(ledger.finding_ids.length,1);assert.equal(r.saved_response.contract_hash,original.contract_hash);assert.ok(!C.scopeFor(p,ledger).target_ids.includes(ids[0]));
 const changed=V.sealContract({...Object.fromEntries(Object.entries(p).filter(([k])=>k!=='contract_hash')),changed_source:'TEST ONLY distinct version'});assert.throws(()=>C.verifyLedger(changed,ledger),/LEDGER_STALE/);
 const failure=V.sealContract({...Object.fromEntries(Object.entries(original).filter(([k])=>k!=='contract_hash')),process_result:{status:1,signal:null,error_code:null}});assert.throws(()=>C.record(p,failure),/PROCESS_UNVERIFIED/);
});
test('the common plan adapter selects bounded scopes by default and consumes immutable progress through the final receipt without another invocation',t=>{
 const f=Fixture.fixture();t.after(()=>f.cleanup());const p=f.produce(),Agent=require('../../scripts/kodjo/agent-relay'),Consume=require('../../scripts/kodjo/consume-vnext-review-progress');
 B.write(path.join(f.cwd,'produced.json'),p);B.write(path.join(f.cwd,'inputs.json'),{produced_file:'produced.json',causal_file:null});f.git('add','.');f.git('commit','-m','TEST ONLY pinned large preparation');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-cumulative-operation-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));let calls=0,final;const capacity=Math.ceil(Review.TARGET_TYPES.flatMap(type=>p.artifacts.reviewContext.target_catalog[type]).length/2);
 for(let round=0;round<4;round++){
  const source=f.git('rev-parse','HEAD'),request=Agent.create({source_head:source,inputs_file:'inputs.json',operation:'plan-review',slice_id:p.artifacts.planningEnvelope.slice_id,repository:'MyUncried/Application-Routine',issue_number:999},f.cwd,{reviewCapacity:capacity});assert.notEqual(request.operation_hash,p.contract_hash);
  const adapter=Agent.adapterFor(request,f.cwd,{reviewCapacity:capacity,invoke:(_bin,_args,_cwd,input)=>{calls++;const d=JSON.parse(input);assert.ok(d.review_scope.target_ids.length<=C.MAX_DIRECT_TARGETS);return saved(p,d.review_scope.target_ids,{scope:d.review_scope,session:'TEST '+calls}).stdout;}});
  const artifact=path.join(root,'artifact-'+round),options={cwd:f.cwd,adapter,evidenceRoot:path.join(root,'cache'),outputDirectory:artifact,issueState:()=> 'open',priorAttempt:()=>false,lock:{claudeProcessState:()=>({state:'NONE'}),acquire:()=>({}),release:()=>{}}};
  const result=Agent.execute(request,options);
  if(result.receipt.schema_version===C.COMPLETE){final=result.receipt;assert.equal(B.read(path.join(artifact,'checkpoint.json')).model_invoked,false);break;}
  assert.equal(result.verdict,null);const out=path.join(root,'out-'+round),checkpoint=Consume.consume(request,artifact,out,{cwd:f.cwd});assert.equal(checkpoint.model_invoked,false);fs.cpSync(path.join(out,'.github'),path.join(f.cwd,'.github'),{recursive:true});f.git('add','.github');f.git('commit','-m','TEST ONLY verified cumulative progress');
 }
 assert.ok(final);assert.equal(calls,2);assert.equal(Chain.verifyReceipt(p,final).verdict,'APPROVE');assert.deepEqual(final.ledger.coverage.pending_target_ids,[]);
});
test('changing capacity or run title cannot replay a scope; a verified ledger authorizes only its actually unread remainder',t=>{
 const f=Fixture.fixture();t.after(()=>f.cleanup());const p=f.produce(),Agent=require('../../scripts/kodjo/agent-relay');B.write(path.join(f.cwd,'produced.json'),p);B.write(path.join(f.cwd,'inputs.json'),{produced_file:'produced.json',causal_file:null});f.git('add','.');f.git('commit','-m','TEST ONLY immutable review inputs');const source=f.git('rev-parse','HEAD'),config={source_head:source,inputs_file:'inputs.json',operation:'plan-review',slice_id:p.artifacts.planningEnvelope.slice_id,repository:'MyUncried/Application-Routine',issue_number:999};
 const first=Agent.create(config,f.cwd,{reviewCapacity:12}),changedCapacity=Agent.create(config,f.cwd,{reviewCapacity:10}),file='.github/orchestration/requests/vnext-agent/'+first.contract_hash+'.json';B.write(path.join(f.cwd,file),first);f.git('add',file);f.git('commit','-m','TEST ONLY earlier dispatched request');const requestCommit=f.git('rev-parse','HEAD');
 const run={id:123,event:'push',head_sha:requestCommit,status:'completed',conclusion:'success',run_attempt:1,display_title:'A renamed title without operation identity'},command=(bin,args,cwd)=>bin==='gh'?JSON.stringify({workflow_runs:[run]}):Chain.command(bin,args,cwd);
 assert.equal(Agent.priorScopeReconciled(first,changedCapacity,f.cwd),false);assert.equal(Agent.priorInvocation(changedCapacity,'f'.repeat(40),f.cwd,command),true);
 const scope=first.review_scope,partial=C.record(p,saved(p,scope.target_ids.slice(0,3),{scope}),{scope}),ledger=C.append(p,null,partial);B.write(path.join(f.cwd,C.pathFor(p)),ledger);f.git('add','.');f.git('commit','-m','TEST ONLY verified partial response and ledger');
 const next=Agent.create({...config,source_head:f.git('rev-parse','HEAD')},f.cwd);assert.ok(next.review_scope.target_ids.some(id=>scope.target_ids.includes(id)));assert.equal(Agent.priorScopeReconciled(first,next,f.cwd),true);assert.equal(Agent.priorInvocation(next,'f'.repeat(40),f.cwd,command),false);
});
