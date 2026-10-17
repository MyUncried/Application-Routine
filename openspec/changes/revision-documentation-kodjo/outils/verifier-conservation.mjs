// Lot 6 — contrôle de conservation d'une restructuration (LECTURE SEULE).
// Usage : node verifier-conservation.mjs <racine> <commit-de-reference> [justifications.tsv] [--detail=<sortie.tsv>] [--cible=<dossier>]
//
// Référence : les 13 chapitres de docs/Specifications-fonctionnelles/ au commit donné (git show).
// Cible : tous les fichiers .md de docs/Specifications-fonctionnelles/ du disque (quels que soient leur nombre et leurs noms).
//
// Contrôles :
//  C1 identifiants — chaque identifiant défini à la référence (D-, RM-, RM-FMT-, CE-, REC-, CIR-, DM-, API-) est défini
//     exactement une fois dans la cible ; aucun identifiant nouveau n'est défini sans figurer dans les justifications.
//  C2 lignes — chaque ligne de contenu de la référence (hors titres, ancres, séparateurs de tableau) se retrouve dans la cible :
//     N1 à l'identique (espaces normalisés) ;
//     N2 à l'identique après neutralisation des cibles de liens et des renvois de localisation (« ch. 08 », « chapitre 10 »,
//        « § 3.8 », « l. 1584 ») — utile quand un renvoi a été mis à jour par un déplacement ;
//     sinon la ligne doit figurer dans justifications.tsv (empreinte N1 ; motif ∈ COPIE-RETIREE, RENVOI, FUSION-TITRE,
//     HISTORIQUE-ARCHIVE, CORRECTION-DECIDEE:<D-xxx>), faute de quoi le contrôle échoue.
//  C3 multiplicités — liste les lignes dont le nombre d'occurrences a baissé (copies retirées) : information pour la revue.
//  C4 décisions — le texte de chaque ligne du registre (D-nnn) est conservé à l'identique (N1), sans exception possible.
// Code de sortie : 0 si C1, C2 et C4 sont satisfaits ; 1 sinon.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { execFileSync } from 'child_process';
const args = process.argv.slice(2); const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [repo, ref, justif] = args.filter(a => !a.startsWith('--'));
const DIR = 'docs/Specifications-fonctionnelles';
const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const refFiles = git('ls-tree', '--name-only', ref, DIR + '/').split('\n').filter(f => /\/\d\d – .*\.md$/.test(f));
const refDocs = refFiles.map(f => ({ name: path.basename(f), lines: git('show', `${ref}:${f}`).split(/\r?\n/) }));
const tgtDir = opt.cible || path.join(repo, DIR); // --cible=<dossier> : contrôle d'une copie de travail hors dépôt
const tgtDocs = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/^images/.test(e.name)) walk(p); } else if (p.endsWith('.md')) tgtDocs.push({ name: path.relative(tgtDir, p), lines: fs.readFileSync(p, 'utf8').split(/\r?\n/) }); } })(tgtDir);
const ID_DEF = [/^\| (D-\d{3}) \|/, /^\| (RM-\d{3}[a-z]?) \|/, /^#{2,4} (RM-FMT-\d+)\s*$/, /^#{2,4} (CE-[A-Z0-9-]+?)(?: —|$)/, /^\| (REC-\d+) \|/, /^\| (CIR-\d+) \|/, /^\| (DM-\d+) \|/, /^\| `?(API-[A-Z]+-\d+(?:\.\.\d+)?)`? \|/];
const n1 = s => s.replace(/\s+/g, ' ').trim();
const n2 = s => n1(s.replace(/\]\([^)]*\)/g, ']()').replace(/\b(?:ch\.|chap\.|chapitres?)\s*\d{2}\b/gi, '§CH').replace(/§\s*[\d.]+(?: bis(?:\.\d+)?)?/g, '§').replace(/\bl\.\s*\d+(?:\s*[–-]\s*\d+)?/g, 'l.'));
const h = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const content = l => { const t = n1(l); return t && !/^\|?\s*:?-{3,}/.test(t) && !/^#{1,6} /.test(t) && !/^<a id=/.test(t) && t !== '---' ? t : null; };
function scan(docs) {
  const ids = new Map(), c1 = new Map(), c2 = new Map(), dec = new Map();
  for (const d of docs) { let fence = false; d.lines.forEach((l, i) => {
    if (/^```/.test(l)) fence = !fence;
    if (!fence) for (const re of ID_DEF) { const m = l.match(re); if (m) { const a = ids.get(m[1]) || []; a.push(`${d.name}:${i + 1}`); ids.set(m[1], a); } }
    const t = content(l); if (!t) return;
    const k1 = h(t), k2 = h(n2(l)); c1.set(k1, (c1.get(k1) || 0) + 1); c2.set(k2, (c2.get(k2) || 0) + 1);
    const m = l.match(/^\| (D-\d{3}) \|/); if (m) dec.set(m[1], k1);
  }); }
  return { ids, c1, c2, dec };
}
const R = scan(refDocs), T = scan(tgtDocs);
const J = new Map(); if (justif && fs.existsSync(justif)) for (const l of fs.readFileSync(justif, 'utf8').split(/\r?\n/).slice(1)) { const c = l.split('\t'); if (c[0]) J.set(c[0], c[1]); }
const fail = []; const detail = ['controle\tcle\tetat\tinfo'];
// C1
for (const [id, locs] of R.ids) { const t = T.ids.get(id) || []; if (t.length !== 1) { fail.push(`C1 ${id} défini ${t.length} fois dans la cible`); detail.push(`C1\t${id}\tKO\t${t.join(' ')}`); } }
for (const [id, locs] of T.ids) if (!R.ids.has(id)) { const ok = J.has(id); if (!ok) fail.push(`C1 ${id} nouveau, non justifié`); detail.push(`C1\t${id}\t${ok ? 'JUSTIFIE' : 'KO'}\tnouveau ${locs.join(' ')}`); }
// C2 / C3
let s1 = 0, s2 = 0, sj = 0, ko = 0, dec3 = 0; const seen = new Set();
for (const d of refDocs) d.lines.forEach((l, i) => { const t = content(l); if (!t) return; const k1 = h(t); if (seen.has(k1)) return; seen.add(k1);
  if (T.c1.has(k1)) { s1++; if (T.c1.get(k1) < R.c1.get(k1)) { dec3++; detail.push(`C3\t${k1}\tMOINS\t${R.c1.get(k1)}→${T.c1.get(k1)} ${d.name}:${i + 1}`); } return; }
  if (T.c2.has(h(n2(l)))) { s2++; detail.push(`C2\t${k1}\tN2\t${d.name}:${i + 1}`); return; }
  if (J.has(k1)) { sj++; detail.push(`C2\t${k1}\tJUSTIFIE\t${J.get(k1)} ${d.name}:${i + 1}`); return; }
  ko++; fail.push(`C2 ligne absente ${d.name}:${i + 1} « ${t.slice(0, 70)} »`); detail.push(`C2\t${k1}\tKO\t${d.name}:${i + 1}`); });
// C4
let c4 = 0; for (const [id, k] of R.dec) if (!T.c1.has(k)) { c4++; fail.push(`C4 texte de ${id} modifié`); }
if (opt.detail) fs.writeFileSync(opt.detail, detail.join('\n') + '\n');
console.log(`référence=${ref} fichiers_ref=${refDocs.length} fichiers_cible=${tgtDocs.length}`);
console.log(`C1 identifiants : ${R.ids.size} de référence, ${T.ids.size} dans la cible`);
console.log(`C2 lignes distinctes : ${seen.size} ; N1=${s1} N2=${s2} justifiées=${sj} absentes=${ko}`);
console.log(`C3 lignes dont les occurrences diminuent : ${dec3}`);
console.log(`C4 décisions au texte modifié : ${c4} sur ${R.dec.size}`);
if (fail.length) { console.log(`ÉCHEC (${fail.length})`); fail.slice(0, 40).forEach(f => console.log('  ' + f)); process.exit(1); }
console.log('CONSERVATION VÉRIFIÉE');
