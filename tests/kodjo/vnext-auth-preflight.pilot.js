'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const { verify } = require('../../scripts/kodjo/verify-claude-auth-status');
test('auth status uses the CLI result rather than a credential file timestamp', () => {
  assert.equal(verify('\uFEFF{"loggedIn":true}', 0).status, 'PASS');
  for (const [raw, code] of [['{"loggedIn":false}', 0], ['{"loggedIn":true}', 1], ['{"loggedIn":"true"}', 0]])
    assert.equal(verify(raw, code).error_code, 'VNEXT_REVIEW_AUTHENTICATION_REQUIRED');
  assert.equal(verify('not json', 0).error_code, 'VNEXT_REVIEW_AUTH_STATUS_INVALID');
});
test('failed auth preserves a sanitized receipt without archiving CLI secrets', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-auth-'));
  try {
    const file = path.join(dir, 'receipt.json');
    const run = spawnSync(process.execPath, ['scripts/kodjo/verify-claude-auth-status.js', file, '1'],
      { input: '{"loggedIn":false,"token":"never-persist-this"}', encoding: 'utf8' });
    assert.equal(run.status, 1);
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /never-persist-this|token/);
    assert.equal(JSON.parse(text).model_invoked, false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('real qualification preserves preflight failures; global audit needs an explicit dispatch', () => {
  const yaml = require('../../scripts/kodjo/lib/yaml');
  const audit = yaml.parse(fs.readFileSync('.github/workflows/kodjo-v2-next-evolution-independent-audit.yml', 'utf8'));
  assert.equal(audit.jobs.await_qualified_head.if, "github.event_name == 'workflow_dispatch'");
  assert.ok(audit.on.workflow_dispatch);
  const real = fs.readFileSync('.github/workflows/kodjo-vnext-audit-tolerance-qualification.yml', 'utf8');
  assert.doesNotMatch(real, /LastWriteTimeUtc|\.credentials\.json/);
  assert.match(real, /verify-claude-auth-status\.js/);
  assert.match(real, /preflight-\$\{\{ github.run_id \}\}-\$\{\{ github.run_attempt \}\}/);
});
