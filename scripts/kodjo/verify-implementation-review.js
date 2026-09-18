'use strict';

const fs = require('node:fs');
const { extract } = require('./extract-plan-acceptance');

const STATUSES = new Set(['CONFORME', 'PARTIELLEMENT_CONFORME', 'NON_CONFORME', 'NON_VERIFIABLE']);

function parseReview(text) {
  const match = String(text).match(/<KODJO_IMPLEMENTATION_REVIEW_JSON>\s*([\s\S]*?)\s*<\/KODJO_IMPLEMENTATION_REVIEW_JSON>/);
  if (!match) throw new Error('KODJO_IMPLEMENTATION_REVIEW_JSON_MISSING');
  let payload;
  try { payload = JSON.parse(match[1]); } catch (_) { throw new Error('KODJO_IMPLEMENTATION_REVIEW_JSON_INVALID'); }
  return payload;
}

function verify(planText, reviewText, expectedHead) {
  const expected = extract(planText).criteria;
  const payload = parseReview(reviewText);
  if (payload.schema !== 'kodjo.protocol.v2.implementation-review.0.6.38') {
    throw new Error('KODJO_IMPLEMENTATION_REVIEW_SCHEMA_INVALID');
  }
  if (String(payload.reviewed_head || '').toLowerCase() !== String(expectedHead || '').toLowerCase()) {
    throw new Error('KODJO_IMPLEMENTATION_REVIEW_HEAD_MISMATCH');
  }
  if (payload.criteria_complete !== true) throw new Error('KODJO_IMPLEMENTATION_REVIEW_INCOMPLETE');
  if (!Array.isArray(payload.criteria) || payload.criteria.length !== expected.length) {
    throw new Error('KODJO_IMPLEMENTATION_REVIEW_CRITERIA_COUNT_MISMATCH');
  }
  let blocking = 0;
  let nonVerifiable = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const got = payload.criteria[i] || {};
    const exp = expected[i];
    if (got.id !== exp.id) throw new Error('KODJO_IMPLEMENTATION_REVIEW_CRITERION_ID_MISMATCH:' + exp.id);
    if (got.requirement !== exp.requirement) throw new Error('KODJO_IMPLEMENTATION_REVIEW_REQUIREMENT_MISMATCH:' + exp.id);
    if (!STATUSES.has(got.status)) throw new Error('KODJO_IMPLEMENTATION_REVIEW_STATUS_INVALID:' + exp.id);
    if (!Array.isArray(got.evidence) || got.evidence.length === 0 || got.evidence.some((x) => typeof x !== 'string' || !x.trim())) {
      throw new Error('KODJO_IMPLEMENTATION_REVIEW_EVIDENCE_MISSING:' + exp.id);
    }
    if (!Array.isArray(got.files)) throw new Error('KODJO_IMPLEMENTATION_REVIEW_FILES_INVALID:' + exp.id);
    if (got.status === 'PARTIELLEMENT_CONFORME' || got.status === 'NON_CONFORME') blocking += 1;
    if (got.status === 'NON_VERIFIABLE') nonVerifiable += 1;
  }
  const verdictMatch = String(reviewText).match(/^VERDICT: (APPROVE|REVISE)$/m);
  if (!verdictMatch) throw new Error('KODJO_IMPLEMENTATION_REVIEW_VERDICT_MISSING');
  const verdict = verdictMatch[1];
  if (blocking > 0 && verdict !== 'REVISE') throw new Error('KODJO_IMPLEMENTATION_REVIEW_BLOCKING_VERDICT_INVALID');
  if (blocking === 0 && verdict !== 'APPROVE') throw new Error('KODJO_IMPLEMENTATION_REVIEW_APPROVE_VERDICT_INVALID');
  if (Number(payload.blocking_count) !== blocking) throw new Error('KODJO_IMPLEMENTATION_REVIEW_BLOCKING_COUNT_MISMATCH');
  if (Number(payload.non_verifiable_count) !== nonVerifiable) throw new Error('KODJO_IMPLEMENTATION_REVIEW_NON_VERIFIABLE_COUNT_MISMATCH');
  return { verdict, blocking, non_verifiable: nonVerifiable, criteria_count: expected.length };
}

function main(argv = process.argv.slice(2)) {
  const [planFile, reviewFile, expectedHead] = argv;
  if (!planFile || !reviewFile || !expectedHead) {
    throw new Error('USAGE: verify-implementation-review.js <technical-plan.md> <review.md> <expected-head>');
  }
  const result = verify(fs.readFileSync(planFile, 'utf8'), fs.readFileSync(reviewFile, 'utf8'), expectedHead);
  process.stdout.write(JSON.stringify(result) + '\n');
}

if (require.main === module) {
  try { main(); } catch (err) { process.stderr.write(String(err.message || err) + '\n'); process.exit(1); }
}

module.exports = { parseReview, verify };
