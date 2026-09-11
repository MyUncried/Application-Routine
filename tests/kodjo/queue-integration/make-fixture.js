#!/usr/bin/env node
'use strict';

/**
 * Fixtures du banc d'integration : identite de tranche jetable et demandes de
 * file. Aucun lien avec V2-BILAT-01 : slice_id, mission et perimetre sont
 * propres au banc et ne designent aucun fichier applicatif reel.
 *
 * Usage : make-fixture.js <repo> [source_head]
 *   sans source_head : ecrit le bootstrap et le registre
 *   avec source_head : ecrit en plus les demandes de file
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const SLICE = 'QUALIF';
const ORCH = ['.github', 'orchestration'];

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}
const sha256 = (v) => crypto.createHash('sha256').update(v, 'utf8').digest('hex');
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8');

function main(repo, sourceHead) {
  const orch = path.join(repo, ...ORCH);
  const sliceDir = path.join(orch, 'v2-slices', SLICE);
  fs.mkdirSync(sliceDir, { recursive: true });
  fs.mkdirSync(path.join(orch, 'queue', 'v2'), { recursive: true });

  const missionPath = '.github/orchestration/v2-slices/' + SLICE + '/implementation-mission.md';
  const planFile = path.join(sliceDir, 'technical-plan.md');
  if (!fs.existsSync(planFile)) fs.writeFileSync(planFile, '# Plan technique de qualification\n', 'utf8');
  const reviewFile = path.join(sliceDir, 'independent-review.md');
  if (!fs.existsSync(reviewFile)) {
    fs.writeFileSync(reviewFile,
      '# Revue independante de qualification\n\n- Plan revu : `technical-plan.md`\n\nVerdict : `APPROVED`\n',
      'utf8');
  }
  const mission = fs.readFileSync(path.join(repo, missionPath), 'utf8');
  const baseline = 'e'.repeat(40);

  const bootstrap = {
    schema_version: 'kodjo.protocol.v2.slice-bootstrap.0.6.12',
    slice_id: SLICE,
    issue_number: 999,
    repository: 'MyUncried/Application-Routine',
    target_branch: 'main',
    baseline_head: baseline,
    protocol_version: '0.6.12',
    protocol_commit: 'f'.repeat(40),
    activation_registry: '.github/orchestration/v2-activation-registry.json',
    previous_slice_id: null,
    previous_checkpoint: null,
    product_sources: [{ path: missionPath, sha256: sha256(mission) }],
    authorized_actors: ['kodjo-protocol', 'kodjo-reviewer'],
    created_at: '2026-09-11T00:00:00.000Z',
  };
  bootstrap.slice_bootstrap_sha256 = sha256(canonical(bootstrap));
  write(path.join(sliceDir, 'slice-bootstrap.json'), bootstrap);

  write(path.join(orch, 'v2-activation-registry.json'), {
    schema_version: 'kodjo.protocol.v2.activation-registry.0.6.12',
    activations: [{
      slice_id: SLICE,
      status: 'ACTIVE',
      issue_number: bootstrap.issue_number,
      baseline_head: baseline,
      bootstrap_path: '.github/orchestration/v2-slices/' + SLICE + '/slice-bootstrap.json',
      slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256,
    }],
  });

  if (!sourceHead) return 0;

  // Le plan approuve doit exister comme objet Git : les preuves d'autorisation
  // sont des hashes verifiables, jamais des chaines declaratives.
  const { execFileSync } = require('node:child_process');
  const git = (args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  const planPath = '.github/orchestration/v2-slices/' + SLICE + '/technical-plan.md';
  const planBlob = git(['rev-parse', 'HEAD:' + planPath]);
  const reviewPath = '.github/orchestration/v2-slices/' + SLICE + '/independent-review.md';
  const reviewBlob = git(['rev-parse', 'HEAD:' + reviewPath]);
  const planCommit = git(['rev-parse', 'HEAD']);

  const uuid = (n) => '550e8400-e29b-41d4-a716-4466554400' + String(n).padStart(2, '0');
  const base = {
    schema_version: 'kodjo.protocol.v2.lean-request.0.6.13',
    request_id: uuid(1),
    authorized_plan: {
      plan_path: planPath, plan_blob_oid: planBlob,
      approved_at_commit: planCommit, evidence_kind: 'ARTIFACT_HASH',
    },
    independent_review: {
      review_path: reviewPath, review_blob_oid: reviewBlob, reviewed_plan_blob_oid: planBlob,
      verdict: 'APPROVED', evidence_kind: 'ARTIFACT_HASH',
    },
    user_gate: {
      gate_ref: 'issue_comment:12', gated_reference: planBlob,
      decision: 'APPROVED', user_login: 'MyUncried', evidence_kind: 'ORGANISATIONAL',
    },
    slice_id: SLICE,
    issue_number: bootstrap.issue_number,
    mode: 'INITIAL',
    session_id: null,
    source_head: sourceHead,
    baseline_head: baseline,
    slice_bootstrap_file: '.github/orchestration/v2-slices/' + SLICE + '/slice-bootstrap.json',
    slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256,
    prompt_file: missionPath,
    scope_allow: ['src/domain/sessions/**'],
    checks: ['jest'],
    limits: {
      max_ai_calls: 1, max_duration_seconds: 600,
      max_prompt_bytes: 32768, max_total_prompt_bytes: 32768, max_rollovers: 0,
    },
    created_at: '2026-09-11T00:00:00.000Z',
  };
  write(path.join(orch, 'queue', 'v2', 'nominal.json'), base);
  write(path.join(orch, 'queue', 'v2', 'invalide.json'),
    { ...base, request_id: uuid(2), allow_legacy_recovery_bootstrap: 'true' });
  // Preuve declarative : exactement ce que portait le HEAD 9d31461.
  write(path.join(orch, 'queue', 'v2', 'gate-declaratif.json'),
    { ...base, request_id: uuid(3), user_gate: 'PLAN_APPROVED' });
  // Revue portant sur une autre version du plan.
  write(path.join(orch, 'queue', 'v2', 'revue-divergente.json'),
    { ...base, request_id: uuid(4),
      independent_review: { ...base.independent_review, reviewed_plan_blob_oid: 'b'.repeat(40) } });
  return 0;
}

if (require.main === module) {
  const [repo, sourceHead] = process.argv.slice(2);
  if (!repo) { process.stderr.write('USAGE: make-fixture.js <repo> [source_head]\n'); process.exit(1); }
  process.exit(main(path.resolve(repo), sourceHead));
}

module.exports = { main };
