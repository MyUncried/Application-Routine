#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { canonicalJson, extractTaggedJson, normalizeRepoPath, sha256, fail } = require('./lib/plan-impact');
const { verifyEmbedded: verifyRequirementContracts } = require('./lib/requirement-contract');

const CURRENT_CONTRACT_VERSION = 2;
const CURRENT_SCHEMA = 'kodjo.plan-contract-consistency.v2';
const TEST_PATH = /(?:^|\/)(__tests__|tests?)\/|\.(?:test|spec)\.[^.]+$/;
const SOURCE_PATH = /(?:`|\b)((?:app|src|tests)\/[A-Za-z0-9_@().+\-/]+?\.(?:ts|tsx|js|jsx|mjs|cjs))(?:`|\b)/g;

function isTestPath(value) { return TEST_PATH.test(value); }
function extractPaths(text) {
  const found = new Set();
  let match;
  SOURCE_PATH.lastIndex = 0;
  while ((match = SOURCE_PATH.exec(text)) !== null) found.add(normalizeRepoPath(match[1], 'plan_path'));
  return [...found].sort();
}
function stripMachineBlocks(markdown) {
  let out = String(markdown);
  for (const tag of ['KODJO_MODIFIED_MODULES_JSON', 'KODJO_PLAN_DECISIONS_JSON', 'KODJO_PLAN_IMPACT_JSON', 'KODJO_PLAN_CONTRACT_JSON', 'KODJO_UI_CRITERIA_MATRIX_JSON', 'KODJO_UI_PLAN_CONTRACT_JSON', 'KODJO_NON_UI_REQUIREMENTS_JSON', 'KODJO_REQUIREMENT_CONTRACT_JSON', 'KODJO_TEST_CONTRACT_JSON', 'KODJO_BOUNDARY_CONTRACT_JSON', 'KODJO_PLAN_CLARIFICATIONS_JSON']) {
    out = out.replace(new RegExp('<' + tag + '>[\\s\\S]*?</' + tag + '>', 'g'), '');
  }
  return out;
}
function sectionsMatching(markdown, matcher) {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^(#{1,6})\s+(.+)$/);
    if (!heading || !matcher.test(heading[2])) continue;
    const level = heading[1].length;
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j].match(/^(#{1,6})\s+/);
      if (next && next[1].length <= level) break;
      j += 1;
    }
    sections.push(lines.slice(i, j).join('\n'));
  }
  return sections;
}
function gitPathExists(cwd, revision, file) {
  const result = spawnSync('git', ['cat-file', '-e', revision + ':' + file], { cwd, encoding: 'utf8', windowsHide: true, shell: false });
  return !result.error && result.status === 0;
}
function validateProtocolCommit(value) {
  if (!/^[0-9a-f]{40}$/i.test(String(value || ''))) fail('PLAN_PROTOCOL_PROVENANCE_MISSING', 'protocol_commit absent ou invalide');
  return String(value).toLowerCase();
}

try {
  const [planFile, revision, gitCwd, outputFile, mode = 'produce', protocolCommitArg] = process.argv.slice(2);
  if (!planFile || !revision || !gitCwd || !outputFile) {
    throw new Error('USAGE: verify-plan-contract-consistency.js <plan.md> <revision> <git_cwd> <output.json> [produce|consume] [protocol_commit]');
  }
  if (!['produce', 'consume'].includes(mode)) fail('PLAN_CONTRACT_MODE_INVALID', 'mode attendu: produce ou consume');
  if (!/^[0-9a-f]{40}$/i.test(revision)) fail('PLAN_SCAN_STALE', 'revision Git invalide: ' + revision);
  const protocolCommit = validateProtocolCommit(protocolCommitArg || process.env.KODJO_PROTOCOL_COMMIT || process.env.GITHUB_SHA);
  const markdown = fs.readFileSync(planFile, 'utf8');
  const matrix = extractTaggedJson(markdown, 'KODJO_PLAN_IMPACT_JSON');
  const scope = [...new Set((matrix.scope_allow || []).map((p) => normalizeRepoPath(p, 'scope_allow')))].sort();
  if (!Array.isArray(matrix.scope_allow) || scope.length !== matrix.scope_allow.length) fail('PLAN_SCOPE_CONTRADICTION', 'scope_allow invalide ou duplique');
  const prose = stripMachineBlocks(markdown);

  const scopeSections = sectionsMatching(prose, /scope_allow/i);
  if (scopeSections.length > 1) fail('PLAN_SCOPE_CONTRADICTION', 'plusieurs sections scope_allow en prose');
  if (scopeSections.length === 1) {
    const declared = extractPaths(scopeSections[0]);
    if (declared.length === 0) fail('PLAN_SCOPE_CONTRADICTION', 'section scope_allow en prose sans chemins explicites');
    if (canonicalJson(declared) !== canonicalJson(scope)) {
      fail('PLAN_SCOPE_CONTRADICTION', 'scope_allow prose != scope_allow machine');
    }
  }

  const testText = sectionsMatching(prose, /\btests?\b/i).join('\n');
  const testPaths = new Set(extractPaths(testText).filter(isTestPath));
  const modules = Array.isArray(matrix.modified_modules) ? matrix.modified_modules : [];
  const rows = Array.isArray(matrix.rows) ? matrix.rows : [];
  const requiredWrites = new Set();
  for (const module of modules) if (isTestPath(module.path)) requiredWrites.add(normalizeRepoPath(module.path, 'test_module'));
  for (const row of rows) if (row.classification === 'TEST_MUST_ADAPT') requiredWrites.add(normalizeRepoPath(row.path, 'test_row'));
  for (const testPath of requiredWrites) {
    if (!testPaths.has(testPath)) fail('TEST_CONTRACT_CONSISTENCY', 'test en écriture absent de la section Tests: ' + testPath);
    if (!scope.includes(testPath)) fail('TEST_CONTRACT_CONSISTENCY', 'test en écriture absent de scope_allow: ' + testPath);
  }
  for (const testPath of testPaths) {
    if (gitPathExists(gitCwd, revision, testPath)) continue;
    const create = modules.find((module) => module.path === testPath && module.change === 'CREATE');
    if (!create || !scope.includes(testPath)) {
      fail('TEST_CONTRACT_CONSISTENCY', 'nouveau test exige sans CREATE autorise: ' + testPath);
    }
  }

  const requiredTestWrites = [...requiredWrites].sort();
  const hasRequirementContract = /<KODJO_REQUIREMENT_CONTRACT_JSON>[\s\S]*?<\/KODJO_REQUIREMENT_CONTRACT_JSON>/.test(markdown);
  const requirementContracts = hasRequirementContract ? verifyRequirementContracts(markdown) : null;
  const requirementProof = requirementContracts ? {
    requirement_contract_sha256: sha256(requirementContracts.requirement_contract),
    test_contract_sha256: sha256(requirementContracts.test_contract),
    boundary_contract_sha256: sha256(requirementContracts.boundary_contract),
    requirement_count: requirementContracts.requirement_contract.requirement_count,
  } : null;
  const hasEmbeddedContract = /<KODJO_PLAN_CONTRACT_JSON>[\s\S]*?<\/KODJO_PLAN_CONTRACT_JSON>/.test(markdown);
  const consume = mode === 'consume' || hasEmbeddedContract;
  if (consume) {
    let embedded;
    try {
      embedded = extractTaggedJson(markdown, 'KODJO_PLAN_CONTRACT_JSON');
    } catch {
      fail('PLAN_PROTOCOL_STALE', 'plan sans KODJO_PLAN_CONTRACT_JSON versionne');
    }
    if (embedded.schema !== CURRENT_SCHEMA || Number(embedded.contract_version) < CURRENT_CONTRACT_VERSION) {
      fail('PLAN_PROTOCOL_STALE', `contrat plan ancien: schema=${embedded.schema || 'absent'} version=${embedded.contract_version || 'absente'} minimum=${CURRENT_CONTRACT_VERSION}`);
    }
    validateProtocolCommit(embedded.protocol_commit);
    if (embedded.scan_revision !== matrix.scan_revision || canonicalJson(embedded.write_scope || []) !== canonicalJson(scope) || canonicalJson(embedded.required_test_writes || []) !== canonicalJson(requiredTestWrites)) {
      fail('PLAN_CONTRACT_DRIFT', 'contrat embarque != contrat recalcule');
    }
    if (requirementProof) {
      for (const [key,value] of Object.entries(requirementProof)) {
        if (embedded[key] !== value) fail('PLAN_REQUIREMENT_CONTRACT_DRIFT', key);
      }
    }
  }

  const contract = {
    schema: CURRENT_SCHEMA,
    contract_version: CURRENT_CONTRACT_VERSION,
    protocol_commit: protocolCommit,
    scan_revision: matrix.scan_revision,
    write_scope: scope,
    required_test_writes: requiredTestWrites,
    ...(requirementProof || {}),
  };
  fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(contract, null, 2) + '\n', 'utf8');
  process.stdout.write(`[KODJO_V2] plan contract consistency verified — mode=${consume ? 'consume' : 'produce'} version=${CURRENT_CONTRACT_VERSION} scope=${scope.length} tests=${requiredWrites.size}\n`);
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
