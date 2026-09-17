#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function fail(message) {
  process.stderr.write(message + '\n');
  process.exit(78);
}

function gitBlob(root, head, file) {
  const result = spawnSync('git', ['show', `${head}:${file}`], {
    cwd: root,
    encoding: null,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) return null;
  return result.stdout;
}

function normalizeProductPath(file) {
  const normalized = String(file || '').replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) return null;
  const canonical = path.posix.normalize(normalized);
  if (canonical !== normalized || canonical === '..' || canonical.startsWith('../')) return null;
  return canonical;
}

function main() {
  const [bootstrapPath, sourceRoot, evidencePath] = process.argv.slice(2);
  if (!bootstrapPath || !sourceRoot || !evidencePath) {
    fail('V2_INITIAL_PRODUCT_SOURCE_VERIFY_USAGE nature=INVALID_ARGUMENTS');
  }

  const bootstrap = JSON.parse(fs.readFileSync(bootstrapPath, 'utf8').replace(/^\uFEFF/, ''));
  if (!Array.isArray(bootstrap.product_sources) || bootstrap.product_sources.length === 0) {
    fail('V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED nature=SOURCES_MISSING');
  }
  const baselineHead = String(bootstrap.baseline_head || '');
  if (!/^[0-9a-f]{40}$/.test(baselineHead)) {
    fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED baseline_head=${JSON.stringify(baselineHead)} nature=BASELINE_HEAD_INVALID`);
  }

  const root = path.resolve(sourceRoot);
  const chunks = [];
  for (const source of bootstrap.product_sources) {
    const rawFile = String(source.path || '');
    const file = normalizeProductPath(rawFile);
    const expected = String(source.sha256 || '');
    if (!file) {
      fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED path=${JSON.stringify(rawFile)} expected=${expected || 'MISSING'} actual=INVALID_PATH nature=PATH_INVALID`);
    }

    const bytes = gitBlob(root, baselineHead, file);
    if (!bytes) {
      fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED path=${JSON.stringify(file)} expected=${expected || 'MISSING'} actual=MISSING baseline_head=${baselineHead} nature=SOURCE_MISSING_AT_BASELINE`);
    }
    const actual = sha256(bytes);
    if (expected !== actual) {
      fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED path=${JSON.stringify(file)} expected=${expected || 'MISSING'} actual=${actual} baseline_head=${baselineHead} authority=GIT_BLOB nature=SHA256_MISMATCH`);
    }

    chunks.push(`\n===== ${file} =====\n`);
    chunks.push(bytes);
  }

  fs.writeFileSync(evidencePath, Buffer.concat(chunks.map((part) => Buffer.isBuffer(part) ? part : Buffer.from(part, 'utf8'))));
  process.stdout.write(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_OK sources=${bootstrap.product_sources.length} baseline_head=${baselineHead} authority=GIT_BLOB\n`);
}

try {
  main();
} catch (error) {
  fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED nature=UNEXPECTED_ERROR detail=${JSON.stringify(error.message)}`);
}
