import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Migration 030 — présentation du catalogue des Mouvements mémorisée (décisions de Hermann du 16/11/2026, ch07 ; CE-MVT-03,
 * Bascule). Table singleton `catalogue_preferences`, jointe au Profil comme `guidance_preferences` ; `profiles` inchangée.
 */
const columns = async (database: NodeSqliteDatabase, table: string) =>
  (await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map((column) => column.name);

describe("migration030 — catalogue des Mouvements en liste ou en grille", () => {
  it("depuis la version 29 : table ajoutée, profiles inchangée, liste par défaut ; grille enregistrée puis relue ; version 30", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 29);
    const before = await columns(database, "profiles");
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(38);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 38 });
    expect(await columns(database, "profiles")).toEqual(before);
    expect(await columns(database, "catalogue_preferences")).toEqual(["singleton_key", "movement_catalogue_grid", "updated_at"]);
    expect(await database.getAllAsync("SELECT * FROM catalogue_preferences")).toEqual([]);

    const repository = new SqliteProfileRepository(database, () => "2026-11-16T09:00:00.000Z");
    expect((await repository.get()).movementCatalogueGridEnabled).toBe(false);
    expect((await repository.updatePreference("movementCatalogueGridEnabled", true)).movementCatalogueGridEnabled).toBe(true);
    // Les autres préférences restent inchangées.
    const after = await new SqliteProfileRepository(database).get();
    expect(after.movementCatalogueGridEnabled).toBe(true);
    expect(after.soundsEnabled).toBe(true);
    expect((await repository.updatePreference("movementCatalogueGridEnabled", false)).movementCatalogueGridEnabled).toBe(false);
    expect(await database.getAllAsync("SELECT singleton_key, movement_catalogue_grid FROM catalogue_preferences")).toEqual([
      { singleton_key: 1, movement_catalogue_grid: 0 },
    ]);
    database.close();
  });

  it("une valeur hors 0 / 1 est refusée par la contrainte", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await expect(
      database.runAsync("INSERT INTO catalogue_preferences (singleton_key, movement_catalogue_grid, updated_at) VALUES (1, 2, 't')"),
    ).rejects.toThrow();
    database.close();
  });
});
