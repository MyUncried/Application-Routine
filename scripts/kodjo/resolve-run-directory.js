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

function resolve(stateRoot, env = process.env) {
  const runId = String(env.GITHUB_RUN_ID || '');
  const attempt = String(env.GITHUB_RUN_ATTEMPT || '1');
  if (!/^\d+$/.test(runId) || !/^\d+$/.test(attempt)) return '';
  const dir = path.join(stateRoot, 'runs', 'github-' + runId + '-' + attempt);
  const contextPath = path.join(dir, 'run-context.json');
  if (!fs.existsSync(contextPath)) return '';
  let context;
  try { context = JSON.parse(fs.readFileSync(contextPath, 'utf8').replace(/^\uFEFF/, '')); }
  catch (_) { return ''; }
  return context.github_run_id === runId && context.github_run_attempt === attempt ? dir : '';
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