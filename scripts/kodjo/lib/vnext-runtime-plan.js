'use strict';

// A temporary read view, owned by the supervisor. Never stage or publish it.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const blob = value => crypto.createHash('sha1').update('blob ' + value.length + '\0').update(value).digest('hex');
function fail(code) { throw new Error('VNEXT_RUNTIME_PLAN_' + code); }
function safePath(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.includes('\0')
      || path.isAbsolute(relative) || /^[A-Za-z]:/.test(relative)
      || relative.split('/').some(p => !p || p === '.' || p === '..')) fail('PATH_INVALID');
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try { if (fs.lstatSync(current).isSymbolicLink()) fail('SYMLINK_REFUSED'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return path.join(root, relative);
}
function verify(admitted, { cwd, missionBytes }) {
  const { projection, executionRequest } = admitted || {};
  if (!projection || !executionRequest) fail('ADMISSION_REQUIRED');
  if (admitted.admission?.status !== 'AUTHORIZED'
      || admitted.admission.projection_hash !== projection.contract_hash
      || admitted.admission.execution_request_hash !== executionRequest.contract_hash
      || admitted.admission.protocol_head !== executionRequest.protocol_head) fail('ADMISSION_MISMATCH');
  const Adapter = require('./vnext-legacy-queue-adapter');
  Adapter.verifyCompatibilityFilesAtApprovedCommit(projection, executionRequest, { cwd });
  const queue = projection.legacy_queue_request;
  const plan = projection.compatibility_files.plan;
  if (plan.blob_oid !== queue.authorized_plan.plan_blob_oid
      || queue.independent_review.reviewed_plan_blob_oid !== plan.blob_oid
      || queue.authorized_plan.approved_at_commit !== executionRequest.protocol_head) fail('IDENTITY_MISMATCH');
  if (!Buffer.from(missionBytes).equals(Buffer.from(projection.compatibility_files.mission.content, 'utf8'))) fail('MISSION_MISMATCH');
  // Git objects are read again: no working-copy or HTTP fallback.
  let bytes;
  try { bytes = execFileSync('git', ['show', executionRequest.protocol_head + ':' + plan.path],
    { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 }); }
  catch (_) { fail('APPROVED_FILE_UNAVAILABLE'); }
  if (blob(bytes) !== plan.blob_oid || digest(bytes) !== plan.content_sha256) fail('IDENTITY_MISMATCH');
  if (queue.scope_allow.some(rule => require('./scope-path').inScope(plan.path, [rule]))) fail('PLAN_IN_WRITE_SCOPE');
  return { bytes, plan, executionRequest };
}
function install(admitted, { cwd, runDir, missionBytes }) {
  const root = fs.realpathSync(cwd), directory = fs.realpathSync(runDir);
  if (directory === root || directory.startsWith(root + path.sep)) fail('EXTERNAL_DIRECTORY_REQUIRED');
  const checked = verify(admitted, { cwd: root, missionBytes });
  const target = safePath(root, checked.plan.path);
  const existed = fs.existsSync(target);
  if (existed && !fs.lstatSync(target).isFile()) fail('NOT_A_REGULAR_FILE');
  const original = existed ? fs.readFileSync(target) : null;
  const mode = existed ? fs.statSync(target).mode : null;
  const journalFile = path.join(directory, 'vnext-plan-view.json');
  const identity = { schema_version: 'kodjo.vnext.runtime-plan-view.v1',
    protocol_head: checked.executionRequest.protocol_head,
    execution_request_hash: checked.executionRequest.contract_hash,
    path: checked.plan.path, blob_oid: checked.plan.blob_oid, content_sha256: checked.plan.content_sha256,
    original_blob_oid: original === null ? null : blob(original),
    original_sha256: original === null ? null : digest(original), original_existed: existed,
    original_mode: mode, snapshot: path.join(directory, 'vnext-approved-plan.md'),
    backup: path.join(directory, 'vnext-original-plan.bin'), created_directories: [], state: 'PREPARED' };
  // Same run cannot be installed twice. Recovery is explicit under the existing lock.
  const fd = fs.openSync(journalFile, 'wx', 0o600);
  fs.closeSync(fd);
  const handle = { root, journalFile, identity, target };
  try {
    fs.writeFileSync(identity.snapshot, checked.bytes, { flag: 'wx', mode: 0o400 });
    if (original !== null) fs.writeFileSync(identity.backup, original, { flag: 'wx', mode: 0o400 });
    for (let parent = path.dirname(target); parent !== root && !fs.existsSync(parent); parent = path.dirname(parent)) identity.created_directories.unshift(parent);
    fs.writeFileSync(journalFile, JSON.stringify(identity, null, 2) + '\n');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (existed) fs.chmodSync(target, mode | 0o200);
    fs.writeFileSync(target, checked.bytes);
    fs.chmodSync(target, 0o400);
    const body=checked.bytes.toString('utf8'),bundleView=path.join(directory,'vnext-contract-view');
    if(body.includes('kodjo.vnext.block-bundle.v1')){
      fs.mkdirSync(bundleView);
      identity.bundle_files=require('./vnext-plan-bundles').materialize(body,bundleView,{cwd:root,revision:checked.executionRequest.protocol_head})
        .map(file=>({path:file,sha256:digest(fs.readFileSync(file))}));
    }
    const ui=body.includes('<KODJO_VNEXT_UI_ATOMICITY_JSON>') ? require('./machine-block').parse(body,'KODJO_VNEXT_UI_ATOMICITY_JSON',{cwd:identity.bundle_files ? bundleView : root}) : null;
    if(ui?.figma_references?.length){
      const resources=path.join(directory,'vnext-figma-resources');fs.mkdirSync(resources,{recursive:true});
      const registry=require('./machine-block').parse(body,'KODJO_VNEXT_REQUIREMENT_REGISTRY_JSON',{cwd:identity.bundle_files ? bundleView : root});
      const F=require('./vnext-figma-source'),observation=F.consumeArtifacts(F.unpackUi(ui),registry,resources,'IMPLEMENTER',digest(checked.bytes));
      const observationFile=path.join(directory,'vnext-figma-observation.json');fs.writeFileSync(observationFile,JSON.stringify(observation,null,2)+'\n');
      identity.figma_observation={path:observationFile,sha256:digest(fs.readFileSync(observationFile)),resources:observation.references.flatMap(r=>r.assets)};
    }
    identity.state = 'INSTALLED';
    fs.writeFileSync(journalFile, JSON.stringify(identity, null, 2) + '\n');
    assertView(handle);
    return handle;
  } catch (error) {
    // Only restore once the complete recovery journal has been written.
    if (fs.existsSync(identity.snapshot) && (original === null || fs.existsSync(identity.backup))) {
      try { restore(handle); } catch (restoreError) {
        error.restore_error = restoreError.message;
        if (handle.identity.state !== 'RESTORED') error.runtime_plan = handle;
      }
    }
    throw error;
  }
}
function assertView(handle) {
  for(const file of handle.identity.bundle_files||[]){
    if(!fs.existsSync(file.path)||!fs.lstatSync(file.path).isFile()||fs.lstatSync(file.path).isSymbolicLink()||digest(fs.readFileSync(file.path))!==file.sha256)fail('BUNDLE_VIEW_CHANGED');
  }
  for (const file of [handle.identity.snapshot, handle.target]) {
    if (!fs.existsSync(file) || !fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()
        || digest(fs.readFileSync(file)) !== handle.identity.content_sha256) fail('VIEW_CHANGED');
  }
  const figma=handle.identity.figma_observation;
  if(figma){
    for(const f of [{path:figma.path,sha256:figma.sha256},...figma.resources])if(!fs.existsSync(f.path)||fs.lstatSync(f.path).isSymbolicLink()||digest(fs.readFileSync(f.path))!==f.sha256)fail('FIGMA_RESOURCES_CHANGED');
  }
  return true;
}
function restore(handle) {
  const i = handle.identity;
  if (i.state === 'RESTORED') return;
  let changed = false;
  if (i.state === 'INSTALLED') { try { assertView(handle); } catch (_) { changed = true; } }
  if (changed && fs.existsSync(handle.target) && fs.lstatSync(handle.target).isFile()) {
    fs.copyFileSync(handle.target, path.join(path.dirname(handle.journalFile), 'vnext-tampered-plan.bin'));
  }
  const original = i.original_existed ? fs.readFileSync(i.backup) : null;
  if (original !== null && (digest(original) !== i.original_sha256 || blob(original) !== i.original_blob_oid)) fail('BACKUP_CHANGED');
  safePath(handle.root, i.path);
  if (fs.existsSync(handle.target)) {
    if (!fs.lstatSync(handle.target).isFile()) fail('RESTORE_TARGET_INVALID');
    fs.chmodSync(handle.target, 0o600);
  }
  if (original !== null) { fs.writeFileSync(handle.target, original); fs.chmodSync(handle.target, i.original_mode); }
  else if (fs.existsSync(handle.target)) fs.unlinkSync(handle.target);
  for (const directory of [...i.created_directories].reverse()) {
    if (fs.existsSync(directory) && fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
  }
  i.state = 'RESTORED'; i.view_changed = changed;
  fs.writeFileSync(handle.journalFile, JSON.stringify(i, null, 2) + '\n');
  if (changed) fail('VIEW_CHANGED');
}
function recover(journalFile, { cwd, admitted, missionBytes }) {
  const checked = verify(admitted, { cwd, missionBytes });
  const identity = JSON.parse(fs.readFileSync(journalFile, 'utf8'));
  const root = fs.realpathSync(cwd), directory = path.dirname(path.resolve(journalFile));
  if (directory === root || directory.startsWith(root + path.sep)) fail('EXTERNAL_DIRECTORY_REQUIRED');
  if (identity.schema_version !== 'kodjo.vnext.runtime-plan-view.v1'
      || identity.execution_request_hash !== checked.executionRequest.contract_hash
      || identity.protocol_head !== checked.executionRequest.protocol_head
      || identity.path !== checked.plan.path || identity.blob_oid !== checked.plan.blob_oid
      || identity.content_sha256 !== checked.plan.content_sha256
      || !['PREPARED', 'INSTALLED', 'RESTORED'].includes(identity.state)
      || typeof identity.original_existed !== 'boolean'
      || (identity.original_existed && (!/^[a-f0-9]{40}$/.test(identity.original_blob_oid)
        || !/^[a-f0-9]{64}$/.test(identity.original_sha256) || !Number.isInteger(identity.original_mode)))
      || identity.snapshot !== path.join(directory, 'vnext-approved-plan.md')
      || identity.backup !== path.join(directory, 'vnext-original-plan.bin')) fail('JOURNAL_INVALID');
  const target = safePath(root, identity.path);
  const allowed = new Set();
  for (let parent = path.dirname(target); parent !== root; parent = path.dirname(parent)) allowed.add(parent);
  if (!Array.isArray(identity.created_directories) || identity.created_directories.some(d => !allowed.has(d))) fail('JOURNAL_INVALID');
  const handle = { identity, root, target, journalFile: path.resolve(journalFile) };
  restore(handle);
  return handle;
}
function environment(handle) {
  assertView(handle);
  return { KODJO_VNEXT_PLAN_READ_JSON: JSON.stringify({ path: handle.identity.path,
    blob_oid: handle.identity.blob_oid, original_blob_oid: handle.identity.original_blob_oid,
    content_sha256: handle.identity.content_sha256, protocol_head: handle.identity.protocol_head }),
    ...(handle.identity.figma_observation ? {KODJO_VNEXT_FIGMA_READ_JSON:JSON.stringify(handle.identity.figma_observation)} : {}) };
}
module.exports = { verify, install, assertView, restore, recover, environment };
