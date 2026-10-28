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

## E.2 — Carte commune Catalogue

- `SessionCard` réécrite en carte UNIQUE (`6214:3572`, `6214:3625`) à partir de la projection E.1 : visuel 64 à 8 du bord, texte à 84 ; nom + chevron seulement pour plusieurs Exercices ; catégories avec pastille, « +N » mesuré sans couper un mot (`fitCategoryCount`) ; ni étiquette, ni zone, ni barre de couleur ; synthèse puis durée ; Lecture cible 48 à 8 du bord, présente, désactivée, annoncée « Lancer la séance — indisponible » (CE-T03-01), toucher intercepté ; carte archivée sans action, texte jusqu'à la marge, bordure `#D9D9D9`. Tokens de B.9 (fond `#F9FAFC`, bordure 0,5 `#CCD1E0`, rayon 12, ombre 8 %).
- `SessionCatalogueList` : liste du segment Séances (écart 12, marge 16) ; `useSessionCatalogue` lit le Catalogue unifié et projette avec les Catégories du référentiel ; `empty` = aucune Séance du tout ; « Aucune séance ne correspond aux filtres. » pour une liste filtrée vide (Q-E6). Statut Actives par défaut (filtres en E.6).
- Durée affichée au format de la durée de séance existant (D-443, `formatSessionDurationEstimate`, celui de la Composition) — **réserve R-E1** ci-dessous.
- Tokens documentés au ch12 : `cardsArchiveBorder`, `catalogueSessionTitle`, `catalogueSessionMuted`.
- Tests remplacés ou adaptés : `SessionCard.test.tsx` (nouvelle carte, 14), `useSessionCatalogue.test.ts`, `CatalogueScreen.test.tsx` (faux service `listCatalogueSessions`), `CatalogueCompositionEditFlow` et `EmptySessionOpenFlow` (« 0 exercice », « 0 s »), test de couleur de `SqliteSessionRepository.test.ts` (l'Étiquette reste lue, la carte ne la dessine plus — spécification §1).

## Réserves et choix techniques (à valider à la recette)

- **R-E1 — format de la durée sur la carte.** L'ancienne carte affichait la minute supérieure (« 11 min ») ; la spécification ne fixe pas le format, Figma montre « ≥ 11 min 3 s », « 45 s ». La carte reprend le format de la durée de séance déjà décidé pour la Composition (D-443 : tranches de 15 s, « ≈ » / « ≥ »), pour qu'une même Séance affiche la même durée dans les deux écrans. Aucun calcul nouveau.
- **R-E2 — vignettes Tabata et EMOM.** Le panneau Figma `4168:11149` ne les montre qu'à l'état sélectionné ; l'état non sélectionné est reconstitué en remplaçant la bordure de sélection (3 pt, hors motif) par le fond de la vignette (F-03). Elles sont désactivées (Q-E5).

## E.3 — Déploiement de la composition

- `SessionCompositionTree` (`6214:3696`) : filet sous l'en-tête, composition pleine largeur ; « Cycle · N répétitions », « Circuit · N tours / séries » (lexique de la Composition) en gris, sans valeur ; membres décalés de 16 par niveau, un filet vertical par conteneur englobant (motif des familles, couleur `movementFamilyRail`) ; nom à gauche, volume à droite ; récupérations `#80858C` avec leur durée. Hauteur selon le contenu.
- Chevron du nom seul contrôle (rotation 180° ouvert, état annoncé) ; état de déploiement de l'écran, jamais persisté. Le toucher de la carte ouvre la Séance ; le chevron et Lecture n'ouvrent rien. VoiceOver : la carte reste un élément unique, avec l'action nommée « Afficher / Masquer la composition de … » et la composition ajoutée à son nom une fois déployée.
- Animations : `SheetMotionView` (révélation et transition de place communes), aucune sous « Réduire les animations ».
- Limite (plan) : les Séances à plusieurs Cycles ou Circuits ne se créent pas encore sur l'appareil (epic C) ; leur rendu est couvert par les tests automatiques.
- Tests : `SessionCompositionTree.e3.test.tsx` (11).
