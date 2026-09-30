#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const {canonicalJson,extractTaggedJson}=require('./lib/plan-impact');

function optional(body,tag){
  if(!body.includes('<'+tag+'>'))return null;
  return extractTaggedJson(body,tag);
}
function paired(base,candidate,tag){
  const before=optional(base,tag),after=optional(candidate,tag);
  if(Boolean(before)!==Boolean(after))throw new Error('PLAN_REVISION_CONTRACT_REMOVED_OR_ADDED:'+tag);
  return [before,after];
}
function map(rows,key,label){
  const out=new Map();
  for(const row of rows||[]){
    const id=String(key(row)||'');
    if(!id||out.has(id))throw new Error('PLAN_REVISION_IDENTITY_INVALID:'+label+':'+id);
    out.set(id,row);
  }
  return out;
}
function targetsOf(row,id){
  return new Set([id,row?.source?.path,...(row?.change_targets||[]),...(row?.tests||[]),row?.path].filter(Boolean).map(String));
}
function verify(basePlan,baseReview,candidate){
  const review=optional(baseReview,'KODJO_PLAN_REVIEW_FINDINGS_JSON');
  if(!review){
    if(/^(?:verdict=APPROVE|VERDICT:\s*APPROVE|Verdict\s*:\s*`?APPROVED`?|STATUT\s*:\s*PLAN_REVIEW_APPROVED)\s*$/m.test(baseReview))return {status:'APPROVED_BASE_NEW_CYCLE'};
    if(/^(?:verdict=REVISE|VERDICT:\s*REVISE|Verdict\s*:\s*`?REVISE`?|STATUT\s*:\s*PLAN_REVIEW_REVISE)\s*$/m.test(baseReview))
    {
      if (basePlan.includes('<KODJO_REQUIREMENT_CONTRACT_JSON>') || /kodjo\.ui-criteria\.v[23]/.test(basePlan)) throw new Error('PLAN_REVISION_STRUCTURED_FINDINGS_REQUIRED');
      return {status:'LEGACY_UNBOUNDED',reason:'Legacy review has no structured findings; full independent revalidation required'};
    }
    throw new Error('PLAN_REVISION_STRUCTURED_FINDINGS_REQUIRED');
  }
  if(review.verdict!=='REVISE'||!Array.isArray(review.findings))throw new Error('PLAN_REVISION_REVIEW_INVALID');
  const blocking=review.findings.filter(x=>x.blocking===true);
  if(!blocking.length)throw new Error('PLAN_REVISION_BLOCKING_FINDING_MISSING');
  if(blocking.some(f=>f.target_kind==='PLAN'&&f.target!=='NON_UI_COVERAGE'))throw new Error('PLAN_REVISION_UNACTIONABLE_PLAN_TARGET');
  const successors=new Map();
  const pairSuccessors=(before,after,key,kind)=>{
    const old=map(before,key,kind),next=map(after,key,kind);
    for(const [oldId,row] of old){
      if(next.has(oldId)||!blocking.some(f=>f.target_kind===kind&&f.target===oldId))continue;
      const candidates=[...next.entries()].filter(([newId,candidate])=>!old.has(newId)&&
        candidate.source?.path===row.source?.path&&candidate.source?.locator===row.source?.locator&&
        candidate.domain===row.domain&&candidate.requirement_type===row.requirement_type);
      if(candidates.length!==1)throw new Error('PLAN_REVISION_SUCCESSOR_AMBIGUOUS:'+oldId);
      successors.set(candidates[0][0],oldId);
    }
  };
  const allowed=(row,id)=>blocking.some(f=>{
    const successor=successors.get(id)||successors.get(String(id).split(':')[0]);
    const direct=targetsOf(row,id).has(String(f.target))||String(id).split(':')[0]===String(f.target)||successor===String(f.target);
    // An unstructured dependency narrative cannot authorize arbitrary changes.
    // Every dependent item must be a separate blocking target in the review.
    return direct;
  });
  const compare=(label,before,after,key)=>{
    const old=map(before,key,label),next=map(after,key,label);
    for(const id of new Set([...old.keys(),...next.keys()])){
      const a=old.get(id),b=next.get(id);
      if(canonicalJson(a)===canonicalJson(b))continue;
      if(!allowed(a||b,id)&&!allowed(b||a,id))throw new Error('PLAN_REVISION_UNTARGETED_CHANGE:'+label+':'+id);
    }
  };
  const [oldReq,newReq]=paired(basePlan,candidate,'KODJO_REQUIREMENT_CONTRACT_JSON');
  if(oldReq&&newReq){pairSuccessors(oldReq.requirements,newReq.requirements,x=>x.requirement_id,'REQUIREMENT_ID');compare('REQUIREMENT',oldReq.requirements,newReq.requirements,x=>x.requirement_id);}
  const [oldUi,newUi]=paired(basePlan,candidate,'KODJO_UI_CRITERIA_MATRIX_JSON');
  if(oldUi&&newUi){
    pairSuccessors(oldUi.criteria,newUi.criteria,x=>x.criterion_id,'CRITERION_ID');
    compare('UI_CRITERION',oldUi.criteria,newUi.criteria,x=>x.criterion_id);
    for(const category of ['preserve','change','forbidden']){
      compare('PRESERVATION_'+category,oldUi.preservation?.[category],newUi.preservation?.[category],x=>x.target);
    }
  }
  const [oldImpact,newImpact]=paired(basePlan,candidate,'KODJO_PLAN_IMPACT_JSON');
  if(oldImpact&&newImpact){
    const oldScope=new Set(oldImpact.scope_allow||[]),newScope=new Set(newImpact.scope_allow||[]);
    for(const p of new Set([...oldScope,...newScope])){
      if(oldScope.has(p)!==newScope.has(p)&&!allowed({path:p},p))throw new Error('PLAN_REVISION_UNTARGETED_SCOPE_CHANGE:'+p);
    }
  }
  const [oldTests,newTests]=paired(basePlan,candidate,'KODJO_TEST_CONTRACT_JSON');
  if(oldTests&&newTests)compare('TEST_BINDING',oldTests.bindings,newTests.bindings,x=>x.requirement_id+':'+x.test_path);
  const [oldCoverage,newCoverage]=paired(basePlan,candidate,'KODJO_NON_UI_COVERAGE_JSON');
  if(oldCoverage&&newCoverage&&canonicalJson(oldCoverage)!==canonicalJson(newCoverage) &&
    !blocking.some(f=>f.target_kind==='PLAN'&&f.target==='NON_UI_COVERAGE')){
    throw new Error('PLAN_REVISION_UNTARGETED_NON_UI_COVERAGE_CHANGE');
  }
  return {status:'BOUNDED',blocking_findings:blocking.length};
}
if(require.main===module){
  try{
    const [baseFile,reviewFile,candidateFile,outputFile]=process.argv.slice(2);
    if(!baseFile||!reviewFile||!candidateFile)throw new Error('USAGE: verify-bounded-plan-revision.js <base-plan> <base-review> <candidate-plan>');
    const result=verify(...[baseFile,reviewFile,candidateFile].map(p=>fs.readFileSync(p,'utf8')));
    if(outputFile)fs.writeFileSync(outputFile,JSON.stringify(result,null,2)+'\n');
    process.stdout.write('[KODJO_V2] plan revision '+result.status+'\n');
  }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={verify};
