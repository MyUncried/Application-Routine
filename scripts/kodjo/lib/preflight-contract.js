'use strict';

const crypto = require('node:crypto');

const SCHEMA = 'kodjo.protocol.v2.queue-preflight.v1';
const CHECK_STATUSES = new Set(['PASS','FAIL','BLOCKED','NOT_APPLICABLE']);

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}
function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : canonical(value), 'utf8');
  return crypto.createHash('sha256').update(input).digest('hex');
}
function normalizedChecks(checks) {
  return [...checks].map((row) => ({
    id:String(row.id),
    status:String(row.status),
    source:String(row.source || ''),
    evidence:row.evidence === undefined ? null : row.evidence,
    diagnostic:row.diagnostic === undefined ? null : String(row.diagnostic),
  })).sort((a,b)=>a.id.localeCompare(b.id));
}
function fingerprintInput(attestation) {
  return {
    schema_version: attestation.schema_version,
    queue_path: attestation.queue_path,
    queue_blob_oid: attestation.queue_blob_oid,
    request_id: attestation.request_id,
    event_before: attestation.event_before,
    event_after: attestation.event_after,
    protocol_head: attestation.protocol_head,
    execution_head: attestation.execution_head,
    operation_kind: attestation.operation_kind,
    mode: attestation.mode,
    bindings: attestation.bindings,
    freshness_guards_required: [...attestation.freshness_guards_required].sort(),
    projection_sha256: attestation.projection_sha256,
    prompt_sha256: attestation.prompt_sha256,
    prompt_file_sha256: attestation.prompt_file_sha256 || null,
    prompt_bytes: attestation.prompt_bytes,
    package_lock_sha256: attestation.package_lock_sha256,
    toolchain: attestation.toolchain,
    checks: normalizedChecks(attestation.checks),
  };
}
const REQUIRED_CHECK_IDS = Array.from({length:22}, (_, i) => 'PF-' + String(i + 1).padStart(3, '0'));
function completeChecks(checks) {
  if (!Array.isArray(checks)) return false;
  const ids = checks.map(row => row && row.id).sort();
  return JSON.stringify(ids) === JSON.stringify(REQUIRED_CHECK_IDS);
}
function derivedStatus(checks) {
  return completeChecks(checks) && checks.every(row => row.status === 'PASS' || row.status === 'NOT_APPLICABLE') ? 'PASS' : 'FAIL';
}
function verifyApplicability(attestation, queue) {
  const kind = String(queue.operation_kind || 'IMPLEMENT').toUpperCase();
  if (attestation.operation_kind !== kind || attestation.mode !== String(queue.mode || '').toUpperCase()) {
    throw new Error('PREFLIGHT_OPERATION_MISMATCH');
  }
  const notApplicable = new Set();
  if (queue.recovery_migration === undefined) notApplicable.add('PF-007');
  if (kind === 'IMPLEMENT') { notApplicable.add('PF-008'); notApplicable.add('PF-015'); }
  else if (kind === 'VISUAL_CORRECTION') { notApplicable.add('PF-009'); notApplicable.add('PF-010'); }
  else throw new Error('PREFLIGHT_OPERATION_MISMATCH');
  for (const row of attestation.checks) {
    if ((row.status === 'NOT_APPLICABLE') !== notApplicable.has(row.id)) {
      throw new Error('PREFLIGHT_CHECK_APPLICABILITY_INVALID: ' + row.id);
    }
  }
}
function computeFingerprint(attestation) {
  return sha256(fingerprintInput(attestation));
}
function finalize(attestation) {
  const checks = normalizedChecks(attestation.checks || []);
  for (const row of checks) {
    if (!CHECK_STATUSES.has(row.status)) throw new Error('PREFLIGHT_CHECK_STATUS_INVALID: ' + row.id + ':' + row.status);
  }
  const out = {
    ...attestation,
    schema_version: SCHEMA,
    checks,
    status: derivedStatus(checks),
  };
  out.preflight_fingerprint = computeFingerprint(out);
  return out;
}
function verify(attestation, expected = {}) {
  if (!attestation || attestation.schema_version !== SCHEMA) throw new Error('PREFLIGHT_ATTESTATION_SCHEMA_INVALID');
  if (!['PASS','FAIL'].includes(attestation.status)) throw new Error('PREFLIGHT_ATTESTATION_STATUS_INVALID');
  if (!completeChecks(attestation.checks)) throw new Error('PREFLIGHT_CHECK_COVERAGE_INVALID');
  if (attestation.status !== derivedStatus(attestation.checks)) throw new Error('PREFLIGHT_VERDICT_INCONSISTENT');
  for (const row of attestation.checks) {
    if (!CHECK_STATUSES.has(String(row.status))) throw new Error('PREFLIGHT_CHECK_STATUS_INVALID: ' + String(row.id));
  }
  if (expected.queue_path && attestation.queue_path !== expected.queue_path) throw new Error('PREFLIGHT_QUEUE_PATH_MISMATCH');
  if (expected.queue_blob_oid && attestation.queue_blob_oid !== expected.queue_blob_oid) throw new Error('PREFLIGHT_QUEUE_BLOB_MISMATCH');
  if (expected.request_id && attestation.request_id !== expected.request_id) throw new Error('PREFLIGHT_REQUEST_ID_MISMATCH');
  if (expected.protocol_head && attestation.protocol_head !== expected.protocol_head) throw new Error('PREFLIGHT_PROTOCOL_HEAD_MISMATCH');
  if (expected.execution_head && attestation.execution_head !== expected.execution_head) throw new Error('PREFLIGHT_EXECUTION_HEAD_MISMATCH');
  const actual = computeFingerprint(attestation);
  if (actual !== attestation.preflight_fingerprint) throw new Error('PREFLIGHT_FINGERPRINT_MISMATCH');
  return attestation;
}

module.exports = { REQUIRED_CHECK_IDS, verifyApplicability, SCHEMA, CHECK_STATUSES, canonical, sha256, computeFingerprint, finalize, verify };
