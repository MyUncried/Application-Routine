# 2026-11-18 — PLANIFICATION-CE-UI-12 — rapport d'état (arrêt avant code)

## Identifiant et objectif

- Mission : appliquer à l'application les décisions D-516 à D-523 (chapitre 07), les règles RM-253 à RM-259 (chapitre 10) et le contrat CE-UI-12 (chapitre 13). Concerne les écrans de planification d'un parcours et d'une séance seule.
- Statut : **CLARIFICATION_REQUIRED**. Mission arrêtée avant toute modification applicative.

## Branche et commit de départ

- Branche dédiée créée : `planification/ce-ui-12-20261118`, dans le worktree `C:\Dev\KODJO-PLANIF-CE12`.
- Départ : `b16add55`, tête de `planification/main-20261113`. C'est la branche qui porte le code de planification actuel (`PlanningScreen`, `PlanningSelection`, CE-UI-11), avec 14 commits non fusionnés dans `main`.
- Aucun autre worktree n'a été modifié. `C:\Dev\PRE10` reste sur `composition-phases-duree`, propre.

## Périmètre demandé

Celui de la mission :

- quatre cartes grises (D-518) ;
- nom et synthèse dans la zone de contexte (D-519, RM-258, RM-259) ;
- répétition sans interrupteur (D-517, RM-257) ;
- grille créneaux × rotation (D-516, RM-253 à RM-256) ;
- roulettes natives en popover ;
- rappel sans interrupteur (D-521) ;
- écrans retirés (D-520) ;
- D-522 et D-523, appliqués à la planification seulement.

## Périmètre réellement traité

Lecture et vérification des sources, puis arrêt. Aucun code et aucune documentation fonctionnelle n'ont été modifiés.

## Constats

1. **Les sources normatives n'existent pas.** On ne trouve ni D-516 à D-523 avec ce sens, ni RM-253 à RM-259, ni CE-UI-12, à aucun de ces endroits :
   - toutes les branches locales et distantes, après `git fetch`, avec `git grep` sur `docs/Specifications-fonctionnelles/` ;
   - tous les fichiers `.md` de `C:\Dev`, worktrees compris, y compris les fichiers non committés ;
   - les fichiers transmis dans la conversation.

   État constaté sur `main`, `origin/main`, `planification/main-20261113` et `composition-phases-duree` :

   | Source | Dernier numéro |
   |---|---|
   | Chapitre 07 | D-515 |
   | Chapitre 10 | RM-252 |
   | Chapitre 13 | CE-UI-11 (« Planification — fréquence d'un contenu ») |

2. **Conflit de numérotation.** Des PR ouvertes attribuent déjà ces numéros à d'autres décisions :
   - PR #427 : D-516 = notation des prescriptions à incrément en Composition ;
   - PR #431 : D-517 = champs de l'EMOM ; D-518 = conversions de l'EMOM.

   Si les décisions de la mission sont écrites sous ces numéros, deux décisions différentes porteront le même identifiant.

3. **Le résumé de la mission ne remplace pas les sources.** La mission demande de lire d'abord ces trois sources. Elle annonce une livraison de classe A : « le code rejoint D-516 à D-523 ». Or une classe A suppose une règle déjà écrite.

   Plusieurs points nécessaires au code ne sont pas déterminés par le résumé :
   - le sens exact de « au moins un point par colonne et par ligne » quand une séance est retirée ;
   - le comportement de la grille quand la longueur du cycle diminue (points des colonnes supprimées) ;
   - le format de la mention « x fois sur n » quand le cycle vaut 1 ;
   - la règle d'unicité du nom (RM-258) : portée, casse, message ;
   - la liste exacte des cas de « X jours par semaine » (RM-259) ;
   - la migration des planifications existantes en « x fois sur n » par contenu (CE-UI-11) et en unité « mois » (D-523).

   Coder à partir du seul résumé reviendrait à inventer des règles, ce qu'interdisent `.github/AI_ORCHESTRATION.md` (« Ne jamais inventer une règle ») et la règle de synchronisation (« Ne jamais promouvoir le code en règle »).

4. **Impact sur l'Agenda, signalé dès maintenant (`SCOPE_EXPANSION_REQUIRED` probable).** D-522 remplace RM-049 : une occurrence passée ne disparaît plus et peut être rejouée. D-523 retire l'unité « mois ». Ces deux décisions touchent le calcul des occurrences et l'Agenda, qui sont gelés par la mission. Leur portée exacte ne pourra être bornée qu'après lecture des textes.

## Preuves et tests

- Commandes de recherche :
  - `git grep -E "RM-253|CE-UI-12 "` sur toutes les références après `git fetch` : aucun résultat ;
  - `grep -rl -E "RM-253|D-516|CE-UI-12"` sur tous les `.md` de `C:\Dev` : aucun résultat ;
  - lecture des registres de `main`, `origin/main`, `planification/main-20261113` et `composition-phases-duree` ;
  - `gh pr list` et lecture du chapitre 07 des branches des PR #427 et #431.
- Tests : aucun test applicable. Aucun fichier applicatif n'a été modifié.

## Hypothèses non démontrées

- Les décisions ont peut-être été rédigées hors du dépôt : conversation ChatGPT, document non transmis, ou branche non poussée sur une autre machine. Cette hypothèse n'est pas vérifiée.

## Modifications réalisées

- Ce rapport seulement.

## Liste PRESERVE / CHANGE / FORBIDDEN

Aucun code n'a été modifié : tous les éléments PRESERVE sont inchangés par construction. Aucun élément CHANGE n'a été touché. Aucun élément FORBIDDEN n'a été touché.

## Éléments non traités

- Tout le périmètre « À réaliser » (points 1 à 7) et les décisions complémentaires D-522 et D-523.

## Entrées attendues pour reprendre

1. Les textes de D-516 à D-523, RM-253 à RM-259 et CE-UI-12, sous l'une de ces formes :
   - un commit ou une branche à fusionner dans `planification/ce-ui-12-20261118` ;
   - un fichier transmis, que je recopierai textuellement dans les chapitres 07, 10 et 13 de cette branche.
2. Un arbitrage de numérotation, au vu des PR #427 et #431 :
   - garder les numéros annoncés, et renuméroter les PR #427 et #431 ;
   - ou attribuer de nouveaux numéros aux décisions de la planification.
3. Un accord sur l'extension de périmètre à l'Agenda et au calcul des occurrences, pour D-522 et D-523, après lecture des textes.

## Vérifications restant à faire sur iPhone

Sans objet tant que rien n'est implémenté. Le jour venu, il faudra vérifier les roulettes, les popovers, la grille à 7 colonnes et la modale iOS.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-18_PLANIFICATION-CE-UI-12.md` (création).

## Commit final et état Git

Ils sont indiqués dans le compte rendu de clôture de la conversation, avec le hash du commit qui contient ce rapport. Rien n'est poussé ni fusionné.
