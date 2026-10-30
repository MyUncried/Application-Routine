'use strict';
// Read-only reconstruction and human feedback. These outputs grant no authority.
const V = require('./vnext-contract');
const C = require('./vnext-work-consumption');

function notification(signal, checkpoint) {
  V.verifyContractHash(signal); V.verifyContractHash(checkpoint);
  if (checkpoint.signal_hash !== signal.contract_hash || checkpoint.signal_key !== signal.signal_key) throw Error('WORK_NOTICE_BINDING');
  const failed = signal.error || signal.transport_status === 'EXECUTION_NOT_SUCCEEDED' || signal.transport_status === 'RESULT_ARCHIVE_MISSING';
  return {
    title: checkpoint.continuation_state === 'WAITING_USER_DECISION' ? 'Décision utilisateur attendue'
      : checkpoint.continuation_state === 'BLOCKED_WITH_EVIDENCE' || failed ? 'Résultat VNext à traiter' : 'Résultat VNext reçu',
    signal_key: signal.signal_key,
    result: signal.transport_status,
    semantic_verdict: signal.semantic_verdict ?? null,
    diagnostic: signal.error ? String(signal.error).split(/[\s:]/)[0].slice(0,160) : null,
    model_invoked: signal.model_invoked ?? null,
    continuation_state: checkpoint.continuation_state,
    next_action: checkpoint.next_action,
    evidence_refs: checkpoint.evidence_refs,
    delivery_scope: 'CURRENT_EXECUTION',
    pilot_delivery_verified: false,
    grants_authority: false,
  };
}

function reconstruct(c, {main_head, transport_head, signals, claims, checkpoints, receipts, operations = []}) {
  V.assertSha40(main_head); V.assertSha40(transport_head);
  for (const signal of signals) C.validateSignal(c, signal);
  const pending = C.pending(signals, claims, receipts);
  const rows = signals.map((s, i) => {
    const claim = claims[s.signal_key], cp = checkpoints[s.signal_key], receipt = receipts[s.signal_key];
    if (claim && (claim.schema_version !== 'kodjo.vnext.work-claim.v1' || claim.status !== 'RECEIVED' || claim.signal_key !== s.signal_key || claim.operation_hash !== s.operation_hash)) throw Error('WORK_RESUME_CLAIM');
    if (cp) {
      if (!claim) throw Error('WORK_RESUME_CHECKPOINT_WITHOUT_OWNER');
      const rebuilt = C.checkpoint(c, s, claim, cp);
      if (rebuilt.contract_hash !== cp.contract_hash) throw Error('WORK_RESUME_CHECKPOINT_CHANGED');
    }
    if (receipt) {
      if (!cp || C.processed(claim, cp, receipt.checkpoint_ref).contract_hash !== receipt.contract_hash) throw Error('WORK_RESUME_RECEIPT_CHANGED');
    }
    return {signal_key:s.signal_key, signal_hash:s.contract_hash, operation_hash:s.operation_hash,
      state:pending[i].state, owner_conversation:claim?.conversation_id || null,
      continuation_state:cp?.continuation_state || null,
      next_action:cp?.next_action || (claim ? 'Reconcile with the existing owner; do not steal or repeat.' : 'Verify archives, then use the existing consumer.'),
      notification:cp ? notification(s,cp) : null};
  });
  return V.sealContract({schema_version:'kodjo.vnext.work-resume.v1', repository:c.repository,
    binding_hash:c.contract_hash, main_head, transport_head, rows, operations,
    mission_completed:false, grants_authority:false, pilot_delivery_verified:false});
}

function prepareHandover(c, snapshot, {previous_automation, next_automation}) {
  require('../signal-vnext-agent-continuation').binding(c); V.verifyContractHash(snapshot);
  if (snapshot.schema_version !== 'kodjo.vnext.work-resume.v1' || snapshot.binding_hash !== c.contract_hash || snapshot.repository !== c.repository) throw Error('WORK_HANDOVER_SNAPSHOT');
  if (previous_automation.id !== c.automation_id || previous_automation.conversation_id !== c.conversation_id || previous_automation.is_enabled !== false
    || !next_automation.id || !next_automation.conversation_id || next_automation.is_enabled !== true) throw Error('WORK_HANDOVER_OBSERVATION_REQUIRED');
  if (snapshot.rows.some(r=>r.state === 'CLAIMED_REQUIRES_RECONCILIATION')) throw Error('WORK_HANDOVER_OWNED_WORK');
  const {contract_hash, ...body} = c;
  const previous = [...(c.accepted_prior_destinations || []), {automation_id:c.automation_id,conversation_id:c.conversation_id}];
  const accepted_prior_destinations = previous.filter((p,i)=>previous.findIndex(q=>q.automation_id===p.automation_id&&q.conversation_id===p.conversation_id)===i);
  return require('../signal-vnext-agent-continuation').binding(V.sealContract({...body,
    automation_id:next_automation.id, conversation_id:next_automation.conversation_id, accepted_prior_destinations}));
}
module.exports = {notification, reconstruct, prepareHandover};
