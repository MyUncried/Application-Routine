'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const V=require('../../scripts/kodjo/lib/vnext-contract'),B=require('../../scripts/kodjo/lib/vnext-file-bundle');
const Agent=require('../../scripts/kodjo/agent-relay'),Relay=require('../../scripts/kodjo/lib/vnext-agent-relay');
const Scope=require('../../scripts/kodjo/lib/vnext-review-scope'),Chain=require('../../scripts/kodjo/lib/vnext-live-chain');
function reseal(value){const {contract_hash,...fields}=value;return V.sealContract(fields);}
function setup(t,operation='review-scope'){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'agent-relay-test-')),cwd=path.join(root,'checkout');fs.mkdirSync(cwd);t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const request=V.sealContract({schema_version:'kodjo.vnext.agent-request.v1',pilot:'CHATGPT_WORK',slice_id:'VNEXT-PRE-4',repository:'MyUncried/Application-Routine',issue_number:999,source_head:'a'.repeat(40),operation,inputs_file:'inputs.json',inputs_hash:'b'.repeat(64),operation_hash:'c'.repeat(64)});
 const receipt=V.sealContract({value:'TEST ONLY'});let calls=0,recovers=0;
 const adapter={name:operation,preflight:()=>{},hasResponse:d=>fs.existsSync(path.join(d,'raw.json')),
  invoke:d=>{calls++;B.write(path.join(d,'raw.json'),receipt);return receipt;},recover:d=>{recovers++;return B.read(path.join(d,'raw.json'));},
  verify:r=>{V.verifyContractHash(r);return r;},result:r=>V.sealContract({schema_version:'kodjo.vnext.agent-result.v1',request_hash:request.contract_hash,source_head:request.source_head,slice_id:request.slice_id,operation,inputs_hash:request.inputs_hash,status:'COMPLETED',verdict:null,receipt:r})};
 const options={cwd,evidenceRoot:path.join(root,'cache'),outputDirectory:path.join(root,'artifact'),adapter,issueState:n=>n===340?'closed':'open',lock:{claudeProcessState:()=>({state:'NONE'}),acquire:()=>({}),release:()=>{}}};
 return {root,cwd,request,adapter,options,counts:()=>({calls,recovers})};
}
test('all registered operations share one lock/cache/evidence lifecycle; arbitrary commands and PRE-3 are refused',t=>{
 assert.deepEqual(Agent.OPERATIONS,['plan-review','review-scope','implementation-review']);
 for(const operation of Agent.OPERATIONS){const f=setup(t,operation);Agent.execute(f.request,f.options);Agent.execute(f.request,f.options);assert.equal(f.counts().calls,1);Relay.verifyEvidence(f.request,f.options.outputDirectory);}
 const f=setup(t);for(const patch of [{operation:'shell'},{slice_id:'VNEXT-PRE-3'},{issue_number:340},{pilot:'CLAUDE_CODE'},{inputs_file:'../secret'}])assert.throws(()=>Agent.execute(reseal({...f.request,...patch}),f.options));
 assert.throws(()=>Agent.execute(reseal({...f.request,command:'anything'}),f.options),/KEYS/);
});
test('quota/ambiguous call publishes failure evidence, blocks another model call and permits direct diagnostic consumption',t=>{
 const f=setup(t);let calls=0;f.adapter.invoke=()=>{calls++;throw Error('VNEXT_REVIEW_USAGE_LIMIT');};
 assert.throws(()=>Agent.execute(f.request,f.options),/USAGE_LIMIT/);
 assert.equal(Agent.verify(f.request,f.options.outputDirectory,{cwd:f.cwd}).status,'ORCHESTRATION_FAILURE');
 assert.throws(()=>Agent.execute(f.request,f.options),/PRIOR_INVOCATION_UNKNOWN_NO_RETRY/);assert.equal(calls,1);
});
test('saved response is recovered after publication interruption without a second model call; tampered evidence is refused',t=>{
 const f=setup(t),invoke=f.adapter.invoke;f.adapter.invoke=d=>{invoke(d);throw Error('publication interrupted');};
 assert.throws(()=>Agent.execute(f.request,f.options),/interrupted/);
 fs.rmSync(f.options.outputDirectory,{recursive:true});Agent.execute(f.request,f.options);
 assert.deepEqual(f.counts(),{calls:1,recovers:1});Relay.verifyEvidence(f.request,f.options.outputDirectory);
 fs.appendFileSync(path.join(f.options.outputDirectory,'process-evidence','raw.json'),' ');
 assert.throws(()=>Relay.verifyEvidence(f.request,f.options.outputDirectory),/EVIDENCE_CHANGED/);
});
test('active Claude, open PRE-3 and prior GitHub attempt refuse invocation and preserve a consumable diagnostic',t=>{
 for(const patch of [{issueState:()=> 'open'},{lock:{claudeProcessState:()=>({state:'ACTIVE'})}},{priorAttempt:()=>true}]){
  const f=setup(t);assert.throws(()=>Agent.execute(f.request,{...f.options,...patch}));assert.equal(f.counts().calls,0);
  assert.equal(Agent.verify(f.request,f.options.outputDirectory,{cwd:f.cwd}).status,'ORCHESTRATION_FAILURE');
 }
});
test('lost local cache cannot bypass an earlier GitHub invocation by republishing the same operation in a different commit',t=>{
 const f=setup(t),git=(...args)=>require('node:child_process').execFileSync('git',args,{cwd:f.cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init');git('config','user.name','Test');git('config','user.email','test@example.invalid');git('commit','--allow-empty','-m','TEST baseline');
 const file='.github/orchestration/requests/vnext-agent/'+f.request.contract_hash+'.json';B.write(path.join(f.cwd,file),f.request);git('add','.');git('commit','-m','TEST exact earlier request');const previous=git('rev-parse','HEAD');
 const current=reseal({...f.request,source_head:previous}),command=(bin,args,cwd)=>bin==='gh'?JSON.stringify({workflow_runs:[{id:'previous-run',display_title:'VNext PRE-4 plan review / '+previous}]}):Chain.command(bin,args,cwd);
 const priorAttempt=()=>Agent.priorInvocation(current,'f'.repeat(40),f.cwd,command);
 assert.equal(priorAttempt(),true);assert.throws(()=>Agent.execute(current,{...f.options,priorAttempt}),/PRIOR_INVOCATION_UNKNOWN_NO_RETRY/);assert.equal(f.counts().calls,0);
 const legacy=V.sealContract({schema_version:'kodjo.vnext.chatgpt-plan-review-request.v1',pilot:'CHATGPT_WORK',slice_id:'VNEXT-PRE-4',repository:f.request.repository,issue_number:999,source_head:'a'.repeat(40),produced_file:'produced.json',produced_chain_hash:'d'.repeat(64),causal_file:null});
 B.write(path.join(f.cwd,'.github/orchestration/requests/vnext-plan-review/'+legacy.contract_hash+'.json'),legacy);git('add','.');git('commit','-m','TEST legacy request');const oldCommit=git('rev-parse','HEAD');
 const oldCommand=(bin,args,cwd)=>bin==='gh'?JSON.stringify({workflow_runs:[{id:'old-run',display_title:'VNext PRE-4 plan review / '+oldCommit}]}):Chain.command(bin,args,cwd);
 assert.equal(Agent.priorInvocation({...legacy,operation:'plan-review',operation_hash:legacy.produced_chain_hash},'f'.repeat(40),f.cwd,oldCommand),true);
});
test('exact screenshot refusal publishes the raw scope reply and recovery reproduces the refusal without invoking again',t=>{
 const f=setup(t),request=V.sealContract({schema_version:'kodjo.vnext.review-scope-request.v1',review_context_hash:'a'.repeat(64),review_report_hash:'b'.repeat(64),base_target_graph_hash:'c'.repeat(64),requests:[{finding_id:'FND-test',targets:[{target_id:'test'}]}]});
 const raw=JSON.stringify({type:'result',session_id:'TEST',structured_output:{request_hash:request.contract_hash,assessments:[{finding_id:'FND-test',dependency_ranges:[[0,0]],observed_ranges:[],evidence_refs:['TEST'],reason:'TEST'}]}});
 let calls=0;f.adapter.invoke=d=>{calls++;fs.writeFileSync(path.join(d,'scope-review-response.json'),raw);return Scope.fromRaw(request,raw);};
 f.adapter.hasResponse=d=>fs.existsSync(path.join(d,'scope-review-response.json'));
 f.adapter.recover=d=>Scope.fromRaw(request,fs.readFileSync(path.join(d,'scope-review-response.json'),'utf8'));
 for(let i=0;i<2;i++){assert.throws(()=>Agent.execute(f.request,f.options),/VNEXT_SCOPE_UNOBSERVED_DEPENDENCY/);const failure=Agent.verify(f.request,f.options.outputDirectory,{cwd:f.cwd});assert.equal(failure.error,'VNEXT_SCOPE_UNOBSERVED_DEPENDENCY');assert.equal(fs.readFileSync(path.join(f.options.outputDirectory,'process-evidence','scope-review-response.json'),'utf8'),raw);}
 assert.equal(calls,1);assert.equal(fs.existsSync(path.join(f.options.outputDirectory,'result.json')),false);
});
test('production scope adapter reads pinned bundles, runs the original validator and verifies after artifact relocation',t=>{
 const f=setup(t),Fixture=require('./helpers/vnext-figma-fixture'),Review=require('../../scripts/kodjo/lib/review-contract');
 const repo=Fixture.fixture();t.after(()=>repo.cleanup());repo.recipe.sourceManifestInput.slice_id='VNEXT-PRE-4';repo.recipe.planningInput.slice_id='VNEXT-PRE-4';
 const produced=repo.produce(),a=produced.artifacts;
 const report=Review.buildReviewReport({reviewContext:a.reviewContext,semanticReview:require('./helpers/review-attestation-fixture').semantic(a.reviewContext,[{category:'MISSING_REQUIREMENT',target_type:'SOURCE_UNIT',target_id:a.requirementRegistry.coverage[0].unit_id,finding:'TEST missing requirement',evidence:['TEST'],required_correction:'TEST correct requirement',dependency_target_ids:[]}])});
 const baseReceipt=V.sealContract({schema_version:'kodjo.vnext.review-receipt.v1',produced_chain_hash:produced.contract_hash,session_id:'TEST',raw_response_sha256:'a'.repeat(64),review_report:report});
 // Use the live receipt constructor, retaining its exact existing schema.
 const rawBase=JSON.stringify({type:'result',session_id:'TEST',structured_output:{native_assessment_observations:[],semantic_review:require('./helpers/review-attestation-fixture').semantic(a.reviewContext,[{category:'MISSING_REQUIREMENT',target_type:'SOURCE_UNIT',target_id:a.requirementRegistry.coverage[0].unit_id,finding:'TEST missing requirement',evidence:['TEST'],required_correction:'TEST correct requirement',dependency_target_ids:[]}])}});
 const receipt=Chain.validateReviewResponse(produced,rawBase);
 const scope=Scope.buildRequest({reviewContext:a.reviewContext,reviewReport:receipt.review_report,artifactGraph:require('../../scripts/kodjo/lib/revision-contract').buildArtifactGraph(a),candidates:[{finding_id:receipt.review_report.findings[0].finding_id,target_ids:[a.requirementRegistry.requirements[0].requirement_id],reason:'TEST'}]});
 for(const [name,value] of Object.entries({'produced.json':produced,'receipt.json':receipt,'scope.json':scope,'inputs.json':{produced_file:'produced.json',review_receipt_file:'receipt.json',scope_request_file:'scope.json'}}))B.write(path.join(repo.cwd,name),value,{forceBundle:true});
 repo.git('add','.');repo.git('commit','-m','TEST pinned scope data');const head=repo.git('rev-parse','HEAD');
 const request=Agent.create({source_head:head,inputs_file:'inputs.json',operation:'review-scope',slice_id:'VNEXT-PRE-4',repository:f.request.repository,issue_number:999},repo.cwd);
 fs.writeFileSync(path.join(repo.cwd,'inputs.json'),'dirty invalid bytes');
 let calls=0;const adapter=Agent.adapterFor(request,repo.cwd,{invoke:()=>{calls++;return JSON.stringify({type:'result',session_id:'TEST',structured_output:{request_hash:scope.contract_hash,assessments:[{finding_id:scope.requests[0].finding_id,dependency_ranges:[[0,0]],observed_ranges:[[0,0]],evidence_refs:['TEST'],reason:'TEST'}]}});}});
 const options={...f.options,cwd:repo.cwd,adapter};Agent.execute(request,options);Agent.execute(request,options);assert.equal(calls,1);
 const moved=path.join(f.root,'download');fs.cpSync(f.options.outputDirectory,moved,{recursive:true});
 const result=Agent.verify(request,moved,{cwd:repo.cwd});assert.equal(result.verdict,null);assert.equal(result.receipt.additions.length,1);
 repo.git('checkout','--','inputs.json');repo.write('unrelated.txt','TEST protocol metadata');repo.git('add','unrelated.txt');repo.git('commit','-m','TEST later data snapshot');
 const next=Agent.create({source_head:repo.git('rev-parse','HEAD'),inputs_file:'inputs.json',operation:'review-scope',slice_id:'VNEXT-PRE-4',repository:f.request.repository,issue_number:999},repo.cwd);
 assert.notEqual(next.contract_hash,request.contract_hash);assert.equal(next.operation_hash,request.operation_hash);
 const nextAdapter=Agent.adapterFor(next,repo.cwd,{invoke:()=>{throw Error('must not invoke a reviewer twice');}});
 Agent.execute(next,{...options,adapter:nextAdapter});assert.equal(calls,1);assert.equal(Agent.verify(next,f.options.outputDirectory,{cwd:repo.cwd}).status,'COMPLETED');
});
test('implementation adapter binds the original plan/delivery/facts, recovers saved output and verifies on a different artifact path',t=>{
 const f=setup(t,'implementation-review'),Fixture=require('./helpers/vnext-figma-fixture'),F=require('../../scripts/kodjo/lib/vnext-figma-source');
 const repo=Fixture.fixture({transformPacket:p=>{const {contract_hash,...fields}=p;fields.states[0].scenarios=[{scenario_id:'toggle',given:'Off',when:'Press',then:'On',proof_required:['FUNCTIONAL_TEST']}];return V.sealContract(fields);}});t.after(()=>repo.cleanup());
 repo.recipe.sourceManifestInput.slice_id='VNEXT-PRE-4';repo.recipe.planningInput.slice_id='VNEXT-PRE-4';
 const produced=repo.produce(),a=produced.artifacts;
 let body=require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter').renderCompatibilityPlan({application_head:a.planningEnvelope.application_head,plan_contract_hash:a.planContract.contract_hash},a.planContract,a.uiAtomicityContract,a.requirementRegistry,a.candidateManifest);
 for(const tag of ['KODJO_VNEXT_PLAN_CONTRACT_JSON','KODJO_VNEXT_UI_ATOMICITY_JSON','KODJO_VNEXT_REQUIREMENT_REGISTRY_JSON']){
  const value=require('../../scripts/kodjo/lib/plan-impact').extractTaggedJson(body,tag),file='.github/orchestration/vnext-contracts/'+a.planContract.contract_hash+'/'+tag+'.json';
  const ref=B.describe(file,value,(name,bytes)=>repo.write(name,bytes));
  body=body.replace(new RegExp('<'+tag+'>[\\s\\S]*?</'+tag+'>'),'<'+tag+'>'+JSON.stringify({schema_version:'kodjo.vnext.block-bundle.v1',block_tag:tag,...ref})+'</'+tag+'>');
 }
 const content=JSON.stringify({values:Object.fromEntries(F.required(repo.snapshot).map(d=>[d.property_id,d.rule.value])),scenarios:{toggle:true}});
 const fact={artifact_path:'facts/execution.json',artifact_sha256:V.sha256(content),observer:'EXECUTED_JSON_FACT',delivery_head:repo.head};
 const observed={approvedPlanSha256:V.sha256(body),deliveryHead:repo.head,
  measurements:F.required(repo.snapshot).flatMap(d=>d.rule.viewports.map(viewport=>({...fact,measurement_id:d.property_id+'@'+viewport,property_id:d.property_id,reference_hash:repo.snapshot.contract_hash,viewport,value:d.rule.value,value_path:['values',d.property_id],evidence:'TEST JSON facts, no pixel or device compliance'}))),
  scenarioResults:repo.snapshot.states.flatMap(s=>s.scenarios||[]).map(s=>({...fact,scenario_id:s.scenario_id,reference_hash:repo.snapshot.contract_hash,status:'PASS',value:true,value_path:['scenarios',s.scenario_id],proof_results:s.proof_required.map(proof_type=>({proof_type,status:'PASS'}))}))};
 repo.write('approved.md',body);repo.write('execution.json',content);
 const data={produced_file:'produced.json',approved_plan_file:'approved.md',observations_file:'observations.json',evidence_files:[{artifact_path:'facts/execution.json',git_path:'execution.json',sha256:V.sha256(content)}]};
 for(const [file,value] of Object.entries({'produced.json':produced,'observations.json':observed,'inputs.json':data}))B.write(path.join(repo.cwd,file),value);
 repo.git('add','.');repo.git('commit','-m','TEST pinned implementation evidence');const sourceHead=repo.git('rev-parse','HEAD');
 const request=Agent.create({source_head:sourceHead,inputs_file:'inputs.json',operation:'implementation-review',slice_id:'VNEXT-PRE-4',repository:f.request.repository,issue_number:999},repo.cwd);
 repo.git('checkout','--detach',repo.head);let calls=0;
 const adapter=Agent.adapterFor(request,repo.cwd,{invoke:(_bin,_args,_cwd,input)=>{
  calls++;const {dossier}=JSON.parse(input);return JSON.stringify({type:'result',session_id:'TEST',structured_output:{verdict:'APPROVE',reference_hashes:dossier.observation.references.map(r=>r.reference_hash),reviewed_assertion_ids:dossier.assertion_ids,reviewed_scenario_ids:dossier.scenario_ids,findings:[],reservations:[],reason:'TEST ONLY'}});
 }});
 const original=adapter.invoke;adapter.invoke=d=>{original(d);fs.rmSync(path.join(d,'implementation-review-receipt.json'));throw Error('publication interruption');};
 const options={...f.options,cwd:repo.cwd,adapter};assert.throws(()=>Agent.execute(request,options),/interruption/);
 Agent.execute(request,options);assert.equal(calls,1);
 const moved=path.join(f.root,'download');fs.cpSync(f.options.outputDirectory,moved,{recursive:true});assert.equal(Agent.verify(request,moved,{cwd:repo.cwd}).verdict,'APPROVE');
 const other=reseal({...request,issue_number:998});assert.throws(()=>Agent.adapterFor(other,repo.cwd),/SCOPE_BINDING/);
});
test('generic plan adapter preserves the live review validator and its REVISE verdict',t=>{
 const f=setup(t,'plan-review'),repo=require('./helpers/vnext-figma-fixture').fixture();t.after(()=>repo.cleanup());
 repo.recipe.sourceManifestInput.slice_id='VNEXT-PRE-4';repo.recipe.planningInput.slice_id='VNEXT-PRE-4';const produced=repo.produce(),a=produced.artifacts;
 B.write(path.join(repo.cwd,'produced.json'),produced);B.write(path.join(repo.cwd,'inputs.json'),{produced_file:'produced.json',causal_file:null});repo.git('add','.');repo.git('commit','-m','TEST generic plan inputs');
 const request=Agent.create({source_head:repo.git('rev-parse','HEAD'),inputs_file:'inputs.json',operation:'plan-review',slice_id:'VNEXT-PRE-4',repository:f.request.repository,issue_number:999},repo.cwd);
 let calls=0;const adapter=Agent.adapterFor(request,repo.cwd,{invoke:()=>{calls++;return JSON.stringify({type:'result',session_id:'TEST',structured_output:{native_assessment_observations:[],semantic_review:require('./helpers/review-attestation-fixture').semantic(a.reviewContext,[{category:'MISSING_REQUIREMENT',target_type:'SOURCE_UNIT',target_id:a.requirementRegistry.coverage[0].unit_id,finding:'TEST missing requirement',evidence:['TEST'],required_correction:'TEST correct requirement',dependency_target_ids:[]}])}});}});
 Agent.execute(request,{...f.options,cwd:repo.cwd,adapter});assert.equal(calls,1);assert.equal(Agent.verify(request,f.options.outputDirectory,{cwd:repo.cwd}).verdict,'REVISE');
 const Legacy=require('../../scripts/kodjo/chatgpt-plan-review'),oldRequest=Legacy.create({source_head:request.source_head,produced_file:'produced.json',causal_file:null},repo.cwd);
 Legacy.execute(oldRequest,{...f.options,cwd:repo.cwd,chain:{...Chain,review:()=>{throw Error('must not invoke the same dossier through the compatibility entry');}}});assert.equal(calls,1);
});
