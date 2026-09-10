'use strict';

/**
 * Securite de l'etape de publication — KODJO V2 §1.2-A, §4.7 (6)-(9), §6.13-B.
 *
 * La publication ne doit jamais assembler ni interpreter une ligne de commande :
 * `gh` est lance directement, avec un vecteur d'arguments structure, en
 * `shell: false`, apres validation stricte de la cible.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const H = require('./helpers/sandbox');
const F = require('./helpers/fakes');
const { runPipeline, orderOf } = require('./helpers/pipeline');

const APP_PATCHED = 'export const VERSION = 2;\nexport const FIXED = true;\n';
const PUBLISH_SCRIPT = path.join(H.SCRIPTS, 'publish-implementation-output.js');
const { buildInvocation, redact } = require(PUBLISH_SCRIPT);

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const result = (d) => path.join(d, 'result');
const receipt = (d) => path.join(d, 'receipt');

function setup() {
  const sandbox = H.createSandbox();
  const delivery = path.join(H.tmp('kodjo-publish-'), 'delivery');
  const fakes = F.fakesDir();
  return { sandbox, delivery, fakes, counter: path.join(fakes, 'ai-calls.log') };
}

function greenChecks(fakes, tag) {
  return {
    KODJO_CHECK_CMD_JEST: F.fakeCheck(fakes, 'jest-ok-' + tag, { exitCode: 0, stdout: F.jestOutput(864, 0) }),
    KODJO_CHECK_CMD_TYPESCRIPT: F.fakeCheck(fakes, 'tsc-ok-' + tag, { exitCode: 0 }),
    KODJO_CHECK_CMD_LINT: F.fakeCheck(fakes, 'lint-ok-' + tag, { exitCode: 0 }),
  };
}

/** Run a full pipeline up to a finalized result, ready to publish. */
function finalizedDelivery(ctx, extraEnv) {
  const env = H.baseEnv(ctx.sandbox, ctx.delivery, {
    ...F.testAdapter(ctx.fakes, ctx.counter, [{ path: 'src/app.ts', content: APP_PATCHED }]),
    ...greenChecks(ctx.fakes, 'pub'),
    KODJO_SCOPE_ALLOW: 'src/**',
    ...(extraEnv || {}),
  });
  const run = runPipeline({ sandbox: ctx.sandbox, deliveryDir: ctx.delivery, env: env });
  return { env, run };
}

test.after(() => H.cleanupAll());

/* ------------------------------------------------------------------ *
 * Injection par issue_number
 * ------------------------------------------------------------------ */
test('publication — issue_number contenant une injection est refuse sans aucune execution', () => {
  const ctx = setup();
  const before = H.repoState(ctx.sandbox.dir);
  const { env } = finalizedDelivery(ctx);

  const hostile = '17; git commit -m injected';
  const res = H.runScript('publish-implementation-output.js', [ctx.delivery], {
    env: { ...env, KODJO_PUBLISH_CMD: '', KODJO_ISSUE_NUMBER: hostile, KODJO_REPOSITORY: 'OWNER/REPO' },
  });

  assert.equal(res.status, 0, 'the publication step never breaks the job');
  assert.match(res.stderr, /PUBLICATION_TARGET_INVALID/);

  const rec = readJson(path.join(receipt(ctx.delivery), 'publication-receipt.json'));
  assert.equal(rec.status, 'FAILED');
  assert.equal(rec.executable, null, 'nothing must have been executed');
  assert.ok(!('arguments' in rec), 'no argument vector must be recorded for a refused target');
  assert.match(rec.error, /PUBLICATION_TARGET_INVALID/);
  assert.equal(rec.recovery_artifact_still_available, true);

  // Refus AVANT effet : aucun commit n'a pu etre cree par l'injection.
  const after = H.repoState(ctx.sandbox.dir);
  assert.equal(after.head, before.head);
  assert.equal(after.refs, before.refs);
  assert.equal(after.reflog, before.reflog);

  // La fonction pure refuse aussi, sans rien lancer.
  const invocation = buildInvocation({ KODJO_ISSUE_NUMBER: hostile, KODJO_REPOSITORY: 'OWNER/REPO' }, 'body.txt');
  assert.equal(invocation.kind, 'REFUSED');
  assert.equal(invocation.code, 'PUBLICATION_TARGET_INVALID');
});

test('publication — seuls des entiers decimaux positifs sont acceptes comme issue_number', () => {
  const repo = 'OWNER/REPO';
  const refused = [
    '17; git commit -m injected',
    '17 && git push',
    '17|ls',
    '-17',
    '0',
    '1.5',
    '0x11',
    ' 17 x',
    '17\nrm -rf /',
    '$(id)',
    '`id`',
    '',
  ];
  for (const issue of refused) {
    const inv = buildInvocation({ KODJO_ISSUE_NUMBER: issue, KODJO_REPOSITORY: repo }, 'body.txt');
    assert.notEqual(inv.kind, 'GH', 'issue_number ' + JSON.stringify(issue) + ' must not reach gh');
  }
  for (const issue of ['1', '17', '4242']) {
    const inv = buildInvocation({ KODJO_ISSUE_NUMBER: issue, KODJO_REPOSITORY: repo }, 'body.txt');
    assert.equal(inv.kind, 'GH', 'issue_number ' + issue + ' must be accepted');
    assert.equal(inv.args[2], issue);
  }
});

test('publication — un repository invalide est refuse', () => {
  const refused = [
    'OWNER',
    'OWNER/REPO/extra',
    'OWNER REPO',
    'OWNER/REPO;whoami',
    '../etc/passwd',
    'OWNER/',
    '/REPO',
    'OWNER/RE PO',
    '',
  ];
  for (const repository of refused) {
    const inv = buildInvocation({ KODJO_ISSUE_NUMBER: '17', KODJO_REPOSITORY: repository }, 'body.txt');
    assert.notEqual(inv.kind, 'GH', 'repository ' + JSON.stringify(repository) + ' must not reach gh');
    assert.equal(inv.code, 'PUBLICATION_TARGET_INVALID');
  }
  for (const repository of ['MyUncried/Application-Routine', 'a/b', 'Owner.Name/repo_name-1']) {
    const inv = buildInvocation({ KODJO_ISSUE_NUMBER: '17', KODJO_REPOSITORY: repository }, 'body.txt');
    assert.equal(inv.kind, 'GH', 'repository ' + repository + ' must be accepted');
  }
});

/* ------------------------------------------------------------------ *
 * Execution structuree
 * ------------------------------------------------------------------ */
test('publication — une publication normale utilise gh, shell:false et des arguments structures', () => {
  const bodyFile = path.join('some', 'dir', 'implementation-output.txt');
  const inv = buildInvocation(
    { KODJO_ISSUE_NUMBER: '43', KODJO_REPOSITORY: 'MyUncried/Application-Routine' },
    bodyFile
  );

  assert.equal(inv.kind, 'GH');
  assert.equal(inv.executable, 'gh');
  assert.deepEqual(inv.args, [
    'issue',
    'comment',
    '43',
    '--repo',
    'MyUncried/Application-Routine',
    '--body-file',
    bodyFile,
  ]);
  // Chaque argument est une valeur atomique, jamais une chaine assemblee.
  for (const a of inv.args) assert.equal(typeof a, 'string');
  assert.equal(inv.args.length, 7);

  // Le script ne contient aucune execution shell.
  const source = fs.readFileSync(PUBLISH_SCRIPT, 'utf8');
  assert.doesNotMatch(source, /shell\s*:\s*true/, 'the publication step must never use shell: true');
  assert.match(source, /shell\s*:\s*false/);
  assert.doesNotMatch(source, /gh issue comment/, 'no gh command line must be assembled');
});

test('publication — le recu enregistre l executable et des arguments non sensibles, sans ligne de commande', () => {
  const ctx = setup();
  const record = path.join(ctx.fakes, 'published.txt');
  finalizedDelivery(ctx);

  const env = H.baseEnv(ctx.sandbox, ctx.delivery, { ...F.recordingPublisher(record) });
  const res = H.runScript('publish-implementation-output.js', [ctx.delivery], { env: env });
  assert.equal(res.status, 0, res.stderr);

  const rec = readJson(path.join(receipt(ctx.delivery), 'publication-receipt.json'));
  assert.equal(rec.status, 'CONFIRMED');
  assert.equal(rec.shell, false);
  assert.equal(rec.executable, 'node');
  assert.equal(rec.adapter, 'test:recording-publisher');
  assert.ok(!('command' in rec), 'the receipt must not keep a command line');
  assert.deepEqual(rec.arguments, ['tests/kodjo/adapters/recording-publisher.js', 'implementation-output.txt']);
  // Aucun chemin absolu de la machine ni donnee d'environnement.
  assert.doesNotMatch(JSON.stringify(rec.arguments), /[A-Za-z]:\\|\/home\/|\/Users\//);
  assert.match(fs.readFileSync(record, 'utf8'), /\[KODJO_SLICE\] IMPLEMENTATION_OUTPUT/);
});

test('publication — les chaines de type identifiant sont expurgees des traces conservees', () => {
  assert.equal(redact('token ghp_' + 'A'.repeat(36)), 'token [REDACTED_TOKEN]');
  assert.equal(redact('github_pat_' + 'B'.repeat(30)), '[REDACTED_TOKEN]');
  assert.match(redact('Authorization: Bearer abcdef123456'), /Authorization \[REDACTED\]/);
  assert.equal(redact('HTTP 503: comment API unavailable'), 'HTTP 503: comment API unavailable');
});

/* ------------------------------------------------------------------ *
 * Confinement de KODJO_PUBLISH_CMD
 * ------------------------------------------------------------------ */
test('publication — une commande de publication arbitraire est refusee hors mode test', () => {
  const ctx = setup();
  const marker = path.join(ctx.fakes, 'publish-executed.txt');
  finalizedDelivery(ctx);

  const arbitrary =
    JSON.stringify(process.execPath) +
    ' -e ' +
    JSON.stringify('require("fs").writeFileSync(' + JSON.stringify(marker) + ',"x")');

  // (a) sans le drapeau de test : refus.
  const withoutFlag = H.runScript('publish-implementation-output.js', [ctx.delivery], {
    env: H.baseEnv(ctx.sandbox, ctx.delivery, {
      KODJO_ALLOW_TEST_ADAPTER: '',
      KODJO_PUBLISH_CMD: arbitrary,
    }),
  });
  assert.equal(withoutFlag.status, 0);
  assert.match(withoutFlag.stderr, /ADAPTER_COMMAND_NOT_ALLOWED|TEST_ADAPTER_NOT_ENABLED/);
  assert.equal(fs.existsSync(marker), false, 'the arbitrary command must never be executed');

  // (b) avec le drapeau de test : toujours refuse, ce n'est pas un identifiant confine.
  const withFlag = H.runScript('publish-implementation-output.js', [ctx.delivery], {
    env: H.baseEnv(ctx.sandbox, ctx.delivery, {
      KODJO_ALLOW_TEST_ADAPTER: '1',
      KODJO_PUBLISH_CMD: arbitrary,
    }),
  });
  assert.equal(withFlag.status, 0);
  assert.match(withFlag.stderr, /ADAPTER_COMMAND_NOT_ALLOWED/);
  assert.equal(fs.existsSync(marker), false);

  // (c) un identifiant de test valide sans le drapeau : refuse egalement.
  const idWithoutFlag = buildInvocation({ KODJO_PUBLISH_CMD: 'test:failing-publisher' }, 'body.txt');
  assert.equal(idWithoutFlag.kind, 'REFUSED');
  assert.equal(idWithoutFlag.code, 'TEST_ADAPTER_NOT_ENABLED');

  // (d) evasion de chemin refusee.
  for (const bad of ['test:../../scripts/kodjo/check-scope', 'test:a/b', 'test:', 'test:absent']) {
    const inv = buildInvocation({ KODJO_PUBLISH_CMD: bad, KODJO_ALLOW_TEST_ADAPTER: '1' }, 'body.txt');
    assert.equal(inv.kind, 'REFUSED', bad + ' must be refused');
  }

  // Le recu du dernier refus existe et ne masque pas l'artefact.
  const rec = readJson(path.join(receipt(ctx.delivery), 'publication-receipt.json'));
  assert.equal(rec.status, 'FAILED');
  assert.equal(rec.recovery_artifact_still_available, true);
});

/* ------------------------------------------------------------------ *
 * Un echec de publication ne masque jamais l'artefact
 * ------------------------------------------------------------------ */
test('publication — un echec produit toujours son recu et ne masque pas l artefact', () => {
  const ctx = setup();
  const { run } = finalizedDelivery(ctx, { ...F.failingPublisher() });

  const rec = readJson(path.join(receipt(ctx.delivery), 'publication-receipt.json'));
  assert.equal(rec.status, 'FAILED');
  assert.equal(rec.shell, false);
  assert.equal(rec.executable, 'node');
  assert.equal(rec.recovery_artifact_still_available, true);
  assert.equal(rec.ai_call_made, false);
  assert.equal(rec.recovery, 'REPUBLISH_EXISTING');

  // Le recu est televerse dans son propre artefact, apres la tentative.
  assert.equal(run.byId.publish.status, 0);
  assert.equal(run.byId.receipt_upload.status, 0);
  assert.ok(orderOf(run, 'receipt_upload') > orderOf(run, 'publish'));
  assert.ok(fs.existsSync(path.join(run.artifacts.receipt.dir, 'publication-receipt.json')));

  // L'artefact de recuperation, televerse avant les controles, reste intact.
  const stored = run.artifacts.recovery.dir;
  assert.ok(fs.existsSync(path.join(stored, 'implementation.patch')));
  const uploaded = readJson(path.join(stored, 'manifest.json'));
  assert.ok(!('publication' in uploaded));
  assert.equal(uploaded.status_finalized, false);
  assert.equal(
    readJson(path.join(result(ctx.delivery), 'manifest.json')).implementation_status,
    'IMPLEMENTED_AND_VERIFIED'
  );
});

/* ------------------------------------------------------------------ *
 * Exception shell:true documentee et prouvee
 * ------------------------------------------------------------------ */
test('exception shell — le scanner signale shell:true sauf l exception justifiee', () => {
  const scanner = require(path.join(H.SCRIPTS, 'scan-remote-write-capability.js'));
  const shellPattern = scanner.PATTERNS.find((p) => p.id === 'SHELL_EXECUTION');
  assert.ok(shellPattern, 'the scanner must look for shell: true');
  assert.ok(shellPattern.re.test('    shell: true,'));

  // Une seule exception, documentee.
  assert.deepEqual(Object.keys(scanner.SHELL_TRUE_EXEMPTIONS), ['scripts/kodjo/lib/checks.js']);
  assert.match(scanner.SHELL_TRUE_EXEMPTIONS['scripts/kodjo/lib/checks.js'], /KODJO_ALLOW_TEST_ADAPTER/);

  // Le depot est propre et l'exception est annoncee dans la sortie.
  const scan = H.runScript('scan-remote-write-capability.js', [H.REPO_ROOT], {});
  assert.equal(scan.status, 0, scan.stderr);
  assert.match(scan.stdout, /SHELL_EXECUTION exemption — scripts\/kodjo\/lib\/checks\.js/);
  assert.match(scan.stdout, /NO_REMOTE_FUNCTIONAL_WRITE_CAPABILITY/);

  // Un shell:true non exempte serait bien signale.
  const fakeRoot = H.tmp('kodjo-scanfixture-');
  fs.mkdirSync(path.join(fakeRoot, 'scripts', 'kodjo'), { recursive: true });
  fs.writeFileSync(
    path.join(fakeRoot, 'scripts', 'kodjo', 'offender.js'),
    "spawnSync(cmd, { shell: true });\n",
    'utf8'
  );
  const scanBad = H.runScript('scan-remote-write-capability.js', [fakeRoot], {});
  assert.equal(scanBad.status, 1);
  assert.match(scanBad.stderr, /SHELL_EXECUTION — scripts\/kodjo\/offender\.js/);
});

test('exception shell — aucune entree de workflow ne peut remplacer les commandes fixes', () => {
  const { parse } = require(path.join(H.SCRIPTS, 'lib', 'yaml.js'));
  const wfPath = path.join(H.REPO_ROOT, '.github', 'workflows', 'kodjo-v2-implementation-artifact.yml');
  const source = fs.readFileSync(wfPath, 'utf8');
  const wf = parse(source);

  // Le drapeau qui autorise un remplacement n'existe nulle part dans le workflow.
  assert.doesNotMatch(source, /KODJO_ALLOW_TEST_ADAPTER/);
  assert.doesNotMatch(source, /KODJO_CHECK_CMD_/);
  assert.doesNotMatch(source, /KODJO_PUBLISH_CMD/);

  // Aucune entree de dispatch ne porte un nom capable d'atteindre ces variables.
  const inputs = Object.keys(wf.on.workflow_dispatch.inputs);
  for (const name of inputs) {
    assert.doesNotMatch(name, /check_cmd|publish_cmd|allow_test|agent_cmd/i, 'unsafe input: ' + name);
  }
  assert.deepEqual(
    inputs.sort(),
    [
      'agent_adapter',
      'failed_checks',
      'issue_number',
      'mode',
      'slice_bootstrap_file',
      'slice_bootstrap_sha256',
      'scope_allow',
      'source_artifact_sha256',
      'source_head',
      'source_recovery_artifact',
      'source_result_artifact',
      'source_run_id',
      'slice_id',
    ].sort()
  );

  // Les commandes fixes du depot sont bien celles du package.json.
  const { DEFAULT_COMMANDS } = require(path.join(H.SCRIPTS, 'lib', 'checks.js'));
  assert.equal(DEFAULT_COMMANDS.jest, 'npm test --silent');
  assert.equal(DEFAULT_COMMANDS.lint, 'npm run lint --silent');
  assert.match(DEFAULT_COMMANDS.typescript, /^npx --no-install tsc --noEmit$/);
});
