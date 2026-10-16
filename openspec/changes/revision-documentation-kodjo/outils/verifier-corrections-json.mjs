// Vérification indépendante d'une livraison de corrections JSON (LECTURE SEULE).
// Usage : node verifier-corrections-json.mjs <racine> <ref-départ> <fichier1.json>[,<fichier2.json>…]
// Rejoue en mémoire les corrections, dans l'ordre, sur les fichiers de <ref-départ> lus dans Git, puis compare au
// contenu sur disque (fins de ligne normalisées). Toute ligne du disque qui n'est pas expliquée par le rejeu est
// listée ; aucune écriture.
import { execFileSync } from 'child_process'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const [repo, ref, list] = process.argv.slice(2);
const here = path.dirname(fileURLToPath(import.meta.url));
const norm = s => s.replace(/\r\n/g, '\n');
const files = new Map();
const relOf = f => f.startsWith('@') ? `docs/Specifications-fonctionnelles/${f.slice(1)}` : `docs/${f}`;
let n = 0, ko = [];
for (const nom of list.split(',')) {
  for (const c of JSON.parse(fs.readFileSync(path.join(here, '..', 'constats', nom), 'utf8')).corrections) {
    const rel = relOf(c.file);
    if (!files.has(rel)) files.set(rel, norm(execFileSync('git', ['-C', repo, 'show', `${ref}:${rel}`], { encoding: 'utf8', maxBuffer: 1 << 28 })));
    const s = files.get(rel), a = norm(c.ancien), b = norm(c.nouveau), k = s.split(a).length - 1;
    if (k !== (c.tous || 1)) { ko.push(`${c.id} : ${k} occurrence(s) au rejeu`); continue; }
    files.set(rel, s.split(a).join(b)); n++;
  }
}
const diffs = [];
for (const [rel, s] of files) {
  const disk = norm(fs.readFileSync(path.join(repo, rel), 'utf8'));
  if (disk === s) continue;
  const A = s.split('\n'), B = disk.split('\n'); const setA = new Set(A);
  const extra = B.filter(l => !setA.has(l)); const setB = new Set(B); const missing = A.filter(l => !setB.has(l));
  diffs.push({ rel, extra, missing });
}
console.log(`${n} corrections rejouées${ko.length ? ' ; ÉCHECS : ' + ko.join(' | ') : ''}`);
for (const d of diffs) console.log(`ÉCART ${d.rel} : ${d.extra.length} ligne(s) sur disque non expliquées, ${d.missing.length} ligne(s) attendues absentes\n  ${d.extra.map(l => l.slice(0, 110)).join('\n  ')}`);
if (!diffs.length && !ko.length) console.log('OK : le disque correspond exactement au rejeu');
