# Epic E — Catalogue unifié des Séances — implémentation

> Autorisation de Hermann du 28/10/2026 (« KODJO — PRE-8 — Lancement du développement de l'epic E ») : exécution du plan approuvé `planning-artifacts/epic-e-catalogue-seances.md` (E.1 à E.7 et E.8-a ; Q-E0, Q-E3, Q-E4, Q-E5, Q-E6 ; D-449). Branche `pre8-bmad/dev`, départ `7cc65037` (epics A et B clos, b8-3 intégré). Sources lues sur `origin/main` @ `ff7600ac` sans fusion (Q-E0). Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`, lecture seule. Aucune migration.

## E.1 — Projection de lecture

- `SessionCatalogueRepository.listCatalogue` (`SqliteSessionRepository`) : Séances actives et archivées, structure générale complète, plus récentes d'abord (ordre de `listActive`), lecture groupée par table. `assembleStructure` admet le statut archivé pour cette seule lecture (`allowArchived`) ; les lectures d'édition gardent la garde « Séance active ». `SessionHeaderRow.archived_at` relu (colonne de `migration001`).
- `SessionService.listCatalogueSessions`.
- `projectSessionForCatalogue` (`src/features/sessions/sessionCatalogueProjection.ts`, pur) : compte D-449 §6 (récupérations exclues, même Mouvement compté deux fois), catégories dédupliquées en ordre de première apparition, zones et étiquette pour les filtres, cascade du visuel (média de l'Exercice unique, sinon premier média, sinon Libre), synthèse (format — jamais aujourd'hui —, sinon N exercices, sinon volume ; « 0 exercice » conservé, Q-E6), durée par `computeStructureDuration`, arbre (conteneur masqué seulement s'il ne se répète pas et ne contient qu'un Exercice ; deux décalages au plus).
- Volume de l'emplacement de synthèse : `formatOccurrenceSummary` existant ; une série unique chiffrée prend la forme « 1 × cible » donnée par la spécification §1 (« 1 × 45 s »). Les lignes déployées gardent la synthèse d'occurrence telle quelle (« 45 s », comme Figma `6214:3696`).
- `sessionFormats.ts` (Q-E5) : table des 12 formats de Figma, Libre seul disponible ; aucune donnée persistée.
- Assets (lecture seule MCP Figma, 28/10) : pictogrammes de la carte `6214:3572` (catégorie `6296:18631`, haltère `6214:3563`, sablier `6214:3556`, chevron `8712:13559`) au manifeste ; vignettes de formats `8852:15055` à `8852:15197` (PNG ×3, `assets/formats/`).
- Tests : `sessionCatalogueProjection.e1.test.ts` (15), `sessionCatalogue.e1.test.ts` (SQLite réelle, 2).
