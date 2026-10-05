'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const Q = require('../../scripts/kodjo/lib/vnext-github-qualification');
const P = require('../../scripts/kodjo/lib/vnext-publication');
const E = require('../../scripts/kodjo/lib/vnext-error-policy');
const ROOT = path.resolve(__dirname, '../..');
const head = 'a'.repeat(40), repository = 'MyUncried/Application-Routine';
function qualification() {
  const run = { id: 42, repository: { full_name: repository }, head_sha: head, path: Q.WORKFLOW,
    event: 'pull_request', status: 'completed', conclusion: 'success', run_attempt: 2 };
  const jobs = Q.JOBS.map((name, index) => ({ id: index + 1, name, head_sha: head, status: 'completed', conclusion: 'success' }));
  return { run, jobs, read: endpoint => endpoint.endsWith('/42') ? run : { jobs } };
}
test('qualification admission refuses stale, incomplete, failed or wrong workflow evidence', () => {
  const f = qualification();
  assert.equal(Q.verifyQualification({ repository, head, runId: 42, read: f.read }).status, 'VERIFIED');
  for (const patch of [{ head_sha: 'b'.repeat(40) }, { status: 'in_progress' }, { conclusion: 'failure' }, { path: 'other.yml' }, { repository: { full_name: 'Other/Repo' } }]) {
    assert.throws(() => Q.verifyQualification({ repository, head, runId: 42, read: endpoint => endpoint.endsWith('/42') ? { ...f.run, ...patch } : { jobs: f.jobs } }), /RUN_NOT_VERIFIED/);
  }
  for (const jobs of [f.jobs.slice(1), f.jobs.map((j, i) => i ? j : { ...j, conclusion: 'failure' }), f.jobs.map((j, i) => i ? j : { ...j, head_sha: 'b'.repeat(40) }), [...f.jobs, f.jobs[0]]]) {
    assert.throws(() => Q.verifyQualification({ repository, head, runId: 42, read: endpoint => endpoint.endsWith('/42') ? f.run : { jobs } }), /JOB_NOT_VERIFIED/);
  }
  assert.throws(() => Q.verifyQualification({ repository, head, read: f.read }), /RUN_REQUIRED/);
});
test('dedicated branch qualification preserves exact-head and every-job admission gates', () => {
  const f = qualification();
  f.run.event = 'create'; f.run.head_branch = 'qualification/vnext-task2-admission-20261006';
  assert.equal(Q.verifyQualification({ repository, head, runId: 42, read: f.read }).status, 'VERIFIED');
  for (const patch of [{ head_branch: 'main' }, { head_branch: 'feature/test' }, { head_branch: null },
    { event: 'workflow_dispatch' }, { head_sha: 'b'.repeat(40) }, { conclusion: 'failure' }]) {
    assert.throws(() => Q.verifyQualification({ repository, head, runId: 42,
      read: endpoint => endpoint.endsWith('/42') ? { ...f.run, ...patch } : { jobs: f.jobs } }), /RUN_NOT_VERIFIED/);
  }
  for (const jobs of [f.jobs.slice(1), f.jobs.map((j,i) => i ? j : { ...j, conclusion: 'skipped' }),
    f.jobs.map((j,i) => i ? j : { ...j, head_sha: 'b'.repeat(40) }), [...f.jobs, f.jobs[0]]]) {
    assert.throws(() => Q.verifyQualification({ repository, head, runId: 42,
      read: endpoint => endpoint.endsWith('/42') ? f.run : { jobs } }), /JOB_NOT_VERIFIED/);
  }
});
test('publication admission refuses a moved parent, checkpoint or active phase including later API pages', () => {
  const branch = 'protocol/test', checkpointSha = 'c'.repeat(40);
  const state = { repository, branch, controller_generation: 18, active_runs: [] };
  const file = { sha: checkpointSha, encoding: 'base64', content: Buffer.from(JSON.stringify(state)).toString('base64') };
  const read = endpoint => {
    if (endpoint.includes('/git/ref/')) { assert.ok(endpoint.endsWith('/protocol/test')); return { object: { sha: head } }; }
    return endpoint.includes('/contents/') ? file : { workflow_runs: [] };
  };
  const args = { repository, branch, expectedParent: head, checkpointSha, read };
  assert.equal(P.verifyWindow(args).expected_parent, head);
  assert.throws(() => P.verifyWindow({ ...args, expectedParent: 'b'.repeat(40) }), /PARENT_MOVED/);
  assert.throws(() => P.verifyWindow({ ...args, checkpointSha: 'd'.repeat(40) }), /CHECKPOINT_MOVED/);
  assert.throws(() => P.verifyWindow({ ...args, read: endpoint => endpoint.includes('/actions/runs')
    ? { workflow_runs: endpoint.endsWith('&page=1') ? Array.from({ length: 100 }, () => ({ path: 'other.yml', status: 'completed' })) : [{ path: Q.WORKFLOW, status: 'queued' }] } : read(endpoint) }), /PHASE_ACTIVE/);
  assert.throws(() => P.verifyWindow({ ...args, read: endpoint => endpoint.includes('/actions/runs')
    ? { workflow_runs: [{ path: '.github/workflows/kodjo-vnext-performance.yml', status: 'in_progress' }] } : read(endpoint) }), /PHASE_ACTIVE/);
});
function candidate(t, file, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'publication-index-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const env = { ...process.env, GIT_INDEX_FILE: path.join(dir, 'index') };
  const git = (args, input) => execFileSync('git', args, { cwd: ROOT, env, input, encoding: 'utf8', windowsHide: true }).trim();
  const parent = git(['rev-parse', 'HEAD']);
  git(['read-tree', parent]);
  const sha = git(['hash-object', '-w', '--stdin'], content);
  git(['update-index', '--add', '--cacheinfo', '100644,' + sha + ',' + file]);
  return { cwd: ROOT, expectedParent: parent, candidateTree: git(['write-tree']) };
}
test('prepublication validation refuses malformed workflow bytes before publication', t => {
  assert.throws(() => P.validateTree(candidate(t, '.github/workflows/broken.yml', 'name: test\non: [unterminated\n')), /Command failed/);
  assert.throws(() => P.validateTree(candidate(t, '.github/workflows/broken.yaml', 'name: test\non: [unterminated\n')), /Command failed/);
});
test('prepublication validation refuses exact writer blob drift', t => {
  const file = '.github/workflows/kodjo-vnext12-disposable.yml';
  const text = execFileSync('git', ['show', 'HEAD:' + file], { cwd: ROOT, encoding: 'utf8' });
  assert.throws(() => P.validateTree(candidate(t, file, text + '\n')), /WRITER_POLICY_INVALID/);
});
test('prepublication validation refuses stale historical test correspondence', t => {
  const file = 'tests/kodjo/incident-register.pilot.js';
  const text = execFileSync('git', ['show', 'HEAD:' + file], { cwd: ROOT, encoding: 'utf8' });
  assert.throws(() => P.validateTree(candidate(t, file, text + '\n')), /CASE_SOURCE_CHANGED/);
});
test('environmental and unknown failures request technical diagnosis without automatic retry', () => {
  for (const diagnostic of ['RUNNER_OFFLINE', 'RUNNER_COMMUNICATION_LOST', 'GITHUB_UNAVAILABLE', 'GITHUB_RATE_LIMITED', 'HISTORICAL_RECOVERY_ARTIFACT_UNAVAILABLE', 'UNKNOWN']) {
    const result = E.classify({ diagnostic });
    assert.equal(result.category, 'RESIDUAL_AUTOCORRECTABLE'); assert.equal(result.auto_retry, false);
  }
  assert.equal(E.classify({ diagnostic: 'PRODUCT_AMBIGUITY' }).category, 'HUMAN_DECISION_REQUIRED');
});
test('changed PowerShell must be parsed and invalid or unavailable parsing refuses publication', t => {
  assert.throws(() => P.validateTree(candidate(t, 'scripts/kodjo/publication-invalid.ps1', 'function Broken {\n')), /POWERSHELL_VALIDATION_REQUIRED/);
});
test('execution qualification binds a separately changed controller and refuses missing controller proof', t => {
  const approved = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const tree = candidate(t, 'scripts/kodjo/qualification-marker.js', '// distinct controller fixture only\n').candidateTree;
  const controller = execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=test@example.test',
    'commit-tree', tree, '-p', approved, '-m', 'Unit fixture only; no remote publication'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const f = qualification(); f.run.head_sha = approved; f.jobs.forEach(job => { job.head_sha = approved; });
  assert.equal(Q.verifyExecutionQualifications({ approved_protocol_head: approved, qualification_run_id: 42 },
    { cwd: ROOT, controllerHead: approved, read: f.read }).controller.relation, 'EXACT_SAME_PROTOCOL_CODE');
  assert.throws(() => Q.verifyExecutionQualifications({ approved_protocol_head: approved, qualification_run_id: 42 },
    { cwd: ROOT, controllerHead: controller, read: f.read }), /RUN_REQUIRED/);
});
