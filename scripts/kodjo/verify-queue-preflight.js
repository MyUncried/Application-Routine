#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { validateQueueRequest } = require('./lib/queue-contract');
const { projectQueueRequest } = require('./lib/queue-request');
const { normalizeRequest, buildPrompt, CLAUDE_CODE_VERSION, resolveClaudeBinary } = require('./lib/claude-local');
const { verify: verifyAuthorizations } = require('./verify-authorizations');
const { verify: verifyVisualCheckpoint } = require('./verify-visual-checkpoint');
const { queueChanges, consumedRegistry, blobOid, QUEUE_DIR } = require('./verify-queue-admission');
const { readRecoveryCandidate } = require('./run-local-claude');
const { verifyMaterializedRecoveryPackage } = require('./prepare-visual-recovery');
const { extractTaggedJson } = require('./lib/plan-impact');
const P = require('./lib/preflight-contract');
const Source = require('./lib/preflight-source');

const SHA40 = /^[0-9a-f]{40}$/;

function executionHeadOf(queue) {
  return queue && queue.delivery_target && queue.delivery_target.application_head
    ? String(queue.delivery_target.application_head)
    : String(queue && queue.source_head || '');
}

function command(bin, args, cwd, env = process.env, timeout = 60000) {
  const result = spawnSync(bin, args, {
    cwd, env, encoding:'utf8', windowsHide:true, shell:false, timeout,
    maxBuffer:64*1024*1024,
  });
  return {
    ok: !result.error && result.status === 0,
    status: result.status,
    stdout: String(result.stdout || ''),
    stderr: String(result.stderr || ''),
    error: result.error || null,
  };
}
function git(args, cwd) {
  const r = command('git', args, cwd);
  if (!r.ok) throw new Error('GIT_READ_FAILED: ' + args.join(' ') + ': ' + (r.error ? r.error.message : r.stderr.trim()));
  return r.stdout.trim();
}
function readJson(file) {
  return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
}
function safeEvidence(value) {
  if (value === undefined) return null;
  if (typeof value === 'string') return value.slice(0, 4096);
  return value;
}
function runPreflight(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const queuePath = String(options.queuePath || '');
  const before = String(options.before || '');
  const after = String(options.after || '');
  const outputFile = options.outputFile ? path.resolve(options.outputFile) : null;
  const probes = options.probes || {};
  const runAttempt = Number(options.runAttempt || process.env.GITHUB_RUN_ATTEMPT || 1);

  const checks = [];
  const byId = new Map();
  function add(id, source, fn, deps = []) {
    const blocking = deps.find((dep) => {
      const row = byId.get(dep);
      return row && (row.status === 'FAIL' || row.status === 'BLOCKED');
    });
    if (blocking) {
      const row = { id, status:'BLOCKED', source, diagnostic:'DEPENDENCY_BLOCKED:' + blocking, evidence:null };
      checks.push(row); byId.set(id,row); return row;
    }
    try {
      const evidence = fn();
      const row = { id, status:'PASS', source, diagnostic:null, evidence:safeEvidence(evidence) };
      checks.push(row); byId.set(id,row); return row;
    } catch (error) {
      const row = { id, status:'FAIL', source, diagnostic:String(error && error.message ? error.message : error), evidence:null };
      checks.push(row); byId.set(id,row); return row;
    }
  }
  function na(id, source, evidence) {
    const row = { id, status:'NOT_APPLICABLE', source, diagnostic:null, evidence:safeEvidence(evidence) };
    checks.push(row); byId.set(id,row); return row;
  }

  let queue = null;
  let queueAbsolute = null;
  let queueBlob = null;
  let projected = null;
  let normalized = null;
  let promptText = null;
  let promptBytes = null;
  let promptHash = null;
  let promptFileHash = null;
  let planBody = null;

  add('PF-001','verify-queue-admission.js',()=>{
    if (!SHA40.test(before) || !SHA40.test(after)) throw new Error('PREFLIGHT_EVENT_BOUNDARY_INVALID');
    return {before,after};
  });

  add('PF-002','verify-queue-admission.js',()=>{
    if (!queuePath || !queuePath.startsWith(QUEUE_DIR + '/') || !queuePath.endsWith('.json')) throw new Error('PREFLIGHT_QUEUE_PATH_INVALID');
    const changes = queueChanges(before, after, cwd);
    const mutations = changes.filter((e)=>e.status !== 'A');
    if (mutations.length) throw new Error('PREFLIGHT_QUEUE_MUTATION_REFUSED:' + mutations.map((e)=>e.status+':'+e.path).join(','));
    const added = changes.filter((e)=>e.status === 'A');
    if (added.length !== 1 || added[0].path !== queuePath) throw new Error('PREFLIGHT_QUEUE_SELECTION_MISMATCH');
    queueAbsolute = path.resolve(cwd, queuePath);
    queue = readJson(queueAbsolute);
    queueBlob = blobOid(queuePath, cwd);
    return {queue_path:queuePath,queue_blob_oid:queueBlob};
  },['PF-001']);

  add('PF-003','verify-queue-admission.js',()=>{
    if (runAttempt > 1) throw new Error('KODJO_QUEUE_RERUN_REFUSED');
    const requestId = String(queue.request_id || '');
    const registry = consumedRegistry(cwd);
    const consumed = registry.entries.find((entry)=>entry && (entry.path === queuePath || entry.blob_oid === queueBlob));
    if (consumed) throw new Error('KODJO_QUEUE_CONSUMED_REFUSED');
    const root = path.resolve(cwd, QUEUE_DIR);
    const duplicates = fs.readdirSync(root).filter((name)=>name.endsWith('.json')).map((name)=>path.join(QUEUE_DIR,name).replace(/\\/g,'/')).filter((candidate)=>{
      try { return String(readJson(path.resolve(cwd,candidate)).request_id || '') === requestId; } catch (_) { return false; }
    });
    if (duplicates.length !== 1) throw new Error('KODJO_QUEUE_REQUEST_ID_DUPLICATE:' + duplicates.join(','));
    return {request_id:requestId};
  },['PF-002']);

  add('PF-004','lib/queue-contract.js',()=>{
    const violations = validateQueueRequest(queue);
    if (violations.length) throw new Error('KODJO_QUEUE_CONTRACT_REFUSED:' + violations.map((v)=>v.diagnostic+'('+v.property+')').join('|'));
    return {schema_version:queue.schema_version,mode:queue.mode,operation_kind:queue.operation_kind || 'IMPLEMENT'};
  },['PF-002']);

  add('PF-005','lib/scope-path.js',()=>{
    const scopes = Array.isArray(queue.scope_allow) ? queue.scope_allow : [];
    if (!scopes.length) throw new Error('PREFLIGHT_SCOPE_EMPTY');
    return {scope_count:scopes.length,scope_sha256:P.sha256(scopes.slice().sort())};
  },['PF-004']);

  add('PF-006','verify-authorizations.js',()=>{
    const result = probes.verifyAuthorizations
      ? probes.verifyAuthorizations(queuePath,{cwd})
      : verifyAuthorizations(queuePath,{cwd});
    return result;
  },['PF-004']);

  if (queue && queue.recovery_migration !== undefined) {
    add('PF-007','lib/recovery-migration.js',()=>{
      const auth = byId.get('PF-006');
      if (!auth || auth.status !== 'PASS') throw new Error('RECOVERY_AUTHORIZATION_NOT_PROVEN');
      return {attestation_blob_oid:String(queue.recovery_migration.attestation_blob_oid || '')};
    },['PF-006']);
  } else {
    na('PF-007','lib/recovery-migration.js','recovery_migration absent');
  }

  if (queue && String(queue.operation_kind || 'IMPLEMENT').toUpperCase() === 'VISUAL_CORRECTION') {
    add('PF-008','verify-visual-checkpoint.js',()=>{
      return probes.verifyVisualCheckpoint
        ? probes.verifyVisualCheckpoint(queuePath,{cwd})
        : verifyVisualCheckpoint(queuePath,{cwd});
    },['PF-004','PF-006']);
  } else {
    na('PF-008','verify-visual-checkpoint.js','operation != VISUAL_CORRECTION');
  }

  if (queue && String(queue.operation_kind || 'IMPLEMENT').toUpperCase() === 'IMPLEMENT') {
    add('PF-010','verify-plan-contract-consistency.js',()=>{
      if (probes.planContract) return probes.planContract(queue,cwd);
      const planBlob = String(queue.authorized_plan && queue.authorized_plan.plan_blob_oid || '');
      if (!SHA40.test(planBlob)) throw new Error('PREFLIGHT_PLAN_BLOB_INVALID');
      planBody = git(['cat-file','blob',planBlob],cwd);
      const impact = extractTaggedJson(planBody,'KODJO_PLAN_IMPACT_JSON');
      const revision = String(impact.scan_revision || '');
      if (!SHA40.test(revision)) throw new Error('PREFLIGHT_PLAN_SCAN_REVISION_INVALID');
      const dir = fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-preflight-plan-'));
      try {
        const planFile = path.join(dir,'technical-plan.md');
        const outFile = path.join(dir,'plan-contract.json');
        fs.writeFileSync(planFile,planBody,'utf8');
        const r = command(process.execPath,[path.join(cwd,'scripts','kodjo','verify-plan-contract-consistency.js'),planFile,revision,cwd,outFile,'consume',String(queue.source_head)],cwd);
        if (!r.ok) throw new Error((r.stderr || r.stdout).trim() || 'PLAN_CONTRACT_CONSUME_FAILED');
        return readJson(outFile);
      } finally {
        fs.rmSync(dir,{recursive:true,force:true});
      }
    },['PF-006']);

    add('PF-009','verify-implementation-mission.js',()=>{
      if (probes.implementationMission) return probes.implementationMission(queue,cwd);
      if (!planBody) {
        const planBlob = String(queue.authorized_plan.plan_blob_oid);
        planBody = git(['cat-file','blob',planBlob],cwd);
      }
      const mission = path.resolve(cwd,String(queue.prompt_file || ''));
      if (!fs.existsSync(mission)) throw new Error('IMPLEMENTATION_MISSION_MISSING');
      const dir = fs.mkdtempSync(path.join(os.tmpdir(),'kodjo-preflight-mission-'));
      try {
        const planFile = path.join(dir,'technical-plan.md');
        fs.writeFileSync(planFile,planBody,'utf8');
        const r = command(process.execPath,[path.join(cwd,'scripts','kodjo','verify-implementation-mission.js'),mission,planFile,String(queue.authorized_plan.plan_blob_oid)],cwd);
        if (!r.ok) throw new Error((r.stderr || r.stdout).trim() || 'IMPLEMENTATION_MISSION_REFUSED');
        return {mission:String(queue.prompt_file),plan_blob_oid:String(queue.authorized_plan.plan_blob_oid)};
      } finally {
        fs.rmSync(dir,{recursive:true,force:true});
      }
    },['PF-010']);
  } else {
    na('PF-009','verify-implementation-mission.js','VISUAL_CORRECTION delta review path');
    na('PF-010','verify-plan-contract-consistency.js','VISUAL_CORRECTION keeps historical plan reference');
  }

  add('PF-011','project-queued-request.js',()=>{
    projected = probes.projectQueueRequest ? probes.projectQueueRequest(queue,cwd) : projectQueueRequest(queue);
    return {projection_sha256:P.sha256(projected),schema_version:projected.schema_version};
  },['PF-004']);

  add('PF-012','lib/claude-local.js::normalizeRequest',()=>{
    normalized = probes.normalizeRequest ? probes.normalizeRequest(projected,cwd) : normalizeRequest(projected,cwd);
    return {source_head:normalized.source_head,protocol_source_head:normalized.protocol_source_head,scope_count:normalized.scope_allow.length};
  },['PF-011']);

  add('PF-013','lib/claude-local.js::buildPrompt',()=>{
    if (probes.prompt) {
      const value = probes.prompt(normalized,cwd);
      promptText = String(value.text || '');
      promptBytes = Number(value.bytes);
      promptHash = String(value.sha256 || P.sha256(promptText));
      if (!Number.isInteger(promptBytes)) promptBytes = Buffer.byteLength(promptText,'utf8');
    } else {
      const promptHead = String(queue.source_head || '');
      const taskBuffer = Source.readFileAtHead(String(queue.prompt_file || ''), promptHead, cwd);
      const taskText = taskBuffer.toString('utf8');
      const configDir = options.configDir || path.join(cwd,'.kodjo-preflight-config');
      promptText = buildPrompt(normalized,taskText,configDir);
      promptBytes = Buffer.byteLength(promptText,'utf8');
      promptHash = P.sha256(promptText);
      promptFileHash = P.sha256(taskBuffer);
    }
    if (!promptFileHash && fs.existsSync(normalized.prompt_file)) promptFileHash = P.sha256(fs.readFileSync(normalized.prompt_file));
    if (promptBytes > normalized.limits.max_prompt_bytes || promptBytes > normalized.limits.max_total_prompt_bytes) {
      throw new Error('PROMPT_BUDGET_EXCEEDED:' + promptBytes);
    }
    return {prompt_sha256:promptHash,prompt_bytes:promptBytes};
  },['PF-012']);

  add('PF-014','run-queued-request.ps1 source HEAD guards',()=>{
    if (probes.sourceHead) return probes.sourceHead(queue,{cwd,after});
    const source = String(queue.source_head || '');
    git(['cat-file','-e',source+'^{commit}'],cwd);
    const ancestor = command('git',['merge-base','--is-ancestor',source,after],cwd);
    if (!ancestor.ok) throw new Error('KODJO_QUEUE_SOURCE_NOT_ANCESTOR');
    return {source_head:source};
  },['PF-004']);

  if (queue && queue.delivery_target) {
    add('PF-015','run-queued-request.ps1 PR/ref guards',()=>{
      if (probes.applicationTarget) return probes.applicationTarget(queue);
      const repo = process.env.GITHUB_REPOSITORY;
      if (!repo) throw new Error('KODJO_QUEUE_REPOSITORY_MISSING');
      const target = queue.delivery_target;
      const pr = command('gh',['api','repos/'+repo+'/pulls/'+target.application_pr],cwd);
      if (!pr.ok) throw new Error('KODJO_QUEUE_APPLICATION_PR_UNREADABLE');
      const value = JSON.parse(pr.stdout);
      if (value.state !== 'open' || value.base.ref !== 'main' || value.head.ref !== target.branch || String(value.head.sha).toLowerCase() !== String(target.application_head).toLowerCase()) {
        throw new Error('KODJO_QUEUE_APPLICATION_TARGET_DRIFT');
      }
      return {application_pr:target.application_pr,branch:target.branch,application_head:target.application_head};
    },['PF-008']);
  } else {
    na('PF-015','run-queued-request.ps1 PR/ref guards','no existing PR delivery target');
  }

  add('PF-016','run-local-claude.js recovery read-only inspection',()=>{
    if (probes.recovery) return probes.recovery(queue,normalized,cwd);
    if (!queue || String(queue.mode || '').toUpperCase() !== 'RESUME_DELTA') return {status:'NOT_REQUIRED'};
    if (String(queue.operation_kind || '').toUpperCase() === 'VISUAL_CORRECTION') return {status:'CHECKPOINT_BASELINE',checkpoint_ref:queue.delivery_checkpoint && queue.delivery_checkpoint.checkpoint_ref};
    if (queue.materialized_recovery !== undefined) {
      const packageDir = String(process.env.KODJO_SOURCE_RECOVERY_DIR || '').trim();
      return verifyMaterializedRecoveryPackage(projected, { packageDir, cwd });
    }
    const stateRoot = process.env.KODJO_STATE_ROOT ? path.resolve(process.env.KODJO_STATE_ROOT) : path.join(os.homedir(),'.kodjo-v2');
    const runsRoot = path.join(stateRoot,'runs');
    if (fs.existsSync(runsRoot)) {
      const candidates = fs.readdirSync(runsRoot,{withFileTypes:true}).filter((e)=>e.isDirectory()).map((e)=>path.join(runsRoot,e.name,'recovery.json')).filter((f)=>fs.existsSync(f));
      for (const file of candidates) {
        const candidate = readRecoveryCandidate(file);
        if (candidate && candidate.integrity_status !== 'MUTATED' &&
            String(candidate.slice_id) === String(normalized.slice_id) &&
            String(candidate.session_id) === String(normalized.session_id) &&
            String(candidate.baseline_head) === String(normalized.baseline_head) &&
            String(candidate.source_head) === String(normalized.source_head)) {
          return {status:'LOCAL_RECOVERY_FOUND',file:path.relative(stateRoot,file).replace(/\\/g,'/')};
        }
      }
    }
    const packageDir = String(process.env.KODJO_SOURCE_RECOVERY_DIR || '').trim();
    if (packageDir && fs.existsSync(path.join(packageDir,'manifest.json'))) {
      JSON.parse(fs.readFileSync(path.join(packageDir,'manifest.json'),'utf8').replace(/^\uFEFF/,''));
      return {status:'SOURCE_PACKAGE_FOUND'};
    }
    if (normalized.allow_legacy_recovery_bootstrap) return {status:'LEGACY_BOOTSTRAP_ALLOWED'};
    throw new Error('RECOVERY_NOT_FOUND');
  },['PF-012']);

  add('PF-017','runner toolchain git',()=>{
    const r = probes.gitVersion ? probes.gitVersion() : command('git',['--version'],cwd);
    if (r.ok === false) throw new Error('GIT_NOT_AVAILABLE');
    return typeof r === 'string' ? r : r.stdout.trim();
  });

  add('PF-018','runner toolchain node/npm',()=>{
    if (probes.nodeNpm) return probes.nodeNpm();
    const node = command(process.execPath,['--version'],cwd);
    const npm = process.platform === 'win32'
      ? command(process.env.ComSpec || 'cmd.exe',['/d','/s','/c','npm.cmd','--version'],cwd)
      : command('npm',['--version'],cwd);
    if (!node.ok || !npm.ok) throw new Error('NODE_NPM_NOT_AVAILABLE');
    return {node:node.stdout.trim(),npm:npm.stdout.trim()};
  });

  add('PF-019','run-local-claude.js Claude version',()=>{
    if (probes.claudeVersion) {
      const version = probes.claudeVersion();
      if (version !== CLAUDE_CODE_VERSION) throw new Error('CLAUDE_VERSION_REFUSED:' + version);
      return version;
    }
    const r = command(resolveClaudeBinary(process.env, process.platform),['--version'],cwd);
    if (!r.ok) throw new Error('CLAUDE_NOT_AVAILABLE');
    const text = (r.stdout || r.stderr).trim();
    if (!new RegExp('(^|\\s)'+CLAUDE_CODE_VERSION.replace(/\./g,'\\.')+'(\\s|$)').test(text)) throw new Error('CLAUDE_VERSION_REFUSED:' + text);
    return text;
  });

  add('PF-020','run-local-claude.js Claude auth',()=>{
    if (probes.claudeAuth) return probes.claudeAuth();
    if (process.env.CLAUDE_CODE_OAUTH_TOKEN) return 'TOKEN_PRESENT';
    const r = command(resolveClaudeBinary(process.env, process.platform),['auth','status'],cwd);
    if (!r.ok) throw new Error('KODJO-V2-CLAUDE-AUTH');
    return 'AUTH_STATUS_OK';
  },['PF-019']);

  add('PF-021','kodjo-v2-lean-queue.yml GitHub access',()=>{
    if (probes.githubAccess) return probes.githubAccess();
    if (!process.env.GH_TOKEN || !process.env.GITHUB_REPOSITORY) throw new Error('GITHUB_PREFLIGHT_CREDENTIALS_MISSING');
    const r = command('gh',['api','repos/'+process.env.GITHUB_REPOSITORY,'--jq','.full_name'],cwd);
    if (!r.ok) throw new Error('GITHUB_PREFLIGHT_READ_FAILED');
    return r.stdout.trim();
  });

  const executionHead = queue ? executionHeadOf(queue) : '';

  add('PF-022','run-local-claude.js package lock binding',()=>{
    if (probes.packageLock) return probes.packageLock(cwd, executionHead);
    return {package_lock_sha256:Source.hashFileAtHead('package-lock.json',executionHead,cwd,{optional:true})};
  },['PF-014']);
  const toolchain = {
    git: byId.get('PF-017') && byId.get('PF-017').status === 'PASS' ? byId.get('PF-017').evidence : null,
    node_npm: byId.get('PF-018') && byId.get('PF-018').status === 'PASS' ? byId.get('PF-018').evidence : null,
    claude: byId.get('PF-019') && byId.get('PF-019').status === 'PASS' ? byId.get('PF-019').evidence : null,
  };
  const bindings = queue ? {
    slice_id:String(queue.slice_id || ''),
    issue_number:Number(queue.issue_number || 0),
    baseline_head:String(queue.baseline_head || ''),
    bootstrap_file:String(queue.slice_bootstrap_file || ''),
    bootstrap_sha256:String(queue.slice_bootstrap_sha256 || ''),
    plan_blob_oid:String(queue.authorized_plan && queue.authorized_plan.plan_blob_oid || ''),
    review_blob_oid:String(queue.independent_review && queue.independent_review.review_blob_oid || ''),
    user_gate_ref:String(queue.user_gate && queue.user_gate.gate_ref || ''),
    checkpoint_ref:String(queue.delivery_checkpoint && queue.delivery_checkpoint.checkpoint_ref || ''),
    recovery_attestation_blob_oid:String(queue.recovery_migration && queue.recovery_migration.attestation_blob_oid || ''),
  } : {};

  const attestation = P.finalize({
    generated_at:new Date().toISOString(),
    queue_path:queuePath,
    queue_blob_oid:queueBlob,
    request_id:queue ? String(queue.request_id || '') : '',
    event_before:before,
    event_after:after,
    protocol_head:queue ? String(queue.source_head || '') : '',
    execution_head:executionHead,
    operation_kind:queue ? String(queue.operation_kind || 'IMPLEMENT').toUpperCase() : '',
    mode:queue ? String(queue.mode || '').toUpperCase() : '',
    bindings,
    freshness_guards_required:['PF-023','PF-024','PF-025','PF-026','PF-027','PF-028'],
    projection_sha256:projected ? P.sha256(projected) : null,
    prompt_sha256:promptHash,
    prompt_file_sha256:promptFileHash,
    prompt_bytes:promptBytes,
    package_lock_sha256:byId.get('PF-022') && byId.get('PF-022').status === 'PASS'
      ? byId.get('PF-022').evidence.package_lock_sha256 : null,
    toolchain,
    checks,
  });
  if (outputFile) {
    fs.mkdirSync(path.dirname(outputFile),{recursive:true});
    fs.writeFileSync(outputFile,JSON.stringify(attestation,null,2)+'\n','utf8');
  }
  return attestation;
}

if (require.main === module) {
  try {
    const [queuePath,before,after,outputFile] = process.argv.slice(2);
    if (!queuePath || !before || !after || !outputFile) throw new Error('USAGE: verify-queue-preflight.js <queue.json> <before> <after> <output.json>');
    const result = runPreflight({queuePath,before,after,outputFile});
    process.stdout.write('[KODJO_V2] PREFLIGHT_' + result.status + ' checks=' + result.checks.length + ' fingerprint=' + result.preflight_fingerprint.slice(0,12) + '\n');
    if (result.status !== 'PASS') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exitCode = 1;
  }
}

module.exports = { runPreflight, command };
