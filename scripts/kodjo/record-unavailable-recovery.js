#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
// Called only when the download did not succeed; no certification is implied.
function record(file) {
  const proof = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!['FAIL', 'NON_CERTIFIED'].includes(proof.status) || proof.claude_invoked !== false) {
    throw new Error('HISTORICAL_RECOVERY_RESERVE_INVALID');
  }
  proof.status = 'NON_CERTIFIED';
  proof.reason = 'HISTORICAL_RECOVERY_ARTIFACT_UNAVAILABLE';
  fs.writeFileSync(file, JSON.stringify(proof, null, 2) + '\n');
  return proof;
}
if (require.main === module) record(process.argv[2]);
module.exports = { record };
