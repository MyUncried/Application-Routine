'use strict';

const assert = require('node:assert/strict');
const { resolveImplementationReviewPolicy } = require('../../scripts/kodjo/resolve-implementation-review-policy');
const { validateQueueRequest } = require('../../scripts/kodjo/lib/queue-contract');

const proof = {
  same_slice_id: true,
  same_approved_plan_binding: true,
  within_approved_scope: true,
  introduces_new_requirement: false,
  prior_slice_review_completed: true,
};

test('T-108 visual finding is routed obligatorily without plan revision', () => {
  const result = resolveImplementationReviewPolicy({ ...proof, operation_kind: 'VISUAL_CORRECTION' });
  assert.equal(result.route, 'VISUAL_CORRECTION');
  assert.equal(result.plan_revision_forbidden, true);
  assert.equal(result.review_required, false);
});

test('T-108 visual route rejects a new requirement', () => {
  const result = resolveImplementationReviewPolicy({ ...proof, operation_kind: 'VISUAL_CORRECTION', introduces_new_requirement: true });
  assert.equal(result.review_required, true);
  assert.equal(result.reason, 'NEW_SLICE_OR_SCOPE_EXTENSION');
});

test('T-108 RESUME_DELTA refuses a missing delivery checkpoint', () => {
  const queue = {
    schema_version: 'kodjo.protocol.v2.lean-request.0.6.13', slice_id: 'V2-BILAT-01', issue_number: 52,
    source_head: 'a'.repeat(40), baseline_head: 'b'.repeat(40), slice_bootstrap_file: 'bootstrap.json',
    slice_bootstrap_sha256: 'c'.repeat(64), mode: 'RESUME_DELTA', session_id: '123e4567-e89b-12d3-a456-426614174000',
    prompt_file: 'prompt.txt', scope_allow: ['src/x.ts'], checks: ['jest'], request_id: '123e4567-e89b-12d3-a456-426614174001',
    created_at: '2026-09-15T10:00:00Z', authorized_plan: {plan_path:'p',plan_blob_oid:'d'.repeat(40),approved_at_commit:'e'.repeat(40),evidence_kind:'ARTIFACT_HASH'},
    independent_review: {review_path:'r',review_blob_oid:'f'.repeat(40),reviewed_plan_blob_oid:'d'.repeat(40),verdict:'APPROVED',evidence_kind:'ARTIFACT_HASH'},
    user_gate: {gate_ref:'issue_comment:1',gated_reference:'d'.repeat(40),decision:'APPROVED',user_login:'u',evidence_kind:'ORGANISATIONAL'},
    retry_of_run_id:'34948992572', retry_reason:{code:'CHECKS_FAILED',detail:'test'},
  };
  assert.ok(validateQueueRequest(queue).some((e) => e.diagnostic === 'KODJO_QUEUE_DELIVERY_CHECKPOINT_REFUSED'));
});

test('T-108 valid checkpoint shape is accepted by the contract', () => {
  const base = {schema_version:'kodjo.protocol.v2.lean-request.0.6.13',slice_id:'S',issue_number:1,source_head:'a'.repeat(40),baseline_head:'b'.repeat(40),slice_bootstrap_file:'b',slice_bootstrap_sha256:'c'.repeat(64),mode:'RESUME_DELTA',session_id:'123e4567-e89b-12d3-a456-426614174000',prompt_file:'p',scope_allow:['x'],checks:['jest'],request_id:'123e4567-e89b-12d3-a456-426614174001',created_at:'2026-09-15T10:00:00Z',authorized_plan:{plan_path:'p',plan_blob_oid:'d'.repeat(40),approved_at_commit:'e'.repeat(40),evidence_kind:'ARTIFACT_HASH'},independent_review:{review_path:'r',review_blob_oid:'f'.repeat(40),reviewed_plan_blob_oid:'d'.repeat(40),verdict:'APPROVED',evidence_kind:'ARTIFACT_HASH'},user_gate:{gate_ref:'issue_comment:1',gated_reference:'d'.repeat(40),decision:'APPROVED',user_login:'u',evidence_kind:'ORGANISATIONAL'},retry_of_run_id:'34948992572',retry_reason:{code:'CHECKS_FAILED',detail:'test'},delivery_checkpoint:{checkpoint_ref:'issue_comment:2',application_pr:'142',application_head:'a'.repeat(40),plan_comment_id:'3',review_comment_id:'4',gate_comment_id:'5',protocol_head:'a'.repeat(40),package_run_id:'34948992572',package_artifact_id:'10389171562',delivery_head:'a'.repeat(40)}};
  assert.equal(validateQueueRequest(base).length, 0);
});
