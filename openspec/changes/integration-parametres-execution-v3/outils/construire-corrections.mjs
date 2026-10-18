// Intégration v3 — conversion d'un fichier de corrections au format texte en JSON rejouable (format des lots précédents).
// Usage : node construire-corrections.mjs <racine> <corrections/X.txt> <constats/X.json>
// Format du fichier texte :
//   === <ID> | <fichier : @chapitre.md ou DSF.md relatif à docs/> | <motif> | <référence de la spécification>
//   --- ancien
//   <texte exact, une ou plusieurs lignes>
//   --- nouveau
//   <texte de remplacement>
// Le motif vaut CORRECTION-DECIDEE:D-nnn, RENVOI ou REDACTION. Les lignes « # » hors bloc sont des commentaires.
// Les fins de ligne suivent celles du fichier cible (CRLF ou LF). Un « ancien » doit apparaître exactement une fois.
import fs from 'fs'; import path from 'path';
const [repo, src, out] = process.argv.slice(2);
const rel = f => f.startsWith('@') ? path.join(repo, 'docs', 'Specifications-fonctionnelles', f.slice(1)) : path.join(repo, 'docs', f);
const L = fs.readFileSync(src, 'utf8').replace(/\r/g, '').split('\n');
// Une ligne qui commence par « # » suivi d'une espace est toujours un commentaire (jamais un titre Markdown, qui s'écrit ici « ## » ou plus) ;
// elle est rattachée au bloc suivant (champ « commentaire »), pour signaler par exemple un conflit avec une PR.
const corr = []; let cur = null, zone = null, notes = [];
const fin = () => { if (!cur) return; for (const k of ['ancien', 'nouveau']) cur[k] = cur[k].join('\n').replace(/\n+$/, ''); corr.push(cur); cur = null; };
for (const l of L) {
  if (/^# /.test(l)) { notes.push(l.slice(2)); continue; }
  const m = l.match(/^=== (\S+) \| (.+?) \| (\S+) \| (.*)$/);
  if (m) { fin(); cur = { id: m[1], file: m[2], motif: m[3], ref: m[4], ancien: [], nouveau: [] }; if (notes.length) { cur.commentaire = notes.join(' / '); notes = []; } zone = null; continue; }
  if (cur && l === '--- ancien') { zone = 'ancien'; continue; }
  if (cur && l === '--- nouveau') { zone = 'nouveau'; continue; }
  if (cur && zone) cur[zone].push(l);
}
fin();
const erreurs = []; const textes = new Map();
for (const c of corr) {
  const abs = rel(c.file); if (!fs.existsSync(abs)) { erreurs.push(`${c.id} : fichier absent ${c.file}`); continue; }
  if (!textes.has(abs)) textes.set(abs, fs.readFileSync(abs, 'utf8'));
  const crlf = textes.get(abs).includes('\r\n');
  if (crlf) { c.ancien = c.ancien.replace(/\n/g, '\r\n'); c.nouveau = c.nouveau.replace(/\n/g, '\r\n'); }
  const m = c.motif.match(/^CORRECTION-DECIDEE:(D-\d{3})$/); if (m) c.decision = m[1];
  if (!/^(CORRECTION-DECIDEE:D-\d{3}|RENVOI|REDACTION)$/.test(c.motif)) erreurs.push(`${c.id} : motif invalide ${c.motif}`);
  if (!c.ancien) erreurs.push(`${c.id} : ancien vide`);
}
const ids = corr.map(c => c.id); const dbl = ids.filter((x, i) => ids.indexOf(x) !== i); if (dbl.length) erreurs.push('identifiants en double : ' + dbl.join(' '));
fs.writeFileSync(out, JSON.stringify({ description: `Intégration de la spécification v3.0 — ${path.basename(src)}`, corrections: corr }, null, 1));
console.log(`${path.basename(src)} : ${corr.length} corrections${erreurs.length ? ' ; ERREURS :\n  ' + erreurs.join('\n  ') : ''}`);
process.exit(erreurs.length ? 1 : 0);
