#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {inspectReport}=require('./lib/implementation-report');
const {extractClaudeResultText}=require('./run-local-claude');
// Evidence transport only. The existing independent review decides completeness
// against every approved criterion; this does not add a runtime protocol gate.
function collect(runDir,requestId,sourceHead){
  const result=JSON.parse(fs.readFileSync(path.join(runDir,'result.json'),'utf8'));
  if(result.request_id!==requestId||result.source_head!==sourceHead)throw Error('IMPLEMENTATION_REPORT_IDENTITY_MISMATCH');
  const file=path.join(runDir,'claude-output.json');
  const text=fs.existsSync(file)?extractClaudeResultText(fs.readFileSync(file,'utf8')):'';
  const assessment=inspectReport(text);
  const evidence={request_id:requestId,source_head:sourceHead,
    report_present:text.includes('KODJO_IMPLEMENTATION_CONFORMANCE'),
    stop_marker_present:/^KODJO_STOP_STATUS:\s*[A-Z_]+\s*$/m.test(text),
    original_text_sha256:crypto.createHash('sha256').update(text).digest('hex'),
    machine_evidence:{
      modified_files:Array.isArray(result.modified_files)?[...result.modified_files].sort():[],
      agent_mutation_files:Array.isArray(result.agent_mutation_files)?[...result.agent_mutation_files].sort():[],
      out_of_scope_files:Array.isArray(result.out_of_scope_files)?[...result.out_of_scope_files].sort():[],
      post_check_drift:Array.isArray(result.post_check_drift)?[...result.post_check_drift]:[],
      integrity_status:result.integrity_status||null,
      checks:Array.isArray(result.checks)?result.checks.map(x=>({check:x.check,status:x.status,exit_code:x.exit_code,passed_tests:x.passed_tests,failed_tests:x.failed_tests,total_tests:x.total_tests})):[],
    },
    structural_assessment:{status:assessment.status,errors:assessment.errors.slice(0,20).map(error=>error.slice(0,200)),criterion_count:assessment.criterion_ids.length},truncated:false,report_text:text};
  // Keep the comment under GitHub's size bound without silently claiming that
  // a shortened report is complete. Full stdout remains in diagnostic evidence.
  while(Buffer.byteLength(JSON.stringify(evidence),'utf8')>40000){
    if(!evidence.report_text.length)throw Error('IMPLEMENTATION_EVIDENCE_TOO_LARGE');
    evidence.report_text=evidence.report_text.slice(0,Math.floor(evidence.report_text.length*0.8));
    evidence.truncated=true;
  }
  return evidence;
}
if(require.main===module){try{
  const [dir,id,head,out]=process.argv.slice(2);
  fs.writeFileSync(out,JSON.stringify(collect(dir,id,head))+'\n');
}catch(e){process.stderr.write(e.message+'\n');process.exit(1);}}
module.exports={collect};
