#!/usr/bin/env node
'use strict';
const fs=require('node:fs');

function detect(registry,commentsByIssue){
  if(!Array.isArray(registry?.activations))throw new Error('ACTIVATION_REGISTRY_INVALID');
  const anomalies=[];
  for(const activation of registry.activations){
    const comments=commentsByIssue[String(activation.issue_number)]||[];
    for(const comment of comments){
      const body=String(comment.body||'').replace(/\r/g,'');
      if(!body.startsWith('[KODJO_SLICE] FINAL_OUTPUT\n')||!/^STATUT : DONE$/m.test(body))continue;
      const field=(key)=>body.match(new RegExp('^'+key+'=([^\\n]+)$','m'))?.[1]||'';
      if(field('slice_id')!==activation.slice_id)continue;
      if(activation.status==='ACTIVE')anomalies.push({slice_id:activation.slice_id,issue_number:activation.issue_number,final_comment_id:comment.id,final_head:field('final_head'),code:'CLOSURE_EVIDENCE_WITH_ACTIVE_REGISTRY'});
      if(activation.status==='CLOSED'&&field('final_head')!==activation.closure?.final_head)anomalies.push({slice_id:activation.slice_id,issue_number:activation.issue_number,final_comment_id:comment.id,code:'CLOSURE_HEAD_DRIFT'});
    }
  }
  return {schema:'kodjo.v2-closure-consistency.v1',anomalies};
}
if(require.main===module){
  try{
    const [registryFile,commentsFile]=process.argv.slice(2);
    const result=detect(JSON.parse(fs.readFileSync(registryFile,'utf8')),JSON.parse(fs.readFileSync(commentsFile,'utf8')));
    process.stdout.write(JSON.stringify(result)+'\n');
    if(result.anomalies.length)process.exitCode=1;
  }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={detect};
