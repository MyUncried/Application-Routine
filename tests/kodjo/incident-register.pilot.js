'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const registerPath = path.join(__dirname, '..', '..', '.github', 'orchestration',
  'KODJO_PROTOCOL_INCIDENT_REGISTER_v3.4.0_CORRECTED.md');
const text = fs.readFileSync(registerPath, 'utf8');

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

test('registre canonique 3.8.0: incidents uniques, complets et à valeurs contrôlées', () => {
  assert.match(text, /Version du registre : \*\*3\.8\.0\*\*/);
  const incidents = ids('INC');
  assertSequence(incidents, 'INC', 89);
  for (const id of incidents) {
    const row = text.split('\n').find((line) => line.startsWith('| ' + id + ' |'));
    assert.equal(row.split('|').length, 18, 'malformed incident row ' + id);
    assert.match(row, /PASS|FAIL|NON RETESTÉ|NON VÉRIFIABLE/, 'result missing ' + id);
    assert.match(row, /OUVERT|CORRIGÉ|SUPERSÉDÉ/, 'status missing ' + id);
  }
});

test('registre canonique: tests, aliases et invariants sans trou ni duplication', () => {
  assertSequence(ids('T'), 'T', 62);
  assert.equal(ids('XLS03-INC').length, 51);
  assert.equal(ids('INV').length, 24);
});
