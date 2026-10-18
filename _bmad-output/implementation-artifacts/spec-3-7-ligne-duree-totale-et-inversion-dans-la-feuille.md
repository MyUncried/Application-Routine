---
title: 'Story 3.7 — Ligne Durée totale et Inversion dans la Feuille'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: 'a5d34dbf'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-3.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/bilan-ecarts-2026-10-17.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/sources-retenues.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/Specifications-fonctionnelles/13 – Contrats d’écran.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md'
  - '{project-root}/docs/preparation/PRE-4/bmad/recette-iphone.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La ligne Durée totale de la Feuille masque tout cas comportant une Cible `FAILURE` (`totalApplicable`), au lieu d'afficher un total partiel `≥` pour un mélange calculable. Elle ne se masque pas explicitement pour une Cible `UNSET`. Les annonces `≈` / `≥` et le caractère en lecture seule ne sont pas complets.

**Approach:** Implémenter la **story 3.7 (AC1 à AC8, `epics-parts/epic-3.md`)** en **réutilisant** ce qui est conforme (bilan des écarts) : l'Inversion (`isRequestedTotalEditable`, `applyRequestedTotal`, `invertTotalDuration`), la roulette du total déjà présentée dans `AnchoredPanel` (Q41), le message d'ajustement et `Annuler`, les natures `exact` / `estimated` / `lowerBound` / `omitted` / `incomplete` d'`executionCalculations.ts` (2.1), le formateur unique `durationFormat.ts` et ses préfixes (2.2). L'écart réel : faire suivre à la ligne la nature calculée par le domaine (AC1, AC2), restreindre la roulette aux cas éditables (AC3), compléter l'accessibilité (AC7) et prouver le reste par des tests nommés.

## Boundaries & Constraints

**Always:**
- La forme de la ligne (modifiable, lecture seule `≈`, lecture seule `≥`, absente) se lit **dans le domaine** (`executionCalculations.ts` : nature et disponibilité de l'Inversion, AD-5) ; la Feuille ne recalcule ni ne formate aucune durée (formateur unique, AD-5, AC8). Si une nature manque au domaine pour un cas d'AC1, l'ajouter au domaine avec ses tests, pas dans la Feuille.
- Cible `UNSET` : aucune ligne ni montant, ✓ de la Feuille indisponible (H10, NFR-06). Mélange calculable : `≥` + montant. Répétitions sans Bip, tout à l'échec, `identiques` à l'échec : aucune ligne ; le `Bip de cadence` passe alors juste avant `Compte à rebours` (FR-03-02).
- Roulette du total : seulement en Durée, `identiques`, Cible numérique. Présentation validée inchangée (panneau `AnchoredPanel` sous le champ, aligné à droite, Q41 ; Android / web en ligne), bornes T(1)..T(99) à la seconde, sans option échec, distincte du Sélecteur de cible. ✕ ferme sans appliquer ; ✓ applique au Brouillon (Inversion, AD-2) ; message littéral d'ajustement et `Annuler` existants.
- Accessibilité : `≈` annoncé « estimation », `≥` « total prévisionnel partiel », lecture seule annoncée, valeur jamais annoncée par un tiret, état jamais transmis par le gris seul ; textes par le lexique.
- Tests : montants attendus calculés par formule dans le test, jamais par `executionCalculations`. Garde-fous zéro `ScrollView` intacts. Aucun jeton modifié.
- Q44 : sans objet ici (aucune Cellule active ni Pied commun).

**Never:**
- Ne pas retravailler l'ergonomie validée (panneau, animations, sélection, 44 pt, capsule `Annuler` déjà livrée).
- Pas de nouvelle composante d'interface pour l'interdiction de l'Inversion (AC1) ; pas de seconde roulette ; pas de calcul de durée dans la Feuille.
- Hors story : calcul des natures et de l'Inversion (2.1), cartes (2.4), Phrase (2.3), N hérité (FR-12-07).

</frozen-after-approval>

## Code Map

- `src/features/activities/ExecutionParametersSheet.tsx` : `totalApplicable`, ligne Durée totale, `totalWheel`, message d'ajustement (`kind: "total"`), `Annuler`.
- `src/domain/activities/executionCalculations.ts` : natures, `isRequestedTotalEditable`, `applyRequestedTotal`, `invertTotalDuration`.
- `src/domain/activities/durationFormat.ts` ; `strings.shared.durationNature` (`src/shared/i18n/index.ts`).
- Tests : `ExecutionParametersSheet.test.tsx`, `executionCalculations.test.ts` si le domaine change.
- Relevé visuel : `8328:38084`, `8328:38409`, `8470:13303`, maître `5544:5118`.
- Recette `recette-iphone.md` §4.3 : R-3.7-01 à 04 (application « Routine BMAD »).

## Tasks & Acceptance

**Execution:**
- [x] Relevé visuel (Implementation Notes, D-255).
- [x] Ligne Durée totale pilotée par la nature du domaine ; `≥` pour un mélange ; masquée pour `UNSET` et les cas sans total.
- [x] Roulette restreinte aux cas éditables ; Inversion 160 s / 180 s ; message et `Annuler`.
- [x] Accessibilité AC7 ; lexique.
- [x] Tests `PRE4-3.7/AC1` à `AC8` ; recette R-3.7-01 à 04 ; READMEs.

**Acceptance Criteria:**
- Given la story 3.7, when elle est livrée, then chacun de ses critères AC1 à AC8 est vérifié par un test nommé ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Implementation Notes

**Relevé visuel (D-255 ; `docs/preparation/PRE-4/figma/*.json.gz`, captures du 2026-10-13).**

| Frame / maître | Relevé | Suite donnée |
|---|---|---|
| `8328:38084` (roulette de Durée totale ; maître `5544:5118`) | Ligne `Durée totale` Medium 14 `#141414` ; valeur modifiable en pastille, Semi Bold 13 `#0508E5` (`5 min 15 s`) ; roue minutes / secondes de la Durée, en-têtes `minutes` / `secondes` Semi Bold 14, sans option échec | Pastille existante (`ValuePill`) inchangée ; roulette `DurationWheelPicker` inchangée dans `AnchoredPanel` (Q41). Les chiffres de la roue de la frame ne sont pas des règles (D-255) : bornes prises de FR-14-03 |
| `8328:38409` (message d'ajustement) | Texte Regular 14 blanc `Durée ajustée à 5 min 15 s pour respecter un nombre entier de séries.` sur fond sombre, sous la ligne | Message et capsule `Annuler` existants (D-5, recette 2 T-58), inchangés ; gabarit du lexique `adjusted` identique au littéral |
| `8470:13303` (cas mixte, lecture seule) | Libellé `Durée totale` (sans symbole) ; valeur `≥ 2 min 15 s` Regular 14 `#141414`, sans pastille ; Cibles 30 s / 45 s / à l'échec, Pauses 10 / 20 / 30 s | Valeur en lecture seule par le style existant `staticValue` (`type.body`, `colors.textPrimary`) ; préfixe `≥ ` du lexique (`durationNature.lowerBoundPrefix`) |
| `7059:13302` (PRE-3, Répétitions avec cadence ; repère) | Libellé `Durée totale ≈` | Emplacement de `≈` conservé dans le libellé (`totalEstimated`, PRE-3) ; voir Spec Change Log (b) |

**Choix d'intégration.**
- Forme de la ligne lue dans le domaine : `computeIntrinsicDuration(effective)` (si `isCalculable`) et `hasDurationAmount(kind)` décident la présence ; `isRequestedTotalEditable(draft)` décide la roulette. `totalApplicable` (filtre local `FAILURE` / `UNSET`) est supprimé ; `hasFailureTarget` / `hasUnsetTarget` ne sont plus importés. Aucune nature ajoutée au domaine (toutes existaient, story 2.1).
- Montant : `formatPhraseDuration` seul ; `≥ ` préfixé depuis le lexique pour `lowerBound` ; `≈` reste dans le libellé `Durée totale ≈` pour `estimated` (rendu PRE-3, Figma `7059:13302`).
- Saisie invalide autre qu'une Cible `UNSET` (valeur hors bornes, ex. 4 s) : ligne conservée avec `—`, comportement existant prouvé par `PRE4-2.1/AC9` ; annoncée par la clé dédiée `totalInvalidSpoken` (« montant indisponible tant qu’une valeur est invalide »), précédée de la nature si elle est connue (« Durée totale, estimation, montant indisponible… »), jamais par le tiret (revue, Spec Change Log (e)).
- Roulette du total : `targetBounds` = T(1)..min(T(99), 5999) (`totalDurationRange`, domaine), prop existante de la story 3.4, ouverte exactement sur le total courant. Sous 60 s de T(1) : à 0 min, `00` puis T(1)..59, ✓ indisponible sur `00:00`. Dès T(1) ≥ 60 s : minutes à partir de `floor(T(1) / 60)`, secondes ≥ `T(1) % 60` à cette minute (`boundedMinutesValues`, `wheelPickerMath.ts` ; iOS et Legacy, index Legacy remappé). À la minute de la borne haute, secondes ≤ `max % 60`. Aucune option échec (prop `failureOption` absente). Présentation, panneau, animations : inchangés.
- Plafond du composant (revue) : la roue PRE-3 ne va que jusqu'à 99:59 (`WHEEL_TOTAL_DURATION_SECONDS_MAX` = 5999). Si T(1) ou le total courant dépasse 5999 s, la roue n'est pas proposée : ligne `exact` en lecture seule, annoncée « non modifiable ». Choix d'intégration de Claude, commenté dans le code ; ce n'est pas un calcul de durée.
- **Hypothèses de la story.** H8 (minutes au-delà de 59) : appliquée par le formateur unique (`66 min`, `60 min 55 s`, `105 min`), tests `PRE4-3.7/AC8`. H10 (aucun total pendant une Cible incomplète) : appliquée (nature `incomplete`, aucune ligne, ✓ indisponible), tests `PRE4-3.7/AC2`. H18 (gabarit de la Phrase `Durée totale : ≥ {total}.`) : sans objet dans la Feuille, qui n'affiche pas la Phrase ; elle relève de la story 2.3 (hors story) et reste une hypothèse non validée, dont le statut est tenu dans `questions-ouvertes.md`.
- Accessibilité : `Row` reçoit une prop optionnelle `accessibilityLabel` ; présente, la ligne (`…-line`) devient un seul élément `text` portant l'annonce (libellé, nature, montant, « non modifiable »). Absente, rendu inchangé pour toutes les autres lignes. Ligne modifiable : annonce de la pastille inchangée. Nouvelles clés : `totalEstimatedSpoken`, `totalLowerBoundSpoken`, `totalReadOnlySpoken` (dans `executionParameters.sheet`, `durationNature` étant verrouillé par `index.test.ts`).
- Commentaire de `DurationWheelTargetProps` et `src/features/sessions/README.md` mis à jour (la Durée totale reçoit désormais `targetBounds` ; bornes génériques, ≥ 60 s compris).
- Tests de la Feuille : `PRE4-3.7/AC1` à `AC8` ; AC4 en cinq (iOS : panneau sous le champ, aligné à droite, ✕ et toucher extérieur sans appliquer, bornes 40 s..66 min ; Android ; web ; T(1) = 70 s ; plafond 5999 s et roue non proposée). La présentation du panneau est aussi prouvée par les tests `PRE4-Q41` existants. AC8 compare, cas par cas, le montant affiché au formateur (`66 min`, `2 min`, `≥ 2 min 15 s`, `60 min 55 s`, `1 min 45 s`, `105 min`) ; le contrôle par lecture du source est retiré. Roue : `PRE4-3.7` de `DurationWheelPicker.test.tsx` (T(1) = 70 s et bilatéral 67..5947, iOS et Legacy ; non-régression 3.4) et de `wheelPickerMath.test.ts` (`boundedMinutesValues`, aucune minute sans seconde). Montants par formule dans le test. Test existant adapté : `PRE4-2.1/AC9` (masquage) ne garde que le tout échec et la Cible à renseigner ; le mélange, qui y était masqué « jusqu'à la story 3.7 », est couvert par `PRE4-3.7/AC1` en `≥`.
- Garde-fous zéro `ScrollView`, `migration001`, `tokens.ts` : intouchés. Recette : R-3.7-01 à 04 ajoutés au §4.3 de `recette-iphone.md`.

## Spec Change Log

- 2026-10-17 — (a) Lecture d'AC4 « bornes de T(1) à T(99) » (FR-14-03) : la roulette PRE-3 proposait aussi 0 à T(1) − 1 s (ramenés à N = 1 avec message). Bornée par la prop existante `targetBounds` ; la position `00:00` de ce composant reste, ✓ indisponible (même règle que le Sélecteur de cible, 3.4). Écart du bilan non relevé (« Inversion conforme ») ; à confirmer par Hermann sur iPhone (R-3.7-01).
- 2026-10-17 — (b) AC1 « `≈` en Répétitions » ne dit pas où placer `≈` : conservé dans le libellé (`Durée totale ≈`, PRE-3, `7059:13302`), alors que `≥` précède le montant (`8470:13303`). Interprétation de Claude, révisable par Hermann.
- 2026-10-17 — (c) AC7 « jamais par un tiret » appliqué aussi à la ligne `—` d'une saisie invalide (hors `UNSET`), conservée par `PRE4-2.1/AC9`. *Remplacé par (e) : l'annonce par `validateUnavailableSuffix` est abandonnée.*
- 2026-10-17 — (d) Annonce de la lecture seule : la ligne entière est un seul élément VoiceOver (« Durée totale, estimation, 1 min 45 s, non modifiable ») ; pas d'état `disabled` (qui serait annoncé « estompé »). Choix d'intégration, constaté en R-3.7-04.
- 2026-10-18 — (e) Revue : clé dédiée `totalInvalidSpoken` pour la ligne `—`, qui garde la nature quand elle est connue (`estimation`, `total prévisionnel partiel`).
- 2026-10-18 — (f) Revue, point 1 : défaut hérité de la story 3.4 sous `targetBounds` quand la borne basse dépasse 60 s (minute 0 proposée avec la seule position `00:00`, ✓ indisponible ; T(1) = 70 s inatteignable par la première minute). Corrigé dans la roue (`boundedMinutesValues`) : minutes à partir de `floor(min / 60)`, aucune minute sans seconde, iOS et Legacy ; story 3.4 (5..3535) strictement inchangée.
- 2026-10-18 — (g) Revue, point 2 : plafond de la roue (99:59). Bornes T(1)..min(T(99), 5999) et ouverture exacte sur le total courant ; si T(1) ou le total courant dépasse 5999 s, roue non proposée, ligne en lecture seule annoncée non modifiable. Auparavant, la roue s'ouvrait sur une valeur ramenée à 5999 (fausse). Choix d'intégration de Claude, révisable par Hermann (consigné par le coordinateur en Q46).
- 2026-10-18 — (h) Revue : test AC4 iOS complété (placement, toucher extérieur), tests Android et web séparés ; AC8 par comportement au lieu d'une lecture du source ; recette R-3.7-01, 03 et 04 complétée ; contexte du frontmatter complété (sources normatives, recette).

## Review Triage Log

Revue du 2026-10-18 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V). Correctifs appliqués par l'implémenteur ; Q46 complétée par Claude.

| Constat | Verdict | Route |
|---|---|---|
| E1 — T(1) ≥ 60 s : minutes proposées sans seconde valide (défaut hérité de 3.4) | high | patch (`boundedMinutesValues`, iOS et Legacy ; 3.4 inchangée) |
| E2/E3/B1 — plafond 99:59 : ouverture faussée au-delà, bornes écrasées si T(1) > 5 999 s | medium | patch (roue non proposée au-delà du plafond, ouverture sur le total courant ; Q46) |
| V1 — plafond non vérifié avec T(99) > 5 999 s | medium | patch (test, ouverture 05:15) |
| B2/E5 — « à la seconde » prouvé sur un seul cas (66:00) | low | patch (bilatéral, bornes non multiples de 60) |
| E4/B8 — annonce invalide sans la nature ; clé `validateUnavailableSuffix` partagée | low | patch (clé `totalInvalidSpoken`) |
| B3 — AC4 iOS incomplet (toucher extérieur, position) | low | patch |
| B4 — test « Android et web » limité à Android | low | patch (deux tests) |
| B5 — README sessions périmé | low | patch |
| B6 — Q46 incomplète | low | patch (Claude) |
| B7 — R-3.7-03 et R-3.7-04 incomplètes | low | patch |
| B9 — test AC8 par lecture du source fragile | low | patch (test de comportement) |
| B10 — traçabilité de la spec (H18, sources, statut) | low | patch |
| E6 — la Feuille borne elle-même la plage du domaine | low | rejeté pour le code (contrainte du composant PRE-3, documentée en commentaire) |
| B11 — nom de l'application de recette (« Routine Dev » dans l'epic) | low | rejeté (la recette se fait dans « Routine BMAD », consigne de Hermann ; l'epic garde son historique) |


## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
