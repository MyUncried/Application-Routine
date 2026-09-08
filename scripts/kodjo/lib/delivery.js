'use strict';

/**
 * ImplementationDeliveryArtifact — KODJO V2 §6.13-B.
 *
 * Builds an immutable, hash-addressed recovery package from a working tree,
 * WITHOUT creating any commit and WITHOUT touching the functional index.
 * The patch is produced from an isolated GIT_INDEX_FILE so that untracked
 * files are part of the delta (§6.13-B).
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { git, gitOrThrow, gitToFile } = require('./git');
const { sha256Bytes, sha256File, sha256String, sha256SumLine } = require('./hash');
const { writeJson, readJson, readJsonIfExists } = require('./json');
const { extract: extractTar } = require('./tar');

const SCHEMA_VERSION = 'kodjo.protocol.v2.delivery.0.6.3';
const PATCH_NAME = 'implementation.patch';

/**
 * Delivery layout.
 *
 * `recovery/` is the immutable core uploaded as its own artifact BEFORE any
 * check runs, so an interrupted runner cannot lose the patch. Nothing computed
 * after that upload is ever written back into it: the business status, the
 * check results and the publication receipt live in their own directories and
 * their own artifacts.
 */
const LAYOUT = {
  recovery: 'recovery',
  integrity: 'integrity',
  checks: 'checks',
  result: 'result',
  receipt: 'receipt',
};

const recoveryDir = (deliveryDir) => path.join(deliveryDir, LAYOUT.recovery);
const integrityDir = (deliveryDir) => path.join(deliveryDir, LAYOUT.integrity);
const checksDir = (deliveryDir) => path.join(deliveryDir, LAYOUT.checks);
const resultDir = (deliveryDir) => path.join(deliveryDir, LAYOUT.result);
const receiptDir = (deliveryDir) => path.join(deliveryDir, LAYOUT.receipt);

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function splitZ(buf) {
  const s = Buffer.isBuffer(buf) ? buf.toString('utf8') : String(buf);
  return s.split('\0').filter((x) => x.length > 0);
}

function resolveCommit(repoDir, rev) {
  const res = git(['rev-parse', '--verify', '--quiet', rev + '^{commit}'], { cwd: repoDir });
  if (res.status !== 0) return null;
  return String(res.stdout).trim();
}

/** Paths present in the source_head tree — used for tracked/untracked marking. */
function treePaths(repoDir, head) {
  const res = gitOrThrow(['ls-tree', '-r', '-z', '--name-only', head], { cwd: repoDir, encoding: null });
  return new Set(splitZ(res.stdout));
}

/**
 * Stage the full authorized delta into an isolated index and emit the binary patch.
 */
function buildPatch(repoDir, sourceHead, outDir) {
  const indexFile = path.join(tmpDir('kodjo-index-'), 'index');
  const env = { GIT_INDEX_FILE: indexFile };

  gitOrThrow(['read-tree', sourceHead], { cwd: repoDir, env });
  gitOrThrow(['add', '-A', '--', ':/'], { cwd: repoDir, env });

  const patchPath = path.join(outDir, PATCH_NAME);
  const diffArgs = [
    'diff',
    '--cached',
    '--binary',
    '--full-index',
    '--no-renames',
    '--no-textconv',
    '--no-ext-diff',
    sourceHead,
  ];
  const res = gitToFile(diffArgs, patchPath, { cwd: repoDir, env });
  if (res.status !== 0) {
    throw new Error('PATCH_BUILD_FAILED: git diff exited ' + res.status + ': ' + res.stderr.trim());
  }

  const nameStatus = gitOrThrow(
    ['diff', '--cached', '--name-status', '-z', '--no-renames', sourceHead],
    { cwd: repoDir, env, encoding: null }
  );
  const tokens = splitZ(nameStatus.stdout);
  const entries = [];
  for (let i = 0; i + 1 < tokens.length; i += 2) {
    entries.push({ status: tokens[i], path: tokens[i + 1] });
  }
  return { patchPath, indexFile, entries };
}

function describeFiles(repoDir, sourceHead, entries) {
  const tracked = treePaths(repoDir, sourceHead);
  return entries.map((e) => {
    const abs = path.join(repoDir, e.path);
    const isTracked = tracked.has(e.path);
    const record = {
      path: e.path,
      git_status: e.status,
      tracked: isTracked,
      origin: isTracked ? 'TRACKED_AT_SOURCE_HEAD' : 'UNTRACKED_NEW_FILE',
      content_sha256: null,
      size_bytes: null,
      previous_sha256: null,
    };
    if (isTracked) {
      const blob = git(['cat-file', 'blob', sourceHead + ':' + e.path], { cwd: repoDir, encoding: null });
      if (blob.status === 0) record.previous_sha256 = sha256Bytes(blob.stdout);
    }
    if (e.status !== 'D' && fs.existsSync(abs)) {
      const buf = fs.readFileSync(abs);
      record.content_sha256 = sha256Bytes(buf);
      record.size_bytes = buf.length;
    }
    return record;
  });
}

function defaultReport(meta, files) {
  const lines = [
    '# Rapport de developpement — genere par la conservation',
    '',
    "Aucun rapport d'agent n'a ete fourni a l'etape de conservation.",
    'Ce fichier est genere par `preserve-implementation.js` pour satisfaire',
    "l'obligation du §6.13-B (development-report.md, meme incomplet si l'agent",
    "s'est interrompu apres avoir modifie des fichiers).",
    '',
    "Il n'atteste AUCUN succes de controle et AUCUNE conformite fonctionnelle.",
    '',
    '- slice_id : ' + meta.slice_id,
    '- source_head : ' + meta.source_head,
    '- mode : ' + meta.mode,
    '- fichiers du delta : ' + files.length,
    '',
    '## Fichiers',
    '',
  ];
  for (const f of files) {
    lines.push('- `' + f.path + '` (' + f.git_status + ', ' + (f.tracked ? 'suivi' : 'non suivi') + ')');
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Build the delivery package. Never throws for a "no change" delta: it records
 * has_changes=false so the caller can compute IMPLEMENTATION_FAILED honestly.
 */
function buildDelivery({ repoDir, outDir, meta, reportPath, carriedChecksDir }) {
  const head = resolveCommit(repoDir, meta.source_head);
  if (!head) {
    throw new Error('SOURCE_HEAD_UNKNOWN: ' + meta.source_head + ' is not a commit in ' + repoDir);
  }
  if (head !== meta.source_head) {
    throw new Error('SOURCE_HEAD_NOT_CANONICAL: expected full sha ' + head + ', received ' + meta.source_head);
  }

  const recovery = recoveryDir(outDir);
  fs.mkdirSync(recovery, { recursive: true });
  fs.mkdirSync(checksDir(outDir), { recursive: true });

  const built = buildPatch(repoDir, head, recovery);
  const files = describeFiles(repoDir, head, built.entries);

  const patchPath = built.patchPath;
  const patchBytes = fs.statSync(patchPath).size;
  const patchSha = sha256File(patchPath);
  fs.writeFileSync(path.join(recovery, PATCH_NAME + '.sha256'), sha256SumLine(patchSha, PATCH_NAME), 'utf8');

  const modifiedFiles = {
    schema_version: SCHEMA_VERSION,
    source_head: head,
    rename_detection: false,
    files: files,
  };
  const modifiedFilesText = writeJson(path.join(recovery, 'modified-files.json'), modifiedFiles);

  let reportGenerated = false;
  const reportOut = path.join(recovery, 'development-report.md');
  if (reportPath && fs.existsSync(reportPath)) {
    fs.copyFileSync(reportPath, reportOut);
  } else {
    fs.writeFileSync(reportOut, defaultReport(meta, files), 'utf8');
    reportGenerated = true;
  }

  const carried = [];
  if (carriedChecksDir && fs.existsSync(carriedChecksDir)) {
    for (const name of fs.readdirSync(carriedChecksDir)) {
      if (!name.endsWith('.json')) continue;
      const prev = readJson(path.join(carriedChecksDir, name));
      prev.carried_from_run_id = meta.recovery_of_run_id || prev.carried_from_run_id || null;
      prev.rerun_in_this_attempt = false;
      writeJson(path.join(checksDir(outDir), name), prev);
      carried.push(name.replace(/\.json$/, ''));
    }
  }

  const untracked = files.filter((f) => !f.tracked).length;
  const manifest = {
    schema_version: SCHEMA_VERSION,
    protocol_version: '0.6.3',
    slice_id: meta.slice_id,
    operation_id: meta.operation_id,
    attempt_id: meta.attempt_id,
    source_run_id: meta.source_run_id,
    source_head: head,
    session_id: meta.session_id,
    created_at: new Date().toISOString(),
    mode: meta.mode,
    execution_environment: 'REMOTE_EPHEMERAL',
    business_commit_allowed: false,
    business_push_allowed: false,
    functional_ref_write_allowed: false,
    recovery_of_run_id: meta.recovery_of_run_id || null,
    cumulative: Boolean(meta.recovery_of_run_id),
    base_source_head: head,
    implementation_status: null,
    status_finalized: false,
    agent_reported_status: meta.agent_reported_status || null,
    patch_sha256: patchSha,
    patch_bytes: patchBytes,
    has_changes: files.length > 0 && patchBytes > 0,
    changed_file_count: files.length,
    untracked_file_count: untracked,
    modified_files_sha256: sha256String(modifiedFilesText),
    report: {
      path: 'development-report.md',
      sha256: sha256File(reportOut),
      generated_by_preservation: reportGenerated,
    },
    carried_checks: carried,
    integrity: gitStateSummary(outDir),
    preservation: {
      status: 'PRESERVED',
      preserved_at: new Date().toISOString(),
      patch_validated: false,
      validation: null,
    },
    // Deliberately absent from this manifest: business status, check results and
    // publication state. They are computed AFTER this package is uploaded, and
    // are written to result/ and receipt/ instead of being back-dated here.
    computed_after_upload: {
      note:
        'implementation_status, checks, failed_checks and publication are not part of this ' +
        'recovery package: they only exist in result/manifest.json and receipt/publication-receipt.json.',
    },
  };
  writeJson(path.join(recovery, 'manifest.json'), manifest);
  return manifest;
}

/** Integrity verdict produced by git-state-guard.js before preservation. */
function gitStateSummary(deliveryDir) {
  const state = readJsonIfExists(path.join(integrityDir(deliveryDir), 'git-state.json'));
  if (!state) {
    return { git_state: 'NOT_CHECKED', functional_continuation: 'BLOCKED', reason: 'GIT_STATE_GUARD_NOT_RUN' };
  }
  return {
    git_state: state.status,
    functional_continuation: state.functional_continuation,
    differences: state.differences || [],
    reason: state.reason || null,
  };
}

/**
 * Extract source_head into a clean space using `git archive` (read-only on the
 * source repository — no worktree, no ref and no index is created there).
 */
function cleanSpaceAt(repoDir, head) {
  const dir = tmpDir('kodjo-clean-');
  const tarPath = path.join(tmpDir('kodjo-archive-'), 'source.tar');
  const res = gitToFile(['archive', '--format=tar', head], tarPath, { cwd: repoDir });
  if (res.status !== 0) {
    throw new Error('CLEAN_SPACE_FAILED: git archive exited ' + res.status + ': ' + res.stderr.trim());
  }
  try {
    extractTar(tarPath, dir);
  } catch (err) {
    throw new Error('CLEAN_SPACE_FAILED: archive extraction failed: ' + err.message);
  }
  return dir;
}

/**
 * §6.13-B: a clean space at source_head MUST pass `git apply --check` before
 * publication. We additionally restore the patch and compare every declared
 * hash — the "oracle minimal d'artefact" of the T02 matrix.
 */
function verifyDelivery({ deliveryDir, repoDir, restore }) {
  const doRestore = restore !== false;
  const result = {
    checked_at: new Date().toISOString(),
    patch_sha256_match: false,
    apply_check: 'NOT_RUN',
    restore: doRestore ? 'NOT_RUN' : 'SKIPPED',
    file_hash_matches: 0,
    file_hash_mismatches: [],
    missing_expected_deletions: [],
    errors: [],
    valid: false,
  };

  // `deliveryDir` may be the delivery root (recovery/ inside) or, for a
  // TARGETED_FIX, a downloaded recovery artifact whose members sit at its root.
  const core = fs.existsSync(path.join(deliveryDir, LAYOUT.recovery, PATCH_NAME))
    ? recoveryDir(deliveryDir)
    : deliveryDir;
  result.recovery_dir = core;

  const patchPath = path.join(core, PATCH_NAME);
  const manifestPath = path.join(core, 'manifest.json');
  const modifiedPath = path.join(core, 'modified-files.json');
  const reportPath = path.join(core, 'development-report.md');
  const sidecarPath = path.join(core, PATCH_NAME + '.sha256');
  for (const required of [patchPath, manifestPath, modifiedPath, reportPath, sidecarPath]) {
    if (!fs.existsSync(required)) {
      result.errors.push('MISSING_DELIVERY_MEMBER: ' + path.basename(required));
      return result;
    }
  }

  const manifest = readJson(manifestPath);
  const modified = readJson(modifiedPath);

  const actualSha = sha256File(patchPath);
  const sidecar = fs.readFileSync(sidecarPath, 'utf8').trim().split(/\s+/)[0];
  result.patch_sha256_actual = actualSha;
  result.patch_sha256_match = actualSha === manifest.patch_sha256 && actualSha === sidecar;
  if (!result.patch_sha256_match) {
    result.errors.push('PATCH_HASH_MISMATCH: implementation.patch does not match its declared sha256');
    return result;
  }

  if (!manifest.has_changes) {
    result.errors.push('NO_CHANGE_PRESERVED: the delta is empty, no recoverable implementation exists');
    return result;
  }

  let space;
  try {
    space = cleanSpaceAt(repoDir, manifest.source_head);
  } catch (err) {
    result.errors.push(String(err.message));
    return result;
  }
  result.clean_space = space;

  const check = git(['apply', '--check', '--binary', '--whitespace=nowarn', patchPath], { cwd: space });
  result.apply_check = check.status === 0 ? 'PASS' : 'FAIL';
  if (check.status !== 0) {
    result.errors.push('APPLY_CHECK_FAILED: ' + String(check.stderr).trim());
    return result;
  }

  if (doRestore) {
    const applied = git(['apply', '--binary', '--whitespace=nowarn', patchPath], { cwd: space });
    result.restore = applied.status === 0 ? 'PASS' : 'FAIL';
    if (applied.status !== 0) {
      result.errors.push('RESTORE_FAILED: ' + String(applied.stderr).trim());
      return result;
    }
    for (const f of modified.files) {
      const abs = path.join(space, f.path);
      if (f.git_status === 'D') {
        if (fs.existsSync(abs)) result.missing_expected_deletions.push(f.path);
        continue;
      }
      if (!fs.existsSync(abs)) {
        result.file_hash_mismatches.push({ path: f.path, reason: 'ABSENT_AFTER_RESTORE' });
        continue;
      }
      const got = sha256Bytes(fs.readFileSync(abs));
      if (got === f.content_sha256) result.file_hash_matches += 1;
      else result.file_hash_mismatches.push({ path: f.path, expected: f.content_sha256, actual: got });
    }
    if (result.file_hash_mismatches.length > 0) result.errors.push('RESTORED_CONTENT_HASH_MISMATCH');
    if (result.missing_expected_deletions.length > 0) result.errors.push('EXPECTED_DELETION_NOT_APPLIED');
  }

  result.valid = result.errors.length === 0;
  return result;
}

module.exports = {
  SCHEMA_VERSION,
  PATCH_NAME,
  LAYOUT,
  recoveryDir,
  integrityDir,
  checksDir,
  resultDir,
  receiptDir,
  buildDelivery,
  verifyDelivery,
  cleanSpaceAt,
  resolveCommit,
  gitStateSummary,
};
