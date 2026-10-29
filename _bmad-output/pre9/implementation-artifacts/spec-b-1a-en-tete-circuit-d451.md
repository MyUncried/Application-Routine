# B.1a — En-tête de Circuit D-451 et repli (première partie de B.1)

Story PRE-9, epic B. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026). Plan : `../planning-artifacts/epics.md` § B.1. Dépend de : A.1 (`done`). Arbitrages : ARB-12, ARB-19 (décidés).

**Découpage de B.1 (classe D, sans changement de périmètre)** : B.1a — nouvel en-tête de conteneur et repli, appliqués au Circuit de la Composition actuelle (toutes les Séances existantes) ; B.1b — rendu des Séances à plusieurs Circuits et à Cycles (lettres ARB-13, Cycle non repliable, Exercices directs de Cycle), qui suit.

## Règles appliquées (classe A : déjà décidées)

Complément du 28/10 à D-451 (registre ch07 l.1134-1143) : « Remplace D-442 sur le stepper permanent […] nombre révélé au toucher, unité non interactive, choix de nature sur l'adjectif » ; « Remplace la clause de D-443 masquant la durée […] durée de nouveau visible » ; natures renommées séries groupées / alternées ; repli à 68 pt. RM-027 ; ch10 « Le contrôle » ; COMP §2, §4. ARB-12 : état replié non persisté, Circuit déplié à l'ouverture, aucun contenu perdu.

## Livré

- **En-tête** (`CircuitHeader.tsx`) : anneau ; « Circuit » (15) et chevron, une seule cible « Circuit, <durée> » avec état déplié / replié ; compteur `N tours · groupées|alternées` — nombre en bleu (cible 44 pt) qui révèle le stepper − N + (géométrie et maintien inchangés, bornes 1..99, pas par `circuitCountOutcome`), unité « tour(s) » non interactive, adjectif en bleu qui ouvre le choix de nature (menu natif iOS / panneau Android) ; durée à droite (12, tertiaire).
- **Nature** : options « Séries groupées » — « toutes les séries d'un exercice exécutées à chaque tour » ; « Séries alternées » — « une série de chaque exercice exécutée à chaque tour » (COMP §2). Identifiants persistés `TOURS` / `SERIES` inchangés. Confirmations : « Passer en séries alternées ? », « Ajouter au / Déplacer dans le circuit à séries alternées ? » (ancienne nomenclature « circuit de séries » devenue historique, COMP §2).
- **Repli** : chevron → Circuit replié, seconde ligne des noms séparés par « · », tronquée, hauteur de référence 68 pt ; cartes masquées ; brouillon inchangé ; état local à l'écran, non persisté, déplié à l'ouverture.
- **Durée du Circuit** : `formatCircuitDuration` (`compositionPresentation.ts`) — calcul existant restreint au Circuit, formateur de la Séance (≈ / ≥).

## À CLARIFIER (classe C — ne bloque que le rendu ou le geste cité ; choix provisoires en place)

1. **Fermeture du stepper révélé** : nouveau toucher du nombre, toucher hors du stepper, défilement, ouverture du choix de nature, repli, Continuer, entrée en placement, dialogue de sortie, perte du focus ; un pas ne le ferme pas (comportement RC-4 antérieur à D-442).
2. **Repli et gestes** : un appui long sur une carte d'un Circuit replié n'est pas possible (le Circuit se déplie, l'utilisateur recommence) ; l'entrée en placement déplie ; tout changement du contenu du Circuit (entrée, sortie, Point retiré) le déplie, pour qu'aucun changement ne reste caché ; chevron inactif pendant un glisser. Le repli préalable d'un Circuit saisi par son en-tête (COMP §6) relève de B.4.
3. **Cible du chevron** : nom et chevron forment un seul bouton « Circuit, <durée> » (icône 16 pt), plutôt qu'un chevron isolé.
4. **Durée du Circuit** : formateur de la Séance (paliers de 15 s, ≈ / ≥) ; Circuit vide « 0 s ». COMP §4 laisse « l'arrondi précis » à qualifier ; la durée et l'arrondi du Cycle suivront la Séance (ARB-11, B.7).
5. **Ligne des noms** (13, texte primaire) et disposition repliée (rangée en tête, 68 pt minimum) : non précisées par Figma ni les sources ; un Circuit vide peut être replié (ligne vide).
6. **Espacements** titre → compteur et compteur → durée (8) ; à faible largeur, stepper ouvert, la durée peut être entièrement tronquée.

## Écart signalé, non traité

- **Arbre de la carte du Catalogue** (PRE-8, `SessionCompositionTree`) : affiche encore « Circuit · N séries » pour un Circuit alterné ; COMP §2 fait de « tour(s) » l'unité unique. Correction proposée (classe A) avec le rendu des conteneurs de B.1b, sans rouvrir la recette E.

## Synchronisation code / documentation

- **Classe A** : règles citées ci-dessus.
- **Classe B (propagation d'une décision déjà validée)** : ch13 l.1834 (« En-tête du Circuit (D-442) : − et + toujours affichés… ») annotée comme remplacée par le complément D-451 et RM-027.
- **Classe C** : points 1 à 6 ci-dessus.
- **Classe D** : découpage B.1a / B.1b ; `formatCircuitDuration`.

## Tests

- Réalisés par un sous-agent puis contrôlés dans la session principale : `CircuitHeader.test.tsx` réécrit (33 tests ; les tests du stepper permanent D-442 et de l'absence de durée D-443 remplacés) ; `CompositionScreen.test.tsx` (fermeture du stepper, bloc « repli du Circuit », 9 tests) ; `CompositionExerciseFlow.integration`, `CircuitEntryConfirmModal`, `i18n/index.test.ts` mis à jour.
- `src/features/sessions` 66 suites / 1 443 tests et `src/shared` 17 suites / 206 tests verts (sous-agent) ; `tsc` et ESLint sans erreur ; suite complète : voir `sprint-status.yaml`.
- Aucune vérification sur iPhone : recette prévue après B.2.
