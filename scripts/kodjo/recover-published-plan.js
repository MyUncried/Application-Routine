#!/usr/bin/env node
'use strict';
// Generic recovery of a V2 plan published by the repository owner as a verified Git blob
// ([KODJO_V2] PLAN_PUBLICATION), for plans assembled and checked locally without the planning
// model. No comment identifier is hard-coded: authority, slice, commit, blob and integrity are all
// verified from the comment, the slice bootstrap on the protocol checkout and the GitHub API.
// Never an approval override: the plan must still go through the independent review and the gate.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const MARKER = '[KODJO_V2] PLAN_PUBLICATION';
const SHA40 = /^[0-9a-f]{40}$/;
const SHA64 = /^[0-9a-f]{64}$/;
const SLICE = /^V2-[A-Z0-9][A-Z0-9-]{0,40}$/;
const UI_CONTRACT_SCHEMA = 'kodjo.ui-plan-contract.v1';
const UI_PLANNING_CONTRACT = 'kodjo.ui-plan-criteria.v2';

function need(ok, code) { if (!ok) throw new Error(code); }
function normalize(text) { return String(text || '').replace(/\r\n?/g, '\n'); }
function field(body, name) {
  const values = [...normalize(body).matchAll(new RegExp('^' + name + '=([^\\n]*)$', 'gm'))].map((m) => m[1].trim());
  need(values.length === 1, 'PLAN_PUBLICATION_FIELD_INVALID:' + name);
  return values[0];
}
function isPlanPublication(comment) {
  return normalize(comment && comment.body).split('\n')[0].trim() === MARKER;
}
function api(repository) {
  return (route) => {
    const r = spawnSync('gh', ['api', 'repos/' + repository + '/' + route], { encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
    need(!r.error && r.status === 0, 'PLAN_PUBLICATION_API_FAILED:' + route.split('?')[0]);
    return JSON.parse(r.stdout);
  };
}
function readBootstrap(protocolRoot, bootstrapPath) {
  const abs = path.resolve(protocolRoot, bootstrapPath);
  need(abs.startsWith(path.resolve(protocolRoot) + path.sep) && fs.existsSync(abs), 'PLAN_PUBLICATION_BOOTSTRAP_MISSING');
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function recover(comment, repository, get = api(repository), protocolRoot = process.cwd()) {
  need(isPlanPublication(comment), 'PLAN_PUBLICATION_MARKER_INVALID');
  const owner = String(repository || '').split('/')[0];
  need(owner && comment.user && comment.user.login === owner, 'PLAN_PUBLICATION_AUTHORITY_INVALID');
  const slice = field(comment.body, 'slice_id');
  need(SLICE.test(slice), 'PLAN_PUBLICATION_SLICE_INVALID');
  const bootstrapPath = field(comment.body, 'bootstrap_path');
  need(bootstrapPath === '.github/orchestration/v2-slices/' + slice + '/slice-bootstrap.json', 'PLAN_PUBLICATION_BOOTSTRAP_PATH_MISMATCH');
  const bootstrap = readBootstrap(protocolRoot, bootstrapPath);
  need(bootstrap.slice_id === slice && bootstrap.repository === repository, 'PLAN_PUBLICATION_BOOTSTRAP_IDENTITY_MISMATCH');
  need(comment.issue_url === 'https://api.github.com/repos/' + repository + '/issues/' + bootstrap.issue_number, 'PLAN_PUBLICATION_ISSUE_MISMATCH');
  const sourceHead = field(comment.body, 'source_head');
  // REVISION of an already delivered slice (same header as kodjo-v2-slice-plan.yml): the product HEAD is a
  // target-branch commit, the plan is scanned at the application PR HEAD and supersedes the committed plan/review.
  const revision = hasField(comment.body, 'planning_mode') && field(comment.body, 'planning_mode') === 'REVISION';
  if (hasField(comment.body, 'planning_mode')) need(revision, 'PLAN_PUBLICATION_MODE_INVALID');
  let applicationPr = null, applicationHead = null, supersedes = null, priorReview = null;
  if (revision) {
    applicationPr = field(comment.body, 'application_pr');
    applicationHead = field(comment.body, 'application_head');
    supersedes = field(comment.body, 'supersedes_plan_blob_oid');
    priorReview = field(comment.body, 'prior_review_blob_oid');
    need(/^[1-9][0-9]*$/.test(applicationPr) && SHA40.test(applicationHead) && SHA40.test(sourceHead) && SHA40.test(supersedes) && SHA40.test(priorReview), 'PLAN_PUBLICATION_REVISION_IDENTITY_INVALID');
    need(!CLOSURE_FIELDS.some((name) => hasField(comment.body, name)), 'PLAN_PUBLICATION_REVISION_CLOSURE_FORBIDDEN');
  } else {
    need(SHA40.test(sourceHead) && sourceHead === bootstrap.baseline_head, 'PLAN_PUBLICATION_SOURCE_MISMATCH');
    need(!['application_pr', 'application_head'].some((name) => hasField(comment.body, name)), 'PLAN_PUBLICATION_INITIAL_APPLICATION_FORBIDDEN');
  }
  const commit = field(comment.body, 'plan_commit');
  const planPath = field(comment.body, 'plan_path');
  const blobId = field(comment.body, 'plan_blob');
  const digest = field(comment.body, 'plan_sha256');
  const size = Number(field(comment.body, 'plan_size'));
  need(SHA40.test(commit) && SHA40.test(blobId) && SHA64.test(digest) && Number.isInteger(size) && size > 0, 'PLAN_PUBLICATION_IDENTITY_INVALID');
  need(planPath.startsWith('.github/orchestration/v2-slices/' + slice + '/') && planPath.endsWith('.md') && !planPath.includes('..'), 'PLAN_PUBLICATION_PATH_INVALID');
  const target = String(bootstrap.target_branch || 'main');
  const compare = get('compare/' + commit + '...' + encodeURIComponent(target));
  need(compare && ['ahead', 'identical'].includes(compare.status), 'PLAN_PUBLICATION_COMMIT_NOT_ON_TARGET');
  const tree = get('git/trees/' + commit + '?recursive=1');
  need(tree && !tree.truncated && tree.tree.some((x) => x.path === planPath && x.sha === blobId && x.type === 'blob'), 'PLAN_PUBLICATION_COMMIT_BINDING_MISMATCH');
  if (revision) {
    const sourceCompare = get('compare/' + sourceHead + '...' + encodeURIComponent(target));
    need(sourceCompare && ['ahead', 'identical'].includes(sourceCompare.status), 'PLAN_PUBLICATION_SOURCE_NOT_ON_TARGET');
    const sourceTree = get('git/trees/' + sourceHead + '?recursive=1');
    const dir = '.github/orchestration/v2-slices/' + slice + '/';
    const blobAt = (file) => (sourceTree && !sourceTree.truncated && sourceTree.tree.find((x) => x.path === dir + file && x.type === 'blob') || {}).sha;
    need(blobAt('technical-plan.md') === supersedes, 'PLAN_PUBLICATION_SUPERSEDED_PLAN_MISMATCH');
    need(blobAt('independent-review.md') === priorReview, 'PLAN_PUBLICATION_PRIOR_REVIEW_MISMATCH');
  }
  const blob = get('git/blobs/' + blobId);
  need(blob && blob.sha === blobId && blob.encoding === 'base64', 'PLAN_PUBLICATION_BLOB_INVALID');
  const bytes = Buffer.from(blob.content, 'base64');
  need(bytes.length === size && crypto.createHash('sha256').update(bytes).digest('hex') === digest, 'PLAN_PUBLICATION_PLAN_INTEGRITY_MISMATCH');
  const plan = bytes.toString('utf8');
  const statuses = [...normalize(plan).matchAll(/^PLAN_STATUS: ([A-Z_]+)\s*$/gm)].map((m) => m[1]);
  need(statuses.length === 1 && statuses[0] === 'READY_FOR_INDEPENDENT_REVIEW', 'PLAN_PUBLICATION_PLAN_NOT_REVIEWABLE');
  const impact = normalize(plan).match(/<KODJO_PLAN_IMPACT_JSON>\s*([\s\S]*?)\s*<\/KODJO_PLAN_IMPACT_JSON>/);
  need(impact && JSON.parse(impact[1]).scan_revision === (revision ? applicationHead : sourceHead), 'PLAN_PUBLICATION_SCAN_REVISION_MISMATCH');
  const ui = normalize(plan).match(/<KODJO_UI_PLAN_CONTRACT_JSON>\s*([\s\S]*?)\s*<\/KODJO_UI_PLAN_CONTRACT_JSON>/);
  need(ui && JSON.parse(ui[1]).schema === UI_CONTRACT_SCHEMA, 'PLAN_PUBLICATION_UI_CONTRACT_INVALID');
  if (revision) {
    need(/<KODJO_PLAN_REVISION_STATUS_JSON>/.test(plan), 'PLAN_PUBLICATION_REVISION_STATUS_MISSING');
    // Same header as kodjo-v2-slice-plan.yml « Publish candidate V2 plan » (no planning_mode: non-INITIAL downstream).
    return '[KODJO_V2] PLAN_OUTPUT\nslice_id=' + slice + '\nbootstrap_path=' + bootstrapPath + '\nsource_head=' + sourceHead +
      '\napplication_pr=' + applicationPr + '\napplication_head=' + applicationHead + '\nsupersedes_plan_blob_oid=' + supersedes +
      '\nprior_review_blob_oid=' + priorReview + '\nplanning_contract=kodjo.plan-impact.v1\nui_planning_contract=' + UI_PLANNING_CONTRACT +
      '\npublished_plan_commit=' + commit + '\npublished_plan_blob=' + blobId + '\nSTATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW\n\n' + plan;
  }
  // Same header as the planning workflow's bot PLAN_OUTPUT (kodjo-v2-slice-initial-plan.yml).
  return '[KODJO_V2] PLAN_OUTPUT\nslice_id=' + slice + '\nbootstrap_path=' + bootstrapPath + '\nsource_head=' + sourceHead +
    '\nplanning_mode=INITIAL\nplanning_contract=kodjo.plan-impact.v1\nui_planning_contract=' + UI_PLANNING_CONTRACT +
    '\npublished_plan_commit=' + commit + '\npublished_plan_blob=' + blobId + '\nSTATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW\n\n' + plan;
}

// Optional bounded closure of a prior REVISE: the publication names the prior review and pins, in the
// same plan commit, the prior findings and the correction register. Absent fields: a plain publication.
const CLOSURE_FIELDS = ['prior_review_comment_id', 'prior_findings_path', 'prior_findings_blob', 'correction_register_path', 'correction_register_blob'];
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function hasField(body, name) { return new RegExp('^' + name + '=', 'm').test(normalize(body)); }
function taggedFindings(body) {
  const m = normalize(body).match(/<KODJO_PLAN_REVIEW_FINDINGS_JSON>\s*([\s\S]*?)\s*<\/KODJO_PLAN_REVIEW_FINDINGS_JSON>/);
  need(m, 'PLAN_CLOSURE_PRIOR_FINDINGS_BLOCK_MISSING');
  return JSON.parse(m[1]);
}
function closureInputs(comment, repository, get = api(repository), protocolRoot = process.cwd()) {
  const body = normalize(comment && comment.body);
  const present = CLOSURE_FIELDS.filter((name) => hasField(body, name));
  if (present.length === 0) return null;
  need(present.length === CLOSURE_FIELDS.length, 'PLAN_CLOSURE_FIELDS_INCOMPLETE');
  recover(comment, repository, get, protocolRoot);
  const slice = field(body, 'slice_id');
  const commit = field(body, 'plan_commit');
  const dir = '.github/orchestration/v2-slices/' + slice + '/';
  const tree = get('git/trees/' + commit + '?recursive=1');
  need(tree && !tree.truncated, 'PLAN_CLOSURE_TREE_INVALID');
  const pinned = (pathField, blobField, extension) => {
    const file = field(body, pathField);
    const blobId = field(body, blobField);
    need(file.startsWith(dir) && file.endsWith(extension) && !file.includes('..'), 'PLAN_CLOSURE_PATH_INVALID:' + pathField);
    need(SHA40.test(blobId) && tree.tree.some((x) => x.path === file && x.sha === blobId && x.type === 'blob'), 'PLAN_CLOSURE_BINDING_MISMATCH:' + pathField);
    const blob = get('git/blobs/' + blobId);
    need(blob && blob.sha === blobId && blob.encoding === 'base64', 'PLAN_CLOSURE_BLOB_INVALID:' + blobField);
    return Buffer.from(blob.content, 'base64');
  };
  const findingsBytes = pinned('prior_findings_path', 'prior_findings_blob', '.json');
  const registerBytes = pinned('correction_register_path', 'correction_register_blob', '.md');
  const findings = JSON.parse(findingsBytes.toString('utf8'));
  need(Array.isArray(findings.findings) && findings.findings.length >= 1 && findings.findings.every((f) =>
    f && typeof f.target_kind === 'string' && typeof f.target === 'string' && typeof f.blocking === 'boolean'), 'PLAN_CLOSURE_FINDINGS_INVALID');
  need(new Set(findings.findings.map((f) => f.target_kind + '\u0000' + f.target)).size === findings.findings.length, 'PLAN_CLOSURE_TARGETS_NOT_UNIQUE');
  const priorId = field(body, 'prior_review_comment_id');
  need(/^[1-9][0-9]*$/.test(priorId), 'PLAN_CLOSURE_PRIOR_REVIEW_ID_INVALID');
  const prior = get('issues/comments/' + priorId);
  need(prior && prior.issue_url === comment.issue_url, 'PLAN_CLOSURE_PRIOR_ISSUE_MISMATCH');
  const priorBody = normalize(prior.body);
  const marker = priorBody.split('\n')[0].trim();
  if (marker === '[KODJO_V2] PLAN_REVIEW_RECOVERY') {
    // Owner-published recovery of a review whose workflow publication failed: bound by the findings digest.
    need(prior.user && prior.user.login === String(repository).split('/')[0], 'PLAN_CLOSURE_PRIOR_AUTHORITY_INVALID');
    need(field(priorBody, 'derived_verdict') === 'REVISE', 'PLAN_CLOSURE_PRIOR_NOT_REVISE');
    need(field(priorBody, 'findings_sha256') === sha256(findingsBytes), 'PLAN_CLOSURE_FINDINGS_DIGEST_MISMATCH');
  } else if (marker === '[KODJO_V2] PLAN_REVIEW_OUTPUT') {
    need(prior.user && prior.user.login === 'github-actions[bot]', 'PLAN_CLOSURE_PRIOR_AUTHORITY_INVALID');
    need(field(priorBody, 'verdict') === 'REVISE', 'PLAN_CLOSURE_PRIOR_NOT_REVISE');
    need(JSON.stringify(taggedFindings(priorBody)) === JSON.stringify(findings), 'PLAN_CLOSURE_FINDINGS_MISMATCH');
  } else {
    need(false, 'PLAN_CLOSURE_PRIOR_REVIEW_INVALID');
  }
  need(field(priorBody, 'slice_id') === slice, 'PLAN_CLOSURE_PRIOR_SLICE_MISMATCH');
  const priorPlanId = field(priorBody, 'source_plan_comment_id');
  need(/^[1-9][0-9]*$/.test(priorPlanId) && priorPlanId !== String(comment.id), 'PLAN_CLOSURE_PRIOR_PLAN_INVALID');
  const priorPlanComment = get('issues/comments/' + priorPlanId);
  need(priorPlanComment && priorPlanComment.issue_url === comment.issue_url, 'PLAN_CLOSURE_PRIOR_PLAN_ISSUE_MISMATCH');
  let priorPlan;
  if (isPlanPublication(priorPlanComment)) priorPlan = recover(priorPlanComment, repository, get, protocolRoot);
  else {
    need(priorPlanComment.user && priorPlanComment.user.login === 'github-actions[bot]' &&
      normalize(priorPlanComment.body).split('\n')[0].trim() === '[KODJO_V2] PLAN_OUTPUT', 'PLAN_CLOSURE_PRIOR_PLAN_INVALID');
    priorPlan = normalize(priorPlanComment.body);
  }
  return { priorReviewId: priorId, priorPlanId, findings: findingsBytes, register: registerBytes, priorPlan, count: findings.findings.length };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const repository = process.env.GITHUB_REPOSITORY || 'MyUncried/Application-Routine';
    const get = api(repository);
    if (args[0] === '--closure') {
      const [, id, outDir] = args;
      need(/^[0-9]+$/.test(String(id || '')) && outDir, 'PLAN_CLOSURE_USAGE_INVALID');
      const inputs = closureInputs(get('issues/comments/' + id), repository, get);
      if (!inputs) { process.stdout.write('closure=false\n'); return; }
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'prior-findings.json'), inputs.findings);
      fs.writeFileSync(path.join(outDir, 'correction-register.md'), inputs.register);
      fs.writeFileSync(path.join(outDir, 'prior-plan.md'), inputs.priorPlan, 'utf8');
      process.stdout.write('closure=true\nprior_review_comment_id=' + inputs.priorReviewId + '\nprior_plan_comment_id=' + inputs.priorPlanId + '\nprior_finding_count=' + inputs.count + '\n');
      return;
    }
    const [id, output] = args;
    need(/^[0-9]+$/.test(String(id || '')) && output, 'PLAN_PUBLICATION_USAGE_INVALID');
    const comment = get('issues/comments/' + id);
    fs.writeFileSync(output, recover(comment, repository, get), 'utf8');
    process.stdout.write('[KODJO_V2] published plan verified: comment=' + id + '\n');
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}
module.exports = { recover, isPlanPublication, closureInputs, CLOSURE_FIELDS, MARKER };
