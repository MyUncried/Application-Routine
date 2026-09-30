'use strict';

const V = require('./vnext-contract');

function validateExecutionContext(context) {
  V.assertExactKeys(context, ['mode', 'writer_id'], [], 'VNEXT_WRITER_CONTEXT_REQUIRED');
  if (!['LOCAL', 'CLOUD'].includes(context.mode)) V.fail('VNEXT_WRITER_MODE_INVALID');
  V.assertUnicodeExactText(context.writer_id, 'VNEXT_WRITER_ID_REQUIRED', 'writer_id');
  return { mode: context.mode, writer_id: context.writer_id };
}

function validateNativeShape(rows) {
  if (!Array.isArray(rows)) V.fail('VNEXT_NATIVE_ASSESSMENT_REQUIRED');
  const seen = new Set();
  for (const row of rows) {
    V.assertExactKeys(row, ['criterion_id', 'availability', 'primitive', 'selected_primitive',
      'functional_requirement_id', 'evidence_refs', 'justification', 'exception_reason'], ['assessment_evidence_hash', 'assessment_evidence_ref'], 'VNEXT_NATIVE_DECISION_KEYS_INVALID');
    V.assertUnicodeExactText(row.criterion_id, 'VNEXT_NATIVE_CRITERION_REQUIRED', 'criterion_id');
    if (seen.has(row.criterion_id)) V.fail('VNEXT_NATIVE_CRITERION_DUPLICATE');
    seen.add(row.criterion_id);
    if (!['NOT_APPLICABLE', 'AVAILABLE', 'UNAVAILABLE'].includes(row.availability)) V.fail('VNEXT_NATIVE_AVAILABILITY_INVALID');
    V.assertUnicodeExactText(row.justification, 'VNEXT_NATIVE_JUSTIFICATION_REQUIRED', 'justification');
    V.uniqueStrings(row.evidence_refs, 'VNEXT_NATIVE_EVIDENCE_REQUIRED', 'evidence_refs');
    for (const key of ['primitive', 'selected_primitive', 'functional_requirement_id']) {
      if (row[key] !== null) V.assertUnicodeExactText(row[key], 'VNEXT_NATIVE_REFERENCE_INVALID', key);
    }
    if (row.availability === 'NOT_APPLICABLE') {
      if (row.primitive !== null || row.selected_primitive !== null || row.functional_requirement_id !== null) V.fail('VNEXT_NATIVE_NOT_APPLICABLE_INVALID');
    } else if (row.availability === 'AVAILABLE') {
      if (!row.primitive || !row.selected_primitive) V.fail('VNEXT_NATIVE_PRIMITIVE_REQUIRED');
      if (row.primitive !== row.selected_primitive && !row.functional_requirement_id) V.fail('NATIVE_PRIMITIVE_EXCEPTION_REQUIRED');
    } else if (row.primitive !== null || !row.selected_primitive) V.fail('VNEXT_NATIVE_UNAVAILABLE_INVALID');
    const exception = row.availability === 'AVAILABLE' && row.primitive !== row.selected_primitive;
    if (row.exception_reason !== (exception ? 'FUNCTIONAL_REQUIREMENT_UNSATISFIED' : null)) V.fail('VNEXT_NATIVE_EXCEPTION_REASON_INVALID');
  }
  return rows;
}

function buildNativeDecisions(rows, { uiAtomicityContract, requirementRegistry, sourceManifest, applicationHead, resolveNativeEvidence = null }) {
  validateNativeShape(rows);
  const criteria = uiAtomicityContract?.criteria || [];
  const byId = new Map(criteria.map(row => [row.criterion_id, row]));
  if (rows.length !== criteria.length || rows.some(row => !byId.has(row.criterion_id))) V.fail('VNEXT_NATIVE_ASSESSMENT_INCOMPLETE');
  const requirementIds = new Set(requirementRegistry.requirements.map(row => row.requirement_id));
  const sourceRefs = new Map((sourceManifest?.sources || []).flatMap(source => source.units.map(unit => ['source:' + source.source_id + '#' + unit.unit_id, source.authority])));
  for (const row of rows) {
    const criterion = byId.get(row.criterion_id);
    const proofRefs = new Set(criterion.proof_ids.map(id => 'proof:' + id));
    if (!row.evidence_refs.some(ref => ['DOC', 'DECISION'].includes(sourceRefs.get(ref)))
        || row.evidence_refs.some(ref => !sourceRefs.has(ref) && !proofRefs.has(ref))) V.fail('VNEXT_NATIVE_SOURCE_EVIDENCE_REQUIRED');
    if (row.availability === 'NOT_APPLICABLE' && criterion.assertions.some(assertion => assertion.property_type === 'INTERACTION')) V.fail('VNEXT_NATIVE_INTERACTION_ASSESSMENT_REQUIRED');
    if (row.functional_requirement_id !== null && !requirementIds.has(row.functional_requirement_id)) V.fail('VNEXT_NATIVE_FUNCTIONAL_REQUIREMENT_UNKNOWN');
    if (row.availability !== 'NOT_APPLICABLE' && !criterion.assertions.some(assertion =>
      assertion.property_type === 'INTERACTION' && assertion.expected.includes(row.selected_primitive)
      && assertion.proof_ids.some(id => row.evidence_refs.includes('proof:' + id)))) V.fail('VNEXT_NATIVE_BRANCH_ASSERTION_REQUIRED');
    if (row.availability === 'AVAILABLE' && row.primitive !== row.selected_primitive
        && (row.functional_requirement_id !== criterion.requirement_id
          || !criterion.risk_types.includes('FUNCTIONAL')
          || !criterion.proof_required.some(type => ['FUNCTIONAL_TEST', 'STATIC_ANALYSIS'].includes(type))
          || !row.evidence_refs.some(ref => criterion.proof_ids.some(id => ref === 'proof:' + id)))) V.fail('VNEXT_NATIVE_FUNCTIONAL_EVIDENCE_REQUIRED');
  }
  // Registered references alone cannot grant eligibility. Production has no
  // implicit resolver: authenticated observation is required before a UI target.
  return rows.map(row => {
    if (typeof resolveNativeEvidence !== 'function') V.fail('WAIT_FOR_PROOF', 'native assessment');
    const subject = { ...row }; delete subject.assessment_evidence_hash; delete subject.assessment_evidence_ref;
    subject.evidence_refs = [...subject.evidence_refs].sort();
    const evidence = resolveNativeEvidence(subject, { sourceManifest, applicationHead });
    if (!evidence || evidence.schema_version !== 'kodjo.vnext.native-assessment-evidence.v1' || evidence.status !== 'VERIFIED') V.fail('VNEXT_NATIVE_PROOF_NOT_VERIFIED');
    V.verifyContractHash(evidence, 'VNEXT_NATIVE_PROOF_HASH_INVALID');
    if (evidence.native_assessment_hash !== V.canonicalHash(subject)
        || evidence.source_manifest_hash !== sourceManifest.contract_hash
        || evidence.application_head !== applicationHead) V.fail('VNEXT_NATIVE_PROOF_BINDING_MISMATCH');
    V.assertUnicodeExactText(evidence.evidence_ref, 'VNEXT_NATIVE_PROOF_REFERENCE_REQUIRED', 'evidence_ref');
    return { ...subject, assessment_evidence_hash: evidence.contract_hash, assessment_evidence_ref: evidence.evidence_ref };
  })
    .sort((a, b) => a.criterion_id.localeCompare(b.criterion_id));
}

function exceptionIds(rows) {
  validateNativeShape(rows);
  return rows.filter(row => row.availability === 'AVAILABLE' && row.primitive !== row.selected_primitive)
    .map(row => row.criterion_id).sort();
}

function validateExceptionApprovals(rows, approvals, decision) {
  const expected = decision === 'APPROVED' ? exceptionIds(rows) : [];
  const actual = approvals === undefined ? [] : V.uniqueStrings(approvals, 'VNEXT_NATIVE_APPROVALS_INVALID', 'native_exception_approvals', { allowEmpty: true }).sort();
  if (V.canonicalStringify(expected) !== V.canonicalStringify(actual)) V.fail('NATIVE_PRIMITIVE_EXCEPTION_REQUIRED');
  return actual;
}

module.exports = { validateExecutionContext, validateNativeShape, buildNativeDecisions, exceptionIds, validateExceptionApprovals };
