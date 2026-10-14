#!/usr/bin/env node
'use strict';
// Read-only candidate and publication-window guard; never publishes or retries.
const fs = require('node:fs');
const Publication = require('./lib/vnext-publication');
function main(configFile, { read } = {}) {
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  const candidate = Publication.validateTree({ cwd: process.cwd(), expectedParent: config.expected_parent, candidateTree: config.candidate_tree });
  const scope={repository:config.repository,branch:config.branch,expectedParent:config.expected_parent,read};
  // Existing configs explicitly carrying a campaign checkpoint retain their
  // historical control; new candidates use the generic verified Git window.
  const window=Object.hasOwn(config,'checkpoint_sha')?Publication.verifyWindow({...scope,checkpointSha:config.checkpoint_sha}):Publication.verifyCandidateWindow(scope);
  return { ...candidate, publication_window: window };
}
if (require.main === module) {
  try { console.log(JSON.stringify(main(process.argv[2]))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { main };
