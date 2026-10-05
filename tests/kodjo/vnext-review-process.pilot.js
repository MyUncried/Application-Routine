'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const Process = require('../../scripts/kodjo/lib/vnext-review-process');
test('stream supervisor preserves the exact final result and records metadata without content', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-stream-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const progressPath = path.join(dir, 'progress.json');
  const final = { type: 'result', session_id: 'TEST', structured_output: { label: 'épreuve' } };
  const code = `process.stdout.write(JSON.stringify({type:'assistant',content:'SECRET_NOT_FOR_PROGRESS'})+'\\n');process.stdout.write(JSON.stringify(${JSON.stringify(final)})+'\\n');`;
  let observed;
  const raw = Process.command(process.execPath, ['-e', code], process.cwd(), '', process.env, 5000,
    { progressPath, onResult: row => { observed = row; } });
  assert.deepEqual(JSON.parse(raw), final); assert.equal(observed.event_count, 2);
  const progress = fs.readFileSync(progressPath, 'utf8');
  assert.ok(!progress.includes('SECRET_NOT_FOR_PROGRESS')); assert.equal(JSON.parse(progress).phase, 'COMPLETED');
  assert.ok(JSON.parse(progress).cli_version);
});
test('interrupted review keeps observed progress and never promotes an absent result', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-timeout-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const progressPath = path.join(dir, 'progress.json'); let observed;
  assert.throws(() => Process.command(process.execPath,
    ['-e', "process.stdout.write('{\"type\":\"system\"}\\n');setInterval(()=>{},1000)"],
    process.cwd(), '', process.env, 500, { progressPath, onResult: row => { observed = row; } }), /ETIMEDOUT/);
  assert.equal(observed.error_code, 'ETIMEDOUT'); assert.equal(observed.stdout, '');
  const progress = JSON.parse(fs.readFileSync(progressPath));
  assert.equal(progress.event_count, 1); assert.equal(progress.error_code, 'ETIMEDOUT');
});
test('duplicate or malformed final streams fail closed', () => {
  for (const lines of ['{"type":"result"}\n{"type":"result"}\n', 'invalid\n']) {
    assert.throws(() => Process.command(process.execPath,
      ['-e', `process.stdout.write(${JSON.stringify(lines)})`], process.cwd(), '', process.env, 5000), /STREAM_DUPLICATE_RESULT|STREAM_INVALID/);
  }
});
