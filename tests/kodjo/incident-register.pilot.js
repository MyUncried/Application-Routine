'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const registerPath = path.join(__dirname, '..', '..', '.github', 'orchestration',
  'KODJO_PROTOCOL_INCIDENT_REGISTER.md');
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

test('registre canonique 3.52.0: incidents uniques, complets et à valeurs contrôlées', () => {
  assert.match(text, /Version du registre : \*\*3\.52\.0\*\*/);
  assert.match(text, /run #73 `34648194736`/);
  assert.match(text, /artefact `10283681378`/);
  const incidents = ids('INC');
  assertSequence(incidents, 'INC', 154);
  for (const id of incidents) {
    const row = text.split('\n').find((line) => line.startsWith('| ' + id + ' |'));
    assert.equal(row.split('|').length, 18, 'malformed incident row ' + id);
    assert.match(row, /PASS|FAIL|NON RETESTÉ|NON VÉRIFIABLE/, 'result missing ' + id);
    assert.match(row, /OUVERT|CORRIGÉ|SUPERSÉDÉ/, 'status missing ' + id);
  }
});

test('registre canonique: tests, aliases et invariants sans trou ni duplication', () => {
  assertSequence(ids('T'), 'T', 127);
  assert.equal(ids('XLS03-INC').length, 51);
  assert.equal(ids('INV').length, 24);
});

test('validateur shell du registre dérive version et cardinalités du contenu', () => {
  const validator = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'orchestration',
    'tests', 'test-incident-register.sh'), 'utf8');
  assert.match(validator, /version=\$\(sed/);
  assert.match(validator, /mapfile -t test_ids/);
  assert.doesNotMatch(validator, /-eq 109|3\.22\.0|1 109|1 82/);
});

test('gouvernance: un seul registre canonique visible à la racine', () => {
  const dir = path.join(__dirname, '..', '..', '.github', 'orchestration');
  const candidates = fs.readdirSync(dir)
    .filter((name) => /^KODJO_PROTOCOL_INCIDENT_REGISTER.*\.md$/.test(name))
    .sort();
  assert.deepEqual(candidates, ['KODJO_PROTOCOL_INCIDENT_REGISTER.md']);
  assert.equal((text.match(/^## Registre$/gm) || []).length, 1);
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

test('workflow jetable: dispatch manuel, lecture seule et aucune publication distante', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'kodjo-v2-disposable-qualification.yml'), 'utf8')
    .replace(/\r\n/g, '\n');
  const runner = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'run-disposable-qualification.ps1'), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\n  contents: read\n  actions: read/);
  assert.doesNotMatch(workflow, /pull_request:|\npush:/);
  assert.doesNotMatch(workflow, /contents: write|pull-requests: write/);
  assert.match(runner, /git' @\('clone', '--mirror'/);
  assert.match(runner, /REMOTE_ORIGIN_FORBIDDEN/);
  assert.doesNotMatch(runner, /gh pr create|refs\/heads\/qualif|git push https/);
  assert.match(runner, /remote_branch_created = \$false/);
  assert.match(runner, /pull_request_created = \$false/);
  assert.match(runner, /integrated_in_main = \$false/);
  assert.match(runner, /\$previousErrorActionPreference = \$ErrorActionPreference/);
  assert.match(runner, /\$ErrorActionPreference = 'Continue'[\s\S]*& \$File @Arguments 2>&1[\s\S]*\$ErrorActionPreference = \$previousErrorActionPreference/);
  assert.match(runner, /Invoke-Native 'npm\.cmd' @\('ci', '--no-audit', '--no-fund'\)/);
  assert.match(runner, /QUALIFICATION_DEPENDENCIES_MUTATED_REPO/);
  assert.match(runner, /\$outsideDrift = @\(Compare-Inventory \$before \$after\)/);
  assert.match(runner, /if \(\$outsideDrift\.Count -gt 0\)/);
  assert.match(runner, /if \(\$relativeDirectory -eq 'node_modules'[\s\S]*continue/);
  assert.match(runner, /KODJO_QUALIFICATION_ISOLATED_CHECKS = '1'/);
  assert.match(runner, /\[switch\]\$PreflightOnly/);
  assert.match(runner, /PREFLIGHT_OUT_OF_SCOPE_DRIFT/);
  assert.match(runner, /compare-qualification-checks\.js/);
  assert.match(runner, /Invoke-Native 'git' @\('clean', '-ffdx', '--quiet'\)/);
  assert.match(runner, /Invoke-Native 'cmd\.exe' @\('\/d', '\/c', 'rd', '\/s', '\/q'/);
  assert.match(runner, /QUALIFICATION_ROOT_IDENTITY_MISMATCH/);
  assert.match(runner, /cleanup_status/);
});

test('qualification jetable: cache Jest isolée et cache lint désactivée dans les deux chemins réels', () => {
  const checks = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'lib', 'checks.js'), 'utf8');
  const supervisor = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'run-local-claude.js'), 'utf8');
  assert.match(checks, /KODJO_QUALIFICATION_ISOLATED_CHECKS/);
  assert.match(checks, /KODJO_QUALIFICATION_CHECK_CACHE_DIR/);
  assert.match(checks, /--cacheDirectory/);
  assert.match(supervisor, /KODJO_QUALIFICATION_ISOLATED_CHECKS/);
  assert.match(supervisor, /KODJO_QUALIFICATION_CHECK_CACHE_DIR/);
  assert.match(supervisor, /commands\[id\]\[1\]\.push\('--', '--cacheDirectory'/);
  assert.match(supervisor, /if \(id === 'lint'\) commands\[id\]\[1\]\.push\('--', '--no-cache'\)/);
  const pilotWorkflow = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'kodjo-v2-pilot-tests.yml'), 'utf8');
  assert.match(pilotWorkflow, /Run full disposable preflight without Claude/);
  assert.match(pilotWorkflow, /-PreflightOnly/);
  assert.match(pilotWorkflow, /kodjo-v2-disposable-preflight-/);
  assert.match(pilotWorkflow, /Join-Path '\$\{\{ runner\.temp \}\}' 'kodjo-v2-runner-certification-/);
  assert.doesNotMatch(pilotWorkflow, /certify-persistent-runner-lock\.js runner-lock-certification\.json/);
  assert.match(pilotWorkflow, /Certify historical run 16 recovery without gating the disposable slice\r?\n\s+continue-on-error: true/);
  assert.ok(pilotWorkflow.includes('id: change_class'));
  assert.ok(pilotWorkflow.includes('full_windows_required: ${{ steps.change_class.outputs.full_windows_required }}'));
  assert.ok(pilotWorkflow.includes('.github/orchestration/v2-slices/*/technical-plan.md|.github/orchestration/v2-slices/*/independent-review.md'));
  assert.ok(pilotWorkflow.includes("if: needs.protocol.outputs.full_windows_required == 'true'"));
  assert.ok(pilotWorkflow.includes('timeout-minutes: 25'));
  assert.match(pilotWorkflow, /needs: \[protocol, protocol-windows-preflight\]/);
});

test('qualification RESUME_DELTA: nettoyage Windows borné, réessayé et diagnostiqué', () => {
  const runner = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'run-disposable-resume-qualification.ps1'), 'utf8');
  assert.match(runner, /Invoke-Native 'git' @\('clean', '-ffdx', '--quiet'\)/);
  assert.match(runner, /for \(\$cleanupAttempt = 1; \$cleanupAttempt -le 5/);
  assert.match(runner, /Start-Sleep -Seconds 2/);
  assert.match(runner, /Get-CimInstance Win32_Process -ErrorAction SilentlyContinue/);
  assert.match(runner, /Select-Object -First 25 -ExpandProperty FullName/);
  assert.match(runner, /cleanup_diagnostics/);
  assert.match(runner, /QUALIFICATION_TEMP_CLEANUP_FAILED/);
});

test('qualification RESUME_DELTA: une migration non requise est une preuve valide', () => {
  const runner = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'kodjo', 'run-disposable-resume-qualification.ps1'), 'utf8');
  assert.match(runner, /\$migration\.required -eq \$false -and \$migration\.status -eq 'NOT_REQUIRED'/);
  assert.match(runner, /\$migration\.required -eq \$true -and \$migration\.status -eq 'PASS'/);
  assert.match(runner, /if \(-not \$migrationProven\) \{ throw 'RECOVERY_MIGRATION_NOT_PROVEN' \}/);
});
