---
title: 'Story 2.4 — Feuille en quatre cadres, Exécution et Type de série'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '446345d84f1dbda72d949f8abcb6aea091a7b6c3'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/spec-2-3-variante-inline-du-segmentedcontrol.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La Feuille « Paramètres d'exécution » est un seul groupe ; le Mode passe par un popover natif, le Régime par un panneau, la Condition d'arrêt n'a pas de ligne et les roues de la Cible commune proposent encore « À l'échec » en séries identiques.

**Approach:** Story 2.4 de `epics.md` (AC1 à AC9, qui font foi dans le détail) : quatre cadres (Exécution ; Séries ; Côtés ; Cadence et durée), Mode, Condition d'arrêt et Type de série en `SegmentedControl` `inline` (story 2.3), résultat dérivé en lecture seule, ligne de cible masquée à l'échec, roues sans option d'échec en identiques, repère unique des panneaux. Les transitions viennent de 2.1 (`setStopCondition`, `setMode`, `setVariable`) ; `stopConditionOf` est la seule autorité du résultat dérivé.

## Boundaries & Constraints

**Always:** ordre et libellés PR-01 et Figma (`8328:38193`, `8328:38632`) : Mode « Répétitions | Durée », Condition d'arrêt « À l'échec | À la cible », Type de série « Variables | Identiques » ; largeur `INLINE_OPTION_WIDTHS.wide` ; chevron de Variables seulement quand le tableau existe (`showVariableTable`), appui = repli ou dépli sans perte (même logique que l'ancien `DisclosureControl`) ; avec des phases : Répétitions, À l'échec et Variables `disabled`, valeur réelle affichée ; à N = 1 le Type de série reste non modifiable (P16) ; stepper « Nombre de séries » inchangé (mêmes props, testID, libellé accessible `t.series`), seule sa ligne devient « Nombre de séries » dans le cadre Séries (NR Δ38) ; panneaux restants (Cible commune, Côté, Ordre, Durée totale, cellule) placés par une seule fonction `y du cadre + y de la ligne (+ groupe / tableau / cellule)` ; cadres : fond `#EFF0F2`, contour 1 blanc, rayon 12, espacés de 8 (constantes locales) ; libellés de ligne Inter Regular 12 (PR-03, constante locale) ; lignes 44 ; animations Q39 à Q41 et `SheetMotionView` réutilisés ; fins de ligne existantes (Sheet en LF, autres fichiers en CRLF).

**Never:** aucune modification de `tokens.ts`, du domaine (hors besoin prouvé), de `NumberWheelPicker` / `DurationWheelPicker` ni de leurs gardes zéro-`ScrollView` ; aucun composant nouveau ; aucune ligne Phases, Charge, Cadence segmentée, Côtés Avec / Sans ni Durée de l'exercice (2.5, 2.7, 2.8) : Changement de côté, Ordre, Bip et Durée totale gardent leur forme actuelle dans leur cadre ; aucune validation ajoutée ; aucun push, EAS, Figma modifié.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Identiques à la cible | Durée, 90 s | Condition « À la cible » ; ligne « Durée d'une série » visible ; roue sans « À l'échec » | — |
| Passage à l'échec | toucher À l'échec | Cible `FAILURE` ; ligne Durée (ou Répétitions) masquée ; Pause visible | — |
| Retour à la cible | après 90 s → échec | 90 s restaurée ; sans valeur connue → « — » sur fond rouge pâle | — |
| Variables homogènes | 30 s, 45 s / échec, échec | lecture seule, deux options, À la cible / À l'échec sélectionnée, opacité 0,45 | — |
| Variables mixtes | 30 s, échec | une seule option « À la cible et à l'échec » | — |
| Variables vides | `UNSET` partout | « — », annoncé « Condition d'arrêt, aucune valeur » | — |
| Cellule variable | roue d'une ligne | option « À l'échec » en tête conservée | — |
| Phases | 2 phases | Répétitions, À l'échec, Variables indisponibles | — |
| Mode non renseigné | `mode: null` | aucun segment sélectionné ; Condition « À la cible » | — |

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx` (LF) -- Feuille. À retirer : `NativeRowPopover`, `ModePopoverOptions`, `POPOVER_OPTION_PADDING`, `MODE_POPOVER`, `REGIME_POPOVER`, `regimeField`, `regimeSelector`, `modeValuePill`, panneau `regime`, imports `@expo/ui/swift-ui` et `DisclosureControl` devenus inutiles. À scinder : le `SheetMotionView` `styles.group` (l. 1425) en quatre cadres mesurés par `onLayout` ; `groupBox` / `variableGroupY` remplacés par `frameBoxes` + fonction unique de position (l. 955-983). `durationTargetWheel` / `repetitionsTargetWheel` (l. 1049, 1100) : `failureOption` seulement pour une cellule. Garder `variableGroup` (sélection Q40) autour de « Type de série » + tableau. `update()` : `prune` d'`ORDER_POPOVER` seul.
- `src/features/activities/sheetSurface.ts` (CRLF) -- `SheetPopover` réduit à `"side" | "order"` (AD-27), commentaires.
- `src/shared/ui/SegmentedControl.tsx` (CRLF) -- `readOnly` : opacité `UNSELECTED_OPACITY` du contrôle (UX-DR2, relevé `9230:44720` : opacité 45 %, violet `#5F60EE`, texte blanc).
- `src/shared/i18n/index.ts` (CRLF) -- `mode` → « Mode » ; ajouts `seriesCount`, `seriesType`, `seriesTypes`, `stopCondition`, `stopConditions` ; retrait de `regime`, `regimes`, `regimeSubtitles` ; `showTable` / `hideTable` réutilisés pour le chevron ; `index.test.ts` si concerné.
- `src/features/activities/testing/executionSheetActions.ts` (CRLF) -- `chooseExecutionMode` et `chooseExecutionRegime` passent par les segmentés en ligne ; `pressInExecutionSheet` reste (aucun popover natif, délégation directe).
- Tests : `ExecutionParametersSheet.test.tsx` (popover du Mode l. 874-966, panneau du Régime l. 2303, 2737, repère l. 1524, 2029, 2075, 2254, 3033, 4056), `sheetSurface.test.ts`, `SegmentedControl.test.tsx` (ajout), tests d'intégration qui choisissent le Mode ou le Régime par les helpers.

## Tasks & Acceptance

**Execution:**
- [x] `src/shared/i18n/index.ts` -- clés ajoutées et retirées (AC9).
- [x] `src/shared/ui/SegmentedControl.tsx` + test -- rendu atténué en `readOnly` (AC5).
- [x] `src/features/activities/sheetSurface.ts` + test -- retrait de `popover(mode | regime)` (AC3, AC7).
- [x] `src/features/activities/ExecutionParametersSheet.tsx` -- quatre cadres, repère unique, Mode, Condition d'arrêt, Type de série, roues, libellés (AC1 à AC9).
- [x] `src/features/activities/testing/executionSheetActions.ts` -- helpers adaptés.
- [x] Tests de la Feuille et d'intégration -- révisés par conception, sans affaiblir ce qu'ils prouvent ; tests nouveaux de la matrice et du repère par cadre.

**Acceptance Criteria:**
- Given la story livrée, when on exécute `npm test`, `npx tsc --noEmit`, `npm run lint`, then les trois sont verts.
- Given un panneau ouvert depuis une ligne d'un cadre, when le cadre est à y = Y, then le haut du panneau vaut Y + y de la ligne + hauteur + 4.
- Given le stepper « Nombre de séries », when on l'ouvre, le règle et le ferme, then ses tests PRE-4 passent inchangés.

## Implementation Notes

- Checkpoint 1 (2026-10-19) : spec d'environ 2 300 tokens conservée entière (story L, une seule réécriture de la Feuille) ; aucune question ouverte ; approbation pré-autorisée par Hermann (développement PRE-5 autorisé le 2026-10-19). Relevé Figma (lecture seule, 19/10) : cadres `9230:19461`, `9230:44699` (fond `#EFF0F2`, contour 1 blanc, rayon 12, écart 8, libellés Inter Regular 12, lignes 41 conservées à 44 par R-06) ; résultat dérivé `9230:44720` (segmenté entier à opacité 45 %) ; Type de série `9230:44762` (chevron dans Variables, ordre Variables | Identiques).

- Implémentation (sous-agent) : `anchorTop(cadre, y)` seul calcul de position ; panneaux à 13 du bord du cadre (contour 1 + marge 12) ; lignes de cible et de Pause non indentées dans le cadre Séries (Figma) ; option unique « À la cible et à l'échec » large de 214 (= deux options + écart), choix d'intégration non relevé sur Figma ; roue Répétitions commune sans ligne de tête, donc plus étroite (144) ; re-choisir l'option affichée laisse le Brouillon inchangé (Q29) mais désélectionne le tableau (Q40). Environ 79 tests de la Feuille révisés par conception (popover du Mode, panneau du Régime, repère) ; tests des options d'échec des stories 3.4 et 3.5 portés sur une cellule variable ; test d'ancre du popover du Mode supprimé, remplacé par un test d'absence de tout popover natif. Contrôles : 117 suites, 3 022 tests, `tsc` et lint verts.

## Spec Change Log

## Review Triage Log

Passe 1 (2026-10-19) — couches : Blind Hunter (B), Edge Case Hunter (E), Verification Gap (V).

| # | Constat | Verdict | Preuve / route |
|---|---|---|---|
| E1 | Android / web : segment Mode, Condition ou Type de série appliqué alors qu'un panneau ou une roue en ligne est ouvert (T10) | low | Vérifié : `chooseInline` applique sans regarder la surface ; iOS protégé par la zone extérieure de l'`AnchoredPanel`. **patch** (fermeture sans application). |
| E2 | Indicateur du résultat dérivé animé hors du contrôle au passage TARGET → MIXED | low | Vérifié : même instance, `indexRange` [0, 1] et index 1 → 0, départ à x = 216. **patch** (`key` selon le nombre d'options). |
| E3, B1 | Panneau placé avant la mesure de son cadre (`anchorTop` à 0) | low | Réel pour un rendu théorique, mais aucun toucher n'est possible avant la mise en page ; même défaut qu'avec `groupBox` à l'origine. Rejeté (garde pour un cas non rencontré). |
| E4, E5 | À N = 1, le Type de série en lecture seule n'absorbe plus l'appui : le stepper N se ferme (T23, P16) ; test révisé pour l'accepter | medium | Vérifié (ancienne pastille `ignorePress`). Comportement PRE-4 changé sans décision. **patch** (absorption, assertion rétablie). |
| B2 | Libellés Regular 12 appliqués aussi aux cadres Côtés et Cadence, contrairement à leur commentaire | low | FR-27 / PR-03 visent tous les libellés de ligne, Figma idem ; seul le commentaire est faux. **patch** (commentaire). |
| B3 | `ROW_LABEL_FONT_SIZE` doublonne `type.supporting` | false | `type.supporting` porte une hauteur de ligne de 15 ; la constante porte le relevé Figma du libellé. |
| B4 | `MIXED_STOP_CONDITION_WIDTH` recopie l'écart privé de 2 | low | Réel mais l'écart est figé par Figma ; l'exporter élargirait l'API. Rejeté. |
| B5 | Fond des cadres en littéral hexadécimal | false | Exigé : constante locale nommée, `tokens.ts` inchangé (UX-DR1, NFR-3). |
| B6, V-a | Test `PRE4-3.6/T10` du réducteur dupliqué après retrait de `MODE` | low | Vérifié. **patch** (`SIDE`). |
| B7 | Test « surfaces retirées » sans effet à l'exécution | low | `@ts-expect-error` est vérifié par `tsc`, qui fait partie des contrôles. Rejeté. |
| B8 | Test « variables mixtes » sans retour à l'homogène en Variables N ≥ 2 (AC5) | medium | Vérifié. **patch** (test à trois lignes). |
| B9 | Test « variables vides » sans assertion sur le ✓ | low | Vérifié. **patch**. |
| B10 | Cas non testés : À l'échec sans Mode, N = 1 `variable: true`, Android | low | Couverts au domaine par la story 2.1 (`setStopCondition`, `effectiveUniform`) ; rendu Android non recetté par décision. Rejeté. |
| B11 | Nom accessible du Mode réduit à « Mode » | low | Libellé PR-01 ; l'onglet annonce la valeur. Rejeté. |
| B12 | Options indisponibles avec phases sans raison annoncée | low | Phases livrées en 2.8 ; l'état « indisponible » est annoncé. Rejeté. |
| B13, V-b | Reliquats : nom `chooseExecutionRegime`, `pressInExecutionSheet` réduit, branche `FAILURE` défensive, README des helpers | low | README faux vérifié : **patch**. Le reste garde ses appelants ; rejeté. |
| B14 | `chooseInline` dépend de l'identité du Brouillon inchangé | false | Garantie et testée par la story 2.1 (transition refusée ou sans effet : Brouillon inchangé). |
| B15 | Expression « Cible / Définie / Ordre » sensible à la casse | low | « À la cible » est un libellé PR-01 admis. Rejeté. |
| V1 | Re-choisir le Mode affiché : désélection du tableau (Q40) non prouvée | low | Vérifié. **patch** (assertion dans `PRE4-3.6/AC9`). |

Correctifs appliqués par le sous-agent d'implémentation (E1, E2, E4/E5, B2, B6, B8, B9, B13, V1) ; un test Q39 appuie désormais deux fois (le premier appui ferme la roue sans appliquer, T10). Après correctifs : 117 suites, 3 022 tests, `tsc` et lint verts. Rien de différé.

## Design Notes

- Cadres : `execution-sheet-frame-execution` (Mode, Condition d'arrêt), `-series` (Nombre de séries, puis `variableGroup` = Type de série + tableau + message de retrait, puis Durée / Répétitions et Pause en identiques), `-sides` (Changement de côté, Ordre, Pause entre les côtés), `-cadence` (Bip, Durée totale + message d'ajustement, Compte à rebours, Fin). Séparateurs seulement entre lignes d'un même cadre ; les cadres sont des enfants directs de l'hôte des panneaux, espacés de 8 (`gap` ou marge).
- Repère unique, par exemple `anchorTop(frame, yInFrame) = frameBoxes[frame].y + yInFrame` : Cible commune et Pause → cadre Séries ; cellule → cadre Séries + `variableGroupY` + tableau + ligne + cellule ; Côté, Ordre → cadre Côtés ; Durée totale → cadre Cadence. Réserve `panelRoom` mesurée contre le bas du dernier cadre. Panneau rendu dans l'hôte, hors des cadres.
- Condition d'arrêt : identiques effectives (`!showVariableTable`) → segmenté interactif sur `stopConditionOf(effective)` (`TARGET` / `FAILURE`), `onChange` → `update(setStopCondition(draft, choix))`. Variables → `readOnly`, valeur dérivée ; `MIXED` → une seule option `MIXED` ; `NONE` → `Text` « — » à droite, élément accessible « Condition d'arrêt, aucune valeur » (rôle texte). TestIDs : `execution-sheet-stop-condition-control`, `execution-sheet-stop-condition-none`.
- Mode : `execution-sheet-mode-control` (options `-REPETITIONS`, `-DURATION`), `value={draft.mode}`, `onChange` → `update(setMode(...))`. Type de série : `execution-sheet-series-type-control` (options `-VARIABLE`, `-UNIFORM`), `onChange` reprend la logique de l'ancien `regimeSelector` (sans `closeAfterChoice`), `onChevronPress` reprend celle de l'ancien `DisclosureControl` ; chevron `up` si déployé ; `chevronAccessibilityLabel` = `showTable` / `hideTable`.
- Le choix d'un segmenté hors tableau désélectionne le tableau (Q40) et ferme la surface ouverte (`closeAll`), comme l'ancien choix en panneau.
- Helpers de test : `chooseExecutionMode(label)` presse l'option du segmenté ; `chooseExecutionRegime` accepte les libellés en minuscules ou capitalisés et presse l'option.

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Recette iPhone du lot Feuille (après 2.8) : R-2.4-01 à R-2.4-08 ; aucun constat fabriqué.
