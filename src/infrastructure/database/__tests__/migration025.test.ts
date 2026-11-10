import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/** Suite PRE-10 son et voix — migration 025 : préférence « Annoncer les répétitions ou la durée », activée par défaut. */
describe("migration025 — annonce de l'objectif", () => {
  it("depuis la version 24 : table ajoutée, profiles inchangée, activée par défaut, modifiable, version 25", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 24);
    const profileBefore = await database.getAllAsync("SELECT * FROM profiles");
    await migrateDatabase(database);
    expect(await database.getAllAsync("SELECT * FROM profiles")).toEqual(profileBefore);
    expect(DATABASE_VERSION).toBe(27);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 27 });
    const profiles = new SqliteProfileRepository(database);
    expect((await profiles.get()).announceObjectiveEnabled).toBe(true);
    expect((await profiles.updatePreference("announceObjectiveEnabled", false)).announceObjectiveEnabled).toBe(false);
    expect((await profiles.updatePreference("announceObjectiveEnabled", true)).announceObjectiveEnabled).toBe(true);
    await expect(database.runAsync("UPDATE guidance_preferences SET announce_objective_enabled = 2")).rejects.toThrow();
    await expect(database.runAsync("INSERT INTO guidance_preferences (singleton_key, updated_at) VALUES (2, 't')")).rejects.toThrow();
  });
});
