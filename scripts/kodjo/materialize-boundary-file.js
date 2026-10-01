#!/usr/bin/env node
'use strict';
// Writes the exact bytes of <path> at the immutable queue boundary commit.
// The Lean Queue execution switches the checkout to the request source_head,
// which predates the queue commit: the selected request must not be re-read
// from the working tree afterwards (run 36773441104, ENOENT).
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
function materialize(commit,file,output,cwd=process.cwd()){
  if(!/^[0-9a-f]{40}$/.test(String(commit||'')))throw new Error('BOUNDARY_COMMIT_INVALID');
  const rel=String(file||'').replace(/\\/g,'/');
  if(!rel||path.posix.isAbsolute(rel)||rel.split('/').includes('..'))throw new Error('BOUNDARY_PATH_INVALID');
  if(!output)throw new Error('BOUNDARY_OUTPUT_MISSING');
  const r=spawnSync('git',['show',commit+':'+rel],{cwd,windowsHide:true,shell:false,maxBuffer:16*1024*1024});
  if(r.error||r.status!==0)throw new Error('BOUNDARY_FILE_UNAVAILABLE: '+rel+' at '+commit);
  fs.writeFileSync(output,r.stdout);
  return r.stdout.length;
}
if(require.main===module){
  try{const [commit,file,output]=process.argv.slice(2);materialize(commit,file,output);}
  catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={materialize};
