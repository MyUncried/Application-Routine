import { describe, expect, it } from "@jest/globals";

import { profileGuidance } from "@/domain/preferences/Profile";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/** D-530 / RM-269 — migration 039 (développée comme 031 sur la branche Formats) : interrupteur « Annonce des tours », activé par défaut, indépendant des autres (RM-087). */
describe("migration039 — annonce des tours", () => {
  it("depuis la version 38 : réglages existants conservés, tours annoncés par défaut, modifiable seul, version 39", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 38);
    await database.runAsync("INSERT INTO guidance_preferences (singleton_key, announce_sides_enabled, announce_phases_enabled, updated_at) VALUES (1, 0, 0, 't')");
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(40);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 40 });
    const profiles = new SqliteProfileRepository(database);
    const profile = await profiles.get();
    expect(profile).toMatchObject({ announceSidesEnabled: false, announcePhasesEnabled: false, announceRoundsEnabled: true });
    expect(profileGuidance(profile).announcements.rounds).toBe(true);
    const off = await profiles.updatePreference("announceRoundsEnabled", false);
    expect(off).toMatchObject({ announceRoundsEnabled: false, announceSidesEnabled: false, announcePhasesEnabled: false, announceObjectiveEnabled: true });
  });

  it("base neuve : « Annonce des tours » activée par défaut", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    expect((await new SqliteProfileRepository(database).get()).announceRoundsEnabled).toBe(true);
  });
});
