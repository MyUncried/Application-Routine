---
title: 'Story 2.6 — Tableau des séries sans steppers de cellule, lignes de 36'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '49036ac93d08d935e61713d5b3f8b7b305899f56'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/spec-2-4-feuille-en-quatre-cadres-execution-et-type-de-serie.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le tableau des séries variables garde deux `InlineStepper` permanents par ligne (128 pt chacun), des lignes de 44 et ses briques (`DraggableRow`, `RemoveRowButton`, message d'annulation) enfermées dans la Feuille : la colonne Charge (2.2, 2.7) n'y tient pas et le tableau des phases (2.8) ne peut pas les réutiliser.

**Approach:** Story 2.6 de `epics.md` (AC1 à AC5, qui font foi) : tableau à fond blanc, lignes de 36, cellules à valeur seule (Figma `9290:17953`, 71 × 24) ; la cellule Cible ouvre la roue existante (`selector(rowTarget)`, panneau sous la ligne sur iOS) ; la cellule Pause ouvre `stepper(rowPause(row))`, l'`InlineStepper` existant de cette seule cellule ; briques du tableau extraites dans un module partagé ; colonnes de largeur fixe laissant la place d'une troisième cellule de 71 (Charge, 2.7).

## Boundaries & Constraints

**Always:** surfaces désignées par l'identité de ligne (`rowIds`) ; au plus une surface ; `stepper(rowPause)` suit la famille ± (toucher une autre surface la ferme et ouvre l'autre dans le même geste, ses ± ne la ferment jamais, appui extérieur la range, « ligne disparue » la ferme, ✓ / ✕ non absorbés) ; glisser PRE-3, actions accessibles, croix (disque 28 accepté), « Série supprimée — Annuler » (`#FFF1F0` pour une valeur à renseigner, Q35) conservés ; stepper « Nombre de séries » et Pause commune inchangés (NR Δ38, C-5) ; le tableau suit N avec ses réserves (Q29) ; mesures Figma en constantes locales nommées ; fins de ligne existantes (Sheet en LF, autres en CRLF).

**Never:** aucun constat iPhone fabriqué (AC1 : Hermann) ; aucune colonne Charge ni clavier (2.2, 2.7) ; aucun `WorkPhasesTable` (2.8) ; aucun composant de saisie nouveau, `tokens.ts`, roues et gardes zéro-`ScrollView` intacts ; domaine inchangé ; aucune migration, push, EAS, modification Figma.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cellule Cible | toucher « 30 s » ligne 2 | roue de la ligne 2 sous la ligne, « À l'échec » en tête ; ✓ → seule ligne 2 | — |
| Cellule Pause | toucher « 10 s » ligne 1 | ± de la Pause de la ligne 1 seule, sous sa cellule ; ± ne ferment pas | — |
| Autre surface | ± Pause ligne 1 ouvert, toucher Cible ligne 2 | ± fermé, roue ligne 2 ouverte, même geste | — |
| Croix | ± Pause ouvert | appui = rangement, aucune ligne retirée | — |
| Ligne disparue | ± Pause ligne 3 ouvert, N 3 → 2 | surface fermée | — |
| Valeur à renseigner | Cible `UNSET` | « — » sur `#FFF1F0`, annoncé « aucune valeur » | — |
| N suit | stepper N + puis − | ligne ajoutée puis retirée, réserves restaurées (Q29) | — |

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx` (LF) -- `VariableTable` (l. 1806-1969) : remplacer les deux `InlineStepper` par des cellules ; `DraggableRow` (l. 2012), `RemoveRowButton` (l. 1978), `InsertionGuide` (l. 289), `adjustmentMessage` (l. 1301), `dragDestination`, `tableRowIdentity`, `TABLE_ROW_HEIGHT` (l. 405), `HANDLE_HIT_SLOP`, `REMOVE_HIT_SLOP` → module partagé (ré-exportés depuis la Feuille pour les tests). `targetStepRule` et `stepRuleFor` disparaissent (plus de ± de Cible). `tableSelected` (l. 548) inclut `stepper(rowPause)`. `updateInTable` ferme les surfaces : le ± de Pause de ligne passe par une mise à jour qui garde la surface. `RevealStepper` (l. 2214) : extraire la partie « champ ouvert » (rétention du toucher, actions escape / magicTap / « Fermer », focus VoiceOver) pour la réutiliser dans la cellule Pause, sans changer son comportement.
- `src/features/activities/sheetTable.tsx` (nouveau, CRLF) -- briques partagées : `DraggableRow` (libellés et préfixe de `testID` en props), `RemoveRowButton` (libellé en prop), `InsertionGuide`, `UndoMessage` (message d'ajustement / retrait, inchangé), `dragDestination`, `tableRowIdentity`, `TABLE_ROW_HEIGHT` = 36, géométrie Figma.
- `src/features/activities/sheetSurface.ts` (CRLF) -- `{ kind: "stepper"; field: "rowPause"; row: number }` ; `sameSurface` compare `row` ; `rows` ferme aussi `rowPause` disparu.
- Tests : `ExecutionParametersSheet.test.tsx` (±  de cellule : `-target-increment`, `-pause-increment`, `-target-value-press`, hauteur 44 l. 2161, 4909), `sheetSurface.test.ts`, `ExerciseEditingPaths.integration.test.tsx` (`measureTableRow`, `enterRowTarget`, `stepTo` des Pauses), `testing/executionSheetActions.ts` (commentaire Q44 : les cellules s'ouvrent désormais par `-toggle`).

## Tasks & Acceptance

**Execution:**
- [x] `src/features/activities/sheetSurface.ts` + test -- surface `rowPause` -- AC3.
- [x] `src/features/activities/sheetTable.tsx` -- extraction des briques, lignes de 36, cibles 36 -- AC1, AC4.
- [x] `src/features/activities/ExecutionParametersSheet.tsx` -- tableau Figma, cellules ouvrantes, ± de Pause par cellule -- AC2, AC3, AC5.
- [x] Tests de la Feuille, d'intégration et helpers -- révisés par conception (± retirés, hauteur 36) sans affaiblir ce qu'ils prouvent ; cas nouveaux de la matrice.

**Acceptance Criteria:**
- Given la story livrée, when on exécute `npm test`, `npx tsc --noEmit`, `npm run lint`, then les trois sont verts.
- Given le tableau variable, when il s'affiche, then aucun `InlineStepper` n'est rendu tant qu'aucune cellule Pause n'est ouverte, et chaque ligne mesure 36.
- Given `DurationWheelPicker.test.tsx:371` et `NumberWheelPicker.test.tsx:260`, when la suite tourne, then ils sont inchangés et verts.

## Implementation Notes

- Checkpoint 1 (2026-10-19) : spec d'environ 1 900 tokens conservée entière (story M, une seule réécriture du tableau) ; aucune question ouverte ; approbation pré-autorisée par Hermann (développement PRE-5 autorisé le 2026-10-19, enchaînement sans approbation par story).
- Implémentation (sous-agent) : module partagé `sheetTable.tsx` (`DraggableRow`, `RemoveRowButton`, `InsertionGuide`, `UndoMessage`, `TableCell`, `tableStyles`, `TABLE_ROW_HEIGHT` = 36, cibles de 36 : poignée `hitSlop` 9/9/4/20, croix 4, cellules +6) ; `TableCell` est une brique d'affichage qui n'ouvre que des sélecteurs existants (réutilisée en 2.8), pas un composant de saisie. Partie « champ ouvert » de `RevealStepper` extraite en `useOpenFieldFocus` + `OpenStepperField`, comportement inchangé. La roue de ligne s'ouvre sous la ligne (iOS). Choix d'intégration : cellule Cible = bouton (plus « ajustable ») ; avec un panneau ou une roue ouverte, le premier toucher d'une cellule Pause ne fait que fermer (T10). Tests : environ 30 révisés par conception (± de Cible retirés, hauteur 36, géométrie du panneau), 5 tests du réducteur, bloc « PRE-5 story 2.6 » pour la matrice (« ligne disparue » couverte au réducteur).
- Contrôles finaux (après correctifs de revue) : 117 suites, 3 034 tests, `tsc` et lint verts. Aucun constat iPhone : R-2.6-01 (AC1) à jouer par Hermann.

## Spec Change Log

## Review Triage Log

Passe 1 (2026-10-19) — couches : Blind Hunter (B), Edge Case Hunter (E), Verification Gap (V : aucun écart de vérification).

| # | Constat | Verdict | Preuve / route |
|---|---|---|---|
| E1 | Roue de ligne (iOS) ancrée sur la hauteur mesurée de la ligne, qui inclut encore la ligne ± de Pause pendant sa fermeture : panneau trop bas | low | Vérifié : `cellBottomInFrame` additionne `cellRowBox.height`. **patch** (`TABLE_ROW_HEIGHT`, ligne fixe de 36). |
| B1 | ± de la Pause (128) dans une colonne de 71 : − et + hors des limites du parent (non atteignables sur Android) ; zone tactile verticale rognée | medium | Vérifié (`cellStepperColumn` 71, `alignItems: center`). **patch** (colonne à la largeur du stepper, recentrée). Rognage vertical de 2 pt : négligeable, rejeté. |
| E2 | Cellules rétrécissables : le ± de Pause ne suit plus sa cellule si la ligne rétrécit | low | Aucun rétrécissement en 2.6 (243 nécessaires, ≥ 246 disponibles dès 320 de large) ; survient avec la colonne Charge (2.7). **defer**. |
| B2 | Ligne fixe de 36 et texte agrandi : la cellule (`minHeight`) peut déborder | low | Exception consignée de la ligne fixe (ex-44, story 3.8 AC7), seulement aux très grandes tailles. Rejeté. |
| B3 | Glisser avec un ± de Pause ouvert : calcul de destination faux | false | `onDraggingChange(true)` → `selectTable` → `closeAll` ferme le champ dès le début du glisser. |
| B4 | En-tête de la Feuille : puces 3.6 « ± permanents, `stepTarget` » contredisent le code | low | Vérifié. **patch** (puces marquées remplacées). |
| B5 | `stepTarget` sans appelant de production | low | Domaine inchangé par la spec (Never) ; fonction testée, réutilisable. Rejeté. |
| B6 | Couverture des Cibles hors bornes (5999 s, 150 rép.) supprimée | false | `PRE4-3.6/AC3` (ouverture 5999 → 58:55, 150 → 100) et `PRE4-3.4/AC4` (✓ → 3535) restent ; domaine `ExecutionParameters.test.ts:523-525`. |
| B7 | Accessibilité : Cible non « ajustable », pas d'indice d'ouverture, même nom cellule / champ ± | low | Retrait des ± voulu (R-05) ; même schéma que `RevealStepper` accepté (bouton + champ au même nom). Rejeté. |
| B8 | `#EAEAFF` en littéral | false | Exigé : constante locale nommée, `tokens.ts` inchangé (NFR-3). |
| B9 | Bord de repli du panneau (`FRAME_INSET`) égal au bord des lignes par coïncidence | false | Le repli aligne la roue sur le bord des lignes du cadre (13), indépendamment du tableau ; valeur voulue. |
| B10 | Ré-exports pour les tests dans la Feuille | low | Choix de la spec (Code Map) pour les tests existants. Rejeté. |
| B11 | `-pause-value` désigne la cellule fermée puis le champ ouvert | low | Choix de la spec (compatibilité `openExecutionSheetField`). Rejeté. |
| B12 | `TableCell.onLayout` inutilisé | low | Vérifié. **patch** (suppression). |
| V-a | Commentaire de test « 44 pt (Q42) » périmé | low | Vérifié. **patch**. |
| A1 | (Contrôle de l'orchestrateur) cellule au repos sur fond `colors.surface` ; Figma `9290:18003` : aucun fond au repos | low | Vérifié. **patch** (fond transparent). |
| A2 | (Contrôle de l'orchestrateur) espace de 36 sous la dernière ligne, dans le bloc blanc, contraire à la Design Note | false | La Design Note se trompait : AC2 d'`epics.md` (qui fait foi) « un espace d'une hauteur de ligne suit la dernière ligne », et PR-02 prime sur la capture. Code conservé ; Design Note corrigée. |

## Design Notes

- Relevé Figma `9290:17953` (lecture seule, 19/10), tableau `9290:18003` : bloc à marges 8 (côtés) et 12 (haut, bas) dans le cadre ; fond blanc rayon 8, sans contour ; en-têtes 32 de haut, Inter Medium 12 `#595E66`, centrés sur leur cellule ; lignes de 36, séparateur 1 en tête de chaque ligne, retrait 4 ; dans la ligne (retrait 4) : poignée 12 × 18 à x 0, numéro Inter Medium 14 aligné à droite sur x 14-38, cellules 71 × 24 rayon 8 à x 58, 136 (Charge 214 en 2.7), valeur Semi Bold 13 primaire, zone de la croix 36 × 36 au bord droit. Cellule active `#EAEAFF` (même relevé que 2.2). Le fond blanc garde une hauteur de ligne (36) sous la dernière ligne (AC2 d'`epics.md` ; PR-02 prime sur la capture, qui n'en montre pas — correction de la revue, A2).
- Place de la Charge : en-têtes et lignes partagent une même suite de colonnes (amorce 38 + 20, cellules 71 séparées de 7, espace souple, croix 36) ; 2.7 n'ajoute qu'une cellule. À 402 : 285 + 36 ≤ 328 disponibles. Écart 20 et cellules rétrécissables (`flexShrink`) pour les écrans de 375 (≈ 301 disponibles avec la Charge) : à juger en 2.7.
- Pause de ligne : ± rendu sous la ligne, dans le tableau (révélation `SheetMotionView`, comme la roue en ligne d'Android), centré sous la cellule Pause par la même suite de colonnes ; pas d'`AnchoredPanel`, dont la zone extérieure contredirait la famille ± (même geste). Choix d'intégration à juger en recette (R-2.6-02).
- Croix : Figma dessine la croix sans disque visible ; le disque 28 accepté (story 3.6) est conservé, cible 36 (`hitSlop` 4) au lieu de 44, comme la poignée (`hitSlop` vertical 9).
- `testID` : cellule Cible `…-target` (`-target-value`, conteneur mesuré `-target-cell`) ; cellule Pause `…-pause-toggle` (`-pause-value` fermée) ; ± ouvert `…-pause` (`-increment`, `-decrement`, `-value`) : `openExecutionSheetField` s'applique tel quel.

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- R-2.6-01 (AC1) par Hermann sur iPhone, puis R-2.6-02 et R-2.6-03 au lot Feuille ; aucun constat fabriqué.
