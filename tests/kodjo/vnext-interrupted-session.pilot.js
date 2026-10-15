'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const V=require('../../scripts/kodjo/lib/vnext-contract'),S=require('../../scripts/kodjo/lib/vnext-interrupted-session'),Relay=require('../../scripts/kodjo/lib/vnext-agent-relay');
function seal(v){const {contract_hash,...fields}=v;return V.sealContract(fields);}
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'vnext-session-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const cwd=path.join(root,'checkout'),cache=path.join(root,'cache'),projects=path.join(root,'projects');fs.mkdirSync(cwd);fs.mkdirSync(cache);fs.mkdirSync(projects);
 const scope=V.sealContract({produced_chain_hash:'a'.repeat(64)}),request=V.sealContract({operation:'plan-review',operation_hash:'b'.repeat(64),source_head:'c'.repeat(40),repository:'owner/repo',slice_id:'TEST-SLICE',issue_number:1,review_scope:scope});
 const session='00000000-0000-4000-8000-000000000001',project=path.join(projects,'project');fs.mkdirSync(project);
 const sessionFile=path.join(project,session+'.jsonl'),bytes=JSON.stringify({type:'user',sessionId:session,context:[scope.produced_chain_hash,scope.contract_hash]})+'\n';fs.writeFileSync(sessionFile,bytes);
 const control=seal({schema_version:'kodjo.vnext.agent-resume.v2',request_commit:'d'.repeat(40),request_hash:request.contract_hash,source_head:request.source_head,operation_hash:request.operation_hash,prior_run_id:17,interrupted_session:{session_id:session,session_sha256:V.sha256(bytes),authorized_actor:'MyUncried',authorization:'OWNER_REQUESTED_SAME_SESSION_CONTINUATION'}});
 const intent=JSON.stringify({request_hash:request.contract_hash,operation:request.operation}),diag=JSON.stringify({planning_mode:'INITIAL',produced_chain_hash:scope.produced_chain_hash,review_scope_hash:scope.contract_hash,invocation_completed:false});
 fs.writeFileSync(path.join(cache,'invocation-intent.json'),intent);fs.writeFileSync(path.join(cache,'initial-review-process.json'),diag);fs.writeFileSync(path.join(cache,'initial-review-progress.json'),'{}');
 const command=(bin,args)=>{
  assert.equal(bin,'gh');const endpoint=args[1];
  if(endpoint.endsWith('/annotations?per_page=100'))return JSON.stringify([{annotation_level:'failure',message:'The self-hosted runner lost communication with the server.'}]);
  if(endpoint.endsWith('/jobs?per_page=100'))return JSON.stringify({total_count:1,jobs:[{id:18,status:'completed',conclusion:'failure'}]});
  return JSON.stringify({id:17,status:'completed',conclusion:'failure',head_sha:control.request_commit,path:'.github/workflows/kodjo-vnext-chatgpt-plan-review.yml',actor:{login:'MyUncried'}});
 };
 return {root,cwd,cache,projects,request,control,sessionFile,intent,diag,options:{cwd,projects,actor:'MyUncried',command}};
}
test('reserves one same-session continuation and preserves original intent and diagnostics byte for byte',t=>{
 const f=fixture(t),proof=S.prepare(f.control,f.request,f.cache,f.options);V.verifyContractHash(proof);
 assert.equal(proof.session_id,f.control.interrupted_session.session_id);
 assert.equal(fs.readFileSync(path.join(f.cache,'invocation-intent.json'),'utf8'),f.intent);
 assert.equal(fs.readFileSync(path.join(f.cache,'prior-interruption/initial-review-process.json'),'utf8'),f.diag);
 assert.throws(()=>S.prepare(f.control,f.request,f.cache,f.options),/EEXIST/);
 const altered=seal({...f.control,request_commit:'e'.repeat(40)});
 assert.throws(()=>S.prepare(altered,f.request,f.cache,{...f.options,command:(bin,args)=>f.options.command(bin,args)}));
});
for(const kind of ['actor','changed session','foreign context','terminal result','missing session','duplicate session','response exists','receipt exists','completed process','foreign intent','prior run active','missing interruption proof'])test('refuses '+kind+' before reserving a continuation',t=>{
 const f=fixture(t);let c=f.control,o=f.options;
 if(kind==='actor')o={...o,actor:'other'};
 if(kind==='changed session')fs.appendFileSync(f.sessionFile,' ');
 if(kind==='foreign context'){const b=JSON.stringify({sessionId:c.interrupted_session.session_id,type:'user',context:['foreign']})+'\n';fs.writeFileSync(f.sessionFile,b);c=seal({...c,interrupted_session:{...c.interrupted_session,session_sha256:V.sha256(b)}});}
 if(kind==='terminal result'){fs.appendFileSync(f.sessionFile,JSON.stringify({type:'result'})+'\n');c=seal({...c,interrupted_session:{...c.interrupted_session,session_sha256:V.sha256(fs.readFileSync(f.sessionFile))}});}
 if(kind==='missing session')fs.unlinkSync(f.sessionFile);
 if(kind==='duplicate session'){fs.mkdirSync(path.join(f.projects,'duplicate'));fs.copyFileSync(f.sessionFile,path.join(f.projects,'duplicate',path.basename(f.sessionFile)));}
 if(kind==='response exists')fs.writeFileSync(path.join(f.cache,'initial-review-response.json'),'{}');
 if(kind==='receipt exists')fs.writeFileSync(path.join(f.cache,'receipt.json'),'{}');
 if(kind==='completed process')fs.writeFileSync(path.join(f.cache,'initial-review-process.json'),JSON.stringify({...JSON.parse(f.diag),invocation_completed:true}));
 if(kind==='foreign intent')fs.writeFileSync(path.join(f.cache,'invocation-intent.json'),'{}');
 if(kind==='prior run active')o={...o,command:()=>JSON.stringify({id:17,status:'in_progress'})};
 if(kind==='missing interruption proof')o={...o,command:(bin,args)=>args[1].includes('/annotations')?'[]':f.options.command(bin,args)};
 assert.throws(()=>S.prepare(c,f.request,f.cache,o));assert.equal(fs.existsSync(path.join(f.cache,'session-resume-intent.json')),false);
});
test('authorization must preserve request, source, operation, supported mode and session identity',t=>{
 const f=fixture(t);
 for(const patch of [{source_head:'f'.repeat(40)},{request_hash:'f'.repeat(64)},{operation_hash:'f'.repeat(64)},{schema_version:'kodjo.vnext.agent-resume.v1'},{prior_run_id:0},{interrupted_session:{...f.control.interrupted_session,session_id:'../other'}}])assert.throws(()=>S.validate(seal({...f.control,...patch}),f.request));
 assert.throws(()=>S.validate(f.control,{...f.request,operation:'implementation-review'}));
});
test('uses exactly --resume with the original restrictions and rejects a different result session',t=>{
 const f=fixture(t),args=['-p','--restricted','--tools','Read,Glob,Grep'];let observed;
 const call=S.invoke(f.control,f.request,(_bin,a)=>{observed=a;return JSON.stringify({session_id:f.control.interrupted_session.session_id});});
 call('claude',args,f.cwd,'input',{},1,{});assert.deepEqual(observed,['--resume',f.control.interrupted_session.session_id,...args]);
 assert.throws(()=>call('claude',['--fork-session'],f.cwd,'',{},1,{}),/ARGUMENT_CONFLICT/);
 assert.throws(()=>S.invoke(f.control,f.request,()=>JSON.stringify({session_id:'foreign'}))('claude',args,f.cwd,'',{},1,{}),/RESULT_CHANGED/);
});
test('ordinary ambiguous invocation remains blocked; active Claude blocks authorized continuation too',t=>{
 for(const active of [false,true]){
  const f=fixture(t),dir=path.join(f.cache,f.request.operation_hash);fs.mkdirSync(dir);fs.copyFileSync(path.join(f.cache,'invocation-intent.json'),path.join(dir,'invocation-intent.json'));
  let calls=0;const adapter={name:'plan-review',storageKey:f.request.operation_hash,preflight:()=>{},hasResponse:()=>false,invoke:()=>{calls++;}};
  assert.throws(()=>Relay.execute(f.request,{cwd:f.cwd,evidenceRoot:f.cache,outputDirectory:path.join(f.root,'out'),issueState:()=> 'open',adapter,...(active?{resumeAuthorization:f.control}:{}),lock:{claudeProcessState:()=>({state:active?'ACTIVE':'NONE'})}}),active?/CLAUDE_EXECUTION_UNAVAILABLE/:/PRIOR_INVOCATION_UNKNOWN_NO_RETRY/);
  assert.equal(calls,0);
 }
});
test('saved response recovery takes precedence over an authorized continuation',t=>{
 const f=fixture(t);let calls=0,recovered=0;const receipt=V.sealContract({value:'fixture'});
 Relay.execute(f.request,{cwd:f.cwd,evidenceRoot:f.cache,outputDirectory:path.join(f.root,'out'),issueState:()=> 'open',resumeAuthorization:f.control,
  adapter:{name:'plan-review',storageKey:f.request.operation_hash,preflight:()=>{},hasResponse:()=>true,recover:()=>{recovered++;return receipt;},invoke:()=>{calls++;},verify:r=>r,result:r=>r}});
 assert.equal(calls,0);assert.equal(recovered,1);
});
test('authorized relay continuation reserves before invoking, preserves evidence and never invokes twice after success',t=>{
 const f=fixture(t),dir=path.join(f.cache,f.request.operation_hash);fs.mkdirSync(dir);
 for(const name of ['invocation-intent.json','initial-review-process.json','initial-review-progress.json'])fs.copyFileSync(path.join(f.cache,name),path.join(dir,name));
 const original=S.prepare;t.mock.method(S,'prepare',(c,r,d,o)=>original(c,r,d,{...o,...f.options}));
 let calls=0,locks=0,releases=0;const receipt=V.sealContract({value:'fixture'});
 const options={cwd:f.cwd,evidenceRoot:f.cache,outputDirectory:path.join(f.root,'out'),issueState:()=> 'open',resumeAuthorization:f.control,
  lock:{claudeProcessState:()=>({state:'NONE'}),acquire:()=>{locks++;return {};},release:()=>{releases++;}},
  adapter:{name:'plan-review',storageKey:f.request.operation_hash,preflight:()=>{},hasResponse:()=>false,invoke:d=>{assert.ok(fs.existsSync(path.join(d,'session-resume-intent.json')));calls++;return receipt;},verify:r=>r,result:r=>r}};
 Relay.execute(f.request,options);Relay.execute(f.request,options);
 assert.equal(calls,1);assert.equal(locks,1);assert.equal(releases,1);
 assert.equal(fs.readFileSync(path.join(dir,'invocation-intent.json'),'utf8'),f.intent);
 assert.equal(JSON.parse(fs.readFileSync(path.join(options.outputDirectory,'checkpoint.json'))).model_invoked,false);
 Relay.verifyEvidence(f.request,options.outputDirectory);
});
test('v2 Git control resolves to the original request and carries the authorization locator to the workflow',t=>{
 const f=fixture(t),Agent=require('../../scripts/kodjo/agent-relay'),Chain=require('../../scripts/kodjo/lib/vnext-live-chain'),cp=require('node:child_process');
 const git=(...a)=>cp.execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@local.invalid',...a],{cwd:f.cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init','-q');const request=V.sealContract({schema_version:'kodjo.vnext.agent-request.v1',pilot:'CHATGPT_WORK',slice_id:'TEST-SLICE',repository:'MyUncried/Application-Routine',issue_number:999,source_head:f.request.source_head,operation:'plan-review',inputs_file:'inputs.json',inputs_hash:'e'.repeat(64),operation_hash:f.request.operation_hash,review_scope:f.request.review_scope});
 const file='.github/orchestration/requests/vnext-agent/'+request.contract_hash+'.json';fs.mkdirSync(path.dirname(path.join(f.cwd,file)),{recursive:true});fs.writeFileSync(path.join(f.cwd,file),JSON.stringify(request));git('add','.');git('commit','-qm','original request');const commit=git('rev-parse','HEAD');
 const control=seal({...f.control,request_hash:request.contract_hash,request_commit:commit,request_path:file}),resumeFile='.github/orchestration/requests/vnext-agent/resume/'+control.contract_hash+'.json';fs.mkdirSync(path.dirname(path.join(f.cwd,resumeFile)),{recursive:true});fs.writeFileSync(path.join(f.cwd,resumeFile),JSON.stringify(control));git('add','.');git('commit','-qm','explicit continuation');const head=git('rev-parse','HEAD');
 const command=(bin,args,cwd)=>bin==='gh'?JSON.stringify({id:17,status:'completed',head_sha:commit,path:'.github/workflows/kodjo-vnext-chatgpt-plan-review.yml',actor:{login:'MyUncried'}}):Chain.command(bin,args,cwd);
 assert.deepEqual(Agent.resolveTrigger(head,resumeFile,f.cwd,command),{request_commit:commit,request_path:file,prior_run_id:17,session_resume_commit:head,session_resume_path:resumeFile});
 const workflow=fs.readFileSync(path.resolve(__dirname,'../../.github/workflows/kodjo-vnext-chatgpt-plan-review.yml'),'utf8');
 assert.match(workflow,/checks: read/);assert.match(workflow,/VNEXT_SESSION_RESUME_COMMIT: ''/);assert.match(workflow,/VNEXT_SESSION_RESUME_COMMIT=\$\(\$resolved.session_resume_commit\)/);assert.match(workflow,/VNEXT_SESSION_RESUME_PATH=\$\(\$resolved.session_resume_path\)/);
});
test('a foreign session result is retained as failed process evidence, never as a recoverable successful response',t=>{
 const f=fixture(t);let saved;
 const execute=(_b,_a,_c,_i,_e,_t,o)=>{const r={status:0,error_code:null,stdout:JSON.stringify({session_id:'foreign'})};o.onResult(r);return r.stdout;};
 const call=S.invoke(f.control,f.request,execute);
 assert.throws(()=>call('claude',[],f.cwd,'',{},1,{onResult:r=>{saved=structuredClone(r);}}),/RESULT_CHANGED/);
 assert.equal(saved.status,0);assert.equal(saved.error_code,'AGENT_SESSION_RESULT_CHANGED');assert.equal(JSON.parse(saved.stdout).session_id,'foreign');
 for(const args of [['--session-id','other'],['--resume=other'],['--fork-session']])assert.throws(()=>call('claude',args,f.cwd,'',{},1,{}),/ARGUMENT_CONFLICT/);
});
