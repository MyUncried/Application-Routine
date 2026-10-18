// Inventaire exact du lot 1 : restauration et traçabilité du registre des décisions (ch. 07).
// LECTURE SEULE. Usage : node inventaire-lot1-registre.mjs <racine> [ref-cible=6656fefc]
// Sortie TSV : groupe, decision, commit_source, colonne, texte_cible, texte_origine
//  G1 : 24 décisions dont le texte a été remplacé par « Prescription courante : Bip v2… » (37e372cd, 07/10)
//  G2 : D-357 à D-369, colonnes effacées par la consolidation (7a89220f, 14/10)
//  G3 : renvois effacés dans le texte d'autres décisions par la consolidation (7a89220f)
import { execFileSync } from 'child_process';
const repo = process.argv[2]; const ref = process.argv[3] || '6656fefc';
const F = 'docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md';
const rows = r => { const m = new Map(); for (const l of execFileSync('git', ['-C', repo, 'show', `${r}:${F}`], { encoding: 'utf8', maxBuffer: 1 << 28 }).split(/\r?\n/)) { const x = l.match(/^\| (D-\d{3}) \|/); if (x && !m.has(x[1])) m.set(x[1], l.split('|').slice(1, -1).map(s => s.trim())); } return m; };
const now = rows(ref), pre37 = rows('37e372cd^'), pre7a = rows('7a89220f^'), at7a = rows('7a89220f');
const out = ['groupe\tdecision\tcommit_source\tcolonne\ttexte_cible\ttexte_origine'];
const c = { G1: 0, G2: 0, G3: 0 };
for (const [d, cols] of now) {
  if (/^Prescription courante : Bip v2/.test(cols[1])) { out.push(['G1', d, '37e372cd^', 2, cols[1], pre37.get(d)?.[1] ?? '(introuvable)'].join('\t')); c.G1++; }
}
for (const [d, a] of pre7a) {
  const b = at7a.get(d); if (!b || a.join('|') === b.join('|')) continue;
  const g = /^D-3(5[7-9]|6\d)$/.test(d) ? 'G2' : 'G3';
  for (let i = 1; i < Math.max(a.length, b.length); i++) if ((a[i] || '') !== (b[i] || '')) { out.push([g, d, '7a89220f^', i + 1, b[i] ?? '(colonne absente)', a[i] ?? '(colonne absente)'].join('\t')); }
  c[g]++;
}
// G4 : décisions validées absentes de la cible mais présentes dans le second parent de la fusion ae50aaed (09/10)
c.G4 = 0;
const lost = rows('341f4d41');
for (const [d, cols] of lost) if (!now.has(d)) { out.push(['G4', d, '341f4d41', 'ligne entière', '(absente)', cols.join(' | ')].join('\t')); c.G4++; }
console.log(out.map(l => l.replace(/\r/g, '')).join('\n'));
console.error(JSON.stringify({ decisions: c }));
