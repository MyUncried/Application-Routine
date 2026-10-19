---
title: 'Story 2.5 — Côtés Avec / Sans, Enchainement, Cadence et Durée de l’exercice'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '9417aabbc913339789be60c886a23ed182f6b146'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/spec-2-4-feuille-en-quatre-cadres-execution-et-type-de-serie.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Dans les cadres Côtés et Cadence et durée de la Feuille, le Changement de côté (trois valeurs anatomiques) et l’Ordre des côtés passent encore par des panneaux, le Bip de cadence par un stepper seul, et Compte à rebours et Fin sont toujours visibles sous une ligne « Durée totale ».

**Approach:** Story 2.5 de `epics.md` (AC1 à AC6, qui font foi dans le détail), AD-21, AD-24, AD-27, AD-28, D-431 : Changement de côté et Enchainement en `SegmentedControl` `inline` (story 2.3), Cadence segmentée Autre / 5 s / 2 s / 1 s / Sans par la fonction pure `cadenceOptionOf`, ligne « Durée de l’exercice » avec le `DisclosureControl` existant qui replie Compte à rebours et Fin. Transitions existantes du Brouillon (`setSideMode`, `setSideOrder`, `setCadenceBeep`) ; Durée de l’exercice et son inversion inchangées.

## Boundaries & Constraints

**Always:**
- Changement de côté : `inline`, `INLINE_OPTION_WIDTHS.narrow`, Avec (gauche) / Sans (droite) ; Avec ⇔ `isBilateral(sideMode)`, Sans ⇔ `UNILATERAL` ; `null` → aucune option sélectionnée (normalisé à Sans au ✓ par le domaine). Sans → Avec : `setSideMode(base, "RIGHT_LEFT", profil)` (copie P3-10). Avec re-choisi sur une valeur bilatérale, Sans re-choisi sur `UNILATERAL` : Brouillon inchangé (aucune réécriture de `LEFT_RIGHT`). Avec porte le chevron intérieur (haut déployé, bas replié) ; son appui replie ou déplie Enchainement et Pause entre les côtés, sans changer valeur ni sélection (état d’interface, déployé par défaut et à chaque passage à Avec).
- Enchainement : ligne « Enchainement », visible si Avec, déployé et N > 1 ; `inline`, `INLINE_OPTION_WIDTHS.notation`, `compact` (police 10, relevé Figma : à 12 les notations dépassent 113) ; options `BY_SIDE` puis `BY_SERIES`, texte `sideOrderSubtitles` = `(D1 → D2) ➜ (G1 → G2)` et `(D1 → G1) ➜ (D2 → G2)`, nom accessible `sideOrders` ; valeur affichée `effective.sideOrder` comme aujourd’hui ; choix → `setSideOrder` si différent.
- Cadence : `inline`, `INLINE_OPTION_WIDTHS.cadence`, ordre Autre / 5 s / 2 s / 1 s / Sans ; option affichée `cadenceOptionOf(value)` (0 → Sans, 1, 2, 5 → option, autre → Autre ; `null` → aucune) sauf surface `stepper(beep)` ouverte → Autre. Autre ouvre (ou referme) `stepper(beep)` sans changer la valeur ; le ± existant (`OpenStepperField`, 0..10, pas 1, `EXECUTION_UNIT_HOLD_POLICY`) est révélé sous la ligne, aligné à droite. 5 s / 2 s / 1 s / Sans → `setCadenceBeep` si différent, surface fermée.
- Durée de l’exercice : libellé « Durée de l’exercice » (estimée : « Durée de l’exercice ≈ ») ; `DisclosureControl` à 12 du libellé ; replié par défaut ; replié = Compte à rebours et Fin non rendus, valeurs conservées ; pastille, roue, inversion, annonces de nature et message d’ajustement inchangés ; chevron et pastille sont deux cibles distinctes. Ligne absente (`totalNature === null`) → Compte à rebours et Fin visibles, sans chevron.
- Exercice ouvert depuis une Séance (D-409, RM-218, AC4) : prop optionnelle de la Feuille (défaut : signaux présents), transmise par `ActivityEditorForm` et posée à « absents » par `CompositionExerciseEditor` ; absents = ni lignes ni chevron ; valeurs conservées.
- Choix dans ces segmentés : même règle que `chooseInline` (T10 : panneau ou roue ouvert → fermeture sans appliquer ; saisie clavier appliquée d’abord ; Q40).
- Retrait de `popover(side | order)`, de `SheetPopover` et du code mort (panneaux, `ClosingSelector` s’il n’a plus d’usage, `SIDE_ORDER_MIN_HEIGHT`, `isSegmentedPanel`, `prune` d’`ORDER_POPOVER`).
- Lignes du cadre Côtés non indentées (Figma : marge 12, comme 2.4 pour le cadre Séries) ; libellés Regular 12 existants ; lignes 44 ; animations `SheetMotionView` existantes.
- Lexique (AC5) : ajouts « Avec » / « Sans » des côtés, « Enchainement », « Cadence » et options, « Durée de l’exercice » (+ ≈, nom accessible de la pastille, libellés du chevron) ; `sideOrderSubtitles` à flèche centrale `➜` ; retraits de `sideModes`, `sideModeOptions`, `sideOrder`, `beep`, `beepNone`, `total`, `totalEstimated` (et clés devenues orphelines) ; « Durée totale » de la Phrase (`fr.ts`) intacte ; `index.test.ts` adapté.
- Fins de ligne : Sheet en LF, autres fichiers en CRLF.

**Never:** aucune modification du domaine, de `executionCalculations.ts`, `LedgerSide`, `SideModeControl.tsx`, `tokens.ts`, `NumberWheelPicker` / `DurationWheelPicker` ni de leurs gardes zéro-`ScrollView` ; aucun composant nouveau ; aucune modification du stepper « Nombre de séries » ni de la Durée de l’exercice (calcul, natures, `—`, N = 1, T(1)..T(99), inversion) ; Phrase, Composition, exécution et Carte de l’Éditeur inchangées (1.2, 3.2) ; aucune notation C1S1 ; aucune valeur de Cadence mémorisée ; aucun push, EAS, Figma modifié.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Activation | `UNILATERAL`, Profil 20 s | Avec : `RIGHT_LEFT`, Pause entre les côtés 20 s, lignes visibles | — |
| Historique | `LEFT_RIGHT`, `BY_SERIES`, ✓ | Avec affiché ; `LEFT_RIGHT` et `BY_SERIES` enregistrés | — |
| Sans puis Avec | `RIGHT_LEFT`, pause 12 → Sans → Avec | lignes masquées puis visibles ; pause recopiée du Profil (P3-10) | — |
| Repli | Avec, chevron | Enchainement et Pause masqués ; valeurs et Avec conservés | — |
| N = 1 | Avec, N 2 → 1 | ligne Enchainement masquée, `sideOrder` du Brouillon conservé | — |
| Cadence | 0, 1, 2, 5, 7, `null` | Sans, 1 s, 2 s, 5 s, Autre, aucune | — |
| Autre | 0, toucher Autre | valeur 0, ± ouvert, Autre affiché ; fermeture → Sans | — |
| Durée de l’exercice | ouverture | repliée, Compte à rebours et Fin absents ; chevron → visibles ; valeur inchangée | — |
| Sans total | Répétitions à l’échec | pas de ligne, Compte à rebours et Fin visibles | — |
| Séance | Exercice de Séance | ni Compte à rebours, ni Fin, ni chevron | — |

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx` (LF) -- `SIDE_POPOVER` / `ORDER_POPOVER` (l. 228-229), `ClosingSelector` (l. 281), `PanelControl` `sideMode`/`sideOrder` et tables associées (l. 341-390), `update()` `prune` (l. 648), `chooseInline` (l. 655) à réutiliser, `panelControl` (l. 943), `sideSelector` / `orderSelector` (l. 1294-1348), panneau (l. 1433-1434), cadre Côtés (l. 1783-1858), cadre Cadence (l. 1860-1940), `beepLabel` (l. 449), `totalSpokenLabel` (l. 937) ; modèle du chevron intérieur : `seriesTypeControl` / `toggleTable` (l. 1097-1387) ; ± révélé sous une ligne : `OpenStepperField` + `useOpenFieldFocus` (l. 2420-2490), cas `pauseOpen` de `VariableTable` (l. 2280). `Row` (l. 2329) : ajouter au besoin un accessoire de libellé pour le chevron de la Durée de l’exercice.
- `src/shared/ui/DisclosureControl.tsx` -- réutilisé tel quel (`expanded`, `onPress`, `accessibilityLabel`, `testID`).
- `src/shared/ui/SegmentedControl.tsx` -- variante `inline` (2.3) : `optionWidth`, `chevron`, `onChevronPress`, `compact` ; inchangé.
- `src/features/activities/sheetSurface.ts` (CRLF) + `__tests__/sheetSurface.test.ts` -- retrait de `popover` (type, `sameSurface`, commentaires, tests T10 sur popover portés sur `selector`).
- `src/features/activities/ActivityEditorForm.tsx` (CRLF), `src/features/sessions/ExerciseScreen.tsx` (CRLF, `CompositionExerciseEditor` l. 479, appel l. 625) -- transmission de la prop « signaux absents ».
- `src/shared/i18n/index.ts` + `index.test.ts` (CRLF) -- lexique.
- `src/features/activities/testing/executionSheetActions.ts` (CRLF) -- helpers éventuels (choisir le côté, l’Enchainement, déplier la Durée de l’exercice).
- Tests : `ExecutionParametersSheet.test.tsx` (panneaux Côté / Ordre, Q38, Bip, Durée totale, Compte à rebours, Fin), `ActivityEditorForm.test.tsx`, `ExerciseEditingPaths.integration.test.tsx`, `ExerciseEditorNoWrite.integration.test.tsx`, `ExerciseScreen.test.tsx`, `EditorAccessibility.story46.test.tsx`.

## Tasks & Acceptance

**Execution:**
- [x] `src/shared/i18n/index.ts`, `index.test.ts` -- clés ajoutées, retirées, flèche `➜` (AC5).
- [x] `src/features/activities/sheetSurface.ts` + test -- retrait de `popover(side | order)` (AC1, AC2).
- [x] `src/features/activities/cadenceOption.ts` + test -- `cadenceOptionOf` pure (AC3).
- [x] `src/features/activities/ExecutionParametersSheet.tsx` -- cadres Côtés et Cadence et durée, prop des signaux (AC1 à AC4).
- [x] `ActivityEditorForm.tsx`, `ExerciseScreen.tsx` -- transmission de la prop (AC4).
- [x] Tests de la Feuille et d’intégration -- révisés par conception sans affaiblir ce qu’ils prouvent (dépli de la Durée de l’exercice avant Compte à rebours / Fin) ; tests de la matrice ; tests Q38 et du stepper N inchangés.

**Acceptance Criteria:**
- Given la story livrée, when on exécute `npm test`, `npx tsc --noEmit`, `npm run lint`, then les trois sont verts.
- Given le stepper « Nombre de séries », when on l’ouvre, le règle de 2 à 1 et le ferme, then ses tests PRE-4 passent inchangés et l’Enchainement disparaît sans toucher au stepper.
- Given Pause entre les côtés, Compte à rebours et Fin, when on les règle, then valeur au repos, ± à l’appui, ✓ / ✕ en deux temps sont inchangés.

## Implementation Notes

- Checkpoint 1 (2026-10-19) : spec d’environ 2 600 tokens conservée entière (une seule réécriture des cadres Côtés et Cadence) ; aucune question ouverte ; approbation pré-autorisée par Hermann (développement PRE-5 autorisé le 2026-10-19). Constat de planification : la Feuille ne masquait pas Compte à rebours et Fin pour un Exercice de Séance (le spine dit l’absence « existante ») ; prop ajoutée sur la base de D-409 / RM-218 / AC4, point signalé à Hermann.
- Implémentation (sous-agent) : `chooseSide`, `toggleSides`, `chooseSideOrder`, `chooseCadence`, `toggleDuration` passent par la règle de `chooseInline` ; états d’interface `isSidesFolded` (déployé par défaut et à chaque Sans → Avec) et `isDurationExpanded` (replié à l’ouverture) ; `Row` reçoit `labelAccessory` (chevron à 12) — avec une annonce regroupée, le regroupement passe à la valeur seule (`-value-group`) pour garder le chevron distinct ; ± de la Cadence révélé sous la ligne par `RevealedStepperField` (`OpenStepperField` + `useOpenFieldFocus` existants) ; `cadenceOption.ts` (`cadenceOptionOf`, `CADENCE_OPTIONS`). Retirés : `popover` (famille entière), `ClosingSelector`, `closeAfterChoice`, `handleSelectorClosed`, `SIDE_ORDER_MIN_HEIGHT`, `isSegmentedPanel`, `selectorPanel`, indentation. Les événements `prune` / `choose` / `closed` du réducteur restent (sans appelant dans la Feuille). Lexique : `sideModeChoices`, `showSideSettings` / `hideSideSettings`, `sideSequence`, `cadence`, `cadenceOptions`, `exerciseDuration(Estimated|EditAccessibilityLabel)`, `show|hideExerciseSignals`. Environ 69 tests de la Feuille révisés par conception (dépli avant Compte à rebours / Fin, panneaux Côté / Ordre remplacés par les segmentés, T10 porté sur les roues, Q38 piloté par le stepper N inchangé) ; 16 tests de la matrice, `cadenceOption.test.ts`, test de transmission de la prop ; chemins de Séance d’`ExerciseScreen` adaptés (signaux absents). Limite connue : fermé par l’action accessible « Fermer », le focus VoiceOver ne revient pas sur Autre (`SegmentedControl` n’expose pas de référence d’option). Contrôles : 120 suites, 3 092 tests, `tsc` et lint verts.

## Spec Change Log

## Review Triage Log

Passe 1 (2026-10-19) — couches : Blind Hunter (B), Edge Case Hunter (E), Verification Gap (V : aucun écart).

| # | Constat | Verdict | Preuve / route |
|---|---|---|---|
| B1 | Durée de l’exercice dépliée, ligne disparue puis réapparue : elle revient dépliée | low | Vérifié : `isDurationExpanded` persiste ; état d’interface conservé comme le repli du tableau (2.4) ; la règle « repliée par défaut » vaut à l’ouverture. Rejeté. |
| B2, E4 | Événements `choose`, `closed`, `prune` et `closingKey` sans producteur ; leurs tests prouvent un comportement inatteignable | low | Vérifié (aucun `dispatchSurface` de ces types). Suppression directe. **patch**. |
| B3 | Options « 5 s », « 2 s », « 1 s » annoncées avec le symbole | low | Toutes les valeurs de la Feuille (« 15 s » des pastilles) sont annoncées ainsi depuis PRE-4 ; pas un écart propre à 2.5. Rejeté. |
| B4 | Deux options « Sans » (Changement de côté, Cadence) | low | Même schéma que la Charge (2.2) ; le nom du contrôle porte la ligne. Rejeté. |
| B5 | Autre agit comme un dépli sans état `expanded` annoncé | low | Exige un état par option dans `SegmentedControl` (inchangé par la spec) ; à juger à la recette VoiceOver (R-2.5-04). Rejeté. |
| B6 | Chevrons sans `keyboard.flush` explicite | false | Même chemin que le chevron du tableau (2.4) : `closeAll` ferme la surface clavier, dont la sortie applique la saisie (`useSheetKeyboard`). |
| B7 | `LEFT_RIGHT` n’est plus visible ; Sans → Avec écrit `RIGHT_LEFT` | false | Décision AD-21, FR-15, FR-16 (neutralité ; aucune réécriture sans passage par Sans). |
| B8 | Carte de l’Éditeur en Séance montre Compte à rebours et Fin, non modifiables dans la Feuille | low | Réel ; la Carte relève de la story 3.2 (retrait du résumé, cadrage PRE-5). Point signalé à Hermann. Rejeté ici. |
| B9 | `beepLabel(null)` affiche « — » | low | Cadence `null` non produite par le Brouillon en Feuille ; `—` est la convention de la valeur non renseignée. Rejeté. |
| B10 | Aucun test de largeur étroite / texte agrandi des segmentés | low | Déjà différé (2.3, `deferred-work.md`) ; recette iPhone. Rejeté. |
| B11 | Artefacts BMad absents du diff | false | La spec et `sprint-status.yaml` sont hors du diff de code par construction. |
| B12 | Aucune preuve sur appareil | false | Recette R-2.5-01 à 05 prévue au lot Feuille ; aucun constat fabriqué. |
| B13 | `openExecutionSheetField("execution-sheet-beep")` muet si une roue est ouverte | low | Aide de test ; aucun test ne l’appelle dans ce cas. Rejeté. |
| E1 | VoiceOver : fermé par « Fermer », le ± de la Cadence ne rend pas le focus à Autre | low | Vérifié (déjà consigné) ; nécessite une référence d’option de `SegmentedControl`, inchangé. À vérifier en recette VoiceOver. Rejeté. |
| E2 | Répétitions : Cadence Sans → 2 s fait apparaître la ligne de durée et replie Compte à rebours et Fin visibles | low | Conséquence directe de la règle (ligne absente → signaux visibles ; ligne présente → repliée). Point signalé à Hermann. Rejeté. |
| E3 | Double toucher rapide d’un chevron : bascule perdue (fermeture périmée) | low | Correction directe (mise à jour fonctionnelle). **patch**. |
| E5 | Cadence personnalisée (3, 4, 6..10 s) visible seulement comme « Autre » au repos | low | Conforme à FR-30 / AC3 (option reflétant la valeur) ; point signalé à Hermann. Rejeté. |
| E6 | « tests Q38 inchangés » inexact : les tests Q38 de la ligne Ordre ont été réécrits | low | Vérifié : les tests de la ligne Ordre suivent son nouveau contrôle ; aucun test du stepper « Nombre de séries » retiré ni modifié dans sa preuve. Correction = édition de la spec. Rejeté (noté). |

Correctifs appliqués par le sous-agent d’implémentation (B2/E4 : événements `choose` / `closed` / `prune` et `closingKey` supprimés avec leurs tests ; E3 : mises à jour fonctionnelles des deux chevrons). Après correctifs : 120 suites, 3 088 tests, `tsc` et lint verts. Rien de différé ; points E2, E5 et B8 signalés à Hermann.

## Design Notes

- Relevé Figma (lecture seule, 19/10, `8328:38193`) : cadre Côtés `9230:19534` (lignes 41 → 44, libellés Regular 12 à x 12, séparateurs pleine largeur), notations Inter 10 (Semi Bold sélectionnée, Regular `#4A4A52` sinon), texte de 112 de large ; Cadence `9230:19584` (cinq options de 46,4) ; ligne « Durée de l’exercice » `9230:19600` (libellé et chevron 10 × 10 dans un groupe « Déplier — Durée et signaux », pastille à droite ; Compte à rebours et Fin masqués). Écart constaté : la frame actuelle place les deux notations dans un menu déroulant intérieur à l’option Avec (`9462:18987`, 144 × 88) sans ligne « Enchainement » ; les décisions D-413, D-431, AC2 et la consigne (ligne Enchainement en segmenté `inline`, largeur 113) priment ; écart signalé à Hermann.
- `DisclosureControl` garde son cadre 28 × 28 (composant accepté, AD-28) ; Figma montre un chevron nu : écart visuel signalé, non corrigé.
- TestIDs proposés : `execution-sheet-side-control` (options `-WITH`, `-WITHOUT`), `execution-sheet-order-control` (`-BY_SIDE`, `-BY_SERIES`), `execution-sheet-cadence-control` (`-OTHER`, `-5`, `-2`, `-1`, `-NONE`), `execution-sheet-beep` conservé pour le ± (révélé), `execution-sheet-duration-disclosure` ; `execution-sheet-row-total`, `-total`, `-countdown`, `-end` conservés.

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Recette iPhone du lot Feuille (après 2.8) : R-2.5-01 à R-2.5-05 ; aucun constat fabriqué.
