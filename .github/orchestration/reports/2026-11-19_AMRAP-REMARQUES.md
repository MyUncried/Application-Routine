# 2026-11-19 — AMRAP : remarques de la ligne amrap-1 (recette du 18/11/2026)

## Identifiant et objectif

- **Mission :** AMRAP-REMARQUES (7e et dernière mission de la série des corrections de la recette du 18-19/11/2026).
- **Objectif :** appliquer exactement la note KO de la ligne `amrap-1` du cahier en ligne.

Texte de Hermann :

> Un exercice : Mettre "Série" en gris, nombre de séries "-"
> Appui sur +Tour - Annonce : ne pas répéter le nom du mouvement s'il ne change pas, seulement le nombre de répétition / durée
> Synthèse d'exercice, ne pas répéter le nom de l'exercice si c'est le même :
> - Un exercice : Une ligne avec le nom de l'exercice puis par tour : Tour X + Nb de répétitions + Durée
> - plusieurs exercices : une ligne par Tour X puis par mouvement : Nb de répétitions + durée
> Durée de l'exercice : la solution refuse une durée inférieure à 1 minute.

## Branche et commit de départ

- **Worktree :** `C:\Dev\KODJO-EMOM-DUREE`.
- **Branche :** `recette/amrap-remarques-20261119`, créée depuis `recette/max-echec-20261119` (`66a8a507`).
- **Empilement :** branches dédiées empilées, toutes sur l'écran d'exécution.

## Périmètre demandé et traité

| Demande | Traitement |
|---|---|
| Série en gris, « – » (un exercice) | **Fait.** Projection : `series` vaut `null` pendant les tours d'un AMRAP dont la boucle ne compte qu'un mouvement (côtés compris). Le compteur existant rend alors le libellé et « – » en gris, le même rendu que le « Tour – » de la mission d. Le buy-in, l'AMRAP à plusieurs mouvements et l'AMRAP en Max (D-531) ne changent pas. |
| Annonce à « + Tour » sans répéter le nom | **Fait pour le cas restant.** Avec l'interrupteur « Annonce des tours » activé et un objectif unique, la mission c (D-530) ne répétait déjà pas le nom. Restait l'objectif non unique ou en durée : l'ancienne annonce disait « Nom, objectif » à chaque tour, parce que la Série reste 1 d'un tour à l'autre en AMRAP. Désormais, si le même mouvement ouvre un tour avec la même Série et le même côté, seul l'objectif est annoncé. Le For time n'est pas concerné : sa série change à chaque tour, sa règle reste la même. |
| Synthèse regroupée | **Fait.** Les tours d'un bloc AMRAP sont regroupés dans la synthèse de fin. Un mouvement : une ligne avec le nom, puis « Tour X · N rép. · durée » par tour. Plusieurs mouvements : une ligne « Tour X », puis « Nom · N rép. · durée » par mouvement. |
| Durée de l'exercice < 1 min refusée | **Fait.** Aucune règle n'impose une minute : FMT-26 et le registre des Formats (`registry.ts`) fixent le minimum à 1 s. La modale accepte donc de 1 s à 180 min. |

## Constats

- La borne de 60 s se trouvait dans `scalarEntryOf("formatDuration")` de `ExecutionParametersSheet.tsx`, sans règle documentée derrière.
- Le questionnaire du Format (`formatModels.ts`, `durationSeconds`) garde aussi un minimum d'une minute. Ce n'est pas la « Durée de l'exercice » citée, donc il n'est pas modifié ; il est signalé ci-dessous.
- Une sonde Jest sur l'ancienne synthèse affichait « Mouvement E · Tour 1 / Terminée · 00:30 » à chaque tour : le nom était répété à chaque ligne.

## Preuves et tests

- `npx tsc --noEmit` : aucune erreur.
- `npx eslint` sur les 8 fichiers touchés : aucune erreur.
- Nouveaux tests :
  - `ExecutionScreen.amrapRemarques.test.tsx` : 4 tests. Série « – », compteur inchangé à plusieurs mouvements, synthèse à un mouvement, synthèse à plusieurs mouvements.
  - `ExecutionSignalAdapter.amrapRemarques.test.ts` : 2 tests.
  - `ExecutionParametersSheet.format0711.test.tsx` : 1 test ajouté (45 s acceptée).
- Régression ciblée `src/features/execution src/domain/execution src/infrastructure/haptics src/features/activities` (`--maxWorkers=2`) : **99 suites, 1 248 tests réussis, aucun échec**.
- Suite complète : voir § « Suite complète ».

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE.** Moteur (`kernel.ts`, politiques) non modifié : aucune ligne dans `policies/`. Les autres formats ne changent pas, comme le montrent les suites d'exécution For time, EMOM et Death by, toutes vertes. La règle d'annonce du For time reste la même (les tests de signaux restent verts). Le D-530 avec interrupteur coupé garde le son seul. L'AMRAP en Max (D-531) garde son compteur de Série.
- **CHANGE.** Le compteur Série de l'AMRAP à un mouvement, l'annonce d'un tour sur le même mouvement, la synthèse AMRAP et la borne de la Durée de l'exercice.
- **FORBIDDEN.** Aucune réécriture de tests : un test est ajouté dans un fichier existant, deux fichiers sont nouveaux.

## Hypothèses non démontrées et points signalés

1. **Synthèse à plusieurs mouvements :** le texte dit « par mouvement : Nb de répétitions + durée ». J'ai gardé le nom en tête de chaque ligne, sans quoi les mouvements ne se distinguent pas. Interprétation à confirmer.
2. **Statut « Terminée / Partielle » :** il n'est plus sur les lignes de tour, qui suivent exactement « Tour X + Nb de répétitions + Durée ». Un tour inachevé se lit à ses répétitions saisies.
3. **Questionnaire du Format AMRAP (« Durée ») :** il refuse toujours moins d'une minute. Non cité, non modifié.
4. **Interrupteur « Annonce des tours » coupé :** son seul en début de tour (D-530, mission c). Rien n'est annoncé, donc le nom n'est pas répété.
5. **AMRAP en Max :** les répétitions viennent des saisies. Une Série non saisie apparaît sans « rép. ».

## Modifications réalisées et fichiers modifiés

- `src/domain/execution/projection.ts` : `singleMovement` dans la vue AMRAP, `amrapRoundLeafOf`, compteur Série.
- `src/domain/execution/results.ts` : `roundMovementOf`.
- `src/features/execution/ExecutionScreen.tsx` : synthèse regroupée (type `EndGroup`).
- `src/infrastructure/haptics/ExecutionSignalAdapter.ts` : annonce d'un tour sur le même mouvement.
- `src/features/activities/ExecutionParametersSheet.tsx` : borne de la Durée de l'exercice.
- Tests :
  - `src/features/execution/__tests__/ExecutionScreen.amrapRemarques.test.tsx` (nouveau) ;
  - `src/infrastructure/haptics/__tests__/ExecutionSignalAdapter.amrapRemarques.test.ts` (nouveau) ;
  - `src/features/activities/__tests__/ExecutionParametersSheet.format0711.test.tsx`.
- Documentation (classe B) :
  - `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` : section « AMRAP — recette iPhone du 18/11/2026 (amrap-1) », texte de Hermann recopié, formulations remplacées annotées.
  - `_bmad-output/pre11/spec-pre11-formats.md` : point 40.
  - Chapitres 09 et 12 non modifiés.

## Non corrigé ou hors périmètre

- Minimum d'une minute du questionnaire du Format (point 3).

## À vérifier sur iPhone

- Série grisée « – » pendant un AMRAP d'un mouvement.
- Annonce à « + Tour » sans le nom : objectif en durée, et interrupteur activé.
- Synthèse à un mouvement et à plusieurs mouvements.
- Saisie d'une Durée de l'exercice de 45 s dans la modale.

## Commit final et état Git

Voir § « Commit et état Git ».

## Suite complète

`npx jest --maxWorkers=2` lancée en arrière-plan sur `b79529d9` : **arrêtée par Claude Code pour mémoire système basse**, sans résultat. Non relancée, conformément à la consigne (pas de relance automatique après un arrêt pour mémoire). À relancer sur demande ; la régression ciblée (99 suites, 1 248 tests) est verte.

## Commit et état Git

- `b79529d9` : code, tests, documentation, rapport.
- Commit documentaire de ce complément : voir `git log` de la branche.
- Branche `recette/amrap-remarques-20261119` poussée ; pas de PR, pas de fusion.
