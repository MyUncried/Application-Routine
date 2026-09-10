'use strict';

/**
 * Test fixtures for the KODJO V2 preservation pilot.
 *
 * A sandbox is a throwaway Git repository built with RAW git commands. The
 * fixture builder is deliberately NOT the guarded runner of the pilot: it plays
 * the role of the local /Dev writer, which is the only actor allowed to commit.
 * The pilot scripts under test never get that capability.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SCRIPTS = path.join(REPO_ROOT, 'scripts', 'kodjo');

const created = [];

/**
 * Raw git for fixtures. `core.autocrlf` is forced off exactly as the pilot's
 * guarded runner does: this machine has `core.autocrlf=true` at system level,
 * which would rewrite line endings on checkout and break byte-for-byte
 * comparison. A Linux runner defaults to false.
 */
const RAW_HARDENING = ['-c', 'core.autocrlf=false', '-c', 'core.safecrlf=false', '-c', 'core.eol=lf'];

function rawGit(args, cwd, extraEnv) {
  const res = spawnSync('git', [...RAW_HARDENING, ...args], {
    cwd: cwd,
    encoding: 'utf8',
    env: { ...process.env, ...(extraEnv || {}) },
    windowsHide: true,
  });
  if (res.error) throw res.error;
  return res;
}

function rawGitOrThrow(args, cwd, extraEnv) {
  const res = rawGit(args, cwd, extraEnv);
  if (res.status !== 0) {
    throw new Error('git ' + args.join(' ') + ' failed: ' + (res.stderr || res.stdout));
  }
  return res;
}

function tmp(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  created.push(dir);
  return dir;
}

function writeFile(root, relPath, content) {
  const abs = path.join(root, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  return abs;
}

/**
 * Build a sandbox repository with an initial commit.
 * @param {object} options
 * @param {Record<string, string|Buffer>} options.files initial tracked files
 * @returns {{dir:string, head:string}}
 */
function createSandbox(options) {
  const opts = options || {};
  const dir = tmp('kodjo-sandbox-');
  rawGitOrThrow(['init', '--quiet', '-b', 'main'], dir);
  rawGitOrThrow(['config', 'user.email', 'pilot@example.invalid'], dir);
  rawGitOrThrow(['config', 'user.name', 'KODJO pilot fixture'], dir);
  rawGitOrThrow(['config', 'core.autocrlf', 'false'], dir);
  rawGitOrThrow(['config', 'commit.gpgsign', 'false'], dir);

  const files = opts.files || {
    'src/app.ts': 'export const VERSION = 1;\n',
    'src/util.ts': 'export const add = (a: number, b: number) => a + b;\n',
    'README.md': '# sandbox\n',
    '.gitignore': 'node_modules/\n',
  };
  for (const [rel, content] of Object.entries(files)) writeFile(dir, rel, content);

  rawGitOrThrow(['add', '-A'], dir);
  rawGitOrThrow(['commit', '--quiet', '-m', 'sandbox baseline'], dir);
  const head = rawGitOrThrow(['rev-parse', 'HEAD'], dir).stdout.trim();
  return { dir: dir, head: head };
}

/** Run a pilot script with node and return its result. */
function runScript(scriptName, args, options) {
  const opts = options || {};
  const res = spawnSync(process.execPath, [path.join(SCRIPTS, scriptName), ...(args || [])], {
    cwd: opts.cwd || REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...(opts.env || {}) },
    windowsHide: true,
  });
  if (res.error) throw res.error;
  return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

/**
 * Independent oracle: materialise source_head in a virgin directory with RAW
 * git only (clone + detached checkout). It deliberately avoids the pilot's own
 * archive/extraction code so a bug there cannot mask a bad patch.
 */
function virginSpaceAt(repoDir, head) {
  const parent = tmp('kodjo-oracle-');
  const dir = path.join(parent, 'space');
  rawGitOrThrow(
    ['clone', '--quiet', '--no-hardlinks', repoDir.replace(/\\/g, '/'), dir.replace(/\\/g, '/')],
    parent
  );
  rawGitOrThrow(['-c', 'advice.detachedHead=false', 'checkout', '--quiet', head], dir);
  rawGitOrThrow(['config', 'core.autocrlf', 'false'], dir);
  const actual = rawGitOrThrow(['rev-parse', 'HEAD'], dir).stdout.trim();
  if (actual !== head) throw new Error('oracle space is at ' + actual + ', expected ' + head);
  return dir;
}

/** Count refs and HEAD of a repository — used to prove nothing was committed. */
function repoState(repoDir) {
  const head = rawGit(['rev-parse', 'HEAD'], repoDir).stdout.trim();
  const refs = rawGit(['for-each-ref', '--format=%(refname) %(objectname)'], repoDir).stdout.trim();
  const status = rawGit(['status', '--porcelain'], repoDir).stdout;
  const reflog = rawGit(['reflog', '--format=%H'], repoDir).stdout.trim();
  return { head: head, refs: refs, status: status, reflog: reflog };
}

/** Base environment shared by every scenario. */
function baseEnv(sandbox, deliveryDir, extra) {
  return {
    KODJO_REPO_DIR: sandbox.dir,
    KODJO_SLICE_ID: 'T02-PILOT',
    KODJO_SOURCE_HEAD: sandbox.head,
    KODJO_SOURCE_RUN_ID: '1000',
    KODJO_SESSION_ID: 'session-pilot-1',
    KODJO_OPERATION_ID: 'op-pilot-1',
    KODJO_ATTEMPT_ID: 'attempt-1',
    KODJO_MODE: 'IMPLEMENT',
    KODJO_DELIVERY_DIR: deliveryDir,
    // Never inherit a publication target from the developer machine.
    KODJO_ISSUE_NUMBER: '',
    KODJO_PUBLISH_CMD: '',
    KODJO_SCOPE_ALLOW: '',
    KODJO_SCOPE_ALLOWLIST_FILE: '',
    KODJO_AGENT_CMD: '',
    // Default: the production adapter registry, which ships no remote agent.
    KODJO_AGENT_ADAPTER: 'none',
    // Tests may override the check commands; the workflow never sets this flag.
    KODJO_ALLOW_TEST_ADAPTER: '1',
    ...(extra || {}),
  };
}

function aiCallCount(counterFile) {
  if (!fs.existsSync(counterFile)) return 0;
  return fs.readFileSync(counterFile, 'utf8').split('\n').filter(Boolean).length;
}

function cleanupAll() {
  for (const dir of created.splice(0)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

module.exports = {
  REPO_ROOT,
  SCRIPTS,
  rawGit,
  rawGitOrThrow,
  tmp,
  writeFile,
  createSandbox,
  runScript,
  virginSpaceAt,
  repoState,
  baseEnv,
  aiCallCount,
  cleanupAll,
};
