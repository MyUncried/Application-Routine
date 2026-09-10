#!/usr/bin/env node
'use strict';

/**
 * Step "Verify and restore source patch" of a TARGETED_FIX — KODJO V2 §6.13-C.
 *
 * Usage: node scripts/kodjo/restore-source-artifact.js <artifactDir> [repoDir]
 *
 * MIN-05 (revue independante 0.6.4): the RECOVERY manifest deliberately carries
 * no business status and no failed_checks - they are computed after its upload.
 * Those fields are therefore read from the SOURCE RESULT manifest when it is
 * available (KODJO_SOURCE_RESULT_DIR), and reported as UNKNOWN otherwise.
 *
 * (1) downloads/receives the existing RECOVERY package of the source run —
 * the artifact uploaded before that run's checks — (2) verifies its hashes,
 * (3) restores implementation.patch into a control space clean at source_head.
 * It never re-runs a full implementation and never calls an AI adapter.
 */

const fs = require('node:fs');
const path = require('node:path');

const { git } = require('./lib/git');
const { sha256File } = require('./lib/hash');
const { writeJson, readJsonIfExists } = require('./lib/json');
const { resolveCommit, PATCH_NAME } = require('./lib/delivery');
const { info, fail } = require('./lib/log');

function main() {
  const given = path.resolve(process.argv[2] || 'recovery');
  // Accept either a downloaded recovery artifact (members at its root) or a
  // delivery root holding recovery/.
  const artifactDir = fs.existsSync(path.join(given, 'recovery', PATCH_NAME))
    ? path.join(given, 'recovery')
    : given;
  const repoDir = path.resolve(process.argv[3] || process.env.KODJO_REPO_DIR || process.cwd());
  const expectedSha = (process.env.KODJO_SOURCE_ARTIFACT_SHA256 || '').trim().toLowerCase();

  const patchPath = path.join(artifactDir, PATCH_NAME);
  const manifest = readJsonIfExists(path.join(artifactDir, 'manifest.json'));
  const sidecarPath = path.join(artifactDir, PATCH_NAME + '.sha256');

  if (!fs.existsSync(patchPath) || !manifest || !fs.existsSync(sidecarPath)) {
    fail('RECOVERY_ARTIFACT_INCOMPLETE', 'implementation.patch, its sha256 sidecar or manifest.json is missing.');
    return 3;
  }

  const actual = sha256File(patchPath);
  const sidecar = fs.readFileSync(sidecarPath, 'utf8').trim().split(/\s+/)[0];
  if (actual !== manifest.patch_sha256 || actual !== sidecar) {
    fail('RECOVERY_ARTIFACT_CORRUPT', 'patch sha256 ' + actual + ' does not match the declared hashes.');
    return 3;
  }
  if (expectedSha && expectedSha !== actual) {
    fail('RECOVERY_ARTIFACT_MISMATCH', 'patch sha256 ' + actual + ' does not match the requested ' + expectedSha + '.');
    return 3;
  }

  const head = resolveCommit(repoDir, 'HEAD');
  if (head !== manifest.source_head) {
    fail(
      'RECOVERY_HEAD_MISMATCH',
      'the control space is at ' + head + ' but the artifact was produced from ' + manifest.source_head + '.'
    );
    return 3;
  }

  const applied = git(['apply', '--binary', '--whitespace=nowarn', patchPath], { cwd: repoDir });
  if (applied.status !== 0) {
    fail('RECOVERY_RESTORE_FAILED', String(applied.stderr).trim());
    return 3;
  }

  const resultDirEnv = (process.env.KODJO_SOURCE_RESULT_DIR || 'source-result').trim();
  const sourceResult =
    readJsonIfExists(path.resolve(resultDirEnv, 'result', 'manifest.json')) ||
    readJsonIfExists(path.resolve(resultDirEnv, 'manifest.json'));
  const sourceStatus = sourceResult ? sourceResult.implementation_status : 'UNKNOWN';
  const sourceFailed = sourceResult ? sourceResult.failed_checks || [] : null;

  writeJson(path.join(artifactDir, 'recovery-source.json'), {
    restored_at: new Date().toISOString(),
    source_run_id: manifest.source_run_id,
    source_head: manifest.source_head,
    source_patch_sha256: actual,
    source_status_origin: sourceResult ? 'SOURCE_RESULT_MANIFEST' : 'UNAVAILABLE',
    source_implementation_status: sourceStatus,
    source_failed_checks: sourceFailed,
    ai_call_made: false,
  });

  info(
    'restored source artifact (run ' +
      String(manifest.source_run_id) +
      ', status ' +
      String(sourceStatus) +
      ') on top of ' +
      manifest.source_head
  );
  return 0;
}

process.exit(main());
