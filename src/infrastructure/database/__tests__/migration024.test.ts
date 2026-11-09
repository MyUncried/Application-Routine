import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-10 — migration 024 : tables additives `executions` et `execution_results` ; une Exécution par
 * identifiant, un résultat par clé logique (idempotence) ; aucune table existante modifiée.
 */
describe("migration024 — persistance des Exécutions", () => {
  it("depuis la version 23 : tables créées, contraintes de statut et de clé, version 24", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 23);
    const before = await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(24);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 24 });
    const after = await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
    expect(after.map((row) => row.name).filter((name) => !before.some((row) => row.name === name))).toEqual(["execution_results", "executions"]);
    const insert = (id: string, status: string) =>
      database.runAsync(
        `INSERT INTO executions (id, origin, session_id, snapshot_json, snapshot_version, plan_version, engine_version, status, checkpoint_json, checkpoint_revision, started_at, last_saved_at, clock_wall_ms)
         VALUES (?, 'SESSION', NULL, '{}', 1, 1, 1, ?, '{}', 1, 't', 't', 0)`,
        [id, status],
      );
    await insert("e1", "RUNNING");
    await expect(insert("e2", "SUSPENDED")).rejects.toThrow();
    await database.runAsync("INSERT INTO execution_results (execution_id, result_key, kind, payload_json, revision) VALUES ('e1', 'k', 'STEP', '{}', 1)");
    await expect(database.runAsync("INSERT INTO execution_results (execution_id, result_key, kind, payload_json, revision) VALUES ('e1', 'k', 'STEP', '{}', 2)")).rejects.toThrow();
  });
});
