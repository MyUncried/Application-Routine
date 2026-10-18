// Lot 6 — justifications transitives pour un contrôle de bout en bout (LECTURE SEULE).
// Usage : node justifier-transitif.mjs <racine> <base> <intermediaire> <justif-intermediaire.tsv> <sortie.tsv>
// Une ligne de <base> qui n'existe plus telle quelle a pu être modifiée en deux temps : d'abord sans changer son texte normalisé
// N2 (étape du lot 6, par exemple les espaces de 6K), puis par une correction déclarée et justifiée contre <intermediaire>.
// Si sa forme N2 est celle d'une ligne de <intermediaire> justifiée, elle reçoit le même motif.
import fs from 'fs'; import crypto from 'crypto'; import { execFileSync } from 'child_process';
const [repo, base, inter, jf, out] = process.argv.slice(2);
const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const n1 = s => s.replace(/\s+/g, ' ').trim(); const h = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const n2 = s => n1(s.replace(/^(\s*- )\*\*B-\d{3}\*\* — /, '$1').replace(/(?<=[\p{L}])\s+(?=\d)|(?<=\d)\s+(?=(?:min|ms|s|h)(?![\p{L}\p{N}]))|(?<=\d(?:min|ms))\s+(?=\d)/gu, '').replace(/\]\([^)]*\)/g, ']()').replace(/\b(?:ch\.|chap\.|chapitres?)\s*\d{2}\b/gi, '§CH').replace(/§\s*[\d.]+(?: bis(?:\.\d+)?)?/g, '§').replace(/\bl\.\s*\d+(?:\s*[–-]\s*\d+)?/g, 'l.'));
const J = new Map(fs.readFileSync(jf, 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map(l => { const c = l.split('\t'); return [c[0], c[1]]; }));
const fichiers = r => git('ls-tree', '--name-only', r, 'docs/Specifications-fonctionnelles/').split('\n').filter(f => /\/(\d\d|Annexe – Historique) – ?.*\.md$|\/\d\d – .*\.md$/.test(f));
const parN2 = new Map(); for (const f of fichiers(inter)) for (const l of git('show', `${inter}:${f}`).split(/\r?\n/)) { const t = n1(l); if (!t) continue; const m = J.get(h(t)); if (m) parN2.set(h(n2(l)), m); }
const outL = ['empreinte\tmotif\tsource']; let n = 0;
for (const f of fichiers(base)) for (const l of git('show', `${base}:${f}`).split(/\r?\n/)) { const t = n1(l); if (!t) continue; const m = parN2.get(h(n2(l))); if (m) { outL.push(`${h(t)}\t${m}\ttransitif via ${inter.slice(0, 8)}`); n++; } }
fs.writeFileSync(out, outL.join('\n') + '\n'); console.log(`justifications transitives=${n}`);
