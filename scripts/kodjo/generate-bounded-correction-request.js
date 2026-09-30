#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {validateQueueRequest}=require('./lib/queue-contract');
const {classify}=require('./lib/error-policy');

function fail(code,detail){throw new Error(code+(detail?': '+detail:''));}
function deterministicUuid(seed){
  const hex=crypto.createHash('sha256').update(String(seed),'utf8').digest('hex');
  return hex.slice(0,8)+'-'+hex.slice(8,12)+'-5'+hex.slice(13,16)+'-8'+hex.slice(17,20)+'-'+hex.slice(20,32);
}

function generate(queue,result,runId,recoveryAvailable){
  if(!queue||!result)fail('AUTO_CORRECTION_INPUT_INVALID');
  const failed=Array.isArray(result.failed_checks)?result.failed_checks.filter(Boolean):
    (Array.isArray(result.checks)?result.checks.filter((row)=>row&&row.status==='FAIL').map((row)=>String(row.check||'')).filter(Boolean):[]);
  const policy=classify({
    diagnostic:String(result.status||''),
    mode:String(queue.mode||''),
    recovery_available:Boolean(recoveryAvailable),
    failed_checks:failed,
  });
  if(!policy.auto_retry)return {status:'NOT_REQUIRED',policy};

  if(String(queue.mode||'').toUpperCase()!=='INITIAL')fail('AUTO_CORRECTION_MODE_NOT_INITIAL');
  if(String(queue.operation_kind||'IMPLEMENT').toUpperCase()!=='IMPLEMENT')fail('AUTO_CORRECTION_OPERATION_NOT_IMPLEMENT');
  if(!/^[1-9][0-9]*$/.test(String(runId||'')))fail('AUTO_CORRECTION_RUN_ID_INVALID');
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(result.session_id||'')))fail('AUTO_CORRECTION_SESSION_INVALID');
  if(!failed.length)fail('AUTO_CORRECTION_FAILED_CHECKS_MISSING');

  const retry=JSON.parse(JSON.stringify(queue));
  retry.mode='RESUME_DELTA';
  retry.session_id=String(result.session_id);
  retry.retry_of_run_id=String(runId);
  retry.retry_reason={
    code:'CHECKS_FAILED',
    detail:'Automatic bounded correction of failed checks: '+failed.slice().sort().join(', '),
  };
  retry.request_id=deterministicUuid(String(queue.request_id)+'|'+String(runId)+'|CHECKS_FAILED');
  const sourceTime=String(result.claude_finished_at||result.finished_at||queue.created_at||'');
  if(!sourceTime||Number.isNaN(Date.parse(sourceTime)))fail('AUTO_CORRECTION_CREATED_AT_UNAVAILABLE');
  retry.created_at=new Date(sourceTime).toISOString();
  delete retry.initial_restart;
  delete retry.materialized_recovery;

  const violations=validateQueueRequest(retry);
  if(violations.length){
    fail('AUTO_CORRECTION_REQUEST_REFUSED',violations.map(v=>v.diagnostic+':'+v.property).join(','));
  }
  return {status:'READY',policy,request:retry};
}

if(require.main===module){
  try{
    const [queueFile,resultFile,runId,recoveryFlag,outputFile]=process.argv.slice(2);
    if(!queueFile||!resultFile||!outputFile)fail('USAGE_INVALID');
    const queue=JSON.parse(fs.readFileSync(path.resolve(queueFile),'utf8').replace(/^\uFEFF/,''));
    const result=JSON.parse(fs.readFileSync(path.resolve(resultFile),'utf8').replace(/^\uFEFF/,''));
    const generated=generate(queue,result,runId,recoveryFlag==='true');
    fs.writeFileSync(path.resolve(outputFile),JSON.stringify(generated,null,2)+'\n','utf8');
    process.stdout.write('[KODJO_V2] auto correction '+generated.status+' category='+generated.policy.category+' action='+generated.policy.action+'\n');
  }catch(error){
    process.stderr.write(String(error&&error.message?error.message:error)+'\n');
    process.exit(1);
  }
}

module.exports={deterministicUuid,generate};
