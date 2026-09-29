'use strict';

const PREVENTABLE = new Set([
  'PLAN_SCAN_PATH_INVALID',
  'PLAN_SCAN_PATH_AMBIGUOUS',
  'INITIAL_PLAN_DECISION_CARDINALITY',
  'PLAN_GENERATION_DECISION_MISSING',
  'UI_PLAN_COVERAGE_INCOMPLETE',
  'TEST_CONTRACT_CONSISTENCY',
]);
const HUMAN = new Set([
  'CLARIFICATION_REQUIRED',
  'CHANGE_REQUEST_REQUIRED',
  'SCOPE_EXPANSION_REQUIRED',
  'NATIVE_PRIMITIVE_EXCEPTION_REQUIRED',
  'VISUAL_CORRECTION_CONTRACT_CHANGED',
]);

function classify(input = {}) {
  const diagnostic=String(input.diagnostic||input.status||'');
  const mode=String(input.mode||'').toUpperCase();
  const recoveryAvailable=input.recovery_available===true;
  const failedChecks=Array.isArray(input.failed_checks)?input.failed_checks.filter(Boolean):[];

  if(PREVENTABLE.has(diagnostic)){
    return {category:'PREVENTABLE_BY_DETERMINISM',auto_retry:false,action:'FIX_PROTOCOL_CAUSE'};
  }
  if(HUMAN.has(diagnostic)||diagnostic==='CLARIFICATION_REQUIRED'){
    return {category:'HUMAN_DECISION_REQUIRED',auto_retry:false,action:'WAIT_FOR_DECISION'};
  }
  if(diagnostic==='IMPLEMENTED_WITH_FAILED_CHECKS'&&mode==='INITIAL'&&recoveryAvailable&&failedChecks.length>0){
    return {category:'RESIDUAL_AUTOCORRECTABLE',auto_retry:true,action:'RESUME_DELTA_ONCE',retry_code:'CHECKS_FAILED'};
  }
  if(diagnostic==='IMPLEMENTED_WITH_FAILED_CHECKS'){
    return {category:'RESIDUAL_AUTOCORRECTABLE',auto_retry:false,action:mode==='RESUME_DELTA'?'STOP_AFTER_BOUNDED_RETRY':'RECOVERY_REQUIRED'};
  }
  if(/ARTIFACT_STORAGE|QUOTA|USAGE_LIMIT/.test(diagnostic)){
    return {category:'RESIDUAL_AUTOCORRECTABLE',auto_retry:false,action:'WAIT_EXTERNAL_CONDITION'};
  }
  return {category:'HUMAN_DECISION_REQUIRED',auto_retry:false,action:'DIAGNOSE_UNKNOWN'};
}

module.exports={PREVENTABLE,HUMAN,classify};
