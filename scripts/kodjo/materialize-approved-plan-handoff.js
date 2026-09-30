#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { canonical, sha256 } = require('./lib/slice-identity');
const { renderImplementationMission } = require('./lib/implementation-contract');
const { verifyTransition } = require('./verify-plan-review-transition');

const SHA40 = /^[0-9a-f]{40}$/;
const ID = /^[1-9][0-9]*$/;

function fail(code, detail) {
  throw new Error(code + (detail ? ': ' + detail : ''));
}
function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (r.error || r.status !== 0) fail('COMMAND_FAILED', cmd + ' ' + args.join(' ') + ': ' + String(r.stderr || r.error || '').trim());
  return String(r.stdout || '').trim();
}
function git(args, cwd) { return run('git', args, cwd); }
function gh(route, cwd) {
  const raw = run('gh', ['api', '-H', 'Accept: application/vnd.github+json', route], cwd);
  try { return JSON.parse(raw); } catch (_) { fail('GITHUB_JSON_INVALID', route); }
}
function field(body, name) {
  const m = new RegExp('^' + name + '=([^\\r\\n]+)\\s*$', 'm').exec(String(body || ''));
  return m ? m[1].trim() : '';
}
function taggedJson(body, tag) {
  const m = new RegExp('<' + tag + '>\\s*([\\s\\S]*?)\\s*</' + tag + '>').exec(String(body || ''));
  if (!m) fail('HANDOFF_TAG_MISSING', tag);
  try { return JSON.parse(m[1]); } catch (_) { fail('HANDOFF_TAG_JSON_INVALID', tag); }
}
function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value.replace(/\\r\\n/g, '\n').replace(/\r/g, '\n').replace(/\n?$/, '\n'), 'utf8');
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function issueOf(comment) {
  const m = /\/issues\/([0-9]+)$/.exec(String(comment && comment.issue_url || ''));
  return m ? Number(m[1]) : null;
}
function gitBlobAt(cwd, rev, file) {
  return git(['rev-parse', rev + ':' + file], cwd);
}
function currentBlobIfPresent(cwd, file) {
  const r = spawnSync('git', ['rev-parse', 'HEAD:' + file], { cwd, encoding: 'utf8', windowsHide: true });
  return !r.error && r.status === 0 ? String(r.stdout).trim() : null;
}

function verifyHandoffFreshness({ cwd, planBody, reviewBody, impact, bootstrap, bootstrapRel, repository, readPullRequest }) {
  const sourceHead = field(planBody, 'source_head');
  const reviewHead = field(reviewBody, 'protocol_execution_head');
  const executionHead = git(['rev-parse', 'HEAD'], cwd);
  if (!SHA40.test(sourceHead) || field(reviewBody, 'source_head') !== sourceHead || !SHA40.test(reviewHead)) {
    fail('HANDOFF_PROTOCOL_IDENTITY_MISMATCH');
  }
  // Reuse the canonical closed protocol transition: product inputs and policy
  // provenance remain checked even when a protocol-only fix follows approval.
  verifyTransition({ cwd, sourceHead: reviewHead, executionHead, bootstrapPath: bootstrapRel });
  verifyTransition({ cwd, sourceHead, executionHead, bootstrapPath: bootstrapRel });

  const initial = field(planBody, 'planning_mode') === 'INITIAL';
  if (initial) {
    if (field(reviewBody, 'planning_mode') !== 'INITIAL' || impact.scan_revision !== sourceHead ||
        field(planBody, 'application_pr') || field(reviewBody, 'application_pr')) {
      fail('HANDOFF_INITIAL_IDENTITY_MISMATCH');
    }
    const drift = git(['diff', '--name-only', impact.scan_revision, 'HEAD', '--', 'app', 'src'], cwd)
      .split(/\r?\n/).filter(Boolean);
    if (drift.length) fail('HANDOFF_APPLICATION_DRIFT', drift.join(', '));
    return;
  }
  const applicationPr = field(planBody, 'application_pr');
  const applicationHead = field(planBody, 'application_head');
  if (!ID.test(applicationPr) || !SHA40.test(applicationHead) || applicationHead !== impact.scan_revision ||
      field(reviewBody, 'application_pr') !== applicationPr || field(reviewBody, 'application_head') !== applicationHead ||
      field(reviewBody, 'planning_mode') === 'INITIAL') {
    fail('HANDOFF_APPLICATION_IDENTITY_MISMATCH');
  }
  const application = readPullRequest(applicationPr);
  if (!application || application.number !== Number(applicationPr) || application.state !== 'open' || application.merged !== false ||
      application.base?.ref !== bootstrap.target_branch || application.base?.repo?.full_name !== repository ||
      application.head?.repo?.full_name !== repository) {
    fail('HANDOFF_APPLICATION_PR_MISMATCH');
  }
  if (application.head.sha !== applicationHead) {
    fail('HANDOFF_APPLICATION_DRIFT', 'PR ' + applicationPr + ' expected=' + applicationHead + ' observed=' + application.head.sha);
  }
}

function main() {
  const cwd = process.cwd();
  const reviewId = String(process.env.REVIEW_COMMENT_ID || process.argv[2] || '');
  const issueNumber = Number(process.env.ISSUE_NUMBER || process.argv[3] || 0);
  const outputFile = process.env.HANDOFF_METADATA_FILE || process.argv[4];
  if (!ID.test(reviewId)) fail('HANDOFF_REVIEW_ID_INVALID', reviewId);
  if (!Number.isInteger(issueNumber) || issueNumber < 1) fail('HANDOFF_ISSUE_INVALID');
  if (!outputFile) fail('HANDOFF_METADATA_FILE_REQUIRED');

  const repository = process.env.GITHUB_REPOSITORY || 'MyUncried/Application-Routine';
  const review = gh('repos/' + repository + '/issues/comments/' + reviewId, cwd);
  if (issueOf(review) !== issueNumber) fail('HANDOFF_REVIEW_ISSUE_MISMATCH');
  const reviewBody = String(review.body || '');
  if (!review.user || review.user.login !== 'github-actions[bot]') fail('HANDOFF_REVIEW_AUTHOR_MISMATCH');
  if (!/^\[KODJO_V2\] PLAN_REVIEW_OUTPUT\s*$/m.test(reviewBody)) fail('HANDOFF_REVIEW_MARKER_INVALID');
  if (field(reviewBody, 'verdict') !== 'APPROVE') fail('HANDOFF_REVIEW_NOT_APPROVED');
  if (!/^STATUT : PLAN_REVIEW_APPROVED\s*$/m.test(reviewBody)) fail('HANDOFF_REVIEW_NOT_APPROVED');

  const sliceId = field(reviewBody, 'slice_id');
  const bootstrapRel = field(reviewBody, 'bootstrap_path');
  const planId = field(reviewBody, 'source_plan_comment_id');
  if (!sliceId || !bootstrapRel || !ID.test(planId)) fail('HANDOFF_REVIEW_IDENTITY_MISSING');
  if (bootstrapRel !== '.github/orchestration/v2-slices/' + sliceId + '/slice-bootstrap.json') {
    fail('HANDOFF_BOOTSTRAP_PATH_MISMATCH', bootstrapRel);
  }

  const plan = gh('repos/' + repository + '/issues/comments/' + planId, cwd);
  if (issueOf(plan) !== issueNumber) fail('HANDOFF_PLAN_ISSUE_MISMATCH');
  const recoveredPublication = ['5913845392', '5916079168'].includes(String(plan.id));
  const planBody = recoveredPublication
    ? require('./recover-published-pre1-plan').recover(plan, repository)
    : String(plan.body || '');
  if ((!plan.user || plan.user.login !== 'github-actions[bot]') && !recoveredPublication) fail('HANDOFF_PLAN_AUTHOR_MISMATCH');
  if (!/^\[KODJO_V2\] PLAN_OUTPUT\s*$/m.test(planBody)) fail('HANDOFF_PLAN_MARKER_INVALID');
  if (!/^STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW\s*$/m.test(planBody)) fail('HANDOFF_PLAN_NOT_REVIEWABLE');
  if (field(planBody, 'slice_id') !== sliceId) fail('HANDOFF_PLAN_SLICE_MISMATCH');
  if (field(planBody, 'bootstrap_path') !== bootstrapRel) fail('HANDOFF_PLAN_BOOTSTRAP_MISMATCH');

  const impact = taggedJson(planBody, 'KODJO_PLAN_IMPACT_JSON');
  if (impact.schema !== 'kodjo.plan-impact.v1' || !SHA40.test(String(impact.scan_revision || ''))) {
    fail('HANDOFF_PLAN_IMPACT_INVALID');
  }
  if (!Array.isArray(impact.scope_allow) || impact.scope_allow.length < 1) fail('HANDOFF_PLAN_SCOPE_MISSING');

  const bootstrapAbs = path.resolve(cwd, bootstrapRel);
  if (!bootstrapAbs.startsWith(path.resolve(cwd) + path.sep) || !fs.existsSync(bootstrapAbs)) fail('HANDOFF_BOOTSTRAP_MISSING');
  const bootstrap = JSON.parse(fs.readFileSync(bootstrapAbs, 'utf8').replace(/^\uFEFF/, ''));
  if (bootstrap.slice_id !== sliceId || Number(bootstrap.issue_number) !== issueNumber || bootstrap.repository !== repository) {
    fail('HANDOFF_BOOTSTRAP_IDENTITY_MISMATCH');
  }
  const registryRel = String(bootstrap.activation_registry || '');
  const registryAbs = path.resolve(cwd, registryRel);
  const registry = JSON.parse(fs.readFileSync(registryAbs, 'utf8').replace(/^\uFEFF/, ''));
  const matches = (registry.activations || []).filter((x) => x && x.slice_id === sliceId);
  if (matches.length !== 1 || matches[0].status !== 'ACTIVE') fail('HANDOFF_SLICE_NOT_ACTIVE');
  const currentPlanningHead = String(bootstrap.planning_application_head || '');
  if (!SHA40.test(currentPlanningHead)) fail('HANDOFF_PLANNING_APPLICATION_HEAD_MISSING');
  if (String(matches[0].planning_application_head || '') !== currentPlanningHead) fail('HANDOFF_PLANNING_APPLICATION_HEAD_REGISTRY_MISMATCH');

  verifyHandoffFreshness({ cwd, planBody, reviewBody, impact, bootstrap, bootstrapRel, repository,
    readPullRequest: (number) => gh('repos/' + repository + '/pulls/' + number, cwd) });

  const sliceDirRel = '.github/orchestration/v2-slices/' + sliceId;
  const planRel = sliceDirRel + '/technical-plan.md';
  const reviewRel = sliceDirRel + '/independent-review.md';
  const missionRel = sliceDirRel + '/implementation-mission.md';
  const priorPlanBlob = currentBlobIfPresent(cwd, planRel);

  writeText(path.resolve(cwd, planRel), planBody);
  const planBlob = git(['hash-object', planRel], cwd);

  const canonicalReview = [
    '# Revue indépendante matérialisée — ' + sliceId,
    '',
    'Verdict: APPROVED',
    'Plan reviewed: `technical-plan.md`',
    '',
    reviewBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n?$/, '\n'),
  ].join('\n');
  writeText(path.resolve(cwd, reviewRel), canonicalReview);

  const renderedMission = renderImplementationMission(sliceId, planBody, planBlob);
  writeText(path.resolve(cwd, missionRel), renderedMission.mission);

  bootstrap.planning_application_head = String(impact.scan_revision);
  const unsigned = JSON.parse(JSON.stringify(bootstrap));
  delete unsigned.slice_bootstrap_sha256;
  bootstrap.slice_bootstrap_sha256 = sha256(canonical(unsigned));
  writeJson(bootstrapAbs, bootstrap);

  matches[0].slice_bootstrap_sha256 = bootstrap.slice_bootstrap_sha256;
  matches[0].planning_application_head = bootstrap.planning_application_head;
  writeJson(registryAbs, registry);

  const metadata = {
    schema_version: 'kodjo.protocol.v2.plan-handoff-materialization.v1',
    slice_id: sliceId,
    issue_number: issueNumber,
    source_plan_comment_id: planId,
    source_review_comment_id: reviewId,
    planning_mode: field(planBody, 'planning_mode') || 'REVISION',
    planning_application_head: bootstrap.planning_application_head,
    bootstrap_path: bootstrapRel,
    bootstrap_sha256: bootstrap.slice_bootstrap_sha256,
    plan_path: planRel,
    review_path: reviewRel,
    prompt_file: missionRel,
    implementation_contract: renderedMission.contract.schema,
    ui_matrix_sha256: renderedMission.contract.ui_matrix_sha256,
    ui_criterion_count: renderedMission.contract.ui_criterion_count,
    plan_blob_oid_precommit: planBlob,
    supersedes_plan_blob_oid: priorPlanBlob && priorPlanBlob !== planBlob ? priorPlanBlob : null,
    scope_count: impact.scope_allow.length,
  };
  writeJson(path.resolve(outputFile), metadata);
  process.stdout.write('[KODJO_V2] plan handoff materialization prepared — slice=' + sliceId +
    ' plan=' + planBlob.slice(0, 12) + ' scope=' + impact.scope_allow.length + '\n');
}

if (require.main === module) {
try { main(); }
catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
}

module.exports = { verifyHandoffFreshness };
