#!/usr/bin/env node
'use strict';

/**
 * Git state guard around the implementation adapter.
 *
 * KODJO V2 §1.2-A and principes 28-29: a remote executor may modify its
 * throwaway working tree, but it must not create a commit, move a reference or
 * touch the functional index. Static scanning and the guarded runner cannot
 * cover an adapter that spawns git itself, so this guard captures the Git state
 * before the adapter runs and verifies it afterwards.
 *
 * Usage:
 *   node scripts/kodjo/git-state-guard.js capture <deliveryDir> before|after
 *   node scripts/kodjo/git-state-guard.js verify  <deliveryDir>
 *
 * A detected mutation blocks the functional continuation while the produced
 * delta is still preserved: this script never deletes anything.
 *
 * Exit codes: 0 = intact, 4 = mutated, 3 = the state could not be read.
 */

const fs = require('node:fs');
const path = require('node:path');

const { git } = require('./lib/git');
const { sha256Bytes } = require('./lib/hash');
const { writeJson, readJsonIfExists } = require('./lib/json');
const { integrityDir } = require('./lib/delivery');
const { info, fail } = require('./lib/log');

/** Worktree content is expected to change; refs, HEAD, reflog and index are not. */
function captureState(repoDir) {
  const head = git(['rev-parse', 'HEAD'], { cwd: repoDir });
  const refs = git(['for-each-ref', '--format=%(refname) %(objectname)'], { cwd: repoDir });
  const reflog = git(['reflog', '--format=%H %gd %gs'], { cwd: repoDir });
  const indexPath = git(['rev-parse', '--git-path', 'index'], { cwd: repoDir });

  if (head.status !== 0 || refs.status !== 0) {
    throw new Error('GIT_STATE_UNREADABLE: ' + String(head.stderr || refs.stderr).trim());
  }

  let indexSha = null;
  const resolvedIndex = String(indexPath.stdout || '').trim();
  if (resolvedIndex) {
    const abs = path.isAbsolute(resolvedIndex) ? resolvedIndex : path.join(repoDir, resolvedIndex);
    if (fs.existsSync(abs)) indexSha = sha256Bytes(fs.readFileSync(abs));
  }

  return {
    captured_at: new Date().toISOString(),
    repo_dir: repoDir,
    head: String(head.stdout).trim(),
    refs: String(refs.stdout).trim(),
    reflog: String(reflog.status === 0 ? reflog.stdout : '').trim(),
    index_sha256: indexSha,
  };
}

function compare(before, after) {
  const differences = [];
  if (before.head !== after.head) {
    differences.push({ field: 'head', before: before.head, after: after.head });
  }
  if (before.refs !== after.refs) {
    differences.push({ field: 'refs', before: before.refs, after: after.refs });
  }
  if (before.reflog !== after.reflog) {
    differences.push({ field: 'reflog', before: before.reflog, after: after.reflog });
  }
  if (before.index_sha256 !== after.index_sha256) {
    differences.push({ field: 'index', before: before.index_sha256, after: after.index_sha256 });
  }
  return differences;
}

function main() {
  const action = (process.argv[2] || '').trim();
  const deliveryDir = path.resolve(process.argv[3] || 'delivery');
  const phase = (process.argv[4] || 'before').trim();
  const repoDir = path.resolve(process.env.KODJO_REPO_DIR || process.cwd());
  const dir = integrityDir(deliveryDir);
  fs.mkdirSync(dir, { recursive: true });

  if (action === 'capture') {
    if (phase !== 'before' && phase !== 'after') {
      fail('GIT_STATE_ARGS', 'phase must be "before" or "after"');
      return 3;
    }
    try {
      const state = captureState(repoDir);
      writeJson(path.join(dir, 'git-state-' + phase + '.json'), state);
      info('git state captured (' + phase + '): head=' + state.head.slice(0, 12));
      return 0;
    } catch (err) {
      fail('GIT_STATE_UNREADABLE', String(err.message));
      return 3;
    }
  }

  if (action === 'verify') {
    const before = readJsonIfExists(path.join(dir, 'git-state-before.json'));
    if (!before) {
      fail('GIT_STATE_BASELINE_MISSING', 'no git-state-before.json: the adapter ran without a baseline.');
      writeJson(path.join(dir, 'git-state.json'), {
        status: 'UNKNOWN',
        checked_at: new Date().toISOString(),
        reason: 'GIT_STATE_BASELINE_MISSING',
        functional_continuation: 'BLOCKED',
      });
      return 3;
    }

    let after;
    try {
      after = captureState(repoDir);
    } catch (err) {
      writeJson(path.join(dir, 'git-state.json'), {
        status: 'UNKNOWN',
        checked_at: new Date().toISOString(),
        reason: String(err.message),
        functional_continuation: 'BLOCKED',
      });
      fail('GIT_STATE_UNREADABLE', String(err.message));
      return 3;
    }
    writeJson(path.join(dir, 'git-state-after.json'), after);

    const differences = compare(before, after);
    const intact = differences.length === 0;
    writeJson(path.join(dir, 'git-state.json'), {
      status: intact ? 'INTACT' : 'MUTATED',
      checked_at: new Date().toISOString(),
      differences: differences,
      functional_continuation: intact ? 'ALLOWED' : 'BLOCKED',
      note: intact
        ? 'HEAD, refs, reflog and index are unchanged across the adapter execution.'
        : 'The adapter mutated the Git state. Functional continuation is blocked; the produced delta is still preserved.',
    });

    if (!intact) {
      fail(
        'GIT_STATE_MUTATED',
        'the adapter changed ' +
          differences.map((d) => d.field).join(', ') +
          '. Functional continuation is blocked; preservation of the delta continues.'
      );
      return 4;
    }
    info('git state intact across the adapter execution');
    return 0;
  }

  fail('GIT_STATE_ARGS', 'usage: git-state-guard.js capture|verify <deliveryDir> [before|after]');
  return 3;
}

if (require.main === module) process.exit(main());

module.exports = { captureState, compare };
