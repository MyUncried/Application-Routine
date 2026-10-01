'use strict';
// The implementation review must accept the pinned human publications of the PRE-1 plan
// through the same verified recovery as the handoff, and only when the recovered text is
// identical to the authorized plan blob (run 36808316112 failed silently on the bot-author rule).
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {COMMENT_ID,CORRECTED_COMMENT_ID,ROUND2_COMMENT_ID,ROUND3_COMMENT_ID}=require('../../scripts/kodjo/recover-published-pre1-plan');

const wf=fs.readFileSync(path.join(__dirname,'..','..','.github','workflows','kodjo-slice-implementation-review.yml'),'utf8').replace(/\r\n/g,'\n');
const step=wf.slice(wf.indexOf('- name: Validate implementation output and manifest'));

test('pinned PRE-1 publications are recovered and bound to the authorized plan blob',()=>{
  const m=/if \[\[ "\$plan" =~ \^\(([0-9|]+)\)\$ \]\]; then/.exec(step);
  assert.ok(m,'pinned publication branch missing');
  assert.deepEqual(m[1].split('|').sort(),[COMMENT_ID,CORRECTED_COMMENT_ID,ROUND2_COMMENT_ID,ROUND3_COMMENT_ID].sort());
  const branch=step.slice(m.index,step.indexOf('\n            fi\n',m.index));
  assert.match(branch,/node scripts\/kodjo\/recover-published-pre1-plan\.js "\$plan" \/tmp\/kodjo-recovered-plan\.md/);
  assert.match(branch,/Recovered PRE-1 plan differs from authorized plan blob/);
});

test('every other plan still requires a bot-authored PLAN_OUTPUT on the issue',()=>{
  const elseBranch=step.slice(step.indexOf('            else\n              jq -e --arg issue'));
  assert.match(elseBranch,/\.user\.login == "github-actions\[bot\]"/);
  assert.match(elseBranch,/V2 source plan comment author\/issue invalid/);
  assert.match(step,/\[ "\$\(first_line "\$v2_plan_comment_body"\)" = '\[KODJO_V2\] PLAN_OUTPUT' \]/);
});
