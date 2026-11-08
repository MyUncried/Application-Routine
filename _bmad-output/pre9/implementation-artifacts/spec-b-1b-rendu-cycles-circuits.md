# B.1b — Rendu des Séances à plusieurs Circuits et à Cycles (seconde partie de B.1)

Story PRE-9, epic B. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026). Plan : `../planning-artifacts/epics.md` § B.1 ; B.1a : `spec-b-1a-en-tete-circuit-d451.md`. Arbitrages : ARB-12, ARB-13, ARB-19 (décidés).

## Livré

- **Domaine** (`src/domain/sessions/layoutOperations.ts`) : lettres de désignation (COMP §4, ARB-13 : Circuits lettrés à l'échelle de la Séance, Cycles de même, aucune lettre pour un conteneur seul de sa nature, après Z : AA, AB…) ; compte d'un Circuit 1..99 (en alternées, ses Exercices suivent N avec réserve, AD-38) ; nature d'un Circuit (perte annoncée avant mutation, troncature à la confirmation, alternées → groupées sans perte, COMP §2) ; compte d'un Cycle 1..99 (D-451). `adaptExercise` / `lostSeriesCount` exportés de `circuit.ts` (mêmes règles que le Circuit unique).
- **Composition** : une Séance dont la disposition n'est pas représentable dans l'ancien modèle (plusieurs Circuits, Cycles) est rendue dans sa structure : Exercices directs, blocs Circuit (en-tête B.1a, lettre, repli), blocs Cycle (`CycleHeader` : « Cycle » + lettre, `N répétition(s)` avec stepper révélé au toucher du nombre, durée à droite, jamais replié), Compte à rebours et Fin hors des conteneurs. Comptes et nature édités par les opérations ci-dessus, avec la confirmation de perte existante (Annuler : aucun changement). Un seul contrôle ouvert à la fois. Repli par Circuit, local, non persisté, tout déplié à l'ouverture (ARB-12).
- **Carte du Catalogue** : « Circuit · N tour(s) · groupées / alternées » (classe A, COMP §2 : unité unique tour(s)), écart signalé en B.1a.
- `CountStepper` extrait de `CircuitHeader` (même géométrie, maintien et accessibilité) et partagé avec le Cycle.

## Désactivé en mode structure générale (reporté)

Glisser-déposer et appui long (B.4) ; balayage Dupliquer / Supprimer et actions d'accessibilité Monter, Descendre, Dupliquer, Supprimer (B.4, B.5) ; « Ajouter un arrêt » et mode placement (B.6) ; œil des Volumes. Une telle structure ne porte aucun Point d'arrêt avant B.6. « Ajouter un exercice » reste disponible : la carte s'ajoute en fin de niveau Séance, là où l'enregistrement la place (la position d'ARB-07 dans un conteneur vient avec B.2). Le mode de l'ancien modèle (Circuit unique) est inchangé.

## À CLARIFIER (classe C — rendu ; choix provisoires en place)

1. **Fond du Cycle** : `#EAEAFF` (valeur du jeton existant `segmentedInactiveSurface`), pleine largeur, sans rayon ; frange dégradée de 4 pt (COMP §4) non rendue.
2. **Largeurs** : géométrie existante conservée plutôt que 402 / 386 / 370 ; Circuit dans un Cycle retiré de 4 pt de chaque côté.
3. **Espacements** : 9 pt entre les membres du Cycle et sous son en-tête ; marge verticale du Cycle 14 pt ; en-tête de 40 minimum.
4. **Rail simplifié** : anneau sur chaque en-tête, segments fixes entre éléments ; pas de liens mesurés ni d'animation de glisser.
5. **Durée des cartes** dans un Circuit calculée selon la nature et le N de ce Circuit ; durée de la Séance par le calcul de la structure générale ; arrondi du Cycle à qualifier (B.7, ARB-11).
6. **Accessibilité** : rang « n sur m » compté dans le parent de la carte ; titre du Cycle en en-tête accessible, lu avec sa durée.
7. Changer un compte referme un menu de nature ouvert.

## Observation à vérifier sur appareil

Stepper existant : un appui qui atteint une borne désactive le bouton ; en test, le relâchement n'est alors pas transmis et la répétition du maintien continue (sans effet, la valeur restant à la borne). À observer pendant la recette.

## Synchronisation code / documentation

- **Classe A** : D-451, COMP §1, §2, §4, ARB-12, ARB-13 ; libellé du Catalogue (COMP §2).
- **Classe C** : points 1 à 7.
- **Classe D** : `compositionLayout.ts`, `CountStepper`, clés de contrôle par conteneur. Aucun document normatif modifié.

## Tests

- Domaine : `layoutOperations.b1b.test.ts` (6). Écran : `CompositionScreen.b1b.test.tsx` (10 : rendu, lettres, comptes, nature avec perte et Annuler, repli, édition d'une carte, gestes désactivés, ancien modèle inchangé), `compositionLayout.b1b.test.ts`, `SessionCompositionTree.e3` mis à jour.
- `src/features/sessions` 67 suites / 1 453 tests ; `src/shared` + `src/domain/sessions` + suites B.1b 38 suites / 794 tests : verts (sous-agent) ; `tsc` et ESLint sans erreur (contrôlés ici). Aucune vérification sur iPhone.
