'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const F = require('./helpers/vnext-planning-fixture');
const V = require('../../scripts/kodjo/lib/vnext-contract');
const Review = require('../../scripts/kodjo/lib/review-contract');
const Approval = require('../../scripts/kodjo/lib/approval-handoff-contract');
const Runtime = require('../../scripts/kodjo/lib/vnext-runtime');
const Register = require('../../scripts/kodjo/lib/vnext-audit-register');
const Ui = require('../../scripts/kodjo/lib/ui-atomicity-contract');
const Security = require('../../scripts/kodjo/lib/vnext-remote-write-security');

function setup() {
  const repo = F.fixtureRepo();
  const manifest = F.sourceManifest();
  const envelope = F.makeEnvelope(manifest, repo, 'INITIAL', null);
  const artifacts = F.buildPlanningArtifacts({ repo, manifest, envelope });
  const state = F.currentState(repo);
  const report = Review.buildReviewReport({ reviewContext: artifacts.reviewContext, semanticReview: { findings: [] } });
  const approved = F.approve(artifacts, report, state);
  const register = Register.buildRegister({ candidateHead: state.protocol_head, lot: envelope.slice_id,
    phase: 'HANDOFF', authorizedActor: 'MyUncried', revisionCount: 0, revisionLimit: 1, observations: [] });
  return { repo, artifacts, state, report, approved, register };
}

test('architecture: approval refuses a resealed context whose target catalog was emptied', () => {
  const f = setup();
  try {
    const changed = JSON.parse(JSON.stringify(f.artifacts.reviewContext));
    for (const key of Object.keys(changed.target_catalog)) changed.target_catalog[key] = [];
    delete changed.contract_hash;
    const reviewContext = V.sealContract(changed);
    assert.throws(() => Approval.buildApprovalTarget({ ...f.artifacts, reviewContext,
      reviewReport: f.report, currentState: f.state }), /REVIEW_CONTEXT_REBUILD_MISMATCH/);
  } finally { fs.rmSync(f.repo.cwd, { recursive: true, force: true }); }
});

test('architecture: runtime binds observed Git tree and cumulative proof gate', () => {
  const f = setup();
  const args = { ...f.artifacts, cumulativeRegister: f.register, reviewReport: f.report,
    ...f.approved, currentState: f.state };
  try {
    assert.equal(Runtime.buildRuntimeSnapshot(args).terminal_state, 'HANDOFF_READY');
    const obs = { rule_id: 'TEST', target_id: 'core', target_hash: 'a'.repeat(64), normative_hash: 'a'.repeat(64),
      criterion_hash: 'a'.repeat(64), classification: 'PROOF_UNAVAILABLE', severity: 'MAJOR',
      required_for_gate: true, evidence_refs: ['probe:missing'], note: 'Required proof unavailable.' };
    const cumulativeRegister = Register.buildRegister({ candidateHead: f.state.protocol_head,
      lot: f.artifacts.planningEnvelope.slice_id, phase: 'HANDOFF', authorizedActor: 'MyUncried',
      revisionCount: 0, revisionLimit: 1, observations: [obs] });
    assert.throws(() => Runtime.buildRuntimeSnapshot({ ...args, cumulativeRegister }), /REGISTER_GATE_NOT_READY/);
    const reserved = Register.buildRegister({ previous: cumulativeRegister, candidateHead: f.state.protocol_head,
      lot: f.artifacts.planningEnvelope.slice_id, phase: 'HANDOFF', authorizedActor: 'MyUncried',
      revisionCount: 0, revisionLimit: 1, observations: [], decisions: [{ subject_id: cumulativeRegister.entries[0].subject_id,
        action: 'ACCEPT_RESERVE', actor_id: 'MyUncried', evidence_ref: 'comment:owner', note: 'Retain proof as unavailable.' }] });
    assert.equal(reserved.gate, 'WAIT_FOR_PROOF');
    assert.throws(() => Runtime.buildRuntimeSnapshot({ ...args, cumulativeRegister: reserved }), /REGISTER_GATE_NOT_READY/);
    const fake = JSON.parse(JSON.stringify(f.artifacts.candidateManifest));
    fake.git_tree_sha256 = 'f'.repeat(64); delete fake.contract_hash;
    assert.throws(() => Runtime.buildRuntimeSnapshot({ ...args, candidateManifest: V.sealContract(fake) }), /CANDIDATE|TREE/);
  } finally { fs.rmSync(f.repo.cwd, { recursive: true, force: true }); }
});

test('architecture: source UI requirement applies outside legacy roots and ignores test candidates', () => {
  const requirements = { registry_status: 'READY', requirements: [{ requirement_id: 'REQ', kind: 'UI', status: 'ACTIVE' }] };
  const candidates = { candidates: [{ candidate_id: 'STYLE', candidate_kind: 'CODE' }, { candidate_id: 'TEST', candidate_kind: 'TEST' }] };
  const plan = { plan_items: [{ requirement_id: 'REQ', change_items: [
    { candidate_id: 'STYLE', path: 'themes/custom.css', impact_id: 'STYLE' },
    { candidate_id: 'TEST', path: 'tests/custom.test.js', impact_id: 'TEST' },
  ] }] };
  assert.deepEqual(Ui.uiChangeItems(requirements, plan, candidates).map(row => row.impact_id), ['STYLE']);
});

test('architecture: REST destination preserves owner names containing s', () => {
  const caps = Security.scanFileCapabilities('scripts/kodjo/write.sh', 'gh api --method PUT "repos/some-owner/x/contents/f"');
  assert.ok(caps.some(row => row.capability === 'REST_REPOSITORY_WRITE' && row.destination === 'repos/some-owner/x/contents/f'));
});

test('architecture: actual Markdown CRLF conversion is rejected without canonical LF bytes', () => {
  const f = setup();
  try {
    const Plan = require('../../scripts/kodjo/lib/plan-contract');
    const body = Plan.renderMarkdown(f.artifacts.planContract);
    assert.equal(Plan.verifyMarkdownProjection(body, f.artifacts.planContract), true);
    assert.throws(() => Plan.verifyMarkdownProjection(body.replace(/\n/g, '\r\n'), f.artifacts.planContract), /PROJECTION/);
    const lf = execFileSync('git', ['hash-object', '--stdin'], { input: Buffer.from(body), encoding: 'utf8' }).trim();
    const crlf = execFileSync('git', ['hash-object', '--stdin'], { input: Buffer.from(body.replace(/\n/g, '\r\n')), encoding: 'utf8' }).trim();
    assert.notEqual(lf, crlf);
  } finally { fs.rmSync(f.repo.cwd, { recursive: true, force: true }); }
});
