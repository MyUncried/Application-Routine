'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const V = require('./vnext-contract');

// Includes the full local CommonJS closure, not just a function's toString().
function buildProducerPacket({ root, revision = 'HEAD', entries, outputSchema, inputs }) {
  const base = fs.realpathSync(root);
  const git = args => execFileSync('git', args, { cwd: base, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  let sourceRevision;
  let tracked;
  try {
    sourceRevision = git(['rev-parse', revision + '^{commit}']).trim();
    tracked = new Set(git(['ls-tree', '-r', '--name-only', '-z', sourceRevision]).split('\0').filter(Boolean));
  } catch (_) { V.fail('VNEXT_PRODUCER_SOURCE_NON_VERIFIABLE'); }
  const seen = new Map();
  function visit(relative) {
    if (relative.includes('\\') || path.posix.isAbsolute(relative) || relative.split('/').includes('..')) V.fail('VNEXT_PRODUCER_DEPENDENCY_OUTSIDE_ROOT', relative);
    const rel = path.posix.normalize(relative);
    if (!tracked.has(rel)) V.fail('VNEXT_PRODUCER_SOURCE_NON_VERIFIABLE', rel);
    if (seen.has(rel)) return;
    const source = git(['show', sourceRevision + ':' + rel]);
    const sourceHash = V.sha256(source);
    seen.set(rel, { path: rel, source_hash: sourceHash, source });
    // Dynamic requires/imports are not silently called a complete closure.
    if (/\brequire\s*\(\s*[^'"\s]/.test(source) || /\bimport\s*\(/.test(source)) {
      V.fail('VNEXT_PRODUCER_DYNAMIC_DEPENDENCY_NON_VERIFIABLE', rel);
    }
    if (/^\s*(?:import\s|export\s)/m.test(source)) V.fail('VNEXT_PRODUCER_ESM_DEPENDENCY_NON_VERIFIABLE', rel);
    for (const match of source.matchAll(/\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g)) {
      if (match[2].startsWith('node:')) continue;
      if (!match[2].startsWith('.')) V.fail('VNEXT_PRODUCER_EXTERNAL_DEPENDENCY_NON_VERIFIABLE', match[2]);
      const dep = path.posix.normalize(path.posix.join(path.posix.dirname(rel), match[2]));
      const resolved = [dep, dep + '.js', dep + '.json', dep + '/index.js'].find(candidate => tracked.has(candidate));
      if (!resolved) V.fail('VNEXT_PRODUCER_SOURCE_NON_VERIFIABLE', dep);
      visit(resolved);
    }
  }
  for (const entry of V.uniqueStrings(entries, 'VNEXT_PRODUCER_ENTRIES_INVALID', 'entries')) visit(entry);
  return V.sealContract({
    schema_version: 'kodjo.vnext.producer-packet.v2',
    source_revision: sourceRevision,
    consumers: [...seen.values()].sort((a, b) => a.path.localeCompare(b.path)),
    output_schema: outputSchema,
    inputs,
    transport: 'JSON_UTF8',
  });
}

module.exports = { buildProducerPacket };
