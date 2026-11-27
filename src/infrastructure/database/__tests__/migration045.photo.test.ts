import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { applyMigration045 } from "@/infrastructure/database/migrations/migration045";
import { SqliteExecutionFeedbackRepository } from "@/infrastructure/database/repositories/SqliteExecutionFeedbackRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * migration045 — photo de fin de séance (`execution_feedback.photo_path`). Aucune table de corrections (arbitrage de Hermann du
 * 28/11/2026 : « pas de table séparée de corrections ») ; migration rejouable.
 */
async function seedExecution(database: NodeSqliteDatabase, id: string) {
  await database.runAsync(
    `INSERT INTO executions (id, origin, session_id, snapshot_json, snapshot_version, plan_version, engine_version, status, business_status, checkpoint_json, checkpoint_revision, started_at, last_saved_at, clock_wall_ms)
     VALUES (?, 'SESSION', NULL, '{}', 1, 1, 1, 'FINISHED', 'COMPLETED', '{}', 1, 't', 't', 0)`,
    [id],
  );
}

describe("migration045 — photo de fin de séance", () => {
  it("mise à niveau depuis la version 44 : ressenti existant conservé, photo absente, version 45, aucune table de corrections", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 44);
    await seedExecution(database, "exec-1");
    await database.runAsync("INSERT INTO execution_feedback (execution_id, feeling, comment, recorded_at) VALUES ('exec-1', 'GOOD', NULL, 'a')");
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(45);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 45 });
    expect(await new SqliteExecutionFeedbackRepository(database).get("exec-1")).toEqual({ executionId: "exec-1", feeling: "GOOD", comment: null, painAfter: null, photoPath: null });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM sqlite_master WHERE name = 'execution_repetition_corrections'")).toEqual({ count: 0 });
  });

  it("rejouable : une seconde application garde la colonne sans erreur ; la photo est enregistrée et relue, supprimée avec l'Exécution", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await database.withExclusiveTransactionAsync(async (transaction) => applyMigration045(transaction));
    await seedExecution(database, "exec-1");
    const repository = new SqliteExecutionFeedbackRepository(database);
    await repository.save({ executionId: "exec-1", feeling: "GOOD", comment: null, painAfter: null, photoPath: "file:///Documents/session-photos/exec-1.jpg" }, "a");
    expect((await repository.get("exec-1"))?.photoPath).toBe("file:///Documents/session-photos/exec-1.jpg");
    await database.runAsync("DELETE FROM executions WHERE id = 'exec-1'");
    expect(await repository.get("exec-1")).toBeNull();
  });
});
