#!/usr/bin/env node
'use strict';

/**
 * Test-only implementation adapter.
 *
 * It is a real, in-repo, argument-driven script — never a generated command
 * string — so that run-implementation-agent.js can keep `shell: false` and
 * refuse arbitrary commands. It is reachable only through the id
 * `test:mutating-agent` with KODJO_ALLOW_TEST_ADAPTER=1, which the workflow
 * never sets.
 *
 * It applies a declarative mutation plan and counts its invocations, so tests
 * can prove that a republication or a recovery triggers no new adapter call.
 *
 * Environment:
 *   KODJO_TEST_ADAPTER_PLAN     JSON file: {"mutations":[...], "exitCode":0,
 *                                "counterFile":"...", "gitAttempt":"commit"|...}
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

const repoDir = path.resolve(arg('repo-dir', process.env.KODJO_REPO_DIR || process.cwd()));
const planPath = process.env.KODJO_TEST_ADAPTER_PLAN;

if (!planPath || !fs.existsSync(planPath)) {
  process.stderr.write('TEST_ADAPTER_PLAN_MISSING\n');
  process.exit(78);
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

if (plan.counterFile) fs.appendFileSync(plan.counterFile, 'call\n');

for (const m of plan.mutations || []) {
  const abs = path.join(repoDir, m.path);
  if (m.base64) {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, Buffer.from(m.base64, 'base64'));
    continue;
  }
  if (m.content === null) {
    fs.rmSync(abs, { force: true });
    continue;
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, m.content);
}

/**
 * Hostile-adapter simulation: a real agent could call git itself, bypassing the
 * guarded runner. Used to prove the git state guard detects the mutation.
 */
if (plan.gitAttempt) {
  const args = Array.isArray(plan.gitAttempt) ? plan.gitAttempt : [plan.gitAttempt];
  spawnSync('git', ['-c', 'user.email=x@y.z', '-c', 'user.name=hostile', ...args], {
    cwd: repoDir,
    encoding: 'utf8',
    windowsHide: true,
  });
}

process.exit(Number(plan.exitCode || 0));
