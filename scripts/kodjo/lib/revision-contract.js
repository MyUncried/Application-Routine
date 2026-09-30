'use strict';

const V = require('./vnext-contract');
const Review = require('./review-contract');
const AuditStability = require('./audit-stability-contract');

const ALLOWED_SCHEMA = 'kodjo.vnext.allowed-change-set.v2';
const PATCH_SCHEMA = 'kodjo.vnext.revision-patch.v1';
const APPLICATION_SCHEMA = 'kodjo.vnext.revision-application.v1';
const OUTCOME_SCHEMA = 'kodjo.vnext.revision-outcome.v2';

const STAGE_PRIORITY = Object.freeze({
  REQUIREMENTS: 1,
  IMPACT: 2,
  PLAN: 3,
});

const ANCHOR_TYPES = new Set(['SOURCE_UNIT', 'CANDIDATE']);
function record(targetType, targetId, payload, parentIds = []) {
  V.assertNonEmptyString(targetId, 'VNEXT_REVISION_TARGET_ID_INVALID', targetType);
  const parents = [...new Set(parentIds.filter(Boolean).map(String))].sort();
  return Object.freeze({
    target_type: targetType,
    target_id: targetId,
    parent_ids: parents,
    object_hash: V.canonicalHash(payload),
    payload,
  });
}

function buildArtifactGraph({
  requirementRegistry,
  impactGraph,
  candidateManifest,
  planContract,
  uiAtomicityContract = null,
}) {
  const records = new Map();
  const add = (row) => {
    if (records.has(row.target_id)) V.fail('VNEXT_REVISION_TARGET_COLLISION', row.target_id);
    records.set(row.target_id, row);
  };

  for (const coverage of requirementRegistry.coverage || []) {
    add(record('SOURCE_UNIT', coverage.unit_id, coverage));
  }
  for (const requirement of requirementRegistry.requirements || []) {
    add(record('REQUIREMENT', requirement.requirement_id, requirement, [requirement.unit_id]));
  }
  for (const candidate of candidateManifest.candidates || []) {
    add(record('CANDIDATE', candidate.candidate_id, candidate));
  }
  for (const impact of impactGraph.impacts || []) {
    add(record(
      'IMPACT',
      impact.impact_id,
      impact,
      [impact.requirement_id, impact.candidate_id],
    ));
  }

  const impactsByRequirement = new Map();
  for (const impact of impactGraph.impacts || []) {
    const list = impactsByRequirement.get(impact.requirement_id) || [];
    list.push(impact.impact_id);
    impactsByRequirement.set(impact.requirement_id, list);
  }

  const planItems = new Map();
  for (const item of planContract.plan_items || []) {
    planItems.set(item.requirement_id, item);
    add(record(
      'PLAN_ITEM',
      item.plan_item_id,
      item,
      [item.requirement_id, ...(impactsByRequirement.get(item.requirement_id) || [])],
    ));
    for (const test of item.test_obligations || []) {
      add(record(
        'TEST',
        test.test_id,
        test,
        [
          item.plan_item_id,
          test.target_impact_id,
          ...(test.covered_change_impact_ids || []),
        ],
      ));
    }
    for (const proof of item.proof_obligations || []) {
      add(record(
        'PROOF',
        proof.proof_id,
        proof,
        [
          item.plan_item_id,
          proof.target_test_impact_id,
          ...(proof.covered_change_impact_ids || []),
        ],
      ));
    }
  }

  if (uiAtomicityContract) {
    for (const criterion of uiAtomicityContract.criteria || []) {
      const ownerPlan = planItems.get(criterion.requirement_id);
      add(record(
        'CRITERION',
        criterion.criterion_id,
        criterion,
        [
          criterion.requirement_id,
          ownerPlan ? ownerPlan.plan_item_id : null,
          ...(criterion.change_impact_ids || []),
          ...(criterion.proof_ids || []),
        ],
      ));
      for (const assertion of criterion.assertions || []) {
        add(record(
          'ASSERTION',
          assertion.assertion_id,
          assertion,
          [
            criterion.criterion_id,
            ...(assertion.covered_change_impact_ids || []),
            ...(assertion.proof_ids || []),
          ],
        ));
      }
    }
  }

  add(record(
    'PLAN_CONTRACT',
    planContract.contract_hash,
    planContract,
    (planContract.plan_items || []).map((item) => item.plan_item_id),
  ));

  const outgoing = new Map();
  for (const row of records.values()) {
    for (const parentId of row.parent_ids) {
      if (!records.has(parentId)) continue;
      const children = outgoing.get(parentId) || new Set();
      children.add(row.target_id);
      outgoing.set(parentId, children);
    }
  }

  return { records, outgoing };
}

function graphFingerprint(graph) {
  return V.canonicalHash(
    [...graph.records.values()]
      .map((row) => [row.target_type, row.target_id, row.parent_ids, row.object_hash])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1]))),
  );
}

function assertContextArtifactHashes(reviewContext, {
  requirementRegistry,
  impactGraph,
  candidateManifest,
  planContract,
  uiAtomicityContract = null,
}) {
  if (reviewContext.requirement_registry_hash !== requirementRegistry.contract_hash) {
    V.fail('VNEXT_REVISION_REQUIREMENT_REGISTRY_BINDING_MISMATCH');
  }
  if (reviewContext.impact_graph_hash !== impactGraph.contract_hash) {
    V.fail('VNEXT_REVISION_IMPACT_GRAPH_BINDING_MISMATCH');
  }
  if (reviewContext.candidate_manifest_hash !== candidateManifest.contract_hash) {
    V.fail('VNEXT_REVISION_CANDIDATE_MANIFEST_BINDING_MISMATCH');
  }
  if (reviewContext.plan_contract_hash !== planContract.contract_hash) {
    V.fail('VNEXT_REVISION_PLAN_CONTRACT_BINDING_MISMATCH');
  }
  const uiHash = uiAtomicityContract ? uiAtomicityContract.contract_hash : null;
  if (reviewContext.ui_atomicity_hash !== uiHash) {
    V.fail('VNEXT_REVISION_UI_ATOMICITY_BINDING_MISMATCH');
  }
  return true;
}

function assertCatalogMatches(reviewContext, graph) {
  Review.validateReviewContext(reviewContext);
  const catalogIds = new Set();
  for (const type of Review.TARGET_TYPES) {
    for (const id of reviewContext.target_catalog[type] || []) catalogIds.add(id);
  }
  const graphIds = new Set(graph.records.keys());
  if (catalogIds.size !== graphIds.size) {
    V.fail('VNEXT_REVISION_TARGET_CATALOG_COUNT_MISMATCH');
  }
  for (const id of catalogIds) {
    if (!graphIds.has(id)) V.fail('VNEXT_REVISION_TARGET_CATALOG_MISSING', id);
  }
  return true;
}

function earliestStage(findings) {
  let selected = 'PLAN';
  let priority = STAGE_PRIORITY.PLAN;
  for (const finding of findings) {
    const stage = finding.reentry_stage;
    if (stage === 'USER_DECISION') {
      V.fail('VNEXT_REVISION_USER_DECISION_REQUIRED', finding.finding_id);
    }
    if (stage === 'NONE') continue;
    if (!Object.hasOwn(STAGE_PRIORITY, stage)) {
      V.fail('VNEXT_REVISION_REENTRY_STAGE_INVALID', stage);
    }
    if (STAGE_PRIORITY[stage] < priority) {
      selected = stage;
      priority = STAGE_PRIORITY[stage];
    }
  }
  return selected;
}

function descendants(seedIds, outgoing) {
  const seen = new Set();
  const queue = [...seedIds];
  while (queue.length) {
    const current = queue.shift();
    for (const child of outgoing.get(current) || []) {
      if (seen.has(child) || seedIds.has(child)) continue;
      seen.add(child);
      queue.push(child);
    }
  }
  return seen;
}

function buildAllowedChangeSet({
  reviewContext,
  reviewReport,
  auditManifest,
  findingAssessment,
  findingLedger,
  requirementRegistry,
  impactGraph,
  candidateManifest,
  planContract,
  uiAtomicityContract = null,
}) {
  Review.validateReviewReport(reviewReport, reviewContext);
  if (!auditManifest || !findingAssessment || !findingLedger) {
    V.fail('VNEXT_REVISION_NORMATIVE_ASSESSMENT_REQUIRED');
  }
  AuditStability.validateFindingAssessment(findingAssessment, {
    auditManifest,
    reviewContext,
    reviewReport,
  });
  AuditStability.validateFindingLedger(findingLedger);
  if (findingLedger.audit_manifest_hash !== auditManifest.contract_hash) {
    V.fail('VNEXT_REVISION_LEDGER_AUDIT_MANIFEST_MISMATCH');
  }
  if (!findingLedger.review_report_hashes.includes(reviewReport.contract_hash)) {
    V.fail('VNEXT_REVISION_LEDGER_REVIEW_REPORT_MISMATCH');
  }
  if (reviewReport.verdict !== 'REVISE') {
    V.fail('VNEXT_REVISION_REVISE_REPORT_REQUIRED', reviewReport.verdict);
  }

  assertContextArtifactHashes(reviewContext, {
    requirementRegistry,
    impactGraph,
    candidateManifest,
    planContract,
    uiAtomicityContract,
  });
  const graph = buildArtifactGraph({
    requirementRegistry,
    impactGraph,
    candidateManifest,
    planContract,
    uiAtomicityContract,
  });
  assertCatalogMatches(reviewContext, graph);

  const blocking = reviewReport.findings.filter((finding) => finding.blocking);
  if (blocking.length === 0) V.fail('VNEXT_REVISION_BLOCKING_FINDING_REQUIRED');
  const blockingIds = blocking.map((finding) => finding.finding_id).sort();
  if (V.canonicalStringify([...findingLedger.open_finding_ids].sort())
      !== V.canonicalStringify(blockingIds)) {
    V.fail('VNEXT_REVISION_LEDGER_OPEN_FINDINGS_MISMATCH');
  }

  const reentryStage = earliestStage(blocking);
  const authorizedReasons = new Map();

  const authorize = (targetId, findingId) => {
    const target = graph.records.get(targetId);
    if (!target) V.fail('VNEXT_REVISION_AUTHORIZED_TARGET_UNKNOWN', targetId);
    const reasons = authorizedReasons.get(targetId) || new Set();
    reasons.add(findingId);
    authorizedReasons.set(targetId, reasons);
  };

  for (const finding of blocking) {
    if (finding.target_type === 'PLAN_CONTRACT') {
      if (!finding.dependency_target_ids.length) {
        V.fail('VNEXT_REVISION_PLAN_ROOT_TOO_BROAD', finding.finding_id);
      }
    } else {
      authorize(finding.target_id, finding.finding_id);
    }
    for (const dependencyId of finding.dependency_target_ids) {
      authorize(dependencyId, finding.finding_id);
    }
  }

  const authorizedIds = new Set(authorizedReasons.keys());
  const derivedSeeds = new Set(
    [...authorizedIds].filter((id) => !ANCHOR_TYPES.has(graph.records.get(id).target_type)),
  );
  const derivedIds = descendants(derivedSeeds, graph.outgoing);
  const preservedIds = new Set(
    [...graph.records.keys()].filter((id) => !authorizedIds.has(id) && !derivedIds.has(id)),
  );

  const serializeTarget = (id, extra = {}) => {
    const row = graph.records.get(id);
    return {
      target_type: row.target_type,
      target_id: row.target_id,
      parent_ids: row.parent_ids,
      object_hash: row.object_hash,
      ...extra,
    };
  };

  const authorizedTargets = [...authorizedIds].map((id) => {
    const row = graph.records.get(id);
    return serializeTarget(id, {
      mutation_mode: ANCHOR_TYPES.has(row.target_type) ? 'ANCHOR_ONLY' : 'SEMANTIC',
      finding_ids: [...authorizedReasons.get(id)].sort(),
    });
  }).sort((a, b) => a.target_type.localeCompare(b.target_type) || a.target_id.localeCompare(b.target_id));

  const derivedTargets = [...derivedIds].map((id) =>
    serializeTarget(id, { mutation_mode: 'MACHINE_DERIVED' }))
    .sort((a, b) => a.target_type.localeCompare(b.target_type) || a.target_id.localeCompare(b.target_id));

  const preservedTargets = [...preservedIds].map((id) =>
    serializeTarget(id, { mutation_mode: 'PRESERVE_EXACT' }))
    .sort((a, b) => a.target_type.localeCompare(b.target_type) || a.target_id.localeCompare(b.target_id));

  return V.sealContract({
    schema_version: ALLOWED_SCHEMA,
    review_context_hash: reviewContext.contract_hash,
    review_report_hash: reviewReport.contract_hash,
    audit_manifest_hash: auditManifest.contract_hash,
    finding_assessment_hash: findingAssessment.contract_hash,
    finding_ledger_hash: findingLedger.contract_hash,
    base_plan_contract_hash: planContract.contract_hash,
    base_ui_atomicity_hash: uiAtomicityContract ? uiAtomicityContract.contract_hash : null,
    base_target_graph_hash: graphFingerprint(graph),
    reentry_stage: reentryStage,
    blocking_finding_ids: blocking.map((finding) => finding.finding_id).sort(),
    authorized_targets: authorizedTargets,
    derived_targets: derivedTargets,
    preserved_targets: preservedTargets,
    preservation_hash: V.canonicalHash(
      preservedTargets.map((row) => [row.target_type, row.target_id, row.object_hash]),
    ),
  });
}

function validateAllowedChangeSet(allowedChangeSet) {
  V.assertExactKeys(
    allowedChangeSet,
    [
      'schema_version',
      'review_context_hash',
      'review_report_hash',
      'audit_manifest_hash',
      'finding_assessment_hash',
      'finding_ledger_hash',
      'base_plan_contract_hash',
      'base_ui_atomicity_hash',
      'base_target_graph_hash',
      'reentry_stage',
      'blocking_finding_ids',
      'authorized_targets',
      'derived_targets',
      'preserved_targets',
      'preservation_hash',
      'contract_hash',
    ],
    [],
    'VNEXT_ALLOWED_CHANGE_SET_KEYS_INVALID',
  );
  if (allowedChangeSet.schema_version !== ALLOWED_SCHEMA) {
    V.fail('VNEXT_ALLOWED_CHANGE_SET_SCHEMA_INVALID');
  }
  if (!Object.hasOwn(STAGE_PRIORITY, allowedChangeSet.reentry_stage)) {
    V.fail('VNEXT_ALLOWED_CHANGE_SET_REENTRY_INVALID', allowedChangeSet.reentry_stage);
  }
  V.assertSha64(allowedChangeSet.review_context_hash, 'VNEXT_ALLOWED_CHANGE_SET_REVIEW_CONTEXT_HASH_INVALID');
  V.assertSha64(allowedChangeSet.review_report_hash, 'VNEXT_ALLOWED_CHANGE_SET_REVIEW_REPORT_HASH_INVALID');
  V.assertSha64(allowedChangeSet.audit_manifest_hash, 'VNEXT_ALLOWED_CHANGE_SET_AUDIT_MANIFEST_HASH_INVALID');
  V.assertSha64(allowedChangeSet.finding_assessment_hash, 'VNEXT_ALLOWED_CHANGE_SET_FINDING_ASSESSMENT_HASH_INVALID');
  V.assertSha64(allowedChangeSet.finding_ledger_hash, 'VNEXT_ALLOWED_CHANGE_SET_FINDING_LEDGER_HASH_INVALID');
  V.assertSha64(allowedChangeSet.base_plan_contract_hash, 'VNEXT_ALLOWED_CHANGE_SET_PLAN_HASH_INVALID');
  if (allowedChangeSet.base_ui_atomicity_hash !== null) {
    V.assertSha64(allowedChangeSet.base_ui_atomicity_hash, 'VNEXT_ALLOWED_CHANGE_SET_UI_HASH_INVALID');
  }
  V.assertSha64(allowedChangeSet.base_target_graph_hash, 'VNEXT_ALLOWED_CHANGE_SET_GRAPH_HASH_INVALID');
  V.assertSha64(allowedChangeSet.preservation_hash, 'VNEXT_ALLOWED_CHANGE_SET_PRESERVATION_HASH_INVALID');
  V.verifyContractHash(allowedChangeSet, 'VNEXT_ALLOWED_CHANGE_SET_HASH_MISMATCH');

  const findingIds = V.uniqueStrings(
    allowedChangeSet.blocking_finding_ids,
    'VNEXT_ALLOWED_CHANGE_SET_FINDINGS_INVALID',
    'blocking_finding_ids',
  );
  const findingSet = new Set(findingIds);

  const all = new Set();
  const validateTarget = (row, mode) => {
    const required = mode === 'authorized'
      ? ['target_type', 'target_id', 'parent_ids', 'object_hash', 'mutation_mode', 'finding_ids']
      : ['target_type', 'target_id', 'parent_ids', 'object_hash', 'mutation_mode'];
    V.assertExactKeys(row, required, [], 'VNEXT_ALLOWED_CHANGE_SET_TARGET_KEYS_INVALID');
    if (!Review.TARGET_TYPES.includes(row.target_type)) {
      V.fail('VNEXT_ALLOWED_CHANGE_SET_TARGET_TYPE_INVALID', row.target_type);
    }
    V.assertNonEmptyString(row.target_id, 'VNEXT_ALLOWED_CHANGE_SET_TARGET_ID_INVALID');
    V.assertSha64(row.object_hash, 'VNEXT_ALLOWED_CHANGE_SET_OBJECT_HASH_INVALID');
    V.uniqueStrings(
      row.parent_ids,
      'VNEXT_ALLOWED_CHANGE_SET_PARENT_IDS_INVALID',
      row.target_id + '.parent_ids',
      { allowEmpty: true },
    );
    if (all.has(row.target_id)) V.fail('VNEXT_ALLOWED_CHANGE_SET_TARGET_OVERLAP', row.target_id);
    all.add(row.target_id);

    if (mode === 'authorized') {
      if (!['ANCHOR_ONLY', 'SEMANTIC'].includes(row.mutation_mode)) {
        V.fail('VNEXT_ALLOWED_CHANGE_SET_MUTATION_MODE_INVALID', row.mutation_mode);
      }
      const reasons = V.uniqueStrings(
        row.finding_ids,
        'VNEXT_ALLOWED_CHANGE_SET_TARGET_FINDINGS_INVALID',
        row.target_id + '.finding_ids',
      );
      for (const findingId of reasons) {
        if (!findingSet.has(findingId)) {
          V.fail('VNEXT_ALLOWED_CHANGE_SET_TARGET_FINDING_UNKNOWN', findingId);
        }
      }
    } else if (mode === 'derived' && row.mutation_mode !== 'MACHINE_DERIVED') {
      V.fail('VNEXT_ALLOWED_CHANGE_SET_MUTATION_MODE_INVALID', row.mutation_mode);
    } else if (mode === 'preserved' && row.mutation_mode !== 'PRESERVE_EXACT') {
      V.fail('VNEXT_ALLOWED_CHANGE_SET_MUTATION_MODE_INVALID', row.mutation_mode);
    }
  };

  if (!Array.isArray(allowedChangeSet.authorized_targets)
      || !Array.isArray(allowedChangeSet.derived_targets)
      || !Array.isArray(allowedChangeSet.preserved_targets)) {
    V.fail('VNEXT_ALLOWED_CHANGE_SET_TARGETS_INVALID');
  }
  for (const row of allowedChangeSet.authorized_targets) validateTarget(row, 'authorized');
  for (const row of allowedChangeSet.derived_targets) validateTarget(row, 'derived');
  for (const row of allowedChangeSet.preserved_targets) validateTarget(row, 'preserved');

  const expectedPreservationHash = V.canonicalHash(
    allowedChangeSet.preserved_targets.map((row) => [
      row.target_type,
      row.target_id,
      row.object_hash,
    ]),
  );
  if (expectedPreservationHash !== allowedChangeSet.preservation_hash) {
    V.fail('VNEXT_ALLOWED_CHANGE_SET_PRESERVATION_HASH_MISMATCH');
  }
  return true;
}

function revisionOutputSchema(allowedChangeSet) {
  validateAllowedChangeSet(allowedChangeSet);
  const targetIds = allowedChangeSet.authorized_targets.map((row) => row.target_id);
  const targetTypes = [...new Set(allowedChangeSet.authorized_targets.map((row) => row.target_type))];
  const findingIds = allowedChangeSet.blocking_finding_ids;

  return {
    type: 'object',
    additionalProperties: false,
    required: ['corrections'],
    properties: {
      corrections: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['target_type', 'target_id', 'finding_ids', 'correction'],
          properties: {
            target_type: { type: 'string', enum: targetTypes },
            target_id: { type: 'string', enum: targetIds },
            finding_ids: {
              type: 'array',
              minItems: 1,
              items: { type: 'string', enum: findingIds },
            },
            correction: { type: 'string', minLength: 1 },
          },
        },
      },
    },
  };
}

function buildRevisionPatch({ allowedChangeSet, corrections }) {
  validateAllowedChangeSet(allowedChangeSet);
  if (!Array.isArray(corrections) || corrections.length === 0) {
    V.fail('VNEXT_REVISION_PATCH_CORRECTIONS_EMPTY');
  }

  const authorized = new Map(
    allowedChangeSet.authorized_targets.map((row) => [row.target_id, row]),
  );
  const seenTargets = new Set();
  const coveredFindings = new Set();

  const normalized = corrections.map((row, index) => {
    V.assertExactKeys(
      row,
      ['target_type', 'target_id', 'finding_ids', 'correction'],
      [],
      'VNEXT_REVISION_PATCH_CORRECTION_KEYS_INVALID',
    );
    const target = authorized.get(row.target_id);
    if (!target) V.fail('VNEXT_REVISION_PATCH_TARGET_UNAUTHORIZED', row.target_id);
    if (target.target_type !== row.target_type) {
      V.fail('VNEXT_REVISION_PATCH_TARGET_TYPE_MISMATCH', row.target_id);
    }
    if (seenTargets.has(row.target_id)) {
      V.fail('VNEXT_REVISION_PATCH_TARGET_DUPLICATE', row.target_id);
    }
    seenTargets.add(row.target_id);

    const findingIds = V.uniqueStrings(
      row.finding_ids,
      'VNEXT_REVISION_PATCH_FINDING_IDS_INVALID',
      `corrections[${index}].finding_ids`,
    ).sort();
    for (const findingId of findingIds) {
      if (!target.finding_ids.includes(findingId)) {
        V.fail('VNEXT_REVISION_PATCH_FINDING_NOT_AUTHORIZED_FOR_TARGET', findingId);
      }
      coveredFindings.add(findingId);
    }

    V.assertUnicodeExactText(
      row.correction,
      'VNEXT_REVISION_PATCH_CORRECTION_INVALID',
      `corrections[${index}].correction`,
    );

    return {
      correction_id: V.stableId('CORR', [
        allowedChangeSet.contract_hash,
        row.target_type,
        row.target_id,
        findingIds,
        row.correction,
      ]),
      target_type: row.target_type,
      target_id: row.target_id,
      mutation_mode: target.mutation_mode,
      finding_ids: findingIds,
      correction: row.correction,
    };
  }).sort((a, b) => a.correction_id.localeCompare(b.correction_id));

  for (const findingId of allowedChangeSet.blocking_finding_ids) {
    if (!coveredFindings.has(findingId)) {
      V.fail('VNEXT_REVISION_PATCH_FINDING_UNCOVERED', findingId);
    }
  }

  return V.sealContract({
    schema_version: PATCH_SCHEMA,
    allowed_change_set_hash: allowedChangeSet.contract_hash,
    reentry_stage: allowedChangeSet.reentry_stage,
    correction_count: normalized.length,
    corrections: normalized,
  });
}

function validateRevisionPatch(revisionPatch, allowedChangeSet) {
  V.assertExactKeys(
    revisionPatch,
    [
      'schema_version',
      'allowed_change_set_hash',
      'reentry_stage',
      'correction_count',
      'corrections',
      'contract_hash',
    ],
    [],
    'VNEXT_REVISION_PATCH_KEYS_INVALID',
  );
  if (revisionPatch.schema_version !== PATCH_SCHEMA) V.fail('VNEXT_REVISION_PATCH_SCHEMA_INVALID');
  V.verifyContractHash(revisionPatch, 'VNEXT_REVISION_PATCH_HASH_MISMATCH');
  if (revisionPatch.allowed_change_set_hash !== allowedChangeSet.contract_hash) {
    V.fail('VNEXT_REVISION_PATCH_ALLOWED_SET_MISMATCH');
  }
  const rebuilt = buildRevisionPatch({
    allowedChangeSet,
    corrections: revisionPatch.corrections.map((row) => ({
      target_type: row.target_type,
      target_id: row.target_id,
      finding_ids: row.finding_ids,
      correction: row.correction,
    })),
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(revisionPatch)) {
    V.fail('VNEXT_REVISION_PATCH_REBUILD_MISMATCH');
  }
  return true;
}

function applyRevisionPatch({ allowedChangeSet, revisionPatch }) {
  validateAllowedChangeSet(allowedChangeSet);
  validateRevisionPatch(revisionPatch, allowedChangeSet);

  return V.sealContract({
    schema_version: APPLICATION_SCHEMA,
    allowed_change_set_hash: allowedChangeSet.contract_hash,
    revision_patch_hash: revisionPatch.contract_hash,
    reentry_stage: allowedChangeSet.reentry_stage,
    editable_target_ids: allowedChangeSet.authorized_targets.map((row) => row.target_id).sort(),
    machine_derived_target_ids: allowedChangeSet.derived_targets.map((row) => row.target_id).sort(),
    preserved_target_hash: allowedChangeSet.preservation_hash,
    corrections: revisionPatch.corrections,
  });
}

function sameParent(left, right) {
  return left.parent_ids.some((id) => right.parent_ids.includes(id));
}

function allowedNewTargets(baseGraph, nextGraph, mutableBaseIds) {
  const baseIds = new Set(baseGraph.records.keys());
  const allowed = new Set();
  const pending = [...nextGraph.records.values()].filter((row) => !baseIds.has(row.target_id));

  let changed = true;
  while (changed) {
    changed = false;
    for (const row of pending) {
      if (allowed.has(row.target_id)) continue;

      if (row.target_type === 'PLAN_CONTRACT') {
        const basePlan = [...baseGraph.records.values()].find((x) => x.target_type === 'PLAN_CONTRACT');
        if (basePlan && mutableBaseIds.has(basePlan.target_id)) {
          allowed.add(row.target_id);
          changed = true;
          continue;
        }
      }

      if (row.parent_ids.some((id) => mutableBaseIds.has(id) || allowed.has(id))) {
        allowed.add(row.target_id);
        changed = true;
        continue;
      }

      const replacement = [...baseGraph.records.values()].find((old) =>
        mutableBaseIds.has(old.target_id)
        && old.target_type === row.target_type
        && sameParent(old, row));
      if (replacement) {
        allowed.add(row.target_id);
        changed = true;
      }
    }
  }

  return allowed;
}

function verifyRevisionOutcome({
  allowedChangeSet,
  revisionPatch,
  baseArtifacts,
  nextArtifacts,
  auditManifest,
  previousReviewContext,
  previousReviewReport,
  previousFindingAssessment,
  previousFindingLedger,
  nextReviewContext,
  nextReviewReport,
  nextFindingAssessment,
  findingResolutionSet,
  nextFindingLedger,
}) {
  validateAllowedChangeSet(allowedChangeSet);
  validateRevisionPatch(revisionPatch, allowedChangeSet);
  Review.validateReviewReport(nextReviewReport, nextReviewContext);
  if (!previousReviewContext || !previousReviewReport || !previousFindingAssessment) {
    V.fail('VNEXT_REVISION_PREVIOUS_REVIEW_REQUIRED');
  }
  Review.validateReviewReport(previousReviewReport, previousReviewContext);
  if (previousReviewContext.contract_hash !== allowedChangeSet.review_context_hash) {
    V.fail('VNEXT_REVISION_PREVIOUS_REVIEW_CONTEXT_MISMATCH');
  }
  if (previousReviewReport.contract_hash !== allowedChangeSet.review_report_hash) {
    V.fail('VNEXT_REVISION_PREVIOUS_REVIEW_MISMATCH');
  }
  const previousBlockingIds = previousReviewReport.findings
    .filter((row) => row.blocking)
    .map((row) => row.finding_id)
    .sort();
  if (V.canonicalStringify(previousBlockingIds)
      !== V.canonicalStringify([...allowedChangeSet.blocking_finding_ids].sort())) {
    V.fail('VNEXT_REVISION_PREVIOUS_FINDINGS_MISMATCH');
  }
  if (!auditManifest) V.fail('VNEXT_REVISION_AUDIT_MANIFEST_REQUIRED');
  AuditStability.validateAuditManifest(auditManifest);
  AuditStability.validateFindingAssessment(previousFindingAssessment, {
    auditManifest,
    reviewContext: previousReviewContext,
    reviewReport: previousReviewReport,
  });
  if (previousFindingAssessment.contract_hash !== allowedChangeSet.finding_assessment_hash) {
    V.fail('VNEXT_REVISION_PREVIOUS_ASSESSMENT_MISMATCH');
  }
  if (!previousFindingLedger) V.fail('VNEXT_REVISION_PREVIOUS_LEDGER_REQUIRED');
  AuditStability.validateFindingLedger(previousFindingLedger);
  if (previousFindingLedger.contract_hash !== allowedChangeSet.finding_ledger_hash) {
    V.fail('VNEXT_REVISION_PREVIOUS_LEDGER_MISMATCH');
  }
  if (previousFindingLedger.audit_manifest_hash !== auditManifest.contract_hash
      || !previousFindingLedger.review_report_hashes.includes(previousReviewReport.contract_hash)
      || V.canonicalStringify([...previousFindingLedger.open_finding_ids].sort())
        !== V.canonicalStringify([...allowedChangeSet.blocking_finding_ids].sort())) {
    V.fail('VNEXT_REVISION_PREVIOUS_LEDGER_BINDING_MISMATCH');
  }
  if (auditManifest.contract_hash !== allowedChangeSet.audit_manifest_hash) {
    V.fail('VNEXT_REVISION_AUDIT_MANIFEST_CHANGED');
  }
  if (!findingResolutionSet) V.fail('VNEXT_REVISION_FINDING_RESOLUTION_REQUIRED');
  AuditStability.validateFindingResolutionSet(findingResolutionSet, {
    auditManifest,
    previousReviewReport,
    nextReviewContext,
    nextReviewReport,
  });
  if (!nextFindingAssessment || !nextFindingLedger) {
    V.fail('VNEXT_REVISION_NEXT_LEDGER_REQUIRED');
  }
  AuditStability.validateFindingAssessment(nextFindingAssessment, {
    auditManifest,
    reviewContext: nextReviewContext,
    reviewReport: nextReviewReport,
  });
  const rebuiltNextLedger = AuditStability.advanceFindingLedgerWithPreviousReport({
    previousLedger: previousFindingLedger,
    previousReviewReport,
    auditManifest,
    nextReviewContext,
    nextReviewReport,
    nextFindingAssessment,
    findingResolutionSet,
  });
  AuditStability.validateFindingLedger(nextFindingLedger);
  if (V.canonicalStringify(rebuiltNextLedger) !== V.canonicalStringify(nextFindingLedger)) {
    V.fail('VNEXT_REVISION_NEXT_LEDGER_MISMATCH');
  }
  if (nextReviewContext.planning_mode !== 'REVISION') {
    V.fail('VNEXT_REVISION_NEXT_REVIEW_MODE_INVALID', nextReviewContext.planning_mode);
  }

  const baseGraph = buildArtifactGraph(baseArtifacts);
  if (graphFingerprint(baseGraph) !== allowedChangeSet.base_target_graph_hash) {
    V.fail('VNEXT_REVISION_BASE_GRAPH_MISMATCH');
  }
  const nextGraph = buildArtifactGraph(nextArtifacts);
  assertContextArtifactHashes(nextReviewContext, nextArtifacts);
  assertCatalogMatches(nextReviewContext, nextGraph);

  for (const preserved of allowedChangeSet.preserved_targets) {
    const next = nextGraph.records.get(preserved.target_id);
    if (!next || next.target_type !== preserved.target_type || next.object_hash !== preserved.object_hash) {
      V.fail('PRESERVATION_REGRESSION', preserved.target_id);
    }
  }

  const mutableBaseIds = new Set([
    ...allowedChangeSet.authorized_targets.map((row) => row.target_id),
    ...allowedChangeSet.derived_targets.map((row) => row.target_id),
  ]);
  const newAllowed = allowedNewTargets(baseGraph, nextGraph, mutableBaseIds);

  for (const row of nextGraph.records.values()) {
    if (baseGraph.records.has(row.target_id)) continue;
    if (!newAllowed.has(row.target_id)) {
      V.fail('VNEXT_REVISION_UNAUTHORIZED_NEW_TARGET', row.target_id);
    }
  }

  const previousFindings = new Set(allowedChangeSet.blocking_finding_ids);
  for (const finding of nextReviewReport.findings) {
    if (previousFindings.has(finding.finding_id)) {
      V.fail('REVISION_STALLED', finding.finding_id);
    }
  }

  const preservedIds = new Set(allowedChangeSet.preserved_targets.map((row) => row.target_id));
  for (const finding of nextReviewReport.findings.filter((row) => row.blocking)) {
    if (preservedIds.has(finding.target_id)) {
      V.fail('PRESERVATION_REGRESSION', finding.target_id);
    }
  }

  let status;
  if (nextReviewReport.verdict === 'APPROVE') status = 'RESOLVED';
  else if (nextReviewReport.verdict === 'REVISE') status = 'REVIEW_AGAIN';
  else status = 'CLARIFICATION_REQUIRED';

  return V.sealContract({
    schema_version: OUTCOME_SCHEMA,
    allowed_change_set_hash: allowedChangeSet.contract_hash,
    revision_patch_hash: revisionPatch.contract_hash,
    next_review_context_hash: nextReviewContext.contract_hash,
    next_review_report_hash: nextReviewReport.contract_hash,
    finding_resolution_set_hash: findingResolutionSet.contract_hash,
    next_finding_ledger_hash: nextFindingLedger.contract_hash,
    status,
    preserved_target_count: allowedChangeSet.preserved_targets.length,
    authorized_target_count: allowedChangeSet.authorized_targets.length,
    derived_target_count: allowedChangeSet.derived_targets.length,
    new_target_count: [...nextGraph.records.keys()].filter((id) => !baseGraph.records.has(id)).length,
  });
}

module.exports = {
  ALLOWED_SCHEMA,
  PATCH_SCHEMA,
  APPLICATION_SCHEMA,
  OUTCOME_SCHEMA,
  STAGE_PRIORITY,
  buildArtifactGraph,
  buildAllowedChangeSet,
  validateAllowedChangeSet,
  revisionOutputSchema,
  buildRevisionPatch,
  validateRevisionPatch,
  applyRevisionPatch,
  verifyRevisionOutcome,
};
