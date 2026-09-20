#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
function verify(final,comments) {
  if(final.final_status!=='READY_TO_CLOSE'||final.review_mode!=='CRITERION_COMPLETE') throw new Error('GLOBAL_REQUALIFICATION_FULL_REVIEW_REQUIRED');
  for(const comment of comments) {
    if(comment.user?.login!=='github-actions[bot]' || !String(comment.body||'').startsWith('[KODJO_V2] TARGETED_VALIDATION_OUTPUT\n')) continue;
    const match=comment.body.match(/<KODJO_TARGETED_VALIDATION_JSON>\s*([\s\S]*?)\s*<\/KODJO_TARGETED_VALIDATION_JSON>/);
    if(!match) throw new Error('GLOBAL_REQUALIFICATION_CHECKPOINT_INVALID');
    const proof=JSON.parse(match[1]);
    if(proof.slice_id!==final.slice_id||Number(proof.application_pr)!==Number(final.application_pr)) continue;
    if(proof.plan_blob_oid===final.plan_blob_oid ||
       BigInt(final.implementation_review_comment_id)<=BigInt(comment.id) ||
       BigInt(final.human_device_approval_comment_id)<=BigInt(comment.id)) {
      throw new Error('GLOBAL_REQUALIFICATION_NEW_PLAN_AND_APPROVAL_REQUIRED');
    }
  }
  return true;
}
if(require.main===module) {
  try {
    const [finalFile,commentsFile]=process.argv.slice(2);
    const comments=JSON.parse(fs.readFileSync(commentsFile,'utf8'));
    verify(JSON.parse(fs.readFileSync(finalFile,'utf8')),comments.flat());
  } catch(e) {console.error(e.message);process.exitCode=1;}
}
module.exports={verify};
