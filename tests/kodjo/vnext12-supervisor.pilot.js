'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const S = require('../../scripts/kodjo/execute-vnext12');
const config = { stage: 'EXECUTE_INITIAL', slice_id: 'VNEXT-12-QUALIF',
  approved_protocol_head: S.APPROVED_HEAD, gate_ref: S.GATE, approval_target_hash: S.TARGET_HASH,
  revision_limit: 1, pre1_in_scope: false, final_audit_authorized: false };
test('disposable supervisor refuses a moved approval or unauthorized stage before runtime', () => {
  assert.equal(S.validateConfig(config), config);
  for (const changed of [{ approved_protocol_head: '0'.repeat(40) }, { gate_ref: 'issue_comment:1' },
    { approval_target_hash: '0'.repeat(64) }, { stage: 'EXECUTE_FINAL' }, { pre1_in_scope: true },
    { final_audit_authorized: true }, { revision_limit: 2 }]) {
    assert.throws(() => S.validateConfig({ ...config, ...changed }), /EXECUTION_CONFIG_REFUSED/);
  }
});
test('disposable supervisor rejects remote publishing origins', () => {
  assert.equal(S.localOrigin(path.resolve('origin.git')), path.resolve('origin.git'));
  for (const remote of ['https://github.com/MyUncried/Application-Routine', 'git@github.com:repo.git', 'ssh://github.com/repo', 'relative.git']) {
    assert.throws(() => S.localOrigin(remote), /REMOTE_ORIGIN_FORBIDDEN/);
  }
});
test('disposable supervisor requires the two actual expected changes and no neighboring change', () => {
  S.validateDelta([S.CORE, S.TEST]);
  assert.throws(() => S.validateDelta([S.CORE]), /EXACT_DELTA_REQUIRED/);
  assert.throws(() => S.validateDelta([S.CORE, S.TEST, 'scripts/kodjo/fixtures/vnext12/keep.js']), /EXACT_DELTA_REQUIRED/);
});
