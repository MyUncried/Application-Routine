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
import { applyMigration021 } from "@/infrastructure/database/migrations/migration021";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (story A.3, décision de Hermann du 04/11/2026 : « Hermann abandonne la conversion sans perte
 * prévue par A.4 : les anciens exercices concernés par cette conversion peuvent être supprimés plutôt
 * que migrés. ») — `migration021` sur une COPIE de base FICHIER au schéma 020, peuplée comme une base
 * d'appareil (Mouvements, anciennes définitions du Catalogue, Séance et ses Exercices, avis), migrée
 * par le chemin du démarrage et relue par une NOUVELLE connexion : définitions supprimées, table
 * conservée (A.5, sa suppression, reste non autorisée), tout le reste intact ; atomicité (échec
 * injecté), reprise, idempotence, installation neuve, violation préexistante tolérée. Aucune copie de
 * la base réelle de l'iPhone sur ce poste. Une suite verte ne vaut pas recette.
 */

const T = "2026-11-04T08:00:00.000Z";
const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre9-a3-021");
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

async function definitionCount(database: Database): Promise<number> {
  return (await database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM activity_definitions"))?.count ?? -1;
}

/** Échec injecté sur une instruction `execAsync` correspondant à `pattern` ; journal des instructions exécutées (`execAsync` et `runAsync`). */
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
    runAsync: (source, parameters) => {
      executed.push(source);
      return handle.runAsync(source, parameters);
    },
    getFirstAsync: (source, parameters) => handle.getFirstAsync(source, parameters),
    getAllAsync: (source, parameters) => handle.getAllAsync(source, parameters),
    withExclusiveTransactionAsync: (task) => handle.withExclusiveTransactionAsync(async (transaction) => task(wrap(transaction))),
  });
  return { database: wrap(inner), executed };
}

const PARAMETERS = serializeCatalogExecutionParameters(splitResolvedParameters(durationParameters(30, 2, 10)).parameters);

/** Tables conservées par la 021, comparées ligne pour ligne. */
const KEPT = [
  "users",
  "profiles",
  "categories",
  "body_zones",
  "labels",
  "movements",
  "movement_phases",
  "movement_aliases",
  "movement_body_zones",
  "movement_media",
  "media_assets",
  "sessions",
  "cycles",
  "tours",
  "activities",
  "session_stop_points",
  "migration_notices",
];

async function kept(database: Database): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const table of KEPT) {
    const rows = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} ORDER BY 1, 2`);
    // Reprise Formats du 04/11/2026 : `tours.name` (migration 022) ignorée de la comparaison.
    result[table] = rows.map((row) => Object.fromEntries(Object.entries(row).filter(([column]) => !(table === "tours" && column === "name"))));
  }
  return result;
}

/**
 * Base au schéma 020 : « Squat » (média), « Pompes » ; deux anciennes définitions (dont une « à
 * vérifier ») ; Séance « Jambes » à Circuit de deux Exercices ; un avis de migration acquitté.
 */
async function seededVersion20(): Promise<NodeSqliteDatabase> {
  const database = open();
  await migrateDatabase(database, () => T, 20);
  expect(await version(database)).toBe(20);
  for (const [id, name] of [
    ["mv-squat", "Squat"],
    ["mv-pompes", "Pompes"],
  ] as const) {
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
       VALUES (?, ?, lower(?), NULL, 'cardio', 1, ?, ?)`,
      [id, name, name, T, T],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, 'cuisses')", [id]);
  }
  await database.runAsync("INSERT INTO media_assets (id, uri, created_at) VALUES ('asset-1', 'kodjo-media/a1.jpg', ?)", [T]);
  await database.runAsync("INSERT INTO movement_media (id, movement_id, asset_id, position) VALUES ('mm-1', 'mv-squat', 'asset-1', 0)");
  await database.runAsync(
    "INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at, phases_to_verify) VALUES ('def-1', 'mv-squat', ?, ?, ?, NULL), ('def-2', 'mv-pompes', ?, ?, ?, '[1]')",
    [PARAMETERS, T, T, PARAMETERS, T, T],
  );
  const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = 1");
  await database.runAsync(
    `INSERT INTO sessions (id, owner_id, name, label_id, status, archived_at, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
     VALUES ('session-1', ?, 'Jambes', NULL, 'ACTIVE', NULL, 10, 5, ?, ?)`,
    [user!.id, T, T],
  );
  await database.runAsync(
    "INSERT INTO tours (id, session_id, cycle_id, position, repeat_count, side_mode, nature, origin_model) VALUES ('tour-1', 'session-1', NULL, 0, 2, 'UNILATERAL', 'SERIES', 'TABATA')",
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
  await database.runAsync(
    "INSERT INTO migration_notices (kind, count, created_at, acknowledged_at) VALUES ('EXERCISES_AND_SESSIONS_RESET', 3, ?, ?)",
    [T, T],
  );
  expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  expect(await definitionCount(database)).toBe(2);
  return reopen(database);
}

describe("PRE-9 A.3 — migration 021 (suppression des anciennes définitions du Catalogue)", () => {
  it("version courante 21", () => {
    expect(DATABASE_VERSION).toBe(23);
  });

  it("supprime toutes les définitions ; table et colonnes conservées ; Mouvements, médias, Séances, Exercices, avis intacts ; aucun avis ajouté", async () => {
    let database = await seededVersion20();
    const before = await kept(database);
    const definitionColumns = await columns(database, "activity_definitions");

    await initializeDatabase(database);
    database = reopen(database);

    expect(await version(database)).toBe(23);
    expect(await definitionCount(database)).toBe(0);
    // A.5 non autorisée : la table et ses colonnes restent.
    expect(await columns(database, "activity_definitions")).toEqual(definitionColumns);
    expect(await kept(database)).toEqual(before);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("idempotente : un second démarrage ne change rien ; la fonction rejouée sur une table vide ne lève pas", async () => {
    let database = await seededVersion20();
    await initializeDatabase(database);
    database = reopen(database);
    const after = await kept(database);

    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(23);
    expect(await kept(database)).toEqual(after);

    await database.withExclusiveTransactionAsync((transaction) => applyMigration021(transaction));
    expect(await definitionCount(database)).toBe(0);
    expect(await kept(database)).toEqual(after);
  });

  it("une erreur après la suppression annule tout : définitions conservées, base au schéma 020 ; le démarrage suivant migre", async () => {
    let database = await seededVersion20();
    const before = await kept(database);
    const failing = failOnExec(database, /^PRAGMA user_version = 23/);
    await expect(migrateDatabase(failing.database, () => T)).rejects.toThrow("Injected failure");
    expect(failing.executed).toContain("DELETE FROM activity_definitions");
    database = reopen(database);
    expect(await version(database)).toBe(20);
    expect(await definitionCount(database)).toBe(2);
    expect(await kept(database)).toEqual(before);

    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(23);
    expect(await definitionCount(database)).toBe(0);
    expect(await kept(database)).toEqual(before);
  });

  it("violation de clé étrangère préexistante ailleurs : tolérée et laissée intacte (patron de la 016, incident du 29/10)", async () => {
    let database = await seededVersion20();
    await database.execAsync("PRAGMA foreign_keys = OFF");
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-disparu', 'dos')");
    await database.execAsync("PRAGMA foreign_keys = ON");
    const violationsBefore = await database.getAllAsync("PRAGMA foreign_key_check");
    expect(violationsBefore).toHaveLength(1);

    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(23);
    expect(await definitionCount(database)).toBe(0);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual(violationsBefore);
  });

  it("installation neuve : 001 à 021, table des définitions présente et vide, aucun avis", async () => {
    let database = open();
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(23);
    expect(await columns(database, "activity_definitions")).toEqual(
      expect.arrayContaining(["id", "movement_id", "execution_parameters", "created_at", "updated_at", "phases_to_verify"]),
    );
    expect(await definitionCount(database)).toBe(0);
    expect(await database.getAllAsync("SELECT * FROM migration_notices")).toEqual([]);
  });
});
