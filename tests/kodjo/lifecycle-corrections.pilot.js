'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { resolveImplementationReviewPolicy } = require('../../scripts/kodjo/resolve-implementation-review-policy');
const proof = { same_slice_id:true, same_approved_plan_binding:true, within_approved_scope:true, introduces_new_requirement:false, prior_slice_review_completed:true };
test('T-108 visual finding is routed obligatorily without plan revision',()=>{const r=resolveImplementationReviewPolicy({...proof,operation_kind:'VISUAL_CORRECTION'});assert.equal(r.route,'VISUAL_CORRECTION');assert.equal(r.plan_revision_forbidden,true);assert.equal(r.review_required,false);});
test('T-108 visual route rejects an extension',()=>{const r=resolveImplementationReviewPolicy({...proof,operation_kind:'VISUAL_CORRECTION',introduces_new_requirement:true});assert.equal(r.review_required,true);});
test('T-108 successful delivery workflow publishes a certified checkpoint',()=>{const w=fs.readFileSync('.github/workflows/kodjo-slice-implementation.yml','utf8');assert.match(w,/APPLICATION_CHECKPOINT/);assert.match(w,/package_artifact_id/);assert.match(w,/gate_comment_id/);});
