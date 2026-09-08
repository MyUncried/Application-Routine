#!/usr/bin/env node
'use strict';

/**
 * Which checks a TARGETED_FIX must re-run — KODJO V2 §6.13-C step (4):
 * "relance les controles echoues et ceux directement impactes".
 *
 * Usage: node scripts/kodjo/resolve-checks-to-run.js [failed_checks_csv]
 * Prints one check name per line. With mode IMPLEMENT, prints every check.
 */

const { REQUIRED_CHECKS, resolveChecksToRerun } = require('./lib/checks');

function main() {
  const mode = (process.env.KODJO_MODE || 'IMPLEMENT').toUpperCase();
  const raw = process.argv[2] !== undefined ? process.argv[2] : process.env.KODJO_FAILED_CHECKS || '';

  let list;
  if (mode !== 'TARGETED_FIX') {
    list = REQUIRED_CHECKS.slice();
  } else {
    const failed = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    list = resolveChecksToRerun(failed);
  }
  process.stdout.write(list.join('\n') + '\n');
  return 0;
}

process.exit(main());
