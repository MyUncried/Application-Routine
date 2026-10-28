import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { activityDefinitionToDraftExercise, validateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import { projectScalars, serializeExecutionParameters, type ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, toCreateSessionInput } from "@/domain/sessions/SessionDraft";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { MIGRATION_NOTICE_EXERCISES_AND_SESSIONS_RESET } from "@/infrastructure/database/migrations/migration012";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMigrationNoticeRepository } from "@/infrastructure/database/repositories/SqliteMigrationNoticeRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { buildVersion11 } from "@/infrastructure/database/testing/buildVersion11";
import { failOnWrite } from "@/infrastructure/database/testing/failOnWrite";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-7 (A1.2, D-440 assouplie, MFN-12) — `migration012` sur une base v11
 * FICHIER réelle (`node:sqlite`), construite par les migrations 001 à 011 du
 * code de départ (`buildVersion11`), peuplée par `INSERT` directs (Profil
 * personnalisé ; Catégories et Zones créées, renommées, retirées ; Étiquettes ;
 * Exercices, Séances, occurrences, médias, Points d'arrêt), migrée par le
 * chemin du démarrage (`initializeDatabase`), puis relue par une NOUVELLE
 * connexion. Une suite verte ne vaut pas recette sur appareil (jalon JA1).
 *
 * PRE-7 (R-3) : le démarrage enchaîne désormais `migration013`. Les preuves
 * propres au schéma 012 migrent avec `targetVersion` 12 (`migrateTo12`) et
 * vérifient ce schéma en SQL ; celles du démarrage complet (relance, données
 * recréées) visent la version courante (`DATABASE_VERSION`).
 */

const NOW = "2026-10-24T08:00:00.000Z";
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;

// --- Base fichier ------------------------------------------------------------

const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre7-a12");
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

/** Chaîne arrêtée à la version 12 (`targetVersion`) : schéma et effets de `migration012` seuls. */
async function migrateTo12(database: Database): Promise<void> {
  await migrateDatabase(database, () => NOW, 12);
}

async function version(database: Database): Promise<number> {
  return (await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? -1;
}

async function count(database: Database, table: string): Promise<number> {
  return (await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`))?.count ?? -1;
}

/** Toutes les tables, ligne pour ligne (ordre de `rowid`), et le schéma. */
async function dumpAll(database: Database): Promise<Record<string, unknown>> {
  const tables = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  const result: Record<string, unknown> = {
    schema: await database.getAllAsync("SELECT type, name, sql FROM sqlite_master ORDER BY type, name"),
  };
  for (const { name } of tables) {
    result[name] = await database.getAllAsync(`SELECT * FROM ${name} ORDER BY rowid`);
  }
  return result;
}

/** Préférences, Catégories, Zones et Étiquettes : les données conservées par D-440 assouplie. */
async function referentials(database: Database): Promise<Record<string, unknown>> {
  return {
    users: await database.getAllAsync("SELECT * FROM users"),
    profiles: await database.getAllAsync("SELECT * FROM profiles"),
    categories: await database.getAllAsync("SELECT * FROM categories ORDER BY id"),
    body_zones: await database.getAllAsync("SELECT * FROM body_zones ORDER BY id"),
    labels: await database.getAllAsync("SELECT * FROM labels ORDER BY id"),
  };
}

// --- Fixture v11 ---------------------------------------------------------------

const phased = (): ExecutionParameters =>
  uniformParameters({
    mode: "DURATION",
    count: 3,
    target: 9,
    pauseSeconds: 15,
    sideMode: "LEFT_RIGHT",
    workPhases: [
      { id: 1, label: "Descente", durationSeconds: 6 },
      { id: 2, label: "Maintien", durationSeconds: 3 },
    ],
  });

/** Personnalisations conservées : Profil, Catégories et Zones créées, renommées et retirées, Étiquettes. */
async function personalize(database: Database): Promise<void> {
  await database.runAsync(
    `UPDATE profiles SET side_change_recovery_seconds_default = 17, post_activity_recovery_seconds_default = 42,
       exercise_countdown_seconds_default = 7, sounds_enabled = 0, display_name = 'Hermann', silhouette = 'homme'`,
  );
  await database.runAsync(
    `INSERT INTO categories (id, name, canonical_key, is_predefined, display_order, created_at, color, is_active)
     VALUES ('cat-custom', 'Escalade', 'escalade', 0, NULL, '2026-01-01T00:00:00.000Z', '#2E9B62', 1),
            ('cat-retired', 'Natation', 'natation', 0, NULL, '2026-01-02T00:00:00.000Z', '#3B82F6', 0)`,
  );
  await database.runAsync("UPDATE categories SET name = 'Grimpe', canonical_key = 'grimpe' WHERE id = 'cat-custom'");
  await database.runAsync("UPDATE categories SET is_active = 0 WHERE id = 'mobilite'");
  await database.runAsync(
    `INSERT INTO body_zones (id, name, is_active, created_at, canonical_key)
     VALUES ('zone-custom', 'Avant-bras', 1, '2026-01-01T00:00:00.000Z', 'avant-bras')`,
  );
  await database.runAsync("UPDATE body_zones SET name = 'Poignets', canonical_key = 'poignets' WHERE id = 'zone-custom'");
  await database.runAsync("UPDATE body_zones SET is_active = 0 WHERE id = 'cou'");
  await database.runAsync(
    `INSERT INTO labels (id, name, color, is_active, created_at, canonical_key)
     VALUES ('label-1', 'Matin', '#E5484D', 1, '2026-01-01T00:00:00.000Z', 'matin'),
            ('label-2', 'Ancienne', '#F47B20', 0, '2026-01-01T00:00:00.000Z', 'ancienne')`,
  );
}

/** Exercices, Séances et associations (schéma v11, JSON v3) : supprimés une seule fois par 012. */
async function populateExercisesAndSessions(database: Database): Promise<void> {
  for (const id of ["asset-def", "asset-copy"]) {
    await database.runAsync("INSERT INTO media_assets (id, uri, created_at) VALUES (?, ?, '2026-01-01T00:00:00.000Z')", [
      id,
      `kodjo-media/${id}`,
    ]);
  }
  for (const [id, category] of [
    ["def-1", "cat-custom"],
    ["def-2", "cardio"],
  ] as const) {
    const parameters = phased();
    const scalars = projectScalars(parameters);
    await database.runAsync(
      `INSERT INTO activity_definitions (
         id, name, description, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
         side_mode, created_at, updated_at, category_id, side_recovery_seconds, execution_parameters
       ) VALUES (?, 'Fentes', NULL, ?, ?, ?, ?, ?, ?, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', ?, ?, ?)`,
      [
        id,
        scalars.executionMode,
        scalars.durationSeconds,
        scalars.repetitionCount,
        scalars.seriesCount,
        scalars.pauseSeconds,
        scalars.sideMode,
        category,
        scalars.sideRecoverySeconds,
        serializeExecutionParameters(parameters),
      ],
    );
    await database.runAsync(
      "INSERT INTO activity_definition_body_zones (activity_definition_id, body_zone_id) VALUES (?, 'zone-custom'), (?, 'dos')",
      [id, id],
    );
  }
  await database.runAsync(
    "INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES ('dm-1', 'def-1', 'asset-def', 0)",
  );
  const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = 1");
  for (const session of ["a", "b"]) {
    await database.runAsync(
      `INSERT INTO sessions (id, owner_id, name, label_id, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
       VALUES (?, ?, ?, 'label-1', 'ACTIVE', 10, 5, '2026-09-01T00:00:00.000Z', '2026-09-02T00:00:00.000Z')`,
      [`session-${session}`, user!.id, `Séance ${session}`],
    );
    await database.runAsync("INSERT INTO cycles (id, session_id, position, repeat_count) VALUES (?, ?, 1, 1)", [
      `cycle-${session}`,
      `session-${session}`,
    ]);
    await database.runAsync(
      "INSERT INTO tours (id, cycle_id, session_id, position, repeat_count, side_mode, nature) VALUES (?, ?, ?, 1, 2, 'UNILATERAL', 'SERIES')",
      [`tour-${session}`, `cycle-${session}`, `session-${session}`],
    );
    const parameters = phased();
    const scalars = projectScalars(parameters);
    await database.runAsync(
      `INSERT INTO activities (
         id, session_id, cycle_id, tour_id, type, structural_position, position, name,
         execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
         post_activity_recovery_seconds, post_activity_recovery_present, instruction, created_at, updated_at, side_mode,
         execution_parameters, category_id
       ) VALUES (?, ?, ?, ?, 'EXERCISE', 'IN_TOUR', 0, 'Fentes', ?, ?, ?, ?, ?, 30, 1, NULL,
         '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', ?, ?, 'cat-custom')`,
      [
        `occ-${session}`,
        `session-${session}`,
        `cycle-${session}`,
        `tour-${session}`,
        scalars.executionMode,
        scalars.durationSeconds,
        scalars.repetitionCount,
        scalars.seriesCount,
        scalars.pauseSeconds,
        scalars.sideMode,
        serializeExecutionParameters(parameters),
      ],
    );
    await database.runAsync("INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES (?, 'zone-custom')", [
      `occ-${session}`,
    ]);
    await database.runAsync(
      "INSERT INTO session_activity_media (id, activity_id, asset_id, position) VALUES (?, ?, 'asset-copy', 0), (?, ?, 'asset-def', 1)",
      [`sm-${session}-0`, `occ-${session}`, `sm-${session}-1`, `occ-${session}`],
    );
    await database.runAsync("INSERT INTO session_stop_points (id, session_id, scope, position) VALUES (?, ?, 'IN_TOUR', 0)", [
      `stop-${session}`,
      `session-${session}`,
    ]);
  }
}

async function seededVersion11(options: { readonly exercises: boolean } = { exercises: true }): Promise<NodeSqliteDatabase> {
  const database = open();
  await buildVersion11(database);
  await personalize(database);
  if (options.exercises) {
    await populateExercisesAndSessions(database);
  }
  expect(await version(database)).toBe(11);
  expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  return reopen(database);
}

/** Tables d'Exercices, de Séances et d'associations : vides après 012. */
const RESET_TABLES = [
  "activity_definitions",
  "movements",
  "movement_phases",
  "movement_body_zones",
  "movement_media",
  "sessions",
  "cycles",
  "tours",
  "activities",
  "activity_body_zones",
  "session_activity_media",
  "session_stop_points",
  "media_assets",
];

// --- Tests ----------------------------------------------------------------------

describe("PRE-7 A1.2 — migration 012 sur une base v11 fichier réelle (node:sqlite)", () => {
  it("v11 peuplée → 12 : Profil, Catégories, Zones et Étiquettes identiques ; Exercices et Séances supprimés ; un avis ; intégrité préservée ; relue par une nouvelle connexion", async () => {
    let database = await seededVersion11();
    const kept = await referentials(database);
    expect(await count(database, "activity_definitions")).toBe(2);
    expect(await count(database, "sessions")).toBe(2);

    await migrateTo12(database);
    database = reopen(database);

    expect(await version(database)).toBe(12);
    // PRE-8 : la version courante est 15 (`migration014` A.3, `migration015` B.8), éprouvées par leurs tests.
    expect(DATABASE_VERSION).toBe(15);
    // Personnalisations conservées, ligne pour ligne (créations, renommages, retraits compris).
    expect(await referentials(database)).toEqual(kept);
    expect(await database.getFirstAsync("SELECT name, is_active FROM categories WHERE id = 'cat-custom'")).toEqual({ name: "Grimpe", is_active: 1 });
    expect(await database.getFirstAsync("SELECT is_active FROM categories WHERE id = 'mobilite'")).toEqual({ is_active: 0 });
    expect(await database.getFirstAsync("SELECT name, is_active FROM body_zones WHERE id = 'zone-custom'")).toEqual({ name: "Poignets", is_active: 1 });
    expect(await database.getFirstAsync("SELECT is_active FROM body_zones WHERE id = 'cou'")).toEqual({ is_active: 0 });
    expect(await database.getFirstAsync("SELECT display_name, post_activity_recovery_seconds_default FROM profiles")).toEqual({
      display_name: "Hermann",
      post_activity_recovery_seconds_default: 42,
    });
    // Aucune définition, séance, occurrence, lien ni asset.
    for (const table of RESET_TABLES) {
      expect({ table, count: await count(database, table) }).toEqual({ table, count: 0 });
    }
    // Un seul avis : 2 Exercices + 2 Séances, sans nom ni identifiant.
    const notices = await database.getAllAsync<{ kind: string; count: number; created_at: string; acknowledged_at: string | null }>(
      "SELECT kind, count, created_at, acknowledged_at FROM migration_notices",
    );
    expect(notices).toEqual([{ kind: MIGRATION_NOTICE_EXERCISES_AND_SESSIONS_RESET, count: 4, created_at: expect.any(String), acknowledged_at: null }]);
    expect(new Date(notices[0]!.created_at).toISOString()).toBe(notices[0]!.created_at);
    expect(await new SqliteMigrationNoticeRepository(database).findUnacknowledged()).toMatchObject({
      kind: "EXERCISES_AND_SESSIONS_RESET",
      count: 4,
    });
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    expect(await database.getAllAsync("PRAGMA integrity_check")).toEqual([{ integrity_check: "ok" }]);
  });

  it("schéma MFN : movement_id intègre et restrictif, source_movement_id non nul sans clé étrangère, Zones et médias du Mouvement, anciennes tables retirées", async () => {
    let database = await seededVersion11();
    await migrateTo12(database);
    database = reopen(database);

    const tables = (await database.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")).map((row) => row.name);
    for (const table of ["movements", "movement_phases", "movement_body_zones", "movement_media", "activity_definitions", "activities"]) {
      expect(tables).toContain(table);
    }
    expect(tables).not.toContain("activity_definition_body_zones");
    expect(tables).not.toContain("activity_media");

    const definitionColumns = await database.getAllAsync<{ name: string; notnull: number }>("PRAGMA table_info(activity_definitions)");
    expect(definitionColumns.map((column) => [column.name, column.notnull])).toEqual([
      ["id", 1],
      ["movement_id", 1],
      ["execution_parameters", 1],
      ["created_at", 1],
      ["updated_at", 1],
    ]);
    expect(await database.getAllAsync("SELECT \"table\", \"from\", \"to\", on_delete FROM pragma_foreign_key_list('activity_definitions')")).toEqual([
      { table: "movements", from: "movement_id", to: "id", on_delete: "RESTRICT" },
    ]);
    const source = (await database.getAllAsync<{ name: string; notnull: number }>("PRAGMA table_info(activities)")).find(
      (column) => column.name === "source_movement_id",
    );
    expect(source?.notnull).toBe(1);
    const activityForeignKeys = await database.getAllAsync<{ table: string; from: string }>(
      "SELECT \"table\", \"from\" FROM pragma_foreign_key_list('activities')",
    );
    expect(activityForeignKeys.some((key) => key.from === "source_movement_id")).toBe(false);
    expect(await database.getAllAsync("SELECT \"table\", \"from\" FROM pragma_foreign_key_list('movement_body_zones') ORDER BY \"from\"")).toEqual([
      { table: "body_zones", from: "body_zone_id" },
      { table: "movements", from: "movement_id" },
    ]);
    // Colonnes de 011 reprises à l'identique dans la nouvelle table d'occurrences.
    const activityColumns = (await database.getAllAsync<{ name: string }>("PRAGMA table_info(activities)")).map((column) => column.name);
    expect(activityColumns).toEqual(expect.arrayContaining(["post_activity_recovery_present", "execution_parameters", "category_id"]));
    expect(await database.getAllAsync("SELECT nature FROM tours")).toEqual([]);

    // Une définition sans Mouvement est refusée ; un Mouvement référencé ne se supprime pas.
    await expect(
      database.runAsync("INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at) VALUES ('d', 'ghost', '{}', 'now', 'now')"),
    ).rejects.toThrow();
    // Les cascades et restrictions des occurrences sont conservées (migration008, AD-4). PRE-7
    // (R-3) : écrites en SQL au schéma 012 (les repositories courants visent le schéma 13) —
    // Mouvement local, Séance, Cycle, Tour, occurrence et sa Zone.
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, used, created_at, updated_at)
       VALUES ('occ-1', 'Gainage', 'gainage', NULL, 'cardio', 1, 1, 'now', 'now')`,
    );
    const owner = await database.getFirstAsync<{ id: string }>("SELECT id FROM users");
    await database.runAsync(
      `INSERT INTO sessions (id, owner_id, name, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
       VALUES ('ses-1', ?, 'Séance', 'ACTIVE', 10, 5, 'now', 'now')`,
      [owner!.id],
    );
    await database.runAsync("INSERT INTO cycles (id, session_id, position, repeat_count) VALUES ('cyc-1', 'ses-1', 1, 1)");
    await database.runAsync(
      "INSERT INTO tours (id, cycle_id, session_id, position, repeat_count, side_mode, nature) VALUES ('tour-1', 'cyc-1', 'ses-1', 1, 1, 'UNILATERAL', 'TOURS')",
    );
    await database.runAsync(
      `INSERT INTO activities (id, session_id, cycle_id, tour_id, type, structural_position, position, name, execution_mode,
         duration_seconds, series_count, pause_seconds, created_at, updated_at, execution_parameters, category_id, source_movement_id)
       VALUES ('occ-1', 'ses-1', 'cyc-1', 'tour-1', 'EXERCISE', 'IN_TOUR', 0, 'Gainage', 'DURATION', 30, 2, 10, 'now', 'now', '{}', 'cardio', 'occ-1')`,
    );
    await database.runAsync("INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES ('occ-1', 'dos')");
    await expect(database.runAsync("DELETE FROM body_zones WHERE id = 'dos'")).rejects.toThrow();
    await database.runAsync("DELETE FROM sessions WHERE id = ?", ["ses-1"]);
    expect(await count(database, "activities")).toBe(0);
    expect(await count(database, "activity_body_zones")).toBe(0);
    // Aucun ramassage : le Mouvement local de l'occurrence reste (MFN-04).
    expect(await count(database, "movements")).toBe(1);
  });

  it("second lancement : aucune suppression, aucun nouvel avis ; les données recréées sont conservées", async () => {
    let database = await seededVersion11();
    await initializeDatabase(database);
    database = reopen(database);

    const definitions = new SqliteActivityDefinitionRepository(database, ids("def"), () => NOW);
    const validated = validateActivityDefinitionInput({
      name: "Fentes",
      description: null,
      category: { kind: "EXISTING", categoryId: "cat-custom" },
      bodyZoneIds: ["zone-custom"],
      executionParameters: phased(),
    });
    if (!validated.ok) {
      throw new Error(JSON.stringify(validated.violations));
    }
    const definition = await definitions.create(validated.value);
    const draft = { ...createEmptyDraft(), name: "Jambes", exercises: [activityDefinitionToDraftExercise(definition, "occ-new", null)] };
    const input = toCreateSessionInput(draft);
    if (!input.ok) {
      throw new Error(JSON.stringify(input.violations));
    }
    await new SqliteSessionRepository(database, ids("ses"), () => NOW).create(input.value);
    const before = await dumpAll(database);

    await initializeDatabase(database);
    database = reopen(database);
    await initializeDatabase(database);
    database = reopen(database);

    // PRE-7 (R-3) : démarrage complet (012 puis 013, une seule fois chacune).
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await dumpAll(database)).toEqual(before);
    expect(await count(database, "migration_notices")).toBe(1);
    expect(await count(database, "activity_definitions")).toBe(1);
    expect(await count(database, "sessions")).toBe(1);
  });

  it("base v11 sans Exercice ni Séance : version 12, référentiels conservés, aucun avis", async () => {
    let database = await seededVersion11({ exercises: false });
    const kept = await referentials(database);
    await migrateTo12(database);
    database = reopen(database);

    expect(await version(database)).toBe(12);
    expect(await referentials(database)).toEqual(kept);
    expect(await count(database, "migration_notices")).toBe(0);
    expect(await new SqliteMigrationNoticeRepository(database).findUnacknowledged()).toBeNull();
  });

  it("installation neuve : version courante directement, référentiels initiaux, aucun avis", async () => {
    let database = open();
    await initializeDatabase(database);
    database = reopen(database);

    // PRE-7 (R-3) : le démarrage atteint la version courante (13).
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await count(database, "migration_notices")).toBe(0);
    expect(await count(database, "categories")).toBeGreaterThan(0);
    expect(await count(database, "body_zones")).toBeGreaterThan(0);
    expect(await count(database, "profiles")).toBe(1);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it.each([
    { label: "sur la suppression des Séances", pattern: /^DELETE FROM sessions$/ },
    { label: "sur la création des occurrences, après les DROP", pattern: /^CREATE TABLE activities \(/ },
    { label: "sur l'écriture de l'avis, après toute la recréation", pattern: /INSERT INTO migration_notices/ },
  ])("erreur injectée $label : annulation complète, user_version = 11, base identique ; la nouvelle tentative réussit", async ({ pattern }) => {
    let database = await seededVersion11();
    const before = await dumpAll(database);

    const failing = failOnWrite(database, pattern);
    await expect(migrateDatabase(failing.database, () => NOW, 12)).rejects.toThrow("Injected failure");
    expect(failing.state.armed).toBe(false);
    database = reopen(database);

    expect(await version(database)).toBe(11);
    expect(await dumpAll(database)).toEqual(before);

    await migrateTo12(database);
    database = reopen(database);
    expect(await version(database)).toBe(12);
    expect(await database.getAllAsync("SELECT kind, count FROM migration_notices")).toEqual([
      { kind: "EXERCISES_AND_SESSIONS_RESET", count: 4 },
    ]);
  });

  it("aucune réinitialisation aux lancements suivants : le Mouvement et sa définition, recréés, survivent à une relance", async () => {
    let database = await seededVersion11({ exercises: false });
    await initializeDatabase(database);
    const movements = new SqliteMovementRepository(database, ids("mov"), () => NOW);
    await movements.create({
      id: "mov-1",
      name: "Gainage",
      description: null,
      media: [],
      categoryId: "cardio",
      bodyZoneIds: ["dos"],
      phases: [],
      nextPhaseId: 1,
      aliases: [],
      levelGroup: null,
    });
    database = reopen(database);
    await initializeDatabase(database);
    expect(await new SqliteMovementRepository(database).findById("mov-1")).toMatchObject({ id: "mov-1", name: "Gainage" });
  });
});
