#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const {normalizeModules}=require('./lib/plan-impact');
function git(args,cwd){const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true,shell:false});if(r.error||r.status!==0)throw new Error('PLAN_PATH_GIT_FAILED:'+String(r.stderr||r.error?.message||''));return String(r.stdout||'');}
function validate(revision,modules,cwd=process.cwd()){
 if(!/^[0-9a-f]{40}$/.test(String(revision||'')))throw new Error('PLAN_PATH_REVISION_INVALID');
 git(['cat-file','-e',revision+'^{commit}'],cwd);
 const normalized=normalizeModules(modules);
 const files=new Set(git(['ls-tree','-r','--name-only','-z',revision],cwd).split('\0').filter(Boolean));
 const allowedCreate=/^(?:app|src|tests|assets)\//;
 for(const m of normalized){
   if(m.change==='MODIFY'&&!files.has(m.path))throw new Error('PLAN_MODIFY_PATH_ABSENT:'+m.path);
   if(m.change==='CREATE'&&files.has(m.path))throw new Error('PLAN_CREATE_PATH_EXISTS:'+m.path);
   if(m.change==='CREATE'&&!allowedCreate.test(m.path))throw new Error('PLAN_CREATE_PATH_LOCATION_FORBIDDEN:'+m.path);
 }
 return normalized;
}
if(require.main===module){try{
 const [revision,file,cwdArg]=process.argv.slice(2);if(!revision||!file)throw new Error('USAGE: validate-plan-module-paths.js <revision> <modules.json> [cwd]');
 const modules=JSON.parse(fs.readFileSync(file,'utf8'));const out=validate(revision,modules,cwdArg||process.cwd());
 process.stdout.write('[KODJO_V2] plan module paths valid — count='+out.length+'\n');
}catch(e){process.stderr.write(String(e.message||e)+'\n');process.exit(1);}}
module.exports={validate};
