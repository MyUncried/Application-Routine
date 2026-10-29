import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { splitResolvedParameters } from "@/domain/activities/Movement";
import { serializeCatalogExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { toSessionDraft } from "@/domain/sessions/SessionDraft";
import { SessionService } from "@/features/sessions/SessionService";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { failOnWrite } from "@/infrastructure/database/testing/failOnWrite";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (story A.1) — `migration016` sur une COPIE de base FICHIER au schéma 015, peuplée comme une
 * base d'appareil (Séances de l'ancien modèle, Points d'arrêt aux trois portées, Séance archivée,
 * Exercice du Catalogue), migrée par le chemin du démarrage (`initializeDatabase`) et relue par une
 * NOUVELLE connexion : lignes recopiées à l'identique, aucune Séance modifiée, `cycle_id` NULL,
 * réouverture et réenregistrement par le service sans perte ; échec au milieu de la transaction
 * annulé (base intacte au schéma 015), reprise au démarrage suivant. Aucune copie de la base réelle
 * de l'iPhone n'est disponible sur ce poste : cette base fichier en tient lieu. Une suite verte ne
 * vaut pas recette sur appareil.
 */

const T = "2026-10-28T08:00:00.000Z";
const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre9-a1");
let path: string;
const opened: NodeSqliteDatabase[] = [];

function open(): NodeSqliteDatabase {
  const database = NodeSqliteDatabase.openFile(path);
  opened.push(database);
  return database;
}

function reopen(database: NodeSqliteDatabase): NodeSqliteDatabase {
  database.close();
  opened.splice(opened.indexOf(database), 1);
  return open();
}

beforeEach(() => {
  mkdirSync(WORK_DIRECTORY, { recursive: true });
  path = join(WORK_DIRECTORY, `base-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
});

afterEach(() => {
  for (const database of opened.splice(0)) {
    try {
      database.close();
    } catch {
      // déjà fermée
    }
  }
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    rmSync(`${path}${suffix}`, { force: true });
  }
});

async function version(database: Database): Promise<number> {
  return (await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? -1;
}

async function columns(database: Database, table: string): Promise<string[]> {
  return (await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map((row) => row.name);
}

const PARAMETERS = serializeCatalogExecutionParameters(splitResolvedParameters(durationParameters(30, 2, 10)).parameters);

/** Colonnes de 014/015 des deux tables reconstruites, comparées ligne pour ligne. */
const ACTIVITY_SNAPSHOT = `SELECT id, session_id, tour_id, type, position, execution_mode, duration_seconds, repetition_count,
  series_count, pause_seconds, post_activity_recovery_seconds, created_at, updated_at, side_mode, execution_parameters,
  post_activity_recovery_present, source_movement_id, copy_number FROM activities ORDER BY id`;
const STOP_POINT_SNAPSHOT = "SELECT id, session_id, tour_id, position FROM session_stop_points ORDER BY id";

/** Tables que la 016 ne touche pas. */
const UNTOUCHED = ["users", "profiles", "categories", "body_zones", "labels", "sessions", "cycles", "tours", "movements", "activity_definitions", "migration_notices"];

const MIGRATION_017_COLUMNS = new Set(["origin", "format_key", "format_settings"]);

async function snapshot(database: Database): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const table of UNTOUCHED) {
    // PRE-9 (C.1) : la 017, jouée ensuite au démarrage, ajoute `sessions.origin` et le Format des
    // Circuits (NULL) ; elle est éprouvée par `migration017.test.ts`. Comparaison sur les colonnes d'avant.
    const rows = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} ORDER BY 1`);
    result[table] = rows.map((row) => Object.fromEntries(Object.entries(row).filter(([column]) => !MIGRATION_017_COLUMNS.has(column))));
  }
  result.activities = await database.getAllAsync(ACTIVITY_SNAPSHOT);
  result.stopPoints = await database.getAllAsync(STOP_POINT_SNAPSHOT);
  return result;
}

/**
 * Base au schéma 015 : Séance « Complète » [b1, b2, Circuit (i1, i2) × 3 Séries, a1] avec trois
 * Points (avant, dans, après le Circuit) ; Séance archivée à Circuit vide suivi d'un Exercice ;
 * un Exercice du Catalogue (`activity_definitions`).
 */
async function seededVersion15(): Promise<NodeSqliteDatabase> {
  const database = open();
  await migrateDatabase(database, () => T, 15);
  expect(await version(database)).toBe(15);
  await database.runAsync(
    "INSERT INTO labels (id, name, color, is_active, created_at, canonical_key) VALUES ('label-1', 'Matin', '#E5484D', 1, ?, 'matin')",
    [T],
  );
  for (const [id, name] of [
    ["mv-1", "Pompes"],
    ["mv-2", "Squat"],
  ] as const) {
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
       VALUES (?, ?, lower(?), NULL, 'cardio', 1, ?, ?)`,
      [id, name, name, T, T],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, 'dos')", [id]);
  }
  await database.runAsync(
    "INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at) VALUES ('def-1', 'mv-1', ?, ?, ?)",
    [PARAMETERS, T, T],
  );
  const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = 1");
  await database.runAsync(
    `INSERT INTO sessions (id, owner_id, name, label_id, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
     VALUES ('session-1', ?, 'Complète', 'label-1', 'ACTIVE', 10, 5, ?, ?)`,
    [user!.id, T, T],
  );
  await database.runAsync(
    `INSERT INTO sessions (id, owner_id, name, label_id, status, archived_at, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
     VALUES ('session-2', ?, 'Archivée', NULL, 'ARCHIVED', ?, 10, 5, ?, ?)`,
    [user!.id, T, T, T],
  );
  await database.runAsync(
    "INSERT INTO tours (id, session_id, cycle_id, position, repeat_count, side_mode, nature) VALUES ('tour-1', 'session-1', NULL, 2, 3, 'UNILATERAL', 'SERIES')",
  );
  await database.runAsync(
    "INSERT INTO tours (id, session_id, cycle_id, position, repeat_count, side_mode, nature) VALUES ('tour-2', 'session-2', NULL, 0, 2, 'UNILATERAL', 'TOURS')",
  );
  const occurrences: readonly [string, string, string | null, number, string, number | null, number, number][] = [
    ["b1", "session-1", null, 0, "mv-1", null, 0, 0],
    ["b2", "session-1", null, 1, "mv-2", null, 20, 1],
    ["i1", "session-1", "tour-1", 0, "mv-1", 1, 0, 0],
    ["i2", "session-1", "tour-1", 1, "mv-2", null, 0, 1],
    ["a1", "session-1", null, 3, "mv-2", null, 0, 0],
    ["s2-a1", "session-2", null, 1, "mv-1", null, 0, 0],
  ];
  for (const [id, session, tour, position, movement, copy, recovery, present] of occurrences) {
    await database.runAsync(
      `INSERT INTO activities (
         id, session_id, tour_id, type, position, execution_mode, duration_seconds, repetition_count, series_count,
         pause_seconds, post_activity_recovery_seconds, post_activity_recovery_present, created_at, updated_at, side_mode,
         execution_parameters, source_movement_id, copy_number
       ) VALUES (?, ?, ?, 'EXERCISE', ?, 'DURATION', 30, NULL, 2, 10, ?, ?, ?, ?, 'UNILATERAL', ?, ?, ?)`,
      [id, session, tour, position, recovery, present, T, T, PARAMETERS, movement, copy],
    );
  }
  for (const [id, tour, position] of [
    ["stop-b", null, 1],
    ["stop-i", "tour-1", 1],
    ["stop-a", null, 3],
  ] as const) {
    await database.runAsync("INSERT INTO session_stop_points (id, session_id, tour_id, position) VALUES (?, 'session-1', ?, ?)", [id, tour, position]);
  }
  expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  return reopen(database);
}

describe("PRE-9 A.1 — migration 016 (Exercice direct de Cycle, Point dans un Cycle)", () => {
  it("version courante 17 (016 puis 017, PRE-9 C.1)", () => {
    expect(DATABASE_VERSION).toBe(17);
  });

  it("reconstruit activities et session_stop_points sans perte : lignes identiques, cycle_id NULL, aucune autre table touchée", async () => {
    let database = await seededVersion15();
    const before = await snapshot(database);

    await initializeDatabase(database);
    database = reopen(database);

    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM activities WHERE cycle_id IS NOT NULL")).toEqual([{ count: 0 }]);
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM session_stop_points WHERE cycle_id IS NOT NULL")).toEqual([{ count: 0 }]);
    expect(await columns(database, "activities")).toContain("cycle_id");
    expect(await columns(database, "session_stop_points")).toEqual(["id", "session_id", "tour_id", "cycle_id", "position"]);
    expect(await database.getAllAsync("SELECT name FROM sqlite_master WHERE name LIKE 'm016_%'")).toEqual([]);
    expect(
      (await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE '%cycle%unique' ORDER BY name")).map(
        (row) => row.name,
      ),
    ).toEqual(["activities_cycle_position_unique", "session_stop_points_cycle_unique", "tours_cycle_position_unique"]);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);

    // Démarrage suivant : aucune nouvelle conversion.
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
  });

  it("anciennes Séances rouvertes, consultées et réenregistrées à l'identique par le service (chemin structuré)", async () => {
    let database = await seededVersion15();
    await initializeDatabase(database);
    database = reopen(database);
    let sequence = 0;
    const repository = new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => T);
    const service = new SessionService(repository, undefined, () => "unused-container");

    const opened = await service.getSessionForEdit("session-1");
    if (opened.status !== "OK") throw new Error(opened.status);
    const draft = toSessionDraft(opened.session);
    expect(draft.exercises.map((item) => [item.id, item.structuralPosition])).toEqual([
      ["b1", "BEFORE_TOUR"],
      ["b2", "BEFORE_TOUR"],
      ["i1", "IN_TOUR"],
      ["i2", "IN_TOUR"],
      ["a1", "AFTER_TOUR"],
    ]);
    expect(draft.tourRepeatCount).toBe(3);
    expect(draft.circuitNature).toBe("SERIES");
    expect(draft.stopPoints).toEqual([
      { id: "stop-b", scope: "BEFORE_TOUR", position: 1 },
      { id: "stop-i", scope: "IN_TOUR", position: 1 },
      { id: "stop-a", scope: "AFTER_TOUR", position: 0 },
    ]);

    const rowsBefore = await database.getAllAsync(
      "SELECT id, tour_id, cycle_id, position, execution_parameters, source_movement_id, copy_number, created_at FROM activities ORDER BY id",
    );
    const saved = await service.updateSession("session-1", draft);
    expect(saved.status).toBe("UPDATED");
    expect(
      await database.getAllAsync(
        "SELECT id, tour_id, cycle_id, position, execution_parameters, source_movement_id, copy_number, created_at FROM activities ORDER BY id",
      ),
    ).toEqual(rowsBefore);
    expect(await database.getAllAsync("SELECT tour_id, cycle_id, position FROM session_stop_points ORDER BY tour_id IS NOT NULL, position")).toEqual([
      { tour_id: null, cycle_id: null, position: 1 },
      { tour_id: null, cycle_id: null, position: 3 },
      { tour_id: "tour-1", cycle_id: null, position: 1 },
    ]);
    expect(await database.getAllAsync("SELECT id, repeat_count, nature FROM tours WHERE session_id = 'session-1'")).toEqual([
      { id: "tour-1", repeat_count: 3, nature: "SERIES" },
    ]);

    // Séance archivée : consultée en lecture seule, entière.
    const archived = await service.getSessionForConsultation("session-2");
    expect(archived?.structure.elements.map((element) => element.kind)).toEqual(["CIRCUIT", "EXERCISE"]);
  });

  it("une erreur au milieu de la transaction annule tout et laisse la base au schéma 015 ; le démarrage suivant migre", async () => {
    let database = await seededVersion15();
    const before = await snapshot(database);
    const failing = failOnWrite(database, /^INSERT INTO session_stop_points/);
    await expect(migrateDatabase(failing.database, () => T)).rejects.toThrow("Injected failure");
    expect(failing.state.writesBeforeFailure).toBeGreaterThan(0);
    database = reopen(database);
    expect(await version(database)).toBe(15);
    expect(await snapshot(database)).toEqual(before);
    expect(await columns(database, "activities")).not.toContain("cycle_id");
    expect(await database.getAllAsync("SELECT name FROM sqlite_master WHERE name LIKE 'm016_%'")).toEqual([]);

    // Reprise : le démarrage suivant applique la 016.
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
  });

  it("installation neuve : 001 à la version courante, aucun avis", async () => {
    let database = open();
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM migration_notices")).toEqual([{ count: 0 }]);
    expect(await columns(database, "activities")).toContain("cycle_id");
  });
});
