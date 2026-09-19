#!/usr/bin/env node
'use strict';
// D1: consume BEFORE execution. Only creation can authorize an execution;
// reading an existing receipt never authorizes even its original run again.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {admit,blobOid}=require('./verify-queue-admission');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{40}$/;
function githubApi(method,endpoint,body){
  const args=['api','--include','--method',method,endpoint];
  if(body!==undefined)args.push('--input','-');
  const r=cp.spawnSync('gh',args,{input:body===undefined?undefined:JSON.stringify(body),encoding:'utf8',windowsHide:true,shell:false});
  const match=/^HTTP\/\S+\s+(\d+)[^\r\n]*\r?\n[\s\S]*?\r?\n\r?\n([\s\S]*)$/.exec(r.stdout||'');
  if(r.error||!match)throw Error('KODJO_CONSUMPTION_API_UNAVAILABLE');
  const status=Number(match[1]);let data;
  try{data=JSON.parse(match[2]);}catch(_){throw Error('KODJO_CONSUMPTION_API_INVALID');}
  if(r.status!==0 && status!==404 && status!==409 && status!==422)throw Error('KODJO_CONSUMPTION_API_FAILED: '+status);
  return {status,data};
}
function consume(receipt,api=githubApi){
  if(!receipt||!UUID.test(receipt.request_id)||!SHA.test(receipt.queue_commit)||!SHA.test(receipt.queue_blob_oid)||
    !/^[\w.-]+\/[\w.-]+$/.test(receipt.repository)||!/^[1-9][0-9]*$/.test(String(receipt.run_id))||String(receipt.run_attempt)!=='1')throw Error('KODJO_CONSUMPTION_IDENTITY_INVALID');
  const tag='kodjo-consumed/'+receipt.request_id.toLowerCase();
  const ref='refs/tags/'+tag,base='repos/'+receipt.repository+'/git';
  const prior=api('GET',base+'/ref/tags/'+tag);
  if(prior.status===200)throw Error('KODJO_QUEUE_CONSUMED_REFUSED: '+receipt.request_id);
  if(prior.status!==404)throw Error('KODJO_CONSUMPTION_READ_FAILED');
  const message=JSON.stringify({schema:'kodjo.queue-consumption.v1',...receipt});
  const object=api('POST',base+'/tags',{tag,message,object:receipt.queue_commit,type:'commit'});
  if(object.status!==201||!SHA.test(object.data?.sha))throw Error('KODJO_CONSUMPTION_OBJECT_FAILED');
  // GitHub create-ref is atomic. No PATCH, force, delete or retry of this write.
  const created=api('POST',base+'/refs',{ref,sha:object.data.sha});
  if(created.status!==201)throw Error('KODJO_QUEUE_CONSUMED_OR_CREATION_REFUSED');
  const observed=api('GET',base+'/ref/tags/'+tag);
  if(observed.status!==200||observed.data?.ref!==ref||observed.data?.object?.sha!==object.data.sha||observed.data?.object?.type!=='tag')throw Error('KODJO_CONSUMPTION_READBACK_FAILED');
  const proof=api('GET',base+'/tags/'+object.data.sha);
  if(proof.status!==200||proof.data?.message!==message||proof.data?.object?.sha!==receipt.queue_commit||proof.data?.object?.type!=='commit')throw Error('KODJO_CONSUMPTION_PROOF_FAILED');
  return {ref,tag_oid:object.data.sha,...receipt};
}
function main(argv,env=process.env){
  const [queueFile]=argv,cwd=process.cwd();
  const selected=admit({cwd,before:env.KODJO_EVENT_BEFORE,after:env.KODJO_EVENT_AFTER,runAttempt:env.GITHUB_RUN_ATTEMPT,selectionOnly:true});
  if(selected.selected!==queueFile)throw Error('KODJO_CONSUMPTION_QUEUE_MISMATCH');
  const head=cp.spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8',cwd});
  if(head.status!==0||head.stdout.trim()!==env.KODJO_EVENT_AFTER)throw Error('KODJO_CONSUMPTION_COMMIT_MISMATCH');
  const queue=JSON.parse(fs.readFileSync(path.resolve(queueFile),'utf8').replace(/^\uFEFF/,''));
  const receipt=consume({repository:env.GITHUB_REPOSITORY,request_id:selected.request_id,queue_path:queueFile,
    queue_blob_oid:blobOid(queueFile,cwd),queue_commit:env.KODJO_EVENT_AFTER,run_id:env.GITHUB_RUN_ID,run_attempt:env.GITHUB_RUN_ATTEMPT,
    source_head:queue.source_head,mode:queue.mode,retry_of_run_id:queue.retry_of_run_id||null,retry_reason:queue.retry_reason||null});
  process.stdout.write(JSON.stringify(receipt)+'\n');
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){process.stderr.write(e.message+'\n');process.exit(1);}}
module.exports={consume,githubApi};
