'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const R = require('../../scripts/kodjo/lib/initial-restart');
const V = require('../../scripts/kodjo/verify-initial-restart');
const P = require('../../scripts/kodjo/lib/preflight-contract');
const {projectQueueRequest} = require('../../scripts/kodjo/lib/queue-request');
const id = n => `550e8400-e29b-41d4-a716-44665544000${n}`;
function fixture() {
  const sourceQueue = {request_id:id(1),mode:'INITIAL',session_id:null,slice_id:'S',source_head:'a'.repeat(40),baseline_head:'b'.repeat(40),
    authorized_plan:{plan_blob_oid:'c'.repeat(40)},independent_review:{review_blob_oid:'d'.repeat(40)},user_gate:{gate_ref:'issue_comment:1'},
    scope_allow:['src/**'],checks:['jest'],limits:{max_ai_calls:1},prompt_file:'mission.md'};
  const queue = {...sourceQueue,request_id:id(2),initial_restart:{code:R.CODE,source_run_id:'101',source_run_attempt:1,source_request_id:id(1)}};
  const evidence = {sourceQueue,receipt:{schema:'kodjo.queue-consumption.v1',request_id:id(1),mode:'INITIAL',run_id:'101',run_attempt:'1',source_head:sourceQueue.source_head},
    invocation:{state:'EXTERNAL_CALL_SENT',mode:'INITIAL',request_id:id(1),run_id:'github-101-1',source_head:sourceQueue.source_head,session_id:id(3)},
    result:null,session:'ABSENT',recovery:'ABSENT',processes:'NONE',lock:'ABSENT',authorizations:'PASS',heads:'PASS'};
  return {queue,evidence};
}
test('irrecoverable INITIAL: exact causality with a new id admits',()=>{
  const {queue,evidence}=fixture(); assert.equal(R.decide(queue,evidence).status,'PASS');
  assert.deepEqual(projectQueueRequest(queue).initial_restart,queue.initial_restart);
});
for(const [name,mutate] of [
  ['same request id',(q,e)=>q.request_id=id(1)],
  ['same request id in upper case',(q,e)=>q.request_id=id(1).toUpperCase()],
  ['wrong old request',(q,e)=>q.initial_restart.source_request_id=id(4)],
  ['wrong old run',(q,e)=>q.initial_restart.source_run_id='999'],
  ['wrong old attempt',(q,e)=>q.initial_restart.source_run_attempt=2],
  ['missing consumption',(q,e)=>e.receipt=null],
  ['wrong consumption request',(q,e)=>e.receipt.request_id=id(4)],
  ['intended only',(q,e)=>e.invocation.state='EXTERNAL_CALL_INTENDED'],
  ['unbound session',(q,e)=>delete e.invocation.session_id],
  ['available result',(q,e)=>e.result={status:'IMPLEMENTATION_COMPLETED'}],
  ['ambiguous result',(q,e)=>e.result={}],
  ['false string',(q,e)=>e.result={schema_version:'kodjo.protocol.v2.run-context.0.6.17',run_id:'github-101-1',status:'PRE_INVOCATION',claude_invoked:'false',diagnostic:'RUN_INITIALIZED'}],
  ['available session',(q,e)=>e.session='PRESENT'],
  ['ambiguous session',(q,e)=>e.session=null],
  ['available recovery',(q,e)=>e.recovery='PRESENT'],
  ['ambiguous recovery',(q,e)=>e.recovery='UNKNOWN'],
  ['active process',(q,e)=>e.processes='ACTIVE'],
  ['ambiguous process',(q,e)=>e.processes='AMBIGUOUS'],
  ['active lock',(q,e)=>e.lock='PRESENT'],
  ['ambiguous lock',(q,e)=>e.lock=null],
  ['changed HEAD',(q,e)=>q.source_head='f'.repeat(40)],
  ['changed plan',(q,e)=>q.authorized_plan={plan_blob_oid:'f'.repeat(40)}],
  ['changed review',(q,e)=>q.independent_review={review_blob_oid:'f'.repeat(40)}],
  ['changed gate',(q,e)=>q.user_gate={gate_ref:'issue_comment:2'}],
  ['changed scope',(q,e)=>q.scope_allow=['**']],
  ['revoked gate',(q,e)=>e.authorizations='FAIL'],
  ['HEAD moved',(q,e)=>e.heads='FAIL'],
  ['reserved retry source',(q,e)=>q.retry_of_run_id='101'],
  ['reserved retry reason',(q,e)=>q.retry_reason={code:'INFRASTRUCTURE',detail:'retry'}],
  ['RESUME mode',(q,e)=>q.mode='RESUME_DELTA'],
  ['extra authorization boolean',(q,e)=>q.initial_restart.approved=true],
]) test('irrecoverable INITIAL refuses '+name,()=>{const {queue,evidence}=fixture();mutate(queue,evidence);assert.throws(()=>R.decide(queue,evidence),/INITIAL_RESTART/);});
test('read-only session scan refuses a retained session and preserves it',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'initial-session-'));try {
    fs.mkdirSync(path.join(dir,'projects','project'),{recursive:true});
    assert.equal(V.sessionState(dir,id(3)),'ABSENT');
    const file=path.join(dir,'projects','project','history.jsonl');fs.writeFileSync(file,JSON.stringify({sessionId:id(3)}));
    const before=fs.readFileSync(file); assert.equal(V.sessionState(dir,id(3)),'PRESENT');assert.deepEqual(fs.readFileSync(file),before);
    assert.throws(()=>V.sessionState(path.join(dir,'missing'),id(3)),/SESSION_STORE_UNREADABLE/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('process observation refuses zero, unknown, competing worker and Claude extension',()=>{
  assert.equal(V.processState({state:'OK',rows:[]}), 'AMBIGUOUS');
  const rows=[{ProcessId:process.pid,ParentProcessId:42,Name:'node.exe',CommandLine:'supervisor'}, {ProcessId:42,ParentProcessId:0,Name:'Runner.Worker.exe',CommandLine:'worker'}];
  assert.equal(V.processState({state:'OK',rows}),'NONE');
  assert.equal(V.processState({state:'OK',rows:[...rows,{ProcessId:43,Name:'Runner.Worker.exe'}]}),'AMBIGUOUS');
  assert.equal(V.processState({state:'OK',rows:[...rows,{ProcessId:44,Name:'claude.exe'}]}),'ACTIVE');
});
function integrationFixture() {
  const f=fixture(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'initial-gate-'));
  const queueFile=path.join(dir,'queue.json'),preflightFile=path.join(dir,'preflight.json');
  fs.writeFileSync(queueFile,JSON.stringify(f.queue));
  const preflight=P.finalize({request_id:f.queue.request_id,protocol_head:f.queue.source_head,execution_head:f.queue.source_head,
    freshness_guards_required:[],projection_sha256:P.sha256(projectQueueRequest(f.queue)),checks:P.REQUIRED_CHECK_IDS.map(id=>({id,status:'PASS'}))});
  fs.writeFileSync(preflightFile,JSON.stringify(preflight));
  const raw=Buffer.from(JSON.stringify(f.evidence.sourceQueue));
  const blob=crypto.createHash('sha1').update(Buffer.from(`blob ${raw.length}\0`)).update(raw).digest('hex');
  Object.assign(f.evidence.receipt,{repository:'o/r',queue_commit:'e'.repeat(40),queue_blob_oid:blob,queue_path:'.github/orchestration/queue/v2/test.json'});
  const routes={};
  routes['git/ref/tags/kodjo-consumed/'+id(1)]={ref:'refs/tags/kodjo-consumed/'+id(1),object:{type:'tag',sha:'f'.repeat(40)}};
  routes['git/tags/'+'f'.repeat(40)]={message:JSON.stringify(f.evidence.receipt),object:{type:'commit',sha:'e'.repeat(40)}};
  routes['contents/'+f.evidence.receipt.queue_path+'?ref='+'e'.repeat(40)]={type:'file',sha:blob};
  routes['git/blobs/'+blob]={encoding:'base64',sha:blob,content:raw.toString('base64')};
  routes['actions/runs/101']={status:'completed',conclusion:'cancelled',run_attempt:1,head_sha:'e'.repeat(40)};
  routes['actions/runs/101/jobs?filter=all&per_page=100']={total_count:1,jobs:[{status:'completed',conclusion:'cancelled',runner_name:'runner'}]};
  routes['actions/runs/101/artifacts?per_page=100']={total_count:0,artifacts:[]};
  routes['git/ref/heads/main']={object:{sha:'9'.repeat(40)}};
  const options={preflightFile,env:{GITHUB_ACTIONS:'true',KODJO_VERIFY_GITHUB:'1',GITHUB_RUN_ATTEMPT:'1',GITHUB_REPOSITORY:'o/r',KODJO_EVENT_AFTER:'9'.repeat(40),RUNNER_NAME:'runner'},
    api:(method,route)=>{assert.equal(method,'GET');const data=routes[route.replace('repos/o/r/','')];return {status:data?200:404,data};},
    authorize:()=>{},collect:()=>{const {receipt,sourceQueue,...local}=f.evidence;return structuredClone(local);}};
  return {...f,dir,queueFile,options,routes};
}
for(const mode of ['pass','missing receipt','unbound blob','source active','uninspected archive','HEAD drift','local drift','authorization failure']) test('initial restart collector: '+mode,()=>{
  const f=integrationFixture();try {
    if(mode==='missing receipt')delete f.routes['git/ref/tags/kodjo-consumed/'+id(1)];
    if(mode==='unbound blob')f.routes['contents/'+f.evidence.receipt.queue_path+'?ref='+'e'.repeat(40)].sha='0'.repeat(40);
    if(mode==='source active')f.routes['actions/runs/101'].status='in_progress';
    if(mode==='uninspected archive')f.routes['actions/runs/101/artifacts?per_page=100'].total_count=1;
    if(mode==='authorization failure')f.options.authorize=()=>{throw Error('GATE_REVOKED');};
    let n=0;
    if(mode==='HEAD drift'){const api=f.options.api; f.options.api=(m,r)=>r.endsWith('/heads/main')&&++n===2?{status:200,data:{object:{sha:'0'.repeat(40)}}}:api(m,r);}
    if(mode==='local drift'){const collect=f.options.collect;f.options.collect=()=>({...collect(),result:++n===1?null:{status:'DONE'}});}
    if(mode==='pass')assert.equal(V.verify(f.queueFile,f.options).status,'PASS');
    else assert.throws(()=>V.verify(f.queueFile,f.options));
  }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
