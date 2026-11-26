import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { MIGRATION_042_ACCOUNT } from "@/infrastructure/database/migrations/migration042";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Recette iPhone du 20/11/2026 (Routine BMAD) : base déclarée en version 31 sans les tables des Routines
 * (« no such table: routines »). À l'ouverture, les tables additives absentes de 030 et 031 sont recréées ;
 * rien d'autre n'est modifié et la version reste celle de la base.
 */
const tables = async (database: NodeSqliteDatabase) =>
  (await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%'"))
    .map((row) => row.name).sort();

describe("réparation des tables additives manquantes", () => {
  it("base en version 31 sans tables des Routines ni préférences du Catalogue : recréées, puis migrations suivantes, données conservées", async () => {
    const reference = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(reference);
    const complete = await tables(reference);
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 31);
    const users = await database.getAllAsync("SELECT * FROM users");
    await database.execAsync("DROP TABLE routine_exclusions; DROP TABLE routine_entries; DROP TABLE routines; DROP TABLE catalogue_preferences;");
    expect(await tables(database)).not.toContain("routines");

    await migrateDatabase(database);

    expect(await tables(database)).toEqual(complete);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: DATABASE_VERSION });
    expect(await database.getAllAsync("SELECT * FROM users")).toEqual(users);
    await database.runAsync(
      "INSERT INTO routines (id, owner_id, start_date, start_time, created_at, updated_at) VALUES ('r1', (SELECT id FROM users LIMIT 1), '2026-11-20', '08:00', 'now', 'now')");
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM routines")).toEqual({ count: 1 });
  });

  it("base en version 40 migrée par une autre branche (sans tables du compte) : tables du compte créées, singleton présent", async () => {
    const reference = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(reference);
    const complete = await tables(reference);
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await database.execAsync("DROP TABLE account_link; DROP TABLE account_lifecycle;");
    const users = await database.getAllAsync("SELECT * FROM users");

    await migrateDatabase(database);

    expect(await tables(database)).toEqual(complete);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: DATABASE_VERSION });
    expect(await database.getFirstAsync("SELECT state FROM account_lifecycle")).toEqual({ state: "NEVER_LINKED" });
    expect(await database.getAllAsync("SELECT * FROM users")).toEqual(users);
  });

  it("base en version 40 migrée par compte/lot-1 (sans colonnes de la vue retenue) : colonnes ajoutées, puis version 41", async () => {
    const reference = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(reference);
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    for (const column of ["view_x", "view_y", "view_width", "view_height"]) await database.execAsync(`ALTER TABLE media_assets DROP COLUMN ${column}`);
    await database.execAsync("PRAGMA user_version = 40");

    await migrateDatabase(database);

    const columns = async (db: NodeSqliteDatabase) => (await db.getAllAsync<{ name: string }>("PRAGMA table_info(media_assets)")).map((row) => row.name).sort();
    expect(await columns(database)).toEqual(await columns(reference));
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: DATABASE_VERSION });
  });

  it("base en version 41 migrée par la branche du compte (sans HIIT) : clé HIIT admise, puis version 42", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 40);
    await database.execAsync(MIGRATION_042_ACCOUNT);
    await database.execAsync("PRAGMA user_version = 41");
    const sql = async (table: string) => (await database.getFirstAsync<{ sql: string }>("SELECT sql FROM sqlite_master WHERE name = ?", [table]))!.sql;
    expect(await sql("sessions")).not.toContain("'HIIT'");

    await migrateDatabase(database);

    expect(await sql("sessions")).toContain("'HIIT'");
    expect(await sql("tours")).toContain("'HIIT'");
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: DATABASE_VERSION });
  });

  it("base complète : aucune écriture", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    const before = await tables(database);
    await migrateDatabase(database);
    expect(await tables(database)).toEqual(before);
  });
});
