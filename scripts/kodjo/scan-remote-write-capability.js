#!/usr/bin/env node
'use strict';

/**
 * Static guard — KODJO V2 §1.2-A, principes 28-29, test T02-PRES-008.
 *
 * Scans every KODJO V2 remote execution path and the shared pilot scripts for any way of
 * creating a functional commit, push, branch, tag or reference, for a
 * `contents: write` permission, for persisted credentials, or for a shell
 * execution — a shell command escapes the guarded git runner of lib/git.js and
 * would be able to create a commit directly.
 *
 * Usage: node scripts/kodjo/scan-remote-write-capability.js [root]
 * Exit 0 = no remote functional-write capability found.
 */

const fs = require('node:fs');
const path = require('node:path');

const SCAN_DIRS = [path.join('.github', 'workflows'), path.join('scripts', 'kodjo')];

const PATTERNS = [
  { id: 'GIT_COMMIT', re: /\bgit\s+(?:-[^\s]+\s+)*commit\b/ },
  { id: 'GIT_PUSH', re: /\bgit\s+(?:-[^\s]+\s+)*push\b/ },
  { id: 'GIT_TAG', re: /\bgit\s+(?:-[^\s]+\s+)*tag\b/ },
  { id: 'GIT_UPDATE_REF', re: /\bgit\s+(?:-[^\s]+\s+)*update-ref\b/ },
  { id: 'GIT_BRANCH_CREATE', re: /\bgit\s+(?:-[^\s]+\s+)*(?:branch|checkout\s+-b|switch\s+-c)\b/ },
  { id: 'GIT_MERGE', re: /\bgit\s+(?:-[^\s]+\s+)*(?:merge|rebase|cherry-pick)\b/ },
  { id: 'CONTENTS_WRITE', re: /contents\s*:\s*write/ },
  { id: 'PERSIST_CREDENTIALS_TRUE', re: /persist-credentials\s*:\s*true/ },
  // KV2-09 : un en-tete d'autorisation ecrit dans .git/config echappait au
  // scanner, alors qu'il annule l'intention de persist-credentials: false.
  { id: 'GIT_CREDENTIAL_HEADER', re: /extraheader/ },
  { id: 'GH_API_REF_WRITE', re: /gh\s+api\b[^\n]*\/git\/refs/ },
  { id: 'CREATE_PULL_REQUEST_ACTION', re: /uses\s*:\s*[^\n]*create-pull-request/ },
  { id: 'GIT_AUTO_COMMIT_ACTION', re: /uses\s*:\s*[^\n]*git-auto-commit/ },
  { id: 'SHELL_EXECUTION', re: /shell\s*:\s*true/ },
];

/**
 * The single justified `shell: true` of the production remote path.
 *
 * lib/checks.js runs the repository's own check commands (`npm test`,
 * `npx tsc --noEmit`, `npm run lint`), which are shell command lines by nature.
 * The exception is safe because those command strings are FIXED constants of
 * DEFAULT_COMMANDS: an override through KODJO_CHECK_CMD_* is honoured only when
 * KODJO_ALLOW_TEST_ADAPTER=1, a flag the workflow never sets and which no
 * workflow_dispatch input can reach. Both properties are covered by tests
 * ("controles — un remplacement de commande est ignore sans le drapeau de test"
 * and "exception shell — aucune entree de workflow ne peut remplacer les
 * commandes fixes").
 */
const SHELL_TRUE_EXEMPTIONS = {
  'scripts/kodjo/lib/checks.js':
    "fixed repository check commands (npm test / npx tsc / npm run lint); overrides are gated behind " +
    'KODJO_ALLOW_TEST_ADAPTER=1, which the workflow never sets.',
};

/**
 * Lines allowed to mention a forbidden verb: the denial list of the guard, the
 * scanner's own patterns and documentation of what is refused.
 */
const ALLOWLIST_MARKER = 'kodjo-allow-mention';

function collectFiles(root) {
  const out = [];
  for (const rel of SCAN_DIRS) {
    const dir = path.join(root, rel);
    if (!fs.existsSync(dir)) continue;
    const stack = [dir];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (/\.(ya?ml|js|sh|ps1|cjs|mjs)$/.test(entry.name)) {
          const normalized = full.replace(/\\/g, '/');
          if (!normalized.includes('/.github/workflows/') || /^kodjo-v2-.*\.ya?ml$/.test(entry.name)) out.push(full);
        }
      }
    }
  }
  return out;
}

function isCommentRouterDelegation(filePath, lines, index, patternId, root) {
  if (patternId !== 'CONTENTS_WRITE' || path.relative(root, filePath).replace(/\\/g, '/') !== '.github/workflows/kodjo-v2-comment-router.yml') return false;
  if (lines[index] !== '      contents: write # Delegated comment worker; no steps in this job.') return false;
  const allowed = ['e2e-orchestration-test-v1-3','e2e-t1-t6-v1-3','slice-implementation-publication-recovery','slice-implementation','slice-recover','v1-3-integrated-t1-t9','v14-s09-dev','v14-s09-implementation-local','v14-s09-recover-worktree','v2-plan-handoff-materialize','v2-plan-handoff-queue','t01-s09-implementation-v1-3-temporary'];
  try {
    const workflow = require('./lib/yaml').parse(lines.join('\n'));
    let start = index;
    while (start >= 0 && !/^  [a-z0-9-]+:$/.test(lines[start])) start -= 1;
    if (start < 0 || lines[index - 1] !== '    permissions:') return false;
    const id = lines[start].trim().slice(0, -1), job = workflow.jobs[id];
    const target = './.github/workflows/' + (id === 't01-s09-implementation-v1-3-temporary' ? '' : 'kodjo-') + id + '.yml';
    return allowed.includes(id) && job.uses === target &&
      !Object.hasOwn(job, 'steps') && !Object.hasOwn(job, 'run') && !Object.hasOwn(job, 'runs-on') &&
      job.permissions.contents === 'write' && workflow.permissions.contents === 'read';
  } catch (_) { return false; }
}

function isExempt(filePath, line, root) {
  if (line.includes(ALLOWLIST_MARKER)) return true;
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  // The guard module and this scanner necessarily name the forbidden verbs.
  return rel === 'scripts/kodjo/lib/git.js' || rel === 'scripts/kodjo/scan-remote-write-capability.js';
}

/**
 * The evidence writer is the only remote writer. Its allowance is deliberately
 * line-exact: a parameterized ref, another branch, another command or another
 * workflow is reported as a functional-write capability.
 */
function isFixedEvidenceWriterOperation(filePath, line, patternId, root) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  if (rel !== '.github/workflows/kodjo-v2-transition.yml') return false;
  const value = line.trim();
  if (patternId === 'GIT_BRANCH_CREATE') return value === 'git checkout -b evidence refs/remotes/origin/evidence';
  if (patternId === 'GIT_COMMIT') return value === 'git commit -m "chore(evidence): append writer smoke ${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"';
  if (patternId === 'GIT_PUSH') return value === 'run: git push origin "HEAD:refs/heads/kodjo/protocol-evidence-v2"';
  return false;
}

/**
 * The lean supervisor is a post-agent deterministic writer. Claude receives no
 * GH_TOKEN and run-local-claude.js proves that it did not mutate Git refs.
 * The canonical Lean Queue remains the only post-agent writer. Allowances stay
 * file- and line-exact so no other functional writer is opened.
 */
function isFixedLeanSupervisorOperation(filePath, line, patternId, root) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  const value = line.trim();
  if (patternId === 'CONTENTS_WRITE' && rel === '.github/workflows/kodjo-v2-lean-queue.yml') {
    return value === 'contents: write';
  }
  if (rel !== 'scripts/kodjo/run-queued-request.ps1') return false;
  // KV2-09 : l'en-tete d'autorisation est pose PUIS retire dans un `finally`.
  // Les deux lignes sont declarees, exactes, et le retrait est obligatoire :
  // le scanner refuserait la pose sans le retrait.
  if (patternId === 'GIT_CREDENTIAL_HEADER') {
    return value === 'git config --local http.https://github.com/.extraheader "AUTHORIZATION: basic $auth"' ||
      value === 'git config --local --unset-all http.https://github.com/.extraheader 2>$null';
  }
  if (patternId === 'GIT_BRANCH_CREATE') return value === 'git switch -c $branch';
  if (patternId === 'GIT_COMMIT') {
    return value === 'git -c user.name=\'KODJO Windows Supervisor\' -c user.email=\'kodjo-supervisor@users.noreply.github.com\' commit -m ("feat({0}): verified implementation" -f $queue.slice_id)';
  }
  if (patternId === 'GIT_PUSH') return value === 'git push --set-upstream origin $branch';
  return false;
}


/**
 * The PLAN→IMPLEMENT handoff has two deterministic protocol writers:
 * materialization of approved evidence and insertion of one canonical Lean
 * Queue request. Their allowances are workflow- and line-exact.
 */
function isFixedPlanHandoffWriterOperation(filePath, line, patternId, root) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  const value = line.trim();
  const materialize = rel === '.github/workflows/kodjo-v2-plan-handoff-materialize.yml';
  const queue = rel === '.github/workflows/kodjo-v2-plan-handoff-queue.yml';
  if (!materialize && !queue) return false;
  if (patternId === 'CONTENTS_WRITE') return value === 'contents: write';
  if (patternId === 'PERSIST_CREDENTIALS_TRUE') return value === 'persist-credentials: true';
  if (materialize && patternId === 'GIT_COMMIT') {
    return value === 'git commit -m "chore(kodjo): materialize approved plan handoff $SLICE_ID"';
  }
  if (materialize && patternId === 'GIT_PUSH') return value === 'git push origin HEAD:main';
  if (queue && patternId === 'GIT_COMMIT') {
    return value === 'git commit -m "chore(kodjo): queue approved $SLICE_ID implementation"' ||
      value === 'git commit -m "test(kodjo): bounded handoff admission $SLICE_ID"';
  }
  if (queue && patternId === 'GIT_PUSH') return value === 'git push origin HEAD:main';
  return false;
}

// D1 extends durable consumption to disposable qualification. This permits
// only the declared permission of the exact execution job, not a code writer.
function isDisposableConsumptionPermission(filePath, lines, index, patternId, root) {
  if (patternId !== 'CONTENTS_WRITE') return false;
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  const declarations = {
    '.github/workflows/kodjo-v2-disposable-qualification.yml': ['qualify', '      contents: write # Atomic durable consumption tag; never passed to Claude.'],
    '.github/workflows/kodjo-v2-pilot-tests.yml': ['disposable-qualification', '      contents: write # Durable consumption for the explicitly requested Claude run.'],
  };
  const declaration = declarations[rel];
  if (!declaration || lines[index] !== declaration[1] || lines[index - 1] !== '    permissions:') return false;
  for (let i = index - 2; i >= 0; i--) {
    if (/^  [\w-]+:/.test(lines[i])) return lines[i] === '  ' + declaration[0] + ':';
    if (/^\S/.test(lines[i])) return false;
  }
  return false;
}

function main() {
  const root = path.resolve(process.argv[2] || process.cwd());
  const files = collectFiles(root);
  const findings = [];
  const exemptionsUsed = new Set();

  for (const file of files) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (isExempt(file, line, root)) return;
      const code = line.split('#')[0];
      for (const p of PATTERNS) {
        if (!p.re.test(code)) continue;
        if (isCommentRouterDelegation(file, lines, i, p.id, root)) continue;
        if (isDisposableConsumptionPermission(file, lines, i, p.id, root)) continue;
        if (isFixedEvidenceWriterOperation(file, line, p.id, root)) continue;
        if (isFixedLeanSupervisorOperation(file, line, p.id, root)) continue;
        if (isFixedPlanHandoffWriterOperation(file, line, p.id, root)) continue;
        if (p.id === 'SHELL_EXECUTION' && SHELL_TRUE_EXEMPTIONS[rel]) {
          exemptionsUsed.add(rel);
          continue;
        }
        findings.push({ pattern: p.id, file: rel, line: i + 1, text: line.trim() });
      }
    });
  }

  process.stdout.write('scanned ' + files.length + ' KODJO V2 remote-path file(s)\n');
  for (const rel of [...exemptionsUsed].sort()) {
    process.stdout.write('SHELL_EXECUTION exemption — ' + rel + ': ' + SHELL_TRUE_EXEMPTIONS[rel] + '\n');
  }
  if (findings.length > 0) {
    process.stderr.write('REMOTE_FUNCTIONAL_WRITE_CAPABILITY_FOUND:\n');
    for (const f of findings) {
      process.stderr.write('  ' + f.pattern + ' — ' + f.file + ':' + f.line + ' — ' + f.text + '\n');
    }
    return 1;
  }
  process.stdout.write('NO_UNDECLARED_REMOTE_WRITE_CAPABILITY\n');
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { isDisposableConsumptionPermission, collectFiles, PATTERNS, SHELL_TRUE_EXEMPTIONS, isExempt, isFixedEvidenceWriterOperation, isFixedLeanSupervisorOperation, main };
