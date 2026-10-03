'use strict';

const V = require('./vnext-contract');
const RequirementRegistry = require('./requirement-registry');
const Impact = require('./impact-graph');
const Plan = require('./plan-contract');
// VNext owns this conservative path guard; source UI requirements remain primary.
function isUiPath(value) {
  return /^(?:app\/|src\/features\/|src\/shared\/ui\/|src\/shared\/i18n\/|assets\/icons\/)/.test(value)
    && !/(?:^|\/)(__tests__|tests?)\/|\.(?:test|spec)\.[^.]+$/.test(value);
}

const SCHEMA = 'kodjo.vnext.ui-criteria.v2';

const RISK_TYPES = Object.freeze(['FUNCTIONAL', 'VISUAL', 'ACCESSIBILITY', 'DEVICE']);
const COMPONENT_DECISIONS = Object.freeze(['REUSE', 'EXTEND', 'CREATE']);
const ASSERTION_PROPERTY_TYPES = Object.freeze([
  'PRESENCE',
  'CONTENT',
  'STATE',
  'GEOMETRY',
  'RELATION',
  'STYLE',
  'LAYERING',
  'INTERACTION',
  'RESPONSIVE',
]);
const VISUAL_PROPERTIES = new Set(['GEOMETRY', 'RELATION', 'STYLE', 'LAYERING', 'RESPONSIVE']);
const STRUCTURAL_PROPERTIES = new Set(['PRESENCE', 'CONTENT', 'STATE']);
const PROOF_TYPES = new Set([
  'FUNCTIONAL_TEST',
  'STATIC_ANALYSIS',
  'VISUAL_COMPARE',
  'ACCESSIBILITY_CHECK',
  'DEVICE_CHECK',
]);

function unique(values, code, label, { allowEmpty = false } = {}) {
  return V.uniqueStrings(values, code, label, { allowEmpty }).sort();
}

function sameSet(left, right) {
  return V.canonicalStringify([...new Set(left)].sort())
    === V.canonicalStringify([...new Set(right)].sort());
}

function requirementIndex(requirementRegistry) {
  RequirementRegistry.assertReady(requirementRegistry);
  return new Map(requirementRegistry.requirements.map((requirement) => [
    requirement.requirement_id,
    requirement,
  ]));
}

// Source-first UI requirements cover effects outside the historical UI roots.
// Keep the path guard as an additional conservative check, never as an exemption.
function uiChangeItems(requirementRegistry, planContract, candidateManifest) {
  const requirements = requirementIndex(requirementRegistry);
  const candidates = new Map(candidateManifest.candidates.map(row => [row.candidate_id, row]));
  return planContract.plan_items.flatMap(item => item.change_items.filter(change =>
    candidates.get(change.candidate_id)?.candidate_kind !== 'TEST'
    && (requirements.get(item.requirement_id)?.kind === 'UI' || isUiPath(change.path))));
}

function planIndex(planContract) {
  const byRequirement = new Map();
  for (const item of planContract.plan_items || []) {
    if (byRequirement.has(item.requirement_id)) {
      V.fail('VNEXT_UI_PLAN_ITEM_DUPLICATE', item.requirement_id);
    }
    byRequirement.set(item.requirement_id, item);
  }
  return byRequirement;
}

function candidateIndex(candidateManifest) {
  Impact.validateCandidateManifest(candidateManifest);
  return new Map(candidateManifest.candidates.map((candidate) => [
    candidate.candidate_id,
    candidate,
  ]));
}

function impactIndex(impactGraph) {
  const byId = new Map();
  for (const impact of impactGraph.impacts || []) {
    if (byId.has(impact.impact_id)) V.fail('VNEXT_UI_IMPACT_ID_DUPLICATE', impact.impact_id);
    byId.set(impact.impact_id, impact);
  }
  return byId;
}

function proofIndex(planItem) {
  const byId = new Map();
  for (const proof of planItem.proof_obligations || []) {
    if (byId.has(proof.proof_id)) V.fail('VNEXT_UI_PLAN_PROOF_ID_DUPLICATE', proof.proof_id);
    byId.set(proof.proof_id, proof);
  }
  return byId;
}

function sourceSnapshot(requirement) {
  return Object.freeze({
    source_id: requirement.source_id,
    unit_id: requirement.unit_id,
    source_kind: requirement.source.source_kind,
    authority: requirement.source.authority,
    locator: requirement.source.locator,
    revision: requirement.source.revision,
    unit_locator: requirement.source.unit_locator,
    unit_fingerprint: requirement.source.unit_fingerprint,
  });
}

function validateRiskProofs(riskTypes, proofTypes, label) {
  if (riskTypes.includes('VISUAL') && !proofTypes.includes('VISUAL_COMPARE')) {
    V.fail('VNEXT_UI_RISK_PROOF_INVALID', label + ': VISUAL exige VISUAL_COMPARE');
  }
  if (riskTypes.includes('ACCESSIBILITY') && !proofTypes.includes('ACCESSIBILITY_CHECK')) {
    V.fail('VNEXT_UI_RISK_PROOF_INVALID', label + ': ACCESSIBILITY exige ACCESSIBILITY_CHECK');
  }
  if (riskTypes.includes('DEVICE') && !proofTypes.includes('DEVICE_CHECK')) {
    V.fail('VNEXT_UI_RISK_PROOF_INVALID', label + ': DEVICE exige DEVICE_CHECK');
  }
  if (riskTypes.includes('FUNCTIONAL')
      && !proofTypes.some((proof) => proof === 'FUNCTIONAL_TEST' || proof === 'STATIC_ANALYSIS')) {
    V.fail('VNEXT_UI_RISK_PROOF_INVALID', label + ': FUNCTIONAL exige FUNCTIONAL_TEST ou STATIC_ANALYSIS');
  }
}

function validateAssertionProofs(propertyType, proofTypes, requirement, label) {
  if (VISUAL_PROPERTIES.has(propertyType)) {
    if (!proofTypes.includes('VISUAL_COMPARE')) {
      V.fail('VNEXT_UI_ASSERTION_PROOF_INVALID', label + ': ' + propertyType + ' exige VISUAL_COMPARE');
    }
    if (!['VISUAL', 'DECISION'].includes(requirement.source.authority)) {
      V.fail(
        'VNEXT_UI_ASSERTION_VISUAL_SOURCE_INVALID',
        label + ': propriété visuelle sans source VISUAL/DECISION',
      );
    }
  }

  if (propertyType === 'INTERACTION') {
    if (!proofTypes.some((proof) => proof === 'FUNCTIONAL_TEST' || proof === 'STATIC_ANALYSIS')) {
      V.fail(
        'VNEXT_UI_ASSERTION_PROOF_INVALID',
        label + ': INTERACTION exige FUNCTIONAL_TEST ou STATIC_ANALYSIS',
      );
    }
    if (!['FUNCTIONAL', 'DECISION'].includes(requirement.source.authority)) {
      V.fail(
        'VNEXT_UI_ASSERTION_INTERACTION_SOURCE_INVALID',
        label + ': interaction sans source FUNCTIONAL/DECISION',
      );
    }
  }

  if (STRUCTURAL_PROPERTIES.has(propertyType)
      && !proofTypes.some((proof) =>
        ['FUNCTIONAL_TEST', 'STATIC_ANALYSIS', 'VISUAL_COMPARE'].includes(proof))) {
    V.fail(
      'VNEXT_UI_ASSERTION_PROOF_INVALID',
      label + ': ' + propertyType + ' exige une preuve observable',
    );
  }
}

function normalizeReuse(input, candidateById, label) {
  const searchIds = unique(
    input.reuse_search_candidate_ids,
    'VNEXT_UI_REUSE_SEARCH_INVALID',
    label + '.reuse_search_candidate_ids',
  );
  for (const candidateId of searchIds) {
    const candidate = candidateById.get(candidateId);
    if (!candidate) V.fail('VNEXT_UI_REUSE_CANDIDATE_UNKNOWN', candidateId);
    if (candidate.origin !== 'GIT_TREE') V.fail('VNEXT_UI_REUSE_CANDIDATE_NOT_EXISTING', candidateId);
    if (!isUiPath(candidate.path) && !['CODE', 'ASSET', 'CREATE_SLOT'].includes(candidate.candidate_kind)) V.fail('VNEXT_UI_REUSE_CANDIDATE_NOT_UI', candidate.path);
  }

  if (!COMPONENT_DECISIONS.includes(input.component_decision)) {
    V.fail('VNEXT_UI_COMPONENT_DECISION_INVALID', input.component_decision);
  }
  V.assertUnicodeExactText(
    input.selected_component,
    'VNEXT_UI_SELECTED_COMPONENT_INVALID',
    label + '.selected_component',
  );
  V.assertUnicodeExactText(
    input.decision_justification,
    'VNEXT_UI_COMPONENT_JUSTIFICATION_INVALID',
    label + '.decision_justification',
  );

  if (['REUSE', 'EXTEND'].includes(input.component_decision)) {
    V.assertNonEmptyString(
      input.selected_component_candidate_id,
      'VNEXT_UI_SELECTED_COMPONENT_CANDIDATE_REQUIRED',
      label + '.selected_component_candidate_id',
    );
    if (!searchIds.includes(input.selected_component_candidate_id)) {
      V.fail(
        'VNEXT_UI_SELECTED_COMPONENT_NOT_SEARCHED',
        input.selected_component_candidate_id,
      );
    }
  } else if (input.selected_component_candidate_id !== null) {
    V.fail('VNEXT_UI_CREATE_EXISTING_COMPONENT_FORBIDDEN', String(input.selected_component_candidate_id));
  }

  return {
    reuse_search_candidate_ids: searchIds,
    component_decision: input.component_decision,
    selected_component: input.selected_component,
    selected_component_candidate_id: input.selected_component_candidate_id,
    decision_justification: input.decision_justification,
  };
}

function normalizeAssertions({
  assertions,
  criterionId,
  criterionProofIds,
  criterionChangeImpactIds,
  proofById,
  impactById,
  requirement,
}) {
  if (!Array.isArray(assertions) || assertions.length === 0) {
    V.fail('VNEXT_UI_ASSERTIONS_MISSING', criterionId);
  }

  const seen = new Set();
  const normalized = assertions.map((assertion, index) => {
    V.assertExactKeys(
      assertion,
      [
        'subject', 'property_type', 'expected',
        'proof_ids', 'covered_change_impact_ids',
      ],
      [],
      'VNEXT_UI_ASSERTION_KEYS_INVALID',
    );

    V.assertUnicodeExactText(
      assertion.subject,
      'VNEXT_UI_ASSERTION_SUBJECT_INVALID',
      `assertions[${index}].subject`,
    );
    if (!ASSERTION_PROPERTY_TYPES.includes(assertion.property_type)) {
      V.fail('VNEXT_UI_ASSERTION_PROPERTY_INVALID', assertion.property_type);
    }
    V.assertUnicodeExactText(
      assertion.expected,
      'VNEXT_UI_ASSERTION_EXPECTED_INVALID',
      `assertions[${index}].expected`,
    );

    const proofIds = unique(
      assertion.proof_ids,
      'VNEXT_UI_ASSERTION_PROOFS_INVALID',
      `assertions[${index}].proof_ids`,
    );
    for (const proofId of proofIds) {
      if (!criterionProofIds.includes(proofId)) {
        V.fail('VNEXT_UI_ASSERTION_PROOF_OUTSIDE_CRITERION', proofId);
      }
      if (!proofById.has(proofId)) V.fail('VNEXT_UI_ASSERTION_PROOF_UNKNOWN', proofId);
    }
    const proofTypes = proofIds.map((proofId) => proofById.get(proofId).proof_type);
    validateAssertionProofs(
      assertion.property_type,
      proofTypes,
      requirement,
      `assertions[${index}]`,
    );

    const coveredChangeImpactIds = unique(
      assertion.covered_change_impact_ids,
      'VNEXT_UI_ASSERTION_CHANGE_COVERAGE_INVALID',
      `assertions[${index}].covered_change_impact_ids`,
    );
    for (const impactId of coveredChangeImpactIds) {
      if (!criterionChangeImpactIds.includes(impactId)) {
        V.fail('VNEXT_UI_ASSERTION_IMPACT_OUTSIDE_CRITERION', impactId);
      }
      if (!impactById.has(impactId)) V.fail('VNEXT_UI_ASSERTION_IMPACT_UNKNOWN', impactId);
    }

    const assertionId = V.stableId('AST', [
      criterionId,
      assertion.subject,
      assertion.property_type,
      assertion.expected,
      proofIds,
      coveredChangeImpactIds,
    ]);
    if (seen.has(assertionId)) V.fail('VNEXT_UI_ASSERTION_DUPLICATE', assertionId);
    seen.add(assertionId);

    return {
      assertion_id: assertionId,
      subject: assertion.subject,
      source: sourceSnapshot(requirement),
      property_type: assertion.property_type,
      expected: assertion.expected,
      proof_ids: proofIds,
      proof_required: [...new Set(proofTypes)].sort(),
      covered_change_impact_ids: coveredChangeImpactIds,
    };
  }).sort((a, b) => a.assertion_id.localeCompare(b.assertion_id));

  const allocatedProofIds = normalized.flatMap((assertion) => assertion.proof_ids);
  if (!sameSet(allocatedProofIds, criterionProofIds)) {
    V.fail(
      'VNEXT_UI_ASSERTION_PROOF_COVERAGE_INCOMPLETE',
      criterionId + ': chaque preuve du critère doit être allouée',
    );
  }

  const coveredImpacts = normalized.flatMap((assertion) => assertion.covered_change_impact_ids);
  if (!sameSet(coveredImpacts, criterionChangeImpactIds)) {
    V.fail(
      'VNEXT_UI_ASSERTION_CHANGE_COVERAGE_INCOMPLETE',
      criterionId + ': chaque changement du critère doit être couvert',
    );
  }

  return normalized;
}

function buildUiAtomicityContract({
  requirementRegistry,
  impactGraph,
  candidateManifest,
  planContract,
  criteria,
}) {
  RequirementRegistry.assertReady(requirementRegistry);
  Impact.validateCandidateManifest(candidateManifest);
  Plan.validatePlanContract(planContract, {
    requirementRegistry,
    impactGraph,
    candidateManifest,
  });

  if (!Array.isArray(criteria)) V.fail('VNEXT_UI_CRITERIA_INVALID');

  const requirements = requirementIndex(requirementRegistry);
  const plans = planIndex(planContract);
  const candidates = candidateIndex(candidateManifest);
  const impacts = impactIndex(impactGraph);

  const uiChangeImpactIds = [];
  const uiChangeByRequirement = new Map();
  const uiChanges = new Set(uiChangeItems(requirementRegistry, planContract, candidateManifest).map(row => row.impact_id));

  for (const planItem of planContract.plan_items) {
    for (const change of planItem.change_items) {
      if (!uiChanges.has(change.impact_id)) continue;
      uiChangeImpactIds.push(change.impact_id);
      const list = uiChangeByRequirement.get(planItem.requirement_id) || [];
      list.push(change.impact_id);
      uiChangeByRequirement.set(planItem.requirement_id, list);
    }
  }

  const uiApplicable = uiChangeImpactIds.length > 0;
  if (!uiApplicable && criteria.length > 0) {
    V.fail('VNEXT_UI_CRITERIA_WITHOUT_UI_CHANGE');
  }

  const normalizedCriteria = [];
  const seenCriterionIds = new Set();

  for (let index = 0; index < criteria.length; index += 1) {
    const input = criteria[index];
    V.assertExactKeys(
      input,
      [
        'requirement_id',
        'statement',
        'risk_types',
        'reuse_search_candidate_ids',
        'component_decision',
        'selected_component',
        'selected_component_candidate_id',
        'decision_justification',
        'change_impact_ids',
        'proof_ids',
        'assertions',
      ],
      [],
      'VNEXT_UI_CRITERION_KEYS_INVALID',
    );

    const requirement = requirements.get(input.requirement_id);
    if (!requirement) V.fail('VNEXT_UI_REQUIREMENT_UNKNOWN', input.requirement_id);
    if (requirement.kind !== 'UI') {
      V.fail('VNEXT_UI_CRITERION_NON_UI_REQUIREMENT', input.requirement_id);
    }

    const planItem = plans.get(input.requirement_id);
    if (!planItem) V.fail('VNEXT_UI_PLAN_ITEM_MISSING', input.requirement_id);
    if (planItem.disposition !== 'CHANGE') {
      V.fail('VNEXT_UI_CRITERION_NO_CHANGE_FORBIDDEN', input.requirement_id);
    }

    V.assertUnicodeExactText(
      input.statement,
      'VNEXT_UI_CRITERION_STATEMENT_INVALID',
      `criteria[${index}].statement`,
    );

    const riskTypes = unique(
      input.risk_types,
      'VNEXT_UI_RISK_TYPES_INVALID',
      `criteria[${index}].risk_types`,
    );
    if (riskTypes.some((risk) => !RISK_TYPES.includes(risk))) {
      V.fail('VNEXT_UI_RISK_TYPES_INVALID', riskTypes.join(','));
    }

    const planProofs = proofIndex(planItem);
    const proofIds = unique(
      input.proof_ids,
      'VNEXT_UI_CRITERION_PROOFS_INVALID',
      `criteria[${index}].proof_ids`,
    );
    for (const proofId of proofIds) {
      if (!planProofs.has(proofId)) V.fail('VNEXT_UI_CRITERION_PROOF_UNKNOWN', proofId);
    }
    const proofTypes = proofIds.map((proofId) => planProofs.get(proofId).proof_type);
    validateRiskProofs(riskTypes, proofTypes, `criteria[${index}]`);

    const availableUiImpacts = new Set(uiChangeByRequirement.get(input.requirement_id) || []);
    const changeImpactIds = unique(
      input.change_impact_ids,
      'VNEXT_UI_CRITERION_IMPACTS_INVALID',
      `criteria[${index}].change_impact_ids`,
    );
    for (const impactId of changeImpactIds) {
      if (!availableUiImpacts.has(impactId)) {
        V.fail('VNEXT_UI_CRITERION_IMPACT_INVALID', impactId);
      }
    }

    const reuse = normalizeReuse(input, candidates, `criteria[${index}]`);

    const criterionId = V.stableId('CRT', [
      input.requirement_id,
      input.statement,
      changeImpactIds,
      proofIds,
    ]);
    if (seenCriterionIds.has(criterionId)) V.fail('VNEXT_UI_CRITERION_DUPLICATE', criterionId);
    seenCriterionIds.add(criterionId);

    const assertions = normalizeAssertions({
      assertions: input.assertions,
      criterionId,
      criterionProofIds: proofIds,
      criterionChangeImpactIds: changeImpactIds,
      proofById: planProofs,
      impactById: impacts,
      requirement,
    });

    normalizedCriteria.push({
      criterion_id: criterionId,
      requirement_id: input.requirement_id,
      source: sourceSnapshot(requirement),
      statement: input.statement,
      risk_types: riskTypes,
      ...reuse,
      change_impact_ids: changeImpactIds,
      proof_ids: proofIds,
      proof_required: [...new Set(proofTypes)].sort(),
      assertions,
    });
  }

  normalizedCriteria.sort((a, b) => a.criterion_id.localeCompare(b.criterion_id));

  const criteriaByRequirement = new Map();
  for (const criterion of normalizedCriteria) {
    const list = criteriaByRequirement.get(criterion.requirement_id) || [];
    list.push(criterion);
    criteriaByRequirement.set(criterion.requirement_id, list);
  }

  for (const [requirementId, impactIds] of uiChangeByRequirement) {
    const requirement = requirements.get(requirementId);
    if (!requirement || requirement.kind !== 'UI') {
      V.fail('VNEXT_UI_REQUIREMENT_MISSING_FOR_UI_CHANGE', requirementId);
    }
    const requirementCriteria = criteriaByRequirement.get(requirementId) || [];
    if (requirementCriteria.length === 0) {
      V.fail('VNEXT_UI_CRITERION_MISSING', requirementId);
    }
    const covered = requirementCriteria.flatMap((criterion) => criterion.change_impact_ids);
    if (!sameSet(covered, impactIds)) {
      V.fail('VNEXT_UI_CRITERION_CHANGE_COVERAGE_INCOMPLETE', requirementId);
    }
  }

  const assertionIds = normalizedCriteria.flatMap((criterion) =>
    criterion.assertions.map((assertion) => assertion.assertion_id));
  if (new Set(assertionIds).size !== assertionIds.length) {
    V.fail('VNEXT_UI_ASSERTION_GLOBAL_DUPLICATE');
  }

  return V.sealContract({
    schema_version: SCHEMA,
    requirement_registry_hash: requirementRegistry.contract_hash,
    impact_graph_hash: impactGraph.contract_hash,
    candidate_manifest_hash: candidateManifest.contract_hash,
    plan_contract_hash: planContract.contract_hash,
    ui_applicable: uiApplicable,
    ui_change_impact_ids: [...uiChangeImpactIds].sort(),
    criterion_count: normalizedCriteria.length,
    assertion_count: assertionIds.length,
    assertion_ids_sha256: V.canonicalHash([...assertionIds].sort()),
    criteria: normalizedCriteria,
  });
}

function validateUiAtomicityContract(contract, {
  requirementRegistry,
  impactGraph,
  candidateManifest,
  planContract,
}) {
  V.assertExactKeys(
    contract,
    [
      'schema_version',
      'requirement_registry_hash',
      'impact_graph_hash',
      'candidate_manifest_hash',
      'plan_contract_hash',
      'ui_applicable',
      'ui_change_impact_ids',
      'criterion_count',
      'assertion_count',
      'assertion_ids_sha256',
      'criteria',
      'contract_hash',
    ],
    [],
    'VNEXT_UI_CONTRACT_KEYS_INVALID',
  );
  if (contract.schema_version !== SCHEMA) V.fail('VNEXT_UI_CONTRACT_SCHEMA_INVALID');
  V.verifyContractHash(contract, 'VNEXT_UI_CONTRACT_HASH_MISMATCH');

  if (contract.requirement_registry_hash !== requirementRegistry.contract_hash) {
    V.fail('VNEXT_UI_REQUIREMENT_REGISTRY_HASH_MISMATCH');
  }
  if (contract.impact_graph_hash !== impactGraph.contract_hash) {
    V.fail('VNEXT_UI_IMPACT_GRAPH_HASH_MISMATCH');
  }
  if (contract.candidate_manifest_hash !== candidateManifest.contract_hash) {
    V.fail('VNEXT_UI_CANDIDATE_MANIFEST_HASH_MISMATCH');
  }
  if (contract.plan_contract_hash !== planContract.contract_hash) {
    V.fail('VNEXT_UI_PLAN_CONTRACT_HASH_MISMATCH');
  }

  const criteriaInput = contract.criteria.map((criterion) => ({
    requirement_id: criterion.requirement_id,
    statement: criterion.statement,
    risk_types: criterion.risk_types,
    reuse_search_candidate_ids: criterion.reuse_search_candidate_ids,
    component_decision: criterion.component_decision,
    selected_component: criterion.selected_component,
    selected_component_candidate_id: criterion.selected_component_candidate_id,
    decision_justification: criterion.decision_justification,
    change_impact_ids: criterion.change_impact_ids,
    proof_ids: criterion.proof_ids,
    assertions: criterion.assertions.map((assertion) => ({
      subject: assertion.subject,
      property_type: assertion.property_type,
      expected: assertion.expected,
      proof_ids: assertion.proof_ids,
      covered_change_impact_ids: assertion.covered_change_impact_ids,
    })),
  }));

  const rebuilt = buildUiAtomicityContract({
    requirementRegistry,
    impactGraph,
    candidateManifest,
    planContract,
    criteria: criteriaInput,
  });

  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(contract)) {
    V.fail('VNEXT_UI_CONTRACT_REBUILD_MISMATCH');
  }
  return true;
}

module.exports = {
  uiChangeItems,
  SCHEMA,
  RISK_TYPES,
  COMPONENT_DECISIONS,
  ASSERTION_PROPERTY_TYPES,
  buildUiAtomicityContract,
  validateUiAtomicityContract,
};
