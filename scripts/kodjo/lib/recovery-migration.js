'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ATTESTATION_SCHEMA = 'kodjo.protocol.v2.recovery-migration.0.6.24';
const LEGACY_ATTESTATION_SCHEMA = 'kodjo.protocol.v2.recovery-migration.0.6.23';
const SHA40 = /^[0-9a-f]{40}$/;

function command(args, cwd, timeout = 120000) {
  const result = spawnSync('git', args, {
    cwd, encoding: 'utf8', windowsHide: true, shell: false, timeout,
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    ok: !result.error && result.status === 0,
    stdout: String(result.stdout || ''),
    stderr: String(result.stderr || ''),
    error: result.error || null,
  };
}

function fail(code, detail) {
  throw new Error(code + (detail ? ': ' + detail : ''));
}

function normalizedPath(value) {
  const normalized = String(value || '').replace(/\\/g, '/');
  if (!normalized || path.posix.isAbsolute(normalized) || normalized.includes('..') || normalized.includes('\0')) {
    fail('RECOVERY_MIGRATION_ATTESTATION_PATH_INVALID', normalized);
  }
  return normalized;
}

function sortedUnique(values, field) {
  if (!Array.isArray(values)) fail('RECOVERY_MIGRATION_ATTESTATION_INVALID', field + ' doit etre une liste');
  const normalized = values.map(normalizedPath);
  if (new Set(normalized).size !== normalized.length) {
    fail('RECOVERY_MIGRATION_ATTESTATION_INVALID', field + ' contient un doublon');
  }
  return normalized.sort();
}

function diffPaths(from, to, cwd) {
  const result = command(['diff', '--name-only', '-z', '--no-renames', from, to, '--'], cwd);
  if (!result.ok) {
    fail('RECOVERY_MIGRATION_DIFF_FAILED', result.error ? result.error.message : result.stderr.trim());
  }
  return result.stdout.split('\0').filter(Boolean).map(normalizedPath).sort();
}

function isAncestor(from, to, cwd) {
  return command(['merge-base', '--is-ancestor', from, to], cwd, 60000).ok;
}

function blobAt(commit, file, cwd, code) {
  const result = command(['rev-parse', commit + ':' + file], cwd, 60000);
  if (!result.ok) fail(code, file + ' a ' + commit);
  return result.stdout.trim();
}

function readBlob(oid, cwd) {
  const result = command(['cat-file', 'blob', oid], cwd, 60000);
  if (!result.ok) fail('RECOVERY_MIGRATION_ATTESTATION_UNREADABLE', oid);
  return result.stdout;
}

function sameList(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function isPostCertificationProtocolPath(file, sliceId) {
  return file.startsWith('scripts/kodjo/') || file.startsWith('tests/kodjo/') ||
    file.startsWith('tests/fixtures/qualif/') ||
    file.startsWith('.github/workflows/kodjo-v2-') ||
    file === '.github/orchestration/lean-request.schema.json' ||
    file === '.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md' ||
    file.startsWith('.github/orchestration/v2-slices/' + sliceId + '/recovery-migration-');
}

function isCertifiedExecutablePath(file) {
  return file.startsWith('scripts/kodjo/') || file.startsWith('tests/kodjo/') ||
    file.startsWith('tests/fixtures/qualif/') || file.startsWith('.github/workflows/kodjo-v2-') ||
    file === '.github/workflows/kodjo-slice-plan.yml' ||
    file === '.github/workflows/kodjo-slice-plan-review.yml' ||
    file === '.github/workflows/kodjo-slice-implementation-review.yml';
}

function loadAttestation(repoRoot, request) {
  const reference = request.recovery_migration;
  if (!reference || typeof reference !== 'object' || Array.isArray(reference)) {
    fail('RECOVERY_MIGRATION_ATTESTATION_REQUIRED');
  }
  const attestationPath = normalizedPath(reference.attestation_path);
  if (!SHA40.test(String(reference.attestation_blob_oid || ''))) {
    fail('RECOVERY_MIGRATION_ATTESTATION_BLOB_INVALID');
  }
  if (reference.evidence_kind !== 'ARTIFACT_HASH') {
    fail('RECOVERY_MIGRATION_ATTESTATION_EVIDENCE_INVALID');
  }
  const targetOid = blobAt(request.source_head, attestationPath, repoRoot,
    'RECOVERY_MIGRATION_ATTESTATION_NOT_AT_TARGET');
  if (targetOid !== reference.attestation_blob_oid) {
    fail('RECOVERY_MIGRATION_ATTESTATION_BLOB_MISMATCH', targetOid);
  }
  let attestation;
  try { attestation = JSON.parse(readBlob(targetOid, repoRoot).replace(/^\uFEFF/, '')); }
  catch (error) { fail('RECOVERY_MIGRATION_ATTESTATION_INVALID', error.message); }
  return { reference, attestationPath, attestation };
}

function verifyIdentity(attestation, manifest, request) {
  if (![ATTESTATION_SCHEMA, LEGACY_ATTESTATION_SCHEMA].includes(attestation.schema_version)) {
    fail('RECOVERY_MIGRATION_ATTESTATION_SCHEMA_UNSUPPORTED');
  }
  if (attestation.status !== 'CERTIFIED') fail('RECOVERY_MIGRATION_ATTESTATION_NOT_CERTIFIED');
  const exact = [
    ['slice_id', manifest.slice_id],
    ['source_head', manifest.source_head],
    ['baseline_head', manifest.baseline_head],
    ['source_run_id', String(request.retry_of_run_id || '')],
    ['session_id', manifest.session_id],
  ];
  for (const [field, expected] of exact) {
    if (String(attestation[field] || '') !== String(expected || '')) {
      fail('RECOVERY_MIGRATION_PROVENANCE_MISMATCH', field);
    }
  }
  if (!SHA40.test(String(attestation.certified_target_head || ''))) {
    fail('RECOVERY_MIGRATION_CERTIFIED_TARGET_INVALID');
  }
}

function verifyPostCertificationFiles(attestation, attestationPath, targetHead, repoRoot) {
  const expected = attestation.post_certification_protocol_files;
  if (!expected || typeof expected !== 'object' || Array.isArray(expected)) {
    fail('RECOVERY_MIGRATION_ATTESTATION_INVALID', 'post_certification_protocol_files');
  }
  const paths = Object.keys(expected).map(normalizedPath).sort();
  if (!paths.includes(attestationPath)) {
    fail('RECOVERY_MIGRATION_ATTESTATION_INVALID', 'auto-reference absente');
  }
  const invalid = paths.filter((file) => !isPostCertificationProtocolPath(file, attestation.slice_id));
  if (invalid.length) fail('RECOVERY_MIGRATION_POST_PROTOCOL_PATH_INVALID', invalid.join(', '));
  for (const file of paths) {
    if (file === attestationPath) continue;
    if (!SHA40.test(String(expected[file] || ''))) {
      fail('RECOVERY_MIGRATION_POST_PROTOCOL_BLOB_INVALID', file);
    }
    const actual = blobAt(targetHead, file, repoRoot, 'RECOVERY_MIGRATION_POST_PROTOCOL_FILE_MISSING');
    if (actual !== expected[file]) fail('RECOVERY_MIGRATION_POST_PROTOCOL_BLOB_MISMATCH', file);
  }
  return paths;
}

function certifyRecoverySourceMigration(manifest, patch, recoveredPaths, repoRoot, request) {
  const evidence = {
    required: manifest.source_head !== request.source_head,
    source_head: manifest.source_head,
    target_head: request.source_head,
    certified_target_head: null,
    attestation_path: null,
    attestation_blob_oid: null,
    certified_protocol_executable_paths: [],
    certified_protocol_document_paths: [],
    certified_product_document_paths: [],
    compatible_application_paths: [],
    post_certification_protocol_paths: [],
    intervening_paths: [],
    status: 'NOT_REQUIRED',
  };
  if (!evidence.required) return evidence;
  if (recoveredPaths.length === 0 && patch.length === 0) {
    evidence.mode = 'STRICTLY_EMPTY_PACKAGE'; evidence.status = 'PASS'; return evidence;
  }
  const head = command(['rev-parse', 'HEAD'], repoRoot, 60000);
  if (!head.ok || head.stdout.trim() !== request.source_head) fail('RECOVERY_TARGET_HEAD_NOT_CHECKED_OUT');

  const loaded = loadAttestation(repoRoot, request);
  const attestation = loaded.attestation;
  verifyIdentity(attestation, manifest, request);
  const anchor = attestation.certified_target_head;
  if (!isAncestor(manifest.source_head, anchor, repoRoot)) fail('RECOVERY_SOURCE_HEAD_NOT_ANCESTOR');
  if (!isAncestor(anchor, request.source_head, repoRoot)) fail('RECOVERY_CERTIFIED_TARGET_NOT_ANCESTOR');

  const executable = sortedUnique(attestation.certified_protocol_executable_paths, 'certified_protocol_executable_paths');
  const protocolDocs = sortedUnique(attestation.certified_protocol_document_paths, 'certified_protocol_document_paths');
  const productDocs = sortedUnique(attestation.certified_product_document_paths, 'certified_product_document_paths');
  const compatibleApplication = sortedUnique(attestation.compatible_application_paths, 'compatible_application_paths');
  const misclassified = [
    ...executable.filter((file) => !isCertifiedExecutablePath(file)),
    ...protocolDocs.filter((file) => !file.startsWith('.github/orchestration/')),
    ...productDocs.filter((file) => !file.startsWith('docs/')),
  ].sort();
  if (misclassified.length) {
    fail('RECOVERY_MIGRATION_PATH_CLASSIFICATION_INVALID', misclassified.join(', '));
  }
  if (compatibleApplication.length) {
    fail('RECOVERY_MIGRATION_APPLICATION_CHANGE_NOT_SUPPORTED', compatibleApplication.join(', '));
  }
  const certifiedUnion = [...new Set([...executable, ...protocolDocs, ...productDocs, ...compatibleApplication])].sort();
  const certifiedActual = diffPaths(manifest.source_head, anchor, repoRoot);
  if (!sameList(certifiedActual, certifiedUnion)) {
    fail('RECOVERY_MIGRATION_CERTIFIED_DIFF_MISMATCH', certifiedActual.join(', '));
  }

  const postPaths = verifyPostCertificationFiles(attestation, loaded.attestationPath,
    request.source_head, repoRoot);
  const postActual = diffPaths(anchor, request.source_head, repoRoot);
  if (!sameList(postActual, postPaths)) {
    fail('RECOVERY_MIGRATION_UNCERTIFIED_DIFFERENCE', postActual.join(', '));
  }

  const intervening = [...new Set([...certifiedActual, ...postActual])].sort();
  const recovered = new Set(recoveredPaths.map(normalizedPath));
  const overlap = intervening.filter((file) => recovered.has(file));
  if (overlap.length) fail('RECOVERY_MIGRATION_PATH_OVERLAP', overlap.join(', '));

  evidence.mode = 'CERTIFIED_REFERENCE_FAST_FORWARD';
  evidence.certified_target_head = anchor;
  evidence.attestation_path = loaded.attestationPath;
  evidence.attestation_blob_oid = loaded.reference.attestation_blob_oid;
  evidence.certified_protocol_executable_paths = executable;
  evidence.certified_protocol_document_paths = protocolDocs;
  evidence.certified_product_document_paths = productDocs;
  evidence.compatible_application_paths = compatibleApplication;
  evidence.post_certification_protocol_paths = postActual;
  evidence.intervening_paths = intervening;
  evidence.status = 'PASS';
  return evidence;
}

module.exports = {
  ATTESTATION_SCHEMA, LEGACY_ATTESTATION_SCHEMA,
  certifyRecoverySourceMigration, diffPaths, loadAttestation,
};
