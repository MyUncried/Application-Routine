#!/usr/bin/env node
'use strict';

/**
 * Admission d'une demande de file — KV2-10.
 *
 * L'audit du 2026-09-10 a etabli qu'aucune protection anti-rejeu n'existait : le
 * seul obstacle a une seconde execution etait une collision fortuite de nom de
 * branche. Une relance de workflow reinvoquait Claude avec `--resume`, ce qui
 * violait `max_ai_calls: 1` a l'echelle de la session.
 *
 * La protection retenue ne repose sur AUCUN etat local : elle se lit dans Git et
 * dans les variables du job. Une reinstallation du runner ne l'affaiblit pas, et
 * aucune purge n'est jamais demandee a l'utilisateur.
 *
 *   AR-1  Le repertoire de file est strictement en ajout. Toute entree dont le
 *         statut n'est pas `A` — modification, suppression, renommage, copie —
 *         est refusee : un ancien fichier ne peut donc pas etre rejoue.
 *   AR-2  `request_id` est unique dans l'arbre : un contenu identique ne peut pas
 *         etre reintroduit sous un autre nom de fichier.
 *   AR-3  Une relance de workflow ne reinvoque jamais Claude.
 *   AR-4  Une reprise legitime est une NOUVELLE demande, portant un nouveau
 *         `request_id` et `retry_of_run_id`. Regle de composition, verifiee ici
 *         pour les seuls champs presents.
 *
 * Limite assumee : le protocole ne peut pas distinguer techniquement une reprise
 * abusive composee par un acteur habilite d'une reprise legitime. Il peut
 * seulement exiger qu'elle soit declaree.
 *
 * Usage : node scripts/kodjo/verify-queue-admission.js <before> <after>
 * Sortie standard : le chemin de l'unique demande admise.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { validateQueueRequest } = require('./lib/queue-contract');
const { verify: verifyAuthorizations } = require('./verify-authorizations');

const QUEUE_DIR = '.github/orchestration/queue/v2';
const CONSUMED_REGISTRY = '.github/orchestration/queue/v2-consumed-registry.json';
const NULL_SHA = '0'.repeat(40);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, shell: false, maxBuffer: 64 * 1024 * 1024 });
  if (r.error || r.status !== 0) {
    throw new Error('GIT_READ_FAILED: git ' + args.join(' ') + ': ' + (r.error ? r.error.message : r.stderr));
  }
  return String(r.stdout);
}

/** Entrees `<statut>\0<chemin>` du repertoire de file entre deux revisions. */
function queueChanges(before, after, cwd) {
  const usable = before && before !== NULL_SHA;
  const raw = usable
    ? git(['diff', '--name-status', '-z', before, after, '--', QUEUE_DIR], cwd)
    : git(['show', '--name-status', '-z', '--format=', after, '--', QUEUE_DIR], cwd);
  const records = raw.split('\0').filter((r) => r.length > 0);
  const out = [];
  for (let i = 0; i < records.length; i += 1) {
    const status = records[i];
    // Un renommage ou une copie occupe trois enregistrements : statut, origine,
    // destination. On les conserve tels quels pour pouvoir les refuser.
    if (/^[RC]/.test(status)) {
      out.push({ status: status[0], path: records[i + 2], origPath: records[i + 1] });
      i += 2;
    } else {
      out.push({ status: status[0], path: records[i + 1], origPath: null });
      i += 1;
    }
  }
  return out.filter((entry) => entry.path && entry.path.endsWith('.json'));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

/**
 * Registre des demandes definitivement non rejouables.
 *
 * L'obsolescence est enregistree HORS de la demande : les fichiers historiques
 * restent a l'octet pres tels qu'ils ont ete commites. Une entree lie un chemin
 * ET son blob OID, de sorte que renommer le fichier ou recopier son contenu
 * ailleurs ne le rend pas rejouable.
 */
function consumedRegistry(cwd) {
  const file = path.resolve(cwd, CONSUMED_REGISTRY);
  if (!fs.existsSync(file)) return { entries: [] };
  const registry = readJson(file);
  return { entries: Array.isArray(registry.entries) ? registry.entries : [] };
}

/** Blob OID Git du fichier, calcule comme le ferait le depot. */
function blobOid(file, cwd) {
  const r = spawnSync('git', ['hash-object', '--', file], { cwd, encoding: 'utf8', windowsHide: true, shell: false });
  if (r.error || r.status !== 0) throw new Error('GIT_READ_FAILED: git hash-object ' + file);
  return String(r.stdout).trim();
}

function admit(options) {
  const cwd = options.cwd || process.cwd();
  const attempt = Number(options.runAttempt || 1);

  // AR-3 — avant toute lecture de Git : une relance ne reinvoque jamais Claude.
  if (Number.isFinite(attempt) && attempt > 1) {
    throw new Error('KODJO_QUEUE_RERUN_REFUSED: tentative ' + attempt +
      '. Une reprise legitime est une nouvelle demande portant un nouveau request_id.');
  }

  const changes = queueChanges(options.before, options.after, cwd);

  // AR-1 — ajout seul.
  const mutations = changes.filter((entry) => entry.status !== 'A');
  if (mutations.length > 0) {
    throw new Error('KODJO_QUEUE_MUTATION_REFUSED: ' +
      mutations.map((m) => m.status + ' ' + (m.origPath ? m.origPath + ' -> ' : '') + m.path).join(', '));
  }

  const added = changes.filter((entry) => entry.status === 'A');
  if (added.length !== 1) {
    throw new Error('KODJO_QUEUE_CARDINALITY_REFUSED: ' + added.length +
      (added.length ? ' — demandes non traitees : ' + added.map((a) => a.path).join(', ') : ''));
  }
  const selected = added[0].path;

  // Obsolescence : refus par chemin OU par contenu, avant toute autre lecture.
  const registry = consumedRegistry(cwd);
  const selectedOid = blobOid(selected, cwd);
  const consumed = registry.entries.find(
    (entry) => entry && (entry.path === selected || entry.blob_oid === selectedOid)
  );
  if (consumed) {
    throw new Error('KODJO_QUEUE_CONSUMED_REFUSED: ' + selected +
      ' (' + (consumed.status || 'CONSUMED') + ') — ' + (consumed.reason || 'demande obsolete'));
  }

  const queue = readJson(path.resolve(cwd, selected));

  // KV2-23 : contrat unique, proprietes connues seulement, avant toute mutation.
  const violations = validateQueueRequest(queue);
  if (violations.length > 0) {
    throw new Error('KODJO_QUEUE_CONTRACT_REFUSED: ' +
      violations.map((v) => v.diagnostic + '(' + v.property + '): ' + v.detail).join(' | '));
  }

  const requestId = String(queue.request_id || '');
  if (!UUID.test(requestId)) {
    throw new Error('KODJO_QUEUE_REQUEST_ID_INVALID: ' + (requestId || '<absent>'));
  }

  // AR-2 — unicite dans l'arbre, lue dans Git : aucune dependance a un etat local.
  const queueRoot = path.resolve(cwd, QUEUE_DIR);
  const duplicates = [];
  if (fs.existsSync(queueRoot)) {
    for (const name of fs.readdirSync(queueRoot).sort()) {
      if (!name.endsWith('.json')) continue;
      const candidate = path.join(QUEUE_DIR, name).replace(/\\/g, '/');
      let other;
      try { other = readJson(path.resolve(cwd, candidate)); } catch (_) { continue; }
      if (String(other.request_id || '') === requestId) duplicates.push(candidate);
    }
  }
  if (duplicates.length !== 1) {
    throw new Error('KODJO_QUEUE_REQUEST_ID_DUPLICATE: ' + requestId + ' — ' + duplicates.join(', '));
  }

  // AR-4 — une reprise se declare.
  if (String(queue.mode || '').toUpperCase() === 'RESUME_DELTA') {
    if (!queue.retry_of_run_id) throw new Error('KODJO_QUEUE_RETRY_SOURCE_MISSING');
    if (!queue.retry_reason || typeof queue.retry_reason !== 'object' || !queue.retry_reason.code) {
      throw new Error('KODJO_QUEUE_RETRY_REASON_INVALID');
    }
  }

  // Lorsqu'un checkpoint est fourni, ses références sont contrôlées avant Claude.\n  if (String(queue.mode || '').toUpperCase() === 'RESUME_DELTA' && queue.delivery_checkpoint) {\n    const cp = queue.recovery_migration && queue.recovery_migration.delivery_checkpoint;\n    if (String(cp.protocol_head).toLowerCase() !== String(queue.source_head).toLowerCase()) {\n      fail('KODJO_QUEUE_DELIVERY_CHECKPOINT_PROTOCOL_HEAD_MISMATCH');\n    }\n    if (String(cp.delivery_head).toLowerCase() !== String(cp.application_head).toLowerCase()) {\n      fail('KODJO_QUEUE_DELIVERY_CHECKPOINT_DELIVERY_HEAD_MISMATCH');\n    }\n  }\n\n  // KV2-22 : coherence des autorisations, egalement avant toute mutation.
  if (options.verifyAuthorizations !== false) {
    verifyAuthorizations(selected, { cwd });
  }

  return { selected, request_id: requestId };
}

if (require.main === module) {
  try {
    const [before, after] = process.argv.slice(2);
    const result = admit({
      before, after,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT,
      cwd: process.cwd(),
    });
    process.stdout.write(result.selected + '\n');
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { admit, queueChanges, consumedRegistry, blobOid, QUEUE_DIR, CONSUMED_REGISTRY };
