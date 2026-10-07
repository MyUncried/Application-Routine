#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const ALLOWED = new Set(['status', 'diff', 'log', 'show', 'rev-parse', 'ls-files']);
const FORBIDDEN_TOKEN = /[;&|`\r\n]|\$\(|>|</;

function bindPlanRead(args, env = process.env, cwd = process.cwd()) {
  if (!env.KODJO_VNEXT_PLAN_READ_JSON) return { args, planRead: null };
  const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
  const p = JSON.parse(env.KODJO_VNEXT_PLAN_READ_JSON);
  if (!/^[0-9a-f]{40}$/.test(p.blob_oid) || !/^[0-9a-f]{40}$/.test(p.protocol_head)
      || !/^[0-9a-f]{64}$/.test(p.content_sha256) || typeof p.path !== 'string'
      || p.path.split('/').some(s => !s || s === '.' || s === '..') || /[\\\0:]/.test(p.path)) throw Error('VNEXT_RUNTIME_PLAN_READ_POLICY_INVALID');
  const file = path.join(cwd, p.path), bytes = fs.readFileSync(file);
  if (fs.lstatSync(file).isSymbolicLink() || crypto.createHash('sha256').update(bytes).digest('hex') !== p.content_sha256) throw Error('VNEXT_RUNTIME_PLAN_VIEW_CHANGED');
  let planRead = null;
  const bound = args.map((arg, index) => {
    if (index === 0) return arg;
    const objectPath = /^([^:]*):(.+)$/.exec(arg);
    const readsPlanPath = objectPath && path.posix.normalize(objectPath[2].replace(/\\/g, '/')) === p.path;
    if (arg === p.blob_oid || (p.original_blob_oid && arg === p.original_blob_oid)
        || readsPlanPath) {
      if (args[0] !== 'show') throw Error('VNEXT_RUNTIME_PLAN_HISTORICAL_READ_REFUSED');
      planRead = { path: p.path, blob_oid: p.blob_oid, content_sha256: p.content_sha256, protocol_head: p.protocol_head };
      return p.protocol_head + ':' + p.path;
    }
    if (arg === p.path) throw Error('VNEXT_RUNTIME_PLAN_HISTORICAL_READ_REFUSED');
    return arg;
  });
  // General diff/log/commit inspection must not expose the temporary plan view
  // as an application delta, or return the old plan in a historical patch.
  const showsOtherBlob = bound[0] === 'show' && bound.some(arg => /^[^:]*:.+/.test(arg));
  if (!planRead && !showsOtherBlob && ['diff','log','show'].includes(bound[0])) {
    if (!bound.includes('--')) bound.push('--', '.');
    bound.push(':(exclude)' + p.path);
  }
  return { args: bound, planRead };
}

function validateArgs(args) {
  if (!Array.isArray(args) || !ALLOWED.has(args[0])) throw new Error('GIT_READ_COMMAND_REFUSED');
  if (args.some((arg) => typeof arg !== 'string' || arg.includes('\0') || FORBIDDEN_TOKEN.test(arg))) {
    throw new Error('GIT_READ_CHAIN_OR_REDIRECTION_REFUSED');
  }
  if (args.includes('-c') || args.some((arg) => /^--(?:exec-path|git-dir|work-tree|config-env)(?:=|$)/.test(arg))) {
    throw new Error('GIT_READ_OPTION_REFUSED');
  }
  return args;
}

function main(argv) {
  let args, planRead;
  try { ({ args, planRead } = bindPlanRead(validateArgs(argv))); }
  catch (err) { process.stderr.write(err.message + '\n'); return 78; }
  const result = spawnSync('git', ['-c', 'core.hooksPath=' + require('node:os').devNull,
    '-c', 'core.fsmonitor=false', ...args], { cwd: process.cwd(), env: process.env, encoding: 'utf8', shell: false, stdio: 'inherit', windowsHide: true });
  const status = result.error || result.status === null ? 78 : result.status;
  if (status === 0 && planRead) {
    require('node:fs').appendFileSync(require('node:path').join(__dirname, 'vnext-plan-reads.jsonl'),
      JSON.stringify({ ...planRead, observed_at: new Date().toISOString() }) + '\n');
  }
  return status;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));
module.exports = { ALLOWED, validateArgs, bindPlanRead, main };
