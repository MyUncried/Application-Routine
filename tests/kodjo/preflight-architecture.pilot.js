'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const matrixPath = path.join(root, '.github', 'orchestration', 'KODJO_PREFLIGHT_ARCHITECTURE_MATRIX_0.6.42.json');
const architecturePath = path.join(root, '.github', 'orchestration', 'KODJO_PROTOCOL_V2_PREFLIGHT_ARCHITECTURE_0.6.42.md');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const architecture = fs.readFileSync(architecturePath, 'utf8');

function repoPathExists(value) {
  if (String(value).startsWith('TARGET:')) return true;
  return fs.existsSync(path.join(root, value));
}

test('preflight architecture: schema, phases and IDs are complete and deterministic', () => {
  assert.equal(matrix.schema_version, 'kodjo.protocol.v2.preflight-architecture-matrix.v1');
  assert.equal(matrix.architecture_version, '0.6.42');
  assert.deepEqual(matrix.allowed_phases, ['SELECTION','PREFLIGHT','FRESHNESS_GUARD','EXECUTION_POST']);
  assert.deepEqual(matrix.allowed_stability, ['IMMUTABLE','LIVE','RUNNER_VOLATILE']);
  assert.deepEqual(matrix.operation_kinds, ['IMPLEMENT','VISUAL_CORRECTION']);

  const ids = matrix.checks.map((row) => row.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 31);
  for (let i = 1; i <= 31; i += 1) {
    assert.ok(ids.includes('PF-' + String(i).padStart(3,'0')), 'missing PF-' + String(i).padStart(3,'0'));
  }
});

test('preflight architecture: every check has one phase, stability, authority and real source', () => {
  for (const row of matrix.checks) {
    assert.ok(matrix.allowed_phases.includes(row.phase), row.id + ' phase');
    assert.ok(matrix.allowed_stability.includes(row.stability), row.id + ' stability');
    assert.ok(Array.isArray(row.operations) && row.operations.length > 0, row.id + ' operations');
    for (const operation of row.operations) assert.ok(matrix.operation_kinds.includes(operation), row.id + ' operation');
    assert.ok(typeof row.authority === 'string' && row.authority.length > 0, row.id + ' authority');
    assert.ok(typeof row.evidence === 'string' && row.evidence.length > 0, row.id + ' evidence');
    assert.ok(repoPathExists(row.source_of_truth), row.id + ' source missing: ' + row.source_of_truth);
  }
});

test('preflight architecture: immutable rules are never freshness guards and execution-post stays outside preflight', () => {
  for (const row of matrix.checks) {
    if (row.phase === 'FRESHNESS_GUARD') {
      assert.notEqual(row.stability, 'IMMUTABLE', row.id + ' immutable cannot be freshness guard');
    }
    if (row.phase === 'EXECUTION_POST') {
      assert.ok(['PF-029','PF-030','PF-031'].includes(row.id), row.id + ' unexpected post-execution rule');
    }
  }
});

test('preflight architecture: IMPLEMENT and VISUAL_CORRECTION both have full lifecycle coverage', () => {
  for (const operation of matrix.operation_kinds) {
    const phases = new Set(matrix.checks.filter((row) => row.operations.includes(operation)).map((row) => row.phase));
    assert.deepEqual([...phases].sort(), ['EXECUTION_POST','FRESHNESS_GUARD','PREFLIGHT','SELECTION']);
  }
  const implMission = matrix.checks.find((row) => row.id === 'PF-009');
  assert.deepEqual(implMission.operations, ['IMPLEMENT']);
  const visualCheckpoint = matrix.checks.find((row) => row.id === 'PF-008');
  assert.deepEqual(visualCheckpoint.operations, ['VISUAL_CORRECTION']);
});

test('preflight architecture: all five invariants are explicit and reference known checks', () => {
  const ids = new Set(matrix.checks.map((row) => row.id));
  for (const name of ['I1','I2','I3','I4','I5']) {
    assert.ok(Array.isArray(matrix.invariants[name]) && matrix.invariants[name].length > 0, name);
    for (const id of matrix.invariants[name]) assert.ok(ids.has(id), name + ' unknown check ' + id);
  }
});

test('preflight architecture: architecture preserves current protocol boundaries', () => {
  assert.match(architecture, /ne remplace pas[\s\S]*PLAN/);
  assert.match(architecture, /IMPLEMENTATION_REVIEW/);
  assert.match(architecture, /FINAL_VERIFICATION/);
  assert.match(architecture, /VISUAL_CORRECTION/);
  assert.match(architecture, /Legacy non-V2 \| hors périmètre/);
  assert.match(architecture, /Aucune mutation ni invocation Claude avant PASS/);
  assert.match(architecture, /freshness guard/i);
  assert.match(architecture, /Les trois HEAD restent distincts/);
  assert.match(architecture, /Cette version 0\.6\.42 est volontairement une étape d’architecture/);
});

test('preflight architecture: current production chain contains every canonical authority named by the design', () => {
  const queueWorkflow = fs.readFileSync(path.join(root,'.github','workflows','kodjo-v2-lean-queue.yml'),'utf8');
  const runner = fs.readFileSync(path.join(root,'scripts','kodjo','run-queued-request.ps1'),'utf8');
  const starter = fs.readFileSync(path.join(root,'scripts','kodjo','start-kodjo-v2.ps1'),'utf8');
  const local = fs.readFileSync(path.join(root,'scripts','kodjo','run-local-claude.js'),'utf8');

  assert.ok(queueWorkflow.indexOf('verify-queue-admission.js') < queueWorkflow.indexOf('run-queued-request.ps1'));
  assert.ok(runner.indexOf('verify-implementation-mission.js') < runner.indexOf('start-kodjo-v2.ps1'));
  assert.ok(starter.indexOf('prepare-visual-recovery.js') < starter.indexOf('run-local-claude.js'));
  assert.match(local, /CLAUDE_VERSION_REFUSED/);
  assert.match(local, /RECOVERY_REFUSED/);
  assert.match(local, /acquireExecutionLock/);
  assert.match(local, /PROMPT_BUDGET_EXCEEDED/);
});

test('preflight architecture: target introduces no new protocol state or transport', () => {
  assert.doesNotMatch(architecture, /repository_dispatch.*preflight/i);
  assert.match(architecture, /ne crée aucun nouvel état protocolaire/i);
  assert.match(architecture, /preuve locale structurée/);
});
