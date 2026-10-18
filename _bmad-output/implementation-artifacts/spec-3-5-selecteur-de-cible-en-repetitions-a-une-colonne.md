---
title: 'Story 3.5 — Sélecteur de cible en Répétitions à une colonne'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '63f12693b2ad2cb03edf17eac9e2175470402a77'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-3.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-3-4-selecteur-de-cible-en-duree-option-echec-et-grise-manipulable.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** En Répétitions, la Cible commune de la Feuille passe encore par un `InlineStepper` permanent (1..100). Une Cible `FAILURE` s'affiche en texte (`FailureTargetText`) sans moyen d'y revenir ni d'en sortir depuis la ligne. La roulette `NumberWheelPicker` existe, bornée à 1..99 par `WHEEL_NUMBER_MAX`, sans ligne d'échec.

**Approach:** Implémenter la **story 3.5 (AC1 à AC8, `epics-parts/epic-3.md`)** avec Q8, Q14 et Q41 (cohérence du 2026-10-17). La ligne `Nombre de répétitions` affiche une pastille (`ValuePill`, comme la Cible Durée en 3.4) qui ouvre `NumberWheelPicker` dans `AnchoredPanel`, sous le champ, aligné à droite, sans flèche. `NumberWheelPicker` est **étendu** par des props optionnelles : des bornes (1..100) et une `failureOption` typée qui ajoute une ligne de tête « Aucune répétition, à l’échec » **dans la roue native elle-même** (une seule colonne). Réutiliser `selectorOpeningPosition("REPETITIONS", …)` et `nearestGridValue` livrés en 3.4.

## Boundaries & Constraints

**Always:**
- `NumberWheelPicker` : props optionnelles seulement. Sans elles, le comportement actuel (1..99) est strictement inchangé pour tous les usages existants (Composition, roulette des tours, etc.). `WHEEL_NUMBER_MAX` n'est pas modifié.
- Avec `failureOption`, la colonne unique de la roue native contient, dans l'ordre : la ligne de tête (libellé du lexique), puis les entiers des bornes en ordre croissant. La roue placée sur la ligne de tête choisit l'échec ; placée sur un nombre, ce nombre (Q14). **Aucun grisé, aucun filet, aucun bloc séparé ajoutés** : la sélection est rendue par la roue native (Q14). L'échec sort par un rappel typé `{ kind: "FAILURE" }` (type du domaine), jamais un nombre ni une sentinelle ; le rappel numérique n'est jamais appelé pour l'échec. La représentation interne de la ligne de tête (tag du `Picker` SwiftUI, index Legacy) ne fuit jamais hors du composant.
- Aucune valeur 0, 101 ou fractionnaire n'est proposée ni ne sort ; 1 et 100 atteignables. `validateDisabled` existe déjà dans `PickerToolbar` ; il n'y a pas de position invalide en Répétitions, donc le ✓ reste disponible (ne pas inventer de cas).
- Ouverture : `selectorOpeningPosition("REPETITIONS", target)` — `NUMBER 12` → 12 ; `FAILURE` → ligne de tête ; ancienne 150 → 100 ; `UNSET` → 1 (Q25). La ligne garde sa valeur d'origine jusqu'au ✓.
- Feuille : la pastille affiche `à l’échec`, `—` sur `#FFF1F0` (Q35, invalide, avec son indice) ou le nombre formaté (`repetitionsLabel` existant). La roue s'ouvre dans `AnchoredPanel` exactement comme la roue de la Cible Durée (même placement, même surface unique `sheetSurface`, toucher extérieur = fermeture sans appliquer). ✓ → `setUniformTarget` dans le Brouillon de la Feuille ; ✕ ferme sans rien changer ; l'Éditeur ne change qu'au ✓ de la Feuille (Q12). L'`InlineStepper` de la Cible Répétitions et son usage de `FailureTargetText` sur cette ligne sont retirés (`FailureTargetText` reste s'il sert encore aux cellules du tableau, 3.6).
- Accessibilité (H13) : la ligne de tête est annoncée avec son état sélectionné ou non ; un nombre est annoncé avec son unité (lexique). Sur iOS, s'appuyer sur ce que la primitive native annonce et compléter seulement par les libellés d'accessibilité des éléments ; en Legacy, valeurs courantes comme en 3.4.
- Hors iOS, la roulette `Legacy*` porte la même ligne de tête, les mêmes bornes et les mêmes transitions, avec une parité testée.
- Garde-fous zéro `ScrollView` (`DurationWheelPicker.test.tsx:378`, `:619` ; `NumberWheelPicker.test.tsx:267`) intacts et verts. Aucun jeton modifié. Textes par le lexique : « Aucune répétition, à l’échec » et annonces.

**Never:**
- Ni remplacement ni réimplémentation de la roue ou de `PickerToolbar` ; pas de seconde colonne ; aucune sentinelle numérique pour l'échec ; aucune haptique ajoutée.
- L'ouverture depuis une cellule du tableau relève de 3.6 ; les libellés déjà traités en 3.3 ne bougent pas.
- Ne pas retravailler l'ergonomie validée (panneaux, animations, sélection, 44 pt).

</frozen-after-approval>

## Code Map

- `src/features/sessions/NumberWheelPicker.tsx` : branche iOS (`Host` + `Picker` SwiftUI, l.~101-180), `PickerToolbar` (l. 184, `validateDisabled` déjà présent), branche `Legacy*` (l.~247), `NumberWheelPickerProps` (l. 89).
- `src/features/sessions/wheelPickerMath.ts` : helpers partagés.
- `src/domain/activities/ExecutionParameters.ts` : `EXECUTION_BOUNDS.repetitionTarget` (1..100), `nearestGridValue`, `selectorOpeningPosition` (3.4).
- `src/features/activities/ExecutionParametersSheet.tsx` : ligne Répétitions (l.~1200-1230, `InlineStepper`), modèle de la Cible Durée (`uniformDurationPill`, `uniformDurationWheel`, l.~755-800), `AnchoredPanel`, `TARGET_SELECTOR`, `sheetSurface`.
- `src/shared/i18n/index.ts` : `durationFailureOption` (l. 100) → ajouter l'équivalent Répétitions.
- `src/features/activities/testing/executionSheetActions.ts` : helpers de test à étendre si utile.
- Tests : `NumberWheelPicker.test.tsx` (dont garde-fou l. 267), `ExecutionParametersSheet.test.tsx`, `ExecutionParameters.test.ts`.
- `docs/preparation/PRE-4/bmad/recette-iphone.md` §4.3 : ajouter R-3.5-xx.

## Tasks & Acceptance

**Execution:**
- [x] `NumberWheelPicker` : props optionnelles (bornes, `failureOption`), ligne de tête dans la roue native (iOS) et Legacy, parité.
- [x] Feuille : pastille + roue dans `AnchoredPanel`, ouverture normalisée, ✓ et ✕ ; retrait de l'`InlineStepper` de la Cible Répétitions.
- [x] Lexique : libellé de la ligne de tête et annonces.
- [x] Tests `PRE4-3.5/AC1` à `AC8` ; usages existants de `NumberWheelPicker` inchangés.
- [x] Recette `recette-iphone.md` §4.3 : R-3.5-01 et suivants (ouverture sur 12 / échec / 150 ; choix de la ligne de tête ; ✕ ; VoiceOver).
- [x] READMEs de `src/features/sessions/` et `src/features/activities/` à jour.

**Acceptance Criteria:**
- Given la story 3.5 et les décisions Q8, Q14, Q41, when elle est livrée, then chacun de ses critères AC1 à AC8 est vérifié par un test nommé ; les usages existants de `NumberWheelPicker` sont inchangés ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

**Choix d'intégration.**
- `NumberWheelPicker` : trois props optionnelles, même patron que 3.4. `targetBounds` (`WheelTargetBounds`, 1..100) ; `failureOption` (`label`, `initiallySelected`, `onValidateFailure(target: FailureSeriesTarget)`), qui exige `targetBounds` (union de props) ; `valueAccessibilityLabel` (nombre avec son unité). Sans elles : 1..99, colonne 96, surface 144, `accessibilityValue` Legacy figée à l'ouverture, comme avant.
- Ligne de tête iOS : premier `Text` du même `Picker` SwiftUI, tag chaîne `"failure"` (le pont `@expo/ui` accepte des tags `String` et `Double` dans la même liste : `PickerView.swift`, `selection: AnyHashable`). Le tag reste interne : `onSelectionChange` le convertit en brouillon, le ✓ appelle `onValidateFailure({ kind: "FAILURE" })` et jamais `onValidate`. Un tag reçu inconnu est ignoré ; un nombre reçu est borné et arrondi (0 → 1, 101 → 100, 12,4 → 12), par défense : la liste ne propose que 1..100. Legacy : index 0 = ligne de tête, nombres à partir de 1 ; mêmes transitions (défilement, appui, actions d'accessibilité).
- Largeur (AC7, P33) : avec `failureOption`, la surface prend la largeur du Sélecteur Durée (`dimensions.wheelPicker.durationWidth`, 330) et la colonne native une largeur explicite de 330 − 2 × 12 = 306, pour que « Aucune répétition, à l’échec » tienne. La largeur reste explicite (`frame`), le `Host` garde `matchContents` comme avant. Valeurs d'intégration, sans relevé Figma (ligne de tête `NON VÉRIFIABLE`) ; à juger sur iPhone (R-3.5-01).
- Accessibilité : iOS, `accessibilityLabel` sur chaque élément (« 12 répétitions », libellé de tête), l'état est celui que la roue native annonce. Legacy (sous `targetBounds` seulement) : ligne de tête avec `accessibilityState.selected`, `accessibilityValue` courante (`{ text: libellé }` sur la tête, `{ min, max, now, text }` sur un nombre). Le haptique existant à chaque changement de ligne s'applique aussi à la ligne de tête ; aucune haptique ajoutée.
- Feuille : nouveau `PanelControl` `uniformRepetitions` (même `testID` de panneau et de conteneur que la Durée : un seul Mode affiché à la fois) ; pastille `execution-sheet-target-value` ; ouverture par `selectorOpeningPosition("REPETITIONS", …)` ; roue `testID="execution-sheet-repetitions-wheel"`. `InlineStepper` et `FailureTargetText` retirés de la ligne commune ; `FailureTargetText` reste pour les cellules (3.6). La roue n'est calculée que lorsque la ligne Répétitions est affichée (comme `totalWheel`). Libellé de la ligne : « Nombre de répétitions » (H14, voir Spec Change Log) ; la clé `repetitionsTarget` n'a pas d'autre consommateur (l'en-tête de colonne du tableau est `columns.REPETITIONS`).
- Entrées invalides : `value` non finie à l'ouverture → borne basse ; `targetBounds` non entières ou `min > max` → `RangeError` (seule une entrée invalide lève). `failureOption` est fixée au montage (la Feuille démonte le panneau au changement de Mode) ; garde au ✓ seulement : tête sans `failureOption` → `onValidate(range.min)`.
- Legacy : surface élargie à 330 avec `failureOption`, libellé de tête sur une ligne sans `adjustsFontSizeToFit` (pas de rétrécissement silencieux, P33).
- Garde-fous zéro `ScrollView`, par nom de test (les n° de ligne de la section figée ont bougé) : `NumberWheelPicker.test.tsx` « actually uses the native SwiftUI Picker primitive on iOS, never a ScrollView fallback » ; `DurationWheelPicker.test.tsx` « REWORK06 — actually uses the native SwiftUI Picker primitive on iOS, never a ScrollView fallback » et « R-1/native-delegation — iOS délègue à SwiftUI Picker(.wheel) avec la borne Exercice 5999 s ; aucun ScrollView de substitution ». Intacts et verts. La section figée n'a pas été modifiée.
- Lexique : `repetitionsFailureOption`, `repetitionsSpokenSingular` / `repetitionsSpokenPlural` (`strings.executionParameters.sheet`).
- Tests existants réécrits parce qu'ils décrivaient le stepper retiré (AC2) : `PRE4-1.1/AC22` (Feuille, Éditeur), `PRE4-1.1/AC23` (Éditeur, écran Exercice : ✓ du Sélecteur sans tourner applique 1, au lieu du +), `PRE4-3.1/AC4` (iOS, pastille au lieu du stepper), `PRE4-3.3/AC7` (ouvrir la pastille ferme la surface ouverte). Le helper `renderProps` de `NumberWheelPicker.test.tsx` reçoit la même conversion de type que celui de `DurationWheelPicker.test.tsx` (union de props).

## Spec Change Log

- 2026-10-17 — (a) AC3 : deux rappels, `onValidate(number)` et `onValidateFailure({ kind: "FAILURE" })`, au lieu d'un rappel unique recevant une `SeriesTarget`, par cohérence avec `DurationWheelPicker` (3.4). AD-7 est respecté : aucune sentinelle numérique ne sort, le tag de tête reste interne.
- 2026-10-17 — (b) H14 appliqué (décision de Claude, révisable par Hermann) : la ligne commune s'appelle « Nombre de répétitions », symétrique de « Durée d’une série » ; `repetitionsTarget` modifiée dans le lexique, tests adaptés.
- 2026-10-17 — (c) Largeurs 330 (surface, iOS et Legacy) et 306 (colonne native) : choix d'intégration, `NON VÉRIFIABLE` sur Figma (aucun relevé de la variante Répétitions), à valider par Hermann sur iPhone (R-3.5-01).

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). Tous les correctifs appliqués par l'implémenteur ; trois contrôles verts (112 suites, 2 611 tests).

| Constat | Verdict | Route |
|---|---|---|
| V1 — placement du panneau Répétitions sous sa ligne non testé | medium | patch (test `PRE4-3.5/AC1 — iOS : panneau juste sous le champ…`) |
| B1 — libellé « Répétitions » au lieu de « Nombre de répétitions » (AC1, H14) | medium | patch (H14 appliqué, décision de Claude révisable par Hermann ; Spec Change Log) |
| B2 — deux rappels au lieu d'un rappel `SeriesTarget` (AC3) | low | patch (consigné ; cohérence 3.4, AD-7 respecté) |
| B3 — R-3.5-02 « 100 en haut » | low | patch (« 100 en bas ») |
| B4 — n° de ligne des garde-fous périmés | low | patch (noms de tests dans les Implementation Notes) ; AGENTS.md et epic-3.md hors périmètre, laissés |
| B5 — Legacy : ligne de tête rétrécie (`adjustsFontSizeToFit`), largeur non traitée | medium | patch (surface 330, sans rétrécissement, testé) |
| B6/B7 — AC8 sans nouvelles props incomplet (iOS) et absent (Legacy) | medium | patch |
| B8 — assertions négatives `queryByText` inopérantes (AC5 Feuille) | low | patch (liste `props.text` + contrôle positif) |
| B9 — assertions faibles AC3 composant, AC7 Feuille | low | patch |
| B10/E2 — `value` non fini ; bornes non entières ou inversées | low | patch (borne basse ; `RangeError`) |
| B11 — traçabilité AC7/AC8 du test de largeur, journaux vides | low | patch |
| B12 — roue Répétitions calculée en Durée | low | patch (calcul conditionnel) |
| E1 — `failureOption` modifiée après montage | low | patch (contrat documenté + garde `range.min`) |
| B10b — repli `?? range.min` de `numberAt` en Legacy | low | rejeté (index toujours dans la liste ; repli défensif sans effet observable) |


## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
