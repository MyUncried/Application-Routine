#!/usr/bin/env node
'use strict';

/**
 * Step "Finalize business status and manifest" — KODJO V2 §5.2-A / §6.13-B.
 *
 * Usage: node scripts/kodjo/finalize-implementation-delivery.js <deliveryDir>
 *
 * Reads the immutable recovery manifest, every checks/*.json and the integrity
 * verdict, then writes the RESULT package (result/manifest.json,
 * result/implementation-output.txt, result/summary.json). It never rewrites the
 * recovery package: that one was already uploaded before the checks ran, and
 * back-dating a status into it would be a false claim.
 *
 * Environment (from the recovery upload step):
 *   KODJO_RECOVERY_ARTIFACT_NAME / _URL / _DIGEST / _ID
 */

const fs = require('node:fs');
const path = require('node:path');

const { REQUIRED_CHECKS } = require('./lib/checks');
const { computeStatus, RECOVERY } = require('./lib/status');
const { recoveryDir, checksDir, resultDir, integrityDir, gitStateSummary } = require('./lib/delivery');
const { writeJson, readJsonIfExists } = require('./lib/json');
const { info, fail } = require('./lib/log');

function loadChecks(deliveryDir) {
  const dir = checksDir(deliveryDir);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith('.json')) continue;
    const data = readJsonIfExists(path.join(dir, name));
    if (data && data.check) out.push(data);
  }
  return out;
}

/**
 * The derived comment. `artifact`, `artifact_digest` and `patch_sha256` are
 * three DISTINCT values and are never conflated:
 *   - artifact        : real URL returned by actions/upload-artifact
 *   - artifact_digest : digest returned by actions/upload-artifact
 *   - patch_sha256    : sha256 of implementation.patch itself
 */
function buildComment(manifest) {
  const artifact = manifest.recovery_artifact || {};
  const lines = [
    '[KODJO_SLICE] IMPLEMENTATION_OUTPUT',
    'slice_id=' + (manifest.slice_id || ''),
    'status=' + manifest.implementation_status,
    'source_head=' + (manifest.source_head || ''),
    'source_run_id=' + (manifest.source_run_id || ''),
    'artifact=' + (artifact.url || ''),
    'artifact_name=' + (artifact.name || ''),
    'artifact_digest=' + (artifact.digest || ''),
    'patch_sha256=' + (manifest.patch_sha256 || ''),
    'failed_checks=' + (manifest.failed_checks || []).join(','),
    'not_run_checks=' + (manifest.not_run_checks || []).join(','),
    'failed_tests=' + (manifest.failed_tests === null ? '' : manifest.failed_tests),
    'passed_tests=' + (manifest.passed_tests === null ? '' : manifest.passed_tests),
    'functional_continuation=' + manifest.functional_continuation,
    'recovery=' + manifest.recovery,
  ];
  return lines.join('\n') + '\n';
}

function main() {
  const deliveryDir = path.resolve(process.argv[2] || 'delivery');
  const outDir = resultDir(deliveryDir);
  fs.mkdirSync(outDir, { recursive: true });

  const preserved = readJsonIfExists(path.join(recoveryDir(deliveryDir), 'manifest.json'));
  const integrity = fs.existsSync(integrityDir(deliveryDir))
    ? gitStateSummary(deliveryDir)
    : { git_state: 'NOT_CHECKED', functional_continuation: 'BLOCKED', reason: 'GIT_STATE_GUARD_NOT_RUN' };

  let manifest;
  if (preserved) {
    manifest = { ...preserved };
    delete manifest.computed_after_upload;
  } else {
    // Preservation never produced a manifest: the implementation is not
    // recoverable. Emit an explicit IMPLEMENTATION_FAILED synthesis.
    const failure = readJsonIfExists(path.join(deliveryDir, 'preservation-failure.json'));
    manifest = {
      schema_version: 'kodjo.protocol.v2.delivery.0.6.3',
      slice_id: process.env.KODJO_SLICE_ID || null,
      source_head: process.env.KODJO_SOURCE_HEAD || null,
      source_run_id: process.env.KODJO_SOURCE_RUN_ID || null,
      mode: process.env.KODJO_MODE || 'IMPLEMENT',
      has_changes: false,
      patch_sha256: null,
      preservation: {
        status: 'FAILED',
        patch_validated: false,
        validation: null,
        error: failure ? failure.error : 'NO_MANIFEST_PRODUCED',
      },
    };
  }

  manifest.kind = 'RESULT';
  manifest.integrity = integrity;

  const checks = loadChecks(deliveryDir);
  const computed = computeStatus({
    hasChanges: Boolean(manifest.has_changes),
    patchValidated: Boolean(manifest.preservation && manifest.preservation.patch_validated),
    agentStatus: manifest.agent_reported_status || null,
    checks: checks,
    requiredChecks: REQUIRED_CHECKS,
  });

  const jest = checks.find((c) => c.check === 'jest');
  manifest.checks = {};
  for (const c of checks) {
    manifest.checks[c.check] = {
      status: c.status,
      exit_code: c.exit_code === undefined ? null : c.exit_code,
      reason: c.reason || null,
      rerun_in_this_attempt: c.rerun_in_this_attempt !== false,
      carried_from_run_id: c.carried_from_run_id || null,
    };
  }
  manifest.implementation_status = computed.status;
  manifest.status_finalized = true;
  manifest.status_reasons = computed.reasons;
  manifest.failed_checks = computed.failed_checks;
  manifest.not_run_checks = computed.not_run_checks;
  manifest.passed_tests = jest && jest.passed_tests !== undefined ? jest.passed_tests : null;
  manifest.failed_tests = jest && jest.failed_tests !== undefined ? jest.failed_tests : null;
  manifest.recovery = RECOVERY[computed.status];

  // A Git state mutation by the adapter blocks the functional continuation even
  // when the delta itself stays recoverable (§1.2-A).
  const blocked = integrity.functional_continuation === 'BLOCKED';
  manifest.functional_continuation = blocked ? 'BLOCKED' : 'ALLOWED';
  if (blocked) {
    manifest.status_reasons = manifest.status_reasons.concat([
      'Functional continuation is BLOCKED: git state integrity is ' + integrity.git_state + '.',
      'The preserved delta remains recoverable and is not deleted.',
    ]);
  }

  // Real artifact coordinates, kept distinct from the patch hash.
  manifest.recovery_artifact = {
    name: process.env.KODJO_RECOVERY_ARTIFACT_NAME || null,
    url: process.env.KODJO_RECOVERY_ARTIFACT_URL || null,
    digest: process.env.KODJO_RECOVERY_ARTIFACT_DIGEST || null,
    id: process.env.KODJO_RECOVERY_ARTIFACT_ID || null,
    uploaded_before_checks: true,
  };
  manifest.finalized_at = new Date().toISOString();

  writeJson(path.join(outDir, 'manifest.json'), manifest);
  fs.writeFileSync(path.join(outDir, 'implementation-output.txt'), buildComment(manifest), 'utf8');
  writeJson(path.join(outDir, 'summary.json'), {
    slice_id: manifest.slice_id,
    implementation_status: manifest.implementation_status,
    recovery: manifest.recovery,
    functional_continuation: manifest.functional_continuation,
    failed_checks: manifest.failed_checks,
    not_run_checks: manifest.not_run_checks,
    passed_tests: manifest.passed_tests,
    failed_tests: manifest.failed_tests,
    preserved: Boolean(manifest.has_changes),
    patch_validated: Boolean(manifest.preservation && manifest.preservation.patch_validated),
    patch_sha256: manifest.patch_sha256,
    recovery_artifact: manifest.recovery_artifact,
    integrity: integrity,
    reasons: manifest.status_reasons,
  });

  info('business status: ' + manifest.implementation_status + ' (recovery=' + manifest.recovery + ')');
  info('functional continuation: ' + manifest.functional_continuation);
  for (const r of manifest.status_reasons) info('  reason: ' + r);
  if (manifest.implementation_status === 'IMPLEMENTATION_FAILED') {
    fail('IMPLEMENTATION_FAILED', (computed.reasons || []).join(' | '));
  }
  // Always exit 0: the run colour is decided by exit-from-business-status.js,
  // after both uploads and the publication attempt.
  return 0;
}

process.exit(main());
