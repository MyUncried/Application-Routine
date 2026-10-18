// Seconde passe de contrôle indépendante du lot 1 (ch. 07). LECTURE SEULE.
// Usage : node verifier-lot1-registre.mjs <racine> [ref-avant=6656fefc] [ref-après=fichier de travail | <commit>]
// Logique distincte du script d'application : on part de la différence réelle entre avant et après,
// et chaque ligne modifiée ou ajoutée doit s'expliquer par un objet Git source, à l'octet près.
import { execFileSync } from 'child_process';
import fs from 'fs'; import path from 'path';
const [repo, before = '6656fefc', after] = process.argv.slice(2);
const REL = 'docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md';
const show = (ref) => execFileSync('git', ['-C', repo, 'show', `${ref}:${REL}`], { encoding: 'utf8', maxBuffer: 1 << 28 });
// Les objets Git sont en LF ; la copie de travail est en CRLF (core.autocrlf=true). On compare ligne à ligne,
// indépendamment de la fin de ligne, et on contrôle à part l'homogénéité des fins de ligne de la copie de travail.
const rawB = after ? show(after) : fs.readFileSync(path.join(repo, REL), 'utf8');
const lines = s => s.split(/\r?\n/);
const A = lines(show(before));
const B = lines(rawB);
const S37 = lines(show('37e372cd^')), S7A = lines(show('7a89220f^')), S34 = lines(show('341f4d41'));
const id = l => (l.match(/^\| (D-\d{3}) \|/) || [])[1];
const byId = L => { const m = new Map(); L.forEach(l => { const d = id(l); if (d) { if (m.has(d)) m.set(d, 'DOUBLON'); else m.set(d, l); } }); return m; };
const cells = l => l.split('|').slice(1, -1).map(s => s.trim());
const ok = [], ko = [];
const check = (cond, msg) => (cond ? ok : ko).push(msg);

// 1. Fins de ligne : aucune ligne sans CRLF introduite.
{ const lf = (rawB.match(/\n/g) || []).length, crlf = (rawB.match(/\r\n/g) || []).length, cr = (rawB.match(/\r/g) || []).length;
  check(after ? crlf === 0 && cr === 0 : lf === crlf && cr === crlf, `fins de ligne homogènes (${after ? 'objet LF' : 'copie de travail CRLF'} : LF=${lf}, CRLF=${crlf})`); }

// 2. Décisions : ensemble avant ∪ {D-334, D-335}, sans doublon.
const MA = byId(A), MB = byId(B), M37 = byId(S37), M7A = byId(S7A), M34 = byId(S34);
check([...MB.values()].every(v => v !== 'DOUBLON'), 'aucun identifiant de décision en double');
check(MA.size === 365 && MB.size === 367, `nombre de décisions ${MA.size} → ${MB.size} (attendu 365 → 367)`);
const ajout = [...MB.keys()].filter(d => !MA.has(d)), retrait = [...MA.keys()].filter(d => !MB.has(d));
check(ajout.join() === 'D-334,D-335' && retrait.length === 0, `décisions ajoutées [${ajout}] retirées [${retrait}]`);

// 3. Lignes hors décisions : identiques, sauf l'en-tête du tableau G2 (2 lignes).
const nonDec = L => L.filter(l => !id(l));
const nA = nonDec(A), nB = nonDec(B);
const diffNon = []; for (let i = 0; i < Math.max(nA.length, nB.length); i++) if (nA[i] !== nB[i]) diffNon.push([nA[i], nB[i]]);
const hdrSrc = S7A.slice(S7A.findIndex(l => l.startsWith('| D-357 |')) - 2, S7A.findIndex(l => l.startsWith('| D-357 |')));
check(diffNon.length === 2 && diffNon[0][0] === '| ID | Décision |' && diffNon[0][1] === hdrSrc[0] && diffNon[1][0] === '|---|---|' && diffNon[1][1] === hdrSrc[1],
  `lignes hors décisions modifiées : ${diffNon.length} (attendu : les 2 lignes d'en-tête G2, identiques à 7a89220f^)`);

// 4. Chaque décision modifiée doit appartenir à un groupe et correspondre à sa source.
const G1 = new Set(['D-237','D-252','D-268','D-269','D-270','D-271','D-274','D-275','D-276','D-277','D-279','D-280','D-281','D-282','D-283','D-284','D-285','D-286','D-288','D-292','D-295','D-296','D-302','D-305']);
const G2 = new Set(Array.from({ length: 13 }, (_, k) => `D-${357 + k}`));
const G3 = new Set(['D-089','D-091','D-209','D-217','D-256','D-265','D-350','D-355']);
const modifiees = [...MA.keys()].filter(d => MA.get(d) !== MB.get(d));
check(modifiees.length === 45 && modifiees.every(d => G1.has(d) || G2.has(d) || G3.has(d)), `décisions modifiées : ${modifiees.length} (attendu 45), toutes dans G1/G2/G3`);
const PRESC = 'Prescription courante : Bip v2 et D-308–313 ; ancienne version conservée dans Git.';
const RX = /^Prescription courante : Bip v2 et D-308–313 ; ancienne version conservée dans Git\. Texte historique antérieur au 07\/10\/2026 \(`37e372cd\^`\), restauré pour traçabilité ; il ne remplace pas la prescription courante : « (.*) »$/;
for (const d of modifiees) {
  const a = MA.get(d), b = MB.get(d);
  if (G1.has(d)) {
    const ca = cells(a), cb = cells(b), m = cb[1].match(RX);
    check(ca[1] === PRESC, `${d} : prescription courante d'avant = texte attendu`);
    check(!!m && m[1] === cells(M37.get(d))[1], `${d} : texte historique identique à 37e372cd^`);
    check(ca.length === cb.length && ca.slice(2).join('|') === cb.slice(2).join('|'), `${d} : colonnes Statut et Traçabilité inchangées`);
    check(a.replace(PRESC, '') === b.replace(cb[1], ca[1]).replace(PRESC, ''), `${d} : reste de la ligne inchangé à l'octet près`);
  } else if (G2.has(d) || G3.has(d)) {
    check(b === M7A.get(d), `${d} : ligne identique à 7a89220f^`);
    if (G3.has(d)) check(cells(a).slice(2).join('|') === cells(b).slice(2).join('|'), `${d} : colonnes Statut et Intégration inchangées (G3)`);
  }
}
// 5. G4 : texte identique à 341f4d41, placées juste après D-333.
for (const d of ['D-334', 'D-335']) check(MB.get(d) === M34.get(d), `${d} : ligne identique à 341f4d41`);
const i333 = B.findIndex(l => l.startsWith('| D-333 |'));
check(B[i333 + 1].startsWith('| D-334 |') && B[i333 + 2].startsWith('| D-335 |'), 'G4 : D-334 et D-335 contiguës à D-333 dans le tableau');
// 6. Décisions explicitement exclues : inchangées.
for (const d of ['D-029', 'D-248', 'D-337', 'D-338']) check(MA.get(d) === MB.get(d), `${d} : inchangée`);
// 7. Statuts : aucune colonne Statut modifiée hors G2.
const statutChange = [...MA.keys()].filter(d => !G2.has(d) && (cells(MA.get(d))[2] ?? '') !== (cells(MB.get(d))[2] ?? ''));
check(statutChange.length === 0, `colonnes Statut modifiées hors G2 : ${statutChange.length}`);

console.log(ko.length ? `ÉCHEC : ${ko.length} contrôle(s)\n- ` + ko.join('\n- ') : `OK : ${ok.length} contrôles réussis, 0 échec`);
process.exit(ko.length ? 1 : 0);
