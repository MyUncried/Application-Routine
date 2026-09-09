#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || '.');
const identity = String(process.env.GITHUB_RUN_ID || 'local') + '-' + String(process.env.GITHUB_RUN_ATTEMPT || '1');
const base = 'slices/WRITER-SMOKE/operations/run-' + identity + '/attempts/attempt-' + identity + '/implementation';
const source = path.join(root, 'source');
fs.mkdirSync(source, { recursive: true });
const content = 'KODJO_EVIDENCE_WRITER_SMOKE_' + identity + '\n';
const member = 'development-report.md';
fs.writeFileSync(path.join(source, member), content);
const sha256 = crypto.createHash('sha256').update(content).digest('hex');
const request = {
  schema_version: 'kodjo.protocol.v2.evidence-deposit.0.6.9',
  target_branch: 'kodjo/protocol-evidence-v2', target_branch_is_fixed: true,
  append_only: true, replaces_existing_path: false,
  contains_applicative_file: false, functional_ref_write_allowed: false,
  canonical_base: base,
  members: [{ member, canonical_path: base + '/' + member, sha256, bytes: Buffer.byteLength(content), role: 'EVIDENCE' }],
};
fs.writeFileSync(path.join(root, 'evidence-deposit-request.json'), JSON.stringify(request, null, 2) + '\n');
process.stdout.write('WRITER_SMOKE_CANONICAL_BASE=' + base + '\n');
