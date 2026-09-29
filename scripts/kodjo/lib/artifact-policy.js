'use strict';

const POLICIES = [
  { pattern: /^kodjo-v2-recovery-/, role: 'RECOVERY_REQUIRED', retention_days: 90, critical: true },
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
  return { role: 'UNKNOWN', retention_days: 7, critical: true };
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
