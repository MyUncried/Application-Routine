#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const I = require('./lib/slice-identity');

const MIGRATION_REGISTRY_SCHEMA = 'kodjo.protocol.v2.product-source-hash-migrations.v1';

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

function stableSources(value) {
  return JSON.stringify((value || []).map((x) => ({ path: String(x.path || ''), sha256: String(x.sha256 || '') })));
}

function loadBoundMigration(bootstrap) {
  const registryPath = path.join(__dirname, 'lib', 'initial-product-source-migrations.json');
  if (!fs.existsSync(registryPath)) return null;
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8').replace(/^\uFEFF/, ''));
  if (registry.schema_version !== MIGRATION_REGISTRY_SCHEMA || !Array.isArray(registry.migrations)) {
    throw new Error('PRODUCT_SOURCE_MIGRATION_REGISTRY_INVALID');
  }
  const candidates = registry.migrations.filter((m) => m && m.slice_id === bootstrap.slice_id);
  if (candidates.length === 0) return null;
  if (candidates.length !== 1) throw new Error('PRODUCT_SOURCE_MIGRATION_CARDINALITY_INVALID');
  const migration = candidates[0];
  if (migration.baseline_head !== bootstrap.baseline_head) throw new Error('PRODUCT_SOURCE_MIGRATION_BASELINE_MISMATCH');
  if (migration.slice_bootstrap_sha256 !== bootstrap.slice_bootstrap_sha256) throw new Error('PRODUCT_SOURCE_MIGRATION_BOOTSTRAP_MISMATCH');
  if (migration.authority !== 'GIT_BLOB') throw new Error('PRODUCT_SOURCE_MIGRATION_AUTHORITY_INVALID');
  if (migration.scope !== 'PRODUCT_SOURCE_HASHES_ONLY') throw new Error('PRODUCT_SOURCE_MIGRATION_SCOPE_INVALID');
  if (stableSources(migration.legacy_product_sources) !== stableSources(bootstrap.product_sources)) throw new Error('PRODUCT_SOURCE_MIGRATION_SOURCES_MISMATCH');
  return migration;
}

function main() {
  const [bootstrapPath, sourceRoot, evidencePath] = process.argv.slice(2);
  if (!bootstrapPath || !sourceRoot || !evidencePath) {
    fail('V2_INITIAL_PRODUCT_SOURCE_VERIFY_USAGE nature=INVALID_ARGUMENTS');
  }

  const bootstrap = JSON.parse(fs.readFileSync(bootstrapPath, 'utf8').replace(/^\uFEFF/, ''));
  I.validateBootstrap(bootstrap);
  if (!Array.isArray(bootstrap.product_sources) || bootstrap.product_sources.length === 0) {
    fail('V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED nature=SOURCES_MISSING');
  }
  const baselineHead = String(bootstrap.baseline_head || '');
  if (!/^[0-9a-f]{40}$/.test(baselineHead)) {
    fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED baseline_head=${JSON.stringify(baselineHead)} nature=BASELINE_HEAD_INVALID`);
  }

  const migration = loadBoundMigration(bootstrap);
  const root = path.resolve(sourceRoot);
  const chunks = [];
  const failures = [];
  let migrated = 0;

  for (const source of bootstrap.product_sources) {
    const rawFile = String(source.path || '');
    const file = normalizeProductPath(rawFile);
    const expected = String(source.sha256 || '');
    if (!file) {
      failures.push(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED path=${JSON.stringify(rawFile)} expected=${expected || 'MISSING'} actual=INVALID_PATH nature=PATH_INVALID`);
      continue;
    }

    const bytes = gitBlob(root, baselineHead, file);
    if (!bytes) {
      failures.push(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED path=${JSON.stringify(file)} expected=${expected || 'MISSING'} actual=MISSING baseline_head=${baselineHead} nature=SOURCE_MISSING_AT_BASELINE`);
      continue;
    }
    const actual = sha256(bytes);
    if (expected !== actual) {
      if (migration) {
        migrated += 1;
        process.stderr.write(`V2_INITIAL_PRODUCT_SOURCE_MIGRATION_ACCEPTED migration_id=${migration.migration_id} path=${JSON.stringify(file)} legacy_expected=${expected} canonical=${actual} baseline_head=${baselineHead} bootstrap_sha256=${bootstrap.slice_bootstrap_sha256} authority=GIT_BLOB scope=PRODUCT_SOURCE_HASHES_ONLY\n`);
      } else {
        failures.push(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED path=${JSON.stringify(file)} expected=${expected || 'MISSING'} actual=${actual} baseline_head=${baselineHead} authority=GIT_BLOB nature=SHA256_MISMATCH`);
      }
    }

    chunks.push(`\n===== ${file} =====\n`);
    chunks.push(bytes);
  }

  if (failures.length) {
    for (const message of failures) process.stderr.write(message + '\n');
    fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED failures=${failures.length} sources=${bootstrap.product_sources.length} baseline_head=${baselineHead} authority=GIT_BLOB nature=AGGREGATED_SOURCE_FAILURES`);
  }

  fs.writeFileSync(evidencePath, Buffer.concat(chunks.map((part) => Buffer.isBuffer(part) ? part : Buffer.from(part, 'utf8'))));
  process.stdout.write(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_OK sources=${bootstrap.product_sources.length} migrated=${migrated} baseline_head=${baselineHead} authority=GIT_BLOB${migration ? ` migration=BOUND_LEGACY_BOOTSTRAP migration_id=${migration.migration_id}` : ''}\n`);
}

try {
  main();
} catch (error) {
  fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED nature=UNEXPECTED_ERROR detail=${JSON.stringify(error.message)}`);
}
