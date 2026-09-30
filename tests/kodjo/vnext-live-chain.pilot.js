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
function fixture() {
  const repo = F.fixtureRepo();
  const git = (...args) => execFileSync('git', args, { cwd: repo.cwd, encoding: 'utf8' }).trim();
  const write = (file, content) => { fs.mkdirSync(path.dirname(path.join(repo.cwd, file)), { recursive: true }); fs.writeFileSync(path.join(repo.cwd, file), content); };
  fs.cpSync(path.resolve(__dirname, '../../scripts/kodjo'), path.join(repo.cwd, 'scripts/kodjo'), { recursive: true });
  const sourceText = 'Modifier le comportement du module.\n';
  write('docs/functional.md', sourceText);
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
    calls++; assert.ok(args.includes('--json-schema')); assert.equal(env.GH_TOKEN, undefined); assert.equal(JSON.parse(input).produced.contract_hash, produced.contract_hash);
    return JSON.stringify({ type: 'result', session_id: 'fixture-session', structured_output: { semantic_review: { findings: [] }, native_assessment_observations: [] } });
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
