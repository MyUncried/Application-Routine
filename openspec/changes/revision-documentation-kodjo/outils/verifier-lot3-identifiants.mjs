// Vérification indépendante du lot 3 (LECTURE SEULE).
// Usage : node verifier-lot3-identifiants.mjs <racine> <ref-avant> [ref-après | fichier de travail]
// Pour chaque paire de lignes (avant -> après) du diff réel des chapitres :
//  - la ligne « après » doit exister telle quelle dans le même chapitre à 7a89220f^ (ou, pour la table des
//    recettes, dans la spécification Formats d'origine) ;
//  - la ligne « avant » doit s'obtenir à partir de la ligne « après » en retirant des identifiants entiers
//    (avec leurs parenthèses et séparateurs), méthode par énumération des retraits, distincte de l'outil d'application ;
//  - aucun fichier hors chapitres, aucun ch. 07, aucune ligne ajoutée ou supprimée sans contrepartie.
import { execFileSync } from 'child_process';
const [repo, before, after] = process.argv.slice(2);
const git = (...a) => execFileSync('git', ['-C', repo, '-c', 'core.quotepath=off', ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const SF = 'docs/Specifications-fonctionnelles';
const diffArgs = after ? [before, after] : [before];
const files = git('diff', '--name-only', ...diffArgs).trim().split('\n').filter(Boolean);
const ko = []; let ok = 0;
const SPEC = git('show', `7a89220f^:${SF}/SPECIFICATION-FORMATS-SEANCES-2026-10-14.md`).split(/\r?\n/);
const ID = /\b(?:RM-|CE-)?FMT-\d+(?:[–-]\d+)?|\bD-\d{3}(?:[–-]\d{3})?|\bDEC-\d+|\bREC-\d+(?:[–-]\d+)?|\bSRC-\d+|\bCAD-\d+|\bCIR-\d+|\bRM-\d{3}[a-z]?|\bCE-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+\b/g;
// Différence optimale de Myers (O((N+M)·D)) entre la ligne restaurée `a` et la ligne d'avant `b`.
// Exige : aucune insertion (b est obtenue de a par suppressions seules) ; les segments supprimés, réunis,
// contiennent au moins un identifiant ou un fragment d'identifiant, et, une fois ceux-ci retirés, plus que
// de la ponctuation de liaison. Algorithme distinct de l'alignement glouton de l'outil d'application.
function myersDeletions(a, b) {
  const N = a.length, M = b.length, MAX = N + M, off = MAX; const V = new Int32Array(2 * MAX + 2); const trace = [];
  for (let D = 0; D <= MAX; D++) {
    trace.push(V.slice());
    for (let k = -D; k <= D; k += 2) {
      let x = (k === -D || (k !== D && V[off + k - 1] < V[off + k + 1])) ? V[off + k + 1] : V[off + k - 1] + 1;
      let y = x - k; while (x < N && y < M && a[x] === b[y]) { x++; y++; }
      V[off + k] = x;
      if (x >= N && y >= M) {
        // remontée du chemin
        const del = new Array(N).fill(false); let ins = 0; let cx = N, cy = M;
        for (let d = D; d > 0; d--) {
          const Vp = trace[d]; const kk = cx - cy;
          const down = (kk === -d || (kk !== d && Vp[off + kk - 1] < Vp[off + kk + 1]));
          const pk = down ? kk + 1 : kk - 1; const px = Vp[off + pk], py = px - pk;
          while (cx > px && cy > py) { cx--; cy--; }
          if (down) { ins++; cy--; } else { cx--; del[cx] = true; }
        }
        return { ins, del };
      }
    }
  }
  return null;
}
function obtenable(a, b) {
  const r = myersDeletions(a, b); if (!r || r.ins > 0) return false;
  let runs = '', prev = false;
  for (let i = 0; i < a.length; i++) { if (r.del[i]) { runs += a[i]; prev = true; } else if (prev) { runs += ' '; prev = false; } }
  if (!/(?:FMT-\d|D-\d{3}|DEC-\d|REC-\d|SRC-\d|CAD-\d|CIR-\d|RM-\d{3}|CE-[A-Z])/.test(runs)) return false;
  const rest = runs.replace(/(?:RM-|CE-)?FMT-\d+(?:[–-]\d+)?|D-\d{3}(?:[–-]\d{3})?|DEC-\d+|REC-\d+(?:[–-]\d+)?|SRC-\d+|CAD-\d+|CIR-\d+|RM-\d{3}[a-z]?|CE-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+/g, '').replace(/\bet\b/g, '');
  return /^[\s()[\],;:/.–\-]*$/.test(rest);
}
for (const f of files) {
  if (!f.startsWith(`${SF}/`) || /\/07 – /.test(f)) { ko.push(`fichier hors périmètre du lot 3 : ${f}`); continue; }
  const O = new Set(git('show', `7a89220f^:${f}`).split(/\r?\n/));
  const d = git('diff', '-U0', ...diffArgs, '--', f).split('\n');
  let minus = [], plus = [];
  const flush = () => {
    if (minus.length !== plus.length) ko.push(`${f} : bloc déséquilibré (${minus.length} -, ${plus.length} +)`);
    for (let k = 0; k < Math.min(minus.length, plus.length); k++) {
      const a = minus[k], b = plus[k];
      if (/^\| Repère \| Situation \| Attendu \| Exigences \|/.test(b) || /^\|---\|---\|---\|---\|$/.test(b)) { (SPEC.includes(b) ? ok++ : ko.push(`${f} : en-tête REC hors source`)); continue; }
      if (/^\| REC-\d+ \|/.test(b)) {
        const c = b.split('|').slice(1, -1).map(x => x.trim());
        (SPEC.includes(b) && a === `| ${c[1]} | ${c[2]} |` ? ok++ : ko.push(`${f} : ligne REC non conforme : ${b.slice(0, 60)}`)); continue;
      }
      if (!O.has(b)) { ko.push(`${f} : ligne restaurée absente de 7a89220f^ : ${b.slice(0, 80)}`); continue; }
      if (/^### RM-FMT-\d+$/.test(b) && a === '### RM-') { ok++; continue; }
      (obtenable(b, a) ? ok++ : ko.push(`${f} : retrait d'identifiants non démontré : ${a.slice(0, 80)}`));
    }
    minus = []; plus = [];
  };
  for (const l of d) {
    if (l.startsWith('@@')) { flush(); continue; }
    if (l.startsWith('---') || l.startsWith('+++')) continue;
    if (l.startsWith('-')) minus.push(l.slice(1).replace(/\r$/, ''));
    else if (l.startsWith('+')) plus.push(l.slice(1).replace(/\r$/, ''));
  }
  flush();
}
console.log(ko.length ? `ÉCHEC : ${ko.length}\n- ${ko.slice(0, 40).join('\n- ')}` : `OK : ${ok} paires de lignes vérifiées, 0 échec`);
process.exit(ko.length ? 1 : 0);
