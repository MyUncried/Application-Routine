'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const test=require('node:test');
const assert=require('node:assert/strict');

const P=require('../../scripts/kodjo/lib/preflight-contract');
const { projectQueueRequest }=require('../../scripts/kodjo/lib/queue-request');
const { verifyFile }=require('../../scripts/kodjo/verify-preflight-attestation');
const { verifyLocalFreshness }=require('../../scripts/kodjo/lib/preflight-freshness');
const { verifyQueueTarget }=require('../../scripts/kodjo/verify-preflight-live-target');
const { acquire, release }=require('../../scripts/kodjo/lib/execution-lock');

const root=path.resolve(__dirname,'..','..');

function git(cwd,args){return cp.execFileSync('git',args,{cwd,encoding:'utf8'}).trim();}
function fixture(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-preflight-c-'));
  git(dir,['init','-q']); git(dir,['config','core.autocrlf','false']); git(dir,['config','user.email','x@y.z']); git(dir,['config','user.name','KODJO']);
  fs.mkdirSync(path.join(dir,'.github','orchestration','queue','v2'),{recursive:true});
  fs.writeFileSync(path.join(dir,'mission.md'),'mission v1\n');
  fs.writeFileSync(path.join(dir,'package-lock.json'),'{"lockfileVersion":3}\n');
  git(dir,['add','.']); git(dir,['commit','-qm','base']);
  const source=git(dir,['rev-parse','HEAD']);
  const queue={
    schema_version:'kodjo.protocol.v2.lean-request.0.6.13',
    request_id:'550e8400-e29b-41d4-a716-446655440001',
    authorized_plan:{plan_path:'plan.md',plan_blob_oid:'b'.repeat(40),approved_at_commit:'a'.repeat(40),evidence_kind:'ARTIFACT_HASH'},
    independent_review:{review_path:'review.md',review_blob_oid:'c'.repeat(40),reviewed_plan_blob_oid:'b'.repeat(40),verdict:'APPROVED',evidence_kind:'ARTIFACT_HASH'},
    user_gate:{gate_ref:'issue_comment:12',gated_reference:'b'.repeat(40),decision:'APPROVED',user_login:'MyUncried',evidence_kind:'ORGANISATIONAL'},
    slice_id:'QUALIF',issue_number:999,mode:'INITIAL',operation_kind:'IMPLEMENT',session_id:null,
    source_head:source,baseline_head:'e'.repeat(40),slice_bootstrap_file:'bootstrap.json',slice_bootstrap_sha256:'d'.repeat(64),
    prompt_file:'mission.md',scope_allow:['src/**'],checks:['jest'],
    limits:{max_ai_calls:1,max_duration_seconds:600,max_prompt_bytes:32768,max_total_prompt_bytes:32768,max_rollovers:0},
    created_at:'2026-09-19T00:00:00.000Z'
  };
  const rel='.github/orchestration/queue/v2/nominal.json';
  fs.writeFileSync(path.join(dir,rel),JSON.stringify(queue,null,2)+'\n');
  git(dir,['add',rel]); git(dir,['commit','-qm','queue']);
  const queueBlob=git(dir,['hash-object','--',rel]);
  const projection=projectQueueRequest(queue);
  const promptAbs=path.join(dir,'mission.md');
  const normalized={...projection,prompt_file:promptAbs};
  const att=P.finalize({
    queue_path:rel,queue_blob_oid:queueBlob,request_id:queue.request_id,
    event_before:source,event_after:git(dir,['rev-parse','HEAD']),
    protocol_head:queue.source_head,execution_head:queue.source_head,
    operation_kind:'IMPLEMENT',mode:'INITIAL',bindings:{},
    freshness_guards_required:['PF-023','PF-024','PF-025','PF-026','PF-027','PF-028'],
    projection_sha256:P.sha256(projection),
    prompt_sha256:'f'.repeat(64),
    prompt_file_sha256:P.sha256(fs.readFileSync(promptAbs)),
    prompt_bytes:1,
    package_lock_sha256:P.sha256(fs.readFileSync(path.join(dir,'package-lock.json'))),
    toolchain:{},
    checks:require('./helpers/preflight-checks').checks(queue)
  });
  const preflight=path.join(dir,'preflight.json');
  fs.writeFileSync(preflight,JSON.stringify(att,null,2)+'\n');
  return {dir,rel,queue,projection,normalized,att,preflight};
}

test('lot C: consumer matérialise exactement la projection déjà attestée',()=>{
  const f=fixture();
  const out=path.join(f.dir,'request.json');
  const script=path.join(root,'scripts','kodjo','verify-preflight-attestation.js');
  const r=cp.spawnSync(process.execPath,[script,f.preflight,f.rel,out],{cwd:f.dir,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(out,'utf8')),f.projection);
});

test('lot C: queue modifiée après préflight est refusée',()=>{
  const f=fixture();
  const q=JSON.parse(fs.readFileSync(path.join(f.dir,f.rel),'utf8'));
  q.checks=['typescript'];
  fs.writeFileSync(path.join(f.dir,f.rel),JSON.stringify(q,null,2)+'\n');
  assert.throws(()=>verifyFile(f.preflight,f.rel,{cwd:f.dir}),/PREFLIGHT_QUEUE_BLOB_MISMATCH/);
});

test('lot C: la mission attestée est relue au HEAD protocolaire immuable',()=>{
  const f=fixture();
  fs.writeFileSync(path.join(f.dir,'mission.md'),'mission v2\\n');
  assert.doesNotThrow(()=>verifyLocalFreshness({
    preflight:f.att,rawRequest:f.projection,request:f.normalized,repoRoot:f.dir
  }));
  const supervisor=fs.readFileSync(path.join(root,'scripts','kodjo','run-local-claude.js'),'utf8');
  assert.match(supervisor,/Source\\.readFileAtHead\\(promptRelative, request\\.protocol_source_head/);
  assert.match(supervisor,/WORKTREE_NOT_CLEAN/);
});

test('lot C: package-lock modifié après préflight est refusé avant Claude',()=>{
  const f=fixture();
  fs.writeFileSync(path.join(f.dir,'package-lock.json'),'{"lockfileVersion":3,"changed":true}\n');
  assert.throws(()=>verifyLocalFreshness({
    preflight:f.att,rawRequest:f.projection,request:f.normalized,repoRoot:f.dir
  }),/PREFLIGHT_PACKAGE_LOCK_DRIFT/);
});

test('queue checkout preserves Git blob bytes despite inherited Windows autocrlf',()=>{
  const f=fixture();
  const clones=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-eol-'));
  try {
    const inherited=path.join(clones,'gitconfig');
    fs.writeFileSync(inherited,'[core]\n\tautocrlf = true\n');
    const env={...process.env,GIT_CONFIG_GLOBAL:inherited,GIT_CONFIG_NOSYSTEM:'1'};
    for(const key of Object.keys(env)) if(/^GIT_CONFIG_(COUNT|KEY_\d+|VALUE_\d+)$/.test(key)) delete env[key];
    const normal=path.join(clones,'normal');
    cp.execFileSync('git',['clone','--no-local',f.dir,normal],{env,stdio:'pipe'});
    const argsFor=dir=>({preflight:f.att,rawRequest:f.projection,
      request:{...f.normalized,prompt_file:path.join(dir,'mission.md')},repoRoot:dir});
    assert.match(fs.readFileSync(path.join(normal,'mission.md'),'utf8'),/\r\n/);
    assert.throws(()=>verifyLocalFreshness(argsFor(normal)),/PREFLIGHT_PROMPT_SOURCE_DRIFT/);
    const fixed=path.join(clones,'fixed');
    cp.execFileSync('git',['clone','--no-local',f.dir,fixed],{env:{...env,
      GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'core.autocrlf',GIT_CONFIG_VALUE_0:'false'},stdio:'pipe'});
    // Persist only in this disposable checkout, before switching to the approved source.
    git(fixed,['config','--local','core.autocrlf','false']);
    cp.execFileSync('git',['switch','--detach',f.queue.source_head],{cwd:fixed,env,stdio:'pipe'});
    assert.equal(P.sha256(fs.readFileSync(path.join(fixed,'mission.md'))),f.att.prompt_file_sha256);
    assert.equal(P.sha256(fs.readFileSync(path.join(fixed,'package-lock.json'))),f.att.package_lock_sha256);
    assert.doesNotThrow(()=>verifyLocalFreshness(argsFor(fixed)));
    fs.writeFileSync(path.join(fixed,'mission.md'),'changed mission\n');
    assert.doesNotThrow(()=>verifyLocalFreshness(argsFor(fixed)));
    assert.equal(fs.readFileSync(inherited,'utf8'),'[core]\n\tautocrlf = true\n');
  } finally { fs.rmSync(f.dir,{recursive:true,force:true}); fs.rmSync(clones,{recursive:true,force:true}); }
});

test('lot C: les validations stables sont dédupliquées uniquement sur le chemin attesté',()=>{
  const runner=fs.readFileSync(path.join(root,'scripts','kodjo','run-queued-request.ps1'),'utf8');
  assert.match(runner,/\$preflightVerified = \$true/);
  assert.match(runner,/else \{[\s\S]*KODJO_QUEUE_SCHEMA_REFUSED[\s\S]*KODJO_QUEUE_SOURCE_NOT_ANCESTOR[\s\S]*project-queued-request\.js/);
  assert.match(runner,/if \(-not \$preflightVerified\) \{[\s\S]*verify-implementation-mission\.js/);
  const consumer=runner.indexOf('verify-preflight-attestation.js');
  const checkout=runner.indexOf('git switch --detach');
  assert.ok(consumer>=0 && checkout>consumer);
});

test('lot C: VISUAL_CORRECTION refuse une PR fermée, une branche déplacée ou un HEAD déplacé après preflight',()=>{
  const queue={
    operation_kind:'VISUAL_CORRECTION',
    delivery_target:{kind:'EXISTING_PR',application_pr:142,branch:'kodjo/application',application_head:'a'.repeat(40)}
  };
  const nominal={state:'open',base:{ref:'main'},head:{ref:'kodjo/application',sha:'a'.repeat(40)}};
  assert.equal(verifyQueueTarget(queue,nominal).status,'PASS');
  assert.throws(()=>verifyQueueTarget(queue,{...nominal,state:'closed'}),/KODJO_QUEUE_APPLICATION_PR_NOT_OPEN/);
  assert.throws(()=>verifyQueueTarget(queue,{...nominal,head:{...nominal.head,ref:'other'}}),/KODJO_QUEUE_APPLICATION_BRANCH_MISMATCH/);
  assert.throws(()=>verifyQueueTarget(queue,{...nominal,head:{...nominal.head,sha:'b'.repeat(40)}}),/KODJO_QUEUE_APPLICATION_HEAD_MOVED/);
  const runner=fs.readFileSync(path.join(root,'scripts','kodjo','run-queued-request.ps1'),'utf8');
  const preflight=runner.indexOf('verify-preflight-attestation.js');
  const live=runner.indexOf('verify-preflight-live-target.js');
  const checkout=runner.indexOf('git switch --detach $applicationHead');
  assert.ok(preflight>=0 && live>preflight && checkout>live);
  assert.match(runner,/KODJO_QUEUE_EXISTING_PR_REMOTE_HEAD_MISMATCH/);
  assert.match(runner,/KODJO_QUEUE_APPLICATION_PR_CLOSED_DURING_DELIVERY/);
});

test('lot C: IMPLEMENT ciblé utilise les mêmes gardes de PR exacte que VISUAL_CORRECTION',()=>{
  const target={kind:'EXISTING_PR',application_pr:181,branch:'kodjo/application',application_head:'a'.repeat(40)};
  const nominal={state:'open',base:{ref:'main'},head:{ref:'kodjo/application',sha:'a'.repeat(40)}};
  assert.equal(verifyQueueTarget({operation_kind:'IMPLEMENT',delivery_target:target},nominal).status,'PASS');
  assert.throws(()=>verifyQueueTarget(
    {operation_kind:'IMPLEMENT',delivery_target:target},
    {...nominal,head:{...nominal.head,sha:'b'.repeat(40)}}
  ),/KODJO_QUEUE_APPLICATION_HEAD_MOVED/);
  const queue={operation_kind:'IMPLEMENT',mode:'INITIAL',delivery_target:target};
  const att=P.finalize({...fixture().att,operation_kind:'IMPLEMENT',mode:'INITIAL',
    checks:require('./helpers/preflight-checks').checks(queue)});
  assert.doesNotThrow(()=>P.verifyApplicability(att,queue));
});

test('lot C: lock reste acquis atomiquement à la frontière Claude même si le preflight était vert',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-lock-race-'));
  const lockPath=path.join(dir,'claude-local.lock');
  const started='2026-09-19T00:00:00.000Z';
  const inspect=()=>({state:'ALIVE',started_at:started,name:'node',command_line:'test'});
  const scan=()=>({state:'NONE',evidence:'test'});
  const first=acquire(lockPath,{run_id:'r1',request_id:'q1',session_id:null},inspect,scan);
  try{
    assert.throws(()=>acquire(lockPath,{run_id:'r2',request_id:'q2',session_id:null},inspect,scan),/CLAUDE_EXECUTION_ALREADY_ACTIVE/);
  }finally{
    assert.equal(release(first),true);
  }
  const local=fs.readFileSync(path.join(root,'scripts','kodjo','run-local-claude.js'),'utf8');
  const freshness=local.indexOf('verifyLocalFreshness({');
  const lock=local.indexOf('lock = acquireExecutionLock',freshness);
  assert.ok(freshness>=0 && lock>freshness);
});

test('lot C: IMPLEMENT, RESUME_DELTA et VISUAL_CORRECTION gardent leurs chemins E2E',()=>{
  const preflight=fs.readFileSync(path.join(root,'scripts','kodjo','verify-queue-preflight.js'),'utf8');
  const runner=fs.readFileSync(path.join(root,'scripts','kodjo','run-queued-request.ps1'),'utf8');
  const finalizer=fs.readFileSync(path.join(root,'scripts','kodjo','verify-v2-finalization.js'),'utf8');
  assert.match(preflight,/VISUAL_CORRECTION/);
  assert.match(preflight,/RESUME_DELTA/);
  assert.match(preflight,/verifyVisualCheckpoint/);
  assert.match(preflight,/recovery_migration/);
  assert.match(runner,/prepare|start-kodjo-v2/);
  assert.match(finalizer,/READY_TO_CLOSE/);
});

test('audit F06: consumer rejects changed verdict, missing/duplicate checks and false applicability',()=>{
  const f=fixture();
  try{
    const write=att=>fs.writeFileSync(f.preflight,JSON.stringify(att));
    let bad=P.finalize({...f.att,checks:f.att.checks.map(r=>r.id==='PF-006'?{...r,status:'FAIL'}:r)});
    const hash=bad.preflight_fingerprint;bad.status='PASS';assert.equal(P.computeFingerprint(bad),hash);
    write(bad);assert.throws(()=>verifyFile(f.preflight,f.rel,{cwd:f.dir}),/PREFLIGHT_VERDICT_INCONSISTENT/);
    for(const checks of [[],f.att.checks.slice(1),[...f.att.checks,f.att.checks[0]]]){
      bad=P.finalize({...f.att,checks});assert.equal(bad.status,'FAIL');write(bad);
      assert.throws(()=>verifyFile(f.preflight,f.rel,{cwd:f.dir}),/PREFLIGHT_CHECK_COVERAGE_INVALID/);
    }
    bad=P.finalize({...f.att,checks:f.att.checks.map(r=>({...r,status:'NOT_APPLICABLE'}))});write(bad);
    assert.throws(()=>verifyFile(f.preflight,f.rel,{cwd:f.dir}),/PREFLIGHT_CHECK_APPLICABILITY_INVALID/);
    for(const operation_kind of ['IMPLEMENT','VISUAL_CORRECTION']) for(const recovery_migration of [undefined,{attestation_blob_oid:'a'.repeat(40)}]){
      const queue={operation_kind,mode:'RESUME_DELTA',recovery_migration};
      const att=P.finalize({...f.att,operation_kind,mode:queue.mode,checks:require('./helpers/preflight-checks').checks(queue)});
      assert.doesNotThrow(()=>P.verifyApplicability(att,queue));
    }
  }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
