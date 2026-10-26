---
title: 'A2.1 — Feuille des paramètres MFN'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '773b0b73c1a5e0388ef3ee7a69c58e152518c5b7'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-A2-context.md'
  - '{project-root}/src/features/activities/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La Feuille des paramètres (CE-UI-10) ignore encore le modèle MFN : la croix reste indisponible à deux phases alors que D-438 permet 2 → Sans, la structure des phases reste modifiable dans une occurrence de Séance (CE-UI-10 ch13 l.1128, l.1163 ; MFN-09 ; D-437 ch13 l.1521), « Durée d'une série » affiche une somme partielle tant qu'une durée manque, et l'éditeur ouvre la Feuille avec max + 1 au lieu du compteur de phases du Mouvement (report A1.2).

**Approach:** Interface et domaine du brouillon seulement : croix active dès deux phases (domaine A1.1 déjà prêt) ; mode « structure verrouillée » de la Feuille (Avec/Sans, nombre, croix, glisser, libellé indisponibles, durées modifiables) demandé par l'éditeur d'occurrence ; « Durée d'une série » à « — » (Cible `UNSET`) tant qu'une durée manque (D-384, convention des données manquantes) ; compteur `nextPhaseId` du Mouvement exposé par la lecture d'une définition et transmis à la Feuille.

## Boundaries & Constraints

**Always:** D-438, MFN-02, MFN-08, MFN-09, CE-UI-10 ; aucune durée inventée ; une durée vide ou nulle conserve sa phase et rend ✓ indisponible (comportement A1.1 conservé) ; états graphiques existants seulement (indisponible `UNSELECTED_OPACITY`, à renseigner `dangerSurface`), aucun composant ni texte d'interface nouveau ; état verrouillé `NON VÉRIFIABLE` (aucune frame Figma) ; garde-fous zéro `ScrollView` iOS intacts ; trois contrôles verts.

**Never:** contenu partagé, crayon, dialogue d'identité, étape de complétion (A2.2) ; recherche et suggestions (A2.3) ; signalement d'un frère incomplet à l'insertion en Séance ou au Catalogue (A4.1, CE-T03-07) ; migration, schéma, `tokens.ts`, `package.json`, `app.json`, `.github/`, `main`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Croix à 2 (Catalogue) | [A 6 s, B 3 s], croix de B | Sans, « Durée d'une série » 6 s modifiable, « Phase supprimée — Annuler » ; Annuler restitue les deux phases | durée restante vide → Cible « — » |
| Phase unique relue | [A 9 s] | croix indisponible (Sans reste le geste) | N/A |
| Durée manquante | [9 s, —] | « Durée d'une série » « — » à renseigner, cellule « — » rouge pâle, Durée de l'exercice « — », ✓ indisponible, phases conservées | N/A |
| Avec → Sans, durée manquante | [9 s, —] puis Sans | Cible « — » (aucune somme partielle) | N/A |
| Occurrence avec phases | copie avec filiation, [A 6, B 3] | Sans, nombre, croix, poignées, libellés indisponibles ; chevron du tableau actif ; durées modifiables, D redérivée | durée vidée → ✓ indisponible |
| Occurrence sans phase | copie avec filiation, sans phase | Avec indisponible | N/A |
| Création locale | occurrence sans filiation (nouvelle, ou non enregistrée) | structure modifiable (exception MFN-09) | N/A |
| Compteur du Mouvement | structure [1,2,3], compteur 5, Feuille : retrait de 3, ✓, réouverture, + | nouvelle phase d'identité 5 | compteur absent → max + 1 |
| Frère incomplet ouvert | définition `missingPhaseIds [3]` | carte « Paramètres à compléter. », Terminer inactif ; Feuille : cellule 3 « — », D « — », ✓ indisponible | N/A |

</frozen-after-approval>

## Code Map

- `src/domain/activities/ExecutionParametersDraft.ts` -- `deriveSeriesDuration` (l.~929) : `UNSET` dès qu'une durée manque (`null` ou < 1) ; `setWorkPhasesEnabled(false)` garde la dernière D (donc « — ») ; `removeWorkPhase` (2 → Sans) et `openSheetDraft({ nextPhaseId })` déjà prêts (A1.1).
- `src/features/activities/WorkPhasesTable.tsx` -- croix : `disabled = locked || count < controlMinCount` ; prop `structureLocked` (croix et poignées indisponibles).
- `src/features/activities/sheetTable.tsx` -- `DraggableRow` : prop optionnelle `movable` (défaut vrai) ; faux : aucun répondeur, aucune action accessible, état `disabled`, poignée `unselected`. Rendu par défaut inchangé.
- `src/features/activities/ExecutionParametersSheet.tsx` -- props `phaseStructureLocked`, `nextPhaseId` (→ `openSheetDraft`) ; `phasesControl` (l.~1764 : Avec / Sans indisponibles sous verrou), `PhaseCountField` (l.~3033 : `disabled` transmis à `SegmentCountField`, chevron actif), `choosePhases` (l.~825 : sous verrou, re-choisir Avec range la surface comme `chooseSeriesType` sous N hérité, l.~1543), `phaseCell` (l.~1710 : libellé statique sous verrou), commentaires l.276-293, l.800-805.
- `src/features/activities/ActivityEditorForm.tsx` -- props `phaseStructureLocked`, `nextPhaseId` transmises à la Feuille (l.~602).
- `src/domain/activities/ActivityDefinition.ts` -- type lu : `movementNextPhaseId?: number` (compteur du Mouvement).
- `src/infrastructure/database/repositories/SqliteActivityDefinitionRepository.ts` -- `mapActivityDefinitionRow` (l.~429) : `movementNextPhaseId: movement.nextPhaseId`.
- `src/features/sessions/ExerciseScreen.tsx` -- Catalogue : `nextPhaseId` relu de la définition ; occurrence : `OpenedOccurrence.phaseStructureLocked` = filiation non vide (`sourceMovementId.trim()`), figé à l'ouverture.
- Tests à adapter (règle nouvelle, non affaiblis) : `ExecutionParametersSheet.phases.test.tsx` l.334 (croix à 2), l.172 et l.437-459 (D partielle → « — ») ; `ExecutionParametersDraft.test.ts` l.1348.
- Ne pas toucher : `SegmentCountField` (déjà `disabled`), `KeyboardField`, `useSheetKeyboard` (navigation des durées seules inchangée), `validateForSave`.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/activities/ExecutionParametersDraft.ts` -- D `UNSET` si une durée manque -- D-384, MFN-02.
- [x] `src/domain/activities/ActivityDefinition.ts`, `SqliteActivityDefinitionRepository.ts` -- exposer le compteur -- MFN/AC30.
- [x] `src/features/activities/sheetTable.tsx`, `WorkPhasesTable.tsx`, `ExecutionParametersSheet.tsx`, `ActivityEditorForm.tsx` -- croix à 2, verrou, compteur.
- [x] `src/features/sessions/ExerciseScreen.tsx` -- verrou d'occurrence et compteur.
- [x] Tests : `ExecutionParametersSheet.mfn.a21.test.tsx` (matrice), adaptations listées, domaine (`deriveSeriesDuration`), repository (`movementNextPhaseId` relu), écran (`ExerciseScreen` : verrou d'une occurrence avec filiation, pas pour une création locale).
- [x] `src/features/activities/README.md`, `src/domain/README.md` -- relevé A2.1.

**Acceptance Criteria:**
- Given une occurrence copiée du Catalogue avec phases, when sa Feuille est ouverte, then aucune commande ne change la structure et ses durées restent modifiables.
- Given l'application, when les trois contrôles s'exécutent, then ils sont verts.

## Design Notes

- **« — » plutôt que somme partielle :** CE-UI-10 l.1231 (ch13, ligne 11 du tableau) et D-384 : donnée nécessaire manquante = « — » ; ch11 l.187 « aucune cible inventée ». Le marquage rouge pâle de D suit l'état existant « deux phases à renseigner » (test PRE5-2.8/AC7).
- **✓ avec durée vide :** CE-UI-10 l.1163 « À ✓, une durée … reste à renseigner, sans supprimer la phase » lu avec ch11 l.187 (« interdire ✓ ») : ✓ reste indisponible (A1.1).
- **Copie d'une occurrence locale non enregistrée** (`pendingLocalMovement`) : porte une filiation, donc verrouillée (duplication, pas création directe, MFN-09).

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

- Implémentation conduite directement par l'agent de la story (investigation dans son contexte, comme A1.3) ; revues du step-04 confiées à trois sous-agents indépendants.
- Spec au-delà de 1 600 jetons : conservée entière (pré-approbation de Hermann, pas de découpage).
- **Domaine :** `deriveSeriesDuration` rend `UNSET` dès qu'une durée manque ; `openSheetDraft` ouvre D à renseigner quand une durée lue est non renseignée (sinon un frère dont la Cible lue serait chiffrée afficherait une valeur contredite par la validation). Report `deferred-work.md` « total partiel du brouillon » (A1.1) tranché : « — ».
- **Compteur :** `ActivityDefinition.movementNextPhaseId?` (type lu) rempli par `mapActivityDefinitionRow` ; report A1.2 « max + 1 » résolu pour l'édition Catalogue.
- **Verrou :** `DraggableRow` reçoit `movable` (défaut vrai, arbre antérieur inchangé) ; libellé verrouillé = `TextInput editable={false}` (primitive native, même style) ; aucune chaîne de lexique nouvelle ; garde-fous zéro `ScrollView` iOS intacts.
- **Tests adaptés à la règle nouvelle, non affaiblis :** `ExecutionParametersSheet.phases.test.tsx` (croix à 2 disponible ; D « — » au lieu des sommes partielles 9 s, 3 s, 6 s, avec marquage et indice asserts), `ExecutionParametersDraft.test.ts` (D `UNSET` ; listes de violations complétées de `target` `REQUIRED`), `useSheetKeyboard.test.ts` (D `UNSET` après durée vidée) ; `mfnPersistence.a12.test.ts` complété (compteur relu).
- **Frère incomplet à l'insertion en Séance :** hors CE-UI-10 (CE-T03-07, sélection) → A4.1 (`deferred-work.md`). Aucun parcours d'interface ne crée encore de frère incomplet (complétion passée : A2.2).
- **Points renvoyés à Hermann (option conservatrice appliquée) :**
  1. « Durée d'une série » « — » à renseigner (rouge pâle) dès qu'une durée manque, y compris juste après Avec (avant : somme partielle, PRE5-2.1/AC2 « D = 30 s »). Sources : ch13 `13 – Contrats d’écran.md:1231` (ligne 11 « donnée nécessaire au calcul manquante : — », D-384), ch11 `11 – API fonctionnelles.md:187` (« aucune cible inventée »), ch07 l.763 (D-384, rédigée pour la ligne Total). Alternative : garder la somme partielle affichée.
  2. Avec puis Sans immédiatement (ou avec une durée manquante) : la durée de série devient « — » (avant : somme partielle, donc la valeur d'origine). Sources : matrice de cette spec, A1.3 point 1 (frère incomplet → durée à renseigner). Alternative : somme des durées connues. La croix (2 → 1) conserve la durée restante.
  3. ✓ indisponible tant qu'une durée manque (lecture de ch13 l.1163 « À ✓ … reste à renseigner » avec ch11 l.187 « interdire ✓ ») ; alternative : ✓ disponible, `Terminer` bloqué.
  4. Copie d'une occurrence locale non enregistrée (`pendingLocalMovement`) : verrouillée, sa source restant modifiable (exception MFN-09, ch10 l.444-446). Alternative : copie modifiable jusqu'au premier enregistrement.
  5. Indice d'accessibilité du verrou (« structure figée dans une séance ») : aucun texte au lexique (aucun libellé documenté) ; seul l'état `disabled` est annoncé.
- Contrôles finaux : `npm test -- --maxWorkers=2` 158 suites, 4 203 tests verts ; `npx tsc --noEmit` vert ; `npm run lint` vert. Avant revue : 158 suites, 4 202 tests.

## Spec Change Log

## Review Triage Log

Passe 1 (24/10/2026) : trois relectures (aveugle, cas limites, lacunes de vérification).

| # | Source | Constat | Verdict | Preuve / route |
|---|---|---|---|---|
| 1 | blind | Occurrence enregistrée sans filiation restée modifiable | false | Toute occurrence enregistrée reçoit une filiation (`resolveNewOccurrenceFiliation` ; orpheline = identifiant de l'occurrence, `mfnPersistence.a12.test.ts` « occurrence sans Catégorie ») ; rejeté |
| 2 | blind + edge | Copie d'une occurrence locale en attente verrouillée, source modifiable : structures divergentes pour un même Mouvement futur | medium | Préexistant (avant A2.1 les deux étaient modifiables, divergence plus large) ; defer + point 4 renvoyé à Hermann |
| 3 | blind + verification-gap | D « — » dès l'activation, Avec → Sans perd la durée : changement d'un état PRE-5 | low | Comportement voulu par la matrice gelée (« Avec → Sans, durée manquante ») ; points 1 et 2 renvoyés à Hermann ; rejeté |
| 4 | blind + edge | Verrou sans explication accessible (suffixe, indice) | low | Texte d'interface non documenté (aucune invention, RM-092) ; état `disabled` annoncé ; defer (point 5 à Hermann) |
| 5 | blind | Prédicat « durée manquante » différent à l'ouverture (`null`) et à la dérivation (`null` ou < 1) | false | L'ouverture convertit < 1 en `null` juste avant (`openSheetDraft`) : même ensemble ; rejeté |
| 6 | blind + verification-gap | Branche verrouillée de `choosePhases` (saisie appliquée, surface rangée) non observée | medium | Gap pré-vérifié ; patch (test « re-choisir Avec pendant une saisie ») |
| 7 | blind | Glisser verrouillé partiellement asserté (`onMoveShouldSetResponder`) | low | Correction directe ; patch (assertion) |
| 8 | blind | Commentaires « D-438 remplace QR-1 » : D-438 nomme D-371 et D-432 | low | Vérifié ch07 l.15 ; patch (commentaires) |
| 9 | blind | Compteur non transmis à une création sur geste repris (`SAME_MOVEMENT`, `VARIANT`) | low | Parcours d'interface inexistant avant A2.3 ; defer (A2.3) |
| 10 | blind | Seuil de première utilisation non testé de bout en bout | low | Couvert par la filiation relue (#1) et le test du verrou ; rejeté |
| 11 | edge | `lastNumberById` garde une Cible ancienne après D `UNSET` (Sans, À l'échec, À l'objectif) | low | Mémoire « À l'objectif » préexistante d'une valeur saisie par l'utilisateur, non inventée ; rejeté |
