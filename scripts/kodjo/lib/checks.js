'use strict';

/**
 * Check catalogue and runner — KODJO V2 §6.13-B.
 *
 * "Les controles sont executes avec capture individuelle de leur code de sortie
 *  afin que Jest, TypeScript, lint ou le controle de perimetre ne court-circuitent
 *  ni la synthese ni l'upload."
 *
 * A check that could not run is reported NOT_RUN — never PASS.
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const REQUIRED_CHECKS = ['jest', 'typescript', 'lint', 'scope'];

/** Real commands of this repository (package.json scripts / expo toolchain). */
const DEFAULT_COMMANDS = {
  jest: 'npm test --silent',
  typescript: 'npx --no-install tsc --noEmit',
  lint: 'npm run lint --silent',
  scope: 'node ' + JSON.stringify(path.join(__dirname, '..', 'check-scope.js')),
};

/**
 * Which checks must be re-run for a TARGETED_FIX given the checks that failed.
 * `scope` is always re-run because the delta itself changed (§6.13-C step 4:
 * "les controles echoues et ceux directement impactes").
 */
const IMPACT = {
  jest: ['jest'],
  typescript: ['typescript', 'jest'],
  lint: ['lint'],
  scope: ['scope'],
};

function resolveChecksToRerun(failedChecks) {
  const out = new Set(['scope']);
  for (const failed of failedChecks || []) {
    const key = String(failed).trim().toLowerCase();
    if (!key) continue;
    for (const impacted of IMPACT[key] || [key]) out.add(impacted);
  }
  return REQUIRED_CHECKS.filter((c) => out.has(c));
}

/**
 * Resolve the command of a check.
 *
 * Command overrides are accepted ONLY when the test-adapter flag is enabled, for
 * the same reason an arbitrary agent command is refused: a free-form command
 * would escape the guarded git runner. The workflow never sets that flag, so in
 * a real run the fixed DEFAULT_COMMANDS of this repository always apply.
 */
function commandFor(name, env) {
  const e = env || process.env;
  const override = e['KODJO_CHECK_CMD_' + name.toUpperCase()];
  if (override && override.trim()) {
    if (e.KODJO_ALLOW_TEST_ADAPTER === '1') return override.trim();
    process.stderr.write(
      '[KODJO_V2_PILOT] CHECK_COMMAND_OVERRIDE_IGNORED: KODJO_CHECK_CMD_' +
        name.toUpperCase() +
        ' is only honoured with KODJO_ALLOW_TEST_ADAPTER=1; using the repository command.\n'
    );
  }
  const command = DEFAULT_COMMANDS[name] || null;
  if (!command || e.KODJO_QUALIFICATION_ISOLATED_CHECKS !== '1') return command;
  // The disposable qualification executes the same checks twice in a throwaway
  // clone.  Shared Jest caches can be locked by another persistent-runner
  // process and `expo lint` writes its cache inside the repository.  Disable
  // both caches only for that qualification; production commands stay intact.
  if (name === 'jest' || name === 'lint') return command + ' -- --no-cache';
  return command;
}

function parseJestCounts(output) {
  const m = /Tests:\s+(?:(\d+)\s+failed,\s+)?(?:(\d+)\s+skipped,\s+)?(?:(\d+)\s+todo,\s+)?(?:(\d+)\s+passed,\s+)?(\d+)\s+total/.exec(
    output || ''
  );
  if (!m) return { passed_tests: null, failed_tests: null, total_tests: null };
  return {
    passed_tests: m[4] ? Number(m[4]) : 0,
    failed_tests: m[1] ? Number(m[1]) : 0,
    total_tests: Number(m[5]),
  };
}

function tail(text, max) {
  const s = String(text || '');
  return s.length <= max ? s : s.slice(s.length - max);
}

/**
 * Messages proving the command never really executed: a missing binary, a
 * missing npm script or an uninstalled toolchain. Locale-tolerant because the
 * developer shell may be localized.
 */
const LAUNCH_FAILURE_PATTERNS = [
  { id: 'COMMAND_NOT_FOUND', re: /command not found|not recognized as an internal|n'est pas reconnu en tant que/i },
  { id: 'NPM_MISSING_SCRIPT', re: /Missing script:|npm ERR! missing script/i },
  { id: 'DEPENDENCIES_NOT_INSTALLED', re: /npx canceled due to missing packages|could not determine executable to run/i },
  { id: 'MODULE_NOT_INSTALLED', re: /Cannot find module '(?:jest|typescript|eslint|expo)/i },
];

/**
 * Classify a non-zero exit as a launch failure when it cannot be a real verdict.
 * @returns {string|null} the reason, or null when the exit is a genuine result
 */
function classifyLaunchFailure(exitCode, output) {
  if (exitCode === 127 || exitCode === 9009) return 'COMMAND_NOT_FOUND (exit ' + exitCode + ')';
  // A POSIX exit status is 0-255; anything else comes from a failed launch.
  if (exitCode !== null && (exitCode < 0 || exitCode > 255)) {
    return 'COMMAND_LAUNCH_FAILURE (exit ' + exitCode + ')';
  }
  for (const p of LAUNCH_FAILURE_PATTERNS) {
    if (p.re.test(output || '')) return p.id + ': ' + tail(output, 200).trim();
  }
  return null;
}

/**
 * Run one check and always return a structured result. This function never
 * throws and never marks an unexecuted command as a success.
 */
function runCheck(name, options) {
  const opts = options || {};
  const env = { ...process.env, ...(opts.env || {}) };
  const command = commandFor(name, env);
  const startedAt = new Date().toISOString();

  const result = {
    check: name,
    command: command,
    status: 'NOT_RUN',
    exit_code: null,
    started_at: startedAt,
    finished_at: null,
    duration_ms: null,
    reason: null,
    passed_tests: null,
    failed_tests: null,
    total_tests: null,
    log_excerpt: '',
    rerun_in_this_attempt: true,
  };

  if (!command) {
    result.reason = 'NO_COMMAND_CONFIGURED';
    result.finished_at = new Date().toISOString();
    return result;
  }

  const t0 = Date.now();
  const res = spawnSync(command, {
    shell: true,
    cwd: opts.cwd,
    env,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: Number(env.KODJO_CHECK_TIMEOUT_MS || 20 * 60 * 1000),
    windowsHide: true,
  });
  result.duration_ms = Date.now() - t0;
  result.finished_at = new Date().toISOString();

  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  result.log_excerpt = tail(stdout + stderr, 4000);

  if (res.error) {
    result.reason = 'SPAWN_FAILED: ' + res.error.message;
    result.status = 'NOT_RUN';
    return result;
  }
  if (res.status === null) {
    result.reason = 'TIMED_OUT_OR_SIGNALLED: signal=' + String(res.signal);
    result.status = 'NOT_RUN';
    return result;
  }

  result.exit_code = res.status;

  // 78 (EX_CONFIG) is the agreed "could not be executed" code of the pilot
  // checks: a missing prerequisite is never reported as a success.
  if (res.status === 78) {
    result.reason = 'PRECONDITION_MISSING: ' + tail(stderr || stdout, 300).trim();
    result.status = 'NOT_RUN';
    return result;
  }

  const launchFailure = classifyLaunchFailure(res.status, stdout + stderr);
  if (launchFailure) {
    // An unavailable toolchain is an environment limitation, not a verdict on
    // the code: it must be reported NOT_RUN, never PASS and never FAIL.
    result.reason = launchFailure;
    result.status = 'NOT_RUN';
    return result;
  }

  if (name === 'jest') {
    Object.assign(result, parseJestCounts(stdout + stderr));
  }

  result.status = res.status === 0 ? 'PASS' : 'FAIL';
  return result;
}

module.exports = {
  REQUIRED_CHECKS,
  DEFAULT_COMMANDS,
  IMPACT,
  resolveChecksToRerun,
  commandFor,
  parseJestCounts,
  classifyLaunchFailure,
  runCheck,
};
