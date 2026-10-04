'use strict';
// The revision draft prompt must agree with the decoder (generate-ui-plan-contract.js decode draft):
// modules go to the structured field modified_modules, never as a <KODJO_...> block inside plan_markdown
// (runs 37189965479: PLAN_GENERATION_MARKER_DUPLICATION), and the scope of a revision of an already
// delivered slice is cumulative so that every change_target is declared (run 37190167568: UI_PLAN_TARGET_INVALID).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const wf = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'kodjo-v2-slice-plan.yml'), 'utf8').replace(/\r\n/g, '\n');
const start = wf.indexOf('cat > /tmp/kodjo-v2-plan/draft-prompt.txt <<EOF');
const prompt = wf.slice(start, wf.indexOf('\n          EOF\n', start));

test('revision draft prompt never asks for a textual KODJO block', () => {
  assert.ok(start > 0, 'draft prompt not found');
  assert.doesNotMatch(prompt, /<KODJO_MODIFIED_MODULES_JSON>/);
  assert.match(prompt, /in the structured field modified_modules/);
  assert.match(prompt, /plan_markdown is narrative only: it must never contain a tag beginning with <KODJO_ or <\/KODJO_/);
  assert.match(prompt, /nor a line beginning with PLAN_STATUS:/);
});

test('revision draft prompt declares the cumulative scope of an already delivered slice', () => {
  assert.match(prompt, /modified_modules is the cumulative scope of the revised plan/);
  assert.match(prompt, /every path named in any UI criterion change_targets or non-UI requirement change_targets/);
  assert.match(prompt, /never name a change_target outside modified_modules/);
});

test('the decoder rules the prompt now states are unchanged', () => {
  const decoder = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'generate-ui-plan-contract.js'), 'utf8');
  assert.match(decoder, /if \(\/<\\\/\?KODJO_\|\^\\s\*PLAN_STATUS:\/m\.test\(result\.plan_markdown\)\) throw new Error\('PLAN_GENERATION_MARKER_DUPLICATION'\);/);
  const contract = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'lib', 'ui-criteria-contract.js'), 'utf8');
  assert.match(contract, /if \(!scope\.has\(target\)\) fail\('UI_PLAN_TARGET_INVALID', id \+ ': cible hors scope_allow: ' \+ target\);/);
});
