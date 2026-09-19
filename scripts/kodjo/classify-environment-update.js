#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const NATIVE_EXACT = new Set(['package.json','package-lock.json','app.json','app.config.js','eas.json']);
const NATIVE_PREFIX = ['ios/','android/','plugins/','modules/'];

function classify(files){
  const normalized=[...new Set((files||[]).map(String).map(f=>f.replace(/\\/g,'/')).filter(Boolean))].sort();
  const native=normalized.filter(f=>NATIVE_EXACT.has(f)||NATIVE_PREFIX.some(p=>f.startsWith(p)));
  return {
    schema:'kodjo.environment.update-compatibility.v1',
    status:native.length?'NATIVE_REBUILD_REQUIRED':'OTA_COMPATIBLE',
    changed_files:normalized,
    native_sensitive_files:native,
  };
}
function main(argv){
  const [base,head,outputFile]=argv;
  if(!/^[0-9a-f]{40}$/.test(String(base||''))||!/^[0-9a-f]{40}$/.test(String(head||''))||!outputFile){
    throw new Error('USAGE: classify-environment-update.js <base-sha> <head-sha> <output.json>');
  }
  const r=spawnSync('git',['diff','--name-only','-z',base+'..'+head],{encoding:'utf8',windowsHide:true,shell:false,maxBuffer:16*1024*1024});
  if(r.error||r.status!==0) throw new Error('ENV_SYNC_DIFF_UNREADABLE');
  const files=String(r.stdout||'').split('\0').filter(Boolean);
  const result=classify(files);
  fs.writeFileSync(path.resolve(outputFile),JSON.stringify(result,null,2)+'\n','utf8');
  process.stdout.write('[KODJO_ENV] '+result.status+'\n');
}
if(require.main===module){
  try{main(process.argv.slice(2));}
  catch(error){process.stderr.write(String(error&&error.message?error.message:error)+'\n');process.exit(1);}
}
module.exports={classify,NATIVE_EXACT,NATIVE_PREFIX};
