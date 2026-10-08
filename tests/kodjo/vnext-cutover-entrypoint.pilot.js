'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const Cutover = require('../../scripts/kodjo/lib/vnext-cutover-contract');
const Remote = require('../../scripts/kodjo/lib/vnext-remote-write-security');
const Routing = require('../../scripts/kodjo/lib/slice-protocol-routing');
const Entry = require('../../scripts/kodjo/start-kodjo-slice');
function fixture(t, activated = true) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-cutover-entry-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  const registry = { schema_version: 'kodjo.protocol.v2.activation-registry.0.6.12', activations: [
    { slice_id: 'OLD', status: 'ACTIVE' }, { slice_id: 'PROTECTED', status: 'CLOSED' },
  ] };
  const write = (file, value) => { fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true }); fs.writeFileSync(path.join(cwd, file), JSON.stringify(value, null, 2) + '\n'); };
  write('.github/orchestration/v2-activation-registry.json', registry);
  fs.writeFileSync(path.join(cwd, 'source.md'), 'Fixture product requirement\n');
  const commit = () => { git('add', '.'); git('commit', '-qm', 'Fixture state'); return git('rev-parse', 'HEAD'); };
  const head = commit();
  const policy = { schema_version: Remote.POLICY_SCHEMA, policy_mode: 'CUTOVER_PREPARATION', frozen_workflows: [], frozen_scripts: [], declared_vnext_writers: [], retirement_rule: 'REMOVE_OR_DISABLE_ALL_LEGACY_WRITERS_AFTER_LAST_LEGACY_SLICE' };
  const attestation = Remote.evaluateRemoteWriteSecurity({ root: cwd, policy, legacyActivationRegistry: registry });
  const plan = Cutover.buildCutoverPlan({ candidateHead: head, candidatePr: 1, qualificationRunId: 1,
    qualificationStatus: 'QUALIFIED_ON_VNEXT_PERIMETER', legacyActivationRegistry: registry,
    protectedLegacySliceIds: ['PROTECTED'], remoteWriteAttestation: attestation });
  const activation = Cutover.buildActivationRecord({ cutoverPlan: plan, currentLegacyActivationRegistry: registry,
    activatedAtProtocolHead: head, approvalEvidence: { decision: 'APPROVED', actor_id: 'FIXTURE',
      evidence_ref: 'TEST ONLY', observed_at: '2026-10-07T23:00:00.000Z', approved_cutover_plan_hash: plan.contract_hash } });
  const cutoverWrite = (name, value) => write(Routing.DIRECTORY + '/' + name, value);
  if (activated) { cutoverWrite('cutover-plan.json', plan); cutoverWrite('activation.json', activation); cutoverWrite('legacy-registry-at-activation.json', registry); commit(); }
  return { cwd, git, write, commit, cutoverWrite, registry, plan, activation };
}
test('live routing uses committed activation bytes, retains legacy slices and survives new VNext registrations', t => {
  const f = fixture(t);
  assert.equal(Routing.resolve('OLD', f), 'LEGACY'); assert.equal(Routing.resolve('NEW', f), 'VNEXT');
  f.write('.github/orchestration/v2-activation-registry.json', { ...f.registry, activations: [...f.registry.activations, { slice_id: 'NEW', status: 'ACTIVE', protocol: 'VNEXT' }] }); f.commit();
  assert.equal(Routing.resolve('NEW', f), 'VNEXT');
  f.cutoverWrite('activation.json', { ...f.activation, default_protocol: 'LEGACY' });
  assert.equal(Routing.resolve('NEW', f), 'VNEXT', 'an uncommitted edit cannot change live routing');
  f.commit(); assert.throws(() => Routing.resolve('NEW', f), /HASH_MISMATCH/);
});
test('missing activation stays legacy; a partial activation refuses every new entry', t => {
  const f = fixture(t, false); assert.equal(Routing.resolve('NEW', f), 'LEGACY');
  f.cutoverWrite('activation.json', f.activation); f.commit();
  assert.throws(() => Routing.resolve('NEW', f), /ACTIVATION_INCOMPLETE/);
});
test('the actual planning entry dispatches VNext only after routing and exact slice identity', async t => {
  const f = fixture(t); const config = path.join(f.cwd, 'recipe.json'), output = path.join(f.cwd, 'out.json');
  fs.writeFileSync(config, JSON.stringify({ planningInput: { slice_id: 'NEW' } }));
  let calls = 0; const chain = { main(args) { calls++; assert.deepEqual(args, ['produce', config, output]); return { status: 'RECORDED' }; } };
  assert.deepEqual(await Entry.main(['NEW', 'produce', config, output], { cwd: f.cwd, chain }), { status: 'RECORDED' });
  await assert.rejects(Entry.main(['OLD', 'produce', config, output], { cwd: f.cwd, chain }), /LEGACY_SLICE/);
  await assert.rejects(Entry.main(['OTHER', 'produce', config, output], { cwd: f.cwd, chain }), /IDENTITY_MISMATCH/);
  assert.equal(calls, 1);
});
test('the existing bootstrap command prepares a marked VNext identity and requires its prepared-chain path', t => {
  const f = fixture(t); const script = path.resolve(__dirname, '../../scripts/kodjo/activate-kodjo-v2-slice.js');
  const args = [script, '--slice-id', 'NEW', '--issue-number', '100', '--product-sources', 'source.md', '--authorized-actors', 'Fixture', '--target-branch', 'main'];
  const refused = spawnSync(process.execPath, args, { cwd: f.cwd, encoding: 'utf8' });
  assert.notEqual(refused.status, 0); assert.match(refused.stderr, /PREPARED_CHAIN_PATH_REQUIRED/);
  const accepted = spawnSync(process.execPath, [...args, '--vnext-chain-file', '.github/orchestration/v2-slices/NEW/prepared-chain.json'], { cwd: f.cwd, encoding: 'utf8' });
  assert.equal(accepted.status, 0, accepted.stderr);
  const bootstrap = JSON.parse(fs.readFileSync(path.join(f.cwd, '.github/orchestration/v2-slices/NEW/slice-bootstrap.json')));
  assert.equal(bootstrap.protocol, 'VNEXT'); assert.equal(bootstrap.vnext_chain_file, '.github/orchestration/v2-slices/NEW/prepared-chain.json');
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.cwd, bootstrap.activation_registry))).activations.at(-1).protocol, 'VNEXT');
});
test('legacy planners reject VNext routing before mission/context/model generation', () => {
  for (const file of ['kodjo-v2-slice-initial-plan.yml', 'kodjo-v2-slice-plan.yml', 'kodjo-slice-plan.yml']) {
    const workflow = fs.readFileSync(path.resolve(__dirname, '../../.github/workflows', file), 'utf8');
    assert.ok(workflow.includes('node scripts/kodjo/resolve-slice-protocol.js "$SLICE_ID" --require-legacy'), file);
  }
});
