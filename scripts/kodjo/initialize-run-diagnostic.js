#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function currentRun(stateRoot, env = process.env) {
  const githubRunId = String(env.GITHUB_RUN_ID || 'local');
  const attempt = String(env.GITHUB_RUN_ATTEMPT || '1');
  const runId = 'github-' + githubRunId + '-' + attempt;
  return { runId, runDir: path.join(stateRoot, 'runs', runId), githubRunId, attempt };
}

function initialize(stateRoot, env = process.env) {
  const current = currentRun(stateRoot, env);
  fs.mkdirSync(current.runDir, { recursive: true });
  const context = { schema_version: 'kodjo.protocol.v2.run-context.0.6.17', run_id: current.runId, github_run_id: current.githubRunId, github_run_attempt: current.attempt, created_at: new Date().toISOString() };
  fs.writeFileSync(path.join(current.runDir, 'run-context.json'), JSON.stringify(context, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(current.runDir, 'result.json'), JSON.stringify({ ...context, status: 'PRE_INVOCATION', claude_invoked: false, diagnostic: 'RUN_INITIALIZED' }, null, 2) + '\n', 'utf8');
  return current;
}

if (require.main === module) {
  const stateRoot = process.env.KODJO_STATE_ROOT ? path.resolve(process.env.KODJO_STATE_ROOT) : path.join(os.homedir(), '.kodjo-v2');
  process.stdout.write(initialize(stateRoot).runDir + '\n');
}
module.exports = { currentRun, initialize };

