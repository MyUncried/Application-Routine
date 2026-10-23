---
title: 'Story 7.9 — Retours J6d : unité du stepper du Circuit, bouton « Continuer »'
type: 'bugfix'
created: '2026-10-23'
status: 'review'
baseline_commit: '6c07830b'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/spec-7-8-presentation-en-tete-bornes-duree-seance.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette J6d de Hermann (23/10), j6d-5, verbatim : « Lorsqu'on sélectionne circuit le texte est tronqué » ; précision de Hermann : « Quand on sélectionne Séries, le lecteur Série est tronqué dans le stepper ». Remarque générale : « le bouton « Continuer » doit être à la même hauteur que le bouton d'action de l'écran de création d'un exercice ».

**Approach:** AC1 : l'unité du stepper (« séries » / « série », comme « tours » / « tour ») tient entièrement après tout choix de nature et tout pas, N à 1 ou 2 chiffres, à 375 et 402 ; la pastille suit son contenu ; si la place manque, seul le titre cède. AC2 : « Continuer » reprend le pied d'action de `Terminer` (écran de création d'un Exercice), référence validée.

## Boundaries & Constraints

**Always:**
- Sources : epics.md « Story 7.9 » (commit `6c07830b`) ; précisions du coordinateur.
- Primitive native du menu de nature (`Menu` SwiftUI) conservée ; textes à la taille du titre (7.3) conservés.
- AC2 : même position verticale (zone de sécurité, marges) et même hauteur que `Terminer` ; constantes partagées, sans changer les valeurs de l'écran Exercice ; défilement jusqu'à la dernière position (D-435) et placement cohérents.

**Never:**
- Aucune modification de `docs/`, `.github/`, `_bmad-output/pre6.zip`, `tokens.ts` ; aucune dépendance.

## I/O & Edge-Case Matrix

| Scenario | Expected |
|---|---|
| Tours → « Circuit de séries » (iOS, menu) | « séries » entier, la pastille s'élargit |
| Séries → Tours | « tours » entier, la pastille se réduit |
| N 1 → 2 (« série » → « séries », « tour » → « tours ») | unité entière |
| N 9 → 10 → 99 | chiffre et unité entiers ; le titre cède s'il le faut |
| Même texte d'unité (N 3 → 12) | aucun remontage du menu natif |
| « Continuer » (iOS) | bas à 24 du bord de l'écran, hauteur 48, rayon 24, ombre G-8, comme `Terminer` |
| « Continuer » (Android) | au moins l'encart bas, comme `Terminer` |
| Placement | barre (48) dans le même pied, même bas |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CircuitNatureMenu.tsx` : `triggerLayoutKey`, `Host` remonté quand le texte du déclencheur change.
- `src/features/sessions/CircuitHeader.tsx` : passe le texte de l'unité.
- `src/shared/ui/finalAction.ts` (nouveau) : `FINAL_ACTION_BUTTON`, `FINAL_ACTION_SHADOW`, `FINAL_ACTION_BOTTOM_OFFSET`, `finalActionBottomMargin`.
- `src/features/activities/ActivityEditorForm.tsx` : `Terminer` lit le module partagé (valeurs inchangées).
- `src/features/sessions/CompositionScreen.tsx` : pied « Continuer ».
- Tests : `CircuitHeader.test.tsx`, `CompositionScreen.test.tsx` ; `ActivityEditorForm.test.tsx` inchangé (filet de l'écran Exercice).
- `src/features/sessions/README.md`, `src/shared/ui/README.md`.

## Tasks & Acceptance

- [x] AC1, AC2, tests, README.
- Given l'arbre entier, when `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, then tout est vert. Given un iPhone, when J6e, then « séries » entier après le choix de nature, « Continuer » à la hauteur de `Terminer`.

## Implementation Notes

**Cause AC1.** Sur iOS, la pastille d'unité est le libellé du `Menu` SwiftUI (`CircuitNatureMenu`), hébergé par `RNHostView matchContents` dans un `Host matchContents`. Dans ce mode (`@expo/ui`, `HostView.swift`, `RNHostView.swift` / `ApplySizeFromYogaNode`), le `Host` impose à Yoga la taille de son contenu SwiftUI, et ce contenu suit la taille de la vue React Native hébergée : boucle circulaire. Quand le texte s'allonge (« tours » → « séries » après le choix « Circuit de séries », ou « série » → « séries » au pas 1 → 2), il est mis en page dans l'ancienne largeur : `numberOfLines={1}` le tronque, la vue ne grandit pas, l'hôte non plus — la boucle reste figée. Un texte qui raccourcit se réduit normalement. Correction : `key` du `Host` = texte de l'unité et échelle de police ; l'hôte est remonté et remesuré au nouveau contenu (comme au premier affichage), seulement quand cette clé change. Le menu remonté ne peut plus rendre le focus VoiceOver : un changement de nature demande le focus sur le conteneur stable de la pastille, aussi sur iOS.

**Lectures écartées.** (1) Titre « Circuit » tronqué par le stepper calé à droite (7.8) : écarté par le calcul — à 375, la ligne offre 282 (351 − 69) ; « Circuit » (≈ 49) + écart 8 + stepper « − 99 séries + » (≈ 195) ≈ 252, marge ≈ 30 ; à 402, 309 ; et Hermann précise que c'est l'unité. (2) Circuit « sélectionné » comme état (placement, glisser d'une carte, carte soulevée) : l'en-tête n'y change ni de texte ni de mise en page (seulement `pointerEvents` et l'accessibilité), aucune source de troncature.

**AC2.** Avant (iPhone, encart bas 34) : bas de « Continuer » à 50 du bord de l'écran (`insets.bottom + 16`), hauteur 41 (12 + 17 + 12), sans ombre. `Terminer` : bas à 24 (encart ignoré sur iOS, FR-37), hauteur 48, ombre G-8. Après : identiques (module partagé). La barre de placement (48), dans le même pied, descend avec lui et a désormais la même hauteur que « Continuer » (plus de saut de 41 à 48). Le corps défilant s'arrête au-dessus du pied : la dernière position reste atteinte (environ 19 points de défilement gagnés : marge 50 → 24, bouton 41 → 48).

**Choix non dictés (à valider en J6e)**
1. Ombre G-8 de `Terminer` reprise sur « Continuer » (« même pied »).
2. Marges latérales de la Composition conservées (24 à toutes largeurs ; l'Éditeur passe à 16 sous 390) : seules la position verticale et la hauteur sont alignées.
3. Sur iOS, le bas à 24 est dans la zone de l'indicateur d'accueil (encart 34), comme `Terminer`.
4. Le menu natif est remonté à chaque changement du texte de l'unité (pas à chaque pas) : saut d'une image possible de la pastille, à observer (y compris maintien de − de 3 à 1).
5. La barre de placement (✓ / Annuler), dans le même pied, descend aussi à 24 : 10 points dans la zone de l'indicateur d'accueil ; à arbitrer (alternative : garder `insets.bottom + 16` en placement, au prix d'un saut du pied à l'entrée en placement).
6. Écart message d'erreur → bouton : 12 (Composition) contre 8 (Exercice), conservé.

## Spec Change Log

## Review Triage Log

Deux revues indépendantes du 23/10/2026 (aveugle ; cas limites et écarts de vérification), sous-agents en lecture seule.

**Corrigés**
1. Haut (deux revues) — perte du focus VoiceOver sur iOS après un choix de nature sans perte (le menu natif, remonté, ne le rendait plus) : focus demandé sur la pastille ; test.
2. Moyen (deux revues) — Dynamic Type : l'échelle de police entre dans la clé de remontage.
3. Bas — commentaires (mécanisme exact de la boucle `Host` / vue hébergée ; `FINISH_BOTTOM_OFFSET` disparu ; bloc JSDoc orphelin) ; test du pied en valeurs littérales (48, rayon 24, ombre).

**Acceptés / signalés (J6e)**
- Preuve de « tient à 375 et 402 » : calcul et mécanisme testés (remontage, absence de largeur fixe, cession du seul titre) ; la largeur réelle relève de l'appareil.
- Saut d'une image au remontage, animation de fermeture du menu iOS 26 : à observer.
- Barre de placement dans la zone de l'indicateur d'accueil : choix 5.
- Voie sans remontage (enfant hébergé mesuré hors contrainte de largeur) : non retenue sans essai sur appareil.
- Marges latérales et écart du message d'erreur : choix 2 et 6.

## Verification

**Commands:** `npm test -- --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`.

**Manual checks (J6e)** : choisir Séries puis Tours dans le menu de la pastille ; N de 1 à 2 et de 9 à 10 en Séries et en Tours ; 375 et 402 ; VoiceOver sur la pastille après un choix ; « Continuer » comparé à `Terminer` (même hauteur, même bas) ; entrer en placement et en sortir ; défiler jusqu'à la Fin.
