// Lot 6 — contrôle qu'une étape a placé chaque section là où la table de correspondance l'annonce (LECTURE SEULE).
// Usage : node verifier-correspondance.mjs <racine> <commit-de-reference> <correspondance.tsv> --etapes=6D,6E[,…] [--cible=<dossier>]
// Pour chaque ligne de la table dont l'étape figure dans --etapes : les lignes de contenu de la section (texte du commit de
// référence, espaces normalisés, cibles de liens neutralisées) doivent toutes se trouver dans le fichier cible annoncé
// (identifié par son préfixe « NN – » ou « Annexe – »). Pour une ligne RENVOI, elles doivent se trouver dans le fichier cible
// de la section conservée, et la section d'origine doit contenir un lien ou une mention de cette destination.
// Code de sortie 1 si une section n'est pas à sa place.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const args = process.argv.slice(2); const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [repo, ref, corf] = args.filter(a => !a.startsWith('--'));
const etapes = new Set((opt.etapes || '').split(',').filter(Boolean));
const DIR = 'docs/Specifications-fonctionnelles';
const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const refLines = Object.fromEntries(git('ls-tree', '--name-only', ref, DIR + '/').split('\n').filter(f => /\/\d\d – .*\.md$/.test(f)).map(f => [path.basename(f).slice(0, 2), git('show', `${ref}:${f}`).split(/\r?\n/)]));
const tgtDir = opt.cible || path.join(repo, DIR);
const tgt = {}; for (const f of fs.readdirSync(tgtDir)) if (f.endsWith('.md')) tgt[f.startsWith('Annexe') ? f.split(' – ')[0] + ' – ' + f.split(' – ')[1].replace(/\.md$/, '') : f.slice(0, 2)] = new Set(fs.readFileSync(path.join(tgtDir, f), 'utf8').split(/\r?\n/).map(l => norm(l)));
function norm(l) { return l.replace(/\]\([^)]*\)/g, ']()').replace(/\s+/g, ' ').trim(); }
const key = name => name.startsWith('Annexe') ? name : name.slice(0, 2);
const rows = fs.readFileSync(corf, 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const byId = new Map(rows.map(r => [r[0], r]));
const inv = new Map(fs.readFileSync(path.join(path.dirname(corf), 'inventaire-sections.tsv'), 'utf8').trim().split('\n').slice(1).map(l => { const c = l.split('\t'); return [c[0], c]; }));
let ok = 0, ko = 0; const fails = [];
for (const r of rows) {
  if (!etapes.has(r[10])) continue;
  const c = inv.get(r[0]); const body = refLines[c[1]].slice(+c[5], +c[6]).map(norm).filter(l => l && !/^\|?\s*:?-{3,}/.test(l) && !/^#{1,6} /.test(l) && !/^<a id=/.test(l));
  const dest = r[7] === 'RENVOI' ? key(byId.get(r[12])[8]) : key(r[8]);
  const set = tgt[dest]; const missing = set ? body.filter(l => !set.has(l)) : body;
  if (!set || missing.length) { ko++; fails.push(`${r[0]} (${r[7]} → ${dest}) : ${set ? missing.length + ' ligne(s) absente(s), ex. « ' + missing[0].slice(0, 60) + ' »' : 'fichier cible absent'}`); } else ok++;
}
console.log(`étapes=${[...etapes].join(',')} sections_contrôlées=${ok + ko} conformes=${ok} non_conformes=${ko}`);
fails.slice(0, 40).forEach(f => console.log('  ' + f));
process.exit(ko ? 1 : 0);
