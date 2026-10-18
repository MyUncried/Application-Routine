// Compte, par fichier et par famille, les occurrences d'identifiants entre deux révisions.
// Lecture seule. Usage : node compter-identifiants.mjs <racine> <ref-avant> <ref-après>
import { execFileSync } from 'child_process';
const [repo, a, b] = process.argv.slice(2);
const git = (...x) => { try { return execFileSync('git', ['-C', repo, '-c', 'core.quotepath=off', ...x], { encoding: 'utf8', maxBuffer: 1 << 28 }); } catch { return null; } };
const fams = { 'D-nnn': /\bD-\d{3}\b/g, 'RM-nnn': /\bRM-\d{3}[a-z]?\b/g, 'RM-FMT': /\bRM-FMT-\d+/g, 'FMT-nn': /(?<!RM-|CE-)\bFMT-\d+/g, 'CE-…': /\bCE-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+\b/g, 'REC-nn': /\bREC-\d+/g, 'DEC-nn': /\bDEC-\d+/g, 'SRC-nn': /\bSRC-\d+/g, 'CAD-nn': /\bCAD-\d+/g, 'CIR-nn': /\bCIR-\d+/g };
const files = git('ls-files', 'docs/Specifications-fonctionnelles/*.md').trim().split('\n');
const rows = []; const tot = {};
for (const f of files) {
  const A = git('show', `${a}:${f}`), B = git('show', `${b}:${f}`); if (A === null || B === null) continue;
  for (const [k, re] of Object.entries(fams)) {
    const na = (A.match(re) || []).length, nb = (B.match(re) || []).length;
    if (na !== nb) { rows.push(`${f.split('/').pop()}\t${k}\t${na}\t${nb}\t${nb - na}`); tot[k] = (tot[k] || 0) + nb - na; }
  }
}
console.log('fichier\tfamille\tavant\tapres\tdelta\n' + rows.join('\n'));
console.log('TOTAL\t' + Object.entries(tot).map(([k, v]) => `${k}=${v}`).join(' '));
