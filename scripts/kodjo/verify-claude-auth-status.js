'use strict';
const fs = require('node:fs');
function verify(raw, exitCode) {
  let status;
  try { status = JSON.parse(raw.replace(/^\uFEFF/, '').trim()); }
  catch { return { status: 'FAILED', error_code: 'VNEXT_REVIEW_AUTH_STATUS_INVALID', model_invoked: false }; }
  const connected = exitCode === 0 && status?.loggedIn === true;
  return { status: connected ? 'PASS' : 'FAILED',
    error_code: connected ? null : 'VNEXT_REVIEW_AUTHENTICATION_REQUIRED', model_invoked: false };
}
if (require.main === module) {
  const receipt = { schema_version: 'kodjo.vnext.auth-preflight.v1',
    observed_at: new Date().toISOString(), ...verify(fs.readFileSync(0, 'utf8'), Number(process.argv[3])) };
  fs.writeFileSync(process.argv[2], JSON.stringify(receipt, null, 2) + '\n');
  if (receipt.error_code) { process.stderr.write(receipt.error_code + '\n'); process.exitCode = 1; }
}
module.exports = { verify };
