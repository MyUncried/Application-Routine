import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/** Suite PRE-10 son et voix — migration 026 : catégories d'annonces séparées, activées par défaut. */
describe("migration026 — catégories d'annonces", () => {
  it("depuis la version 25 : réglage existant conservé, nouvelles catégories activées et modifiables, version 26", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 25);
    await database.runAsync("INSERT INTO guidance_preferences (singleton_key, announce_objective_enabled, updated_at) VALUES (1, 0, 't')");
    const profileBefore = await database.getAllAsync("SELECT * FROM profiles");
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(29);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 29 });
    expect(await database.getAllAsync("SELECT * FROM profiles")).toEqual(profileBefore);
    const profiles = new SqliteProfileRepository(database);
    expect(await profiles.get()).toMatchObject({ announceObjectiveEnabled: false, announcePausesEnabled: true, announceSessionEnabled: true, announceSidesEnabled: true });
    expect((await profiles.updatePreference("announceSidesEnabled", false)).announceSidesEnabled).toBe(false);
    expect((await profiles.updatePreference("announcePausesEnabled", false)).announcePausesEnabled).toBe(false);
    await expect(database.runAsync("UPDATE guidance_preferences SET announce_session_enabled = 2")).rejects.toThrow();
  });
});
