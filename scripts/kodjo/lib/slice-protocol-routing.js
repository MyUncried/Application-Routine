'use strict';
const { spawnSync } = require('node:child_process');
const Cutover = require('./vnext-cutover-contract');
const V = require('./vnext-contract');
const DIRECTORY = '.github/orchestration/vnext-cutover';
function git(cwd, args, optional = false) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) {
    if (optional) return null;
    throw Error('SLICE_PROTOCOL_GIT_READ_FAILED');
  }
  return result.stdout;
}
function resolve(sliceId, { cwd = process.cwd() } = {}) {
  V.assertSliceId(sliceId);
  const head = git(cwd, ['rev-parse', 'HEAD']).trim();
  const read = name => git(cwd, ['show', head + ':' + DIRECTORY + '/' + name], true);
  const rawPlan = read('cutover-plan.json'), rawActivation = read('activation.json');
  if (rawPlan === null && rawActivation === null) return Cutover.LEGACY;
  if (!rawPlan || !rawActivation) throw Error('SLICE_PROTOCOL_ACTIVATION_INCOMPLETE');
  const cutoverPlan = JSON.parse(rawPlan), activationRecord = JSON.parse(rawActivation);
  const frozen = read('legacy-registry-at-activation.json');
  if (!frozen) throw Error('SLICE_PROTOCOL_LEGACY_SNAPSHOT_REQUIRED');
  const legacyActivationRegistry = JSON.parse(frozen);
  Cutover.validateCutoverPlan(cutoverPlan, legacyActivationRegistry);
  Cutover.validateActivationRecord(activationRecord, cutoverPlan);
  if (git(cwd, ['merge-base', '--is-ancestor', activationRecord.activated_at_protocol_head, head], true) === null) {
    throw Error('SLICE_PROTOCOL_ACTIVATION_HEAD_UNRELATED');
  }
  const rawRollback = read('rollback.json');
  return Cutover.routeSlice({ sliceId, legacyActivationRegistry, cutoverPlan, activationRecord,
    rollbackRecord: rawRollback ? JSON.parse(rawRollback) : null });
}
function assertLegacy(sliceId, options) {
  if (resolve(sliceId, options) !== Cutover.LEGACY) throw Error('VNEXT_SLICE_USE_VNEXT_ENTRYPOINT');
}
module.exports = { DIRECTORY, resolve, assertLegacy };
