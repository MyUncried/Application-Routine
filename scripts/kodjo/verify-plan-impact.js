#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildReviewProof, verifyPlanAtRevision } = require('./lib/plan-impact');

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
try {
  const [planFile, sourceHead, scanOutput, reviewOutput, reviewFile] = process.argv.slice(2);
  if (!planFile || !sourceHead || !scanOutput) {
    throw new Error('USAGE: verify-plan-impact.js <plan.md> <source_head> <replay.json> [review-proof.json] [review.md]');
  }
  const verified = verifyPlanAtRevision({
    cwd: process.cwd(), sourceHead,
    planMarkdown: fs.readFileSync(planFile, 'utf8'),
    reviewMarkdown: reviewFile ? fs.readFileSync(reviewFile, 'utf8') : undefined,
  });
  writeJson(scanOutput, verified.replay_scan);
  if (reviewOutput) writeJson(reviewOutput, buildReviewProof(verified));
  process.stdout.write('[KODJO_V2] plan impact verified — ' + verified.scan_sha256 + '\n');
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
