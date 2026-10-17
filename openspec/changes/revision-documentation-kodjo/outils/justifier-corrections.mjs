// Lot 6 (finalisation) — justifications de conservation tirées des fichiers de corrections JSON (LECTURE SEULE).
// Usage : node justifier-corrections.mjs <racine> <commit-de-reference> <sortie.tsv> <constats/A.json> [<constats/B.json> …]
// Rejoue les corrections, dans l'ordre, sur les fichiers lus au commit de référence. Pour chacune, les lignes COMPLÈTES qui
// contiennent « ancien » sont comparées à celles qui le remplacent ; chaque ligne qui disparaît reçoit le motif de la correction
// (COPIE-RETIREE, RENVOI, REDACTION, RESTAURATION:<commit>, CORRECTION-DECIDEE:D-nnn). Le fichier produit sert d'argument
// « justifications » à verifier-conservation.mjs : une ligne modifiée sans correction déclarée reste en échec.
import fs from 'fs'; import crypto from 'crypto'; import { execFileSync } from 'child_process';
const [repo, ref, out, ...fichiers] = process.argv.slice(2);
const n1 = s => s.replace(/\s+/g, ' ').trim(); const h = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const rel = f => f.startsWith('@') ? `docs/Specifications-fonctionnelles/${f.slice(1)}` : `docs/${f}`;
const txt = new Map(); const J = ['empreinte\tmotif\tcorrection']; let n = 0, ko = 0;
for (const f of fichiers) { const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const c of j.corrections) { const motif = c.motif || (c.decision ? `CORRECTION-DECIDEE:${c.decision}` : 'REDACTION'); const r = rel(c.file);
    if (!txt.has(r)) txt.set(r, execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, 'show', `${ref}:${r}`], { encoding: 'utf8', maxBuffer: 1 << 28 }).replace(/\r/g, ''));
    const s = txt.get(r), a = c.ancien.replace(/\r/g, ''), b = c.nouveau.replace(/\r/g, ''); const i = s.indexOf(a); if (i < 0) { ko++; continue; }
    const d = s.lastIndexOf('\n', i - 1) + 1; let e = s.indexOf('\n', i + a.length); if (e < 0) e = s.length;
    const avant = s.slice(d, e).split('\n'); const apres = (s.slice(d, i) + b + s.slice(i + a.length, e)).split('\n'); const garde = new Set(apres.map(n1));
    for (const l of avant) { const t = n1(l); if (t && !garde.has(t)) { J.push(`${h(t)}\t${motif}\t${c.id}`); n++; } }
    txt.set(r, s.slice(0, i) + b + s.slice(i + a.length)); } }
fs.writeFileSync(out, J.join('\n') + '\n'); console.log(`justifications=${n} fichiers=${fichiers.length}${ko ? ` non_rejouées=${ko}` : ''}`);
