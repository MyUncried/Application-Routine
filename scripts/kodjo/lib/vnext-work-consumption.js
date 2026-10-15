'use strict';
// Immutable receipt chain and non-expiring ownership: a stalled claim is never stolen.
const V=require('./vnext-contract');
const ROOT='.github/orchestration/requests/vnext-work/consumption/';
const STATES=new Set(['WAITING_USER_DECISION','WAITING_REGISTERED_OPERATION','BLOCKED_WITH_EVIDENCE','RESULT_CONSUMED']);
function validateSignal(c,s){
 V.verifyContractHash(s);V.assertSha64(s.signal_key);
 const migrated=(c.accepted_prior_destinations||[]).some(p=>p.automation_id===s.automation_id&&p.conversation_id===s.conversation_id);
 if(s.repository!==c.repository||s.transport_pr!==c.transport_pr||(!migrated&&(s.automation_id!==c.automation_id||s.conversation_id!==c.conversation_id))||!['kodjo.vnext.work-signal.v1','kodjo.vnext.work-signal.v2'].includes(s.schema_version))throw Error('WORK_CONSUMPTION_SIGNAL_BINDING');
 if(s.schema_version.endsWith('.v2'))require('./vnext-work-execution').validateSignal(s,migrated?{...c,automation_id:s.automation_id,conversation_id:s.conversation_id}:c);
}
function claim(c,s,{owner_id,nonce,signal_commit_sha,conversation_id,receipt_kind}){
 validateSignal(c,s);V.assertSha40(signal_commit_sha);V.assertSha64(nonce);
 if(!owner_id||conversation_id!==c.conversation_id||!['AUTOMATION_EVENT','MANUAL_RECOVERY'].includes(receipt_kind))throw Error('WORK_CONSUMPTION_RECEIVER');
 return V.sealContract({schema_version:'kodjo.vnext.work-claim.v1',signal_key:s.signal_key,signal_hash:s.contract_hash,operation_hash:s.operation_hash,owner_id,nonce,signal_commit_sha,conversation_id,receipt_kind,status:'RECEIVED'});
}
function owns(existing,candidate){V.verifyContractHash(existing);V.verifyContractHash(candidate);if(existing.signal_key!==candidate.signal_key||existing.signal_hash!==candidate.signal_hash||existing.owner_id!==candidate.owner_id||existing.nonce!==candidate.nonce||existing.conversation_id!==candidate.conversation_id)throw Error('WORK_CLAIM_OWNED_ELSEWHERE');}
function checkpoint(c,s,owned,{continuation_state,next_action,evidence_refs}){
 validateSignal(c,s);V.verifyContractHash(owned);
 if(owned.signal_key!==s.signal_key||owned.signal_hash!==s.contract_hash||owned.status!=='RECEIVED'||!STATES.has(continuation_state)||typeof next_action!=='string'||!next_action.trim())throw Error('WORK_CHECKPOINT_BINDING');
 V.uniqueStrings(evidence_refs,'WORK_CHECKPOINT_EVIDENCE_REQUIRED','evidence_refs');
 return V.sealContract({schema_version:'kodjo.vnext.work-consumption-checkpoint.v1',signal_key:s.signal_key,signal_hash:s.contract_hash,operation_hash:s.operation_hash,claim_hash:owned.contract_hash,continuation_state,next_action,evidence_refs});
}
function processed(owned,cp,checkpoint_ref){
 V.verifyContractHash(owned);V.verifyContractHash(cp);
 if(cp.schema_version!=='kodjo.vnext.work-consumption-checkpoint.v1'||cp.claim_hash!==owned.contract_hash||cp.signal_key!==owned.signal_key||!/^git:[0-9a-f]{40}:\.github\/orchestration\/requests\/vnext-work\/consumption\/checkpoints\/[a-f0-9]{64}\.json$/.test(checkpoint_ref))throw Error('WORK_PROCESSED_CHECKPOINT_REQUIRED');
 return V.sealContract({schema_version:'kodjo.vnext.work-processed.v1',signal_key:owned.signal_key,signal_hash:owned.signal_hash,claim_hash:owned.contract_hash,owner_id:owned.owner_id,nonce:owned.nonce,checkpoint_hash:cp.contract_hash,checkpoint_ref,status:'PROCESSED'});
}
function pending(signals,claims,receipts){
 const keys=new Set();return signals.map(s=>{V.verifyContractHash(s);V.assertSha64(s.signal_key);if(keys.has(s.signal_key))throw Error('WORK_PENDING_DUPLICATE');keys.add(s.signal_key);const claim=claims[s.signal_key],receipt=receipts[s.signal_key];if(claim)V.verifyContractHash(claim);if(receipt)V.verifyContractHash(receipt);if(claim&&claim.signal_hash!==s.contract_hash||receipt&&(!claim||receipt.claim_hash!==claim.contract_hash||receipt.signal_hash!==s.contract_hash))throw Error('WORK_PENDING_RECEIPT_CHANGED');return {signal_key:s.signal_key,state:receipt?'PROCESSED':claim?'CLAIMED_REQUIRES_RECONCILIATION':'PENDING'};});
}
module.exports={ROOT,STATES,validateSignal,claim,owns,checkpoint,processed,pending};
