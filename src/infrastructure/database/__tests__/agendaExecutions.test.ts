import { describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteExecutionRepository } from "@/infrastructure/database/repositories/SqliteExecutionRepository";
import { SqliteOccurrenceExecutionRepository } from "@/infrastructure/database/repositories/SqliteOccurrenceExecutionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * D-553 (21/11/2026, spécification § 4 et § 7) : l'Agenda lit toutes les Exécutions, liées à un créneau (migration 033) ou non
 * (« Hors planification ») ; nom de Séance de l'instantané ; Séance exécutée disponible pour le rattachement à sa carte.
 */
describe("Exécutions lues par l'Agenda", () => {
  it("toutes les Exécutions, avec ou sans lien, nom de l'instantané, fin et statut ; Séance des Exécutions liées", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    const insert = (id: string, sessionId: string, name: string, startedAt: string, endedAt: string | null, status: string | null) =>
      database.runAsync(
        `INSERT INTO executions (id, origin, session_id, snapshot_json, snapshot_version, plan_version, engine_version, status, business_status, checkpoint_json, checkpoint_revision, started_at, ended_at, last_saved_at, clock_wall_ms)
         VALUES (?, 'SESSION', ?, ?, 1, 1, 1, ?, ?, '{}', 1, ?, ?, 't', 0)`,
        [id, sessionId, JSON.stringify({ name, sessionId }), endedAt === null ? "RUNNING" : "FINISHED", status, startedAt, endedAt],
      );
    await insert("e1", "s-a", "Échauffement", "2030-08-05T12:07:00.000Z", "2030-08-05T12:13:10.000Z", "COMPLETED");
    await insert("e2", "s-b", "Gainage", "2030-08-05T15:05:00.000Z", "2030-08-05T15:20:00.000Z", "PARTIAL");
    await insert("e3", "s-b", "Gainage", "2030-08-05T16:00:00.000Z", null, null);
    await database.runAsync("INSERT INTO occurrence_executions (execution_id, routine_id, occurrence_key, session_rank) VALUES ('e1', 'r1', '2030-08-05T14:00', 1)");
    expect(await new SqliteExecutionRepository(database).listForAgenda()).toEqual([
      {
        executionId: "e1",
        sessionId: "s-a",
        sessionName: "Échauffement",
        startedAt: "2030-08-05T12:07:00.000Z",
        endedAt: "2030-08-05T12:13:10.000Z",
        businessStatus: "COMPLETED",
        link: { routineId: "r1", occurrenceKey: "2030-08-05T14:00", rank: 1 },
      },
      { executionId: "e2", sessionId: "s-b", sessionName: "Gainage", startedAt: "2030-08-05T15:05:00.000Z", endedAt: "2030-08-05T15:20:00.000Z", businessStatus: "PARTIAL", link: null },
      { executionId: "e3", sessionId: "s-b", sessionName: "Gainage", startedAt: "2030-08-05T16:00:00.000Z", endedAt: null, businessStatus: null, link: null },
    ]);
    expect(await new SqliteOccurrenceExecutionRepository(database).list()).toEqual([
      { executionId: "e1", routineId: "r1", occurrenceKey: "2030-08-05T14:00", rank: 1, sessionId: "s-a", startedAt: "2030-08-05T12:07:00.000Z", businessStatus: "COMPLETED" },
    ]);
    database.close();
  });
});
