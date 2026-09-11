#!/usr/bin/env node
'use strict';

/**
 * Verification de l'index avant publication — reserve 3 de la revue du lot 1.
 *
 * La publication bornee limite ce que `git add` ajoute. Elle ne prouve pas ce
 * que l'index CONTIENT au moment du commit : un contenu deja indexe, un ajout
 * concurrent ou un pathspec mal interprete resteraient invisibles. Cette etape
 * compare l'index reel, chemin par chemin, a la liste exacte autorisee par le
 * superviseur, et refuse toute divergence dans un sens comme dans l'autre.
 *
 * Usage : node scripts/kodjo/verify-staged-scope.js <pathspec.nul>
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, shell: false, maxBuffer: 64 * 1024 * 1024 });
  if (r.error || r.status !== 0) {
    throw new Error('GIT_READ_FAILED: git ' + args.join(' ') + ': ' + (r.error ? r.error.message : r.stderr));
  }
  return String(r.stdout);
}

/** Chemins autorises, lus depuis la liste NUL et debarrasses de la magie. */
function authorizedPaths(pathspecFile) {
  const raw = fs.readFileSync(pathspecFile, 'utf8');
  return raw.split('\0').filter(Boolean).map((entry) => entry.replace(/^:\(literal\)/, ''));
}

/**
 * Chemins reellement indexes. Un renommage indexe compte pour DEUX chemins :
 * l'origine disparait et la destination apparait, et les deux doivent avoir ete
 * autorises.
 */
function stagedPaths(cwd) {
  const raw = git(['diff', '--cached', '--name-status', '-z'], cwd);
  const records = raw.split('\0').filter((r) => r.length > 0);
  const out = [];
  for (let i = 0; i < records.length; i += 1) {
    const status = records[i];
    if (/^[RC]/.test(status)) {
      out.push(records[i + 1], records[i + 2]);
      i += 2;
    } else {
      out.push(records[i + 1]);
      i += 1;
    }
  }
  return [...new Set(out.filter(Boolean))];
}

function verify(pathspecFile, cwd) {
  const authorized = new Set(authorizedPaths(pathspecFile));
  const staged = stagedPaths(cwd);

  const unauthorized = staged.filter((p) => !authorized.has(p)).sort();
  if (unauthorized.length > 0) {
    throw new Error('KODJO_QUEUE_STAGED_SCOPE_VIOLATION: ' + unauthorized.join(', '));
  }
  if (staged.length === 0) throw new Error('KODJO_QUEUE_NO_DELIVERY');

  // L'ecart inverse est aussi une divergence : la publication ne correspondrait
  // pas au delta valide par le superviseur. Elle doit ECHOUER, pas se signaler.
  const missing = [...authorized].filter((p) => !staged.includes(p)).sort();
  if (missing.length > 0) {
    throw new Error('KODJO_QUEUE_STAGED_INCOMPLETE: chemins autorises absents de l\'index: ' + missing.join(', '));
  }
  return { staged: staged.sort(), authorized: [...authorized].sort(), missing };
}

if (require.main === module) {
  try {
    const [pathspecFile] = process.argv.slice(2);
    if (!pathspecFile) throw new Error('USAGE: verify-staged-scope.js <pathspec.nul>');
    const result = verify(path.resolve(pathspecFile), process.cwd());
    process.stdout.write('[KODJO_V2] index verifie: ' + result.staged.length + ' chemin(s), correspondance exacte\n');
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error) + '\n');
    process.exit(1);
  }
}

module.exports = { verify, stagedPaths, authorizedPaths };
