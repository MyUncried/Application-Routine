'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const V = require('./vnext-contract');

const POLICY_SCHEMA = 'kodjo.vnext.remote-write-policy.v1';
const REPORT_SCHEMA = 'kodjo.vnext.remote-write-report.v1';
const GATE_SCHEMA = 'kodjo.vnext.remote-write-gate.v1';

const EXECUTABLE_ROOTS = Object.freeze([
  '.github/workflows',
  '.github/actions',
  'scripts/kodjo',
]);

const EXECUTABLE_EXT = /\.(?:ya?ml|js|cjs|mjs|ps1|sh)$/i;
const LIFECYCLES = Object.freeze(['VNEXT', 'LEGACY_GRANDFATHERED', 'QUALIFICATION']);
const PERMISSION_SCOPES = Object.freeze(['NONE', 'JOB', 'WORKFLOW']);

function sha256(text) {
  return crypto.createHash('sha256').update(String(text).replace(/\r\n/g, '\n')).digest('hex');
}

function normalizePath(value) {
  return String(value).replace(/\\/g, '/').replace(/^\.\//, '');
}

function collectExecutableFiles(root) {
  const out = [];
  for (const rel of EXECUTABLE_ROOTS) {
    const dir = path.join(root, rel);
    if (!fs.existsSync(dir)) continue;
    const stack = [dir];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (EXECUTABLE_EXT.test(entry.name)) out.push(full);
      }
    }
  }
  return out.sort();
}

function lineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function permissionScope(lines, index) {
  const line = lines[index] || '';
  const indent = line.match(/^\s*/)[0].length;
  if (indent <= 2) return 'WORKFLOW';
  if (indent >= 6) return 'JOB';
  return 'WORKFLOW';
}

function add(out, row) {
  const key = [row.type, row.line, row.destination || '', row.text].join('|');
  if (!out.some((x) => [x.type, x.line, x.destination || '', x.text].join('|') === key)) {
    out.push(Object.freeze(row));
  }
}

function detectCapabilities(rel, source) {
  const normalizedRel = normalizePath(rel);
  const out = [];
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');

  lines.forEach((raw, index) => {
    const line = raw.split('#')[0];
    const text = raw.trim();
    const n = index + 1;

    const permission = line.match(/^\s*(contents|pull-requests|issues|actions|checks|statuses|deployments|packages)\s*:\s*write\s*$/);
    if (permission) {
      add(out, {
        type: 'GITHUB_PERMISSION_WRITE',
        line: n,
        text,
        destination: permission[1],
        permission_scope: permissionScope(lines, index),
      });
    }
    if (/persist-credentials\s*:\s*true/.test(line)) {
      add(out, {
        type: 'PERSIST_CREDENTIALS_TRUE',
        line: n,
        text,
        destination: 'git-credentials',
        permission_scope: 'NONE',
      });
    }
    if (/extraheader/i.test(line)) { // kodjo-allow-mention
      add(out, {
        type: 'GIT_CREDENTIAL_HEADER',
        line: n,
        text,
        destination: 'git-config-extraheader', // kodjo-allow-mention
        permission_scope: 'NONE',
      });
    }
    if (/\bgit\s+(?:-[^\s]+\s+)*push\b/.test(line)) {
      const dest = line.match(/\bgit\s+(?:-[^\s]+\s+)*push\s+([^\s]+)(?:\s+([^\s]+))?/);
      add(out, {
        type: 'GIT_PUSH',
        line: n,
        text,
        destination: dest ? [dest[1], dest[2]].filter(Boolean).join(' ') : 'dynamic',
        permission_scope: 'NONE',
      });
    }
    if (/\bgit\s+(?:-[^\s]+\s+)*commit\b/.test(line)) {
      add(out, {
        type: 'GIT_COMMIT',
        line: n,
        text,
        destination: 'git-local-commit',
        permission_scope: 'NONE',
      });
    }
    if (/\bgit\s+(?:-[^\s]+\s+)*(?:update-ref|tag|merge|rebase|cherry-pick)\b/.test(line)) {
      add(out, {
        type: 'GIT_REF_OR_HISTORY_MUTATION',
        line: n,
        text,
        destination: 'git-local-or-remote',
        permission_scope: 'NONE',
      });
    }
    if (/\bgit\s+(?:-[^\s]+\s+)*(?:checkout\s+-b|switch\s+-c|branch\s+)/.test(line)) {
      add(out, {
        type: 'GIT_BRANCH_CREATE',
        line: n,
        text,
        destination: 'git-local-branch',
        permission_scope: 'NONE',
      });
    }

    if (/\bgh\s+api\b/.test(line)) {
      const method = line.match(/(?:--method|-X)\s+['"]?(POST|PUT|PATCH|DELETE)\b/i);
      const implicitWrite = /(?:--input|--(?:raw-)?field|-[fF])(?:\s|=)/.test(line);
      if (method || implicitWrite) {
        const route = line.match(/(?:gh\s+api\s+)(?:--method\s+\w+\s+|-X\s+\w+\s+)?["']?([^\s"'|]+)/i);
        add(out, {
          type: 'GH_API_WRITE',
          line: n,
          text,
          destination: route ? route[1] : 'dynamic',
          permission_scope: 'NONE',
        });
      }
    }

    const ghCommand = line.match(/\bgh\s+(pr|issue|release|workflow|run)\s+(create|edit|comment|close|reopen|merge|run|rerun|cancel|delete)\b/i);
    if (ghCommand) {
      add(out, {
        type: 'GH_COMMAND_WRITE_OR_TRIGGER',
        line: n,
        text,
        destination: ghCommand[1].toLowerCase() + ':' + ghCommand[2].toLowerCase(),
        permission_scope: 'NONE',
      });
    }

    if (/uses\s*:\s*[^\s]+\/(?:create-pull-request|git-auto-commit)/i.test(line)) {
      add(out, {
        type: 'WRITE_ACTION',
        line: n,
        text,
        destination: text,
        permission_scope: 'NONE',
      });
    }
  });

  const code = String(source)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
  for (const match of code.matchAll(/\b(?:fetch|fetchImpl)\s*\(([\s\S]{0,1200}?)\)/g)) {
    if (!/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i.test(match[1])) continue;
    const route = match[1].match(/https?:\/\/[^'"\s)]+|repos\/[^'"\s)]+|\/git\/[^'"\s)]+|\/contents\/[^'"\s)]+/);
    add(out, {
      type: 'HTTP_WRITE',
      line: lineNumber(code, match.index),
      text: match[0].slice(0, 300),
      destination: route ? route[0] : 'dynamic',
      permission_scope: 'NONE',
    });
  }

  return out.map((row) => Object.freeze({ producer_path: normalizedRel, ...row }));
}

function validatePolicy(policy) {
  V.assertExactKeys(
    policy,
    ['schema_version', 'scan_roots', 'declarations'],
    [],
    'VNEXT_REMOTE_WRITE_POLICY_KEYS_INVALID',
  );
  if (policy.schema_version !== POLICY_SCHEMA) V.fail('VNEXT_REMOTE_WRITE_POLICY_SCHEMA_INVALID');
  const roots = V.uniqueStrings(policy.scan_roots, 'VNEXT_REMOTE_WRITE_SCAN_ROOTS_INVALID', 'scan_roots');
  if (V.canonicalStringify([...roots].sort()) !== V.canonicalStringify([...EXECUTABLE_ROOTS].sort())) {
    V.fail('VNEXT_REMOTE_WRITE_SCAN_ROOTS_INCOMPLETE');
  }
  if (!Array.isArray(policy.declarations)) V.fail('VNEXT_REMOTE_WRITE_DECLARATIONS_INVALID');
  const ids = new Set();
  for (const d of policy.declarations) {
    V.assertExactKeys(
      d,
      [
        'declaration_id',
        'lifecycle',
        'producer_path',
        'producer_blob_sha40',
        'capability_type',
        'destination',
        'conditions',
        'required_permission_scope',
      ],
      [],
      'VNEXT_REMOTE_WRITE_DECLARATION_KEYS_INVALID',
    );
    V.assertNonEmptyString(d.declaration_id, 'VNEXT_REMOTE_WRITE_DECLARATION_ID_INVALID');
    if (ids.has(d.declaration_id)) V.fail('VNEXT_REMOTE_WRITE_DECLARATION_DUPLICATE', d.declaration_id);
    ids.add(d.declaration_id);
    if (!LIFECYCLES.includes(d.lifecycle)) V.fail('VNEXT_REMOTE_WRITE_LIFECYCLE_INVALID', d.lifecycle);
    V.assertNonEmptyString(d.producer_path, 'VNEXT_REMOTE_WRITE_PRODUCER_INVALID');
    if (normalizePath(d.producer_path) !== d.producer_path) V.fail('VNEXT_REMOTE_WRITE_PRODUCER_NON_CANONICAL');
    V.assertSha40(d.producer_blob_sha40, 'VNEXT_REMOTE_WRITE_PRODUCER_BLOB_INVALID');
    V.assertNonEmptyString(d.capability_type, 'VNEXT_REMOTE_WRITE_CAPABILITY_INVALID');
    V.assertUnicodeExactText(d.destination, 'VNEXT_REMOTE_WRITE_DESTINATION_INVALID');
    V.assertUnicodeExactText(d.conditions, 'VNEXT_REMOTE_WRITE_CONDITIONS_INVALID');
    if (!PERMISSION_SCOPES.includes(d.required_permission_scope)) {
      V.fail('VNEXT_REMOTE_WRITE_PERMISSION_SCOPE_INVALID', d.required_permission_scope);
    }
    if (d.lifecycle === 'VNEXT'
        && d.capability_type === 'GITHUB_PERMISSION_WRITE'
        && d.required_permission_scope !== 'JOB') {
      V.fail('VNEXT_REMOTE_WRITE_VNEXT_PERMISSION_MUST_BE_JOB_SCOPED', d.declaration_id);
    }
    if (d.lifecycle === 'VNEXT' && d.capability_type === 'PERSIST_CREDENTIALS_TRUE') {
      V.fail('VNEXT_REMOTE_WRITE_VNEXT_PERSISTED_CREDENTIALS_FORBIDDEN', d.declaration_id);
    }
  }
  return true;
}

function declarationMatches(declaration, capability) {
  if (declaration.producer_path !== capability.producer_path) return false;
  if (declaration.producer_blob_sha40 !== capability.producer_blob_sha40) return false;
  if (declaration.capability_type !== capability.type) return false;
  if (declaration.destination !== capability.destination) return false;
  if (declaration.required_permission_scope !== 'NONE'
      && declaration.required_permission_scope !== capability.permission_scope) return false;
  return true;
}

function gitBlobSha40(source) {
  const bytes = Buffer.from(String(source), 'utf8');
  return crypto.createHash('sha1')
    .update(Buffer.from('blob ' + bytes.length + '\0', 'utf8'))
    .update(bytes)
    .digest('hex');
}

function producerBlobSha40(root, rel, source) {
  try {
    const value = execFileSync(
      'git',
      ['hash-object', '--path=' + rel, rel],
      { cwd: root, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    if (/^[0-9a-f]{40}$/.test(value)) return value;
  } catch (_) {
    // Fixtures need not be Git repositories.
  }
  return gitBlobSha40(source);
}

function scanRepository({ root, policy }) {
  validatePolicy(policy);
  const files = collectExecutableFiles(root);
  const capabilities = [];
  for (const file of files) {
    const rel = normalizePath(path.relative(root, file));
    const source = fs.readFileSync(file, 'utf8');
    const producerBlob = producerBlobSha40(root, rel, source);
    capabilities.push(...detectCapabilities(rel, source).map((row) => ({
      ...row,
      producer_blob_sha40: producerBlob,
    })));
  }

  const assignments = [];
  const undeclared = [];
  for (const capability of capabilities) {
    const matches = policy.declarations.filter((d) => declarationMatches(d, capability));
    if (matches.length !== 1) {
      undeclared.push(capability);
      continue;
    }
    assignments.push({
      capability,
      declaration_id: matches[0].declaration_id,
      lifecycle: matches[0].lifecycle,
      conditions: matches[0].conditions,
    });
  }

  const detectedIds = new Set(assignments.map((x) => x.declaration_id));
  const unusedDeclarations = policy.declarations
    .filter((d) => !detectedIds.has(d.declaration_id))
    .map((d) => d.declaration_id)
    .sort();

  return V.sealContract({
    schema_version: REPORT_SCHEMA,
    policy_hash: V.canonicalHash(policy),
    scanned_roots: [...EXECUTABLE_ROOTS],
    scanned_file_count: files.length,
    capability_count: capabilities.length,
    declared_capability_count: assignments.length,
    undeclared_capabilities: undeclared,
    assignments,
    unused_declaration_ids: unusedDeclarations,
    status: undeclared.length === 0 ? 'PASS' : 'FAIL',
  });
}

function validateReport(report, policy) {
  V.assertExactKeys(
    report,
    [
      'schema_version',
      'policy_hash',
      'scanned_roots',
      'scanned_file_count',
      'capability_count',
      'declared_capability_count',
      'undeclared_capabilities',
      'assignments',
      'unused_declaration_ids',
      'status',
      'contract_hash',
    ],
    [],
    'VNEXT_REMOTE_WRITE_REPORT_KEYS_INVALID',
  );
  if (report.schema_version !== REPORT_SCHEMA) V.fail('VNEXT_REMOTE_WRITE_REPORT_SCHEMA_INVALID');
  V.verifyContractHash(report, 'VNEXT_REMOTE_WRITE_REPORT_HASH_MISMATCH');
  if (report.policy_hash !== V.canonicalHash(policy)) V.fail('VNEXT_REMOTE_WRITE_POLICY_HASH_MISMATCH');
  if (!['PASS', 'FAIL'].includes(report.status)) V.fail('VNEXT_REMOTE_WRITE_REPORT_STATUS_INVALID');
  if ((report.undeclared_capabilities.length === 0) !== (report.status === 'PASS')) {
    V.fail('VNEXT_REMOTE_WRITE_REPORT_STATUS_MISMATCH');
  }
  return true;
}

function buildGate({ report, policy, activeLegacySliceIds }) {
  validateReport(report, policy);
  const activeLegacy = V.uniqueStrings(
    activeLegacySliceIds,
    'VNEXT_REMOTE_WRITE_ACTIVE_LEGACY_INVALID',
    'activeLegacySliceIds',
    { allowEmpty: true },
  ).sort();
  if (report.status !== 'PASS') {
    return V.sealContract({
      schema_version: GATE_SCHEMA,
      report_hash: report.contract_hash,
      policy_hash: V.canonicalHash(policy),
      active_legacy_slice_ids: activeLegacy,
      legacy_writer_declaration_ids: [],
      qualification_writer_declaration_ids: [],
      legacy_retirement_status: 'UNKNOWN',
      status: 'BLOCKED_UNDECLARED_REMOTE_WRITE',
    });
  }

  const legacyIds = [...new Set(
    report.assignments
      .filter((row) => row.lifecycle === 'LEGACY_GRANDFATHERED')
      .map((row) => row.declaration_id),
  )].sort();
  const qualificationIds = [...new Set(
    report.assignments
      .filter((row) => row.lifecycle === 'QUALIFICATION')
      .map((row) => row.declaration_id),
  )].sort();

  let retirement;
  let status = 'REMOTE_WRITE_CONTROL_READY';
  if (qualificationIds.length > 0) {
    retirement = legacyIds.length === 0
      ? 'LEGACY_WRITERS_RETIRED'
      : (activeLegacy.length > 0 ? 'LEGACY_WRITERS_GRANDFATHERED' : 'LEGACY_WRITERS_NOT_RETIRED');
    status = 'BLOCKED_QUALIFICATION_WRITER_PRESENT';
  } else if (legacyIds.length === 0) retirement = 'LEGACY_WRITERS_RETIRED';
  else if (activeLegacy.length > 0) retirement = 'LEGACY_WRITERS_GRANDFATHERED';
  else {
    retirement = 'LEGACY_WRITERS_NOT_RETIRED';
    status = 'BLOCKED_LEGACY_WRITERS_NOT_RETIRED';
  }

  return V.sealContract({
    schema_version: GATE_SCHEMA,
    report_hash: report.contract_hash,
    policy_hash: V.canonicalHash(policy),
    active_legacy_slice_ids: activeLegacy,
    legacy_writer_declaration_ids: legacyIds,
    qualification_writer_declaration_ids: qualificationIds,
    legacy_retirement_status: retirement,
    status,
  });
}

function validateGate(gate, report, policy) {
  V.assertExactKeys(
    gate,
    [
      'schema_version',
      'report_hash',
      'policy_hash',
      'active_legacy_slice_ids',
      'legacy_writer_declaration_ids',
      'qualification_writer_declaration_ids',
      'legacy_retirement_status',
      'status',
      'contract_hash',
    ],
    [],
    'VNEXT_REMOTE_WRITE_GATE_KEYS_INVALID',
  );
  if (gate.schema_version !== GATE_SCHEMA) V.fail('VNEXT_REMOTE_WRITE_GATE_SCHEMA_INVALID');
  V.verifyContractHash(gate, 'VNEXT_REMOTE_WRITE_GATE_HASH_MISMATCH');
  if (gate.report_hash !== report.contract_hash) V.fail('VNEXT_REMOTE_WRITE_GATE_REPORT_MISMATCH');
  if (gate.policy_hash !== V.canonicalHash(policy)) V.fail('VNEXT_REMOTE_WRITE_GATE_POLICY_MISMATCH');
  const rebuilt = buildGate({
    report,
    policy,
    activeLegacySliceIds: gate.active_legacy_slice_ids,
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(gate)) {
    V.fail('VNEXT_REMOTE_WRITE_GATE_REBUILD_MISMATCH');
  }
  return true;
}

module.exports = {
  POLICY_SCHEMA,
  REPORT_SCHEMA,
  GATE_SCHEMA,
  EXECUTABLE_ROOTS,
  collectExecutableFiles,
  detectCapabilities,
  validatePolicy,
  scanRepository,
  validateReport,
  buildGate,
  validateGate,
  sha256,
  gitBlobSha40,
  producerBlobSha40,
};
