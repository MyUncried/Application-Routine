import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteExecutionFeedbackRepository } from "@/infrastructure/database/repositories/SqliteExecutionFeedbackRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * migration045 — photo de fin de séance (adresse de la copie privée) et répétitions corrigées par série (décisions de Hermann du
 * 27/11/2026) : la valeur corrigée remplace la précédente, rien n'est écrit sans enregistrement, tout disparaît avec l'Exécution ; ni le
 * statut ni les résultats du moteur ne changent.
 */
async function seedExecution(database: NodeSqliteDatabase, id: string) {
  await database.runAsync(
    `INSERT INTO executions (id, origin, session_id, snapshot_json, snapshot_version, plan_version, engine_version, status, business_status, checkpoint_json, checkpoint_revision, started_at, last_saved_at, clock_wall_ms)
     VALUES (?, 'SESSION', NULL, '{}', 1, 1, 1, 'FINISHED', 'COMPLETED', '{}', 1, 't', 't', 0)`,
    [id],
  );
}

describe("migration045 — photo et répétitions corrigées", () => {
  it("mise à niveau depuis la version 44 : ressenti existant conservé, photo absente, version 45", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 44);
    await seedExecution(database, "exec-1");
    await database.runAsync("INSERT INTO execution_feedback (execution_id, feeling, comment, recorded_at) VALUES ('exec-1', 'GOOD', NULL, 'a')");
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(45);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 45 });
    expect(await new SqliteExecutionFeedbackRepository(database).get("exec-1")).toEqual({ executionId: "exec-1", feeling: "GOOD", comment: null, painAfter: null, photoPath: null });
  });

  it("photo et corrections enregistrées ensemble ; une correction remplace la précédente ; statut et résultats inchangés ; cascade", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    await seedExecution(database, "exec-1");
    const repository = new SqliteExecutionFeedbackRepository(database);
    // Sans Enregistrer : rien n'est écrit.
    expect(await repository.repetitionCorrections("exec-1")).toEqual(new Map());
    await repository.save(
      { executionId: "exec-1", feeling: "GOOD", comment: null, painAfter: null, photoPath: "file:///Documents/session-photos/exec-1.jpg", repetitionCorrections: [{ seriesKey: "o1#1", repetitions: 10 }] },
      "a",
    );
    await repository.save({ executionId: "exec-1", feeling: "GOOD", comment: null, painAfter: null, photoPath: "file:///Documents/session-photos/exec-1.jpg", repetitionCorrections: [{ seriesKey: "o1#1", repetitions: 9 }, { seriesKey: "o1#2", repetitions: 0 }] }, "b");
    expect(await repository.repetitionCorrections("exec-1")).toEqual(new Map([["o1#1", 9], ["o1#2", 0]]));
    expect((await repository.get("exec-1"))?.photoPath).toBe("file:///Documents/session-photos/exec-1.jpg");
    expect(await database.getFirstAsync("SELECT status, business_status FROM executions WHERE id = 'exec-1'")).toEqual({ status: "FINISHED", business_status: "COMPLETED" });
    await expect(repository.save({ executionId: "exec-1", feeling: "GOOD", comment: null, painAfter: null, repetitionCorrections: [{ seriesKey: "o1#1", repetitions: -1 }] }, "c")).rejects.toThrow();
    expect(await repository.repetitionCorrections("exec-1")).toEqual(new Map([["o1#1", 9], ["o1#2", 0]]));
    await database.runAsync("DELETE FROM executions WHERE id = 'exec-1'");
    expect(await repository.repetitionCorrections("exec-1")).toEqual(new Map());
  });
});
