// Lot 6A — copies au niveau des lignes (paragraphes, lignes de tableau) entre sections (LECTURE SEULE).
// Usage : node copies-lignes.mjs <racine> <dossier-lot6>
// Entrées : base-conservation.tsv (empreintes des lignes), correspondance.tsv, classification.tsv. Sortie : copies-lignes.tsv.
// Retient les lignes de plus de 60 caractères présentes à l'identique dans au moins deux sections différentes.
// Révision 2 : l'identité du texte ne suffit pas. Une occurrence n'est proposée au remplacement (statut RENVOI-POSSIBLE) que si
// elle a le même contexte que l'occurrence conservée :
//   - même portée (MVP courant / hors MVP / historique, lue dans les titres englobants) ;
//   - même domaine fonctionnel et même caractère normatif de la section ;
//   - pour une ligne de tableau, même ligne d'en-tête du tableau (une même ligne n'a pas le même sens sous deux en-têtes).
// Sinon le statut est A-VERIFIER, avec le motif : l'occurrence reste en place tant que la revue de l'étape 6D n'a pas établi
// que le renvoi ne change ni la règle ni sa portée. Les lignes du registre (ch. 07) ne sont jamais retirées.
import fs from 'fs'; import path from 'path';
const [repo, L6] = process.argv.slice(2);
const SF = path.join(repo, 'docs', 'Specifications-fonctionnelles');
const files = Object.fromEntries(fs.readdirSync(SF).filter(f => /^\d\d – .*\.md$/.test(f)).map(f => [f.slice(0, 2), fs.readFileSync(path.join(SF, f), 'utf8').split(/\r?\n/)]));
const tsv = f => fs.readFileSync(path.join(L6, f), 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const cor = new Map(tsv('correspondance.tsv').map(c => [c[0], c]));
const cls = new Map(tsv('classification.tsv').map(c => [c[0], c]));
const enTete = (ch, ligne) => { const L = files[ch]; let i = +ligne - 1; if (!L[i].startsWith('|')) return ''; while (i > 0 && L[i - 1].startsWith('|')) i--; return L[i].replace(/\s+/g, ' ').trim(); };
const occ = new Map();
for (const u of tsv('base-conservation.tsv')) { if (u[0] !== 'LIGNE' || u[6].length < 60) continue; const a = occ.get(u[5]) || []; a.push({ ch: u[2], ligne: u[3], sec: u[4], ex: u[6] }); occ.set(u[5], a); }
const ctx = o => { const c = cor.get(o.sec), k = cls.get(o.sec); return { portee: c[17], domaine: c[6], normatif: k[5], tete: enTete(o.ch, o.ligne) }; };
const out = ['empreinte\toccurrences\tchapitres\tconservee\trenvoi_possible\ta_verifier\textrait'];
let n = 0, ok = 0, av = 0;
for (const [k, a] of occ) {
  if (new Set(a.map(o => o.sec)).size < 2) continue;
  const dest = o => cor.get(o.sec)[8]; const vote = {}; a.forEach(o => vote[dest(o)] = (vote[dest(o)] || 0) + 1);
  const home = Object.entries(vote).sort((x, y) => y[1] - x[1])[0][0];
  const keep = a.find(o => dest(o) === home && !['RENVOI', 'ARCHIVER'].includes(cor.get(o.sec)[7])) || a.find(o => !['RENVOI', 'ARCHIVER'].includes(cor.get(o.sec)[7])) || a[0];
  const kc = ctx(keep); const poss = [], verif = [];
  for (const o of a) { if (o === keep || o.ch === '07') continue; const c = ctx(o); const motifs = [];
    if (c.portee !== kc.portee) motifs.push(`portée ${c.portee}≠${kc.portee}`);
    if (c.domaine !== kc.domaine) motifs.push(`domaine ${c.domaine}≠${kc.domaine}`);
    if (c.normatif !== kc.normatif) motifs.push(`normatif ${c.normatif}≠${kc.normatif}`);
    if (c.tete !== kc.tete) motifs.push('en-tête de tableau différent');
    const ref = `${o.sec}:${o.ch}:${o.ligne}`; if (motifs.length) verif.push(`${ref}(${motifs.join(',')})`); else poss.push(ref); }
  n++; ok += poss.length; av += verif.length;
  out.push([k, a.length, [...new Set(a.map(o => o.ch))].join(','), `${keep.sec}:${keep.ch}:${keep.ligne}`, poss.join(' '), verif.join(' '), a[0].ex].join('\t'));
}
fs.writeFileSync(path.join(L6, 'copies-lignes.tsv'), out.join('\n') + '\n');
console.log(`lignes copiées=${n} occurrences RENVOI-POSSIBLE=${ok} occurrences A-VERIFIER=${av}`);
