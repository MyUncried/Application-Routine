'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const H = require('../../scripts/kodjo/lib/vnext-historical-coverage');
const P = require('../../scripts/kodjo/lib/vnext-publication');
const cwd = path.resolve(__dirname, '../..');
test('candidate publication verifies refreshed historical sources in its tree rather than the old parent', () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(cwd, '.github/orchestration/KODJO_VNEXT_HISTORICAL_DISPOSITION.json')));
  const expectedParent = '2ec2f9f14db0d7cd5b32d126bdbcffff39f9954e';
  const candidateTree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd, encoding: 'utf8' }).trim();
  assert.throws(() => H.validateInventory(inventory, H.readSourcesAtRevision(inventory, { cwd, revision: expectedParent })), /SOURCE_CHANGED/);
  assert.equal(H.validateInventory(inventory, H.readSourcesAtRevision(inventory, { cwd, revision: candidateTree })), true);
  // This fixture exercises the real inventory and correspondence validators.
  // External subprocess checks are mocked here; CI executes the native parsers.
  const result = P.validateTree({ cwd, expectedParent, candidateTree,
    run: (_bin, args) => args[0] === '-c' ? '[]' : '' });
  assert.equal(result.status, 'VALIDATED');
  assert.equal(result.historical_subjects, inventory.incidents.length + inventory.tests.length + inventory.normative_paragraphs.length);
});
