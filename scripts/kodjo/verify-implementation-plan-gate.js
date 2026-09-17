#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SHA = /^[0-9a-f]{40}$/i;
const ID = /^[1-9][0-9]*$/;

function field(body, name) {
  const match = String(body || '').match(new RegExp(`^${name}=([^\\r\\n]+)\\s*$`, 'm'));
  return match ? match[1].trim() : '';
}
function status(body) {
  const match = String(body || '').match(/^STATUT\s*:\s*([^\r\n]+)\s*$/m);
  return match ? match[1].trim() : '';
}
function requireCondition(condition, code) {
  if (!condition) throw new Error(code);
}
function loadComment(file, code) {
  let value;
  try { value = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { throw new Error(code); }
  requireCondition(value && ID.test(String(value.id || '')), code);
  requireCondition(typeof value.body === 'string', code);
  requireCondition(value.user && typeof value.user.login === 'string', code);
  return value;
}
function marker(body) {
  return String(body).replace(/\r\n/g, '\n').split('\n')[0].trim();
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

try {
  const [planFile, reviewFile, userGateFile, sliceId, sourceHead, issueNumber, gitCwd, contractVerifier, impactVerifier, protocolCommit, outputFile] = process.argv.slice(2);
  requireCondition(planFile && reviewFile && userGateFile && sliceId && sourceHead && issueNumber && gitCwd && contractVerifier && impactVerifier && protocolCommit && outputFile, 'IMPLEMENTATION_PLAN_GATE_USAGE');
  requireCondition(SHA.test(sourceHead), 'IMPLEMENTATION_PLAN_SOURCE_INVALID');
  requireCondition(SHA.test(protocolCommit), 'IMPLEMENTATION_PROTOCOL_HEAD_INVALID');
  requireCondition(ID.test(String(issueNumber)), 'IMPLEMENTATION_ISSUE_INVALID');

  const plan = loadComment(planFile, 'IMPLEMENTATION_PLAN_COMMENT_INVALID');
  const review = loadComment(reviewFile, 'IMPLEMENTATION_REVIEW_COMMENT_INVALID');
  const gate = loadComment(userGateFile, 'IMPLEMENTATION_USER_GATE_COMMENT_INVALID');

  requireCondition(plan.user.login === 'github-actions[bot]', 'IMPLEMENTATION_PLAN_AUTHOR_REFUSED');
  requireCondition(marker(plan.body) === '[KODJO_V2] PLAN_OUTPUT', 'IMPLEMENTATION_PLAN_MARKER_REFUSED');
  requireCondition(field(plan.body, 'slice_id') === sliceId, 'IMPLEMENTATION_PLAN_SLICE_MISMATCH');
  requireCondition(field(plan.body, 'source_head') === sourceHead, 'IMPLEMENTATION_PLAN_SOURCE_MISMATCH');
  requireCondition(field(plan.body, 'planning_contract') === 'kodjo.plan-impact.v1', 'IMPLEMENTATION_PLAN_CONTRACT_MISSING');
  requireCondition(status(plan.body) === 'PLAN_READY_FOR_INDEPENDENT_REVIEW', 'IMPLEMENTATION_PLAN_NOT_REVIEWABLE');

  requireCondition(review.user.login === 'github-actions[bot]', 'IMPLEMENTATION_REVIEW_AUTHOR_REFUSED');
  requireCondition(marker(review.body) === '[KODJO_V2] PLAN_REVIEW_OUTPUT', 'IMPLEMENTATION_REVIEW_MARKER_REFUSED');
  requireCondition(field(review.body, 'slice_id') === sliceId, 'IMPLEMENTATION_REVIEW_SLICE_MISMATCH');
  requireCondition(field(review.body, 'source_head') === sourceHead, 'IMPLEMENTATION_REVIEW_SOURCE_MISMATCH');
  requireCondition(field(review.body, 'source_plan_comment_id') === String(plan.id), 'IMPLEMENTATION_REVIEW_PLAN_LINK_MISMATCH');
  requireCondition(field(review.body, 'verdict') === 'APPROVE', 'IMPLEMENTATION_REVIEW_NOT_APPROVED');
  requireCondition(status(review.body) === 'PLAN_REVIEW_APPROVED', 'IMPLEMENTATION_REVIEW_STATUS_REFUSED');

  requireCondition(gate.user.login === 'MyUncried', 'IMPLEMENTATION_USER_GATE_AUTHOR_REFUSED');
  requireCondition(marker(gate.body) === '[KODJO_V2] USER_IMPLEMENTATION_APPROVED', 'IMPLEMENTATION_USER_GATE_MARKER_REFUSED');
  requireCondition(field(gate.body, 'slice_id') === sliceId, 'IMPLEMENTATION_USER_GATE_SLICE_MISMATCH');
  requireCondition(field(gate.body, 'source_head') === sourceHead, 'IMPLEMENTATION_USER_GATE_SOURCE_MISMATCH');
  requireCondition(field(gate.body, 'source_plan_comment_id') === String(plan.id), 'IMPLEMENTATION_USER_GATE_PLAN_LINK_MISMATCH');
  requireCondition(field(gate.body, 'source_review_comment_id') === String(review.id), 'IMPLEMENTATION_USER_GATE_REVIEW_LINK_MISMATCH');

  const work = fs.mkdtempSync(path.join(path.dirname(path.resolve(outputFile)), 'gate-'));
  const planMarkdown = path.join(work, 'plan.md');
  const contractProof = path.join(work, 'contract.json');
  const impactReplay = path.join(work, 'impact-replay.json');
  const impactProof = path.join(work, 'impact-proof.json');
  fs.writeFileSync(planMarkdown, plan.body, 'utf8');

  let result = spawnSync(process.execPath, [impactVerifier, planMarkdown, sourceHead, impactReplay, impactProof], { cwd: gitCwd, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(`IMPLEMENTATION_PLAN_IMPACT_REFUSED: ${(result.stderr || result.stdout || '').trim()}`);
  result = spawnSync(process.execPath, [contractVerifier, planMarkdown, sourceHead, gitCwd, contractProof, 'consume', protocolCommit], { cwd: gitCwd, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(`IMPLEMENTATION_PLAN_CONTRACT_REFUSED: ${(result.stderr || result.stdout || '').trim()}`);

  const proof = {
    schema: 'kodjo.implementation-plan-gate.v1',
    status: 'PASS',
    slice_id: sliceId,
    issue_number: Number(issueNumber),
    source_head: sourceHead,
    protocol_execution_head: protocolCommit,
    plan_comment_id: Number(plan.id),
    review_comment_id: Number(review.id),
    user_gate_comment_id: Number(gate.id),
    plan_contract: JSON.parse(fs.readFileSync(contractProof, 'utf8')),
    impact_proof: JSON.parse(fs.readFileSync(impactProof, 'utf8')),
  };
  writeJson(outputFile, proof);
  process.stdout.write(`[KODJO_V2] implementation plan gate verified — plan=${plan.id} review=${review.id} user_gate=${gate.id}\n`);
} catch (error) {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n');
  process.exit(1);
}
