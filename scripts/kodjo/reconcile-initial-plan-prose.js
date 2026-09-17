#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const TEST_PATH = /(?:^|\/)(__tests__|tests?)\/|\.(?:test|spec)\.[^.]+$/;
const SOURCE_PATH = /(?:`|\b)((?:app|src)\/[A-Za-z0-9_@().+\-/]+?\.(?:ts|tsx|js|jsx|mjs|cjs))(?:`|\b)/g;

function fail(code, detail) {
  throw new Error(`${code}: ${detail}`);
}

function extractPaths(text) {
  const found = new Set();
  let match;
  SOURCE_PATH.lastIndex = 0;
  while ((match = SOURCE_PATH.exec(String(text))) !== null) found.add(match[1].replace(/\\/g, '/'));
  return [...found].sort();
}

function sectionsMatching(markdown, matcher) {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^(#{1,6})\s+(.+)$/);
    if (!heading || !matcher.test(heading[2])) continue;
    const level = heading[1].length;
    let end = i + 1;
    while (end < lines.length) {
      const next = lines[end].match(/^(#{1,6})\s+/);
      if (next && next[1].length <= level) break;
      end += 1;
    }
    sections.push(lines.slice(i, end).join('\n'));
  }
  return sections;
}

function replaceScopeSection(markdown, scope) {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const matches = [];
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^(#{1,6})\s+(.+)$/);
    if (heading && /scope_allow/i.test(heading[2])) matches.push({ index: i, level: heading[1].length });
  }
  if (matches.length > 1) fail('INITIAL_PLAN_SCOPE_RECONCILIATION', 'plusieurs sections scope_allow en prose');
  const block = ['### scope_allow machine', '', '```text', ...scope, '```'];
  if (matches.length === 0) {
    const marker = lines.findIndex((line) => line.trim() === '<KODJO_MODIFIED_MODULES_JSON>');
    const at = marker >= 0 ? marker : lines.length;
    lines.splice(at, 0, '', ...block, '');
    return lines.join('\n');
  }
  const { index, level } = matches[0];
  let end = index + 1;
  while (end < lines.length) {
    const next = lines[end].match(/^(#{1,6})\s+/);
    if (next && next[1].length <= level) break;
    end += 1;
  }
  lines.splice(index, end - index, ...block, '');
  return lines.join('\n');
}

function appendMissingRequiredTests(markdown, requiredTests) {
  const testSections = sectionsMatching(markdown, /\btests?\b/i).join('\n');
  const existing = new Set(extractPaths(testSections).filter((p) => TEST_PATH.test(p)));
  const missing = requiredTests.filter((p) => !existing.has(p));
  if (missing.length === 0) return markdown;
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const marker = lines.findIndex((line) => line.trim() === '<KODJO_MODIFIED_MODULES_JSON>');
  const at = marker >= 0 ? marker : lines.length;
  const block = [
    '',
    '## Tests — fermeture d’impact machine',
    '',
    'Les tests suivants sont ouverts en écriture par la fermeture déterministe d’impact et font partie du contrat de plan :',
    '',
    ...missing.map((p) => `- \`${p}\``),
    '',
  ];
  lines.splice(at, 0, ...block);
  return lines.join('\n');
}

try {
  const [planFile, matrixFile, outputFile] = process.argv.slice(2);
  if (!planFile || !matrixFile || !outputFile) {
    throw new Error('USAGE: reconcile-initial-plan-prose.js <plan-draft.md> <matrix.json> <output.md>');
  }
  const markdown = fs.readFileSync(planFile, 'utf8');
  const matrix = JSON.parse(fs.readFileSync(matrixFile, 'utf8'));
  if (!Array.isArray(matrix.scope_allow) || !Array.isArray(matrix.modified_modules) || !Array.isArray(matrix.rows)) {
    fail('INITIAL_PLAN_SCOPE_RECONCILIATION', 'matrice impact incomplète');
  }
  const scope = [...new Set(matrix.scope_allow)].sort();
  if (scope.length !== matrix.scope_allow.length) fail('INITIAL_PLAN_SCOPE_RECONCILIATION', 'scope machine dupliqué');
  const required = new Set();
  for (const module of matrix.modified_modules) if (TEST_PATH.test(module.path)) required.add(module.path);
  for (const row of matrix.rows) if (row.classification === 'TEST_MUST_ADAPT') required.add(row.path);

  let reconciled = replaceScopeSection(markdown, scope);
  reconciled = appendMissingRequiredTests(reconciled, [...required].sort());
  fs.writeFileSync(outputFile, reconciled.endsWith('\n') ? reconciled : reconciled + '\n', 'utf8');
  process.stdout.write(`[KODJO_V2] initial plan prose reconciled — scope=${scope.length} tests=${required.size}\n`);
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
