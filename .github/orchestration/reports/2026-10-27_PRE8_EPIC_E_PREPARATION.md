# PRE-8 — Préparation de l'epic E (Catalogue unifié des Séances) — 27/10/2026

## Mission

- **Identifiant** : PRE8_EPIC_E_PREPARATION.
- **Objectif** : vérifier les références, actualiser le plan BMAD, proposer des stories prêtes à validation. Pas de développement.
- **Instructions de Hermann** : « KODJO — PRE-8 — Clôture des epics A/B et préparation de l'epic E », puis « KODJO — PRE-8 — Préparation du développement de l'epic E : Catalogue unifié des Séances ».

## Baseline

- Dépôt `MyUncried/Application-Routine`, clone `C:\Dev\KODJO-BMAD-PRE8`, branche `pre8-bmad/dev`.
- Départ `23a9a4f2` : clôture BMAD A/B. Le code recetté est `88c2adde`. Arbre propre ; aucune branche amont ; rien n'est poussé.
- Base PRE-8 : `main` @ `082390c0`. `origin/main` est à `ff7600ac` : cinq PR documentaires (#403 à #407), plus `KodjoIcon.tsx`. Les sources E n'existent que là.
- Aucun reset, rebase, merge ni changement de branche.

## Périmètre

- **Demandé** : préparation de l'epic E (§1 à §7 de l'instruction).
- **Traité** : préparation complète. Seuls des artefacts BMAD et ce rapport sont écrits ; aucun fichier applicatif n'est modifié.

## Constats

- **Le code fournit déjà** : la structure D-449, la durée, les services et filtres des Mouvements, le glissé, les animations, les commandes, la duplication, la création et la modification.
- **Il manque** :
  - archiver, restaurer et supprimer une Séance (le schéma le permet, sans migration) ;
  - la planification et les Routines ;
  - l'Exécution ;
  - le format de Séance ;
  - l'epic C, non commencé.
- **Contextes Calendrier, Suivi et Choix** : `SessionCard` n'a pas d'autre consommateur que le Catalogue, et ces contextes n'existent pas dans le code.
- **Exercices du Catalogue** : `activity_definitions` est encore lu par la sélection d'exercices de la Composition (`ActivitySelectionScreen`). Retirer le segment Exercices demande donc un arbitrage (Q-E2).
- **Fusion simulée** : `git merge-tree HEAD origin/main` donne 6 conflits documentaires, aucun conflit de code.
- **Contradictions hors E** :
  - la règle 8 du ch09 (`main`) contredit B.10 `b8-3` ;
  - la règle 6 ne correspond pas à la réécriture de la famille faite par `reorder`.
- **Figma F-01 à F-05** : verdicts et nœuds dans `_bmad-output/pre8/planning-artifacts/epic-e-catalogue-seances.md` §4.

## Preuves et tests

- Lectures `git show origin/main:…`, inspection ciblée du code et Figma MCP (métadonnées et captures des nœuds `2234:189`, `4549:6742`, `1992:9910`, `10647:21600`, `4168:11149`, `2117:86`, `4521:6220`).
- Aucun test applicatif n'a été lancé : aucun code n'a changé.

## Hypothèses non démontrées

- La sélection de la Composition est le seul autre consommateur de `activity_definitions`. La recherche a été ciblée (`useActivityCatalogue`, `listActivityDefinitions`).
- La recherche du jeu de vignettes de formats dans les bibliothèques publiées ne renvoie rien : ces composants sont locaux au fichier. Leur existence est établie par les instances du panneau `4168:11149`.

## Modifications réalisées

- `_bmad-output/pre8/planning-artifacts/epic-e-catalogue-seances.md` (nouveau).
- `epics.md`, `sprint-status.yaml` (stories E en `backlog`, arbitrages dans `deferred`), `README.md`.

## Non corrigé, hors périmètre

- Les réserves Figma : aucune écriture Figma.
- Les deux contradictions du lot B.
- L'intégration de `main` (Q-E0).

## Vérifications restant à faire sur l'appareil

Aucune pour cette préparation. La recette iPhone de E est décrite au §5 du plan.

## Fichiers modifiés

Voir « Modifications réalisées », plus ce rapport.

## Commit final et état Git

Consignés dans la réponse de clôture (commit qui contient ce rapport) ; branche `pre8-bmad/dev`, rien n'est poussé ni fusionné dans `main`.
