'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const registerPath = path.join(__dirname, '..', '..', '.github', 'orchestration',
  'KODJO_PROTOCOL_INCIDENT_REGISTER_v3.4.0_CORRECTED.md');
const text = fs.readFileSync(registerPath, 'utf8');
const backlogPath = path.join(__dirname, '..', '..', '.github', 'orchestration',
  'PROTOCOL_EVOLUTION_BACKLOG.md');
const backlog = fs.readFileSync(backlogPath, 'utf8');

function ids(prefix) {
  const expression = new RegExp('^\\| (' + prefix + '-\\d{3}) \\|', 'gm');
  return [...text.matchAll(expression)].map((match) => match[1]);
}

function assertSequence(values, prefix, maximum) {
  assert.equal(values.length, maximum);
  assert.equal(new Set(values).size, maximum);
  for (let n = 1; n <= maximum; n += 1) {
    assert.ok(values.includes(prefix + '-' + String(n).padStart(3, '0')), 'missing ' + prefix + '-' + n);
  }
}

test('registre canonique 3.10.0: incidents uniques, complets et à valeurs contrôlées', () => {
  assert.match(text, /Version du registre : \*\*3\.10\.0\*\*/);
  const incidents = ids('INC');
  assertSequence(incidents, 'INC', 93);
  for (const id of incidents) {
    const row = text.split('\n').find((line) => line.startsWith('| ' + id + ' |'));
    assert.equal(row.split('|').length, 18, 'malformed incident row ' + id);
    assert.match(row, /PASS|FAIL|NON RETESTÉ|NON VÉRIFIABLE/, 'result missing ' + id);
    assert.match(row, /OUVERT|CORRIGÉ|SUPERSÉDÉ/, 'status missing ' + id);
  }
});

test('registre canonique: tests, aliases et invariants sans trou ni duplication', () => {
  assertSequence(ids('T'), 'T', 66);
  assert.equal(ids('XLS03-INC').length, 51);
  assert.equal(ids('INV').length, 24);
});

test('backlog protocolaire: IDs uniques et statuts fermés', () => {
  const rows = [...backlog.matchAll(/^\| (PE-\d{2}) \|.*?\| ([^|]+) \|/gm)];
  assert.ok(rows.length > 0);
  assert.equal(new Set(rows.map((row) => row[1])).size, rows.length);
  const allowed = new Set(['À ÉTUDIER', 'À TESTER', 'DÉMONTRÉ', 'REJETÉ']);
  for (const row of rows) assert.ok(allowed.has(row[2].trim()), 'invalid backlog status ' + row[1] + ': ' + row[2].trim());
});

test('superviseur sans double encodage UTF-8 connu', () => {
  const supervisor = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'run-local-claude.js'), 'utf8');
  assert.doesNotMatch(supervisor, /modifiÃ©s/);
  assert.match(supervisor, /fichiers modifiés/);
});

test('workflow pilote qualifie et archive le HEAD de PR, pas le merge temporaire', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'kodjo-v2-pilot-tests.yml'), 'utf8');
  const expected = 'ref: ${{ github.event.pull_request.head.sha || github.sha }}';
  assert.equal(workflow.split(expected).length - 1, 2);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$SOURCE_SHA"/);
  assert.match(workflow, /kodjo-v2-complete-source-\$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
});
