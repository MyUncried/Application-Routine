#!/usr/bin/env node
'use strict';
// Actual Claude sessions on an explicitly disposable fixture, in the existing
// VNEXT-12 campaign. It does not certify native pixels or application delivery.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const V=require('./lib/vnext-contract'),F=require('./lib/vnext-figma-source'),Launch=require('./lib/vnext-figma-launch'),Chain=require('./lib/vnext-live-chain'),Recipe=require('./lib/vnext-figma-recipe'),Review=require('./lib/vnext-figma-implementation-review'),Adapter=require('./lib/vnext-legacy-queue-adapter');
const GitIntegrity=require('./lib/git-runtime-integrity'),Lock=require('./lib/execution-lock');
const ROOT='.github/orchestration/vnext12/VNEXT-12-QUALIF';
const CAMPAIGN='628b3349-88b4-4bf1-be6b-50bc09e7d245';
const Browser=require('./lib/vnext-figma-browser-observer');
const BINDING={decision:'CREATE',justification:'Create the disposable render surface in the declared application path; the unchanged Existing Boolean export is a preserved dependency, not an extendable UI component.'};
const SCREEN='src/features/example/Screen.js',TEST='tests/ui.test.js',KEEP='src/shared/ui/Existing.js';
const DOCUMENT='Selection toggles off to on and on to off. In this disposable protocol test, selection is the observable Boolean returned by Screen.toggle(), initially off; it is not a rendered chip selection and certifies no production interaction.\n';
const DOCUMENTARY_STATES=[{state_id:'STATE-1',origin:'DOCUMENT_ONLY',disposition:'REQUIRED',expected:DOCUMENT.trim(),reason:'Boolean toggle observable defined exclusively in docs/spec.md for the disposable driver; not a Figma chip state.',scenarios:[{scenario_id:'toggle-off-on',given:'Selection is off',when:'Activate the toggle',then:'Selection is on',proof_required:['FUNCTIONAL_TEST']},{scenario_id:'toggle-on-off',given:'Selection is on',when:'Activate the toggle again',then:'Selection is off',proof_required:['FUNCTIONAL_TEST']}]}];
const QUALIFICATION_CONTRACT={
 preservation_constraint:'Keep the Existing import and re-export in '+SCREEN+'; its value must remain identical to the Existing export of '+KEEP+'.',
 observer_constraint:'Orchestration supplies the independent browser observer scripts/kodjo/lib/vnext-figma-browser-observer.js, its generated rendered.html host page, and the two-viewport driver scripts/kodjo/qualify-vnext-figma-real-path.js outside application write_scope. These require no implementer writes. Evidence is deposited under the external run evidence directory in initial-review/, negative-review/ and corrected-review/; each contains rendered.png, rendered.html, browser-facts.json and independent-viewport/rendered.png, independent-viewport/rendered.html plus independent-viewport/browser-facts.json. The implementation exports render() from '+SCREEN+' with zero arguments returning an HTML string with data-figma-id="4478:7209" on the measured frame and data-figma-id="4953:6611" on the title. These attributes are the sole selectors used by the observer and fault injector. Screen.js must remain browser-evaluable CommonJS using module.exports, with no ES-module import/export syntax, no Node-only globals such as process or __dirname, and no require other than ../../shared/ui/Existing or ../../shared/ui/Existing.js. The observer evaluates its raw bytes in a classic browser script with only that shared-module require shim; tests/ui.test.js instead executes in Node and may use Node builtins for the declared isolated checks. The three requirement change items compose one modification of Screen.js exporting Existing, render and toggle together; no item excludes the other declared requirements. The documentary requirement delivers tests/ui.test.js for render availability, preservation and toggle checks once per isolated subprocess. The visual requirements have no implementer-authored application test: their justified alternative is the trusted external browser comparison with VISUAL_COMPARE as the sole visual proof. The certified visual properties are the actual rendered frame width and height and exact title textContent. CSS placement and the internal title DOM structure are implementation choices, not certified properties. No inline-style or single-text-child shape is required. Title containment is not required or certified in this three-property disposable scope. The implementation must not export or execute any adjustment to the independent observer or its measurements. Geometry is fixed 402px by 874px at both 402x874 and 503x971 viewports.',
 preservation_test_expected:'In a dedicated isolated child Node process, load Screen freshly, call render() with zero arguments and assert typeof its returned value is string. Verify the normal Existing value, then clear require.cache for '+KEEP+' and '+SCREEN+', require the shared module, replace its cached Existing export with a fresh unique object sentinel S, re-require Screen and assert Screen.Existing === S by reference identity. Restore both cache entries in finally. Run the sentinel block once in an isolated child Node process, independently of render and toggle assertions. In a separate isolated child Node process, load Screen freshly, call toggle exactly twice on that same instance: first true, then false. Launch both subprocesses with inline source, for example execFileSync(process.execPath, ["-e", source]); create no helper files or directories inside the checkout. The test must not modify its own source or Screen source: orchestration checks their hashes before and after execution. Orchestration repeats the complete write-scope and preservation checks after test execution. Neither block may share module registry or selection state with another block; their order must not affect results. The execution proves these assertions on the delivered implementation; it does not certify their ability to reject every incorrect implementation.',
 visual_proof_expected:'The render() result must identify the measured frame with data-figma-id="4478:7209" and the title with data-figma-id="4953:6611"; the observer resolves both solely through these attributes. Screen.js executes as browser-evaluable CommonJS with only the declared Existing import and module.exports, without Node globals or ES-module syntax. Orchestration must measure unadjusted getBoundingClientRect of frame 4478:7209: width=402 and height=874, tolerance 0, at BOTH viewport 402x874 AND independent viewport 503x971, and exact title text Zones corporelles for element 4953:6611 at both. Retain rendered.png, rendered.html and browser-facts.json at each viewport. Orchestration must capture the exact render() string once at mount time and record its SHA-256, the SHA-256 of the generated host and of the document resource actually loaded by the browser, and both canonical DOM fragment hashes. Require loaded-document hash equal to generated-host hash and measured-mount hash equal to the canonical DOM generated from the captured render string. Record Screen source SHA-256 and preservation source SHA-256. Raw render and host hashes have different domains and must not be equated. The orchestration-owned observer computes the comparisons. Screen implementation bytes execute in the same JavaScript realm as DOM measurement and canonicalisation; realm-level tampering is forbidden by the implementation constraint, not structurally prevented. These measurements do not certify resistance to malicious prototype or DOM-accessor patches. Equality at the required viewport alone is insufficient. The second viewport is a falsification condition on the delivery, not a change to the Figma source viewports.',
 visual_test_expected:'Execute Screen.render() and assert that its returned value is a string. Execute the shared preservation checks and the two documentary toggle transitions in their isolated subprocesses. This functional execution does not inspect HTML declarations or certify rendered geometry or title structure. The independent browser VISUAL_COMPARE proof measures exact frame dimensions and title textContent at both viewports.',
 residual_risks:['Scenario FUNCTIONAL_TEST results in execution.json are produced by the external browser calling toggle twice. tests/ui.test.js is a separate Node gate for the required render, preservation and toggle assertions; its execution receipt records the declared target test path, exact source hashes and exit status. Browser scenario statuses are not per-scenario output emitted by that Node test.','Implementation and measurement execute in the same browser JavaScript realm. Tampering with measurement primitives is prohibited by contract rather than prevented by isolation; resistance to such tampering is not certified.','The delivered tests are executed on the delivered implementation; their ability to reject invalid variants is not certified. The injected width fault proves refusal by the independent browser measurement gate, not mutation coverage of the delivered tests.','CSS declaration placement, box-model choices and title child-node structure are not certified; only actual rendered dimensions and exact textContent are visual targets.','Figma logical pt and browser CSS px are mapped one-to-one only in this disposable qualification; no general unit conversion is certified.','Browser geometry and screenshots do not certify a native device.','Selection is limited to the exported Boolean transition of Screen.toggle(); rendered chip selection, colours and production interaction are outside this disposable qualification. Figma chip component set 3302:4166 and selected instances 4953:6620 and 4953:6625 are explicitly not realized or certified. STATE-1 is DOCUMENT_ONLY; its packet binding transports the markdown inventory and does not assert Figma provenance.'],
 documentary_subject:SCREEN+'#toggle() return value',
};
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function negativeRenderFault(frameId='4478:7209'){
 const inject=function(html,id){
  let changed=false;
  const output=html.replace(/<[^>]+>/g,tag=>{
   if(changed||!Array.from(tag.matchAll(/\bdata-figma-id\s*=\s*(["'])(.*?)\1/g)).some(m=>m[2]===id))return tag;
   changed=true;
   const stripped=tag.replace(/\s+style\s*=\s*(["'])[\s\S]*?\1/gi,'');
   return stripped.replace(/>$/, ' style="width:403px!important;height:874px!important;box-sizing:border-box!important;border:0!important;padding:0!important">');
  });
  if(!changed)throw Error('VNEXT_FIGMA_REAL_FAULT_TARGET_MISSING');
  return output;
 };
 return '\n// VNEXT_DISPOSABLE_RENDER_FAULT_BEGIN\nconst beforeInjectedRender = module.exports.render;\nmodule.exports.render = (...args) => ('+inject.toString()+')(beforeInjectedRender(...args), '+JSON.stringify(frameId)+');\n// VNEXT_DISPOSABLE_RENDER_FAULT_END\n';
}
const NEGATIVE_RENDER_FAULT=negativeRenderFault();
function seal(p){const x=structuredClone(p);delete x.contract_hash;return V.sealContract(x);}
function scopedPacket(observed,doc){
 const p=structuredClone(observed),keys=[['4478:7209','width'],['4478:7209','height'],['4953:6611','characters']];
 p.documents=[doc];p.frames=p.frames.map((f,i)=>({...f,state_id:'STATE-'+(i+1)}));
 p.states=Launch.documentStates([doc]);
 p.conflicts=[];
 for(const d of p.decisions){d.document_ids=[doc.document_id];if(keys.some(([id,prop])=>d.element_id===id&&d.property===prop)){d.disposition='REALIZE';d.reason='Property explicitly selected for this disposable protocol qualification.';d.rule={kind:'EQUALS',value:p.nodes.find(n=>n.id===d.element_id).properties[d.property],viewports:[402],tolerance:0,unit:d.property==='characters'?'TEXT':'pt'};}else{d.disposition='OBSERVED_ONLY';d.rule=null;d.reason=['4953:6620','4953:6625'].includes(d.element_id)?'Explicit non-realization: this rendered Figma selected chip (component set 3302:4166) is outside the disposable width/height/title scope. The DOCUMENT_ONLY Boolean toggle does not implement or certify this chip state.':'Captured and retained as context outside the three-property disposable scope; not an exemption for product delivery.';}}
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
function observe(f,packet,dir){
 const required=F.required(packet),frame=required.find(d=>d.property==='width'),title=required.find(d=>d.property==='characters');
 if(!frame||!title)throw Error('VNEXT_FIGMA_REAL_RENDER_SUBJECTS_MISSING');
 const browserConfig={screen:path.join(f.cwd,SCREEN),keep:path.join(f.cwd,KEEP),directory:dir,viewport:frame.rule.viewports[0],height:required.find(d=>d.property==='height').rule.value,frameId:frame.element_id,titleId:title.element_id,transitions:[{scenario_id:'toggle-off-on',method:'toggle',expected:true},{scenario_id:'toggle-on-off',method:'toggle',expected:false}]};
 const configPath=path.join(dir,'browser-config.json');fs.writeFileSync(configPath,JSON.stringify(browserConfig));
 const actual=JSON.parse(Chain.command(process.execPath,[path.resolve(__dirname,'lib/vnext-figma-browser-observer.js'),configPath],f.cwd,null,process.env,120000)),values={};
 // Retain the required viewport, then independently exercise a different box.
 // A 100%/100vh implementation must not masquerade as the fixed 402x874 surface.
 const secondary=path.join(dir,'independent-viewport');fs.mkdirSync(secondary);
 const secondaryConfig={...browserConfig,directory:secondary,viewport:browserConfig.viewport+101,height:browserConfig.height+97};
 const secondaryPath=path.join(secondary,'browser-config.json');fs.writeFileSync(secondaryPath,JSON.stringify(secondaryConfig));
 const additional=JSON.parse(Chain.command(process.execPath,[path.resolve(__dirname,'lib/vnext-figma-browser-observer.js'),secondaryPath],f.cwd,null,process.env,120000));
 for(const key of ['width','height','title'])if(additional[key]!==actual[key])throw Error('VNEXT_FIGMA_REAL_FIXED_GEOMETRY_NOT_INDEPENDENT:'+key);
 for(const d of F.required(packet)){const key=d.property==='characters'?'title':d.property;if(!Object.hasOwn(actual,key))throw Error('VNEXT_FIGMA_REAL_RENDER_VALUE_MISSING:'+key);values[d.property_id]=actual[key];}
 const states=actual.scenarios;
 const content=JSON.stringify({values,scenarios:states});fs.writeFileSync(path.join(dir,'execution.json'),content);
 const head=f.git('rev-parse','HEAD'),artifact={artifact_path:'execution.json',artifact_sha256:digest(Buffer.from(content)),observer:'EXECUTED_JSON_FACT',delivery_head:head};
 return {measurements:F.required(packet).flatMap(d=>d.rule.viewports.map(viewport=>({...artifact,measurement_id:d.property_id+'@'+viewport,property_id:d.property_id,reference_hash:packet.contract_hash,viewport,value:values[d.property_id],value_path:['values',d.property_id],evidence:'Measured unadjusted browser DOM bounds and text at the required viewport and confirmed equal fixed geometry at an independent viewport; both screenshots preserved. Browser pixels are not native-device certification.'}))),scenarioResults:packet.states.flatMap(s=>(s.scenarios||[]).map(s=>({...artifact,scenario_id:s.scenario_id,reference_hash:packet.contract_hash,status:states[s.scenario_id]?'PASS':'FAIL',value:states[s.scenario_id],value_path:['scenarios',s.scenario_id],proof_results:s.proof_required.map(proof_type=>({proof_type,status:states[s.scenario_id]?'PASS':'FAIL'}))})))};
}
function preservedExportAssertion(screenPath,keepPath){
 const screenId=require.resolve(screenPath),keepId=require.resolve(keepPath);
 const oldScreen=require.cache[screenId],oldKeep=require.cache[keepId];
 try{
  delete require.cache[screenId];delete require.cache[keepId];
  const shared=require(keepId),normal=require(screenId);
  if(!Object.hasOwn(normal,'Existing')||normal.Existing!==shared.Existing)throw Error('VNEXT_FIGMA_REAL_EXPORT_PRESERVATION_FAILED');
  delete require.cache[screenId];const sentinel={};shared.Existing=sentinel;
  if(require(screenId).Existing!==sentinel)throw Error('VNEXT_FIGMA_REAL_EXPORT_PROVENANCE_FAILED');
 }finally{
  if(oldScreen)require.cache[screenId]=oldScreen;else delete require.cache[screenId];
  if(oldKeep)require.cache[keepId]=oldKeep;else delete require.cache[keepId];
 }
}
function assertPreservedExport(cwd){
 Chain.command(process.execPath,['-e','('+preservedExportAssertion.toString()+')('+JSON.stringify(path.resolve(cwd,SCREEN))+','+JSON.stringify(path.resolve(cwd,KEEP))+');'],cwd);
}
function assertDelta(f,beforeKeep){if(f.gitIntegrity&&GitIntegrity.compare(f.gitIntegrity,GitIntegrity.snapshot(f.cwd)).length)throw Error('VNEXT_FIGMA_REAL_GIT_METADATA_CHANGED');const changed=f.git('diff','--name-only','HEAD').split('\n').filter(Boolean);if(changed.some(p=>![SCREEN,TEST].includes(p))||f.git('ls-files','--others','--exclude-standard'))throw Error('VNEXT_FIGMA_REAL_WRITE_SCOPE_REFUSED');if(digest(fs.readFileSync(path.join(f.cwd,KEEP)))!==beforeKeep)throw Error('VNEXT_FIGMA_REAL_PRESERVATION_FAILED');assertPreservedExport(f.cwd);}
function runDeliveredTests(f,beforeKeep,receiptPath){
 const paths=[SCREEN,TEST],sources=Object.fromEntries(paths.map(p=>[p,digest(fs.readFileSync(path.join(f.cwd,p)))]));
 const receipt={test_path:TEST,command:[process.execPath,TEST],source_sha256:sources,started_at:new Date().toISOString(),status:'FAIL',scenario_status_source:'EXTERNAL_BROWSER_TRANSITIONS',role:'SEPARATE_NODE_GATE_NOT_PER_SCENARIO_OUTPUT'};
 try{
  const output=Chain.command(process.execPath,[TEST],f.cwd);assertDelta(f,beforeKeep);
  for(const p of paths)if(digest(fs.readFileSync(path.join(f.cwd,p)))!==sources[p])throw Error('VNEXT_FIGMA_REAL_TEST_SOURCE_CHANGED:'+p);
  receipt.exit_code=0;receipt.stdout_sha256=digest(output);receipt.status='PASS';return receipt;
 }catch(error){receipt.diagnostic=error.message;throw error;}
 finally{receipt.completed_at=new Date().toISOString();if(receiptPath){const relative=path.relative(f.cwd,path.resolve(receiptPath));if(!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative))throw Error('VNEXT_FIGMA_REAL_TEST_RECEIPT_INSIDE_CHECKOUT');fs.writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});}}
}
function compare(f,packet,plan,dir){fs.mkdirSync(dir,{recursive:true});const observations=observe(f,packet,dir);const options={cwd:f.cwd,approvedPlanSha256:V.sha256(plan),deliveryHead:f.git('rev-parse','HEAD'),evidenceDirectory:dir,...observations};Review.prepare(plan,options);return options;}
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
  const intent='Disposable browser qualification: in '+SCREEN+' preserve the Existing import/export and add render() returning HTML that renders frame data-figma-id="4478:7209" at exactly 402px by 874px and title data-figma-id="4953:6611" with textContent strictly equal to "Zones corporelles". CSS declarations may be inline or in a stylesheet; nested title elements are allowed when their combined textContent is exact. These browser layout units map one-to-one to the fixed reference logical points for this isolated case. The independent observer measures unadjusted browser geometry and text at viewport 402x874 and independent viewport 503x971 and retains both screenshots. Do not adjust the observer or its measurements. Selection initially off; toggle() reverses and returns Boolean. In '+TEST+' execute render() and assert a string return, both toggle transitions and Existing preservation using the declared isolated subprocesses. Only these two files may change; no dependencies. Native device certification is outside this isolated browser case.';
  const recipe=Recipe.build(f.cwd,checkpoint,{applicationPath:SCREEN,testPath:TEST,componentPath:KEEP,componentBinding:BINDING,qualificationContract:QUALIFICATION_CONTRACT,scenarioPropertyType:'STATE',observationIntent:'The independent observer measures unadjusted rendered browser DOM geometry and text at required viewport 402x874 and independent viewport 503x971 and retains both screenshots; functional checks execute the declared selection transitions. Browser measurement does not certify a native device.',issueId:'github_issue:MyUncried/Application-Routine#269',intent,executionContext:{mode:'LOCAL',writer_id:'CLAUDE:figma-disposable'}});
  const produced=Chain.produce(recipe,{cwd:f.cwd});save('produced.json',produced);const receipt=Chain.reviewOrRecover(produced,{cwd:f.cwd,evidenceDirectory:path.join(output,'plan-review')});save('plan-review.json',receipt);Chain.validateReceipt(produced,receipt);
  const a=produced.artifacts,plan=Adapter.renderCompatibilityPlan({application_head:a.planningEnvelope.application_head,plan_contract_hash:a.planContract.contract_hash},a.planContract,a.uiAtomicityContract,a.requirementRegistry,a.candidateManifest);fs.writeFileSync(path.join(output,'approved-plan.md'),plan);
  const references=path.join(output,'implementation-references');fs.mkdirSync(references);const observed=F.consume(plan,references,'IMPLEMENTER');save('implementation-observation.json',observed);
  const keep=digest(fs.readFileSync(path.join(f.cwd,KEEP)));f.gitIntegrity=GitIntegrity.snapshot(f.cwd);const immutable=[path.join(output,'approved-plan.md'),...observed.references.flatMap(r=>r.assets.map(a=>a.path))].map(file=>({file,sha256:digest(fs.readFileSync(file))}));
  const verifyReferences=()=>{for(const row of immutable)if(digest(fs.readFileSync(row.file))!==row.sha256)throw Error('VNEXT_FIGMA_REAL_APPROVED_REFERENCE_CHANGED');};
  status.implementation=invokeClaude(f.cwd,{instructions:intent+' Read every referenced PNG/SVG asset and the fixed property manifest. Execute no commands; the trusted driver executes checks after your edits.',approved_plan:path.join(output,'approved-plan.md'),figma_observation:observed},path.join(output,'implementation'),'INITIAL_IMPLEMENTATION',{write:true});verifyReferences();assertDelta(f,keep);
  runDeliveredTests(f,keep,path.join(output,'functional-test-initial.json'));f.git('add',SCREEN,TEST);f.git('commit','-m','Disposable real Figma initial implementation');
  const options=compare(f,f.snapshot,plan,path.join(output,'initial-review'));const implementationReview=Review.review(plan,options);save('initial-review.json',implementationReview);if(implementationReview.assessment.verdict!=='APPROVE')throw Error('VNEXT_FIGMA_REAL_INITIAL_REVISE');
  fs.writeFileSync(path.join(output,'initial-screen.js'),fs.readFileSync(path.join(f.cwd,SCREEN)));fs.writeFileSync(path.join(output,'initial-test.js'),fs.readFileSync(path.join(f.cwd,TEST)));
  // Explicit fault injection demonstrates the measurement gate. It is not an
  // application defect and no reviewer verdict is manufactured.
  fs.appendFileSync(path.join(f.cwd,SCREEN),NEGATIVE_RENDER_FAULT);
  let rejection;try{compare(f,f.snapshot,plan,path.join(output,'negative-review'));}catch(e){rejection=e.message;}if(!rejection||!rejection.includes('TARGET_NOT_SATISFIED'))throw Error('VNEXT_FIGMA_REAL_NEGATIVE_NOT_REFUSED');save('negative.json',{fault_injection:true,diagnostic:rejection,model_approval_fabricated:false});
  status.correction=invokeClaude(f.cwd,{instructions:'One causal correction only: remove the explicitly injected block between VNEXT_DISPOSABLE_RENDER_FAULT_BEGIN and VNEXT_DISPOSABLE_RENDER_FAULT_END at the end of '+SCREEN+', including its marker comments and the leading separator newline. This block changes the rendered width from 402px to 403px. Preserve the exact preceding implementation bytes and the test. Do not rewrite the initial implementation. The exact fixed reference and plan still apply.',approved_plan:path.join(output,'approved-plan.md'),diagnostic:rejection},path.join(output,'correction'),'BOUNDED_CORRECTION',{write:true});verifyReferences();assertDelta(f,keep);runDeliveredTests(f,keep,path.join(output,'functional-test-corrected.json'));
  if(!fs.readFileSync(path.join(f.cwd,SCREEN)).equals(fs.readFileSync(path.join(output,'initial-screen.js'))))throw Error('VNEXT_FIGMA_REAL_CORRECTION_PRESERVATION_FAILED');
  const corrected=Review.review(plan,compare(f,f.snapshot,plan,path.join(output,'corrected-review')));save('corrected-review.json',corrected);if(corrected.assessment.verdict!=='APPROVE')throw Error('VNEXT_FIGMA_REAL_CORRECTION_REVISE');
  status.delivery_head=f.git('rev-parse','HEAD');status.approved_plan_sha256=V.sha256(plan);status.reference_hash=f.snapshot.contract_hash;status.preservation_sha256=keep;status.acceptance_target_hash=V.canonicalHash({campaign_id:CAMPAIGN,delivery_head:status.delivery_head,approved_plan_sha256:status.approved_plan_sha256,reference_hash:status.reference_hash});status.status='INITIAL_AND_CORRECTION_PASS_AWAITING_OWNER_TECHNICAL_ACCEPTANCE';
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
   buildRecipe:c=>Recipe.build(f.cwd,c,{applicationPath:SCREEN,testPath:TEST,componentPath:KEEP,componentBinding:BINDING,qualificationContract:QUALIFICATION_CONTRACT,scenarioPropertyType:'STATE',observationIntent:'The independent observer measures unadjusted rendered browser DOM geometry and text at required viewport 402x874 and independent viewport 503x971 and retains both screenshots; functional checks execute the declared selection transitions. Browser measurement does not certify a native device.',issueId:'github_issue:MyUncried/Application-Routine#269',intent:'Local contract precheck of the declared disposable code and test mapping.',executionContext:{mode:'LOCAL',writer_id:'CLAUDE:figma-disposable'}})
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
 Browser.resolveBrowser();
 if(Lock.claudeProcessState().state!=='NONE')throw Error('VNEXT_FIGMA_REAL_OTHER_CLAUDE_ACTIVE_OR_AMBIGUOUS');
 const request=JSON.parse(fs.readFileSync(requestFile,'utf8')),claimed=claimRequest(request,{cwd:process.cwd()});
 for(const key of ['GH_TOKEN','GITHUB_TOKEN','KODJO_LIVE_GH_TOKEN','KODJO_VNEXT_CONSUMPTION_TOKEN'])delete process.env[key];
 fs.writeFileSync(path.join(directory,'qualification-admission.json'),JSON.stringify(claimed.claim,null,2)+'\n',{flag:'wx'});
 const lock=Lock.acquire(path.join(claimed.directory,'execution.lock'),{request_id:request.request_id,run_id:process.env.GITHUB_RUN_ID,github_run_attempt:process.env.GITHUB_RUN_ATTEMPT});
 try{await initial(directory);}finally{Lock.release(lock);if(fs.existsSync(path.join(directory,'status.json')))fs.copyFileSync(path.join(directory,'status.json'),path.join(claimed.directory,'terminal-status.json'));}
}

if(require.main===module)main().catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});
module.exports={DOCUMENTARY_STATES,runDeliveredTests,scopedPacket,capture,observe,assertDelta,assertPreservedExport,preservedExportAssertion,compare,initial,precheck,invokeClaude,validateConfig,claimRequest,preserveFixture,QUALIFICATION_CONTRACT,negativeRenderFault,NEGATIVE_RENDER_FAULT};
