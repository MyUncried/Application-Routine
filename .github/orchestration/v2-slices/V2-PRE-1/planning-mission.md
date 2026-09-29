# KODJO V2 — V2-PRE-1 — Mission de planification

## Statut

PLAN_ONLY / PLANNING_AUTHORIZED.

Aucune modification applicative n’est autorisée pendant cette phase.

## Identité

- Slice : `V2-PRE-1`
- Issue : #249
- Repository : `MyUncried/Application-Routine`
- Source applicative immuable : `e216294506bed87dd80855937e3fabfbfa322b82`
- Bootstrap : `.github/orchestration/v2-slices/V2-PRE-1/slice-bootstrap.json`
- Source produit figée : `.github/orchestration/v2-slices/V2-PRE-1/qualification-spec.md`

## Objectif

Produire le premier plan technique canonique de PRE-1 à partir de la spécification source figée et de l’état réel du code au HEAD exact.

PRE-1 couvre les fondations du modèle cible avant les tranches UI et avant le moteur : données, Domaine, persistance SQLite, contrats Repository, services non visuels nécessaires, calculs métier directement affectés et tests.

## Règles impératives

1. Repartir du code réel au HEAD exact ; ne pas inférer l’implémentation depuis la documentation.
2. Ne pas recommencer la conception fonctionnelle déjà tranchée.
3. Ne développer ni Générateur de Plan d’Exécution, ni Moteur d’Exécution, ni UI d’Exécution.
4. Ne pas modifier Figma.
5. Les contrats d’écran sont en cours de mise à jour : ne pas anticiper d’UI non stabilisée.
6. Aucune conservation ni migration sémantique des données de développement existantes n’est requise.
7. Ne pas réécrire silencieusement les migrations historiques.
8. Installation neuve et évolution depuis la base actuelle doivent converger vers le même schéma cible.
9. Une seule question utilisateur à la fois si un arbitrage structurant réellement ouvert subsiste.
10. Auto-résoudre les détails techniques non structurants lorsqu’ils découlent directement des décisions validées, en les traçant.
11. Ne produire aucune écriture applicative dans la phase de planification.

## Travail attendu du plan

Le plan doit au minimum :

- réinspecter les fichiers nécessaires pour confirmer l’état réel ;
- dresser la liste exhaustive des objets, tables, types, repositories, services et calculs touchés ;
- définir le schéma SQLite cible ;
- définir l’évolution destructive admissible des données de développement ;
- vérifier la convergence installation neuve / base existante ;
- définir les invariants Domaine ;
- identifier les anciennes logiques incompatibles à supprimer ou neutraliser ;
- définir les tests Domaine, Repository, persistance et migration ;
- construire un ordre de développement atomique et déterministe ;
- définir les critères de sortie PRE-1 ;
- effectuer une seconde passe de cohérence avant soumission à la revue indépendante.

## Frontière

La tranche doit s’arrêter avant toute construction du `ExecutionPlan`.

La planification PRE-2 ne doit commencer qu’après clôture PRE-1 et activation de PE-27 afin que les futures exigences UI soient définies avec des assertions atomiques.

## Correction technique de planification — chemins DatabaseRows

Le HEAD produit immuable `e216294506bed87dd80855937e3fabfbfa322b82` contient le fichier :

- `src/infrastructure/database/types/DatabaseRows.ts`

Le chemin suivant n’existe pas à cette baseline et ne doit jamais être déclaré `MODIFY` :

- `src/infrastructure/database/DatabaseRows.ts`

Toute adaptation de `DatabaseRows` requise par PRE-1 doit donc viser exclusivement le chemin réel sous `types/`. Cette correction est un fait de code vérifié, pas une nouvelle décision fonctionnelle.

