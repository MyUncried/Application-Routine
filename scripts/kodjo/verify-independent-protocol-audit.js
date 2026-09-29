#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MATRIX_PATH = path.resolve(__dirname, '../../.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_MATRIX.md');
const matrixIds = [...fs.readFileSync(MATRIX_PATH, 'utf8').matchAll(/^\| ((?:P|D|T)-\d{2}|DET-\d{2}) \|/gm)].map(m => m[1]);
const EXPECTED_MATRIX_IDS = 64;
if (matrixIds.length !== EXPECTED_MATRIX_IDS || new Set(matrixIds).size !== EXPECTED_MATRIX_IDS) throw new Error('INDEPENDENT_AUDIT_SOURCE_MATRIX_INVALID');
const EXPECTED_IDS = new Set(matrixIds);
const MATRIX_STATUSES = new Set(['COVERED','PARTIAL','NOT_COVERED','NON_VERIFIABLE']);
// Deferrals preserve the source priority; they never silently relabel a P1 as P2.
const deferrals=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../.github/orchestration/audit-deferrals.json'),'utf8'));
const matrixText=fs.readFileSync(MATRIX_PATH,'utf8').replace(/\r\n/g,'\n');
if(deferrals.schema!=='kodjo.audit-deferrals.v1'||!Array.isArray(deferrals.entries))throw new Error('INDEPENDENT_AUDIT_DEFERRALS_INVALID');
const DEFERRED_IDS=new Set();
for(const row of deferrals.entries){
  const line=matrixText.split('\n').find(line=>line.startsWith('| '+row.id+' |'));
  if(!EXPECTED_IDS.has(row.id)||DEFERRED_IDS.has(row.id)||!row.reason||!line||(!row.id.startsWith('DET-')&&!line.endsWith('| '+row.priority+' |')))throw new Error('INDEPENDENT_AUDIT_DEFERRALS_INVALID');
  DEFERRED_IDS.add(row.id);
}

function fail(code, detail) { throw new Error(code + (detail ? ': ' + detail : '')); }

function verify(text) {
  const body = String(text || '').replace(/\r\n/g, '\n');
  // Markdown headings are presentation only; duplicates and JSON disagreement still fail.
  const verdicts = [...body.matchAll(/^(?:#{1,6}[ \t]+)?VERDICT:[ \t]*(APPROVE|REVISE)[ \t]*$/gm)].map((m) => m[1]);
  if (verdicts.length !== 1) fail('INDEPENDENT_AUDIT_VERDICT_MISSING_OR_DUPLICATED');
  const blocks = [...body.matchAll(/<KODJO_INDEPENDENT_PROTOCOL_AUDIT_JSON>\s*([\s\S]*?)\s*<\/KODJO_INDEPENDENT_PROTOCOL_AUDIT_JSON>/g)];
  if (blocks.length !== 1) fail('INDEPENDENT_AUDIT_JSON_MISSING_OR_DUPLICATED');
  let data;
  try { data = JSON.parse(blocks[0][1]); } catch (error) { fail('INDEPENDENT_AUDIT_JSON_INVALID', error.message); }
  if (!data || data.schema !== 'kodjo.protocol-independent-audit.v1') fail('INDEPENDENT_AUDIT_SCHEMA_INVALID');
  if (data.verdict !== verdicts[0]) fail('INDEPENDENT_AUDIT_VERDICT_MISMATCH');
  if (!Array.isArray(data.matrix_rows)) fail('INDEPENDENT_AUDIT_MATRIX_ROWS_MISSING');
  const observed = new Set();
  const derived = {COVERED:0,PARTIAL:0,NOT_COVERED:0,NON_VERIFIABLE:0};
  for (const row of data.matrix_rows) {
    if (!row || !EXPECTED_IDS.has(row.id) || observed.has(row.id)) fail('INDEPENDENT_AUDIT_MATRIX_ID_INVALID', String(row && row.id));
    if (!MATRIX_STATUSES.has(row.status) || typeof row.evidence !== 'string' || !row.evidence.trim()) fail('INDEPENDENT_AUDIT_MATRIX_ROW_INVALID', row.id);
    observed.add(row.id);
    derived[row.status] += 1;
  }
  if (observed.size !== EXPECTED_MATRIX_IDS) fail('INDEPENDENT_AUDIT_MATRIX_COVERAGE_INVALID', String(observed.size));
  const fields = [
    'blocking_findings','major_findings','minor_findings','matrix_ids_total',
    'matrix_ids_covered','matrix_ids_partial','matrix_ids_not_covered','matrix_ids_non_verifiable',
  ];
  for (const field of fields) {
    if (!Number.isInteger(data[field]) || data[field] < 0) fail('INDEPENDENT_AUDIT_COUNT_INVALID', field);
  }
  const sum = data.matrix_ids_covered + data.matrix_ids_partial + data.matrix_ids_not_covered + data.matrix_ids_non_verifiable;
  if (sum !== data.matrix_ids_total) fail('INDEPENDENT_AUDIT_MATRIX_COUNT_MISMATCH');
  if (data.matrix_ids_total !== EXPECTED_MATRIX_IDS) fail('INDEPENDENT_AUDIT_MATRIX_COVERAGE_INVALID', String(data.matrix_ids_total));
  for (const [field,status] of [['matrix_ids_covered','COVERED'],['matrix_ids_partial','PARTIAL'],['matrix_ids_not_covered','NOT_COVERED'],['matrix_ids_non_verifiable','NON_VERIFIABLE']]) {
    if (data[field] !== derived[status]) fail('INDEPENDENT_AUDIT_MATRIX_COUNT_MISMATCH', field);
  }
  if (data.verdict === 'APPROVE' && data.blocking_findings !== 0) fail('INDEPENDENT_AUDIT_APPROVE_WITH_BLOCKING');
  if (data.verdict === 'APPROVE' && data.matrix_rows.some(row=>row.status==='NOT_COVERED'&&!DEFERRED_IDS.has(row.id))) fail('INDEPENDENT_AUDIT_APPROVE_WITH_UNCOVERED');
  return data;
}

if (require.main === module) {
  try {
    const [input, output] = process.argv.slice(2);
    if (!input) fail('USAGE_INVALID');
    const text = fs.readFileSync(path.resolve(input), 'utf8');
    const result = verify(text);
    if (output) fs.writeFileSync(path.resolve(output), JSON.stringify(result, null, 2) + '\n', 'utf8');
    process.stdout.write('[KODJO_V2] independent protocol audit verified — verdict=' + result.verdict + ' matrix=' + result.matrix_ids_total + '\n');
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { EXPECTED_MATRIX_IDS, verify };
