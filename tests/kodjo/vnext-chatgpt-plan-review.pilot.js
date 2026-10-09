'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const V = require('../../scripts/kodjo/lib/vnext-contract');
const Bundle = require('../../scripts/kodjo/lib/vnext-file-bundle');
const R = require('../../scripts/kodjo/chatgpt-plan-review');
function reseal(value) {return V.sealContract(Object.fromEntries(Object.entries(value).filter(([k])=>k !== 'contract_hash')));}
function fixture(verdict = 'APPROVE') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'chatgpt-review-relay-'));
  const cwd=path.join(root,'checkout');fs.mkdirSync(cwd);
  const produced=V.sealContract({artifacts:{planningEnvelope:{slice_id:'VNEXT-PRE-4',
    issue_id:'github_issue:MyUncried/Application-Routine#999',planning_mode:'INITIAL'}}});
  const request=V.sealContract({schema_version:'kodjo.vnext.chatgpt-plan-review-request.v1',pilot:'CHATGPT_WORK',
    slice_id:'VNEXT-PRE-4',repository:'MyUncried/Application-Routine',issue_number:999,
    source_head:'a'.repeat(40),produced_file:'produced.json',produced_chain_hash:produced.contract_hash,causal_file:null});
  const receipt=V.sealContract({review_report:{verdict},produced_chain_hash:produced.contract_hash});
  let calls=0,recovers=0;
  const chain={readGitObject:()=>produced,verifyProduced:p=>p.artifacts,
    verifyReceipt:(p,r)=>{V.verifyContractHash(r);assert.equal(r.produced_chain_hash,p.contract_hash);return r.review_report;},
    review:(p,opts)=>{calls++;fs.writeFileSync(path.join(opts.evidenceDirectory,'initial-review-response.json'),'response');return receipt;},
    recoverReview:()=>{recovers++;return receipt;}};
  const lock={claudeProcessState:()=>({state:'NONE'}),acquire:()=>({}),release:()=>true};
  const options={cwd,evidenceRoot:path.join(root,'cache'),outputDirectory:path.join(root,'published'),chain,lock,
    issueState:n=>n===340?'closed':'open'};
  return {root,request,produced,receipt,chain,options,counts:()=>({calls,recovers}),cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
function withFixture(fn,verdict) {const f=fixture(verdict);try{fn(f);}finally{f.cleanup();}}
test('PRE-3, other pilots, altered requests and path traversal are rejected before invocation',()=>withFixture(f=>{
  for(const patch of [{slice_id:'VNEXT-PRE-3'},{pilot:'CLAUDE_CODE'},{issue_number:340},{produced_file:'../plan.json'}]) {
    assert.throws(()=>R.execute(reseal({...f.request,...patch}),f.options));
  }
  assert.throws(()=>R.execute({...f.request,produced_chain_hash:'b'.repeat(64)},f.options),/HASH/);
  assert.deepEqual(f.counts(),{calls:0,recovers:0});
}));
test('PRE-3 closure, issue state, source mismatch and Claude concurrency fail before paid review',()=>withFixture(f=>{
  assert.throws(()=>R.execute(f.request,{...f.options,issueState:()=> 'open'}),/PRE3_NOT_CLOSED/);
  assert.throws(()=>R.execute(f.request,{...f.options,issueState:()=> 'closed'}),/ISSUE_NOT_OPEN/);
  assert.throws(()=>R.execute(reseal({...f.request,produced_chain_hash:'b'.repeat(64)}),f.options),/PLAN_BINDING/);
  assert.throws(()=>R.execute(f.request,{...f.options,lock:{claudeProcessState:()=>({state:'ACTIVE'})}}),/UNAVAILABLE/);
  assert.equal(f.counts().calls,0);
}));
test('one call, exact result, duplicate dispatch and artifact republication without another call',()=>withFixture(f=>{
  const result=R.execute(f.request,f.options);assert.equal(R.verifyResult(f.request,result,f.options).verdict,'APPROVE');
  fs.rmSync(f.options.outputDirectory,{recursive:true});
  R.execute(f.request,f.options);
  assert.deepEqual(f.counts(),{calls:1,recovers:0});
  assert.equal(Bundle.read(path.join(f.options.outputDirectory,'review-receipt.json')).contract_hash,f.receipt.contract_hash);
  const checkpoint=JSON.parse(fs.readFileSync(path.join(f.options.outputDirectory,'checkpoint.json')));
  assert.equal(checkpoint.next_actor,'CHATGPT_WORK');assert.equal(checkpoint.model_invoked,false);
}));
test('failure after saved response recovers response instead of invoking Claude',()=>withFixture(f=>{
  const real=f.chain.review;f.chain.review=(...args)=>{real(...args);throw Error('transport interrupted');};
  assert.throws(()=>R.execute(f.request,f.options),/interrupted/);
  assert.ok(fs.existsSync(path.join(f.options.outputDirectory,'process-evidence','initial-review-response.json')));
  R.execute(f.request,f.options);assert.deepEqual(f.counts(),{calls:1,recovers:1});
}));
test('an uncertain or quota-failed call is durable and never retried implicitly',()=>withFixture(f=>{
  f.chain.review=()=>{throw Error('VNEXT_REVIEW_USAGE_LIMIT');};
  assert.throws(()=>R.execute(f.request,f.options),/USAGE_LIMIT/);
  assert.throws(()=>R.execute(f.request,f.options),/PRIOR_INVOCATION_UNKNOWN_NO_RETRY/);
  const checkpoint=JSON.parse(fs.readFileSync(path.join(f.options.outputDirectory,'checkpoint.json')));
  assert.equal(checkpoint.state,'ORCHESTRATION_FAILURE');assert.equal(checkpoint.model_invoked,false);
}));
test('REVISE is a review result, never an approval; stale results are refused',()=>withFixture(f=>{
  const result=R.execute(f.request,f.options);assert.equal(result.verdict,'REVISE');
  assert.throws(()=>R.verifyResult(f.request,reseal({...result,request_hash:'c'.repeat(64)}),f.options),/RESULT_BINDING/);
  assert.throws(()=>R.verifyResult(f.request,reseal({...result,verdict:'APPROVE'}),f.options),/VERDICT/);
},'REVISE'));
test('revision requires pinned causal evidence before invocation',()=>withFixture(f=>{
  f.produced.artifacts.planningEnvelope.planning_mode='REVISION';
  assert.throws(()=>R.execute(f.request,f.options),/CAUSAL_EVIDENCE_REQUIRED/);assert.equal(f.counts().calls,0);
}));
test('workflow triggers only exact requests or dispatch, uses trusted main code, read-only permissions and always publishes evidence',()=>{
  const workflow=require('../../scripts/kodjo/lib/yaml').parse(fs.readFileSync(path.resolve(__dirname,'../../.github/workflows/kodjo-vnext-chatgpt-plan-review.yml'),'utf8'));
  assert.deepEqual(Object.keys(workflow.on),['push','workflow_dispatch']);
  assert.deepEqual(workflow.on.push.branches,['main']);
  assert.deepEqual(workflow.on.push.paths,['.github/orchestration/requests/vnext-plan-review/*.json','.github/orchestration/requests/vnext-agent/*.json']);
  assert.match(workflow.jobs.review.steps.find(s=>s.name==='Select exactly one newly committed request').run,/SINGLE_REQUEST_COMMIT_REQUIRED/);
  assert.deepEqual(workflow.permissions,{contents:'read',issues:'read',actions:'read'});
  assert.match(workflow.jobs.review.if,/refs\/heads\/main/);
  const steps=workflow.jobs.review.steps;
  assert.ok(steps.filter(s=>s.uses?.startsWith('actions/checkout')).every(s=>s.with['persist-credentials']===false));
  assert.equal(steps.find(s=>s.uses?.startsWith('actions/upload-artifact')).if,'always()');
});

test('lost cache with a prior GitHub attempt refuses a new model call',()=>withFixture(f=>{
  assert.throws(()=>R.execute(f.request,{...f.options,priorAttempt:()=>true}),/PRIOR_INVOCATION_UNKNOWN_NO_RETRY/);
  assert.equal(f.counts().calls,0);
}));
test('pinned Git bundles ignore local edits and reject corrupted committed parts',()=>withFixture(f=>{
  const git=(...args)=>require('node:child_process').execFileSync('git',args,{cwd:f.options.cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init');git('config','user.name','Test');git('config','user.email','test@example.invalid');
  Bundle.write(path.join(f.options.cwd,'produced.json'),f.produced,{forceBundle:true});
  git('add','.');git('commit','-m','pinned review data');
  const head=git('rev-parse','HEAD'),request=reseal({...f.request,source_head:head});
  const chain={...f.chain,readGitObject:require('../../scripts/kodjo/lib/vnext-live-chain').readGitObject};
  const manifest=JSON.parse(fs.readFileSync(path.join(f.options.cwd,'produced.json')));
  fs.writeFileSync(path.join(f.options.cwd,'produced.json'),'uncommitted invalid data');
  assert.equal(R.load(request,f.options.cwd,chain).produced.contract_hash,f.produced.contract_hash);
  // Commit a deliberately damaged bundle: its manifest cannot silently attest it.
  fs.writeFileSync(path.join(f.options.cwd,'produced.json'),JSON.stringify(manifest));
  const parts=git('ls-files').split('\n').filter(name=>name!=='produced.json');
  assert.ok(parts.length);fs.writeFileSync(path.join(f.options.cwd,parts[0]),'{}');
  git('add','.');git('commit','-m','damaged transport');
  assert.throws(()=>R.load(reseal({...request,source_head:git('rev-parse','HEAD')}),f.options.cwd,chain));
}));
