#!/usr/bin/env node
'use strict';
// Supervisor only: run the approved production adapter in a local disposable
// clone. This file never edits the application or invokes Claude directly.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const APPROVED_HEAD = 'e47525b70e62b4ea3d4b32b9fae09e306b5e3094';
const GATE = 'issue_comment:5921521038';
const TARGET_HASH = 'd5ca8d589b886cf4231eea457527729081288d1544c35703ee83f18085db4d59';
const ROOT = '.github/orchestration/vnext12/VNEXT-12-QUALIF';
const CORE = 'scripts/kodjo/fixtures/vnext12/core.js';
const TEST = 'tests/fixtures/vnext12/core.test.js';
const KEEP = 'scripts/kodjo/fixtures/vnext12/keep.js';
function validateConfig(c) {
  const initial = c.stage === 'EXECUTE_INITIAL' && c.approved_protocol_head === APPROVED_HEAD
    && c.gate_ref === GATE && c.approval_target_hash === TARGET_HASH;
  const revision = c.stage === 'EXECUTE_REVISION' && /^[0-9a-f]{40}$/.test(c.approved_protocol_head)
    && c.approved_protocol_head !== APPROVED_HEAD && /^issue_comment:[1-9][0-9]*$/.test(c.gate_ref)
    && /^[0-9a-f]{64}$/.test(c.approval_target_hash) && c.approval_target_hash !== TARGET_HASH;
  if ((!initial && !revision) || c.slice_id !== 'VNEXT-12-QUALIF' || c.revision_limit !== 1
      || c.pre1_in_scope !== false || c.final_audit_authorized !== false) throw Error('VNEXT12_EXECUTION_CONFIG_REFUSED');
  return c;
}
function validateAdmittedRevision(a) {
  if (a.planningEnvelope?.planning_mode !== 'REVISION' || a.cumulativeRegister?.revision_count !== 1
      || a.cumulativeRegister?.revision_limit !== 1 || a.revisionArtifacts?.revision_outcome?.status !== 'RESOLVED') throw Error('VNEXT12_REAL_BOUNDED_REVISION_REQUIRED');
}
function localOrigin(origin) {
  if (!path.isAbsolute(origin) || /^(https?:|ssh:|git:)|@/.test(origin)) throw Error('VNEXT12_REMOTE_ORIGIN_FORBIDDEN');
  return origin;
}
function validateDelta(files) {
  if (files.length !== 2 || !files.includes(CORE) || !files.includes(TEST)) throw Error('VNEXT12_EXACT_DELTA_REQUIRED:' + files.join(','));
}
function disposableCloneArgs(origin, work) {
  return ['-c', 'core.autocrlf=false', 'clone', '--quiet', origin, work];
}
function consumptionCredential(env = process.env, spawn = spawnSync) {
  const credentialEnv = { ...env };
  for (const key of ['GH_TOKEN', 'GITHUB_TOKEN', 'KODJO_VNEXT_CONSUMPTION_TOKEN']) delete credentialEnv[key];
  let token = env.KODJO_VNEXT_CONSUMPTION_TOKEN;
  const source = token ? 'REPOSITORY_SECRET' : 'RUNNER_OWNER_LOGIN';
  if (!token) {
    const r = spawn('gh', ['auth', 'token', '--hostname', 'github.com', '--user', 'MyUncried'],
      { env: credentialEnv, encoding: 'utf8', shell: false, windowsHide: true, timeout: 30000 });
    if (r.error || r.status !== 0 || !String(r.stdout || '').trim()) throw Error('VNEXT12_CONSUMPTION_CREDENTIAL_REQUIRED');
    token = String(r.stdout).trim();
  }
  credentialEnv.GH_TOKEN = token;
  const call = args => {
    const r = spawn('gh', args, { env: credentialEnv, encoding: 'utf8', shell: false, windowsHide: true, timeout: 30000 });
    if (r.error || r.status !== 0) throw Error('VNEXT12_CONSUMPTION_CREDENTIAL_CHECK_FAILED');
    return String(r.stdout || '');
  };
  if (source === 'RUNNER_OWNER_LOGIN' && call(['api', '--hostname', 'github.com', 'user', '--jq', '.login']).trim() !== 'MyUncried') {
    throw Error('VNEXT12_CONSUMPTION_OWNER_MISMATCH');
  }
  const observed = call(['api', '--hostname', 'github.com', '--include', 'repos/MyUncried/Application-Routine']);
  const scopeHeader = /^x-oauth-scopes:\s*([^\r\n]*)/im.exec(observed);
  if (scopeHeader) {
    const scopes = scopeHeader[1].split(',').map(x => x.trim());
    if (!scopes.includes('repo') || !scopes.includes('workflow')) throw Error('VNEXT12_CONSUMPTION_CREDENTIAL_SCOPE_REQUIRED');
  } else if (source === 'RUNNER_OWNER_LOGIN') {
    // Stored owner credentials must provide observable OAuth scope evidence.
    throw Error('VNEXT12_CONSUMPTION_CREDENTIAL_SCOPE_REQUIRED');
  }
  return { token, source };
}
function runtimeFailure(result, actual) {
  if (result.code === 0 && actual.status === 'IMPLEMENTED_AND_VERIFIED') return null;
  const failure = /(?:LOCAL_ADAPTER_FAILURE|REQUEST_REFUSED):\s*([^\r\n]+)/.exec(result.output || '');
  return 'VNEXT12_INITIAL_RUNTIME_FAILED:' + (failure ? failure[1] : actual.diagnostic || actual.status || result.code);
}
function preserveRuntime(runDir, destination) {
  // Persist ordinary evidence without following runtime junctions or sockets.
  // Record exclusions explicitly instead of dereferencing paths outside the run.
  const excluded = [];
  fs.cpSync(runDir, destination, { recursive: true, filter: source => {
    const stat = fs.lstatSync(source);
    if (stat.isSymbolicLink() || !(stat.isDirectory() || stat.isFile())) {
      excluded.push(path.relative(runDir, source)); return false;
    }
    return true;
  } });
  return { excluded_non_regular_paths: excluded };
}
function main(configFile, evidenceDirectory) {
  if (process.platform !== 'win32' || process.env.GITHUB_ACTIONS !== 'true') throw Error('VNEXT12_REAL_WINDOWS_RUNNER_REQUIRED');
  const config = validateConfig(JSON.parse(fs.readFileSync(configFile, 'utf8')));
  const APPROVED_HEAD = config.approved_protocol_head, GATE = config.gate_ref, TARGET_HASH = config.approval_target_hash;
  const revision = config.stage === 'EXECUTE_REVISION';
  const scenario = revision ? 'revision' : 'initial';
  const source = process.cwd();
  const evidence = path.resolve(evidenceDirectory);
  if (evidence.startsWith(source + path.sep)) throw Error('VNEXT12_EXTERNAL_EVIDENCE_REQUIRED');
  fs.mkdirSync(evidence, { recursive: true });
  const save = (name, data) => fs.writeFileSync(path.join(evidence, name), JSON.stringify(data, null, 2) + '\n');
  let credential;
  try { credential = consumptionCredential(); }
  catch (error) {
    save('status.json', { schema_version: 'kodjo.vnext.disposable-initial-evidence.v1',
      approved_protocol_head: APPROVED_HEAD, controller_head: process.env.VNEXT12_CONTROLLER_HEAD,
      gate_ref: GATE, approval_target_hash: TARGET_HASH, revision_limit: 1,
      implementation_invoked: false, application_published: false, pre1_in_scope: false,
      final_audit_invoked: false, initial_status: 'CREDENTIAL_CHECK', verdict: 'FAIL',
      diagnostic: error.message, disposable_cleanup: true });
    throw error;
  }
  const token = credential.token;
  console.log('::add-mask::' + token);
  save('consumption-credential.json', { source: credential.source, repository: 'MyUncried/Application-Routine', token_recorded: false });
  const cleanEnv = { ...process.env };
  for (const key of ['GH_TOKEN','GITHUB_TOKEN','KODJO_VNEXT_CONSUMPTION_TOKEN','KODJO_LIVE_GH_TOKEN','KODJO_SUPERVISED_QUEUE','KODJO_PREFLIGHT_FILE','KODJO_VNEXT_QUEUE_FILE','KODJO_DISPOSABLE_EVIDENCE_DIR','KODJO_INITIAL_RESTART_QUEUE','CLAUDE_CODE_OAUTH_TOKEN','ANTHROPIC_API_KEY']) delete cleanEnv[key];
  const privilegedEnv = { ...cleanEnv, GH_TOKEN: token };
  let commandIndex = 0;
  function run(bin, args, cwd, { env = cleanEnv, allowFailure = false, timeout = 120000 } = {}) {
    const r = spawnSync(bin, args, { cwd, env, encoding: 'utf8', shell: false, windowsHide: true, timeout, maxBuffer: 64 * 1024 * 1024 });
    const text = String(r.stdout || '') + String(r.stderr || '');
    fs.writeFileSync(path.join(evidence, 'command-' + String(++commandIndex).padStart(3, '0') + '.log'), text.split(token).join('[REDACTED]'));
    if ((r.error || r.status !== 0) && !allowFailure) throw Error('VNEXT12_COMMAND_FAILED:' + bin + ':' + (r.error?.code || r.status));
    return { code: r.status, output: text, stdout: String(r.stdout || '') };
  }
  const git = (cwd, ...args) => run('git', args, cwd).stdout.trim();
  const stateRoot = process.env.KODJO_STATE_ROOT ? path.resolve(process.env.KODJO_STATE_ROOT) : path.join(os.homedir(), '.kodjo-v2');
  const runDir = path.join(stateRoot, 'runs', 'github-' + process.env.GITHUB_RUN_ID + '-' + process.env.GITHUB_RUN_ATTEMPT);
  const root = path.join(process.env.RUNNER_TEMP, 'kodjo-vnext12-' + scenario + '-' + process.env.GITHUB_RUN_ID + '-' + process.env.GITHUB_RUN_ATTEMPT);
  const origin = path.join(root, 'origin.git');
  const work = path.join(root, 'work');
  const summary = { schema_version: 'kodjo.vnext.disposable-initial-evidence.v1',
    approved_protocol_head: config.approved_protocol_head, controller_head: process.env.VNEXT12_CONTROLLER_HEAD,
    gate_ref: GATE, approval_target_hash: TARGET_HASH, revision_limit: 1,
    implementation_invoked: false, application_published: false, pre1_in_scope: false,
    final_audit_invoked: false, initial_status: 'PRECHECK', verdict: 'FAIL' };
  save('status.json', summary);
  try {
    if (git(source, 'rev-parse', 'HEAD') !== APPROVED_HEAD || git(source, 'status', '--porcelain', '--untracked-files=all')) throw Error('VNEXT12_APPROVED_CHECKOUT_REQUIRED');
    if (fs.existsSync(root) || fs.existsSync(runDir)) throw Error('VNEXT12_ALREADY_ATTEMPTED');
    fs.mkdirSync(root);
    // All runtime imports are from the exact approved checkout, never from
    // the newer workflow/controller commit.
    const load = p => require(path.join(source, 'scripts/kodjo', p));
    const Chain = load('lib/vnext-live-chain');
    const Auth = load('verify-authorizations');
    const github = Auth.ghClient({ env: privilegedEnv });
    const transport = JSON.parse(Chain.readGit(source, APPROVED_HEAD, ROOT + '/' + scenario + '/transport.json'));
    const seed = { slice_id: 'VNEXT-12-QUALIF', issue_number: 269, source_head: APPROVED_HEAD,
      slice_bootstrap_file: transport.slice_bootstrap_file, slice_bootstrap_sha256: transport.slice_bootstrap_sha256,
      authorized_plan: { plan_path: transport.plan_path }, independent_review: { review_path: transport.review_path },
      prompt_file: transport.prompt_file, user_gate: { gate_ref: GATE },
      request_id: transport.request_id, created_at: transport.created_at };
    const derived = Chain.deriveQueue(seed, { cwd: source, github });
    if (revision) validateAdmittedRevision(derived.artifacts);
    if (derived.approvalTarget.contract_hash !== TARGET_HASH) throw Error('VNEXT12_EXACT_APPROVAL_TARGET_MISMATCH');
    const queueFile = path.join(evidence, 'approved-queue.json');
    const queue = derived.projection.legacy_queue_request;
    fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2) + '\n', { flag: 'wx' });
    save('admission-before-install.json', Chain.admit(queueFile, { cwd: source, github, allowExternalQueueFile: true }));
    save('handoff-runtime.json', { artifacts: derived.artifacts, projection: derived.projection });
    const request = load('lib/queue-request').projectQueueRequest(queue);
    const requestFile = path.join(evidence, 'local-request.json');
    fs.writeFileSync(requestFile, JSON.stringify(request, null, 2) + '\n', { flag: 'wx' });
    // Fault injection is explicitly negative-only. Both probes use the actual
    // production runner, real Git objects and real authenticated GitHub reads.
    // No positive authorization/reviewer response is replaced.
    const probeEnv = { ...cleanEnv, KODJO_LIVE_GH_TOKEN: token };
    const runner = path.join(source, 'scripts/kodjo/run-local-claude.js');
    const noAuthority = run(process.execPath, [runner, requestFile], source,
      { env: probeEnv, allowFailure: true, timeout: 600000 });
    if (noAuthority.code === 0 || !noAuthority.output.includes('VNEXT_LOCAL_QUEUE_AUTHORITY_REQUIRED') || fs.existsSync(runDir)) throw Error('VNEXT12_MISSING_AUTHORITY_NOT_REFUSED_BEFORE_CLAUDE');
    const altered = JSON.parse(JSON.stringify(queue));
    altered.independent_review.review_blob_oid = '0'.repeat(40);
    const missingProofFile = path.join(evidence, 'negative-missing-review-proof.json');
    fs.writeFileSync(missingProofFile, JSON.stringify(altered, null, 2) + '\n');
    const noProof = run(process.execPath, [runner, requestFile], source,
      { env: { ...probeEnv, KODJO_VNEXT_QUEUE_FILE: missingProofFile }, allowFailure: true, timeout: 600000 });
    if (noProof.code === 0 || !noProof.output.includes('VNEXT_QUEUE_ADMISSION_REQUEST_MISMATCH') || fs.existsSync(runDir)) throw Error('VNEXT12_MISSING_PROOF_NOT_REFUSED_BEFORE_CLAUDE');
    save('negative-before-claude.json', { fault_injection: true, production_runner: runner,
      missing_authority: { refused: true, exit_code: noAuthority.code, diagnostic: 'VNEXT_LOCAL_QUEUE_AUTHORITY_REQUIRED' },
      missing_review_proof: { refused: true, exit_code: noProof.code, diagnostic: 'VNEXT_QUEUE_ADMISSION_REQUEST_MISMATCH' },
      runtime_state_created: false, claude_invoked: false });
    run(process.execPath, [path.join(source, 'scripts/kodjo/certify-persistent-runner-lock.js'), path.join(evidence, 'runner-lock-certification.json')], source);
    git(root, 'clone', '--mirror', '--quiet', source, origin);
    // Apply byte-preserving checkout policy BEFORE clone materializes files.
    // Setting it afterwards leaves a CRLF tree inconsistent with the LF index.
    git(root, ...disposableCloneArgs(origin, work));
    git(work, 'config', 'core.autocrlf', 'false');
    git(work, 'checkout', '--quiet', '-b', 'qualification-local', APPROVED_HEAD);
    if (git(work, 'status', '--porcelain', '--untracked-files=all')) throw Error('VNEXT12_CLONE_BYTES_DRIFTED');
    git(work, 'push', '--quiet', '--set-upstream', 'origin', 'qualification-local');
    localOrigin(git(work, 'remote', 'get-url', 'origin'));
    run('cmd.exe', ['/d','/s','/c','npm ci --no-audit --no-fund'], work, { timeout: 900000 });
    if (git(work, 'status', '--porcelain', '--untracked-files=all')) throw Error('VNEXT12_DEPENDENCIES_MUTATED_CHECKOUT');
    const keepHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(work, KEEP))).digest('hex');
    const baseline = {};
    for (const check of ['jest','typescript','lint']) {
      const file = path.join(evidence, 'baseline-' + check + '.json');
      run(process.execPath, ['scripts/kodjo/run-check.js', check, file], work, { allowFailure: true, timeout: 900000 });
      baseline[check] = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (baseline[check].status !== 'PASS') throw Error('VNEXT12_BASELINE_CHECK_FAILED:' + check);
    }
    if (git(work, 'status', '--porcelain', '--untracked-files=all')) throw Error('VNEXT12_BASELINE_CHECKS_MUTATED_CHECKOUT');
    save('baseline-checks.json', baseline);
    // Re-observe real approval on the execution clone before the production
    // runner takes its own fresh observations and atomic consumption receipt.
    save('admission-before-runtime.json', load('lib/vnext-live-chain').admit(queueFile, { cwd: work, github, allowExternalQueueFile: true }));
    summary.initial_status = 'RUNTIME_REQUESTED'; save('status.json', summary);
    const result = run('powershell.exe', ['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',
      path.join(work, 'scripts/kodjo/start-kodjo-v2.ps1'), '-Request', requestFile], work,
    { env: { ...cleanEnv, KODJO_LIVE_GH_TOKEN: token, KODJO_VNEXT_QUEUE_FILE: queueFile,
        KODJO_DISPOSABLE_EVIDENCE_DIR: evidence, KODJO_QUALIFICATION_ISOLATED_CHECKS: '1',
        KODJO_QUALIFICATION_CHECK_CACHE_DIR: path.join(root, 'check-cache') },
      allowFailure: true, timeout: 6000000 });
    if (!fs.existsSync(path.join(runDir, 'result.json'))) throw Error('VNEXT12_RUNTIME_RESULT_MISSING:' + result.code);
    const actual = JSON.parse(fs.readFileSync(path.join(runDir, 'result.json'), 'utf8'));
    summary.initial_status = actual.status; summary.implementation_invoked = actual.claude_invoked === true;
    save('runtime-result.json', actual);
    const failure = runtimeFailure(result, actual);
    if (failure) throw Error(failure);
    save('runtime-copy.json', preserveRuntime(runDir, path.join(evidence, 'runtime')));
    fs.writeFileSync(path.join(evidence, 'implementation.patch'), run('git', ['diff','--binary','HEAD'], work).stdout);
    const changed = git(work, 'diff', '--name-only', 'HEAD').split('\n').filter(Boolean);
    validateDelta(changed);
    if (git(work, 'ls-files', '--others', '--exclude-standard')) throw Error('VNEXT12_UNTRACKED_DELTA');
    const afterKeepHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(work, KEEP))).digest('hex');
    if (afterKeepHash !== keepHash) throw Error('VNEXT12_PRESERVATION_FAILED');
    const value = require(path.join(work, CORE)).value();
    if (value !== 2) throw Error('VNEXT12_OBSERVED_VALUE_NOT_TWO');
    for (const file of changed) {
      const dest = path.join(evidence, 'application-delta', file); fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(work, file), dest);
    }
    const test = run('cmd.exe', ['/d','/s','/c','npx --no-install jest tests/fixtures/vnext12/core.test.js --runInBand --no-cache'], work, { timeout: 300000 });
    save('functional-proof.json', { observed_value: value, targeted_jest_exit_code: test.code,
      preserve_before_sha256: keepHash, preserve_after_sha256: afterKeepHash, modified_files: changed });
    if (result.code !== 0 || actual.status !== 'IMPLEMENTED_AND_VERIFIED') throw Error('VNEXT12_INITIAL_RUNTIME_NOT_VERIFIED:' + actual.status);
    summary.verdict = revision ? 'REVISION_PASS' : 'INITIAL_PASS';
    summary.planning_mode = derived.artifacts.planningEnvelope.planning_mode;
  } catch (error) {
    summary.diagnostic = error.message;
    if (fs.existsSync(runDir)) {
      try { save('runtime-copy.json', preserveRuntime(runDir, path.join(evidence, 'runtime'))); }
      catch (preservationError) { summary.runtime_copy_diagnostic = preservationError.code || 'RUNTIME_COPY_FAILED'; }
      const file = path.join(runDir, 'result.json');
      if (fs.existsSync(file)) {
        const actual = JSON.parse(fs.readFileSync(file, 'utf8'));
        summary.initial_status = actual.status; summary.implementation_invoked = actual.claude_invoked === true;
        save('runtime-result.json', actual);
      }
    }
    if (fs.existsSync(path.join(work, '.git'))) fs.writeFileSync(path.join(evidence, 'implementation.patch'), run('git', ['diff','--binary','HEAD'], work, { allowFailure: true }).stdout);
    throw error;
  } finally {
    save('status.json', summary);
    // Durable patch/results are preserved above even on refusal or failure.
    if (fs.existsSync(root)) fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    summary.disposable_cleanup = !fs.existsSync(root); save('status.json', summary);
    console.log(JSON.stringify(summary));
  }
}
if (require.main === module) {
  try { main(process.argv[2], process.argv[3]); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { validateConfig, validateAdmittedRevision, localOrigin, validateDelta, disposableCloneArgs, consumptionCredential, runtimeFailure, preserveRuntime, APPROVED_HEAD, GATE, TARGET_HASH, CORE, TEST };
