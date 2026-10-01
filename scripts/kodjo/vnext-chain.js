#!/usr/bin/env node
'use strict';

// Explicit commands; no prompt, retry, activation, queue publication or FINAL
// audit is implicit. The committed prepared dossier is the admission authority.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Chain = require('./lib/vnext-live-chain');
const Approval = require('./lib/approval-handoff-contract');
function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
function write(file, value) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function reservationMessage(prepared) {
  return 'KODJO VNext — Réservation technique du gate\nprepared_chain_hash=' + prepared.contract_hash
    + '\nAucune approbation demandée ou acquise à ce stade.';
}
function verifyReservation(prepared, reservation, github) {
  const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(prepared.produced.artifacts.planningEnvelope.issue_id);
  const id = /^issue_comment:([1-9][0-9]*)$/.exec(reservation.gate_ref)?.[1];
  if (!issue || !id || reservation.repository !== issue[1] || reservation.issue_number !== Number(issue[2])
      || reservation.prepared_chain_hash !== prepared.contract_hash) throw Error('VNEXT_CHAIN_REAL_GATE_REQUIRED');
  const comment = github.comment(issue[1], id);
  if (String(comment.id) !== id || comment.issue_url !== 'https://api.github.com/repos/' + issue[1] + '/issues/' + issue[2]
      || comment.body !== reservationMessage(prepared)) throw Error('VNEXT_CHAIN_REAL_GATE_REQUIRED');
  return reservation.gate_ref;
}
function finalizeTransport(prepared, draft, reservation, { cwd, github = require('./verify-authorizations').ghClient() }) {
  Chain.preparedArtifacts(prepared, cwd, prepared.produced.producer_revision);
  if (Object.hasOwn(draft, 'gate_ref')) throw Error('VNEXT_CHAIN_PREPARATORY_GATE_FORBIDDEN');
  const fields = require('./lib/vnext-legacy-queue-adapter').prepareTransport(draft);
  return { ...fields, gate_ref: verifyReservation(prepared, reservation, github),
    request_id: crypto.randomUUID(), created_at: new Date().toISOString() };
}
function main(args = process.argv.slice(2)) {
  const [stage, configFile, output] = args;
  const cwd = process.cwd();
  if (!stage || !configFile) throw new Error('Usage: vnext-chain.js <produce|review|prepare|reserve-gate|finalize-transport|request-approval|handoff|admit|validate-publication> <config.json|queue.json> [output]');
  if (stage === 'admit') {
    const result = Chain.admit(configFile, { cwd });
    if (output) write(output, result);
    return { stage, status: result.admission.status };
  }
  const config = read(configFile);
  if (!output && stage !== 'request-approval') throw new Error('VNEXT_CHAIN_OUTPUT_REQUIRED');
  if (output && ['reserve-gate', 'finalize-transport'].includes(stage) && fs.existsSync(output)) throw Error('VNEXT_CHAIN_OUTPUT_EXISTS');
  if (stage === 'validate-publication') write(output, require('./validate-vnext-publication').main(configFile));
  else if (stage === 'produce') write(output, Chain.produce(config, { cwd }));
  else if (stage === 'review') write(output, Chain.review(read(config.produced_file), { cwd }));
  else if (stage === 'prepare') {
    const result = Chain.prepare(read(config.produced_file), read(config.review_receipt_file), config.transport, { cwd });
    write(output, result.prepared);
    for (const file of Object.values(result.compatibility_files)) write(Chain.relative(file.path), file.content);
  } else if (stage === 'reserve-gate') {
    const prepared = read(config.prepared_file);
    Chain.preparedArtifacts(prepared, cwd, prepared.produced.producer_revision);
    const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(prepared.produced.artifacts.planningEnvelope.issue_id);
    if (!issue) throw Error('VNEXT_CHAIN_REPOSITORY_MISMATCH');
    const response = JSON.parse(Chain.command('gh', ['api', '--method', 'POST',
      'repos/' + issue[1] + '/issues/' + issue[2] + '/comments', '--input', '-'], cwd,
      JSON.stringify({ body: reservationMessage(prepared) })));
    write(output, { gate_ref: 'issue_comment:' + response.id, repository: issue[1], issue_number: Number(issue[2]),
      prepared_chain_hash: prepared.contract_hash, reservation_url: response.html_url });
  } else if (stage === 'finalize-transport') {
    const prepared = read(config.prepared_file), draft = read(config.transport_file);
    const reservation = read(config.gate_reservation_file);
    const transport = finalizeTransport(prepared, draft, reservation, { cwd });
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(transport, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
  } else if (stage === 'request-approval') {
    const head = Chain.command('git', ['rev-parse', 'HEAD'], cwd).trim();
    const bootstrap = JSON.parse(Chain.readGit(cwd, head, config.bootstrap_file));
    const prepared = JSON.parse(Chain.readGit(cwd, head, bootstrap.vnext_chain_file));
    const target = Chain.approvalTarget(prepared, { cwd, protocolHead: head });
    const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(prepared.produced.artifacts.planningEnvelope.issue_id);
    if (!issue || bootstrap.repository !== issue[1]) throw new Error('VNEXT_CHAIN_REPOSITORY_MISMATCH');
    let endpoint = 'repos/' + issue[1] + '/issues/' + issue[2] + '/comments', method = 'POST';
    if (config.gate_reservation_file) {
      const reservation = read(config.gate_reservation_file);
      verifyReservation(prepared, reservation, require('./verify-authorizations').ghClient());
      endpoint = 'repos/' + issue[1] + '/issues/comments/' + reservation.gate_ref.slice('issue_comment:'.length);
      method = 'PATCH';
    }
    const response = JSON.parse(Chain.command('gh', ['api', '--method', method, endpoint, '--input', '-'], cwd,
      JSON.stringify({ body: head + '\n' + Approval.renderApprovalMessage(target) })));
    const result = { approval_target: target, gate_ref: 'issue_comment:' + response.id, approval_url: response.html_url };
    if (output) write(output, result);
    return { stage, status: 'USER_APPROVAL_REQUIRED', ...result };
  } else if (stage === 'handoff') {
    const head = config.protocol_head;
    const bootstrap = JSON.parse(Chain.readGit(cwd, head, config.bootstrap_file));
    const prepared = JSON.parse(Chain.readGit(cwd, head, bootstrap.vnext_chain_file));
    const seed = { slice_id: bootstrap.slice_id, issue_number: bootstrap.issue_number, source_head: head,
      slice_bootstrap_file: config.bootstrap_file, slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256,
      authorized_plan: { plan_path: config.transport.plan_path }, independent_review: { review_path: config.transport.review_path },
      prompt_file: config.transport.prompt_file, user_gate: { gate_ref: config.gate_ref },
      request_id: config.request_id || crypto.randomUUID(), created_at: new Date().toISOString() };
    const derived = Chain.deriveQueue(seed, { cwd });
    // Materialize only after the fresh observation and contract checks pass.
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(derived.projection.legacy_queue_request, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
    try { const admitted = Chain.admit(output, { cwd }); write(output + '.admission.json', admitted); }
    catch (error) { fs.unlinkSync(output); throw error; }
  } else throw new Error('VNEXT_CHAIN_COMMAND_INVALID');
  return { stage, status: 'RECORDED', output };
}
if (require.main === module) {
  try { process.stdout.write(JSON.stringify(main()) + '\n'); }
  catch (error) { process.stderr.write(String(error.message) + '\n'); process.exitCode = 1; }
}
module.exports = { main, reservationMessage, verifyReservation, finalizeTransport };
