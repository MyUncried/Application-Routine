#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {verify}=require('./verify-v2-finalization');
const MARKER='[KODJO_V2] TARGETED_VALIDATION_OUTPUT';
function gh(args,input) {
  const r=spawnSync('gh',args,{input,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:32*1024*1024});
  if(r.error||r.status!==0) throw new Error('TARGETED_GITHUB_FAILED: '+(r.error?.message||r.stderr));
  return r.stdout;
}
function one(body,key) {
  const matches=[...body.matchAll(new RegExp('^'+key+'=([^\\n]+)$','gm'))];
  if(matches.length!==1) throw new Error('TARGETED_FIELD_INVALID: '+key);
  return matches[0][1].trim();
}
function assertComment(comment,issueUrl,author) {
  if(comment.issue_url!==issueUrl || comment.user?.login!==author) throw new Error('TARGETED_COMMENT_AUTHORITY_INVALID');
}
function checkpointBody(proof) {
  return MARKER+'\nslice_id='+proof.slice_id+'\nsource_validation_comment_id='+proof.human_device_approval_comment_id+
    '\nSTATUT : REQUALIFICATION_REQUIRED\n\n<KODJO_TARGETED_VALIDATION_JSON>\n'+JSON.stringify(proof,null,2)+'\n</KODJO_TARGETED_VALIDATION_JSON>\n';
}
function main(argv, transport=gh) {
  const [mode,repo,issue,id,output]=argv;
  if(!['record','resolve'].includes(mode)||!/^[-\w.]+\/[-\w.]+$/.test(repo||'')||!/^\d+$/.test(issue||'')||!/^\d+$/.test(id||'')||!output) throw new Error('TARGETED_ARGUMENTS_INVALID');
  const issueUrl='https://api.github.com/repos/'+repo+'/issues/'+issue;
  const api=(endpoint)=>JSON.parse(transport(['api','repos/'+repo+'/'+endpoint]));
  let humanId=id,checkpoint=null;
  if(mode==='resolve') {
    checkpoint=api('issues/comments/'+id);
    assertComment(checkpoint,issueUrl,'github-actions[bot]');
    if(!checkpoint.body.startsWith(MARKER+'\n')) throw new Error('TARGETED_CHECKPOINT_MARKER_INVALID');
    humanId=one(checkpoint.body,'source_validation_comment_id');
    if(!/^\d+$/.test(humanId)) throw new Error('TARGETED_HUMAN_ID_INVALID');
  }
  const human=api('issues/comments/'+humanId);
  assertComment(human,issueUrl,'MyUncried');
  const body=String(human.body||'').replace(/\r/g,'');
  if(body.split('\n')[0]!=='[KODJO_SLICE] TARGETED_VISUAL_APPROVED_REQUALIFY') throw new Error('TARGETED_HUMAN_MARKER_INVALID');
  const reviewId=one(body,'source_review_comment_id');
  if(!/^\d+$/.test(reviewId)) throw new Error('TARGETED_REVIEW_ID_INVALID');
  const review=api('issues/comments/'+reviewId);
  assertComment(review,issueUrl,'github-actions[bot]');
  const implId=one(review.body.replace(/\r/g,''),'source_implementation_comment_id');
  if(!/^\d+$/.test(implId)) throw new Error('TARGETED_IMPLEMENTATION_ID_INVALID');
  const impl=api('issues/comments/'+implId);
  assertComment(impl,issueUrl,'github-actions[bot]');
  const queuePath=one(impl.body.replace(/\r/g,''),'v2_queue_path');
  if(!/^\.github\/orchestration\/queue\/v2\/[A-Za-z0-9._-]+\.json$/.test(queuePath)) throw new Error('TARGETED_QUEUE_PATH_INVALID');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-targeted-'));
  let proof;
  try {
    const files=['review.md','impl.md','human.md'].map(x=>path.join(dir,x));
    [review.body,impl.body,body].forEach((v,i)=>fs.writeFileSync(files[i],v,'utf8'));
    proof=verify([...files,queuePath,issue,reviewId,humanId,path.join(dir,'proof.json')]);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
  if(proof.final_status!=='REQUALIFICATION_REQUIRED'||proof.global_approval!==false) throw new Error('TARGETED_GLOBAL_STATUS_INVALID');
  const pr=api('pulls/'+proof.application_pr);
  if(pr.state!=='open'||pr.base?.ref!=='main'||pr.head?.sha!==proof.head||pr.head?.ref!==proof.application_branch) throw new Error('TARGETED_PR_MOVED');
  if(api('git/ref/heads/'+encodeURIComponent(proof.application_branch)).object?.sha!==proof.head) throw new Error('TARGETED_BRANCH_MOVED');
  const expected=checkpointBody(proof);
  if(mode==='resolve') {
    if(checkpoint.body!==expected) throw new Error('TARGETED_CHECKPOINT_DRIFT');
    fs.writeFileSync(output,proof.replan_trigger+'targeted_validation_comment_id='+id+'\n','utf8');
    fs.writeFileSync(output+'.proof.json',JSON.stringify(proof,null,2)+'\n','utf8');
  } else {
    const pages=JSON.parse(transport(['api','--paginate','--slurp','repos/'+repo+'/issues/'+issue+'/comments?per_page=100']));
    const matches=pages.flat().filter(c=>c.user?.login==='github-actions[bot]' && c.body?.startsWith(MARKER+'\n') && c.body.includes('\nsource_validation_comment_id='+humanId+'\n'));
    if(matches.length>1 || (matches.length===1 && matches[0].body!==expected)) throw new Error('TARGETED_CHECKPOINT_AMBIGUOUS');
    checkpoint=matches[0]||JSON.parse(transport(['api','-X','POST','repos/'+repo+'/issues/'+issue+'/comments','--input','-'],JSON.stringify({body:expected})));
    fs.writeFileSync(output,String(checkpoint.id)+'\n','utf8');
  }
}
if(require.main===module) {try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={main,checkpointBody,assertComment,one};
