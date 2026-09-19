#!/usr/bin/env node
'use strict';

/**
 * Admission d'une demande de file — KV2-10.
 *
 * Protection anti-rejeu et validation des autorisations avant toute mutation.
 * Une correction visuelle d'une PR existante ajoute une preuve supplémentaire :
 * le checkpoint de livraison doit être relu sur GitHub et correspondre exactement
 * à la cible applicative avant toute invocation Claude.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { validateQueueRequest } = require('./lib/queue-contract');
const { verify: verifyAuthorizations } = require('./verify-authorizations');
const { verify: verifyVisualCheckpoint } = require('./verify-visual-checkpoint');

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

function queueChanges(before, after, cwd) {
  const usable = before && before !== NULL_SHA;
  const raw = usable
    ? git(['diff', '--name-status', '-z', before, after, '--', QUEUE_DIR], cwd)
    : git(['show', '--name-status', '-z', '--format=', after, '--', QUEUE_DIR], cwd);
  const records = raw.split('\0').filter((r) => r.length > 0);
  const out = [];
  for (let i = 0; i < records.length; i += 1) {
    const status = records[i];
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

function consumedRegistry(cwd) {
  const file = path.resolve(cwd, CONSUMED_REGISTRY);
  if (!fs.existsSync(file)) return { entries: [] };
  const registry = readJson(file);
  return { entries: Array.isArray(registry.entries) ? registry.entries : [] };
}

function blobOid(file, cwd) {
  const r = spawnSync('git', ['hash-object', '--', file], { cwd, encoding: 'utf8', windowsHide: true, shell: false });
  if (r.error || r.status !== 0) throw new Error('GIT_READ_FAILED: git hash-object ' + file);
  return String(r.stdout).trim();
}

function admit(options) {
  const cwd = options.cwd || process.cwd();
  const attempt = Number(options.runAttempt || 1);

  if (Number.isFinite(attempt) && attempt > 1) {
    throw new Error('KODJO_QUEUE_RERUN_REFUSED: tentative ' + attempt +
      '. Une reprise legitime est une nouvelle demande portant un nouveau request_id.');
  }

  const changes = queueChanges(options.before, options.after, cwd);
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
  const violations = validateQueueRequest(queue);
  if (!options.selectionOnly && violations.length > 0) {
    throw new Error('KODJO_QUEUE_CONTRACT_REFUSED: ' +
      violations.map((v) => v.diagnostic + '(' + v.property + '): ' + v.detail).join(' | '));
  }

  const requestId = String(queue.request_id || '');
  if (!UUID.test(requestId)) {
    throw new Error('KODJO_QUEUE_REQUEST_ID_INVALID: ' + (requestId || '<absent>'));
  }

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

  // Production selection stops here; the aggregate preflight retains all contract,
  // authorization and checkpoint checks before any runner mutation.
  if (options.selectionOnly) return { selected, request_id: requestId };

  if (String(queue.mode || '').toUpperCase() === 'RESUME_DELTA') {
    if (!queue.retry_of_run_id) throw new Error('KODJO_QUEUE_RETRY_SOURCE_MISSING');
    if (!queue.retry_reason || typeof queue.retry_reason !== 'object' || !queue.retry_reason.code) {
      throw new Error('KODJO_QUEUE_RETRY_REASON_INVALID');
    }
  }

  // La route VISUAL_CORRECTION était auparavant du code mort : le contrôle de
  // checkpoint avait été inséré sous forme de texte échappé et ne s'exécutait
  // jamais. La preuve est désormais relue sur GitHub, avant les autorisations et
  // avant toute opération mutable du superviseur.
  if (String(queue.operation_kind || 'IMPLEMENT').toUpperCase() === 'VISUAL_CORRECTION' &&
      options.verifyVisualCheckpoint !== false) {
    verifyVisualCheckpoint(selected, { cwd });
  }

  if (options.verifyAuthorizations !== false) {
    verifyAuthorizations(selected, { cwd });
  }

  return { selected, request_id: requestId };
}

if (require.main === module) {
  try {
    const [before, after, selectionMode] = process.argv.slice(2);
    if (selectionMode && selectionMode !== '--selection-only') throw new Error('KODJO_QUEUE_SELECTION_MODE_INVALID');
    const result = admit({
      before, after, selectionOnly: selectionMode === '--selection-only',
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
