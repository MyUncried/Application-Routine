'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const test=require('node:test');
const assert=require('node:assert/strict');

const P=require('../../scripts/kodjo/lib/preflight-contract');
const { verifyFile }=require('../../scripts/kodjo/verify-preflight-attestation');
const { projectQueueRequest }=require('../../scripts/kodjo/lib/queue-request');
const { resolveClaudeBinary }=require('../../scripts/kodjo/lib/claude-local');

const root=path.resolve(__dirname,'..','..');

function git(cwd,args){return cp.execFileSync('git',args,{cwd,encoding:'utf8'}).trim();}
function fixture(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-preflight-b-'));
  git(dir,['init','-q']); git(dir,['config','user.email','x@y.z']); git(dir,['config','user.name','KODJO']);
  fs.mkdirSync(path.join(dir,'.github','orchestration','queue','v2'),{recursive:true});
  fs.writeFileSync(path.join(dir,'README.md'),'base\n');
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
  const after=git(dir,['rev-parse','HEAD']);
  const queueBlob=git(dir,['hash-object','--',rel]);
  const projection=projectQueueRequest(queue);
  const att=P.finalize({
    queue_path:rel,queue_blob_oid:queueBlob,request_id:queue.request_id,
    event_before:source,event_after:after,protocol_head:queue.source_head,execution_head:queue.source_head,
    operation_kind:'IMPLEMENT',mode:'INITIAL',bindings:{},
    freshness_guards_required:['PF-023','PF-024','PF-025','PF-026','PF-027','PF-028'],
    projection_sha256:P.sha256(projection),prompt_sha256:'f'.repeat(64),prompt_file_sha256:null,prompt_bytes:1,
    package_lock_sha256:null,toolchain:{},checks:[{id:'PF-004',status:'PASS',source:'test',evidence:'ok',diagnostic:null}]
  });
  const preflight=path.join(dir,'preflight.json');
  fs.writeFileSync(preflight,JSON.stringify(att,null,2)+'\n');
  return {dir,rel,queue,att,preflight};
}

test('lot B: production workflow enchaîne sélection → préflight → runner avec la même attestation',()=>{
  const wf=fs.readFileSync(path.join(root,'.github','workflows','kodjo-v2-lean-queue.yml'),'utf8');
  const admission=wf.indexOf('verify-queue-admission.js');
  const preflight=wf.indexOf('verify-queue-preflight.js');
  const runner=wf.indexOf('run-queued-request.ps1 -QueueFile $selected -PreflightFile $preflight');
  assert.ok(admission>=0 && preflight>admission && runner>preflight);
  assert.match(wf,/preflight\.json/);
});

test('lot B: run-queued refuse une production supervisée sans attestation',()=>{
  const body=fs.readFileSync(path.join(root,'scripts','kodjo','run-queued-request.ps1'),'utf8');
  assert.match(body,/KODJO_QUEUE_PREFLIGHT_REQUIRED/);
  assert.match(body,/verify-preflight-attestation\.js/);
  assert.match(body,/KODJO_PREFLIGHT_FILE/);
  const verify=body.indexOf('verify-preflight-attestation.js');
  const checkout=body.indexOf('git switch --detach');
  assert.ok(verify>=0 && checkout>verify,'attestation must be verified before checkout mutation');
});

test('lot B: consumer accepte l attestation exacte et refuse queue/fingerprint altérés',()=>{
  const f=fixture();
  assert.doesNotThrow(()=>verifyFile(f.preflight,f.rel,{cwd:f.dir}));
  const tampered=JSON.parse(fs.readFileSync(f.preflight,'utf8'));
  tampered.execution_head='f'.repeat(40);
  fs.writeFileSync(f.preflight,JSON.stringify(tampered,null,2)+'\n');
  assert.throws(()=>verifyFile(f.preflight,f.rel,{cwd:f.dir}),/PREFLIGHT_EXECUTION_HEAD_MISMATCH|PREFLIGHT_FINGERPRINT_MISMATCH/);
});

test('lot B: freshness guard Claude compare projection, prompt source et package-lock avant invocation',()=>{
  const body=fs.readFileSync(path.join(root,'scripts','kodjo','run-local-claude.js'),'utf8');
  const freshnessLib=fs.readFileSync(path.join(root,'scripts','kodjo','lib','preflight-freshness.js'),'utf8');
  const freshnessCall=body.indexOf('verifyLocalFreshness({');
  const version=body.indexOf('CLAUDE_VERSION_REFUSED');
  assert.ok(freshnessCall>=0 && version>freshnessCall);
  assert.match(freshnessLib,/PREFLIGHT_PROJECTION_DRIFT/);
  assert.match(freshnessLib,/PREFLIGHT_PROMPT_SOURCE_DRIFT/);
  assert.match(freshnessLib,/PREFLIGHT_PACKAGE_LOCK_DRIFT/);
  assert.match(body,/PREFLIGHT_ATTESTATION_MISSING/);
  assert.match(body,/preflight\.json/);
});

test('lot B: résolution du binaire Claude est une source partagée',()=>{
  const local=fs.readFileSync(path.join(root,'scripts','kodjo','run-local-claude.js'),'utf8');
  const preflight=fs.readFileSync(path.join(root,'scripts','kodjo','verify-queue-preflight.js'),'utf8');
  assert.match(local,/resolveClaudeBinary/);
  assert.match(preflight,/resolveClaudeBinary/);
  assert.match(resolveClaudeBinary({APPDATA:'C:\\Users\\x\\AppData\\Roaming'},'win32'),/@anthropic-ai[\\/]claude-code[\\/]bin[\\/]claude\.exe$/);
});

test('lot B: les gardes historiques stables restent encore présents jusqu au lot C',()=>{
  const runner=fs.readFileSync(path.join(root,'scripts','kodjo','run-queued-request.ps1'),'utf8');
  const local=fs.readFileSync(path.join(root,'scripts','kodjo','run-local-claude.js'),'utf8');
  assert.match(runner,/verify-implementation-mission\.js/);
  assert.match(runner,/KODJO_QUEUE_SOURCE_NOT_ANCESTOR/);
  assert.match(local,/normalizeRequest/);
  assert.match(local,/RECOVERY_REFUSED/);
});
