#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const ALLOWED = new Set(['status', 'diff', 'log', 'show', 'rev-parse', 'ls-files']);
const FORBIDDEN_TOKEN = /[;&|`\r\n]|\$\(|>|</;

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
  let args;
  try { args = validateArgs(argv); }
  catch (err) { process.stderr.write(err.message + '\n'); return 78; }
  const result = spawnSync('git', ['-c', 'core.hooksPath=' + require('node:os').devNull,
    '-c', 'core.fsmonitor=false', ...args], { cwd: process.cwd(), env: process.env, encoding: 'utf8', shell: false, stdio: 'inherit', windowsHide: true });
  return result.error || result.status === null ? 78 : result.status;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));
module.exports = { ALLOWED, validateArgs, main };
