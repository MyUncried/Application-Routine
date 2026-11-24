# 2026-11-19 — EMOM-SERIE-TOUR : série et tour de l'EMOM à plusieurs mouvements (D-532)

## Identifiant et objectif

- Mission : constat a) des « Autres remarques » du cahier de recette en ligne (Hermann, 18/11/2026), « Concept série / tour de l'EMOM à plusieurs mouvements ».
- Objectif : libellés du questionnaire, des colonnes du tableau et de la modale, et compteurs Série | Tour de l'écran d'exécution, selon le mode d'exécution (« À la suite », « Dans chaque intervalle », « En alternance »).

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-EMOM-DUREE`, branche dédiée `recette/emom-serie-tour-20261119`, empilée sur `recette/emom-cotes-anneau-20261119` (`5e8c7082`), elle-même sur `recette/coins-chrono-20261119` (`8c006ee7`). Pas de fusion, pas de PR.

## Périmètre demandé

- « À la suite » : questionnaire « Nombre de séries », colonnes S1 … SN, modale « X séries … » inchangés ; écran : tour = rang du mouvement (défaut : le tour restait à 1), série repartant à 1 à chaque mouvement.
- « Dans chaque intervalle » et « En alternance » : questionnaire « Nombre de tours » (suit le mode dès qu'il change), colonnes T1 … TN, modale « X tours identiques / variables » ; écran : série = position du mouvement dans le tour (remise à 1 à chaque tour, avance à chaque « Suivant »), tour avançant après le dernier mouvement.
- Ne pas changer noms techniques, données enregistrées, historique ; EMOM à un seul mouvement inchangé.
- Classe B : registre (numéro libre), contrat d'écran de l'EMOM.

## Périmètre réellement traité

Tout le périmètre demandé. Rien d'autre (ni repère sur l'anneau, ni tours au repos : mission e).

## PRESERVE / CHANGE / FORBIDDEN

| Élément | Statut | Preuve |
|---|---|---|
| Autres formats (For time, AMRAP, Death by, Tabata…) | PRESERVE — inchangé | `countersOf` ne s'applique qu'aux étapes dont la portée la plus interne est EMOM (`formatKindOfLeaf === "EMOM"`) et à un Circuit d'au moins deux Exercices ; libellés : condition `model === "EMOM"` ; modale : Circuit porteur EMOM ou Circuit SERIES de membres EMOM. Suites `src/domain/execution` et `src/features/execution` vertes (29 suites, 212 tests). |
| Validations EMOM, calcul des durées, durées d'exécution | PRESERVE — inchangé | Aucun changement dans `formatModels.ts`, `formatTimeline.ts`, politiques ; seul `plan.ts` gagne un champ d'affichage. |
| Écran EMOM en durée (anneau unique) | PRESERVE — inchangé | `ExecutionScreen.tsx` non modifié. |
| Moteur de fenêtres | FORBIDDEN — non touché | `policies/emom.ts`, `kernel.ts` non modifiés ; étapes, clés et résultats d'étape identiques (le champ ajouté au plan n'entre ni dans les étapes ni dans `StepResult`). |
| Réécriture massive des tests | FORBIDDEN — non fait | Deux fichiers de tests ajoutés ; aucun test existant modifié. |
| Libellés questionnaire / tableau / modale de l'EMOM à plusieurs mouvements | CHANGE | `FormatModelScreen.tsx` (`emomRounds`), `formatSheetContext.ts` (`seriesWordingOf`), `fr.ts` (`table.roundShort` « T{n} »). |
| Compteurs de l'écran d'exécution | CHANGE | `projection.ts` (`countersOf`, utilisé par l'étape courante, les compteurs du repos et ceux de l'étape à venir). |

## Constats

- Formes construites par le modèle EMOM (`buildModelElements`) : « Dans chaque intervalle » = Circuit porteur EMOM de N tours ; « En alternance » = Circuit à séries alternées de N tours, membres EMOM ; « À la suite » = Circuit groupé d'un seul tour, membres EMOM de N séries.
- Avant : Série = série de l'Exercice (k / N), Tour = tour du Circuit (k / N, ou 1 / 1 « À la suite »).
- « À la suite » avec N = 1 et « En alternance » avec N = 1 donnent les mêmes étapes : seule la nature du Circuit les distingue. Elle n'était pas dans le plan d'exécution ; elle y est ajoutée (`ExecutablePlan.circuits`, nature, Format porteur, Exercices dans l'ordre), lue par la projection seulement. Le plan n'est pas enregistré (l'exécution enregistre l'instantané et le recompile) ; `StepResult.context` est inchangé.

## Modifications réalisées

- `src/domain/execution/plan.ts` : type `PlanCircuitInfo`, champ optionnel `circuits` du plan compilé.
- `src/domain/execution/projection.ts` : `countersOf` (règle D-532), branché sur `series` / `tour` de l'étape courante, de `previousCounters` (repos) et de `upcoming` (compte à rebours initial, point d'arrêt).
- `src/features/sessions/FormatModelScreen.tsx` : `emomRounds()` — ligne « Nombre de tours » et en-têtes T1 … TN pour l'EMOM à plusieurs mouvements hors « À la suite ».
- `src/features/sessions/formatSheetContext.ts` : `seriesWordingOf` renvoie « rounds » pour un membre d'un Circuit porteur EMOM ou d'un Circuit SERIES de membres EMOM.
- `src/shared/i18n/resources/fr.ts` : `table.roundShort` = « T{n} ».
- Tests : `src/domain/execution/__tests__/emom.serieTour.test.ts`, `src/features/sessions/__tests__/FormatModelScreen.emomSerieTour.test.tsx`.
- Documentation (classe B) : registre ch07, entrée D-532 (texte de Hermann recopié) ; ch13 CE-FMT-05 complété ; formulations « EMOM … S1…Sn » annotées (datées, texte conservé) dans `docs/KODJO-Formats-entrainement-2026-11-02.md` (3), `docs/INDEX.md`, `docs/PRODUCT.md`, `docs/KODJO-Composition-conteneurs-2026-10-28.md` ; spec PRE-11 §5 point 36. Chapitres 09 et 12 non modifiés.

## Numéro de décision

D-532 : D-531 est le dernier numéro sur `origin/docs/planification-grille-creneaux` ; recherche `D-53[2-9]` dans les branches des 33 PR ouvertes et dans toutes les branches distantes : aucun résultat (19/11/2026).

## Preuves et tests

- `npx tsc --noEmit` : aucune erreur.
- `npx eslint` sur les 7 fichiers touchés : aucune erreur.
- `npx jest src/domain/execution/__tests__/emom.serieTour.test.ts src/features/sessions/__tests__/FormatModelScreen.emomSerieTour.test.tsx` : 10 tests réussis (M = 3, N = 3 pour chaque mode, séquence complète ; M = 2, N = 3 « À la suite » ; changement de mode au questionnaire ; un seul mouvement inchangé ; compteurs au repos).
- `npx jest src/domain/execution src/features/execution --maxWorkers=2` : 29 suites, 212 tests réussis.
- `npx jest FormatModelScreen formatSheetContext src/shared/i18n useMovementExerciseIntake --maxWorkers=2` : 6 suites, 139 réussis, 32 ignorés (préexistants).
- Suite complète non lancée (prévue en fin de série). Une suite verte ne remplace pas la validation sur iPhone.

## Hypothèses non démontrées / cas signalés (non tranchés)

1. Circuit EMOM composé à la main sous une autre forme (Circuit groupé de plusieurs tours sans Format porteur, membres EMOM) : non couvert par la définition ; compteurs inchangés.
2. Conséquence de la définition : « À la suite », la piste de progression affiche un segment par tour, donc M segments (un par mouvement) au lieu d'un seul (`tourSegments`, repères de lecture). Non modifié ; à confirmer sur iPhone.
3. Un mouvement de chaque côté compte pour une seule position : ses deux côtés gardent la même Série (« Une série est une fenêtre d'un mouvement »).
4. Death by « dans chaque intervalle » / « en alternance » : non concerné (autre portée) ; compteurs inchangés.
5. La ligne « À suivre » (`outline`) garde l'ancien décompte (hors périmètre : non citée).

## Éléments non corrigés / hors périmètre

- Repère figé sur l'anneau au changement de mouvement et nombre de tours visible au repos : mission e (suivante).

## Vérifications restant sur iPhone

- « Dans chaque intervalle » puis « En alternance », M = 3, N = 3 : questionnaire « Nombre de tours », colonnes T1 T2 T3, modale « 3 tours identiques » ; exécution S1T1, S2T1, S3T1, S1T2…
- « À la suite », M = 3, N = 3 : « Nombre de séries », S1 S2 S3, « 3 séries identiques » ; exécution S1T1, S2T1, S3T1, S1T2… (tour = rang du mouvement).
- « À la suite », M = 2, N = 3 : tour de 1 à 2, série de 1 à 3 à chaque mouvement.
- Changement de mode au questionnaire : libellé et colonnes changent aussitôt.

## Fichiers modifiés

Voir « Modifications réalisées » ; plus le présent rapport.

## Commit final et état Git

Renseignés dans le message de livraison (commit de cette branche, poussé sur `origin/recette/emom-serie-tour-20261119`).
