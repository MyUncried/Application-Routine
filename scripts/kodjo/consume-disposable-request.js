#!/usr/bin/env node
'use strict';
// Qualification uses the SAME atomic request-id namespace as Lean Queue, but
// its receipt explicitly describes a local request, never queue admission.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { consume, githubApi } = require('./consume-queue-request');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function durableWrite(file, value) {
  const fd = fs.openSync(file, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value, null, 2) + '\n'); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
}
function consumeDisposable({ rawRequest, sessionId, head, runDir, evidenceDirectory, env = process.env, api }) {
  if (env.GITHUB_ACTIONS !== 'true' || env.KODJO_SUPERVISED_QUEUE === '1' ||
      !UUID.test(sessionId) || head !== rawRequest.source_head ||
      !['INITIAL', 'RESUME_DELTA'].includes(rawRequest.mode) || rawRequest.initial_restart) {
    throw Error('DISPOSABLE_CONSUMPTION_CONTEXT_REFUSED');
  }
  if (rawRequest.mode === 'RESUME_DELTA' && sessionId !== rawRequest.session_id) throw Error('DISPOSABLE_SESSION_MISMATCH');
  if (!api && !env.GH_TOKEN) throw Error('DISPOSABLE_CONSUMPTION_TOKEN_REQUIRED');
  const requestText = JSON.stringify(rawRequest);
  const blob = crypto.createHash('sha1').update('blob ' + Buffer.byteLength(requestText) + '\0').update(requestText).digest('hex');
  // Fail closed before creating the receipt if evidence cannot be persisted.
  const requestProof = { request: rawRequest, session_id: sessionId, run_id: env.GITHUB_RUN_ID, run_attempt: env.GITHUB_RUN_ATTEMPT };
  for (const directory of new Set([runDir, evidenceDirectory])) {
    if (!directory || !fs.statSync(directory).isDirectory()) throw Error('DISPOSABLE_EVIDENCE_DIRECTORY_REQUIRED');
    durableWrite(path.join(directory, 'consumed-request.json'), requestProof);
  }
  const receipt = consume({
    schema: 'kodjo.disposable-consumption.v1', evidence_kind: 'DISPOSABLE_LOCAL_REQUEST',
    repository: env.GITHUB_REPOSITORY, request_id: rawRequest.request_id,
    queue_commit: head, queue_blob_oid: blob, queue_path: null,
    request: rawRequest, session_id: sessionId, source_head: head,
    run_id: env.GITHUB_RUN_ID, run_attempt: env.GITHUB_RUN_ATTEMPT,
    mode: rawRequest.mode, retry_of_run_id: rawRequest.retry_of_run_id || null,
    retry_reason: rawRequest.retry_reason || null,
  }, api || ((method, endpoint, body) => githubApi(method, endpoint, body, env)));
  // A persistence/readback failure leaves the durable receipt consumed. Never release it.
  for (const directory of new Set([runDir, evidenceDirectory])) durableWrite(path.join(directory, 'consumption.json'), receipt);
  return receipt;
}
module.exports = { consumeDisposable, durableWrite };
