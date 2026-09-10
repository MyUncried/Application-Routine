#!/usr/bin/env node
'use strict';

/**
 * Which checks a TARGETED_FIX must re-run — KODJO V2 §6.13-C step (4):
 * "relance les controles echoues et ceux directement impactes".
 *
 * Usage: node scripts/kodjo/resolve-checks-to-run.js [failed_checks_csv]
 * Prints one check name per line. With mode IMPLEMENT, prints every check.
 */

const fs = require('node:fs');
const path = require('node:path');

const { REQUIRED_CHECKS, resolveChecksToRerun } = require('./lib/checks');

/**
 * MAJ-02 (revue independante 0.6.4): a TARGETED_FIX only re-runs the failed and
 * impacted checks, and reports the others from the SOURCE RESULT artifact. When
 * that artifact is missing, the un-rerun checks stay NOT_RUN forever and
 * IMPLEMENTED_AND_VERIFIED becomes permanently unreachable: the recovery loop
 * cannot converge. In that case every required check is re-run instead.
 */
function carriedChecksAvailable(dir) {
  if (!dir) return false;
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return false;
  return fs.readdirSync(abs).some((n) => n.endsWith('.json'));
}

function main() {
  const mode = (process.env.KODJO_MODE || 'IMPLEMENT').toUpperCase();
  const raw = process.argv[2] !== undefined ? process.argv[2] : process.env.KODJO_FAILED_CHECKS || '';

  let list;
  if (mode !== 'TARGETED_FIX') {
    list = REQUIRED_CHECKS.slice();
  } else if (!carriedChecksAvailable(process.env.KODJO_CARRIED_CHECKS_DIR)) {
    process.stderr.write(
      '[KODJO_V2_PILOT] CARRIED_CHECKS_UNAVAILABLE: no source result checks were downloaded; ' +
        'every required check is re-run so the targeted fix can converge.\n'
    );
    list = REQUIRED_CHECKS.slice();
  } else {
    const failed = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    list = resolveChecksToRerun(failed);
  }
  process.stdout.write(list.join('\n') + '\n');
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { carriedChecksAvailable, main };
