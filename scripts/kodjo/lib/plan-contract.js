'use strict';

const V = require('./vnext-contract');
const RequirementRegistry = require('./requirement-registry');
const Impact = require('./impact-graph');

const SCHEMA = 'kodjo.vnext.plan-contract.v1';
const DISPOSITIONS = Object.freeze(['CHANGE', 'NO_CHANGE']);
const PROOF_TYPES = Object.freeze([
  'FUNCTIONAL_TEST',
  'STATIC_ANALYSIS',
  'VISUAL_COMPARE',
  'ACCESSIBILITY_CHECK',
  'DEVICE_CHECK',
]);
const TEST_ACTIONS = Object.freeze([
  'RUN_EXISTING',
  'ADAPT',
  'CREATE',
  'REMOVE',
  'NONE_WITH_JUSTIFICATION',
]);
const FORBIDDEN_POLICY = 'ALL_OUTSIDE_WRITE_SCOPE';

function isTestPath(value) {
  return typeof value === 'string'
    && (/(?:^|\/)(?:__tests__|tests?)\//.test(value) || /\.(?:test|spec)\.[^.]+$/.test(value));
}

function uniqueIds(values, code, label, { allowEmpty = false } = {}) {
  return V.uniqueStrings(values, code, label, { allowEmpty });
}

function impactIndex(impactGraph) {
  if (!impactGraph || !Array.isArray(impactGraph.impacts)) V.fail('VNEXT_PLAN_IMPACT_GRAPH_INVALID');
  const byId = new Map();
  const byRequirement = new Map();
  for (const impact of impactGraph.impacts) {
    if (byId.has(impact.impact_id)) V.fail('VNEXT_PLAN_IMPACT_ID_DUPLICATE', impact.impact_id);
    byId.set(impact.impact_id, impact);
    const list = byRequirement.get(impact.requirement_id) || [];
    list.push(impact);
    byRequirement.set(impact.requirement_id, list);
  }
  for (const list of byRequirement.values()) {
    list.sort((a, b) => a.impact_id.localeCompare(b.impact_id));
  }
  return { byId, byRequirement };
}

function candidateIndex(candidateManifest) {
  Impact.validateCandidateManifest(candidateManifest);
  return new Map(candidateManifest.candidates.map((candidate) => [candidate.candidate_id, candidate]));
}

function derivedTestAction(impact) {
  if (impact.change_kind === 'NO_CHANGE') return 'RUN_EXISTING';
  if (impact.change_kind === 'MODIFY') return 'ADAPT';
  if (impact.change_kind === 'CREATE') return 'CREATE';
  if (impact.change_kind === 'DELETE') return 'REMOVE';
  V.fail('VNEXT_PLAN_TEST_IMPACT_CHANGE_KIND_INVALID', impact.change_kind);
}

function normalizeImplementationIntents(rows, requirementId, changedImpacts) {
  if (!Array.isArray(rows)) V.fail('VNEXT_PLAN_IMPLEMENTATION_INTENTS_INVALID', requirementId);
  const changedById = new Map(changedImpacts.map((impact) => [impact.impact_id, impact]));
  const seen = new Set();
  const normalized = rows.map((row, index) => {
    V.assertExactKeys(row, ['impact_id', 'intent'], [], 'VNEXT_PLAN_IMPLEMENTATION_INTENT_KEYS_INVALID');
    const impact = changedById.get(row.impact_id);
    if (!impact) V.fail('VNEXT_PLAN_IMPLEMENTATION_INTENT_IMPACT_INVALID', row.impact_id);
    if (seen.has(row.impact_id)) V.fail('VNEXT_PLAN_IMPLEMENTATION_INTENT_DUPLICATE', row.impact_id);
    seen.add(row.impact_id);
    V.assertUnicodeExactText(
      row.intent,
      'VNEXT_PLAN_IMPLEMENTATION_INTENT_TEXT_INVALID',
      `implementation_intents[${index}].intent`,
    );
    return { impact_id: row.impact_id, intent: row.intent };
  });
  if (seen.size !== changedById.size) {
    const missing = [...changedById.keys()].filter((id) => !seen.has(id));
    V.fail('VNEXT_PLAN_IMPLEMENTATION_INTENT_MISSING', missing.join(','));
  }
  return normalized.sort((a, b) => a.impact_id.localeCompare(b.impact_id));
}

function normalizeTestObligations(rows, requirementId, requirementImpacts) {
  if (!Array.isArray(rows) || rows.length === 0) {
    V.fail('VNEXT_PLAN_TEST_OBLIGATIONS_EMPTY', requirementId);
  }
  const impactById = new Map(requirementImpacts.map((impact) => [impact.impact_id, impact]));
  const changedImpactIds = new Set(
    requirementImpacts
      .filter((impact) => ['MODIFY', 'CREATE', 'DELETE'].includes(impact.change_kind))
      .map((impact) => impact.impact_id),
  );
  const seenTargets = new Set();
  const normalized = rows.map((row, index) => {
    V.assertExactKeys(
      row,
      ['target_impact_id', 'covered_change_impact_ids', 'expected', 'justification'],
      [],
      'VNEXT_PLAN_TEST_OBLIGATION_KEYS_INVALID',
    );
    V.assertUnicodeExactText(
      row.expected,
      'VNEXT_PLAN_TEST_EXPECTED_INVALID',
      `test_obligations[${index}].expected`,
    );
    V.assertUnicodeExactText(
      row.justification,
      'VNEXT_PLAN_TEST_JUSTIFICATION_INVALID',
      `test_obligations[${index}].justification`,
    );

    const coveredChangeImpactIds = uniqueIds(
      row.covered_change_impact_ids,
      'VNEXT_PLAN_TEST_COVERAGE_INVALID',
      `test_obligations[${index}].covered_change_impact_ids`,
      { allowEmpty: changedImpactIds.size === 0 },
    ).sort();
    for (const impactId of coveredChangeImpactIds) {
      if (!changedImpactIds.has(impactId)) V.fail('VNEXT_PLAN_TEST_COVERAGE_IMPACT_INVALID', impactId);
    }

    if (row.target_impact_id === null) {
      const key = '<NONE>';
      if (seenTargets.has(key)) V.fail('VNEXT_PLAN_TEST_OBLIGATION_DUPLICATE', key);
      seenTargets.add(key);
      return {
        test_id: V.stableId('TEST', [requirementId, null, 'NONE_WITH_JUSTIFICATION', coveredChangeImpactIds]),
        target_impact_id: null,
        target_candidate_id: null,
        path: null,
        action: 'NONE_WITH_JUSTIFICATION',
        covered_change_impact_ids: coveredChangeImpactIds,
        expected: row.expected,
        justification: row.justification,
      };
    }

    V.assertNonEmptyString(
      row.target_impact_id,
      'VNEXT_PLAN_TEST_TARGET_INVALID',
      `test_obligations[${index}].target_impact_id`,
    );
    if (seenTargets.has(row.target_impact_id)) {
      V.fail('VNEXT_PLAN_TEST_OBLIGATION_DUPLICATE', row.target_impact_id);
    }
    seenTargets.add(row.target_impact_id);
    const impact = impactById.get(row.target_impact_id);
    if (!impact) V.fail('VNEXT_PLAN_TEST_IMPACT_UNKNOWN', row.target_impact_id);
    if (!isTestPath(impact.path)) V.fail('VNEXT_PLAN_TEST_TARGET_NOT_TEST', String(impact.path));
    const action = derivedTestAction(impact);
    return {
      test_id: V.stableId('TEST', [requirementId, impact.impact_id, action]),
      target_impact_id: impact.impact_id,
      target_candidate_id: impact.candidate_id,
      path: impact.path,
      action,
      covered_change_impact_ids: coveredChangeImpactIds,
      expected: row.expected,
      justification: row.justification,
    };
  });

  const targetIds = new Set(normalized.filter((row) => row.target_impact_id !== null).map((row) => row.target_impact_id));
  const coveredChanges = new Set(normalized.flatMap((row) => row.covered_change_impact_ids));
  const changedTests = requirementImpacts.filter((impact) =>
    isTestPath(impact.path) && ['MODIFY', 'CREATE', 'DELETE'].includes(impact.change_kind));
  for (const impact of changedTests) {
    if (!targetIds.has(impact.impact_id)) {
      V.fail('VNEXT_PLAN_CHANGED_TEST_UNBOUND', impact.impact_id);
    }
  }

  for (const impactId of changedImpactIds) {
    if (!coveredChanges.has(impactId)) V.fail('VNEXT_PLAN_CHANGE_WITHOUT_TEST_COVERAGE', impactId);
  }

  const affectedCandidateIds = new Set();
  for (const impact of requirementImpacts) {
    for (const candidateId of impact.tests_affected_candidate_ids || []) affectedCandidateIds.add(candidateId);
  }
  for (const candidateId of affectedCandidateIds) {
    const matching = requirementImpacts.filter((impact) => impact.candidate_id === candidateId && isTestPath(impact.path));
    if (matching.length === 0) V.fail('VNEXT_PLAN_AFFECTED_TEST_IMPACT_MISSING', candidateId);
    if (!matching.some((impact) => targetIds.has(impact.impact_id))) {
      V.fail('VNEXT_PLAN_AFFECTED_TEST_UNBOUND', candidateId);
    }
  }

  return normalized.sort((a, b) => a.test_id.localeCompare(b.test_id));
}

function normalizeProofObligations(rows, requirementId, tests) {
  if (!Array.isArray(rows) || rows.length === 0) V.fail('VNEXT_PLAN_PROOF_OBLIGATIONS_EMPTY', requirementId);
  const testByImpact = new Map(
    tests
      .filter((test) => test.target_impact_id !== null)
      .map((test) => [test.target_impact_id, test]),
  );
  const allChangedImpactIds = new Set(tests.flatMap((test) => test.covered_change_impact_ids));
  const normalized = [];
  const seen = new Set();

  rows.forEach((row, index) => {
    V.assertExactKeys(
      row,
      ['proof_type', 'target_test_impact_id', 'covered_change_impact_ids', 'expected', 'justification'],
      [],
      'VNEXT_PLAN_PROOF_OBLIGATION_KEYS_INVALID',
    );
    if (!PROOF_TYPES.includes(row.proof_type)) V.fail('VNEXT_PLAN_PROOF_TYPE_INVALID', row.proof_type);
    V.assertUnicodeExactText(
      row.expected,
      'VNEXT_PLAN_PROOF_EXPECTED_INVALID',
      `proof_obligations[${index}].expected`,
    );
    V.assertUnicodeExactText(
      row.justification,
      'VNEXT_PLAN_PROOF_JUSTIFICATION_INVALID',
      `proof_obligations[${index}].justification`,
    );

    const coveredChangeImpactIds = uniqueIds(
      row.covered_change_impact_ids,
      'VNEXT_PLAN_PROOF_COVERAGE_INVALID',
      `proof_obligations[${index}].covered_change_impact_ids`,
      { allowEmpty: allChangedImpactIds.size === 0 },
    ).sort();
    for (const impactId of coveredChangeImpactIds) {
      if (!allChangedImpactIds.has(impactId)) V.fail('VNEXT_PLAN_PROOF_COVERAGE_IMPACT_INVALID', impactId);
    }

    if (row.proof_type === 'FUNCTIONAL_TEST') {
      V.assertNonEmptyString(
        row.target_test_impact_id,
        'VNEXT_PLAN_FUNCTIONAL_PROOF_TARGET_REQUIRED',
        'target_test_impact_id',
      );
      const targetTest = testByImpact.get(row.target_test_impact_id);
      if (!targetTest) V.fail('VNEXT_PLAN_FUNCTIONAL_PROOF_TEST_UNKNOWN', row.target_test_impact_id);
      if (targetTest.action === 'REMOVE') V.fail('VNEXT_PLAN_FUNCTIONAL_PROOF_REMOVE_FORBIDDEN', row.target_test_impact_id);
      for (const impactId of coveredChangeImpactIds) {
        if (!targetTest.covered_change_impact_ids.includes(impactId)) {
          V.fail('VNEXT_PLAN_FUNCTIONAL_PROOF_COVERAGE_MISMATCH', impactId);
        }
      }
    } else if (row.target_test_impact_id !== null) {
      V.fail('VNEXT_PLAN_NON_TEST_PROOF_TARGET_FORBIDDEN', row.proof_type);
    }

    const key = V.canonicalStringify([
      row.proof_type,
      row.target_test_impact_id,
      coveredChangeImpactIds,
      row.expected,
    ]);
    if (seen.has(key)) V.fail('VNEXT_PLAN_PROOF_DUPLICATE', row.proof_type);
    seen.add(key);

    normalized.push({
      proof_id: V.stableId('PROOF', [
        requirementId,
        row.proof_type,
        row.target_test_impact_id,
        coveredChangeImpactIds,
        row.expected,
      ]),
      proof_type: row.proof_type,
      target_test_impact_id: row.target_test_impact_id,
      covered_change_impact_ids: coveredChangeImpactIds,
      expected: row.expected,
      justification: row.justification,
    });
  });

  const functionalTargets = new Set(
    normalized
      .filter((proof) => proof.proof_type === 'FUNCTIONAL_TEST')
      .map((proof) => proof.target_test_impact_id),
  );
  for (const test of tests) {
    if (test.target_impact_id !== null
        && test.action !== 'REMOVE'
        && !functionalTargets.has(test.target_impact_id)) {
      V.fail('VNEXT_PLAN_FUNCTIONAL_PROOF_MISSING', test.target_impact_id);
    }
  }

  const proofCoveredChanges = new Set(normalized.flatMap((proof) => proof.covered_change_impact_ids));
  for (const impactId of allChangedImpactIds) {
    if (!proofCoveredChanges.has(impactId)) V.fail('VNEXT_PLAN_CHANGE_WITHOUT_PROOF_COVERAGE', impactId);
  }

  if (tests.some((test) => ['NONE_WITH_JUSTIFICATION', 'REMOVE'].includes(test.action))
      && !normalized.some((proof) => proof.proof_type !== 'FUNCTIONAL_TEST')) {
    V.fail('VNEXT_PLAN_ALTERNATIVE_PROOF_REQUIRED', requirementId);
  }

  return normalized.sort((a, b) => a.proof_id.localeCompare(b.proof_id));
}

function normalizeTextList(values, code, label) {
  return uniqueIds(values, code, label, { allowEmpty: true }).map((value) => {
    V.assertUnicodeExactText(value, code, label);
    return value;
  });
}

function buildBoundaries(impactGraph, candidateManifest) {
  const candidates = candidateIndex(candidateManifest);
  const writeKinds = new Map();
  const preserveIds = new Set();

  for (const impact of impactGraph.impacts) {
    if (impact.candidate_id && ['MODIFY', 'CREATE', 'DELETE'].includes(impact.change_kind)) {
      const existing = writeKinds.get(impact.candidate_id);
      if (existing && existing !== impact.change_kind) {
        V.fail(
          'VNEXT_PLAN_BOUNDARY_CHANGE_KIND_CONFLICT',
          `${impact.candidate_id}:${existing}:${impact.change_kind}`,
        );
      }
      writeKinds.set(impact.candidate_id, impact.change_kind);
    }
    for (const candidateId of impact.preservation_candidate_ids || []) preserveIds.add(candidateId);
  }

  for (const candidateId of preserveIds) {
    if (writeKinds.has(candidateId)) V.fail('VNEXT_PLAN_BOUNDARY_CHANGE_PRESERVE_CONFLICT', candidateId);
    const candidate = candidates.get(candidateId);
    if (!candidate) V.fail('VNEXT_PLAN_BOUNDARY_PRESERVE_UNKNOWN', candidateId);
    if (candidate.origin !== 'GIT_TREE') V.fail('VNEXT_PLAN_BOUNDARY_PRESERVE_NON_EXISTING', candidateId);
  }

  const writeScope = [...writeKinds.entries()].map(([candidateId, changeKind]) => {
    const candidate = candidates.get(candidateId);
    if (!candidate) V.fail('VNEXT_PLAN_BOUNDARY_CHANGE_UNKNOWN', candidateId);
    return {
      candidate_id: candidateId,
      path: candidate.path,
      change_kind: changeKind,
    };
  }).sort((a, b) => a.path.localeCompare(b.path));

  const preserveScope = [...preserveIds].map((candidateId) => {
    const candidate = candidates.get(candidateId);
    return { candidate_id: candidateId, path: candidate.path };
  }).sort((a, b) => a.path.localeCompare(b.path));

  return {
    write_scope: writeScope,
    preserve_scope: preserveScope,
    forbidden_policy: FORBIDDEN_POLICY,
  };
}

function buildPlanContract({
  requirementRegistry,
  impactGraph,
  candidateManifest,
  requirementPlans,
}) {
  RequirementRegistry.assertReady(requirementRegistry);
  Impact.validateCandidateManifest(candidateManifest);
  if (impactGraph.requirement_registry_hash !== requirementRegistry.contract_hash) {
    V.fail('VNEXT_PLAN_REQUIREMENT_REGISTRY_HASH_MISMATCH');
  }
  if (impactGraph.candidate_manifest_hash !== candidateManifest.contract_hash) {
    V.fail('VNEXT_PLAN_CANDIDATE_MANIFEST_HASH_MISMATCH');
  }
  V.verifyContractHash(impactGraph, 'VNEXT_PLAN_IMPACT_GRAPH_HASH_MISMATCH');
  if (!Array.isArray(requirementPlans)) V.fail('VNEXT_PLAN_REQUIREMENT_PLANS_INVALID');

  const requirements = new Map(requirementRegistry.requirements.map((req) => [req.requirement_id, req]));
  const impacts = impactIndex(impactGraph);
  const rows = new Map();

  for (const input of requirementPlans) {
    V.assertExactKeys(
      input,
      [
        'requirement_id', 'implementation_intents', 'test_obligations', 'proof_obligations',
        'implementation_constraints', 'residual_risks', 'rationale',
      ],
      [],
      'VNEXT_PLAN_REQUIREMENT_PLAN_KEYS_INVALID',
    );
    const requirement = requirements.get(input.requirement_id);
    if (!requirement) V.fail('VNEXT_PLAN_REQUIREMENT_UNKNOWN', input.requirement_id);
    if (rows.has(input.requirement_id)) V.fail('VNEXT_PLAN_REQUIREMENT_DUPLICATE', input.requirement_id);

    const requirementImpacts = impacts.byRequirement.get(input.requirement_id) || [];
    if (requirementImpacts.length === 0) V.fail('VNEXT_PLAN_REQUIREMENT_IMPACT_MISSING', input.requirement_id);
    const changedImpacts = requirementImpacts.filter((impact) =>
      ['MODIFY', 'CREATE', 'DELETE'].includes(impact.change_kind));
    const disposition = changedImpacts.length > 0 ? 'CHANGE' : 'NO_CHANGE';

    if (disposition === 'NO_CHANGE'
        && requirementImpacts.some((impact) => impact.change_kind !== 'NO_CHANGE')) {
      V.fail('VNEXT_PLAN_NO_CHANGE_CONTRADICTION', input.requirement_id);
    }

    const intents = normalizeImplementationIntents(
      input.implementation_intents,
      input.requirement_id,
      changedImpacts,
    );
    const intentByImpact = new Map(intents.map((row) => [row.impact_id, row.intent]));
    const changeItems = changedImpacts.map((impact) => ({
      change_id: V.stableId('CHG', [input.requirement_id, impact.impact_id]),
      impact_id: impact.impact_id,
      candidate_id: impact.candidate_id,
      path: impact.path,
      change_kind: impact.change_kind,
      intent: intentByImpact.get(impact.impact_id),
    })).sort((a, b) => a.change_id.localeCompare(b.change_id));

    const tests = normalizeTestObligations(
      input.test_obligations,
      input.requirement_id,
      requirementImpacts,
    );
    const proofs = normalizeProofObligations(
      input.proof_obligations,
      input.requirement_id,
      tests,
    );
    const constraints = normalizeTextList(
      input.implementation_constraints,
      'VNEXT_PLAN_CONSTRAINTS_INVALID',
      'implementation_constraints',
    );
    const risks = normalizeTextList(
      input.residual_risks,
      'VNEXT_PLAN_RESIDUAL_RISKS_INVALID',
      'residual_risks',
    );
    V.assertUnicodeExactText(input.rationale, 'VNEXT_PLAN_RATIONALE_INVALID', 'rationale');

    rows.set(input.requirement_id, {
      plan_item_id: V.stableId('PLAN', [
        requirementRegistry.contract_hash,
        impactGraph.contract_hash,
        input.requirement_id,
      ]),
      requirement_id: input.requirement_id,
      requirement_kind: requirement.kind,
      disposition,
      impact_ids: requirementImpacts.map((impact) => impact.impact_id).sort(),
      change_items: changeItems,
      test_obligations: tests,
      proof_obligations: proofs,
      implementation_constraints: constraints,
      residual_risks: risks,
      rationale: input.rationale,
    });
  }

  if (rows.size !== requirements.size) {
    const missing = [...requirements.keys()].filter((id) => !rows.has(id));
    V.fail('VNEXT_PLAN_REQUIREMENT_UNCOVERED', missing.join(','));
  }

  const planItems = [...rows.values()].sort((a, b) => a.requirement_id.localeCompare(b.requirement_id));
  const boundaries = buildBoundaries(impactGraph, candidateManifest);

  return V.sealContract({
    schema_version: SCHEMA,
    requirement_registry_hash: requirementRegistry.contract_hash,
    impact_graph_hash: impactGraph.contract_hash,
    candidate_manifest_hash: candidateManifest.contract_hash,
    requirement_count: requirements.size,
    plan_item_count: planItems.length,
    plan_items: planItems,
    boundaries,
  });
}

function validatePlanContract(planContract, {
  requirementRegistry,
  impactGraph,
  candidateManifest,
}) {
  V.assertExactKeys(
    planContract,
    [
      'schema_version', 'requirement_registry_hash', 'impact_graph_hash',
      'candidate_manifest_hash', 'requirement_count', 'plan_item_count',
      'plan_items', 'boundaries', 'contract_hash',
    ],
    [],
    'VNEXT_PLAN_CONTRACT_KEYS_INVALID',
  );
  if (planContract.schema_version !== SCHEMA) V.fail('VNEXT_PLAN_CONTRACT_SCHEMA_INVALID');
  V.verifyContractHash(planContract, 'VNEXT_PLAN_CONTRACT_HASH_MISMATCH');
  if (planContract.requirement_registry_hash !== requirementRegistry.contract_hash) {
    V.fail('VNEXT_PLAN_REQUIREMENT_REGISTRY_HASH_MISMATCH');
  }
  if (planContract.impact_graph_hash !== impactGraph.contract_hash) {
    V.fail('VNEXT_PLAN_IMPACT_GRAPH_HASH_MISMATCH');
  }
  if (planContract.candidate_manifest_hash !== candidateManifest.contract_hash) {
    V.fail('VNEXT_PLAN_CANDIDATE_MANIFEST_HASH_MISMATCH');
  }

  const requirementPlans = planContract.plan_items.map((item) => ({
    requirement_id: item.requirement_id,
    implementation_intents: item.change_items.map((change) => ({
      impact_id: change.impact_id,
      intent: change.intent,
    })),
    test_obligations: item.test_obligations.map((test) => ({
      target_impact_id: test.target_impact_id,
      covered_change_impact_ids: test.covered_change_impact_ids,
      expected: test.expected,
      justification: test.justification,
    })),
    proof_obligations: item.proof_obligations.map((proof) => ({
      proof_type: proof.proof_type,
      target_test_impact_id: proof.target_test_impact_id,
      covered_change_impact_ids: proof.covered_change_impact_ids,
      expected: proof.expected,
      justification: proof.justification,
    })),
    implementation_constraints: item.implementation_constraints,
    residual_risks: item.residual_risks,
    rationale: item.rationale,
  }));

  const rebuilt = buildPlanContract({
    requirementRegistry,
    impactGraph,
    candidateManifest,
    requirementPlans,
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(planContract)) {
    V.fail('VNEXT_PLAN_CONTRACT_REBUILD_MISMATCH');
  }
  return true;
}

function renderMarkdown(planContract) {
  V.verifyContractHash(planContract, 'VNEXT_PLAN_CONTRACT_HASH_MISMATCH');
  const lines = [
    '# KODJO VNext — Plan canonique',
    '',
    `- schema: \`${planContract.schema_version}\``,
    `- contract_hash: \`${planContract.contract_hash}\``,
    `- requirements: ${planContract.requirement_count}`,
    `- write_scope: ${planContract.boundaries.write_scope.length}`,
    '',
    '## Boundaries',
    '',
    `- forbidden_policy: \`${planContract.boundaries.forbidden_policy}\``,
  ];

  for (const row of planContract.boundaries.write_scope) {
    lines.push(`- CHANGE \`${row.path}\` (${row.change_kind})`);
  }
  for (const row of planContract.boundaries.preserve_scope) {
    lines.push(`- PRESERVE \`${row.path}\``);
  }

  for (const item of planContract.plan_items) {
    lines.push('', `## ${item.requirement_id}`, '');
    lines.push(`- disposition: \`${item.disposition}\``);
    lines.push(`- kind: \`${item.requirement_kind}\``);
    lines.push(`- rationale: ${item.rationale}`);
    lines.push('- impacts:');
    for (const id of item.impact_ids) lines.push(`  - \`${id}\``);
    lines.push('- changes:');
    if (item.change_items.length === 0) lines.push('  - none');
    for (const change of item.change_items) {
      lines.push(`  - \`${change.path}\` — ${change.change_kind} — ${change.intent}`);
    }
    lines.push('- tests:');
    for (const test of item.test_obligations) {
      const target = test.path === null ? 'none' : `\`${test.path}\``;
      lines.push(`  - ${test.action} — ${target} — ${test.expected}`);
    }
    lines.push('- proofs:');
    for (const proof of item.proof_obligations) {
      lines.push(`  - ${proof.proof_type} — ${proof.expected}`);
    }
    lines.push('- constraints:');
    if (item.implementation_constraints.length === 0) lines.push('  - none');
    for (const value of item.implementation_constraints) lines.push(`  - ${value}`);
    lines.push('- residual_risks:');
    if (item.residual_risks.length === 0) lines.push('  - none');
    for (const value of item.residual_risks) lines.push(`  - ${value}`);
  }

  lines.push(
    '',
    '<KODJO_VNEXT_PLAN_CONTRACT_JSON>',
    JSON.stringify(planContract, null, 2),
    '</KODJO_VNEXT_PLAN_CONTRACT_JSON>',
    '',
  );
  return lines.join('\n');
}

function verifyMarkdownProjection(markdown, planContract) {
  if (String(markdown) !== renderMarkdown(planContract)) {
    V.fail('VNEXT_PLAN_MARKDOWN_PROJECTION_DRIFT');
  }
  return true;
}

module.exports = {
  SCHEMA,
  DISPOSITIONS,
  PROOF_TYPES,
  TEST_ACTIONS,
  FORBIDDEN_POLICY,
  isTestPath,
  buildPlanContract,
  validatePlanContract,
  renderMarkdown,
  verifyMarkdownProjection,
};
