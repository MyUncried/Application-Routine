---
title: 'Story 2.7 — Charge dans la Feuille, en séries identiques et variables'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '1a8ff8ab4f25bdff276543c920b7db8b3babd67b'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/spec-2-2-essai-champ-clavier-charge.md'
  - '{project-root}/_bmad-output/pre5/recette-iphone-pre5.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La story 2.2 a posé la charge dans la Feuille avec ses composants définitifs (essai réussi sur iPhone, 19/10), mais en séries identiques la valeur est une pastille séparée à gauche du segmenté, alors que Figma `9289:17849` montre « 20 kg » dans le segment Avec lui-même ; et, avec la colonne Charge, le tableau des séries ne tient pas à 375 de large (321 nécessaires, environ 301 disponibles, `deferred-work.md`).

**Approach:** Story 2.7 de `epics.md` (AC1 à AC6), avec les décisions de recette RC-1 à RC-9 qui font foi (RC-2 : Avec n'ouvre pas le clavier et n'active aucun champ). En identiques, le `KeyboardField` commun devient le contenu de l'option Avec sélectionnée (`selectedContent` existant du `SegmentedControl`, largeur 62 inchangée) : il affiche `formatLoadKg` et son toucher lui donne le focus. Tableau : l'écart de 20 après l'amorce absorbe d'abord le manque de largeur. Tout le reste (transitions, hook, barre, navigation, colonne, lexique) est réutilisé tel quel, et prouvé par des tests (Δ48 compris).

**Décisions :**
- Valeur dans le segment dès que la charge est Avec en identiques (0,25 kg à la première activation, sans focus — RC-2) ; en variables, l'option garde « Avec » (Figma `9290:17953`).
- Champ actif dans le segment : fond `#EAEAFF` existant du champ actif et texte primaire (le texte blanc sur fond clair serait illisible) ; au repos, texte blanc Semi Bold 12 de l'option sélectionnée.
- Tenue à 375 : écart de l'amorce rétrécissable (en-tête et lignes), cellules inchangées ; à juger sur iPhone.

## Boundaries & Constraints

**Always:** composants de 2.2 conservés (`KeyboardField`, `useSheetKeyboard`, barre de RC-1, surface `keyboard`) ; `testID` du champ commun inchangé (`execution-sheet-load-input`) ; une seule surface ; textes par `src/shared/i18n/` ; fins de ligne CRLF ; tests existants verts sans affaiblissement.

**Never:** nouveau composant, dépendance ou build ; `SegmentedControl` modifié dans son comportement (seul un style déjà interne peut être exporté) ; `tokens.ts` ; `ScrollView` ou `KeyboardAvoidingView` ajouté ; ouverture automatique du clavier ; migration ; phases (2.8).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Activation identiques | Sans → Avec | segment Avec affiche « 0,25 kg », aucun focus | — |
| Toucher le segment | Avec à 20 kg | focus du champ, texte « 20 » sélectionné, barre | — |
| Saisie | « 1,3 » puis Fermer | segment « 1,5 kg » | illisible → valeur précédente |
| Zéro identiques | « 0 » puis fermeture | Sans, segment « Avec » | — |
| Variables | Avec | option « Avec », colonne Charge | — |
| Δ48 | Répétitions × Identiques / Variables, cible À l'échec | mêmes règles qu'en Durée ; ligne Charge présente | — |

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx` (CRLF) -- ligne Charge (~l. 1770-1802) : retirer la pastille séparée (`styles.loadControls`, `styles.loadInput`) ; option WITH du `SegmentedControl` de la Charge avec `selectedContent` = `KeyboardField` commun quand `uniformLoadShown` (mêmes rappels qu'aujourd'hui), style plein cadre de l'option (62 × 26, rayon 5, texte centré) + texte primaire si actif. `chooseLoad`, `focusLoad`, `VariableTable` (colonne) inchangés.
- `src/shared/ui/SegmentedControl.tsx` (CRLF) -- exporter le style du libellé sélectionné non réduit (`inlineSelectedLabelStyle`, à côté de `inlineSelectedCompactLabelStyle`) et la hauteur d'option si nécessaire ; aucun changement de rendu.
- `src/features/activities/sheetTable.tsx` (CRLF) -- `leadColumn` : écart de 20 rendu par une vue d'écart rétrécissable (`flexShrink` élevé) au lieu de `marginRight` ; `tableStyles.headerLead` découpé de même (amorce 38 + écart rétrécissable) pour garder en-tête et lignes alignés. `PAUSE_CELL_NOMINAL_X` (Feuille) reste la position avant mesure.
- Lexique : clés présentes depuis 2.2 (`load`, `loadWith`, `loadWithout`, `loadValue`, `columns.load`, `rowLoad`, barre) ; rien à ajouter sauf besoin de nom accessible.
- Tests : `src/features/activities/__tests__/ExecutionParametersSheet.test.tsx` -- nouveau bloc « PRE-5 story 2.7 » ; réviser par conception seulement ce que le déplacement du champ casse.

## Tasks & Acceptance

**Execution:**
- [x] `SegmentedControl.tsx` -- export du style du libellé sélectionné -- AC1.
- [x] `ExecutionParametersSheet.tsx` -- champ commun dans le segment Avec, pastille retirée -- AC1, AC3.
- [x] `sheetTable.tsx` -- écart d'amorce rétrécissable -- tenue à 375.
- [x] Tests -- valeur dans le segment, toucher → focus, actif, variables « Avec », ligne Charge sous À l'échec (Durée et Répétitions), Δ48 (Répétitions × Identiques, Répétitions × Variables, À l'échec avec charge), Sans conserve après ✓ et réouverture, déplacement avec sa charge, écart d'amorce rétrécissable et identique en-tête / lignes -- AC1 à AC5.

**Acceptance Criteria:**
- Given la story livrée, when on lance `npm test`, `npx tsc --noEmit`, `npm run lint`, then tout est vert.
- Given la Feuille sous Sans, when elle s'affiche, then rien ne change hormis l'absence de pastille.

## Implementation Notes

- Checkpoint 1 (2026-10-19) : aucune question ouverte (RC-2 tranche l'ouverture du clavier ; Figma `9289:17849` et `9290:17953` relevés en lecture seule) ; approbation pré-autorisée par Hermann (enchaînement sans approbation par story).
- Implémentation (sous-agent) : champ commun dans l'option Avec (`selectedContent` existant, 62 × 26, rayon `INLINE_OPTION_CONTENT_RADIUS`, libellé sélectionné `inlineSelectedLabelStyle` exportés par `SegmentedControl.tsx` sans changement de rendu) ; actif : fond `#EAEAFF` et texte primaire ; nom de l'option « Avec, 20 kg » tant que la valeur y est ; pastille séparée retirée. Tableau : écart de 20 après l'amorce en vue propre (`tableStyles.leadGap`, `flexShrink` 1000) dans l'en-tête et les lignes, `headerLead` à 38. Aucun nouveau composant, aucune clé de lexique (clés de 2.2 suffisantes).
- Tenue à 375 (entrée de `deferred-work.md` issue de 2.6) : l'écart absorbe presque tout le manque (≈ 20 pt sur 20) ; les cellules gardent ≈ 71. Attendu par le calcul, non mesuré : à juger sur iPhone. Le ± de la Pause suit déjà la cellule mesurée (2.2).
- Tests : bloc « PRE-5 story 2.7 » (13 tests) ; aucun test existant modifié. Contrôles finaux : 120 suites, 3 152 tests, `npx tsc --noEmit` et `npm run lint` verts.
- Recette iPhone R-2.7-01 à 07 en attente (lot Feuille) ; aucun constat fabriqué.

## Spec Change Log

## Review Triage Log

Passe 1 (2026-10-19) — couches : Blind Hunter (B), Edge Case Hunter (E), Verification Gap (V, aucun écart).

| # | Constat | Verdict | Preuve / route |
|---|---|---|---|
| B3, E3 | `lineHeight` 16 hérité par un `TextInput` d'une ligne : texte et curseur décentrés sur iOS | medium | Vérifié (`inlineSelectedLabelStyle` porte `lineHeight`). **patch** : `lineHeight` neutralisé dans `loadSegmentInput`, test. |
| B4 | Sous le champ, l'onglet « Avec » n'annonce que « Avec » | low | Vérifié. **patch** : nom « Avec, 20 kg » tant que la valeur est dans le segment. |
| B1 | `LOAD_SEGMENT_RADIUS` recopie `INLINE_OPTION_RADIUS` | low | Vérifié (dérive possible si le rayon `inline` change). **patch** : constante exportée par `SegmentedControl.tsx`. |
| B7, E4 | « l'écart rétrécit en premier » : Yoga pondère par `flexShrink × largeur`, les cellules rétrécissent aussi | low | Vérifié : ≈ 20 × 213 / 20 213 ≈ 0,2 pt au total pour les trois cellules. **patch** : formulation corrigée. |
| B2, E1, V-a | Valeur longue tronquée dans l'option de 62 (pas de borne de charge) | low | « 102,75 kg » ≈ 56 pt tient ; le débordement suppose ≥ 1 000 kg, improbable ; correctif (largeur d'option suivant le contenu) non trivial. Rejeté ; à observer en recette. |
| E2, V-a | Texte agrandi (Dynamic Type) rogné à 26 de haut | low | Même contrainte que toutes les options `inline` (hauteur fixe Figma) : entrée existante de `deferred-work.md` (2.3, Dynamic Type). Rejeté ici. |
| B5 | Sans touché pendant la saisie : champ démonté, saisie perdue | false | `chooseLoad` applique `keyboard.flush` avant `setLoadEnabled` ; couvert par le test 2.2 « Sans pendant la saisie : la valeur est appliquée avant la désactivation ». |
| B6 | Le test « toucher le segment » simule le focus | low | Le contenu de l'option est en `pointerEvents="box-none"` (composant, testé en 2.3) ; le toucher réel relève de R-2.7-01. Rejeté. |
| B8, E5 | `PAUSE_CELL_NOMINAL_X` suppose l'écart de 20 | low | Position avant la première mesure seulement (un rendu) ; le ± suit ensuite la cellule mesurée. Rejeté. |
| B9 | Entrée de `deferred-work.md` (tenue à 375) non close | low | Le workflow interdit de modifier une entrée existante ; traitement consigné dans les notes d'implémentation. Rejeté. |
| B10 | En-tête et lignes pourraient rétrécir différemment | false | Même suite de colonnes : amorce 38, écart partagé, titres et cellules 71 à `flexShrink` 1, croix 36 des deux côtés. |
| B11 | Texte blanc sur fond clair pendant le glissement du cadre | false | Comportement identique de tout libellé sélectionné du composant (couleur posée au rendu, cadre animé). |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Recette iPhone R-2.7-01 à 07 par Hermann (lot Feuille) ; aucun constat fabriqué.
