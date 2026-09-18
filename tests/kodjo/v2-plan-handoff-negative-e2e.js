#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const REPOSITORY = 'MyUncried/Application-Routine';
const SLICE = 'V2-CAT-01';
const ISSUE = 150;
const PLAN_COMMENT_ID = '5720329801';
const REVIEW_COMMENT_ID = '5720519466';
const USER_GATE_COMMENT_ID = '5720551793';

function exec(cmd, args, options = {}) {
  return execFileSync(cmd, args, {
    cwd: options.cwd || ROOT,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, ...(options.env || {}) },
  }).trim();
}
function git(cwd, args) { return exec('git', args, { cwd }); }
function ghComment(id) {
  return JSON.parse(exec('gh', ['api', 'repos/' + REPOSITORY + '/issues/comments/' + id]));
}
function taggedJson(markdown, tag) {
  const re = new RegExp('<' + tag + '>\\s*([\\s\\S]*?)\\s*</' + tag + '>');
  const m = re.exec(markdown);
  if (!m) throw new Error('MISSING_' + tag);
  return JSON.parse(m[1]);
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function clone(v) { return JSON.parse(JSON.stringify(v)); }

function field(body, name) {
  const m = new RegExp('^' + name + '=([^\\r\\n]+)\\s*$', 'm').exec(body);
  return m ? m[1].trim() : '';
}
function handoffInputPreflight(planBody, reviewBody, gateBody) {
  if (!/^\[KODJO_V2\] PLAN_OUTPUT/m.test(planBody)) throw new Error('HANDOFF_PLAN_MARKER_INVALID');
  if (!/^STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW$/m.test(planBody)) throw new Error('HANDOFF_PLAN_NOT_REVIEWABLE');
  if (!/^\[KODJO_V2\] PLAN_REVIEW_OUTPUT/m.test(reviewBody)) throw new Error('HANDOFF_REVIEW_MARKER_INVALID');
  if (field(reviewBody, 'source_plan_comment_id') !== PLAN_COMMENT_ID) throw new Error('HANDOFF_REVIEW_PLAN_LINK_MISMATCH');
  if (field(reviewBody, 'verdict') !== 'APPROVE' || !/^STATUT : PLAN_REVIEW_APPROVED$/m.test(reviewBody)) {
    throw new Error('HANDOFF_REVIEW_NOT_APPROVED');
  }
  if (!/^\[KODJO_V2\] USER_IMPLEMENTATION_APPROVED/m.test(gateBody)) throw new Error('HANDOFF_USER_GATE_MARKER_INVALID');
  if (field(gateBody, 'source_plan_comment_id') !== PLAN_COMMENT_ID) throw new Error('HANDOFF_USER_GATE_PLAN_LINK_MISMATCH');
  if (field(gateBody, 'source_review_comment_id') !== REVIEW_COMMENT_ID) throw new Error('HANDOFF_USER_GATE_REVIEW_LINK_MISMATCH');
}
function targetPreflight(repo, q) {
  if (q.source_head !== q.authorized_plan.approved_at_commit) throw new Error('HANDOFF_SOURCE_HEAD_MUST_EQUAL_APPROVED_AT_COMMIT');
  try { git(repo, ['cat-file', '-e', q.source_head + ':' + q.prompt_file]); }
  catch (_) { throw new Error('HANDOFF_PROMPT_MISSING_AT_SOURCE'); }
  const currentPlan = git(repo, ['rev-parse', 'HEAD:' + q.authorized_plan.plan_path]);
  if (currentPlan !== q.authorized_plan.plan_blob_oid) throw new Error('PLAN_SUPERSEDED');
}

function expectFail(label, expected, fn, results) {
  try {
    fn();
    results.push({ label, status: 'FAIL', expected, actual: 'NO_FAILURE' });
  } catch (e) {
    const actual = String(e && e.message ? e.message : e);
    if (!actual.includes(expected)) {
      results.push({ label, status: 'FAIL', expected, actual });
    } else {
      results.push({ label, status: 'PASS', expected, actual });
    }
  }
}

function main() {
  if (!process.env.GH_TOKEN) throw new Error('GH_TOKEN_REQUIRED');

  const planBody = String(ghComment(PLAN_COMMENT_ID).body || '');
  const reviewBody = String(ghComment(REVIEW_COMMENT_ID).body || '');
  const gateBody = String(ghComment(USER_GATE_COMMENT_ID).body || '');
  handoffInputPreflight(planBody, reviewBody, gateBody);

  const impact = taggedJson(planBody, 'KODJO_PLAN_IMPACT_JSON');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-v2-handoff-negative-'));
  const repo = path.join(tmp, 'repo');
  const results = [];

  try {
    exec('git', ['clone', '--no-hardlinks', ROOT, repo], { cwd: tmp });
    git(repo, ['config', 'user.email', 'kodjo-negative@test.local']);
    git(repo, ['config', 'user.name', 'KODJO Negative E2E']);

    const bootstrapRel = '.github/orchestration/v2-slices/' + SLICE + '/slice-bootstrap.json';
    const registryRel = '.github/orchestration/v2-activation-registry.json';
    const planPath = '.github/orchestration/v2-slices/' + SLICE + '/technical-plan.md';
    const reviewPath = '.github/orchestration/v2-slices/' + SLICE + '/independent-review.md';
    const missionPath = '.github/orchestration/v2-slices/' + SLICE + '/implementation-mission.md';

    const bootstrapPath = path.join(repo, bootstrapRel);
    const registryPath = path.join(repo, registryRel);
    const bootstrap = JSON.parse(fs.readFileSync(bootstrapPath, 'utf8').replace(/^\\uFEFF/, ''));
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8').replace(/^\\uFEFF/, ''));
    bootstrap.planning_application_head = impact.scan_revision;

    const identity = require(path.join(repo, 'scripts', 'kodjo', 'lib', 'slice-identity.js'));
    function refreshIdentity(b, reg) {
      const unsigned = clone(b);
      delete unsigned.slice_bootstrap_sha256;
      b.slice_bootstrap_sha256 = identity.sha256(identity.canonical(unsigned));
      const activation = reg.activations.find((x) => x && x.slice_id === SLICE);
      activation.slice_bootstrap_sha256 = b.slice_bootstrap_sha256;
      activation.planning_application_head = b.planning_application_head;
    }
    refreshIdentity(bootstrap, registry);
    writeJson(bootstrapPath, bootstrap);
    writeJson(registryPath, registry);

    fs.writeFileSync(path.join(repo, planPath), planBody.replace(/\\r\\n/g, '\n') + '\n', 'utf8');
    const canonicalReview = '# Revue indépendante matérialisée — ' + SLICE +
      '\n\nVerdict: APPROVED\nPlan reviewed: `technical-plan.md`\n\n' +
      reviewBody.replace(/\\r\\n/g, '\n') + '\n';
    fs.writeFileSync(path.join(repo, reviewPath), canonicalReview, 'utf8');
    const prePlanBlob = git(repo, ['hash-object', planPath]);
    fs.writeFileSync(path.join(repo, missionPath),
      '# Mission d’implémentation — ' + SLICE +
      '\n\nPlan: `technical-plan.md`\nplan_blob_oid: `' + prePlanBlob + '`\n' +
      'Scope Lean Request opposable. CLARIFICATION_REQUIRED si ambigu.\n', 'utf8');

    git(repo, ['add', planPath, reviewPath, missionPath, bootstrapRel, registryRel]);
    git(repo, ['commit', '-m', 'test(kodjo): negative handoff fixture']);
    const approvedAt = git(repo, ['rev-parse', 'HEAD']);
    const planBlob = git(repo, ['rev-parse', 'HEAD:' + planPath]);
    const reviewBlob = git(repo, ['rev-parse', 'HEAD:' + reviewPath]);

    const base = {
      schema_version: 'kodjo.protocol.v2.lean-request.0.6.13',
      slice_id: SLICE,
      issue_number: ISSUE,
      source_head: approvedAt,
      baseline_head: bootstrap.baseline_head,
      slice_bootstrap_file: bootstrapRel,
      slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256,
      mode: 'INITIAL',
      operation_kind: 'IMPLEMENT',
      session_id: null,
      prompt_file: missionPath,
      scope_allow: [...impact.scope_allow],
      checks: ['jest', 'typescript', 'lint'],
      limits: {
        max_ai_calls: 1,
        max_duration_seconds: 3600,
        max_prompt_bytes: 32768,
        max_total_prompt_bytes: 32768,
        max_rollovers: 0,
      },
      request_id: '550e8400-e29b-41d4-a716-446655440201',
      created_at: '2026-09-18T06:30:00.000Z',
      authorized_plan: {
        plan_path: planPath,
        plan_blob_oid: planBlob,
        approved_at_commit: approvedAt,
        evidence_kind: 'ARTIFACT_HASH',
      },
      independent_review: {
        review_path: reviewPath,
        review_blob_oid: reviewBlob,
        reviewed_plan_blob_oid: planBlob,
        verdict: 'APPROVED',
        evidence_kind: 'ARTIFACT_HASH',
      },
      user_gate: {
        gate_ref: 'issue_comment:999999998',
        gated_reference: planBlob,
        decision: 'APPROVED',
        user_login: 'MyUncried',
        evidence_kind: 'ORGANISATIONAL',
      },
    };

    const queueDir = path.join(repo, '.github', 'orchestration', 'queue', 'v2');
    fs.mkdirSync(queueDir, { recursive: true });
    const queueRel = '.github/orchestration/queue/v2/V2-CAT-01-negative-e2e.json';

    const auth = require(path.join(repo, 'scripts', 'kodjo', 'verify-authorizations.js'));
    const github = {
      comment: (_repository, id) => ({
        id,
        issue_url: 'https://api.github.com/repos/' + REPOSITORY + '/issues/' + ISSUE,
        body: 'plan_blob_oid=' + planBlob,
        user: { login: 'github-actions[bot]' },
      }),
      reactions: () => [{ content: '+1', user: { login: 'MyUncried' } }],
    };
    function verifyQueue(q, gh = github) {
      writeJson(path.join(repo, queueRel), q);
      return auth.verify(queueRel, { cwd: repo, github: gh });
    }

    // N1 — review liee au mauvais PLAN_OUTPUT.
    const badReviewLink = reviewBody.replace('source_plan_comment_id=' + PLAN_COMMENT_ID, 'source_plan_comment_id=1');
    expectFail('N1 review→plan chain', 'HANDOFF_REVIEW_PLAN_LINK_MISMATCH',
      () => handoffInputPreflight(planBody, badReviewLink, gateBody), results);

    // N2 — review non approuvee.
    const badReviewVerdict = reviewBody.replace('verdict=APPROVE', 'verdict=REVISE')
      .replace('STATUT : PLAN_REVIEW_APPROVED', 'STATUT : PLAN_REVISION_REQUIRED');
    expectFail('N2 review not approved', 'HANDOFF_REVIEW_NOT_APPROVED',
      () => handoffInputPreflight(planBody, badReviewVerdict, gateBody), results);

    // N3 — gate utilisateur lie a une autre review.
    const badGateLink = gateBody.replace('source_review_comment_id=' + REVIEW_COMMENT_ID, 'source_review_comment_id=1');
    expectFail('N3 user gate→review chain', 'HANDOFF_USER_GATE_REVIEW_LINK_MISMATCH',
      () => handoffInputPreflight(planBody, reviewBody, badGateLink), results);

    // N4 — scope plus petit que le scope approuve.
    const badScope = clone(base);
    badScope.scope_allow = badScope.scope_allow.slice(1);
    expectFail('N4 scope contradiction', 'PLAN_SCOPE_CONTRADICTION',
      () => verifyQueue(badScope), results);

    // N5 — planning_application_head ne correspond plus au scan_revision.
    const originalBootstrap = clone(bootstrap);
    const originalRegistry = clone(registry);
    const badBootstrap = clone(bootstrap);
    const badRegistry = clone(registry);
    badBootstrap.planning_application_head = 'd'.repeat(40);
    refreshIdentity(badBootstrap, badRegistry);
    writeJson(bootstrapPath, badBootstrap);
    writeJson(registryPath, badRegistry);
    const badPlanningHead = clone(base);
    badPlanningHead.slice_bootstrap_sha256 = badBootstrap.slice_bootstrap_sha256;
    expectFail('N5 planning application head mismatch', 'PLAN_APPLICATION_HEAD_MISMATCH',
      () => verifyQueue(badPlanningHead), results);
    writeJson(bootstrapPath, originalBootstrap);
    writeJson(registryPath, originalRegistry);

    // N6 — source_head anterieur au commit d'approbation.
    const badSource = clone(base);
    badSource.source_head = bootstrap.baseline_head;
    expectFail('N6 source head before approval', 'PLAN_COMMIT_NOT_ANCESTOR',
      () => verifyQueue(badSource), results);
    expectFail('N6b stricter handoff source rule', 'HANDOFF_SOURCE_HEAD_MUST_EQUAL_APPROVED_AT_COMMIT',
      () => targetPreflight(repo, badSource), results);

    // N7 — mission d'implementation absente au source_head.
    const missingPrompt = clone(base);
    missingPrompt.prompt_file = '.github/orchestration/v2-slices/' + SLICE + '/missing-mission.md';
    expectFail('N7 prompt missing at source', 'HANDOFF_PROMPT_MISSING_AT_SOURCE',
      () => targetPreflight(repo, missingPrompt), results);

    // N8 — gate pointe vers un autre plan.
    const badGateRef = clone(base);
    badGateRef.user_gate.gated_reference = 'c'.repeat(40);
    expectFail('N8 gate wrong plan', 'GATE_REFERENCE_MISMATCH',
      () => verifyQueue(badGateRef), results);

    // N9 — review declare avoir revu un autre plan.
    const badReviewHash = clone(base);
    badReviewHash.independent_review.reviewed_plan_blob_oid = 'b'.repeat(40);
    expectFail('N9 review wrong plan hash', 'REVIEW_PLAN_HASH_MISMATCH',
      () => verifyQueue(badReviewHash), results);

    // N10 — nouvelle materialisation : ancien plan devient supersede.
    fs.appendFileSync(path.join(repo, planPath), '\n<!-- superseding materialization -->\n', 'utf8');
    git(repo, ['add', planPath]);
    git(repo, ['commit', '-m', 'test(kodjo): supersede materialized plan']);
    expectFail('N10 superseded plan', 'PLAN_SUPERSEDED',
      () => targetPreflight(repo, base), results);

    const failed = results.filter((r) => r.status !== 'PASS');
    for (const r of results) {
      process.stdout.write('[NEGATIVE] ' + r.status + ' ' + r.label + ' expected=' + r.expected + '\n');
      if (r.status !== 'PASS') process.stdout.write('  actual=' + r.actual + '\n');
    }
    process.stdout.write('negative_count=' + results.length + '\n');
    process.stdout.write('negative_pass=' + (results.length - failed.length) + '\n');
    process.stdout.write('STOP=BEFORE_RUN_QUEUED_REQUEST\n');
    if (failed.length) process.exitCode = 1;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

try { main(); }
catch (error) {
  process.stderr.write('[E2E-PLAN-HANDOFF-NEGATIVE] FAIL: ' +
    (error && error.stack ? error.stack : String(error)) + '\n');
  process.exit(1);
}
