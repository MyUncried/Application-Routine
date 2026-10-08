'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const V = require('../../scripts/kodjo/lib/vnext-contract');
const B = require('../../scripts/kodjo/lib/vnext-file-bundle');
const Chain = require('../../scripts/kodjo/lib/vnext-live-chain');
function temp(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-bundle-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }
function firstLeaf(root) { if (root.kind === 'file') return root; for (const item of root.fields?.map(x => x[1]) || root.parts || root.items || []) { const found = firstLeaf(item); if (found) return found; } }

test('bounded transport retains every logical field and historical hash', t => {
  const dir = temp(t), file = path.join(dir, 'produced.json');
  const value = V.sealContract({ unicode: 'é😀', rows: Array(10000).fill({ text: 'x'.repeat(2000), id: 1 }) });
  const result = B.write(file, value);
  assert.equal(result.format, B.SCHEMA);
  const manifest = JSON.parse(fs.readFileSync(file));
  for (const name of fs.readdirSync(path.join(dir, manifest.folder))) assert.ok(fs.statSync(path.join(dir, manifest.folder, name)).size <= B.LIMIT);
  const observed = B.read(file);
  assert.deepEqual(observed, value);
  assert.equal(V.verifyContractHash(observed), true);
});

test('small historical JSON remains directly readable and exclusive output is respected', t => {
  const file = path.join(temp(t), 'legacy.json');
  B.write(file, { a: [1, 'é'], b: null });
  assert.deepEqual(B.read(file), { a: [1, 'é'], b: null });
  assert.throws(() => B.write(file, {}, { exclusive: true }), { code: 'EEXIST' });
});

test('transport refuses missing, changed and traversal parts', t => {
  const dir = temp(t), file = path.join(dir, 'produced.json');
  B.write(file, { a: 1 }, { forceBundle: true });
  const manifest = JSON.parse(fs.readFileSync(file)), leaf = firstLeaf(manifest.root), part = path.join(dir, manifest.folder, leaf.file), original = fs.readFileSync(part);
  fs.writeFileSync(part, '{"a":2}');
  assert.throws(() => B.read(file), { code: 'VNEXT_BUNDLE_PART_HASH_INVALID' });
  fs.unlinkSync(part);
  assert.throws(() => B.read(file), { code: 'ENOENT' });
  fs.writeFileSync(part, original);
  delete manifest.contract_hash; manifest.root.file = '../escape.json';
  fs.writeFileSync(file, JSON.stringify(V.sealContract(manifest)));
  assert.throws(() => B.read(file), { code: 'VNEXT_BUNDLE_PATH_INVALID' });
});

test('transport refuses substitution even with a newly sealed manifest', t => {
  const dir = temp(t), file = path.join(dir, 'produced.json');
  B.write(file, { a: 1 }, { forceBundle: true });
  const manifest = JSON.parse(fs.readFileSync(file)); delete manifest.contract_hash;
  manifest.logical_sha256 = 'f'.repeat(64); manifest.folder = 'produced.json.parts-' + manifest.logical_sha256;
  const old = fs.readdirSync(dir).find(x => x.startsWith('produced.json.parts-'));
  fs.renameSync(path.join(dir, old), path.join(dir, manifest.folder));
  fs.writeFileSync(file, JSON.stringify(V.sealContract(manifest)));
  assert.throws(() => B.read(file), { code: 'VNEXT_BUNDLE_LOGICAL_HASH_INVALID' });
});

test('Git reader consumes only parts from the exact requested revision', t => {
  const dir = temp(t), file = path.join(dir, 'prepared.json');
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.test');
  const value = V.sealContract({ produced: { a: 1 }, review_receipt: { status: 'TEST_ONLY' } });
  B.write(file, value, { forceBundle: true }); git('add', '.'); git('commit', '-m', 'exact bundle');
  const revision = git('rev-parse', 'HEAD');
  assert.deepEqual(Chain.readGitObject(dir, revision, 'prepared.json'), value);
  fs.writeFileSync(file, '{"forged":true}');
  assert.deepEqual(Chain.readGitObject(dir, revision, 'prepared.json'), value);
});

test('large review dossier exposes bounded files without removing canonical fields', t => {
  const dir = temp(t);
  const artifacts = {
    candidateManifest: { candidates: [] },
    reviewContext: { target_catalog: { REQUIREMENT: ['REQ-1'] } },
    uiAtomicityContract: { rows: Array(10000).fill({ expected: 'é'.repeat(1000) }) },
  };
  const dossier = { artifacts, target_catalog: artifacts.reviewContext.target_catalog,
    consumer_sources: [], instructions: 'Review only.' };
  const result = Chain.materializeReviewDossier(dossier, { artifacts }, dir);
  assert.equal(result.canonical_observation.format, B.SCHEMA);
  assert.deepEqual(B.read(result.canonical_observation.path), artifacts);
  assert.equal(result.artifacts.format, B.SCHEMA);
  assert.deepEqual(B.read(result.artifacts.path), artifacts);
  assert.ok(Buffer.byteLength(JSON.stringify(result)) < B.LIMIT);
  assert.ok(result.instructions.includes('Ne declarer aucune cible examinee'));
});
