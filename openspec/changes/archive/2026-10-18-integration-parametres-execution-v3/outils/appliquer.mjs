// Intégration v3 — application d'un fichier de corrections JSON, avec écarts consignés (reprend appliquer-finalisation du lot 6).
// Usage : node appliquer.mjs <racine> <constats/X.json> [--appliquer]
// Une correction est écartée si son « ancien » n'apparaît pas exactement une fois au moment de son application.
// Écrit constats/X-applique.json et ecarts/X-ecartees.tsv. Sans --appliquer : simulation, rien n'est écrit.
import fs from 'fs'; import path from 'path';
const args = process.argv.slice(2); const go = args.includes('--appliquer');
const [repo, fichier] = args.filter(a => !a.startsWith('--'));
const j = JSON.parse(fs.readFileSync(fichier, 'utf8'));
const rel = f => f.startsWith('@') ? path.join('docs', 'Specifications-fonctionnelles', f.slice(1)) : path.join('docs', f);
const files = new Map(); const ok = [], ko = [];
for (const c of j.corrections) {
  const abs = path.join(repo, rel(c.file)); if (!fs.existsSync(abs)) { ko.push([c.id, 'FICHIER-ABSENT', c.file]); continue; }
  if (!files.has(abs)) files.set(abs, fs.readFileSync(abs, 'utf8'));
  const s = files.get(abs); const n = s.split(c.ancien).length - 1;
  if (n !== 1) { ko.push([c.id, n ? 'ANCIEN-AMBIGU' : 'ANCIEN-INTROUVABLE', `${n} occurrence(s)`]); continue; }
  files.set(abs, s.replace(c.ancien, () => c.nouveau)); ok.push(c);
}
const base = path.basename(fichier, '.json');
console.log(`${base} : ${ok.length} appliquées, ${ko.length} écartées ${go ? '' : '(simulation)'}`);
ko.forEach(k => console.log('  écartée ' + k.join(' — ')));
if (go) { for (const [abs, s] of files) fs.writeFileSync(abs, s, 'utf8');
  fs.writeFileSync(path.join(path.dirname(fichier), `${base}-applique.json`), JSON.stringify({ description: `${j.description} — sous-ensemble appliqué`, corrections: ok }, null, 1));
  const d = path.join(path.dirname(fichier), '..', 'ecarts'); fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, `${base}-ecartees.tsv`), ['id\traison\tdetail', ...ko.map(k => k.join('\t'))].join('\n') + '\n'); }
process.exit(ko.length ? 1 : 0);
