'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const V = require('./vnext-contract');
const WORKFLOW = '.github/workflows/kodjo-vnext12-disposable.yml';
function blob(cwd, head, file) {
  V.assertSha40(head, 'VNEXT_EXECUTED_REVISION_REQUIRED');
  const bytes = execFileSync('git', ['show', head + ':' + file], { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 });
  return { path: file, revision: head, sha256: V.sha256(bytes) };
}
function observe({ controllerCwd, approvedCwd, controllerHead, approvedHead, env = process.env,
  controllerScript = 'scripts/kodjo/execute-vnext12.js', runtimeScript = 'scripts/kodjo/run-local-claude.js', workflowPath = WORKFLOW }) {
  if (![WORKFLOW, '.github/workflows/kodjo-vnext-closure.yml'].includes(workflowPath)) V.fail('VNEXT_EXECUTED_WORKFLOW_PATH_REFUSED');
  const workflowHead = env.GITHUB_WORKFLOW_SHA;
  V.assertSha40(workflowHead, 'VNEXT_EXECUTED_WORKFLOW_VERSION_REQUIRED');
  let workflow;
  try { workflow = blob(controllerCwd, workflowHead, workflowPath); }
  catch (error) {
    // A pull_request workflow can live at GitHub's merge ref, outside the head
    // checkout ancestry. Read that exact object with the existing read token;
    // checkout deliberately does not persist Git credentials on this runner.
    if(env.GITHUB_REPOSITORY!=='MyUncried/Application-Routine') V.fail('VNEXT_EXECUTED_WORKFLOW_REPOSITORY_INVALID');
    const file=require('./vnext-github-qualification').readGithub('repos/'+env.GITHUB_REPOSITORY+'/contents/'+workflowPath+'?ref='+workflowHead);
    if(file.encoding!=='base64'||typeof file.content!=='string') V.fail('VNEXT_EXECUTED_WORKFLOW_UNAVAILABLE');
    workflow={path:workflowPath,revision:workflowHead,sha256:V.sha256(Buffer.from(file.content,'base64'))};
  }
  const expected = blob(controllerCwd, controllerHead, workflowPath);
  // GitHub reruns retain the workflow at the original event. A newer checkout
  // of a controller script does not change those executable workflow bytes.
  if (workflow.sha256 !== expected.sha256) V.fail('VNEXT_EXECUTED_WORKFLOW_STALE_NEW_EVENT_REQUIRED');
  const observed = (cwd, head, file) => {
    const row = blob(cwd, head, file);
    if (row.sha256 !== V.sha256(fs.readFileSync(path.join(cwd, file)))) V.fail('VNEXT_EXECUTED_SOURCE_DRIFT');
    return row;
  };
  return V.sealContract({ schema_version: 'kodjo.vnext.execution-provenance.v1',
    run_id: String(env.GITHUB_RUN_ID), run_attempt: String(env.GITHUB_RUN_ATTEMPT),
    workflow_ref: env.GITHUB_WORKFLOW_REF, workflow,
    controller_loading: 'IMMUTABLE_EVENT_HEAD',
    controller: observed(controllerCwd, controllerHead, controllerScript),
    runtime: observed(approvedCwd, approvedHead, runtimeScript),
    contracts: ['scripts/kodjo/lib/vnext-contract.js', 'scripts/kodjo/lib/vnext-legacy-queue-adapter.js'].map(file => observed(approvedCwd, approvedHead, file)) });
}
function recovery(previous, expected) {
  V.verifyContractHash(previous, 'VNEXT_EXECUTION_PROVENANCE_HASH_INVALID');
  const immutableChanged = ['runtime', 'contracts'].some(key => V.canonicalStringify(previous[key]) !== V.canonicalStringify(expected[key]));
  if (immutableChanged) return { action: 'REBUILD_APPROVED_HANDOFF', reuse_human_decision: false, reason: 'Approved runtime or contracts changed.' };
  if (previous.workflow.sha256 !== expected.workflow.sha256) return { action: 'NEW_EVENT_SAME_DELIVERY', reuse_human_decision: true, reason: 'Rerun cannot load corrected workflow; retain exact decision and reserves.' };
  if(previous.controller.sha256!==expected.controller.sha256)return {action:'NEW_EVENT_SAME_DELIVERY',reuse_human_decision:true,
    reason:'VNext controller is pinned to the original event head; a rerun does not load a later script fix.'};
  return { action: 'RESUME_EXISTING_OPERATION', reuse_human_decision: true,
    reason: 'Versions unchanged; check consumption before executing.' };
}
module.exports = { WORKFLOW, blob, observe, recovery };
