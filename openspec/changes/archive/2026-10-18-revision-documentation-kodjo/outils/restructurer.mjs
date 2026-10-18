// Lot 6 — restructuration des chapitres d'après la table de correspondance (étapes 6C à 6G).
// Usage : node restructurer.mjs <racine> <commit-de-base> <dossier-lot6> --etapes=6C,6D,… [--cible=<dossier>] [--rapport=<fichier.tsv>]
//
// Déterministe : chaque exécution repart du texte des 13 chapitres au commit de base (git show) et applique les étapes
// demandées, cumulativement. Le texte des sections n'est jamais réécrit : seuls changent les titres (numérotation, dates,
// contexte, portée), le niveau des titres, l'ordre et le fichier des sections, et les cibles des liens. Les ajouts sont des
// lignes nouvelles (titres de parties, sommaires, renvois, en-têtes de tableaux, inventaire, annexes).
//  6C  corrections dans chaque fichier : tableaux coupés (S-11 et rangs orphelins), inventaire des 40 contrats (ch. 13),
//      D-046 et D-047 rangées dans « Décisions validées » (ch. 07).
//  6D  dédoublonnage : section à équivalence complète → renvoi ; ligne de même contexte → renvoi (hors lignes de tableau) ;
//      titres « Saisie des paramètres — D-246 ».
//  6E  plan de domaine (ch. 03, 04, 08, 09, 10, 11, 13), plan par type (ch. 06), compléments intégrés (ch. 01, 02, 05, 12) ;
//      titres : numérotation et dates retirées. Le ch. 07 n'est pas réorganisé.
//  6F1–6F4  déplacements entre fichiers (étape de la colonne « etape ») ; 6F5 annexe historique.
//  6G  sommaires, INDEX, annexes de correspondance et d'index.
// Les liens de docs/ (hors archives, preparation, sources) vers les chapitres sont réécrits vers la nouvelle place.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const args = process.argv.slice(2); const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [repo, BASE, L6] = args.filter(a => !a.startsWith('--'));
const ET = new Set((opt.etapes || '').split(',').filter(Boolean)); const has = e => ET.has(e);
const DIR = 'docs/Specifications-fonctionnelles';
const OUT = opt.cible || path.join(repo, DIR);
const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', '-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const NOMS = Object.fromEntries(git('ls-tree', '--name-only', BASE, DIR + '/').split('\n').filter(f => /\/\d\d – .*\.md$/.test(f)).map(f => [path.basename(f).slice(0, 2), path.basename(f)]));
const BASEL = Object.fromEntries(Object.entries(NOMS).map(([k, n]) => [k, git('show', `${BASE}:${DIR}/${n}`).split(/\r?\n/)]));
const tsv = f => fs.readFileSync(path.join(L6, f), 'utf8').trim().split(/\r?\n/).slice(1).map(l => l.split('\t'));
const INV = tsv('inventaire-sections.tsv'); const COR = new Map(tsv('correspondance.tsv').map(c => [c[0], c]));
const NOM_HIST = 'Annexe – Historique des consolidations.md', NOM_CORR = 'Annexe – Correspondance des sections.md', NOM_IDX = 'Annexe – Index des identifiants.md';
const fichierDe = k => k === 'HIST' ? NOM_HIST : NOMS[k];
const cle = cible => cible.startsWith('Annexe') ? 'HIST' : cible.slice(0, 2);
const TITRES = { '01': 'Vision et glossaire', '02': 'Utilisateurs et besoins', '03': 'Parcours utilisateur', '04': 'Modèle fonctionnel', '05': 'Versions et périmètre',
  '06': 'Interface : navigation, écrans et conventions communes', '08': 'Conception fonctionnelle par fonctionnalité', '09': 'Modèle de données fonctionnel',
  '10': 'Règles métier et calculs', '11': 'API fonctionnelles', '12': 'Architecture technique', '13': 'Contrats d’écran' };
const MODE = { '03': 'domaine', '04': 'domaine', '08': 'domaine', '09': 'domaine', '10': 'domaine', '11': 'domaine', '13': 'domaine', '06': 'type', '01': 'stable', '02': 'stable', '05': 'stable', '12': 'stable', '07': 'fige', HIST: 'annexe' };
const PARTIES = [['0', 'Objet et organisation du chapitre'], ['1', 'Séances'], ['2', 'Exercices'], ['3', 'Paramètres d’exécution'], ['4', 'Composition des séances'], ['5', 'Circuits'], ['6', 'Formats de séances'],
  ['7', 'Bilatéralité'], ['8', 'Exécution'], ['9', 'Médias pendant l’Exécution'], ['10', 'Planification'], ['11', 'Suivi et synthèse'], ['12', 'Profil et préférences'], ['13', 'Référentiels'],
  ['14', 'Calculs transverses'], ['15', 'Interface transverse'], ['16', 'Parcours'], ['17', 'Technique'], ['18', 'Sujets transverses']];
const PARTIE_DOM = { TRANSVERSE_PRODUIT: '0', GOUVERNANCE: '0', SEANCE: '1', EXERCICE: '2', PARAMETRES: '3', COMPOSITION: '4', CIRCUIT: '5', FORMAT: '6', BILATERALITE: '7', EXECUTION: '8',
  MEDIA_EXEC: '9', PLANIFICATION: '10', SUIVI: '11', PROFIL: '12', REFERENTIELS: '13', TRANSVERSE_CALCUL: '14', TRANSVERSE_UI: '15', PARCOURS_HORS_MVP: '16', TECHNIQUE: '17', MULTI: '18' };
const PARTIES06 = [['1', 'Objet et organisation'], ['2', 'Navigation, écrans et captures'], ['3', 'Conventions d’interface communes']];
const PORTEE = [['HORS-MVP', /hors MVP|post-MVP|cible future|\bfutur|ultérieure|\bV[2-4]\b|évolution/i, ' (hors MVP)'], ['HISTORIQUE', /historique|\bancien|retiré|archiv/i, ' (historique)']];
const slug = s => s.trim().toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
const rapport = ['section\tevenement\tdetail'];
const note = (id, ev, d = '') => rapport.push(`${id}\t${ev}\t${String(d).replace(/\t/g, ' ')}`);

// ── 1. Découpage des sections (titres de base, ancres <a id> rattachées à la section qu'elles précèdent) ─────────────────
const S = INV.map(r => ({ id: r[0], ch: r[1], lvl: +r[2], titre: r[3], debut: +r[5], fin: +r[6] }));
const parCh = {}; for (const s of S) (parCh[s.ch] ||= []).push(s);
for (const [ch, L] of Object.entries(parCh)) {
  const B = BASEL[ch];
  L.forEach((s, i) => { s.pre = []; s.head = s.lvl > 0 ? B[s.debut - 1] : null; s.body = B.slice(s.lvl > 0 ? s.debut : s.debut - 1, s.fin); s.baseHeadIdx = s.lvl > 0 ? s.debut - 1 : -1; s.bodyBaseIdx = s.lvl > 0 ? s.debut : s.debut - 1; });
  if (has('6E')) for (let i = 0; i + 1 < L.length; i++) { const a = L[i], b = L[i + 1]; let k = a.body.length; while (k > 0 && a.body[k - 1].trim() === '') k--;
    let j = k; while (j > 0 && /^<a (?:id|name)="/.test(a.body[j - 1].trim())) j--; if (j < k) { b.pre = a.body.slice(j, k); a.body = a.body.slice(0, j).concat(a.body.slice(k)); a.preMoved = true; } }
  L.forEach((s, i) => { s.parent = null; for (let j = i - 1; j >= 0; j--) if (L[j].lvl < s.lvl && L[j].lvl > 0) { s.parent = L[j]; break; } });
}
const byId = new Map(S.map(s => [s.id, s])); const C = id => COR.get(id);
// Chaque ligne garde son origine (chapitre, index de base) pour la réécriture des liens et le suivi des titres.
for (const s of S) { s.bodyO = s.body.map((l, i) => ({ t: l, ch: s.ch, bi: s.bodyBaseIdx + i })); s.preO = s.pre.map(l => ({ t: l, ch: s.ch, bi: -1 })); }
// Portée d'origine de chaque section (chemin complet des titres de base, comme verifier-conservation.mjs).
const porteeBase = {};
for (const [ch, B] of Object.entries(BASEL)) { const st = []; let fence = false; porteeBase[ch] = B.map(l => { if (/^```/.test(l)) fence = !fence; const m = !fence && l.match(/^(#{1,6}) (.*)$/);
  if (m) { while (st.length && st[st.length - 1].lvl >= m[1].length) st.pop(); st.push({ lvl: m[1].length, t: m[2] }); } return PORTEE.filter(([, re]) => re.test(st.map(x => x.t).join(' / '))).map(([k]) => k); }); }
const flagsOf = s => new Set(porteeBase[s.ch][s.lvl > 0 ? s.baseHeadIdx : Math.max(0, s.debut - 1)] || []);

// ── 2. Étape 6D : renvois de lignes (avant les autres transformations, sur les positions de base) ──────────────────────
const RENVOI_LIGNE = new Map(); // id section → Map(index de base → section conservée)
if (has('6D')) for (const r of tsv('copies-lignes.tsv')) { const keep = r[3].split(':')[0];
  for (const o of (r[4] || '').split(' ').filter(Boolean)) { const [sec, ch, ligne] = o.split(':'); const s = byId.get(sec); if (!s || C(sec)[7] === 'RENVOI') continue;
    const bi = +ligne - 1; const it = s.bodyO.find(x => x.bi === bi); if (!it || it.t.trimStart().startsWith('|')) { note(sec, '6D-ligne-ignoree', `l. ${ligne} (ligne de tableau)`); continue; }
    (RENVOI_LIGNE.get(sec) || RENVOI_LIGNE.set(sec, new Map()).get(sec)).set(bi, keep); } }
for (const [sec, m] of RENVOI_LIGNE) { const s = byId.get(sec); for (const it of s.bodyO) if (m.has(it.bi)) { const pref = (it.t.match(/^(\s*(?:[-*]|\d+\.)\s+|\s*>\s*)/) || [''])[0]; it.renvoiLigne = m.get(it.bi); it.pref = pref; note(sec, '6D-ligne', `l. ${it.bi + 1} → ${m.get(it.bi)}`); } }

// ── 3. Étape 6C : corrections dans chaque fichier ──────────────────────────────────────────────────────────────────
const isRow = it => it.t.trimStart().startsWith('|'); const isSep = it => /^\|\s*:?-{3}/.test(it.t.trim());
const ligne = (t, s) => ({ t, ch: s.ch, bi: -1, neu: true });
if (has('6C')) {
  for (const s of S) { if (s.ch === '07') continue; const b = s.bodyO;
    // a) note insérée dans un tableau (ch. 09, S-11) : la note et ses lignes vides passent après la fin du tableau.
    for (let i = 1; i < b.length; i++) { if (!isRow(b[i - 1])) continue; let a = i; while (a < b.length && b[a].t.trim() === '') a++; if (a >= b.length || !b[a].t.startsWith('>')) continue;
      let j = a; while (j < b.length && b[j].t.startsWith('>')) j++; let k = j; while (k < b.length && b[k].t.trim() === '') k++;
      if (k < b.length && isRow(b[k]) && !(b[k + 1] && isSep(b[k + 1]))) { let e = k; while (e < b.length && isRow(b[e])) e++; const note_ = b.slice(i, k); const rows = b.slice(k, e);
        b.splice(i, e - i, ...rows, ligne('', s), ...note_.filter(x => x.t.trim() !== ''), ligne('', s)); note(s.id, '6C-tableau', 'note replacée après le tableau'); } }
    // b) lignes vides entre deux rangs d'un même tableau (ch. 10, ch. 11).
    for (let i = 1; i + 1 < b.length; i++) if (b[i].t.trim() === '' && isRow(b[i - 1]) && isRow(b[i + 1]) && !(b[i + 2] && isSep(b[i + 2]))) { b.splice(i, 1); i--; note(s.id, '6C-tableau', 'rangs rejoints'); }
    // c) tableau sans en-tête après un texte : en-tête du chapitre (RM : ch. 10 ; API : ch. 11).
    for (let i = 0; i < b.length; i++) { if (!isRow(b[i]) || (i > 0 && isRow(b[i - 1])) || (b[i + 1] && isSep(b[i + 1]))) continue;
      const c0 = b[i].t.split('|')[1].trim(); let tete = null;
      if (/^RM-\d/.test(c0)) tete = ['| ID | Règle |', '|---|---|'];
      if (/^`?API-[A-Z]+-\d/.test(c0)) tete = ['| ID | Opération | Entrées principales | Résultat | Règles / validations | Objets impactés |', '|---|---|---|---|---|---|'];
      if (tete && (i === 0 || b[i - 1].t.trim() === '' || !isRow(b[i - 1]))) { const add = tete.map(t => ligne(t, s)); if (i > 0 && b[i - 1].t.trim() !== '') add.unshift(ligne('', s)); b.splice(i, 0, ...add); i += add.length; note(s.id, '6C-tableau', 'en-tête ajouté'); } }
  }
  // d) rangs orphelins rattachés au tableau de la section précédente (ch. 08 : Validation, Retour, Synthèse ; ch. 12 : Backend, Authentification).
  const rattacher = (motif, finTableau) => { for (const s of S) { const b = s.bodyO; const i = b.findIndex(x => motif.test(x.t)); if (i < 0 || (i > 0 && isRow(b[i - 1]))) continue;
    let e = i; while (e < b.length && isRow(b[e])) e++; const rows = b.splice(i, e - i); const p = parCh[s.ch][parCh[s.ch].indexOf(s) - 1]; const pb = p.bodyO;
    const j = pb.findIndex(x => finTableau.test(x.t)); if (j < 0) { b.splice(i, 0, ...rows); continue; } pb.splice(j + 1, 0, ...rows);
    if (b[i] && b[i].t.trim() !== '' && i > 0 && b[i - 1].t.trim() !== '') b.splice(i, 0, ligne('', s)); note(s.id, '6C-tableau', `${rows.length} rang(s) rattaché(s) à ${p.id}`); } };
  rattacher(/^\| Validation\s+\| Impossible tant que les champs obligatoires/, /^\| Zones corporelles\s+\| Sélection multiple dans un référentiel/);
  rattacher(/^\| Backend \| \*\*Aucun dans le MVP\*\*/, /^\| Crash reporting \| \*\*Sentry\*\*/);
  // e) inventaire du ch. 13 : contrats absents ajoutés à la suite (titres exacts des contrats).
  const inv13 = byId.get('S13-0947'); const k11 = inv13.bodyO.findIndex(x => x.t.startsWith('| CE-UI-11 |'));
  const manquants = S.filter(s => s.ch === '13' && /^CE-/.test(s.titre) && !inv13.bodyO.some(x => x.t.startsWith(`| ${s.titre.split(' — ')[0]} |`)));
  inv13.bodyO.splice(k11 + 1, 0, ...manquants.map(s => ligne(`| ${s.titre.split(' — ')[0]} | ${s.titre.split(' — ').slice(1).join(' — ')} |`, inv13)));
  note('S13-0947', '6C-inventaire', manquants.map(s => s.titre.split(' — ')[0]).join(' '));
  // f) ch. 07 : D-046 et D-047, rangées sous l'exemple « # Format », rejoignent « Décisions validées » après D-045 (texte inchangé).
  const fmt = byId.get('S07-0386'), val = byId.get('S07-0388');
  const rows = fmt.bodyO.filter(x => /^\| D-04[67] \|/.test(x.t)); fmt.bodyO = fmt.bodyO.filter(x => !rows.includes(x));
  const k45 = val.bodyO.findIndex(x => x.t.startsWith('| D-045 |')); val.bodyO.splice(k45 + 1, 0, ...rows); note('S07-0386', '6C-registre', 'D-046 et D-047 rangées après D-045');
}

// ── 4. Étape 6D : sections remplacées par un renvoi ; titres D-246 ──────────────────────────────────────────────────
if (has('6D')) for (const s of S) {
  if (C(s.id)[7] === 'RENVOI') { s.renvoi = C(s.id)[12]; note(s.id, '6D-section', `→ ${s.renvoi}`); }
  if (/^Saisie des paramètres — D-246$/.test(s.titre)) { s.titreD246 = 'Saisie des paramètres d’exécution'; note(s.id, '6D-titre', 'D-246'); }
}

// ── 4 bis. Étape 6H : décision D-402 (restructuration validée par Hermann, QR-1 à QR-9) ajoutée au registre ─────────
if (has('6H')) { const s = S.find(x => x.ch === '07' && x.bodyO.some(it => it.t.startsWith('| D-401 |'))); const i = s.bodyO.findIndex(it => it.t.startsWith('| D-401 |'));
  s.bodyO.splice(i + 1, 0, ...['', '<a id="arbitrages-20261017-c"></a>', '### Décision de Hermann du 17 octobre 2026 — restructuration documentaire (QR-1 à QR-9)', '', '| ID | Décision | Statut | Portée et décisions concernées |', '|---|---|---|---|',
    "| D-402 | La documentation est restructurée selon l’option C révisée du lot 6A (QR-1) : les noms des fichiers de chapitres sont conservés ; le chapitre 08 décrit la conception par fonctionnalité et cite les règles du chapitre 10 sans les énoncer ; les conventions d’interface communes, dont les règles communes de l’ancien chapitre 13 §4, sont au chapitre 06 (QR-2, QR-3) ; les passages historiques non normatifs sont conservés dans une annexe (QR-4) ; les sections modifiées par une PR ouverte restent dans leur fichier (QR-5) ; `PRODUCT.md` est une synthèse sans ordre de référence propre (QR-6) ; seuls des identifiants B-xxx des besoins sont créés (QR-7) ; la restructuration est immédiate, sans attendre PRE-4 ni PRE-5 (QR-8) ; les divergences nouvellement relevées sont regroupées pour arbitrage (QR-9). | Validée, Hermann 17/10/2026 (QR-1 à QR-9) | Documentaire ; aucune règle produit modifiée ; D-376 inchangée (aucune priorité automatique entre les chapitres 08 et 13). |"].map(t => ({ t, ch: '07', bi: -1, neu: true }))); note(s.id, '6H-registre', 'D-402'); }

// ── 5. Destination de chaque section ─────────────────────────────────────────────────────────────────────────────
const deplacee = s => { const c = C(s.id); return ['DÉPLACER', 'ARCHIVER'].includes(c[7]) && has(c[10]) && has('6E'); };
for (const s of S) s.dest = deplacee(s) ? cle(C(s.id)[8]) : s.ch;
// Une section dont la portée « hors MVP » vient d'un titre parent mais dont le titre dit « MVP » reste en place : la déplacer
// imposerait d'écrire « hors MVP » dans un titre qui dit le contraire (défaut signalé au lot 6J).
for (const s of S) if (s.dest !== s.ch) { const own = PORTEE.filter(([, re]) => re.test(s.titre)).map(([k]) => k);
  const herit = [...flagsOf(s)].filter(k => !own.includes(k)); if (herit.includes('HORS-MVP') && /\bMVP\b/.test(s.titre) && !/hors MVP|post-MVP/i.test(s.titre)) { s.dest = s.ch; note(s.id, 'maintenue', 'portée « hors MVP » héritée, titre « MVP » : signalé en 6J'); } }

// ── 6. Titres ────────────────────────────────────────────────────────────────────────────────────────────────────────
const DATE = /\s*(?:[—–-]\s*)?(?:(?:du|le|au)\s*)?(?:\d{1,2}(?:er)?(?:[–-]\d{1,2})?\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+20\d\d|\d{1,2}\/\d{1,2}(?:[–-]\d{1,2}\/\d{1,2})?(?:\/20\d\d)?)\b/gi;
function titreCible(s) {
  let t = s.titreD246 || s.titre; if (!has('6E') || s.ch === '07') return t;
  if (s.dest === 'HIST') return t;
  if (MODE[s.dest] === 'domaine' || MODE[s.dest] === 'type' || s.dest !== s.ch) t = t.replace(/^(?:\d{1,2}(?:\.\d+)*(?: bis(?:\.\d+)?)?|\d+\.x)\.?\s+/, '') || t;
  const sansDate = t.replace(DATE, '').replace(/\(\s*\)/g, '').replace(/\s+—\s+—\s+/g, ' — ').replace(/^[\s—–,:-]+|[\s—–,:-]+$/g, '').replace(/\s{2,}/g, ' ').trim();
  if (sansDate.length >= 4 && sansDate !== t) { t = sansDate; }
  return t;
}

// ── 7. Blocs et mise en page par fichier ─────────────────────────────────────────────────────────────────────────────
const fichiers = {}; for (const k of [...Object.keys(NOMS), 'HIST']) fichiers[k] = [];
for (const s of S) fichiers[s.dest].push(s);
const titreChapitre = {}; for (const [ch, L] of Object.entries(parCh)) { const h1 = L.filter(s => s.lvl === 1); if (h1.length === 1 && L.indexOf(h1[0]) <= 1) titreChapitre[ch] = h1[0]; }
const typeDe = s => C(s.id)[5], domDe = s => C(s.id)[6].replace(/-/g, '_');
function blocs(k) {
  const L = fichiers[k]; const res = []; const enBloc = new Map();
  for (const s of L) { const p = s.parent; const tc = titreChapitre[s.ch];
    if (p && p.dest === k && p !== tc && enBloc.has(p)) { const b = enBloc.get(p); b.sections.push(s); enBloc.set(s, b); }
    else { const b = { racine: s, sections: [s] }; res.push(b); enBloc.set(s, b); } }
  return res;
}
const lignesBloc = b => b.sections.reduce((n, s) => n + s.bodyO.length, 0);
function partieDomaine(b) { const r = b.racine; if (r === titreChapitre[r.ch] || r.lvl === 0) return '0';
  // Partie du bloc : domaine majoritaire, pondéré par le nombre de lignes, sur toutes les sections du bloc (titre racine compris) ;
  // une racine courte (renvoi, titre-conteneur) ne décide donc pas seule de la place de ses sous-sections.
  if (b.sections.length === 1) return PARTIE_DOM[domDe(r)] ?? '18';
  const v = {}; b.sections.forEach(s => { const p = PARTIE_DOM[domDe(s)] ?? '18'; v[p] = (v[p] || 0) + s.bodyO.length + 1; });
  return Object.entries(v).sort((x, y) => y[1] - x[1])[0][0]; }
function partieType(b) { if (b.racine === titreChapitre[b.racine.ch]) return '1'; const v = {}; b.sections.forEach(s => { const t = typeDe(s); const p = ['CONVENTION-UI', 'RENDU'].includes(t) ? '3' : ['NAVIGATION', 'CONTRAT', 'COMPORTEMENT', 'REGLE', 'PARCOURS', 'CALCUL'].includes(t) ? '2' : '1'; v[p] = (v[p] || 0) + s.bodyO.length + 1; });
  return Object.entries(v).sort((x, y) => y[1] - x[1])[0][0]; }

// Rendu : liste d'objets ligne { t, ch, bi, head?: { sec, base } } ; les titres sont produits ici.
function decaler(t, d) { const m = t.match(/^(#{1,6}) (.*)$/); if (!m) return t; return '#'.repeat(Math.min(6, Math.max(1, m[1].length + d))) + ' ' + m[2]; }
function rendreSection(s, niv, d, titre) {
  const out = []; out.push(...s.preO);
  if (s.lvl > 0) out.push({ t: '#'.repeat(Math.min(6, niv)) + ' ' + titre, ch: s.ch, bi: s.baseHeadIdx, head: s.id });
  if (s.renvoi) { out.push({ t: '', ch: s.ch, bi: -1, neu: true }, { t: `@@RENVOI:${s.renvoi}@@`, ch: s.ch, bi: -1, neu: true }, { t: '', ch: s.ch, bi: -1, neu: true }); return out; }
  let fence = false;
  for (const it of s.bodyO) { if (/^```/.test(it.t)) fence = !fence;
    if (it.renvoiLigne) { out.push({ t: `${it.pref}@@LIGNE:${it.renvoiLigne}@@`, ch: it.ch, bi: -1, neu: true }); continue; }
    out.push({ ...it, t: fence ? it.t : decaler(it.t, d), innerHead: !fence && /^#{1,6} /.test(it.t) ? true : undefined }); }
  return out;
}
const suffixes = new Map(); // id → suffixe de portée ajouté au titre
function rendreFichier(k) {
  const mode = MODE[k]; const out = []; const B = blocs(k);
  const titreRacine = (b, niv) => { const r = b.racine; let t = titreCible(r);
    if (r.dest !== r.ch && r.parent && r.parent.dest !== r.dest && r.parent !== titreChapitre[r.ch] && !/^(?:RM|CE|D|REC|CIR|DM|API)-/.test(t)) { const pt = titreCible(r.parent); if (!t.includes(pt)) t = `${pt} — ${t}`; }
    return t + (suffixes.get(r.id) || ''); };
  const rendreBloc = (b, nivRacine) => { const d = nivRacine - b.racine.lvl; b.sections.forEach(s => out.push(...rendreSection(s, s.lvl + d, d, s === b.racine ? titreRacine(b, nivRacine) : titreCible(s) + (suffixes.get(s.id) || '')))); };
  if (mode === 'annexe' && !B.length) return null;
  if (mode === 'fige' || !has('6E')) { // ordre de base, sans changement de niveau
    for (const b of B) { const r = b.racine; b.sections.forEach(s => out.push(...rendreSection(s, s.lvl, 0, titreCible(s)))); }
    return out; }
  const neu = t => ({ t, ch: k, bi: -1, neu: true });
  if (mode === 'annexe') { if (!B.length) return null;
    out.push(neu(`# Annexe — Historique des consolidations`), neu(''), neu('Document non normatif. Il conserve à l’identique des passages historiques retirés des chapitres lors de la restructuration du lot 6 (journaux, preuves datées, transmissions, anciennes cibles). Ils ne prescrivent rien ; la règle applicable est dans les chapitres.'), neu(''));
    for (const b of B) { out.push(neu(`*Ancien emplacement : chapitre ${b.racine.ch}, « ${b.racine.titre} ».*`), neu('')); rendreBloc(b, 2); }
    return out; }
  const tc = titreChapitre[k] && titreChapitre[k].dest === k ? titreChapitre[k] : null;
  const intro = []; const PRES = { '06': 'Ce chapitre décrit l’interface dans son ensemble : navigation, inventaire des écrans et de leurs contrats, captures, et conventions d’interface communes à plusieurs écrans. Le comportement propre à chaque écran est défini par son contrat au chapitre 13 ; le rendu visuel par Figma.',
    '08': 'Ce chapitre décrit, fonctionnalité par fonctionnalité, les enchaînements, états et transitions. Les règles testables sont énoncées au chapitre 10 et citées ici par leur identifiant ; les champs et contrôles d’écran sont définis par les contrats du chapitre 13.',
    '10': 'Ce chapitre réunit les règles métier testables et les calculs, identifiés ou non, dans l’ordre du plan de domaine commun. Le chapitre 08 décrit les enchaînements qui les appliquent ; les contrats du chapitre 13 en décrivent l’effet à l’écran.' };
  if (mode === 'stable') {
    const own = B.filter(b => b.racine.ch === k), inc = B.filter(b => b.racine.ch !== k);
    const ordre = [];
    for (const b of own) { const c = C(b.racine.id); if (c[7] === 'INTÉGRER' && b.racine.lvl >= 2) { const dom = domDe(b.racine); let j = -1; ordre.forEach((x, i) => { if (domDe(x.racine) === dom && C(x.racine.id)[7] !== 'INTÉGRER' && x.racine !== titreChapitre[k]) j = i; });
      if (j >= 0) { ordre.splice(j + 1, 0, b); note(b.racine.id, '6E-integre', `après ${ordre[j].racine.id}`); continue; } } ordre.push(b); }
    for (const b of inc) { const t = typeDe(b.racine), dom = domDe(b.racine); let j = -1; ordre.forEach((x, i) => { if (typeDe(x.racine) === t) j = i; }); if (j < 0) ordre.forEach((x, i) => { if (domDe(x.racine) === dom) j = i; }); if (j < 0) j = ordre.length - 1;
      ordre.splice(j + 1, 0, b); note(b.racine.id, '6F-insere', `après ${ordre[j].racine.id}`); }
    const aH1 = Object.values(parCh[k]).some(s => s.lvl === 1);
    if (!aH1) out.push(neu(`# ${TITRES[k]}`), neu(''));
    for (const b of ordre) { const niv = b.racine === titreChapitre[k] ? 1 : b.racine.ch === k ? b.racine.lvl : 2;
      if (b.racine === titreChapitre[k]) { const r = b.racine; out.push(...r.preO, { t: `# ${TITRES[k]}`, ch: k, bi: r.baseHeadIdx, head: r.id }); r.bodyO.forEach(it => out.push(it)); b.sections.slice(1).forEach(s => out.push(...rendreSection(s, s.lvl, 0, titreCible(s) + (suffixes.get(s.id) || ''))));
        continue; }
      rendreBloc(b, niv); }
    return out; }
  // Modes « domaine » et « type » : titre, présentation, parties.
  out.push(tc ? { t: `# ${TITRES[k]}`, ch: k, bi: tc.baseHeadIdx, head: tc.id } : neu(`# ${TITRES[k]}`)); out.push(neu(''));
  if (PRES[k]) out.push(neu(PRES[k]), neu(''));
  if (tc) { out.push(...tc.preO.filter(x => x.t.trim())); tc.bodyO.forEach(it => out.push(it)); }
  const parts = mode === 'type' ? PARTIES06 : PARTIES; const ptf = mode === 'type' ? partieType : partieDomaine;
  const groupes = new Map(parts.map(([n]) => [n, []]));
  const ordreSrc = b => (b.racine.ch === k ? 0 : 1);
  B.filter(b => b.racine !== tc).forEach((b, i) => { b.i = i; groupes.get(ptf(b)).push(b); });
  for (const [n, titre] of parts) { const g = groupes.get(n).sort((x, y) => ordreSrc(x) - ordreSrc(y) || x.racine.ch.localeCompare(y.racine.ch) || x.i - y.i); if (!g.length) continue;
    out.push(neu(''), neu(`## ${titre}`), neu('')); for (const b of g) { rendreBloc(b, 3); if (b.racine.ch !== k || (tc && b.racine.parent !== tc && b.racine.lvl !== 1)) note(b.racine.id, '6E-partie', `${k} / ${titre}`); } }
  return out;
}

// ── 8. Assemblage, contrôle de portée (suffixes), slugs, renvois et liens ────────────────────────────────────────────
function assembler() { const R = {}; for (const k of Object.keys(fichiers)) { const r = rendreFichier(k); if (r) R[k] = r; } return R; }
function porteeRendue(lines) { const st = []; let fence = false; return lines.map(o => { if (/^```/.test(o.t)) fence = !fence; const m = !fence && o.t.match(/^(#{1,6}) (.*)$/);
  if (m) { while (st.length && st[st.length - 1].lvl >= m[1].length) st.pop(); st.push({ lvl: m[1].length, t: m[2] }); } return PORTEE.filter(([, re]) => re.test(st.map(x => x.t).join(' / '))).map(([kk]) => kk); }); }
let R = assembler();
const racineDe = new Map(); for (const k of Object.keys(fichiers)) for (const b of blocs(k)) b.sections.forEach(s => racineDe.set(s.id, b.racine));
if (has('6E')) for (let tour = 0; tour < 3; tour++) { let change = false;
  for (const [k, lines] of Object.entries(R)) { const pr = porteeRendue(lines); lines.forEach((o, i) => { if (!o.head) return; const s = byId.get(o.head); const avant = flagsOf(s); const apres = new Set(pr[i]);
      if (k === 'HIST') apres.add('HISTORIQUE');
      const r = racineDe.get(s.id); const perdRacine = kk => r && r !== s && flagsOf(r).has(kk) && !new Set(pr[lines.findIndex(x => x.head === r.id)] || []).has(kk);
      for (const [kk, , suf] of PORTEE) if (avant.has(kk) && !apres.has(kk) && !perdRacine(kk) && !(suffixes.get(s.id) || '').includes(suf)) { suffixes.set(s.id, (suffixes.get(s.id) || '') + suf); change = true; note(s.id, '6E-portee', suf.trim()); } }); }
  if (!change) break; R = assembler(); }
// ── 8 ter. Étape 6I : transfert des règles RG-1 à RG-13 du DSF Cartes, icônes et appuis vers le ch. 06 (G4) ──────────
const TITRE_RG = 'Cartes d’Exercice — règles RG-1 à RG-13';
let rgLignes = null; if (has('6I') && R['06']) { const D = git('show', `${BASE}:docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md`).split(/\r?\n/); const h = D.findIndex(l => l.startsWith('## État avec photo/vidéo et RG-1 à RG-13'));
  let a = h + 1; while (!D[a].startsWith('| ID |')) a++; let b = a; while (b < D.length && D[b].startsWith('|')) b++; rgLignes = D.slice(a, b);
  const neuL = t => ({ t, ch: '06', bi: -1, neu: true });
  R['06'].push(neuL(''), neuL(`### ${TITRE_RG}`), neuL(''), neuL('Règles de gestion transférées sans modification depuis le [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md) (§ « État avec photo/vidéo et RG-1 à RG-13 »), conformément à G4 et D-402. Le DSF renvoie désormais ici.'), neuL(''), ...rgLignes.map(neuL));
  note('S06', '6I-transfert', `${rgLignes.length - 2} règles RG`); }
// Slugs de base (pour retrouver la cible d'un ancien lien) et slugs rendus.
const slugsBase = {}; for (const [ch, B] of Object.entries(BASEL)) { const cnt = {}; const parIdx = {}, parSlug = {}; let fence = false;
  B.forEach((l, i) => { if (/^```/.test(l)) fence = !fence; const m = !fence && l.match(/^#{1,6}\s+(.*)$/); if (!m) return; let s = slug(m[1]); if (cnt[s] !== undefined) { cnt[s]++; s = `${s}-${cnt[s]}`; } else cnt[s] = 0; parIdx[i] = s; parSlug[s] = i; });
  slugsBase[ch] = { parIdx, parSlug }; }
const ancres = {}; // ancre explicite → fichier rendu
const nouveau = {}; // `${ch}:${indexBase}` → { k, slug }
function slugsRendus() { for (const [k, lines] of Object.entries(R)) { const cnt = {}; let fence = false; lines.forEach(o => { if (/^```/.test(o.t)) fence = !fence;
    for (const a of o.t.matchAll(/<a (?:id|name)="([^"]+)"/g)) ancres[a[1]] = k; const m = !fence && o.t.match(/^#{1,6}\s+(.*)$/); if (!m) return;
    let s = slug(m[1]); if (cnt[s] !== undefined) { cnt[s]++; s = `${s}-${cnt[s]}`; } else cnt[s] = 0; o.slug = s; if (o.bi >= 0) nouveau[`${o.ch}:${o.bi}`] = { k, slug: s }; }); } }
slugsRendus();
const titreSection = {}; for (const [k, lines] of Object.entries(R)) lines.forEach(o => { if (o.head) titreSection[o.head] = { k, slug: o.slug, titre: o.t.replace(/^#+\s+/, '') }; });
// Titre-chapitre dissous ou retitré : ses anciens liens vont au titre H1 du fichier.
const lien = (de, k, s) => (de === k ? '' : encodeURIComponent(fichierDe(k))) + '#' + s;
for (const [k, lines] of Object.entries(R)) for (const o of lines) o.k = k;
for (const lines of Object.values(R)) for (const o of lines) {
  o.t = o.t.replace(/@@RENVOI:([^@]+)@@/, (_, id) => { const c = titreSection[id]; return c ? `Contenu identique à la section [« ${c.titre} »](${lien(o.k, c.k, c.slug)}) : il n’est pas recopié ici.` : _; });
  o.t = o.t.replace(/@@LIGNE:([^@]+)@@/, (_, id) => { const c = titreSection[id]; return c ? `*Texte identique à celui de la section [« ${c.titre} »](${lien(o.k, c.k, c.slug)}) ; il n’est pas recopié ici.*` : _; });
}
// Réécriture des liens vers les chapitres.
const nomVersCh = Object.fromEntries(Object.entries(NOMS).map(([k, n]) => [n, k]));
function cibleNouvelle(chCible, h) { if (!h) return null; let hd = h; try { hd = decodeURIComponent(h); } catch {}
  if (ancres[hd]) return { k: ancres[hd], slug: hd };
  const i = slugsBase[chCible].parSlug[hd]; if (i === undefined) return null; const n = nouveau[`${chCible}:${i}`]; if (n) return n;
  if (titreChapitre[chCible] && titreChapitre[chCible].baseHeadIdx === i) { const k = titreChapitre[chCible].dest; const h1 = R[k]?.find(o => /^# /.test(o.t)); return h1 ? { k, slug: h1.slug } : null; }
  return null; }
let liensReecrits = 0;
function reecrire(t, origineCh, dansFichierK, prefixeDoc) { let fence = false; return t.replace(/\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (m, u, titre) => {
  if (/^(https?:|mailto:)/.test(u)) return m; let [p, h] = u.split('#'); let pd = p; try { pd = decodeURIComponent(p); } catch {}
  const base = path.basename(pd); const chCible = p ? nomVersCh[base] : origineCh; if (!chCible) return m;
  const n = cibleNouvelle(chCible, h); let hd0 = h; try { hd0 = decodeURIComponent(h); } catch {}
  if (n && n.k === chCible && n.slug === hd0 && (p ? true : dansFichierK === origineCh)) return m; // cible inchangée : lien laissé tel quel
  if (!n) { if (!p && dansFichierK !== origineCh && h) { liensReecrits++; return `](${encodeURIComponent(NOMS[origineCh])}#${h}${titre})`; } return m; }
  const nomN = fichierDe(n.k); let nu;
  if (prefixeDoc === null) nu = (dansFichierK === n.k ? '' : encodeURIComponent(nomN)) + '#' + n.slug;
  else nu = prefixeDoc + encodeURIComponent(nomN) + '#' + n.slug;
  const av = `${p}#${h}`; if (nu === av || (p && decodeURIComponent(nu.split('#')[0]) === pd && nu.split('#')[1] === h)) return m; liensReecrits++; return `](${nu}${titre})`; }); }
for (const [k, lines] of Object.entries(R)) { let fence = false; for (const o of lines) { if (/^```/.test(o.t)) { fence = !fence; continue; } if (!fence && !o.neu && o.t.includes('](')) o.t = reecrire(o.t, o.ch || k, k, null); } }

// ── 8 bis. Étape 6G : identifiants B-xxx des besoins du ch. 02 (QR-7) : chaque puce placée sous un titre « Besoin(s) » reçoit un
// préfixe « **B-nnn** — », dans l'ordre du chapitre ; le texte de la puce est inchangé.
if (has('6G') && R['02']) { let n = 0; const st = []; for (const o of R['02']) { const m = o.t.match(/^(#{1,6}) (.*)$/); if (m) { while (st.length && st[st.length - 1].lvl >= m[1].length) st.pop(); st.push({ lvl: m[1].length, t: m[2] }); continue; }
  if (!o.neu && /^- (?!\*\*B-\d{3}\*\*)/.test(o.t) && st.some(x => /^Besoin|\bBesoins?\b/.test(x.t) && !/^Sommaire$/.test(x.t))) { n++; o.t = o.t.replace(/^- /, `- **B-${String(n).padStart(3, '0')}** — `); } }
  note('S02', '6G-besoins', `${n} besoins identifiés`); }

// ── 8 quater. Étape 6K : espaces manquantes (QS-14, QF-13, QF-17) : après une préposition suivie d'un nombre, entre un
// nombre et son unité (min, ms, s, h), entre « min »/« ms » et le nombre suivant. Hors registre (C4), code et liens.
const corr6K = [];
if (has('6K')) { const P = /(?<![\p{L}\p{N}])(du|le|au|aux|les|des|de|et|à|entre|sur|sous|avec|par|pour|dès|depuis|après|avant)(\d)/gu;
  const U = /(\d)(min|ms|s|h)(?![\p{L}\p{N}])/gu, M = /(?<=\d)(min|ms)(\d)/gu;
  const corriger = seg => seg.replace(P, '$1 $2').replace(M, '$1 $2').replace(U, '$1 $2');
  for (const [k, lines] of Object.entries(R)) { if (k === '07' || k === 'HIST') continue; let fence = false; lines.forEach((o, i) => { if (/^```/.test(o.t)) { fence = !fence; return; } if (fence || o.neu || /^#{1,6} /.test(o.t)) return;
    const parts = o.t.split(/(`[^`]*`|\]\([^)]*\)|<[^>]+>)/); const n = parts.map((p, j) => j % 2 ? p : corriger(p)).join('');
    if (n !== o.t) { corr6K.push({ id: `6K-${k}-${i + 1}`, ref: 'QS-14, QF-13, QF-17', file: fichierDe(k), ancien: o.t, nouveau: n }); o.t = n; } }); }
  note('6K', '6K-espaces', `${corr6K.length} lignes`); }

// ── 9. Étape 6G : sommaires, annexes ─────────────────────────────────────────────────────────────────────────────────
const annexes = {};
if (has('6G')) {
  for (const [k, lines] of Object.entries(R)) { if (k === '07' || k === 'HIST') continue; const h1 = lines.findIndex(o => /^# /.test(o.t)); if (h1 < 0) continue;
    const ent = lines.filter(o => /^#{2,3} /.test(o.t) && o.slug).map(o => `${o.t.startsWith('### ') ? '  ' : ''}- [${o.t.replace(/^#+\s+/, '').replace(/[[\]]/g, '')}](#${o.slug})`);
    if (ent.length < 4) continue; let j = h1 + 1; while (j < lines.length && !/^#{2,} /.test(lines[j].t)) j++;
    lines.splice(j, 0, { t: '## Sommaire', k, bi: -1 }, { t: '', k, bi: -1 }, ...ent.map(t => ({ t, k, bi: -1 })), { t: '', k, bi: -1 }); }
  const lienDoc = (k, s) => encodeURIComponent(fichierDe(k)) + '#' + s;
  const corr = ['# Annexe — Correspondance des sections', '', 'Document non normatif. Il indique, pour chaque section des chapitres avant la restructuration du lot 6 (état du commit `' + BASE.slice(0, 8) + '`), sa place actuelle. Les mentions « ch. NN » et « § » des textes antérieurs, en particulier du registre, se lisent avec cette table.', '',
    '| Ancien chapitre | Ancienne section | Section actuelle | Opération |', '|---|---|---|---|'];
  for (const s of S) { if (s.lvl === 0) continue; const n = titreSection[s.id]; const op = s.renvoi ? 'renvoi vers la copie conservée' : s.dest !== s.ch ? (s.dest === 'HIST' ? 'annexe historique' : `déplacée au ch. ${s.dest}`) : 'même chapitre';
    corr.push(`| ${s.ch} | ${s.titre.replace(/\|/g, '\\|')} | ${n ? `[${n.titre.replace(/\|/g, '\\|').replace(/[[\]]/g, '')}](${lienDoc(n.k, n.slug)})` : '—'} | ${op} |`); }
  annexes[NOM_CORR] = corr;
  const ID_DEF = [/^- \*\*(B-\d{3})\*\* — /, /^\| (D-\d{3}) \|/, /^\| (RM-\d{3}[a-z]?) \|/, /^#{2,6} (RM-FMT-\d+)\s*$/, /^#{2,6} (CE-[A-Z0-9-]+?)(?: —|$)/, /^\| (REC-\d+) \|/, /^\| (CIR-\d+) \|/, /^\| (DM-\d+) \|/, /^\| `?(API-[A-Z]+-\d+(?:\.\.\d+)?)`? \|/];
  const idx = ['# Annexe — Index des identifiants', '', 'Document non normatif, généré. Il indique où chaque identifiant est défini. La définition fait foi.', '', '## Identifiants définis', '', '| Identifiant | Chapitre | Section |', '|---|---|---|'];
  const defs = []; for (const [k, lines] of Object.entries(R)) { let cur = null; let fence = false; for (const o of lines) { if (/^```/.test(o.t)) fence = !fence; if (o.slug) cur = o; if (fence) continue; for (const re of ID_DEF) { const m = o.t.match(re); if (m && cur) defs.push([m[1], k, cur]); } } }
  const ord = x => x.replace(/\d+/g, d => d.padStart(5, '0')); defs.sort((a, b) => ord(a[0]).localeCompare(ord(b[0])));
  for (const [id, k, h] of defs) idx.push(`| [${id}](${lienDoc(k, h.slug)}) | ${k === 'HIST' ? 'annexe' : k} | ${h.t.replace(/^#+\s+/, '').replace(/\|/g, '\\|')} |`);
  idx.push('', '## Règles sans identifiant', '', 'Sections qui énoncent des règles sans identifiant propre (classification du lot 6A). Aucune numérotation n’est créée (décision QR-7) ; elles sont citées par leur section.', '', '| Section | Chapitre |', '|---|---|');
  for (const s of S) if (/SANS-ID/.test(C(s.id)[14]) && titreSection[s.id]) { const n = titreSection[s.id]; idx.push(`| [${n.titre.replace(/\|/g, '\\|').replace(/[[\]]/g, '')}](${lienDoc(n.k, n.slug)}) | ${n.k} |`); }
  idx.push('', '## Registre par thème', '', '| Groupe de décisions | Thème |', '|---|---|');
  for (const s of S) if (s.ch === '07' && s.lvl > 0 && titreSection[s.id]) { const n = titreSection[s.id]; idx.push(`| [${n.titre.replace(/\|/g, '\\|').replace(/[[\]]/g, '')}](${lienDoc(n.k, n.slug)}) | ${(PARTIES.find(([p]) => p === (PARTIE_DOM[domDe(s)] ?? '18')) || [, ''])[1]} |`); }
  annexes[NOM_IDX] = idx;
}

// ── 10. Écriture ────────────────────────────────────────────────────────────────────────────────────────────────────
const nl = '\r\n';
for (const [k, lines] of Object.entries(R)) { let txt = lines.map(o => o.t).join('\n'); if (has('6E')) txt = txt.replace(/\n{3,}/g, '\n\n'); if (!txt.endsWith('\n')) txt += '\n';
  if (k === '07' && !has('6C')) { /* inchangé */ }
  fs.writeFileSync(path.join(OUT, fichierDe(k)), txt.replace(/\n/g, nl)); }
if (!R.HIST && fs.existsSync(path.join(OUT, NOM_HIST))) fs.unlinkSync(path.join(OUT, NOM_HIST));
for (const [n, lines] of Object.entries(annexes)) fs.writeFileSync(path.join(OUT, n), lines.join(nl) + nl);
// Liens des autres documents de docs/ (hors archives, preparation, sources) vers les chapitres.
let docsModifies = 0;
if (!opt.cible) { const docs = path.join(repo, 'docs'); const L = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/archives|preparation|sources|Specifications-fonctionnelles/.test(path.relative(docs, p))) walk(p); } else if (p.endsWith('.md')) L.push(p); } })(docs);
  for (const f of L) { const t = git('show', `${BASE}:${path.relative(repo, f).split(path.sep).join('/')}`).replace(/\r\n/g, '\n'); let fence = false;
    const nt = t.split('\n').map(l => { if (/^```/.test(l)) { fence = !fence; return l; } if (fence || !l.includes('](')) return l; return l.replace(/\]\(([^)\s#]*Specifications-fonctionnelles\/)([^)\s#]+)(#[^)\s]*)?\)/g, (m, pre, nom, h) => {
      let nd = nom; try { nd = decodeURIComponent(nom); } catch {} const ch = nomVersCh[nd]; if (!ch || !h) return m; const n = cibleNouvelle(ch, h.slice(1)); if (!n) return m;
      const nu = `](${pre}${encodeURIComponent(fichierDe(n.k))}#${n.slug})`; if (n.k === ch && n.slug === (() => { try { return decodeURIComponent(h.slice(1)); } catch { return h.slice(1); } })()) return m; liensReecrits++; return nu; }); }).join('\n');
    if (nt !== t) { const crlf = fs.readFileSync(f, 'utf8').includes('\r\n'); fs.writeFileSync(f, crlf ? nt.replace(/\n/g, '\r\n') : nt); docsModifies++; } } }
if (!opt.cible && has('6G')) fs.writeFileSync(path.join(repo, 'docs', 'INDEX.md'), fs.readFileSync(path.join(L6, 'modeles', 'INDEX.md'), 'utf8').replace(/\r?\n/g, '\n'));
if (!opt.cible && has('6H')) { const f = path.join(repo, 'docs', 'PRODUCT.md'); let t = fs.readFileSync(f, 'utf8'); const crlf = t.includes('\r\n'); t = t.replace(/\r\n/g, '\n');
  const a = t.indexOf('En cas de contradiction, l’ordre de référence est :'), b = t.indexOf('Pour T03, les références explicites');
  if (a > 0 && b > a) { t = t.slice(0, a) + fs.readFileSync(path.join(L6, 'modeles', 'PRODUCT-gouvernance.md'), 'utf8').replace(/\r?\n/g, '\n').trim() + '\n\n' + t.slice(b); fs.writeFileSync(f, crlf ? t.replace(/\n/g, '\r\n') : t); note('PRODUCT', '6H-Q-C', 'ordre de référence remplacé par un renvoi'); } }
if (has('6I') && rgLignes && !opt.cible) { const f = path.join(repo, 'docs', 'DSF-CARTES-ICONES-APPUIS-2026-09-30.md'); let t = fs.readFileSync(f, 'utf8'); const crlf = t.includes('\r\n'); t = t.replace(/\r\n/g, '\n');
  const bloc = rgLignes.join('\n'); if (t.includes(bloc)) { const h6 = R['06'].find(o => o.t === `### ${TITRE_RG}`);
    t = t.replace(bloc, `Les règles RG-1 à RG-13 sont désormais énoncées au [chapitre 06, « ${TITRE_RG} »](Specifications-fonctionnelles/${encodeURIComponent(NOMS['06'])}#${h6 ? h6.slug : ''}) (transfert G4, D-402). Leur texte n’a pas changé ; la version antérieure de ce tableau reste consultable dans Git (commit \`${BASE.slice(0, 8)}\`).`);
    fs.writeFileSync(f, crlf ? t.replace(/\n/g, '\r\n') : t); note('DSF', '6I-renvoi', 'DSF-CARTES-ICONES-APPUIS-2026-09-30.md'); } }
if (opt.corrections6k && corr6K.length) fs.writeFileSync(opt.corrections6k, JSON.stringify({ description: 'Étape 6K — espaces manquantes (QS-14, QF-13, QF-17), corrections rédactionnelles', corrections: corr6K }, null, 1));
if (opt.rapport) fs.writeFileSync(opt.rapport, rapport.join('\n') + '\n');
// Matrice de correspondance actualisée : mêmes colonnes que correspondance.tsv, fichier_cible = fichier réellement atteint,
// plus le titre et l'ancre actuels et l'état d'exécution de la section.
if (opt.correspondance) { const head = fs.readFileSync(path.join(L6, 'correspondance.tsv'), 'utf8').split(/\r?\n/)[0] + '\tfichier_actuel\ttitre_actuel\tancre_actuelle\tetat';
  const rows = [head]; for (const s of S) { const c = [...C(s.id)]; const n = titreSection[s.id]; const prevue = cle(c[8]); const etape = c[10];
    const etat = s.renvoi ? 'renvoi' : s.dest !== s.ch ? 'déplacée' : (prevue !== s.ch && ['DÉPLACER', 'ARCHIVER'].includes(c[7])) ? (has(etape) ? 'maintenue (voir rapport)' : 'à faire') : c[7] === 'INTÉGRER' && has('6E') ? 'intégrée' : has('6E') ? 'en place' : 'à faire';
    if (s.dest !== prevue && (s.dest === s.ch && has(etape))) c[8] = s.dest === 'HIST' ? NOM_HIST.replace(/\.md$/, '') : NOMS[s.dest].replace(/\.md$/, '');
    rows.push([...c, fichierDe(n ? n.k : s.dest), n ? n.titre : '', n ? n.slug : '', etat].join('\t')); }
  fs.writeFileSync(opt.correspondance, rows.join('\n') + '\n'); }
// Justifications de l'annexe historique (6F5) : chaque ligne archivée change d'autorité de façon explicite (contrôle C5).
if (opt.justifications) { const crypto = await import('crypto'); const n1 = x => x.replace(/\s+/g, ' ').trim(); const J = ['empreinte\tmotif\tsection'];
  for (const s of S) if (s.dest === 'HIST') for (const it of s.bodyO) { const t = n1(it.t); if (!t || /^\|?\s*:?-{3,}/.test(t) || /^#{1,6} /.test(t) || /^<a id=/.test(t) || t === '---') continue;
    J.push(`${crypto.createHash('sha1').update(t).digest('hex').slice(0, 16)}\tHISTORIQUE-ARCHIVE\t${s.id}`); }
  if (has('6H')) J.push('D-402\tCORRECTION-DECIDEE:D-402\tS07 (décision nouvelle de Hermann, QR-1 à QR-9)');
  fs.writeFileSync(opt.justifications, J.join('\n') + '\n'); }
const ev = {}; rapport.slice(1).forEach(l => { const e = l.split('\t')[1]; ev[e] = (ev[e] || 0) + 1; });
console.log(`étapes=${[...ET].join(',')} fichiers=${Object.keys(R).length + Object.keys(annexes).length} liens_réécrits=${liensReecrits} autres_docs_modifiés=${docsModifies}`);
console.log(JSON.stringify(ev));
