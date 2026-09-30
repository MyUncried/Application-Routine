'use strict';

const V = require('./vnext-contract');
const Review = require('./review-contract');

const MANIFEST_SCHEMA = 'kodjo.vnext.audit-manifest.v1';
const COVERAGE_SCHEMA = 'kodjo.vnext.audit-coverage.v2';
const LEDGER_SCHEMA = 'kodjo.vnext.finding-ledger.v1';
const FINAL_AUDIT_SCHEMA = 'kodjo.vnext.final-audit-report.v1';

const CRITERION_APPLICABILITY = Object.freeze(['REQUIRED', 'NOT_APPLICABLE']);
const COVERAGE_STATUSES = Object.freeze(['CHECKED_PASS', 'CHECKED_FAIL', 'NON_VERIFIABLE', 'NOT_APPLICABLE']);
const RESOLUTION_STATUSES = Object.freeze(['RESOLVED', 'REFUTED_WITH_EVIDENCE']);

function uniqueSorted(values, code, label, options = {}) {
  return V.uniqueStrings(values, code, label, options).sort();
}

function buildAuditManifest({
  candidateHead,
  protocolSpecHash,
  normativeReferences,
  criteria,
  createdFromRefs,
}) {
  V.assertSha40(candidateHead, 'VNEXT_AUDIT_CANDIDATE_HEAD_INVALID', 'candidateHead');
  V.assertSha64(protocolSpecHash, 'VNEXT_AUDIT_PROTOCOL_SPEC_HASH_INVALID', 'protocolSpecHash');
  if (!Array.isArray(normativeReferences) || normativeReferences.length === 0) {
    V.fail('VNEXT_AUDIT_NORMATIVE_REFERENCES_INVALID');
  }
  const refIds = new Set();
  const refs = normativeReferences.map((row, index) => {
    V.assertExactKeys(
      row,
      ['reference_id', 'kind', 'locator', 'fingerprint'],
      [],
      'VNEXT_AUDIT_NORMATIVE_REFERENCE_KEYS_INVALID',
    );
    V.assertNonEmptyString(row.reference_id, 'VNEXT_AUDIT_NORMATIVE_REFERENCE_ID_INVALID');
    V.assertNonEmptyString(row.kind, 'VNEXT_AUDIT_NORMATIVE_REFERENCE_KIND_INVALID');
    V.assertUnicodeExactText(row.locator, 'VNEXT_AUDIT_NORMATIVE_REFERENCE_LOCATOR_INVALID', 'locator');
    V.assertSha64(row.fingerprint, 'VNEXT_AUDIT_NORMATIVE_REFERENCE_FINGERPRINT_INVALID', 'fingerprint');
    if (refIds.has(row.reference_id)) V.fail('VNEXT_AUDIT_NORMATIVE_REFERENCE_DUPLICATE', row.reference_id);
    refIds.add(row.reference_id);
    return Object.freeze({
      reference_id: row.reference_id,
      kind: row.kind,
      locator: row.locator,
      fingerprint: row.fingerprint,
      ordinal: index,
    });
  });

  if (!Array.isArray(criteria) || criteria.length === 0) V.fail('VNEXT_AUDIT_CRITERIA_INVALID');
  const criterionIds = new Set();
  const normalizedCriteria = criteria.map((row) => {
    V.assertExactKeys(
      row,
      ['criterion_id', 'title', 'applicability', 'normative_reference_ids'],
      [],
      'VNEXT_AUDIT_CRITERION_KEYS_INVALID',
    );
    V.assertNonEmptyString(row.criterion_id, 'VNEXT_AUDIT_CRITERION_ID_INVALID');
    V.assertUnicodeExactText(row.title, 'VNEXT_AUDIT_CRITERION_TITLE_INVALID', 'title');
    if (!CRITERION_APPLICABILITY.includes(row.applicability)) {
      V.fail('VNEXT_AUDIT_CRITERION_APPLICABILITY_INVALID', row.applicability);
    }
    if (criterionIds.has(row.criterion_id)) V.fail('VNEXT_AUDIT_CRITERION_DUPLICATE', row.criterion_id);
    criterionIds.add(row.criterion_id);
    const normativeIds = uniqueSorted(
      row.normative_reference_ids,
      'VNEXT_AUDIT_CRITERION_NORMATIVE_REFS_INVALID',
      'normative_reference_ids',
    );
    for (const id of normativeIds) {
      if (!refIds.has(id)) V.fail('VNEXT_AUDIT_CRITERION_NORMATIVE_REF_UNKNOWN', id);
    }
    return Object.freeze({
      criterion_id: row.criterion_id,
      title: row.title,
      applicability: row.applicability,
      normative_reference_ids: normativeIds,
    });
  }).sort((a, b) => a.criterion_id.localeCompare(b.criterion_id));

  return V.sealContract({
    schema_version: MANIFEST_SCHEMA,
    candidate_head: candidateHead,
    protocol_spec_hash: protocolSpecHash,
    normative_references: refs,
    criteria: normalizedCriteria,
    created_from_refs: uniqueSorted(
      createdFromRefs,
      'VNEXT_AUDIT_CREATED_FROM_REFS_INVALID',
      'createdFromRefs',
    ),
  });
}

function validateAuditManifest(manifest) {
  V.assertExactKeys(
    manifest,
    [
      'schema_version',
      'candidate_head',
      'protocol_spec_hash',
      'normative_references',
      'criteria',
      'created_from_refs',
      'contract_hash',
    ],
    [],
    'VNEXT_AUDIT_MANIFEST_KEYS_INVALID',
  );
  if (manifest.schema_version !== MANIFEST_SCHEMA) V.fail('VNEXT_AUDIT_MANIFEST_SCHEMA_INVALID');
  V.verifyContractHash(manifest, 'VNEXT_AUDIT_MANIFEST_HASH_MISMATCH');
  const rebuilt = buildAuditManifest({
    candidateHead: manifest.candidate_head,
    protocolSpecHash: manifest.protocol_spec_hash,
    normativeReferences: manifest.normative_references.map((row) => ({
      reference_id: row.reference_id,
      kind: row.kind,
      locator: row.locator,
      fingerprint: row.fingerprint,
    })),
    criteria: manifest.criteria,
    createdFromRefs: manifest.created_from_refs,
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(manifest)) {
    V.fail('VNEXT_AUDIT_MANIFEST_REBUILD_MISMATCH');
  }
  return true;
}

function buildAuditCoverage({ auditManifest, assessments }) {
  validateAuditManifest(auditManifest);
  if (!Array.isArray(assessments)) V.fail('VNEXT_AUDIT_ASSESSMENTS_INVALID');
  const expected = new Map(auditManifest.criteria.map((row) => [row.criterion_id, row]));
  const seen = new Set();
  const rows = assessments.map((row) => {
    V.assertExactKeys(
      row,
      ['criterion_id', 'status', 'evidence_refs', 'note'],
      [],
      'VNEXT_AUDIT_ASSESSMENT_KEYS_INVALID',
    );
    const criterion = expected.get(row.criterion_id);
    if (!criterion) V.fail('VNEXT_AUDIT_ASSESSMENT_CRITERION_UNKNOWN', row.criterion_id);
    if (seen.has(row.criterion_id)) V.fail('VNEXT_AUDIT_ASSESSMENT_DUPLICATE', row.criterion_id);
    seen.add(row.criterion_id);
    if (!COVERAGE_STATUSES.includes(row.status)) V.fail('VNEXT_AUDIT_ASSESSMENT_STATUS_INVALID', row.status);
    if (criterion.applicability === 'REQUIRED' && row.status === 'NOT_APPLICABLE') {
      V.fail('VNEXT_AUDIT_REQUIRED_CRITERION_NOT_APPLICABLE', row.criterion_id);
    }
    if (criterion.applicability === 'NOT_APPLICABLE' && row.status !== 'NOT_APPLICABLE') {
      V.fail('VNEXT_AUDIT_NOT_APPLICABLE_CRITERION_CHECKED', row.criterion_id);
    }
    const evidence = uniqueSorted(
      row.evidence_refs,
      'VNEXT_AUDIT_ASSESSMENT_EVIDENCE_INVALID',
      'evidence_refs',
      { allowEmpty: row.status === 'NOT_APPLICABLE' },
    );
    V.assertUnicodeExactText(row.note, 'VNEXT_AUDIT_ASSESSMENT_NOTE_INVALID', 'note');
    return Object.freeze({
      criterion_id: row.criterion_id,
      status: row.status,
      evidence_refs: evidence,
      note: row.note,
    });
  }).sort((a, b) => a.criterion_id.localeCompare(b.criterion_id));

  if (seen.size !== expected.size) {
    const missing = [...expected.keys()].filter((id) => !seen.has(id));
    V.fail('VNEXT_AUDIT_CRITERION_UNCOVERED', missing.join(','));
  }

  const failed = rows.filter((row) => row.status === 'CHECKED_FAIL').map((row) => row.criterion_id);
  return V.sealContract({
    schema_version: COVERAGE_SCHEMA,
    audit_manifest_hash: auditManifest.contract_hash,
    criterion_count: rows.length,
    failed_criterion_ids: failed,
    unavailable_criterion_ids: rows.filter((row) => row.status === 'NON_VERIFIABLE').map((row) => row.criterion_id),
    assessments: rows,
  });
}

function validateAuditCoverage(coverage, auditManifest) {
  V.assertExactKeys(
    coverage,
    [
      'schema_version',
      'audit_manifest_hash',
      'criterion_count',
      'failed_criterion_ids',
      'unavailable_criterion_ids',
      'assessments',
      'contract_hash',
    ],
    [],
    'VNEXT_AUDIT_COVERAGE_KEYS_INVALID',
  );
  if (coverage.schema_version !== COVERAGE_SCHEMA) V.fail('VNEXT_AUDIT_COVERAGE_SCHEMA_INVALID');
  V.verifyContractHash(coverage, 'VNEXT_AUDIT_COVERAGE_HASH_MISMATCH');
  const rebuilt = buildAuditCoverage({
    auditManifest,
    assessments: coverage.assessments,
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(coverage)) {
    V.fail('VNEXT_AUDIT_COVERAGE_REBUILD_MISMATCH');
  }
  return true;
}

function buildFindingLedger({
  previousReviewReport,
  nextReviewReport,
  resolutions,
}) {
  V.verifyContractHash(previousReviewReport, 'VNEXT_LEDGER_PREVIOUS_REPORT_HASH_MISMATCH');
  V.verifyContractHash(nextReviewReport, 'VNEXT_LEDGER_NEXT_REPORT_HASH_MISMATCH');
  if (!Array.isArray(resolutions)) V.fail('VNEXT_LEDGER_RESOLUTIONS_INVALID');

  const previousBlocking = new Map(
    previousReviewReport.findings.filter((row) => row.blocking).map((row) => [row.finding_id, row]),
  );
  const nextById = new Map(nextReviewReport.findings.map((row) => [row.finding_id, row]));
  const resolutionById = new Map();

  for (const row of resolutions) {
    V.assertExactKeys(
      row,
      ['finding_id', 'status', 'evidence_refs', 'note'],
      [],
      'VNEXT_LEDGER_RESOLUTION_KEYS_INVALID',
    );
    if (!previousBlocking.has(row.finding_id)) V.fail('VNEXT_LEDGER_RESOLUTION_FINDING_UNKNOWN', row.finding_id);
    if (resolutionById.has(row.finding_id)) V.fail('VNEXT_LEDGER_RESOLUTION_DUPLICATE', row.finding_id);
    if (!RESOLUTION_STATUSES.includes(row.status)) V.fail('VNEXT_LEDGER_RESOLUTION_STATUS_INVALID', row.status);
    const evidence = uniqueSorted(
      row.evidence_refs,
      'VNEXT_LEDGER_RESOLUTION_EVIDENCE_INVALID',
      'evidence_refs',
    );
    V.assertUnicodeExactText(row.note, 'VNEXT_LEDGER_RESOLUTION_NOTE_INVALID', 'note');
    resolutionById.set(row.finding_id, {
      finding_id: row.finding_id,
      status: row.status,
      evidence_refs: evidence,
      note: row.note,
    });
  }

  const entries = [];
  for (const [findingId, finding] of previousBlocking.entries()) {
    if (nextById.has(findingId)) {
      if (resolutionById.has(findingId)) V.fail('VNEXT_LEDGER_PERSISTING_FINDING_CANNOT_RESOLVE', findingId);
      entries.push({
        finding_id: findingId,
        origin: 'PREVIOUS_BLOCKING',
        lifecycle_status: 'OPEN',
        target_id: finding.target_id,
        evidence_refs: [],
        note: 'Finding toujours présent dans la revue suivante.',
      });
      continue;
    }
    const resolution = resolutionById.get(findingId);
    if (!resolution) V.fail('VNEXT_LEDGER_FINDING_DISAPPEARED_WITHOUT_RESOLUTION', findingId);
    entries.push({
      finding_id: findingId,
      origin: 'PREVIOUS_BLOCKING',
      lifecycle_status: resolution.status,
      target_id: finding.target_id,
      evidence_refs: resolution.evidence_refs,
      note: resolution.note,
    });
  }

  for (const finding of nextReviewReport.findings) {
    if (previousBlocking.has(finding.finding_id)) continue;
    entries.push({
      finding_id: finding.finding_id,
      origin: finding.category === 'SUGGESTION' ? 'NEW_SUGGESTION' : 'NEW_FINDING',
      lifecycle_status: finding.blocking ? 'OPEN' : 'SUGGESTION',
      target_id: finding.target_id,
      evidence_refs: finding.evidence,
      note: finding.finding,
    });
  }

  return V.sealContract({
    schema_version: LEDGER_SCHEMA,
    previous_review_report_hash: previousReviewReport.contract_hash,
    next_review_report_hash: nextReviewReport.contract_hash,
    entries: entries.sort((a, b) => a.finding_id.localeCompare(b.finding_id)),
  });
}

function validateFindingLedger(ledger, previousReviewReport, nextReviewReport) {
  V.assertExactKeys(
    ledger,
    [
      'schema_version',
      'previous_review_report_hash',
      'next_review_report_hash',
      'entries',
      'contract_hash',
    ],
    [],
    'VNEXT_LEDGER_KEYS_INVALID',
  );
  if (ledger.schema_version !== LEDGER_SCHEMA) V.fail('VNEXT_LEDGER_SCHEMA_INVALID');
  V.verifyContractHash(ledger, 'VNEXT_LEDGER_HASH_MISMATCH');
  const resolutions = ledger.entries
    .filter((row) => RESOLUTION_STATUSES.includes(row.lifecycle_status))
    .map((row) => ({
      finding_id: row.finding_id,
      status: row.lifecycle_status,
      evidence_refs: row.evidence_refs,
      note: row.note,
    }));
  const rebuilt = buildFindingLedger({
    previousReviewReport,
    nextReviewReport,
    resolutions,
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(ledger)) {
    V.fail('VNEXT_LEDGER_REBUILD_MISMATCH');
  }
  return true;
}

function buildFinalAuditReport({
  auditManifest,
  auditCoverage,
  reviewContext,
  reviewArtifacts,
  semanticAudit,
}) {
  validateAuditManifest(auditManifest);
  validateAuditCoverage(auditCoverage, auditManifest);
  Review.validateReviewContext(reviewContext);
  if (!reviewArtifacts) V.fail('VNEXT_FINAL_AUDIT_ARTIFACTS_REQUIRED');
  Review.verifyReviewContext(reviewContext, reviewArtifacts);
  if (auditManifest.candidate_head !== reviewArtifacts.currentState?.protocol_head) V.fail('VNEXT_FINAL_AUDIT_CANDIDATE_MISMATCH');
  V.assertExactKeys(
    semanticAudit,
    ['findings'],
    [],
    'VNEXT_FINAL_AUDIT_OUTPUT_KEYS_INVALID',
  );
  if (!Array.isArray(semanticAudit.findings)) V.fail('VNEXT_FINAL_AUDIT_FINDINGS_INVALID');

  const referenceIds = new Set(auditManifest.normative_references.map((row) => row.reference_id));
  const criterionIds = new Set(auditManifest.criteria.map((row) => row.criterion_id));
  const reviewFindings = [];
  const provenance = [];

  for (const row of semanticAudit.findings) {
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
        'normative_reference_ids',
        'audit_criterion_ids',
      ],
      [],
      'VNEXT_FINAL_AUDIT_FINDING_KEYS_INVALID',
    );
    const normativeIds = uniqueSorted(
      row.normative_reference_ids,
      'VNEXT_FINAL_AUDIT_NORMATIVE_REFS_INVALID',
      'normative_reference_ids',
      { allowEmpty: true },
    );
    const auditCriterionIds = uniqueSorted(
      row.audit_criterion_ids,
      'VNEXT_FINAL_AUDIT_CRITERION_IDS_INVALID',
      'audit_criterion_ids',
    );
    for (const id of normativeIds) {
      if (!referenceIds.has(id)) V.fail('VNEXT_FINAL_AUDIT_NORMATIVE_REF_UNKNOWN', id);
    }
    for (const id of auditCriterionIds) {
      if (!criterionIds.has(id)) V.fail('VNEXT_FINAL_AUDIT_CRITERION_UNKNOWN', id);
    }
    if (row.category !== 'SUGGESTION' && normativeIds.length === 0) {
      V.fail('VNEXT_FINAL_AUDIT_BLOCKING_FINDING_WITHOUT_NORMATIVE_SOURCE');
    }
    const normalizedEvidence = uniqueSorted(
      row.evidence,
      'VNEXT_FINAL_AUDIT_FINDING_EVIDENCE_INVALID',
      'evidence',
    );
    const normalizedDependencies = uniqueSorted(
      row.dependency_target_ids,
      'VNEXT_FINAL_AUDIT_FINDING_DEPENDENCIES_INVALID',
      'dependency_target_ids',
      { allowEmpty: true },
    );
    reviewFindings.push({
      category: row.category,
      target_type: row.target_type,
      target_id: row.target_id,
      finding: row.finding,
      evidence: normalizedEvidence,
      required_correction: row.required_correction,
      dependency_target_ids: normalizedDependencies,
    });
    provenance.push({
      semantic_key: V.canonicalHash([
        row.category,
        row.target_type,
        row.target_id,
        row.finding,
        normalizedEvidence,
        row.required_correction,
        normalizedDependencies,
      ]),
      normative_reference_ids: normativeIds,
      audit_criterion_ids: auditCriterionIds,
    });
  }

  const reviewReport = Review.buildReviewReport({
    reviewContext,
    semanticReview: { findings: reviewFindings },
  });

  const failedCriteria = new Set(auditCoverage.failed_criterion_ids);
  const coveredFailedCriteria = new Set(
    provenance.flatMap((row) => row.audit_criterion_ids).filter((id) => failedCriteria.has(id)),
  );
  for (const id of failedCriteria) {
    if (!coveredFailedCriteria.has(id)) V.fail('VNEXT_FINAL_AUDIT_FAILED_CRITERION_WITHOUT_FINDING', id);
  }

  let terminalStatus;
  if (reviewReport.verdict === 'APPROVE' && failedCriteria.size === 0 && auditCoverage.unavailable_criterion_ids.length === 0) {
    terminalStatus = 'FINAL_APPROVED';
  } else if (reviewReport.verdict === 'APPROVE' && failedCriteria.size === 0) {
    terminalStatus = 'FINAL_PROOF_UNAVAILABLE_TERMINAL';
  } else if (reviewReport.verdict === 'CLARIFICATION_REQUIRED') {
    terminalStatus = 'FINAL_CLARIFICATION_TERMINAL';
  } else {
    terminalStatus = 'FINAL_REVISE_TERMINAL';
  }

  return V.sealContract({
    schema_version: FINAL_AUDIT_SCHEMA,
    audit_manifest_hash: auditManifest.contract_hash,
    audit_coverage_hash: auditCoverage.contract_hash,
    review_context_hash: reviewContext.contract_hash,
    review_report: reviewReport,
    finding_provenance: provenance.sort((a, b) => a.semantic_key.localeCompare(b.semantic_key)),
    terminal_status: terminalStatus,
    reentry_allowed: false,
  });
}

function validateFinalAuditReport(report, {
  auditManifest,
  auditCoverage,
  reviewContext,
  reviewArtifacts,
}) {
  validateAuditManifest(auditManifest);
  validateAuditCoverage(auditCoverage, auditManifest);
  Review.validateReviewContext(reviewContext);
  if (!reviewArtifacts) V.fail('VNEXT_FINAL_AUDIT_ARTIFACTS_REQUIRED');
  Review.verifyReviewContext(reviewContext, reviewArtifacts);
  if (auditManifest.candidate_head !== reviewArtifacts.currentState?.protocol_head) V.fail('VNEXT_FINAL_AUDIT_CANDIDATE_MISMATCH');
  V.assertExactKeys(
    report,
    [
      'schema_version',
      'audit_manifest_hash',
      'audit_coverage_hash',
      'review_context_hash',
      'review_report',
      'finding_provenance',
      'terminal_status',
      'reentry_allowed',
      'contract_hash',
    ],
    [],
    'VNEXT_FINAL_AUDIT_REPORT_KEYS_INVALID',
  );
  if (report.schema_version !== FINAL_AUDIT_SCHEMA) V.fail('VNEXT_FINAL_AUDIT_REPORT_SCHEMA_INVALID');
  V.verifyContractHash(report, 'VNEXT_FINAL_AUDIT_REPORT_HASH_MISMATCH');
  if (report.audit_manifest_hash !== auditManifest.contract_hash) V.fail('VNEXT_FINAL_AUDIT_MANIFEST_MISMATCH');
  if (report.audit_coverage_hash !== auditCoverage.contract_hash) V.fail('VNEXT_FINAL_AUDIT_COVERAGE_MISMATCH');
  if (report.review_context_hash !== reviewContext.contract_hash) V.fail('VNEXT_FINAL_AUDIT_CONTEXT_MISMATCH');
  if (report.reentry_allowed !== false) V.fail('VNEXT_FINAL_AUDIT_REENTRY_FORBIDDEN');
  if (!['FINAL_APPROVED', 'FINAL_REVISE_TERMINAL', 'FINAL_CLARIFICATION_TERMINAL', 'FINAL_PROOF_UNAVAILABLE_TERMINAL'].includes(report.terminal_status)) {
    V.fail('VNEXT_FINAL_AUDIT_TERMINAL_STATUS_INVALID');
  }
  Review.validateReviewReport(report.review_report, reviewContext);

  const referenceIds = new Set(auditManifest.normative_references.map((row) => row.reference_id));
  const criterionIds = new Set(auditManifest.criteria.map((row) => row.criterion_id));
  const provenanceByKey = new Map();
  for (const row of report.finding_provenance) {
    V.assertExactKeys(
      row,
      ['semantic_key', 'normative_reference_ids', 'audit_criterion_ids'],
      [],
      'VNEXT_FINAL_AUDIT_PROVENANCE_KEYS_INVALID',
    );
    V.assertSha64(row.semantic_key, 'VNEXT_FINAL_AUDIT_PROVENANCE_KEY_INVALID');
    if (provenanceByKey.has(row.semantic_key)) V.fail('VNEXT_FINAL_AUDIT_PROVENANCE_DUPLICATE', row.semantic_key);
    const normativeIds = uniqueSorted(
      row.normative_reference_ids,
      'VNEXT_FINAL_AUDIT_NORMATIVE_REFS_INVALID',
      'normative_reference_ids',
      { allowEmpty: true },
    );
    const auditCriterionIds = uniqueSorted(
      row.audit_criterion_ids,
      'VNEXT_FINAL_AUDIT_CRITERION_IDS_INVALID',
      'audit_criterion_ids',
    );
    for (const id of normativeIds) {
      if (!referenceIds.has(id)) V.fail('VNEXT_FINAL_AUDIT_NORMATIVE_REF_UNKNOWN', id);
    }
    for (const id of auditCriterionIds) {
      if (!criterionIds.has(id)) V.fail('VNEXT_FINAL_AUDIT_CRITERION_UNKNOWN', id);
    }
    provenanceByKey.set(row.semantic_key, { normativeIds, auditCriterionIds });
  }

  const failedCriteria = new Set(auditCoverage.failed_criterion_ids);
  const coveredFailedCriteria = new Set();
  for (const finding of report.review_report.findings) {
    const semanticKey = V.canonicalHash([
      finding.category,
      finding.target_type,
      finding.target_id,
      finding.finding,
      finding.evidence,
      finding.required_correction,
      finding.dependency_target_ids,
    ]);
    const provenance = provenanceByKey.get(semanticKey);
    if (!provenance) V.fail('VNEXT_FINAL_AUDIT_FINDING_PROVENANCE_MISSING', finding.finding_id);
    if (finding.blocking && provenance.normativeIds.length === 0) {
      V.fail('VNEXT_FINAL_AUDIT_BLOCKING_FINDING_WITHOUT_NORMATIVE_SOURCE', finding.finding_id);
    }
    for (const id of provenance.auditCriterionIds) {
      if (failedCriteria.has(id)) coveredFailedCriteria.add(id);
    }
  }
  if (provenanceByKey.size !== report.review_report.findings.length) {
    V.fail('VNEXT_FINAL_AUDIT_PROVENANCE_ORPHAN');
  }
  for (const id of failedCriteria) {
    if (!coveredFailedCriteria.has(id)) V.fail('VNEXT_FINAL_AUDIT_FAILED_CRITERION_WITHOUT_FINDING', id);
  }

  let expectedTerminal;
  if (report.review_report.verdict === 'APPROVE' && failedCriteria.size === 0 && auditCoverage.unavailable_criterion_ids.length === 0) {
    expectedTerminal = 'FINAL_APPROVED';
  } else if (report.review_report.verdict === 'APPROVE' && failedCriteria.size === 0) {
    expectedTerminal = 'FINAL_PROOF_UNAVAILABLE_TERMINAL';
  } else if (report.review_report.verdict === 'CLARIFICATION_REQUIRED') {
    expectedTerminal = 'FINAL_CLARIFICATION_TERMINAL';
  } else {
    expectedTerminal = 'FINAL_REVISE_TERMINAL';
  }
  if (report.terminal_status !== expectedTerminal) {
    V.fail('VNEXT_FINAL_AUDIT_TERMINAL_STATUS_MISMATCH');
  }
  return true;
}

module.exports = {
  MANIFEST_SCHEMA,
  COVERAGE_SCHEMA,
  LEDGER_SCHEMA,
  FINAL_AUDIT_SCHEMA,
  CRITERION_APPLICABILITY,
  COVERAGE_STATUSES,
  RESOLUTION_STATUSES,
  buildAuditManifest,
  validateAuditManifest,
  buildAuditCoverage,
  validateAuditCoverage,
  buildFindingLedger,
  validateFindingLedger,
  buildFinalAuditReport,
  validateFinalAuditReport,
};
