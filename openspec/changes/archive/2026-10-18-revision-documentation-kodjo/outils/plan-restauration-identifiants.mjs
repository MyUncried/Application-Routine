// Plan de restauration des identifiants effacés par la consolidation 7a89220f (14/10/2026).
// LECTURE SEULE : n'écrit rien dans docs/. Produit un TSV sur la sortie standard, un résumé sur stderr.
// Usage : node plan-restauration-identifiants.mjs <racine-du-depot> [ref-cible=HEAD]
//
// Méthode : pour chaque ligne de 7a89220f^ qui contient au moins un identifiant et qui n'existe plus telle
// quelle à la ref cible, on cherche dans la ref cible une ligne qui ne diffère de l'originale QUE par des
// identifiants, la ponctuation et les espaces (forme normalisée identique).
//   EXACT      : une seule ligne cible correspond ; la restauration remet la ligne d'origine, rien d'autre.
//   AMBIGU     : plusieurs lignes cibles identiques correspondent (ex. 42 titres « ### RM- ») ;
//                appariement à faire par l'ancre ou l'ordre, vérifié à part.
//   A_EXAMINER : aucune correspondance (la ligne a aussi été reformulée ou supprimée) ;
//                aucune restauration automatique.
//   LIEN_MORT  : correspondance trouvée, mais la ligne d'origine pointe vers un fichier supprimé ;
//                restauration seulement de l'identifiant, à la main.
import { execFileSync } from 'child_process';
import fs from 'fs'; import path from 'path';
const repo = process.argv[2]; const ref = process.argv[3] || 'HEAD';
const git = (...a) => execFileSync('git', ['-C', repo, '-c', 'core.quotepath=off', ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const ID = /\b(?:RM-|CE-)?FMT-\d+(?:[–-]\d+)?|\bD-\d{3}(?:[–-]\d{3})?|\bDEC-\d+|\bREC-\d+|\bSRC-\d+|\bCAD-\d+|\bCIR-\d+|\bRM-\d{3}[a-z]?|\bCE-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+\b/g;
const norm = s => s.replace(ID, '').replace(/[\s\p{P}\p{S}]+/gu, '');
const files = git('ls-files', 'docs/Specifications-fonctionnelles/*.md').trim().split('\n');
const deletedLinkTarget = l => [...l.matchAll(/\]\(([^)#\s]+)/g)].some(m => {
  let p = m[1]; try { p = decodeURIComponent(p); } catch {} if (/^https?:/.test(p)) return false;
  return !fs.existsSync(path.resolve(repo, 'docs/Specifications-fonctionnelles', p));
});
const out = ['fichier\tlignes_cibles\tstatut\tidentifiants_perdus\ttexte_cible\ttexte_avant_7a89220f'];
const counts = {};
for (const f of files) {
  let before; try { before = git('show', `7a89220f^:${f}`); } catch { continue; }
  const now = git('show', `${ref}:${f}`).split(/\r?\n/);
  const nowSet = new Set(now);
  const byNorm = new Map(); now.forEach((l, i) => { const k = norm(l); if (!k) return; if (!byNorm.has(k)) byNorm.set(k, []); byNorm.get(k).push(i + 1); });
  const name = f.split('/').pop();
  for (const l of before.split(/\r?\n/)) {
    if (!l.match(ID) || nowSet.has(l)) continue;
    const k = norm(l); const hits = k ? byNorm.get(k) : null;
    let st = !hits ? 'A_EXAMINER' : hits.length > 1 ? 'AMBIGU' : 'EXACT';
    const target = hits ? now[hits[0] - 1] : '';
    const idsBefore = l.match(ID) || [], idsNow = target.match(ID) || [];
    const lost = idsBefore.filter(x => { const i = idsNow.indexOf(x); if (i >= 0) { idsNow.splice(i, 1); return false; } return true; });
    if (hits && lost.length === 0) continue;        // même identifiants : simple reformulation de ponctuation, hors sujet
    if (st !== 'A_EXAMINER' && deletedLinkTarget(l)) st = 'LIEN_MORT';
    counts[st] = (counts[st] || 0) + 1;
    out.push([name, hits ? hits.join(',') : '', st, lost.join(' '), target, l].map(x => String(x).replace(/\t/g, ' ')).join('\t'));
  }
}
console.log(out.join('\n'));
console.error(JSON.stringify(counts));
