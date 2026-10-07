#!/usr/bin/env node
'use strict';
// Read-only VNext finalization entry. GitHub decisions are verified at source;
// closure here is confined to local certification evidence, never a product PR.
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const V = require('./lib/vnext-contract');
const Final = require('./lib/vnext-finalization');
const Delivery = require('./lib/vnext-delivery-preservation');
const { extractTaggedJson } = require('./lib/plan-impact');
const { matrixFingerprint } = require('./lib/ui-criteria-contract');
const Source = require('./verify-source-comment');
function verifyReviewSource(comment,input) {
  const origin=input.reviewSource;
  if(!origin)return Source.verify(comment,{repository:input.repository,issue:input.issue,id:input.reviewId});
  if(origin.kind!=='CONNECTOR_TECHNICAL_REVIEW' || origin.actor!=='MyUncried'
      || origin.application_slug!=='chatgpt-codex-connector'
      || comment.performed_via_github_app?.slug!==origin.application_slug
      || !/^[0-9a-f]{64}$/.test(origin.body_sha256 || '') || V.sha256(comment.body)!==origin.body_sha256
      || !comment.body.startsWith('[KODJO_VNEXT] IMPLEMENTATION_REVIEW\n')
      || !/^reviewer=ChatGPT$/m.test(comment.body) || !/^human_review_performed=false$/m.test(comment.body)) V.fail('VNEXT_FINAL_REVIEW_SOURCE_INVALID');
  return Source.verify(comment,{repository:input.repository,issue:input.issue,id:input.reviewId,actor:origin.actor});
}
function execute(input, { cwd, directory, github }) {
  const read = (revision, file) => execFileSync('git', ['show', revision + ':' + file], { cwd, encoding:'utf8', windowsHide:true, maxBuffer:32*1024*1024 });
  V.assertSha40(input.planRevision, 'VNEXT_FINAL_PLAN_REVISION_REQUIRED');
  require('./lib/vnext-figma-source').safePath(input.planPath);
  const plan = read(input.planRevision,input.planPath);
  V.assertSha40(input.approvedPlanBlobOid,'VNEXT_FINAL_APPROVED_PLAN_BLOB_REQUIRED');
  if(require('./lib/vnext-legacy-queue-adapter').gitBlobOid(plan)!==input.approvedPlanBlobOid) V.fail('VNEXT_FINAL_APPROVED_PLAN_BLOB_MISMATCH');
  const initialMatrix = extractTaggedJson(plan,'KODJO_UI_CRITERIA_MATRIX_JSON');
  const contract = extractTaggedJson(plan,'KODJO_UI_PLAN_CONTRACT_JSON');
  if (contract.matrix_sha256 !== matrixFingerprint(initialMatrix)) V.fail('VNEXT_FINAL_APPROVED_PLAN_DRIFT');
  const preservation = Delivery.fromMarkdown(plan);
  const matrix = Delivery.merge(initialMatrix, preservation);
  const nonUiRequirements = plan.includes('<KODJO_REQUIREMENT_CONTRACT_JSON>')
    ? require('./lib/requirement-contract').verifyEmbedded(plan).requirement_contract.requirements.filter(r=>r.domain==='NON_UI') : [];
  const reviewComment = verifyReviewSource(github.comment(input.repository,input.reviewId),input);
  const heads = [...reviewComment.body.replace(/\r\n/g,'\n').matchAll(/^head=([^\n]+)$/gm)].map(m=>m[1].trim());
  if (heads.length !== 1 || heads[0] !== input.head) V.fail('VNEXT_FINAL_REVIEW_HEAD_MISMATCH');
  const slices=[...reviewComment.body.replace(/\r\n/g,'\n').matchAll(/^slice_id=([^\n]+)$/gm)].map(m=>m[1].trim());
  if(slices.length!==1||slices[0]!==input.sliceId)V.fail('VNEXT_FINAL_REVIEW_SLICE_MISMATCH');
  const review = extractTaggedJson(reviewComment.body,'KODJO_UI_IMPLEMENTATION_REVIEW_JSON');
  if (input.checksReceipt?.head !== input.head) V.fail('VNEXT_FINAL_CHECKS_HEAD_MISMATCH');
  const result = Final.finalize({...input,cwd,matrix,review,nonUiRequirements,checks:input.checksReceipt.checks,
    retainedTargets:preservation?.retained_criteria.flatMap(c=>c.change_targets) || [],
    acceptance: input.decisionId ? github.comment(input.repository,input.decisionId) : null,
    originDecision: input.originDecisionId ? github.comment(input.repository,input.originDecisionId) : null});
  const unsigned={...result,plan_blob_oid:input.approvedPlanBlobOid};delete unsigned.contract_hash;
  const bound=V.sealContract(unsigned);
  fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,'finalization.json'),JSON.stringify(bound,null,2)+'\n');
  return bound;
}
if (require.main === module) {
  try {
    const [manifest,directory] = process.argv.slice(2);
    if (!manifest || !directory) throw Error('USAGE: finalize-vnext-delivery.js <manifest.json> <external-evidence-directory>');
    const github = require('./verify-authorizations').ghClient();
    execute(JSON.parse(fs.readFileSync(manifest,'utf8')),{cwd:process.cwd(),directory:path.resolve(directory),github});
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
module.exports = {execute,verifyReviewSource};
