'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const Browser=require('../../scripts/kodjo/lib/vnext-figma-browser-observer'),Chain=require('../../scripts/kodjo/lib/vnext-live-chain'),V=require('../../scripts/kodjo/lib/vnext-contract');
test('generic recipe requires a concrete binding and projects a created surface without extending a preserved dependency',async t=>{
 const Fixture=require('./helpers/vnext-figma-fixture'),Launch=require('../../scripts/kodjo/lib/vnext-figma-launch'),Recipe=require('../../scripts/kodjo/lib/vnext-figma-recipe'),Adapter=require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter'),Driver=require('../../scripts/kodjo/qualify-vnext-figma-real-path');
 const f=Fixture.fixture({launchMode:true});t.after(f.cleanup);const scope={slice_id:'TEST-BROWSER',launch_id:'binding-test',file_key:f.snapshot.file_key,frames:f.snapshot.frames,documents:f.snapshot.documents};
 const checkpoint=await Launch.launch(scope,{capture:s=>Driver.capture(f.snapshot,s),reconcile:(raw,documents)=>({...raw,documents,states:f.snapshot.states,decisions:f.snapshot.decisions,conflicts:[]}),persist:()=>({revision:f.head,path:f.packetPath,content:Chain.readGit(f.cwd,f.head,f.packetPath)})});
 const mapping={applicationPath:'src/features/example/Screen.js',testPath:'tests/ui.test.js',componentPath:'src/shared/ui/Existing.js',issueId:'github_issue:MyUncried/Application-Routine#269',intent:'TEST created render surface.',executionContext:{mode:'LOCAL',writer_id:'CLAUDE:fixture-test'}};
 assert.throws(()=>Recipe.build(f.cwd,checkpoint,mapping),/COMPONENT_BINDING_REQUIRED/);
 assert.throws(()=>Recipe.build(f.cwd,checkpoint,{...mapping,componentBinding:{decision:'REUSE',export:'Declared reusable component',justification:'TEST'}}),/COMPONENT_EXPORT_INVALID/);
 const recipe=Recipe.build(f.cwd,checkpoint,{...mapping,componentBinding:{decision:'CREATE',justification:'Create the render surface; preserve the unchanged utility dependency.'},scenarioPropertyType:'STATE'}),produced=Chain.produce(recipe,{cwd:f.cwd}),a=produced.artifacts;
 assert.ok(a.uiAtomicityContract.criteria.every(c=>c.component_decision==='CREATE'&&c.selected_component_candidate_id===null));
 assert.ok(a.uiAtomicityContract.criteria.flatMap(c=>c.assertions).filter(a=>a.figma_document_state).every(a=>a.property_type==='STATE'));
 assert.doesNotThrow(()=>Adapter.renderCompatibilityPlan({application_head:a.planningEnvelope.application_head,plan_contract_hash:a.planContract.contract_hash},a.planContract,a.uiAtomicityContract,a.requirementRegistry,a.candidateManifest));
 assert.ok(a.planContract.boundaries.preserve_scope.some(c=>c.path===mapping.componentPath));
 const qualified=Chain.produce(Recipe.build(f.cwd,checkpoint,{...mapping,componentBinding:{decision:'CREATE',justification:'Create the render surface; preserve the utility.'},scenarioPropertyType:'STATE',qualificationContract:Driver.QUALIFICATION_CONTRACT}),{cwd:f.cwd}).artifacts;
 for(const item of qualified.planContract.plan_items){
  assert.ok(item.implementation_constraints.includes(Driver.QUALIFICATION_CONTRACT.preservation_constraint));
  assert.ok(item.implementation_constraints.includes(Driver.QUALIFICATION_CONTRACT.observer_constraint));
  assert.deepEqual(item.residual_risks,Driver.QUALIFICATION_CONTRACT.residual_risks);
  assert.ok(item.test_obligations.every(o=>o.expected.includes(Driver.QUALIFICATION_CONTRACT.preservation_test_expected)));
  const functional=item.proof_obligations.find(o=>o.proof_type==='FUNCTIONAL_TEST');
  const visual=item.proof_obligations.find(o=>o.proof_type==='VISUAL_COMPARE');
  if(visual){assert.ok(functional.expected.includes(Driver.QUALIFICATION_CONTRACT.visual_test_expected));assert.ok(visual.expected.includes(qualified.requirementRegistry.requirements.find(r=>r.requirement_id===item.requirement_id).statement));assert.ok(visual.expected.includes(Driver.QUALIFICATION_CONTRACT.visual_proof_expected));}
 }
 assert.ok(qualified.uiAtomicityContract.criteria.flatMap(c=>c.assertions).filter(a=>a.figma_document_state).every(a=>a.subject===Driver.QUALIFICATION_CONTRACT.documentary_subject));
 assert.doesNotThrow(()=>Driver.assertPreservedExport(f.cwd));
 fs.writeFileSync(path.join(f.cwd,mapping.applicationPath),'module.exports={render:()=>""};\n');
 assert.throws(()=>Driver.assertPreservedExport(f.cwd),/VNEXT_FIGMA_REAL_EXPORT_PRESERVATION_FAILED/);

});
test('review dependency indices resolve exact catalog IDs while ambiguity, unknown types and bounds stay refused',()=>{
 const context={target_catalog:{SOURCE_UNIT:['SRC-one'],REQUIREMENT:[],IMPACT:[],CANDIDATE:['CAND-two'],PLAN_ITEM:[],TEST:[],PROOF:[],CRITERION:[],ASSERTION:[],PLAN_CONTRACT:[]}};
 const output={findings:[{finding:'transport fixture',dependency_target_indices:[1]}],finding_resolutions:[],reviewed_target_indices:[0,1],target_catalog_hash:V.canonicalHash(['SRC-one','CAND-two'])};
 assert.deepEqual(Chain.decodeReviewOutput(context,output).findings,[{finding:'transport fixture',dependency_target_ids:['CAND-two']}]);
 for(const deps of [[2],[-1],[0,0],['PLAN_CONTRACT'],[0.5]])assert.throws(()=>Chain.decodeReviewOutput(context,{...output,findings:[{dependency_target_indices:deps}]}),/DEPENDENCY_INDEX_INVALID/);
 assert.throws(()=>Chain.decodeReviewOutput(context,{...output,findings:[{dependency_target_indices:[1],dependency_target_ids:['CAND-two']}]}),/DEPENDENCY_INDEX_AMBIGUOUS/);
 assert.throws(()=>Chain.decodeReviewOutput(context,{...output,findings:[{target_id:'CAND-two',dependency_target_indices:[1]}]}),/FINDING_SELF_DEPENDENCY/);
});
test('browser refusal is explicit and no normal browser profile is opened by binary discovery',()=>{
 assert.throws(()=>Browser.resolveBrowser({KODJO_FIGMA_BROWSER:'relative/unsafe'}),/BROWSER_CONFIG_INVALID/);
});
test('disposable markup checks exact dimension values rather than declaration presence',()=>{
 const Driver=require('../../scripts/kodjo/qualify-vnext-figma-real-path');const render=(w,h)=>`<section style="width:${w}; height:${h}" data-figma-id="4478:7209"><span data-figma-id="4953:6611">Zones corporelles</span></section>`;
 assert.doesNotThrow(()=>Driver.assertMarkup(render('402px','874px')));assert.doesNotThrow(()=>Driver.assertMarkup(render('402.0px','874.0px')));
 for(const [w,h]of [['1px','1px'],['100%','100vh'],['400px','874px'],['402px','873px']])assert.throws(()=>Driver.assertMarkup(render(w,h)),/EXACT_DIMENSION_REQUIRED/);
 assert.throws(()=>Driver.assertMarkup(render('402px','874px').replace('Zones corporelles','Wrong title')),/EXACT_TITLE_REQUIRED/);
});
let available;try{available=Browser.resolveBrowser();}catch(_){}
test('actual browser measures DOM geometry rather than numeric exports, preserves screenshot and detects injected delta',
 {skip:!available&&process.platform!=='win32',timeout:180000},async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-dom-observer-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true,maxRetries:10,retryDelay:100}));
 const screen=path.join(root,'screen.js'),keep=path.join(root,'keep.js');fs.writeFileSync(keep,'module.exports={Existing:true};\n');
 const code="let selected=false;module.exports={width:999,height:999,render:()=>'<section data-figma-id=\"frame\" style=\"width:401px;height:874px\"><span data-figma-id=\"title\">Observed title</span></section>',toggle:()=>selected=!selected};\n";
 fs.writeFileSync(screen,code);const first=path.join(root,'first');fs.mkdirSync(first);
 const config={screen,keep,directory:first,viewport:402,height:874,frameId:'frame',titleId:'title',transitions:[{scenario_id:'off-on',method:'toggle',expected:true},{scenario_id:'on-off',method:'toggle',expected:false}]};
 const facts=await Browser.observe(config);assert.equal(facts.width,401);assert.equal(facts.height,874);assert.equal(facts.title,'Observed title');assert.deepEqual(facts.scenarios,{'off-on':true,'on-off':true});assert.equal(facts.native_certification,false);
 assert.deepEqual(fs.readFileSync(path.join(first,'rendered.png')).subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
 fs.appendFileSync(screen,'module.exports.__figmaWidthDelta=1;\n');const second=path.join(root,'second');fs.mkdirSync(second);assert.equal((await Browser.observe({...config,directory:second})).width,401);
 const cleanup=JSON.parse(fs.readFileSync(path.join(second,'browser-cleanup.json')));assert.equal(cleanup.process_close_verified,true);assert.equal(cleanup.profile_removed,true);assert.equal(fs.existsSync(cleanup.profile),false);
 // A genuine rendered defect stays visible even with a compensating export.
 fs.writeFileSync(screen,code.replace('401px','400px')+'module.exports.__figmaWidthDelta=2;\n');const third=path.join(root,'third');fs.mkdirSync(third);assert.equal((await Browser.observe({...config,directory:third})).width,400);
 const Driver=require('../../scripts/kodjo/qualify-vnext-figma-real-path');
 fs.writeFileSync(screen,code.replace('401px','402px')+Driver.NEGATIVE_RENDER_FAULT);const fourth=path.join(root,'fourth');fs.mkdirSync(fourth);assert.equal((await Browser.observe({...config,directory:fourth})).width,403);
});
test('disposable fixed geometry refuses a viewport-relative counterexample at an independent viewport',
 {skip:!available&&process.platform!=='win32',timeout:180000},t=>{
 const Driver=require('../../scripts/kodjo/qualify-vnext-figma-real-path');const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-independent-viewport-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true,maxRetries:10,retryDelay:100}));
 fs.mkdirSync(path.join(root,'src/features/example'),{recursive:true});fs.mkdirSync(path.join(root,'src/shared/ui'),{recursive:true});fs.writeFileSync(path.join(root,'src/shared/ui/Existing.js'),'module.exports={Existing:true};');
 const screen=path.join(root,'src/features/example/Screen.js');const markup=(width,height)=>`let selected=false;module.exports={render:()=>'<section data-figma-id="frame" style="width:${width};height:${height}"><span data-figma-id="title">Observed title</span></section>',toggle:()=>selected=!selected};`;
 const packet={contract_hash:'a'.repeat(64),states:[],decisions:[{disposition:'REALIZE',property:'width',element_id:'frame',property_id:'W',rule:{viewports:[402],value:402}},{disposition:'REALIZE',property:'height',element_id:'frame',property_id:'H',rule:{viewports:[402],value:874}},{disposition:'REALIZE',property:'characters',element_id:'title',property_id:'T',rule:{viewports:[402],value:'Observed title'}}]};
 const f={cwd:root,git:()=> 'b'.repeat(40)};const fixed=path.join(root,'fixed');fs.mkdirSync(fixed);fs.writeFileSync(screen,markup('402px','874px'));
 const observed=Driver.observe(f,packet,fixed);assert.deepEqual(observed.measurements.map(m=>m.value),[402,874,'Observed title']);
 const alternate=JSON.parse(fs.readFileSync(path.join(fixed,'independent-viewport/browser-facts.json')));assert.equal(alternate.viewport,503);assert.equal(alternate.height,874);
 const relative=path.join(root,'relative');fs.mkdirSync(relative);fs.writeFileSync(screen,markup('100%','100vh'));
 assert.throws(()=>Driver.observe(f,packet,relative),/FIXED_GEOMETRY_NOT_INDEPENDENT/);
 const primary=JSON.parse(fs.readFileSync(path.join(relative,'browser-facts.json')));assert.equal(primary.width,402);assert.equal(primary.height,874);
 const secondary=JSON.parse(fs.readFileSync(path.join(relative,'independent-viewport/browser-facts.json')));assert.equal(secondary.width,503);assert.equal(secondary.height,971);
});
test('browser cleanup waits for the actual process and profile descendants before removal',async t=>{
 const {spawn}=require('node:child_process');const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-browser-close-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const child=spawn(process.execPath,['-e','setTimeout(()=>process.exit(0),40)'],{stdio:'ignore'});t.after(()=>{if(child.exitCode===null)child.kill();});const diagnostic={};let checks=0;
 await Browser.closeProcess(child,{profile:root,platform:'win32',diagnostic,terminate:async()=>{},inventory:async()=>{assert.notEqual(child.exitCode,null);return ++checks===1?[{ProcessId:123,Name:'fixture.exe'}]:[];}});
 assert.equal(diagnostic.process_close_verified,true);assert.equal(diagnostic.profile_processes_closed,true);assert.equal(checks,2);
});
test('browser cleanup failure retains stderr, primary error and isolated profile diagnostics',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-browser-cleanup-error-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const profile=path.join(root,'profile');fs.mkdirSync(profile);const primary=Error('PRIMARY_OBSERVATION_ERROR');let removed=false;
 await Browser.cleanupProfile({profile,directory:root,stderr:'original browser diagnostic',primaryError:primary,close:async()=>{throw Error('PROFILE_STILL_OPEN');},remove:()=>{removed=true;}});
 assert.equal(removed,false);assert.equal(primary.message,'PRIMARY_OBSERVATION_ERROR');assert.equal(primary.cleanup_error.message,'PROFILE_STILL_OPEN');assert.equal(fs.existsSync(profile),true);assert.equal(fs.readFileSync(path.join(root,'browser-stderr.log'),'utf8'),'original browser diagnostic');
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'browser-cleanup.json'))).cleanup_error.message,'PROFILE_STILL_OPEN');
 await assert.rejects(Browser.cleanupProfile({profile,directory:root,stderr:'diagnostic',close:async()=>{},remove:()=>{throw Object.assign(Error('LOCKED_PROFILE'),{code:'EPERM'});}}),/LOCKED_PROFILE/);
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'browser-cleanup.json'))).cleanup_error.code,'EPERM');
});
test('packaged Chrome precedes Chromium on Linux while an explicit browser remains authoritative',()=>{
 const installed=new Set(['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser']);
 assert.equal(Browser.resolveBrowser({},p=>installed.has(p)),'/usr/bin/google-chrome');
 assert.equal(Browser.resolveBrowser({KODJO_FIGMA_BROWSER:'/usr/bin/chromium'},p=>installed.has(p)),'/usr/bin/chromium');
 assert.throws(()=>Browser.resolveBrowser({KODJO_FIGMA_BROWSER:'/missing/browser'},p=>installed.has(p)),/BROWSER_CONFIG_INVALID/);
 installed.delete('/usr/bin/google-chrome');assert.equal(Browser.resolveBrowser({},p=>installed.has(p)),'/usr/bin/chromium');
});
test('early browser exit retains executable, exit code and actual stderr in the failure',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-browser-exit-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true,maxRetries:10,retryDelay:100}));
 const screen=path.join(root,'screen.js'),keep=path.join(root,'keep.js');fs.writeFileSync(screen,'module.exports={render:()=>""};');fs.writeFileSync(keep,'module.exports={};');
 // Node is a real executable which rejects the browser-only --headless option.
 await assert.rejects(Browser.observe({screen,keep,directory:root,viewport:402,height:874,frameId:'frame',titleId:'title',transitions:[],browser:process.execPath}),e=>{
  assert.ok(e.message.startsWith('VNEXT_FIGMA_BROWSER_EXIT_BEFORE_CONNECTION:'));const details=JSON.parse(e.message.slice(e.message.indexOf(':')+1));
  assert.equal(details.browser,process.execPath);assert.notEqual(details.exit_code,0);assert.match(details.stderr,/headless/);assert.equal(details.stderr,fs.readFileSync(path.join(root,'browser-stderr.log'),'utf8'));return true;
 });
});

test('preservation proves a live re-export and rejects a hardcoded equal primitive',t=>{
 const Driver=require('../../scripts/kodjo/qualify-vnext-figma-real-path');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-provenance-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const screen=path.join(root,'screen.js'),keep=path.join(root,'keep.js');fs.writeFileSync(keep,'module.exports={Existing:true};');
 fs.writeFileSync(screen,'module.exports={Existing:require("./keep").Existing};');
 const oldKeep=require(keep),oldScreen=require(screen);
 Driver.preservedExportAssertion(screen,keep);assert.equal(require(keep),oldKeep);assert.equal(require(screen),oldScreen);assert.equal(oldKeep.Existing,true);
 fs.writeFileSync(screen,'module.exports={Existing:true};');assert.throws(()=>Driver.preservedExportAssertion(screen,keep),/EXPORT_PROVENANCE_FAILED/);
 assert.equal(require(keep),oldKeep);assert.equal(oldKeep.Existing,true);delete require.cache[require.resolve(screen)];delete require.cache[require.resolve(keep)];
});
test('Windows termination races are accepted only after root and profile are gone',async()=>{
 const child={pid:123,exitCode:null,signalCode:null},diagnostic={};let waits=0,checks=0;const calls=[];
 await Browser.closeProcess(child,{profile:'isolated-profile',platform:'win32',diagnostic,wait:async()=>++waits!==1,terminate:async(file,args)=>{calls.push(args);throw Object.assign(Error('already gone'),{diagnostic_stderr:'no running task'});},inventory:async()=>++checks===1?[{ProcessId:456}]:[]});
 assert.deepEqual(calls,[['/PID','123','/F'],['/PID','456','/F']]);assert.equal(diagnostic.process_close_verified,true);assert.equal(diagnostic.force_raced_with_exit,true);assert.equal(diagnostic.profile_termination_errors.length,1);
 await assert.rejects(Browser.closeProcess(child,{profile:'isolated-profile',platform:'win32',wait:async()=>false,terminate:async()=>{throw Error('root still alive');},inventory:async()=>[]}),/root still alive/);
 await assert.rejects(Browser.closeProcess(null,{profile:'isolated-profile',platform:'win32',profileTimeoutMs:0,inventory:async()=>[{ProcessId:456}]}),/PROFILE_PROCESSES_REMAIN/);
});
