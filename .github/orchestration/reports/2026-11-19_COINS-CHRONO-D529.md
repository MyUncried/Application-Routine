# 2026-11-19 — Quatre coins du chronomètre (D-529, CE-UI-14) et note KO emom-e1

## Identifiant et objectif

- Mission : section b) « Quatre coins du chronomètre (18/11/2026) » de la note « Autres constats » du cahier de recette, et note KO `emom-e1` (EMOM en durée).
- Objectif : une information, un coin, identique dans tous les formats ; affectation centralisée dans une table unique ; tours acquis dans le bouton « +Tour ».

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-EMOM-DUREE`, branche `recette/coins-chrono-20261119` créée depuis `5293836a` (`formats/emom-duree-20261118`). Branches empilées pour la série de corrections du 19/11 (toutes touchent `ExecutionScreen.tsx`). Pas de fusion, pas de PR.
- Sources normatives lues sans fusion ni checkout : `origin/docs/planification-grille-creneaux` (`b60e1304`) — ch07 D-528, D-529 (commit `cbf5d39a`, 18/11 23:09) ; ch13 CE-UI-13, CE-UI-14.

## Périmètre demandé

- Relever l'emplacement actuel de chaque information par format ; lister les écarts avec CE-UI-14.
- Centraliser l'affectation (scénario → coin → information) dans une seule table, source unique de l'écran.
- Corriger les écarts ; ne pas afficher le rang de la fenêtre ni l'incrément ; repos de l'EMOM en durée non répété en bas à droite ; tours acquis dans « +Tour · n ».
- Note emom-e1 (18/11, 20:04) : « Le compte à rebours est ok, dans le triangle en bas à gauche. En haut à gauche on doit avoir la durée de l'intervalle, valeur fixe, le triangle reste gris. »

## Périmètre réellement traité

Tout le périmètre, avec les cas non couverts signalés ci-dessous (non tranchés au-delà du minimum nécessaire pour qu'un coin ne porte qu'une information).

## Relevé avant (5293836a) et après

| Scénario | Avant : HG / HD / BG / BD | Après : HG / HD / BG / BD |
|---|---|---|
| Exercice en répétitions | objectif / charge / — / — | objectif / — / charge / — |
| Exercice guidé par phases | objectif / charge / — / mouv. | objectif / — / charge / mouv. |
| Pause ou récupération | durée de la pause / — / — / — | durée de la pause / — / charge de la série suivante / — |
| For time sans borne | objectif / charge / compte à rebours durée / mouv. | objectif / — / compte à rebours durée **ou** charge / mouv. |
| For time avec borne | borne « max » / charge / compte à rebours durée / objectif | objectif / borne « max » / compte à rebours durée **ou** charge / mouv. |
| AMRAP | objectif / charge / compte à rebours durée / mouv. | objectif / temps limite du bloc / compte à rebours durée **ou** charge / mouv. |
| EMOM en répétitions | objectif / charge / — / — | objectif / intervalle / charge / compte à rebours du repos (au repos) |
| EMOM en durée | objectif durée (fixe) / charge / compte à rebours de la Série / — | objectif durée (fixe) / intervalle / compte à rebours de la Série **ou** charge / mouv. (sans donnée, voir ci-dessous) |
| Death by | objectif du rang / charge / — / — | objectif du rang / intervalle / charge / — |
| Tabata / 30-30 | exécutés en Séries en durée et Pauses : comme « Exercice » et « Pause » | idem |

Écarts corrigés : charge du haut droite vers le bas gauche (tous formats) ; borne du For time du haut gauche vers le haut droite ; objectif du For time avec borne du bas droite vers le haut gauche ; temps limite du bloc AMRAP ajouté en haut droite ; intervalle EMOM / Death by ajouté en haut droite (valeur fixe, cadre gris, sans « max ») ; compte à rebours du repos de l'EMOM en répétitions ajouté en bas droite ; charge de la série suivante pendant une pause ; « +Tour » → « + / Tour · n ». Rang de la fenêtre et incrément : déjà absents des coins (aucun changement).

## Écart avec la note emom-e1

emom-e1 demandait la durée de l'intervalle en **haut à gauche**. D-529 (postérieure, 23:09) la place en **haut à droite** et garde l'objectif en haut à gauche : D-529 appliquée. Conservé de emom-e1 : valeur fixe, cadre gris ; compte à rebours de la Série en bas à gauche.

## Cas non couverts ou à confirmer (signalés, à arbitrer par Hermann)

1. **Compte à rebours de l'exercice en durée d'un Format** (For time, AMRAP, EMOM en durée) : absent du tableau de CE-UI-14. Laissé en bas à gauche (ft-borne du 17/11, emom-6 et emom-e1 du 18/11) ; il y déclare son exclusivité avec la charge (règle de D-529 « toute information nouvelle déclare son exclusivité ») : pendant ce compte à rebours, la charge n'est pas affichée. Avant, elle restait visible en haut à droite.
2. **« Nombre de mouvements (effort) » en EMOM en durée** : aucun compteur n'existe pour une Série en durée (le compteur « mouv. » n'est calculé que pour une Série en répétitions guidée par des phases). Coin vide.
3. **« Exercice en durée avec phases »** : la ligne du tableau est appliquée à tout exercice guidé par des phases (seul cas où le compteur existe aujourd'hui) ; le compteur « mouv. » garde aussi son coin dans les formats où il existait (For time, AMRAP), comme le dit la règle générale « Bas droite : nombre de mouvements pendant l'effort ».
4. **Compte à rebours du repos de l'EMOM en répétitions** : le chiffre central affiche déjà le temps restant de la fenêtre ; le coin bas droite le répète (appliqué tel que le tableau l'indique).
5. **« +Tour · n »** : format proposé par Claude dans D-529, à valider. For time : tours acquis = Tour en cours − 1 (Série en cours − 1 pour un For time d'un seul exercice), 0 au buy-in, tous au buy-out. AMRAP : tours acquis du bloc.
6. **AMRAP à un seul mouvement en Max** (score cumulé en bas droite) : ligne présente dans la table, scénario pas encore exécutable (mission d, D-531).
7. **Libellé de l'intervalle et du temps limite AMRAP** : valeur seule, sans unité (le « max » reste propre au For time).

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE — écrans hors exécution, moteur, comportement des boutons, anneau et centre : diff limité à `src/features/execution` (écran, table, libellés, tests) ; aucun fichier `src/domain` modifié ; anneau (`ExecutionTimerRing`, segments) et centre (chrono, mention, zone d'appui) inchangés ; `onPlusTour`, activations et icônes des boutons inchangés (seul le texte « Tour » du bouton devient « Tour · n »).
- CHANGE — placement des informations dans les coins (table `executionCorners.ts`, rendu des cadres piloté par `assignCorners`) et libellé du bouton « +Tour ».
- FORBIDDEN — pas de réécriture de tests en masse : une assertion de position adaptée dans `ExecutionScreen.forTime.pre11.test.tsx`, ajouts ciblés ailleurs ; aucune primitive native remplacée ; aucun SCOPE_EXPANSION nécessaire.

## Modifications réalisées

- `src/features/execution/executionCorners.ts` (nouveau) : `CORNER_OF`, `CORNER_TABLE` (CE-UI-14 §2), `assignCorners`, `badgePlacement`, `cornerScenarioOf`.
- `src/features/execution/ExecutionScreen.tsx` : scénario, informations disponibles et affectation ; chaque cadre est posé au coin donné par la table ; limite de temps (For time, AMRAP, EMOM, Death by) ; compte à rebours du repos ; charge de la série suivante ; tours acquis dans `PlusTourButton`.
- `src/features/execution/executionStrings.ts` : `plusTourAcquired`.
- Tests : `executionCorners.test.ts` (nouveau) ; ajouts dans `ExecutionScreen.emom.pre11.test.tsx`, `ExecutionScreen.amrap.pre11.test.tsx`, `ExecutionScreen.forTime.pre11.test.tsx`.
- `_bmad-output/pre11/spec-pre11-formats.md` : point 34.

## Preuves et tests

- `npx tsc --noEmit` : sans erreur.
- `npx eslint` sur les fichiers touchés : sans erreur.
- `npx jest src/features/execution --maxWorkers=2` : 14 suites, 84 tests réussis (dont 10 scénarios du tableau, coin fixe d'une information, coin vide, EMOM à l'écran, « Tour · n » For time et AMRAP).
- Suite complète non lancée ici (prévue à la fin de la série du 19/11).

## Synchronisation documentaire

Classe A (le code rejoint D-529 / CE-UI-14). Chapitres 07 et 13 non modifiés (ils sont sur `docs/planification-grille-creneaux`, non fusionnée). Spec du lot : point 34.

## Hypothèses non démontrées

Lisibilité de « Tour · n » dans le disque de 72 (texte réduit automatiquement jusqu'à 60 %) ; aucun chevauchement entre le cadre du haut à droite et le titre.

## À vérifier sur iPhone

Un exemple par format : exercice libre avec charge (charge en bas à gauche), pause (charge de la série suivante), For time avec borne (objectif HG, « max » HD), AMRAP (temps limite HD, « +Tour · n »), EMOM en répétitions avec charge au repos (quatre coins occupés), EMOM en durée (intervalle HD, compte à rebours BG), Death by (intervalle HD).

## Fichiers modifiés

Voir « Modifications réalisées » et ce rapport.

## Commit final et état Git

Renseignés dans le message de livraison (commit unique de cette branche, poussé sur `origin/recette/coins-chrono-20261119`).
