'use strict';
const V = require('./vnext-contract');

// The finalizer supplies the verification. This consumer never manufactures
// a review, a human decision, a proof status, or a product publication.
function validateConfig(c) {
  if (c.stage !== 'FINALIZE_DELIVERY' || c.repository !== 'MyUncried/Application-Routine'
      || c.slice_id !== 'VNEXT-12-QUALIF' || c.campaign_id !== '628b3349-88b4-4bf1-be6b-50bc09e7d245'
      || c.closure_scope !== 'GITHUB_CERTIFICATION_DELIVERY' || c.pre1_in_scope !== false
      || c.final_audit_authorized !== false || c.revision_limit !== 1
      || !Number.isSafeInteger(c.issue_number) || c.issue_number <= 0 || c.issue_number === 269
      || !Number.isSafeInteger(c.delivery_pr_number) || c.delivery_pr_number <= 0
      || c.delivery_pr_number === 269 || c.delivery_pr_number === c.issue_number
      || c.delivery_branch !== 'certification/vnext/' + c.campaign_id
      || !/^[0-9a-f]{64}$/.test(c.issue_body_sha256 || '')) V.fail('VNEXT_GITHUB_CLOSURE_CONFIG_REFUSED');
  V.assertSha40(c.delivery_head, 'VNEXT_GITHUB_CLOSURE_HEAD_REQUIRED');
  require('./vnext-figma-source').safePath(c.finalization_manifest);
  return c;
}
function binding(c) {
  return '[KODJO_VNEXT] CERTIFICATION_DELIVERY\ncampaign_id=' + c.campaign_id + '\nslice_id=' + c.slice_id + '\n';
}
function observe(c, github) {
  const issue = github.issue(c.repository, c.issue_number);
  const pr = github.pull(c.repository, c.delivery_pr_number);
  if (issue.pull_request || issue.html_url !== `https://github.com/${c.repository}/issues/${c.issue_number}`
      || !issue.body?.startsWith(binding(c)) || V.sha256(issue.body) !== c.issue_body_sha256
      || pr.html_url !== `https://github.com/${c.repository}/pull/${c.delivery_pr_number}`
      || pr.head?.repo?.full_name !== c.repository || pr.base?.repo?.full_name !== c.repository
      || pr.head?.ref !== c.delivery_branch || pr.head?.sha !== c.delivery_head
      || pr.base?.ref !== 'protocol/vnext-proof-stability-20260930'
      || pr.merged || !['open','closed'].includes(issue.state) || pr.state !== 'open') V.fail('VNEXT_GITHUB_CLOSURE_TARGET_DRIFT');
  return {issue, pr};
}
function prepare(c, finalization) {
  validateConfig(c);
  V.verifyContractHash(finalization, 'VNEXT_GITHUB_CLOSURE_FINALIZATION_HASH');
  if (finalization.schema_version !== 'kodjo.vnext.finalization.v1'
      || finalization.final_status !== 'READY_TO_CLOSE' || finalization.repository !== c.repository
      || finalization.issue_number !== c.issue_number || finalization.slice_id !== c.slice_id
      || finalization.head !== c.delivery_head || finalization.visual_compliance_attested !== false
      || finalization.accessibility_compliance_attested !== false) V.fail('VNEXT_GITHUB_CLOSURE_FINALIZATION_BINDING');
  const record = {campaign_id:c.campaign_id, slice_id:c.slice_id, issue_number:c.issue_number,
    delivery_pr_number:c.delivery_pr_number, head:c.delivery_head, finalization_hash:finalization.contract_hash,
    review_comment_id:finalization.review_comment_id, original_decision:finalization.original_decision,
    reservations:finalization.reservations, pending_proofs:finalization.pending_proofs,
    proof_resolutions:finalization.proof_resolutions, not_executed_proofs:finalization.not_executed_proofs,
    acceptance_scope:finalization.acceptance_scope, scope:c.closure_scope,
    application_published:false, visual_compliance_attested:false, accessibility_compliance_attested:false};
  const key = c.campaign_id + ':' + c.slice_id;
  const body = tag => `[KODJO_VNEXT] ${tag}\nclosure_key=${key}\n\n\`\`\`json\n${JSON.stringify(record,null,2)}\n\`\`\`\n`;
  return {record, finalBody:body('FINAL_OUTPUT'), closedBody:body('SLICE_CLOSED'), key};
}
function close(c, finalization, github) {
  const plan = prepare(c, finalization);
  let current = observe(c, github);
  const matching = (tag, body) => {
    const rows = github.comments(c.repository,c.issue_number).filter(x => x.body?.startsWith('[KODJO_VNEXT] ' + tag + '\nclosure_key=' + plan.key + '\n'));
    if (rows.length > 1 || rows.some(x => x.body !== body || x.user?.login !== 'github-actions[bot]')) V.fail('VNEXT_GITHUB_CLOSURE_RECORD_CONFLICT');
    return rows[0];
  };
  let final = matching('FINAL_OUTPUT', plan.finalBody);
  let closed = matching('SLICE_CLOSED', plan.closedBody);
  if ((current.issue.state === 'closed' && !final) || (closed && current.issue.state !== 'closed')) V.fail('VNEXT_GITHUB_CLOSURE_STATE_CONFLICT');
  if (!final) {
    github.comment(c.repository,c.issue_number,plan.finalBody);
    final = matching('FINAL_OUTPUT',plan.finalBody);
    if (!final) V.fail('VNEXT_GITHUB_CLOSURE_FINAL_OUTPUT_NOT_OBSERVED');
  }
  current = observe(c,github); // Recheck delivery and destination after publication.
  if (current.issue.state === 'open') github.closeIssue(c.repository,c.issue_number);
  current = observe(c,github);
  if (current.issue.state !== 'closed' || current.issue.state_reason !== 'completed') V.fail('VNEXT_GITHUB_CLOSURE_NOT_OBSERVED');
  if (!closed) {
    github.comment(c.repository,c.issue_number,plan.closedBody);
    closed = matching('SLICE_CLOSED',plan.closedBody);
    if (!closed) V.fail('VNEXT_GITHUB_CLOSURE_RECORD_NOT_OBSERVED');
  }
  return V.sealContract({schema_version:'kodjo.vnext.github-closure.v1', ...plan.record,
    status:'SLICE_CLOSED', github_issue_closed:true, final_output_comment_id:String(final.id),
    slice_closed_comment_id:String(closed.id), issue_url:current.issue.html_url});
}
module.exports = {validateConfig, binding, observe, prepare, close};
