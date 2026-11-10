import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { serializeCatalogExecutionParameters, WORK_PATTERN_DURATION_BOUNDS } from "@/domain/activities/ExecutionParameters";
import { splitResolvedParameters } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { MIGRATION_018_PHASE_DURATION_BOUNDS } from "@/infrastructure/database/migrations/migration018";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (story A.2b) — `migration018` sur une COPIE de base FICHIER au schéma 017, peuplée comme
 * une base d'appareil (Mouvements avec et sans phases, Exercice du Catalogue, Séance et ses
 * occurrences), migrée par le chemin du démarrage (`initializeDatabase`) et relue par une NOUVELLE
 * connexion. Décision de Hermann du 31/10/2026 : « Colonne ajoutée, existant intact (durées vides),
 * preuves de conservation, d'échec et de reprise ». Aucune copie de la base réelle de l'iPhone n'est
 * disponible sur ce poste : cette base fichier en tient lieu. Une suite verte ne vaut pas recette.
 */

const T = "2026-10-31T08:00:00.000Z";
const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre9-a2b");
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

/** Échec injecté sur une instruction `execAsync` correspondant à `pattern` ; compte les instructions déjà exécutées. */
function failOnExec(inner: Database, pattern: RegExp): { readonly database: Database; readonly executed: string[] } {
  const executed: string[] = [];
  const wrap = (handle: Database): Database => ({
    execAsync: async (source) => {
      if (pattern.test(source)) {
        throw new Error("Injected failure");
      }
      executed.push(source);
      return handle.execAsync(source);
    },
    runAsync: (source, parameters) => handle.runAsync(source, parameters),
    getFirstAsync: (source, parameters) => handle.getFirstAsync(source, parameters),
    getAllAsync: (source, parameters) => handle.getAllAsync(source, parameters),
    withExclusiveTransactionAsync: (task) => handle.withExclusiveTransactionAsync(async (transaction) => task(wrap(transaction))),
  });
  return { database: wrap(inner), executed };
}

const PARAMETERS = serializeCatalogExecutionParameters(splitResolvedParameters(durationParameters(30, 2, 10)).parameters);

const TABLES = [
  "users",
  "profiles",
  "categories",
  "body_zones",
  "labels",
  "movements",
  "movement_phases",
  "movement_aliases",
  "movement_body_zones",
  // [A.3 du 04/11/2026 : les anciennes définitions sont vidées par la 021 (`migration021.test.ts`) ; retirées de la comparaison.]
  "sessions",
  "tours",
  "activities",
  "migration_notices",
];

/** Colonne ajoutée par la 018, retirée pour comparer les lignes d'avant ligne pour ligne. */
const ADDED = new Set(["duration_seconds"]);

async function snapshot(database: Database): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const table of TABLES) {
    const rows = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} ORDER BY 1, 2`);
    result[table] = rows.map((row) =>
      // [Recette iPhone n° 2 du 31/10/2026 : `phases_to_verify` (019) ajoutée au démarrage, ignorée ici.]
      Object.fromEntries(
        Object.entries(row).filter(([column]) => !(table === "tours" && column === "name") && !(table === "movement_phases" && ADDED.has(column)) && column !== "phases_to_verify" && column !== "origin_model"),
      ),
    );
  }
  return result;
}

/**
 * Base au schéma 017 : Mouvement « Squat » à trois phases (alias, Zone), « Pompes » sans phase ;
 * un Exercice du Catalogue sur Squat ; une Séance avec un Circuit et deux occurrences.
 */
async function seededVersion17(): Promise<NodeSqliteDatabase> {
  const database = open();
  await migrateDatabase(database, () => T, 17);
  expect(await version(database)).toBe(17);
  for (const [id, name, next] of [
    ["mv-squat", "Squat", 4],
    ["mv-pompes", "Pompes", 1],
  ] as const) {
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
       VALUES (?, ?, lower(?), NULL, 'renforcement', ?, ?, ?)`,
      [id, name, name, next, T, T],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, 'cuisses')", [id]);
  }
  await database.runAsync(
    "INSERT INTO movement_phases (movement_id, phase_id, position, label) VALUES ('mv-squat', 1, 0, 'Descente'), ('mv-squat', 3, 1, 'Pause'), ('mv-squat', 2, 2, 'Montée')",
  );
  await database.runAsync(
    "INSERT INTO movement_aliases (movement_id, position, alias, normalized_alias) VALUES ('mv-squat', 0, 'Flexion', 'flexion')",
  );
  await database.runAsync(
    "INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at) VALUES ('def-1', 'mv-pompes', ?, ?, ?)",
    [PARAMETERS, T, T],
  );
  const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = 1");
  await database.runAsync(
    `INSERT INTO sessions (id, owner_id, name, label_id, status, archived_at, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
     VALUES ('session-1', ?, 'Jambes', NULL, 'ACTIVE', NULL, 10, 5, ?, ?)`,
    [user!.id, T, T],
  );
  await database.runAsync(
    "INSERT INTO tours (id, session_id, cycle_id, position, repeat_count, side_mode, nature) VALUES ('tour-1', 'session-1', NULL, 0, 2, 'UNILATERAL', 'TOURS')",
  );
  for (const [id, position, movement] of [
    ["o-1", 0, "mv-pompes"],
    ["o-2", 1, "mv-pompes"],
  ] as const) {
    await database.runAsync(
      `INSERT INTO activities (
         id, session_id, tour_id, cycle_id, type, position, execution_mode, duration_seconds, repetition_count, series_count,
         pause_seconds, post_activity_recovery_seconds, post_activity_recovery_present, created_at, updated_at, side_mode,
         execution_parameters, source_movement_id, copy_number
       ) VALUES (?, 'session-1', 'tour-1', NULL, 'EXERCISE', ?, 'DURATION', 30, NULL, 2, 10, 0, 0, ?, ?, 'UNILATERAL', ?, ?, NULL)`,
      [id, position, T, T, PARAMETERS, movement],
    );
  }
  expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  return reopen(database);
}

describe("PRE-9 A.2b — migration 018 (durée facultative d'une phase du Mouvement)", () => {
  it("version courante 19 (018 puis 019) ; bornes figées de la 018 égales à celles des phases (1..3535 s)", () => {
    expect(DATABASE_VERSION).toBe(25);
    expect(MIGRATION_018_PHASE_DURATION_BOUNDS).toEqual(WORK_PATTERN_DURATION_BOUNDS);
  });

  it("ajoute la colonne sans toucher aucune ligne : toute phase existante reste sans durée ; second démarrage sans effet", async () => {
    let database = await seededVersion17();
    const before = await snapshot(database);

    await initializeDatabase(database);
    database = reopen(database);

    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
    expect(await columns(database, "movement_phases")).toEqual(["movement_id", "phase_id", "position", "label", "duration_seconds"]);
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM movement_phases WHERE duration_seconds IS NOT NULL")).toEqual([{ count: 0 }]);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);

    // Relu par le dépôt : structure et identités inchangées, aucune durée.
    const squat = await new SqliteMovementRepository(database).findById("mv-squat");
    expect(squat?.phases).toStrictEqual([
      { id: 1, label: "Descente" },
      { id: 3, label: "Pause" },
      { id: 2, label: "Montée" },
    ]);
    expect(squat?.nextPhaseId).toBe(4);
    // La Séance existante se relit à l'identique.
    expect((await new SqliteSessionRepository(database).findStructuredById("session-1"))?.structure.elements).toHaveLength(1);

    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
  });

  it("CHECK : NULL et 1..3535 admis ; 0, 3536 et négatif refusés", async () => {
    let database = await seededVersion17();
    await initializeDatabase(database);
    database = reopen(database);
    for (const accepted of [null, 1, 3535]) {
      await database.runAsync("UPDATE movement_phases SET duration_seconds = ? WHERE movement_id = 'mv-squat' AND phase_id = 1", [accepted]);
    }
    for (const refused of [0, 3536, -5]) {
      await expect(
        database.runAsync("UPDATE movement_phases SET duration_seconds = ? WHERE movement_id = 'mv-squat' AND phase_id = 1", [refused]),
      ).rejects.toThrow(/CHECK/i);
    }
  });

  it("une erreur après l'ajout de la colonne annule tout et laisse la base au schéma 017 ; le démarrage suivant migre", async () => {
    let database = await seededVersion17();
    const before = await snapshot(database);
    const failing = failOnExec(database, new RegExp(`^PRAGMA user_version = ${DATABASE_VERSION}`));
    await expect(migrateDatabase(failing.database, () => T)).rejects.toThrow("Injected failure");
    // L'ajout de la colonne avait bien été exécuté dans la transaction.
    expect(failing.executed.some((source) => source.startsWith("ALTER TABLE movement_phases ADD COLUMN duration_seconds"))).toBe(true);
    database = reopen(database);
    expect(await version(database)).toBe(17);
    expect(await columns(database, "movement_phases")).not.toContain("duration_seconds");
    expect(await snapshot(database)).toEqual(before);

    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await columns(database, "movement_phases")).toContain("duration_seconds");
    expect(await snapshot(database)).toEqual(before);
  });

  it("installation neuve : 001 à 019, aucun avis", async () => {
    let database = open();
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM migration_notices")).toEqual([{ count: 0 }]);
    expect(await columns(database, "movement_phases")).toContain("duration_seconds");
  });
});
