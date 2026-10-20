---
title: 'Story 3.2 — Choix de nature et confirmation de perte'
type: 'feature'
created: '2026-10-21'
status: 'done'
baseline_commit: '716a45505dcc5134038f1d5b40cf60a2ec0d3587'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/pre6/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La pastille d'unité de l'en-tête du Circuit (story 3.1) est sans action : l'utilisateur ne peut pas choisir la nature Tours / Séries (CE-CIR-01), ni confirmer une conversion avec perte (CE-CIR-02).

**Approach:** Toucher la pastille ouvre le choix de nature avec une primitive native iOS (même mécanisme que le menu « Enchaînement » de la Feuille PRE-5 : `Menu` + `Button` de `@expo/ui/swift-ui`, coche sur l'option courante) ; le choix passe par `prepareNatureChange` / `applyNatureChange` (story 1.4) et, en cas de perte, par le dialogue de décision existant.

## Boundaries & Constraints

**Always:**
- Déclencheur : la pastille d'unité seule (pas le chiffre) ; noms accessibles distincts pour le chiffre (réglage du compte) et la pastille (« Nature du circuit », valeur « Circuit de tours » / « Circuit de séries »).
- Deux options (CE-CIR-01, `8328:34805`), libellés et sous-textes : « Circuit de tours » — « les séries d'un exercice s'enchaînent » ; « Circuit de séries » — « une série de chaque exercice par passage ». Nature courante identifiable (coche native). Aucune troisième option.
- iOS : primitive native (`Menu` SwiftUI hébergé, comme `SideSequenceMenu` / Enchaînement de `ExecutionParametersSheet.tsx`) ; sous-texte en sous-titre si la primitive le permet, sinon dans le libellé accessible (comme l'Enchaînement). Android et web : `AnchoredPanel` existant ancré à la pastille avec les deux options. Fermeture sans choix : aucune mutation.
- Même nature : rien. Changement sans perte (`prepareNatureChange(...).losses` vide) : `applyNatureChange` immédiat, sans message ; le nombre affiché ne change pas ; régimes conservés.
- Changement avec perte (Tours → Séries, au moins un exercice au-delà de N) : dialogue (`8328:34964`, réutiliser le composant de dialogue de perte de la story 2.3) — titre « Passer en circuit de séries ? », message « Tous les exercices auront {N} séries. Les séries au-delà de la {N-ième} seront supprimées, avec les valeurs qu'elles portent. » (accord : « 1 série », « 1re »). Annuler : nature, compte et valeurs inchangés. Confirmer : recalcule la perte et applique `applyNatureChange` sur le brouillon COURANT (mise à jour fonctionnelle), une seule fois même en cas de double appui. Le voile ne confirme pas.
- Séries → Tours : sans message, comptes et valeurs conservés.
- Ouvrir le choix de nature ferme le compteur révélé (un seul contrôle actif) ; focus rendu à la pastille à la fermeture (VoiceOver).
- La durée du Circuit, la durée de séance et l'unité de la pastille suivent la nature.

**Never:**
- Pas de mécanisme de menu réimplémenté sur iOS (règle des primitives natives, AGENTS.md).
- Ne pas modifier les fonctions de `circuit.ts` sauf correctif nécessaire et testé.
- AC3 du plan (ajout depuis le Catalogue avec perte) est déjà livré par la story 2.3 : ne pas le refaire.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tours → Séries, < N | N = 4, A 3 séries | A 4 séries, pas de dialogue | — |
| Tours → Séries, = N | N = 3, A 3 séries | inchangé, nature Séries | — |
| Tours → Séries, > N | N = 2, A 3 séries variables | dialogue ; Annuler : rien ; Confirmer : A 2 séries, nature Séries | — |
| Séries → Tours | N = 3 | nature Tours, valeurs identiques | — |
| Même nature | Tours → Tours | rien | — |
| Double appui sur Confirmer | — | une seule conversion | — |
| Brouillon modifié pendant le dialogue | — | perte recalculée sur l'état courant | — |

</frozen-after-approval>

## Code Map

- `src/features/sessions/CircuitHeader.tsx` -- pastille d'unité (story 3.1) : ajouter le déclencheur.
- `src/features/activities/ExecutionParametersSheet.tsx:~3020-3052` -- modèle `Menu` / `SwiftUIButton` / `RNHostView` / coche `checkmark` ; modificateurs d'accessibilité.
- `src/features/activities/AnchoredPanel.tsx` -- repli Android / web.
- `src/features/sessions/CircuitEntryConfirmModal.tsx` (story 2.3) -- dialogue de perte à réutiliser (paramétrer titre et message).
- `src/domain/sessions/circuit.ts` -- `prepareNatureChange`, `applyNatureChange`.
- `src/features/sessions/CompositionScreen.tsx` -- orchestration (fermeture du compteur, dialogue, `updateDraft` fonctionnel).
- `fr.ts` -- libellés.
- Tests : `CircuitHeader.test.tsx`, `CompositionScreen.test.tsx` (le module `@expo/ui` est déjà simulé pour la Feuille : réutiliser son mock).

## Tasks & Acceptance

**Execution:**
- [x] Choix de nature (composant `CircuitNatureMenu` ou dans `CircuitHeader`) + tests.
- [x] Dialogue de conversion + orchestration + tests (matrice).
- [x] `fr.ts`.

**Acceptance Criteria:**
- Given la suite complète, when `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.
- Given un iPhone, when on touche la pastille, then un menu natif s'ouvre (vérification J2 par Hermann).

## Implementation Notes

- Implémenté par sous-agent (21/10). `CircuitNatureMenu.tsx` (iOS : `Menu` SwiftUI sur le modèle de `SideOrderMenu`, coche native ; sous-textes dans le libellé accessible, `@expo/ui` n'offrant pas de sous-titre avec icône système) ; `CircuitNaturePanel` (Android / web, hébergé dans le contenu défilant) ; dialogue `kind: "NATURE"`.
- Le choix de nature n'est pas atteignable pendant que le compteur est révélé (la pastille fait alors partie du stepper) : refermer d'abord.
- Points J2 (Hermann) : ouverture et taille du menu natif ; sous-textes non visibles sur iOS ; focus VoiceOver rendu à la pastille ; mise en forme du panneau Android / web (choix de l'agent, Figma ne dessine que iOS).
- Vérification : Jest 131 suites / 3521 tests (`--maxWorkers=2`), `tsc` et `lint` sans erreur.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind + edge | Choix abandonné sans message si une perte apparaît entre le rendu et la mise à jour | medium | patch : ouverture de la confirmation. |
| 2 | edge | Dialogue de perte non fermé à l'abandon et à la perte de focus | medium | patch. |
| 3 | blind + edge | Focus : non rendu à la pastille après le dialogue ; renvoyé sous le dialogue sur Android | medium | patch. |
| 4 | edge | Panneau Android hors des limites de son parent (touches perdues) ; rendu avant mesure | medium | patch : hôte au niveau de la section. |
| 5 | edge | Cible tactile de la pastille < 44 | low | patch. |
| 6 | blind + verification-gap | Tests manquants (dialogue NATURE, lexique, durée de séance, plateforme iOS explicite, cible du focus, fermetures Android) | low | patch. |
| 7 | blind | `exerciseCount` requis pour NATURE | low | patch : props discriminées. |
| 8 | blind | Confirmer peut appliquer une perte plus grande que celle affichée | low, rejeté | Le message est recalculé sur le brouillon courant à chaque rendu ; le dialogue modal empêche toute autre modification. |
| 9 | blind | Choix inaccessible pendant que le compteur est révélé | false | Comportement voulu : la pastille fait partie du stepper révélé ; refermer d'abord (un seul contrôle actif). Consigné. |
| 10 | blind | Spec : `SideSequenceMenu` au lieu de `SideOrderMenu` | rejeté | Correctif = édition de la spec ; consigné en notes. |
| 11 | blind | Statuts, dates, notes vides, J2 non tracé | rejeté | Transitions du workflow ; J2 tracé dans `epics.md`. |

## Verification

**Commands:**
- `npx jest src/features/sessions src/features/activities` -- expected: vert.
- `npm test` ; `npx tsc --noEmit` ; `npm run lint` -- expected: vert.
