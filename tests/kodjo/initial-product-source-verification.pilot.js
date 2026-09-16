'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const verifier = path.join(root, 'scripts', 'kodjo', 'verify-initial-product-sources.js');
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function fixture(expected, content = '# Déterministe\nligne Unicode — écran\n') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-initial-source-'));
  const source = path.join(dir, 'source');
  fs.mkdirSync(path.join(source, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(source, 'docs', 'Référence.md'), content, 'utf8');
  const bootstrap = path.join(dir, 'bootstrap.json');
  fs.writeFileSync(bootstrap, JSON.stringify({ product_sources: [{ path: 'docs/Référence.md', sha256: expected }] }));
  return { dir, source, bootstrap, evidence: path.join(dir, 'evidence.txt') };
}

function run(f) {
  return spawnSync(process.execPath, [verifier, f.bootstrap, f.source, f.evidence], { encoding: 'utf8' });
}

test('legacy CRLF: un hash de worktree Windows est accepté uniquement comme équivalence bornée du Markdown LF', () => {
  const lf = Buffer.from('# Déterministe\nligne Unicode — écran\n', 'utf8');
  const crlf = Buffer.from('# Déterministe\r\nligne Unicode — écran\r\n', 'utf8');
  const f = fixture(sha256(crlf));
  const result = run(f);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /LEGACY_WORKTREE_CRLF_HASH/);
  assert.match(result.stderr, /docs\/Référence\.md/);
  assert.equal(fs.readFileSync(f.evidence, 'utf8'), '\n===== docs/Référence.md =====\n' + lf.toString('utf8'));
});

test('mismatch réel: le diagnostic contient chemin, expected, actual et nature', () => {
  const f = fixture('0'.repeat(64));
  const result = run(f);
  assert.equal(result.status, 78);
  assert.match(result.stderr, /path="docs\/Référence\.md"/);
  assert.match(result.stderr, /expected=0000000000000000000000000000000000000000000000000000000000000000/);
  assert.match(result.stderr, /actual=[0-9a-f]{64}/);
  assert.match(result.stderr, /nature=SHA256_MISMATCH/);
});

test('source absente: le diagnostic est nominatif sans exposer de secret', () => {
  const f = fixture('0'.repeat(64));
  fs.unlinkSync(path.join(f.source, 'docs', 'Référence.md'));
  const result = run(f);
  assert.equal(result.status, 78);
  assert.match(result.stderr, /actual=MISSING nature=SOURCE_MISSING/);
});
