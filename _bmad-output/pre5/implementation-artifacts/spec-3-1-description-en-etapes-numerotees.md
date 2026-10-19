---
title: 'Story 3.1 — Description en étapes numérotées'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: 'b87aa48847fd32c23d3d9cf0cdcc509937de4a0d'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre5/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/pre5/implementation-artifacts/spec-1-1-socle-de-donnees-v3.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La Description de l'Éditeur est un champ libre multiligne dans un cadre (PRE-4, D-351) ; D-425 la remplace par une liste d'étapes numérotées, Entrée créant l'étape suivante, sans que l'utilisateur gère la numérotation.

**Approach:** Story 3.1 d'`epics.md` (AC1 à AC6, qui font foi). La valeur de formulaire porte `instructionSteps: readonly string[]` ; l'Éditeur rend une ligne par étape (numéro + `TextInput` natif), plus une ligne d'invite grise ; toute saisie passe par le codec de 1.1 (`splitStepAt`, `insertPastedText`, `instructionStepsLength`) ; les adaptateurs décodent à l'ouverture et encodent à `Terminer` seulement. Présentation : Figma `9071:53260` (frame `8328:36853`, relevée le 19/10), texte à 14, sans contenant.

## Boundaries & Constraints

**Always:** stockage, transport et colonnes inchangés (AD-22, chaîne encodée) ; limite mesurée par `instructionStepsLength` seule, refus entier sans troncature (QN-1, §9-6 décidé) ; `formValueEquals` et la garde d'abandon comparent les encodages (une étape vide n'est pas une modification ; une ancienne Description à lignes vides ou CRLF non modifiée n'est pas une modification) ; ↑ conservé (D-351), `Terminer` hors du `KeyboardAvoidingView` (D-349), patron `keyboardDidShow` + `scrollTo` réutilisé pour garder l'étape active au-dessus du clavier ; textes par `src/shared/i18n/` ; constantes Figma locales nommées ; ordre Description → Paramètres d'exécution → Média, titre « Paramètres d'exécution », Carte vide sans invite inchangés ; fins de ligne CRLF des fichiers touchés.

**Never:** aucune migration ni conversion des anciennes descriptions (QP5-01) ; aucun réordonnancement (modèle A) ni bouton Ajouter ; `maxLength` ne compte pas ; aucun changement de la Carte, de `Terminer` ni des titres (3.2) ; `tokens.ts`, `ExecutionParametersSheet.tsx` et fichiers de la Feuille intacts ; aucun `ScrollView` ajouté ; aucun constat iPhone fabriqué ; pas de fusion d'étapes par retour arrière sur une étape non vide (non décrit : comportement natif, signalé à la recette).

## I/O & Edge-Case Matrix

| Scénario | Entrée / état | Résultat attendu |
|---|---|---|
| Vide | `instructionSteps = []` | une ligne grise « 1. » + « Décrivez la première étape », aucune autre |
| Remplie | `["A", "B"]` | « 1. A », « 2. B », puis invite grise « 3. Étape suivante » |
| Entrée en fin | Entrée à la fin de « B » | `["A", "B", ""]`, curseur sur l'étape 3 (invite « Étape suivante » en placeholder), pas de seconde invite |
| Entrée au milieu | « Dos|droit » | `splitStepAt` → « Dos », « droit », curseur au début de la nouvelle étape |
| Collage | 3 lignes (`\n` ou `\r\n`) dans une étape | `insertPastedText`, une étape par ligne, curseur à la fin du texte collé |
| Retour arrière | sur l'étape vide n > 1 | étape supprimée, curseur en fin de l'étape n − 1 |
| Limite | saisie qui porterait `instructionStepsLength` au-delà de 1000 | refusée en entier, valeur inchangée ; un raccourcissement reste admis |
| Terminer | `["A", "", "B", ""]` | `encodeInstructionSteps` → `"A\nB"` enregistré ; réouverture « 1. A », « 2. B » |
| Ancienne | `"A\r\n\r\nB"` | affichée « 1. A », « 2. » (vide), « 3. B » ; aucune étape fantôme `\r` ; non modifiée = pas de garde |

</frozen-after-approval>

## Code Map

- `src/domain/activities/instructionSteps.ts` -- codec de 1.1 (`decode`, `encode`, `splitStepAt`, `insertPastedText`, `instructionStepsLength`) ; réutilisé tel quel, non modifié.
- `src/features/activities/ActivityEditorForm.tsx` -- `ActivityEditorFormValue.instruction` → `instructionSteps` ; section Description (l. 410-462) remplacée par le composant d'étapes ; réutiliser `revealDescription` / `keyboardDidShow` / `bodyHeightRef`, le bouton ↑ (`descriptionSend`, `exercise-instruction-submit`) et sa réserve ; retirer `maxHeight` borné et le cadre (`instructionInput`).
- `src/features/activities/DescriptionSteps.tsx` (nouveau, CRLF) -- liste d'étapes : rendu, diff de saisie (préfixe/suffixe communs → `splitStepAt` si `"\n"` seul inséré, sinon `insertPastedText`), refus à la limite, retour arrière, focus et sélection (`ref.focus()`, `setSelection`), mesures des lignes pour le défilement.
- `src/features/sessions/ExerciseScreen.tsx` -- `createEmptyFormValue`, chargement (`decodeInstructionSteps(definition.description)`), `formValueEquals` (encodages), `handleFinish` (`description: encodeInstructionSteps(...)`) ; Composition : état `instructionSteps` décodé de l'occurrence, garde d'abandon et réglage Profil sur les encodages, `handleTerminer` écrit l'encodage dans l'occurrence.
- `src/shared/i18n/index.ts`, `src/shared/i18n/resources/fr.ts` -- clés `firstStepPlaceholder`, `nextStepPlaceholder`, `stepAccessibilityLabel` sous `screens.exercise.instruction` ; `card.descriptionPlaceholder` devenu orphelin retiré.
- Tests : `ActivityEditorForm.test.tsx` (N-05, ↑, PRE4-4.2/AC7, AC11), `EditorAccessibility.story46.test.tsx`, `CompositionExerciseFlow.integration.test.tsx:298`, `ExerciseEditingPaths.integration.test.tsx` (`editorContent`), `ExerciseScreen.test.tsx` (valeur `instruction`), `copiesAndSnapshots.story13.test.ts` (déjà en 1.1).

## Tasks & Acceptance

**Execution:**
- [x] `src/features/activities/DescriptionSteps.tsx` -- composant d'étapes et fonction pure `applyStepTextChange` exportée -- AC1, AC2, AC3, AC6.
- [x] `src/features/activities/ActivityEditorForm.tsx` -- valeur `instructionSteps`, intégration, défilement de l'étape active -- AC2, AC4.
- [x] `src/features/sessions/ExerciseScreen.tsx` -- décodage, comparaison des encodages, encodage à `Terminer` (deux parcours) -- AC4, AC5.
- [x] `src/shared/i18n/*` -- invites et libellé accessible ; clé orpheline retirée -- AC6.
- [x] Tests -- saisie, Entrée, coupure, collage (CRLF), retour arrière, ↑, limite, invite, encodage à `Terminer`, garde d'abandon, ancienne Description, transport -- AC1 à AC6.

**Acceptance Criteria:**
- Given VoiceOver, when Hermann parcourt la Description, then chaque étape est un champ nommé « Étape n » et les numéros visibles ne sont pas lus en double.
- Given une Copie de Séance ou une définition Catalogue, when Hermann n'ajoute qu'une étape vide puis quitte, then aucune garde d'abandon ne s'affiche.

## Design Notes

Relevé Figma (lecture seule, 19/10) `9071:53260` / composant `Description / Étape` `9002:15555` : liste en colonne, écart 8 entre étapes ; ligne en rangée, écart 8 ; numéro Inter Medium 14, largeur 16, aligné à droite, `#595E66` (`colors.textSecondary`) ; texte Inter Regular 14 `#141414` (`colors.textPrimary`) ; invite (numéro et texte) `#AEB3BA`, sans jeton → constante locale ; interligne « normal » (non fixé) ; aucun fond, contour ni padding. Titre de section, écarts de section et ↑ : inchangés (3.2 pour le titre). Une étape vide intercalée garde son numéro gris sans placeholder ; seule la dernière ligne vide porte l'invite. Le `testID` `exercise-instruction-input` reste sur la ligne 1 ; les suivantes `exercise-instruction-step-<n>`.

## Verification

**Commands:**
- `npm test` -- vert
- `npx tsc --noEmit` -- vert
- `npm run lint` -- vert

**Manual checks (recette iPhone, lot Éditeur, Hermann):** R-3.1-01 à R-3.1-08 d'`epics.md` ; en plus : comportement natif à 1 000 caractères (§9-6), alignement numéro / texte, cible tactile d'une ligne, maintien du clavier lors du passage d'une étape à l'autre.

## Implementation Notes

- Environnement (consigne de l'orchestrateur) : aucun serveur lancé ; ne rien modifier dans les worktrees `C:\Dev\KODJO-BMAD-PRE5-fix` et `-recette` ; aucun commit, push ni `git worktree` (l'orchestrateur commite) ; pas de python système ; fichiers temporaires dans le clone ; docs Expo SDK 57 ; respecter les fins de ligne (CRLF des fichiers touchés).

## Spec Change Log

## Review Triage Log

| # | Couche | Constat | Verdict | Preuve / décision |
|---|---|---|---|---|
| VG-1 | verification-gap | Aucune garde d'abandon prouvée après une modification de la seule Description (étapes hors de `local`) | medium | Constat pré-vérifié (tests cités ne modifient que Nom, Feuille, Médias). **patch** : cas ajouté à la boucle AC12. |
| BH-1 | blind | `Terminer` après une modification sans rapport réécrit une ancienne Description (`\r\n`, lignes vides) | false | Comportement voulu : AC4 « étapes vides retirées à `Terminer`, encodage à ce moment » ; FR-35 tolère la perte de forme des anciennes descriptions. |
| BH-2 | blind | Curseur mal placé après un collage dont les bords répètent les voisins (diff préfixe/suffixe) | low | Réel mais rare ; correctif = suivi de `onSelectionChange` (complexité ajoutée). Rejeté ; à observer en recette. |
| BH-3 / EC-1 | blind, edge | Blur avant focus en passant d'une étape à l'autre : ↑ démonté puis remonté | low | Réel sur iOS (ordre des événements natif) à chaque Entrée ; correctif local trivial. **patch**. |
| BH-4 / EC-2 | blind, edge | Clés par position : le `TextInput` focalisé affiche une autre étape après suppression | false | Le focus est aussitôt redonné à l'étape n − 1 ; les mesures par position restent celles de la ligne affichée (onLayout à chaque changement). |
| BH-5 | blind | Cible tactile d'une ligne (17) sous 44 | low | Conséquence du relevé Figma (UX-DR8, écart 8, sans cadre) ; déjà listé pour la recette. Point soumis à Hermann. |
| BH-6 | blind | Refus silencieux à 1 000 | false | §9-6 : aucune règle inventée ; comportement natif constaté en recette. |
| BH-7 / EC-4 | blind, edge | `\r` isolé non traité comme saut de ligne | low | Codec (AD-22) découpe sur `/\r?\n/` seulement ; cas rarissime sur iOS ; rejeté. |
| BH-8 | blind | Colonne de texte décalée à partir de l'étape 10 (`minWidth` 16) | low | Réel, cosmétique, rare (3-4 étapes usuelles) ; rejeté, signalé en recette. |
| BH-9 | blind | Description entièrement vidée non prouvée enregistrée `NULL` | low | Codec prouvé (`encode([""]) === null`), parcours non prouvé ; test d'intégration trivial. **patch**. |
| BH-10 | blind | Deux copies de la Description dans la Composition | false | Aucun lecteur de `local.instruction` avant `Terminer` hors `occurrenceEquals` (validation sans Description) ; conception de la spec (encodage à `Terminer`). |
| BH-11 | blind | Pas de test MC « modifier les étapes puis enregistrer » | low | Même `handleFinish` que CC, prouvé par le test CC sur SQLite réel ; rejeté. |
| BH-12 | blind | Titre de test PRE-3 « sans hauteur figée » imprécis | low | Cosmétique ; rejeté. |
| EC-3 | edge | `focus()` puis `setSelection()` à la suite : curseur possiblement en fin sur iOS | maybe-false | À établir sur iPhone (R-3.1-02). **defer** (medium non vérifié). |
| EC-5 | edge | Retour arrière lu sur `rows` du rendu précédent | false | Chaque frappe est un événement natif distinct, rendu entre les deux ; l'étape vidée est rendue avant la frappe suivante. |
| EC-6 | edge | `Terminer` sans modification normalise l'ancienne Description de l'occurrence | false | Même décision que BH-1 (AC4, FR-35). |
| EC-7 | edge | `pendingFocus` périmé si le parent ignore `onChange` | false | Les deux adaptateurs appliquent toujours `onChange` ; l'effet consomme la demande au rendu suivant. |
