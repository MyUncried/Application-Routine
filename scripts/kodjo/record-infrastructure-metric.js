#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function read(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', 'utf8');
  fs.renameSync(temporary, file);
}

function sha256File(file) {
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}

function version(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true, shell: false });
  if (result.error || result.status !== 0) return null;
  return String(result.stdout || result.stderr || '').trim() || null;
}

function directoryBytes(root) {
  if (!root || !fs.existsSync(root)) return 0;
  let total = 0;
  const pending = [root];
  while (pending.length) {
    const current = pending.pop();
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch (_) { continue; }
    for (const entry of entries) {
      const item = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(item);
      else if (entry.isFile()) {
        try { total += fs.statSync(item).size; } catch (_) { /* best-effort metric */ }
      }
    }
  }
  return total;
}

function integer(value, name) {
  if (!/^-?\d+$/.test(String(value || ''))) throw new Error(name + '_INVALID');
  return Number(value);
}

function optionalInteger(value) {
  return /^-?\d+$/.test(String(value || '')) ? Number(value) : null;
}

function ensureMetrics(value = {}) {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  if (!data.schema_version) data.schema_version = 'kodjo.protocol.v2.infrastructure-metrics.0.6.22';
  if (!Object.prototype.hasOwnProperty.call(data, 'github_run_id')) data.github_run_id = process.env.GITHUB_RUN_ID || null;
  if (!Object.prototype.hasOwnProperty.call(data, 'github_run_attempt')) data.github_run_attempt = process.env.GITHUB_RUN_ATTEMPT || null;
  if (!Object.prototype.hasOwnProperty.call(data, 'checkout')) data.checkout = null;
  if (!Object.prototype.hasOwnProperty.call(data, 'dependencies')) data.dependencies = null;
  if (!data.toolchain || typeof data.toolchain !== 'object') data.toolchain = { node: process.version, npm: null, jest: null };
  if (!Object.prototype.hasOwnProperty.call(data, 'package_lock_sha256')) data.package_lock_sha256 = null;
  if (!data.storage || typeof data.storage !== 'object') data.storage = {};
  if (!data.cleanup || typeof data.cleanup !== 'object') data.cleanup = { status: 'NOT_RUN', attempts: 0, diagnostics: [] };
  return data;
}

function main(argv) {
  const [mode, file, ...args] = argv;
  if (!mode || !file) throw new Error('USAGE');
  const now = Date.now();
  if (mode === 'init') {
    const [checkoutStartedRaw, checkoutCountBeforeRaw, volumeFreeBeforeRaw, checkoutRoot] = args;
    const checkoutStarted = optionalInteger(checkoutStartedRaw);
    const data = ensureMetrics({
      schema_version: 'kodjo.protocol.v2.infrastructure-metrics.0.6.22',
      github_run_id: process.env.GITHUB_RUN_ID || null,
      github_run_attempt: process.env.GITHUB_RUN_ATTEMPT || null,
      checkout: {
        started_at: checkoutStarted === null ? null : new Date(checkoutStarted).toISOString(),
        finished_at: new Date(now).toISOString(),
        duration_ms: checkoutStarted === null ? null : Math.max(0, now - checkoutStarted),
        checkout_bytes: directoryBytes(checkoutRoot),
      },
      dependencies: null,
      toolchain: { node: process.version, npm: null, jest: null },
      package_lock_sha256: sha256File(path.resolve('package-lock.json')),
      storage: {
        kodjo_checkout_count_before: optionalInteger(checkoutCountBeforeRaw),
        volume_free_bytes_before: optionalInteger(volumeFreeBeforeRaw),
        checkout_bytes_before_cleanup: null,
        kodjo_checkout_count_after_cleanup: null,
        volume_free_bytes_after_cleanup: null,
      },
      cleanup: { status: 'NOT_RUN', attempts: 0, diagnostics: [] },
    });
    write(path.resolve(file), data);
    return;
  }
  if (mode === 'npm-ci') {
    const [startedRaw, finishedRaw, exitRaw, checkoutRoot] = args;
    const started = integer(startedRaw, 'NPM_STARTED_MS');
    const finished = integer(finishedRaw, 'NPM_FINISHED_MS');
    const exitCode = integer(exitRaw, 'NPM_EXIT_CODE');
    const data = ensureMetrics(read(path.resolve(file)));
    data.dependencies = {
      command: 'npm ci --no-audit --no-fund',
      started_at: new Date(started).toISOString(),
      finished_at: new Date(finished).toISOString(),
      duration_ms: Math.max(0, finished - started),
      exit_code: exitCode,
      status: exitCode === 0 ? 'PASS' : 'FAIL',
    };
    data.toolchain = {
      node: process.version,
      npm: version(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version']),
      jest: version(process.execPath, [path.resolve('node_modules', 'jest', 'bin', 'jest.js'), '--version']),
    };
    data.package_lock_sha256 = sha256File(path.resolve('package-lock.json'));
    write(path.resolve(file), data);
    return;
  }
  throw new Error('MODE_UNSUPPORTED: ' + mode);
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write('[KODJO_V2] INFRASTRUCTURE_METRIC_FAILED: ' + error.message + '\n');
    process.exitCode = 1;
  }
}

module.exports = { directoryBytes, ensureMetrics, main };
