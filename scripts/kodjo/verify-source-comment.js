#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
function verify(comment, { repository, issue, id, actor = 'github-actions[bot]' }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !/^[1-9]\d*$/.test(String(issue))
      || !/^[1-9]\d*$/.test(String(id))) throw Error('SOURCE_COMMENT_TARGET_INVALID');
  if (!comment || String(comment.id) !== String(id) || comment.user?.login !== actor
      || comment.issue_url !== `https://api.github.com/repos/${repository}/issues/${issue}`) {
    throw Error('SOURCE_COMMENT_ORIGIN_MISMATCH');
  }
  return comment;
}
if (require.main === module) {
  try {
    const [file, repository, issue, id] = process.argv.slice(2);
    verify(JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')), { repository, issue, id });
  } catch (err) { process.stderr.write(err.message + '\n'); process.exitCode = 1; }
}
module.exports = { verify };
