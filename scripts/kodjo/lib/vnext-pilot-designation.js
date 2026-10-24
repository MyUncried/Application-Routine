'use strict';
// Per-slice pilot designation for the Claude Code piloting variant.
// Opt-in only: a slice without a committed designation keeps the ChatGPT pilot,
// so no existing slice changes behaviour. The VNext engine is never modified here.
const { spawnSync } = require('node:child_process');
const V = require('./vnext-contract');

const SCHEMA = 'kodjo.vnext.pilot-designation.v1';
const PILOTS = Object.freeze(['CHATGPT_WORK', 'CLAUDE_CODE']);
const DEFAULT_PILOT = 'CHATGPT_WORK';
const SLICES_DIRECTORY = '.github/orchestration/v2-slices';
const CONNECTOR_SLUG = 'chatgpt-codex-connector';
// PRE-3 stays piloted by ChatGPT until its final delivery (user instruction 2026-10-09).
const EXCLUDED_ISSUES = Object.freeze([340]);
const EXCLUDED_SLICE = /(?:^|-)PRE-3$/i;
const SHA40 = /^[0-9a-f]{40}$/;
const ID = /^[1-9][0-9]*$/;

const designationFile = sliceId => SLICES_DIRECTORY + '/' + V.assertSliceId(sliceId) + '/pilot-designation.json';
const bootstrapFile = sliceId => SLICES_DIRECTORY + '/' + V.assertSliceId(sliceId) + '/slice-bootstrap.json';

function gitReader(cwd) {
  return (args, optional = false) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
    if (result.status !== 0) { if (optional) return null; V.fail('PILOT_GIT_READ_FAILED', args.join(' ')); }
    return result.stdout;
  };
}

function assertNotExcluded(sliceId, issueNumber) {
  if (EXCLUDED_SLICE.test(sliceId) || EXCLUDED_ISSUES.includes(issueNumber)) V.fail('PILOT_VARIANT_SLICE_EXCLUDED', sliceId);
}

function designationBody({ sliceId, sequence, fromPilot, toPilot, checkpointCommit }) {
  return ['[KODJO_PILOT] DESIGNATE', 'slice_id=' + sliceId, 'sequence=' + sequence, 'from_pilot=' + fromPilot,
    'to_pilot=' + toPilot, 'checkpoint_commit=' + checkpointCommit].join('\n');
}

function validateRecord(record, { sliceId, issueNumber }) {
  V.assertExactKeys(record, ['schema_version', 'slice_id', 'issue_number', 'designations'], [], 'PILOT_DESIGNATION_KEYS_INVALID');
  if (record.schema_version !== SCHEMA) V.fail('PILOT_DESIGNATION_SCHEMA_INVALID');
  if (record.slice_id !== sliceId || record.issue_number !== issueNumber) V.fail('PILOT_DESIGNATION_IDENTITY_MISMATCH');
  if (!Array.isArray(record.designations) || !record.designations.length) V.fail('PILOT_DESIGNATION_EMPTY');
  let previous = DEFAULT_PILOT;
  record.designations.forEach((entry, index) => {
    V.assertExactKeys(entry, ['sequence', 'from_pilot', 'to_pilot', 'checkpoint_commit', 'authorization_comment_id',
      'recorded_at', 'open_operations'], [], 'PILOT_DESIGNATION_ENTRY_KEYS_INVALID');
    if (entry.sequence !== index + 1) V.fail('PILOT_DESIGNATION_SEQUENCE_INVALID');
    if (entry.from_pilot !== previous || !PILOTS.includes(entry.to_pilot) || entry.to_pilot === entry.from_pilot) V.fail('PILOT_DESIGNATION_CHAIN_INVALID');
    if (!SHA40.test(String(entry.checkpoint_commit || ''))) V.fail('PILOT_DESIGNATION_CHECKPOINT_INVALID');
    if (!ID.test(String(entry.authorization_comment_id || ''))) V.fail('PILOT_DESIGNATION_AUTHORIZATION_INVALID');
    V.assertIsoDate(entry.recorded_at, 'PILOT_DESIGNATION_DATE_INVALID');
    if (!Array.isArray(entry.open_operations) || entry.open_operations.some(item => typeof item !== 'string' || !item)) V.fail('PILOT_DESIGNATION_OPERATIONS_INVALID');
    previous = entry.to_pilot;
  });
  return record;
}

// The owner posts the designation himself: a comment relayed by the ChatGPT
// connector is refused, so neither pilot can designate itself through its own transport.
function verifyAuthorization(entry, comment, { repository, issueNumber, sliceId }) {
  const owner = repository.split('/')[0];
  const expected = designationBody({ sliceId, sequence: entry.sequence, fromPilot: entry.from_pilot,
    toPilot: entry.to_pilot, checkpointCommit: entry.checkpoint_commit });
  if (!comment || String(comment.id) !== String(entry.authorization_comment_id)
      || comment.issue_url !== 'https://api.github.com/repos/' + repository + '/issues/' + issueNumber
      || String(comment.user?.login || '').toLowerCase() !== owner.toLowerCase()
      || comment.performed_via_github_app != null
      || String(comment.body || '').replace(/\r\n/g, '\n').trim() !== expected) V.fail('PILOT_DESIGNATION_OWNER_AUTHORIZATION_REQUIRED', String(entry.sequence));
  return comment;
}

function readBootstrap(sliceId, { git, head }) {
  const raw = git(['show', head + ':' + bootstrapFile(sliceId)], true);
  if (raw === null) V.fail('PILOT_SLICE_BOOTSTRAP_REQUIRED', sliceId);
  const bootstrap = JSON.parse(raw.replace(/^﻿/, ''));
  if (bootstrap.slice_id !== sliceId || !Number.isInteger(bootstrap.issue_number)
      || !/^[^/\s]+\/[^/\s]+$/.test(String(bootstrap.repository || ''))) V.fail('PILOT_SLICE_BOOTSTRAP_INVALID');
  return bootstrap;
}

// Only committed bytes at HEAD count: an uncommitted edit never changes the pilot.
function resolve(sliceId, { cwd = process.cwd(), git = gitReader(cwd), github, routeSlice } = {}) {
  V.assertSliceId(sliceId);
  const head = git(['rev-parse', 'HEAD']).trim();
  const bootstrap = readBootstrap(sliceId, { git, head });
  assertNotExcluded(sliceId, bootstrap.issue_number);
  const protocol = (routeSlice || (id => require('./slice-protocol-routing').resolve(id, { cwd })))(sliceId);
  if (protocol !== 'VNEXT') V.fail('PILOT_VARIANT_REQUIRES_VNEXT_SLICE', protocol);
  const raw = git(['show', head + ':' + designationFile(sliceId)], true);
  if (raw === null) return { slice_id: sliceId, issue_number: bootstrap.issue_number, pilot: DEFAULT_PILOT, source: 'DEFAULT', head };
  const record = validateRecord(JSON.parse(raw.replace(/^﻿/, '')), { sliceId, issueNumber: bootstrap.issue_number });
  if (!github) V.fail('PILOT_GITHUB_READER_REQUIRED');
  for (const entry of record.designations) {
    verifyAuthorization(entry, github.comment(bootstrap.repository, entry.authorization_comment_id),
      { repository: bootstrap.repository, issueNumber: bootstrap.issue_number, sliceId });
    if (git(['merge-base', '--is-ancestor', entry.checkpoint_commit, head], true) === null) V.fail('PILOT_DESIGNATION_CHECKPOINT_NOT_ANCESTOR', String(entry.sequence));
  }
  const last = record.designations[record.designations.length - 1];
  return { slice_id: sliceId, issue_number: bootstrap.issue_number, pilot: last.to_pilot, source: 'DESIGNATION',
    sequence: last.sequence, authorization_comment_id: last.authorization_comment_id, head };
}

function assertPilot(expected, sliceId, options) {
  const current = resolve(sliceId, options);
  if (current.pilot !== expected) V.fail('PILOT_NOT_DESIGNATED', current.pilot);
  return current;
}

// Independent plan review by a system distinct from the Claude pilot, bound to
// the exact prepared chain that the approval gate will carry.
function verifyIndependentPlanReview(comment, { repository, issueNumber, sliceId, preparedChainHash }) {
  V.assertSha64(preparedChainHash, 'PILOT_PREPARED_CHAIN_HASH_INVALID');
  const body = String(comment?.body || '').replace(/\r\n/g, '\n');
  const one = key => { const values = [...body.matchAll(new RegExp('^' + key + '=([^\\n]*)$', 'gm'))].map(m => m[1].trim()); return values.length === 1 ? values[0] : null; };
  if (!comment || comment.issue_url !== 'https://api.github.com/repos/' + repository + '/issues/' + issueNumber
      || String(comment.user?.login || '').toLowerCase() !== repository.split('/')[0].toLowerCase()
      || comment.performed_via_github_app?.slug !== CONNECTOR_SLUG
      || !body.startsWith('[KODJO_VNEXT] INDEPENDENT_PLAN_REVIEW\n')
      || one('slice_id') !== sliceId || one('prepared_chain_hash') !== preparedChainHash
      || one('reviewer') !== 'ChatGPT' || one('verdict') !== 'APPROVE' || one('human_review_performed') !== 'false') V.fail('PILOT_INDEPENDENT_PLAN_REVIEW_REQUIRED');
  return { comment_id: String(comment.id), prepared_chain_hash: preparedChainHash };
}

module.exports = { SCHEMA, PILOTS, DEFAULT_PILOT, CONNECTOR_SLUG, EXCLUDED_ISSUES, designationFile, bootstrapFile,
  designationBody, validateRecord, verifyAuthorization, resolve, assertPilot, assertNotExcluded, verifyIndependentPlanReview };
