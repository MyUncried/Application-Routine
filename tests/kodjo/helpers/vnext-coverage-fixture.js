'use strict';
const V=require('../../../scripts/kodjo/lib/vnext-contract'),Review=require('../../../scripts/kodjo/lib/review-contract');
function evidence(count=3) {
 const F=require('./vnext-planning-fixture'),repo=F.fixtureRepo();
 try {
  const manifest=F.sourceManifest(),a=F.buildPlanningArtifacts({repo,manifest,envelope:F.makeEnvelope(manifest,repo,'INITIAL',null)});
  const context=structuredClone(a.reviewContext);delete context.contract_hash;
  context.target_catalog.CANDIDATE=Array.from({length:200},(_,i)=>'SECONDARY-'+i);
  context.coverage_policy.optional_target_ids=context.target_catalog.CANDIDATE.slice(-4);
  const sealed=V.sealContract(context),all=Object.values(sealed.target_catalog).flat();
  const omitted=sealed.coverage_policy.optional_target_ids.slice(0,count);
  const report=Review.buildReviewReport({reviewContext:sealed,semanticReview:{findings:[],finding_resolutions:[],reviewed_target_ids:all.filter(id=>!omitted.includes(id))}});
  return {context:sealed,report};
 } finally {require('node:fs').rmSync(repo.cwd,{recursive:true,force:true});}
}
function plan(e=evidence()) {return 'plan_contract_hash='+e.report.plan_contract_hash+'\n<KODJO_VNEXT_REVIEW_COVERAGE_JSON>'+JSON.stringify(e)+'</KODJO_VNEXT_REVIEW_COVERAGE_JSON>';}
function coverage(){return require('../../../scripts/kodjo/lib/vnext-review-coverage').fromPlan(plan());}
module.exports={evidence,plan,coverage};
