# CLAUDE.md — clone de révision documentaire OpenSpec (KODJO-OPENSPEC-DOCS)

> Fichier **propre à ce clone** et à la branche `docs/openspec-revision`. Ne pas fusionner tel quel dans `main`.
> Original conservé à l’identique : `openspec/instructions/originaux/CLAUDE.md`. Séparation documentée : `openspec/instructions/README.md`.

@docs/AGENTS.md
@openspec/instructions/EXIGENCES-PRODUIT.md

## Nature du chantier

Révision de la documentation fonctionnelle KODJO avec OpenSpec standard (`openspec` CLI, schéma `spec-driven`, commandes `/opsx:*`). Chantier indépendant : **aucun raccordement à BMAD ni à VNext**. Les obligations VNext sont listées, non actives, dans `openspec/instructions/ORCHESTRATION-VNEXT.md`.

## Interdits permanents du chantier

- Aucun code applicatif (`app/`, `src/`, `tests/`, `e2e/`, `scripts/`, configs Expo/EAS).
- Aucun EAS.
- Aucune modification de `.github/`, ni des autres clones (`C:\Dev\KODJO-BMAD-PRE4`, `KODJO-BMAD-PRE5`, `Application-routine*`).
- Les références utilisées par les préparations PRE-4 en cours restent figées : aucune mise à jour de leurs sources sans décision explicite d’Hermann.
- Les spécifications produit (`docs/Specifications-fonctionnelles/`, `docs/*.md`) ne sont corrigées qu’après validation d’Hermann d’un lot proposé.
- Commits locaux autorisés.

## Publication GitHub — autorisation d’Hermann du 28/10/2026

Cette autorisation remplace l’interdiction de push et de workflows GitHub qui figurait dans les interdits permanents. Les autres interdits sont inchangés.

- Branche dédiée obligatoire : commits et push sur cette branche uniquement.
- Ouverture d’une Pull Request vers `main` autorisée, **sans la fusionner**.
- Jamais de push direct sur `main`. Jamais de fusion de PR sans autorisation explicite d’Hermann.
- Workflows GitHub limités aux contrôles et aux tests. Aucun processus de développement ou de déploiement non demandé.
- Avant publication, vérifier que la branche ne contient que les modifications relevant du travail en cours.
- Si `git push` aboutit mais que l’ouverture de la PR échoue, communiquer à Hermann le nom de la branche publiée et son dernier commit.
- À l’issue de l’opération, communiquer la branche, le commit, la PR éventuelle et les contrôles exécutés.
- Éviter les clones supplémentaires non nécessaires et nettoyer les environnements temporaires.

## Interventions Figma — cadre du 28/10/2026

Cette section remplace l’interdit « aucun changement Figma ». Les écrans Figma sont conçus et modifiés dans ce chantier, sur instruction d’Hermann ; l’interdit ne décrivait plus la pratique.

- Aucune modification d’un écran, d’un composant ou d’une donnée sans demande explicite d’Hermann, et validation demandée avant toute modification.
- Les modifications portent sur les composants, non sur les instances.
- Fichier de référence `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP `510:101`.
- Vérifier la présentation et les formats avant de livrer.
- La règle d’analyse est inchangée : la documentation porte les comportements et les calculs, Figma le rendu visuel et les états représentés ; une capture n’établit jamais une règle de calcul.

## Règles d’analyse documentaire

- Documentation = comportements et calculs ; Figma = rendu visuel. Une capture n’établit pas une règle de calcul.
- Le document le plus récent ne remplace jamais automatiquement les autres : un remplacement doit être explicite (décision Dxxx qui nomme la règle remplacée, ou mention « remplacé par »).
- Pour chaque constat : passages exacts, sources (fichier + ancre/ligne), qualification (contradiction réelle / complément / différence de périmètre / doublon / référence rompue / ambiguïté), proposition justifiée.
- Vérifier les PR documentaires ouvertes ou récemment fusionnées avant de déclarer un écart ouvert.

## Livrable de chaque session

Bilan Markdown committé dans le change OpenSpec actif (`openspec/changes/<change>/bilan-*.md`), avec : objectif, branche et commit de départ, périmètre demandé/traité, constats, preuves, hypothèses non démontrées, modifications, hors périmètre, fichiers modifiés, commit final, état Git.
