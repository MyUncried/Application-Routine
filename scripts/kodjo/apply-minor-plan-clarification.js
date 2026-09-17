#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { canonicalJson, extractTaggedJson, fail } = require('./lib/plan-impact');

const TAGS = [
  'KODJO_MODIFIED_MODULES_JSON',
  'KODJO_PLAN_DECISIONS_JSON',
  'KODJO_PLAN_IMPACT_JSON',
  'KODJO_PLAN_CONTRACT_JSON',
];
const PROTECTED = /KODJO_|scope_allow|modified_modules|PLAN_STATUS|STATUT\s*:|source_head=|planning_contract=|(?:^|\s)(?:app|src)\//i;

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function parseSourceComment(body) {
  const normalized = String(body).replace(/\r\n/g, '\n');
  if (!/^\[KODJO_V2\] PLAN_OUTPUT\n/m.test(normalized)) fail('MINOR_CLARIFICATION_SOURCE_INVALID', 'PLAN_OUTPUT absent');
  const status = normalized.match(/^STATUT\s*:\s*([^\n]+)$/m);
  if (!status) fail('MINOR_CLARIFICATION_SOURCE_INVALID', 'STATUT absent');
  const headerEnd = normalized.indexOf('\n\n', status.index + status[0].length);
  if (headerEnd < 0) fail('MINOR_CLARIFICATION_SOURCE_INVALID', 'separation entete/plan absente');
  return {
    header: normalized.slice(0, headerEnd),
    markdown: normalized.slice(headerEnd + 2),
    status: status[1].trim(),
  };
}

function taggedBlock(markdown, tag) {
  const re = new RegExp('<' + tag + '>\\s*([\\s\\S]*?)\\s*</' + tag + '>', 'g');
  const matches = [...String(markdown).matchAll(re)];
  if (matches.length !== 1) fail('MINOR_CLARIFICATION_MACHINE_CONTRACT_INVALID', tag + ' attendu exactement une fois');
  return { full: matches[0][0], json: extractTaggedJson(markdown, tag) };
}

function replaceOutsideMachineBlocks(markdown, fromText, toText) {
  let cursor = 0;
  let count = 0;
  let output = '';
  const blocks = [];
  for (const tag of TAGS) {
    const re = new RegExp('<' + tag + '>[\\s\\S]*?</' + tag + '>', 'g');
    for (const match of String(markdown).matchAll(re)) blocks.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
  }
  blocks.sort((a, b) => a.start - b.start);
  for (let i = 1; i < blocks.length; i += 1) {
    if (blocks[i].start < blocks[i - 1].end) fail('MINOR_CLARIFICATION_MACHINE_CONTRACT_INVALID', 'blocs machine chevauchants');
  }
  const replaceChunk = (chunk) => {
    const pieces = chunk.split(fromText);
    count += pieces.length - 1;
    return pieces.join(toText);
  };
  for (const block of blocks) {
    output += replaceChunk(String(markdown).slice(cursor, block.start));
    output += block.text;
    cursor = block.end;
  }
  output += replaceChunk(String(markdown).slice(cursor));
  return { output, count };
}

try {
  const [sourceCommentFile, sourceHead, sourcePlanId, clarificationCommentId, fromText, toText, expectedRaw, outputPlan, outputProof] = process.argv.slice(2);
  if (!sourceCommentFile || !sourceHead || !sourcePlanId || !clarificationCommentId || fromText === undefined || toText === undefined || !expectedRaw || !outputPlan || !outputProof) {
    throw new Error('USAGE: apply-minor-plan-clarification.js <source-comment.md> <source_head> <source_plan_id> <clarification_comment_id> <from_text> <to_text> <expected_occurrences> <output-plan.md> <output-proof.json>');
  }
  if (!/^[0-9a-f]{40}$/i.test(sourceHead)) fail('MINOR_CLARIFICATION_SOURCE_INVALID', 'source_head invalide');
  if (!/^\d+$/.test(sourcePlanId) || !/^\d+$/.test(clarificationCommentId)) fail('MINOR_CLARIFICATION_SOURCE_INVALID', 'comment id invalide');
  const expected = Number(expectedRaw);
  if (!Number.isInteger(expected) || expected < 1 || expected > 50) fail('MINOR_CLARIFICATION_REPLACEMENT_INVALID', 'expected_occurrences hors borne');
  for (const [label, value] of [['from_text', fromText], ['to_text', toText]]) {
    if (!value || value.length > 200 || /[\r\n]/.test(value)) fail('MINOR_CLARIFICATION_REPLACEMENT_INVALID', label + ' invalide');
    if (PROTECTED.test(value)) fail('MINOR_CLARIFICATION_REPLACEMENT_INVALID', label + ' touche un marqueur protege');
  }
  if (fromText === toText) fail('MINOR_CLARIFICATION_REPLACEMENT_INVALID', 'remplacement identique');

  const sourceBody = fs.readFileSync(sourceCommentFile, 'utf8').replace(/^\uFEFF/, '');
  const source = parseSourceComment(sourceBody);
  if (!['PLAN_READY_FOR_INDEPENDENT_REVIEW', 'CLARIFICATION_REQUIRED'].includes(source.status)) {
    fail('MINOR_CLARIFICATION_SOURCE_INVALID', 'statut source non admissible: ' + source.status);
  }

  const beforeBlocks = new Map();
  for (const tag of TAGS) {
    if (tag === 'KODJO_PLAN_DECISIONS_JSON' && !source.markdown.includes('<' + tag + '>')) continue;
    beforeBlocks.set(tag, taggedBlock(source.markdown, tag));
  }
  for (const required of ['KODJO_MODIFIED_MODULES_JSON', 'KODJO_PLAN_IMPACT_JSON', 'KODJO_PLAN_CONTRACT_JSON']) {
    if (!beforeBlocks.has(required)) fail('MINOR_CLARIFICATION_MACHINE_CONTRACT_INVALID', required + ' requis pour le fast path');
  }

  const replaced = replaceOutsideMachineBlocks(source.markdown, fromText, toText);
  if (replaced.count !== expected) {
    fail('MINOR_CLARIFICATION_OCCURRENCE_MISMATCH', 'expected=' + expected + ' actual=' + replaced.count);
  }
  const patched = replaced.output;

  for (const [tag, before] of beforeBlocks.entries()) {
    const after = taggedBlock(patched, tag);
    if (canonicalJson(before.json) !== canonicalJson(after.json)) {
      fail('MINOR_CLARIFICATION_MACHINE_CONTRACT_CHANGED', tag + ' a change');
    }
  }

  fs.mkdirSync(path.dirname(path.resolve(outputPlan)), { recursive: true });
  fs.writeFileSync(outputPlan, patched.endsWith('\n') ? patched : patched + '\n', 'utf8');
  const impact = beforeBlocks.get('KODJO_PLAN_IMPACT_JSON').json;
  const contract = beforeBlocks.get('KODJO_PLAN_CONTRACT_JSON').json;
  const proof = {
    schema: 'kodjo.minor-plan-clarification.v1',
    source_head: sourceHead.toLowerCase(),
    source_plan_comment_id: Number(sourcePlanId),
    clarification_comment_id: Number(clarificationCommentId),
    clarification_kind: 'LITERAL_REPLACEMENT',
    from_sha256: sha256Text(fromText),
    to_sha256: sha256Text(toText),
    expected_occurrences: expected,
    actual_occurrences: replaced.count,
    prior_plan_sha256: sha256Text(source.markdown),
    revised_plan_sha256: sha256Text(patched),
    machine_contract_unchanged: true,
    impact_scope_sha256: sha256Text(canonicalJson(impact.scope_allow || [])),
    write_scope_sha256: sha256Text(canonicalJson(contract.write_scope || [])),
  };
  fs.mkdirSync(path.dirname(path.resolve(outputProof)), { recursive: true });
  fs.writeFileSync(outputProof, JSON.stringify(proof, null, 2) + '\n', 'utf8');
  process.stdout.write('[KODJO_V2] minor clarification applied — occurrences=' + replaced.count + '\n');
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
