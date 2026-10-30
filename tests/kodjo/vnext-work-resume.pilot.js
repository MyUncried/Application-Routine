'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../../scripts/kodjo/lib/vnext-contract'),C=require('../../scripts/kodjo/lib/vnext-work-consumption');
const E=require('../../scripts/kodjo/lib/vnext-work-execution'),R=require('../../scripts/kodjo/lib/vnext-work-resume');
const Inspect=require('../../scripts/kodjo/inspect-vnext-work'),Recover=require('../../scripts/kodjo/recover-vnext-work');
const F=require('./helpers/vnext-figma-fixture'),Registration=require('./helpers/vnext-operation-admission-fixture');
function fixture(slice='VNEXT-RESUME-A') {
  const c=V.sealContract({schema_version:'kodjo.vnext.work-transport.v1',repository:'MyUncried/Application-Routine',transport_pr:42,transport_branch:'orchestration/vnext-work-signals',automation_id:'AUTO',conversation_id:'CHAT',authorized_actors:['MyUncried'],recovery_since:'2026-10-14T00:00:00Z',allowed_workflows:[{path:'.github/workflows/kodjo-vnext-chatgpt-plan-review.yml',artifact_prefix:'review-'},{path:'.github/workflows/queue.yml',artifact_prefix:'queue-',operation_kind:'IMPLEMENTATION'}]});
  const op=E.descriptor({kind:'IMPLEMENTATION',repository:c.repository,source_head:'a'.repeat(40),request_path:'.github/orchestration/queue/v2/request.json',request_hash:'b'.repeat(64),slice_id:slice,issue_number:999,bootstrap_hash:'c'.repeat(64),subject_ref:'https://github.com/'+c.repository+'/issues/999'});
  const run={id:9,run_attempt:1,status:'completed',conclusion:'failure',event:'push',path:c.allowed_workflows[1].path,head_sha:'a'.repeat(40),head_branch:'main',repository:{full_name:c.repository,id:1},head_repository:{full_name:c.repository,id:1},actor:{login:'MyUncried'}};
  const signal=E.makeSignal(c,op,run,[{id:10,run_id:9,status:'completed',conclusion:'failure',name:'execute',started_at:null,completed_at:null}],[]);
  const claim=C.claim(c,signal,{owner_id:'OWNER',nonce:'e'.repeat(64),signal_commit_sha:'a'.repeat(40),conversation_id:c.conversation_id,receipt_kind:'AUTOMATION_EVENT'});
  const cp=C.checkpoint(c,signal,claim,{continuation_state:'BLOCKED_WITH_EVIDENCE',next_action:'Read the existing failed result; do not invoke a model.',evidence_refs:['github:verified-test-only']});
  const receipt=C.processed(claim,cp,'git:'+'d'.repeat(40)+':'+C.ROOT+'checkpoints/'+signal.signal_key+'.json');
  const state={main_head:'1'.repeat(40),transport_head:'2'.repeat(40),signals:[signal],claims:{[signal.signal_key]:claim},checkpoints:{[signal.signal_key]:cp},receipts:{[signal.signal_key]:receipt}};
  return {c,run,signal,claim,cp,receipt,state};
}
function apiFixture(f) {
  const files=new Map([['.github/orchestration/KODJO_VNEXT_WORK_TRANSPORT.json',f.c],['.github/orchestration/requests/vnext-work/signals/'+f.signal.signal_key+'.json',f.signal],[C.ROOT+'claims/'+f.signal.signal_key+'.json',f.claim],[C.ROOT+'checkpoints/'+f.signal.signal_key+'.json',f.cp],[C.ROOT+'receipts/'+f.signal.signal_key+'.json',f.receipt]]);
  let head=f.state.transport_head;const writes=[];
  function api(url,method='GET',data) {
    const base='repos/'+f.c.repository;
    if(method!=='GET'){writes.push({url,method,data});throw Error('UNEXPECTED_WRITE');}
    if(url===base+'/git/refs/heads/main')return {object:{sha:f.state.main_head}};
    if(url===base+'/git/refs/heads/'+f.c.transport_branch)return {object:{sha:head}};
    if(url===base+'/git/commits/'+f.state.transport_head)return {tree:{sha:'3'.repeat(40)}};
    if(url.includes('/git/trees/'))return {truncated:false,tree:[...files.keys()].map(path=>({type:'blob',path}))};
    if(url.includes('/compare/'))return {status:'ahead'};
    if(url.includes('/contents/')){const path=url.split('/contents/')[1].split('?')[0];return files.has(path)?{content:Buffer.from(JSON.stringify(files.get(path))).toString('base64')}:null;}
    throw Error('UNEXPECTED_READ '+url);
  }
  return {api,files,writes,move:()=>{head='4'.repeat(40);}};
}
for(const id of ['VNEXT-RESUME-A','VNEXT-RESUME-B'])test('fresh context reconstructs exact durable failure without claiming work: '+id,()=>{
  const f=fixture(id),a=apiFixture(f);
  const s=Inspect.inspect(f.c,{api:a.api,runs:[],includeRegistered:false});
  V.verifyContractHash(s);assert.equal(s.rows[0].state,'PROCESSED');assert.equal(s.rows[0].continuation_state,'BLOCKED_WITH_EVIDENCE');
  assert.match(s.rows[0].next_action,/do not invoke/);assert.equal(s.mission_completed,false);assert.equal(s.grants_authority,false);
  assert.equal(s.rows[0].notification.result,'RESULT_ARCHIVE_MISSING');assert.equal(s.rows[0].notification.pilot_delivery_verified,false);
  assert.equal(JSON.stringify(s).includes(f.claim.nonce),false);assert.equal(a.writes.length,0);
});
test('reconstruction rejects a changed checkpoint, unpublished receipt and truncated or moving sources',()=>{
  const f=fixture(),a=apiFixture(f),options={api:a.api,runs:[],includeRegistered:false};
  const {contract_hash,...body}=f.cp;
  a.files.set(C.ROOT+'checkpoints/'+f.signal.signal_key+'.json',V.sealContract({...body,next_action:'forged'}));
  assert.throws(()=>Inspect.inspect(f.c,options));
  a.files.set(C.ROOT+'checkpoints/'+f.signal.signal_key+'.json',f.cp);
  assert.throws(()=>Inspect.inspect(f.c,{...options,api:(url,...args)=>url.includes('/compare/')?{status:'diverged'}:a.api(url,...args)}),/ANCESTRY/);
  assert.throws(()=>Inspect.inspect(f.c,{...options,api:(url,...args)=>url.includes('/git/trees/')?{truncated:true}:a.api(url,...args)}),/TREE_INCOMPLETE/);
  let reads=0;assert.throws(()=>Inspect.inspect(f.c,{...options,api:(url,...args)=>{if(url.endsWith('/git/refs/heads/main')&&++reads===2)return {object:{sha:'9'.repeat(40)}};return a.api(url,...args);}}),/HEAD_MOVED/);
});
test('owner decision is preserved and a result notice never invents approval or delivery to another chat',()=>{
  const f=fixture(),cp=C.checkpoint(f.c,f.signal,f.claim,{continuation_state:'WAITING_USER_DECISION',next_action:'Present the exact existing gate.',evidence_refs:['github:real-gate-required']});
  const n=R.notification(f.signal,cp);assert.equal(n.title,'Décision utilisateur attendue');assert.equal(n.grants_authority,false);assert.equal(n.delivery_scope,'CURRENT_EXECUTION');
});
test('read-only connector mode shares the existing replay adapter without gh or duplicate requests',()=>{
  const f=fixture(),a=apiFixture(f),transcript=[];
  const git=args=>args[0]==='ls-tree'?'':JSON.stringify({activations:[]});
  let result;
  for(let i=0;i<30;i++){
    const next=Inspect.step(f.c,transcript,{git});
    if(next.status==='COMPLETE'){result=next.result;break;}
    const q=next.request;assert.equal(q.method,'GET');
    const response=q.endpoint.includes('/actions/runs?')?{workflow_runs:[]}:a.api(q.endpoint,q.method,q.data,q.allowMissing);
    transcript.push({context_hash:next.context_hash,request:q,response});
  }
  assert.equal(result.rows[0].continuation_state,'BLOCKED_WITH_EVIDENCE');assert.equal(a.writes.length,0);
  assert.equal(Inspect.step(f.c,transcript,{git}).status,'COMPLETE');
  const altered=structuredClone(transcript);altered[0].context_hash='f'.repeat(64);
  assert.throws(()=>Inspect.step(f.c,altered,{git}),/TRANSCRIPT_CHANGED/);
});
test('handover proposal preserves histories, refuses live owners and requires observed automation destinations',()=>{
  const f=fixture(),s=R.reconstruct(f.c,f.state),observed={previous_automation:{id:'AUTO',conversation_id:'CHAT',is_enabled:false},next_automation:{id:'NEXT',conversation_id:'NEXT_CHAT',is_enabled:true}};
  const next=R.prepareHandover(f.c,s,observed);assert.equal(next.conversation_id,'NEXT_CHAT');C.validateSignal(next,f.signal);
  assert.equal(R.prepareHandover(f.c,s,observed).contract_hash,next.contract_hash);assert.equal(f.signal.conversation_id,'CHAT');
  const pending=R.reconstruct(f.c,{...f.state,receipts:{},checkpoints:{}});assert.throws(()=>R.prepareHandover(f.c,pending,observed),/OWNED_WORK/);
  assert.throws(()=>R.prepareHandover(f.c,s,{...observed,previous_automation:{...observed.previous_automation,is_enabled:true}}),/OBSERVATION_REQUIRED/);
  assert.throws(()=>C.claim(next,f.signal,{owner_id:'OLD',nonce:'e'.repeat(64),signal_commit_sha:'a'.repeat(40),conversation_id:'CHAT',receipt_kind:'MANUAL_RECOVERY'}),/RECEIVER/);
});
for(const id of ['VNEXT-RESUME-A','VNEXT-RESUME-B'])test('registered request with no observed start is found from Git without a per-slice flag: '+id,t=>{
  const repo=F.fixture();t.after(()=>repo.cleanup());Registration.register(repo,id,999);
  const f=fixture(id),source=repo.git('rev-parse','HEAD');
  const request=V.sealContract({schema_version:'kodjo.vnext.agent-request.v1',pilot:'CHATGPT_WORK',slice_id:id,repository:f.c.repository,issue_number:999,source_head:source,operation:'plan-review',inputs_file:'inputs.json',inputs_hash:'1'.repeat(64),operation_hash:'2'.repeat(64),review_scope:V.sealContract({schema_version:'TEST_ONLY_SCOPE',produced_chain_hash:'f'.repeat(64)})});
  const file='.github/orchestration/requests/vnext-agent/'+request.contract_hash+'.json';repo.write(file,JSON.stringify(request));repo.git('add','.');repo.git('commit','-m','TEST ONLY immutable expected request');
  const head=repo.git('rev-parse','HEAD'),git=args=>repo.git(...args);
  const before=Inspect.registered(f.c,head,[],[],git);assert.equal(before.length,1);assert.equal(before[0].state,'NO_MATCHING_RUN_OBSERVED');assert.equal(before[0].grants_retry,false);
  const observed=Inspect.registered(f.c,head,[{...f.run,path:f.c.allowed_workflows[0].path,head_sha:head,status:'queued',conclusion:null}],[],git);assert.equal(observed[0].state,'REGISTERED_RUN_OBSERVED');assert.equal(observed[0].runs[0].status,'queued');
  assert.equal(Inspect.registered(f.c,head,[],[{request_hash:request.contract_hash}],git).length,0);
  const resume=V.sealContract({schema_version:'kodjo.vnext.agent-resume.v2',request_commit:head,request_path:file,request_hash:request.contract_hash,source_head:source,operation_hash:request.operation_hash,prior_run_id:9,interrupted_session:{session_id:'12345678-1234-4234-8234-123456789abc',session_sha256:'e'.repeat(64),authorized_actor:'MyUncried',authorization:'OWNER_REQUESTED_SAME_SESSION_CONTINUATION'}});
  const resumePath='.github/orchestration/requests/vnext-agent/resume/'+resume.contract_hash+'.json';repo.write(resumePath,JSON.stringify(resume));repo.git('add','.');repo.git('commit','-m','TEST ONLY observed session resume request');
  const resumed=Inspect.registered(f.c,repo.git('rev-parse','HEAD'),[],[{request_hash:request.contract_hash}],git);assert.equal(resumed.length,1);assert.equal(resumed[0].request_path,resumePath);assert.equal(resumed[0].grants_retry,false);
  const {contract_hash,...control}=resume,wrong=V.sealContract({...control,interrupted_session:{...resume.interrupted_session,authorization:'NOT_AUTHORIZED'}});
  repo.write('.github/orchestration/requests/vnext-agent/resume/'+wrong.contract_hash+'.json',JSON.stringify(wrong));repo.git('add','.');repo.git('commit','-m','TEST ONLY invalid observed authorization');
  assert.throws(()=>Inspect.registered(f.c,repo.git('rev-parse','HEAD'),[],[],git),/SESSION_AUTH_BINDING/);
});
test('scheduled recovery observes a missed start once and does not loop on its own transport commits',async()=>{
  const f=fixture(),files=new Map();let head='1'.repeat(40),counter=4;const blobs=new Map(),trees=new Map();let writes=0;
  const api=(url,method='GET',data)=>{
    const base='repos/'+f.c.repository;
    if(url.includes('/actions/workflows/'))return {workflow_runs:[]};
    if(url===base+'/git/refs/heads/'+f.c.transport_branch){if(method==='PATCH'){head=data.sha;writes++;}return {object:{sha:head}};}
    if(url===base+'/pulls/'+f.c.transport_pr)return {state:'open',head:{sha:head,ref:f.c.transport_branch,repo:{full_name:f.c.repository}}};
    if(url.startsWith(base+'/git/commits/'))return {tree:{sha:'2'.repeat(40)}};
    if(url.includes('/git/trees/')&&url.endsWith('?recursive=1'))return {truncated:false,tree:[...files.keys()].map(path=>({path,type:'blob'}))};
    if(url.includes('/contents/')){const p=url.split('/contents/')[1].split('?')[0];return files.has(p)?{content:Buffer.from(JSON.stringify(files.get(p))).toString('base64')}:null;}
    const sha=String(counter++).padStart(40,'0');
    if(url===base+'/git/blobs'){blobs.set(sha,JSON.parse(data.content));return {sha};}
    if(url===base+'/git/trees'){trees.set(sha,data.tree);return {sha};}
    if(url===base+'/git/commits'){for(const entry of trees.get(data.tree))files.set(entry.path,blobs.get(entry.sha));return {sha};}
    throw Error('UNEXPECTED '+url);
  };
  const snapshot=V.sealContract({rows:[],operations:[{state:'NO_MATCHING_RUN_OBSERVED',request_hash:'a'.repeat(64),grants_retry:false}]});
  const options={api,inspectWork:()=>snapshot,recoveryRunId:99};
  const first=await Recover.recover(f.c,options);assert.equal(first.waiting,1);assert.equal(writes,1);
  const second=await Recover.recover(f.c,{...options,recoveryRunId:100});assert.equal(second.status,'RECOVERY_OBSERVATION_UNCHANGED');assert.equal(writes,1);
  const refused=await Recover.recover(f.c,{...options,recoveryRunId:101,inspectWork:()=>{throw Error('READ_ACCESS_FAILED: private diagnostic');}});
  assert.equal(refused.status,'RECOVERY_WAKEUP_PUBLISHED');assert.equal(refused.blocked,1);assert.equal(writes,2);
  const diagnostic=[...files.values()].find(v=>v.blocked_runs?.some(r=>r.stage==='READ_ONLY_RECONSTRUCTION'));
  assert.equal(diagnostic.resume_snapshot,null);assert.equal(diagnostic.blocked_runs[0].error,'READ_ACCESS_FAILED');
});
