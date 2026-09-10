'use strict';

const LOCAL_REQUEST_SCHEMA = 'kodjo.protocol.v2.local-implementation.0.6.12';

function projectQueueRequest(queue) {
  if (!queue || typeof queue !== 'object' || Array.isArray(queue)) {
    throw new Error('KODJO_QUEUE_INVALID');
  }
  if (queue.allow_legacy_recovery_bootstrap !== undefined &&
      typeof queue.allow_legacy_recovery_bootstrap !== 'boolean') {
    throw new Error('KODJO_QUEUE_LEGACY_RECOVERY_BOOTSTRAP_INVALID');
  }

  return {
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
    allow_legacy_recovery_bootstrap: queue.allow_legacy_recovery_bootstrap === true,
  };
}

module.exports = { LOCAL_REQUEST_SCHEMA, projectQueueRequest };
