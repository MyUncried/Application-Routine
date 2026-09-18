#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const SHA40 = /^[0-9a-f]{40}$/;
const ID = /^[1-9][0-9]*$/;

function fail(code, detail) {
  throw new Error(code + (detail ? ': ' + detail : ''));
}
function text(file) {
  return fs.readFileSync(path.resolve(file), 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
function json(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}
function firstLine(body) {
  return String(body || '').replace(/^\uFEFF/, '').split('\n')[0];
}
function fields(body, name) {
  const re = new RegExp('^' + name + '=([^\\n]+)$', 'gm');
  return [...String(body || '').matchAll(re)].map((m) => m[1].trim());
}
function one(body, name, code) {
  const values = fields(body, name);
  if (values.length !== 1 || !values[0]) fail(code || 'V2_FINAL_FIELD_INVALID', name);
  return values[0];
}
function taggedJson(body, tag) {
  const re = new RegExp('<' + tag + '>\\s*([\\s\\S]*?)\\s*</' + tag + '>');
  const m = re.exec(String(body || ''));
  if (!m) fail('V2_FINAL_REVIEW_CONTRACT_MISSING', tag);
  try { return JSON.parse(m[1]); }
  catch (_) { fail('V2_FINAL_REVIEW_CONTRACT_INVALID', tag); }
}
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}
function sha256(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : canonical(value), 'utf8').digest('hex');
}

function verify(args) {
  const [reviewFile, implementationFile, visualFile, queueFile, issueRaw, reviewId, visualId, outputFile] = args;
  if (!reviewFile || !implementationFile || !visualFile || !queueFile || !issueRaw || !reviewId || !visualId || !outputFile) {
    fail('USAGE', 'verify-v2-finalization.js <review.md> <implementation.md> <visual.md> <queue.json> <issue> <review_id> <visual_id> <output.json>');
  }
  const issue = Number(issueRaw);
  if (!Number.isInteger(issue) || issue < 1 || !ID.test(String(reviewId)) || !ID.test(String(visualId))) {
    fail('V2_FINAL_IDENTITY_INVALID');
  }

  const review = text(reviewFile);
  const implementation = text(implementationFile);
  const visual = text(visualFile);
  const queue = json(queueFile);

  if (firstLine(review) !== '[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT') fail('V2_FINAL_REVIEW_MARKER_INVALID');
  if (one(review, 'verdict') !== 'APPROVE') fail('V2_FINAL_REVIEW_NOT_APPROVED');
  if (!/^STATUT : IMPLEMENTATION_REVIEW_APPROVED$/m.test(review)) fail('V2_FINAL_REVIEW_STATUS_INVALID');

  if (firstLine(implementation) !== '[KODJO_SLICE] IMPLEMENTATION_OUTPUT') fail('V2_FINAL_IMPLEMENTATION_MARKER_INVALID');
  if (one(implementation, 'continuity_origin') !== 'V2_LEAN_QUEUE') fail('V2_FINAL_NOT_V2');
  if (!/^STATUT : IMPLEMENTATION_READY_FOR_REVIEW$/m.test(implementation)) fail('V2_FINAL_IMPLEMENTATION_STATUS_INVALID');

  if (firstLine(visual) !== '[KODJO_SLICE] VISUAL_APPROVED') fail('V2_FINAL_VISUAL_MARKER_INVALID');

  const slice = one(review, 'slice_id');
  const implSlice = one(implementation, 'slice_id');
  const visualSlice = one(visual, 'slice_id');
  if (slice !== implSlice || slice !== visualSlice || slice !== String(queue.slice_id || '')) fail('V2_FINAL_SLICE_MISMATCH');

  const head = one(review, 'head');
  const implHead = one(implementation, 'head');
  const visualHead = one(visual, 'head');
  if (!SHA40.test(head) || head !== implHead || head !== visualHead) fail('V2_FINAL_HEAD_MISMATCH');

  const baseHead = one(implementation, 'base_head');
  if (!SHA40.test(baseHead)) fail('V2_FINAL_BASE_HEAD_INVALID');

  const reviewSourceImplementation = one(review, 'source_implementation_comment_id');
  const visualReviewId = one(visual, 'source_review_comment_id');
  if (visualReviewId !== String(reviewId)) fail('V2_FINAL_VISUAL_REVIEW_MISMATCH');
  if (!ID.test(reviewSourceImplementation)) fail('V2_FINAL_IMPLEMENTATION_COMMENT_INVALID');

  const queuePathFromImplementation = one(implementation, 'v2_queue_path');
  const normalizedQueuePath = String(queueFile).replace(/\\/g, '/');
  const marker = '.github/orchestration/queue/v2/';
  const markerIndex = normalizedQueuePath.indexOf(marker);
  const repoQueuePath = markerIndex >= 0 ? normalizedQueuePath.slice(markerIndex) : normalizedQueuePath;
  if (queuePathFromImplementation !== repoQueuePath) fail('V2_FINAL_QUEUE_PATH_MISMATCH');

  if (Number(queue.issue_number) !== issue || String(queue.slice_id) !== slice) fail('V2_FINAL_QUEUE_IDENTITY_MISMATCH');
  if (queue.schema_version !== 'kodjo.protocol.v2.lean-request.0.6.13') fail('V2_FINAL_QUEUE_SCHEMA_MISMATCH');
  if (!queue.authorized_plan || !/^[0-9a-f]{40}$/.test(String(queue.authorized_plan.plan_blob_oid || ''))) {
    fail('V2_FINAL_PLAN_BINDING_MISSING');
  }

  const applicationBranch = one(implementation, 'application_branch');
  const applicationPr = Number(one(implementation, 'application_pr'));
  if (!Number.isInteger(applicationPr) || applicationPr < 1 || !applicationBranch || applicationBranch.includes('..')) {
    fail('V2_FINAL_APPLICATION_TARGET_INVALID');
  }

  const reviewContract = taggedJson(review, 'KODJO_UI_IMPLEMENTATION_REVIEW_JSON');
  if (reviewContract.schema !== 'kodjo.ui-implementation-review.v1' || reviewContract.verdict !== 'APPROVE') {
    fail('V2_FINAL_REVIEW_CONTRACT_NOT_APPROVED');
  }
  const deviceField = one(review, 'device_gate_required');
  if (!['true','false'].includes(deviceField)) fail('V2_FINAL_DEVICE_GATE_INVALID');
  const deviceGateRequired = deviceField === 'true';
  if (Boolean(reviewContract.device_gate_required) !== deviceGateRequired) fail('V2_FINAL_DEVICE_GATE_MISMATCH');

  const criteria = Array.isArray(reviewContract.criteria) ? reviewContract.criteria : [];
  const ids = criteria.map((c) => String(c && c.criterion_id || ''));
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) fail('V2_FINAL_CRITERIA_INVALID');
  for (const criterion of criteria) {
    if (criterion.implementation_status !== 'CONFORME' || criterion.preserve_status !== 'PASS') {
      fail('V2_FINAL_CRITERION_NOT_CLOSED', String(criterion.criterion_id));
    }
    const proofs = Array.isArray(criterion.proof_results) ? criterion.proof_results : [];
    for (const proof of proofs) {
      const type = String(proof.proof_type || '');
      const status = String(proof.status || '');
      if (type === 'VISUAL_COMPARE' || type === 'DEVICE_CHECK') {
        if (status !== 'PENDING_DEVICE') fail('V2_FINAL_DEVICE_PROOF_PRE_GATE_INVALID', String(criterion.criterion_id) + ':' + type);
      } else if (status !== 'PASS') {
        fail('V2_FINAL_TECHNICAL_PROOF_NOT_PASS', String(criterion.criterion_id) + ':' + type);
      }
    }
  }
  const boundaries = Array.isArray(reviewContract.boundary_results) ? reviewContract.boundary_results : [];
  if (boundaries.some((row) => String(row && row.status || '') !== 'PASS')) fail('V2_FINAL_BOUNDARY_NOT_PASS');

  const result = {
    schema: 'kodjo.ui-final-verification.v1',
    slice_id: slice,
    issue_number: issue,
    head,
    base_head: baseHead,
    application_branch: applicationBranch,
    application_pr: applicationPr,
    queue_path: queuePathFromImplementation,
    plan_blob_oid: String(queue.authorized_plan.plan_blob_oid),
    implementation_review_comment_id: String(reviewId),
    implementation_comment_id: reviewSourceImplementation,
    human_device_approval_comment_id: String(visualId),
    device_gate_required: deviceGateRequired,
    criterion_count: ids.length,
    criterion_ids_sha256: sha256(ids.slice().sort()),
    technical_review_sha256: sha256(reviewContract),
    device_evidence_satisfied: true,
    final_status: 'READY_TO_CLOSE',
  };
  fs.writeFileSync(path.resolve(outputFile), JSON.stringify(result, null, 2) + '\n', 'utf8');
  return result;
}

try {
  const result = verify(process.argv.slice(2));
  process.stdout.write('[KODJO_V2] finalization verified — slice=' + result.slice_id +
    ' head=' + result.head.slice(0, 12) + ' device=' + result.device_gate_required + '\n');
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}

module.exports = { verify };
