#!/usr/bin/env node
'use strict';
// Claude Code piloting variant: a guarded entry point in front of the unchanged
// VNext engine (vnext-chain.js). It only reads GitHub; it never posts, reacts,
// commits or pushes. Owner approvals and designations stay with the owner.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const Pilot = require('./lib/vnext-pilot-designation');

const ENGINE = path.join(__dirname, 'vnext-chain.js');
const STAGES = Object.freeze(['launch', 'produce', 'review', 'recover-review', 'prepare-implementation-review',
  'implementation-review', 'verify-implementation-review', 'prepare', 'reserve-gate', 'finalize-transport',
  'request-approval', 'handoff', 'admit', 'validate-publication']);
// Stages that create or publish the owner gate need an independent plan review first.
const GATE_STAGES = Object.freeze(['reserve-gate', 'request-approval']);
const USAGE = 'Usage: claude-pilot.js status <SLICE> | designation-body <SLICE> <CLAUDE_CODE|CHATGPT_WORK> <checkpoint_commit>'
  + ' | run <SLICE> [--independent-plan-review=<comment_id>] <stage> <config> [output]';

function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); }
function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw Error('PILOT_GIT_READ_FAILED');
  return result.stdout;
}

// The prepared chain whose contract_hash the gate reservation and approval carry.
function preparedForGate(stage, config, cwd) {
  if (stage === 'reserve-gate') return read(path.resolve(cwd, config.prepared_file));
  const head = git(cwd, ['rev-parse', 'HEAD']).trim();
  const bootstrap = JSON.parse(git(cwd, ['show', head + ':' + config.bootstrap_file]));
  return JSON.parse(git(cwd, ['show', head + ':' + bootstrap.vnext_chain_file]));
}

function run(sliceId, rest, { cwd, github, routeSlice, invoke }) {
  let reviewId = null;
  if (rest[0] && rest[0].startsWith('--independent-plan-review=')) reviewId = rest.shift().split('=')[1];
  const [stage, configFile, output] = rest;
  if (!STAGES.includes(stage) || !configFile) throw Error('PILOT_STAGE_INVALID');
  const current = Pilot.assertPilot('CLAUDE_CODE', sliceId, { cwd, github, routeSlice });
  let review = null;
  if (GATE_STAGES.includes(stage)) {
    if (!/^[1-9][0-9]*$/.test(String(reviewId || ''))) throw Error('PILOT_INDEPENDENT_PLAN_REVIEW_REQUIRED');
    const prepared = preparedForGate(stage, read(path.resolve(cwd, configFile)), cwd);
    const bootstrap = JSON.parse(git(cwd, ['show', current.head + ':' + Pilot.bootstrapFile(sliceId)]));
    review = Pilot.verifyIndependentPlanReview(github.comment(bootstrap.repository, reviewId),
      { repository: bootstrap.repository, issueNumber: bootstrap.issue_number, sliceId, preparedChainHash: prepared.contract_hash });
  }
  const args = [ENGINE, stage, configFile, ...(output ? [output] : [])];
  const status = invoke(process.execPath, args, cwd);
  return { slice_id: sliceId, pilot: current.pilot, designation_sequence: current.sequence, stage,
    independent_plan_review: review, engine_exit_code: status };
}

function main(argv = process.argv.slice(2), deps = {}) {
  const cwd = deps.cwd || process.cwd();
  const github = deps.github || require('./verify-authorizations').ghClient();
  const invoke = deps.invoke || ((command, args, dir) => {
    const result = spawnSync(command, args, { cwd: dir, stdio: 'inherit', windowsHide: true });
    return result.status === null ? 1 : result.status;
  });
  const [command, sliceId, ...rest] = argv;
  if (!sliceId) throw Error(USAGE);
  if (command === 'status') return Pilot.resolve(sliceId, { cwd, github, routeSlice: deps.routeSlice });
  if (command === 'designation-body') {
    const current = Pilot.resolve(sliceId, { cwd, github, routeSlice: deps.routeSlice });
    const [toPilot, checkpointCommit] = rest;
    if (!Pilot.PILOTS.includes(toPilot) || toPilot === current.pilot || !/^[0-9a-f]{40}$/.test(String(checkpointCommit || ''))) throw Error('PILOT_DESIGNATION_REQUEST_INVALID');
    return { body: Pilot.designationBody({ sliceId, sequence: (current.sequence || 0) + 1, fromPilot: current.pilot,
      toPilot, checkpointCommit }) };
  }
  if (command === 'run') return run(sliceId, rest, { cwd, github, routeSlice: deps.routeSlice, invoke });
  throw Error(USAGE);
}

if (require.main === module) {
  try {
    const result = main();
    process.stdout.write((result.body !== undefined ? result.body : JSON.stringify(result)) + '\n');
    if (result.engine_exit_code) process.exitCode = result.engine_exit_code;
  } catch (error) { process.stderr.write(String(error.message) + '\n'); process.exitCode = 78; }
}
module.exports = { main, run, STAGES, GATE_STAGES };
