# CLAUDE.md — clone de révision documentaire OpenSpec (KODJO-OPENSPEC-DOCS)

> Fichier **propre à ce clone** et à la branche `docs/openspec-revision`. Ne pas fusionner tel quel dans `main`.
> Original conservé à l’identique : `openspec/instructions/originaux/CLAUDE.md`. Séparation documentée : `openspec/instructions/README.md`.

@docs/AGENTS.md
@openspec/instructions/EXIGENCES-PRODUIT.md

## Règle permanente — synchronisation code / documentation

Décision de Hermann du 28/10/2026. S'applique à tout travail de code sur KODJO, y compris dans les clones de développement BMAD (PRE-8 et suivants) où ce fichier est présent par héritage de `main`. Par dérogation à « Les spécifications produit […] ne sont corrigées qu'après validation d'Hermann d'un lot proposé », une évolution demandée explicitement par Hermann (classe B de la règle) vaut validation de ce lot.

@.claude/rules/synchronisation-code-documentation.md

## Nature du chantier

Révision de la documentation fonctionnelle KODJO avec OpenSpec standard (`openspec` CLI, schéma `spec-driven`, commandes `/opsx:*`). Chantier indépendant : **aucun raccordement à BMAD ni à VNext**. Les obligations VNext sont listées, non actives, dans `openspec/instructions/ORCHESTRATION-VNEXT.md`.

## Interdits permanents du chantier

- Aucun code applicatif (`app/`, `src/`, `tests/`, `e2e/`, `scripts/`, configs Expo/EAS).
- Aucun changement Figma, aucun push, aucun workflow GitHub, aucun EAS.
- Aucune modification de `.github/`, ni des autres clones (`C:\Dev\KODJO-BMAD-PRE4`, `KODJO-BMAD-PRE5`, `Application-routine*`).
- Les références utilisées par les préparations PRE-4 en cours restent figées : aucune mise à jour de leurs sources sans décision explicite d’Hermann.
- Les spécifications produit (`docs/Specifications-fonctionnelles/`, `docs/*.md`) ne sont corrigées qu’après validation d’Hermann d’un lot proposé.
- Commits locaux autorisés.

## Règles d’analyse documentaire

- Documentation = comportements et calculs ; Figma = rendu visuel. Une capture n’établit pas une règle de calcul.
- Le document le plus récent ne remplace jamais automatiquement les autres : un remplacement doit être explicite (décision Dxxx qui nomme la règle remplacée, ou mention « remplacé par »).
- Pour chaque constat : passages exacts, sources (fichier + ancre/ligne), qualification (contradiction réelle / complément / différence de périmètre / doublon / référence rompue / ambiguïté), proposition justifiée.
- Vérifier les PR documentaires ouvertes ou récemment fusionnées avant de déclarer un écart ouvert.

## Livrable de chaque session

Bilan Markdown committé dans le change OpenSpec actif (`openspec/changes/<change>/bilan-*.md`), avec : objectif, branche et commit de départ, périmètre demandé/traité, constats, preuves, hypothèses non démontrées, modifications, hors périmètre, fichiers modifiés, commit final, état Git.
