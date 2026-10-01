'use strict';
const { execFileSync } = require('node:child_process');
const V = require('./vnext-contract');
const WORKFLOW = '.github/workflows/kodjo-vnext-proof-stability.yml';
const JOBS = ['qualification (ubuntu-latest)', 'qualification (windows-latest)',
  'historical-equivalence (ubuntu-latest)', 'historical-equivalence (windows-latest)'];
function readGithub(endpoint, { cwd = process.cwd(), env = process.env } = {}) {
  return JSON.parse(execFileSync('gh', ['api', '--method', 'GET', endpoint], {
    cwd, env, encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 16 * 1024 * 1024,
  }));
}
function pages(endpoint, key, read) {
  const rows = [];
  for (let page = 1; page <= 100; page++) {
    const result = read(endpoint + (endpoint.includes('?') ? '&' : '?') + 'per_page=100&page=' + page);
    if (!Array.isArray(result[key])) V.fail('VNEXT_GITHUB_RESPONSE_INVALID', key);
    rows.push(...result[key]);
    if (result[key].length < 100) return rows;
  }
  V.fail('VNEXT_GITHUB_PAGINATION_INCOMPLETE');
}
function verifyQualification({ repository, head, runId, read = readGithub }) {
  V.assertSha40(head, 'VNEXT_QUALIFICATION_HEAD_REQUIRED');
  if (!/^[1-9][0-9]*$/.test(String(runId))) V.fail('VNEXT_QUALIFICATION_RUN_REQUIRED');
  const base = 'repos/' + repository + '/actions/runs/' + runId;
  const run = read(base);
  if (String(run.id) !== String(runId) || run.repository?.full_name !== repository
      || run.head_sha !== head || run.path !== WORKFLOW || run.event !== 'pull_request'
      || run.status !== 'completed' || run.conclusion !== 'success'
      || !Number.isInteger(run.run_attempt) || run.run_attempt < 1) V.fail('VNEXT_QUALIFICATION_RUN_NOT_VERIFIED');
  const jobs = pages(base + '/attempts/' + run.run_attempt + '/jobs', 'jobs', read);
  for (const name of JOBS) {
    const matches = jobs.filter(job => job.name === name);
    if (matches.length !== 1 || matches[0].head_sha !== head || matches[0].status !== 'completed'
        || matches[0].conclusion !== 'success') V.fail('VNEXT_QUALIFICATION_JOB_NOT_VERIFIED', name);
  }
  return { status: 'VERIFIED', candidate_head: head, run_id: String(run.id), run_attempt: run.run_attempt,
    jobs: jobs.filter(job => JOBS.includes(job.name)).map(job => ({ id: job.id, name: job.name, conclusion: job.conclusion })),
    observed_at: new Date().toISOString() };
}
function codeFingerprint(cwd, head) {
  V.assertSha40(head, 'VNEXT_QUALIFICATION_HEAD_REQUIRED');
  const tree = execFileSync('git', ['ls-tree', '-r', head, '--', 'scripts/kodjo', 'tests/kodjo',
    '.github/workflows', '.github/orchestration/KODJO_VNEXT_REMOTE_WRITE_POLICY.json'], { cwd, encoding: 'utf8', windowsHide: true });
  if (!tree.trim()) V.fail('VNEXT_QUALIFICATION_CODE_REQUIRED');
  return V.sha256(tree);
}
function verifyExecutionQualifications(config, { cwd, controllerHead, read = readGithub }) {
  const repository = 'MyUncried/Application-Routine';
  const approved = verifyQualification({ repository, head: config.approved_protocol_head, runId: config.qualification_run_id, read });
  const sameCode = codeFingerprint(cwd, controllerHead) === codeFingerprint(cwd, config.approved_protocol_head);
  const controller = sameCode ? { ...approved, controller_head: controllerHead, relation: 'EXACT_SAME_PROTOCOL_CODE' }
    : verifyQualification({ repository, head: controllerHead, runId: config.controller_qualification_run_id, read });
  return { approved, controller };
}
module.exports = { WORKFLOW, JOBS, readGithub, pages, verifyQualification, codeFingerprint, verifyExecutionQualifications };
