'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const { runPreflight } = require('../../scripts/kodjo/verify-queue-preflight');
const P = require('../../scripts/kodjo/lib/preflight-contract');
const C = require('../../scripts/kodjo/lib/claude-local');

function git(cwd,args) {
  return cp.execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
}
function fixture() {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-preflight-a-'));
  git(dir,['init','-q']);
  git(dir,['config','user.email','test@example.test']);
  git(dir,['config','user.name','KODJO Test']);
  fs.mkdirSync(path.join(dir,'.github','orchestration','queue','v2'),{recursive:true});
  fs.writeFileSync(path.join(dir,'.github','orchestration','queue','v2-consumed-registry.json'),'{"entries":[]}\n');
  fs.writeFileSync(path.join(dir,'README.md'),'base\n');
  git(dir,['add','.']);
  git(dir,['commit','-qm','base']);
  const before=git(dir,['rev-parse','HEAD']);
  const queue={
    schema_version:'kodjo.protocol.v2.lean-request.0.6.13',
    request_id:'550e8400-e29b-41d4-a716-446655440001',
    authorized_plan:{
      plan_path:'.github/orchestration/v2-slices/QUALIF/technical-plan.md',
      plan_blob_oid:'b'.repeat(40),
      approved_at_commit:'a'.repeat(40),
      evidence_kind:'ARTIFACT_HASH',
    },
    independent_review:{
      review_path:'.github/orchestration/v2-slices/QUALIF/independent-review.md',
      review_blob_oid:'c'.repeat(40),
      reviewed_plan_blob_oid:'b'.repeat(40),
      verdict:'APPROVED',
      evidence_kind:'ARTIFACT_HASH',
    },
    user_gate:{
      gate_ref:'issue_comment:12',
      gated_reference:'b'.repeat(40),
      decision:'APPROVED',
      user_login:'MyUncried',
      evidence_kind:'ORGANISATIONAL',
    },
    slice_id:'QUALIF',
    issue_number:999,
    mode:'INITIAL',
    operation_kind:'IMPLEMENT',
    session_id:null,
    source_head:before,
    baseline_head:'e'.repeat(40),
    slice_bootstrap_file:'.github/orchestration/v2-slices/QUALIF/slice-bootstrap.json',
    slice_bootstrap_sha256:'d'.repeat(64),
    prompt_file:'.github/orchestration/v2-slices/QUALIF/implementation-mission.md',
    scope_allow:['src/domain/sessions/**'],
    checks:['jest'],
    limits:{max_ai_calls:1,max_duration_seconds:600,max_prompt_bytes:32768,max_total_prompt_bytes:32768,max_rollovers:0},
    created_at:'2026-09-19T00:00:00.000Z',
  };
  const rel='.github/orchestration/queue/v2/nominal.json';
  fs.writeFileSync(path.join(dir,rel),JSON.stringify(queue,null,2)+'\n');
  git(dir,['add',rel]);
  git(dir,['commit','-qm','queue']);
  const after=git(dir,['rev-parse','HEAD']);
  return {dir,before,after,rel,queue};
}
function normalized(queue) {
  return {
    schema_version:'kodjo.protocol.v2.local-implementation.0.6.12',
    slice_id:queue.slice_id,
    source_head:queue.source_head,
    protocol_source_head:queue.source_head,
    baseline_head:queue.baseline_head,
    slice_bootstrap_file:queue.slice_bootstrap_file,
    slice_bootstrap_sha256:queue.slice_bootstrap_sha256,
    mode:'INITIAL',
    operation_kind:'IMPLEMENT',
    delivery_target:null,
    session_id:null,
    prompt_file:'/tmp/mission.md',
    scope_allow:queue.scope_allow,
    checks:queue.checks,
    limits:queue.limits,
    request_id:queue.request_id,
    allow_legacy_recovery_bootstrap:false,
    retry_of_run_id:null,
  };
}
function probes(queue, overrides={}) {
  const base={
    verifyAuthorizations:()=>({plan_blob_oid:queue.authorized_plan.plan_blob_oid,review_blob_oid:queue.independent_review.review_blob_oid,gate_ref:queue.user_gate.gate_ref}),
    planContract:()=>({schema:'kodjo.plan-contract-consistency.v2',contract_version:2}),
    implementationMission:()=>({schema:'kodjo.ui-implementation-contract.v1'}),
    projectQueueRequest:()=>({schema_version:'kodjo.protocol.v2.local-implementation.0.6.12'}),
    normalizeRequest:()=>normalized(queue),
    prompt:()=>({text:'prompt',bytes:6,sha256:P.sha256('prompt')}),
    sourceHead:()=>({source_head:queue.source_head}),
    recovery:()=>({status:'NOT_REQUIRED'}),
    gitVersion:()=>({ok:true,stdout:'git version test'}),
    nodeNpm:()=>({node:process.version,npm:'test'}),
    claudeVersion:()=>C.CLAUDE_CODE_VERSION,
    claudeAuth:()=> 'AUTH_OK',
    githubAccess:()=> 'MyUncried/Application-Routine',
    packageLock:()=>({package_lock_sha256:null}),
  };
  return {...base,...overrides};
}

test('lot A: shadow preflight produit une attestation PASS sans toucher au runtime',()=>{
  const f=fixture();
  const result=runPreflight({cwd:f.dir,queuePath:f.rel,before:f.before,after:f.after,runAttempt:1,probes:probes(f.queue)});
  assert.equal(result.status,'PASS');
  assert.equal(result.schema_version,'kodjo.protocol.v2.queue-preflight.v1');
  assert.equal(Object.hasOwn(result,'freshness_guards_required'),false,'D17: no unobserved PF-023..028 declaration');
  assert.equal(result.queue_path,f.rel);
  assert.equal(result.request_id,f.queue.request_id);
  assert.equal(result.protocol_head,f.queue.source_head);
  assert.equal(result.execution_head,f.queue.source_head);
  assert.equal(result.operation_kind,'IMPLEMENT');
  assert.ok(result.checks.length >= 20);
  assert.ok(result.checks.every((row)=>['PASS','NOT_APPLICABLE'].includes(row.status)));
  assert.equal(P.verify(result,{queue_path:f.rel,request_id:f.queue.request_id}),result);
});

test('PF-018 executes the real Node/npm toolchain on the host, including Windows command shims',()=>{
  const f=fixture();
  try {
    const result=runPreflight({cwd:f.dir,queuePath:f.rel,before:f.before,after:f.after,runAttempt:1,
      probes:probes(f.queue,{nodeNpm:null})});
    const toolchain=result.checks.find(row=>row.id==='PF-018');
    assert.equal(toolchain.status,'PASS',toolchain.diagnostic);
    assert.match(toolchain.evidence.node,/^v\d+\.\d+\.\d+/);
    assert.match(toolchain.evidence.npm,/^\d+\.\d+\.\d+/);
    assert.equal(result.status,'PASS');
  } finally { fs.rmSync(f.dir,{recursive:true,force:true}); }
});

test('lot A: plusieurs défauts indépendants sont collectés dans le même rapport',()=>{
  const f=fixture();
  const result=runPreflight({
    cwd:f.dir,queuePath:f.rel,before:f.before,after:f.after,runAttempt:1,
    probes:probes(f.queue,{
      verifyAuthorizations:()=>{throw new Error('AUTHORIZATION_BROKEN');},
      claudeVersion:()=> '0.0.0',
      githubAccess:()=>{throw new Error('GITHUB_DOWN');},
    })
  });
  assert.equal(result.status,'FAIL');
  const failed=new Map(result.checks.filter((r)=>r.status==='FAIL').map((r)=>[r.id,r.diagnostic]));
  assert.match(failed.get('PF-006'),/AUTHORIZATION_BROKEN/);
  assert.match(failed.get('PF-019'),/CLAUDE_VERSION_REFUSED/);
  assert.match(failed.get('PF-021'),/GITHUB_DOWN/);
  assert.ok(result.checks.some((r)=>r.status==='BLOCKED'),'dependent checks should be BLOCKED, not hidden');
});

test('lot A: fingerprint détecte toute altération de l attestation',()=>{
  const f=fixture();
  const result=runPreflight({cwd:f.dir,queuePath:f.rel,before:f.before,after:f.after,runAttempt:1,probes:probes(f.queue)});
  const tampered=JSON.parse(JSON.stringify(result));
  tampered.execution_head='f'.repeat(40);
  assert.throws(()=>P.verify(tampered),/PREFLIGHT_FINGERPRINT_MISMATCH/);
});

test('lot A: queue consommée est refusée avant les contrats aval',()=>{
  const f=fixture();
  const oid=git(f.dir,['hash-object',f.rel]);
  fs.writeFileSync(path.join(f.dir,'.github','orchestration','queue','v2-consumed-registry.json'),JSON.stringify({entries:[{path:f.rel,blob_oid:oid,status:'CONSUMED'}]},null,2));
  const result=runPreflight({cwd:f.dir,queuePath:f.rel,before:f.before,after:f.after,runAttempt:1,probes:probes(f.queue)});
  const pf3=result.checks.find((r)=>r.id==='PF-003');
  assert.equal(pf3.status,'FAIL');
  assert.match(pf3.diagnostic,/KODJO_QUEUE_CONSUMED_REFUSED/);
});

test('lot A: le contrat shadow reste opposable après activation par le lot B',()=>{
  const root=path.resolve(__dirname,'..','..');
  const workflow=fs.readFileSync(path.join(root,'.github','workflows','kodjo-v2-lean-queue.yml'),'utf8');
  const preflight=workflow.indexOf('verify-queue-preflight.js');
  const runner=workflow.indexOf('run-queued-request.ps1');
  assert.ok(preflight >= 0 && runner > preflight);
  assert.match(workflow,/kodjo-preflight-/);
});

test('audit F08/F09: selected queue reaches aggregation and failed attestation is written without runner',()=>{
  const {admit}=require('../../scripts/kodjo/verify-queue-admission');
  const f=fixture();
  try{
    assert.throws(()=>admit({cwd:f.dir,before:f.before,after:f.after,runAttempt:1}));
    const selected=admit({cwd:f.dir,before:f.before,after:f.after,runAttempt:1,selectionOnly:true});
    const outputFile=path.join(f.dir,'preflight-failed.json');
    const result=runPreflight({cwd:f.dir,queuePath:selected.selected,before:f.before,after:f.after,runAttempt:1,outputFile,
      probes:probes(f.queue,{verifyAuthorizations:()=>{throw Error('AUTH_FAILED');},githubAccess:()=>{throw Error('API_DOWN');}})});
    assert.equal(result.status,'FAIL');
    assert.match(result.checks.find(x=>x.id==='PF-006').diagnostic,/AUTH_FAILED/);
    assert.match(result.checks.find(x=>x.id==='PF-021').diagnostic,/API_DOWN/);
    assert.deepEqual(JSON.parse(fs.readFileSync(outputFile)),result);
    const {parse}=require('../../scripts/kodjo/lib/yaml');
    const wf=parse(fs.readFileSync(path.resolve(__dirname,'../../.github/workflows/kodjo-v2-lean-queue.yml'),'utf8'));
    const step=Object.values(wf.jobs).flatMap(j=>j.steps).find(x=>x.name==='Preserve preflight attestation including failure');
    assert.equal(step.if,'always()');assert.equal(step.with.path,'${{ runner.temp }}/kodjo-preflight-${{ github.run_id }}-${{ github.run_attempt }}.json');
  }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
