'use strict';
// PRE-1 runs 36924289392, 36925812691 and 36929974315 ended while the full jest check had been
// auto-moved to the background: in non-interactive mode the session closes with the model's turn,
// so the result was never observed. The implementer environment must keep checks in the foreground.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {CLAUDE_FOREGROUND_CHECK_ENV}=require('../../scripts/kodjo/run-local-claude');

test('background tasks are disabled and the Bash timeout exceeds a full check run',()=>{
  assert.equal(CLAUDE_FOREGROUND_CHECK_ENV.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS,'1');
  assert.ok(Number(CLAUDE_FOREGROUND_CHECK_ENV.BASH_DEFAULT_TIMEOUT_MS)>=600000);
  assert.equal(CLAUDE_FOREGROUND_CHECK_ENV.BASH_MAX_TIMEOUT_MS,CLAUDE_FOREGROUND_CHECK_ENV.BASH_DEFAULT_TIMEOUT_MS);
  assert.ok(Object.isFrozen(CLAUDE_FOREGROUND_CHECK_ENV));
});

test('the implementer process environment receives these variables after the inherited environment',()=>{
  const src=fs.readFileSync(path.join(__dirname,'..','..','scripts','kodjo','run-local-claude.js'),'utf8').replace(/\r\n/g,'\n');
  const {claudeEnvironment}=require('../../scripts/kodjo/run-local-claude');
  const env=claudeEnvironment({CLAUDE_CODE_DISABLE_BACKGROUND_TASKS:'0',BASH_DEFAULT_TIMEOUT_MS:'1',BASH_MAX_TIMEOUT_MS:'1'},{scope_allow:['src/a.ts']});
  assert.equal(env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS,'1');
  assert.equal(env.BASH_DEFAULT_TIMEOUT_MS,'900000');
  assert.equal(env.BASH_MAX_TIMEOUT_MS,'900000');
  assert.match(src,/claudeEnvironment\(process\.env, request\)/);
  assert.match(src,/command\(claudeBin, \[\.\.\.claudePrefix, \.\.\.args\], repoRoot, claudeEnv,/);
});
