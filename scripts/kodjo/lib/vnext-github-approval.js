'use strict';
const V = require('./vnext-contract');
const Approval = require('./approval-handoff-contract');
// The same exact observation is required at every admission entry point.
function verifyObservation({ repository, issueNumber, head, target, gateRef, comment, reactions,
  actor = repository.split('/')[0], observedAt, evidenceRef = null }) {
  const id = /^issue_comment:([1-9][0-9]*)$/.exec(gateRef)?.[1];
  if (!id || String(comment?.id) !== id
      || comment.issue_url !== 'https://api.github.com/repos/' + repository + '/issues/' + issueNumber
      || comment.body !== head + '\n' + Approval.renderApprovalMessage(target)) {
    V.fail('VNEXT_CHAIN_EXACT_APPROVAL_MESSAGE_REQUIRED');
  }
  const edited = Date.parse(comment.updated_at), observed = Date.parse(observedAt);
  if (!Number.isFinite(edited) || !Number.isFinite(observed) || edited > observed
      || actor.toLowerCase() !== repository.split('/')[0].toLowerCase() || !Array.isArray(reactions)) {
    V.fail('VNEXT_QUEUE_ADMISSION_REACTION_NOT_BOUND_TO_TARGET');
  }
  const valid = reactions.filter(row => /^[1-9][0-9]*$/.test(String(row.id)) && row.content === '+1'
    && row.user?.login?.toLowerCase() === actor.toLowerCase()
    && Number.isFinite(Date.parse(row.created_at)) && Date.parse(row.created_at) >= edited
    && Date.parse(row.created_at) <= observed);
  if (!valid.length) V.fail(evidenceRef ? 'VNEXT_QUEUE_ADMISSION_REACTION_NOT_BOUND_TO_TARGET' : 'VNEXT_CHAIN_OWNER_APPROVAL_REQUIRED');
  const reaction = evidenceRef ? valid.find(row => evidenceRef === gateRef + '#reaction:' + row.id) : valid[0];
  if (!reaction) V.fail('VNEXT_QUEUE_ADMISSION_REACTION_ID_MISMATCH');
  return reaction;
}
module.exports = { verifyObservation };
