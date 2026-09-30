'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('../../scripts/kodjo/lib/vnext-historical-coverage');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const matrix = JSON.parse(read('.github/orchestration/KODJO_VNEXT_HISTORICAL_DISPOSITION.json'));
const sources = { register: read(matrix.register_path), normativeSource: read(matrix.normative_path) };

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
