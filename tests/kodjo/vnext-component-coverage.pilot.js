'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../../scripts/kodjo/lib/vnext-contract'),F=require('../../scripts/kodjo/lib/vnext-figma-source');
const C=require('../../scripts/kodjo/lib/vnext-component-coverage'),Review=require('../../scripts/kodjo/lib/review-contract');
const Fixture=require('./helpers/vnext-figma-fixture'),Attestation=require('./helpers/review-attestation-fixture');
const {fixture}=require('./helpers/vnext-component-fixture');
function reviewed(produced,omit=[]){const context=produced.artifacts.reviewContext,semantic=Attestation.semantic(context,[]);semantic.reviewed_target_ids=semantic.reviewed_target_ids.filter(id=>!omit.includes(id));return {context,semantic};}
test('new preparations on two identities retain every assertion and inherit review only after common and mapping targets are actually covered',t=>{
 for(const slice of ['VNEXT-REUSE-A','VNEXT-REUSE-B']){
  const f=fixture(t,{slice}),p=f.produce(),ui=p.artifacts.uiAtomicityContract,plan=ui.component_coverage;
  assert.equal(plan.inheritance_links.length,2);assert.equal(plan.assertion_count,ui.assertion_count);
  const inherited=plan.inheritance_links.map(r=>r.assertion_id),{context,semantic}=reviewed(p,inherited),report=Review.buildReviewReport({reviewContext:context,semanticReview:semantic});
  assert.equal(report.verdict,'APPROVE');assert.deepEqual(report.inherited_target_ids,[...inherited].sort());assert.deepEqual(report.pending_target_ids,[]);
  assert.ok(report.inherited_target_ids.every(id=>!report.reviewed_target_ids.includes(id)));Review.validateReviewReport(report,context);
  semantic.reviewed_target_ids=semantic.reviewed_target_ids.filter(id=>id!==plan.inheritance_links[0].common_assertion_id);
  assert.throws(()=>Review.buildReviewReport({reviewContext:context,semanticReview:semantic}),/COVERAGE_INCOMPLETE/);
  assert.deepEqual(C.covered(plan,plan.inheritance_links.map(r=>r.common_assertion_id)),[]);
 }
});
test('distinct master variants retain distinct canonical obligations; instance parameters, overrides and detached nodes stay direct',t=>{
 const variants=fixture(t,{variant:true}).produce().artifacts.uiAtomicityContract.component_coverage;
 assert.equal(new Set(variants.inheritance_links.map(r=>r.common_assertion_id)).size,2);
 for(const options of [{overrides:[{id:'2:1',overriddenFields:['cornerRadius']}]},{mapping:false}])assert.equal(fixture(t,options).produce().artifacts.uiAtomicityContract.component_coverage.inheritance_links.length,0);
 assert.equal(fixture(t,{detached:true}).produce().artifacts.uiAtomicityContract.component_coverage.inheritance_links.length,1);
 const param=fixture(t,{parameter:true}).produce().artifacts.uiAtomicityContract.component_coverage;assert.equal(param.inheritance_links.length,1);assert.equal(param.direct_reasons.INSTANCE_PARAMETERS_REQUIRE_DEPENDENCY_QUALIFICATION,1);
});
test('token changes invalidate exact context/signature; functional and integration checks never inherit from visual component proof',t=>{
 const a=fixture(t).produce(),b=fixture(t,{token:25}).produce(),old=a.artifacts.uiAtomicityContract.component_coverage,newer=b.artifacts.uiAtomicityContract.component_coverage;
 assert.notEqual(old.inheritance_links[0].signature,newer.inheritance_links[0].signature);
 const {context,semantic}=reviewed(a),report=Review.buildReviewReport({reviewContext:context,semanticReview:semantic});assert.throws(()=>Review.validateReviewReport(report,b.artifacts.reviewContext),/CONTEXT_MISMATCH/);
 for(const level of ['INSTANCE','INTEGRATION'])assert.ok(old.levels[level].every(id=>!old.inheritance_links.some(r=>r.assertion_id===id)));
 const ids=Object.values(old.levels).flat();assert.equal(new Set(ids).size,a.artifacts.uiAtomicityContract.assertion_count);
});
test('captured layer renames preserve unrelated common observables; observable overrides and malformed provenance stay direct',t=>{
 const renamed=fixture(t,{overrides:[{id:'2:1',overriddenFields:['name']}]}).produce().artifacts.uiAtomicityContract.component_coverage;
 assert.equal(renamed.inheritance_links.length,2);
 for(const fields of [['fills'],['width'],['name','cornerRadius']])assert.equal(fixture(t,{overrides:[{id:'2:1',overriddenFields:fields}]}).produce().artifacts.uiAtomicityContract.component_coverage.inheritance_links.length,0);
 assert.equal(C.hasObservableOverrides({properties:{overrides:[{id:'2:1',overriddenFields:['name']}]}},'name'),true);
 assert.equal(C.hasObservableOverrides({properties:{overrides:[{id:'2:1'}]}},'cornerRadius'),true);
});
test('historical contracts without component coverage retain their exact serialized meaning and hashes',t=>{
 const f=fixture(t),p=f.produce(),ui=p.artifacts.uiAtomicityContract;
 const {component_coverage,component_bindings,component_reuse_decisions,contract_hash,...historic}=ui;
 const legacy=V.sealContract(historic);require('../../scripts/kodjo/lib/ui-atomicity-contract').validateUiAtomicityContract(legacy,p.artifacts);assert.equal(legacy.component_coverage,undefined);
 const broken=structuredClone(ui);broken.component_coverage.levels.INTEGRATION=[];assert.throws(()=>require('../../scripts/kodjo/lib/ui-atomicity-contract').validateUiAtomicityContract(broken,p.artifacts),/HASH_MISMATCH/);
});
test('observed-only masters can qualify through one explicitly mapped canonical occurrence without inventing a new source obligation',t=>{
 const f=fixture(t,{masterObservedOnly:true}),ui=f.produce().artifacts.uiAtomicityContract;
 assert.equal(ui.component_coverage.inheritance_links.length,1);
 assert.equal(ui.component_coverage.direct_reasons.COMMON_PROPERTY_REQUIRES_DIRECT_QUALIFICATION,1);
 assert.equal(ui.assertion_count,Object.values(ui.component_coverage.levels).flat().length);
});
test('large-review admission cannot replace missing reuse analysis by cumulative review alone; a direct decision covers no property',t=>{
 const f=fixture(t,{missingOverrideCapture:true}),ui=f.produce().artifacts.uiAtomicityContract;
 assert.equal(ui.component_coverage.inheritance_links.length,0);assert.throws(()=>C.assertReviewReady(ui),/QUALIFICATION_REQUIRED_BEFORE_LARGE_REVIEW/);
 const source=f.manifest.sources.find(s=>s.source_kind==='FIGMA').source_id;
 f.recipe.uiInput.componentReuseDecisions=[{source_id:source,master_id:'3:2',disposition:'DIRECT_JUSTIFIED',reason:'TEST ONLY explicit direct-treatment rationale; must be independently assessed, never a qualification or coverage',evidence_refs:['git:'+f.head+':src/shared/ui/Existing.js']}];
 const direct=f.produce().artifacts.uiAtomicityContract;C.assertReviewReady(direct);assert.equal(direct.component_coverage.direct_assertion_count,direct.assertion_count);assert.equal(direct.component_coverage.inheritance_links.length,0);
});
