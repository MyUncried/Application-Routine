// Lot 6 (finalisation) — traçabilité besoins → règles → contrats → recettes, à partir des seules références écrites.
// Usage : node tracabilite.mjs <racine> [--appliquer]
// Une référence est « établie » lorsqu'elle est écrite : un identifiant cité dans le texte d'un besoin, d'une règle, d'un
// contrat ou d'une recette, ou une règle qui cite elle-même un contrat. Aucune correspondance n'est déduite du sens.
//  - Contrats (ch. 13) : une ligne « Règles applicables » est ajoutée au tableau de la rubrique 1 « Identification » ; elle liste
//    les RM et RM-FMT citées dans le contrat et celles dont le texte cite le contrat. Le texte du contrat est inchangé.
//  - Annexe générée, non normative : « Annexe – Matrice de traçabilité.md ».
// Sans --appliquer : affiche seulement les comptes.
import fs from 'fs'; import path from 'path';
const repo = process.argv[2]; const go = process.argv.includes('--appliquer');
const SF = path.join(repo, 'docs', 'Specifications-fonctionnelles');
const lire = f => fs.readFileSync(path.join(SF, f), 'utf8');
const ch = Object.fromEntries(fs.readdirSync(SF).filter(f => /^\d\d – .*\.md$/.test(f)).map(f => [f.slice(0, 2), f]));
const slug = s => s.trim().toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
const RE = { RM: /\bRM-(?:FMT-)?\d{2,3}[a-z]?\b/g, CE: /\bCE-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+\b/g, D: /\bD-\d{3}\b/g, REC: /\bREC-\d+\b/g };
const uniq = a => [...new Set(a)].sort((x, y) => x.localeCompare(y, 'fr', { numeric: true }));
const ancres = {}; // identifiant défini → lien depuis le dossier des chapitres
function indexer(f) { const cnt = {}; let cur = ''; let fence = false; lire(f).split(/\r?\n/).forEach(l => { if (/^```/.test(l)) fence = !fence; const m = !fence && l.match(/^#{1,6}\s+(.*)$/);
  if (m) { let s = slug(m[1]); if (cnt[s] !== undefined) { cnt[s]++; s += '-' + cnt[s]; } else cnt[s] = 0; cur = s; const id = m[1].match(/^(RM-FMT-\d+|CE-[A-Z0-9-]+?\d)(?: —|\s*$)/); if (id) ancres[id[1]] = `${encodeURIComponent(f)}#${s}`; return; }
  const r = l.match(/^\| (RM-\d{3}[a-z]?|REC-\d+|D-\d{3}) \|/); if (r && cur) ancres[r[1]] ||= `${encodeURIComponent(f)}#${cur}`;
  const b = l.match(/^- \*\*(B-\d{3})\*\* — /); if (b && cur) ancres[b[1]] = `${encodeURIComponent(f)}#${cur}`; }); }
Object.values(ch).forEach(indexer);
const lien = id => ancres[id] ? `[${id}](${ancres[id]})` : id;
// Règles : lignes de tableau RM-nnn (ch. 10 et autres) et sections RM-FMT-nn (ch. 10).
const regles = new Map(); // id → texte
for (const f of Object.values(ch)) { const L = lire(f).split(/\r?\n/); let fmt = null;
  L.forEach(l => { const r = l.match(/^\| (RM-\d{3}[a-z]?) \|/); if (r) regles.set(r[1], (regles.get(r[1]) || '') + ' ' + l);
    const h = l.match(/^#{2,6} (RM-FMT-\d+)\s*$/); if (h) { fmt = h[1]; regles.set(fmt, ''); return; } if (/^#{1,6} /.test(l)) fmt = null; else if (fmt) regles.set(fmt, regles.get(fmt) + ' ' + l); }); }
// Recettes REC (lignes de tableau).
const recettes = new Map(); for (const f of Object.values(ch)) for (const l of lire(f).split(/\r?\n/)) { const r = l.match(/^\| (REC-\d+) \|/); if (r) recettes.set(r[1], l); }
// Besoins B-nnn (ch. 02).
const besoins = new Map(); for (const l of lire(ch['02']).split(/\r?\n/)) { const b = l.match(/^- \*\*(B-\d{3})\*\* — (.*)$/); if (b) besoins.set(b[1], b[2]); }
// Contrats (ch. 13) : corps de chaque contrat.
const f13 = ch['13']; const L13 = lire(f13).split(/\r?\n/); const contrats = new Map(); let curCE = null, nivCE = 0;
L13.forEach((l, i) => { const m = l.match(/^(#{1,6}) (CE-[A-Z0-9-]+?\d)(?: —|\s*$)/); if (m) { curCE = m[2]; nivCE = m[1].length; contrats.set(curCE, { debut: i, lignes: [] }); return; }
  const h = l.match(/^(#{1,6}) /); if (h && curCE && h[1].length <= nivCE) curCE = null; if (curCE) contrats.get(curCE).lignes.push(i); });
const citeesPar = (txt, re) => uniq(txt.match(re) || []);
// Rattachements établis par lecture (lot6/finalisation/tracabilite-contrats-*.tsv) : CERTAIN = même condition et même résultat
// énoncés par le contrat et par la règle, extraits vérifiés mot pour mot ; PROBABLE = à confirmer (annexe seulement).
const L6F = path.join(repo, 'openspec', 'changes', 'revision-documentation-kodjo', 'lot6', 'finalisation');
const rattach = []; for (const f of ['tracabilite-contrats-A.tsv', 'tracabilite-contrats-B.tsv']) { const p = path.join(L6F, f); if (!fs.existsSync(p)) continue;
  fs.readFileSync(p, 'utf8').trim().split(/\r?\n/).slice(1).forEach(l => { const c = l.split('\t'); if (c[0] && c[1]) rattach.push({ ce: c[0], rm: c[1], niveau: c[2], pc: c[3] || '', pr: c[4] || '' }); }); }
const certains = ce => rattach.filter(r => r.ce === ce && r.niveau === 'CERTAIN' && regles.has(r.rm)).map(r => r.rm);
const rapport = { contrats: 0, lignes_ajoutees: 0, regles_par_contrat: {} };
const ajouts = new Map(); // index de ligne (après laquelle insérer) → texte
for (const [ce, c] of contrats) {
  const txt = c.lignes.map(i => L13[i]).join(' ');
  const citees = citeesPar(txt, RE.RM).filter(id => regles.has(id));
  const citant = [...regles].filter(([id, t]) => t.includes(ce)).map(([id]) => id);
  const toutes = uniq([...citees, ...citant, ...certains(ce)]); rapport.regles_par_contrat[ce] = toutes.length;
  // Tableau de la rubrique 1 : dernière ligne de tableau après le titre « 1. Identification ».
  const t1 = c.lignes.find(i => /^#{1,6} 1\. Identification/.test(L13[i])); if (t1 === undefined || !toutes.length) continue;
  // Rubrique 1 : de son titre au titre suivant. Ligne de tableau si la rubrique porte un tableau, sinon paragraphe en fin de rubrique.
  let fin = t1 + 1; while (fin < L13.length && !/^#{1,6} /.test(L13[fin])) fin++;
  if (L13.slice(t1, fin).some(l => /^\|? ?Règles applicables/.test(l.replace(/^\| /, '| ')) || l.startsWith('Règles applicables :'))) continue;
  const texte = `${toutes.join(', ')} (rattachement documentaire : règle citée, règle citant ce contrat, ou même condition et même résultat énoncés ; preuves dans l’annexe « Matrice de traçabilité »)`;
  let k = t1 + 1; while (k < fin && !L13[k].startsWith('|')) k++;
  if (k < fin) { while (k + 1 < fin && L13[k + 1].startsWith('|')) k++; ajouts.set(k, `| Règles applicables | ${texte} |`); }
  else { k = fin - 1; while (k > t1 && !L13[k].trim()) k--; ajouts.set(k, `\r\nRègles applicables : ${texte}`); }
  rapport.contrats++; }
rapport.lignes_ajoutees = ajouts.size;
// Annexe générée.
const A = ['# Annexe — Matrice de traçabilité', '', 'Document non normatif, généré par `openspec/changes/revision-documentation-kodjo/outils/tracabilite.mjs`. Une référence n’y figure que si elle est **écrite** dans le texte : identifiant cité, ou règle qui cite un contrat. Aucune correspondance n’est déduite du sens ; une case vide signifie « aucune référence écrite », pas « aucun rapport ».', ''];
A.push('## Besoins → identifiants cités', '', '| Besoin | Règles | Contrats | Décisions |', '|---|---|---|---|');
let bAvec = 0; for (const [b, t] of besoins) { const r = citeesPar(t, RE.RM), c = citeesPar(t, RE.CE), d = citeesPar(t, RE.D); if (r.length + c.length + d.length) bAvec++; A.push(`| ${lien(b)} | ${r.map(lien).join(', ')} | ${c.map(lien).join(', ')} | ${d.map(lien).join(', ')} |`); }
A.push('', `${bAvec} besoins sur ${besoins.size} citent au moins un identifiant.`, '', '## Règles → contrats, recettes et décisions', '', '| Règle | Contrats (citant ou cités) | Recettes citant la règle | Décisions citées par la règle |', '|---|---|---|---|');
for (const [id, t] of [...regles].sort((x, y) => x[0].localeCompare(y[0], 'fr', { numeric: true }))) {
  const cs = uniq([...citeesPar(t, RE.CE), ...[...contrats].filter(([ce, c]) => c.lignes.some(i => (L13[i].match(RE.RM) || []).includes(id))).map(([ce]) => ce)]);
  const rs = [...recettes].filter(([r, l]) => (l.match(RE.RM) || []).includes(id)).map(([r]) => r);
  A.push(`| ${lien(id)} | ${cs.map(lien).join(', ')} | ${rs.map(lien).join(', ')} | ${citeesPar(t, RE.D).map(lien).join(', ')} |`); }
A.push('', '## Contrats → règles', '', '| Contrat | Règles applicables (références écrites) |', '|---|---|');
for (const [ce] of contrats) { const txt = contrats.get(ce).lignes.map(i => L13[i]).join(' '); const toutes = uniq([...citeesPar(txt, RE.RM).filter(id => regles.has(id)), ...[...regles].filter(([id, t]) => t.includes(ce)).map(([id]) => id)]); A.push(`| ${lien(ce)} | ${toutes.map(lien).join(', ')} |`); }
A.push('', '## Rattachements contrat → règle établis par lecture', '', 'CERTAIN : le contrat énonce, pour cet écran, la même condition et le même résultat que la règle (extraits exacts ci-dessous) ; repris dans la ligne « Règles applicables » du contrat. PROBABLE : même sujet, application non explicite ; **à confirmer**, non repris dans le contrat.', '', '| Contrat | Règle | Niveau | Extrait du contrat | Extrait de la règle |', '|---|---|---|---|---|');
const cel = s => s.replace(/\|/g, '\\|').replace(/\]\([^)]*\)/g, ']');
for (const r of rattach) A.push(`| ${lien(r.ce)} | ${lien(r.rm)} | ${r.niveau} | ${cel(r.pc)} | ${cel(r.pr)} |`);
A.push('', '## Recettes → règles et contrats cités', '', '| Recette | Règles | Contrats |', '|---|---|---|');
for (const [r, l] of recettes) A.push(`| ${lien(r)} | ${citeesPar(l, RE.RM).map(lien).join(', ')} | ${citeesPar(l, RE.CE).map(lien).join(', ')} |`);
console.log(JSON.stringify({ besoins: besoins.size, besoins_citant: bAvec, regles: regles.size, contrats: contrats.size, recettes: recettes.size, contrats_completes: rapport.contrats, contrats_sans_regle: Object.values(rapport.regles_par_contrat).filter(n => !n).length }));
// --json=<fichier> : les ajouts aux contrats sont émis comme corrections JSON (ancien = dernière ligne du tableau
// d'identification, avec le titre du contrat pour l'unicité), à appliquer par appliquer-finalisation.mjs ; l'annexe est écrite.
const oj = (process.argv.find(a => a.startsWith('--json=')) || '').slice(7);
if (oj) { const corr = []; for (const [k, ligne] of ajouts) { const ce = [...contrats].filter(([, c]) => c.debut < k).sort((a, b) => b[1].debut - a[1].debut)[0][0];
    const i0 = contrats.get(ce).debut; const bloc = L13.slice(i0, k + 1).join('\r\n');
    corr.push({ id: `TRA-${ce}`, ref: 'références écrites et rattachements CERTAIN (tracabilite-contrats-*.tsv)', motif: 'RENVOI', classe: 'DOC', file: `@${f13}`, ancien: bloc, nouveau: bloc + '\r\n' + ligne }); }
  fs.writeFileSync(oj, JSON.stringify({ description: 'Traçabilité : ligne « Règles applicables » ajoutée au tableau d’identification des contrats (ajout seul, texte du contrat inchangé).', corrections: corr }, null, 1));
  fs.writeFileSync(path.join(SF, 'Annexe – Matrice de traçabilité.md'), A.join('\r\n') + '\r\n'); console.log(`corrections=${corr.length}`); }
if (go) { const crlf = lire(f13).includes('\r\n'); const out = []; L13.forEach((l, i) => { out.push(l); if (ajouts.has(i)) out.push(ajouts.get(i)); });
  fs.writeFileSync(path.join(SF, f13), out.join(crlf ? '\r\n' : '\n'));
  fs.writeFileSync(path.join(SF, 'Annexe – Matrice de traçabilité.md'), A.join('\r\n') + '\r\n'); }
