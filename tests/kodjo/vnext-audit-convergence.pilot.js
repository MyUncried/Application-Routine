'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const V = require('../../scripts/kodjo/lib/vnext-contract');
const Review = require('../../scripts/kodjo/lib/review-contract');
const Convergence = require('../../scripts/kodjo/lib/audit-convergence-contract');

const Fixture = require('./helpers/vnext-planning-fixture');
const repo = Fixture.fixtureRepo();
const source = Fixture.sourceManifest();
const envelope = Fixture.makeEnvelope(source, repo, 'INITIAL', null);
const reviewArtifacts = { ...Fixture.buildPlanningArtifacts({ repo, manifest: source, envelope }), currentState: Fixture.currentState(repo) };
const H40 = reviewArtifacts.currentState.protocol_head;
const H64A = 'a'.repeat(64);
const H64B = reviewArtifacts.planContract.contract_hash;
const PLAN_ID = reviewArtifacts.planContract.plan_items[0].plan_item_id;
function reviewContext() { return reviewArtifacts.reviewContext; }

test('architecture: final audit refuses a different protocol candidate and forged context', () => {
  const auditManifest = manifest();
  const auditCoverage = passingCoverage(auditManifest);
  const args = { auditManifest, auditCoverage, reviewContext: reviewContext(), reviewArtifacts, semanticAudit: { findings: [] } };
  assert.throws(() => Convergence.buildFinalAuditReport({ ...args,
    reviewArtifacts: { ...reviewArtifacts, currentState: { ...reviewArtifacts.currentState, protocol_head: 'd'.repeat(40) } } }), /CANDIDATE_MISMATCH/);
  const context = structuredClone(reviewContext());
  Object.keys(context.target_catalog).forEach(key => { context.target_catalog[key] = []; });
  delete context.contract_hash;
  assert.throws(() => Convergence.buildFinalAuditReport({ ...args, reviewContext: V.sealContract(context) }), /CONTEXT_REBUILD_MISMATCH/);
});

function semanticFinding(overrides = {}) {
  return {
    category: overrides.category || 'PLAN_GAP',
    target_type: overrides.target_type || 'PLAN_ITEM',
    target_id: overrides.target_id || PLAN_ID,
    finding: overrides.finding || 'Le plan omet une obligation existante.',
    evidence: overrides.evidence || ['evidence:plan'],
    required_correction: overrides.required_correction || 'Compléter le plan.',
    dependency_target_ids: overrides.dependency_target_ids || [],
  };
}

function report(findings) {
  return Review.buildReviewReport({
    reviewContext: reviewContext(), reviewArtifacts,
    semanticReview: { findings },
  });
}

function manifest() {
  return Convergence.buildAuditManifest({
    candidateHead: H40,
    protocolSpecHash: H64A,
    normativeReferences: [
      {
        reference_id: 'NORM-001',
        kind: 'PROTOCOL_SPEC',
        locator: '.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md#review',
        fingerprint: H64A,
      },
      {
        reference_id: 'NORM-002',
        kind: 'REQUIREMENT',
        locator: 'requirement:REQ-001',
        fingerprint: H64B,
      },
    ],
    criteria: [
      {
        criterion_id: 'AUD-001',
        title: 'Les findings bloquants sont fondés sur une règle préexistante.',
        applicability: 'REQUIRED',
        normative_reference_ids: ['NORM-001'],
      },
      {
        criterion_id: 'AUD-002',
        title: 'Les findings précédents possèdent une fermeture explicite.',
        applicability: 'REQUIRED',
        normative_reference_ids: ['NORM-001'],
      },
      {
        criterion_id: 'AUD-003',
        title: 'Axe explicitement non applicable au candidat.',
        applicability: 'NOT_APPLICABLE',
        normative_reference_ids: ['NORM-002'],
      },
    ],
    createdFromRefs: ['issue:249', 'vnext:cutover-candidate'],
  });
}

function passingCoverage(auditManifest = manifest()) {
  return Convergence.buildAuditCoverage({
    auditManifest,
    assessments: [
      {
        criterion_id: 'AUD-001',
        status: 'CHECKED_PASS',
        evidence_refs: ['test:audit-provenance'],
        note: 'Contrôle exécuté.',
      },
      {
        criterion_id: 'AUD-002',
        status: 'CHECKED_PASS',
        evidence_refs: ['test:finding-ledger'],
        note: 'Contrôle exécuté.',
      },
      {
        criterion_id: 'AUD-003',
        status: 'NOT_APPLICABLE',
        evidence_refs: [],
        note: 'Non applicable selon le manifeste figé.',
      },
    ],
  });
}

function finalFinding(overrides = {}) {
  return {
    ...semanticFinding(overrides),
    normative_reference_ids: Object.prototype.hasOwnProperty.call(overrides, 'normative_reference_ids')
      ? overrides.normative_reference_ids
      : ['NORM-001'],
    audit_criterion_ids: overrides.audit_criterion_ids || ['AUD-001'],
  };
}

test('VNext-11 interdit la fermeture d’un finding par simple disparition', () => {
  const previous = report([semanticFinding()]);
  const next = report([]);

  assert.throws(() => Convergence.buildFindingLedger({
    previousReviewReport: previous,
    nextReviewReport: next,
    resolutions: [],
  }), /VNEXT_LEDGER_FINDING_DISAPPEARED_WITHOUT_RESOLUTION/);
});

test('VNext-11 ferme explicitement un finding avec preuve de résolution', () => {
  const previous = report([semanticFinding()]);
  const next = report([]);
  const ledger = Convergence.buildFindingLedger({
    previousReviewReport: previous,
    nextReviewReport: next,
    resolutions: [{
      finding_id: previous.findings[0].finding_id,
      status: 'RESOLVED',
      evidence_refs: ['proof:re-review-pass'],
      note: 'La correction a été vérifiée sur le candidat courant.',
    }],
  });

  assert.equal(ledger.entries[0].lifecycle_status, 'RESOLVED');
  assert.equal(Convergence.validateFindingLedger(ledger, previous, next), true);
});

test('VNext-11 refuse de résoudre un finding qui persiste encore', () => {
  const previous = report([semanticFinding()]);
  const next = report([semanticFinding()]);
  assert.equal(previous.findings[0].finding_id, next.findings[0].finding_id);

  assert.throws(() => Convergence.buildFindingLedger({
    previousReviewReport: previous,
    nextReviewReport: next,
    resolutions: [{
      finding_id: previous.findings[0].finding_id,
      status: 'RESOLVED',
      evidence_refs: ['proof:false-resolution'],
      note: 'Tentative de fermeture.',
    }],
  }), /VNEXT_LEDGER_PERSISTING_FINDING_CANNOT_RESOLVE/);
});

test('VNext-11 exige la couverture complète du manifeste d’audit figé', () => {
  const m = manifest();
  assert.throws(() => Convergence.buildAuditCoverage({
    auditManifest: m,
    assessments: [
      {
        criterion_id: 'AUD-001',
        status: 'CHECKED_PASS',
        evidence_refs: ['proof:1'],
        note: 'Contrôle.',
      },
      {
        criterion_id: 'AUD-003',
        status: 'NOT_APPLICABLE',
        evidence_refs: [],
        note: 'Non applicable.',
      },
    ],
  }), /VNEXT_AUDIT_CRITERION_UNCOVERED/);
});

test('VNext-11 un critère REQUIRED ne peut pas devenir NOT_APPLICABLE pendant l’audit', () => {
  const m = manifest();
  assert.throws(() => Convergence.buildAuditCoverage({
    auditManifest: m,
    assessments: [
      {
        criterion_id: 'AUD-001',
        status: 'NOT_APPLICABLE',
        evidence_refs: [],
        note: 'Tentative de report.',
      },
      {
        criterion_id: 'AUD-002',
        status: 'CHECKED_PASS',
        evidence_refs: ['proof:2'],
        note: 'Contrôle.',
      },
      {
        criterion_id: 'AUD-003',
        status: 'NOT_APPLICABLE',
        evidence_refs: [],
        note: 'Non applicable.',
      },
    ],
  }), /VNEXT_AUDIT_REQUIRED_CRITERION_NOT_APPLICABLE/);
});

test('VNext-11 refuse un finding bloquant sans source normative préexistante', () => {
  const m = manifest();
  const coverage = passingCoverage(m);

  assert.throws(() => Convergence.buildFinalAuditReport({
    auditManifest: m,
    auditCoverage: coverage,
    reviewContext: reviewContext(), reviewArtifacts,
    semanticAudit: {
      findings: [finalFinding({ normative_reference_ids: [] })],
    },
  }), /VNEXT_FINAL_AUDIT_BLOCKING_FINDING_WITHOUT_NORMATIVE_SOURCE/);
});

test('VNext-11 une recommandation nouvelle reste SUGGESTION et ne bloque pas', () => {
  const m = manifest();
  const coverage = passingCoverage(m);
  const final = Convergence.buildFinalAuditReport({
    auditManifest: m,
    auditCoverage: coverage,
    reviewContext: reviewContext(), reviewArtifacts,
    semanticAudit: {
      findings: [finalFinding({
        category: 'SUGGESTION',
        target_type: 'PLAN_CONTRACT',
        target_id: H64B,
        finding: 'Amélioration future non exigée par le contrat courant.',
        required_correction: 'Aucune correction requise avant cutover.',
        normative_reference_ids: [],
      })],
    },
  });

  assert.equal(final.review_report.verdict, 'APPROVE');
  assert.equal(final.terminal_status, 'FINAL_APPROVED');
  assert.equal(final.reentry_allowed, false);
});

test('VNext-11 un axe CHECKED_FAIL doit être relié à un finding', () => {
  const m = manifest();
  const coverage = Convergence.buildAuditCoverage({
    auditManifest: m,
    assessments: [
      {
        criterion_id: 'AUD-001',
        status: 'CHECKED_FAIL',
        evidence_refs: ['proof:failed-check'],
        note: 'Défaut observé.',
      },
      {
        criterion_id: 'AUD-002',
        status: 'CHECKED_PASS',
        evidence_refs: ['proof:ledger'],
        note: 'Contrôle.',
      },
      {
        criterion_id: 'AUD-003',
        status: 'NOT_APPLICABLE',
        evidence_refs: [],
        note: 'Non applicable.',
      },
    ],
  });

  assert.throws(() => Convergence.buildFinalAuditReport({
    auditManifest: m,
    auditCoverage: coverage,
    reviewContext: reviewContext(), reviewArtifacts,
    semanticAudit: { findings: [] },
  }), /VNEXT_FINAL_AUDIT_FAILED_CRITERION_WITHOUT_FINDING/);
});

test('VNext-11 le dernier REVISE devient terminal et ne déclenche aucune réentrée', () => {
  const m = manifest();
  const coverage = Convergence.buildAuditCoverage({
    auditManifest: m,
    assessments: [
      {
        criterion_id: 'AUD-001',
        status: 'CHECKED_FAIL',
        evidence_refs: ['proof:blocking'],
        note: 'Violation d’une règle existante.',
      },
      {
        criterion_id: 'AUD-002',
        status: 'CHECKED_PASS',
        evidence_refs: ['proof:ledger'],
        note: 'Contrôle.',
      },
      {
        criterion_id: 'AUD-003',
        status: 'NOT_APPLICABLE',
        evidence_refs: [],
        note: 'Non applicable.',
      },
    ],
  });
  const final = Convergence.buildFinalAuditReport({
    auditManifest: m,
    auditCoverage: coverage,
    reviewContext: reviewContext(), reviewArtifacts,
    semanticAudit: {
      findings: [finalFinding({
        audit_criterion_ids: ['AUD-001'],
      })],
    },
  });

  assert.equal(final.review_report.verdict, 'REVISE');
  assert.equal(final.terminal_status, 'FINAL_REVISE_TERMINAL');
  assert.equal(final.reentry_allowed, false);
  assert.equal(Convergence.validateFinalAuditReport(final, {
    auditManifest: m,
    auditCoverage: coverage,
    reviewContext: reviewContext(), reviewArtifacts,
  }), true);
});

test('VNext-11 un rapport final ne peut pas être transféré vers un manifeste d’audit modifié', () => {
  const m = manifest();
  const coverage = passingCoverage(m);
  const final = Convergence.buildFinalAuditReport({
    auditManifest: m,
    auditCoverage: coverage,
    reviewContext: reviewContext(), reviewArtifacts,
    semanticAudit: { findings: [] },
  });

  const changed = Convergence.buildAuditManifest({
    candidateHead: H40,
    protocolSpecHash: H64A,
    normativeReferences: m.normative_references.map((row) => ({
      reference_id: row.reference_id,
      kind: row.kind,
      locator: row.locator,
      fingerprint: row.fingerprint,
    })),
    criteria: [
      ...m.criteria,
      {
        criterion_id: 'AUD-004',
        title: 'Nouveau critère ajouté après audit.',
        applicability: 'REQUIRED',
        normative_reference_ids: ['NORM-001'],
      },
    ],
    createdFromRefs: m.created_from_refs,
  });

  assert.throws(() => Convergence.validateFinalAuditReport(final, {
    auditManifest: changed,
    auditCoverage: coverage,
    reviewContext: reviewContext(), reviewArtifacts,
  }), /VNEXT_AUDIT_COVERAGE_REBUILD_MISMATCH|VNEXT_FINAL_AUDIT_MANIFEST_MISMATCH|VNEXT_AUDIT_CRITERION_UNCOVERED/);
});

test('VNext-11 refuse une provenance normative re-signée mais supprimée', () => {
  const m = manifest();
  const coverage = Convergence.buildAuditCoverage({
    auditManifest: m,
    assessments: [
      {
        criterion_id: 'AUD-001',
        status: 'CHECKED_FAIL',
        evidence_refs: ['proof:blocking'],
        note: 'Violation.',
      },
      {
        criterion_id: 'AUD-002',
        status: 'CHECKED_PASS',
        evidence_refs: ['proof:ledger'],
        note: 'Contrôle.',
      },
      {
        criterion_id: 'AUD-003',
        status: 'NOT_APPLICABLE',
        evidence_refs: [],
        note: 'Non applicable.',
      },
    ],
  });
  const final = structuredClone(Convergence.buildFinalAuditReport({
    auditManifest: m,
    auditCoverage: coverage,
    reviewContext: reviewContext(), reviewArtifacts,
    semanticAudit: { findings: [finalFinding()] },
  }));

  final.finding_provenance[0].normative_reference_ids = [];
  delete final.contract_hash;
  final.contract_hash = V.canonicalHash(final);

  assert.throws(() => Convergence.validateFinalAuditReport(final, {
    auditManifest: m,
    auditCoverage: coverage,
    reviewContext: reviewContext(), reviewArtifacts,
  }), /VNEXT_FINAL_AUDIT_BLOCKING_FINDING_WITHOUT_NORMATIVE_SOURCE/);
});

test('VNext unavailable evidence remains distinct and cannot produce FINAL_APPROVED', () => {
  const m = manifest();
  const assessments = passingCoverage(m).assessments.map(row => row.criterion_id === 'AUD-001'
    ? { ...row, status: 'NON_VERIFIABLE', evidence_refs: ['probe:artifact-missing'], note: 'No proof available; no defect demonstrated.' } : row);
  const coverage = Convergence.buildAuditCoverage({ auditManifest: m, assessments });
  assert.deepEqual(coverage.failed_criterion_ids, []);
  assert.deepEqual(coverage.unavailable_criterion_ids, ['AUD-001']);
  const final = Convergence.buildFinalAuditReport({ auditManifest: m, auditCoverage: coverage, reviewContext: reviewContext(), reviewArtifacts, semanticAudit: { findings: [] } });
  assert.equal(final.terminal_status, 'FINAL_PROOF_UNAVAILABLE_TERMINAL');
  assert.equal(final.reentry_allowed, false);
  assert.equal(Convergence.validateFinalAuditReport(final, { auditManifest: m, auditCoverage: coverage, reviewContext: reviewContext(), reviewArtifacts }), true);
  const raw = { ...final, terminal_status: 'FINAL_APPROVED' }; delete raw.contract_hash;
  const forged = V.sealContract(raw);
  assert.throws(() => Convergence.validateFinalAuditReport(forged, { auditManifest: m, auditCoverage: coverage, reviewContext: reviewContext(), reviewArtifacts }), /TERMINAL_STATUS_MISMATCH/);
});
