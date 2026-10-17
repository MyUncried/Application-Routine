// Lot 6A — table de correspondance section actuelle → destination cible (LECTURE SEULE sur docs/).
// Usage : node correspondance-cible.mjs <racine> <dossier-lot6>
// Entrées : <lot6>/inventaire-sections.tsv, <lot6>/classification.tsv. Sortie : <lot6>/correspondance.tsv.
// La destination découle de règles explicites (architecture cible, plan-restructuration.md §3 et §4), appliquées dans l'ordre :
//  R1 exceptions nommées (contraintes externes, cas particuliers) ;
//  R2 copie intégrale : la section est contenue à ≥ 0,9 (6-grammes de mots) dans une section conservée de son domicile → RENVOI ;
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

// Fichiers cibles (architecture recommandée, option C). 08 devient une table de renvoi ; 14 et HIST sont créés.
const CIBLE = {
  '01': '01 – Vision et glossaire', '02': '02 – Utilisateurs et besoins', '03': '03 – Parcours utilisateur', '04': '04 – Modèle fonctionnel',
  '05': '05 – Versions et périmètre', '06': '06 – Écrans et navigation', '07': '07 – Registre des décisions', '08': '08 – Table de renvoi (ancienne conception détaillée)',
  '09': '09 – Modèle de données', '10': '10 – Règles fonctionnelles et calculs', '11': '11 – API fonctionnelles', '12': '12 – Architecture technique',
  '13': '13 – Contrats d’écran', '14': '14 – Conventions d’interface', 'HIST': 'Annexe – Historique des consolidations',
};
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
    case 'COMPORTEMENT': case 'REGLE': case 'CALCUL': case 'RECETTE':
      return ['09', '11', '12', '13', '10'].includes(ch) ? ch : '10'; // règles de données, d'API, techniques et d'écran restent chez elles
    case 'DONNEE': return ch === '12' ? '12' : '09';
    case 'API': return '11';
    case 'ARCHITECTURE': return '12';
    case 'RENDU': return '14';
    case 'CONTRAT': return '13';
    case 'CONVENTION-UI': return '14';
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
const base = new Map();
for (const [id] of inv) { const c = cls.get(id); const t = (EXCEPTIONS[id] || [])[0] || domicile(c[1], id.slice(1, 3)); base.set(id, t); }
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
  if (keep !== id && !inv.get(id)[9] && id.slice(1, 3) !== '07') renvoi.set(id, keep); // jamais de renvoi pour une section qui définit un identifiant, ni dans le registre
}
// Étapes du plan d'exécution (§6 du plan).
function etape(action, from, to) {
  if (action === 'RENVOI') return '6D';
  if (action === 'INTÉGRER') return '6E';
  if (action === 'ARCHIVER') return '6F5';
  if (action === 'DÉPLACER') return to === '14' ? '6F1' : from === '08' ? '6F2' : from === '06' && to === '13' ? '6F3' : '6F4';
  return '—';
}
const out = [['id', 'chapitre', 'niveau', 'titre', 'lignes', 'type', 'domaine', 'action', 'fichier_cible', 'partie_cible', 'etape', 'classe', 'renvoi_vers', 'divergences', 'defauts', 'regle', 'justification'].join('\t')];
const stats = {};
for (const [id, c] of inv) {
  const k = cls.get(id); const ch = c[1]; const type = k[1]; const dom = k[3];
  let to, action, regle, just = '', rv = '';
  if (EXCEPTIONS[id]) { [to, action, just] = EXCEPTIONS[id]; regle = 'R1'; }
  else if (renvoi.has(id)) { rv = renvoi.get(id); to = base.get(rv); action = 'RENVOI'; regle = 'R2'; just = `copie intégrale (≥ 0,9) de ${rv} « ${inv.get(rv)[3].slice(0, 50)} » ; remplacée par un renvoi`; }
  else { to = base.get(id); regle = type === 'HISTORIQUE' && ch !== '07' ? 'R3' : 'R4';
    action = to === 'HIST' ? 'ARCHIVER' : MEMES.has(type) || ch === '07' ? 'CONSERVER' : to === ch ? (k[6] === 'oui' ? 'INTÉGRER' : 'CONSERVER') : 'DÉPLACER';
    just = action === 'DÉPLACER' ? `type ${type} : domicile ${to}` : action === 'INTÉGRER' ? 'complément empilé : à placer dans la rubrique thématique' : action === 'ARCHIVER' ? 'historique non normatif : annexe, texte conservé' : ''; }
  if (ch === '08' && action === 'CONSERVER') { action = 'DÉPLACER'; to = MEMES.has(type) ? '08' : to; if (to === '08') action = 'TABLE-DE-RENVOI'; just ||= 'le ch. 08 devient une table de renvoi'; }
  if (k[2] && action !== 'RENVOI' && action !== 'CONSERVER') just += ` ; à scinder si nécessaire (types secondaires : ${k[2]})`;
  const divs = k[7].split(' ').filter(r => r.endsWith(':DIVERGENCE')).map(r => r.split(':')[0]).join(' ');
  const classe = action === 'CONSERVER' || action === 'TABLE-DE-RENVOI' ? 'DOC' : divs && action !== 'CONSERVER' ? 'DOC (divergences conservées, G3)' : 'DOC';
  const e = etape(action, ch, to); stats[action] = (stats[action] || 0) + 1;
  out.push([id, ch, c[2], c[3], c[7], type, dom, action, CIBLE[to] || to, PARTIE[dom] || dom, e, classe, rv, divs, k[9].replace(/\s+/g, ' '), regle, just.replace(/\t/g, ' ')].join('\t'));
}
fs.writeFileSync(path.join(L6, 'correspondance.tsv'), out.join('\n') + '\n');
console.log(JSON.stringify(stats));
