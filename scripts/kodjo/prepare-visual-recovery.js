#!/usr/bin/env node
'use strict';

/**
 * Resume bridge for a delta already materialized on an existing application PR.
 *
 * VISUAL_CORRECTION uses a certified delivery checkpoint. IMPLEMENT may use the
 * stricter materialized_recovery proof: the exact durable source package is
 * downloaded, hash/provenance checked, and its patch must reverse-apply cleanly
 * on the exact targeted application HEAD. Only then is an empty local recovery
 * record created so the existing Claude session can correct that delivered HEAD
 * without replaying the already committed patch.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { sha256 } = require('./lib/claude-local');
const { inCumulativeScope } = require('./run-local-claude');

const RECOVERY_SCHEMA = 'kodjo.protocol.v2.local-recovery.0.6.16';
const PACKAGE_SCHEMA = 'kodjo.protocol.v2.recovery-package.0.6.16';

function payloadDigest(payload) {
  const copy = { ...payload };
  delete copy.payload_sha256;
  return sha256(JSON.stringify(copy));
}

function readJson(file, diagnostic) {
  if (!fs.existsSync(file)) throw new Error(diagnostic + '_MISSING');
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
  catch (_) { throw new Error(diagnostic + '_INVALID'); }
}

function verifyMaterializedRecoveryPackage(request, options = {}) {
  const proof = request && request.materialized_recovery;
  if (!proof) return null;
  if (String(request.operation_kind || '').toUpperCase() !== 'IMPLEMENT' ||
      String(request.mode || '').toUpperCase() !== 'RESUME_DELTA') {
    throw new Error('MATERIALIZED_RECOVERY_MODE_REFUSED');
  }
  const target = request.delivery_target;
  if (!target || target.kind !== 'EXISTING_PR' ||
      target.application_head !== request.source_head ||
      proof.materialized_head !== request.source_head) {
    throw new Error('MATERIALIZED_RECOVERY_TARGET_MISMATCH');
  }
  if (String(proof.source_run_id) !== String(request.retry_of_run_id || '')) {
    throw new Error('MATERIALIZED_RECOVERY_RUN_MISMATCH');
  }

  const packageDir = path.resolve(String(options.packageDir || process.env.KODJO_SOURCE_RECOVERY_DIR || ''));
  const manifest = readJson(path.join(packageDir, 'manifest.json'), 'MATERIALIZED_RECOVERY_MANIFEST');
  const patchPath = path.join(packageDir, 'implementation.patch');
  if (!fs.existsSync(patchPath)) throw new Error('MATERIALIZED_RECOVERY_PATCH_MISSING');
  const patch = fs.readFileSync(patchPath);
  const patchDigest = sha256(patch);
  if (manifest.schema_version !== PACKAGE_SCHEMA ||
      String(manifest.github_run_id) !== String(proof.source_run_id) ||
      String(manifest.slice_id) !== String(request.slice_id) ||
      String(manifest.session_id) !== String(request.session_id) ||
      String(manifest.baseline_head) !== String(request.baseline_head) ||
      String(manifest.patch_sha256) !== patchDigest ||
      String(proof.patch_sha256) !== patchDigest ||
      String(manifest.integrity_status) !== 'INTACT') {
    throw new Error('MATERIALIZED_RECOVERY_PROVENANCE_MISMATCH');
  }
  const paths = Array.isArray(manifest.paths) ? manifest.paths.map(String) : null;
  if (!paths || paths.some((file) => !inCumulativeScope(file, {
    scope_allow: request.scope_allow || [], recovery_paths: [],
  }))) {
    throw new Error('MATERIALIZED_RECOVERY_SCOPE_REFUSED');
  }

  if (options.verifyWorktree !== false) {
    const cwd = path.resolve(options.cwd || process.cwd());
    const head = spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd, encoding: 'utf8', windowsHide: true, shell: false,
    });
    if (head.error || head.status !== 0 || String(head.stdout).trim() !== request.source_head) {
      throw new Error('MATERIALIZED_RECOVERY_HEAD_MISMATCH');
    }
    const reverse = spawnSync('git', ['apply', '--check', '--reverse', '--binary', patchPath], {
      cwd, encoding: 'utf8', windowsHide: true, shell: false, maxBuffer: 64 * 1024 * 1024,
    });
    if (reverse.error || reverse.status !== 0) {
      throw new Error('MATERIALIZED_RECOVERY_NOT_PRESENT: ' +
        (reverse.error ? reverse.error.message : String(reverse.stderr || '').trim()));
    }
  }
  return {
    status: 'MATERIALIZED_RECOVERY_VERIFIED',
    source_run_id: String(proof.source_run_id),
    source_artifact_id: String(proof.source_artifact_id),
    patch_sha256: patchDigest,
    materialized_head: request.source_head,
    source_head: String(manifest.source_head || ''),
    paths,
  };
}

function main(argv, env = process.env) {
  const requestPath = argv[0];
  if (!requestPath) throw new Error('USAGE: prepare-visual-recovery.js <request.json>');
  const request = JSON.parse(fs.readFileSync(path.resolve(requestPath), 'utf8').replace(/^\uFEFF/, ''));
  const operation = String(request.operation_kind || '').toUpperCase();
  const visual = operation === 'VISUAL_CORRECTION';
  const materialized = Boolean(request.materialized_recovery);
  if (!visual && !materialized) return null;
  if (String(request.mode || '').toUpperCase() !== 'RESUME_DELTA') {
    throw new Error('RECOVERY_BRIDGE_REQUIRES_RESUME_DELTA');
  }
  if (!/^[0-9a-f]{40}$/.test(String(request.source_head || ''))) throw new Error('RECOVERY_BRIDGE_SOURCE_HEAD_INVALID');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(request.session_id || ''))) {
    throw new Error('RECOVERY_BRIDGE_SESSION_ID_INVALID');
  }
  const target = request.delivery_target;
  if (!target || target.kind !== 'EXISTING_PR' || target.application_head !== request.source_head) {
    throw new Error('RECOVERY_BRIDGE_DELIVERY_TARGET_MISMATCH');
  }

  let materializedEvidence = null;
  if (materialized) {
    materializedEvidence = verifyMaterializedRecoveryPackage(request, {
      packageDir: env.KODJO_SOURCE_RECOVERY_DIR,
      cwd: env.KODJO_REPOSITORY_ROOT || process.cwd(),
    });
  }

  const stateRoot = env.KODJO_STATE_ROOT
    ? path.resolve(env.KODJO_STATE_ROOT)
    : path.join(os.homedir(), '.kodjo-v2');
  const prefix = materialized ? 'materialized-recovery-' : 'visual-checkpoint-';
  const runDir = path.join(stateRoot, 'runs', prefix + request.request_id);
  fs.mkdirSync(runDir, { recursive: true });
  const payload = {
    schema_version: RECOVERY_SCHEMA,
    slice_id: request.slice_id,
    session_id: request.session_id,
    baseline_head: request.baseline_head,
    source_head: request.source_head,
    run_id: prefix + request.request_id,
    request_id: request.request_id,
    integrity_status: 'INTACT',
    checkpoint_materialized: true,
    materialized_recovery: materializedEvidence,
    created_at: new Date().toISOString(),
    entries: [],
  };
  payload.payload_sha256 = payloadDigest(payload);
  const targetFile = path.join(runDir, 'recovery.json');
  const temp = targetFile + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(payload, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temp, targetFile);
  process.stdout.write('[KODJO_V2] ' +
    (materialized ? 'MATERIALIZED_RECOVERY_BASELINE=' : 'VISUAL_CHECKPOINT_BASELINE=') +
    targetFile + '\n');
  return targetFile;
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = {
  main, verifyMaterializedRecoveryPackage, payloadDigest, RECOVERY_SCHEMA, PACKAGE_SCHEMA,
};
