import { describe, expect, it } from "@jest/globals";

import { EVERY_TIME } from "@/domain/planning/Routine";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Migration 036 — mode du nom des routines (D-553, 21/11/2026). Reprise : routine nommée = nom personnalisé, sans changement
 * visible ; routine sans nom (RM-264) = nom généré. 035 est réservée à la migration des Programmes (PROG-CAT-01).
 */
describe("migration 036 — routines.name_generated", () => {
  it("version 36 ; routines nommées personnalisées, routines sans nom générées ; données conservées ; idempotente", async () => {
    expect(DATABASE_VERSION).toBe(38); // version courante (Programmes en 038, intégration du 23/11/2026)
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, () => "2026-11-21T00:00:00.000Z", 34);
    await database.runAsync(
      `INSERT INTO routines (id, owner_id, name, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, end_count, reminder_minutes, created_at, updated_at)
       SELECT 'named', id, 'Mobilité du matin', '2026-08-03', '08:00', NULL, NULL, NULL, NULL, NULL, NULL, 15, 't', 't' FROM users`,
    );
    await database.runAsync(
      `INSERT INTO routines (id, owner_id, name, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, end_count, reminder_minutes, created_at, updated_at)
       SELECT 'unnamed', id, '', '2026-08-04', '09:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 't', 't' FROM users`,
    );
    await migrateDatabase(database);
    const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    expect(version?.user_version).toBe(38);
    const repository = new SqliteRoutineRepository(database);
    const named = await repository.get("named");
    expect(named).toMatchObject({ name: "Mobilité du matin", startDate: "2026-08-03", reminderMinutes: 15 });
    expect(named?.nameGenerated).toBeUndefined();
    expect(await repository.get("unnamed")).toMatchObject({ name: "", nameGenerated: true });
    await migrateDatabase(database);
    database.close();
  });

  it("le mode du nom est écrit et relu tel quel", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    const repository = new SqliteRoutineRepository(database);
    const base = {
      startDate: "2026-08-03",
      time: "08:00",
      repetition: null,
      entries: [{ id: "e", sessionId: "s", frequency: EVERY_TIME }],
      exclusions: [],
      reminderMinutes: null,
      createdAt: "t",
      updatedAt: "t",
    };
    await repository.save({ ...base, id: "g", name: "Alpha", nameGenerated: true });
    await repository.save({ ...base, id: "c", name: "Alpha", entries: [{ id: "e-c", sessionId: "s", frequency: EVERY_TIME }] });
    expect((await repository.get("g"))?.nameGenerated).toBe(true);
    expect((await repository.get("c"))?.nameGenerated).toBeUndefined();
    await repository.save({ ...base, id: "g", name: "Genou" });
    expect((await repository.get("g"))?.nameGenerated).toBeUndefined();
    database.close();
  });
});
