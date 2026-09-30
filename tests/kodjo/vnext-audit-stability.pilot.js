'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SourceManifest = require('../../scripts/kodjo/lib/source-manifest');
const PlanningEnvelope = require('../../scripts/kodjo/lib/planning-envelope');
const RequirementRegistry = require('../../scripts/kodjo/lib/requirement-registry');
const Impact = require('../../scripts/kodjo/lib/impact-graph');
const Plan = require('../../scripts/kodjo/lib/plan-contract');
const Review = require('../../scripts/kodjo/lib/review-contract');
const Revision = require('../../scripts/kodjo/lib/revision-contract');
const Audit = require('../../scripts/kodjo/lib/audit-stability-contract');
const V = require('../../scripts/kodjo/lib/vnext-contract');

const H40A = 'a'.repeat(40);
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
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-audit-stability-'));
  git(cwd, 'init');
  git(cwd, 'config', 'user.name', 'KODJO Test');
  git(cwd, 'config', 'user.email', 'kodjo@example.test');
  write(path.join(cwd, 'src', 'core.js'), "module.exports = { value: 1 };\n");
  write(path.join(cwd, 'tests', 'core.test.js'), "const c = require('../src/core'); if (!c) throw new Error('x');\n");
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-m', 'fixture');
  return { cwd, revision: git(cwd, 'rev-parse', 'HEAD') };
}

function manifest() {
  return SourceManifest.build({
    slice_id: 'V2-VNEXT-11',
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

function envelope(sourceManifest, repo, mode = 'INITIAL', base = null) {
  return PlanningEnvelope.build({
    slice_id: 'V2-VNEXT-11',
    planning_mode: mode,
    baseline_head: H40A,
    product_head: H40A,
    application_head: repo.revision,
    issue_id: 'github_issue:MyUncried/Application-Routine#999',
    source_manifest: sourceManifest,
    base_plan_hash: mode === 'REVISION' ? base.plan_hash : null,
    base_review_hash: mode === 'REVISION' ? base.review_hash : null,
    causal_findings: mode === 'REVISION' ? base.finding_ids : [],
    created_from: mode === 'REVISION'
      ? { kind: 'PLAN_REVIEW_REVISE', refs: ['issue_comment:2'] }
      : { kind: 'INITIAL_REQUEST', refs: ['issue_comment:1'] },
  });
}

function byPath(candidateManifest, targetPath) {
  const row = candidateManifest.candidates.find((candidate) => candidate.path === targetPath);
  assert.ok(row, 'candidate absent: ' + targetPath);
  return row;
}

function buildArtifacts({
  repo = fixtureRepo(),
  sourceManifest = manifest(),
  mode = 'INITIAL',
  base = null,
  rationale = 'Plan initial.',
} = {}) {
  const planningEnvelope = envelope(sourceManifest, repo, mode, base);
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
      rationale: 'Exigence de fixture.',
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
  const req = requirementRegistry.requirements[0];

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
        requirement_id: req.requirement_id,
        candidate_id: core.candidate_id,
        change_kind: 'MODIFY',
        impact_reason: 'Le module porte le comportement.',
        dependency_evidence: ['source normative'],
        tests_affected_candidate_ids: [coreTest.candidate_id],
        preservation_candidate_ids: [],
      },
      {
        requirement_id: req.requirement_id,
        candidate_id: coreTest.candidate_id,
        change_kind: 'MODIFY',
        impact_reason: 'Le test doit évoluer avec le comportement.',
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
      requirement_id: req.requirement_id,
      implementation_intents: [
        { impact_id: sourceImpact.impact_id, intent: 'Adapter le module.' },
        { impact_id: testImpact.impact_id, intent: 'Adapter le test.' },
      ],
      test_obligations: [{
        target_impact_id: testImpact.impact_id,
        covered_change_impact_ids: covered,
        expected: 'Le test passe.',
        justification: 'Test direct.',
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
      rationale,
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

  return {
    ...repo,
    sourceManifest,
    planningEnvelope,
    requirementRegistry,
    candidateManifest,
    directImportScan,
    impactGraph,
    planContract,
    uiAtomicityContract: null,
    reviewContext,
    req,
  };
}

function blockingReview(artifacts, overrides = {}) {
  const item = artifacts.planContract.plan_items[0];
  return Review.buildReviewReport({
    reviewContext: artifacts.reviewContext,
    semanticReview: {
      findings: [{
        category: overrides.category || 'PLAN_GAP',
        target_type: 'PLAN_ITEM',
        target_id: item.plan_item_id,
        finding: overrides.finding || 'Le plan doit préciser la correction.',
        evidence: ['inspection du plan'],
        required_correction: overrides.required_correction || 'Préciser le plan.',
        dependency_target_ids: [],
      }],
    },
  });
}

function suggestionReview(artifacts) {
  const item = artifacts.planContract.plan_items[0];
  return Review.buildReviewReport({
    reviewContext: artifacts.reviewContext,
    semanticReview: {
      findings: [{
        category: 'SUGGESTION',
        target_type: 'PLAN_ITEM',
        target_id: item.plan_item_id,
        finding: 'Amélioration facultative de lisibilité.',
        evidence: ['inspection du plan'],
        required_correction: 'Aucune correction obligatoire.',
        dependency_target_ids: [],
      }],
    },
  });
}

function auditManifestFor(artifacts, statement = 'Le plan doit satisfaire les exigences fonctionnelles figées.') {
  return Audit.buildAuditManifest({
    candidateHead: artifacts.revision,
    sources: [{
      source_ref: 'docs/functional.md',
      source_hash: artifacts.sourceManifest.contract_hash,
    }],
    criteria: [
      {
        source_ref: 'docs/functional.md',
        clause: '§1',
        statement,
        applicability: 'REQUIRED',
      },
      {
        source_ref: 'docs/functional.md',
        clause: 'audit-optional',
        statement: 'Examiner la qualité documentaire lorsque ce point est applicable.',
        applicability: 'CONDITIONAL',
      },
    ],
  });
}

function assessmentFor(artifacts, reviewReport, auditManifest, { withNormativeRefs = true } = {}) {
  const criterionId = auditManifest.criteria.find((row) => row.applicability === 'REQUIRED').audit_criterion_id;
  return Audit.buildFindingAssessment({
    auditManifest,
    reviewContext: artifacts.reviewContext,
    reviewReport,
    assessments: reviewReport.findings.map((finding) => ({
      finding_id: finding.finding_id,
      classification: finding.blocking ? 'DEFECT' : 'SUGGESTION',
      normative_criterion_ids: finding.blocking && withNormativeRefs ? [criterionId] : [],
      rationale: finding.blocking
        ? 'Le constat est rattaché à une règle préexistante.'
        : 'Il s’agit d’une recommandation non bloquante.',
    })),
  });
}

function nextRevision(base, previousReport, rationale = 'Plan corrigé explicitement.') {
  return buildArtifacts({
    repo: { cwd: base.cwd, revision: base.revision },
    sourceManifest: base.sourceManifest,
    mode: 'REVISION',
    base: {
      plan_hash: base.planContract.contract_hash,
      review_hash: previousReport.contract_hash,
      finding_ids: previousReport.findings.filter((row) => row.blocking).map((row) => row.finding_id),
    },
    rationale,
  });
}

function resolutionSet(auditManifest, previousReport, next, nextReport, resolutions = null) {
  const nextIds = new Set(nextReport.findings.map((row) => row.finding_id));
  const rows = resolutions || previousReport.findings
    .filter((row) => row.blocking && !nextIds.has(row.finding_id))
    .map((row) => ({
      finding_id: row.finding_id,
      disposition: 'RESOLVED',
      evidence: ['La correction est vérifiée sur le nouvel artefact canonique.'],
      evidence_target_ids: [row.target_id],
      justification: 'Fermeture explicite fondée sur la nouvelle revue.',
    }));
  return Audit.buildFindingResolutionSet({
    auditManifest,
    previousReviewReport: previousReport,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    resolutions: rows,
  });
}

test('VNext-11 AuditManifest est déterministe et un changement de critère change son identité', () => {
  const artifacts = buildArtifacts();
  const first = auditManifestFor(artifacts);
  const same = auditManifestFor(artifacts);
  const changed = auditManifestFor(artifacts, 'Le plan doit satisfaire une nouvelle formulation normative.');

  assert.equal(first.contract_hash, same.contract_hash);
  assert.notEqual(first.contract_hash, changed.contract_hash);
  assert.equal(Audit.validateAuditManifest(first), true);
});

test('VNext-11 un finding bloquant sans provenance normative est refusé', () => {
  const artifacts = buildArtifacts();
  const report = blockingReview(artifacts);
  const auditManifest = auditManifestFor(artifacts);

  assert.throws(
    () => assessmentFor(artifacts, report, auditManifest, { withNormativeRefs: false }),
    /VNEXT_BLOCKING_FINDING_NORMATIVE_PROVENANCE_REQUIRED/,
  );
});

test('VNext-11 une suggestion nouvelle reste non bloquante et n’exige pas de provenance normative', () => {
  const artifacts = buildArtifacts();
  const report = suggestionReview(artifacts);
  const auditManifest = auditManifestFor(artifacts);
  const assessment = assessmentFor(artifacts, report, auditManifest, { withNormativeRefs: false });

  assert.equal(report.verdict, 'APPROVE');
  assert.equal(assessment.assessments[0].classification, 'SUGGESTION');
  assert.deepEqual(assessment.assessments[0].normative_criterion_ids, []);
});

test('VNext-11 une révision ne peut pas être autorisée sans assessment normatif figé', () => {
  const artifacts = buildArtifacts();
  const report = blockingReview(artifacts);

  assert.throws(() => Revision.buildAllowedChangeSet({
    reviewContext: artifacts.reviewContext,
    reviewReport: report,
    requirementRegistry: artifacts.requirementRegistry,
    impactGraph: artifacts.impactGraph,
    candidateManifest: artifacts.candidateManifest,
    planContract: artifacts.planContract,
  }), /VNEXT_REVISION_NORMATIVE_ASSESSMENT_REQUIRED/);
});

test('VNext-11 la disparition d’un finding ne vaut jamais fermeture', () => {
  const base = buildArtifacts();
  const report = blockingReview(base);
  const auditManifest = auditManifestFor(base);
  const next = nextRevision(base, report);
  const nextReport = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: { findings: [] },
  });

  assert.throws(() => Audit.buildFindingResolutionSet({
    auditManifest,
    previousReviewReport: report,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    resolutions: [],
  }), /VNEXT_FINDING_RESOLUTION_INCOMPLETE/);
});

test('VNext-11 une fermeture explicite fait passer le ledger de OPEN à RESOLVED', () => {
  const base = buildArtifacts();
  const report = blockingReview(base);
  const auditManifest = auditManifestFor(base);
  const assessment = assessmentFor(base, report, auditManifest);
  const ledger = Audit.buildFindingLedgerInitial({
    auditManifest,
    reviewContext: base.reviewContext,
    reviewReport: report,
    findingAssessment: assessment,
  });
  assert.deepEqual(ledger.open_finding_ids, [report.findings[0].finding_id]);

  const next = nextRevision(base, report);
  const nextReport = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: { findings: [] },
  });
  const nextAssessment = assessmentFor(next, nextReport, auditManifest);
  const resolutions = resolutionSet(auditManifest, report, next, nextReport);

  const advanced = Audit.advanceFindingLedgerWithPreviousReport({
    previousLedger: ledger,
    previousReviewReport: report,
    auditManifest,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    nextFindingAssessment: nextAssessment,
    findingResolutionSet: resolutions,
  });

  assert.deepEqual(advanced.open_finding_ids, []);
  assert.equal(advanced.entries[0].status, 'RESOLVED');
  assert.ok(advanced.entries[0].resolution_evidence.length > 0);
});

test('VNext-11 le référentiel d’audit ne peut pas changer silencieusement entre deux revues', () => {
  const base = buildArtifacts();
  const report = blockingReview(base);
  const auditManifest = auditManifestFor(base);
  const ledger = Audit.buildFindingLedgerInitial({
    auditManifest,
    reviewContext: base.reviewContext,
    reviewReport: report,
    findingAssessment: assessmentFor(base, report, auditManifest),
  });
  const changedManifest = auditManifestFor(base, 'Critère déplacé après le premier audit.');
  const next = nextRevision(base, report);
  const nextReport = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: { findings: [] },
  });

  assert.throws(() => Audit.advanceFindingLedgerWithPreviousReport({
    previousLedger: ledger,
    previousReviewReport: report,
    auditManifest: changedManifest,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    nextFindingAssessment: assessmentFor(next, nextReport, changedManifest),
    findingResolutionSet: resolutionSet(changedManifest, report, next, nextReport),
  }), /VNEXT_FINDING_LEDGER_AUDIT_MANIFEST_CHANGED/);
});

test('VNext-11 la révision réelle exige la fermeture explicite avant RESOLVED', () => {
  const base = buildArtifacts();
  const report = blockingReview(base);
  const auditManifest = auditManifestFor(base);
  const findingAssessment = assessmentFor(base, report, auditManifest);
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    auditManifest,
    findingAssessment,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  const item = base.planContract.plan_items[0];
  const patch = Revision.buildRevisionPatch({
    allowedChangeSet: allowed,
    corrections: [{
      target_type: 'PLAN_ITEM',
      target_id: item.plan_item_id,
      finding_ids: [report.findings[0].finding_id],
      correction: 'Préciser le plan.',
    }],
  });
  const next = nextRevision(base, report);
  const nextReport = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: { findings: [] },
  });

  assert.throws(() => Revision.verifyRevisionOutcome({
    allowedChangeSet: allowed,
    revisionPatch: patch,
    baseArtifacts: base,
    nextArtifacts: next,
    auditManifest,
    previousReviewReport: report,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    findingResolutionSet: null,
  }), /VNEXT_REVISION_FINDING_RESOLUTION_REQUIRED/);

  const outcome = Revision.verifyRevisionOutcome({
    allowedChangeSet: allowed,
    revisionPatch: patch,
    baseArtifacts: base,
    nextArtifacts: next,
    auditManifest,
    previousReviewReport: report,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    findingResolutionSet: resolutionSet(auditManifest, report, next, nextReport),
  });
  assert.equal(outcome.status, 'RESOLVED');
  assert.equal(outcome.schema_version, 'kodjo.vnext.revision-outcome.v2');
});

test('VNext-11 la matrice finale doit couvrir chaque critère figé', () => {
  const artifacts = buildArtifacts();
  const report = blockingReview(artifacts);
  const auditManifest = auditManifestFor(artifacts);
  const assessment = assessmentFor(artifacts, report, auditManifest);
  const required = auditManifest.criteria.find((row) => row.applicability === 'REQUIRED');

  assert.throws(() => Audit.buildAuditCoverage({
    auditManifest,
    reviewReport: report,
    findingAssessment: assessment,
    coverage: [{
      audit_criterion_id: required.audit_criterion_id,
      status: 'CHECKED_FINDING',
      finding_ids: [report.findings[0].finding_id],
      evidence: ['critère contrôlé'],
      justification: 'Finding observé.',
    }],
  }), /VNEXT_AUDIT_COVERAGE_INCOMPLETE/);
});

test('VNext-11 un critère REQUIRED ne peut jamais être reporté NOT_APPLICABLE', () => {
  const artifacts = buildArtifacts();
  const report = blockingReview(artifacts);
  const auditManifest = auditManifestFor(artifacts);
  const assessment = assessmentFor(artifacts, report, auditManifest);

  const rows = auditManifest.criteria.map((criterion) => ({
    audit_criterion_id: criterion.audit_criterion_id,
    status: criterion.applicability === 'REQUIRED' ? 'NOT_APPLICABLE' : 'NOT_APPLICABLE',
    finding_ids: [],
    evidence: ['évaluation explicite'],
    justification: 'Tentative de report.',
  }));

  assert.throws(() => Audit.buildAuditCoverage({
    auditManifest,
    reviewReport: report,
    findingAssessment: assessment,
    coverage: rows,
  }), /VNEXT_AUDIT_COVERAGE_REQUIRED_NOT_APPLICABLE/);
});

test('VNext-11 un audit final REVISE produit un état terminal sans réaudit automatique', () => {
  const artifacts = buildArtifacts();
  const report = blockingReview(artifacts);
  const auditManifest = auditManifestFor(artifacts);
  const assessment = assessmentFor(artifacts, report, auditManifest);
  const ledger = Audit.buildFindingLedgerInitial({
    auditManifest,
    reviewContext: artifacts.reviewContext,
    reviewReport: report,
    findingAssessment: assessment,
  });

  const coverage = Audit.buildAuditCoverage({
    auditManifest,
    reviewReport: report,
    findingAssessment: assessment,
    coverage: auditManifest.criteria.map((criterion) => ({
      audit_criterion_id: criterion.audit_criterion_id,
      status: criterion.applicability === 'REQUIRED' ? 'CHECKED_FINDING' : 'NOT_APPLICABLE',
      finding_ids: criterion.applicability === 'REQUIRED' ? [report.findings[0].finding_id] : [],
      evidence: ['audit indépendant effectué'],
      justification: criterion.applicability === 'REQUIRED'
        ? 'Le critère révèle le finding bloquant.'
        : 'Le critère conditionnel n’est pas applicable à cette fixture.',
    })),
  });

  const outcome = Audit.buildFinalAuditOutcome({
    auditManifest,
    reviewContext: artifacts.reviewContext,
    reviewReport: report,
    findingAssessment: assessment,
    findingLedger: ledger,
    auditCoverage: coverage,
  });

  assert.equal(outcome.status, 'FINAL_REVISE_TERMINAL');
  assert.equal(outcome.next_action, 'STOP_AND_REMEDIATE_WITHOUT_AUTOMATIC_REAUDIT');
  assert.equal(outcome.automatic_reaudit_allowed, false);
  assert.equal(Audit.validateFinalAuditOutcome(outcome), true);
});

test('VNext-11 un audit final APPROVE ne passe pas si un ancien finding reste OPEN', () => {
  const base = buildArtifacts();
  const oldReport = blockingReview(base);
  const auditManifest = auditManifestFor(base);
  const oldAssessment = assessmentFor(base, oldReport, auditManifest);
  const ledger = Audit.buildFindingLedgerInitial({
    auditManifest,
    reviewContext: base.reviewContext,
    reviewReport: oldReport,
    findingAssessment: oldAssessment,
  });

  const next = nextRevision(base, oldReport);
  const approveReport = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: { findings: [] },
  });
  const approveAssessment = assessmentFor(next, approveReport, auditManifest);
  const coverage = Audit.buildAuditCoverage({
    auditManifest,
    reviewReport: approveReport,
    findingAssessment: approveAssessment,
    coverage: auditManifest.criteria.map((criterion) => ({
      audit_criterion_id: criterion.audit_criterion_id,
      status: criterion.applicability === 'REQUIRED' ? 'CHECKED_PASS' : 'NOT_APPLICABLE',
      finding_ids: [],
      evidence: ['audit final contrôlé'],
      justification: criterion.applicability === 'REQUIRED'
        ? 'Aucun finding courant.'
        : 'Critère conditionnel non applicable.',
    })),
  });

  const staleOpenLedger = structuredClone(ledger);
  staleOpenLedger.review_report_hashes.push(approveReport.contract_hash);
  delete staleOpenLedger.contract_hash;
  staleOpenLedger.contract_hash = V.canonicalHash(staleOpenLedger);

  assert.throws(() => Audit.buildFinalAuditOutcome({
    auditManifest,
    reviewContext: next.reviewContext,
    reviewReport: approveReport,
    findingAssessment: approveAssessment,
    findingLedger: staleOpenLedger,
    auditCoverage: coverage,
  }), /VNEXT_FINAL_AUDIT_OPEN_FINDINGS_BLOCK_APPROVAL/);
});
