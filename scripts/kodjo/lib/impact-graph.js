'use strict';

const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const V = require('./vnext-contract');
const RequirementRegistry = require('./requirement-registry');
const { normalizeScopeCandidate } = require('./scope-path');
const { extractSpecifiers, resolveSpecifier } = require('./plan-impact');

const CANDIDATE_SCHEMA = 'kodjo.vnext.impact-candidates.v1';
const DIRECT_SCAN_SCHEMA = 'kodjo.vnext.direct-import-scan.v1';
const IMPACT_SCHEMA = 'kodjo.vnext.impact-graph.v1';

const CHANGE_KINDS = Object.freeze(['MODIFY', 'CREATE', 'DELETE', 'NO_CHANGE']);
const EXISTING_CHANGE_KINDS = Object.freeze(['MODIFY', 'DELETE', 'NO_CHANGE']);
const CREATE_CHANGE_KINDS = Object.freeze(['CREATE', 'NO_CHANGE']);
const CREATE_ROOTS = Object.freeze(['app/', 'src/', 'tests/', 'assets/', 'docs/', 'scripts/', '.github/']);
const SOURCE_EXTENSIONS = Object.freeze(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function git(args, cwd, encoding = 'utf8') {
  const result = spawnSync('git', args, {
    cwd,
    encoding,
    windowsHide: true,
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    V.fail(
      'VNEXT_IMPACT_GIT_FAILED',
      `git ${args.join(' ')}: ${String(result.stderr || result.error?.message || '').trim()}`,
    );
  }
  return result.stdout;
}

function normalizeRepoPath(value, code = 'VNEXT_IMPACT_PATH_INVALID', label = 'path') {
  const normalized = normalizeScopeCandidate(value);
  if (!normalized || normalized !== value) V.fail(code, `${label}=${String(value)}`);
  V.assertUnicodeExactText(normalized, code, label);
  return normalized;
}

function candidateKind(file) {
  if (/(?:^|\/)(?:__tests__|tests?)\//.test(file) || /\.(?:test|spec)\.[^.]+$/.test(file)) return 'TEST';
  if (file.startsWith('.github/')) return 'WORKFLOW';
  if (file.startsWith('docs/') || file.endsWith('.md')) return 'DOCUMENTATION';
  if (file.startsWith('assets/')) return 'ASSET';
  if (SOURCE_EXTENSIONS.some((ext) => file.endsWith(ext)) || /\.(?:json|ya?ml|ps1|py|sh)$/.test(file)) return 'CODE';
  return 'OTHER';
}

function validateCreateSlot(slot, revision, existingFiles, index) {
  V.assertExactKeys(
    slot,
    ['path', 'policy_id', 'policy_hash'],
    [],
    'VNEXT_CREATE_SLOT_KEYS_INVALID',
  );
  const repoPath = normalizeRepoPath(slot.path, 'VNEXT_CREATE_SLOT_PATH_INVALID', `create_slots[${index}].path`);
  if (!CREATE_ROOTS.some((root) => repoPath.startsWith(root))) {
    V.fail('VNEXT_CREATE_SLOT_ROOT_FORBIDDEN', repoPath);
  }
  if (existingFiles.has(repoPath)) V.fail('VNEXT_CREATE_SLOT_ALREADY_EXISTS', repoPath);
  V.assertNonEmptyString(slot.policy_id, 'VNEXT_CREATE_SLOT_POLICY_INVALID', 'policy_id');
  V.assertSha64(slot.policy_hash, 'VNEXT_CREATE_SLOT_POLICY_HASH_INVALID', 'policy_hash');
  return Object.freeze({
    candidate_id: V.stableId('CAND', [revision, 'CREATE_SLOT', repoPath, slot.policy_id, slot.policy_hash]),
    path: repoPath,
    candidate_kind: 'CREATE_SLOT',
    origin: 'CREATE_SLOT_POLICY',
    policy_id: slot.policy_id,
    policy_hash: slot.policy_hash,
    allowed_change_kinds: [...CREATE_CHANGE_KINDS],
  });
}

function buildCandidateManifest({ cwd = process.cwd(), revision, createSlots = [] }) {
  V.assertSha40(revision, 'VNEXT_IMPACT_REVISION_INVALID', 'revision');
  git(['cat-file', '-e', revision + '^{commit}'], cwd);

  const rawTree = git(['ls-tree', '-r', '-z', revision], cwd, 'buffer');
  const treeSha256 = crypto.createHash('sha256').update(rawTree).digest('hex');
  const rawNames = git(['ls-tree', '-r', '--name-only', '-z', revision], cwd, 'buffer');
  const files = rawNames.toString('utf8').split('\0').filter(Boolean)
    .map((file) => normalizeRepoPath(file))
    .sort();

  const fileSet = new Set(files);
  const candidates = files.map((file) => Object.freeze({
    candidate_id: V.stableId('CAND', [revision, 'EXISTING_FILE', file]),
    path: file,
    candidate_kind: candidateKind(file),
    origin: 'GIT_TREE',
    policy_id: null,
    policy_hash: null,
    allowed_change_kinds: [...EXISTING_CHANGE_KINDS],
  }));

  if (!Array.isArray(createSlots)) V.fail('VNEXT_CREATE_SLOTS_INVALID');
  for (let index = 0; index < createSlots.length; index += 1) {
    candidates.push(validateCreateSlot(createSlots[index], revision, fileSet, index));
  }

  candidates.sort((a, b) => a.path.localeCompare(b.path) || a.origin.localeCompare(b.origin));
  const ids = candidates.map((candidate) => candidate.candidate_id);
  if (new Set(ids).size !== ids.length) V.fail('VNEXT_IMPACT_CANDIDATE_ID_DUPLICATE');
  const pathOrigin = candidates.map((candidate) => `${candidate.origin}\u0000${candidate.path}`);
  if (new Set(pathOrigin).size !== pathOrigin.length) V.fail('VNEXT_IMPACT_CANDIDATE_DUPLICATE');

  return V.sealContract({
    schema_version: CANDIDATE_SCHEMA,
    revision,
    git_tree_sha256: treeSha256,
    candidate_count: candidates.length,
    candidates,
  });
}

function validateCandidateManifest(manifest) {
  V.assertExactKeys(
    manifest,
    ['schema_version', 'revision', 'git_tree_sha256', 'candidate_count', 'candidates', 'contract_hash'],
    [],
    'VNEXT_IMPACT_CANDIDATE_MANIFEST_KEYS_INVALID',
  );
  if (manifest.schema_version !== CANDIDATE_SCHEMA) {
    V.fail('VNEXT_IMPACT_CANDIDATE_SCHEMA_INVALID', manifest.schema_version);
  }
  V.assertSha40(manifest.revision, 'VNEXT_IMPACT_REVISION_INVALID', 'revision');
  V.assertSha64(manifest.git_tree_sha256, 'VNEXT_IMPACT_TREE_HASH_INVALID', 'git_tree_sha256');
  V.verifyContractHash(manifest, 'VNEXT_IMPACT_CANDIDATE_HASH_MISMATCH');
  if (!Array.isArray(manifest.candidates) || manifest.candidate_count !== manifest.candidates.length) {
    V.fail('VNEXT_IMPACT_CANDIDATE_COUNT_MISMATCH');
  }
  const ids = new Set();
  for (const candidate of manifest.candidates) {
    V.assertExactKeys(
      candidate,
      [
        'candidate_id', 'path', 'candidate_kind', 'origin', 'policy_id', 'policy_hash',
        'allowed_change_kinds',
      ],
      [],
      'VNEXT_IMPACT_CANDIDATE_KEYS_INVALID',
    );
    normalizeRepoPath(candidate.path);
    if (ids.has(candidate.candidate_id)) V.fail('VNEXT_IMPACT_CANDIDATE_ID_DUPLICATE', candidate.candidate_id);
    ids.add(candidate.candidate_id);
    const expectedId = candidate.origin === 'GIT_TREE'
      ? V.stableId('CAND', [manifest.revision, 'EXISTING_FILE', candidate.path])
      : V.stableId('CAND', [
        manifest.revision, 'CREATE_SLOT', candidate.path, candidate.policy_id, candidate.policy_hash,
      ]);
    if (candidate.candidate_id !== expectedId) V.fail('VNEXT_IMPACT_CANDIDATE_ID_MISMATCH', candidate.candidate_id);
    if (candidate.origin === 'GIT_TREE') {
      if (candidate.candidate_kind !== candidateKind(candidate.path)) {
        V.fail('VNEXT_IMPACT_CANDIDATE_KIND_MISMATCH', candidate.path);
      }
      if (candidate.policy_id !== null || candidate.policy_hash !== null) V.fail('VNEXT_IMPACT_GIT_CANDIDATE_POLICY_FORBIDDEN');
      if (V.canonicalStringify(candidate.allowed_change_kinds) !== V.canonicalStringify(EXISTING_CHANGE_KINDS)) {
        V.fail('VNEXT_IMPACT_EXISTING_CHANGE_KINDS_INVALID', candidate.path);
      }
    } else if (candidate.origin === 'CREATE_SLOT_POLICY') {
      if (candidate.candidate_kind !== 'CREATE_SLOT') V.fail('VNEXT_IMPACT_CREATE_SLOT_KIND_INVALID', candidate.path);
      if (!CREATE_ROOTS.some((root) => candidate.path.startsWith(root))) {
        V.fail('VNEXT_CREATE_SLOT_ROOT_FORBIDDEN', candidate.path);
      }
      V.assertNonEmptyString(candidate.policy_id, 'VNEXT_CREATE_SLOT_POLICY_INVALID', 'policy_id');
      V.assertSha64(candidate.policy_hash, 'VNEXT_CREATE_SLOT_POLICY_HASH_INVALID', 'policy_hash');
      if (V.canonicalStringify(candidate.allowed_change_kinds) !== V.canonicalStringify(CREATE_CHANGE_KINDS)) {
        V.fail('VNEXT_IMPACT_CREATE_CHANGE_KINDS_INVALID', candidate.path);
      }
    } else {
      V.fail('VNEXT_IMPACT_CANDIDATE_ORIGIN_INVALID', candidate.origin);
    }
  }
  return true;
}

function verifyCandidateManifestAtHead(manifest, { cwd = process.cwd() } = {}) {
  validateCandidateManifest(manifest);
  git(['cat-file', '-e', manifest.revision + '^{commit}'], cwd);
  const rawTree = git(['ls-tree', '-r', '-z', manifest.revision], cwd, 'buffer');
  const currentHash = crypto.createHash('sha256').update(rawTree).digest('hex');
  if (currentHash !== manifest.git_tree_sha256) V.fail('VNEXT_IMPACT_TREE_DRIFT');
  const tracked = new Set(
    git(['ls-tree', '-r', '--name-only', '-z', manifest.revision], cwd, 'buffer')
      .toString('utf8').split('\0').filter(Boolean).map((file) => normalizeRepoPath(file)),
  );
  for (const candidate of manifest.candidates) {
    if (candidate.origin === 'GIT_TREE' && !tracked.has(candidate.path)) {
      V.fail('VNEXT_IMPACT_EXISTING_PATH_ABSENT', candidate.path);
    }
    if (candidate.origin === 'CREATE_SLOT_POLICY' && tracked.has(candidate.path)) {
      V.fail('VNEXT_CREATE_SLOT_ALREADY_EXISTS', candidate.path);
    }
  }
  return true;
}

function scanOneLevelDirectImporters({
  cwd = process.cwd(),
  candidateManifest,
  modifyCandidateIds,
}) {
  validateCandidateManifest(candidateManifest);
  if (!Array.isArray(modifyCandidateIds) || modifyCandidateIds.length === 0) {
    V.fail('VNEXT_DIRECT_IMPORT_TARGETS_EMPTY');
  }
  if (new Set(modifyCandidateIds).size !== modifyCandidateIds.length) {
    V.fail('VNEXT_DIRECT_IMPORT_TARGET_DUPLICATE');
  }

  const byId = new Map(candidateManifest.candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const targets = modifyCandidateIds.map((id) => {
    const candidate = byId.get(id);
    if (!candidate) V.fail('VNEXT_DIRECT_IMPORT_TARGET_UNKNOWN', id);
    if (candidate.origin !== 'GIT_TREE') V.fail('VNEXT_DIRECT_IMPORT_TARGET_NOT_EXISTING', id);
    if (!SOURCE_EXTENSIONS.some((ext) => candidate.path.endsWith(ext))) {
      V.fail('VNEXT_DIRECT_IMPORT_TARGET_NOT_SOURCE', candidate.path);
    }
    return candidate;
  });
  const targetPathSet = new Set(targets.map((target) => target.path));
  const fileSet = new Set(
    candidateManifest.candidates
      .filter((candidate) => candidate.origin === 'GIT_TREE')
      .map((candidate) => candidate.path),
  );
  const idByPath = new Map(
    candidateManifest.candidates
      .filter((candidate) => candidate.origin === 'GIT_TREE')
      .map((candidate) => [candidate.path, candidate.candidate_id]),
  );

  const importers = [];
  const sourceFiles = [...fileSet]
    .filter((file) => SOURCE_EXTENSIONS.some((ext) => file.endsWith(ext)))
    .sort();

  for (const file of sourceFiles) {
    if (targetPathSet.has(file)) continue;
    const source = String(git(['show', candidateManifest.revision + ':' + file], cwd));
    const triggeredPaths = extractSpecifiers(source)
      .map((specifier) => resolveSpecifier(file, specifier, fileSet))
      .filter((resolved) => resolved && targetPathSet.has(resolved));
    const uniquePaths = [...new Set(triggeredPaths)].sort();
    if (uniquePaths.length === 0) continue;

    importers.push({
      candidate_id: idByPath.get(file),
      path: file,
      candidate_kind: candidateKind(file),
      triggered_by_candidate_ids: uniquePaths.map((targetPath) => idByPath.get(targetPath)).sort(),
    });
  }

  importers.sort((a, b) => a.path.localeCompare(b.path));
  return V.sealContract({
    schema_version: DIRECT_SCAN_SCHEMA,
    revision: candidateManifest.revision,
    candidate_manifest_hash: candidateManifest.contract_hash,
    target_candidate_ids: [...modifyCandidateIds].sort(),
    importer_count: importers.length,
    importers,
  });
}

function validateDirectImportScan(scan, candidateManifest) {
  V.assertExactKeys(
    scan,
    [
      'schema_version', 'revision', 'candidate_manifest_hash', 'target_candidate_ids',
      'importer_count', 'importers', 'contract_hash',
    ],
    [],
    'VNEXT_DIRECT_IMPORT_SCAN_KEYS_INVALID',
  );
  if (scan.schema_version !== DIRECT_SCAN_SCHEMA) V.fail('VNEXT_DIRECT_IMPORT_SCAN_SCHEMA_INVALID');
  V.verifyContractHash(scan, 'VNEXT_DIRECT_IMPORT_SCAN_HASH_MISMATCH');
  validateCandidateManifest(candidateManifest);
  if (scan.revision !== candidateManifest.revision) V.fail('VNEXT_DIRECT_IMPORT_SCAN_REVISION_MISMATCH');
  if (scan.candidate_manifest_hash !== candidateManifest.contract_hash) {
    V.fail('VNEXT_DIRECT_IMPORT_CANDIDATE_MANIFEST_MISMATCH');
  }
  if (!Array.isArray(scan.importers) || scan.importer_count !== scan.importers.length) {
    V.fail('VNEXT_DIRECT_IMPORT_COUNT_MISMATCH');
  }
  return true;
}

function verifyDirectImportScanAtHead(scan, candidateManifest, { cwd = process.cwd() } = {}) {
  verifyCandidateManifestAtHead(candidateManifest, { cwd });
  validateDirectImportScan(scan, candidateManifest);
  const rebuilt = scanOneLevelDirectImporters({
    cwd, candidateManifest, modifyCandidateIds: scan.target_candidate_ids,
  });
  if (V.canonicalStringify(scan) !== V.canonicalStringify(rebuilt)) {
    V.fail('VNEXT_DIRECT_IMPORT_SCAN_REBUILD_MISMATCH');
  }
  return true;
}

function classificationKey(requirementId, candidateId) {
  return `${requirementId}\u0000${candidateId === null ? '<NO_TARGET>' : candidateId}`;
}

function normalizeClassification(row, index, requirementIds, candidateById) {
  V.assertExactKeys(
    row,
    [
      'requirement_id', 'candidate_id', 'change_kind', 'impact_reason',
      'dependency_evidence', 'tests_affected_candidate_ids', 'preservation_candidate_ids',
    ],
    [],
    'VNEXT_IMPACT_CLASSIFICATION_KEYS_INVALID',
  );
  if (!requirementIds.has(row.requirement_id)) V.fail('VNEXT_IMPACT_REQUIREMENT_UNKNOWN', row.requirement_id);
  if (!CHANGE_KINDS.includes(row.change_kind)) V.fail('VNEXT_IMPACT_CHANGE_KIND_INVALID', row.change_kind);
  V.assertUnicodeExactText(row.impact_reason, 'VNEXT_IMPACT_REASON_INVALID', `classifications[${index}].impact_reason`);
  const dependencyEvidence = V.uniqueStrings(
    row.dependency_evidence,
    'VNEXT_IMPACT_DEPENDENCY_EVIDENCE_INVALID',
    `classifications[${index}].dependency_evidence`,
    { allowEmpty: row.change_kind === 'NO_CHANGE' },
  );
  const testsAffected = V.uniqueStrings(
    row.tests_affected_candidate_ids,
    'VNEXT_IMPACT_TEST_IDS_INVALID',
    `classifications[${index}].tests_affected_candidate_ids`,
    { allowEmpty: true },
  );
  const preservation = V.uniqueStrings(
    row.preservation_candidate_ids,
    'VNEXT_IMPACT_PRESERVATION_IDS_INVALID',
    `classifications[${index}].preservation_candidate_ids`,
    { allowEmpty: true },
  );

  if (row.candidate_id === null) {
    if (row.change_kind !== 'NO_CHANGE') V.fail('VNEXT_IMPACT_NULL_TARGET_ONLY_NO_CHANGE');
    if (testsAffected.length || preservation.length) V.fail('VNEXT_IMPACT_NULL_TARGET_EDGES_FORBIDDEN');
  } else {
    V.assertNonEmptyString(row.candidate_id, 'VNEXT_IMPACT_CANDIDATE_ID_INVALID', 'candidate_id');
    const candidate = candidateById.get(row.candidate_id);
    if (!candidate) V.fail('VNEXT_IMPACT_CANDIDATE_UNKNOWN', row.candidate_id);
    if (!candidate.allowed_change_kinds.includes(row.change_kind)) {
      V.fail('VNEXT_IMPACT_CHANGE_KIND_NOT_ALLOWED', `${candidate.path}:${row.change_kind}`);
    }
  }

  for (const id of [...testsAffected, ...preservation]) {
    if (!candidateById.has(id)) V.fail('VNEXT_IMPACT_EDGE_CANDIDATE_UNKNOWN', id);
  }

  return {
    requirement_id: row.requirement_id,
    candidate_id: row.candidate_id,
    change_kind: row.change_kind,
    impact_reason: row.impact_reason,
    dependency_evidence: dependencyEvidence,
    tests_affected_candidate_ids: testsAffected,
    preservation_candidate_ids: preservation,
  };
}

function buildImpactGraph({
  requirementRegistry,
  candidateManifest,
  classifications,
  directImportScan = null,
}) {
  RequirementRegistry.assertReady(requirementRegistry);
  validateCandidateManifest(candidateManifest);
  if (!Array.isArray(classifications)) V.fail('VNEXT_IMPACT_CLASSIFICATIONS_INVALID');

  const requirementIds = new Set(requirementRegistry.requirements.map((req) => req.requirement_id));
  const candidateById = new Map(candidateManifest.candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const normalized = classifications.map((row, index) =>
    normalizeClassification(row, index, requirementIds, candidateById));

  const seen = new Set();
  for (const row of normalized) {
    const key = classificationKey(row.requirement_id, row.candidate_id);
    if (seen.has(key)) V.fail('VNEXT_IMPACT_CLASSIFICATION_DUPLICATE', key);
    seen.add(key);
  }

  const rowsByRequirement = new Map();
  for (const reqId of requirementIds) rowsByRequirement.set(reqId, []);
  for (const row of normalized) rowsByRequirement.get(row.requirement_id).push(row);

  for (const [reqId, rows] of rowsByRequirement) {
    if (rows.length === 0) V.fail('VNEXT_IMPACT_REQUIREMENT_UNCOVERED', reqId);
    const targetlessNoChange = rows.filter((row) => row.candidate_id === null && row.change_kind === 'NO_CHANGE');
    if (targetlessNoChange.length > 1) V.fail('VNEXT_IMPACT_NO_CHANGE_DUPLICATE', reqId);
    if (targetlessNoChange.length === 1 && rows.length !== 1) {
      V.fail('VNEXT_IMPACT_NO_CHANGE_MIXED_WITH_TARGETS', reqId);
    }
  }

  const selectedModifyIds = [...new Set(
    normalized
      .filter((row) => row.change_kind === 'MODIFY' && row.candidate_id !== null)
      .map((row) => row.candidate_id),
  )].sort();
  const selectedDirectRootIds = selectedModifyIds.filter((id) => {
    const candidate = candidateById.get(id);
    return candidate
      && candidate.origin === 'GIT_TREE'
      && candidate.candidate_kind === 'CODE'
      && SOURCE_EXTENSIONS.some((ext) => candidate.path.endsWith(ext));
  });

  if (selectedDirectRootIds.length > 0) {
    if (!directImportScan) V.fail('VNEXT_DIRECT_IMPORT_SCAN_REQUIRED');
    validateDirectImportScan(directImportScan, candidateManifest);
    if (V.canonicalStringify(directImportScan.target_candidate_ids) !== V.canonicalStringify(selectedDirectRootIds)) {
      V.fail('VNEXT_DIRECT_IMPORT_TARGET_SET_MISMATCH');
    }

    const modifiedByRequirement = new Map();
    for (const row of normalized.filter((item) => item.change_kind === 'MODIFY')) {
      const set = modifiedByRequirement.get(row.requirement_id) || new Set();
      set.add(row.candidate_id);
      modifiedByRequirement.set(row.requirement_id, set);
    }

    for (const importer of directImportScan.importers) {
      for (const [reqId, targetIds] of modifiedByRequirement) {
        const relevant = importer.triggered_by_candidate_ids.some((id) => targetIds.has(id));
        if (!relevant) continue;
        const key = classificationKey(reqId, importer.candidate_id);
        if (!seen.has(key)) {
          V.fail('VNEXT_DIRECT_IMPORT_CLASSIFICATION_MISSING', `${reqId}:${importer.path}`);
        }
      }
    }
  } else if (directImportScan !== null) {
    V.fail('VNEXT_DIRECT_IMPORT_SCAN_UNEXPECTED');
  }

  const directByCandidate = new Map();
  if (directImportScan) {
    for (const importer of directImportScan.importers) {
      directByCandidate.set(importer.candidate_id, importer.triggered_by_candidate_ids);
    }
  }

  const impacts = normalized.map((row) => {
    const candidate = row.candidate_id === null ? null : candidateById.get(row.candidate_id);
    return {
      impact_id: V.stableId('IMP', [row.requirement_id, row.candidate_id, row.change_kind]),
      requirement_id: row.requirement_id,
      candidate_id: row.candidate_id,
      target_id: row.candidate_id,
      path: candidate ? candidate.path : null,
      target_kind: candidate ? candidate.candidate_kind : 'NO_TARGET',
      change_kind: row.change_kind,
      candidate_origin: candidate ? candidate.origin : 'REQUIREMENT_LEVEL',
      impact_reason: row.impact_reason,
      dependency_evidence: row.dependency_evidence,
      direct_import_trigger_ids: row.candidate_id && directByCandidate.has(row.candidate_id)
        ? [...directByCandidate.get(row.candidate_id)]
        : [],
      tests_affected_candidate_ids: row.tests_affected_candidate_ids,
      preservation_candidate_ids: row.preservation_candidate_ids,
    };
  }).sort((a, b) =>
    a.requirement_id.localeCompare(b.requirement_id)
      || String(a.path).localeCompare(String(b.path))
      || a.change_kind.localeCompare(b.change_kind));

  return V.sealContract({
    schema_version: IMPACT_SCHEMA,
    requirement_registry_hash: requirementRegistry.contract_hash,
    candidate_manifest_hash: candidateManifest.contract_hash,
    direct_import_scan_hash: directImportScan ? directImportScan.contract_hash : null,
    impact_count: impacts.length,
    requirement_count: requirementIds.size,
    impacts,
  });
}

function validateImpactGraph(graph, { requirementRegistry, candidateManifest, directImportScan = null }) {
  V.assertExactKeys(
    graph,
    [
      'schema_version', 'requirement_registry_hash', 'candidate_manifest_hash',
      'direct_import_scan_hash', 'impact_count', 'requirement_count', 'impacts', 'contract_hash',
    ],
    [],
    'VNEXT_IMPACT_GRAPH_KEYS_INVALID',
  );
  if (graph.schema_version !== IMPACT_SCHEMA) V.fail('VNEXT_IMPACT_GRAPH_SCHEMA_INVALID');
  V.verifyContractHash(graph, 'VNEXT_IMPACT_GRAPH_HASH_MISMATCH');
  if (graph.requirement_registry_hash !== requirementRegistry.contract_hash) {
    V.fail('VNEXT_IMPACT_REQUIREMENT_REGISTRY_HASH_MISMATCH');
  }
  if (graph.candidate_manifest_hash !== candidateManifest.contract_hash) {
    V.fail('VNEXT_IMPACT_CANDIDATE_MANIFEST_HASH_MISMATCH');
  }
  const expectedDirectHash = directImportScan ? directImportScan.contract_hash : null;
  if (graph.direct_import_scan_hash !== expectedDirectHash) V.fail('VNEXT_IMPACT_DIRECT_SCAN_HASH_MISMATCH');

  const classifications = graph.impacts.map((impact) => ({
    requirement_id: impact.requirement_id,
    candidate_id: impact.candidate_id,
    change_kind: impact.change_kind,
    impact_reason: impact.impact_reason,
    dependency_evidence: impact.dependency_evidence,
    tests_affected_candidate_ids: impact.tests_affected_candidate_ids,
    preservation_candidate_ids: impact.preservation_candidate_ids,
  }));
  const rebuilt = buildImpactGraph({
    requirementRegistry,
    candidateManifest,
    classifications,
    directImportScan,
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(graph)) {
    V.fail('VNEXT_IMPACT_GRAPH_REBUILD_MISMATCH');
  }
  return true;
}

module.exports = {
  verifyDirectImportScanAtHead,
  CANDIDATE_SCHEMA,
  DIRECT_SCAN_SCHEMA,
  IMPACT_SCHEMA,
  CHANGE_KINDS,
  CREATE_ROOTS,
  buildCandidateManifest,
  validateCandidateManifest,
  verifyCandidateManifestAtHead,
  scanOneLevelDirectImporters,
  validateDirectImportScan,
  buildImpactGraph,
  validateImpactGraph,
};
