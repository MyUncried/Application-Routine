#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {githubApi} = require('./consume-queue-request');
const {decide, shape, need} = require('./lib/initial-restart');
const {sha256} = require('./lib/preflight-contract');
const {projectQueueRequest} = require('./lib/queue-request');
const {windowsProcessSnapshot, classifyClaudeProcesses} = require('./lib/execution-lock');
const SHA = /^[0-9a-f]{40}$/;
function safeStat(file) {
  const absolute = path.resolve(file);
  for (let p = absolute; p !== path.dirname(p); p = path.dirname(p)) {
    try { need(!fs.lstatSync(p).isSymbolicLink(), 'SYMLINK_AMBIGUOUS'); }
    catch(e) { if(e.code !== 'ENOENT') throw e; }
  }
  try { return fs.lstatSync(absolute); }
  catch(e) { if(e.code === 'ENOENT') return null; throw e; }
}
function read(file) {
  const st = safeStat(file);
  need(st && st.isFile() && st.size <= 16777216, 'FILE_UNREADABLE');
  return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
}
function sessionState(configRoot, sessionId) {
  const projects = path.join(configRoot,'projects');
  need(safeStat(projects)?.isDirectory(), 'SESSION_STORE_UNREADABLE');
  let bytes = 0, count = 0;
  const walk = dir => {
    for(const name of fs.readdirSync(dir)) {
      need(++count <= 10000, 'SESSION_SCAN_INCOMPLETE');
      const file = path.join(dir,name), st = safeStat(file);
      need(st, 'SESSION_SCAN_CHANGED');
      if(name.toLowerCase().includes(sessionId.toLowerCase())) return 'PRESENT';
      if(st.isDirectory()) { if(walk(file) === 'PRESENT') return 'PRESENT'; }
      else {
        need(st.isFile() && (bytes += st.size) <= 67108864, 'SESSION_SCAN_INCOMPLETE');
        if(fs.readFileSync(file,'utf8').toLowerCase().includes(sessionId.toLowerCase())) return 'PRESENT';
      }
    }
    return 'ABSENT';
  };
  return walk(projects);
}
function processState(snapshot = windowsProcessSnapshot()) {
  if(snapshot.state !== 'OK' || !Array.isArray(snapshot.rows) || !snapshot.rows.length) return 'AMBIGUOUS';
  const rows = snapshot.rows;
  if(classifyClaudeProcesses(rows).length || rows.some(p => /^claude(?:\.exe)?$/i.test(p.Name || ''))) return 'ACTIVE';
  if(rows.some(p => /^(node|claude)(?:\.exe)?$/i.test(p.Name || '') && !p.CommandLine)) return 'AMBIGUOUS';
  const byPid = new Map(rows.map(p => [Number(p.ProcessId),p]));
  const ancestors = new Set(); let pid = process.pid;
  while(pid && !ancestors.has(pid)) { ancestors.add(pid); pid = Number(byPid.get(pid)?.ParentProcessId || 0); }
  const workers = rows.filter(p => /^Runner\.Worker(?:\.exe)?$/i.test(p.Name || ''));
  return workers.length === 1 && ancestors.has(Number(workers[0].ProcessId)) ? 'NONE' : 'AMBIGUOUS';
}
function localSource(link, env, ownedLock) {
  need(process.platform === 'win32', 'WINDOWS_REQUIRED');
  const stateRoot = path.resolve(env.KODJO_STATE_ROOT || path.join(os.homedir(),'.kodjo-v2'));
  const runDir = path.join(stateRoot,'runs',`github-${link.source_run_id}-${link.source_run_attempt}`);
  const invocation = read(path.join(runDir,'invocation.json'));
  const configRoot = path.resolve(env.CLAUDE_CONFIG_DIR || path.join(os.homedir(),'.claude'));
  need(invocation.execution_environment?.runner_name === env.RUNNER_NAME &&
    invocation.execution_environment?.user_home === os.homedir() &&
    invocation.execution_environment?.state_root === stateRoot &&
    invocation.execution_environment?.claude_config_root === configRoot, 'SOURCE_STORAGE_IDENTITY_UNKNOWN');
  need(typeof invocation.session_id === 'string' && /^[0-9a-f-]{36}$/i.test(invocation.session_id), 'SESSION_IDENTITY_UNKNOWN');
  const resultFile = path.join(runDir,'result.json');
  const result = safeStat(resultFile) ? read(resultFile) : null;
  let recovery = 'ABSENT';
  // Existing recovery, even incomplete, cannot establish irrecoverability.
  for(const name of fs.readdirSync(runDir)) if(/^recovery(?:[.-]|$)/i.test(name)) recovery = 'PRESENT';
  // Other retained runs may contain a copy of the same session's delta/result.
  for(const name of fs.readdirSync(path.join(stateRoot,'runs'))) {
    const dir = path.join(stateRoot,'runs',name);
    need(safeStat(dir)?.isDirectory(), 'RECOVERY_SCAN_AMBIGUOUS');
    if(dir === runDir) continue;
    for(const leaf of ['result.json','recovery.json','recovery-package/manifest.json']) {
      const file = path.join(dir,leaf);
      if(safeStat(file)) {
        const record = read(file);
        if(record.request_id === link.source_request_id || record.session_id === invocation.session_id) recovery = 'PRESENT';
      }
    }
  }
  const lockFile = path.join(stateRoot,'claude-local.lock');
  let lock = 'ABSENT';
  if(safeStat(lockFile)) {
    const record = read(lockFile);
    if(!ownedLock || record.token !== ownedLock.record.token || record.owner_pid !== process.pid) lock = 'PRESENT';
  }
  return {invocation,result,recovery,session:sessionState(configRoot,invocation.session_id),processes:processState(),lock};
}
function verify(queueFile, options = {}) {
  const env = options.env || process.env, cwd = options.cwd || process.cwd();
  const queue = read(queueFile);
  if(!Object.hasOwn(queue,'initial_restart')) return {status:'NOT_APPLICABLE'};
  need(!shape(queue.initial_restart,queue), 'CAUSALITY_INVALID');
  need(env.GITHUB_ACTIONS === 'true' && env.KODJO_VERIFY_GITHUB === '1' && env.GITHUB_RUN_ATTEMPT === '1', 'SUPERVISED_CONTEXT_REQUIRED');
  need(/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY || '') && SHA.test(env.KODJO_EVENT_AFTER || ''), 'REPOSITORY_CONTEXT_REQUIRED');
  need(typeof env.RUNNER_NAME === 'string' && env.RUNNER_NAME.length > 0, 'RUNNER_IDENTITY_REQUIRED');
  const api = options.api || ((method,route) => githubApi(method,route,undefined,env));
  const get = route => { const r = api('GET',route); need(r.status === 200, 'GITHUB_EVIDENCE_UNAVAILABLE'); return r.data; };
  const base = 'repos/'+env.GITHUB_REPOSITORY;
  const link = queue.initial_restart;
  const tagName = 'kodjo-consumed/'+link.source_request_id.toLowerCase();
  const ref = get(base+'/git/ref/tags/'+tagName);
  need(ref.ref === 'refs/tags/'+tagName && ref.object?.type === 'tag' && SHA.test(ref.object.sha), 'RECEIPT_REF_INVALID');
  const tag = get(base+'/git/tags/'+ref.object.sha);
  const receipt = JSON.parse(tag.message);
  need(tag.object?.type === 'commit' && tag.object.sha === receipt.queue_commit && SHA.test(receipt.queue_commit) &&
    SHA.test(receipt.queue_blob_oid) && receipt.repository === env.GITHUB_REPOSITORY, 'RECEIPT_OBJECT_INVALID');
  need(typeof receipt.queue_path === 'string' && /^\.github\/orchestration\/queue\/v2\/[A-Za-z0-9._-]+\.json$/.test(receipt.queue_path), 'SOURCE_PATH_INVALID');
  const bound = get(base+'/contents/'+receipt.queue_path+'?ref='+receipt.queue_commit);
  need(bound.type === 'file' && bound.sha === receipt.queue_blob_oid, 'SOURCE_COMMIT_BINDING_INVALID');
  const blob = get(base+'/git/blobs/'+receipt.queue_blob_oid);
  need(blob.encoding === 'base64' && blob.sha === receipt.queue_blob_oid, 'SOURCE_BLOB_INVALID');
  const raw = Buffer.from(blob.content,'base64');
  need(crypto.createHash('sha1').update(Buffer.from(`blob ${raw.length}\0`)).update(raw).digest('hex') === receipt.queue_blob_oid, 'SOURCE_BLOB_INVALID');
  const sourceQueue = JSON.parse(raw.toString('utf8'));
  const run = get(base+'/actions/runs/'+link.source_run_id);
  need(run.status === 'completed' && ['failure','cancelled','timed_out'].includes(run.conclusion) &&
    run.run_attempt === link.source_run_attempt && run.head_sha === receipt.queue_commit, 'SOURCE_RUN_AMBIGUOUS');
  const jobs = get(base+'/actions/runs/'+link.source_run_id+'/jobs?filter=all&per_page=100');
  need(Array.isArray(jobs.jobs) && jobs.total_count === jobs.jobs.length && jobs.jobs.length > 0 &&
    jobs.jobs.every(j => j.status === 'completed' && j.conclusion && j.runner_name === env.RUNNER_NAME), 'SOURCE_RUNNER_AMBIGUOUS');
  const artifacts = get(base+'/actions/runs/'+link.source_run_id+'/artifacts?per_page=100');
  need(artifacts.total_count === 0 && Array.isArray(artifacts.artifacts) && artifacts.artifacts.length === 0, 'ARCHIVE_REQUIRES_INSPECTION');
  const authorizations = options.authorize || (() => require('./verify-authorizations').verify(queueFile,{cwd,github:{
    comment:(repo,id) => get('repos/'+repo+'/issues/comments/'+id),
    reactions:(repo,id) => get('repos/'+repo+'/issues/comments/'+id+'/reactions'),
  }}));
  const preflight = read(options.preflightFile || env.KODJO_PREFLIGHT_FILE);
  require('./lib/preflight-contract').verify(preflight,{request_id:queue.request_id,protocol_head:queue.source_head,execution_head:queue.source_head});
  need(preflight.status === 'PASS' && preflight.projection_sha256 === sha256(projectQueueRequest(queue)), 'PREFLIGHT_MISMATCH');
  const collect = options.collect || (() => localSource(link,env,options.ownedLock));
  let previous;
  for(let sample = 0; sample < 2; sample++) {
    authorizations();
    need(get(base+'/git/ref/heads/main').object?.sha === env.KODJO_EVENT_AFTER, 'HEAD_MOVED');
    need(sha256(get(base+'/actions/runs/'+link.source_run_id)) === sha256(run), 'SOURCE_RUN_CHANGED');
    need(sha256(get(base+'/actions/runs/'+link.source_run_id+'/jobs?filter=all&per_page=100')) === sha256(jobs), 'SOURCE_JOBS_CHANGED');
    need(sha256(get(base+'/actions/runs/'+link.source_run_id+'/artifacts?per_page=100')) === sha256(artifacts), 'SOURCE_ARCHIVE_CHANGED');
    need(sha256(get(base+'/git/ref/tags/'+tagName)) === sha256(ref), 'SOURCE_RECEIPT_CHANGED');
    const current = collect();
    const evidence = {receipt,sourceQueue,...current,authorizations:'PASS',heads:'PASS'};
    const verdict = decide(queue,evidence);
    if(previous) need(sha256(current) === previous, 'SOURCE_CHANGED');
    previous = sha256(current);
    if(sample === 1) return {...verdict,source_receipt_oid:ref.object.sha,evidence_sha256:sha256(evidence)};
  }
}
if(require.main === module) {
  try { console.log(JSON.stringify(verify(process.argv[2],{preflightFile:process.argv[3]}))); }
  catch(e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = {verify,localSource,sessionState,processState,read};
