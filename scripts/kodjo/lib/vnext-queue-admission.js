'use strict';

const fs = require('node:fs');
const path = require('node:path');
const V = require('./vnext-contract');
const Runtime = require('./vnext-runtime');
const Adapter = require('./vnext-legacy-queue-adapter');
const Authorizations = require('../verify-authorizations');
const Preserved = require('./vnext-preserved-controls');

// Read-only admission. This does not enqueue work or invoke an implementation
// runner. Fixture clients are injectable like the existing authorization verifier;
// production defaults to authenticated gh API reads, with no offline fallback.
function verifyQueueAdmission({ queueFile, projection, artifacts, transport, github = null }) {
  const cwd = artifacts.cwd;
  if (!cwd) V.fail('VNEXT_QUEUE_ADMISSION_CWD_REQUIRED');
  const runtimeSnapshot = Runtime.buildRuntimeSnapshot(artifacts);
  const rebuilt = Adapter.buildLegacyQueueProjection({ ...artifacts, transport });
  if (V.canonicalStringify(projection) !== V.canonicalStringify(rebuilt)) {
    V.fail('VNEXT_QUEUE_ADMISSION_PROJECTION_REBUILD_MISMATCH');
  }
  Adapter.verifyCompatibilityFilesAtApprovedCommit(projection, artifacts.executionRequest, { cwd });
  const absolute = path.resolve(cwd, queueFile);
  if (!absolute.startsWith(path.resolve(cwd) + path.sep)) V.fail('VNEXT_QUEUE_ADMISSION_PATH_INVALID');
  const queue = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  if (V.canonicalStringify(queue) !== V.canonicalStringify(projection.legacy_queue_request)) {
    V.fail('VNEXT_QUEUE_ADMISSION_REQUEST_MISMATCH');
  }
  const api = github || Authorizations.ghClient();
  const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(artifacts.executionRequest.issue_id);
  const commentId = transport.gate_ref.slice('issue_comment:'.length);
  const comment = api.comment(issue[1], commentId);
  if (!String(comment?.body || '').includes(artifacts.approvalTarget.contract_hash)) {
    V.fail('VNEXT_QUEUE_ADMISSION_EXACT_TARGET_ABSENT');
  }
  const core = artifacts.approvalTarget.execution_core;
  if (!String(comment.body).includes('execution_context=' + V.canonicalStringify(core.execution_context))) V.fail('VNEXT_QUEUE_ADMISSION_WRITER_NOT_EXPLICIT');
  for (const row of core.native_primitive_decisions) {
    if (!String(comment.body).includes('native_primitive_decision=' + V.canonicalStringify(row))) V.fail('NATIVE_PRIMITIVE_EXCEPTION_REQUIRED');
  }
  for (const id of Preserved.exceptionIds(core.native_primitive_decisions)) {
    if (!String(comment.body).includes('native_primitive_exception_request=' + id)) V.fail('NATIVE_PRIMITIVE_EXCEPTION_REQUIRED');
  }
  const reactions = api.reactions(issue[1], commentId);
  const editedAt = Date.parse(comment.updated_at);
  const observedAt = Date.parse(artifacts.approvalRecord.observed_at);
  const reaction = reactions.find(row => row.content === '+1'
    && row.user?.login?.toLowerCase() === artifacts.approvalRecord.actor_id.toLowerCase()
    && Number.isFinite(Date.parse(row.created_at)) && Date.parse(row.created_at) >= editedAt
    && Date.parse(row.created_at) <= observedAt);
  if (!Number.isFinite(editedAt) || editedAt > observedAt || !reaction) {
    V.fail('VNEXT_QUEUE_ADMISSION_REACTION_NOT_BOUND_TO_TARGET');
  }
  // The legacy consumer checks the very same authenticated observation.
  const snapshotApi = { ...api, comment: () => comment, reactions: () => reactions };
  const authorization = Authorizations.verify(queueFile, { cwd, github: snapshotApi });
  return V.sealContract({ schema_version: 'kodjo.vnext.queue-admission.v1',
    status: 'AUTHORIZED', execution_request_hash: artifacts.executionRequest.contract_hash,
    projection_hash: projection.contract_hash, runtime_snapshot_hash: runtimeSnapshot.contract_hash,
    protocol_head: artifacts.executionRequest.protocol_head, authorization });
}

module.exports = { verifyQueueAdmission };
