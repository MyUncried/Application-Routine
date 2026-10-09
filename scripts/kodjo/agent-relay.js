#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const V=require('./lib/vnext-contract'),B=require('./lib/vnext-file-bundle'),Chain=require('./lib/vnext-live-chain');
const Relay=require('./lib/vnext-agent-relay');
const OPERATIONS=Object.freeze(['plan-review','review-scope','implementation-review']);
const SCHEMA='kodjo.vnext.agent-request.v1';
function validate(request){
  V.assertExactKeys(request,['schema_version','pilot','slice_id','repository','issue_number','source_head','operation','inputs_file','inputs_hash','operation_hash','contract_hash'],[],'AGENT_REQUEST_KEYS');
  V.verifyContractHash(request,'AGENT_REQUEST_HASH');V.assertSha40(request.source_head,'AGENT_REQUEST_HEAD');V.assertSha64(request.inputs_hash,'AGENT_REQUEST_INPUTS_HASH');V.assertSha64(request.operation_hash,'AGENT_REQUEST_OPERATION_HASH');
  Chain.relative(request.inputs_file);
  if(request.schema_version!==SCHEMA||request.pilot!=='CHATGPT_WORK'||request.slice_id!=='VNEXT-PRE-4'
    ||request.repository!=='MyUncried/Application-Routine'||!Number.isSafeInteger(request.issue_number)||request.issue_number<=0
    ||request.issue_number===340||!OPERATIONS.includes(request.operation))throw Error('AGENT_REQUEST_SCOPE_REFUSED');
  return request;
}
function inputs(request,cwd){
  validate(request);const data=Chain.readGitObject(cwd,request.source_head,request.inputs_file);
  if(V.canonicalHash(data)!==request.inputs_hash)throw Error('AGENT_REQUEST_INPUTS_CHANGED');return data;
}
function create(config,cwd){
  const data=Chain.readGitObject(cwd,config.source_head,config.inputs_file);
  let request=V.sealContract({schema_version:SCHEMA,pilot:'CHATGPT_WORK',slice_id:config.slice_id,repository:config.repository,
    issue_number:config.issue_number,source_head:config.source_head,operation:config.operation,inputs_file:config.inputs_file,inputs_hash:V.canonicalHash(data),operation_hash:'0'.repeat(64)});
  validate(request);const adapter=adapterFor(request,cwd);adapter.preflight();const {contract_hash,...fields}=request;request=V.sealContract({...fields,operation_hash:adapter.storageKey});return request;
}
function adapterFor(request,cwd,{invoke}={}){
  const data=inputs(request,cwd),read=file=>Chain.readGitObject(cwd,request.source_head,Chain.relative(file));
  let operation;
  if(request.operation==='plan-review'){
    V.assertExactKeys(data,['produced_file','causal_file'],[],'AGENT_PLAN_INPUTS');
    const legacy=require('./chatgpt-plan-review');
    const derived=legacy.create({source_head:request.source_head,...data},cwd);
    if(derived.slice_id!==request.slice_id||derived.issue_number!==request.issue_number||derived.repository!==request.repository)throw Error('AGENT_PLAN_BINDING');
    const loaded=legacy.load(derived,cwd);
    operation={storageKey:loaded.produced.contract_hash,preflight:()=>legacy.load(derived,cwd),
      hasResponse:d=>fs.existsSync(path.join(d,loaded.produced.artifacts.planningEnvelope.planning_mode.toLowerCase()+'-review-response.json')),
      invoke:d=>Chain.review(loaded.produced,{cwd,evidenceDirectory:d,causalEvidence:loaded.causalEvidence,...(invoke?{invoke}:{})}),
      recover:d=>Chain.recoverReview(loaded.produced,{cwd,evidenceDirectory:d}),
      verify:r=>{Chain.verifyReceipt(loaded.produced,r);return r;},verdict:r=>r.review_report.verdict};
  }else if(request.operation==='review-scope'){
    V.assertExactKeys(data,['produced_file','review_receipt_file','scope_request_file'],[],'AGENT_SCOPE_INPUTS');
    const produced=read(data.produced_file),baseReceipt=read(data.review_receipt_file),scopeRequest=read(data.scope_request_file);
    const Scope=require('./lib/vnext-review-scope');
    const envelope=produced.artifacts.planningEnvelope;
    if(envelope.slice_id!==request.slice_id||envelope.issue_id!=='github_issue:'+request.repository+'#'+request.issue_number)throw Error('AGENT_SCOPE_BINDING');
    const context=()=>({reviewContext:Chain.verifyProduced(produced,cwd).reviewContext,
      reviewReport:Chain.verifyReceipt(produced,baseReceipt),artifactGraph:require('./lib/revision-contract').buildArtifactGraph(produced.artifacts)});
    const preflight=()=>{
      const ctx=context();Scope.validateRequest(scopeRequest);
      const rebuilt=Scope.buildRequest({...ctx,candidates:scopeRequest.requests.map(r=>({finding_id:r.finding_id,target_ids:r.targets.map(t=>t.target_id),reason:r.reason}))});
      if(rebuilt.contract_hash!==scopeRequest.contract_hash)throw Error('AGENT_SCOPE_INPUT_BINDING');
    };
    const run=(d,recover)=>Scope.run({produced,baseReceipt,request:scopeRequest,cwd,evidenceDirectory:d,recover,...(invoke?{invoke}:{})});
    operation={storageKey:V.canonicalHash({operation:'review-scope',produced:produced.contract_hash,baseReceipt:baseReceipt.contract_hash,scopeRequest:scopeRequest.contract_hash}),preflight,hasResponse:d=>fs.existsSync(path.join(d,'scope-review-response.json')),invoke:d=>run(d,false),recover:d=>run(d,true),
      verify:r=>{Scope.validateReceipt(r,context());if(r.request.contract_hash!==scopeRequest.contract_hash)throw Error('AGENT_SCOPE_RECEIPT_BINDING');return r;},verdict:()=>null};
  }else{
    V.assertExactKeys(data,['produced_file','approved_plan_file','observations_file','evidence_files'],[],'AGENT_IMPLEMENTATION_INPUTS');
    if(!Array.isArray(data.evidence_files))throw Error('AGENT_IMPLEMENTATION_EVIDENCE_REQUIRED');
    const planBody=Chain.readGit(cwd,request.source_head,Chain.relative(data.approved_plan_file)),observed=read(data.observations_file);
    V.assertExactKeys(observed,['approvedPlanSha256','deliveryHead','measurements','scenarioResults'],[],'AGENT_IMPLEMENTATION_OBSERVATIONS');
    V.assertSha40(observed.deliveryHead,'AGENT_IMPLEMENTATION_HEAD_BINDING');
    Chain.command('git',['merge-base','--is-ancestor',observed.deliveryHead,request.source_head],cwd);
    // Bind the approved transport's issue/slice to this request as well.
    const produced=read(data.produced_file),envelope=produced.artifacts.planningEnvelope;
    if(envelope.slice_id!==request.slice_id||envelope.issue_id!=='github_issue:'+request.repository+'#'+request.issue_number)throw Error('AGENT_IMPLEMENTATION_SCOPE_BINDING');
    const plan=require('./lib/machine-block').parse(planBody,'KODJO_VNEXT_PLAN_CONTRACT_JSON',{code:'AGENT_IMPLEMENTATION_PLAN_REQUIRED',cwd,readText:file=>Chain.readGit(cwd,request.source_head,path.relative(cwd,file).split(path.sep).join('/'))});
    V.verifyContractHash(plan);
    if(plan.contract_hash!==produced.artifacts.planContract.contract_hash)throw Error('AGENT_IMPLEMENTATION_PLAN_BINDING');
    const F=require('./lib/vnext-figma-implementation-review');
    const materialize=d=>{
      const seen=new Set();
      for(const row of data.evidence_files){
        V.assertExactKeys(row,['artifact_path','git_path','sha256'],[],'AGENT_IMPLEMENTATION_FILE_KEYS');
        const relative=Chain.relative(row.artifact_path);Chain.relative(row.git_path);V.assertSha64(row.sha256);
        if(seen.has(relative)||!/^(facts\/)[A-Za-z0-9_./-]+\.json$/.test(relative))throw Error('AGENT_IMPLEMENTATION_FILE_PATH');seen.add(relative);
        const bytes=Chain.readGit(cwd,request.source_head,row.git_path);
        if(V.sha256(bytes)!==row.sha256)throw Error('AGENT_IMPLEMENTATION_FILE_CHANGED');
        const file=path.join(d,relative);fs.mkdirSync(path.dirname(file),{recursive:true});
        if(fs.existsSync(file)){if(V.sha256(fs.readFileSync(file))!==row.sha256)throw Error('AGENT_IMPLEMENTATION_CACHE_CHANGED');}
        else fs.writeFileSync(file,bytes,{flag:'wx'});
      }
      return {...observed,cwd,evidenceDirectory:d,portableReceipt:true,readText:file=>Chain.readGit(cwd,request.source_head,path.relative(cwd,file).split(path.sep).join('/'))};
    };
    operation={storageKey:V.canonicalHash({operation:'implementation-review',plan:V.sha256(planBody),observed,evidence_files:data.evidence_files}),preflight:()=>{
      Chain.verifyProduced(produced,cwd);
      if(V.sha256(planBody)!==observed.approvedPlanSha256)throw Error('AGENT_IMPLEMENTATION_PLAN_CHANGED');
      for(const row of data.evidence_files)if(V.sha256(Chain.readGit(cwd,request.source_head,Chain.relative(row.git_path)))!==row.sha256)throw Error('AGENT_IMPLEMENTATION_FILE_CHANGED');
    },hasResponse:d=>fs.existsSync(path.join(d,'implementation-review-response.json')),
      invoke:d=>F.review(planBody,{...materialize(d),...(invoke?{invoke}:{})}),recover:d=>F.recover(planBody,materialize(d)),
      verify:(r,d)=>F.verifyReceipt(planBody,materialize(d),r,fs.readFileSync(path.join(d,'implementation-review-response.json'),'utf8')),
      verdict:r=>r.assessment.verdict};
  }
  return {...operation,name:request.operation,result:r=>V.sealContract({schema_version:'kodjo.vnext.agent-result.v1',
    request_hash:request.contract_hash,source_head:request.source_head,slice_id:request.slice_id,operation:request.operation,
    inputs_hash:request.inputs_hash,status:'COMPLETED',verdict:operation.verdict(r),receipt:r})};
}
function execute(request,options){
  validate(request);let loaded;
  const adapter=options.adapter||{name:request.operation,preflight:()=>{loaded=adapterFor(request,options.cwd);loaded.preflight();if(loaded.storageKey!==request.operation_hash)throw Error('AGENT_OPERATION_BINDING');adapter.storageKey=loaded.storageKey;},
    hasResponse:d=>loaded.hasResponse(d),invoke:d=>loaded.invoke(d),recover:d=>loaded.recover(d),verify:(r,d)=>loaded.verify(r,d),result:(r,d)=>loaded.result(r,d)};
  return Relay.execute(request,{...options,adapter});
}
function verify(request,directory,{cwd}={}){
  validate(request);Relay.verifyEvidence(request,directory);
  const file=path.join(directory,fs.existsSync(path.join(directory,'failure.json'))?'failure.json':'result.json');
  const result=B.read(file);V.verifyContractHash(result);
  if(result.request_hash!==request.contract_hash||result.source_head!==request.source_head||result.slice_id!==request.slice_id||result.operation!==request.operation)throw Error('AGENT_RESULT_BINDING');
  if(result.schema_version==='kodjo.vnext.agent-failure.v1'&&result.status==='ORCHESTRATION_FAILURE')return result;
  if(result.schema_version!=='kodjo.vnext.agent-result.v1'||result.inputs_hash!==request.inputs_hash||result.status!=='COMPLETED')throw Error('AGENT_RESULT_SCHEMA');
  const adapter=adapterFor(request,cwd);adapter.preflight();if(adapter.storageKey!==request.operation_hash)throw Error('AGENT_OPERATION_BINDING');
  const receipt=adapter.verify(result.receipt,path.join(directory,'process-evidence'));
  if(V.canonicalHash(adapter.result(receipt))!==V.canonicalHash(result))throw Error('AGENT_RESULT_CHANGED');return result;
}
function priorInvocation(request,input,cwd,command=Chain.command){
    if(Number(process.env.GITHUB_RUN_ATTEMPT)>1)return true;
    for(let page=1;page<=100;page++){
      const rows=JSON.parse(command('gh',['api','repos/'+request.repository+'/actions/workflows/kodjo-vnext-chatgpt-plan-review.yml/runs?per_page=100&page='+page],cwd)).workflow_runs;
      if(!Array.isArray(rows))throw Error('AGENT_PRIOR_RUN_SCAN_INVALID');
      for(const run of rows){
        if(String(run.id)===process.env.GITHUB_RUN_ID)continue;
        const commit=/^VNext PRE-4 (?:plan review|agent operation) \/ ([0-9a-f]{40})$/.exec(run.display_title)?.[1];
        if(!commit)throw Error('AGENT_PRIOR_RUN_BINDING_UNKNOWN');
        if(commit===input)return true;
        const paths=command('git',['diff-tree','--no-commit-id','--name-only','-r',commit],cwd).trim().split('\n');
        if(paths.length!==1||!/^\.github\/orchestration\/requests\/(vnext-agent|vnext-plan-review)\/[0-9a-f]{64}\.json$/.test(paths[0]))throw Error('AGENT_PRIOR_REQUEST_UNKNOWN');
        const prior=Chain.readGitObject(cwd,commit,paths[0]);
        if(prior.schema_version===SCHEMA){validate(prior);if(prior.operation_hash===request.operation_hash)return true;}
        else{require('./chatgpt-plan-review').validate(prior);if(request.operation==='plan-review'&&prior.produced_chain_hash===request.operation_hash)return true;}
      }
      if(rows.length<100)return false;
    }throw Error('AGENT_PRIOR_RUN_SCAN_INCOMPLETE');
}

function main(args=process.argv.slice(2)){
  const [stage,input,output]=args,cwd=process.cwd();
  if(stage==='create'){
    const request=create(B.read(input),cwd),file=path.join(output,request.contract_hash+'.json');
    if(fs.existsSync(file)){if(V.canonicalHash(B.read(file))!==V.canonicalHash(request))throw Error('AGENT_EXISTING_REQUEST_CHANGED');}
    else B.write(file,request,{exclusive:true});return {request_hash:request.contract_hash,request_path:file};
  }
  if(stage==='verify')return verify(B.read(input),output,{cwd});
  if(stage!=='execute')throw Error('Usage: agent-relay.js <create config directory|execute request_commit request_path|verify request artifact_directory>');
  V.assertSha40(input,'AGENT_REQUEST_COMMIT');
  if(!/^\.github\/orchestration\/requests\/vnext-agent\/[0-9a-f]{64}\.json$/.test(output))throw Error('AGENT_REQUEST_PATH');
  const request=Chain.readGitObject(cwd,input,output);validate(request);
  if(path.posix.basename(output,'.json')!==request.contract_hash)throw Error('AGENT_REQUEST_PATH_HASH');
  Chain.command('git',['merge-base','--is-ancestor',request.source_head,input],cwd);
  if(Chain.command('git',['rev-parse','HEAD'],cwd).trim()!==input||Chain.command('git',['status','--porcelain'],cwd).trim())throw Error('AGENT_CHECKOUT_MISMATCH');
  if(process.env.GITHUB_REPOSITORY!==request.repository)throw Error('AGENT_REPOSITORY_MISMATCH');
  const issueState=n=>JSON.parse(Chain.command('gh',['api','repos/'+request.repository+'/issues/'+n],cwd)).state;
  const priorAttempt=()=>priorInvocation(request,input,cwd);
  // Semantic delivery validators require the exact delivery HEAD, not the later request commit.
  let executionHead=request.source_head;
  if(request.operation==='implementation-review'){const data=inputs(request,cwd);executionHead=Chain.readGitObject(cwd,request.source_head,Chain.relative(data.observations_file)).deliveryHead;V.assertSha40(executionHead,'AGENT_IMPLEMENTATION_HEAD_BINDING');Chain.command('git',['merge-base','--is-ancestor',executionHead,request.source_head],cwd);}
  Chain.command('git',['checkout','--detach',executionHead],cwd);
  return execute(request,{cwd,evidenceRoot:process.env.KODJO_REVIEW_CACHE,outputDirectory:process.env.KODJO_REVIEW_OUTPUT,issueState,priorAttempt});
}
if(require.main===module)try{const r=main();process.stdout.write(JSON.stringify({status:r.status||'RECORDED',request_hash:r.request_hash,request_path:r.request_path,verdict:r.verdict??null})+'\n');}
catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
module.exports={OPERATIONS,validate,inputs,create,adapterFor,execute,verify,priorInvocation,main};
