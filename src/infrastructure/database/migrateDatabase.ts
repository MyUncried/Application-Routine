import { canonicalBodyZoneKey } from "@/domain/body-zones/BodyZone";
import { canonicalLabelKey } from "@/domain/labels/Label";
import { DATABASE_VERSION, LOCAL_USER_SINGLETON_KEY } from "./constants";
import type { Database } from "./Database";
import { MIGRATION_001 } from "./migrations/migration001";
import { MIGRATION_002 } from "./migrations/migration002";
import { MIGRATION_003 } from "./migrations/migration003";
import { MIGRATION_004 } from "./migrations/migration004";
import { MIGRATION_005 } from "./migrations/migration005";
import { MIGRATION_006 } from "./migrations/migration006";
import { MIGRATION_007 } from "./migrations/migration007";
import { MIGRATION_008_COLUMNS, MIGRATION_008_FINALIZE } from "./migrations/migration008";
import { MIGRATION_009 } from "./migrations/migration009";
import { applyMigration010 } from "./migrations/migration010";
import { applyMigration011 } from "./migrations/migration011";
import { applyMigration012 } from "./migrations/migration012";
import { applyMigration013 } from "./migrations/migration013";
import { applyMigration014 } from "./migrations/migration014";
import { applyMigration015 } from "./migrations/migration015";

type UserVersionRow = { user_version: number };
type CountRow = { count: number };
type NamedRow = { id: string; name: string };

/**
 * Applique séquentiellement chaque migration additive manquante, jamais en
 * bloc : une base à la version 1 (T01-S01…S08) ne rejoue jamais
 * `MIGRATION_001` (déjà appliquée, immuable — « Conservation des acquis »).
 * `MIGRATION_002` (T01-S09) porte à la version 2, `MIGRATION_003` (T01-S10,
 * mode `TO_FAILURE` — reconstruction additive de `activities`) à la version
 * 3, `MIGRATION_004` (T02-S02, Récupération attachée + suppression des
 * Activités `RECOVERY`) à la version 4, `MIGRATION_005` (V2-BILAT-01,
 * configuration de bilatéralité `activities.side_mode`/`tours.side_mode`)
 * à la version 5. Une base neuve (version 0) les traverse toutes à la suite,
 * dans le même ordre. `migration001.ts` n'est
 * jamais modifié : chaque migration reste un fichier indépendant, exécuté une
 * fois, jamais réécrit.
 *
 * `PRAGMA foreign_keys` étant un no-op dans une transaction (SQLite),
 * `MIGRATION_003` et `MIGRATION_004` s'appuient sur
 * `PRAGMA defer_foreign_keys=ON` dans cette même transaction partagée (Q2-A)
 * — le runner n'est pas restructuré.
 *
 * Toute la séquence s'exécute dans UNE transaction exclusive : un échec à
 * n'importe quelle étape annule l'intégralité des migrations appliquées
 * pendant ce run et laisse `user_version` inchangé (aucun état intermédiaire
 * persisté, aucune Récupération à moitié convertie).
 *
 * PRE-7 (A1.2) : `targetVersion` (défaut `DATABASE_VERSION`) arrête la chaîne
 * à une version antérieure — réservé aux preuves des migrations historiques,
 * qui lisent une base v11 sans la transition de `migration012`. L'application
 * appelle toujours la forme par défaut.
 */
export async function migrateDatabase(
  database: Database,
  /** Horloge des avis de `migration010` et `migration012` (ISO 8601 UTC) — injectable pour les tests. */
  now: () => string = () => new Date().toISOString(),
  targetVersion: number = DATABASE_VERSION,
): Promise<void> {
  if (!Number.isInteger(targetVersion) || targetVersion < 1 || targetVersion > DATABASE_VERSION) {
    throw new Error(`Unsupported target database version ${targetVersion}.`);
  }
  const versionRow = await database.getFirstAsync<UserVersionRow>("PRAGMA user_version");
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error(
      `Database version ${currentVersion} is newer than supported version ${DATABASE_VERSION}.`,
    );
  }

  if (currentVersion >= targetVersion) {
    return;
  }

  await database.withExclusiveTransactionAsync(async (transaction) => {
    let version = currentVersion;

    // Chaque étape s'arrête à `targetVersion` (défaut : la dernière).
    const pending = (step: number): boolean => version === step && version < targetVersion;

    if (pending(0)) {
      await transaction.execAsync(MIGRATION_001);
      await transaction.runAsync(
        `INSERT OR IGNORE INTO users (singleton_key, id, created_at)
         VALUES (?, 'usr_' || lower(hex(randomblob(16))), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
        [LOCAL_USER_SINGLETON_KEY],
      );
      version = 1;
    }

    if (pending(1)) {
      await transaction.execAsync(MIGRATION_002);
      version = 2;
    }

    if (pending(2)) {
      await transaction.execAsync(MIGRATION_003);
      version = 3;
    }

    if (pending(3)) {
      await transaction.execAsync(MIGRATION_004);
      version = 4;
    }

    if (pending(4)) {
      await transaction.execAsync(MIGRATION_005);
      version = 5;
    }

    if (pending(5)) {
      await transaction.execAsync(MIGRATION_006);
      version = 6;
    }

    if (pending(6)) {
      await transaction.execAsync(MIGRATION_007);
      version = 7;
    }

    if (pending(7)) {
      await transaction.execAsync(MIGRATION_008_COLUMNS);

      // Les clés normalisées (NFD, casse) ne sont pas exprimables en SQL
      // pur : chaque Étiquette/Zone déjà persistée (seed `migration007`, ou
      // une installation antérieure) reçoit la sienne, calculée en
      // JavaScript par la MÊME fonction que `LabelRepository.create`/
      // `BodyZoneRepository.create` — jamais une seconde implémentation
      // divergente.
      const labelRows = await transaction.getAllAsync<NamedRow>("SELECT id, name FROM labels");
      for (const row of labelRows) {
        await transaction.runAsync("UPDATE labels SET canonical_key = ? WHERE id = ?", [
          canonicalLabelKey(row.name),
          row.id,
        ]);
      }
      const bodyZoneRows = await transaction.getAllAsync<NamedRow>(
        "SELECT id, name FROM body_zones",
      );
      for (const row of bodyZoneRows) {
        await transaction.runAsync("UPDATE body_zones SET canonical_key = ? WHERE id = ?", [
          canonicalBodyZoneKey(row.name),
          row.id,
        ]);
      }

      await transaction.execAsync(MIGRATION_008_FINALIZE);
      version = 8;
    }

    // PRE-3 : colonnes et table additives uniquement — aucun backfill,
    // aucune lecture du Profil, aucune réécriture des valeurs existantes.
    if (pending(8)) {
      await transaction.execAsync(MIGRATION_009);
      version = 9;
    }

    // PRE-4 (story 1.1, AD-4) : deux Modes et Cible typée — étape JavaScript
    // (classement, écart des illisibles, conversion v2, reconstruction
    // d'`activities`, avis), dans CETTE transaction : toute erreur
    // structurelle annule l'ensemble et laisse `user_version` inchangé (H6).
    if (pending(9)) {
      await applyMigration010(transaction, now);
      version = 10;
    }

    // PRE-6 (story 1.1, AD-34, AD-35) : nature du Circuit et présence de la
    // récupération — `ADD COLUMN` idempotents et reprise, dans CETTE
    // transaction : un échec annule tout et laisse `user_version` inchangé.
    if (pending(10)) {
      await applyMigration011(transaction);
      version = 11;
    }

    // PRE-7 (A1.2, D-440 assouplie) : schéma MFN et transition PONCTUELLE —
    // Exercices et Séances supprimés une seule fois, Profil, Catégories et
    // Zones conservés, avis ; dans CETTE transaction : un échec annule tout et
    // laisse `user_version` à 11. Jamais rejouée (garde `user_version`).
    if (pending(11)) {
      await applyMigration012(transaction, now);
      version = 12;
    }

    // PRE-7 (R-3, D-445 C05, Q1 et Q2 de Hermann du 26/10/2026) : occurrence sans copie de
    // contenu, nom unique, alias ; réinitialisation PONCTUELLE des Mouvements, Niveaux,
    // Exercices et Séances, Profil et référentiels conservés, avis ; dans CETTE transaction :
    // un échec annule tout et laisse `user_version` à 12. Jamais rejouée.
    if (pending(12)) {
      await applyMigration013(transaction, now);
      version = 13;
    }

    // PRE-8 (A.3, D-449 §4) : structure générale de la Séance, conversion SANS PERTE des Séances
    // existantes (aucune réinitialisation) ; un échec annule tout et laisse `user_version` à 13.
    if (pending(13)) {
      await applyMigration014(transaction);
      version = 14;
    }

    // PRE-8 (B.8, arbitrages Q5 à Q8 du 27/10/2026) : archivage du Mouvement, colonne additive
    // `movements.archived_at` ; aucun Mouvement n'est archivé par la migration. Un échec annule
    // tout et laisse `user_version` à 14.
    if (pending(14)) {
      await applyMigration015(transaction);
      version = 15;
    }

    if (version !== targetVersion) {
      throw new Error(`Database migration stopped at version ${version} instead of ${targetVersion}.`);
    }

    const userCount = await transaction.getFirstAsync<CountRow>(
      "SELECT COUNT(*) AS count FROM users WHERE singleton_key = ?",
      [LOCAL_USER_SINGLETON_KEY],
    );

    if (userCount?.count !== 1) {
      throw new Error("The local user could not be initialized.");
    }

    await transaction.execAsync(`PRAGMA user_version = ${targetVersion}`);
  });
}
