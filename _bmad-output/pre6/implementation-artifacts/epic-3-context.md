# Epic 3 Context: Circuit de Tours et de Séries (B, C)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Donner à la Composition l'interface du Circuit unique de séance libre : en-tête (titre, durée du Circuit, œil, compteur 1..99 révélé au toucher, pastille d'unité), choix de nature Tours / Séries avec confirmation de perte, N hérité dans la Feuille des paramètres pour un exercice d'un Circuit de Séries, et modales « Volumes du circuit » en lecture seule. Toute la logique (nature, compte, réserve, conversion, entrée / sortie, volumes, durées) existe déjà dans le domaine (epic 1) : cet epic la raccorde à l'écran, sans nouvelle règle.

## Stories

- Story 3.1: En-tête du Circuit et compteur
- Story 3.2: Choix de nature et confirmation de perte
- Story 3.3: N hérité dans la Feuille des paramètres
- Story 3.4: Modales « Volumes du circuit »

## Requirements & Constraints

- Circuit = groupe, Tour = répétition ; un seul Circuit. Compte 1..99, défaut 1. L'unité affichée se déduit de la nature (« tour(s) » / « série(s) »).
- CIR-10 : chiffre → − / + révélés ; pastille d'unité → choix de nature ; œil permanent sur la ligne du titre → grille des volumes ; un seul champ numérique actif à la fois. Toucher la valeur ou ailleurs referme (RC-4).
- Diminution de N sans message (réserve en Séries) ; augmentation : restauration puis préremplissage. Conversion Tours → Séries avec perte : confirmation atomique (Annuler restitue tout) ; Séries → Tours : sans message.
- Sous le titre du Circuit : sa seule durée (D-382, D-390), « — min » à vide (D-399), préfixes ≈ / ≥.
- Feuille : en Circuit de Séries, le nombre de séries est imposé (état indisponible existant, aucune modification locale) ; régime et autres paramètres libres.
- Volumes (CE-CIR-03) : lecture seule, colonnes S1..Smax, « — » pour une série inexistante (jamais 0), ✓ pour une cible À l'échec, mode identifiable, réserve exclue ; fermer sans modification.
- Aucune règle inventée ; les valeurs des captures Figma ne sont pas des règles. Vérification visuelle et VoiceOver sur iPhone par Hermann (J2).

## Technical Decisions

- Domaine disponible (`src/domain/sessions/circuit.ts`) : `circuitBoundOf`, `prepareNatureChange` / `applyNatureChange`, `setCircuitCount`, `prepareEnterCircuit` / `enterCircuit` / `exitCircuit`, `circuitVolumes`, `expandComposition` ; durées par nature (`computeStructuredSessionDuration`) ; `settleCircuitMembership` (`circuitMembership.ts`).
- AD-41 : composants séparés dans `src/features/sessions/` (`CircuitHeader`, `CircuitNaturePopover`, `CircuitVolumesSheet`) ; `CompositionScreen.tsx` ne fait qu'orchestrer ; `TourCard` et le `NumberWheelPicker` du compte sont retirés.
- AD-42 : réutiliser `InlineStepper` (`src/shared/ui/ProfileStepper.tsx`, `appearance="bare"`, `accessory`) et le mécanisme de stepper révélé de la Feuille PRE-5 ; popover / panneau ancré existant (`AnchoredPanel`) ou primitive native si elle s'impose ; `DecisionDialog` ; feuille basse (`Modal` + `SheetMotion`) ; icône œil depuis Figma dans `KodjoIcon`.
- AD-44 : `ExerciseScreen` → `ActivityEditorForm` → `openSheetDraft(parent, { inheritedSeriesCount })` (option existante).
- Report de l'epic 1 : le changement de N à l'écran passe par `setCircuitCount` ; la Feuille vide la réserve de Circuit d'une occurrence modifiée (story 3.3).
- Textes dans `fr.ts`, jetons de `tokens.ts` (verrouillé), constantes locales nommées sinon.

## Cross-Story Dependencies

- 3.1 → 3.2 → 3.3 ; 3.4 en parallèle après 3.1 (œil dans l'en-tête).
- Jalon J2 après l'epic.
