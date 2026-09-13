'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCAN_SCHEMA = 'kodjo.direct-import-scan.v1';
const MATRIX_SCHEMA = 'kodjo.plan-impact.v1';
const REVIEW_SCHEMA = 'kodjo.plan-impact-review.v1';
const CLASSIFICATIONS = Object.freeze([
  'MODIFY', 'TEST_MUST_ADAPT', 'CONSUMER_UNAFFECTED',
  'TEST_UNAFFECTED', 'REQUIRES_CLARIFICATION',
]);
const SOURCE_EXTENSIONS = Object.freeze(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function fail(code, detail) {
  const error = new Error(code + (detail ? ': ' + detail : ''));
  error.code = code;
  throw error;
}

function normalizeRepoPath(value, label = 'path') {
  if (typeof value !== 'string' || value.length === 0) fail('PLAN_SCAN_PATH_INVALID', label + ' vide');
  if (value.includes('\\') || value.startsWith('/') || /^[A-Za-z]:/.test(value)) {
    fail('PLAN_SCAN_PATH_AMBIGUOUS', label + '=' + value);
  }
  const parts = value.split('/');
  if (parts.some((part) => part === '' || part === '.' || part === '..')) {
    fail('PLAN_SCAN_PATH_AMBIGUOUS', label + '=' + value);
  }
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized.startsWith('../')) fail('PLAN_SCAN_PATH_AMBIGUOUS', label + '=' + value);
  return normalized;
}

function git(args, cwd, encoding = 'utf8') {
  const result = spawnSync('git', args, {
    cwd, encoding, windowsHide: true, shell: false, maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    fail('PLAN_SCAN_GIT_FAILED', 'git ' + args.join(' ') + ': ' + String(result.stderr || result.error?.message || '').trim());
  }
  return result.stdout;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

function normalizeModules(input) {
  if (!Array.isArray(input) || input.length === 0) fail('PLAN_SCOPE_UNCLASSIFIED', 'modified_modules vide');
  const seen = new Set();
  return input.map((entry) => {
    const item = typeof entry === 'string' ? { path: entry, change: 'MODIFY' } : entry;
    if (!item || typeof item !== 'object') fail('PLAN_SCAN_PATH_INVALID', 'module invalide');
    const modulePath = normalizeRepoPath(item.path, 'modified_module');
    const change = String(item.change || 'MODIFY').toUpperCase();
    if (!['MODIFY', 'CREATE'].includes(change)) fail('PLAN_SCOPE_CONTRADICTION', 'change inconnu pour ' + modulePath);
    if (seen.has(modulePath)) fail('PLAN_SCOPE_CONTRADICTION', 'module duplique: ' + modulePath);
    seen.add(modulePath);
    return { path: modulePath, change };
  }).sort((a, b) => compareText(a.path, b.path));
}

function extractSpecifiers(source) {
  const specs = new Set();
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /\b(?:require|import)\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bjest\.(?:mock|unmock|requireActual)\s*\(\s*["']([^"']+)["']/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) specs.add(match[1]);
  }
  return [...specs].sort(compareText);
}

function resolveSpecifier(importer, specifier, fileSet) {
  let base;
  if (specifier.startsWith('@/')) base = 'src/' + specifier.slice(2);
  else if (specifier.startsWith('.')) {
    base = path.posix.normalize(path.posix.join(path.posix.dirname(importer), specifier));
    if (base === '..' || base.startsWith('../')) fail('PLAN_SCAN_PATH_AMBIGUOUS', importer + ' -> ' + specifier);
  } else return null;

  const candidates = [];
  const add = (candidate) => { if (fileSet.has(candidate)) candidates.push(candidate); };
  add(base);
  if (!SOURCE_EXTENSIONS.some((ext) => base.endsWith(ext))) {
    for (const ext of SOURCE_EXTENSIONS) add(base + ext);
    for (const ext of SOURCE_EXTENSIONS) add(base + '/index' + ext);
  }
  const unique = [...new Set(candidates)].sort(compareText);
  if (unique.length > 1) fail('PLAN_SCAN_PATH_AMBIGUOUS', importer + ' -> ' + specifier + ': ' + unique.join(', '));
  return unique[0] || null;
}

function riskScore(file, source) {
  let score = /(?:^|\/)(__tests__|tests?)\//.test(file) || /\.(?:test|spec)\.[^.]+$/.test(file) ? 100 : 0;
  score += Math.min(30, (source.match(/\bexpect\s*\(/g) || []).length * 3);
  score += Math.min(20, (source.match(/(?:toEqual|toStrictEqual|toMatchObject)\s*\(/g) || []).length * 2);
  return score;
}

function scanDirectImporters(options) {
  const cwd = options.cwd || process.cwd();
  const revision = String(options.revision || '');
  if (!/^[0-9a-f]{40}$/i.test(revision)) fail('PLAN_SCAN_STALE', 'revision Git invalide: ' + revision);
  git(['cat-file', '-e', revision + '^{commit}'], cwd);
  const modules = normalizeModules(options.modifiedModules);
  const rawTree = git(['ls-tree', '-r', '-z', revision, '--', 'app', 'src'], cwd, 'buffer');
  const applicationTreeSha256 = crypto.createHash('sha256').update(rawTree).digest('hex');
  const rawFiles = git(['ls-tree', '-r', '--name-only', '-z', revision, '--', 'app', 'src'], cwd, 'buffer');
  const files = rawFiles.toString('utf8').split('\0').filter(Boolean).map((file) => normalizeRepoPath(file)).sort(compareText);
  const fileSet = new Set(files);
  for (const module of modules) {
    if (module.change === 'MODIFY' && !fileSet.has(module.path)) {
      fail('PLAN_SCAN_PATH_INVALID', 'module MODIFY absent a ' + revision + ': ' + module.path);
    }
    if (module.change === 'CREATE' && fileSet.has(module.path)) {
      fail('PLAN_SCOPE_CONTRADICTION', 'module CREATE existe deja: ' + module.path);
    }
  }
  const targetSet = new Set(modules.filter((module) => module.change === 'MODIFY').map((module) => module.path));
  const candidates = [];
  for (const file of files) {
    if (!SOURCE_EXTENSIONS.some((ext) => file.endsWith(ext))) continue;
    const source = String(git(['show', revision + ':' + file], cwd));
    const triggeredBy = extractSpecifiers(source)
      .map((specifier) => resolveSpecifier(file, specifier, fileSet))
      .filter((resolved) => resolved && targetSet.has(resolved));
    const unique = [...new Set(triggeredBy)].sort(compareText);
    if (unique.length === 0 || targetSet.has(file)) continue;
    const isTest = /(?:^|\/)(__tests__|tests?)\//.test(file) || /\.(?:test|spec)\.[^.]+$/.test(file);
    candidates.push({
      path: file,
      candidate_kind: isTest ? 'TEST' : 'CONSUMER',
      triggered_by: unique,
      risk_score: riskScore(file, source),
    });
  }
  candidates.sort((a, b) => b.risk_score - a.risk_score || compareText(a.path, b.path));
  return {
    schema: SCAN_SCHEMA,
    scan_revision: revision.toLowerCase(),
    application_tree_sha256: applicationTreeSha256,
    modified_modules: modules,
    candidates,
  };
}

function extractTaggedJson(markdown, tag, missingCode = 'PLAN_SCOPE_UNCLASSIFIED') {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...String(markdown).matchAll(new RegExp('<' + escaped + '>\\s*([\\s\\S]*?)\\s*</' + escaped + '>', 'g'))];
  if (matches.length !== 1) fail(missingCode, tag + ' attendu exactement une fois, trouve ' + matches.length);
  try { return JSON.parse(matches[0][1]); } catch (error) { fail(missingCode, tag + ' JSON invalide: ' + error.message); }
}

function rowSignature(row) {
  return canonicalJson({
    path: row.path,
    candidate_kind: row.candidate_kind,
    triggered_by: row.triggered_by,
    risk_score: row.risk_score,
  });
}

function verifyImpactMatrix(matrix, replayScan, expectedRevision) {
  if (!matrix || matrix.schema !== MATRIX_SCHEMA) fail('PLAN_SCOPE_UNCLASSIFIED', 'schema de matrice absent ou inconnu');
  const expected = String(expectedRevision || '').toLowerCase();
  if (matrix.scan_revision !== expected || replayScan.scan_revision !== expected) {
    fail('PLAN_SCAN_STALE', 'matrice=' + matrix.scan_revision + ', rejeu=' + replayScan.scan_revision + ', source_head=' + expected);
  }
  const modules = normalizeModules(matrix.modified_modules);
  if (canonicalJson(modules) !== canonicalJson(replayScan.modified_modules)) {
    fail('PLAN_SCOPE_CONTRADICTION', 'modified_modules differe du rejeu');
  }
  const replayHash = sha256(replayScan);
  if (matrix.scan_sha256 !== replayHash) fail('PLAN_SCOPE_CONTRADICTION', 'scan_sha256 differe du rejeu');
  if (!Array.isArray(matrix.rows)) fail('PLAN_SCOPE_UNCLASSIFIED', 'rows absent');

  const expectedRows = [
    ...modules.map((module) => ({ path: module.path, candidate_kind: 'MODIFIED_MODULE', triggered_by: [], risk_score: 0 })),
    ...replayScan.candidates,
  ];
  const rows = new Map();
  for (const row of matrix.rows) {
    const rowPath = normalizeRepoPath(row.path, 'matrix.row.path');
    if (rows.has(rowPath)) fail('PLAN_SCOPE_CONTRADICTION', 'ligne dupliquee: ' + rowPath);
    if (!CLASSIFICATIONS.includes(row.classification)) fail('PLAN_SCOPE_UNCLASSIFIED', rowPath + ': classification absente ou inconnue');
    if (row.classification === 'REQUIRES_CLARIFICATION') fail('PLAN_SCOPE_UNCLASSIFIED', rowPath + ': clarification requise');
    if (typeof row.justification !== 'string' || row.justification.trim().length === 0) {
      fail('PLAN_SCOPE_UNCLASSIFIED', rowPath + ': justification positive absente');
    }
    rows.set(rowPath, { ...row, path: rowPath });
  }
  if (rows.size > expectedRows.length) fail('PLAN_SCOPE_CONTRADICTION', 'la matrice contient des lignes absentes du scan');
  for (const expectedRow of expectedRows) {
    const actual = rows.get(expectedRow.path);
    if (!actual) fail('PLAN_SCOPE_UNCLASSIFIED', 'candidat non classe: ' + expectedRow.path);
    if (rowSignature(actual) !== rowSignature(expectedRow)) {
      fail('PLAN_SCOPE_CONTRADICTION', 'preuve de candidat alteree: ' + expectedRow.path);
    }
    if (expectedRow.candidate_kind === 'MODIFIED_MODULE' && actual.classification !== 'MODIFY') {
      fail('PLAN_SCOPE_CONTRADICTION', expectedRow.path + ' doit etre MODIFY');
    }
    if (expectedRow.candidate_kind === 'TEST' && !['TEST_MUST_ADAPT', 'TEST_UNAFFECTED'].includes(actual.classification)) {
      fail('PLAN_SCOPE_CONTRADICTION', expectedRow.path + ': classification de test incompatible');
    }
    if (expectedRow.candidate_kind === 'CONSUMER' && !['MODIFY', 'CONSUMER_UNAFFECTED'].includes(actual.classification)) {
      fail('PLAN_SCOPE_CONTRADICTION', expectedRow.path + ': classification de consommateur incompatible');
    }
  }
  if (rows.size !== expectedRows.length) fail('PLAN_SCOPE_CONTRADICTION', 'cardinalite de matrice differente du scan');
  if (!Array.isArray(matrix.scope_allow)) fail('PLAN_SCOPE_CONTRADICTION', 'scope_allow absent');
  const actualScope = matrix.scope_allow.map((p) => normalizeRepoPath(p, 'scope_allow')).sort();
  if (new Set(actualScope).size !== actualScope.length) fail('PLAN_SCOPE_CONTRADICTION', 'scope_allow contient un doublon');
  const expectedScope = [...rows.values()]
    .filter((row) => ['MODIFY', 'TEST_MUST_ADAPT'].includes(row.classification))
    .map((row) => row.path).sort();
  if (canonicalJson(actualScope) !== canonicalJson(expectedScope)) {
    fail('PLAN_SCOPE_CONTRADICTION', 'scope_allow != MODIFY union TEST_MUST_ADAPT');
  }
  return { matrix, replay_scan: replayScan, scan_sha256: replayHash, scope_allow: expectedScope };
}

function buildReviewProof(verified) {
  return {
    schema: REVIEW_SCHEMA,
    scan_revision: verified.replay_scan.scan_revision,
    plan_scan_sha256: verified.matrix.scan_sha256,
    reviewer_scan_sha256: verified.scan_sha256,
    candidate_count: verified.replay_scan.candidates.length,
    verdict: 'MATCH',
  };
}

function verifyReviewProof(proof, verified) {
  if (!proof || proof.schema !== REVIEW_SCHEMA) fail('PLAN_SCOPE_CONTRADICTION', 'preuve de revue absente ou inconnue');
  const expected = buildReviewProof(verified);
  if (canonicalJson(proof) !== canonicalJson(expected)) fail('PLAN_SCOPE_CONTRADICTION', 'preuve de revue differente du rejeu');
  return expected;
}

function verifyPlanAtRevision(options) {
  const matrix = extractTaggedJson(options.planMarkdown, 'KODJO_PLAN_IMPACT_JSON');
  const replay = scanDirectImporters({
    cwd: options.cwd,
    revision: matrix.scan_revision,
    modifiedModules: matrix.modified_modules,
  });
  const verified = verifyImpactMatrix(matrix, replay, matrix.scan_revision);
  const sourceReplay = scanDirectImporters({
    cwd: options.cwd,
    revision: options.sourceHead,
    modifiedModules: matrix.modified_modules,
  });
  if (sourceReplay.application_tree_sha256 !== replay.application_tree_sha256) {
    fail('PLAN_SCAN_STALE', 'baseline applicative modifiee entre ' + matrix.scan_revision + ' et ' + options.sourceHead);
  }
  const comparableSourceReplay = { ...sourceReplay, scan_revision: replay.scan_revision };
  if (sha256(comparableSourceReplay) !== sha256(replay)) {
    fail('PLAN_SCOPE_CONTRADICTION', 'le rejeu a source_head differe malgre une empreinte applicative identique');
  }
  verified.source_scan = sourceReplay;
  if (options.reviewMarkdown !== undefined) {
    const proof = extractTaggedJson(options.reviewMarkdown, 'KODJO_PLAN_IMPACT_REVIEW_JSON', 'PLAN_SCOPE_CONTRADICTION');
    verifyReviewProof(proof, verified);
  }
  return verified;
}

module.exports = {
  SCAN_SCHEMA, MATRIX_SCHEMA, REVIEW_SCHEMA, CLASSIFICATIONS,
  normalizeRepoPath, normalizeModules, extractSpecifiers, resolveSpecifier,
  canonicalJson, sha256, scanDirectImporters, extractTaggedJson,
  verifyImpactMatrix, buildReviewProof, verifyReviewProof, verifyPlanAtRevision, fail,
};
