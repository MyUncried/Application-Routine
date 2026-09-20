'use strict';

const fs = require('node:fs');
const path = require('node:path');
const P = require('./preflight-contract');
const Source = require('./preflight-source');

function packageLockHash(repoRoot) {
  const file = path.join(repoRoot, 'package-lock.json');
  return fs.existsSync(file) ? P.sha256(fs.readFileSync(file)) : null;
}

function verifyLocalFreshness(options) {
  const { preflight, rawRequest, request, repoRoot } = options;
  P.verify(preflight, {
    request_id: request.request_id,
    protocol_head: request.protocol_source_head,
    execution_head: request.source_head,
  });
  if (preflight.status !== 'PASS') throw new Error('PREFLIGHT_ATTESTATION_NOT_PASS');

  if (P.sha256(rawRequest) !== preflight.projection_sha256) {
    throw new Error('PREFLIGHT_PROJECTION_DRIFT');
  }

  const promptRelative = path.relative(repoRoot, request.prompt_file).replace(/\\/g, '/');
  if (!promptRelative || promptRelative.startsWith('../') || path.isAbsolute(promptRelative)) {
    throw new Error('PREFLIGHT_PROMPT_PATH_INVALID');
  }
  const promptSourceHash = P.sha256(
    Source.readFileAtHead(promptRelative, request.protocol_source_head, repoRoot)
  );
  if (preflight.prompt_file_sha256 && promptSourceHash !== preflight.prompt_file_sha256) {
    throw new Error('PREFLIGHT_PROMPT_SOURCE_DRIFT');
  }

  if (fs.existsSync(request.prompt_file) && P.sha256(fs.readFileSync(request.prompt_file)) !== promptSourceHash) {
    throw new Error('PREFLIGHT_PROMPT_SOURCE_DRIFT');
  }

  const lockHash = packageLockHash(repoRoot);
  if ((preflight.package_lock_sha256 || null) !== lockHash) {
    throw new Error('PREFLIGHT_PACKAGE_LOCK_DRIFT');
  }

  return {
    request_id: request.request_id,
    execution_head: request.source_head,
    prompt_file_sha256: promptSourceHash,
    package_lock_sha256: lockHash,
  };
}

module.exports = { verifyLocalFreshness, packageLockHash };
