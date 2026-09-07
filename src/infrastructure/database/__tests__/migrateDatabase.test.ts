import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { MIGRATION_001 } from "@/infrastructure/database/migrations/migration001";
import { MIGRATION_002 } from "@/infrastructure/database/migrations/migration002";
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

  it("seeds exactly the 10 predefined categories once, idempotently, ordered by displayOrder (T01-S09, D-107)", async () => {
    await migrateDatabase(database);
    const firstPass = await database.getAllAsync<{ id: string; name: string; canonical_key: string }>(
      "SELECT id, name, canonical_key FROM categories ORDER BY display_order ASC",
    );

    await migrateDatabase(database);
    const secondPass = await database.getAllAsync<{ id: string }>("SELECT id FROM categories");

    expect(firstPass).toHaveLength(10);
    expect(firstPass[0]).toEqual({ id: "renforcement", name: "Renforcement", canonical_key: "renforcement" });
    expect(firstPass.map((row) => row.name)).toEqual([
      "Renforcement",
      "Cardio",
      "Mobilité",
      "Étirements",
      "Équilibre",
      "Coordination",
      "Récupération",
      "Respiration",
      "Méditation",
      "Autre",
    ]);
    expect(secondPass).toHaveLength(10); // idempotent: no duplicate seeding on a second migrateDatabase() call.
  });

  it("enforces canonical_key uniqueness on categories (T01-S09)", async () => {
    await migrateDatabase(database);

    await expect(
      database.runAsync(
        `INSERT INTO categories (id, name, canonical_key, is_predefined, display_order, created_at)
         VALUES ('dup', 'Cardio bis', 'cardio', 0, NULL, 'now')`,
      ),
    ).rejects.toThrow();
  });

  it("persists and enforces activity_body_zones referential integrity (T01-S09, D-093)", async () => {
    await migrateDatabase(database);
    await seedStructure(database);
    await insertActivity(database, {
      id: "activity-a",
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
    });

    await database.runAsync(
      "INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, ?)",
      ["activity-a", "dos"],
    );
    const row = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM activity_body_zones",
    );
    expect(row?.count).toBe(1);

    await expect(
      database.runAsync("INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, ?)", [
        "activity-a",
        "not-a-real-zone",
      ]),
    ).rejects.toThrow();
  });

  it("associates a session with a category via session_categories, cascading on session deletion (T01-S09)", async () => {
    await migrateDatabase(database);
    await seedStructure(database);

    await database.runAsync(
      "INSERT INTO session_categories (session_id, category_id) VALUES (?, ?)",
      ["session-a", "cardio"],
    );
    const before = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM session_categories",
    );
    expect(before?.count).toBe(1);

    await database.runAsync("DELETE FROM sessions WHERE id = ?", ["session-a"]);
    const after = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM session_categories",
    );
    expect(after?.count).toBe(0);
  });

  it("never modifies migration001's tables/constraints: the T01-S01 color and NULL-safe duration rules still hold after migration002", async () => {
    await migrateDatabase(database);
    await seedStructure(database);

    await expect(
      insertActivity(database, {
        id: "activity-invalid-both-post-migration002",
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: 10,
      }),
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

  describe("migration003 — mode TO_FAILURE (T01-S10, D-111)", () => {
    it("brings a version-2 database to version 3 and then accepts a TO_FAILURE Exercise (no target)", async () => {
      // Base réelle en version 2 : migration 001 + 002 uniquement, comme une
      // installation antérieure à T01-S10.
      await database.execAsync(MIGRATION_001);
      await database.runAsync(
        `INSERT OR IGNORE INTO users (singleton_key, id, created_at)
         VALUES (1, 'usr_' || lower(hex(randomblob(16))), '2026-01-01T00:00:00.000Z')`,
      );
      await database.execAsync(MIGRATION_002);
      await database.execAsync("PRAGMA user_version = 2");
      await seedStructure(database);
      await insertActivity(database, {
        id: "old-duration",
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: null,
      });
      await database.runAsync(
        "INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, ?)",
        ["old-duration", "dos"],
      );

      await migrateDatabase(database);

      const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
      expect(version?.user_version).toBe(3);

      // La contrainte historique DURATION+repetition reste rejetée.
      await expect(
        insertActivity(database, {
          id: "still-invalid",
          executionMode: "DURATION",
          durationSeconds: 30,
          repetitionCount: 10,
        }),
      ).rejects.toThrow();

      // TO_FAILURE : aucune cible, series_count requis.
      await database.runAsync(
        `INSERT INTO activities (
          id, session_id, cycle_id, tour_id, type, structural_position,
          position, name, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, instruction, created_at, updated_at
        ) VALUES (
          'to-failure', 'session-a', 'cycle-a', 'tour-a', 'EXERCISE', 'IN_TOUR',
          1, 'Tractions', 'TO_FAILURE', NULL, NULL, 3, 0, NULL, 'now', 'now'
        )`,
      );
      const failRow = await database.getFirstAsync<{ execution_mode: string; series_count: number }>(
        "SELECT execution_mode, series_count FROM activities WHERE id = 'to-failure'",
      );
      expect(failRow).toEqual({ execution_mode: "TO_FAILURE", series_count: 3 });

      // TO_FAILURE portant une cible est rejeté.
      await expect(
        database.runAsync(
          `INSERT INTO activities (
            id, session_id, cycle_id, tour_id, type, structural_position,
            position, name, execution_mode, duration_seconds, repetition_count,
            series_count, pause_seconds, instruction, created_at, updated_at
          ) VALUES (
            'to-failure-bad', 'session-a', 'cycle-a', 'tour-a', 'EXERCISE', 'IN_TOUR',
            2, 'Bad', 'TO_FAILURE', 30, NULL, 3, 0, NULL, 'now', 'now'
          )`,
        ),
      ).rejects.toThrow();
    });

    it("preserves existing rows, ids, dependent activity_body_zones and the position uniqueness index through the rebuild", async () => {
      await database.execAsync(MIGRATION_001);
      await database.runAsync(
        `INSERT OR IGNORE INTO users (singleton_key, id, created_at)
         VALUES (1, 'usr_' || lower(hex(randomblob(16))), '2026-01-01T00:00:00.000Z')`,
      );
      await database.execAsync(MIGRATION_002);
      await database.execAsync("PRAGMA user_version = 2");
      await seedStructure(database);
      await insertActivity(database, {
        id: "kept-1",
        executionMode: "REPETITIONS",
        durationSeconds: null,
        repetitionCount: 12,
      });
      await database.runAsync(
        "INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, ?), (?, ?)",
        ["kept-1", "dos", "kept-1", "epaules"],
      );

      await migrateDatabase(database);

      const activity = await database.getFirstAsync<{
        id: string;
        execution_mode: string;
        repetition_count: number;
      }>("SELECT id, execution_mode, repetition_count FROM activities WHERE id = 'kept-1'");
      expect(activity).toEqual({ id: "kept-1", execution_mode: "REPETITIONS", repetition_count: 12 });

      const zones = await database.getAllAsync<{ body_zone_id: string }>(
        "SELECT body_zone_id FROM activity_body_zones WHERE activity_id = 'kept-1' ORDER BY body_zone_id",
      );
      expect(zones.map((z) => z.body_zone_id)).toEqual(["dos", "epaules"]);

      // UNIQUE(session_id, structural_position, position) reconstruit.
      await expect(
        insertActivity(database, {
          id: "position-clash",
          executionMode: "DURATION",
          durationSeconds: 30,
          repetitionCount: null,
        }),
      ).rejects.toThrow();

      // Deuxième migrateDatabase() : no-op idempotent.
      await migrateDatabase(database);
      const stillThere = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM activities WHERE id = 'kept-1'",
      );
      expect(stillThere?.count).toBe(1);
      const backupGone = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sqlite_master WHERE name = 'activity_body_zones_backup'",
      );
      expect(backupGone?.count).toBe(0);
    });

    it("a fresh database reaches version 3 directly and accepts TO_FAILURE", async () => {
      await migrateDatabase(database);
      const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
      expect(version?.user_version).toBe(3);

      await seedStructure(database);
      await database.runAsync(
        `INSERT INTO activities (
          id, session_id, cycle_id, tour_id, type, structural_position,
          position, name, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, instruction, created_at, updated_at
        ) VALUES (
          'fresh-fail', 'session-a', 'cycle-a', 'tour-a', 'EXERCISE', 'IN_TOUR',
          0, 'Tractions', 'TO_FAILURE', NULL, NULL, 2, 0, NULL, 'now', 'now'
        )`,
      );
      const row = await database.getFirstAsync<{ id: string }>(
        "SELECT id FROM activities WHERE id = 'fresh-fail'",
      );
      expect(row?.id).toBe("fresh-fail");
    });
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
