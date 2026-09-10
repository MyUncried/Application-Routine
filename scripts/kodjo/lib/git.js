'use strict';

/**
 * Guarded git runner for the KODJO V2 remote-ephemeral executor.
 *
 * Spec: §1.2-A, §3 principes 28-29, §6.1 (business_commit_allowed=false,
 * business_push_allowed=false, functional_ref_write_allowed=false).
 *
 * Every git access made by the pilot goes through this module. Any git
 * subcommand able to create or move a functional Git reference is refused
 * BEFORE the process is spawned, so the refusal happens before any effect.
 */

const { spawnSync } = require('node:child_process');

/** Subcommands the ephemeral executor is allowed to run (read / temp-index only). */
const ALLOWED = new Set([
  'rev-parse',
  'cat-file',
  'ls-tree',
  'ls-files',
  'for-each-ref',
  'reflog',
  'status',
  'diff',
  'diff-index',
  'diff-tree',
  'read-tree',
  'add',
  'apply',
  'archive',
  'hash-object',
  'show',
  'log',
  'check-ignore',
  'var',
  'config',
]);

/**
 * Subcommands that can write a functional ref, a commit or push. Listed
 * explicitly so the diagnostic names the attempted operation.
 */
const FUNCTIONAL_WRITE = new Set([
  'commit',
  'commit-tree',
  'push',
  'send-pack',
  'receive-pack',
  'tag',
  'update-ref',
  'branch',
  'checkout',
  'switch',
  'merge',
  'rebase',
  'cherry-pick',
  'revert',
  'am',
  'reset',
  'stash',
  'worktree',
  'remote',
  'fetch',
  'pull',
  'clone',
  'replace',
  'notes',
  'fast-import',
  'symbolic-ref',
  'update-index',
  'gc',
  'prune',
  'filter-branch',
]);

class GitGuardError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GitGuardError';
    this.code = code;
  }
}

/** Config flags forced on every invocation for byte-exact, deterministic diffs. */
const HARDENING = [
  '-c', 'core.autocrlf=false',
  '-c', 'core.safecrlf=false',
  '-c', 'core.quotepath=false',
  '-c', 'core.fsmonitor=false',
  '-c', 'diff.noprefix=false',
  '-c', 'diff.external=',
  '-c', 'protocol.version=2',
];

function assertAllowed(args, env) {
  const sub = args.find((a) => !a.startsWith('-'));
  if (!sub) {
    throw new GitGuardError('GIT_SUBCOMMAND_MISSING', 'git invoked without a subcommand');
  }
  if (FUNCTIONAL_WRITE.has(sub)) {
    throw new GitGuardError(
      'FUNCTIONAL_REF_WRITE_FORBIDDEN',
      `git ${sub} is forbidden for the remote-ephemeral executor (KODJO V2 §1.2-A, principes 28-29): ` +
        'no commit, push, merge or functional reference write is permitted.'
    );
  }
  if (!ALLOWED.has(sub)) {
    throw new GitGuardError(
      'GIT_SUBCOMMAND_NOT_ALLOWED',
      `git ${sub} is not part of the allowed read/temp-index surface of the pilot.`
    );
  }
  if (sub === 'config') {
    const readOnly = args.some((a) => a === '--get' || a === '--get-all' || a === '--list' || a === '-l');
    if (!readOnly) {
      throw new GitGuardError('GIT_CONFIG_WRITE_FORBIDDEN', 'git config is read-only for the pilot.');
    }
  }
  if (sub === 'reflog') {
    const writing = args.some((a) => a === 'expire' || a === 'delete' || a === 'drop' || a === 'write');
    if (writing) {
      throw new GitGuardError('FUNCTIONAL_REF_WRITE_FORBIDDEN', 'git reflog is read-only for the pilot.');
    }
  }
  if (sub === 'add' || sub === 'read-tree') {
    if (!env || !env.GIT_INDEX_FILE) {
      throw new GitGuardError(
        'FUNCTIONAL_INDEX_WRITE_FORBIDDEN',
        `git ${sub} requires an isolated GIT_INDEX_FILE (KODJO V2 §6.13-B): the functional index is never modified.`
      );
    }
  }
  if (sub === 'apply' && (args.includes('--index') || args.includes('--cached'))) {
    throw new GitGuardError(
      'FUNCTIONAL_INDEX_WRITE_FORBIDDEN',
      'git apply --index/--cached is forbidden: the pilot only applies to a working tree copy.'
    );
  }
  return sub;
}

/**
 * Run a git command after guard validation.
 * @returns {{status:number, stdout:string, stderr:string, subcommand:string}}
 */
function git(args, options = {}) {
  const env = { ...process.env, ...(options.env || {}) };
  const subcommand = assertAllowed(args, env);
  const res = spawnSync('git', [...HARDENING, ...args], {
    cwd: options.cwd,
    env,
    encoding: options.encoding === null ? 'buffer' : 'utf8',
    maxBuffer: options.maxBuffer || 256 * 1024 * 1024,
    stdio: options.stdio,
    windowsHide: true,
  });
  if (res.error) {
    throw new GitGuardError('GIT_SPAWN_FAILED', `git ${subcommand} could not be spawned: ${res.error.message}`);
  }
  return { status: res.status, stdout: res.stdout, stderr: res.stderr, subcommand };
}

/** Run git and throw when it fails. */
function gitOrThrow(args, options = {}) {
  const res = git(args, options);
  if (res.status !== 0) {
    const err = new GitGuardError(
      'GIT_COMMAND_FAILED',
      `git ${args.join(' ')} failed (exit ${res.status}): ${String(res.stderr || '').trim()}`
    );
    err.status = res.status;
    err.stderr = String(res.stderr || '');
    throw err;
  }
  return res;
}

/** Run git writing stdout straight into a file descriptor (binary safe). */
function gitToFile(args, filePath, options = {}) {
  const fs = require('node:fs');
  const env = { ...process.env, ...(options.env || {}) };
  const subcommand = assertAllowed(args, env);
  const fd = fs.openSync(filePath, 'w');
  try {
    const res = spawnSync('git', [...HARDENING, ...args], {
      cwd: options.cwd,
      env,
      stdio: ['ignore', fd, 'pipe'],
      windowsHide: true,
    });
    if (res.error) {
      throw new GitGuardError('GIT_SPAWN_FAILED', `git ${subcommand} could not be spawned: ${res.error.message}`);
    }
    return { status: res.status, stderr: res.stderr ? res.stderr.toString('utf8') : '' };
  } finally {
    fs.closeSync(fd);
  }
}

module.exports = { git, gitOrThrow, gitToFile, GitGuardError, ALLOWED, FUNCTIONAL_WRITE };
