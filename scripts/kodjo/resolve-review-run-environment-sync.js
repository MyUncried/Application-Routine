#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {resolve,one,firstLine}=require('./resolve-review-environment-sync');
function gh(repository,suffix,paginate=false){
  const args=['api','repos/'+repository+'/'+suffix];if(paginate)args.push('--paginate','--slurp');
  const r=cp.spawnSync('gh',args,{encoding:'utf8',shell:false,windowsHide:true,maxBuffer:32*1024*1024});
  if(r.error||r.status!==0)throw Error('ENV_SYNC_GITHUB_READ_FAILED');
  return JSON.parse(r.stdout);
}
function selectReview(run,comments,repository,expectedRunId=run?.id,expectedAttempt=run?.run_attempt,jobs=[]){
  if(String(run?.id)!==String(expectedRunId)||String(run?.run_attempt)!==String(expectedAttempt))throw Error('ENV_SYNC_REVIEW_RUN_IDENTITY_MISMATCH');
  const routed=run?.path==='.github/workflows/kodjo-v2-comment-router.yml' && run.event==='issue_comment';
  if(!run || (!routed && run.path!=='.github/workflows/kodjo-slice-implementation-review.yml') ||
     run.head_repository?.full_name!==repository || !['issue_comment','repository_dispatch'].includes(run.event))throw Error('ENV_SYNC_REVIEW_RUN_INVALID');
  let reviewEnd=run.updated_at;
  if(routed){
    if(!['in_progress','completed'].includes(run.status))return null;
    if(run.status==='completed' && run.conclusion!=='success')return null;
    // The API is queried for this exact attempt. Parent success alone is insufficient:
    // ordinary comments also complete successfully without executing a review.
    const reviews=jobs.filter(j=>j.name==='Generic implementation review / review');
    if(reviews.length!==1)return null;
    const job=reviews[0];
    if(String(job.run_id)!==String(run.id)||job.status!=='completed'||job.conclusion!=='success')return null;
    if(!Number.isFinite(Date.parse(job.started_at))||Date.parse(job.started_at)<Date.parse(run.run_started_at))throw Error('ENV_SYNC_REVIEW_JOB_TIME_INVALID');
    reviewEnd=job.completed_at;
  }else if(run.status!=='completed'||run.conclusion!=='success')return null;
  const start=Date.parse(run.run_started_at),end=Date.parse(reviewEnd);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)throw Error('ENV_SYNC_REVIEW_RUN_TIME_INVALID');
  const matches=comments.filter(c=>{
    const body=String(c.body||'').replace(/\r/g,'');
    if(c.user?.login!=='github-actions[bot]'||firstLine(body)!=='[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT')return false;
    const created=Date.parse(c.created_at);
    if(!Number.isFinite(created)||created<start||created>end)return false;
    try{return one(body,'source_review_run_id')===String(run.id)&&one(body,'source_review_run_attempt')===String(run.run_attempt);}
    catch(_){return false;}
  });
  if(matches.length>1)throw Error('ENV_SYNC_REVIEW_RUN_AMBIGUOUS');
  if(!matches.length)return null;
  const review=matches[0];
  if(one(review.body,'verdict')!=='APPROVE')return null;
  return review;
}
function main(argv){
  const [repository,runId,runAttempt,outputFile]=argv;
  if(!/^[\w.-]+\/[\w.-]+$/.test(repository||'')||!/^\d+$/.test(runId||'')||! /^[1-9]\d*$/.test(runAttempt||'')||!outputFile)throw Error('ENV_SYNC_REVIEW_RUN_INPUT_INVALID');
  const run=gh(repository,'actions/runs/'+runId+'/attempts/'+runAttempt);
  const pages=gh(repository,'issues/comments?per_page=100&since='+encodeURIComponent(run.run_started_at),true);
  const jobs=run.path==='.github/workflows/kodjo-v2-comment-router.yml'
    ? gh(repository,'actions/runs/'+runId+'/attempts/'+runAttempt+'/jobs?per_page=100',true).flatMap(p=>p.jobs)
    : [];
  const review=selectReview(run,pages.flat(),repository,runId,runAttempt,jobs);
  let result={schema:'kodjo.environment.review-sync.v1',applicable:false,source_review_run_id:runId};
  if(review){
    const implementation=gh(repository,'issues/comments/'+one(review.body,'source_implementation_comment_id'));
    if(/^continuity_origin=V2_LEAN_QUEUE$/m.test(String(implementation.body||'').replace(/\r/g,''))){
      const pr=gh(repository,'pulls/'+one(implementation.body,'application_pr'));
      result={...resolve(review,implementation,pr),applicable:true,source_review_run_id:runId};
      const ref=gh(repository,'git/ref/heads/'+result.application_branch.split('/').map(encodeURIComponent).join('/'));
      if(ref.object?.sha!==result.application_head)throw Error('ENV_SYNC_APPLICATION_HEAD_MOVED');
    }
  }
  fs.writeFileSync(path.resolve(outputFile),JSON.stringify(result,null,2)+'\n');
  process.stdout.write('[KODJO_ENV] REVIEW_RUN_SYNC_'+(result.applicable?'READY':'NOT_APPLICABLE')+' run='+runId+'\n');
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){process.stderr.write(e.message+'\n');process.exit(1);}}
module.exports={selectReview};
