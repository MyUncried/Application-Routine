#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const EVIDENCE_REPOSITORY = 'MyUncried/Application-Routine-KODJO-Evidence';
const EVIDENCE_BRANCH = 'kodjo/protocol-evidence-v2';
const ALLOWED_MEMBERS = new Set([
  'implementation.patch', 'implementation.patch.sha256', 'modified-files.json',
  'manifest.json', 'development-report.md', 'validation.json',
]);

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function safeRelative(value) {
  const normalized = String(value || '').replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || normalized.includes('../') || path.isAbsolute(normalized)) {
    fail('EVIDENCE_PATH_INVALID', 'Non-canonical evidence path: ' + value);
  }
  return normalized;
}

function validateRequest(request) {
  if (request.target_repository !== EVIDENCE_REPOSITORY || request.target_repository_is_fixed !== true)
    fail('EVIDENCE_REPOSITORY_INVALID', 'The evidence repository is fixed and cannot be supplied or changed.');
  if (request.target_branch !== EVIDENCE_BRANCH || request.target_branch_is_fixed !== true)
    fail('EVIDENCE_BRANCH_INVALID', 'The evidence branch is fixed and cannot be supplied or changed.');
  if (request.append_only !== true || request.replaces_existing_path !== false)
    fail('EVIDENCE_APPEND_ONLY_REQUIRED', 'Evidence deposits must be append-only.');
  if (request.contains_applicative_file !== false || request.functional_ref_write_allowed !== false)
    fail('EVIDENCE_APPLICATIVE_CONTENT_FORBIDDEN', 'Applicative files and functional ref writes are forbidden.');
  if (!Array.isArray(request.members) || request.members.length === 0)
    fail('EVIDENCE_MEMBERS_MISSING', 'No evidence member declared.');
  const base = safeRelative(request.canonical_base);
  const prefix = base + '/';
  const seen = new Set();
  for (const member of request.members) {
    if (!ALLOWED_MEMBERS.has(member.member)) fail('EVIDENCE_MEMBER_FORBIDDEN', 'Forbidden member: ' + member.member);
    const canonical = safeRelative(member.canonical_path);
    if (canonical !== prefix + member.member) fail('EVIDENCE_PATH_INVALID', 'Path is not derived from canonical_base.');
    if (seen.has(canonical)) fail('EVIDENCE_PATH_DUPLICATE', 'Duplicate path: ' + canonical);
    if (!/^[0-9a-f]{64}$/.test(String(member.sha256 || ''))) fail('EVIDENCE_HASH_INVALID', 'Invalid sha256.');
    seen.add(canonical);
  }
}

function stageDeposit(requestFile, sourceDir, evidenceTree) {
  const request = JSON.parse(fs.readFileSync(requestFile, 'utf8'));
  validateRequest(request);
  const staged = [];
  for (const member of request.members) {
    const source = path.join(sourceDir, member.member);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) fail('EVIDENCE_SOURCE_MISSING', member.member);
    if (sha256(source) !== member.sha256) fail('EVIDENCE_HASH_MISMATCH', member.member);
    const destination = path.join(evidenceTree, safeRelative(member.canonical_path));
    if (fs.existsSync(destination)) fail('EVIDENCE_PATH_EXISTS', member.canonical_path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
    staged.push(member.canonical_path);
  }
  const receiptPath = path.join(evidenceTree, request.canonical_base, 'deposit-receipt.json');
  if (fs.existsSync(receiptPath)) fail('EVIDENCE_PATH_EXISTS', request.canonical_base + '/deposit-receipt.json');
  fs.writeFileSync(receiptPath, JSON.stringify({
    schema_version: 'kodjo.protocol.v2.evidence-receipt.0.6.10',
    target_repository: EVIDENCE_REPOSITORY,
    target_branch: EVIDENCE_BRANCH,
    canonical_base: request.canonical_base,
    deposited_members: staged,
    request_sha256: sha256(requestFile),
    writer_status: 'DEPOSITED',
  }, null, 2) + '\n');
  return { request, staged, receiptPath };
}

function main() {
  try {
    const requestFile = path.resolve(process.argv[2] || 'evidence-deposit-request.json');
    const sourceDir = path.resolve(process.argv[3] || '.');
    const evidenceTree = path.resolve(process.argv[4] || '.');
    const result = stageDeposit(requestFile, sourceDir, evidenceTree);
    process.stdout.write('EVIDENCE_DEPOSIT_STAGED=' + result.staged.length + '\n');
  } catch (error) {
    process.stderr.write((error.code || 'EVIDENCE_WRITER_FAILED') + ': ' + error.message + '\n');
    process.exitCode = 3;
  }
}

if (require.main === module) main();
module.exports = { ALLOWED_MEMBERS, EVIDENCE_BRANCH, EVIDENCE_REPOSITORY, safeRelative, stageDeposit, validateRequest };
