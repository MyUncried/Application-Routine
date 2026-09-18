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
  assert.ok(end > start, 'visual-delivery metadata must follow existing-PR delivery observation');
  return source.slice(start, end);
}

test('existing PR delivery observation retries boundedly after a successful push', () => {
  const block = deliveryBlock();
  assert.match(block, /for \(\$attempt = 1; \$attempt -le 6; \$attempt\+\+\)/);
  assert.match(block, /Start-Sleep -Seconds 2/);
  assert.match(block, /\$deliveryObserved = \$false/);
  assert.match(block, /\$deliveryObserved = \$true/);
  assert.match(block, /if \(-not \$deliveryObserved\)/);
  assert.match(block, /KODJO_QUEUE_EXISTING_PR_DELIVERY_NOT_OBSERVED/);
});

test('existing PR delivery observation preserves branch and open-state guards', () => {
  const block = deliveryBlock();
  assert.match(block, /KODJO_QUEUE_APPLICATION_PR_CLOSED_DURING_DELIVERY/);
  assert.match(block, /KODJO_QUEUE_APPLICATION_BRANCH_MISMATCH/);
  assert.match(block, /\$observedHead -eq \$newHead\.ToLowerInvariant\(\)/);
  assert.doesNotMatch(block, /git push[^\n]*--force/);
});
