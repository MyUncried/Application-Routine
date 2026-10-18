// Intégration v3 — rejeu exact : chaque fichier touché doit être égal à sa version au commit de référence
// plus les corrections déclarées, appliquées dans l'ordre (rien d'autre). Comparaison sans retours chariot (Git stocke en LF, le disque en CRLF).
// Usage : node rejouer.mjs <racine> <commit-de-reference> <constats/A-applique.json> […]
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const [repo, ref, ...fichiers] = process.argv.slice(2);
const sansCR = s => s.split(String.fromCharCode(13)).join('');
const rel = f => f.startsWith('@') ? `docs/Specifications-fonctionnelles/${f.slice(1)}` : `docs/${f}`;
const txt = new Map(); const ko = []; let n = 0;
for (const f of fichiers) { const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const c of j.corrections) { const r = rel(c.file);
    if (!txt.has(r)) txt.set(r, sansCR(execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, 'show', `${ref}:${r}`], { encoding: 'utf8', maxBuffer: 1 << 28 })));
    const a = sansCR(c.ancien), b = sansCR(c.nouveau); const s = txt.get(r); const k = s.split(a).length - 1;
    if (k !== 1) { ko.push(`${path.basename(f)}:${c.id} ancien trouvé ${k} fois au rejeu`); continue; }
    txt.set(r, s.replace(a, () => b)); n++; } }
for (const [r, s] of txt) { const d = sansCR(fs.readFileSync(path.join(repo, r), 'utf8')); if (d !== s) ko.push(`${r} : le disque diffère du rejeu`); }
console.log(ko.length ? `KO ${ko.length}\n  ${ko.join('\n  ')}` : `OK rejeu exact : ${n} corrections, ${txt.size} fichiers`);
process.exit(ko.length ? 1 : 0);
