import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  projectScalars,
  serializeExecutionParameters,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import { uniformParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { computeStructuredSessionDuration, type ActivityDurationFacts } from "@/domain/sessions/calculations";
import type { StructuralPosition } from "@/domain/sessions/Session";
import { toSessionDraft, toUpdateSessionInput } from "@/domain/sessions/SessionDraft";
import type { Database } from "@/infrastructure/database/Database";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { buildVersion10 } from "@/infrastructure/database/testing/buildVersion10";
import { failOnWrite } from "@/infrastructure/database/testing/failOnWrite";
import { withoutMigration011Columns } from "@/infrastructure/database/testing/migration011Columns";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-6 story 1.1 (AC1, AD-34, AD-35, jalon J0) — preuve sur une base v10
 * FICHIER réelle (`node:sqlite`) : construite par les migrations 001 à 010 du
 * code de départ (`buildVersion10`), alimentée par `INSERT` directs (Séances
 * PRE-5 : JSON v3 à phases, charge, côtés, Cibles ; récupérations 0 et 45 ;
 * Point d'arrêt), migrée par le chemin du démarrage (`initializeDatabase`),
 * puis relue par une NOUVELLE connexion après fermeture.
 */

const NOW = "2026-10-20T08:00:00.000Z";
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;

// --- Base fichier ------------------------------------------------------------

let path: string;
const opened: NodeSqliteDatabase[] = [];

function open(): NodeSqliteDatabase {
  const database = NodeSqliteDatabase.openFile(path);
  opened.push(database);
  return database;
}

function close(database: NodeSqliteDatabase): void {
  database.close();
  const index = opened.indexOf(database);
  if (index >= 0) {
    opened.splice(index, 1);
  }
}

function reopen(database: NodeSqliteDatabase): NodeSqliteDatabase {
  close(database);
  return open();
}

const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre6-story11");

beforeEach(() => {
  mkdirSync(WORK_DIRECTORY, { recursive: true });
  path = join(WORK_DIRECTORY, `base-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
});

afterEach(() => {
  try {
    for (const database of [...opened]) {
      try {
        close(database);
      } catch {
        opened.splice(opened.indexOf(database), 1);
      }
    }
  } finally {
    for (const suffix of ["", "-wal", "-shm", "-journal"]) {
      rmSync(`${path}${suffix}`, { force: true });
    }
  }
});

// --- Fixture v10 ---------------------------------------------------------------

/** PRE-5 : phases, charge, côtés et ordre par Série. */
const phased = (): ExecutionParameters =>
  uniformParameters({
    mode: "DURATION",
    count: 3,
    target: 9,
    pauseSeconds: 15,
    sideMode: "LEFT_RIGHT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 5,
    loadKg: 2.5,
    loadEnabled: true,
    workPhases: [
      { id: 1, label: "Descente", durationSeconds: 6 },
      { id: 2, label: "Maintien", durationSeconds: 3 },
    ],
  });

/** PRE-5 : séries variables en Répétitions, Cible à l'échec comprise. */
const variable = (): ExecutionParameters =>
  variableParameters({ mode: "REPETITIONS", rows: [[12, 30, 20], ["FAILURE", 45, 0]], sideMode: "RIGHT_LEFT", loadEnabled: true });

const simple = (): ExecutionParameters => uniformParameters({ mode: "DURATION", count: 2, target: 30, pauseSeconds: 10 });

type Copy = {
  readonly id: string;
  readonly zone: StructuralPosition;
  readonly position: number;
  readonly parameters: ExecutionParameters;
  readonly recovery: number;
};

/** Séance A : Circuit ×3 entouré d'un échauffement et d'un retour au calme ; Séance B : Circuit ×1. */
const SESSIONS: readonly { readonly id: string; readonly repeat: number; readonly copies: readonly Copy[] }[] = [
  {
    id: "a",
    repeat: 3,
    copies: [
      { id: "a-before", zone: "BEFORE_TOUR", position: 0, parameters: simple(), recovery: 0 },
      { id: "a-in-1", zone: "IN_TOUR", position: 0, parameters: phased(), recovery: 45 },
      { id: "a-in-2", zone: "IN_TOUR", position: 1, parameters: variable(), recovery: 0 },
      { id: "a-after", zone: "AFTER_TOUR", position: 0, parameters: simple(), recovery: 20 },
    ],
  },
  {
    id: "b",
    repeat: 1,
    copies: [{ id: "b-in", zone: "IN_TOUR", position: 0, parameters: variable(), recovery: 0 }],
  },
];

async function populateVersion10(database: Database): Promise<void> {
  const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = 1");
  for (const session of SESSIONS) {
    await database.runAsync(
      `INSERT INTO sessions (id, owner_id, name, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
       VALUES (?, ?, ?, 'ACTIVE', 10, 5, '2026-09-01T00:00:00.000Z', '2026-09-02T00:00:00.000Z')`,
      [`session-${session.id}`, user!.id, `Séance ${session.id}`],
    );
    await database.runAsync("INSERT INTO cycles (id, session_id, position, repeat_count) VALUES (?, ?, 1, 1)", [
      `cycle-${session.id}`,
      `session-${session.id}`,
    ]);
    await database.runAsync(
      "INSERT INTO tours (id, cycle_id, session_id, position, repeat_count, side_mode) VALUES (?, ?, ?, 1, ?, 'UNILATERAL')",
      [`tour-${session.id}`, `cycle-${session.id}`, `session-${session.id}`, session.repeat],
    );
    for (const copy of session.copies) {
      const scalars = projectScalars(copy.parameters);
      await database.runAsync(
        `INSERT INTO activities (
           id, session_id, cycle_id, tour_id, type, structural_position, position, name,
           execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
           post_activity_recovery_seconds, instruction, created_at, updated_at, side_mode,
           execution_parameters, category_id
         ) VALUES (?, ?, ?, ?, 'EXERCISE', ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', ?, ?, 'cardio')`,
        [
          copy.id,
          `session-${session.id}`,
          `cycle-${session.id}`,
          copy.zone === "IN_TOUR" ? `tour-${session.id}` : null,
          copy.zone,
          copy.position,
          `Exercice ${copy.id}`,
          scalars.executionMode,
          scalars.durationSeconds,
          scalars.repetitionCount,
          scalars.seriesCount,
          scalars.pauseSeconds,
          copy.recovery,
          scalars.sideMode,
          serializeExecutionParameters(copy.parameters),
        ],
      );
      await database.runAsync("INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, 'cuisses')", [copy.id]);
    }
  }
  await database.runAsync("INSERT INTO session_stop_points (id, session_id, scope, position) VALUES ('stop-a', 'session-a', 'IN_TOUR', 0)");
}

/** Toutes les tables utilisateur, ligne pour ligne (ordre de `rowid`). */
async function dumpTables(database: Database): Promise<Record<string, unknown>> {
  const tables = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  const result: Record<string, unknown> = {};
  for (const { name } of tables) {
    result[name] = await database.getAllAsync(`SELECT * FROM ${name} ORDER BY rowid`);
  }
  return result;
}

async function version(database: Database): Promise<number> {
  return (await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? -1;
}

/** Durée attendue d'une Séance de la fixture, calculée par l'autorité du Domaine sur les valeurs v10. */
function expectedDurationSeconds(sessionId: string): number {
  const session = SESSIONS.find((item) => `session-${item.id}` === sessionId)!;
  const facts = (zone: StructuralPosition): ActivityDurationFacts[] =>
    session.copies
      .filter((copy) => copy.zone === zone)
      .map((copy) => ({ type: "EXERCISE", executionParameters: copy.parameters, postActivityRecoverySeconds: copy.recovery }));
  return computeStructuredSessionDuration({
    beforeTour: facts("BEFORE_TOUR"),
    inTour: facts("IN_TOUR"),
    afterTour: facts("AFTER_TOUR"),
    tourRepeatCount: session.repeat,
  }).seconds;
}

async function seededVersion10(): Promise<NodeSqliteDatabase> {
  const database = open();
  await buildVersion10(database);
  await populateVersion10(database);
  expect(await version(database)).toBe(10);
  return reopen(database);
}

describe("PRE6-1.1 — migration 011 sur une base v10 fichier réelle (node:sqlite)", () => {
  it("AC1 — v10 → v11 : Circuit de Tours partout, 45 présente, 0 absente ; le reste identique ; relu par une nouvelle connexion", async () => {
    let database = await seededVersion10();
    const before = await dumpTables(database);

    await initializeDatabase(database);
    database = reopen(database);

    expect(await version(database)).toBe(11);
    // Toutes les tables, hors les deux colonnes additives, identiques ligne pour ligne :
    // JSON (phases, charges, côtés, Cibles), scalaires, positions, Zones, Point d'arrêt.
    const after = await dumpTables(database);
    expect(Object.keys(after)).toEqual(Object.keys(before));
    for (const table of Object.keys(before)) {
      expect({ table, rows: withoutMigration011Columns(table, after[table]) }).toEqual({ table, rows: before[table] });
    }
    expect(await database.getAllAsync("SELECT id, nature FROM tours ORDER BY id")).toEqual([
      { id: "tour-a", nature: "TOURS" },
      { id: "tour-b", nature: "TOURS" },
    ]);
    expect(
      await database.getAllAsync("SELECT id, post_activity_recovery_seconds AS seconds, post_activity_recovery_present AS present FROM activities ORDER BY id"),
    ).toEqual([
      { id: "a-after", seconds: 20, present: 1 },
      { id: "a-before", seconds: 0, present: 0 },
      { id: "a-in-1", seconds: 45, present: 1 },
      { id: "a-in-2", seconds: 0, present: 0 },
      { id: "b-in", seconds: 0, present: 0 },
    ]);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);

    // Lecture applicative : Circuit de Tours, récupérations à trois états, paramètres PRE-5 intacts.
    const repository = new SqliteSessionRepository(database, ids("ses"));
    const sessionA = await repository.findById("session-a");
    expect(sessionA?.cycle.tour.nature).toBe("TOURS");
    expect(sessionA?.cycle.tour.repeatCount).toBe(3);
    expect(sessionA?.stopPoints).toEqual([{ id: "stop-a", scope: "IN_TOUR", position: 0 }]);
    const all = [...(sessionA?.cycle.beforeTour ?? []), ...(sessionA?.cycle.tour.exercises ?? []), ...(sessionA?.cycle.afterTour ?? [])];
    expect(all.map((activity) => [activity.id, activity.postActivityRecoverySeconds])).toEqual([
      ["a-before", null],
      ["a-in-1", 45],
      ["a-in-2", null],
      ["a-after", 20],
    ]);
    const source = SESSIONS[0]!.copies;
    for (const activity of all) {
      expect({ id: activity.id, parameters: activity.executionParameters }).toEqual({
        id: activity.id,
        parameters: source.find((copy) => copy.id === activity.id)!.parameters,
      });
    }
    // Durées identiques à celles de la v10 (calcul du Domaine sur les valeurs d'origine).
    const summaries = await repository.listActive();
    expect(summaries.map((summary) => [summary.id, summary.estimatedDurationSeconds]).sort()).toEqual(
      [
        ["session-a", expectedDurationSeconds("session-a")],
        ["session-b", expectedDurationSeconds("session-b")],
      ].sort(),
    );
    expect(expectedDurationSeconds("session-a")).toBeGreaterThan(0);
  });

  it("AC3 — rejouée sur une base déjà en v11 (colonnes présentes) : aucune erreur, aucun changement", async () => {
    let database = await seededVersion10();
    await initializeDatabase(database);
    database = reopen(database);
    const migrated = await dumpTables(database);
    const schema = await database.getAllAsync("SELECT type, name, sql FROM sqlite_master ORDER BY type, name");

    // Nouveau démarrage : version courante, aucune étape rejouée.
    await initializeDatabase(database);
    // Rejeu forcé de 011 sur des colonnes déjà présentes (base remise en v10).
    await database.execAsync("PRAGMA user_version = 10");
    await migrateDatabase(database);
    database = reopen(database);

    expect(await version(database)).toBe(11);
    expect(await dumpTables(database)).toEqual(migrated);
    expect(await database.getAllAsync("SELECT type, name, sql FROM sqlite_master ORDER BY type, name")).toEqual(schema);
  });

  it("échec pendant la reprise : annulation complète, user_version = 10, base identique ; la nouvelle tentative réussit", async () => {
    let database = await seededVersion10();
    const before = await dumpTables(database);
    const schemaBefore = await database.getAllAsync("SELECT type, name, sql FROM sqlite_master ORDER BY type, name");

    const failing = failOnWrite(database, /post_activity_recovery_present = 1/);
    await expect(migrateDatabase(failing.database)).rejects.toThrow("Injected failure");
    database = reopen(database);

    expect(await version(database)).toBe(10);
    expect(await dumpTables(database)).toEqual(before);
    expect(await database.getAllAsync("SELECT type, name, sql FROM sqlite_master ORDER BY type, name")).toEqual(schemaBefore);

    await initializeDatabase(database);
    expect(await version(database)).toBe(11);
  });

  it("après migration : une Séance relue s'enregistre sans changement de nature ni de récupération (aller-retour brouillon)", async () => {
    let database = await seededVersion10();
    await initializeDatabase(database);
    database = reopen(database);
    const repository = new SqliteSessionRepository(database, ids("ses"), () => NOW);

    const session = await repository.findById("session-a");
    const input = toUpdateSessionInput(toSessionDraft(session!));
    expect(input.ok).toBe(true);
    if (!input.ok) throw new Error("expected a valid input");
    const outcome = await repository.update("session-a", input.value);
    expect(outcome.status).toBe("UPDATED");
    database = reopen(database);

    expect(await database.getAllAsync("SELECT id, nature FROM tours ORDER BY id")).toEqual([
      { id: "tour-a", nature: "TOURS" },
      { id: "tour-b", nature: "TOURS" },
    ]);
    expect(
      await database.getAllAsync(
        "SELECT id, post_activity_recovery_seconds AS seconds, post_activity_recovery_present AS present FROM activities WHERE session_id = 'session-a' ORDER BY id",
      ),
    ).toEqual([
      { id: "a-after", seconds: 20, present: 1 },
      { id: "a-before", seconds: 0, present: 0 },
      { id: "a-in-1", seconds: 45, present: 1 },
      { id: "a-in-2", seconds: 0, present: 0 },
    ]);
  });
});
