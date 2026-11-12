import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/** Suite PRE-10 son et voix — migration 027 : annonce des phases du mouvement, activée par défaut. */
describe("migration027 — annonce des phases", () => {
  it("depuis la version 26 : réglages existants conservés, phases annoncées par défaut, modifiable, version 27", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 26);
    await database.runAsync("INSERT INTO guidance_preferences (singleton_key, announce_sides_enabled, updated_at) VALUES (1, 0, 't')");
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(29);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 29 });
    const profiles = new SqliteProfileRepository(database);
    expect(await profiles.get()).toMatchObject({ announceSidesEnabled: false, announcePhasesEnabled: true });
    expect((await profiles.updatePreference("announcePhasesEnabled", false)).announcePhasesEnabled).toBe(false);
  });
});
