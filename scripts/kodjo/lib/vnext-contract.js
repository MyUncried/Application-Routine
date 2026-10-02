'use strict';

const crypto = require('node:crypto');

const SHA40 = /^[0-9a-f]{40}$/;
const SHA64 = /^[0-9a-f]{64}$/;
const SLICE_ID = /^[A-Za-z0-9._-]{1,80}$/;
const STABLE_ID_PREFIX = /^[A-Z][A-Z0-9_]{1,15}$/;

function fail(code, detail) {
  const error = new Error(detail ? `${code}: ${detail}` : code);
  error.code = code;
  throw error;
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function canonicalize(value, path = '$') {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('VNEXT_CANONICAL_NUMBER_INVALID', path);
    return value;
  }
  if (Array.isArray(value)) return value.map((item, index) => canonicalize(item, `${path}[${index}]`));
  if (!isPlainObject(value)) fail('VNEXT_CANONICAL_TYPE_INVALID', path);

  const output = {};
  for (const key of Object.keys(value).sort()) {
    if (value[key] === undefined) fail('VNEXT_CANONICAL_UNDEFINED', `${path}.${key}`);
    output[key] = canonicalize(value[key], `${path}.${key}`);
  }
  return output;
}

function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function canonicalHash(value) {
  return sha256(canonicalStringify(value));
}

function stableId(prefix, parts) {
  if (!STABLE_ID_PREFIX.test(String(prefix || ''))) fail('VNEXT_ID_PREFIX_INVALID', String(prefix));
  if (!Array.isArray(parts) || parts.length === 0) fail('VNEXT_ID_PARTS_INVALID');
  return `${prefix}-${canonicalHash(parts).slice(0, 24)}`;
}

function assertExactKeys(value, required, optional = [], code = 'VNEXT_CONTRACT_KEYS_INVALID') {
  if (!isPlainObject(value)) fail(code, 'object expected');
  const allowed = new Set([...required, ...optional]);
  const missing = required.filter((key) => !Object.prototype.hasOwnProperty.call(value, key));
  const extra = Object.keys(value).filter((key) => !allowed.has(key));
  if (missing.length || extra.length) {
    fail(code, `missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
  }
}

function assertNonEmptyString(value, code, label = 'value') {
  if (typeof value !== 'string' || value.length === 0) fail(code, `${label} must be non-empty text`);
  return value;
}

function assertUnicodeExactText(value, code = 'VNEXT_UNICODE_TEXT_INVALID', label = 'text') {
  assertNonEmptyString(value, code, label);
  if (value.includes('\uFFFD')) fail(code, `${label} contains replacement character U+FFFD`);
  if (/#U[0-9A-Fa-f]{4,6}/.test(value)) fail(code, `${label} contains #Uxxxx degradation`);
  if (/\\u[0-9A-Fa-f]{4}/.test(value)) fail(code, `${label} contains literal \\uXXXX degradation`);
  return value;
}

function assertSha40(value, code, label = 'sha') {
  if (!SHA40.test(String(value || ''))) fail(code, `${label} must be lowercase SHA-40`);
  return value;
}

function assertSha64(value, code, label = 'sha256') {
  if (!SHA64.test(String(value || ''))) fail(code, `${label} must be lowercase SHA-256`);
  return value;
}

function assertSliceId(value, code = 'VNEXT_SLICE_ID_INVALID') {
  if (!SLICE_ID.test(String(value || ''))) fail(code, 'slice_id invalid');
  return value;
}

function assertIsoDate(value, code = 'VNEXT_DATE_INVALID', label = 'date') {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) fail(code, `${label} must be ISO-8601 text`);
  return value;
}

function uniqueStrings(values, code, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(values) || (!allowEmpty && values.length === 0)) fail(code, `${label} array invalid`);
  const out = values.map((value, index) => assertNonEmptyString(value, code, `${label}[${index}]`));
  if (new Set(out).size !== out.length) fail(code, `${label} contains duplicates`);
  return out;
}

function sealContract(value) {
  if (!isPlainObject(value)) fail('VNEXT_CONTRACT_INVALID', 'object expected');
  if (Object.prototype.hasOwnProperty.call(value, 'contract_hash')) fail('VNEXT_CONTRACT_ALREADY_SEALED');
  return Object.freeze({ ...value, contract_hash: canonicalHash(value) });
}

function verifyContractHash(value, code = 'VNEXT_CONTRACT_HASH_MISMATCH') {
  if (!isPlainObject(value)) fail(code, 'object expected');
  assertSha64(value.contract_hash, code, 'contract_hash');
  const unsigned = { ...value };
  delete unsigned.contract_hash;
  const actual = canonicalHash(unsigned);
  if (actual !== value.contract_hash) fail(code, `expected=${value.contract_hash} actual=${actual}`);
  return true;
}

module.exports = {
  SHA40,
  SHA64,
  SLICE_ID,
  fail,
  isPlainObject,
  canonicalize,
  canonicalStringify,
  sha256,
  canonicalHash,
  stableId,
  assertExactKeys,
  assertNonEmptyString,
  assertUnicodeExactText,
  assertSha40,
  assertSha64,
  assertSliceId,
  assertIsoDate,
  uniqueStrings,
  sealContract,
  verifyContractHash,
};
