---
title: 'D-446 (1/3) — phases compatibles avec Répétitions et À l''échec, durée de série indépendante : modèle, brouillon, Feuille'
type: 'bugfix'
created: '2026-10-26'
status: 'done'
baseline_commit: 'f99c3f955f37a0a23d7539bb039242352759b404'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-phases-motif-cyclique.md'
  - '{project-root}/src/domain/README.md'
  - '{project-root}/src/features/activities/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette JA (Hermann, 26/10/2026) : « Avec phases » et « À l'échec » sont exclusifs, à tort. Le code (depuis PRE-5, `80a6b75a`/`8f3e9512`, présent sur `main`) réserve les phases au mode Durée à cible chiffrée et impose la durée de série = somme des phases (D-370, D-432, ch10 MFN-02 « Éligibilité conservée »).

**Approach:** Arbitrage de Hermann du 26/10/2026 (décision D-446, `arbitrage-2026-10-26-phases-motif-cyclique.md`) : les phases sont un motif cyclique de guidage. (1) phases autorisées avec À l'échec ; (2) phases autorisées en mode Répétitions, durées toujours en secondes ; (3) la durée cible de série n'est plus calculée par la somme des phases — elle reste saisie, indépendante, modifiable. Seule l'incompatibilité phases + séries variables est conservée.

## Boundaries & Constraints

**Always:** Durée du motif = somme des phases, bornée 1..3535 s (D-430, désormais borne du motif). Durées de phase ≥ 1 s ou non renseignées (D-438 : bloque ✓, jamais nettoyées). Séries variables refusées avec des phases ; phases refusées en séries variables N ≥ 2. Modifier une phase ne touche jamais la Cible ; aucune transition ne redimensionne les phases. Données existantes (Cible = somme, mode Durée) restent lisibles et valides. Commentaires français citant D-446 ; tests existants qui encodent l'ancienne règle mis à jour en citant D-446, jamais supprimés pour faire passer ; fichiers CRLF préservés.

**Never:** Aucune migration, aucune modification de `migration001.ts`, `tokens.ts`, `app.json`, `package.json`, `.github/`, docs. Pas de calcul de durée ni de guidage d'exécution (spec 2/3). Pas de règle « dernière série à l'échec » ni d'arrêt mixte (§5). Pas de nouveau texte d'interface.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Phases + À l'échec | Durée, phases [5,2], ✓ | `setStopCondition(FAILURE)` appliqué ; ✓ valide | N/A |
| Phases + Répétitions | phases [5,2], Cible 10 rép. | `setMode(REPETITIONS)` appliqué, phases conservées ; ✓ valide, relu v3/v4 identique | N/A |
| Activation en Répétitions / À l'échec | sans phase, Répétitions ou FAILURE | `canEnableWorkPhases` vrai ; Avec crée 2 phases | N/A |
| Cible indépendante | Durée 120 s, phases [5,2] | Cible 120 s inchangée ; ✓ valide ; durée de phase modifiée → Cible inchangée | N/A |
| Variables refusées | phases présentes | `setVariable(true)` → Brouillon inchangé ; variables N ≥ 2 → `canEnableWorkPhases` faux | N/A |
| Sans / retrait 2 → Sans | Cible 120 s, phases [5,2] | phases vidées, Cible 120 s inchangée | N/A |
| Motif hors bornes | Σ = 3536 | ✓ refusé (`OUT_OF_RANGE` `workPhases`) | violation |
| Durée de phase manquante | [5, null], Cible 120 s | ✓ refusé (`REQUIRED` `workPhases` `phaseId`), Cible 120 s affichée | violation |

</frozen-after-approval>

## Code Map

- `src/domain/activities/ExecutionParameters.ts` -- `workPhasesProblem` (l.754-810) : retirer « require DURATION » (l.764), « require NUMBER target » (l.799) et « target differs from sum » (l.806) ; garder liste, ≤ 6, ids, libellés, MISSING, Σ hors 1..3535 (`sumOutOfRange`). La Cible est contrôlée par `checkRow` selon le mode. `phaseDurationsProblem` (l.1397-1444, forme Catalogue v4) : retirer DURATION, « incomplete requires UNSET », « complete requires NUMBER = Σ » ; garder Σ (liste complète) dans 1..3535 et Cible objet. Mettre à jour les JSDoc (l.149-189, 726-753, 1388-1396).
- `src/domain/activities/Movement.ts` -- `splitResolvedParameters` (l.286-314) : ne plus forcer `UNSET` quand une durée manque, garder la Cible. `resolveCatalogParameters` : INCOMPLETE si durée manquante ou Cible `UNSET` (inchangé). `repriseExecutionParameters` (l.551) : comportement inchangé (Durée, Cible à renseigner, valide), commentaire « seul mode éligible » corrigé.
- `src/domain/activities/sharedCorrection.ts` -- `planSiblingCorrection` (l.152-224) : Avec → Sans : Cible du frère conservée ; complétion de durée de série demandée seulement si sa Cible est `UNSET`. Structure non vide : éligible = séries identiques (tout mode, toute Cible) ; Cible conservée (plus de Σ ni d'`UNSET` forcé). `INELIGIBLE` = séries variables seulement. JSDoc l.78-83, 132-151.
- `src/domain/activities/ExecutionParametersDraft.ts` -- `canEnableWorkPhases` (l.921) : Mode renseigné et identiques effectives. Retirer les refus avec phases de `setMode` (l.599), `setUniformTarget` (l.633), `setStopCondition` (l.1257) ; garder `setVariable` (l.497). Supprimer `deriveSeriesDuration` (seul écrivain de D=Σ) et ses appels : `withWorkPhases`, `normalizeWorkPhases`, `openSheetDraft` (l.291, Cible lue telle quelle). `setWorkPhasesEnabled(false)` et `removeWorkPhase` 2 → Sans : Cible inchangée (plus de « durée restante »). `setWorkPhasesEnabled(true)` : première phase = Cible `NUMBER` dans 1..3535 seulement en mode Durée (D-432, préremplissage conservé), sinon `null` ; seconde `null` ; Cible inchangée. En-tête de fichier (l.55-74) : ajouter un paragraphe D-446.
- `src/features/activities/ExecutionParametersSheet.tsx` -- `hasWorkPhases` ne désactive plus Répétitions (l.1231) ni À l'échec (l.1256) ; `uniformDurationAvailable` (l.1122) sans `!hasWorkPhases` ; ligne « Durée d'une série » (l.2137-2166) : pastille modifiable normale (retirer la branche statique et son libellé « non modifiable ») ; Variables reste `disabled: hasWorkPhases || single` (l.1353) ; Avec : `!canEnableWorkPhases(draft)` inchangé (l.1846). En-tête l.276-296 et commentaires l.1118-1121, 1223-1225, 1241-1247, 1811-1818 : citer D-446.
- Tests à mettre à jour (citer D-446) : `src/domain/activities/__tests__/ExecutionParametersDraft.test.ts` (l.1247-1299, 1303+, ~1545, ~1588, ~1632, ~1909), `ExecutionParameters.test.ts`, `catalogExecutionParameters.test.ts`, `sharedCorrection.a13.test.ts`, `sharedCorrection.a22.test.ts`, `src/features/activities/__tests__/ExecutionParametersSheet.test.tsx` (~l.5113), `ExecutionParametersSheet.phases.test.tsx` (~172, 444, 546, 580), `ExecutionParametersSheet.mfn.a21.test.tsx` (~149, 174, 242), `src/infrastructure/database/__tests__/executionParametersV3.roundTrip.test.ts`, `mfnServices.a13.test.ts`, `mfnPersistence.a12.test.ts`. Repérer les autres échecs par `npm test`.
- Ne pas toucher : `exerciseSnapshot.ts` (`isIncompleteSibling` reste juste), `executionCalculations.ts`, `executionPhrase.ts` (spec 2), `SiblingCompletionStep.tsx`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/domain/activities/ExecutionParameters.ts` -- invariants v3 et v4 assouplis -- D-446 (3) et (1)(2).
- [ ] `src/domain/activities/Movement.ts` -- Cible conservée à la scission ; commentaires -- D-446 (3).
- [ ] `src/domain/activities/sharedCorrection.ts` -- éligibilité des frères et Cible conservée -- D-446.
- [ ] `src/domain/activities/ExecutionParametersDraft.ts` -- éligibilité, levée des refus, suppression de la dérivation de D -- D-446.
- [ ] `src/features/activities/ExecutionParametersSheet.tsx` -- commandes dégrisées, Durée d'une série modifiable -- D-446.
- [ ] Tests -- matrice ci-dessus + §6 de l'arbitrage (compatibilité Durée/Répétitions × objectif/échec, incompatibilité variables, objectif indépendant de Σ) ; tests existants adaptés en citant D-446.
- [ ] `src/domain/README.md`, `src/features/activities/README.md` -- une ligne D-446 si ces fichiers décrivent l'éligibilité ou D = Σ.

**Acceptance Criteria:**
- Given une Feuille en Durée avec phases, when on choisit À l'échec puis Répétitions, then les deux options sont actives et ✓ enregistre ; relu, l'Exercice garde ses phases.
- Given des phases et une Cible de 2 min, when on change une durée de phase ou passe à Sans, then la Cible reste 2 min et sa roue reste ouvrable.
- Given des données à Cible = Σ enregistrées avant D-446, when on les relit, then elles restent valides et inchangées.

## Design Notes

Préremplissage d'activation conservé en Durée seulement (D-432 non visée par l'arbitrage hors D = Σ ; option conservatrice à signaler). Retrait 2 → Sans : D-438 donnait « durée restante = durée de série », règle qui fait d'une durée de phase la durée de série, remplacée par D-446 §4. Frère `INELIGIBLE` : n'existe plus que pour une série variable.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes suites vertes (base 172 suites, 4 329 tests)
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

- Fichiers hors Code Map, justifiés : `ActivityEditorForm.tsx`, `ActivityCard.tsx`, `compositionPresentation.ts` (signal d'incomplétude d'un frère : `hasMissingPhaseDuration`, la Cible n'étant plus forcée à `UNSET`), `executionCalculations.ts` (une ligne : `incomplete` si une durée de phase manque, comportement antérieur rétabli), `WorkPhasesTable.tsx` (commentaire).
- Somme du motif hors 1..3535 : violation portée par les cellules de durée des phases, et non plus par la Cible.
- Vérification après patch : 172 suites, 4 341 tests verts ; `npx tsc --noEmit` et `npm run lint` sans erreur.

## Spec Change Log

## Review Triage Log

Passe 1 (blind-hunter BH, edge-case EC, verification-gap VG) :

| # | Constat | Verdict | Preuve / route |
|---|---------|---------|----------------|
| BH1 / EC5 / VG3 | Frère incomplet à Cible conservée compté `exact` dans les durées d'occurrence et de Séance (`sessions/calculations.ts:69-80`) | medium | Réel : `summarize` ne lisait que `UNSET`. Rétablit le comportement antérieur — patch : `incomplete` si `hasMissingPhaseDuration`, à la source |
| EC1 / EC2 | Frère incomplet à Cible `FAILURE` : « n séries à l'échec » au lieu de « Paramètres à compléter. » | medium | Réel (branche `allTargetsFailure` en premier) — patch : contrôle d'incomplétude d'abord |
| BH2 | Préremplissage D-432 conservé, motif possiblement plus long que la série | low | Choix conservateur déclaré (Design Notes) ; soumis à Hermann (D-446, points non tranchés 3 et 7) — rejeté |
| BH3 | Reprise et anciens frères `UNSET` : la durée de série doit désormais être saisie | low | Conséquence directe de D-446 (§2.3, objectif indépendant) ; à constater en recette — rejeté, signalé au rapport |
| BH4 / EC3 / EC4 | Somme du motif hors bornes marquée sur la Cible (valide) ou nulle part à l'échec | medium | Réel — patch : violation portée par les cellules de durée des phases |
| BH5 | Commentaires et README contraires à D-446 | low | Réel — patch |
| BH6 | Paramètre `mode` inutilisé de `phaseDurationsProblem` | low | Réel — patch : retrait |
| BH7 | Bornes de Cible selon le Mode non testées sur le chemin v4 | maybe-false | Le lecteur v4 relit la Cible par la grammaire v3 et `validateCatalogParameters` passe par `validateForSave` ; à confirmer par un test — rejeté (low si réel) |
| BH8 | Phrase et durée en Répétitions / À l'échec à phases non testées | low | Hors périmètre de cette spec : couvert par la spec 2/3 (calculs) ; phrase inchangée — rejeté |
| BH9 | Couverture SQLite perdue dans `mfnServices.a13` | medium | Réel — patch : variante à Cible `UNSET` |
| BH10 | `setMode` seul avec phases non testé | low | Réel, test direct — patch |
| BH11 | ch09 sans mention D-446 | low | Traité par la spec 3/3 |
| EC6 | Frère à Mode `null` éligible | false | Un Exercice du Catalogue est validé `EDITED` : Mode toujours renseigné |
| EC7 | `readV3` accepte des phases avec Mode `null` | low | Mode `null` ou Cible `UNSET` sont des états de brouillon que D-446 n'interdit plus avec phases ; JSDoc corrigée avec BH5 — rejeté |
| VG1 | Garde de l'éditeur non testée avec une Cible numérique | medium | Pré-vérifié — patch : test jumeau `ExerciseScreen.test.tsx` |
| VG2 | Garde de la carte d'occurrence non testée | medium | Pré-vérifié — patch : cas dans `compositionPresentation.test.ts` |
| VG4 | Titre de test périmé (`mfn.a21`) | low | Réel — patch |
