// Lot 6 (finalisation) — application d'un fichier de corrections proposé, avec écarts consignés.
// Usage : node appliquer-finalisation.mjs <racine> <constats/PROPOSE.json> [--rejeter=ID,ID…] [--appliquer]
// Applique les corrections dans l'ordre. Une correction est écartée, avec sa raison :
//   - si elle figure dans --rejeter (relecture : fondement insuffisant, question ouverte…) ;
//   - si son « ancien » n'apparaît plus exactement une fois (texte déjà modifié par une correction appliquée avant elle).
// Écrit constats/<PROPOSE>-applique.json (corrections effectivement appliquées, pour le rejeu et les justifications) et
// lot6/finalisation/ecarts/<PROPOSE>-ecartees.tsv. Sans --appliquer : simulation, rien n'est écrit.
import fs from 'fs'; import path from 'path';
const args = process.argv.slice(2); const go = args.includes('--appliquer');
const [repo, fichier] = args.filter(a => !a.startsWith('--'));
const rej = new Set(((args.find(a => a.startsWith('--rejeter=')) || '=').split('=')[1] || '').split(',').filter(Boolean));
const j = JSON.parse(fs.readFileSync(fichier, 'utf8'));
const rel = f => f.startsWith('@') ? path.join('docs', 'Specifications-fonctionnelles', f.slice(1)) : path.join('docs', f);
const files = new Map(); const ok = [], ko = [];
for (const c of j.corrections) {
  if (rej.has(c.id)) { ko.push([c.id, 'REJETEE-A-LA-RELECTURE', c.ref || '']); continue; }
  const abs = path.join(repo, rel(c.file)); if (!fs.existsSync(abs)) { ko.push([c.id, 'FICHIER-ABSENT', c.file]); continue; }
  if (!files.has(abs)) files.set(abs, fs.readFileSync(abs, 'utf8'));
  const s = files.get(abs); const n = s.split(c.ancien).length - 1;
  if (n !== 1) { ko.push([c.id, n ? 'ANCIEN-AMBIGU' : 'SANS-OBJET (texte déjà modifié)', `${n} occurrence(s)`]); continue; }
  files.set(abs, s.replace(c.ancien, () => c.nouveau)); ok.push(c);
}
const base = path.basename(fichier, '.json');
console.log(`${base} : ${ok.length} appliquées, ${ko.length} écartées ${go ? '' : '(simulation)'}`);
ko.forEach(k => console.log('  écartée ' + k.join(' — ')));
if (go) { for (const [abs, s] of files) fs.writeFileSync(abs, s, 'utf8');
  fs.writeFileSync(path.join(path.dirname(fichier), `${base}-applique.json`), JSON.stringify({ description: `${j.description} — sous-ensemble appliqué (voir ${base}-ecartees.tsv)`, corrections: ok }, null, 1));
  const d = path.join(path.dirname(fichier), '..', 'lot6', 'finalisation', 'ecarts'); fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, `${base}-ecartees.tsv`), ['id\traison\tdetail', ...ko.map(k => k.join('\t'))].join('\n') + '\n'); }
