---
title: 'Story 3.1 — En-tête du Circuit et compteur'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: '1db8afed67d8b61551d5d4e36111f876125cd416'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le Circuit est encore affiché par `TourCard` : libellé « Nombre de tours », roulette `NumberWheelPicker` derrière une boîte à chevron (E2), sans nature ni œil, et le changement de N contourne `setCircuitCount` (report de la story 1.4).

**Approach:** Remplacer `TourCard` par un composant `CircuitHeader` conforme à `8328:28667` et CIR-10 : titre « Circuit », durée du Circuit, chiffre qui révèle − / + au toucher (`InlineStepper` existant), pastille d'unité selon la nature ; tout changement de N passe par `setCircuitCount`.

## Boundaries & Constraints

**Always:**
- En-tête (`8328:28667`, dans le conteneur Circuit existant) : à gauche, « Circuit » (Inter Semi Bold 16, texte primaire) et dessous la durée du Circuit (Inter Regular 12, texte tertiaire ; `formatCompositionSummary` existant : durée seule, « — min » à vide, ≈ / ≥). À droite, le bloc compteur.
- Repos : chiffre (Inter Semi Bold 13, texte primaire, cible tactile 44) + pastille d'unité (`Valeur modifiable` : fond surface, rayon 10, padding 10/4, Semi Bold 13 primaire) avec accord : « tour » / « tours » en Tours, « série » / « séries » en Séries (N = 1 singulier).
- Toucher le chiffre révèle le stepper (`InlineStepper`, `appearance` adaptée au fond blanc arrondi 18 de `8328:28671`, cercles 28 surface, − et + Medium 16 primaires) : − et + autour de « chiffre + pastille » (pastille passée en `accessory` ou équivalent) ; bornes 1..99 (− indisponible à 1, + à 99) ; chaque pas applique `setCircuitCount(draft, n)` (Tours : compte seul ; Séries : réserve), sans message. Toucher la valeur ou ailleurs referme (RC-4, même mécanisme que les steppers révélés de la Feuille PRE-5) ; un seul champ numérique actif à la fois (ouvrir le compteur ferme les roulettes des bornes et inversement).
- VoiceOver : le compteur est un réglage ajustable « Nombre de tours » / « Nombre de séries » (incrémenter / décrémenter, valeur annoncée avec l'unité), utilisable sans révéler le stepper.
- La pastille d'unité est affichée mais sans action dans cette story (choix de nature : story 3.2).
- Géométrie : aucun chevauchement entre titre, durée et compteur à 375 et 402 de large ; la durée se tronque en premier ; le compteur garde sa taille.
- `TourCard`, sa roulette `NumberWheelPicker` du compte, l'état `openOverlay === "tour"` et les clés de lexique devenues inutiles sont retirés ; les zones d'occurrences du Circuit restent rendues dans le même conteneur.

**Never:**
- Œil et modale Volumes (story 3.4 : l'œil est ajouté avec son action, pas de bouton sans effet) ; choix de nature (3.2).
- Modifier `InlineStepper` autrement que par un ajout additif rétrocompatible ; modifier `tokens.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Repos Tours N = 1 | — | « 1 » + « tour » | — |
| Repos Séries N = 3 | — | « 3 » + « séries » | — |
| Révéler | toucher le chiffre | − et + visibles | — |
| Bornes | N = 1 / N = 99 | − indisponible / + indisponible | — |
| Séries 4 → 3 → 4 | stepper | `setCircuitCount` : réserve puis restauration (lignes d'origine) | — |
| Refermer | toucher la valeur ou ailleurs | stepper masqué | — |
| VoiceOver | incrémenter | N + 1, annonce « 4 tours » | — |
| Circuit vide | — | « — min » | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CompositionScreen.tsx` -- `TourCard` (~L2016), `openOverlay` / `toggleOverlay("tour")`, `WheelPickerOverlay` du compte, rendu du conteneur Circuit (~L840) : remplacer par `CircuitHeader`.
- `src/shared/ui/ProfileStepper.tsx:150-230` -- `InlineStepper` (`appearance`, `accessory`, `onValuePress`, accessibilité ajustable).
- `src/features/activities/ExecutionParametersSheet.tsx` -- mécanisme de stepper révélé et de fermeture (RC-4) à réutiliser.
- `src/domain/sessions/circuit.ts` -- `setCircuitCount`, `circuitBoundOf`.
- `src/features/sessions/compositionPresentation.ts` -- `formatCompositionSummary`.
- `src/shared/i18n/resources/fr.ts` -- `composition.tour` (libellés à remplacer : « Circuit », unités avec accord, libellés VoiceOver).
- Tests : `CompositionScreen.test.tsx` (tests de `TourCard` / roulette du compte à remplacer), tests d'intégration qui règlent le nombre de tours.

## Tasks & Acceptance

**Execution:**
- [x] `CircuitHeader.tsx` (nouveau) + tests.
- [x] `CompositionScreen.tsx` -- branchement, retrait de `TourCard` et de la roulette du compte, `setCircuitCount`.
- [x] `fr.ts` -- libellés.
- [x] Tests existants du compte adaptés au nouveau contrôle.

**Acceptance Criteria:**
- Given une Composition, when on règle N, then la durée du Circuit et celle de l'en-tête de séance se mettent à jour, et en Séries les exercices du Circuit suivent N (réserve comprise).
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.

## Implementation Notes

- Implémenté par sous-agent (21/10). `CircuitHeader.tsx` ; `TourCard` et la roulette du compte retirés ; `composition.tour` → `composition.circuit`.
- Ajouts additifs : `InlineStepper` (`stepButtonStyle` limité au fond, `closeAction`, `onValueActivate`) ; `updateDraft` accepte une fonction `(current) => patch` (pas répétés appliqués au brouillon courant).
- Fermeture du compteur (RC-4) : toucher ailleurs (deux zones), défilement, carte, Étiquette, « + », glisser, balayage, Continuer, abandon, dialogue, perte de focus.
- Œil et choix de nature hors story (3.4, 3.2). Reports : `deferred-work.md` (icône et jeton orphelins).
- Vérification : Jest 130 suites / 3498 tests, `tsc` et `lint` sans erreur.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | verification-gap | Effet de `setCircuitCount` sur le brouillon non vérifié à l'écran (le test 4 → 3 → 4 ne lit que les durées) | medium | patch : test sur le brouillon. |
| 2 | edge + blind | Pas répétés calculés sur un brouillon périmé ; résultat partiellement recopié | medium | patch : mise à jour fonctionnelle, résultat entier. |
| 3 | edge + blind + verification-gap | Chemins de fermeture manquants (glisser, balayage, Continuer, abandon, dialogues, perte de focus) | medium | patch : fermetures et test paramétré. |
| 4 | edge | Action « Fermer » sur un conteneur non accessible | medium | patch. |
| 5 | edge + blind | Toucher la valeur traité comme une fermeture VoiceOver | low | patch : comportement de la Feuille. |
| 6 | blind | Bornes 1..99 redéfinies | low | patch : bornes du domaine. |
| 7 | blind | Clé « Fermer » dupliquée | low | patch : `closeField`. |
| 8 | blind | `stepButtonStyle` trop large | low | patch : fond seul + test. |
| 9 | blind | Titre tronqué avant la durée | low | patch : `flexShrink: 0`. |
| 10 | blind | Test « pastille sans action » non probant ; noms de tests périmés ; zones de fermeture dupliquées | low | patch. |
| 11 | edge + blind | `icon-tour`, `dimensions.compositionTourControl` sans usage | defer | `tokens.ts` verrouillé ; à regrouper avec les jetons orphelins. |
| 12 | blind | Couleur tertiaire importée d'un composant voisin | low, rejeté | Constante locale nommée partagée (story 2.1), admise par le contexte d'epic. |
| 13 | blind | Statuts et dates | false | Transitions du workflow ; dates d'horloge système. |

## Verification

**Commands:**
- `npx jest src/features/sessions` -- expected: vert.
- `npm test` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.

**Manual checks (if no CLI):**
- iPhone (J2, Hermann) : 375 et 402, Dynamic Type, VoiceOver.
