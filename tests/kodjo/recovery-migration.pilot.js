'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const M = require('../../scripts/kodjo/lib/recovery-migration');

const SESSION = '80daf10b-8c53-4990-af9d-38031814dc20';
const RUN = '34770454986';
const ATTESTATION = '.github/orchestration/v2-slices/V2-BILAT-01/recovery-migration-test.json';

function fixture(options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-certified-migration-'));
  const git = (args, allowFailure = false) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    if (!allowFailure) assert.equal(result.status, 0, 'git ' + args.join(' ') + ': ' + result.stderr);
    return { status: result.status, stdout: String(result.stdout || '').trim() };
  };
  git(['init', '-q', '.']);
  git(['config', 'user.email', 'migration@test.local']);
  git(['config', 'user.name', 'migration']);
  git(['config', 'core.autocrlf', 'false']);
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'app.ts'), 'v1\n');
  git(['add', '-A']); git(['commit', '-qm', 'package source']);
  const source = git(['rev-parse', 'HEAD']).stdout;

  const executable = options.executable || [
    '.github/workflows/kodjo-slice-plan.yml',
    '.github/workflows/kodjo-slice-plan-review.yml',
  ];
  const protocolDocs = options.protocolDocs || ['.github/orchestration/reference.md'];
  const productDocs = options.productDocs || [
    'docs/PRODUCT.md',
    'docs/INDEX.md',
    'docs/Specifications-fonctionnelles/13 – Contrats d’écran.md',
  ];
  const compatibleApplication = options.compatibleApplication || [];
  const certifiedFiles = [...executable, ...protocolDocs, ...productDocs, ...compatibleApplication];
  for (const file of certifiedFiles) {
    const absolute = path.join(root, ...file.split('/'));
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, 'certified ' + file + '\n');
  }
  git(['add', '-A']); git(['commit', '-qm', 'certified intermediate state']);
  const anchor = git(['rev-parse', 'HEAD']).stdout;

  const attestation = {
    schema_version: M.ATTESTATION_SCHEMA,
    status: 'CERTIFIED',
    slice_id: 'V2-BILAT-01',
    source_head: source,
    certified_target_head: options.anchorOverride || anchor,
    baseline_head: 'e'.repeat(40),
    source_run_id: RUN,
    session_id: SESSION,
    certified_protocol_executable_paths: executable,
    certified_protocol_document_paths: protocolDocs,
    certified_product_document_paths: productDocs,
    compatible_application_paths: compatibleApplication,
    post_certification_protocol_files: { [ATTESTATION]: 'SELF' },
  };
  const absoluteAttestation = path.join(root, ...ATTESTATION.split('/'));
  fs.mkdirSync(path.dirname(absoluteAttestation), { recursive: true });
  fs.writeFileSync(absoluteAttestation, JSON.stringify(attestation, null, 2) + '\n');
  git(['add', '-A']); git(['commit', '-qm', 'protocol correction and attestation']);
  const target = git(['rev-parse', 'HEAD']).stdout;
  const oid = git(['rev-parse', 'HEAD:' + ATTESTATION]).stdout;
  const request = {
    slice_id: 'V2-BILAT-01', source_head: target, baseline_head: 'e'.repeat(40),
    session_id: SESSION, retry_of_run_id: RUN,
    recovery_migration: {
      attestation_path: ATTESTATION,
      attestation_blob_oid: oid,
      evidence_kind: 'ARTIFACT_HASH',
    },
  };
  const manifest = {
    slice_id: 'V2-BILAT-01', source_head: source, baseline_head: 'e'.repeat(40),
    session_id: SESSION,
  };
  return { root, git, source, anchor, target, request, manifest, absoluteAttestation };
}

function certify(f, recovered = ['src/app.ts']) {
  return M.certifyRecoverySourceMigration(f.manifest, 'non-empty patch', recovered, f.root, f.request);
}

test('run 34851607031 — documents approuvés et workflows historiques passent avec une référence certifiée', () => {
  const f = fixture();
  const evidence = certify(f);
  assert.equal(evidence.status, 'PASS');
  assert.equal(evidence.mode, 'CERTIFIED_REFERENCE_FAST_FORWARD');
  assert.deepEqual(evidence.certified_protocol_executable_paths, [
    '.github/workflows/kodjo-slice-plan-review.yml',
    '.github/workflows/kodjo-slice-plan.yml',
  ]);
  assert.ok(evidence.certified_product_document_paths.includes('docs/PRODUCT.md'));
});

test('un changement applicatif intermédiaire non autorisé est refusé', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.root, 'src', 'other.ts'), 'upstream\n');
  f.git(['add', '-A']); f.git(['commit', '-qm', 'unattested application change']);
  f.request.source_head = f.git(['rev-parse', 'HEAD']).stdout;
  assert.throws(() => certify(f), /RECOVERY_MIGRATION_UNCERTIFIED_DIFFERENCE/);
});

test('la version 0.6.23 n’accepte aucune compatibilité applicative déclarative', () => {
  const f = fixture({ compatibleApplication: ['src/other.ts'] });
  assert.throws(() => certify(f), /RECOVERY_MIGRATION_APPLICATION_CHANGE_NOT_SUPPORTED/);
});

test('un chevauchement entre paquet et changement certifié est refusé', () => {
  const f = fixture();
  assert.throws(() => certify(f, ['docs/PRODUCT.md']),
    /RECOVERY_MIGRATION_PATH_OVERLAP: docs\/PRODUCT\.md/);
});

test('un HEAD source non ancêtre du HEAD certifié est refusé', () => {
  const f = fixture();
  f.git(['checkout', '-qb', 'unrelated', f.source]);
  fs.writeFileSync(path.join(f.root, 'unrelated.txt'), 'x\n');
  f.git(['add', '-A']); f.git(['commit', '-qm', 'unrelated anchor']);
  const unrelated = f.git(['rev-parse', 'HEAD']).stdout;
  f.git(['checkout', '-q', '-']);
  const body = JSON.parse(fs.readFileSync(f.absoluteAttestation, 'utf8'));
  body.certified_target_head = unrelated;
  fs.writeFileSync(f.absoluteAttestation, JSON.stringify(body, null, 2) + '\n');
  f.git(['add', '-A']); f.git(['commit', '-qm', 'bad anchor attestation']);
  f.request.source_head = f.git(['rev-parse', 'HEAD']).stdout;
  f.request.recovery_migration.attestation_blob_oid = f.git(['rev-parse', 'HEAD:' + ATTESTATION]).stdout;
  assert.throws(() => certify(f), /RECOVERY_SOURCE_HEAD_NOT_ANCESTOR|RECOVERY_CERTIFIED_TARGET_NOT_ANCESTOR/);
});

test('une attestation absente ou d’empreinte incorrecte est refusée avant restauration', () => {
  const f = fixture();
  const without = { ...f.request }; delete without.recovery_migration;
  assert.throws(() => M.certifyRecoverySourceMigration(
    f.manifest, 'non-empty patch', ['src/app.ts'], f.root, without),
  /RECOVERY_MIGRATION_ATTESTATION_REQUIRED/);
  f.request.recovery_migration.attestation_blob_oid = 'a'.repeat(40);
  assert.throws(() => certify(f), /RECOVERY_MIGRATION_ATTESTATION_BLOB_MISMATCH/);
});

test('une différence documentaire non rattachée à la référence est refusée', () => {
  const f = fixture();
  fs.mkdirSync(path.join(f.root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(f.root, 'docs', 'UNRELATED.md'), 'not certified\n');
  f.git(['add', '-A']); f.git(['commit', '-qm', 'unattested docs']);
  f.request.source_head = f.git(['rev-parse', 'HEAD']).stdout;
  assert.throws(() => certify(f), /RECOVERY_MIGRATION_UNCERTIFIED_DIFFERENCE/);
});

test('une provenance de run, session ou baseline incohérente est refusée', () => {
  for (const mutation of [
    (f) => { f.request.retry_of_run_id = '999'; },
    (f) => { f.manifest.session_id = '550e8400-e29b-41d4-a716-446655440000'; },
    (f) => { f.manifest.baseline_head = 'b'.repeat(40); },
  ]) {
    const f = fixture(); mutation(f);
    assert.throws(() => certify(f), /RECOVERY_MIGRATION_PROVENANCE_MISMATCH/);
  }
});
