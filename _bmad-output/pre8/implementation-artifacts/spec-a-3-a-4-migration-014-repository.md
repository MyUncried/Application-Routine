# Stories A.3 et A.4 — Migration 014 et repository de la structure générale

> Statut : done. Conception : `spec-a-1-analyse-impact-d449-schema-014.md`.

## A.3 — Migration 014 (conservation des données)

- `src/infrastructure/database/migrations/migration014.ts`, `DATABASE_VERSION = 14`, branchée dans `migrateDatabase.ts`.
- **Aucune réinitialisation.** Chaque Séance devient `[avant…, Circuit, après…]` ; identités, paramètres, références aux Mouvements, numéros de copie, horodatages et récupérations sont recopiés à l'identique. Les rangs sont recompactés par zone dans leur ordre. Le Circuit est conservé même vide ; les Points d'arrêt sont convertis et gardent leur identité. Le Cycle technique disparaît : ce n'est pas un Cycle utilisateur.
- Tables non touchées : `sessions`, Mouvements, `activity_definitions` (Exercices du Catalogue, en attendant l'Epic E et Q-E1), référentiels, Profil, médias, avis.
- Contrôles : comptes égaux avant et après, `foreign_key_check` vide. Sinon : erreur structurelle et annulation complète (`user_version` reste à 13).
- Preuves : `src/infrastructure/database/__tests__/migration014.test.ts`. Copie de base FICHIER au schéma 013, peuplée (trois zones, Circuit vide, rangs non contigus, Points d'arrêt aux trois portées), migrée par `initializeDatabase` puis relue par une nouvelle connexion ; injection d'échec ; installation neuve.

## A.4 — Repository et services

- Domaine : `structuredInput.ts` (`StructuredSessionInput`, `validateStructuredSessionInput`, qui réutilise `validateCreateSessionInput`). `SessionRepository.ts` ajoute `StructuredSessionRepository` et `StructuredSession`. `Session.structure` est la structure persistée ; `cycle` en est la projection.
- `SqliteSessionRepository` :
  - lecture : une requête par table pour toutes les Séances lues ;
  - contrat de lecture : rang en double = erreur ; trou toléré et recompacté, comme le cas P39 auparavant ; Cycle non vide ; CHECK composite reflété par `assertActivityRow` ;
  - écriture : une seule fonction, `writeStructure`, qui fusionne par identité (rangs de transit, suppressions sans cascade implicite, écriture à l'ordre final) ;
  - `create`, `update`, `findById` et `listActive` : contrat de l'interface actuelle inchangé ;
  - `cycle.id` = identifiant de la Séance ; l'identifiant du Cycle technique n'est plus consommé ;
  - une structure plus riche lève `SessionStructureNotRepresentableError` sur `findById` et `update` ; elle n'est jamais tronquée ni écrasée.
- Résumés (D-449 §6) : nombre d'Exercices de la composition (`countStructureExercises`) ; durée `computeStructureDuration`, identique à l'ancien calcul pour un Circuit unique.
- Preuves : `sessionStructure.a4.test.ts` (Cycles successifs, fusion par identité, ACTIVITY_NOT_FOUND, gardes, intégrité des références). Tests existants adaptés au schéma 014 : identifiants générés et colonnes SQL brutes, tests de parité du CHECK, assertions de version.

## Écarts et suites

- Points d'arrêt hors du modèle à Circuit unique : refusés (`STRUCTURE_STOP_POINTS_UNSUPPORTED`) jusqu'à la généralisation de RM-219, RM-251 et D-442 (Epic C).
- Interface de composition multi-Circuits ou multi-Cycles : Epic C.
- Carte de Séance d'une structure plus riche (`tourRepeatCount` rendu à 1) : Epic E.
