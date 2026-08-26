import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

describe("migrateDatabase", () => {
  let database: NodeSqliteDatabase;

  beforeEach(() => {
    database = NodeSqliteDatabase.openInMemory();
  });

  afterEach(() => {
    database.close();
  });

  it("creates version 1 and one stable local user idempotently", async () => {
    await migrateDatabase(database);
    const firstUser = await database.getFirstAsync<{ id: string }>("SELECT id FROM users");

    await migrateDatabase(database);
    const users = await database.getAllAsync<{ id: string }>("SELECT id FROM users");
    const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");

    expect(version?.user_version).toBe(DATABASE_VERSION);
    expect(users).toEqual([firstUser]);
    expect(firstUser?.id).toMatch(/^usr_[0-9a-f]{32}$/);
  });

  it("rejects a database newer than the application", async () => {
    await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION + 1}`);
    await expect(migrateDatabase(database)).rejects.toThrow("newer than supported");
  });

  it("enforces the canonical color and NULL-safe duration rules", async () => {
    await migrateDatabase(database);
    await seedStructure(database);

    await expect(
      insertActivity(database, {
        id: "activity-invalid-null",
        executionMode: "DURATION",
        durationSeconds: null,
        repetitionCount: null,
      }),
    ).rejects.toThrow();

    await expect(
      insertActivity(database, {
        id: "activity-invalid-both",
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: 10,
      }),
    ).rejects.toThrow();

    await expect(
      database.runAsync(
        `INSERT INTO sessions (
          id, owner_id, name, color, status, initial_countdown_seconds,
          final_phase_seconds, created_at, updated_at
        ) SELECT 'invalid-color', id, 'Séance', '#000000', 'ACTIVE', 10, 5, 'now', 'now'
          FROM users WHERE singleton_key = 1`,
      ),
    ).rejects.toThrow();
  });

  it("enforces that cycle, tour and activity belong to the same session", async () => {
    await migrateDatabase(database);
    await seedStructure(database);
    await seedStructure(database, "b");

    await expect(
      database.runAsync(
        `INSERT INTO activities (
          id, session_id, cycle_id, tour_id, type, structural_position,
          position, name, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, instruction, created_at, updated_at
        ) VALUES (
          'cross-session', 'session-a', 'cycle-a', 'tour-b', 'EXERCISE', 'IN_TOUR',
          0, 'Exercice', 'DURATION', 30, NULL, 1, 0, NULL, 'now', 'now'
        )`,
      ),
    ).rejects.toThrow();
  });
});

async function seedStructure(database: NodeSqliteDatabase, suffix = "a"): Promise<void> {
  await database.runAsync(
    `INSERT INTO sessions (
      id, owner_id, name, color, status, initial_countdown_seconds,
      final_phase_seconds, created_at, updated_at
    ) SELECT ?, id, ?, '#3B82F6', 'ACTIVE', 10, 5, 'now', 'now'
      FROM users WHERE singleton_key = 1`,
    [`session-${suffix}`, `Séance ${suffix}`],
  );
  await database.runAsync(
    "INSERT INTO cycles (id, session_id, position, repeat_count) VALUES (?, ?, 1, 1)",
    [`cycle-${suffix}`, `session-${suffix}`],
  );
  await database.runAsync(
    `INSERT INTO tours (id, cycle_id, session_id, position, repeat_count)
     VALUES (?, ?, ?, 1, 1)`,
    [`tour-${suffix}`, `cycle-${suffix}`, `session-${suffix}`],
  );
}

function insertActivity(
  database: NodeSqliteDatabase,
  values: {
    id: string;
    executionMode: string;
    durationSeconds: number | null;
    repetitionCount: number | null;
  },
): Promise<unknown> {
  return database.runAsync(
    `INSERT INTO activities (
      id, session_id, cycle_id, tour_id, type, structural_position,
      position, name, execution_mode, duration_seconds, repetition_count,
      series_count, pause_seconds, instruction, created_at, updated_at
    ) VALUES (?, 'session-a', 'cycle-a', 'tour-a', 'EXERCISE', 'IN_TOUR',
      0, 'Exercice', ?, ?, ?, 1, 0, NULL, 'now', 'now')`,
    [values.id, values.executionMode, values.durationSeconds, values.repetitionCount],
  );
}
