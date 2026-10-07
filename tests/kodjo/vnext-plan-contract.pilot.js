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

const H64A = 'a'.repeat(64);
const H64B = 'b'.repeat(64);
const H64C = 'c'.repeat(64);

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function fixtureRepo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-plan-'));
  git(cwd, 'init');
  git(cwd, 'config', 'user.name', 'KODJO Test');
  git(cwd, 'config', 'user.email', 'kodjo@example.test');
  write(path.join(cwd, 'src', 'a.js'), "module.exports = { value: 1 };\n");
  write(path.join(cwd, 'src', 'keep.js'), "module.exports = 'keep';\n");
  write(path.join(cwd, 'tests', 'a.test.js'), "const a = require('../src/a'); if (!a) throw new Error('x');\n");
  write(path.join(cwd, 'tests', 'other.test.js'), "module.exports = true;\n");
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-m', 'fixture');
  return { cwd, revision: git(cwd, 'rev-parse', 'HEAD') };
}

function registry() {
  const manifest = SourceManifest.build({
    slice_id: 'V2-VNEXT-04',
    product_head: 'f'.repeat(40),
    sources: [{
      source_kind: 'MARKDOWN',
      authority: 'FUNCTIONAL',
      locator: 'docs/spec.md',
      revision: 'f'.repeat(40),
      fingerprint: H64A,
      units: [{
        locator: '§1',
        fingerprint: H64B,
        disposition: 'REQUIREMENT_SOURCE',
      }],
    }],
  });
  const source = manifest.sources[0];
  const unit = source.units[0];
  return RequirementRegistry.build({
    planning_envelope_hash: H64C,
    source_manifest: manifest,
    requirements: [{
      source_id: source.source_id,
      unit_id: unit.unit_id,
      kind: 'FUNCTIONAL',
      statement: 'Modifier le comportement A.',
      priority: 'MUST',
      status: 'ACTIVE',
      rationale: 'Exigence de fixture.',
      related_unit_ids: [],
      conflict_unit_ids: [],
    }],
  });
}

function byPath(manifest, file) {
  const hit = manifest.candidates.find((candidate) => candidate.path === file);
  assert.ok(hit, 'candidate absent: ' + file);
  return hit;
}

function impactRow(reqId, candidateId, changeKind, reason, extra = {}) {
  return {
    requirement_id: reqId,
    candidate_id: candidateId,
    change_kind: changeKind,
    impact_reason: reason,
    dependency_evidence: extra.dependency_evidence || (changeKind === 'NO_CHANGE' ? [] : ['fixture evidence']),
    tests_affected_candidate_ids: extra.tests_affected_candidate_ids || [],
    preservation_candidate_ids: extra.preservation_candidate_ids || [],
  };
}

function fixtureContracts(options = {}) {
  const { cwd, revision } = fixtureRepo();
  const requirementRegistry = registry();
  const reqId = requirementRegistry.requirements[0].requirement_id;
  const candidateManifest = Impact.buildCandidateManifest({ cwd, revision });
  const a = byPath(candidateManifest, 'src/a.js');
  const keep = byPath(candidateManifest, 'src/keep.js');
  const testA = byPath(candidateManifest, 'tests/a.test.js');
  const otherTest = byPath(candidateManifest, 'tests/other.test.js');

  const scan = Impact.scanOneLevelDirectImporters({
    cwd,
    candidateManifest,
    modifyCandidateIds: [a.candidate_id],
  });

  const testChangeKind = options.testChangeKind || 'MODIFY';
  const classifications = [
    impactRow(reqId, a.candidate_id, 'MODIFY', 'Le module porte le comportement.', {
      tests_affected_candidate_ids: options.affectedMissing ? [otherTest.candidate_id] : [testA.candidate_id],
      preservation_candidate_ids: options.preserveChanged ? [a.candidate_id] : [keep.candidate_id],
    }),
    impactRow(reqId, testA.candidate_id, testChangeKind, 'Le test direct couvre le comportement.'),
  ];
  const impactGraph = Impact.buildImpactGraph({
    requirementRegistry,
    candidateManifest,
    directImportScan: scan,
    classifications,
  });

  const rootImpact = impactGraph.impacts.find((impact) => impact.path === 'src/a.js');
  const testImpact = impactGraph.impacts.find((impact) => impact.path === 'tests/a.test.js');
  return {
    cwd,
    revision,
    requirementRegistry,
    candidateManifest,
    impactGraph,
    reqId,
    rootImpact,
    testImpact,
    keep,
    otherTest,
  };
}

function validRequirementPlan(fx) {
  const changed = [fx.rootImpact.impact_id, fx.testImpact.impact_id].sort();
  return {
    requirement_id: fx.reqId,
    implementation_intents: [
      { impact_id: fx.rootImpact.impact_id, intent: 'Adapter le comportement du module A.' },
      { impact_id: fx.testImpact.impact_id, intent: 'Adapter le test de régression associé.' },
    ],
    test_obligations: [{
      target_impact_id: fx.testImpact.impact_id,
      covered_change_impact_ids: changed,
      expected: 'Le test vérifie le comportement modifié.',
      justification: 'Test automatisé direct du comportement.',
    }],
    proof_obligations: [{
      proof_type: 'FUNCTIONAL_TEST',
      target_test_impact_id: fx.testImpact.impact_id,
      covered_change_impact_ids: changed,
      expected: 'Le test ciblé passe.',
      justification: 'Preuve fonctionnelle automatisée.',
    }],
    implementation_constraints: ['Conserver le contrat public existant hors exigence.'],
    residual_risks: [],
    rationale: 'Le plan réalise exactement l’exigence et son test direct.',
  };
}

test('VNext-04 construit la chaîne Requirement → Impact → Change → Test → Proof → Boundary', () => {
  const fx = fixtureContracts();
  const plan = Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [validRequirementPlan(fx)],
  });

  assert.equal(plan.schema_version, Plan.SCHEMA);
  assert.equal(plan.plan_item_count, 1);
  const item = plan.plan_items[0];
  assert.equal(item.requirement_id, fx.reqId);
  assert.equal(item.disposition, 'CHANGE');
  assert.equal(item.impact_ids.length, 2);
  assert.equal(item.change_items.length, 2);
  assert.equal(item.test_obligations.length, 1);
  assert.equal(item.proof_obligations.length, 1);
  assert.deepEqual(item.test_obligations[0].covered_change_impact_ids, item.change_items.map((x) => x.impact_id).sort());
  assert.deepEqual(item.proof_obligations[0].covered_change_impact_ids, item.change_items.map((x) => x.impact_id).sort());
  assert.equal(plan.boundaries.write_scope.length, 2);
  assert.deepEqual(plan.boundaries.write_scope.map((x) => x.path).sort(), ['src/a.js', 'tests/a.test.js']);
  assert.deepEqual(plan.boundaries.preserve_scope.map((x) => x.path), ['src/keep.js']);
  assert.equal(plan.boundaries.forbidden_policy, 'ALL_OUTSIDE_WRITE_SCOPE');
  assert.equal(Plan.validatePlanContract(plan, {
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
  }), true);
});

test('VNext-04 dérive les paths exclusivement depuis ImpactGraph', () => {
  const fx = fixtureContracts();
  const input = validRequirementPlan(fx);
  input.path = 'src/invented.js';
  assert.throws(() => Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [input],
  }), /VNEXT_PLAN_REQUIREMENT_PLAN_KEYS_INVALID/);
});

test('VNext-04 refuse un changement sans implementation intent', () => {
  const fx = fixtureContracts();
  const input = validRequirementPlan(fx);
  input.implementation_intents = input.implementation_intents.slice(0, 1);
  assert.throws(() => Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [input],
  }), /VNEXT_PLAN_IMPLEMENTATION_INTENT_MISSING/);
});

test('VNext-04 refuse un changement non couvert par un test', () => {
  const fx = fixtureContracts();
  const input = validRequirementPlan(fx);
  input.test_obligations[0].covered_change_impact_ids = [fx.testImpact.impact_id];
  assert.throws(() => Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [input],
  }), /VNEXT_PLAN_CHANGE_WITHOUT_TEST_COVERAGE/);
});

test('VNext-04 refuse un changement non couvert par une preuve', () => {
  const fx = fixtureContracts();
  const input = validRequirementPlan(fx);
  input.proof_obligations[0].covered_change_impact_ids = [fx.testImpact.impact_id];
  assert.throws(() => Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [input],
  }), /VNEXT_PLAN_CHANGE_WITHOUT_PROOF_COVERAGE/);
});

test('VNext-04 refuse un test affecté qui n’a pas son propre impact', () => {
  const fx = fixtureContracts({ affectedMissing: true });
  const input = validRequirementPlan(fx);
  assert.throws(() => Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [input],
  }), /VNEXT_PLAN_AFFECTED_TEST_IMPACT_MISSING/);
});

test('VNext-04 refuse une preuve FUNCTIONAL_TEST qui ne correspond pas au test déclaré', () => {
  const fx = fixtureContracts();
  const input = validRequirementPlan(fx);
  input.proof_obligations[0].target_test_impact_id = fx.rootImpact.impact_id;
  assert.throws(() => Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [input],
  }), /VNEXT_PLAN_FUNCTIONAL_PROOF_TEST_UNKNOWN/);
});

test('VNext-04 exige une preuve alternative pour un test supprimé', () => {
  const fx = fixtureContracts({ testChangeKind: 'DELETE' });
  const input = validRequirementPlan(fx);
  assert.throws(() => Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [input],
  }), /VNEXT_PLAN_FUNCTIONAL_PROOF_REMOVE_FORBIDDEN/);

  input.proof_obligations = [{
    proof_type: 'STATIC_ANALYSIS',
    target_test_impact_id: null,
    covered_change_impact_ids: [fx.rootImpact.impact_id, fx.testImpact.impact_id].sort(),
    expected: 'Le test obsolète est supprimé et aucune référence ne subsiste.',
    justification: 'La suppression ne peut pas être prouvée en exécutant le test supprimé.',
  }];
  const plan = Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [input],
  });
  assert.equal(plan.plan_items[0].test_obligations[0].action, 'REMOVE');
});

test('VNext-04 refuse une boundary à la fois CHANGE et PRESERVE', () => {
  const fx = fixtureContracts({ preserveChanged: true });
  assert.throws(() => Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [validRequirementPlan(fx)],
  }), /VNEXT_PLAN_BOUNDARY_CHANGE_PRESERVE_CONFLICT/);
});

test('VNext-04 exige un plan item pour chaque requirement', () => {
  const fx = fixtureContracts();
  assert.throws(() => Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [],
  }), /VNEXT_PLAN_REQUIREMENT_UNCOVERED/);
});

test('VNext-04 supporte un requirement NO_CHANGE avec testability explicite', () => {
  const { cwd, revision } = fixtureRepo();
  const requirementRegistry = registry();
  const reqId = requirementRegistry.requirements[0].requirement_id;
  const candidateManifest = Impact.buildCandidateManifest({ cwd, revision });
  const impactGraph = Impact.buildImpactGraph({
    requirementRegistry,
    candidateManifest,
    classifications: [{
      requirement_id: reqId,
      candidate_id: null,
      change_kind: 'NO_CHANGE',
      impact_reason: 'Le comportement est déjà conforme.',
      dependency_evidence: [],
      tests_affected_candidate_ids: [],
      preservation_candidate_ids: [],
    }],
  });
  const plan = Plan.buildPlanContract({
    requirementRegistry,
    impactGraph,
    candidateManifest,
    requirementPlans: [{
      requirement_id: reqId,
      implementation_intents: [],
      test_obligations: [{
        target_impact_id: null,
        covered_change_impact_ids: [],
        expected: 'Aucun changement de code à tester.',
        justification: 'L’exigence est déjà satisfaite au HEAD analysé.',
      }],
      proof_obligations: [{
        proof_type: 'STATIC_ANALYSIS',
        target_test_impact_id: null,
        covered_change_impact_ids: [],
        expected: 'Le comportement existant correspondant est identifié.',
        justification: 'Preuve suffisante pour le constat NO_CHANGE.',
      }],
      implementation_constraints: [],
      residual_risks: [],
      rationale: 'Aucune modification n’est nécessaire.',
    }],
  });
  assert.equal(plan.plan_items[0].disposition, 'NO_CHANGE');
  assert.equal(plan.plan_items[0].change_items.length, 0);
  assert.equal(plan.boundaries.write_scope.length, 0);
});

test('VNext-04 génère une projection Markdown déterministe du seul contrat canonique', () => {
  const fx = fixtureContracts();
  const plan = Plan.buildPlanContract({
    requirementRegistry: fx.requirementRegistry,
    impactGraph: fx.impactGraph,
    candidateManifest: fx.candidateManifest,
    requirementPlans: [validRequirementPlan(fx)],
  });
  const a = Plan.renderMarkdown(plan);
  const b = Plan.renderMarkdown(plan);
  assert.equal(a, b);
  assert.match(a, /<KODJO_VNEXT_PLAN_CONTRACT_JSON>/);
  assert.match(a, new RegExp(plan.contract_hash));
  assert.equal(Plan.verifyMarkdownProjection(a, plan), true);
  assert.throws(() => Plan.verifyMarkdownProjection(a + '\nextra', plan), /VNEXT_PLAN_MARKDOWN_PROJECTION_DRIFT/);
});
