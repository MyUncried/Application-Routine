#!/usr/bin/env node
'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadAndValidate } = require('./lib/slice-identity');
try {
  const repoRoot = path.resolve(process.argv[2] || '.');
  const bootstrapPath = process.argv[3];
  if (!bootstrapPath) throw new Error('SLICE_BOOTSTRAP_PATH_REQUIRED');
  const result = loadAndValidate(repoRoot, bootstrapPath);
  const sourceHead = process.argv[4];
  if (sourceHead) {
    if (!/^[0-9a-f]{40}$/.test(sourceHead)) throw new Error('SOURCE_HEAD_INVALID');
    const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', result.bootstrap.baseline_head, sourceHead], { cwd: repoRoot, windowsHide: true });
    if (ancestry.status !== 0) throw new Error('SOURCE_HEAD_NOT_DESCENDANT_OF_BASELINE');
  }
  process.stdout.write(result.hash + '\n');
} catch (error) {
  process.stderr.write(`KODJO_V2_IDENTITY_REFUSED: ${error.message}\n`);
  process.exit(78);
}
