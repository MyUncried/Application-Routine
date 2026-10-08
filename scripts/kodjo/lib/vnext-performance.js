'use strict';
// Opt-in local diagnostics: no command arguments, credentials or source bytes.
const fs = require('node:fs'), path = require('node:path');
function measure(operation, work, details = {}) {
  const directory = process.env.KODJO_VNEXT_PERF_DIR;
  if (!directory) return work();
  const start = performance.now(); let success = false;
  try { const value = work(); success = true; return value; }
  finally {
    try {
      if (!path.isAbsolute(directory)) throw Error('absolute diagnostic directory required');
      fs.mkdirSync(directory, { recursive: true });
      fs.appendFileSync(path.join(directory, 'vnext-' + process.pid + '.jsonl'), JSON.stringify({
        operation, duration_ms: performance.now() - start, success, ...details,
      }) + '\n');
    } catch (_) { process.stderr.write('VNEXT_PERFORMANCE_DIAGNOSTIC_UNAVAILABLE\n'); }
  }
}
module.exports = { measure };
