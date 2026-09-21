'use strict';
const crypto=require('node:crypto');
const {REQUIRED_STOPS}=require('./implementation-contract');
const FIELDS=['implementation_status','files_or_symbols','component_used','tests_run','proof_status','preserve_status','residual_status'];
const ASSERTION_IMPLEMENTATION_STATUSES=new Set(['IMPLEMENTED','NOT_IMPLEMENTED','PENDING_DEVICE','NON_VERIFIABLE']);
function block(text,tag){
  const matches=[...String(text||'').matchAll(new RegExp('<'+tag+'>\\s*([\\s\\S]*?)\\s*</'+tag+'>','g'))];
  if(matches.length!==1)throw Error(tag+'_MISSING_OR_DUPLICATED');
  return JSON.parse(matches[0][1]);
}
function expectedShape(expected){
  if(!expected)return {ids:null,assertions:new Map()};
  if(Array.isArray(expected)&&expected.every(x=>typeof x==='string'))return {ids:[...expected],assertions:new Map()};
  if(Array.isArray(expected)){
    const ids=expected.map(x=>String(x&&x.criterion_id||''));
    const assertions=new Map(expected.map(x=>[
      String(x&&x.criterion_id||''),
      Array.isArray(x&&x.assertions)?x.assertions.map(a=>String(a&&a.assertion_id||'')).sort():[]
    ]));
    return {ids,assertions};
  }
  return {ids:null,assertions:new Map()};
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
        if(!(typeof v==='string'&&v.trim()||Array.isArray(v)&&v.length&&v.every(x=>typeof x==='string'&&x.trim())))errors.push(String(row&&row.criterion_id)+':MISSING_'+field);
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
  return {status:errors.length?'NON_VERIFIABLE':'COMPLETE',errors,criterion_ids:rows.map(r=>r&&r.criterion_id)};
}
function inspectImplementation(body,expected){
  try{
    const e=block(body,'KODJO_IMPLEMENTATION_REPORT_JSON');
    const report=inspectReport(e.report_text,expected);
    function field(name){const m=[...String(body).matchAll(new RegExp('^'+name+'=([^\\r\\n]+)$','gm'))];return m.length===1?m[0][1]:null;}
    if(e.request_id!==field('v2_request_id')||e.source_head!==field('base_head'))report.errors.push('REPORT_IDENTITY_MISMATCH');
    if(e.truncated!==false)report.errors.push('REPORT_TRUNCATED_OR_UNKNOWN');
    if(typeof e.report_text!=='string'||crypto.createHash('sha256').update(e.report_text||'').digest('hex')!==e.original_text_sha256)report.errors.push('REPORT_TEXT_HASH_MISMATCH');
    report.status=report.errors.length?'NON_VERIFIABLE':'COMPLETE';return report;
  }catch(e){return {status:'NON_VERIFIABLE',errors:['REPORT_ENVELOPE_INVALID:'+e.message],criterion_ids:[]};}
}
module.exports={inspectReport,inspectImplementation,FIELDS,ASSERTION_IMPLEMENTATION_STATUSES};
