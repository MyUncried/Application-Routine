# PRE-3 — reprise après qualification du correctif ciblé

Opération existante [#340](https://github.com/MyUncried/Application-Routine/issues/340). Aucun nouvel objet PRE-3 ni développement applicatif.

## Correctif terminé

PR #343 fusionnée à `aaa5d495b0b4b3c1fec51ad3255450e565ea7880`. Les huit fichiers fusionnés sont identiques au candidat qualifié `8378cf4a99403bff74337e25406633e4666c967e`.
Les runs [qualification VNext](https://github.com/MyUncried/Application-Routine/actions/runs/37929798905) et [suite pilote](https://github.com/MyUncried/Application-Routine/actions/runs/37929798826) sont SUCCESS.
[Clôture ciblée publiée sur main](https://github.com/MyUncried/Application-Routine/blob/901941a68d4ccaf9dcc8e925dde9daaef9b11a46/.github/orchestration/reports/2026-10-09_PRE3_CLARIFICATION_REENTRY_CLOSURE.json). Cette preuve n'est pas une nouvelle certification générale.

## Révision préparée, non appliquée

Le constructeur canonique a construit et validé un RevisionPatch de 30 corrections sémantiques couvrant les 13 constats bloquants, puis sa RevisionApplication :

- patch : `6392d36f033eb285cf898dab8e2cc70d9742bbbde6a193e2440ac19ce12db5e0` ;
- application : `a09efd409d228f8f57a1196cd825bbd587ede8975eda8e1d8a345fd58c0c830c` ;
- AllowedChangeSet initial inchangé : `481f2b88d48c128a01c14014fdc4e952a17d6bd985952ea20fad9faab93d2d39`.

Cela prouve la validité du patch sémantique, pas l'application des correctifs, leur revue ou leur clôture. Les contrats initiaux restent inchangés.

## Blocage de portée reproduit

FND-45a23a9dc1c196e22ec192fd demande de réenregistrer les exigences documentaires dans leurs types réels (FUNCTIONAL, DATA, MIGRATION, PRESERVATION). Il cite l'ancre SOURCE_UNIT UNIT-d27f377c24336720e09fd06b, mais 91 de ses 95 exigences restent PRESERVE_EXACT ; quatre seulement sont autorisées par les dépendances de l'ensemble des constats.

Exemple réel : REQ-0236cc7bab0de9af20e004a6, annulation du brouillon parent, est actuellement UI. Le passage au type FUNCTIONAL change son object_hash. Le constructeur refuse effectivement la correction avec :

`VNEXT_REVISION_PATCH_TARGET_UNAUTHORIZED: REQ-0236cc7bab0de9af20e004a6`.

La spécification VNext §17.3 prévoit explicitement qu'une ancre ne rend pas ses descendants existants modifiables. §17.10 exige leur conservation exacte. Le contrôle applique donc une garantie explicite ; aucune panne des runs ni défaut nouveau du protocole n'est établi par ce refus.

Ce diagnostic est distinct de l'ancienne affirmation erronée sur les six dépendances de FND-8b2fcbd1b778ea06ee6cb2f0. Ces six dépendances existent bien et le patch les utilise.

## Ce qui doit lever ce blocage

La correction sémantique et ses dépendances autorisées doivent être rendues cohérentes par une revue indépendante du périmètre causal de FND-45a23a9dc1c196e22ec192fd. Le diagnostic liste les 91 cibles préservées pour permettre une identification précise ; il n'affirme pas que toutes doivent être ouvertes.

Responsable de préparation : pilote ChatGPT. Acteur qui doit établir les dépendances sémantiques : reviewer indépendant. Aucune approbation propriétaire du plan ou suppression des contrôles de préservation ne remplace cette preuve. Le dépôt inspecté ne fournit pas de commande dédiée pour affiner les dépendances d'un reçu déjà scellé : je ne fournis donc pas une relance INITIAL comme procédure validée de révision. La procédure canonique de cette résolution reste à établir avant toute nouvelle invocation Claude. Aucun appel lancé ici, aucune surveillance d'arrière-plan.

Le démarrage d'une nouvelle revue n'est pas annoncé. Le blocage est publié afin que le prochain intervenant ne reconstruise pas tous les contrats INITIAL et ne découvre pas la violation seulement après un appel Claude.

## Reproduction sans modèle ni modification des contrats

Depuis le dépôt contenant le script publié, avec les trois chemins absolus :
```text
node --max-old-space-size=7168 docs/preparation/PRE-3/planification/preparer-revision-bornee.cjs <requirement-registry.json initial> <allowed-change-set.json clarifié> <nouveau dossier de preuve>
```

Le script lit les contrats exacts, valide le patch, observe le refus réel, puis écrit les preuves. Ce contrôle a été exécuté ici ; aucune action propriétaire n'est demandée pour le refaire.

État : BLOCKED_BY_REVIEW_AUTHORIZATION_SCOPE, à la réentrée REQUIREMENTS de #340. Plan final non corrigé/publié, revue suivante non lancée, approbation du plan non acquise, développement non commencé.
