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
const Approval = require('../../scripts/kodjo/lib/approval-handoff-contract');

const H40A = 'a'.repeat(40);
const H40B = 'b'.repeat(40);
const H40C = 'c'.repeat(40);
const H64A = 'a'.repeat(64);
const H64B = 'b'.repeat(64);

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function fixtureRepo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-approval-'));
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

function byPath(manifest, p) {
  const hit = manifest.candidates.find((row) => row.path === p);
  assert.ok(hit, 'candidate absent: ' + p);
  return hit;
}

function buildFixture({ reviewFindings = [] } = {}) {
  const repo = fixtureRepo();
  const sourceManifest = SourceManifest.build({
    slice_id: 'V2-VNEXT-08',
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

  const planningEnvelope = PlanningEnvelope.build({
    slice_id: 'V2-VNEXT-08',
    planning_mode: 'INITIAL',
    baseline_head: H40A,
    product_head: H40A,
    application_head: repo.revision,
    issue_id: 'github_issue:MyUncried/Application-Routine#999',
    source_manifest: sourceManifest,
    base_plan_hash: null,
    base_review_hash: null,
    causal_findings: [],
    created_from: { kind: 'INITIAL_REQUEST', refs: ['issue_comment:1'] },
  });

  const source = sourceManifest.sources[0];
  const requirementRegistry = RequirementRegistry.build({
    planning_envelope_hash: planningEnvelope.contract_hash,
    source_manifest: sourceManifest,
    requirements: [{
      source_id: source.source_id,
      unit_id: source.units[0].unit_id,
      kind: 'FUNCTIONAL',
      statement: 'Modifier le comportement du module.',
      priority: 'MUST',
      status: 'ACTIVE',
      rationale: 'Exigence fixture.',
      related_unit_ids: [],
      conflict_unit_ids: [],
    }],
  });

  const candidateManifest = Impact.buildCandidateManifest({
    cwd: repo.cwd,
    revision: repo.revision,
  });
  const core = byPath(candidateManifest, 'src/core.js');
  const coreTest = byPath(candidateManifest, 'tests/core.test.js');
  const keep = byPath(candidateManifest, 'src/keep.js');
  const reqId = requirementRegistry.requirements[0].requirement_id;

  const directImportScan = Impact.scanOneLevelDirectImporters({
    cwd: repo.cwd,
    candidateManifest,
    modifyCandidateIds: [core.candidate_id],
  });

  const impactGraph = Impact.buildImpactGraph({
    requirementRegistry,
    candidateManifest,
    directImportScan,
    classifications: [
      {
        requirement_id: reqId,
        candidate_id: core.candidate_id,
        change_kind: 'MODIFY',
        impact_reason: 'Le module porte le comportement.',
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

  const planContract = Plan.buildPlanContract({
    requirementRegistry,
    impactGraph,
    candidateManifest,
    requirementPlans: [{
      requirement_id: reqId,
      implementation_intents: [
        { impact_id: sourceImpact.impact_id, intent: 'Adapter le comportement du module.' },
        { impact_id: testImpact.impact_id, intent: 'Adapter le test direct.' },
      ],
      test_obligations: [{
        target_impact_id: testImpact.impact_id,
        covered_change_impact_ids: covered,
        expected: 'Le test ciblé passe.',
        justification: 'Test direct du comportement.',
      }],
      proof_obligations: [{
        proof_type: 'FUNCTIONAL_TEST',
        target_test_impact_id: testImpact.impact_id,
        covered_change_impact_ids: covered,
        expected: 'Le test fonctionnel passe.',
        justification: 'Preuve fonctionnelle.',
      }],
      implementation_constraints: [],
      residual_risks: [],
      rationale: 'Plan prêt pour exécution.',
    }],
  });

  const reviewContext = Review.buildReviewContext({
    planningEnvelope,
    requirementRegistry,
    impactGraph,
    candidateManifest,
    planContract,
    directImportScan,
    uiAtomicityContract: null,
  });

  const reviewReport = Review.buildReviewReport({
    reviewContext,
    semanticReview: { findings: reviewFindings },
  });

  const currentState = {
    product_head: H40A,
    application_head: repo.revision,
    protocol_head: H40B,
  };

  return {
    ...repo,
    planningEnvelope,
    requirementRegistry,
    candidateManifest,
    directImportScan,
    impactGraph,
    planContract,
    reviewContext,
    reviewReport,
    uiAtomicityContract: null,
    currentState,
    reqId,
    core,
    coreTest,
    keep,
  };
}

function artifacts(fx, overrides = {}) {
  return {
    planningEnvelope: fx.planningEnvelope,
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    reviewContext: fx.reviewContext,
    reviewReport: fx.reviewReport,
    uiAtomicityContract: fx.uiAtomicityContract,
    currentState: fx.currentState,
    ...overrides,
  };
}

function approvalEvidence(target, overrides = {}) {
  return {
    decision: 'APPROVED',
    actor_id: 'MyUncried',
    transport: 'GITHUB_REACTION',
    evidence_ref: 'issue_comment:12345#reaction:+1:MyUncried',
    approved_target_hash: target.contract_hash,
    observed_at: '2026-09-30T00:00:00.000Z',
    ...overrides,
  };
}

test('VNext-08 construit une cible d’approbation sur l’exécution exacte', () => {
  const fx = buildFixture();
  assert.equal(fx.reviewReport.verdict, 'APPROVE');

  const target = Approval.buildApprovalTarget(artifacts(fx));
  assert.equal(target.schema_version, Approval.APPROVAL_TARGET_SCHEMA);
  assert.equal(target.action_expected, 'APPROVE_EXACT_EXECUTION');
  assert.equal(target.execution_core.application_head, fx.revision);
  assert.equal(target.execution_core.plan_contract_hash, fx.planContract.contract_hash);
  assert.equal(target.execution_core.review_report_hash, fx.reviewReport.contract_hash);
  assert.deepEqual(
    target.execution_core.write_scope.map((row) => row.path).sort(),
    ['src/core.js', 'tests/core.test.js'],
  );
  assert.deepEqual(target.execution_core.preserve_scope.map((row) => row.path), ['src/keep.js']);
  assert.deepEqual(target.execution_core.checks, ['jest', 'typescript', 'lint']);
  assert.equal(Approval.validateApprovalTarget(target), true);
});

test('VNext-08 refuse de demander une approbation tant que la review n’est pas APPROVE', () => {
  const base = buildFixture();
  const item = base.planContract.plan_items[0];
  const report = Review.buildReviewReport({
    reviewContext: base.reviewContext,
    semanticReview: {
      findings: [{
        category: 'PLAN_GAP',
        target_type: 'PLAN_ITEM',
        target_id: item.plan_item_id,
        finding: 'Le plan reste incomplet.',
        evidence: ['plan inspected'],
        required_correction: 'Compléter le plan.',
        dependency_target_ids: [],
      }],
    },
  });
  assert.equal(report.verdict, 'REVISE');

  assert.throws(() => Approval.buildApprovalTarget(artifacts(base, { reviewReport: report })),
    /VNEXT_APPROVAL_REVIEW_NOT_APPROVED/);
});

test('VNext-08 produit un message actionnable lié à l’objet canonique', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const message = Approval.renderApprovalMessage(target, {
    approvalUrl: 'https://github.com/MyUncried/Application-Routine/issues/999#issuecomment-12345',
  });
  assert.match(message, /USER_APPROVAL_REQUIRED/);
  assert.match(message, new RegExp(target.approval_target_id));
  assert.match(message, new RegExp(target.contract_hash));
  assert.match(message, /APPROVE_EXACT_EXECUTION/);
  assert.match(message, /approval_url=/);
});

test('VNext-08 le transport du message ne change pas l’identité de la cible approuvée', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const a = Approval.renderApprovalMessage(target, { approvalUrl: 'https://example.test/a' });
  const b = Approval.renderApprovalMessage(target, { approvalUrl: 'https://example.test/b' });
  assert.notEqual(a, b);
  assert.equal(target.contract_hash, Approval.buildApprovalTarget(artifacts(fx)).contract_hash);
});

test('VNext-08 exige une action utilisateur explicite liée au hash exact', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const record = Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target),
  });
  assert.equal(record.decision, 'APPROVED');
  assert.equal(record.evidence_kind, 'VERIFIED_USER_ACTION');
  assert.equal(record.approval_target_hash, target.contract_hash);
  assert.equal(Approval.validateApprovalRecord(record, target), true);

  assert.throws(() => Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target, { approved_target_hash: 'f'.repeat(64) }),
  }), /VNEXT_APPROVAL_TARGET_REFERENCE_MISMATCH/);
});

test('VNext-08 refuse un ApprovalTarget re-signé avec une identité interne falsifiée', () => {
  const fx = buildFixture();
  const target = structuredClone(Approval.buildApprovalTarget(artifacts(fx)));
  target.approval_target_id = 'APRT-' + 'f'.repeat(24);
  delete target.contract_hash;
  target.contract_hash = V.canonicalHash(target);

  assert.throws(() => Approval.validateApprovalTarget(target), /VNEXT_APPROVAL_TARGET_ID_MISMATCH/);
});

test('VNext-08 refuse un ApprovalRecord re-signé avec une identité interne falsifiée', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const record = structuredClone(Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target),
  }));
  record.approval_record_id = 'APRV-' + 'e'.repeat(24);
  delete record.contract_hash;
  record.contract_hash = V.canonicalHash(record);

  assert.throws(
    () => Approval.validateApprovalRecord(record, target),
    /VNEXT_APPROVAL_RECORD_ID_MISMATCH/,
  );
});

test('VNext-08 une décision REJECTED bloque toujours le handoff', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const record = Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target, { decision: 'REJECTED' }),
  });
  assert.throws(() => Approval.buildExecutionRequest({
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts(fx),
  }), /VNEXT_HANDOFF_USER_APPROVAL_REQUIRED/);
});

test('VNext-08 construit le handoff canonique bit-for-bit depuis l’approbation', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const record = Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target),
  });
  const request = Approval.buildExecutionRequest({
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts(fx),
  });

  assert.equal(request.schema_version, Approval.EXECUTION_REQUEST_SCHEMA);
  assert.equal(request.execution_fingerprint, target.execution_fingerprint);
  assert.equal(request.approval_target_hash, target.contract_hash);
  assert.equal(request.approval_record_hash, record.contract_hash);
  assert.deepEqual(request.write_scope, target.execution_core.write_scope);
  assert.deepEqual(request.preserve_scope, target.execution_core.preserve_scope);
  assert.equal(Approval.validateExecutionRequest(request, {
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts(fx),
  }), true);
});

test('VNext-08 refuse une approbation devenue obsolète après modification du plan', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const record = Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target),
  });

  const changed = structuredClone(fx.planContract);
  changed.plan_items[0].rationale = 'Plan modifié après approbation.';
  const unsigned = structuredClone(changed);
  delete unsigned.contract_hash;
  changed.contract_hash = V.canonicalHash(unsigned);

  assert.throws(() => Approval.buildExecutionRequest({
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts(fx, { planContract: changed }),
  }), /VNEXT_PLAN_CONTRACT_REBUILD_MISMATCH|VNEXT_APPROVAL_PLAN_CONTEXT_MISMATCH|VNEXT_HANDOFF_APPROVAL_STALE/);
});

test('VNext-08 refuse le handoff si le HEAD applicatif a bougé', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const record = Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target),
  });

  assert.throws(() => Approval.buildExecutionRequest({
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts(fx, {
      currentState: { ...fx.currentState, application_head: H40C },
    }),
  }), /VNEXT_APPROVAL_APPLICATION_HEAD_STALE/);
});

test('VNext-08 refuse le handoff si le HEAD produit a bougé', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const record = Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target),
  });

  assert.throws(() => Approval.buildExecutionRequest({
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts(fx, {
      currentState: { ...fx.currentState, product_head: H40C },
    }),
  }), /VNEXT_APPROVAL_PRODUCT_HEAD_STALE/);
});

test('VNext-08 invalide l’approbation si la version protocolaire change', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const record = Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target),
  });

  assert.throws(() => Approval.buildExecutionRequest({
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts(fx, {
      currentState: { ...fx.currentState, protocol_head: H40C },
    }),
  }), /VNEXT_HANDOFF_APPROVAL_STALE/);
});

test('VNext-08 refuse tout élargissement manuel du write_scope dans ExecutionRequest', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  const record = Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target),
  });
  const request = Approval.buildExecutionRequest({
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts(fx),
  });

  const tampered = structuredClone(request);
  tampered.write_scope.push({
    candidate_id: fx.keep.candidate_id,
    path: 'src/keep.js',
    change_kind: 'MODIFY',
  });
  const unsigned = structuredClone(tampered);
  delete unsigned.contract_hash;
  tampered.contract_hash = V.canonicalHash(unsigned);

  assert.throws(() => Approval.validateExecutionRequest(tampered, {
    approvalTarget: target,
    approvalRecord: record,
    ...artifacts(fx),
  }), /VNEXT_EXECUTION_REQUEST_REBUILD_MISMATCH/);
});

test('VNext-08 refuse un transport d’approbation non reconnu', () => {
  const fx = buildFixture();
  const target = Approval.buildApprovalTarget(artifacts(fx));
  assert.throws(() => Approval.buildApprovalRecord({
    approvalTarget: target,
    evidence: approvalEvidence(target, { transport: 'FREE_TEXT' }),
  }), /VNEXT_APPROVAL_TRANSPORT_INVALID/);
});

test('VNext-08 ne permet aucun path libre ni scope libre en entrée de handoff', () => {
  const code = fs.readFileSync(
    path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'lib', 'approval-handoff-contract.js'),
    'utf8',
  );
  assert.match(code, /planContract\.boundaries\.write_scope/);
  assert.match(code, /planContract\.boundaries\.preserve_scope/);
  assert.doesNotMatch(code, /scope_allow\s*:\s*input/);
  assert.doesNotMatch(code, /write_scope\s*:\s*input/);
});
