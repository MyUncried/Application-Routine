'use strict';
// Explicit mock reviewer evidence for unit fixtures only. Production never
// fills an absent reviewer attestation; negative tests call the raw builder.
function semantic(context, findings = []) {
  return { findings, reviewed_target_ids: Object.values(context.target_catalog).flat().sort(),
    finding_resolutions: context.causal_finding_ids.map(finding_id => ({ finding_id, status: 'RESOLVED',
      evidence_refs: ['UNIT_TEST_ONLY: candidate inspected'], note: 'Mock reviewer finding-by-finding resolution; not campaign evidence.' })) };
}
function attested(input) {
  return { ...input, semanticReview: { ...semantic(input.reviewContext), ...input.semanticReview } };
}
module.exports = { semantic, attested };
