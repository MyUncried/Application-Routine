'use strict';

const V = require('./vnext-contract');
const { execFileSync } = require('node:child_process');

function extractNormativeUnits(source) {
  const units = [];
  let block = [], start = null, code = false;
  function flush() {
    if (block.length) units.push({ source_line: start, source_text: block.join('\n') });
    block = []; start = null;
  }
  source.split('\n').forEach((line, index) => {
    if (line.startsWith('```')) {
      if (!code) { flush(); start = index + 1; block.push(line); code = true; }
      else { block.push(line); flush(); code = false; }
    } else if (code) block.push(line);
    else if (!line.trim() || line.startsWith('#')) flush();
    else { if (start === null) start = index + 1; block.push(line); }
  });
  flush();
  return units;
}

function readSourcesAtRevision(matrix, { cwd, revision = 'HEAD' }) {
  if (matrix.register_path !== '.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md'
      || matrix.normative_path !== '.github/AI_ORCHESTRATION.md') V.fail('VNEXT_HISTORY_SOURCE_PATH_INVALID');
  const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  const tree = git(['rev-parse', revision + '^{tree}']).trim();
  return { register: git(['show', tree + ':' + matrix.register_path]),
    normativeSource: git(['show', tree + ':' + matrix.normative_path]) };
}

function interpretSourceRow(source, prefix) {
  const cells = source.replace(/^\|\s*|\s*\|$/g, '').split('|').map(cell => cell.trim());
  if (prefix === 'INC' && cells.length === 16) return {
    resulting_rule: cells[9], historical_test_description: cells[10], historical_evidence: cells[7],
    historical_result: cells[11], historical_lifecycle: cells[13],
  };
  if (prefix === 'T' && cells.length === 8) return {
    control_object: cells[3], scenario: cells[4], expected_result: cells[5],
    historical_result: cells[6], historical_evidence: cells[7],
  };
  if (prefix === 'T' && cells.length === 9) return {
    control_object: cells[3], scenario: cells[4], expected_result: cells[5],
    historical_result: cells[7], historical_evidence: cells[6], historical_incident_refs: cells[8],
  };
  if (prefix === 'T' && cells.length === 6) return {
    control_object: cells[2], scenario: cells[3], expected_result: null,
    historical_result: cells[4], historical_evidence: cells[5],
  };
  V.fail('VNEXT_HISTORY_SOURCE_LAYOUT_UNSUPPORTED', cells[0]);
}

function validateInventory(matrix, { register, normativeSource }) {
  if (matrix.schema_version !== 'kodjo.vnext.historical-disposition.v1') V.fail('VNEXT_HISTORY_SCHEMA_INVALID');
  if (matrix.register_sha256 !== V.sha256(register) || matrix.normative_sha256 !== V.sha256(normativeSource)) V.fail('VNEXT_HISTORY_SOURCE_CHANGED');
  for (const [key, prefix, count] of [['incidents', 'INC', 169], ['tests', 'T', 142]]) {
    const sourceIds = [...register.matchAll(new RegExp('^\\| (' + prefix + '-\\d{3}) \\|', 'gm'))].map(row => row[1]);
    const expected = Array.from({ length: count }, (_, i) => prefix + '-' + String(i + 1).padStart(3, '0'));
    if (V.canonicalStringify(sourceIds) !== V.canonicalStringify(expected)
        || V.canonicalStringify(matrix[key].map(row => row.id)) !== V.canonicalStringify(expected)) V.fail('VNEXT_HISTORY_INDIVIDUAL_IDS_INCOMPLETE', key);
    for (const row of matrix[key]) {
      const source = register.split('\n')[row.source_line - 1];
      if (!source?.startsWith('| ' + row.id + ' |')) V.fail('VNEXT_HISTORY_SOURCE_ROW_MISMATCH', row.id);
      if (row.source_row !== source || row.source_row_hash !== V.sha256(source)) V.fail('VNEXT_HISTORY_SOURCE_ROW_CONTENT_MISMATCH', row.id);
      for (const [field, value] of Object.entries(interpretSourceRow(source, prefix))) {
        if (row[field] !== value) V.fail('VNEXT_HISTORY_SOURCE_INTERPRETATION_MISMATCH', row.id + ':' + field);
      }
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
  const actualUnits = matrix.normative_paragraphs.map(({ source_line, source_text }) => ({ source_line, source_text }))
    .sort((a, b) => a.source_line - b.source_line);
  if (V.canonicalStringify(actualUnits) !== V.canonicalStringify(extractNormativeUnits(normativeSource))) {
    V.fail('VNEXT_HISTORY_NORMATIVE_COVERAGE_INCOMPLETE');
  }
  return true;
}

function assertHistoricalReady(matrix, sources, { resolveEvidence, candidateHead } = {}) {
  validateInventory(matrix, sources);
  const open = [...matrix.incidents, ...matrix.tests, ...matrix.normative_paragraphs]
    .filter(row => row.individual_equivalence_proven !== true || row.status !== 'CONFORME');
  if (open.length) V.fail('VNEXT_HISTORY_INDIVIDUAL_COVERAGE_NOT_READY', open.map(row => row.id).join(','));
  V.assertSha40(candidateHead, 'VNEXT_HISTORY_CANDIDATE_HEAD_REQUIRED');
  if (typeof resolveEvidence !== 'function') V.fail('VNEXT_HISTORY_EVIDENCE_RESOLVER_REQUIRED');
  for (const row of [...matrix.incidents, ...matrix.tests, ...matrix.normative_paragraphs]) {
    if (!Array.isArray(row.qualification_evidence) || row.qualification_evidence.length === 0) {
      V.fail('VNEXT_HISTORY_QUALIFICATION_EVIDENCE_REQUIRED', row.id);
    }
    for (const evidence of row.qualification_evidence) {
      const resolved = resolveEvidence(evidence, row);
      if (!resolved || resolved.status !== 'VERIFIED' || resolved.candidate_head !== candidateHead
          || resolved.subject_id !== row.id || !resolved.scenario || !resolved.result_ref) {
        V.fail('VNEXT_HISTORY_QUALIFICATION_EVIDENCE_UNVERIFIED', row.id);
      }
    }
  }
  return true;
}

module.exports = { extractNormativeUnits, interpretSourceRow, readSourcesAtRevision, validateInventory, assertHistoricalReady };
