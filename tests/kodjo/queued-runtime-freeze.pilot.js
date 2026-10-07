'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..', '..');
const source = require('./helpers/normalized-git-source')(fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'run-queued-request.ps1'), 'utf8'));

test('queued execution freezes current protocol runtime before application checkout', () => {
  const copyIndex = source.indexOf('Copy-Item -LiteralPath $PSScriptRoot -Destination $runtimeScriptRoot');
  const checkoutIndex = source.indexOf('git switch --detach $queue.source_head');
  const startIndex = source.indexOf("& (Join-Path $runtimeScriptRoot $runtimeEntryScript) -Request $tempRequest");
  assert.ok(copyIndex >= 0, 'runtime copy must exist');
  assert.ok(checkoutIndex >= 0, 'application checkout must exist');
  assert.ok(startIndex >= 0, 'runtime invocation must exist');
  assert.ok(copyIndex < checkoutIndex, 'runtime must be frozen before application checkout');
  assert.ok(checkoutIndex < startIndex, 'frozen runtime must be used after application checkout');
});

test('runtime freeze applies to IMPLEMENT as well as VISUAL_CORRECTION', () => {
  const assignment = source.match(/\$runtimeScriptRoot = Join-Path[\s\S]*?KODJO_QUEUE_PROTOCOL_RUNTIME_COPY_FAILED/);
  assert.ok(assignment, 'runtime freeze block must exist');
  assert.doesNotMatch(assignment[0], /if \(\$isVisual\)/, 'runtime freeze must not be visual-only');
});

test('frozen runtime is cleaned up after queued execution', () => {
  assert.match(source, /Remove-Item -LiteralPath \$runtimeScriptRoot -Recurse -Force -ErrorAction SilentlyContinue/);
});
