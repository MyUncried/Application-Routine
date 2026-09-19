#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function fail(code, detail) {
  throw new Error(code + (detail ? ': ' + detail : ''));
}
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}
function fetchPullRequest(repository, number) {
  const result = spawnSync('gh', ['api', 'repos/' + repository + '/pulls/' + number], {
    encoding: 'utf8', windowsHide: true, shell: false, maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) fail('KODJO_QUEUE_APPLICATION_PR_UNREADABLE');
  try { return JSON.parse(result.stdout); }
  catch (_) { fail('KODJO_QUEUE_APPLICATION_PR_UNREADABLE'); }
}
function verifyQueueTarget(queue, pr) {
  const kind = String((queue && queue.operation_kind) || 'IMPLEMENT').toUpperCase();
  if (kind !== 'VISUAL_CORRECTION') return { status: 'NOT_APPLICABLE' };
  const target = queue.delivery_target;
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
function verifyFile(queueFile, options = {}) {
  const cwd = options.cwd || process.cwd();
  const queue = readJson(path.resolve(cwd, queueFile));
  if (String(queue.operation_kind || 'IMPLEMENT').toUpperCase() !== 'VISUAL_CORRECTION') {
    return { status: 'NOT_APPLICABLE' };
  }
  const repository = options.repository || process.env.GITHUB_REPOSITORY;
  if (!repository) fail('KODJO_QUEUE_REPOSITORY_MISSING');
  const pr = options.pr || fetchPullRequest(repository, queue.delivery_target.application_pr);
  return verifyQueueTarget(queue, pr);
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

module.exports = { verifyQueueTarget, verifyFile, fetchPullRequest };
