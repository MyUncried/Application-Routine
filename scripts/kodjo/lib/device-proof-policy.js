'use strict';
// A deferred observation remains pending after exact-delivery user approval.
// Technical FAIL/NON_VERIFIABLE is never a device-only gap.
const DEFERABLE_PROOFS = new Set(['VISUAL_COMPARE', 'DEVICE_CHECK', 'ACCESSIBILITY_CHECK']);
function isDeferred(proof) {
  return DEFERABLE_PROOFS.has(proof.proof_type) && proof.status === 'PENDING_DEVICE';
}
function deviceOnlyGap(proofs, gateRequired) {
  return gateRequired && proofs.length > 0 && proofs.some(isDeferred)
    && proofs.every(p => p.status === 'PASS' || isDeferred(p));
}
function effectiveDeviceGate(planned, review) {
  const proofs=[...(review?.criteria||[]).flatMap(row=>[...(row.proof_results||[]),...(row.assertion_results||[]).flatMap(a=>a.proof_results||[])]),
    ...(review?.non_ui_plan_assessment?.requirements||[]).flatMap(row=>row.proof_results||[])];
  return Boolean(planned || proofs.some(proof=>proof.proof_type==='ACCESSIBILITY_CHECK'&&proof.status==='PENDING_DEVICE'));
}
module.exports = { effectiveDeviceGate, DEFERABLE_PROOFS, isDeferred, deviceOnlyGap };
