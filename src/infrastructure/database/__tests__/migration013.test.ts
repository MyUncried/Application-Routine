import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { MIGRATION_NOTICE_EXERCISES_AND_SESSIONS_RESET } from "@/infrastructure/database/migrations/migration012";
import { buildVersion11 } from "@/infrastructure/database/testing/buildVersion11";
import { failOnWrite } from "@/infrastructure/database/testing/failOnWrite";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-7 (R-3, D-445 C05, arbitrage de Hermann du 26/10/2026, Q1 et Q2) —
 * `migration013` sur une COPIE de base FICHIER au schéma 012 (`node:sqlite`) :
 * migrations 001 à 011 du code de départ (`buildVersion11`), puis 012 par le
 * chemin du démarrage (`targetVersion` 12) ; base peuplée de données de
 * recette par `INSERT` directs au schéma 012 (Profil, Catégories, Zones et
 * Étiquettes personnalisés ; Mouvements, Niveaux, Exercices, Séances,
 * occurrences, médias) ; migrée par `initializeDatabase`, puis relue par une
 * NOUVELLE connexion. Une suite verte ne vaut pas recette sur appareil
 * (jalon JA1-bis).
 */

const NOW = "2026-10-26T08:00:00.000Z";
const T = "2026-10-25T00:00:00.000Z";

const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre7-r3");
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

async function version(database: Database): Promise<number> {
  return (await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? -1;
}

async function count(database: Database, table: string): Promise<number> {
  return (await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`))?.count ?? -1;
}

async function tableNames(database: Database): Promise<string[]> {
  const rows = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  return rows.map((row) => row.name);
}

async function columns(database: Database, table: string): Promise<string[]> {
  const rows = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.map((row) => row.name);
}

/** Profil, Catégories, Zones, Étiquettes et avis : les données conservées par Q2. */
async function preserved(database: Database): Promise<Record<string, unknown>> {
  return {
    users: await database.getAllAsync("SELECT * FROM users"),
    profiles: await database.getAllAsync("SELECT * FROM profiles"),
    categories: await database.getAllAsync("SELECT * FROM categories ORDER BY id"),
    body_zones: await database.getAllAsync("SELECT * FROM body_zones ORDER BY id"),
    labels: await database.getAllAsync("SELECT * FROM labels ORDER BY id"),
  };
}

/** Personnalisations à conserver (Q2) : Profil, Catégories et Zones créées, renommées et retirées, Étiquettes. */
async function personalize(database: Database): Promise<void> {
  await database.runAsync(
    `UPDATE profiles SET side_change_recovery_seconds_default = 17, post_activity_recovery_seconds_default = 42,
       exercise_countdown_seconds_default = 7, sounds_enabled = 0, display_name = 'Hermann', silhouette = 'homme'`,
  );
  await database.runAsync(
    `INSERT INTO categories (id, name, canonical_key, is_predefined, display_order, created_at, color, is_active)
     VALUES ('cat-custom', 'Escalade', 'escalade', 0, NULL, '2026-01-01T00:00:00.000Z', '#2E9B62', 1)`,
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
     VALUES ('label-1', 'Matin', '#E5484D', 1, '2026-01-01T00:00:00.000Z', 'matin')`,
  );
}

/** Données de recette au schéma 012 (formes v4) : Mouvements groupés, Exercices, Séance, occurrence, médias. */
async function populateVersion12(database: Database): Promise<void> {
  await database.runAsync("INSERT INTO media_assets (id, uri, created_at) VALUES ('asset-1', 'kodjo-media/asset-1', ?)", [T]);
  for (const [id, name, sort] of [
    ["mv-1", "Pompes", 1],
    ["mv-2", "pompes", 2],
  ] as const) {
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, used,
         level_group_id, level_sort_key, created_at, updated_at)
       VALUES (?, ?, 'pompes', NULL, 'cat-custom', 3, 1, 'group-1', ?, ?, ?)`,
      [id, name, sort, T, T],
    );
    await database.runAsync(
      "INSERT INTO movement_phases (movement_id, phase_id, position, label) VALUES (?, 1, 0, 'Descente'), (?, 2, 1, 'Montée')",
      [id, id],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, 'zone-custom')", [id]);
  }
  await database.runAsync(
    "INSERT INTO movement_media (id, movement_id, asset_id, position) VALUES ('mm-1', 'mv-1', 'asset-1', 0)",
  );
  const catalog =
    '{"version":4,"mode":"DURATION","series":{"kind":"UNIFORM","count":3,"target":{"kind":"NUMBER","value":30},"pauseSeconds":15,' +
    '"loadKg":0,"phaseDurations":[{"phaseId":1,"durationSeconds":5},{"phaseId":2,"durationSeconds":2}]},"sideMode":"UNILATERAL",' +
    '"sideOrder":"BY_SIDE","sideRecoverySeconds":0,"cadenceBeepIntervalSeconds":0,"countdownSeconds":0,"endSeconds":0,"loadEnabled":false}';
  for (const [id, movement] of [
    ["def-1", "mv-1"],
    ["def-2", "mv-2"],
  ] as const) {
    await database.runAsync(
      "INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [id, movement, catalog, T, T],
    );
  }
  const user = await database.getFirstAsync<{ id: string }>("SELECT id FROM users WHERE singleton_key = 1");
  await database.runAsync(
    `INSERT INTO sessions (id, owner_id, name, label_id, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
     VALUES ('session-1', ?, 'Séance', 'label-1', 'ACTIVE', 10, 5, ?, ?)`,
    [user!.id, T, T],
  );
  await database.runAsync("INSERT INTO cycles (id, session_id, position, repeat_count) VALUES ('cycle-1', 'session-1', 1, 1)");
  await database.runAsync(
    "INSERT INTO tours (id, cycle_id, session_id, position, repeat_count, side_mode, nature) VALUES ('tour-1', 'cycle-1', 'session-1', 1, 1, 'UNILATERAL', 'TOURS')",
  );
  const resolved = catalog
    .replace('"version":4', '"version":4')
    .replace(
      '"phaseDurations":[{"phaseId":1,"durationSeconds":5},{"phaseId":2,"durationSeconds":2}]',
      '"workPhases":[{"id":1,"label":"Descente","durationSeconds":5},{"id":2,"label":"Montée","durationSeconds":2}]',
    );
  await database.runAsync(
    `INSERT INTO activities (
       id, session_id, cycle_id, tour_id, type, structural_position, position, name,
       execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
       post_activity_recovery_seconds, post_activity_recovery_present, instruction, created_at, updated_at, side_mode,
       execution_parameters, category_id, source_movement_id
     ) VALUES ('occ-1', 'session-1', 'cycle-1', 'tour-1', 'EXERCISE', 'IN_TOUR', 0, 'Pompes (copie)',
       'DURATION', 30, NULL, 3, 15, 0, 0, NULL, ?, ?, 'UNILATERAL', ?, 'cat-custom', 'mv-1')`,
    [T, T, resolved],
  );
  await database.runAsync("INSERT INTO activity_body_zones (activity_id, body_zone_id) VALUES ('occ-1', 'zone-custom')");
  await database.runAsync(
    "INSERT INTO session_activity_media (id, activity_id, asset_id, position) VALUES ('sm-1', 'occ-1', 'asset-1', 0)",
  );
  await database.runAsync(
    "INSERT INTO session_stop_points (id, session_id, scope, position) VALUES ('stop-1', 'session-1', 'IN_TOUR', 0)",
  );
}

/** Copie de base au schéma 012, peuplée ou non, rouverte. */
async function seededVersion12(options: { readonly populated: boolean } = { populated: true }): Promise<NodeSqliteDatabase> {
  const database = open();
  await buildVersion11(database);
  await personalize(database);
  await migrateDatabase(database, () => T, 12);
  expect(await version(database)).toBe(12);
  if (options.populated) {
    await populateVersion12(database);
  }
  expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  return reopen(database);
}

describe("migration013 — réinitialisation ponctuelle et modèle C05 (R-3, Q1, Q2)", () => {
  it("version 13 suivie de la 14 (PRE-8, A.3) puis de la 15 (PRE-8, B.8)", () => {
    expect(DATABASE_VERSION).toBe(15);
  });

  it("réinitialise Mouvements, Niveaux, Exercices et Séances une seule fois et conserve Profil, Catégories, Zones et Étiquettes", async () => {
    let database = await seededVersion12();
    const before = await preserved(database);
    const noticesBefore = await count(database, "migration_notices");

    await migrateDatabase(database, () => NOW, 13);
    database = reopen(database);

    expect(await version(database)).toBe(13);
    expect(await preserved(database)).toEqual(before);
    for (const table of [
      "movements",
      "movement_aliases",
      "movement_phases",
      "movement_body_zones",
      "movement_media",
      "activity_definitions",
      "sessions",
      "cycles",
      "tours",
      "activities",
      "session_stop_points",
      "media_assets",
    ]) {
      expect(await count(database, table)).toBe(0);
    }
    // 2 Exercices + 1 Séance : un avis, compte 3, non acquitté.
    expect(await count(database, "migration_notices")).toBe(noticesBefore + 1);
    const notice = await database.getFirstAsync<{ kind: string; count: number; created_at: string; acknowledged_at: string | null }>(
      "SELECT kind, count, created_at, acknowledged_at FROM migration_notices ORDER BY id DESC LIMIT 1",
    );
    expect(notice).toEqual({ kind: MIGRATION_NOTICE_EXERCISES_AND_SESSIONS_RESET, count: 3, created_at: NOW, acknowledged_at: null });
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);

    // Démarrage suivant : aucune réinitialisation, aucun avis.
    await database.runAsync(
      "INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at) VALUES ('mv-new', 'Squat', 'squat', NULL, 'cardio', 1, ?, ?)",
      [T, T],
    );
    await initializeDatabase(database);
    database = reopen(database);
    // PRE-8 : le démarrage suivant applique la 014 (conversion sans perte), jamais la 013 à nouveau.
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await count(database, "movements")).toBe(1);
    expect(await count(database, "migration_notices")).toBe(noticesBefore + 1);
  });

  it("base au schéma 012 vide : aucun avis", async () => {
    let database = await seededVersion12({ populated: false });
    const notices = await count(database, "migration_notices");
    await migrateDatabase(database, () => NOW, 13);
    database = reopen(database);
    expect(await version(database)).toBe(13);
    expect(await count(database, "migration_notices")).toBe(notices);
  });

  it("installation neuve : 001 à 014, aucun avis", async () => {
    let database = open();
    await initializeDatabase(database);
    database = reopen(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await count(database, "migration_notices")).toBe(0);
  });

  it("schéma C05 : occurrence sans contenu, clé étrangère vers le Mouvement, numéro de copie ; nom unique ; alias", async () => {
    let database = await seededVersion12();
    await migrateDatabase(database, () => NOW, 13);
    database = reopen(database);

    const tables = await tableNames(database);
    expect(tables).toContain("movement_aliases");
    expect(tables).not.toContain("activity_body_zones");
    expect(tables).not.toContain("session_activity_media");

    const activityColumns = await columns(database, "activities");
    expect(activityColumns).toEqual(expect.arrayContaining(["source_movement_id", "copy_number", "execution_parameters"]));
    for (const removed of ["name", "instruction", "category_id"]) {
      expect(activityColumns).not.toContain(removed);
    }
    expect(await columns(database, "movements")).not.toContain("used");

    const keys = await database.getAllAsync<{ table: string; from: string; on_delete: string }>(
      "SELECT \"table\", \"from\", on_delete FROM pragma_foreign_key_list('activities')",
    );
    expect(keys).toEqual(expect.arrayContaining([{ table: "movements", from: "source_movement_id", on_delete: "RESTRICT" }]));

    // C01 : nom principal unique sur la clé canonique, même en écriture directe.
    await database.runAsync(
      "INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at) VALUES ('a', 'Squat', 'squat', NULL, 'cardio', 1, ?, ?)",
      [T, T],
    );
    await expect(
      database.runAsync(
        "INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at) VALUES ('b', 'squat', 'squat', NULL, 'cardio', 1, ?, ?)",
        [T, T],
      ),
    ).rejects.toThrow();
    // Alias partageables entre Mouvements, uniques dans leur Mouvement.
    await database.runAsync(
      "INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at) VALUES ('c', 'Fente', 'fente', NULL, 'cardio', 1, ?, ?)",
      [T, T],
    );
    await database.runAsync(
      "INSERT INTO movement_aliases (movement_id, position, alias, normalized_alias) VALUES ('a', 0, 'Flexion', 'flexion'), ('c', 0, 'flexion', 'flexion')",
    );
    await expect(
      database.runAsync(
        "INSERT INTO movement_aliases (movement_id, position, alias, normalized_alias) VALUES ('a', 1, 'FLEXION', 'flexion')",
      ),
    ).rejects.toThrow();
  });

  it("une erreur annule tout et laisse la base au schéma 012", async () => {
    let database = await seededVersion12();
    const failing = failOnWrite(database, /^CREATE TABLE activities/);
    await expect(migrateDatabase(failing.database, () => NOW)).rejects.toThrow("Injected failure");
    database = reopen(database);
    expect(await version(database)).toBe(12);
    expect(await count(database, "activity_definitions")).toBe(2);
    expect(await count(database, "activities")).toBe(1);
    expect(await columns(database, "movements")).toContain("used");
  });
});
