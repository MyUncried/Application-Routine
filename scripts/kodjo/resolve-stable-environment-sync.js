#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function fail(code, detail) { throw new Error(code + (detail ? ': ' + detail : '')); }
function gh(args) {
  const r=spawnSync('gh',['api',...args],{encoding:'utf8',windowsHide:true,shell:false,maxBuffer:32*1024*1024});
  if(r.error||r.status!==0) fail('ENV_SYNC_GITHUB_READ_FAILED',r.error?r.error.message:r.stderr.trim());
  return r.stdout;
}
function ghJson(args) { try{return JSON.parse(gh(args));}catch(_){fail('ENV_SYNC_GITHUB_JSON_INVALID');} }
function normalized(body){return String(body||'').replace(/\r/g,'');}
function taggedFinal(body){
  const text=normalized(body);
  if(text.split('\n')[0] !== '[KODJO_SLICE] FINAL_OUTPUT') return null;
  if(!/^STATUT : READY_TO_CLOSE$/m.test(text)) return null;
  const meta=require('./lib/machine-block').parse(text,'KODJO_UI_FINAL_VERIFICATION_JSON',{required:false,code:'ENV_SYNC_FINAL_BLOCK_INVALID'});
  if(!meta) return null;
  return {text,meta};
}
function resolve(pr, issueComments) {
  if(!pr || pr.merged !== true || pr.state !== 'closed' || pr.base?.ref !== 'main') fail('ENV_SYNC_PR_NOT_MERGED_TO_MAIN');
  const head=String(pr.head?.sha||'').toLowerCase();
  const mergeHead=String(pr.merge_commit_sha||'').toLowerCase();
  const branch=String(pr.head?.ref||'');
  if(!/^[0-9a-f]{40}$/.test(head)||!/^[0-9a-f]{40}$/.test(mergeHead)) fail('ENV_SYNC_MERGE_HEAD_INVALID');

  const matches=[];
  for(const group of issueComments){
    for(const comment of group.comments||[]){
      if(comment.user?.login !== 'github-actions[bot]') continue;
      const tagged=taggedFinal(comment.body);
      if(!tagged) continue;
      const meta=tagged.meta;
      if(Number(meta.application_pr)!==Number(pr.number)) continue;
      if(String(meta.head||'').toLowerCase()!==head) continue;
      if(String(meta.application_branch||'')!==branch) continue;
      if(String(meta.final_status||'')!=='READY_TO_CLOSE') continue;
      if(meta.review_mode === 'VISUAL_CORRECTION_DELTA' || meta.validation_scope === 'DELTA' || meta.global_approval === false) continue;
      if(String(meta.slice_id||'')==='') continue;
      if ((group.comments||[]).some(c=>c.user?.login==='github-actions[bot]' && String(c.body||'').startsWith('[KODJO_V2] TARGETED_VALIDATION_OUTPUT\n'))) {
        require('./verify-global-requalification-state').verify(meta,group.comments);
      }
      matches.push({issue_number:Number(group.issue_number),comment_id:String(comment.id),meta});
    }
  }
  if(matches.length!==1) fail('ENV_SYNC_FINAL_OUTPUT_MATCH_INVALID',String(matches.length));
  const match=matches[0];
  return {
    schema:'kodjo.environment.stable-sync.v1',
    slice_id:String(match.meta.slice_id),
    issue_number:match.issue_number,
    final_output_comment_id:match.comment_id,
    application_pr:Number(pr.number),
    application_branch:branch,
    base_head:String(pr.base?.sha||'').toLowerCase(),
    delivered_head:head,
    main_merge_head:mergeHead,
  };
}
function main(argv){
  const [repository, prNumber, outputFile]=argv;
  if(!repository||!/^[0-9]+$/.test(String(prNumber||''))||!outputFile) fail('USAGE','resolve-stable-environment-sync.js <owner/repo> <pr-number> <output.json>');
  const pr=ghJson(['repos/'+repository+'/pulls/'+prNumber]);
  if(pr.merged!==true||pr.base?.ref!=='main') fail('ENV_SYNC_PR_NOT_MERGED_TO_MAIN');

  const q='repo:'+repository+' "application_pr='+prNumber+'" in:comments';
  const search=ghJson(['-X','GET','search/issues','-f','q='+q,'-f','per_page=20']);
  const groups=[];
  for(const item of search.items||[]){
    const comments=ghJson(['repos/'+repository+'/issues/'+item.number+'/comments?per_page=100']);
    groups.push({issue_number:item.number,comments});
  }
  let result;
  try {
    result=resolve(pr,groups);
  } catch (error) {
    if (/^ENV_SYNC_FINAL_OUTPUT_MATCH_INVALID: 0$/.test(String(error && error.message ? error.message : error))) {
      result={schema:'kodjo.environment.stable-sync.v1',applicable:false,application_pr:Number(pr.number)};
      fs.writeFileSync(path.resolve(outputFile),JSON.stringify(result,null,2)+'\n','utf8');
      process.stdout.write('[KODJO_ENV] STABLE_SYNC_NOT_APPLICABLE pr='+pr.number+'\n');
      return;
    }
    throw error;
  }
  result.applicable=true;
  fs.writeFileSync(path.resolve(outputFile),JSON.stringify(result,null,2)+'\n','utf8');
  process.stdout.write('[KODJO_ENV] STABLE_SYNC_READY slice='+result.slice_id+' main='+result.main_merge_head.slice(0,12)+'\n');
}
if(require.main===module){
  try{main(process.argv.slice(2));}
  catch(error){process.stderr.write(String(error&&error.message?error.message:error)+'\n');process.exit(1);}
}
module.exports={resolve,taggedFinal};
