---
title: 'B.2 — Libellés, valeurs et Description (B1, B2, B8, B10)'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '1917ba258f23d289a6814ef27aaf4c1abb76b3c2'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-B-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Dans l'éditeur d'Exercice, l'invite « Étape suivante » reste affichée au repos (B1) ; la Condition d'arrêt affiche encore « À la cible » / « À la cible et à l'échec » (B2) ; l'option Autre de la Cadence n'affiche jamais la valeur personnalisée (B8) ; en séries variables, la colonne Charge disparaît sous Sans (B10). D-447 (ch07 l.73-85), CE-T03-04 (ch13 l.826), CE-UI-10 (ch13 l.1086, 1226, 1230), RM-238, RM-245, RM-248, RM-249.

**Approach:** Présentation seule. B1 : ligne d'invite rendue seulement quand une ligne de la Description a le focus (même minuterie de perte de focus différée que ↑). B2 : lexique `src/shared/i18n/index.ts:57`. B8 : libellé de l'option Autre = valeur courante quand elle est personnalisée. B10 : colonne Charge toujours rendue, tiret gris non éditable en Sans.

## Boundaries & Constraints

**Always:** identifiants `TARGET` / `MIXED`, `cadenceOptionOf`, codec des étapes (D-425), ordre de navigation clavier (`keyboardFieldOrder`, déjà sans charge en Sans), conservation des charges sous Sans (RM-236) et brouillon inchangés. Textes via le lexique. Largeurs 360 / 402 / 440 sans débordement.

**Never:** modifier `tokens.ts`, `app.json`, `package.json`, `.github/`, le domaine ; toucher B3–B7, B9 ; affaiblir un test (garde-fous zéro `ScrollView` iOS) ; supprimer une étape pour masquer l'invite.

**Arbitrages pré-approuvés (Hermann absent, option la plus conservatrice, à confirmer en recette JB) :**
- A1 (B1) : la ligne d'invite est la ligne virtuelle après la dernière étape remplie, ou la dernière étape vide (créée par Entrée), qui « porte elle-même l'invite » (`DescriptionSteps.tsx`, `displayedStepRows`). Au repos, cette ligne n'est pas rendue (rang > 1) ; la liste des étapes n'est pas modifiée (une étape vide n'est de toute façon pas enregistrée, `encodeInstructionSteps`). Au rang 1 (liste vide ou seule étape vide), « Décrivez la première étape » reste toujours rendue.
- A2 (B8) : est personnalisée toute valeur que `cadenceOptionOf` classe Autre (2 à 10). Option et nom accessible : « 3 s » affiché, annoncé « Autre, 3 s » (CE-UI-10 l.1189 : options annoncées par leur nom, valeur en secondes). Stepper ouvert à 0 ou 1 : « Autre ».
- A3 (B10) : tiret « — » (`t.unset`) en `colors.disabled` (teinte existante des options indisponibles), centré dans la cellule de 71 ; annoncé « Série n, charge, Sans » (CE-UI-10 l.1189 « Charge : valeur en kg ou Sans »).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Description vide | `[]` ou `[""]`, repos ou focus | une ligne « 1. Décrivez la première étape » | — |
| Description remplie | `["A","B"]` au repos / focus | 2 lignes / 3 lignes (« 3. Étape suivante ») | — |
| Dernière étape vide | `["A",""]` au repos | 1 ligne, `steps` inchangé | — |
| Ligne → ligne | blur puis focus immédiat | invite jamais démontée | blur différé annulé |
| Condition d'arrêt | identiques, variables homogènes, mixte, phases | « À l'objectif », « À l'objectif et à l'échec » | — |
| Cadence | 3, 1, 0, null ; stepper ouvert | « 3 s » ; « 1 s » ; Sans ; aucune ; valeur suivie en direct | — |
| Charge variable Sans | 3 lignes, charges [10,0,15] | en-tête Charge + 3 tirets ; Précédent/Suivant sans charge | — |
| Sans → Avec | même draft | champs dans la même colonne, valeurs 10 / 0 / 15 | — |

</frozen-after-approval>

## Code Map

- `src/features/activities/DescriptionSteps.tsx` -- `displayedStepRows` (pure, gardée), rendu `rows.map` ; ajouter état local `active` posé au `onFocus`, retiré dans la minuterie de `onBlur` existante (pas de clignotement). Ligne d'invite = dernière ligne vide de rang > 1.
- `src/shared/i18n/index.ts:57` -- `stopConditions.TARGET` / `MIXED` ; commentaire l.43.
- `src/features/activities/ExecutionParametersSheet.tsx` -- `cadenceControl` (~l.1466 : options `CADENCE_OPTIONS`, `beepLabel` l.487) ; `VariableTable` en-tête (~l.2396) et `SeriesTableRow` (~l.2514) : `loadColumn` devient toujours vrai côté colonne, contenu `cell("load")` si `loadEnabled`, sinon tiret ; `keyboardCell` (~l.1570). `MIXED_STOP_CONDITION_WIDTH` (214) et `wide` (106) suffisent : Inter SemiBold 12 mesure 62,5 (« À l'objectif ») et 132 (mixte).
- `src/features/activities/useSheetKeyboard.ts:118-126` -- `keyboardFieldOrder` exclut déjà la charge sous Sans : ne pas toucher.
- Tests : `src/shared/i18n/index.test.ts:683` ; `ExecutionParametersSheet.test.tsx` (l.1581, 4954-5075, 6391, 6896 et tests de colonne Charge) ; `ActivityEditorForm.test.tsx` (l.1764-1960, invite au repos) ; `ExerciseEditingPaths.integration.test.tsx:1974`.

## Tasks & Acceptance

**Execution:**
- [x] `src/shared/i18n/index.ts` -- libellés B2 -- D-447.
- [x] `src/features/activities/DescriptionSteps.tsx` -- invite rendue seulement si active -- B1, A1.
- [x] `src/features/activities/ExecutionParametersSheet.tsx` -- option Autre « n s » (A2) ; colonne Charge toujours présente, tiret (A3) -- B8, B10.
- [x] Tests -- attentes B2, invite au repos (focus avant saisie dans l'invite), colonne Charge ; nouveaux tests B1 (repos / focus / passage de ligne), B8 (3 s, réouverture, 1 s / Sans), B10 (tirets, navigation, Sans → Avec sans recréation de la colonne).

**Acceptance Criteria:**
- Given une Description `["A","B"]`, when une ligne a le focus puis le perd, then « 3. Étape suivante » apparaît puis disparaît, sans modification de `instructionSteps`.
- Given la Cadence à 3 s, when on appuie sur l'option « 3 s », then le stepper s'ouvre à 3 s ; when on choisit 1 s ou Sans, then l'option Autre redevient « Autre ».
- Given des séries variables sous Sans, when on navigue au clavier, then aucune cellule Charge n'est atteinte ; when on passe à Avec, then l'en-tête et la colonne restent montés et les champs y apparaissent.

## Implementation Notes

- Implémentation par un sous-agent depuis la spec, correctifs de revue par le même sous-agent.
- B1 : `renderedStepRows(steps, active)` (pure, sur `displayedStepRows` inchangée) ; état local `active` posé au focus, retiré par la minuterie de perte de focus différée existante ; placeholder de première étape aussi quand une seule ligne est rendue (cas `["",""]`, revue).
- B2 : lexique seul ; largeurs mesurées sur Inter SemiBold 12 (fontTools) : 62,5 dans 106, 132 dans 214.
- B8 : libellé de l'option Autre = `beepLabel(valeur)` quand `cadenceOptionOf` la classe Autre (borne haute 10 par `EXECUTION_BOUNDS`), nom accessible « Autre, n s ».
- B10 : prop `loadColumn` retirée de `VariableTable` / `SeriesTableRow` ; en-tête (`execution-sheet-table-header-load`) et emplacements toujours montés ; sous Sans, `keyboardCell("load")` rend le tiret (`…-load-unset`, rôle texte, « Série n, charge, Sans », `colors.disabled`). `keyboardFieldOrder` inchangé.
- Tests mis à jour (libellés B2, colonne Charge sous Sans, focus avant saisie dans l'invite) et ajoutés (B1, B8, B10). Garde-fous zéro `ScrollView` intacts.
- Contrôles finaux : 149 suites, 4 084 tests verts ; `tsc` et `lint` sans erreur.

## Spec Change Log

## Review Triage Log

| # | Source | Constat | Verdict | Suite |
|---|---|---|---|---|
| 1 | cas limites + aveugle | `["",""]` au repos : une ligne sans « Décrivez la première étape » (`isLast` calculé sur `rows`) | medium | patch appliqué + test |
| 2 | cas limites + aveugle | Plusieurs étapes vides finales : « 2. » gris sans invite au repos | low | rejeté : étape vide réelle, même rendu qu'une étape vide intercalée (règle existante), A1 ne masque que la ligne d'invite |
| 3 | cas limites | Nom accessible du chevron de l'option Autre hérité de « Autre, 3 s » | false | aucune option de Cadence ne porte de chevron |
| 4 | aveugle | Commentaires « À la cible » restés (l.1179, 1183, 1715, 3140) | low | patch appliqué |
| 5 | aveugle | Ajustement du libellé mixte non vérifié | low | rejeté : mesuré (132 dans 214) ; texte agrandi en recette JB |
| 6 | aveugle | Tiret sans `accessibilityRole="text"` | low | patch appliqué ; état « disabled » rejeté (non prévu par CE-UI-10) |
| 7 | aveugle | Pas de test de navigation après Sans → Avec | low | rejeté : navigation Avec couverte par les tests PRE5-2.2 existants, `keyboardFieldOrder` inchangé |
| 8 | aveugle | Cas « Sans puis Autre » (D-420) absent du test B8 | low | patch : assertion ajoutée |
| 9 | aveugle | Aide de test `otherLabel()` dépendante de l'ordre de rendu | low | rejeté : le libellé n'est pas enfant de l'option pressable ; correctif non direct |
| 10 | aveugle | testID d'en-tête Charge inutilisé | low | patch : utilisé par les tests B10 |
| 11 | aveugle | Commentaire « 2 à 10 » sans la borne | low | patch appliqué |
| 12 | aveugle | Effets B1 : décalage de mise en page, VoiceOver doit d'abord activer une étape | low | rejeté en code : conséquence de D-447 ; à observer en recette JB |
| 13 | aveugle | Tests d'intégration en deux temps (focus puis saisie) | false | conforme à B1, aucun défaut |
| 14 | aveugle | README de `src/features/activities/` non mis à jour | low | rejeté : README de niveau fichier, sans suivi par story ; aucune affirmation devenue fausse |
| 15 | lacunes | Aucune lacune de vérification | — | — |


## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Recette JB (iPhone, 360 / 402 / 440) : invite au repos / en saisie, libellés de la Condition d'arrêt (mixte compris), « 3 s » dans Cadence, tirets gris de la colonne Charge.
