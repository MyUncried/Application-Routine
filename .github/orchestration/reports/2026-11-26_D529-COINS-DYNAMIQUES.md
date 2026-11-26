# Rapport de mission — D529-COINS-DYNAMIQUES (26/11/2026)

## Identifiant et objectif

- **Mission** : D529-COINS-DYNAMIQUES — application du prompt normatif `docs/PROMPT-CLAUDE-CODE-COINS-DYNAMIQUES-2026-11-26.md` (complément D-529 du registre ch07, contrat CE-UI-14 du ch13, validés par Hermann le 26/11/2026).
- **Objectif** : le compte à rebours d'une Série en Durée d'un Format passe du coin bas gauche au coin **bas droit** ; la charge reste en bas gauche ; une seule information dynamique en bas droit ; aucun compteur « mouv. » en EMOM en Durée ; un coin sans information reste vide.
- **Type** : développement (classe A de la règle de synchronisation code / documentation : le code rejoint une règle déjà écrite).

## Branche et commit de départ

- Branche documentaire : `origin/docs/d529-coins-dynamiques-20261126`, HEAD vérifié `dd9867c7095c650a6404a0f5a73eecf178be52a8` (créée depuis `main@410fc7911c3851533dd6fc5c141ec1ac311c4c34` ; `main` vérifié toujours à `410fc7911` le 26/11/2026).
- Branche de développement : `feat/d529-coins-dynamiques-20261126`, créée depuis `dd9867c70` dans le worktree `C:\Dev\KODJO-D529` (dépendances : jonction vers `C:\Dev\Application-routine\node_modules`, aucun module manquant signalé par `tsc`).
- État Git avant édition : propre (worktree neuf).

## Périmètre demandé

§1 à §4 du prompt : `executionCorners.ts` seule autorité de placement ; `SERIES_COUNTDOWN` → `BOTTOM_RIGHT` ; exclusivité des informations dynamiques du bas droit ; suppression des replis techniques vers `BOTTOM_LEFT` ; vérifications Death by et Tabata / 30-30 ; préservation du chrono, de l'anneau, des retenues, couleurs, géométrie ; tests de non-régression listés au §3 ; seconde passe indépendante ; PR sans fusion.

## Périmètre réellement traité

Tout le périmètre demandé. Aucune modification de Figma, du domaine (logique), de la base, des services, des styles ni de la géométrie des triangles.

## Classification PRESERVE / CHANGE / FORBIDDEN (établie avant le code)

| Classe | Élément | Démonstration après modification |
|---|---|---|
| CHANGE | `CORNER_OF.SERIES_COUNTDOWN` : `BOTTOM_LEFT` → `BOTTOM_RIGHT` | `executionCorners.ts` ; test « CORNER_OF : SERIES_COUNTDOWN = BOTTOM_RIGHT, LOAD = BOTTOM_LEFT » |
| CHANGE | `CORNER_TABLE` : For time, AMRAP, Death by → bas gauche `["LOAD"]`, bas droit `["SERIES_COUNTDOWN", "MOVEMENT_COUNT"]` ; EMOM en Durée → bas gauche `["LOAD"]`, bas droit `["SERIES_COUNTDOWN", "MOVEMENT_COUNT"]` (le compteur n'est jamais produit pour une Série en Durée ; repli conservé pour une Série en Répétitions guidée dans une fenêtre mixte, voir revue) | tests de table par format |
| CHANGE | Repli `slotOf("SERIES_COUNTDOWN") ?? "BOTTOM_LEFT"` → `"BOTTOM_RIGHT"` (`ExecutionScreen.tsx`) | diff |
| CHANGE | Commentaires de code devenus faux (annotés « [… — remplacé] ») : `executionCorners.ts`, `ExecutionScreen.tsx`, en-tête de `ExecutionScreen.emomDuree.test.tsx` | diff |
| PRESERVE | `ExecutionCornerBadge.tsx` (forme, dimensions Figma, alignement : à droite `alignItems: flex-end`, en bas `justifyContent: flex-end`, marges 12) | fichier non modifié (`git diff --stat`) |
| PRESERVE | Couleurs du décompte (`DURATION_BADGE` vert `#BDEBC9` en cours, orange `#FFD194` en retenue), clignotement des 3 dernières secondes, figement en retenue, texte du décompte | code inchangé hors repli ; tests For time et EMOM en Durée (couleur en cours, retenue, reprise) |
| PRESERVE | Chrono principal, anneau, points d'arrêt, pauses / récupérations, progression, signaux, « +Tour », ligne Série / Tour / Cycle | aucune ligne modifiée ; suites For time, EMOM, EMOM intervalle, AMRAP, AMRAP Max, Death by vertes |
| PRESERVE | Domaine : `autoRepetitionsOf` (compteur seulement en Répétitions guidées), projections `duration` | `projection.ts` non modifié (un commentaire y mentionne encore « coin du bas à gauche » pour l'EMOM en Durée : laissé tel quel pour ne pas toucher au domaine, sans effet) ; test `projection.autoRepetitions` vert |
| FORBIDDEN | Figma, base de données, services, styles, géométrie, nouvelles données ; import de la forme vide du bas gauche de `integration/recette-26-11` | non touchés |

## Constats

1. **Données disponibles par format** (lecture de `projection.ts` et `ExecutionScreen.tsx`) :
   - `durationActive` : For time et AMRAP (Série en Durée en cours ou retenue), EMOM (fenêtre portant une Série en Durée), **Death by** (`deathByFormatOf` expose `duration` pour une Série en Durée, toujours `RUNNING`, aucune retenue).
   - `autoRepetitions` : uniquement `mode === "REPETITIONS"` avec phases (`autoRepetitionsOf`) — jamais en Durée ; aucun changement nécessaire du domaine.
   - `restCountdownMs` : EMOM en Répétitions, pendant le repos de fenêtre.
   - `amrapScore` : AMRAP à un seul mouvement en Max.
   - Tabata / 30-30 : pas de `format` For time / EMOM / AMRAP / Death by → `durationActive` nul ; aucun décompte de coin (comportement conservé).
2. **Exclusivité** : `assignCorners` place au plus une information par coin ; chaque cadre n'est rendu que si `slotOf(item)` le désigne. Le bas droit ne peut donc porter qu'une information dynamique (test exhaustif des 16 combinaisons × 10 scénarios).
3. **Alignement** : le cadre en coin aligne déjà le contenu à droite et en bas pour un coin bas droit (recette du 17/11/2026) ; le décompte (une ligne) se place sur la ligne basse, calée à droite. Aucune modification de style requise.

### Analyse historique (Death by)

- **Parcours** : Death by avec une Série en Durée.
- **Dernier comportement connu** : avant `8c006ee7a` (19/11/2026, « quatre coins du chronomètre — table unique »), le cadre du décompte était rendu dès que `durationActive !== null`, Death by compris (bas gauche).
- **Introduction** : `8c006ee7a` conditionne le cadre à `slotOf("SERIES_COUNTDOWN")` ; la ligne `DEATH_BY` de la table ne contenait pas `SERIES_COUNTDOWN` → décompte masqué en Death by. Attribution **démontrée** (code) ; intention **indéterminée** (le rapport `2026-11-19_COINS-CHRONO-D529.md` ne cite que For time, AMRAP et EMOM en Durée).
- **Détection** : présente mission (vérification §2.4 du prompt).
- **Correction** : CE-UI-14 (26/11/2026) prévoit pour le Death by « compte à rebours de Série en Durée si effectivement disponible ». La projection l'expose : `SERIES_COUNTDOWN` ajouté en tête du bas droit de `DEATH_BY`. Aucun mécanisme nouveau (pas de retenue en Death by, pas de zone d'appui).

## Matrice de conformité par format

| Format / étape | Haut gauche | Haut droit | Bas gauche | Bas droit | Preuve | Statut |
|---|---|---|---|---|---|---|
| For time, Série en Durée active avec charge | objectif | temps max (si défini) | charge | décompte (vert / orange figé en retenue) | table + `ExecutionScreen.forTimeDuree` « complément D-529 » | CONFORME (tests) |
| AMRAP, Série en Durée active avec charge | objectif | temps limite du bloc | charge | décompte | table (`it.each` FORMATS) + `ExecutionScreen.amrapRemarques` « complément D-529 — AMRAP » | CONFORME (tests) |
| AMRAP Max | — | temps limite | charge | score cumulé (toujours) | table ; suite `amrapMax.d531` verte | CONFORME |
| EMOM en Répétitions | objectif | intervalle | charge (travail) | décompte du repos pendant le repos seulement ; sinon vide | table + `ExecutionScreen.emom.pre11` | CONFORME pour le bas droit ; voir À CLARIFIER 1 pour la charge au repos |
| EMOM en Durée avec charge | objectif | intervalle | charge | décompte actif ; vide au repos ; jamais « mouv. » pour la Série en Durée | table + `ExecutionScreen.emomDuree` « complément D-529 » | CONFORME (tests) |
| Death by, Série en Durée avec charge | objectif du rang | intervalle | charge | décompte (exposé par la projection) | table + `ExecutionScreen.deathBy.pre11` « complément D-529 » | CONFORME (tests) |
| Death by, Répétitions | objectif du rang | intervalle | charge | compteur guidé si disponible ; sinon vide | table | CONFORME |
| Répétitions guidées par phases | objectif | — | charge | compteur « mouv. » | table ; `projection.autoRepetitions` | CONFORME |
| Durée avec phases hors Format, Tabata / 30-30, pause | objectif / durée | — | charge (suivante en pause) | — | table (aucun décompte ajouté) | CONFORME |
| Absence de donnée | — | — | — | — | table « un coin vide reste vide » | CONFORME |

## Preuves et tests

Commandes exécutées (un seul processus, `npx jest -w 1 --workerIdleMemoryLimit=800MB`) :

| Suite | Résultat |
|---|---|
| `executionCorners.test.ts` (dont 13 nouveaux cas du complément) | PASS |
| `ExecutionScreen.amrapRemarques.test.tsx` (+1, AMRAP chargé) | PASS |
| `ExecutionScreen.forTimeDuree.test.tsx` (+1) | PASS |
| `ExecutionScreen.emomDuree.test.tsx` (+1) | PASS |
| `ExecutionScreen.emom.pre11.test.tsx` (+1) | PASS |
| `ExecutionScreen.deathBy.pre11.test.tsx` (+1) | PASS |
| `ExecutionCornerBadge.test.ts`, `ExecutionCornerBadge.pulse.test.tsx` | PASS |
| `ExecutionScreen.amrap.pre11`, `amrapMax.d531`, `emomIntervalle` (non-régression) | PASS |
| `src/domain/execution/__tests__/projection.autoRepetitions.test.ts` (aucun compteur en Durée) | PASS |
| Total | 12 suites, 67 tests, PASS |
| `npx tsc --noEmit` | PASS (code 0) |
| `npx eslint` sur les fichiers modifiés | PASS (code 0) |

Tests échoués : aucun à la livraison (deux échecs intermédiaires corrigés dans les tests : libellé de charge « 20kg », et constat de la charge absente au repos EMOM — voir À CLARIFIER 1 ; le test reste neutre sur ce point).

Tests non exécutés : suite Jest complète (mémoire machine limitée, consigne de tests strictement ciblés) ; aucun test visuel (rendu, pixels) — conformément aux règles du projet.

## Seconde passe indépendante (§4)

- Recherche des variantes « décompte / compte à rebours … bas à gauche », `SERIES_COUNTDOWN … BOTTOM_LEFT`, « coin du bas à gauche » dans `src/`, `docs/` et `_bmad-output/pre11/` : toutes les occurrences restantes sont soit la nouvelle règle (charge en bas gauche), soit des mentions historiques annotées « remplacé » (ch07 lignes ~2958, ~3020, ~3023 ; ch13 ~2775 ; spec PRE-11 §5 point 34 ; commentaires de code). Aucune contradiction active.
- Contrats : CE-UI-14 §2 et §3 et D-529 relus contre la table ; concordance ligne à ligne (voir matrice).
- Revue par un sous-agent indépendant (diff + normes, sans la conclusion) : voir section « Revue indépendante » ci-dessous.

## Revue indépendante

Sous-agent de revue (lecture seule ; reçu : le diff et les chemins des normes, pas la conclusion). Verdict : **aucun écart bloquant** ; placement par une seule table, exclusivité du bas droit, charge préservée en bas gauche, retenue et couleurs inchangées, aucun changement de style ni de géométrie. Remarques et suite donnée :

| Remarque | Suite |
|---|---|
| Fenêtre EMOM mixte (Série en Durée + Série en Répétitions guidée) : le retrait de `MOVEMENT_COUNT` de la ligne EMOM en Durée masquait le compteur de la Série en Répétitions guidée, affiché auparavant | Corrigé : repli `MOVEMENT_COUNT` rétabli derrière `SERIES_COUNTDOWN`. « Aucun compteur en EMOM en Durée » reste garanti par le domaine (`autoRepetitionsOf` : Répétitions seulement ; test `projection.autoRepetitions`) |
| Pas de test écran AMRAP avec charge (demandé au §3) | Corrigé : test ajouté (`amrapRemarques`) |
| Le test EMOM Répétitions figeait l'absence de charge au repos (point À CLARIFIER) | Corrigé : test rendu neutre (si la charge est affichée, c'est en bas gauche) |
| `projection.ts` (domaine) modifié pour un commentaire | Corrigé : modification retirée |
| Death by : le décompte réapparaît (masqué depuis `8c006ee7a`) — changement visible | Conforme à CE-UI-14 ; ajouté à la recette iPhone |
| Tabata / 30-30 : test de table seulement ; transitions décompte → « mouv. » et clignotement à la nouvelle place non testés à l'écran | Non traité (aucune donnée nouvelle ; à vérifier sur iPhone) |
| Commentaire `ExecutionScreen.tsx` (~l. 2188, « cadre en bas à gauche » de l'objectif) | Hors périmètre (concerne l'objectif, recette du 13/11), laissé |
| AMRAP Max : un buy-in en Durée n'aurait pas de décompte visible (ligne AMRAP Max = score seul) | Comportement antérieur, conforme à CE-UI-14 (score seul) ; signalé |

## Hypothèses non démontrées

- Le rendu exact (lisibilité, absence de rognage du décompte « 00:00 » dans le coin bas droit) n'est démontré que par la symétrie de la géométrie existante, pas par une observation sur iPhone.
- Aucune transition visuelle (clignotement, artefact) n'est prouvée par Jest : seule l'absence de deux cadres simultanés au bas droit est prouvée.

## Modifications réalisées

- `src/features/execution/executionCorners.ts` : `CORNER_OF`, lignes `FOR_TIME`, `AMRAP`, `EMOM_DURATION`, `DEATH_BY`, commentaires.
- `src/features/execution/ExecutionScreen.tsx` : repli du décompte vers `BOTTOM_RIGHT`, commentaires annotés.
- Tests : `executionCorners.test.ts`, `ExecutionScreen.amrapRemarques.test.tsx`, `ExecutionScreen.forTimeDuree.test.tsx`, `ExecutionScreen.emomDuree.test.tsx`, `ExecutionScreen.emom.pre11.test.tsx`, `ExecutionScreen.deathBy.pre11.test.tsx` (paramètres de fixture optionnels, tests ajoutés ; ancien test « bas à gauche, à confirmer » remplacé).
- Synchronisation code / documentation : **classe A** (le code rejoint D-529 / CE-UI-14 du 26/11/2026, déjà écrits sur la branche documentaire). Documents mis à jour : aucun (A).

## À CLARIFIER / éléments non corrigés

1. **Charge pendant le repos de fenêtre en EMOM en Répétitions.** Le prompt (§3) demande « charge conservée en bas gauche ». Constat : pendant le repos de fenêtre (étape `WINDOW_REST`), l'écran n'affiche aucune charge (`load` n'existe que pendant `ACTIVITY` ; l'étape de repos ne porte pas de charge). Comportement antérieur à la présente mission, non modifié : le rendre visible exigerait de choisir quelle charge afficher (Série terminée ou Série de la fenêtre suivante), ce que ni D-529 (« pendant une pause, charge de la série suivante ») ni CE-UI-14 ne tranchent pour le repos de fenêtre. Le test ajouté reste neutre (aucune charge déplacée vers un autre coin). Décision attendue de Hermann ; la correction éventuelle serait limitée à l'écran.
2. **Forme vide du bas gauche (`integration/recette-26-11`)** — **résolu par arbitrage de Hermann du 26/11/2026 (soir)** : « ne mettre l'angle que si une information est affichée ». La forme vide du bas gauche (testID `execution-corner-empty-bottom-left`, commit `38a9fa4ea`) a été retirée de `integration/recette-26-11` (commit `c1396fe3f`, documentation annotée). Règle D-529 confirmée : aucun triangle vide. Rien à changer sur la présente branche (aucune forme vide n'y existe).

## Vérifications restant à effectuer sur iPhone (procédure de recette)

1. **For time avec Série en Durée chargée** (ex. planche 2 min, 20 kg, temps max défini) : lancer la planche → décompte vert en bas à droite, charge « 20 kg » en bas à gauche, objectif en haut à gauche, temps max en haut à droite ; appui au centre → décompte orange figé, toujours en bas à droite ; 3 dernières secondes → clignotement en bas à droite.
2. **AMRAP avec Série en Durée chargée** : mêmes vérifications, temps limite du bloc en haut à droite.
3. **EMOM en Durée chargé** : intervalle en haut à droite, objectif en haut à gauche, charge en bas à gauche, décompte en bas à droite ; au repos (objectif atteint), bas droit vide, aucun « mouv. » à aucun moment.
4. **EMOM en Répétitions chargé** : bas droit vide pendant le travail ; après « Suivant », décompte du repos en bas à droite ; noter l'état du bas gauche au repos (À CLARIFIER 1).
5. **Death by en Durée chargé** : décompte en bas à droite, charge en bas à gauche, intervalle en haut à droite.
6. **Répétitions guidées par phases** (hors Format) : compteur « mouv. » en bas à droite, aucun décompte concurrent.
7. **AMRAP Max** : score cumulé en bas à droite pendant tout le bloc.
8. **Transitions** : passage d'une Série en Durée à une Série en Répétitions (For time) et changement de fenêtre (EMOM) → jamais deux cadres superposés en bas à droite, pas de clignotement parasite ; décompte « 00:00 »–« 59:59 » lisible et non rogné.

## Fichiers modifiés

Voir « Modifications réalisées » et le présent rapport `.github/orchestration/reports/2026-11-26_D529-COINS-DYNAMIQUES.md`.

## Commit final et état Git

Renseignés dans le compte rendu de livraison (le hash du commit contenant ce rapport ne peut pas figurer dans le rapport lui-même) : branche `feat/d529-coins-dynamiques-20261126`, poussée sur `origin`, PR vers `main` sans fusion.
