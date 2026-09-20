#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function consumeLiveToken(env) {
  const token = env.KODJO_LIVE_GH_TOKEN || '';
  delete env.KODJO_LIVE_GH_TOKEN;
  return token;
}
function fail(code, detail) {
  throw new Error(code + (detail ? ': ' + detail : ''));
}
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}
function fetchPullRequest(repository, number, env = process.env) {
  const result = spawnSync('gh', ['api', 'repos/' + repository + '/pulls/' + number], {
    env, encoding: 'utf8', windowsHide: true, shell: false, maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) fail('KODJO_QUEUE_APPLICATION_PR_UNREADABLE');
  try { return JSON.parse(result.stdout); }
  catch (_) { fail('KODJO_QUEUE_APPLICATION_PR_UNREADABLE'); }
}
function verifyQueueTarget(queue, pr) {
  const kind = String((queue && queue.operation_kind) || 'IMPLEMENT').toUpperCase();
  const target = queue && queue.delivery_target;
  if (!target) return { status: 'NOT_APPLICABLE' };
  if (!target || target.kind !== 'EXISTING_PR') fail('KODJO_QUEUE_DELIVERY_TARGET_REFUSED');
  if (!pr || typeof pr !== 'object') fail('KODJO_QUEUE_APPLICATION_PR_UNREADABLE');
  if (String(pr.state) !== 'open') fail('KODJO_QUEUE_APPLICATION_PR_NOT_OPEN');
  if (!pr.base || String(pr.base.ref) !== 'main') fail('KODJO_QUEUE_APPLICATION_PR_BASE_MISMATCH');
  if (!pr.head || String(pr.head.ref) !== String(target.branch)) fail('KODJO_QUEUE_APPLICATION_BRANCH_MISMATCH');
  if (String(pr.head.sha || '').toLowerCase() !== String(target.application_head || '').toLowerCase()) {
    fail('KODJO_QUEUE_APPLICATION_HEAD_MOVED');
  }
  return {
    status: 'PASS',
    application_pr: Number(target.application_pr),
    branch: String(target.branch),
    application_head: String(target.application_head).toLowerCase(),
  };
}
function fetchRemoteHead(repository, branch, env = process.env) {
  const result = spawnSync('gh', ['api', 'repos/' + repository + '/git/ref/heads/' + branch.split('/').map(encodeURIComponent).join('/')], {
    env, encoding:'utf8', windowsHide:true, shell:false, maxBuffer:8*1024*1024,
  });
  if (result.error || result.status !== 0) fail('KODJO_QUEUE_REMOTE_REF_UNREADABLE');
  try { return JSON.parse(result.stdout).object.sha; }
  catch (_) { fail('KODJO_QUEUE_REMOTE_REF_UNREADABLE'); }
}
function verifyLiveTarget(queue, options = {}) {
  if (!queue || !queue.delivery_target) return {status:'NOT_APPLICABLE'};
  const repository = options.repository || process.env.GITHUB_REPOSITORY;
  if (!repository) fail('KODJO_QUEUE_REPOSITORY_MISSING');
  const target = queue.delivery_target;
  if (!target || target.kind !== 'EXISTING_PR') fail('KODJO_QUEUE_DELIVERY_TARGET_REFUSED');
  const pr = (options.fetchPullRequest || fetchPullRequest)(repository,target.application_pr,options.env);
  const result = verifyQueueTarget(queue,pr);
  const remote = (options.fetchRemoteHead || fetchRemoteHead)(repository,target.branch,options.env);
  if (String(remote).toLowerCase() !== result.application_head) fail('KODJO_QUEUE_REMOTE_HEAD_MOVED');
  return result;
}
function verifyFile(queueFile, options = {}) {
  const cwd = options.cwd || process.cwd();
  const queue = readJson(path.resolve(cwd, queueFile));
  if (!queue.delivery_target) return { status: 'NOT_APPLICABLE' };
  if (options.pr) return verifyQueueTarget(queue, options.pr);
  return verifyLiveTarget(queue, options);
}

if (require.main === module) {
  try {
    const file = process.argv[2];
    if (!file) fail('USAGE', 'verify-preflight-live-target.js <queue.json>');
    const result = verifyFile(file);
    process.stdout.write('[KODJO_V2] PREFLIGHT_LIVE_TARGET_' + result.status + '\n');
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { consumeLiveToken, verifyQueueTarget, verifyLiveTarget, verifyFile, fetchPullRequest, fetchRemoteHead };
