#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { verifyTransition } = require('./verify-plan-review-transition');

const {extractTaggedJson}=require('./lib/plan-impact');
const {resolveImplementationReviewPolicy}=require('./resolve-implementation-review-policy');

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
  const gateRef = String(queue.user_gate && queue.user_gate.gate_ref || '');
  const gateMatch = COMMENT_REF.exec(gateRef);
  if (!gateMatch) throw new Error('VISUAL_CORRECTION_GATE_REF_INVALID');
  const expected = {
    status: 'CERTIFIED',
    slice_id: String(queue.slice_id),
    checkpoint_ref: String(cp.checkpoint_ref),
    application_pr: String(target.application_pr),
    application_head: String(target.application_head),
    plan_blob_oid: String(queue.authorized_plan && queue.authorized_plan.plan_blob_oid || ''),
    review_blob_oid: String(queue.independent_review && queue.independent_review.review_blob_oid || ''),
    gate_comment_id: String(gateMatch[1]),
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

  const transition = options.transitionVerifier || verifyTransition;
  let transitionProof;
  try {
    transitionProof = transition({
      cwd,
      sourceHead: String(queue.authorized_plan && queue.authorized_plan.approved_at_commit || ''),
      executionHead: String(queue.source_head || ''),
      bootstrapPath: String(queue.slice_bootstrap_file || ''),
      outputPath: options.transitionProofPath,
    });
  } catch (error) {
    const diagnostic=String(error && error.message ? error.message : error);
    if (/^PLAN_REVIEW_(PRODUCT_INPUT_CHANGED|NON_PROTOCOL_CHANGE|PRODUCT_SOURCE_PROOF_INVALID)\b/.test(diagnostic)) {
      throw new Error('VISUAL_CORRECTION_CONTRACT_CHANGED: ' + diagnostic);
    }
    throw new Error('VISUAL_CORRECTION_ORCHESTRATION_FAILURE: ' + diagnostic);
  }

  if(!transitionProof||transitionProof.status!=='PASS')throw new Error('VISUAL_CORRECTION_TRANSITION_PROOF_REQUIRED');
  const protectedUnchanged=Array.isArray(transitionProof.protected_blobs)&&transitionProof.protected_blobs.length>0&&transitionProof.protected_blobs.every(blob=>blob.source_oid&&blob.source_oid===blob.execution_oid);
  if(!protectedUnchanged)throw new Error('VISUAL_CORRECTION_TRANSITION_PROOF_REQUIRED');
  const approved=spawnSync('git',['cat-file','-p',queue.authorized_plan.plan_blob_oid],{cwd,encoding:'utf8',shell:false});
  if(approved.status!==0)throw Error('VISUAL_CORRECTION_APPROVED_PLAN_UNREADABLE');
  const impact=extractTaggedJson(approved.stdout,'KODJO_PLAN_IMPACT_JSON');
  const withinScope=Array.isArray(impact.scope_allow)&&Array.isArray(queue.scope_allow)&&
    JSON.stringify([...impact.scope_allow].sort())===JSON.stringify([...queue.scope_allow].sort());
  if(!withinScope)throw Error('VISUAL_CORRECTION_SCOPE_CHANGED');
  // Admission also checks requested scope against the exact approved plan (verify-authorizations).
  const reviewPolicy=resolveImplementationReviewPolicy({operation_kind:'VISUAL_CORRECTION',same_slice_id:fields.slice_id===String(queue.slice_id),same_approved_plan_binding:fields.plan_blob_oid===queue.authorized_plan.plan_blob_oid,within_approved_scope:withinScope,introduces_new_requirement:!protectedUnchanged,prior_slice_review_completed:fields.status==='CERTIFIED'});
  return {
    review_policy:reviewPolicy,
    status: 'CERTIFIED',
    contract_status: 'CONTRACT_UNCHANGED',
    checkpoint_ref: cp.checkpoint_ref,
    application_pr: target.application_pr,
    application_head: target.application_head,
    protocol_head: queue.source_head,
    transition_status: transitionProof && transitionProof.status || 'PASS',
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
