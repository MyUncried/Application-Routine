#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const SHA_RE = /^[0-9a-f]{40}$/;
const REPOSITORY_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BRANCH_RE = /^[A-Za-z0-9._\/-]+$/;

function fail(code, detail) {
  const err = new Error(code + (detail ? ': ' + detail : ''));
  err.code = code;
  throw err;
}

function resolvePrivateHead(repository, branch, options = {}) {
  const env = options.env || process.env;
  const run = options.spawnSync || spawnSync;
  const repo = String(repository || '').trim();
  const ref = String(branch || '').trim();

  if (!env.GH_TOKEN) fail('KODJO_GITHUB_TOKEN_MISSING');
  if (!REPOSITORY_RE.test(repo)) fail('KODJO_GITHUB_REPOSITORY_INVALID');
  if (!BRANCH_RE.test(ref)) fail('KODJO_GITHUB_BRANCH_INVALID');

  const endpoint = 'repos/' + repo + '/commits/' + encodeURIComponent(ref);
  const result = run('gh', ['api', '--method', 'GET', endpoint, '--jq', '.sha'], {
    env,
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.error || result.status !== 0) {
    const detail = String(result.stderr || result.error?.message || '').trim();
    fail('KODJO_GITHUB_REF_READ_FAILED', detail);
  }

  const sha = String(result.stdout || '').trim();
  if (!SHA_RE.test(sha)) fail('KODJO_GITHUB_REF_RESPONSE_INVALID');
  return sha;
}

function main(argv = process.argv.slice(2)) {
  try {
    const sha = resolvePrivateHead(argv[0], argv[1]);
    process.stdout.write(sha + '\n');
    return 0;
  } catch (err) {
    process.stderr.write(String(err.message || err) + '\n');
    return 1;
  }
}

if (require.main === module) process.exit(main());

module.exports = {
  resolvePrivateHead,
  main,
};
