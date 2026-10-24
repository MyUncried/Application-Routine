'use strict';
// Read-only transport. No model invocation, polling or automatic approval.
const { spawnSync } = require('node:child_process');
const Pilot = require('./vnext-pilot-designation');

function listComments(repository, issueNumber, call = route => {
  const r = spawnSync('gh', ['api', '-H', 'Accept: application/vnd.github+json', route],
    { encoding: 'utf8', windowsHide: true, shell: false, maxBuffer: 32 * 1024 * 1024 });
  if (r.error || r.status !== 0) throw Error('PILOT_REVIEW_GITHUB_READ_FAILED');
  return JSON.parse(r.stdout);
}) {
  if (!/^[^/\s]+\/[^/\s]+$/.test(repository) || !Number.isSafeInteger(issueNumber) || issueNumber < 1)
    throw Error('PILOT_REVIEW_ISSUE_INVALID');
  const result = [];
  for (let page = 1; ; page++) {
    const rows = call(`repos/${repository}/issues/${issueNumber}/comments?per_page=100&page=${page}`);
    if (!Array.isArray(rows)) throw Error('PILOT_REVIEW_COMMENTS_INVALID');
    result.push(...rows);
    if (rows.length < 100) return result;
  }
}

function discover(comments, binding) {
  require('./vnext-contract').assertSha64(binding.preparedChainHash, 'PILOT_PREPARED_CHAIN_HASH_INVALID');
  if (!Array.isArray(comments)) throw Error('PILOT_REVIEW_COMMENTS_INVALID');
  const exactIssue = `https://api.github.com/repos/${binding.repository}/issues/${binding.issueNumber}`;
  const matches = comments.filter(c => {
    const body = String(c?.body || '').replace(/\r\n/g, '\n');
    return c?.issue_url === exactIssue
      && String(c.user?.login || '').toLowerCase() === binding.repository.split('/')[0].toLowerCase()
      && c.performed_via_github_app?.slug === Pilot.CONNECTOR_SLUG
      && body.startsWith('[KODJO_VNEXT] INDEPENDENT_PLAN_REVIEW\n')
      && body.split('\n').some(line => line.trim() === 'slice_id=' + binding.sliceId)
      && body.split('\n').some(line => line.trim() === 'prepared_chain_hash=' + binding.preparedChainHash);
  });
  if (!matches.length) return { status: 'WAITING_FOR_INDEPENDENT_PLAN_REVIEW', next_actor: 'CHATGPT_REVIEWER',
    issue_url: `https://github.com/${binding.repository}/issues/${binding.issueNumber}`,
    prepared_chain_hash: binding.preparedChainHash };
  // An edited or newer refusal supersedes an earlier approval. Never fall back
  // to a convenient APPROVE; malformed authenticated responses also block.
  for (const c of matches) if (!/^[1-9][0-9]*$/.test(String(c.id))
    || !Number.isFinite(Date.parse(c.updated_at || c.created_at))) throw Error('PILOT_REVIEW_COMMENT_METADATA_INVALID');
  matches.sort((a, b) => Date.parse(b.updated_at || b.created_at) - Date.parse(a.updated_at || a.created_at)
    || (BigInt(a.id) < BigInt(b.id) ? 1 : BigInt(a.id) > BigInt(b.id) ? -1 : 0));
  const latest = matches[0];
  const review = Pilot.verifyIndependentPlanReview(latest, binding);
  return { status: 'APPROVED', ...review };
}

module.exports = { listComments, discover };
