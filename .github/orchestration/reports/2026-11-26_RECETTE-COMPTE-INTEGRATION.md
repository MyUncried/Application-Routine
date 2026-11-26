# 2026-11-26 — RECETTE-COMPTE-INTEGRATION

## Identification

- **Mission** : branche de recette réunissant le lot Compte T1 et les développements en cours non fusionnés, pour une recette dans Routine BMAD (choix « B » de Hermann, 26/11/2026).
- **Branche créée** : `recette/compte-integration-20261126`, depuis `origin/compte/lot-1` (`61280fba`).
- **Branche fusionnée** : `origin/recette/agenda-axe-20261124` (`49aa5304`). Elle contient déjà `feat/marquage-photos-20261125` (PR #458), `feat/carte-seance-mosaique-20261125` et `feat/formats-sequence-modale-20261125` (vérifié par `git merge-base --is-ancestor`).
- **Hors périmètre** : fusion dans `main`, modification de `compte/lot-1` ou des branches sources, PR.

## Constats

- Les deux lignées ont toutes deux pris la **version 40** de la base locale : T1 (tables `account_link`, `account_lifecycle`) et le marquage des photos (colonnes `view_*` de `media_assets`, D-600). Analyse de la collision : rapport T1 `2026-11-25_T1-COMPTE-IMPLEMENTATION.md`, section 5.1.
- Conflits de fusion : `app/_layout.tsx` (imports), `constants.ts`, `migrateDatabase.ts`, `migrations/migration040.ts` et `__tests__/migration040.test.ts` (ajouts concurrents). Les documents (ch. 07, 12, 13) ont fusionné sans conflit.

## Modifications réalisées (résolution)

- **Numérotation** (précédent : D-530 renuméroté à la consolidation du 24/11/2026) : le marquage garde 040 (PR #458 ouverte la première) ; le compte devient **041** (`migration041.ts`, `MIGRATION_041_ACCOUNT`, `applyMigration041`), `DATABASE_VERSION = 41`. Annotation datée dans la migration et dans `constants.ts`.
- **Réparations à l'ouverture** (`repairMissingTables`, base en version ≥ 40) :
  - tables du compte absentes (base passée en 40 par le marquage, ex. Routine BMAD) : créées (`MIGRATION_041_ACCOUNT`, idempotente) ;
  - colonnes `view_*` absentes (base passée en 40 par `compte/lot-1`, ex. Routine Dev) : ajoutées (`MIGRATION_040_MEDIA_VIEW`).
- `app/_layout.tsx` : les deux imports conservés (`AccountGate`, `creationRouteOptions`).
- Tests : `migration041.test.ts` (ex-test 040 du compte, renuméroté) ; test de réparation du cas symétrique ; assertions de « version courante » passées de 40 à 41 dans les tests de migration (aucune autre modification de ces tests).

## Preuves et tests

- `npx jest src/infrastructure/database` : 547 tests réussis (après mise à jour des assertions de version).
- `npx tsc --noEmit` : sans erreur.
- `npx jest` (suite complète) : 6 894 réussis, 33 ignorés, **2 échecs préexistants** — reproduits à l'identique sur `origin/recette/agenda-axe-20261124` seule (49aa5304), donc non introduits par cette fusion :
  - `CatalogueLifecycle.e7.integration.test.tsx` › « carte → Composition en modification ; Créer → Composition » ;
  - `pre4Story11Controls.test.ts` › « aucun jeton de src/shared/ui/tokens.ts n'est modifié ».
  Non corrigés (hors périmètre : ils relèvent des branches sources).
- ESLint sur les fichiers résolus : sans erreur.

## Hypothèses non démontrées

- Comportement sur les bases réelles des téléphones : non vérifié tant que Routine BMAD et Routine Dev n'ont pas ouvert cette branche.

## Éléments non traités

- La fusion dans `main` devra reprendre la même numérotation (ou une autre décidée à ce moment) ; cette branche de recette n'est pas destinée à être fusionnée.
- Revue ChatGPT de la PR #460 (T1) : inchangée par cette mission.

## Vérifications restant à faire sur appareil réel

- Routine BMAD ouverte sur cette branche (`APP_VARIANT=bmad`) : données conservées, compte toujours connecté, nouveautés des branches fusionnées présentes.
- Routine Dev sur cette branche (`APP_VARIANT=development`) : idem, et photos du catalogue affichées (colonnes de la vue retenue ajoutées par la réparation).

## Synchronisation code / documentation

Classe D (technique : numérotation et réparation des migrations). Aucune règle fonctionnelle modifiée.

## Fichiers modifiés par la résolution

- `app/_layout.tsx`
- `src/infrastructure/database/constants.ts`
- `src/infrastructure/database/migrateDatabase.ts`
- `src/infrastructure/database/migrations/migration040.ts` (version du marquage retenue)
- `src/infrastructure/database/migrations/migration041.ts` (nouveau)
- `src/infrastructure/database/__tests__/migration040.test.ts`, `migration041.test.ts`, `repairMissingTables.test.ts`, et les assertions de version courante des tests de migration.

## Commit et état Git

- Commit de fusion : `e75e139f` ; branche `recette/compte-integration-20261126` poussée sur `origin`.
- Commit final : celui qui contient ce rapport complété (voir l'historique de la branche).
