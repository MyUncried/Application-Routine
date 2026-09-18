#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const I = require('./lib/slice-identity');
const { writeJson } = require('./lib/json');
const { sha256Bytes } = require('./lib/hash');

function arg(name) { const i=process.argv.indexOf(name); return i<0 ? null : process.argv[i+1]; }
function list(name) { const v=arg(name); return v ? v.split(',').map(x=>x.trim()).filter(Boolean) : []; }
function git(root,args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true});if(r.status!==0)throw new Error('GIT_'+args[0].toUpperCase()+'_FAILED');return r.stdout.trim();}
function gitBytes(root,args){const r=spawnSync('git',args,{cwd:root,encoding:null,windowsHide:true});if(r.status!==0)throw new Error('GIT_'+String(args[0]).toUpperCase()+'_FAILED');return r.stdout;}
function main(){
  const root=path.resolve(git(process.cwd(),['rev-parse','--show-toplevel']));
  if(git(root,['status','--porcelain'])) throw new Error('REPOSITORY_NOT_CLEAN');
  const sliceId=arg('--slice-id'); const issue=Number(arg('--issue-number')); const sources=list('--product-sources');
  const actors=list('--authorized-actors'); const target=arg('--target-branch')||git(root,['branch','--show-current']);
  if(!sliceId||!Number.isInteger(issue)||!sources.length||!actors.length) throw new Error('ACTIVATION_ARGUMENTS_INVALID');
  const head=git(root,['rev-parse','HEAD']);
  const productSources=sources.map(p=>{
    const normalized=p.replace(/\\/g,'/');
    const abs=path.resolve(root,p);
    if(!abs.startsWith(root+path.sep)||!fs.statSync(abs).isFile()) throw new Error('PRODUCT_SOURCE_INVALID');
    git(root,['ls-files','--error-unmatch','--',normalized]);
    const blob=gitBytes(root,['show',`${head}:${normalized}`]);
    return {path:normalized,sha256:sha256Bytes(blob)};
  });
  const bootstrap={schema_version:I.BOOTSTRAP_SCHEMA,slice_id:sliceId,issue_number:issue,repository:'MyUncried/Application-Routine',target_branch:target,baseline_head:head,planning_application_head:head,protocol_version:'0.6.12',protocol_commit:head,activation_registry:'.github/orchestration/v2-activation-registry.json',previous_slice_id:arg('--previous-slice-id'),previous_checkpoint:arg('--previous-checkpoint'),product_sources:productSources,authorized_actors:actors,created_at:new Date().toISOString()};
  bootstrap.previous_slice_id=bootstrap.previous_slice_id||null; bootstrap.previous_checkpoint=bootstrap.previous_checkpoint||null;
  bootstrap.slice_bootstrap_sha256=I.sha256(I.canonical(bootstrap)); I.validateBootstrap(bootstrap);
  const registryPath=path.join(root,'.github','orchestration','v2-activation-registry.json'); const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
  if(registry.activations.some(a=>a.slice_id===sliceId)) throw new Error('SLICE_ALREADY_REGISTERED');
  const bootstrapRel=`.github/orchestration/v2-slices/${sliceId}/slice-bootstrap.json`;
  registry.activations.push({slice_id:sliceId,status:'ACTIVE',issue_number:issue,baseline_head:head,planning_application_head:head,bootstrap_path:bootstrapRel,slice_bootstrap_sha256:bootstrap.slice_bootstrap_sha256});
  I.validateRegistry(registry,bootstrap); writeJson(path.join(root,bootstrapRel),bootstrap); writeJson(registryPath,registry);
  process.stdout.write(`KODJO_V2_SLICE_ACTIVATION_PREPARED=${sliceId}\nKODJO_V2_SLICE_BOOTSTRAP=${bootstrapRel}\nKODJO_V2_SLICE_BOOTSTRAP_SHA256=${bootstrap.slice_bootstrap_sha256}\n`);
}
try{main();}catch(e){process.stderr.write(`KODJO_V2_ACTIVATION_REFUSED: ${e.message}\n`);process.exit(78);}
