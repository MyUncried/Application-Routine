'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { stageDeposit } = require('../../scripts/kodjo/write-evidence-deposit');
const { isFixedEvidenceWriterOperation } = require('../../scripts/kodjo/scan-remote-write-capability');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-writer-'));
  const source = path.join(root, 'source');
  const tree = path.join(root, 'evidence-tree');
  fs.mkdirSync(source); fs.mkdirSync(tree);
  const content = 'diff --git a/a b/a\n';
  fs.writeFileSync(path.join(source, 'implementation.patch'), content);
  const request = {
    target_branch: 'kodjo/protocol-evidence-v2', target_branch_is_fixed: true,
    append_only: true, replaces_existing_path: false,
    contains_applicative_file: false, functional_ref_write_allowed: false,
    canonical_base: 'slices/SMOKE/operations/op-1/attempts/a-1/implementation',
    members: [{ member: 'implementation.patch', canonical_path: 'slices/SMOKE/operations/op-1/attempts/a-1/implementation/implementation.patch', sha256: crypto.createHash('sha256').update(content).digest('hex') }],
  };
  const requestFile = path.join(root, 'request.json');
  fs.writeFileSync(requestFile, JSON.stringify(request));
  return { request, requestFile, root, source, tree };
}

test('writer — depot nominal, hash verifie et recu cree', () => {
  const f = fixture();
  const out = stageDeposit(f.requestFile, f.source, f.tree);
  assert.equal(out.staged.length, 1);
  assert.equal(fs.existsSync(out.receiptPath), true);
});

test('writer — une branche fonctionnelle est refusee', () => {
  const f = fixture(); f.request.target_branch = 'feat/creation-seance-catalogue';
  fs.writeFileSync(f.requestFile, JSON.stringify(f.request));
  assert.throws(() => stageDeposit(f.requestFile, f.source, f.tree), { code: 'EVIDENCE_BRANCH_INVALID' });
});

test('writer — remplacer une preuve existante est refuse', () => {
  const f = fixture(); stageDeposit(f.requestFile, f.source, f.tree);
  assert.throws(() => stageDeposit(f.requestFile, f.source, f.tree), { code: 'EVIDENCE_PATH_EXISTS' });
});

test('writer — un membre applicatif integre est refuse', () => {
  const f = fixture(); f.request.members[0].member = 'src/App.tsx';
  f.request.members[0].canonical_path = f.request.canonical_base + '/src/App.tsx';
  fs.writeFileSync(f.requestFile, JSON.stringify(f.request));
  assert.throws(() => stageDeposit(f.requestFile, f.source, f.tree), { code: 'EVIDENCE_MEMBER_FORBIDDEN' });
});

test('writer — un hash faux est refuse', () => {
  const f = fixture(); f.request.members[0].sha256 = '0'.repeat(64);
  fs.writeFileSync(f.requestFile, JSON.stringify(f.request));
  assert.throws(() => stageDeposit(f.requestFile, f.source, f.tree), { code: 'EVIDENCE_HASH_MISMATCH' });
});

test('writer — seule la commande de push vers la branche fixe est exemptee', () => {
  const root = path.resolve(__dirname, '..', '..');
  const workflow = path.join(root, '.github', 'workflows', 'kodjo-v2-transition.yml');
  assert.equal(isFixedEvidenceWriterOperation(workflow, 'run: git push origin "HEAD:refs/heads/kodjo/protocol-evidence-v2"', 'GIT_PUSH', root), true);
  assert.equal(isFixedEvidenceWriterOperation(workflow, 'run: git push origin "HEAD:refs/heads/feat/creation-seance-catalogue"', 'GIT_PUSH', root), false);
  assert.equal(isFixedEvidenceWriterOperation(workflow, 'run: git push origin "HEAD:refs/heads/${{ inputs.branch }}"', 'GIT_PUSH', root), false);
});
