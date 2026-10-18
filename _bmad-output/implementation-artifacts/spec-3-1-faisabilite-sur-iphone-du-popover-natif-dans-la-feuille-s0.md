---
title: 'Story 3.1 — Faisabilité sur iPhone du Popover natif dans la Feuille (S0)'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '93bbf1ed067eb3896355df8a20988a6e5e087344'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-3.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les popovers de la Feuille et le Sélecteur de cible doivent reposer sur le `Popover` SwiftUI de `@expo/ui` 57.0.13, ancré dans la `Modal` existante. Sa faisabilité sur l'iPhone de Hermann n'est pas établie. Les stories 3.3 à 3.8 en dépendent.

**Approach:** Implémenter le prototype de la **story 3.1 (AC1 à AC7, `epics-parts/epic-3.md`)**, limité à la ligne `Mode d’exécution` et à la ligne de Cible commune en Durée, sur iOS. Le prouver par les tests Jest de l'AC6 et préparer l'essai sur iPhone (R-3.1-00 à 03). Les constats et la décision de l'AC7 sont consignés seulement après le retour de Hermann : **la story reste ouverte jusque-là**.

## Boundaries & Constraints

**Always:**
- Avant tout code, lire la documentation versionnée SDK 57 de `@expo/ui` (`Popover`, `Host`, `RNHostView` ; https://docs.expo.dev/versions/v57.0.0/) et les types de `node_modules/@expo/ui/build/swift-ui/Popover` et `RNHostView`. Vérifier et consigner que `node_modules/@expo/ui/package.json` est en `57.0.13` (AC1, partie locale).
- La Feuille reste la `Modal` React Native existante, en fondu, non remplacée. Le `Popover` est rendu dans un `Host`, placé dans le `ScrollView` de la Feuille, ancré à la ligne.
- **Voie de la roue du prototype : (i)**. `RNHostView` enveloppe la roulette existante `DurationWheelPicker`, sans modification, avec sa `PickerToolbar` ✕/✓, dans `Popover.Content`. La voie (ii) imposerait de restructurer `DurationWheelPicker`, ce que la story exclut. La largeur de la roue est explicite (pas de repli). ✓ applique au Brouillon de la Feuille ; ✕ restaure la valeur d'avant ouverture (Q12).
- Popover de Mode : deux options, `Durée` puis `Répétitions`. Un choix est appliqué au Brouillon de la Feuille seulement (`setMode` existant). Un appui extérieur passe par `onIsPresentedChange(false)`, sans application.
- Android et web : comportement actuel inchangé (`SegmentedControl` en place, roulette en ligne). Le prototype est réservé à `Platform.OS === "ios"`.
- Tous les tests existants de la Feuille restent verts ; un test qui dépend du rendu iOS du Mode ou de la Cible commune est adapté sans affaiblissement, et consigné. Les garde-fous zéro `ScrollView` (`DurationWheelPicker.test.tsx:378`, `:619` ; `NumberWheelPicker.test.tsx:267`) ne sont pas touchés.
- Les textes nouveaux passent par le lexique. Aucun jeton n'est modifié.

**Never:**
- Aucune réimplémentation du popover ou de la roulette : ni `Modal` React Native, ni assemblage de `ScrollView`, ni imitation graphique. Aucune modification du mécanisme de `DurationWheelPicker` ni de `NumberWheelPicker`.
- Aucune montée de version de `@expo/ui`. Aucun build ni EAS. Aucun résultat sur appareil n'est inventé.
- Hors prototype : Côté, Ordre, Régime (3.3), option échec et bornes (3.4, 3.5), roulette de Durée totale (3.7).

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx` :
  - `Modal` (l.~404) et `ScrollView` du corps ;
  - ligne Mode (l.~454-485) : `Row`, `ValuePill`, `ClosingSelector`, `SegmentedControl`, état `openControl === "mode"` ;
  - Cible commune en Durée (l.~560-600) : `uniformDuration`, roulette `DurationWheelPicker` en ligne, garde `target.kind !== "FAILURE"` ;
  - `InlineControl` (l.111) et `toggle`.
- `src/features/sessions/DurationWheelPicker.tsx` : roulette iOS (`Host` + `SwiftUIPicker`) et `PickerToolbar` (l.315). En **lecture seule**.
- `src/domain/activities/ExecutionParametersDraft.ts` : `setMode`, `setUniformTarget`, réutilisés.
- `node_modules/@expo/ui/build/swift-ui/Popover`, `RNHostView.d.ts`, `Host` : API.
- Tests : `src/features/activities/__tests__/ExecutionParametersSheet.test.tsx` (le mock d'`@expo/ui` existant, s'il y en a un, est à étendre pour `Popover` et `RNHostView`) ; nouveau test AC6.
- `docs/preparation/PRE-4/bmad/recette-iphone.md` : ajouter un §4.3 « Feuille des paramètres » avec R-3.1-00 à 03, joués à l'étape 5 du §2 (R-3.1-00) puis à la suite.

## Tasks & Acceptance

**Execution:**
- [x] Version locale d'`@expo/ui` vérifiée et consignée dans les Implementation Notes -- AC1, partie locale.
- [x] `ExecutionParametersSheet.tsx` -- popover de Mode et Sélecteur de la Cible commune (voie i), sur iOS seulement -- AC2 à AC4.
- [x] Test `PRE4-3.1/AC6` -- sous `Platform.OS = "ios"`, aucune `Modal` ni aucun `Pressable` de substitution ne remplace le `Popover` ; parité Android sous Jest -- AC6.
- [x] `recette-iphone.md` §4.3 -- scénarios R-3.1-00 à 03, avec la manière de relever la version native (date du build « Routine Dev » comparée au 2026-08-25, date depuis laquelle le lockfile fixe `@expo/ui` 57.0.13, et `runtimeVersion` 1.1.0) ; résultat « non vérifiable » admis -- AC1, AC5.

**Acceptance Criteria:**
- Given le prototype, when `npm test`, `npx tsc --noEmit` et `npm run lint` s'exécutent, then ils sont verts, le test de l'AC6 compris, sans affaiblir aucun garde-fou.
- Given le prototype commité, when Hermann joue R-3.1-00 à 03 sur l'iPhone, then les constats et la décision de l'AC7 (succès, repli a ou repli b ; voie de la roue) sont consignés dans ce fichier et dans `journal-comparaison.md`. En cas d'échec, le prototype est retiré dans la même story.

## Design Notes

L'ordre de la séance iPhone est imposé par `recette-iphone.md` §2.0 : données de départ sur `c32e360d`, puis premier chargement de PRE-4 (R-3.1-00 et migration), puis R-3.1-01 à 03. H13 (accessibilité minimale) est constatée telle quelle.

## Implementation Notes

**AC1, partie locale (2026-10-17).** `node_modules/@expo/ui/package.json` : `"version": "57.0.13"`, comme `package-lock.json` (`resolved … ui-57.0.13.tgz`). Aucune montée ni descente de version. Le lockfile contient cette version depuis `ce18c80d`, du 2026-08-25. `app.json` : `runtimeVersion` `1.1.0`. Le CHANGELOG local de 57.0.12 porte le correctif « `Popover` ignorait silencieusement `modifiers` » (#48949). Le prototype n'applique aucun modificateur au `Popover` lui-même : ce correctif n'est pas sollicité. La date du build ne prouve pas la version native, car le lockfile fixait 57.0.9 dès `6d70ff00`, puis 57.0.10 dès `6e07b2e3`. R-3.1-00 relève donc le commit du build et vérifie qu'il descend de `ce18c80d`. Celui de 57.0.13 porte le correctif d'un `RNHostView` vide. La partie appareil (version native embarquée par « Routine Dev ») reste à relever par R-3.1-00, selon `recette-iphone.md` §4.3. Aucun résultat n'est déclaré.

**Lecture préalable.** Documentation SDK 57 `Popover` (https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/popover/) : `Host` → `Popover` (`isPresented`, `onIsPresentedChange`) → `Popover.Trigger` / `Popover.Content`. Un `RNHostView` placé dans `Popover.Content` héberge des vues React Native. Types lus : `build/swift-ui/Popover/index.d.ts`, `RNHostView.d.ts`, `Host/index.d.ts`. Le natif `ios/Popover/PopoverView.swift` applique `.presentationCompactAdaptation(.popover)`. Sur iPhone, la bulle reste donc une bulle et n'est pas convertie en feuille.

**Réalisation (iOS seulement, `Platform.OS === "ios"`).** Dans `src/features/activities/ExecutionParametersSheet.tsx` :
- `NativeRowPopover` :
  - un `Host matchContents` placé dans la ligne, donc dans le `ScrollView` de la Feuille, contient un `Popover` ;
  - son `Popover.Trigger` est la pastille de valeur existante (`ValuePill`), hébergée par `RNHostView matchContents` : la bulle est ainsi ancrée à la ligne ;
  - `onIsPresentedChange(false)` ferme sans appliquer, et un rappel tardif d'une surface déjà fermée est ignoré ;
  - le contenu reste **toujours monté**, y compris avant la présentation et pendant l'animation de fermeture. Il est **remonté à chaque ouverture** par une clé de génération, incrémentée par un état dérivé des props. La roue repart donc toujours de la valeur courante ;
  - `attachmentAnchor` et `arrowEdge` gardent leur valeur par défaut (choix du système).
- Ligne `Mode d’exécution` : `ModePopoverOptions`, deux `Button` SwiftUI (`Durée` puis `Répétitions`, libellés du lexique `t.modes`), séparés par un `Divider`, hauteur minimale `minTouchTarget`. L'option du Mode **affiché par la pastille** (`effective.mode`) porte le trait `isSelected`. Un choix appelle `setMode` sur le Brouillon de la Feuille et ferme la bulle.
- **Valeurs provisoires, NON VÉRIFIABLE à ce stade.** L'espacement des options (`POPOVER_OPTION_PADDING` : 8 en haut et en bas, 16 sur les côtés ; 4 autour de la pile) et l'absence de marque visuelle de l'option courante, réduite au seul trait d'accessibilité, ne sont pas tirés de Figma. La story 3.3 les relève sur `8328:37092`. Rien de plus n'est ajouté ici.
- Cible commune en Durée, **voie (i)** : `RNHostView matchContents` enveloppe la roulette `DurationWheelPicker`, inchangée, avec sa `PickerToolbar` ✕ / ✓. La largeur explicite (`nativeSurface.width` = 330) vient de la roulette elle-même. ✓ appelle `setUniformTarget` sur le Brouillon ; ✕ ferme sans rien changer.
- Android et web : branches existantes inchangées (`SegmentedControl` dans `ClosingSelector`, roulette en ligne).
- Aucun nouveau texte, donc aucune clé de lexique ajoutée. Aucun jeton modifié. `DurationWheelPicker.tsx` et `NumberWheelPicker.tsx` ne sont pas touchés.

**Tests (AC6).** Nouveau `describe("ExecutionParametersSheet — PRE-4 story 3.1")` :
- `PRE4-3.1/AC6`, iOS, popover de Mode :
  - une seule `Modal` (la Feuille), aucun segmenté ;
  - aucun élément tactile React Native dans la bulle hors du déclencheur (critère : tout responder, plus large que `Pressable`), aucun `ScrollView` ;
  - liste **exhaustive** des options (`queryAllByTestId(/^execution-sheet-mode-option-/)`), de libellés exactement `["Durée", "Répétitions"]` ;
  - choix appliqué au Brouillon sans `onApply`.
- `PRE4-3.1/AC2`, iOS : le trait `isSelected` (lu dans `props.modifiers`) est sur l'option courante seulement, et suit un changement de Mode après choix et réouverture. Aucune option n'est marquée si le Mode n'est pas renseigné.
- `PRE4-3.1/AC3`, iOS :
  - appui extérieur (`isPresentedChange` à `false`) sans application ; la Feuille reste tactile ; un rappel tardif est ignoré ;
  - second toucher sur la pastille, bulle ouverte : la bulle se ferme, sans double bascule si le rappel natif suit. L'ordre inverse n'est pas reproductible sous Jest et relève de R-3.1-01.
- `PRE4-3.1/AC4`, iOS, voie (i) :
  - contenu monté avant présentation, roulette native dans la bulle, largeur 330, sans `ScrollView`, seuls tactiles : le déclencheur, ✕ et ✓ ;
  - ✓ applique 2 min 15 s ; le contenu reste monté après fermeture ;
  - la réouverture repart de 2:15 ; ✕ laisse 2 min 15 s, et une nouvelle réouverture ne reprend pas la position abandonnée ; le ✓ de la Feuille produit 135 s.
- `PRE4-3.1/AC4`, iOS : aucun popover de Cible commune en Répétitions ni en séries variables.
- `PRE4-3.1/AC4`, iOS : l'indicateur d'invalidité (contour, indice « Valeur à renseigner ») est conservé sur la pastille hébergée.
- `PRE4-3.1/AC6`, parité Android :
  - aucun `Popover` ; segmenté du Mode ; roulette `LegacyDurationWheelPicker` en ligne, reconnue à son `ScrollView` et à l'absence d'`onSelectionChange` ;
  - limite documentée dans le test : `withPlatform` ne change que `Platform.OS` à l'exécution, sans rendu Android réel.

Les garde-fous `DurationWheelPicker.test.tsx:378`, `:619` et `NumberWheelPicker.test.tsx:267` ne sont pas modifiés et restent verts.

**Tests existants adaptés (sans affaiblissement).** Sous jest-expo, `Platform.OS` vaut `ios` par défaut.
- **Utilitaire partagé.** `src/features/activities/testing/executionSheetActions.ts` expose `chooseExecutionMode(label)` :
  - popover natif sur iOS, segmenté ailleurs ;
  - ouvre le contrôle s'il est fermé ;
  - **lève une erreur** sur un libellé inconnu ;
  - il a son propre `README.md`.
- **`ExecutionParametersSheet.test.tsx`.**
  - `chooseExecutionMode` remplace le choix par le segmenté dans P3-11, P3-14/inverse-boundaries, ACCESSIBILITY/sheet-check-cross, REV-01, les deux F-02 et PRE4-1.1/AC22 (cellules à l'échec).
  - Les tests qui portent sur le segmenté lui-même tournent sous Android (`withPlatform("android")`), où il reste livré, avec des assertions inchangées : D-4, D-4/D-7, D-341 et PRE4-1.1/AC22 (segmenté). Sur iOS, `PRE4-3.1/AC6` en vérifie l'équivalent.
  - La roulette de la Cible commune restant montée dans son popover fermé, les gestes sur la roulette du total sont portés par son conteneur (`totalWheel()`) dans P3-14, REV-02 et D-5.
  - P3-19/exclusive-scroll lit l'ouverture de la Cible sur `isPresented` sous iOS, et sur la présence de la roulette ailleurs.
- **Tests d'intégration.** `CategoriesSaveFlow.integration`, `CompositionExerciseFlow.integration`, `ExerciseEditorNoWrite.integration` et `ExerciseScreen` utilisent `chooseExecutionMode`. L'import `within`, devenu inutile, est retiré dans trois d'entre eux.

**Vérification locale.** Après la revue : `ExecutionParametersSheet.test.tsx`, 64 tests verts ; les quatre fichiers d'intégration, 49 tests verts. `npx tsc --noEmit` : aucune erreur. `eslint` sur les fichiers touchés : aucune erreur ni avertissement. La vérification complète est faite par le coordinateur.

**Limites et risques à observer sur iPhone (non tranchés par Jest).**
- Ancrage dans une `Modal` React Native : AC2, cœur de l'essai. Repli (a) ou (b) selon AC7.
- Imbrication `Host` → `Popover` → `RNHostView` → `DurationWheelPicker`, qui porte son propre `Host`. Le dimensionnement par `matchContents` des deux `RNHostView` (pastille et roulette) est à constater.
- Contenu toujours monté et remonté à chaque ouverture : à vérifier que la bulle ne se vide ni ne se replie, à l'ouverture comme à la fermeture, et que le remontage n'altère pas son dimensionnement (R-3.1-02).
- Contrôle tactile de la pastille hébergée par `RNHostView` dans `Popover.Trigger`, et ordre des événements quand on la touche de nouveau, bulle ouverte (R-3.1-01, geste 4).

**Reste ouvert.** AC1, partie appareil (R-3.1-00), AC2 à AC5 sur iPhone (R-3.1-01 à 03), puis la décision de l'AC7 et la voie de la roue confirmée. Ces éléments sont consignés ici et dans `journal-comparaison.md` après le retour de Hermann. La story reste `in-progress`.

### Décision AC7 (2026-10-17, après l’essai sur iPhone de Hermann)

- **R-3.1-00 :** Routine BMAD, build EAS `development-bmad` `df00eb68…` depuis `fa738e31` (descendant de `ce18c80d`, `@expo/ui` 57.0.13, runtime 1.1.0) : JavaScript chargé, compatible.
- **Popover natif de choix (Mode) : succès.** Après correction des écarts E-01 et E-02 (pastille React Native hors du déclencheur SwiftUI, ancre transparente non touchable), la bulle s’ouvre ancrée à la ligne, un choix l’applique au Brouillon, un appui extérieur ferme sans appliquer : validé par Hermann. Ce montage est la base de la story 3.3 pour les choix qui restent en popover natif (Mode).
- **Roue : la voie (i) a fonctionné (après E-05), puis Hermann a remplacé la présentation.** Q37 (roue centrée, sans flèche), puis Q41 : toutes les roues de la Feuille s’ouvrent dans un panneau sans flèche sous le champ, aligné à droite (`AnchoredPanel`, conteneur de positionnement ; iOS n’offre pas de popover natif sans flèche). Le contrat des roulettes reste porté par `DurationWheelPicker` et `NumberWheelPicker`, inchangés ; aucune réimplémentation. Changement de côté et Ordre des côtés : même panneau, contenu `SegmentedControl` accepté (Q41).
- **Décisions de recette prises pendant l’essai :** Q35 à Q42 (`questions-ouvertes.md`). Écarts E-01 à E-16 (`recette-iphone.md` §5) : validés par Hermann, fonctionnellement pour E-13 à E-15 ; l’ergonomie fine est reportée à une session dédiée.
- **R-3.1-03 (VoiceOver) :** non rapporté séparément ; à rejouer avec la story 3.8.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V).

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| B4/E3/E6 — R-3.1-00 déduit la version native de la date du build ; affirmation fausse sur le lockfile | medium | Le lockfile fixait déjà @expo/ui 57.0.9 (6d70ff00, 2026-08-05) puis 57.0.10 (6e07b2e3, 2026-08-14) | patch (relevé du commit du build, ascendance de `ce18c80d`) |
| B8/E1/E2 — contenu démonté pendant la fermeture, non mesuré avant la présentation | medium (comportement natif non prouvé) | `isPresented ? children : null` | patch (contenu monté, remonté à chaque ouverture) |
| B1 — `isSelected` sur `draft.mode`, pastille sur `effective.mode` | low | Deux sources pour la même valeur | patch |
| V1 — liste des options iOS non exhaustive ; `queryByText` aveugle sur un `label` SwiftUI | medium | Une troisième option passerait | patch |
| V2 — trait `isSelected` jamais vérifié | low | Aucun test sur `modifiers` | patch |
| E5 — `chooseMode` envoie toute étiquette inconnue vers Répétitions | low | Helper de test | patch |
| B9 — quatre tests d'intégration liés au chemin iOS | low | `fireEvent(…, "buttonPress")` dupliqué | patch (helper partagé) |
| B10/E4 — parité Android faiblement prouvée | low | `withPlatform` ne change que `Platform.OS` | patch (assertion propre ou limite documentée) |
| B11 — cas iOS manquants (second toucher, absence en Répétitions et en variables, invalidité) | low | Non testés | patch |
| B6 — AC3 « ne déclenche pas le contrôle dessous » sans cible nommée | low | Geste de R-3.1-01 | patch (recette) |
| B12 — règle d'arrêt ambiguë si un nouveau build est nécessaire | low | §4.3 | patch (recette) |
| B13 — colonne Figma invitant à un verdict visuel | low | §4.3 | patch (recette) |
| B2/B3 — option courante sans marque visuelle ; espacements non tirés de Figma | low | Relevé visuel attribué à 3.3 par l'epic | patch documentaire (valeurs provisoires, NON VÉRIFIABLE) |
| B5 — aucun scénario ne sollicite le correctif 57.0.12 | false | Le prototype n'applique aucun modificateur au `Popover` lui-même ; le correctif est sans objet ici | rejeté, consigné en recette |
| B7 — aucun prototype du repli (a) préparé | false | AC7 : la décision suit les constats ; le repli (a) ne se prépare que si le succès n'est pas obtenu | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Sur iPhone, par Hermann : R-3.1-00 à 03 (non déclarés par l'agent).
