#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const SHA = /^[0-9a-f]{40}$/;

function git(cwd, args, allowOne = false) {
  const result = spawnSync('git', [
    '-c', 'core.autocrlf=false',
    '-c', 'core.quotepath=false',
    ...args,
  ], { cwd, encoding: null, windowsHide: true });
  if (allowOne && result.status === 1) return null;
  if (result.status !== 0) {
    const detail = Buffer.concat([result.stdout || Buffer.alloc(0), result.stderr || Buffer.alloc(0)])
      .toString('utf8').trim();
    throw new Error(`PLAN_REVIEW_GIT_FAILED: ${detail || args.join(' ')}`);
  }
  return result.stdout || Buffer.alloc(0);
}

function normalizeRepositoryPath(raw) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.includes('\0')) return null;
  if (raw.includes('\\') || raw.startsWith('/') || /^[A-Za-z]:/.test(raw)) return null;
  const parts = raw.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) return null;
  return parts.join('/');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function blobOid(cwd, head, file) {
  const result = spawnSync('git', ['rev-parse', `${head}:${file}`], {
    cwd, encoding: 'utf8', windowsHide: true,
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function isClosedProtocolPath(file) {
  return file.startsWith('.github/workflows/kodjo-v2-') && file.endsWith('.yml') ||
    file.startsWith('.github/orchestration/tests/') ||
    file.startsWith('scripts/kodjo/') ||
    file.startsWith('tests/kodjo/') ||
    file === '.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md' ||
    file === '.github/orchestration/PROTOCOL_EVOLUTION_BACKLOG.md' ||
    file === '.github/orchestration/PACKAGE_MANIFEST.md' ||
    /^\.github\/orchestration\/KODJO_PROTOCOL_V2_SPEC_[0-9.]+\.md$/.test(file) ||
    /^\.github\/orchestration\/CHANGE_REPORT_[0-9._A-Z-]+\.md$/.test(file) ||
    file === 'docs/KODJO-V2-LEAN-OPERATING-CONTRACT.md';
}

function protectedPlanPaths(bootstrapPath, bootstrap) {
  const sliceDir = path.posix.dirname(bootstrapPath);
  const candidates = [
    bootstrapPath,
    bootstrap.activation_registry,
    `${sliceDir}/planning-mission.md`,
    `${sliceDir}/technical-plan.md`,
    `${sliceDir}/independent-review.md`,
    ...(Array.isArray(bootstrap.product_sources)
      ? bootstrap.product_sources.map((source) => source && source.path)
      : []),
  ];
  const normalized = candidates.map(normalizeRepositoryPath);
  if (normalized.some((item) => !item)) throw new Error('PLAN_REVIEW_PROTECTED_PATH_INVALID');
  return [...new Set(normalized)].sort();
}

function writeProof(outputPath, proof) {
  if (!outputPath) return;
  const absolute = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const temporary = `${absolute}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, absolute);
}

function verifyTransition({ cwd, sourceHead, executionHead, bootstrapPath, outputPath }) {
  const proof = {
    schema_version: 'kodjo.protocol.v2.plan-review-transition.0.6.25',
    source_head: sourceHead,
    protocol_execution_head: executionHead,
    bootstrap_path: bootstrapPath,
    status: 'REFUSED',
    reason: null,
    protected_paths: [],
    changed_paths: [],
    protocol_changes: [],
    protected_blobs: [],
    product_source_evidence: [],
    policy: {},
  };
  try {
    if (!SHA.test(sourceHead) || !SHA.test(executionHead)) {
      throw new Error('PLAN_REVIEW_HEAD_INVALID');
    }
    const normalizedBootstrap = normalizeRepositoryPath(bootstrapPath);
    if (!normalizedBootstrap) throw new Error('PLAN_REVIEW_BOOTSTRAP_PATH_INVALID');
    proof.bootstrap_path = normalizedBootstrap;
    const checkedOut = git(cwd, ['rev-parse', 'HEAD']).toString('utf8').trim();
    if (checkedOut !== executionHead) throw new Error('PLAN_REVIEW_EXECUTION_HEAD_MISMATCH');
    const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', sourceHead, executionHead], {
      cwd, encoding: 'utf8', windowsHide: true,
    });
    if (ancestor.status !== 0) throw new Error('PLAN_REVIEW_SOURCE_NOT_ANCESTOR');

    let bootstrap;
    try {
      bootstrap = JSON.parse(git(cwd, ['show', `${sourceHead}:${normalizedBootstrap}`]).toString('utf8'));
    } catch (error) {
      throw new Error(error.message.startsWith('PLAN_REVIEW_GIT_FAILED')
        ? 'PLAN_REVIEW_BOOTSTRAP_MISSING'
        : 'PLAN_REVIEW_BOOTSTRAP_INVALID');
    }
    proof.protected_paths = protectedPlanPaths(normalizedBootstrap, bootstrap);

    proof.protected_blobs = proof.protected_paths.map((file) => ({
      path: file,
      source_oid: blobOid(cwd, sourceHead, file),
      execution_oid: blobOid(cwd, executionHead, file),
    }));
    const alteredBlob = proof.protected_blobs.find((item) =>
      !item.source_oid || !item.execution_oid || item.source_oid !== item.execution_oid);
    if (alteredBlob) {
      proof.protected_changes = [alteredBlob.path];
      throw new Error('PLAN_REVIEW_PRODUCT_INPUT_CHANGED');
    }

    proof.product_source_evidence = bootstrap.product_sources.map((source) => {
      const file = normalizeRepositoryPath(source.path);
      if (!file || !/^[0-9a-f]{64}$/.test(source.sha256 || '')) {
        throw new Error('PLAN_REVIEW_PRODUCT_SOURCE_PROOF_INVALID');
      }
      const sourceObserved = sha256(git(cwd, ['show', `${sourceHead}:${file}`]));
      const executionObserved = sha256(fs.readFileSync(path.join(cwd, file)));
      return {
        path: file,
        declared_sha256: source.sha256,
        source_sha256: sourceObserved,
        execution_sha256: executionObserved,
        declared_hash_matches_source: source.sha256 === sourceObserved,
        transition_matches: sourceObserved === executionObserved,
      };
    });
    if (proof.product_source_evidence.some((item) => !item.transition_matches)) {
      throw new Error('PLAN_REVIEW_PRODUCT_INPUT_CHANGED');
    }

    const raw = git(cwd, ['diff', '--name-only', '-z', sourceHead, executionHead, '--']);
    proof.changed_paths = raw.length === 0
      ? []
      : raw.toString('utf8').split('\0').filter(Boolean).map((file) => {
        const normalized = normalizeRepositoryPath(file);
        if (!normalized) throw new Error('PLAN_REVIEW_CHANGED_PATH_INVALID');
        return normalized;
      }).sort();

    const protectedChanged = proof.changed_paths.filter((file) => proof.protected_paths.includes(file));
    if (protectedChanged.length > 0) {
      proof.protected_changes = protectedChanged;
      throw new Error('PLAN_REVIEW_PRODUCT_INPUT_CHANGED');
    }
    const nonProtocol = proof.changed_paths.filter((file) => !isClosedProtocolPath(file));
    if (nonProtocol.length > 0) {
      proof.non_protocol_changes = nonProtocol;
      throw new Error('PLAN_REVIEW_NON_PROTOCOL_CHANGE');
    }
    proof.protocol_changes = [...proof.changed_paths];
    const policyPaths = [
      'scripts/kodjo/verify-plan-review-transition.js',
      '.github/workflows/kodjo-v2-slice-plan.yml',
      '.github/workflows/kodjo-v2-slice-plan-review.yml',
    ];
    proof.policy = {
      classifier_sha256: sha256(Buffer.from(isClosedProtocolPath.toString(), 'utf8')),
      blobs: policyPaths.map((file) => ({
        path: file,
        source_oid: blobOid(cwd, sourceHead, file),
        execution_oid: blobOid(cwd, executionHead, file),
      })),
    };
    proof.status = 'PASS';
    proof.reason = null;
    writeProof(outputPath, proof);
    return proof;
  } catch (error) {
    proof.reason = error && error.message ? error.message : 'PLAN_REVIEW_TRANSITION_REFUSED';
    writeProof(outputPath, proof);
    const wrapped = new Error(proof.reason);
    wrapped.proof = proof;
    throw wrapped;
  }
}

if (require.main === module) {
  const [sourceHead, executionHead, bootstrapPath, outputPath] = process.argv.slice(2);
  try {
    const proof = verifyTransition({ cwd: process.cwd(), sourceHead, executionHead, bootstrapPath, outputPath });
    process.stdout.write(`${JSON.stringify(proof)}\n`);
  } catch (error) {
    process.stderr.write(`[KODJO_V2] ${error.message}\n`);
    process.exit(1);
  }
}

module.exports = { isClosedProtocolPath, protectedPlanPaths, verifyTransition };
