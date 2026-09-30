#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {parse}=require('./lib/yaml'),{classify}=require('./lib/artifact-policy');
function nameOf(value,env={},outputs={}){
 let name=String(value||'');
 name=name.replace(/\$\{\{\s*env\.([A-Z_]+)\s*\}\}/g,(_,key)=>{
  if(typeof env[key]!=='string')throw new Error('ARTIFACT_NAME_UNRESOLVED:'+key);return env[key];
 });
 name=name.replace(/\$\{\{\s*steps\.([a-zA-Z0-9_-]+)\.outputs\.([a-zA-Z0-9_]+)\s*\}\}/g,(_,step,key)=>{
  if(!outputs[step]?.[key])throw new Error('ARTIFACT_NAME_UNRESOLVED:'+step+'.'+key);return outputs[step][key];
 });
 return name.replace(/\$\{\{[^}]+\}\}|\$\{[A-Z_]+\}/g,'123');
}
function verifyWorkflow(workflow,label='workflow'){
 const results=[];
 for(const job of Object.values(workflow.jobs||{})){
 const outputs={};
 for(const step of job.steps||[])if(step.id){
  outputs[step.id]={};
  for(const hit of String(step.run||'').matchAll(/echo ["']([a-zA-Z0-9_]+)=([^"'\n]+)["']/g))outputs[step.id][hit[1]]=hit[2];
 }
 for(const step of job.steps||[]){
  if(!step.uses?.startsWith('actions/upload-artifact@'))continue;
  const name=nameOf(step.with?.name,{...(workflow.env||{}),...(job.env||{}),...(step.env||{})},outputs);
  const policy=classify(name),raw=step.with?.['retention-days'];
  const override=/^\$\{\{\s*vars\.KODJO_RECOVERY_RETENTION_DAYS\s*\|\|\s*90\s*\}\}$/.test(String(raw));
  if(policy.role==='UNKNOWN')throw new Error('ARTIFACT_POLICY_UNKNOWN:'+label+':'+name);
  const days=override?Number(process.env.KODJO_RECOVERY_RETENTION_DAYS||90):Number(raw);
  if(!Number.isInteger(days)||days!==policy.retention_days)throw new Error('ARTIFACT_RETENTION_POLICY_MISMATCH:'+label+':'+name+':'+days+'!='+policy.retention_days);
  results.push({name,days,role:policy.role,critical:policy.critical});
 }
 }
 return results;
}
if(require.main===module){try{
 const directory=process.argv[2]||path.resolve(__dirname,'../../.github/workflows');let count=0;
 for(const file of fs.readdirSync(directory).filter(f=>/^kodjo-.*\.yml$/.test(f)))count+=verifyWorkflow(parse(fs.readFileSync(path.join(directory,file),'utf8')),file).length;
 console.log('ARTIFACT_RETENTION_CONTRACTS_PASS '+count+' upload steps');
}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={nameOf,verifyWorkflow};
