#!/usr/bin/env node
'use strict';

/**
 * Publie le checkpoint durable d'une VISUAL_CORRECTION après upload du paquet de
 * récupération du run courant. Le commentaire est d'abord créé pour obtenir son
 * ID, puis remplacé avec `checkpoint_ref=issue_comment:<id>` : aucune référence
 * fictive n'est laissée dans la preuve finale.
 */

const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

function gh(args, input) {
  const result = spawnSync('gh', ['api', '-H', 'Accept: application/vnd.github+json', ...args], {
    encoding: 'utf8', input: input || undefined, windowsHide: true, shell: false,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error('GITHUB_WRITE_FAILED: ' + String(result.stderr || (result.error && result.error.message) || '').trim());
  }
  return result.stdout ? JSON.parse(result.stdout) : null;
}

function checkpointBody(meta, artifact, checkpointRef) {
  const gateRef = String((meta.user_gate && meta.user_gate.gate_ref) || '');
  const gateId = gateRef.startsWith('issue_comment:') ? gateRef.slice('issue_comment:'.length) : '';
  const digest = String(artifact.digest || '');
  const lines = [
    '[KODJO_V2] APPLICATION_CHECKPOINT',
    '',
    'status=CERTIFIED',
    'slice_id=' + meta.slice_id,
    'checkpoint_ref=' + checkpointRef,
    'application_pr=' + meta.application_pr,
    'application_head=' + meta.application_head,
    'plan_blob_oid=' + meta.authorized_plan.plan_blob_oid,
    'review_blob_oid=' + meta.independent_review.review_blob_oid,
    'gate_comment_id=' + gateId,
    'protocol_head=' + meta.protocol_head,
    'package_run_id=' + process.env.GITHUB_RUN_ID,
    'package_artifact_id=' + artifact.id,
  ];
  if (digest) lines.push('package_artifact_digest=' + digest);
  lines.push(
    'attestation_path=' + meta.attestation_path,
    'attestation_blob_oid=' + meta.attestation_blob_oid,
    'delivery_head=' + meta.application_head,
    'prior_checkpoint_ref=' + meta.prior_checkpoint_ref,
    'request_id=' + meta.request_id,
    'STATUT : APPLICATION_CHECKPOINT_CERTIFIED',
    '',
    'La correction visuelle a été livrée sur la PR existante sans fusion. Ce checkpoint devient la référence unique d’une éventuelle correction visuelle suivante.'
  );
  return lines.join('\n');
}

function main(argv) {
  const metadataFile = argv[0] || process.env.KODJO_VISUAL_DELIVERY_METADATA_FILE;
  if (!metadataFile || !fs.existsSync(metadataFile)) {
    process.stdout.write('[KODJO_V2] visual checkpoint NOT_APPLICABLE\n');
    return null;
  }
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const attempt = process.env.GITHUB_RUN_ATTEMPT || '1';
  if (!repository || !/^[1-9][0-9]*$/.test(String(runId || ''))) throw new Error('GITHUB_RUN_CONTEXT_INVALID');
  const meta = JSON.parse(fs.readFileSync(metadataFile, 'utf8').replace(/^\uFEFF/, ''));
  if (meta.schema_version !== 'kodjo.protocol.v2.visual-delivery.0.6.28') {
    throw new Error('VISUAL_DELIVERY_METADATA_SCHEMA_INVALID');
  }
  const expectedName = 'kodjo-v2-recovery-' + runId + '-' + attempt;
  const list = gh(['repos/' + repository + '/actions/runs/' + runId + '/artifacts?per_page=100']);
  const artifacts = Array.isArray(list && list.artifacts) ? list.artifacts : [];
  const matches = artifacts.filter((item) => item && item.name === expectedName && !item.expired);
  if (matches.length !== 1) {
    throw new Error('VISUAL_RECOVERY_ARTIFACT_NOT_UNIQUE: ' + expectedName + ' count=' + matches.length);
  }
  const artifact = matches[0];
  const pending = checkpointBody(meta, artifact, 'PENDING');
  const created = gh(['repos/' + repository + '/issues/' + meta.issue_number + '/comments', '--method', 'POST', '-f', 'body=' + pending]);
  if (!created || !created.id) throw new Error('VISUAL_CHECKPOINT_COMMENT_NOT_CREATED');
  const ref = 'issue_comment:' + created.id;
  const finalBody = checkpointBody(meta, artifact, ref);
  gh(['repos/' + repository + '/issues/comments/' + created.id, '--method', 'PATCH', '-f', 'body=' + finalBody]);
  process.stdout.write('[KODJO_V2] VISUAL_APPLICATION_CHECKPOINT=' + ref + '\n');
  return { checkpoint_ref: ref, artifact_id: artifact.id, application_head: meta.application_head };
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { main, checkpointBody };
