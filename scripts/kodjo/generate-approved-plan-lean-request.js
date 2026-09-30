#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { validateQueueRequest } = require('./lib/queue-contract');
const { verify: verifyAuthorizations } = require('./verify-authorizations');
const { DEFAULT_LIMITS } = require('./lib/claude-local');
const { verifyImplementationMission } = require('./lib/implementation-contract');

const SHA40 = /^[0-9a-f]{40}$/;
const SHA64 = /^[0-9a-f]{64}$/;
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
function issueOf(comment) {
  const m = /\/issues\/([0-9]+)$/.exec(String(comment && comment.issue_url || ''));
  return m ? Number(m[1]) : null;
}
function taggedJson(body, tag) {
  const m = new RegExp('<' + tag + '>\\s*([\\s\\S]*?)\\s*</' + tag + '>').exec(String(body || ''));
  if (!m) fail('HANDOFF_TAG_MISSING', tag);
  try { return JSON.parse(m[1]); } catch (_) { fail('HANDOFF_TAG_JSON_INVALID', tag); }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function main() {
  const cwd = process.cwd();
  const repository = process.env.GITHUB_REPOSITORY || 'MyUncried/Application-Routine';
  const handoffId = String(process.env.HANDOFF_COMMENT_ID || process.argv[2] || '');
  const issueNumber = Number(process.env.ISSUE_NUMBER || process.argv[3] || 0);
  const outputFile = process.env.LEAN_REQUEST_OUTPUT || process.argv[4];
  if (!ID.test(handoffId)) fail('HANDOFF_COMMENT_ID_INVALID', handoffId);
  if (!Number.isInteger(issueNumber) || issueNumber < 1) fail('HANDOFF_ISSUE_INVALID');
  if (!outputFile) fail('LEAN_REQUEST_OUTPUT_REQUIRED');

  const handoff = gh('repos/' + repository + '/issues/comments/' + handoffId, cwd);
  if (issueOf(handoff) !== issueNumber) fail('HANDOFF_READY_ISSUE_MISMATCH');
  const body = String(handoff.body || '');
  if (!handoff.user || handoff.user.login !== 'github-actions[bot]') fail('HANDOFF_READY_AUTHOR_MISMATCH');
  if (!/^\[KODJO_V2\] PLAN_HANDOFF_READY\s*$/m.test(body)) fail('HANDOFF_READY_MARKER_INVALID');
  if (!/^STATUT : USER_APPROVAL_REQUIRED\s*$/m.test(body)) fail('HANDOFF_READY_STATUS_INVALID');

  const sliceId = field(body, 'slice_id');
  const planId = field(body, 'source_plan_comment_id');
  const reviewId = field(body, 'source_review_comment_id');
  const planBlob = field(body, 'plan_blob_oid');
  const reviewBlob = field(body, 'review_blob_oid');
  const approvedAt = field(body, 'approved_at_commit');
  const bootstrapRel = field(body, 'bootstrap_path');
  const bootstrapSha = field(body, 'bootstrap_sha256');
  const missionRel = field(body, 'prompt_file');
  const planningApplicationHead = field(body, 'planning_application_head');

  if (!sliceId || !ID.test(planId) || !ID.test(reviewId) || !SHA40.test(planBlob) ||
      !SHA40.test(reviewBlob) || !SHA40.test(approvedAt) || !SHA64.test(bootstrapSha) ||
      !SHA40.test(planningApplicationHead)) {
    fail('HANDOFF_READY_IDENTITY_INVALID');
  }
  if (bootstrapRel !== '.github/orchestration/v2-slices/' + sliceId + '/slice-bootstrap.json') {
    fail('HANDOFF_BOOTSTRAP_PATH_MISMATCH');
  }
  if (missionRel !== '.github/orchestration/v2-slices/' + sliceId + '/implementation-mission.md') {
    fail('HANDOFF_PROMPT_PATH_MISMATCH');
  }

  const owner = repository.split('/')[0];
  const reactions = gh('repos/' + repository + '/issues/comments/' + handoffId + '/reactions', cwd);
  if (!Array.isArray(reactions) || !reactions.some((x) => x && x.content === '+1' && x.user && x.user.login === owner)) {
    fail('HANDOFF_USER_APPROVAL_MISSING', handoffId);
  }

  const currentHead = git(['rev-parse', 'HEAD'], cwd);
  if (!SHA40.test(currentHead)) fail('HANDOFF_CURRENT_HEAD_INVALID');
  const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', approvedAt, currentHead], { cwd, windowsHide: true });
  if (ancestry.status !== 0) fail('HANDOFF_APPROVAL_NOT_ANCESTOR');

  const planRel = '.github/orchestration/v2-slices/' + sliceId + '/technical-plan.md';
  const reviewRel = '.github/orchestration/v2-slices/' + sliceId + '/independent-review.md';
  const currentPlanBlob = git(['rev-parse', 'HEAD:' + planRel], cwd);
  if (currentPlanBlob !== planBlob) fail('PLAN_SUPERSEDED');
  const currentReviewBlob = git(['rev-parse', 'HEAD:' + reviewRel], cwd);
  if (currentReviewBlob !== reviewBlob) fail('HANDOFF_REVIEW_SUPERSEDED');

  const approvedPlanBlob = git(['rev-parse', approvedAt + ':' + planRel], cwd);
  const approvedReviewBlob = git(['rev-parse', approvedAt + ':' + reviewRel], cwd);
  if (approvedPlanBlob !== planBlob || approvedReviewBlob !== reviewBlob) fail('HANDOFF_APPROVED_ARTIFACT_MISMATCH');
  try { git(['cat-file', '-e', approvedAt + ':' + missionRel], cwd); }
  catch (_) { fail('HANDOFF_PROMPT_MISSING_AT_SOURCE'); }

  const postApprovalDrift = git(['diff', '--name-only', approvedAt, currentHead, '--', 'app', 'src'], cwd)
    .split(/\r?\n/).filter(Boolean);
  if (postApprovalDrift.length) fail('HANDOFF_POST_APPROVAL_APPLICATION_DRIFT', postApprovalDrift.join(', '));

  const bootstrapAbs = path.resolve(cwd, bootstrapRel);
  if (!fs.existsSync(bootstrapAbs)) fail('HANDOFF_BOOTSTRAP_MISSING');
  const bootstrap = JSON.parse(fs.readFileSync(bootstrapAbs, 'utf8').replace(/^\uFEFF/, ''));
  if (bootstrap.slice_id !== sliceId || Number(bootstrap.issue_number) !== issueNumber ||
      bootstrap.repository !== repository || bootstrap.slice_bootstrap_sha256 !== bootstrapSha ||
      bootstrap.planning_application_head !== planningApplicationHead) {
    fail('HANDOFF_BOOTSTRAP_BINDING_MISMATCH');
  }

  const planBody = git(['cat-file', 'blob', planBlob], cwd);
  const declaredApplicationPr = field(planBody, 'application_pr');
  const declaredApplicationHead = field(planBody, 'application_head');
  let deliveryTarget = null;
  if (declaredApplicationPr || declaredApplicationHead) {
    if (!ID.test(declaredApplicationPr) || !SHA40.test(declaredApplicationHead)) {
      fail('HANDOFF_APPLICATION_TARGET_IDENTITY_INVALID');
    }
    if (declaredApplicationHead !== planningApplicationHead) {
      fail('HANDOFF_APPLICATION_TARGET_HEAD_MISMATCH');
    }
    const applicationPr = gh('repos/' + repository + '/pulls/' + declaredApplicationPr, cwd);
    if (!applicationPr || applicationPr.state !== 'open' || !applicationPr.base || applicationPr.base.ref !== 'main' ||
        !applicationPr.head || String(applicationPr.head.sha || '').toLowerCase() !== planningApplicationHead ||
        !applicationPr.head.ref) {
      fail('HANDOFF_APPLICATION_TARGET_DRIFT');
    }
    deliveryTarget = {
      kind: 'EXISTING_PR',
      application_pr: Number(declaredApplicationPr),
      branch: String(applicationPr.head.ref),
      application_head: planningApplicationHead,
    };
  }
  const missionBody = git(['show', approvedAt + ':' + missionRel], cwd);
  let implementationContract;
  try {
    implementationContract = verifyImplementationMission(missionBody, planBody, planBlob);
  } catch (error) {
    fail('HANDOFF_IMPLEMENTATION_CONTRACT_REFUSED', error.message);
  }
  const impact = taggedJson(planBody, 'KODJO_PLAN_IMPACT_JSON');
  if (String(impact.scan_revision) !== planningApplicationHead) fail('PLAN_APPLICATION_HEAD_MISMATCH');
  if (!Array.isArray(impact.scope_allow) || impact.scope_allow.length < 1) fail('HANDOFF_PLAN_SCOPE_MISSING');

  const requestId = crypto.randomUUID();
  const request = {
    schema_version: 'kodjo.protocol.v2.lean-request.0.6.13',
    slice_id: sliceId,
    issue_number: issueNumber,
    source_head: approvedAt,
    baseline_head: String(bootstrap.baseline_head),
    slice_bootstrap_file: bootstrapRel,
    slice_bootstrap_sha256: bootstrapSha,
    mode: 'INITIAL',
    operation_kind: 'IMPLEMENT',
    ...(deliveryTarget ? { delivery_target: deliveryTarget } : {}),
    session_id: null,
    prompt_file: missionRel,
    scope_allow: [...impact.scope_allow],
    checks: ['jest', 'typescript', 'lint'],
    limits: { ...DEFAULT_LIMITS },
    request_id: requestId,
    created_at: new Date().toISOString(),
    authorized_plan: {
      plan_path: planRel,
      plan_blob_oid: planBlob,
      approved_at_commit: approvedAt,
      evidence_kind: 'ARTIFACT_HASH',
    },
    independent_review: {
      review_path: reviewRel,
      review_blob_oid: reviewBlob,
      reviewed_plan_blob_oid: planBlob,
      verdict: 'APPROVED',
      evidence_kind: 'ARTIFACT_HASH',
    },
    user_gate: {
      gate_ref: 'issue_comment:' + handoffId,
      gated_reference: planBlob,
      decision: 'APPROVED',
      user_login: owner,
      evidence_kind: 'ORGANISATIONAL',
    },
  };

  const violations = validateQueueRequest(request);
  if (violations.length) {
    fail('HANDOFF_LEAN_REQUEST_CONTRACT_REFUSED',
      violations.map((v) => v.diagnostic + ':' + v.property).join(', '));
  }

  writeJson(path.resolve(outputFile), request);
  const rel = path.relative(cwd, path.resolve(outputFile)).replace(/\\/g, '/');
  // When output is under the repository, run the real authorization verifier.
  // For a RUNNER_TEMP validation output, use a temporary repository-relative copy.
  let verifyRel = rel;
  let tempRel = null;
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    tempRel = '.github/orchestration/queue/v2/.handoff-validation-' + requestId + '.json';
    writeJson(path.resolve(cwd, tempRel), request);
    verifyRel = tempRel;
  }
  try {
    verifyAuthorizations(verifyRel, { cwd });
  } finally {
    if (tempRel) fs.rmSync(path.resolve(cwd, tempRel), { force: true });
  }

  process.stdout.write('[KODJO_V2] lean request generated and admitted — slice=' + sliceId +
    ' request=' + requestId + ' scope=' + request.scope_allow.length + '\n');
  process.stdout.write('request_id=' + requestId + '\n');
  process.stdout.write('approved_at_commit=' + approvedAt + '\n');
  process.stdout.write('plan_blob_oid=' + planBlob + '\n');
  process.stdout.write('scope_count=' + request.scope_allow.length + '\n');
  process.stdout.write('implementation_contract=' + implementationContract.schema + '\n');
}

try { main(); }
catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
