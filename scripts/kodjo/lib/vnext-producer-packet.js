'use strict';

const fs = require('node:fs');
const path = require('node:path');
const V = require('./vnext-contract');

// Includes the full local CommonJS closure, not just a function's toString().
function buildProducerPacket({ root, entries, outputSchema, inputs }) {
  const base = fs.realpathSync(root);
  const seen = new Map();
  function visit(relative) {
    const full = fs.realpathSync(path.resolve(base, relative));
    if (!full.startsWith(base + path.sep)) V.fail('VNEXT_PRODUCER_DEPENDENCY_OUTSIDE_ROOT', relative);
    const rel = path.relative(base, full).split(path.sep).join('/');
    if (seen.has(rel)) return;
    const source = fs.readFileSync(full, 'utf8');
    const sourceHash = V.sha256(source);
    seen.set(rel, { path: rel, source_hash: sourceHash, source });
    // Dynamic requires/imports are not silently called a complete closure.
    if (/\brequire\s*\(\s*[^'"\s]/.test(source) || /\bimport\s*\(/.test(source)) {
      V.fail('VNEXT_PRODUCER_DYNAMIC_DEPENDENCY_NON_VERIFIABLE', rel);
    }
    for (const match of source.matchAll(/\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g)) {
      if (match[2].startsWith('node:')) continue;
      if (!match[2].startsWith('.')) V.fail('VNEXT_PRODUCER_EXTERNAL_DEPENDENCY_NON_VERIFIABLE', match[2]);
      const dep = require.resolve(path.resolve(path.dirname(full), match[2]));
      visit(path.relative(base, dep));
    }
  }
  for (const entry of V.uniqueStrings(entries, 'VNEXT_PRODUCER_ENTRIES_INVALID', 'entries')) visit(entry);
  return V.sealContract({
    schema_version: 'kodjo.vnext.producer-packet.v1',
    consumers: [...seen.values()].sort((a, b) => a.path.localeCompare(b.path)),
    output_schema: outputSchema,
    inputs,
    transport: 'JSON_UTF8',
  });
}

module.exports = { buildProducerPacket };
