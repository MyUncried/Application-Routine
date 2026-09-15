#!/usr/bin/env node
'use strict';

/**
 * VISUAL_CORRECTION resume bridge.
 *
 * A delivered application PR already contains the implementation package that
 * produced its certified checkpoint. Re-applying that historical package onto
 * the PR HEAD would duplicate an already-materialized delta. For a visual
 * correction, the checkpoint therefore becomes the recovery baseline: an empty,
 * integrity-protected recovery record bound to the exact application HEAD.
 *
 * This does not authorize any mutation. The queue contract, authorization
 * verifier and existing-PR guard run before this bridge. It only tells the local
 * resume engine that there is nothing to restore before Claude resumes.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { sha256 } = require('./lib/claude-local');

const RECOVERY_SCHEMA = 'kodjo.protocol.v2.local-recovery.0.6.16';

function payloadDigest(payload) {
  const copy = { ...payload };
  delete copy.payload_sha256;
  return sha256(JSON.stringify(copy));
}

function main(argv, env = process.env) {
  const requestPath = argv[0];
  if (!requestPath) throw new Error('USAGE: prepare-visual-recovery.js <request.json>');
  const request = JSON.parse(fs.readFileSync(path.resolve(requestPath), 'utf8').replace(/^\uFEFF/, ''));
  if (String(request.operation_kind || '').toUpperCase() !== 'VISUAL_CORRECTION') return null;
  if (String(request.mode || '').toUpperCase() !== 'RESUME_DELTA') {
    throw new Error('VISUAL_CORRECTION_REQUIRES_RESUME_DELTA');
  }
  if (!/^[0-9a-f]{40}$/.test(String(request.source_head || ''))) throw new Error('VISUAL_SOURCE_HEAD_INVALID');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(request.session_id || ''))) {
    throw new Error('VISUAL_SESSION_ID_INVALID');
  }
  const target = request.delivery_target;
  if (!target || target.kind !== 'EXISTING_PR' || target.application_head !== request.source_head) {
    throw new Error('VISUAL_DELIVERY_TARGET_MISMATCH');
  }

  const stateRoot = env.KODJO_STATE_ROOT
    ? path.resolve(env.KODJO_STATE_ROOT)
    : path.join(os.homedir(), '.kodjo-v2');
  const runDir = path.join(stateRoot, 'runs', 'visual-checkpoint-' + request.request_id);
  fs.mkdirSync(runDir, { recursive: true });
  const payload = {
    schema_version: RECOVERY_SCHEMA,
    slice_id: request.slice_id,
    session_id: request.session_id,
    baseline_head: request.baseline_head,
    source_head: request.source_head,
    run_id: 'visual-checkpoint-' + request.request_id,
    request_id: request.request_id,
    integrity_status: 'INTACT',
    checkpoint_materialized: true,
    created_at: new Date().toISOString(),
    entries: [],
  };
  payload.payload_sha256 = payloadDigest(payload);
  const targetFile = path.join(runDir, 'recovery.json');
  const temp = targetFile + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(payload, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temp, targetFile);
  process.stdout.write('[KODJO_V2] VISUAL_CHECKPOINT_BASELINE=' + targetFile + '\n');
  return targetFile;
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { main, payloadDigest, RECOVERY_SCHEMA };
