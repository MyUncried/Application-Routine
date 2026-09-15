#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const COMMENT_REF = /^issue_comment:([1-9][0-9]*)$/;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function issueOfComment(comment) {
  const match = /\/issues\/([1-9][0-9]*)$/.exec(String((comment && comment.issue_url) || ''));
  return match ? Number(match[1]) : null;
}

function ghComment(repository, id) {
  const result = spawnSync('gh', ['api', '-H', 'Accept: application/vnd.github+json',
    'repos/' + repository + '/issues/comments/' + id], {
    encoding: 'utf8', windowsHide: true, shell: false, maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error('KODJO_QUEUE_DELIVERY_CHECKPOINT_UNREADABLE');
  }
  try { return JSON.parse(result.stdout); }
  catch (_) { throw new Error('KODJO_QUEUE_DELIVERY_CHECKPOINT_UNPARSABLE'); }
}

function parseFields(body) {
  const fields = {};
  for (const line of String(body || '').replace(/\r\n/g, '\n').split('\n')) {
    const m = /^([A-Za-z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) fields[m[1]] = m[2].trim();
  }
  return fields;
}

function verify(queueFile, options = {}) {
  const cwd = options.cwd || process.cwd();
  const queue = readJson(path.resolve(cwd, queueFile));
  if (String(queue.operation_kind || 'IMPLEMENT').toUpperCase() !== 'VISUAL_CORRECTION') {
    return { status: 'NOT_APPLICABLE' };
  }
  const cp = queue.delivery_checkpoint;
  const target = queue.delivery_target;
  const match = COMMENT_REF.exec(String(cp && cp.checkpoint_ref || ''));
  if (!match) throw new Error('KODJO_QUEUE_DELIVERY_CHECKPOINT_REF_INVALID');
  const repository = options.repository || process.env.GITHUB_REPOSITORY;
  if (!repository) throw new Error('KODJO_QUEUE_REPOSITORY_MISSING');
  const comment = options.comment || ghComment(repository, match[1]);
  if (Number(comment.id) !== Number(match[1])) throw new Error('KODJO_QUEUE_DELIVERY_CHECKPOINT_ID_MISMATCH');
  if (issueOfComment(comment) !== Number(queue.issue_number)) throw new Error('KODJO_QUEUE_DELIVERY_CHECKPOINT_ISSUE_MISMATCH');
  const body = String(comment.body || '');
  if (!body.includes('[KODJO_V2] APPLICATION_CHECKPOINT')) throw new Error('KODJO_QUEUE_DELIVERY_CHECKPOINT_MARKER_MISSING');
  const fields = parseFields(body);
  const expected = {
    status: 'CERTIFIED',
    slice_id: String(queue.slice_id),
    checkpoint_ref: String(cp.checkpoint_ref),
    application_pr: String(target.application_pr),
    application_head: String(target.application_head),
    protocol_head: String(queue.source_head),
    package_run_id: String(cp.package_run_id),
    package_artifact_id: String(cp.package_artifact_id),
    attestation_blob_oid: String(cp.attestation_blob_oid),
    delivery_head: String(target.application_head),
  };
  for (const [key, value] of Object.entries(expected)) {
    if (String(fields[key] || '') !== value) {
      throw new Error('KODJO_QUEUE_DELIVERY_CHECKPOINT_FIELD_MISMATCH: ' + key);
    }
  }
  if (queue.recovery_migration &&
      String(queue.recovery_migration.attestation_blob_oid || '') !== String(cp.attestation_blob_oid)) {
    throw new Error('KODJO_QUEUE_DELIVERY_CHECKPOINT_ATTESTATION_MISMATCH');
  }
  return {
    status: 'CERTIFIED',
    checkpoint_ref: cp.checkpoint_ref,
    application_pr: target.application_pr,
    application_head: target.application_head,
    protocol_head: queue.source_head,
  };
}

if (require.main === module) {
  try {
    const file = process.argv[2];
    if (!file) throw new Error('USAGE: verify-visual-checkpoint.js <queue.json>');
    const result = verify(file);
    process.stdout.write('[KODJO_V2] visual checkpoint ' + result.status + '\n');
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { verify, parseFields, issueOfComment };
