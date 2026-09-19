#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { classifyResidual, requireProof } = require('./lib/qualification-availability');
const { windowsProcessSnapshot, classifyClaudeProcesses } = require('./lib/execution-lock');

function localEvidence(run, env = process.env) {
  const snapshot = windowsProcessSnapshot();
  let processScan = 'AMBIGUOUS';
  if (snapshot.state === 'OK' && Array.isArray(snapshot.rows) && snapshot.rows.length > 0) {
    const byPid = new Map(snapshot.rows.map(p => [Number(p.ProcessId), p]));
    const ours = (pid) => {
      const seen = new Set();
      while (pid > 0 && !seen.has(pid)) {
        if (pid === process.pid) return true;
        seen.add(pid); pid = Number(byPid.get(pid)?.ParentProcessId || 0);
      }
      return false;
    };
    const others = snapshot.rows.filter(p => !ours(Number(p.ProcessId)));
    const active = classifyClaudeProcesses(snapshot.rows).length > 0 || others.some(p =>
      /^claude(?:\.exe)?$/i.test(p.Name || '') ||
      /(?:[\\/]_kodjo[\\/]|kodjo-qualif(?:-resume)?-|run-queued-request|invoke-kodjo-v2)/i.test(p.CommandLine || ''));
    const unreadable = others.some(p => /^(?:node|claude)(?:\.exe)?$/i.test(p.Name || '') && !p.CommandLine);
    processScan = active ? 'ACTIVE' : unreadable ? 'AMBIGUOUS' : 'NONE';
  }
  const stateRoot = path.join(env.USERPROFILE, '.kodjo-v2');
  return {
    platform: process.platform, observedAt: Date.now(), processScan,
    lockAbsent: !fs.existsSync(path.join(stateRoot, 'claude-local.lock')),
    runDirectoryAbsent: !fs.existsSync(path.join(env.GITHUB_WORKSPACE, '_kodjo', String(run.id))),
    runStateAbsent: !fs.existsSync(path.join(stateRoot, 'runs', `github-${run.id}-${run.run_attempt}`)),
  };
}

async function checkAvailability({ api, local = localEvidence, env = process.env, now = Date.now }) {
  const prefix = `/repos/${env.GITHUB_REPOSITORY}`;
  const want = async (url) => {
    const r = await api(prefix + url);
    requireProof(r.status === 200 && r.data && typeof r.data === 'object', 'GITHUB_EVIDENCE_UNAVAILABLE');
    return r.data;
  };
  const paged = async (url, key) => {
    const rows = []; let count;
    for (let page = 1; page <= 100; page++) {
      const data = await want(`${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      requireProof(Array.isArray(data[key]) && Number.isSafeInteger(data.total_count) && data.total_count >= 0,
        'GITHUB_COLLECTION_AMBIGUOUS');
      if (count === undefined) count = data.total_count;
      requireProof(count === data.total_count, 'GITHUB_COLLECTION_CHANGED');
      rows.push(...data[key]);
      if (rows.length === count) return rows;
      requireProof(data[key].length === 100 && rows.length < count, 'GITHUB_COLLECTION_INCOMPLETE');
    }
    throw new Error('GITHUB_COLLECTION_LIMIT');
  };
  const main = async () => {
    const ref = await want('/git/ref/heads/main');
    requireProof(ref.object?.sha === env.EXPECTED_MAIN, 'MAIN_HEAD_MISMATCH');
  };
  await main();
  const current = await want(`/actions/runs/${env.GITHUB_RUN_ID}`);
  requireProof(current.head_sha === env.EXPECTED_HEAD && current.status === 'in_progress' &&
    current.path === '.github/workflows/kodjo-v2-disposable-qualification.yml', 'QUALIFICATION_RUN_IDENTITY_MISMATCH');
  const ownJobs = await paged(`/actions/runs/${env.GITHUB_RUN_ID}/jobs?filter=latest`, 'jobs');
  const own = ownJobs.filter(j => j.name === 'qualify' && j.status === 'in_progress' && j.runner_name === env.RUNNER_NAME);
  requireProof(own.length === 1 && Number.isSafeInteger(own[0].runner_id) && own[0].runner_id > 0,
    'CURRENT_RUNNER_AMBIGUOUS');
  const snapshot = async () => (await paged('/actions/workflows/kodjo-v2-lean-queue.yml/runs', 'workflow_runs'))
    .filter(r => r.status !== 'completed').sort((a,b) => a.id-b.id);
  const residuals = [];
  const first = await snapshot();
  for (const listed of first) {
    const run = await want(`/actions/runs/${listed.id}`);
    requireProof(run.id === listed.id && run.status === 'queued' &&
      run.path === '.github/workflows/kodjo-v2-lean-queue.yml', 'LEAN_ACTIVITY_OR_AMBIGUOUS_RUN');
    const attempt = await want(`/actions/runs/${run.id}/attempts/${run.run_attempt}`);
    const allJobs = await paged(`/actions/runs/${run.id}/jobs?filter=all`, 'jobs');
    const latestJobs = await want(`/actions/runs/${run.id}/jobs?filter=latest&per_page=100`);
    const next = await api(prefix + `/actions/runs/${run.id}/attempts/${run.run_attempt+1}`);
    const proof = { run, attempt, allJobs, latestJobs, nextAttemptStatus: next.status,
      runnerId: own[0].runner_id, local: local(run, env) };
    residuals.push({ ...classifyResidual(proof, now()), proof });
    const reread = await want(`/actions/runs/${run.id}`);
    requireProof(reread.status === run.status && reread.run_attempt === run.run_attempt &&
      reread.updated_at === run.updated_at, 'LEAN_RUN_CHANGED');
  }
  const second = await snapshot();
  requireProof(JSON.stringify(first.map(r => [r.id,r.status,r.run_attempt,r.updated_at])) ===
    JSON.stringify(second.map(r => [r.id,r.status,r.run_attempt,r.updated_at])), 'LEAN_CONCURRENT_ACTIVITY');
  // Even an empty queue never authorizes activity when a local process/lock exists.
  const finalLocal = local({ id: Number(env.GITHUB_RUN_ID), run_attempt: Number(env.GITHUB_RUN_ATTEMPT) }, env);
  requireProof(finalLocal.platform === 'win32' && finalLocal.lockAbsent === true && finalLocal.processScan === 'NONE',
    'LOCAL_ACTIVITY_OR_AMBIGUITY');
  await main();
  return { schema: 'kodjo.qualification.availability.1', disposition: 'ADMITTED',
    head: env.EXPECTED_HEAD, main: env.EXPECTED_MAIN, run_id: env.GITHUB_RUN_ID,
    runner_id: own[0].runner_id, residuals, finalLocal };
}

async function main() {
  const env = process.env;
  requireProof(process.platform === 'win32', 'WINDOWS_REQUIRED');
  for (const key of ['GH_TOKEN','GITHUB_REPOSITORY','GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','RUNNER_NAME','USERPROFILE','GITHUB_WORKSPACE'])
    requireProof(typeof env[key] === 'string' && env[key].length > 0, `ENV_REQUIRED:${key}`);
  requireProof(/^[0-9a-f]{40}$/.test(env.EXPECTED_HEAD || '') && /^[0-9a-f]{40}$/.test(env.EXPECTED_MAIN || ''), 'HEAD_INPUT_REQUIRED');
  requireProof(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim() === env.EXPECTED_HEAD, 'HEAD_MISMATCH');
  const api = async url => {
    const response = await fetch('https://api.github.com' + url, { headers: {
      authorization: `Bearer ${env.GH_TOKEN}`, accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'
    }, signal: AbortSignal.timeout(30000) });
    return {status: response.status, data: await response.json()};
  };
  const result = await checkAvailability({api});
  fs.writeFileSync(process.argv[2], JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({disposition:result.disposition, residuals:result.residuals.map(r=>({run_id:r.run_id,disposition:r.disposition}))}));
}
if (require.main === module) main().catch(e => {console.error(e.message); process.exitCode=1;});
module.exports = {checkAvailability, localEvidence};
