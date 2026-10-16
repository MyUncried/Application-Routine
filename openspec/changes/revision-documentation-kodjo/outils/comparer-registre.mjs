// Compare les lignes du registre des décisions (ch. 07) entre deux révisions Git.
// Lecture seule. Usage : node comparer-registre.mjs <racine> <ref-avant> <ref-après>
// Sortie TSV : decision, colonne, avant, après  (une ligne par colonne différente)
import { execFileSync } from 'child_process';
const [repo, a, b] = process.argv.slice(2);
const F = 'docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md';
const rows = ref => {
  const m = new Map();
  for (const l of execFileSync('git', ['-C', repo, 'show', `${ref}:${F}`], { encoding: 'utf8', maxBuffer: 1 << 28 }).split(/\r?\n/)) {
    const x = l.match(/^\| (D-\d{3}) \|/); if (x && !m.has(x[1])) m.set(x[1], l.split('|').slice(1, -1).map(s => s.trim()));
  }
  return m;
};
const A = rows(a), B = rows(b);
const out = ['decision\tcolonne\tavant\tapres'];
let n = 0;
for (const [d, ca] of A) {
  const cb = B.get(d); if (!cb) { out.push(`${d}\tabsente\t${ca.join(' | ')}\t`); n++; continue; }
  if (ca.join('|') === cb.join('|')) continue; n++;
  const len = Math.max(ca.length, cb.length);
  for (let i = 1; i < len; i++) if ((ca[i] || '') !== (cb[i] || '')) out.push([d, i + 1, ca[i] ?? '(absente)', cb[i] ?? '(absente)'].join('\t'));
}
for (const d of B.keys()) if (!A.has(d)) { out.push(`${d}\tnouvelle\t\t${B.get(d).join(' | ')}`); n++; }
console.log(out.join('\n')); console.error(`décisions différentes : ${n}`);
