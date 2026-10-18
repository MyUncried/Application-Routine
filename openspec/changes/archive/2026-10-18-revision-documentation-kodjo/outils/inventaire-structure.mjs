// Lot 6A — inventaire structurel des 13 chapitres (LECTURE SEULE).
// Usage : node inventaire-structure.mjs <racine> <sortie-sections.tsv> <sortie-unites.tsv>
// 1. Sections : titres de niveau 1 à 3 (ch. 13 : niveaux 1 et 2, un contrat = une unité, ses 20 rubriques agrégées).
//    Colonnes : id, chapitre, niveau, titre, ancres, ligne_debut, ligne_fin, lignes, mots, ids_definis, nb_ids_cites,
//    datee (titre portant une date ou « Complément/Révision/Actualisation »), liens_entrants (depuis docs/).
// 2. Unités de conservation : chaque identifiant défini (D-, RM-, CE-, REC-, CIR-, DM-, API-, FMT- au format titre/ligne de
//    tableau) et chaque ligne de contenu non vide (empreinte SHA-1 du texte normalisé), avec sa section d'origine.
//    Après restructuration, toute unité doit se retrouver (identifiants : exactement une définition ; lignes : présentes
//    à l'identique, ou justifiées dans la table de correspondance).
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const [repo, outS, outU] = process.argv.slice(2);
const SF = path.join(repo, 'docs', 'Specifications-fonctionnelles');
const chapters = fs.readdirSync(SF).filter(f => /^\d\d – .*\.md$/.test(f)).sort();
const ID_DEF = [
  [/^\| (D-\d{3}) \|/, 'D'], [/^\| (RM-\d{3}[a-z]?) \|/, 'RM'], [/^#{2,3} (RM-FMT-\d+)\s*$/, 'RM'], [/^## (CE-[A-Z0-9-]+?)(?: —|$)/, 'CE'],
  [/^\| (REC-\d+) \|/, 'REC'], [/^\| (CIR-\d+) \|/, 'CIR'], [/^\| (DM-\d+) \|/, 'DM'], [/^\| `?(API-[A-Z]+-\d+(?:\.\.\d+)?)`? \|/, 'API'],
];
const ID_ANY = /\b(?:D-\d{3}|RM-(?:FMT-)?\d+[a-z]?|CE-[A-Z0-9]+(?:-[A-Z0-9]+)*|REC-\d+|CIR-\d+|DM-\d+|API-[A-Z]+-\d+)\b/g;
const norm = s => s.replace(/\s+/g, ' ').trim();
// liens entrants : cible fichier + ancre
const inbound = new Map();
const docs = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/archives|preparation|sources/.test(p)) walk(p); } else if (p.endsWith('.md')) docs.push(p); } })(path.join(repo, 'docs'));
for (const f of docs) for (const m of fs.readFileSync(f, 'utf8').matchAll(/\]\(([^)\s]+)\)/g)) {
  let [p, h] = m[1].split('#'); if (/^https?:/.test(p)) continue; try { p = decodeURIComponent(p); } catch {}
  const tgt = p ? path.basename(p) : path.basename(f); const key = `${tgt}#${h || ''}`; inbound.set(key, (inbound.get(key) || 0) + 1);
}
const S = [['id', 'chapitre', 'niveau', 'titre', 'ancres', 'ligne_debut', 'ligne_fin', 'lignes', 'mots', 'ids_definis', 'nb_ids_cites', 'datee', 'liens_entrants'].join('\t')];
const U = [['unite', 'type', 'chapitre', 'ligne', 'section_id', 'empreinte_ou_id', 'extrait'].join('\t')];
let sid = 0;
for (const ch of chapters) {
  const lines = fs.readFileSync(path.join(SF, ch), 'utf8').split(/\r?\n/); const num = ch.slice(0, 2);
  const maxLevel = num === '13' ? 2 : 3;
  const heads = []; let fence = false;
  lines.forEach((l, i) => { if (/^```/.test(l)) fence = !fence; const m = !fence && l.match(/^(#{1,6}) (.*)$/); if (m && m[1].length <= maxLevel) heads.push({ i, lvl: m[1].length, title: m[2].trim() }); });
  if (!heads.length || heads[0].i > 0) heads.unshift({ i: 0, lvl: 0, title: '(préambule)' });
  heads.forEach((h, k) => {
    const end = k + 1 < heads.length ? heads[k + 1].i - 1 : lines.length - 1; const body = lines.slice(h.i, end + 1);
    const id = `S${num}-${String(++sid).padStart(4, '0')}`; h.id = id;
    const anchors = []; for (let j = Math.max(0, h.i - 3); j <= h.i + 1 && j < lines.length; j++) for (const a of lines[j].matchAll(/<a id="([^"]+)"/g)) anchors.push(a[1]);
    const defs = []; let cites = 0;
    body.forEach((l, j) => {
      for (const [re, t] of ID_DEF) { const m = l.match(re); if (m) { defs.push(m[1]); U.push(['ID', t, num, h.i + j + 1, id, m[1], ''].join('\t')); } }
      cites += (l.match(ID_ANY) || []).length;
      const n = norm(l); if (n && !/^\|?\s*-{3,}/.test(n) && !/^#{1,6} /.test(n) && !/^<a id=/.test(n)) U.push(['LIGNE', '', num, h.i + j + 1, id, crypto.createHash('sha1').update(n).digest('hex').slice(0, 16), n.slice(0, 80).replace(/\t/g, ' ')].join('\t'));
    });
    const dated = /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b|\d{1,2} (septembre|octobre|août) 20\d\d|Complément|Révision|Actualisation|Évolution cible|Extension normative/i.test(h.title) ? 'oui' : 'non';
    const inb = anchors.reduce((s, a) => s + (inbound.get(`${ch}#${a}`) || 0), 0);
    S.push([id, num, h.lvl, h.title.replace(/\t/g, ' '), anchors.join(' '), h.i + 1, end + 1, end - h.i + 1, body.join(' ').split(/\s+/).filter(Boolean).length, defs.join(' '), cites, dated, inb].join('\t'));
  });
}
fs.writeFileSync(outS, S.join('\n') + '\n'); fs.writeFileSync(outU, U.join('\n') + '\n');
const idDefs = U.filter(u => u.startsWith('ID\t')); const dup = {}; idDefs.forEach(u => { const k = u.split('\t')[5]; dup[k] = (dup[k] || 0) + 1; });
console.log(`sections=${S.length - 1} unites_lignes=${U.filter(u => u.startsWith('LIGNE')).length} ids_definis=${idDefs.length} ids_definis_plusieurs_fois=${Object.values(dup).filter(v => v > 1).length}`);
