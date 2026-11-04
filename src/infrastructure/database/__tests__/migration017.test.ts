import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { splitResolvedParameters } from "@/domain/activities/Movement";
import { serializeCatalogExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { ELEMENT_FORMAT_KEYS, LEGACY_PRECONFIGURATION_FORMAT_KEYS, SESSION_ORIGINS, STORABLE_FORMAT_KEYS } from "@/domain/sessions/formats";
import { toSessionDraft } from "@/domain/sessions/SessionDraft";
import { SessionService } from "@/features/sessions/SessionService";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { MIGRATION_017_FORMAT_KEYS, MIGRATION_017_SESSION_ORIGINS } from "@/infrastructure/database/migrations/migration017";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (story C.1) — `migration017` sur une COPIE de base FICHIER au schéma 016, peuplée comme une
 * base d'appareil (Séance de l'ancien modèle avec Points d'arrêt, Séance à Cycle et Exercice direct,
 * Séance archivée), migrée par le chemin du démarrage (`initializeDatabase`) et relue par une
 * NOUVELLE connexion : colonnes ajoutées, toutes les lignes existantes inchangées et libres
 * (FMT-40), origine inconnue ; réouverture et réenregistrement par le service sans perte ; échec au
 * milieu de la transaction annulé (base intacte au schéma 016), reprise au démarrage suivant.
 * Aucune copie de la base réelle de l'iPhone n'est disponible sur ce poste : cette base fichier en
 * tient lieu. Une suite verte ne vaut pas recette sur appareil.
 */

const T = "2026-10-29T08:00:00.000Z";
const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre9-c1");
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

/**
 * Échec injecté sur une instruction `execAsync` (la 017 n'ajoute ses colonnes que par `ALTER TABLE`,
 * que `failOnWrite`, limité à `runAsync`, n'intercepte pas) ; compte les ajouts déjà exécutés.
 */
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
  "sessions",
  "cycles",
  "tours",
  "activities",
  "session_stop_points",
  "movements",
  // [A.3 du 04/11/2026 : les anciennes définitions sont vidées par la 021 (`migration021.test.ts`) ; retirées de la comparaison.]
  "migration_notices",
];

/** Colonnes ajoutées par la 017, retirées pour comparer les lignes d'avant ligne pour ligne. */
// [Recette iPhone n° 2 du 31/10/2026 : `phases_to_verify` (migration 019) ajoutée au démarrage, ignorée ici.]
const ADDED = new Set(["format_key", "format_settings", "origin", "phases_to_verify", "origin_model"]);

async function snapshot(database: Database): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const table of TABLES) {
    const rows = await database.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} ORDER BY 1`);
    result[table] = rows.map((row) => Object.fromEntries(Object.entries(row).filter(([column]) => !(table === "tours" && column === "name") && !ADDED.has(column))));
  }
  return result;
}

/**
 * Base au schéma 016 : Séance « Complète » [b1, Circuit (i1, i2) × 3 Séries, a1] avec deux Points ;
 * Séance « Cycle » [Cycle × 2 (Exercice direct d1, Circuit (c1))] ; Séance archivée.
 */
async function seededVersion16(): Promise<NodeSqliteDatabase> {
  const database = open();
  await migrateDatabase(database, () => T, 16);
  expect(await version(database)).toBe(16);
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
  for (const [id, name, label, status] of [
    ["session-1", "Complète", "label-1", "ACTIVE"],
    ["session-2", "Cycle", null, "ACTIVE"],
    ["session-3", "Archivée", null, "ARCHIVED"],
  ] as const) {
    await database.runAsync(
      `INSERT INTO sessions (id, owner_id, name, label_id, status, archived_at, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 10, 5, ?, ?)`,
      [id, user!.id, name, label, status, status === "ARCHIVED" ? T : null, T, T],
    );
  }
  await database.runAsync("INSERT INTO cycles (id, session_id, position, repeat_count) VALUES ('cycle-1', 'session-2', 0, 2)");
  for (const [id, session, cycle, position, repeat, nature] of [
    ["tour-1", "session-1", null, 1, 3, "SERIES"],
    ["tour-2", "session-2", "cycle-1", 1, 1, "TOURS"],
    ["tour-3", "session-3", null, 0, 2, "TOURS"],
  ] as const) {
    await database.runAsync(
      "INSERT INTO tours (id, session_id, cycle_id, position, repeat_count, side_mode, nature) VALUES (?, ?, ?, ?, ?, 'UNILATERAL', ?)",
      [id, session, cycle, position, repeat, nature],
    );
  }
  const occurrences: readonly [string, string, string | null, string | null, number, string][] = [
    ["b1", "session-1", null, null, 0, "mv-1"],
    ["i1", "session-1", "tour-1", null, 0, "mv-1"],
    ["i2", "session-1", "tour-1", null, 1, "mv-2"],
    ["a1", "session-1", null, null, 2, "mv-2"],
    ["d1", "session-2", null, "cycle-1", 0, "mv-1"],
    ["c1", "session-2", "tour-2", null, 0, "mv-2"],
    ["s3", "session-3", "tour-3", null, 0, "mv-1"],
  ];
  for (const [id, session, tour, cycle, position, movement] of occurrences) {
    await database.runAsync(
      `INSERT INTO activities (
         id, session_id, tour_id, cycle_id, type, position, execution_mode, duration_seconds, repetition_count, series_count,
         pause_seconds, post_activity_recovery_seconds, post_activity_recovery_present, created_at, updated_at, side_mode,
         execution_parameters, source_movement_id, copy_number
       ) VALUES (?, ?, ?, ?, 'EXERCISE', ?, 'DURATION', 30, NULL, 2, 10, 0, 0, ?, ?, 'UNILATERAL', ?, ?, NULL)`,
      [id, session, tour, cycle, position, T, T, PARAMETERS, movement],
    );
  }
  for (const [id, tour, position] of [
    ["stop-b", null, 1],
    ["stop-i", "tour-1", 1],
  ] as const) {
    await database.runAsync("INSERT INTO session_stop_points (id, session_id, tour_id, position) VALUES (?, 'session-1', ?, ?)", [id, tour, position]);
  }
  expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  return reopen(database);
}

describe("PRE-9 C.1 — migration 017 (Format porté par l'élément, origine de création)", () => {
  it("version courante 19 (017 à 019, A.2b et recette n° 2 constat e) ; listes figées de la 017 égales aux clés stockables et aux origines du registre du domaine (réalignement du 02/11/2026)", () => {
    expect(DATABASE_VERSION).toBe(22);
    expect([...MIGRATION_017_FORMAT_KEYS]).toEqual([...STORABLE_FORMAT_KEYS]);
    // Clés stockables = quatre Formats spécialisés + clés Tabata et 30/30 écrites avant le 02/11 (relues libres).
    expect([...STORABLE_FORMAT_KEYS].sort()).toEqual([...ELEMENT_FORMAT_KEYS, ...LEGACY_PRECONFIGURATION_FORMAT_KEYS].sort());
    expect([...MIGRATION_017_SESSION_ORIGINS]).toEqual([...SESSION_ORIGINS]);
  });

  it("ajoute les colonnes sans toucher aucune ligne : toute Séance existante reste libre et sans origine (FMT-40)", async () => {
    let database = await seededVersion16();
    const before = await snapshot(database);

    await initializeDatabase(database);
    database = reopen(database);

    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
    expect(await columns(database, "tours")).toEqual(expect.arrayContaining(["format_key", "format_settings"]));
    expect(await columns(database, "activities")).toEqual(expect.arrayContaining(["format_key", "format_settings"]));
    expect(await columns(database, "sessions")).toContain("origin");
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM tours WHERE format_key IS NOT NULL OR format_settings IS NOT NULL")).toEqual([{ count: 0 }]);
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM activities WHERE format_key IS NOT NULL OR format_settings IS NOT NULL")).toEqual([
      { count: 0 },
    ]);
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM sessions WHERE origin IS NOT NULL")).toEqual([{ count: 0 }]);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);

    // Démarrage suivant : rien n'est rejoué.
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
  });

  it("anciennes Séances rouvertes, consultées et réenregistrées à l'identique par le service", async () => {
    let database = await seededVersion16();
    await initializeDatabase(database);
    database = reopen(database);
    let sequence = 0;
    const repository = new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => T);
    const service = new SessionService(repository, undefined, () => "unused-container");

    for (const sessionId of ["session-1", "session-2"]) {
      const before = (await repository.findStructuredById(sessionId))!;
      expect(before).not.toHaveProperty("origin");
      const opened = await service.getSessionForEdit(sessionId);
      if (opened.status !== "OK") throw new Error(opened.status);
      expect((await service.updateSession(sessionId, toSessionDraft(opened.session))).status).toBe("UPDATED");
      const after = (await repository.findStructuredById(sessionId))!.structure;
      expect(after.elements).toEqual(before.structure.elements);
      // Les Points d'arrêt n'exposent pas d'identité : remplacés à l'enregistrement, à leur emplacement.
      const location = ({ id: _id, ...rest }: { readonly id: string }) => rest;
      expect(after.stopPoints.map(location)).toEqual(before.structure.stopPoints.map(location));
    }
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM activities WHERE format_key IS NOT NULL")).toEqual([{ count: 0 }]);
    expect((await service.getSessionForConsultation("session-3"))?.structure.elements.map((element) => element.kind)).toEqual(["CIRCUIT"]);
  });

  it("une erreur au milieu de la transaction annule tout et laisse la base au schéma 016 ; le démarrage suivant migre", async () => {
    let database = await seededVersion16();
    const before = await snapshot(database);
    const failing = failOnExec(database, /^ALTER TABLE sessions ADD COLUMN origin/);
    await expect(migrateDatabase(failing.database, () => T)).rejects.toThrow("Injected failure");
    // Les quatre colonnes de `tours` et `activities` étaient déjà ajoutées dans la transaction.
    expect(failing.executed.filter((source) => source.startsWith("ALTER TABLE"))).toHaveLength(4);
    database = reopen(database);
    expect(await version(database)).toBe(16);
    expect(await snapshot(database)).toEqual(before);
    expect(await columns(database, "tours")).not.toContain("format_key");
    expect(await columns(database, "activities")).not.toContain("format_key");

    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await snapshot(database)).toEqual(before);
  });

  it("installation neuve : 001 à 018, aucun avis", async () => {
    let database = open();
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM migration_notices")).toEqual([{ count: 0 }]);
    expect(await columns(database, "sessions")).toContain("origin");
  });
});
