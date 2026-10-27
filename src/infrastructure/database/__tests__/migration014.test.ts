import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { serializeCatalogExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { splitResolvedParameters } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { failOnWrite } from "@/infrastructure/database/testing/failOnWrite";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-8 (story A.3, D-449 §4) — `migration014` sur une COPIE de base FICHIER au schéma 013
 * (`node:sqlite`) : chaîne 001 à 013 du code (`targetVersion` 13), base peuplée par `INSERT`
 * directs au schéma 013 (Étiquette, Mouvements à phases, Exercices du Catalogue, Séances aux
 * trois zones, Points d'arrêt aux trois portées, rangs d'origine non contigus) ; migrée par le
 * chemin du démarrage (`initializeDatabase`), puis relue par une NOUVELLE connexion. Aucune
 * réinitialisation n'est autorisée : toutes les lignes sont conservées. Une suite verte ne vaut
 * pas recette sur appareil.
 */

const T = "2026-10-26T08:00:00.000Z";
const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre8-a3");
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

async function count(database: Database, table: string): Promise<number> {
  return (await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`))?.count ?? -1;
}

async function columns(database: Database, table: string): Promise<string[]> {
  return (await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map((row) => row.name);
}

/** Tables que la 014 ne touche pas : comparées ligne pour ligne. */
async function untouched(database: Database): Promise<Record<string, unknown>> {
  const tables = [
    "users",
    "profiles",
    "categories",
    "body_zones",
    "labels",
    "sessions",
    "movements",
    "movement_phases",
    "movement_body_zones",
    "activity_definitions",
    "migration_notices",
  ];
  const snapshot: Record<string, unknown> = {};
  for (const table of tables) {
    // PRE-8 (B.8) : la 015, jouée ensuite au démarrage, ajoute `movements.archived_at` (NULL) ; elle
    // est éprouvée par `migration015.test.ts`. La comparaison de la 014 porte sur les colonnes d'avant.
    const rows = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} ORDER BY 1`);
    snapshot[table] = table === "movements" ? rows.map(({ archived_at: _archivedAt, ...rest }) => rest) : rows;
  }
  return snapshot;
}

const PARAMETERS = serializeCatalogExecutionParameters(splitResolvedParameters(durationParameters(30, 2, 10)).parameters);

/** Données au schéma 013 : une Séance aux trois zones, une Séance à Circuit vide, un Exercice du Catalogue. */
async function populateVersion13(database: Database): Promise<void> {
  await database.runAsync(
    `INSERT INTO labels (id, name, color, is_active, created_at, canonical_key)
     VALUES ('label-1', 'Matin', '#E5484D', 1, ?, 'matin')`,
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
  for (const [id, name] of [
    ["session-1", "Complète"],
    ["session-2", "Circuit vide"],
  ] as const) {
    await database.runAsync(
      `INSERT INTO sessions (id, owner_id, name, label_id, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
       VALUES (?, ?, ?, 'label-1', 'ACTIVE', 10, 5, ?, ?)`,
      [id, user!.id, name, T, T],
    );
    await database.runAsync("INSERT INTO cycles (id, session_id, position, repeat_count) VALUES (?, ?, 1, 1)", [`cycle-${id}`, id]);
  }
  await database.runAsync(
    "INSERT INTO tours (id, cycle_id, session_id, position, repeat_count, side_mode, nature) VALUES ('tour-1', 'cycle-session-1', 'session-1', 1, 3, 'UNILATERAL', 'SERIES')",
  );
  await database.runAsync(
    "INSERT INTO tours (id, cycle_id, session_id, position, repeat_count, side_mode, nature) VALUES ('tour-2', 'cycle-session-2', 'session-2', 1, 2, 'UNILATERAL', 'TOURS')",
  );
  // Rangs d'origine non contigus avant le Circuit (0 puis 5) : recompactés dans leur ordre.
  const occurrences: readonly [string, string, string | null, string, number, string, number | null, number, number][] = [
    ["b1", "session-1", null, "BEFORE_TOUR", 0, "mv-1", null, 0, 0],
    ["b2", "session-1", null, "BEFORE_TOUR", 5, "mv-2", null, 20, 1],
    ["i1", "session-1", "tour-1", "IN_TOUR", 0, "mv-1", 1, 0, 0],
    ["i2", "session-1", "tour-1", "IN_TOUR", 1, "mv-2", null, 0, 1],
    ["a1", "session-1", null, "AFTER_TOUR", 0, "mv-2", null, 0, 0],
    ["s2-a1", "session-2", null, "AFTER_TOUR", 0, "mv-1", null, 0, 0],
  ];
  for (const [id, session, tour, zone, position, movement, copy, recovery, present] of occurrences) {
    await database.runAsync(
      `INSERT INTO activities (
         id, session_id, cycle_id, tour_id, type, structural_position, position, execution_mode,
         duration_seconds, repetition_count, series_count, pause_seconds, post_activity_recovery_seconds,
         post_activity_recovery_present, created_at, updated_at, side_mode, execution_parameters,
         source_movement_id, copy_number
       ) VALUES (?, ?, ?, ?, 'EXERCISE', ?, ?, 'DURATION', 30, NULL, 2, 10, ?, ?, ?, ?, 'UNILATERAL', ?, ?, ?)`,
      [id, session, `cycle-${session}`, tour, zone, position, recovery, present, T, T, PARAMETERS, movement, copy],
    );
  }
  for (const [id, scope, position] of [
    ["stop-b", "BEFORE_TOUR", 1],
    ["stop-i", "IN_TOUR", 2],
    ["stop-a", "AFTER_TOUR", 1],
  ] as const) {
    await database.runAsync("INSERT INTO session_stop_points (id, session_id, scope, position) VALUES (?, 'session-1', ?, ?)", [
      id,
      scope,
      position,
    ]);
  }
}

async function seededVersion13(): Promise<NodeSqliteDatabase> {
  const database = open();
  await migrateDatabase(database, () => T, 13);
  expect(await version(database)).toBe(13);
  await populateVersion13(database);
  expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  return reopen(database);
}

describe("migration014 — structure générale de Séance, conversion sans perte (A.3, D-449 §4)", () => {
  it("version courante 15 (014 puis 015, PRE-8 B.8)", () => {
    expect(DATABASE_VERSION).toBe(15);
  });

  it("convertit chaque Séance en [avant…, Circuit, après…] sans supprimer aucune ligne", async () => {
    let database = await seededVersion13();
    const before = await untouched(database);
    const activitiesBefore = await database.getAllAsync<Record<string, unknown>>(
      `SELECT id, session_id, type, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
              post_activity_recovery_seconds, post_activity_recovery_present, created_at, updated_at, side_mode,
              execution_parameters, source_movement_id, copy_number
       FROM activities ORDER BY id`,
    );

    await initializeDatabase(database);
    database = reopen(database);

    // Chemin du démarrage : 014 puis 015 (colonne additive `movements.archived_at`).
    expect(await version(database)).toBe(DATABASE_VERSION);
    // Aucune autre table modifiée, aucun avis de réinitialisation.
    expect(await untouched(database)).toEqual(before);
    // Contenu des Exercices recopié à l'identique.
    expect(
      await database.getAllAsync(
        `SELECT id, session_id, type, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
                post_activity_recovery_seconds, post_activity_recovery_present, created_at, updated_at, side_mode,
                execution_parameters, source_movement_id, copy_number
         FROM activities ORDER BY id`,
      ),
    ).toEqual(activitiesBefore);

    // Le Cycle technique n'est pas un Cycle utilisateur.
    expect(await count(database, "cycles")).toBe(0);
    expect(await database.getAllAsync("SELECT id, session_id, cycle_id, position, repeat_count, nature FROM tours ORDER BY id")).toEqual([
      { id: "tour-1", session_id: "session-1", cycle_id: null, position: 2, repeat_count: 3, nature: "SERIES" },
      { id: "tour-2", session_id: "session-2", cycle_id: null, position: 0, repeat_count: 2, nature: "TOURS" },
    ]);
    expect(await database.getAllAsync("SELECT id, tour_id, position FROM activities ORDER BY session_id, tour_id IS NOT NULL, position")).toEqual([
      { id: "b1", tour_id: null, position: 0 },
      { id: "b2", tour_id: null, position: 1 },
      { id: "a1", tour_id: null, position: 3 },
      { id: "i1", tour_id: "tour-1", position: 0 },
      { id: "i2", tour_id: "tour-1", position: 1 },
      { id: "s2-a1", tour_id: null, position: 1 },
    ]);
    expect(await database.getAllAsync("SELECT id, tour_id, position FROM session_stop_points ORDER BY id")).toEqual([
      { id: "stop-a", tour_id: null, position: 4 },
      { id: "stop-b", tour_id: null, position: 1 },
      { id: "stop-i", tour_id: "tour-1", position: 2 },
    ]);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    for (const removed of ["cycle_id", "structural_position"]) {
      expect(await columns(database, "activities")).not.toContain(removed);
    }

    // Relue par le repository : projection identique à l'ancien modèle, identités conservées.
    const session = (await new SqliteSessionRepository(database).findById("session-1"))!;
    expect(session.cycle.beforeTour?.map((activity) => [activity.id, activity.structuralPosition, activity.position])).toEqual([
      ["b1", "BEFORE_TOUR", 0],
      ["b2", "BEFORE_TOUR", 1],
    ]);
    expect(session.cycle.tour).toMatchObject({ id: "tour-1", repeatCount: 3, nature: "SERIES" });
    expect(session.cycle.tour.exercises.map((activity) => [activity.id, activity.copyNumber])).toEqual([
      ["i1", 1],
      ["i2", null],
    ]);
    expect(session.cycle.afterTour?.map((activity) => [activity.id, activity.structuralPosition, activity.position])).toEqual([
      ["a1", "AFTER_TOUR", 0],
    ]);
    expect(session.cycle.beforeTour?.[1]?.postActivityRecoverySeconds).toBe(20);
    expect(session.stopPoints).toEqual([
      { id: "stop-b", scope: "BEFORE_TOUR", position: 1 },
      { id: "stop-i", scope: "IN_TOUR", position: 2 },
      { id: "stop-a", scope: "AFTER_TOUR", position: 1 },
    ]);
    const empty = (await new SqliteSessionRepository(database).findById("session-2"))!;
    expect(empty.cycle.tour).toMatchObject({ id: "tour-2", repeatCount: 2, exercises: [] });
    expect(empty.cycle.afterTour?.map((activity) => activity.id)).toEqual(["s2-a1"]);

    // Démarrage suivant : aucune nouvelle conversion.
    const after = await database.getAllAsync("SELECT id, tour_id, position FROM activities ORDER BY id");
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await database.getAllAsync("SELECT id, tour_id, position FROM activities ORDER BY id")).toEqual(after);
  });

  it("une erreur annule tout et laisse la base au schéma 013, données intactes", async () => {
    let database = await seededVersion13();
    const before = await untouched(database);
    const failing = failOnWrite(database, /^INSERT INTO activities/);
    await expect(migrateDatabase(failing.database, () => T)).rejects.toThrow("Injected failure");
    expect(failing.state.writesBeforeFailure).toBeGreaterThan(0);
    database = reopen(database);
    expect(await version(database)).toBe(13);
    expect(await untouched(database)).toEqual(before);
    expect(await count(database, "activities")).toBe(6);
    expect(await count(database, "cycles")).toBe(2);
    expect(await columns(database, "activities")).toContain("structural_position");
    expect(await database.getAllAsync("SELECT name FROM sqlite_master WHERE name LIKE 'm014_%'")).toEqual([]);
  });

  it("installation neuve : 001 à 014, schéma général, aucun avis", async () => {
    let database = open();
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await count(database, "migration_notices")).toBe(0);
    expect(await columns(database, "tours")).toEqual(["id", "session_id", "cycle_id", "position", "repeat_count", "side_mode", "nature"]);
    expect(await columns(database, "cycles")).toEqual(["id", "session_id", "position", "repeat_count"]);
    expect(await columns(database, "session_stop_points")).toEqual(["id", "session_id", "tour_id", "position"]);
    expect(await database.getAllAsync("SELECT name FROM sqlite_master WHERE name LIKE 'm014_%'")).toEqual([]);
  });
});
