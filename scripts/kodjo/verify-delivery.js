#!/usr/bin/env node
'use strict';

/**
 * Step "Validate patch recovery before checks" — KODJO V2 §6.13-B.
 *
 * Usage: node scripts/kodjo/verify-delivery.js <deliveryDir>
 *
 * Restores recovery/implementation.patch in a clean space extracted at
 * source_head and compares every declared hash. It runs BEFORE the recovery
 * artifact is uploaded, so the uploaded package already carries its validation
 * verdict and nothing is written back into it afterwards.
 *
 * A failure invalidates the preservation and leads to IMPLEMENTATION_FAILED —
 * it never produces a false "implemented".
 */

const fs = require('node:fs');
const path = require('node:path');

const { verifyDelivery, recoveryDir } = require('./lib/delivery');
const { writeJson, readJsonIfExists } = require('./lib/json');
const { info, fail } = require('./lib/log');

function main() {
  const deliveryDir = path.resolve(process.argv[2] || 'delivery');
  const repoDir = path.resolve(process.env.KODJO_REPO_DIR || process.cwd());

  if (!fs.existsSync(deliveryDir)) {
    fail('DELIVERY_ABSENT', deliveryDir + ' does not exist: nothing was preserved.');
    return 3;
  }

  let result;
  try {
    result = verifyDelivery({ deliveryDir: deliveryDir, repoDir: repoDir, restore: true });
  } catch (err) {
    result = {
      checked_at: new Date().toISOString(),
      valid: false,
      errors: ['VERIFICATION_CRASHED: ' + String(err && err.message ? err.message : err)],
    };
  }

  const core = result.recovery_dir || recoveryDir(deliveryDir);
  fs.mkdirSync(core, { recursive: true });
  writeJson(path.join(core, 'validation.json'), result);

  // The verdict is stamped into the recovery manifest BEFORE its upload.
  const manifestPath = path.join(core, 'manifest.json');
  const manifest = readJsonIfExists(manifestPath);
  if (manifest) {
    manifest.preservation.patch_validated = Boolean(result.valid);
    manifest.preservation.validation = {
      apply_check: result.apply_check || 'NOT_RUN',
      restore: result.restore || 'NOT_RUN',
      file_hash_matches: result.file_hash_matches || 0,
      file_hash_mismatches: (result.file_hash_mismatches || []).length,
      errors: result.errors || [],
    };
    if (!result.valid) manifest.preservation.status = 'FAILED';
    writeJson(manifestPath, manifest);
  }

  if (!result.valid) {
    fail('DELIVERY_VALIDATION_FAILED', (result.errors || []).join(' | '));
    return 3;
  }
  info(
    'delivery validated at source_head: apply_check=' +
      result.apply_check +
      ', restore=' +
      result.restore +
      ', ' +
      result.file_hash_matches +
      ' file hash(es) identical'
  );
  return 0;
}

process.exit(main());
