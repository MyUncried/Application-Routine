#!/usr/bin/env node
'use strict';
const {spawnSync}=require('node:child_process');

const fs=require('node:fs');
const path=require('node:path');
const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../.github/orchestration/normative-inputs.json'),'utf8'));
if(manifest.schema!=='kodjo.normative-inputs.v1'||!Array.isArray(manifest.files)||manifest.files.some(p=>typeof p!=='string'||p.includes('..')||p.includes('*'))||new Set(manifest.files).size!==manifest.files.length)throw new Error('CI_NORMATIVE_MANIFEST_INVALID');
const NORMATIVE_FILES=new Set(manifest.files);
const CATEGORIES=new Set(['RUNTIME_PROTOCOL_CHANGE','NORMATIVE_PROTOCOL_CHANGE','NON_NORMATIVE_DOCUMENTATION','UNKNOWN']);
function classifyPath(file){
  if(/^(?:scripts\/kodjo\/|tests\/kodjo\/|\.github\/workflows\/kodjo(?:-v2|-slice|-vnext)[^/]*\.ya?ml$)/.test(file))return 'RUNTIME_PROTOCOL_CHANGE';
  if(NORMATIVE_FILES.has(file)||/^\.github\/orchestration\/(?:KODJO_PROTOCOL_V2_SPEC[^/]*\.md|v2-slices\/[^/]+\/(?:slice-bootstrap\.json|technical-plan\.md|planning-mission\.md|independent-review\.md))$/.test(file))return 'NORMATIVE_PROTOCOL_CHANGE';
  if(file==='.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md'||file.startsWith('.github/orchestration/reports/'))return 'NON_NORMATIVE_DOCUMENTATION';
  return 'UNKNOWN';
}
function classifyFiles(files){
  const entries=files.map(path=>({path,category:classifyPath(path)}));
  const category=entries.length===0?'UNKNOWN':
    ['RUNTIME_PROTOCOL_CHANGE','UNKNOWN','NORMATIVE_PROTOCOL_CHANGE','NON_NORMATIVE_DOCUMENTATION']
      .find(candidate=>entries.some(entry=>entry.category===candidate));
  if(!CATEGORIES.has(category))throw new Error('CI_IMPACT_CATEGORY_INVALID');
  return {schema:'kodjo.ci-impact.v1',category,full_windows_required:category!=='NON_NORMATIVE_DOCUMENTATION',entries};
}
function diff(base,head,cwd=process.cwd()){
  if(!/^[0-9a-f]{40}$/.test(base)||!/^[0-9a-f]{40}$/.test(head))throw new Error('CI_IMPACT_HEAD_INVALID');
  const r=spawnSync('git',['diff','--name-only','--no-renames','-z',base,head],{cwd,encoding:'utf8',shell:false});
  if(r.status!==0)throw new Error('CI_IMPACT_DIFF_UNAVAILABLE');
  return r.stdout.split('\0').filter(Boolean);
}
if(require.main===module){
  try{
    const [base,head]=process.argv.slice(2);
    process.stdout.write(JSON.stringify(classifyFiles(diff(base,head)))+'\n');
  }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={classifyPath,classifyFiles,diff};
