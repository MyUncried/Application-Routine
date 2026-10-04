#!/usr/bin/env node
'use strict';
// Mechanical bound of a generic closure review (a corrected plan published with its prior REVISE
// findings, recover-published-plan.js closureInputs): the reviewer may only close or keep open the N
// prior findings. A regression caused by a correction is admissible only as non-closure of the
// finding whose correction caused it. A row outside the N targets, a row changing the blocking status
// of its prior finding, a missing or duplicated closure entry, or a closure record contradicting the
// structured findings fails the run instead of being published. Same contract as the PRE-1 bound
// (verify-pre1-closure-review.js), generalized to non-blocking prior observations.
const fs = require('node:fs');
const { tableNumbers } = require('./verify-pre1-closure-review');
function need(ok, code) { if (!ok) throw new Error(code); }
function closureJson(markdown, count) {
  const m = [...String(markdown).matchAll(/<KODJO_CLOSURE_JSON>\s*([\s\S]*?)\s*<\/KODJO_CLOSURE_JSON>/g)];
  need(m.length === 1, 'CLOSURE_JSON_MISSING_OR_DUPLICATED');
  const value = JSON.parse(m[0][1]);
  need(Array.isArray(value.closures) && value.closures.length === count, 'CLOSURE_JSON_COUNT_INVALID');
  const rows = new Map();
  for (const r of value.closures) {
    need(Number.isInteger(r.finding) && r.finding >= 1 && r.finding <= count, 'CLOSURE_JSON_NUMBER_INVALID');
    need(!rows.has(r.finding), 'CLOSURE_JSON_DUPLICATED:' + r.finding);
    need(typeof r.closed === 'boolean', 'CLOSURE_JSON_CLOSED_INVALID:' + r.finding);
    for (const k of ['correction_examined', 'evidence', 'justification']) need(typeof r[k] === 'string' && r[k].trim(), 'CLOSURE_JSON_FIELD_MISSING:' + r.finding + ':' + k);
    rows.set(r.finding, r.closed);
  }
  return rows;
}
function verify(reviewMarkdown, normalized, prior) {
  need(Array.isArray(prior.findings) && prior.findings.length >= 1, 'CLOSURE_PRIOR_FINDINGS_INVALID');
  const count = prior.findings.length;
  const key = (f) => f.target_kind + '\u0000' + f.target;
  // Two prior findings may share a target (distinct defects of one criterion): the row is identified by its
  // « Prior finding N » number, which must designate a prior finding with exactly this target.
  const numbersOf = new Map();
  prior.findings.forEach((f, i) => numbersOf.set(key(f), [...(numbersOf.get(key(f)) || []), i + 1]));
  const open = new Set();
  for (const f of normalized.findings) {
    const candidates = numbersOf.get(key(f));
    need(candidates, 'CLOSURE_FINDING_OUTSIDE_BOUND:' + f.target_kind + ':' + f.target);
    const m = /^Prior finding ([1-9][0-9]*)\b/.exec(String(f.diagnostic || ''));
    const n = m ? Number(m[1]) : candidates.length === 1 ? candidates[0] : 0;
    need(candidates.includes(n), 'CLOSURE_FINDING_NUMBER_MISMATCH:' + (n || candidates.join('|')));
    need(f.blocking === prior.findings[n - 1].blocking, 'CLOSURE_BLOCKING_STATUS_CHANGED:' + n);
    need(f.category === prior.findings[n - 1].category, 'CLOSURE_CATEGORY_CHANGED:' + n);
    need(new RegExp('^Prior finding ' + n + '\\b').test(f.diagnostic), 'CLOSURE_FINDING_NUMBER_MISMATCH:' + n);
    need(!open.has(n), 'CLOSURE_FINDING_DUPLICATED:' + n);
    open.add(n);
  }
  const rows = closureJson(reviewMarkdown, count);
  for (let n = 1; n <= count; n++) need(rows.get(n) === !open.has(n), 'CLOSURE_CONTRADICTS_FINDINGS:' + n);
  const table = tableNumbers(reviewMarkdown);
  need(table.length === count && new Set(table).size === count && table.every((n) => n >= 1 && n <= count), 'CLOSURE_TABLE_ROW_COUNT_INVALID:' + table.join(','));
  // Same derivation as lib/review-findings.js: a blocking row or an open CLARIFICATION keeps REVISE.
  const verdict = [...open].some((n) => prior.findings[n - 1].blocking || prior.findings[n - 1].category === 'CLARIFICATION') ? 'REVISE' : 'APPROVE';
  need(verdict === normalized.verdict, 'CLOSURE_VERDICT_MISMATCH');
  const closed = [...Array(count).keys()].map((i) => i + 1).filter((n) => !open.has(n));
  return { schema: 'kodjo.plan-closure-bound.v1', item_count: count, verdict, closed, open: [...open].sort((a, b) => a - b) };
}
if (require.main === module) {
  try {
    const [review, normalized, prior, out] = process.argv.slice(2);
    need(review && normalized && prior && out, 'USAGE: verify-plan-closure-review.js <review.md> <findings.json> <prior.json> <out.json>');
    const read = (p) => fs.readFileSync(p, 'utf8').replace(/^﻿/, '');
    const result = verify(read(review), JSON.parse(read(normalized)), JSON.parse(read(prior)));
    fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n', 'utf8');
    process.stdout.write('[KODJO_V2] closure bound verified — items=' + result.item_count + ' closed=' + result.closed.length + ' open=' + (result.open.join(',') || 'none') + ' verdict=' + result.verdict + '\n');
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { verify, closureJson };
