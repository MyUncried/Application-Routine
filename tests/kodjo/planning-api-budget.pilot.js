'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {POLICY,measure,execute,classify,diagnostics,duration,main}=require('../../scripts/kodjo/openai-plan-request');
const {select}=require('../../scripts/kodjo/build-planning-context');
const request={model:'gpt-5.6-luna',input:'Plan français : préserver Créer, Côté et les exigences.',max_output_tokens:20000};
const url='https://api.github.com/repos/o/r/issues/1';
const head='a'.repeat(40);
const comment=(id,body,author='github-actions[bot]')=>({id,body,user:{login:author},issue_url:url});
const bind='\nslice_id=S\napplication_head='+head+'\napplication_pr=2\n';
const plan=comment(10,'[KODJO_V2] PLAN_OUTPUT'+bind+'PLAN');
const review=comment(11,'[KODJO_V2] PLAN_REVIEW_OUTPUT'+bind+'source_plan_comment_id=10\nREVIEW');
const command='[KODJO_V2] START_PLAN_REVISION'+bind+'base_plan_comment_id=10\nbase_review_comment_id=11\n';
const args={command,commandId:20,issueUrl:url,slice:'S',sourceHead:head,applicationHead:head,applicationPr:2,mode:'revision'};
const base=[plan,review,comment(20,command,'MyUncried')];
test('canonical selection excludes unlimited history and keeps exact plan/review',()=>{
 const selected=select({...args,commandId:2000,comments:[plan,review,comment(2000,command,'MyUncried'),...Array.from({length:1000},(_,i)=>comment(100+i,'UNRELATED'.repeat(100)))]});
 assert.deepEqual(selected.map(c=>c.id),['10','11']);
 assert.deepEqual(selected,select({...args,comments:base}));
});
for(const [name,edit,error] of [
 ['wrong author',a=>a[0].user.login='attacker',/AUTHORITY/],
 ['wrong issue',a=>a[1].issue_url='wrong',/AUTHORITY/],
 ['mismatched review',a=>a[1].body=a[1].body.replace('source_plan_comment_id=10','source_plan_comment_id=9'),/REVIEW/],
 ['stale pinned review',a=>a.push(comment(12,review.body)),/REVIEW/],
 ['changed command',a=>a[2].body+='changed',/COMMAND/],
 ['oversize retained plan',a=>a[0].body+='X'.repeat(120001),/PROMPT_TOO_LARGE/],
 ['duplicate id',a=>a.push(a[0]),/DUPLICATE/],
]) test('packet rejects '+name,()=>{const a=structuredClone(base);edit(a);assert.throws(()=>select({...args,comments:a}),error);});
test('targeted success is included without global approval',()=>{
 const proof={head,application_pr:2,global_approval:false,merge_authorized:false,close_authorized:false,final_status:'REQUALIFICATION_REQUIRED',human_device_approval_comment_id:8};
 const c=comment(9,'[KODJO_V2] TARGETED_VALIDATION_OUTPUT\nslice_id=S\n<KODJO_TARGETED_VALIDATION_JSON>'+JSON.stringify(proof)+'</KODJO_TARGETED_VALIDATION_JSON>');
 const out=select({...args,comments:[...base,c,comment(8,'targeted PASS only','MyUncried')]});
 assert.deepEqual(out.map(x=>x.role),['BASE_PLAN','INDEPENDENT_REVIEW','TARGETED_VALIDATION_ONLY','TARGETED_HUMAN_EVIDENCE']);
 c.body=c.body.replace('"global_approval":false','"global_approval":true');
 assert.throws(()=>select({...args,comments:[...base,c]}),/TARGETED_SCOPE/);
});
test('initial planning keeps command and no revision history',()=>{
 const initialCommand='[KODJO_V2] START_INITIAL_PLAN\nslice_id=S\nsource_head='+head+'\n';
 const initialArgs={command:initialCommand,commandId:20,issueUrl:url,slice:'S',sourceHead:head,mode:'initial'};
 assert.deepEqual(select({...initialArgs,comments:[comment(20,initialCommand,'MyUncried')]}),[]);
});
test('initial planning after REVISE binds the latest reviewed plan instead of rebuilding from history',()=>{
 const initialBind='\nslice_id=S\nsource_head='+head+'\nplanning_mode=INITIAL\n';
 const initialPlan=comment(30,'[KODJO_V2] PLAN_OUTPUT'+initialBind+'STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW\nPLAN');
 const initialReview=comment(31,'[KODJO_V2] PLAN_REVIEW_OUTPUT\nslice_id=S\nsource_head='+head+'\nsource_plan_comment_id=30\nverdict=REVISE\nSTATUT : PLAN_REVISION_REQUIRED\nREVIEW');
 const initialCommand='[KODJO_V2] START_INITIAL_PLAN\nslice_id=S\nsource_head='+head+'\n';
 const out=select({comments:[initialPlan,initialReview,comment(40,initialCommand,'MyUncried')],command:initialCommand,commandId:40,issueUrl:url,slice:'S',sourceHead:head,mode:'initial'});
 assert.deepEqual(out.map(x=>[x.role,x.id]),[['BASE_PLAN','30'],['INDEPENDENT_REVIEW','31']]);
});
test('initial planning refuses to rebuild an already approved latest plan',()=>{
 const initialBind='\nslice_id=S\nsource_head='+head+'\nplanning_mode=INITIAL\n';
 const initialPlan=comment(30,'[KODJO_V2] PLAN_OUTPUT'+initialBind+'STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW\nPLAN');
 const initialReview=comment(31,'[KODJO_V2] PLAN_REVIEW_OUTPUT\nslice_id=S\nsource_head='+head+'\nsource_plan_comment_id=30\nverdict=APPROVE\nSTATUT : PLAN_REVIEW_APPROVED\nREVIEW');
 const initialCommand='[KODJO_V2] START_INITIAL_PLAN\nslice_id=S\nsource_head='+head+'\n';
 assert.throws(()=>select({comments:[initialPlan,initialReview,comment(40,initialCommand,'MyUncried')],command:initialCommand,commandId:40,issueUrl:url,slice:'S',sourceHead:head,mode:'initial'}),/INITIAL_PLAN_ALREADY_APPROVED/);
});
test('budget measures deterministic complete payload including schema and output reserve',()=>{
 const a=measure(request),b=measure({...request,text:{format:{schema:{description:'normative '.repeat(100)}}}});
 assert.equal(a.status,'PASS');assert.deepEqual(measure(request),a);
 assert.ok(b.serialized_tokens>a.serialized_tokens);assert.ok(a.reserved_tokens>a.serialized_tokens+20000);
});
test('oversize byte payload is rejected with zero network calls',async()=>{
 let calls=0,report;
 await assert.rejects(execute({...request,input:'x'.repeat(POLICY.maxBytes+1)},{fetchImpl:()=>{calls++;},save:r=>report=r}),/PROMPT_TOO_LARGE/);
 assert.equal(calls,0);assert.equal(report.budget.reason,'BYTE_BOUND');
});
test('token-dense input below byte bound is blocked',()=>{
 const x=measure({...request,input:' a b c d e f g h i j'.repeat(40000)});
 assert.equal(x.status,'PROMPT_TOO_LARGE');assert.equal(x.reason,'TOKEN_BUDGET');
});
for(const [code,kind] of [
 ['insufficient_quota','QUOTA'],['credit_balance_exhausted','CREDIT_OR_BILLING'],
 ['project_spend_limit_exceeded','SPEND_OR_USAGE_LIMIT'],['organization_usage_limit_exceeded','SPEND_OR_USAGE_LIMIT'],
 ['context_length_exceeded','PROMPT_TOO_LARGE'],['rate_limit_exceeded','TEMPORARY_RATE_LIMIT'],['slow_down','TEMPORARY_RATE_LIMIT'],
 ['unknown','NON_RETRYABLE_OR_UNKNOWN']
]) test('classifies '+code,()=>assert.equal(classify(429,{error:{code}}),kind));
test('daily and per-request ceilings are not replayed as temporary throttles',()=>{
 assert.equal(classify(429,{error:{code:'rate_limit_exceeded',message:'Request too large'}}),'PROMPT_TOO_LARGE');
 assert.equal(classify(429,{error:{code:'rate_limit_exceeded',message:'tokens per day'}}),'DAILY_LIMIT');
});
const response=(status,code,headers={})=>({status,headers:new Headers(headers),text:async()=>JSON.stringify(status===200?{status:'completed'}:{error:{type:'rate_limit_error',code}})});
function harness(responses) {
 let clock=0,calls=0;const waits=[],reports=[];
 return {options:{secret:'sk-test-secret',fetchImpl:async()=>{calls++;return responses[Math.min(calls-1,responses.length-1)];},
 sleep:async ms=>{waits.push(ms);clock+=ms;},now:()=>clock,random:()=>0.5,save:r=>reports.push(structuredClone(r))},
 calls:()=>calls,waits,reports};
}
test('temporary 429 respects Retry-After with jitter then succeeds',async()=>{
 const h=harness([response(429,'rate_limit_exceeded',{'Retry-After':'2'}),response(200)]);
 assert.equal((await execute(request,h.options)).status,'completed');assert.equal(h.calls(),2);assert.equal(h.waits[0],2500);
 assert.equal(h.reports.at(-1).attempts[0].http_status,429);
});
test('503 backoff increases and attempts stop at three',async()=>{
 const h=harness([response(503,'server_is_overloaded')]);
 await assert.rejects(execute(request,h.options),/RETRY_EXHAUSTED/);assert.equal(h.calls(),3);assert.deepEqual(h.waits,[1500,2500]);
});
for(const code of ['insufficient_quota','credit_balance_exhausted','project_spend_limit_exceeded','context_length_exceeded','unknown'])
 test('never retries '+code,async()=>{const h=harness([response(429,code,{'Retry-After':'1'})]);await assert.rejects(execute(request,h.options));assert.equal(h.calls(),1);assert.equal(h.waits.length,0);});
test('long server delay is deferred, never shortened',async()=>{
 const h=harness([response(429,'slow_down',{'Retry-After':'999'})]);await assert.rejects(execute(request,h.options),/RETRY_DEFERRED/);assert.equal(h.calls(),1);
});
test('transport uncertainty and malformed non-2xx do not trigger blind retry',async()=>{
 const h=harness([{status:429,headers:new Headers(),text:async()=>'<html>failure</html>'}]);
 await assert.rejects(execute(request,h.options),/NON_RETRYABLE/);assert.equal(h.calls(),1);
 await assert.rejects(execute(request,{...h.options,fetchImpl:async()=>{throw new Error('sk-test-secret');}}),/TRANSPORT_OUTCOME_UNKNOWN/);
 assert.ok(!JSON.stringify(h.reports).includes('sk-test-secret'));
});
test('diagnostics preserve selected headers and redact secrets; no raw error message',()=>{
 const r=response(429,'x',{'Retry-After':'2','x-ratelimit-remaining-tokens':'42','Authorization':'Bearer sk-secret','x-request-id':'sk-secret'});
 const d=diagnostics(r,{error:{type:'rate_limit_error',code:'sk-secret',message:'sk-secret'}},'sk-secret');
 assert.equal(d.headers['x-ratelimit-remaining-tokens'],'42');assert.ok(!JSON.stringify(d).includes('sk-secret'));assert.ok(!('Authorization' in d.headers));
});
test('duration supports HTTP date and compound reset intervals',()=>{
 assert.equal(duration('1m2.5s',0),62500);assert.equal(duration('Thu, 01 Jan 1970 00:01:00 GMT',0),60000);assert.equal(duration('junk',0),null);
});
test('shared ledger paces sequential accepted calls',async()=>{
 const h=harness([response(200)]),state={reservations:[{time:0,tokens:POLICY.budget}]};
 await execute(request,{...h.options,state});assert.equal(h.waits[0],61000);assert.equal(h.calls(),1);
});
test('GitHub rerun refuses before network and records reason',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-api-'));const previous=process.env.GITHUB_RUN_ATTEMPT;
 try {process.env.GITHUB_RUN_ATTEMPT='2';await assert.rejects(main(['missing','missing',path.join(dir,'e.json'),'missing']),/BLIND_RERUN_REFUSED/);assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'e.json'))).status,'BLIND_RERUN_REFUSED');}
 finally {if(previous===undefined)delete process.env.GITHUB_RUN_ATTEMPT;else process.env.GITHUB_RUN_ATTEMPT=previous;fs.rmSync(dir,{recursive:true,force:true});}
});
test('both workflows use bounded context and observed API transport at every call',()=>{
 for(const name of ['kodjo-v2-slice-plan.yml','kodjo-v2-slice-initial-plan.yml']) {
 const y=fs.readFileSync(path.join(__dirname,'../../.github/workflows',name),'utf8');
 assert.ok(y.includes('build-planning-context.js'));assert.ok(y.includes('group: kodjo-openai-planning'));
 assert.ok(!y.includes('curl --fail-with-body'));assert.equal((y.match(/node scripts\/kodjo\/openai-plan-request.js/g)||[]).length,2);
 assert.ok(y.includes('*api-evidence*.json'));assert.ok(y.includes('context-manifest.json'));
 assert.ok(!y.includes('jq -r \'.[] | "COMMENT_ID="'));assert.ok(!/for file[^\n]*comments.json/.test(y));
 }
});
