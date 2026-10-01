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
