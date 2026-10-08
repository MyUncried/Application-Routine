'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const Integrity = require('../../scripts/kodjo/lib/git-runtime-integrity');
const Security = require('../../scripts/kodjo/lib/vnext-remote-write-security');
const Source = require('../../scripts/kodjo/verify-source-comment');
const Eq = require('../../scripts/kodjo/lib/vnext-historical-equivalence');
const Lock = require('../../scripts/kodjo/lib/execution-lock');
function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-v8-'));
  execFileSync('git', ['init', '-q', dir]);
  fs.writeFileSync(path.join(dir, '.gitignore'), 'ignored.txt\n');
  fs.writeFileSync(path.join(dir, 'ignored.txt'), 'before');
  return dir;
}
test('D2 source evidence rejects foreign authors, issues, repositories and comment IDs', () => {
  const target = { repository: 'MyUncried/Application-Routine', issue: 269, id: 42 };
  const comment = { id: 42, user: { login: 'github-actions[bot]' }, issue_url: 'https://api.github.com/repos/MyUncried/Application-Routine/issues/269' };
  assert.equal(Source.verify(comment, target), comment);
  for (const wrong of [{...comment, id: 43}, {...comment, user: {login: 'someone'}},
    {...comment, issue_url: comment.issue_url.replace('/269', '/17')},
    {...comment, issue_url: comment.issue_url.replace('Application-Routine', 'Other')}]) {
    assert.throws(() => Source.verify(wrong, target), /ORIGIN_MISMATCH/);
  }
});
test('D11 ignored files and Git executable metadata cannot change invisibly', () => {
  const dir = repo();
  try {
    const before = Integrity.snapshot(dir);
    fs.writeFileSync(path.join(dir, 'ignored.txt'), 'after');
    fs.writeFileSync(path.join(dir, '.git/hooks/pre-commit'), '#!/bin/sh\nexit 9\n');
    fs.appendFileSync(path.join(dir, '.git/config'), '\n[core]\n\tfsmonitor = attacker\n');
    const changes = Integrity.compare(before, Integrity.snapshot(dir));
    assert.deepEqual(changes, ['.git/config', '.git/hooks/pre-commit', 'ignored.txt']);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
test('D11 safe Git commands suppress a real pre-commit hook', () => {
  const dir = repo();
  try {
    const git = args => execFileSync('git', Integrity.safeArgs(args), {cwd: dir, encoding: 'utf8'});
    fs.writeFileSync(path.join(dir, 'tracked.txt'), 'value');
    fs.writeFileSync(path.join(dir, '.git/hooks/pre-commit'), '#!/bin/sh\necho executed > hook-ran\nexit 9\n', {mode: 0o755});
    git(['add', '.']);
    git(['-c', 'user.name=Unit test', '-c', 'user.email=unit@example.invalid', 'commit', '-qm', 'fixture']);
    assert.equal(fs.existsSync(path.join(dir, 'hook-ran')), false);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
test('D9 scanner detects concatenated REST destinations and Git writes behind safety options', () => {
  const hits = Security.scanFileCapabilities('scripts/kodjo/unit-writer.js', [
    "githubApi('repos/' + repo + '/git/refs', { method: 'POST' });",
    'gh api "repos/$repo/git/refs" --method POST',
    'git -c core.hooksPath=NUL -c core.fsmonitor=false push origin branch',
  ].join('\n'));
  assert.equal(hits.filter(row => row.capability === 'REST_REPOSITORY_WRITE').length, 2);
  assert.equal(hits.some(row => row.capability === 'GIT_PUSH'), true);
  const split=Security.scanFileCapabilities('scripts/kodjo/split-writer.js',"githubApi(\n 'repos/' + repo + '/git/refs',\n {method:'POST'}\n);");
  assert.ok(split.some(row=>row.capability==='REST_REPOSITORY_WRITE'));
  assert.equal(Security.scanFileCapabilities('scripts/kodjo/read.sh',
    'git merge-base --is-ancestor base HEAD').some(row => row.capability === 'GIT_HISTORY_MUTATION'), false);
  for (const command of ['git merge HEAD', 'git merge;', 'git -c core.hooksPath=NUL rebase HEAD']) {
    assert.ok(Security.scanFileCapabilities('scripts/kodjo/write.sh', command)
      .some(row => row.capability === 'GIT_HISTORY_MUTATION'), command);
  }
});
test('D16 a comment marker cannot authorize an executable legacy push', () => {
  const dir = repo();
  try {
    fs.mkdirSync(path.join(dir, 'scripts/kodjo'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'scripts/kodjo/unsafe.sh'), 'git push origin branch # kodjo-allow-mention\n');
    assert.throws(() => execFileSync(process.execPath, [path.join(root, 'scripts/kodjo/scan-remote-write-capability.js'), dir], {stdio: 'pipe'}));
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
test('D4 two skipped platforms never satisfy mapped historical coverage', () => {
  const head = 'a'.repeat(40), correspondence = {cases: [{id: 'CASE-unit'}]};
  const evidence = platform => ({schema_version: 'kodjo.vnext.historical-execution.v1', candidate_head: head, platform,
    counts: {failed: 0, cancelled: 0, todo: 0}, cases: [{case_id: 'CASE-unit', candidate_head: head, platform, status: 'SKIP'}]});
  const results = [evidence('linux'), evidence('win32')];
  assert.throws(() => Eq.verifyPlatformCoverage(correspondence, results, head), /NO_PLATFORM_PASS/);
  results[1].cases[0].status = 'PASS';
  assert.equal(Eq.verifyPlatformCoverage(correspondence, results, head).individual_equivalence_proven, false);
  assert.throws(() => Eq.verifyPlatformCoverage(correspondence, [results[0], results[0]], head), /PLATFORM_PAIR_REQUIRED/);
  results[1].candidate_head = 'b'.repeat(40);
  assert.throws(() => Eq.verifyPlatformCoverage(correspondence, results, head), /PLATFORM_EVIDENCE_INVALID/);
});
test('D15 simultaneous stale-lock reclaimers produce exactly one owner', async () => {
  const dir = repo(), lock = path.join(dir, 'execution.lock');
  fs.writeFileSync(lock, JSON.stringify({schema_version: Lock.LOCK_SCHEMA, owner_pid: 999999, owner_started_at: 'old', token: 'old'}));
  const script = `const fs=require('node:fs'),L=require(${JSON.stringify(path.join(root, 'scripts/kodjo/lib/execution-lock'))});
    const inspect=pid=>pid===999999?{state:'DEAD'}:{state:'ALIVE',started_at:'start-'+pid};
    try { const h=L.acquire(process.argv[1],{run_id:'unit',request_id:'unit'},inspect,()=>({state:'NONE'}));
      console.log('ACQUIRED'); const t=setInterval(()=>{if(fs.existsSync(process.argv[2])){clearInterval(t);L.release(h);}},10);
    } catch(e){console.log('REFUSED:'+e.message);}`;
  const release = path.join(dir, 'release');
  function child() {
    const p = spawn(process.execPath, ['-e', script, lock, release], {stdio: ['ignore', 'pipe', 'pipe']});
    return new Promise((resolve, reject) => {
      let output = '';
      p.on('error', reject);
      p.stdout.on('data', chunk => {output += chunk; if(output.includes('\n')) resolve({p, output});});
    });
  }
  try {
    const children = await Promise.all([child(), child()]);
    assert.equal(children.filter(c => c.output.startsWith('ACQUIRED')).length, 1);
    const done = children.map(c => new Promise(resolve => c.p.exitCode === null ? c.p.on('exit', resolve) : resolve()));
    fs.writeFileSync(release, 'release'); await Promise.all(done);
    assert.equal(fs.existsSync(lock), false);
    fs.writeFileSync(lock + '.transition', 'crashed');
    assert.throws(() => Lock.acquire(lock, {}, () => ({state: 'ALIVE', started_at: 'now'})), /TRANSITION_BUSY/);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

test('D8 UI projection retains atomic assertions and an exact component path/export binding',()=>{
  const Adapter=require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter');
  const plan={plan_items:[{change_items:[{impact_id:'ui',path:'src/features/sample/Screen.tsx'},{impact_id:'test',path:'tests/screen.test.tsx'}],proof_obligations:[{proof_id:'functional',proof_type:'FUNCTIONAL_TEST',target_test_impact_id:'test'}]}],
    boundaries:{write_scope:[{path:'src/features/sample/Screen.tsx',change_kind:'MODIFY'},{path:'tests/screen.test.tsx',change_kind:'MODIFY'}],preserve_scope:[],forbidden_policy:'outside approved scope'}};
  const ui={criteria:[{criterion_id:'CRT-unit',source:{locator:'docs/product.md',unit_locator:'Unit'},statement:'Keep the approved interaction',risk_types:['FUNCTIONAL'],
    reuse_search_candidate_ids:['component'],component_decision:'REUSE',selected_component:'Overlay',selected_component_candidate_id:'component',decision_justification:'Exact approved export',
    change_impact_ids:['ui'],proof_ids:['functional'],proof_required:['FUNCTIONAL_TEST'],assertions:[{assertion_id:'AST-unit',subject:'button',property_type:'INTERACTION',expected:'opens overlay',proof_ids:['functional']}]}]};
  const candidates={candidates:[{candidate_id:'component',path:'src/shared/ui/Overlay.tsx'}]};
  const {matrix}=Adapter.projectUi(plan,ui,candidates);
  assert.equal(matrix.schema,'kodjo.ui-criteria.v2');
  assert.deepEqual(matrix.criteria[0].selected_component,{path:'src/shared/ui/Overlay.tsx',export:'Overlay'});
  assert.equal(matrix.criteria[0].assertions.length,1);
  assert.equal(matrix.criteria[0].assertions[0].expected,'button: opens overlay');
  assert.throws(()=>Adapter.projectUi(plan,ui,{candidates:[]}),/COMPONENT_BINDING_UNREPRESENTABLE/);
  assert.throws(()=>Adapter.projectUi(plan,null,candidates),/UI_CONTRACT_REQUIRED/);
});
