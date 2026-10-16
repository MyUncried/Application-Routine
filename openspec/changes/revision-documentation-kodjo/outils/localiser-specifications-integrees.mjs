// Localise, pour chaque section d'une spécification supprimée par 7a89220f, l'endroit des chapitres actuels
// où son contenu a été intégré. LECTURE SEULE. Méthode : pour chaque section (titre ##/###), on prend les
// lignes de contenu de plus de 60 caractères, on les normalise (identifiants, ponctuation et espaces retirés)
// et on cherche la première qui figure dans un chapitre à la ref cible. Sortie TSV.
// Usage : node localiser-specifications-integrees.mjs <racine> [ref=HEAD]
import { execFileSync } from 'child_process';
const repo = process.argv[2]; const ref = process.argv[3] || 'HEAD';
const git = (...a) => execFileSync('git', ['-C', repo, '-c', 'core.quotepath=off', ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const SF = 'docs/Specifications-fonctionnelles';
const ID = /\b(?:RM-|CE-)?FMT-\d+(?:[–-]\d+)?|\bD-\d{3}(?:[–-]\d{3})?|\bDEC-\d+|\bREC-\d+|\bSRC-\d+|\bCAD-\d+|\bCIR-\d+|\bRM-\d{3}[a-z]?|\bEC-\d+/g;
const norm = s => s.replace(/\]\([^)]*\)/g, ']').replace(ID, '').replace(/[\s\p{P}\p{S}]+/gu, '').toLowerCase();
const specs = git('ls-tree', '--name-only', '7a89220f^', `${SF}/`).trim().split('\n').filter(f => /\/(SPECIFICATION-|CONSOLIDATION-|00 – )/.test(f));
const chapters = git('ls-tree', '--name-only', ref, `${SF}/`).trim().split('\n').filter(f => /\/\d\d – .*\.md$/.test(f));
const idx = [];
for (const c of chapters) {
  const lines = git('show', `${ref}:${c}`).split(/\r?\n/); let anchor = '';
  lines.forEach((l, i) => { const a = l.match(/<a id="([^"]+)"/); if (a) anchor = a[1]; const k = norm(l); if (k.length > 40) idx.push([k, c.split('/').pop().slice(0, 2), i + 1, anchor]); });
}
const out = ['specification\tsection\tchapitre\tligne\tancre_precedente\tlignes_retrouvees/lignes_testees'];
for (const s of specs) {
  const lines = git('show', `7a89220f^:${s}`).split(/\r?\n/); let sec = '(début)'; let buf = [];
  const flush = () => {
    if (!buf.length) return; let first = null, found = 0;
    for (const l of buf) { const k = norm(l); const hit = idx.find(x => x[0].includes(k) || (k.length > 80 && k.includes(x[0]))); if (hit) { found++; if (!first) first = hit; } }
    out.push([s.split('/').pop(), sec, first ? first[1] : '—', first ? first[2] : '', first ? first[3] : '', `${found}/${buf.length}`].join('\t')); buf = [];
  };
  for (const l of lines) { const h = l.match(/^#{1,3} (.*)/); if (h) { flush(); sec = h[1].slice(0, 70); } else if (norm(l).length > 60) buf.push(l); }
  flush();
}
console.log(out.join('\n'));
