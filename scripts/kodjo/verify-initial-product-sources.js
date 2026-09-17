#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function fail(message) {
  process.stderr.write(message + '\n');
  process.exit(78);
}

function legacyCrlfHash(filePath, bytes) {
  if (path.extname(filePath).toLowerCase() !== '.md') return null;
  if (bytes.includes(0x00) || bytes.includes(0x0d)) return null;
  const text = bytes.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(bytes)) return null;
  return sha256(Buffer.from(text.replace(/\n/g, '\r\n'), 'utf8'));
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

  const chunks = [];
  for (const source of bootstrap.product_sources) {
    const file = String(source.path || '');
    const expected = String(source.sha256 || '');
    const absolute = path.resolve(sourceRoot, file);
    const root = path.resolve(sourceRoot) + path.sep;
    if (!file || !absolute.startsWith(root)) {
      fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED path=${JSON.stringify(file)} expected=${expected || 'MISSING'} actual=INVALID_PATH nature=PATH_INVALID`);
    }
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
      fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED path=${JSON.stringify(file)} expected=${expected || 'MISSING'} actual=MISSING nature=SOURCE_MISSING`);
    }

    const bytes = fs.readFileSync(absolute);
    const actual = sha256(bytes);
    if (expected !== actual) {
      const crlf = legacyCrlfHash(file, bytes);
      if (crlf && crlf === expected) {
        process.stderr.write(`V2_INITIAL_PRODUCT_SOURCE_LEGACY_CRLF_ACCEPTED path=${JSON.stringify(file)} expected=${expected} actual=${actual} nature=LEGACY_WORKTREE_CRLF_HASH\n`);
      } else {
        fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED path=${JSON.stringify(file)} expected=${expected || 'MISSING'} actual=${actual} legacy_crlf=${crlf || 'NOT_APPLICABLE'} nature=SHA256_MISMATCH`);
      }
    }

    chunks.push(`\n===== ${file} =====\n`);
    chunks.push(bytes);
  }

  fs.writeFileSync(evidencePath, Buffer.concat(chunks.map((part) => Buffer.isBuffer(part) ? part : Buffer.from(part, 'utf8'))));
}

try {
  main();
} catch (error) {
  fail(`V2_INITIAL_PRODUCT_SOURCE_VERIFY_FAILED nature=UNEXPECTED_ERROR detail=${JSON.stringify(error.message)}`);
}
