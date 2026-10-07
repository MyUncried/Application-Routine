'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const V = require(path.join(root, 'scripts', 'kodjo', 'lib', 'vnext-contract'));
const SourceManifest = require(path.join(root, 'scripts', 'kodjo', 'lib', 'source-manifest'));
const DecisionRecord = require(path.join(root, 'scripts', 'kodjo', 'lib', 'decision-record'));
const Registry = require(path.join(root, 'scripts', 'kodjo', 'lib', 'requirement-registry'));

const H40 = 'a'.repeat(40);
const H64A = 'a'.repeat(64);
const H64B = 'b'.repeat(64);
const H64C = 'c'.repeat(64);
const H64D = 'd'.repeat(64);

function manifest(units, options = {}) {
  return SourceManifest.build({
    slice_id: 'V2-VNEXT-02',
    product_head: H40,
    sources: [{
      source_kind: options.source_kind || 'MARKDOWN',
      authority: options.authority || 'FUNCTIONAL',
      locator: options.locator || 'docs/Specifications fonctionnelles/06 – Écrans.md',
      revision: options.revision || H40,
      fingerprint: options.fingerprint || H64A,
      units,
    }],
  });
}

function rowFor(manifestValue, unitIndex, overrides = {}) {
  const source = manifestValue.sources[0];
  const unit = source.units[unitIndex];
  return {
    source_id: source.source_id,
    unit_id: unit.unit_id,
    kind: overrides.kind || 'FUNCTIONAL',
    statement: overrides.statement || `Exigence ${unitIndex + 1}`,
    priority: overrides.priority || 'UNSPECIFIED',
    status: overrides.status || (unit.disposition === 'AMBIGUOUS' ? 'CLARIFICATION_REQUIRED' : 'ACTIVE'),
    rationale: overrides.rationale || 'Reprise exacte de la clause source.',
    related_unit_ids: overrides.related_unit_ids || [],
    conflict_unit_ids: overrides.conflict_unit_ids || [],
  };
}

test('VNext-02 construit un registre source-first complet incluant UI et non-UI', () => {
  const source = manifest([
    { locator: '§1 Fonctionnel', fingerprint: H64B, disposition: 'REQUIREMENT_SOURCE' },
    { locator: '§2 UI', fingerprint: H64C, disposition: 'REQUIREMENT_SOURCE' },
    { locator: '§3 Contexte', fingerprint: H64D, disposition: 'CONTEXT_ONLY' },
  ]);
  const registry = Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [
      rowFor(source, 0, { kind: 'FUNCTIONAL', statement: 'Le bouton déclenche la création.' }),
      rowFor(source, 1, { kind: 'UI', statement: 'Le bouton est visible dans cet état.' }),
    ],
  });

  assert.equal(registry.registry_status, 'READY');
  assert.equal(registry.requirement_count, 2);
  assert.equal(registry.source_unit_count, 3);
  assert.equal(registry.requirement_source_unit_count, 2);
  assert.deepEqual(registry.coverage.map((x) => x.coverage_status), ['COVERED', 'COVERED', 'DISPOSED']);
  assert.deepEqual(registry.requirements.map((x) => x.kind).sort(), ['FUNCTIONAL', 'UI']);
  assert.equal(Registry.validate(registry, source), true);
  assert.equal(Registry.assertReady(registry), true);
});

test('VNext-02 refuse toute unité REQUIREMENT_SOURCE oubliée', () => {
  const source = manifest([
    { locator: '§1', fingerprint: H64B, disposition: 'REQUIREMENT_SOURCE' },
    { locator: '§2', fingerprint: H64C, disposition: 'REQUIREMENT_SOURCE' },
  ]);
  assert.throws(() => Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [rowFor(source, 0)],
  }), /VNEXT_REQUIREMENT_SOURCE_UNCOVERED/);
});

test('VNext-02 refuse une exigence sans source connue', () => {
  const source = manifest([{ locator: '§1', fingerprint: H64B, disposition: 'REQUIREMENT_SOURCE' }]);
  const row = rowFor(source, 0);
  row.source_id = 'SRC-ffffffffffffffffffffffff';
  assert.throws(() => Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [row],
  }), /VNEXT_REQUIREMENT_SOURCE_UNKNOWN/);
});

test('VNext-02 interdit de fabriquer une exigence depuis CONTEXT_ONLY', () => {
  const source = manifest([
    { locator: '§1', fingerprint: H64B, disposition: 'REQUIREMENT_SOURCE' },
    { locator: '§2', fingerprint: H64C, disposition: 'CONTEXT_ONLY' },
  ]);
  assert.throws(() => Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [rowFor(source, 0), rowFor(source, 1)],
  }), /VNEXT_REQUIREMENT_SOURCE_DISPOSITION_FORBIDDEN/);
});

test('VNext-02 exige CLARIFICATION_REQUIRED pour toute source AMBIGUOUS', () => {
  const source = manifest([{ locator: '§ ambigu', fingerprint: H64B, disposition: 'AMBIGUOUS' }]);
  assert.throws(() => Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [rowFor(source, 0, { status: 'ACTIVE' })],
  }), /VNEXT_AMBIGUOUS_SOURCE_STATUS_MISMATCH/);

  const registry = Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [rowFor(source, 0, { status: 'CLARIFICATION_REQUIRED' })],
  });
  assert.equal(registry.registry_status, 'BLOCKED');
  assert.deepEqual(registry.blocking_reasons, ['CLARIFICATION_REQUIRED']);
  assert.throws(() => Registry.assertReady(registry), /CLARIFICATION_REQUIRED/);
});

test('VNext-02 rend les conflits symétriques et bloquants', () => {
  const source = manifest([
    { locator: '§A', fingerprint: H64B, disposition: 'REQUIREMENT_SOURCE' },
    { locator: '§B', fingerprint: H64C, disposition: 'REQUIREMENT_SOURCE' },
  ]);
  const registry = Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [
      rowFor(source, 0, { statement: 'A', conflict_unit_ids: [source.sources[0].units[1].unit_id] }),
      rowFor(source, 1, { statement: 'B' }),
    ],
  });
  assert.equal(registry.registry_status, 'BLOCKED');
  assert.deepEqual(registry.blocking_reasons, ['SOURCE_CONFLICT']);
  assert.equal(registry.requirements[0].conflict_ids.length, 1);
  assert.equal(registry.requirements[1].conflict_ids.length, 1);
  assert.equal(registry.requirements[0].conflict_ids[0], registry.requirements[1].requirement_id);
  assert.equal(registry.requirements[1].conflict_ids[0], registry.requirements[0].requirement_id);
});

test('VNext-02 dérive mécaniquement les relations entre exigences', () => {
  const source = manifest([
    { locator: '§A', fingerprint: H64B, disposition: 'REQUIREMENT_SOURCE' },
    { locator: '§B', fingerprint: H64C, disposition: 'REQUIREMENT_SOURCE' },
  ]);
  const registry = Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [
      rowFor(source, 0, { statement: 'A', related_unit_ids: [source.sources[0].units[1].unit_id] }),
      rowFor(source, 1, { statement: 'B' }),
    ],
  });
  assert.equal(registry.registry_status, 'READY');
  assert.equal(registry.requirements[0].related_requirement_ids.length, 1);
  assert.equal(registry.requirements[1].related_requirement_ids.length, 1);
});

test('VNext-02 refuse les doublons de requirement_id calculé', () => {
  const source = manifest([{ locator: '§1', fingerprint: H64B, disposition: 'REQUIREMENT_SOURCE' }]);
  const row = rowFor(source, 0);
  assert.throws(() => Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [row, { ...row }],
  }), /VNEXT_REQUIREMENT_ID_DUPLICATE/);
});

test('VNext-02 lie le registre au SourceManifest exact', () => {
  const source = manifest([{ locator: '§1', fingerprint: H64B, disposition: 'REQUIREMENT_SOURCE' }]);
  const registry = Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [rowFor(source, 0)],
  });
  const other = manifest(
    [{ locator: '§1', fingerprint: H64C, disposition: 'REQUIREMENT_SOURCE' }],
    { fingerprint: H64D },
  );
  assert.throws(() => Registry.validate(registry, other), /VNEXT_REQUIREMENT_SOURCE_MANIFEST_HASH_MISMATCH/);
});

test('VNext-02 consomme une décision résolue comme source normative', () => {
  const open = DecisionRecord.createOpen({
    slice_id: 'V2-VNEXT-02',
    question: 'Quel comportement ?',
    options: [{ label: 'A' }, { label: 'B' }],
    source_ids: ['SRC-aaaaaaaaaaaaaaaaaaaaaaaa'],
    affected_requirement_ids: [],
    created_at: '2026-09-29T17:00:00Z',
    causal_evidence: ['issue_comment:20'],
  });
  const resolved = DecisionRecord.resolve(open, {
    selected_option_id: open.options[1].option_id,
    response_text: 'B',
    responded_by: 'MyUncried',
    resolved_at: '2026-09-29T17:02:00Z',
    resolution_evidence: ['issue_comment:21'],
  });
  const source = SourceManifest.build({
    slice_id: 'V2-VNEXT-02',
    product_head: H40,
    sources: [DecisionRecord.toSourceInput(resolved)],
  });
  const registry = Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [rowFor(source, 0, {
      kind: 'FUNCTIONAL',
      statement: 'Appliquer le comportement B.',
      rationale: 'Décision utilisateur résolue.',
    })],
  });
  assert.equal(registry.registry_status, 'READY');
  assert.equal(registry.requirements[0].source.source_kind, 'DECISION_RECORD');
  assert.equal(registry.requirements[0].source.authority, 'DECISION');
});

test('VNext-02 refuse un registre sans aucune unité normative', () => {
  const source = manifest([{ locator: 'contexte', fingerprint: H64B, disposition: 'CONTEXT_ONLY' }]);
  assert.throws(() => Registry.build({
    planning_envelope_hash: H64A,
    source_manifest: source,
    requirements: [],
  }), /VNEXT_REQUIREMENT_REGISTRY_EMPTY/);
});

test('VNext-02 interdit structurellement la dérivation circulaire depuis les critères UI', () => {
  const code = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'lib', 'requirement-registry.js'), 'utf8');
  assert.match(code, /require\('\.\/source-manifest'\)/);
  assert.doesNotMatch(code, /uiMatrix|KODJO_UI_CRITERIA_MATRIX_JSON|criterion_id/);
  assert.match(code, /VNEXT_REQUIREMENT_SOURCE_UNCOVERED/);
  assert.match(code, /VNEXT_AMBIGUOUS_SOURCE_UNCOVERED/);
});
