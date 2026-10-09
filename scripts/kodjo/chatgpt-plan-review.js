#!/usr/bin/env node
'use strict';
// ChatGPT owns dispatch and consumption; Claude only reads pinned Git objects.
const fs = require('node:fs');
const path = require('node:path');
const V = require('./lib/vnext-contract');
const Chain = require('./lib/vnext-live-chain');
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
function execute(request, options = {}) {
  validate(request);
  const {cwd,chain=Chain}=options;
  let loaded;
  const adapter={name:'plan-review',storageKey:request.produced_chain_hash,
    preflight:()=>{loaded=load(request,cwd,chain);},
    hasResponse:directory=>fs.existsSync(path.join(directory,loaded.produced.artifacts.planningEnvelope.planning_mode.toLowerCase()+'-review-response.json')),
    invoke:directory=>chain.review(loaded.produced,{cwd,evidenceDirectory:directory,causalEvidence:loaded.causalEvidence}),
    recover:directory=>chain.recoverReview(loaded.produced,{cwd,evidenceDirectory:directory}),
    verify:receipt=>{chain.verifyReceipt(loaded.produced,receipt);return receipt;},
    result:receipt=>{
      const result=V.sealContract({schema_version:'kodjo.vnext.chatgpt-plan-review-result.v1',request_hash:request.contract_hash,
        source_head:request.source_head,slice_id:request.slice_id,produced_chain_hash:loaded.produced.contract_hash,
        verdict:receipt.review_report.verdict,review_receipt:receipt});
      verifyResult(request,result,{cwd,chain});return result;
    }};
  return require('./lib/vnext-agent-relay').execute(request,{...options,adapter});
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
        if (rows.some(r=>String(r.id)!==process.env.GITHUB_RUN_ID && ['VNext PRE-4 plan review / '+input,'VNext PRE-4 agent operation / '+input].includes(r.display_title))) return true;
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
