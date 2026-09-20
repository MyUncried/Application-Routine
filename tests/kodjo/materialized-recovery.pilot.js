'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const C = require('../../scripts/kodjo/lib/queue-contract');
const Q = require('../../scripts/kodjo/lib/queue-request');
const R = require('../../scripts/kodjo/prepare-visual-recovery');
const A = require('../../scripts/kodjo/verify-authorizations');
const L = require('../../scripts/kodjo/run-local-claude');
const { sha256 } = require('../../scripts/kodjo/lib/claude-local');

const session = '550e8400-e29b-41d4-a716-446655440071';
const requestId = '550e8400-e29b-41d4-a716-446655440072';

function git(cwd, args) {
  return cp.execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function repositoryFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-materialized-recovery-'));
  git(dir, ['init', '-q']);
  git(dir, ['config', 'core.autocrlf', 'false']);
  git(dir, ['config', 'user.email', 'x@y.z']);
  git(dir, ['config', 'user.name', 'KODJO']);
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'a.ts'), 'export const value = 1;\n');
  git(dir, ['add', '.']);
  git(dir, ['commit', '-qm', 'base']);
  const base = git(dir, ['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(dir, 'src', 'a.ts'), 'export const value = 2;\n');
  const patch = cp.execFileSync('git', ['diff', '--binary', '--full-index', '--no-renames', base], {
    cwd: dir, encoding: 'utf8',
  });
  git(dir, ['add', '.']);
  git(dir, ['commit', '-qm', 'delivered']);
  const head = git(dir, ['rev-parse', 'HEAD']);
  const packageDir = path.join(dir, 'package');
  fs.mkdirSync(packageDir);
  const patchSha = sha256(patch);
  fs.writeFileSync(path.join(packageDir, 'implementation.patch'), patch);
  fs.writeFileSync(path.join(packageDir, 'manifest.json'), JSON.stringify({
    schema_version: R.PACKAGE_SCHEMA,
    slice_id: 'V2-MATERIALIZED',
    session_id: session,
    source_head: base,
    baseline_head: 'b'.repeat(40),
    github_run_id: '35515175109',
    request_id: '550e8400-e29b-41d4-a716-446655440070',
    integrity_status: 'INTACT',
    paths: ['src/a.ts'],
    patch_sha256: patchSha,
  }, null, 2) + '\n');
  return { dir, base, head, packageDir, patchSha };
}


function chainedRepositoryFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-materialized-chain-'));
  git(dir, ['init', '-q']);
  git(dir, ['config', 'core.autocrlf', 'false']);
  git(dir, ['config', 'user.email', 'x@y.z']);
  git(dir, ['config', 'user.name', 'KODJO']);
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'a.ts'), 'export const value = 1;\n');
  git(dir, ['add', '.']);
  git(dir, ['commit', '-qm', 'cumulative base']);
  const base = git(dir, ['rev-parse', 'HEAD']);

  fs.writeFileSync(path.join(dir, 'src', 'a.ts'), 'export const value = 2;\n');
  git(dir, ['add', '.']);
  git(dir, ['commit', '-qm', 'first delivered delta']);
  const packageSource = git(dir, ['rev-parse', 'HEAD']);

  fs.writeFileSync(path.join(dir, 'src', 'a.ts'), 'export const value = 3;\n');
  const patch = cp.execFileSync('git', ['diff', '--binary', '--full-index', '--no-renames', packageSource], {
    cwd: dir, encoding: 'utf8',
  });
  git(dir, ['add', '.']);
  git(dir, ['commit', '-qm', 'second delivered delta']);
  const head = git(dir, ['rev-parse', 'HEAD']);

  const packageDir = path.join(dir, 'package');
  fs.mkdirSync(packageDir);
  const patchSha = sha256(patch);
  fs.writeFileSync(path.join(packageDir, 'implementation.patch'), patch);
  fs.writeFileSync(path.join(packageDir, 'manifest.json'), JSON.stringify({
    schema_version: R.PACKAGE_SCHEMA,
    slice_id: 'V2-MATERIALIZED',
    session_id: session,
    source_head: packageSource,
    baseline_head: 'b'.repeat(40),
    github_run_id: '35515175109',
    request_id: '550e8400-e29b-41d4-a716-446655440070',
    integrity_status: 'INTACT',
    paths: ['src/a.ts'],
    patch_sha256: patchSha,
  }, null, 2) + '\n');
  return { dir, base, packageSource, head, packageDir, patchSha };
}

function queue(f, overrides = {}) {
  return {
    schema_version: C.LEAN_REQUEST_SCHEMA,
    slice_id: 'V2-MATERIALIZED',
    issue_number: 150,
    source_head: 'a'.repeat(40),
    baseline_head: 'b'.repeat(40),
    slice_bootstrap_file: '.github/orchestration/v2-slices/V2-MATERIALIZED/slice-bootstrap.json',
    slice_bootstrap_sha256: 'c'.repeat(64),
    mode: 'RESUME_DELTA',
    operation_kind: 'IMPLEMENT',
    delivery_target: {
      kind: 'EXISTING_PR', application_pr: 181,
      branch: 'kodjo/application', application_head: f.head,
    },
    materialized_recovery: {
      source_run_id: '35515175109',
      source_artifact_id: '10607297220',
      patch_sha256: f.patchSha,
      source_application_head: f.base,
      materialized_head: f.head,
      evidence_kind: 'ARTIFACT_HASH',
    },
    session_id: session,
    prompt_file: '.github/orchestration/v2-slices/V2-MATERIALIZED/implementation-mission.md',
    scope_allow: ['src/a.ts'],
    checks: ['jest', 'typescript', 'lint'],
    request_id: requestId,
    created_at: '2026-09-20T15:30:00.000Z',
    authorized_plan: {
      plan_path: '.github/orchestration/v2-slices/V2-MATERIALIZED/technical-plan.md',
      plan_blob_oid: 'd'.repeat(40), approved_at_commit: 'a'.repeat(40),
      evidence_kind: 'ARTIFACT_HASH',
    },
    independent_review: {
      review_path: '.github/orchestration/v2-slices/V2-MATERIALIZED/independent-review.md',
      review_blob_oid: 'e'.repeat(40), reviewed_plan_blob_oid: 'd'.repeat(40),
      verdict: 'APPROVED', evidence_kind: 'ARTIFACT_HASH',
    },
    user_gate: {
      gate_ref: 'issue_comment:5749822863', gated_reference: 'd'.repeat(40),
      decision: 'APPROVED', user_login: 'MyUncried', evidence_kind: 'ORGANISATIONAL',
    },
    retry_of_run_id: '35515175109',
    retry_reason: {
      code: 'CHECKS_FAILED',
      detail: 'Corriger uniquement les fuites asynchrones démontrées par la revue déterministe.',
    },
    ...overrides,
  };
}

test('IMPLEMENT RESUME_DELTA exige une preuve exacte du recovery déjà matérialisé', () => {
  const f = repositoryFixture();
  try {
    assert.deepEqual(C.validateQueueRequest(queue(f)), []);
    const badRun = queue(f);
    badRun.materialized_recovery = { ...badRun.materialized_recovery, source_run_id: '35515175110' };
    assert.match(C.validateQueueRequest(badRun).map((x) => x.diagnostic).join(','), /KODJO_QUEUE_MATERIALIZED_RECOVERY_REFUSED/);
    const badHead = queue(f);
    badHead.materialized_recovery = { ...badHead.materialized_recovery, materialized_head: f.base };
    assert.match(C.validateQueueRequest(badHead).map((x) => x.diagnostic).join(','), /KODJO_QUEUE_MATERIALIZED_RECOVERY_REFUSED/);
    const initial = queue(f, { mode: 'INITIAL', session_id: null, retry_of_run_id: undefined, retry_reason: undefined });
    assert.match(C.validateQueueRequest(initial).map((x) => x.diagnostic).join(','), /KODJO_QUEUE_MATERIALIZED_RECOVERY_REFUSED/);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('projection conserve la preuve et sépare HEAD protocolaire et HEAD applicatif', () => {
  const f = repositoryFixture();
  try {
    const request = Q.projectQueueRequest(queue(f));
    assert.equal(request.source_head, f.head);
    assert.equal(request.protocol_source_head, 'a'.repeat(40));
    assert.deepEqual(request.materialized_recovery, queue(f).materialized_recovery);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('le plan reste lié au HEAD source quand la livraison matérialisée cible un HEAD plus récent', () => {
  const f = repositoryFixture();
  try {
    const q = queue(f);
    assert.notEqual(q.delivery_target.application_head, q.materialized_recovery.source_application_head);
    assert.equal(
      A.resolveDeclaredPlanApplicationHead(q, q.delivery_target.application_head),
      q.materialized_recovery.source_application_head
    );

    const plain = { ...q };
    delete plain.materialized_recovery;
    assert.equal(
      A.resolveDeclaredPlanApplicationHead(plain, f.base),
      f.base
    );
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('le bridge accepte uniquement le patch intact déjà présent sur le HEAD exact', () => {
  const f = repositoryFixture();
  try {
    const request = Q.projectQueueRequest(queue(f));
    const evidence = R.verifyMaterializedRecoveryPackage(request, {
      packageDir: f.packageDir, cwd: f.dir,
    });
    assert.equal(evidence.status, 'MATERIALIZED_RECOVERY_VERIFIED');
    assert.equal(evidence.patch_sha256, f.patchSha);

    const state = path.join(f.dir, 'state');
    const requestFile = path.join(f.dir, 'request.json');
    fs.writeFileSync(requestFile, JSON.stringify(request));
    const recoveryFile = R.main([requestFile], {
      KODJO_STATE_ROOT: state,
      KODJO_SOURCE_RECOVERY_DIR: f.packageDir,
      KODJO_REPOSITORY_ROOT: f.dir,
    });
    const payload = JSON.parse(fs.readFileSync(recoveryFile, 'utf8'));
    assert.equal(payload.source_head, f.head);
    assert.equal(payload.materialized_recovery.patch_sha256, f.patchSha);
    assert.deepEqual(payload.entries, []);
    assert.deepEqual(L.restoreRecovery(state, f.dir, request).files, []);

    fs.writeFileSync(path.join(f.dir, 'src', 'a.ts'), 'export const value = 3;\n');
    assert.throws(() => R.verifyMaterializedRecoveryPackage(request, {
      packageDir: f.packageDir, cwd: f.dir,
    }), /MATERIALIZED_RECOVERY_NOT_PRESENT/);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});


test('le bridge accepte un paquet récent chaîné tout en conservant la racine cumulative', () => {
  const f = chainedRepositoryFixture();
  try {
    const request = Q.projectQueueRequest(queue(f));
    assert.notEqual(f.base, f.packageSource);
    assert.equal(request.materialized_recovery.source_application_head, f.base);
    const evidence = R.verifyMaterializedRecoveryPackage(request, {
      packageDir: f.packageDir, cwd: f.dir,
    });
    assert.equal(evidence.status, 'MATERIALIZED_RECOVERY_VERIFIED');
    assert.equal(evidence.source_head, f.packageSource);
    assert.equal(evidence.cumulative_source_head, f.base);
    assert.equal(evidence.materialized_head, f.head);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('un paquet chaîné hors de la racine cumulative est refusé avant Claude', () => {
  const f = chainedRepositoryFixture();
  try {
    const request = Q.projectQueueRequest(queue(f));
    request.materialized_recovery = {
      ...request.materialized_recovery,
      source_application_head: f.head,
    };
    assert.throws(() => R.verifyMaterializedRecoveryPackage(request, {
      packageDir: f.packageDir, cwd: f.dir,
    }), /MATERIALIZED_RECOVERY_SOURCE_CHAIN_MISMATCH/);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('preflight peut vérifier le paquet hors checkout applicatif sans prétendre le delta présent', () => {
  const f = repositoryFixture();
  try {
    const request = Q.projectQueueRequest(queue(f));
    git(f.dir, ['checkout', '-q', request.materialized_recovery ? f.base : f.head]);
    const evidence = R.verifyMaterializedRecoveryPackage(request, {
      packageDir: f.packageDir, cwd: f.dir, verifyWorktree: false,
    });
    assert.equal(evidence.status, 'MATERIALIZED_RECOVERY_VERIFIED');
    assert.equal(git(f.dir, ['rev-parse', 'HEAD']), f.base);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('source, portée ou empreinte divergentes sont refusées avant Claude', () => {
  const f = repositoryFixture();
  try {
    const request = Q.projectQueueRequest(queue(f));
    assert.throws(() => R.verifyMaterializedRecoveryPackage({
      ...request, scope_allow: ['src/other.ts'],
    }, { packageDir: f.packageDir, cwd: f.dir }), /MATERIALIZED_RECOVERY_SCOPE_REFUSED/);
    assert.throws(() => R.verifyMaterializedRecoveryPackage({
      ...request,
      materialized_recovery: { ...request.materialized_recovery, patch_sha256: '0'.repeat(64) },
    }, { packageDir: f.packageDir, cwd: f.dir }), /MATERIALIZED_RECOVERY_PROVENANCE_MISMATCH/);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('le chemin supervisé prépare le bridge avant run-local-claude', () => {
  const start = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'start-kodjo-v2.ps1'), 'utf8');
  assert.match(start, /materialized_recovery/);
  assert.ok(start.indexOf('prepare-visual-recovery.js') < start.indexOf('run-local-claude.js'));
  const preflight = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'verify-queue-preflight.js'), 'utf8');
  assert.match(preflight, /verifyMaterializedRecoveryPackage/);
  assert.match(preflight, /verifyWorktree: false/);
});
