import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/** Migration 033 — lien occurrence de routine ↔ Exécution (recette du 19/11/2026 au soir). */
describe("migration 033 — occurrence_executions", () => {
  it("depuis la version 32 : une table additive, aucune donnée réécrite, idempotente", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 32);
    const before = await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'");
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(38);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 38 });
    const after = await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
    expect(after.map((row) => row.name).filter((name) => !before.some((row) => row.name === name))).toEqual(["occurrence_executions", "programs", "routine_occurrences", "user_privacy"]);
    await migrateDatabase(database);
    database.close();
  });

  it("rang de séance au moins 1", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await expect(
      database.runAsync("INSERT INTO occurrence_executions (execution_id, routine_id, occurrence_key, session_rank) VALUES ('e', 'r', '2026-11-19T08:00', 0)"),
    ).rejects.toThrow();
    database.close();
  });
});
