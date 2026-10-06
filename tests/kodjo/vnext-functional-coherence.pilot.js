'use strict';
// Real Git/Node/reference generation probes. No injected model verdict is PASS.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const D=require('../../scripts/kodjo/qualify-vnext-figma-real-path'),C=require('../../scripts/kodjo/lib/vnext-disposable-functional-contract'),Chain=require('../../scripts/kodjo/lib/vnext-live-chain'),Recipe=require('../../scripts/kodjo/lib/vnext-figma-recipe'),Adapter=require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter'),Review=require('../../scripts/kodjo/lib/vnext-figma-implementation-review'),V=require('../../scripts/kodjo/lib/vnext-contract'),Fixture=require('./helpers/vnext-figma-fixture');
const reference="const {Existing}=require('../../shared/ui/Existing');let selected=false;module.exports={Existing,toggle(){return selected=!selected;}};\n";
const {prepare}=require('./helpers/vnext-functional-reference');
test('generated plan, real reference delivery, independent probes and reviewer-accessible dossier agree',async t=>{
 const {f,out,plan,produced,keepHash}=await prepare(t);assert.ok(plan.includes(C.EXPECTED));assert.match(plan,/require the shared module again/);assert.match(plan,/SAME Screen module instance in ONE fresh child/);
 const item=produced.artifacts.planContract.plan_items[0];
 assert.ok(item.implementation_constraints.some(c=>c.includes('node tests/ui.test.js')&&c.includes('Node built-in modules')&&c.includes('non-zero exit status')));
 const testIntent=item.change_items.find(c=>c.path===C.TEST).intent;
 assert.match(testIntent,/Tests must exercise the implementation and assert observed results/);
 assert.equal(testIntent.includes('source. against the implementation'),false);
 assert.deepEqual(produced.artifacts.impactGraph.impacts.filter(i=>i.change_kind==='MODIFY').map(i=>i.candidate_id).sort(),produced.artifacts.candidateManifest.candidates.filter(c=>[C.SCREEN,C.TEST].includes(c.path)).map(c=>c.candidate_id).sort());
 assert.equal(produced.artifacts.planContract.plan_items.flatMap(p=>p.proof_obligations).some(p=>p.proof_type==='VISUAL_COMPARE'),false);
 const receipt=D.runDeliveredTests(f,keepHash,path.join(out,'gate.json'));f.git('add',C.SCREEN,C.TEST);f.git('commit','-m','REFERENCE deterministic delivery; no model');
 const options=D.compare(f,f.snapshot,plan,path.join(out,'review'),receipt),dossier=Review.prepare(plan,options);
 const artifact=JSON.parse(fs.readFileSync(path.join(out,'review','execution.json')));
 assert.deepEqual(artifact.returned_values,[true,false]);assert.equal(artifact.execution_model,'ONE_MODULE_INSTANCE_TWO_ORDERED_CALLS_BY_CONSTRUCTION');assert.ok(artifact.process_id>0);assert.deepEqual(artifact.call_order,['toggle-off-on','toggle-on-off']);
 assert.deepEqual(artifact.node_test_receipt.preservation_probe,{status:'PASS',normal_identity:true,sentinel_identity:true,independent_child_process:true});
 assert.equal(dossier.observed_files.length,1);assert.equal(dossier.observed_files[0].file,path.join(out,'review','execution.json'));assert.equal(artifact.node_test_receipt.source_sha256[C.KEEP],keepHash);
 assert.equal(dossier.measurements.length,0);assert.equal(dossier.scenario_ids.length,2);
});

for(const fails of [false,true])test('preservation restores shared export and cache entries after '+(fails?'a failed sentinel assertion':'success'),t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-cache-restore-')),screen=path.join(dir,'Screen.js'),shared=path.join(dir,'Existing.js'),key='__vnextProbe'+path.basename(dir).replace(/\W/g,'');
 globalThis[key]=[];
 fs.writeFileSync(shared,`module.exports={Existing:{original:true}};globalThis[${JSON.stringify(key)}].push({shared:module.exports,original:module.exports.Existing});`);
 fs.writeFileSync(screen,`const {Existing}=require('./Existing');module.exports={Existing:${fails?'Object.keys(Existing).length===0?null:Existing':'Existing'}};`);
 t.after(()=>{delete require.cache[screen];delete require.cache[shared];delete globalThis[key];fs.rmSync(dir,{recursive:true,force:true});});
 require(screen);const oldScreen=require.cache[screen],oldShared=require.cache[shared],original=oldShared.exports.Existing;
 if(fails)assert.throws(()=>C.preservation(screen,shared),/PROVENANCE_FAILED/);else assert.equal(C.preservation(screen,shared).status,'PASS');
 assert.equal(globalThis[key].length,2);
 assert.equal(globalThis[key][1].shared.Existing,globalThis[key][1].original);
 assert.equal(require.cache[screen],oldScreen);assert.equal(require.cache[shared],oldShared);assert.equal(require(shared).Existing,original);
});
for(const [name,body,diagnostic] of [
 ['constant shared value',"let selected=false;module.exports={Existing:true,toggle:()=>selected=!selected};",/PROVENANCE_FAILED/],
 ['missing shared export',"let selected=false;module.exports={toggle:()=>selected=!selected};",/PRESERVATION_FAILED/],
 ['replaced shared module',reference,/WRITE_SCOPE_REFUSED|PRESERVATION_FAILED/]
])test('independent preservation refuses '+name+' even if delivered test passes',async t=>{const {f,out,keepHash}=await prepare(t);f.write(C.SCREEN,body);f.write(C.TEST,'// Deliberately empty passing test: cannot establish preservation.\n');if(name==='replaced shared module')f.write(C.KEEP,'module.exports={Existing:false};\n');assert.throws(()=>D.runDeliveredTests(f,keepHash,path.join(out,'failed-gate.json')),diagnostic);assert.equal(JSON.parse(fs.readFileSync(path.join(out,'failed-gate.json'))).status,'FAIL');});
for(const [name,body] of [
 ['always true',"const {Existing}=require('../../shared/ui/Existing');module.exports={Existing,toggle:()=>true};"],
 ['wrong initial state',"const {Existing}=require('../../shared/ui/Existing');let selected=true;module.exports={Existing,toggle:()=>selected=!selected};"],
 ['injected functional fault',reference+D.NEGATIVE_FUNCTIONAL_FAULT]
])test('real generated dossier refuses '+name+' despite a passing delivered Node test',async t=>{const {f,out,plan,keepHash}=await prepare(t);f.write(C.SCREEN,body);f.write(C.TEST,'// Intentionally vacuous test; independent observer must refuse.\n');const receipt=D.runDeliveredTests(f,keepHash);assert.equal(receipt.status,'PASS');assert.throws(()=>D.compare(f,f.snapshot,plan,path.join(out,'negative'),receipt),/SCENARIO_NOT_PASSED/);});
test('receipt corruption and changed shared source cannot reach the reviewer',async t=>{const {f,out,keepHash}=await prepare(t),receipt=D.runDeliveredTests(f,keepHash);const bad=structuredClone(receipt);delete bad.preservation_probe;assert.throws(()=>D.observe(f,f.snapshot,path.join(out,'unused'),bad),/PRESERVATION_RECEIPT_INVALID/);f.write(C.KEEP,'module.exports={Existing:true};\n// drift\n');assert.throws(()=>D.observe(f,f.snapshot,path.join(out,'unused'),receipt),/RECEIPT_SOURCE_DRIFT/);});
test('functional fault is rejected and exact causal correction restores the same generated dossier',async t=>{const {f,out,plan,keepHash}=await prepare(t),original=fs.readFileSync(path.join(f.cwd,C.SCREEN));const receipt=D.runDeliveredTests(f,keepHash);D.compare(f,f.snapshot,plan,path.join(out,'before'),receipt);f.write(C.SCREEN,original.toString()+D.NEGATIVE_FUNCTIONAL_FAULT);assert.throws(()=>D.compare(f,f.snapshot,plan,path.join(out,'negative'),undefined,{negativeProbe:true}),/SCENARIO_NOT_PASSED/);f.write(C.SCREEN,original.toString());const corrected=D.runDeliveredTests(f,keepHash);const options=D.compare(f,f.snapshot,plan,path.join(out,'corrected'),corrected);assert.equal(Review.prepare(plan,options).scenario_ids.length,2);assert.deepEqual(fs.readFileSync(path.join(f.cwd,C.SCREEN)),original);});

test('positive dossier cannot omit delivered gate, including direct reviewer preparation',async t=>{
 const {f,out,plan}=await prepare(t);assert.throws(()=>D.compare(f,f.snapshot,plan,path.join(out,'missing')),/GATE_RECEIPT_REQUIRED/);
 const dir=path.join(out,'direct');fs.mkdirSync(dir);const observations=D.observe(f,f.snapshot,dir);
 assert.throws(()=>Review.prepare(plan,{cwd:f.cwd,approvedPlanSha256:V.sha256(plan),deliveryHead:f.git('rev-parse','HEAD'),evidenceDirectory:dir,...observations}),/GATE_RECEIPT_REQUIRED/);
 assert.throws(()=>D.compare(f,f.snapshot,plan,path.join(out,'fake-negative'),undefined,{negativeProbe:true}),/NEGATIVE_FAILURE_REQUIRED/);
});
test('preservation observations are mandatory reviewer coverage and reject altered fact',async t=>{
 const {f,out,plan,keepHash}=await prepare(t),receipt=D.runDeliveredTests(f,keepHash),dir=path.join(out,'review'),options=D.compare(f,f.snapshot,plan,dir,receipt),d=Review.prepare(plan,options);
 assert.deepEqual(d.preservation_ids,['Existing.normal_identity','Existing.sentinel_identity']);
 const assessment={verdict:'APPROVE',reference_hashes:d.observation.references.map(r=>r.reference_hash),reviewed_assertion_ids:d.assertion_ids,reviewed_scenario_ids:d.scenario_ids,consulted_resource_sha256:d.observation.references.flatMap(r=>r.assets.map(a=>a.sha256)),findings:[],reservations:[],reason:'Injected assessment validation only; no model approval.'};
 assert.throws(()=>Review.validateAssessment(d,assessment),/PRESERVATION_UNCOVERED/);assessment.reviewed_preservation_ids=d.preservation_ids;Review.validateAssessment(d,assessment);
 const file=path.join(dir,'execution.json'),body=JSON.parse(fs.readFileSync(file));body.node_test_receipt.preservation_probe.sentinel_identity=false;const content=JSON.stringify(body);fs.writeFileSync(file,content);options.scenarioResults.forEach(row=>row.artifact_sha256=V.sha256(content));
 assert.throws(()=>Review.prepare(plan,options),/FACT_MISMATCH/);
});
