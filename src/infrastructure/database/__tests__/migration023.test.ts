import { afterEach, describe, expect, it } from "@jest/globals";

import { serializeCatalogExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { splitResolvedParameters } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { encodeFormatSettings } from "@/domain/sessions/formats/elementFormat";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { applyMigration023 } from "@/infrastructure/database/migrations/migration023";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Décisions EMOM du 07/11/2026 (réponse 3 de Hermann) — `migration023` : Récupération à 0 s des Exercices EMOM d'un
 * Circuit alterné ou d'un Circuit porteur EMOM ; tout le reste intact ; idempotente ; échec annulé.
 */

const T = "2026-11-07T08:00:00.000Z";
const PARAMETERS = serializeCatalogExecutionParameters(splitResolvedParameters(durationParameters(30, 3, 0)).parameters);
const EMOM_SETTINGS = encodeFormatSettings({ intervalSeconds: 60 });
const opened: NodeSqliteDatabase[] = [];

function memory(): NodeSqliteDatabase {
  const database = NodeSqliteDatabase.openInMemory();
  opened.push(database);
  return database;
}

afterEach(() => {
  for (const database of opened.splice(0)) database.close();
});

async function version(database: Database): Promise<number> {
  return (await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? -1;
}

async function recoveries(database: Database): Promise<Record<string, { seconds: number; present: number; updatedAt: string }>> {
  const rows = await database.getAllAsync<{ id: string; post_activity_recovery_seconds: number; post_activity_recovery_present: number; updated_at: string }>(
    "SELECT id, post_activity_recovery_seconds, post_activity_recovery_present, updated_at FROM activities ORDER BY id",
  );
  return Object.fromEntries(rows.map((row) => [row.id, { seconds: row.post_activity_recovery_seconds, present: row.post_activity_recovery_present, updatedAt: row.updated_at }]));
}

/**
 * Base au schéma 022 : un Circuit alterné (« alt »), un Circuit groupé standard (« suite »), un Circuit porteur EMOM
 * (« porteur ») et un Exercice hors Circuit, chacun avec un EMOM à 45 s de Récupération ; un Exercice libre alterné.
 */
async function seededVersion22(): Promise<NodeSqliteDatabase> {
  const database = memory();
  await migrateDatabase(database, () => T, 22);
  expect(await version(database)).toBe(22);
  const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = 1");
  await database.runAsync(
    `INSERT INTO sessions (id, owner_id, name, label_id, status, archived_at, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
     VALUES ('s', ?, 'Séance', NULL, 'ACTIVE', NULL, 10, 5, ?, ?)`,
    [user!.id, T, T],
  );
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
     VALUES ('mv-squat', 'Squat', 'squat', NULL, 'cardio', 1, ?, ?)`,
    [T, T],
  );
  await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-squat', 'dos')");
  for (const [id, position, nature, formatKey] of [
    ["alt", 0, "SERIES", null],
    ["suite", 1, "TOURS", null],
    ["porteur", 2, "TOURS", "EMOM"],
  ] as const) {
    await database.runAsync(
      "INSERT INTO tours (id, session_id, cycle_id, position, repeat_count, side_mode, nature, format_key, format_settings) VALUES (?, 's', NULL, ?, 3, 'UNILATERAL', ?, ?, ?)",
      [id, position, nature, formatKey, formatKey === null ? null : encodeFormatSettings({ windowSeconds: 60 })],
    );
  }
  for (const [id, tourId, position, formatKey] of [
    ["emom-alt", "alt", 0, "EMOM"],
    ["libre-alt", "alt", 1, null],
    ["emom-suite", "suite", 0, "EMOM"],
    ["emom-porteur", "porteur", 0, "EMOM"],
    ["emom-seul", null, 3, "EMOM"],
  ] as const) {
    await database.runAsync(
      `INSERT INTO activities (
         id, session_id, tour_id, cycle_id, type, position, execution_mode, duration_seconds, repetition_count, series_count,
         pause_seconds, post_activity_recovery_seconds, post_activity_recovery_present, created_at, updated_at, side_mode,
         execution_parameters, source_movement_id, copy_number, format_key, format_settings
       ) VALUES (?, 's', ?, NULL, 'EXERCISE', ?, 'DURATION', 30, NULL, 3, 0, 45, 1, ?, ?, 'UNILATERAL', ?, 'mv-squat', NULL, ?, ?)`,
      [id, tourId, position, T, T, PARAMETERS, formatKey, formatKey === null ? null : EMOM_SETTINGS],
    );
  }
  return database;
}

const KEPT = { seconds: 45, present: 1, updatedAt: T };
const ZERO = { seconds: 0, present: 1, updatedAt: T };

describe("migration023 — Récupération des EMOM alternés et « dans chaque intervalle » à 0 s", () => {
  it("schéma 022 → 023 : EMOM alterné et EMOM membre d'un Circuit porteur EMOM à 0 s ; À la suite, hors Circuit et Exercice libre intacts", async () => {
    const database = await seededVersion22();
    await migrateDatabase(database, () => T);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await recoveries(database)).toEqual({
      "emom-alt": ZERO,
      "emom-porteur": ZERO,
      "emom-seul": KEPT,
      "emom-suite": KEPT,
      "libre-alt": KEPT,
    });
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("idempotente : rejouée, elle ne change plus rien", async () => {
    const database = await seededVersion22();
    await migrateDatabase(database, () => T);
    const after = await recoveries(database);
    await database.withExclusiveTransactionAsync((transaction) => applyMigration023(transaction));
    expect(await recoveries(database)).toEqual(after);
  });

  it("installation neuve : version 23", async () => {
    const database = memory();
    await migrateDatabase(database, () => T);
    expect(DATABASE_VERSION).toBe(27);
    expect(await version(database)).toBe(DATABASE_VERSION);
  });
});
