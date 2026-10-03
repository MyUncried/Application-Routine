'use strict';
// The initial plan review publication retries a GitHub publication failure (run 37136337819: HTTP 400 of undemonstrated cause, review
// output lost) at most three times and never duplicates a review already created for the same review session.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const wf = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'kodjo-v2-slice-initial-plan-review.yml'), 'utf8').replace(/\r\n/g, '\n');
const step = wf.slice(wf.indexOf('- name: Publish independent initial V2 plan review'), wf.indexOf('- name: Preserve initial V2 review evidence'));

test('publication is bounded to three attempts and fails explicitly afterwards', () => {
  assert.match(step, /for\(\$attempt=1;\$attempt -le 3;\$attempt\+\+\)\{/);
  assert.equal((step.match(/gh api --method POST "repos\/\$env:GITHUB_REPOSITORY\/issues\/\$env:ISSUE_NUMBER\/comments" --input \$payloadPath/g) || []).length, 1);
  assert.match(step, /if\(\$null-eq\$created-or-not\$created\.id\)\{throw 'Plan review publication failed'\}/);
});

test('every failed attempt, including the third, looks for a server-side creation before anything else', () => {
  const loop = step.slice(step.indexOf('for($attempt=1;'), step.indexOf("if($null-eq$created-or-not$created.id)"));
  assert.doesNotMatch(loop, /if\(\$attempt -eq 3\)\{break\}/);
  assert.ok(loop.indexOf('Write-Host "Plan review publication attempt $attempt failed"') < loop.indexOf('$listing=gh api --paginate --slurp'));
});

test('a failed lookup stops the retry instead of posting again', () => {
  assert.match(step, /\$listing=gh api --paginate --slurp [^\n]+\n\s+if\(\$LASTEXITCODE -ne 0 -or -not \$listing\)\{throw 'Plan review publication lookup failed; no further attempt'\}/);
});

test('a retry first reuses a review already published for the same session and plan', () => {
  const retry = step.slice(step.indexOf('$listing=gh api --paginate --slurp'), step.indexOf("if($null-eq$created-or-not$created.id)"));
  assert.match(retry, /if\(\$existing\.Count -ge 1\)\{\$created=\$existing\[-1\];break\}/);
  assert.match(retry, /\$_\.user\.login -eq 'github-actions\[bot\]'/);
  assert.match(retry, /StartsWith\('\[KODJO_V2\] PLAN_REVIEW_OUTPUT'\)/);
  assert.match(retry, /\^review_session_id=\$\(\[regex\]::Escape\(\$env:SESSION_ID\)\)\$/);
  assert.match(retry, /\^source_plan_comment_id=\$\(\[regex\]::Escape\(\$env:PLAN_ID\)\)\$/);
});

test('verdict derivation and follow-up dispatch are unchanged', () => {
  assert.match(step, /if\(\$verdict -notin @\('APPROVE','REVISE'\)\)\{throw 'Derived review verdict invalid'\}/);
  assert.ok(step.indexOf("if($null-eq$created-or-not$created.id)") < step.indexOf('$reviewCommentId=[string]$created.id'));
  assert.match(step, /-or \(\$env:PINNED_PUBLICATION -eq 'true'\) -or/);
});
