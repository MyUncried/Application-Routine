#!/usr/bin/env node
'use strict';

/**
 * Step "Jest / TypeScript / Lint / Scope" — KODJO V2 §6.13-B.
 *
 * Usage: node scripts/kodjo/run-check.js <name> <outFile>
 *
 * The exit code of the underlying command is captured in the JSON result and
 * this process ALWAYS exits 0, so that no failing check can short-circuit the
 * synthesis, the upload or the publication. The run is turned red later, by
 * exit-from-business-status.js, after preservation and publication.
 */

const path = require('node:path');

const { runCheck, REQUIRED_CHECKS } = require('./lib/checks');
const { writeJson } = require('./lib/json');
const { info, fail } = require('./lib/log');

function main() {
  const name = (process.argv[2] || '').trim().toLowerCase();
  const outFile = process.argv[3];
  if (!name || !outFile) {
    fail('CHECK_ARGS_MISSING', 'usage: run-check.js <name> <outFile>');
    return 0;
  }
  if (!REQUIRED_CHECKS.includes(name)) {
    fail('CHECK_UNKNOWN', 'unknown check "' + name + '" (expected one of ' + REQUIRED_CHECKS.join(', ') + ')');
    return 0;
  }

  const deliveryDir = path.resolve(process.env.KODJO_DELIVERY_DIR || path.dirname(path.dirname(outFile)));
  const result = runCheck(name, {
    cwd: path.resolve(process.env.KODJO_REPO_DIR || process.cwd()),
    env: { KODJO_DELIVERY_DIR: deliveryDir },
  });

  writeJson(path.resolve(outFile), result);
  info(
    'check ' +
      name +
      ': ' +
      result.status +
      (result.exit_code === null ? '' : ' (exit ' + result.exit_code + ')') +
      (result.reason ? ' — ' + result.reason : '')
  );
  return 0;
}

process.exit(main());
