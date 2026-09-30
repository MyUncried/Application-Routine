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
const AuditStability = require('../../scripts/kodjo/lib/audit-stability-contract');

const H40 = 'a'.repeat(40);
const H64A = 'a'.repeat(64);
const H64B = 'b'.repeat(64);
const H64C = 'c'.repeat(64);
const H64D = 'd'.repeat(64);

function explicitResolutionSet(previousReport, nextArtifacts, nextReport) {
  const nextIds = new Set(nextReport.findings.map((row) => row.finding_id));
  return AuditStability.buildFindingResolutionSet({
    previousReviewReport: previousReport,
    nextReviewContext: nextArtifacts.reviewContext,
    nextReviewReport: nextReport,
    resolutions: previousReport.findings
      .filter((row) => row.blocking && !nextIds.has(row.finding_id))
      .map((row) => ({
        finding_id: row.finding_id,
        disposition: 'RESOLVED',
        evidence: ['Correction explicitement vérifiée dans la revue suivante.'],
        evidence_target_ids: [row.target_id],
        justification: 'Le constat antérieur est fermé explicitement ; sa disparition seule ne vaut pas preuve.',
      })),
  });
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function fixtureRepo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-revision-'));
  git(cwd, 'init');
  git(cwd, 'config', 'user.name', 'KODJO Test');
  git(cwd, 'config', 'user.email', 'kodjo@example.test');

  write(path.join(cwd, 'src', 'a.js'), "module.exports = { value: 'a' };\n");
  write(path.join(cwd, 'src', 'b.js'), "module.exports = { value: 'b' };\n");
  write(path.join(cwd, 'tests', 'a.test.js'), "const a = require('../src/a'); if (!a) throw new Error('a');\n");
  write(path.join(cwd, 'tests', 'b.test.js'), "const b = require('../src/b'); if (!b) throw new Error('b');\n");
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-m', 'fixture');
  return { cwd, revision: git(cwd, 'rev-parse', 'HEAD') };
}

function buildSourceManifest() {
  return SourceManifest.build({
    slice_id: 'V2-VNEXT-07',
    product_head: H40,
    sources: [{
      source_kind: 'MARKDOWN',
      authority: 'FUNCTIONAL',
      locator: 'docs/functional.md',
      revision: H40,
      fingerprint: H64A,
      units: [
        { locator: '§A', fingerprint: H64B, disposition: 'REQUIREMENT_SOURCE' },
        { locator: '§B', fingerprint: H64C, disposition: 'REQUIREMENT_SOURCE' },
      ],
    }],
  });
}

function envelope(sourceManifest, mode = 'INITIAL', base = {}) {
  return PlanningEnvelope.build({
    slice_id: 'V2-VNEXT-07',
    planning_mode: mode,
    baseline_head: H40,
    product_head: H40,
    application_head: base.application_head || H40,
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

function requirementInputs(manifest) {
  const source = manifest.sources[0];
  return [
    {
      source_id: source.source_id,
      unit_id: source.units[0].unit_id,
      kind: 'FUNCTIONAL',
      statement: 'Modifier le comportement A.',
      priority: 'MUST',
      status: 'ACTIVE',
      rationale: 'Exigence A.',
      related_unit_ids: [],
      conflict_unit_ids: [],
    },
    {
      source_id: source.source_id,
      unit_id: source.units[1].unit_id,
      kind: 'FUNCTIONAL',
      statement: 'Modifier le comportement B.',
      priority: 'MUST',
      status: 'ACTIVE',
      rationale: 'Exigence B.',
      related_unit_ids: [],
      conflict_unit_ids: [],
    },
  ];
}

function byPath(manifest, file) {
  const row = manifest.candidates.find((candidate) => candidate.path === file);
  assert.ok(row, 'candidate absent: ' + file);
  return row;
}

function classificationsFor(registry, candidateManifest) {
  const a = byPath(candidateManifest, 'src/a.js');
  const b = byPath(candidateManifest, 'src/b.js');
  const ta = byPath(candidateManifest, 'tests/a.test.js');
  const tb = byPath(candidateManifest, 'tests/b.test.js');
  const reqA = registry.requirements.find((row) => row.statement.includes('A.'));
  const reqB = registry.requirements.find((row) => row.statement.includes('B.'));

  const row = (reqId, candidate, kind, reason, affected = []) => ({
    requirement_id: reqId,
    candidate_id: candidate.candidate_id,
    change_kind: kind,
    impact_reason: reason,
    dependency_evidence: ['fixture'],
    tests_affected_candidate_ids: affected,
    preservation_candidate_ids: [],
  });

  return {
    a, b, ta, tb, reqA, reqB,
    rows: [
      row(reqA.requirement_id, a, 'MODIFY', 'A source', [ta.candidate_id]),
      row(reqA.requirement_id, ta, 'MODIFY', 'A test'),
      row(reqB.requirement_id, b, 'MODIFY', 'B source', [tb.candidate_id]),
      row(reqB.requirement_id, tb, 'MODIFY', 'B test'),
    ],
  };
}

function planInputFor(requirement, impacts, mutate = null) {
  const sourceImpact = impacts.find((row) => row.path.startsWith('src/'));
  const testImpact = impacts.find((row) => row.path.startsWith('tests/'));
  const covered = [sourceImpact.impact_id, testImpact.impact_id].sort();
  const base = {
    requirement_id: requirement.requirement_id,
    implementation_intents: [
      { impact_id: sourceImpact.impact_id, intent: 'Adapter le module ' + requirement.statement.slice(-2, -1) + '.' },
      { impact_id: testImpact.impact_id, intent: 'Adapter le test associé.' },
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
      justification: 'Preuve fonctionnelle directe.',
    }],
    implementation_constraints: [],
    residual_risks: [],
    rationale: 'Plan initial pour ' + requirement.statement,
  };
  if (mutate) mutate(base);
  return base;
}

function buildArtifacts({ mode = 'INITIAL', baseReview = null, planMutators = {}, extraProofFor = null, repoFixture = null } = {}) {
  const repo = repoFixture || fixtureRepo();
  const sourceManifest = buildSourceManifest();
  const planningEnvelope = envelope(
    sourceManifest,
    mode,
    mode === 'REVISION'
      ? {
        application_head: repo.revision,
        plan_hash: baseReview.plan_hash,
        review_hash: baseReview.review_hash,
        finding_ids: baseReview.finding_ids,
      }
      : { application_head: repo.revision },
  );

  const requirementRegistry = RequirementRegistry.build({
    planning_envelope_hash: planningEnvelope.contract_hash,
    source_manifest: sourceManifest,
    requirements: requirementInputs(sourceManifest),
  });

  const candidateManifest = Impact.buildCandidateManifest({
    cwd: repo.cwd,
    revision: repo.revision,
  });
  const cls = classificationsFor(requirementRegistry, candidateManifest);
  const directImportScan = Impact.scanOneLevelDirectImporters({
    cwd: repo.cwd,
    candidateManifest,
    modifyCandidateIds: [cls.a.candidate_id, cls.b.candidate_id],
  });

  const impactGraph = Impact.buildImpactGraph({
    requirementRegistry,
    candidateManifest,
    directImportScan,
    classifications: cls.rows,
  });

  const planInputs = requirementRegistry.requirements.map((requirement) => {
    const impacts = impactGraph.impacts.filter((row) => row.requirement_id === requirement.requirement_id);
    const mutate = planMutators[requirement.requirement_id] || null;
    const input = planInputFor(requirement, impacts, mutate);
    if (extraProofFor === requirement.requirement_id) {
      const covered = input.test_obligations[0].covered_change_impact_ids;
      input.proof_obligations.push({
        proof_type: 'STATIC_ANALYSIS',
        target_test_impact_id: null,
        covered_change_impact_ids: covered,
        expected: 'La structure reste cohérente.',
        justification: 'Preuve complémentaire autorisée.',
      });
    }
    return input;
  });

  const planContract = Plan.buildPlanContract({
    requirementRegistry,
    impactGraph,
    candidateManifest,
    requirementPlans: planInputs,
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
    reqA: cls.reqA,
    reqB: cls.reqB,
  };
}

function semanticFinding(targetType, targetId, overrides = {}) {
  return {
    category: overrides.category || 'PLAN_GAP',
    target_type: targetType,
    target_id: targetId,
    finding: overrides.finding || 'Le plan doit préciser la correction ciblée.',
    evidence: overrides.evidence || ['plan inspected'],
    required_correction: overrides.required_correction || 'Corriger uniquement l’objet ciblé.',
    dependency_target_ids: overrides.dependency_target_ids || [],
  };
}

function baseWithPlanFinding() {
  const base = buildArtifacts();
  const itemA = base.planContract.plan_items.find((item) => item.requirement_id === base.reqA.requirement_id);
  const report = Review.buildReviewReport({
    reviewContext: base.reviewContext,
    semanticReview: {
      findings: [semanticFinding('PLAN_ITEM', itemA.plan_item_id)],
    },
  });
  assert.equal(report.verdict, 'REVISE');
  return { base, itemA, report };
}

function makeRevisionBaseInfo(base, report) {
  return {
    plan_hash: base.planContract.contract_hash,
    review_hash: report.contract_hash,
    finding_ids: report.findings.filter((row) => row.blocking).map((row) => row.finding_id),
  };
}

test('VNext-07 construit un AllowedChangeSet borné et préserve le plan item non ciblé', () => {
  const { base, itemA, report } = baseWithPlanFinding();
  const itemB = base.planContract.plan_items.find((item) => item.requirement_id === base.reqB.requirement_id);

  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });

  assert.equal(allowed.reentry_stage, 'PLAN');
  assert.deepEqual(allowed.authorized_targets.map((x) => x.target_id), [itemA.plan_item_id]);
  assert.ok(allowed.derived_targets.some((x) => x.target_type === 'TEST'));
  assert.ok(allowed.derived_targets.some((x) => x.target_type === 'PROOF'));
  assert.ok(allowed.derived_targets.some((x) => x.target_type === 'PLAN_CONTRACT'));
  assert.ok(allowed.preserved_targets.some((x) => x.target_id === itemB.plan_item_id));
  assert.equal(Revision.validateAllowedChangeSet(allowed), true);
});

test('VNext-07 refuse un finding PLAN_CONTRACT trop large sans dépendances ciblées', () => {
  const base = buildArtifacts();
  const report = Review.buildReviewReport({
    reviewContext: base.reviewContext,
    semanticReview: {
      findings: [semanticFinding('PLAN_CONTRACT', base.planContract.contract_hash)],
    },
  });

  assert.throws(() => Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  }), /VNEXT_REVISION_PLAN_ROOT_TOO_BROAD/);
});

test('VNext-07 calcule la réentrée la plus amont quand plusieurs findings coexistent', () => {
  const base = buildArtifacts();
  const itemB = base.planContract.plan_items.find((item) => item.requirement_id === base.reqB.requirement_id);
  const report = Review.buildReviewReport({
    reviewContext: base.reviewContext,
    semanticReview: {
      findings: [
        semanticFinding('REQUIREMENT', base.reqA.requirement_id, {
          category: 'IMPACT_INCOMPLETE',
          finding: 'Un impact est absent.',
          required_correction: 'Reprendre l’analyse d’impact.',
        }),
        semanticFinding('PLAN_ITEM', itemB.plan_item_id),
      ],
    },
  });

  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  assert.equal(allowed.reentry_stage, 'IMPACT');
});

test('VNext-07 SOURCE_UNIT reste un anchor et non un objet librement mutable', () => {
  const base = buildArtifacts();
  const unitId = base.requirementRegistry.coverage[0].unit_id;
  const report = Review.buildReviewReport({
    reviewContext: base.reviewContext,
    semanticReview: {
      findings: [semanticFinding('SOURCE_UNIT', unitId, {
        category: 'MISSING_REQUIREMENT',
        finding: 'Une exigence de cette unité a été omise.',
        required_correction: 'Ajouter l’exigence manquante depuis cette source.',
      })],
    },
  });
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  assert.equal(allowed.reentry_stage, 'REQUIREMENTS');
  assert.equal(allowed.authorized_targets[0].mutation_mode, 'ANCHOR_ONLY');
  const existingRequirementIds = new Set(base.requirementRegistry.requirements.map((row) => row.requirement_id));
  assert.equal(
    allowed.preserved_targets.filter((row) => existingRequirementIds.has(row.target_id)).length,
    existingRequirementIds.size,
  );
});

test('VNext-07 refuse une correction sur une cible hors AllowedChangeSet', () => {
  const { base, report } = baseWithPlanFinding();
  const itemB = base.planContract.plan_items.find((item) => item.requirement_id === base.reqB.requirement_id);
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });

  assert.throws(() => Revision.buildRevisionPatch({
    allowedChangeSet: allowed,
    corrections: [{
      target_type: 'PLAN_ITEM',
      target_id: itemB.plan_item_id,
      finding_ids: [report.findings[0].finding_id],
      correction: 'Modifier B.',
    }],
  }), /VNEXT_REVISION_PATCH_TARGET_UNAUTHORIZED/);
});

test('VNext-07 exige que chaque finding bloquant soit couvert par le RevisionPatch', () => {
  const base = buildArtifacts();
  const itemA = base.planContract.plan_items.find((item) => item.requirement_id === base.reqA.requirement_id);
  const itemB = base.planContract.plan_items.find((item) => item.requirement_id === base.reqB.requirement_id);
  const report = Review.buildReviewReport({
    reviewContext: base.reviewContext,
    semanticReview: {
      findings: [
        semanticFinding('PLAN_ITEM', itemA.plan_item_id, { finding: 'A incomplet.' }),
        semanticFinding('PLAN_ITEM', itemB.plan_item_id, { finding: 'B incomplet.' }),
      ],
    },
  });
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });

  assert.throws(() => Revision.buildRevisionPatch({
    allowedChangeSet: allowed,
    corrections: [{
      target_type: 'PLAN_ITEM',
      target_id: itemA.plan_item_id,
      finding_ids: [report.findings.find((x) => x.target_id === itemA.plan_item_id).finding_id],
      correction: 'Corriger A uniquement.',
    }],
  }), /VNEXT_REVISION_PATCH_FINDING_UNCOVERED/);
});

test('VNext-07 produit une application bornée sans exposer les cibles dérivées à l’IA', () => {
  const { base, itemA, report } = baseWithPlanFinding();
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  const patch = Revision.buildRevisionPatch({
    allowedChangeSet: allowed,
    corrections: [{
      target_type: 'PLAN_ITEM',
      target_id: itemA.plan_item_id,
      finding_ids: [report.findings[0].finding_id],
      correction: 'Préciser le changement sans toucher aux autres exigences.',
    }],
  });
  const application = Revision.applyRevisionPatch({ allowedChangeSet: allowed, revisionPatch: patch });
  assert.equal(application.reentry_stage, 'PLAN');
  assert.deepEqual(application.editable_target_ids, [itemA.plan_item_id]);
  assert.ok(application.machine_derived_target_ids.length > 0);
  assert.equal(application.editable_target_ids.some((id) => application.machine_derived_target_ids.includes(id)), false);
});

test('VNext-07 accepte une correction ciblée et vérifie la préservation exacte', () => {
  const { base, itemA, report } = baseWithPlanFinding();
  const itemB = base.planContract.plan_items.find((item) => item.requirement_id === base.reqB.requirement_id);
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  const patch = Revision.buildRevisionPatch({
    allowedChangeSet: allowed,
    corrections: [{
      target_type: 'PLAN_ITEM',
      target_id: itemA.plan_item_id,
      finding_ids: [report.findings[0].finding_id],
      correction: 'Préciser uniquement la rationale du plan A.',
    }],
  });

  const baseInfo = makeRevisionBaseInfo(base, report);
  const next = buildArtifacts({
    mode: 'REVISION',
    baseReview: baseInfo,
    repoFixture: { cwd: base.cwd, revision: base.revision },
    planMutators: {
      [base.reqA.requirement_id]: (input) => {
        input.rationale = 'Plan A corrigé de manière ciblée.';
      },
    },
  });
  const nextReport = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: { findings: [] },
  });

  const outcome = Revision.verifyRevisionOutcome({
    allowedChangeSet: allowed,
    revisionPatch: patch,
    baseArtifacts: base,
    nextArtifacts: next,
    previousReviewReport: report,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    findingResolutionSet: explicitResolutionSet(report, next, nextReport),
  });
  assert.equal(outcome.status, 'RESOLVED');

  const nextItemB = next.planContract.plan_items.find((item) => item.requirement_id === next.reqB.requirement_id);
  assert.equal(nextItemB.plan_item_id, itemB.plan_item_id);
});

test('VNext-07 autorise un nouvel objet dérivé uniquement sous la cible corrigée', () => {
  const { base, itemA, report } = baseWithPlanFinding();
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  const patch = Revision.buildRevisionPatch({
    allowedChangeSet: allowed,
    corrections: [{
      target_type: 'PLAN_ITEM',
      target_id: itemA.plan_item_id,
      finding_ids: [report.findings[0].finding_id],
      correction: 'Ajouter une preuve technique complémentaire à A.',
    }],
  });

  const baseInfo = makeRevisionBaseInfo(base, report);
  const next = buildArtifacts({
    mode: 'REVISION',
    baseReview: baseInfo,
    repoFixture: { cwd: base.cwd, revision: base.revision },
    planMutators: {
      [base.reqA.requirement_id]: (input) => {
        input.rationale = 'Plan A corrigé.';
      },
    },
    extraProofFor: base.reqA.requirement_id,
  });
  const nextReport = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: { findings: [] },
  });

  const outcome = Revision.verifyRevisionOutcome({
    allowedChangeSet: allowed,
    revisionPatch: patch,
    baseArtifacts: base,
    nextArtifacts: next,
    previousReviewReport: report,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    findingResolutionSet: explicitResolutionSet(report, next, nextReport),
  });
  assert.equal(outcome.status, 'RESOLVED');
  assert.ok(outcome.new_target_count >= 1);
});

test('VNext-07 détecte une modification d’un objet préservé', () => {
  const { base, itemA, report } = baseWithPlanFinding();
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  const patch = Revision.buildRevisionPatch({
    allowedChangeSet: allowed,
    corrections: [{
      target_type: 'PLAN_ITEM',
      target_id: itemA.plan_item_id,
      finding_ids: [report.findings[0].finding_id],
      correction: 'Corriger A.',
    }],
  });

  const baseInfo = makeRevisionBaseInfo(base, report);
  const next = buildArtifacts({
    mode: 'REVISION',
    baseReview: baseInfo,
    repoFixture: { cwd: base.cwd, revision: base.revision },
    planMutators: {
      [base.reqA.requirement_id]: (input) => { input.rationale = 'A corrigé.'; },
      [base.reqB.requirement_id]: (input) => { input.rationale = 'B modifié sans autorisation.'; },
    },
  });
  const nextReport = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: { findings: [] },
  });

  assert.throws(() => Revision.verifyRevisionOutcome({
    allowedChangeSet: allowed,
    revisionPatch: patch,
    baseArtifacts: base,
    nextArtifacts: next,
    previousReviewReport: report,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    findingResolutionSet: explicitResolutionSet(report, next, nextReport),
  }), /PRESERVATION_REGRESSION/);
});

test('VNext-07 détecte REVISION_STALLED si le même finding persiste', () => {
  const { base, itemA, report } = baseWithPlanFinding();
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  const patch = Revision.buildRevisionPatch({
    allowedChangeSet: allowed,
    corrections: [{
      target_type: 'PLAN_ITEM',
      target_id: itemA.plan_item_id,
      finding_ids: [report.findings[0].finding_id],
      correction: 'Tenter la correction.',
    }],
  });

  const baseInfo = makeRevisionBaseInfo(base, report);
  const next = buildArtifacts({
    mode: 'REVISION',
    baseReview: baseInfo,
    repoFixture: { cwd: base.cwd, revision: base.revision },
    planMutators: {
      [base.reqA.requirement_id]: (input) => { input.rationale = 'Tentative de correction.'; },
    },
  });
  const nextItemA = next.planContract.plan_items.find((item) => item.requirement_id === next.reqA.requirement_id);
  const nextReport = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: {
      findings: [semanticFinding('PLAN_ITEM', nextItemA.plan_item_id)],
    },
  });
  assert.equal(nextReport.findings[0].finding_id, report.findings[0].finding_id);

  assert.throws(() => Revision.verifyRevisionOutcome({
    allowedChangeSet: allowed,
    revisionPatch: patch,
    baseArtifacts: base,
    nextArtifacts: next,
    previousReviewReport: report,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    findingResolutionSet: explicitResolutionSet(report, next, nextReport),
  }), /REVISION_STALLED/);
});

test('VNext-07 détecte un nouveau finding bloquant sur un objet préservé', () => {
  const { base, itemA, report } = baseWithPlanFinding();
  const itemB = base.planContract.plan_items.find((item) => item.requirement_id === base.reqB.requirement_id);
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  const patch = Revision.buildRevisionPatch({
    allowedChangeSet: allowed,
    corrections: [{
      target_type: 'PLAN_ITEM',
      target_id: itemA.plan_item_id,
      finding_ids: [report.findings[0].finding_id],
      correction: 'Corriger A.',
    }],
  });

  const baseInfo = makeRevisionBaseInfo(base, report);
  const next = buildArtifacts({
    mode: 'REVISION',
    baseReview: baseInfo,
    repoFixture: { cwd: base.cwd, revision: base.revision },
    planMutators: {
      [base.reqA.requirement_id]: (input) => { input.rationale = 'A corrigé.'; },
    },
  });
  const nextReport = Review.buildReviewReport({
    reviewContext: next.reviewContext,
    semanticReview: {
      findings: [semanticFinding('PLAN_ITEM', itemB.plan_item_id, {
        finding: 'Nouveau défaut sur B.',
        required_correction: 'Modifier B.',
      })],
    },
  });

  assert.throws(() => Revision.verifyRevisionOutcome({
    allowedChangeSet: allowed,
    revisionPatch: patch,
    baseArtifacts: base,
    nextArtifacts: next,
    previousReviewReport: report,
    nextReviewContext: next.reviewContext,
    nextReviewReport: nextReport,
    findingResolutionSet: explicitResolutionSet(report, next, nextReport),
  }), /PRESERVATION_REGRESSION/);
});

test('VNext-07 finding_id reste stable entre INITIAL et REVISION pour le même problème', () => {
  const first = buildArtifacts();
  const firstItem = first.planContract.plan_items.find((item) => item.requirement_id === first.reqA.requirement_id);
  const firstReport = Review.buildReviewReport({
    reviewContext: first.reviewContext,
    semanticReview: { findings: [semanticFinding('PLAN_ITEM', firstItem.plan_item_id)] },
  });

  const baseInfo = makeRevisionBaseInfo(first, firstReport);
  const second = buildArtifacts({ mode: 'REVISION', baseReview: baseInfo, repoFixture: { cwd: first.cwd, revision: first.revision } });
  const secondItem = second.planContract.plan_items.find((item) => item.requirement_id === second.reqA.requirement_id);
  const secondReport = Review.buildReviewReport({
    reviewContext: second.reviewContext,
    semanticReview: { findings: [semanticFinding('PLAN_ITEM', secondItem.plan_item_id)] },
  });

  assert.equal(firstItem.plan_item_id, secondItem.plan_item_id);
  assert.equal(firstReport.findings[0].finding_id, secondReport.findings[0].finding_id);
});

test('VNext-07 le schéma de correction ne permet ni verdict ni path libre', () => {
  const { base, report } = baseWithPlanFinding();
  const allowed = Revision.buildAllowedChangeSet({
    reviewContext: base.reviewContext,
    reviewReport: report,
    requirementRegistry: base.requirementRegistry,
    impactGraph: base.impactGraph,
    candidateManifest: base.candidateManifest,
    planContract: base.planContract,
  });
  const schema = Revision.revisionOutputSchema(allowed);
  const props = schema.properties.corrections.items.properties;
  assert.equal(Object.hasOwn(props, 'verdict'), false);
  assert.equal(Object.hasOwn(props, 'path'), false);
  assert.equal(Object.hasOwn(props, 'replacement'), false);
  assert.ok(props.target_id.enum.length > 0);
});
