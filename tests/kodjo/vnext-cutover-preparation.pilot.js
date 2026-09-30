'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const V = require('../../scripts/kodjo/lib/vnext-contract');
const Cutover = require('../../scripts/kodjo/lib/vnext-cutover-contract');
const RemoteWrite = require('../../scripts/kodjo/lib/vnext-remote-write-policy');

const CANDIDATE_HEAD = '1a8e6a0614b5f1c32081f9a7549ec27239611a71';
const ACTIVATION_HEAD = 'b'.repeat(40);
const ROLLBACK_HEAD = 'c'.repeat(40);

function registry() {
  const file = path.join(
    __dirname,
    '..',
    '..',
    '.github',
    'orchestration',
    'v2-activation-registry.json',
  );
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function closedPre1Registry() {
  const copy = structuredClone(registry());
  const pre1 = copy.activations.find((row) => row.slice_id === 'V2-PRE-1');
  assert.ok(pre1, 'V2-PRE-1 absent du registre');
  pre1.status = 'CLOSED';
  return copy;
}

function remoteWriteSecurity(reg) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-cutover-writer-'));
  const policy = {
    schema_version: RemoteWrite.POLICY_SCHEMA,
    scan_roots: [...RemoteWrite.EXECUTABLE_ROOTS],
    declarations: [],
  };
  const report = RemoteWrite.scanRepository({ root, policy });
  const activeLegacySliceIds = reg.activations
    .filter((row) => row.status === 'ACTIVE')
    .map((row) => row.slice_id)
    .sort();
  const gate = RemoteWrite.buildGate({
    report,
    policy,
    activeLegacySliceIds,
  });
  assert.equal(gate.status, 'REMOTE_WRITE_CONTROL_READY');
  return { policy, report, gate };
}

function planFor(reg) {
  const security = remoteWriteSecurity(reg);
  return Cutover.buildCutoverPlan({
    candidateHead: CANDIDATE_HEAD,
    candidatePr: 262,
    qualificationRunId: 36651084611,
    qualificationStatus: 'QUALIFIED_ON_VNEXT_PERIMETER',
    legacyActivationRegistry: reg,
    protectedLegacySliceIds: ['V2-PRE-1'],
    remoteWriteGate: security.gate,
    remoteWriteReport: security.report,
    remoteWritePolicy: security.policy,
  });
}

function activation(plan, reg) {
  const security = remoteWriteSecurity(reg);
  return Cutover.buildActivationRecord({
    cutoverPlan: plan,
    currentLegacyActivationRegistry: reg,
    activatedAtProtocolHead: ACTIVATION_HEAD,
    remoteWriteGate: security.gate,
    remoteWriteReport: security.report,
    remoteWritePolicy: security.policy,
    approvalEvidence: {
      decision: 'APPROVED',
      actor_id: 'MyUncried',
      evidence_ref: 'issue_comment:cutover-approval',
      observed_at: '2026-09-30T08:00:00.000Z',
      approved_cutover_plan_hash: plan.contract_hash,
    },
  });
}

test('VNext-10 état réel : PRE-1 actif bloque l’activation mais pas la préparation', () => {
  const current = registry();
  const pre1 = current.activations.find((row) => row.slice_id === 'V2-PRE-1');
  assert.equal(pre1.status, 'ACTIVE');

  const plan = planFor(current);
  assert.equal(plan.activation_readiness, 'BLOCKED_BY_ACTIVE_PROTECTED_SLICE');
  assert.deepEqual(plan.blocking_slice_ids, ['V2-PRE-1']);
  assert.equal(plan.active_workflow_change_allowed, false);
  assert.equal(Cutover.validateCutoverPlan(plan, current), true);

  assert.throws(
    () => activation(plan, current),
    /VNEXT_CUTOVER_ACTIVATION_BLOCKED/,
  );
});

test('VNext-10 avant activation toutes les slices restent LEGACY', () => {
  const current = registry();
  const plan = planFor(current);

  assert.equal(Cutover.routeSlice({
    sliceId: 'V2-PRE-1',
    legacyActivationRegistry: current,
    cutoverPlan: plan,
  }), 'LEGACY');

  assert.equal(Cutover.routeSlice({
    sliceId: 'V2-FUTURE-01',
    legacyActivationRegistry: current,
    cutoverPlan: plan,
  }), 'LEGACY');
});

test('VNext-10 PRE-1 fermé rend le plan READY sans modifier les autres slices actives', () => {
  const closed = closedPre1Registry();
  const plan = planFor(closed);

  assert.equal(plan.activation_readiness, 'READY_FOR_ACTIVATION');
  assert.deepEqual(plan.blocking_slice_ids, []);
  assert.ok(plan.grandfathered_legacy_slice_ids.includes('V2-CAT-01'));
  assert.equal(plan.grandfathered_legacy_slice_ids.includes('V2-PRE-1'), false);
  assert.equal(Cutover.validateCutoverPlan(plan, closed), true);
});

test('VNext-10 activation exige une approbation explicite du plan exact', () => {
  const closed = closedPre1Registry();
  const plan = planFor(closed);

  assert.throws(() => Cutover.buildActivationRecord({
    cutoverPlan: plan,
    currentLegacyActivationRegistry: closed,
    activatedAtProtocolHead: ACTIVATION_HEAD,
    approvalEvidence: {
      decision: 'APPROVED',
      actor_id: 'MyUncried',
      evidence_ref: 'issue_comment:cutover-approval',
      observed_at: '2026-09-30T08:00:00.000Z',
      approved_cutover_plan_hash: 'f'.repeat(64),
    },
  }), /VNEXT_CUTOVER_APPROVAL_PLAN_MISMATCH/);

  const record = activation(plan, closed);
  assert.equal(record.status, 'ACTIVATED');
  assert.equal(record.default_protocol, 'VNEXT');
  assert.equal(Cutover.validateActivationRecord(record, plan), true);
});

test('VNext-10 activation refuse un registre legacy ayant dérivé après préparation', () => {
  const closed = closedPre1Registry();
  const plan = planFor(closed);
  const drifted = structuredClone(closed);
  drifted.activations.push({
    slice_id: 'V2-LATE-LEGACY-01',
    status: 'ACTIVE',
    issue_number: 999,
    baseline_head: 'd'.repeat(40),
    bootstrap_path: '.github/orchestration/v2-slices/V2-LATE-LEGACY-01/slice-bootstrap.json',
    slice_bootstrap_sha256: 'e'.repeat(64),
  });

  assert.throws(
    () => activation(plan, drifted),
    /VNEXT_CUTOVER_LEGACY_REGISTRY_STALE/,
  );
});

test('VNext-10 après activation les slices legacy existantes restent LEGACY et une nouvelle slice passe VNEXT', () => {
  const closed = closedPre1Registry();
  const plan = planFor(closed);
  const record = activation(plan, closed);

  assert.equal(Cutover.routeSlice({
    sliceId: 'V2-CAT-01',
    legacyActivationRegistry: closed,
    cutoverPlan: plan,
    activationRecord: record,
  }), 'LEGACY');

  assert.equal(Cutover.routeSlice({
    sliceId: 'V2-FUTURE-01',
    legacyActivationRegistry: closed,
    cutoverPlan: plan,
    activationRecord: record,
  }), 'VNEXT');
});

test('VNext-10 une slice legacy ne change jamais de protocole en cours de cycle', () => {
  const closed = closedPre1Registry();
  const plan = planFor(closed);
  const record = activation(plan, closed);

  for (const row of closed.activations) {
    assert.equal(Cutover.routeSlice({
      sliceId: row.slice_id,
      legacyActivationRegistry: closed,
      cutoverPlan: plan,
      activationRecord: record,
    }), 'LEGACY', row.slice_id);
  }
});

test('VNext-10 refuse un CutoverPlan re-signé qui masque artificiellement PRE-1', () => {
  const current = registry();
  const plan = structuredClone(planFor(current));
  plan.blocking_slice_ids = [];
  plan.activation_readiness = 'READY_FOR_ACTIVATION';
  delete plan.contract_hash;
  plan.contract_hash = V.canonicalHash(plan);

  assert.throws(
    () => Cutover.validateCutoverPlan(plan, current),
    /VNEXT_CUTOVER_BLOCKERS_MISMATCH|VNEXT_CUTOVER_READINESS_MISMATCH/,
  );
});

test('VNext-10 refuse un ActivationRecord re-signé qui retire une slice legacy grandfathered', () => {
  const closed = closedPre1Registry();
  const plan = planFor(closed);
  const record = structuredClone(activation(plan, closed));
  assert.ok(record.grandfathered_legacy_slice_ids.length > 0);
  record.grandfathered_legacy_slice_ids = [];
  delete record.contract_hash;
  record.contract_hash = V.canonicalHash(record);

  assert.throws(
    () => Cutover.validateActivationRecord(record, plan),
    /VNEXT_CUTOVER_ACTIVATION_GRANDFATHERED_MISMATCH/,
  );
});

test('VNext-10 rollback remet les nouvelles slices en LEGACY sans interrompre les cycles VNext actifs', () => {
  const closed = closedPre1Registry();
  const plan = planFor(closed);
  const record = activation(plan, closed);

  const rollback = Cutover.buildRollbackRecord({
    activationRecord: record,
    cutoverPlan: plan,
    activeVnextSliceIds: ['V2-VNEXT-LIVE-01'],
    rolledBackAtProtocolHead: ROLLBACK_HEAD,
    approvalEvidence: {
      decision: 'APPROVED',
      actor_id: 'MyUncried',
      evidence_ref: 'issue_comment:rollback-approval',
      observed_at: '2026-09-30T09:00:00.000Z',
      activation_hash: record.contract_hash,
    },
  });
  assert.equal(Cutover.validateRollbackRecord(rollback, record), true);

  assert.equal(Cutover.routeSlice({
    sliceId: 'V2-VNEXT-LIVE-01',
    legacyActivationRegistry: closed,
    cutoverPlan: plan,
    activationRecord: record,
    rollbackRecord: rollback,
  }), 'VNEXT');

  assert.equal(Cutover.routeSlice({
    sliceId: 'V2-POST-ROLLBACK-01',
    legacyActivationRegistry: closed,
    cutoverPlan: plan,
    activationRecord: record,
    rollbackRecord: rollback,
  }), 'LEGACY');
});

test('VNext-10 rollback exige une approbation explicite liée à l’activation exacte', () => {
  const closed = closedPre1Registry();
  const plan = planFor(closed);
  const record = activation(plan, closed);

  assert.throws(() => Cutover.buildRollbackRecord({
    activationRecord: record,
    cutoverPlan: plan,
    activeVnextSliceIds: [],
    rolledBackAtProtocolHead: ROLLBACK_HEAD,
    approvalEvidence: {
      decision: 'APPROVED',
      actor_id: 'MyUncried',
      evidence_ref: 'issue_comment:rollback-approval',
      observed_at: '2026-09-30T09:00:00.000Z',
      activation_hash: 'f'.repeat(64),
    },
  }), /VNEXT_CUTOVER_ROLLBACK_ACTIVATION_MISMATCH/);
});

test('VNext-10 ne modifie aucun workflow actif dans le lot de préparation', () => {
  const report = fs.readFileSync(
    path.join(__dirname, '..', '..', '.github', 'orchestration', 'KODJO_VNEXT_CHANGE_REPORT_10.md'),
    'utf8',
  );
  assert.match(report, /aucun workflow actif/i);
  assert.match(report, /PRE-1/i);
  assert.match(report, /non actif/i);
});


test('VNext-11.1 le cutover refuse une preuve remote-write re-signée', () => {
  const closed = closedPre1Registry();
  const security = remoteWriteSecurity(closed);
  const plan = Cutover.buildCutoverPlan({
    candidateHead: CANDIDATE_HEAD,
    candidatePr: 262,
    qualificationRunId: 36651084611,
    qualificationStatus: 'QUALIFIED_ON_VNEXT_PERIMETER',
    legacyActivationRegistry: closed,
    protectedLegacySliceIds: ['V2-PRE-1'],
    remoteWriteGate: security.gate,
    remoteWriteReport: security.report,
    remoteWritePolicy: security.policy,
  });

  const forged = structuredClone(security.gate);
  forged.status = 'BLOCKED_UNDECLARED_REMOTE_WRITE';
  delete forged.contract_hash;
  forged.contract_hash = V.canonicalHash(forged);

  assert.throws(() => Cutover.buildActivationRecord({
    cutoverPlan: plan,
    currentLegacyActivationRegistry: closed,
    activatedAtProtocolHead: ACTIVATION_HEAD,
    remoteWriteGate: forged,
    remoteWriteReport: security.report,
    remoteWritePolicy: security.policy,
    approvalEvidence: {
      decision: 'APPROVED',
      actor_id: 'MyUncried',
      evidence_ref: 'issue_comment:cutover-approval',
      observed_at: '2026-09-30T08:00:00.000Z',
      approved_cutover_plan_hash: plan.contract_hash,
    },
  }), /VNEXT_REMOTE_WRITE_GATE_REBUILD_MISMATCH|VNEXT_CUTOVER_REMOTE_WRITE_CONTROL_NOT_READY/);
});
