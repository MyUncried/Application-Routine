#!/usr/bin/env node
'use strict';
// Guard of the single format-repair pass of the V2 implementation review.
// The repaired review may only change the derived criterion-level fields
// (criteria[].implementation_status and criteria[].proof_results[].status).
// Every reviewer judgment — assertion results, non-UI assessment, boundaries,
// evidence texts, criterion identity and order — must be byte-identical, so the
// repair can never alter the independent review itself. The strict validator
// runs again afterwards, unchanged.
const fs=require('node:fs');
function fail(code,detail){throw new Error(code+(detail?': '+detail:''));}
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
function stripDerived(review){
  const copy=JSON.parse(JSON.stringify(review));
  for(const c of Array.isArray(copy.criteria)?copy.criteria:[]){
    delete c.implementation_status;
    for(const p of Array.isArray(c.proof_results)?c.proof_results:[])delete p.status;
  }
  return copy;
}
function verify(before,after){
  if(!before||!after||typeof before!=='object'||typeof after!=='object')fail('REVIEW_REPAIR_INPUT_INVALID');
  if(canonical(stripDerived(before))!==canonical(stripDerived(after)))fail('REVIEW_REPAIR_CHANGED_REVIEWER_JUDGMENT');
  const changed=[];
  before.criteria.forEach((c,i)=>{
    const a=after.criteria[i];
    if(c.implementation_status!==a.implementation_status)changed.push(c.criterion_id+'.implementation_status:'+c.implementation_status+'->'+a.implementation_status);
    (c.proof_results||[]).forEach((p,j)=>{if(p.status!==a.proof_results[j].status)changed.push(c.criterion_id+'.'+p.proof_type+':'+p.status+'->'+a.proof_results[j].status);});
  });
  return changed;
}
if(require.main===module){
  try{
    const [beforeFile,afterFile]=process.argv.slice(2);
    if(!beforeFile||!afterFile)fail('USAGE','verify-review-format-repair.js <before.json> <after.json>');
    const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
    const changed=verify(read(beforeFile),read(afterFile));
    process.stdout.write('[KODJO_V2] review format repair confined to derived fields: '+(changed.join('; ')||'none')+'\n');
  }catch(e){process.stderr.write(String(e.message||e)+'\n');process.exitCode=1;}
}
module.exports={verify,stripDerived};
