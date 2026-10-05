'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const V=require('../../scripts/kodjo/lib/vnext-contract'),F=require('../../scripts/kodjo/lib/vnext-figma-source'),Freeze=require('../../scripts/kodjo/freeze-vnext-figma');
const Fixture=require('./helpers/vnext-figma-fixture'),Chain=require('../../scripts/kodjo/lib/vnext-live-chain'),Ui=require('../../scripts/kodjo/lib/ui-atomicity-contract'),Adapter=require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter');
const seal=p=>{const c=structuredClone(p);delete c.contract_hash;return V.sealContract(c);};
function withFixture(t){const f=Fixture.fixture();t.after(()=>f.cleanup());return f;}
function plan(produced){const a=produced.artifacts;return Adapter.renderCompatibilityPlan({application_head:a.planningEnvelope.application_head,plan_contract_hash:a.planContract.contract_hash},a.planContract,a.uiAtomicityContract,a.requirementRegistry,a.candidateManifest);}
function measurements(p){return F.required(p).flatMap(d=>d.rule.viewports.map(viewport=>({measurement_id:d.property_id+'@'+viewport,property_id:d.property_id,reference_hash:p.contract_hash,viewport,value:d.rule.value,evidence:'TEST measurement from fixture only'})));}
test('Figma nominal: frozen Git -> source units -> requirements -> plan -> assertions -> review -> all consumers',t=>{
 const f=withFixture(t),p=f.produce(),a=p.artifacts;Chain.verifyProduced(p,f.cwd);
 assert.equal(a.uiAtomicityContract.assertion_count,6);assert.ok(p.reviewer_packet.consumers.some(c=>c.path.endsWith('/vnext-figma-source.js')));
 const packed=Chain.compactReviewDossier(p);assert.equal(packed.source_observations[0].content,undefined);
 assert.deepEqual(F.unpackUi(packed.artifacts.uiAtomicityContract),a.uiAtomicityContract);
 const receipt=Chain.review(p,{cwd:f.cwd,claude:'TEST-INJECTED',invoke:(_bin,_args,_cwd,input)=>{
  const dossier=JSON.parse(input);assert.equal(dossier.figma_consumer_observation.references[0].reference_hash,f.snapshot.contract_hash);
  for(const r of dossier.figma_consumer_observation.references[0].assets)assert.ok(fs.readFileSync(r.path).length>0);
  assert.equal(JSON.parse(fs.readFileSync(dossier.figma_consumer_observation.manifest)).semantic_use,'NOT_ATTESTED_BY_BYTE_OBSERVATION');
  return JSON.stringify({type:'result',session_id:'TEST',structured_output:{semantic_review:{findings:[],finding_resolutions:[],target_catalog_hash:dossier.target_catalog_hash,reviewed_target_indices:Object.values(dossier.target_catalog).flat().map((_,i)=>i)},native_assessment_observations:dossier.native_assessment_subjects.map(r=>({criterion_id:r.assessment.criterion_id,assessment_hash:r.assessment_hash,verified:true,observed_git_evidence:[{path:"docs/spec.md",revision:f.docHead,content_sha256:V.sha256("Pressable toggle on press\n")}],reason:"TEST injected observation; no real native proof"}))}});
 }});Chain.validateReceipt(p,receipt);
 const body=plan(p);assert.ok(body.includes('figma_references'));assert.ok(body.includes(f.snapshot.contract_hash));
 for(const stage of ['PLANNER','IMPLEMENTER','IMPLEMENTATION_REVIEWER']){
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'figma-consumer-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const observed=F.consume(body,directory,stage);assert.equal(observed.references[0].properties.length,5);
  assert.equal(observed.semantic_use,'NOT_ATTESTED_BY_BYTE_OBSERVATION');assert.equal(observed.references[0].reference_hash,f.snapshot.contract_hash);
  for(const asset of observed.references[0].assets)assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(asset.path)).digest('hex'),asset.sha256);
 }
 F.verifyMeasurements(f.snapshot,measurements(f.snapshot));
 const admitted=Fixture.admit(f,p,receipt),runDir=fs.mkdtempSync(path.join(os.tmpdir(),'figma-runtime-'));t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 const View=require('../../scripts/kodjo/lib/vnext-runtime-plan'),missionBytes=Buffer.from(admitted.projection.compatibility_files.mission.content);
 const handle=View.install(admitted,{cwd:f.cwd,runDir,missionBytes});
 try{
  View.assertView(handle);assert.ok(View.environment(handle).KODJO_VNEXT_FIGMA_READ_JSON);
  const asset=handle.identity.figma_observation.resources[0];fs.writeFileSync(asset.path,'changed after admission');assert.throws(()=>View.assertView(handle),/FIGMA_RESOURCES_CHANGED/);
 }finally{assert.throws(()=>View.restore(handle),/VIEW_CHANGED/);assert.equal(handle.identity.state,"RESTORED");}
});
test('negative 1: omitted element blocks independently of declared assertions',()=>{
 const p=structuredClone(Fixture.packet('a'.repeat(40)));p.nodes=p.nodes.filter(n=>n.id!=='2:1');
 assert.throws(()=>F.validate(seal(p)),/ELEMENT_OMITTED/);
 const inventory={end:true,count:2,rows:[['1',null,'FRAME','a'],['2','1','TEXT','b']]};
 assert.throws(()=>Freeze.nodesFromBatches([inventory],[{end:true,requested_ids:['1'],rows:[{id:'1',child_ids:['2'],properties:{}}]}]),/BATCH_OMITTED/);
});
test('negative 2: omitted property or false source disposition cannot disappear from coverage',t=>{
 const f=withFixture(t),raw=structuredClone(f.snapshot);raw.decisions.pop();assert.throws(()=>F.validate(seal(raw)),/PROPERTY_OMITTED/);
 f.recipe.sourceManifestInput.sources[0].units[0].disposition='CONTEXT_ONLY';assert.throws(()=>f.produce(),/DISPOSITION_DRIFT/);
});
test('negative 3: a vague expected string or unstructured relational predicate is refused',t=>{
 const f=withFixture(t);f.recipe.uiInput.criteria.find(c=>c.assertions[0].figma_reference).assertions[0].expected='La géométrie correspond à la référence Figma.';
 assert.throws(()=>f.produce(),/ASSERTION_VAGUE/);
 const p=structuredClone(f.snapshot);p.decisions[0].rule={kind:'RELATION',value:{description:'same as Figma'},viewports:[402],tolerance:0,unit:'pt'};
 assert.throws(()=>F.validate(seal(p)),/RELATIONAL_RULE_REQUIRED/);
});
test('negative 4: wrong frame, property, reference hash or screenshot dimensions is refused',t=>{
 const f=withFixture(t);f.recipe.uiInput.criteria.find(c=>c.assertions[0].figma_reference).assertions[0].figma_reference.reference_hash='a'.repeat(64);assert.throws(()=>f.produce(),/ASSERTION_REFERENCE_MISMATCH/);
 const p=structuredClone(f.snapshot);p.frames[0].frame_id='UNKNOWN';assert.throws(()=>F.validate(seal(p)),/FRAME_REFERENCE_INVALID/);
 const size=structuredClone(f.snapshot);size.nodes[0].properties.width=2;assert.throws(()=>F.validate(seal(size)),/SCREENSHOT_DIMENSIONS_MISMATCH/);
});
test('negative 5: unresolved mixed conflict blocks planning; domain precedence does not silently resolve it',t=>{
 const f=withFixture(t),p=structuredClone(f.snapshot);p.conflicts=[{conflict_id:'MIXED-1',property_id:p.decisions[0].property_id,document_id:'DOC',domain:'MIXED',status:'OPEN',description:'TEST visual bounds vs actual touch bounds',resolution:null}];
 F.validate(seal(p));assert.throws(()=>F.validate(seal(p),{ready:true}),/WAIT_FOR_CLARIFICATION/);
 p.conflicts[0].status='RESOLVED';p.conflicts[0].resolution={authority:'DOCUMENT_BEHAVIOR',reason:'TEST automatic override'};
 assert.throws(()=>F.validate(seal(p),{ready:true}),/MIXED_CONFLICT_DECISION_REQUIRED/);
});
test('negative 6: an existing reused component with a measured radius below the target fails',()=>{
 const p=Fixture.packet('a'.repeat(40)),actual=measurements(p),row=actual.find(m=>m.property_id===F.id('2:1','cornerRadius'));row.value=8;
 assert.throws(()=>F.verifyMeasurements(p,actual),/TARGET_NOT_SATISFIED/);
 row.value=NaN;assert.throws(()=>F.verifyMeasurements(p,actual),/TARGET_NOT_SATISFIED/);
 actual.splice(actual.indexOf(row),1);assert.throws(()=>F.verifyMeasurements(p,actual),/MEASUREMENT_REQUIRED/);
});
test('negative 7: forgotten variant, required assertion or documentary-only state blocks',t=>{
 const f=withFixture(t),p=structuredClone(f.snapshot);p.nodes=p.nodes.filter(n=>n.id!=='3:3');assert.throws(()=>F.validate(seal(p)),/ELEMENT_OMITTED/);
 const required=f.recipe.uiInput.criteria.find(c=>c.assertions[0].figma_reference?.property_id===F.id('3:3','fills'));required.assertions[0].figma_reference.property_id=F.id('3:2','fills');assert.throws(()=>f.produce(),/ASSERTION_VAGUE|SOURCE_MISMATCH/);
 const another=withFixture(t);another.recipe.uiInput.criteria.find(c=>c.assertions[0].figma_document_state).assertions[0].figma_document_state.state_id='UNKNOWN';assert.throws(()=>another.produce(),/DOCUMENT_STATE_UNCOVERED/);
});
test('negative 8: inaccessible, truncated or changed-after-approval sources require recovery or requalification',t=>{
 const f=withFixture(t),source=f.recipe.sourceManifestInput.sources[0];
 assert.throws(()=>F.observe(source,{cwd:f.cwd,readGit:()=>'{"schema_version":'}),/SNAPSHOT_TRUNCATED/);
 assert.throws(()=>F.observe(source,{cwd:f.cwd,readGit:()=>{throw Error('OBJECT_UNAVAILABLE');}}),/OBJECT_UNAVAILABLE/);
 const newer=structuredClone(f.snapshot);newer.captured_at='2026-10-05T01:00:00.000Z';assert.throws(()=>F.assertCurrent(f.snapshot,seal(newer)),/CHANGED_REQUALIFICATION_REQUIRED/);
 f.write(f.packetPath,'CURRENT WORKTREE IS NOT THE APPROVED SOURCE');assert.equal(f.produce().artifacts.uiAtomicityContract.figma_references[0].packet.contract_hash,f.snapshot.contract_hash);
});
test('negative 9: corrupt or missing transported screenshot/properties/resources blocks effective byte consumption',t=>{
 const f=withFixture(t),produced=f.produce(),directory=fs.mkdtempSync(path.join(os.tmpdir(),'figma-corrupt-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const body=plan(produced),transport=JSON.parse(/<KODJO_VNEXT_UI_ATOMICITY_JSON>([\s\S]*?)<\/KODJO_VNEXT_UI_ATOMICITY_JSON>/.exec(body)[1]);
 transport.figma_references[0].packet.metadata.resources[0].base64='';assert.throws(()=>F.consume(body.replace(/<KODJO_VNEXT_UI_ATOMICITY_JSON>[\s\S]*?<\/KODJO_VNEXT_UI_ATOMICITY_JSON>/,'<KODJO_VNEXT_UI_ATOMICITY_JSON>'+JSON.stringify(transport)+'</KODJO_VNEXT_UI_ATOMICITY_JSON>'),directory,'IMPLEMENTATION_REVIEWER'),/HASH_INVALID|BYTES_MISMATCH/);
 const p=structuredClone(f.snapshot);p.resources=[];assert.throws(()=>F.validate(seal(p)),/SCREENSHOT_REQUIRED/);
 const packed=F.pack(f.snapshot);packed.nodes[0][5].pop();assert.throws(()=>F.unpack(packed),/HASH_INVALID/);
});
test('real qualification frame 4478:7209: complete inventory, aliases, vectors, resources and lossless compact transport',()=>{
 const p=require('../../.github/orchestration/vnext12/VNEXT-12-QUALIF/v8-consolidation/figma-zones/frozen-source.json');F.validate(p,{ready:true});
 assert.equal(p.nodes.length,222);assert.equal(p.variables.length,50);assert.equal(p.states.filter(s=>s.disposition==='REQUIRED').length,24);assert.equal(p.resources.length,4);
 assert.equal(F.required(p).length,1237);assert.equal(p.decisions.length,8425);
 const packed=F.pack(p);assert.deepEqual(F.unpack(packed),p);assert.ok(Buffer.byteLength(JSON.stringify(packed))<Buffer.byteLength(JSON.stringify(p))*.25);
 const adapt=p.decisions.find(d=>d.element_id==='4478:7209'&&d.property==='constraints');assert.deepEqual(adapt.rule.viewports,[360,402,440]);
 assert.ok(adapt.rule.value.constraints.some(c=>c.field==='minimumTouchHeight'&&c.value===44));
 const labels=p.decisions.filter(d=>d.property==='characters'&&d.disposition==='REALIZE');
 assert.deepEqual(labels.map(d=>d.element_id).sort(),['4953:6611','I4953:6624;4152:6181'].sort());
 assert.ok(p.decisions.filter(d=>d.property==='characters'&&!labels.includes(d)).every(d=>d.disposition==='OBSERVED_ONLY'));
 assert.deepEqual(labels.map(d=>d.rule.value).sort(),['Créer une zone corporelle','Zones corporelles'].sort());
});
