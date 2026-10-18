---
title: 'Story 3.2 — Brouillon de Feuille : Cibles typées, Régime, mémoire par Mode, retrait et annulation'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: 'edca2d63c3768db78203bc1269a94110049e1b62'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics-parts/epic-3.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La machine de Brouillon de la Feuille existe et couvre déjà les cas suivants :
- la mémoire des Cibles par Mode ;
- la Réserve de N ;
- la copie de la dernière ligne ;
- le passage entre identiques et variables ;
- le déplacement d'une ligne ;
- N = 1 normalisé ;
- le ✓ par `validateForSave`.

Il lui manque :
- le retrait d'une ligne et son annulation, invalidée par toute modification (Q29) ;
- l'alignement de la ligne de base par identité de ligne, et non par rang (AD-13) ;
- la compatibilité « N hérité » ;
- des preuves littérales pour chaque critère.

**Approach:** Implémenter la **story 3.2 (AC1 à AC14, `epics-parts/epic-3.md`)**, domaine seul, en **étendant** `ExecutionSheetDraft`, sans réécrire la machine :
- ajouter `removeRow`, `pendingRemoval` et `undoRemoval`, avec l'invalidation de Q29 ;
- passer les identités de ligne à la validation pour la ligne de base ;
- ajouter l'indicateur d'héritage en entrée ;
- prouver les autres critères, déjà conformes pour l'essentiel, par des tests nommés `PRE4-3.2/ACn` aux attendus littéraux.

## Boundaries & Constraints

**Always:**
- Réutiliser les fonctions existantes de `ExecutionParametersDraft.ts` :
  - `openSheetDraft`, `effectiveParameters` ;
  - `setSeriesCount`, `setVariable`, `setMode` ;
  - `setUniformTarget`, `setRowTarget`, `setRowPause` ;
  - `moveRow`, `commitSheetDraft`.
- Ne modifier une fonction existante que si un attendu littéral de la story la met en défaut ; consigner chaque correction.
- Le Régime reste porté par l'état explicite du Brouillon (`variable`), jamais déduit des valeurs. Ne pas le renommer.
- Q29 : toute modification du Brouillon invalide `pendingRemoval`. La liste est exhaustive : Cible, Pause, N, Mode, Régime, Bip, Pause commune, réordonnancement, autre retrait. Seules l'ouverture et la fermeture sans application d'un popover ou du Sélecteur ne l'invalident pas. Comme elles ne passent pas par le Brouillon, le Brouillon ne doit exposer aucune transition d'ouverture qui l'invaliderait.
- AD-13 : la ligne de base de `validateForSave` est alignée par identité de ligne. Une ligne nouvelle n'a pas de base. Une Cible n'est tolérée que dans le Mode de la base. `UNSET` bloque toujours. En création, aucune base.
- Le ✓ ne transmet ni identité, ni Réserve, ni mémoire, ni `pendingRemoval`. Une violation est rendue en union, sans état partiel.
- Les tests sont purs et aux attendus littéraux, un par critère, avec les scénarios de FR-12-06.

**Never:**
- Aucune modification d'interface (`ExecutionParametersSheet.tsx`, stories 3.3 à 3.7). Aucune persistance de l'indicateur d'héritage ni de `pendingRemoval`.
- Aucune Cible convertie entre Modes, aucun 0, aucune sentinelle.
- Ni `nearestGridValue` (3.4), ni `stepTarget` (3.6).

</frozen-after-approval>

## Code Map

- `src/domain/activities/ExecutionParametersDraft.ts` :
  - type `ExecutionSheetDraft` et identités de ligne ;
  - `openSheetDraft` (l.84) ;
  - `rememberCurrentTargets` / `targetsById` (l.163), qui portent la mémoire par Mode : vérifier la précédence H27, c'est-à-dire que le dernier choix explicite l'emporte ;
  - `setSeriesCount` (l.194), avec sa Réserve ;
  - `setVariable` (l.239), `setMode` (l.300), `moveRow` (l.355) ;
  - `commitSheetDraft` (l.~439) : `validateForSave(…, baseline)` ;
  - `applyRequestedTotal`, `isRequestedTotalEditable` (l.403-430) : y brancher l'indicateur d'héritage, en le passant à `isTotalDurationInvertible` et `invertTotalDuration`, qui l'acceptent depuis la story 2.1.
- `src/domain/activities/ExecutionParameters.ts:~360` : alignement par rang de la ligne de base dans `validateForSave` ; le commentaire renvoie à la story 3.2. Ajouter une entrée de ligne de base par identité, sans casser les appelants actuels (Catalogue, `"STORAGE"`).
- `src/domain/activities/__tests__/ExecutionParametersDraft.test.ts` : 34 tests existants, à conserver ; ajouter les tests `PRE4-3.2/ACn`.
- `src/features/activities/ExecutionParametersSheet.tsx` : appelant du Brouillon. Il ne doit pas changer de comportement. Toute adaptation de signature s'y limite au strict minimum de compilation.

## Tasks & Acceptance

**Execution:**
- [x] `ExecutionParametersDraft.ts` : `removeRow`, `pendingRemoval`, `undoRemoval` et l'invalidation de Q29 (AC10) ; ligne de base par identité (AC12) ; indicateur d'héritage en entrée, non persisté (AC14).
- [x] `ExecutionParameters.ts` : ligne de base par identité dans `validateForSave` (AC12).
- [x] Tests `PRE4-3.2/AC1` à `AC14` : un test par cas de la liste de Q29 ; scénarios de FR-12-06.

**Acceptance Criteria:**
- Given la story 3.2 de `epics-parts/epic-3.md`, when elle est livrée, then chacun de ses critères AC1 à AC14 est vérifié par un test nommé `PRE4-3.2/ACn` ; le comportement de la Feuille est inchangé (tests existants verts) ; `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts.

## Design Notes

H4, H25, H26 et H27 sont appliquées comme écrites, au titre de la validation globale du plan. Aucune recette propre : les règles se recettent par les stories 3.3 à 3.6.

## Implementation Notes

- **Ajouts au Brouillon** (`ExecutionSheetDraft`) : `pendingRemoval` (`{ index, row, rowId }` ou `null`), `originById` (identité → rang de sa ligne dans les paramètres ouverts), `inheritedSeriesCount`. Nouvelles transitions `removeRow(draft, index)` et `undoRemoval(draft)`. `openSheetDraft(parent, { inheritedSeriesCount })`, option facultative : l'appel de la Feuille est inchangé.
- **Q29** : chaque transition qui modifie le Brouillon remet `pendingRemoval` à `null`, y compris les réglages hors liste (côté, ordre, Pause entre les côtés, Compte à rebours, Fin, Cible commune, Inversion). Une Cible réappliquée à l'identique (✓ du Sélecteur sans rotation) l'invalide aussi. Les seules transitions qui rendent le Brouillon inchangé, annulation comprise, sont les cas sans effet qui existaient déjà : même Mode, même Régime, déplacement sur place ou hors bornes. Un `setSeriesCount` saturé (− à N = 1) l'invalide.
- **AD-13, Feuille** : `validateForSave(input, baseline, { baselineRowIndexes })`. Le Brouillon garde l'origine de chaque identité, c'est-à-dire le rang de sa ligne dans les paramètres ouverts (`originById`, `openedRows`). Au ✓, `commitSheetDraft` rapproche ces rangs de la ligne de base de l'Éditeur par `alignRowsToBaseline(openedRows, base, { exclusive: true })`, d'abord par valeur, puis par rang encore libre. La Feuille rouverte après un ✓ qui a réordonné reste donc alignée sur la base de l'Éditeur, et non sur le parent.
  - Une copie de valeur sans modification garde la base de sa source. Au passage en `identiques`, l'uniforme hérite de la base de la première ligne. Au passage en `variables` sans tableau réservé, la k-ième copie reçoit la k-ième ligne du parent développé, ce qui donne des origines distinctes.
  - Une ligne ajoutée par N n'a pas de base, y compris en complément d'un tableau restitué.
- **AD-13, Éditeur** (`Terminer`, `patchLocal`, `isActivityEditorFormValid`, Catalogue) : sans `baselineRowIndexes`, `validateForSave` aligne chaque Série d'abord sur une ligne de base de même valeur (Cible typée et Pause égales). L'appariement est glouton, dans l'ordre, et chaque ligne de base sert au plus une fois. À défaut, la Série garde la ligne de même rang, comme avant. Une ligne historique déplacée sans modification reste ainsi tolérée après le ✓ de la Feuille. Aucune interface n'est modifiée.
- **Garde de `baselineRowIndexes`** :
  - une longueur différente du nombre de Séries fait ignorer toute la liste : aucune Série n'a de base ;
  - une entrée non entière, hors des rangs de la base ou présente plusieurs fois est ignorée pour chaque Série qui la porte.
- **Index hors bornes** : `setRowTarget`, `setRowPause` et `undoRemoval` (position disparue, état incohérent) rendent le Brouillon inchangé, sans recalage.
- **Réserve (AC14), interprétation** : la Réserve est un état volatil du Brouillon. Le ✓ ne la transmet jamais, que N soit hérité ou non. Une réouverture n'en a donc plus (« le ✓ vide la Réserve »). Sous N hérité, aucune règle ne purge la Réserve ni ne modifie N : seule l'Inversion du total est indisponible.
- **Reporté au niveau interface (stories 3.3 et 3.6)** : la preuve qu'ouvrir puis fermer un popover ou le Sélecteur sans application n'invalide pas `pendingRemoval`. L'état des surfaces n'est pas dans le Brouillon.
- **Fonctions existantes corrigées** : aucune règle n'a été modifiée. Les seuls changements des fonctions existantes sont l'invalidation de `pendingRemoval`, le suivi de `originById` dans `setVariable` et l'indicateur d'héritage transmis à `isTotalDurationInvertible` et `invertTotalDuration`. La précédence H27 de `setMode` était déjà conforme.
- **Tests** :
  - `ExecutionParametersDraft.test.ts` : tests `PRE4-3.2/ACn`, dont 16 cas Q29 en `it.each`, le retrait combiné à la Réserve et la réouverture après réordonnancement ; les 34 tests existants sont conservés ;
  - `ExecutionParameters.test.ts` : alignement par valeur, repli par rang et garde de `baselineRowIndexes` (Régime identiques, entrées `null`, longueur incohérente, doublon, hors bornes) ;
  - `ExerciseScreen.test.tsx` : déplacement de la ligne 5999 s, ✓ puis `Terminer`, avec un second cas après réouverture de la Feuille.

## Spec Change Log

## Review Triage Log

Revue du 2026-10-17 (itération 0) : `blind-hunter` (B), `edge-case-hunter` (E), `verification-gap` (V).

| Constat | Verdict | Preuve | Route |
|---|---|---|---|
| V1/E1 — ligne de base par identité limitée à la Feuille : `Terminer` revalide par rang et refuse la ligne historique déplacée ; à la réouverture, l'origine est alignée sur le parent et non sur la base | high | `ExerciseScreen.tsx:323,522`, `ActivityEditorForm.tsx:124` revalident sans alignement ; l'AC12 attend que la valeur soit tolérée et enregistrée | patch : appariement par valeur dans `validateForSave` quand aucun alignement n'est fourni, puis par rang ; origine calculée parent → base ; test écran |
| E2/B4 — `baselineRowIndexes` non contrôlé et non testé | low | Longueur, entier, bornes, doublons | patch (garde et tests) |
| E3/B5 — index hors bornes : Brouillon inchangé mais annulation perdue | low | `setRowTarget`, `setRowPause` | patch |
| B8 — recalage silencieux de `undoRemoval` | low | `Math.min` | patch |
| B9 — en-tête périmé | low | | patch |
| B2/V2 — AC10 « popover sans application » prouvé par les noms d'export du module | low | Aucune transition d'ouverture n'existe dans le domaine ; la preuve relève de l'interface | patch (test retiré, renvoi) ; preuve reportée aux stories 3.3 et 3.6 (`deferred-work.md`) |
| B1 — AC14 : Réserve sous héritage, assertion tautologique | low | `commitSheetDraft` est pure | patch (assertion retirée, interprétation consignée) |
| B6 — retrait combiné à la Réserve non testé | low | | patch (test) |
| B7 — AC2 prouvé par une seule chaîne | low | | patch (tests) |
| B10 — AC11 : contrôle des clés volatiles faible ; tableaux imbriqués du parent | low | | patch (tests) |
| B3 — identiques contre variables pour une ligne ajoutée par N | false | En identiques, la Cible commune reste celle de la base, non modifiée, donc tolérée ; en variables, une ligne ajoutée est nouvelle et n'a pas de base (AD-13) | rejeté |
| V3 — appels à `modified()` inaccessibles avec une annulation en attente | low | Sans effet | rejeté |
| E4 — l'indicateur d'héritage n'est pas câblé par la Feuille | false | Câblage hors story (aucun N hérité produit en PRE-4, P42) | rejeté |

## Verification

**Commands:**
- `npm test` -- expected: toutes les suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
