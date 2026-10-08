'use strict';

// Production boundary: Git bytes, a real read-only Claude process and fresh
// authenticated GitHub observations. No default fixture or offline approval.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const V = require('./vnext-contract');
const Bundle = require('./vnext-file-bundle');
const Perf = require('./vnext-performance');
const Source = require('./source-manifest');
const Envelope = require('./planning-envelope');
const Requirements = require('./requirement-registry');
const Impact = require('./impact-graph');
const Plan = require('./plan-contract');
const Ui = require('./ui-atomicity-contract');
const Review = require('./review-contract');
const Approval = require('./approval-handoff-contract');
const Register = require('./vnext-audit-register');
const Revision = require('./revision-contract');
const Convergence = require('./audit-convergence-contract');
const Adapter = require('./vnext-legacy-queue-adapter');
const Admission = require('./vnext-queue-admission');
const Auth = require('../verify-authorizations');
const GithubApproval = require('./vnext-github-approval');

const SCHEMA = 'kodjo.vnext.prepared-chain.v1';
// Explicit user budget (2026-10-06): two hours for each Claude invocation.
const CLAUDE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
function command(bin, args, cwd, input, env = process.env, timeoutMs = 600000, { onResult } = {}) {
  const startedAt = new Date().toISOString(), started = Date.now();
  const r = Perf.measure(bin === 'git' ? 'chain.git.' + args[0] : 'chain.process', () => spawnSync(bin, args, { cwd, input, env, encoding: 'utf8', shell: false,
    windowsHide: true, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 }));
  if (onResult) onResult({ started_at: startedAt, finished_at: new Date().toISOString(),
    duration_ms: Date.now() - started, status: r.status, signal: r.signal,
    error_code: r.error?.code || null, error: r.error?.message || null,
    stdout: String(r.stdout || ''), stderr: String(r.stderr || '') });
  if (r.error || r.status !== 0) V.fail('VNEXT_LIVE_PROCESS_FAILED', bin + ': ' + (r.error?.message || r.stderr));
  return String(r.stdout);
}
function git(cwd, ...args) { return command('git', args, cwd); }
function relative(file) {
  if (typeof file !== 'string' || !file || file.includes('\\') || path.posix.isAbsolute(file)
      || /^[A-Za-z]:/.test(file) || file.split('/').some(p => !p || p === '.' || p === '..')) V.fail('VNEXT_LIVE_PATH_INVALID');
  return file;
}
function readGit(cwd, head, file) {
  V.assertSha40(head, 'VNEXT_LIVE_HEAD_INVALID');
  return git(cwd, 'show', head + ':' + relative(file));
}
function unitText(content, locator) {
  if (locator === 'FULL_FILE') return content;
  const m = /^L([1-9][0-9]*)-L([1-9][0-9]*)$/.exec(locator);
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  if (!m || +m[1] > +m[2] || +m[2] > lines.length) V.fail('VNEXT_SOURCE_UNIT_OBSERVATION_REQUIRED', locator);
  return lines.slice(+m[1] - 1, +m[2]).join('\n');
}
function observeSources(manifest, cwd, github = Auth.ghClient(), issueId = null) {
  Source.validate(manifest);
  return manifest.sources.map(source => {
    let content, figma;
    if (source.source_kind === 'GITHUB_COMMENT') {
      const m = /^github_issue_comment:([^#]+)#([1-9][0-9]*)$/.exec(source.locator);
      if (!m) V.fail('VNEXT_SOURCE_COMMENT_LOCATOR_INVALID');
      const comment = github.comment(m[1], m[2]);
      if (source.authority === 'DECISION') {
        const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(issueId || '');
        if (!issue || issue[1] !== m[1]) V.fail('VNEXT_DECISION_SOURCE_CONTEXT_REQUIRED');
        require('../verify-source-comment').verify(comment, { repository: issue[1], issue: issue[2], id: m[2], actor: issue[1].split('/')[0] });
      }
      if (String(comment.id) !== m[2] || comment.updated_at !== source.revision) V.fail('VNEXT_SOURCE_COMMENT_STALE');
      content = String(comment.body);
    } else {
      // External snapshots must first be frozen by their source adapter. They
      // are not silently attested by a path or a declarative VERIFIED flag.
      if (source.source_kind === 'OTHER') V.fail('WAIT_FOR_PROOF', source.locator);
      if (source.source_kind === 'FIGMA') {
        const observed=require('./vnext-figma-source').observe(source,{cwd,readGit});content=observed.content;figma=observed.packet;
      } else content = readGit(cwd, source.revision, source.locator);
    }
    if (V.sha256(content) !== source.fingerprint) V.fail('VNEXT_SOURCE_OBSERVATION_HASH_MISMATCH', source.locator);
    const figmaLook=figma?require('./vnext-figma-source').lookup(figma):null;
    for (const unit of source.units) if (V.sha256(figma ? require('./vnext-figma-source').unitText(figma,unit.locator,figmaLook) : unitText(content, unit.locator)) !== unit.fingerprint) V.fail('VNEXT_SOURCE_UNIT_OBSERVATION_MISMATCH', unit.unit_id);
    return { source_id: source.source_id, revision: source.revision, fingerprint: source.fingerprint, content };
  });
}

function observeCandidates(artifacts, cwd) {
  const ids = new Set([...artifacts.planContract.boundaries.write_scope, ...artifacts.planContract.boundaries.preserve_scope].map(r => r.candidate_id));
  return artifacts.candidateManifest.candidates.filter(c => ids.has(c.candidate_id)).map(c => ({
    candidate_id: c.candidate_id, path: c.path, revision: artifacts.candidateManifest.revision,
    content: c.origin === 'CREATE_SLOT_POLICY' ? null : readGit(cwd, artifacts.candidateManifest.revision, c.path),
  }));
}

// Recipe fields are constructor inputs, not pre-approved serialized contracts.
async function launchAndProduce(scope,{capture,reconcile,persist,buildRecipe,cwd,github}){
  if(typeof buildRecipe!=='function')V.fail('VNEXT_FIGMA_TECHNICAL_RECIPE_BUILDER_REQUIRED');
  const checkpoint=await require('./vnext-figma-launch').launch(scope,{capture,reconcile,persist});
  const recipe=await buildRecipe(structuredClone(checkpoint));
  recipe.figmaScope=scope;recipe.figmaLaunch=checkpoint;
  return produce(recipe,{cwd,github});
}
function produce(recipe, options = {}) {
  return Perf.measure('chain.produce', () => produceInternal(recipe, options));
}
function produceInternal(recipe, { cwd, github } = {}) {
  if(recipe.figmaScope&&!recipe.figmaLaunch)V.fail('VNEXT_FIGMA_LAUNCH_REQUIRED');
  if(recipe.figmaLaunch){
    require('./vnext-figma-launch').validate(recipe.figmaLaunch,recipe);
    if(V.canonicalHash(recipe.figmaScope)!==V.canonicalHash(recipe.figmaLaunch.scope))V.fail('VNEXT_FIGMA_LAUNCH_SCOPE_MISMATCH');
  }
  const sourceManifest = Source.build(recipe.sourceManifestInput);
  const sourceObservations = observeSources(sourceManifest, cwd, github, recipe.planningInput.issue_id);
  const figmaReferences=sourceManifest.sources.filter(s=>s.source_kind==='FIGMA').map(s=>({source_id:s.source_id,packet:require('./vnext-figma-source').snapshotPacket(sourceObservations.find(o=>o.source_id===s.source_id).content)}));
  if(figmaReferences.length&&!recipe.uiInput)V.fail('VNEXT_FIGMA_UI_MAPPING_REQUIRED');
  const planningEnvelope = Envelope.build({ ...recipe.planningInput, source_manifest: sourceManifest });
  if (recipe.deliveryCorrection && planningEnvelope.planning_mode !== 'REVISION') V.fail('VNEXT_DELIVERY_CORRECTION_REQUIRES_REVISION');
  const requirementRegistry = Requirements.build({ ...recipe.requirementInput,
    planning_envelope_hash: planningEnvelope.contract_hash, source_manifest: sourceManifest });
  Requirements.assertReady(requirementRegistry);
  if(figmaReferences.length)require('./vnext-figma-source').validateRegistry(figmaReferences,requirementRegistry);
  const candidateManifest = Impact.buildCandidateManifest({ cwd, revision: planningEnvelope.application_head, createSlots: recipe.createSlots || [] });
  const roots = [...new Set(recipe.classifications.filter(c => c.change_kind === 'MODIFY')
    .map(c => c.candidate_id))].filter(id => candidateManifest.candidates.some(c => c.candidate_id === id
      && c.origin === 'GIT_TREE' && c.candidate_kind === 'CODE' && /\.(?:js|jsx|ts|tsx|mjs|cjs)$/.test(c.path)));
  const directImportScan = roots.length ? Impact.scanOneLevelDirectImporters({ cwd, candidateManifest,
    modifyCandidateIds: roots }) : null;
  const impactGraph = Impact.buildImpactGraph({ requirementRegistry, candidateManifest, directImportScan, classifications: recipe.classifications });
  const deliveryPreservation = recipe.deliveryCorrection ? { baseline: require('./vnext-delivery-preservation').observe(recipe.deliveryCorrection.reference, {cwd, readGit, github: github || Auth.ghClient()}), replacements: recipe.deliveryCorrection.replacements } : null;
  const planContract = Plan.buildPlanContract({ requirementRegistry, candidateManifest, impactGraph, requirementPlans: recipe.requirementPlans, deliveryPreservation });
  const uiAtomicityContract = recipe.uiInput ? Ui.buildUiAtomicityContract({ ...recipe.uiInput,
    requirementRegistry, candidateManifest, impactGraph, planContract,figmaReferences }) : null;
  const artifacts = { planningEnvelope, requirementRegistry, candidateManifest, directImportScan,
    impactGraph, planContract, uiAtomicityContract, revisionArtifacts: recipe.revisionArtifacts || null,
    ...(planningEnvelope.created_from.kind === 'ACCEPTANCE_GAPS' ? {acceptanceBindings:recipe.deliveryCorrection?.bindings} : {}) };
  if (planningEnvelope.created_from.kind === 'ACCEPTANCE_GAPS') require('./vnext-post-acceptance').validateBindings(deliveryPreservation?.baseline, artifacts.acceptanceBindings, artifacts);
  const reviewContext = Review.buildReviewContext(artifacts);
  const producerRevision = git(cwd, 'rev-parse', 'HEAD').trim();
  const reviewerPacket = Review.buildReviewerPacket({ root: cwd, revision: producerRevision, reviewContext });
  return V.sealContract({ schema_version: 'kodjo.vnext.produced-chain.v1', producer_revision: producerRevision,
    ...(recipe.figmaLaunch?{figma_launch:recipe.figmaLaunch}:{}),
    artifacts: { ...artifacts, reviewContext }, source_observations: sourceObservations,
    candidate_observations: observeCandidates(artifacts, cwd),
    reviewer_packet: reviewerPacket, execution_context: recipe.executionContext,
    native_assessments: (recipe.nativeAssessments || []).map(row => ({ ...row, evidence_refs: [...row.evidence_refs].sort() })), register_input: recipe.registerInput });
}

function verifyProduced(produced, cwd, github) {
  V.verifyContractHash(produced, 'VNEXT_PRODUCED_CHAIN_HASH_INVALID');
  if (produced.schema_version !== 'kodjo.vnext.produced-chain.v1') V.fail('VNEXT_PRODUCED_CHAIN_SCHEMA_INVALID');
  const a = produced.artifacts;
  if(produced.figma_launch){
    const Launch=require('./vnext-figma-launch');Launch.validate(produced.figma_launch);
    const manifest=Source.build(produced.figma_launch.sourceManifestInput);
    if(V.canonicalHash(manifest)!==V.canonicalHash(a.planningEnvelope.source_manifest))V.fail('VNEXT_FIGMA_LAUNCH_SOURCES_MISMATCH');
    const registry=Requirements.build({...produced.figma_launch.requirementInput,planning_envelope_hash:a.planningEnvelope.contract_hash,source_manifest:manifest});
    if(V.canonicalHash(registry)!==V.canonicalHash(a.requirementRegistry))V.fail('VNEXT_FIGMA_LAUNCH_REQUIREMENTS_MISMATCH');
  }
  Envelope.validate(a.planningEnvelope);
  Requirements.validate(a.requirementRegistry, a.planningEnvelope.source_manifest);
  Impact.verifyCandidateManifestAtHead(a.candidateManifest, { cwd });
  if (a.directImportScan) Impact.verifyDirectImportScanAtHead(a.directImportScan, a.candidateManifest, { cwd });
  Impact.validateImpactGraph(a.impactGraph, a);
  Plan.validatePlanContract(a.planContract, a);
  if (a.planContract.delivery_preservation && a.planningEnvelope.planning_mode !== 'REVISION') V.fail('VNEXT_DELIVERY_CORRECTION_REQUIRES_REVISION');
  if (a.planContract.delivery_preservation) {
    const saved = a.planContract.delivery_preservation.baseline;
    const observed = require('./vnext-delivery-preservation').observe(saved.reference, {cwd, readGit, github: github || Auth.ghClient()});
    if (V.canonicalHash(saved) !== V.canonicalHash(observed)) V.fail('VNEXT_DELIVERY_BASELINE_STALE');
    const state = require('./vnext-delivery-preservation').state(saved);
    if (state.slice_id !== a.planningEnvelope.slice_id || state.head !== a.planningEnvelope.application_head || a.planningEnvelope.issue_id !== 'github_issue:' + saved.reference.repository + '#' + saved.reference.issue_number) V.fail('VNEXT_DELIVERY_BASELINE_APPLICATION_MISMATCH');
  }
  if (a.uiAtomicityContract) Ui.validateUiAtomicityContract(a.uiAtomicityContract, a);
  if (a.planningEnvelope.created_from.kind === 'ACCEPTANCE_GAPS') require('./vnext-post-acceptance').validateBindings(a.planContract.delivery_preservation?.baseline, a.acceptanceBindings, a);
  Review.verifyReviewContext(a.reviewContext, a);
  const packet = Review.buildReviewerPacket({ root: cwd, revision: produced.producer_revision, reviewContext: a.reviewContext });
  if (V.canonicalHash(packet) !== V.canonicalHash(produced.reviewer_packet)) V.fail('VNEXT_REVIEW_PRODUCER_PACKET_STALE');
  const observed = observeSources(a.planningEnvelope.source_manifest, cwd, github, a.planningEnvelope.issue_id);
  const refs=observed.filter(o=>a.planningEnvelope.source_manifest.sources.find(s=>s.source_id===o.source_id)?.source_kind==='FIGMA').map(o=>({source_id:o.source_id,packet:require('./vnext-figma-source').snapshotPacket(o.content)}));
  if(refs.length&&V.canonicalHash(refs)!==V.canonicalHash(a.uiAtomicityContract?.figma_references))V.fail('VNEXT_FIGMA_PLAN_REFERENCE_MISMATCH');
  if (V.canonicalHash(observed) !== V.canonicalHash(produced.source_observations)) V.fail('VNEXT_SOURCE_OBSERVATION_STALE');
  if (V.canonicalHash(observeCandidates(a, cwd)) !== V.canonicalHash(produced.candidate_observations)) V.fail('VNEXT_CANDIDATE_OBSERVATION_STALE');
  return a;
}

// Transport-only compaction. Immutable contracts and complete coverage stay exact.
function reviewTargets(context) {
  return Review.TARGET_TYPES.flatMap(type => context.target_catalog[type]);
}
function readGitObject(cwd, revision, file) {
  return Bundle.read(file, { readText: name => readGit(cwd, revision, name.replace(/\\/g, '/')) });
}

function compactReviewDossier(produced) {
  const a = produced.artifacts;
  const { candidates, ...manifest } = a.candidateManifest;
  // Columnar encoding retains every candidate field, including archive paths.
  const columns = Object.keys(candidates[0] || {});
  const uniform = candidates.every(row => V.canonicalHash(Object.keys(row).sort())
    === V.canonicalHash([...columns].sort()));
  const { target_catalog, ...context } = a.reviewContext;
  return {
    schema_version: 'kodjo.vnext.review-transport.v1',
    produced_chain_hash: produced.contract_hash,
    producer_revision: produced.producer_revision,
    artifacts: { ...a,...(a.uiAtomicityContract?.figma_references?.length && Bundle.boundedJson(a.uiAtomicityContract) !== null ? {uiAtomicityContract:require('./vnext-figma-source').packUi(a.uiAtomicityContract)} : {}), candidateManifest: { ...manifest,
      ...(uniform ? { columns, rows: candidates.map(row => columns.map(key => row[key])) } : { candidates }) },
      reviewContext: context },
    // One catalog, one consumer closure; schemas/inputs are supplied separately.
    target_catalog, target_catalog_hash: V.canonicalHash(reviewTargets(a.reviewContext)),
    target_index_order: Review.TARGET_TYPES,
    consumer_sources: produced.reviewer_packet.consumers,
    source_observations: produced.source_observations.map(o=>a.uiAtomicityContract?.figma_references?.some(r=>r.source_id===o.source_id)?{source_id:o.source_id,revision:o.revision,fingerprint:o.fingerprint,content_reference:'artifacts.uiAtomicityContract.figma_references'}:o),
    candidate_observations: produced.candidate_observations,
    native_assessment_subjects: produced.native_assessments.map(assessment => ({ assessment,
      assessment_hash: V.canonicalHash(assessment) })),
    execution_context: produced.execution_context, register_input: produced.register_input,
    reviewer_packet: { contract_hash: produced.reviewer_packet.contract_hash,
      source_revision: produced.reviewer_packet.source_revision, transport: produced.reviewer_packet.transport },
  };
}
function decodeReviewOutput(context, output) {
  // New receipts attest contiguous ranges; earlier durable receipts still decode unchanged.
  if (Object.hasOwn(output, 'reviewed_target_ranges')) {
    const {reviewed_target_ranges: ranges, ...rest} = output;
    if (Object.hasOwn(rest, 'reviewed_target_indices') || !Array.isArray(ranges)) V.fail('VNEXT_REVIEW_RANGE_INVALID');
    const size = reviewTargets(context).length;
    const indices = []; let last = -1;
    for (const range of ranges) {
      if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isSafeInteger)
          || range[0] < 0 || range[0] > range[1] || range[1] >= size || range[0] <= last) V.fail('VNEXT_REVIEW_RANGE_INVALID');
      for (let i = range[0]; i <= range[1]; i++) indices.push(i);
      last = range[1];
    }
    output = {...rest, reviewed_target_indices: indices};
  }
  if (!Object.hasOwn(output, 'reviewed_target_indices')) return output;
  V.assertExactKeys(output, ['findings', 'reviewed_target_indices', 'target_catalog_hash',
    'finding_resolutions'], context.acceptance_gaps ? ['acceptance_resolutions'] : [], 'VNEXT_REVIEW_INDEX_OUTPUT_KEYS_INVALID');
  const targets = reviewTargets(context), indices = output.reviewed_target_indices;
  if (output.target_catalog_hash !== V.canonicalHash(targets)) V.fail('VNEXT_REVIEW_INDEX_CATALOG_MISMATCH');
  if (!Array.isArray(indices) || indices.some(i => !Number.isSafeInteger(i) || i < 0 || i >= targets.length)
      || new Set(indices).size !== indices.length) V.fail('VNEXT_REVIEW_INDEX_INVALID');
  // The report builder still requires every exact target: an absent index fails.
  if (!Array.isArray(output.findings)) V.fail('VNEXT_REVIEW_FINDINGS_INVALID');
  const findings = output.findings.map(row => {
    if (!Object.hasOwn(row, 'dependency_target_indices')) return row; // sealed older responses
    if (Object.hasOwn(row, 'dependency_target_ids')) V.fail('VNEXT_REVIEW_DEPENDENCY_INDEX_AMBIGUOUS');
    const { dependency_target_indices: deps, ...finding } = row;
    if (!Array.isArray(deps) || deps.some(i => !Number.isSafeInteger(i) || i < 0 || i >= targets.length)
        || new Set(deps).size !== deps.length) V.fail('VNEXT_REVIEW_DEPENDENCY_INDEX_INVALID');
    const ids = deps.map(i => targets[i]);
    if (ids.includes(finding.target_id)) V.fail('VNEXT_REVIEW_FINDING_SELF_DEPENDENCY', finding.target_id);
    return { ...finding, dependency_target_ids: ids };
  });
  return { findings, finding_resolutions: output.finding_resolutions,
    ...(context.acceptance_gaps ? {acceptance_resolutions:output.acceptance_resolutions} : {}),
    reviewed_target_ids: indices.map(i => targets[i]) };
}
function boundedReviewOutput(text) {
  // Credentials are excluded from Claude's env; redact known inherited tokens
  // as well, without logging the environment or the full input dossier.
  for (const key of ['GH_TOKEN', 'GITHUB_TOKEN', 'KODJO_LIVE_GH_TOKEN', 'ANTHROPIC_API_KEY']) {
    if (process.env[key]) text = text.split(process.env[key]).join('[REDACTED]');
  }
  text = text.replace(/(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|sk-ant-[A-Za-z0-9_-]+)/g, '[REDACTED]');
  const bytes = Buffer.from(text), limit = 128 * 1024;
  return { bytes: bytes.length, sha256: V.sha256(text), truncated: bytes.length > limit,
    text: bytes.subarray(0, limit).toString('utf8').replace(/\uFFFD$/, '') };
}
function validateReviewResponse(produced, raw) {
  const artifacts = produced.artifacts;
  let result;
  try { result = JSON.parse(raw); } catch (_) { V.fail('VNEXT_REVIEW_OUTPUT_UNPARSEABLE'); }
  if (result.is_error || result.type !== 'result' || !result.session_id || !result.structured_output) V.fail('VNEXT_REVIEW_STRUCTURED_RESULT_REQUIRED');

  const report = Review.buildReviewReport({ reviewContext: artifacts.reviewContext, semanticReview: decodeReviewOutput(artifacts.reviewContext, result.structured_output.semantic_review) });
  const expectedResolutions = [...artifacts.planningEnvelope.causal_findings].sort();
  if (V.canonicalHash(report.finding_resolutions.map(row => row.finding_id).sort()) !== V.canonicalHash(expectedResolutions)) V.fail('VNEXT_REVIEW_CAUSAL_RESOLUTION_COVERAGE');

  return V.sealContract({ schema_version: 'kodjo.vnext.live-review-receipt.v1', produced_chain_hash: produced.contract_hash,
    reviewer_packet_hash: produced.reviewer_packet.contract_hash, review_report: report,
    session_id: result.session_id, raw_result: raw, raw_result_sha256: V.sha256(raw),
    native_observations: result.structured_output.native_assessment_observations });
}
function responsePath(produced, directory) {
  return path.join(directory, produced.artifacts.planningEnvelope.planning_mode.toLowerCase() + '-review-response.json');
}
function recoverReview(produced, { cwd, github, evidenceDirectory } = {}) {
  verifyProduced(produced, cwd, github);
  const rel = evidenceDirectory && path.relative(cwd, path.resolve(evidenceDirectory));
  if (!rel || (!rel.startsWith('..' + path.sep) && !path.isAbsolute(rel))) V.fail('VNEXT_REVIEW_EVIDENCE_OUTSIDE_CHECKOUT_REQUIRED');
  const saved = JSON.parse(fs.readFileSync(responsePath(produced, evidenceDirectory), 'utf8'));
  V.verifyContractHash(saved, 'VNEXT_REVIEW_RESPONSE_HASH_INVALID');
  if (saved.schema_version !== 'kodjo.vnext.review-response.v1' || saved.produced_chain_hash !== produced.contract_hash || saved.reviewer_packet_hash !== produced.reviewer_packet.contract_hash
      || V.sha256(saved.stdout) !== saved.stdout_sha256) V.fail('VNEXT_REVIEW_RESPONSE_BINDING_MISMATCH');
  if (saved.process_result.status !== 0 || saved.process_result.signal || saved.process_result.error_code) V.fail('VNEXT_REVIEW_RESPONSE_PROCESS_INCOMPLETE');
  // Strict revalidation only. No text repair, model invocation, or publication.
  const diagnostic = { produced_chain_hash: produced.contract_hash, response_hash: saved.contract_hash,
    model_invoked: false, review_accepted: false, observed_at: new Date().toISOString() };
  const record = () => fs.writeFileSync(path.join(evidenceDirectory,
    produced.artifacts.planningEnvelope.planning_mode.toLowerCase() + '-review-revalidation.json'), JSON.stringify(diagnostic, null, 2) + '\n');
  let receipt;
  try { receipt = validateReviewResponse(produced, saved.stdout); }
  catch (error) { diagnostic.error = boundedReviewOutput(error.message).text; preserveFailure(error, record); throw error; }
  diagnostic.review_accepted = true; diagnostic.session_id = receipt.session_id; record();
  return receipt;
}
function reviewOrRecover(produced, options) {
  return options.evidenceDirectory && fs.existsSync(responsePath(produced, options.evidenceDirectory))
    ? recoverReview(produced, options) : review(produced, options);
}
function preserveFailure(error, record) {
  try { record(); } catch (secondary) {
    error.primary_error ||= error.message;
    if (error.archive_error !== secondary.message) error.message += '; VNEXT_EVIDENCE_ARCHIVE_FAILED: ' + secondary.message;
    error.archive_error = secondary.message;
  }
  return error;
}

function materializeReviewDossier(dossier, produced, directory, causalEvidence = null) {
  const large = Bundle.boundedJson(produced.artifacts) === null;
  const canonical = large ? produced.artifacts : structuredClone(dossier.artifacts);
  const manifest = canonical.candidateManifest;
  if (!large && manifest.rows) {
    manifest.candidates = manifest.rows.map(row => Object.fromEntries(manifest.columns.map((key, i) => [key, row[i]])));
    delete manifest.columns; delete manifest.rows;
  }
  if (!large) canonical.reviewContext.target_catalog = dossier.target_catalog;
  if (!large && canonical.uiAtomicityContract?.figma_references?.length)
    canonical.uiAtomicityContract = require('./vnext-figma-source').unpackUi(canonical.uiAtomicityContract);
  if (V.canonicalHash(canonical) !== V.canonicalHash(produced.artifacts)) V.fail('VNEXT_REVIEW_CANONICAL_RECONSTRUCTION_MISMATCH');
  const file = path.join(directory, 'canonical-artifacts.json');
  if (large) Bundle.write(file, canonical, { exclusive: true, forceBundle: true });
  else fs.writeFileSync(file, JSON.stringify(canonical), { flag: 'wx' });
  dossier.canonical_observation = { path: file, sha256: V.sha256(fs.readFileSync(file)),
    ...(large ? { format: Bundle.SCHEMA, logical_sha256: V.canonicalHash(canonical) } : {}),
    reconstruction_verified: true, artifact_hashes: Object.fromEntries(Object.entries(canonical)
      .filter(([, value]) => value?.contract_hash).map(([key, value]) => [key, value.contract_hash])),
    semantic_use: 'NOT_ATTESTED_BY_BYTE_OBSERVATION' };
  const consumers = path.join(directory, 'consumers'); fs.mkdirSync(consumers);
  dossier.consumer_sources = dossier.consumer_sources.map((consumer, index) => {
    if (V.sha256(consumer.source) !== consumer.source_hash) V.fail('VNEXT_REVIEW_CONSUMER_SOURCE_MISMATCH');
    const sourcePath = path.join(consumers, index + '.js');
    fs.writeFileSync(sourcePath, consumer.source, { flag: 'wx' });
    if (V.sha256(fs.readFileSync(sourcePath)) !== consumer.source_hash) V.fail('VNEXT_REVIEW_CONSUMER_MATERIALIZATION_MISMATCH');
    return { path: consumer.path, source_hash: consumer.source_hash, source_path: sourcePath };
  });
  if (causalEvidence) {
    const evidenceDirectory = path.join(directory, 'causal-revision');
    fs.mkdirSync(evidenceDirectory);
    dossier.causal_revision_evidence = Object.fromEntries([
      ['base_plan', causalEvidence.base_plan],
      ['previous_review_report', causalEvidence.previous_review_report],
      ['allowed_change_set', causalEvidence.allowed_change_set],
      ['revision_patch', causalEvidence.revision_patch],
    ].map(([name, value]) => {
      const evidencePath = path.join(evidenceDirectory, name + '.json');
      Bundle.write(evidencePath, value, { exclusive: true });
      return [name, { path: evidencePath, contract_hash: value.contract_hash }];
    }));
  }
  if (large) {
    // Claude gets a bounded navigation dossier; every complete field is stored
    // and hash-bound, never omitted or treated as semantically reviewed.
    for (const [key, value] of Object.entries(dossier)) {
      if (Bundle.boundedJson(value) !== null) continue;
      const fieldFile = path.join(directory, key + '.json');
      Bundle.write(fieldFile, value, { exclusive: true, forceBundle: true });
      dossier[key] = { format: Bundle.SCHEMA, path: fieldFile, logical_sha256: V.canonicalHash(value) };
    }
    dossier.instructions += ' Les grands champs sont des references file-bundle : lire le manifeste puis ses fichiers JSON de 8 MiB maximum, et reconstruire logiquement les champs object/array/concat/string. Les empreintes verifient les octets, pas la revue semantique. Ne declarer aucune cible examinee sans consultation effective. Si la consultation complete est impossible, le signaler et ne pas approuver.';
  }
  return dossier;
}
function review(produced, { cwd, claude = require('./claude-local').resolveClaudeBinary(), github, invoke = require('./vnext-review-process').command, evidenceDirectory, causalEvidence = null } = {}) {
  const artifacts = verifyProduced(produced, cwd, github);
  const schema = { type: 'object', additionalProperties: false, required: ['semantic_review', 'native_assessment_observations'],
    properties: { semantic_review: Review.reviewerOutputSchema(artifacts.reviewContext),
      native_assessment_observations: { type: 'array', items: { type: 'object', additionalProperties: false,
        required: ['criterion_id', 'assessment_hash', 'verified', 'observed_git_evidence', 'reason'], properties: {
          criterion_id: { type: 'string' }, assessment_hash: { type: 'string' }, verified: { type: 'boolean' },
          observed_git_evidence: { type: 'array', items: { type: 'object', additionalProperties: false,
            required: ['path', 'revision', 'content_sha256'], properties: { path: { type: 'string' }, revision: { type: 'string' }, content_sha256: { type: 'string' } } } },
          reason: { type: 'string' } } } } } };
  // Windows limits the process command line. The full target catalog belongs
  // on stdin with the dossier, not in --json-schema. The transport schema uses
  // indexed coverage and omits unbounded enums; buildReviewReport still checks every
  // target and dependency against the exact immutable review context.
  const transportSchema = JSON.parse(JSON.stringify(schema));
  const findingProperties = transportSchema.properties.semantic_review.properties.findings.items.properties;
  delete findingProperties.target_id.enum;
  delete findingProperties.dependency_target_ids.items.enum;
  delete findingProperties.dependency_target_ids;
  findingProperties.dependency_target_indices = { type: 'array', uniqueItems: true,
    description: 'Other affected targets only. Exclude the index whose catalog ID equals this finding target_id. Use [] when no other target is affected. The finding target is already covered by target_id.',
    items: { type: 'integer', minimum: 0, maximum: reviewTargets(artifacts.reviewContext).length - 1 } };
  transportSchema.properties.semantic_review.properties.findings.items.required =
    transportSchema.properties.semantic_review.properties.findings.items.required.map(key => key === 'dependency_target_ids' ? 'dependency_target_indices' : key);
  const output = transportSchema.properties.semantic_review;
  delete output.properties.reviewed_target_ids;
  output.required = ['findings', 'reviewed_target_ranges', 'target_catalog_hash', 'finding_resolutions', ...(artifacts.reviewContext.acceptance_gaps ? ['acceptance_resolutions'] : [])];
  output.properties.reviewed_target_ranges = { type: 'array', items: {type:'array',minItems:2,maxItems:2,items:{type:'integer',minimum:0}} };
  output.properties.target_catalog_hash = { type: 'string', pattern: '^[0-9a-f]{64}$' };
  const dossier = { ...compactReviewDossier(produced), instructions: 'Revue indépendante de plan uniquement. Lire les objets Git exacts. Ne pas modifier le dépôt. Refuser une preuve non observée. Pour chaque assessment natif, vérifier le besoin fonctionnel, le choix natif et ses preuves effectives ; ne pas confondre référence et observation. Indiquer verified=false si la preuve ne peut être observée. Examiner toutes les cibles du target_catalog, pas seulement celles portant un finding. En REVISION, fournir finding_resolutions pour chaque causal_finding_id, avec statut OPEN ou RESOLVED, references de preuves observees et explication; ne pas conclure RESOLVED sans observation du correctif. Ceci ne constitue pas un audit FINAL. Le catalogue complet est conserve : construire les indices a partir de target_index_order puis des tableaux de target_catalog, base zero. Restituer reviewed_target_ranges, plages inclusives [debut,fin] triees sans chevauchement, uniquement pour les cibles effectivement examinees et recopier target_catalog_hash exact. Les cibles essentielles sont requises. coverage_policy autorise au plus 3 omissions secondaires et 2 pour cent du catalogue ; ne jamais attester une cible non examinee. Les omissions restent explicites dans le rapport. candidateManifest.columns et rows encodent sans perte les objets candidats. Avant de verifier les empreintes canoniques, reconstruire candidateManifest.candidates depuis columns/rows et reviewContext.target_catalog depuis target_catalog ; cette projection de transport ne remplace pas les contrats canoniques. Les sources de consommateurs sont disponibles une seule fois dans consumer_sources. Si une intention contredit une obligation TEST correcte, identifier le change_id de cette intention dans required_correction et le PLAN_ITEM dans dependency_target_ids ; ne pas demander de modifier une obligation correcte.' };
  if (artifacts.reviewContext.acceptance_gaps) dossier.instructions += ' Pour une révision après recette, les acceptance_gaps sont des écarts utilisateur authentifiés, pas des findings Claude. Fournir acceptance_resolutions pour chaque gap_id avec preuves observées et note causale. La revue de plan initiale APPROVE reste inchangée ; ne pas inventer de REVISE. Le format structuré demandé est obligatoire.';
  dossier.instructions += ' Pour chaque finding, utiliser dependency_target_indices : indices entiers zero-based du meme catalogue scelle. Ne jamais employer un nom de type tel que PLAN_CONTRACT comme identifiant de cible. Le decodeur reconstruit les identifiants exacts et les controles canoniques restent obligatoires.';
  dossier.instructions += ' AUTODEPENDANCE INTERDITE : target_id designe deja la cible du constat. dependency_target_indices designe exclusivement les AUTRES cibles affectees. Rechercher l’indice de target_id dans le catalogue et l’exclure de cette liste ; si aucune autre cible n’est affectee, retourner []. Avant de rendre chaque finding, verifier que chaque indice de dependance se decode en un identifiant different de target_id. Ne pas confondre cette liste avec reviewed_target_ranges, qui couvre les cibles effectivement examinees. Une reponse contenant sa propre cible sera refusee, jamais corrigee silencieusement.';
  dossier.finding_category_targets = Review.CATEGORY_TARGETS;
  dossier.instructions += ' Pour chaque finding, choisir target_type dans finding_category_targets[category], puis target_id dans target_catalog[target_type]. Une alerte de preservation doit cibler le PLAN_ITEM, IMPACT ou CANDIDATE affecte ; PLAN_CONTRACT peut etre cite comme preuve ou dependance mais pas comme cible de PRESERVATION_RISK. Ne jamais changer le fond d’une alerte pour obtenir une approbation.';
  const checkoutSnapshot = () => V.canonicalHash({
    status: git(cwd, 'status', '--porcelain=v1', '-z'), diff: git(cwd, 'diff', 'HEAD', '--binary'),
    untracked: git(cwd, 'ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)
      .map(file => ({ file, hash: V.sha256(fs.readFileSync(path.join(cwd, file))) })),
  });
  const before = checkoutSnapshot();
  const env = { ...process.env };
  for (const key of ['GH_TOKEN', 'GITHUB_TOKEN', 'KODJO_LIVE_GH_TOKEN']) delete env[key];
  if (evidenceDirectory) {
    const rel = path.relative(cwd, path.resolve(evidenceDirectory));
    if (!rel || (!rel.startsWith('..' + path.sep) && !path.isAbsolute(rel))) V.fail('VNEXT_REVIEW_EVIDENCE_OUTSIDE_CHECKOUT_REQUIRED');
    fs.mkdirSync(evidenceDirectory, { recursive: true });
  }
  if (evidenceDirectory && fs.existsSync(responsePath(produced, evidenceDirectory))) V.fail('VNEXT_REVIEW_RESPONSE_EXISTS_USE_RECOVERY');
  const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-vnext-review-'));
  try { materializeReviewDossier(dossier, produced, configDir, causalEvidence); }
  catch (error) { fs.rmSync(configDir, { recursive: true, force: true }); throw error; }
  dossier.instructions = dossier.instructions.replace('Avant de verifier les empreintes canoniques, reconstruire candidateManifest.candidates depuis columns/rows et reviewContext.target_catalog depuis target_catalog ; cette projection de transport ne remplace pas les contrats canoniques.',
    'Le controleur a reconstruit et verifie les objets canoniques avant cet appel ; canonical_observation indique le fichier exact et les empreintes verifiees. Lire ce fichier selon les besoins de la revue ; aucun calcul de hash ni execution de code ne vous est demande. La projection de transport ne remplace pas les contrats canoniques.');
  dossier.instructions += ' Les sources exactes des consommateurs sont disponibles dans consumer_sources[].source_path, avec leur chemin Git et empreinte verifies. Utiliser Read pour les consulter ; ne pas executer les consommateurs.';
  if (causalEvidence) dossier.instructions += ' Pour cette REVISION, lire les quatre fichiers de causal_revision_evidence aux chemins absolus indiques : base_plan, previous_review_report, allowed_change_set et revision_patch. previous_review_report contient le texte exact de chaque constat anterieur ; revision_patch contient la correction autorisee. Comparer ces preuves au plan revise du dossier canonique pour renseigner finding_resolutions. Ne pas deviner le sens d’un finding_id ni chercher ces preuves par un identifiant de session Claude. Il s’agit de preuves de revision du plan, pas d’un resultat de developpement ni d’une resolution deja approuvee.';
  fs.writeFileSync(path.join(configDir, 'mcp.json'), JSON.stringify({ mcpServers: {} }));
  fs.writeFileSync(path.join(configDir, 'settings.json'), JSON.stringify({ disableAllHooks: true }));
  if(artifacts.uiAtomicityContract?.figma_references?.length){
    const directory=path.join(configDir,'figma');fs.mkdirSync(directory);
    const observation=require('./vnext-figma-source').consumeArtifacts(artifacts.uiAtomicityContract,artifacts.requirementRegistry,directory,'PLANNER'),manifest=path.join(directory,'observation.json');Bundle.write(manifest,observation);
    dossier.figma_consumer_observation={stage:'PLANNER',manifest,contract_hash:observation.contract_hash,references:observation.references.map(r=>({source_id:r.source_id,reference_hash:r.reference_hash,assets:r.assets}))};
    dossier.instructions+=' Les ressources Figma sont materialisees dans figma_consumer_observation.references[].assets ; ouvrir les captures PNG avec Read et lire le manifeste des proprietes et les SVG exacts. Le controleur a deja execute unpackUi et verifie la reconstruction canonique Figma ; aucun appel de fonction ne vous est demande. Un octet transporte n’est pas une preuve de consultation ni de conformite. Signaler toute ressource inaccessible comme finding ; ne pas approuver par simple reference au composant reutilise.';
  }
  const input = JSON.stringify(dossier), timeoutMs = CLAUDE_TIMEOUT_MS;
  const diagnostic = { schema_version: 'kodjo.vnext.review-process-diagnostic.v1',
    produced_chain_hash: produced.contract_hash, review_context_hash: artifacts.reviewContext.contract_hash,
    planning_mode: artifacts.planningEnvelope.planning_mode, timeout_ms: timeoutMs,
    input_bytes: Buffer.byteLength(input), input_sha256: V.sha256(input),
    target_count: reviewTargets(artifacts.reviewContext).length, started_at: new Date().toISOString(),
    invocation_completed: false, review_accepted: false };
  const diagnosticPath = evidenceDirectory && path.join(evidenceDirectory,
    artifacts.planningEnvelope.planning_mode.toLowerCase() + '-review-process.json');
  const saveDiagnostic = () => { if (diagnosticPath) fs.writeFileSync(diagnosticPath, JSON.stringify(diagnostic, null, 2) + '\n'); };
  // A revised plan also requires causal resolution evidence. Keep its review
  // bounded at 15 minutes; initial reviews and other commands retain 10.
  let raw, primaryError, archiveError;
  const archive = action => { try { action(); } catch (error) { archiveError ||= error; } };
  const saveResponse = (stdout, stderr = '', processResult = { status: 0, signal: null, error_code: null }) => {
    if (evidenceDirectory) fs.writeFileSync(responsePath(produced, evidenceDirectory), JSON.stringify(V.sealContract({
      schema_version: 'kodjo.vnext.review-response.v1', produced_chain_hash: produced.contract_hash,
      reviewer_packet_hash: produced.reviewer_packet.contract_hash, process_result: processResult, stdout, stderr, stdout_sha256: V.sha256(stdout)
    }), null, 2) + '\n', { flag: 'wx' });
  };
  try {
    saveDiagnostic();
    raw = invoke(claude, ['--add-dir', configDir, '-p', '--restricted', '--permission-mode', 'dontAsk', '--permission-prompts', 'none',
      '--output-format', 'stream-json', '--verbose', '--tools', 'Read,Glob,Grep', '--allowedTools', 'Read,Glob,Grep',
      '--disallowedTools', 'mcp__*', '--strict-mcp-config', '--mcp-config', path.join(configDir, 'mcp.json'),
      '--settings', path.join(configDir, 'settings.json'), '--json-schema', JSON.stringify(transportSchema)], cwd, input, env, timeoutMs, { onResult: result => {
        const { stdout, stderr, ...metadata } = result;
        archive(() => saveResponse(stdout, stderr, metadata));
        Object.assign(diagnostic, metadata, { invocation_completed: true,
          stdout: boundedReviewOutput(stdout), stderr: boundedReviewOutput(stderr) });
        archive(saveDiagnostic);
      }, progressPath: evidenceDirectory && path.join(evidenceDirectory,
        artifacts.planningEnvelope.planning_mode.toLowerCase() + '-review-progress.json') });
    if (evidenceDirectory && !fs.existsSync(responsePath(produced, evidenceDirectory))) archive(() => saveResponse(raw));
    diagnostic.stdout = boundedReviewOutput(raw);
    const receipt = validateReviewResponse(produced, raw);
    if (archiveError) throw archiveError;
    diagnostic.session_id = receipt.session_id; diagnostic.review_accepted = true;
    return receipt;
  } catch (error) {
    primaryError = error;
    if (archiveError && archiveError !== error) preserveFailure(error, () => { throw archiveError; });
    diagnostic.error = boundedReviewOutput(error.message).text;
    throw error;
  } finally {
    const finish = () => {
      diagnostic.finished_at ||= new Date().toISOString();
      diagnostic.duration_ms ??= Date.parse(diagnostic.finished_at) - Date.parse(diagnostic.started_at);
      diagnostic.checkout_unchanged = checkoutSnapshot() === before;
      saveDiagnostic();
      if (!diagnostic.checkout_unchanged) V.fail('VNEXT_REVIEW_MUTATED_CHECKOUT');
    };
    try { if (primaryError) preserveFailure(primaryError, finish); else finish(); }
    finally {
      const cleanup = () => fs.rmSync(configDir, { recursive: true, force: true });
      if (primaryError) preserveFailure(primaryError, cleanup); else cleanup();
    }
  }
}

function verifyReceipt(produced, receipt) {
  V.verifyContractHash(receipt, 'VNEXT_REVIEW_RECEIPT_HASH_INVALID');
  if (receipt.schema_version !== 'kodjo.vnext.live-review-receipt.v1'
      || receipt.produced_chain_hash !== produced.contract_hash || receipt.reviewer_packet_hash !== produced.reviewer_packet.contract_hash
      || V.sha256(receipt.raw_result) !== receipt.raw_result_sha256) V.fail('VNEXT_REVIEW_RECEIPT_BINDING_MISMATCH');
  const raw = JSON.parse(receipt.raw_result);
  if (raw.is_error || raw.type !== 'result' || raw.session_id !== receipt.session_id || !raw.structured_output) V.fail('VNEXT_REVIEW_RECEIPT_RESULT_INVALID');
  const report = Review.buildReviewReport({ reviewContext: produced.artifacts.reviewContext, semanticReview: decodeReviewOutput(produced.artifacts.reviewContext, raw.structured_output.semantic_review) });
  if (V.canonicalHash(report.finding_resolutions.map(row => row.finding_id).sort())
      !== V.canonicalHash([...produced.artifacts.planningEnvelope.causal_findings].sort())) V.fail('VNEXT_REVIEW_CAUSAL_RESOLUTION_COVERAGE');
  if (V.canonicalHash(report) !== V.canonicalHash(receipt.review_report)
      || V.canonicalHash(raw.structured_output.native_assessment_observations) !== V.canonicalHash(receipt.native_observations)) V.fail('VNEXT_REVIEW_RECEIPT_RESULT_MISMATCH');
  return report;
}
function validateReceipt(produced, receipt) {
  const report = verifyReceipt(produced, receipt);
  if (report.verdict !== 'APPROVE') V.fail('VNEXT_LIVE_REVIEW_NOT_APPROVED', report.verdict);
}

function postAcceptanceEvidence(prepared, artifacts, cwd, github) {
  const e=prepared.revision_evidence;
  V.assertExactKeys(e,['origin','base_produced','base_review_receipt','outcome'],[],'VNEXT_ACCEPTANCE_EVIDENCE_KEYS_INVALID');
  if(e.origin!=='POST_ACCEPTANCE'||artifacts.revisionArtifacts!==null)V.fail('VNEXT_ACCEPTANCE_EVIDENCE_ORIGIN_INVALID');
  const base=verifyProduced(e.base_produced,cwd,github),previousReport=verifyReceipt(e.base_produced,e.base_review_receipt);
  if(previousReport.verdict!=='APPROVE')V.fail('VNEXT_ACCEPTANCE_BASE_PLAN_NOT_APPROVED');
  const baseline=artifacts.planContract.delivery_preservation.baseline;
  if(baseline.acceptance.base_plan_hash!==base.planContract.contract_hash || baseline.acceptance.base_review_hash!==previousReport.contract_hash)V.fail('VNEXT_ACCEPTANCE_PRIOR_PLAN_REVIEW_MISMATCH');
  let priorPlan=Adapter.renderCompatibilityPlan({application_head:base.planningEnvelope.application_head,plan_contract_hash:base.planContract.contract_hash},base.planContract,base.uiAtomicityContract,base.requirementRegistry,base.candidateManifest,{context:base.reviewContext,report:previousReport});
  // Historical approved blobs precede coverage transport. Match their exact
  // projection; never rewrite an approved plan or call missing coverage complete.
  if(Adapter.gitBlobOid(priorPlan)!==baseline.plan_blob_oid) priorPlan=Adapter.renderCompatibilityPlan({application_head:base.planningEnvelope.application_head,plan_contract_hash:base.planContract.contract_hash},base.planContract,base.uiAtomicityContract,base.requirementRegistry,base.candidateManifest);
  if(Adapter.gitBlobOid(priorPlan)!==baseline.plan_blob_oid)V.fail('VNEXT_ACCEPTANCE_PRIOR_PLAN_BYTES_MISMATCH');
  const baseRegister=Register.buildRegister({...e.base_produced.register_input,candidateHead:e.base_produced.producer_revision,lot:base.planningEnvelope.slice_id,phase:'REVIEW'});
  if(V.canonicalHash(prepared.produced.register_input.previous)!==V.canonicalHash(baseRegister))V.fail('VNEXT_ACCEPTANCE_PREVIOUS_REGISTER_MISMATCH');
  const nextRegister=Register.buildRegister({...prepared.produced.register_input,candidateHead:prepared.produced.producer_revision,lot:artifacts.planningEnvelope.slice_id,phase:'REVISION'});
  const outcome=require('./vnext-post-acceptance').buildOutcome({baseline,bindings:artifacts.acceptanceBindings,artifacts,reviewReport:prepared.review_receipt.review_report,baseRegister,cumulativeRegister:nextRegister});
  if(V.canonicalHash(outcome)!==V.canonicalHash(e.outcome))V.fail('VNEXT_ACCEPTANCE_OUTCOME_MISMATCH');
  return {...artifacts,revisionArtifacts:{origin:'POST_ACCEPTANCE',base_register:baseRegister,outcome}};
}

function revisionEvidenceArtifacts(prepared, artifacts, cwd, github) {
  const evidence = prepared.revision_evidence;
  if (artifacts.planningEnvelope.planning_mode === 'INITIAL') {
    if (evidence) V.fail('VNEXT_LIVE_INITIAL_REVISION_EVIDENCE_FORBIDDEN');
    return artifacts;
  }
  if (!evidence) V.fail('VNEXT_LIVE_REVISION_EVIDENCE_REQUIRED');
  if (artifacts.planningEnvelope.created_from.kind === 'ACCEPTANCE_GAPS') return postAcceptanceEvidence(prepared, artifacts, cwd, github);
  V.assertExactKeys(evidence, ['base_produced', 'base_review_receipt', 'revision_artifacts'], [], 'VNEXT_LIVE_REVISION_EVIDENCE_KEYS_INVALID');
  const base = verifyProduced(evidence.base_produced, cwd, github);
  const previousReport = verifyReceipt(evidence.base_produced, evidence.base_review_receipt);
  if (previousReport.verdict !== 'REVISE' || base.planningEnvelope.planning_mode !== 'INITIAL') V.fail('VNEXT_LIVE_REVISION_BASE_NOT_REVISE');
  // The later outcome is separate from the immutable bytes actually reviewed.
  if (artifacts.revisionArtifacts !== null) V.fail('VNEXT_LIVE_REVIEWED_OUTCOME_MUST_BE_SEPARATE');
  const bundle = evidence.revision_artifacts;
  V.assertExactKeys(bundle, ['base_artifacts', 'allowed_change_set', 'revision_patch', 'revision_outcome', 'previous_review_report', 'finding_ledger'], [], 'VNEXT_LIVE_REVISION_ARTIFACT_KEYS_INVALID');
  const previous = Register.buildRegister({ ...evidence.base_produced.register_input,
    candidateHead: evidence.base_produced.producer_revision, lot: base.planningEnvelope.slice_id, phase: 'REVIEW' });
  const exact = (x, y, code) => { if (V.canonicalHash(x) !== V.canonicalHash(y)) V.fail(code); };
  exact(bundle.base_artifacts, { ...base, cumulativeRegister: previous }, 'VNEXT_LIVE_REVISION_BASE_ARTIFACTS_MISMATCH');
  exact(bundle.previous_review_report, previousReport, 'VNEXT_LIVE_REVISION_BASE_REVIEW_MISMATCH');
  exact(prepared.produced.register_input.previous, previous, 'VNEXT_LIVE_REVISION_PREVIOUS_REGISTER_MISMATCH');
  const nextRegister = Register.buildRegister({ ...prepared.produced.register_input,
    candidateHead: prepared.produced.producer_revision, lot: artifacts.planningEnvelope.slice_id, phase: 'REVISION' });
  if (nextRegister.revision_count !== previous.revision_count + 1 || nextRegister.revision_count > nextRegister.revision_limit) V.fail('VNEXT_LIVE_REVISION_BOUND_INVALID');
  const allowed = Revision.buildAllowedChangeSet({ ...base, reviewReport: previousReport });
  exact(bundle.allowed_change_set, allowed, 'VNEXT_LIVE_REVISION_ALLOWED_SET_MISMATCH');
  const outcome = Revision.verifyRevisionOutcome({ allowedChangeSet: allowed, revisionPatch: bundle.revision_patch,
    baseArtifacts: bundle.base_artifacts, nextArtifacts: { ...artifacts, cumulativeRegister: nextRegister },
    nextReviewContext: artifacts.reviewContext, nextReviewReport: prepared.review_receipt.review_report });
  exact(bundle.revision_outcome, outcome, 'VNEXT_LIVE_REVISION_OUTCOME_MISMATCH');
  if (outcome.status !== 'RESOLVED') V.fail('VNEXT_LIVE_REVISION_NOT_RESOLVED');
  const envelope = artifacts.planningEnvelope;
  if (envelope.base_plan_hash !== base.planContract.contract_hash || envelope.base_review_hash !== previousReport.contract_hash) V.fail('VNEXT_LIVE_REVISION_CAUSAL_BASE_MISMATCH');
  exact([...envelope.causal_findings].sort(), [...allowed.blocking_finding_ids].sort(), 'VNEXT_LIVE_REVISION_CAUSAL_FINDINGS_MISMATCH');
  Convergence.validateFindingLedger(bundle.finding_ledger, previousReport, prepared.review_receipt.review_report);
  return { ...artifacts, revisionArtifacts: bundle };
}

function nativeResolver(produced, receipt, cwd) {
  return (assessment, { sourceManifest, applicationHead }) => {
    const rows = receipt.native_observations.filter(x => x.criterion_id === assessment.criterion_id);
    if (rows.length !== 1 || rows[0].verified !== true || rows[0].assessment_hash !== V.canonicalHash(assessment)
        || !rows[0].reason || !rows[0].observed_git_evidence?.length) V.fail('WAIT_FOR_PROOF', assessment.criterion_id);
    for (const evidence of rows[0].observed_git_evidence) {
      if (evidence.revision !== applicationHead && !sourceManifest.sources.some(s => s.revision === evidence.revision)) V.fail('VNEXT_NATIVE_OBSERVATION_REVISION_MISMATCH');
      if (V.sha256(readGit(cwd, evidence.revision, evidence.path)) !== evidence.content_sha256) V.fail('VNEXT_NATIVE_OBSERVATION_BYTES_MISMATCH');
    }
    return V.sealContract({ schema_version: 'kodjo.vnext.native-assessment-evidence.v1', status: 'VERIFIED',
      native_assessment_hash: V.canonicalHash(assessment), source_manifest_hash: sourceManifest.contract_hash,
      application_head: applicationHead, evidence_ref: 'claude_session:' + receipt.session_id + '#' + receipt.contract_hash });
  };
}

function preparedArtifacts(prepared, cwd, protocolHead, github) {
  V.verifyContractHash(prepared, 'VNEXT_PREPARED_CHAIN_HASH_INVALID');
  V.assertExactKeys(prepared, ['schema_version', 'produced', 'review_receipt', 'contract_hash'], ['revision_evidence'], 'VNEXT_PREPARED_CHAIN_KEYS_INVALID');
  if (prepared.schema_version !== SCHEMA) V.fail('VNEXT_PREPARED_CHAIN_SCHEMA_INVALID');
  const observed = verifyProduced(prepared.produced, cwd, github);
  validateReceipt(prepared.produced, prepared.review_receipt);
  const a = revisionEvidenceArtifacts(prepared, observed, cwd, github);
  const state = { product_head: a.planningEnvelope.product_head, application_head: a.planningEnvelope.application_head,
    protocol_head: protocolHead, execution_context: prepared.produced.execution_context,
    native_primitive_decisions: prepared.produced.native_assessments };
  const context = require('./vnext-preserved-controls').validateExecutionContext(state.execution_context);
  if (context.delivery_target) {
    const target = context.delivery_target;
    if (target.application_head !== state.application_head) V.fail('VNEXT_DELIVERY_APPLICATION_HEAD_MISMATCH');
    const repository = /^github_issue:([^#]+)#[1-9][0-9]*$/.exec(a.planningEnvelope.issue_id)?.[1];
    const api = github || Auth.ghClient();
    if (typeof api.pullRequest !== 'function') V.fail('VNEXT_DELIVERY_LIVE_OBSERVATION_REQUIRED');
    const pr = api.pullRequest(repository, target.application_pr);
    if (pr.number !== target.application_pr || pr.state !== 'open' || pr.base?.ref !== 'main'
        || pr.base?.repo?.full_name !== repository || pr.head?.repo?.full_name !== repository
        || pr.head?.sha !== target.application_head || pr.head?.ref !== target.branch) V.fail('VNEXT_DELIVERY_TARGET_STALE');
  }
  const resolveNativeEvidence = nativeResolver(prepared.produced, prepared.review_receipt, cwd);
  return { ...a, cwd, reviewReport: prepared.review_receipt.review_report, currentState: state, resolveNativeEvidence };
}

function prepare(produced, receipt, transport, { cwd, github, revisionEvidence } = {}) {
  const prepared = V.sealContract({ schema_version: SCHEMA, produced, review_receipt: receipt,
    ...(revisionEvidence ? { revision_evidence: revisionEvidence } : {}) });
  const a = preparedArtifacts(prepared, cwd, produced.producer_revision, github);
  return { prepared, compatibility_files: Adapter.prepareCompatibilityFiles({ ...a, transport }) };
}

function approvalTarget(prepared, { cwd, protocolHead, github } = {}) {
  return Approval.buildApprovalTarget(preparedArtifacts(prepared, cwd, protocolHead, github));
}

function deriveQueue(queue, { cwd, github = Auth.ghClient() } = {}) {
  const bootstrap = JSON.parse(readGit(cwd, queue.source_head, queue.slice_bootstrap_file));
  if (bootstrap.protocol !== 'VNEXT' || !bootstrap.vnext_chain_file) V.fail('VNEXT_CHAIN_BOOTSTRAP_REQUIRED');
  const prepared = readGitObject(cwd, queue.source_head, bootstrap.vnext_chain_file);
  const a = preparedArtifacts(prepared, cwd, queue.source_head, github);
  if (a.planningEnvelope.slice_id !== bootstrap.slice_id) V.fail('VNEXT_CHAIN_SLICE_MISMATCH');
  const target = Approval.buildApprovalTarget(a);
  const issue = /^github_issue:([^#]+)#([1-9][0-9]*)$/.exec(a.planningEnvelope.issue_id);
  if (!issue || Number(issue[2]) !== queue.issue_number || bootstrap.repository !== issue[1]) V.fail('VNEXT_CHAIN_REPOSITORY_MISMATCH');
  const id = /^issue_comment:([1-9][0-9]*)$/.exec(queue.user_gate.gate_ref)?.[1];
  if (!id) V.fail('VNEXT_CHAIN_GATE_REQUIRED');
  const comment = github.comment(issue[1], id);
  const reactions = github.reactions(issue[1], id);
  const now = new Date().toISOString();
  const owner = issue[1].split('/')[0];
  const reaction = GithubApproval.verifyObservation({ repository: issue[1], issueNumber: issue[2],
    head: queue.source_head, target, gateRef: queue.user_gate.gate_ref, comment, reactions, observedAt: now });
  const approvalRecord = Approval.buildApprovalRecord({ approvalTarget: target, evidence: {
    decision: 'APPROVED', actor_id: owner, transport: 'GITHUB_REACTION', evidence_ref: queue.user_gate.gate_ref + '#reaction:' + reaction.id,
    approved_target_hash: target.contract_hash, observed_at: now,
    native_exception_approvals: target.execution_core.native_primitive_decisions.filter(r => r.availability === 'AVAILABLE' && r.primitive !== r.selected_primitive).map(r => r.criterion_id) } });
  const executionRequest = Approval.buildExecutionRequest({ ...a, approvalTarget: target, approvalRecord });
  const input = prepared.produced.register_input;
  if (!input || input.authorizedActor?.toLowerCase() !== owner.toLowerCase()) V.fail('VNEXT_CHAIN_REGISTER_AUTHORITY_REQUIRED');
  const cumulativeRegister = Register.buildRegister({ ...input, candidateHead: queue.source_head, lot: queue.slice_id, phase: 'HANDOFF' });
  const artifacts = { ...a, approvalTarget: target, approvalRecord, executionRequest, cumulativeRegister };
  const transport = { slice_bootstrap_file: queue.slice_bootstrap_file, slice_bootstrap_sha256: queue.slice_bootstrap_sha256,
    plan_path: queue.authorized_plan.plan_path, review_path: queue.independent_review.review_path, prompt_file: queue.prompt_file,
    gate_ref: queue.user_gate.gate_ref, request_id: queue.request_id, created_at: queue.created_at };
  const projection = Adapter.buildLegacyQueueProjection({ ...artifacts, transport });
  // Reuse a single fresh authenticated observation for all gates in this call.
  const observedApi = { ...github, comment: () => comment, reactions: () => reactions };
  return { artifacts, transport, github: observedApi, approvalTarget: target, approvalRecord, executionRequest, projection };
}

function admit(queueFile, { cwd, github = Auth.ghClient(), allowExternalQueueFile = false } = {}) {
  const queue = JSON.parse(fs.readFileSync(path.resolve(cwd, queueFile), 'utf8').replace(/^\uFEFF/, ''));
  const result = deriveQueue(queue, { cwd, github });
  const admission = Admission.verifyQueueAdmission({ queueFile, projection: result.projection,
    artifacts: result.artifacts, transport: result.transport, github: result.github, allowExternalQueueFile });
  return { admission, approvalTarget: result.approvalTarget, approvalRecord: result.approvalRecord,
    executionRequest: result.executionRequest, projection: result.projection };
}

function guard(queueFile, { cwd, github } = {}) {
  const queue = JSON.parse(fs.readFileSync(path.resolve(cwd, queueFile), 'utf8').replace(/^\uFEFF/, ''));
  // Detect the immutable VNext plan as well as the bootstrap marker. Removing
  // a working-copy flag cannot downgrade an approved VNext request to legacy.
  // Legacy malformed requests retain their original diagnostics. They cannot
  // establish a VNext authority because their immutable plan is unavailable.
  let bootstrap = {}, plan = '';
  try { bootstrap = JSON.parse(readGit(cwd, queue.source_head, queue.slice_bootstrap_file)); } catch (_) { /* verified by the legacy consumer */ }
  if (queue.authorized_plan?.approved_at_commit && queue.authorized_plan?.plan_path) {
    try { plan = readGit(cwd, queue.authorized_plan.approved_at_commit, queue.authorized_plan.plan_path); } catch (_) { /* legacy authorization refuses */ }
  }
  const marked = bootstrap.protocol === 'VNEXT' || bootstrap.vnext_chain_file !== undefined
    || plan.startsWith('# KODJO VNext — Projection transport du plan');
  return marked ? admit(queueFile, { cwd, github }) : null;
}

function guardLocalRequest(raw, { cwd, queueFile, github } = {}) {
  let bootstrap = {};
  try { bootstrap = JSON.parse(readGit(cwd, raw.protocol_source_head || raw.source_head, raw.slice_bootstrap_file)); }
  catch (_) { return null; /* normalizeRequest retains its mandatory identity checks */ }
  const marked = bootstrap.protocol === 'VNEXT' || bootstrap.vnext_chain_file !== undefined;
  if (!marked) return null;
  if (!queueFile) V.fail('VNEXT_LOCAL_QUEUE_AUTHORITY_REQUIRED');
  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8').replace(/^\uFEFF/, ''));
  const projected = JSON.parse(JSON.stringify(require('./queue-request').projectQueueRequest(queue)));
  if (V.canonicalHash(projected) !== V.canonicalHash(raw)) V.fail('VNEXT_LOCAL_QUEUE_PROJECTION_MISMATCH');
  return admit(queueFile, { cwd, github, allowExternalQueueFile: true });
}

module.exports = { readGitObject, SCHEMA, CLAUDE_TIMEOUT_MS, command, relative, readGit, unitText, observeSources, launchAndProduce, produce, verifyProduced,
  compactReviewDossier, materializeReviewDossier, decodeReviewOutput, boundedReviewOutput, validateReviewResponse, recoverReview, reviewOrRecover, preserveFailure, review, verifyReceipt, validateReceipt, nativeResolver, preparedArtifacts, prepare, approvalTarget, deriveQueue, admit, guard, guardLocalRequest };
