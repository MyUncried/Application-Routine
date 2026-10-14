'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const V=require('../../scripts/kodjo/lib/vnext-contract'),F=require('../../scripts/kodjo/lib/vnext-figma-source'),Impl=require('../../scripts/kodjo/lib/vnext-figma-implementation-review');
const Components=require('../../scripts/kodjo/lib/vnext-component-implementation-coverage'),Adapter=require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter');
const {fixture}=require('./helpers/vnext-component-fixture');
function prepare(t){
 const f=fixture(t,{launch:true}),p=f.produce(),a=p.artifacts,body=Adapter.renderCompatibilityPlan({application_head:a.planningEnvelope.application_head,plan_contract_hash:a.planContract.contract_hash},a.planContract,a.uiAtomicityContract,a.requirementRegistry,a.candidateManifest);
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-component-impl-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const expected=F.required(f.snapshot),scenarios=f.snapshot.states.flatMap(s=>s.scenarios),facts={properties:Object.fromEntries(expected.map(d=>[d.property_id,d.rule.value])),scenarios:Object.fromEntries(scenarios.map(s=>[s.scenario_id,true]))},bytes=JSON.stringify(facts);
 fs.writeFileSync(path.join(directory,'execution.json'),bytes);
 const artifact={artifact_path:'execution.json',artifact_sha256:V.sha256(bytes),observer:'EXECUTED_JSON_FACT',delivery_head:f.head};
 const measurements=expected.flatMap(d=>d.rule.viewports.map(viewport=>({...artifact,measurement_id:d.property_id+'@'+viewport,reference_hash:f.snapshot.contract_hash,property_id:d.property_id,viewport,value:d.rule.value,value_path:['properties',d.property_id],evidence:'TEST ONLY property fact; not pixel/device conformity'})));
 const scenarioResults=scenarios.map(s=>({...artifact,scenario_id:s.scenario_id,reference_hash:f.snapshot.contract_hash,status:'PASS',value:true,value_path:['scenarios',s.scenario_id],proof_results:s.proof_required.map(proof_type=>({proof_type,status:'PASS'}))}));
 return {f,p,body,options:{cwd:f.cwd,approvedPlanSha256:V.sha256(body),deliveryHead:f.head,evidenceDirectory:directory,measurements,scenarioResults,portableReceipt:true}};
}
function assessment(d){const omit=d.component_review.plan.inheritance_links.map(l=>l.assertion_id);return {verdict:'APPROVE',reference_hashes:d.observation.references.map(r=>r.reference_hash),reviewed_assertion_ids:d.assertion_ids.filter(id=>!omit.includes(id)),reviewed_scenario_ids:d.scenario_ids,component_mapping_observations:d.component_review.mapping_facts.map(f=>({criterion_id:f.criterion_id,status:'MATCH',observed_files:f.files.map(({materialized_path,...row})=>row),reason:'TEST ONLY injected mapping observation, no real semantic qualification'})),findings:[],reservations:d.limits,reason:'TEST ONLY contract qualification; no product proof'};}
test('implementation review derives inherited coverage from its own versioned code observations and raw receipt, never from the plan verdict',t=>{
 const {f,body,options}=prepare(t);let calls=0;
 const receipt=Impl.review(body,{...options,claude:'TEST-INJECTED',invoke:(_bin,args,_cwd,input)=>{
  calls++;const {dossier}=JSON.parse(input);assert.ok(JSON.parse(args[args.indexOf('--json-schema')+1]).required.includes('component_mapping_observations'));
  return JSON.stringify({type:'result',session_id:'TEST-ONLY',structured_output:assessment(dossier)});
 }});
 assert.equal(calls,1);assert.equal(receipt.component_coverage.inherited_assertion_ids.length,2);
 const raw=fs.readFileSync(path.join(options.evidenceDirectory,'implementation-review-response.json'),'utf8');Impl.verifyReceipt(body,options,receipt,raw);
 assert.deepEqual(Impl.review(body,{...options,invoke:()=>{throw Error('DUPLICATE_MODEL_CALL');}}),receipt);
 const moved=path.join(path.dirname(options.evidenceDirectory),path.basename(options.evidenceDirectory)+'-moved');fs.cpSync(options.evidenceDirectory,moved,{recursive:true});t.after(()=>fs.rmSync(moved,{recursive:true,force:true}));Impl.verifyReceipt(body,{...options,evidenceDirectory:moved},receipt,raw);
 const d=Impl.prepare(body,options),bad=assessment(d);bad.component_mapping_observations[0].observed_files[0].sha256='a'.repeat(64);assert.throws(()=>Impl.validateAssessment(d,bad),/SOURCE_UNVERIFIED/);
 const missing=assessment(d);delete missing.component_mapping_observations;assert.throws(()=>Impl.validateAssessment(d,missing),/MAPPING_REVIEW_REQUIRED/);
 const noCommon=assessment(d);noCommon.reviewed_assertion_ids=noCommon.reviewed_assertion_ids.filter(id=>id!==d.component_review.plan.inheritance_links[0].common_assertion_id);assert.throws(()=>Impl.validateAssessment(d,noCommon),/ASSERTIONS_UNCOVERED/);
 // Actual changed Git bytes get a new signature even if the Figma value stays.
 f.write('src/shared/ui/Existing.js','module.exports={Existing:false};\n');f.git('add','.');f.git('commit','-m','TEST ONLY changed component implementation');const changed=f.git('rev-parse','HEAD');
 const newer=Components.prepare(F.unpackUi(d.ui),{cwd:f.cwd,deliveryHead:changed,evidenceDirectory:options.evidenceDirectory});assert.notEqual(newer.signature,d.component_review.signature);
 assert.throws(()=>Components.coverage({...d,component_review:newer},assessment(d)),/SOURCE_UNVERIFIED/);
});
