// Intégration v3 — ajoute à l'annexe générée « Index des identifiants » les identifiants définis par l'intégration
// (B-092, D-370 à D-375 de la PR #370, D-403 à D-424, RM-235 à RM-250), au format des lignes existantes. Le générateur du lot 6 (restructurer.mjs) n'est pas relancé.
// Usage : node completer-index.mjs <racine>
import fs from 'fs'; import path from 'path';
const SF = path.join(process.argv[2], 'docs', 'Specifications-fonctionnelles');
const f = path.join(SF, 'Annexe – Index des identifiants.md'); let s = fs.readFileSync(f, 'utf8'); const nl = s.includes('\r\n') ? '\r\n' : '\n';
const slug = t => t.trim().toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
const enc = n => encodeURIComponent(n).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
const titre = (fichier, re) => { const l = fs.readFileSync(path.join(SF, fichier), 'utf8').split(/\r?\n/).find(x => re.test(x)); if (!l) throw new Error(re); return l.replace(/^#+\s+/, '').trim(); };
const ligne = (id, fichier, t) => `| [${id}](${enc(fichier)}#${slug(t)}) | ${fichier.slice(0, 2)} | ${t} |`;
const F02 = '02 – Utilisateurs et besoins.md', F07 = '07 – Registre des décisions de conception.md', F10 = '10 – Processus métier et règles métier transverses.md';
// Insère les lignes absentes après la dernière ligne déjà présente de la série (ou après « apres »).
const cle = l => l.split(']')[0] + ']';
const ins = (apres, lignes) => { const manq = lignes.filter(l => !s.includes(cle(l))); if (!manq.length) return; const pres = lignes.filter(l => s.includes(cle(l))); const ancre = pres.length ? cle(pres[pres.length - 1]) : apres;
  const i = s.indexOf(ancre); if (i < 0) throw new Error(ancre); const j = s.indexOf(nl, i) + nl.length; s = s.slice(0, j) + manq.join(nl) + nl + s.slice(j); };
const t02 = titre(F02, /^## 8\. Besoins validés pour les évolutions/), t07 = titre(F07, /^## Paramètres d’exécution — décisions du 18 octobre 2026/);
ins('| [B-091]', [ligne('B-092', F02, t02)]);
ins('| [D-402]', Array.from({ length: 22 }, (_, k) => ligne(`D-${403 + k}`, F07, t07)));
const t07p = titre(F07, /^### Phases d’exercice — décisions du 15 octobre 2026/);
ins('| [D-369]', Array.from({ length: 6 }, (_, k) => ligne(`D-${370 + k}`, F07, t07p)));
ins('| [RM-234]', Array.from({ length: 16 }, (_, k) => { const id = `RM-${235 + k}`; return ligne(id, F10, titre(F10, new RegExp(`^#### ${id} —`))); }));
fs.writeFileSync(f, s); console.log('index complété');
