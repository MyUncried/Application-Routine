'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { verify } = require('../../scripts/kodjo/verify-independent-protocol-audit');
const { publish, ARCHIVE_BRANCH } = require('../../scripts/kodjo/publish-independent-protocol-audit');
const root = path.resolve(__dirname, '../..');
const matrix = fs.readFileSync(path.join(root, '.github/orchestration/reports/2026-09-29_PROTOCOL_DETERMINISM_MATRIX.md'), 'utf8');
const ids = [...matrix.matchAll(/^\| ((?:P|D|T)-\d{2}|DET-\d{2}) \|/gm)].map(m => m[1]);
function report(verdict = 'REVISE', prefix = '## ') {
  const data = { schema: 'kodjo.protocol-independent-audit.v1', verdict,
    blocking_findings: verdict === 'REVISE' ? 1 : 0, major_findings: 5, minor_findings: 9,
    matrix_ids_total: 64, matrix_ids_covered: 64, matrix_ids_partial: 0,
    matrix_ids_not_covered: 0, matrix_ids_non_verifiable: 0,
    matrix_rows: ids.map(id => ({ id, status: 'COVERED', evidence: 'Exact source verified: ' + id })) };
  return prefix + 'VERDICT: ' + verdict + '\n\n<KODJO_INDEPENDENT_PROTOCOL_AUDIT_JSON>\n' +
    JSON.stringify(data) + '\n</KODJO_INDEPENDENT_PROTOCOL_AUDIT_JSON>\n';
}
function fixture() {
  const input = { repository: 'MyUncried/Application-Routine', prNumber: '250',
    candidateSha: 'a'.repeat(40), baseSha: 'b'.repeat(40), runId: '123', attempt: '1',
    sessionId: 'session-123', report: report() };
  const state = { calls: [], branch: false, file: null, comment: null, failComment: false, badReadback: false };
  const commit = 'c'.repeat(40);
  const api = async (method, endpoint, data) => {
    state.calls.push({ method, endpoint, data });
    if (method === 'GET' && endpoint.endsWith('/pulls/250')) return { head: { sha: 'd'.repeat(40), repo: { full_name: input.repository } } };
    if (method === 'GET' && endpoint.endsWith('/actions/runs/123')) return {
      head_sha: input.candidateSha, run_attempt: 1, created_at: '2026-09-29T20:00:00Z',
      path: '.github/workflows/kodjo-v2-next-evolution-independent-audit.yml' };
    if (method === 'GET' && endpoint.includes('/git/ref/heads/')) return state.branch ? { object: { sha: commit } } : null;
    if (method === 'POST' && endpoint.endsWith('/git/refs')) {
      assert.equal(data.ref, 'refs/heads/' + ARCHIVE_BRANCH);
      state.branch = true; return {};
    }
    if (endpoint.includes('/contents/')) {
      if (method === 'PUT') { state.file = data.content; return { commit: { sha: commit } }; }
      return state.file ? { content: state.badReadback ? Buffer.from('altered').toString('base64') : state.file } : null;
    }
    if (method === 'GET' && endpoint.includes('/commits?')) return [{ sha: commit }];
    if (method === 'GET' && endpoint.includes('/comments?')) return state.comment ? [state.comment] : [];
    if (method === 'POST' && endpoint.endsWith('/comments')) {
      if (state.failComment) { const error = new Error('HTTP 403'); error.status = 403; throw error; }
      state.comment = { id: 456, html_url: 'https://github.com/example/comment/456', body: data.body }; return state.comment;
    }
    if (method === 'GET' && endpoint.endsWith('/issues/comments/456')) return state.comment;
    throw new Error('Unexpected API call: ' + method + ' ' + endpoint);
  };
  return { input, state, api };
}

test('publication accepts plain and Markdown verdicts while retaining all matrix gates', () => {
  for (const prefix of ['', '# ', '## ', '###### ']) assert.equal(verify(report('REVISE', prefix)).verdict, 'REVISE');
  assert.equal(verify(report().replace(/\n/g, '\r\n')).verdict, 'REVISE');
  assert.throws(() => verify(report() + 'VERDICT: REVISE\n'), /VERDICT_MISSING_OR_DUPLICATED/);
  assert.throws(() => verify(report().replace('## VERDICT: REVISE', '## VERDICT: APPROVE')), /VERDICT_MISMATCH/);
  assert.throws(() => verify(report().replace('"matrix_ids_covered":64', '"matrix_ids_covered":63')), /MATRIX_COUNT_MISMATCH/);
  assert.throws(() => verify(report().replace('## VERDICT: REVISE', '### verdict: REVISE')), /VERDICT_MISSING_OR_DUPLICATED/);
});

test('REVISE is archived, read back and published against its exact superseded candidate', async () => {
  const { input, state, api } = fixture();
  const receipt = await publish(input, api);
  assert.equal(receipt.verdict, 'REVISE');
  assert.equal(receipt.candidate_sha, input.candidateSha);
  assert.equal(receipt.report_commit, 'c'.repeat(40));
  assert.match(receipt.report_path, /2026-09-29_INDEPENDENT_AUDIT_123_1\.md$/);
  assert.equal(receipt.comment_id, 456);
  assert.equal(state.calls.filter(c => c.method === 'PUT').length, 1);
  assert.ok(state.calls.filter(c => c.method === 'PUT').every(c => c.data.branch === ARCHIVE_BRANCH));
  assert.match(state.comment.body, /ne qualifie aucun HEAD ultérieur/);
  const repeated = await publish(input, api);
  assert.deepEqual(repeated, receipt);
  assert.equal(state.calls.filter(c => c.method === 'POST' && c.endpoint.endsWith('/comments')).length, 1);
});

test('HTTP 403 fails publication, preserves the committed report and retries without duplicate archive', async () => {
  const { input, state, api } = fixture();
  state.failComment = true;
  await assert.rejects(publish(input, api), /HTTP 403/);
  assert.ok(state.file);
  state.failComment = false;
  assert.equal((await publish(input, api)).comment_id, 456);
  assert.equal(state.calls.filter(c => c.method === 'PUT').length, 1);
});

test('invalid verdict, altered durable proof and conflicting retries refuse publication', async () => {
  let f = fixture();
  f.input.report += 'VERDICT: REVISE\n';
  await assert.rejects(publish(f.input, f.api), /VERDICT_MISSING_OR_DUPLICATED/);
  assert.equal(f.state.calls.length, 0);
  f = fixture(); f.state.badReadback = true;
  await assert.rejects(publish(f.input, f.api), /ARCHIVE_READBACK_MISMATCH/);
  assert.equal(f.state.comment, null);
  f = fixture(); await publish(f.input, f.api);
  f.input.report += '\nConflicting report';
  await assert.rejects(publish(f.input, f.api), /IMMUTABLE_PATH_CONFLICT/);
});

test('publisher rejects a mismatched source run and failed comment readback', async () => {
  let f = fixture();
  await assert.rejects(publish(f.input, async (...args) => {
    const value = await f.api(...args);
    return args[1].endsWith('/actions/runs/123') ? { ...value, head_sha: 'e'.repeat(40) } : value;
  }), /RUN_MISMATCH/);
  assert.equal(f.state.file, null);
  f = fixture();
  await assert.rejects(publish(f.input, async (...args) => {
    const value = await f.api(...args);
    return args[1].endsWith('/issues/comments/456') ? { ...value, body: 'altered' } : value;
  }), /COMMENT_READBACK_MISMATCH/);
});

test('publication-only rerun reuses the original audit attempt', async () => {
  const f = fixture();
  const receipt = await publish(f.input, async (...args) => {
    const value = await f.api(...args);
    return args[1].endsWith('/actions/runs/123') ? { ...value, run_attempt: 2 } : value;
  });
  assert.match(receipt.report_path, /AUDIT_123_1\.md$/);
});

test('workflow separates read-only auditor and durable publication; no success fallback', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/kodjo-v2-next-evolution-independent-audit.yml'), 'utf8');
  const auditor = workflow.slice(workflow.indexOf('  independent-audit:'), workflow.indexOf('  publish-evidence:'));
  const publisher = workflow.slice(workflow.indexOf('  publish-evidence:'));
  assert.doesNotMatch(auditor, /contents: write|pull-requests: write/);
  assert.doesNotMatch(auditor, /needs\.independent-audit/);
  assert.match(publisher, /contents: write/);
  assert.match(publisher, /pull-requests: write/);
  assert.match(publisher, /needs: independent-audit/);
  assert.match(publisher, /actions\/download-artifact@v4/);
  assert.match(publisher, /name: kodjo-v2-independent-audit-.*needs\.independent-audit\.outputs\.audit_attempt/);
  assert.match(publisher, /publish-independent-protocol-audit\.js/);
  assert.doesNotMatch(publisher, /claude -p|exit 0|continue-on-error/);
  assert.ok(auditor.indexOf('Independent auditor modified checkout') < auditor.indexOf('verify-independent-protocol-audit.js'));
});

test('remote writer scanner admits only the declared archive job and keeps other writes forbidden', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-audit-writer-'));
  const workflowPath = '.github/workflows/kodjo-v2-next-evolution-independent-audit.yml';
  const workflow = fs.readFileSync(path.join(root, workflowPath), 'utf8');
  const scanner = require('../../scripts/kodjo/scan-remote-write-capability');
  const permission = '      contents: write # Isolated audit evidence writer; never passed to Claude.';
  const scan = (source, filename = workflowPath) => {
    fs.rmSync(path.join(dir, '.github'), { recursive: true, force: true });
    const target = path.join(dir, filename);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source);
    const previousArgs = process.argv;
    const previousOut = process.stdout.write;
    const previousErr = process.stderr.write;
    let stdout = '', stderr = '';
    try {
      process.argv = [process.execPath, 'scan-remote-write-capability.js', dir];
      process.stdout.write = value => { stdout += value; return true; };
      process.stderr.write = value => { stderr += value; return true; };
      return { status: scanner.main(), stdout, stderr };
    } finally {
      process.argv = previousArgs;
      process.stdout.write = previousOut;
      process.stderr.write = previousErr;
    }
  };
  try {
    assert.equal(scan(workflow).status, 0);
    const hostile = [
      workflow.replace('  publish-evidence:', '  independent-audit-writer:'),
      workflow.replace(permission, '      contents: write'),
      workflow.replace('permissions:\n  contents: read', 'permissions:\n  contents: write'),
      workflow.replace('    outputs:\n', '    permissions:\n      contents: write\n    outputs:\n'),
      workflow.replace('          set -euo pipefail\n          node scripts/kodjo/publish-independent-protocol-audit.js',
        '          set -euo pipefail\n          git push origin HEAD:main\n          node scripts/kodjo/publish-independent-protocol-audit.js'),
    ];
    for (const source of hostile) {
      const result = scan(source);
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, /REMOTE_FUNCTIONAL_WRITE_CAPABILITY_FOUND/);
    }
    const otherWorkflow = scan(workflow, '.github/workflows/kodjo-v2-unregistered-writer.yml');
    assert.equal(otherWorkflow.status, 1);
    assert.match(otherWorkflow.stderr, /CONTENTS_WRITE/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
