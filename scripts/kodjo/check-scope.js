#!/usr/bin/env node
'use strict';

/**
 * Scope control — reads the preserved delta and compares it to the authorized
 * scope of the increment. It is deliberately based on the PRESERVED delivery,
 * not on the live worktree: the delta is conserved before any control runs.
 *
 * Usage: node scripts/kodjo/check-scope.js
 *
 * Environment:
 *   KODJO_DELIVERY_DIR          delivery directory holding modified-files.json
 *   KODJO_SCOPE_ALLOWLIST_FILE  JSON file: {"allow": ["glob", ...]}
 *   KODJO_SCOPE_ALLOW           inline list, comma or newline separated
 *
 * With no configured allowlist the check exits 78 -> reported NOT_RUN by the
 * caller mapping; it is never silently reported as a success.
 */

const fs = require('node:fs');
const path = require('node:path');

const { readJson } = require('./lib/json');
const { inScope } = require('./lib/scope-path');

function loadAllowlist(env) {
  if (env.KODJO_SCOPE_ALLOWLIST_FILE && fs.existsSync(env.KODJO_SCOPE_ALLOWLIST_FILE)) {
    const data = readJson(env.KODJO_SCOPE_ALLOWLIST_FILE);
    return Array.isArray(data) ? data : data.allow || [];
  }
  if (env.KODJO_SCOPE_ALLOW && env.KODJO_SCOPE_ALLOW.trim()) {
    return env.KODJO_SCOPE_ALLOW.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  }
  return null;
}

function main() {
  const env = process.env;
  const deliveryDir = path.resolve(env.KODJO_DELIVERY_DIR || 'delivery');
  // The scope control reads the PRESERVED delta, already uploaded as its own
  // artifact, never the live worktree.
  const modifiedPath = path.join(deliveryDir, 'recovery', 'modified-files.json');

  if (!fs.existsSync(modifiedPath)) {
    process.stderr.write('SCOPE_INPUT_MISSING: ' + modifiedPath + ' not found\n');
    return 78;
  }

  const allow = loadAllowlist(env);
  if (!allow || allow.length === 0) {
    process.stderr.write('SCOPE_ALLOWLIST_NOT_CONFIGURED: no authorized scope declared for this increment\n');
    return 78;
  }

  const files = readJson(modifiedPath).files || [];
  const outOfScope = files.filter((f) => !inScope(f.path, allow)).map((f) => f.path);

  process.stdout.write('scope allowlist: ' + allow.join(', ') + '\n');
  process.stdout.write('files in delta: ' + files.length + '\n');

  if (outOfScope.length > 0) {
    process.stderr.write('SCOPE_VIOLATION: ' + outOfScope.length + ' file(s) outside the authorized scope:\n');
    for (const p of outOfScope) process.stderr.write('  - ' + p + '\n');
    process.stderr.write('The complete delta stays preserved for diagnosis; integration is blocked.\n');
    return 1;
  }
  process.stdout.write('SCOPE_OK: every changed path is inside the authorized scope\n');
  return 0;
}

process.exit(main());
