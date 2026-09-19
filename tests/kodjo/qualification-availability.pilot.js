'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { classifyResidual } = require('../../scripts/kodjo/lib/qualification-availability');
const { checkAvailability } = require('../../scripts/kodjo/check-qualification-availability');
const now = Date.parse('2026-01-02T12:00:00Z');
const head = 'a'.repeat(40), main = 'b'.repeat(40);
function fixture() {
  return {
    run: {id: 123, status:'queued', conclusion:null, run_attempt:1, head_sha:head,
      path:'.github/workflows/kodjo-v2-lean-queue.yml', updated_at:'2026-01-01T12:00:00Z'},
    attempt:{id:123,run_attempt:1,head_sha:head,status:'completed',conclusion:'failure'},
    allJobs:[{id:456,run_attempt:1,runner_id:26,status:'completed',conclusion:'failure',completed_at:'2026-01-01T11:59:00Z'}],
    latestJobs:{total_count:0,jobs:[]},nextAttemptStatus:404,runnerId:26,
    local:{platform:'win32',currentWorkerExclusive:true,lockAbsent:true,processScan:'NONE',runDirectoryAbsent:true,runStateAbsent:true,observedAt:now}
  };
}
test('Q-ENV-01 concordant terminal attempt + absent rerun + live idle runner admits residual',()=>{
  assert.equal(classifyResidual(fixture(),now).disposition,'RESIDUAL_NON_EXECUTING');
});
const negatives = {
  'real in_progress':p=>p.run.status='in_progress',
  'real queued attempt':p=>p.attempt.status='queued',
  'fresh queued run':p=>p.run.updated_at=new Date(now).toISOString(),
  'zero jobs alone':p=>p.attempt=null,
  'actual next attempt':p=>p.nextAttemptStatus=200,
  'API permission error':p=>p.nextAttemptStatus=403,
  'latest job queued':p=>p.latestJobs={total_count:1,jobs:[{status:'queued'}]},
  'missing latest list':p=>p.latestJobs=null,
  'missing history':p=>p.allJobs=[],
  'active historical job':p=>p.allJobs[0].status='in_progress',
  'missing job conclusion':p=>p.allJobs[0].conclusion=null,
  'another runner':p=>p.allJobs[0].runner_id=27,
  'wrong attempt head':p=>p.attempt.head_sha=main,
  'live Claude':p=>p.local.processScan='ACTIVE',
  'ambiguous processes':p=>p.local.processScan='AMBIGUOUS',
  'present lock':p=>p.local.lockAbsent=false,
  'another worker or unknown parent':p=>p.local.currentWorkerExclusive=false,
  'false string':p=>p.local.lockAbsent='true',
  'missing lock evidence':p=>delete p.local.lockAbsent,
  'persistent run directory':p=>p.local.runDirectoryAbsent=false,
  'persistent run state':p=>p.local.runStateAbsent=false,
  'stale inventory':p=>p.local.observedAt=now-30001,
  'future inventory':p=>p.local.observedAt=now+1,
};
for(const [name,mutate] of Object.entries(negatives)) test(`Q-ENV-01 refuses ${name}`,()=>{
  const p=fixture(); mutate(p); assert.throws(()=>classifyResidual(p,now));
});
function harness(change = ()=>{}) {
  const p=fixture(); let lists=0, mainReads=0;
  const env={GITHUB_REPOSITORY:'owner/repo',GITHUB_RUN_ID:'999',GITHUB_RUN_ATTEMPT:'1',RUNNER_NAME:'runner',EXPECTED_HEAD:head,EXPECTED_MAIN:main};
  const api=async full=>{
    const url=full.replace('/repos/owner/repo','');
    let data;
    if(url==='/git/ref/heads/main') {mainReads++;data={object:{sha:main}};}
    else if(url==='/actions/runs/999') data={head_sha:head,status:'in_progress',path:'.github/workflows/kodjo-v2-disposable-qualification.yml'};
    else if(url.startsWith('/actions/runs/999/jobs')) data={total_count:1,jobs:[{name:'qualify',status:'in_progress',runner_name:'runner',runner_id:26}]};
    else if(url.startsWith('/actions/workflows/')) {lists++;data={total_count:1,workflow_runs:[p.run]};}
    else if(url==='/actions/runs/123') data=p.run;
    else if(url==='/actions/runs/123/attempts/1') data=p.attempt;
    else if(url==='/actions/runs/123/attempts/2') return {status:404,data:{message:'Not Found'}};
    else if(url.includes('/jobs?filter=all')) data={total_count:p.allJobs.length,jobs:p.allJobs};
    else if(url.includes('/jobs?filter=latest')) data=p.latestJobs;
    else throw Error('unexpected '+url);
    data=structuredClone(data);
    const result={status:200,data}; change({url,result,lists,mainReads});return result;
  };
  return {api,env,local:()=>p.local,now:()=>now};
}
test('Q-ENV-01 collector verifies runner, jobs, attempt, local evidence and both main reads',async()=>{
  const result=await checkAvailability(harness()); assert.equal(result.disposition,'ADMITTED');assert.equal(result.residuals.length,1);
});
test('Q-ENV-01 concurrent Lean run appearing between snapshots refuses',async()=>{
  await assert.rejects(checkAvailability(harness(({url,result,lists})=>{
    if(url.startsWith('/actions/workflows/')&&lists===2){result.data.workflow_runs.push({...fixture().run,id:124});result.data.total_count=2;}
  })),/LEAN_CONCURRENT_ACTIVITY/);
});
test('Q-ENV-01 main moving between checks refuses',async()=>{
  await assert.rejects(checkAvailability(harness(({url,result,mainReads})=>{
    if(url==='/git/ref/heads/main'&&mainReads===2)result.data.object.sha=head;
  })),/MAIN_HEAD_MISMATCH/);
});
test('Q-ENV-01 mismatched dispatched HEAD refuses',async()=>{
  await assert.rejects(checkAvailability(harness(({url,result})=>{
    if(url==='/actions/runs/999')result.data.head_sha=main;
  })),/QUALIFICATION_RUN_IDENTITY_MISMATCH/);
});
test('Q-ENV-01 truncated API collection refuses',async()=>{
  await assert.rejects(checkAvailability(harness(({url,result})=>{
    if(url.startsWith('/actions/workflows/'))result.data.total_count=101;
  })),/GITHUB_COLLECTION_INCOMPLETE/);
});
test('Q-ENV-01 API failure cannot become an empty queue',async()=>{
  await assert.rejects(checkAvailability(harness(({url,result})=>{
    if(url.startsWith('/actions/workflows/'))result.status=403;
  })),/GITHUB_EVIDENCE_UNAVAILABLE/);
});
test('Q-ENV-01 never joins Lean concurrency or changes exact HEAD/main guards',()=>{
  const root=path.resolve(__dirname,'../..');
  const wf=fs.readFileSync(path.join(root,'.github/workflows/kodjo-v2-disposable-qualification.yml'),'utf8');
  const lean=fs.readFileSync(path.join(root,'.github/workflows/kodjo-v2-lean-queue.yml'),'utf8');
  assert.match(lean,/concurrency:\s+group: kodjo-v2-lean-windows\s+cancel-in-progress: false/);
  assert.doesNotMatch(wf,/group: kodjo-v2-lean-windows/);
  assert.match(wf,/HEAD_MISMATCH/);assert.match(wf,/MAIN_HEAD_MISMATCH/);
  assert.match(wf,/if \(\$LASTEXITCODE -ne 0\) \{ exit \$LASTEXITCODE \}/);
  const code=fs.readFileSync(path.join(root,'scripts/kodjo/check-qualification-availability.js'),'utf8');
  assert.doesNotMatch(code,/34748621746/);
});
