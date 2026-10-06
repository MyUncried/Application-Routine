#!/usr/bin/env node
'use strict';
// Actual Claude sessions on an explicitly disposable fixture, in the existing
// VNEXT-12 campaign. It does not certify native pixels or application delivery.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const V=require('./lib/vnext-contract'),F=require('./lib/vnext-figma-source'),Launch=require('./lib/vnext-figma-launch'),Chain=require('./lib/vnext-live-chain'),Recipe=require('./lib/vnext-figma-recipe'),Review=require('./lib/vnext-figma-implementation-review'),Adapter=require('./lib/vnext-legacy-queue-adapter');
const GitIntegrity=require('./lib/git-runtime-integrity'),Lock=require('./lib/execution-lock');
const Functional=require('./lib/vnext-disposable-functional-contract');
const ROOT='.github/orchestration/vnext12/VNEXT-12-QUALIF';
const CAMPAIGN='628b3349-88b4-4bf1-be6b-50bc09e7d245';
const BINDING={decision:'CREATE',justification:'CREATE refers only to the new toggle() behaviour/export, not a new file or replacement module. MODIFY the existing Screen file and preserve its Existing import/re-export from the unchanged shared dependency.'};
const SCREEN='src/features/example/Screen.js',TEST='tests/ui.test.js',KEEP='src/shared/ui/Existing.js';
const DOCUMENT='Selection toggles off to on and on to off. In this disposable protocol test, selection is the observable Boolean returned by Screen.toggle(), initially off; it is not a rendered chip selection and certifies no production interaction.\n';
const DOCUMENTARY_STATES=[{state_id:'STATE-1',origin:'DOCUMENT_ONLY',disposition:'REQUIRED',expected:DOCUMENT.trim(),reason:'Boolean toggle observable defined exclusively in docs/spec.md for the disposable driver; not a Figma chip state.',scenarios:[{scenario_id:'toggle-off-on',given:'Selection is off',when:'Activate the toggle',then:'Selection is on',proof_required:['FUNCTIONAL_TEST']},{scenario_id:'toggle-on-off',given:'Selection is on',when:'Activate the toggle again',then:'Selection is off',proof_required:['FUNCTIONAL_TEST']}]}];
const QUALIFICATION_CONTRACT={
 preservation_constraint:'Keep the Existing import and re-export in '+SCREEN+' identical to the export from '+KEEP+'.',
 observer_constraint:'This disposable test is functional only. Screen exports Existing and toggle() as CommonJS. Only Screen.js and tests/ui.test.js may change. Orchestration executes the delivered Node test and independently calls toggle twice in a fresh Node process. No render(), HTML, browser, geometry, screenshots or automatic visual comparison is required. Visual acceptance belongs exclusively to the user; this run does not certify it.',
 preservation_test_expected:Functional.EXPECTED,
 visual_proof_expected:'NOT_APPLICABLE_FOR_PROTOCOL_TEST: no automatic or human visual gate. User visual verification concerns actual product development only.',
 visual_test_expected:'NOT_EXECUTED: no automatic rendering test is authorized.',
 residual_risks:['This run certifies only the documentary Boolean transitions and preserved shared export, not any Figma appearance or product interaction.','Visual validation is reserved exclusively to the user and is not claimed PASS by this functional run.','Delivered tests and independent Node transition observations are distinct execution facts.','The full frozen Figma inventory remains context, not a set of automatically certified visual properties.'],
 documentary_subject:SCREEN+'#toggle() return value',
};
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const NEGATIVE_FUNCTIONAL_FAULT='\n// VNEXT_DISPOSABLE_FUNCTIONAL_FAULT_BEGIN\nmodule.exports.toggle = () => false;\n// VNEXT_DISPOSABLE_FUNCTIONAL_FAULT_END\n';
function seal(p){const x=structuredClone(p);delete x.contract_hash;return V.sealContract(x);}
function scopedPacket(observed,doc){
 const p=structuredClone(observed);
 p.documents=[doc];p.frames=p.frames.map((f,i)=>({...f,state_id:'STATE-'+(i+1)}));
 p.states=Launch.documentStates([doc]);
 p.conflicts=[];
 for(const d of p.decisions){d.document_ids=[doc.document_id];d.disposition='OBSERVED_ONLY';d.rule=null;d.reason='Frozen Figma context retained. Automatic rendering controls removed by user instruction; visual validation belongs exclusively to the user and is not certified by this functional run.';}
 return seal(p);
}
function capture(packet,scope){return {launch_id:scope.launch_id,file_key:packet.file_key,captured_at:packet.captured_at,frames:packet.frames,inventories:[{end:true,count:packet.nodes.length,rows:packet.nodes.map(n=>[n.id,n.parent_id,n.type,n.name])}],batches:[{end:true,requested_ids:packet.nodes.map(n=>n.id),rows:packet.nodes.map(n=>({id:n.id,child_ids:n.child_ids,properties:n.properties}))}],variables:packet.variables,collections:packet.collections,resources:packet.resources};}
function validateConfig(c){
 if(c.stage!=='FIGMA_INITIAL'||c.campaign_id!==CAMPAIGN||c.slice_id!=='VNEXT-12-QUALIF'||c.revision_limit!==1||c.pre1_in_scope!==false||c.final_audit_authorized!==false||c.authorization_basis!=='CODEX_USER_DELEGATION_TASK2_DISPOSABLE_ONLY'||c.human_review_performed!==false)V.fail('VNEXT_FIGMA_REAL_CONFIG_REFUSED');
 V.assertSha40(c.approved_protocol_head,'VNEXT_FIGMA_REAL_QUALIFIED_HEAD_REQUIRED');
 if(!/^[1-9][0-9]*$/.test(String(c.qualification_run_id))||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(c.request_id||''))V.fail('VNEXT_FIGMA_REAL_REQUEST_REQUIRED');
 return c;
}
function claimRequest(config,{cwd,env=process.env,read,stateRoot}={}){
 validateConfig(config);
 if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!=='MyUncried/Application-Routine'||env.GITHUB_RUN_ATTEMPT!=='1'||!env.EXPECTED_RUNNER_NAME||env.RUNNER_NAME!==env.EXPECTED_RUNNER_NAME)V.fail('VNEXT_FIGMA_REAL_RUNNER_CONTEXT_REFUSED');
 const head=Chain.command('git',['rev-parse','HEAD'],cwd).trim();
 if(env.KODJO_FIGMA_CONTROLLER_HEAD!==head)V.fail('VNEXT_FIGMA_REAL_CONTROLLER_HEAD_MISMATCH');
 const Q=require('./lib/vnext-github-qualification'),get=read||Q.readGithub;
 if(get('repos/MyUncried/Application-Routine/pulls/269').head?.sha!==head)V.fail('VNEXT_FIGMA_REAL_REMOTE_HEAD_MOVED');
 const qualifications=Q.verifyExecutionQualifications(config,{cwd,controllerHead:head,read:get});
 const directory=path.join(stateRoot||path.join(os.homedir(),'.kodjo-vnext12'),CAMPAIGN,'figma',config.request_id);fs.mkdirSync(directory,{recursive:true});
 const claim={campaign_id:CAMPAIGN,request_id:config.request_id,controller_head:head,qualified_head:config.approved_protocol_head,run_id:env.GITHUB_RUN_ID,run_attempt:env.GITHUB_RUN_ATTEMPT,qualifications,started_at:new Date().toISOString()};
 const fd=fs.openSync(path.join(directory,'started.json'),'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify(claim,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 return {directory,claim};
}
function preserveFixture(f,output){
 const git=(...args)=>Chain.command('git',GitIntegrity.safeArgs(args),f.cwd).trim();
 const bundle=path.join(output,'delivery.bundle');git('bundle','create',bundle,'--all');git('bundle','verify',bundle);
 const files=[SCREEN,TEST,KEEP,f.packetPath].map(file=>({file,sha256:digest(fs.readFileSync(path.join(f.cwd,file)))}));
 fs.writeFileSync(path.join(output,'working-delta.patch'),git('diff','HEAD','--binary')+'\n',{flag:'wx'});
 for(const [name,file] of [['delivered-screen.js',SCREEN],['delivered-test.js',TEST]])fs.writeFileSync(path.join(output,name),fs.readFileSync(path.join(f.cwd,file)),{flag:'wx'});
 const evidence={head:git('rev-parse','HEAD'),bundle_sha256:digest(fs.readFileSync(bundle)),files,dirty:git('status','--porcelain')};
 fs.writeFileSync(path.join(output,'delivery-preservation.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});return evidence;
}
function invokeClaude(cwd,prompt,directory,role,{write=false}={}){
 fs.mkdirSync(directory,{recursive:true});const config=path.join(directory,'mcp.json'),settings=path.join(directory,'settings.json');fs.writeFileSync(config,JSON.stringify({mcpServers:{}}));fs.writeFileSync(settings,JSON.stringify({disableAllHooks:true}));
 const env={...process.env};for(const k of ['GH_TOKEN','GITHUB_TOKEN','KODJO_LIVE_GH_TOKEN'])delete env[k];
 const args=['--add-dir',path.resolve(directory,'..','implementation-references'),'--add-dir',path.resolve(directory,'..'),'-p','--restricted','--permission-mode','dontAsk','--permission-prompts','none','--output-format','json','--tools',write?'Read,Edit,Write,Glob,Grep':'Read,Glob,Grep','--allowedTools',write?'Read,Edit,Write,Glob,Grep':'Read,Glob,Grep','--disallowedTools','mcp__*,Bash','--strict-mcp-config','--mcp-config',config,'--settings',settings];
 fs.writeFileSync(path.join(directory,'prompt.json'),JSON.stringify(prompt,null,2)+'\n');
 const raw=Chain.command(require('./lib/claude-local').resolveClaudeBinary(),args,cwd,JSON.stringify(prompt),env,Chain.CLAUDE_TIMEOUT_MS,{onResult:r=>{fs.writeFileSync(path.join(directory,'process.json'),JSON.stringify(r,null,2)+'\n',{flag:'wx'});fs.writeFileSync(path.join(directory,'response.json'),r.stdout||'',{flag:'wx'});}});
 const response=JSON.parse(raw);if(response.type!=='result'||response.is_error||!response.session_id)throw Error('VNEXT_FIGMA_REAL_CLAUDE_RESULT_INVALID:'+role);return {session_id:response.session_id,raw_response_sha256:V.sha256(raw),role};
}
function observe(f,packet,dir,nodeTestReceipt){
 const actual=Functional.observe(f.cwd,Chain.command);
 if(nodeTestReceipt){
  if(nodeTestReceipt.status!=='PASS'||nodeTestReceipt.exit_code!==0||nodeTestReceipt.test_path!==TEST)throw Error('VNEXT_FUNCTIONAL_GATE_RECEIPT_INVALID');
  for(const p of [SCREEN,TEST])if(nodeTestReceipt.source_sha256[p]!==digest(fs.readFileSync(path.join(f.cwd,p))))throw Error('VNEXT_FUNCTIONAL_GATE_RECEIPT_SOURCE_DRIFT');
  if(nodeTestReceipt.contract_id!==Functional.ID||nodeTestReceipt.preservation_probe?.status!=='PASS'||nodeTestReceipt.preservation_probe.normal_identity!==true||nodeTestReceipt.preservation_probe.sentinel_identity!==true)throw Error('VNEXT_FUNCTIONAL_PRESERVATION_RECEIPT_INVALID');
  if(nodeTestReceipt.source_sha256[KEEP]!==digest(fs.readFileSync(path.join(f.cwd,KEEP))))throw Error('VNEXT_FUNCTIONAL_GATE_RECEIPT_SOURCE_DRIFT');
  actual.node_test_receipt=nodeTestReceipt;
 }
 const content=JSON.stringify(actual);
 fs.writeFileSync(path.join(dir,'execution.json'),content,{flag:'wx'});
 const artifact={artifact_path:'execution.json',artifact_sha256:digest(Buffer.from(content)),observer:'EXECUTED_JSON_FACT',delivery_head:f.git('rev-parse','HEAD')};
 return {measurements:[],scenarioResults:packet.states.filter(s=>s.disposition==='REQUIRED').flatMap(s=>s.scenarios.map(s=>({...artifact,scenario_id:s.scenario_id,reference_hash:packet.contract_hash,status:actual.scenarios[s.scenario_id]?'PASS':'FAIL',value:actual.scenarios[s.scenario_id],value_path:['scenarios',s.scenario_id],proof_results:s.proof_required.map(proof_type=>({proof_type,status:actual.scenarios[s.scenario_id]?'PASS':'FAIL'}))})))};
}
const preservedExportAssertion=Functional.preservation;
function assertPreservedExport(cwd){
 return Functional.preserve(cwd,Chain.command);
}
function assertDelta(f,beforeKeep){if(f.gitIntegrity&&GitIntegrity.compare(f.gitIntegrity,GitIntegrity.snapshot(f.cwd)).length)throw Error('VNEXT_FIGMA_REAL_GIT_METADATA_CHANGED');const changed=f.git('diff','--name-only','HEAD').split('\n').filter(Boolean);if(changed.some(p=>![SCREEN,TEST].includes(p))||f.git('ls-files','--others','--exclude-standard'))throw Error('VNEXT_FIGMA_REAL_WRITE_SCOPE_REFUSED');if(digest(fs.readFileSync(path.join(f.cwd,KEEP)))!==beforeKeep)throw Error('VNEXT_FIGMA_REAL_PRESERVATION_FAILED');return assertPreservedExport(f.cwd);}
function runDeliveredTests(f,beforeKeep,receiptPath){
 const paths=[SCREEN,TEST,KEEP],sources=Object.fromEntries(paths.map(p=>[p,digest(fs.readFileSync(path.join(f.cwd,p)))]));
 const receipt={contract_id:Functional.ID,test_path:TEST,command:[process.execPath,TEST],source_sha256:sources,started_at:new Date().toISOString(),status:'FAIL',scenario_status_source:'ISOLATED_NODE_TRANSITIONS',role:'SEPARATE_NODE_GATE_NOT_PER_SCENARIO_OUTPUT'};
 try{
  const output=Chain.command(process.execPath,[TEST],f.cwd);receipt.preservation_probe=assertDelta(f,beforeKeep);
  for(const p of paths)if(digest(fs.readFileSync(path.join(f.cwd,p)))!==sources[p])throw Error('VNEXT_FIGMA_REAL_TEST_SOURCE_CHANGED:'+p);
  receipt.exit_code=0;receipt.stdout_sha256=digest(output);receipt.status='PASS';return receipt;
 }catch(error){receipt.diagnostic=error.message;throw error;}
 finally{receipt.completed_at=new Date().toISOString();if(receiptPath){const relative=path.relative(f.cwd,path.resolve(receiptPath));if(!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative))throw Error('VNEXT_FIGMA_REAL_TEST_RECEIPT_INSIDE_CHECKOUT');fs.writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});}}
}
function compare(f,packet,plan,dir,nodeTestReceipt,{negativeProbe=false}={}){if(!nodeTestReceipt&&!negativeProbe)throw Error("VNEXT_FUNCTIONAL_GATE_RECEIPT_REQUIRED");fs.mkdirSync(dir,{recursive:true});const observations=observe(f,packet,dir,nodeTestReceipt);if(negativeProbe&&observations.scenarioResults.every(s=>s.status==='PASS'))throw Error("VNEXT_FUNCTIONAL_NEGATIVE_FAILURE_REQUIRED");const options={cwd:f.cwd,approvedPlanSha256:V.sha256(plan),deliveryHead:f.git('rev-parse','HEAD'),evidenceDirectory:dir,...observations};Review.prepare(plan,options);return options;}
async function initial(output){
 const original=JSON.parse(fs.readFileSync(ROOT+'/v8-consolidation/figma-zones/frozen-source.json','utf8'));F.validate(original,{ready:true});
 // Reuse only the established disposable scaffold. No injected reviewer,
 // approval, or implementation function is used in this real benchmark.
 const f=require('../../tests/kodjo/helpers/vnext-figma-fixture').fixture({launchMode:true,documentContent:DOCUMENT,documentaryStates:DOCUMENTARY_STATES,transformPacket:p=>scopedPacket(original,p.documents[0])});
 let status={campaign_id:CAMPAIGN,stage:'FIGMA_INITIAL',status:'STARTED',code_head:Chain.command('git',['rev-parse','HEAD'],process.cwd()).trim(),live_figma_acquisition:'NOT_EXERCISED_FROZEN_GIT_CAPTURE_REPLAY',human_review_performed:false,application_published:false};
 const save=(name,data)=>fs.writeFileSync(path.join(output,name),JSON.stringify(data,null,2)+'\n');
 try{
  const scope={slice_id:'VNEXT-12-QUALIF',launch_id:'figma-real-'+crypto.randomUUID(),file_key:f.snapshot.file_key,frames:f.snapshot.frames,documents:f.snapshot.documents};
  const checkpoint=await Launch.launch(scope,{capture:s=>capture(f.snapshot,s),reconcile:(raw,documents)=>({...raw,documents,states:f.snapshot.states,decisions:f.snapshot.decisions,conflicts:[]}),persist:()=>({revision:f.head,path:f.packetPath,content:Chain.readGit(f.cwd,f.head,f.packetPath)})});save('launch.json',checkpoint);
  const intent='Disposable functional protocol test: preserve Existing in '+SCREEN+' and implement toggle(), initially off, returning true then false on two successive calls. Deliver '+TEST+' with the declared isolated toggle and shared-export tests. Only these two files may change; no dependencies. Do not implement render(), HTML or visual checks. Frozen Figma assets remain source context only; visual validation belongs exclusively to the user.';
  const recipe=Recipe.build(f.cwd,checkpoint,{applicationPath:SCREEN,testPath:TEST,componentPath:KEEP,componentBinding:BINDING,qualificationContract:QUALIFICATION_CONTRACT,scenarioPropertyType:'STATE',observationIntent:'Orchestration executes the delivered Node test and observes both documentary Boolean transitions in a fresh Node process. Visual validation is exclusively human and is not certified here.',issueId:'github_issue:MyUncried/Application-Routine#269',intent,executionContext:{mode:'LOCAL',writer_id:'CLAUDE:figma-disposable'}});
  const produced=Chain.produce(recipe,{cwd:f.cwd});save('produced.json',produced);const receipt=Chain.reviewOrRecover(produced,{cwd:f.cwd,evidenceDirectory:path.join(output,'plan-review')});save('plan-review.json',receipt);Chain.validateReceipt(produced,receipt);
  const a=produced.artifacts,plan=Adapter.renderCompatibilityPlan({application_head:a.planningEnvelope.application_head,plan_contract_hash:a.planContract.contract_hash},a.planContract,a.uiAtomicityContract,a.requirementRegistry,a.candidateManifest);fs.writeFileSync(path.join(output,'approved-plan.md'),plan);
  const references=path.join(output,'implementation-references');fs.mkdirSync(references);const observed=F.consume(plan,references,'IMPLEMENTER');save('implementation-observation.json',observed);
  const keep=digest(fs.readFileSync(path.join(f.cwd,KEEP)));f.gitIntegrity=GitIntegrity.snapshot(f.cwd);const immutable=[path.join(output,'approved-plan.md'),...observed.references.flatMap(r=>r.assets.map(a=>a.path))].map(file=>({file,sha256:digest(fs.readFileSync(file))}));
  const verifyReferences=()=>{for(const row of immutable)if(digest(fs.readFileSync(row.file))!==row.sha256)throw Error('VNEXT_FIGMA_REAL_APPROVED_REFERENCE_CHANGED');};
  status.implementation=invokeClaude(f.cwd,{instructions:intent+' Read every referenced PNG/SVG asset and the fixed property manifest. Execute no commands; the trusted driver executes checks after your edits.',approved_plan:path.join(output,'approved-plan.md'),figma_observation:observed},path.join(output,'implementation'),'INITIAL_IMPLEMENTATION',{write:true});verifyReferences();assertDelta(f,keep);
  const initialGate=runDeliveredTests(f,keep,path.join(output,'functional-test-initial.json'));f.git('add',SCREEN,TEST);f.git('commit','-m','Disposable functional initial implementation');
  const options=compare(f,f.snapshot,plan,path.join(output,'initial-review'),initialGate);const implementationReview=Review.review(plan,options);save('initial-review.json',implementationReview);if(implementationReview.assessment.verdict!=='APPROVE')throw Error('VNEXT_FIGMA_REAL_INITIAL_REVISE');
  fs.writeFileSync(path.join(output,'initial-screen.js'),fs.readFileSync(path.join(f.cwd,SCREEN)));fs.writeFileSync(path.join(output,'initial-test.js'),fs.readFileSync(path.join(f.cwd,TEST)));
  // Explicit functional fault injection demonstrates the transition gate. It is not an
  // application defect and no reviewer verdict is manufactured.
  fs.appendFileSync(path.join(f.cwd,SCREEN),NEGATIVE_FUNCTIONAL_FAULT);
  let rejection;try{compare(f,f.snapshot,plan,path.join(output,'negative-review'),undefined,{negativeProbe:true});}catch(e){rejection=e.message;}if(!rejection||!rejection.includes('SCENARIO_NOT_PASSED'))throw Error('VNEXT_FIGMA_REAL_NEGATIVE_NOT_REFUSED');save('negative.json',{fault_injection:true,diagnostic:rejection,model_approval_fabricated:false});
  status.correction=invokeClaude(f.cwd,{instructions:'One causal correction only: remove the injected block between VNEXT_DISPOSABLE_FUNCTIONAL_FAULT_BEGIN and VNEXT_DISPOSABLE_FUNCTIONAL_FAULT_END at the end of '+SCREEN+', including markers and leading separator newline. It forces toggle() to return false. Preserve the exact preceding implementation bytes and test. Do not rewrite the initial implementation.',approved_plan:path.join(output,'approved-plan.md'),diagnostic:rejection},path.join(output,'correction'),'BOUNDED_CORRECTION',{write:true});verifyReferences();assertDelta(f,keep);runDeliveredTests(f,keep,path.join(output,'functional-test-corrected.json'));
  if(!fs.readFileSync(path.join(f.cwd,SCREEN)).equals(fs.readFileSync(path.join(output,'initial-screen.js'))))throw Error('VNEXT_FIGMA_REAL_CORRECTION_PRESERVATION_FAILED');
  const corrected=Review.review(plan,compare(f,f.snapshot,plan,path.join(output,'corrected-review'),JSON.parse(fs.readFileSync(path.join(output,'functional-test-corrected.json'),'utf8'))));save('corrected-review.json',corrected);if(corrected.assessment.verdict!=='APPROVE')throw Error('VNEXT_FIGMA_REAL_CORRECTION_REVISE');
  status.delivery_head=f.git('rev-parse','HEAD');status.approved_plan_sha256=V.sha256(plan);status.reference_hash=f.snapshot.contract_hash;status.preservation_sha256=keep;status.acceptance_target_hash=V.canonicalHash({campaign_id:CAMPAIGN,delivery_head:status.delivery_head,approved_plan_sha256:status.approved_plan_sha256,reference_hash:status.reference_hash});status.visual_validation='NOT_EXECUTED_USER_ONLY';status.status='INITIAL_AND_CORRECTION_PASS_AWAITING_OWNER_TECHNICAL_ACCEPTANCE';
 }catch(e){status.status='FAILED';status.diagnostic=e.message;throw e;}finally{
  try{status.preserved_delivery=preserveFixture(f,output);f.cleanup();status.disposable_cleanup=true;}catch(e){status.preservation_error=e.message;status.disposable_cleanup=false;status.retained_fixture=f.cwd;status.status='EVIDENCE_PRESERVATION_FAILED';throw e;}finally{save('status.json',status);}
 }
}
async function precheck(output){
 const original=JSON.parse(fs.readFileSync(ROOT+'/v8-consolidation/figma-zones/frozen-source.json','utf8'));
 F.validate(original,{ready:true});
 const f=require('../../tests/kodjo/helpers/vnext-figma-fixture').fixture({launchMode:true,documentContent:DOCUMENT,documentaryStates:DOCUMENTARY_STATES,transformPacket:p=>scopedPacket(original,p.documents[0])});
 try{
  const scope={slice_id:'VNEXT-12-QUALIF',launch_id:'local-precheck',file_key:f.snapshot.file_key,frames:f.snapshot.frames,documents:f.snapshot.documents};
  const produced=await Chain.launchAndProduce(scope,{
   cwd:f.cwd,capture:s=>capture(f.snapshot,s),reconcile:(raw,documents)=>({...raw,documents,states:Launch.documentStates(documents),decisions:f.snapshot.decisions,conflicts:[]}),
   persist:()=>({revision:f.head,path:f.packetPath,content:Chain.readGit(f.cwd,f.head,f.packetPath)}),
   buildRecipe:c=>Recipe.build(f.cwd,c,{applicationPath:SCREEN,testPath:TEST,componentPath:KEEP,componentBinding:BINDING,qualificationContract:QUALIFICATION_CONTRACT,scenarioPropertyType:'STATE',observationIntent:'Orchestration executes the delivered Node test and observes both documentary Boolean transitions in a fresh Node process. Visual validation is exclusively human and is not certified here.',issueId:'github_issue:MyUncried/Application-Routine#269',intent:'Local contract precheck of the declared disposable code and test mapping.',executionContext:{mode:'LOCAL',writer_id:'CLAUDE:figma-disposable'}})
  });
  Chain.verifyProduced(produced,f.cwd);
  const source=produced.artifacts.planningEnvelope.source_manifest.sources.find(s=>s.source_kind==='FIGMA'),bytes=Chain.readGit(f.cwd,source.revision,source.locator.slice(15));
  const result={status:'LOCAL_PRECHECK_PASS',campaign_id:CAMPAIGN,revision:source.revision,source_sha256:source.fingerprint,observed_sha256:V.sha256(bytes),byte_length:Buffer.byteLength(bytes),reference_hash:produced.figma_launch.reference_hash,requirements:produced.artifacts.requirementRegistry.requirements.length,assertions:produced.artifacts.uiAtomicityContract.criteria.reduce((n,c)=>n+c.assertions.length,0),scenario_ids:produced.figma_launch.scenario_ids,real_model_calls:0,live_figma_acquisition:false,native_certification:false};
  if(output)fs.writeFileSync(path.join(output,'precheck.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  return result;
 }finally{f.cleanup();}
}
async function main(){
 const [stage,output,requestFile]=process.argv.slice(2);if(!['precheck','initial'].includes(stage)||!output)throw Error('USAGE: qualify-vnext-figma-real-path <precheck|initial> <external-evidence-directory> [request.json]');
 const directory=path.resolve(output),rel=path.relative(fs.realpathSync(process.cwd()),directory);if(!rel||(!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel)))throw Error('VNEXT_FIGMA_REAL_EVIDENCE_OUTSIDE_CHECKOUT_REQUIRED');
 if(fs.existsSync(directory)&&fs.readdirSync(directory).length)throw Error('VNEXT_FIGMA_REAL_EVIDENCE_ALREADY_EXISTS');fs.mkdirSync(directory,{recursive:true});
 if(stage==='precheck'){process.stdout.write(JSON.stringify(await precheck(directory))+'\n');return;}
 if(process.platform!=='win32'||!requestFile)throw Error('VNEXT_FIGMA_REAL_WINDOWS_REQUEST_REQUIRED');
 if(Lock.claudeProcessState().state!=='NONE')throw Error('VNEXT_FIGMA_REAL_OTHER_CLAUDE_ACTIVE_OR_AMBIGUOUS');
 const request=JSON.parse(fs.readFileSync(requestFile,'utf8')),claimed=claimRequest(request,{cwd:process.cwd()});
 for(const key of ['GH_TOKEN','GITHUB_TOKEN','KODJO_LIVE_GH_TOKEN','KODJO_VNEXT_CONSUMPTION_TOKEN'])delete process.env[key];
 fs.writeFileSync(path.join(directory,'qualification-admission.json'),JSON.stringify(claimed.claim,null,2)+'\n',{flag:'wx'});
 const lock=Lock.acquire(path.join(claimed.directory,'execution.lock'),{request_id:request.request_id,run_id:process.env.GITHUB_RUN_ID,github_run_attempt:process.env.GITHUB_RUN_ATTEMPT});
 try{await initial(directory);}finally{Lock.release(lock);if(fs.existsSync(path.join(directory,'status.json')))fs.copyFileSync(path.join(directory,'status.json'),path.join(claimed.directory,'terminal-status.json'));}
}

if(require.main===module)main().catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});
module.exports={DOCUMENT,BINDING,DOCUMENTARY_STATES,runDeliveredTests,scopedPacket,capture,observe,assertDelta,assertPreservedExport,preservedExportAssertion,compare,initial,precheck,invokeClaude,validateConfig,claimRequest,preserveFixture,QUALIFICATION_CONTRACT,NEGATIVE_FUNCTIONAL_FAULT};
