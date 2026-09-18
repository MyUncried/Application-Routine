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

function git(cwd, args) {
  return exec('git', args, { cwd });
}

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

function main() {
  if (!process.env.GH_TOKEN) throw new Error('GH_TOKEN_REQUIRED');

  const planComment = ghComment(PLAN_COMMENT_ID);
  const reviewComment = ghComment(REVIEW_COMMENT_ID);
  const userGateComment = ghComment(USER_GATE_COMMENT_ID);
  const planBody = String(planComment.body || '');
  const reviewBody = String(reviewComment.body || '');
  const userGateBody = String(userGateComment.body || '');

  assert.match(planBody, /^\\[KODJO_V2\\] PLAN_OUTPUT/m);
  assert.match(planBody, /^slice_id=V2-CAT-01$/m);
  assert.match(planBody, /^planning_mode=INITIAL$/m);
  assert.match(planBody, /^STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW$/m);
  assert.match(reviewBody, /^\\[KODJO_V2\\] PLAN_REVIEW_OUTPUT/m);
  assert.match(reviewBody, /^source_plan_comment_id=5720329801$/m);
  assert.match(reviewBody, /^verdict=APPROVE$/m);
  assert.match(reviewBody, /^STATUT : PLAN_REVIEW_APPROVED$/m);
  assert.match(userGateBody, /^\\[KODJO_V2\\] USER_IMPLEMENTATION_APPROVED/m);
  assert.match(userGateBody, /^source_plan_comment_id=5720329801$/m);
  assert.match(userGateBody, /^source_review_comment_id=5720519466$/m);

  const impact = taggedJson(planBody, 'KODJO_PLAN_IMPACT_JSON');
  assert.equal(impact.schema, 'kodjo.plan-impact.v1');
  assert.equal(impact.scan_revision, '63a3c26ed492f7c0925cfb57419f3dc2dcc5e476');
  assert.ok(Array.isArray(impact.scope_allow) && impact.scope_allow.length > 0);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-v2-handoff-e2e-'));
  const repo = path.join(tmp, 'repo');
  try {
    exec('git', ['clone', '--no-hardlinks', ROOT, repo], { cwd: tmp });
    git(repo, ['config', 'user.email', 'kodjo-e2e@test.local']);
    git(repo, ['config', 'user.name', 'KODJO E2E']);

    const bootstrapPath = path.join(repo, '.github', 'orchestration', 'v2-slices', SLICE, 'slice-bootstrap.json');
    const registryPath = path.join(repo, '.github', 'orchestration', 'v2-activation-registry.json');
    const planPath = '.github/orchestration/v2-slices/' + SLICE + '/technical-plan.md';
    const reviewPath = '.github/orchestration/v2-slices/' + SLICE + '/independent-review.md';
    const missionPath = '.github/orchestration/v2-slices/' + SLICE + '/implementation-mission.md';

    const bootstrap = JSON.parse(fs.readFileSync(bootstrapPath, 'utf8').replace(/^\\uFEFF/, ''));
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8').replace(/^\\uFEFF/, ''));
    assert.equal(bootstrap.baseline_head, impact.scan_revision);
    bootstrap.planning_application_head = impact.scan_revision;

    const identity = require(path.join(repo, 'scripts', 'kodjo', 'lib', 'slice-identity.js'));
    const unsigned = JSON.parse(JSON.stringify(bootstrap));
    delete unsigned.slice_bootstrap_sha256;
    bootstrap.slice_bootstrap_sha256 = identity.sha256(identity.canonical(unsigned));
    writeJson(bootstrapPath, bootstrap);

    const activation = registry.activations.find((x) => x && x.slice_id === SLICE);
    assert.ok(activation && activation.status === 'ACTIVE');
    activation.slice_bootstrap_sha256 = bootstrap.slice_bootstrap_sha256;
    activation.planning_application_head = impact.scan_revision;
    writeJson(registryPath, registry);

    fs.writeFileSync(path.join(repo, planPath), planBody.replace(/\\r\\n/g, '\n') + '\n', 'utf8');
    fs.writeFileSync(path.join(repo, reviewPath), reviewBody.replace(/\\r\\n/g, '\n') + '\n', 'utf8');

    const preCommitPlanBlob = git(repo, ['hash-object', planPath]);
    const mission = [
      '# Mission d’implémentation — ' + SLICE,
      '',
      'Exécuter exclusivement le plan approuvé matérialisé dans `technical-plan.md`.',
      '',
      '- plan_blob_oid : `' + preCommitPlanBlob + '`',
      '- scope : la propriété `scope_allow` de la Lean Request est opposable ; aucun élargissement n’est autorisé.',
      '- contrôles : exécuter uniquement les checks déclarés dans la Lean Request.',
      '- ambiguïté : arrêter avec `CLARIFICATION_REQUIRED` ; ne jamais inventer.',
      '',
      'Cette mission ne crée aucune décision fonctionnelle ou technique nouvelle.',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(repo, missionPath), mission, 'utf8');

    git(repo, ['add',
      planPath, reviewPath, missionPath,
      '.github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json',
      '.github/orchestration/v2-activation-registry.json',
    ]);
    git(repo, ['commit', '-m', 'test(kodjo): materialize bounded handoff fixture']);
    const approvedAt = git(repo, ['rev-parse', 'HEAD']);
    const sourceHead = approvedAt;
    const planBlob = git(repo, ['rev-parse', 'HEAD:' + planPath]);
    const reviewBlob = git(repo, ['rev-parse', 'HEAD:' + reviewPath]);
    assert.equal(planBlob, preCommitPlanBlob);
    exec('git', ['merge-base', '--is-ancestor', approvedAt, sourceHead], { cwd: repo });
    assert.equal(sourceHead, approvedAt);
    git(repo, ['cat-file', '-e', sourceHead + ':' + missionPath]);

    function request(requestId, createdAt) {
      return {
        schema_version: 'kodjo.protocol.v2.lean-request.0.6.13',
        slice_id: SLICE,
        issue_number: ISSUE,
        source_head: sourceHead,
        baseline_head: bootstrap.baseline_head,
        slice_bootstrap_file: '.github/orchestration/v2-slices/' + SLICE + '/slice-bootstrap.json',
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
        request_id: requestId,
        created_at: createdAt,
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
          gate_ref: 'issue_comment:999999999',
          gated_reference: planBlob,
          decision: 'APPROVED',
          user_login: 'MyUncried',
          evidence_kind: 'ORGANISATIONAL',
        },
      };
    }

    const initialRequest = request('550e8400-e29b-41d4-a716-446655440101', '2026-09-18T06:00:00.000Z');
    const revisionRequest = request('550e8400-e29b-41d4-a716-446655440102', '2026-09-18T06:00:01.000Z');

    const normalize = (q) => {
      const copy = JSON.parse(JSON.stringify(q));
      delete copy.request_id;
      delete copy.created_at;
      return copy;
    };
    assert.deepEqual(normalize(initialRequest), normalize(revisionRequest),
      'INITIAL et REVIEW/RÉVISION doivent converger vers le même contrat exécutable');

    const queueDir = path.join(repo, '.github', 'orchestration', 'queue', 'v2');
    fs.mkdirSync(queueDir, { recursive: true });
    const queueRel = '.github/orchestration/queue/v2/V2-CAT-01-implement-e2e.json';
    writeJson(path.join(repo, queueRel), initialRequest);

    const contractModule = require(path.join(repo, 'scripts', 'kodjo', 'lib', 'queue-contract.js'));
    const violations = contractModule.validateQueueRequest(initialRequest);
    assert.deepEqual(violations, [], 'la Lean Request cible doit respecter lean-request.0.6.13');

    const authorizationModule = require(path.join(repo, 'scripts', 'kodjo', 'verify-authorizations.js'));
    const github = {
      comment: (_repository, id) => ({
        id,
        issue_url: 'https://api.github.com/repos/' + REPOSITORY + '/issues/' + ISSUE,
        body: '[KODJO_V2] IMPLEMENTATION_GATE\nslice_id=' + SLICE + '\nplan_blob_oid=' + planBlob + '\n',
        user: { login: 'github-actions[bot]' },
      }),
      reactions: () => [{ content: '+1', user: { login: 'MyUncried' } }],
    };
    const proof = authorizationModule.verify(queueRel, { cwd: repo, github });
    assert.equal(proof.plan_blob_oid, planBlob);
    assert.equal(proof.review_blob_oid, reviewBlob);
    assert.equal(proof.evidence_kinds.authorized_plan, 'ARTIFACT_HASH');
    assert.equal(proof.evidence_kinds.user_gate, 'ORGANISATIONAL');

    process.stdout.write('[E2E-PLAN-HANDOFF] PASS\n');
    process.stdout.write('plan_comment_id=' + PLAN_COMMENT_ID + '\n');
    process.stdout.write('review_comment_id=' + REVIEW_COMMENT_ID + '\n');
    process.stdout.write('source_head=' + sourceHead + '\n');
    process.stdout.write('plan_blob_oid=' + planBlob + '\n');
    process.stdout.write('scope_count=' + impact.scope_allow.length + '\n');
    process.stdout.write('convergence=INITIAL==REVIEW_EXCEPT_REQUEST_ID_CREATED_AT\n');
    process.stdout.write('STOP=BEFORE_RUN_QUEUED_REQUEST\n');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  process.stderr.write('[E2E-PLAN-HANDOFF] FAIL: ' + (error && error.stack ? error.stack : String(error)) + '\n');
  process.exit(1);
}
