import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Migration 038 (développée comme 035, renumérotée à l'intégration du 23/11/2026) — Programmes (PROG-CAT-01, 21/11/2026) :
 * montée d'une base en version 34 (celle de l'iPhone de recette,
 * branche `integration/bmad-planification-20261120`) sans perte, contraintes de `programs`, `ON DELETE SET NULL`.
 */

async function seedVersion34(database: NodeSqliteDatabase): Promise<void> {
  await migrateDatabase(database, undefined, 34);
  const owner = (await database.getFirstAsync<{ id: string }>("SELECT id FROM users"))!.id;
  await database.runAsync(
    `INSERT INTO routines (id, owner_id, name, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, created_at, updated_at)
     VALUES ('r1', ?, 'Genou', '2030-08-05', '08:00', 'WEEK', 1, '1,4', 'UNTIL', '2030-08-29', 't', 't')`,
    [owner],
  );
  await database.runAsync("INSERT INTO routine_entries (id, routine_id, position, session_id) VALUES ('e1', 'r1', 0, 's1')");
  await database.runAsync("INSERT INTO routine_exclusions (routine_id, occurrence_key, created_at) VALUES ('r1', '2030-08-08T08:00', 't')");
  await database.runAsync(
    "INSERT INTO routine_occurrences (routine_id, occurrence_key, occurrence_index, started_at) VALUES ('r1', '2030-08-05T08:00', 1, '2030-08-05T08:01:00.000Z')",
  );
  await database.runAsync(
    `INSERT INTO executions (id, origin, session_id, snapshot_json, snapshot_version, plan_version, engine_version, status, checkpoint_json,
       checkpoint_revision, started_at, last_saved_at, clock_wall_ms)
     VALUES ('x1', 'SESSION', NULL, '{}', 1, 1, 1, 'FINISHED', '{}', 1, '2030-08-05T08:01:00.000Z', '2030-08-05T08:01:00.000Z', 0)`,
  );
  await database.runAsync("INSERT INTO occurrence_executions (execution_id, routine_id, occurrence_key, session_rank) VALUES ('x1', 'r1', '2030-08-05T08:00', 1)");
}

const count = async (database: NodeSqliteDatabase, table: string) => (await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`))?.count;

describe("migration 038 — programmes", () => {
  // Intégration du 23/11/2026 (INTEG-PROG-2311) : la base de l'iPhone de recette est en version 37 (planification) ; elle reçoit
  // les programmes en 38 sans perte.
  it("monte une base v37 (planification) en v38 : tables des programmes créées, routines conservées", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await seedVersion34(database);
    await migrateDatabase(database, undefined, 37);
    expect(await database.getFirstAsync("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'programs'")).toBeNull();
    await migrateDatabase(database);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 39 });
    expect(await database.getFirstAsync("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'programs'")).toEqual({ name: "programs" });
    expect(await database.getFirstAsync("SELECT program_id, name_generated FROM routines WHERE id = 'r1'")).toEqual({ program_id: null, name_generated: 0 });
    expect(await count(database, "user_privacy")).toBe(0);
  });

  it("monte une base v34 sans perte : routines, occurrences et exécutions conservées, sans programme", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await seedVersion34(database);
    const before = {
      routines: await count(database, "routines"),
      entries: await count(database, "routine_entries"),
      exclusions: await count(database, "routine_exclusions"),
      occurrences: await count(database, "routine_occurrences"),
      executions: await count(database, "executions"),
      links: await count(database, "occurrence_executions"),
    };
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(39);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 39 });
    expect({
      routines: await count(database, "routines"),
      entries: await count(database, "routine_entries"),
      exclusions: await count(database, "routine_exclusions"),
      occurrences: await count(database, "routine_occurrences"),
      executions: await count(database, "executions"),
      links: await count(database, "occurrence_executions"),
    }).toEqual(before);
    expect(await database.getFirstAsync("SELECT program_id FROM routines WHERE id = 'r1'")).toEqual({ program_id: null });
    expect(await database.getFirstAsync("SELECT program_id FROM executions WHERE id = 'x1'")).toEqual({ program_id: null });
    expect(await count(database, "user_privacy")).toBe(0);
    expect(await count(database, "programs")).toBe(0);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    // Idempotente.
    await migrateDatabase(database);
    database.close();
  });

  it("contraintes : nom non vide, fin ≥ début, suivi 0/1 faux par défaut ; ON DELETE SET NULL sur les routines", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await seedVersion34(database);
    await migrateDatabase(database);
    const owner = (await database.getFirstAsync<{ id: string }>("SELECT id FROM users"))!.id;
    const insert = (id: string, name: string, start: string, end: string) =>
      database.runAsync("INSERT INTO programs (id, owner_id, name, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 't', 't')", [
        id,
        owner,
        name,
        start,
        end,
      ]);
    await expect(insert("p0", "  ", "2030-08-01", "2030-08-31")).rejects.toThrow();
    await expect(insert("p0", "Genou", "2030-08-31", "2030-08-01")).rejects.toThrow();
    await insert("p1", "Genou", "2030-08-01", "2030-08-01");
    expect(await database.getFirstAsync("SELECT pain_tracking, terminated_at, objective FROM programs WHERE id = 'p1'")).toEqual({
      pain_tracking: 0,
      terminated_at: null,
      objective: null,
    });
    await expect(database.runAsync("UPDATE programs SET pain_tracking = 2 WHERE id = 'p1'")).rejects.toThrow();
    await database.runAsync("UPDATE routines SET program_id = 'p1' WHERE id = 'r1'");
    await database.runAsync("DELETE FROM programs WHERE id = 'p1'");
    expect(await database.getFirstAsync("SELECT program_id FROM routines WHERE id = 'r1'")).toEqual({ program_id: null });
    expect(await count(database, "routines")).toBe(1);
    database.close();
  });
});
