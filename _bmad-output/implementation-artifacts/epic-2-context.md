# Epic 2 Context: Des durées et des phrases justes pour les Cibles à l'échec

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Pour tout Exercice, y compris à Cibles mixtes, tout à l'échec ou à Cible `UNSET`, le domaine calcule une Durée totale `exact`, `estimated` (≈), `lowerBound` (≥) ou `omitted`, ou rend l'issue `incomplete`, avec un seul calcul et un seul formateur (AD-5). La Séance et le Circuit prennent la nature la plus faible de leurs contributions ; les Pauses d'un Exercice omis contribuent toujours ; une Récupération positive remplace seulement la Pause terminale. La Phrase décrit les Cibles dans l'ordre (Q16) par un seul générateur (AD-6). Les 276 phrases du corpus restent identiques, et des variantes couvrent les cas nouveaux (AD-10). Les cartes Catalogue et Composition affichent la durée selon Q17, Q20 et P41, sans « 0 s » ni « 0 rép. ».

## Stories

- Story 2.1 : Nature et montant de la Durée totale d'un Exercice
- Story 2.2 : Format des durées et agrégation de Séance
- Story 2.3 : Phrase des paramètres pour les Cibles mixtes et corpus
- Story 2.4 : Durées et résumés sur les cartes Catalogue et Composition

## Requirements & Constraints

- **Travail par Série (2.1).** Durée `NUMBER` d → connu. Répétitions `NUMBER` R avec Bip b > 0 → R × b, estimable. `FAILURE` → inconnu, avec ou sans Bip. Répétitions avec Bip 0 → inconnu, même si la Cible est numérique. Aucun forfait par répétition (D-232). En Durée, le Bip ne change pas le total.
- **Nature de l'Exercice.** Durée tout `NUMBER` → `exact`. Répétitions avec Bip, tout `NUMBER` → `estimated`. Mélange `NUMBER`/`FAILURE` → `lowerBound` ; ≥ prime sur ≈. Répétitions avec Bip 0 → `omitted`. Tout `FAILURE` → `omitted`, quels que soient le Mode et le Bip. RM-072 ne s'applique qu'au tout à l'échec, RM-129/RM-132 au mélange (P25). Montant = Σ du travail connu ou estimable + Σ de **toutes** les Pauses, Pause terminale comprise ; une Pause change le montant, jamais la nature.
- **`UNSET` (Q30, H10, H28).** Issue `incomplete`, distincte d'`omitted` : aucun total d'Exercice affiché. Ses `knownSeconds` sont calculées comme pour un mélange : 30 s / `UNSET` / 45 s avec Pauses 10 s × 3 → 105 s. La Séance qui la contient est `lowerBound`. Jamais convertie en `FAILURE` ni lue comme 0.
- **Inversion (P42).** Disponible si et seulement si : Mode Durée, Régime identiques, Cible `NUMBER` et N non hérité. L'indicateur « N hérité » est une entrée, non persistée, prouvée par un test du domaine seulement. Appel hors disponibilité = levée. N ∈ 1..99, au plus proche ; à égalité, le plus grand N ; pas de plafond à 58 min 55 s.
- **Format unique (H8).** 0 → `0 s`, 60 → `1 min`, 90 → `1 min 30 s`, 3 665 → `61 min 5 s` : les minutes continuent sans heures.
- **Agrégation (2.2).** To = T − PN + R si R > 0, sinon T ; la substitution précède la qualification de la nature. Nature agrégée : `lowerBound` si une contribution est `lowerBound`, `omitted` ou `incomplete` ; sinon `estimated` si une contribution l'est ; sinon `exact`. Montant = Σ des montants + Σ des `knownSeconds` des `omitted` et des `incomplete`. Un Circuit répété k fois compte k fois. Compte à rebours et Fin propres à l'Exercice sont exclus. P31 : Durée estimée d'exécution = occurrence + Compte à rebours initial + Fin de séance (135 + 10 + 5 = 150 s, `lowerBound`) ; l'attendu porte sur le montant seulement.
- **Phrase (2.3).**
  - Générée à l'affichage, jamais stockée. `UNSET` → phrase nulle.
  - Gras (H9) : valeurs et unités, dont `rép.` ; `jusqu’à l’échec` et `à l’échec` sans gras ; `≥`/`≈` dans le segment gras du total.
  - Tout à l'échec (P3, P26) : `{N} séries menées jusqu’à l’échec`, identique dans les deux Modes, sans Bip ni total.
  - Mélange de ≤ 3 Cibles (Q16) : énumération entre parenthèses, en Durée comme en Répétitions, avec `, cadencées toutes les 2 s` s'il y a un Bip. Mélange de > 3 Cibles (H17, H16) : `{N} séries variables, de {min NUMBER} … à l’échec`.
  - Total : `Durée totale : ≥ {total}.` (H18). Régime variables : aucune clause de Pause (P1). Jamais `0 s`.
- **Corpus (P43, AD-10).** `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` est l'oracle ; `docs/preparation/PRE-3/planification/attendus-phrases-276.json` en est l'encodage de test. Ni l'un ni l'autre n'est modifié. Un test vérifie leur identité. Répartition : 140 sans total, 46 `≈`, 90 exactes, aucune `≥`. Les 92 cas `TO_FAILURE` passent par une adaptation explicite et nommée (Répétitions, toutes `FAILURE`), rejouée en Durée.
- **Cartes (2.4).**
  - Catalogue : `≥` en min s sans arrondi (Q17, Q20) ; exact et estimé gardent le rendu PRE-3 (P41 : 165 s → `2 min 45 s`) ; `omitted`/`incomplete` → aucune ligne de durée.
  - Composition : `lowerBound` en `≥` min s sans arrondi ; exact et estimé gardent `formatEstimatedDuration`.
  - Résumés : tout à l'échec → `{N} séries à l’échec` (Q24) ; mélange → `{N} séries variables` ; `UNSET` → `Paramètres à compléter.` ; jamais `0 s` ni `0 rép.`.
  - La carte de Séance reste inchangée pour toutes les natures (P41).
- **Attendus** écrits ou calculés par formule dans le test, jamais par `executionCalculations`, Figma ni Excel (FR-13-06, FR-17-04, D-300). Gabarits au caractère près, apostrophe `’`.
- **Hypothèses** H8, H9, H10, H16, H17, H18, H20, H28 : implémentées comme écrites, au titre de la validation globale du plan. Elles restent révocables à la recette.

## Technical Decisions

- **AD-5.** `src/domain/activities/executionCalculations.ts` est le seul propriétaire du résultat `exact | estimated | lowerBound | omitted | incomplete`, de `knownSeconds` et de la disponibilité de l'Inversion. Les consommateurs (`calculations.ts`, `ActivityCard.tsx`, `ExecutionParametersSheet.tsx`, `executionPhrase.ts`) traitent les cinq issues de façon exhaustive ; aucun ne recalcule une durée.
- **AD-5, formateur.** `src/domain/activities/durationFormat.ts` (nouveau, pur) reçoit `formatPhraseDuration`, déplacé et non réécrit `[ADOPTED]`. `formatCompactDuration` et `formatDurationRowValue` cessent de formater une durée d'Exercice. `formatEstimatedDuration` reste inchangé (cartes de Séance ; exact et estimé du résumé de Composition). Les symboles `≈` et `≥` passent par le lexique (NFR-08, AD-11).
- **AD-6.** `executionPhrase.ts` est le seul générateur : segments `{ texte, gras }`, gras décidé par le gabarit. `formatExerciseRowSummary` lit les Cibles typées, jamais les scalaires ni `?? 0`.
- **AD-10.** Variantes dans `src/domain/activities/__tests__/fixtures/` (nouveau répertoire). Le littéral `TO_FAILURE` n'apparaît qu'à l'endroit de l'adaptation, sous le test de garde d'AD-3 (`legacyModeConfinement.test.ts`).
- **Conventions.** Ne toucher à aucun jeton. Aucun texte en dur hors phrase et formateurs du domaine (AD-11). Unions discriminées, levée seulement pour une entrée invalide. Trois contrôles verts : `npm test`, `npx tsc --noEmit`, `npm run lint`.

## Existing Code & Remaining Gaps

Source : bilan approuvé par Hermann (`bilan-ecarts-2026-10-17.md`). Réutiliser ce qui est conforme, sans le reconstruire, et développer l'écart seulement. Aucun critère, test ni revue n'est retiré.

- **2.1.**
  - Existant : `buildExecutionLedger` (registre, Récupération en remplacement de la dernière phase), Inversion et `totalDurationRange`, tous conformes ; ne pas les réécrire (simplification 3).
  - Écart : `ExerciseDurationKind` ne vaut aujourd'hui que `"exact" | "estimated" | "omitted"` (`executionCalculations.ts:35`), et `summarize` (l. 126) classe tout inconnu en `omitted`. À ajouter : `lowerBound` (travail connu et inconnu mêlés) et `incomplete` (`UNSET`), plus l'indicateur « N hérité ».
  - Tests à ajouter : AC4, AC7, AC8.
  - Consommateurs qui testent `"omitted"` : `catalogueDuration` (`ActivityCard.tsx:115`), la ligne de total de `ExecutionParametersSheet.tsx` (~l. 350, 763), `executionPhrase.ts:201`, `calculations.ts:68,169` et `aggregateSessionDuration` (`executionCalculations.ts:264`, qui ne connaît que `omitted`).
- **2.2.**
  - Existant : `computeOccurrenceDuration` (l. 146) et le pli `aggregateSessionDuration`, à adapter sans les réécrire ; `formatEstimatedDuration` (`formatSessionSummary.ts:59`) intact.
  - Écart : créer `durationFormat.ts` par déplacement de `formatPhraseDuration` (`executionPhrase.ts:34`) ; faire converger `formatCompactDuration` (`compositionPresentation.ts:191`) ; passer par le lexique les `≈`/`≥` codés en dur (`ActivityCard.tsx:121`, `executionPhrase.ts:203`, `formatSessionSummary.ts:66-68`) ; ajouter les tests des attendus.
  - P31 : aucune fonction trouvée dans `src/domain/sessions/calculations.ts`, où `computeEstimatedDurationSeconds` (l. 114) n'intègre ni le Compte à rebours ni la Fin. Le vérifier, puis faire un petit ajout dans le domaine.
- **2.3.**
  - Existant : générateur et `SegmentBuilder` à garder ; le test du corpus porte l'adaptation minimale de 1.1.
  - Écart : branche « mélange » (énumération ≤ 3, compaction > 3), cadence des mélanges, `≥` dans le segment gras, répertoire `fixtures/` (absent), test d'identité oracle/encodage (P43), adaptation explicite et nommée des 92 entrées avec rejeu en Durée.
- **2.4.**
  - Existant : `{N} séries à l’échec` et `Paramètres à compléter.` (`strings`, `src/shared/i18n/index.ts:18`) déjà faits en 1.1.
  - Écart : `≥` sans arrondi dans `catalogueDuration` et dans `formatCompositionSummary` (`compositionPresentation.ts:106`, qui passe aujourd'hui le `lowerBound` à `formatEstimatedDuration`, arrondi), en quelques lignes ; symboles par le lexique ; tests « jamais 0 s ni 0 rép. ».
  - Ne toucher ni `SessionCard` ni `CompositionScreen.tsx`.

## UX & Interaction Patterns

- La Phrase est rendue dans la Carte Paramètres d'exécution existante (`ActivityEditorForm.tsx`) : texte complet, sans `numberOfLines`, sans hauteur fixe ni `maxFontSizeMultiplier`, en Inter 13, interligne 20, valeurs en Semi Bold. Le bouton de Mode et le focus unique restent à 4.2 (Q23).
- Aucune Phrase sur les cartes Catalogue et Composition. Aucun élément ajouté à Composition, aucune refonte (Q4).
- Les huit cartes du Catalogue et leurs filtres sont conservés. Les six contrats de cartes du ch. 13 sont lus comme amendés par Q17.
- Figma ne sert qu'au rendu : la capture `8328:38848`, qui énumère les Pauses, n'est pas suivie (P1). Le gras se vérifie sur `8470:13303`.
- **Recette.** Elle est regroupée dans l'ensemble « durées et phrases » (R-2.1-01, R-2.2-01, R-2.3-01 à 05, R-2.4-01 à 05), à 360, 402 et 440 pt et en texte agrandi. R-2.3-03, R-2.3-04 et R-2.4-03 ne sont exécutables qu'après l'Epic 3. Une suite verte n'est pas une preuve visuelle : la validation appartient à Hermann (NFR-04). Aucune mesure non observée n'est inscrite.

## Cross-Story Dependencies

- **Epic 1** commité : 1.1 `77e1630c` (`SeriesTarget`, v2, migration 010), 1.2 `8133e4bb`, 1.3 `9cc21b3b` (copies et Instantanés v2, rejoués par 2.1 AC8). 1.4 apporte les preuves de préservation, dont les données de recette (`recette-iphone.md` §2).
- **Ordre :** 2.1 → 2.2 → 2.3 → 2.4. 2.2 dépend de 2.1 ; 2.3 de 2.2 ; 2.4 de 2.2 et 2.3.
- **Dépendant de 2.1 en Epic 3 :** 3.7 (la ligne Durée totale affiche `≥` pour un mélange et se masque pour `UNSET` ; popover, message d'ajustement, annonces) ; 3.2 AC14, qui reprend l'indicateur « N hérité ».
- 4.2 AC6 porte le retour de ligne avant « Durée totale » et la zone touchable unique de la Carte.
- Q33 et Q34 (Créer, Lecture : story 4.1) n'affectent pas l'Epic 2.
