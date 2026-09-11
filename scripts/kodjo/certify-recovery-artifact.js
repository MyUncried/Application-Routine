#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { restoreFromPackage, changedFiles } = require('./run-local-claude');

function run(bin, args, cwd) {
  const result = spawnSync(bin, args, { cwd, encoding: 'utf8', shell: false, windowsHide: true,
    maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    throw new Error('CERTIFICATION_COMMAND_FAILED: ' + bin + ' ' + args.join(' ') + ': ' +
      (result.error ? result.error.message : result.stderr));
  }
  return String(result.stdout || '').trim();
}

function certify(packageDir, sourceRepo, targetHead) {
  const manifestPath = path.join(packageDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error('CERTIFICATION_MANIFEST_MISSING');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-real-recovery-cert-'));
  const clone = path.join(root, 'control');
  try {
    run('git', ['clone', '--quiet', '--no-hardlinks', '--no-checkout', sourceRepo, clone], sourceRepo);
    run('git', ['checkout', '--quiet', '--detach', targetHead], clone);
    const migration = {};
    const request = {
      slice_id: manifest.slice_id,
      session_id: manifest.session_id,
      baseline_head: manifest.baseline_head,
      source_head: targetHead,
      scope_allow: manifest.scope_allow,
    };
    const restored = restoreFromPackage(packageDir, clone, request, migration).slice().sort();
    const observed = changedFiles(clone).slice().sort();
    if (JSON.stringify(restored) !== JSON.stringify(observed)) {
      throw new Error('CERTIFICATION_RESTORED_DELTA_MISMATCH: expected=' + restored.join(',') +
        ' observed=' + observed.join(','));
    }
    return {
      schema_version: 'kodjo.protocol.v2.real-recovery-certification.0.6.20',
      status: 'PASS',
      source_artifact_run_id: manifest.github_run_id || manifest.run_id || null,
      source_request_id: manifest.request_id || null,
      source_head: manifest.source_head,
      target_head: targetHead,
      restored_paths: observed,
      migration,
      claude_invoked: false,
      certified_at: new Date().toISOString(),
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function main() {
  const [packageDir, sourceRepo, targetHead, output] = process.argv.slice(2);
  if (!packageDir || !sourceRepo || !targetHead || !output) {
    throw new Error('USAGE: certify-recovery-artifact.js <packageDir> <sourceRepo> <targetHead> <output>');
  }
  let evidence;
  try {
    evidence = certify(path.resolve(packageDir), path.resolve(sourceRepo), targetHead);
  } catch (error) {
    evidence = {
      schema_version: 'kodjo.protocol.v2.real-recovery-certification.0.6.20',
      status: 'FAIL', target_head: targetHead, claude_invoked: false,
      diagnostic: error.message, certified_at: new Date().toISOString(),
    };
    fs.writeFileSync(path.resolve(output), JSON.stringify(evidence, null, 2) + '\n', 'utf8');
    throw error;
  }
  fs.writeFileSync(path.resolve(output), JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  process.stdout.write('REAL_RECOVERY_CERTIFICATION=' + evidence.status + '\n');
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(error.stack + '\n'); process.exit(1); }
}

module.exports = { certify };
