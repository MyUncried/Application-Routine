#!/usr/bin/env node
'use strict';

const INITIAL = new Set(['IMPLEMENT']);
const CORRECTIVE = new Set(['RESUME_DELTA', 'TARGETED_FIX', 'CORRECTION', 'VISUAL_CORRECTION']);
const OPERATIONS = new Set([...INITIAL, ...CORRECTIVE]);

function requireBoolean(input, name) {
  if (typeof input[name] !== 'boolean') {
    throw new Error('IMPLEMENTATION_REVIEW_POLICY_PROOF_MISSING:' + name);
  }
  return input[name];
}

function resolveImplementationReviewPolicy(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('IMPLEMENTATION_REVIEW_POLICY_INPUT_INVALID');
  }
  const operation = String(input.operation_kind || '');
  if (!OPERATIONS.has(operation)) {
    throw new Error('IMPLEMENTATION_REVIEW_POLICY_OPERATION_INVALID');
  }

  const sameSlice = requireBoolean(input, 'same_slice_id');
  const sameBinding = requireBoolean(input, 'same_approved_plan_binding');
  const withinScope = requireBoolean(input, 'within_approved_scope');
  const introducesRequirement = requireBoolean(input, 'introduces_new_requirement');
  const priorReviewCompleted = requireBoolean(input, 'prior_slice_review_completed');

  if (!sameSlice || !sameBinding || !withinScope || introducesRequirement) {
    return {
      status: 'REVIEW_REQUIRED',
      reason: 'NEW_SLICE_OR_SCOPE_EXTENSION',
      review_required: true,
    };
  }

  if (INITIAL.has(operation)) {
    return priorReviewCompleted
      ? {
          status: 'REVIEW_SATISFIED',
          reason: 'SLICE_REVIEW_ALREADY_COMPLETED',
          review_required: false,
        }
      : {
          status: 'REVIEW_REQUIRED',
          reason: 'INITIAL_SLICE_IMPLEMENTATION',
          review_required: true,
        };
  }

  if (operation === 'VISUAL_CORRECTION') {
    return {
      status: 'VISUAL_CORRECTION_REQUIRED',
      reason: 'VISUAL_CORRECTION_WITHIN_APPROVED_SCOPE',
      route: 'VISUAL_CORRECTION',
      review_required: false,
      plan_revision_forbidden: true,
    };
  }

  return {
    status: 'REVIEW_NOT_REQUIRED',
    reason: 'CORRECTION_WITHIN_APPROVED_SCOPE',
    review_required: false,
    plan_revision_forbidden: false,
  };
}

module.exports = { resolveImplementationReviewPolicy };
