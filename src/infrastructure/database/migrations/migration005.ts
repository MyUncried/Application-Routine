/**
 * Migration additive V2-BILAT-01 : configuration de bilatéralité PRÉALABLE à
 * T03 — `SideMode = UNILATERAL | RIGHT_LEFT | LEFT_RIGHT` de l'occurrence
 * d'Activité de Séance (`activities.side_mode`) et du Tour
 * (`tours.side_mode`), plan technique approuvé §« Migration 005 ».
 *
 * **Aucune table d'Exécution, d'Instantané ou de Résultat n'est ajoutée** —
 * celles-ci relèvent de T03 (`migration006`, `DATABASE_VERSION = 6`,
 * réservé explicitement pour éviter toute collision).
 *
 * N'altère JAMAIS `migration001.ts`…`migration004.ts` (« Conservation des
 * acquis », `.github/AI_ORCHESTRATION.md`) — chaque migration reste un
 * fichier indépendant, exécuté une seule fois par `migrateDatabase.ts` sous
 * la garde `PRAGMA user_version`.
 *
 * ## Pourquoi une simple extension de colonnes, sans reconstruction de table
 *
 * Contrairement à `migration004` (qui devait borner `recovery_seconds`
 * DANS le `CHECK` composite existant de `activities`, impossible sans
 * reconstruction), `side_mode` ne porte qu'une contrainte AUTONOME — une
 * énumération à trois valeurs qui ne référence AUCUNE autre colonne. SQLite
 * autorise explicitement `ALTER TABLE … ADD COLUMN` à porter un `DEFAULT`
 * constant et un `CHECK` propre à la seule colonne ajoutée (restriction
 * documentée : le `CHECK`/`DEFAULT` d'une colonne ajoutée ne peut référencer
 * ni une autre table, ni une autre colonne de la même table) — exactement
 * le cas ici. Aucune reconstruction « 12 étapes » n'est donc nécessaire, ni
 * pour `activities`, ni pour `tours`.
 *
 * `NOT NULL DEFAULT 'UNILATERAL'` couvre à la fois les nouvelles lignes ET
 * l'intégralité de l'historique existant, qui se retrouve ainsi
 * explicitement `UNILATERAL` (comportement historique, aucune répétition de
 * côté) sans qu'aucune ligne ne reste `NULL`.
 */
export const MIGRATION_005 = `
ALTER TABLE activities ADD COLUMN side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'
  CHECK (side_mode IN ('UNILATERAL', 'RIGHT_LEFT', 'LEFT_RIGHT'));

ALTER TABLE tours ADD COLUMN side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'
  CHECK (side_mode IN ('UNILATERAL', 'RIGHT_LEFT', 'LEFT_RIGHT'));
`;
