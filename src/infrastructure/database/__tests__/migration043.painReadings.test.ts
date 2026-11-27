import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProgramRepository } from "@/infrastructure/database/repositories/SqliteProgramRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * migration043 — relevés de douleur avant la séance (D-427 / D-577, réponse de Hermann du 27/11/2026 : « Oui il faut la stocker »).
 * Table additive rattachée à l'Exécution ; mise à niveau sans perte ; valeurs bornées 0..10 ; suppression avec l'Exécution et par
 * « Effacer mes relevés » (D-551).
 */
async function seedExecution(database: NodeSqliteDatabase, id: string) {
  await database.runAsync(
    `INSERT INTO executions (id, origin, session_id, snapshot_json, snapshot_version, plan_version, engine_version, status, checkpoint_json, checkpoint_revision, started_at, last_saved_at, clock_wall_ms)
     VALUES (?, 'SESSION', NULL, '{}', 1, 1, 1, 'RUNNING', '{}', 1, 't', 't', 0)`,
    [id],
  );
}

describe("migration043 — relevés de douleur", () => {
  it("base neuve : version 43, table vide", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(43);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 43 });
    expect(await new SqliteProgramRepository(database).painReadingCount()).toBe(0);
  });

  it("mise à niveau d'une base en version 42 : exécutions conservées, table ajoutée", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 42);
    await seedExecution(database, "exec-1");
    await migrateDatabase(database);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 43 });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM executions")).toEqual({ count: 1 });
    const repository = new SqliteProgramRepository(database);
    await repository.recordPainBefore("exec-1", 4, "2026-11-27T08:00:00.000Z");
    expect(await database.getAllAsync("SELECT execution_id, moment, value FROM execution_pain_readings")).toEqual([{ execution_id: "exec-1", moment: "BEFORE", value: 4 }]);
  });

  it("dépôt : une valeur par exécution (remplacée), bornes 0..10, suppression avec l'exécution, effacement", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await seedExecution(database, "exec-1");
    await seedExecution(database, "exec-2");
    const repository = new SqliteProgramRepository(database);
    await repository.recordPainBefore("exec-1", 0, "a");
    await repository.recordPainBefore("exec-1", 3, "b");
    await repository.recordPainBefore("exec-2", 10, "c");
    expect(await repository.painReadingCount()).toBe(2);
    expect(await database.getFirstAsync("SELECT value FROM execution_pain_readings WHERE execution_id = 'exec-1'")).toEqual({ value: 3 });
    await expect(repository.recordPainBefore("exec-2", 11, "d")).rejects.toThrow();
    await database.runAsync("DELETE FROM executions WHERE id = 'exec-2'");
    expect(await repository.painReadingCount()).toBe(1);
    await repository.erasePainReadings();
    expect(await repository.painReadingCount()).toBe(0);
  });
});
