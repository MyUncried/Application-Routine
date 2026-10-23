'use strict';
// Recovery republishes wake-ups, never model calls or expired/stolen claims.
const W=require('./signal-vnext-agent-continuation'),X=require('./signal-vnext-work-execution'),C=require('./lib/vnext-work-consumption'),Consume=require('./consume-vnext-work-signal'),V=require('./lib/vnext-contract');
async function recover(c,{api=W.gh,signalRun=X.signalRun,recoveryRunId=Number(process.env.GITHUB_RUN_ID),inspectWork=require('./inspect-vnext-work').inspect}={}){
 W.binding(c);if(!c.recovery_since||!Number.isSafeInteger(recoveryRunId)||recoveryRunId<1)throw Error('WORK_RECOVERY_CONTEXT_REQUIRED');
 const blocked=[],observedRuns=[];const since=Date.parse(c.recovery_since);
 for(const producer of c.allowed_workflows){
  const runs=X.pages('repos/'+c.repository+'/actions/workflows/'+producer.path.split('/').at(-1)+'/runs?created='+encodeURIComponent('>='+c.recovery_since),'workflow_runs',api);
  observedRuns.push(...runs);
  for(const run of runs.filter(r=>r.status==='completed'&&Date.parse(r.created_at)>=since)){
   try{
    if(producer.operation_kind)await signalRun(c,run);
    else{
     // Re-use the existing strict archived-review publisher in its own serialized job.
     const {execFileSync}=require('node:child_process');execFileSync(process.execPath,['scripts/kodjo/signal-vnext-agent-continuation.js'],{env:{...process.env,GITHUB_EVENT_NAME:'workflow_run',VNEXT_SOURCE_RUN_ID:String(run.id),VNEXT_WORK_SIGNAL_JOB:'publish-signal'},stdio:['ignore','pipe','pipe'],maxBuffer:1024*1024,timeout:120000});
    }
   }catch(e){blocked.push({run_id:run.id,run_attempt:run.run_attempt,run_head:run.head_sha,workflow:run.path,error:String(e.message).slice(0,1000)});}
  }
 }
 const repo='repos/'+c.repository,head=api(repo+'/git/refs/heads/'+c.transport_branch).object.sha,commit=api(repo+'/git/commits/'+head);
 const tree=api(repo+'/git/trees/'+commit.tree.sha+'?recursive=1');if(tree.truncated)throw Error('WORK_RECOVERY_TREE_TRUNCATED');
 const paths=tree.tree.filter(r=>/^\.github\/orchestration\/requests\/vnext-work\/signals\/[a-f0-9]{64}\.json$/.test(r.path));
 const signals=[],claims={},receipts={};for(const p of paths){const s=Consume.read(api,c,p.path,head);C.validateSignal(c,s);signals.push(s);claims[s.signal_key]=Consume.read(api,c,C.ROOT+'claims/'+s.signal_key+'.json',head);receipts[s.signal_key]=Consume.read(api,c,C.ROOT+'receipts/'+s.signal_key+'.json',head);}
 const rows=C.pending(signals,claims,receipts),pending=rows.filter(r=>r.state==='PENDING').map(r=>r.signal_key),stalled=rows.filter(r=>r.state==='CLAIMED_REQUIRES_RECONCILIATION').map(r=>r.signal_key);
 let snapshot=null;
 try{snapshot=inspectWork(c,{api,runs:observedRuns});if(snapshot.transport_head&&snapshot.transport_head!==head)throw Error('WORK_RECOVERY_HEAD_MOVED');}
 catch(error){snapshot=null;blocked.push({stage:'READ_ONLY_RECONSTRUCTION',error:String(error.code||error.message).split(/[\s:]/)[0].slice(0,160)});}
 const waiting=(snapshot?.operations||[]).filter(o=>o.state==='NO_MATCHING_RUN_OBSERVED'||o.status&&o.status!=='completed');
 if(!pending.length&&!stalled.length&&!blocked.length&&!waiting.length)return {status:'NO_PENDING_WORK'};
 // Only changed observations wake Work. A transport commit or a new cron run
 // alone is not progress and must not generate another event indefinitely.
 const observation_hash=V.canonicalHash({binding:c.contract_hash,pending,stalled,blocked,waiting,rows:snapshot?.rows||[]});
 for(const p of tree.tree.filter(r=>/^\.github\/orchestration\/requests\/vnext-work\/consumption\/wakeup-[a-f0-9]{64}\.json$/.test(r.path))){
  const previous=Consume.read(api,c,p.path,head);V.verifyContractHash(previous);
  if(previous.observation_hash===observation_hash)return {status:'RECOVERY_OBSERVATION_UNCHANGED',head,pending:pending.length,claimed:stalled.length,blocked:blocked.length,waiting:waiting.length};
 }
 const marker=V.sealContract({schema_version:'kodjo.vnext.work-recovery-wakeup.v1',repository:c.repository,automation_id:c.automation_id,conversation_id:c.conversation_id,recovery_run_id:recoveryRunId,observed_transport_head:head,pending_signal_keys:pending,claimed_signal_keys:stalled,blocked_runs:blocked,observation_hash,resume_snapshot:snapshot});
 const result=Consume.transaction(c,C.ROOT+'wakeup-'+marker.contract_hash+'.json',marker,api);
 return {status:'RECOVERY_WAKEUP_PUBLISHED',head:result.head,pending:pending.length,claimed:stalled.length,blocked:blocked.length,waiting:waiting.length};
}
if(require.main===module){const fs=require('node:fs');recover(JSON.parse(fs.readFileSync('.github/orchestration/KODJO_VNEXT_WORK_TRANSPORT.json','utf8'))).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports={recover};
