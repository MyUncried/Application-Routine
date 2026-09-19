#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function fail(code, detail) {
  throw new Error(code + (detail ? ': ' + detail : ''));
}
function ghJson(args) {
  const r = spawnSync('gh', ['api', ...args], { encoding:'utf8', windowsHide:true, shell:false, maxBuffer:16*1024*1024 });
  if (r.error || r.status !== 0) fail('ENV_SYNC_GITHUB_READ_FAILED', r.error ? r.error.message : r.stderr.trim());
  try { return JSON.parse(r.stdout); }
  catch (_) { fail('ENV_SYNC_GITHUB_JSON_INVALID'); }
}
function firstLine(body) {
  return String(body || '').replace(/\r/g,'').split('\n')[0];
}
function one(body, key) {
  const re = new RegExp('^' + key + '=([^\\n]+)$','gm');
  const values = [...String(body || '').replace(/\r/g,'').matchAll(re)].map(m=>m[1]);
  if (values.length !== 1) fail('ENV_SYNC_FIELD_INVALID', key);
  return values[0];
}
function resolve(review, implementation, pr) {
  if (!review || review.user?.login !== 'github-actions[bot]') fail('ENV_SYNC_REVIEW_AUTHOR_INVALID');
  const reviewBody = String(review.body || '').replace(/\r/g,'');
  if (firstLine(reviewBody) !== '[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT') fail('ENV_SYNC_REVIEW_MARKER_INVALID');
  if (one(reviewBody,'verdict') !== 'APPROVE') fail('ENV_SYNC_REVIEW_NOT_APPROVED');
  if (!/^STATUT : IMPLEMENTATION_REVIEW_APPROVED$/m.test(reviewBody)) fail('ENV_SYNC_REVIEW_STATUS_INVALID');

  const implementationId = one(reviewBody,'source_implementation_comment_id');
  if (!implementation || String(implementation.id) !== implementationId) fail('ENV_SYNC_IMPLEMENTATION_ID_MISMATCH');
  if (implementation.user?.login !== 'github-actions[bot]') fail('ENV_SYNC_IMPLEMENTATION_AUTHOR_INVALID');
  if (String(review.issue_url || '') !== String(implementation.issue_url || '')) fail('ENV_SYNC_ISSUE_MISMATCH');

  const implBody = String(implementation.body || '').replace(/\r/g,'');
  if (firstLine(implBody) !== '[KODJO_SLICE] IMPLEMENTATION_OUTPUT') fail('ENV_SYNC_IMPLEMENTATION_MARKER_INVALID');
  if (one(implBody,'continuity_origin') !== 'V2_LEAN_QUEUE') fail('ENV_SYNC_NOT_V2_DELIVERY');
  if (!/^STATUT : IMPLEMENTATION_READY_FOR_REVIEW$/m.test(implBody)) fail('ENV_SYNC_IMPLEMENTATION_STATUS_INVALID');

  const sliceId = one(implBody,'slice_id');
  const head = one(implBody,'head').toLowerCase();
  const baseHead = one(implBody,'base_head').toLowerCase();
  const applicationPr = Number(one(implBody,'application_pr'));
  const applicationBranch = one(implBody,'application_branch');
  const reviewHead = one(reviewBody,'head').toLowerCase();

  if (!/^[0-9a-f]{40}$/.test(head) || !/^[0-9a-f]{40}$/.test(baseHead) || reviewHead !== head) fail('ENV_SYNC_HEAD_INVALID');
  if (!Number.isInteger(applicationPr) || applicationPr < 1) fail('ENV_SYNC_APPLICATION_PR_INVALID');
  if (!pr || Number(pr.number) !== applicationPr) fail('ENV_SYNC_APPLICATION_PR_MISMATCH');
  if (pr.state !== 'open' || pr.base?.ref !== 'main') fail('ENV_SYNC_APPLICATION_PR_NOT_OPEN_MAIN');
  if (String(pr.head?.ref || '') !== applicationBranch) fail('ENV_SYNC_APPLICATION_BRANCH_MOVED');
  if (String(pr.head?.sha || '').toLowerCase() !== head) fail('ENV_SYNC_APPLICATION_HEAD_MOVED');

  return {
    schema:'kodjo.environment.review-sync.v1',
    slice_id:sliceId,
    issue_url:String(review.issue_url),
    implementation_review_comment_id:String(review.id),
    implementation_comment_id:implementationId,
    application_pr:applicationPr,
    application_branch:applicationBranch,
    base_head:baseHead,
    application_head:head,
  };
}
function main(argv) {
  const [repository, reviewCommentId, outputFile] = argv;
  if (!repository || !/^[0-9]+$/.test(String(reviewCommentId || '')) || !outputFile) {
    fail('USAGE','resolve-review-environment-sync.js <owner/repo> <review-comment-id> <output.json>');
  }
  const review = ghJson(['repos/'+repository+'/issues/comments/'+reviewCommentId]);
  const reviewBody = String(review.body || '').replace(/\r/g,'');
  const implId = one(reviewBody,'source_implementation_comment_id');
  const implementation = ghJson(['repos/'+repository+'/issues/comments/'+implId]);
  const implBody = String(implementation.body || '').replace(/\r/g,'');
  const applicationPr = one(implBody,'application_pr');
  const pr = ghJson(['repos/'+repository+'/pulls/'+applicationPr]);
  let result;
  try {
    result = resolve(review,implementation,pr);
  } catch (error) {
    if (String(error && error.message ? error.message : error) === 'ENV_SYNC_NOT_V2_DELIVERY') {
      result={schema:'kodjo.environment.review-sync.v1',applicable:false,implementation_review_comment_id:String(review.id)};
      fs.writeFileSync(path.resolve(outputFile),JSON.stringify(result,null,2)+'\n','utf8');
      process.stdout.write('[KODJO_ENV] REVIEW_SYNC_NOT_APPLICABLE comment='+review.id+'\n');
      return;
    }
    throw error;
  }
  result.applicable=true;
  fs.writeFileSync(path.resolve(outputFile),JSON.stringify(result,null,2)+'\n','utf8');
  process.stdout.write('[KODJO_ENV] REVIEW_SYNC_READY slice='+result.slice_id+' head='+result.application_head.slice(0,12)+'\n');
}
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { process.stderr.write(String(error && error.message ? error.message : error)+'\n'); process.exit(1); }
}
module.exports = { resolve, one, firstLine };
