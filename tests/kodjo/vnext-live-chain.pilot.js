'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const F = require('./helpers/vnext-planning-fixture');
const V = require('../../scripts/kodjo/lib/vnext-contract');
const Source = require('../../scripts/kodjo/lib/source-manifest');
const Envelope = require('../../scripts/kodjo/lib/planning-envelope');
const Approval = require('../../scripts/kodjo/lib/approval-handoff-contract');
const Queue = require('../../scripts/kodjo/lib/queue-request');
const Auth = require('../../scripts/kodjo/verify-authorizations');
const Chain = require('../../scripts/kodjo/lib/vnext-live-chain');
const select = (row, keys) => Object.fromEntries(keys.map(k => [k, row[k]]));
function fixture({ largeCatalog = false } = {}) {
  const repo = F.fixtureRepo();
  const git = (...args) => execFileSync('git', args, { cwd: repo.cwd, encoding: 'utf8' }).trim();
  const write = (file, content) => { fs.mkdirSync(path.dirname(path.join(repo.cwd, file)), { recursive: true }); fs.writeFileSync(path.join(repo.cwd, file), content); };
  require('../../scripts/kodjo/lib/vnext-performance').measure('fixture.copy-producer', () =>
    fs.cpSync(path.resolve(__dirname, '../../scripts/kodjo'), path.join(repo.cwd, 'scripts/kodjo'), { recursive: true }));
  const sourceText = 'Modifier le comportement du module.\n';
  write('docs/functional.md', sourceText);
  if (largeCatalog) for (let i = 0; i < 700; i++) write('catalog/entry-' + i + '.js', 'module.exports = ' + i + ';\n');
  git('add', '.'); git('commit', '-m', 'real producer code and sources');
  repo.revision = git('rev-parse', 'HEAD');
  const sourceInput = { slice_id: 'V2-VNEXT-09', product_head: repo.revision, sources: [{ source_kind: 'MARKDOWN', authority: 'FUNCTIONAL', locator: 'docs/functional.md', revision: repo.revision, fingerprint: V.sha256(sourceText), units: [{ locator: 'FULL_FILE', fingerprint: V.sha256(sourceText), disposition: 'REQUIREMENT_SOURCE' }] }] };
  const manifest = Source.build(sourceInput);
  const planningInput = { slice_id: manifest.slice_id, planning_mode: 'INITIAL', baseline_head: repo.revision, product_head: repo.revision, application_head: repo.revision, issue_id: 'github_issue:MyUncried/Application-Routine#999', base_plan_hash: null, base_review_hash: null, causal_findings: [], created_from: { kind: 'INITIAL_REQUEST', refs: ['issue_comment:100'] } };
  const artifacts = F.buildPlanningArtifacts({ repo, manifest, envelope: Envelope.build({ ...planningInput, source_manifest: manifest }) });
  const recipe = { sourceManifestInput: sourceInput, planningInput,
    requirementInput: { requirements: artifacts.requirementRegistry.requirements.map(r => select(r, ['source_id','unit_id','kind','statement','priority','status','rationale','related_unit_ids','conflict_unit_ids'])) },
    classifications: artifacts.impactGraph.impacts.map(r => select(r, ['requirement_id','candidate_id','change_kind','impact_reason','dependency_evidence','tests_affected_candidate_ids','preservation_candidate_ids'])),
    requirementPlans: artifacts.planContract.plan_items.map(r => ({ ...select(r, ['requirement_id','implementation_constraints','residual_risks','rationale']), implementation_intents: r.change_items.map(x => select(x, ['impact_id','intent'])), test_obligations: r.test_obligations.map(x => select(x, ['target_impact_id','covered_change_impact_ids','expected','justification'])), proof_obligations: r.proof_obligations.map(x => select(x, ['proof_type','target_test_impact_id','covered_change_impact_ids','expected','justification'])) })),
    executionContext: { mode: 'LOCAL', writer_id: 'CLAUDE:fixture-writer' }, nativeAssessments: [], registerInput: { authorizedActor: 'MyUncried', revisionCount: 0, revisionLimit: 1, observations: [] } };
  const produced = Chain.produce(recipe, { cwd: repo.cwd });
  let calls = 0;
  const receipt = Chain.review(produced, { cwd: repo.cwd, claude: 'fixture-only', invoke: (_bin, args, _cwd, input, env) => {
    calls++; assert.ok(args.includes('--json-schema')); assert.equal(env.GH_TOKEN, undefined);
    const dossier = JSON.parse(input);
    assert.equal(dossier.produced_chain_hash, produced.contract_hash);
    assert.equal(dossier.artifacts.reviewContext.target_catalog, undefined);
    assert.deepEqual(dossier.target_catalog, produced.artifacts.reviewContext.target_catalog);
    const packed = dossier.artifacts.candidateManifest;
    assert.deepEqual(packed.rows.map(row => Object.fromEntries(packed.columns.map((key, i) => [key, row[i]]))), produced.artifacts.candidateManifest.candidates);
    assert.deepEqual(dossier.consumer_sources.map(row => ({ path: row.path, source_hash: row.source_hash,
      source: fs.readFileSync(row.source_path, 'utf8') })), produced.reviewer_packet.consumers);
    assert.deepEqual(JSON.parse(fs.readFileSync(dossier.canonical_observation.path)), produced.artifacts);
    assert.equal(dossier.canonical_observation.reconstruction_verified, true);
    assert.ok(!dossier.instructions.includes('Avant de verifier les empreintes canoniques, reconstruire'));
    assert.ok(args.includes('stream-json')); assert.ok(args.includes('--verbose'));
    const compact = JSON.parse(args[args.indexOf('--json-schema') + 1]);
    const compactFields = compact.properties.semantic_review.properties.findings.items.properties;
    assert.equal(compactFields.target_id.enum, undefined);
    assert.equal(compactFields.dependency_target_ids, undefined);
    assert.equal(compactFields.dependency_target_indices.items.type, 'integer');
    assert.ok(args.includes('--add-dir'));
    assert.equal(compact.properties.semantic_review.properties.reviewed_target_ids, undefined);
    assert.equal(compact.properties.semantic_review.properties.reviewed_target_indices.items.type, 'integer');
    assert.ok(args.join(' ').length < 8000, 'review command line must stay bounded');
    if (largeCatalog) {
      const original = JSON.stringify({ produced, output_schema: require('../../scripts/kodjo/lib/review-contract').reviewerOutputSchema(produced.artifacts.reviewContext) });
      assert.ok(original.length > 32767);
      assert.ok(Buffer.byteLength(input) < Buffer.byteLength(original) * 0.75, 'compact transport reduces size while retaining every candidate');
    }
    return JSON.stringify({ type: 'result', session_id: 'fixture-session', structured_output: { semantic_review: { findings: [], finding_resolutions: [], target_catalog_hash: dossier.target_catalog_hash,
      reviewed_target_indices: Object.values(dossier.target_catalog).flat().map((_, i) => i) }, native_assessment_observations: [] } });
  } });
  const transport = { ...F.transport(), slice_bootstrap_file: '.github/orchestration/v2-slices/V2-VNEXT-09/slice-bootstrap.json' };
  const ready = Chain.prepare(produced, receipt, transport, { cwd: repo.cwd });
  const chainFile = '.github/orchestration/vnext-runtime/V2-VNEXT-09/prepared.json';
  const bootstrap = { schema_version: 'kodjo.protocol.v2.slice-bootstrap.0.6.12',
    protocol: 'VNEXT', vnext_chain_file: chainFile, slice_id: manifest.slice_id, issue_number: 999,
    repository: 'MyUncried/Application-Routine', target_branch: 'main', baseline_head: repo.revision,
    protocol_version: '0.6.12', protocol_commit: repo.revision, previous_slice_id: null, previous_checkpoint: null,
    product_sources: [{ path: 'docs/functional.md', sha256: V.sha256(sourceText) }],
    created_at: '2026-09-30T00:00:00.000Z', authorized_actors: ['MyUncried'],
    activation_registry: '.github/orchestration/v2-activation-registry.json' };
  bootstrap.slice_bootstrap_sha256 = V.canonicalHash(bootstrap);
  transport.slice_bootstrap_sha256 = bootstrap.slice_bootstrap_sha256;
  write(chainFile, JSON.stringify(ready.prepared)); write(transport.slice_bootstrap_file, JSON.stringify(bootstrap));
  write(bootstrap.activation_registry, JSON.stringify({ schema_version: 'kodjo.protocol.v2.activation-registry.0.6.12', activations: [{ slice_id: manifest.slice_id, status: 'ACTIVE', issue_number: 999,
    baseline_head: repo.revision, bootstrap_path: transport.slice_bootstrap_file, slice_bootstrap_sha256: bootstrap.slice_bootstrap_sha256 }] }));
  for (const file of Object.values(ready.compatibility_files)) write(file.path, file.content);
  git('add', '.'); git('commit', '-m', 'immutable preapproval dossier');
  const head = git('rev-parse', 'HEAD');
  const target = Chain.approvalTarget(ready.prepared, { cwd: repo.cwd, protocolHead: head });
  const github = { comment: () => ({ id: 12345, issue_url: 'https://api.github.com/repos/MyUncried/Application-Routine/issues/999', updated_at: '2026-09-30T00:28:00.000Z', body: head + '\n' + Approval.renderApprovalMessage(target) }), reactions: () => [{ id: 67890, content: '+1', user: { login: 'MyUncried' }, created_at: '2026-09-30T00:29:00.000Z' }] };
  const seed = { slice_id: manifest.slice_id, issue_number: 999, source_head: head, slice_bootstrap_file: transport.slice_bootstrap_file, slice_bootstrap_sha256: transport.slice_bootstrap_sha256, authorized_plan: { plan_path: transport.plan_path }, independent_review: { review_path: transport.review_path }, prompt_file: transport.prompt_file, user_gate: { gate_ref: transport.gate_ref }, request_id: transport.request_id, created_at: transport.created_at };
  const derived = Chain.deriveQueue(seed, { cwd: repo.cwd, github });
  const queueFile = 'queue.json'; write(queueFile, JSON.stringify(derived.projection.legacy_queue_request));
  return { repo, produced, receipt, recipe, target, github, head, transport, queueFile, write, calls, derived };
}
function withFixture(fn) { const f = fixture(); try { fn(f); } finally { fs.rmSync(f.repo.cwd, { recursive: true, force: true }); } }
test('live chain: observed Git sources, structured reviewer, exact approval and real queue authorization compose', () => withFixture(f => {
  assert.equal(f.calls, 1);
  assert.equal(Chain.admit(f.queueFile, { cwd: f.repo.cwd, github: f.github }).admission.status, 'AUTHORIZED');
  assert.equal(Auth.verify(f.queueFile, { cwd: f.repo.cwd, github: f.github }).vnext_admission.status, 'AUTHORIZED');
  const raw = JSON.parse(JSON.stringify(Queue.projectQueueRequest(f.derived.projection.legacy_queue_request)));
  assert.equal(Chain.guardLocalRequest(raw, { cwd: f.repo.cwd, github: f.github, queueFile: path.join(f.repo.cwd, f.queueFile) }).admission.status, 'AUTHORIZED');
  assert.throws(() => Chain.guardLocalRequest(raw, { cwd: f.repo.cwd, github: f.github }), /VNEXT_LOCAL_QUEUE_AUTHORITY_REQUIRED/);
}));
test('live chain: revoked, edited, mismatched approval and altered queue are refused', () => withFixture(f => {
  const opts = { cwd: f.repo.cwd, github: f.github };
  assert.throws(() => Chain.admit(f.queueFile, { ...opts, github: { ...f.github, reactions: () => [] } }), /OWNER_APPROVAL_REQUIRED/);
  assert.throws(() => Chain.admit(f.queueFile, { ...opts, github: { ...f.github, comment: () => ({ ...f.github.comment(), updated_at: '2026-09-30T00:29:30.000Z' }) } }), /OWNER_APPROVAL_REQUIRED/);
  assert.throws(() => Chain.admit(f.queueFile, { ...opts, github: { ...f.github, comment: () => ({ ...f.github.comment(), body: f.head }) } }), /EXACT_APPROVAL_MESSAGE_REQUIRED/);
  const q = f.derived.projection.legacy_queue_request;
  f.write(f.queueFile, JSON.stringify({ ...q, scope_allow: ['outside.js'] }));
  assert.throws(() => Chain.admit(f.queueFile, opts), /REQUEST_MISMATCH/);
}));
test('live chain: source bytes and unobserved native proof cannot be asserted by flags', () => withFixture(f => {
  const forged = structuredClone(f.produced); forged.source_observations[0].content = 'forged'; delete forged.contract_hash;
  assert.throws(() => Chain.verifyProduced(V.sealContract(forged), f.repo.cwd), /SOURCE_OBSERVATION_STALE/);
  assert.throws(() => Chain.nativeResolver(f.produced, f.receipt, f.repo.cwd)({ criterion_id: 'criterion' }, { sourceManifest: f.produced.artifacts.planningEnvelope.source_manifest, applicationHead: f.repo.revision }), /WAIT_FOR_PROOF/);
  assert.throws(() => Chain.produce({ ...f.recipe, sourceManifestInput: { ...f.recipe.sourceManifestInput, sources: [{ ...f.recipe.sourceManifestInput.sources[0], fingerprint: '0'.repeat(64) }] } }, { cwd: f.repo.cwd }), /SOURCE_OBSERVATION_HASH_MISMATCH/);
}));

test('live chain: direct implementation runner refuses before invoking Claude when queue authority is absent', () => withFixture(f => {
  const raw = JSON.parse(JSON.stringify(Queue.projectQueueRequest(f.derived.projection.legacy_queue_request)));
  f.write('local-request.json', JSON.stringify(raw));
  const env = { ...process.env }; delete env.KODJO_VNEXT_QUEUE_FILE;
  const run = spawnSync(process.execPath, [path.resolve(__dirname, '../../scripts/kodjo/run-local-claude.js'), path.join(f.repo.cwd, 'local-request.json')], { cwd: f.repo.cwd, env, encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr + run.stdout, /VNEXT_LOCAL_QUEUE_AUTHORITY_REQUIRED/);
  assert.equal(fs.existsSync(path.join(f.repo.cwd, '.kodjo-v2')), false);
}));

test('live chain: real queue preflight validates VNext plan mission and runtime identity without legacy UI blocks', () => withFixture(f => {
  const git = (...args) => execFileSync('git', args, { cwd: f.repo.cwd, encoding: 'utf8' }).trim();
  const queuePath = '.github/orchestration/queue/v2/vnext-preflight.json';
  f.write(queuePath, JSON.stringify(f.derived.projection.legacy_queue_request));
  git('add', queuePath); git('commit', '-m', 'immutable qualification queue');
  const preflight = require('../../scripts/kodjo/verify-queue-preflight');
  const run = () => preflight.runPreflight({ cwd: f.repo.cwd, queuePath, before: f.head,
    after: git('rev-parse', 'HEAD'), github: f.github,
    probes: { claudeVersion: () => require('../../scripts/kodjo/lib/claude-local').CLAUDE_CODE_VERSION,
      claudeAuth: () => ({ fixture_only: true }), githubAccess: () => ({ fixture_only: true }) } });
  const checked = run();
  const at = (result, id) => result.checks.find(x => x.id === id);
  for (const id of ['PF-006','PF-009','PF-010','PF-012','PF-013']) assert.equal(at(checked, id).status, 'PASS', JSON.stringify(at(checked, id)));
  assert.equal(at(checked, 'PF-010').evidence.authority, 'VNEXT_EXECUTION_REQUEST');
  assert.match(f.derived.projection.compatibility_files.mission.content, /Modifier le comportement du module|Adapter le module sans élargissement/);
  f.write(f.transport.prompt_file, f.derived.projection.compatibility_files.mission.content + 'forged');
  assert.match(at(run(), 'PF-009').diagnostic, /VNEXT_PREFLIGHT_MISSION_BYTES_MISMATCH/);
  f.github.reactions = () => [];
  const refused = run();
  assert.match(at(refused, 'PF-006').diagnostic, /OWNER_APPROVAL_REQUIRED/);
  assert.equal(at(refused, 'PF-010').status, 'BLOCKED');
}));


test('live chain: large immutable target catalog travels on stdin and unknown reviewer targets remain refused', () => {
  const f = fixture({ largeCatalog: true });
  try {
    assert.equal(f.receipt.review_report.verdict, 'APPROVE');
    const finding = { category: 'PLAN_GAP', target_type: 'REQUIREMENT', target_id: 'unknown-target',
      finding: 'Unknown target', evidence: ['Observed source'], required_correction: 'Correct target', dependency_target_ids: [] };
    const invoke = () => JSON.stringify({ type: 'result', session_id: 'fixture-invalid-target',
      structured_output: { semantic_review: require('./helpers/review-attestation-fixture').semantic(f.produced.artifacts.reviewContext, [finding]), native_assessment_observations: [] } });
    assert.throws(() => Chain.review(f.produced, { cwd: f.repo.cwd, claude: 'fixture-only', invoke }), /VNEXT_REVIEW_FINDING_TARGET_UNKNOWN/);
    finding.target_id = f.produced.artifacts.reviewContext.target_catalog.REQUIREMENT[0];
    finding.dependency_target_ids = ['unknown-dependency'];
    assert.throws(() => Chain.review(f.produced, { cwd: f.repo.cwd, claude: 'fixture-only', invoke }), /VNEXT_REVIEW_FINDING_DEPENDENCY_UNKNOWN/);
  } finally { fs.rmSync(f.repo.cwd, { recursive: true, force: true }); }
});


test('compact review coverage refuses omission, duplicate, out-of-range, wrong catalog and mixed formats', () => {
  const context = { target_catalog: { SOURCE_UNIT: ['source'], REQUIREMENT: [], IMPACT: [], CANDIDATE: ['candidate'],
    PLAN_ITEM: [], TEST: [], PROOF: [], CRITERION: [], ASSERTION: [], PLAN_CONTRACT: [] } };
  const output = { findings: [], finding_resolutions: [], target_catalog_hash: V.canonicalHash(['source', 'candidate']),
    reviewed_target_indices: [0, 1] };
  assert.deepEqual(Chain.decodeReviewOutput(context, output).reviewed_target_ids, ['source', 'candidate']);
  for (const indices of [[0, 0], [0, 2], [-1, 1], [0, 0.5]]) {
    assert.throws(() => Chain.decodeReviewOutput(context, { ...output, reviewed_target_indices: indices }), /INDEX_INVALID/);
  }
  assert.throws(() => Chain.decodeReviewOutput(context, { ...output, target_catalog_hash: '0'.repeat(64) }), /INDEX_CATALOG_MISMATCH/);
  assert.throws(() => Chain.decodeReviewOutput(context, { ...output, reviewed_target_ids: ['source', 'candidate'] }), /INDEX_OUTPUT_KEYS_INVALID/);
  withFixture(f => {
    const dossier = Chain.compactReviewDossier(f.produced);
    const indices = Object.values(dossier.target_catalog).flat().map((_, i) => i).slice(1);
    assert.throws(() => Chain.review(f.produced, { cwd: f.repo.cwd, claude: 'unit-test-only', invoke: () => JSON.stringify({
      type: 'result', session_id: 'UNIT-TEST-ONLY', structured_output: { native_assessment_observations: [],
        semantic_review: { ...output, target_catalog_hash: dossier.target_catalog_hash, reviewed_target_indices: indices } } }) }), /COVERAGE_INCOMPLETE/);
  });
});
test('review process captures an actual interrupted child, bounds output and redacts inherited credentials', () => {
  let observed;
  assert.throws(() => Chain.command(process.execPath, ['-e', "process.stdout.write('partial'); setInterval(()=>{},1000)"],
    process.cwd(), undefined, process.env, 300, { onResult: row => { observed = row; } }), /ETIMEDOUT/);
  assert.equal(observed.error_code, 'ETIMEDOUT');
  assert.equal(observed.stdout, 'partial');
  assert.ok(observed.duration_ms >= 250);
  assert.equal(Chain.boundedReviewOutput('x'.repeat(150000)).truncated, true);
  assert.ok(Buffer.byteLength(Chain.boundedReviewOutput('x'.repeat(150000)).text) <= 128 * 1024);
  assert.equal(Chain.boundedReviewOutput('ghp_UNIT_TEST_TOKEN').text, '[REDACTED]');
});
test('review diagnostics survive a failed invocation outside the checkout and retain no approval', () => withFixture(f => {
  const out = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'vnext-review-diagnostic-test-'));
  try {
    assert.throws(() => Chain.review(f.produced, { cwd: f.repo.cwd, claude: 'unit-test-only', evidenceDirectory: out,
      invoke: (_bin, _args, _cwd, _input, _env, _timeout, { onResult }) => {
        onResult({ status: null, signal: 'SIGTERM', error_code: 'ETIMEDOUT', error: 'UNIT TEST TIMEOUT',
          duration_ms: 600000, stdout: 'partial session output', stderr: 'ghp_UNIT_TEST_TOKEN' });
        throw Error('UNIT TEST TIMEOUT');
      } }), /UNIT TEST TIMEOUT/);
    const diagnostic = JSON.parse(fs.readFileSync(path.join(out, 'initial-review-process.json')));
    assert.equal(diagnostic.error_code, 'ETIMEDOUT');
    assert.equal(diagnostic.review_accepted, false);
    assert.equal(diagnostic.checkout_unchanged, true);
    assert.equal(diagnostic.stdout.text, 'partial session output');
    assert.equal(diagnostic.stderr.text, '[REDACTED]');
    assert.equal(Object.hasOwn(diagnostic, 'input'), false);
    assert.throws(() => Chain.review(f.produced, { cwd: f.repo.cwd, evidenceDirectory: f.repo.cwd }), /EVIDENCE_OUTSIDE_CHECKOUT_REQUIRED/);
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
}));

test('quoted markers and old machine blocks remain lossless data through downstream transport', () => withFixture(f => {
  const Plan = require('../../scripts/kodjo/lib/plan-contract');
  const Adapter = require('../../scripts/kodjo/lib/vnext-legacy-queue-adapter');
  const Req = require('../../scripts/kodjo/lib/requirement-contract');
  const extract = require('../../scripts/kodjo/lib/plan-impact').extractTaggedJson;
  for (const citation of ['`<KODJO_UI_CRITERIA_MATRIX_JSON>`',
    '`<KODJO_UI_CRITERIA_MATRIX_JSON>{"citation":true}</KODJO_UI_CRITERIA_MATRIX_JSON>`',
    '\n<KODJO_UI_CRITERIA_MATRIX_JSON>\n{"old_plan":true}\n</KODJO_UI_CRITERIA_MATRIX_JSON>',
    '\nPLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW']) {
    const data = JSON.parse(JSON.stringify(f.produced.artifacts.planContract));
    delete data.contract_hash;
    data.plan_items[0].change_items[0].intent += '\n' + citation;
    const plan = V.sealContract(data), original = JSON.stringify(plan);
    const request = { application_head: f.repo.revision, plan_contract_hash: plan.contract_hash };
    const md = Adapter.renderCompatibilityPlan(request, plan, null, f.produced.artifacts.requirementRegistry, f.produced.artifacts.candidateManifest);
    assert.deepEqual(extract(md, 'KODJO_VNEXT_PLAN_CONTRACT_JSON'), plan);
    assert.equal(JSON.stringify(plan), original);
    Req.verifyEmbedded(md, new Set(plan.boundaries.write_scope.map(row => row.path)));
    assert.throws(() => Req.verifyEmbedded(md + '\n<KODJO_UI_CRITERIA_MATRIX_JSON>{}</KODJO_UI_CRITERIA_MATRIX_JSON>', new Set(plan.boundaries.write_scope.map(row => row.path))), /exactement une fois/);
    assert.equal(Plan.verifyMarkdownProjection(Plan.renderMarkdown(plan), plan), true);
  }
}));

test('complete raw review survives semantic rejection and recovery never invokes the model', () => withFixture(f => {
  const out = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'vnext-raw-recovery-'));
  try {
    const result = JSON.parse(f.receipt.raw_result);
    result.structured_output.semantic_review.reviewed_target_indices = result.structured_output.semantic_review.reviewed_target_indices.slice(1);
    result.padding = 'x'.repeat(150000);
    const raw = JSON.stringify(result);
    assert.throws(() => Chain.review(f.produced, { cwd: f.repo.cwd, evidenceDirectory: out, claude: 'fixture-only', invoke: () => raw }), /COVERAGE_INCOMPLETE/);
    const saved = JSON.parse(fs.readFileSync(path.join(out, 'initial-review-response.json')));
    assert.equal(saved.stdout, raw); assert.equal(saved.stdout_sha256, V.sha256(raw));
    const diagnostic = JSON.parse(fs.readFileSync(path.join(out, 'initial-review-process.json')));
    assert.match(diagnostic.error, /COVERAGE_INCOMPLETE/); assert.equal(diagnostic.review_accepted, false);
    assert.throws(() => Chain.reviewOrRecover(f.produced, { cwd: f.repo.cwd, evidenceDirectory: out, invoke: () => assert.fail('must not invoke') }), /COVERAGE_INCOMPLETE/);
    saved.stdout = f.receipt.raw_result; saved.stdout_sha256 = V.sha256(saved.stdout); delete saved.contract_hash;
    fs.writeFileSync(path.join(out, 'initial-review-response.json'), JSON.stringify(V.sealContract(saved)));
    const recovered = Chain.reviewOrRecover(f.produced, { cwd: f.repo.cwd, evidenceDirectory: out, invoke: () => assert.fail('must not invoke') });
    Chain.verifyReceipt(f.produced, recovered);
    saved.produced_chain_hash = '0'.repeat(64);
    fs.writeFileSync(path.join(out, 'initial-review-response.json'), JSON.stringify(V.sealContract(saved)));
    assert.throws(() => Chain.recoverReview(f.produced, { cwd: f.repo.cwd, evidenceDirectory: out }), /BINDING_MISMATCH/);
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
}));

test('semantic failure remains primary when its diagnostic archive also fails', () => withFixture(f => {
  const out = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'vnext-double-failure-'));
  const original = fs.writeFileSync;
  try {
    let writes = 0;
    fs.writeFileSync = function(file, ...args) {
      if (String(file).endsWith('initial-review-process.json') && ++writes > 1) throw Error('UNIT_ARCHIVE_ENOSPC');
      return original.call(this, file, ...args);
    };
    const result = JSON.parse(f.receipt.raw_result);
    result.structured_output.semantic_review.reviewed_target_indices = result.structured_output.semantic_review.reviewed_target_indices.slice(1);
    assert.throws(() => Chain.review(f.produced, { cwd: f.repo.cwd, evidenceDirectory: out, claude: 'fixture-only', invoke: () => JSON.stringify(result) }), error => {
      assert.match(error.message, /COVERAGE_INCOMPLETE/); assert.match(error.message, /UNIT_ARCHIVE_ENOSPC/); return true;
    });
    assert.ok(fs.existsSync(path.join(out, 'initial-review-response.json')));
  } finally { fs.writeFileSync = original; fs.rmSync(out, { recursive: true, force: true }); }
}));

test('malformed response and interrupted process are retained but cannot become a review', () => withFixture(f => {
  for (const interrupted of [false, true]) {
    const out = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'vnext-invalid-raw-'));
    try {
      const raw = interrupted ? f.receipt.raw_result : '{broken json';
      assert.throws(() => Chain.review(f.produced, { cwd: f.repo.cwd, claude: 'fixture-only', evidenceDirectory: out,
        invoke: (_bin, _args, _cwd, _input, _env, _timeout, { onResult }) => {
          if (interrupted) { onResult({ status: null, signal: 'SIGTERM', error_code: 'ETIMEDOUT', stdout: raw, stderr: '' }); throw Error('UNIT_TIMEOUT'); }
          return raw;
        } }), interrupted ? /UNIT_TIMEOUT/ : /OUTPUT_UNPARSEABLE/);
      assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'initial-review-response.json'))).stdout, raw);
      assert.throws(() => Chain.recoverReview(f.produced, { cwd: f.repo.cwd, evidenceDirectory: out }), interrupted ? /PROCESS_INCOMPLETE/ : /OUTPUT_UNPARSEABLE/);
    } finally { fs.rmSync(out, { recursive: true, force: true }); }
  }
}));
