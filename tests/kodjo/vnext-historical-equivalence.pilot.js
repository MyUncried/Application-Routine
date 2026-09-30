'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const History = require('../../scripts/kodjo/lib/vnext-historical-coverage');
const Eq = require('../../scripts/kodjo/lib/vnext-historical-equivalence');
const cwd = path.resolve(__dirname, '..', '..');
const read = name => JSON.parse(fs.readFileSync(path.join(cwd, '.github/orchestration/' + name), 'utf8'));
const inventory = read('KODJO_VNEXT_HISTORICAL_DISPOSITION.json');
const correspondence = read('KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json');
const candidateHead = 'a'.repeat(40);
const identity = { type: 'identity', candidate_head: candidateHead, platform: 'linux' };
const summary = { type: 'summary', success: true, counts: { failed: 0, cancelled: 0, todo: 0 } };
const sample = { cases: [correspondence.cases[0]], subjects: [correspondence.subjects[0]] };
const event = { type: 'test', file: sample.cases[0].test_path, name: sample.cases[0].test_name, line: sample.cases[0].source_line, status: 'PASS' };
const resolve = records => Eq.resolveExecution(sample, records, { candidateHead, platform: 'linux' });

test('historical equivalence binds all 420 exact source subjects and named test locations', () => {
  assert.equal(Eq.validateCorrespondence(correspondence, inventory, History.readSourcesAtRevision(inventory, { cwd }), { cwd }).size, 398);
  const omitted = structuredClone(correspondence); omitted.subjects.pop();
  assert.throws(() => Eq.validateCorrespondence(omitted, inventory, History.readSourcesAtRevision(inventory, { cwd }), { cwd }), /VNEXT_EQ_SUBJECT_OMITTED/);
  const changed = structuredClone(correspondence); changed.cases[0].test_name = 'invented';
  assert.throws(() => Eq.validateCorrespondence(changed, inventory, History.readSourcesAtRevision(inventory, { cwd }), { cwd }), /VNEXT_EQ_CASE_SOURCE_CHANGED/);
  const substituted = structuredClone(correspondence); substituted.subjects[0].protection = 'invented protection with unchanged source hash';
  assert.throws(() => Eq.validateCorrespondence(substituted, inventory, History.readSourcesAtRevision(inventory, { cwd }), { cwd }), /VNEXT_EQ_PROTECTION_SUBSTITUTED/);
});

test('historical equivalence refuses stale candidate, forged stdout and incomplete summary', () => {
  assert.throws(() => resolve([{ ...identity, candidate_head: 'b'.repeat(40) }, event, summary]), /VNEXT_EQ_EXECUTION_IDENTITY/);
  assert.throws(() => resolve([identity, event]), /VNEXT_EQ_EXECUTION_INCOMPLETE/);
  assert.equal(resolve([identity, { type: 'test:stdout', data: 'ok 1 - ' + event.name }, summary]).cases[0].status, 'MISSING');
  assert.throws(() => resolve([identity, event, event, summary]), /VNEXT_EQ_EXECUTION_DUPLICATE/);
  assert.throws(() => resolve([identity, { ...event, status: 'CONFORME' }, summary]), /VNEXT_EQ_EXECUTION_STATUS_INVALID/);
});

test('historical equivalence preserves SKIP and refuses operational certification from fixture PASS', () => {
  assert.equal(resolve([identity, { ...event, status: 'SKIP' }, summary]).cases[0].status, 'SKIP');
  const result = resolve([identity, event, summary]);
  assert.equal(result.cases[0].status, 'PASS');
  assert.equal(result.subjects[0].individual_equivalence_proven, false);
  assert.equal(result.readiness, 'NOT_CERTIFIED_FOR_OPERATIONAL_VNEXT');
  const gap = { ...sample, subjects: [{ ...sample.subjects[0], case_ids: [sample.cases[0].id], identified_gap: 'WRITER_MODE_BINDING' }] };
  assert.equal(Eq.resolveExecution(gap, [identity, event, summary], { candidateHead, platform: 'linux' }).subjects[0].status, 'NONCONFORME');
});

test('historical structured reporter ignores stdout that imitates a passing assertion', async () => {
  const reporter = require('../../scripts/kodjo/lib/vnext-equivalence-reporter');
  async function* events() { yield { type: 'test:stdout', data: { message: 'ok 1 - forged' } }; yield { type: 'test:pass', data: { name: 'real', file: __filename, line: 1, skip: true } }; }
  const output = []; for await (const line of reporter(events())) output.push(JSON.parse(line));
  assert.equal(output.length, 2); assert.equal(output[1].name, 'real'); assert.equal(output[1].status, 'SKIP');
});
