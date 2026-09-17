'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../../scripts/kodjo/lib/slice-identity');

const root = path.resolve(__dirname, '..', '..');
const verifier = path.join(root, 'scripts', 'kodjo', 'verify-initial-product-sources.js');
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function writeBootstrap(file, baselineHead, productSources, sliceId = 'V2-TEST-01') {
  const bootstrap = {
    schema_version: I.BOOTSTRAP_SCHEMA,
    slice_id: sliceId,
    issue_number: 999,
    repository: 'MyUncried/Application-Routine',
    target_branch: 'main',
    baseline_head: baselineHead,
    protocol_version: '0.6.12',
    protocol_commit: baselineHead,
    activation_registry: '.github/orchestration/v2-activation-registry.json',
    previous_slice_id: null,
    previous_checkpoint: null,
    product_sources: productSources,
    authorized_actors: ['user', 'chatgpt-protocole', 'claude-local'],
    created_at: '2026-09-17T09:15:00.000Z',
  };
  bootstrap.slice_bootstrap_sha256 = I.sha256(I.canonical(bootstrap));
  fs.writeFileSync(file, JSON.stringify(bootstrap, null, 2) + '\n');
  return bootstrap;
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
  const bootstrap = path.join(dir, 'slice-bootstrap.json');
  const bootstrapObject = writeBootstrap(bootstrap, baselineHead, [{ path: 'docs/Référence.md', sha256: expected }]);
  return { dir, source, file, bootstrap, bootstrapObject, baselineHead, blob: blob.stdout, evidence: path.join(dir, 'evidence.txt') };
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
  assert.match(result.stderr, /nature=AGGREGATED_SOURCE_FAILURES/);
});

test('source absente du commit baseline: le diagnostic est nominatif et refuse la source', () => {
  const f = fixture();
  writeBootstrap(f.bootstrap, f.baselineHead, [{ path: 'docs/Absente.md', sha256: '0'.repeat(64) }]);
  const result = run(f);
  assert.equal(result.status, 78);
  assert.match(result.stderr, /path="docs\/Absente\.md"/);
  assert.match(result.stderr, /actual=MISSING/);
  assert.match(result.stderr, /nature=SOURCE_MISSING_AT_BASELINE/);
});

test('migration historique: elle est liée à l identité complète du bootstrap et ne généralise aucun bypass', () => {
  const f = fixture('0'.repeat(64));
  const migration = {
    schema_version: 'kodjo.protocol.v2.product-source-hash-migration.v1',
    slice_id: f.bootstrapObject.slice_id,
    baseline_head: f.bootstrapObject.baseline_head,
    slice_bootstrap_sha256: f.bootstrapObject.slice_bootstrap_sha256,
    authority: 'GIT_BLOB',
    scope: 'PRODUCT_SOURCE_HASHES_ONLY',
    legacy_product_sources: f.bootstrapObject.product_sources,
    reason: 'fixture',
    created_at: '2026-09-17T09:15:00.000Z',
  };
  fs.writeFileSync(path.join(f.dir, 'product-source-hash-migration.json'), JSON.stringify(migration, null, 2) + '\n');
  const result = run(f);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /V2_INITIAL_PRODUCT_SOURCE_MIGRATION_ACCEPTED/);
  assert.match(result.stdout, /migration=BOUND_LEGACY_BOOTSTRAP/);

  migration.slice_bootstrap_sha256 = 'f'.repeat(64);
  fs.writeFileSync(path.join(f.dir, 'product-source-hash-migration.json'), JSON.stringify(migration, null, 2) + '\n');
  const refused = run(f);
  assert.equal(refused.status, 78);
  assert.match(refused.stderr, /PRODUCT_SOURCE_MIGRATION_BOOTSTRAP_MISMATCH/);
});

test('V2-CAT-01 réel: les 16 sources historiques sont contrôlées en une passe contre le baseline Git exact', () => {
  const bootstrap = path.join(root, '.github', 'orchestration', 'v2-slices', 'V2-CAT-01', 'slice-bootstrap.json');
  const evidence = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-v2-cat-real-')), 'evidence.txt');
  const result = spawnSync(process.execPath, [verifier, bootstrap, root, evidence], { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /sources=16/);
  assert.match(result.stdout, /baseline_head=63a3c26ed492f7c0925cfb57419f3dc2dcc5e476/);
  assert.match(result.stdout, /authority=GIT_BLOB/);
  assert.match(result.stdout, /migration=BOUND_LEGACY_BOOTSTRAP/);
  assert.ok(fs.statSync(evidence).size > 0);
});
