// Lot 5 — application des corrections listées dans constats/LOT-5-corrections.json.
// Usage : node appliquer-lot5.mjs <racine> [--appliquer]
// Chaque « ancien » doit apparaître exactement une fois (ou exactement « tous » fois si précisé) au moment
// de son application, dans l'ordre du fichier ; sinon arrêt, sans aucune écriture.
// « @nom » désigne un chapitre de docs/Specifications-fonctionnelles/ ; sinon chemin relatif à docs/.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const repo = process.argv[2]; const go = process.argv.includes('--appliquer');
const here = path.dirname(fileURLToPath(import.meta.url));
// Fichier de corrections : --fichier=<nom dans constats/> (défaut : LOT-5-corrections.json).
const nom = (process.argv.find(a => a.startsWith('--fichier=')) || '--fichier=LOT-5-corrections.json').split('=')[1];
const spec = JSON.parse(fs.readFileSync(path.join(here, '..', 'constats', nom), 'utf8'));
const files = new Map(); const out = [];
const rel = f => f.startsWith('@') ? path.join('docs', 'Specifications-fonctionnelles', f.slice(1)) : path.join('docs', f);
for (const c of spec.corrections) {
  const p = rel(c.file); const abs = path.join(repo, p);
  if (!files.has(abs)) files.set(abs, fs.readFileSync(abs, 'utf8'));
  const s = files.get(abs); const n = s.split(c.ancien).length - 1; const want = c.tous || 1;
  if (n !== want) { console.error(`ARRÊT ${c.id} : ${n} occurrence(s) de l'ancien (attendu ${want}) dans ${p}`); process.exit(1); }
  files.set(abs, s.split(c.ancien).join(c.nouveau));
  out.push(`${c.id}\t${p.split(path.sep).join('/')}\t${want}`);
}
console.log(out.join('\n'));
if (go) for (const [abs, s] of files) fs.writeFileSync(abs, s, 'utf8');
console.error(`${spec.corrections.length} corrections ${go ? 'appliquées' : 'vérifiées (sans écriture)'}`);
