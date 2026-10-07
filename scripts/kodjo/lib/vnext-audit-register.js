'use strict';

const V = require('./vnext-contract');

const SCHEMA = 'kodjo.vnext.cumulative-audit-register.v1';
const CLASSES = ['DEMONSTRATED_DEFECT', 'PROOF_UNAVAILABLE', 'PRODUCT_AMBIGUITY', 'RECOMMENDATION', 'SUCCESS'];
const SEVERITIES = ['BLOCKING', 'MAJOR', 'MINOR', 'INFO'];
const PHASES = ['ADMISSION', 'REQUIREMENTS', 'IMPACT', 'PLAN', 'REVIEW', 'REVISION', 'USER_APPROVAL', 'HANDOFF', 'FINAL_AUDIT', 'CUTOVER'];

function gateRows(entries) {
  return entries.filter(row => row.required_for_gate && row.classification !== 'SUCCESS' && row.classification !== 'RECOMMENDATION'
    && (row.lifecycle === 'OPEN' || row.classification === 'PROOF_UNAVAILABLE'));
}
function gateState(entries) {
  const required = gateRows(entries);
  return required.length === 0 ? (entries.some(row => row.lifecycle === 'ACCEPTED_RESERVE') ? 'ACCEPTED_WITH_RESERVES' : 'READY')
    : required.some(row => row.classification === 'PRODUCT_AMBIGUITY') ? 'USER_DECISION_REQUIRED'
      : required.some(row => row.classification === 'DEMONSTRATED_DEFECT') ? 'CORRECTION_REQUIRED' : 'WAIT_FOR_PROOF';
}

function validateRegister(register) {
  V.assertExactKeys(register, ['schema_version', 'candidate_head', 'lot', 'phase', 'authorized_actor', 'previous_register_hash', 'revision_count', 'revision_limit', 'entries', 'gate', 'reentry_allowed', 'auto_retry', 'contract_hash'], [], 'VNEXT_REGISTER_KEYS_INVALID');
  if (register.schema_version !== SCHEMA || !PHASES.includes(register.phase)) V.fail('VNEXT_REGISTER_SCHEMA_OR_PHASE_INVALID');
  V.verifyContractHash(register, 'VNEXT_REGISTER_HASH_INVALID');
  V.assertSha40(register.candidate_head, 'VNEXT_REGISTER_HEAD_INVALID');
  if (!Array.isArray(register.entries)) V.fail('VNEXT_REGISTER_ROWS_INVALID');
  if (!Number.isInteger(register.revision_count) || register.revision_count < 0 || !Number.isInteger(register.revision_limit) || register.revision_limit < 0) V.fail('VNEXT_REGISTER_REVISION_BOUND_INVALID');
  const ids = new Set();
  for (const row of register.entries) {
    V.assertExactKeys(row, ['rule_id', 'target_id', 'target_hash', 'normative_hash', 'criterion_hash', 'classification', 'severity', 'required_for_gate', 'evidence_refs', 'note', 'subject_id', 'lifecycle', 'acceptance', 'causal_reasons', 'observed_head'], [], 'VNEXT_REGISTER_ENTRY_KEYS_INVALID');
    if (!CLASSES.includes(row.classification) || !SEVERITIES.includes(row.severity) || typeof row.required_for_gate !== 'boolean' || !['OPEN', 'RESOLVED', 'ACCEPTED_RESERVE'].includes(row.lifecycle)) V.fail('VNEXT_REGISTER_CLASSIFICATION_INVALID');
    for (const key of ['target_hash', 'normative_hash', 'criterion_hash']) V.assertSha64(row[key], 'VNEXT_REGISTER_OBSERVATION_HASH_INVALID');
    V.uniqueStrings(row.evidence_refs, 'VNEXT_REGISTER_EVIDENCE_REQUIRED', 'evidence_refs');
    if (row.subject_id !== V.stableId('SUBJECT', [row.rule_id, row.target_id]) || ids.has(row.subject_id)) V.fail('VNEXT_REGISTER_SUBJECT_INVALID');
    ids.add(row.subject_id);
    if (row.lifecycle === 'RESOLVED' && row.classification !== 'SUCCESS') V.fail('VNEXT_REGISTER_RESOLUTION_WITHOUT_SUCCESS');
    if (row.lifecycle === 'ACCEPTED_RESERVE' && (!row.acceptance || row.acceptance.actor_id !== register.authorized_actor || row.acceptance.action !== 'ACCEPT_RESERVE')) V.fail('VNEXT_REGISTER_DECISION_UNAUTHORIZED');
  }
  const reentry = gateRows(register.entries).some(row => row.classification === 'DEMONSTRATED_DEFECT') && register.revision_count < register.revision_limit;
  if (register.gate !== gateState(register.entries) || register.reentry_allowed !== reentry || register.auto_retry !== false) V.fail('VNEXT_REGISTER_GATE_MISMATCH');
  return true;
}

function buildRegister({ previous = null, candidateHead, lot, phase, observations, decisions = [], authorizedActor, revisionCount, revisionLimit }) {
  V.assertSha40(candidateHead, 'VNEXT_REGISTER_HEAD_INVALID');
  for (const value of [lot, phase, authorizedActor]) V.assertUnicodeExactText(value, 'VNEXT_REGISTER_CONTEXT_INVALID');
  if (!PHASES.includes(phase)) V.fail('VNEXT_REGISTER_PHASE_INVALID');
  if (!Number.isInteger(revisionLimit) || revisionLimit < 0 || !Number.isInteger(revisionCount) || revisionCount < 0) {
    V.fail('VNEXT_REGISTER_REVISION_BOUND_INVALID');
  }
  if (!Array.isArray(observations) || !Array.isArray(decisions)) V.fail('VNEXT_REGISTER_ROWS_INVALID');
  if (previous) {
    validateRegister(previous);
    V.verifyContractHash(previous, 'VNEXT_REGISTER_PREVIOUS_HASH_INVALID');
    if (previous.schema_version !== SCHEMA) V.fail('VNEXT_REGISTER_PREVIOUS_SCHEMA_INVALID');
    if (previous.lot !== lot) V.fail('VNEXT_REGISTER_PREVIOUS_LOT_MISMATCH');
    if (previous.authorized_actor !== authorizedActor) V.fail('VNEXT_REGISTER_AUTHORITY_CHANGED');
    if (revisionCount < previous.revision_count || revisionLimit !== previous.revision_limit) V.fail('VNEXT_REGISTER_REVISION_BOUND_CHANGED');
  }
  const rows = new Map((previous ? previous.entries : []).map(row => [row.subject_id, { ...row }]));
  const decisionMap = new Map();
  for (const decision of decisions) {
    V.assertExactKeys(decision, ['subject_id', 'action', 'actor_id', 'evidence_ref', 'note'], [], 'VNEXT_REGISTER_DECISION_KEYS_INVALID');
    if (!['ACCEPT_RESERVE', 'RESOLVE', 'REVOKE'].includes(decision.action)) V.fail('VNEXT_REGISTER_DECISION_INVALID');
    if (decision.actor_id !== authorizedActor) V.fail('VNEXT_REGISTER_DECISION_UNAUTHORIZED');
    for (const field of ['subject_id', 'evidence_ref', 'note']) V.assertUnicodeExactText(decision[field], 'VNEXT_REGISTER_DECISION_EVIDENCE_REQUIRED');
    if (decisionMap.has(decision.subject_id)) V.fail('VNEXT_REGISTER_DUPLICATE_DECISION');
    decisionMap.set(decision.subject_id, decision);
  }
  const seen = new Set();
  for (const input of observations) {
    V.assertExactKeys(input, ['rule_id', 'target_id', 'target_hash', 'normative_hash', 'criterion_hash', 'classification', 'severity', 'required_for_gate', 'evidence_refs', 'note'], [], 'VNEXT_REGISTER_OBSERVATION_KEYS_INVALID');
    for (const key of ['rule_id', 'target_id', 'note']) V.assertUnicodeExactText(input[key], 'VNEXT_REGISTER_OBSERVATION_TEXT_INVALID');
    for (const key of ['target_hash', 'normative_hash', 'criterion_hash']) V.assertSha64(input[key], 'VNEXT_REGISTER_OBSERVATION_HASH_INVALID');
    if (!CLASSES.includes(input.classification) || !SEVERITIES.includes(input.severity) || typeof input.required_for_gate !== 'boolean') V.fail('VNEXT_REGISTER_CLASSIFICATION_INVALID');
    const evidence = V.uniqueStrings(input.evidence_refs, 'VNEXT_REGISTER_EVIDENCE_REQUIRED', 'evidence_refs').sort();
    const id = V.stableId('SUBJECT', [input.rule_id, input.target_id]);
    if (seen.has(id)) V.fail('VNEXT_REGISTER_DUPLICATE_SUBJECT', id);
    seen.add(id);
    const prior = rows.get(id);
    const changed = prior && (['target_hash', 'normative_hash', 'criterion_hash'].some(key => prior[key] !== input[key]) || evidence.some(ref => !prior.evidence_refs.includes(ref)));
    const phaseChanged = previous && previous.phase !== phase;
    const escalated = prior && (input.classification !== prior.classification || input.severity !== prior.severity || input.required_for_gate !== prior.required_for_gate);
    if (escalated && !changed && !phaseChanged) V.fail('VNEXT_REGISTER_REQUALIFICATION_WITHOUT_NEW_EVIDENCE', id);
    const causalReasons = prior ? [
      ...['target_hash', 'normative_hash', 'criterion_hash'].filter(key => prior[key] !== input[key]),
      ...(evidence.some(ref => !prior.evidence_refs.includes(ref)) ? ['NEW_EVIDENCE'] : []),
      ...(phaseChanged ? ['PHASE_CHANGED'] : []),
    ] : ['NEW_SUBJECT'];
    let lifecycle = prior ? prior.lifecycle : 'OPEN';
    if (prior && ['ACCEPTED_RESERVE', 'RESOLVED'].includes(lifecycle) && (changed || phaseChanged) && input.classification !== 'SUCCESS') lifecycle = 'OPEN';
    if (prior && prior.lifecycle === 'RESOLVED' && input.classification !== 'SUCCESS' && !changed && !phaseChanged) V.fail('VNEXT_REGISTER_REOPEN_WITHOUT_CAUSE', id);
    rows.set(id, { ...input, evidence_refs: evidence, subject_id: id, lifecycle, acceptance: prior ? prior.acceptance : null, causal_reasons: causalReasons, observed_head: candidateHead });
  }
  for (const [id, decision] of decisionMap) {
    const row = rows.get(id);
    if (!row) V.fail('VNEXT_REGISTER_DECISION_SUBJECT_UNKNOWN', id);
    if (decision.action === 'RESOLVE' && (!seen.has(id) || row.classification !== 'SUCCESS')) V.fail('VNEXT_REGISTER_RESOLUTION_WITHOUT_SUCCESS', id);
    if (decision.action === 'REVOKE' && row.lifecycle !== 'ACCEPTED_RESERVE') V.fail('VNEXT_REGISTER_RESERVE_NOT_ACCEPTED', id);
    if (decision.action === 'ACCEPT_RESERVE' && ['PRODUCT_AMBIGUITY', 'SUCCESS', 'RECOMMENDATION'].includes(row.classification)) V.fail('VNEXT_REGISTER_RESERVE_CLASS_INVALID', id);
    row.lifecycle = decision.action === 'RESOLVE' ? 'RESOLVED' : (decision.action === 'ACCEPT_RESERVE' ? 'ACCEPTED_RESERVE' : 'OPEN');
    row.acceptance = decision.action === 'ACCEPT_RESERVE' ? { ...decision, candidate_head: candidateHead, lot, phase } : null;
  }
  const entries = [...rows.values()].sort((a, b) => a.subject_id.localeCompare(b.subject_id));
  const required = gateRows(entries);
  const state = gateState(entries);
  return V.sealContract({ schema_version: SCHEMA, candidate_head: candidateHead, lot, phase, authorized_actor: authorizedActor,
    previous_register_hash: previous ? previous.contract_hash : null, revision_count: revisionCount, revision_limit: revisionLimit,
    entries, gate: state, reentry_allowed: required.some(row => row.classification === 'DEMONSTRATED_DEFECT') && revisionCount < revisionLimit,
    auto_retry: false });
}

module.exports = { SCHEMA, CLASSES, SEVERITIES, PHASES, buildRegister, validateRegister };
