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
import { MIGRATION_019_TABLES } from "@/infrastructure/database/migrations/migration019";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (recette iPhone n° 2 du 31/10/2026, constat e) — `migration019` sur une COPIE de base
 * FICHIER au schéma 018, peuplée comme une base d'appareil (Mouvement à durées par défaut, Exercice
 * du Catalogue, Séance et ses occurrences), migrée par le chemin du démarrage (`initializeDatabase`)
 * et relue par une NOUVELLE connexion : colonnes ajoutées, existant intact (aucune marque), preuves
 * de conservation, d'atomicité (échec injecté), de reprise et d'installation neuve, comme pour la
 * 018. Aucune copie de la base réelle de l'iPhone sur ce poste. Une suite verte ne vaut pas recette.
 */

const T = "2026-10-31T08:00:00.000Z";
const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre9-r2e");
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

/** Lignes de chaque table, sans la colonne ajoutée par la 019 (comparaison ligne pour ligne). */
async function snapshot(database: Database): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const table of TABLES) {
    const rows = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} ORDER BY 1, 2`);
    result[table] = rows.map((row) => Object.fromEntries(Object.entries(row).filter(([column]) => !(table === "tours" && column === "name") && !(table === "sessions" && column.startsWith("guidance_")) /* migration028 (fin de PRE-10) */ && column !== "phases_to_verify" && column !== "origin_model")));
  }
  return result;
}

/** Base au schéma 018 : « Squat » (Descente 3 s, Montée sans durée), « Pompes » ; un Exercice du Catalogue ; une Séance. */
async function seededVersion18(): Promise<NodeSqliteDatabase> {
  const database = open();
  await migrateDatabase(database, () => T, 18);
  expect(await version(database)).toBe(18);
  for (const [id, name, next] of [
    ["mv-squat", "Squat", 3],
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
    "INSERT INTO movement_phases (movement_id, phase_id, position, label, duration_seconds) VALUES ('mv-squat', 1, 0, 'Descente', 3), ('mv-squat', 2, 1, 'Montée', NULL)",
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
  for (const [id, position] of [
    ["o-1", 0],
    ["o-2", 1],
  ] as const) {
    await database.runAsync(
      `INSERT INTO activities (
         id, session_id, tour_id, cycle_id, type, position, execution_mode, duration_seconds, repetition_count, series_count,
         pause_seconds, post_activity_recovery_seconds, post_activity_recovery_present, created_at, updated_at, side_mode,
         execution_parameters, source_movement_id, copy_number
       ) VALUES (?, 'session-1', 'tour-1', NULL, 'EXERCISE', ?, 'DURATION', 30, NULL, 2, 10, 0, 0, ?, ?, 'UNILATERAL', ?, 'mv-pompes', NULL)`,
      [id, position, T, T, PARAMETERS],
    );
  }
  expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  return reopen(database);
}

describe("PRE-9 recette n° 2, constat e — migration 019 (marque « Paramètre à vérifier »)", () => {
  it("version courante 19 ; tables de la 019 : occurrences de Séance et Exercices du Catalogue", () => {
    expect(DATABASE_VERSION).toBe(28);
    expect(MIGRATION_019_TABLES).toEqual(["activities", "activity_definitions"]);
  });

  it("ajoute les colonnes sans toucher aucune ligne : aucun Exercice « à vérifier » ; second démarrage sans effet", async () => {
    let database = await seededVersion18();
    const before = await snapshot(database);

    await initializeDatabase(database);
    database = reopen(database);

    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
    for (const table of MIGRATION_019_TABLES) {
      expect(await columns(database, table)).toContain("phases_to_verify");
      expect(await database.getAllAsync(`SELECT COUNT(*) AS count FROM ${table} WHERE phases_to_verify IS NOT NULL`)).toEqual([{ count: 0 }]);
    }
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);

    // Relu par les dépôts : durées par défaut du Mouvement intactes, aucune marque.
    expect((await new SqliteMovementRepository(database).findById("mv-squat"))?.phases).toStrictEqual([
      { id: 1, label: "Descente", durationSeconds: 3 },
      { id: 2, label: "Montée" },
    ]);
    // [A.3 du 04/11/2026 : l'Exercice du Catalogue def-1 est supprimé par la migration 021.]
    expect(await database.getAllAsync("SELECT id FROM activity_definitions")).toEqual([]);
    expect((await new SqliteSessionRepository(database).findStructuredById("session-1"))?.structure.elements).toHaveLength(1);

    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
  });

  it("une erreur après l'ajout des colonnes annule tout et laisse la base au schéma 018 ; le démarrage suivant migre", async () => {
    let database = await seededVersion18();
    const before = await snapshot(database);
    const failing = failOnExec(database, new RegExp(`^PRAGMA user_version = ${DATABASE_VERSION}`));
    await expect(migrateDatabase(failing.database, () => T)).rejects.toThrow("Injected failure");
    // Les deux ajouts avaient bien été exécutés dans la transaction.
    expect(failing.executed.some((source) => source.startsWith("ALTER TABLE activities ADD COLUMN phases_to_verify"))).toBe(true);
    expect(failing.executed.some((source) => source.startsWith("ALTER TABLE activity_definitions ADD COLUMN phases_to_verify"))).toBe(true);
    database = reopen(database);
    expect(await version(database)).toBe(18);
    for (const table of MIGRATION_019_TABLES) {
      expect(await columns(database, table)).not.toContain("phases_to_verify");
    }
    expect(await snapshot(database)).toEqual(before);

    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    for (const table of MIGRATION_019_TABLES) {
      expect(await columns(database, table)).toContain("phases_to_verify");
    }
    expect(await snapshot(database)).toEqual(before);
  });

  it("installation neuve : 001 à 019, aucun avis", async () => {
    let database = open();
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM migration_notices")).toEqual([{ count: 0 }]);
    for (const table of MIGRATION_019_TABLES) {
      expect(await columns(database, table)).toContain("phases_to_verify");
    }
  });
});
