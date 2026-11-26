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

## Ajout du 26/11/2026 : horloge 12/24 h

À la demande de Hermann (« Oui »), fusion de `origin/claude/exciting-lovelace-iyn2wf` (`13589f8d`, `b8b82027` : horloge selon le réglage 12/24 h de l'iPhone, heures anglaises AM/PM, « Attach »). Sans conflit, sans migration ni module natif nouveau (`package.json` inchangé). `tsc` sans erreur ; tests `src/features/planning`, `src/features/programs`, `src/shared/i18n` : 376 réussis.

## Ajout du 26/11/2026 : exercice libre (D-608) et formats D-607

Demande de Hermann : intégrer `feat/exercice-libre-page-20261126` (`bdc6ee86`), déjà fusionnée dans `recette/agenda-axe-20261124` (`1bbaea53`), avec les formats D-607 / D-608 et les remarques de Composition du 26/11. Nouvelle fusion de `origin/recette/agenda-axe-20261124`.

- **Nouvelle collision** : cette lignée ajoute une migration **041** (HIIT : `CHECK` de `sessions.origin` et `tours.origin_model` élargis), alors que le compte venait d'être renuméroté 041 ici. Résolution : 040 marquage, 041 HIIT (numérotation de la branche de recette d'origine conservée), **042 compte** (`migration042.ts`, `MIGRATION_042_ACCOUNT`), `DATABASE_VERSION = 42`.
- **Réparation** supplémentaire (`repairMissingTables`) : base en version ≥ 41 dont `sessions` n'admet pas `HIIT` (passée en 41 par la branche du compte) → `applyMigration041` rejouée (idempotente par conception : colonne déjà élargie laissée telle quelle). Test associé.
- Assertions de version courante 41 → 42 (aucune autre modification de ces tests) ; `migration020.test.ts` pris de la branche source.
- `tsc` sans erreur ; `npx jest src/infrastructure/database` : 550 réussis ; suite complète : 6 964 réussis, 33 ignorés, **3 échecs, tous reproduits à l'identique sur `origin/recette/agenda-axe-20261124` seule** (`1bbaea53`) : les deux déjà signalés, plus `CompositionScreen.test.tsx` › « modale : en-tête sans réserve de barre d'état ; Démarrer (brouillon inchangé) lance l'exécution sans enregistrer » (vérifié isolément sur les deux branches). Non introduits par la fusion ; non corrigés (relèvent de la branche source).

## Incident d'environnement : tunnel Expo (26/11/2026)

- `expo start --tunnel` échoue (« The "file" argument must be of type string. Received null ») dans `C:\Dev\Application-routine` : le PC est en Windows ARM (arm64) et `@expo/ngrok-bin-win32-arm64` n'est pas installé par npm. Déjà constaté les 09/11 et 11/11 (rapports `2026-11-09_PRE10_SON_VOIX.md`, `2026-11-11_PRE10_FIN.md`) : le binaire est recopié depuis `C:\Dev\KODJO-BMAD-PRE8\node_modules\@expo\` (hors Git) ; tout `npm install` ou `npm ci` le retire.
- Erreur de diagnostic de Claude, corrigée : la réinstallation de `@expo/ngrok` et l'installation de `@expo/ngrok-bin-win32-x64` (refusée, `EBADPLATFORM`) ne pouvaient pas résoudre l'incident.

## Diagnostic en cours : suppression du compte depuis Routine BMAD (26-27/11/2026)

Constat (Hermann) : « La suppression du compte n'a pas abouti. Réessayez plus tard. », sans bandeau d'avertissement visible.

Preuves lues par Claude (jeton Supabase en lecture seule fourni par Hermann, projet Kodjo-dev uniquement) :
- base : 1 compte (BMAD, Apple, adresse relais, `deletion_requested_at` vide), son jeton Apple présent (`client_id = com.ankusha.kodjo.bmad`), 2 Utilisateurs locaux rattachés (BMAD et Routine Dev, règle R3) ; `account_deletions` : seulement les 3 suppressions réussies du 25/11 ;
- journaux : aucune requête de BMAD vers une fonction (`delete-account`, `deletion-status`) depuis son installation ; dernières requêtes de BMAD : rafraîchissements de session réussis, le dernier à 14:39 UTC le 26/11.
- Conclusion **démontrée** : la demande ne quitte pas le téléphone. Cause **indéterminée** : le code ne renvoie « n'a pas abouti » sans appel au serveur que si le lien local est absent ou si une exception survient avant l'appel (journalisée par `console.warn`, lisible dans le terminal Metro, pas sur l'iPhone sans Metro).
- Vérification proposée : reproduire avec Metro connecté et relever la ligne « Suppression du compte impossible. » du terminal.

Constat annexe **démontré** : la tâche planifiée `apple-notifications` répond 500 toutes les 15 minutes (`missing_env:KODJO_SWEEP_TOKEN`) : le secret `KODJO_SWEEP_TOKEN` n'est pas défini dans les secrets des fonctions (prérequis P-04 du cahier : KO).

## Commit et état Git

- Commit de fusion : `e75e139f` ; branche `recette/compte-integration-20261126` poussée sur `origin`.
- Commit final : celui qui contient ce rapport complété (voir l'historique de la branche).
