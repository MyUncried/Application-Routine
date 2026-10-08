'use strict';
const V = require('./vnext-contract');
const Review = require('./review-contract');
const Block = require('./machine-block');
// Read the evidence from the exact approved Git plan, never from the closure
// request. Historical plans without this evidence are explicitly unqualified.
function fromPlan(plan) {
  const evidence = Block.parse(plan, 'KODJO_VNEXT_REVIEW_COVERAGE_JSON', {required:false});
  if (!evidence) return {coverage_status:'NOT_RECORDED',pending_target_ids:null};
  V.assertExactKeys(evidence,['context','report'],[],'VNEXT_REVIEW_COVERAGE_KEYS');
  Review.validateReviewContext(evidence.context);
  Review.validateReviewReport(evidence.report,evidence.context);
  const hashes = [...plan.matchAll(/^plan_contract_hash=([^\n]+)$/gm)].map(m=>m[1].trim());
  if (hashes.length !== 1 || hashes[0] !== evidence.report.plan_contract_hash || evidence.report.verdict !== 'APPROVE') V.fail('VNEXT_REVIEW_COVERAGE_BINDING');
  const pending = evidence.report.pending_target_ids || [];
  return {phase:'PLANNING',coverage_status:pending.length ? 'ACCEPTED_WITH_PENDING_SECONDARY_TARGETS' : 'COMPLETE',
    pending_target_ids:structuredClone(pending),review_report_hash:evidence.report.contract_hash,
    review_context_hash:evidence.context.contract_hash,plan_contract_hash:evidence.report.plan_contract_hash,
    catalogue_size:Object.values(evidence.context.target_catalog).reduce((n,ids)=>n+ids.length,0),
    coverage_policy:structuredClone(evidence.context.coverage_policy || null)};
}
module.exports = {fromPlan};
