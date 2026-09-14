'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { resolvePrivateHead, main } = require('../../scripts/kodjo/resolve-private-head');

const SHA = 'a'.repeat(40);
const ENV = { GH_TOKEN: 'test-token' };

function successRecorder(record) {
  return (command, args, options) => {
    record.push({ command, args, options });
    return { status: 0, stdout: SHA + '\n', stderr: '' };
  };
}

test('authenticated private HEAD lookup uses GitHub API and returns an exact SHA', () => {
  const calls = [];
  const actual = resolvePrivateHead('MyUncried/Application-Routine', 'main', {
    env: ENV,
    spawnSync: successRecorder(calls),
  });
  assert.equal(actual, SHA);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'gh');
  assert.deepEqual(calls[0].args, [
    'api',
    '--method',
    'GET',
    'repos/MyUncried/Application-Routine/commits/main',
    '--jq',
    '.sha',
  ]);
  assert.equal(calls[0].options.env.GH_TOKEN, 'test-token');
});

test('missing token is refused before any external command', () => {
  let called = false;
  assert.throws(() => resolvePrivateHead('MyUncried/Application-Routine', 'main', {
    env: {},
    spawnSync: () => {
      called = true;
      return { status: 0, stdout: SHA + '\n', stderr: '' };
    },
  }), /KODJO_GITHUB_TOKEN_MISSING/);
  assert.equal(called, false);
});

test('invalid repository and branch inputs are refused', () => {
  assert.throws(() => resolvePrivateHead('invalid', 'main', { env: ENV }), /KODJO_GITHUB_REPOSITORY_INVALID/);
  assert.throws(() => resolvePrivateHead('MyUncried/Application-Routine', 'main;bad', { env: ENV }), /KODJO_GITHUB_BRANCH_INVALID/);
});

test('GitHub API failure is explicit', () => {
  assert.throws(() => resolvePrivateHead('MyUncried/Application-Routine', 'missing', {
    env: ENV,
    spawnSync: () => ({ status: 1, stdout: '', stderr: 'HTTP 404' }),
  }), /KODJO_GITHUB_REF_READ_FAILED: HTTP 404/);
});

test('empty or malformed GitHub response is refused', () => {
  for (const stdout of ['', 'not-a-sha\n', 'A'.repeat(40) + '\n']) {
    assert.throws(() => resolvePrivateHead('MyUncried/Application-Routine', 'main', {
      env: ENV,
      spawnSync: () => ({ status: 0, stdout, stderr: '' }),
    }), /KODJO_GITHUB_REF_RESPONSE_INVALID/);
  }
});

test('CLI returns non-zero without a token', () => {
  const old = process.env.GH_TOKEN;
  delete process.env.GH_TOKEN;
  try {
    assert.equal(main(['MyUncried/Application-Routine', 'main']), 1);
  } finally {
    if (old === undefined) delete process.env.GH_TOKEN;
    else process.env.GH_TOKEN = old;
  }
});
