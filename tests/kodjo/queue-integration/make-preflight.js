#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const P = require('../../../scripts/kodjo/lib/preflight-contract');
const { projectQueueRequest } = require('../../../scripts/kodjo/lib/queue-request');

function git(cwd,args,encoding='utf8'){
  return execFileSync('git',args,{cwd,encoding}).toString().trim();
}
function main(argv){
  const [repoArg,queueRel,outFile]=argv;
  if(!repoArg||!queueRel||!outFile) throw new Error('USAGE: make-preflight.js <repo> <queue-rel> <out>');
  const repo=path.resolve(repoArg);
  const queue=JSON.parse(fs.readFileSync(path.join(repo,queueRel),'utf8'));
  const queueBlob=git(repo,['hash-object','--',queueRel]);
  const projection=projectQueueRequest(queue);
  const executionHead=queue.delivery_target&&queue.delivery_target.application_head
    ? String(queue.delivery_target.application_head)
    : String(queue.source_head);
  const promptBuffer=execFileSync('git',['show',String(queue.source_head)+':'+queue.prompt_file],{cwd:repo,encoding:null});
  const promptFileSha=P.sha256(promptBuffer);
  const att=P.finalize({
    queue_path:queueRel.replace(/\\/g,'/'),
    queue_blob_oid:queueBlob,
    request_id:String(queue.request_id),
    event_before:String(queue.source_head),
    event_after:git(repo,['rev-parse','HEAD']),
    protocol_head:String(queue.source_head),
    execution_head:executionHead,
    operation_kind:String(queue.operation_kind||'IMPLEMENT').toUpperCase(),
    mode:String(queue.mode||'').toUpperCase(),
    bindings:{
      slice_id:String(queue.slice_id),
      issue_number:Number(queue.issue_number),
      plan_blob_oid:String(queue.authorized_plan.plan_blob_oid),
      review_blob_oid:String(queue.independent_review.review_blob_oid),
      user_gate_ref:String(queue.user_gate.gate_ref),
    },
    freshness_guards_required:['PF-023','PF-024','PF-025','PF-026','PF-027','PF-028'],
    projection_sha256:P.sha256(projection),
    prompt_sha256:'bench',
    prompt_file_sha256:promptFileSha,
    prompt_bytes:0,
    package_lock_sha256:null,
    toolchain:{bench:true},
    checks:require('../helpers/preflight-checks').checks(queue),
  });
  fs.writeFileSync(path.resolve(outFile),JSON.stringify(att,null,2)+'\n','utf8');
}
if(require.main===module){
  try{main(process.argv.slice(2));}
  catch(error){process.stderr.write(String(error&&error.message?error.message:error)+'\n');process.exit(1);}
}
module.exports={main};
