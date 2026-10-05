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
});
test('review dependency indices resolve exact catalog IDs while ambiguity, unknown types and bounds stay refused',()=>{
 const context={target_catalog:{SOURCE_UNIT:['SRC-one'],REQUIREMENT:[],IMPACT:[],CANDIDATE:['CAND-two'],PLAN_ITEM:[],TEST:[],PROOF:[],CRITERION:[],ASSERTION:[],PLAN_CONTRACT:[]}};
 const output={findings:[{finding:'transport fixture',dependency_target_indices:[1]}],finding_resolutions:[],reviewed_target_indices:[0,1],target_catalog_hash:V.canonicalHash(['SRC-one','CAND-two'])};
 assert.deepEqual(Chain.decodeReviewOutput(context,output).findings,[{finding:'transport fixture',dependency_target_ids:['CAND-two']}]);
 for(const deps of [[2],[-1],[0,0],['PLAN_CONTRACT'],[0.5]])assert.throws(()=>Chain.decodeReviewOutput(context,{...output,findings:[{dependency_target_indices:deps}]}),/DEPENDENCY_INDEX_INVALID/);
 assert.throws(()=>Chain.decodeReviewOutput(context,{...output,findings:[{dependency_target_indices:[1],dependency_target_ids:['CAND-two']}]}),/DEPENDENCY_INDEX_AMBIGUOUS/);
});
test('browser refusal is explicit and no normal browser profile is opened by binary discovery',()=>{
 assert.throws(()=>Browser.resolveBrowser({KODJO_FIGMA_BROWSER:'relative/unsafe'}),/BROWSER_CONFIG_INVALID/);
});
let available;try{available=Browser.resolveBrowser();}catch(_){}
test('actual browser measures DOM geometry rather than numeric exports, preserves screenshot and detects injected delta',
 {skip:!available&&process.platform!=='win32',timeout:60000},async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-dom-observer-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true,maxRetries:10,retryDelay:100}));
 const screen=path.join(root,'screen.js'),keep=path.join(root,'keep.js');fs.writeFileSync(keep,'module.exports={Existing:true};\n');
 const code="let selected=false;module.exports={width:999,height:999,render:()=>'<section data-figma-id=\"frame\" style=\"width:401px;height:874px\"><span data-figma-id=\"title\">Observed title</span></section>',toggle:()=>selected=!selected};\n";
 fs.writeFileSync(screen,code);const first=path.join(root,'first');fs.mkdirSync(first);
 const config={screen,keep,directory:first,viewport:402,height:874,frameId:'frame',titleId:'title',transitions:[{scenario_id:'off-on',method:'toggle',expected:true},{scenario_id:'on-off',method:'toggle',expected:false}]};
 const facts=await Browser.observe(config);assert.equal(facts.width,401);assert.equal(facts.height,874);assert.equal(facts.title,'Observed title');assert.deepEqual(facts.scenarios,{'off-on':true,'on-off':true});assert.equal(facts.native_certification,false);
 assert.deepEqual(fs.readFileSync(path.join(first,'rendered.png')).subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
 fs.appendFileSync(screen,'module.exports.__figmaWidthDelta=1;\n');const second=path.join(root,'second');fs.mkdirSync(second);assert.equal((await Browser.observe({...config,directory:second})).width,402);
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
