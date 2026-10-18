// Lot 3 — restauration des identifiants effacés par la consolidation 7a89220f (hors ch. 07, traité au lot 1).
// Usage : node appliquer-lot3-identifiants.mjs <racine> --groupe=3a|3b [--appliquer]
//   sans --appliquer : plan seul (TSV sur stdout), aucune écriture.
// Critère strict (corrige le défaut A1 de la révision 2) : une ligne actuelle C n'est remplacée par sa ligne
// d'origine O (7a89220f^) que si C s'obtient à partir de O en SUPPRIMANT uniquement des identifiants et leur
// ponctuation de liaison. Aucun autre caractère ne diffère : aucune modification légitime n'est annulée.
//   3a : identifiants FMT-nn, RM-FMT-nn, REC, DEC, SRC, CAD, CIR, RM-nnn, CE-… (sans renvoi D-nnn perdu)
//        + 42 titres « ### RM- » (appariés par l'ancre fmt-nn qui les précède)
//        + table des recettes Formats du ch. 10 (colonnes Repère et Exigences de la spécification d'origine §11)
//   3b : lignes dont au moins un renvoi D-nnn a été effacé (question Q-O)
// Exclusions : ch. 07 ; lignes modifiées par les PR ouvertes #363, #370, #371 ; lignes ambiguës.
import { execFileSync } from 'child_process';
import fs from 'fs'; import path from 'path';
const repo = process.argv[2];
const groupe = (process.argv.find(a => a.startsWith('--groupe=')) || '').split('=')[1];
const appliquer = process.argv.includes('--appliquer');
if (!['3a', '3b'].includes(groupe)) { console.error('--groupe=3a|3b requis'); process.exit(2); }
const git = (...a) => execFileSync('git', ['-C', repo, '-c', 'core.quotepath=off', ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const SF = 'docs/Specifications-fonctionnelles';
const IDS = String.raw`(?:RM-|CE-)?FMT-\d+(?:[–-]\d+)?|D-\d{3}(?:[–-]\d{3})?|DEC-\d+|REC-\d+(?:[–-]\d+)?|SRC-\d+|CAD-\d+|CIR-\d+|RM-\d{3}[a-z]?|CE-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+`;
const ID_G = new RegExp(`\\b(?:${IDS})`, 'g');
const D_G = /\bD-\d{3}(?:[–-]\d{3})?/g;

// Lignes retirées par les PR ouvertes (texte exact), pour ne pas toucher les mêmes lignes.
const prBranches = ['docs/figma-44-captures-2026-10-15', 'docs/phases-exercice-20261016', 'docs/clarifications-q11-q18-20261016'];
const touchedByPR = new Set();
for (const b of prBranches) for (const l of git('diff', `6656fefc...origin/${b}`, '--', SF).split('\n')) if (l.startsWith('-') && !l.startsWith('---')) touchedByPR.add(l.slice(1).replace(/\r$/, ''));

// Suppressions seules : renvoie les segments supprimés si C est une sous-suite de O, sinon null.
function deletions(O, C) {
  const runs = []; let i = 0, j = 0, cur = '';
  while (i < O.length) {
    if (j < C.length && O[i] === C[j]) { if (cur) { runs.push(cur); cur = ''; } i++; j++; }
    else { cur += O[i]; i++; }
  }
  if (cur) runs.push(cur);
  return j === C.length ? runs : null;
}
const onlyIds = runs => {
  const all = runs.join(' ');
  if (!all.match(ID_G)) return false;
  const rest = all.replace(ID_G, '').replace(/\bet\b/g, '');
  return /^[\s()[\],;:/.–\-]*$/.test(rest);
};

const files = git('ls-tree', '--name-only', 'HEAD', `${SF}/`).trim().split('\n').filter(f => /\/\d\d – .*\.md$/.test(f) && !/\/07 – /.test(f));
const plan = []; const writes = new Map();
for (const f of files) {
  const abs = path.join(repo, f); const raw = fs.readFileSync(abs, 'utf8'); const E = raw.includes('\r\n') ? '\r\n' : '\n';
  const C = raw.split(/\r?\n/); const O = git('show', `7a89220f^:${f}`).split(/\r?\n/);
  const Oset = new Set(O); const name = f.split('/').pop();
  let changed = false;

  if (groupe === '3a' && /\/10 – /.test(f)) {
    // Titres « ### RM- » : appariement par l'ancre fmt-nn qui précède (vérifié identique à 7a89220f^).
    for (let k = 0; k < C.length; k++) if (/^### RM-\s*$/.test(C[k])) {
      const a = (C.slice(Math.max(0, k - 3), k).join(' ').match(/<a id="fmt-(\d+)"><\/a>/) || [])[1];
      const exp = a && `### RM-FMT-${a}`;
      if (exp && O.includes(exp)) { plan.push([name, k + 1, 'TITRE_RM_FMT', `RM-FMT-${a}`, C[k], exp]); C[k] = exp; changed = true; }
      else plan.push([name, k + 1, 'TITRE_NON_APPARIE', '', C[k], '']);
    }
    // Table des recettes Formats : colonnes Repère et Exigences de la spécification d'origine (§11).
    const S = git('show', `7a89220f^:${SF}/SPECIFICATION-FORMATS-SEANCES-2026-10-14.md`).split(/\r?\n/);
    const rec = new Map(); S.filter(l => /^\| REC-\d+ \|/.test(l)).forEach(l => { const c = l.split('|').slice(1, -1).map(x => x.trim()); rec.set(`${c[1]}|${c[2]}`, c); });
    const h = C.findIndex((l, k) => l === '| Situation | Attendu |' && rec.has(C[k + 2]?.split('|').slice(1, -1).map(x => x.trim()).join('|')));
    if (h >= 0) {
      const hs = S.find(l => l.startsWith('| Repère | Situation | Attendu | Exigences |')); const ss = S[S.indexOf(hs) + 1];
      plan.push([name, h + 1, 'TABLE_REC_ENTETE', 'Repère Exigences', C[h], hs]); C[h] = hs; C[h + 1] = ss;
      for (let k = h + 2; k < C.length && C[k].startsWith('|'); k++) {
        const c = C[k].split('|').slice(1, -1).map(x => x.trim()); const r = rec.get(`${c[0]}|${c[1]}`);
        if (!r) { plan.push([name, k + 1, 'REC_NON_APPARIE', '', C[k], '']); continue; }
        const src = S.find(l => l.startsWith(`| ${r[0]} |`));
        plan.push([name, k + 1, 'TABLE_REC_LIGNE', r[0], C[k], src]); C[k] = src;
      }
      changed = true;
    }
  }

  for (let k = 0; k < C.length; k++) {
    const cl = C[k]; if (Oset.has(cl) || !cl.trim() || /^### RM-\s*$/.test(cl)) continue;
    if (touchedByPR.has(cl)) { continue; }
    const cands = [...new Set(O.filter(o => o.length > cl.length && (o.match(ID_G) || []).length && (() => { const r = deletions(o, cl); return r && onlyIds(r); })()))];
    if (!cands.length) continue;
    if (cands.length > 1) { plan.push([name, k + 1, 'AMBIGU_SOURCES', '', cl, cands.length + ' sources']); continue; }
    const o = cands[0]; const lost = deletions(o, cl).join(' ').match(ID_G) || [];
    const lostD = lost.some(x => /^D-/.test(x));
    if ((groupe === '3b') !== lostD) continue;
    plan.push([name, k + 1, groupe === '3b' ? 'RENVOI_D' : 'IDENTIFIANT', lost.join(' '), cl, o]);
    C[k] = o; changed = true;
  }
  if (changed) writes.set(abs, C.join(E));
}
console.log(['fichier', 'ligne', 'nature', 'identifiants', 'texte_actuel', 'texte_restaure'].join('\t'));
console.log(plan.map(p => p.map(x => String(x).replace(/\t/g, ' ')).join('\t')).join('\n'));
const cnt = {}; plan.forEach(p => cnt[p[2]] = (cnt[p[2]] || 0) + 1); console.error(JSON.stringify({ groupe, appliquer, ...cnt }));
if (appliquer) for (const [abs, s] of writes) fs.writeFileSync(abs, s, 'utf8');
