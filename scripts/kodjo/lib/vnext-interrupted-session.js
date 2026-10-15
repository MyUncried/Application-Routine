'use strict';
// Explicit owner-authorized continuation of ONE retained session. Never a fresh
// invocation, cache reset, automatic retry, or waiver of semantic validators.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const V=require('./vnext-contract');
function validate(control,request){
 V.verifyContractHash(control);
 const s=control.interrupted_session;
 V.assertExactKeys(s,['session_id','session_sha256','authorized_actor','authorization'],[],'AGENT_SESSION_AUTH_KEYS');
 if(control.schema_version!=='kodjo.vnext.agent-resume.v2'||request.operation!=='plan-review'||!request.review_scope
  ||control.request_hash!==request.contract_hash||control.operation_hash!==request.operation_hash||control.source_head!==request.source_head
  ||s.authorization!=='OWNER_REQUESTED_SAME_SESSION_CONTINUATION'||s.authorized_actor!=='MyUncried'
  ||!Number.isSafeInteger(control.prior_run_id)||control.prior_run_id<1
  ||!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(s.session_id))throw Error('AGENT_SESSION_AUTH_BINDING');
 V.assertSha64(s.session_sha256);return s;
}
function prepare(control,request,directory,{cwd,command,actor=process.env.GITHUB_ACTOR,projects=path.join(os.homedir(),'.claude','projects')}={}){
 const s=validate(control,request);
 if(actor!==s.authorized_actor)throw Error('AGENT_SESSION_AUTH_ACTOR');
 const intent=JSON.parse(fs.readFileSync(path.join(directory,'invocation-intent.json'),'utf8'));
 if(intent.request_hash!==request.contract_hash||intent.operation!==request.operation)throw Error('AGENT_SESSION_ORIGINAL_INTENT');
 const prefix='initial-review-',diag=JSON.parse(fs.readFileSync(path.join(directory,prefix+'process.json'),'utf8'));
 if(diag.planning_mode!=='INITIAL'||diag.produced_chain_hash!==request.review_scope.produced_chain_hash||diag.review_scope_hash!==request.review_scope.contract_hash||diag.invocation_completed!==false)throw Error('AGENT_SESSION_ORIGINAL_CONTEXT');
 if(fs.existsSync(path.join(directory,prefix+'response.json'))||fs.existsSync(path.join(directory,'receipt.json')))throw Error('AGENT_SESSION_EXISTING_RESULT_USE_RECOVERY');
 const run=JSON.parse(command('gh',['api','repos/'+request.repository+'/actions/runs/'+control.prior_run_id],cwd));
 if(run.id!==control.prior_run_id||run.status!=='completed'||run.conclusion!=='failure'||run.head_sha!==control.request_commit
  ||run.path!=='.github/workflows/kodjo-vnext-chatgpt-plan-review.yml'||run.actor?.login!==s.authorized_actor)throw Error('AGENT_SESSION_PRIOR_RUN');
 const jobs=JSON.parse(command('gh',['api','repos/'+request.repository+'/actions/runs/'+run.id+'/jobs?per_page=100'],cwd));
 if(jobs.total_count!==1||jobs.jobs?.length!==1||jobs.jobs[0].status!=='completed'||jobs.jobs[0].conclusion!=='failure')throw Error('AGENT_SESSION_PRIOR_JOB');
 const annotations=JSON.parse(command('gh',['api','repos/'+request.repository+'/check-runs/'+jobs.jobs[0].id+'/annotations?per_page=100'],cwd));
 if(!Array.isArray(annotations)||!annotations.some(a=>a.annotation_level==='failure'&&a.message?.includes('The self-hosted runner lost communication with the server.')))throw Error('AGENT_SESSION_INTERRUPTION_UNVERIFIED');
 const matches=[];
 for(const d of fs.readdirSync(projects,{withFileTypes:true})){
  if(!d.isDirectory()||d.isSymbolicLink())continue;
  const file=path.join(projects,d.name,s.session_id+'.jsonl');
  if(!fs.existsSync(file))continue;
  if(fs.lstatSync(file).isSymbolicLink())throw Error('AGENT_SESSION_SYMLINK');
  const bytes=fs.readFileSync(file);
  if(V.sha256(bytes)!==s.session_sha256)throw Error('AGENT_SESSION_CHANGED');
  let bound=false,sessionBound=false;
  for(const line of bytes.toString('utf8').split('\n').filter(x=>x.trim())){
   const e=JSON.parse(line);
   if(e.sessionId===s.session_id)sessionBound=true;
   if(line.includes(diag.produced_chain_hash)&&line.includes(diag.review_scope_hash))bound=true;
   if(e.type==='result')throw Error('AGENT_SESSION_TERMINAL_RESULT_USE_RECOVERY');
  }
  if(!bound||!sessionBound)throw Error('AGENT_SESSION_CONTEXT');matches.push(file);
 }
 if(matches.length!==1)throw Error('AGENT_SESSION_NOT_UNIQUE');
 const proof=V.sealContract({schema_version:'kodjo.vnext.interrupted-session-continuation.v1',authorization_hash:control.contract_hash,
  request_hash:request.contract_hash,operation_hash:request.operation_hash,source_head:request.source_head,prior_run_id:run.id,
  session_id:s.session_id,session_sha256:s.session_sha256,original_process_sha256:V.sha256(fs.readFileSync(path.join(directory,prefix+'process.json')))});
 // A single continuation reservation for this operation, even if another
 // authorization is later published. Never overwrite an ambiguous reservation.
 fs.writeFileSync(path.join(directory,'session-resume-intent.json'),V.canonicalStringify(proof)+'\n',{flag:'wx'});
 const history=path.join(directory,'prior-interruption');fs.mkdirSync(history);
 for(const file of ['invocation-intent.json',prefix+'process.json',prefix+'progress.json']){
  const source=path.join(directory,file);if(fs.existsSync(source))fs.copyFileSync(source,path.join(history,file),fs.constants.COPYFILE_EXCL);
 }
 return proof;
}
function invoke(control,request,execute=require('./vnext-review-process').command){
 const s=validate(control,request);
 return (bin,args,cwd,input,env,timeout,options)=>{
  if(args.some(a=>/^--(?:resume|continue|fork-session|session-id)(?:=|$)/.test(a)))throw Error('AGENT_SESSION_ARGUMENT_CONFLICT');
  const guarded={...options,onResult:result=>{
   let terminal;try{terminal=JSON.parse(result.stdout);}catch{}
   const changed=terminal&&terminal.session_id!==s.session_id;
   if(changed)result.error_code||='AGENT_SESSION_RESULT_CHANGED';
   if(options?.onResult)options.onResult(result);
   if(changed)throw Error('AGENT_SESSION_RESULT_CHANGED');
  }};
  const raw=execute(bin,['--resume',s.session_id,...args],cwd,input,env,timeout,guarded);
  if(JSON.parse(raw).session_id!==s.session_id)throw Error('AGENT_SESSION_RESULT_CHANGED');
  return raw;
 };
}
module.exports={validate,prepare,invoke};
