// Lot 6 (finalisation) — conservation dans les documents de docs/ hors chapitres (DSF, PRODUCT, INDEX, matrices…). LECTURE SEULE.
// Usage : node verifier-hors-chapitres.mjs <racine> <commit-de-reference> [justifications.tsv]
// Une ligne dont l'empreinte figure dans les justifications (correction déclarée) est admise.
// Toute ligne de contenu retirée ou modifiée dans un document de docs/ (hors docs/Specifications-fonctionnelles/, archives,
// preparation, sources) depuis la référence est découpée en phrases ; chaque phrase d'au moins 20 caractères doit se retrouver,
// espaces et cibles de liens neutralisés, dans un fichier .md actuel de docs/ (cas d'un transfert vers un chapitre, éventuellement
// par morceaux). Sinon : échec (règle perdue).
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const [repo, ref, justif] = process.argv.slice(2);
const crypto = await import('crypto'); const hj = s => crypto.createHash('sha1').update(s.replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 16);
const J = new Set(justif && fs.existsSync(justif) ? fs.readFileSync(justif, 'utf8').split(/\r?\n/).map(l => l.split('\t')[0]) : []);
const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const n = s => s.replace(/\]\([^)]*\)/g, ']').replace(/\s+/g, ' ').trim();
const contenu = l => { const t = n(l); return t && !/^\|?\s*:?-{3,}/.test(t) && !/^#{1,6} /.test(t) && t !== '---' ? t : null; };
let corpus = ''; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.md')) corpus += '\n' + fs.readFileSync(p, 'utf8').split(/\r?\n/).map(l => contenu(l) || '').join('\n'); } })(path.join(repo, 'docs'));
const phrases = t => t.split(/(?<=[.;])\s+/).map(x => x.replace(/[.;]$/, '').trim()).filter(x => x.length >= 20);
const fichiers = git('diff', '--name-only', ref, '--', 'docs').split('\n').filter(f => f.endsWith('.md') && !/^docs\/(Specifications-fonctionnelles|archives|preparation|sources)\//.test(f));
let ko = 0;
for (const f of fichiers) { let avant = ''; try { avant = git('show', `${ref}:${f}`); } catch { continue; }
  const apres = new Set(fs.existsSync(path.join(repo, f)) ? fs.readFileSync(path.join(repo, f), 'utf8').split(/\r?\n/).map(contenu).filter(Boolean) : []);
  for (const l of avant.split(/\r?\n/)) { const t = contenu(l); if (!t || apres.has(t)) continue;
    if (J.has(hj(l))) { console.log(`justifiée : ${f} « ${t.slice(0, 70)} »`); continue; }
    const manque = phrases(t).filter(p => !corpus.includes(p));
    if (!manque.length) { console.log(`retrouvée ailleurs : ${f} « ${t.slice(0, 70)} »`); continue; }
    ko++; console.log(`PERDUE : ${f} « ${manque[0].slice(0, 90)} »`); } }
console.log(`documents hors chapitres modifiés=${fichiers.length} lignes_perdues=${ko}`); process.exit(ko ? 1 : 0);
