'use strict';

const V = require('./vnext-contract');
const SourceManifest = require('./source-manifest');

const SCHEMA = 'kodjo.vnext.requirement-registry.v1';
const REQUIREMENT_KINDS = Object.freeze([
  'FUNCTIONAL',
  'UI',
  'DATA',
  'TECHNICAL',
  'MIGRATION',
  'PRESERVATION',
  'NON_FUNCTIONAL',
]);
const REQUIREMENT_STATUSES = Object.freeze(['ACTIVE', 'CLARIFICATION_REQUIRED']);
const PRIORITIES = Object.freeze(['MUST', 'SHOULD', 'MAY', 'UNSPECIFIED']);
const REGISTRY_STATUSES = Object.freeze(['READY', 'BLOCKED']);

function sourceIndex(manifest) {
  const sources = new Map();
  const units = new Map();
  for (const source of manifest.sources) {
    sources.set(source.source_id, source);
    for (const unit of source.units) {
      if (units.has(unit.unit_id)) V.fail('VNEXT_REQUIREMENT_SOURCE_UNIT_COLLISION', unit.unit_id);
      units.set(unit.unit_id, { source, unit });
    }
  }
  return { sources, units };
}

function validateRequirementInput(row, index, indexData) {
  V.assertExactKeys(
    row,
    [
      'source_id', 'unit_id', 'kind', 'statement', 'priority', 'status', 'rationale',
      'related_unit_ids', 'conflict_unit_ids',
    ],
    [],
    'VNEXT_REQUIREMENT_INPUT_KEYS_INVALID',
  );

  const source = indexData.sources.get(row.source_id);
  const located = indexData.units.get(row.unit_id);
  if (!source) V.fail('VNEXT_REQUIREMENT_SOURCE_UNKNOWN', row.source_id);
  if (!located || located.source.source_id !== row.source_id) {
    V.fail('VNEXT_REQUIREMENT_UNIT_SOURCE_MISMATCH', String(row.unit_id));
  }

  const disposition = located.unit.disposition;
  if (!['REQUIREMENT_SOURCE', 'AMBIGUOUS'].includes(disposition)) {
    V.fail('VNEXT_REQUIREMENT_SOURCE_DISPOSITION_FORBIDDEN', `${row.unit_id}:${disposition}`);
  }

  if (!REQUIREMENT_KINDS.includes(row.kind)) V.fail('VNEXT_REQUIREMENT_KIND_INVALID', row.kind);
  V.assertUnicodeExactText(row.statement, 'VNEXT_REQUIREMENT_STATEMENT_INVALID', `requirements[${index}].statement`);
  if (!PRIORITIES.includes(row.priority)) V.fail('VNEXT_REQUIREMENT_PRIORITY_INVALID', row.priority);
  if (!REQUIREMENT_STATUSES.includes(row.status)) V.fail('VNEXT_REQUIREMENT_STATUS_INVALID', row.status);
  V.assertUnicodeExactText(row.rationale, 'VNEXT_REQUIREMENT_RATIONALE_INVALID', `requirements[${index}].rationale`);

  if (disposition === 'REQUIREMENT_SOURCE' && row.status !== 'ACTIVE') {
    V.fail('VNEXT_REQUIREMENT_SOURCE_STATUS_MISMATCH', row.unit_id);
  }
  if (disposition === 'AMBIGUOUS' && row.status !== 'CLARIFICATION_REQUIRED') {
    V.fail('VNEXT_AMBIGUOUS_SOURCE_STATUS_MISMATCH', row.unit_id);
  }

  const relatedUnitIds = V.uniqueStrings(
    row.related_unit_ids,
    'VNEXT_REQUIREMENT_RELATED_UNITS_INVALID',
    `requirements[${index}].related_unit_ids`,
    { allowEmpty: true },
  );
  const conflictUnitIds = V.uniqueStrings(
    row.conflict_unit_ids,
    'VNEXT_REQUIREMENT_CONFLICT_UNITS_INVALID',
    `requirements[${index}].conflict_unit_ids`,
    { allowEmpty: true },
  );

  for (const unitId of [...relatedUnitIds, ...conflictUnitIds]) {
    if (unitId === row.unit_id) V.fail('VNEXT_REQUIREMENT_SELF_RELATION', unitId);
    if (!indexData.units.has(unitId)) V.fail('VNEXT_REQUIREMENT_RELATED_UNIT_UNKNOWN', unitId);
  }

  const requirementId = V.stableId('REQ', [
    source.source_id,
    located.unit.unit_id,
    located.unit.fingerprint,
    row.kind,
    row.statement,
  ]);

  return {
    requirement_id: requirementId,
    source_id: source.source_id,
    unit_id: located.unit.unit_id,
    kind: row.kind,
    statement: row.statement,
    priority: row.priority,
    status: row.status,
    preservation: row.kind === 'PRESERVATION' ? 'REQUIRED' : 'NONE_DECLARED',
    rationale: row.rationale,
    related_unit_ids: relatedUnitIds,
    conflict_unit_ids: conflictUnitIds,
    source: {
      source_kind: source.source_kind,
      authority: source.authority,
      locator: source.locator,
      revision: source.revision,
      unit_locator: located.unit.locator,
      unit_fingerprint: located.unit.fingerprint,
      unit_disposition: located.unit.disposition,
    },
  };
}

function build(input) {
  V.assertExactKeys(
    input,
    ['planning_envelope_hash', 'source_manifest', 'requirements'],
    [],
    'VNEXT_REQUIREMENT_REGISTRY_INPUT_INVALID',
  );
  V.assertSha64(input.planning_envelope_hash, 'VNEXT_REQUIREMENT_ENVELOPE_HASH_INVALID', 'planning_envelope_hash');
  SourceManifest.validate(input.source_manifest);
  if (!Array.isArray(input.requirements)) V.fail('VNEXT_REQUIREMENT_ROWS_INVALID');

  const idx = sourceIndex(input.source_manifest);
  const normalized = input.requirements.map((row, index) => validateRequirementInput(row, index, idx));
  const requirementSourceUnits = [...idx.units.values()].filter(({ unit }) =>
    ['REQUIREMENT_SOURCE', 'AMBIGUOUS'].includes(unit.disposition));
  if (requirementSourceUnits.length === 0) V.fail('VNEXT_REQUIREMENT_REGISTRY_EMPTY');

  const ids = normalized.map((row) => row.requirement_id);
  if (new Set(ids).size !== ids.length) V.fail('VNEXT_REQUIREMENT_ID_DUPLICATE');

  const byUnit = new Map();
  for (const req of normalized) {
    const list = byUnit.get(req.unit_id) || [];
    list.push(req.requirement_id);
    byUnit.set(req.unit_id, list);
  }

  const coverage = [];
  for (const source of input.source_manifest.sources) {
    for (const unit of source.units) {
      const requirementIds = [...(byUnit.get(unit.unit_id) || [])].sort();
      if (unit.disposition === 'REQUIREMENT_SOURCE' && requirementIds.length === 0) {
        V.fail('VNEXT_REQUIREMENT_SOURCE_UNCOVERED', unit.unit_id);
      }
      if (unit.disposition === 'AMBIGUOUS' && requirementIds.length === 0) {
        V.fail('VNEXT_AMBIGUOUS_SOURCE_UNCOVERED', unit.unit_id);
      }
      if (['CONTEXT_ONLY', 'SUPERSEDED', 'OUT_OF_SCOPE'].includes(unit.disposition) && requirementIds.length !== 0) {
        V.fail('VNEXT_NON_REQUIREMENT_SOURCE_HAS_REQUIREMENTS', unit.unit_id);
      }
      coverage.push({
        source_id: source.source_id,
        unit_id: unit.unit_id,
        disposition: unit.disposition,
        requirement_ids: requirementIds,
        coverage_status:
          ['REQUIREMENT_SOURCE', 'AMBIGUOUS'].includes(unit.disposition) ? 'COVERED' : 'DISPOSED',
      });
    }
  }

  const requirementIdsByUnit = new Map();
  for (const item of coverage) requirementIdsByUnit.set(item.unit_id, item.requirement_ids);

  const relationMap = new Map(normalized.map((req) => [
    req.requirement_id,
    { related: new Set(), conflicts: new Set() },
  ]));

  for (const req of normalized) {
    for (const unitId of req.related_unit_ids) {
      const targetIds = requirementIdsByUnit.get(unitId) || [];
      if (targetIds.length === 0) V.fail('VNEXT_REQUIREMENT_RELATED_UNIT_UNMAPPED', unitId);
      for (const targetId of targetIds) {
        if (targetId === req.requirement_id) continue;
        relationMap.get(req.requirement_id).related.add(targetId);
        relationMap.get(targetId).related.add(req.requirement_id);
      }
    }
    for (const unitId of req.conflict_unit_ids) {
      const targetIds = requirementIdsByUnit.get(unitId) || [];
      if (targetIds.length === 0) V.fail('VNEXT_REQUIREMENT_CONFLICT_UNIT_UNMAPPED', unitId);
      for (const targetId of targetIds) {
        if (targetId === req.requirement_id) continue;
        relationMap.get(req.requirement_id).conflicts.add(targetId);
        relationMap.get(targetId).conflicts.add(req.requirement_id);
      }
    }
  }

  const requirements = normalized
    .map((req) => ({
      ...req,
      related_requirement_ids: [...relationMap.get(req.requirement_id).related].sort(),
      conflict_ids: [...relationMap.get(req.requirement_id).conflicts].sort(),
    }))
    .sort((a, b) => a.requirement_id.localeCompare(b.requirement_id));

  const blockingReasons = [];
  if (requirements.some((req) => req.status === 'CLARIFICATION_REQUIRED')) {
    blockingReasons.push('CLARIFICATION_REQUIRED');
  }
  if (requirements.some((req) => req.conflict_ids.length > 0)) {
    blockingReasons.push('SOURCE_CONFLICT');
  }

  return V.sealContract({
    schema_version: SCHEMA,
    planning_envelope_hash: input.planning_envelope_hash,
    source_manifest_hash: input.source_manifest.contract_hash,
    registry_status: blockingReasons.length ? 'BLOCKED' : 'READY',
    blocking_reasons: blockingReasons,
    source_unit_count: coverage.length,
    requirement_source_unit_count: coverage.filter((row) =>
      ['REQUIREMENT_SOURCE', 'AMBIGUOUS'].includes(row.disposition)).length,
    requirement_count: requirements.length,
    requirement_ids_sha256: V.canonicalHash(requirements.map((req) => req.requirement_id)),
    coverage,
    requirements,
  });
}

function validate(registry, sourceManifest) {
  V.assertExactKeys(
    registry,
    [
      'schema_version', 'planning_envelope_hash', 'source_manifest_hash', 'registry_status',
      'blocking_reasons', 'source_unit_count', 'requirement_source_unit_count',
      'requirement_count', 'requirement_ids_sha256', 'coverage', 'requirements', 'contract_hash',
    ],
    [],
    'VNEXT_REQUIREMENT_REGISTRY_KEYS_INVALID',
  );
  if (registry.schema_version !== SCHEMA) V.fail('VNEXT_REQUIREMENT_REGISTRY_SCHEMA_INVALID', registry.schema_version);
  if (!REGISTRY_STATUSES.includes(registry.registry_status)) {
    V.fail('VNEXT_REQUIREMENT_REGISTRY_STATUS_INVALID', registry.registry_status);
  }
  V.verifyContractHash(registry, 'VNEXT_REQUIREMENT_REGISTRY_HASH_MISMATCH');
  SourceManifest.validate(sourceManifest);
  if (registry.source_manifest_hash !== sourceManifest.contract_hash) {
    V.fail('VNEXT_REQUIREMENT_SOURCE_MANIFEST_HASH_MISMATCH');
  }

  const rebuilt = build({
    planning_envelope_hash: registry.planning_envelope_hash,
    source_manifest: sourceManifest,
    requirements: registry.requirements.map((req) => ({
      source_id: req.source_id,
      unit_id: req.unit_id,
      kind: req.kind,
      statement: req.statement,
      priority: req.priority,
      status: req.status,
      rationale: req.rationale,
      related_unit_ids: req.related_unit_ids,
      conflict_unit_ids: req.conflict_unit_ids,
    })),
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(registry)) {
    V.fail('VNEXT_REQUIREMENT_REGISTRY_REBUILD_MISMATCH');
  }
  return true;
}

function assertReady(registry) {
  if (!registry || registry.registry_status !== 'READY') {
    V.fail('VNEXT_REQUIREMENTS_NOT_READY', (registry && registry.blocking_reasons || []).join(','));
  }
  return true;
}

module.exports = {
  SCHEMA,
  REQUIREMENT_KINDS,
  REQUIREMENT_STATUSES,
  PRIORITIES,
  REGISTRY_STATUSES,
  build,
  validate,
  assertReady,
};
