'use strict';

const fs = require('node:fs');
const path = require('node:path');
const V = require('./vnext-contract');
const Runtime = require('./vnext-runtime');
const Adapter = require('./vnext-legacy-queue-adapter');
const Authorizations = require('../verify-authorizations');
const GithubApproval = require('./vnext-github-approval');

// Read-only admission. This does not enqueue work or invoke an implementation
// runner. Fixture clients are injectable like the existing authorization verifier;
// production defaults to authenticated gh API reads, with no offline fallback.
function verifyQueueAdmission({ queueFile, projection, artifacts, transport, github = null, allowExternalQueueFile = false }) {
  const cwd = artifacts.cwd;
  if (!cwd) V.fail('VNEXT_QUEUE_ADMISSION_CWD_REQUIRED');
  const runtimeSnapshot = Runtime.buildRuntimeSnapshot(artifacts);
  const rebuilt = Adapter.buildLegacyQueueProjection({ ...artifacts, transport });
  if (V.canonicalStringify(projection) !== V.canonicalStringify(rebuilt)) {
    V.fail('VNEXT_QUEUE_ADMISSION_PROJECTION_REBUILD_MISMATCH');
  }
  Adapter.verifyCompatibilityFilesAtApprovedCommit(projection, artifacts.executionRequest, { cwd });
  const absolute = path.resolve(cwd, queueFile);
  if (!allowExternalQueueFile && !absolute.startsWith(path.resolve(cwd) + path.sep)) V.fail('VNEXT_QUEUE_ADMISSION_PATH_INVALID');
  const queue = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  if (V.canonicalStringify(queue) !== V.canonicalStringify(projection.legacy_queue_request)) {
    V.fail('VNEXT_QUEUE_ADMISSION_REQUEST_MISMATCH');
  }
  const api = github || Authorizations.ghClient();
  const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(artifacts.executionRequest.issue_id);
  const commentId = transport.gate_ref.slice('issue_comment:'.length);
  const comment = api.comment(issue[1], commentId);
  const reactions = api.reactions(issue[1], commentId);
  GithubApproval.verifyObservation({ repository: issue[1], issueNumber: issue[2],
    head: artifacts.executionRequest.protocol_head, target: artifacts.approvalTarget,
    gateRef: transport.gate_ref, comment, reactions, actor: artifacts.approvalRecord.actor_id,
    observedAt: artifacts.approvalRecord.observed_at, evidenceRef: artifacts.approvalRecord.evidence_ref });
  // The legacy consumer checks the very same authenticated observation.
  const snapshotApi = { ...api, comment: () => comment, reactions: () => reactions };
  const authorization = Authorizations.verify(queueFile, { cwd, github: snapshotApi, vnextTransportChecked: true });
  return V.sealContract({ schema_version: 'kodjo.vnext.queue-admission.v1',
    status: 'AUTHORIZED', execution_request_hash: artifacts.executionRequest.contract_hash,
    projection_hash: projection.contract_hash, runtime_snapshot_hash: runtimeSnapshot.contract_hash,
    protocol_head: artifacts.executionRequest.protocol_head, authorization });
}

module.exports = { verifyQueueAdmission };
