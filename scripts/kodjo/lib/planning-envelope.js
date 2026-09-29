'use strict';

const V = require('./vnext-contract');
const SourceManifest = require('./source-manifest');

const SCHEMA = 'kodjo.vnext.planning-envelope.v1';
const MODES = Object.freeze(['INITIAL', 'REVISION']);
const CREATED_FROM_KINDS = Object.freeze(['INITIAL_REQUEST', 'PLAN_REVIEW_REVISE', 'CLARIFICATION_RESOLVED']);

function validateCreatedFrom(value) {
  V.assertExactKeys(value, ['kind', 'refs'], [], 'VNEXT_CREATED_FROM_KEYS_INVALID');
  if (!CREATED_FROM_KINDS.includes(value.kind)) V.fail('VNEXT_CREATED_FROM_KIND_INVALID', value.kind);
  return Object.freeze({ kind: value.kind, refs: V.uniqueStrings(value.refs, 'VNEXT_CREATED_FROM_REFS_INVALID', 'created_from.refs') });
}

function build(input) {
  V.assertExactKeys(input, [
    'slice_id', 'planning_mode', 'baseline_head', 'product_head', 'application_head', 'issue_id',
    'source_manifest', 'base_plan_hash', 'base_review_hash', 'causal_findings', 'created_from',
  ], [], 'VNEXT_PLANNING_ENVELOPE_INPUT_INVALID');

  V.assertSliceId(input.slice_id);
  if (!MODES.includes(input.planning_mode)) V.fail('VNEXT_PLANNING_MODE_INVALID', input.planning_mode);
  V.assertSha40(input.baseline_head, 'VNEXT_BASELINE_HEAD_INVALID', 'baseline_head');
  V.assertSha40(input.product_head, 'VNEXT_PRODUCT_HEAD_INVALID', 'product_head');
  V.assertSha40(input.application_head, 'VNEXT_APPLICATION_HEAD_INVALID', 'application_head');
  V.assertUnicodeExactText(input.issue_id, 'VNEXT_ISSUE_ID_INVALID', 'issue_id');
  SourceManifest.validate(input.source_manifest);
  if (input.source_manifest.slice_id !== input.slice_id) V.fail('VNEXT_SOURCE_MANIFEST_SLICE_MISMATCH');
  if (input.source_manifest.product_head !== input.product_head) V.fail('VNEXT_SOURCE_MANIFEST_HEAD_MISMATCH');
  const createdFrom = validateCreatedFrom(input.created_from);

  let basePlanHash = input.base_plan_hash;
  let baseReviewHash = input.base_review_hash;
  let causalFindings = input.causal_findings;

  if (input.planning_mode === 'INITIAL') {
    if (basePlanHash !== null || baseReviewHash !== null) V.fail('VNEXT_INITIAL_CAUSAL_BASE_FORBIDDEN');
    if (!Array.isArray(causalFindings) || causalFindings.length !== 0) V.fail('VNEXT_INITIAL_FINDINGS_FORBIDDEN');
    if (createdFrom.kind !== 'INITIAL_REQUEST') V.fail('VNEXT_INITIAL_CREATED_FROM_INVALID');
  } else {
    V.assertSha64(basePlanHash, 'VNEXT_REVISION_BASE_PLAN_INVALID', 'base_plan_hash');
    V.assertSha64(baseReviewHash, 'VNEXT_REVISION_BASE_REVIEW_INVALID', 'base_review_hash');
    causalFindings = V.uniqueStrings(causalFindings, 'VNEXT_REVISION_FINDINGS_INVALID', 'causal_findings');
    if (!['PLAN_REVIEW_REVISE', 'CLARIFICATION_RESOLVED'].includes(createdFrom.kind)) {
      V.fail('VNEXT_REVISION_CREATED_FROM_INVALID', createdFrom.kind);
    }
  }

  return V.sealContract({
    schema_version: SCHEMA,
    slice_id: input.slice_id,
    planning_mode: input.planning_mode,
    baseline_head: input.baseline_head,
    product_head: input.product_head,
    application_head: input.application_head,
    issue_id: input.issue_id,
    source_manifest: input.source_manifest,
    base_plan_hash: basePlanHash,
    base_review_hash: baseReviewHash,
    causal_findings: causalFindings,
    created_from: createdFrom,
  });
}

function validate(envelope) {
  V.assertExactKeys(envelope, [
    'schema_version', 'slice_id', 'planning_mode', 'baseline_head', 'product_head', 'application_head', 'issue_id',
    'source_manifest', 'base_plan_hash', 'base_review_hash', 'causal_findings', 'created_from', 'contract_hash',
  ], [], 'VNEXT_PLANNING_ENVELOPE_KEYS_INVALID');
  if (envelope.schema_version !== SCHEMA) V.fail('VNEXT_PLANNING_ENVELOPE_SCHEMA_INVALID', envelope.schema_version);
  V.verifyContractHash(envelope, 'VNEXT_PLANNING_ENVELOPE_HASH_MISMATCH');
  const rebuilt = build({
    slice_id: envelope.slice_id, planning_mode: envelope.planning_mode, baseline_head: envelope.baseline_head,
    product_head: envelope.product_head, application_head: envelope.application_head, issue_id: envelope.issue_id,
    source_manifest: envelope.source_manifest, base_plan_hash: envelope.base_plan_hash, base_review_hash: envelope.base_review_hash,
    causal_findings: envelope.causal_findings, created_from: envelope.created_from,
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(envelope)) V.fail('VNEXT_PLANNING_ENVELOPE_REBUILD_MISMATCH');
  return true;
}

module.exports = { SCHEMA, MODES, CREATED_FROM_KINDS, build, validate };
