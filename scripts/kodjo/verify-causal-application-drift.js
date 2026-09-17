#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const SHA40 = /^[0-9a-f]{40}$/i;
const PROTOCOL_PREFIXES = ['.github/', 'scripts/kodjo/', 'tests/kodjo/', 'docs/'];

function changedPaths(cwd, from, to) {
  if (!SHA40.test(String(from || '')) || !SHA40.test(String(to || ''))) {
    throw new Error('CAUSAL_REQUEST_DRIFT_REVISION_INVALID');
  }
  const result = spawnSync('git', [
    '-c', 'core.quotepath=false',
    'diff', '--name-only', '-z', from, to, '--',
  ], {
    cwd,
    encoding: 'buffer',
    windowsHide: true,
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error('CAUSAL_REQUEST_DRIFT_SCAN_FAILED: ' + String(result.stderr || result.error?.message || ''));
  }
  const bytes = Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout || '');
  return bytes.toString('utf8').split('\0').filter(Boolean);
}

function applicationDrift(paths) {
  return paths.filter((file) => !PROTOCOL_PREFIXES.some((prefix) => file.startsWith(prefix)));
}

function verify(cwd, from, to) {
  const paths = changedPaths(cwd, from, to);
  const drift = applicationDrift(paths);
  if (drift.length > 0) {
    throw new Error('CAUSAL_REQUEST_APPLICATION_DRIFT: ' + drift.join(', '));
  }
  return paths;
}

if (require.main === module) {
  try {
    const [from, to] = process.argv.slice(2);
    const paths = verify(process.cwd(), from, to);
    process.stdout.write('[KODJO_V2] causal drift verified — changed=' + paths.length + '\n');
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { PROTOCOL_PREFIXES, changedPaths, applicationDrift, verify };
