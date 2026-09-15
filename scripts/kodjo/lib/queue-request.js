'use strict';

const { validateRetryReason } = require('./queue-contract');

const LOCAL_REQUEST_SCHEMA = 'kodjo.protocol.v2.local-implementation.0.6.12';

function projectQueueRequest(queue) {
  if (!queue || typeof queue !== 'object' || Array.isArray(queue)) {
    throw new Error('KODJO_QUEUE_INVALID');
  }
  const mode = String(queue.mode || '').toUpperCase();
  const retryReasonPresent = Object.prototype.hasOwnProperty.call(queue, 'retry_reason');
  if (mode === 'RESUME_DELTA') {
    const detail = validateRetryReason(queue.retry_reason);
    if (detail) throw new Error('KODJO_QUEUE_RETRY_REASON_INVALID: ' + detail);
  } else if (retryReasonPresent) {
    throw new Error('KODJO_QUEUE_RETRY_REASON_INVALID: reserve a RESUME_DELTA');
  }
  if (queue.allow_legacy_recovery_bootstrap !== undefined &&
      typeof queue.allow_legacy_recovery_bootstrap !== 'boolean') {
    throw new Error('KODJO_QUEUE_LEGACY_RECOVERY_BOOTSTRAP_INVALID');
  }

  // KV2-01, amelioration contractuelle : « non specifie » et « explicitement
  // refuse » ne sont pas la meme decision protocolaire. La cle n'est emise que si
  // la file la porte ; projeter un `false` inscrirait dans les traces une decision
  // qu'aucun acteur n'a prise. La garde de type ci-dessus reste inchangee.
  const request = {
    schema_version: LOCAL_REQUEST_SCHEMA,
    slice_id: queue.slice_id,
    source_head: queue.source_head,
    baseline_head: queue.baseline_head,
    slice_bootstrap_file: queue.slice_bootstrap_file,
    slice_bootstrap_sha256: queue.slice_bootstrap_sha256,
    mode: queue.mode,
    session_id: queue.session_id,
    prompt_file: queue.prompt_file,
    scope_allow: Array.isArray(queue.scope_allow) ? queue.scope_allow : [],
    checks: Array.isArray(queue.checks) ? queue.checks : [],
    limits: queue.limits,
    // Identifiant de bout en bout : admission, invocation, diagnostic et reprise.
    request_id: queue.request_id,
  };
  if (queue.allow_legacy_recovery_bootstrap !== undefined) {
    request.allow_legacy_recovery_bootstrap = queue.allow_legacy_recovery_bootstrap === true;
  }
  // KV2-03 : le superviseur doit savoir de quel run provient le paquet de
  // reprise qu'il restaure. Detecte par le test de completude du contrat.
  if (queue.retry_of_run_id !== undefined) {
    request.retry_of_run_id = String(queue.retry_of_run_id);
  }
  if (mode === 'RESUME_DELTA') {
    request.delivery_checkpoint = {
      checkpoint_ref: queue.delivery_checkpoint.checkpoint_ref,
      application_pr: String(queue.delivery_checkpoint.application_pr),
      application_head: queue.delivery_checkpoint.application_head,
      plan_comment_id: String(queue.delivery_checkpoint.plan_comment_id),
      review_comment_id: String(queue.delivery_checkpoint.review_comment_id),
      gate_comment_id: String(queue.delivery_checkpoint.gate_comment_id),
      protocol_head: queue.delivery_checkpoint.protocol_head,
      package_run_id: String(queue.delivery_checkpoint.package_run_id),
      package_artifact_id: String(queue.delivery_checkpoint.package_artifact_id),
      delivery_head: queue.delivery_checkpoint.delivery_head,
    };
    request.retry_reason = {
      code: queue.retry_reason.code,
      detail: queue.retry_reason.detail,
    };
    if (queue.recovery_migration !== undefined) {
      request.recovery_migration = {
        attestation_path: queue.recovery_migration.attestation_path,
        attestation_blob_oid: queue.recovery_migration.attestation_blob_oid,
        evidence_kind: queue.recovery_migration.evidence_kind,
      };
    }
  }
  return request;
}

module.exports = { LOCAL_REQUEST_SCHEMA, projectQueueRequest };
