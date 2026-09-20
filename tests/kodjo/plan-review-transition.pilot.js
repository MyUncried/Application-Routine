'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { verifyTransition } = require('../../scripts/kodjo/verify-plan-review-transition');

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`);
  return result.stdout.trim();
}

function write(root, file, content) {
  const target = path.join(root, ...file.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function commit(root, message) {
  git(root, ['add', '--all']);
  git(root, ['commit', '-m', message]);
  return git(root, ['rev-parse', 'HEAD']);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-plan-transition-'));
  git(root, ['init']);
  git(root, ['config', 'user.email', 'kodjo@example.invalid']);
  git(root, ['config', 'user.name', 'KODJO test']);
  const bootstrapPath = '.github/orchestration/v2-slices/TEST/slice-bootstrap.json';
  const product = 'product\n';
  write(root, bootstrapPath, JSON.stringify({
    activation_registry: '.github/orchestration/v2-activation-registry.json',
    product_sources: [{
      path: 'docs/product.md',
      sha256: crypto.createHash('sha256').update(product).digest('hex'),
    }],
  }, null, 2));
  write(root, '.github/orchestration/v2-activation-registry.json', '{}\n');
  write(root, '.github/orchestration/v2-slices/TEST/planning-mission.md', 'mission\n');
  write(root, '.github/orchestration/v2-slices/TEST/technical-plan.md', 'plan\n');
  write(root, '.github/orchestration/v2-slices/TEST/independent-review.md', 'review\n');
  write(root, 'docs/product.md', product);
  write(root, 'scripts/kodjo/existing.js', 'module.exports = {};\n');
  const sourceHead = commit(root, 'product baseline');
  return { root, bootstrapPath, sourceHead };
}

function expectRefusal(input, reason) {
  assert.throws(() => verifyTransition(input), (error) => {
    assert.equal(error.message, reason);
    assert.equal(error.proof.status, 'REFUSED');
    assert.equal(error.proof.reason, reason);
    return true;
  });
}

test('cycle de vie: un plan historique traverse uniquement un delta protocolaire fermé', () => {
  const value = fixture();
  write(value.root, '.github/workflows/kodjo-v2-review.yml', 'name: protocol\n');
  write(value.root, 'scripts/kodjo/new-check.js', 'module.exports = true;\n');
  write(value.root, 'tests/kodjo/new-check.pilot.js', '// test\n');
  write(value.root, '.github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md', 'register\n');
  write(value.root, '.github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.25.md', 'spec\n');
  const executionHead = commit(value.root, 'protocol only');
  const outputPath = path.join(value.root, 'proof.json');
  const proof = verifyTransition({ ...value, executionHead, cwd: value.root, outputPath });
  assert.equal(proof.status, 'PASS');
  assert.equal(proof.source_head, value.sourceHead);
  assert.equal(proof.protocol_execution_head, executionHead);
  assert.deepEqual(proof.protocol_changes, proof.changed_paths);
  assert.ok(proof.changed_paths.includes('.github/workflows/kodjo-v2-review.yml'));
  assert.ok(proof.protected_blobs.every((item) => item.source_oid === item.execution_oid));
  assert.ok(proof.product_source_evidence.every((item) => item.transition_matches));
  assert.match(proof.policy.classifier_sha256, /^[0-9a-f]{64}$/);
  assert.equal(JSON.parse(fs.readFileSync(outputPath, 'utf8')).status, 'PASS');
});

test('cycle de vie: une empreinte déclarative historique reste tracée sans remplacer l’identité Git', () => {
  const value = fixture();
  const bootstrap = JSON.parse(fs.readFileSync(path.join(value.root, value.bootstrapPath), 'utf8'));
  bootstrap.product_sources[0].sha256 = '0'.repeat(64);
  write(value.root, value.bootstrapPath, JSON.stringify(bootstrap, null, 2));
  const historicalSource = commit(value.root, 'historical declared hash');
  write(value.root, 'scripts/kodjo/change.js', 'change\n');
  const executionHead = commit(value.root, 'protocol change');
  const proof = verifyTransition({
    cwd: value.root,
    sourceHead: historicalSource,
    executionHead,
    bootstrapPath: value.bootstrapPath,
  });
  assert.equal(proof.status, 'PASS');
  assert.equal(proof.product_source_evidence[0].declared_hash_matches_source, false);
  assert.equal(proof.product_source_evidence[0].transition_matches, true);
});

test('cycle de vie: une modification applicative intermédiaire reste refusée', () => {
  const value = fixture();
  write(value.root, 'src/application.ts', 'changed\n');
  const executionHead = commit(value.root, 'application change');
  expectRefusal({ ...value, executionHead, cwd: value.root }, 'PLAN_REVIEW_NON_PROTOCOL_CHANGE');
});

test('cycle de vie: toute entrée produit ou bootstrap modifiée impose un nouveau plan', () => {
  for (const changed of [
    'docs/product.md',
    '.github/orchestration/v2-slices/TEST/slice-bootstrap.json',
    '.github/orchestration/v2-slices/TEST/planning-mission.md',
    '.github/orchestration/v2-slices/TEST/technical-plan.md',
    '.github/orchestration/v2-slices/TEST/independent-review.md',
  ]) {
    const value = fixture();
    write(value.root, changed, `changed ${changed}\n`);
    const executionHead = commit(value.root, `change ${changed}`);
    expectRefusal({ ...value, executionHead, cwd: value.root }, 'PLAN_REVIEW_PRODUCT_INPUT_CHANGED');
  }
});

test('cycle de vie: un chemin protocolaire non ASCII est conservé et un chemin ambigu refusé', () => {
  const value = fixture();
  write(value.root, 'tests/kodjo/révision.pilot.js', '// unicode\n');
  const executionHead = commit(value.root, 'unicode protocol path');
  const proof = verifyTransition({ ...value, executionHead, cwd: value.root });
  assert.ok(proof.changed_paths.includes('tests/kodjo/révision.pilot.js'));
  const { isClosedProtocolPath } = require('../../scripts/kodjo/verify-plan-review-transition');
  assert.equal(isClosedProtocolPath('tests\\kodjo\\ambiguous.pilot.js'), false);
  assert.equal(isClosedProtocolPath('../tests/kodjo/ambiguous.pilot.js'), false);
});

test('cycle de vie: source non ancêtre et HEAD exécuté discordant sont refusés', () => {
  const value = fixture();
  write(value.root, 'scripts/kodjo/change.js', 'change\n');
  const executionHead = commit(value.root, 'protocol change');
  expectRefusal({ ...value, sourceHead: 'a'.repeat(40), executionHead, cwd: value.root },
    'PLAN_REVIEW_SOURCE_NOT_ANCESTOR');
  expectRefusal({ ...value, executionHead: value.sourceHead, cwd: value.root },
    'PLAN_REVIEW_EXECUTION_HEAD_MISMATCH');
});

test('cycle réel ef0bf111→8a091134: les seuls changements intermédiaires sont protocolaires', (t) => {
  const root = path.resolve(__dirname, '..', '..');
  const sourceHead = 'ef0bf111195d67f6223ee4844da2b6bf2aca00d2';
  const executionHead = '8a091134815be32cecaba2db37b47491904f3998';
  const present = spawnSync('git', ['cat-file', '-e', `${sourceHead}^{commit}`], {
    cwd: root, encoding: 'utf8', windowsHide: true,
  });
  if (present.status !== 0) return t.skip('source archive sans métadonnées Git');
  const targetPresent = spawnSync('git', ['cat-file', '-e', `${executionHead}^{commit}`], {
    cwd: root, encoding: 'utf8', windowsHide: true,
  });
  if (targetPresent.status !== 0) return t.skip('cible historique absente de l archive Git');
  const worktreeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-real-transition-'));
  const worktree = path.join(worktreeRoot, 'checkout');
  const added = spawnSync('git', ['worktree', 'add', '--detach', worktree, executionHead], {
    cwd: root, encoding: 'utf8', windowsHide: true,
  });
  assert.equal(added.status, 0, added.stderr);
  try {
    const proof = verifyTransition({
      cwd: worktree,
      sourceHead,
      executionHead,
      bootstrapPath: '.github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json',
    });
    assert.equal(proof.status, 'PASS');
    assert.ok(proof.changed_paths.length > 0);
  } finally {
    spawnSync('git', ['worktree', 'remove', '--force', worktree], {
      cwd: root, encoding: 'utf8', windowsHide: true,
    });
    fs.rmSync(worktreeRoot, { recursive: true, force: true });
  }
});

test('canonical implementation-review workflow dependency is protocol-only, without a wildcard extension', () => {
  const value = fixture();
  const file = '.github/workflows/kodjo-slice-implementation-review.yml';
  write(value.root, file, 'name: freeze protocol review dependencies\n');
  const executionHead = commit(value.root, 'review runtime dependency');
  assert.equal(verifyTransition({cwd:value.root,sourceHead:value.sourceHead,executionHead,bootstrapPath:value.bootstrapPath}).status,'PASS');
  const { isClosedProtocolPath } = require('../../scripts/kodjo/verify-plan-review-transition');
  for (const unknown of ['.github/workflows/kodjo-slice-implementation.yml','.github/workflows/kodjo-slice-implementation-review-other.yml','.github/workflows/unrelated.yml']) assert.equal(isClosedProtocolPath(unknown),false);
  write(value.root, 'src/application.ts', 'application change');
  const mixedHead = commit(value.root, 'mixed change');
  expectRefusal({cwd:value.root,sourceHead:value.sourceHead,executionHead:mixedHead,bootstrapPath:value.bootstrapPath},'PLAN_REVIEW_NON_PROTOCOL_CHANGE');
});
