'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const V = require('../../scripts/kodjo/lib/vnext-contract');
const R = require('../../scripts/kodjo/lib/vnext-audit-register');
const P = require('../../scripts/kodjo/lib/vnext-proof-result');
const Packet = require('../../scripts/kodjo/lib/vnext-producer-packet');
const S = require('../../scripts/kodjo/lib/vnext-remote-write-security');
const h = 'a'.repeat(64);
const context = { candidateHead: 'a'.repeat(40), lot: 'VNEXT', phase: 'PLAN', authorizedActor: 'MyUncried', revisionCount: 0, revisionLimit: 1 };
const observation = { rule_id: 'F01', target_id: 'scanner', target_hash: h, normative_hash: h, criterion_hash: h, classification: 'DEMONSTRATED_DEFECT', severity: 'MAJOR', required_for_gate: false, evidence_refs: ['proof:reproduction'], note: 'Defect observed in a bounded reproduction.' };
const initial = (row = observation) => R.buildRegister({ ...context, observations: [row] });
const accept = () => { const p = initial(); return R.buildRegister({ ...context, previous: p, observations: [observation], decisions: [{ subject_id: p.entries[0].subject_id, action: 'ACCEPT_RESERVE', actor_id: 'MyUncried', evidence_ref: 'comment:owner-decision', note: 'Deferred to cutover.' }] }); };

test('unsupported resolver syntax is NON_VERIFIABLE even if caller claims PASS or FAIL', () => {
  for (const outcome of ['PASS', 'FAIL']) {
    const p = P.buildProofResult({ outcome, supported: false, evidenceRefs: ['probe:unsupported-syntax'], requiredForGate: true, reason: 'Resolution form unsupported.' });
    assert.equal(p.status, 'NON_VERIFIABLE'); assert.equal(p.gate, 'WAIT_FOR_PROOF'); assert.equal(p.defect_demonstrated, false);
  }
});
test('demonstrated defect, unavailable proof and nonrequired proof have separate gate consequences', () => {
  const build = (outcome, requiredForGate = true) => P.buildProofResult({ outcome, supported: true, requiredForGate, evidenceRefs: ['probe:exact'], reason: 'Observed.' });
  assert.equal(build('FAIL').gate, 'CORRECT_DEFECT'); assert.equal(build('UNAVAILABLE').gate, 'WAIT_FOR_PROOF');
  assert.equal(build('UNAVAILABLE', false).gate, 'CONTINUE'); assert.equal(build('PASS').gate, 'CONTINUE');
});
test('accepted reserve persists if absent from subsequent bounded audit', () => {
  const previous = accept();
  const next = R.buildRegister({ ...context, previous, observations: [] });
  assert.equal(next.entries.length, 1); assert.equal(next.entries[0].lifecycle, 'ACCEPTED_RESERVE');
  assert.equal(next.previous_register_hash, previous.contract_hash); assert.equal(next.gate, 'ACCEPTED_WITH_RESERVES');
});
test('new wording or new auditor cannot escalate unchanged subject', () => {
  assert.throws(() => R.buildRegister({ ...context, previous: accept(), observations: [{ ...observation, required_for_gate: true, note: 'Different interpretation.' }] }), /REQUALIFICATION_WITHOUT_NEW_EVIDENCE/);
});
test('proof unavailability cannot become a defect without new evidence', () => {
  const row = { ...observation, classification: 'PROOF_UNAVAILABLE', required_for_gate: true };
  assert.equal(initial(row).gate, 'WAIT_FOR_PROOF');
  assert.throws(() => R.buildRegister({ ...context, previous: initial(row), observations: [{ ...row, classification: 'DEMONSTRATED_DEFECT' }] }), /REQUALIFICATION_WITHOUT_NEW_EVIDENCE/);
});
test('changed target reopens reserve with causal trace', () => {
  const next = R.buildRegister({ ...context, previous: accept(), observations: [{ ...observation, target_hash: 'b'.repeat(64), required_for_gate: true }] });
  assert.equal(next.gate, 'CORRECTION_REQUIRED'); assert.equal(next.entries[0].lifecycle, 'OPEN'); assert.deepEqual(next.entries[0].causal_reasons, ['target_hash']);
});
test('change of applicable phase is explicit and severity remains independent of gate necessity', () => {
  const next = R.buildRegister({ ...context, phase: 'CUTOVER', previous: accept(), observations: [{ ...observation, required_for_gate: true }] });
  assert.deepEqual(next.entries[0].causal_reasons, ['PHASE_CHANGED']); assert.equal(next.gate, 'CORRECTION_REQUIRED');
  assert.equal(initial().gate, 'READY'); assert.equal(initial().entries[0].severity, 'MAJOR');
});
test('closure requires success evidence and authorized owner, never disappearance', () => {
  const previous = initial(); const subject_id = previous.entries[0].subject_id;
  const decision = { subject_id, action: 'RESOLVE', actor_id: 'MyUncried', evidence_ref: 'proof:closure', note: 'Verified.' };
  assert.throws(() => R.buildRegister({ ...context, previous, observations: [], decisions: [decision] }), /RESOLUTION_WITHOUT_SUCCESS/);
  assert.throws(() => R.buildRegister({ ...context, previous, observations: [], decisions: [{ ...decision, actor_id: 'auditor' }] }), /UNAUTHORIZED/);
  const next = R.buildRegister({ ...context, previous, observations: [{ ...observation, classification: 'SUCCESS', evidence_refs: ['proof:closure'] }], decisions: [decision] });
  assert.equal(next.entries[0].lifecycle, 'RESOLVED');
});
test('retry limit cannot be enlarged during a cycle and exhausted retry is terminal', () => {
  const previous = initial({ ...observation, required_for_gate: true });
  assert.throws(() => R.buildRegister({ ...context, previous, revisionLimit: 2, observations: [] }), /BOUND_CHANGED/);
  const next = R.buildRegister({ ...context, previous, revisionCount: 1, observations: [] });
  assert.equal(next.reentry_allowed, false); assert.equal(next.auto_retry, false);
});
test('producer packet includes boundary validators in actual transitive closure and LF/CRLF transport preserves exact packet', () => {
  const packet = Packet.buildProducerPacket({ root: path.resolve(__dirname, '../..'), entries: ['scripts/kodjo/lib/ui-atomicity-contract.js', 'scripts/kodjo/lib/plan-contract.js'], outputSchema: { type: 'object' }, inputs: {} });
  assert.ok(packet.consumers.some(row => row.path.endsWith('/plan-contract.js') && row.source.includes('buildBoundaries')));
  assert.ok(packet.consumers.some(row => row.path.endsWith('/ui-atomicity-contract.js') && row.source.includes('validateAssertionProofs')));
  for (const eol of ['\n', '\r\n']) assert.deepEqual(JSON.parse(JSON.stringify(packet, null, 2).replace(/\n/g, eol)), packet);
});
test('producer packet rejects dynamic consumer dependency instead of claiming complete coverage', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-packet-'));
  try { fs.writeFileSync(path.join(root, 'consumer.js'), 'require(variable)'); assert.throws(() => Packet.buildProducerPacket({ root, entries: ['consumer.js'], outputSchema: {}, inputs: {} }), /NON_VERIFIABLE/); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('absence of legacy writers cannot attest retirement without pending/replay inventory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-retirement-'));
  const policy = { schema_version: S.POLICY_SCHEMA, policy_mode: 'CUTOVER_PREPARATION', frozen_workflows: [], frozen_scripts: [], declared_vnext_writers: [], retirement_rule: 'REMOVE_OR_DISABLE_ALL_LEGACY_WRITERS_AFTER_LAST_LEGACY_SLICE' };
  try {
    const args = { root, policy, legacyActivationRegistry: { activations: [] } };
    assert.equal(S.evaluateRemoteWriteSecurity(args).status, 'FAIL');
    const retirementObservation = { policy_hash: V.canonicalHash(policy), observed_at: '2026-09-30T12:00:00Z', inventory_complete: true, pending_runs: [], workflow_barriers: [], evidence_refs: ['api:complete-pages'] };
    assert.equal(S.evaluateRemoteWriteSecurity({ ...args, retirementObservation }).status, 'PASS_RETIRED');
    assert.equal(S.evaluateRemoteWriteSecurity({ ...args, retirementObservation: { ...retirementObservation, pending_runs: ['run:queued'] } }).status, 'FAIL');
    assert.throws(() => S.evaluateRemoteWriteSecurity({ ...args, retirementObservation: { ...retirementObservation, inventory_complete: false } }), /INVENTORY_INCOMPLETE/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
