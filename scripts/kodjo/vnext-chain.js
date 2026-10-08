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
// Reconcile the exact remote reservation before any POST. A prior unresolved
// attempt cannot authorize a second creation merely because its receipt is lost.
function reserveComment({ repository, issue, body, output, cwd, invoke = Chain.command }) {
  const endpoint = 'repos/' + repository + '/issues/' + issue + '/comments';
  const binding = { schema_version: 'kodjo.vnext.gate-reservation-intent.v1', repository, issue_number: issue,
    body_sha256: require('./lib/vnext-contract').sha256(body) };
  const intentFile = output + '.intent.json';
  if (fs.existsSync(intentFile) && JSON.stringify(read(intentFile)) !== JSON.stringify(binding)) throw Error('VNEXT_RESERVATION_INTENT_MISMATCH');
  const matches = [];
  for (let page = 1; ; page++) {
    if (page > 100) throw Error('VNEXT_RESERVATION_SCAN_INCOMPLETE');
    const comments = JSON.parse(invoke('gh', ['api', '--method', 'GET', endpoint + '?per_page=100&page=' + page], cwd));
    if (!Array.isArray(comments)) throw Error('VNEXT_RESERVATION_SCAN_INVALID');
    matches.push(...comments.filter(c => c.body === body && c.issue_url === 'https://api.github.com/' + endpoint.slice(0, -'/comments'.length)));
    if (comments.length < 100) break;
  }
  if (matches.length > 1) throw Error('VNEXT_RESERVATION_REMOTE_AMBIGUOUS');
  let response = matches[0];
  if (!response) {
    if (fs.existsSync(intentFile)) throw Error('VNEXT_RESERVATION_PREVIOUS_RESULT_UNKNOWN');
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(intentFile, JSON.stringify(binding, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
    const raw = invoke('gh', ['api', '--method', 'POST', endpoint, '--input', '-'], cwd, JSON.stringify({ body }));
    // Preserve the server response before decoding or storing the final receipt.
    fs.writeFileSync(output + '.response.json', raw, { encoding: 'utf8', flag: 'wx' });
    response = JSON.parse(raw);
  }
  if (!/^[1-9][0-9]*$/.test(String(response.id)) || response.body !== body
      || response.issue_url !== 'https://api.github.com/' + endpoint.slice(0, -'/comments'.length)) throw Error('VNEXT_RESERVATION_RESPONSE_INVALID');
  const result = { gate_ref: 'issue_comment:' + response.id, repository, issue_number: issue,
    reservation_url: response.html_url };
  return result;
}
function verifyReservation(prepared, reservation, github, approvalBody = null) {
  const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(prepared.produced.artifacts.planningEnvelope.issue_id);
  const id = /^issue_comment:([1-9][0-9]*)$/.exec(reservation.gate_ref)?.[1];
  if (!issue || !id || reservation.repository !== issue[1] || reservation.issue_number !== Number(issue[2])
      || reservation.prepared_chain_hash !== prepared.contract_hash) throw Error('VNEXT_CHAIN_REAL_GATE_REQUIRED');
  const comment = github.comment(issue[1], id);
  if (String(comment.id) !== id || comment.issue_url !== 'https://api.github.com/repos/' + issue[1] + '/issues/' + issue[2]
      || (comment.body !== reservationMessage(prepared) && (!approvalBody || comment.body !== approvalBody))) throw Error('VNEXT_CHAIN_REAL_GATE_REQUIRED');
  return reservation.gate_ref;
}
function publishReservedApproval(prepared, reservation, body, { cwd, github, invoke = Chain.command, output }) {
  const id = reservation.gate_ref?.slice('issue_comment:'.length);
  const observed = github.comment(reservation.repository, id);
  verifyReservation(prepared, reservation, { comment: () => observed }, body);
  if (observed.body === body) return observed; // No PATCH: preserve approval/reaction timestamps.
  const raw = invoke('gh', ['api', '--method', 'PATCH', 'repos/' + reservation.repository + '/issues/comments/' + id,
    '--input', '-'], cwd, JSON.stringify({ body }));
  if (output) { fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true }); fs.writeFileSync(output + '.response.json', raw, { encoding: 'utf8', flag: 'wx' }); }
  const response = JSON.parse(raw);
  if (String(response.id) !== id || response.issue_url !== observed.issue_url || response.body !== body) throw Error('VNEXT_APPROVAL_PUBLICATION_RESPONSE_INVALID');
  return response;
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
  if (!stage || !configFile) throw new Error('Usage: vnext-chain.js <launch|produce|review|recover-review|prepare-implementation-review|implementation-review|verify-implementation-review|prepare|reserve-gate|finalize-transport|request-approval|handoff|admit|validate-publication> <config.json|queue.json> [output]');
  if (stage === 'admit') {
    const result = Chain.admit(configFile, { cwd });
    if (output) write(output, result);
    return { stage, status: result.admission.status };
  }
  const config = read(configFile);
  if (!output && stage !== 'request-approval') throw new Error('VNEXT_CHAIN_OUTPUT_REQUIRED');
  if (output && ['reserve-gate', 'finalize-transport'].includes(stage) && fs.existsSync(output)) throw Error('VNEXT_CHAIN_OUTPUT_EXISTS');
  if (stage === 'validate-publication') write(output, require('./validate-vnext-publication').main(configFile));
  else if (stage === 'produce') {
    if(config.sourceManifestInput?.sources.some(s=>s.source_kind==='FIGMA')&&!config.figmaLaunch)throw Error('VNEXT_FIGMA_LAUNCH_REQUIRED');
    write(output, Chain.produce(config, { cwd }));
  }
  else if(['prepare-implementation-review','implementation-review','verify-implementation-review'].includes(stage)){
    const R=require('./lib/vnext-figma-implementation-review');
    const planBody=fs.readFileSync(config.approved_plan_file,'utf8'),observed=read(config.observations_file);
    const options={...observed,cwd,evidenceDirectory:config.evidence_directory};
    if(!options.evidenceDirectory)throw Error('VNEXT_FIGMA_REVIEW_EVIDENCE_DIRECTORY_REQUIRED');
    if(stage==='prepare-implementation-review')write(output,R.prepare(planBody,options));
    else if(stage==='verify-implementation-review')write(output,R.verifyReceipt(planBody,options,read(config.receipt_file),fs.readFileSync(config.response_file,'utf8')));
    else write(output,R.review(planBody,options));
  }
  else if (stage === 'review' || stage === 'recover-review') {
    const produced = read(config.produced_file);
    const options = { cwd, evidenceDirectory: config.evidence_directory };
    if (!options.evidenceDirectory) throw Error('VNEXT_REVIEW_EVIDENCE_DIRECTORY_REQUIRED');
    write(output, stage === 'recover-review' ? Chain.recoverReview(produced, options) : Chain.reviewOrRecover(produced, options));
  }
  else if (stage === 'prepare') {
    const result = Chain.prepare(read(config.produced_file), read(config.review_receipt_file), config.transport, { cwd });
    write(output, result.prepared);
    for (const file of Object.values(result.compatibility_files)) write(Chain.relative(file.path), file.content);
  } else if (stage === 'reserve-gate') {
    const prepared = read(config.prepared_file);
    Chain.preparedArtifacts(prepared, cwd, prepared.produced.producer_revision);
    const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(prepared.produced.artifacts.planningEnvelope.issue_id);
    if (!issue) throw Error('VNEXT_CHAIN_REPOSITORY_MISMATCH');
    const reservation = reserveComment({ repository: issue[1], issue: Number(issue[2]), body: reservationMessage(prepared), output, cwd });
    write(output, { ...reservation, prepared_chain_hash: prepared.contract_hash });
  } else if (stage === 'finalize-transport') {
    const prepared = read(config.prepared_file), draft = read(config.transport_file);
    const reservation = read(config.gate_reservation_file);
    const transport = finalizeTransport(prepared, draft, reservation, { cwd });
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(transport, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
  } else if (stage === 'request-approval') {
    if (!config.gate_reservation_file) throw Error('VNEXT_CHAIN_RESERVED_GATE_REQUIRED');
    const head = Chain.command('git', ['rev-parse', 'HEAD'], cwd).trim();
    const bootstrap = JSON.parse(Chain.readGit(cwd, head, config.bootstrap_file));
    const prepared = JSON.parse(Chain.readGit(cwd, head, bootstrap.vnext_chain_file));
    const target = Chain.approvalTarget(prepared, { cwd, protocolHead: head });
    const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(prepared.produced.artifacts.planningEnvelope.issue_id);
    if (!issue || bootstrap.repository !== issue[1]) throw new Error('VNEXT_CHAIN_REPOSITORY_MISMATCH');
    const response = publishReservedApproval(prepared, read(config.gate_reservation_file), head + '\n' + Approval.renderApprovalMessage(target),
      { cwd, github: require('./verify-authorizations').ghClient(), output });
    const result = { approval_target: target, gate_ref: 'issue_comment:' + response.id, approval_url: response.html_url };
    if (output) write(output, result);
    return { stage, status: 'USER_APPROVAL_REQUIRED', ...result };
  } else if (stage === 'handoff') {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(config.request_id || '')) throw Error('VNEXT_CHAIN_FINALIZED_REQUEST_ID_REQUIRED');
    const head = config.protocol_head;
    const bootstrap = JSON.parse(Chain.readGit(cwd, head, config.bootstrap_file));
    const prepared = JSON.parse(Chain.readGit(cwd, head, bootstrap.vnext_chain_file));
    const seed = { slice_id: bootstrap.slice_id, issue_number: bootstrap.issue_number, source_head: head,
      slice_bootstrap_file: config.bootstrap_file, slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256,
      authorized_plan: { plan_path: config.transport.plan_path }, independent_review: { review_path: config.transport.review_path },
      prompt_file: config.transport.prompt_file, user_gate: { gate_ref: config.gate_ref },
      request_id: config.request_id, created_at: new Date().toISOString() };
    const derived = Chain.deriveQueue(seed, { cwd });
    // Materialize only after the fresh observation and contract checks pass.
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(derived.projection.legacy_queue_request, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
    try { const admitted = Chain.admit(output, { cwd }); write(output + '.admission.json', admitted); }
    catch (error) { fs.unlinkSync(output); throw error; }
  } else throw new Error('VNEXT_CHAIN_COMMAND_INVALID');
  return { stage, status: 'RECORDED', output };
}
async function launchMain(configFile,output){
  if(!configFile||!output||fs.existsSync(output))throw Error('VNEXT_FIGMA_LAUNCH_NEW_OUTPUT_REQUIRED');
  const cwd=process.cwd(),config=read(configFile),relative=Chain.relative(config.adapter_module);
  const head=Chain.command('git',['rev-parse','HEAD'],cwd).trim();
  // Only a reviewed, tracked adapter from the exact checkout may execute.
  if(Chain.readGit(cwd,head,relative)!==fs.readFileSync(path.resolve(cwd,relative),'utf8'))throw Error('VNEXT_FIGMA_LAUNCH_ADAPTER_NOT_COMMITTED');
  const adapter=require(path.resolve(cwd,relative));
  const produced=await Chain.launchAndProduce(config.scope,{...adapter,cwd});
  write(output,produced);return {stage:'launch',status:'RECORDED',output};
}
if (require.main === module) {
  if(process.argv[2]==='launch'){launchMain(process.argv[3],process.argv[4]).then(r=>process.stdout.write(JSON.stringify(r)+'\n')).catch(error=>{process.stderr.write(String(error.message)+'\n');process.exitCode=1;});}
  else try { process.stdout.write(JSON.stringify(main()) + '\n'); }
  catch (error) { process.stderr.write(String(error.message) + '\n'); process.exitCode = 1; }
}
module.exports = { main, launchMain, reservationMessage, verifyReservation, finalizeTransport, reserveComment, publishReservedApproval };
