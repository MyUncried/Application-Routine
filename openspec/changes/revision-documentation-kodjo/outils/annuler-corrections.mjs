// Lot 6 (finalisation) — annulation ciblée de corrections déjà appliquées, et normalisation des fins de ligne.
// Usage : node annuler-corrections.mjs <racine> <constats/X-applique.json> <ID,ID…> "<raison>"
//         node annuler-corrections.mjs <racine> --fins-de-ligne
// 1) Rétablit « ancien » à la place de « nouveau » pour les corrections nommées, les retire du sous-ensemble appliqué et les
//    consigne dans lot6/finalisation/ecarts/<X>-ecartees.tsv.
// 2) --fins-de-ligne : pour chaque fichier de docs/ modifié par rapport à HEAD, impose les fins de ligne majoritaires (CRLF ou LF).
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const [repo, a2, ids, raison] = process.argv.slice(2);
if (a2 === '--fins-de-ligne') {
  const L = execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, 'diff', '--name-only', 'HEAD', '--', 'docs'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  for (const f of L) { const p = path.join(repo, f); if (!fs.existsSync(p)) continue; const s = fs.readFileSync(p, 'utf8'); const crlf = (s.match(/\r\n/g) || []).length, lf = (s.match(/(?<!\r)\n/g) || []).length;
    const t = crlf >= lf ? s.replace(/\r?\n/g, '\r\n').replace(/\r(?!\n)/g, '') : s.replace(/\r\n/g, '\n'); if (t !== s) { fs.writeFileSync(p, t); console.log(`fins de ligne normalisées (${crlf >= lf ? 'CRLF' : 'LF'}) : ${f}`); } }
  process.exit(0); }
const f = a2; const j = JSON.parse(fs.readFileSync(f, 'utf8')); const set = new Set(ids.split(','));
const rel = x => x.startsWith('@') ? path.join('docs', 'Specifications-fonctionnelles', x.slice(1)) : path.join('docs', x);
const n = s => s.replace(/\r/g, '');
const lignes = [];
for (const c of j.corrections.filter(c => set.has(c.id))) { const p = path.join(repo, rel(c.file)); let s = fs.readFileSync(p, 'utf8'); const crlf = s.includes('\r\n');
  const t = n(s); const k = t.split(n(c.nouveau)).length - 1; if (k !== 1) { console.log(`${c.id} : « nouveau » trouvé ${k} fois, non annulée`); continue; }
  let r = t.replace(n(c.nouveau), () => n(c.ancien)); if (crlf) r = r.replace(/\n/g, '\r\n'); fs.writeFileSync(p, r); lignes.push(`${c.id}\tANNULEE-APRES-CONTROLE\t${raison}`); console.log(`${c.id} annulée`); }
j.corrections = j.corrections.filter(c => !set.has(c.id) || !lignes.some(l => l.startsWith(c.id + '\t'))); fs.writeFileSync(f, JSON.stringify(j, null, 1));
const e = path.join(path.dirname(f), '..', 'lot6', 'finalisation', 'ecarts', path.basename(f).replace('-applique.json', '-ecartees.tsv'));
fs.appendFileSync(e, lignes.join('\n') + (lignes.length ? '\n' : ''));
