'use strict';
const fs = require('node:fs');
const { spawn, spawnSync } = require('node:child_process');
const V = require('./vnext-contract');

// Keep the existing synchronous review boundary; the child supervises Claude
// asynchronously and persists metadata while the parent waits.
function command(bin, args, cwd, input, env, timeoutMs, { onResult, progressPath } = {}) {
  const r = spawnSync(process.execPath, [__filename], {
    cwd, env, input: JSON.stringify({ bin, args, cwd, input, timeoutMs, progressPath }),
    encoding: 'utf8', shell: false, windowsHide: true,
    timeout: timeoutMs + 20000, maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error || r.status !== 0) V.fail('VNEXT_REVIEW_SUPERVISOR_FAILED', r.error?.message || r.stderr);
  const result = JSON.parse(r.stdout);
  if (onResult) onResult(result);
  let terminal;
  try { terminal = JSON.parse(result.stdout); } catch { /* Stream errors keep their existing classification. */ }
  if (result.error_code || result.status !== 0 || terminal?.is_error === true) {
    // Claude can put its failure in the final stdout event with empty stderr.
    // Reuse the existing failure classifier, without exposing arbitrary output.
    const failure = require('./claude-local').classifyClaudeFailure(result);
    const code = failure === 'KODJO-V2-CLAUDE-AUTH' ? 'VNEXT_REVIEW_AUTHENTICATION_REQUIRED'
      : failure === 'KODJO-V2-CLAUDE-USAGE-LIMIT' ? 'VNEXT_REVIEW_USAGE_LIMIT' : 'VNEXT_LIVE_PROCESS_FAILED';
    V.fail(code, result.error_code || (code === 'VNEXT_LIVE_PROCESS_FAILED' ? 'reviewer exited without a usable result' : undefined));
  }
  return result.stdout;
}

async function supervise(config) {
  const startedAt = new Date().toISOString();
  const progress = { schema_version: 'kodjo.vnext.review-progress.v1', started_at: startedAt,
    phase: 'VERSION_CHECK', event_count: 0, recent_events: [] };
  const save = () => { if (config.progressPath) fs.writeFileSync(config.progressPath, JSON.stringify(progress, null, 2) + '\n'); };
  save();
  const version = spawnSync(config.bin, ['--version'], { cwd: config.cwd, encoding: 'utf8',
    shell: false, windowsHide: true, timeout: 10000, maxBuffer: 4096 });
  // Persist only a version number, never arbitrary CLI output.
  progress.cli_version = /\d+\.\d+\.\d+/.exec(version.stdout || '')?.[0] || null;
  if (version.error || version.status !== 0) throw Error('VNEXT_REVIEW_VERSION_CHECK_FAILED');
  progress.phase = 'STARTING'; save();
  const child = spawn(config.bin, config.args, { cwd: config.cwd, shell: false, windowsHide: true });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  progress.pid = child.pid || null; progress.phase = 'RUNNING'; save();
  let pending = '', final = '', stderr = '', bytes = 0, errorCode = null, archiveError = null;
  const stop = code => { errorCode ||= code; child.kill('SIGTERM'); };
  const persist = () => { try { save(); } catch (error) { archiveError ||= error; stop('VNEXT_PROGRESS_ARCHIVE_FAILED'); } };
  const started = Date.now();
  const timer = setTimeout(() => stop('ETIMEDOUT'), config.timeoutMs);
  child.stdout.on('data', chunk => {
    bytes += Buffer.byteLength(chunk);
    if (bytes > 64 * 1024 * 1024) return stop('ENOBUFS');
    pending += chunk.toString('utf8');
    let newline;
    while ((newline = pending.indexOf('\n')) >= 0) {
      const line = pending.slice(0, newline); pending = pending.slice(newline + 1);
      if (!line.trim()) continue;
      let event;
      try { event = JSON.parse(line); } catch { stop('VNEXT_REVIEW_STREAM_INVALID'); continue; }
      const at = new Date().toISOString();
      progress.first_event_at ||= at; progress.last_event_at = at; progress.event_count++;
      // No text, tool inputs, credentials, or reasoning enters the progress log.
      progress.recent_events.push({ at, type: String(event.type || 'unknown').slice(0, 40) });
      progress.recent_events = progress.recent_events.slice(-100);
      if (event.type === 'result') {
        if (final) stop('VNEXT_REVIEW_STREAM_DUPLICATE_RESULT');
        final = line;
      }
      persist();
    }
  });
  child.stderr.on('data', chunk => { stderr += chunk.toString('utf8'); if (stderr.length > 1024 * 1024) stop('ENOBUFS'); });
  child.stdin.on('error', () => stop('VNEXT_REVIEW_STDIN_FAILED'));
  child.on('error', error => { errorCode ||= error.code || 'VNEXT_REVIEW_SPAWN_FAILED'; });
  child.stdin.end(config.input);
  const result = await new Promise(resolve => child.on('close', (status, signal) => resolve({ status, signal })));
  clearTimeout(timer);
  if (pending.trim()) errorCode ||= 'VNEXT_REVIEW_STREAM_INCOMPLETE';
  if (!final && !errorCode) errorCode = 'VNEXT_REVIEW_STREAM_RESULT_MISSING';
  progress.phase = 'COMPLETED'; progress.finished_at = new Date().toISOString();
  progress.error_code = errorCode; persist();
  if (archiveError) errorCode ||= 'VNEXT_PROGRESS_ARCHIVE_FAILED';
  return { ...result, started_at: startedAt, finished_at: progress.finished_at,
    duration_ms: Date.now() - started, error_code: errorCode, error: errorCode,
    stdout: final, stderr, stream_bytes: bytes, event_count: progress.event_count,
    cli_version: progress.cli_version };
}
if (require.main === module) {
  let input = ''; process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => supervise(JSON.parse(input)).then(result => process.stdout.write(JSON.stringify(result)))
    .catch(error => { process.stderr.write(error.message); process.exitCode = 1; }));
}
module.exports = { command };
