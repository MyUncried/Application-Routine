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
test('common qualification import revalidates the old raw receipt and actual code, excludes instance/integration and invalidates token drift',t=>{
 const Q=require('../../scripts/kodjo/lib/vnext-qualified-component-import'),{f,body,options}=prepare(t);
 const receipt=Impl.review(body,{...options,claude:'TEST-INJECTED',invoke:(_b,_a,_c,input)=>JSON.stringify({type:'result',session_id:'TEST-IMPORT-ONLY',structured_output:assessment(JSON.parse(input).dossier)})});
 const raw=fs.readFileSync(path.join(options.evidenceDirectory,'implementation-review-response.json'),'utf8'),d=Impl.prepare(body,options),current={...d,approved_plan_sha256:'d'.repeat(64)};
 const source={previousPlanBody:body,previousOptions:options,previousReceipt:receipt,previousRaw:raw,currentDossier:current,currentCwd:f.cwd};
 const imported=Q.fromPreviousReview(source);assert.ok(imported.imported_common_assertions.length>0);assert.deepEqual(imported.previous_session_ids,['TEST-IMPORT-ONLY']);assert.equal(imported.phase,'COMMON_REVIEW_ONLY_INSTANCE_AND_INTEGRATION_STILL_DIRECT');Q.verify(imported,source);
 const second=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-qualified-current-'));t.after(()=>fs.rmSync(second,{recursive:true,force:true}));fs.copyFileSync(path.join(options.evidenceDirectory,'execution.json'),path.join(second,'execution.json'));
 const nextOptions={...options,evidenceDirectory:second,qualifiedCommonReviews:[{previousPlanBody:body,previousOptions:options,previousReceipt:receipt,previousRaw:raw}]};
 const next=Impl.review(body,{...nextOptions,claude:'TEST-INJECTED',invoke:(_b,_a,_c,input)=>{const d=JSON.parse(input).dossier,a=assessment(d),ids=d.qualified_common_imports.flatMap(q=>q.imported_common_assertions.map(x=>x.assertion_id));a.reviewed_assertion_ids=a.reviewed_assertion_ids.filter(id=>!ids.includes(id));return JSON.stringify({type:'result',session_id:'TEST-NEW-CONTEXT',structured_output:a});}});
 assert.ok(next.component_coverage.qualified_common_assertion_ids.length>0);assert.equal(next.assessment.reviewed_assertion_ids.some(id=>next.component_coverage.qualified_common_assertion_ids.includes(id)),false);Impl.verifyReceipt(body,nextOptions,next,fs.readFileSync(path.join(second,'implementation-review-response.json'),'utf8'));
 assert.throws(()=>Q.fromPreviousReview({...source,previousRaw:raw+' '}),/BINDING/);
 const changed=structuredClone(current),ui=F.unpackUi(changed.ui);ui.figma_references[0].packet.variables[0].valuesByMode.MODE=999;const {contract_hash,...fields}=ui.figma_references[0].packet;ui.figma_references[0].packet=F.build(fields);changed.ui=F.packUi(ui);assert.equal(Q.fromPreviousReview({...source,currentDossier:changed}).imported_common_assertions.length,0);
 f.write('src/shared/ui/Existing.js','module.exports={Existing:false};\n');f.git('add','.');f.git('commit','-m','TEST ONLY changed imported component');assert.throws(()=>Q.fromPreviousReview({...source,currentDossier:{...current,delivery_head:f.git('rev-parse','HEAD')}}),/CODE_CHANGED/);
});
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
