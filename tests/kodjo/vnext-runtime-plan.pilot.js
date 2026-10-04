'use strict';
// Real local Git/admission/read processes; injected owner/reviewer services.
// No genuine model call or device acceptance is asserted by these tests.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const F = require('./helpers/vnext-post-acceptance-fixture');
const T = require('./helpers/vnext-planning-fixture');
const V = require('../../scripts/kodjo/lib/vnext-contract');
const Chain = require('../../scripts/kodjo/lib/vnext-live-chain');
const Approval = require('../../scripts/kodjo/lib/approval-handoff-contract');
const PlanView = require('../../scripts/kodjo/lib/vnext-runtime-plan');
const Lock = require('../../scripts/kodjo/lib/execution-lock');
const GitRead = path.resolve(__dirname, '../../scripts/kodjo/kodjo-git-read.js');

function fixture() {
  const f = F.fixture({existingPR:true}), transport = T.transport();
  transport.slice_bootstrap_file = '.github/orchestration/v2-slices/V2-VNEXT-09/slice-bootstrap.json';
  const ready = Chain.prepare(f.produced, f.receipt, transport,
    { cwd: f.cwd, github: f.github, revisionEvidence: f.revisionEvidence });
  const chainFile = '.github/orchestration/vnext-runtime/V2-VNEXT-09/prepared.json';
  const bootstrap = { schema_version: 'kodjo.protocol.v2.slice-bootstrap.0.6.12',
    protocol: 'VNEXT', vnext_chain_file: chainFile, slice_id: 'V2-VNEXT-09', issue_number: 999,
    repository: 'MyUncried/Application-Routine', target_branch: 'main',
    baseline_head: f.produced.artifacts.planningEnvelope.baseline_head,
    protocol_version: '0.6.12', protocol_commit: f.baseProduced.producer_revision,
    previous_slice_id: null, previous_checkpoint: null,
    product_sources: [{ path: 'docs/profile.md', sha256: V.sha256('FIXTURE profile delivery\n') }],
    created_at: '2026-10-04T12:01:00.000Z', authorized_actors: ['MyUncried'],
    activation_registry: '.github/orchestration/v2-activation-registry.json' };
  bootstrap.slice_bootstrap_sha256 = V.canonicalHash(bootstrap);
  transport.slice_bootstrap_sha256 = bootstrap.slice_bootstrap_sha256;
  f.write(chainFile, JSON.stringify(ready.prepared));
  f.write(transport.slice_bootstrap_file, JSON.stringify(bootstrap));
  f.write(bootstrap.activation_registry, JSON.stringify({ schema_version: 'kodjo.protocol.v2.activation-registry.0.6.12',
    activations: [{ slice_id: bootstrap.slice_id, status: 'ACTIVE', issue_number: 999,
      baseline_head: bootstrap.baseline_head, bootstrap_path: transport.slice_bootstrap_file,
      slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256 }] }));
  for (const file of Object.values(ready.compatibility_files)) f.write(file.path, file.content);
  f.git('add','.'); f.git('commit','-m','fixture exact reviewed revision transport');
  const head = f.git('rev-parse','HEAD');
  const target = Chain.approvalTarget(ready.prepared, { cwd: f.cwd, protocolHead: head, github: f.github });
  const github = { comment: (repo,id) => id === '12345' || id === 12345
    ? { id: 12345, issue_url: 'https://api.github.com/repos/MyUncried/Application-Routine/issues/999',
      updated_at: '2026-10-04T12:02:00.000Z', body: head + '\n' + Approval.renderApprovalMessage(target) }
    : f.github.comment(repo,id),
    reactions: () => [{ id: 67890, content: '+1', user: { login: 'MyUncried' }, created_at: '2026-10-04T12:03:00.000Z' }],
    pullRequest: f.github.pullRequest };
  const seed = { slice_id: bootstrap.slice_id, issue_number: 999, source_head: head,
    slice_bootstrap_file: transport.slice_bootstrap_file, slice_bootstrap_sha256: transport.slice_bootstrap_sha256,
    authorized_plan: { plan_path: transport.plan_path }, independent_review: { review_path: transport.review_path },
    prompt_file: transport.prompt_file, user_gate: { gate_ref: transport.gate_ref },
    request_id: transport.request_id, created_at: transport.created_at };
  const derived = Chain.deriveQueue(seed, { cwd: f.cwd, github });
  const external = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-plan-read-view-'));
  fs.writeFileSync(path.join(external,'queue.json'), JSON.stringify(derived.projection.legacy_queue_request));
  const admitted = Chain.admit(path.join(external,'queue.json'), { cwd: f.cwd, github, allowExternalQueueFile: true });
  f.git('checkout','-q',f.baseline.delivery.head);
  const original = fs.readFileSync(path.join(f.cwd,transport.plan_path));
  const missionBytes = Buffer.from(admitted.projection.compatibility_files.mission.content);
  return { ...f, github, ready, admitted, transport, head, original, missionBytes, external,
    runDir: () => fs.mkdtempSync(path.join(external,'attempt-')),
    cleanup: () => { f.cleanup(); fs.rmSync(external,{recursive:true,force:true}); } };
}

test('approved revised plan transmission on an existing application PR', async t => {
  const f = fixture(); t.after(() => f.cleanup());
  let handle;
  t.after(() => { if (handle && handle.identity.state !== 'RESTORED') PlanView.restore(handle); });
  const args = { cwd: f.cwd, missionBytes: f.missionBytes };
  const planFile = path.join(f.cwd,f.transport.plan_path);
  await t.test('existing PR routing and missing local mission retain the exact approved plan authority', () => {
    const queue=f.admitted.projection.legacy_queue_request;
    assert.equal(queue.delivery_target.application_head,f.baseline.delivery.head);
    const raw=require('../../scripts/kodjo/lib/queue-request').projectQueueRequest(queue);
    assert.equal(raw.source_head,f.baseline.delivery.head);assert.equal(raw.protocol_source_head,f.head);
    assert.equal(fs.existsSync(path.join(f.cwd,f.transport.prompt_file)),false);
    const local=require('../../scripts/kodjo/lib/claude-local').normalizeRequest(raw,f.cwd,f.admitted);
    assert.equal(local.delivery_target.application_pr,9999);assert.equal(local.source_head,f.baseline.delivery.head);
    assert.equal(f.admitted.approvalTarget.execution_core.execution_context.delivery_target.application_pr,9999);
    const pr=f.github.pullRequest();
    assert.throws(()=>Chain.approvalTarget(f.ready.prepared,{cwd:f.cwd,protocolHead:f.head,
      github:{...f.github,pullRequest:()=>({...pr,head:{...pr.head,sha:'f'.repeat(40)}})}}),/DELIVERY_TARGET_STALE/);
    assert.throws(()=>Chain.approvalTarget(f.ready.prepared,{cwd:f.cwd,protocolHead:f.head,
      github:{...f.github,pullRequest:()=>({...pr,state:'closed'})}}),/DELIVERY_TARGET_STALE/);
  });
  await t.test('new exact plan is supplied at the old path; repeated filesystem and Git reads use the approved bytes', () => {
    const expected = Buffer.from(f.admitted.projection.compatibility_files.plan.content);
    assert.notDeepEqual(f.original,expected);
    const runDir = f.runDir(); fs.copyFileSync(GitRead,path.join(runDir,'kodjo-git-read.js'));
    handle = PlanView.install(f.admitted,{...args,runDir});
    assert.deepEqual(fs.readFileSync(planFile),expected); PlanView.assertView(handle);
    const env = { ...process.env,...PlanView.environment(handle) };
    for (const reference of ['HEAD:' + f.transport.plan_path,'HEAD:./' + f.transport.plan_path,handle.identity.original_blob_oid]) {
      const read = spawnSync(process.execPath,[path.join(runDir,'kodjo-git-read.js'),'show',reference],
        { cwd:f.cwd,env,encoding:'utf8',windowsHide:true });
      assert.equal(read.status,0,read.stderr); assert.equal(read.stdout,expected.toString('utf8'));
    }
    const proof = fs.readFileSync(path.join(runDir,'vnext-plan-reads.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(proof.length,3); assert.ok(proof.every(row => row.blob_oid === f.admitted.projection.legacy_queue_request.authorized_plan.plan_blob_oid));
    assert.equal(f.admitted.projection.legacy_queue_request.independent_review.reviewed_plan_blob_oid,proof[0].blob_oid);
    PlanView.restore(handle); assert.deepEqual(fs.readFileSync(planFile),f.original);
    assert.equal(f.git('status','--porcelain','--untracked-files=all'),'');
  });
  await t.test('a supplied plan or mission different from the admitted identity stops before application writes', () => {
    const bad = structuredClone(f.admitted); bad.projection.compatibility_files.plan.content += '\nforged';
    assert.throws(() => PlanView.install(bad,{...args,runDir:f.runDir()}),/HASH_MISMATCH|HASH_INVALID|BLOB_MISMATCH/);
    assert.throws(() => PlanView.install(f.admitted,{...args,missionBytes:Buffer.from('different mission'),runDir:f.runDir()}),/MISSION_MISMATCH/);
    assert.deepEqual(fs.readFileSync(planFile),f.original); assert.equal(f.git('status','--porcelain'),'');
  });
  await t.test('unavailable approved plan stops without falling back to the readable old plan', () => {
    const unavailable = structuredClone(f.admitted);
    unavailable.executionRequest.protocol_head = 'f'.repeat(40);
    assert.throws(() => PlanView.install(unavailable,{...args,runDir:f.runDir()}),/ADMISSION_MISMATCH/);
    // Delete only the approved commit object in this temporary repository.
    const object = path.join(f.cwd,'.git','objects',f.head.slice(0,2),f.head.slice(2));
    const saved = fs.readFileSync(object); fs.unlinkSync(object);
    try { assert.throws(() => PlanView.install(f.admitted,{...args,runDir:f.runDir()}),/APPROVED_FILE_UNAVAILABLE/); }
    finally { fs.writeFileSync(object,saved); }
    assert.deepEqual(fs.readFileSync(planFile),f.original);
  });
  await t.test('interrupted view recovery preserves existing application work; installation and execution lock cannot be duplicated', () => {
    const application = path.join(f.cwd,'src/core.js'); fs.writeFileSync(application,'module.exports={value:2};\n');
    const work = fs.readFileSync(application),runDir=f.runDir();
    const lockPath=path.join(f.external,'execution.lock');
    const identity={run_id:'fixture-plan-recovery',request_id:f.transport.request_id,session_id:'fixture'};
    const inspect=()=>({state:'ALIVE',started_at:'fixture-owner'}), scan=()=>({state:'NONE'});
    const lock=Lock.acquire(lockPath,identity,inspect,scan);
    try {
      handle=PlanView.install(f.admitted,{...args,runDir});
      assert.throws(()=>PlanView.install(f.admitted,{...args,runDir}),/EEXIST/);
      assert.throws(()=>Lock.acquire(lockPath,identity,inspect,scan),/ALREADY_ACTIVE/);
      // Explicit crash-journal reconciliation, still under the same owned lock.
      assert.throws(()=>PlanView.recover(handle.journalFile,{cwd:f.cwd}),/ADMISSION_REQUIRED/);
      handle=PlanView.recover(handle.journalFile,{...args,admitted:f.admitted});
      assert.deepEqual(fs.readFileSync(application),work);assert.deepEqual(fs.readFileSync(planFile),f.original);
      const second=PlanView.install(f.admitted,{...args,runDir:f.runDir()});PlanView.restore(second);
      assert.deepEqual(fs.readFileSync(application),work);assert.deepEqual(fs.readFileSync(planFile),f.original);
      assert.equal(f.git('diff','--name-only'),'src/core.js');
      // Same durable consumption namespace as the actual runner, backed here
      // by real local Git tags. A restored read view grants no second execution.
      const {consume}=require('../../scripts/kodjo/consume-queue-request');
      const api=require('./helpers/consumption-git-api').adapter(f.cwd);
      const receipt={repository:'MyUncried/Application-Routine',request_id:f.transport.request_id,
        queue_commit:f.head,queue_blob_oid:f.admitted.projection.contract_hash.slice(0,40),run_id:'1001',run_attempt:'1'};
      consume(receipt,api);
      assert.throws(()=>consume({...receipt,run_id:'1002'},api),/CONSUMED_REFUSED/);
    } finally { Lock.release(lock); }
  });
  await t.test('tampered view is refused, its evidence is retained and the old file is restored', () => {
    handle=PlanView.install(f.admitted,{...args,runDir:f.runDir()});fs.chmodSync(planFile,0o600);fs.writeFileSync(planFile,'tampered');
    assert.throws(()=>PlanView.assertView(handle),/VIEW_CHANGED/);
    assert.throws(()=>PlanView.restore(handle),/VIEW_CHANGED/);
    assert.equal(handle.identity.state,'RESTORED');assert.deepEqual(fs.readFileSync(planFile),f.original);
    assert.equal(fs.readFileSync(path.join(path.dirname(handle.journalFile),'vnext-tampered-plan.bin'),'utf8'),'tampered');
  });
});
