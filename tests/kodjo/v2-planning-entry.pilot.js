'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..', '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('V2 planning uses the bootstrap and never invents a V1 manifest', () => {
  const plan = read('.github/workflows/kodjo-v2-slice-plan.yml');
  assert.match(plan, /bootstrap_path=/);
  assert.match(plan, /v2-slices\/\$SLICE_ID\/slice-bootstrap\.json/);
  assert.match(plan, /kodjo\.protocol\.v2\.slice-bootstrap/);
  assert.match(plan, /V2_SLICE_NOT_ACTIVE/);
  assert.match(plan, /Verdict.*APPROVED/);
  assert.match(plan, /START_PLAN_REVISION/);
  assert.doesNotMatch(plan, /orchestration\/slices\/\$SLICE_ID\.yml/);
});

test('V2 plan is bound to exact remote HEAD and prior versioned artefacts', () => {
  const plan = read('.github/workflows/kodjo-v2-slice-plan.yml');
  assert.match(plan, /git ls-remote origin/);
  assert.match(plan, /test "\$ACTUAL" = "\$SOURCE_HEAD"/);
  assert.match(plan, /PLAN_OID=\$\(git rev-parse/);
  assert.match(plan, /REVIEW_OID=\$\(git rev-parse/);
  assert.match(plan, /supersedes_plan_blob_oid=/);
  assert.match(plan, /prior_review_blob_oid=/);
});

test('V2 plan produces and verifies the opposable direct-import matrix', () => {
  const plan = read('.github/workflows/kodjo-v2-slice-plan.yml');
  assert.match(plan, /scan-plan-impact\.js extract-modules/);
  assert.match(plan, /scan-plan-impact\.js scan/);
  assert.match(plan, /verify-plan-impact\.js/);
  assert.match(plan, /planning_contract=kodjo\.plan-impact\.v1/);
  assert.match(plan, /APPLICATION FILE INVENTORY/);
  assert.match(plan, /"scope_allow"/);
  assert.match(plan, /full Jest, TypeScript and lint/);
});

test('V2 independent review replays the scan and publishes its own proof', () => {
  const review = read('.github/workflows/kodjo-v2-slice-plan-review.yml');
  assert.match(review, /START_PLAN_REVIEW/);
  assert.match(review, /Replay V2 direct-import scan independently/);
  assert.match(review, /verify-plan-impact\.js/);
  assert.match(review, /KODJO_PLAN_IMPACT_REVIEW_JSON/);
  assert.match(review, /V2 target branch moved/);
  assert.doesNotMatch(review, /orchestration\/slices\/\$slice\.yml/);
});

test('V1 and V2 planning triggers and evidence headers stay disjoint', () => {
  const genericPlan = read('.github/workflows/kodjo-slice-plan.yml');
  const genericReview = read('.github/workflows/kodjo-slice-plan-review.yml');
  const v2Plan = read('.github/workflows/kodjo-v2-slice-plan.yml');
  const v2Review = read('.github/workflows/kodjo-v2-slice-plan-review.yml');
  assert.match(genericPlan, /\[KODJO_SLICE\] START_PLAN/);
  assert.match(genericReview, /\[KODJO_SLICE\] START_PLAN_REVIEW/);
  assert.match(v2Plan, /\[KODJO_V2\] START_PLAN_REVISION/);
  assert.match(v2Review, /\[KODJO_V2\] START_PLAN_REVIEW/);
  assert.doesNotMatch(v2Plan, /\[KODJO_SLICE\]/);
  assert.doesNotMatch(v2Review, /\[KODJO_SLICE\]/);
});
