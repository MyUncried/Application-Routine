#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const { verify } = require('./verify-independent-protocol-audit');
const ARCHIVE_BRANCH = 'evidence/kodjo-independent-audits';

function fail(code) { throw new Error(code); }

async function publish(input, api) {
  const { repository, prNumber, candidateSha, baseSha, runId, attempt, report, sessionId } = input;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) ||
      !/^[1-9][0-9]*$/.test(String(prNumber)) ||
      !/^[a-f0-9]{40}$/.test(candidateSha) || !/^[a-f0-9]{40}$/.test(baseSha) ||
      !/^[1-9][0-9]*$/.test(String(runId)) || !/^[1-9][0-9]*$/.test(String(attempt)) ||
      typeof sessionId !== 'string' || !/^[A-Za-z0-9-]+$/.test(sessionId)) fail('AUDIT_PUBLICATION_TARGET_INVALID');
  const summary = verify(report);
  const root = 'repos/' + repository;
  const pr = await api('GET', root + '/pulls/' + prNumber);
  // A report may describe a superseded candidate, but must never be presented as a current qualification.
  if (pr.head.repo.full_name !== repository) fail('AUDIT_PUBLICATION_REPOSITORY_MISMATCH');
  const run = await api('GET', root + '/actions/runs/' + runId);
  if (run.head_sha !== candidateSha || (Number(run.run_attempt) < Number(attempt)) ||
      run.path !== '.github/workflows/kodjo-v2-next-evolution-independent-audit.yml') fail('AUDIT_PUBLICATION_RUN_MISMATCH');
  if (run.event === 'pull_request' &&
      !run.pull_requests?.some(p => p.number === Number(prNumber))) fail('AUDIT_PUBLICATION_PR_RUN_MISMATCH');
  const date = String(run.created_at).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('AUDIT_PUBLICATION_DATE_INVALID');
  const reportPath = '.github/orchestration/reports/' + date + '_INDEPENDENT_AUDIT_' + runId + '_' + attempt + '.md';
  const key = 'publication_key=' + runId + ':' + attempt;
  const hash = crypto.createHash('sha256').update(report, 'utf8').digest('hex');
  const content = '# Preuve de publication de l’audit indépendant\n\n' +
    'repository=' + repository + '\npr_number=' + prNumber +
    '\ncandidate_sha=' + candidateSha + '\nbase_sha=' + baseSha +
    '\nreviewer=CLAUDE_LOCAL\nsession_id=' + sessionId +
    '\nsource_run=' + runId + '\nsource_attempt=' + attempt +
    '\nreport_sha256=' + hash + '\n\n' + report;
  const refPath = root + '/git/ref/heads/' + ARCHIVE_BRANCH;
  let ref = await api('GET', refPath, undefined, true);
  if (!ref) {
    try {
      await api('POST', root + '/git/refs', { ref: 'refs/heads/' + ARCHIVE_BRANCH, sha: candidateSha });
    } catch (error) {
      // A simultaneous publisher may have created the archive branch. Do not mask any other error.
      if (error.status !== 422) throw error;
    }
    ref = await api('GET', refPath);
  }
  const encodedPath = reportPath.split('/').map(encodeURIComponent).join('/');
  const fileApi = root + '/contents/' + encodedPath;
  const prior = await api('GET', fileApi + '?ref=' + encodeURIComponent(ARCHIVE_BRANCH), undefined, true);
  if (prior && Buffer.from(prior.content, 'base64').toString('utf8') !== content) fail('AUDIT_ARCHIVE_IMMUTABLE_PATH_CONFLICT');
  let archiveCommit;
  if (!prior) {
    const written = await api('PUT', fileApi, {
      message: 'docs(kodjo): archive independent audit ' + runId + '/' + attempt,
      branch: ARCHIVE_BRANCH, content: Buffer.from(content, 'utf8').toString('base64'),
    });
    archiveCommit = written.commit.sha;
  } else {
    // Find the commit introducing this exact immutable path, not the current branch tip.
    const commits = await api('GET', root + '/commits?sha=' + encodeURIComponent(ARCHIVE_BRANCH) +
      '&path=' + encodeURIComponent(reportPath) + '&per_page=1');
    archiveCommit = commits[0] && commits[0].sha;
  }
  if (!/^[a-f0-9]{40}$/.test(archiveCommit || '')) fail('AUDIT_ARCHIVE_COMMIT_INVALID');
  const saved = await api('GET', fileApi + '?ref=' + archiveCommit);
  if (Buffer.from(saved.content, 'base64').toString('utf8') !== content) fail('AUDIT_ARCHIVE_READBACK_MISMATCH');
  const reportUrl = 'https://github.com/' + repository + '/blob/' + archiveCommit + '/' + reportPath;
  const body = '[KODJO_V2] NEXT_EVOLUTION_INDEPENDENT_AUDIT\n' + key +
    '\npr_number=' + prNumber + '\nbase_sha=' + baseSha + '\ncandidate_sha=' + candidateSha +
    '\nreviewer=CLAUDE_LOCAL\nsession_id=' + sessionId + '\nverdict=' + summary.verdict +
    '\nblocking_findings=' + summary.blocking_findings + '\nmajor_findings=' + summary.major_findings +
    '\nminor_findings=' + summary.minor_findings + '\nreport_sha256=' + hash +
    '\nreport_commit=' + archiveCommit + '\n\n[Rapport intégral versionné](' + reportUrl + ')' +
    '\n\nCe verdict concerne exclusivement candidate_sha ; il ne qualifie aucun HEAD ultérieur.';
  let existing;
  for (let page = 1; ; page++) {
    const comments = await api('GET', root + '/issues/' + prNumber + '/comments?per_page=100&page=' + page);
    existing = comments.find(c => String(c.body).split('\n').includes(key));
    if (existing || comments.length < 100) break;
  }
  if (existing && existing.body !== body) fail('AUDIT_PUBLICATION_EXISTING_COMMENT_CONFLICT');
  const comment = existing || await api('POST', root + '/issues/' + prNumber + '/comments', { body });
  if (!comment.id || !comment.html_url) fail('AUDIT_PUBLICATION_COMMENT_ID_MISSING');
  const readback = await api('GET', root + '/issues/comments/' + comment.id);
  if (readback.body !== body) fail('AUDIT_PUBLICATION_COMMENT_READBACK_MISMATCH');
  return { schema: 'kodjo.audit-publication.v1', candidate_sha: candidateSha, verdict: summary.verdict,
    report_path: reportPath, report_sha256: hash, report_commit: archiveCommit,
    report_url: reportUrl, comment_id: comment.id, comment_url: comment.html_url };
}

async function githubApi(method, endpoint, data, allowMissing = false) {
  const response = await fetch('https://api.github.com/' + endpoint, {
    method, headers: { Authorization: 'Bearer ' + process.env.GH_TOKEN,
      Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'kodjo-independent-audit-publication',
      'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  if (allowMissing && response.status === 404) return null;
  if (!response.ok) {
    const error = new Error('AUDIT_PUBLICATION_HTTP_' + response.status + ': ' + method + ' ' + endpoint);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

if (require.main === module) {
  (async () => {
    const [reportFile, receiptFile] = process.argv.slice(2);
    if (!reportFile || !receiptFile || !process.env.GH_TOKEN) fail('AUDIT_PUBLICATION_INPUT_MISSING');
    const receipt = await publish({
      repository: process.env.GITHUB_REPOSITORY, prNumber: process.env.PR_NUMBER,
      candidateSha: process.env.CANDIDATE_SHA, baseSha: process.env.BASE_SHA,
      runId: process.env.GITHUB_RUN_ID, attempt: process.env.SOURCE_AUDIT_ATTEMPT,
      sessionId: process.env.SESSION_ID, report: fs.readFileSync(reportFile, 'utf8'),
    }, githubApi);
    fs.writeFileSync(receiptFile, JSON.stringify(receipt, null, 2) + '\n', 'utf8');
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      '[Rapport versionné](' + receipt.report_url + ')\n\n[Commentaire vérifié](' + receipt.comment_url + ')\n', 'utf8');
    console.log(JSON.stringify(receipt));
  })().catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { publish, ARCHIVE_BRANCH };
