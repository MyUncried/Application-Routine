'use strict';

const fs = require('node:fs');
const path = require('node:path');
const V = require('./vnext-contract');
const History = require('./vnext-historical-coverage');

function validateCorrespondence(correspondence, inventory, sources, { cwd }) {
  History.validateInventory(inventory, sources);
  if (correspondence.schema_version !== 'kodjo.vnext.historical-equivalence.v1') V.fail('VNEXT_EQ_SCHEMA');
  const originals = new Map([...inventory.incidents, ...inventory.tests, ...inventory.normative_paragraphs]
    .map(row => [row.id, row]));
  const seen = new Set(), cases = new Map();
  for (const row of correspondence.cases) {
    if (cases.has(row.id) || !/^tests\/kodjo\/[a-z0-9.-]+\.pilot\.js$/.test(row.test_path)
        || row.test_path.split('/').includes('..')) V.fail('VNEXT_EQ_CASE_INVALID');
    const text = fs.readFileSync(path.join(cwd, row.test_path), 'utf8').replace(/\r\n/g, '\n');
    if (V.sha256(text) !== row.test_source_sha256
        || !text.split('\n')[row.source_line - 1]?.includes("test('" + row.test_name + "'")) V.fail('VNEXT_EQ_CASE_SOURCE_CHANGED', row.id);
    if (row.id !== 'CASE-' + V.sha256(row.test_path + '\0' + row.test_name).slice(0, 16)) V.fail('VNEXT_EQ_CASE_ID');
    if (!row.mechanism_paths.length) V.fail('VNEXT_EQ_MECHANISM_MISSING');
    for (const file of row.mechanism_paths) {
      if (!/^(?:scripts\/kodjo\/|\.github\/workflows\/)[a-zA-Z0-9_./-]+$/.test(file)
          || file.split('/').includes('..') || !fs.statSync(path.join(cwd, file)).isFile()) V.fail('VNEXT_EQ_MECHANISM_INVALID');
    }
    cases.set(row.id, row);
  }
  for (const row of correspondence.subjects) {
    const original = originals.get(row.id);
    if (!original || seen.has(row.id) || row.source_hash !== (original.source_row_hash || original.source_hash)) V.fail('VNEXT_EQ_SUBJECT_SOURCE_CHANGED', row.id);
    if (!row.limit || row.original_scenario_replayed !== false || !row.case_ids.length
        || row.case_ids.some(id => !cases.has(id))) V.fail('VNEXT_EQ_SUBJECT_INVALID', row.id);
    seen.add(row.id);
  }
  if (seen.size !== originals.size) V.fail('VNEXT_EQ_SUBJECT_OMITTED');
  return cases;
}

function resolveExecution(correspondence, records, { candidateHead, platform }) {
  V.assertSha40(candidateHead, 'VNEXT_EQ_CANDIDATE_REQUIRED');
  const identities = records.filter(row => row.type === 'identity');
  if (identities.length !== 1 || identities[0].candidate_head !== candidateHead
      || identities[0].platform !== platform) V.fail('VNEXT_EQ_EXECUTION_IDENTITY');
  const final = records.filter(row => row.type === 'summary' && !row.file);
  if (final.length !== 1 || final[0].success !== true || final[0].counts.failed !== 0
      || final[0].counts.cancelled !== 0 || final[0].counts.todo !== 0) V.fail('VNEXT_EQ_EXECUTION_INCOMPLETE');
  const events = new Map();
  for (const row of records.filter(row => row.type === 'test')) {
    const key = row.file + '\0' + row.name + '\0' + row.line;
    if (events.has(key)) V.fail('VNEXT_EQ_EXECUTION_DUPLICATE');
    events.set(key, row);
  }
  const resolved = correspondence.cases.map(row => {
    const event = events.get(row.test_path + '\0' + row.test_name + '\0' + row.source_line);
    return { case_id: row.id, test_path: row.test_path, test_name: row.test_name,
      candidate_head: candidateHead, platform, status: event?.status || 'MISSING',
      assertion_kind: row.assertion_kind, source_sha256: row.test_source_sha256 };
  });
  return { schema_version: 'kodjo.vnext.historical-execution.v1', candidate_head: candidateHead,
    platform, counts: final[0].counts, cases: resolved,
    subjects: correspondence.subjects.map(row => {
      const assertions = resolved.filter(result => row.case_ids.includes(result.case_id));
      const passed = assertions.every(result => result.status === 'PASS');
      return { subject_id: row.id, source_hash: row.source_hash, case_ids: row.case_ids,
        mechanism_assertions_passed: passed, individual_equivalence_proven: false,
        status: row.identified_gap ? 'NONCONFORME' : passed ? 'CONTROLLED_ASSERTIONS_PASS' : 'EVIDENCE_INCOMPLETE',
        identified_gap: row.identified_gap || null, external_scenario_required: row.external_scenario_required,
        original_scenario_replayed: false, limit: row.limit };
    }),
    readiness: 'NOT_CERTIFIED_FOR_OPERATIONAL_VNEXT' };
}

module.exports = { validateCorrespondence, resolveExecution };
