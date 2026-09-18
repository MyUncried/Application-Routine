'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const supervisorPath = path.join(root, 'scripts', 'kodjo', 'run-queued-request.ps1');

function deliveryBlock() {
  const source = fs.readFileSync(supervisorPath, 'utf8');
  const start = source.indexOf('git push origin $pushRefspec');
  const end = source.indexOf('$metadataPath = [string]$env:KODJO_VISUAL_DELIVERY_METADATA_FILE');
  assert.ok(start >= 0, 'existing-PR push block must exist');
  assert.ok(end > start, 'visual-delivery metadata must follow existing-PR delivery verification');
  return source.slice(start, end);
}

test('existing PR delivery uses the exact remote Git ref as the primary source of truth', () => {
  const block = deliveryBlock();
  assert.match(block, /git ls-remote --heads origin \$remoteRef/);
  assert.match(block, /KODJO_QUEUE_EXISTING_PR_REMOTE_REF_UNREADABLE/);
  assert.match(block, /KODJO_QUEUE_EXISTING_PR_REMOTE_HEAD_MISMATCH/);
  assert.match(block, /\$remoteHead -ne \$newHead\.ToLowerInvariant\(\)/);
  assert.doesNotMatch(block, /head\.sha.*newHead|newHead.*head\.sha/);
});

test('PR API is only a continuity control after remote Git delivery is proven', () => {
  const block = deliveryBlock();
  const remoteIndex = block.indexOf('git ls-remote --heads origin $remoteRef');
  const prIndex = block.indexOf('gh api "repos/$env:GITHUB_REPOSITORY/pulls/$targetPr"');
  assert.ok(remoteIndex >= 0 && prIndex > remoteIndex, 'remote ref must be verified before the PR API');
  assert.match(block, /KODJO_QUEUE_APPLICATION_PR_UNREADABLE_AFTER_DELIVERY/);
  assert.match(block, /KODJO_QUEUE_APPLICATION_PR_CLOSED_DURING_DELIVERY/);
  assert.match(block, /KODJO_QUEUE_APPLICATION_BRANCH_MISMATCH/);
  assert.match(block, /for \(\$attempt = 1; \$attempt -le 3 -and \$null -eq \$prAfter; \$attempt\+\+\)/);
  assert.doesNotMatch(block, /KODJO_QUEUE_EXISTING_PR_DELIVERY_NOT_OBSERVED/);
  assert.doesNotMatch(block, /git push[^\n]*--force/);
});
