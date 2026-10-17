// Lot 6 (finalisation) — report des modifications d'une PR ouverte sur la documentation restructurée (LECTURE SEULE sur le dépôt).
// Usage : node reporter-pr.mjs <racine> <tete-pr> <numero> <dossier-sortie>
// Pour chaque bloc modifié par la PR (diff de sa base, merge-base avec origin/main, à sa tête), limité à docs/Specifications-fonctionnelles/ :
//  - un bloc qui remplace des lignes : les lignes retirées sont recherchées, à l'identique (espaces normalisés), dans l'ensemble des
//    fichiers actuels ; si elles sont trouvées une seule fois, le remplacement y est appliqué ;
//  - un bloc qui n'ajoute que des lignes : la ligne de contexte qui le précède est recherchée de même, et l'ajout est placé après elle.
// Écrit, dans une copie en mémoire, les fichiers modifiés ; puis produit <dossier>/pr-<n>-report.patch (diff unifié contre l'état
// actuel) et <dossier>/pr-<n>-report.tsv (un bloc par ligne : où il a été reporté, ou pourquoi il ne l'a pas été).
// Rien n'est écrit dans docs/ : le correctif est destiné au chantier propriétaire de la PR.
import fs from 'fs'; import path from 'path'; import os from 'os'; import { execFileSync } from 'child_process';
const [repo, tete, num, out] = process.argv.slice(2);
const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const SF = 'docs/Specifications-fonctionnelles';
const base = git('merge-base', tete, 'origin/main').trim();
// Comparaison sans espaces, ni cibles de liens, ni préfixes B-nnn, ni marques de titre : neutralise les corrections du lot 6.
const n = s => s.replace(/^(\s*- )\*\*B-\d{3}\*\* — /, '$1').replace(/^#{1,6}\s+/, '').replace(/\]\([^)]*\)/g, ']').replace(/\s+/g, '');
// Titre normalisé (numérotation, dates et ponctuation retirées) pour départager plusieurs positions candidates.
const tn = s => s.replace(/^#{1,6}\s+/, '').replace(/^(?:\d{1,2}(?:\.\d+)*(?: bis(?:\.\d+)?)?|\d+\.x)\.?\s+/, '').replace(/\d{1,2}\/\d{1,2}(?:\/20\d\d)?|\d{1,2} (?:septembre|octobre) 20\d\d/g, '').replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();
const titreAvant = (L, i) => { for (let k = Math.min(i, L.length - 1); k >= 0; k--) if (/^#{1,6} /.test(L[k])) return L[k]; return ''; };
const contratAvant = (L, i) => { for (let k = Math.min(i, L.length - 1); k >= 0; k--) { const m = L[k].match(/^#{1,6} (CE-[A-Z0-9-]+?\d)(?: —|$)/); if (m) return m[1]; } return ''; };
function departager(pos, titreBase, ceBase) { if (pos.length < 2) return pos;
  if (ceBase) { const ok = pos.filter(({ f, i }) => contratAvant(cur[f], i) === ceBase); if (ok.length) return ok; } // même contrat d'écran
  if (!titreBase) return pos; const t = tn(titreBase);
  const ok = pos.filter(({ f, i }) => { const h = titreAvant(cur[f], i); return tn(h) === t || (t && tn(h).endsWith(t)); }); return ok.length ? ok : pos; }
const cur = {}; for (const f of fs.readdirSync(path.join(repo, SF))) if (f.endsWith('.md')) cur[f] = fs.readFileSync(path.join(repo, SF, f), 'utf8').split(/\r?\n/);
const orig = Object.fromEntries(Object.entries(cur).map(([f, l]) => [f, l.slice()]));
const files = git('diff', '--name-only', base, tete, '--', SF + '/').split('\n').filter(x => /^docs\/Specifications-fonctionnelles\/[^/]+\.md$/.test(x)); // chapitres seulement (pas les images)
const rows = ['fichier_pr\tbloc\tlignes_retirees\tlignes_ajoutees\tstatut\tfichier_actuel\tligne_actuelle\tdetail'];
function trouver(lignes) { // lignes : tableau de textes ; renvoie [{f, i}] des positions où la séquence apparaît (normalisée)
  const cible = lignes.map(n); const res = [];
  for (const [f, L] of Object.entries(cur)) for (let i = 0; i + cible.length <= L.length; i++) { let ok = true; for (let j = 0; j < cible.length; j++) if (n(L[i + j]) !== cible[j]) { ok = false; break; } if (ok) res.push({ f, i }); }
  return res; }
for (const fp of files) {
  const diff = git('diff', '-U3', base, tete, '--', fp).split('\n'); let b = 0; const B = git('show', `${base}:${fp}`).split(/\r?\n/);
  for (let k = 0; k < diff.length; k++) { if (!diff[k].startsWith('@@')) continue; b++;
    const h = []; let j = k + 1; while (j < diff.length && !diff[j].startsWith('@@') && !diff[j].startsWith('diff ')) h.push(diff[j++]);
    // Découpe le bloc en groupes contigus de changements, chacun avec la ligne de contexte qui le précède.
    let vieux = +diff[k].match(/^@@ -(\d+)/)[1] - 1; // index de la ligne de base courante
    let ctx = null, vides = 0, i = 0; // ctx : dernière ligne de contexte non vide ; vides : lignes vides de contexte qui la suivent
    while (i < h.length) { if (h[i].startsWith(' ') || h[i] === '') { const t = h[i].slice(1); if (t.trim()) { ctx = t; vides = 0; } else vides++; i++; vieux++; continue; } if (!h[i].startsWith('-') && !h[i].startsWith('+')) { i++; continue; }
      const tb = titreAvant(B, vieux), ce = contratAvant(B, vieux); const moins = [], plus = []; while (i < h.length && (h[i].startsWith('-') || h[i].startsWith('+'))) { if (h[i][0] === '-') { moins.push(h[i].slice(1)); vieux++; } else plus.push(h[i].slice(1)); i++; }
      const nom = path.basename(fp); let st, fa = '', la = '', det = '';
      const nonVides = moins.filter(x => x.trim());
      if (nonVides.length) { const pos = departager(trouver(moins.length === nonVides.length ? moins : nonVides), tb, ce);
        if (pos.length === 1) { const { f, i: p } = pos[0]; const lg = moins.length === nonVides.length ? moins.length : nonVides.length; cur[f].splice(p, lg, ...plus); st = 'REPORTE'; fa = f; la = p + 1; }
        else { st = pos.length ? 'AMBIGU' : 'INTROUVABLE'; det = `lignes retirées trouvées ${pos.length} fois : « ${n(nonVides[0]).slice(0, 60)} »`; } }
      else { const pos = ctx !== null && n(ctx) ? departager(trouver([ctx]), tb, ce) : [];
        if (pos.length === 1) { const { f, i: p } = pos[0]; cur[f].splice(p + 1 + vides, 0, ...plus); st = 'REPORTE'; fa = f; la = p + 2 + vides; }
        else { st = pos.length ? 'AMBIGU' : 'INTROUVABLE'; det = `contexte trouvé ${pos.length} fois : « ${n(ctx || '').slice(0, 60)} »`; } }
      rows.push([nom, b, moins.length, plus.length, st, fa, la, det].join('\t')); }
    k = j - 1; } }
// Correctif : diff des fichiers modifiés contre l'état actuel.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-')); let patch = '';
for (const [f, L] of Object.entries(cur)) { if (L.join('\n') === orig[f].join('\n')) continue;
  const a = path.join(tmp, 'a.md'), b2 = path.join(tmp, 'b.md'); const eol = fs.readFileSync(path.join(repo, SF, f), 'utf8').includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(a, orig[f].join(eol)); fs.writeFileSync(b2, L.join(eol));
  let d = ''; try { d = execFileSync('git', ['diff', '--no-index', '--no-color', a, b2], { encoding: 'utf8', maxBuffer: 1 << 28 }); } catch (e) { d = e.stdout; }
  const p = `${SF}/${f}`; patch += d.replace(/^diff --git .*$/m, `diff --git a/${p} b/${p}`).replace(/^--- .*$/m, `--- a/${p}`).replace(/^\+\+\+ .*$/m, `+++ b/${p}`).replace(/^index .*\n/m, ''); }
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, `pr-${num}-report.patch`), patch); fs.writeFileSync(path.join(out, `pr-${num}-report.tsv`), rows.join('\n') + '\n');
const st = {}; rows.slice(1).forEach(r => { const s = r.split('\t')[4]; st[s] = (st[s] || 0) + 1; });
console.log(`PR #${num} base=${base.slice(0, 8)} fichiers=${files.length} groupes=${rows.length - 1} ${JSON.stringify(st)}`);
