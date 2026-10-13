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


test('a published sibling preparation branch is admitted; local-only commits are refused',t=>{
 const repo=require('./helpers/vnext-figma-fixture').fixture();t.after(()=>repo.cleanup());
 const main=repo.head;repo.git('checkout','-b','plan/pre4-test');repo.write('plan.txt','TEST unapproved plan');repo.git('add','plan.txt');repo.git('commit','-m','TEST preparation branch');
 const source=repo.git('rev-parse','HEAD'),request={source_head:source};
 assert.throws(()=>Agent.publishedSource(request,repo.cwd),/SOURCE_NOT_PUBLISHED/);
 repo.git('update-ref','refs/remotes/origin/plan/pre4-test',source);repo.git('checkout','--detach',main);
 assert.throws(()=>repo.git('merge-base','--is-ancestor',source,main));
 Agent.publishedSource(request,repo.cwd);
 assert.equal(repo.git('rev-parse','HEAD'),main); // admission does not merge or approve
 assert.throws(()=>Agent.publishedSource({source_head:repo.git('rev-parse',main+':app.ts')},repo.cwd));
});
function historicalRunFixture(){
 const commit='d'.repeat(40),request=V.sealContract({schema_version:'kodjo.vnext.agent-request.v1',pilot:'CHATGPT_WORK',slice_id:'VNEXT-PRE-4',repository:'MyUncried/Application-Routine',issue_number:352,source_head:'a'.repeat(40),operation:'plan-review',inputs_file:'inputs.json',inputs_hash:'b'.repeat(64),operation_hash:'c'.repeat(64)});
 const run={id:123,status:'completed',conclusion:'failure',run_attempt:1,event:'push',head_sha:commit,actor:{login:'MyUncried'},path:'.github/workflows/kodjo-vnext-chatgpt-plan-review.yml'};
 const jobs={total_count:1,jobs:[{id:456,name:'review',status:'completed',conclusion:'failure',steps:[...['Validate runner and request locator before checkout','Checkout trusted protocol','Select exactly one newly committed request','Checkout immutable request and source objects'].map(name=>({name,conclusion:'success'})),{name:'Review or recover with the trusted protocol',conclusion:'failure'}]}]};
 const log='2026-10-13T12:02:18.000Z REQUEST_COMMIT: '+commit+'\n2026-10-13T12:02:18.000Z REQUEST_PATH: .github/orchestration/requests/vnext-agent/'+request.contract_hash+'.json\n2026-10-13T12:02:22.992Z VNEXT_LIVE_PROCESS_FAILED: git: \r\n';
 const values={entry:'3ca49ad3fd0f792328fbf7c60854061b4376f33c',workflow:'d8ee7a2c38a2182b3e7de6296748cd987c8db8a5',notAncestor:'a'.repeat(40),jobs,log};
 const command=(bin,args)=>{
  if(bin==='git'&&args[0]==='rev-parse')return args[1].includes('agent-relay.js')?values.entry:values.workflow;
  if(bin==='git'&&args[0]==='rev-list')return values.notAncestor;
  if(bin==='gh'&&args[1].includes('/jobs?'))return JSON.stringify(values.jobs);
  if(bin==='gh'&&args[1].endsWith('/logs'))return values.log;
  throw Error('TEST unexpected command '+bin+' '+args.join(' '));
 };
 return {run,request,commit,values,command};
}
test('historical pre-model failure requires trusted code, divergent ancestry and authenticated complete job/log evidence',()=>{
 const f=historicalRunFixture(),check=()=>Agent.failedAncestryBeforeInvocation(f.run,f.request,f.commit,'.',f.command);
 assert.equal(check(),true);
 for(const [key,value] of [['status','in_progress'],['conclusion','success'],['run_attempt',2],['event','workflow_dispatch'],['head_sha','e'.repeat(40)],['path','other.yml'],['actor',{login:'another-user'}]]){
  const old=f.run[key];f.run[key]=value;assert.equal(check(),false,key);f.run[key]=old;
 }
 for(const [key,value] of [['entry','changed'],['workflow','changed'],['notAncestor',''],['log','2026-10-13T12:02:22Z VNEXT_REVIEW_USAGE_LIMIT'],['jobs',{total_count:2,jobs:f.values.jobs.jobs}]]){
  const old=f.values[key];f.values[key]=value;assert.equal(check(),false,key);f.values[key]=old;
 }
 f.values.jobs.jobs[0].steps[0].conclusion='failure';assert.equal(check(),false);
});
test('raw historical logs are requested with escape sequences permitted and retained as evidence',()=>{
 const f=historicalRunFixture();let checked=false;
 const command=(bin,args,cwd)=>{
  if(bin==='gh'&&args[1].endsWith('/logs')){assert.ok(args.includes('--allow-escape-sequences'));checked=true;}
  return f.command(bin,args,cwd);
 };
 assert.equal(Agent.failedAncestryBeforeInvocation(f.run,f.request,f.commit,'.',command),true);assert.equal(checked,true);
});
function archivedFailureFixture(t){
 const f=setup(t,'plan-review'),run={id:123,status:'completed',conclusion:'failure',run_attempt:1,event:'push',head_sha:'d'.repeat(40),actor:{login:'MyUncried'},path:'.github/workflows/kodjo-vnext-chatgpt-plan-review.yml'};
 const checkpoint={request_hash:f.request.contract_hash,slice_id:f.request.slice_id,operation:f.request.operation,state:'ORCHESTRATION_FAILURE',model_invoked:false,run_id:'123',run_attempt:'1',error:'TEST gh refuses ANSI'};
 const failure=V.sealContract({schema_version:'kodjo.vnext.agent-failure.v1',request_hash:f.request.contract_hash,source_head:f.request.source_head,slice_id:f.request.slice_id,operation:f.request.operation,status:'ORCHESTRATION_FAILURE',error:checkpoint.error,model_invoked:false});
 const blobs={'scripts/kodjo/agent-relay.js':'c5ff10f7017fcb0fd8c0aa4cc38524bc17adfeb1','scripts/kodjo/lib/vnext-agent-relay.js':'6b9d48e41f6f3cbb62d41d4cbe5394fa623db35b','.github/workflows/kodjo-vnext-chatgpt-plan-review.yml':'19dfae2defdef73851c0350d53fb17100fbd5a7e'};
 const artifact={name:'vnext-chatgpt-review-123-1',expired:false,workflow_run:{id:123,head_sha:run.head_sha}};
 const data={checkpoint,failure,blobs,artifact,extra:false,tamper:false};
 const command=(bin,args)=>{
  if(bin==='git'&&args[0]==='rev-parse')return data.blobs[args[1].slice(41)];
  if(bin==='gh'&&args[0]==='api')return JSON.stringify({total_count:1,artifacts:[data.artifact]});
  if(bin==='gh'&&args[0]==='run'){
   const directory=args[args.indexOf('--dir')+1];B.write(path.join(directory,'checkpoint.json'),data.checkpoint);B.write(path.join(directory,'failure.json'),data.failure);
   if(data.extra)B.write(path.join(directory,'invocation-intent.json'),{});
   if(data.nested){
    const child=path.join(directory,'pre-invocation-122');fs.mkdirSync(child,{recursive:true});
    B.write(path.join(child,'checkpoint.json'),{...data.checkpoint,run_id:'122'});B.write(path.join(child,'failure.json'),data.failure);
    if(data.nestedExtra)B.write(path.join(child,'initial-review-response.json'),{});
    Relay.publishManifest(child,f.request);
   }
   Relay.publishManifest(directory,f.request);
   if(data.tamper)fs.appendFileSync(path.join(directory,'checkpoint.json'),' ');
   return '';
  }
  throw Error('TEST unexpected command');
 };
 return {...f,run,data,command};
}
test('authenticated failure archive proves non-invocation, rejects invoked calls, changed bindings, code and extra evidence',t=>{
 const f=archivedFailureFixture(t),check=()=>Agent.recordedFailureBeforeInvocation(f.run,f.request,f.cwd,f.command);
 assert.equal(check(),true);
 for(const patch of [{model_invoked:true},{source_head:'e'.repeat(40)},{request_hash:'f'.repeat(64)},{status:'COMPLETED'}]){
  const original=f.data.failure;f.data.failure=reseal({...original,...patch});assert.equal(check(),false);f.data.failure=original;
 }
 for(const patch of [{model_invoked:true},{run_id:'999'},{run_attempt:'2'},{error:'other'}]){
  const original=f.data.checkpoint;f.data.checkpoint={...original,...patch};assert.equal(check(),false);f.data.checkpoint=original;
 }
 f.data.extra=true;assert.equal(check(),false);f.data.extra=false;
 f.data.artifact.expired=true;assert.equal(check(),false);f.data.artifact.expired=false;
 f.data.blobs['scripts/kodjo/lib/vnext-agent-relay.js']='untrusted';assert.equal(check(),false);f.data.blobs['scripts/kodjo/lib/vnext-agent-relay.js']='6b9d48e41f6f3cbb62d41d4cbe5394fa623db35b';
 f.data.tamper=true;assert.throws(check,/EVIDENCE_CHANGED/);
});
test('successive pre-model recovery accepts the integrated reader and recursively verifies archived non-invocation',t=>{
 const f=archivedFailureFixture(t),check=()=>Agent.recordedFailureBeforeInvocation(f.run,f.request,f.cwd,f.command);
 f.data.blobs['scripts/kodjo/agent-relay.js']='51860b1feace52b45cf89d5aeef10a0288f8519f';
 f.data.nested=true;assert.equal(check(),true);
 f.data.nestedExtra=true;assert.equal(check(),false);f.data.nestedExtra=false;
 f.data.blobs['scripts/kodjo/agent-relay.js']='f'.repeat(40);assert.equal(check(),false);
});
test('a trusted publisher archive cannot hide a response, invoked call or wrong binding in nested recovery evidence',t=>{
 const f=setup(t,'plan-review'),root=path.join(f.cwd,'nested-proof');fs.mkdirSync(root,{recursive:true});
 const write=(directory,id,invoked=false)=>{
  fs.mkdirSync(directory,{recursive:true});
  B.write(path.join(directory,'checkpoint.json'),{request_hash:f.request.contract_hash,slice_id:f.request.slice_id,operation:f.request.operation,state:'ORCHESTRATION_FAILURE',model_invoked:invoked,run_id:String(id),run_attempt:'1',error:'TEST'});
  B.write(path.join(directory,'failure.json'),V.sealContract({schema_version:'kodjo.vnext.agent-failure.v1',request_hash:f.request.contract_hash,source_head:f.request.source_head,slice_id:f.request.slice_id,operation:f.request.operation,status:'ORCHESTRATION_FAILURE',error:'TEST',model_invoked:invoked}));
  Relay.publishManifest(directory,f.request);
 };
 const child=path.join(root,'pre-invocation-122');write(child,122);write(root,123);
 assert.equal(Agent.verifyNonInvocationArchive(f.request,root,{id:123,run_attempt:1}),true);
 write(child,122,true);Relay.publishManifest(root,f.request);assert.equal(Agent.verifyNonInvocationArchive(f.request,root,{id:123,run_attempt:1}),false);
 write(child,999);Relay.publishManifest(root,f.request);assert.equal(Agent.verifyNonInvocationArchive(f.request,root,{id:123,run_attempt:1}),false);
 write(child,122);B.write(path.join(child,'invocation-intent.json'),{});Relay.publishManifest(child,f.request);Relay.publishManifest(root,f.request);
 assert.equal(Agent.verifyNonInvocationArchive(f.request,root,{id:123,run_attempt:1}),false);
});
test('repeated historical proofs remain valid across recoveries; forged historical proof is refused',t=>{
 const f=archivedFailureFixture(t),root=path.join(f.cwd,'history'),child=path.join(root,'pre-invocation-122');
 const historical=V.sealContract({schema_version:'kodjo.vnext.pre-invocation-recovery.v1',request_hash:f.request.contract_hash,operation_hash:f.request.operation_hash,request_commit:'d'.repeat(40),run_id:121,run_attempt:1,reason:'VERIFIED_LEGACY_ANCESTRY_GUARD',model_invoked:false,entry_blob:'3ca49ad3fd0f792328fbf7c60854061b4376f33c',workflow_blob:'d8ee7a2c38a2182b3e7de6296748cd987c8db8a5',jobs_sha256:'a'.repeat(64),log_sha256:'b'.repeat(64)});
 for(const [directory,id] of [[child,122],[root,123]]){
  fs.mkdirSync(directory,{recursive:true});B.write(path.join(directory,'checkpoint.json'),{...f.data.checkpoint,run_id:String(id)});B.write(path.join(directory,'failure.json'),f.data.failure);
  B.write(path.join(directory,'pre-invocation-recovery-121.json'),historical);Relay.publishManifest(directory,f.request);
 }
 assert.equal(Agent.verifyNonInvocationArchive(f.request,root,{id:123,run_attempt:1}),true);
 B.write(path.join(child,'pre-invocation-recovery-121.json'),reseal({...historical,model_invoked:true}));Relay.publishManifest(child,f.request);Relay.publishManifest(root,f.request);
 assert.equal(Agent.verifyNonInvocationArchive(f.request,root,{id:123,run_attempt:1}),false);
});
test('retrying a resume run resolves back to the exact original request and rejects a different operation',t=>{
 const repo=require('./helpers/vnext-figma-fixture').fixture();t.after(()=>repo.cleanup());const f=historicalRunFixture();
 const file='.github/orchestration/requests/vnext-agent/'+f.request.contract_hash+'.json';B.write(path.join(repo.cwd,file),f.request);repo.git('add','.');repo.git('commit','-m','TEST request');const original=repo.git('rev-parse','HEAD');
 const first=V.sealContract({schema_version:'kodjo.vnext.agent-resume.v1',request_commit:original,request_path:file,request_hash:f.request.contract_hash,source_head:f.request.source_head,operation_hash:f.request.operation_hash,prior_run_id:123});
 const firstFile='.github/orchestration/requests/vnext-agent/resume/'+first.contract_hash+'.json';B.write(path.join(repo.cwd,firstFile),first);repo.git('add','.');repo.git('commit','-m','TEST first resume');const firstHead=repo.git('rev-parse','HEAD');
 const next=reseal({...first,prior_run_id:789}),nextFile='.github/orchestration/requests/vnext-agent/resume/'+next.contract_hash+'.json';B.write(path.join(repo.cwd,nextFile),next);repo.git('add','.');repo.git('commit','-m','TEST second resume');const nextHead=repo.git('rev-parse','HEAD');
 const command=(bin,args,cwd)=>bin==='gh'?JSON.stringify({...f.run,id:args[1].endsWith('/789')?789:123,head_sha:args[1].endsWith('/789')?firstHead:original}):Chain.command(bin,args,cwd);
 assert.deepEqual(Agent.resolveTrigger(nextHead,nextFile,repo.cwd,command),{request_commit:original,request_path:file,prior_run_id:789});
 const wrong=(bin,args,cwd)=>bin==='gh'?JSON.stringify({...f.run,id:789,head_sha:nextHead}):Chain.command(bin,args,cwd);
 assert.throws(()=>Agent.resolveTrigger(nextHead,nextFile,repo.cwd,wrong),/RUN_MISMATCH/);
});
test('same-operation prior scan allows only the proven pre-model failure and still refuses ambiguity',t=>{
 const repo=require('./helpers/vnext-figma-fixture').fixture();t.after(()=>repo.cleanup());const f=historicalRunFixture();
 const file='.github/orchestration/requests/vnext-agent/'+f.request.contract_hash+'.json';B.write(path.join(repo.cwd,file),f.request);repo.git('add','.');repo.git('commit','-m','TEST immutable request');
 f.commit=repo.git('rev-parse','HEAD');f.run.head_sha=f.commit;f.run.display_title='VNext PRE-4 agent operation / '+f.commit;
 f.values.log=f.values.log.replaceAll('d'.repeat(40),f.commit);
 const command=(bin,args,cwd)=>{
  if(bin==='gh'&&args[1].includes('/runs?'))return JSON.stringify({workflow_runs:[f.run]});
  if(bin==='git'&&args[0]==='diff-tree')return file;
  return f.command(bin,args,cwd);
 };
 assert.equal(Agent.priorInvocation(f.request,f.commit,repo.cwd,command),false);
 f.values.log='unknown prior outcome';assert.equal(Agent.priorInvocation(f.request,f.commit,repo.cwd,command),true);
});
test('resume control binds the original request and completed GitHub run without republishing the plan',t=>{
 const repo=require('./helpers/vnext-figma-fixture').fixture();t.after(()=>repo.cleanup());const f=historicalRunFixture();
 const file='.github/orchestration/requests/vnext-agent/'+f.request.contract_hash+'.json';B.write(path.join(repo.cwd,file),f.request);repo.git('add','.');repo.git('commit','-m','TEST original request');const original=repo.git('rev-parse','HEAD');
 const resume=V.sealContract({schema_version:'kodjo.vnext.agent-resume.v1',request_commit:original,request_path:file,request_hash:f.request.contract_hash,source_head:f.request.source_head,operation_hash:f.request.operation_hash,prior_run_id:123});
 const control='.github/orchestration/requests/vnext-agent/resume/'+resume.contract_hash+'.json';B.write(path.join(repo.cwd,control),resume);repo.git('add','.');repo.git('commit','-m','TEST resume only');const trigger=repo.git('rev-parse','HEAD');
 const run={...f.run,head_sha:original},command=(bin,args,cwd)=>bin==='gh'?JSON.stringify(run):Chain.command(bin,args,cwd);
 assert.deepEqual(Agent.resolveTrigger(trigger,control,repo.cwd,command),{request_commit:original,request_path:file,prior_run_id:123});
 assert.deepEqual(Agent.resolveTrigger(original,file,repo.cwd,command),{request_commit:original,request_path:file});
 run.status='in_progress';assert.throws(()=>Agent.resolveTrigger(trigger,control,repo.cwd,command),/RUN_MISMATCH/);run.status='completed';
 const bad=reseal({...resume,operation_hash:'f'.repeat(64)}),badFile='.github/orchestration/requests/vnext-agent/resume/'+bad.contract_hash+'.json';B.write(path.join(repo.cwd,badFile),bad);repo.git('add','.');repo.git('commit','-m','TEST corrupt recovery');
 assert.throws(()=>Agent.resolveTrigger(repo.git('rev-parse','HEAD'),badFile,repo.cwd,command),/REQUEST_CHANGED/);
});

test('production execute entry checks out a sibling published plan and invokes its pinned adapter once',t=>{
 const f=setup(t,'plan-review'),repo=require('./helpers/vnext-figma-fixture').fixture();t.after(()=>repo.cleanup());
 repo.recipe.sourceManifestInput.slice_id='VNEXT-PRE-4';repo.recipe.planningInput.slice_id='VNEXT-PRE-4';
 const produced=repo.produce(),base=repo.git('rev-parse','HEAD');repo.git('checkout','-b','plan/pre4-test');
 B.write(path.join(repo.cwd,'produced.json'),produced);B.write(path.join(repo.cwd,'inputs.json'),{produced_file:'produced.json',causal_file:null});repo.git('add','.');repo.git('commit','-m','TEST sibling plan');const source=repo.git('rev-parse','HEAD');
 const request=Agent.create({source_head:source,inputs_file:'inputs.json',operation:'plan-review',slice_id:'VNEXT-PRE-4',repository:f.request.repository,issue_number:999},repo.cwd);
 repo.git('update-ref','refs/remotes/origin/plan/pre4-test',source);repo.git('checkout','--detach',base);
 const file='.github/orchestration/requests/vnext-agent/'+request.contract_hash+'.json';B.write(path.join(repo.cwd,file),request);repo.git('add','.');repo.git('commit','-m','TEST main request alone');const requestCommit=repo.git('rev-parse','HEAD');
 assert.throws(()=>repo.git('merge-base','--is-ancestor',source,requestCommit));
 let calls=0;const adapter=Agent.adapterFor(request,repo.cwd,{invoke:()=>{calls++;return JSON.stringify({type:'result',session_id:'TEST',structured_output:{native_assessment_observations:[],semantic_review:require('./helpers/review-attestation-fixture').semantic(produced.artifacts.reviewContext,[])}});}});
 const options={...f.options,cwd:repo.cwd,repository:request.repository,adapter,priorAttempt:()=>false};
 const result=Agent.executeRequest(requestCommit,file,options);assert.equal(repo.git('rev-parse','HEAD'),source);assert.equal(result.verdict,'APPROVE');assert.equal(calls,1);
 repo.git('checkout','--detach',requestCommit);Agent.executeRequest(requestCommit,file,options);assert.equal(calls,1);
 assert.equal(Agent.verify(request,f.options.outputDirectory,{cwd:repo.cwd}).verdict,'APPROVE');
});
