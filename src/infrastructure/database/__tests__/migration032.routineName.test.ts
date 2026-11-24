import { describe, expect, it } from "@jest/globals";

import { EVERY_TIME } from "@/domain/planning/Routine";
import { PlanningService } from "@/features/planning/PlanningService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/** Migration 032 — nom des planifications (D-522, RM-261, RM-264) et unité Jour persistée (RM-257). */
describe("migration 032 — routines.name", () => {
  it("une planification de la version 31 garde ses données et reçoit un nom vide (RM-264)", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, () => "2026-11-18T00:00:00.000Z", 31);
    await database.runAsync(
      `INSERT INTO routines (id, owner_id, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, end_count, reminder_minutes, created_at, updated_at)
       SELECT 'old', id, '2026-08-03', '08:00', 'WEEK', 1, '1', 'UNTIL', '2026-08-31', NULL, 15, 't', 't' FROM users`,
    );
    await migrateDatabase(database);
    const routine = await new SqliteRoutineRepository(database).get("old");
    expect(routine).toMatchObject({ name: "", startDate: "2026-08-03", reminderMinutes: 15 });
    await migrateDatabase(database);
    database.close();
  });

  it("nom non unique depuis D-553 ; nom vide refusé ; unité Jour relue", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    let ids = 0;
    const service = new PlanningService({ repository: new SqliteRoutineRepository(database), newId: () => `r${++ids}`, now: () => new Date(2026, 7, 1) });
    const draft = {
      name: "Matin",
      startDate: "2026-08-03",
      time: "08:00",
      repetition: { unit: "DAY" as const, every: 2, weekdays: [], end: { kind: "UNTIL" as const, date: "2026-08-20" } },
      entries: [{ id: "e", sessionId: "s", frequency: EVERY_TIME }],
    };
    const first = await service.createRoutine(draft);
    expect(first.status).toBe("SAVED");
    // D-553 (21/11/2026) : doublons de noms de Routines autorisés. [RM-261 : « NAME_TAKEN » — remplacé.]
    expect((await service.createRoutine({ ...draft, name: " MATIN ", entries: [{ id: "e2", sessionId: "s", frequency: EVERY_TIME }] })).status).toBe("SAVED");
    expect(await service.createRoutine({ ...draft, name: "" })).toEqual({ status: "INVALID", issues: ["NAME_REQUIRED"] });
    expect((await service.updateRoutine("r1", draft)).status).toBe("SAVED");
    expect((await service.getRoutine("r1"))?.repetition).toEqual(draft.repetition);
    database.close();
  });
});
