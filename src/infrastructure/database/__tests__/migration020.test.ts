import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { serializeCatalogExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { splitResolvedParameters } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { FORMAT_MODEL_KEYS } from "@/domain/sessions/formatModels";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import { structureCircuits } from "@/domain/sessions/structure";
import type { StructureExerciseInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { MIGRATION_020_MODEL_KEYS } from "@/infrastructure/database/migrations/migration020";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (recette iPhone n° 3 du 03/11/2026, autres constats, décision de Hermann du 03/11) —
 * `migration020` (modèle d'origine d'un Circuit, `tours.origin_model`) sur une COPIE de base FICHIER au
 * schéma 019, peuplée comme une base d'appareil (Séance à Circuit), migrée par le chemin du démarrage
 * et relue par une NOUVELLE connexion : colonne ajoutée, Circuit existant intact et toujours
 * « Circuit » (aucune reprise), CHECK sur les dix clés, atomicité (échec injecté), reprise, installation
 * neuve ; écriture et relecture du modèle d'origine par le dépôt, instantané compris. Aucune copie de
 * la base réelle de l'iPhone sur ce poste. Une suite verte ne vaut pas recette.
 */

const T = "2026-11-03T08:00:00.000Z";
const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre9-r3-origin");
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

const TABLES = ["sessions", "tours", "activities", "movements"];

/** Lignes de chaque table, sans la colonne ajoutée par la 020 (comparaison ligne pour ligne). */
async function snapshot(database: Database): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const table of TABLES) {
    const rows = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} ORDER BY 1`);
    result[table] = rows.map((row) => Object.fromEntries(Object.entries(row).filter(([column]) => column !== "origin_model")));
  }
  return result;
}

async function seedMovements(database: Database): Promise<void> {
  for (const [id, name] of [
    ["mv-squat", "Squat"],
    ["mv-pompes", "Pompes"],
  ] as const) {
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
       VALUES (?, ?, lower(?), NULL, 'cardio', 1, ?, ?)`,
      [id, name, name, T, T],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, 'dos')", [id]);
  }
}

/** Base au schéma 019 : Séance « Jambes » avec un Circuit alterné × 2 de deux Exercices. */
async function seededVersion19(): Promise<NodeSqliteDatabase> {
  const database = open();
  await migrateDatabase(database, () => T, 19);
  expect(await version(database)).toBe(19);
  await seedMovements(database);
  const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = 1");
  await database.runAsync(
    `INSERT INTO sessions (id, owner_id, name, label_id, status, archived_at, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
     VALUES ('session-1', ?, 'Jambes', NULL, 'ACTIVE', NULL, 10, 5, ?, ?)`,
    [user!.id, T, T],
  );
  await database.runAsync(
    "INSERT INTO tours (id, session_id, cycle_id, position, repeat_count, side_mode, nature) VALUES ('tour-1', 'session-1', NULL, 0, 2, 'UNILATERAL', 'SERIES')",
  );
  for (const [id, position, movement] of [
    ["o-1", 0, "mv-squat"],
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
  return reopen(database);
}

const exercise = (id: string, movementId = "mv-squat"): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(20, 8, 10),
  postActivityRecoverySeconds: 0,
  sourceMovementId: movementId,
});

/** Circuit Tabata alterné (modèle d'origine), Circuit porteur AMRAP (modèle d'origine), Circuit de la Composition. */
const tabataInput = (): StructuredSessionInput => ({
  name: "Tabata",
  labelId: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  structure: {
    elements: [
      { kind: "CIRCUIT", circuit: { id: "tabata", repeatCount: 8, nature: "SERIES", originModel: "TABATA", exercises: [exercise("t1"), exercise("t2", "mv-pompes")] } },
      { kind: "CIRCUIT", circuit: { id: "plain", repeatCount: 2, nature: "TOURS", exercises: [exercise("p1")] } },
    ],
    stopPoints: [],
  },
});

describe("PRE-9 recette n° 3 — migration 020 (modèle d'origine d'un Circuit)", () => {
  it("version courante 20 ; clés figées = les dix modèles de la fenêtre Formats", () => {
    expect(DATABASE_VERSION).toBe(21);
    expect([...MIGRATION_020_MODEL_KEYS].sort()).toEqual([...FORMAT_MODEL_KEYS].sort());
  });

  it("ajoute la colonne sans toucher aucune ligne : le Circuit existant reste « Circuit » ; second démarrage sans effet", async () => {
    let database = await seededVersion19();
    const before = await snapshot(database);

    await initializeDatabase(database);
    database = reopen(database);

    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
    expect(await columns(database, "tours")).toContain("origin_model");
    expect(await database.getAllAsync("SELECT id, origin_model FROM tours")).toEqual([{ id: "tour-1", origin_model: null }]);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    const relu = await new SqliteSessionRepository(database).findStructuredById("session-1");
    expect(structureCircuits(relu!.structure)[0]).not.toHaveProperty("originModel");

    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
  });

  it("CHECK : une clé hors des dix modèles est refusée par SQLite", async () => {
    let database = await seededVersion19();
    await initializeDatabase(database);
    database = reopen(database);
    await expect(database.runAsync("UPDATE tours SET origin_model = 'CIRCUIT' WHERE id = 'tour-1'")).rejects.toThrow();
    await database.runAsync("UPDATE tours SET origin_model = 'SUPERSET' WHERE id = 'tour-1'");
    const relu = await new SqliteSessionRepository(database).findStructuredById("session-1");
    expect(structureCircuits(relu!.structure)[0]?.originModel).toBe("SUPERSET");
  });

  it("une erreur après l'ajout de la colonne annule tout et laisse la base au schéma 019 ; le démarrage suivant migre", async () => {
    let database = await seededVersion19();
    const before = await snapshot(database);
    const failing = failOnExec(database, /^PRAGMA user_version = 21/);
    await expect(migrateDatabase(failing.database, () => T)).rejects.toThrow("Injected failure");
    expect(failing.executed.some((source) => source.startsWith("ALTER TABLE tours ADD COLUMN origin_model"))).toBe(true);
    database = reopen(database);
    expect(await version(database)).toBe(19);
    expect(await columns(database, "tours")).not.toContain("origin_model");
    expect(await snapshot(database)).toEqual(before);

    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await columns(database, "tours")).toContain("origin_model");
    expect(await snapshot(database)).toEqual(before);
  });

  it("installation neuve : 001 à 020 ; le dépôt écrit et relit le modèle d'origine, l'instantané le conserve", async () => {
    let database = open();
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    await seedMovements(database);
    let sequence = 0;
    const repository = new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => T);
    const created = await repository.createStructured(tabataInput());
    expect(await database.getAllAsync("SELECT id, origin_model FROM tours ORDER BY id")).toEqual([
      { id: "plain", origin_model: null },
      { id: "tabata", origin_model: "TABATA" },
    ]);
    database = reopen(database);
    const relu = await new SqliteSessionRepository(database).findStructuredById(created.id);
    const circuits = structureCircuits(relu!.structure);
    expect(circuits.map((circuit) => [circuit.id, circuit.originModel ?? null])).toEqual([
      ["tabata", "TABATA"],
      ["plain", null],
    ]);
    expect(structureCircuits(createSessionSnapshot(relu!).structure).map((circuit) => circuit.originModel ?? null)).toEqual(["TABATA", null]);
  });
});
