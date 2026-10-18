// Intégration v3 — matrice de couverture des décisions et scénarios de la spécification v3.0.
// Usage : node matrice-couverture.mjs <racine>
// Pour chaque élément de la spécification : décision et règles qui le portent (table ci-dessous, relue à la main), emplacements
// documentaires calculés depuis les références (« ref ») des corrections appliquées, statut et remarque.
// Écrit matrice-couverture.tsv et matrice-couverture.md dans le change.
import fs from 'fs'; import path from 'path';
const C = path.join(process.argv[2], 'openspec', 'changes', 'integration-parametres-execution-v3');
const corr = fs.readdirSync(path.join(C, 'constats')).filter(f => f.endsWith('-applique.json')).flatMap(f => JSON.parse(fs.readFileSync(path.join(C, 'constats', f), 'utf8')).corrections);
// Développe « CH-01 à CH-09 », « AC-19 à AC-21 », « AC-13/14/23 » en identifiants.
const ids = ref => { const out = new Set(); for (const m of ref.matchAll(/Q-V3-(\d{2})(?:\s*à\s*Q-V3-(\d{2}))?/g)) { const a = +m[1], b = m[2] ? +m[2] : a; for (let i = a; i <= b; i++) out.add(`Q-V3-${String(i).padStart(2, '0')}`); } const r = ref.replace(/(\b[A-Z]{2})-(\d{2})\s*(?:à|–)\s*(?:[A-Z]{2}-)?(\d{2})/g, (_, p, a, b) => { for (let i = +a; i <= +b; i++) out.add(`${p}-${String(i).padStart(2, '0')}`); return ''; });
  for (const m of r.matchAll(/\b([A-Z]{2})-(\d{2})((?:\/\d{2})*)/g)) { out.add(`${m[1]}-${m[2]}`); for (const x of (m[3] || '').split('/').filter(Boolean)) out.add(`${m[1]}-${x}`); }
  for (const m of ref.matchAll(/§\s?(\d+(?:\.\d+)?)/g)) out.add(`§${m[1]}`); return [...out]; };
const lieux = new Map();
for (const c of corr) { const f = c.file.replace(/^@/, ''); const court = /^\d\d – /.test(f) ? `ch. ${f.slice(0, 2)}` : f.replace(/-20\d\d-\d\d-\d\d\.md$|\.md$/, '');
  for (const id of ids(c.ref || '')) { if (!lieux.has(id)) lieux.set(id, new Map()); const m = lieux.get(id); m.set(court, (m.get(court) || 0) + 1); } }
const ou = (...k) => { const m = new Map(); for (const id of k) for (const [f, n] of lieux.get(id) || []) m.set(f, (m.get(f) || 0) + n); return [...m].sort().map(([f, n]) => `${f} (${n})`).join(', '); };
const I = 'intégré', P = 'partiel', R = 'restant';
// [id, intitulé, décision, règles / emplacement normatif, statut, remarque, identifiants de référence pour les emplacements]
const T = [
  ['CH-01', 'Nature de la valeur (informative, kg, sans convention de matériel)', 'D-403', 'RM-235', I, ''],
  ['CH-02', 'État initial Sans ; anciens exercices sans charge ; valeur remplaçant Avec', 'D-403, D-404', 'RM-236, RM-237', I, ''],
  ['CH-03', 'Séries identiques : charge commune après la Pause, saisie directe', 'D-404', 'RM-237', I, 'État de saisie non dessiné dans Figma (écart 2)'],
  ['CH-04', 'Séries variables : ligne Avec / Sans sous le tableau, colonne, valeur liée à la série, règles communes', 'D-404, D-417', 'RM-238, RM-250', I, 'Cellules : sélecteur existant de chaque champ (D-417)'],
  ['CH-05', 'Saisie décimale, pas 0,25 kg, arrondi supérieur, zéro, (ré)activation', 'D-405', 'RM-239', I, 'Clavier Figma sans séparateur décimal (écart 1)'],
  ['CH-06', 'Conservation avec Sans', 'D-403', 'RM-236', I, ''],
  ['CH-07', 'Cohérence avec les autres paramètres (validation, séries, pas de valeur par côté)', 'D-403, D-404', 'RM-235, RM-238', I, ''],
  ['CH-08', 'Phrase de synthèse', 'D-403, D-414, D-422, D-423', 'RM-240', I, 'Formes, place après la valeur par série, série à zéro listée avec 0'],
  ['CH-09', 'Exécution : charge de la série courante', 'D-403', 'RM-241', I, 'Affichage non illustré dans Figma (écart 4)'],
  ['CO-01', 'Changement de côté Avec / Sans, côté 1 / côté 2, compatibilité', 'D-406, D-407', 'RM-242, RM-243, RM-244', I, 'N = 1 : ligne Enchainement absente (D-415) ; frames d’exécution encore « Côté droit » (écart Figma)'],
  ['CA-01', 'Cadence Autre | 5 s | 2 s | 1 s | Sans', 'D-408, D-420', 'RM-245', I, 'Aucune mémorisation personnalisée (D-420)'],
  ['DU-01', 'Durée de l’exercice, chevron des signaux, absence de ligne', 'D-409', 'RM-246', I, 'Texte « Durée totale : » de la phrase inchangé (Q-V3-13)'],
  ['CV-01', 'Chevrons intégrés (Variables, Avec, phases)', 'D-410', 'RM-247', P, 'Option Avec des phases : dépend de #370 (dependances-pr.md)'],
  ['AR-01', 'Condition d’arrêt : saisie en identiques, résultat dérivé en variables', 'D-411, D-416, D-419', 'RM-248, RM-249', I, 'À la cible par défaut ; durée masquée à l’échec commun ; libellé mixte Figma erroné'],
  ['GR-01', 'Quatre groupes, ordre, tableaux, modale adaptée', 'D-413', 'CE-UI-10, ch. 06, DSF', P, 'Ligne Phases du groupe 2 : dépend de #370 ; tokens : Q-V3-10'],
  ['RO-01', 'Roulettes : durée seule en identiques, durée ou échec par cellule variable', 'D-412, D-418', 'RM-250', P, 'Roulette Répétitions des séries identiques sans À l’échec (D-418) ; roulette de phase : #370'],
  ['PR-01', 'Libellés et contrôles', 'D-413', 'CE-UI-10, ch. 01, ch. 06, ch. 08', I, '« Phases de l’exercice » : #370'],
  ['PR-02', 'Tableaux (36 px, sans +/−, fond blanc)', 'D-413', 'CE-UI-10, DSF Circuits', I, ''],
  ['PR-03', 'Traitement des contrôles', 'D-413', 'DSF (blocs du 18/10)', P, 'Variables liées relevées (Q-V3-10) ; gris des cadres et violet non liés ; retrait ou réaffectation des tokens : chantier DSF'],
  ['PR-04', 'Modale et clavier', 'D-405, D-413', 'CE-UI-10 rubrique 10, RM-239', I, ''],
  ['PR-05', 'Enchaînement des côtés : notation Figma conservée', 'D-406', 'RM-243', I, 'Notation Figma à lettres D/G : Q-V3-09'],
  ['AC-01', 'Exercice ancien sans charge', 'D-403', 'RM-236 ; CE-UI-10 recette', I, ''], ['AC-02', 'Identiques 10 kg', 'D-404', 'RM-237', I, ''],
  ['AC-03', '1,25 kg conservé', 'D-405', 'RM-239', I, ''], ['AC-04', 'Avec → Sans → Avec', 'D-403', 'RM-236', I, ''],
  ['AC-05', 'Variables 20/25/30 kg', 'D-404', 'RM-238', I, ''], ['AC-06', 'Déplacement d’une série', 'D-404', 'RM-238', I, ''],
  ['AC-07', 'Règles communes des champs', 'D-404', 'RM-238 (renvois explicites)', I, ''], ['AC-08', 'Synthèse à charges différentes', 'D-414, D-422', 'RM-240', I, ''],
  ['AC-09', 'Exécution à charge active', 'D-403', 'RM-241', I, ''], ['AC-10', 'Invariance des calculs', 'D-403', 'RM-235', I, ''],
  ['AC-11', 'Clavier ouvert sur tableau', 'D-405', 'RM-239, CE-UI-10', I, 'Écart Figma : pas de séparateur'], ['AC-12', 'Duplication ou copie', 'D-403', 'RM-236 ; ch. 09, ch. 11', I, ''],
  ['AC-13', 'Plus de Gauche/Droite', 'D-406', 'RM-242', I, ''], ['AC-14', 'Compatibilité D→G / G→D', 'D-406', 'RM-244', I, 'Correspondance RIGHT/LEFT pour l’historique : Q-V3-11'],
  ['AC-15', 'Cadence rapide', 'D-408', 'RM-245', I, ''], ['AC-16', 'Repli des signaux', 'D-409', 'RM-246', I, ''],
  ['AC-17', 'Exercice ouvert depuis une séance', 'D-409', 'RM-246, RM-218', I, ''], ['AC-18', 'Chevrons intérieurs', 'D-410', 'RM-247', P, 'Phases : #370'],
  ['AC-19', 'Identiques : deux conditions sélectionnables', 'D-411', 'RM-248', I, ''], ['AC-20', 'Variables homogènes', 'D-411', 'RM-249', I, ''],
  ['AC-21', 'Variables mixtes', 'D-411', 'RM-249', I, ''], ['AC-22', 'Ordre des cadres, pas d’espace vide', 'D-413', 'CE-UI-10', I, ''],
  ['AC-23', 'Pas de côté anatomique imposé', 'D-407', 'RM-243', I, ''], ['AC-24', 'Roulette commune sans À l’échec', 'D-412', 'RM-250', I, ''],
  ['AC-25', 'Cellule variable À l’échec', 'D-412', 'RM-250', I, ''], ['AC-26', 'Retour à une durée numérique', 'D-412', 'RM-250', I, ''],
];
const S112 = [
  ['8328:36923', 'Champs vides', I, 'Écarts : « A la cible » ; aucune condition sélectionnée (D-416)'], ['8328:37092', 'Mode d’exécution (sélection segmentée)', I, 'Écart : Valider actif avec cible manquante'],
  ['8328:37972', 'Changement de côté Replié', I, ''], ['8328:39072', 'Une seule série', I, 'Écart Figma : Avec désactivé, contraire à D-415'],
  ['8328:38084', 'Durée totale (roulette)', I, '5 min 30 s illustratif'], ['8328:37862', 'Durée d’une série (roulette)', I, ''],
  ['9232:44646', 'Durée d’une phase (roulette)', I, 'Nom de frame de phase sur une cellule variable : signalé, aucun contrat de phase déduit'],
  ['8328:38632', 'Séries variables en Répétition Avec Cadence', I, ''], ['8328:38848', 'Séries variables (tableau replié)', I, ''],
  ['8982:15172', 'Phases verrouillées (séries variables)', P, 'Cité au contrat CE-UI-10 ; capture laissée au report de #370'],
  ['8470:13303', 'Séries variables, cas mixte', I, 'Écart : « A la cible età l’échec »'], ['9207:18817', 'Tableau de 3 phases', R, 'Dépend de #370'],
  ['9289:17849', 'Charge', I, ''], ['9290:17953', 'Séries variables avec charge', I, ''], ['9292:18077', 'Séries variables avec charge — Clavier numérique', I, 'Écarts : pas de séparateur ; cellule Durée en surbrillance'],
  ['9307:18208', 'Série en durée — Durée de l’exercice déployée', I, ''],
];
const S113 = ['Essais centrés et Proposition 3/4', 'Option manuelle Mixte', 'Déploiement temporaire des signaux sur les exemples avec charge', 'Convention par haltère/barre/machine', 'Autorisation particulière de cellules de charge vides', 'Champ « Autre résistance »', 'Charge « à côté de la cible » pendant l’exécution', 'Liste de nouvelles bornes numériques', 'Généralisation de la saisie au clavier aux autres nombres'];
const ARB = [['Q-V3-01', 'Phrase : formes de la mention de charge', 'D-414', 'RM-240'], ['Q-V3-03', 'Condition d’arrêt À la cible par défaut', 'D-416', 'RM-248'], ['Q-V3-04', 'N = 1 : Enchainement absent, Avec / Sans disponible', 'D-415', 'RM-242'], ['Q-V3-05', 'Cellules : sélecteur existant de chaque champ', 'D-417', 'RM-250'], ['Q-V3-06', 'Roulette Répétitions des séries identiques sans À l’échec', 'D-418', 'RM-250'], ['Q-V3-07', 'Durée masquée à l’échec commun', 'D-419', 'RM-248'], ['Q-V3-08', 'Cadence sans mémorisation personnalisée', 'D-420', 'RM-245'], ['Q-V3-15', 'Évolutions incluses dans le MVP', 'D-421', 'ch. 05, B-092'], ['Q-V3-16', 'Condition d’arrêt imposée présentée grisée', 'D-424', 'CE-UI-10 (complément Formats)'], ['Q-V3-19', 'Mention de charge après la valeur par série', 'D-422', 'RM-240'], ['Q-V3-20', 'Série à zéro listée avec 0', 'D-423', 'RM-240']];
const S12 = ['Pas 0,25 kg', 'Zéro = Sans charge, par série en variable', 'Toutes les séries à zéro → Sans', 'Aucun plafond métier', 'Arrondi au pas supérieur sans message', 'Arrondi à la sortie du champ ou à la validation', 'Première activation 0,25 kg et saisie ouverte', 'Réactivation : valeurs mémorisées', 'Réactivation après tous zéros : 0,25 kg par série', 'Ligne Avec / Sans sous le tableau', 'Colonne masquée, valeurs conservées', 'Titre de colonne non cliquable', 'Pas de nouvelle notation d’enchaînement', 'Signaux visibles sans ligne de durée'];
const S12R = ['RM-239', 'RM-239', 'RM-239', 'RM-239', 'RM-239', 'RM-239', 'RM-239', 'RM-236, RM-239', 'RM-239', 'RM-238', 'RM-238', 'RM-238', 'RM-243', 'RM-246'];
const ECARTS = [['§4-1', 'Clavier sans séparateur décimal (9292:18077)'], ['§4-2', 'État de saisie de la charge en séries identiques non dessiné'], ['§4-3', 'Ligne Charge absente de l’état clavier 9292:18077 (choix de présentation)'], ['§4-4', 'Affichage de la charge en exécution non illustré']];
const lignes = [['element', 'intitule', 'decision', 'emplacement_normatif', 'emplacements_modifies', 'statut', 'remarque']];
for (const [id, t, d, r, s, n] of T) lignes.push([id, t, d, r, ou(id) || '—', s, n]);
for (const [nid, t, s, n] of S112) lignes.push([`§11.2 ${nid}`, t, 'D-413', 'ch. 06 (capture), CE-UI-10 rubrique 1', 'ch. 06, ch. 13', s, n]);
S113.forEach((t, i) => lignes.push([`§11.3-${i + 1}`, t, '—', 'Registre, en-tête de la section du 18/10 (exclusion)', 'ch. 07', 'exclu', 'Non intégré comme règle (proposition abandonnée ou non arbitrée)']));
S12.forEach((t, i) => lignes.push([`§12-${i + 1}`, t, i < 12 ? 'D-405' : (i === 12 ? 'D-406' : 'D-409'), S12R[i], ou('§12') || 'ch. 10', I, '']));
for (const [id, t, d, r] of ARB) lignes.push([id, t, d, r, ou(id) || '—', I, 'Arbitrage de Hermann du 18/10/2026']);
for (const [id, t] of ECARTS) lignes.push([id, t, '—', 'ch. 06 (captures), rapport', 'ch. 06', 'signalé', 'Écart Figma, aucune modification de Figma']);
fs.writeFileSync(path.join(C, 'matrice-couverture.tsv'), lignes.map(l => l.join('\t')).join('\n') + '\n');
const cnt = {}; lignes.slice(1).forEach(l => cnt[l[5]] = (cnt[l[5]] || 0) + 1);
const md = ['# Matrice de couverture — spécification v3.0 du 18/10/2026', '',
  'Document de traçabilité du change, **non normatif** : les règles font foi dans les chapitres cités. Générée par `outils/matrice-couverture.mjs` ; les emplacements modifiés sont comptés depuis les références des corrections appliquées (`constats/*-applique.json`). Statuts : intégré, partiel (la raison est donnée), restant, exclu (§11.3), signalé (écart Figma).', '',
  `Totaux : ${Object.entries(cnt).map(([k, v]) => `${k} ${v}`).join(' ; ')} — ${lignes.length - 1} éléments.`, '',
  '| Élément | Intitulé | Décision | Emplacement normatif | Emplacements modifiés (corrections) | Statut | Remarque |', '|---|---|---|---|---|---|---|',
  ...lignes.slice(1).map(l => `| ${l.join(' | ')} |`), '',
  'Questions Q-V3-nn : [questions-hermann.md](questions-hermann.md). Dépendances aux PR : [dependances-pr.md](dependances-pr.md).', ''];
fs.writeFileSync(path.join(C, 'matrice-couverture.md'), md.join('\n'));
console.log(cnt, lignes.length - 1);
