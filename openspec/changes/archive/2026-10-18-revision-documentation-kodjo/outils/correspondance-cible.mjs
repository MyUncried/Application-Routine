// Lot 6A — table de correspondance section actuelle → destination cible (LECTURE SEULE sur docs/).
// Usage : node correspondance-cible.mjs <racine> <dossier-lot6>
// Entrées : <lot6>/inventaire-sections.tsv, <lot6>/classification.tsv, <lot6>/dependances-pr.tsv. Sortie : <lot6>/correspondance.tsv.
// Révision 2 (réponse à la revue du lot 6A) : renvoi seulement après équivalence complète (R2) ; traitement concret de chaque
// défaut, y compris pour les sections conservées (colonne « traitements ») ; ch. 08 = conception par fonctionnalité ; pas de
// ch. 14 (conventions d'interface au ch. 06) ; dépendance réelle aux PR (colonne « pr »).
// La destination découle de règles explicites (plan-restructuration.md §4), appliquées dans l'ordre :
//  R1 exceptions nommées (contraintes externes, cas particuliers) ;
//  R2 copie équivalente : la similarité (≥ 0,9 en 6-grammes) ne sert qu'à trouver un candidat. Le renvoi n'est retenu que si
//     TOUTES les lignes de contenu de la section figurent à l'identique dans la copie conservée ET si la portée (MVP / hors MVP /
//     historique, lue dans les titres englobants) est la même. Sinon la section est traitée par R3/R4 et l'écart est consigné
//     (colonne « copie ») : aucune différence de règle ou de portée n'est perdue ;
//  R3 HISTORIQUE hors registre → annexe historique ;
//  R4 domicile du type de contenu (tableau DOMICILE) ; même fichier : CONSERVER, ou INTÉGRER si complément empilé ;
//     autre fichier : DÉPLACER.
// Aucune règle ne tranche une divergence : les sections liées par DIVERGENCE sont listées dans la colonne « divergences »
// et restent toutes deux en place à destination (design G3).
import fs from 'fs'; import path from 'path';
const [repo, L6] = process.argv.slice(2);
const SF = path.join(repo, 'docs', 'Specifications-fonctionnelles');
const tsv = f => fs.readFileSync(path.join(L6, f), 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const inv = new Map(tsv('inventaire-sections.tsv').map(c => [c[0], c]));
const cls = new Map(tsv('classification.tsv').map(c => [c[0], c]));
const files = Object.fromEntries(fs.readdirSync(SF).filter(f => /^\d\d – .*\.md$/.test(f)).map(f => [f.slice(0, 2), fs.readFileSync(path.join(SF, f), 'utf8').split(/\r?\n/)]));

// Fichiers cibles (architecture recommandée, option C révisée). Seule l'annexe historique est créée.
const CIBLE = {
  '01': '01 – Vision et glossaire', '02': '02 – Utilisateurs et besoins', '03': '03 – Parcours utilisateur', '04': '04 – Modèle fonctionnel',
  '05': '05 – Versions et périmètre', '06': '06 – Interface : navigation, écrans et conventions communes', '07': '07 – Registre des décisions', '08': '08 – Conception fonctionnelle par fonctionnalité',
  '09': '09 – Modèle de données', '10': '10 – Règles métier et calculs', '11': '11 – API fonctionnelles', '12': '12 – Architecture technique',
  '13': '13 – Contrats d’écran', 'HIST': 'Annexe – Historique des consolidations',
};
const AMONT = ['01', '02', '03', '04', '05', '06', '08']; // chapitres dont les règles et comportements quittent le fichier
// Domicile par type de contenu, avec les exceptions par chapitre d'origine.
const MEMES = new Set(['META', 'CONTENEUR']);
function domicile(type, ch) {
  switch (type) {
    case 'VISION': return '01';
    case 'BESOIN': return '02';
    case 'PARCOURS': return '03';
    case 'CONCEPT': return ch === '01' || ch === '09' ? ch : '04'; // glossaire (01) ; rubriques Définition des entités (09)
    case 'PERIMETRE': return ['01', '04', '06', '08'].includes(ch) ? '05' : ch; // le périmètre propre à un parcours, une donnée, une API, une technique ou un écran reste avec son objet
    case 'NAVIGATION': return ch === '13' ? '13' : '06'; // l'inventaire des contrats reste la table des matières du ch. 13
    case 'DECISION': return ch; // registre au ch. 07 ; ailleurs, résumé de décisions laissé en place (R-DEC)
    case 'COMPORTEMENT': return AMONT.includes(ch) ? '08' : ch; // enchaînements, états et transitions d'une fonctionnalité : ch. 08, qui cite les RM
    case 'REGLE': case 'CALCUL': case 'RECETTE':
      return AMONT.includes(ch) ? '10' : ch; // règle testable seule : ch. 10 ; règles de données, d'API, techniques et d'écran restent chez elles
    case 'DONNEE': return ch === '12' ? '12' : '09';
    case 'API': return '11';
    case 'ARCHITECTURE': return '12';
    case 'RENDU': return ['12', '13'].includes(ch) ? ch : '06'; // design system technique (12, K1) et rendu propre à un écran (13) restent
    case 'CONTRAT': return '13';
    case 'CONVENTION-UI': return ch === '12' ? '12' : '06'; // Screen Shells et composants : architecture de l'interface (12)
    case 'HISTORIQUE': return ch === '07' ? '07' : 'HIST';
    default: return ch; // META, CONTENEUR
  }
}
// R1 — exceptions nommées.
const EXCEPTIONS = {
  'S12-0897': ['12', 'CONSERVER', 'Contrainte K1 : le test src/shared/ui/__tests__/tokensSpecification.test.ts lit cette table dans le fichier du ch. 12'],
};
// Copies conservées imposées : bloc « Saisie des paramètres — D-246 » (renvoi vers les paramètres, domicile ch. 10) et bandeau
// d'archivage multi-contenus du 08/10 posé en tête de 6 chapitres (règle de planification, domicile ch. 10).
const CANON = new Set(['S10-0746', 'S10-0728']);
// Plan de domaine commun aux chapitres 03, 04, 09, 10, 11 et 13 (§4 du plan).
const PARTIE = { SEANCE: '1 Séances', EXERCICE: '2 Exercices', PARAMETRES: '3 Paramètres d’exécution', COMPOSITION: '4 Composition', CIRCUIT: '5 Circuits', FORMAT: '6 Formats',
  BILATERALITE: '7 Bilatéralité', EXECUTION: '8 Exécution', 'MEDIA-EXEC': '9 Médias pendant l’Exécution', PLANIFICATION: '10 Planification', SUIVI: '11 Suivi et synthèse',
  PROFIL: '12 Profil et préférences', REFERENTIELS: '13 Référentiels', 'TRANSVERSE-CALCUL': '14 Calculs transverses', 'TRANSVERSE-UI': '15 Interface transverse',
  'TRANSVERSE-PRODUIT': '0 Produit', 'PARCOURS-HORS-MVP': '16 Hors MVP', TECHNIQUE: '17 Technique', GOUVERNANCE: '0 Gouvernance', MULTI: '18 Multi-domaines' };

// R2 — copies intégrales (containment directionnel).
const N = 6, tok = s => s.toLowerCase().normalize('NFC').replace(/[|*`_#>]/g, ' ').match(/[\p{L}\p{N}’'-]+/gu) || [];
const grams = new Map();
for (const [id, c] of inv) { const t = tok(files[c[1]].slice(+c[5], +c[6]).join(' ')); const g = new Set(); for (let i = 0; i + N <= t.length; i++) g.add(t.slice(i, i + N).join(' ')); grams.set(id, g); }
const idx = new Map(); for (const [id, g] of grams) for (const x of g) { let a = idx.get(x); if (!a) idx.set(x, a = []); a.push(id); }
const prsIds = new Set(); try { for (const l of fs.readFileSync(path.join(L6, 'dependances-pr.tsv'), 'utf8').trim().split(/\r?\n/).slice(1)) prsIds.add(l.split('\t')[2]); } catch {}
const base = new Map();
for (const [id] of inv) { const c = cls.get(id); let t = (EXCEPTIONS[id] || [])[0] || domicile(c[1], id.slice(1, 3));
  if (t === 'HIST' && c[5] !== 'non') t = id.slice(1, 3); // exécution (17/10) : seul un historique non normatif part en annexe
  if (prsIds.has(id) && t !== id.slice(1, 3)) t = id.slice(1, 3); // exécution : une section modifiée par une PR ouverte reste dans son fichier
  if (inv.get(id)[9] && t !== id.slice(1, 3)) t = id.slice(1, 3); // exécution : une section qui définit un identifiant reste avec sa famille (RM-FMT au ch. 10…)
  base.set(id, t); }
// Portée lue dans les titres englobants de la section (et son propre titre).
const PORTEE = [['HORS-MVP', /hors MVP|post-MVP|cible future|\bfutur|ultérieure|\bV[2-4]\b|évolution/i], ['HISTORIQUE', /historique|\bancien|retiré|archiv/i]];
const portee = new Map(); { const stack = []; let prevCh = '';
  for (const [id, c] of inv) { if (c[1] !== prevCh) { stack.length = 0; prevCh = c[1]; } const lvl = +c[2]; while (stack.length && stack[stack.length - 1].lvl >= lvl) stack.pop(); stack.push({ lvl, t: c[3] });
    const txt = stack.map(x => x.t).join(' / '); portee.set(id, PORTEE.filter(([, re]) => re.test(txt)).map(([k]) => k).join('+') || 'COURANT'); } }
const n1 = l => l.replace(/\s+/g, ' ').trim();
const contenu = id => { const c = inv.get(id); return files[c[1]].slice(+c[5], +c[6]).map(n1).filter(l => l && !/^\|?\s*:?-{3,}/.test(l) && !/^#{1,6} /.test(l) && !/^<a id=/.test(l)); };
const ecart = new Map(); // section → description de la copie partielle (non remplacée)
const renvoi = new Map();
for (const [id, g] of grams) {
  if (g.size < 20 || EXCEPTIONS[id]) continue; const cnt = new Map();
  for (const x of g) for (const o of idx.get(x)) if (o !== id) cnt.set(o, (cnt.get(o) || 0) + 1);
  // candidates : sections qui contiennent ≥ 90 % de celle-ci sans la noyer (au plus 3 fois sa taille) ; une copie noyée dans une
  // section plus large est traitée au niveau des lignes (copies-lignes.tsv).
  const cands = [...cnt].filter(([o, n]) => n / g.size >= 0.9 && grams.get(o).size <= 3 * g.size).map(([o]) => o);
  if (!cands.length) continue;
  // Copie conservée : le domicile visé est la destination majoritaire des membres du groupe ; on garde le membre placé dans ce
  // domicile, de préférence celui qui définit un identifiant, puis le plus long. Sans membre dans ce domicile : le plus long.
  const members = [id, ...cands]; const vote = {}; members.forEach(o => { const d = base.get(o); vote[d] = (vote[d] || 0) + 1; });
  const home = Object.entries(vote).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  const score = o => (CANON.has(o) ? 8 : 0) + (base.get(o) === home ? 4 : 0) + (inv.get(o)[9] ? 2 : 0);
  const keep = members.sort((a, b) => score(b) - score(a) || grams.get(b).size - grams.get(a).size || a.localeCompare(b))[0];
  if (keep === id || inv.get(id)[9] || id.slice(1, 3) === '07') continue; // jamais de renvoi pour une section qui définit un identifiant, ni dans le registre
  const kset = new Set(contenu(keep)); const propres = contenu(id).filter(l => !kset.has(l));
  // Autorité : une section normative n’est jamais remplacée par un renvoi vers une copie non normative ou archivée.
  const autorite = (cls.get(id)[5] !== 'non' && (cls.get(keep)[5] === 'non' || base.get(keep) === 'HIST')) ? `, autorité ${cls.get(id)[5]} ≠ ${base.get(keep) === 'HIST' ? 'archivée' : cls.get(keep)[5]}` : '';
  if (propres.length === 0 && portee.get(id) === portee.get(keep) && !autorite) renvoi.set(id, keep);
  else ecart.set(id, `COPIE-PARTIELLE de ${keep} : ${propres.length} ligne(s) propre(s)${portee.get(id) !== portee.get(keep) ? `, portée ${portee.get(id)} ≠ ${portee.get(keep)}` : ''}${autorite} — conservée, écarts à rapprocher en 6D`);
}
// Étapes du plan d'exécution (§6 du plan).
function etape(action, from, to) {
  if (action === 'RENVOI') return '6D';
  if (action === 'INTÉGRER') return '6E';
  if (action === 'ARCHIVER') return '6F5';
  if (action === 'DÉPLACER') return from === '08' ? '6F2' : from === '06' && to === '13' ? '6F3' : to === '06' ? '6F1' : '6F4';
  return '—';
}
// Traitement concret de chaque défaut relevé (colonne « defauts » de la classification), quelle que soit l'action de la section.
const TRAITEMENT = [
  [/^TITRE-NUM$/, '6C', 'renuméroter le titre de section selon le plan du chapitre'],
  [/^TITRE-DATE$/, '6C', 'retitrer selon l’objet ; date et décision vont dans le texte ou le registre'],
  [/^HORS-DOMICILE$/, 'DEST', 'placer la partie hors domicile dans son domicile (scission si la section est mixte)'],
  [/^MELANGE$/, 'DEST', 'scinder par type de contenu, sans modifier le texte'],
  [/^DOUBLON$/, '6D', 'renvoi si équivalence complète vérifiée, sinon rapprochement avec écarts conservés'],
  [/^SANS-ID$/, '6G', 'inscrire à l’index des règles sans identifiant ; numérotation seulement si QR-7'],
  [/^TABLEAU-COUPE$/, '6C', 'réparer le tableau ; replacer le fragment intercalé'],
  [/^ORPHELIN$/, '6C', 'supprimer ou rattacher le titre orphelin'],
  [/^ALIAS$/, '6H', 'remplacer l’alias de version par un renvoi (table 2.6)'],
  [/^RENVOI-ABSENT$/, '6D', 'ajouter le renvoi vers la règle source (citation, sans reformulation)'],
  [/^TROP-LONG$/, '6C', 'ajouter des sous-titres'],
  [/^AUTRE:.*(identifiant|homonymie|RM-FMT)/i, '6C', 'identifiants : copie FMT/RM-FMT traitée en 6D ; homonymies levées par le préfixe du contexte, sans renumérotation'],
  [/^AUTRE:.*(complement|compléments|daté|date-empile)/i, '6E', 'intégrer le complément daté dans sa rubrique'],
  [/^AUTRE:.*(renvoi|ancre|lien|§)/i, '6C', 'réparer ou retirer le renvoi interne rompu ou vide'],
  [/^AUTRE:.*(titre|hiérarchie|niveau|H1|H3|H4|sous-section|sous-titres)/i, '6C', 'corriger le titre ou le niveau de titre'],
  [/^AUTRE:.*(espace|terme|style|typo)/i, '6K', 'correction rédactionnelle'],
  [/^AUTRE:.*(fragment|hors-sujet|ne-contenant|table-sans|annoncée|resultat|bloc)/i, '6E', 'replacer ou retirer le fragment déplacé (texte conservé)'],
  [/^AUTRE:/i, '6J', 'question de fond (portée, statut, contradiction) : décision produit, signalée sans être tranchée'],
];
function traitements(defauts, action, dest, ch) {
  const toks = defauts.split(/\s+(?=(?:TITRE-NUM|TITRE-DATE|HORS-DOMICILE|MELANGE|DOUBLON|SANS-ID|TABLEAU-COUPE|ORPHELIN|ALIAS|RENVOI-ABSENT|TROP-LONG|AUTRE:)(?:\s|$|[^\s]))/).filter(Boolean);
  return toks.map(t => { const m = TRAITEMENT.find(([re]) => re.test(t)); if (!m) return `${t}=>NON-COUVERT`;
    let e = m[1]; if (e === 'DEST') e = dest === ch ? '6E' : etape('DÉPLACER', ch, dest);
    return `${t.split(':')[0]}=>${e} ${m[2]}`; }).join(' | ');
}
const prs = new Map(); try { for (const r of tsv('dependances-pr.tsv')) prs.set(r[2], [...(prs.get(r[2]) || []), '#' + r[0]]); } catch {}
const out = [['id', 'chapitre', 'niveau', 'titre', 'lignes', 'type', 'domaine', 'action', 'fichier_cible', 'partie_cible', 'etape', 'classe', 'renvoi_vers', 'divergences', 'defauts', 'traitements', 'copie', 'portee', 'pr', 'regle', 'justification'].join('\t')];
const stats = {}; const rows = new Map();
for (const [id, c] of inv) {
  const k = cls.get(id); const ch = c[1]; const type = k[1]; const dom = k[3];
  let to, action, regle, just = '', rv = '';
  if (EXCEPTIONS[id]) { [to, action, just] = EXCEPTIONS[id]; regle = 'R1'; }
  else if (renvoi.has(id)) { rv = renvoi.get(id); to = base.get(rv); action = 'RENVOI'; regle = 'R2'; just = `copie équivalente de ${rv} « ${inv.get(rv)[3].slice(0, 50)} » : toutes ses lignes y figurent à l’identique, même portée ; remplacée par un renvoi`; }
  else { to = base.get(id); regle = type === 'HISTORIQUE' && ch !== '07' ? 'R3' : 'R4';
    action = to === 'HIST' ? 'ARCHIVER' : MEMES.has(type) || ch === '07' ? 'CONSERVER' : to === ch ? (k[6] === 'oui' ? 'INTÉGRER' : 'CONSERVER') : 'DÉPLACER';
    just = action === 'DÉPLACER' ? `type ${type} : domicile ${to}` : action === 'INTÉGRER' ? 'complément empilé : à placer dans la rubrique thématique' : action === 'ARCHIVER' ? 'historique non normatif : annexe, texte conservé' : ''; }
  if (k[2] && action !== 'RENVOI' && action !== 'CONSERVER') just += ` ; à scinder si nécessaire (types secondaires : ${k[2]})`;
  const divs = k[7].split(' ').filter(r => r.endsWith(':DIVERGENCE')).map(r => r.split(':')[0]).join(' ');
  const classe = divs && action !== 'CONSERVER' ? 'DOC (divergences conservées, G3)' : 'DOC';
  rows.set(id, { id, ch, c, k, type, dom, action, to, rv, divs, classe, regle, just });
}
// Exécution (17/10) : un titre-conteneur suit ses sous-sections quand elles partent toutes vers le même autre fichier.
{ const ids = [...inv.keys()];
  ids.forEach((id, i) => { const r = rows.get(id); if (r.type !== 'CONTENEUR' || prsIds.has(id)) return; const lvl = +r.c[2]; const desc = [];
    for (let j = i + 1; j < ids.length && inv.get(ids[j])[1] === r.ch && +inv.get(ids[j])[2] > lvl; j++) desc.push(rows.get(ids[j]));
    const dests = new Set(desc.filter(d => d.action !== 'RENVOI').map(d => d.to)); if (desc.length && dests.size === 1) { const to = [...dests][0]; if (to !== r.ch && to !== 'HIST') { r.to = to; r.action = 'DÉPLACER'; r.regle = 'R4'; r.just = `titre-conteneur : suit ses sous-sections (domicile ${to})`; } } }); }
for (const r of rows.values()) { const { id, ch, c, k, type, dom, action, to, rv, divs, classe, regle, just } = r;
  const e = etape(action, ch, to); stats[action] = (stats[action] || 0) + 1;
  out.push([id, ch, c[2], c[3], c[7], type, dom, action, CIBLE[to] || to, PARTIE[dom] || dom, e, classe, rv, divs, k[9].replace(/\s+/g, ' '), traitements(k[9].trim(), action, to, ch), ecart.get(id) || '', portee.get(id), (prs.get(id) || []).join(' '), regle, just.replace(/\t/g, ' ')].join('\t'));
}
fs.writeFileSync(path.join(L6, 'correspondance.tsv'), out.join('\n') + '\n');
console.log(JSON.stringify(stats));
