'use strict';
const crypto=require('node:crypto');
const {REQUIRED_STOPS}=require('./implementation-contract');
const FIELDS=['implementation_status','files_or_symbols','component_used','tests_run','proof_status','preserve_status','residual_status'];
function block(text,tag){
  const matches=[...String(text||'').matchAll(new RegExp('<'+tag+'>\\s*([\\s\\S]*?)\\s*</'+tag+'>','g'))];
  if(matches.length!==1)throw Error(tag+'_MISSING_OR_DUPLICATED');
  return JSON.parse(matches[0][1]);
}
function inspectReport(text,expectedIds){
  const errors=[];let rows=[];
  const stops=[...String(text||'').matchAll(/^KODJO_STOP_STATUS:\s*([A-Z_]+)\s*$/gm)].map(m=>m[1]);
  if(stops.length!==1||!['NONE',...REQUIRED_STOPS].includes(stops[0])||!String(text).trimEnd().endsWith('KODJO_STOP_STATUS: '+stops[0]))errors.push('STOP_MARKER_MISSING_INVALID_OR_DUPLICATED');
  if(stops.length===1&&stops[0]!=='NONE')errors.push('REPORTED_STOP:'+stops[0]);
  try{
    const value=block(text,'KODJO_IMPLEMENTATION_CONFORMANCE');
    if(!value||!Array.isArray(value.criteria))throw Error('CRITERIA_MISSING');
    rows=value.criteria;
    const ids=rows.map(r=>r&&r.criterion_id);
    if(ids.some(id=>typeof id!=='string'||!id.trim())||new Set(ids).size!==ids.length)errors.push('CRITERIA_INVALID_OR_DUPLICATED');
    if(expectedIds&&JSON.stringify([...ids].sort())!==JSON.stringify([...expectedIds].sort()))errors.push('CRITERIA_COVERAGE_MISMATCH');
    for(const row of rows){
      for(const field of FIELDS){
        const v=row&&row[field];
        // Explicit NONE/NOT_RUN with an explanation is evidence to assess;
        // missing/null/empty values are never complete evidence.
        if(!(typeof v==='string'&&v.trim()||Array.isArray(v)&&v.length&&v.every(x=>typeof x==='string'&&x.trim())))errors.push(String(row&&row.criterion_id)+':MISSING_'+field);
      }
    }
  }catch(e){errors.push('REPORT_NOT_STRUCTURED:'+e.message);}
  return {status:errors.length?'NON_VERIFIABLE':'COMPLETE',errors,criterion_ids:rows.map(r=>r&&r.criterion_id)};
}
function inspectImplementation(body,expectedIds){
  try{
    const e=block(body,'KODJO_IMPLEMENTATION_REPORT_JSON');
    const report=inspectReport(e.report_text,expectedIds);
    function field(name){const m=[...String(body).matchAll(new RegExp('^'+name+'=([^\\r\\n]+)$','gm'))];return m.length===1?m[0][1]:null;}
    if(e.request_id!==field('v2_request_id')||e.source_head!==field('v2_protocol_head'))report.errors.push('REPORT_IDENTITY_MISMATCH');
    if(e.truncated!==false)report.errors.push('REPORT_TRUNCATED_OR_UNKNOWN');
    if(typeof e.report_text!=='string'||crypto.createHash('sha256').update(e.report_text||'').digest('hex')!==e.original_text_sha256)report.errors.push('REPORT_TEXT_HASH_MISMATCH');
    report.status=report.errors.length?'NON_VERIFIABLE':'COMPLETE';return report;
  }catch(e){return {status:'NON_VERIFIABLE',errors:['REPORT_ENVELOPE_INVALID:'+e.message],criterion_ids:[]};}
}
module.exports={inspectReport,inspectImplementation,FIELDS};
