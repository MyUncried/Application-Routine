---
title: 'Story 3.4 — Sélecteur de cible en Durée : option échec et grisé manipulable'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: 'a8db7fdd0ee14ae73af85c7838adb0c8a8900af1'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-3.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La roue de la Cible commune en Durée s'ouvre déjà dans le panneau sans flèche sous le champ (Q41). Mais elle ne propose pas l'option « Aucune durée, à l’échec » (écart de recette E-09). Elle accepte `00:00`, va jusqu'à 99 minutes et n'a ni le grisé manipulable de l'échec, ni l'ouverture normalisée sur la Cible.

**Approach:** Implémenter la **story 3.4 (AC1 à AC12, `epics-parts/epic-3.md`)**, dans sa version amendée par Q36 (Durée à la seconde, bornes 5..3535) et par Q41 (panneau sans flèche). Le travail se fait en **étendant** `DurationWheelPicker` par des props optionnelles :
- bornes, avec un maximum de 3535, soit 58 min 55 s ;
- `failureOption` typée ;
- `validateDisabled` dans les deux copies de `PickerToolbar`.

Ce travail ajoute aussi `nearestGridValue` et `selectorOpeningPosition` au domaine, et un grisé par opacité autour de la roue. Le mécanisme natif reste inchangé.

## Boundaries & Constraints

**Always:**
- `DurationWheelPicker` : props optionnelles seulement ; sans elles, le comportement actuel est inchangé (Composition, roulette des tours, Durée totale). Le pas des secondes reste à 1 (Q36) ; `WHEEL_SECONDS_STEP` n'est pas modifié. Les minutes vont de 0 à 58 sans reboucler (H15), les secondes de 0 à 59, et de 0 à 55 à 58 minutes. La position `00:00` reste présente. `failureOption` émet une `SeriesTarget` `FAILURE`, jamais un nombre ; avec elle, le rappel numérique n'est jamais appelé pour l'échec. Le grisé passe par l'opacité `UNSELECTED_OPACITY` (0,45) autour de la roue, jamais par `disabled`. Faire tourner la roue revient au numérique, sans déverrouillage.
- `PickerToolbar` : **une seule** prop optionnelle ajoutée, `validateDisabled`, à l'identique dans `DurationWheelPicker.tsx` et `NumberWheelPicker.tsx`. Le ✓ reçoit alors `disabled`, `accessibilityState={{ disabled: true }}` et `UNSELECTED_OPACITY`. ✕ reste disponible. Le ✓ est indisponible sur `00:00` en sélection numérique.
- Domaine (`ExecutionParameters.ts`), deux fonctions pures :
  - `nearestGridValue(mode, value)` borne la valeur à 5..3535 en Durée et à 1..100 en Répétitions (Q36 : sans multiple de 5) ;
  - `selectorOpeningPosition(mode, target)` : `NUMBER` → `nearestGridValue` ; `FAILURE` → option échec ; `UNSET` → 5 s en Durée, 1 en Répétitions (Q25).
  
  La ligne de la Feuille garde la valeur d'origine pendant l'ouverture. Rien n'est appliqué avant ✓.
- Feuille : la roue de la Cible commune Durée garde la présentation validée (`AnchoredPanel` sous le champ, aligné à droite, sans flèche, Q41) et la surface unique (`sheetSurface`). ✓ dispatche au Brouillon (`setUniformTarget`), ✕ et un toucher extérieur ferment sans appliquer. La ligne affiche `à l’échec`, `—` sur `#FFF1F0` ou la durée formatée.
- Hors iOS, la roulette `Legacy*` porte la même option et les mêmes transitions, avec une parité testée.
- Les garde-fous zéro `ScrollView` (`DurationWheelPicker.test.tsx:378`, `:619` ; `NumberWheelPicker.test.tsx:267`) restent intacts et verts. Aucun jeton n'est modifié. Les textes passent par le lexique : « Aucune durée, à l’échec » et les annonces VoiceOver.

**Never:**
- Ni remplacement ni réimplémentation de la roue ou de `PickerToolbar` ; pas de troisième roulette ; aucune sentinelle numérique pour l'échec ; aucune haptique ajoutée.
- La variante Répétitions relève de la story 3.5, la cellule du tableau de la 3.6, la roulette de Durée totale de la 3.7.
- Ne pas retravailler l'ergonomie validée (panneaux, animations, sélection).

</frozen-after-approval>

## Code Map

- `src/features/sessions/DurationWheelPicker.tsx` :
  - branche iOS (`Host` + `SwiftUIPicker`) et `PickerToolbar` (l.~315) ;
  - branche `Legacy*` ;
  - props `totalSeconds` et `maxTotalSeconds` existantes ;
  - `wheelPickerMath.ts` pour la décomposition en minutes et secondes.
- `src/features/sessions/NumberWheelPicker.tsx` : seconde copie de `PickerToolbar`, qui reçoit seulement la prop `validateDisabled`.
- `src/domain/activities/ExecutionParameters.ts` : `EXECUTION_BOUNDS` (Durée 5..3535 depuis Q36), avec les nouvelles fonctions à placer à côté.
- `src/features/activities/ExecutionParametersSheet.tsx` :
  - roue de la Cible commune dans `AnchoredPanel` ;
  - `UNSET_WHEEL_OPENING_SECONDS` ;
  - `FailureTargetText`, l'affichage actuel de la ligne à l'échec ;
  - `sheetSurface`.
- `src/shared/ui/opacity.ts` (`UNSELECTED_OPACITY`) ; `src/shared/i18n/`.
- Tests :
  - `src/features/sessions/__tests__/DurationWheelPicker.test.tsx` et `NumberWheelPicker.test.tsx`, dont les garde-fous ;
  - `ExecutionParametersSheet.test.tsx` ;
  - `ExecutionParameters.test.ts`.
- Relevé visuel de `8328:37862`, `8328:37760` et du maître `8452:13297`, depuis `docs/preparation/PRE-4/figma/*.json.gz` et le fichier des maîtres, à consigner dans les Implementation Notes.

## Tasks & Acceptance

**Execution:**
- [x] Relevé visuel.
- [x] Domaine : `nearestGridValue`, `selectorOpeningPosition` et leurs tests.
- [x] `DurationWheelPicker` : props optionnelles (bornes, `failureOption`, `validateDisabled`), grisé et transitions ; `PickerToolbar` `validateDisabled` dans ses deux copies.
- [x] Feuille : roue de la Cible commune avec l'option échec, l'ouverture normalisée, `00:00` refusé, ✓ et ✕ ; affichage de la ligne.
- [x] Tests `PRE4-3.4/AC1` à `AC12`. Recette `recette-iphone.md` §4.3 : R-3.4-01 à 06. Écart E-09 → « Corrigé, à retester par Hermann ».

**Acceptance Criteria:**
- Given la story 3.4 et les décisions Q36 et Q41, when elle est livrée, then chacun de ses critères AC1 à AC12 est vérifié par un test nommé ; les usages existants de `DurationWheelPicker` sont inchangés ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

**Relevé visuel (D-255 : aucun chiffre n'y devient une règle).** Sources : `docs/preparation/PRE-4/figma/8328-37862.json.gz`, `8328-37760.json.gz`, maître `8452:13297` dans `sources-caa2a5cf/.../fermeture-maitres-et-variables.json.gz`.

| Élément | État | Figma | Code |
|---|---|---|---|
| Surface du Sélecteur (`8328:37966`) | ouvert | 354 × 249, `#F6F6F9`, contour `#C7C7D1` 70 %, rayon 16, barre ✕ / ✓ en tête (48 × 53) | `DurationWheelPicker` inchangé (330, sa propre surface), dans `AnchoredPanel` (Q41) |
| Option « Aucune durée, à l’échec » (`8452:13319/13320`) | non choisie | 330 × 30, texte centré Regular 20, `#1A1A1F` à 45 % | hauteur 30, `type.body` porté à 20/24, `colors.textPrimary`, opacité `UNSELECTED_OPACITY` ; `hitSlop` 7 + 7 → 44 |
| Option | choisie | sans frame | opacité 1 ; bloc minutes-secondes à 0,45 (`NON VÉRIFIABLE`) |
| Filet (`8452:13321`) | — | 330 × 1, `#E0E3E8`, sous l'option | 1 pt, `colors.border` (`#E0E3E8`) |
| Roue (`8452:13298`) | numérique | 330 × 150, deux colonnes, niveaux 100 / 45 / 20 / 10 %, unités « minutes » / « secondes » | primitive native inchangée (rendu natif prime, P33 ; unités `min` / `s` existantes) |
| ✓ du Sélecteur | indisponible sur `00:00` | sans frame | `NON VÉRIFIABLE` : `disabled`, état d'accessibilité, opacité 0,45 |
| Ligne `Durée d’une série` (`8328:37840`, `8328:37944`) | repos / sélectionnée | pastille 84 × 24 `#F5F7FA`, texte Semi Bold 13 `#0508E5` ; cadre sélectionné `#F4F4FF` | pastille existante ; `à l’échec`, `—` sur `#FFF1F0` (Q35) ou durée formatée |

**Choix d'intégration.**
- `DurationWheelPicker` : deux props optionnelles, `targetBounds` (remplace `maxTotalSeconds` quand elle est donnée) et `failureOption` (`onValidateFailure` reçoit `{ kind: "FAILURE" }`, type `FailureSeriesTarget` du domaine) ; `failureOption` exige `targetBounds` (union de props). `validateDisabled` est calculé dans le composant (sélection numérique sous la borne basse) et transmis à `PickerToolbar` ; pas de prop `validateDisabled` exposée par `DurationWheelPicker`.
- AC2, lecture littérale (« valeurs proposées de 00:05 à 58:55, plus la position 00:00 ») : sous `targetBounds`, la colonne des secondes propose `00` puis `05..59` à 0 min, `00..55` à 58 min, `00..59` sinon (`boundedSecondsValues`, `wheelPickerMath.ts`). Une seconde absente de la liste (changement de minute, ou valeur native hors liste) est recalée par `snapBoundedSeconds` : la plus proche (58:57 → 58:55) ; à 0 min, vers 00:05, jamais 00:00 (décision de revue : 00:00 n'est atteint que par la roue elle-même ou par l'option échec). Sans `targetBounds`, la liste reste fixe 00..59 : Composition, roulette des tours et Durée totale inchangées.
- Legacy : état React des minutes et secondes ajouté (liste des secondes, ✓ indisponible) ; colonne réalignée sans animation au changement de minute, seulement sous `targetBounds`.
- Feuille : `UNSET_WHEEL_OPENING_SECONDS` retiré au profit de `selectorOpeningPosition` ; la Cible `FAILURE` en Durée s'affiche dans la pastille (`à l’échec`) qui rouvre le Sélecteur ; `FailureTargetText` reste pour Répétitions (3.5) et les cellules (3.6).
- Test `PRE4-Q41` (panneau de la Cible) : la liste des éléments tactiles du panneau inclut désormais l'option échec.
- Lexique : `durationFailureOption` (`strings.executionParameters.sheet`). L'état de l'option est annoncé par le seul état natif `selected` (décision de revue : un seul canal), sans valeur textuelle.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). Décision de Claude, appliquée sans redemander (consigne de Hermann) : à la minute 0, le recalage numérique vise 00:05 (`bounds.min`), jamais 00:00.

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| E1 — iOS : seconde reçue absente de la liste courante, valeur validée différente de l'affichée | medium | `handleSecondsChange` sans recalage | patch |
| E2/V-autre — descente à la minute 0 : recalage sur 00:00, ✓ indisponible sans choix | medium | `nearestWheelValue` vers 0 | patch (vers 00:05) |
| B1/E3/E4/V-autre — Legacy : `now` figé à l'ouverture (accessibilité) | medium | `now={initial.*}` | patch |
| V1/E7 — Legacy : remappage des secondes au changement de minute non prouvé ; `onScroll` avant réalignement | medium | Aucun test ne change seulement la minute sous bornes | patch (tests et garde) |
| V2 — Legacy : action d'accessibilité sous bornes non testée | low | | patch (avec le correctif de `now`) |
| B3 — état de l'option annoncé deux fois | low | `accessibilityState` + `accessibilityValue` | patch |
| B5 — `failureOption` sans `targetBounds` : 00:00 validable | low | Combinaison non utilisée par la Feuille | patch (type) |
| B4 — `validateDisabled` de `NumberWheelPicker` non testé | low | Copie identique exigée par AD-7 | patch (test) |
| B6/E6 — `boundedSecondsValues` : pas implicite, bornes basses partielles, aucun test direct | low | | patch |
| B7/E5 — `nearestGridValue` : ±Infinity, NaN, non-entiers non testés ; nom | low | Le nom est l'identifiant d'AD-16 | patch (comportement, tests, JSDoc) ; rejeté pour le renommage |
| B2 — READMEs périmés | low | Règle d'`AGENTS.md` | patch |
| B10 — tests de la Feuille plus faibles que leurs titres | low | | patch |
| B8 — recette R-3.4-03 sans origine de la donnée 5999 s | low | « R4 Marche » du §2 | patch |
| B9 — saut de la roue native au changement de liste non vérifiable sous Jest | low | Rendu natif | patch (recette R-3.4-04) |
| B11 — `eslint-disable` de l'effet Legacy | low | | patch (fusion ou justification) |
| B12 — artefacts hors du diff | false | Fichiers de l'orchestrateur | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
