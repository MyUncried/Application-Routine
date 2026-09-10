#!/usr/bin/env node
'use strict';

/**
 * Bounded implementation / targeted-correction adapter launcher.
 *
 * KODJO V2 §4.1 (`claude-adapter`), §10.2 and §1.2-A.
 *
 * An adapter is selected by IDENTIFIER from a fixed registry of scripts owned by
 * this repository, and is launched with `shell: false` and structured
 * arguments. No arbitrary command string is ever executed: a shell command
 * would escape the guarded git runner of lib/git.js and could create a commit
 * or move a reference directly, which is exactly what the protocol forbids.
 *
 * Usage: node scripts/kodjo/run-implementation-agent.js <deliveryDir>
 *
 * Environment:
 *   KODJO_AGENT_ADAPTER        adapter id (default: "none")
 *   KODJO_MODE                 IMPLEMENT | TARGETED_FIX
 *   KODJO_FAILED_CHECKS        checks to correct, for TARGETED_FIX
 *   KODJO_ALLOW_TEST_ADAPTER   "1" enables the `test:` adapters, local tests only
 *
 * Outputs (GITHUB_OUTPUT when available): session_id, agent_status, adapter.
 *
 * Adapter status contract (MIN-01, revue 0.6.4 / contre-analyse 0.6.5).
 *
 * The NORMATIVE contract is structured: the adapter declares its issue in
 * <deliveryDir>/adapter-status.json, e.g. {"status":"CLARIFICATION_REQUIRED",
 * "question_id":"...","question":"..."}. Accepted statuses are COMPLETED,
 * CLARIFICATION_REQUIRED and INTERRUPTED.
 *
 * Exit codes are only THIS pilot's binding, used when no structured status is
 * declared: 0 -> COMPLETED, 75 -> CLARIFICATION_REQUIRED, 78 -> NO_ADAPTER
 * (missing precondition), anything else -> INTERRUPTED. An adapter is free to
 * use the structured file instead; the exit code is not an architectural
 * obligation.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { writeJson } = require('./lib/json');
const { info, fail } = require('./lib/log');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Production registry. Every entry is a script tracked in this repository.
 * Adding an entry is a reviewable change, unlike an environment variable.
 */
const ADAPTERS = {
  none: path.join('scripts', 'kodjo', 'adapters', 'no-remote-agent.js'),
};

/** Test adapters live here and are refused unless explicitly enabled. */
const TEST_ADAPTER_ROOT = path.join('tests', 'kodjo', 'adapters');

function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  fs.appendFileSync(file, name + '=' + (value === null || value === undefined ? '' : String(value)) + '\n', 'utf8');
}

/**
 * Resolve an adapter id to an in-repo script path, or throw.
 * @returns {{id:string, script:string, test:boolean}}
 */
function resolveAdapter(id, env) {
  const key = String(id || 'none').trim();

  if (Object.prototype.hasOwnProperty.call(ADAPTERS, key)) {
    return { id: key, script: path.join(REPO_ROOT, ADAPTERS[key]), test: false };
  }

  if (key.startsWith('test:')) {
    if (env.KODJO_ALLOW_TEST_ADAPTER !== '1') {
      const err = new Error(
        'TEST_ADAPTER_NOT_ENABLED: adapter "' + key + '" requires KODJO_ALLOW_TEST_ADAPTER=1 and is reserved ' +
          'for local tests. The workflow never sets that flag.'
      );
      err.code = 'TEST_ADAPTER_NOT_ENABLED';
      throw err;
    }
    const name = key.slice('test:'.length);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      const err = new Error('TEST_ADAPTER_NAME_INVALID: "' + name + '"');
      err.code = 'TEST_ADAPTER_NAME_INVALID';
      throw err;
    }
    const root = path.join(REPO_ROOT, TEST_ADAPTER_ROOT);
    const script = path.resolve(root, name + '.js');
    if (script !== path.join(root, name + '.js') || !script.startsWith(root + path.sep)) {
      const err = new Error('TEST_ADAPTER_PATH_ESCAPE: ' + key);
      err.code = 'TEST_ADAPTER_PATH_ESCAPE';
      throw err;
    }
    if (!fs.existsSync(script)) {
      const err = new Error('TEST_ADAPTER_NOT_FOUND: ' + path.relative(REPO_ROOT, script));
      err.code = 'TEST_ADAPTER_NOT_FOUND';
      throw err;
    }
    return { id: key, script: script, test: true };
  }

  const err = new Error(
    'AGENT_ADAPTER_NOT_ALLOWED: "' + key + '" is not a registered adapter. Allowed ids: ' +
      Object.keys(ADAPTERS).join(', ') + '. An arbitrary command is never executed.'
  );
  err.code = 'AGENT_ADAPTER_NOT_ALLOWED';
  throw err;
}

function main() {
  const env = process.env;
  const deliveryDir = path.resolve(process.argv[2] || env.KODJO_DELIVERY_DIR || 'delivery');
  const mode = (env.KODJO_MODE || 'IMPLEMENT').toUpperCase();
  const sessionId = env.KODJO_SESSION_ID || '';
  const repoDir = path.resolve(env.KODJO_REPO_DIR || process.cwd());

  setOutput('session_id', sessionId);

  // An arbitrary command is refused loudly rather than ignored silently.
  if (env.KODJO_AGENT_CMD && env.KODJO_AGENT_CMD.trim()) {
    setOutput('agent_status', 'REFUSED');
    setOutput('adapter', '');
    fail(
      'AGENT_COMMAND_NOT_ALLOWED',
      'KODJO_AGENT_CMD is set. Arbitrary adapter commands are forbidden: they would bypass the guarded ' +
        'git runner. Use KODJO_AGENT_ADAPTER with a registered adapter id.'
    );
    return 78;
  }

  let adapter;
  try {
    adapter = resolveAdapter(env.KODJO_AGENT_ADAPTER, env);
  } catch (err) {
    setOutput('agent_status', 'REFUSED');
    setOutput('adapter', '');
    fail(err.code || 'AGENT_ADAPTER_NOT_ALLOWED', err.message);
    return 78;
  }

  setOutput('adapter', adapter.id);

  // Structured arguments — no shell, no interpolation, no command string.
  const args = [
    adapter.script,
    '--mode',
    mode,
    '--repo-dir',
    repoDir,
    '--delivery-dir',
    deliveryDir,
    '--slice-id',
    env.KODJO_SLICE_ID || '',
    '--source-head',
    env.KODJO_SOURCE_HEAD || '',
    '--failed-checks',
    env.KODJO_FAILED_CHECKS || '',
  ];

  info('running adapter "' + adapter.id + '" in mode ' + mode + ' (shell: false)');
  const res = spawnSync(process.execPath, args, {
    cwd: repoDir,
    env: process.env,
    shell: false,
    stdio: 'inherit',
    windowsHide: true,
  });

  fs.mkdirSync(deliveryDir, { recursive: true });
  const record = {
    ran_at: new Date().toISOString(),
    adapter: adapter.id,
    adapter_script: path.relative(REPO_ROOT, adapter.script).replace(/\\/g, '/'),
    test_adapter: adapter.test,
    shell: false,
    mode: mode,
    exit_code: res.error ? null : res.status,
    error: res.error ? res.error.message : null,
  };

  if (res.error) {
    record.status = 'ADAPTER_SPAWN_FAILED';
    writeJson(path.join(deliveryDir, 'adapter.json'), record);
    setOutput('agent_status', 'ADAPTER_SPAWN_FAILED');
    fail('AGENT_ADAPTER_SPAWN_FAILED', res.error.message);
    return 78;
  }

  // Structured declaration wins over the exit-code binding.
  const DECLARABLE = ['COMPLETED', 'CLARIFICATION_REQUIRED', 'INTERRUPTED'];
  let declared = null;
  try {
    const raw = fs.readFileSync(path.join(deliveryDir, 'adapter-status.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const candidate = String(parsed && parsed.status ? parsed.status : '').trim().toUpperCase();
    if (DECLARABLE.includes(candidate)) {
      declared = candidate;
      record.declared_status = parsed;
    } else if (candidate) {
      record.declared_status_rejected = candidate;
      info('adapter declared an unknown status "' + candidate + '": falling back to the exit-code binding');
    }
  } catch (err) {
    // No structured declaration, or an unreadable one: the exit code decides.
  }

  if (declared) {
    record.status = declared;
    record.status_origin = 'ADAPTER_STATUS_FILE';
    writeJson(path.join(deliveryDir, 'adapter.json'), record);
    setOutput('agent_status', declared);
    info('adapter declared status ' + declared + ' (structured contract)');
    return declared === 'COMPLETED' ? 0 : 1;
  }
  record.status_origin = 'EXIT_CODE_BINDING';

  // 75 = the adapter stopped on an attested functional ambiguity (§5.2-A).
  // The delta already produced is preserved by the next step, unchanged.
  if (res.status === 75) {
    record.status = 'CLARIFICATION_REQUIRED';
    writeJson(path.join(deliveryDir, 'adapter.json'), record);
    setOutput('agent_status', 'CLARIFICATION_REQUIRED');
    info('adapter reported a functional ambiguity (exit 75): preservation continues');
    return 1;
  }

  if (res.status === 78) {
    record.status = 'NO_ADAPTER';
    writeJson(path.join(deliveryDir, 'adapter.json'), record);
    setOutput('agent_status', 'NO_ADAPTER');
    info('adapter reported a missing precondition (exit 78)');
    return 78;
  }

  record.status = res.status === 0 ? 'COMPLETED' : 'INTERRUPTED';
  writeJson(path.join(deliveryDir, 'adapter.json'), record);
  setOutput('agent_status', record.status);
  info('adapter exited with code ' + res.status);
  // A non-zero adapter exit must NOT prevent preservation: the next step runs
  // with `if: always()` and any produced delta is conserved.
  return res.status === 0 ? 0 : 1;
}

if (require.main === module) process.exit(main());

module.exports = { resolveAdapter, ADAPTERS, TEST_ADAPTER_ROOT };
