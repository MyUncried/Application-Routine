#!/usr/bin/env node
'use strict';

/**
 * `retry_of_run_id` de la demande admise — KV2-03.
 *
 * Sert au telechargement du paquet de reprise du run source. Sortie vide et code
 * 1 lorsque la demande n'en declare pas : ce n'est pas une erreur.
 */

const fs = require('node:fs');
const path = require('node:path');
const { admit } = require('./verify-queue-admission');

if (require.main === module) {
  try {
    const [before, after] = process.argv.slice(2);
    const { selected } = admit({
      before, after, cwd: process.cwd(), runAttempt: process.env.GITHUB_RUN_ATTEMPT,
      verifyAuthorizations: false,
    });
    const queue = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), selected), 'utf8').replace(/^\uFEFF/, ''));
    const runId = String(queue.retry_of_run_id || '').trim();
    if (!/^[0-9]+$/.test(runId)) process.exit(1);
    process.stdout.write(runId + '\n');
  } catch (_) {
    process.exit(1);
  }
}
