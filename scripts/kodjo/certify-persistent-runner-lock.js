'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const Lock = require('./lib/execution-lock');

function digest(file) {
  if (!fs.existsSync(file)) return { exists: false };
  const bytes = fs.readFileSync(file);
  let format = 'NON_JSON';
  try { JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')); format = 'JSON'; } catch (_) {}
  return { exists: true, size: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), format };
}

function waitForState(expected, attempts = 20) {
  let state;
  for (let i = 0; i < attempts; i += 1) {
    state = Lock.claudeProcessState();
    if (state.state === expected) return state;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }
  return state;
}

function detachedClaudeMarker() {
  const marker = Lock.managedClaudeMarkers()[0] + '\\certification-marker.js';
  const payload = "const {spawn}=require('node:child_process'); const c=spawn(process.execPath,['-e','setTimeout(()=>{},30000)',process.argv[1]],{detached:true,stdio:'ignore'}); c.unref(); process.stdout.write(String(c.pid));";
  const launched = spawnSync(process.execPath, ['-e', payload, marker], { encoding: 'utf8', shell: false, windowsHide: true });
  assert.equal(launched.status, 0, launched.stderr || 'MARKER_LAUNCH_FAILED');
  const pid = Number(String(launched.stdout).trim());
  assert.ok(Number.isInteger(pid) && pid > 0, 'MARKER_PID_INVALID');
  return pid;
}

function main() {
  assert.equal(process.platform, 'win32', 'WINDOWS_REAL_RUNNER_REQUIRED');
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'GITHUB_ACTIONS_REQUIRED');
  assert.match(process.env.RUNNER_NAME || '', /KODJO/i, 'KODJO_PERSISTENT_RUNNER_REQUIRED');

  const output = process.argv[2] || path.join(process.cwd(), 'runner-lock-certification.json');
  const stateRoot = process.env.KODJO_STATE_ROOT ? path.resolve(process.env.KODJO_STATE_ROOT) : path.join(os.homedir(), '.kodjo-v2');
  const lockPath = path.join(stateRoot, 'claude-local.lock');
  const evidence = {
    schema_version: 'kodjo.protocol.v2.runner-lock-certification.0.6.18',
    github_run_id: process.env.GITHUB_RUN_ID || null,
    github_run_attempt: process.env.GITHUB_RUN_ATTEMPT || null,
    runner_name: process.env.RUNNER_NAME || null,
    runner_os: process.env.RUNNER_OS || null,
    powershell: null,
    state_root: stateRoot,
    lock_before: digest(lockPath),
    claude_invoked: false,
    checks: [],
    status: 'FAIL',
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const save = () => fs.writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  try {
    const ps = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.ToString()'], { encoding: 'utf8', shell: false, windowsHide: true });
    assert.equal(ps.status, 0, ps.stderr || 'POWERSHELL_5_1_UNREADABLE');
    evidence.powershell = String(ps.stdout).trim();
    assert.match(evidence.powershell, /^5\.1\./, 'POWERSHELL_5_1_REQUIRED');

    const initial = Lock.claudeProcessState();
    evidence.initial_scan = initial;
    assert.equal(initial.state, 'NONE', 'REAL_CLAUDE_STATE_NOT_PROVEN_NONE');
    evidence.checks.push('REAL_CIM_NO_SELF_MATCH=PASS');

    const handle = Lock.acquire(lockPath, {
      run_id: 'certification-' + process.env.GITHUB_RUN_ID,
      request_id: 'certification-' + process.env.GITHUB_RUN_ID,
      session_id: null,
      github_run_id: process.env.GITHUB_RUN_ID,
      github_run_attempt: process.env.GITHUB_RUN_ATTEMPT,
    });
    evidence.acquire_disposition = handle.disposition;
    evidence.checks.push('PERSISTENT_LOCK_ACQUIRE=PASS');
    assert.equal(Lock.release(handle), true, 'PERSISTENT_LOCK_RELEASE_FAILED');
    assert.equal(fs.existsSync(lockPath), false, 'PERSISTENT_LOCK_REMAINS');
    evidence.checks.push('PERSISTENT_LOCK_RELEASE=PASS');

    let markerPid;
    try {
      markerPid = detachedClaudeMarker();
      evidence.marker_pid = markerPid;
      const active = waitForState('ACTIVE');
      evidence.active_scan = active;
      assert.equal(active.state, 'ACTIVE', 'REAL_ACTIVE_MARKER_NOT_DETECTED');
      fs.writeFileSync(lockPath, '', { flag: 'wx' });
      assert.throws(() => Lock.acquire(lockPath, {
        run_id: 'certification-active-' + process.env.GITHUB_RUN_ID,
        request_id: 'certification-active-' + process.env.GITHUB_RUN_ID,
        github_run_id: process.env.GITHUB_RUN_ID,
        github_run_attempt: process.env.GITHUB_RUN_ATTEMPT,
      }), /LOCK_AMBIGUOUS/);
      assert.equal(fs.existsSync(lockPath), true, 'ACTIVE_LOCK_WAS_DELETED');
      evidence.checks.push('REAL_ACTIVE_PROCESS_DETECTED=PASS', 'ACTIVE_LOCK_PRESERVED=PASS');
    } finally {
      if (markerPid) { try { process.kill(markerPid); } catch (_) {} }
      if (fs.existsSync(lockPath) && fs.statSync(lockPath).size === 0) fs.unlinkSync(lockPath);
    }
    const final = waitForState('NONE');
    evidence.final_scan = final;
    assert.equal(final.state, 'NONE', 'CERTIFICATION_MARKER_NOT_TERMINATED');
    evidence.checks.push('TEST_PROCESS_CLEANUP=PASS');
    evidence.lock_after = digest(lockPath);
    evidence.status = 'PASS';
    save();
    process.stdout.write(output + '\n');
  } catch (err) {
    evidence.error = err.stack || err.message;
    evidence.lock_after = digest(lockPath);
    save();
    throw err;
  }
}

if (require.main === module) main();

module.exports = { digest, detachedClaudeMarker };
