'use strict';

/**
 * Delta et périmètre — KV2-02, KV2-07.
 *
 * L'audit indépendant du 2026-09-10 a démontré, jusqu'à la PR poussée, qu'un
 * renommage sortant du périmètre traversait le contrôle : `--porcelain=v1` rend
 * `origine -> destination` sur une seule ligne, et `line.slice(3)` en faisait un
 * chemin composite qui commençait par le périmètre autorisé. Les chemins non
 * ASCII étaient par ailleurs échappés en octal et jamais retrouvés sur disque.
 *
 * Ces essais exercent le vrai parseur du superviseur sur un vrai dépôt Git.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const {
  changedEntries, changedFiles, inScope, writePublishablePathspec,
  deltaFingerprint, fingerprintDrift,
} = require(
  path.join(root, 'scripts', 'kodjo', 'run-local-claude.js')
);

const SCOPE = ['src/domain/**'];

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, 'git ' + args.join(' ') + ': ' + r.stderr);
  return r.stdout;
}

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kodjo-delta-'));
  git(['init', '-q', '.'], dir);
  git(['config', 'user.email', 'delta@test.local'], dir);
  git(['config', 'user.name', 'delta'], dir);
  git(['config', 'core.autocrlf', 'false'], dir);
  fs.mkdirSync(path.join(dir, 'src', 'domain'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'secrets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'a.ts'), 'export const a = 1;\n');
  fs.writeFileSync(path.join(dir, 'secrets', '.gitkeep'), '');
  git(['add', '-A'], dir);
  git(['commit', '-qm', 'base'], dir);
  return dir;
}

const outOfScope = (dir) => changedFiles(dir).filter((f) => !inScope(f, SCOPE));

/** Lecture de l'index sans échappement octal : `--name-only` seul quote les
 *  chemins non ASCII, ce qui est exactement le piège corrigé par KV2-02. */
function stagedPaths(dir) {
  return git(['diff', '--cached', '--name-only', '-z'], dir).split('\0').filter(Boolean).sort();
}

test('renommage interne au périmètre : accepté, origine et destination conservées', () => {
  const dir = repo();
  git(['mv', 'src/domain/a.ts', 'src/domain/b.ts'], dir);
  const entries = changedEntries(dir);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].kind, 'RENAMED');
  assert.equal(entries[0].path, 'src/domain/b.ts');
  assert.equal(entries[0].origPath, 'src/domain/a.ts');
  assert.deepEqual(changedFiles(dir).sort(), ['src/domain/a.ts', 'src/domain/b.ts']);
  assert.deepEqual(outOfScope(dir), []);
});

test('renommage sortant du périmètre : la destination est refusée', () => {
  const dir = repo();
  git(['mv', 'src/domain/a.ts', 'secrets/exfiltrated.ts'], dir);
  // Aucun chemin composite : c'est ce qui laissait passer la violation.
  for (const f of changedFiles(dir)) assert.equal(f.includes(' -> '), false, f);
  assert.deepEqual(outOfScope(dir), ['secrets/exfiltrated.ts']);
});

test('renommage entrant dans le périmètre : l’origine est refusée', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'secrets', 'source.ts'), 'x\n');
  git(['add', '-A'], dir);
  git(['commit', '-qm', 'ajout hors périmètre'], dir);
  git(['mv', 'secrets/source.ts', 'src/domain/imported.ts'], dir);
  assert.deepEqual(outOfScope(dir), ['secrets/source.ts']);
});

test('copie indexée : les deux chemins sont contrôlés', () => {
  const dir = repo();
  fs.copyFileSync(path.join(dir, 'src', 'domain', 'a.ts'), path.join(dir, 'secrets', 'copie.ts'));
  git(['add', '-A'], dir);
  const files = changedFiles(dir);
  assert.ok(files.includes('secrets/copie.ts'), JSON.stringify(files));
  assert.deepEqual(outOfScope(dir), ['secrets/copie.ts']);
});

test('chemins accentués, avec espace et avec guillemet : livrés verbatim', () => {
  const dir = repo();
  const noms = ['café bilatéral.ts', 'avec "guillemet".ts', 'deux  espaces.ts'];
  for (const nom of noms) fs.writeFileSync(path.join(dir, 'src', 'domain', nom), 'x\n');
  const files = changedFiles(dir);
  for (const nom of noms) {
    const attendu = 'src/domain/' + nom;
    assert.ok(files.includes(attendu), 'chemin manquant : ' + attendu + ' — vus : ' + JSON.stringify(files));
    // Le chemin doit exister réellement : c'est ce que l'échappement octal cassait,
    // au point que le fichier était enregistré comme supprimé dans le paquet.
    assert.ok(fs.existsSync(path.resolve(dir, attendu)), 'chemin non résolvable : ' + attendu);
  }
  assert.deepEqual(outOfScope(dir), []);
});

test('fichier non suivi dans le périmètre : conservé, jamais signalé hors périmètre', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'nouveau.ts'), 'x\n');
  const entries = changedEntries(dir);
  assert.equal(entries.find((e) => e.path === 'src/domain/nouveau.ts').kind, 'UNTRACKED');
  assert.deepEqual(outOfScope(dir), []);
});

test('suppression et modification simultanées restent distinguées', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'garde.ts'), 'y\n');
  git(['add', '-A'], dir);
  git(['commit', '-qm', 'seconde base'], dir);
  fs.unlinkSync(path.join(dir, 'src', 'domain', 'a.ts'));
  fs.appendFileSync(path.join(dir, 'src', 'domain', 'garde.ts'), 'z\n');
  const kinds = Object.fromEntries(changedEntries(dir).map((e) => [e.path, e.kind]));
  assert.equal(kinds['src/domain/a.ts'], 'CHANGED');
  assert.equal(kinds['src/domain/garde.ts'], 'CHANGED');
});

test('la liste publiable est écrite en NUL et exploitable par git', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'café bilatéral.ts'), 'x\n');
  fs.unlinkSync(path.join(dir, 'src', 'domain', 'a.ts'));
  const target = path.join(dir, 'publish.nul');
  process.env.KODJO_PUBLISH_PATHSPEC_FILE = target;
  try {
    const written = writePublishablePathspec(changedFiles(dir).sort());
    assert.equal(written, target);
    const raw = fs.readFileSync(target);
    assert.equal(raw.includes(0x0a), false, 'aucun saut de ligne : le délimiteur est NUL');
    // git doit accepter cette liste telle quelle, sans concaténation de commande.
    const add = spawnSync('git',
      ['add', '--all', '--pathspec-from-file=' + target, '--pathspec-file-nul'],
      { cwd: dir, encoding: 'utf8' });
    assert.equal(add.status, 0, add.stderr);
    assert.deepEqual(stagedPaths(dir), ['src/domain/a.ts', 'src/domain/café bilatéral.ts']);
  } finally {
    delete process.env.KODJO_PUBLISH_PATHSPEC_FILE;
  }
});

test('un contenu pré-indexé hors périmètre ne survit pas à la publication bornée', () => {
  // `git add` avec un pathspec n'annule pas ce qui est déjà indexé : sans remise
  // à zéro préalable de l'index, la publication bornée est contournable.
  const dir = repo();
  git(['mv', 'src/domain/a.ts', 'secrets/preindexed.ts'], dir);
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'legitime.ts'), 'x\n');
  const target = path.join(dir, 'publish.nul');
  fs.writeFileSync(target, 'src/domain/legitime.ts\0');

  const sansReset = spawnSync('git',
    ['add', '--all', '--pathspec-from-file=' + target, '--pathspec-file-nul'],
    { cwd: dir, encoding: 'utf8' });
  assert.equal(sansReset.status, 0, sansReset.stderr);
  assert.ok(stagedPaths(dir).includes('secrets/preindexed.ts'),
    'le renommage pré-indexé doit bien être présent sans remise à zéro');

  git(['reset', '--quiet'], dir);
  const avecReset = spawnSync('git',
    ['add', '--all', '--pathspec-from-file=' + target, '--pathspec-file-nul'],
    { cwd: dir, encoding: 'utf8' });
  assert.equal(avecReset.status, 0, avecReset.stderr);
  assert.deepEqual(stagedPaths(dir), ['src/domain/legitime.ts']);
});

test('le script de publication remet l’index à zéro avant l’ajout borné', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'run-queued-request.ps1'), 'utf8');
  assert.doesNotMatch(source, /git add --all\s*$/m, 'aucun git add --all non borné');
  assert.match(source, /git reset --quiet/);
  assert.match(source, /--pathspec-from-file=\$publishPathspec --pathspec-file-nul/);
  const resetIndex = source.indexOf('git reset --quiet');
  const addIndex = source.indexOf('--pathspec-from-file');
  assert.ok(resetIndex > 0 && resetIndex < addIndex, 'la remise à zéro précède l’ajout');
});

/* ================================================================== *
 * Réserves de la revue du lot 1
 * ================================================================== */

test('réserve 1 · un chemin contenant un joker ne capture pas son voisin', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'glob*.ts'), 'a\n');
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'globVOISIN.ts'), 'b\n');
  git(['add', '-A'], dir);
  git(['commit', '-qm', 'ajout'], dir);
  fs.appendFileSync(path.join(dir, 'src', 'domain', 'glob*.ts'), 'x\n');
  fs.appendFileSync(path.join(dir, 'src', 'domain', 'globVOISIN.ts'), 'y\n');

  const target = path.join(dir, 'publish.nul');
  process.env.KODJO_PUBLISH_PATHSPEC_FILE = target;
  try {
    writePublishablePathspec(['src/domain/glob*.ts']);
    // La magie littérale doit être écrite dans le fichier.
    assert.match(fs.readFileSync(target, 'utf8'), /^:\(literal\)src\/domain\/glob\*\.ts/);
    const add = spawnSync('git',
      ['add', '--all', '--pathspec-from-file=' + target, '--pathspec-file-nul'],
      { cwd: dir, encoding: 'utf8' });
    assert.equal(add.status, 0, add.stderr);
    assert.deepEqual(stagedPaths(dir), ['src/domain/glob*.ts'],
      'le voisin ne doit jamais être capturé par le motif');
  } finally {
    delete process.env.KODJO_PUBLISH_PATHSPEC_FILE;
  }
});

test('réserve 2 · une modification, une suppression ou une disparition sont détectées', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'x.ts'), 'v1\n');
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'y.ts'), 'v1\n');
  const paths = ['src/domain/x.ts', 'src/domain/y.ts'];
  const avant = deltaFingerprint(dir, paths);

  // Aucun changement : aucune dérive.
  assert.deepEqual(fingerprintDrift(avant, deltaFingerprint(dir, paths)), []);

  // Modification de contenu, ensemble de chemins inchangé : c'est le cas que la
  // comparaison d'ensembles ne voyait pas.
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'x.ts'), 'v2\n');
  assert.deepEqual(fingerprintDrift(avant, deltaFingerprint(dir, paths)), ['MODIFIE:src/domain/x.ts']);

  // Suppression du fichier.
  fs.unlinkSync(path.join(dir, 'src', 'domain', 'y.ts'));
  const apres = deltaFingerprint(dir, paths);
  assert.ok(apres['src/domain/y.ts'] === 'ABSENT');
  assert.ok(fingerprintDrift(avant, apres).includes('SUPPRIME:src/domain/y.ts'));

  // Disparition du chemin de l'ensemble observé.
  assert.deepEqual(
    fingerprintDrift(avant, deltaFingerprint(dir, ['src/domain/x.ts'])).sort(),
    ['DISPARU:src/domain/y.ts', 'MODIFIE:src/domain/x.ts']
  );

  // Apparition d'un chemin.
  assert.ok(fingerprintDrift(avant, deltaFingerprint(dir, paths.concat('src/domain/z.ts')))
    .includes('APPARU:src/domain/z.ts'));
});

test('réserve 3 · l’index final est comparé aux chemins autorisés', () => {
  const V = require(path.join(root, 'scripts', 'kodjo', 'verify-staged-scope.js'));
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'ok.ts'), 'x\n');
  const target = path.join(dir, 'publish.nul');
  fs.writeFileSync(target, ':(literal)src/domain/ok.ts\0');

  // Un contenu indexé par un autre chemin que ceux autorisés est refusé, même si
  // l'ajout borné n'en est pas la cause.
  git(['add', 'src/domain/ok.ts'], dir);
  fs.writeFileSync(path.join(dir, 'secrets', 'intrus.ts'), 'y\n');
  git(['add', 'secrets/intrus.ts'], dir);
  assert.throws(() => V.verify(target, dir), /KODJO_QUEUE_STAGED_SCOPE_VIOLATION: secrets\/intrus\.ts/);

  git(['reset', '--quiet'], dir);
  git(['add', 'src/domain/ok.ts'], dir);
  assert.deepEqual(V.verify(target, dir).staged, ['src/domain/ok.ts']);

  // Un index vide ne produit jamais de livraison.
  git(['reset', '--quiet'], dir);
  assert.throws(() => V.verify(target, dir), /KODJO_QUEUE_NO_DELIVERY/);
});

test('réserve 3 · un renommage indexé fait contrôler ses deux chemins', () => {
  const V = require(path.join(root, 'scripts', 'kodjo', 'verify-staged-scope.js'));
  const dir = repo();
  git(['mv', 'src/domain/a.ts', 'secrets/deplace.ts'], dir);
  const target = path.join(dir, 'publish.nul');
  fs.writeFileSync(target, ':(literal)src/domain/a.ts\0');
  assert.throws(() => V.verify(target, dir), /KODJO_QUEUE_STAGED_SCOPE_VIOLATION: secrets\/deplace\.ts/);
});

test('réserve 4 · le script refuse une mutation du dépôt causée par npm ci', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'run-queued-request.ps1'), 'utf8');
  assert.match(source, /KODJO_QUEUE_DEPENDENCIES_MUTATED_REPO/);
  const install = source.indexOf('npm ci --no-audit --no-fund');
  const guard = source.indexOf('KODJO_QUEUE_DEPENDENCIES_MUTATED_REPO');
  const claude = source.indexOf('start-kodjo-v2.ps1');
  assert.ok(install > 0 && install < guard, 'la garde suit l’installation');
  assert.ok(guard < claude, 'la garde précède l’appel Claude');
});

test('réserve 3 · le script vérifie l’index avant de committer', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'run-queued-request.ps1'), 'utf8');
  assert.match(source, /verify-staged-scope\.js/);
  const verify = source.indexOf('verify-staged-scope.js');
  const commit = source.indexOf('commit -m');
  assert.ok(verify > 0 && verify < commit, 'la vérification précède le commit');
});

test('B1 · le jeton est retiré de la configuration sur tous les chemins de sortie', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'run-queued-request.ps1'), 'utf8');
  assert.match(source, /git config --local --unset-all http\.https:\/\/github\.com\/\.extraheader/);
  const pose = source.indexOf('git config --local http.https://github.com/.extraheader');
  const bloc = source.indexOf('try {', pose - 200);
  const retrait = source.indexOf('--unset-all http.https://github.com/.extraheader');
  const finallyIdx = source.indexOf('finally {', pose);
  assert.ok(bloc > 0 && bloc < pose, 'la pose est dans un try');
  assert.ok(finallyIdx > 0 && finallyIdx < retrait, 'le retrait est dans le finally');
  // Le push et la création de PR sont à l'intérieur du bloc protégé.
  assert.ok(source.indexOf('git push --set-upstream') > bloc);
  assert.ok(source.indexOf('gh pr create') < finallyIdx);
});

test('B1 · le scanner voit désormais un en-tête d’autorisation', () => {
  const scanner = fs.readFileSync(
    path.join(root, 'scripts', 'kodjo', 'scan-remote-write-capability.js'), 'utf8');
  assert.match(scanner, /GIT_CREDENTIAL_HEADER/);
  // Le verdict ne prétend plus qu'aucune écriture distante n'existe.
  assert.match(scanner, /NO_UNDECLARED_REMOTE_WRITE_CAPABILITY/);
  assert.doesNotMatch(scanner, /'NO_REMOTE_FUNCTIONAL_WRITE_CAPABILITY'/);
});

test('B2 · la preuve d’invocation porte les bornes effectives', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'kodjo', 'run-local-claude.js'), 'utf8');
  assert.match(source, /limits_effective: request\.limits/);
  assert.match(source, /claude_adapter_defaults_sha256/);
  // Le hash de configuration est calculé sur les bornes effectives, non sur les
  // valeurs par défaut : un run à 40 tours ne peut plus produire le hash d'un
  // run à 12.
  const { adapterConfig, sha256 } = require(path.join(root, 'scripts', 'kodjo', 'lib', 'claude-local.js'));
  const h = (limits) => sha256(JSON.stringify({ config: adapterConfig(), limits_effective: limits }));
  assert.notEqual(h({ max_turns: 12 }), h({ max_turns: 40 }));
});

test('réserve 3 · un chemin autorisé absent de l’index fait échouer', () => {
  // Un index incomplet ne correspond pas au delta validé par le superviseur :
  // publier serait livrer autre chose que ce qui a été vérifié.
  const V = require(path.join(root, 'scripts', 'kodjo', 'verify-staged-scope.js'));
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'un.ts'), 'x\n');
  fs.writeFileSync(path.join(dir, 'src', 'domain', 'deux.ts'), 'y\n');
  const target = path.join(dir, 'publish.nul');
  fs.writeFileSync(target, ':(literal)src/domain/un.ts\0:(literal)src/domain/deux.ts\0');

  git(['add', 'src/domain/un.ts'], dir);
  assert.throws(() => V.verify(target, dir),
    /KODJO_QUEUE_STAGED_INCOMPLETE: chemins autorises absents de l'index: src\/domain\/deux\.ts/);

  git(['add', 'src/domain/deux.ts'], dir);
  assert.deepEqual(V.verify(target, dir).staged, ['src/domain/deux.ts', 'src/domain/un.ts']);
});
