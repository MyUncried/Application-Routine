'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const LOCK_SCHEMA = 'kodjo.protocol.v2.execution-lock.0.6.17';

function parseWindowsSnapshot(stdout) {
  let rows;
  try { rows = JSON.parse(String(stdout || '').replace(/^\uFEFF/, '').trim() || '[]'); }
  catch (err) { return { state: 'AMBIGUOUS', evidence: 'CIM_JSON_INVALID: ' + err.message }; }
  if (!Array.isArray(rows)) rows = [rows];
  return { state: 'OK', rows };
}

function isDescendant(pid, rootPid, byPid) {
  const seen = new Set();
  let cursor = Number(pid);
  while (Number.isInteger(cursor) && cursor > 0 && !seen.has(cursor)) {
    if (cursor === rootPid) return true;
    seen.add(cursor);
    const row = byPid.get(cursor);
    cursor = row ? Number(row.ParentProcessId) : 0;
  }
  return false;
}

function managedClaudeMarkers(env = process.env) {
  if (process.platform !== 'win32' && !env.APPDATA) return ['@anthropic-ai/claude-code/'];
  const root = path.join(env.APPDATA || '', 'npm', 'node_modules', '@anthropic-ai', 'claude-code');
  return [root, path.join(root, 'bin', 'claude.exe')].map((value) => value.replace(/\//g, '\\').toLowerCase());
}

function classifyClaudeProcesses(rows, inspectorPid = process.pid, markers = managedClaudeMarkers()) {
  const byPid = new Map(rows.map((row) => [Number(row.ProcessId), row]));
  return rows.filter((row) => {
    const pid = Number(row.ProcessId);
    if (!Number.isInteger(pid) || isDescendant(pid, inspectorPid, byPid)) return false;
    const executable = String(row.ExecutablePath || '').replace(/\//g, '\\').toLowerCase();
    const command = String(row.CommandLine || '').replace(/\//g, '\\').toLowerCase();
    return markers.some((marker) => executable.includes(marker) || command.includes(marker));
  });
}

function windowsProcessSnapshot() {
  // Le script CIM ne contient volontairement aucun nom ou motif Claude. Le
  // filtrage est fait dans Node, après exclusion du processus inspecteur et de
  // ses descendants : le scanner ne peut donc pas se reconnaître lui-même.
  const script = "$ErrorActionPreference='Stop'; @(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CreationDate,Name,ExecutablePath,CommandLine) | ConvertTo-Json -Compress -Depth 3";
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', windowsHide: true, shell: false });
  if (r.error || r.status !== 0) return { state: 'AMBIGUOUS', evidence: String(r.stderr || r.error || 'CIM_UNREADABLE') };
  return parseWindowsSnapshot(r.stdout);
}

function processIdentity(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return { state: 'DEAD', evidence: 'INVALID_PID' };
  if (process.platform === 'win32') {
    const script = "$p=Get-CimInstance Win32_Process -Filter \"ProcessId=" + pid + "\" -ErrorAction SilentlyContinue; if($null -eq $p){exit 3}; [Console]::Out.Write(($p.CreationDate.ToUniversalTime().ToString('o'))+'|'+$p.Name+'|'+$p.CommandLine)";
    const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', windowsHide: true, shell: false });
    if (r.status === 3) return { state: 'DEAD', evidence: 'CIM_ABSENT' };
    if (r.error || r.status !== 0 || !String(r.stdout).includes('|')) return { state: 'AMBIGUOUS', evidence: String(r.stderr || r.error || 'CIM_UNREADABLE') };
    const [started_at, name, ...command] = String(r.stdout).trim().split('|');
    return { state: 'ALIVE', started_at, name, command_line: command.join('|') };
  }
  const r = spawnSync('ps', ['-p', String(pid), '-o', 'lstart=', '-o', 'comm=', '-o', 'args='], { encoding: 'utf8', shell: false });
  if (r.status === 1 || !String(r.stdout).trim()) return { state: 'DEAD', evidence: 'PS_ABSENT' };
  if (r.error || r.status !== 0) return { state: 'AMBIGUOUS', evidence: String(r.stderr || r.error || 'PS_UNREADABLE') };
  const line = String(r.stdout).trim();
  return { state: 'ALIVE', started_at: line.slice(0, 24).trim(), command_line: line.slice(24).trim() };
}

function claudeProcessState() {
  if (process.platform === 'win32') {
    const snapshot = windowsProcessSnapshot();
    if (snapshot.state !== 'OK') return snapshot;
    const matches = classifyClaudeProcesses(snapshot.rows);
    const externalClaude = snapshot.rows.filter((row) => /^claude\.exe$/i.test(String(row.Name || '')) && !matches.includes(row));
    return matches.length
      ? { state: 'ACTIVE', evidence: matches.map((row) => String(row.ProcessId) + '|' + String(row.CreationDate || '') + '|' + String(row.Name || '') + '|' + String(row.CommandLine || '')).join('\n') }
      : { state: 'NONE', evidence: 'CIM_NO_MANAGED_CLAUDE', external_claude_count: externalClaude.length };
  }
  const r = spawnSync('ps', ['-eo', 'pid=,lstart=,args='], { encoding: 'utf8', shell: false });
  if (r.error || r.status !== 0) return { state: 'AMBIGUOUS', evidence: String(r.stderr || r.error || 'PS_UNREADABLE') };
  const matches = String(r.stdout).split(/\r?\n/).filter((line) => /@anthropic-ai[\\/]claude-code|\bclaude(?:\.exe)?\s/.test(line) && !/execution-lock\.js/.test(line));
  return matches.length ? { state: 'ACTIVE', evidence: matches.join('\n') } : { state: 'NONE', evidence: 'PS_NO_CLAUDE' };
}

function createExclusive(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { encoding: 'utf8', mode: 0o600, flag: 'wx' });
}

function acquire(lockPath, identity, inspect = processIdentity, scanClaude = claudeProcessState) {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const current = inspect(process.pid);
  if (current.state !== 'ALIVE' || !current.started_at) throw new Error('LOCK_OWNER_IDENTITY_AMBIGUOUS');
  const record = {
    schema_version: LOCK_SCHEMA, token: require('node:crypto').randomUUID(),
    owner_pid: process.pid, owner_started_at: current.started_at,
    github_run_id: identity.github_run_id || null, github_run_attempt: identity.github_run_attempt || null,
    run_id: identity.run_id, request_id: identity.request_id, session_id: identity.session_id || null,
    acquired_at: new Date().toISOString(),
  };
  try { createExclusive(lockPath, record); return { path: lockPath, record, disposition: 'ACQUIRED' }; }
  catch (err) {
    if (!err || (err.code !== 'EEXIST' && !fs.existsSync(lockPath))) throw err;
  }
  let prior;
  try { prior = JSON.parse(fs.readFileSync(lockPath, 'utf8').replace(/^\uFEFF/, '')); }
  catch (_) {
    const scan = scanClaude();
    if (scan.state !== 'NONE') throw new Error('CLAUDE_EXECUTION_LOCK_AMBIGUOUS');
    fs.unlinkSync(lockPath);
    createExclusive(lockPath, record);
    return { path: lockPath, record, disposition: 'LEGACY_STALE_REPLACED' };
  }
  if (prior.schema_version !== LOCK_SCHEMA || !Number.isInteger(prior.owner_pid) || !prior.owner_started_at || !prior.token) {
    const scan = scanClaude();
    if (scan.state !== 'NONE') throw new Error('CLAUDE_EXECUTION_LOCK_AMBIGUOUS');
    fs.unlinkSync(lockPath);
    createExclusive(lockPath, record);
    return { path: lockPath, record, disposition: 'LEGACY_STALE_REPLACED' };
  }
  const observed = inspect(prior.owner_pid);
  if (observed.state === 'AMBIGUOUS') throw new Error('CLAUDE_EXECUTION_LOCK_AMBIGUOUS');
  if (observed.state === 'ALIVE' && observed.started_at === prior.owner_started_at) {
    throw new Error('CLAUDE_EXECUTION_ALREADY_ACTIVE');
  }
  // DEAD ou même PID avec une autre date de démarrage : l'ancien propriétaire
  // est démontré absent. Suppression compare-and-delete par jeton.
  const reread = JSON.parse(fs.readFileSync(lockPath, 'utf8').replace(/^\uFEFF/, ''));
  if (reread.token !== prior.token) throw new Error('CLAUDE_EXECUTION_LOCK_AMBIGUOUS');
  fs.unlinkSync(lockPath);
  createExclusive(lockPath, record);
  return { path: lockPath, record, disposition: observed.state === 'DEAD' ? 'STALE_REPLACED' : 'PID_REUSED_REPLACED' };
}

function release(handle) {
  if (!handle || !fs.existsSync(handle.path)) return false;
  let current;
  try { current = JSON.parse(fs.readFileSync(handle.path, 'utf8').replace(/^\uFEFF/, '')); }
  catch (_) { return false; }
  if (current.token !== handle.record.token) return false;
  fs.unlinkSync(handle.path);
  return true;
}

module.exports = {
  LOCK_SCHEMA, processIdentity, claudeProcessState, acquire, release,
  parseWindowsSnapshot, classifyClaudeProcesses, windowsProcessSnapshot, managedClaudeMarkers,
};
