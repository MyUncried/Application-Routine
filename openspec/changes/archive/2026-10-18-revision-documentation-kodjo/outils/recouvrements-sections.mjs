// Lot 6A — recouvrements textuels entre sections (LECTURE SEULE).
// Usage : node recouvrements-sections.mjs <racine> <inventaire-sections.tsv> <sortie.tsv>
// Pour chaque paire de sections (feuilles de l'inventaire, contenu propre ≥ 25 mots), calcule la part des
// 6-grammes de mots de la plus petite qui figurent dans l'autre (containment). Seuil de sortie : 0,5.
// Nature mécanique : COPIE (≥ 0,9), QUASI-COPIE (0,7–0,9), RECOUVREMENT (0,5–0,7). Ce n'est qu'un repérage :
// une COPIE peut être légitime (citation) ; la décision de dédoublonnage reste règle par règle (design G2).
import fs from 'fs'; import path from 'path';
const [repo, inv, out] = process.argv.slice(2);
const SF = path.join(repo, 'docs', 'Specifications-fonctionnelles');
const files = Object.fromEntries(fs.readdirSync(SF).filter(f => /^\d\d – .*\.md$/.test(f)).map(f => [f.slice(0, 2), fs.readFileSync(path.join(SF, f), 'utf8').split(/\r?\n/)]));
const rows = fs.readFileSync(inv, 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const N = 6, tok = s => s.toLowerCase().normalize('NFC').replace(/[|*`_#>]/g, ' ').match(/[\p{L}\p{N}’'-]+/gu) || [];
const secs = rows.map(r => {
  const lines = files[r[1]].slice(+r[5] - 1, +r[6]).slice(1); // contenu propre, sans le titre
  const t = tok(lines.join(' ')); const g = new Set(); for (let i = 0; i + N <= t.length; i++) g.add(t.slice(i, i + N).join(' '));
  return { id: r[0], ch: r[1], titre: r[3], mots: t.length, g };
}).filter(s => s.mots >= 25);
const idx = new Map(); secs.forEach((s, k) => s.g.forEach(x => { let a = idx.get(x); if (!a) idx.set(x, a = []); a.push(k); }));
const out_ = ['section_a\tchapitre_a\ttitre_a\tsection_b\tchapitre_b\ttitre_b\tmots_a\tmots_b\tcontainment\tnature'];
secs.forEach((a, i) => {
  const cnt = new Map(); a.g.forEach(x => idx.get(x).forEach(j => { if (j > i) cnt.set(j, (cnt.get(j) || 0) + 1); }));
  for (const [j, c] of cnt) { const b = secs[j]; const r = c / Math.min(a.g.size, b.g.size); if (r < 0.5) continue;
    const nat = r >= 0.9 ? 'COPIE' : r >= 0.7 ? 'QUASI-COPIE' : 'RECOUVREMENT';
    out_.push([a.id, a.ch, a.titre, b.id, b.ch, b.titre, a.mots, b.mots, r.toFixed(2), nat].join('\t')); }
});
fs.writeFileSync(out, out_.join('\n') + '\n');
const n = out_.length - 1, inter = out_.slice(1).filter(l => { const c = l.split('\t'); return c[1] !== c[4]; }).length;
console.log(`paires=${n} inter-chapitres=${inter} copies=${out_.filter(l => l.endsWith('\tCOPIE')).length}`);
