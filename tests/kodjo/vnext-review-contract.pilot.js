'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const V = require(path.join(root, 'scripts', 'kodjo', 'lib', 'vnext-contract'));
const SourceManifest = require(path.join(root, 'scripts', 'kodjo', 'lib', 'source-manifest'));
const PlanningEnvelope = require(path.join(root, 'scripts', 'kodjo', 'lib', 'planning-envelope'));
const RequirementRegistry = require(path.join(root, 'scripts', 'kodjo', 'lib', 'requirement-registry'));
const Impact = require(path.join(root, 'scripts', 'kodjo', 'lib', 'impact-graph'));
const Plan = require(path.join(root, 'scripts', 'kodjo', 'lib', 'plan-contract'));
const Ui = require(path.join(root, 'scripts', 'kodjo', 'lib', 'ui-atomicity-contract'));
const Review = require(path.join(root, 'scripts', 'kodjo', 'lib', 'review-contract'));

const H40A = 'a'.repeat(40);
const H40B = 'b'.repeat(40);
const H64A = 'a'.repeat(64);
const H64B = 'b'.repeat(64);
const H64C = 'c'.repeat(64);
const H64D = 'd'.repeat(64);

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function fixtureRepo({ ui = false } = {}) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-review-'));
  git(cwd, 'init');
  git(cwd, 'config', 'user.name', 'KODJO Test');
  git(cwd, 'config', 'user.email', 'kodjo@example.test');

  const sourcePath = ui
    ? 'src/features/example/ExampleScreen.tsx'
    : 'src/core.js';
  const testPath = ui
    ? 'src/features/example/__tests__/ExampleScreen.test.tsx'
    : 'tests/core.test.js';

  write(path.join(cwd, sourcePath), ui
    ? "export const ExampleScreen = () => null;\n"
    : "module.exports = { value: 1 };\n");
  write(path.join(cwd, testPath), ui
    ? "import { ExampleScreen } from '../ExampleScreen'; void ExampleScreen;\n"
    : "const core = require('../src/core'); if (!core) throw new Error('x');\n");

  if (ui) {
    write(
      path.join(cwd, 'src/shared/ui/ExistingOverlay.tsx'),
      "export const ExistingOverlay = () => null;\n",
    );
  }

  git(cwd, 'add', '.');
  git(cwd, 'commit', '-m', 'fixture');
  return {
    cwd,
    revision: git(cwd, 'rev-parse', 'HEAD'),
    sourcePath,
    testPath,
  };
}

function buildFixture({ mode = 'INITIAL', ui = false } = {}) {
  const repo = fixtureRepo({ ui });
  const sourceManifest = SourceManifest.build({
    slice_id: 'V2-VNEXT-06',
    product_head: H40A,
    sources: [{
      source_kind: ui ? 'FIGMA' : 'MARKDOWN',
      authority: ui ? 'VISUAL' : 'FUNCTIONAL',
      locator: ui ? 'figma:G6RY5Ebhgwb4AHIOYDwwvg:510:101' : 'docs/functional.md',
      revision: ui ? 'node-version-1' : H40A,
      fingerprint: H64A,
      units: [{
        locator: ui ? 'node:ExampleScreen' : '§1',
        fingerprint: H64B,
        disposition: 'REQUIREMENT_SOURCE',
      }],
    }],
  });

  const planningEnvelope = PlanningEnvelope.build({
    slice_id: 'V2-VNEXT-06',
    planning_mode: mode,
    baseline_head: H40A,
    product_head: H40A,
    application_head: repo.revision,
    issue_id: 'github_issue:MyUncried/Application-Routine#999',
    source_manifest: sourceManifest,
    base_plan_hash: mode === 'REVISION' ? H64C : null,
    base_review_hash: mode === 'REVISION' ? H64D : null,
    causal_findings: mode === 'REVISION' ? ['FND-causal'] : [],
    created_from: mode === 'REVISION'
      ? { kind: 'PLAN_REVIEW_REVISE', refs: ['issue_comment:2'] }
      : { kind: 'INITIAL_REQUEST', refs: ['issue_comment:1'] },
  });

  const source = sourceManifest.sources[0];
  const requirementRegistry = RequirementRegistry.build({
    planning_envelope_hash: planningEnvelope.contract_hash,
    source_manifest: sourceManifest,
    requirements: [{
      source_id: source.source_id,
      unit_id: source.units[0].unit_id,
      kind: ui ? 'UI' : 'FUNCTIONAL',
      statement: ui
        ? 'Le contrôle respecte le rendu de référence.'
        : 'Le comportement du module est modifié.',
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
  const sourceCandidate = candidateManifest.candidates.find((x) => x.path === repo.sourcePath);
  const testCandidate = candidateManifest.candidates.find((x) => x.path === repo.testPath);
  assert.ok(sourceCandidate);
  assert.ok(testCandidate);

  const directImportScan = Impact.scanOneLevelDirectImporters({
    cwd: repo.cwd,
    candidateManifest,
    modifyCandidateIds: [sourceCandidate.candidate_id],
  });

  const reqId = requirementRegistry.requirements[0].requirement_id;
  const impactGraph = Impact.buildImpactGraph({
    requirementRegistry,
    candidateManifest,
    directImportScan,
    classifications: [
      {
        requirement_id: reqId,
        candidate_id: sourceCandidate.candidate_id,
        change_kind: 'MODIFY',
        impact_reason: 'Le module porte le comportement.',
        dependency_evidence: ['source normative'],
        tests_affected_candidate_ids: [testCandidate.candidate_id],
        preservation_candidate_ids: [],
      },
      {
        requirement_id: reqId,
        candidate_id: testCandidate.candidate_id,
        change_kind: 'MODIFY',
        impact_reason: 'Le test direct est affecté.',
        dependency_evidence: ['test direct'],
        tests_affected_candidate_ids: [],
        preservation_candidate_ids: [],
      },
    ],
  });

  const sourceImpact = impactGraph.impacts.find((x) => x.path === repo.sourcePath);
  const testImpact = impactGraph.impacts.find((x) => x.path === repo.testPath);
  const covered = [sourceImpact.impact_id, testImpact.impact_id].sort();

  const proofObligations = [{
    proof_type: 'FUNCTIONAL_TEST',
    target_test_impact_id: testImpact.impact_id,
    covered_change_impact_ids: covered,
    expected: 'Le test ciblé passe.',
    justification: 'Preuve automatisée du comportement.',
  }];

  if (ui) {
    proofObligations.push({
      proof_type: 'VISUAL_COMPARE',
      target_test_impact_id: null,
      covered_change_impact_ids: covered,
      expected: 'Le rendu correspond à Figma.',
      justification: 'Preuve visuelle.',
    });
  }

  const planContract = Plan.buildPlanContract({
    requirementRegistry,
    impactGraph,
    candidateManifest,
    requirementPlans: [{
      requirement_id: reqId,
      implementation_intents: [
        { impact_id: sourceImpact.impact_id, intent: 'Adapter le module.' },
        { impact_id: testImpact.impact_id, intent: 'Adapter le test.' },
      ],
      test_obligations: [{
        target_impact_id: testImpact.impact_id,
        covered_change_impact_ids: covered,
        expected: 'Le test couvre le changement.',
        justification: 'Test direct.',
      }],
      proof_obligations: proofObligations,
      implementation_constraints: [],
      residual_risks: [],
      rationale: 'Plan de fixture.',
    }],
  });

  let uiAtomicityContract = null;
  if (ui) {
    const planItem = planContract.plan_items[0];
    const visualProof = planItem.proof_obligations.find((x) => x.proof_type === 'VISUAL_COMPARE');
    const overlay = candidateManifest.candidates.find(
      (x) => x.path === 'src/shared/ui/ExistingOverlay.tsx',
    );
    uiAtomicityContract = Ui.buildUiAtomicityContract({
      requirementRegistry,
      impactGraph,
      candidateManifest,
      planContract,
      criteria: [{
        requirement_id: reqId,
        statement: 'Le contrôle visible respecte le rendu de référence.',
        risk_types: ['VISUAL'],
        reuse_search_candidate_ids: [overlay.candidate_id],
        component_decision: 'REUSE',
        selected_component: 'ExistingOverlay',
        selected_component_candidate_id: overlay.candidate_id,
        decision_justification: 'Le composant existant couvre le besoin.',
        change_impact_ids: [sourceImpact.impact_id],
        proof_ids: [visualProof.proof_id],
        assertions: [{
          subject: 'Contrôle principal',
          property_type: 'GEOMETRY',
          expected: 'La géométrie correspond à Figma.',
          proof_ids: [visualProof.proof_id],
          covered_change_impact_ids: [sourceImpact.impact_id],
        }],
      }],
    });
  }

  const reviewContext = Review.buildReviewContext({
    planningEnvelope,
    requirementRegistry,
    impactGraph,
    candidateManifest,
    planContract,
    directImportScan,
    uiAtomicityContract,
  });

  return {
    ...repo,
    planningEnvelope,
    requirementRegistry,
    candidateManifest,
    directImportScan,
    impactGraph,
    planContract,
    uiAtomicityContract,
    reviewContext,
    reqId,
    sourceImpact,
    testImpact,
  };
}

function finding(targetType, targetId, overrides = {}) {
  return {
    category: overrides.category || 'PLAN_GAP',
    target_type: targetType,
    target_id: targetId,
    finding: overrides.finding || 'Le plan ne décrit pas assez précisément la correction.',
    evidence: overrides.evidence || ['plan item inspected'],
    required_correction: overrides.required_correction || 'Préciser le changement attendu.',
    dependency_target_ids: overrides.dependency_target_ids || [],
  };
}

test('VNext-06 INITIAL et REVISION utilisent le même contrat de review', () => {
  const initial = buildFixture({ mode: 'INITIAL' }).reviewContext;
  const revision = buildFixture({ mode: 'REVISION' }).reviewContext;

  assert.equal(initial.schema_version, Review.CONTEXT_SCHEMA);
  assert.equal(revision.schema_version, Review.CONTEXT_SCHEMA);
  assert.equal(initial.planning_mode, 'INITIAL');
  assert.equal(revision.planning_mode, 'REVISION');
  assert.deepEqual(
    initial.mechanical_checks.map((x) => x.check_id),
    revision.mechanical_checks.map((x) => x.check_id),
  );
});

test('VNext-06 sans finding produit APPROVE mécaniquement', () => {
  const fx = buildFixture();
  const report = Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({
    reviewContext: fx.reviewContext,
    semanticReview: { findings: [] },
  }));
  assert.equal(report.verdict, 'APPROVE');
  assert.equal(report.blocking_finding_count, 0);
  assert.deepEqual(report.reentry_stages, []);
  assert.equal(Review.validateReviewReport(report, fx.reviewContext), true);
});

test('VNext-06 un finding bloquant produit REVISE et réentrée calculée', () => {
  const fx = buildFixture();
  const planItem = fx.planContract.plan_items[0];
  const report = Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({
    reviewContext: fx.reviewContext,
    semanticReview: {
      findings: [finding('PLAN_ITEM', planItem.plan_item_id)],
    },
  }));
  assert.equal(report.verdict, 'REVISE');
  assert.equal(report.findings[0].blocking, true);
  assert.equal(report.findings[0].reentry_stage, 'PLAN');
  assert.deepEqual(report.reentry_stages, ['PLAN']);
});

test('VNext-06 PRODUCT_AMBIGUITY produit CLARIFICATION_REQUIRED', () => {
  const fx = buildFixture();
  const report = Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({
    reviewContext: fx.reviewContext,
    semanticReview: {
      findings: [finding('REQUIREMENT', fx.reqId, {
        category: 'PRODUCT_AMBIGUITY',
        finding: 'Deux comportements produit restent possibles.',
        required_correction: 'Obtenir une décision produit explicite.',
      })],
    },
  }));
  assert.equal(report.verdict, 'CLARIFICATION_REQUIRED');
  assert.equal(report.findings[0].reentry_stage, 'USER_DECISION');
});

test('VNext-06 une suggestion seule ne bloque pas APPROVE', () => {
  const fx = buildFixture();
  const report = Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({
    reviewContext: fx.reviewContext,
    semanticReview: {
      findings: [finding('PLAN_CONTRACT', fx.planContract.contract_hash, {
        category: 'SUGGESTION',
        finding: 'Amélioration rédactionnelle facultative.',
        required_correction: 'Aucune correction bloquante.',
      })],
    },
  }));
  assert.equal(report.verdict, 'APPROVE');
  assert.equal(report.findings[0].blocking, false);
  assert.equal(report.findings[0].reentry_stage, 'NONE');
});

test('VNext-06 refuse verdict, blocking, finding_id ou reentry fournis par l’IA', () => {
  const fx = buildFixture();
  for (const extra of [
    { verdict: 'APPROVE' },
    { blocking: false },
    { finding_id: 'FND-forced' },
    { reentry_stage: 'NONE' },
  ]) {
    assert.throws(() => Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({
      reviewContext: fx.reviewContext,
      semanticReview: {
        findings: [{
          ...finding('PLAN_ITEM', fx.planContract.plan_items[0].plan_item_id),
          ...extra,
        }],
      },
    })), /VNEXT_REVIEW_FINDING_KEYS_INVALID/);
  }
});

test('VNext-06 refuse un target_id inventé', () => {
  const fx = buildFixture();
  assert.throws(() => Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({
    reviewContext: fx.reviewContext,
    semanticReview: {
      findings: [finding('PLAN_ITEM', 'PLAN-ffffffffffffffffffffffff')],
    },
  })), /VNEXT_REVIEW_FINDING_TARGET_UNKNOWN/);
});

test('VNext-06 refuse une catégorie associée à un mauvais type de cible', () => {
  const fx = buildFixture();
  assert.throws(() => Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({
    reviewContext: fx.reviewContext,
    semanticReview: {
      findings: [finding('PLAN_ITEM', fx.planContract.plan_items[0].plan_item_id, {
        category: 'MISSING_REQUIREMENT',
      })],
    },
  })), /VNEXT_REVIEW_FINDING_TARGET_TYPE_INCOMPATIBLE/);
});

test('VNext-06 refuse les findings identiques dupliqués', () => {
  const fx = buildFixture();
  const row = finding('PLAN_ITEM', fx.planContract.plan_items[0].plan_item_id);
  assert.throws(() => Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({
    reviewContext: fx.reviewContext,
    semanticReview: { findings: [row, { ...row }] },
  })), /VNEXT_REVIEW_FINDING_DUPLICATE/);
});

test('VNext-06 le schéma reviewer borne les IDs et ne contient aucun verdict libre', () => {
  const fx = buildFixture();
  const schema = Review.reviewerOutputSchema(fx.reviewContext);
  const findingSchema = schema.properties.findings.items;
  assert.ok(findingSchema.properties.target_id.enum.includes(fx.reqId));
  assert.ok(findingSchema.properties.target_id.enum.includes(fx.planContract.contract_hash));
  assert.equal(Object.hasOwn(findingSchema.properties, 'verdict'), false);
  assert.equal(Object.hasOwn(findingSchema.properties, 'blocking'), false);
  assert.equal(Object.hasOwn(findingSchema.properties, 'finding_id'), false);
  assert.equal(Object.hasOwn(findingSchema.properties, 'reentry_stage'), false);
});

test('VNext-06 exécute les validations mécaniques avant de produire le contexte reviewer', () => {
  const fx = buildFixture();
  const broken = structuredClone(fx.planContract);
  broken.plan_items[0].rationale += ' drift';
  assert.throws(() => Review.buildReviewContext({
    planningEnvelope: fx.planningEnvelope,
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: broken,
    directImportScan: fx.directImportScan,
    uiAtomicityContract: null,
  }), /VNEXT_PLAN_CONTRACT_HASH_MISMATCH|VNEXT_PLAN_CONTRACT_REBUILD_MISMATCH/);
});

test('VNext-06 exige le contrat atomique avant review d’un plan UI', () => {
  const fx = buildFixture({ ui: true });
  assert.ok(fx.uiAtomicityContract);
  assert.throws(() => Review.buildReviewContext({
    planningEnvelope: fx.planningEnvelope,
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    directImportScan: fx.directImportScan,
    uiAtomicityContract: null,
  }), /VNEXT_REVIEW_UI_CONTRACT_REQUIRED/);
});

test('VNext-06 accepte des findings ciblant Criterion et Assertion réels', () => {
  const fx = buildFixture({ ui: true });
  const criterion = fx.uiAtomicityContract.criteria[0];
  const assertion = criterion.assertions[0];
  const report = Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({
    reviewContext: fx.reviewContext,
    semanticReview: {
      findings: [
        finding('CRITERION', criterion.criterion_id, {
          category: 'UI_ASSERTION_GAP',
          finding: 'Le critère reste trop agrégé.',
          required_correction: 'Séparer les invariants observables.',
        }),
        finding('ASSERTION', assertion.assertion_id, {
          category: 'UI_ASSERTION_GAP',
          finding: 'La propriété observable doit être précisée.',
          required_correction: 'Rendre l’assertion falsifiable.',
        }),
      ],
    },
  }));
  assert.equal(report.verdict, 'REVISE');
  assert.equal(report.findings.every((x) => x.reentry_stage === 'PLAN'), true);
});

test('VNext-06 finding_id est déterministe et lié au contexte exact', () => {
  const fx = buildFixture();
  const semanticReview = {
    findings: [finding('PLAN_ITEM', fx.planContract.plan_items[0].plan_item_id)],
  };
  const a = Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({ reviewContext: fx.reviewContext, semanticReview }));
  const b = Review.buildReviewReport(require('./helpers/review-attestation-fixture').attested({ reviewContext: fx.reviewContext, semanticReview }));
  assert.equal(a.findings[0].finding_id, b.findings[0].finding_id);
  assert.match(a.findings[0].finding_id, /^FND-[0-9a-f]{24}$/);
});

test('D7 no findings cannot stand in for missing, partial, duplicate or unknown review coverage', () => {
  const fx=buildFixture();
  const full=require('./helpers/review-attestation-fixture').semantic(fx.reviewContext);
  for(const ids of [undefined,[],full.reviewed_target_ids.slice(1),[...full.reviewed_target_ids,full.reviewed_target_ids[0]],[...full.reviewed_target_ids,'unknown']]){
    assert.throws(()=>Review.buildReviewReport({reviewContext:fx.reviewContext,semanticReview:{...full,reviewed_target_ids:ids}}),/VNEXT_REVIEW_/);
  }
  assert.equal(Review.buildReviewReport({reviewContext:fx.reviewContext,semanticReview:full}).verdict,'APPROVE');
});
