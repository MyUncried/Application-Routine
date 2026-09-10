#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { runCheck } = require('./lib/checks');
const {
  CLAUDE_CODE_VERSION, adapterConfig, adapterConfigHash, normalizeRequest,
  buildPrompt, buildArgs, classifyClaudeFailure, sha256, redact,
} = require('./lib/claude-local');

function die(code, message) {
  process.stderr.write('[KODJO_V2] ' + code + ': ' + message + '\n');
  return 1;
}

function command(bin, args, cwd, env, timeout) {
  return spawnSync(bin, args, {
    cwd, env, encoding: 'utf8', windowsHide: true, shell: false,
    timeout, maxBuffer: 64 * 1024 * 1024,
  });
}

function git(args, cwd) {
  const r = command('git', args, cwd, process.env, 60000);
  if (r.error || r.status !== 0) throw new Error('GIT_READ_FAILED: ' + (r.error ? r.error.message : r.stderr));
  return String(r.stdout).trim();
}

function refs(cwd) {
  return git(['for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads', 'refs/tags'], cwd);
}

function changedFiles(cwd) {
  const out = git(['status', '--porcelain=v1', '--untracked-files=all'], cwd);
  return out ? out.split(/\r?\n/).map((line) => line.slice(3).replace(/^"|"$/g, '')) : [];
}

function inScope(file, scopes) {
  const f = file.replace(/\\/g, '/');
  return scopes.some((raw) => {
    const s = raw.replace(/\\/g, '/');
    if (s.endsWith('/**')) return f === s.slice(0, -3) || f.startsWith(s.slice(0, -2));
    if (s.endsWith('/*')) return f.startsWith(s.slice(0, -1)) && !f.slice(s.length - 1).includes('/');
    return f === s;
  });
}

const CHECK_RUNNER_SOURCE = `'use strict';
const { spawnSync } = require('node:child_process');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const commands = {
  jest: [npm, ['test', '--silent']],
  typescript: [npx, ['--no-install', 'tsc', '--noEmit']],
  lint: [npm, ['run', 'lint', '--silent']]
};
const id = process.argv[2];
if (!Object.prototype.hasOwnProperty.call(commands, id)) process.exit(78);
const env = { ...process.env };
delete env.CLAUDE_CODE_OAUTH_TOKEN;
delete env.ANTHROPIC_API_KEY;
const result = spawnSync(commands[id][0], commands[id][1], { cwd: process.cwd(), env, shell: false, stdio: 'inherit', windowsHide: true });
process.exit(result.error || result.status === null ? 78 : result.status);
`;

function main() {
  const requestPath = process.argv[2];
  if (!requestPath) return die('USAGE', 'node scripts/kodjo/run-local-claude.js <request.json>');
  const repoRoot = path.resolve(git(['rev-parse', '--show-toplevel'], process.cwd()));
  let request;
  try {
    request = normalizeRequest(JSON.parse(fs.readFileSync(path.resolve(requestPath), 'utf8').replace(/^\uFEFF/, '')), repoRoot);
  } catch (err) {
    return die('REQUEST_REFUSED', err.message);
  }

  const head = git(['rev-parse', 'HEAD'], repoRoot);
  if (head !== request.source_head) return die('HEAD_DIVERGED', 'HEAD local != source_head');
  const promptRelative = path.relative(repoRoot, request.prompt_file).replace(/\\/g, '/');
  const promptHashBefore = sha256(fs.readFileSync(request.prompt_file));
  const initialChanges = changedFiles(repoRoot).filter((f) => {
    const normalized = f.replace(/\\/g, '/');
    return normalized !== promptRelative && path.resolve(f) !== path.resolve(requestPath);
  });
  if (initialChanges.length) return die('WORKTREE_NOT_CLEAN', initialChanges.join(', '));

  const fetch = command('git', ['fetch', '--quiet'], repoRoot, process.env, 120000);
  if (fetch.error || fetch.status !== 0) return die('REMOTE_HEAD_UNAVAILABLE', fetch.error ? fetch.error.message : fetch.stderr);
  let upstream;
  try { upstream = git(['rev-parse', '@{upstream}'], repoRoot); }
  catch (_) { return die('UPSTREAM_NOT_CONFIGURED', 'la branche courante ne possÃ¨de pas de branche distante de suivi'); }
  if (upstream !== head) return die('HEAD_DIVERGED', 'HEAD local != HEAD distant suivi aprÃ¨s fetch');

  const token = process.env.CLAUDE_CODE_OAUTH_TOKEN || '';
  if (!token) return die('KODJO-V2-CLAUDE-AUTH', 'jeton OAuth absent; exÃ©cutez setup-kodjo-claude-auth.ps1 une fois');

  const testMode = process.env.KODJO_ALLOW_TEST_ADAPTER === '1';
  const claudeCli = !testMode && process.platform === 'win32' ? path.join(process.env.APPDATA, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js') : null;
  const claudeBin = testMode && process.env.KODJO_CLAUDE_BIN ? process.env.KODJO_CLAUDE_BIN : (claudeCli ? process.execPath : 'claude');
  const claudePrefix = claudeCli ? [claudeCli] : [];
  const version = command(claudeBin, [...claudePrefix, '--version'], repoRoot, process.env, 30000);
  if (version.error || version.status !== 0) return die('CLAUDE_NOT_AVAILABLE', version.error ? version.error.message : version.stderr);
  const versionText = String(version.stdout || version.stderr).trim();
  if (!new RegExp('(^|\\s)' + CLAUDE_CODE_VERSION.replace(/\./g, '\\.') + '(\\s|$)').test(versionText)) {
    return die('CLAUDE_VERSION_REFUSED', 'attendu ' + CLAUDE_CODE_VERSION + ', reÃ§u ' + versionText);
  }

  const stateRoot = process.env.KODJO_STATE_ROOT
    ? path.resolve(process.env.KODJO_STATE_ROOT)
    : path.join(os.homedir(), '.kodjo-v2');
  fs.mkdirSync(stateRoot, { recursive: true });
  const lockPath = path.join(stateRoot, 'claude-local.lock');
  let lock;
  try {
    lock = fs.openSync(lockPath, 'wx', 0o600);
  } catch (err) {
    return die('CLAUDE_EXECUTION_ALREADY_ACTIVE', lockPath);
  }

  let result, runId, runDir, beforeRefs, promptBytes;
  try {
    runId = request.slice_id + '-' + Date.now();
    request.generated_session_id = request.mode === 'INITIAL' ? require('node:crypto').randomUUID() : request.session_id;
    runDir = path.join(stateRoot, 'runs', runId);
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, 'kodjo-check-runner.js'), CHECK_RUNNER_SOURCE, { encoding: 'utf8', mode: 0o500 });
    fs.writeFileSync(path.join(runDir, 'mcp.json'), '{"mcpServers":{}}\n', 'utf8');
    fs.writeFileSync(path.join(runDir, 'settings.json'), '{"disableAllHooks":true}\n', 'utf8');
    const taskText = fs.readFileSync(request.prompt_file, 'utf8');
    const prompt = buildPrompt(request, taskText, runDir);
    promptBytes = Buffer.byteLength(prompt, 'utf8');
    if (promptBytes > request.limits.max_prompt_bytes || promptBytes > request.limits.max_total_prompt_bytes) {
      return die('PROMPT_BUDGET_EXCEEDED', promptBytes + ' octets');
    }
    beforeRefs = refs(repoRoot);
    const intent = {
      schema_version: 'kodjo.protocol.v2.claude-invocation.0.6.11',
      state: 'EXTERNAL_CALL_INTENDED', run_id: runId, slice_id: request.slice_id,
      source_head: request.source_head, mode: request.mode, prompt_bytes: promptBytes,
      config: adapterConfig(), effective_allowed_tools: require('./lib/claude-local').concreteAllowedTools(runDir),
      claude_adapter_config_sha256: adapterConfigHash(), started_at: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(runDir, 'invocation.json'), JSON.stringify(intent, null, 2) + '\n', 'utf8');
    const args = buildArgs(request, runDir, prompt);
    intent.state = 'EXTERNAL_CALL_SENT';
    intent.command_sha256 = sha256(JSON.stringify([claudeBin, ...claudePrefix, ...args.slice(0, -1), '[PROMPT]']));
    fs.writeFileSync(path.join(runDir, 'invocation.json'), JSON.stringify(intent, null, 2) + '\n', 'utf8');
    const claudeEnv = { ...process.env };
    result = command(claudeBin, [...claudePrefix, ...args], repoRoot, claudeEnv, request.limits.max_duration_seconds * 1000);
    fs.writeFileSync(path.join(runDir, 'claude-output.json'), redact(result.stdout || ''), 'utf8');
    fs.writeFileSync(path.join(runDir, 'claude-stderr.txt'), redact(result.stderr || ''), 'utf8');
  } finally {
    try { fs.closeSync(lock); } catch (_) {}
    try { fs.unlinkSync(lockPath); } catch (_) {}
  }

  delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
  delete process.env.ANTHROPIC_API_KEY;
  const afterRefs = refs(repoRoot);
  if (beforeRefs !== afterRefs) return die('FUNCTIONAL_REF_MUTATION_DETECTED', 'Claude a modifiÃ© une rÃ©fÃ©rence Git');
  if (sha256(fs.readFileSync(request.prompt_file)) !== promptHashBefore) {
    return die('PROMPT_MUTATION_DETECTED', 'le fichier de mission a Ã©tÃ© modifiÃ©');
  }
  const files = changedFiles(repoRoot).filter((f) => {
    const normalized = f.replace(/\\/g, '/');
    return normalized !== promptRelative && path.resolve(f) !== path.resolve(requestPath);
  });
  const outside = files.filter((f) => !inScope(f, request.scope_allow));
  const checks = request.checks.map((name) => runCheck(name, { cwd: repoRoot }));
  const summary = {
    schema_version: 'kodjo.protocol.v2.local-result.0.6.11', run_id: runId,
    session_id: request.generated_session_id,
    claude_exit_code: result.status, claude_error: result.error ? result.error.message : null,
    claude_failure: classifyClaudeFailure(result),
    timed_out: result.status === null, source_head: request.source_head,
    modified_files: files, out_of_scope_files: outside, checks,
    status: result.status === 0 && !outside.length && checks.every((c) => c.status === 'PASS')
      ? 'IMPLEMENTED_AND_VERIFIED'
      : (result.status !== 0 || result.error ? 'IMPLEMENTATION_FAILED' : 'IMPLEMENTED_WITH_FAILED_CHECKS'),
  };
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
  process.stdout.write('\n[KODJO_V2] ' + summary.status + '\n');
  process.stdout.write('[KODJO_V2] fichiers modifiÃ©s: ' + (files.join(', ') || 'aucun') + '\n');
  for (const c of checks) process.stdout.write('[KODJO_V2] ' + c.check + '=' + c.status + '\n');
  if (outside.length) process.stderr.write('[KODJO_V2] SCOPE_VIOLATION: ' + outside.join(', ') + '\n');
  process.stdout.write('[KODJO_V2] diagnostic: ' + path.join(runDir, 'result.json') + '\n');
  return summary.status === 'IMPLEMENTED_AND_VERIFIED' ? 0 : 1;
}

if (require.main === module) {
  try { process.exitCode = main(); } catch (err) { process.exitCode = die('LOCAL_ADAPTER_FAILURE', err.stack || err.message); }
}

module.exports = { inScope, changedFiles, refs };

