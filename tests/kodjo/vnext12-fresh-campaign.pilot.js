'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const S = require('../../scripts/kodjo/execute-vnext12');
const P = require('../../scripts/kodjo/prepare-vnext12');
test('fresh INITIAL cannot reuse legacy approval or substitute a revision admission', () => {
  const c = { stage: 'EXECUTE_INITIAL', slice_id: 'VNEXT-12-QUALIF', campaign_id: crypto.randomUUID(),
    approved_protocol_head: 'a'.repeat(40), gate_ref: 'issue_comment:123456789', approval_target_hash: 'b'.repeat(64),
    revision_limit: 1, pre1_in_scope: false, final_audit_authorized: false };
  assert.equal(S.validateConfig(c), c);
  for (const delta of [{ campaign_id: null }, { approved_protocol_head: S.APPROVED_HEAD }, { gate_ref: S.GATE },
    { approval_target_hash: S.TARGET_HASH }, { gate_ref: 'issue_comment:1' }, { approved_protocol_head: '0'.repeat(40) }]) {
    assert.throws(() => S.validateConfig({ ...c, ...delta }), /CONFIG_REFUSED/);
  }
  const a = { planningEnvelope: { planning_mode: 'INITIAL' }, cumulativeRegister: { revision_count: 0, revision_limit: 1 } };
  S.validateAdmittedInitial(a);
  for (const delta of [{ planningEnvelope: { planning_mode: 'REVISION' } },
    { cumulativeRegister: { revision_count: 1, revision_limit: 1 } }, { revisionArtifacts: { revision_outcome: { status: 'RESOLVED' } } }]) {
    assert.throws(() => S.validateAdmittedInitial({ ...a, ...delta }), /REAL_INITIAL_REQUIRED/);
  }
});
test('fresh disposable preparation replaces only the verified prior slice activation', () => {
  const registry = JSON.parse(fs.readFileSync('.github/orchestration/v2-activation-registry.json'));
  const prior = JSON.parse(fs.readFileSync('.github/orchestration/v2-slices/VNEXT-12-QUALIF/slice-bootstrap.json'));
  const others = registry.activations.filter(x => x.slice_id !== prior.slice_id);
  assert.throws(() => P.replaceDisposableActivation(structuredClone(registry), prior, prior, null), /FRESH_CAMPAIGN_REQUIRED/);
  const next = P.replaceDisposableActivation(structuredClone(registry), prior, prior, crypto.randomUUID());
  assert.deepEqual(next.activations, others);
  assert.throws(() => P.replaceDisposableActivation(structuredClone(registry), { ...prior, slice_id: 'PRE-1' }, prior, crypto.randomUUID()), /FRESH_CAMPAIGN_REQUIRED/);
});
