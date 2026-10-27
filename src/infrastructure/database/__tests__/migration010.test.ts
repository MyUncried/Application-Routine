import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  ExecutionParametersValidationError,
  projectScalars,
  readExecutionParameters,
  readV2,
  serializeV2,
  validateForSave,
  type ExecutionParameters,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import { readV1, type LegacyExecutionScalars } from "@/domain/activities/readV1";
import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import { SessionValidationError } from "@/domain/sessions/errors";
import type { Database } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMigrationNoticeRepository } from "@/infrastructure/database/repositories/SqliteMigrationNoticeRepository";
import {
  SqliteSessionRepository,
  assertActivityRow,
} from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { buildVersion9 as buildSharedVersion9 } from "@/infrastructure/database/testing/buildVersion9";
import { withoutMigration011Columns, withoutMigration011TableInfo } from "@/infrastructure/database/testing/migration011Columns";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import type { ActivityRow } from "@/infrastructure/database/types/DatabaseRows";

/**
 * PRE-4 (story 1.1) — `migration010` sur SQLite RÉELLE (`node:sqlite`, AD-10).
 *
 * Base v9 construite par les migrations 001 à 009 du code de départ, telles
 * quelles, puis alimentée en données anciennes par des `INSERT` directs.
 * Aucune simulation de la persistance. Test de migration et de parité : il
 * nomme l'ancien troisième mode et importe `readV1` (garde de cantonnement,
 * AC4).
 */

const NOW = "2026-10-16T12:00:00.000Z";
const clock = () => NOW;

let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;

beforeEach(() => {
  database = NodeSqliteDatabase.openInMemory();
});

afterEach(() => {
  database.close();
});

/** Base v9 : 001..009 du code de départ, rejouées dans une transaction comme le runner (constructeur partagé). */
async function buildVersion9(target: Database = database): Promise<void> {
  await buildSharedVersion9(target);
}

type Scalars = {
  readonly mode?: string;
  readonly duration?: number | null;
  readonly repetitions?: number | null;
  readonly series?: number | null;
  readonly pause?: number;
};

/** JSON v1 de PRE-3 (forme du sérialiseur v1), surchargé champ par champ. */
function v1(overrides: Record<string, unknown> = {}, series: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: 1,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: 30, pauseSeconds: 10, ...series },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    ...overrides,
  });
}

async function insertDefinition(
  id: string,
  options: Scalars & {
    readonly json?: string | null;
    readonly name?: string;
    readonly description?: string | null;
    readonly category?: string;
    readonly sideMode?: string;
    readonly sideRecovery?: number;
  } = {},
): Promise<void> {
  await database.runAsync(
    `INSERT INTO activity_definitions (
       id, name, description, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
       side_mode, created_at, updated_at, category_id, side_recovery_seconds, execution_parameters
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-01-02T00:00:00.000Z', '2026-01-03T00:00:00.000Z', ?, ?, ?)`,
    [
      id,
      options.name ?? `Définition ${id}`,
      options.description ?? null,
      options.mode ?? "DURATION",
      options.duration === undefined ? 30 : options.duration,
      options.repetitions ?? null,
      options.series === undefined ? 3 : options.series,
      options.pause ?? 10,
      options.sideMode ?? "UNILATERAL",
      options.category ?? "cardio",
      options.sideRecovery ?? 0,
      options.json ?? null,
    ],
  );
}

async function insertSession(suffix: string): Promise<void> {
  await database.runAsync(
    `INSERT INTO sessions (id, owner_id, name, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
     SELECT ?, id, ?, 'ACTIVE', 10, 5, '2026-01-04T00:00:00.000Z', '2026-01-05T00:00:00.000Z' FROM users WHERE singleton_key = 1`,
    [`session-${suffix}`, `Séance ${suffix}`],
  );
  await database.runAsync("INSERT INTO cycles (id, session_id, position, repeat_count) VALUES (?, ?, 1, 1)", [
    `cycle-${suffix}`,
    `session-${suffix}`,
  ]);
  await database.runAsync(
    "INSERT INTO tours (id, cycle_id, session_id, position, repeat_count) VALUES (?, ?, ?, 1, 2)",
    [`tour-${suffix}`, `cycle-${suffix}`, `session-${suffix}`],
  );
}

async function insertCopy(
  id: string,
  session: string,
  options: Scalars & {
    readonly json?: string | null;
    readonly zone?: "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR";
    readonly position?: number;
    readonly recovery?: number;
    readonly category?: string | null;
    readonly sideMode?: string;
  } = {},
): Promise<void> {
  const zone = options.zone ?? "IN_TOUR";
  await database.runAsync(
    `INSERT INTO activities (
       id, session_id, cycle_id, tour_id, type, structural_position, position, name, execution_mode,
       duration_seconds, repetition_count, series_count, pause_seconds, post_activity_recovery_seconds,
       instruction, created_at, updated_at, side_mode, execution_parameters, category_id
     ) VALUES (?, ?, ?, ?, 'EXERCISE', ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, '2026-01-06T00:00:00.000Z', '2026-01-07T00:00:00.000Z', ?, ?, ?)`,
    [
      id,
      `session-${session}`,
      `cycle-${session}`,
      zone === "IN_TOUR" ? `tour-${session}` : null,
      zone,
      options.position ?? 0,
      `Copie ${id}`,
      options.mode ?? "DURATION",
      options.duration === undefined ? 30 : options.duration,
      options.repetitions ?? null,
      options.series === undefined ? 3 : options.series,
      options.pause ?? 10,
      options.recovery ?? 0,
      options.sideMode ?? "UNILATERAL",
      options.json ?? null,
      options.category === undefined ? null : options.category,
    ],
  );
}

async function insertAsset(id: string): Promise<void> {
  await database.runAsync("INSERT INTO media_assets (id, uri, created_at) VALUES (?, ?, '2026-01-01T00:00:00.000Z')", [
    id,
    `file:///media/${id}.jpg`,
  ]);
}

const ALL_TABLES = [
  "users",
  "categories",
  "body_zones",
  "labels",
  "profiles",
  "media_assets",
  "activity_definitions",
  "activity_definition_body_zones",
  "activity_media",
  "sessions",
  "cycles",
  "tours",
  "activities",
  "activity_body_zones",
  "session_activity_media",
  "session_stop_points",
];

/** État complet relu : toutes les tables (ordre de `rowid`), schéma et version. */
async function snapshot(target: Database = database): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const table of ALL_TABLES) {
    result[table] = await target.getAllAsync(`SELECT * FROM ${table} ORDER BY rowid`);
  }
  result.schema = await target.getAllAsync("SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY type, name");
  result.version = await target.getFirstAsync("PRAGMA user_version");
  return result;
}

async function version(): Promise<number> {
  return (await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? -1;
}

async function notices(): Promise<readonly Record<string, unknown>[]> {
  return database.getAllAsync("SELECT * FROM migration_notices ORDER BY id");
}

async function definitionJson(id: string): Promise<string | null | undefined> {
  return (await database.getFirstAsync<{ execution_parameters: string | null }>(
    "SELECT execution_parameters FROM activity_definitions WHERE id = ?",
    [id],
  ))?.execution_parameters;
}

async function copyJson(id: string): Promise<string | null | undefined> {
  return (await database.getFirstAsync<{ execution_parameters: string | null }>(
    "SELECT execution_parameters FROM activities WHERE id = ?",
    [id],
  ))?.execution_parameters;
}

async function exists(table: "activity_definitions" | "activities", id: string): Promise<boolean> {
  return ((await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table} WHERE id = ?`, [id]))?.count ?? 0) === 1;
}

/** Parité v2 (AD-10) : `readV2(sortie 010)` = `readV1(entrée)` et `serializeV2(readV2(sortie))` = sortie. */
function expectParity(output: string | null | undefined, input: string | LegacyExecutionScalars): ExecutionParameters {
  expect(typeof output).toBe("string");
  const parsed = readV2(output);
  expect(parsed).toEqual(readV1(input));
  expect(serializeV2(parsed)).toBe(output);
  return parsed;
}

describe("PRE4-1.1/AC9 — prédicat d'illisibilité fermé, un test par cas", () => {
  type Case = {
    readonly label: string;
    readonly definition?: Parameters<typeof insertDefinition>[1];
    readonly copy?: Parameters<typeof insertCopy>[2];
  };
  const json = (value: string) => ({ json: value });
  const cases: readonly Case[] = [
    { label: "(a) texte non analysable", definition: json("{not json"), copy: json("{not json") },
    { label: "(b) JSON de version 2", definition: json(v1({ version: 2 })), copy: json(v1({ version: 2 })) },
    { label: "(b) JSON de version 7", definition: json(v1({ version: 7 })), copy: json(v1({ version: 7 })) },
    { label: "(c1) racine tableau", definition: json("[]"), copy: json("[]") },
    { label: "(c1) racine nombre", definition: json("3"), copy: json("3") },
    {
      label: "(c2) clé requise absente",
      definition: json(JSON.stringify({ ...JSON.parse(v1()), sideOrder: undefined })),
      copy: json(JSON.stringify({ ...JSON.parse(v1()), cadenceBeepIntervalSeconds: undefined })),
    },
    { label: "(c3) chaîne à la place d'un nombre", definition: json(v1({ endSeconds: "0" })), copy: json(v1({}, { pauseSeconds: "10" })) },
    { label: "(c3) booléen à la place d'un nombre", definition: json(v1({ countdownSeconds: false })), copy: json(v1({}, { target: true })) },
    { label: "(c3) objet à la place d'un nombre", definition: json(v1({}, { target: { value: 30 } })), copy: json(v1({ sideRecoverySeconds: {} })) },
    { label: "(c3) tableau à la place d'un nombre", definition: json(v1({}, { count: [3] })), copy: json(v1({ cadenceBeepIntervalSeconds: [2] })) },
    { label: "(c4) Mode inconnu", definition: json(v1({ mode: "SPRINT" })), copy: json(v1({ mode: "EMOM" })) },
    { label: "(c5) sideMode inconnu", definition: json(v1({ sideMode: "BOTH" })), copy: json(v1({ sideMode: "NONE" })) },
    { label: "(c5) sideOrder inconnu", definition: json(v1({ sideOrder: "RANDOM" })), copy: json(v1({ sideOrder: "MIXED" })) },
    { label: "(c6) series.kind inconnu", definition: json(v1({}, { kind: "MIXED" })), copy: json(v1({}, { kind: "PYRAMID" })) },
    { label: "(c7) count < 1", definition: json(v1({}, { count: 0 })), copy: json(v1({}, { count: -1 })) },
    { label: "(c8) rows absent", definition: json(v1({}, { kind: "VARIABLE", rows: undefined })), copy: json(v1({}, { kind: "VARIABLE", rows: undefined })) },
    { label: "(c8) rows vide", definition: json(v1({}, { kind: "VARIABLE", rows: [] })), copy: json(v1({}, { kind: "VARIABLE", rows: [] })) },
    { label: "(c8) rows non tableau", definition: json(v1({}, { kind: "VARIABLE", rows: "x" })), copy: json(v1({}, { kind: "VARIABLE", rows: {} })) },
    { label: "(c9) count JSON v1 à 2,5", definition: json(v1({}, { count: 2.5 })), copy: json(v1({}, { count: 2.5 })) },
    { label: "(c9) series_count à 2,5 sans JSON", definition: { series: 2.5 }, copy: { series: 2.5 } },
    { label: "(c11) Cible −3", definition: json(v1({}, { target: -3 })), copy: json(v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 0 }, { target: -3, pauseSeconds: 0 }] })) },
    { label: "(c11) Cible 7,5", definition: json(v1({}, { target: 7.5 })), copy: json(v1({}, { target: 7.5 })) },
    { label: "(c11) Pause −5 ligne 1", definition: json(v1({}, { pauseSeconds: -5 })), copy: json(v1({}, { pauseSeconds: -5 })) },
    { label: "(c11) Pause 2,5 ligne 1", definition: json(v1({}, { pauseSeconds: 2.5 })), copy: json(v1({}, { pauseSeconds: 2.5 })) },
    {
      label: "(c11) Pause −5 ligne 2",
      definition: json(v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 10 }, { target: 30, pauseSeconds: -5 }] })),
      copy: json(v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 10 }, { target: 30, pauseSeconds: -5 }] })),
    },
    {
      label: "(c11) Pause 2,5 ligne 2",
      definition: json(v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 10 }, { target: 30, pauseSeconds: 2.5 }] })),
      copy: json(v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 10 }, { target: 30, pauseSeconds: 2.5 }] })),
    },
    { label: "(c11) Pause au changement de côté −5", definition: json(v1({ sideRecoverySeconds: -5 })), copy: json(v1({ sideRecoverySeconds: -5 })) },
    { label: "(c11) Pause au changement de côté 2,5", definition: json(v1({ sideRecoverySeconds: 2.5 })), copy: json(v1({ sideRecoverySeconds: 2.5 })) },
    { label: "(c11) Bip −1", definition: json(v1({ cadenceBeepIntervalSeconds: -1 })), copy: json(v1({ cadenceBeepIntervalSeconds: -1 })) },
    { label: "(c11) Bip 2,5", definition: json(v1({ cadenceBeepIntervalSeconds: 2.5 })), copy: json(v1({ cadenceBeepIntervalSeconds: 2.5 })) },
    { label: "(c11) Compte à rebours −3", definition: json(v1({ countdownSeconds: -3 })), copy: json(v1({ countdownSeconds: -3 })) },
    { label: "(c11) Fin 1,5", definition: json(v1({ endSeconds: 1.5 })), copy: json(v1({ endSeconds: 1.5 })) },
    // Sans JSON : le CHECK de 004 interdit déjà les négatifs dans \`activities\` ;
    // la Copie porte alors la forme non entière, toujours admise par ce CHECK.
    { label: "(c11) pause_seconds −5 sans JSON", definition: { pause: -5 }, copy: { pause: 2.5 } },
    { label: "(c11) side_recovery_seconds 2,5 sans JSON", definition: { sideRecovery: 2.5 } },
    { label: "(c11) cible scalaire −3 sans JSON", definition: { mode: "REPETITIONS", duration: null, repetitions: -3 }, copy: { duration: 7.5 } },
    // Le CHECK de 004 (`series_count >= 1`, cible inactive NULL) rend ces formes impossibles dans `activities`.
    { label: "(c11) series_count −2 sans JSON", definition: { series: -2 } },
    { label: "(c11) colonne de cible inactive négative sans JSON", definition: { mode: "DURATION", duration: 30, repetitions: -4 } },
    { label: "(c11) colonne de cible non entière d'un ancien mode à l'échec sans JSON", definition: { mode: "TO_FAILURE", duration: 2.5, repetitions: null } },
  ];

  it.each(cases.map((item) => [item.label, item] as const))("%s : écarté et dénombré, sans erreur structurelle", async (_label, item) => {
    await buildVersion9();
    await insertSession("a");
    await insertDefinition("def-readable");
    await insertCopy("copy-readable", "a", { position: 0 });
    let expected = 0;
    if (item.definition) {
      await insertDefinition("def-unreadable", item.definition);
      expected += 1;
    }
    if (item.copy) {
      await insertCopy("copy-unreadable", "a", { ...item.copy, position: 1 });
      expected += 1;
    }

    await migrateDatabase(database, clock, 11);

    expect(await version()).toBe(11);
    expect(await exists("activity_definitions", "def-unreadable")).toBe(false);
    expect(await exists("activities", "copy-unreadable")).toBe(false);
    expect(await exists("activity_definitions", "def-readable")).toBe(true);
    expect(await exists("activities", "copy-readable")).toBe(true);
    expect(await notices()).toEqual([
      { id: 1, kind: "UNREADABLE_EXERCISES_DROPPED", count: expected, created_at: NOW, acknowledged_at: null },
    ]);
  });

  it("(c10) Copie seulement : Cible Durée de première ligne à 6 000 s → écartée ; la Définition au même JSON est conservée", async () => {
    const sameJson = v1({}, { target: 6000 });
    await buildVersion9();
    await insertSession("a");
    await insertDefinition("def-6000", { json: sameJson });
    await insertCopy("copy-6000", "a", { json: sameJson });

    await migrateDatabase(database, clock, 11);

    expect(await exists("activities", "copy-6000")).toBe(false);
    expect(await exists("activity_definitions", "def-6000")).toBe(true);
    expectParity(await definitionJson("def-6000"), sameJson);
    expect(await notices()).toEqual([expect.objectContaining({ count: 1 })]);
  });

  it("(c10) Copie seulement : Pause de première ligne à 6 000 s → écartée ; la Définition au même JSON est conservée", async () => {
    const sameJson = v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 6000 }, { target: 30, pauseSeconds: 10 }] });
    await buildVersion9();
    await insertSession("a");
    await insertDefinition("def-pause", { json: sameJson });
    await insertCopy("copy-pause", "a", { json: sameJson });

    await migrateDatabase(database, clock, 11);

    expect(await exists("activities", "copy-pause")).toBe(false);
    expect(await exists("activity_definitions", "def-pause")).toBe(true);
    expect(await notices()).toEqual([expect.objectContaining({ count: 1 })]);
  });

  it("une ligne à JSON est classée sur son JSON seul : ses scalaires sont ignorés", async () => {
    await buildVersion9();
    await insertDefinition("def-json", { json: v1({}, { target: 45 }), pause: -5, series: 2.5 });

    await migrateDatabase(database, clock, 11);

    expect(await exists("activity_definitions", "def-json")).toBe(true);
    expect(await notices()).toEqual([]);
  });
});

describe("PRE4-1.1/AC10 — conversion de l'ancien mode À l'échec", () => {
  it("Répétitions, toutes Cibles FAILURE, tout le reste identique ; plus aucune ligne TO_FAILURE", async () => {
    const uniformJson = v1(
      { mode: "TO_FAILURE", sideMode: "RIGHT_LEFT", sideOrder: "BY_SERIES", sideRecoverySeconds: 5, cadenceBeepIntervalSeconds: 2, countdownSeconds: 3, endSeconds: 4 },
      { count: 3, target: null, pauseSeconds: 10 },
    );
    const variableJson = v1({ mode: "TO_FAILURE" }, { kind: "VARIABLE", rows: [{ target: null, pauseSeconds: 10 }, { target: null, pauseSeconds: 20 }] });
    await buildVersion9();
    await insertAsset("asset-1");
    await insertAsset("asset-2");
    await insertDefinition("def-failure", {
      json: uniformJson,
      mode: "TO_FAILURE",
      duration: null,
      name: "Tractions",
      description: "Prise large",
      category: "renforcement",
      sideMode: "RIGHT_LEFT",
      sideRecovery: 5,
    });
    await database.runAsync(
      "INSERT INTO activity_definition_body_zones (activity_definition_id, body_zone_id) VALUES ('def-failure', 'dos'), ('def-failure', 'bras')",
    );
    await database.runAsync(
      "INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES ('m1', 'def-failure', 'asset-2', 0), ('m2', 'def-failure', 'asset-1', 1)",
    );
    await insertDefinition("def-failure-scalars", { mode: "TO_FAILURE", duration: null, series: 3, pause: 15 });
    await insertSession("a");
    await insertCopy("copy-failure", "a", { json: variableJson, mode: "TO_FAILURE", duration: null, series: 2, category: "renforcement" });
    await database.runAsync("INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES ('copy-failure', 'dos')");
    await database.runAsync(
      "INSERT INTO session_activity_media (id, activity_id, asset_id, position) VALUES ('sm1', 'copy-failure', 'asset-1', 0), ('sm2', 'copy-failure', 'asset-2', 1)",
    );
    const before = await snapshot();

    await migrateDatabase(database, clock, 11);

    expect(expectParity(await definitionJson("def-failure"), uniformJson)).toEqual(
      allFailureParameters(3, 10, {
        sideMode: "RIGHT_LEFT",
        sideOrder: "BY_SERIES",
        sideRecoverySeconds: 5,
        cadenceBeepIntervalSeconds: 2,
        countdownSeconds: 3,
        endSeconds: 4,
      }),
    );
    expect(expectParity(await copyJson("copy-failure"), variableJson)).toEqual(
      variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 10], ["FAILURE", 20]] }),
    );
    expect(
      expectParity(await definitionJson("def-failure-scalars"), {
        executionMode: "TO_FAILURE",
        durationSeconds: null,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 15,
        sideMode: "UNILATERAL",
        sideRecoverySeconds: 0,
      }),
    ).toEqual(allFailureParameters(3, 15, { sideOrder: "BY_SIDE" }));

    const after = await snapshot();
    // Nom, description, Catégorie, Zones, Médias ordonnés et dates inchangés.
    for (const table of ["activity_definition_body_zones", "activity_media", "activity_body_zones", "session_activity_media", "media_assets", "categories"]) {
      expect(after[table]).toEqual(before[table]);
    }
    const definition = await database.getFirstAsync<Record<string, unknown>>(
      "SELECT name, description, category_id, side_mode, side_recovery_seconds, created_at, updated_at FROM activity_definitions WHERE id = 'def-failure'",
    );
    expect(definition).toEqual({
      name: "Tractions",
      description: "Prise large",
      category_id: "renforcement",
      side_mode: "RIGHT_LEFT",
      side_recovery_seconds: 5,
      created_at: "2026-01-02T00:00:00.000Z",
      updated_at: "2026-01-03T00:00:00.000Z",
    });
    const legacyRows = await database.getFirstAsync<{ count: number }>(
      `SELECT (SELECT COUNT(*) FROM activity_definitions WHERE execution_mode = 'TO_FAILURE')
            + (SELECT COUNT(*) FROM activities WHERE execution_mode = 'TO_FAILURE') AS count`,
    );
    expect(legacyRows?.count).toBe(0);
    expect(await notices()).toEqual([]);
  });
});

describe("PRE4-1.1/AC11 — données lisibles mais invalides conservées, jamais converties en échec", () => {
  it("sans nombre, 0 ou null → UNSET ; 7, 3 et 5999 s et Bip 11 recopiés tels quels", async () => {
    const zeroSecondRow = v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 10 }, { target: 0, pauseSeconds: 10 }] });
    const nullSecondRow = v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 10 }, { target: null, pauseSeconds: 10 }] });
    const beep11 = v1({ mode: "REPETITIONS", cadenceBeepIntervalSeconds: 11 }, { target: 12 });
    const copyZero = v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 10 }, { target: 0, pauseSeconds: 10 }] });
    await buildVersion9();
    await insertDefinition("reps-no-number", { mode: "REPETITIONS", duration: null, repetitions: null });
    await insertDefinition("duration-no-value", { mode: "DURATION", duration: null });
    await insertDefinition("v1-zero", { json: zeroSecondRow });
    await insertDefinition("v1-null", { json: nullSecondRow });
    await insertDefinition("d7", { duration: 7 });
    await insertDefinition("d3", { duration: 3 });
    await insertDefinition("d5999", { duration: 5999 });
    await insertDefinition("beep11", { json: beep11 });
    await insertSession("a");
    await insertCopy("copy-zero", "a", { json: copyZero });

    await migrateDatabase(database, clock, 11);

    const scalars = (mode: LegacyExecutionScalars["executionMode"], duration: number | null, repetitions: number | null) => ({
      executionMode: mode,
      durationSeconds: duration,
      repetitionCount: repetitions,
      seriesCount: 3,
      pauseSeconds: 10,
      sideMode: "UNILATERAL" as const,
      sideRecoverySeconds: 0,
    });
    expect(expectParity(await definitionJson("reps-no-number"), scalars("REPETITIONS", null, null))).toEqual(
      repetitionParameters("UNSET", 3, 10),
    );
    expect(expectParity(await definitionJson("duration-no-value"), scalars("DURATION", null, null))).toEqual(
      durationParameters("UNSET", 3, 10),
    );
    expect(expectParity(await definitionJson("v1-zero"), zeroSecondRow)).toEqual(variableParameters({ rows: [[30, 10], ["UNSET", 10]] }));
    expect(expectParity(await definitionJson("v1-null"), nullSecondRow)).toEqual(variableParameters({ rows: [[30, 10], ["UNSET", 10]] }));
    expect(expectParity(await definitionJson("d7"), scalars("DURATION", 7, null))).toEqual(durationParameters(7, 3, 10));
    expect(expectParity(await definitionJson("d3"), scalars("DURATION", 3, null))).toEqual(durationParameters(3, 3, 10));
    expect(expectParity(await definitionJson("d5999"), scalars("DURATION", 5999, null))).toEqual(durationParameters(5999, 3, 10));
    expect(expectParity(await definitionJson("beep11"), beep11)).toEqual(
      repetitionParameters(12, 3, 10, { cadenceBeepIntervalSeconds: 11 }),
    );
    expect(expectParity(await copyJson("copy-zero"), copyZero)).toEqual(variableParameters({ rows: [[30, 10], ["UNSET", 10]] }));
    // Aucune Cible FAILURE inventée, aucun 0 écrit à la place d'une absence.
    const all = await database.getAllAsync<{ execution_parameters: string }>(
      "SELECT execution_parameters FROM activity_definitions UNION ALL SELECT execution_parameters FROM activities",
    );
    expect(all.some((row) => row.execution_parameters.includes("FAILURE"))).toBe(false);
    expect(all.some((row) => row.execution_parameters.includes('"value":0'))).toBe(false);
    const noValue = await database.getFirstAsync<Record<string, unknown>>(
      "SELECT execution_mode, duration_seconds, repetition_count FROM activity_definitions WHERE id = 'reps-no-number'",
    );
    expect(noValue).toEqual({ execution_mode: "REPETITIONS", duration_seconds: null, repetition_count: null });
    expect(await notices()).toEqual([]);
  });
});

/** Base de l'AC12 : écarts au milieu d'une zone, Séance vidée, Circuit vidé, Médias partagés. */
async function populateIntegrityBase(): Promise<void> {
  await buildVersion9();
  await insertAsset("asset-shared");
  await insertAsset("asset-own");
  await insertDefinition("def-ok-1", { name: "Gainage" });
  await insertDefinition("def-ok-2", { name: "Fentes", mode: "REPETITIONS", duration: null, repetitions: 12 });
  await insertDefinition("def-bad", { name: "Pompes", json: "{not json", category: "renforcement" });
  await database.runAsync(
    "INSERT INTO activity_definition_body_zones (activity_definition_id, body_zone_id) VALUES ('def-bad', 'dos'), ('def-bad', 'bras'), ('def-ok-1', 'dos')",
  );
  await database.runAsync(
    `INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES
       ('dm-bad-1', 'def-bad', 'asset-shared', 0), ('dm-bad-2', 'def-bad', 'asset-own', 1), ('dm-ok', 'def-ok-1', 'asset-shared', 0)`,
  );
  // Séance A : zone IN_TOUR de trois occurrences, l'illisible au milieu.
  await insertSession("a");
  await insertCopy("a-1", "a", { position: 0, recovery: 15 });
  await insertCopy("a-2", "a", { position: 1, json: v1({ version: 7 }), recovery: 20 });
  await insertCopy("a-3", "a", { position: 2, recovery: 25 });
  await database.runAsync("INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES ('a-1', 'dos'), ('a-2', 'bras'), ('a-3', 'cou')");
  await database.runAsync(
    "INSERT INTO session_activity_media (id, activity_id, asset_id, position) VALUES ('sm-a1', 'a-1', 'asset-shared', 0), ('sm-a2', 'a-2', 'asset-own', 0)",
  );
  // Séance B : toutes ses Copies illisibles.
  await insertSession("b");
  await insertCopy("b-1", "b", { position: 0, json: "[]" });
  await insertCopy("b-2", "b", { position: 1, json: v1({}, { count: 2.5 }) });
  // Séance C : Circuit dont l'unique Copie est illisible ; une Copie lisible avant le Circuit,
  // homonyme de la Définition écartée (aucun lien de source n'existe en base).
  await insertSession("c");
  await insertCopy("c-before", "c", { zone: "BEFORE_TOUR", position: 0 });
  await database.runAsync("UPDATE activities SET name = 'Pompes' WHERE id = 'c-before'");
  await insertCopy("c-tour", "c", { zone: "IN_TOUR", position: 0, json: v1({ mode: "SPRINT" }) });
}

describe("PRE4-1.1/AC12 — écart des illisibles : intégrité, Séances et Médias", () => {
  it("aucun lien orphelin ; référentiels, médias et Séances conservés ; positions contiguës ; aucune quarantaine", async () => {
    await populateIntegrityBase();
    const before = await snapshot();
    const tablesBefore = (before.schema as { type: string; name: string }[]).filter((row) => row.type === "table").map((row) => row.name);

    await migrateDatabase(database, clock, 11);

    expect(await version()).toBe(11);
    const after = await snapshot();
    expect(await exists("activity_definitions", "def-bad")).toBe(false);
    expect(await exists("activity_definitions", "def-ok-1")).toBe(true);
    expect(await exists("activity_definitions", "def-ok-2")).toBe(true);
    readV2(await definitionJson("def-ok-1"));
    readV2(await definitionJson("def-ok-2"));
    // Aucun lien vers un Exercice absent.
    const orphans = await database.getFirstAsync<{ count: number }>(
      `SELECT
         (SELECT COUNT(*) FROM activity_definition_body_zones WHERE activity_definition_id NOT IN (SELECT id FROM activity_definitions))
       + (SELECT COUNT(*) FROM activity_media WHERE activity_definition_id NOT IN (SELECT id FROM activity_definitions))
       + (SELECT COUNT(*) FROM activity_body_zones WHERE activity_id NOT IN (SELECT id FROM activities))
       + (SELECT COUNT(*) FROM session_activity_media WHERE activity_id NOT IN (SELECT id FROM activities)) AS count`,
    );
    expect(orphans?.count).toBe(0);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    // Catégories, Zones, Étiquettes et media_assets inchangés, y compris l'asset dont l'Exercice écarté était le seul utilisateur.
    for (const table of ["categories", "body_zones", "labels", "media_assets", "sessions", "cycles", "tours", "users", "profiles"]) {
      // PRE-6 : colonnes additives de `migration011` hors objet de cette preuve.
      expect({ table, rows: withoutMigration011Columns(table, after[table]) }).toEqual({ table, rows: before[table] });
    }
    expect(await database.getAllAsync("SELECT activity_definition_id, asset_id, position FROM activity_media ORDER BY id")).toEqual([
      { activity_definition_id: "def-ok-1", asset_id: "asset-shared", position: 0 },
    ]);
    // Séance A : l'occurrence illisible retirée avec sa Récupération ; positions contiguës, ordre conservé.
    expect(
      await database.getAllAsync("SELECT id, position, post_activity_recovery_seconds FROM activities WHERE session_id = 'session-a' ORDER BY position"),
    ).toEqual([
      { id: "a-1", position: 0, post_activity_recovery_seconds: 15 },
      { id: "a-3", position: 1, post_activity_recovery_seconds: 25 },
    ]);
    expect(await database.getAllAsync("SELECT activity_id, body_zone_id FROM activity_body_zones ORDER BY activity_id")).toEqual([
      { activity_id: "a-1", body_zone_id: "dos" },
      { activity_id: "a-3", body_zone_id: "cou" },
    ]);
    expect(await database.getAllAsync("SELECT id, activity_id FROM session_activity_media ORDER BY id")).toEqual([
      { id: "sm-a1", activity_id: "a-1" },
    ]);
    // Séance B et Circuit vidé : toujours présents, sans occurrence.
    expect(await database.getAllAsync("SELECT id FROM activities WHERE session_id = 'session-b'")).toEqual([]);
    expect(await database.getAllAsync("SELECT id FROM activities WHERE session_id = 'session-c' AND structural_position = 'IN_TOUR'")).toEqual([]);
    expect(await database.getFirstAsync("SELECT id FROM tours WHERE id = 'tour-c'")).toEqual({ id: "tour-c" });
    // La Copie lisible homonyme de la Définition écartée est intacte.
    expect(await exists("activities", "c-before")).toBe(true);
    // Aucune table de sauvegarde ni de quarantaine : seule migration_notices s'ajoute.
    const tablesAfter = (after.schema as { type: string; name: string }[]).filter((row) => row.type === "table").map((row) => row.name);
    expect(tablesAfter.sort()).toEqual([...tablesBefore, "migration_notices"].sort());
    // Avis : 1 Définition + 4 Copies écartées.
    expect(await notices()).toEqual([
      { id: 1, kind: "UNREADABLE_EXERCISES_DROPPED", count: 5, created_at: NOW, acknowledged_at: null },
    ]);
  });

  it("une Définition lisible n'est pas touchée par l'écart d'une de ses Copies", async () => {
    await buildVersion9();
    const shared = v1({}, { target: 6000 });
    await insertDefinition("def-source", { json: shared });
    await insertSession("a");
    await insertCopy("copy-of-source", "a", { json: shared });

    await migrateDatabase(database, clock, 11);

    expect(await exists("activity_definitions", "def-source")).toBe(true);
    expect(await exists("activities", "copy-of-source")).toBe(false);
  });
});

describe("PRE4-1.1/AC13 — avis de migration enregistré, sans affichage", () => {
  it("schéma exact de migration_notices ; une seule ligne ; ni identifiant ni contenu d'Exercice", async () => {
    await populateIntegrityBase();
    await migrateDatabase(database, clock, 11);

    expect(await database.getAllAsync("SELECT name, type, \"notnull\", pk FROM pragma_table_info('migration_notices') ORDER BY cid")).toEqual([
      { name: "id", type: "INTEGER", notnull: 0, pk: 1 },
      { name: "kind", type: "TEXT", notnull: 1, pk: 0 },
      { name: "count", type: "INTEGER", notnull: 1, pk: 0 },
      { name: "created_at", type: "TEXT", notnull: 1, pk: 0 },
      { name: "acknowledged_at", type: "TEXT", notnull: 0, pk: 0 },
    ]);
    await expect(
      database.runAsync("INSERT INTO migration_notices (kind, count, created_at) VALUES ('X', 0, 'now')"),
    ).rejects.toThrow();
    const rows = await notices();
    expect(rows).toHaveLength(1);
    expect(new Date(rows[0]!.created_at as string).toISOString()).toBe(rows[0]!.created_at);
    const serialized = JSON.stringify(rows);
    for (const forbidden of ["def-bad", "Pompes", "a-2", "b-1", "c-tour", "not json"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("exemple : 1 Définition + 1 Copie illisibles → count = 2 ; sans illisible, la table existe et reste vide", async () => {
    await buildVersion9();
    await insertDefinition("def-bad", { json: "{" });
    await insertSession("a");
    await insertCopy("copy-bad", "a", { json: "{" });
    await migrateDatabase(database, clock, 11);
    expect(await notices()).toEqual([expect.objectContaining({ count: 2 })]);

    const clean = NodeSqliteDatabase.openInMemory();
    try {
      await buildVersion9(clean);
      await migrateDatabase(clean, clock, 11);
      expect(await clean.getAllAsync("SELECT * FROM migration_notices")).toEqual([]);
    } finally {
      clean.close();
    }
  });

  it("le repository des avis lit l'avis non acquitté puis l'acquitte (date ISO), sans réapparition", async () => {
    await buildVersion9();
    await insertDefinition("def-bad", { json: "{" });
    await migrateDatabase(database, clock, 11);
    const repository = new SqliteMigrationNoticeRepository(database, () => "2026-10-17T08:00:00.000Z");

    const notice = await repository.findUnacknowledged();
    expect(notice).toEqual({ id: 1, kind: "UNREADABLE_EXERCISES_DROPPED", count: 1, createdAt: NOW, acknowledgedAt: null });
    await repository.acknowledge(notice!.id);
    expect(await repository.findUnacknowledged()).toBeNull();
    expect(await notices()).toEqual([
      { id: 1, kind: "UNREADABLE_EXERCISES_DROPPED", count: 1, created_at: NOW, acknowledged_at: "2026-10-17T08:00:00.000Z" },
    ]);
  });
});

describe("PRE4-1.1/AC14 — valeurs positives hors bornes lisibles et conservées", () => {
  it("Définitions (JSON v1 et scalaires) et Copie (Pause de ligne 2 à 400) : recopiées telles quelles, jamais UNSET ni FAILURE", async () => {
    const pauses400 = v1({ sideMode: "RIGHT_LEFT", sideRecoverySeconds: 400 }, { pauseSeconds: 400 });
    const durations = v1({}, { kind: "VARIABLE", rows: [{ target: 7, pauseSeconds: 10 }, { target: 6000, pauseSeconds: 10 }] });
    const reps150 = v1({ mode: "REPETITIONS" }, { target: 150 });
    const countdown90 = v1({ countdownSeconds: 90 });
    const copyPause400 = v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 10 }, { target: 30, pauseSeconds: 400 }] });
    await buildVersion9();
    await insertDefinition("scalar-pause-400", { pause: 400 });
    await insertDefinition("pauses-400", { json: pauses400 });
    await insertDefinition("durations-7-6000", { json: durations });
    await insertDefinition("reps-150", { json: reps150 });
    await insertDefinition("countdown-90", { json: countdown90 });
    await insertSession("a");
    await insertCopy("copy-pause-400", "a", { json: copyPause400 });

    await migrateDatabase(database, clock, 11);

    expect(await notices()).toEqual([]);
    expect(
      expectParity(await definitionJson("scalar-pause-400"), {
        executionMode: "DURATION",
        durationSeconds: 30,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 400,
        sideMode: "UNILATERAL",
        sideRecoverySeconds: 0,
      }),
    ).toEqual(durationParameters(30, 3, 400));
    expect(expectParity(await definitionJson("pauses-400"), pauses400)).toEqual(
      durationParameters(30, 3, 400, { sideMode: "RIGHT_LEFT", sideRecoverySeconds: 400 }),
    );
    expect(expectParity(await definitionJson("durations-7-6000"), durations)).toEqual(variableParameters({ rows: [[7, 10], [6000, 10]] }));
    expect(expectParity(await definitionJson("reps-150"), reps150)).toEqual(repetitionParameters(150, 3, 10));
    expect(expectParity(await definitionJson("countdown-90"), countdown90)).toEqual(durationParameters(30, 3, 10, { countdownSeconds: 90 }));
    expect(expectParity(await copyJson("copy-pause-400"), copyPause400)).toEqual(variableParameters({ rows: [[30, 10], [30, 400]] }));

    // Une valeur non modifiée reste enregistrable telle quelle (niveau structurel du repository,
    // `validateForSave(…, "STORAGE")`). PRE-7 (A1.2) : la base est arrêtée à la version 11 (les
    // repositories courants lisent le schéma 012) ; la ligne v11 est relue par le lecteur v2/v3
    // conservé dans le domaine, puis soumise à la validation qu'applique le repository.
    const reread = readExecutionParameters(await definitionJson("reps-150"));
    const revalidated = validateForSave(reread, "STORAGE");
    expect(revalidated.ok ? revalidated.value : revalidated.violations).toEqual(repetitionParameters(150, 3, 10));
  });

  it("le convertisseur figé de migration010 n'importe ni le sérialiseur ni les lecteurs du domaine", () => {
    const source = readFileSync(join(__dirname, "..", "migrations", "migration010.ts"), "utf8");
    const imports = source.split(/\r?\n/).filter((line) => line.startsWith("import "));
    expect(imports).toEqual(['import type { Database } from "../Database";']);
  });
});

describe("PRE4-1.1/AC15 — reconstruction d'activities, CHECK et parité", () => {
  type Shape = Record<string, unknown>;
  async function shape(table: string): Promise<Shape> {
    const indexes = await database.getAllAsync<{ name: string; unique: number; origin: string; partial: number }>(
      `SELECT name, "unique", origin, partial FROM pragma_index_list('${table}') ORDER BY name`,
    );
    const indexColumns: Record<string, unknown> = {};
    for (const index of indexes) {
      indexColumns[index.name] = await database.getAllAsync(`SELECT seqno, name FROM pragma_index_info('${index.name}') ORDER BY seqno`);
    }
    return {
      columns: await database.getAllAsync(`SELECT * FROM pragma_table_info('${table}') ORDER BY cid`),
      foreignKeys: await database.getAllAsync(`SELECT * FROM pragma_foreign_key_list('${table}') ORDER BY id, seq`),
      indexes,
      indexColumns,
    };
  }

  it("schéma égal à la v9 hors CHECK ; comptes des tables filles et foreign_key_check ; activity_definitions non reconstruite", async () => {
    await populateIntegrityBase();
    const before = {
      activities: await shape("activities"),
      activity_body_zones: await shape("activity_body_zones"),
      session_activity_media: await shape("session_activity_media"),
    };
    const definitionsSql = await database.getFirstAsync<{ sql: string }>("SELECT sql FROM sqlite_master WHERE name = 'activity_definitions'");
    const childCounts = await database.getFirstAsync<{ zones: number; media: number }>(
      `SELECT (SELECT COUNT(*) FROM activity_body_zones WHERE activity_id NOT IN ('a-2','b-1','b-2','c-tour')) AS zones,
              (SELECT COUNT(*) FROM session_activity_media WHERE activity_id NOT IN ('a-2','b-1','b-2','c-tour')) AS media`,
    );

    await migrateDatabase(database, clock, 11);

    // PRE-6 : la colonne additive de `migration011` est hors objet de cette preuve.
    const activitiesAfter = await shape("activities");
    expect({
      activities: { ...activitiesAfter, columns: withoutMigration011TableInfo("activities", activitiesAfter.columns) },
      activity_body_zones: await shape("activity_body_zones"),
      session_activity_media: await shape("session_activity_media"),
    }).toEqual(before);
    expect(
      await database.getFirstAsync("SELECT (SELECT COUNT(*) FROM activity_body_zones) AS zones, (SELECT COUNT(*) FROM session_activity_media) AS media"),
    ).toEqual(childCounts);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    expect(await database.getFirstAsync("SELECT sql FROM sqlite_master WHERE name = 'activity_definitions'")).toEqual(definitionsSql);
    const activitiesSql = (await database.getFirstAsync<{ sql: string }>("SELECT sql FROM sqlite_master WHERE name = 'activities'"))!.sql;
    expect(activitiesSql).not.toContain("TO_FAILURE");
    expect(activitiesSql).toContain("duration_seconds BETWEEN 1 AND 5999");
  });

  it("nouveau CHECK : bornes de 004 à l'identique, TO_FAILURE retiré, cible scalaire NULL admise, jamais deux cibles, RECOVERY inchangée", async () => {
    await buildVersion9();
    await insertSession("a");
    await migrateDatabase(database, clock, 11);
    let position = 0;
    const insert = (columns: Record<string, unknown>) => {
      const row = {
        type: "EXERCISE",
        execution_mode: "DURATION",
        duration_seconds: 30,
        repetition_count: null,
        series_count: 1,
        pause_seconds: 0,
        post_activity_recovery_seconds: 0,
        ...columns,
      };
      position += 1;
      return database.runAsync(
        `INSERT INTO activities (
           id, session_id, cycle_id, tour_id, type, structural_position, position, name, execution_mode,
           duration_seconds, repetition_count, series_count, pause_seconds, post_activity_recovery_seconds,
           instruction, created_at, updated_at
         ) VALUES (?, 'session-a', 'cycle-a', 'tour-a', ?, 'IN_TOUR', ?, 'x', ?, ?, ?, ?, ?, ?, NULL, 'now', 'now')`,
        [
          `check-${position}`,
          row.type,
          position,
          row.execution_mode,
          row.duration_seconds,
          row.repetition_count,
          row.series_count,
          row.pause_seconds,
          row.post_activity_recovery_seconds,
        ] as (string | number | null)[],
      );
    };
    for (const accepted of [
      { duration_seconds: 1 },
      { duration_seconds: 5999 },
      { duration_seconds: null },
      { execution_mode: "REPETITIONS", duration_seconds: null, repetition_count: null },
      { execution_mode: "REPETITIONS", duration_seconds: null, repetition_count: 150 },
      { pause_seconds: 5999, post_activity_recovery_seconds: 5999 },
      { type: "RECOVERY", series_count: null, duration_seconds: 20 },
    ]) {
      await insert(accepted);
    }
    for (const refused of [
      { execution_mode: "TO_FAILURE", duration_seconds: null },
      { duration_seconds: 0 },
      { duration_seconds: 6000 },
      { duration_seconds: 30, repetition_count: 10 },
      { execution_mode: "REPETITIONS", duration_seconds: 30, repetition_count: 10 },
      { execution_mode: "REPETITIONS", duration_seconds: null, repetition_count: 0 },
      { series_count: 0 },
      { series_count: null },
      { pause_seconds: 6000 },
      { post_activity_recovery_seconds: 6000 },
      { type: "RECOVERY", series_count: null, duration_seconds: null },
      { type: "RECOVERY", series_count: null, duration_seconds: 20, pause_seconds: 5 },
    ]) {
      await expect(insert(refused)).rejects.toThrow();
    }
  });

  it("parité : les mêmes lignes reçoivent le même verdict du CHECK réel et d'assertActivityRow (PRE-8 : lecture de migration014)", async () => {
    await buildVersion9();
    await insertSession("a");
    await migrateDatabase(database, clock, 11);
    const candidates: readonly Record<string, unknown>[] = [];
    const values = {
      type: ["EXERCISE", "RECOVERY"],
      execution_mode: ["DURATION", "REPETITIONS", "TO_FAILURE"],
      duration_seconds: [null, 0, 1, 30, 5999, 6000],
      repetition_count: [null, 0, 1, 150],
      series_count: [null, 0, 1, 3],
      pause_seconds: [0, 10, 5999, 6000],
      post_activity_recovery_seconds: [0, 6000],
    };
    const combos: Record<string, unknown>[] = [];
    for (const type of values.type)
      for (const mode of values.execution_mode)
        for (const duration of values.duration_seconds)
          for (const repetitions of values.repetition_count)
            for (const series of values.series_count)
              for (const pause of values.pause_seconds)
                for (const recovery of values.post_activity_recovery_seconds)
                  combos.push({
                    type,
                    execution_mode: mode,
                    duration_seconds: duration,
                    repetition_count: repetitions,
                    series_count: series,
                    pause_seconds: pause,
                    post_activity_recovery_seconds: recovery,
                  });
    expect(combos.length + candidates.length).toBe(2 * 3 * 6 * 4 * 4 * 4 * 2);
    let index = 0;
    let acceptedCount = 0;
    for (const combo of combos) {
      index += 1;
      let real = true;
      try {
        await database.runAsync(
          `INSERT INTO activities (
             id, session_id, cycle_id, tour_id, type, structural_position, position, name, execution_mode,
             duration_seconds, repetition_count, series_count, pause_seconds, post_activity_recovery_seconds,
             instruction, created_at, updated_at, side_mode
           ) VALUES (?, 'session-a', 'cycle-a', 'tour-a', ?, 'IN_TOUR', ?, 'x', ?, ?, ?, ?, ?, ?, NULL, 'now', 'now', 'UNILATERAL')`,
          [
            `parity-${index}`,
            combo.type,
            index,
            combo.execution_mode,
            combo.duration_seconds,
            combo.repetition_count,
            combo.series_count,
            combo.pause_seconds,
            combo.post_activity_recovery_seconds,
          ] as (string | number | null)[],
        );
      } catch {
        real = false;
      }
      // PRE-8 (A.4) : ligne d'Exercice de migration014 ; même CHECK composite que 010.
      const row = {
        id: `parity-${index}`,
        session_id: "session-a",
        tour_id: "tour-a",
        type: combo.type,
        position: index,
        execution_mode: combo.execution_mode,
        duration_seconds: combo.duration_seconds,
        repetition_count: combo.repetition_count,
        series_count: combo.series_count,
        pause_seconds: combo.pause_seconds,
        post_activity_recovery_seconds: combo.post_activity_recovery_seconds,
        post_activity_recovery_present: 0,
        created_at: "now",
        updated_at: "now",
        side_mode: "UNILATERAL",
        execution_parameters: null,
        source_movement_id: "mov-x",
        copy_number: null,
      } as ActivityRow;
      let asserted = true;
      try {
        assertActivityRow(row);
      } catch {
        asserted = false;
      }
      expect({ combo, verdict: asserted }).toEqual({ combo, verdict: real });
      if (real) acceptedCount += 1;
    }
    // Le corpus de parité contient des lignes acceptées ET refusées.
    expect(acceptedCount).toBeGreaterThan(0);
    expect(acceptedCount).toBeLessThan(combos.length);
  });
});

describe("PRE4-1.1/AC16 — la projection de migration010 est la projection unique", () => {
  it("chaque ligne convertie porte la projection de projectScalars(readV2(JSON))", async () => {
    await buildVersion9();
    await insertDefinition("def-var", {
      json: v1({ mode: "REPETITIONS", sideMode: "LEFT_RIGHT", sideRecoverySeconds: 6 }, { kind: "VARIABLE", rows: [{ target: 0, pauseSeconds: 10 }, { target: 12, pauseSeconds: 20 }] }),
    });
    await insertDefinition("def-failure", { mode: "TO_FAILURE", duration: null, series: 4, pause: 30 });
    await insertSession("a");
    await insertCopy("copy-var", "a", { json: v1({}, { kind: "VARIABLE", rows: [{ target: 45, pauseSeconds: 10 }, { target: 30, pauseSeconds: 10 }] }) });
    await insertCopy("copy-failure", "a", { position: 1, json: v1({ mode: "TO_FAILURE" }, { count: 3, target: null, pauseSeconds: 10 }), mode: "TO_FAILURE", duration: null });

    await migrateDatabase(database, clock, 11);

    const definitionRows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT execution_parameters, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds, side_mode, side_recovery_seconds FROM activity_definitions",
    );
    for (const row of definitionRows) {
      const projection = projectScalars(readV2(row.execution_parameters as string));
      expect(row).toEqual({
        execution_parameters: row.execution_parameters,
        execution_mode: projection.executionMode,
        duration_seconds: projection.durationSeconds,
        repetition_count: projection.repetitionCount,
        series_count: projection.seriesCount,
        pause_seconds: projection.pauseSeconds,
        side_mode: projection.sideMode,
        side_recovery_seconds: projection.sideRecoverySeconds,
      });
    }
    const copyRows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT execution_parameters, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds, side_mode FROM activities",
    );
    for (const row of copyRows) {
      const projection = projectScalars(readV2(row.execution_parameters as string));
      expect(row).toEqual({
        execution_parameters: row.execution_parameters,
        execution_mode: projection.executionMode,
        duration_seconds: projection.durationSeconds,
        repetition_count: projection.repetitionCount,
        series_count: projection.seriesCount,
        pause_seconds: projection.pauseSeconds,
        side_mode: projection.sideMode,
      });
    }
    // Première Cible UNSET : cible scalaire NULL, jamais la Cible numérique suivante.
    expect(definitionRows.find((row) => String(row.execution_parameters).includes('"value":12'))?.repetition_count).toBeNull();
  });
});

/**
 * Fait échouer le N-ième appel (lecture ou écriture) passé par l'API
 * `Database` — motif `FailingDatabase` (`migrateDatabase.test.ts`), étendu aux
 * lectures pour couvrir l'étape de lecture de `migration010`.
 */
class FailingDatabase implements Database {
  calls = 0;
  constructor(
    private readonly inner: NodeSqliteDatabase,
    private readonly failAt: number,
  ) {}
  private tick(): void {
    this.calls += 1;
    if (this.calls === this.failAt) {
      throw new Error(`Injected failure at call ${this.failAt}`);
    }
  }
  execAsync(source: string) {
    return this.inner.execAsync(source);
  }
  async runAsync(source: string, parameters?: readonly (string | number | null | Uint8Array)[]) {
    this.tick();
    return this.inner.runAsync(source, parameters);
  }
  async getFirstAsync<T>(source: string, parameters?: readonly (string | number | null | Uint8Array)[]) {
    this.tick();
    return this.inner.getFirstAsync<T>(source, parameters);
  }
  async getAllAsync<T>(source: string, parameters?: readonly (string | number | null | Uint8Array)[]) {
    this.tick();
    return this.inner.getAllAsync<T>(source, parameters);
  }
  withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>) {
    return this.inner.withExclusiveTransactionAsync(() => task(this));
  }
}

describe("PRE4-1.1/AC17 — atomicité et nouvelle tentative (erreur structurelle)", () => {
  it("une erreur injectée à chaque appel de migration010 laisse la base identique (version 9) ; la nouvelle tentative réussit", async () => {
    await populateIntegrityBase();
    const initial = await snapshot();

    const probe = new FailingDatabase(database, Number.POSITIVE_INFINITY);
    // Mesure du nombre d'appels d'une migration complète, sur une copie jetable.
    const scratch = NodeSqliteDatabase.openInMemory();
    try {
      const swap = database;
      database = scratch;
      await populateIntegrityBase();
      database = swap;
      const counting = new FailingDatabase(scratch, Number.POSITIVE_INFINITY);
      await migrateDatabase(counting, clock, 11);
      probe.calls = counting.calls;
    } finally {
      scratch.close();
    }
    expect(probe.calls).toBeGreaterThan(40);

    for (let failAt = 1; failAt <= probe.calls; failAt += 1) {
      await expect(migrateDatabase(new FailingDatabase(database, failAt), clock, 11)).rejects.toThrow(
        `Injected failure at call ${failAt}`,
      );
      expect(await snapshot()).toEqual(initial);
    }

    await migrateDatabase(database, clock, 11);
    expect(await version()).toBe(11);
    expect(await notices()).toEqual([expect.objectContaining({ count: 5 })]);
  });

  it("un schéma inattendu ou une seconde FK vers activities : erreur structurelle, base identique ; corrigée, la migration réussit", async () => {
    await populateIntegrityBase();
    await database.execAsync("ALTER TABLE activities ADD COLUMN unexpected TEXT");
    const altered = await snapshot();
    await expect(migrateDatabase(database, clock, 11)).rejects.toThrow("unexpected schema for activities");
    expect(await snapshot()).toEqual(altered);
    await database.execAsync("ALTER TABLE activities DROP COLUMN unexpected");

    await database.execAsync("CREATE TABLE activity_notes (activity_id TEXT REFERENCES activities(id))");
    const withForeignKey = await snapshot();
    await expect(migrateDatabase(database, clock, 11)).rejects.toThrow("unexpected foreign key to activities from activity_notes");
    expect(await snapshot()).toEqual(withForeignKey);
    expect(await version()).toBe(9);
    await database.execAsync("DROP TABLE activity_notes");

    await migrateDatabase(database, clock, 11);
    expect(await version()).toBe(11);
  });
});

describe("PRE4-1.1/AC19 — refus d'un troisième Mode ou d'une Cible UNSET à l'écriture", () => {
  it("Définition et Copie en TO_FAILURE ou à Cible UNSET : refusées sans aucune écriture", async () => {
    await buildVersion9();
    await migrateDatabase(database, clock, 11);
    const before = await snapshot();
    const legacy = { ...allFailureParameters(3, 10), mode: "TO_FAILURE" } as unknown as ExecutionParameters;
    const unset = durationParameters("UNSET", 3, 10);
    const definitions = new SqliteActivityDefinitionRepository(database, ids("def"));
    const sessions = new SqliteSessionRepository(database, ids("ses"));
    for (const executionParameters of [legacy, unset]) {
      await expect(
        definitions.create({
          name: "Tractions",
          description: null,
          category: { kind: "EXISTING", categoryId: "cardio" },
          bodyZoneIds: ["dos"],
          executionParameters,
        }),
      ).rejects.toThrow(ExecutionParametersValidationError);
      await expect(
        sessions.create({
          name: "Séance",
          initialCountdownSeconds: 10,
          finalPhaseSeconds: 5,
          tourRepeatCount: 1,
          exercises: [
            {
              type: "EXERCISE",
              structuralPosition: "IN_TOUR",
              // PRE-7 (R-3, C05) : occurrence sans contenu ; refusée sur ses paramètres avant toute écriture.
              sourceMovementId: "mov-tractions",
              postActivityRecoverySeconds: 0,
              executionParameters: executionParameters as ExecutionParametersInput,
            },
          ],
        }),
      ).rejects.toThrow(SessionValidationError);
    }
    expect(await snapshot()).toEqual(before);
  });
});

describe("PRE4-1.1/AC10 + AC18 — relecture après migration", () => {
  // PRE-7 (A1.2) : base arrêtée à la version 11 ; les lignes migrées sont relues par le lecteur
  // v2/v3 du domaine (`readExecutionParameters`, celui des repositories jusqu'à 011).
  it("un ancien Exercice à l'échec migré est relu en Répétitions, toutes Cibles FAILURE", async () => {
    await buildVersion9();
    await insertDefinition("def-failure", { mode: "TO_FAILURE", duration: null, series: 3, pause: 10 });
    await database.runAsync("INSERT INTO activity_definition_body_zones (activity_definition_id, body_zone_id) VALUES ('def-failure', 'dos')");
    await insertSession("a");
    await insertCopy("copy-failure", "a", { mode: "TO_FAILURE", duration: null, series: 3, pause: 10, recovery: 30 });

    await migrateDatabase(database, clock, 11);

    expect(readExecutionParameters(await definitionJson("def-failure"))).toEqual(
      uniformParameters({ mode: "REPETITIONS", count: 3, target: "FAILURE", pauseSeconds: 10 }),
    );
    const copy = await database.getFirstAsync<{
      session_id: string;
      execution_parameters: string;
      post_activity_recovery_seconds: number;
      post_activity_recovery_present: number;
    }>(
      "SELECT session_id, execution_parameters, post_activity_recovery_seconds, post_activity_recovery_present FROM activities WHERE id = 'copy-failure'",
    );
    expect(copy?.session_id).toBe("session-a");
    expect(readExecutionParameters(copy?.execution_parameters)).toEqual(allFailureParameters(3, 10));
    expect([copy?.post_activity_recovery_seconds, copy?.post_activity_recovery_present]).toEqual([30, 1]);
  });
});

describe("PRE4-1.2/AC2 — repository des avis : acquittement à l'appui seulement, persistant après relance", () => {
  it("non acquitté : relu à l'identique par un nouveau repository (relance) ; acquitté : plus jamais relu, date ISO écrite une fois", async () => {
    await buildVersion9();
    await insertDefinition("def-bad", { json: "{" });
    await insertSession("a");
    await insertCopy("copy-bad", "a", { json: "{" });
    await migrateDatabase(database, clock, 11);

    // Lancement 1 : l'avis est lu, l'application est quittée sans toucher le bouton.
    const firstLaunch = new SqliteMigrationNoticeRepository(database, () => "2026-10-17T08:00:00.000Z");
    const shown = await firstLaunch.findUnacknowledged();
    expect(shown).toEqual({ id: 1, kind: "UNREADABLE_EXERCISES_DROPPED", count: 2, createdAt: NOW, acknowledgedAt: null });
    expect(await notices()).toEqual([
      { id: 1, kind: "UNREADABLE_EXERCISES_DROPPED", count: 2, created_at: NOW, acknowledged_at: null },
    ]);

    // Lancement 2 : l'avis réapparaît ; le bouton est touché.
    const secondLaunch = new SqliteMigrationNoticeRepository(database, () => "2026-10-18T09:30:00.000Z");
    expect(await secondLaunch.findUnacknowledged()).toEqual(shown);
    await secondLaunch.acknowledge(shown!.id);
    expect(await notices()).toEqual([
      { id: 1, kind: "UNREADABLE_EXERCISES_DROPPED", count: 2, created_at: NOW, acknowledged_at: "2026-10-18T09:30:00.000Z" },
    ]);

    // Lancement 3 : plus d'avis ; un second acquittement ne réécrit pas la date.
    const thirdLaunch = new SqliteMigrationNoticeRepository(database, () => "2026-10-19T10:00:00.000Z");
    expect(await thirdLaunch.findUnacknowledged()).toBeNull();
    await thirdLaunch.acknowledge(shown!.id);
    expect((await notices())[0]?.acknowledged_at).toBe("2026-10-18T09:30:00.000Z");
  });

  it("aucune migration écartant un Exercice : aucun avis à lire (AC3, côté données)", async () => {
    await buildVersion9();
    await insertDefinition("def-ok");
    await migrateDatabase(database, clock, 11);
    expect(await new SqliteMigrationNoticeRepository(database).findUnacknowledged()).toBeNull();
  });
});

/** Base de l'AC12 de 1.1, avec des dates de modification distinctes pour fixer l'ordre de la liste. */
async function populateMigratedBaseWithEmptySession(): Promise<void> {
  await populateIntegrityBase();
  await database.runAsync("UPDATE sessions SET updated_at = '2026-01-05T00:00:00.000Z' WHERE id = 'session-a'");
  await database.runAsync("UPDATE sessions SET updated_at = '2026-01-06T00:00:00.000Z' WHERE id = 'session-b'");
  await database.runAsync("UPDATE sessions SET updated_at = '2026-01-04T00:00:00.000Z' WHERE id = 'session-c'");
  await migrateDatabase(database, clock, 11);
}

/**
 * PRE-7 (A1.2) : base arrêtée à la version 11. Les preuves portent sur l'état
 * laissé par `migration010` (Séance B conservée sans occurrence, A et C avec
 * leurs occurrences lisibles), relu en lignes brutes ; la lecture, la liste et
 * l'enregistrement d'une Séance sans occurrence par le repository courant
 * (P39) sont prouvés sur le schéma 012 par `SqliteSessionRepository.test.ts`
 * (« PRE-7 A1.2 — Séance sans occurrence »).
 */
describe("PRE4-1.2/AC6 — Séance sans occurrence visible dans la liste", () => {
  it("la Séance B (toutes Copies écartées) reste une Séance active, 0 exercice ; A et C gardent leurs occurrences et l'ordre de liste", async () => {
    await populateMigratedBaseWithEmptySession();

    // Ordre de la liste : date de modification décroissante, Séance B comprise.
    const listed = await database.getAllAsync<{ id: string; name: string; count: number; repeat_count: number }>(
      `SELECT sessions.id, sessions.name, tours.repeat_count,
              (SELECT COUNT(*) FROM activities WHERE activities.session_id = sessions.id) AS count
       FROM sessions JOIN tours ON tours.session_id = sessions.id
       WHERE sessions.status = 'ACTIVE' ORDER BY sessions.updated_at DESC`,
    );
    expect(listed).toEqual([
      { id: "session-b", name: "Séance b", repeat_count: 2, count: 0 },
      { id: "session-a", name: listed[1]!.name, repeat_count: listed[1]!.repeat_count, count: 2 },
      { id: "session-c", name: listed[2]!.name, repeat_count: listed[2]!.repeat_count, count: 1 },
    ]);
    // Les occurrences restantes sont lisibles (durée de liste > 0).
    for (const row of await database.getAllAsync<{ execution_parameters: string }>(
      "SELECT execution_parameters FROM activities WHERE session_id IN ('session-a', 'session-c')",
    )) {
      expect(readExecutionParameters(row.execution_parameters).series).toBeDefined();
    }
  });
});

describe("PRE4-1.2/AC7 — Séance sans occurrence ouvrable", () => {
  it("la Séance B est conservée avec ses paramètres et une composition vide ; C garde l'occurrence avant le Circuit", async () => {
    await populateMigratedBaseWithEmptySession();

    expect(
      await database.getFirstAsync(
        `SELECT sessions.id, sessions.owner_id, sessions.name, sessions.label_id, sessions.status,
                sessions.initial_countdown_seconds, sessions.final_phase_seconds, sessions.created_at, sessions.updated_at,
                cycles.id AS cycle_id, tours.id AS tour_id, tours.repeat_count, tours.nature
         FROM sessions JOIN cycles ON cycles.session_id = sessions.id JOIN tours ON tours.cycle_id = cycles.id
         WHERE sessions.id = 'session-b'`,
      ),
    ).toEqual({
      id: "session-b",
      owner_id: "usr_0123456789abcdef0123456789abcdef",
      name: "Séance b",
      label_id: null,
      status: "ACTIVE",
      initial_countdown_seconds: 10,
      final_phase_seconds: 5,
      created_at: "2026-01-04T00:00:00.000Z",
      updated_at: "2026-01-06T00:00:00.000Z",
      cycle_id: "cycle-b",
      tour_id: "tour-b",
      repeat_count: 2,
      // PRE-6 (story 1.1) : la nature reprise par `migration011`.
      nature: "TOURS",
    });
    expect(await database.getAllAsync("SELECT id FROM activities WHERE session_id = 'session-b'")).toEqual([]);
    // Une Séance dont il ne reste qu'une zone (C : Circuit vidé) garde ses occurrences restantes.
    expect(
      await database.getAllAsync("SELECT id, structural_position FROM activities WHERE session_id = 'session-c' ORDER BY position"),
    ).toEqual([{ id: "c-before", structural_position: "BEFORE_TOUR" }]);
  });
});
