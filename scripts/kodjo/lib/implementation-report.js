'use strict';
const crypto=require('node:crypto');
const {REQUIRED_STOPS}=require('./implementation-contract');
const FIELDS=['implementation_status','files_or_symbols','component_used','tests_run','proof_status','preserve_status','residual_status'];
const REQUIREMENT_FIELDS=['implementation_status','files_or_symbols','tests_run','proof_status','residual_status'];
const ASSERTION_IMPLEMENTATION_STATUSES=new Set(['IMPLEMENTED','NOT_IMPLEMENTED','PENDING_DEVICE','NON_VERIFIABLE']);
function block(text,tag){
  const matches=[...String(text||'').matchAll(new RegExp('<'+tag+'>\\s*([\\s\\S]*?)\\s*</'+tag+'>','g'))];
  if(matches.length!==1)throw Error(tag+'_MISSING_OR_DUPLICATED');
  return JSON.parse(matches[0][1]);
}
function expectedShape(expected){
  let criteria=expected,requirements=null;
  if(expected&&!Array.isArray(expected)&&typeof expected==='object'){
    criteria=expected.criteria; requirements=Array.isArray(expected.requirements)&&expected.requirements.length?expected.requirements:null;
  }
  if(!criteria)return {ids:null,assertions:new Map(),requirement_ids:requirements?requirements.map(r=>String(r&&r.requirement_id||'')):null};
  if(Array.isArray(criteria)&&criteria.every(x=>typeof x==='string'))return {ids:[...criteria],assertions:new Map(),requirement_ids:requirements?requirements.map(r=>String(r&&r.requirement_id||'')):null};
  if(Array.isArray(criteria)){
    const ids=criteria.map(x=>String(x&&x.criterion_id||''));
    const assertions=new Map(criteria.map(x=>[
      String(x&&x.criterion_id||''),
      Array.isArray(x&&x.assertions)?x.assertions.map(a=>String(a&&a.assertion_id||'')).sort():[]
    ]));
    return {ids,assertions,requirement_ids:requirements?requirements.map(r=>String(r&&r.requirement_id||'')):null};
  }
  return {ids:null,assertions:new Map(),requirement_ids:null};
}
function validClaimField(row,field){
  const value=row&&row[field];
  if(typeof value==='string')return Boolean(value.trim());
  if(!Array.isArray(value)||value.some(x=>typeof x!=='string'||!x.trim()))return false;
  if(field==='files_or_symbols'&&!value.length)return Boolean(String(row.no_code_change_reason||'').trim());
  return value.length > 0;
}
function inspectReport(text,expected){
  const errors=[];let rows=[];
  const shape=expectedShape(expected);
  const stops=[...String(text||'').matchAll(/^KODJO_STOP_STATUS:\s*([A-Z_]+)\s*$/gm)].map(m=>m[1]);
  if(stops.length!==1||!['NONE',...REQUIRED_STOPS].includes(stops[0])||!String(text).trimEnd().endsWith('KODJO_STOP_STATUS: '+stops[0]))errors.push('STOP_MARKER_MISSING_INVALID_OR_DUPLICATED');
  if(stops.length===1&&stops[0]!=='NONE')errors.push('REPORTED_STOP:'+stops[0]);
  try{
    const value=block(text,'KODJO_IMPLEMENTATION_CONFORMANCE');
    if(!value||!Array.isArray(value.criteria))throw Error('CRITERIA_MISSING');
    rows=value.criteria;
    const ids=rows.map(r=>r&&r.criterion_id);
    if(ids.some(id=>typeof id!=='string'||!id.trim())||new Set(ids).size!==ids.length)errors.push('CRITERIA_INVALID_OR_DUPLICATED');
    if(shape.ids&&JSON.stringify([...ids].sort())!==JSON.stringify([...shape.ids].sort()))errors.push('CRITERIA_COVERAGE_MISMATCH');
    for(const row of rows){
      for(const field of FIELDS){
        const v=row&&row[field];
        if(!validClaimField(row,field))errors.push(String(row&&row.criterion_id)+':MISSING_'+field);
      }
      const expectedAssertions=shape.assertions.get(String(row&&row.criterion_id||''))||[];
      if(expectedAssertions.length){
        const observed=Array.isArray(row&&row.assertion_results)?row.assertion_results:null;
        if(!observed){errors.push(String(row&&row.criterion_id)+':ASSERTION_RESULTS_MISSING');continue;}
        const observedIds=observed.map(a=>String(a&&a.assertion_id||'')).sort();
        if(JSON.stringify(observedIds)!==JSON.stringify(expectedAssertions))errors.push(String(row&&row.criterion_id)+':ASSERTION_COVERAGE_MISMATCH');
        for(const assertion of observed){
          const id=String(assertion&&assertion.assertion_id||'');
          if(!ASSERTION_IMPLEMENTATION_STATUSES.has(String(assertion&&assertion.implementation_status||'')))errors.push(id+':ASSERTION_STATUS_INVALID');
          if(typeof assertion?.evidence!=='string'||!assertion.evidence.trim())errors.push(id+':ASSERTION_EVIDENCE_MISSING');
        }
      }
    }
  }catch(e){errors.push('REPORT_NOT_STRUCTURED:'+e.message);}
  let requirementRows=[];
  if(shape.requirement_ids){
    try{
      const value=block(text,'KODJO_REQUIREMENT_CONFORMANCE');
      if(!value||!Array.isArray(value.requirements))throw Error('REQUIREMENTS_MISSING');
      requirementRows=value.requirements;
      const ids=requirementRows.map(r=>String(r&&r.requirement_id||''));
      if(ids.some(id=>!id)||new Set(ids).size!==ids.length)errors.push('REQUIREMENTS_INVALID_OR_DUPLICATED');
      if(JSON.stringify([...ids].sort())!==JSON.stringify([...shape.requirement_ids].sort()))errors.push('REQUIREMENT_COVERAGE_MISMATCH');
      for(const row of requirementRows){for(const field of REQUIREMENT_FIELDS){if(!validClaimField(row,field))errors.push(String(row&&row.requirement_id)+':MISSING_'+field);}}
    }catch(e){errors.push('REQUIREMENT_REPORT_NOT_STRUCTURED:'+e.message);}
  }
  return {status:errors.length?'NON_VERIFIABLE':'COMPLETE',errors,criterion_ids:rows.map(r=>r&&r.criterion_id),requirement_ids:requirementRows.map(r=>r&&r.requirement_id)};
}
function inspectImplementation(body,expected){
  try{
    const e=block(body,'KODJO_IMPLEMENTATION_REPORT_JSON');
    const report=inspectReport(e.report_text,expected);
    function field(name){const m=[...String(body).matchAll(new RegExp('^'+name+'=([^\\r\\n]+)$','gm'))];return m.length===1?m[0][1]:null;}
    if(e.request_id!==field('v2_request_id')||e.source_head!==field('base_head'))report.errors.push('REPORT_IDENTITY_MISMATCH');
    if(e.truncated!==false)report.errors.push('REPORT_TRUNCATED_OR_UNKNOWN');
    if(typeof e.report_text!=='string'||crypto.createHash('sha256').update(e.report_text||'').digest('hex')!==e.original_text_sha256)report.errors.push('REPORT_TEXT_HASH_MISMATCH');
    const machine=e.machine_evidence;
    if(!machine||!Array.isArray(machine.modified_files)||!Array.isArray(machine.checks)||!Array.isArray(machine.out_of_scope_files))report.errors.push('MACHINE_EVIDENCE_MISSING');
    else {
      const modified=new Set(machine.modified_files.map(x=>String(x).replace(/\\/g,'/')));
      const observed=new Set(machine.checks.map(x=>String(x&&x.check||'')));
      const claimed=[...(block(e.report_text,'KODJO_IMPLEMENTATION_CONFORMANCE').criteria||[])];
      if(shapeHasRequirements(expected))claimed.push(...(block(e.report_text,'KODJO_REQUIREMENT_CONFORMANCE').requirements||[]));
      const declared=new Set();
      for(const row of claimed){
        const id=String(row.criterion_id||row.requirement_id||'unknown');
        if(row.tests_not_run!==undefined&&(!Array.isArray(row.tests_not_run)||row.tests_not_run.some(x=>!x||typeof x.check!=='string'||!x.check.trim()||typeof x.reason!=='string'||!x.reason.trim())))report.errors.push(id+':TESTS_NOT_RUN_INVALID');
        if(row.symbols!==undefined&&(!Array.isArray(row.symbols)||row.symbols.some(x=>typeof x!=='string'||!x.trim())))report.errors.push(id+':SYMBOLS_INVALID');
        for(const value of Array.isArray(row.files_or_symbols)?row.files_or_symbols:[row.files_or_symbols]){
          const p=String(value||'').replace(/\\/g,'/');
          if(p)declared.add(p);
          if(!modified.has(p))report.errors.push(id+':DECLARED_FILE_NOT_MODIFIED:'+p);
        }
        for(const value of Array.isArray(row.tests_run)?row.tests_run:[row.tests_run]){
          const check=String(value||'');
          if(!observed.has(check))report.errors.push(id+':DECLARED_CHECK_NOT_RUN:'+check);
        }
      }
      for(const file of modified)if(!declared.has(file))report.errors.push('MODIFIED_FILE_NOT_DECLARED:'+file);
    }
    report.machine_evidence=machine||null;
    report.status=report.errors.length?'NON_VERIFIABLE':'COMPLETE';return report;
  }catch(e){return {status:'NON_VERIFIABLE',errors:['REPORT_ENVELOPE_INVALID:'+e.message],criterion_ids:[]};}
}
function shapeHasRequirements(expected){return expectedShape(expected).requirement_ids!==null;}
module.exports={inspectReport,inspectImplementation,FIELDS,REQUIREMENT_FIELDS,ASSERTION_IMPLEMENTATION_STATUSES};
