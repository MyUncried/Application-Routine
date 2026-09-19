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
function selectReview(run,comments,repository){
  if(!run || run.path!=='.github/workflows/kodjo-slice-implementation-review.yml' ||
     run.head_repository?.full_name!==repository || !['issue_comment','repository_dispatch'].includes(run.event))throw Error('ENV_SYNC_REVIEW_RUN_INVALID');
  if(run.status!=='completed'||run.conclusion!=='success')return null;
  const start=Date.parse(run.run_started_at),end=Date.parse(run.updated_at);
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
  const [repository,runId,outputFile]=argv;
  if(!/^[\w.-]+\/[\w.-]+$/.test(repository||'')||!/^\d+$/.test(runId||'')||!outputFile)throw Error('ENV_SYNC_REVIEW_RUN_INPUT_INVALID');
  const run=gh(repository,'actions/runs/'+runId);
  const pages=gh(repository,'issues/comments?per_page=100&since='+encodeURIComponent(run.run_started_at),true);
  const review=selectReview(run,pages.flat(),repository);
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
