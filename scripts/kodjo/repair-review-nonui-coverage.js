#!/usr/bin/env node
'use strict';
// Deterministic repair of one review format slip, decided by Hermann (option A after run 36867721125):
// the reviewer listed, in non_ui_plan_assessment, a requirement that belongs to the UI domain
// (bound to a UI criterion) in addition to the exact non-UI list. Only such extra rows may be
// removed, and only when they carry no negative signal (status CONFORME, no FAIL proof).
// A missing or duplicated non-UI requirement, or any other extra row, keeps the review rejected.
// The unchanged strict validator runs again on the result.
const fs=require('node:fs');
function fail(code,detail){throw new Error(code+(detail?': '+detail:''));}
function repair(input,review){
  const expected=new Set((input.non_ui_requirements||[]).map(r=>String(r.requirement_id)));
  const uiBound=new Set((input.criteria||[]).map(c=>String(c&&c.requirement_id||'')).filter(Boolean));
  const rows=review&&review.non_ui_plan_assessment&&Array.isArray(review.non_ui_plan_assessment.requirements)
    ? review.non_ui_plan_assessment.requirements : null;
  if(!rows)fail('NON_UI_REPAIR_ASSESSMENT_MISSING');
  const ids=rows.map(r=>String(r&&r.requirement_id||''));
  if(new Set(ids).size!==ids.length)fail('NON_UI_REPAIR_DUPLICATE_ROW');
  const missing=[...expected].filter(id=>!ids.includes(id));
  if(missing.length)fail('NON_UI_REPAIR_MISSING_REQUIREMENT',missing.join(','));
  const removed=[];
  for(const row of rows){
    const id=String(row&&row.requirement_id||'');
    if(expected.has(id))continue;
    if(!uiBound.has(id))fail('NON_UI_REPAIR_EXTRA_NOT_UI_BOUND',id);
    const proofs=Array.isArray(row.proof_results)?row.proof_results:[];
    if(row.status!=='CONFORME'||proofs.some(p=>p&&p.status==='FAIL'))fail('NON_UI_REPAIR_EXTRA_CARRIES_SIGNAL',id+':'+row.status);
    removed.push(id);
  }
  if(!removed.length)fail('NON_UI_REPAIR_NOTHING_TO_REMOVE');
  const repaired=JSON.parse(JSON.stringify(review));
  repaired.non_ui_plan_assessment.requirements=repaired.non_ui_plan_assessment.requirements.filter(r=>expected.has(String(r.requirement_id)));
  return {review:repaired,removed};
}
if(require.main===module){
  try{
    const [inputFile,reviewFile,outFile]=process.argv.slice(2);
    if(!inputFile||!reviewFile||!outFile)fail('USAGE','repair-review-nonui-coverage.js <input.json> <review.json> <out.json>');
    const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
    const {review,removed}=repair(read(inputFile),read(reviewFile));
    fs.writeFileSync(outFile,JSON.stringify(review,null,2)+'\n','utf8');
    process.stdout.write('[KODJO_V2] non-UI review coverage repaired — removed UI-bound duplicates: '+removed.join(',')+'\n');
  }catch(e){process.stderr.write(String(e.message||e)+'\n');process.exitCode=1;}
}
module.exports={repair};
