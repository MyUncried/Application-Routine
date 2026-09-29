'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const SourceManifest = require(path.join(root, 'scripts', 'kodjo', 'lib', 'source-manifest'));
const RequirementRegistry = require(path.join(root, 'scripts', 'kodjo', 'lib', 'requirement-registry'));
const Impact = require(path.join(root, 'scripts', 'kodjo', 'lib', 'impact-graph'));
const Plan = require(path.join(root, 'scripts', 'kodjo', 'lib', 'plan-contract'));
const Ui = require(path.join(root, 'scripts', 'kodjo', 'lib', 'ui-atomicity-contract'));

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

function fixtureRepo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-ui-'));
  git(cwd, 'init');
  git(cwd, 'config', 'user.name', 'KODJO Test');
  git(cwd, 'config', 'user.email', 'kodjo@example.test');

  write(path.join(cwd, 'src', 'features', 'example', 'ExampleScreen.tsx'),
    "export const ExampleScreen = () => null;\n");
  write(path.join(cwd, 'src', 'features', 'example', '__tests__', 'ExampleScreen.test.tsx'),
    "import { ExampleScreen } from '../ExampleScreen'; void ExampleScreen;\n");
  write(path.join(cwd, 'src', 'shared', 'ui', 'ExistingOverlay.tsx'),
    "export const ExistingOverlay = () => null;\n");
  write(path.join(cwd, 'src', 'shared', 'ui', 'OtherControl.tsx'),
    "export const OtherControl = () => null;\n");

  git(cwd, 'add', '.');
  git(cwd, 'commit', '-m', 'fixture');
  return { cwd, revision: git(cwd, 'rev-parse', 'HEAD') };
}

function buildRegistry({ visualAuthority = 'VISUAL', includeFunctional = false } = {}) {
  const sources = [{
    source_kind: visualAuthority === 'VISUAL' ? 'FIGMA' : 'MARKDOWN',
    authority: visualAuthority,
    locator: visualAuthority === 'VISUAL' ? 'figma:G6RY5Ebhgwb4AHIOYDwwvg:510:101' : 'docs/ui.md',
    revision: visualAuthority === 'VISUAL' ? 'node-version-1' : 'f'.repeat(40),
    fingerprint: H64A,
    units: [{
      locator: visualAuthority === 'VISUAL' ? 'node:ExampleScreen' : '§ visual',
      fingerprint: H64B,
      disposition: 'REQUIREMENT_SOURCE',
    }],
  }];

  if (includeFunctional) {
    sources.push({
      source_kind: 'MARKDOWN',
      authority: 'FUNCTIONAL',
      locator: 'docs/functional.md',
      revision: 'f'.repeat(40),
      fingerprint: H64C,
      units: [{
        locator: '§ interaction',
        fingerprint: H64D,
        disposition: 'REQUIREMENT_SOURCE',
      }],
    });
  }

  const manifest = SourceManifest.build({
    slice_id: 'V2-VNEXT-05',
    product_head: 'f'.repeat(40),
    sources,
  });

  const requirements = [];
  const visualSource = manifest.sources[0];
  requirements.push({
    source_id: visualSource.source_id,
    unit_id: visualSource.units[0].unit_id,
    kind: 'UI',
    statement: 'Le contrôle doit respecter le rendu de référence.',
    priority: 'MUST',
    status: 'ACTIVE',
    rationale: 'Exigence UI visuelle.',
    related_unit_ids: [],
    conflict_unit_ids: [],
  });

  if (includeFunctional) {
    const functionalSource = manifest.sources[1];
    requirements.push({
      source_id: functionalSource.source_id,
      unit_id: functionalSource.units[0].unit_id,
      kind: 'UI',
      statement: 'Le contrôle doit réagir à l’appui.',
      priority: 'MUST',
      status: 'ACTIVE',
      rationale: 'Exigence UI comportementale.',
      related_unit_ids: [],
      conflict_unit_ids: [],
    });
  }

  return RequirementRegistry.build({
    planning_envelope_hash: 'e'.repeat(64),
    source_manifest: manifest,
    requirements,
  });
}

function byPath(manifest, file) {
  const hit = manifest.candidates.find((candidate) => candidate.path === file);
  assert.ok(hit, 'candidate absent: ' + file);
  return hit;
}

function buildFixture(options = {}) {
  const { cwd, revision } = fixtureRepo();
  const requirementRegistry = buildRegistry(options);
  const candidateManifest = Impact.buildCandidateManifest({ cwd, revision });

  const screen = byPath(candidateManifest, 'src/features/example/ExampleScreen.tsx');
  const screenTest = byPath(candidateManifest, 'src/features/example/__tests__/ExampleScreen.test.tsx');
  const overlay = byPath(candidateManifest, 'src/shared/ui/ExistingOverlay.tsx');
  const other = byPath(candidateManifest, 'src/shared/ui/OtherControl.tsx');

  const scan = Impact.scanOneLevelDirectImporters({
    cwd,
    candidateManifest,
    modifyCandidateIds: [screen.candidate_id],
  });

  const classifications = [];
  for (const requirement of requirementRegistry.requirements) {
    classifications.push({
      requirement_id: requirement.requirement_id,
      candidate_id: screen.candidate_id,
      change_kind: 'MODIFY',
      impact_reason: 'Écran UI concerné.',
      dependency_evidence: ['source UI'],
      tests_affected_candidate_ids: [screenTest.candidate_id],
      preservation_candidate_ids: [],
    });
    classifications.push({
      requirement_id: requirement.requirement_id,
      candidate_id: screenTest.candidate_id,
      change_kind: 'MODIFY',
      impact_reason: 'Test UI direct concerné.',
      dependency_evidence: ['test direct'],
      tests_affected_candidate_ids: [],
      preservation_candidate_ids: [],
    });
  }

  const impactGraph = Impact.buildImpactGraph({
    requirementRegistry,
    candidateManifest,
    directImportScan: scan,
    classifications,
  });

  const requirementPlans = requirementRegistry.requirements.map((requirement) => {
    const impacts = impactGraph.impacts.filter((impact) => impact.requirement_id === requirement.requirement_id);
    const screenImpact = impacts.find((impact) => impact.path.endsWith('ExampleScreen.tsx') && !impact.path.includes('__tests__'));
    const testImpact = impacts.find((impact) => impact.path.includes('__tests__'));
    const covered = [screenImpact.impact_id, testImpact.impact_id].sort();

    const proofs = [{
      proof_type: 'FUNCTIONAL_TEST',
      target_test_impact_id: testImpact.impact_id,
      covered_change_impact_ids: covered,
      expected: 'Le test UI ciblé passe.',
      justification: 'Preuve automatisée du comportement observable.',
    }];

    if (requirement.source.authority === 'VISUAL') {
      proofs.push({
        proof_type: 'VISUAL_COMPARE',
        target_test_impact_id: null,
        covered_change_impact_ids: covered,
        expected: 'Le rendu correspond à la référence Figma.',
        justification: 'Preuve visuelle requise.',
      });
      proofs.push({
        proof_type: 'DEVICE_CHECK',
        target_test_impact_id: null,
        covered_change_impact_ids: covered,
        expected: 'Le rendu est confirmé sur device.',
        justification: 'Preuve device requise.',
      });
    }

    return {
      requirement_id: requirement.requirement_id,
      implementation_intents: [
        { impact_id: screenImpact.impact_id, intent: 'Adapter l’écran conformément à l’exigence.' },
        { impact_id: testImpact.impact_id, intent: 'Adapter le test UI direct.' },
      ],
      test_obligations: [{
        target_impact_id: testImpact.impact_id,
        covered_change_impact_ids: covered,
        expected: 'Le test couvre le changement UI.',
        justification: 'Test direct de l’écran.',
      }],
      proof_obligations: proofs,
      implementation_constraints: [],
      residual_risks: [],
      rationale: 'Plan UI lié à l’exigence source-first.',
    };
  });

  const planContract = Plan.buildPlanContract({
    requirementRegistry,
    impactGraph,
    candidateManifest,
    requirementPlans,
  });

  return {
    cwd,
    revision,
    requirementRegistry,
    candidateManifest,
    impactGraph,
    planContract,
    screen,
    screenTest,
    overlay,
    other,
  };
}

function planItemFor(fx, requirement) {
  return fx.planContract.plan_items.find((item) => item.requirement_id === requirement.requirement_id);
}

function visualCriterion(fx) {
  const requirement = fx.requirementRegistry.requirements.find((row) => row.source.authority === 'VISUAL');
  const planItem = planItemFor(fx, requirement);
  const screenChange = planItem.change_items.find((row) => row.path.endsWith('ExampleScreen.tsx') && !row.path.includes('__tests__'));
  const visualProof = planItem.proof_obligations.find((row) => row.proof_type === 'VISUAL_COMPARE');
  const deviceProof = planItem.proof_obligations.find((row) => row.proof_type === 'DEVICE_CHECK');

  return {
    requirement_id: requirement.requirement_id,
    statement: 'Le contrôle visible respecte le rendu de référence.',
    risk_types: ['VISUAL', 'DEVICE'],
    reuse_search_candidate_ids: [fx.overlay.candidate_id, fx.other.candidate_id],
    component_decision: 'REUSE',
    selected_component: 'ExistingOverlay',
    selected_component_candidate_id: fx.overlay.candidate_id,
    decision_justification: 'Le composant existant couvre le besoin sans duplication.',
    change_impact_ids: [screenChange.impact_id],
    proof_ids: [visualProof.proof_id, deviceProof.proof_id],
    assertions: [
      {
        subject: 'Contrôle principal',
        property_type: 'CONTENT',
        expected: 'Le contenu attendu est visible.',
        proof_ids: [visualProof.proof_id],
        covered_change_impact_ids: [screenChange.impact_id],
      },
      {
        subject: 'Contrôle principal',
        property_type: 'GEOMETRY',
        expected: 'La géométrie correspond à la référence Figma.',
        proof_ids: [visualProof.proof_id, deviceProof.proof_id],
        covered_change_impact_ids: [screenChange.impact_id],
      },
    ],
  };
}

function functionalCriterion(fx) {
  const requirement = fx.requirementRegistry.requirements.find((row) => row.source.authority === 'FUNCTIONAL');
  const planItem = planItemFor(fx, requirement);
  const screenChange = planItem.change_items.find((row) => row.path.endsWith('ExampleScreen.tsx') && !row.path.includes('__tests__'));
  const functionalProof = planItem.proof_obligations.find((row) => row.proof_type === 'FUNCTIONAL_TEST');

  return {
    requirement_id: requirement.requirement_id,
    statement: 'Le contrôle réagit à l’appui conformément à la règle fonctionnelle.',
    risk_types: ['FUNCTIONAL'],
    reuse_search_candidate_ids: [fx.overlay.candidate_id],
    component_decision: 'EXTEND',
    selected_component: 'ExistingOverlay',
    selected_component_candidate_id: fx.overlay.candidate_id,
    decision_justification: 'Le composant existant est étendu sans créer un doublon.',
    change_impact_ids: [screenChange.impact_id],
    proof_ids: [functionalProof.proof_id],
    assertions: [{
      subject: 'Contrôle principal',
      property_type: 'INTERACTION',
      expected: 'L’appui déclenche le comportement attendu.',
      proof_ids: [functionalProof.proof_id],
      covered_change_impact_ids: [screenChange.impact_id],
    }],
  };
}

test('VNext-05 construit Requirement → Criterion → Atomic Assertions avec IDs mécaniques', () => {
  const fx = buildFixture();
  const contract = Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [visualCriterion(fx)],
  });

  assert.equal(contract.schema_version, Ui.SCHEMA);
  assert.equal(contract.ui_applicable, true);
  assert.equal(contract.criterion_count, 1);
  assert.equal(contract.assertion_count, 2);
  assert.match(contract.criteria[0].criterion_id, /^CRT-[0-9a-f]{24}$/);
  for (const assertion of contract.criteria[0].assertions) {
    assert.match(assertion.assertion_id, /^AST-[0-9a-f]{24}$/);
  }
  assert.equal(Ui.validateUiAtomicityContract(contract, {
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
  }), true);
});

test('VNext-05 refuse les IDs de critère fournis par l’IA', () => {
  const fx = buildFixture();
  const criterion = visualCriterion(fx);
  criterion.criterion_id = 'UI-001';
  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }), /VNEXT_UI_CRITERION_KEYS_INVALID/);
});

test('VNext-05 impose VISUAL_COMPARE aux propriétés visuelles', () => {
  const fx = buildFixture();
  const criterion = visualCriterion(fx);
  const planItem = planItemFor(fx, fx.requirementRegistry.requirements[0]);
  const deviceProof = planItem.proof_obligations.find((row) => row.proof_type === 'DEVICE_CHECK');
  criterion.assertions[1].proof_ids = [deviceProof.proof_id];

  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }), /VNEXT_UI_ASSERTION_PROOF_INVALID/);
});

test('VNext-05 interdit une propriété visuelle sans source VISUAL ou DECISION', () => {
  const fx = buildFixture({ visualAuthority: 'FUNCTIONAL' });
  const requirement = fx.requirementRegistry.requirements[0];
  const planItem = planItemFor(fx, requirement);
  const screenChange = planItem.change_items.find((row) => !row.path.includes('__tests__'));
  const functionalProof = planItem.proof_obligations.find((row) => row.proof_type === 'FUNCTIONAL_TEST');

  const criterion = {
    requirement_id: requirement.requirement_id,
    statement: 'Critère visuel mal sourcé.',
    risk_types: ['FUNCTIONAL'],
    reuse_search_candidate_ids: [fx.overlay.candidate_id],
    component_decision: 'REUSE',
    selected_component: 'ExistingOverlay',
    selected_component_candidate_id: fx.overlay.candidate_id,
    decision_justification: 'Fixture.',
    change_impact_ids: [screenChange.impact_id],
    proof_ids: [functionalProof.proof_id],
    assertions: [{
      subject: 'Contrôle',
      property_type: 'GEOMETRY',
      expected: 'Géométrie précise.',
      proof_ids: [functionalProof.proof_id],
      covered_change_impact_ids: [screenChange.impact_id],
    }],
  };

  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }), /VNEXT_UI_ASSERTION_PROOF_INVALID|VNEXT_UI_ASSERTION_VISUAL_SOURCE_INVALID/);
});

test('VNext-05 accepte INTERACTION uniquement avec source fonctionnelle et preuve fonctionnelle', () => {
  const fx = buildFixture({ includeFunctional: true });
  const contract = Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [visualCriterion(fx), functionalCriterion(fx)],
  });
  const interaction = contract.criteria
    .flatMap((criterion) => criterion.assertions)
    .find((assertion) => assertion.property_type === 'INTERACTION');
  assert.ok(interaction);
  assert.deepEqual(interaction.proof_required, ['FUNCTIONAL_TEST']);
  assert.equal(interaction.source.authority, 'FUNCTIONAL');
});

test('VNext-05 interdit une preuve d’assertion absente du critère parent', () => {
  const fx = buildFixture();
  const criterion = visualCriterion(fx);
  const planItem = planItemFor(fx, fx.requirementRegistry.requirements[0]);
  const functionalProof = planItem.proof_obligations.find((row) => row.proof_type === 'FUNCTIONAL_TEST');
  criterion.assertions[0].proof_ids = [functionalProof.proof_id];

  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }), /VNEXT_UI_ASSERTION_PROOF_OUTSIDE_CRITERION/);
});

test('VNext-05 exige que chaque preuve du critère soit allouée à une assertion', () => {
  const fx = buildFixture();
  const criterion = visualCriterion(fx);
  const visualProofId = criterion.assertions[0].proof_ids[0];
  criterion.assertions[1].proof_ids = [visualProofId];

  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }), /VNEXT_UI_ASSERTION_PROOF_COVERAGE_INCOMPLETE/);
});

test('VNext-05 exige que les assertions couvrent tous les changements du critère', () => {
  const fx = buildFixture();
  const criterion = visualCriterion(fx);
  criterion.assertions[0].covered_change_impact_ids = [];
  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }), /VNEXT_UI_ASSERTION_CHANGE_COVERAGE_INVALID|VNEXT_UI_ASSERTION_CHANGE_COVERAGE_INCOMPLETE/);
});

test('VNext-05 exige que chaque changement UI soit couvert par un critère', () => {
  const fx = buildFixture({ includeFunctional: true });
  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [visualCriterion(fx)],
  }), /VNEXT_UI_CRITERION_MISSING/);
});

test('VNext-05 refuse qu’un requirement non-UI porte silencieusement un changement UI', () => {
  const fx = buildFixture();
  const changedRegistry = structuredClone(fx.requirementRegistry);
  changedRegistry.requirements[0].kind = 'FUNCTIONAL';
  const unsigned = structuredClone(changedRegistry);
  delete unsigned.contract_hash;
  const V = require(path.join(root, 'scripts', 'kodjo', 'lib', 'vnext-contract'));
  changedRegistry.contract_hash = V.canonicalHash(unsigned);

  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: changedRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [],
  }), /VNEXT_PLAN_REQUIREMENT_REGISTRY_HASH_MISMATCH|VNEXT_UI_REQUIREMENT_MISSING_FOR_UI_CHANGE/);
});

test('VNext-05 limite la recherche de réutilisation aux candidats UI', () => {
  const fx = buildFixture();
  const criterion = visualCriterion(fx);
  criterion.reuse_search_candidate_ids = [fx.screenTest.candidate_id];
  criterion.selected_component_candidate_id = fx.screenTest.candidate_id;

  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }), /VNEXT_UI_REUSE_CANDIDATE_NOT_UI/);
});

test('VNext-05 impose une recherche de réutilisation et lie REUSE/EXTEND au candidat sélectionné', () => {
  const fx = buildFixture();
  const criterion = visualCriterion(fx);
  criterion.selected_component_candidate_id = fx.screen.candidate_id;

  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }), /VNEXT_UI_SELECTED_COMPONENT_NOT_SEARCHED/);

  criterion.selected_component_candidate_id = fx.overlay.candidate_id;
  criterion.reuse_search_candidate_ids = [];
  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }), /VNEXT_UI_REUSE_SEARCH_INVALID/);
});

test('VNext-05 CREATE ne peut pas prétendre réutiliser un composant existant', () => {
  const fx = buildFixture();
  const criterion = visualCriterion(fx);
  criterion.component_decision = 'CREATE';
  criterion.selected_component = 'NewOverlay';
  assert.throws(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }), /VNEXT_UI_CREATE_EXISTING_COMPONENT_FORBIDDEN/);

  criterion.selected_component_candidate_id = null;
  assert.doesNotThrow(() => Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [criterion],
  }));
});

test('VNext-05 lie le contrat atomique au PlanContract exact', () => {
  const fx = buildFixture();
  const contract = Ui.buildUiAtomicityContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: fx.planContract,
    criteria: [visualCriterion(fx)],
  });
  const changedPlan = structuredClone(fx.planContract);
  changedPlan.plan_items[0].rationale += ' drift';
  const V = require(path.join(root, 'scripts', 'kodjo', 'lib', 'vnext-contract'));
  const unsigned = structuredClone(changedPlan);
  delete unsigned.contract_hash;
  changedPlan.contract_hash = V.canonicalHash(unsigned);

  assert.throws(() => Ui.validateUiAtomicityContract(contract, {
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    planContract: changedPlan,
  }), /VNEXT_PLAN_CONTRACT_REBUILD_MISMATCH|VNEXT_UI_PLAN_CONTRACT_HASH_MISMATCH/);
});

test('VNext-05 ne réintroduit aucune dérivation Requirement depuis Criterion/Assertion', () => {
  const code = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'lib', 'ui-atomicity-contract.js'), 'utf8');
  const reqCode = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'lib', 'requirement-registry.js'), 'utf8');
  assert.match(code, /RequirementRegistry\.assertReady/);
  assert.match(code, /requirement_id/);
  assert.doesNotMatch(reqCode, /ui-atomicity-contract|criterion_id|assertion_id/);
});
