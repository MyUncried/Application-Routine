#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function fail(code, detail) { throw new Error(code + (detail ? ': ' + detail : '')); }
function gh(args) {
  const r=spawnSync('gh',['api',...args],{encoding:'utf8',windowsHide:true,shell:false,maxBuffer:32*1024*1024});
  if(r.error||r.status!==0) fail('ENV_SYNC_GITHUB_READ_FAILED',r.error?r.error.message:r.stderr.trim());
  return r.stdout;
}
function ghJson(args) { try{return JSON.parse(gh(args));}catch(_){fail('ENV_SYNC_GITHUB_JSON_INVALID');} }
function normalized(body){return String(body||'').replace(/\r/g,'');}
function taggedFinal(body){
  const text=normalized(body);
  if(text.split('\n')[0] !== '[KODJO_SLICE] FINAL_OUTPUT') return null;
  if(!/^STATUT : READY_TO_CLOSE$/m.test(text)) return null;
  const match=text.match(/<KODJO_UI_FINAL_VERIFICATION_JSON>\s*([\s\S]*?)\s*<\/KODJO_UI_FINAL_VERIFICATION_JSON>/);
  if(!match) return null;
  let meta; try{meta=JSON.parse(match[1]);}catch(_){return null;}
  return {text,meta};
}
function resolve(pr, issueComments) {
  if(!pr || pr.merged !== true || pr.state !== 'closed' || pr.base?.ref !== 'main') fail('ENV_SYNC_PR_NOT_MERGED_TO_MAIN');
  const head=String(pr.head?.sha||'').toLowerCase();
  const mergeHead=String(pr.merge_commit_sha||'').toLowerCase();
  const branch=String(pr.head?.ref||'');
  if(!/^[0-9a-f]{40}$/.test(head)||!/^[0-9a-f]{40}$/.test(mergeHead)) fail('ENV_SYNC_MERGE_HEAD_INVALID');

  const matches=[];
  for(const group of issueComments){
    for(const comment of group.comments||[]){
      if(comment.user?.login !== 'github-actions[bot]') continue;
      const tagged=taggedFinal(comment.body);
      if(!tagged) continue;
      const meta=tagged.meta;
      if(Number(meta.application_pr)!==Number(pr.number)) continue;
      if(String(meta.head||'').toLowerCase()!==head) continue;
      if(String(meta.application_branch||'')!==branch) continue;
      if(String(meta.final_status||'')!=='READY_TO_CLOSE') continue;
      if(meta.review_mode === 'VISUAL_CORRECTION_DELTA' || meta.validation_scope === 'DELTA' || meta.global_approval === false) continue;
      if(String(meta.slice_id||'')==='') continue;
      if ((group.comments||[]).some(c=>c.user?.login==='github-actions[bot]' && String(c.body||'').startsWith('[KODJO_V2] TARGETED_VALIDATION_OUTPUT\n'))) {
        require('./verify-global-requalification-state').verify(meta,group.comments);
      }
      matches.push({issue_number:Number(group.issue_number),comment_id:String(comment.id),meta});
    }
  }
  if(matches.length!==1) fail('ENV_SYNC_F…1991 tokens truncated…ARGETED_OPERATION_INVALID');
  if (operationKind === 'VISUAL_CORRECTION') {
    if (queue.mode !== 'RESUME_DELTA') fail('V2_FINAL_VISUAL_MODE_INVALID');
    if (!queue.delivery_target || queue.delivery_target.kind !== 'EXISTING_PR' ||
        String(queue.delivery_target.application_head || '') !== baseHead) {
      fail('V2_FINAL_VISUAL_TARGET_INVALID');
    }
    if (!queue.delivery_checkpoint || String(queue.delivery_checkpoint.application_head || '') !== baseHead ||
        String(queue.delivery_checkpoint.delivery_head || '') !== baseHead) {
      fail('V2_FINAL_VISUAL_CHECKPOINT_INVALID');
    }
  }

  const applicationBranch = one(implementation, 'application_branch');
  const applicationPr = Number(one(implementation, 'application_pr'));
  if (!Number.isInteger(applicationPr) || applicationPr < 1 || !applicationBranch || applicationBranch.includes('..')) {
    fail('V2_FINAL_APPLICATION_TARGET_INVALID');
  }
  if (operationKind === 'VISUAL_CORRECTION') {
    if (Number(queue.delivery_target.application_pr) !== applicationPr ||
        String(queue.delivery_target.branch || '') !== applicationBranch) {
      fail('V2_FINAL_VISUAL_DELIVERY_TARGET_MISMATCH');
    }
  }

  let deviceGateRequired = operationKind === 'VISUAL_CORRECTION';
  let criterionCount = null;
  let criterionIdsHash = null;
  let technicalReviewHash = null;
  let reviewMode = 'VISUAL_CORRECTION_DELTA';

  if (operationKind === 'IMPLEMENT') {
    const reviewContract = taggedJson(review, 'KODJO_UI_IMPLEMENTATION_REVIEW_JSON');
    if (reviewContract.schema !== 'kodjo.ui-implementation-review.v1' || reviewContract.verdict !== 'APPROVE') {
      fail('V2_FINAL_REVIEW_CONTRACT_NOT_APPROVED');
    }
    const deviceField = one(review, 'device_gate_required');
    if (!['true','false'].includes(deviceField)) fail('V2_FINAL_DEVICE_GATE_INVALID');
    deviceGateRequired = deviceField === 'true';
    if (Boolean(reviewContract.device_gate_required) !== deviceGateRequired) fail('V2_FINAL_DEVICE_GATE_MISMATCH');

    const criteria = Array.isArray(reviewContract.criteria) ? reviewContract.criteria : [];
    const ids = criteria.map((item) => String(item && item.criterion_id || ''));
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
    criterionCount = ids.length;
    criterionIdsHash = sha256(ids.slice().sort());
    technicalReviewHash = sha256(reviewContract);
    reviewMode = 'CRITERION_COMPLETE';
  } else {
    if (fields(review, 'device_gate_required').length > 0) fail('V2_FINAL_VISUAL_UNEXPECTED_DEVICE_FIELD');
    if (/<KODJO_UI_IMPLEMENTATION_REVIEW_JSON>/.test(review)) fail('V2_FINAL_VISUAL_UNEXPECTED_FULL_REVIEW_CONTRACT');
    technicalReviewHash = sha256(review);
  }

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
    operation_kind: operationKind,
    review_mode: reviewMode,
    device_gate_required: deviceGateRequired,
    criterion_count: criterionCount,
    criterion_ids_sha256: criterionIdsHash,
    technical_review_sha256: technicalReviewHash,
    device_evidence_satisfied: true,
    final_status: 'READY_TO_CLOSE',
  };
  if (targeted) {
    if (one(visual,'validation_scope') !== 'DELTA' || one(visual,'targeted_result') !== 'PASS' ||
        one(visual,'global_conformance') !== 'NON_CONFORME' || one(visual,'requalification_scope') !== 'FULL_SLICE') fail('V2_TARGETED_SCOPE_INVALID');
    const sourceHead=one(visual,'source_head');
    if (!SHA40.test(sourceHead)) fail('V2_TARGETED_SOURCE_INVALID');
    if (one(visual,'bootstrap_path') !== '.github/orchestration/v2-slices/'+slice+'/slice-bootstrap.json') fail('V2_TARGETED_BOOTSTRAP_INVALID');
    result.schema='kodjo.targeted-validation.v1';
    result.validation_scope='DELTA';
    result.targeted_result='PASS';
    result.targeted_requirement=one(visual,'targeted_requirement');
    result.global_conformance='NON_CONFORME';
    result.final_status='REQUALIFICATION_REQUIRED';
    result.device_evidence_satisfied=false;
    result.targeted_device_evidence_satisfied=true;
    result.global_approval=false;
    result.merge_authorized=false;
    result.close_authorized=false;
    result.requalification_scope='FULL_SLICE';
    result.source_head=sourceHead;
    result.bootstrap_path=one(visual,'bootstrap_path');
    result.human_evidence_sha256=sha256(visual);
    result.replan_trigger='[KODJO_V2] START_PLAN_REVISION\n'+
      'slice_id='+slice+'\nbootstrap_path='+result.bootstrap_path+'\nsource_head='+sourceHead+
      '\napplication_pr='+applicationPr+'\napplication_head='+head+'\n';
  }
  fs.writeFileSync(path.resolve(outputFile), JSON.stringify(result, null, 2) + '\n', 'utf8');
  return result;
}

if (require.main === module) {
try {
  const result = verify(process.argv.slice(2));
  process.stdout.write('[KODJO_V2] finalization verified — slice=' + result.slice_id +
    ' head=' + result.head.slice(0, 12) + ' device=' + result.device_gate_required + '\n');
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}

}
module.exports = { verify };
