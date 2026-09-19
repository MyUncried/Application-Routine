#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { projectQueueRequest } = require('./lib/queue-request');
const P = require('./lib/preflight-contract');
const Source = require('./lib/preflight-source');

function git(args,cwd){
  const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:64*1024*1024});
  if(r.error||r.status!==0) throw new Error('PREFLIGHT_GIT_READ_FAILED: '+args.join(' '));
  return String(r.stdout);
}
function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));}
function blobOid(file,cwd){return git(['hash-object','--',file],cwd).trim();}
function executionHead(queue){
  return String(queue.operation_kind||'IMPLEMENT').toUpperCase()==='VISUAL_CORRECTION'
    ? String(queue.delivery_target&&queue.delivery_target.application_head||'')
    : String(queue.source_head||'');
}
function packageLockHashAt(head,cwd){
  return Source.hashFileAtHead('package-lock.json',head,cwd,{optional:true});
}
function verifyFile(preflightFile,queueFile,options={}){
  const cwd=path.resolve(options.cwd||process.cwd());
  const queuePath=String(queueFile).replace(/\\/g,'/');
  const queueAbs=path.resolve(cwd,queueFile);
  const preflight=readJson(path.resolve(preflightFile));
  const queue=readJson(queueAbs);
  const queueBlob=blobOid(queueFile,cwd);
  const execHead=executionHead(queue);
  P.verify(preflight,{
    queue_path:queuePath,
    queue_blob_oid:queueBlob,
    request_id:String(queue.request_id||''),
    protocol_head:String(queue.source_head||''),
    execution_head:execHead,
  });
  if(preflight.status!=='PASS') throw new Error('PREFLIGHT_ATTESTATION_NOT_PASS');
  P.verifyApplicability(preflight,queue);
  const projection=projectQueueRequest(queue);
  if(P.sha256(projection)!==preflight.projection_sha256) throw new Error('PREFLIGHT_PROJECTION_DRIFT');
  const lockHash=packageLockHashAt(execHead,cwd);
  if((preflight.package_lock_sha256||null)!==(lockHash||null)) throw new Error('PREFLIGHT_PACKAGE_LOCK_DRIFT');
  const required=['PF-023','PF-024','PF-025','PF-026','PF-027','PF-028'];
  const observed=[...(preflight.freshness_guards_required||[])].sort();
  if(JSON.stringify(observed)!==JSON.stringify(required.slice().sort())) throw new Error('PREFLIGHT_FRESHNESS_GUARDS_INVALID');
  return {preflight,queue,queue_blob_oid:queueBlob,execution_head:execHead,projection};
}

if(require.main===module){
  try{
    const [preflightFile,queueFile,projectionFile]=process.argv.slice(2);
    if(!preflightFile||!queueFile) throw new Error('USAGE: verify-preflight-attestation.js <preflight.json> <queue.json> [request.json]');
    const result=verifyFile(preflightFile,queueFile);
    if(projectionFile){
      fs.writeFileSync(path.resolve(projectionFile),JSON.stringify(result.projection,null,2)+'\n','utf8');
    }
    process.stdout.write('[KODJO_V2] PREFLIGHT_ATTESTATION_ACCEPTED '+result.preflight.preflight_fingerprint.slice(0,12)+'\n');
  }catch(error){
    process.stderr.write(String(error&&error.message?error.message:error)+'\n');
    process.exit(1);
  }
}

module.exports={verifyFile,executionHead,packageLockHashAt};
