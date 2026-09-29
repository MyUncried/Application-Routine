#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { inventory } = require('./lib/artifact-policy');

try {
  const [file, limitRaw] = process.argv.slice(2);
  if (!file) throw new Error('USAGE: check-artifact-budget.js <api-json> [soft-limit-bytes]');
  const limit = Number(limitRaw || process.env.KODJO_ACTIONS_STORAGE_SOFT_LIMIT_BYTES || 450 * 1024 * 1024);
  if (!Number.isFinite(limit) || limit < 1) throw new Error('ARTIFACT_BUDGET_LIMIT_INVALID');
  const current = inventory(JSON.parse(fs.readFileSync(file, 'utf8')));
  process.stdout.write('[KODJO_V2] artifact budget current=' + current.total_bytes + ' limit=' + limit + ' count=' + current.artifact_count + '\n');
  if (current.total_bytes >= limit) {
    process.stderr.write('ARTIFACT_STORAGE_PREFLIGHT_EXCEEDED\n');
    process.exit(75);
  }
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
