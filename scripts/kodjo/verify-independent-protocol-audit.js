#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_MATRIX_IDS = 64;

function fail(code, detail) { throw new Error(code + (detail ? ': ' + detail : '')); }

function verify(text) {
  const body = String(text || '').replace(/\r\n/g, '\n');
  const verdicts = [...body.matchAll(/^VERDICT:\s*(APPROVE|REVISE)\s*$/gm)].map((m) => m[1]);
  if (verdicts.length !== 1) fail('INDEPENDENT_AUDIT_VERDICT_MISSING_OR_DUPLICATED');
  const blocks = [...body.matchAll(/<KODJO_INDEPENDENT_PROTOCOL_AUDIT_JSON>\s*([\s\S]*?)\s*<\/KODJO_INDEPENDENT_PROTOCOL_AUDIT_JSON>/g)];
  if (blocks.length !== 1) fail('INDEPENDENT_AUDIT_JSON_MISSING_OR_DUPLICATED');
  let data;
  try { data = JSON.parse(blocks[0][1]); } catch (error) { fail('INDEPENDENT_AUDIT_JSON_INVALID', error.message); }
  if (!data || data.schema !== 'kodjo.protocol-independent-audit.v1') fail('INDEPENDENT_AUDIT_SCHEMA_INVALID');
  if (data.verdict !== verdicts[0]) fail('INDEPENDENT_AUDIT_VERDICT_MISMATCH');
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
  if (data.verdict === 'APPROVE' && data.blocking_findings !== 0) fail('INDEPENDENT_AUDIT_APPROVE_WITH_BLOCKING');
  if (data.verdict === 'APPROVE' && data.matrix_ids_not_covered !== 0) fail('INDEPENDENT_AUDIT_APPROVE_WITH_UNCOVERED');
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
