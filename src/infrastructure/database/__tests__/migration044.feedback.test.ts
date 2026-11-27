import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteExecutionFeedbackRepository } from "@/infrastructure/database/repositories/SqliteExecutionFeedbackRepository";
import { SqliteProgramRepository } from "@/infrastructure/database/repositories/SqliteProgramRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * migration044 — fin de séance (D-578 à D-581, D-427) : ressenti à cinq niveaux et commentaire par Exécution ; douleur après la séance
 * (moment `AFTER`) dans la table des relevés reconstruite, relevés `BEFORE` conservés.
 */
async function seedExecution(database: NodeSqliteDatabase, id: string) {
  await database.runAsync(
    `INSERT INTO executions (id, origin, session_id, snapshot_json, snapshot_version, plan_version, engine_version, status, checkpoint_json, checkpoint_revision, started_at, last_saved_at, clock_wall_ms)
     VALUES (?, 'SESSION', NULL, '{}', 1, 1, 1, 'FINISHED', '{}', 1, 't', 't', 0)`,
    [id],
  );
}

const AFTER_INSERT = "INSERT INTO execution_pain_readings (execution_id, moment, value, recorded_at) VALUES ('exec-1', 'AFTER', 2, 'b')";

describe("migration044 — fin de séance", () => {
  it("mise à niveau depuis la version 43 : relevés « avant » conservés, moment « après » admis, version 44", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 43);
    await seedExecution(database, "exec-1");
    await new SqliteProgramRepository(database).recordPainBefore("exec-1", 3, "a");
    await expect(database.runAsync(AFTER_INSERT)).rejects.toThrow();
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(44);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 44 });
    expect(await database.getAllAsync("SELECT execution_id, moment, value FROM execution_pain_readings")).toEqual([{ execution_id: "exec-1", moment: "BEFORE", value: 3 }]);
    await database.runAsync(AFTER_INSERT);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("dépôt : ressenti, commentaire et douleur après enregistrés ensemble ; idempotent ; supprimés avec l'Exécution", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await seedExecution(database, "exec-1");
    const repository = new SqliteExecutionFeedbackRepository(database);
    await repository.save({ executionId: "exec-1", feeling: "VERY_BAD", comment: "genou", painAfter: 0 }, "a");
    await repository.save({ executionId: "exec-1", feeling: "GOOD", comment: null, painAfter: 4 }, "b");
    expect(await repository.get("exec-1")).toEqual({ executionId: "exec-1", feeling: "GOOD", comment: null, painAfter: 4 });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM execution_feedback")).toEqual({ count: 1 });
    await repository.save({ executionId: "exec-1", feeling: "NEUTRAL", comment: null, painAfter: null }, "c");
    expect(await repository.get("exec-1")).toEqual({ executionId: "exec-1", feeling: "NEUTRAL", comment: null, painAfter: null });
    await database.runAsync("DELETE FROM executions WHERE id = 'exec-1'");
    expect(await repository.get("exec-1")).toBeNull();
  });

  it("contraintes : cinq ressentis seulement, commentaire ≤ 200 caractères", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await seedExecution(database, "exec-1");
    const repository = new SqliteExecutionFeedbackRepository(database);
    await expect(repository.save({ executionId: "exec-1", feeling: "TIRED" as never, comment: null, painAfter: null }, "a")).rejects.toThrow();
    await expect(repository.save({ executionId: "exec-1", feeling: "GOOD", comment: "x".repeat(201), painAfter: null }, "a")).rejects.toThrow();
    expect(await repository.get("exec-1")).toBeNull();
  });
});
