#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {PREVENTABLE,HUMAN,classify}=require('./lib/error-policy');
function classifyLog(log){
  const codes=[...PREVENTABLE,...HUMAN];
  const diagnostic=codes.find(code=>String(log).includes(code))||'ORCHESTRATION_FAILURE';
  return {schema:'kodjo.planning-error.v1',diagnostic,...classify({diagnostic,mode:'PLANNING',recovery_available:false})};
}
if(require.main===module){
  try{
    const [logFile,outFile]=process.argv.slice(2);
    if(!logFile||!outFile)throw new Error('USAGE: classify-planning-failure.js <stderr.log> <output.json>');
    const result=classifyLog(fs.existsSync(logFile)?fs.readFileSync(logFile,'utf8'):'');
    fs.writeFileSync(outFile,JSON.stringify(result,null,2)+'\n');
    process.stdout.write(JSON.stringify(result)+'\n');
  }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={classifyLog};
