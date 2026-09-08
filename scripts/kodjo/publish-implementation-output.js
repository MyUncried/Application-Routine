#!/usr/bin/env node
'use strict';

/**
 * Step "Publish structured issue result" — KODJO V2 §4.7 (7)-(9) / §6.13-B.
 *
 * Usage: node scripts/kodjo/publish-implementation-output.js <deliveryDir> [--republish]
 *
 * "L'echec du commentaire ne supprime pas l'artefact : il cree
 *  publication_status=FAILED et autorise uniquement REPUBLISH_EXISTING."
 *
 * SECURITY — no shell, no command assembly:
 *   - `gh` is executed directly with a structured argument vector and
 *     `shell: false`; no command string is ever built or interpreted;
 *   - `issue_number` must be a positive decimal integer and `repository` must
 *     match `owner/name` strictly, validated BEFORE `gh` is launched;
 *   - a free-form KODJO_PUBLISH_CMD is refused; only a confined `test:<name>`
 *     adapter under tests/kodjo/adapters/ is accepted, and only with
 *     KODJO_ALLOW_TEST_ADAPTER=1, which the workflow never sets;
 *   - the receipt records the executable and its non-sensitive arguments only,
 *     never a command line, and redacts credential-shaped strings from logs.
 *
 * The publication state lives in receipt/publication-receipt.json and is
 * uploaded as its OWN artifact afterwards; it is never written back into the
 * recovery package, which was uploaded before the checks even ran.
 *
 * This step never regenerates content, never calls an AI adapter, and always
 * exits 0 so a publication outage cannot hide or delete an artifact.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { resultDir, receiptDir } = require('./lib/delivery');
const { resolveTestAdapter, REPO_ROOT } = require('./lib/adapters');
const { writeJson, readJsonIfExists } = require('./lib/json');
const { sha256File } = require('./lib/hash');
const { info, fail } = require('./lib/log');

const ISSUE_NUMBER = /^[1-9][0-9]{0,17}$/;
const REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

/** Remove credential-shaped strings from anything we persist. */
function redact(text) {
  return String(text || '')
    .replace(/gh[pousr]_[A-Za-z0-9]{16,}/g, '[REDACTED_TOKEN]')
    .replace(/github_pat_[A-Za-z0-9_]{16,}/g, '[REDACTED_TOKEN]')
    .replace(/(Authorization|token|Bearer)\s*[:=]\s*\S+/gi, '$1 [REDACTED]');
}

/**
 * Build the invocation to perform, or describe why it is refused.
 * Pure function: it launches nothing, so it can be asserted directly by tests.
 *
 * @returns {{kind:'GH'|'TEST_ADAPTER'|'SKIP'|'REFUSED', executable?:string,
 *            args?:string[], safe_args?:string[], reason?:string, code?:string}}
 */
function buildInvocation(env, bodyFile) {
  const override = (env.KODJO_PUBLISH_CMD || '').trim();
  if (override) {
    try {
      const adapter = resolveTestAdapter(override, env, 'publication adapter');
      return {
        kind: 'TEST_ADAPTER',
        executable: process.execPath,
        args: [adapter.script, bodyFile],
        safe_args: [path.relative(REPO_ROOT, adapter.script).replace(/\\/g, '/'), path.basename(bodyFile)],
        adapter: adapter.id,
      };
    } catch (err) {
      return { kind: 'REFUSED', code: err.code, reason: err.message };
    }
  }

  const issue = (env.KODJO_ISSUE_NUMBER || '').trim();
  const repository = (env.KODJO_REPOSITORY || '').trim();

  if (!issue && !repository) {
    return { kind: 'SKIP', reason: 'NO_PUBLICATION_TARGET_CONFIGURED' };
  }
  if (!ISSUE_NUMBER.test(issue)) {
    return {
      kind: 'REFUSED',
      code: 'PUBLICATION_TARGET_INVALID',
      reason: 'issue_number must be a positive decimal integer; received ' + JSON.stringify(issue),
    };
  }
  if (!REPOSITORY.test(repository)) {
    return {
      kind: 'REFUSED',
      code: 'PUBLICATION_TARGET_INVALID',
      reason: 'repository must match owner/name; received ' + JSON.stringify(repository),
    };
  }

  const args = ['issue', 'comment', issue, '--repo', repository, '--body-file', bodyFile];
  return { kind: 'GH', executable: 'gh', args: args, safe_args: args.slice() };
}

function writeReceipt(deliveryDir, record) {
  const dir = receiptDir(deliveryDir);
  fs.mkdirSync(dir, { recursive: true });
  writeJson(path.join(dir, 'publication-receipt.json'), record);
  return record;
}

function main() {
  const deliveryDir = path.resolve(process.argv[2] || 'delivery');
  const republish = process.argv.includes('--republish');
  const env = process.env;

  const result = resultDir(deliveryDir);
  const manifestPath = path.join(result, 'manifest.json');
  const bodyFile = path.join(result, 'implementation-output.txt');

  const base = {
    attempted_at: new Date().toISOString(),
    republish: republish,
    ai_call_made: false,
    recovery: 'REPUBLISH_EXISTING',
    body_source: 'result/implementation-output.txt',
    shell: false,
  };

  const manifest = readJsonIfExists(manifestPath);
  if (!manifest || !fs.existsSync(bodyFile)) {
    writeReceipt(deliveryDir, { ...base, status: 'FAILED', error: 'NO_FINALIZED_OUTPUT: nothing to publish' });
    fail('PUBLICATION_INPUT_MISSING', 'result/manifest.json or result/implementation-output.txt is absent');
    return 0;
  }
  if (republish && !manifest.status_finalized) {
    writeReceipt(deliveryDir, {
      ...base,
      status: 'FAILED',
      error: 'REPUBLISH_REFUSED: the business status was never finalized',
    });
    fail('REPUBLISH_REFUSED', 'the business status was never finalized');
    return 0;
  }

  const record = {
    ...base,
    slice_id: manifest.slice_id || null,
    implementation_status: manifest.implementation_status || null,
    body_sha256: sha256File(bodyFile),
    recovery_artifact: manifest.recovery_artifact || null,
  };

  const invocation = buildInvocation(env, bodyFile);

  if (invocation.kind === 'REFUSED') {
    record.status = 'FAILED';
    record.error = invocation.code + ': ' + invocation.reason;
    record.executable = null;
    record.recovery_artifact_still_available = true;
    writeReceipt(deliveryDir, record);
    fail(
      invocation.code,
      invocation.reason + ' Nothing was executed. The recovery artifact remains accessible; only ' +
        'REPUBLISH_EXISTING is authorized, with no AI call.'
    );
    return 0;
  }

  if (invocation.kind === 'SKIP') {
    record.status = 'SKIPPED';
    record.reason = invocation.reason;
    record.executable = null;
    writeReceipt(deliveryDir, record);
    info('publication skipped: no issue number nor repository configured');
    return 0;
  }

  // Direct execution: no shell, no interpolation, no command string.
  record.executable = invocation.kind === 'GH' ? 'gh' : 'node';
  record.arguments = invocation.safe_args;
  record.adapter = invocation.adapter || null;

  const res = spawnSync(invocation.executable, invocation.args, {
    shell: false,
    cwd: path.resolve(env.KODJO_REPO_DIR || process.cwd()),
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });

  const ok = !res.error && res.status === 0;
  record.status = ok ? 'CONFIRMED' : 'FAILED';
  record.exit_code = res.error ? null : res.status;
  record.error = res.error ? redact(res.error.message) : null;
  record.output_excerpt = redact(String((res.stdout || '') + (res.stderr || ''))).slice(-2000);
  record.recovery_artifact_still_available = true;
  writeReceipt(deliveryDir, record);

  if (ok) {
    info('IMPLEMENTATION_OUTPUT published');
  } else {
    fail(
      'PUBLICATION_FAILED',
      'comment publication failed (exit ' +
        String(record.exit_code) +
        '). The recovery artifact was uploaded before the checks and remains accessible; only ' +
        'REPUBLISH_EXISTING is authorized, with no AI call.'
    );
  }
  // Always 0: publication failure must not remove or hide an artifact.
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { buildInvocation, redact, ISSUE_NUMBER, REPOSITORY };
