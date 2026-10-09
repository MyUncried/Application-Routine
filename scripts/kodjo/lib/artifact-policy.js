'use strict';

const POLICIES = [
  { pattern: /^vnext-chatgpt-review-[0-9]+-[0-9]+$/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 30, critical: true },
  { pattern: /^vnext-delivery-tests-[0-9]+-[0-9]+$/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 14, critical: true },
  { pattern: /^kodjo-vnext-(?:architecture|closure)-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 14, critical: true },
  { pattern: /^kodjo-vnext12-incidents-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 14, critical: true },
  { pattern: /^(?:qualification-controls|historical-equivalence)-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 14, critical: true },
  { pattern: /^kodjo-vnext12-(?:revision|preparation)-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 14, critical: true },
  { pattern: /^kodjo-vnext12-(?:execution|figma|implementation-review)-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 14, critical: true },
  { pattern: /^kodjo-v2-complete-source-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 7, critical: true },
  { pattern: /^kodjo-vnext12-(?:source-snapshot|complete-source)-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 7, critical: true },
  { pattern: /^kodjo-smoke-[0-9]+-recovery$/, role: 'DIAGNOSTIC', retention_days: 7, critical: false },
  { pattern: /^(?:kodjo-slice-(?:implementation|plan)(?:-review)?-|s09-implementation-review-)/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 7, critical: true },
  { pattern: /^KODJO-CLAUDE-SESSION-RESUME-01-(?:BASE|RESUME)-execution$/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 30, critical: true },
  { pattern: /^routine-(?:dev|stable)-sync-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 30, critical: true },
  { pattern: /^kodjo-v2-runner-inventory-/, role: 'DIAGNOSTIC', retention_days: 30, critical: false },
  { pattern: /^kodjo-v2-(?:plan-handoff-validation|minor-plan-clarification|minor-plan-review)-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 14, critical: true },
  { pattern: /^kodjo-v2-audit-publication-/, role: 'TEMPORARY_TRANSPORT', retention_days: 14, critical: false },
  { pattern: /^kodjo-v2-recovery-/, role: 'RECOVERY_REQUIRED', retention_days: 90, critical: true },
  { pattern: /^kodjo-[^-]+(?:-[^-]+)*-[0-9]+-recovery(?:-retry)?$/, role: 'RECOVERY_REQUIRED', retention_days: 90, critical: true },
  { pattern: /^kodjo-[^-]+(?:-[^-]+)*-[0-9]+-result$/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 90, critical: true },
  { pattern: /^kodjo-[^-]+(?:-[^-]+)*-[0-9]+-publication-receipt$/, role: 'TEMPORARY_TRANSPORT', retention_days: 7, critical: false },
  { pattern: /^kodjo-v2-disposable-qualification-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 90, critical: true },
  { pattern: /^kodjo-v2-(?:qualification-availability|runner-cleanup)-/, role: 'DIAGNOSTIC', retention_days: 7, critical: false },
  { pattern: /^kodjo-v2-independent-audit-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 14, critical: true },
  { pattern: /^kodjo-v2-(?:initial-plan|slice-plan)(?:-review)?-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 14, critical: true },
  { pattern: /^kodjo-v2-preflight-/, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 7, critical: true },
  { pattern: /recovery-certification/i, role: 'DIAGNOSTIC', retention_days: 7, critical: false },
  { pattern: /diagnostic|infrastructure|inventory|availability/i, role: 'DIAGNOSTIC', retention_days: 7, critical: false },
  { pattern: /^kodjo-v2-(?:runner-certification|disposable-preflight|real-recovery-certification)-/, role: 'DIAGNOSTIC', retention_days: 7, critical: false },
  { pattern: /qualification|preflight|certification/i, role: 'DURABLE_EVIDENCE_SOURCE', retention_days: 7, critical: true },
  { pattern: /receipt|result/i, role: 'TEMPORARY_TRANSPORT', retention_days: 7, critical: false },
];

function classify(name) {
  for (const policy of POLICIES) {
    if (policy.pattern.test(String(name || ''))) return { role: policy.role, retention_days: policy.retention_days, critical: policy.critical };
  }
  return { role: 'UNKNOWN', retention_days: 90, critical: true };
}

function flattenPages(value) {
  if (Array.isArray(value)) return value.flatMap((page) => Array.isArray(page && page.artifacts) ? page.artifacts : []);
  return Array.isArray(value && value.artifacts) ? value.artifacts : [];
}

function inventory(value) {
  const artifacts = flattenPages(value).filter((artifact) => artifact && artifact.expired !== true);
  const totalBytes = artifacts.reduce((sum, artifact) => sum + Number(artifact.size_in_bytes || 0), 0);
  const byRole = {};
  for (const artifact of artifacts) {
    const role = classify(artifact.name).role;
    byRole[role] = (byRole[role] || 0) + Number(artifact.size_in_bytes || 0);
  }
  return { artifact_count: artifacts.length, total_bytes: totalBytes, by_role: byRole };
}

module.exports = { POLICIES, classify, flattenPages, inventory };
