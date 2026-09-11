#!/usr/bin/env node
'use strict';

/**
 * Repertoire de run le plus recent — KV2-18.
 *
 * Le televersement de diagnostic globait `~/.kodjo-v2/runs/**`, donc l'historique
 * de TOUTES les tranches presentes sur le runner, sans purge. Il ne remonte
 * desormais que le run courant.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function resolve(stateRoot) {
  const runsRoot = path.join(stateRoot, 'runs');
  if (!fs.existsSync(runsRoot)) return '';
  const dirs = fs.readdirSync(runsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(runsRoot, entry.name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return dirs.length > 0 ? dirs[0] : '';
}

if (require.main === module) {
  const stateRoot = process.env.KODJO_STATE_ROOT
    ? path.resolve(process.env.KODJO_STATE_ROOT)
    : path.join(os.homedir(), '.kodjo-v2');
  const dir = resolve(stateRoot);
  if (!dir) process.exit(1);
  process.stdout.write(dir + '\n');
}

module.exports = { resolve };
