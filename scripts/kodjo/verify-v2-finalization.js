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
const DEVICE_PROOF_TYPES = new Set(['VISUAL_COMPARE', 'DEVICE_CHECK']);
// Same deferral rule as verify-ui-implementation-review.js (DEFERABLE_PROOFS): an accessibility
// proof may be PASS, or PENDING_DEVICE when only runtime VoiceOver/TalkBack evidence remains,
// and is then closed by the human gate (PRE-2, finalization run 37244733631).
const ACCESSIBILITY_PROOF_TYPE = 'ACCESSIBILITY_CHECK';
const DEFERABLE_PROOF_TYPES = new Set([...DEVICE_PROOF_TYPES, ACCESSIBILITY_PROOF_TYPE]);
function proofAllowedBeforeGate(type, status) {
  if (DEVICE_PROOF_TYPES.has(type)) return status === 'PENDING_DEVICE';
  if (type === ACCESSIBILITY_PROOF_TYPE) return status === 'PASS' || status === 'PENDING_DEVICE';
  return status === 'PASS';
}
// True when there is at least one proof and every proof is either a technical PASS or a deferable
// proof still PENDING_DEVICE (a device PASS before the human gate is never accepted).
function devicePendingOnly(proofs) {
  const rows = Array.isArray(proofs) ? proofs : [];
  for (const proof of rows) {
    if (!proofAllowedBeforeGate(String(proof && proof.proof_type || ''), String(proof && proof.status || ''))) return false;
  }
  return rows.length > 0;
}
function hasPendingDeviceProof(criterion) {
  const rows = [...(Array.isArray(criterion.proof_results) ? criterion.proof_results : []),
    ...(Array.isArray(criterion.assertion_results) ? criterion.assertion_results : [])
      .flatMap((assertion) => Array.isArray(assertion && assertion.proof_results) ? assertion.proof_results : [])];
  return rows.some((proof) => DEFERABLE_PROOF_TYPES.has(String(proof && proof.proof_type || '')) &&
    String(proof && proof.status || '') === 'PENDING_DEVICE');
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

  const targeted = firstLine(visual) === '[KODJO_SLICE] TARGETED_VISUAL_APPROVED_REQUALIFY';
  if (!targeted && firstLine(visual) !== '[KODJO_SLICE] VISUAL_APPROVED') fail('V2_FINAL_VISUAL_MARKER_INVALID');

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
  const operationKind = String(queue.operation_kind || 'IMPLEMENT');
  if (!['IMPLEMENT','VISUAL_CORRECTION'].includes(operationKind)) fail('V2_FINAL_OPERATION_KIND_INVALID');
  if (operationKind === 'VISUAL_CORRECTION' && !targeted) fail('V2_FINAL_GLOBAL_REQUALIFICATION_REQUIRED', 'une revue du delta ne peut approuver la tranche');
  if (targeted && operationKind !== 'VISUAL_CORRECTION') fail('V2_TARGETED_OPERATION_INVALID');
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
  if (queue.delivery_target) {
    if (queue.delivery_target.kind !== 'EXISTING_PR' ||
        Number(queue.delivery_target.application_pr) !== applicationPr ||
        String(queue.delivery_target.branch || '') !== applicationBranch ||
        String(queue.delivery_target.application_head || '') !== baseHead) {
      fail(operationKind === 'VISUAL_CORRECTION'
        ? 'V2_FINAL_VISUAL_DELIVERY_TARGET_MISMATCH'
        : 'V2_FINAL_IMPLEMENT_DELIVERY_TARGET_MISMATCH');
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
      // Since the review derives each criterion from its assertions (PRE-1, 2026-10-01), a criterion
      // whose only gaps are device proofs still pending is NON_VERIFIABLE before the human gate.
      // The human device approval closes exactly those gaps; every technical proof must still PASS.
      const closedByDeviceGate = deviceGateRequired &&
        criterion.implementation_status === 'NON_VERIFIABLE' &&
        hasPendingDeviceProof(criterion) &&
        devicePendingOnly(criterion.proof_results) &&
        (Array.isArray(criterion.assertion_results) ? criterion.assertion_results : []).every((assertion) =>
          ['CONFORME', 'PENDING_DEVICE'].includes(String(assertion && assertion.status || '')) &&
          devicePendingOnly(assertion.proof_results));
      if ((criterion.implementation_status !== 'CONFORME' && !closedByDeviceGate) || criterion.preserve_status !== 'PASS') {
        fail('V2_FINAL_CRITERION_NOT_CLOSED', String(criterion.criterion_id));
      }
      const proofs = Array.isArray(criterion.proof_results) ? criterion.proof_results : [];
      for (const proof of proofs) {
        const type = String(proof.proof_type || '');
        const status = String(proof.status || '');
        if (type === 'VISUAL_COMPARE' || type === 'DEVICE_CHECK') {
          if (status !== 'PENDING_DEVICE') fail('V2_FINAL_DEVICE_PROOF_PRE_GATE_INVALID', String(criterion.criterion_id) + ':' + type);
        } else if (type === ACCESSIBILITY_PROOF_TYPE) {
          if (!proofAllowedBeforeGate(type, status)) fail('V2_FINAL_TECHNICAL_PROOF_NOT_PASS', String(criterion.criterion_id) + ':' + type);
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
