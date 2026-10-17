// Lot 6 (finalisation) — justifications de conservation tirées des fichiers de corrections JSON (LECTURE SEULE).
// Usage : node justifier-corrections.mjs <sortie.tsv> <constats/A.json> [<constats/B.json> …]
// Pour chaque correction, chaque ligne de contenu de « ancien » qui ne se retrouve pas telle quelle dans « nouveau » reçoit le
// motif de la correction (COPIE-RETIREE, RENVOI, REDACTION, RESTAURATION:<commit>, CORRECTION-DECIDEE:D-nnn). Le fichier produit
// sert d'argument « justifications » à verifier-conservation.mjs : une ligne modifiée sans correction déclarée reste en échec.
import fs from 'fs'; import crypto from 'crypto';
const [out, ...fichiers] = process.argv.slice(2);
const n1 = s => s.replace(/\s+/g, ' ').trim(); const h = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const J = ['empreinte\tmotif\tcorrection']; let n = 0;
for (const f of fichiers) { const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const c of j.corrections) { const motif = c.motif || (c.decision ? `CORRECTION-DECIDEE:${c.decision}` : 'REDACTION');
    const garde = new Set(c.nouveau.split(/\r?\n/).map(n1));
    for (const l of c.ancien.split(/\r?\n/)) { const t = n1(l); if (!t || garde.has(t)) continue; J.push(`${h(t)}\t${motif}\t${c.id}`); n++; } } }
fs.writeFileSync(out, J.join('\n') + '\n'); console.log(`justifications=${n} fichiers=${fichiers.length}`);
