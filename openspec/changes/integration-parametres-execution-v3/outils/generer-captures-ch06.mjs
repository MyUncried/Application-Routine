// Intégration v3 — génère la correction du chapitre 06 qui remplace la liste des états de la feuille CE-UI-10
// par les frames actuelles de Prototype MVP (captures exportées le 18/10/2026 dans images/parametres-2026-10-18/).
// Usage : node generer-captures-ch06.mjs <racine> <sortie.txt>
import fs from 'fs'; import path from 'path';
const [repo, out] = process.argv.slice(2);
const f = path.join(repo, 'docs', 'Specifications-fonctionnelles', '06 – Ecrans et navigation de la V1.md');
const L = fs.readFileSync(f, 'utf8').replace(/\r/g, '').split('\n');
const i0 = L.findIndex(l => l.startsWith('Ces 19 frames sont des états de CE-UI-10'));
const i1 = L.findIndex((l, i) => i > i0 && l === '#### Couverture et limites');
if (i0 < 0 || i1 < 0) throw new Error('bornes introuvables');
let j = i1 - 1; while (L[j] === '') j--;
const ancien = L.slice(i0, j + 1).join('\n');
// [node-id, nom Figma actuel, note d'état] — noms relevés par get_metadata le 18/10/2026.
const F = [
  ['8328:36923', 'Création activité — Paramètres (modale) — Champs vides', 'Valider désactivé ; Durée de l’exercice affichée avec « — » (D-384, D-396).'],
  ['8328:37092', 'Création activité — Paramètres (modale) — Mode d’exécution (sélection segmentée)', 'Mode en contrôle segmenté ; Durée d’une série et Durée de l’exercice à « — ». Écart Figma : Valider y apparaît actif alors qu’une cible manque (D-337).'],
  ['8328:37760', 'Création activité — Paramètres (modale) — Série en durée', 'Séries identiques en mode Durée ; signaux repliés sous Durée de l’exercice.'],
  ['8328:37862', 'Création activité — Paramètres (modale) — Durée d’une série (roulette)', 'Roulette de durée commune, durée numérique seule, sans option À l’échec (RM-250).'],
  ['8328:38084', 'Création activité — Paramètres (modale) — Durée totale (roulette)', 'Roulette de la ligne Durée de l’exercice ; 5 min 30 s est une valeur illustrative, pas une règle (le nom de frame garde l’ancien libellé).'],
  ['8328:37972', 'Création activité — Paramètres (modale) — Changement de côté Replié', 'Avec sélectionné, chevron intérieur vers le bas, Enchainement et Pause entre les côtés repliés (RM-242, RM-247).'],
  ['8328:38193', 'Création activité — Paramètres (modale) — Changement de côté déployé', 'Avec déployé : Enchainement (deux stratégies, notation Figma à flèches conservée, RM-243) et Pause entre les côtés.'],
  ['8328:38409', 'Création activité — Paramètres (modale) — Durée totale ajustée (message)', 'Message d’ajustement de la durée (D-340) ; le nom de frame garde l’ancien libellé de la ligne.'],
  ['8328:38513', 'Création activité — Paramètres (modale) — Mode d’exécution (sélection segmentée) — séries variables', 'Mode segmenté au-dessus d’un tableau de séries variables.'],
  ['8328:38632', 'Création activité — Paramètres (modale) — Séries variables en Répétition Avec Cadence', 'Répétitions, cadence 1 s ; Condition d’arrêt déterminée automatiquement (RM-249).'],
  ['8328:38741', 'Création activité — Paramètres (modale) — Séries variables en répétitions Sans Cadence', 'Répétitions sans cadence : aucune ligne Durée de l’exercice (D-397) ; Compte à rebours et Fin d’exercice directement visibles (RM-246).'],
  ['8328:38848', 'Création activité — Paramètres (modale) — Séries variables (tableau replié)', 'Chevron intérieur à Variables vers le bas, tableau replié sans perte (RM-247) ; Condition d’arrêt À la cible déterminée automatiquement.'],
  ['8470:13303', 'Création activité — Paramètres (modale) — Séries variables, cas mixte', 'Résultat unique de la Condition d’arrêt pour un mélange de cibles (RM-249) ; total partiel ≥ 2 min 15 s. Écart Figma : le texte affiché est « A la cible età l’échec » ; le libellé décidé est « À la cible et à l’échec ».'],
  ['9232:44646', 'Création activité — Paramètres (modale) — Durée d’une phase (roulette)', 'Roulette ouverte depuis une cellule de séries variables en mode Durée, avec l’option « Aucune durée, à l’échec » (RM-250). Malgré son nom, cette frame n’illustre pas une roulette de phase : les phases y sont à Sans ; le contrat de phase n’en est pas déduit.'],
  ['8328:39072', 'Création activité — Paramètres (modale) — Une seule série', 'Une seule série, Sans sélectionné. Écart à confronter : Avec y est désactivé, alors que les règles existantes n’interdisent pas le changement de côté à N = 1 (RM-242, D-250) ; l’état n’est pas généralisé.'],
  ['8328:39279', 'Création activité — Paramètres (modale) — Séries variables (déplacement)', 'Déplacement d’une ligne : cible, Pause et charge éventuelle suivent la série (D-249, RM-238).'],
  ['9289:17849', 'Création activité — Paramètres (modale) — Charge', 'Charge commune de séries identiques : « 20 kg » à la place d’Avec, Sans à droite (RM-237). L’état de saisie lui-même n’est pas dessiné.'],
  ['9290:17953', 'Création activité — Paramètres (modale) — Séries variables avec charge', 'Colonnes Durée, Pause, Charge (20, 25, 30 kg illustratifs) ; ligne Charge Avec / Sans sous le tableau (RM-238).'],
  ['9292:18077', 'Création activité — Paramètres (modale) — Séries variables avec charge — Clavier numérique', 'Saisie directe au clavier, tableau visible au-dessus (RM-239, D-413). Écarts Figma : le clavier illustré n’a pas de séparateur décimal ; la cellule mise en évidence est la Durée de la série 1, pas une cellule Charge. La ligne Charge Avec / Sans est volontairement absente de cet état ; le réglage reste disponible hors saisie.'],
  ['9307:18208', 'Création activité — Paramètres (modale) — Série en durée — Durée de l’exercice déployée', 'Seul exemple déployé : chevron vers le haut, Compte à rebours et Fin d’exercice visibles (RM-246).'],
];
const bloc = [
  'Ces 20 frames sont des états de CE-UI-10, pas 20 pages applicatives. Relevé et export du 18/10/2026 dans Prototype MVP (spécification v3.0, D-403 à D-413) ; ils remplacent les captures du 12/10 et du 13/10, qui restent dans le dépôt comme références historiques. Les frames `8328:38301`, `8328:38953`, `8328:39181` et `8328:39390` n’existent plus. Toutes les frames montrent aussi la ligne Phases de l’exercice : elle relève de la proposition en cours sur les phases d’exercice (D-370 à D-375 réservés) et n’est pas décrite par ce chapitre. Les valeurs affichées sont illustratives. Sur toutes les frames, « À la cible » est affiché sans accent (« A la cible ») : le libellé décidé est « À la cible » (D-411).',
];
for (const [id, nom, note] of F) {
  const t = id.replace(':', '-');
  bloc.push('', `##### ${nom}`, '', `[Source Figma — \`${id}\`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=${t})`, '', `![${nom}](images/parametres-2026-10-18/${t}.png)`, '', note);
}
const txt = [
  '# Chapitre 06 — liste des états de la feuille CE-UI-10 remplacée par les frames actuelles (généré par generer-captures-ch06.mjs).',
  '=== V3-G-010 | @06 – Ecrans et navigation de la V1.md | CORRECTION-DECIDEE:D-413 | §4, §11.2, GR-01, PR-01 à PR-05',
  '--- ancien', ancien, '--- nouveau', bloc.join('\n'), ''].join('\n');
fs.writeFileSync(out, txt);
console.log(`ancien : lignes ${i0 + 1} à ${j + 1} ; ${F.length} frames`);
