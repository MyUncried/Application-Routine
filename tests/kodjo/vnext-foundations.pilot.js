'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const V = require(path.join(root, 'scripts', 'kodjo', 'lib', 'vnext-contract'));
const SourceManifest = require(path.join(root, 'scripts', 'kodjo', 'lib', 'source-manifest'));
const PlanningEnvelope = require(path.join(root, 'scripts', 'kodjo', 'lib', 'planning-envelope'));
const DecisionRecord = require(path.join(root, 'scripts', 'kodjo', 'lib', 'decision-record'));
const ErrorPolicy = require(path.join(root, 'scripts', 'kodjo', 'lib', 'vnext-error-policy'));

const H40 = 'a'.repeat(40);
const H40B = 'b'.repeat(40);
const H64 = 'c'.repeat(64);
const H64B = 'd'.repeat(64);

function sourceManifest() {
  return SourceManifest.build({
    slice_id: 'V2-VNEXT-01',
    product_head: H40,
    sources: [
      {
        source_kind: 'MARKDOWN',
        authority: 'FUNCTIONAL',
        locator: 'docs/Spécifications fonctionnelles/06 – Écrans.md',
        revision: H40,
        fingerprint: H64,
        units: [
          {
            locator: '§4.2 — Séance',
            fingerprint: H64B,
            disposition: 'REQUIREMENT_SOURCE',
          },
        ],
      },
    ],
  });
}

test('VNext-01 canonical JSON is deterministic and fail-closed', () => {
  const left = { z: 1, a: { y: 2, x: ['é', true] } };
  const right = { a: { x: ['é', true], y: 2 }, z: 1 };
  assert.equal(V.canonicalStringify(left), V.canonicalStringify(right));
  assert.equal(V.canonicalHash(left), V.canonicalHash(right));
  assert.throws(() => V.canonicalStringify({ x: undefined }), /VNEXT_CANONICAL_UNDEFINED/);
  assert.throws(() => V.canonicalStringify({ x: Number.NaN }), /VNEXT_CANONICAL_NUMBER_INVALID/);
  assert.throws(() => V.assertExactKeys({ a: 1, b: 2 }, ['a'], [], 'KEYS'), /KEYS/);
});

test('VNext-01 stable IDs are machine-derived and source-sensitive', () => {
  const a = V.stableId('SRC', ['A', 'é']);
  const b = V.stableId('SRC', ['A', 'é']);
  const c = V.stableId('SRC', ['A', 'e']);
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^SRC-[0-9a-f]{24}$/);
});

test('VNext-01 Unicode is preserved exactly and degraded forms are rejected', () => {
  const exact = 'docs/Spécifications fonctionnelles/06 – Écrans.md';
  assert.equal(V.assertUnicodeExactText(exact), exact);
  assert.throws(() => V.assertUnicodeExactText('docs/#U00E9cran.md'), /VNEXT_UNICODE_TEXT_INVALID/);
  assert.throws(() => V.assertUnicodeExactText('docs/\\u00E9cran.md'), /VNEXT_UNICODE_TEXT_INVALID/);
  assert.throws(() => V.assertUnicodeExactText('docs/�cran.md'), /VNEXT_UNICODE_TEXT_INVALID/);
  assert.notEqual(V.stableId('SRC', ['é']), V.stableId('SRC', ['e\u0301']));
});

test('VNext-01 SourceManifest seals sources and units with deterministic IDs', () => {
  const manifest = sourceManifest();
  assert.equal(manifest.schema_version, SourceManifest.SCHEMA);
  assert.match(manifest.contract_hash, /^[0-9a-f]{64}$/);
  assert.match(manifest.sources[0].source_id, /^SRC-[0-9a-f]{24}$/);
  assert.match(manifest.sources[0].units[0].unit_id, /^UNIT-[0-9a-f]{24}$/);
  assert.equal(SourceManifest.validate(manifest), true);

  const changed = structuredClone(manifest);
  changed.sources[0].locator = 'docs/autre.md';
  assert.throws(() => SourceManifest.validate(changed), /VNEXT_SOURCE_MANIFEST_HASH_MISMATCH/);
});

test('VNext-01 SourceManifest refuses duplicate physical source identity', () => {
  const base = {
    source_kind: 'MARKDOWN', authority: 'FUNCTIONAL', locator: 'docs/a.md', revision: H40, fingerprint: H64, units: [],
  };
  assert.throws(() => SourceManifest.build({ slice_id: 'V2-VNEXT-01', product_head: H40, sources: [base, { ...base }] }), /VNEXT_SOURCE_DUPLICATE|VNEXT_SOURCE_LOCATOR_DUPLICATE/);
});

test('VNext-01 INITIAL PlanningEnvelope forbids revision causal state', () => {
  const manifest = sourceManifest();
  const envelope = PlanningEnvelope.build({
    slice_id: 'V2-VNEXT-01',
    planning_mode: 'INITIAL',
    baseline_head: H40,
    product_head: H40,
    application_head: H40B,
    issue_id: 'github_issue:MyUncried/Application-Routine#999',
    source_manifest: manifest,
    base_plan_hash: null,
    base_review_hash: null,
    causal_findings: [],
    created_from: { kind: 'INITIAL_REQUEST', refs: ['issue_comment:1'] },
  });
  assert.equal(PlanningEnvelope.validate(envelope), true);
  assert.throws(() => PlanningEnvelope.build({
    slice_id: 'V2-VNEXT-01', planning_mode: 'INITIAL', baseline_head: H40, product_head: H40,
    application_head: H40B, issue_id: 'github_issue:x#1', source_manifest: manifest,
    base_plan_hash: H64, base_review_hash: null, causal_findings: [],
    created_from: { kind: 'INITIAL_REQUEST', refs: ['issue_comment:1'] },
  }), /VNEXT_INITIAL_CAUSAL_BASE_FORBIDDEN/);
});

test('VNext-01 REVISION PlanningEnvelope requires exact causal base and findings', () => {
  const manifest = sourceManifest();
  const revision = PlanningEnvelope.build({
    slice_id: 'V2-VNEXT-01',
    planning_mode: 'REVISION',
    baseline_head: H40,
    product_head: H40,
    application_head: H40B,
    issue_id: 'github_issue:MyUncried/Application-Routine#999',
    source_manifest: manifest,
    base_plan_hash: H64,
    base_review_hash: H64B,
    causal_findings: ['FND-001'],
    created_from: { kind: 'PLAN_REVIEW_REVISE', refs: ['issue_comment:2', 'issue_comment:3'] },
  });
  assert.equal(PlanningEnvelope.validate(revision), true);
  assert.throws(() => PlanningEnvelope.build({
    slice_id: 'V2-VNEXT-01', planning_mode: 'REVISION', baseline_head: H40, product_head: H40,
    application_head: H40B, issue_id: 'github_issue:x#1', source_manifest: manifest,
    base_plan_hash: null, base_review_hash: H64B, causal_findings: ['FND-001'],
    created_from: { kind: 'PLAN_REVIEW_REVISE', refs: ['issue_comment:2'] },
  }), /VNEXT_REVISION_BASE_PLAN_INVALID/);
});

test('VNext-01 DecisionRecord: a question alone is never a durable decision', () => {
  const open = DecisionRecord.createOpen({
    slice_id: 'V2-VNEXT-01',
    question: 'Quel comportement doit être conservé ?',
    options: [{ label: 'Option A' }, { label: 'Option B' }],
    source_ids: ['SRC-aaaaaaaaaaaaaaaaaaaaaaaa'],
    affected_requirement_ids: [],
    created_at: '2026-09-29T16:00:00Z',
    causal_evidence: ['issue_comment:10'],
  });
  assert.equal(open.status, 'OPEN');
  assert.equal(open.response, null);
  assert.equal(DecisionRecord.validate(open), true);
  assert.throws(() => DecisionRecord.toSourceInput(open), /VNEXT_DECISION_NOT_RESOLVED/);

  const resolved = DecisionRecord.resolve(open, {
    selected_option_id: open.options[0].option_id,
    response_text: 'Option A',
    responded_by: 'MyUncried',
    resolved_at: '2026-09-29T16:05:00Z',
    resolution_evidence: ['issue_comment:11'],
  });
  assert.equal(resolved.status, 'RESOLVED');
  assert.equal(DecisionRecord.validate(resolved), true);
  const source = DecisionRecord.toSourceInput(resolved);
  assert.equal(source.source_kind, 'DECISION_RECORD');
  assert.equal(source.authority, 'DECISION');
  assert.equal(source.units[0].disposition, 'REQUIREMENT_SOURCE');
});

test('VNext-01 DecisionRecord refuses an answer outside the offered options', () => {
  const open = DecisionRecord.createOpen({
    slice_id: 'V2-VNEXT-01', question: 'Choix ?', options: [{ label: 'A' }, { label: 'B' }],
    source_ids: ['SRC-aaaaaaaaaaaaaaaaaaaaaaaa'], affected_requirement_ids: [],
    created_at: '2026-09-29T16:00:00Z', causal_evidence: ['issue_comment:10'],
  });
  assert.throws(() => DecisionRecord.resolve(open, {
    selected_option_id: 'OPT-ffffffffffffffffffffffff', response_text: 'C', responded_by: 'MyUncried',
    resolved_at: '2026-09-29T16:05:00Z', resolution_evidence: ['issue_comment:11'],
  }), /VNEXT_DECISION_RESPONSE_OPTION_INVALID/);
});

test('VNext-01 common error policy is deterministic and never retries an unknown error', () => {
  assert.equal(ErrorPolicy.classify({ diagnostic: 'PLAN_SCAN_PATH_INVALID' }).category, 'PREVENTABLE_BY_DETERMINISM');
  assert.equal(ErrorPolicy.classify({ diagnostic: 'CLARIFICATION_REQUIRED' }).category, 'HUMAN_DECISION_REQUIRED');
  assert.equal(ErrorPolicy.classify({ diagnostic: 'USAGE_LIMIT' }).category, 'RESIDUAL_AUTOCORRECTABLE');
  const unknown = ErrorPolicy.classify({ diagnostic: 'SOMETHING_NEW' });
  assert.equal(unknown.category, 'HUMAN_DECISION_REQUIRED');
  assert.equal(unknown.auto_retry, false);
});

test('VNext-01 specification fixes the foundational anti-regression rules', () => {
  const spec = fs.readFileSync(path.join(root, '.github', 'orchestration', 'KODJO_PROTOCOL_VNEXT_SPEC.md'), 'utf8');
  assert.match(spec, /VNX-07A — Décision durable et causale/);
  assert.match(spec, /ONE_LEVEL_DIRECT_IMPORTS/);
  assert.match(spec, /requirements → impact candidates → classifications → scope final → UI criteria → atomic assertions → validators/);
  assert.match(spec, /lien direct lorsque le transport le permet/);
  assert.match(spec, /action attendue explicite/);
});
