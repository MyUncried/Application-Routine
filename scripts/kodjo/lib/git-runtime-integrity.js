'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const safeArgs = args => ['-c', 'core.hooksPath=' + os.devNull, '-c', 'core.fsmonitor=false', ...args];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function git(root, ...args) {
  return execFileSync('git', safeArgs(args), { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}
function snapshot(root, exclusions = []) {
  const records = [];
  const excluded = file => exclusions.some(p => file === p || file.startsWith(p + path.sep));
  function add(file, label) {
    if (excluded(file) || !fs.existsSync(file)) return;
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) {
      records.push([label, 'SYMLINK', fs.readlinkSync(file)]);
      if (fs.statSync(file).isFile()) records.push([label + ':target', 'FILE', hash(fs.readFileSync(file))]);
    }
    else if (stat.isDirectory()) for (const name of fs.readdirSync(file).sort()) add(path.join(file, name), label + '/' + name);
    else if (stat.isFile()) records.push([label, 'FILE', hash(fs.readFileSync(file))]);
    else throw Error('GIT_RUNTIME_SPECIAL_FILE: ' + label);
  }
  const common = path.resolve(root, git(root, 'rev-parse', '--git-common-dir').trim());
  const worktreeGit = path.resolve(root, git(root, 'rev-parse', '--git-dir').trim());
  if (worktreeGit !== common) add(path.join(worktreeGit, 'config.worktree'), '.git/worktree-config');
  for (const name of ['config', 'config.worktree', 'hooks', 'info/attributes', 'info/exclude']) add(path.join(common, name), '.git/' + name);
  const ignored = git(root, 'ls-files', '--others', '--ignored', '--exclude-standard', '-z').split('\0').filter(Boolean);
  for (const name of ignored.sort()) add(path.resolve(root, name), name);
  return { schema_version: 'kodjo.git-runtime-integrity.v1', fingerprint: hash(JSON.stringify(records)), records };
}
function compare(before, after) {
  const left = new Map(before.records.map(r => [r[0], JSON.stringify(r)]));
  const right = new Map(after.records.map(r => [r[0], JSON.stringify(r)]));
  return [...new Set([...left.keys(), ...right.keys()])].filter(k => left.get(k) !== right.get(k)).sort();
}
module.exports = { safeArgs, snapshot, compare };
