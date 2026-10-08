#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const GitIntegrity = require('./lib/git-runtime-integrity');
const { acquire: acquireExecutionLock, release: releaseExecutionLock } = require('./lib/execution-lock');
const { initialize: initializeRunDiagnostic } = require('./initialize-run-diagnostic');
const { consumeLiveToken, verifyLiveTarget } = require('./verify-preflight-live-target');
const { verifyLocalFreshness } = require('./lib/preflight-freshness');
const Source = require('./lib/preflight-source');
const { normalizeScopeCandidate, normalizeScopeRule, inScope } = require('./lib/scope-path');
const { certifyRecoverySourceMigration } = require('./lib/recovery-migration');

// Keep checks attached to the implementing session until their result is read.
const CLAUDE_FOREGROUND_CHECK_ENV = Object.freeze({
  CLAUDE_CODE_DISABLE_BACKGROUND_TASKS: '1',
  BASH_DEFAULT_TIMEOUT_MS: '900000',
  BASH_MAX_TIMEOUT_MS: '900000',
});
function claudeEnvironment(inherited, request) {
  const env = { ...inherited, KODJO_MUTATION_SCOPE_JSON: JSON.stringify(request.scope_allow), ...CLAUDE_FOREGROUND_CHECK_ENV };
  delete env.KODJO_VNEXT_PLAN_READ_JSON;
  return env;
}
function claudeSettings() {
  return { disableAllHooks: true, env: { ...CLAUDE_FOREGROUND_CHECK_ENV } };
}

const { runCheck } = require('./lib/checks');
const {
  CLAUDE_CODE_VERSION, adapterConfig, adapterConfigHash, normalizeRequest, resolveClaudeBinary,
  buildPrompt, buildArgs, classifyClaudeFailure, sha256, redact, TURN_LIMIT_POLICY,
} = require('./lib/claude-local');

// Non-interactive runs end when the model ends its turn: a long check (the full jest suite)
// auto-moved to the background was never observed (PRE-1 runs 36924289392, 36925812691,
// 36929974315). Keep every check in the foreground with a timeout above its duration.


function die(code, message) {
  process.stderr.write('[KODJO_V2] ' + code + ': ' + message + '\n');
  return 1;
}

function command(bin, args, cwd, env, timeout) {
  if (bin === 'git') args = GitIntegrity.safeArgs(args);
  return spawnSync(bin, args, {
    cwd, env, encoding: 'utf8', windowsHide: true, shell: false,
    timeout, maxBuffer: 64 * 1024 * 1024,
  });
}

function git(args, cwd) {
  const r = command('git', args, cwd, process.env, 60000);
  if (r.error || r.status !== 0) throw new Error('GIT_READ_FAILED: ' + (r.error ? r.error.message : r.stderr));
  return String(r.stdout).trimEnd();
}

function refs(cwd) {
  return git(['for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads', 'refs/tags'], cwd);
}

const IMPLEMENTATION_STOP_STATUSES = new Set([
  'CHANGE_REQUEST_REQUIRED',
  'SCOPE_EXPANSION_REQUIRED',
  'NATIVE_PRIMITIVE_EXCEPTION_REQUIRED',
  'CLARIFICATION_REQUIRED',
]);

function extractClaudeResultText(stdout) {
  const raw = String(stdout || '').trim();
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.result === 'string') return parsed.result;
    if (parsed && parsed.type === 'result' && typeof parsed.result === 'string') return parsed.result;
  } catch (_) {
    // Sortie non JSON : conserver le texte brut pour diagnostic.
  }
  return raw;
}

function extractImplementationStopStatus(stdout) {
  const text = extractClaudeResultText(stdout).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const matches = [...text.matchAll(/^KODJO_STOP_STATUS:\s*([A-Z_]+)\s*$/gm)].map((m) => m[1]);
  if (matches.length === 0) return null;
  if (matches.length !== 1) throw new Error('IMPLEMENTATION_STOP_STATUS_DUPLICATE');
  if (matches[0] === 'NONE') return null;
  if (!IMPLEMENTATION_STOP_STATUSES.has(matches[0])) {
    throw new Error('IMPLEMENTATION_STOP_STATUS_INVALID: ' + matches[0]);
  }
  return matches[0];
}

/**
 * Delta du depot, analyse sans ambiguite — KV2-02.
 *
 * `--porcelain=v1` rendait un renommage sur une seule ligne `origine -> destination`
 * et echappait en octal tout chemin non ASCII : le chemin composite passait le
 * controle de perimetre et le chemin echappe n'etait jamais retrouve sur disque.
 *
 * `--porcelain=v2 -z` livre les chemins verbatim et separe les enregistrements par
 * NUL. Un renommage ou une copie occupe DEUX enregistrements : d'abord la ligne de
 * type `2` portant la DESTINATION, puis un enregistrement contenant la seule ORIGINE.
 */
function gitRaw(args, cwd) {
  const r = command('git', args, cwd, process.env, 60000);
  if (r.error || r.status !== 0) throw new Error('GIT_READ_FAILED: ' + (r.error ? r.error.message : r.stderr));
  return String(r.stdout);
}

function changedEntries(cwd) {
  const raw = gitRaw(['status', '--porcelain=v2', '-z', '--untracked-files=all'], cwd);
  const records = raw.split('\0').filter((r) => r.length > 0);
  const entries = [];
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    const kind = record[0];
    if (kind === '1') {
      // 1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>
      entries.push({ kind: 'CHANGED', xy: record.slice(2, 4), path: fieldAfter(record, 8), origPath: null });
    } else if (kind === '2') {
      // 2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <X><score> <path>  puis  <origPath>
      const dest = fieldAfter(record, 9);
      const orig = records[i + 1];
      if (orig === undefined) throw new Error('GIT_STATUS_RENAME_RECORD_TRUNCATED: ' + record);
      i += 1;
      entries.push({ kind: 'RENAMED', xy: record.slice(2, 4), path: dest, origPath: orig });
    } else if (kind === 'u') {
      entries.push({ kind: 'UNMERGED', xy: record.slice(2, 4), path: fieldAfter(record, 10), origPath: null });
    } else if (kind === '?') {
      entries.push({ kind: 'UNTRACKED', xy: '??', path: record.slice(2), origPath: null });
    } else if (kind === '#' || kind === '!') {
      continue;
    } else {
      throw new Error('GIT_STATUS_RECORD_UNKNOWN: ' + record);
    }
  }
  return entries;
}

/** Retourne tout ce qui suit les `count` premiers champs separes par une espace. */
function fieldAfter(record, count) {
  let index = 0;
  for (let n = 0; n < count; n += 1) {
    index = record.indexOf(' ', index);
    if (index < 0) throw new Error('GIT_STATUS_RECORD_MALFORMED: ' + record);
    index += 1;
  }
  return record.slice(index);
}

/** Tous les chemins touches, origine ET destination d'un renommage. */
function entryPaths(entries) {
  const out = [];
  for (const entry of entries) {
    out.push(entry.path);
    if (entry.origPath) out.push(entry.origPath);
  }
  return [...new Set(out)];
}

/**
 * Dépose le plan autorisé dans l'arbre de travail (Read est confiné à ce répertoire en mode --restricted), en lecture
 * seule et exclu de Git par .git/info/exclude : ni les contrôles de périmètre ni la publication ne le voient.
 */
function materializeAuthorizedPlan(repoRoot, buffer) {
  const { AUTHORIZED_PLAN_DIR, authorizedPlanPath } = require('./lib/claude-local');
  const exclude = path.resolve(repoRoot, gitRaw(['rev-parse', '--git-path', 'info/exclude'], repoRoot).trim());
  fs.mkdirSync(path.dirname(exclude), { recursive: true });
  const rule = '/' + AUTHORIZED_PLAN_DIR + '/';
  const current = fs.existsSync(exclude) ? fs.readFileSync(exclude, 'utf8') : '';
  if (!current.split(/\r?\n/).includes(rule)) fs.appendFileSync(exclude, (current && !current.endsWith('\n') ? '\n' : '') + rule + '\n', 'utf8');
  const file = path.join(repoRoot, authorizedPlanPath());
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) { fs.chmodSync(file, 0o600); fs.rmSync(file); }
  fs.writeFileSync(file, buffer, { mode: 0o400 });
  fs.chmodSync(file, 0o400);
  return file;
}

function changedFiles(cwd) {
  return entryPaths(changedEntries(cwd));
}

/**
 * Le périmètre de reprise est porté par le paquet immuable, pas par la mission
 * corrective. Il reste une liste de chemins exacts : aucun motif et aucune
 * normalisation permissive ne sont acceptés.
 */
function exactRecoveryPaths(paths) {
  if (!Array.isArray(paths)) throw new Error('RECOVERY_PATHS_INVALID');
  const normalized = paths.map((file) => normalizeScopeCandidate(file));
  if (normalized.some((file) => !file)) throw new Error('RECOVERY_PATH_INVALID');
  if (new Set(normalized).size !== normalized.length) throw new Error('RECOVERY_PATH_DUPLICATE');
  return normalized.sort();
}

function inCumulativeScope(file, request) {
  const normalized = normalizeScopeCandidate(file);
  return Boolean(normalized) && (
    inScope(normalized, request.scope_allow) ||
    new Set(request.recovery_paths || []).has(normalized)
  );
}

/** Chemins effectivement modifies depuis l'etat restaure, avant Claude. */
function mutationPathsSinceRestore(beforePaths, beforeFingerprint, afterPaths, afterFingerprint) {
  const before = new Set(beforePaths);
  const after = new Set(afterPaths);
  const union = [...new Set([...before, ...after])].sort();
  return union.filter((file) => {
    if (!before.has(file) || !after.has(file)) return true;
    return beforeFingerprint[file] !== afterFingerprint[file];
  });
}

function patchPathsFromNumstat(raw) {
  if (!raw) return [];
  const paths = raw.split('\0').filter(Boolean).map((record) => {
    const first = record.indexOf('\t');
    const second = record.indexOf('\t', first + 1);
    if (first < 0 || second < 0) throw new Error('RECOVERY_PATCH_PATHS_UNREADABLE');
    return record.slice(second + 1);
  });
  return exactRecoveryPaths(paths);
}

const RECOVERY_SCHEMA = 'kodjo.protocol.v2.local-recovery.0.6.16';
const LEGACY_MARKER_SCHEMA = 'kodjo.protocol.v2.legacy-recovery-bootstrap.0.6.16';

/** Empreinte de charge utile : detecte une ecriture partielle ou une alteration. */
function payloadDigest(payload) {
  const copy = { ...payload };
  delete copy.payload_sha256;
  return sha256(JSON.stringify(copy));
}

function recoveryPayload(repoRoot, request, files, meta) {
  const entries = [...new Set(files)].sort().filter((file) => inCumulativeScope(file, request)).map((file) => {
    const normalized = file.replace(/\\/g, '/');
    const absolute = path.resolve(repoRoot, normalized);
    if (!absolute.startsWith(repoRoot + path.sep)) throw new Error('RECOVERY_PATH_INVALID: ' + normalized);
    // KV2-15 : `statSync` suit les liens. Un lien dans le perimetre capturait le
    // contenu d'un fichier hors depot, et la restauration ecrivait hors depot.
    if (!fs.existsSync(absolute)) return { path: normalized, deleted: true };
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error('RECOVERY_NOT_A_REGULAR_FILE: ' + normalized);
    if (!stat.isFile()) throw new Error('RECOVERY_NOT_A_REGULAR_FILE: ' + normalized);
    const content = fs.readFileSync(absolute);
    return { path: normalized, deleted: false, sha256: sha256(content), content_base64: content.toString('base64') };
  });
  const payload = {
    schema_version: RECOVERY_SCHEMA,
    slice_id: request.slice_id,
    session_id: request.generated_session_id,
    baseline_head: request.baseline_head,
    // KV2-05 : sans cette cle, un paquet capte sur une autre revision etait
    // restaure tel quel et ecrasait silencieusement une evolution amont.
    source_head: request.source_head,
    run_id: (meta && meta.runId) || null,
    request_id: request.request_id,
    // KV2-06 : un delta calcule sur une base mutee est conserve pour diagnostic,
    // mais ne doit jamais servir de source de reprise.
    integrity_status: (meta && meta.integrityStatus) || 'INTACT',
    created_at: new Date().toISOString(),
    entries,
  };
  payload.payload_sha256 = payloadDigest(payload);
  return payload;
}

/**
 * Liste NUL des chemins publiables — KV2-02, KV2-07.
 *
 * `git add --all` publiait tout l'arbre. Le superviseur ecrit desormais la liste
 * exacte des chemins valides apres les controles ; la publication s'y limite via
 * `--pathspec-from-file --pathspec-file-nul`. Aucune ligne de commande n'est
 * construite par concatenation de chemins.
 */
function writePublishablePathspec(paths) {
  const target = (process.env.KODJO_PUBLISH_PATHSPEC_FILE || '').trim();
  if (!target) {
    if (process.env.KODJO_SUPERVISED_QUEUE === '1' && process.env.GITHUB_ACTIONS === 'true') {
      throw new Error('SUPERVISED_PUBLISH_PATHSPEC_TARGET_MISSING');
    }
    return null;
  }
  // Reserve 1 de la revue du lot 1 : un pathspec est un motif, pas un chemin.
  // `src/glob*.ts` capturait `src/globVOISIN.ts`, non autorise. La magie
  // `:(literal)` impose une correspondance exacte, caractere par caractere.
  const literal = paths.map((p) => ':(literal)' + p);
  const temporary = target + '.tmp';
  fs.writeFileSync(temporary, literal.join('\0') + (literal.length ? '\0' : ''), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporary, target);
  return target;
}

/**
 * Empreinte du delta — reserve 2 de la revue du lot 1.
 *
 * Comparer les seuls ensembles de chemins ne detectait qu'une APPARITION. Un
 * check qui modifie ou supprime un fichier deja present laissait l'ensemble
 * inchange et passait inapercu. On empreinte donc le contenu de chaque chemin.
 */
function deltaFingerprint(repoRoot, paths) {
  const out = {};
  for (const file of [...new Set(paths)].sort()) {
    const absolute = path.resolve(repoRoot, file);
    if (!fs.existsSync(absolute)) { out[file] = 'ABSENT'; continue; }
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) { out[file] = 'SYMLINK'; continue; }
    if (!stat.isFile()) { out[file] = 'NOT_A_REGULAR_FILE'; continue; }
    out[file] = sha256(fs.readFileSync(absolute));
  }
  return out;
}

/** Ecarts entre deux empreintes, nommes par nature. */
function fingerprintDrift(before, after) {
  const drift = [];
  for (const file of Object.keys(before)) {
    if (!(file in after)) drift.push('DISPARU:' + file);
    else if (after[file] !== before[file]) {
      drift.push((after[file] === 'ABSENT' ? 'SUPPRIME:' : 'MODIFIE:') + file);
    }
  }
  for (const file of Object.keys(after)) {
    if (!(file in before)) drift.push('APPARU:' + file);
  }
  return drift.sort();
}

/**
 * Ecriture atomique — KV2-04.
 *
 * Une ecriture directe interrompue laissait un `recovery.json` tronque ; comme il
 * etait le plus recent, il empoisonnait toutes les reprises ulterieures.
 */
function writeRecovery(runDir, repoRoot, request, files, meta) {
  const payload = recoveryPayload(repoRoot, request, files, meta);
  const target = path.join(runDir, 'recovery.json');
  const temporary = target + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(payload, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporary, target);
  return payload.entries.map((entry) => entry.path);
}

/**
 * Paquet de reprise transportable — KV2-03.
 *
 * `recovery.json` n'existait que sur le disque du runner et n'etait jamais
 * televerse : une reinstallation detruisait le delta. Le paquet transportable
 * est un patch Git binaire, BORNE aux chemins autorises, accompagne d'un
 * manifeste hashe. Un patch echoue la ou une reecriture de fichier entier
 * reussirait silencieusement : il detecte le conflit avec une autre revision.
 *
 * Il revele du code a qui peut lire les artefacts : ce n'est PAS une protection
 * de confidentialite, et la population habilitee a lire les artefacts doit etre
 * celle habilitee a lire le depot.
 */
const RECOVERY_PACKAGE_SCHEMA = 'kodjo.protocol.v2.recovery-package.0.6.16';

function certificationStopAfterRecoveryEnabled(request, env = process.env) {
  return env.GITHUB_ACTIONS === 'true' &&
    env.KODJO_SUPERVISED_QUEUE === '1' &&
    env.KODJO_CERTIFICATION_STOP_AFTER_RECOVERY === 'V2-PROD-00' &&
    request.slice_id === 'V2-PROD-00';
}
function buildRecoveryPatch(repoRoot, request, files) {
  const indexFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-idx-')), 'index');
  const env = { ...process.env, GIT_INDEX_FILE: indexFile };
  const run = (args) => {
    const r = command('git', args, repoRoot, env, 120000);
    if (r.error || r.status !== 0) {
      throw new Error('RECOVERY_PATCH_FAILED: git ' + args[0] + ': ' + (r.error ? r.error.message : r.stderr));
    }
    return r.stdout;
  };
  run(['read-tree', request.source_head]);
  const inScopeFiles = [...new Set(files)].filter((f) => inCumulativeScope(f, request)).sort();
  if (inScopeFiles.length === 0) return { patch: '', paths: [] };
  // Les octets produits sont l'oracle. Une configuration globale Windows
  // core.autocrlf=true ne doit jamais normaliser CRLF pendant la capture.
  run(['-c', 'core.autocrlf=false', 'add', '--all', '--'].concat(inScopeFiles.map((f) => ':(literal)' + f)));
  const patch = run(['diff', '--cached', '--binary', '--full-index', '--no-renames', request.source_head]);
  return { patch, paths: inScopeFiles };
}

function writeRecoveryPackage(runDir, repoRoot, request, files, meta) {
  const dir = path.join(runDir, 'recovery-package');
  fs.mkdirSync(dir, { recursive: true });
  const built = buildRecoveryPatch(repoRoot, request, files);
  const patchPath = path.join(dir, 'implementation.patch');
  fs.writeFileSync(patchPath + '.tmp', built.patch, 'utf8');
  fs.renameSync(patchPath + '.tmp', patchPath);
  const manifest = {
    schema_version: RECOVERY_PACKAGE_SCHEMA,
    slice_id: request.slice_id,
    session_id: request.generated_session_id,
    source_head: request.source_head,
    baseline_head: request.baseline_head,
    run_id: (meta && meta.runId) || null,
    github_run_id: process.env.GITHUB_RUN_ID || null,
    request_id: request.request_id,
    integrity_status: (meta && meta.integrityStatus) || 'INTACT',
    // `scope_allow` reste le périmètre de mutation de cette invocation. `paths`
    // est le delta cumulatif restaurable, constitué de la reprise exacte et des
    // mutations autorisées produites ensuite.
    scope_allow: request.scope_allow,
    recovery_paths: exactRecoveryPaths(request.recovery_paths || []),
    paths: built.paths,
    patch_sha256: sha256(built.patch),
    patch_bytes: Buffer.byteLength(built.patch, 'utf8'),
    created_at: new Date().toISOString(),
  };
  const manifestPath = path.join(dir, 'manifest.json');
  fs.writeFileSync(manifestPath + '.tmp', JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  fs.renameSync(manifestPath + '.tmp', manifestPath);
  return { dir, manifest };
}

/**
 * Restauration depuis l'artefact — KV2-03.
 * L'application est atomique : `git apply --check` d'abord, jamais `--3way` ni
 * `--reject`. Une application partielle est refusee.
 */
function restoreFromPackage(packageDir, repoRoot, request, migrationEvidence) {
  const manifestPath = path.join(packageDir, 'manifest.json');
  const patchPath = path.join(packageDir, 'implementation.patch');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(patchPath)) {
    throw new Error('RECOVERY_PACKAGE_INCOMPLETE: ' + packageDir);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
  if (manifest.schema_version !== RECOVERY_PACKAGE_SCHEMA) throw new Error('RECOVERY_PACKAGE_SCHEMA_UNSUPPORTED');
  if (manifest.slice_id !== request.slice_id ||
      manifest.session_id !== request.session_id ||
      manifest.baseline_head !== request.baseline_head) {
    throw new Error('RECOVERY_PACKAGE_PROVENANCE_MISMATCH');
  }
  if (manifest.integrity_status !== 'INTACT') {
    throw new Error('RECOVERY_INTEGRITY_REFUSED: ' + manifest.integrity_status);
  }
  const patch = fs.readFileSync(patchPath, 'utf8');
  if (sha256(patch) !== manifest.patch_sha256) throw new Error('RECOVERY_PACKAGE_DIGEST_MISMATCH');
  const paths = exactRecoveryPaths(manifest.paths);
  if (!patch.trim()) {
    if (paths.length) throw new Error('RECOVERY_PACKAGE_PATHS_MISMATCH');
    const migration = certifyRecoverySourceMigration(manifest, patch, paths, repoRoot, request);
    if (migrationEvidence) Object.assign(migrationEvidence, migration);
    return [];
  }
  // Preserve the captured bytes during restoration too: Windows autocrlf
  // must not turn an LF recovery delta into CRLF before Claude sees it.
  const apply = (extra) => command('git', ['-c', 'core.autocrlf=false', 'apply', '--binary'].concat(extra), repoRoot, process.env, 120000);
  const patchFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-patch-')), 'implementation.patch');
  fs.writeFileSync(patchFile, patch, 'utf8');
  const numstat = apply(['--numstat', '-z', patchFile]);
  if (numstat.error || numstat.status !== 0) {
    throw new Error('RECOVERY_PATCH_PATHS_UNREADABLE: ' + (numstat.error ? numstat.error.message : numstat.stderr));
  }
  const patchPaths = patchPathsFromNumstat(numstat.stdout);
  if (JSON.stringify(patchPaths) !== JSON.stringify(paths)) {
    throw new Error('RECOVERY_PACKAGE_PATHS_MISMATCH');
  }
  const migration = certifyRecoverySourceMigration(manifest, patch, paths, repoRoot, request);
  if (migrationEvidence) Object.assign(migrationEvidence, migration);
  const check = apply(['--check', patchFile]);
  if (check.error || check.status !== 0) {
    throw new Error('RECOVERY_PARTIAL_APPLY_REFUSED: ' + (check.error ? check.error.message : check.stderr));
  }
  const applied = apply([patchFile]);
  if (applied.error || applied.status !== 0) {
    throw new Error('RECOVERY_PACKAGE_APPLY_FAILED: ' + (applied.error ? applied.error.message : applied.stderr));
  }
  return paths;
}

/** Lecture defensive : un candidat illisible est ignore, jamais fatal — KV2-04. */
function readRecoveryCandidate(file) {
  let candidate;
  try {
    candidate = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch (err) {
    process.stderr.write('[KODJO_V2] RECOVERY_CANDIDATE_UNREADABLE: ' + file + ' (' + err.message + ')\n');
    return null;
  }
  if (!candidate || typeof candidate !== 'object') return null;
  if (candidate.payload_sha256 && payloadDigest(candidate) !== candidate.payload_sha256) {
    process.stderr.write('[KODJO_V2] RECOVERY_CANDIDATE_DIGEST_MISMATCH: ' + file + '\n');
    return null;
  }
  return candidate;
}

/** Provenance exacte : la reprise n'accepte pas un paquet d'une autre revision. */
function sameProvenance(candidate, request) {
  return candidate.schema_version === RECOVERY_SCHEMA &&
    candidate.slice_id === request.slice_id &&
    candidate.session_id === request.session_id &&
    candidate.baseline_head === request.baseline_head &&
    candidate.source_head === request.source_head;
}

function applyRecovery(recovery, repoRoot, request) {
  const entries = Array.isArray(recovery.entries) ? recovery.entries : [];
  const recoveryPaths = exactRecoveryPaths(entries.map((entry) => entry && entry.path));
  for (const entry of entries) {
    const normalized = normalizeScopeCandidate(entry.path);
    const absolute = path.resolve(repoRoot, normalized);
    if (!normalized || !absolute.startsWith(repoRoot + path.sep)) throw new Error('RECOVERY_PATH_INVALID: ' + normalized);
    if (fs.existsSync(absolute) && fs.lstatSync(absolute).isSymbolicLink()) {
      throw new Error('RECOVERY_NOT_A_REGULAR_FILE: ' + normalized);
    }
    if (entry.deleted === true) {
      if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
      continue;
    }
    const content = Buffer.from(String(entry.content_base64 || ''), 'base64');
    if (sha256(content) !== entry.sha256) throw new Error('RECOVERY_HASH_MISMATCH: ' + normalized);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content);
  }
  return recoveryPaths;
}

function legacyMarkerPath(stateRoot, request) {
  return path.join(stateRoot, 'legacy-recovery-bootstrap', request.slice_id + '-' + request.session_id + '.json');
}

/**
 * Restauration — KV2-04, KV2-05, KV2-06, KV2-08.
 *
 * Retourne { files, legacyBootstrap }. `legacyBootstrap` n'est PAS consomme ici :
 * le marqueur n'est ecrit qu'apres production d'un premier paquet exploitable,
 * sans quoi un echec precoce brulait definitivement l'unique amorce.
 */
function restoreRecovery(stateRoot, repoRoot, request) {
  if (request.mode !== 'RESUME_DELTA') return { files: [], legacyBootstrap: null };
  const runsRoot = path.join(stateRoot, 'runs');
  const runDirs = fs.existsSync(runsRoot)
    ? fs.readdirSync(runsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(runsRoot, entry.name))
    : [];
  const candidates = runDirs
    .map((dir) => path.join(dir, 'recovery.json'))
    .filter((file) => fs.existsSync(file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  let recovery = null;
  let mutatedSeen = false;
  for (const file of candidates) {
    const candidate = readRecoveryCandidate(file);
    if (!candidate || !sameProvenance(candidate, request)) continue;
    if (candidate.integrity_status !== 'INTACT') {
      mutatedSeen = true;
      process.stderr.write('[KODJO_V2] RECOVERY_INTEGRITY_REFUSED: ' + file +
        ' (' + candidate.integrity_status + ') — conserve pour diagnostic, jamais restaure\n');
      continue;
    }
    recovery = candidate;
    break;
  }

  if (recovery) return { files: applyRecovery(recovery, repoRoot, request), legacyBootstrap: null };

  // KV2-03 : le disque du runner n'est plus l'unique depot du delta. Quand le
  // paquet local a disparu, la reprise repart de l'artefact du run source.
  const packageDir = (process.env.KODJO_SOURCE_RECOVERY_DIR || '').trim();
  if (packageDir && fs.existsSync(path.join(packageDir, 'manifest.json'))) {
    const sourceHeadMigration = {};
    return { files: restoreFromPackage(packageDir, repoRoot, request, sourceHeadMigration),
      legacyBootstrap: null, sourceHeadMigration };
  }

  if (mutatedSeen) throw new Error('RECOVERY_INTEGRITY_REFUSED');
  if (!request.allow_legacy_recovery_bootstrap) throw new Error('RECOVERY_NOT_FOUND');

  // Amorce historique : on verifie qu'elle est disponible et non deja consommee,
  // sans la consommer. La consommation a lieu apres production du paquet.
  if (fs.existsSync(legacyMarkerPath(stateRoot, request))) {
    throw new Error('LEGACY_RECOVERY_BOOTSTRAP_ALREADY_USED');
  }
  let legacy = null;
  for (const file of runDirs.map((dir) => path.join(dir, 'result.json'))
    .filter((f) => fs.existsSync(f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)) {
    const candidate = readRecoveryCandidate(file);
    if (candidate &&
        candidate.session_id === request.session_id &&
        candidate.source_head === request.source_head &&
        String(candidate.run_id || '').startsWith(request.slice_id + '-') &&
        Array.isArray(candidate.modified_files)) {
      legacy = candidate;
      break;
    }
  }
  if (!legacy) throw new Error('LEGACY_RECOVERY_SOURCE_NOT_FOUND');
  return { files: [], legacyBootstrap: { prior_run_id: legacy.run_id, lost_modified_files: legacy.modified_files } };
}

/** Consomme l'amorce, une seule fois, apres production d'un paquet exploitable. */
function consumeLegacyBootstrap(stateRoot, request, legacyBootstrap, runId) {
  if (!legacyBootstrap) return null;
  const markerPath = legacyMarkerPath(stateRoot, request);
  fs.mkdirSync(path.dirname(markerPath), { recursive: true });
  try {
    fs.writeFileSync(markerPath, JSON.stringify({
      schema_version: LEGACY_MARKER_SCHEMA,
      slice_id: request.slice_id,
      session_id: request.session_id,
      source_head: request.source_head,
      consumed_by_run_id: runId,
      github_run_id: process.env.GITHUB_RUN_ID || null,
      prior_run_id: legacyBootstrap.prior_run_id,
      lost_modified_files: legacyBootstrap.lost_modified_files,
      created_at: new Date().toISOString(),
    }, null, 2) + '\n', { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  } catch (err) {
    if (err && err.code === 'EEXIST') throw new Error('LEGACY_RECOVERY_BOOTSTRAP_ALREADY_USED');
    throw err;
  }
  return markerPath;
}

const CHECK_RUNNER_SOURCE = `'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const commands = {
  jest: [npm, ['test', '--silent']],
  typescript: [npx, ['--no-install', 'tsc', '--noEmit']],
  lint: [npm, ['run', 'lint', '--silent']]
};
const id = process.argv[2];
if (!Object.prototype.hasOwnProperty.call(commands, id)) process.exit(78);
const env = { ...process.env };
if (env.KODJO_QUALIFICATION_ISOLATED_CHECKS === '1') {
  if (id === 'jest') {
    const cacheRoot = String(env.KODJO_QUALIFICATION_CHECK_CACHE_DIR || '').trim();
    if (cacheRoot) commands[id][1].push('--', '--cacheDirectory', path.join(cacheRoot, 'jest'));
    else commands[id][1].push('--', '--no-cache');
  }
  if (id === 'lint') commands[id][1].push('--', '--no-cache');
}
delete env.CLAUDE_CODE_OAUTH_TOKEN;
delete env.ANTHROPIC_API_KEY;
const child = process.platform === 'win32'
  ? { bin: (process.env.ComSpec || 'cmd.exe'), args: ['/d', '/s', '/c', commands[id][0], ...commands[id][1]] }
  : { bin: commands[id][0], args: commands[id][1] };
const result = spawnSync(child.bin, child.args, { cwd: process.cwd(), env, shell: false, stdio: 'inherit', windowsHide: true });
process.exit(result.error || result.status === null ? 78 : result.status);
`;

function main() {
  // Keep the read capability in supervisor memory only, never in child env.
  const liveToken = consumeLiveToken(process.env);

  const requestPath = process.argv[2];
  if (!requestPath) return die('USAGE', 'node scripts/kodjo/run-local-claude.js <request.json>');
  const repoRoot = path.resolve(git(['rev-parse', '--show-toplevel'], process.cwd()));
  let request;
  let rawRequest;
  let assertVNextAdmission = () => null;
  let vnextAdmission = null;
  try {
    rawRequest = JSON.parse(fs.readFileSync(path.resolve(requestPath), 'utf8').replace(/^\uFEFF/, ''));
    // Defense in depth: a direct runner invocation must also re-observe the
    // exact VNext authorization, before normalization, locks or Claude.
    const vnextGithub = require('./verify-authorizations').ghClient({
      env: liveToken ? { ...process.env, GH_TOKEN: liveToken } : process.env,
    });
    assertVNextAdmission = () => (vnextAdmission = require('./lib/vnext-live-chain').guardLocalRequest(rawRequest, {
      cwd: repoRoot, github: vnextGithub, queueFile: process.env.KODJO_VNEXT_QUEUE_FILE,
    }));
    assertVNextAdmission();
    request = normalizeRequest(rawRequest, repoRoot, vnextAdmission);
  } catch (err) {
    return die('REQUEST_REFUSED', err.message);
  }

  const stateRoot = process.env.KODJO_STATE_ROOT
    ? path.resolve(process.env.KODJO_STATE_ROOT)
    : path.join(os.homedir(), '.kodjo-v2');
  fs.mkdirSync(stateRoot, { recursive: true });
  const initialized = initializeRunDiagnostic(stateRoot);
  const runId = initialized.runId;
  const runDir = initialized.runDir;
  let sourceHeadMigration = null;
  request.generated_session_id = request.mode === 'INITIAL' ? require('node:crypto').randomUUID() : request.session_id;
  const writeFailure = (diagnostic, message, extra = {}) => {
    fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
      schema_version: 'kodjo.protocol.v2.local-result.0.6.17', run_id: runId,
      github_run_id: process.env.GITHUB_RUN_ID || null,
      github_run_attempt: process.env.GITHUB_RUN_ATTEMPT || null,
      request_id: request.request_id, session_id: request.generated_session_id,
      source_head: request.source_head, status: 'IMPLEMENTATION_FAILED',
      diagnostic, diagnostic_message: String(message || ''), claude_invoked: false,
      recovery_package: null, recovery_source_head_migration: sourceHeadMigration,
      limits_effective: request.limits, turn_limit_effective: TURN_LIMIT_POLICY, ...extra,
    }, null, 2) + '\n', 'utf8');
    return die(diagnostic, message);
  };

  const assertLiveTarget = () => {
    if (process.env.KODJO_SUPERVISED_QUEUE === '1' && request.delivery_target) {
      if (!liveToken) throw new Error('KODJO_QUEUE_LIVE_AUTH_MISSING');
      verifyLiveTarget(request, {env:{...process.env,GH_TOKEN:liveToken}});
    }
  };
  const preflightFile = String(process.env.KODJO_PREFLIGHT_FILE || '').trim();
  const supervisedQueue = process.env.KODJO_SUPERVISED_QUEUE === '1' && process.env.GITHUB_ACTIONS === 'true';
  if (supervisedQueue && !preflightFile) {
    return writeFailure('PREFLIGHT_ATTESTATION_MISSING', 'supervised queue requires preflight evidence');
  }
  if (preflightFile) {
    try {
      const preflight = JSON.parse(fs.readFileSync(path.resolve(preflightFile), 'utf8').replace(/^\uFEFF/, ''));
      verifyLocalFreshness({ preflight, rawRequest, request, repoRoot });
      fs.copyFileSync(path.resolve(preflightFile), path.join(runDir, 'preflight.json'));
    } catch (err) {
      return writeFailure('PREFLIGHT_FRESHNESS_REFUSED', err.message);
    }
  }

  const head = git(['rev-parse', 'HEAD'], repoRoot);
  if (head !== request.source_head) return writeFailure('HEAD_DIVERGED', 'HEAD local != source_head');
  const promptRelative = path.relative(repoRoot, request.prompt_file).replace(/\\/g, '/');
  if (!promptRelative || promptRelative.startsWith('../') || path.isAbsolute(promptRelative)) {
    return writeFailure('PROMPT_PATH_INVALID', promptRelative);
  }
  const promptBuffer = Source.readFileAtHead(promptRelative, request.protocol_source_head, repoRoot);
  // PR existante : le plan approuvé est lu au HEAD protocolaire et lié à son blob ; la copie de l'arbre applicatif
  // peut être celle d'un plan remplacé (run 37208114796).
  let authorizedPlanBuffer = null;
  if (request.authorized_plan) {
    try { authorizedPlanBuffer = Source.readFileAtHead(request.authorized_plan.plan_path, request.protocol_source_head, repoRoot); }
    catch (err) { return writeFailure('AUTHORIZED_PLAN_UNREADABLE', err.message); }
    const planBlob = require('node:crypto').createHash('sha1').update('blob ' + authorizedPlanBuffer.length + '\0').update(authorizedPlanBuffer).digest('hex');
    if (planBlob !== request.authorized_plan.plan_blob_oid) {
      return writeFailure('AUTHORIZED_PLAN_BLOB_MISMATCH', planBlob + ' != ' + request.authorized_plan.plan_blob_oid);
    }
  }
  // VNext only: verify the admitted plan before recovery can touch application files.
  const RuntimePlan = require('./lib/vnext-runtime-plan');
  if (vnextAdmission) {
    try { RuntimePlan.verify(vnextAdmission, { cwd: repoRoot, missionBytes: promptBuffer }); }
    catch (error) { return writeFailure(error.message, 'approved runtime plan refused before recovery or Claude'); }
  }
  const promptExistsInExecutionTree = fs.existsSync(request.prompt_file);
  const promptWorktreeHashBefore = promptExistsInExecutionTree ? sha256(fs.readFileSync(request.prompt_file)) : null;
  const initialChanges = changedFiles(repoRoot).filter((f) =>
    path.resolve(f) !== path.resolve(requestPath));
  if (initialChanges.length) return writeFailure('WORKTREE_NOT_CLEAN', initialChanges.join(', '));
  let authorizedPlanFile = null;
  if (authorizedPlanBuffer) {
    try { authorizedPlanFile = materializeAuthorizedPlan(repoRoot, authorizedPlanBuffer); }
    catch (err) { return writeFailure('AUTHORIZED_PLAN_MATERIALIZATION_FAILED', err.message); }
    const visible = changedFiles(repoRoot).filter((f) => path.resolve(f) !== path.resolve(requestPath));
    if (visible.length) return writeFailure('AUTHORIZED_PLAN_NOT_EXCLUDED', visible.join(', '));
  }

  const fetch = command('git', ['fetch', '--quiet'], repoRoot, process.env, 120000);
  if (fetch.error || fetch.status !== 0) return writeFailure('REMOTE_HEAD_UNAVAILABLE', fetch.error ? fetch.error.message : fetch.stderr);
  if (!supervisedQueue) {
    let upstream;
    try { upstream = git(['rev-parse', '@{upstream}'], repoRoot); }
    catch (_) { return writeFailure('UPSTREAM_NOT_CONFIGURED', 'branche distante de suivi absente'); }
    if (upstream !== head) return writeFailure('HEAD_DIVERGED', 'HEAD local != HEAD distant suivi après fetch');
  }

  const token = process.env.CLAUDE_CODE_OAUTH_TOKEN || '';
  if (!token && !supervisedQueue) return writeFailure('KODJO-V2-CLAUDE-AUTH', 'jeton OAuth absent');

  const claudeBin = resolveClaudeBinary(process.env, process.platform);
  const claudePrefix = [];
  const version = command(claudeBin, [...claudePrefix, '--version'], repoRoot, process.env, 30000);
  if (version.error || version.status !== 0) return writeFailure('CLAUDE_NOT_AVAILABLE', version.error ? version.error.message : version.stderr);
  const versionText = String(version.stdout || version.stderr).trim();
  if (supervisedQueue && !token) {
    const auth = command(claudeBin, [...claudePrefix, 'auth', 'status'], repoRoot, process.env, 30000);
    if (auth.error || auth.status !== 0) return writeFailure('KODJO-V2-CLAUDE-AUTH', 'session Claude du runner indisponible');
  }
  if (!new RegExp('(^|\\s)' + CLAUDE_CODE_VERSION.replace(/\./g, '\\.') + '(\\s|$)').test(versionText)) {
    return writeFailure('CLAUDE_VERSION_REFUSED', 'attendu ' + CLAUDE_CODE_VERSION + ', reçu ' + versionText);
  }
  let recoveredFiles = [];
  let pendingLegacyBootstrap = null;
  try {
    assertLiveTarget();
    const restored = restoreRecovery(stateRoot, repoRoot, request);
    recoveredFiles = restored.files;
    request.recovery_paths = exactRecoveryPaths(recoveredFiles);
    pendingLegacyBootstrap = restored.legacyBootstrap;
    sourceHeadMigration = restored.sourceHeadMigration || null;
  } catch (err) {
    return writeFailure('RECOVERY_REFUSED', err.message);
  }
  const verifyInitialRestart = (ownedLock) => {
    if (!request.initial_restart) return null;
    if (!supervisedQueue || !liveToken || !process.env.KODJO_INITIAL_RESTART_QUEUE) throw new Error('INITIAL_RESTART_SUPERVISED_CONTEXT_REQUIRED');
    const gate = require('./verify-initial-restart');
    const queue = gate.read(process.env.KODJO_INITIAL_RESTART_QUEUE);
    if (require('./lib/preflight-contract').sha256(require('./lib/queue-request').projectQueueRequest(queue)) !== require('./lib/preflight-contract').sha256(rawRequest)) throw new Error('INITIAL_RESTART_PROJECTION_MISMATCH');
    return gate.verify(process.env.KODJO_INITIAL_RESTART_QUEUE, {cwd:repoRoot, preflightFile, ownedLock, env:{...process.env,GH_TOKEN:liveToken}});
  };
  try { verifyInitialRestart(); } catch (err) { return writeFailure('INITIAL_RESTART_REFUSED', err.message); }
  const lockPath = path.join(stateRoot, 'claude-local.lock');
  let lock;
  try {
    lock = acquireExecutionLock(lockPath, {
      run_id: runId, request_id: request.request_id, session_id: request.generated_session_id,
      github_run_id: process.env.GITHUB_RUN_ID || null,
      github_run_attempt: process.env.GITHUB_RUN_ATTEMPT || null,
    });
  } catch (err) {
    return writeFailure(err.message, lockPath, { lock_state: err.message });
  }

  const restoredDeltaFiles = changedFiles(repoRoot).filter((file) => {
    const normalized = file.replace(/\\/g, '/');
    return normalized !== promptRelative && path.resolve(file) !== path.resolve(requestPath);
  });
  const restoredDeltaFingerprint = deltaFingerprint(repoRoot, restoredDeltaFiles);
  let result, beforeRefs, beforeGitIntegrity, promptBytes, claudeStartedAt, claudeFinishedAt, claudeDurationMs;
  let runtimePlan = null, runtimePlanFailure = null;
  const interrupt = (signal) => {
    if (runtimePlan) {
      try { RuntimePlan.restore(runtimePlan); }
      catch (error) { runtimePlanFailure = error.message; }
    }
    if (runtimePlan && runtimePlan.identity.state !== 'RESTORED') {
      writeFailure('VNEXT_RUNTIME_PLAN_RESTORE_REQUIRED', signal, { lock_state: 'RETAINED_CONSERVATIVELY' });
      process.exit(130);
    }
    const released = releaseExecutionLock(lock);
    writeFailure('CLAUDE_EXECUTION_INTERRUPTED', signal, { lock_state: released ? 'RELEASED_BY_OWNER' : 'RETAINED_CONSERVATIVELY' });
    process.exit(130);
  };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    fs.writeFileSync(path.join(runDir, 'kodjo-check-runner.js'), CHECK_RUNNER_SOURCE, { encoding: 'utf8', mode: 0o500 });
    fs.copyFileSync(path.join(__dirname, 'kodjo-git-read.js'), path.join(runDir, 'kodjo-git-read.js'));
    fs.copyFileSync(path.join(__dirname, 'kodjo-file-mutation.js'), path.join(runDir, 'kodjo-file-mutation.js'));
    fs.copyFileSync(path.join(__dirname, 'lib', 'scope-path.js'), path.join(runDir, 'scope-path.js'));
    fs.chmodSync(path.join(runDir, 'kodjo-file-mutation.js'), 0o500);
    fs.chmodSync(path.join(runDir, 'scope-path.js'), 0o400);
    fs.writeFileSync(path.join(runDir, 'mcp.json'), '{"mcpServers":{}}\n', 'utf8');
    fs.writeFileSync(path.join(runDir, 'settings.json'), JSON.stringify(claudeSettings()) + '\n', 'utf8');
    if (vnextAdmission) {
      try { runtimePlan = RuntimePlan.install(vnextAdmission, { cwd: repoRoot, runDir, missionBytes: promptBuffer }); }
      catch (error) {
        runtimePlan = error.runtime_plan || null;
        return writeFailure(error.message, 'approved plan read view could not be installed; Claude not invoked',
          { plan_restore_error: error.restore_error || null,
            plan_journal: runtimePlan?.journalFile || null });
      }
    }
    const taskText = promptBuffer.toString('utf8');
    const prompt = buildPrompt(request, taskText, runDir);
    promptBytes = Buffer.byteLength(prompt, 'utf8');
    if (promptBytes > request.limits.max_prompt_bytes || promptBytes > request.limits.max_total_prompt_bytes) {
      return writeFailure('PROMPT_BUDGET_EXCEEDED', promptBytes + ' octets');
    }
    beforeRefs = refs(repoRoot);
    beforeGitIntegrity = GitIntegrity.snapshot(repoRoot, [path.resolve(stateRoot)]);
    const restartProof = verifyInitialRestart(lock);
    const intent = {
      schema_version: 'kodjo.protocol.v2.claude-invocation.0.6.11',
      state: 'EXTERNAL_CALL_INTENDED', run_id: runId, slice_id: request.slice_id,
      request_id: request.request_id, session_id: request.generated_session_id,
      initial_restart: request.initial_restart || null, initial_restart_proof: restartProof,
      execution_environment: {runner_name:process.env.RUNNER_NAME || null, user_home:os.homedir(), state_root:stateRoot, claude_config_root:path.resolve(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'))},
      source_head: request.source_head, mode: request.mode, prompt_bytes: promptBytes,
      // Non-secret values supplied at launch, not a claim about Claude's internals.
      foreground_check_environment: { ...CLAUDE_FOREGROUND_CHECK_ENV },
      config: adapterConfig(), effective_allowed_tools: require('./lib/claude-local').concreteAllowedTools(runDir),
      // KV2-13 : les bornes effectives restent séparées des valeurs par défaut.
      // KV2-24 : aucune borne de tours n'est imposée par KODJO ; la preuve
      // explicite que l'arrêt relève de Claude et de l'abonnement.
      limits_effective: request.limits,
      turn_limit_effective: TURN_LIMIT_POLICY,
      recovery_source_head_migration: sourceHeadMigration,
      ...(runtimePlan ? { approved_plan: runtimePlan.identity } : {}),
      claude_adapter_defaults_sha256: adapterConfigHash(),
      claude_adapter_config_sha256: sha256(JSON.stringify({
        config: adapterConfig(), limits_effective: request.limits,
      })), started_at: new Date().toISOString(),
    };
    if (process.env.KODJO_DISPOSABLE_EVIDENCE_DIR) {
      intent.consumption = require('./consume-disposable-request').consumeDisposable({
        rawRequest, sessionId: request.generated_session_id, head, runDir,
        evidenceDirectory: process.env.KODJO_DISPOSABLE_EVIDENCE_DIR,
        env: { ...process.env, GH_TOKEN: liveToken },
      });
    }
    fs.writeFileSync(path.join(runDir, 'invocation.json'), JSON.stringify(intent, null, 2) + '\n', 'utf8');
    const args = buildArgs(request, runDir, prompt);
    intent.state = 'EXTERNAL_CALL_SENT';
    intent.command_sha256 = sha256(JSON.stringify([claudeBin, ...claudePrefix, ...args.slice(0, -1), '[PROMPT]']));
    fs.writeFileSync(path.join(runDir, 'invocation.json'), JSON.stringify(intent, null, 2) + '\n', 'utf8');
    const claudeEnv = claudeEnvironment(process.env, request);
    if (runtimePlan) Object.assign(claudeEnv, RuntimePlan.environment(runtimePlan));
    assertLiveTarget();
    const claudeStartedMs = Date.now();
    claudeStartedAt = new Date(claudeStartedMs).toISOString();
    assertVNextAdmission();
    if (runtimePlan) RuntimePlan.assertView(runtimePlan);
    result = command(claudeBin, [...claudePrefix, ...args], repoRoot, claudeEnv, request.limits.max_duration_seconds * 1000);
    const claudeFinishedMs = Date.now();
    claudeFinishedAt = new Date(claudeFinishedMs).toISOString();
    claudeDurationMs = claudeFinishedMs - claudeStartedMs;
    if (authorizedPlanFile) {
      try { fs.chmodSync(authorizedPlanFile, 0o600); fs.rmSync(path.dirname(authorizedPlanFile), { recursive: true, force: true }); }
      catch (err) { process.stderr.write('KODJO_AUTHORIZED_PLAN_CLEANUP_WARNING: ' + err.message + '\n'); }
    }
    fs.writeFileSync(path.join(runDir, 'claude-output.json'), redact(result.stdout || ''), 'utf8');
    fs.writeFileSync(path.join(runDir, 'claude-stderr.txt'), redact(result.stderr || ''), 'utf8');
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
    if (runtimePlan) {
      try { RuntimePlan.restore(runtimePlan); }
      catch (error) { runtimePlanFailure = error.message; }
    }
    if (!runtimePlan || runtimePlan.identity.state === 'RESTORED') releaseExecutionLock(lock);
  }

  delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
  delete process.env.ANTHROPIC_API_KEY;
  // KV2-06 : l'integrite est CONSTATEE, pas opposee avant conservation. Un delta
  // produit sur une base mutee est conserve pour diagnostic, puis refuse comme
  // source de reprise. On ne detruit plus le travail pour sanctionner l'etat.
  const afterRefs = refs(repoRoot);
  const gitIntegrityChanges = GitIntegrity.compare(beforeGitIntegrity,
    GitIntegrity.snapshot(repoRoot, [path.resolve(stateRoot)]));
  fs.writeFileSync(path.join(runDir, 'git-runtime-integrity.json'), JSON.stringify({
    schema_version: 'kodjo.git-runtime-integrity-evidence.v1',
    before_sha256: beforeGitIntegrity.fingerprint,
    changed_paths: gitIntegrityChanges, status: gitIntegrityChanges.length ? 'MUTATED' : 'INTACT',
  }, null, 2) + '\n');
  const refsMutated = beforeRefs !== afterRefs;
  const promptMutated = promptExistsInExecutionTree
    ? (!fs.existsSync(request.prompt_file) || sha256(fs.readFileSync(request.prompt_file)) !== promptWorktreeHashBefore)
    : fs.existsSync(request.prompt_file);
  const integrityStatus = gitIntegrityChanges.length ? 'GIT_METADATA_OR_IGNORED_MUTATED'
    : refsMutated ? 'REFS_MUTATED' : (promptMutated ? 'PROMPT_MUTATED' : 'INTACT');
  const protocolPath = (f) =>
    path.resolve(repoRoot, f) !== path.resolve(requestPath);
  const files = changedFiles(repoRoot).filter(protocolPath);
  const postClaudeFingerprint = deltaFingerprint(repoRoot,
    [...new Set([...restoredDeltaFiles, ...files])]);
  const agentMutationFiles = mutationPathsSinceRestore(
    restoredDeltaFiles, restoredDeltaFingerprint, files, postClaudeFingerprint);
  const outsideMutation = agentMutationFiles.filter((f) => !inScope(f, request.scope_allow));
  const outside = files.filter((f) => !inCumulativeScope(f, request));
  let recoveryFiles = [];
  try {
    recoveryFiles = writeRecovery(runDir, repoRoot, request, files, { runId, integrityStatus });
  } catch (err) {
    return die('RECOVERY_WRITE_FAILED', err.message);
  }

  if (runtimePlanFailure) {
    fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
      request_id: request.request_id, source_head: request.source_head,
      status: 'IMPLEMENTATION_INTEGRITY_REFUSED', diagnostic: runtimePlanFailure,
      modified_files: files, recovery_files: recoveryFiles, recovery_package: null,
      claude_invoked: true, checks: [], publishable_paths: [],
      approved_plan: runtimePlan.identity,
    }, null, 2) + '\n');
    return die(runtimePlanFailure, 'raw application delta and plan diagnostic conserved; publication refused');
  }

  if (gitIntegrityChanges.length) {
    fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
      request_id: request.request_id, source_head: request.source_head,
      integrity_status: integrityStatus, modified_files: files,
      checks: [], publishable_paths: [], status: 'IMPLEMENTATION_INTEGRITY_REFUSED',
      git_integrity_changed_paths: gitIntegrityChanges,
      recovery_package: null,
    }, null, 2) + '\n');
    return die('GIT_METADATA_OR_IGNORED_MUTATION_DETECTED', 'raw delta conserved; Git staging, publication and recovery package refused');
  }

  let recoveryPackage = null;
  try {
    recoveryPackage = writeRecoveryPackage(runDir, repoRoot, request, files, { runId, integrityStatus });
  } catch (err) {
    return die('RECOVERY_PACKAGE_WRITE_FAILED', err.message);
  }

  let implementationStopStatus = null;
  try {
    implementationStopStatus = extractImplementationStopStatus(result.stdout || '');
  } catch (err) {
    return die('IMPLEMENTATION_STOP_STATUS_REFUSED', err.message);
  }
  if (request.operation_kind === 'IMPLEMENT' && implementationStopStatus) {
    const blocked = {
      schema_version: 'kodjo.protocol.v2.local-result.0.6.39',
      run_id: runId,
      github_run_id: process.env.GITHUB_RUN_ID || null,
      github_run_attempt: process.env.GITHUB_RUN_ATTEMPT || null,
      request_id: request.request_id,
      session_id: request.generated_session_id,
      source_head: request.source_head,
      status: implementationStopStatus,
      diagnostic: 'IMPLEMENTATION_BLOCKED_BY_CONTRACT',
      claude_invoked: true,
      claude_started_at: claudeStartedAt,
      claude_finished_at: claudeFinishedAt,
      claude_duration_ms: claudeDurationMs,
      modified_files: files,
      recovered_files: recoveredFiles,
      recovery_files: recoveryFiles,
      recovery_package: recoveryPackage ? recoveryPackage.manifest : null,
      checks: [],
      publishable_paths: [],
      publishable_pathspec_file: null,
      integrity_status: integrityStatus,
      limits_effective: request.limits,
      turn_limit_effective: TURN_LIMIT_POLICY,
    };
    fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(blocked, null, 2) + '\n', 'utf8');
    process.stderr.write('[KODJO_V2] ' + implementationStopStatus + ' — publication interdite\n');
    return 76;
  }

  // C4 : interruption déterministe uniquement pour la tranche de certification.
  // Le paquet atomique existe déjà et aucun contrôle ni chemin de publication
  // n'a encore été exécuté. La sortie 75 laisse le workflow préserver l'artefact.
  if (certificationStopAfterRecoveryEnabled(request)) {
    const interrupted = {
      schema_version: 'kodjo.protocol.v2.local-result.0.6.22',
      run_id: runId,
      github_run_id: process.env.GITHUB_RUN_ID || null,
      github_run_attempt: process.env.GITHUB_RUN_ATTEMPT || null,
      request_id: request.request_id,
      session_id: request.generated_session_id,
      source_head: request.source_head,
      status: 'CONTROLLED_INTERRUPTION_AFTER_RECOVERY',
      diagnostic: 'CERTIFICATION_STOP_AFTER_RECOVERY',
      claude_invoked: true,
      claude_started_at: claudeStartedAt,
      claude_finished_at: claudeFinishedAt,
      claude_duration_ms: claudeDurationMs,
      modified_files: files,
      recovered_files: recoveredFiles,
      recovery_files: recoveryFiles,
      recovery_package: recoveryPackage.manifest,
      checks: [],
      publishable_paths: [],
      publishable_pathspec_file: null,
      integrity_status: integrityStatus,
      limits_effective: request.limits,
      turn_limit_effective: TURN_LIMIT_POLICY,
    };
    fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(interrupted, null, 2) + '\n', 'utf8');
    process.stderr.write('[KODJO_V2] CERTIFICATION_STOP_AFTER_RECOVERY — paquet préservé, contrôles non exécutés\n');
    return 75;
  }

  // KV2-08 : l'amorce n'est consommee qu'ici, apres production d'un paquet.
  let legacyMarker = null;
  if (pendingLegacyBootstrap) {
    try {
      legacyMarker = consumeLegacyBootstrap(stateRoot, request, pendingLegacyBootstrap, runId);
    } catch (err) {
      return die('LEGACY_RECOVERY_BOOTSTRAP_REFUSED', err.message);
    }
  }

  if (integrityStatus !== 'INTACT') {
    if (gitIntegrityChanges.length) return die('GIT_METADATA_OR_IGNORED_MUTATION_DETECTED', 'delta conserved; publication and recovery refused');
    process.stderr.write('[KODJO_V2] ' + (refsMutated ? 'FUNCTIONAL_REF_MUTATION_DETECTED' : 'PROMPT_MUTATION_DETECTED') +
      ' — delta conserve dans ' + path.join(runDir, 'recovery.json') + ', reprise automatique refusee\n');
    return die(refsMutated ? 'FUNCTIONAL_REF_MUTATION_DETECTED' : 'PROMPT_MUTATION_DETECTED',
      'delta conserve pour diagnostic');
  }
  // KV2-07 : les controles peuvent creer, modifier ou supprimer des fichiers.
  // L'empreinte prise ici est la reference du delta reellement valide.
  const preCheckFingerprint = deltaFingerprint(repoRoot, files);
  const checks = request.checks.map((name) => runCheck(name, { cwd: repoRoot }));

  let postCheckFiles;
  let drift;
  try {
    postCheckFiles = changedFiles(repoRoot).filter(protocolPath);
    drift = fingerprintDrift(preCheckFingerprint, deltaFingerprint(repoRoot, postCheckFiles));
  } catch (err) {
    return die('POST_CHECK_DELTA_UNREADABLE', err.message);
  }
  const postCheckIntegrity = GitIntegrity.compare(beforeGitIntegrity, GitIntegrity.snapshot(repoRoot, [path.resolve(stateRoot)]));
  if (postCheckIntegrity.length) return die('POST_CHECK_GIT_INTEGRITY_MUTATED', postCheckIntegrity.join(','));
  const postOutside = postCheckFiles.filter((f) => !inCumulativeScope(f, request));
  const scopeClear = !outsideMutation.length && !outside.length && !postOutside.length;
  const deltaStable = drift.length === 0;
  const verified = result.status === 0 && scopeClear && deltaStable && checks.every((c) => c.status === 'PASS');
  const summary = {
    schema_version: 'kodjo.protocol.v2.local-result.0.6.11', run_id: runId,
    request_id: request.request_id,
    session_id: request.generated_session_id,
    claude_exit_code: result.status, claude_error: result.error ? result.error.message : null,
    claude_failure: classifyClaudeFailure(result),
    claude_started_at: claudeStartedAt,
    claude_finished_at: claudeFinishedAt,
    claude_duration_ms: claudeDurationMs,
    timed_out: result.status === null, source_head: request.source_head,
    // KV2-19 : preuve que les controles ont bien tourne contre les dependances
    // de la revision controlee, et non contre celles de main.
    package_lock_sha256: (() => {
      const lock = path.join(repoRoot, 'package-lock.json');
      return fs.existsSync(lock) ? sha256(fs.readFileSync(lock)) : null;
    })(),
    modified_files: files, recovered_files: recoveredFiles, recovery_files: recoveryFiles,
    recovery_scope_paths: request.recovery_paths,
    mutation_scope_allow: request.scope_allow,
    agent_mutation_files: agentMutationFiles,
    integrity_status: integrityStatus,
    recovery_package: recoveryPackage ? recoveryPackage.manifest : null,
    recovery_source_head_migration: sourceHeadMigration,
    legacy_recovery_bootstrap_consumed: legacyMarker !== null,
    out_of_scope_files: [...new Set([...outsideMutation, ...outside, ...postOutside])],
    post_check_files: postCheckFiles,
    post_check_drift: drift,
    checks,
    limits_effective: request.limits,
    turn_limit_effective: TURN_LIMIT_POLICY,
    claude_invoked: true,
    status: verified
      ? 'IMPLEMENTED_AND_VERIFIED'
      : (result.status !== 0 || result.error ? 'IMPLEMENTATION_FAILED' : 'IMPLEMENTED_WITH_FAILED_CHECKS'),
  };
  // La liste des chemins publiables n'est ecrite QUE sur un verdict vert : la
  // publication ne peut pas s'appuyer sur un delta refuse.
  summary.publishable_paths = verified ? postCheckFiles.slice().sort() : [];
  try {
    summary.publishable_pathspec_file = verified ? writePublishablePathspec(summary.publishable_paths) : null;
  } catch (err) {
    return die('PUBLISHABLE_PATHSPEC_WRITE_FAILED', err.message);
  }
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
  process.stdout.write('\n[KODJO_V2] ' + summary.status + '\n');
  process.stdout.write('[KODJO_V2] fichiers modifiés: ' + (files.join(', ') || 'aucun') + '\n');
  for (const c of checks) process.stdout.write('[KODJO_V2] ' + c.check + '=' + c.status + '\n');
  if (summary.out_of_scope_files.length) {
    process.stderr.write('[KODJO_V2] SCOPE_VIOLATION: ' + summary.out_of_scope_files.join(', ') + '\n');
  }
  if (drift.length) {
    process.stderr.write('[KODJO_V2] POST_CHECK_DELTA_DIVERGED: ' + drift.join(', ') + '\n');
  }
  process.stdout.write('[KODJO_V2] diagnostic: ' + path.join(runDir, 'result.json') + '\n');
  return summary.status === 'IMPLEMENTED_AND_VERIFIED' ? 0 : 1;
}

if (require.main === module) {
  try { process.exitCode = main(); } catch (err) { process.exitCode = die('LOCAL_ADAPTER_FAILURE', err.stack || err.message); }
}

module.exports = {
  claudeEnvironment, claudeSettings,
  inScope, changedFiles, changedEntries, entryPaths, refs, materializeAuthorizedPlan,
  exactRecoveryPaths, inCumulativeScope, mutationPathsSinceRestore, patchPathsFromNumstat,
  recoveryPayload, writeRecovery, restoreRecovery, applyRecovery, consumeLegacyBootstrap,
  deltaFingerprint, fingerprintDrift,
  writeRecoveryPackage, restoreFromPackage, buildRecoveryPatch, RECOVERY_PACKAGE_SCHEMA,
  certifyRecoverySourceMigration,
  extractClaudeResultText, extractImplementationStopStatus, IMPLEMENTATION_STOP_STATUSES,
  readRecoveryCandidate, payloadDigest, writePublishablePathspec,
  certificationStopAfterRecoveryEnabled,
  RECOVERY_SCHEMA, LEGACY_MARKER_SCHEMA, CLAUDE_FOREGROUND_CHECK_ENV,
};
