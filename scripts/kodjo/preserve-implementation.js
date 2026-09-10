#!/usr/bin/env node
'use strict';

/**
 * Step "Preserve implementation before checks" — KODJO V2 §4.7 / §6.13-B.
 *
 * Usage: node scripts/kodjo/preserve-implementation.js <deliveryDir>
 *
 * Environment:
 *   KODJO_REPO_DIR              repository working copy (default: cwd)
 *   KODJO_SLICE_ID              required
 *   KODJO_SOURCE_HEAD           required, full 40-hex commit sha
 *   KODJO_SOURCE_RUN_ID, KODJO_SESSION_ID, KODJO_OPERATION_ID, KODJO_ATTEMPT_ID
 *   KODJO_MODE                  IMPLEMENT | TARGETED_FIX (default IMPLEMENT)
 *   KODJO_DEVELOPMENT_REPORT    path to the agent report, if any
 *   KODJO_AGENT_STATUS          status declared by the agent adapter, if any
 *   KODJO_RECOVERY_OF_RUN_ID    source run for a TARGETED_FIX
 *   KODJO_CARRIED_CHECKS_DIR    previous checks/ dir to carry forward
 *
 * This step runs BEFORE Jest, TypeScript, lint and the scope check.
 *
 * BLK-01 (revue 0.6.4 / contre-analyse 0.6.5): the delivery directory MUST live
 * outside the working copy. An invalid location is REFUSED here, loudly, before
 * anything is produced - it is never silently excluded from the patch, because
 * silently excluding it would hide the misconfiguration instead of surfacing it.
 */

const fs = require('node:fs');
const path = require('node:path');

const { buildDelivery } = require('./lib/delivery');
const { writeJson } = require('./lib/json');
const { info, fail } = require('./lib/log');
const { isInsideOrEqual } = require('./validate-orchestration-paths');

function main() {
  const outDir = path.resolve(process.argv[2] || 'delivery');
  const env = process.env;
  const repoDir = path.resolve(env.KODJO_REPO_DIR || process.cwd());

  const sliceId = env.KODJO_SLICE_ID;
  const sourceHead = env.KODJO_SOURCE_HEAD;
  if (!sliceId || !sourceHead) {
    fail('PRESERVATION_INPUT_MISSING', 'KODJO_SLICE_ID and KODJO_SOURCE_HEAD are required.');
    return 3;
  }
  if (!/^[0-9a-f]{40}$/.test(sourceHead)) {
    fail('PRESERVATION_INPUT_INVALID', 'KODJO_SOURCE_HEAD must be a full lowercase 40-hex sha.');
    return 3;
  }

  // The delivery directory must not sit inside the working copy.
  if (isInsideOrEqual(repoDir, outDir)) {
    fail(
      'DELIVERY_LOCATION_INVALID',
      'the delivery directory ' +
        outDir +
        ' is inside the working copy ' +
        repoDir +
        '. Orchestration files would enter the functional delta. Point KODJO_DELIVERY_DIR ' +
        'outside the repository (RUNNER_TEMP on GitHub Actions).'
    );
    return 3;
  }
  for (const [name, dir] of [
    ['KODJO_SOURCE_RECOVERY_DIR', env.KODJO_SOURCE_RECOVERY_DIR],
    ['KODJO_SOURCE_RESULT_DIR', env.KODJO_SOURCE_RESULT_DIR],
    ['KODJO_CARRIED_CHECKS_DIR', env.KODJO_CARRIED_CHECKS_DIR],
  ]) {
    if (dir && dir.trim() && isInsideOrEqual(repoDir, dir.trim())) {
      fail('DELIVERY_LOCATION_INVALID', name + ' (' + dir + ') is inside the working copy ' + repoDir + '.');
      return 3;
    }
  }

  fs.mkdirSync(outDir, { recursive: true });

  const meta = {
    slice_id: sliceId,
    source_head: sourceHead,
    source_run_id: env.KODJO_SOURCE_RUN_ID || null,
    session_id: env.KODJO_SESSION_ID || null,
    operation_id: env.KODJO_OPERATION_ID || null,
    attempt_id: env.KODJO_ATTEMPT_ID || null,
    mode: env.KODJO_MODE || 'IMPLEMENT',
    agent_reported_status: env.KODJO_AGENT_STATUS || null,
    recovery_of_run_id: env.KODJO_RECOVERY_OF_RUN_ID || null,
  };

  try {
    const manifest = buildDelivery({
      repoDir: repoDir,
      outDir: outDir,
      meta: meta,
      reportPath: env.KODJO_DEVELOPMENT_REPORT ? path.resolve(env.KODJO_DEVELOPMENT_REPORT) : null,
      carriedChecksDir: env.KODJO_CARRIED_CHECKS_DIR ? path.resolve(env.KODJO_CARRIED_CHECKS_DIR) : null,
    });
    info(
      'preserved delta: ' +
        manifest.changed_file_count +
        ' file(s), ' +
        manifest.untracked_file_count +
        ' untracked, patch ' +
        manifest.patch_bytes +
        ' bytes, sha256=' +
        manifest.patch_sha256
    );
    if (!manifest.has_changes) {
      info('no file differs from source_head — preservation is empty (status will be IMPLEMENTATION_FAILED)');
    }
    return 0;
  } catch (err) {
    // The preservation itself failed: record it, never claim an implementation.
    writeJson(path.join(outDir, 'preservation-failure.json'), {
      failed_at: new Date().toISOString(),
      error: String(err && err.message ? err.message : err),
      slice_id: sliceId,
      source_head: sourceHead,
    });
    fail('PRESERVATION_FAILED', String(err && err.message ? err.message : err));
    return 3;
  }
}

process.exit(main());
