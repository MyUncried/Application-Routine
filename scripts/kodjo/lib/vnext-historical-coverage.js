'use strict';

const V = require('./vnext-contract');
const { execFileSync } = require('node:child_process');

function readSourcesAtRevision(matrix, { cwd, revision = 'HEAD' }) {
  if (matrix.register_path !== '.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md'
      || matrix.normative_path !== '.github/AI_ORCHESTRATION.md') V.fail('VNEXT_HISTORY_SOURCE_PATH_INVALID');
  const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  const commit = git(['rev-parse', revision + '^{commit}']).trim();
  return { register: git(['show', commit + ':' + matrix.register_path]),
    normativeSource: git(['show', commit + ':' + matrix.normative_path]) };
}

function validateInventory(matrix, { register, normativeSource }) {
  if (matrix.schema_version !== 'kodjo.vnext.historical-disposition.v1') V.fail('VNEXT_HISTORY_SCHEMA_INVALID');
  if (matrix.register_sha256 !== V.sha256(register) || matrix.normative_sha256 !== V.sha256(normativeSource)) V.fail('VNEXT_HISTORY_SOURCE_CHANGED');
  for (const [key, prefix, count] of [['incidents', 'INC', 165], ['tests', 'T', 138]]) {
    const sourceIds = [...register.matchAll(new RegExp('^\\| (' + prefix + '-\\d{3}) \\|', 'gm'))].map(row => row[1]);
    const expected = Array.from({ length: count }, (_, i) => prefix + '-' + String(i + 1).padStart(3, '0'));
    if (V.canonicalStringify(sourceIds) !== V.canonicalStringify(expected)
        || V.canonicalStringify(matrix[key].map(row => row.id)) !== V.canonicalStringify(expected)) V.fail('VNEXT_HISTORY_INDIVIDUAL_IDS_INCOMPLETE', key);
    for (const row of matrix[key]) {
      const source = register.split('\n')[row.source_line - 1];
      if (!source?.startsWith('| ' + row.id + ' |')) V.fail('VNEXT_HISTORY_SOURCE_ROW_MISMATCH', row.id);
      if (!row.remaining_correction || !row.mechanism_paths.length || !row.candidate_test_paths.length) V.fail('VNEXT_HISTORY_DISPOSITION_INCOMPLETE', row.id);
    }
  }
  const normativeLines = normativeSource.split('\n');
  const ids = new Set();
  for (const row of matrix.normative_paragraphs) {
    if (ids.has(row.id) || row.source_hash !== V.sha256(row.source_text)
        || normativeLines.slice(row.source_line - 1, row.source_line - 1 + row.source_text.split('\n').length).join('\n') !== row.source_text) V.fail('VNEXT_HISTORY_NORMATIVE_ROW_MISMATCH', row.id);
    ids.add(row.id);
  }
  return true;
}

function assertHistoricalReady(matrix, sources) {
  validateInventory(matrix, sources);
  const open = [...matrix.incidents, ...matrix.tests, ...matrix.normative_paragraphs]
    .filter(row => row.individual_equivalence_proven !== true || row.status !== 'CONFORME');
  if (open.length) V.fail('VNEXT_HISTORY_INDIVIDUAL_COVERAGE_NOT_READY', open.map(row => row.id).join(','));
  return true;
}

module.exports = { readSourcesAtRevision, validateInventory, assertHistoricalReady };
