// Lot 6A (révision 2) — sections des chapitres réellement modifiées par les PR ouvertes (LECTURE SEULE).
// Usage : node dependances-pr.mjs <racine> <inventaire-sections.tsv> <sortie.tsv> <pr>=<sha> [<pr>=<sha> …]
// Pour chaque PR : diff de sa base (merge-base avec origin/main) à sa tête, limité à docs/Specifications-fonctionnelles/.
// Chaque bloc modifié est rattaché au titre (niveau ≤ 3, ou ≤ 2 au ch. 13) qui le précède dans le fichier de base ; ce titre est
// retrouvé dans l'inventaire (même chapitre, même titre ; à défaut, titre le plus proche par position relative).
// Sortie : une ligne par (PR, section) avec le nombre de lignes ajoutées ou retirées ; la colonne « rattachement » dit si le titre
// a été retrouvé à l'identique (EXACT) ou par position (POSITION, à vérifier).
import fs from 'fs'; import { execFileSync } from 'child_process';
const [repo, invf, out, ...prs] = process.argv.slice(2);
const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const inv = fs.readFileSync(invf, 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const rows = ['pr\tchapitre\tsection\ttitre\tlignes_modifiees\trattachement'];
for (const spec of prs) {
  const [pr, sha] = spec.split('=');
  const base = git('merge-base', sha, 'origin/main').trim();
  const files = git('diff', '--name-only', base, sha, '--', 'docs/Specifications-fonctionnelles/').split('\n').filter(f => /\/\d\d – .*\.md$/.test(f));
  for (const f of files) {
    const ch = f.split('/').pop().slice(0, 2); const maxL = ch === '13' ? 2 : 3;
    const lines = git('show', `${base}:${f}`).split(/\r?\n/);
    const heads = []; let fence = false;
    lines.forEach((l, i) => { if (/^```/.test(l)) fence = !fence; const m = !fence && l.match(/^(#{1,6}) (.*)$/); if (m && m[1].length <= maxL) heads.push({ i: i + 1, t: m[2].trim() }); });
    const diff = git('diff', '-U0', base, sha, '--', f);
    const acc = new Map();
    for (const m of diff.matchAll(/^@@ -(\d+)(?:,(\d+))? \+\d+(?:,(\d+))? @@/gm)) {
      const start = +m[1]; const n = Math.max(+(m[2] ?? 1), +(m[3] ?? 1), 1);
      let h = null; for (const x of heads) { if (x.i <= Math.max(start, 1)) h = x; else break; }
      const key = h ? h.t : '(préambule)'; const pos = h ? h.i / lines.length : 0;
      const a = acc.get(key) || { n: 0, pos }; a.n += n; acc.set(key, a);
    }
    const cand = inv.filter(r => r[1] === ch); const total = Math.max(...cand.map(r => +r[6]));
    for (const [t, a] of acc) {
      let r = cand.find(x => x[3] === t); let how = 'EXACT';
      if (!r) { how = 'POSITION'; r = cand.reduce((b, x) => Math.abs(+x[5] / total - a.pos) < Math.abs(+b[5] / total - a.pos) ? x : b); }
      rows.push([pr, ch, r[0], r[3], a.n, how].join('\t'));
    }
  }
}
fs.writeFileSync(out, rows.join('\n') + '\n');
console.log(`lignes=${rows.length - 1}`);
