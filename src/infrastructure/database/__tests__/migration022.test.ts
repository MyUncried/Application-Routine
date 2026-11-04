import { afterEach, describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { applyMigration022 } from "@/infrastructure/database/migrations/migration022";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Reprise Formats du 04/11/2026 (§6 quinquies) — `migration022` : colonne additive nullable `tours.name` (nom du
 * Circuit, `NULL` = nom par défaut) ; Circuits existants intacts, sans reprise ; idempotente ; installation neuve.
 */

const T = "2026-11-04T08:00:00.000Z";
const opened: NodeSqliteDatabase[] = [];

function memory(): NodeSqliteDatabase {
  const database = NodeSqliteDatabase.openInMemory();
  opened.push(database);
  return database;
}

afterEach(() => {
  for (const database of opened.splice(0)) database.close();
});

async function columns(database: Database): Promise<string[]> {
  return (await database.getAllAsync<{ name: string }>("PRAGMA table_info(tours)")).map((row) => row.name);
}

describe("migration022 — nom du Circuit", () => {
  it("schéma 021 → 022 : colonne ajoutée, Circuit existant intact (nom par défaut), idempotente", async () => {
    const database = memory();
    await migrateDatabase(database, () => T, 21);
    expect(await columns(database)).not.toContain("name");
    const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = 1");
    await database.runAsync(
      `INSERT INTO sessions (id, owner_id, name, label_id, status, archived_at, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
       VALUES ('s', ?, 'Séance', NULL, 'ACTIVE', NULL, 10, 5, ?, ?)`,
      [user!.id, T, T],
    );
    await database.runAsync("INSERT INTO tours (id, session_id, cycle_id, position, repeat_count, side_mode, nature, origin_model) VALUES ('t', 's', NULL, 0, 8, 'UNILATERAL', 'SERIES', 'TABATA')");
    await migrateDatabase(database, () => T);
    expect((await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version).toBe(22);
    expect(await database.getFirstAsync("SELECT repeat_count, nature, origin_model, name FROM tours WHERE id = 't'")).toEqual({
      repeat_count: 8,
      nature: "SERIES",
      origin_model: "TABATA",
      name: null,
    });
    await database.withExclusiveTransactionAsync((transaction) => applyMigration022(transaction));
    expect((await columns(database)).filter((column) => column === "name")).toHaveLength(1);
  });

  it("installation neuve : version 22, colonne présente", async () => {
    const database = memory();
    await migrateDatabase(database, () => T);
    expect(DATABASE_VERSION).toBe(22);
    expect(await columns(database)).toContain("name");
  });
});
