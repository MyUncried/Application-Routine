import { describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/** Migration 037 — créneau ajouté hors de la répétition (D-554, RM-273, 21/11/2026). 035 et 036 sont prises. */
describe("migration 037 — routine_occurrences.added", () => {
  it("version 37 ; occurrences existantes issues de la répétition (0) ; données conservées ; idempotente", async () => {
    expect(DATABASE_VERSION).toBe(41); // version courante (Programmes en 038, intégration du 23/11/2026)
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, () => "2026-11-21T00:00:00.000Z", 36);
    await database.runAsync(
      `INSERT INTO routines (id, owner_id, name, start_date, start_time, repeat_unit, repeat_every, repeat_weekdays, end_kind, end_date, end_count, reminder_minutes, created_at, updated_at)
       SELECT 'r', id, 'Genou', '2026-11-16', '08:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 't', 't' FROM users`,
    );
    await database.runAsync("INSERT INTO routine_entries (id, routine_id, position, session_id, frequency_x, frequency_n, frequency_positions) VALUES ('e', 'r', 0, 's', 1, 1, '1')");
    await database.runAsync(
      "INSERT INTO routine_occurrences (routine_id, occurrence_key, occurrence_index, occurrence_date, occurrence_time, reminder_overridden) VALUES ('r', '2026-11-16T08:00', 1, '2026-11-17', '09:00', 0)",
    );
    await migrateDatabase(database);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 41 });
    const routine = await new SqliteRoutineRepository(database).get("r");
    expect(routine?.overrides).toEqual([
      { key: "2026-11-16T08:00", index: 1, date: "2026-11-17", time: "09:00", sessions: null, reminderOverridden: false, reminderMinutes: null, startedAt: null },
    ]);
    await new SqliteRoutineRepository(database).save({
      ...routine!,
      overrides: [...routine!.overrides!, { key: "2026-11-18T08:00+A1", index: 1, date: "2026-11-18", time: "08:00", sessions: null, reminderOverridden: false, reminderMinutes: null, startedAt: null, added: true }],
    });
    expect((await new SqliteRoutineRepository(database).get("r"))?.overrides?.map((item) => item.added === true)).toEqual([false, true]);
    await migrateDatabase(database);
    database.close();
  });
});
