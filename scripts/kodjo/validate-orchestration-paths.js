#!/usr/bin/env node
'use strict';

/**
 * Preflight KODJO V2: refuse technical directories located in, or equal to,
 * the checked-out repository before restoration or agent execution.
 */

const path = require('node:path');
const { fail, info } = require('./lib/log');

function isInsideOrEqual(root, candidate) {
  const rel = path.relative(path.resolve(root), path.resolve(candidate));
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}

function main() {
  const env = process.env;
  const repoDir = path.resolve(env.KODJO_REPO_DIR || process.cwd());
  const entries = [
    ['KODJO_DELIVERY_DIR', env.KODJO_DELIVERY_DIR],
    ['KODJO_SOURCE_RECOVERY_DIR', env.KODJO_SOURCE_RECOVERY_DIR],
    ['KODJO_SOURCE_RESULT_DIR', env.KODJO_SOURCE_RESULT_DIR],
  ];

  for (const [name, value] of entries) {
    if (!value || !String(value).trim()) {
      fail('DELIVERY_LOCATION_INVALID', name + ' is missing.');
      return 3;
    }
    const candidate = path.resolve(String(value).trim());
    if (isInsideOrEqual(repoDir, candidate)) {
      fail(
        'DELIVERY_LOCATION_INVALID',
        name + ' (' + candidate + ') is inside or equal to the working copy ' + repoDir +
          '. Refusing the run before restoration or agent execution.'
      );
      return 3;
    }
  }

  info('ORCHESTRATION_PATHS_VALID');
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { isInsideOrEqual, main };
