'use strict';

const V = require('./vnext-contract');

const SCHEMA = 'kodjo.vnext.decision-record.v1';
const STATUSES = Object.freeze(['OPEN', 'RESOLVED']);

function normalizeOption(decisionId, option, index) {
  V.assertExactKeys(option, ['label'], [], 'VNEXT_DECISION_OPTION_KEYS_INVALID');
  V.assertUnicodeExactText(option.label, 'VNEXT_DECISION_OPTION_LABEL_INVALID', `options[${index}].label`);
  return Object.freeze({
    option_id: V.stableId('OPT', [decisionId, index, option.label]),
    label: option.label,
  });
}

function createOpen(input) {
  V.assertExactKeys(input, [
    'slice_id', 'question', 'options', 'source_ids', 'affected_requirement_ids', 'created_at', 'causal_evidence',
  ], [], 'VNEXT_DECISION_INPUT_INVALID');
  V.assertSliceId(input.slice_id);
  V.assertUnicodeExactText(input.question, 'VNEXT_DECISION_QUESTION_INVALID', 'question');
  const sourceIds = V.uniqueStrings(input.source_ids, 'VNEXT_DECISION_SOURCES_INVALID', 'source_ids');
  const affected = V.uniqueStrings(input.affected_requirement_ids, 'VNEXT_DECISION_REQUIREMENTS_INVALID', 'affected_requirement_ids', { allowEmpty: true });
  V.assertIsoDate(input.created_at, 'VNEXT_DECISION_CREATED_AT_INVALID', 'created_at');
  const evidence = V.uniqueStrings(input.causal_evidence, 'VNEXT_DECISION_EVIDENCE_INVALID', 'causal_evidence');
  if (!Array.isArray(input.options) || input.options.length < 2) V.fail('VNEXT_DECISION_OPTIONS_INVALID', 'at least two options required');

  const decisionId = V.stableId('DEC', [input.slice_id, input.question, sourceIds]);
  const options = input.options.map((option, index) => normalizeOption(decisionId, option, index));
  if (new Set(options.map((option) => option.label)).size !== options.length) V.fail('VNEXT_DECISION_OPTION_DUPLICATE');

  return V.sealContract({
    schema_version: SCHEMA,
    decision_id: decisionId,
    slice_id: input.slice_id,
    question: input.question,
    options,
    source_ids: sourceIds,
    affected_requirement_ids: affected,
    status: 'OPEN',
    response: null,
    created_at: input.created_at,
    causal_evidence: evidence,
    resolved_at: null,
    resolution_evidence: [],
  });
}

function validate(record) {
  V.assertExactKeys(record, [
    'schema_version', 'decision_id', 'slice_id', 'question', 'options', 'source_ids', 'affected_requirement_ids',
    'status', 'response', 'created_at', 'causal_evidence', 'resolved_at', 'resolution_evidence', 'contract_hash',
  ], [], 'VNEXT_DECISION_KEYS_INVALID');
  if (record.schema_version !== SCHEMA) V.fail('VNEXT_DECISION_SCHEMA_INVALID', record.schema_version);
  if (!STATUSES.includes(record.status)) V.fail('VNEXT_DECISION_STATUS_INVALID', record.status);
  V.verifyContractHash(record, 'VNEXT_DECISION_HASH_MISMATCH');
  V.assertSliceId(record.slice_id);
  V.assertUnicodeExactText(record.question, 'VNEXT_DECISION_QUESTION_INVALID', 'question');
  const expectedId = V.stableId('DEC', [record.slice_id, record.question, record.source_ids]);
  if (record.decision_id !== expectedId) V.fail('VNEXT_DECISION_ID_MISMATCH');
  if (!Array.isArray(record.options) || record.options.length < 2) V.fail('VNEXT_DECISION_OPTIONS_INVALID');
  const optionIds = new Set();
  record.options.forEach((option, index) => {
    V.assertExactKeys(option, ['option_id', 'label'], [], 'VNEXT_DECISION_OPTION_KEYS_INVALID');
    const expected = V.stableId('OPT', [record.decision_id, index, option.label]);
    if (option.option_id !== expected) V.fail('VNEXT_DECISION_OPTION_ID_MISMATCH', option.option_id);
    if (optionIds.has(option.option_id)) V.fail('VNEXT_DECISION_OPTION_DUPLICATE', option.option_id);
    optionIds.add(option.option_id);
  });
  V.uniqueStrings(record.source_ids, 'VNEXT_DECISION_SOURCES_INVALID', 'source_ids');
  V.uniqueStrings(record.affected_requirement_ids, 'VNEXT_DECISION_REQUIREMENTS_INVALID', 'affected_requirement_ids', { allowEmpty: true });
  V.uniqueStrings(record.causal_evidence, 'VNEXT_DECISION_EVIDENCE_INVALID', 'causal_evidence');
  V.uniqueStrings(record.resolution_evidence, 'VNEXT_DECISION_RESOLUTION_EVIDENCE_INVALID', 'resolution_evidence', { allowEmpty: record.status === 'OPEN' });
  V.assertIsoDate(record.created_at, 'VNEXT_DECISION_CREATED_AT_INVALID', 'created_at');

  if (record.status === 'OPEN') {
    if (record.response !== null || record.resolved_at !== null || record.resolution_evidence.length !== 0) {
      V.fail('VNEXT_DECISION_OPEN_HAS_RESOLUTION');
    }
  } else {
    V.assertExactKeys(record.response, ['selected_option_id', 'response_text', 'responded_by'], [], 'VNEXT_DECISION_RESPONSE_KEYS_INVALID');
    if (!optionIds.has(record.response.selected_option_id)) V.fail('VNEXT_DECISION_RESPONSE_OPTION_INVALID');
    V.assertUnicodeExactText(record.response.response_text, 'VNEXT_DECISION_RESPONSE_TEXT_INVALID', 'response_text');
    V.assertNonEmptyString(record.response.responded_by, 'VNEXT_DECISION_RESPONDER_INVALID', 'responded_by');
    V.assertIsoDate(record.resolved_at, 'VNEXT_DECISION_RESOLVED_AT_INVALID', 'resolved_at');
    if (record.resolution_evidence.length === 0) V.fail('VNEXT_DECISION_RESOLUTION_EVIDENCE_REQUIRED');
  }
  return true;
}

function resolve(record, resolution) {
  validate(record);
  if (record.status !== 'OPEN') V.fail('VNEXT_DECISION_ALREADY_RESOLVED');
  V.assertExactKeys(resolution, ['selected_option_id', 'response_text', 'responded_by', 'resolved_at', 'resolution_evidence'], [], 'VNEXT_DECISION_RESOLUTION_INPUT_INVALID');
  if (!record.options.some((option) => option.option_id === resolution.selected_option_id)) V.fail('VNEXT_DECISION_RESPONSE_OPTION_INVALID');
  V.assertUnicodeExactText(resolution.response_text, 'VNEXT_DECISION_RESPONSE_TEXT_INVALID', 'response_text');
  V.assertNonEmptyString(resolution.responded_by, 'VNEXT_DECISION_RESPONDER_INVALID', 'responded_by');
  V.assertIsoDate(resolution.resolved_at, 'VNEXT_DECISION_RESOLVED_AT_INVALID', 'resolved_at');
  const evidence = V.uniqueStrings(resolution.resolution_evidence, 'VNEXT_DECISION_RESOLUTION_EVIDENCE_INVALID', 'resolution_evidence');

  const unsigned = {
    schema_version: SCHEMA,
    decision_id: record.decision_id,
    slice_id: record.slice_id,
    question: record.question,
    options: record.options,
    source_ids: record.source_ids,
    affected_requirement_ids: record.affected_requirement_ids,
    status: 'RESOLVED',
    response: Object.freeze({
      selected_option_id: resolution.selected_option_id,
      response_text: resolution.response_text,
      responded_by: resolution.responded_by,
    }),
    created_at: record.created_at,
    causal_evidence: record.causal_evidence,
    resolved_at: resolution.resolved_at,
    resolution_evidence: evidence,
  };
  return V.sealContract(unsigned);
}

function toSourceInput(record) {
  validate(record);
  if (record.status !== 'RESOLVED') V.fail('VNEXT_DECISION_NOT_RESOLVED');
  return Object.freeze({
    source_kind: 'DECISION_RECORD',
    authority: 'DECISION',
    locator: `decision:${record.decision_id}`,
    revision: record.contract_hash,
    fingerprint: V.canonicalHash(record),
    units: [Object.freeze({
      locator: `decision:${record.decision_id}:resolution`,
      fingerprint: V.canonicalHash(record.response),
      disposition: 'REQUIREMENT_SOURCE',
    })],
  });
}

module.exports = { SCHEMA, STATUSES, createOpen, validate, resolve, toSourceInput };
