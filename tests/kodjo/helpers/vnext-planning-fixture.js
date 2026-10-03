'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const V = require('../../../scripts/kodjo/lib/vnext-contract');
const SourceManifest = require('../../../scripts/kodjo/lib/source-manifest');
const PlanningEnvelope = require('../../../scripts/kodjo/lib/planning-envelope');
const RequirementRegistry = require('../../../scripts/kodjo/lib/requirement-registry');
const Impact = require('../../../scripts/kodjo/lib/impact-graph');
const Plan = require('../../../scripts/kodjo/lib/plan-contract');
const Review = require('../../../scripts/kodjo/lib/review-contract');
const Revision = require('../../../scripts/kodjo/lib/revision-contract');
const Approval = require('../../../scripts/kodjo/lib/approval-handoff-contract');
const Runtime = require('../../../scripts/kodjo/lib/vnext-runtime');
const Adapter = require('../../../scripts/kodjo/lib/vnext-legacy-queue-adapter');
const Convergence = require('../../../scripts/kodjo/lib/audit-convergence-contract');

const H40A = 'a'.repeat(40);
const H40C = 'c'.repeat(40);
const H64A = 'a'.repeat(64);
const H64B = 'b'.repeat(64);
const H64D = 'd'.repeat(64);

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function fixtureRepo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-e2e-'));
  git(cwd, 'init');
  git(cwd, 'config', 'user.name', 'KODJO Test');
  git(cwd, 'config', 'user.email', 'kodjo@example.test');
  write(path.join(cwd, 'src', 'core.js'), "module.exports = { value: 1 };\n");
  write(path.join(cwd, 'tests', 'core.test.js'), "const c = require('../src/core'); if (!c) throw new Error('x');\n");
  write(path.join(cwd, 'src', 'keep.js'), "module.exports = 'keep';\n");
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-m', 'fixture');
  return { cwd, revision: git(cwd, 'rev-parse', 'HEAD') };
}

function sourceManifest() {
  return SourceManifest.build({
    slice_id: 'V2-VNEXT-09',
    product_head: H40A,
    sources: [{
      source_kind: 'MARKDOWN',
      authority: 'FUNCTIONAL',
      locator: 'docs/functional.md',
      revision: H40A,
      fingerprint: H64A,
      units: [{
        locator: '§1',
        fingerprint: H64B,
        disposition: 'REQUIREMENT_SOURCE',
      }],
    }],
  });
}

function makeEnvelope(manifest, repo, mode, base) {
  return PlanningEnvelope.build({
    slice_id: 'V2-VNEXT-09',
    planning_mode: mode,
    baseline_head: H40A,
    product_head: H40A,
    application_head: repo.revision,
    issue_id: 'github_issue:MyUncried/Application-Routine#999',
    source_manifest: manifest,
    base_plan_hash: mode === 'REVISION' ? base.plan_hash : null,
    base_review_hash: mode === 'REVISION' ? base.review_hash : null,
    causal_findings: mode === 'REVISION' ? base.finding_ids : [],
    created_from: mode === 'REVISION'
      ? { kind: 'PLAN_REVIEW_REVISE', refs: ['issue_comment:200'] }
      : { kind: 'INITIAL_REQUEST', refs: ['issue_comment:100'] },
  });
}

function byPath(manifest, p) {
  const row = manifest.candidates.find((candidate) => candidate.path === p);
  assert.ok(row, 'candidate absent: ' + p);
  return row;
}

function buildPlanningArtifacts({ repo, manifest, envelope, revisedRationale = null }) {
  const source = manifest.sources[0];
  const registry = RequirementRegistry.build({
    planning_envelope_hash: envelope.contract_hash,
    source_manifest: manifest,
    requirements: [{
      source_id: source.source_id,
      unit_id: source.units[0].unit_id,
      kind: 'FUNCTIONAL',
      statement: 'Modifier le comportement du module.',
      priority: 'MUST',
      status: 'ACTIVE',
      rationale: 'Exigence E2E.',
      related_unit_ids: [],
      conflict_unit_ids: [],
    }],
  });

  const candidates = Impact.buildCandidateManifest({ cwd: repo.cwd, revision: repo.revision });
  const core = byPath(candidates, 'src/core.js');
  const coreTest = byPath(candidates, 'tests/core.test.js');
  const keep = byPath(candidates, 'src/keep.js');
  const reqId = registry.requirements[0].requirement_id;

  const directScan = Impact.scanOneLevelDirectImporters({
    cwd: repo.cwd,
    candidateManifest: candidates,
    modifyCandidateIds: [core.candidate_id],
  });

  const impactGraph = Impact.buildImpactGraph({
    requirementRegistry: registry,
    candidateManifest: candidates,
    directImportScan: directScan,
    classifications: [
      {
        requirement_id: reqId,
        candidate_id: core.candidate_id,
        change_kind: 'MODIFY',
        impact_reason: 'Le module porte le comportement demandé.',
        dependency_evidence: ['source fonctionnelle'],
        tests_affected_candidate_ids: [coreTest.candidate_id],
        preservation_candidate_ids: [keep.candidate_id],
      },
      {
        requirement_id: reqId,
        candidate_id: coreTest.candidate_id,
        change_kind: 'MODIFY',
        impact_reason: 'Le test direct doit être adapté.',
        dependency_evidence: ['test direct'],
        tests_affected_candidate_ids: [],
        preservation_candidate_ids: [],
      },
    ],
  });

  const sourceImpact = impactGraph.impacts.find((row) => row.path === 'src/core.js');
  const testImpact = impactGraph.impacts.find((row) => row.path === 'tests/core.test.js');
  const covered = [sourceImpact.impact_id, testImpact.impact_id].sort();

  const plan = Plan.buildPlanContract({
    requirementRegistry: registry,
    impactGraph,
    candidateManifest: candidates,
    requirementPlans: [{
      requirement_id: reqId,
      implementation_intents: [
        { impact_id: sourceImpact.impact_id, intent: 'Adapter le module sans élargissement.' },
        { impact_id: testImpact.impact_id, intent: 'Adapter le test direct.' },
      ],
      test_obligations: [{
        target_impact_id: testImpact.impact_id,
        covered_change_impact_ids: covered,
        expected: 'Le test direct passe.',
        justification: 'Test fonctionnel direct.',
      }],
      proof_obligations: [{
        proof_type: 'FUNCTIONAL_TEST',
        target_test_impact_id: testImpact.impact_id,
        covered_change_impact_ids: covered,
        expected: 'Le test fonctionnel passe.',
        justification: 'Preuve automatisée.',
      }],
      implementation_constraints: [],
      residual_risks: [],
      rationale: revisedRationale || 'Plan E2E initial.',
    }],
  });

  const reviewContext = Review.buildReviewContext({
    planningEnvelope: envelope,
    requirementRegistry: registry,
    impactGraph,
    candidateManifest: candidates,
    planContract: plan,
    directImportScan: directScan,
    uiAtomicityContract: null,
  });

  return {
    cwd: repo.cwd,
    planningEnvelope: envelope,
    requirementRegistry: registry,
    candidateManifest: candidates,
    directImportScan: directScan,
    impactGraph,
    planContract: plan,
    uiAtomicityContract: null,
    reviewContext,
    reqId,
    core,
    coreTest,
    keep,
  };
}

function currentState(repo) {
  return {
    execution_context: { mode: 'LOCAL', writer_id: 'CLAUDE:fixture-writer' },
    native_primitive_decisions: [],
    product_head: H40A,
    application_head: repo.revision,
    protocol_head: H40C,
  };
}

function approve(artifacts, reviewReport, state) {
  const approvalTarget = Approval.buildApprovalTarget({
    ...artifacts,
    reviewReport,
    currentState: state,
  });
  const approvalRecord = Approval.buildApprovalRecord({
    approvalTarget,
    evidence: {
      decision: 'APPROVED',
      actor_id: 'MyUncried',
      transport: 'GITHUB_REACTION',
      evidence_ref: 'issue_comment:12345#reaction:67890',
      approved_target_hash: approvalTarget.contract_hash,
      observed_at: '2026-09-30T00:30:00.000Z',
    },
  });
  const executionRequest = Approval.buildExecutionRequest({
    approvalTarget,
    approvalRecord,
    ...artifacts,
    reviewReport,
    currentState: state,
  });
  return { approvalTarget, approvalRecord, executionRequest };
}

function transport() {
  return {
    slice_bootstrap_file: '.github/orchestration/vnext-runtime/V2-VNEXT-09/slice-bootstrap.json',
    slice_bootstrap_sha256: H64D,
    plan_path: '.github/orchestration/vnext-runtime/V2-VNEXT-09/technical-plan.md',
    review_path: '.github/orchestration/vnext-runtime/V2-VNEXT-09/independent-review.md',
    prompt_file: '.github/orchestration/vnext-runtime/V2-VNEXT-09/implementation-mission.md',
    gate_ref: 'issue_comment:12345',
    request_id: '123e4567-e89b-42d3-a456-426614174000',
    created_at: '2026-09-30T00:31:00.000Z',
  };
}


module.exports = { fixtureRepo, sourceManifest, makeEnvelope, buildPlanningArtifacts, currentState, approve, transport };
