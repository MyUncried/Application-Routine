'use strict';

const V = require('./vnext-contract');
const Review = require('./review-contract');

const AUDIT_MANIFEST_SCHEMA = 'kodjo.vnext.audit-manifest.v1';
const FINDING_ASSESSMENT_SCHEMA = 'kodjo.vnext.finding-assessment.v1';
const FINDING_RESOLUTION_SCHEMA = 'kodjo.vnext.finding-resolution-set.v1';
const FINDING_LEDGER_SCHEMA = 'kodjo.vnext.finding-ledger.v1';
const AUDIT_COVERAGE_SCHEMA = 'kodjo.vnext.audit-coverage.v1';
const FINAL_AUDIT_OUTCOME_SCHEMA = 'kodjo.vnext.final-audit-outcome.v1';

const CRITERION_APPLICABILITY = Object.freeze(['REQUIRED', 'CONDITIONAL']);
const FINDING_CLASSIFICATIONS = Object.freeze(['DEFECT', 'SUGGESTION']);
const RESOLUTION_DISPOSITIONS = Object.freeze(['RESOLVED', 'REFUTED']);
const LEDGER_STATUSES = Object.freeze(['OPEN', 'RESOLVED', 'REFUTED', 'SUGGESTION']);
const COVERAGE_STATUSES = Object.freeze(['CHECKED_PASS', 'CHECKED_FINDING', 'NOT_APPLICABLE']);

function buildAuditManifest({ candidateHead, sources, criteria }) {
  V.assertSha40(candidateHead, 'VNEXT_AUDIT_MANIFEST_HEAD_INVALID', 'candidateHead');
  if (!Array.isArray(sources) || sources.length === 0) {
    V.fail('VNEXT_AUDIT_MANIFEST_SOURCES_INVALID');
  }
  if (!Array.isArray(criteria) || criteria.length === 0) {
    V.fail('VNEXT_AUDIT_MANIFEST_CRITERIA_INVALID');
  }

  const normalizedSources = sources.map((row, index) => {
    V.assertExactKeys(
      row,
      ['source_ref', 'source_hash'],
      [],
      'VNEXT_AUDIT_SOURCE_KEYS_INVALID',
    );
    V.assertUnicodeExactText(row.source_ref, 'VNEXT_AUDIT_SOURCE_REF_INVALID', `sources[${index}].source_ref`);
    V.assertSha64(row.source_hash, 'VNEXT_AUDIT_SOURCE_HASH_INVALID', `sources[${index}].source_hash`);
    return { source_ref: row.source_ref, source_hash: row.source_hash };
  }).sort((a, b) => a.source_ref.localeCompare(b.source_ref));

  if (new Set(normalizedSources.map((row) => row.source_ref)).size !== normalizedSources.length) {
    V.fail('VNEXT_AUDIT_SOURCE_DUPLICATE');
  }
  const sourceRefs = new Set(normalizedSources.map((row) => row.source_ref));

  const normalizedCriteria = criteria.map((row, index) => {
    V.assertExactKeys(
      row,
      ['source_ref', 'clause', 'statement', 'applicability'],
      [],
      'VNEXT_AUDIT_CRITERION_KEYS_INVALID',
    );
    if (!sourceRefs.has(row.source_ref)) V.fail('VNEXT_AUDIT_CRITERION_SOURCE_UNKNOWN', row.source_ref);
    V.assertUnicodeExactText(row.clause, 'VNEXT_AUDIT_CRITERION_CLAUSE_INVALID', `criteria[${index}].clause`);
    V.assertUnicodeExactText(row.statement, 'VNEXT_AUDIT_CRITERION_STATEMENT_INVALID', `criteria[${index}].statement`);
    if (!CRITERION_APPLICABILITY.includes(row.applicability)) {
      V.fail('VNEXT_AUDIT_CRITERION_APPLICABILITY_INVALID', row.applicability);
    }
    return {
      audit_criterion_id: V.stableId('AUD', [
        row.source_ref,
        row.clause,
        row.statement,
        row.applicability,
      ]),
      source_ref: row.source_ref,
      clause: row.clause,
      statement: row.statement,
      applicability: row.applicability,
    };
  }).sort((a, b) => a.audit_criterion_id.localeCompare(b.audit_criterion_id));

  if (new Set(normalizedCriteria.map((row) => row.audit_criterion_id)).size !== normalizedCriteria.length) {
    V.fail('VNEXT_AUDIT_CRITERION_DUPLICATE');
  }

  return V.sealContract({
    schema_version: AUDIT_MANIFEST_SCHEMA,
    candidate_head: candidateHead,
    sources: normalizedSources,
    criteria: normalizedCriteria,
    criterion_count: normalizedCriteria.length,
  });
}

function validateAuditManifest(manifest) {
  V.assertExactKeys(
    manifest,
    ['schema_version', 'candidate_head', 'sources', 'criteria', 'criterion_count', 'contract_hash'],
    [],
    'VNEXT_AUDIT_MANIFEST_KEYS_INVALID',
  );
  if (manifest.schema_version !== AUDIT_MANIFEST_SCHEMA) V.fail('VNEXT_AUDIT_MANIFEST_SCHEMA_INVALID');
  V.verifyContractHash(manifest, 'VNEXT_AUDIT_MANIFEST_HASH_MISMATCH');
  const rebuilt = buildAuditManifest({
    candidateHead: manifest.candidate_head,
    sources: manifest.sources.map(({ source_ref, source_hash }) => ({ source_ref, source_hash })),
    criteria: manifest.criteria.map(({ source_ref, clause, statement, applicability }) => ({
      source_ref,
      clause,
      statement,
      applicability,
    })),
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(manifest)) {
    V.fail('VNEXT_AUDIT_MANIFEST_REBUILD_MISMATCH');
  }
  return true;
}

function buildFindingAssessment({ auditManifest, reviewContext, reviewReport, assessments }) {
  validateAuditManifest(auditManifest);
  Review.validateReviewReport(reviewReport, reviewContext);
  if (!Array.isArray(assessments)) V.fail('VNEXT_FINDING_ASSESSMENTS_INVALID');

  const criteria = new Set(auditManifest.criteria.map((row) => row.audit_criterion_id));
  const findings = new Map(reviewReport.findings.map((row) => [row.finding_id, row]));
  const seen = new Set();

  const normalized = assessments.map((row, index) => {
    V.assertExactKeys(
      row,
      ['finding_id', 'classification', 'normative_criterion_ids', 'rationale'],
      [],
      'VNEXT_FINDING_ASSESSMENT_KEYS_INVALID',
    );
    const finding = findings.get(row.finding_id);
    if (!finding) V.fail('VNEXT_FINDING_ASSESSMENT_FINDING_UNKNOWN', row.finding_id);
    if (seen.has(row.finding_id)) V.fail('VNEXT_FINDING_ASSESSMENT_DUPLICATE', row.finding_id);
    seen.add(row.finding_id);
    if (!FINDING_CLASSIFICATIONS.includes(row.classification)) {
      V.fail('VNEXT_FINDING_ASSESSMENT_CLASSIFICATION_INVALID', row.classification);
    }
    const normativeIds = V.uniqueStrings(
      row.normative_criterion_ids,
      'VNEXT_FINDING_ASSESSMENT_NORMATIVE_IDS_INVALID',
      `assessments[${index}].normative_criterion_ids`,
      { allowEmpty: true },
    ).sort();
    for (const id of normativeIds) {
      if (!criteria.has(id)) V.fail('VNEXT_FINDING_ASSESSMENT_CRITERION_UNKNOWN', id);
    }
    V.assertUnicodeExactText(
      row.rationale,
      'VNEXT_FINDING_ASSESSMENT_RATIONALE_INVALID',
      `assessments[${index}].rationale`,
    );

    if (finding.blocking) {
      if (row.classification !== 'DEFECT') {
        V.fail('VNEXT_BLOCKING_FINDING_MUST_BE_DEFECT', row.finding_id);
      }
      if (normativeIds.length === 0) {
        V.fail('VNEXT_BLOCKING_FINDING_NORMATIVE_PROVENANCE_REQUIRED', row.finding_id);
      }
    } else {
      if (finding.category !== 'SUGGESTION' || row.classification !== 'SUGGESTION') {
        V.fail('VNEXT_NON_BLOCKING_FINDING_CLASSIFICATION_INVALID', row.finding_id);
      }
    }

    return {
      finding_id: row.finding_id,
      classification: row.classification,
      normative_criterion_ids: normativeIds,
      rationale: row.rationale,
    };
  }).sort((a, b) => a.finding_id.localeCompare(b.finding_id));

  if (normalized.length !== reviewReport.findings.length) {
    const missing = [...findings.keys()].filter((id) => !seen.has(id)).sort();
    V.fail('VNEXT_FINDING_ASSESSMENT_INCOMPLETE', missing.join(','));
  }

  return V.sealContract({
    schema_version: FINDING_ASSESSMENT_SCHEMA,
    audit_manifest_hash: auditManifest.contract_hash,
    review_report_hash: reviewReport.contract_hash,
    assessments: normalized,
  });
}

function validateFindingAssessment(assessment, { auditManifest, reviewContext, reviewReport }) {
  V.assertExactKeys(
    assessment,
    ['schema_version', 'audit_manifest_hash', 'review_report_hash', 'assessments', 'contract_hash'],
    [],
    'VNEXT_FINDING_ASSESSMENT_CONTRACT_KEYS_INVALID',
  );
  if (assessment.schema_version !== FINDING_ASSESSMENT_SCHEMA) {
    V.fail('VNEXT_FINDING_ASSESSMENT_SCHEMA_INVALID');
  }
  V.verifyContractHash(assessment, 'VNEXT_FINDING_ASSESSMENT_HASH_MISMATCH');
  const rebuilt = buildFindingAssessment({
    auditManifest,
    reviewContext,
    reviewReport,
    assessments: assessment.assessments,
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(assessment)) {
    V.fail('VNEXT_FINDING_ASSESSMENT_REBUILD_MISMATCH');
  }
  return true;
}

function buildFindingResolutionSet({
  auditManifest,
  previousReviewReport,
  nextReviewContext,
  nextReviewReport,
  resolutions,
}) {
  validateAuditManifest(auditManifest);
  Review.validateReviewReport(nextReviewReport, nextReviewContext);
  V.verifyContractHash(previousReviewReport, 'VNEXT_FINDING_RESOLUTION_PREVIOUS_REPORT_HASH_INVALID');
  if (!Array.isArray(resolutions)) V.fail('VNEXT_FINDING_RESOLUTIONS_INVALID');

  const previousBlocking = previousReviewReport.findings.filter((row) => row.blocking);
  const previousIds = new Set(previousBlocking.map((row) => row.finding_id));
  const nextIds = new Set(nextReviewReport.findings.map((row) => row.finding_id));
  const requiredResolutionIds = [...previousIds].filter((id) => !nextIds.has(id)).sort();
  const allNextTargets = new Set(
    Object.values(nextReviewContext.target_catalog).flat(),
  );
  const seen = new Set();

  const normalized = resolutions.map((row, index) => {
    V.assertExactKeys(
      row,
      ['finding_id', 'disposition', 'evidence', 'evidence_target_ids', 'justification'],
      [],
      'VNEXT_FINDING_RESOLUTION_KEYS_INVALID',
    );
    if (!previousIds.has(row.finding_id)) {
      V.fail('VNEXT_FINDING_RESOLUTION_FINDING_UNKNOWN', row.finding_id);
    }
    if (nextIds.has(row.finding_id)) {
      V.fail('VNEXT_FINDING_RESOLUTION_STILL_PRESENT', row.finding_id);
    }
    if (seen.has(row.finding_id)) V.fail('VNEXT_FINDING_RESOLUTION_DUPLICATE', row.finding_id);
    seen.add(row.finding_id);
    if (!RESOLUTION_DISPOSITIONS.includes(row.disposition)) {
      V.fail('VNEXT_FINDING_RESOLUTION_DISPOSITION_INVALID', row.disposition);
    }
    const evidence = V.uniqueStrings(
      row.evidence,
      'VNEXT_FINDING_RESOLUTION_EVIDENCE_INVALID',
      `resolutions[${index}].evidence`,
    ).sort();
    const targetIds = V.uniqueStrings(
      row.evidence_target_ids,
      'VNEXT_FINDING_RESOLUTION_TARGETS_INVALID',
      `resolutions[${index}].evidence_target_ids`,
    ).sort();
    for (const id of targetIds) {
      if (!allNextTargets.has(id)) V.fail('VNEXT_FINDING_RESOLUTION_TARGET_UNKNOWN', id);
    }
    V.assertUnicodeExactText(
      row.justification,
      'VNEXT_FINDING_RESOLUTION_JUSTIFICATION_INVALID',
      `resolutions[${index}].justification`,
    );
    return {
      resolution_id: V.stableId('RES', [
        row.finding_id,
        row.disposition,
        evidence,
        targetIds,
        row.justification,
      ]),
      finding_id: row.finding_id,
      disposition: row.disposition,
      evidence,
      evidence_target_ids: targetIds,
      justification: row.justification,
    };
  }).sort((a, b) => a.finding_id.localeCompare(b.finding_id));

  if (V.canonicalStringify([...seen].sort()) !== V.canonicalStringify(requiredResolutionIds)) {
    const missing = requiredResolutionIds.filter((id) => !seen.has(id));
    const extra = [...seen].filter((id) => !requiredResolutionIds.includes(id));
    V.fail(
      'VNEXT_FINDING_RESOLUTION_INCOMPLETE',
      `missing=[${missing.join(',')}] extra=[${extra.join(',')}]`,
    );
  }

  return V.sealContract({
    schema_version: FINDING_RESOLUTION_SCHEMA,
    audit_manifest_hash: auditManifest.contract_hash,
    previous_review_report_hash: previousReviewReport.contract_hash,
    next_review_report_hash: nextReviewReport.contract_hash,
    resolutions: normalized,
  });
}

function validateFindingResolutionSet(set, {
  auditManifest,
  previousReviewReport,
  nextReviewContext,
  nextReviewReport,
}) {
  V.assertExactKeys(
    set,
    [
      'schema_version',
      'audit_manifest_hash',
      'previous_review_report_hash',
      'next_review_report_hash',
      'resolutions',
      'contract_hash',
    ],
    [],
    'VNEXT_FINDING_RESOLUTION_CONTRACT_KEYS_INVALID',
  );
  if (set.schema_version !== FINDING_RESOLUTION_SCHEMA) {
    V.fail('VNEXT_FINDING_RESOLUTION_SCHEMA_INVALID');
  }
  V.verifyContractHash(set, 'VNEXT_FINDING_RESOLUTION_HASH_MISMATCH');
  const rebuilt = buildFindingResolutionSet({
    auditManifest,
    previousReviewReport,
    nextReviewContext,
    nextReviewReport,
    resolutions: set.resolutions.map((row) => ({
      finding_id: row.finding_id,
      disposition: row.disposition,
      evidence: row.evidence,
      evidence_target_ids: row.evidence_target_ids,
      justification: row.justification,
    })),
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(set)) {
    V.fail('VNEXT_FINDING_RESOLUTION_REBUILD_MISMATCH');
  }
  return true;
}

function buildFindingLedgerInitial({ auditManifest, reviewContext, reviewReport, findingAssessment }) {
  validateFindingAssessment(findingAssessment, {
    auditManifest,
    reviewContext,
    reviewReport,
  });
  const assessmentById = new Map(
    findingAssessment.assessments.map((row) => [row.finding_id, row]),
  );
  const entries = reviewReport.findings.map((finding) => {
    const assessment = assessmentById.get(finding.finding_id);
    return {
      finding_id: finding.finding_id,
      status: finding.blocking ? 'OPEN' : 'SUGGESTION',
      classification: assessment.classification,
      normative_criterion_ids: assessment.normative_criterion_ids,
      introduced_review_report_hash: reviewReport.contract_hash,
      latest_review_report_hash: reviewReport.contract_hash,
      resolution_id: null,
      resolution_evidence: [],
    };
  }).sort((a, b) => a.finding_id.localeCompare(b.finding_id));

  return V.sealContract({
    schema_version: FINDING_LEDGER_SCHEMA,
    audit_manifest_hash: auditManifest.contract_hash,
    review_report_hashes: [reviewReport.contract_hash],
    entries,
    open_finding_ids: entries.filter((row) => row.status === 'OPEN').map((row) => row.finding_id),
  });
}

function validateFindingLedger(ledger) {
  V.assertExactKeys(
    ledger,
    [
      'schema_version',
      'audit_manifest_hash',
      'review_report_hashes',
      'entries',
      'open_finding_ids',
      'contract_hash',
    ],
    [],
    'VNEXT_FINDING_LEDGER_KEYS_INVALID',
  );
  if (ledger.schema_version !== FINDING_LEDGER_SCHEMA) V.fail('VNEXT_FINDING_LEDGER_SCHEMA_INVALID');
  V.verifyContractHash(ledger, 'VNEXT_FINDING_LEDGER_HASH_MISMATCH');
  V.assertSha64(ledger.audit_manifest_hash, 'VNEXT_FINDING_LEDGER_MANIFEST_HASH_INVALID');
  const reviewHashes = V.uniqueStrings(
    ledger.review_report_hashes,
    'VNEXT_FINDING_LEDGER_REVIEW_HASHES_INVALID',
    'review_report_hashes',
  );
  reviewHashes.forEach((hash) => V.assertSha64(hash, 'VNEXT_FINDING_LEDGER_REVIEW_HASH_INVALID'));
  if (!Array.isArray(ledger.entries)) V.fail('VNEXT_FINDING_LEDGER_ENTRIES_INVALID');
  const ids = new Set();
  const open = [];
  for (const row of ledger.entries) {
    V.assertExactKeys(
      row,
      [
        'finding_id',
        'status',
        'classification',
        'normative_criterion_ids',
        'introduced_review_report_hash',
        'latest_review_report_hash',
        'resolution_id',
        'resolution_evidence',
      ],
      [],
      'VNEXT_FINDING_LEDGER_ENTRY_KEYS_INVALID',
    );
    if (ids.has(row.finding_id)) V.fail('VNEXT_FINDING_LEDGER_ENTRY_DUPLICATE', row.finding_id);
    ids.add(row.finding_id);
    if (!LEDGER_STATUSES.includes(row.status)) V.fail('VNEXT_FINDING_LEDGER_STATUS_INVALID', row.status);
    if (!FINDING_CLASSIFICATIONS.includes(row.classification)) {
      V.fail('VNEXT_FINDING_LEDGER_CLASSIFICATION_INVALID', row.classification);
    }
    if (row.status === 'OPEN') open.push(row.finding_id);
    if (['RESOLVED', 'REFUTED'].includes(row.status)) {
      V.assertNonEmptyString(row.resolution_id, 'VNEXT_FINDING_LEDGER_RESOLUTION_ID_REQUIRED');
      if (!Array.isArray(row.resolution_evidence) || row.resolution_evidence.length === 0) {
        V.fail('VNEXT_FINDING_LEDGER_RESOLUTION_EVIDENCE_REQUIRED', row.finding_id);
      }
    } else if (row.resolution_id !== null || row.resolution_evidence.length !== 0) {
      V.fail('VNEXT_FINDING_LEDGER_UNRESOLVED_EVIDENCE_FORBIDDEN', row.finding_id);
    }
  }
  if (V.canonicalStringify([...open].sort()) !== V.canonicalStringify([...ledger.open_finding_ids].sort())) {
    V.fail('VNEXT_FINDING_LEDGER_OPEN_SET_MISMATCH');
  }
  return true;
}

function advanceFindingLedgerWithPreviousReport({
  previousLedger,
  previousReviewReport,
  auditManifest,
  nextReviewContext,
  nextReviewReport,
  nextFindingAssessment,
  findingResolutionSet,
}) {
  validateFindingLedger(previousLedger);
  validateAuditManifest(auditManifest);
  Review.validateReviewReport(nextReviewReport, nextReviewContext);
  if (previousLedger.audit_manifest_hash !== auditManifest.contract_hash) {
    V.fail('VNEXT_FINDING_LEDGER_AUDIT_MANIFEST_CHANGED');
  }
  if (!previousLedger.review_report_hashes.includes(previousReviewReport.contract_hash)) {
    V.fail('VNEXT_FINDING_LEDGER_PREVIOUS_REPORT_UNKNOWN');
  }
  validateFindingAssessment(nextFindingAssessment, {
    auditManifest,
    reviewContext: nextReviewContext,
    reviewReport: nextReviewReport,
  });
  validateFindingResolutionSet(findingResolutionSet, {
    auditManifest,
    previousReviewReport,
    nextReviewContext,
    nextReviewReport,
  });

  const nextAssessmentById = new Map(
    nextFindingAssessment.assessments.map((row) => [row.finding_id, row]),
  );
  const nextFindings = new Map(nextReviewReport.findings.map((row) => [row.finding_id, row]));
  const resolutions = new Map(
    findingResolutionSet.resolutions.map((row) => [row.finding_id, row]),
  );
  const entries = new Map(previousLedger.entries.map((row) => [row.finding_id, { ...row }]));

  for (const row of previousLedger.entries) {
    if (row.status === 'OPEN') {
      if (nextFindings.has(row.finding_id)) V.fail('REVISION_STALLED', row.finding_id);
      const resolution = resolutions.get(row.finding_id);
      if (!resolution) V.fail('VNEXT_FINDING_DISAPPEARED_WITHOUT_RESOLUTION', row.finding_id);
      const next = entries.get(row.finding_id);
      next.status = resolution.disposition;
      next.latest_review_report_hash = nextReviewReport.contract_hash;
      next.resolution_id = resolution.resolution_id;
      next.resolution_evidence = resolution.evidence;
    } else if (['RESOLVED', 'REFUTED'].includes(row.status) && nextFindings.has(row.finding_id)) {
      V.fail('VNEXT_FINDING_REOPENED', row.finding_id);
    }
  }

  for (const finding of nextReviewReport.findings) {
    if (entries.has(finding.finding_id)) continue;
    const assessment = nextAssessmentById.get(finding.finding_id);
    entries.set(finding.finding_id, {
      finding_id: finding.finding_id,
      status: finding.blocking ? 'OPEN' : 'SUGGESTION',
      classification: assessment.classification,
      normative_criterion_ids: assessment.normative_criterion_ids,
      introduced_review_report_hash: nextReviewReport.contract_hash,
      latest_review_report_hash: nextReviewReport.contract_hash,
      resolution_id: null,
      resolution_evidence: [],
    });
  }

  const normalizedEntries = [...entries.values()].sort((a, b) => a.finding_id.localeCompare(b.finding_id));
  const reviewHashes = [...previousLedger.review_report_hashes, nextReviewReport.contract_hash];

  return V.sealContract({
    schema_version: FINDING_LEDGER_SCHEMA,
    audit_manifest_hash: auditManifest.contract_hash,
    review_report_hashes: reviewHashes,
    entries: normalizedEntries,
    open_finding_ids: normalizedEntries.filter((row) => row.status === 'OPEN').map((row) => row.finding_id),
  });
}

function buildAuditCoverage({
  auditManifest,
  reviewReport,
  findingAssessment,
  coverage,
}) {
  validateAuditManifest(auditManifest);
  V.verifyContractHash(reviewReport, 'VNEXT_AUDIT_COVERAGE_REVIEW_HASH_INVALID');
  V.verifyContractHash(findingAssessment, 'VNEXT_AUDIT_COVERAGE_ASSESSMENT_HASH_INVALID');
  if (findingAssessment.audit_manifest_hash !== auditManifest.contract_hash
      || findingAssessment.review_report_hash !== reviewReport.contract_hash) {
    V.fail('VNEXT_AUDIT_COVERAGE_BINDING_MISMATCH');
  }
  if (!Array.isArray(coverage)) V.fail('VNEXT_AUDIT_COVERAGE_ROWS_INVALID');

  const criterionById = new Map(
    auditManifest.criteria.map((row) => [row.audit_criterion_id, row]),
  );
  const findingIds = new Set(reviewReport.findings.map((row) => row.finding_id));
  const defectFindingsByCriterion = new Map(
    auditManifest.criteria.map((row) => [row.audit_criterion_id, []]),
  );
  for (const assessment of findingAssessment.assessments) {
    if (assessment.classification !== 'DEFECT') continue;
    for (const criterionId of assessment.normative_criterion_ids) {
      defectFindingsByCriterion.get(criterionId).push(assessment.finding_id);
    }
  }
  for (const list of defectFindingsByCriterion.values()) list.sort();
  const seen = new Set();

  const normalized = coverage.map((row, index) => {
    V.assertExactKeys(
      row,
      ['audit_criterion_id', 'status', 'finding_ids', 'evidence', 'justification'],
      [],
      'VNEXT_AUDIT_COVERAGE_ROW_KEYS_INVALID',
    );
    const criterion = criterionById.get(row.audit_criterion_id);
    if (!criterion) V.fail('VNEXT_AUDIT_COVERAGE_CRITERION_UNKNOWN', row.audit_criterion_id);
    if (seen.has(row.audit_criterion_id)) V.fail('VNEXT_AUDIT_COVERAGE_DUPLICATE', row.audit_criterion_id);
    seen.add(row.audit_criterion_id);
    if (!COVERAGE_STATUSES.includes(row.status)) V.fail('VNEXT_AUDIT_COVERAGE_STATUS_INVALID', row.status);
    const ids = V.uniqueStrings(
      row.finding_ids,
      'VNEXT_AUDIT_COVERAGE_FINDING_IDS_INVALID',
      `coverage[${index}].finding_ids`,
      { allowEmpty: true },
    ).sort();
    ids.forEach((id) => {
      if (!findingIds.has(id)) V.fail('VNEXT_AUDIT_COVERAGE_FINDING_UNKNOWN', id);
    });
    const evidence = V.uniqueStrings(
      row.evidence,
      'VNEXT_AUDIT_COVERAGE_EVIDENCE_INVALID',
      `coverage[${index}].evidence`,
    ).sort();
    V.assertUnicodeExactText(
      row.justification,
      'VNEXT_AUDIT_COVERAGE_JUSTIFICATION_INVALID',
      `coverage[${index}].justification`,
    );

    if (row.status === 'CHECKED_FINDING' && ids.length === 0) {
      V.fail('VNEXT_AUDIT_COVERAGE_FINDING_REQUIRED', row.audit_criterion_id);
    }
    if (row.status === 'CHECKED_PASS' && ids.length !== 0) {
      V.fail('VNEXT_AUDIT_COVERAGE_PASS_FINDING_FORBIDDEN', row.audit_criterion_id);
    }
    if (row.status === 'NOT_APPLICABLE') {
      if (criterion.applicability !== 'CONDITIONAL') {
        V.fail('VNEXT_AUDIT_COVERAGE_REQUIRED_NOT_APPLICABLE', row.audit_criterion_id);
      }
      if (ids.length !== 0) {
        V.fail('VNEXT_AUDIT_COVERAGE_NOT_APPLICABLE_FINDING_FORBIDDEN', row.audit_criterion_id);
      }
    }

    const expectedDefectIds = defectFindingsByCriterion.get(row.audit_criterion_id) || [];
    if (expectedDefectIds.length > 0) {
      if (row.status !== 'CHECKED_FINDING'
          || V.canonicalStringify(ids) !== V.canonicalStringify(expectedDefectIds)) {
        V.fail('VNEXT_AUDIT_COVERAGE_DEFECT_BINDING_MISMATCH', row.audit_criterion_id);
      }
    } else if (row.status === 'CHECKED_FINDING') {
      V.fail('VNEXT_AUDIT_COVERAGE_UNBOUND_FINDING', row.audit_criterion_id);
    }
    return {
      audit_criterion_id: row.audit_criterion_id,
      status: row.status,
      finding_ids: ids,
      evidence,
      justification: row.justification,
    };
  }).sort((a, b) => a.audit_criterion_id.localeCompare(b.audit_criterion_id));

  if (seen.size !== criterionById.size) {
    const missing = [...criterionById.keys()].filter((id) => !seen.has(id)).sort();
    V.fail('VNEXT_AUDIT_COVERAGE_INCOMPLETE', missing.join(','));
  }

  return V.sealContract({
    schema_version: AUDIT_COVERAGE_SCHEMA,
    audit_manifest_hash: auditManifest.contract_hash,
    review_report_hash: reviewReport.contract_hash,
    finding_assessment_hash: findingAssessment.contract_hash,
    coverage: normalized,
    checked_count: normalized.filter((row) => row.status !== 'NOT_APPLICABLE').length,
    not_applicable_count: normalized.filter((row) => row.status === 'NOT_APPLICABLE').length,
  });
}

function validateAuditCoverage(coverageReport, { auditManifest, reviewReport, findingAssessment }) {
  V.assertExactKeys(
    coverageReport,
    [
      'schema_version',
      'audit_manifest_hash',
      'review_report_hash',
      'finding_assessment_hash',
      'coverage',
      'checked_count',
      'not_applicable_count',
      'contract_hash',
    ],
    [],
    'VNEXT_AUDIT_COVERAGE_KEYS_INVALID',
  );
  if (coverageReport.schema_version !== AUDIT_COVERAGE_SCHEMA) {
    V.fail('VNEXT_AUDIT_COVERAGE_SCHEMA_INVALID');
  }
  V.verifyContractHash(coverageReport, 'VNEXT_AUDIT_COVERAGE_HASH_MISMATCH');
  const rebuilt = buildAuditCoverage({
    auditManifest,
    reviewReport,
    findingAssessment,
    coverage: coverageReport.coverage,
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(coverageReport)) {
    V.fail('VNEXT_AUDIT_COVERAGE_REBUILD_MISMATCH');
  }
  return true;
}

function buildFinalAuditOutcome({
  auditManifest,
  reviewContext,
  reviewReport,
  findingAssessment,
  findingLedger,
  auditCoverage,
}) {
  validateAuditManifest(auditManifest);
  Review.validateReviewReport(reviewReport, reviewContext);
  validateFindingAssessment(findingAssessment, {
    auditManifest,
    reviewContext,
    reviewReport,
  });
  validateFindingLedger(findingLedger);
  validateAuditCoverage(auditCoverage, {
    auditManifest,
    reviewReport,
    findingAssessment,
  });
  if (findingLedger.audit_manifest_hash !== auditManifest.contract_hash) {
    V.fail('VNEXT_FINAL_AUDIT_LEDGER_MANIFEST_MISMATCH');
  }
  if (!findingLedger.review_report_hashes.includes(reviewReport.contract_hash)) {
    V.fail('VNEXT_FINAL_AUDIT_LEDGER_REPORT_MISMATCH');
  }

  let status;
  let nextAction;
  if (reviewReport.verdict === 'APPROVE') {
    if (findingLedger.open_finding_ids.length !== 0) {
      V.fail('VNEXT_FINAL_AUDIT_OPEN_FINDINGS_BLOCK_APPROVAL', findingLedger.open_finding_ids.join(','));
    }
    status = 'FINAL_APPROVED';
    nextAction = 'READY_FOR_CUTOVER_GATE';
  } else if (reviewReport.verdict === 'REVISE') {
    status = 'FINAL_REVISE_TERMINAL';
    nextAction = 'STOP_AND_REMEDIATE_WITHOUT_AUTOMATIC_REAUDIT';
  } else {
    status = 'FINAL_CLARIFICATION_TERMINAL';
    nextAction = 'STOP_FOR_USER_DECISION';
  }

  return V.sealContract({
    schema_version: FINAL_AUDIT_OUTCOME_SCHEMA,
    audit_manifest_hash: auditManifest.contract_hash,
    review_report_hash: reviewReport.contract_hash,
    finding_assessment_hash: findingAssessment.contract_hash,
    finding_ledger_hash: findingLedger.contract_hash,
    audit_coverage_hash: auditCoverage.contract_hash,
    status,
    next_action: nextAction,
    automatic_reaudit_allowed: false,
  });
}

function validateFinalAuditOutcome(outcome) {
  V.assertExactKeys(
    outcome,
    [
      'schema_version',
      'audit_manifest_hash',
      'review_report_hash',
      'finding_assessment_hash',
      'finding_ledger_hash',
      'audit_coverage_hash',
      'status',
      'next_action',
      'automatic_reaudit_allowed',
      'contract_hash',
    ],
    [],
    'VNEXT_FINAL_AUDIT_OUTCOME_KEYS_INVALID',
  );
  if (outcome.schema_version !== FINAL_AUDIT_OUTCOME_SCHEMA) {
    V.fail('VNEXT_FINAL_AUDIT_OUTCOME_SCHEMA_INVALID');
  }
  V.verifyContractHash(outcome, 'VNEXT_FINAL_AUDIT_OUTCOME_HASH_MISMATCH');
  const expectedActions = {
    FINAL_APPROVED: 'READY_FOR_CUTOVER_GATE',
    FINAL_REVISE_TERMINAL: 'STOP_AND_REMEDIATE_WITHOUT_AUTOMATIC_REAUDIT',
    FINAL_CLARIFICATION_TERMINAL: 'STOP_FOR_USER_DECISION',
  };
  if (!Object.hasOwn(expectedActions, outcome.status)) {
    V.fail('VNEXT_FINAL_AUDIT_OUTCOME_STATUS_INVALID');
  }
  if (outcome.next_action !== expectedActions[outcome.status]) {
    V.fail('VNEXT_FINAL_AUDIT_NEXT_ACTION_MISMATCH');
  }
  for (const [label, hash] of [
    ['audit_manifest_hash', outcome.audit_manifest_hash],
    ['review_report_hash', outcome.review_report_hash],
    ['finding_assessment_hash', outcome.finding_assessment_hash],
    ['finding_ledger_hash', outcome.finding_ledger_hash],
    ['audit_coverage_hash', outcome.audit_coverage_hash],
  ]) {
    V.assertSha64(hash, 'VNEXT_FINAL_AUDIT_HASH_INVALID', label);
  }
  if (outcome.automatic_reaudit_allowed !== false) {
    V.fail('VNEXT_FINAL_AUDIT_AUTOMATIC_REAUDIT_FORBIDDEN');
  }
  return true;
}

module.exports = {
  AUDIT_MANIFEST_SCHEMA,
  FINDING_ASSESSMENT_SCHEMA,
  FINDING_RESOLUTION_SCHEMA,
  FINDING_LEDGER_SCHEMA,
  AUDIT_COVERAGE_SCHEMA,
  FINAL_AUDIT_OUTCOME_SCHEMA,
  CRITERION_APPLICABILITY,
  FINDING_CLASSIFICATIONS,
  RESOLUTION_DISPOSITIONS,
  LEDGER_STATUSES,
  COVERAGE_STATUSES,
  buildAuditManifest,
  validateAuditManifest,
  buildFindingAssessment,
  validateFindingAssessment,
  buildFindingResolutionSet,
  validateFindingResolutionSet,
  buildFindingLedgerInitial,
  validateFindingLedger,
  advanceFindingLedgerWithPreviousReport,
  buildAuditCoverage,
  validateAuditCoverage,
  buildFinalAuditOutcome,
  validateFinalAuditOutcome,
};
