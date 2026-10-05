'use strict';
// A delivery reference is evidence, never a grant of write authority.
const V = require('./vnext-contract');
const { extractTaggedJson, canonicalJson, sha256 } = require('./plan-impact');
const Schema = 'kodjo.vnext.delivery-preservation.v1';
function validateBaseline(base) {
  if (base.schema_version === 'kodjo.vnext.post-acceptance-baseline.v1') return require('./vnext-post-acceptance').validateBaseline(base);
  V.verifyContractHash(base, 'VNEXT_DELIVERY_BASELINE_HASH_INVALID');
  V.assertExactKeys(base, ['reference','matrix','review','finalization','plan_blob_oid','contract_hash'], [], 'VNEXT_DELIVERY_BASELINE_KEYS_INVALID');
  const f = base.finalization;
  if (f.schema !== 'kodjo.ui-final-verification.v1' || f.final_status !== 'READY_TO_CLOSE'
      || f.plan_blob_oid !== base.plan_blob_oid || f.technical_review_sha256 !== sha256(base.review)
      || base.review.schema !== 'kodjo.ui-implementation-review.v1' || base.review.verdict !== 'APPROVE') V.fail('VNEXT_DELIVERY_BASELINE_NOT_APPROVED');
  V.assertSha40(f.head, 'VNEXT_DELIVERY_BASELINE_HEAD_INVALID');
  const DevicePolicy = require('./device-proof-policy');
  for (const row of base.review.criteria) {
    if (row.proof_results?.some(p => p.status === 'PENDING_DEVICE' && !DevicePolicy.isDeferred(p))) V.fail('VNEXT_DELIVERY_BASELINE_TECHNICAL_GAP');
    if (row.implementation_status === 'NON_VERIFIABLE' && !DevicePolicy.deviceOnlyGap(row.proof_results, true)) V.fail('VNEXT_DELIVERY_BASELINE_TECHNICAL_GAP');
  }
  const ids = base.matrix.criteria.map(c => c.criterion_id).sort();
  validateUiProofs(base.matrix,base.review,'VNEXT_DELIVERY_BASELINE_TECHNICAL_GAP');
  validateNonUiProofs(base.review,'VNEXT_DELIVERY_BASELINE_TECHNICAL_GAP');
  if (new Set(ids).size !== ids.length || V.canonicalStringify(ids) !== V.canonicalStringify(base.review.criteria.map(c => c.criterion_id).sort())) V.fail('VNEXT_DELIVERY_BASELINE_COVERAGE_INVALID');
  if (f.criterion_count !== ids.length || f.criterion_ids_sha256 !== sha256(ids)) V.fail('VNEXT_DELIVERY_FINALIZATION_COVERAGE_INVALID');
  if (base.review.criteria.some(c => !['CONFORME','NON_VERIFIABLE'].includes(c.implementation_status) || c.preserve_status !== 'PASS'
      || !c.proof_results?.length || c.proof_results.some(p => !['PASS','PENDING_DEVICE'].includes(p.status)))) V.fail('VNEXT_DELIVERY_BASELINE_TECHNICAL_GAP');
}
function observe(reference, { cwd, readGit, github }) {
  if (reference.kind === 'POST_ACCEPTANCE') return require('./vnext-post-acceptance').observe(reference, {cwd,readGit,github});
  V.assertExactKeys(reference, ['revision','plan_path','review_path','finalization_path','repository','issue_number'], [], 'VNEXT_DELIVERY_REFERENCE_KEYS_INVALID');
  V.assertSha40(reference.revision, 'VNEXT_DELIVERY_REFERENCE_REVISION_INVALID');
  const plan = readGit(cwd, reference.revision, reference.plan_path);
  const reviewBody = readGit(cwd, reference.revision, reference.review_path);
  const review = reviewBody.trim().startsWith('{') ? JSON.parse(reviewBody) : extractTaggedJson(reviewBody, 'KODJO_UI_IMPLEMENTATION_REVIEW_JSON');
  const finalization = JSON.parse(readGit(cwd, reference.revision, reference.finalization_path));
  const source = require('../verify-source-comment');
  const comment = source.verify(github.comment(reference.repository, finalization.implementation_review_comment_id),
    { repository: reference.repository, issue: reference.issue_number, id: finalization.implementation_review_comment_id });
  if (canonicalJson(extractTaggedJson(comment.body, 'KODJO_UI_IMPLEMENTATION_REVIEW_JSON')) !== canonicalJson(review)
      || canonicalJson([...comment.body.matchAll(/^head=([^\n]+)$/gm)].map(m=>m[1].trim())) !== canonicalJson([finalization.head])) V.fail('VNEXT_DELIVERY_REVIEW_COMMENT_MISMATCH');
  const approval = source.verify(github.comment(reference.repository, finalization.human_device_approval_comment_id),
    { repository: reference.repository, issue: reference.issue_number, id: finalization.human_device_approval_comment_id, actor: 'MyUncried' });
  const fields = name => [...approval.body.matchAll(new RegExp('^' + name + '=([^\\n]+)$', 'gm'))].map(m => m[1].trim());
  if (!approval.body.includes('[KODJO_SLICE] VISUAL_APPROVED') || canonicalJson(fields('head')) !== canonicalJson([finalization.head])
      || canonicalJson(fields('source_review_comment_id')) !== canonicalJson([String(finalization.implementation_review_comment_id)])
      || canonicalJson(fields('slice_id')) !== canonicalJson([finalization.slice_id]) || Number(finalization.issue_number) !== reference.issue_number) V.fail('VNEXT_DELIVERY_OWNER_APPROVAL_MISMATCH');
  const base = V.sealContract({ reference, matrix: merge(extractTaggedJson(plan, 'KODJO_UI_CRITERIA_MATRIX_JSON'), fromMarkdown(plan)), review, finalization,
    plan_blob_oid: require('./vnext-legacy-queue-adapter').gitBlobOid(plan) });
  validateBaseline(base); return base;
}
function build(input, planItems, writeScope) {
  V.assertExactKeys(input, ['baseline','replacements'], [], 'VNEXT_DELIVERY_INPUT_KEYS_INVALID');
  validateBaseline(input.baseline);
  if (!Array.isArray(input.replacements)) V.fail('VNEXT_DELIVERY_REPLACEMENTS_INVALID');
  const ids = new Set(input.baseline.matrix.criteria.map(c => c.criterion_id)), replaced = new Set();
  for (const row of input.replacements) {
    V.assertExactKeys(row, ['criterion_id','requirement_id'], [], 'VNEXT_DELIVERY_REPLACEMENT_KEYS_INVALID');
    const item = planItems.find(p => p.requirement_id === row.requirement_id);
    if (!ids.has(row.criterion_id) || replaced.has(row.criterion_id) || !item || item.disposition !== 'CHANGE' || !item.change_items.length) V.fail('VNEXT_DELIVERY_REPLACEMENT_REQUIRES_CHANGE');
    replaced.add(row.criterion_id);
  }
  const retained = input.baseline.matrix.criteria.filter(c => !replaced.has(c.criterion_id));
  return V.sealContract({ schema_version: Schema, baseline: input.baseline, replacements: input.replacements,
    retained_criteria: retained, correction_write_scope: writeScope.map(r => r.path),
    delivery_reference_scope: [...new Set(input.baseline.matrix.criteria.flatMap(c => c.change_targets))].sort(),
    proof_policy: 'FRESH_REVIEW_ALL_RETAINED_CRITERIA' });
}
function validate(value, planItems, writeScope) {
  V.verifyContractHash(value, 'VNEXT_DELIVERY_PRESERVATION_HASH_INVALID');
  const expected = build({ baseline: value.baseline, replacements: value.replacements }, planItems, writeScope);
  if (V.canonicalStringify(value) !== V.canonicalStringify(expected)) V.fail('VNEXT_DELIVERY_PRESERVATION_DRIFT');
}
function merge(matrix, preservation) {
  if (!preservation) return matrix;
  V.verifyContractHash(preservation, 'VNEXT_DELIVERY_PRESERVATION_HASH_INVALID');
  if (preservation.schema_version !== Schema || preservation.proof_policy !== 'FRESH_REVIEW_ALL_RETAINED_CRITERIA') V.fail('VNEXT_DELIVERY_POLICY_INVALID');
  validateBaseline(preservation.baseline);
  const expected = preservation.baseline.matrix.criteria.filter(c => !preservation.replacements.some(r => r.criterion_id === c.criterion_id));
  if (canonicalJson(expected) !== canonicalJson(preservation.retained_criteria)) V.fail('VNEXT_DELIVERY_RETAINED_CRITERIA_DRIFT');
  const criteria = [...matrix.criteria, ...expected];
  if (new Set(criteria.map(c => c.criterion_id)).size !== criteria.length) V.fail('VNEXT_DELIVERY_CRITERION_COLLISION');
  return { ...matrix, schema: criteria.some(c => c.assertions?.length) ? 'kodjo.ui-criteria.v2' : matrix.schema, criteria };
}
function fromMarkdown(body) {
  return body.includes('<KODJO_VNEXT_DELIVERY_PRESERVATION_JSON>') ? extractTaggedJson(body, 'KODJO_VNEXT_DELIVERY_PRESERVATION_JSON') : null;
}
function state(baseline) { return baseline.delivery || baseline.finalization; }
module.exports = { validateUiProofs, validateNonUiProofs, observe, validateBaseline, build, validate, merge, fromMarkdown, state };

const Device = require('./device-proof-policy');
const TYPES = new Set(['FUNCTIONAL_TEST','STATIC_ANALYSIS',...Device.DEFERABLE_PROOFS]);
function proofs(rows, required, code) {
  if (!Array.isArray(rows) || !rows.length) V.fail(code);
  const types = rows.map(p=>p.proof_type).sort();
  if (new Set(types).size !== types.length || types.some(t=>!TYPES.has(t))
      || (required && V.canonicalStringify(types)!==V.canonicalStringify([...required].sort()))) V.fail(code);
  for (const p of rows) {
    if (typeof p.evidence!=='string' || !p.evidence.trim()) V.fail(code);
    if (Device.isDeferred(p)) continue;
    if (p.status!=='PASS' || ['VISUAL_COMPARE','DEVICE_CHECK'].includes(p.proof_type)) V.fail(code);
  }
}
function validateUiProofs(matrix, review, code) {
  for (const criterion of matrix.criteria) {
    const row=review.criteria.find(r=>r.criterion_id===criterion.criterion_id);
    if (!row) V.fail(code);
    proofs(row.proof_results,criterion.proof_required,code);
    const expected=criterion.assertions||[], observed=row.assertion_results||[];
    if (V.canonicalStringify(expected.map(a=>a.assertion_id).sort())!==V.canonicalStringify(observed.map(a=>a.assertion_id).sort())) V.fail(code);
    for (const a of observed) {
      proofs(a.proof_results,expected.find(e=>e.assertion_id===a.assertion_id).proof_required,code);
      if (!['CONFORME','NON_VERIFIABLE','PENDING_DEVICE'].includes(a.status)
          || (a.status!=='CONFORME'&&!Device.deviceOnlyGap(a.proof_results,true))) V.fail(code);
    }
  }
}
function validateNonUiProofs(review, code) {
  const nonUi=review.non_ui_plan_assessment;
  const derogations=review.device_check_derogations||[];
  const seen=new Set();
  for (const d of derogations) {
    const r=nonUi?.requirements?.find(r=>r.requirement_id===d.requirement_id);
    if (!r || seen.has(d.requirement_id) || d.proof_type!=='DEVICE_CHECK' || d.status!=='NOT_EXECUTED'
        || !d.decided_by || !d.decision || !d.residual_risk
        || !r.proof_results?.some(p=>p.proof_type==='DEVICE_CHECK'&&p.status==='PENDING_DEVICE')) V.fail(code);
    seen.add(d.requirement_id);
  }
  if (!nonUi) return;
  if (nonUi.status!=='CONFORME'||!nonUi.requirements?.length) V.fail(code);
  for (const r of nonUi.requirements) {
    proofs(r.proof_results,null,code);
    if (!['CONFORME','NON_VERIFIABLE'].includes(r.status)
        || (r.status!=='CONFORME'&&!Device.deviceOnlyGap(r.proof_results,true))) V.fail(code);
  }
}
