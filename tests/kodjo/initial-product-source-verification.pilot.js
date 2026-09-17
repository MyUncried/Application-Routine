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

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function fixture(expectedOverride = null, content = '# Déterministe\nligne Unicode — écran\n') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-initial-source-'));
  const source = path.join(dir, 'source');
  fs.mkdirSync(path.join(source, 'docs'), { recursive: true });
  git(source, ['init']);
  git(source, ['config', 'user.email', 'kodjo@example.invalid']);
  git(source, ['config', 'user.name', 'KODJO Test']);
  const file = path.join(source, 'docs', 'Référence.md');
  fs.writeFileSync(file, content, 'utf8');
  git(source, ['add', '--', 'docs/Référence.md']);
  git(source, ['commit', '-m', 'fixture']);
  const baselineHead = git(source, ['rev-parse', 'HEAD']);
  const blob = spawnSync('git', ['show', `${baselineHead}:docs/Référence.md`], { cwd: source, encoding: null, windowsHide: true });
  assert.equal(blob.status, 0, String(blob.stderr || ''));
  const expected = expectedOverride || sha256(blob.stdout);
  const bootstrap = path.join(dir, 'bootstrap.json');
  fs.writeFileSync(bootstrap, JSON.stringify({ baseline_head: baselineHead, product_sources: [{ path: 'docs/Référence.md', sha256: expected }] }));
  return { dir, source, file, bootstrap, baselineHead, blob: blob.stdout, evidence: path.join(dir, 'evidence.txt') };
}

function run(f) {
  return spawnSync(process.execPath, [verifier, f.bootstrap, f.source, f.evidence], { encoding: 'utf8' });
}

test('autorité Git blob: une matérialisation CRLF du worktree ne change ni le hash ni la preuve', () => {
  const f = fixture();
  fs.writeFileSync(f.file, f.blob.toString('utf8').replace(/\n/g, '\r\n'), 'utf8');
  const result = run(f);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /authority=GIT_BLOB/);
  assert.match(result.stdout, new RegExp(`baseline_head=${f.baselineHead}`));
  assert.equal(fs.readFileSync(f.evidence, 'utf8'), '\n===== docs/Référence.md =====\n' + f.blob.toString('utf8'));
});

test('mismatch réel du blob Git: le diagnostic contient chemin, expected, actual, baseline et nature', () => {
  const f = fixture('0'.repeat(64));
  const result = run(f);
  assert.equal(result.status, 78);
  assert.match(result.stderr, /path="docs\/Référence\.md"/);
  assert.match(result.stderr, /expected=0000000000000000000000000000000000000000000000000000000000000000/);
  assert.match(result.stderr, /actual=[0-9a-f]{64}/);
  assert.match(result.stderr, new RegExp(`baseline_head=${f.baselineHead}`));
  assert.match(result.stderr, /authority=GIT_BLOB nature=SHA256_MISMATCH/);
});

test('source absente du commit baseline: le diagnostic est nominatif et refuse la source', () => {
  const f = fixture();
  const bootstrap = JSON.parse(fs.readFileSync(f.bootstrap, 'utf8'));
  bootstrap.product_sources = [{ path: 'docs/Absente.md', sha256: '0'.repeat(64) }];
  fs.writeFileSync(f.bootstrap, JSON.stringify(bootstrap));
  const result = run(f);
  assert.equal(result.status, 78);
  assert.match(result.stderr, /path="docs\/Absente\.md"/);
  assert.match(result.stderr, /actual=MISSING/);
  assert.match(result.stderr, /nature=SOURCE_MISSING_AT_BASELINE/);
});
