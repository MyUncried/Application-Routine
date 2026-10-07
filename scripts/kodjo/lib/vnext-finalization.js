'use strict';

// VNext boundary only. Reuse the review/preservation proof policy; never alter
// the V2 finalizer or interpret a functional acceptance as device conformity.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const V = require('./vnext-contract');
const Delivery = require('./vnext-delivery-preservation');
const Device = require('./device-proof-policy');
const Source = require('../verify-source-comment');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function coverage({ cwd, baselineHead, incrementHead, head, approvedHead, matrix, retainedTargets = [], requiredTargets = [] }) {
  for (const sha of [baselineHead, incrementHead, head, approvedHead]) V.assertSha40(sha, 'VNEXT_FINAL_HEAD_REQUIRED');
  if (head !== approvedHead) V.fail('VNEXT_FINAL_UNAPPROVED_HEAD');
  for (const base of [baselineHead, incrementHead]) {
    try { git(cwd, 'merge-base', '--is-ancestor', base, head); }
    catch (_) { V.fail('VNEXT_FINAL_BASELINE_NOT_ANCESTOR'); }
  }
  const diff = base => git(cwd, 'diff', '--no-renames', '--name-only', base, head).split('\n').filter(Boolean).sort();
  const targets = [...new Set([...matrix.criteria.flatMap(c => c.change_targets), ...requiredTargets])].sort();
  const cumulativeFiles = diff(baselineHead);
  const currentFiles = targets.map(file => {
    require('./vnext-figma-source').safePath(file);
    let object;
    try {
      const entry = git(cwd, 'ls-tree', '-z', head, '--', ':(literal)' + file);
      const match = /^(100644|100755) blob ([0-9a-f]{40})\t([^\0]+)\0$/.exec(entry);
      if (!match || match[3] !== file) throw Error('not a regular blob');
      object = match[2];
    }
    catch (_) { V.fail('VNEXT_FINAL_TARGET_ABSENT', file); }
    return { path: file, blob_oid: object };
  });
  if (targets.some(file => !cumulativeFiles.includes(file) && !retainedTargets.includes(file))) V.fail('VNEXT_FINAL_TARGET_NOT_DELIVERED');
  return { baseline_head: baselineHead, increment_head: incrementHead, head,
    increment_files: diff(incrementHead), cumulative_files: cumulativeFiles, current_files: currentFiles };
}
function pending(review) {
  return [
    ...review.criteria.flatMap(c => [
      ...c.proof_results.filter(Device.isDeferred).map(p => ({ target_id: c.criterion_id, ...p })),
      ...(c.assertion_results || []).flatMap(a => a.proof_results.filter(Device.isDeferred).map(p => ({ target_id: a.assertion_id, ...p }))),
    ]),
    ...(review.non_ui_plan_assessment?.requirements || []).flatMap(r => r.proof_results.filter(Device.isDeferred).map(p => ({ target_id: r.requirement_id, ...p }))),
  ];
}
function decision(comment, binding) {
  Source.verify(comment, { repository: binding.repository, issue: binding.issue, id: comment.id, actor: 'MyUncried' });
  if (!comment.body.includes('[KODJO_VNEXT] FUNCTIONAL_ACCEPTANCE') && !comment.body.includes('[KODJO_SLICE] VISUAL_APPROVED')) V.fail('VNEXT_FINAL_DECISION_MARKER_REQUIRED');
  const field = key => {
    const values = [...comment.body.replace(/\r\n/g, '\n').matchAll(new RegExp('^' + key + '=([^\\n]+)$', 'gm'))].map(m => m[1].trim());
    if (values.length !== 1) V.fail('VNEXT_FINAL_DECISION_BINDING_INVALID');
    return values[0];
  };
  if (field('head') !== binding.head || field('slice_id') !== binding.sliceId
      || field('source_review_comment_id') !== String(binding.reviewId)) V.fail('VNEXT_FINAL_DECISION_BINDING_INVALID');
  // The body is retained verbatim. Callers cannot replace it with a generic PASS.
  return { comment_id: String(comment.id), updated_at: comment.updated_at || null,
    actor: comment.user.login, body: comment.body, body_sha256: V.sha256(comment.body) };
}
function proofResolutions(deferred,derogations,origin,reservations) {
  return deferred.map(p=>{
    const waiver=derogations.find(d=>d.requirement_id===p.target_id&&d.proof_type===p.proof_type);
    return waiver?{target_id:p.target_id,proof_type:p.proof_type,original_status:p.status,resolution:'SCOPED_DEVICE_DEROGATION',derogation:structuredClone(waiver)}
      :{target_id:p.target_id,proof_type:p.proof_type,original_status:p.status,resolution:'USER_WAIVER',decision_comment_id:origin.comment_id,reservations:structuredClone(reservations)};
  });
}
function finalize({ cwd, matrix, review, baselineHead, incrementHead, head, approvedHead,
  repository, issue, sliceId, reviewId, acceptance, originDecision, reservations = [], checks, retainedTargets = [], nonUiRequirements = [] }) {
  if (review.verdict !== 'APPROVE') V.fail('VNEXT_FINAL_REVIEW_NOT_APPROVED');
  const ids = matrix.criteria.map(c => c.criterion_id).sort();
  if (new Set(ids).size !== ids.length || V.canonicalStringify(ids) !== V.canonicalStringify(review.criteria.map(c => c.criterion_id).sort())) V.fail('VNEXT_FINAL_REVIEW_COVERAGE_INVALID');
  Delivery.validateUiProofs(matrix, review, 'VNEXT_FINAL_TECHNICAL_PROOF_NOT_PASSED');
  Delivery.validateNonUiProofs(review, 'VNEXT_FINAL_TECHNICAL_PROOF_NOT_PASSED');
  if (nonUiRequirements.length) {
    const actual = review.non_ui_plan_assessment?.requirements || [];
    if (V.canonicalStringify(nonUiRequirements.map(r=>r.requirement_id).sort()) !== V.canonicalStringify(actual.map(r=>r.requirement_id).sort())) V.fail('VNEXT_FINAL_NON_UI_COVERAGE_INVALID');
    for (const expected of nonUiRequirements) {
      const row=actual.find(r=>r.requirement_id===expected.requirement_id);
      if(row.review_scope==='INHERITED' || V.canonicalStringify([...expected.proof_required].sort()) !== V.canonicalStringify(row.proof_results.map(p=>p.proof_type).sort())) V.fail('VNEXT_FINAL_NON_UI_PROOF_COVERAGE_INVALID');
    }
  }
  for (const row of review.criteria) {
    if (row.preserve_status !== 'PASS' || !['CONFORME', 'NON_VERIFIABLE'].includes(row.implementation_status)
        || (row.implementation_status !== 'CONFORME' && !Device.deviceOnlyGap(row.proof_results, true))) V.fail('VNEXT_FINAL_CRITERION_NOT_CLOSED');
    if (row.review_scope === 'INHERITED') V.fail('VNEXT_FINAL_FRESH_REVIEW_REQUIRED');
  }
  if (!checks || ['jest', 'typescript', 'lint', 'head', 'clean'].some(k => checks[k] !== 'PASS')) V.fail('VNEXT_FINAL_CHECKS_NOT_PASSED');
  const delivered = coverage({ cwd, baselineHead, incrementHead, head, approvedHead, matrix, retainedTargets,
    requiredTargets: nonUiRequirements.flatMap(r=>r.change_targets) });
  const deferred = pending(review);
  const scopedWaiver = p => (review.device_check_derogations || []).find(d => d.requirement_id === p.target_id && d.proof_type === p.proof_type);
  const unresolved = deferred.filter(p => !scopedWaiver(p));
  const binding = { repository, issue, sliceId, head, reviewId };
  const accepted = acceptance ? decision(acceptance, binding) : null;
  const origin = originDecision ? decision(originDecision, binding) : accepted;
  if (originDecision && acceptance && originDecision.id !== acceptance.id) {
    const reference = `https://github.com/${repository}/issues/${issue}#issuecomment-${originDecision.id}`;
    if (!acceptance.body.includes(reference)) V.fail('VNEXT_FINAL_DECISION_PROVENANCE_MISSING');
  }
  if (unresolved.length && (!accepted || !origin || !reservations.length)) V.fail('VNEXT_FINAL_PENDING_RESOLUTION_REQUIRED');
  if (!Array.isArray(reservations) || reservations.some(r => typeof r !== 'string' || !r.trim())) V.fail('VNEXT_FINAL_RESERVATIONS_INVALID');
  // Reservations must be preserved in the authoritative decision, not invented
  // by the technical restart. Scope is the exact delivery/review above.
  if (reservations.some(r => !origin?.body.includes(r))) V.fail('VNEXT_FINAL_RESERVATIONS_NOT_IN_DECISION');
  const {sha256}=require('./plan-impact');
  return V.sealContract({ schema_version: 'kodjo.vnext.finalization.v1', schema:'kodjo.ui-final-verification.v1', slice_id: sliceId,
    repository, issue_number: issue, head, review_comment_id: String(reviewId),
    review_sha256: V.canonicalHash(review), delivery_coverage: delivered,
    technical_review_sha256:sha256(review),implementation_review_comment_id:String(reviewId),
    human_device_approval_comment_id:accepted?.comment_id || null,
    criterion_count:ids.length,criterion_ids_sha256:sha256(ids),
    acceptance: accepted, original_decision: origin, reservations,
    pending_proofs: deferred, not_executed_proofs: structuredClone(review.device_check_derogations || []),
    proof_resolutions: proofResolutions(deferred,review.device_check_derogations||[],origin,reservations),
    all_device_proofs_executed: deferred.length === 0 && !(review.device_check_derogations || []).length,
    acceptance_scope: unresolved.length ? 'FUNCTIONAL_ACCEPTANCE_WITH_RESERVES' : deferred.length ? 'SCOPED_DEVICE_DEROGATION' : 'TECHNICAL_VERIFICATION',
    visual_compliance_attested: false, accessibility_compliance_attested: false,
    final_status: 'READY_TO_CLOSE' });
}
function closeLocally(directory, finalization) {
  V.verifyContractHash(finalization, 'VNEXT_FINAL_HASH_INVALID');
  if (finalization.schema_version!=='kodjo.vnext.finalization.v1'||finalization.slice_id!=='VNEXT-12-QUALIF'
      ||finalization.final_status !== 'READY_TO_CLOSE') V.fail('VNEXT_FINAL_NOT_READY');
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'slice-closed.json');
  const record = { schema_version: 'kodjo.vnext.local-closure.v1', slice_id: finalization.slice_id,
    head: finalization.head, finalization_hash: finalization.contract_hash, status: 'SLICE_CLOSED',
    scope: 'LOCAL_CERTIFICATION_DELIVERY', github_issue_closed: false, application_published: false };
  try { fs.writeFileSync(file, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (V.canonicalStringify(JSON.parse(fs.readFileSync(file, 'utf8'))) !== V.canonicalStringify(record)) V.fail('VNEXT_FINAL_CLOSURE_CONFLICT');
  }
  return record;
}
function validateResult(result,review) {
  V.verifyContractHash(result,'VNEXT_FINAL_HASH_INVALID');
  if(review.criteria.some(c=>c.review_scope==='INHERITED'))V.fail('VNEXT_FINAL_FRESH_REVIEW_REQUIRED');
  const deferred=pending(review),waived=p=>(review.device_check_derogations||[]).find(d=>d.requirement_id===p.target_id&&d.proof_type===p.proof_type);
  const unresolved=deferred.filter(p=>!waived(p));
  if(unresolved.length&&(!result.acceptance||!result.original_decision||!result.reservations?.length))V.fail('VNEXT_FINAL_PENDING_RESOLUTION_REQUIRED');
  if(!Array.isArray(result.reservations)||result.reservations.some(r=>typeof r!=='string'||!r.trim()||!result.original_decision?.body.includes(r)))V.fail('VNEXT_FINAL_RESERVATIONS_INVALID');
  const binding={repository:result.repository,issue:result.issue_number,head:result.head,sliceId:result.slice_id,reviewId:result.review_comment_id};
  for(const snapshot of [result.acceptance,result.original_decision].filter(Boolean)){
    const observed=decision({id:snapshot.comment_id,user:{login:snapshot.actor},issue_url:`https://api.github.com/repos/${result.repository}/issues/${result.issue_number}`,body:snapshot.body,updated_at:snapshot.updated_at},binding);
    if(V.canonicalStringify(observed)!==V.canonicalStringify(snapshot))V.fail('VNEXT_FINAL_DECISION_SNAPSHOT_INVALID');
  }
  if(result.acceptance&&result.original_decision&&result.acceptance.comment_id!==result.original_decision.comment_id
    &&!result.acceptance.body.includes(`https://github.com/${result.repository}/issues/${result.issue_number}#issuecomment-${result.original_decision.comment_id}`))V.fail('VNEXT_FINAL_DECISION_PROVENANCE_MISSING');
  const expected=proofResolutions(deferred,review.device_check_derogations||[],result.original_decision,result.reservations);
  if(V.canonicalStringify(result.pending_proofs)!==V.canonicalStringify(deferred)
    ||V.canonicalStringify(result.proof_resolutions)!==V.canonicalStringify(expected)
    ||V.canonicalStringify(result.not_executed_proofs)!==V.canonicalStringify(review.device_check_derogations||[])
    ||result.all_device_proofs_executed!==(deferred.length===0&&!(review.device_check_derogations||[]).length)
    ||result.visual_compliance_attested!==false||result.accessibility_compliance_attested!==false
    ||result.review_sha256!==V.canonicalHash(review)||result.review_comment_id!==result.implementation_review_comment_id
    ||result.human_device_approval_comment_id!==(result.acceptance?.comment_id||null))V.fail('VNEXT_FINAL_RESOLUTION_DRIFT');
  if(result.acceptance_scope!==(unresolved.length?'FUNCTIONAL_ACCEPTANCE_WITH_RESERVES':deferred.length?'SCOPED_DEVICE_DEROGATION':'TECHNICAL_VERIFICATION'))V.fail('VNEXT_FINAL_RESOLUTION_DRIFT');
}
module.exports = { coverage, pending, decision, finalize, closeLocally, validateResult };
