'use strict';

/**
 * Local reproduction of the job defined by
 * .github/workflows/kodjo-v2-implementation-artifact.yml.
 *
 * The step list, their order and their `if` conditions mirror the workflow; the
 * workflow itself is separately validated structurally by validate-workflows.js
 * so the two cannot drift silently.
 *
 * Every step records whether the preserved patch already existed when it
 * started, and whether the recovery artifact had already been uploaded: those
 * observations are the evidence that conservation is durable before any check.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const { runScript } = require('./sandbox');

const RECOVERY_MEMBERS = [
  'implementation.patch',
  'implementation.patch.sha256',
  'modified-files.json',
  'manifest.json',
  'development-report.md',
];

function patchState(deliveryDir) {
  const patch = path.join(deliveryDir, 'recovery', 'implementation.patch');
  if (!fs.existsSync(patch)) return { present: false, sha256: null };
  return {
    present: true,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(patch)).digest('hex'),
  };
}

/**
 * Simulate actions/upload-artifact: copy the uploaded paths to an immutable
 * store and return the outputs the real action provides.
 */
function uploadArtifact(name, sources, store, options) {
  const opts = options || {};
  const dest = path.join(store, name);
  fs.mkdirSync(dest, { recursive: true });
  let files = 0;
  // Mirror actions/upload-artifact: entries keep their path relative to the
  // common ancestor of the uploaded paths. With a single directory the files
  // land at the artifact root; with several, each keeps its own subdirectory.
  const multiple = sources.filter((s) => fs.existsSync(s)).length > 1;
  for (const src of sources) {
    if (!fs.existsSync(src)) continue;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      const target = multiple ? path.join(dest, path.basename(src)) : dest;
      fs.cpSync(src, target, { recursive: true });
      files += fs.readdirSync(target).length;
    } else {
      fs.copyFileSync(src, path.join(dest, path.basename(src)));
      files += 1;
    }
  }
  if (files === 0 && opts.ifNoFilesFound === 'error') {
    return { status: 1, outputs: {}, error: 'if-no-files-found: error' };
  }
  // The real action returns a content digest of the uploaded archive; it is a
  // different value from the sha256 of implementation.patch.
  const digest = crypto
    .createHash('sha256')
    .update(name + '|' + String(files) + '|artifact-archive')
    .digest('hex');
  return {
    status: 0,
    dir: dest,
    outputs: {
      'artifact-id': String(1000 + name.length),
      'artifact-url': 'https://github.com/OWNER/REPO/actions/runs/1000/artifacts/' + (1000 + name.length),
      'artifact-digest': digest,
    },
  };
}

/**
 * @param {object} options
 * @param {{dir:string, head:string}} options.sandbox
 * @param {string} options.deliveryDir
 * @param {object} options.env
 * @param {string[]} [options.checks]
 * @param {boolean} [options.stopAfterRecoveryUpload] simulate a runner loss
 * @param {boolean} [options.failRecoveryUpload] simulate an upload-artifact outage
 * @param {boolean} [options.failRecoveryRetry] also fail the fallback deposit
 */
function runPipeline(options) {
  const sandbox = options.sandbox;
  const deliveryDir = options.deliveryDir;
  const env = { ...options.env };
  const checks = options.checks || ['jest', 'typescript', 'lint', 'scope'];
  // The simulated artifact store must live OUTSIDE the repository under test:
  // otherwise the harness itself would pollute the preserved delta.
  const store = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-artifacts-'));
  const steps = [];
  const artifacts = {};

  const record = (id, res, extra) => {
    steps.push({
      id: id,
      status: res === null ? 'SKIPPED' : res.status,
      stdout: res === null ? '' : res.stdout || '',
      stderr: res === null ? '' : res.stderr || '',
      patch_before: patchState(deliveryDir),
      recovery_uploaded_before: Boolean(artifacts.recovery),
      ...(extra || {}),
    });
    return res;
  };

  const slice = env.KODJO_SLICE_ID || 'SLICE';
  const runId = env.KODJO_SOURCE_RUN_ID || '1000';
  const names = {
    recovery: 'kodjo-' + slice + '-' + runId + '-recovery',
    result: 'kodjo-' + slice + '-' + runId + '-result',
    receipt: 'kodjo-' + slice + '-' + runId + '-publication-receipt',
  };

  // id: git_state_before
  record('git_state_before', runScript('git-state-guard.js', ['capture', deliveryDir, 'before'], { env: env }));

  // id: agent — bounded adapter, continue-on-error.
  // GITHUB_OUTPUT is mirrored so that `agent_status` reaches the preservation
  // step exactly as the workflow does (env KODJO_AGENT_STATUS).
  const outputsFile = path.join(store, 'agent-outputs.txt');
  fs.writeFileSync(outputsFile, '');
  record(
    'agent',
    runScript('run-implementation-agent.js', [deliveryDir], {
      env: { ...env, GITHUB_OUTPUT: outputsFile },
    })
  );
  const agentOutputs = {};
  for (const line of fs.readFileSync(outputsFile, 'utf8').split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq > 0) agentOutputs[line.slice(0, eq)] = line.slice(eq + 1);
  }
  const preserveEnv = {
    ...env,
    KODJO_AGENT_STATUS: agentOutputs.agent_status || env.KODJO_AGENT_STATUS || '',
    KODJO_SESSION_ID: agentOutputs.session_id || env.KODJO_SESSION_ID || '',
  };

  // id: git_state_after — if: always(), continue-on-error
  record('git_state_after', runScript('git-state-guard.js', ['verify', deliveryDir], { env: env }));

  // id: preserve — if: always() && steps.agent.outcome != 'skipped'
  const preserve = record('preserve', runScript('preserve-implementation.js', [deliveryDir], { env: preserveEnv }));

  // id: patch_check — if: always() && steps.preserve.outcome == 'success'
  const patchCheck =
    preserve.status === 0
      ? record('patch_check', runScript('verify-delivery.js', [deliveryDir], { env: env }))
      : record('patch_check', null);

  // id: recovery_upload — BEFORE any check
  let upload = null;
  if (preserve.status === 0) {
    upload = options.failRecoveryUpload
      ? { status: 1, outputs: {}, error: 'simulated upload-artifact outage' }
      : uploadArtifact(names.recovery, [path.join(deliveryDir, 'recovery')], store, {
          ifNoFilesFound: 'error',
        });
    if (upload.status === 0) artifacts.recovery = upload;
  }
  steps.push({
    id: 'recovery_upload',
    status: upload ? upload.status : 'SKIPPED',
    outputs: upload ? upload.outputs : {},
    uploaded_paths: upload && upload.dir ? fs.readdirSync(upload.dir).sort() : [],
    patch_before: patchState(deliveryDir),
    recovery_uploaded_before: false,
    stdout: '',
    stderr: '',
  });

  // id: recovery_upload_retry — fallback deposit, only when the first failed.
  let retry = null;
  if (preserve.status === 0 && (!upload || upload.status !== 0)) {
    retry = options.failRecoveryRetry
      ? { status: 1, outputs: {}, error: 'simulated fallback outage' }
      : uploadArtifact(names.recovery + '-retry', [path.join(deliveryDir, 'recovery')], store, {
          ifNoFilesFound: 'error',
        });
    if (retry.status === 0) artifacts.recoveryRetry = retry;
  }
  steps.push({
    id: 'recovery_upload_retry',
    status: retry ? retry.status : 'SKIPPED',
    outputs: retry ? retry.outputs : {},
    patch_before: patchState(deliveryDir),
    recovery_uploaded_before: Boolean(artifacts.recovery),
    stdout: '',
    stderr: '',
  });

  const deposited = artifacts.recovery || artifacts.recoveryRetry || null;

  if (options.stopAfterRecoveryUpload) {
    // Simulated runner loss right after the recovery upload.
    const byId = {};
    for (const s of steps) byId[s.id] = s;
    return { steps, byId, artifacts, store, names, deliveryDir, sandbox, interrupted: true };
  }

  // checks — if: always() && steps.recovery_upload.outcome == 'success'
  for (const name of checks) {
    if (!deposited || !patchCheck || patchCheck.status !== 0) {
      record(name, null);
      continue;
    }
    record(
      name,
      runScript('run-check.js', [name, path.join(deliveryDir, 'checks', name + '.json')], { env: env })
    );
  }

  // id: summarize — if: always(), receives the real artifact coordinates
  const out = (a, key) => (a ? a.outputs[key] || '' : '');
  const summarizeEnv = {
    ...env,
    KODJO_RECOVERY_ARTIFACT_NAME: names.recovery,
    KODJO_RECOVERY_ARTIFACT_URL: out(artifacts.recovery, 'artifact-url'),
    KODJO_RECOVERY_ARTIFACT_DIGEST: out(artifacts.recovery, 'artifact-digest'),
    KODJO_RECOVERY_ARTIFACT_ID: out(artifacts.recovery, 'artifact-id'),
    KODJO_RECOVERY_UPLOAD_OUTCOME: artifacts.recovery ? 'success' : upload ? 'failure' : 'skipped',
    KODJO_RECOVERY_RETRY_NAME: names.recovery + '-retry',
    KODJO_RECOVERY_RETRY_URL: out(artifacts.recoveryRetry, 'artifact-url'),
    KODJO_RECOVERY_RETRY_DIGEST: out(artifacts.recoveryRetry, 'artifact-digest'),
    KODJO_RECOVERY_RETRY_ID: out(artifacts.recoveryRetry, 'artifact-id'),
    KODJO_RECOVERY_RETRY_OUTCOME: artifacts.recoveryRetry ? 'success' : retry ? 'failure' : 'skipped',
  };
  record('summarize', runScript('finalize-implementation-delivery.js', [deliveryDir], { env: summarizeEnv }));

  // id: result_upload — if: always()
  const resultUpload = uploadArtifact(
    names.result,
    [path.join(deliveryDir, 'result'), path.join(deliveryDir, 'checks'), path.join(deliveryDir, 'integrity')],
    store,
    { ifNoFilesFound: 'warn' }
  );
  if (resultUpload.status === 0) artifacts.result = resultUpload;
  steps.push({
    id: 'result_upload',
    status: resultUpload.status,
    outputs: resultUpload.outputs,
    patch_before: patchState(deliveryDir),
    recovery_uploaded_before: Boolean(artifacts.recovery),
    stdout: '',
    stderr: '',
  });

  // id: publish — if: always(), continue-on-error
  record('publish', runScript('publish-implementation-output.js', [deliveryDir], { env: env }));

  // id: receipt_upload — if: always()
  const receiptUpload = uploadArtifact(names.receipt, [path.join(deliveryDir, 'receipt')], store, {
    ifNoFilesFound: 'warn',
  });
  if (receiptUpload.status === 0) artifacts.receipt = receiptUpload;
  steps.push({
    id: 'receipt_upload',
    status: receiptUpload.status,
    outputs: receiptUpload.outputs,
    patch_before: patchState(deliveryDir),
    recovery_uploaded_before: Boolean(artifacts.recovery),
    stdout: '',
    stderr: '',
  });

  // id: exit_status — if: always(), last step of the job
  record(
    'exit_status',
    runScript('exit-from-business-status.js', [path.join(deliveryDir, 'result', 'manifest.json')], { env: env })
  );

  const byId = {};
  for (const s of steps) byId[s.id] = s;
  return { steps, byId, artifacts, store, names, deliveryDir, sandbox, interrupted: false };
}

/** Index of a step id in the executed order. */
function orderOf(result, id) {
  return result.steps.findIndex((s) => s.id === id);
}

module.exports = { runPipeline, orderOf, patchState, uploadArtifact, RECOVERY_MEMBERS };
