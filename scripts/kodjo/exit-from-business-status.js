#!/usr/bin/env node
'use strict';

/**
 * Step "Return run status after preservation and publication" — KODJO V2 §6.13-B.
 *
 * Usage: node scripts/kodjo/exit-from-business-status.js <resultManifestPath>
 *
 * This is the ONLY step allowed to make the run red, and it is the last step of
 * the job: "Le code de sortie rendant le run rouge n'est emis qu'apres ces
 * tentatives de conservation et de publication." (§4.7)
 */

const fs = require('node:fs');
const path = require('node:path');

const { EXIT_CODES } = require('./lib/status');
const { readJsonIfExists } = require('./lib/json');
const { info, fail } = require('./lib/log');

/** Reserved beyond §5.2-A: the delta is recoverable but must not be integrated. */
const EXIT_FUNCTIONAL_BLOCKED = 4;

function main() {
  const manifestPath = path.resolve(process.argv[2] || path.join('delivery', 'result', 'manifest.json'));
  const manifest = readJsonIfExists(manifestPath);

  if (!manifest) {
    fail('MANIFEST_ABSENT', manifestPath + ' not found: nothing was preserved nor finalized.');
    return EXIT_CODES.IMPLEMENTATION_FAILED;
  }
  if (!manifest.status_finalized) {
    fail('STATUS_NOT_FINALIZED', 'the business status was never computed.');
    return EXIT_CODES.IMPLEMENTATION_FAILED;
  }

  const status = manifest.implementation_status;
  const code = EXIT_CODES[status];
  if (code === undefined) {
    fail('STATUS_UNKNOWN', 'unknown business status "' + String(status) + '".');
    return EXIT_CODES.IMPLEMENTATION_FAILED;
  }

  // Guard: the synthesis must exist before the run is allowed to fail.
  const dir = path.dirname(manifestPath);
  for (const name of ['implementation-output.txt', 'summary.json']) {
    if (!fs.existsSync(path.join(dir, name))) {
      fail('SYNTHESIS_INCOMPLETE', name + ' is missing: preservation/synthesis did not complete.');
      return EXIT_CODES.IMPLEMENTATION_FAILED;
    }
  }

  const artifact = manifest.recovery_artifact || {};
  const uploaded = Boolean(artifact.uploaded_before_checks);
  info(
    'run result: ' +
      status +
      (manifest.failed_checks && manifest.failed_checks.length
        ? ' (failed_checks=' + manifest.failed_checks.join(',') + ')'
        : '') +
      ' | recovery artifact: ' +
      (artifact.name || 'UNKNOWN') +
      ' url=' +
      (artifact.url || 'UNKNOWN') +
      ' digest=' +
      (artifact.digest || 'UNKNOWN')
  );

  // Precedence: when nothing exploitable was produced, IMPLEMENTATION_FAILED is
  // the informative diagnostic; there is no functional continuation to block.
  if (manifest.functional_continuation === 'BLOCKED' && status !== 'IMPLEMENTATION_FAILED') {
    fail(
      'FUNCTIONAL_CONTINUATION_BLOCKED',
      'git state integrity is ' +
        ((manifest.integrity && manifest.integrity.git_state) || 'UNKNOWN') +
        '. The preserved delta stays recoverable, but it must not be integrated.'
    );
    return EXIT_FUNCTIONAL_BLOCKED;
  }

  info('exit ' + code + ' for ' + status);
  if (code !== 0) {
    // Never claim an upload that did not happen (MAJ-01).
    info(
      uploaded
        ? 'The recovery artifact was uploaded before the checks; recovery=' + manifest.recovery + '.'
        : 'NO recovery artifact was durably deposited; the delta is not recoverable from GitHub.'
    );
  }
  return code;
}

process.exit(main());
