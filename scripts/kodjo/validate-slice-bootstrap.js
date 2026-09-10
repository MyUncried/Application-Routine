#!/usr/bin/env node
'use strict';
const path = require('node:path');
const { loadAndValidate } = require('./lib/slice-identity');
try {
  const repoRoot = path.resolve(process.argv[2] || '.');
  const bootstrapPath = process.argv[3];
  if (!bootstrapPath) throw new Error('SLICE_BOOTSTRAP_PATH_REQUIRED');
  const result = loadAndValidate(repoRoot, bootstrapPath);
  process.stdout.write(result.hash + '\n');
} catch (error) {
  process.stderr.write(`KODJO_V2_IDENTITY_REFUSED: ${error.message}\n`);
  process.exit(78);
}
