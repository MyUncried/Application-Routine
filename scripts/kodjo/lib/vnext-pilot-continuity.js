'use strict';

// Operation feedback for the existing pilot, never a new admission authority.
// No retry, model invocation, lock, business approval or remote write lives here.
const V = require('./vnext-contract');
const Policy = require('./vnext-error-policy');
const SCHEMA = 'kodjo.vnext.pilot-continuity.v1';
const NEXT = Object.freeze({
  launch: 'VERIFY_AND_REVIEW_PLAN',
  produce: 'VERIFY_AND_REVIEW_PLAN',
  prepare: 'RESERVE_AND_PUBLISH_APPROVAL',
  'reserve-gate': 'FINALIZE_TRANSPORT',
  'finalize-transport': 'REQUEST_OWNER_APPROVAL',
  handoff: 'CONTINUE_ADMITTED_OPERATION',
  admit: 'CONTINUE_ADMITTED_OPERATION',
  'prepare-implementation-review': 'REVIEW_OR_RECOVER_IMPLEMENTATION',
  'verify-implementation-review': 'PROCESS_VERIFIED_REVIEW',
  'validate-publication': 'PROCESS_VALIDATED_PUBLICATION',
  'review-scope': 'APPLY_VERIFIED_SCOPE_RESULT',
  'recover-review-scope': 'APPLY_VERIFIED_SCOPE_RESULT',
});

function describe({stage, result = null, artifact = null, error = null, checkoutHead = null, previous = null}) {
  // Record codes only; free error text can contain paths, credentials or output.
  const diagnostic = error ? String(error.code || error.message || 'UNKNOWN').split(/[\s:]/)[0].slice(0,160) : null;
  const policy = diagnostic ? Policy.classify({diagnostic}) : null;
  let state = 'ACTION_REQUIRED';
  let next = NEXT[stage] || 'PROCESS_OPERATION_RESULT';
  if (error) {
    next = policy.category === 'HUMAN_DECISION_REQUIRED' ? 'MATERIALIZE_OWNER_DECISION'
      : policy.category === 'PREVENTABLE_BY_DETERMINISM' ? 'FIX_DETERMINISTIC_CAUSE'
      : 'DIAGNOSE_WITHOUT_IMPLICIT_RETRY';
    if (diagnostic === 'VNEXT_COMPONENT_REUSE_QUALIFICATION_REQUIRED_BEFORE_LARGE_REVIEW') next = 'QUALIFY_COMPONENT_MAPPINGS';
    if (diagnostic === 'VNEXT_REVIEW_COVERAGE_INCOMPLETE') next = 'PROCESS_EXISTING_CUMULATIVE_COVERAGE';
    if (diagnostic === 'VNEXT_LIVE_REVIEW_NOT_APPROVED') next = 'READ_ARCHIVED_RESULT';
    if (diagnostic === 'VNEXT_HANDOFF_USER_APPROVAL_REQUIRED') next = 'MATERIALIZE_OWNER_DECISION';
  } else if (['review','recover-review','implementation-review'].includes(stage)) {
    const verdict = artifact?.review_report?.verdict || artifact?.assessment?.verdict;
    next = verdict === 'REVISE' ? 'CORRECT_WITHIN_EXISTING_AUTHORITY'
      : verdict === 'CLARIFICATION_REQUIRED' ? 'MATERIALIZE_OWNER_DECISION'
      : verdict === 'REVIEW_INCOMPLETE' ? 'PROCESS_EXISTING_CUMULATIVE_COVERAGE'
      : verdict === 'APPROVE' ? 'PROCESS_VERIFIED_REVIEW' : 'READ_ARCHIVED_RESULT';
  } else if (stage === 'request-approval' && result?.status === 'USER_APPROVAL_REQUIRED'
      && /^issue_comment:[1-9][0-9]*$/.test(result.gate_ref || '') && result.approval_url) {
    // The existing command already verified/published this exact owner target.
    state = 'WAITING_OWNER'; next = 'WAIT_FOR_EXISTING_OWNER_GATE';
  }
  // Reuse the producer's identity; never rehash a potentially huge catalogue
  // just to provide feedback. This field grants no evidence or authorization.
  const identity = artifact?.contract_hash || artifact?.approval_target?.contract_hash;
  const artifactHash = /^[a-f0-9]{64}$/.test(identity || '') ? identity : null;
  const progressKey = V.canonicalHash({stage, checkout_head:checkoutHead, status:result?.status || 'FAILED', diagnostic, artifact_hash:artifactHash, next_action:next});
  let noProgress = false;
  if (previous?.schema_version === SCHEMA) {
    V.verifyContractHash(previous);
    // Repeated feedback is a reconciliation request, never a retry permission.
    noProgress = previous.progress_key === progressKey;
    if (noProgress && state !== 'WAITING_OWNER') next = 'RECONCILE_WITHOUT_REPEATING_OPERATION';
  }
  return V.sealContract({schema_version:SCHEMA, stage, state, next_action:next,
    diagnostic, error_policy:policy, checkout_head:checkoutHead, artifact_hash:artifactHash,
    progress_key:progressKey, no_progress:noProgress,
    github_refresh_required_before_diagnosis:true,
    operation_completed:!error,
    mission_completed:false,
    grants_additional_retry:false,
    authority:'EXISTING_PILOT_ONLY'});
}

function feedback(args, result, error, {checkoutHead = null, readArtifact = () => null, previous = null} = {}) {
  // Never replace a valid result or its primary failure with a feedback error.
  let artifact = null;
  if (!error && args[2]) { try { artifact = readArtifact(args[2]); } catch { /* Output remains authoritative; read it explicitly. */ } }
  return describe({stage:args[0], result, error, artifact, checkoutHead, previous});
}
function wrap(stage, operation) {
  const annotate = error => {
    try { if(!error.continuation)error.continuation=describe({stage,error}); } catch { /* Preserve the primary error. */ }
    throw error;
  };
  return function(...args) {
    try {
      const result=operation.apply(this,args);
      return result && typeof result.then==='function' ? result.catch(annotate) : result;
    } catch(error) { return annotate(error); }
  };
}
module.exports = {SCHEMA, describe, feedback, wrap};
