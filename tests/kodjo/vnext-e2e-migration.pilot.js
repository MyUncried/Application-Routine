'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const V = require('../../scripts/kodjo/lib/vnext-contract');
const SourceManifest = require('../../scripts/kodjo/lib/source-manifest');
const PlanningEnvelope = require('../../scripts/kodjo/lib/planning-envelope');
const RequirementRegistry = require('../../scripts/kodjo/lib/requirement-registry');
const Impact = require('../../scripts/kodjo/lib/impact-graph');
const Plan = require('../../scripts/kodjo/lib/plan-contract');
const Review = require('../../scripts/kodjo/lib/review-contract');
const Revision = require('../../scripts/kodjo/lib/revision-contract');
const Approval = require('../../scripts/kodjo/lib/approval-handoff-contract');
const Runtime = require('../../scripts/kodjo/lib/vnext-runtime');
const Adapter = require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter');
const Convergence = require('../../scripts/kodjo/lib/audit-convergence-contract');
const AuditRegister = require('../../scripts/kodjo/lib/vnext-audit-register');

const H40A = 'a'.repeat(40);
const H40C = 'c'.repeat(40);
const H64A = 'a'.repeat(64);
const H64B = 'b'.repeat(64);
const H64D = 'd'.repeat(64);

test('projection blob OIDs agree with independent Git bytes for LF CRLF Unicode and empty input', () => {
  for (const content of ['', 'épreuve\n', 'épreuve\r\n']) {
    const oid = execFileSync('git', ['hash-object', '--stdin'], { input: Buffer.from(content, 'utf8'), encoding: 'utf8' }).trim();
    assert.equal(Adapter.gitBlobOid(content), oid);
  }
});

test('projection emits real lines and refuses Windows traversal and absolute paths', () => {
  const request = { slice_id: 'V2-TEST', contract_hash: H64A, execution_fingerprint: H64B,
    execution_context: { mode: 'LOCAL', writer_id: 'CLAUDE:fixture-writer' }, native_primitive_decisions: [],
    application_head: H40A, checks: ['jest'], write_scope: [{ path: 'src/x.js' }] };
  const mission = Adapter.renderCompatibilityMission(request);
  assert.ok(mission.split('\n').length > 8);
  assert.match(mission, /^operation_kind=IMPLEMENT$/m);
  for (const file of ['..\\..\\x.md', 'C:/x.md', '/x.md', 'a/../x.md', './x.md']) {
    assert.throws(() => Adapter.renderCompatibilityReview(request, { contract_hash: H64A }, file), /PLAN_PATH_INVALID/);
  }
});

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
    cumulativeRegister: AuditRegister.buildRegister({ candidateHead: H40C, lot: envelope.slice_id, phase: 'HANDOFF', observations: [], authorizedActor: 'MyUncried', revisionCount: envelope.planning_mode === 'REVISION' ? 1 : 0, revisionLimit: 1 }),
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
      evidence_ref: 'issue_comment:12345#reaction:+1:MyUncried',
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

test('VNext-09 E2E INITIAL atteint HANDOFF_READY et se projette sans élargissement', () => {
  const repo = fixtureRepo();
  const manifest = sourceManifest();
  const envelope = makeEnvelope(manifest, repo, 'INITIAL', null);
  const artifacts = buildPlanningArtifacts({ repo, manifest, envelope });
  const reviewReport = Review.buildReviewReport({
    reviewContext: artifacts.reviewContext,
    semanticReview: { findings: [] },
  });
  assert.equal(reviewReport.verdict, 'APPROVE');

  const state = currentState(repo);
  const approved = approve(artifacts, reviewReport, state);
  const snapshot = Runtime.buildRuntimeSnapshot({
    ...artifacts,
    reviewReport,
    revisionArtifacts: null,
    ...approved,
    currentState: state,
  });

  assert.equal(snapshot.terminal_state, 'HANDOFF_READY');
  assert.equal(snapshot.planning_mode, 'INITIAL');
  assert.deepEqual(snapshot.stages.map((row) => row.stage), Runtime.STAGES);
  assert.equal(snapshot.stages.find((row) => row.stage === 'REVISION').status, 'NOT_APPLICABLE');
  assert.equal(Runtime.validateRuntimeSnapshot(snapshot), true);

  const projection = Adapter.buildLegacyQueueProjection({
    executionRequest: approved.executionRequest,
    approvalTarget: approved.approvalTarget,
    approvalRecord: approved.approvalRecord,
    ...artifacts,
    reviewReport,
    currentState: state,
    transport: transport(),
  });
  assert.equal(projection.canonical_authority, 'VNEXT_EXECUTION_REQUEST');
  assert.equal(projection.projection_mode, 'LEGACY_TRANSPORT_ONLY');
  assert.deepEqual(
    projection.legacy_queue_request.scope_allow,
    approved.executionRequest.write_scope.map((row) => row.path),
  );
  assert.deepEqual(projection.legacy_queue_request.checks, approved.executionRequest.checks);
  assert.equal(projection.legacy_queue_request.source_head, approved.executionRequest.protocol_head);
  assert.equal(Adapter.validateLegacyQueueProjection(projection, approved.executionRequest), true);
  for (const file of Object.values(projection.compatibility_files)) {
    write(path.join(repo.cwd, file.path), file.content);
    assert.equal(git(repo.cwd, 'hash-object', '--no-filters', '--', file.path), file.blob_oid);
  }
  const falseScan = V.sealContract({ ...Object.fromEntries(Object.entries(artifacts.directImportScan).filter(([key]) => key !== 'contract_hash')), importers: [], importer_count: 0 });
  assert.throws(() => Runtime.buildRuntimeSnapshot({ ...artifacts, directImportScan: falseScan,
    reviewReport, revisionArtifacts: null, ...approved, currentState: state }), /DIRECT_IMPORT_SCAN_REBUILD_MISMATCH/);
});

test('VNext-09 runtime refuse un snapshot re-signé avec statut d’étape falsifié', () => {
  const repo = fixtureRepo();
  const manifest = sourceManifest();
  const envelope = makeEnvelope(manifest, repo, 'INITIAL', null);
  const artifacts = buildPlanningArtifacts({ repo, manifest, envelope });
  const reviewReport = Review.buildReviewReport({
    reviewContext: artifacts.reviewContext,
    semanticReview: { findings: [] },
  });
  const state = currentState(repo);
  const approved = approve(artifacts, reviewReport, state);
  const snapshot = Runtime.buildRuntimeSnapshot({
    ...artifacts,
    reviewReport,
    revisionArtifacts: null,
    ...approved,
    currentState: state,
  });

  const tampered = structuredClone(snapshot);
  tampered.stages[0].status = 'READY';
  delete tampered.contract_hash;
  tampered.contract_hash = V.canonicalHash(tampered);
  assert.throws(
    () => Runtime.validateRuntimeSnapshot(tampered),
    /VNEXT_RUNTIME_STAGE_STATUS_INVALID/,
  );
});

test('VNext-09 projection refuse un scope legacy élargi même si le JSON est re-signé', () => {
  const repo = fixtureRepo();
  const manifest = sourceManifest();
  const envelope = makeEnvelope(manifest, repo, 'INITIAL', null);
  const artifacts = buildPlanningArtifacts({ repo, manifest, envelope });
  const reviewReport = Review.buildReviewReport({
    reviewContext: artifacts.reviewContext,
    semanticReview: { findings: [] },
  });
  const state = currentState(repo);
  const approved = approve(artifacts, reviewReport, state);
  const projection = Adapter.buildLegacyQueueProjection({
    executionRequest: approved.executionRequest,
    approvalTarget: approved.approvalTarget,
    approvalRecord: approved.approvalRecord,
    ...artifacts,
    reviewReport,
    currentState: state,
    transport: transport(),
  });

  const tampered = structuredClone(projection);
  tampered.legacy_queue_request.scope_allow.push('src/keep.js');
  delete tampered.contract_hash;
  tampered.contract_hash = V.canonicalHash(tampered);
  assert.throws(
    () => Adapter.validateLegacyQueueProjection(tampered, approved.executionRequest),
    /VNEXT_QUEUE_SCOPE_WIDENING/,
  );
});

test('VNext-09 projection refuse un fichier de compatibilité re-signé mais altéré', () => {
  const repo = fixtureRepo();
  const manifest = sourceManifest();
  const envelope = makeEnvelope(manifest, repo, 'INITIAL', null);
  const artifacts = buildPlanningArtifacts({ repo, manifest, envelope });
  const reviewReport = Review.buildReviewReport({
    reviewContext: artifacts.reviewContext,
    semanticReview: { findings: [] },
  });
  const state = currentState(repo);
  const approved = approve(artifacts, reviewReport, state);
  const projection = Adapter.buildLegacyQueueProjection({
    executionRequest: approved.executionRequest,
    approvalTarget: approved.approvalTarget,
    approvalRecord: approved.approvalRecord,
    ...artifacts,
    reviewReport,
    currentState: state,
    transport: transport(),
  });

  const tampered = structuredClone(projection);
  tampered.compatibility_files.mission.content += '\nINJECTED';
  delete tampered.contract_hash;
  tampered.contract_hash = V.canonicalHash(tampered);
  assert.throws(
    () => Adapter.validateLegacyQueueProjection(tampered, approved.executionRequest),
    /VNEXT_QUEUE_COMPATIBILITY_CONTENT_HASH_MISMATCH/,
  );
});

test('VNext-09 projection refuse un changement de checks', () => {
  const repo = fixtureRepo();
  const manifest = sourceManifest();
  const envelope = makeEnvelope(manifest, repo, 'INITIAL', null);
  const artifacts = buildPlanningArtifacts({ repo, manifest, envelope });
  const reviewReport = Review.buildReviewReport({
    reviewContext: artifacts.reviewContext,
    semanticReview: { findings: [] },
  });
  const state = currentState(repo);
  const approved = approve(artifacts, reviewReport, state);
  const projection = Adapter.buildLegacyQueueProjection({
    executionRequest: approved.executionRequest,
    approvalTarget: approved.approvalTarget,
    approvalRecord: approved.approvalRecord,
    ...artifacts,
    reviewReport,
    currentState: state,
    transport: transport(),
  });

  const tampered = structuredClone(projection);
  tampered.legacy_queue_request.checks = ['jest'];
  delete tampered.contract_hash;
  tampered.contract_hash = V.canonicalHash(tampered);
  assert.throws(
    () => Adapter.validateLegacyQueueProjection(tampered, approved.executionRequest),
    /VNEXT_QUEUE_CHECK_DRIFT/,
  );
});

test('VNext-09 projection legacy exige le transport GITHUB_REACTION compatible avec la queue active', () => {
  const repo = fixtureRepo();
  const manifest = sourceManifest();
  const envelope = makeEnvelope(manifest, repo, 'INITIAL', null);
  const artifacts = buildPlanningArtifacts({ repo, manifest, envelope });
  const reviewReport = Review.buildReviewReport({
    reviewContext: artifacts.reviewContext,
    semanticReview: { findings: [] },
  });
  const state = currentState(repo);
  const target = Approval.buildApprovalTarget({ ...artifacts, reviewReport, currentState: state });
  const record = Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: {
      decision: 'APPROVED',
      actor_id: 'MyUncried',
      transport: 'CHATGPT_ACTION',
      evidence_ref: 'chatgpt_action:approval-1',
      approved_target_hash: target.contract_hash,
      observed_at: '2026-09-30T00:30:00.000Z',
    },
  });
  const request = Approval.buildExecutionRequest({
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts,
    reviewReport,
    currentState: state,
  });
  assert.throws(() => Adapter.buildLegacyQueueProjection({
    executionRequest: request,
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts,
    reviewReport,
    currentState: state,
    transport: transport(),
  }), /VNEXT_QUEUE_LEGACY_TRANSPORT_REQUIRES_GITHUB_REACTION/);
});

test('VNext-09 E2E REVISION conserve la causalité et atteint HANDOFF_READY après résolution', () => {
  const repo = fixtureRepo();
  const manifest = sourceManifest();

  const initialEnvelope = makeEnvelope(manifest, repo, 'INITIAL', null);
  const base = buildPlanningArtifacts({ repo, manifest, envelope: initialEnvelope });
  const planItem = base.planContract.plan_items[0];
  const baseReview = Review.buildReviewReport({
    reviewContext: base.reviewContext,
    semanticReview: {
      findings: [{
        category: 'PLAN_GAP',
        target_type: 'PLAN_ITEM',
        target_id: planItem.plan_item_id,
        finding: 'La rationale doit être précisée.',
        evidence: ['plan item inspected'],
        required_correction: 'Préciser uniquement la rationale.',
        dependency_target_ids: [],
      }],
    },
  });
  assert.equal(baseReview.verdict, 'REVISE');

  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: baseReview,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  const patch = Revision.buildRevisionPatch({
    allowedChangeSet: allowed,
    corrections: [{
      target_type: 'PLAN_ITEM',
      target_id: planItem.plan_item_id,
      finding_ids: [baseReview.findings[0].finding_id],
      correction: 'Préciser la rationale sans toucher au scope.',
    }],
  });

  const revisionEnvelope = makeEnvelope(manifest, repo, 'REVISION', {
    plan_hash: base.planContract.contract_hash,
    review_hash: baseReview.contract_hash,
    finding_ids: [baseReview.findings[0].finding_id],
  });
  const next = buildPlanningArtifacts({
    repo,
    manifest,
    envelope: revisionEnvelope,
    revisedRationale: 'Plan E2E révisé : seule la rationale du plan est précisée.',
  });
  next.cumulativeRegister = AuditRegister.buildRegister({ previous: base.cumulativeRegister,
    candidateHead: H40C, lot: next.planningEnvelope.slice_id, phase: 'HANDOFF',
    observations: [], authorizedActor: 'MyUncried', revisionCount: 1, revisionLimit: 1 });
  const nextReview = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: { findings: [] },
  });

  const outcome = Revision.verifyRevisionOutcome({
    allowedChangeSet: allowed,
    revisionPatch: patch,
    baseArtifacts: base,
    nextArtifacts: next,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReview,
  });
  assert.equal(outcome.status, 'RESOLVED');
  const findingLedger = Convergence.buildFindingLedger({
    previousReviewReport: baseReview,
    nextReviewReport: nextReview,
    resolutions: [{
      finding_id: baseReview.findings[0].finding_id,
      status: 'RESOLVED',
      evidence_refs: ['proof:revised-plan-reviewed'],
      note: 'La correction ciblée a été revue et le finding ne persiste plus.',
    }],
  });

  const state = currentState(repo);
  const approved = approve(next, nextReview, state);
  const snapshot = Runtime.buildRuntimeSnapshot({
    ...next,
    reviewReport: nextReview,
    revisionArtifacts: {
      base_artifacts: base,
      allowed_change_set: allowed,
      revision_patch: patch,
      revision_outcome: outcome,
      previous_review_report: baseReview,
      finding_ledger: findingLedger,
    },
    ...approved,
    currentState: state,
  });

  assert.equal(snapshot.planning_mode, 'REVISION');
  assert.equal(snapshot.stages.find((row) => row.stage === 'REVISION').status, 'RESOLVED');
  assert.equal(snapshot.terminal_state, 'HANDOFF_READY');
  assert.equal(Runtime.validateRuntimeSnapshot(snapshot), true);
  const forged = V.sealContract({ ...Object.fromEntries(Object.entries(outcome).filter(([key]) => key !== 'contract_hash')), preserved_target_count: 0 });
  assert.throws(() => Runtime.buildRuntimeSnapshot({ ...next, reviewReport: nextReview,
    revisionArtifacts: { base_artifacts: base, allowed_change_set: allowed, revision_patch: patch,
      revision_outcome: forged, previous_review_report: baseReview, finding_ledger: findingLedger },
    ...approved, currentState: state }), /REVISION_OUTCOME_REBUILD_MISMATCH/);
});

test('VNext-09 runtime refuse une REVISION sans preuve de résolution bornée', () => {
  const repo = fixtureRepo();
  const manifest = sourceManifest();
  const fakeBase = {
    plan_hash: '1'.repeat(64),
    review_hash: '2'.repeat(64),
    finding_ids: ['FND-causal'],
  };
  const envelope = makeEnvelope(manifest, repo, 'REVISION', fakeBase);
  const artifacts = buildPlanningArtifacts({ repo, manifest, envelope });
  const reviewReport = Review.buildReviewReport({
    reviewContext: artifacts.reviewContext,
    semanticReview: { findings: [] },
  });
  const state = currentState(repo);
  const approved = approve(artifacts, reviewReport, state);

  assert.throws(() => Runtime.buildRuntimeSnapshot({
    ...artifacts,
    reviewReport,
    revisionArtifacts: null,
    ...approved,
    currentState: state,
  }), /VNEXT_RUNTIME_REVISION_ARTIFACTS_REQUIRED/);
});

test('VNext-09 inventaire anti-régression : 24 invariants, 165 incidents, 138 tests, sans trou', () => {
  const root = path.resolve(__dirname, '..', '..');
  const register = fs.readFileSync(
    path.join(root, '.github', 'orchestration', 'KODJO_PROTOCOL_INCIDENT_REGISTER.md'),
    'utf8',
  );
  const matrix = fs.readFileSync(
    path.join(root, '.github', 'orchestration', 'KODJO_VNEXT_ANTI_REGRESSION_MATRIX.md'),
    'utf8',
  );

  function ids(prefix, text) {
    const re = new RegExp('^\\| (' + prefix + '-\\d{3}) \\|', 'gm');
    return [...text.matchAll(re)].map((match) => match[1]);
  }
  const incidents = ids('INC', register);
  const historicalTests = ids('T', register);
  const invariantSection = register.split('## Catalogue des invariants consolidés')[1]
    .split('## Couverture du protocole générique actuel')[0];
  const invariants = ids('INV', invariantSection);

  assert.equal(new Set(incidents).size, 165);
  assert.equal(new Set(historicalTests).size, 138);
  assert.equal(new Set(invariants).size, 24);

  const matrixRows = ids('INV', matrix);
  assert.equal(matrixRows.length, 24);
  assert.equal(new Set(matrixRows).size, 24);
  for (let n = 1; n <= 24; n += 1) {
    const id = 'INV-' + String(n).padStart(3, '0');
    assert.ok(matrixRows.includes(id), 'missing matrix row ' + id);
  }
  for (const line of matrix.split('\n').filter((row) => /^\| INV-\d{3} \|/.test(row))) {
    assert.match(
      line,
      /\| (CONSERVÉE|REMPLACÉE_ÉQUIVALENTE|SUPERSÉDÉE_EXPLICITEMENT|NON_APPLICABLE_JUSTIFIÉE) \|/,
    );
    assert.ok(line.split('|')[3].trim().length > 0, 'missing mechanism: ' + line);
    assert.ok(line.split('|')[4].trim().length > 0, 'missing evidence: ' + line);
  }
});
