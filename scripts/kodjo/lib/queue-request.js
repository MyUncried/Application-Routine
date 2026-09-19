'use strict';

const { validateRetryReason, operationKind } = require('./queue-contract');

const LOCAL_REQUEST_SCHEMA = 'kodjo.protocol.v2.local-implementation.0.6.12';

function projectQueueRequest(queue) {
  if (!queue || typeof queue !== 'object' || Array.isArray(queue)) {
    throw new Error('KODJO_QUEUE_INVALID');
  }
  const mode = String(queue.mode || '').toUpperCase();
  const kind = operationKind(queue);
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

  const visual = kind === 'VISUAL_CORRECTION';
  if (visual && (!queue.delivery_target || !queue.delivery_target.application_head)) {
    throw new Error('KODJO_QUEUE_DELIVERY_TARGET_REFUSED');
  }

  const request = {
    schema_version: LOCAL_REQUEST_SCHEMA,
    slice_id: queue.slice_id,
    // Le protocole et le code applicatif sont deux références différentes.
    // Le superviseur local doit travailler sur le HEAD applicatif lorsqu'il
    // corrige une PR existante, tout en conservant le HEAD protocolaire pour
    // la traçabilité et les autorisations.
    source_head: visual ? queue.delivery_target.application_head : queue.source_head,
    protocol_source_head: queue.source_head,
    baseline_head: queue.baseline_head,
    slice_bootstrap_file: queue.slice_bootstrap_file,
    slice_bootstrap_sha256: queue.slice_bootstrap_sha256,
    mode: queue.mode,
    operation_kind: kind,
    delivery_target: queue.delivery_target || null,
    session_id: queue.session_id,
    prompt_file: queue.prompt_file,
    scope_allow: Array.isArray(queue.scope_allow) ? queue.scope_allow : [],
    checks: Array.isArray(queue.checks) ? queue.checks : [],
    limits: queue.limits,
    request_id: queue.request_id,
  };
  if (Object.prototype.hasOwnProperty.call(queue, 'initial_restart')) {
    const detail = require('./initial-restart').shape(queue.initial_restart, queue);
    if (detail) throw new Error('INITIAL_RESTART_CAUSALITY_INVALID: ' + detail);
    request.initial_restart = {...queue.initial_restart};
  }
  if (queue.allow_legacy_recovery_bootstrap !== undefined) {
    request.allow_legacy_recovery_bootstrap = queue.allow_legacy_recovery_bootstrap === true;
  }
  if (queue.retry_of_run_id !== undefined) {
    request.retry_of_run_id = String(queue.retry_of_run_id);
  }
  if (mode === 'RESUME_DELTA') {
    request.retry_reason = {
      code: queue.retry_reason.code,
      detail: queue.retry_reason.detail,
    };
    // Une correction visuelle d'une PR déjà livrée ne restaure pas le paquet
    // historique : le checkpoint prouve que ce paquet est déjà matérialisé dans
    // application_head. Le replay d'un ancien patch sur ce HEAD recréerait les
    // modifications déjà livrées et peut provoquer des conflits artificiels.
    if (!visual && queue.recovery_migration !== undefined) {
      request.recovery_migration = {
        attestation_path: queue.recovery_migration.attestation_path,
        attestation_blob_oid: queue.recovery_migration.attestation_blob_oid,
        evidence_kind: queue.recovery_migration.evidence_kind,
      };
      if (queue.recovery_migration.delivery_checkpoint !== undefined) {
        request.recovery_migration.delivery_checkpoint = queue.recovery_migration.delivery_checkpoint;
      }
    }
  }
  return request;
}

module.exports = { LOCAL_REQUEST_SCHEMA, projectQueueRequest };
