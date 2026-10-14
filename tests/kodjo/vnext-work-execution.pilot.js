'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../../scripts/kodjo/lib/vnext-contract'),E=require('../../scripts/kodjo/lib/vnext-work-execution'),C=require('../../scripts/kodjo/lib/vnext-work-consumption'),Consume=require('../../scripts/kodjo/consume-vnext-work-signal');
function fixture(kind='IMPLEMENTATION',slice='VNEXT-OTHER'){
 const c=V.sealContract({schema_version:'kodjo.vnext.work-transport.v1',repository:'owner/repo',transport_pr:42,transport_branch:'orchestration/vnext-work-signals',automation_id:'AUTO',conversation_id:'CHAT',authorized_actors:['owner'],allowed_workflows:[{path:'.github/workflows/example.yml',artifact_prefix:'example-',operation_kind:kind}]});
 const op=E.descriptor({kind,repository:c.repository,source_head:'a'.repeat(40),request_path:kind==='CI'?null:'.github/orchestration/'+(kind==='IMPLEMENTATION'?'queue/v2':'vnext-closure')+'/request.json',request_hash:kind==='CI'?null:'b'.repeat(64),slice_id:kind==='CI'?null:slice,issue_number:8,bootstrap_hash:kind==='CI'?null:'c'.repeat(64),subject_ref:'https://github.com/owner/repo/'+(kind==='CI'?'pull':'issues')+'/8'});
 const run={id:9,run_attempt:2,status:'completed',conclusion:'failure',event:'push',path:c.allowed_workflows[0].path,head_sha:'a'.repeat(40),head_branch:'main',repository:{full_name:c.repository,id:1},head_repository:{full_name:c.repository,id:1},actor:{login:'owner'}};
 const jobs=[{id:10,run_id:9,status:'completed',conclusion:'failure',name:'execute',started_at:'2026-10-14T10:00:00Z',completed_at:'2026-10-14T10:01:00Z'}];
 const files=[{path:'result.json',sha256:'f'.repeat(64),bytes:100}],archives=[{artifact_id:11,artifact_name:'example-9-2',artifact_sha256:'e'.repeat(64),run_id:9,run_attempt:2,run_head:run.head_sha,files,manifest_hash:V.canonicalHash(files)}];
 const signal=E.makeSignal(c,op,run,jobs,archives);return {c,op,run,jobs,archives,signal};
}
test('all asynchronous families preserve real failure, exact attempts and two slice identities',()=>{
 for(const kind of ['CI','IMPLEMENTATION','DELIVERY_TESTS_AND_CLOSURE'])for(const slice of ['VNEXT-A','VNEXT-B']){const f=fixture(kind,slice);assert.equal(f.signal.semantic_verdict,null);assert.equal(f.signal.model_invoked,null);assert.equal(f.signal.transport_status,'EXECUTION_NOT_SUCCEEDED');assert.equal(f.signal.execution.run_attempt,2);assert.equal(f.op.slice_id,kind==='CI'?null:slice);E.validateSignal(f.signal,f.c);}
});
test('missing result archive signals a recoverable diagnostic, never non-invocation or approval',()=>{
 const f=fixture();const s=E.makeSignal(f.c,f.op,{...f.run,conclusion:'success'},f.jobs,[]);assert.equal(s.transport_status,'RESULT_ARCHIVE_MISSING');assert.equal(s.model_invoked,null);assert.equal(s.semantic_verdict,null);
});
test('foreign run, incomplete jobs, wrong attempt and corrupted archive manifest are refused',()=>{
 const f=fixture();for(const r of [{...f.run,status:'in_progress'},{...f.run,head_repository:{full_name:'attacker/repo',id:2}}])assert.throws(()=>E.makeSignal(f.c,f.op,r,f.jobs,f.archives));
 assert.throws(()=>E.makeSignal(f.c,f.op,f.run,[{...f.jobs[0],run_id:999}],f.archives));assert.throws(()=>E.makeSignal(f.c,f.op,f.run,f.jobs,[{...f.archives[0],run_attempt:1}]));assert.throws(()=>E.makeSignal(f.c,f.op,f.run,f.jobs,[{...f.archives[0],manifest_hash:'d'.repeat(64)}]));
});
test('CI cannot impersonate an approved product slice or carry a path outside transport requests',()=>{
 const f=fixture('CI'),{schema_version,contract_hash,...d}=f.op;assert.throws(()=>E.descriptor({...d,slice_id:'VNEXT-A'}));const g=fixture(),{schema_version:x,contract_hash:y,...q}=g.op;assert.throws(()=>E.descriptor({...q,request_path:'../business.json'}));
});
function apiFixture(c){let head='1'.repeat(40),counter=1;const files=new Map(),blobs=new Map(),trees=new Map(),commits=new Map([[head,{tree:{sha:'2'.repeat(40)}}]]),calls=[];let moved=false;
 function api(url,method='GET',data){calls.push({url,method,data});const base='repos/'+c.repository;
  if(url===base+'/pulls/'+c.transport_pr)return {state:'open',head:{repo:{full_name:c.repository},ref:c.transport_branch,sha:head}};
  if(url===base+'/git/refs/heads/'+c.transport_branch){if(method==='PATCH'){assert.equal(data.force,false);if(moved)throw Error('not fast forward');head=data.sha;}return {object:{sha:head}};}
  if(url.startsWith(base+'/contents/')){const p=url.split('/contents/')[1].split('?')[0];return files.has(p)?{content:Buffer.from(V.canonicalStringify(files.get(p))).toString('base64')}:null;}
  if(url.startsWith(base+'/git/commits/'))return commits.get(url.split('/').at(-1));
  if(url===base+'/git/blobs'){const sha=String(++counter).padStart(40,'0');blobs.set(sha,JSON.parse(data.content));return {sha};}
  if(url===base+'/git/trees'){const sha=String(++counter).padStart(40,'0');trees.set(sha,data.tree);return {sha};}
  if(url===base+'/git/commits'){const sha=String(++counter).padStart(40,'0');commits.set(sha,{...data,tree:{sha:data.tree}});for(const p of trees.get(data.tree))files.set(p.path,blobs.get(p.sha));return {sha};}
  throw Error('Unexpected '+url);
 }return {api,files,calls,head:()=>head,move:()=>{moved=true;}};
}
test('atomic durable claim prevents a second consumer; processed requires a published checkpoint',()=>{
 const f=fixture(),a=apiFixture(f.c),input={owner_id:'WORK_OWNER',nonce:'a'.repeat(64),signal_commit_sha:a.head(),conversation_id:'CHAT',receipt_kind:'MANUAL_RECOVERY'};a.files.set('.github/orchestration/requests/vnext-work/signals/'+f.signal.signal_key+'.json',f.signal);
 const acquired=Consume.acquire(f.c,f.signal,input,a.api);assert.equal(acquired.status,'CLAIMED');assert.equal(Consume.acquire(f.c,f.signal,input,a.api).status,'OWNED_BY_THIS_CONSUMER');
 assert.throws(()=>Consume.acquire(f.c,f.signal,{...input,owner_id:'OTHER',nonce:'b'.repeat(64)},a.api),/OWNED_ELSEWHERE/);
 const outcome={continuation_state:'WAITING_USER_DECISION',next_action:'Present the exact reviewed plan',evidence_refs:['github:verified-result']};const done=Consume.finish(f.c,f.signal,acquired.claim,outcome,a.api);assert.equal(done.status,'PROCESSED');assert.equal(Consume.acquire(f.c,f.signal,input,a.api).status,'ALREADY_PROCESSED');
 const receipt=a.files.get(C.ROOT+'receipts/'+f.signal.signal_key+'.json');assert.match(receipt.checkpoint_ref,/^git:/);assert.equal(receipt.claim_hash,acquired.claim.contract_hash);
});
test('claims have no expiry-based theft and manual recovery cannot be represented as an event receipt',()=>{
 const f=fixture(),input={owner_id:'A',nonce:'a'.repeat(64),signal_commit_sha:'d'.repeat(40),conversation_id:'CHAT',receipt_kind:'MANUAL_RECOVERY'};const claim=C.claim(f.c,f.signal,input);assert.equal(claim.receipt_kind,'MANUAL_RECOVERY');assert.throws(()=>C.owns(claim,C.claim(f.c,f.signal,{...input,nonce:'b'.repeat(64)})),/OWNED_ELSEWHERE/);assert.throws(()=>C.claim(f.c,f.signal,{...input,conversation_id:'OLD_CHAT'}));assert.throws(()=>C.processed(claim,{contract_hash:'a'.repeat(64)},'local:unpublished'));
 const pending=C.pending([f.signal],{[f.signal.signal_key]:claim},{});assert.equal(pending[0].state,'CLAIMED_REQUIRES_RECONCILIATION');
});
test('transport writer refuses business paths before any API and a non-forced race is not a success',()=>{
 const f=fixture(),a=apiFixture(f.c),value=V.sealContract({signal_key:f.signal.signal_key});assert.throws(()=>Consume.transaction(f.c,'src/business.json',value,a.api),/WRITE_SCOPE/);assert.equal(a.calls.length,0);a.move();assert.throws(()=>Consume.transaction(f.c,C.ROOT+'checkpoints/'+f.signal.signal_key+'.json',value,a.api),/not fast forward/);
});
test('an explicitly migrated historical destination is readable without rewriting the original signal',()=>{
 const f=fixture(),c={...f.c,automation_id:'NEW',conversation_id:'NEW_CHAT',accepted_prior_destinations:[{automation_id:f.c.automation_id,conversation_id:f.c.conversation_id}]};C.validateSignal(c,f.signal);assert.throws(()=>C.validateSignal({...c,accepted_prior_destinations:[]},f.signal));const claim=C.claim(c,f.signal,{owner_id:'NEW',nonce:'a'.repeat(64),signal_commit_sha:'a'.repeat(40),conversation_id:'NEW_CHAT',receipt_kind:'MANUAL_RECOVERY'});assert.equal(claim.signal_hash,f.signal.contract_hash);
});
test('recovery scans every page and emits a wake-up for pending work without stealing a claim',async()=>{
 const Recover=require('../../scripts/kodjo/recover-vnext-work'),X=require('../../scripts/kodjo/signal-vnext-work-execution'),f=fixture(),a=apiFixture(f.c);const {contract_hash,...binding}=f.c;const c=V.sealContract({...binding,recovery_since:'2026-10-14T00:00:00Z'});
 const key=f.signal.signal_key,signalPath='.github/orchestration/requests/vnext-work/signals/'+key+'.json';a.files.set(signalPath,f.signal);
 let invocations=0;const api=(url,...args)=>{
  if(url.includes('/actions/workflows/'))return {workflow_runs:[]};
  if(url.includes('/git/trees/')&&url.endsWith('?recursive=1'))return {truncated:false,tree:[{path:signalPath}]};
  return a.api(url,...args);
 };const result=await Recover.recover(c,{api,recoveryRunId:123,signalRun:async()=>{invocations++;}});assert.equal(result.pending,1);assert.equal(invocations,0);assert.equal(result.status,'RECOVERY_WAKEUP_PUBLISHED');
 const marker=[...a.files.values()].find(v=>v.schema_version==='kodjo.vnext.work-recovery-wakeup.v1');assert.deepEqual(marker.pending_signal_keys,[key]);assert.deepEqual(marker.claimed_signal_keys,[]);
 let pages=0;const list=X.pages('endpoint','rows',(url)=>{pages++;return {rows:pages===1?Array.from({length:100},(_,i)=>i):[100]};});assert.equal(list.length,101);assert.equal(pages,2);
 const claim=C.claim(c,f.signal,{owner_id:'OWNER',nonce:'a'.repeat(64),signal_commit_sha:'a'.repeat(40),conversation_id:'CHAT',receipt_kind:'MANUAL_RECOVERY'});a.files.set(C.ROOT+'claims/'+key+'.json',claim);
 const stalled=await Recover.recover(c,{api,recoveryRunId:124});assert.equal(stalled.claimed,1);assert.equal(stalled.pending,0);assert.equal(a.files.get(C.ROOT+'claims/'+key+'.json').contract_hash,claim.contract_hash);
});
