// Lot 2 — références et liens rompus (corrections documentaires).
// Usage : node appliquer-lot2-liens.mjs <racine-du-depot>
//  2.1 R-01 : liens vers des fichiers supprimés par 7a89220f, dans les documents de traçabilité hors chapitres,
//       remplacés par un permalien GitHub vers le parent 3623466a (état d'origine), texte du lien inchangé.
//  2.2 R-02 : ancres explicites ce-fmt-01..06 au ch. 13, juste avant chaque titre « ## CE-FMT-0n — … ».
//  2.3 R-04 : ch. 08, lien circulaire de la section Formats remplacé (voir LIGNE_R04).
//  2.5 H-15 : README « Références actives », point 4, statuts repris des en-têtes des documents eux-mêmes.
// Garde-fous : chaque remplacement exige une correspondance exacte et unique ; sinon arrêt sans écriture.
import fs from 'fs'; import path from 'path';
const repo = process.argv[2];
const PARENT = '3623466af5a6dcf44dfe676f0ae8019b9c56bf76';
const GH = 'https://github.com/MyUncried/Application-Routine/blob';
const SF = 'docs/Specifications-fonctionnelles';
const writes = new Map(); const journal = [];
const read = rel => writes.has(rel) ? writes.get(rel) : fs.readFileSync(path.join(repo, rel), 'utf8');
const eol = s => (s.includes('\r\n') ? '\r\n' : '\n');
const replaceOnce = (rel, oldS, newS, tag) => {
  const s = read(rel); const n = s.split(oldS).length - 1;
  if (n !== 1) throw new Error(`${tag} : ${n} occurrence(s) dans ${rel}`);
  writes.set(rel, s.replace(oldS, () => newS)); journal.push([tag, rel]);
};
const permalink = repoPath => `${GH}/${PARENT}/${repoPath.split('/').map(encodeURIComponent).join('/')}`;

// 2.1 — liens morts (la liste est recalculée, pas saisie à la main)
const docs = fs.readdirSync(path.join(repo, 'docs')).filter(f => f.endsWith('.md')).map(f => `docs/${f}`);
for (const rel of docs) {
  const s = read(rel); let out = s; let changed = 0;
  out = s.replace(/\]\(([^)\s#]+)(#[^)\s]*)?\)/g, (m, u, frag) => {
    if (/^(https?:|mailto:)/.test(u)) return m;
    let p; try { p = decodeURIComponent(u); } catch { return m; }
    const abs = path.resolve(path.join(repo, 'docs'), p);
    if (fs.existsSync(abs)) return m;
    const repoPath = path.relative(repo, abs).split(path.sep).join('/');
    if (!repoPath.startsWith(`${SF}/`)) throw new Error(`cible hors périmètre : ${repoPath} (${rel})`);
    changed++; return `](${permalink(repoPath)}${frag || ''})`;
  });
  if (changed) { writes.set(rel, out); journal.push(['2.1', rel, `${changed} lien(s)`]); }
}

// 2.2 — ancres explicites CE-FMT au ch. 13
{
  const rel = `${SF}/13 – Contrats d’écran.md`; const s = read(rel); const E = eol(s);
  let out = s;
  for (let n = 1; n <= 6; n++) {
    // Ancre placée juste APRÈS le titre : la PR #370 insère du texte juste avant « ## CE-FMT-05 » ;
    // une ancre avant le titre produirait un conflit de fusion au même point d'insertion.
    const re = new RegExp(`(^|${E})(## CE-FMT-0${n} — [^\\r\\n]*)(${E})`, 'g');
    const hits = (out.match(re) || []).length; if (hits !== 1) throw new Error(`CE-FMT-0${n} : ${hits} titre(s)`);
    if (out.includes(`<a id="ce-fmt-0${n}"></a>`)) throw new Error(`ancre ce-fmt-0${n} déjà présente`);
    out = out.replace(re, (m, a, h, e) => `${a}${h}${e}<a id="ce-fmt-0${n}"></a>${e}`);
  }
  writes.set(rel, out); journal.push(['2.2', rel, '6 ancres']);
}

// 2.3 — R-04 : lien circulaire du ch. 08 (identifiants FMT-01–38 effacés par 7a89220f restaurés au passage)
replaceOnce(`${SF}/08 – Conception fonctionnelle détaillée.md`,
  'Source normative : [spécification Formats du 14/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#formats-conception), . ',
  `Source normative : la présente section, issue de la [spécification Formats du 14/10](${permalink(`${SF}/SPECIFICATION-FORMATS-SEANCES-2026-10-14.md`)}) intégrée le 14/10/2026, FMT-01–38. `,
  '2.3');

// 2.5 — H-15 : README, point 4 des « Références actives »
replaceOnce('docs/README.md',
  '4. [DSF courant](DSF-CADENCE-2026-10-06.md) et [matrice courante Figma](MATRICE-CADENCE-FIGMA-2026-10-06.md).',
  '4. [DSF Cadence du 06/10](DSF-CADENCE-2026-10-06.md), actualisé le 13/10 par le [DSF Deux modes](DSF-DEUX-MODES-ECHEC-2026-10-13.md) ; [matrice Figma Cadence du 06/10](MATRICE-CADENCE-FIGMA-2026-10-06.md), inventaire historique (voir la [matrice du 07/10](MATRICE-FIGMA-2026-10-07.md)).',
  '2.5');

for (const [rel, s] of writes) fs.writeFileSync(path.join(repo, rel), s, 'utf8');
console.log(journal.map(j => j.join('\t')).join('\n'));
