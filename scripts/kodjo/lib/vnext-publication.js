'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const V = require('./vnext-contract');
const Github = require('./vnext-github-qualification');
const CHECKPOINT = '.github/orchestration/vnext12/VNEXT-12-QUALIF/campaign-state.json';
const WORKFLOWS = new Set(['.github/workflows/kodjo-vnext12-disposable.yml',
  '.github/workflows/kodjo-vnext-proof-stability.yml', '.github/workflows/kodjo-v2-pilot-tests.yml']);
function verifyWindow({ repository, branch, expectedParent, checkpointSha, read = Github.readGithub }) {
  V.assertSha40(expectedParent, 'VNEXT_PUBLICATION_PARENT_REQUIRED');
  V.assertSha40(checkpointSha, 'VNEXT_PUBLICATION_CHECKPOINT_REQUIRED');
  const ref = read('repos/' + repository + '/git/ref/heads/' + branch.split('/').map(encodeURIComponent).join('/'));
  if (ref.object?.sha !== expectedParent) V.fail('VNEXT_PUBLICATION_PARENT_MOVED');
  const file = read('repos/' + repository + '/contents/' + CHECKPOINT + '?ref=' + expectedParent);
  if (file.sha !== checkpointSha || file.encoding !== 'base64') V.fail('VNEXT_PUBLICATION_CHECKPOINT_MOVED');
  const state = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
  if (state.repository !== repository || state.branch !== branch || !Array.isArray(state.active_runs)
      || state.active_runs.some(run => !['completed', 'COMPLETED'].includes(run.status))) V.fail('VNEXT_PUBLICATION_CAMPAIGN_ACTIVE');
  const runs = Github.pages('repos/' + repository + '/actions/runs?branch=' + encodeURIComponent(branch), 'workflow_runs', read);
  if (runs.some(run => WORKFLOWS.has(run.path) && run.status !== 'completed')) V.fail('VNEXT_PUBLICATION_PHASE_ACTIVE');
  return { expected_parent: expectedParent, checkpoint_sha: checkpointSha,
    controller_generation: state.controller_generation, observed_at: new Date().toISOString() };
}
function validateTree({ cwd, expectedParent, candidateTree, run = execFileSync }) {
  V.assertSha40(expectedParent, 'VNEXT_PUBLICATION_PARENT_REQUIRED');
  V.assertSha40(candidateTree, 'VNEXT_PUBLICATION_TREE_REQUIRED');
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 }).trim();
  if (git('rev-parse', candidateTree + '^{tree}') !== candidateTree) V.fail('VNEXT_PUBLICATION_TREE_INVALID');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-publication-'));
  try {
    execFileSync('git', ['init', '--quiet', temporary], { windowsHide: true });
    const common = path.resolve(cwd, git('rev-parse', '--git-common-dir'));
    fs.mkdirSync(path.join(temporary, '.git/objects/info'), { recursive: true });
    fs.writeFileSync(path.join(temporary, '.git/objects/info/alternates'), path.join(common, 'objects').replace(/\\/g, '/') + '\n');
    fs.writeFileSync(path.join(temporary, '.git/HEAD'), expectedParent + '\n');
    execFileSync('git', ['-c', 'core.autocrlf=false', 'read-tree', candidateTree], { cwd: temporary, windowsHide: true });
    execFileSync('git', ['-c', 'core.autocrlf=false', 'checkout-index', '--all'], { cwd: temporary, windowsHide: true });
    const invoke = (bin, args) => run(bin, args, { cwd: temporary, encoding: 'utf8', windowsHide: true, timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
    invoke(process.env.KODJO_PYTHON || 'python', [path.join(__dirname, '../validate-workflow-syntax.py'), temporary]);
    invoke(process.execPath, [path.join(__dirname, '../validate-workflows.js'), temporary]);
    // Parse each changed JavaScript producer, not a truncated tool rendering.
    const changed = git('diff', '--name-only', expectedParent, candidateTree).split('\n').filter(Boolean);
    for (const file of changed.filter(file => /\.(?:js|cjs|mjs)$/.test(file) && fs.existsSync(path.join(temporary, file)))) {
      invoke(process.execPath, ['--check', path.join(temporary, file)]);
    }
    // Reuse the inherited workflow control that caught the recovery-step ordering regression.
    const targetedTests = changed.includes('.github/workflows/kodjo-v2-pilot-tests.yml') ? ['tests/kodjo/incident-register.pilot.js'] : [];
    if (targetedTests.length) invoke(process.execPath, ['--test', ...targetedTests]);
    const Security = require('./vnext-remote-write-security');
    const json = file => JSON.parse(fs.readFileSync(path.join(temporary, file), 'utf8'));
    for (const file of changed.filter(file => file.endsWith('.json') && fs.existsSync(path.join(temporary, file)))) json(file);
    const request = json('.github/orchestration/vnext12/VNEXT-12-QUALIF/request.json');
    if (!['PREPARE_INITIAL', 'PREPARE_REVISION', 'QUALIFY_ONLY', 'EXECUTE_INITIAL', 'EXECUTE_REVISION'].includes(request.stage)
        || request.pre1_in_scope !== false || request.final_audit_authorized !== false || request.revision_limit !== 1) V.fail('VNEXT_PUBLICATION_STAGE_INVALID');
    if (request.stage.startsWith('EXECUTE_')) require('../execute-vnext12').validateConfig(request);

    const security = Security.evaluateRemoteWriteSecurity({ root: temporary,
      policy: json('.github/orchestration/KODJO_VNEXT_REMOTE_WRITE_POLICY.json'),
      legacyActivationRegistry: json('.github/orchestration/v2-activation-registry.json') });
    if (security.findings.length) V.fail('VNEXT_PUBLICATION_WRITER_POLICY_INVALID', JSON.stringify(security.findings));
    const History = require('./vnext-historical-coverage');
    const inventory = json('.github/orchestration/KODJO_VNEXT_HISTORICAL_DISPOSITION.json');
    require('./vnext-historical-equivalence').validateCorrespondence(json('.github/orchestration/KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json'),
      inventory, History.readSourcesAtRevision(inventory, { cwd: temporary, revision: expectedParent }), { cwd: temporary });
    // Embedded PowerShell only needs a new parse if its executable bytes change.
    const psFiles = changed.filter(file => file.endsWith('.ps1') && fs.existsSync(path.join(temporary, file)));
    const workflows = changed.filter(file => /^\.github\/workflows\/.*\.ya?ml$/.test(file));
    for (const file of workflows) {
      const old = path.join(temporary, 'old-workflow.yml');
      let before = ''; try { before = git('show', expectedParent + ':' + file); } catch (_) { /* new workflow */ }
      fs.writeFileSync(old, before);
      const script = "import yaml,json,sys; a=yaml.safe_load(open(sys.argv[1])) or {}; b=yaml.safe_load(open(sys.argv[2])) or {}; runs=lambda d:[s.get('run') for j in d.get('jobs',{}).values() for s in j.get('steps',[]) if s.get('run') and s.get('shell',j.get('defaults',d.get('defaults',{})).get('run',{}).get('shell','')) in ['powershell','pwsh']]; print(json.dumps([x for x in runs(b) if x not in runs(a)]))";
      const blocks = JSON.parse(invoke(process.env.KODJO_PYTHON || 'python', ['-c', script, old, path.join(temporary, file)]));
      for (const block of blocks) { const name = 'changed-block-' + psFiles.length + '.ps1'; fs.writeFileSync(path.join(temporary, name), block); psFiles.push(name); }
      fs.rmSync(old);
    }
    if (psFiles.length) {
      const expression = "$ErrorActionPreference='Stop'; if($PSVersionTable.PSVersion.Major -ne 5 -or $PSVersionTable.PSVersion.Minor -ne 1){throw 'Windows PowerShell 5.1 required'}; foreach($f in $args){$t=$null;$e=$null;[System.Management.Automation.Language.Parser]::ParseFile($f,[ref]$t,[ref]$e)|Out-Null;if($e.Count){throw ($e|Out-String)}}";
      const parser = path.join(temporary, 'parse-changed-powershell.ps1');
      fs.writeFileSync(parser, expression);
      try { invoke(process.env.KODJO_POWERSHELL || 'powershell.exe', ['-NoProfile', '-NonInteractive', '-File', parser, ...psFiles.map(file => path.join(temporary, file))]); }
      catch (_) { V.fail('VNEXT_PUBLICATION_POWERSHELL_VALIDATION_REQUIRED'); }
    }
    return { status: 'VALIDATED', expected_parent: expectedParent, candidate_tree: candidateTree,
      changed_paths: changed, targeted_tests: targetedTests, powershell_changed_units: psFiles.length, writer_policy: security.status,
      historical_subjects: inventory.incidents.length + inventory.tests.length + inventory.normative_paragraphs.length };
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
module.exports = { CHECKPOINT, WORKFLOWS, verifyWindow, validateTree };
