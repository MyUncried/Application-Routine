#!/usr/bin/env node
'use strict';
// Resolves the native Claude Code executable on the Windows runner.
// The npm install exposes only launchers (claude, claude.cmd, claude.ps1) on PATH;
// claude.exe lives in node_modules/@anthropic-ai/claude-code/bin next to them.
const fs=require('node:fs');
const path=require('node:path');
const PACKAGE_EXE=path.join('node_modules','@anthropic-ai','claude-code','bin','claude.exe');
const LAUNCHERS=['claude.exe','claude.cmd','claude.ps1','claude'];
function candidates(env=process.env){
  const dirs=String(env.PATH||env.Path||'').split(path.delimiter).map(x=>x.trim().replace(/^"|"$/g,'')).filter(Boolean);
  const out=[];
  for(const dir of dirs){
    if(fs.existsSync(path.join(dir,'claude.exe')))out.push(path.join(dir,'claude.exe'));
    if(LAUNCHERS.slice(1).some(n=>fs.existsSync(path.join(dir,n))))out.push(path.join(dir,PACKAGE_EXE));
  }
  for(const base of [env.APPDATA,env.USERPROFILE&&path.join(env.USERPROFILE,'AppData','Roaming')])if(base)out.push(path.join(base,'npm',PACKAGE_EXE));
  return out;
}
function resolve(env=process.env){
  const found=candidates(env).find(p=>{try{return fs.statSync(p).isFile();}catch{return false;}});
  if(!found)throw Error('CLAUDE_BINARY_NOT_FOUND');
  return path.resolve(found);
}
if(require.main===module){
  try{process.stdout.write(resolve()+'\n');}catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={resolve,candidates,PACKAGE_EXE};
