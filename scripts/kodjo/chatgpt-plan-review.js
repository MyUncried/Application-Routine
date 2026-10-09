#!/usr/bin/env node
'use strict';
// ChatGPT owns dispatch and consumption; Claude only reads pinned Git objects.
const fs = require('node:fs');
const path = require('node:path');
const V = require('./lib/vnext-contract');
const Chain = require('./lib/vnext-live-chain');
const Lock = require('./lib/execution-lock');
const os = require('node:os');
const Bundle = require('./lib/vnext-file-bundle');
const SCHEMA = 'kodjo.vnext.chatgpt-plan-review-request.v1';
function validate(request) {
  V.assertExactKeys(request, ['schema_version','pilot','slice_id','repository','issue_number',
    'source_head','produced_file','produced_chain_hash','causal_file','contract_hash'], [], 'CHATGPT_REVIEW_REQUEST_KEYS');
  V.verifyContractHash(request, 'CHATGPT_REVIEW_REQUEST_HASH');
  if (request.schema_version !== SCHEMA || request.pilot !== 'CHATGPT_WORK'
      || request.slice_id !== 'VNEXT-PRE-4' || request.repository !== 'MyUncried/Application-Routine'
      || !Number.isSafeInteger(request.issue_number) || request.issue_number <= 0 || request.issue_number === 340)
    throw Error('CHATGPT_REVIEW_SCOPE_REFUSED');
  V.assertSha40(request.source_head, 'CHATGPT_REVIEW_SOURCE_HEAD');
  if (!/^[0-9a-f]{64}$/.test(request.produced_chain_hash)) throw Error('CHATGPT_REVIEW_PRODUCED_HASH');
  Chain.relative(request.produced_file);
  if (request.causal_file !== null) Chain.relative(request.causal_file);
  return request;
}
function load(request, cwd, chain = Chain) {
  validate(request);
  const produced = chain.readGitObject(cwd, request.source_head, request.produced_file);
  const a = chain.verifyProduced(produced, cwd);
  if (produced.contract_hash !== request.produced_chain_hash || a.planningEnvelope.slice_id !== request.slice_id
      || a.planningEnvelope.issue_id !== 'github_issue:' + request.repository + '#' + request.issue_number)
    throw Error('CHATGPT_REVIEW_PLAN_BINDING');
  let causalEvidence = null;
  if (a.planningEnvelope.planning_mode === 'REVISION') {
    if (!request.causal_file) throw Error('CHATGPT_REVIEW_CAUSAL_EVIDENCE_REQUIRED');
    causalEvidence = chain.readGitObject(cwd, request.source_head, request.causal_file);
    V.assertExactKeys(causalEvidence, ['base_plan','previous_review_report','allowed_change_set','revision_patch'], [], 'CHATGPT_REVIEW_CAUSAL_KEYS');
    for (const value of Object.values(causalEvidence)) V.verifyContractHash(value, 'CHATGPT_REVIEW_CAUSAL_HASH');
    if (causalEvidence.base_plan.contract_hash !== a.planningEnvelope.base_plan_hash
        || causalEvidence.previous_review_report.contract_hash !== a.planningEnvelope.base_review_hash)
      throw Error('CHATGPT_REVIEW_CAUSAL_BINDING');
  } else if (request.causal_file !== null) throw Error('CHATGPT_REVIEW_UNEXPECTED_CAUSAL_EVIDENCE');
  return {produced, causalEvidence};
}
function create(config, cwd) {
  const produced = Chain.readGitObject(cwd, config.source_head, config.produced_file);
  const envelope = produced.artifacts.planningEnvelope;
  const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(envelope.issue_id);
  if (!issue) throw Error('CHATGPT_REVIEW_ISSUE_REQUIRED');
  const request = V.sealContract({schema_version:SCHEMA,pilot:'CHATGPT_WORK',slice_id:envelope.slice_id,
    repository:issue[1],issue_number:Number(issue[2]),source_head:config.source_head,
    produced_file:config.produced_file,produced_chain_hash:produced.contract_hash,causal_file:config.causal_file || null});
  load(request,cwd); return request;
}
function verifyResult(request, result, {cwd, chain = Chain} = {}) {
  const {produced} = load(request,cwd,chain);
  V.verifyContractHash(result, 'CHATGPT_REVIEW_RESULT_HASH');
  if (result.schema_version !== 'kodjo.vnext.chatgpt-plan-review-result.v1'
      || result.request_hash !== request.contract_hash || result.produced_chain_hash !== produced.contract_hash
      || result.source_head !== request.source_head || result.slice_id !== request.slice_id)
    throw Error('CHATGPT_REVIEW_RESULT_BINDING');
  const report = chain.verifyReceipt(produced,result.review_receipt);
  if (result.verdict !== report.verdict) throw Error('CHATGPT_REVIEW_RESULT_VERDICT');
  return report;
}
function execute(request, {cwd, evidenceRoot, outputDirectory, chain = Chain, issueState, lock = Lock, priorAttempt = () => false} = {}) {
  validate(request);
  if (!evidenceRoot || !outputDirectory) throw Error('CHATGPT_REVIEW_STORAGE_REQUIRED');
  fs.mkdirSync(outputDirectory,{recursive:true});
  const diagnostic = {request_hash:request.contract_hash,slice_id:request.slice_id,
    state:'ORCHESTRATION_FAILURE',waiting_for:'TECHNICAL_RECOVERY',next_actor:'CHATGPT_WORK',
    model_invoked:false,run_id:process.env.GITHUB_RUN_ID || null,run_attempt:process.env.GITHUB_RUN_ATTEMPT || null};
  const record = () => fs.writeFileSync(path.join(outputDirectory,'checkpoint.json'),JSON.stringify(diagnostic,null,2)+'\n');
  let directory, ownedLock;
  try {
    if (issueState(340) !== 'closed') throw Error('CHATGPT_REVIEW_PRE3_NOT_CLOSED');
    if (issueState(request.issue_number) !== 'open') throw Error('CHATGPT_REVIEW_ISSUE_NOT_OPEN');
    const {produced,causalEvidence} = load(request,cwd,chain);
    const rel = path.relative(cwd,path.resolve(evidenceRoot));
    if (!rel || (!rel.startsWith('..'+path.sep) && !path.isAbsolute(rel))) throw Error('CHATGPT_REVIEW_CACHE_OUTSIDE_CHECKOUT_REQUIRED');
    // Deduplicate by the immutable dossier, even across different request commits.
    directory = path.join(evidenceRoot,request.produced_chain_hash);
    fs.mkdirSync(directory,{recursive:true});
    const receiptFile = path.join(directory,'receipt.json'), intentFile = path.join(directory,'invocation-intent.json');
    const responseFile = path.join(directory,produced.artifacts.planningEnvelope.planning_mode.toLowerCase()+'-review-response.json');
    let receipt;
    if (fs.existsSync(receiptFile)) {
      receipt = Bundle.read(receiptFile); chain.verifyReceipt(produced,receipt);
    } else if (fs.existsSync(responseFile)) {
      receipt = chain.recoverReview(produced,{cwd,evidenceDirectory:directory});
    } else {
      if (fs.existsSync(intentFile) || priorAttempt()) throw Error('CHATGPT_REVIEW_PRIOR_INVOCATION_UNKNOWN_NO_RETRY');
      // Exclusive creation also protects against concurrent dispatches/processes.
      const active = lock.claudeProcessState();
      if (active.state !== 'NONE' || active.external_claude_count > 0) throw Error('CHATGPT_REVIEW_CLAUDE_EXECUTION_UNAVAILABLE');
      ownedLock = lock.acquire(path.join(process.env.KODJO_STATE_ROOT || path.join(os.homedir(),'.kodjo-v2'),'claude-local.lock'),
        {run_id:diagnostic.run_id || request.contract_hash,request_id:request.contract_hash,
          github_run_id:diagnostic.run_id,github_run_attempt:diagnostic.run_attempt});
      fs.writeFileSync(intentFile,JSON.stringify({produced_chain_hash:produced.contract_hash,request_hash:request.contract_hash}),{flag:'wx'});
      diagnostic.model_invoked = true; record();
      receipt = chain.review(produced,{cwd,evidenceDirectory:directory,causalEvidence});
    }
    chain.verifyReceipt(produced,receipt);
    if (!fs.existsSync(receiptFile)) Bundle.write(receiptFile,receipt,{exclusive:true});
    const result = V.sealContract({schema_version:'kodjo.vnext.chatgpt-plan-review-result.v1',
      request_hash:request.contract_hash,source_head:request.source_head,slice_id:request.slice_id,
      produced_chain_hash:produced.contract_hash,verdict:receipt.review_report.verdict,review_receipt:receipt});
    verifyResult(request,result,{cwd,chain});
    Bundle.write(path.join(outputDirectory,'result.json'),result);
    Bundle.write(path.join(outputDirectory,'review-receipt.json'),receipt);
    Bundle.write(path.join(outputDirectory,'review-report.json'),receipt.review_report);
    Object.assign(diagnostic,{state:'PLAN_REVIEW_COMPLETED',waiting_for:'CHATGPT_REVIEW_CONSUMPTION',
      next_actor:'CHATGPT_WORK',verdict:result.verdict,resume_from:request.contract_hash});
    record(); return result;
  } catch (error) {
    diagnostic.error = Chain.boundedReviewOutput(error.message).text; record(); throw error;
  } finally {
    // Copy raw process evidence as well, including a refusal or quota diagnostic.
    try { if (directory && fs.existsSync(directory)) fs.cpSync(directory,path.join(outputDirectory,'process-evidence'),{recursive:true}); }
    finally { if (ownedLock) lock.release(ownedLock); }
  }
}
function main(args = process.argv.slice(2)) {
  const [stage,input,output] = args,cwd = process.cwd();
  if(stage === 'create') {
    const request = create(Bundle.read(input),cwd);
    const file = path.join(output,request.contract_hash+'.json');
    if(fs.existsSync(file)) {
      if(V.canonicalHash(Bundle.read(file)) !== V.canonicalHash(request)) throw Error('CHATGPT_REVIEW_EXISTING_REQUEST_MISMATCH');
    } else Bundle.write(file,request,{exclusive:true});
    return {request_hash:request.contract_hash,request_path:file};
  }
  if(stage === 'execute') {
    V.assertSha40(input,'CHATGPT_REVIEW_REQUEST_COMMIT');
    if (!/^\.github\/orchestration\/requests\/vnext-plan-review\/[0-9a-f]{64}\.json$/.test(output)) throw Error('CHATGPT_REVIEW_REQUEST_PATH');
    const request = Chain.readGitObject(cwd,input,Chain.relative(output));
    validate(request);
    if (path.posix.basename(output,'.json') !== request.contract_hash) throw Error('CHATGPT_REVIEW_REQUEST_PATH_HASH');
    Chain.command('git',['merge-base','--is-ancestor',request.source_head,input],cwd);
    if (Chain.command('git',['rev-parse','HEAD'],cwd).trim() !== input
        || Chain.command('git',['status','--porcelain'],cwd).trim()) throw Error('CHATGPT_REVIEW_CHECKOUT_MISMATCH');
    if(process.env.GITHUB_REPOSITORY !== request.repository) throw Error('CHATGPT_REVIEW_REPOSITORY_MISMATCH');
    const issueState = number => JSON.parse(Chain.command('gh',['api','repos/'+request.repository+'/issues/'+number],cwd)).state;
    const priorAttempt = () => {
      if (Number(process.env.GITHUB_RUN_ATTEMPT) > 1) return true;
      for (let page=1;page<=100;page++) {
        const rows=JSON.parse(Chain.command('gh',['api','repos/'+request.repository+
          '/actions/workflows/kodjo-vnext-chatgpt-plan-review.yml/runs?per_page=100&page='+page],cwd)).workflow_runs;
        if (!Array.isArray(rows)) throw Error('CHATGPT_REVIEW_PRIOR_RUN_SCAN_INVALID');
        if (rows.some(r=>String(r.id)!==process.env.GITHUB_RUN_ID && r.display_title===
          'VNext PRE-4 plan review / '+input)) return true;
        if (rows.length<100) return false;
      }
      throw Error('CHATGPT_REVIEW_PRIOR_RUN_SCAN_INCOMPLETE');
    };
    return execute(request,{cwd,evidenceRoot:process.env.KODJO_REVIEW_CACHE,
      outputDirectory:process.env.KODJO_REVIEW_OUTPUT,issueState,priorAttempt});
  }
  if(stage === 'verify') return verifyResult(Bundle.read(input),Bundle.read(output),{cwd});
  throw Error('Usage: chatgpt-plan-review.js <create config output|execute request_commit request_path|verify request result>');
}
if(require.main === module) try { const result=main(); process.stdout.write(JSON.stringify({status:'RECORDED',request_hash:result.request_hash || null,request_path:result.request_path || null,verdict:result.verdict || null})+'\n'); }
catch(error) { process.stderr.write(error.message+'\n');process.exitCode=1; }
module.exports = {validate,load,create,verifyResult,execute,main};
