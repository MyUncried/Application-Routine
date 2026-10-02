'use strict';

const V = require('./vnext-contract');

const SCHEMA = 'kodjo.vnext.source-manifest.v1';
const SOURCE_KINDS = Object.freeze([
  'MARKDOWN', 'FIGMA', 'DECISION_REGISTER', 'DECISION_RECORD',
  'GITHUB_COMMENT', 'STRUCTURED_CONTRACT', 'CODE', 'OTHER',
]);
const AUTHORITIES = Object.freeze([
  'FUNCTIONAL', 'TECHNICAL', 'VISUAL', 'DECISION', 'OPERATIONAL', 'CODE',
]);
const UNIT_DISPOSITIONS = Object.freeze([
  'REQUIREMENT_SOURCE', 'CONTEXT_ONLY', 'SUPERSEDED', 'OUT_OF_SCOPE', 'AMBIGUOUS',
]);

function validateUnitInput(unit, sourceId) {
  V.assertExactKeys(unit, ['locator', 'fingerprint', 'disposition'], [], 'VNEXT_SOURCE_UNIT_KEYS_INVALID');
  V.assertUnicodeExactText(unit.locator, 'VNEXT_SOURCE_UNIT_LOCATOR_INVALID', 'unit.locator');
  V.assertSha64(unit.fingerprint, 'VNEXT_SOURCE_UNIT_FINGERPRINT_INVALID', 'unit.fingerprint');
  if (!UNIT_DISPOSITIONS.includes(unit.disposition)) V.fail('VNEXT_SOURCE_UNIT_DISPOSITION_INVALID', unit.disposition);
  return Object.freeze({
    unit_id: V.stableId('UNIT', [sourceId, unit.locator, unit.fingerprint]),
    locator: unit.locator,
    fingerprint: unit.fingerprint,
    disposition: unit.disposition,
  });
}

function validateSourceInput(source) {
  V.assertExactKeys(
    source,
    ['source_kind', 'authority', 'locator', 'revision', 'fingerprint', 'units'],
    [],
    'VNEXT_SOURCE_KEYS_INVALID',
  );
  if (!SOURCE_KINDS.includes(source.source_kind)) V.fail('VNEXT_SOURCE_KIND_INVALID', source.source_kind);
  if (!AUTHORITIES.includes(source.authority)) V.fail('VNEXT_SOURCE_AUTHORITY_INVALID', source.authority);
  V.assertUnicodeExactText(source.locator, 'VNEXT_SOURCE_LOCATOR_INVALID', 'source.locator');
  V.assertUnicodeExactText(source.revision, 'VNEXT_SOURCE_REVISION_INVALID', 'source.revision');
  V.assertSha64(source.fingerprint, 'VNEXT_SOURCE_FINGERPRINT_INVALID', 'source.fingerprint');
  if (!Array.isArray(source.units)) V.fail('VNEXT_SOURCE_UNITS_INVALID', 'units must be an array');

  const sourceId = V.stableId('SRC', [
    source.source_kind,
    source.authority,
    source.locator,
    source.revision,
    source.fingerprint,
  ]);
  const units = source.units.map((unit) => validateUnitInput(unit, sourceId));
  const unitIds = units.map((unit) => unit.unit_id);
  if (new Set(unitIds).size !== unitIds.length) V.fail('VNEXT_SOURCE_UNIT_DUPLICATE', sourceId);

  return Object.freeze({
    source_id: sourceId,
    source_kind: source.source_kind,
    authority: source.authority,
    locator: source.locator,
    revision: source.revision,
    fingerprint: source.fingerprint,
    units,
  });
}

function build(input) {
  V.assertExactKeys(input, ['slice_id', 'product_head', 'sources'], [], 'VNEXT_SOURCE_MANIFEST_INPUT_INVALID');
  V.assertSliceId(input.slice_id);
  V.assertSha40(input.product_head, 'VNEXT_SOURCE_PRODUCT_HEAD_INVALID', 'product_head');
  if (!Array.isArray(input.sources) || input.sources.length === 0) V.fail('VNEXT_SOURCE_LIST_EMPTY');
  const sources = input.sources.map(validateSourceInput);
  const ids = sources.map((source) => source.source_id);
  if (new Set(ids).size !== ids.length) V.fail('VNEXT_SOURCE_DUPLICATE');
  const locators = sources.map((source) => `${source.source_kind}\u0000${source.locator}\u0000${source.revision}`);
  if (new Set(locators).size !== locators.length) V.fail('VNEXT_SOURCE_LOCATOR_DUPLICATE');
  return V.sealContract({ schema_version: SCHEMA, slice_id: input.slice_id, product_head: input.product_head, sources });
}

function validate(manifest) {
  V.assertExactKeys(
    manifest,
    ['schema_version', 'slice_id', 'product_head', 'sources', 'contract_hash'],
    [],
    'VNEXT_SOURCE_MANIFEST_KEYS_INVALID',
  );
  if (manifest.schema_version !== SCHEMA) V.fail('VNEXT_SOURCE_MANIFEST_SCHEMA_INVALID', manifest.schema_version);
  V.verifyContractHash(manifest, 'VNEXT_SOURCE_MANIFEST_HASH_MISMATCH');
  const rebuilt = build({
    slice_id: manifest.slice_id,
    product_head: manifest.product_head,
    sources: manifest.sources.map((source) => ({
      source_kind: source.source_kind,
      authority: source.authority,
      locator: source.locator,
      revision: source.revision,
      fingerprint: source.fingerprint,
      units: source.units.map((unit) => ({
        locator: unit.locator,
        fingerprint: unit.fingerprint,
        disposition: unit.disposition,
      })),
    })),
  });
  if (V.canonicalStringify(rebuilt) !== V.canonicalStringify(manifest)) V.fail('VNEXT_SOURCE_MANIFEST_REBUILD_MISMATCH');
  return true;
}

module.exports = { SCHEMA, SOURCE_KINDS, AUTHORITIES, UNIT_DISPOSITIONS, build, validate };
