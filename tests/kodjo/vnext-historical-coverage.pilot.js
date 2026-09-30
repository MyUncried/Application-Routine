'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('../../scripts/kodjo/lib/vnext-historical-coverage');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const matrix = JSON.parse(read('.github/orchestration/KODJO_VNEXT_HISTORICAL_DISPOSITION.json'));
const sources = H.readSourcesAtRevision(matrix, { cwd: root });

test('historical coverage inventories each original incident/test and exact normative paragraph', () => {
  assert.equal(H.validateInventory(matrix, sources), true);
  for (const row of [...matrix.incidents, ...matrix.tests]) {
    for (const p of [...row.mechanism_paths, ...row.candidate_test_paths]) assert.ok(fs.statSync(path.join(root, p)).isFile(), p);
  }
});
test('historical cardinality cannot certify individual coverage or launch VNext-12', () => {
  assert.throws(() => H.assertHistoricalReady({ ...matrix, readiness: 'READY' }, sources), /INDIVIDUAL_COVERAGE_NOT_READY/);
});
test('historical inventory rejects same-cardinality substituted IDs and changed sources', () => {
  const changed = structuredClone(matrix); changed.tests[0].id = 'T-999';
  assert.throws(() => H.validateInventory(changed, sources), /INDIVIDUAL_IDS_INCOMPLETE/);
  assert.throws(() => H.validateInventory(matrix, { ...sources, normativeSource: sources.normativeSource + '\nchanged' }), /SOURCE_CHANGED/);
});

test('historical fingerprints use Git bytes rather than converted CRLF checkout bytes', () => {
  const os = require('node:os');
  const { execFileSync } = require('node:child_process');
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-history-crlf-'));
  const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  try {
    git(['init']); git(['config', 'core.autocrlf', 'true']);
    for (const [p, body] of [[matrix.register_path, sources.register], [matrix.normative_path, sources.normativeSource]]) {
      fs.mkdirSync(path.dirname(path.join(cwd, p)), { recursive: true });
      fs.writeFileSync(path.join(cwd, p), body.replace(/\n/g, '\r\n'), 'utf8');
    }
    git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.test', 'commit', '-m', 'CRLF checkout fixture']);
    const gitSources = H.readSourcesAtRevision(matrix, { cwd });
    assert.deepEqual(gitSources, sources);
    assert.equal(H.validateInventory(matrix, gitSources), true);
    assert.throws(() => H.validateInventory(matrix, { register: fs.readFileSync(path.join(cwd, matrix.register_path), 'utf8'),
      normativeSource: fs.readFileSync(path.join(cwd, matrix.normative_path), 'utf8') }), /SOURCE_CHANGED/);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
