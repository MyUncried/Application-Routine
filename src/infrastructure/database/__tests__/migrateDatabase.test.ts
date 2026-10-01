import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { MIGRATION_001 } from "@/infrastructure/database/migrations/migration001";
import { MIGRATION_002 } from "@/infrastructure/database/migrations/migration002";
import { MIGRATION_003 } from "@/infrastructure/database/migrations/migration003";
import { MIGRATION_004 } from "@/infrastructure/database/migrations/migration004";
import { MIGRATION_005 } from "@/infrastructure/database/migrations/migration005";
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

  // V2-PRE-1 (plan §3.3) : `sessions.color` autonome est retiré du schéma
  // cible (`migration007`) — la contrainte `CHECK` canonique sur les 12
  // couleurs n'existe donc plus sur cette colonne. Seules les règles
  // NULL-safe de `activities` (inchangées depuis migration001) restent
  // couvertes ici.
  it("enforces the NULL-safe duration rules", async () => {
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

  /**
   * V2-PRE-1 (plan §3.3) : la relation historique Catégorie de Séance N:N
   * (`session_categories`) est retirée du schéma cible — une Séance associe
   * désormais au plus une Étiquette (`sessions.label_id`), qui redevient
   * `NULL` si l'Étiquette référencée est supprimée (`ON DELETE SET NULL`).
   */
  it("has no session_categories table, and clears a Session's label_id when the referenced Label is deleted", async () => {
    await migrateDatabase(database);
    await seedStructure(database);

    const table = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'session_categories'",
    );
    expect(table?.count).toBe(0);

    await database.runAsync(
      `INSERT INTO labels (id, name, color, is_active, created_at) VALUES (?, ?, '#3B82F6', 1, 'now')`,
      ["label-a", "Étiquette A"],
    );
    await database.runAsync("UPDATE sessions SET label_id = ? WHERE id = ?", ["label-a", "session-a"]);

    const before = await database.getFirstAsync<{ label_id: string | null }>(
      "SELECT label_id FROM sessions WHERE id = 'session-a'",
    );
    expect(before?.label_id).toBe("label-a");

    await database.runAsync("DELETE FROM labels WHERE id = ?", ["label-a"]);
    const after = await database.getFirstAsync<{ label_id: string | null }>(
      "SELECT label_id FROM sessions WHERE id = 'session-a'",
    );
    expect(after?.label_id).toBeNull();
  });

  it("never modifies migration001's tables/constraints: the T01-S01 NULL-safe duration rule still holds after migration002", async () => {
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
      await seedLegacyStructure(database);
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
      // V2-CAT-01 : la chaîne complète mène désormais à la version 6
      // (`migration006`, persistance des `ActivityDefinition`) — jamais à la
      // version 3, 4 ou 5.
      expect(version?.user_version).toBe(DATABASE_VERSION);
      expect(DATABASE_VERSION).toBe(7);

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
      await seedLegacyStructure(database);
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

    it("preserves the exact created_at and updated_at of pre-existing activity rows through the rebuild (before/after)", async () => {
      await database.execAsync(MIGRATION_001);
      await database.runAsync(
        `INSERT OR IGNORE INTO users (singleton_key, id, created_at)
         VALUES (1, 'usr_' || lower(hex(randomblob(16))), '2026-01-01T00:00:00.000Z')`,
      );
      await database.execAsync(MIGRATION_002);
      await database.execAsync("PRAGMA user_version = 2");
      await seedLegacyStructure(database);

      // Deux Activités aux horodatages DISTINCTS et connus — jamais 'now'.
      const createdAtA = "2025-03-04T08:15:42.123Z";
      const updatedAtA = "2025-11-30T21:07:00.500Z";
      const createdAtB = "2024-01-01T00:00:00.000Z";
      const updatedAtB = "2026-02-14T14:14:14.999Z";
      await database.runAsync(
        `INSERT INTO activities (
          id, session_id, cycle_id, tour_id, type, structural_position,
          position, name, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, instruction, created_at, updated_at
        ) VALUES
          ('ts-a', 'session-a', 'cycle-a', 'tour-a', 'EXERCISE', 'IN_TOUR', 0, 'A', 'DURATION', 30, NULL, 1, 0, NULL, ?, ?),
          ('ts-b', 'session-a', 'cycle-a', 'tour-a', 'EXERCISE', 'IN_TOUR', 1, 'B', 'REPETITIONS', NULL, 12, 2, 5, NULL, ?, ?)`,
        [createdAtA, updatedAtA, createdAtB, updatedAtB],
      );

      const before = await database.getAllAsync<{
        id: string;
        created_at: string;
        updated_at: string;
      }>("SELECT id, created_at, updated_at FROM activities ORDER BY id");
      expect(before).toEqual([
        { id: "ts-a", created_at: createdAtA, updated_at: updatedAtA },
        { id: "ts-b", created_at: createdAtB, updated_at: updatedAtB },
      ]);

      await migrateDatabase(database);

      const after = await database.getAllAsync<{
        id: string;
        created_at: string;
        updated_at: string;
      }>("SELECT id, created_at, updated_at FROM activities ORDER BY id");
      expect(after).toEqual(before);
    });

    it("a fresh database reaches the current version directly and accepts TO_FAILURE", async () => {
      await migrateDatabase(database);
      const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
      expect(version?.user_version).toBe(DATABASE_VERSION);

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

  /**
   * T02-S02 — `migration004` : Récupération ATTACHÉE.
   *
   * Reprise DÉTERMINISTE des anciennes lignes `RECOVERY` autonomes : chacune
   * est reportée dans `recovery_seconds` de l'Activité qui la PRÉCÈDE
   * IMMÉDIATEMENT DANS LA MÊME ZONE structurelle, puis supprimée ; les
   * positions restantes sont renumérotées sans trou. Aucune reprise par NOM
   * (« Récupération ») n'est utilisée : elle serait indéterministe.
   */
  describe("migration004 — Récupération attachée (T02-S02)", () => {
    async function seedVersion3(): Promise<void> {
      await database.execAsync(MIGRATION_001);
      await database.runAsync(
        `INSERT OR IGNORE INTO users (singleton_key, id, created_at)
         VALUES (1, 'usr_' || lower(hex(randomblob(16))), '2026-01-01T00:00:00.000Z')`,
      );
      await database.execAsync(MIGRATION_002);
      await database.execAsync(MIGRATION_003);
      await database.execAsync("PRAGMA user_version = 3");
      await seedLegacyStructure(database);
    }

    /** Ligne d'Activité v3 brute — le seul moyen de créer une `RECOVERY` autonome, désormais interdite par le Domaine. */
    function insertLegacyRow(values: {
      id: string;
      zone: "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR";
      position: number;
      type: "EXERCISE" | "RECOVERY";
      executionMode: string;
      durationSeconds: number | null;
      repetitionCount?: number | null;
      seriesCount: number | null;
      pauseSeconds?: number;
    }): Promise<unknown> {
      return database.runAsync(
        `INSERT INTO activities (
          id, session_id, cycle_id, tour_id, type, structural_position,
          position, name, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, instruction, created_at, updated_at
        ) VALUES (?, 'session-a', 'cycle-a', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'now', 'now')`,
        [
          values.id,
          values.zone === "IN_TOUR" ? "tour-a" : null,
          values.type,
          values.zone,
          values.position,
          values.id,
          values.executionMode,
          values.durationSeconds,
          values.repetitionCount ?? null,
          values.seriesCount,
          values.pauseSeconds ?? 0,
        ],
      );
    }

    it("attaches each legacy RECOVERY to the Activity immediately preceding it in the same zone, deletes it, and renumbers positions", async () => {
      await seedVersion3();
      await insertLegacyRow({ id: "ex-1", zone: "IN_TOUR", position: 0, type: "EXERCISE", executionMode: "DURATION", durationSeconds: 30, seriesCount: 2, pauseSeconds: 5 });
      await insertLegacyRow({ id: "rec-1", zone: "IN_TOUR", position: 1, type: "RECOVERY", executionMode: "DURATION", durationSeconds: 20, seriesCount: null });
      await insertLegacyRow({ id: "ex-2", zone: "IN_TOUR", position: 2, type: "EXERCISE", executionMode: "REPETITIONS", durationSeconds: null, repetitionCount: 12, seriesCount: 3 });
      await insertLegacyRow({ id: "ex-3", zone: "IN_TOUR", position: 3, type: "EXERCISE", executionMode: "DURATION", durationSeconds: 40, seriesCount: 1 });

      await migrateDatabase(database);

      const rows = await database.getAllAsync<{
        id: string;
        position: number;
        post_activity_recovery_seconds: number;
      }>(
        "SELECT id, position, post_activity_recovery_seconds FROM activities WHERE structural_position = 'IN_TOUR' ORDER BY position",
      );
      expect(rows).toEqual([
        { id: "ex-1", position: 0, post_activity_recovery_seconds: 20 },
        { id: "ex-2", position: 1, post_activity_recovery_seconds: 0 },
        { id: "ex-3", position: 2, post_activity_recovery_seconds: 0 },
      ]);
    });

    it("never attaches a RECOVERY across zones: the preceding Activity must belong to the SAME structural zone", async () => {
      await seedVersion3();
      await insertLegacyRow({ id: "warmup", zone: "BEFORE_TOUR", position: 0, type: "EXERCISE", executionMode: "DURATION", durationSeconds: 60, seriesCount: 1 });
      // Récupération de la zone du Tour, en tête de SA zone : aucune Activité
      // ne la précède DANS le Tour — `warmup` appartient à une autre zone.
      await insertLegacyRow({ id: "orphan", zone: "IN_TOUR", position: 0, type: "RECOVERY", executionMode: "DURATION", durationSeconds: 45, seriesCount: null });

      await migrateDatabase(database);

      const remaining = await database.getAllAsync<{ id: string; post_activity_recovery_seconds: number }>(
        "SELECT id, post_activity_recovery_seconds FROM activities ORDER BY id",
      );
      // L'orpheline est ignorée (supprimée sans report) — `warmup` n'hérite de rien.
      expect(remaining).toEqual([{ id: "warmup", post_activity_recovery_seconds: 0 }]);
    });

    it("attaches only the FIRST following RECOVERY, and only to the Activity directly before it (two consecutive RECOVERY rows)", async () => {
      await seedVersion3();
      await insertLegacyRow({ id: "ex-1", zone: "IN_TOUR", position: 0, type: "EXERCISE", executionMode: "DURATION", durationSeconds: 30, seriesCount: 1 });
      await insertLegacyRow({ id: "rec-a", zone: "IN_TOUR", position: 1, type: "RECOVERY", executionMode: "DURATION", durationSeconds: 20, seriesCount: null });
      await insertLegacyRow({ id: "rec-b", zone: "IN_TOUR", position: 2, type: "RECOVERY", executionMode: "DURATION", durationSeconds: 35, seriesCount: null });

      await migrateDatabase(database);

      // `rec-b` n'est PAS additionnée : la seconde Récupération consécutive
      // n'est plus attachable et disparaît, la première seule est reportée.
      const rows = await database.getAllAsync<{ id: string; post_activity_recovery_seconds: number }>(
        "SELECT id, post_activity_recovery_seconds FROM activities",
      );
      expect(rows).toEqual([{ id: "ex-1", post_activity_recovery_seconds: 20 }]);
    });

    it("drops the body zones of the deleted RECOVERY rows while preserving those of the kept Activities", async () => {
      await seedVersion3();
      await insertLegacyRow({ id: "ex-1", zone: "IN_TOUR", position: 0, type: "EXERCISE", executionMode: "DURATION", durationSeconds: 30, seriesCount: 1 });
      await insertLegacyRow({ id: "rec-1", zone: "IN_TOUR", position: 1, type: "RECOVERY", executionMode: "DURATION", durationSeconds: 20, seriesCount: null });
      await database.runAsync(
        "INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, ?), (?, ?)",
        ["ex-1", "dos", "ex-1", "epaules"],
      );

      await migrateDatabase(database);

      const zones = await database.getAllAsync<{ activity_id: string; body_zone_id: string }>(
        "SELECT activity_id, body_zone_id FROM activity_body_zones ORDER BY body_zone_id",
      );
      expect(zones).toEqual([
        { activity_id: "ex-1", body_zone_id: "dos" },
        { activity_id: "ex-1", body_zone_id: "epaules" },
      ]);
      const leftovers = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM sqlite_master WHERE name IN ('activity_body_zones_backup', 'activities_position_map', 'activities_new')",
      );
      expect(leftovers?.count).toBe(0);
    });

    it("bounds post_activity_recovery_seconds in the database itself (0..5999) and keeps it at 0 for a RECOVERY-typed row", async () => {
      await migrateDatabase(database);
      await seedStructure(database);

      await expect(
        database.runAsync(
          `INSERT INTO activities (
            id, session_id, cycle_id, tour_id, type, structural_position,
            position, name, execution_mode, duration_seconds, repetition_count,
            series_count, pause_seconds, post_activity_recovery_seconds, instruction, created_at, updated_at
          ) VALUES (
            'out-of-range', 'session-a', 'cycle-a', 'tour-a', 'EXERCISE', 'IN_TOUR',
            0, 'Exercice', 'DURATION', 30, NULL, 1, 0, 6000, NULL, 'now', 'now'
          )`,
        ),
      ).rejects.toThrow();
    });

    it("defaults post_activity_recovery_seconds to 0 for a fresh row that does not mention it, and re-migrating is a no-op", async () => {
      await migrateDatabase(database);
      await seedStructure(database);
      await insertActivity(database, {
        id: "fresh",
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: null,
      });

      await migrateDatabase(database);

      const row = await database.getFirstAsync<{ post_activity_recovery_seconds: number }>(
        "SELECT post_activity_recovery_seconds FROM activities WHERE id = 'fresh'",
      );
      expect(row?.post_activity_recovery_seconds).toBe(0);
      const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
      expect(version?.user_version).toBe(DATABASE_VERSION);
    });

    it("preserves the exact created_at / updated_at of the kept rows through the migration004 rebuild", async () => {
      await seedVersion3();
      const createdAt = "2025-03-04T08:15:42.123Z";
      const updatedAt = "2025-11-30T21:07:00.500Z";
      await database.runAsync(
        `INSERT INTO activities (
          id, session_id, cycle_id, tour_id, type, structural_position,
          position, name, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, instruction, created_at, updated_at
        ) VALUES (
          'ts-a', 'session-a', 'cycle-a', 'tour-a', 'EXERCISE', 'IN_TOUR',
          0, 'A', 'DURATION', 30, NULL, 1, 0, NULL, ?, ?
        )`,
        [createdAt, updatedAt],
      );

      await migrateDatabase(database);

      const row = await database.getFirstAsync<{ created_at: string; updated_at: string }>(
        "SELECT created_at, updated_at FROM activities WHERE id = 'ts-a'",
      );
      expect(row).toEqual({ created_at: createdAt, updated_at: updatedAt });
    });
  });

  /**
   * V2-BILAT-01 — `migration005` : configuration de bilatéralité PRÉALABLE à
   * T03 (`activities.side_mode`/`tours.side_mode`), sans reconstruction de
   * table (simple `ALTER TABLE ADD COLUMN` — voir `migration005.ts`).
   */
  describe("migration005 — bilatéralité (V2-BILAT-01)", () => {
    async function seedVersion4(): Promise<void> {
      await database.execAsync(MIGRATION_001);
      await database.runAsync(
        `INSERT OR IGNORE INTO users (singleton_key, id, created_at)
         VALUES (1, 'usr_' || lower(hex(randomblob(16))), '2026-01-01T00:00:00.000Z')`,
      );
      await database.execAsync(MIGRATION_002);
      await database.execAsync(MIGRATION_003);
      await database.execAsync(MIGRATION_004);
      await database.execAsync("PRAGMA user_version = 4");
      await seedLegacyStructure(database);
      await insertActivity(database, {
        id: "legacy-activity",
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: null,
      });
    }

    it("brings a version-4 database (v0…v4 chain) through version 5, defaulting every pre-existing row to UNILATERAL", async () => {
      await seedVersion4();

      await migrateDatabase(database);

      const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
      expect(version?.user_version).toBe(DATABASE_VERSION);

      const activityRow = await database.getFirstAsync<{ side_mode: string }>(
        "SELECT side_mode FROM activities WHERE id = 'legacy-activity'",
      );
      expect(activityRow?.side_mode).toBe("UNILATERAL");
      const tourRow = await database.getFirstAsync<{ side_mode: string }>(
        "SELECT side_mode FROM tours WHERE id = 'tour-a'",
      );
      expect(tourRow?.side_mode).toBe("UNILATERAL");
    });

    it("is a no-op on a second call — a database already at the current version is never replayed", async () => {
      await migrateDatabase(database);
      await seedStructure(database);
      await insertActivity(database, {
        id: "fresh",
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: null,
      });

      await migrateDatabase(database);

      const row = await database.getFirstAsync<{ side_mode: string }>(
        "SELECT side_mode FROM activities WHERE id = 'fresh'",
      );
      expect(row?.side_mode).toBe("UNILATERAL");
      const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
      expect(version?.user_version).toBe(DATABASE_VERSION);
    });

    it("still rejects a database newer than the application", async () => {
      await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION + 1}`);
      await expect(migrateDatabase(database)).rejects.toThrow("newer than supported");
    });

    it("bounds side_mode to the three canonical values, on both activities and tours", async () => {
      await migrateDatabase(database);
      await seedStructure(database);

      await expect(
        database.runAsync(
          `INSERT INTO activities (
            id, session_id, cycle_id, tour_id, type, structural_position,
            position, name, execution_mode, duration_seconds, repetition_count,
            series_count, pause_seconds, instruction, created_at, updated_at, side_mode
          ) VALUES (
            'bad-side', 'session-a', 'cycle-a', 'tour-a', 'EXERCISE', 'IN_TOUR',
            0, 'Exercice', 'DURATION', 30, NULL, 1, 0, NULL, 'now', 'now', 'BILATERAL'
          )`,
        ),
      ).rejects.toThrow();

      await expect(
        database.runAsync(`UPDATE tours SET side_mode = 'NOT_A_MODE' WHERE id = 'tour-a'`),
      ).rejects.toThrow();
    });

    it("accepts each of the three canonical values on an Activity and on the Tour", async () => {
      await migrateDatabase(database);
      await seedStructure(database);

      for (const sideMode of ["UNILATERAL", "RIGHT_LEFT", "LEFT_RIGHT"]) {
        await database.runAsync(`UPDATE tours SET side_mode = ? WHERE id = 'tour-a'`, [sideMode]);
        const row = await database.getFirstAsync<{ side_mode: string }>(
          "SELECT side_mode FROM tours WHERE id = 'tour-a'",
        );
        expect(row?.side_mode).toBe(sideMode);
      }
    });

    it("rolls back the entire migration on failure, leaving user_version unchanged (shared transaction, non-regression)", async () => {
      await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION + 1}`);
      await expect(migrateDatabase(database)).rejects.toThrow();
      const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
      expect(version?.user_version).toBe(DATABASE_VERSION + 1);
    });

    it("adds no Execution/Snapshot/Result table when going from v4 to v5 — strictly the two side_mode columns (no T03 data)", async () => {
      await seedVersion4();
      const before = await database.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      );

      await migrateDatabase(database);
      // La chaîne complète va désormais jusqu'à `migration007` : les tables
      // `activity_definitions`/`activity_definition_body_zones` (`migration006`)
      // et les référentiels additifs `body_zones`/`labels`/`profiles`/
      // `media_assets`/`activity_media`/`session_stop_points` (`migration007`)
      // apparaissent ; la relation historique `session_categories` (V2-PRE-1,
      // plan §3.3) est retirée — seules différences attendues avec `before`.
      const after = await database.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      );
      const expectedNames = [
        ...before.map((row) => row.name).filter((name) => name !== "session_categories"),
        "activity_definition_body_zones",
        "activity_definitions",
        "activity_media",
        "body_zones",
        "labels",
        "media_assets",
        "profiles",
        "session_stop_points",
      ].sort();
      expect(after.map((row) => row.name)).toEqual(expectedNames);
    });
  });

  /**
   * V2-CAT-01 — `migration006` : persistance additive des `ActivityDefinition`
   * du Catalogue des activités et de leurs Zones corporelles. Ne convertit
   * aucune `SessionActivity` historique.
   */
  describe("migration006 — ActivityDefinition (V2-CAT-01)", () => {
    async function seedVersion5(): Promise<void> {
      await database.execAsync(MIGRATION_001);
      await database.runAsync(
        `INSERT OR IGNORE INTO users (singleton_key, id, created_at)
         VALUES (1, 'usr_' || lower(hex(randomblob(16))), '2026-01-01T00:00:00.000Z')`,
      );
      await database.execAsync(MIGRATION_002);
      await database.execAsync(MIGRATION_003);
      await database.execAsync(MIGRATION_004);
      await database.execAsync(MIGRATION_005);
      await database.execAsync("PRAGMA user_version = 5");
    }

    it("brings a version-5 database (v0…v5 chain) to the current version and creates the activity_definitions tables", async () => {
      await seedVersion5();

      await migrateDatabase(database);

      const version = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
      expect(version?.user_version).toBe(DATABASE_VERSION);
      expect(DATABASE_VERSION).toBe(7);

      const tables = await database.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'activity_definition%'",
      );
      expect(tables.map((t) => t.name).sort()).toEqual([
        "activity_definition_body_zones",
        "activity_definitions",
      ]);
    });

    it("creates activity_definitions on a fresh database and accepts a valid row", async () => {
      await migrateDatabase(database);

      await database.runAsync(
        `INSERT INTO activity_definitions (
          id, name, description, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, side_mode, created_at, updated_at
        ) VALUES ('def-1', 'Squat', NULL, 'DURATION', 30, NULL, 3, 10, 'UNILATERAL', 'now', 'now')`,
      );

      const row = await database.getFirstAsync<{ id: string; name: string }>(
        "SELECT id, name FROM activity_definitions WHERE id = 'def-1'",
      );
      expect(row).toEqual({ id: "def-1", name: "Squat" });
    });

    it("enforces the execution_mode and side_mode CHECK constraints", async () => {
      await migrateDatabase(database);

      await expect(
        database.runAsync(
          `INSERT INTO activity_definitions (
            id, name, description, execution_mode, duration_seconds, repetition_count,
            series_count, pause_seconds, side_mode, created_at, updated_at
          ) VALUES ('bad-mode', 'Squat', NULL, 'INVALID', 30, NULL, 3, 10, 'UNILATERAL', 'now', 'now')`,
        ),
      ).rejects.toThrow();

      await expect(
        database.runAsync(
          `INSERT INTO activity_definitions (
            id, name, description, execution_mode, duration_seconds, repetition_count,
            series_count, pause_seconds, side_mode, created_at, updated_at
          ) VALUES ('bad-side', 'Squat', NULL, 'DURATION', 30, NULL, 3, 10, 'BILATERAL', 'now', 'now')`,
        ),
      ).rejects.toThrow();
    });

    it("cascades activity_definition_body_zones deletion when the definition is deleted", async () => {
      await migrateDatabase(database);
      await database.runAsync(
        `INSERT INTO activity_definitions (
          id, name, description, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, side_mode, created_at, updated_at
        ) VALUES ('def-1', 'Squat', NULL, 'DURATION', 30, NULL, 3, 10, 'UNILATERAL', 'now', 'now')`,
      );
      await database.runAsync(
        "INSERT INTO activity_definition_body_zones (activity_definition_id, body_zone_id) VALUES ('def-1', 'cuisses')",
      );

      await database.runAsync("DELETE FROM activity_definitions WHERE id = 'def-1'");

      const remaining = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM activity_definition_body_zones",
      );
      expect(remaining?.count).toBe(0);
    });

    it("does not convert or touch any historical SessionActivity row", async () => {
      await seedVersion5();
      await seedLegacyStructure(database);
      await insertActivity(database, {
        id: "legacy-activity",
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: null,
      });

      await migrateDatabase(database);

      const activityCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM activities",
      );
      expect(activityCount?.count).toBe(1);
      const definitionCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM activity_definitions",
      );
      expect(definitionCount?.count).toBe(0);
    });
  });

  /**
   * V2-PRE-1 — `migration007` : référentiels persistants additifs
   * (`body_zones`, `labels`, `profiles`, `media_assets`, `activity_media`)
   * ET convergence du schéma cible sur les tables existantes (`categories`,
   * `activity_definitions`, `sessions`, `activities`) — `ALTER TABLE`
   * uniquement (`ADD COLUMN`/`RENAME COLUMN`/`DROP COLUMN`), jamais de
   * reconstruction de table (aucune contrainte `CHECK` existante n'est
   * modifiée par cette tranche).
   */
  describe("migration007 — référentiels persistants additifs (V2-PRE-1)", () => {
    it("seeds body_zones from the historical BODY_ZONES referential, all active", async () => {
      await migrateDatabase(database);
      const zones = await database.getAllAsync<{ id: string; is_active: number }>(
        "SELECT id, is_active FROM body_zones ORDER BY id",
      );
      expect(zones.length).toBe(10);
      expect(zones.every((zone) => zone.is_active === 1)).toBe(true);
    });

    it("seeds a single Profile row with the four normative defaults (10s / 30s / 10s / 5s, plan §3.2, D-240)", async () => {
      await migrateDatabase(database);
      const profiles = await database.getAllAsync<{
        singleton_key: number;
        side_change_recovery_seconds_default: number;
        post_activity_recovery_seconds_default: number;
        exercise_countdown_seconds_default: number;
        exercise_end_seconds_default: number;
      }>(
        `SELECT singleton_key, side_change_recovery_seconds_default, post_activity_recovery_seconds_default,
                exercise_countdown_seconds_default, exercise_end_seconds_default
         FROM profiles`,
      );
      expect(profiles).toEqual([
        {
          singleton_key: 1,
          side_change_recovery_seconds_default: 10,
          post_activity_recovery_seconds_default: 30,
          exercise_countdown_seconds_default: 10,
          exercise_end_seconds_default: 5,
        },
      ]);
    });

    it("creates empty labels/media_assets/activity_media tables, ready for future rows", async () => {
      await migrateDatabase(database);
      const labelCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM labels",
      );
      const mediaAssetCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM media_assets",
      );
      const activityMediaCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM activity_media",
      );
      expect(labelCount?.count).toBe(0);
      expect(mediaAssetCount?.count).toBe(0);
      expect(activityMediaCount?.count).toBe(0);
    });

    it("allows several distinct media assets for the same Exercise at distinct positions", async () => {
      await migrateDatabase(database);
      await database.runAsync(
        `INSERT INTO activity_definitions (
          id, name, description, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, side_mode, created_at, updated_at
        ) VALUES ('def-1', 'Squat', NULL, 'DURATION', 30, NULL, 3, 10, 'UNILATERAL', 'now', 'now')`,
      );
      await database.runAsync(
        "INSERT INTO media_assets (id, uri, created_at) VALUES ('asset-1', 'file://a1', 'now'), ('asset-2', 'file://a2', 'now')",
      );
      await database.runAsync(
        `INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES
          ('am-1', 'def-1', 'asset-1', 0),
          ('am-2', 'def-1', 'asset-2', 1)`,
      );

      const rows = await database.getAllAsync<{ id: string; position: number }>(
        "SELECT id, position FROM activity_media WHERE activity_definition_id = 'def-1' ORDER BY position",
      );
      expect(rows).toEqual([
        { id: "am-1", position: 0 },
        { id: "am-2", position: 1 },
      ]);
    });

    it("rejects a duplicate position for the same Exercise", async () => {
      await migrateDatabase(database);
      await database.runAsync(
        `INSERT INTO activity_definitions (
          id, name, description, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, side_mode, created_at, updated_at
        ) VALUES ('def-1', 'Squat', NULL, 'DURATION', 30, NULL, 3, 10, 'UNILATERAL', 'now', 'now')`,
      );
      await database.runAsync(
        "INSERT INTO media_assets (id, uri, created_at) VALUES ('asset-1', 'file://a1', 'now'), ('asset-2', 'file://a2', 'now')",
      );
      await database.runAsync(
        "INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES ('am-1', 'def-1', 'asset-1', 0)",
      );
      await expect(
        database.runAsync(
          "INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES ('am-2', 'def-1', 'asset-2', 0)",
        ),
      ).rejects.toThrow();
    });

    it("cascades activity_media deletion when the Exercise is deleted", async () => {
      await migrateDatabase(database);
      await database.runAsync(
        `INSERT INTO activity_definitions (
          id, name, description, execution_mode, duration_seconds, repetition_count,
          series_count, pause_seconds, side_mode, created_at, updated_at
        ) VALUES ('def-1', 'Squat', NULL, 'DURATION', 30, NULL, 3, 10, 'UNILATERAL', 'now', 'now')`,
      );
      await database.runAsync(
        "INSERT INTO media_assets (id, uri, created_at) VALUES ('asset-1', 'file://a1', 'now')",
      );
      await database.runAsync(
        "INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES ('am-1', 'def-1', 'asset-1', 0)",
      );

      await database.runAsync("DELETE FROM activity_definitions WHERE id = 'def-1'");

      const remaining = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM activity_media",
      );
      expect(remaining?.count).toBe(0);
    });

    it("is idempotent — a second migrateDatabase call never reseeds body_zones or profiles", async () => {
      await migrateDatabase(database);
      await migrateDatabase(database);

      const zoneCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM body_zones",
      );
      const profileCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM profiles",
      );
      expect(zoneCount?.count).toBe(10);
      expect(profileCount?.count).toBe(1);
    });
  });
});

/**
 * Structure d'une Séance minimale, schéma CIBLE (post-`migration007`) :
 * `sessions` ne porte plus `color` (dérivée de l'Étiquette, V2-PRE-1,
 * plan §3.3) — réservé aux tests qui ont déjà appelé `migrateDatabase()`
 * dans son intégralité (version `DATABASE_VERSION`). Pour une base figée à
 * une version HISTORIQUE antérieure (`color` encore `NOT NULL`), voir
 * `seedLegacyStructure` ci-dessous.
 */
async function seedStructure(database: NodeSqliteDatabase, suffix = "a"): Promise<void> {
  await database.runAsync(
    `INSERT INTO sessions (
      id, owner_id, name, status, initial_countdown_seconds,
      final_phase_seconds, created_at, updated_at
    ) SELECT ?, id, ?, 'ACTIVE', 10, 5, 'now', 'now'
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

/**
 * Même structure, schéma HISTORIQUE (`color NOT NULL`, migration001-006
 * inchangées) — réservée aux tests qui simulent une base figée à une
 * version antérieure via l'exécution directe de `MIGRATION_00N` (jamais
 * `migrateDatabase()` dans son intégralité), avant que `migration007` ne
 * retire cette colonne.
 */
async function seedLegacyStructure(database: NodeSqliteDatabase, suffix = "a"): Promise<void> {
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
