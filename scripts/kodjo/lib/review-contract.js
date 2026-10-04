'use strict';

const V = require('./vnext-contract');
const PlanningEnvelope = require('./planning-envelope');
const RequirementRegistry = require('./requirement-registry');
const Impact = require('./impact-graph');
const Plan = require('./plan-contract');
const Ui = require('./ui-atomicity-contract');

const CONTEXT_SCHEMA = 'kodjo.vnext.review-context.v2';
const REPORT_SCHEMA = 'kodjo.vnext.review-report.v2';

const FINDING_CATEGORIES = Object.freeze([
  'MISSING_REQUIREMENT',
  'SOURCE_CONTRADICTION',
  'IMPACT_INCOMPLETE',
  'WRONG_TARGET',
  'PLAN_GAP',
  'TEST_GAP',
  'PROOF_GAP',
  'PRESERVATION_RISK',
  'UI_ASSERTION_GAP',
  'PRODUCT_AMBIGUITY',
  'TECHNICAL_RISK',
  'SUGGESTION',
]);

const TARGET_TYPES = Object.freeze([
  'SOURCE_UNIT',
  'REQUIREMENT',
  'IMPACT',
  'CANDIDATE',
  'PLAN_ITEM',
  'TEST',
  'PROOF',
  'CRITERION',
  'ASSERTION',
  'PLAN_CONTRACT',
]);

const CATEGORY_TARGETS = Object.freeze({
  MISSING_REQUIREMENT: ['SOURCE_UNIT'],
  SOURCE_CONTRADICTION: ['SOURCE_UNIT', 'REQUIREMENT'],
  IMPACT_INCOMPLETE: ['REQUIREMENT', 'IMPACT', 'CANDIDATE'],
  WRONG_TARGET: ['IMPACT', 'CANDIDATE'],
  PLAN_GAP: ['REQUIREMENT', 'PLAN_ITEM', 'PLAN_CONTRACT'],
  TEST_GAP: ['REQUIREMENT', 'PLAN_ITEM', 'TEST'],
  PROOF_GAP: ['REQUIREMENT', 'PLAN_ITEM', 'PROOF'],
  PRESERVATION_RISK: ['IMPACT', 'CANDIDATE', 'PLAN_ITEM'],
  UI_ASSERTION_GAP: ['REQUIREMENT', 'CRITERION', 'ASSERTION'],
  PRODUCT_AMBIGUITY: ['SOURCE_UNIT', 'REQUIREMENT'],
  TECHNICAL_RISK: ['IMPACT', 'CANDIDATE', 'PLAN_ITEM'],
  SUGGESTION: TARGET_TYPES,
});

const REENTRY_BY_CATEGORY = Object.freeze({
  MISSING_REQUIREMENT: 'REQUIREMENTS',
  SOURCE_CONTRADICTION: 'REQUIREMENTS',
  IMPACT_INCOMPLETE: 'IMPACT',
  WRONG_TARGET: 'IMPACT',
  PLAN_GAP: 'PLAN',
  TEST_GAP: 'PLAN',
  PROOF_GAP: 'PLAN',
  PRESERVATION_RISK: 'PLAN',
  UI_ASSERTION_GAP: 'PLAN',
  PRODUCT_AMBIGUITY: 'USER_DECISION',
  TECHNICAL_RISK: 'PLAN',
  SUGGESTION: 'NONE',
});

function isBlockingCategory(category) {
  return category !== 'SUGGESTION';
}

function collectTargets({
  requirementRegistry,
  impactGraph,
  candidateManifest,
  planContract,
  uiAtomicityContract,
}) {
  const catalog = {
    SOURCE_UNIT: [],
    REQUIREMENT: [],
    IMPACT: [],
    CANDIDATE: [],
    PLAN_ITEM: [],
    TEST: [],
    PROOF: [],
    CRITERION: [],
    ASSERTION: [],
    PLAN_CONTRACT: [planContract.contract_hash],
  };

  for (const row of requirementRegistry.coverage || []) catalog.SOURCE_UNIT.push(row.unit_id);
  for (const row of requirementRegistry.requirements || []) catalog.REQUIREMENT.push(row.requirement_id);
  for (const row of impactGraph.impacts || []) catalog.IMPACT.push(row.impact_id);
  for (const row of candidateManifest.candidates || []) catalog.CANDIDATE.push(row.candidate_id);
  for (const item of planContract.plan_items || []) {
    catalog.PLAN_ITEM.push(item.plan_item_id);
    for (const test of item.test_obligations || []) catalog.TEST.push(test.test_id);
    for (const proof of item.proof_obligations || []) catalog.PROOF.push(proof.proof_id);
  }
  if (uiAtomicityContract) {
    for (const criterion of uiAtomicityContract.criteria || []) {
      catalog.CRITERION.push(criterion.criterion_id);
      for (const assertion of criterion.assertions || []) {
        catalog.ASSERTION.push(assertion.assertion_id);
      }
    }
  }

  for (const criterion of planContract.delivery_preservation?.retained_criteria || []) {
    catalog.CRITERION.push(criterion.criterion_id);
    for (const assertion of criterion.assertions || []) catalog.ASSERTION.push(assertion.assertion_id);
  }
  for (const key of Object.keys(catalog)) {
    catalog[key] = [...new Set(catalog[key])].sort();
  }
  return catalog;
}

function validateCatalog(catalog) {
  V.assertExactKeys(
    catalog,
    TARGET_TYPES,
    [],
    'VNEXT_REVIEW_TARGET_CATALOG_KEYS_INVALID',
  );
  const all = new Set();
  for (const type of TARGET_TYPES) {
    if (!Array.isArray(catalog[type])) V.fail('VNEXT_REVIEW_TARGET_CATALOG_INVALID', type);
    for (const id of catalog[type]) {
      V.assertNonEmptyString(id, 'VNEXT_REVIEW_TARGET_ID_INVALID', type);
      if (all.has(id)) V.fail('VNEXT_REVIEW_TARGET_ID_COLLISION', id);
      all.add(id);
    }
  }
  return all;
}

function buildReviewContext({
  planningEnvelope,
  requirementRegistry,
  impactGraph,
  candidateManifest,
  planContract,
  directImportScan = null,
  uiAtomicityContract = null,
}) {
  PlanningEnvelope.validate(planningEnvelope);
  RequirementRegistry.validate(requirementRegistry, planningEnvelope.source_manifest);
  if (requirementRegistry.planning_envelope_hash !== planningEnvelope.contract_hash) {
    V.fail('VNEXT_REVIEW_ENVELOPE_BINDING_MISMATCH');
  }

  Impact.validateCandidateManifest(candidateManifest);
  if (impactGraph.candidate_manifest_hash !== candidateManifest.contract_hash) {
    V.fail('VNEXT_REVIEW_CANDIDATE_BINDING_MISMATCH');
  }
  Impact.validateImpactGraph(impactGraph, {
    requirementRegistry,
    candidateManifest,
    directImportScan,
  });
  Plan.validatePlanContract(planContract, {
    requirementRegistry,
    impactGraph,
    candidateManifest,
  });

  const uiChanges = Ui.uiChangeItems(requirementRegistry, planContract, candidateManifest)
    .map((row) => row.candidate_id)
    .sort();
  const uiApplicable = uiChanges.length > 0;

  if (uiApplicable && !uiAtomicityContract) {
    V.fail('VNEXT_REVIEW_UI_CONTRACT_REQUIRED');
  }
  if (uiAtomicityContract) {
    Ui.validateUiAtomicityContract(uiAtomicityContract, {
      requirementRegistry,
      impactGraph,
      candidateManifest,
      planContract,
    });
    if (Boolean(uiAtomicityContract.ui_applicable) !== uiApplicable) {
      V.fail('VNEXT_REVIEW_UI_APPLICABILITY_MISMATCH');
    }
  }

  const checks = [
    ['PLANNING_ENVELOPE', planningEnvelope.contract_hash],
    ['REQUIREMENT_REGISTRY', requirementRegistry.contract_hash],
    ['CANDIDATE_MANIFEST', candidateManifest.contract_hash],
    ['IMPACT_GRAPH', impactGraph.contract_hash],
    ['PLAN_CONTRACT', planContract.contract_hash],
  ];
  if (directImportScan) checks.push(['DIRECT_IMPORT_SCAN', directImportScan.contract_hash]);
  if (uiAtomicityContract) checks.push(['UI_ATOMICITY', uiAtomicityContract.contract_hash]);

  const mechanicalChecks = checks.map(([checkId, evidenceHash]) => Object.freeze({
    check_id: checkId,
    status: 'PASS',
    evidence_hash: evidenceHash,
  }));

  const targetCatalog = collectTargets({
    requirementRegistry,
    impactGraph,
    candidateManifest,
    planContract,
    uiAtomicityContract,
  });
  validateCatalog(targetCatalog);

  return V.sealContract({
    schema_version: CONTEXT_SCHEMA,
    planning_mode: planningEnvelope.planning_mode,
    causal_finding_ids: [...planningEnvelope.causal_findings].sort(),
    ...(planningEnvelope.created_from.kind === 'ACCEPTANCE_GAPS' ? {acceptance_gaps: planContract.delivery_preservation?.baseline.acceptance?.gaps || []} : {}),
    planning_envelope_hash: planningEnvelope.contract_hash,
    requirement_registry_hash: requirementRegistry.contract_hash,
    candidate_manifest_hash: candidateManifest.contract_hash,
    impact_graph_hash: impactGraph.contract_hash,
    direct_import_scan_hash: directImportScan ? directImportScan.contract_hash : null,
    plan_contract_hash: planContract.contract_hash,
    ui_atomicity_hash: uiAtomicityContract ? uiAtomicityContract.contract_hash : null,
    ui_applicable: uiApplicable,
    mechanical_checks: mechanicalChecks,
    target_catalog: targetCatalog,
  });
}

function validateReviewContext(context) {
  V.assertExactKeys(
    context,
    [
      'schema_version',
      'planning_mode',
      'causal_finding_ids',
      'planning_envelope_hash',
      'requirement_registry_hash',
      'candidate_manifest_hash',
      'impact_graph_hash',
      'direct_import_scan_hash',
      'plan_contract_hash',
      'ui_atomicity_hash',
      'ui_applicable',
      'mechanical_checks',
      'target_catalog',
      'contract_hash',
    ],
    ['acceptance_gaps'],
    'VNEXT_REVIEW_CONTEXT_KEYS_INVALID',
  );
  if (context.schema_version !== CONTEXT_SCHEMA) V.fail('VNEXT_REVIEW_CONTEXT_SCHEMA_INVALID');
  if (!['INITIAL', 'REVISION'].includes(context.planning_mode)) {
    V.fail('VNEXT_REVIEW_CONTEXT_MODE_INVALID', context.planning_mode);
  }
  V.verifyContractHash(context, 'VNEXT_REVIEW_CONTEXT_HASH_MISMATCH');
  if (context.acceptance_gaps && (context.planning_mode !== 'REVISION' || context.causal_finding_ids.length || !context.acceptance_gaps.length || new Set(context.acceptance_gaps.map(g=>g.gap_id)).size !== context.acceptance_gaps.length)) V.fail('VNEXT_REVIEW_ACCEPTANCE_CONTEXT_INVALID');
  if (!Array.isArray(context.mechanical_checks) || context.mechanical_checks.length === 0) {
    V.fail('VNEXT_REVIEW_MECHANICAL_CHECKS_MISSING');
  }
  for (const check of context.mechanical_checks) {
    V.assertExactKeys(
      check,
      ['check_id', 'status', 'evidence_hash'],
      [],
      'VNEXT_REVIEW_MECHANICAL_CHECK_KEYS_INVALID',
    );
    if (check.status !== 'PASS') V.fail('VNEXT_REVIEW_MECHANICAL_CHECK_NOT_PASS', check.check_id);
    V.assertSha64(check.evidence_hash, 'VNEXT_REVIEW_MECHANICAL_EVIDENCE_INVALID', check.check_id);
  }
  validateCatalog(context.target_catalog);
  return true;
}

function verifyReviewContext(context, artifacts) {
  validateReviewContext(context);
  const rebuilt = buildReviewContext(artifacts);
  if (V.canonicalStringify(context) !== V.canonicalStringify(rebuilt)) {
    V.fail('VNEXT_REVIEW_CONTEXT_REBUILD_MISMATCH');
  }
  return true;
}

function reviewerOutputSchema(reviewContext) {
  validateReviewContext(reviewContext);
  const allTargetIds = TARGET_TYPES.flatMap((type) => reviewContext.target_catalog[type]);

  return {
    type: 'object',
    additionalProperties: false,
    required: ['findings', 'reviewed_target_ids', 'finding_resolutions', ...(reviewContext.acceptance_gaps ? ['acceptance_resolutions'] : [])],
    properties: {
      ...(reviewContext.acceptance_gaps ? {acceptance_resolutions: {type:'array',items:{type:'object',additionalProperties:false,required:['gap_id','status','evidence_refs','note'],properties:{gap_id:{type:'string',enum:reviewContext.acceptance_gaps.map(g=>g.gap_id)},status:{type:'string',enum:['RESOLVED','OPEN']},evidence_refs:{type:'array',minItems:1,items:{type:'string',minLength:1}},note:{type:'string',minLength:1}}}}} : {}),
      reviewed_target_ids: { type: 'array', uniqueItems: true, items: { type: 'string', enum: allTargetIds } },
      finding_resolutions: { type: 'array', items: {
        type: 'object', additionalProperties: false, required: ['finding_id', 'status', 'evidence_refs', 'note'],
        properties: { finding_id: { type: 'string', minLength: 1 }, status: { type: 'string', enum: ['RESOLVED', 'OPEN'] },
          evidence_refs: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } }, note: { type: 'string', minLength: 1 } },
      } },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'category',
            'target_type',
            'target_id',
            'finding',
            'evidence',
            'required_correction',
            'dependency_target_ids',
          ],
          properties: {
            category: { type: 'string', enum: [...FINDING_CATEGORIES] },
            target_type: { type: 'string', enum: [...TARGET_TYPES] },
            target_id: { type: 'string', enum: allTargetIds },
            finding: { type: 'string', minLength: 1 },
            evidence: {
              type: 'array',
              minItems: 1,
              items: { type: 'string', minLength: 1 },
            },
            required_correction: { type: 'string', minLength: 1 },
            dependency_target_ids: {
              type: 'array',
              items: { type: 'string', enum: allTargetIds },
            },
          },
        },
      },
    },
  };
}

function normalizeFinding(row, index, reviewContext, allTargets) {
  V.assertExactKeys(
    row,
    [
      'category',
      'target_type',
      'target_id',
      'finding',
      'evidence',
      'required_correction',
      'dependency_target_ids',
    ],
    [],
    'VNEXT_REVIEW_FINDING_KEYS_INVALID',
  );

  if (!FINDING_CATEGORIES.includes(row.category)) {
    V.fail('VNEXT_REVIEW_FINDING_CATEGORY_INVALID', row.category);
  }
  if (!TARGET_TYPES.includes(row.target_type)) {
    V.fail('VNEXT_REVIEW_FINDING_TARGET_TYPE_INVALID', row.target_type);
  }
  if (!CATEGORY_TARGETS[row.category].includes(row.target_type)) {
    V.fail(
      'VNEXT_REVIEW_FINDING_TARGET_TYPE_INCOMPATIBLE',
      row.category + ':' + row.target_type,
    );
  }
  if (!reviewContext.target_catalog[row.target_type].includes(row.target_id)) {
    V.fail('VNEXT_REVIEW_FINDING_TARGET_UNKNOWN', row.target_id);
  }

  V.assertUnicodeExactText(
    row.finding,
    'VNEXT_REVIEW_FINDING_TEXT_INVALID',
    `findings[${index}].finding`,
  );
  V.assertUnicodeExactText(
    row.required_correction,
    'VNEXT_REVIEW_FINDING_CORRECTION_INVALID',
    `findings[${index}].required_correction`,
  );

  const evidence = V.uniqueStrings(
    row.evidence,
    'VNEXT_REVIEW_FINDING_EVIDENCE_INVALID',
    `findings[${index}].evidence`,
  ).sort();
  const dependencyTargetIds = V.uniqueStrings(
    row.dependency_target_ids,
    'VNEXT_REVIEW_FINDING_DEPENDENCIES_INVALID',
    `findings[${index}].dependency_target_ids`,
    { allowEmpty: true },
  ).sort();
  for (const id of dependencyTargetIds) {
    if (!allTargets.has(id)) V.fail('VNEXT_REVIEW_FINDING_DEPENDENCY_UNKNOWN', id);
    if (id === row.target_id) V.fail('VNEXT_REVIEW_FINDING_SELF_DEPENDENCY', id);
  }

  const blocking = isBlockingCategory(row.category);
  const reentryStage = REENTRY_BY_CATEGORY[row.category];
  const findingId = V.stableId('FND', [
    row.category,
    row.target_type,
    row.target_id,
    row.finding,
    evidence,
    row.required_correction,
    dependencyTargetIds,
  ]);

  return {
    finding_id: findingId,
    category: row.category,
    target_type: row.target_type,
    target_id: row.target_id,
    blocking,
    finding: row.finding,
    evidence,
    required_correction: row.required_correction,
    dependency_target_ids: dependencyTargetIds,
    reentry_stage: reentryStage,
  };
}

function buildReviewReport({ reviewContext, semanticReview }) {
  validateReviewContext(reviewContext);
  V.assertExactKeys(
    semanticReview,
    ['findings', 'reviewed_target_ids', 'finding_resolutions'],
    reviewContext.acceptance_gaps ? ['acceptance_resolutions'] : [],
    'VNEXT_REVIEW_OUTPUT_KEYS_INVALID',
  );
  if (!Array.isArray(semanticReview.findings)) {
    V.fail('VNEXT_REVIEW_FINDINGS_INVALID');
  }

  const allTargets = validateCatalog(reviewContext.target_catalog);
  const reviewedTargets = V.uniqueStrings(semanticReview.reviewed_target_ids, 'VNEXT_REVIEW_COVERAGE_INVALID', 'reviewed_target_ids').sort();
  if (V.canonicalStringify(reviewedTargets) !== V.canonicalStringify([...allTargets].sort())) V.fail('VNEXT_REVIEW_COVERAGE_INCOMPLETE');
  if (!Array.isArray(semanticReview.finding_resolutions)) V.fail('VNEXT_REVIEW_RESOLUTIONS_INVALID');
  const seenResolutions = new Set();
  const resolutions = semanticReview.finding_resolutions.map(row => {
    V.assertExactKeys(row, ['finding_id', 'status', 'evidence_refs', 'note'], [], 'VNEXT_REVIEW_RESOLUTION_KEYS_INVALID');
    if (seenResolutions.has(row.finding_id) || !['RESOLVED', 'OPEN'].includes(row.status)) V.fail('VNEXT_REVIEW_RESOLUTION_INVALID');
    seenResolutions.add(row.finding_id);
    V.assertUnicodeExactText(row.note, 'VNEXT_REVIEW_RESOLUTION_NOTE_REQUIRED');
    return { ...row, evidence_refs: V.uniqueStrings(row.evidence_refs, 'VNEXT_REVIEW_RESOLUTION_EVIDENCE_REQUIRED', 'evidence_refs').sort() };
  }).sort((a,b) => a.finding_id.localeCompare(b.finding_id));
  if (V.canonicalStringify(resolutions.map(row => row.finding_id)) !== V.canonicalStringify(reviewContext.causal_finding_ids)) V.fail('VNEXT_REVIEW_CAUSAL_RESOLUTION_COVERAGE');
  if (reviewContext.planning_mode === 'INITIAL' && resolutions.length) V.fail('VNEXT_INITIAL_RESOLUTIONS_FORBIDDEN');
  let acceptanceResolutions;
  if (reviewContext.acceptance_gaps) {
    if (!Array.isArray(semanticReview.acceptance_resolutions)) V.fail('VNEXT_ACCEPTANCE_RESOLUTION_REQUIRED');
    acceptanceResolutions = semanticReview.acceptance_resolutions.map(row => {
      V.assertExactKeys(row,['gap_id','status','evidence_refs','note'],[],'VNEXT_ACCEPTANCE_RESOLUTION_KEYS_INVALID');
      if (!['RESOLVED','OPEN'].includes(row.status)) V.fail('VNEXT_ACCEPTANCE_RESOLUTION_STATUS_INVALID');
      V.assertUnicodeExactText(row.note,'VNEXT_ACCEPTANCE_RESOLUTION_NOTE_REQUIRED');
      return {...row,evidence_refs:V.uniqueStrings(row.evidence_refs,'VNEXT_ACCEPTANCE_RESOLUTION_EVIDENCE_REQUIRED','evidence_refs').sort()};
    }).sort((a,b)=>a.gap_id.localeCompare(b.gap_id));
    if (V.canonicalStringify(acceptanceResolutions.map(r=>r.gap_id)) !== V.canonicalStringify(reviewContext.acceptance_gaps.map(g=>g.gap_id).sort())) V.fail('VNEXT_ACCEPTANCE_RESOLUTION_COVERAGE_INVALID');
  }
  const findings = semanticReview.findings
    .map((row, index) => normalizeFinding(row, index, reviewContext, allTargets))
    .sort((a, b) => a.finding_id.localeCompare(b.finding_id));

  const ids = findings.map((finding) => finding.finding_id);
  if (new Set(ids).size !== ids.length) V.fail('VNEXT_REVIEW_FINDING_DUPLICATE');

  let verdict = 'APPROVE';
  if (findings.some((finding) => finding.category === 'PRODUCT_AMBIGUITY')) {
    verdict = 'CLARIFICATION_REQUIRED';
  } else if (findings.some((finding) => finding.blocking)) {
    verdict = 'REVISE';
  }
  if ((resolutions.some(row => row.status !== 'RESOLVED') || acceptanceResolutions?.some(row=>row.status !== 'RESOLVED')) && verdict === 'APPROVE') verdict = 'REVISE';

  const blockingFindings = findings.filter((finding) => finding.blocking);
  const affectedTargetIds = [...new Set(blockingFindings.map((finding) => finding.target_id))].sort();
  const reentryStages = [...new Set(blockingFindings.map((finding) => finding.reentry_stage))].sort();

  return V.sealContract({
    schema_version: REPORT_SCHEMA,
    review_context_hash: reviewContext.contract_hash,
    planning_mode: reviewContext.planning_mode,
    plan_contract_hash: reviewContext.plan_contract_hash,
    ui_atomicity_hash: reviewContext.ui_atomicity_hash,
    finding_count: findings.length,
    blocking_finding_count: blockingFindings.length,
    verdict,
    affected_target_ids: affectedTargetIds,
    reentry_stages: reentryStages,
    findings,
    reviewed_target_ids: reviewedTargets,
    finding_resolutions: resolutions,
    ...(acceptanceResolutions ? {acceptance_resolutions:acceptanceResolutions} : {}),
  });
}

function validateReviewReport(report, reviewContext) {
  V.assertExactKeys(
    report,
    [
      'schema_version',
      'review_context_hash',
      'planning_mode',
      'plan_contract_hash',
      'ui_atomicity_hash',
      'finding_count',
      'blocking_finding_count',
      'verdict',
      'affected_target_ids',
      'reentry_stages',
      'findings',
      'reviewed_target_ids',
      'finding_resolutions',
      'contract_hash',
    ],
    reviewContext.acceptance_gaps ? ['acceptance_resolutions'] : [],
    'VNEXT_REVIEW_REPORT_KEYS_INVALID',
  );
  if (report.schema_version !== REPORT_SCHEMA) V.fail('VNEXT_REVIEW_REPORT_SCHEMA_INVALID');
  V.verifyContractHash(report, 'VNEXT_REVIEW_REPORT_HASH_MISMATCH');
  if (report.review_context_hash !== reviewContext.contract_hash) {
    V.fail('VNEXT_REVIEW_REPORT_CONTEXT_MISMATCH');
  }

  const semanticReview = {
    reviewed_target_ids: report.reviewed_target_ids,
    finding_resolutions: report.finding_resolutions,
    ...(reviewContext.acceptance_gaps ? {acceptance_resolutions:report.acceptance_resolutions} : {}),
    findings: report.findings.map((finding) => ({
      category: finding.category,
      target_type: finding.target_type,
      target_id: finding.target_id,
      finding: finding.finding,
      evidence: finding.evidence,
      required_correction: finding.required_correction,
      dependency_target_ids: finding.dependency_target_ids,
    })),
  };
  const rebuilt = buildReviewReport({ reviewContext, semanticReview });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(report)) {
    V.fail('VNEXT_REVIEW_REPORT_REBUILD_MISMATCH');
  }
  return true;
}

function buildReviewerPacket({ root, revision, reviewContext }) {
  validateReviewContext(reviewContext);
  return require('./vnext-producer-packet').buildProducerPacket({
    root,
    revision,
    entries: ['scripts/kodjo/lib/review-contract.js'],
    outputSchema: reviewerOutputSchema(reviewContext),
    inputs: { review_context: reviewContext },
  });
}

module.exports = {
  buildReviewerPacket,
  CONTEXT_SCHEMA,
  REPORT_SCHEMA,
  FINDING_CATEGORIES,
  TARGET_TYPES,
  CATEGORY_TARGETS,
  REENTRY_BY_CATEGORY,
  buildReviewContext,
  validateReviewContext,
  verifyReviewContext,
  reviewerOutputSchema,
  buildReviewReport,
  validateReviewReport,
};
