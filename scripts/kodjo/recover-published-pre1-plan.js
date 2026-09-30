#!/usr/bin/env node
'use strict';
// Scoped recovery of the verified PRE-1 artifact; never an approval override.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const REPOSITORY = 'MyUncried/Application-Routine';
const COMMENT_ID = '5913845392';
const COMMIT = '04b6e2d31a02ba9789add5b76a96ad5c40ee3e5f';
const PLAN_PATH = '.github/orchestration/v2-slices/V2-PRE-1/publication-recovery-36720420887/technical-plan.md';
const BLOB = '21a590d0bf3fcd8b0b9638da62d6d64d77c78c01';
const SHA256 = 'aa3e1602f25236cf0ee472460b6f8c1c62b300b1b33063872e48bc3031c49c40';
function need(ok, code) { if (!ok) throw new Error(code); }
function api(route) {
  const r = spawnSync('gh', ['api', 'repos/' + REPOSITORY + '/' + route], { encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
  need(!r.error && r.status === 0, 'PRE1_RECOVERY_API_FAILED:' + route);
  return JSON.parse(r.stdout);
}

const CORRECTED_COMMENT_ID = '5916079168';
const CORRECTED_COMMIT = '990103188f2936bb2ed7d766fabe56ab0b779210';
const CORRECTED_PATH = '.github/orchestration/v2-slices/V2-PRE-1/correction-review-36734142447/corrected-plan.md';
const CORRECTED_BLOB = '8ed0768ccfcf9ec157b2aa8d5cc177be5f97d426';
const CORRECTED_SHA256 = 'a5f78c7bd25fa2bf35d758e8cce6769fcfce392d1b523a67dcd512be805f5019';
function recoverCorrected(comment, repository, get) {
  need(repository === REPOSITORY, 'PRE1_CORRECTED_REPOSITORY_MISMATCH');
  need(String(comment?.id) === CORRECTED_COMMENT_ID && comment?.user?.login === 'MyUncried', 'PRE1_CORRECTED_PUBLICATION_AUTHORITY_INVALID');
  need(comment.issue_url === 'https://api.github.com/repos/' + REPOSITORY + '/issues/249', 'PRE1_CORRECTED_ISSUE_MISMATCH');
  need(String(comment.body).includes('https://github.com/' + REPOSITORY + '/blob/' + CORRECTED_COMMIT + '/' + CORRECTED_PATH), 'PRE1_CORRECTED_REFERENCE_MISMATCH');
  const tree = get('git/trees/' + CORRECTED_COMMIT + '?recursive=1');
  need(!tree.truncated && tree.tree.some(x => x.path === CORRECTED_PATH && x.sha === CORRECTED_BLOB && x.type === 'blob'), 'PRE1_CORRECTED_COMMIT_BINDING_MISMATCH');
  const blob = get('git/blobs/' + CORRECTED_BLOB);
  need(blob.sha === CORRECTED_BLOB && blob.encoding === 'base64', 'PRE1_CORRECTED_BLOB_INVALID');
  const bytes = Buffer.from(blob.content, 'base64');
  need(bytes.length === 226423 && crypto.createHash('sha256').update(bytes).digest('hex') === CORRECTED_SHA256, 'PRE1_CORRECTED_PLAN_INTEGRITY_MISMATCH');
  return '[KODJO_V2] PLAN_OUTPUT\nslice_id=V2-PRE-1\nbootstrap_path=.github/orchestration/v2-slices/V2-PRE-1/slice-bootstrap.json\nsource_head=e216294506bed87dd80855937e3fabfbfa322b82\nplanning_mode=INITIAL\nplanning_contract=kodjo.plan-impact.v1\nui_planning_contract=kodjo.ui-plan-criteria.v2\ncorrected_plan_commit=' + CORRECTED_COMMIT + '\ncorrected_plan_blob=' + CORRECTED_BLOB + '\nSTATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW\n\n' + bytes.toString('utf8');
}

function recover(comment, repository = REPOSITORY, get = api) {
  if (String(comment?.id) === CORRECTED_COMMENT_ID) return recoverCorrected(comment, repository, get);
  need(repository === REPOSITORY, 'PRE1_RECOVERY_REPOSITORY_MISMATCH');
  need(String(comment?.id) === COMMENT_ID && comment?.user?.login === 'MyUncried', 'PRE1_RECOVERY_PUBLICATION_AUTHORITY_INVALID');
  need(comment.issue_url === 'https://api.github.com/repos/' + REPOSITORY + '/issues/249', 'PRE1_RECOVERY_ISSUE_MISMATCH');
  need(String(comment.body).includes('https://github.com/' + REPOSITORY + '/blob/' + COMMIT + '/' + PLAN_PATH), 'PRE1_RECOVERY_REFERENCE_MISMATCH');
  const run = get('actions/runs/36720420887');
  need(run.id === 36720420887 && run.status === 'completed' && run.conclusion === 'failure' && run.head_sha === '48b444ededb735da47a42474c39e150224e92395', 'PRE1_RECOVERY_SOURCE_RUN_MISMATCH');
  const jobs = get('actions/runs/36720420887/jobs?per_page=100').jobs;
  const job = jobs.find(x => x.id === 109903807562);
  need(job && job.status === 'completed' && job.conclusion === 'failure', 'PRE1_RECOVERY_SOURCE_JOB_MISMATCH');
  const passed = name => job.steps.some(s => s.name === name && s.conclusion === 'success');
  need(passed('Close impact scope and assemble canonical plan') && passed('Preserve initial planning evidence'), 'PRE1_RECOVERY_VALIDATION_NOT_PROVEN');
  need(job.steps.some(s => s.name === 'Publish canonical initial V2 PLAN_OUTPUT' && s.conclusion === 'failure'), 'PRE1_RECOVERY_PUBLICATION_FAILURE_NOT_PROVEN');
  const tree = get('git/trees/' + COMMIT + '?recursive=1');
  need(!tree.truncated && tree.tree.some(x => x.path === PLAN_PATH && x.sha === BLOB && x.type === 'blob'), 'PRE1_RECOVERY_COMMIT_BINDING_MISMATCH');
  const blob = get('git/blobs/' + BLOB);
  need(blob.sha === BLOB && blob.encoding === 'base64', 'PRE1_RECOVERY_BLOB_INVALID');
  const bytes = Buffer.from(blob.content, 'base64');
  need(bytes.length === 186042 && crypto.createHash('sha256').update(bytes).digest('hex') === SHA256, 'PRE1_RECOVERY_PLAN_INTEGRITY_MISMATCH');
  return '[KODJO_V2] PLAN_OUTPUT\nslice_id=V2-PRE-1\nbootstrap_path=.github/orchestration/v2-slices/V2-PRE-1/slice-bootstrap.json\nsource_head=e216294506bed87dd80855937e3fabfbfa322b82\nplanning_mode=INITIAL\nplanning_contract=kodjo.plan-impact.v1\nui_planning_contract=kodjo.ui-plan-criteria.v2\npublication_recovery_run=36720420887\npublication_recovery_blob=' + BLOB + '\nSTATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW\n\n' + bytes.toString('utf8');
}
if (require.main === module) {
  try {
    const [id, output] = process.argv.slice(2);
    need([COMMENT_ID, CORRECTED_COMMENT_ID].includes(id) && output, 'PRE1_RECOVERY_USAGE_INVALID');
    fs.writeFileSync(output, recover(api('issues/comments/' + id), process.env.GITHUB_REPOSITORY || REPOSITORY), 'utf8');
    process.stdout.write('PRE1 pinned published plan verified: comment=' + id + '\n');
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { recover, COMMENT_ID, CORRECTED_COMMENT_ID };
