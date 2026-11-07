import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { normalizeMovementName } from "@/domain/activities/Movement";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { initializeDatabase } from "@/infrastructure/database/initializeDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-8 (story B.8) — `migration015` sur une COPIE de base FICHIER au schéma 014 : colonne
 * additive `movements.archived_at`, aucun Mouvement archivé, aucune ligne supprimée ni réécrite
 * (familles et clés de tri comprises). Migrée par le chemin du démarrage (`initializeDatabase`),
 * relue par une nouvelle connexion. Une suite verte ne vaut pas recette sur appareil.
 */

const T = "2026-10-27T08:00:00.000Z";
const WORK_DIRECTORY = join(process.cwd(), "node_modules", ".cache", "kodjo-pre8-b8");
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

/**
 * Base au schéma 014, avec une famille de trois Niveaux et un Mouvement indépendant.
 * [PRE-9 A.2b, 31/10/2026 : écrite en SQL au schéma 014 — le dépôt courant lit
 * `movement_phases.duration_seconds` (`migration018`), absente d'une base 014. Mêmes lignes que
 * l'ancienne écriture par le dépôt (famille `grp-1` : assistés 0, Squats 1, sautés 2).]
 */
async function seedAt014(): Promise<NodeSqliteDatabase> {
  const database = open();
  await migrateDatabase(database, () => T, 14);
  const rows: readonly (readonly [string, string, string | null, number | null])[] = [
    ["squat", "Squats", "grp-1", 1],
    ["assist", "Squats assistés", "grp-1", 0],
    ["jump", "Squats sautés", "grp-1", 2],
    ["fentes", "Fentes avant", null, null],
  ];
  for (const [id, name, groupId, sortKey] of rows) {
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, level_group_id, level_sort_key, created_at, updated_at)
       VALUES (?, ?, ?, NULL, 'cardio', 1, ?, ?, ?, ?)`,
      [id, name, normalizeMovementName(name), groupId, sortKey, T, T],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES (?, 'cuisses')", [id]);
  }
  return database;
}

/** Enveloppe de test : la colonne est réellement ajoutée, puis la lecture suivante de `users` échoue. */
function failAfterColumn(inner: Database): Database {
  let added = false;
  const wrap = (handle: Database): Database => ({
    execAsync: async (source) => {
      await handle.execAsync(source);
      if (source.includes("ADD COLUMN archived_at")) added = true;
    },
    runAsync: (source, parameters) => handle.runAsync(source, parameters),
    getFirstAsync: (source, parameters) => {
      if (added && source.includes("FROM users")) throw new Error("Injected failure");
      return handle.getFirstAsync(source, parameters);
    },
    getAllAsync: (source, parameters) => handle.getAllAsync(source, parameters),
    withExclusiveTransactionAsync: (task) => handle.withExclusiveTransactionAsync(async (transaction) => task(wrap(transaction))),
  });
  return wrap(inner);
}

const MOVEMENT_SNAPSHOT =
  "SELECT id, name, normalized_name, category_id, level_group_id, level_sort_key, created_at, updated_at FROM movements ORDER BY id";

describe("PRE-8 B.8 — migration 015 (archivage du Mouvement)", () => {
  it("ajoute archived_at sans archiver ni réécrire aucun Mouvement, familles et ordre conservés", async () => {
    let database = await seedAt014();
    expect(await version(database)).toBe(14);
    const before = await database.getAllAsync(MOVEMENT_SNAPSHOT);
    database = reopen(database);

    await initializeDatabase(database);
    database = reopen(database);

    // PRE-9 (A.1) : le démarrage enchaîne 015 puis 016.
    expect(DATABASE_VERSION).toBe(23);
    expect(await version(database)).toBe(DATABASE_VERSION);
    expect(await database.getAllAsync(MOVEMENT_SNAPSHOT)).toEqual(before);
    expect(await database.getAllAsync("SELECT id FROM movements WHERE archived_at IS NOT NULL")).toEqual([]);
    expect(await new SqliteMovementRepository(database).listArchivedIds()).toEqual(new Set());
  });

  it("une erreur annule tout et laisse la base au schéma 014", async () => {
    let database = await seedAt014();
    const before = await database.getAllAsync(MOVEMENT_SNAPSHOT);
    // Échec injecté APRÈS l'ajout de la colonne, au contrôle final de l'utilisateur local : l'ajout
    // lui-même doit être annulé avec le reste de la transaction.
    const failing = failAfterColumn(database);
    await expect(migrateDatabase(failing, () => T)).rejects.toThrow("Injected failure");
    database = reopen(database);
    expect(await version(database)).toBe(14);
    const columns = (await database.getAllAsync<{ name: string }>("PRAGMA table_info(movements)")).map((row) => row.name);
    expect(columns).not.toContain("archived_at");
    expect(await database.getAllAsync(MOVEMENT_SNAPSHOT)).toEqual(before);
  });

  it("installation neuve : schéma courant directement (015, puis 016 en PRE-9), colonne présente", async () => {
    const database = open();
    await initializeDatabase(database);
    expect(await version(database)).toBe(DATABASE_VERSION);
    const columns = (await database.getAllAsync<{ name: string }>("PRAGMA table_info(movements)")).map((row) => row.name);
    expect(columns).toContain("archived_at");
  });
});
