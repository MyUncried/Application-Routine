// Intégration des PR — conversion d'un diff unifié en fichier de corrections (format construire-corrections).
// Usage : node patch-vers-corrections.mjs <diff> <prefixe-id> <motif> <reference> <sortie.txt>
// Chaque hunk devient un bloc : ancien = lignes de contexte et lignes retirées, nouveau = lignes de contexte et lignes ajoutées,
// dans l'ordre du hunk. Les fichiers de docs/Specifications-fonctionnelles/ sont écrits « @nom », les autres relatifs à docs/.
// Les blocs produits peuvent ensuite être adaptés à la main (adaptations aux décisions plus récentes, commentées « # »).
import fs from 'fs';
const [src, pre, motif, ref, out] = process.argv.slice(2);
const L = fs.readFileSync(src, 'utf8').replace(/\r/g, '').split('\n');
const blocs = []; let fichier = null, cur = null, n = 0;
const fin = () => { if (cur) { blocs.push(cur); cur = null; } };
for (const l of L) {
  const m = l.match(/^\+\+\+ b\/(.*)$/); if (m) { fin(); const p = m[1]; fichier = p.startsWith('docs/Specifications-fonctionnelles/') ? '@' + p.slice(35) : p.replace(/^docs\//, ''); continue; }
  if (l.startsWith('--- ') || l.startsWith('diff ') || l.startsWith('index ') || l.startsWith('new file') || l.startsWith('Binary')) { fin(); continue; }
  if (l.startsWith('@@')) { fin(); cur = { file: fichier, a: [], b: [] }; continue; }
  if (!cur) continue;
  if (l.startsWith(' ')) { cur.a.push(l.slice(1)); cur.b.push(l.slice(1)); }
  else if (l.startsWith('-')) cur.a.push(l.slice(1));
  else if (l.startsWith('+')) cur.b.push(l.slice(1));
  else if (l === '') { /* fin de fichier */ }
}
fin();
// Les lignes vides en tête ou en fin d'« ancien » rendent l'unicité fragile : on les retire des deux côtés quand elles sont communes.
const txt = blocs.map(b => { while (b.a.length && b.b.length && b.a[0] === '' && b.b[0] === '') { b.a.shift(); b.b.shift(); }
  while (b.a.length && b.b.length && b.a.at(-1) === '' && b.b.at(-1) === '') { b.a.pop(); b.b.pop(); }
  n++; return `=== ${pre}-${String(n).padStart(3, '0')} | ${b.file} | ${motif} | ${ref}\n--- ancien\n${b.a.join('\n')}\n--- nouveau\n${b.b.join('\n')}\n`; });
fs.writeFileSync(out, `# Généré par patch-vers-corrections.mjs depuis ${src.replace(/\\/g, '/')}\n\n` + txt.join('\n'));
console.log(`${blocs.length} blocs`);
