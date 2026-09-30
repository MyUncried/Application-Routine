#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

function fail(code, detail) { throw new Error(code + (detail ? ': ' + detail : '')); }

function closeRegistry(registry, input) {
  if (!registry || !Array.isArray(registry.activations)) fail('ACTIVATION_REGISTRY_INVALID');
  const matches = registry.activations.filter((x) => x && x.slice_id === input.slice_id);
  if (matches.length !== 1) fail(matches.length ? 'ACTIVATION_REGISTRY_DUPLICATE' : 'SLICE_NOT_ACTIVATED');
  const activation = matches[0];
  if (Number(activation.issue_number) !== Number(input.issue_number)) fail('CLOSURE_ISSUE_MISMATCH');
  const closure = {
    final_head: String(input.final_head),
    implementation_review_comment_id: String(input.implementation_review_comment_id),
    visual_approval_comment_id: String(input.visual_approval_comment_id),
  };
  if (activation.status === 'CLOSED') {
    const existing = activation.closure || {};
    for (const key of Object.keys(closure)) {
      if (String(existing[key] || '') !== closure[key]) fail('CLOSURE_ALREADY_CLOSED_WITH_DIFFERENT_EVIDENCE', key);
    }
    return { changed: false, registry, closure };
  }
  if (activation.status !== 'ACTIVE') fail('CLOSURE_STATUS_INVALID', String(activation.status));
  activation.status = 'CLOSED';
  activation.closure = closure;
  return { changed: true, registry, closure };
}

if (require.main === module) {
  try {
    const [inputFile, outputFile, slice, issue, head, review, visual] = process.argv.slice(2);
    if (!inputFile || !outputFile || !slice || !issue || !/^[0-9a-f]{40}$/.test(String(head || '')) ||
        !/^[1-9][0-9]*$/.test(String(review || '')) || !/^[1-9][0-9]*$/.test(String(visual || ''))) {
      fail('USAGE_INVALID');
    }
    const registry = JSON.parse(fs.readFileSync(inputFile, 'utf8').replace(/^\uFEFF/, ''));
    const result = closeRegistry(registry, {
      slice_id: slice, issue_number: Number(issue), final_head: head,
      implementation_review_comment_id: review, visual_approval_comment_id: visual,
    });
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2) + '\n', 'utf8');
    process.stdout.write('[KODJO_V2] activation closure ' + (result.changed ? 'prepared' : 'already closed') + ' — slice=' + slice + '\n');
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { closeRegistry };
