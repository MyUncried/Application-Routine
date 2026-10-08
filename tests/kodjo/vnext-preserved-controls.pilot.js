'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../../scripts/kodjo/lib/vnext-preserved-controls');
const V = require('../../scripts/kodjo/lib/vnext-contract');

const row = { criterion_id: 'UI-fixture', availability: 'AVAILABLE', primitive: 'NativeWheel',
  selected_primitive: 'NativeWheel', functional_requirement_id: null,
  evidence_refs: ['proof:PROOF-branch', 'source:DOC-native#UNIT-native'],
  justification: 'Conserver la primitive native disponible dans la branche interactive.', exception_reason: null };
const criterion = { criterion_id: 'UI-fixture', requirement_id: 'REQ-functional', risk_types: ['FUNCTIONAL'],
  proof_ids: ['PROOF-branch'], proof_required: ['FUNCTIONAL_TEST'],
  assertions: [{ property_type: 'INTERACTION', expected: 'La branche utilise NativeWheel', proof_ids: ['PROOF-branch'] }] };
const context = { uiAtomicityContract: { criteria: [criterion] }, requirementRegistry: { requirements: [{ requirement_id: 'REQ-functional' }] },
  applicationHead: 'a'.repeat(40),
  sourceManifest: { contract_hash: 'b'.repeat(64), sources: [{ source_id: 'DOC-native', authority: 'FUNCTIONAL', units: [{ unit_id: 'UNIT-native' }] }] },
  resolveNativeEvidence: (subject, { sourceManifest, applicationHead }) => V.sealContract({
    schema_version: 'kodjo.vnext.native-assessment-evidence.v1', status: 'VERIFIED',
    native_assessment_hash: V.canonicalHash(subject), source_manifest_hash: sourceManifest.contract_hash,
    application_head: applicationHead, evidence_ref: 'fixture:verified-native-source-observation' }) };
const build = (rows, overrides = {}) => P.buildNativeDecisions(rows, { ...context, ...overrides });

test('native preservation: every UI criterion needs an explicit sourced native assessment and branch assertion', () => {
  assert.equal(build([row])[0].selected_primitive, 'NativeWheel');
  assert.equal(build([row])[0].assessment_evidence_ref, 'fixture:verified-native-source-observation');
  assert.throws(() => build([row], { resolveNativeEvidence: null }), /WAIT_FOR_PROOF/);
  assert.throws(() => build([row], { resolveNativeEvidence: () => ({ status: 'VERIFIED' }) }), /PROOF_NOT_VERIFIED/);
  assert.throws(() => build([row], { resolveNativeEvidence: (subject, meta) => V.sealContract({
    schema_version: 'kodjo.vnext.native-assessment-evidence.v1', status: 'VERIFIED', native_assessment_hash: V.canonicalHash(subject),
    source_manifest_hash: 'c'.repeat(64), application_head: meta.applicationHead, evidence_ref: 'fixture:stale-doc-proof' }) }), /PROOF_BINDING_MISMATCH/);
  assert.throws(() => build([]), /ASSESSMENT_INCOMPLETE/);
  assert.throws(() => build([{ ...row, evidence_refs: ['source:invented#unknown'] }]), /SOURCE_EVIDENCE_REQUIRED/);
  assert.throws(() => build([{ ...row, primitive: 'OtherNative', selected_primitive: 'OtherNative' }]), /BRANCH_ASSERTION_REQUIRED/);
  assert.throws(() => build([{ ...row, availability: 'NOT_APPLICABLE', primitive: null, selected_primitive: null }]), /INTERACTION_ASSESSMENT_REQUIRED/);
});

test('native preservation: style or Jest difficulty cannot authorize a substitute and functional proof must be scoped', () => {
  const changed = { ...row, selected_primitive: 'CustomWheel', functional_requirement_id: 'REQ-functional',
    exception_reason: 'FUNCTIONAL_REQUIREMENT_UNSATISFIED' };
  const customContext = { ...context, uiAtomicityContract: { criteria: [{ ...criterion, assertions: [{ ...criterion.assertions[0], expected: 'La branche utilise CustomWheel' }] }] } };
  assert.deepEqual(P.exceptionIds(build([changed], customContext)), ['UI-fixture']);
  assert.throws(() => build([{ ...changed, exception_reason: 'JEST_MOCK_DIFFICULTY' }], customContext), /EXCEPTION_REASON_INVALID/);
  assert.throws(() => build([{ ...changed, functional_requirement_id: null }], customContext), /NATIVE_PRIMITIVE_EXCEPTION_REQUIRED/);
  assert.throws(() => build([{ ...changed, functional_requirement_id: 'REQ-invented' }], customContext), /FUNCTIONAL_REQUIREMENT_UNKNOWN/);
  assert.throws(() => build([{ ...changed, evidence_refs: ['source:DOC-native#UNIT-native'] }], customContext), /BRANCH_ASSERTION_REQUIRED|FUNCTIONAL_EVIDENCE_REQUIRED/);
  assert.throws(() => P.validateExceptionApprovals([changed], undefined, 'APPROVED'), /NATIVE_PRIMITIVE_EXCEPTION_REQUIRED/);
  assert.throws(() => P.validateExceptionApprovals([changed], ['wrong-criterion'], 'APPROVED'), /NATIVE_PRIMITIVE_EXCEPTION_REQUIRED/);
  assert.deepEqual(P.validateExceptionApprovals([changed], ['UI-fixture'], 'APPROVED'), ['UI-fixture']);
});
