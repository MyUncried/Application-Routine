#!/usr/bin/env node
'use strict';

/**
 * Workflow validation for the pilot.
 *
 * 1. Every .github/workflows/*.yml must parse.
 * 2. The KODJO V2 implementation workflow must satisfy the normative
 *    constraints of §1.2-A, §4.7 and §6.13-B:
 *      - permissions.contents == 'read' (never write)
 *      - actions/checkout with persist-credentials: false
 *      - preservation step placed before every check step
 *      - upload + publication steps guarded by `if: always()`
 *      - every ./scripts/... command referenced actually exists
 *
 * Usage: node scripts/kodjo/validate-workflows.js [root]
 */

const fs = require('node:fs');
const path = require('node:path');

const { parse } = require('./lib/yaml');

const IMPLEMENTATION_WORKFLOW = 'kodjo-v2-implementation-artifact.yml';
const CHECK_STEP_IDS = ['jest', 'typescript', 'lint', 'scope'];

function listWorkflows(root) {
  const dir = path.join(root, '.github', 'workflows');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => /\.ya?ml$/.test(n))
    .map((n) => path.join(dir, n));
}

function stepsOf(doc) {
  const steps = [];
  for (const jobName of Object.keys(doc.jobs || {})) {
    for (const step of doc.jobs[jobName].steps || []) steps.push({ job: jobName, step: step });
  }
  return steps;
}

function referencedScripts(doc) {
  const out = new Set();
  for (const entry of stepsOf(doc)) {
    const run = entry.step.run;
    if (typeof run !== 'string') continue;
    const re = /(?:^|\s)((?:\.\/)?scripts\/[A-Za-z0-9_./-]+\.(?:js|sh|ps1))/g;
    let m = re.exec(run);
    while (m) {
      out.add(m[1].replace(/^\.\//, ''));
      m = re.exec(run);
    }
  }
  return [...out];
}

function validateImplementationWorkflow(doc, root, errors) {
  const permissions = doc.permissions || {};
  if (permissions.contents !== 'read') {
    errors.push('permissions.contents must be "read", found ' + JSON.stringify(permissions.contents));
  }
  for (const [scope, level] of Object.entries(permissions)) {
    if (scope === 'contents' && level === 'write') errors.push('a write-level contents permission is forbidden');
  }

  const steps = stepsOf(doc);
  const checkout = steps.find((s) => typeof s.step.uses === 'string' && s.step.uses.startsWith('actions/checkout'));
  if (!checkout) errors.push('no actions/checkout step found');
  else if (!checkout.step.with || checkout.step.with['persist-credentials'] !== false) {
    errors.push('actions/checkout must set persist-credentials: false');
  }

  const indexOfId = (id) => steps.findIndex((s) => s.step.id === id);
  const preserve = indexOfId('preserve');
  const patchCheck = indexOfId('patch_check');
  const recoveryUpload = indexOfId('recovery_upload');
  if (preserve < 0) errors.push('no step with id "preserve"');
  if (patchCheck < 0) errors.push('no step with id "patch_check"');
  if (recoveryUpload < 0) errors.push('no step with id "recovery_upload"');

  // The recovery artifact must be uploaded before any check: an interrupted
  // runner must not be able to lose the patch.
  if (recoveryUpload >= 0) {
    if (preserve >= 0 && recoveryUpload < preserve) {
      errors.push('recovery_upload runs before preservation');
    }
    if (patchCheck >= 0 && recoveryUpload < patchCheck) {
      errors.push('recovery_upload runs before patch validation');
    }
    const step = steps[recoveryUpload].step;
    if (!String(step.uses || '').startsWith('actions/upload-artifact')) {
      errors.push('recovery_upload must be an actions/upload-artifact step');
    }
    if (!step.with || !String(step.with.path || '').includes('delivery/recovery')) {
      errors.push('recovery_upload must upload delivery/recovery/');
    }
    if (!step.with || step.with['if-no-files-found'] !== 'error') {
      errors.push('recovery_upload must fail when the recovery package is missing');
    }
    if (typeof step.if !== 'string' || !step.if.includes('always()')) {
      errors.push('recovery_upload must be guarded by always()');
    }
  }

  for (const id of CHECK_STEP_IDS) {
    const idx = indexOfId(id);
    if (idx < 0) {
      errors.push('no step with id "' + id + '"');
      continue;
    }
    if (preserve >= 0 && idx < preserve) errors.push('check "' + id + '" runs before preservation');
    if (patchCheck >= 0 && idx < patchCheck) errors.push('check "' + id + '" runs before patch validation');
    if (recoveryUpload >= 0 && idx < recoveryUpload) {
      errors.push('check "' + id + '" runs before the recovery artifact upload');
    }
  }

  // The adapter must be framed by a git state capture and verification.
  const agent = indexOfId('agent');
  const before = indexOfId('git_state_before');
  const after = indexOfId('git_state_after');
  if (agent < 0) errors.push('no step with id "agent"');
  if (before < 0) errors.push('no step with id "git_state_before"');
  if (after < 0) errors.push('no step with id "git_state_after"');
  if (before >= 0 && agent >= 0 && before > agent) errors.push('git_state_before must precede the adapter');
  if (after >= 0 && agent >= 0 && after < agent) errors.push('git_state_after must follow the adapter');
  if (after >= 0 && preserve >= 0 && after > preserve) {
    errors.push('git_state_after must precede preservation so its verdict is part of the recovery package');
  }

  for (const id of ['summarize', 'result_upload', 'publish', 'receipt_upload', 'exit_status']) {
    const idx = indexOfId(id);
    if (idx < 0) {
      errors.push('no step with id "' + id + '"');
      continue;
    }
    const cond = steps[idx].step.if;
    if (typeof cond !== 'string' || !cond.includes('always()')) {
      errors.push('step "' + id + '" must be guarded by always(), found ' + JSON.stringify(cond));
    }
  }

  const exitIdx = indexOfId('exit_status');
  const resultUpload = indexOfId('result_upload');
  const publishIdx = indexOfId('publish');
  const receiptUpload = indexOfId('receipt_upload');
  if (exitIdx >= 0 && resultUpload >= 0 && exitIdx < resultUpload) {
    errors.push('the red-exit step must come after the result artifact upload');
  }
  if (exitIdx >= 0 && publishIdx >= 0 && exitIdx < publishIdx) {
    errors.push('the red-exit step must come after the publication attempt');
  }
  if (receiptUpload >= 0 && publishIdx >= 0 && receiptUpload < publishIdx) {
    errors.push('the publication receipt must be uploaded after the publication attempt');
  }
  if (exitIdx >= 0 && receiptUpload >= 0 && exitIdx < receiptUpload) {
    errors.push('the red-exit step must come after the publication receipt upload');
  }
  // The result artifact must not re-upload the immutable recovery package.
  if (resultUpload >= 0) {
    const p = String((steps[resultUpload].step.with || {}).path || '');
    if (/delivery\/recovery/.test(p)) {
      errors.push('result_upload must not re-upload delivery/recovery/: that package is already immutable');
    }
  }
  // The comment must carry the artifact URL, its digest and the patch hash as
  // three distinct fields.
  if (indexOfId('summarize') >= 0) {
    const env = steps[indexOfId('summarize')].step.env || {};
    for (const key of ['KODJO_RECOVERY_ARTIFACT_URL', 'KODJO_RECOVERY_ARTIFACT_DIGEST']) {
      if (!env[key]) errors.push('summarize must receive ' + key + ' from the recovery upload');
    }
    if (env.KODJO_RECOVERY_ARTIFACT_URL && !String(env.KODJO_RECOVERY_ARTIFACT_URL).includes('recovery_upload')) {
      errors.push('KODJO_RECOVERY_ARTIFACT_URL must come from steps.recovery_upload.outputs.artifact-url');
    }
  }

  for (const script of referencedScripts(doc)) {
    if (!fs.existsSync(path.join(root, script))) {
      errors.push('workflow references a script that does not exist: ' + script);
    }
  }
}

function main() {
  const root = path.resolve(process.argv[2] || process.cwd());
  const files = listWorkflows(root);
  let failures = 0;

  if (files.length === 0) {
    process.stdout.write('no workflow file found under .github/workflows\n');
    return 0;
  }

  for (const file of files) {
    const name = path.basename(file);
    const errors = [];
    let doc = null;
    try {
      doc = parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      errors.push('YAML_PARSE_ERROR: ' + err.message);
    }
    if (doc && name === IMPLEMENTATION_WORKFLOW) validateImplementationWorkflow(doc, root, errors);

    if (errors.length > 0) {
      failures += 1;
      process.stderr.write('FAIL ' + name + '\n');
      for (const e of errors) process.stderr.write('  - ' + e + '\n');
    } else {
      process.stdout.write('OK   ' + name + '\n');
    }
  }
  return failures === 0 ? 0 : 1;
}

if (require.main === module) process.exit(main());

module.exports = { listWorkflows, validateImplementationWorkflow, referencedScripts, main };
