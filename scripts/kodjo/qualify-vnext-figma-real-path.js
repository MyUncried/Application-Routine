#!/usr/bin/env node
'use strict';
// Actual Claude sessions on an explicitly disposable fixture, in the existing
// VNEXT-12 campaign. It does not certify native pixels or application delivery.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const V=require('./lib/vnext-contract'),F=require('./lib/vnext-figma-source'),Launch=require('./lib/vnext-figma-launch'),Chain=require('./lib/vnext-live-chain'),Recipe=require('./lib/vnext-figma-recipe'),Review=require('./lib/vnext-figma-implementation-review'),Adapter=require('./lib/vnext-legacy-queue-adapter');
const ROOT='.github/orchestration/vnext12/VNEXT-12-QUALIF';
const CAMPAIGN='628b3349-88b4-4bf1-be6b-50bc09e7d245';
const SCREEN='src/features/example/Screen.js',TEST='tests/ui.test.js',KEEP='src/shared/ui/Existing.js';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function seal(p){const x=structuredClone(p);delete x.contract_hash;return V.sealContract(x);}
function scopedPacket(observed,doc){
 const p=structuredClone(observed),keys=[['4478:7209','width'],['4478:7209','height'],['4953:6611','characters']];
 p.documents=[doc];p.frames=p.frames.map((f,i)=>({...f,state_id:'STATE-'+(i+1)}));
 p.states=Launch.documentStates([doc]);
 p.conflicts=[];
 for(const d of p.decisions){d.document_ids=[doc.document_id];if(keys.some(([id,prop])=>d.element_id===id&&d.property===prop)){d.disposition='REALIZE';d.reason='Property explicitly selected for this disposable protocol qualification.';d.rule={kind:'EQUALS',value:p.nodes.find(n=>n.id===d.element_id).properties[d.property],viewports:[402],tolerance:0,unit:d.property==='characters'?'TEXT':'pt'};}else{d.disposition='OBSERVED_ONLY';d.rule=null;d.reason='Captured and retained as context outside the three-property disposable scope; not an exemption for product delivery.';}}
 return seal(p);
}
function capture(packet,scope){return {launch_id:scope.launch_id,file_key:packet.file_key,captured_at:packet.captured_at,frames:packet.frames,inventories:[{end:true,count:packet.nodes.length,rows:packet.nodes.map(n=>[n.id,n.parent_id,n.type,n.name])}],batches:[{end:true,requested_ids:packet.nodes.map(n=>n.id),rows:packet.nodes.map(n=>({id:n.id,child_ids:n.child_ids,properties:n.properties}))}],variables:packet.variables,collections:packet.collections,resources:packet.resources};}
function invokeClaude(cwd,prompt,directory,role,{write=false}={}){
 fs.mkdirSync(directory,{recursive:true});const config=path.join(directory,'mcp.json'),settings=path.join(directory,'settings.json');fs.writeFileSync(config,JSON.stringify({mcpServers:{}}));fs.writeFileSync(settings,JSON.stringify({disableAllHooks:true}));
 const env={...process.env};for(const k of ['GH_TOKEN','GITHUB_TOKEN','KODJO_LIVE_GH_TOKEN'])delete env[k];
 const args=['-p','--restricted','--permission-mode','dontAsk','--permission-prompts','none','--output-format','json','--tools',write?'Read,Edit,Write,Glob,Grep':'Read,Glob,Grep','--allowedTools',write?'Read,Edit,Write,Glob,Grep':'Read,Glob,Grep','--disallowedTools','mcp__*,Bash','--strict-mcp-config','--mcp-config',config,'--settings',settings];
 fs.writeFileSync(path.join(directory,'prompt.json'),JSON.stringify(prompt,null,2)+'\n');
 const raw=Chain.command(require('./lib/claude-local').resolveClaudeBinary(),args,cwd,JSON.stringify(prompt),env,600000,{onResult:r=>fs.writeFileSync(path.join(directory,'process.json'),JSON.stringify(r,null,2)+'\n')});fs.writeFileSync(path.join(directory,'response.json'),raw);
 const response=JSON.parse(raw);if(response.type!=='result'||response.is_error||!response.session_id)throw Error('VNEXT_FIGMA_REAL_CLAUDE_RESULT_INVALID:'+role);return {session_id:response.session_id,raw_response_sha256:V.sha256(raw),role};
}
function observe(f,packet,dir){
 const modulePath=path.join(f.cwd,SCREEN);delete require.cache[require.resolve(modulePath)];const screen=require(modulePath);
 if(typeof screen.render!=='function'||typeof screen.toggle!=='function'||typeof screen.reset!=='function')throw Error('VNEXT_FIGMA_REAL_EXPORTS_MISSING');
 const actual=screen.render(),values={};
 for(const d of F.required(packet)){const key=d.property==='characters'?'title':d.property;if(!Object.hasOwn(actual,key))throw Error('VNEXT_FIGMA_REAL_RENDER_VALUE_MISSING:'+key);values[d.property_id]=actual[key];}
 screen.reset();const first=screen.toggle(),second=screen.toggle();const states={'toggle-off-on':first===true,'toggle-on-off':second===false};
 const content=JSON.stringify({values,scenarios:states});fs.writeFileSync(path.join(dir,'execution.json'),content);
 const head=f.git('rev-parse','HEAD'),artifact={artifact_path:'execution.json',artifact_sha256:digest(Buffer.from(content)),observer:'EXECUTED_JSON_FACT',delivery_head:head};
 return {measurements:F.required(packet).flatMap(d=>d.rule.viewports.map(viewport=>({...artifact,measurement_id:d.property_id+'@'+viewport,property_id:d.property_id,reference_hash:packet.contract_hash,viewport,value:values[d.property_id],value_path:['values',d.property_id],evidence:'Executed disposable render() output; this is not a native pixel measurement.'}))),scenarioResults:packet.states.flatMap(s=>(s.scenarios||[]).map(s=>({...artifact,scenario_id:s.scenario_id,reference_hash:packet.contract_hash,status:states[s.scenario_id]?'PASS':'FAIL',value:states[s.scenario_id],value_path:['scenarios',s.scenario_id],proof_results:s.proof_required.map(proof_type=>({proof_type,status:states[s.scenario_id]?'PASS':'FAIL'}))})))};
}
function assertDelta(f,beforeKeep){const changed=f.git('diff','--name-only','HEAD').split('\n').filter(Boolean);if(changed.some(p=>![SCREEN,TEST].includes(p))||f.git('ls-files','--others','--exclude-standard'))throw Error('VNEXT_FIGMA_REAL_WRITE_SCOPE_REFUSED');if(digest(fs.readFileSync(path.join(f.cwd,KEEP)))!==beforeKeep)throw Error('VNEXT_FIGMA_REAL_PRESERVATION_FAILED');}
function compare(f,packet,plan,dir){fs.mkdirSync(dir,{recursive:true});const observations=observe(f,packet,dir);const options={cwd:f.cwd,approvedPlanSha256:V.sha256(plan),deliveryHead:f.git('rev-parse','HEAD'),evidenceDirectory:dir,...observations};Review.prepare(plan,options);return options;}
async function initial(output){
 const original=JSON.parse(fs.readFileSync(ROOT+'/v8-consolidation/figma-zones/frozen-source.json','utf8'));F.validate(original,{ready:true});
 // Reuse only the established disposable scaffold. No injected reviewer,
 // approval, or implementation function is used in this real benchmark.
 const f=require('../../tests/kodjo/helpers/vnext-figma-fixture').fixture({launchMode:true,documentContent:'Selection toggles off to on and on to off.\n',transformPacket:p=>scopedPacket(original,p.documents[0])});
 let status={campaign_id:CAMPAIGN,stage:'FIGMA_INITIAL',status:'STARTED',code_head:Chain.command('git',['rev-parse','HEAD'],process.cwd()).trim(),live_figma_acquisition:'NOT_EXERCISED_FROZEN_GIT_CAPTURE_REPLAY',human_review_performed:false,application_published:false};
 const save=(name,data)=>fs.writeFileSync(path.join(output,name),JSON.stringify(data,null,2)+'\n');
 try{
  const scope={slice_id:'VNEXT-12-QUALIF',launch_id:'figma-real-'+crypto.randomUUID(),file_key:f.snapshot.file_key,frames:f.snapshot.frames,documents:f.snapshot.documents};
  const checkpoint=await Launch.launch(scope,{capture:s=>capture(f.snapshot,s),reconcile:(raw,documents)=>({...raw,documents,states:f.snapshot.states,decisions:f.snapshot.decisions,conflicts:[]}),persist:()=>({revision:f.head,path:f.packetPath,content:Chain.readGit(f.cwd,f.head,f.packetPath)})});save('launch.json',checkpoint);
  const intent='Disposable protocol qualification only: in '+SCREEN+' preserve the Existing import/export and add render() returning width 402, height 874, title "Zones corporelles" from the frozen property reference; selected starts false; reset() sets false; toggle() reverses and returns the Boolean. In '+TEST+' add executable checks of this output and the two toggle transitions. No native-device or pixel compliance claim. Only these two files may change; no dependencies.';
  const recipe=Recipe.build(f.cwd,checkpoint,{applicationPath:SCREEN,testPath:TEST,componentPath:KEEP,issueId:'github_issue:MyUncried/Application-Routine#269',intent,executionContext:{mode:'LOCAL',writer_id:'CLAUDE:figma-disposable'}});
  const produced=Chain.produce(recipe,{cwd:f.cwd});save('produced.json',produced);const receipt=Chain.reviewOrRecover(produced,{cwd:f.cwd,evidenceDirectory:path.join(output,'plan-review')});save('plan-review.json',receipt);Chain.validateReceipt(produced,receipt);
  const a=produced.artifacts,plan=Adapter.renderCompatibilityPlan({application_head:a.planningEnvelope.application_head,plan_contract_hash:a.planContract.contract_hash},a.planContract,a.uiAtomicityContract,a.requirementRegistry,a.candidateManifest);fs.writeFileSync(path.join(output,'approved-plan.md'),plan);
  const references=path.join(output,'implementation-references');fs.mkdirSync(references);const observed=F.consume(plan,references,'IMPLEMENTER');save('implementation-observation.json',observed);
  const keep=digest(fs.readFileSync(path.join(f.cwd,KEEP)));status.implementation=invokeClaude(f.cwd,{instructions:intent+' Read every referenced PNG/SVG asset and the fixed property manifest. Execute no commands; the trusted driver executes checks after your edits.',approved_plan:path.join(output,'approved-plan.md'),figma_observation:observed},path.join(output,'implementation'),'INITIAL_IMPLEMENTATION',{write:true});assertDelta(f,keep);
  Chain.command(process.execPath,[TEST],f.cwd);f.git('add',SCREEN,TEST);f.git('commit','-m','Disposable real Figma initial implementation');
  const options=compare(f,f.snapshot,plan,path.join(output,'initial-review'));const implementationReview=Review.review(plan,options);save('initial-review.json',implementationReview);if(implementationReview.assessment.verdict!=='APPROVE')throw Error('VNEXT_FIGMA_REAL_INITIAL_REVISE');
  fs.writeFileSync(path.join(output,'initial-screen.js'),fs.readFileSync(path.join(f.cwd,SCREEN)));fs.writeFileSync(path.join(output,'initial-test.js'),fs.readFileSync(path.join(f.cwd,TEST)));
  // Explicit fault injection demonstrates the measurement gate. It is not an
  // application defect and no reviewer verdict is manufactured.
  fs.appendFileSync(path.join(f.cwd,SCREEN),'\nconst originalRender = module.exports.render; module.exports.render = () => ({...originalRender(), width: originalRender().width + 1});\n');
  let rejection;try{compare(f,f.snapshot,plan,path.join(output,'negative-review'));}catch(e){rejection=e.message;}if(!rejection||!rejection.includes('TARGET_NOT_SATISFIED'))throw Error('VNEXT_FIGMA_REAL_NEGATIVE_NOT_REFUSED');save('negative.json',{fault_injection:true,diagnostic:rejection,model_approval_fabricated:false});
  status.correction=invokeClaude(f.cwd,{instructions:'One causal correction only: remove the explicitly injected width+1 override at the end of '+SCREEN+'. Preserve the rest of the delivered implementation and test. Do not rewrite the initial implementation. The exact fixed reference and plan still apply.',approved_plan:path.join(output,'approved-plan.md'),diagnostic:rejection},path.join(output,'correction'),'BOUNDED_CORRECTION',{write:true});assertDelta(f,keep);Chain.command(process.execPath,[TEST],f.cwd);
  if(!fs.readFileSync(path.join(f.cwd,SCREEN)).equals(fs.readFileSync(path.join(output,'initial-screen.js'))))throw Error('VNEXT_FIGMA_REAL_CORRECTION_PRESERVATION_FAILED');
  const corrected=Review.review(plan,compare(f,f.snapshot,plan,path.join(output,'corrected-review')));save('corrected-review.json',corrected);if(corrected.assessment.verdict!=='APPROVE')throw Error('VNEXT_FIGMA_REAL_CORRECTION_REVISE');
  status.delivery_head=f.git('rev-parse','HEAD');status.approved_plan_sha256=V.sha256(plan);status.reference_hash=f.snapshot.contract_hash;status.preservation_sha256=keep;status.acceptance_target_hash=V.canonicalHash({campaign_id:CAMPAIGN,delivery_head:status.delivery_head,approved_plan_sha256:status.approved_plan_sha256,reference_hash:status.reference_hash});status.status='INITIAL_AND_CORRECTION_PASS_AWAITING_OWNER_TECHNICAL_ACCEPTANCE';
 }catch(e){status.status='FAILED';status.diagnostic=e.message;throw e;}finally{f.cleanup();status.disposable_cleanup=true;save('status.json',status);}
}
async function precheck(output){
 const original=JSON.parse(fs.readFileSync(ROOT+'/v8-consolidation/figma-zones/frozen-source.json','utf8'));
 F.validate(original,{ready:true});
 const f=require('../../tests/kodjo/helpers/vnext-figma-fixture').fixture({launchMode:true,documentContent:'Selection toggles off to on and on to off.\n',transformPacket:p=>scopedPacket(original,p.documents[0])});
 try{
  const scope={slice_id:'VNEXT-12-QUALIF',launch_id:'local-precheck',file_key:f.snapshot.file_key,frames:f.snapshot.frames,documents:f.snapshot.documents};
  const produced=await Chain.launchAndProduce(scope,{
   cwd:f.cwd,capture:s=>capture(f.snapshot,s),reconcile:(raw,documents)=>({...raw,documents,states:Launch.documentStates(documents),decisions:f.snapshot.decisions,conflicts:[]}),
   persist:()=>({revision:f.head,path:f.packetPath,content:Chain.readGit(f.cwd,f.head,f.packetPath)}),
   buildRecipe:c=>Recipe.build(f.cwd,c,{applicationPath:SCREEN,testPath:TEST,componentPath:KEEP,issueId:'github_issue:MyUncried/Application-Routine#269',intent:'Local contract precheck of the declared disposable code and test mapping.',executionContext:{mode:'LOCAL',writer_id:'CLAUDE:figma-disposable'}})
  });
  Chain.verifyProduced(produced,f.cwd);
  const source=produced.artifacts.planningEnvelope.source_manifest.sources.find(s=>s.source_kind==='FIGMA'),bytes=Chain.readGit(f.cwd,source.revision,source.locator.slice(15));
  const result={status:'LOCAL_PRECHECK_PASS',campaign_id:CAMPAIGN,revision:source.revision,source_sha256:source.fingerprint,observed_sha256:V.sha256(bytes),byte_length:Buffer.byteLength(bytes),reference_hash:produced.figma_launch.reference_hash,requirements:produced.artifacts.requirementRegistry.requirements.length,assertions:produced.artifacts.uiAtomicityContract.criteria.reduce((n,c)=>n+c.assertions.length,0),scenario_ids:produced.figma_launch.scenario_ids,real_model_calls:0,live_figma_acquisition:false,native_certification:false};
  if(output)fs.writeFileSync(path.join(output,'precheck.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  return result;
 }finally{f.cleanup();}
}
async function main(){const [stage,output]=process.argv.slice(2);if(!['precheck','initial'].includes(stage)||!output)throw Error('USAGE: qualify-vnext-figma-real-path <precheck|initial> <external-evidence-directory>');const directory=path.resolve(output);if(directory.startsWith(process.cwd()+path.sep))throw Error('VNEXT_FIGMA_REAL_EVIDENCE_OUTSIDE_CHECKOUT_REQUIRED');fs.mkdirSync(directory,{recursive:true});if(stage==='precheck')process.stdout.write(JSON.stringify(await precheck(directory))+'\n');else await initial(directory);}
if(require.main===module)main().catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});
module.exports={scopedPacket,capture,observe,assertDelta,compare,initial,precheck,invokeClaude};
