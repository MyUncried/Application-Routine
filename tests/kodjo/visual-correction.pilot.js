'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const C = require(path.join(root, 'scripts', 'kodjo', 'lib', 'queue-contract.js'));
const Q = require(path.join(root, 'scripts', 'kodjo', 'lib', 'queue-request.js'));
const V = require(path.join(root, 'scripts', 'kodjo', 'verify-visual-checkpoint.js'));
const R = require(path.join(root, 'scripts', 'kodjo', 'prepare-visual-recovery.js'));
const L = require(path.join(root, 'scripts', 'kodjo', 'run-local-claude.js'));
const P = require(path.join(root, 'scripts', 'kodjo', 'publish-visual-checkpoint.js'));

const protocolHead = 'a'.repeat(40);
const applicationHead = 'b'.repeat(40);
const attestationBlob = 'c'.repeat(40);
const session = '550e8400-e29b-41d4-a716-446655440001';
const requestId = '550e8400-e29b-41d4-a716-446655440002';

function visualQueue(overrides = {}) {
  return {
    schema_version: C.LEAN_REQUEST_SCHEMA,
    slice_id: 'V2-VISUAL-QUALIF',
    issue_number: 52,
    source_head: protocolHead,
    baseline_head: 'd'.repeat(40),
    slice_bootstrap_file: '.github/orchestration/v2-slices/V2-VISUAL-QUALIF/slice-bootstrap.json',
    slice_bootstrap_sha256: 'e'.repeat(64),
    mode: 'RESUME_DELTA',
    operation_kind: 'VISUAL_CORRECTION',
    delivery_target: {
      kind: 'EXISTING_PR', application_pr: 142,
      application_head: applicationHead, branch: 'kodjo/v2-v2-visual-qualif',
    },
    session_id: session,
    prompt_file: '.github/orchestration/v2-slices/V2-VISUAL-QUALIF/implementation-mission.md',
    scope_allow: ['src/features/sessions/CompositionScreen.tsx'],
    checks: ['jest', 'typescript', 'lint'],
    request_id: requestId,
    created_at: '2026-09-15T12:00:00.000Z',
    authorized_plan: {
      plan_path: '.github/orchestration/v2-slices/V2-VISUAL-QUALIF/technical-plan.md',
      plan_blob_oid: 'f'.repeat(40), approved_at_commit: protocolHead,
      evidence_kind: 'ARTIFACT_HASH',
    },
    independent_review: {
      review_path: '.github/orchestration/v2-slices/V2-VISUAL-QUALIF/independent-review.md',
      review_blob_oid: '1'.repeat(40), reviewed_plan_blob_oid: 'f'.repeat(40),
      verdict: 'APPROVED', evidence_kind: 'ARTIFACT_HASH',
    },
    user_gate: {
      gate_ref: 'issue_comment:5678273155', gated_reference: 'f'.repeat(40),
      decision: 'APPROVED', user_login: 'MyUncried', evidence_kind: 'ORGANISATIONAL',
    },
    delivery_checkpoint: {
      checkpoint_ref: 'issue_comment:5679145877', application_pr: 142,
      application_head: applicationHead, protocol_head: protocolHead,
      delivery_head: applicationHead, package_run_id: '34948992572',
      package_artifact_id: '10389171562', attestation_blob_oid: attestationBlob,
      evidence_kind: 'ORGANISATIONAL',
    },
    recovery_migration: {
      attestation_path: '.github/orchestration/v2-slices/V2-VISUAL-QUALIF/recovery-migration.json',
      attestation_blob_oid: attestationBlob, evidence_kind: 'ARTIFACT_HASH',
    },
    retry_of_run_id: '34948992572',
    retry_reason: { code: 'VISUAL_CORRECTION', detail: 'Aligner uniquement le contrôle visuel certifié.' },
    ...overrides,
  };
}

function diagnostics(queue) {
  return C.validateQueueRequest(queue).map((entry) => entry.diagnostic);
}

test('VISUAL_CORRECTION est un RESUME_DELTA explicite visant une PR existante certifiée', () => {
  assert.deepEqual(C.validateQueueRequest(visualQueue()), []);
  assert.ok(diagnostics(visualQueue({ mode: 'INITIAL', session_id: null })).includes('KODJO_QUEUE_OPERATION_KIND_REFUSED'));
  assert.ok(diagnostics(visualQueue({ delivery_target: undefined })).includes('KODJO_QUEUE_DELIVERY_TARGET_REFUSED'));
  assert.ok(diagnostics(visualQueue({ delivery_checkpoint: undefined })).includes('KODJO_QUEUE_DELIVERY_CHECKPOINT_REFUSED'));
  assert.ok(diagnostics(visualQueue({ retry_reason: { code: 'CHECKS_FAILED', detail: 'visuel' } }))
    .includes('KODJO_QUEUE_RETRY_REASON_INVALID'));
});

test('checkpoint et cible applicative doivent rester strictement cohérents', () => {
  const wrongProtocol = visualQueue();
  wrongProtocol.delivery_checkpoint = { ...wrongProtocol.delivery_checkpoint, protocol_head: '9'.repeat(40) };
  assert.ok(diagnostics(wrongProtocol).includes('KODJO_QUEUE_DELIVERY_CHECKPOINT_REFUSED'));

  const wrongApplication = visualQueue();
  wrongApplication.delivery_checkpoint = { ...wrongApplication.delivery_checkpoint, application_head: '8'.repeat(40) };
  assert.ok(diagnostics(wrongApplication).includes('KODJO_QUEUE_DELIVERY_CHECKPOINT_REFUSED'));
});

test('un checkpoint sans attestation reste consommable quand aucune recovery_migration n est rejouee', () => {
  const queue = visualQueue();
  delete queue.recovery_migration;
  queue.delivery_checkpoint = { ...queue.delivery_checkpoint, attestation_blob_oid: '' };
  assert.deepEqual(C.validateQueueRequest(queue), []);

  const withMigration = visualQueue();
  withMigration.delivery_checkpoint = { ...withMigration.delivery_checkpoint, attestation_blob_oid: '' };
  assert.ok(diagnostics(withMigration).includes('KODJO_QUEUE_DELIVERY_CHECKPOINT_REFUSED'));

  const mismatched = visualQueue();
  mismatched.delivery_checkpoint = { ...mismatched.delivery_checkpoint, attestation_blob_oid: '9'.repeat(40) };
  assert.ok(diagnostics(mismatched).includes('KODJO_QUEUE_DELIVERY_CHECKPOINT_REFUSED'));
});

test('projection Lean sépare HEAD protocolaire et HEAD applicatif et ne rejoue pas la migration historique', () => {
  const projected = Q.projectQueueRequest(visualQueue());
  assert.equal(projected.source_head, applicationHead);
  assert.equal(projected.protocol_source_head, protocolHead);
  assert.equal(projected.operation_kind, 'VISUAL_CORRECTION');
  assert.deepEqual(projected.delivery_target, visualQueue().delivery_target);
  assert.equal(projected.recovery_migration, undefined);
});

test('le checkpoint GitHub est relu et lié au commentaire certifié exact', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-visual-checkpoint-'));
  const queue = visualQueue();
  const file = path.join(dir, 'queue.json');
  fs.writeFileSync(file, JSON.stringify(queue), 'utf8');
  const body = [
    '[KODJO_V2] APPLICATION_CHECKPOINT', '',
    'status=CERTIFIED',
    'slice_id=' + queue.slice_id,
    'checkpoint_ref=' + queue.delivery_checkpoint.checkpoint_ref,
    'application_pr=142',
    'application_head=' + applicationHead,
    'plan_blob_oid=' + queue.authorized_plan.plan_blob_oid,
    'review_blob_oid=' + queue.independent_review.review_blob_oid,
    'gate_comment_id=5678273155',
    'protocol_head=' + protocolHead,
    'package_run_id=34948992572',
    'package_artifact_id=10389171562',
    'attestation_blob_oid=' + attestationBlob,
    'delivery_head=' + applicationHead,
  ].join('\n');
  const comment = {
    id: 5679145877,
    issue_url: 'https://api.github.com/repos/MyUncried/Application-Routine/issues/52',
    body,
  };
  const verified=V.verify(file, { cwd: dir, repository: 'MyUncried/Application-Routine', comment, transitionVerifier:()=>({status:'PASS'}) });
  assert.equal(verified.status, 'CERTIFIED');
  assert.equal(verified.contract_status, 'CONTRACT_UNCHANGED');
  assert.throws(() => V.verify(file, {
    cwd: dir, repository: 'MyUncried/Application-Routine', transitionVerifier:()=>({status:'PASS'}),
    comment: { ...comment, body: body.replace('delivery_head=' + applicationHead, 'delivery_head=' + '7'.repeat(40)) },
  }), /KODJO_QUEUE_DELIVERY_CHECKPOINT_FIELD_MISMATCH: delivery_head/);

  assert.throws(() => V.verify(file, {
    cwd: dir, repository: 'MyUncried/Application-Routine', comment,
    transitionVerifier:()=>{ throw new Error('PLAN_REVIEW_PRODUCT_INPUT_CHANGED'); },
  }), /VISUAL_CORRECTION_CONTRACT_CHANGED/);
});

test('la reprise visuelle matérialise un recovery vide sur le HEAD applicatif au lieu de rejouer le paquet historique', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-visual-recovery-'));
  const state = path.join(dir, 'state');
  const request = Q.projectQueueRequest(visualQueue());
  const requestFile = path.join(dir, 'request.json');
  fs.writeFileSync(requestFile, JSON.stringify(request), 'utf8');
  const recoveryFile = R.main([requestFile], { KODJO_STATE_ROOT: state });
  assert.ok(recoveryFile && fs.existsSync(recoveryFile));
  const payload = JSON.parse(fs.readFileSync(recoveryFile, 'utf8'));
  assert.equal(payload.source_head, applicationHead);
  assert.equal(payload.session_id, session);
  assert.equal(payload.checkpoint_materialized, true);
  assert.deepEqual(payload.entries, []);
  const restored = L.restoreRecovery(state, dir, {
    mode: 'RESUME_DELTA', slice_id: request.slice_id, session_id: request.session_id,
    baseline_head: request.baseline_head, source_head: request.source_head,
  });
  assert.deepEqual(restored.files, []);
});

test('le publisher produit un checkpoint chaîné au nouveau HEAD et au checkpoint précédent', () => {
  const meta = {
    slice_id: 'V2-VISUAL-QUALIF', application_pr: 142, application_head: '6'.repeat(40),
    protocol_head: protocolHead, prior_checkpoint_ref: 'issue_comment:5679145877',
    authorized_plan: { plan_blob_oid: 'f'.repeat(40) },
    independent_review: { review_blob_oid: '1'.repeat(40) },
    user_gate: { gate_ref: 'issue_comment:5678273155' },
    attestation_path: '.github/orchestration/v2-slices/V2-VISUAL-QUALIF/recovery-migration.json',
    attestation_blob_oid: attestationBlob, request_id: requestId,
  };
  const body = P.checkpointBody(meta, { id: 123, digest: 'sha256:abc' }, 'issue_comment:999');
  assert.match(body, /checkpoint_ref=issue_comment:999/);
  assert.match(body, /application_head=6666666666666666666666666666666666666666/);
  assert.match(body, /package_artifact_id=123/);
  assert.match(body, /prior_checkpoint_ref=issue_comment:5679145877/);
});

test('le superviseur conserve les protections octet/CRLF et livre sans force sur la PR existante', () => {
  const supervisor = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'run-queued-request.ps1'), 'utf8');
  assert.match(supervisor, /core\.autocrlf=false/);
  assert.match(supervisor, /core\.whitespace=cr-at-eol/);
  assert.match(supervisor, /EXISTING_PR/);
  assert.match(supervisor, /verify-preflight-live-target\.js/);
  const liveGuard = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'verify-preflight-live-target.js'), 'utf8');
  assert.match(liveGuard, /KODJO_QUEUE_APPLICATION_HEAD_MOVED/);
  assert.match(supervisor, /git push origin \$pushRefspec/);
  assert.doesNotMatch(supervisor, /git push[^\n]*--force/);
  assert.match(supervisor, /kodjo-protocol-runtime/);
});

test('la Lean Queue publie le checkpoint après le paquet de récupération et conserve la revue humaine', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'kodjo-v2-lean-queue.yml'), 'utf8');
  const upload = workflow.indexOf('name: Preserve KODJO recovery package');
  const checkpoint = workflow.indexOf('name: Publish visual application checkpoint');
  assert.ok(upload >= 0 && checkpoint > upload);
  assert.match(workflow, /KODJO_VISUAL_DELIVERY_METADATA_FILE/);
  const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'resolve-recovery-source.js'), 'utf8');
  assert.match(source, /VISUAL_CORRECTION/);
  const admission = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'verify-queue-admission.js'), 'utf8');
  assert.match(admission, /verifyVisualCheckpoint/);
  assert.doesNotMatch(admission, /\\n\s+if \(String\(queue\.mode/);
});
