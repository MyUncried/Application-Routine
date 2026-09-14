#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  SCAN_SCHEMA, MATRIX_SCHEMA, CLASSIFICATIONS,
  canonicalJson, extractTaggedJson, fail, normalizeModules, normalizeRepoPath, sha256,
} = require('./lib/plan-impact');

const DECISIONS_TAG = 'KODJO_PLAN_DECISIONS_JSON';
const MATRIX_TAG = 'KODJO_PLAN_IMPACT_JSON';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function exactDecisionKeys(decision, candidatePath) {
  const actual = Object.keys(decision || {}).sort();
  const expected = ['classification', 'justification', 'path'];
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    fail('PLAN_SCOPE_CONTRADICTION', 'champs de decision invalides: ' + candidatePath);
  }
}

function collectDecisions(planMarkdown, scan, options = {}) {
  if (!scan || scan.schema !== SCAN_SCHEMA) {
    fail('PLAN_SCOPE_CONTRADICTION', 'scan direct absent ou inconnu');
  }
  if (!Array.isArray(scan.modified_modules) || !Array.isArray(scan.candidates)) {
    fail('PLAN_SCOPE_CONTRADICTION', 'scan direct incomplet');
  }
  const decisions = extractTaggedJson(planMarkdown, DECISIONS_TAG);
  if (!Array.isArray(decisions)) fail('PLAN_SCOPE_UNCLASSIFIED', DECISIONS_TAG + ' doit etre un tableau');

  const expectedCandidates = new Map(scan.candidates.map((candidate) => [candidate.path, candidate]));
  const byPath = new Map();
  for (const decision of decisions) {
    const decisionPath = normalizeRepoPath(decision && decision.path, 'decision.path');
    exactDecisionKeys(decision, decisionPath);
    if (byPath.has(decisionPath)) fail('PLAN_SCOPE_CONTRADICTION', 'decision dupliquee: ' + decisionPath);
    const candidate = expectedCandidates.get(decisionPath);
    if (!candidate) fail('PLAN_SCOPE_CONTRADICTION', 'decision hors scan: ' + decisionPath);
    const classification = String(decision.classification || '');
    if (!CLASSIFICATIONS.includes(classification)) {
      fail('PLAN_SCOPE_UNCLASSIFIED', decisionPath + ': classification absente ou inconnue');
    }
    if (classification === 'REQUIRES_CLARIFICATION') {
      fail('PLAN_SCOPE_UNCLASSIFIED', decisionPath + ': clarification requise');
    }
    if (typeof decision.justification !== 'string' || decision.justification.trim().length === 0) {
      fail('PLAN_SCOPE_UNCLASSIFIED', decisionPath + ': justification positive absente');
    }
    if (candidate.candidate_kind === 'TEST' &&
        !['TEST_MUST_ADAPT', 'TEST_UNAFFECTED'].includes(classification)) {
      fail('PLAN_SCOPE_CONTRADICTION', decisionPath + ': classification de test incompatible');
    }
    if (candidate.candidate_kind === 'CONSUMER' &&
        !['MODIFY', 'CONSUMER_UNAFFECTED'].includes(classification)) {
      fail('PLAN_SCOPE_CONTRADICTION', decisionPath + ': classification de consommateur incompatible');
    }
    if (!options.allowModifyConsumers &&
        candidate.candidate_kind === 'CONSUMER' && classification === 'MODIFY') {
      fail('PLAN_SCOPE_NOT_CLOSED', decisionPath + ' doit rejoindre modified_modules puis le scan doit etre rejoue');
    }
    byPath.set(decisionPath, {
      classification,
      justification: decision.justification.trim(),
    });
  }
  for (const candidate of scan.candidates) {
    if (!byPath.has(candidate.path)) fail('PLAN_SCOPE_UNCLASSIFIED', 'candidat non classe: ' + candidate.path);
  }
  if (byPath.size !== scan.candidates.length) {
    fail('PLAN_SCOPE_CONTRADICTION', 'cardinalite de decisions differente du scan');
  }
  return byPath;
}

function expandModifiedRoots(planMarkdown, scan) {
  const decisions = collectDecisions(planMarkdown, scan, { allowModifyConsumers: true });
  const promoted = scan.candidates
    .filter((candidate) => candidate.candidate_kind === 'CONSUMER' &&
      decisions.get(candidate.path).classification === 'MODIFY')
    .map((candidate) => ({ path: candidate.path, change: 'MODIFY' }));
  const modifiedModules = normalizeModules([...scan.modified_modules, ...promoted]);
  return {
    closed: promoted.length === 0,
    promoted_modules: promoted.map((entry) => entry.path).sort(),
    modified_modules: modifiedModules,
  };
}

function assemblePlanImpact(planMarkdown, scan) {
  const byPath = collectDecisions(planMarkdown, scan);
  const rows = [
    ...scan.modified_modules.map((module) => ({
      path: module.path,
      candidate_kind: 'MODIFIED_MODULE',
      triggered_by: [],
      risk_score: 0,
      classification: 'MODIFY',
      justification: 'Module declare CREATE ou MODIFY dans le plan.',
    })),
    ...scan.candidates.map((candidate) => ({
      path: candidate.path,
      candidate_kind: candidate.candidate_kind,
      triggered_by: candidate.triggered_by,
      risk_score: candidate.risk_score,
      classification: byPath.get(candidate.path).classification,
      justification: byPath.get(candidate.path).justification,
    })),
  ];
  const matrix = {
    schema: MATRIX_SCHEMA,
    scan_revision: scan.scan_revision,
    modified_modules: scan.modified_modules,
    scan_sha256: sha256(scan),
    rows,
    scope_allow: rows
      .filter((row) => ['MODIFY', 'TEST_MUST_ADAPT'].includes(row.classification))
      .map((row) => row.path)
      .sort(),
  };
  const expression = new RegExp('<' + DECISIONS_TAG + '>\\s*[\\s\\S]*?\\s*</' + DECISIONS_TAG + '>');
  const matrixBlock = '<' + MATRIX_TAG + '>\n' + JSON.stringify(matrix, null, 2) + '\n</' + MATRIX_TAG + '>';
  return { matrix, markdown: String(planMarkdown).replace(expression, matrixBlock) };
}

function main(argv = process.argv.slice(2)) {
  try {
    const [command, planFile, scanFile, outputFile] = argv;
    if (!['close', 'assemble'].includes(command) || !planFile || !scanFile || !outputFile) {
      throw new Error('USAGE: assemble-plan-impact.js close|assemble <plan-with-decisions.md> <scan.json> <output>');
    }
    const markdown = fs.readFileSync(planFile, 'utf8');
    const scan = readJson(scanFile);
    if (command === 'close') {
      writeJson(outputFile, expandModifiedRoots(markdown, scan));
    } else {
      const assembled = assemblePlanImpact(markdown, scan);
      fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
      fs.writeFileSync(outputFile, assembled.markdown, 'utf8');
    }
    return 0;
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    return 1;
  }
}

if (require.main === module) process.exit(main());

module.exports = {
  DECISIONS_TAG, MATRIX_TAG, collectDecisions, expandModifiedRoots,
  assemblePlanImpact, main,
};
