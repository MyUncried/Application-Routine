'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const V = require('./vnext-contract');

const POLICY_SCHEMA = 'kodjo.vnext.remote-write-policy.v1';
const ATTESTATION_SCHEMA = 'kodjo.vnext.remote-write-attestation.v2';

const EXECUTABLE_EXTENSIONS = /.(?:ya?ml|js|cjs|mjs|ps1|sh)$/i;

function normalizePath(value) {
  return String(value).replace(/\\/g, '/');
}

function listExecutionFiles(root) {
  const result = [];
  const roots = [
    path.join(root, '.github', 'workflows'),
    path.join(root, 'scripts', 'kodjo'),
  ];
  for (const start of roots) {
    if (!fs.existsSync(start)) continue;
    const stack = [start];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
          continue;
        }
        if (!EXECUTABLE_EXTENSIONS.test(entry.name)) continue;
        result.push(normalizePath(path.relative(root, full)));
      }
    }
  }
  return result.sort();
}

function gitBlobOid(root, rel) {
  try {
    return execFileSync('git', ['hash-object', '--path=' + rel, '--', rel], {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
  } catch (err) {
    V.fail('VNEXT_REMOTE_WRITE_GIT_BLOB_UNAVAILABLE', rel);
  }
}

function targetHint(line) {
  const text = String(line).trim();
  const quoted = text.match(/(?:repos\/[^'"\s]+\/(?:contents|git\/(?:refs?|commits|trees|tags))[^'"\s]*)/i);
  if (quoted) return quoted[0];
  const push = text.match(/git\s+push\b([^#\r\n]*)/i);
  if (push) return push[1].trim() || 'git-remote';
  if (/contents\s*:\s*write/i.test(text)) return 'github-token:contents';
  if (/pull-requests\s*:\s*write/i.test(text)) return 'github-token:pull-requests';
  if (/issues\s*:\s*write/i.test(text)) return 'github-token:issues';
  if (/actions\s*:\s*write/i.test(text)) return 'github-token:actions';
  if (/checks\s*:\s*write/i.test(text)) return 'github-token:checks';
  if (/statuses\s*:\s*write/i.test(text)) return 'github-token:statuses';
  if (/packages\s*:\s*write/i.test(text)) return 'github-token:packages';
  if (/extraheader/i.test(text)) return 'git-config:http.extraheader';
  if (/persist-credentials\s*:\s*true/i.test(text)) return 'actions-checkout:persist-credentials';
  return 'static-source-line';
}

function capabilityKey(row) {
  return V.canonicalHash({
    producer: row.producer,
    capability: row.capability,
    destination: row.destination,
    scope: row.scope,
  });
}

function scanFileCapabilities(rel, source) {
  // This module necessarily names the forbidden primitives it detects.
  // Excluding only its own source avoids self-matches without excluding any execution route.
  if (rel === 'scripts/kodjo/lib/vnext-remote-write-security.js') return [];
  const rows = [];
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const isWorkflow = rel.startsWith('.github/workflows/');
  let currentJob = null;
  let rootPermissionsIndent = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (isWorkflow) {
      const jobMatch = raw.match(/^  ([A-Za-z0-9_-]+):\s*$/);
      if (jobMatch && !['on', 'permissions', 'env', 'defaults', 'concurrency'].includes(jobMatch[1])) {
        currentJob = jobMatch[1];
      }
      if (/^permissions:\s*$/.test(raw)) rootPermissionsIndent = 0;
      if (/^    permissions:\s*$/.test(raw)) rootPermissionsIndent = 4;
      const perm = raw.match(/^(\s*)(contents|pull-requests|issues|actions|checks|statuses|packages):\s*write\b/i);
      if (perm) {
        const scope = perm[1].length <= 2 ? 'WORKFLOW' : ('JOB:' + (currentJob || 'UNKNOWN'));
        rows.push({
          producer: rel,
          line: i + 1,
          capability: 'GITHUB_PERMISSION_WRITE:' + perm[2].toLowerCase(),
          destination: 'github-token:' + perm[2].toLowerCase(),
          scope,
          text: trimmed,
        });
      }
      if (/^permissions:\s*write-all\b/i.test(trimmed) || /^write-all\s*$/i.test(trimmed)) {
        rows.push({
          producer: rel,
          line: i + 1,
          capability: 'GITHUB_PERMISSION_WRITE_ALL',
          destination: 'github-token:*',
          scope: currentJob ? 'JOB:' + currentJob : 'WORKFLOW',
          text: trimmed,
        });
      }
    }

    const checks = [
      ['PERSIST_CREDENTIALS_TRUE', /persist-credentials\s*:\s*true/i],
      ['GIT_CREDENTIAL_HEADER', /extraheader/i],
      ['GIT_PUSH', /\bgit\s+(?:-[^\s]+\s+)*push\b/i],
      ['GIT_COMMIT', /\bgit\s+(?:-[^\s]+\s+)*commit\b/i],
      ['GIT_TAG', /\bgit\s+(?:-[^\s]+\s+)*tag\b/i],
      ['GIT_UPDATE_REF', /\bgit\s+(?:-[^\s]+\s+)*update-ref\b/i],
      ['GIT_HISTORY_MUTATION', /\bgit\s+(?:-[^\s]+\s+)*(?:merge|rebase|cherry-pick)\b/i],
      ['CREATE_PULL_REQUEST_ACTION', /uses\s*:\s*[^\n]*create-pull-request/i],
      ['GIT_AUTO_COMMIT_ACTION', /uses\s*:\s*[^\n]*git-auto-commit/i],
    ];
    for (const [capability, re] of checks) {
      if (!re.test(trimmed)) continue;
      rows.push({
        producer: rel,
        line: i + 1,
        capability,
        destination: targetHint(trimmed),
        scope: isWorkflow ? (currentJob ? 'JOB:' + currentJob : 'WORKFLOW') : 'SCRIPT',
        text: trimmed,
      });
    }

    if (/\bgh\s+api\b/i.test(trimmed)
        && /(?:--method|-X)\s+['"]?(?:POST|PUT|PATCH|DELETE)\b/i.test(trimmed)
        && /\/(?:contents|git\/(?:refs?|commits|trees|tags))(?:\/|['"\s]|$)/i.test(trimmed)) {
      rows.push({
        producer: rel,
        line: i + 1,
        capability: 'REST_REPOSITORY_WRITE',
        destination: targetHint(trimmed),
        scope: isWorkflow ? (currentJob ? 'JOB:' + currentJob : 'WORKFLOW') : 'SCRIPT',
        text: trimmed,
      });
    }

    if (/\b(?:fetch|fetchImpl|api|githubApi)\s*\(/i.test(trimmed)
        && /(?:POST|PUT|PATCH|DELETE)/i.test(trimmed)
        && /\/(?:contents|git\/(?:refs?|commits|trees|tags))/i.test(trimmed)) {
      rows.push({
        producer: rel,
        line: i + 1,
        capability: 'REST_REPOSITORY_WRITE',
        destination: targetHint(trimmed),
        scope: isWorkflow ? (currentJob ? 'JOB:' + currentJob : 'WORKFLOW') : 'SCRIPT',
        text: trimmed,
      });
    }
  }

  return rows.map((row) => Object.freeze({
    ...row,
    capability_key: capabilityKey(row),
  }));
}

function scanRepository(root) {
  const files = listExecutionFiles(root);
  const capabilities = [];
  const inventory = [];
  for (const rel of files) {
    const full = path.join(root, rel);
    const source = fs.readFileSync(full, 'utf8');
    const blobOid = gitBlobOid(root, rel);
    const fileCaps = scanFileCapabilities(rel, source);
    inventory.push({
      path: rel,
      blob_oid: blobOid,
      capability_count: fileCaps.length,
    });
    capabilities.push(...fileCaps);
  }
  return {
    files: inventory.sort((a, b) => a.path.localeCompare(b.path)),
    capabilities: capabilities.sort((a, b) =>
      (a.producer + ':' + a.line + ':' + a.capability).localeCompare(
        b.producer + ':' + b.line + ':' + b.capability,
      )),
  };
}

function validateFrozenRows(rows, label) {
  if (!Array.isArray(rows)) V.fail('VNEXT_REMOTE_WRITE_FROZEN_LIST_INVALID', label);
  const seen = new Set();
  for (const row of rows) {
    V.assertExactKeys(
      row,
      ['path', 'blob_oid', 'authorization_condition'],
      [],
      'VNEXT_REMOTE_WRITE_FROZEN_ROW_KEYS_INVALID',
    );
    V.assertUnicodeExactText(row.path, 'VNEXT_REMOTE_WRITE_FROZEN_PATH_INVALID');
    V.assertSha40(row.blob_oid, 'VNEXT_REMOTE_WRITE_FROZEN_BLOB_INVALID');
    V.assertUnicodeExactText(
      row.authorization_condition,
      'VNEXT_REMOTE_WRITE_FROZEN_CONDITION_INVALID',
    );
    if (seen.has(row.path)) V.fail('VNEXT_REMOTE_WRITE_FROZEN_DUPLICATE', row.path);
    seen.add(row.path);
  }
}

function validatePolicy(policy) {
  V.assertExactKeys(
    policy,
    [
      'schema_version',
      'policy_mode',
      'frozen_workflows',
      'frozen_scripts',
      'declared_vnext_writers',
      'retirement_rule',
    ],
    [],
    'VNEXT_REMOTE_WRITE_POLICY_KEYS_INVALID',
  );
  if (policy.schema_version !== POLICY_SCHEMA) V.fail('VNEXT_REMOTE_WRITE_POLICY_SCHEMA_INVALID');
  if (policy.policy_mode !== 'CUTOVER_PREPARATION') {
    V.fail('VNEXT_REMOTE_WRITE_POLICY_MODE_INVALID');
  }
  validateFrozenRows(policy.frozen_workflows, 'frozen_workflows');
  validateFrozenRows(policy.frozen_scripts, 'frozen_scripts');
  if (!Array.isArray(policy.declared_vnext_writers)) {
    V.fail('VNEXT_REMOTE_WRITE_DECLARED_WRITERS_INVALID');
  }
  const seen = new Set();
  for (const writer of policy.declared_vnext_writers) {
    V.assertExactKeys(
      writer,
      [
        'producer',
        'producer_blob_oid',
        'authorization_condition',
        'required_job',
        'capabilities',
      ],
      [],
      'VNEXT_REMOTE_WRITE_DECLARED_WRITER_KEYS_INVALID',
    );
    V.assertUnicodeExactText(writer.producer, 'VNEXT_REMOTE_WRITE_WRITER_PRODUCER_INVALID');
    V.assertSha40(writer.producer_blob_oid, 'VNEXT_REMOTE_WRITE_WRITER_BLOB_INVALID');
    V.assertUnicodeExactText(
      writer.authorization_condition,
      'VNEXT_REMOTE_WRITE_WRITER_CONDITION_INVALID',
    );
    if (writer.required_job !== null) {
      V.assertUnicodeExactText(writer.required_job, 'VNEXT_REMOTE_WRITE_WRITER_JOB_INVALID');
    }
    if (seen.has(writer.producer)) V.fail('VNEXT_REMOTE_WRITE_WRITER_DUPLICATE', writer.producer);
    seen.add(writer.producer);
    if (!Array.isArray(writer.capabilities) || writer.capabilities.length === 0) {
      V.fail('VNEXT_REMOTE_WRITE_WRITER_CAPABILITIES_INVALID', writer.producer);
    }
    const keys = new Set();
    for (const cap of writer.capabilities) {
      V.assertExactKeys(
        cap,
        ['capability', 'destination', 'scope'],
        [],
        'VNEXT_REMOTE_WRITE_DECLARED_CAPABILITY_KEYS_INVALID',
      );
      V.assertUnicodeExactText(cap.capability, 'VNEXT_REMOTE_WRITE_CAPABILITY_INVALID');
      V.assertUnicodeExactText(cap.destination, 'VNEXT_REMOTE_WRITE_DESTINATION_INVALID');
      V.assertUnicodeExactText(cap.scope, 'VNEXT_REMOTE_WRITE_SCOPE_INVALID');
      const key = V.canonicalHash({
        producer: writer.producer,
        capability: cap.capability,
        destination: cap.destination,
        scope: cap.scope,
      });
      if (keys.has(key)) V.fail('VNEXT_REMOTE_WRITE_DECLARED_CAPABILITY_DUPLICATE', writer.producer);
      keys.add(key);
      if (cap.scope === 'WORKFLOW') {
        V.fail('VNEXT_REMOTE_WRITE_VNEXT_WORKFLOW_LEVEL_WRITE_FORBIDDEN', writer.producer);
      }
    }
  }
  if (policy.retirement_rule !== 'REMOVE_OR_DISABLE_ALL_LEGACY_WRITERS_AFTER_LAST_LEGACY_SLICE') {
    V.fail('VNEXT_REMOTE_WRITE_RETIREMENT_RULE_INVALID');
  }
  return true;
}

function evaluateRemoteWriteSecurity({
  root,
  policy,
  legacyActivationRegistry,
  retirementObservation = null,
}) {
  validatePolicy(policy);
  if (!legacyActivationRegistry || !Array.isArray(legacyActivationRegistry.activations)) {
    V.fail('VNEXT_REMOTE_WRITE_LEGACY_REGISTRY_INVALID');
  }

  const scan = scanRepository(root);
  const byPath = new Map(scan.files.map((row) => [row.path, row]));
  const frozen = new Map([
    ...policy.frozen_workflows,
    ...policy.frozen_scripts,
  ].map((row) => [row.path, row]));
  const declared = new Map(policy.declared_vnext_writers.map((row) => [row.producer, row]));
  const findings = [];

  for (const [rel, row] of frozen.entries()) {
    const actual = byPath.get(rel);
    if (!actual) continue;
    if (actual.blob_oid !== row.blob_oid) {
      findings.push({
        code: 'VNEXT_REMOTE_WRITE_FROZEN_PRODUCER_DRIFT',
        producer: rel,
        detail: actual.blob_oid + '!=' + row.blob_oid,
      });
    }
  }

  const capsByProducer = new Map();
  for (const cap of scan.capabilities) {
    const list = capsByProducer.get(cap.producer) || [];
    list.push(cap);
    capsByProducer.set(cap.producer, list);
  }

  for (const [producer, caps] of capsByProducer.entries()) {
    if (frozen.has(producer)) continue;
    const writer = declared.get(producer);
    if (!writer) {
      findings.push({
        code: 'VNEXT_REMOTE_WRITE_UNDECLARED_PRODUCER',
        producer,
        detail: caps.map((row) => row.capability).join(','),
      });
      continue;
    }
    const actual = byPath.get(producer);
    if (!actual || actual.blob_oid !== writer.producer_blob_oid) {
      findings.push({
        code: 'VNEXT_REMOTE_WRITE_DECLARED_PRODUCER_DRIFT',
        producer,
        detail: actual ? actual.blob_oid : 'MISSING',
      });
      continue;
    }
    const expectedKeys = new Set(writer.capabilities.map((cap) => V.canonicalHash({
      producer,
      capability: cap.capability,
      destination: cap.destination,
      scope: cap.scope,
    })));
    const actualKeys = new Set(caps.map((cap) => cap.capability_key));
    for (const key of actualKeys) {
      if (!expectedKeys.has(key)) {
        findings.push({
          code: 'VNEXT_REMOTE_WRITE_UNDECLARED_CAPABILITY',
          producer,
          detail: key,
        });
      }
    }
    for (const key of expectedKeys) {
      if (!actualKeys.has(key)) {
        findings.push({
          code: 'VNEXT_REMOTE_WRITE_DECLARATION_STALE',
          producer,
          detail: key,
        });
      }
    }
    if (writer.required_job !== null) {
      for (const cap of caps) {
        if (!cap.scope.startsWith('JOB:') || cap.scope !== 'JOB:' + writer.required_job) {
          findings.push({
            code: 'VNEXT_REMOTE_WRITE_JOB_SCOPE_MISMATCH',
            producer,
            detail: cap.scope,
          });
        }
      }
    }
  }

  const activeLegacy = legacyActivationRegistry.activations
    .filter((row) => row.status === 'ACTIVE')
    .map((row) => row.slice_id)
    .sort();

  if (activeLegacy.length === 0) {
    for (const [producer, caps] of capsByProducer.entries()) {
      if (!frozen.has(producer) || caps.length === 0) continue;
      findings.push({
        code: 'VNEXT_REMOTE_WRITE_LEGACY_WRITER_NOT_RETIRED',
        producer,
        detail: caps.map((row) => row.capability).join(','),
      });
    }
  }

  if (activeLegacy.length === 0) {
    if (!retirementObservation) {
      findings.push({ code: 'VNEXT_REMOTE_WRITE_RETIREMENT_UNVERIFIABLE', producer: 'github-actions', detail: 'Complete run inventory and rerun barriers required.' });
    } else {
      validateRetirementObservation(retirementObservation, policy);
      if (retirementObservation.pending_runs.length > 0) findings.push({ code: 'VNEXT_REMOTE_WRITE_LEGACY_RUN_STILL_PENDING', producer: 'github-actions', detail: retirementObservation.pending_runs.join(',') });
    }
  }

  const status = findings.length > 0
    ? 'FAIL'
    : (activeLegacy.length > 0 ? 'PASS_WITH_FROZEN_LEGACY' : 'PASS_RETIRED');

  return V.sealContract({
    schema_version: ATTESTATION_SCHEMA,
    policy_hash: V.canonicalHash(policy),
    retirement_observation: retirementObservation,
    scanned_file_count: scan.files.length,
    observed_capability_count: scan.capabilities.length,
    active_legacy_slice_ids: activeLegacy,
    status,
    findings: findings.sort((a, b) =>
      (a.code + ':' + a.producer + ':' + a.detail).localeCompare(
        b.code + ':' + b.producer + ':' + b.detail,
      )),
    observed_capabilities: scan.capabilities.map((row) => ({
      producer: row.producer,
      line: row.line,
      capability: row.capability,
      destination: row.destination,
      scope: row.scope,
      capability_key: row.capability_key,
    })),
  });
}

function validateAttestation(attestation) {
  V.assertExactKeys(
    attestation,
    [
      'schema_version',
      'policy_hash',
      'retirement_observation',
      'scanned_file_count',
      'observed_capability_count',
      'active_legacy_slice_ids',
      'status',
      'findings',
      'observed_capabilities',
      'contract_hash',
    ],
    [],
    'VNEXT_REMOTE_WRITE_ATTESTATION_KEYS_INVALID',
  );
  if (attestation.schema_version !== ATTESTATION_SCHEMA) {
    V.fail('VNEXT_REMOTE_WRITE_ATTESTATION_SCHEMA_INVALID');
  }
  V.verifyContractHash(attestation, 'VNEXT_REMOTE_WRITE_ATTESTATION_HASH_MISMATCH');
  if (!['FAIL', 'PASS_WITH_FROZEN_LEGACY', 'PASS_RETIRED'].includes(attestation.status)) {
    V.fail('VNEXT_REMOTE_WRITE_ATTESTATION_STATUS_INVALID');
  }
  if (attestation.status === 'PASS_RETIRED' && (!attestation.retirement_observation || attestation.retirement_observation.pending_runs.length > 0)) V.fail('VNEXT_REMOTE_WRITE_RETIREMENT_UNVERIFIABLE');
  if (attestation.status === 'PASS_RETIRED') {
    validateRetirementObservation(attestation.retirement_observation, null, attestation.policy_hash);
    if (attestation.active_legacy_slice_ids.length !== 0) V.fail('VNEXT_REMOTE_WRITE_RETIREMENT_ACTIVE_LEGACY');
  }
  if (attestation.status !== 'FAIL' && attestation.findings.length > 0) V.fail('VNEXT_REMOTE_WRITE_STATUS_FINDINGS_MISMATCH');
  return true;
}

function validateRetirementObservation(observation, policy = null, expectedPolicyHash = null) {
  V.assertExactKeys(observation, ['policy_hash', 'observed_at', 'inventory_complete', 'pending_runs', 'workflow_barriers', 'evidence_refs'], [], 'VNEXT_RETIREMENT_OBSERVATION_KEYS_INVALID');
  if (observation.policy_hash !== (policy ? V.canonicalHash(policy) : expectedPolicyHash)) V.fail('VNEXT_RETIREMENT_POLICY_MISMATCH');
  V.assertIsoDate(observation.observed_at, 'VNEXT_RETIREMENT_DATE_INVALID');
  if (observation.inventory_complete !== true) V.fail('VNEXT_RETIREMENT_INVENTORY_INCOMPLETE');
  V.uniqueStrings(observation.pending_runs, 'VNEXT_RETIREMENT_PENDING_RUNS_INVALID', 'pending_runs', { allowEmpty: true });
  V.uniqueStrings(observation.evidence_refs, 'VNEXT_RETIREMENT_EVIDENCE_REQUIRED', 'evidence_refs');
  if (!Array.isArray(observation.workflow_barriers)) V.fail('VNEXT_RETIREMENT_BARRIERS_INVALID');
  const seen = new Set();
  for (const row of observation.workflow_barriers) {
    V.assertExactKeys(row, ['path', 'disabled', 'rerun_blocked', 'evidence_ref'], [], 'VNEXT_RETIREMENT_BARRIER_KEYS_INVALID');
    if (row.disabled !== true || row.rerun_blocked !== true) V.fail('VNEXT_RETIREMENT_WORKFLOW_REPLAY_NOT_BLOCKED', row.path);
    V.assertUnicodeExactText(row.evidence_ref, 'VNEXT_RETIREMENT_BARRIER_EVIDENCE_REQUIRED');
    if (seen.has(row.path)) V.fail('VNEXT_RETIREMENT_BARRIER_DUPLICATE', row.path);
    seen.add(row.path);
  }
  // Freeze list deliberately includes read-only legacy surfaces: require a
  // disposition for all of them, so deleting a writer cannot erase its history.
  for (const row of (policy ? policy.frozen_workflows : [])) if (!seen.has(row.path)) V.fail('VNEXT_RETIREMENT_WORKFLOW_UNACCOUNTED', row.path);
  return true;
}

module.exports = {
  validateRetirementObservation,
  POLICY_SCHEMA,
  ATTESTATION_SCHEMA,
  listExecutionFiles,
  scanFileCapabilities,
  scanRepository,
  validatePolicy,
  evaluateRemoteWriteSecurity,
  validateAttestation,
};
