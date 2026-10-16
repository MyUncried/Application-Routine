// Application du lot 1 — restauration et traçabilité des décisions historiques (ch. 07 uniquement).
// Autorisation : décision A-PRE4 de Hermann du 16/10/2026, limitée au lot 1.
// Usage : node appliquer-lot1-registre.mjs <racine-du-depot>
// Garde-fous :
//  - refuse de s'exécuter si le ch. 07 sur disque n'est pas le blob de base attendu ;
//  - tous les textes restaurés sont lus dans les objets Git sources, jamais saisis à la main ;
//  - aucune colonne Statut ni trace n'est modifiée, hors G2 (restauration explicite des colonnes de D-357 à D-369).
import { execFileSync } from 'child_process';
import fs from 'fs'; import path from 'path';
const repo = process.argv[2];
const REL = 'docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md';
const BASE_BLOB = '2b5e02efeae73e06438315d516a25fad023136f5';
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const file = path.join(repo, REL);
const blob = git('hash-object', file).trim();
if (blob !== BASE_BLOB) { console.error(`ARRÊT : ch. 07 = ${blob}, attendu ${BASE_BLOB}`); process.exit(2); }

const EOL = '\r\n';
const split = s => s.split(/\r?\n/);
const cur = split(fs.readFileSync(file, 'utf8'));
const src = { '37e372cd^': split(git('show', `37e372cd^:${REL}`)), '7a89220f^': split(git('show', `7a89220f^:${REL}`)), '341f4d41': split(git('show', `341f4d41:${REL}`)) };
const row = (lines, d) => { const i = lines.findIndex(l => l.startsWith(`| ${d} |`)); if (i < 0) throw new Error(`${d} introuvable`); return i; };
const cells = l => l.split('|').slice(1, -1).map(s => s.trim());
const journal = [];

// G1 — 24 décisions : texte historique ajouté après la prescription courante ; colonnes 3 et 4 inchangées.
const G1 = ['D-237','D-252','D-268','D-269','D-270','D-271','D-274','D-275','D-276','D-277','D-279','D-280','D-281','D-282','D-283','D-284','D-285','D-286','D-288','D-292','D-295','D-296','D-302','D-305'];
const PRESC = 'Prescription courante : Bip v2 et D-308–313 ; ancienne version conservée dans Git.';
for (const d of G1) {
  const i = row(cur, d); const c = cells(cur[i]);
  if (c[1] !== PRESC) throw new Error(`${d} : prescription courante inattendue`);
  const orig = cells(src['37e372cd^'][row(src['37e372cd^'], d)])[1];
  if (!orig || orig.includes('|')) throw new Error(`${d} : texte d'origine invalide`);
  const nouveau = `${PRESC} Texte historique antérieur au 07/10/2026 (\`37e372cd^\`), restauré pour traçabilité ; il ne remplace pas la prescription courante : « ${orig} »`;
  // Remplacement de la seule cellule 2, en conservant à l'octet près le reste de la ligne.
  const k = cur[i].indexOf(PRESC);
  cur[i] = cur[i].slice(0, k) + nouveau + cur[i].slice(k + PRESC.length);
  journal.push(['G1', d, '37e372cd^']);
}

// G2 — D-357 à D-369 : en-tête à 4 colonnes et lignes complètes de 7a89220f^.
{
  const P = src['7a89220f^'];
  const i357 = row(cur, 'D-357'), j357 = row(P, 'D-357');
  if (cur[i357 - 2] !== '| ID | Décision |' || cur[i357 - 1] !== '|---|---|') throw new Error('G2 : en-tête courant inattendu');
  if (!P[j357 - 2].startsWith('| ID | Décision / provenance | Statut | Portée |')) throw new Error('G2 : en-tête source inattendu');
  cur[i357 - 2] = P[j357 - 2]; cur[i357 - 1] = P[j357 - 1];
  journal.push(['G2', 'en-tête', '7a89220f^']);
  for (let n = 357; n <= 369; n++) { const d = `D-${n}`; cur[row(cur, d)] = P[row(P, d)]; journal.push(['G2', d, '7a89220f^']); }
}

// G3 — 8 décisions : ligne de 7a89220f^ (seule différence : renvois entre parenthèses effacés).
for (const d of ['D-089','D-091','D-209','D-217','D-256','D-265','D-350','D-355']) {
  cur[row(cur, d)] = src['7a89220f^'][row(src['7a89220f^'], d)]; journal.push(['G3', d, '7a89220f^']);
}

// G4 — D-334 et D-335 de 341f4d41, insérées sans ligne vide juste après D-333 (dans 341f4d41, des lignes vides
// les séparaient de D-333 et les sortaient du tableau Markdown ; le texte des lignes est repris à l'identique).
{
  const S = src['341f4d41']; const i333 = row(cur, 'D-333');
  if (cells(cur[i333]).join('|') !== cells(S[row(S, 'D-333')]).join('|')) throw new Error('G4 : D-333 diffère de la source');
  cur.splice(i333 + 1, 0, S[row(S, 'D-334')], S[row(S, 'D-335')]);
  journal.push(['G4', 'D-334', '341f4d41'], ['G4', 'D-335', '341f4d41']);
}

fs.writeFileSync(file, cur.join(EOL), 'utf8');
console.log(journal.map(j => j.join('\t')).join('\n'));
console.error(`appliqué : ${journal.length} opérations ; décisions = ${cur.filter(l => /^\| D-\d{3} \|/.test(l)).length}`);
