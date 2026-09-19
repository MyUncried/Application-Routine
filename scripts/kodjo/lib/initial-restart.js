'use strict';
const { canonical } = require('./preflight-contract');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE = 'IRRECOVERABLE_INITIAL_RESTART';
function shape(value, request) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'objet causal requis';
  if (Object.keys(value).sort().join(',') !== 'code,source_request_id,source_run_attempt,source_run_id') return 'champs causaux exacts requis';
  if (request.mode !== 'INITIAL' || (request.operation_kind || 'IMPLEMENT') !== 'IMPLEMENT') return 'reserve a IMPLEMENT INITIAL';
  if (value.code !== CODE || typeof value.source_run_id !== 'string' || typeof value.source_request_id !== 'string' || !/^[1-9][0-9]*$/.test(value.source_run_id) || value.source_run_attempt !== 1 || !UUID.test(value.source_request_id)) return 'identite causale invalide';
  if (!UUID.test(request.request_id) || value.source_request_id.toLowerCase() === request.request_id.toLowerCase()) return 'nouveau request_id requis';
  if (request.retry_of_run_id !== undefined || request.retry_reason !== undefined) return 'retry reserve a RESUME_DELTA';
  return null;
}
function need(condition, code) { if (!condition) throw Error('INITIAL_RESTART_' + code); }
function context(queue) {
  const copy = {...queue};
  for (const key of ['request_id','created_at','initial_restart']) delete copy[key];
  return canonical(copy);
}
// This decision function receives observations from the read-only collector,
// never an admission boolean supplied in a queue or by the AI.
function decide(queue, evidence) {
  need(!shape(queue.initial_restart, queue), 'CAUSALITY_INVALID');
  const link = queue.initial_restart, e = evidence;
  need(e && e.receipt && e.sourceQueue && e.invocation, 'EVIDENCE_MISSING');
  need(e.receipt.schema === 'kodjo.queue-consumption.v1' && e.receipt.mode === 'INITIAL' &&
    e.receipt.request_id === link.source_request_id && String(e.receipt.run_id) === link.source_run_id &&
    Number(e.receipt.run_attempt) === link.source_run_attempt, 'CONSUMPTION_MISMATCH');
  need(e.sourceQueue.request_id === link.source_request_id && e.sourceQueue.mode === 'INITIAL' &&
    e.receipt.source_head === e.sourceQueue.source_head, 'SOURCE_MISMATCH');
  need(context(queue) === context(e.sourceQueue), 'CONTEXT_INCOMPATIBLE');
  const runKey = `github-${link.source_run_id}-${link.source_run_attempt}`;
  need(e.invocation.state === 'EXTERNAL_CALL_SENT' && e.invocation.mode === 'INITIAL' &&
    e.invocation.run_id === runKey && e.invocation.request_id === link.source_request_id &&
    e.invocation.source_head === queue.source_head, 'INVOCATION_MISMATCH');
  need(UUID.test(e.invocation.session_id || ''), 'SESSION_IDENTITY_UNKNOWN');
  need(e.result === null || (e.result.schema_version === 'kodjo.protocol.v2.run-context.0.6.17' &&
    e.result.run_id === runKey && e.result.status === 'PRE_INVOCATION' &&
    e.result.claude_invoked === false && e.result.diagnostic === 'RUN_INITIALIZED'), 'RESULT_AVAILABLE_OR_AMBIGUOUS');
  need(e.session === 'ABSENT', 'SESSION_AVAILABLE_OR_AMBIGUOUS');
  need(e.recovery === 'ABSENT', 'RECOVERY_AVAILABLE_OR_AMBIGUOUS');
  need(e.processes === 'NONE' && e.lock === 'ABSENT', 'ACTIVITY_OR_LOCK');
  need(e.authorizations === 'PASS' && e.heads === 'PASS', 'CONTEXT_NOT_VERIFIED');
  return {status:'PASS', code:CODE, request_id:queue.request_id, ...link};
}
module.exports = {CODE, shape, context, decide, need};
