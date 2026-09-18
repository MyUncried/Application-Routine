'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BOOTSTRAP_SCHEMA = 'kodjo.protocol.v2.slice-bootstrap.0.6.12';
const REGISTRY_SCHEMA = 'kodjo.protocol.v2.activation-registry.0.6.12';
const SHA40 = /^[0-9a-f]{40}$/;
const SHA64 = /^[0-9a-f]{64}$/;
const SLICE_ID = /^[A-Za-z0-9._-]{1,80}$/;

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function fail(code) { throw new Error(code); }
function strings(value, code, allowEmpty = false) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.some((v) => typeof v !== 'string' || !v)) fail(code);
  return [...value];
}

function validateBootstrap(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('SLICE_BOOTSTRAP_INVALID');
  if (raw.schema_version !== BOOTSTRAP_SCHEMA) fail('SLICE_BOOTSTRAP_SCHEMA_UNSUPPORTED');
  if (!SLICE_ID.test(String(raw.slice_id || ''))) fail('SLICE_BOOTSTRAP_SLICE_ID_INVALID');
  if (!Number.isInteger(raw.issue_number) || raw.issue_number < 1) fail('SLICE_BOOTSTRAP_ISSUE_INVALID');
  if (typeof raw.repository !== 'string' || !/^[^/\s]+\/[^/\s]+$/.test(raw.repository)) fail('SLICE_BOOTSTRAP_REPOSITORY_INVALID');
  if (typeof raw.target_branch !== 'string' || !raw.target_branch) fail('SLICE_BOOTSTRAP_TARGET_BRANCH_INVALID');
  if (!SHA40.test(String(raw.baseline_head || ''))) fail('SLICE_BOOTSTRAP_BASELINE_HEAD_INVALID');
  if (raw.planning_application_head !== undefined && !SHA40.test(String(raw.planning_application_head || ''))) fail('SLICE_BOOTSTRAP_PLANNING_APPLICATION_HEAD_INVALID');
  if (raw.protocol_version !== '0.6.12') fail('SLICE_BOOTSTRAP_PROTOCOL_VERSION_INVALID');
  if (!SHA40.test(String(raw.protocol_commit || ''))) fail('SLICE_BOOTSTRAP_PROTOCOL_COMMIT_INVALID');
  if (raw.activation_registry !== '.github/orchestration/v2-activation-registry.json') fail('SLICE_BOOTSTRAP_REGISTRY_PATH_INVALID');
  if (raw.previous_slice_id !== null && !SLICE_ID.test(String(raw.previous_slice_id || ''))) fail('SLICE_BOOTSTRAP_PREVIOUS_SLICE_INVALID');
  if (raw.previous_checkpoint !== null && !SHA64.test(String(raw.previous_checkpoint || ''))) fail('SLICE_BOOTSTRAP_PREVIOUS_CHECKPOINT_INVALID');
  if (!Array.isArray(raw.product_sources) || raw.product_sources.length === 0 || raw.product_sources.some((v) => !v || typeof v.path !== 'string' || !v.path || !SHA64.test(String(v.sha256 || '')))) fail('SLICE_BOOTSTRAP_PRODUCT_SOURCES_INVALID');
  strings(raw.authorized_actors, 'SLICE_BOOTSTRAP_AUTHORIZED_ACTORS_INVALID');
  if (typeof raw.created_at !== 'string' || Number.isNaN(Date.parse(raw.created_at))) fail('SLICE_BOOTSTRAP_CREATED_AT_INVALID');
  const copy = JSON.parse(JSON.stringify(raw));
  delete copy.slice_bootstrap_sha256;
  const expected = sha256(canonical(copy));
  if (raw.slice_bootstrap_sha256 !== expected) fail('SLICE_BOOTSTRAP_HASH_MISMATCH');
  return { bootstrap: raw, hash: expected };
}

function validateRegistry(raw, bootstrap) {
  if (!raw || raw.schema_version !== REGISTRY_SCHEMA || !Array.isArray(raw.activations)) fail('ACTIVATION_REGISTRY_INVALID');
  const matches = raw.activations.filter((a) => a && a.slice_id === bootstrap.slice_id);
  if (matches.length !== 1) fail(matches.length ? 'ACTIVATION_REGISTRY_DUPLICATE' : 'SLICE_NOT_ACTIVATED');
  const a = matches[0];
  if (a.status !== 'ACTIVE') fail('SLICE_NOT_ACTIVE');
  if (a.issue_number !== bootstrap.issue_number || a.baseline_head !== bootstrap.baseline_head || a.bootstrap_path !== `.github/orchestration/v2-slices/${bootstrap.slice_id}/slice-bootstrap.json` || a.slice_bootstrap_sha256 !== bootstrap.slice_bootstrap_sha256) fail('ACTIVATION_BINDING_MISMATCH');
  const bootstrapPlanningHead = bootstrap.planning_application_head;
  const activationPlanningHead = a.planning_application_head;
  if ((bootstrapPlanningHead !== undefined || activationPlanningHead !== undefined) && bootstrapPlanningHead !== activationPlanningHead) fail('ACTIVATION_PLANNING_APPLICATION_HEAD_MISMATCH');
  return a;
}

function loadAndValidate(repoRoot, bootstrapPath, registryPath) {
  const root = path.resolve(repoRoot);
  const bp = path.resolve(root, bootstrapPath);
  const rp = path.resolve(root, registryPath || '.github/orchestration/v2-activation-registry.json');
  if (!bp.startsWith(root + path.sep) || !fs.statSync(bp).isFile()) fail('SLICE_BOOTSTRAP_FILE_INVALID');
  if (!rp.startsWith(root + path.sep) || !fs.statSync(rp).isFile()) fail('ACTIVATION_REGISTRY_FILE_INVALID');
  const result = validateBootstrap(JSON.parse(fs.readFileSync(bp, 'utf8')));
  validateRegistry(JSON.parse(fs.readFileSync(rp, 'utf8')), result.bootstrap);
  return result;
}

module.exports = { BOOTSTRAP_SCHEMA, REGISTRY_SCHEMA, canonical, sha256, validateBootstrap, validateRegistry, loadAndValidate };
