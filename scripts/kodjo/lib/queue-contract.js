'use strict';

/**
 * Contrat de la demande de file — KV2-23, structurel KV2-01.
 *
 * Ce module est la SOURCE UNIQUE du contrat Lean Queue. Le JSON Schema publié
 * en est une projection et les tests de complétude imposent qu'un champ de
 * comportement ne puisse plus être admis puis perdu avant le superviseur.
 */

const SHA40 = /^[0-9a-f]{40}$/;
const SHA64 = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLICE_ID = /^[A-Za-z0-9._-]{1,80}$/;
const SAFE_BRANCH = /^[A-Za-z0-9._/-]{1,200}$/;
const COMMENT_REF = /^issue_comment:[1-9][0-9]*$/;

const LEAN_REQUEST_SCHEMA = 'kodjo.protocol.v2.lean-request.0.6.13';
const CHECKS = ['jest', 'typescript', 'lint'];
const MODES = ['INITIAL', 'RESUME_DELTA'];
const OPERATION_KINDS = ['IMPLEMENT', 'VISUAL_CORRECTION'];
const RETRY_CODES = [
  'CHECKS_FAILED', 'SCOPE_VIOLATION', 'INFRASTRUCTURE', 'CLARIFICATION',
  'BUDGET_EXHAUSTED', 'CONTROLLED_INTERRUPTION_AFTER_RECOVERY', 'VISUAL_CORRECTION',
];
const MAX_RETRY_REASON_DETAIL_BYTES = 4096;
const RETRY_REASON_KEYS = Object.freeze(['code', 'detail']);

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isString = (v) => typeof v === 'string' && v.length > 0;
const LIMIT_KEYS = new Set([
  'max_ai_calls', 'max_duration_seconds', 'max_prompt_bytes',
  'max_total_prompt_bytes', 'max_rollovers',
]);

function operationKind(queue) {
  return String((queue && queue.operation_kind) || 'IMPLEMENT').toUpperCase();
}

/** Motif de reprise fermé, textuel et borné avant toute projection ou invocation. */
function validateRetryReason(value) {
  if (!isObject(value)) return 'objet structure attendu';
  const keys = Object.keys(value).sort();
  if (keys.length !== RETRY_REASON_KEYS.length ||
      RETRY_REASON_KEYS.some((key) => !keys.includes(key))) {
    return 'proprietes exactes attendues: ' + RETRY_REASON_KEYS.join(', ');
  }
  if (!RETRY_CODES.includes(value.code)) return 'code inconnu: ' + JSON.stringify(value.code);
  if (typeof value.detail !== 'string') return 'detail textuel attendu';
  if (value.detail.trim().length === 0) return 'detail textuel non vide attendu';
  const bytes = Buffer.byteLength(value.detail, 'utf8');
  if (bytes > MAX_RETRY_REASON_DETAIL_BYTES) {
    return 'detail hors limite: ' + bytes + ' octets (maximum ' + MAX_RETRY_REASON_DETAIL_BYTES + ')';
  }
  return null;
}

/** Preuve d'autorisation : objet structure, jamais chaine libre. */
function authorizationShape(fields, kinds) {
  return (value) => {
    if (!isObject(value)) return 'doit etre un objet structure, pas une chaine';
    for (const field of fields) {
      if (!isString(value[field])) return 'champ requis manquant ou vide: ' + field;
    }
    if (!kinds.includes(value.evidence_kind)) {
      return 'evidence_kind doit valoir ' + kinds.join(' ou ') + ' (recu: ' + JSON.stringify(value.evidence_kind) + ')';
    }
    return null;
  };
}

function validateDeliveryTarget(value, queue) {
  const kind = operationKind(queue);
  if (value === undefined) return kind === 'VISUAL_CORRECTION' ? 'cible EXISTING_PR requise en VISUAL_CORRECTION' : null;
  if (kind !== 'VISUAL_CORRECTION') return 'reserve a VISUAL_CORRECTION';
  if (!isObject(value)) return 'objet structure attendu';
  const keys = Object.keys(value).sort();
  const expected = ['application_head', 'application_pr', 'branch', 'kind'];
  if (keys.length !== expected.length || expected.some((key) => !keys.includes(key))) {
    return 'proprietes exactes attendues: ' + expected.join(', ');
  }
  if (value.kind !== 'EXISTING_PR') return 'kind doit valoir EXISTING_PR';
  if (!Number.isInteger(value.application_pr) || value.application_pr < 1) return 'application_pr entier >= 1 attendu';
  if (!SHA40.test(String(value.application_head || ''))) return 'application_head SHA-40 attendu';
  const branch = String(value.branch || '');
  if (!SAFE_BRANCH.test(branch) || branch.startsWith('/') || branch.endsWith('/') || branch.includes('..') || branch.includes('//')) {
    return 'branche Git canonique attendue';
  }
  return null;
}

function validateDeliveryCheckpoint(value, queue) {
  const kind = operationKind(queue);
  if (value === undefined) return kind === 'VISUAL_CORRECTION' ? 'checkpoint certifie requis en VISUAL_CORRECTION' : null;
  if (kind !== 'VISUAL_CORRECTION') return 'reserve a VISUAL_CORRECTION';
  if (!isObject(value)) return 'objet structure attendu';
  const target = queue.delivery_target;
  const required = [
    'checkpoint_ref', 'application_pr', 'application_head', 'protocol_head', 'delivery_head',
    'package_run_id', 'package_artifact_id', 'attestation_blob_oid', 'evidence_kind',
  ];
  for (const field of required) {
    if (value[field] === undefined || value[field] === null) return 'champ requis manquant: ' + field;
    // Un checkpoint publié après une VISUAL_CORRECTION peut légitimement ne
    // porter aucune attestation de migration : ce chemin matérialise un
    // recovery vide sur le HEAD applicatif et ne rejoue pas la migration
    // historique. L'attestation reste obligatoire dès qu'une
    // recovery_migration est effectivement fournie.
    if (field !== 'attestation_blob_oid' && value[field] === '') return 'champ requis manquant ou vide: ' + field;
  }
  if (!COMMENT_REF.test(String(value.checkpoint_ref))) return 'checkpoint_ref issue_comment:<id> attendu';
  if (!Number.isInteger(value.application_pr) || value.application_pr < 1) return 'application_pr entier >= 1 attendu';
  if (!SHA40.test(String(value.application_head))) return 'application_head SHA-40 attendu';
  if (!SHA40.test(String(value.protocol_head))) return 'protocol_head SHA-40 attendu';
  if (!SHA40.test(String(value.delivery_head))) return 'delivery_head SHA-40 attendu';
  if (!/^[1-9][0-9]*$/.test(String(value.package_run_id))) return 'package_run_id numerique attendu';
  if (!/^[1-9][0-9]*$/.test(String(value.package_artifact_id))) return 'package_artifact_id numerique attendu';
  const checkpointAttestation = String(value.attestation_blob_oid || '');
  if (checkpointAttestation && !SHA40.test(checkpointAttestation)) return 'attestation_blob_oid SHA-40 attendu';
  if (queue.recovery_migration) {
    const migrationAttestation = String(queue.recovery_migration.attestation_blob_oid || '');
    if (!checkpointAttestation) return 'attestation_blob_oid requis lorsque recovery_migration est present';
    if (checkpointAttestation.toLowerCase() !== migrationAttestation.toLowerCase()) {
      return 'attestation_blob_oid doit correspondre a recovery_migration';
    }
  }
  if (value.evidence_kind !== 'ORGANISATIONAL') return 'evidence_kind doit valoir ORGANISATIONAL';
  if (String(value.protocol_head).toLowerCase() !== String(queue.source_head || '').toLowerCase()) {
    return 'protocol_head doit etre egal a source_head';
  }
  if (!target || value.application_pr !== target.application_pr ||
      String(value.application_head).toLowerCase() !== String(target.application_head || '').toLowerCase()) {
    return 'checkpoint et cible EXISTING_PR incoherents';
  }
  if (String(value.delivery_head).toLowerCase() !== String(value.application_head).toLowerCase()) {
    return 'delivery_head doit etre egal au HEAD applicatif certifie avant correction';
  }
  return null;
}

const PROPERTIES = {
  schema_version: {
    nature: 'BEHAVIOUR', required: 'always', type: 'string',
    validate: (v) => (v === LEAN_REQUEST_SCHEMA ? null : 'attendu ' + LEAN_REQUEST_SCHEMA),
    diagnostic: 'KODJO_QUEUE_SCHEMA_REFUSED',
  },
  slice_id: {
    nature: 'BEHAVIOUR', required: 'always', type: 'string',
    validate: (v) => (SLICE_ID.test(String(v)) ? null : 'identifiant de tranche invalide'),
    diagnostic: 'KODJO_QUEUE_SLICE_ID_REFUSED',
  },
  issue_number: {
    nature: 'AUTHORIZATION', required: 'always', type: 'integer',
    validate: (v) => (Number.isInteger(v) && v >= 1 ? null : 'entier >= 1 attendu'),
    diagnostic: 'KODJO_QUEUE_ISSUE_NUMBER_REFUSED',
  },
  source_head: {
    nature: 'BEHAVIOUR', required: 'always', type: 'string',
    validate: (v) => (SHA40.test(String(v)) ? null : '40 caracteres hexadecimaux attendus'),
    diagnostic: 'KODJO_QUEUE_SOURCE_HEAD_REFUSED',
  },
  baseline_head: {
    nature: 'BEHAVIOUR', required: 'always', type: 'string',
    validate: (v) => (SHA40.test(String(v)) ? null : '40 caracteres hexadecimaux attendus'),
    diagnostic: 'KODJO_QUEUE_BASELINE_HEAD_REFUSED',
  },
  slice_bootstrap_file: {
    nature: 'BEHAVIOUR', required: 'always', type: 'string',
    validate: (v) => (isString(v) && !v.includes('..') ? null : 'chemin relatif interne attendu'),
    diagnostic: 'KODJO_QUEUE_BOOTSTRAP_FILE_REFUSED',
  },
  slice_bootstrap_sha256: {
    nature: 'AUTHORIZATION', required: 'always', type: 'string',
    validate: (v) => (SHA64.test(String(v)) ? null : '64 caracteres hexadecimaux attendus'),
    diagnostic: 'KODJO_QUEUE_BOOTSTRAP_HASH_REFUSED',
  },
  mode: {
    nature: 'BEHAVIOUR', required: 'always', type: 'string',
    validate: (v) => (MODES.includes(v) ? null : 'mode inconnu'),
    diagnostic: 'KODJO_QUEUE_MODE_REFUSED',
  },
  operation_kind: {
    nature: 'BEHAVIOUR', required: 'optional', type: 'string',
    validate: (v, q) => {
      if (v === undefined) return null;
      const kind = String(v).toUpperCase();
      if (!OPERATION_KINDS.includes(kind)) return 'operation_kind inconnu';
      if (kind === 'VISUAL_CORRECTION' && String(q.mode).toUpperCase() !== 'RESUME_DELTA') {
        return 'VISUAL_CORRECTION exige RESUME_DELTA';
      }
      return null;
    },
    diagnostic: 'KODJO_QUEUE_OPERATION_KIND_REFUSED',
  },
  delivery_target: {
    nature: 'BEHAVIOUR', required: 'optional', type: ['object', 'null'],
    validate: validateDeliveryTarget,
    diagnostic: 'KODJO_QUEUE_DELIVERY_TARGET_REFUSED',
  },
  session_id: {
    nature: 'BEHAVIOUR', required: 'always', type: ['string', 'null'],
    validate: (v, q) => {
      if (String(q.mode).toUpperCase() === 'INITIAL') return v === null ? null : 'doit etre null en INITIAL';
      return UUID.test(String(v || '')) ? null : 'UUID attendu en RESUME_DELTA';
    },
    diagnostic: 'KODJO_QUEUE_SESSION_ID_REFUSED',
  },
  prompt_file: {
    nature: 'BEHAVIOUR', required: 'always', type: 'string',
    validate: (v) => (isString(v) && !v.includes('..') ? null : 'chemin relatif interne attendu'),
    diagnostic: 'KODJO_QUEUE_PROMPT_FILE_REFUSED',
  },
  scope_allow: {
    nature: 'BEHAVIOUR', required: 'always', type: 'array',
    validate: (v) => {
      if (!Array.isArray(v) || v.length === 0) return 'liste non vide attendue';
      const bad = v.filter((s) => !isString(s) || s.includes('..') || s.startsWith('/') || s.includes('\\'));
      return bad.length ? 'chemins invalides: ' + bad.join(', ') : null;
    },
    diagnostic: 'KODJO_QUEUE_SCOPE_ALLOW_REFUSED',
  },
  checks: {
    nature: 'BEHAVIOUR', required: 'always', type: 'array',
    validate: (v) => {
      if (!Array.isArray(v) || v.length === 0) return 'liste non vide attendue';
      const bad = v.filter((c) => !CHECKS.includes(String(c).toLowerCase()));
      return bad.length ? 'controles inconnus: ' + bad.join(', ') : null;
    },
    diagnostic: 'KODJO_QUEUE_CHECKS_REFUSED',
  },
  limits: {
    nature: 'BEHAVIOUR', required: 'optional', type: 'object',
    validate: (v) => {
      if (v === undefined) return null;
      if (!isObject(v)) return 'objet attendu';
      if (Object.prototype.hasOwnProperty.call(v, 'max_turns')) {
        return 'max_turns est interdit : la limite relève de Claude et de l’abonnement';
      }
      const unknown = Object.keys(v).filter((key) => !LIMIT_KEYS.has(key));
      return unknown.length ? 'limites inconnues: ' + unknown.join(', ') : null;
    },
    diagnostic: 'KODJO_QUEUE_LIMITS_REFUSED',
  },
  allow_legacy_recovery_bootstrap: {
    nature: 'BEHAVIOUR', required: 'optional', type: 'boolean',
    validate: (v) => (v === undefined || typeof v === 'boolean' ? null : 'booleen strict attendu'),
    diagnostic: 'KODJO_QUEUE_LEGACY_RECOVERY_BOOTSTRAP_INVALID',
  },
  request_id: {
    nature: 'TRACEABILITY', required: 'always', type: 'string',
    validate: (v) => (UUID.test(String(v || '')) ? null : 'UUID attendu'),
    diagnostic: 'KODJO_QUEUE_REQUEST_ID_INVALID',
  },
  created_at: {
    nature: 'TRACEABILITY', required: 'always', type: 'string',
    validate: (v) => (isString(v) && !Number.isNaN(Date.parse(v)) ? null : 'date ISO 8601 attendue'),
    diagnostic: 'KODJO_QUEUE_CREATED_AT_INVALID',
  },
  authorized_plan: {
    nature: 'AUTHORIZATION', required: 'always', type: 'object',
    validate: authorizationShape(['plan_path', 'plan_blob_oid', 'approved_at_commit'], ['ARTIFACT_HASH']),
    diagnostic: 'KODJO_QUEUE_AUTHORIZED_PLAN_REFUSED',
  },
  independent_review: {
    nature: 'AUTHORIZATION', required: 'always', type: 'object',
    validate: authorizationShape(
      ['review_path', 'review_blob_oid', 'reviewed_plan_blob_oid', 'verdict'], ['ARTIFACT_HASH']),
    diagnostic: 'KODJO_QUEUE_INDEPENDENT_REVIEW_REFUSED',
  },
  user_gate: {
    nature: 'AUTHORIZATION', required: 'always', type: 'object',
    validate: authorizationShape(
      ['gate_ref', 'gated_reference', 'decision', 'user_login'], ['ORGANISATIONAL']),
    diagnostic: 'KODJO_QUEUE_USER_GATE_REFUSED',
  },
  delivery_checkpoint: {
    nature: 'AUTHORIZATION', required: 'optional', type: 'object',
    validate: validateDeliveryCheckpoint,
    diagnostic: 'KODJO_QUEUE_DELIVERY_CHECKPOINT_REFUSED',
  },
  recovery_migration: {
    nature: 'AUTHORIZATION', required: 'optional', type: 'object',
    validate: (value, queue) => {
      if (String(queue.mode).toUpperCase() !== 'RESUME_DELTA') return 'reserve a RESUME_DELTA';
      return authorizationShape(
        ['attestation_path', 'attestation_blob_oid'], ['ARTIFACT_HASH'])(value);
    },
    diagnostic: 'KODJO_QUEUE_RECOVERY_MIGRATION_REFUSED',
  },
  initial_restart: {
    nature: 'BEHAVIOUR', required: 'optional', type: 'object',
    validate: (v, q) => require('./initial-restart').shape(v, q),
    diagnostic: 'KODJO_QUEUE_INITIAL_RESTART_INVALID',
  },
  retry_of_run_id: {
    nature: 'BEHAVIOUR', required: 'resume_only', type: 'string',
    validate: (v, q) => {
      if (String(q.mode).toUpperCase() !== 'RESUME_DELTA') return v === undefined ? null : 'reserve a RESUME_DELTA';
      return /^[0-9]+$/.test(String(v || '')) ? null : 'identifiant de run source attendu';
    },
    diagnostic: 'KODJO_QUEUE_RETRY_SOURCE_MISSING',
  },
  retry_reason: {
    nature: 'TRACEABILITY', required: 'resume_only', type: 'object',
    validate: (v, q) => {
      if (String(q.mode).toUpperCase() !== 'RESUME_DELTA') return v === undefined ? null : 'reserve a RESUME_DELTA';
      const detail = validateRetryReason(v);
      if (detail) return detail;
      if (operationKind(q) === 'VISUAL_CORRECTION' && v.code !== 'VISUAL_CORRECTION') {
        return 'VISUAL_CORRECTION exige retry_reason.code=VISUAL_CORRECTION';
      }
      return null;
    },
    diagnostic: 'KODJO_QUEUE_RETRY_REASON_INVALID',
  },
};

function propertiesOfNature(nature) {
  return Object.keys(PROPERTIES).filter((name) => PROPERTIES[name].nature === nature).sort();
}

function validateQueueRequest(queue) {
  if (!isObject(queue)) return [{ property: null, diagnostic: 'KODJO_QUEUE_INVALID', detail: 'objet attendu' }];
  const errors = [];
  const mode = String(queue.mode || '').toUpperCase();

  for (const name of Object.keys(queue)) {
    if (!PROPERTIES[name]) {
      errors.push({ property: name, diagnostic: 'KODJO_QUEUE_UNKNOWN_PROPERTY', detail: 'propriete inconnue' });
    }
  }
  for (const [name, spec] of Object.entries(PROPERTIES)) {
    const present = Object.prototype.hasOwnProperty.call(queue, name);
    const mandatory = spec.required === 'always' ||
      (spec.required === 'resume_only' && mode === 'RESUME_DELTA');
    if (!present) {
      if (mandatory) errors.push({ property: name, diagnostic: spec.diagnostic, detail: 'propriete requise absente' });
      if (!mandatory && (name === 'delivery_target' || name === 'delivery_checkpoint')) {
        const detail = spec.validate(undefined, queue);
        if (detail) errors.push({ property: name, diagnostic: spec.diagnostic, detail });
      }
      continue;
    }
    const detail = spec.validate(queue[name], queue);
    if (detail) errors.push({ property: name, diagnostic: spec.diagnostic, detail });
  }
  return errors;
}

module.exports = {
  PROPERTIES, LEAN_REQUEST_SCHEMA, CHECKS, MODES, OPERATION_KINDS, RETRY_CODES, LIMIT_KEYS,
  MAX_RETRY_REASON_DETAIL_BYTES, RETRY_REASON_KEYS,
  operationKind, validateDeliveryTarget, validateDeliveryCheckpoint,
  propertiesOfNature, validateRetryReason, validateQueueRequest,
};
