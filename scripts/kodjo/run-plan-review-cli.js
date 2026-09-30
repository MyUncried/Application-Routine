#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
function run({binary,promptFile,outputFile,errorFile,session='',binaryArgs=[]}){
  if(!binary||!promptFile||!outputFile||!errorFile)throw Error('PLAN_REVIEW_CLI_INPUT_MISSING');
  if(session&&!/^[0-9a-f-]{36}$/i.test(session))throw Error('PLAN_REVIEW_SESSION_INVALID');
  const prompt=fs.readFileSync(promptFile,'utf8');
  if(!prompt.trim())throw Error('PLAN_REVIEW_PROMPT_EMPTY');
  const args=[...binaryArgs,'-p',...(session?['--resume',session]:[]),'--output-format','json','--dangerously-skip-permissions'];
  // Prompt bytes go exclusively to stdin. Never interpolate them in a shell or argv.
  const result=spawnSync(binary,args,{input:prompt,encoding:'utf8',shell:false,windowsHide:true,maxBuffer:64*1024*1024,timeout:3600000});
  fs.writeFileSync(outputFile,result.stdout||'','utf8');
  fs.writeFileSync(errorFile,(result.stderr||'')+(result.error?'\n'+result.error.message:''),'utf8');
  if(result.error)throw Error('PLAN_REVIEW_CLI_SPAWN_FAILED:'+result.error.message);
  if(result.status===null)throw Error('PLAN_REVIEW_CLI_TERMINATED:'+result.signal);
  return result.status;
}
if(require.main===module){
  try{const [promptFile,outputFile,errorFile,binary,session='']=process.argv.slice(2);process.exitCode=run({binary,promptFile,outputFile,errorFile,session});}
  catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={run};
