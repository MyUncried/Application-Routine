'use strict';

const V = require('./vnext-contract');

// A resolver cannot attest the absence of an import it does not understand.
function buildProofResult({ outcome, supported, evidenceRefs, requiredForGate, reason }) {
  if (typeof supported !== 'boolean' || typeof requiredForGate !== 'boolean') {
    V.fail('VNEXT_PROOF_BOOLEAN_REQUIRED');
  }
  if (!['PASS', 'FAIL', 'UNAVAILABLE'].includes(outcome)) V.fail('VNEXT_PROOF_OUTCOME_INVALID');
  const status = !supported || outcome === 'UNAVAILABLE' ? 'NON_VERIFIABLE' : outcome;
  const refs = V.uniqueStrings(evidenceRefs, 'VNEXT_PROOF_EVIDENCE_INVALID', 'evidenceRefs').sort();
  V.assertUnicodeExactText(reason, 'VNEXT_PROOF_REASON_REQUIRED');
  return V.sealContract({
    schema_version: 'kodjo.vnext.proof-result.v1',
    status,
    evidence_refs: refs,
    reason,
    required_for_gate: requiredForGate,
    gate: status === 'PASS' || !requiredForGate ? 'CONTINUE' : (status === 'FAIL' ? 'CORRECT_DEFECT' : 'WAIT_FOR_PROOF'),
    defect_demonstrated: status === 'FAIL',
    auto_retry: false,
  });
}

module.exports = { buildProofResult };
