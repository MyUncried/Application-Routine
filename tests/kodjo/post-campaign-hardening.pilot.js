'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const Local = require('../../scripts/kodjo/run-local-claude');
const { parse } = require('../../scripts/kodjo/lib/yaml');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('foreground checks: actual child inherits bounded settings over conflicting parent values', () => {
  const inherited = { ...process.env, CLAUDE_CODE_DISABLE_BACKGROUND_TASKS: '0',
    BASH_DEFAULT_TIMEOUT_MS: '1', BASH_MAX_TIMEOUT_MS: '2' };
  const env = Local.claudeEnvironment(inherited, ['only.js']);
  const child = spawnSync(process.execPath, ['-e',
    'console.log(JSON.stringify(Object.fromEntries(["CLAUDE_CODE_DISABLE_BACKGROUND_TASKS","BASH_DEFAULT_TIMEOUT_MS","BASH_MAX_TIMEOUT_MS","KODJO_MUTATION_SCOPE_JSON"].map(k=>[k,process.env[k]]))))'],
  { env, encoding: 'utf8', windowsHide: true });
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), { CLAUDE_CODE_DISABLE_BACKGROUND_TASKS: '1',
    BASH_DEFAULT_TIMEOUT_MS: '900000', BASH_MAX_TIMEOUT_MS: '900000',
    KODJO_MUTATION_SCOPE_JSON: '["only.js"]' });
  assert.equal(inherited.BASH_DEFAULT_TIMEOUT_MS, '1');
});

test('foreground checks: settings and journal contain only the same three non-secret launch values', () => {
  const settings = Local.claudeSettings();
  assert.equal(settings.disableAllHooks, true);
  assert.deepEqual(settings.env, Local.CLAUDE_FOREGROUND_CHECK_ENV);
  settings.env.BASH_DEFAULT_TIMEOUT_MS = '1';
  assert.equal(Local.claudeSettings().env.BASH_DEFAULT_TIMEOUT_MS, '900000');
  const source = read('scripts/kodjo/run-local-claude.js');
  assert.match(source, /foreground_check_environment: \{ \.\.\.CLAUDE_FOREGROUND_CHECK_ENV \}/);
  assert.match(source, /JSON\.stringify\(claudeSettings\(\)\)/);
  assert.match(source, /claudeEnvironment\(process\.env, request\.scope_allow\)/);
  assert.match(read('scripts/kodjo/lib/claude-local.js'), /'--settings', path\.join\(configDir, 'settings\.json'\)/);
});

test('source snapshots: both actual workflow guards skip PRs and require explicit dispatch opt-in', () => {
  const w = parse(read('.github/workflows/kodjo-v2-pilot-tests.yml'));
  assert.equal(w.on.workflow_dispatch.inputs.preserve_complete_source.default, false);
  const steps = w.jobs.protocol.steps.filter(s => /complete source snapshot/.test(s.name || ''));
  assert.equal(steps.length, 2);
  for (const step of steps) {
    assert.equal(step.if, "github.event_name == 'workflow_dispatch' && inputs.preserve_complete_source == true");
    const evaluate = (event, optedIn) => Function('github', 'inputs', 'return ' + step.if)({ event_name: event }, { preserve_complete_source: optedIn });
    assert.equal(evaluate('pull_request', true), false);
    assert.equal(evaluate('workflow_dispatch', false), false);
    assert.equal(evaluate('workflow_dispatch', true), true);
  }
  assert.match(steps[0].run, /git rev-parse HEAD/);
  assert.match(steps[0].run, /sha256sum/);
  assert.equal(steps[1].with['if-no-files-found'], 'error');
});

test('Routine Dev dispatch: exact run/attempt is bound to concurrency and shell environment', () => {
  const w = parse(read('.github/workflows/kodjo-routine-dev-environment-sync.yml'));
  for (const key of ['review_run_id', 'review_run_attempt']) {
    assert.equal(w.on.workflow_dispatch.inputs[key].required, true);
    assert.equal(w.on.workflow_dispatch.inputs[key].type, 'string');
  }
  for (const value of [w['run-name'], w.concurrency.group]) {
    assert.match(value, /inputs\.review_run_id \|\| github\.event\.workflow_run\.id/);
    assert.match(value, /inputs\.review_run_attempt \|\| github\.event\.workflow_run\.run_attempt/);
  }
  const resolve = w.jobs.sync.steps.find(s => s.id === 'delivery');
  assert.match(resolve.run, /"\$REVIEW_RUN_ID" "\$REVIEW_RUN_ATTEMPT"/);
  assert.doesNotMatch(resolve.run, /\$\{\{ inputs\./);
  assert.match(w.jobs.sync.env.REVIEW_RUN_ID, /inputs\.review_run_id/);
  assert.match(w.jobs.sync.if, /workflow_dispatch/);
  assert.equal(w.permissions.contents, 'read');
  assert.equal(w.permissions.issues, 'read');
});

test('Routine Dev dispatch: malformed IDs fail before any GitHub lookup or publication', () => {
  const bin = path.join(root, 'scripts/kodjo/resolve-review-run-environment-sync.js');
  for (const [run, attempt] of [['12;echo unsafe', '1'], ['123', '0'], ['123', '1;echo unsafe'], ['', '1']]) {
    const result = spawnSync(process.execPath, [bin, 'o/r', run, attempt, 'unused.json'], { encoding: 'utf8', windowsHide: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ENV_SYNC_REVIEW_RUN_INPUT_INVALID/);
    assert.doesNotMatch(result.stderr, /GITHUB_READ_FAILED/);
  }
});
