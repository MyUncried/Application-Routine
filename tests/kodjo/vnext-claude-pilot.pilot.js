'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const Pilot = require('../../scripts/kodjo/lib/vnext-pilot-designation');
const Cli = require('../../scripts/kodjo/claude-pilot');
const Relay = require('../../scripts/kodjo/lib/vnext-pilot-review-relay');

const REPO = 'MyUncried/Application-Routine';
const ISSUE_URL = n => 'https://api.github.com/repos/' + REPO + '/issues/' + n;
const HASH = 'a'.repeat(64);
const vnext = () => 'VNEXT';

function fixture(t, { sliceId = 'V2-PRE-4', issue = 400 } = {}) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'vnext-claude-pilot-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  const write = (file, value) => { fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n'); };
  const commit = () => { git('add', '.'); git('commit', '-qm', 'Fixture state'); return git('rev-parse', 'HEAD'); };
  write(Pilot.bootstrapFile(sliceId), { slice_id: sliceId, issue_number: issue, repository: REPO, vnext_chain_file: 'chain/prepared.json' });
  write('chain/prepared.json', { contract_hash: HASH });
  const base = commit();
  const comments = {};
  const github = { comment: (_repo, id) => { if (!comments[id]) throw Error('GITHUB_READ_FAILED'); return comments[id]; },
    comments: () => Object.values(comments) };
  const owner = (id, body, app = null) => { comments[id] = { id: Number(id), issue_url: ISSUE_URL(issue), user: { login: 'MyUncried' }, performed_via_github_app: app, body }; };
  const entry = (sequence, from, to, id, checkpoint = base) => ({ sequence, from_pilot: from, to_pilot: to, checkpoint_commit: checkpoint,
    authorization_comment_id: String(id), recorded_at: '2026-10-09T08:00:00.000Z', open_operations: [] });
  const designate = (entries) => { write(Pilot.designationFile(sliceId), { schema_version: Pilot.SCHEMA, slice_id: sliceId, issue_number: issue, designations: entries }); return commit(); };
  const authorize = (e) => owner(e.authorization_comment_id, Pilot.designationBody({ sliceId, sequence: e.sequence, fromPilot: e.from_pilot, toPilot: e.to_pilot, checkpointCommit: e.checkpoint_commit }));
  const opts = { cwd, github, routeSlice: vnext };
  return { cwd, git, write, commit, base, comments, github, owner, entry, designate, authorize, opts, sliceId, issue };
}

test('without a committed designation the slice keeps the ChatGPT pilot and the Claude entry point refuses', t => {
  const f = fixture(t);
  assert.equal(Pilot.resolve(f.sliceId, f.opts).pilot, 'CHATGPT_WORK');
  let invoked = false;
  assert.throws(() => Cli.main(['run', f.sliceId, 'produce', 'c.json', 'o.json'], { ...f.opts, invoke: () => { invoked = true; return 0; } }), /PILOT_NOT_DESIGNATED/);
  assert.equal(invoked, false);
});

test('an owner-authorized committed designation makes Claude the only pilot; uncommitted edits are ignored', t => {
  const f = fixture(t);
  const e = f.entry(1, 'CHATGPT_WORK', 'CLAUDE_CODE', 11); f.authorize(e); f.designate([e]);
  assert.equal(Pilot.resolve(f.sliceId, f.opts).pilot, 'CLAUDE_CODE');
  f.write(Pilot.designationFile(f.sliceId), '{}');
  assert.equal(Pilot.resolve(f.sliceId, f.opts).pilot, 'CLAUDE_CODE', 'only committed bytes at HEAD count');
});

test('designation authorization must be the exact owner comment posted directly, never via the ChatGPT connector', t => {
  const f = fixture(t);
  const e = f.entry(1, 'CHATGPT_WORK', 'CLAUDE_CODE', 12); f.designate([e]);
  const body = Pilot.designationBody({ sliceId: f.sliceId, sequence: 1, fromPilot: 'CHATGPT_WORK', toPilot: 'CLAUDE_CODE', checkpointCommit: f.base });
  for (const mutate of [
    c => { c.performed_via_github_app = { slug: Pilot.CONNECTOR_SLUG }; },
    c => { c.user = { login: 'someone-else' }; },
    c => { c.body = body.replace('CLAUDE_CODE', 'CHATGPT_WORK'); },
    c => { c.issue_url = ISSUE_URL(f.issue + 1); },
  ]) {
    f.owner('12', body); mutate(f.comments['12']);
    assert.throws(() => Pilot.resolve(f.sliceId, f.opts), /PILOT_DESIGNATION_OWNER_AUTHORIZATION_REQUIRED/);
  }
  delete f.comments['12'];
  assert.throws(() => Pilot.resolve(f.sliceId, f.opts), /GITHUB_READ_FAILED/);
});

test('return to ChatGPT is a further designation; the chain must be continuous and checkpoints committed', t => {
  const f = fixture(t);
  const a = f.entry(1, 'CHATGPT_WORK', 'CLAUDE_CODE', 21); f.authorize(a);
  const head = f.designate([a]);
  const b = f.entry(2, 'CLAUDE_CODE', 'CHATGPT_WORK', 22, head); f.authorize(b); f.designate([a, b]);
  assert.equal(Pilot.resolve(f.sliceId, f.opts).pilot, 'CHATGPT_WORK');
  assert.throws(() => Cli.main(['run', f.sliceId, 'produce', 'c.json', 'o.json'], { ...f.opts, invoke: () => 0 }), /PILOT_NOT_DESIGNATED/);
  const gap = f.entry(3, 'CLAUDE_CODE', 'CHATGPT_WORK', 23); f.authorize(gap); f.designate([a, b, gap]);
  assert.throws(() => Pilot.resolve(f.sliceId, f.opts), /PILOT_DESIGNATION_CHAIN_INVALID/);
  const orphan = f.entry(1, 'CHATGPT_WORK', 'CLAUDE_CODE', 24, 'b'.repeat(40)); f.authorize(orphan); f.designate([orphan]);
  assert.throws(() => Pilot.resolve(f.sliceId, f.opts), /PILOT_DESIGNATION_CHECKPOINT_NOT_ANCESTOR/);
});

test('PRE-3 and legacy slices can never use the Claude pilot variant', t => {
  for (const [sliceId, issue] of [['V2-PRE-3', 341], ['PRE-3', 342], ['V2-PRE-4', 340]]) {
    const f = fixture(t, { sliceId, issue });
    const e = f.entry(1, 'CHATGPT_WORK', 'CLAUDE_CODE', 31); f.authorize(e); f.designate([e]);
    assert.throws(() => Pilot.resolve(sliceId, f.opts), /PILOT_VARIANT_SLICE_EXCLUDED/);
  }
  const f = fixture(t);
  assert.throws(() => Pilot.resolve(f.sliceId, { ...f.opts, routeSlice: () => 'LEGACY' }), /PILOT_VARIANT_REQUIRES_VNEXT_SLICE/);
});

test('gate stages require an exact independent ChatGPT plan review before the unchanged engine runs', t => {
  const f = fixture(t);
  const e = f.entry(1, 'CHATGPT_WORK', 'CLAUDE_CODE', 41); f.authorize(e); f.designate([e]);
  f.write('reserve.json', { prepared_file: 'chain/prepared.json' });
  const review = (overrides = {}) => ({ id: 42, issue_url: ISSUE_URL(f.issue), user: { login: 'MyUncried' },
    created_at: '2026-10-09T09:00:00Z', updated_at: '2026-10-09T09:00:00Z',
    performed_via_github_app: { slug: Pilot.CONNECTOR_SLUG }, body: ['[KODJO_VNEXT] INDEPENDENT_PLAN_REVIEW', 'slice_id=' + f.sliceId,
      'prepared_chain_hash=' + HASH, 'reviewer=ChatGPT', 'verdict=APPROVE', 'human_review_performed=false'].join('\n'), ...overrides });
  const calls = [];
  const deps = { ...f.opts, invoke: (cmd, args) => { calls.push(args.slice(1)); return 0; } };
  assert.throws(() => Cli.main(['run', f.sliceId, 'reserve-gate', 'reserve.json', 'out.json'], deps), /PILOT_INDEPENDENT_PLAN_REVIEW_REQUIRED/);
  for (const bad of [
    review({ performed_via_github_app: null }),
    review({ body: review().body.replace(HASH, 'c'.repeat(64)) }),
    review({ body: review().body.replace('verdict=APPROVE', 'verdict=REVISE') }),
    review({ body: review().body.replace('human_review_performed=false\n', '') + '\nverdict=APPROVE' }),
    review({ body: review().body + '\nprepared_chain_hash=' + HASH }),
  ]) {
    f.comments['42'] = bad;
    assert.throws(() => Cli.main(['run', f.sliceId, '--independent-plan-review=42', 'reserve-gate', 'reserve.json', 'out.json'], deps), /PILOT_INDEPENDENT_PLAN_REVIEW_REQUIRED/);
  }
  assert.equal(calls.length, 0, 'the engine never runs before the guard passes');
  f.comments['42'] = review();
  const result = Cli.main(['run', f.sliceId, '--independent-plan-review=42', 'reserve-gate', 'reserve.json', 'out.json'], deps);
  assert.equal(result.independent_plan_review.prepared_chain_hash, HASH);
  assert.deepEqual(calls, [['reserve-gate', 'reserve.json', 'out.json']], 'engine arguments are passed through unchanged');
  Cli.main(['run', f.sliceId, 'reserve-gate', 'reserve.json', 'auto.json'], deps);
  assert.deepEqual(calls[1], ['reserve-gate', 'reserve.json', 'auto.json'], 'no comment identifier has to be copied');
  Cli.main(['run', f.sliceId, 'produce', 'recipe.json', 'produced.json'], deps);
  assert.deepEqual(calls[2], ['produce', 'recipe.json', 'produced.json']);
  assert.throws(() => Cli.main(['run', f.sliceId, 'publish-anything', 'c.json'], deps), /PILOT_STAGE_INVALID/);
});

test('designation-body renders the exact text the owner must post for the next handover', t => {
  const f = fixture(t);
  const { body } = Cli.main(['designation-body', f.sliceId, 'CLAUDE_CODE', f.base], f.opts);
  assert.equal(body, '[KODJO_PILOT] DESIGNATE\nslice_id=' + f.sliceId + '\nsequence=1\nfrom_pilot=CHATGPT_WORK\nto_pilot=CLAUDE_CODE\ncheckpoint_commit=' + f.base);
  assert.throws(() => Cli.main(['designation-body', f.sliceId, 'CHATGPT_WORK', f.base], f.opts), /PILOT_DESIGNATION_REQUEST_INVALID/);
});

test('the pilot variant only reads GitHub and never commits, pushes, reacts or edits the engine', () => {
  const root = path.resolve(__dirname, '../..');
  for (const file of ['scripts/kodjo/claude-pilot.js', 'scripts/kodjo/lib/vnext-pilot-designation.js', 'scripts/kodjo/lib/vnext-pilot-review-relay.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /--method['"]?\s*,\s*['"](?:POST|PATCH|PUT|DELETE)|['"](?:commit|push|tag|update-ref|switch|checkout)['"]|reactions/i, file);
  }
});

const binding = { repository: REPO, issueNumber: 400, sliceId: 'V2-PRE-4', preparedChainHash: HASH };
function relayComment(id, verdict = 'APPROVE', overrides = {}) {
  return { id, issue_url: ISSUE_URL(400), user: { login: 'MyUncried' },
    performed_via_github_app: { slug: Pilot.CONNECTOR_SLUG },
    created_at: '2026-10-09T09:00:00Z', updated_at: '2026-10-09T09:00:00Z',
    body: `[KODJO_VNEXT] INDEPENDENT_PLAN_REVIEW\nslice_id=V2-PRE-4\nprepared_chain_hash=${HASH}\nreviewer=ChatGPT\nverdict=${verdict}\nhuman_review_performed=false`, ...overrides };
}

test('review relay waits without invoking a model and ignores other issues, hashes and authors', () => {
  const rows = [relayComment(1, 'APPROVE', { issue_url: ISSUE_URL(401) }),
    relayComment(2, 'APPROVE', { user: { login: 'someone-else' } }),
    relayComment(3, 'APPROVE', { performed_via_github_app: null }),
    relayComment(4, 'APPROVE', { body: relayComment(4).body.replace(HASH, 'b'.repeat(64)) })];
  assert.equal(Relay.discover(rows, binding).status, 'WAITING_FOR_INDEPENDENT_PLAN_REVIEW');
  assert.equal(Relay.discover([relayComment(5)], binding).comment_id, '5');
});

test('a newer refusal or an edited earlier refusal cannot be bypassed by an older approval', () => {
  assert.throws(() => Relay.discover([relayComment(10), relayComment(11, 'REVISE')], binding), /PILOT_INDEPENDENT_PLAN_REVIEW_REQUIRED/);
  assert.throws(() => Relay.discover([relayComment(10, 'REVISE', { updated_at: '2026-10-09T10:00:00Z' }), relayComment(11)], binding), /PILOT_INDEPENDENT_PLAN_REVIEW_REQUIRED/);
  const duplicate = relayComment(12); duplicate.body += '\nprepared_chain_hash=' + HASH;
  assert.throws(() => Relay.discover([relayComment(10), duplicate], binding), /PILOT_INDEPENDENT_PLAN_REVIEW_REQUIRED/);
});

test('review comments are paginated completely and a failed later page never yields partial approval', () => {
  const calls = [];
  const rows = Relay.listComments(REPO, 400, route => { calls.push(route); return calls.length === 1 ? Array(100).fill({}) : [relayComment(1001)]; });
  assert.equal(rows.length, 101); assert.match(calls[1], /page=2$/);
  assert.throws(() => Relay.listComments(REPO, 400, route => { if (route.endsWith('page=1')) return Array(100).fill(relayComment(1)); throw Error('NETWORK_DOWN'); }), /NETWORK_DOWN/);
});

test('an explicit stale comment identifier cannot override the discovered review', t => {
  const f = fixture(t); const e = f.entry(1, 'CHATGPT_WORK', 'CLAUDE_CODE', 11); f.authorize(e); f.designate([e]);
  f.write('reserve.json', { prepared_file: 'chain/prepared.json' });
  f.comments['51'] = relayComment(51); f.comments['52'] = relayComment(52);
  let invoked = false;
  assert.throws(() => Cli.main(['run', f.sliceId, '--independent-plan-review=51', 'reserve-gate', 'reserve.json'],
    { ...f.opts, invoke: () => { invoked = true; return 0; } }), /PILOT_INDEPENDENT_PLAN_REVIEW_SUPERSEDED/);
  assert.equal(invoked, false);
  assert.equal(Cli.main(['plan-review-status', f.sliceId, 'reserve-gate', 'reserve.json'], f.opts).comment_id, '52');
});

test('review request names immutable committed bytes and rejects uncommitted or corrupt plans', t => {
  const f = fixture(t); const e = f.entry(1, 'CHATGPT_WORK', 'CLAUDE_CODE', 11); f.authorize(e); f.designate([e]);
  const V = require('../../scripts/kodjo/lib/vnext-contract');
  const prepared = V.sealContract({ schema_version: 'relay-test', slice_id: f.sliceId });
  f.write('chain/prepared.json', prepared); const head = f.commit();
  f.write('reserve.json', { prepared_file: 'chain/prepared.json' });
  const request = Cli.main(['plan-review-request-body', f.sliceId, 'reserve-gate', 'reserve.json'], f.opts);
  assert.match(request.body, new RegExp('source_head=' + head));
  assert.match(request.body, new RegExp('prepared_chain_hash=' + prepared.contract_hash));
  assert.equal(request.issue_url, 'https://github.com/' + REPO + '/issues/400');
  f.write('chain/prepared.json', V.sealContract({ schema_version: 'relay-test', slice_id: 'OTHER' }));
  assert.throws(() => Cli.main(['plan-review-request-body', f.sliceId, 'reserve-gate', 'reserve.json'], f.opts), /PILOT_REVIEW_PREPARED_NOT_COMMITTED/);
  f.write('chain/prepared.json', { ...prepared, contract_hash: 'b'.repeat(64) }); f.commit();
  assert.throws(() => Cli.main(['plan-review-request-body', f.sliceId, 'reserve-gate', 'reserve.json'], f.opts), /PILOT_REVIEW_PREPARED_HASH_INVALID/);
});

test('both gate stages use bounded transport and pinned Git parts; corrupted local parts are refused', t => {
  const f = fixture(t); const e = f.entry(1, 'CHATGPT_WORK', 'CLAUDE_CODE', 11); f.authorize(e); f.designate([e]);
  const V = require('../../scripts/kodjo/lib/vnext-contract');
  const Bundle = require('../../scripts/kodjo/lib/vnext-file-bundle');
  const prepared = V.sealContract({ schema_version: 'relay-bundle-test', slice_id: f.sliceId, values: [1, 2, 3] });
  const file = path.join(f.cwd, 'chain/prepared.json');
  Bundle.write(file, prepared, { forceBundle: true }); f.commit();
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  f.write('reserve.json', { prepared_file: 'chain/prepared.json' });
  f.write('approval.json', { bootstrap_file: Pilot.bootstrapFile(f.sliceId) });
  f.comments['71'] = relayComment(71, 'APPROVE', { body: relayComment(71).body.replace(HASH, prepared.contract_hash) });
  const deps = { ...f.opts, invoke: () => 0 };
  for (const [stage, config] of [['reserve-gate', 'reserve.json'], ['request-approval', 'approval.json']]) {
    assert.equal(Cli.main(['run', f.sliceId, stage, config], deps).independent_plan_review.prepared_chain_hash, prepared.contract_hash);
    assert.match(Cli.main(['plan-review-request-body', f.sliceId, stage, config], f.opts).body, new RegExp('prepared_chain_hash=' + prepared.contract_hash));
  }
  f.write('chain/' + manifest.folder + '/' + manifest.root.file, '{}');
  assert.throws(() => Cli.main(['run', f.sliceId, 'reserve-gate', 'reserve.json'], deps), /VNEXT_BUNDLE_PART_HASH_INVALID/);
  assert.equal(Cli.main(['run', f.sliceId, 'request-approval', 'approval.json'], deps).engine_exit_code, 0,
    'request-approval reads the immutable Git blobs, not altered working parts');
});
