// Lot 6 — contrôle de conservation d'une restructuration (LECTURE SEULE).
// Usage : node verifier-conservation.mjs <racine> <commit-de-reference> [justifications.tsv] [--detail=<sortie.tsv>] [--cible=<dossier>]
//
// Référence : les chapitres de docs/Specifications-fonctionnelles/ au commit donné (git show).
// Cible : tous les fichiers .md de docs/Specifications-fonctionnelles/ du disque (hors dossiers images*), ou --cible.
//
// Contrôles (révision 2 : sens, références et autorité ajoutés ; C1, C2, C4 à C7 bloquants, C3 informatif) :
//  C1 identifiants — chaque identifiant défini à la référence (D-, RM-, RM-FMT-, CE-, REC-, CIR-, DM-, API-) est défini
//     exactement une fois dans la cible ; aucun identifiant nouveau sans justification.
//  C2 lignes — chaque ligne de contenu de la référence (hors titres, ancres, séparateurs) se retrouve dans la cible :
//     N1 à l'identique (espaces normalisés) ; N2 aux cibles de liens et renvois de localisation près (« ch. 08 », « § 3.8 »,
//     « l. 1584 ») ; sinon elle figure dans justifications.tsv (empreinte N1, motif).
//  C3 copies retirées (informatif) — lignes dont le nombre d'occurrences baisse.
//  C4 registre — le texte de chaque décision D-nnn est conservé à l'identique (cibles des liens exceptées), sans exception possible.
//  C5 portée — chaque ligne garde son contexte de portée, lu dans le chemin des titres qui l'englobent : COURANT, HORS-MVP
//     (« hors MVP », « post-MVP », « cible future », « V2 »…), HISTORIQUE (« historique », « ancien », « retiré »… ; tout le
//     fichier « Annexe »). Aucune ligne ne prend une portée qu'elle n'avait pas (une règle hors MVP ne devient pas courante, un
//     texte historique ne devient pas normatif) ; une ligne dont aucune occurrence n'est retirée ne perd aucune portée.
//  C6 autorité — aucune ligne distincte portant un marqueur d'autorité ne disparaît (sauf justification) : « À CLARIFIER », « remplacée par »,
//     « supersédée », « précisée sur ce point », « prévaut », « Validée », « non décidé ».
//  C7 références — chaque identifiant cité à la référence reste cité ; tout identifiant cité dans la cible et défini à la
//     référence y est encore défini (pas de renvoi vers une règle disparue).
//  Justifications : motif ∈ COPIE-RETIREE | RENVOI | FUSION-TITRE | HISTORIQUE-ARCHIVE | CORRECTION-DECIDEE:D-nnn, la décision
//     citée devant exister dans le registre de la cible.
// Code de sortie : 0 si C1, C2, C4 à C7 et les justifications sont satisfaits ; 1 sinon.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { execFileSync } from 'child_process';
const args = process.argv.slice(2); const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [repo, ref, justif] = args.filter(a => !a.startsWith('--'));
const DIR = 'docs/Specifications-fonctionnelles';
const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const refFiles = git('ls-tree', '--name-only', ref, DIR + '/').split('\n').filter(f => /\/\d\d – .*\.md$/.test(f));
const refDocs = refFiles.map(f => ({ name: path.basename(f), lines: git('show', `${ref}:${f}`).split(/\r?\n/) }));
const tgtDir = opt.cible || path.join(repo, DIR); // --cible=<dossier> : contrôle d'une copie de travail hors dépôt
const tgtDocs = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/^images/.test(e.name)) walk(p); } else if (p.endsWith('.md')) tgtDocs.push({ name: path.relative(tgtDir, p), lines: fs.readFileSync(p, 'utf8').split(/\r?\n/) }); } })(tgtDir);
const ID_DEF = [/^\| (D-\d{3}) \|/, /^\| (RM-\d{3}[a-z]?) \|/, /^#{2,6} (RM-FMT-\d+)\s*$/, /^#{2,6} (CE-[A-Z0-9-]+?)(?: —|$)/, /^\| (REC-\d+) \|/, /^\| (CIR-\d+) \|/, /^\| (DM-\d+) \|/, /^\| `?(API-[A-Z]+-\d+(?:\.\.\d+)?)`? \|/];
const ID_CITE = /\b(?:D-\d{3}|RM-FMT-\d+|RM-\d{3}[a-z]?|CE-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+|REC-\d+|CIR-\d+|DM-\d+|API-[A-Z]+-\d+)\b/g;
const PORTEE = [['HORS-MVP', /hors MVP|post-MVP|cible future|\bfutur|ultérieure|\bV[2-4]\b|évolution/i], ['HISTORIQUE', /historique|\bancien|retiré|archiv/i]];
const MARQUEURS = [['A-CLARIFIER', /À CLARIFIER/], ['REMPLACE', /remplacée? par|supersédée?|\bsupersède/i], ['PRECISE', /précisée? sur ce point|précise D-\d{3}/i], ['PREVAUT', /\bprévaut\b|\bprévalent\b/i], ['VALIDEE', /\bValidée\b/], ['NON-DECIDE', /non décidé|aucun n’est décidé|non tranché/i]];
const n1 = s => s.replace(/\s+/g, ' ').trim();
const n2 = s => n1(s.replace(/\]\([^)]*\)/g, ']()').replace(/\b(?:ch\.|chap\.|chapitres?)\s*\d{2}\b/gi, '§CH').replace(/§\s*[\d.]+(?: bis(?:\.\d+)?)?/g, '§').replace(/\bl\.\s*\d+(?:\s*[–-]\s*\d+)?/g, 'l.'));
const h = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const content = l => { const t = n1(l); return t && !/^\|?\s*:?-{3,}/.test(t) && !/^#{1,6} /.test(t) && !/^<a id=/.test(t) && t !== '---' ? t : null; };
function scan(docs) {
  const ids = new Map(), c1 = new Map(), c2 = new Map(), dec = new Map(), por = new Map(), cites = new Map(), marq = {};
  for (const d of docs) { let fence = false; const stack = []; const annexe = /^Annexe/i.test(path.basename(d.name));
    d.lines.forEach((l, i) => {
      if (/^```/.test(l)) fence = !fence;
      const hm = !fence && l.match(/^(#{1,6}) (.*)$/); if (hm) { const lvl = hm[1].length; while (stack.length && stack[stack.length - 1].lvl >= lvl) stack.pop(); stack.push({ lvl, t: hm[2] }); }
      if (!fence) for (const re of ID_DEF) { const m = l.match(re); if (m) { const a = ids.get(m[1]) || []; a.push(`${d.name}:${i + 1}`); ids.set(m[1], a); } }
      const t = content(l); if (!t) return;
      const k1 = h(t), k2 = h(n2(l)); c1.set(k1, (c1.get(k1) || 0) + 1); c2.set(k2, (c2.get(k2) || 0) + 1);
      const chemin = stack.map(x => x.t).join(' / ');
      const p = PORTEE.filter(([, re]) => re.test(chemin)).map(([k]) => k); if (annexe && !p.includes('HISTORIQUE')) p.push('HISTORIQUE');
      const ps = por.get(k1) || new Set(); ps.add(p.join('+') || 'COURANT'); por.set(k1, ps);
      for (const c of t.match(ID_CITE) || []) cites.set(c, (cites.get(c) || 0) + 1);
      for (const [k, re] of MARQUEURS) if (re.test(t)) (marq[k] ||= new Set()).add(k1); // lignes distinctes : retirer une copie ne compte pas
      const m = l.match(/^\| (D-\d{3}) \|/); if (m) dec.set(m[1], h(n1(l.replace(/\]\([^)]*\)/g, ']()')))); // C4 : texte comparé hors cibles de liens
    }); }
  return { ids, c1, c2, dec, por, cites, marq };
}
const R = scan(refDocs), T = scan(tgtDocs);
const fail = []; const detail = ['controle\tcle\tetat\tinfo'];
// Justifications
const J = new Map(); const MOTIF = /^(COPIE-RETIREE|RENVOI|FUSION-TITRE|HISTORIQUE-ARCHIVE|CORRECTION-DECIDEE:(D-\d{3}))$/;
if (justif && fs.existsSync(justif)) for (const l of fs.readFileSync(justif, 'utf8').split(/\r?\n/).slice(1)) { const c = l.split('\t'); if (!c[0]) continue;
  const m = (c[1] || '').match(MOTIF); if (!m) fail.push(`JUSTIF motif invalide pour ${c[0]} : « ${c[1]} »`); else if (m[2] && !T.ids.has(m[2])) fail.push(`JUSTIF ${c[0]} cite ${m[2]}, absente du registre`); J.set(c[0], c[1]); }
// C1
for (const [id] of R.ids) { const t = T.ids.get(id) || []; if (t.length !== 1) { fail.push(`C1 ${id} défini ${t.length} fois dans la cible`); detail.push(`C1\t${id}\tKO\t${t.join(' ')}`); } }
for (const [id, locs] of T.ids) if (!R.ids.has(id)) { const ok = J.has(id); if (!ok) fail.push(`C1 ${id} nouveau, non justifié`); detail.push(`C1\t${id}\t${ok ? 'JUSTIFIE' : 'KO'}\tnouveau ${locs.join(' ')}`); }
// C2 / C3 / C5
let s1 = 0, s2 = 0, sj = 0, ko = 0, dec3 = 0, c5 = 0; const seen = new Set();
for (const d of refDocs) d.lines.forEach((l, i) => { const t = content(l); if (!t) return; const k1 = h(t); if (seen.has(k1)) return; seen.add(k1);
  const where = `${d.name}:${i + 1}`;
  if (T.c1.has(k1)) { s1++; const baisse = T.c1.get(k1) < R.c1.get(k1); if (baisse) { dec3++; detail.push(`C3\t${k1}\tMOINS\t${R.c1.get(k1)}→${T.c1.get(k1)} ${where}`); }
    const rp = R.por.get(k1), tp = T.por.get(k1);
    const gagnees = [...tp].filter(x => !rp.has(x)); const perdues = baisse ? [] : [...rp].filter(x => !tp.has(x));
    if ((gagnees.length || perdues.length) && !J.has(k1)) { c5++; fail.push(`C5 portée changée ${where} : ${[...rp].join(',')} → ${[...tp].join(',')} « ${t.slice(0, 50)} »`); detail.push(`C5\t${k1}\tKO\t${where} ${[...rp].join(',')}→${[...tp].join(',')}`); }
    return; }
  if (T.c2.has(h(n2(l)))) { s2++; detail.push(`C2\t${k1}\tN2\t${where}`); return; }
  if (J.has(k1)) { sj++; detail.push(`C2\t${k1}\tJUSTIFIE\t${J.get(k1)} ${where}`); return; }
  ko++; fail.push(`C2 ligne absente ${where} « ${t.slice(0, 70)} »`); detail.push(`C2\t${k1}\tKO\t${where}`); });
// C4
let c4 = 0; const tdec = new Set(T.dec.values()); for (const [id, k] of R.dec) if (!tdec.has(k)) { c4++; fail.push(`C4 texte de ${id} modifié`); }
// C6
const c6 = []; for (const [k] of MARQUEURS) { const rs = R.marq[k] || new Set(), ts = T.marq[k] || new Set(); const perdus = [...rs].filter(x => !ts.has(x) && !J.has(x)); if (perdus.length) c6.push(`${k} : ${perdus.length} ligne(s) marquée(s) disparue(s)`); }
c6.forEach(x => fail.push(`C6 marqueur d'autorité en baisse : ${x}`));
// C7
let c7 = 0; for (const [id] of R.cites) if (!T.cites.has(id) && !J.has(id)) { c7++; fail.push(`C7 ${id} n'est plus cité`); }
for (const [id] of T.cites) if (R.ids.has(id) && !T.ids.has(id)) { c7++; fail.push(`C7 ${id} cité mais plus défini`); }
if (opt.detail) fs.writeFileSync(opt.detail, detail.join('\n') + '\n');
console.log(`référence=${ref} fichiers_ref=${refDocs.length} fichiers_cible=${tgtDocs.length}`);
console.log(`C1 identifiants : ${R.ids.size} de référence, ${T.ids.size} dans la cible`);
console.log(`C2 lignes distinctes : ${seen.size} ; N1=${s1} N2=${s2} justifiées=${sj} absentes=${ko}`);
console.log(`C3 lignes dont les occurrences diminuent : ${dec3} (informatif)`);
console.log(`C4 décisions au texte modifié : ${c4} sur ${R.dec.size}`);
console.log(`C5 lignes dont la portée change : ${c5}`);
console.log(`C6 marqueurs d'autorité en baisse : ${c6.length ? c6.join(' ; ') : 0}`);
console.log(`C7 références perdues ou orphelines : ${c7} (identifiants cités : ${R.cites.size})`);
if (fail.length) { console.log(`ÉCHEC (${fail.length})`); fail.slice(0, 40).forEach(f => console.log('  ' + f)); process.exit(1); }
console.log('CONSERVATION VÉRIFIÉE');
