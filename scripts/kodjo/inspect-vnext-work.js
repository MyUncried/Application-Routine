'use strict';
// Existing Git/API sources only. No model call, dispatch, claim or remote write.
const V=require('./lib/vnext-contract'), C=require('./lib/vnext-work-consumption');
const W=require('./signal-vnext-agent-continuation'), X=require('./signal-vnext-work-execution');
const Consume=require('./consume-vnext-work-signal');
const Resume=require('./lib/vnext-work-resume');
const CONFIG='.github/orchestration/KODJO_VNEXT_WORK_TRANSPORT.json';

function registered(c,mainHead,runs,signals,git=W.git) {
  const paths=git(['ls-tree','-r','--name-only',mainHead]).split('\n');
  const read=(head,file)=>JSON.parse(git(['show',head+':'+file]));
  const registry=read(mainHead,'.github/orchestration/v2-activation-registry.json');
  const result=[];
  for(const file of paths.filter(p=>/^\.github\/orchestration\/(requests\/vnext-(agent|plan-review)\/(?:resume\/)?[a-f0-9]{64}|queue\/v2\/[^/]+|vnext-closure\/[\w/.-]+)\.json$/.test(p))) {
    const commit=git(['log','--diff-filter=A','--format=%H','-1',mainHead,'--',file]).trim(); V.assertSha40(commit);
    const created_at=git(['show','-s','--format=%cI',commit]).trim(); V.assertIsoDate(created_at,'WORK_EXPECTED_CREATED');
    if(Date.parse(created_at)<Date.parse(c.recovery_since))continue;
    const data=read(mainHead,file);
    const resumed=['kodjo.vnext.agent-resume.v1','kodjo.vnext.agent-resume.v2'].includes(data.schema_version);
    if(resumed) {
      V.verifyContractHash(data); V.assertSha40(data.request_commit);
      if(!/^\.github\/orchestration\/requests\/vnext-agent\/[a-f0-9]{64}\.json$/.test(data.request_path)||!Number.isSafeInteger(data.prior_run_id)||data.prior_run_id<1||!file.endsWith('/'+data.contract_hash+'.json'))throw Error('WORK_EXPECTED_RESUME_INVALID');
    }
    const request=resumed?read(data.request_commit,data.request_path):data;
    if(data.schema_version==='kodjo.vnext.agent-resume.v2')require('./lib/vnext-interrupted-session').validate(data,request);
    if(resumed&&(data.request_hash!==request.contract_hash||data.source_head!==request.source_head||data.operation_hash!==request.operation_hash))throw Error('WORK_EXPECTED_RESUME_CHANGED');
    const current=registry.activations.filter(a=>a.slice_id===request.slice_id);
    if(current.length>1)throw Error('WORK_EXPECTED_CYCLE_AMBIGUOUS');
    if(current.length&&current[0].status!=='ACTIVE')continue;
    const source=request.source_head||request.delivery_head; V.assertSha40(source);
    const bootstrap=read(source,'.github/orchestration/v2-slices/'+request.slice_id+'/slice-bootstrap.json');
    if(bootstrap.protocol!=='VNEXT')continue;
    require('./lib/slice-identity').validateBootstrap(bootstrap);
    require('./lib/slice-identity').validateRegistry(read(source,'.github/orchestration/v2-activation-registry.json'),bootstrap);
    if(bootstrap.repository!==c.repository||bootstrap.issue_number!==request.issue_number)throw Error('WORK_EXPECTED_SLICE_BINDING');
    const relay=file.includes('/requests/');
    const producer=c.allowed_workflows.find(w=>relay?w.path==='.github/workflows/kodjo-vnext-chatgpt-plan-review.yml':w.operation_kind===(file.includes('/queue/')?'IMPLEMENTATION':'DELIVERY_TESTS_AND_CLOSURE'));
    if(!producer)throw Error('WORK_EXPECTED_PRODUCER_MISSING');
    if(relay){require('./agent-relay').validate(request);if(!resumed&&!file.endsWith('/'+request.contract_hash+'.json'))throw Error('WORK_EXPECTED_REQUEST_PATH');}
    else if(file.includes('/queue/')&&require('./lib/queue-contract').validateQueueRequest(request).length)throw Error('WORK_EXPECTED_QUEUE_INVALID');
    const hash=request.contract_hash||V.canonicalHash(request);
    if(signals.some(s=>resumed?(s.run_head||s.execution?.head)===commit:(s.request_hash||s.operation_descriptor?.request_hash)===hash))continue;
    const matches=runs.filter(r=>r.path===producer.path&&r.head_sha===commit&&r.head_branch==='main'&&r.repository?.full_name===c.repository&&r.head_repository?.full_name===c.repository&&bootstrap.authorized_actors.includes(r.actor?.login));
    result.push({request_path:file,request_hash:hash,slice_id:request.slice_id,request_commit:commit,created_at,
      state:matches.length?'REGISTERED_RUN_OBSERVED':'NO_MATCHING_RUN_OBSERVED',
      runs:matches.map(r=>({run_id:r.id,run_attempt:r.run_attempt,status:r.status,conclusion:r.conclusion})),
      next_action:matches.length?'Observe the registered run or recover its existing result.':'Reconcile trigger and dispatch provenance before any invocation; absence of a matching run is not proof of non-invocation.',
      grants_retry:false});
  }
  return result;
}

function inspect(c,{api=W.gh,git=W.git,includeRegistered=true,runs:providedRuns}={}) {
  W.binding(c);
  const repo='repos/'+c.repository;
  const main_head=api(repo+'/git/refs/heads/main').object.sha;
  const transport_head=api(repo+'/git/refs/heads/'+c.transport_branch).object.sha;
  V.assertSha40(main_head); V.assertSha40(transport_head);
  const binding=Consume.read; // Keep all reads pinned to the same observed references.
  if(binding(api,c,CONFIG,main_head)?.contract_hash!==c.contract_hash)throw Error('WORK_RESUME_STALE_BINDING');
  const commit=api(repo+'/git/commits/'+transport_head);
  const tree=api(repo+'/git/trees/'+commit.tree.sha+'?recursive=1');
  if(tree.truncated||!Array.isArray(tree.tree))throw Error('WORK_RESUME_TREE_INCOMPLETE');
  const files=new Set(tree.tree.filter(e=>e.type==='blob').map(e=>e.path));
  const read=file=>{if(!files.has(file))return null;const value=binding(api,c,file,transport_head);if(!value)throw Error('WORK_RESUME_READ_MISSING');return value;};
  const signals=[],claims={},checkpoints={},receipts={};
  for(const file of [...files].filter(p=>/^\.github\/orchestration\/requests\/vnext-work\/signals\/[a-f0-9]{64}\.json$/.test(p)).sort()) {
    const s=read(file); C.validateSignal(c,s);
    if(file!=='.github/orchestration/requests/vnext-work/signals/'+s.signal_key+'.json')throw Error('WORK_RESUME_SIGNAL_PATH');
    signals.push(s);
    claims[s.signal_key]=read(C.ROOT+'claims/'+s.signal_key+'.json');
    checkpoints[s.signal_key]=read(C.ROOT+'checkpoints/'+s.signal_key+'.json');
    const receipt=receipts[s.signal_key]=read(C.ROOT+'receipts/'+s.signal_key+'.json');
    if(receipt) {
      V.verifyContractHash(receipt);
      const match=/^git:([a-f0-9]{40}):(.+)$/.exec(receipt.checkpoint_ref||'');
      if(!match||match[2]!==C.ROOT+'checkpoints/'+s.signal_key+'.json')throw Error('WORK_RESUME_CHECKPOINT_REF');
      const relation=api(repo+'/compare/'+match[1]+'...'+transport_head);
      if(!['ahead','identical'].includes(relation.status))throw Error('WORK_RESUME_CHECKPOINT_ANCESTRY');
      if(binding(api,c,match[2],match[1])?.contract_hash!==checkpoints[s.signal_key]?.contract_hash)throw Error('WORK_RESUME_UNPUBLISHED_CHECKPOINT');
    }
  }
  const runs=providedRuns||X.pages(repo+'/actions/runs?created='+encodeURIComponent('>='+c.recovery_since),'workflow_runs',api).filter(r=>c.allowed_workflows.some(w=>w.path===r.path));
  const operations=includeRegistered?registered(c,main_head,runs,signals,git):[];
  for(const run of runs.filter(r=>r.status!=='completed'&&r.repository?.full_name===c.repository&&r.head_repository?.full_name===c.repository&&(c.authorized_actors||[]).includes(r.actor?.login)&&c.allowed_workflows.some(w=>w.path===r.path))) {
    operations.push({run_id:run.id,run_attempt:run.run_attempt,head:run.head_sha,workflow:run.path,status:run.status,
      created_at:run.created_at,updated_at:run.updated_at,next_action:'Observe progress; no timeout or retry authority is inferred.'});
  }
  if(api(repo+'/git/refs/heads/main').object.sha!==main_head||api(repo+'/git/refs/heads/'+c.transport_branch).object.sha!==transport_head)throw Error('WORK_RESUME_HEAD_MOVED');
  return Resume.reconstruct(c,{main_head,transport_head,signals,claims,checkpoints,receipts,operations});
}
function step(c,transcript=[],{git=W.git}={}) {
  return require('./lib/vnext-connector-step').step({binding:c,action:'inspect'},api=>inspect(c,{api,git}),transcript);
}
function main(args=process.argv.slice(2)) {
  const fs=require('node:fs'),c=JSON.parse(fs.readFileSync(CONFIG,'utf8'));
  if(!args.length)return inspect(c);
  if(args.length===2&&args[0]==='step-inspect')return step(c,JSON.parse(fs.readFileSync(args[1],'utf8')));
  if(args.length===2&&args[0]==='prepare-handover')return Resume.prepareHandover(c,inspect(c),JSON.parse(fs.readFileSync(args[1],'utf8')));
  throw Error('Usage: inspect-vnext-work.js [step-inspect transcript.json | prepare-handover observed-automations.json]');
}
if(require.main===module)try{console.log(JSON.stringify(main()));}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={inspect,registered,step,main};
