#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const V=require('./lib/vnext-contract'),B=require('./lib/vnext-file-bundle'),Chain=require('./lib/vnext-live-chain');
const Relay=require('./lib/vnext-agent-relay');
const OPERATIONS=Object.freeze(['plan-review','review-scope','implementation-review']);
const SCHEMA='kodjo.vnext.agent-request.v1';
function validate(request){
  V.assertExactKeys(request,['schema_version','pilot','slice_id','repository','issue_number','source_head','operation','inputs_file','inputs_hash','operation_hash','contract_hash'],['review_scope'],'AGENT_REQUEST_KEYS');
  V.verifyContractHash(request,'AGENT_REQUEST_HASH');V.assertSha40(request.source_head,'AGENT_REQUEST_HEAD');V.assertSha64(request.inputs_hash,'AGENT_REQUEST_INPUTS_HASH');V.assertSha64(request.operation_hash,'AGENT_REQUEST_OPERATION_HASH');
  Chain.relative(request.inputs_file);V.assertSliceId(request.slice_id);
  if(request.review_scope){V.verifyContractHash(request.review_scope);if(request.operation!=='plan-review')throw Error('AGENT_REVIEW_SCOPE_OPERATION');}
  if(request.schema_version!==SCHEMA||request.pilot!=='CHATGPT_WORK'
    ||request.repository!=='MyUncried/Application-Routine'||!Number.isSafeInteger(request.issue_number)||request.issue_number<=0
    ||!OPERATIONS.includes(request.operation))throw Error('AGENT_REQUEST_SCOPE_REFUSED');
  return request;
}
function inputs(request,cwd){
  validate(request);const data=Chain.readGitObject(cwd,request.source_head,request.inputs_file);
  if(V.canonicalHash(data)!==request.inputs_hash)throw Error('AGENT_REQUEST_INPUTS_CHANGED');return data;
}
function create(config,cwd,options={}){
  const data=Chain.readGitObject(cwd,config.source_head,config.inputs_file);
  let request=V.sealContract({schema_version:SCHEMA,pilot:'CHATGPT_WORK',slice_id:config.slice_id,repository:config.repository,
    issue_number:config.issue_number,source_head:config.source_head,operation:config.operation,inputs_file:config.inputs_file,inputs_hash:V.canonicalHash(data),operation_hash:'0'.repeat(64)});
  validate(request);const adapter=adapterFor(request,cwd,options);adapter.preflight();const {contract_hash,...fields}=request;request=V.sealContract({...fields,...(adapter.reviewScope?{review_scope:adapter.reviewScope}:{}),operation_hash:adapter.storageKey});return request;
}
function adapterFor(request,cwd,{invoke,reviewCapacity=require('./lib/vnext-cumulative-review').MAX_DIRECT_TARGETS}={}){
  const data=inputs(request,cwd),read=file=>Chain.readGitObject(cwd,request.source_head,Chain.relative(file));
  let operation;
  if(request.operation==='plan-review'){
    V.assertExactKeys(data,['produced_file','causal_file'],[],'AGENT_PLAN_INPUTS');
    const legacy=require('./chatgpt-plan-review');
    const derived=legacy.create({source_head:request.source_head,...data},cwd);
    if(derived.slice_id!==request.slice_id||derived.issue_number!==request.issue_number||derived.repository!==request.repository)throw Error('AGENT_PLAN_BINDING');
    const loaded=legacy.load(derived,cwd);
    const Cumulative=require('./lib/vnext-cumulative-review'),ledgerPath=Cumulative.pathFor(loaded.produced);
    const exists=require('node:child_process').spawnSync('git',['cat-file','-e',request.source_head+':'+ledgerPath],{cwd,windowsHide:true,stdio:'ignore'}).status===0;
    const ledger=exists?Chain.readGitObject(cwd,request.source_head,ledgerPath):null;
    if(ledger)Cumulative.verifyLedger(loaded.produced,ledger);
    if(request.review_scope){Cumulative.validateScope(loaded.produced,request.review_scope);reviewCapacity=request.review_scope.target_limit;}
    const historicalFull=request.operation_hash===loaded.produced.contract_hash;
    const chunked=!historicalFull&&(ledger||Object.values(loaded.produced.artifacts.reviewContext.target_catalog).reduce((n,ids)=>n+ids.length,0)>reviewCapacity);
    if(chunked)require('./lib/vnext-component-coverage').assertReviewReady(loaded.produced.artifacts.uiAtomicityContract);
    const scope=chunked?Cumulative.scopeFor(loaded.produced,ledger,{maxTargets:reviewCapacity}):null;
    if(request.review_scope&&scope?.contract_hash!==request.review_scope.contract_hash)throw Error('AGENT_REVIEW_SCOPE_BINDING');
    const completeFromLedger=chunked&&!scope;
    const storageKey=chunked?V.canonicalHash({produced:loaded.produced.contract_hash,scope:scope?.contract_hash||null,ledger:completeFromLedger?ledger.contract_hash:null}):loaded.produced.contract_hash;
    const verify=r=>{
      if(scope){Cumulative.verifyRecord(loaded.produced,r);if(r.scope?.contract_hash!==scope.contract_hash)throw Error('AGENT_REVIEW_SCOPE_BINDING');}
      else Chain.verifyReceipt(loaded.produced,r);
      return r;
    };
    operation={storageKey,reviewScope:scope,preflight:()=>{legacy.load(derived,cwd);if(completeFromLedger)Cumulative.aggregate(loaded.produced,ledger);},
      hasResponse:d=>completeFromLedger||fs.existsSync(path.join(d,loaded.produced.artifacts.planningEnvelope.planning_mode.toLowerCase()+'-review-response.json')),
      invoke:d=>Chain.review(loaded.produced,{cwd,evidenceDirectory:d,causalEvidence:loaded.causalEvidence,reviewScope:scope,...(invoke?{invoke}:{})}),
      recover:d=>completeFromLedger?Cumulative.aggregate(loaded.produced,ledger):Chain.recoverReview(loaded.produced,{cwd,evidenceDirectory:d,reviewScope:scope}),
      verify,verdict:r=>r.review_report?.verdict||null};
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
// A published preparation branch is a valid source. Remote refs come from the
// trusted checkout, not from a local working file or an uncommitted plan.
function publishedSource(request,cwd,command=Chain.command){
  if(command('git',['cat-file','-t',request.source_head],cwd).trim()!=='commit')throw Error('AGENT_SOURCE_COMMIT_REQUIRED');
  const refs=command('git',['for-each-ref','--contains',request.source_head,'--format=%(refname)','refs/remotes/origin/'],cwd).trim().split('\n');
  if(!refs.some(ref=>/^refs\/remotes\/origin\/(?!HEAD$).+/.test(ref)))throw Error('AGENT_SOURCE_NOT_PUBLISHED');
}
function resolveTrigger(commit,file,cwd,command=Chain.command){
  V.assertSha40(commit);Chain.relative(file);
  if(/^\.github\/orchestration\/requests\/vnext-(agent|plan-review)\/[0-9a-f]{64}\.json$/.test(file))return {request_commit:commit,request_path:file};
  if(!/^\.github\/orchestration\/requests\/vnext-agent\/resume\/[0-9a-f]{64}\.json$/.test(file))throw Error('AGENT_RESUME_PATH');
  const resume=Chain.readGitObject(cwd,commit,file);V.verifyContractHash(resume);
  V.assertExactKeys(resume,['schema_version','request_commit','request_path','request_hash','source_head','operation_hash','prior_run_id','contract_hash'],[],'AGENT_RESUME_KEYS');
  if(resume.schema_version!=='kodjo.vnext.agent-resume.v1'||path.posix.basename(file,'.json')!==resume.contract_hash
    ||!Number.isSafeInteger(resume.prior_run_id)||resume.prior_run_id<=0)throw Error('AGENT_RESUME_BINDING');
  V.assertSha40(resume.request_commit);
  if(!/^\.github\/orchestration\/requests\/vnext-agent\/[0-9a-f]{64}\.json$/.test(resume.request_path))throw Error('AGENT_RESUME_REQUEST_PATH');
  command('git',['merge-base','--is-ancestor',resume.request_commit,commit],cwd);
  const request=validate(Chain.readGitObject(cwd,resume.request_commit,resume.request_path));
  if(request.contract_hash!==resume.request_hash||request.source_head!==resume.source_head||request.operation_hash!==resume.operation_hash
    ||path.posix.basename(resume.request_path,'.json')!==request.contract_hash)throw Error('AGENT_RESUME_REQUEST_CHANGED');
  const run=JSON.parse(command('gh',['api','repos/'+request.repository+'/actions/runs/'+resume.prior_run_id],cwd));
  if(run.id!==resume.prior_run_id||run.status!=='completed'
    ||run.path!=='.github/workflows/kodjo-vnext-chatgpt-plan-review.yml'||run.actor?.login!=='MyUncried')throw Error('AGENT_RESUME_RUN_MISMATCH');
  if(run.head_sha!==resume.request_commit){
    V.assertSha40(run.head_sha);
    if(run.head_sha===commit)throw Error('AGENT_RESUME_RUN_MISMATCH');
    command('git',['merge-base','--is-ancestor',run.head_sha,commit],cwd);
    const paths=command('git',['diff','--name-only',run.head_sha+'^',run.head_sha],cwd).trim().split('\n');
    if(paths.length!==1)throw Error('AGENT_RESUME_RUN_MISMATCH');
    const previous=resolveTrigger(run.head_sha,paths[0],cwd,command);
    if(previous.request_commit!==resume.request_commit||previous.request_path!==resume.request_path)throw Error('AGENT_RESUME_RUN_MISMATCH');
  }
  return {request_commit:resume.request_commit,request_path:resume.request_path,prior_run_id:resume.prior_run_id};
}
// Historical compatibility, not a retry exemption supplied by a caller. This
// exact trusted entry and workflow failed at their first Git ancestry guard,
// before execute, cache/intent creation or any reviewer could be invoked.
function failedAncestryBeforeInvocation(run,request,commit,cwd,command){
  if(run.status!=='completed'||run.conclusion!=='failure'||run.run_attempt!==1||run.event!=='push'
    ||run.head_sha!==commit||run.actor?.login!=='MyUncried'||run.path!=='.github/workflows/kodjo-vnext-chatgpt-plan-review.yml')return false;
  if(command('git',['rev-parse',commit+':scripts/kodjo/agent-relay.js'],cwd).trim()!=='3ca49ad3fd0f792328fbf7c60854061b4376f33c'
    ||command('git',['rev-parse',commit+':.github/workflows/kodjo-vnext-chatgpt-plan-review.yml'],cwd).trim()!=='d8ee7a2c38a2182b3e7de6296748cd987c8db8a5')return false;
  // rev-list has a successful exit even when the source is not an ancestor.
  if(!command('git',['rev-list',request.source_head,'--not',commit],cwd).trim())return false;
  const jobs=JSON.parse(command('gh',['api','repos/'+request.repository+'/actions/runs/'+run.id+'/attempts/1/jobs?per_page=100'],cwd));
  if(jobs.total_count!==1||jobs.jobs?.length!==1)return false;
  const job=jobs.jobs[0],steps=job.steps||[];
  if(job.name!=='review'||job.status!=='completed'||job.conclusion!=='failure')return false;
  for(const name of ['Validate runner and request locator before checkout','Checkout trusted protocol','Select exactly one newly committed request','Checkout immutable request and source objects']){
    if(steps.find(s=>s.name===name)?.conclusion!=='success')return false;
  }
  if(steps.find(s=>s.name==='Review or recover with the trusted protocol')?.conclusion!=='failure')return false;
  // Raw logs contain ANSI escapes. They are evidence bytes, never terminal UI.
  const log=command('gh',['api','repos/'+request.repository+'/actions/jobs/'+job.id+'/logs','--allow-escape-sequences'],cwd);
  const verified=/^\S+ VNEXT_LIVE_PROCESS_FAILED: git: \s*\r?$/m.test(log)
    &&log.includes('REQUEST_COMMIT: '+commit)&&log.includes('REQUEST_PATH: .github/orchestration/requests/vnext-agent/'+request.contract_hash+'.json');
  if(verified&&process.env.KODJO_REVIEW_OUTPUT){
    fs.mkdirSync(process.env.KODJO_REVIEW_OUTPUT,{recursive:true});
    B.write(path.join(process.env.KODJO_REVIEW_OUTPUT,'pre-invocation-recovery-'+run.id+'.json'),V.sealContract({
      schema_version:'kodjo.vnext.pre-invocation-recovery.v1',request_hash:request.contract_hash,operation_hash:request.operation_hash,
      request_commit:commit,run_id:run.id,run_attempt:1,job_id:job.id,reason:'VERIFIED_LEGACY_ANCESTRY_GUARD',model_invoked:false,
      entry_blob:'3ca49ad3fd0f792328fbf7c60854061b4376f33c',workflow_blob:'d8ee7a2c38a2182b3e7de6296748cd987c8db8a5',
      jobs_sha256:V.sha256(V.canonicalStringify(jobs)),log_sha256:V.sha256(log)}));
  }
  return verified;
}
// Only a completed run of the known, integrated publisher can establish that
// it failed before invocation. Missing/tampered evidence remains ambiguous.
function verifyNonInvocationArchive(request,directory,run,seen=new Set()){
  if(seen.has(String(run.id)))return false;
  seen=new Set(seen);
  seen.add(String(run.id));
  Relay.verifyEvidence(request,directory);
  const failure=B.read(path.join(directory,'failure.json')),checkpoint=B.read(path.join(directory,'checkpoint.json'));
  V.verifyContractHash(failure);
  if(failure.schema_version!=='kodjo.vnext.agent-failure.v1'||failure.status!=='ORCHESTRATION_FAILURE'
    ||failure.request_hash!==request.contract_hash||failure.source_head!==request.source_head||failure.slice_id!==request.slice_id
    ||failure.operation!==request.operation||failure.model_invoked!==false
    ||checkpoint.request_hash!==request.contract_hash||checkpoint.slice_id!==request.slice_id||checkpoint.operation!==request.operation
    ||checkpoint.state!=='ORCHESTRATION_FAILURE'||checkpoint.model_invoked!==false
    ||String(checkpoint.run_id)!==String(run.id)||String(checkpoint.run_attempt)!==String(run.run_attempt)
    ||checkpoint.error!==failure.error)return false;
  const paths=B.read(path.join(directory,'evidence-manifest.json')).files.map(x=>x.path);
  if(!paths.includes('checkpoint.json')||!paths.includes('failure.json'))return false;
  const nested=new Set();
  for(const file of paths){
    if(file==='checkpoint.json'||file==='failure.json')continue;
    const archive=/^pre-invocation-([1-9][0-9]*)\//.exec(file);
    if(archive){nested.add(archive[1]);continue;}
    const historical=/^pre-invocation-recovery-([1-9][0-9]*)\.json$/.exec(file);
    if(!historical)return false; // Results, responses, intents and unknown evidence are refused.
    const proof=B.read(path.join(directory,file));V.verifyContractHash(proof);
    if(proof.schema_version!=='kodjo.vnext.pre-invocation-recovery.v1'||proof.model_invoked!==false
      ||String(proof.run_id)!==historical[1]||proof.run_attempt!==1||proof.request_hash!==request.contract_hash
      ||proof.operation_hash!==request.operation_hash||proof.reason!=='VERIFIED_LEGACY_ANCESTRY_GUARD'
      ||proof.entry_blob!=='3ca49ad3fd0f792328fbf7c60854061b4376f33c'
      ||proof.workflow_blob!=='d8ee7a2c38a2182b3e7de6296748cd987c8db8a5')return false;
    V.assertSha40(proof.request_commit);V.assertSha64(proof.jobs_sha256);V.assertSha64(proof.log_sha256);
    if(seen.has(historical[1]))return false;
  }
  for(const id of nested)if(!verifyNonInvocationArchive(request,path.join(directory,'pre-invocation-'+id),{id,run_attempt:1},seen))return false;
  return true;
}
function recordedFailureBeforeInvocation(run,request,cwd,command=Chain.command){
  if(run.status!=='completed'||run.conclusion!=='failure'||run.run_attempt!==1||run.event!=='push'
    ||run.actor?.login!=='MyUncried'||run.path!=='.github/workflows/kodjo-vnext-chatgpt-plan-review.yml')return false;
  V.assertSha40(run.head_sha);
  const trusted={
    'scripts/kodjo/agent-relay.js':'c5ff10f7017fcb0fd8c0aa4cc38524bc17adfeb1',
    'scripts/kodjo/lib/vnext-agent-relay.js':'6b9d48e41f6f3cbb62d41d4cbe5394fa623db35b',
    '.github/workflows/kodjo-vnext-chatgpt-plan-review.yml':'19dfae2defdef73851c0350d53fb17100fbd5a7e',
  };
  // The executing entry is from the trusted main checkout. Accept its own
  // exact blob and both previously integrated readers. The publisher accepts
  // only its old integrated blob or the exact trusted checkout version; the
  // workflow stays pinned. No code from a request branch is trusted here.
  const bytes=fs.readFileSync(__filename),currentEntry=require('node:crypto').createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
  const publisherBytes=fs.readFileSync(require.resolve('./lib/vnext-agent-relay')),currentPublisher=require('node:crypto').createHash('sha1').update(Buffer.from('blob '+publisherBytes.length+'\0')).update(publisherBytes).digest('hex');
  const entries=new Set([trusted['scripts/kodjo/agent-relay.js'],'51860b1feace52b45cf89d5aeef10a0288f8519f',currentEntry]);
  const publishers=new Set([trusted['scripts/kodjo/lib/vnext-agent-relay.js'],currentPublisher]);
  for(const [file,blob] of Object.entries(trusted)){
    const observed=command('git',['rev-parse',run.head_sha+':'+file],cwd).trim();
    if(file==='scripts/kodjo/agent-relay.js'?!entries.has(observed):file==='scripts/kodjo/lib/vnext-agent-relay.js'?!publishers.has(observed):observed!==blob)return false;
  }
  const name='vnext-chatgpt-review-'+run.id+'-'+run.run_attempt;
  const listing=JSON.parse(command('gh',['api','repos/'+request.repository+'/actions/runs/'+run.id+'/artifacts?per_page=100'],cwd));
  if(listing.total_count!==1||listing.artifacts?.length!==1)return false;
  const artifact=listing.artifacts[0];
  if(artifact.name!==name||artifact.expired||artifact.workflow_run?.id!==run.id||artifact.workflow_run?.head_sha!==run.head_sha)return false;
  const directory=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'kodjo-pre-invocation-'));
  try{
    command('gh',['run','download',String(run.id),'--repo',request.repository,'--name',name,'--dir',directory],cwd);
    if(!verifyNonInvocationArchive(request,directory,run))return false;
    if(process.env.KODJO_REVIEW_OUTPUT){
      const output=path.join(process.env.KODJO_REVIEW_OUTPUT,'pre-invocation-'+run.id);
      fs.mkdirSync(output,{recursive:true});fs.cpSync(directory,output,{recursive:true});
    }
    return true;
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
}
function locatorForRun(run,request,cwd,command=Chain.command){
  // Workflow names and display titles are presentation only. Push provenance is
  // the actual Git delta; dispatch provenance comes from the runner's recorded
  // immutable locator. An unavailable or ambiguous locator remains blocking.
  V.assertSha40(run.head_sha,'AGENT_PRIOR_RUN_BINDING_UNKNOWN');
  if(run.event==='workflow_dispatch'){
    const jobs=JSON.parse(command('gh',['api','repos/'+request.repository+'/actions/runs/'+run.id+'/attempts/'+run.run_attempt+'/jobs?per_page=100'],cwd));
    if(jobs.total_count!==1||jobs.jobs?.length!==1||jobs.jobs[0].name!=='review')throw Error('AGENT_PRIOR_RUN_BINDING_UNKNOWN');
    const wholeLog=command('gh',['api','repos/'+request.repository+'/actions/jobs/'+jobs.jobs[0].id+'/logs','--allow-escape-sequences'],cwd);
    const groups=[...wholeLog.matchAll(/##\[group\]Run[\s\S]*?##\[endgroup\]/g)].map(m=>m[0]).filter(group=>group.includes('KODJO_REVIEW_CACHE')&&group.includes('KODJO_REVIEW_OUTPUT'));
    if(groups.length>1)throw Error('AGENT_PRIOR_RUN_BINDING_UNKNOWN');
    // A resume dispatch has an input locator and then a resolved locator. Read
    // the immutable environment of the actual execution step, not both steps.
    const log=groups[0]||wholeLog;
    const commits=[...new Set([...log.matchAll(/(?:^|\n)[^\n]*?REQUEST_COMMIT: ([0-9a-f]{40})\s*(?=\r?$)/gm)].map(m=>m[1]))];
    const paths=[...new Set([...log.matchAll(/(?:^|\n)[^\n]*?REQUEST_PATH: (\.github\/orchestration\/requests\/(?:vnext-plan-review|vnext-agent(?:\/resume)?)\/[0-9a-f]{64}\.json)\s*(?=\r?$)/gm)].map(m=>m[1]))];
    if(commits.length!==1||paths.length!==1)throw Error('AGENT_PRIOR_RUN_BINDING_UNKNOWN');
    command('git',['merge-base','--is-ancestor',commits[0],run.head_sha],cwd);
    return resolveTrigger(commits[0],paths[0],cwd,command);
  }
  if(run.event&&run.event!=='push')throw Error('AGENT_PRIOR_RUN_BINDING_UNKNOWN');
  const paths=command('git',['diff','--name-only',run.head_sha+'^',run.head_sha],cwd).trim().split('\n');
  if(paths.length!==1)throw Error('AGENT_PRIOR_REQUEST_UNKNOWN');
  return resolveTrigger(run.head_sha,paths[0],cwd,command);
}
function priorScopeReconciled(prior,request,cwd){
  if(!prior.review_scope||!request.review_scope?.previous_ledger_hash)return false;
  const Cumulative=require('./lib/vnext-cumulative-review'),data=inputs(request,cwd),produced=Chain.readGitObject(cwd,request.source_head,data.produced_file);
  const ledger=Chain.readGitObject(cwd,request.source_head,Cumulative.pathFor(produced));Cumulative.verifyLedger(produced,ledger);
  if(ledger.contract_hash!==request.review_scope.previous_ledger_hash)throw Error('AGENT_PRIOR_SCOPE_LEDGER_CHANGED');
  const record=ledger.records.find(r=>r.scope?.contract_hash===prior.review_scope.contract_hash);
  return !!record&&request.review_scope.target_ids.every(id=>!record.partial_report.reviewed_target_ids.includes(id));
}
function priorInvocation(request,input,cwd,command=Chain.command){
    if(Number(process.env.GITHUB_RUN_ATTEMPT)>1)return true;
    for(let page=1;page<=100;page++){
      const rows=JSON.parse(command('gh',['api','repos/'+request.repository+'/actions/workflows/kodjo-vnext-chatgpt-plan-review.yml/runs?per_page=100&page='+page],cwd)).workflow_runs;
      if(!Array.isArray(rows))throw Error('AGENT_PRIOR_RUN_SCAN_INVALID');
      for(const run of rows){
        if(String(run.id)===process.env.GITHUB_RUN_ID)continue;
        const locator=locatorForRun(run,request,cwd,command);
        const prior=Chain.readGitObject(cwd,locator.request_commit,locator.request_path);
        if(prior.schema_version===SCHEMA){validate(prior);
          const overlap=prior.review_scope&&request.review_scope&&prior.review_scope.produced_chain_hash===request.review_scope.produced_chain_hash&&prior.review_scope.target_ids.some(id=>request.review_scope.target_ids.includes(id));
          const unreconciledOverlap=overlap&&!priorScopeReconciled(prior,request,cwd);
          if((prior.operation_hash===request.operation_hash||unreconciledOverlap
          ||request.review_scope&&prior.operation==='plan-review'&&prior.operation_hash===request.review_scope.produced_chain_hash)
          &&!failedAncestryBeforeInvocation(run,prior,locator.request_commit,cwd,command)
          &&!recordedFailureBeforeInvocation(run,prior,cwd,command))return true;}
        else{require('./chatgpt-plan-review').validate(prior);if(request.operation==='plan-review'&&(prior.produced_chain_hash===request.operation_hash||prior.produced_chain_hash===request.review_scope?.produced_chain_hash))return true;}
      }
      if(rows.length<100)return false;
    }throw Error('AGENT_PRIOR_RUN_SCAN_INCOMPLETE');
}

function executeRequest(input,output,options={}){
  const cwd=options.cwd||process.cwd(),command=options.command||Chain.command;
  V.assertSha40(input,'AGENT_REQUEST_COMMIT');
  if(!/^\.github\/orchestration\/requests\/vnext-agent\/[0-9a-f]{64}\.json$/.test(output))throw Error('AGENT_REQUEST_PATH');
  const request=Chain.readGitObject(cwd,input,output);validate(request);
  if(path.posix.basename(output,'.json')!==request.contract_hash)throw Error('AGENT_REQUEST_PATH_HASH');
  publishedSource(request,cwd,command);
  if(command('git',['rev-parse','HEAD'],cwd).trim()!==input||command('git',['status','--porcelain'],cwd).trim())throw Error('AGENT_CHECKOUT_MISMATCH');
  if((options.repository||process.env.GITHUB_REPOSITORY)!==request.repository)throw Error('AGENT_REPOSITORY_MISMATCH');
  const issueState=options.issueState|| (n=>JSON.parse(command('gh',['api','repos/'+request.repository+'/issues/'+n],cwd)).state);
  const admission=require('./lib/vnext-operation-admission').admit(request,{cwd});
  const dependencies=admission.dependencies;
  const priorAttempt=options.priorAttempt||(()=>priorInvocation(request,input,cwd,command));
  // Semantic delivery validators require the exact delivery HEAD, not the later request commit.
  let executionHead=request.source_head;
  if(request.operation==='implementation-review'){const data=inputs(request,cwd);executionHead=Chain.readGitObject(cwd,request.source_head,Chain.relative(data.observations_file)).deliveryHead;V.assertSha40(executionHead,'AGENT_IMPLEMENTATION_HEAD_BINDING');command('git',['merge-base','--is-ancestor',executionHead,request.source_head],cwd);}
  command('git',['checkout','--detach',executionHead],cwd);
  return execute(request,{...options,cwd,evidenceRoot:options.evidenceRoot||process.env.KODJO_REVIEW_CACHE,outputDirectory:options.outputDirectory||process.env.KODJO_REVIEW_OUTPUT,issueState,priorAttempt,dependencies});
}

function main(args=process.argv.slice(2)){
  const [stage,input,output]=args,cwd=process.cwd();
  if(stage==='create'){
    const request=create(B.read(input),cwd);require('./lib/vnext-operation-admission').admit(request,{cwd});const file=path.join(output,request.contract_hash+'.json');
    if(fs.existsSync(file)){if(V.canonicalHash(B.read(file))!==V.canonicalHash(request))throw Error('AGENT_EXISTING_REQUEST_CHANGED');}
    else B.write(file,request,{exclusive:true});return {request_hash:request.contract_hash,request_path:file};
  }
  if(stage==='verify')return verify(B.read(input),output,{cwd});
  if(stage==='resolve-trigger')return resolveTrigger(input,output,cwd);
  if(stage!=='execute')throw Error('Usage: agent-relay.js <create config directory|execute request_commit request_path|verify request artifact_directory>');
  return executeRequest(input,output,{cwd});
}
if(require.main===module)try{const r=main();process.stdout.write(JSON.stringify(process.argv[2]==='resolve-trigger'?r:{status:r.status||'RECORDED',request_hash:r.request_hash,request_path:r.request_path,verdict:r.verdict??null})+'\n');}
catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
module.exports={OPERATIONS,validate,inputs,create,adapterFor,execute,verify,publishedSource,resolveTrigger,failedAncestryBeforeInvocation,verifyNonInvocationArchive,recordedFailureBeforeInvocation,locatorForRun,priorScopeReconciled,priorInvocation,executeRequest,main};
