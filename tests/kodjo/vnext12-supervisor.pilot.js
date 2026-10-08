'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const S = require('../../scripts/kodjo/execute-vnext12');
const config = { stage: 'EXECUTE_INITIAL', slice_id: 'VNEXT-12-QUALIF',
  approved_protocol_head: S.APPROVED_HEAD, gate_ref: S.GATE, approval_target_hash: S.TARGET_HASH,
  revision_limit: 1, pre1_in_scope: false, final_audit_authorized: false };
test('disposable supervisor refuses a moved approval or unauthorized stage before runtime', () => {
  assert.equal(S.validateConfig(config), config);
  for (const changed of [{ approved_protocol_head: '0'.repeat(40) }, { gate_ref: 'issue_comment:1' },
    { approval_target_hash: '0'.repeat(64) }, { stage: 'EXECUTE_FINAL' }, { pre1_in_scope: true },
    { final_audit_authorized: true }, { revision_limit: 2 }]) {
    assert.throws(() => S.validateConfig({ ...config, ...changed }), /EXECUTION_CONFIG_REFUSED/);
  }
});
test('disposable supervisor rejects remote publishing origins', () => {
  assert.equal(S.localOrigin(path.resolve('origin.git')), path.resolve('origin.git'));
  for (const remote of ['https://github.com/MyUncried/Application-Routine', 'git@github.com:repo.git', 'ssh://github.com/repo', 'relative.git']) {
    assert.throws(() => S.localOrigin(remote), /REMOTE_ORIGIN_FORBIDDEN/);
  }
});
test('revision execution uses a new exact approval and requires the admitted one-correction proof', () => {
  const revision = { ...config, stage: 'EXECUTE_REVISION', approved_protocol_head: 'a'.repeat(40),
    gate_ref: 'issue_comment:12345', approval_target_hash: 'b'.repeat(64) };
  assert.equal(S.validateConfig(revision), revision);
  assert.throws(() => S.validateConfig({ ...revision, approved_protocol_head: S.APPROVED_HEAD }), /CONFIG_REFUSED/);
  assert.throws(() => S.validateConfig({ ...revision, approval_target_hash: S.TARGET_HASH }), /CONFIG_REFUSED/);
  const a = { planningEnvelope: { planning_mode: 'REVISION' }, cumulativeRegister: { revision_count: 1, revision_limit: 1 }, revisionArtifacts: { revision_outcome: { status: 'RESOLVED' } } };
  S.validateAdmittedRevision(a);
  for (const altered of [{ ...a, planningEnvelope: { planning_mode: 'INITIAL' } }, { ...a, revisionArtifacts: null },
    { ...a, cumulativeRegister: { revision_count: 2, revision_limit: 2 } }]) {
    assert.throws(() => S.validateAdmittedRevision(altered), /REAL_BOUNDED_REVISION_REQUIRED/);
  }
});
test('disposable supervisor requires the two actual expected changes and no neighboring change', () => {
  S.validateDelta([S.CORE, S.TEST]);
  assert.throws(() => S.validateDelta([S.CORE]), /EXACT_DELTA_REQUIRED/);
  assert.throws(() => S.validateDelta([S.CORE, S.TEST, 'scripts/kodjo/fixtures/vnext12/keep.js']), /EXACT_DELTA_REQUIRED/);
});
test('disposable clone preserves actual Git bytes despite global Windows autocrlf=true', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext12-clone-'));
  try {
    const source = path.join(root, 'source'), work = path.join(root, 'work');
    fs.mkdirSync(source);
    const config = path.join(root, 'global.gitconfig');
    fs.writeFileSync(config, '[core]\n autocrlf = true\n');
    const env = { ...process.env, GIT_CONFIG_GLOBAL: config };
    for (const key of Object.keys(env)) if (/^GIT_CONFIG_(COUNT|KEY_\d+|VALUE_\d+)$/.test(key)) delete env[key];
    const git = (cwd, args) => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
    git(source, ['init','-q']);
    git(source, ['config','core.autocrlf','false']);
    git(source, ['config','user.name','Fixture']); git(source, ['config','user.email','fixture@example.invalid']);
    const bytes = Buffer.from('module.exports = 1;\n// exact LF bytes\n');
    fs.writeFileSync(path.join(source, 'core.js'), bytes);
    git(source, ['add','core.js']); git(source, ['commit','-qm','immutable bytes']);
    git(root, S.disposableCloneArgs(source, work));
    git(work, ['config','core.autocrlf','false']);
    assert.deepEqual(fs.readFileSync(path.join(work, 'core.js')), bytes);
    assert.equal(git(work, ['status','--porcelain','--untracked-files=all']).trim(), '');
  } finally { fs.rmSync(root, { recursive: true, force: true, maxRetries: 5 }); }
});
test('consumption uses the verified stored owner credential rather than the Actions token', () => {
  const calls = [];
  const spawn = (bin, args, options) => {
    calls.push({ bin, args, env: options.env });
    if (args[0] === 'auth') {
      assert.equal(options.env.GH_TOKEN, undefined);
      assert.equal(options.env.GITHUB_TOKEN, undefined);
      return { status: 0, stdout: 'owner-credential\n' };
    }
    assert.equal(options.env.GH_TOKEN, 'owner-credential');
    return { status: 0, stdout: args.includes('user') ? 'MyUncried\n' : 'HTTP/2.0 200 OK\nx-oauth-scopes: repo, workflow\n\n{}' };
  };
  assert.deepEqual(S.consumptionCredential({ GH_TOKEN: 'actions-credential', GITHUB_TOKEN: 'actions-credential' }, spawn),
    { token: 'owner-credential', source: 'RUNNER_OWNER_LOGIN' });
  assert.equal(calls.length, 3);
  assert.throws(() => S.consumptionCredential({}, () => ({ status: 1 })), /CREDENTIAL_REQUIRED/);
  assert.throws(() => S.consumptionCredential({}, (bin, args) => ({ status: 0,
    stdout: args[0] === 'auth' ? 'owner-credential' : 'another-owner' })), /OWNER_MISMATCH/);
  assert.throws(() => S.consumptionCredential({}, (bin, args) => ({ status: 0,
    stdout: args[0] === 'auth' ? 'owner-credential' : args.includes('user') ? 'MyUncried' : 'x-oauth-scopes: repo\n' })), /SCOPE_REQUIRED/);
});
test('a configured consumption credential does not fall back to another account', () => {
  const env = { KODJO_VNEXT_CONSUMPTION_TOKEN: 'dedicated-credential', GH_TOKEN: 'actions-credential' };
  const spawn = (bin, args, options) => {
    assert.equal(args[0], 'api');
    assert.equal(options.env.GH_TOKEN, 'dedicated-credential');
    assert.equal(options.env.KODJO_VNEXT_CONSUMPTION_TOKEN, undefined);
    return { status: 0, stdout: 'HTTP/2.0 200 OK\n\n{}' };
  };
  assert.deepEqual(S.consumptionCredential(env, spawn), { token: 'dedicated-credential', source: 'REPOSITORY_SECRET' });
  assert.throws(() => S.consumptionCredential(env, () => ({ status: 1 })), /CREDENTIAL_CHECK_FAILED/);
});
test('a pre-invocation API refusal remains the primary failure rather than an empty delta', () => {
  const actual = { status: 'PRE_INVOCATION', diagnostic: 'RUN_INITIALIZED' };
  assert.match(S.runtimeFailure({ code: 1, output: '[KODJO_V2] LOCAL_ADAPTER_FAILURE: Error: KODJO_CONSUMPTION_API_FAILED: 403\nstack' }, actual), /KODJO_CONSUMPTION_API_FAILED: 403$/);
  assert.match(S.runtimeFailure({ code: 1, output: '' }, actual), /RUN_INITIALIZED$/);
  assert.equal(S.runtimeFailure({ code: 0 }, { status: 'IMPLEMENTED_AND_VERIFIED' }), null);
});
test('runtime evidence copy preserves regular files and excludes a dangling junction without following it', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext12-evidence-'));
  try {
    const source = path.join(root, 'run'), dest = path.join(root, 'evidence');
    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, 'result.json'), '{"claude_invoked":false}\n');
    fs.symlinkSync(path.join(root, 'absent-directory'), path.join(source, 'runtime-link'), 'junction');
    assert.deepEqual(S.preserveRuntime(source, dest), { excluded_non_regular_paths: ['runtime-link'] });
    assert.equal(fs.readFileSync(path.join(dest, 'result.json'), 'utf8'), '{"claude_invoked":false}\n');
    assert.equal(fs.existsSync(path.join(dest, 'runtime-link')), false);
  } finally { fs.rmSync(root, { recursive: true, force: true, maxRetries: 5 }); }
});
