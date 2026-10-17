// Lot 6A — copies au niveau des lignes (paragraphes, lignes de tableau) entre sections (LECTURE SEULE).
// Usage : node copies-lignes.mjs <dossier-lot6>
// Entrées : base-conservation.tsv (empreintes des lignes), correspondance.tsv. Sortie : copies-lignes.tsv.
// Retient les lignes de plus de 60 caractères présentes dans au moins deux sections différentes. Pour chacune, propose
// l'occurrence à conserver : celle dont la section reste ou arrive dans le domicile majoritaire des occurrences, à défaut la
// première. Les autres occurrences deviennent un renvoi, règle par règle, à l'étape 6D (design G2). Les lignes du registre
// (ch. 07) ne sont jamais retirées.
import fs from 'fs'; import path from 'path';
const [L6] = process.argv.slice(2);
const tsv = f => fs.readFileSync(path.join(L6, f), 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const cor = new Map(tsv('correspondance.tsv').map(c => [c[0], c]));
const occ = new Map();
for (const u of tsv('base-conservation.tsv')) { if (u[0] !== 'LIGNE' || u[6].length < 60) continue; const a = occ.get(u[5]) || []; a.push({ ch: u[2], ligne: u[3], sec: u[4], ex: u[6] }); occ.set(u[5], a); }
const out = ['empreinte\toccurrences\tchapitres\tconservee\ta_remplacer\textrait'];
let n = 0, t = 0;
for (const [k, a] of occ) {
  if (new Set(a.map(o => o.sec)).size < 2) continue;
  const dest = o => (cor.get(o.sec) || [])[8] || o.ch; const vote = {}; a.forEach(o => vote[dest(o)] = (vote[dest(o)] || 0) + 1);
  const home = Object.entries(vote).sort((x, y) => y[1] - x[1])[0][0];
  const keep = a.find(o => dest(o) === home && cor.get(o.sec)?.[7] !== 'RENVOI') || a[0];
  const rest = a.filter(o => o !== keep && o.ch !== '07');
  n++; t += rest.length;
  out.push([k, a.length, [...new Set(a.map(o => o.ch))].join(','), `${keep.sec}:${keep.ch}:${keep.ligne}`, rest.map(o => `${o.sec}:${o.ch}:${o.ligne}`).join(' '), a[0].ex].join('\t'));
}
fs.writeFileSync(path.join(L6, 'copies-lignes.tsv'), out.join('\n') + '\n');
console.log(`lignes copiées=${n} occurrences à remplacer=${t}`);
