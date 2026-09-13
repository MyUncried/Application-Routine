'use strict';

/**
 * Contrat de la demande de file — KV2-23, structurel KV2-01.
 *
 * Il existait TROIS definitions independantes du contrat : cinq controles dans
 * `run-queued-request.ps1`, la projection de `lib/queue-request.js`, et
 * `normalizeRequest`. Aucune n'etait derivee des autres, et rien ne detectait
 * qu'un champ ajoute a la file n'etait consomme nulle part. C'est ainsi que
 * `allow_legacy_recovery_bootstrap` a pu disparaitre silencieusement.
 *
 * Ce module est la SOURCE UNIQUE. Le fichier JSON Schema publie en est une
 * projection, regeneree et comparee par un test : les deux ne peuvent pas
 * diverger sans faire echouer la suite.
 *
 * `nature` classe chaque propriete :
 *   AUTHORIZATION — conditionne le droit d'executer ; consommee a la selection
 *   BEHAVIOUR     — gouverne l'execution ; DOIT etre transmise au superviseur
 *   TRACEABILITY  — journal et diagnostic ; consommee a la selection
 */

const SHA40 = /^[0-9a-f]{40}$/;
const SHA64 = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLICE_ID = /^[A-Za-z0-9._-]{1,80}$/;

const LEAN_REQUEST_SCHEMA = 'kodjo.protocol.v2.lean-request.0.6.13';
const CHECKS = ['jest', 'typescript', 'lint'];
const MODES = ['INITIAL', 'RESUME_DELTA'];
const RETRY_CODES = ['CHECKS_FAILED', 'SCOPE_VIOLATION', 'INFRASTRUCTURE', 'CLARIFICATION', 'BUDGET_EXHAUSTED', 'CONTROLLED_INTERRUPTION_AFTER_RECOVERY'];
const MAX_RETRY_REASON_DETAIL_BYTES = 4096;
const RETRY_REASON_KEYS = Object.freeze(['code', 'detail']);

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isString = (v) => typeof v === 'string' && v.length > 0;
const LIMIT_KEYS = new Set([
  'max_ai_calls', 'max_duration_seconds', 'max_prompt_bytes',
  'max_total_prompt_bytes', 'max_rollovers',
]);

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
    // La revue est un ARTEFACT VERSIONNE, pas une reference opaque : le fichier
    // `independent-review.md` et son empreinte Git suffisent a prouver quelle
    // version du plan a ete revue. Aucun systeme de preuve supplementaire.
    validate: authorizationShape(
      ['review_path', 'review_blob_oid', 'reviewed_plan_blob_oid', 'verdict'], ['ARTIFACT_HASH']),
    diagnostic: 'KODJO_QUEUE_INDEPENDENT_REVIEW_REFUSED',
  },
  user_gate: {
    nature: 'AUTHORIZATION', required: 'always', type: 'object',
    // L'utilisateur n'execute aucune commande. Sa validation est un pouce leve
    // sur un commentaire determine de l'Issue, relie au hash du plan ou au HEAD
    // exact. C'est une preuve ORGANISATIONNELLE : elle atteste une decision
    // enregistree, non une independance cryptographique des acteurs.
    // `user_login` est obligatoire : un pouce leve anonyme, ou pose par un autre
    // compte, ne vaut pas validation.
    validate: authorizationShape(
      ['gate_ref', 'gated_reference', 'decision', 'user_login'], ['ORGANISATIONAL']),
    diagnostic: 'KODJO_QUEUE_USER_GATE_REFUSED',
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
      return validateRetryReason(v);
    },
    diagnostic: 'KODJO_QUEUE_RETRY_REASON_INVALID',
  },
};

/** Proprietes d'une nature donnee. */
function propertiesOfNature(nature) {
  return Object.keys(PROPERTIES).filter((name) => PROPERTIES[name].nature === nature).sort();
}

/** Valide une demande. Retourne la liste des refus, vide si conforme. */
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
      continue;
    }
    const detail = spec.validate(queue[name], queue);
    if (detail) errors.push({ property: name, diagnostic: spec.diagnostic, detail });
  }
  return errors;
}

module.exports = {
  PROPERTIES, LEAN_REQUEST_SCHEMA, CHECKS, MODES, RETRY_CODES, LIMIT_KEYS,
  MAX_RETRY_REASON_DETAIL_BYTES, RETRY_REASON_KEYS,
  propertiesOfNature, validateRetryReason, validateQueueRequest,
};
