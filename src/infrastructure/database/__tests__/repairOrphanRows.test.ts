import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { StructureExerciseInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { repairOrphanRows, SESSION_TREE_TABLES } from "@/infrastructure/database/repairOrphanRows";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Recette iPhone du 20/11/2026 : « utilisé par 51 exercices » avec deux Séances visibles, aucune archivée. Sur
 * l'appareil, les transactions exclusives s'exécutaient sans `foreign_keys = ON` : une Séance supprimée laissait ses
 * Exercices, Circuits et Cycles. Ces lignes orphelines sont retirées au démarrage, comme la cascade l'aurait fait.
 */

let database: NodeSqliteDatabase;
const clock = "2026-11-20T08:00:00.000Z";
let sequence = 0;

beforeEach(() => {
  database = NodeSqliteDatabase.openInMemory();
});

afterEach(() => {
  database.close();
});

const count = async (sql: string) => (await database.getFirstAsync<{ n: number }>(sql))!.n;

const ALL = ["parents", "children", "grandchildren", "notes", "guarded", "pairs", "pair_links"];

describe("repairOrphanRows — règles déclarées", () => {
  beforeEach(async () => {
    await database.execAsync(`
      CREATE TABLE parents (id TEXT PRIMARY KEY);
      CREATE TABLE children (id TEXT PRIMARY KEY, parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE);
      CREATE TABLE grandchildren (id TEXT PRIMARY KEY, child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE);
      CREATE TABLE notes (id TEXT PRIMARY KEY, parent_id TEXT REFERENCES parents(id) ON DELETE SET NULL);
      CREATE TABLE guarded (id TEXT PRIMARY KEY, parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE RESTRICT);
      CREATE TABLE pairs (a TEXT, b TEXT, PRIMARY KEY (a, b)) WITHOUT ROWID;
      CREATE TABLE pair_links (id TEXT PRIMARY KEY, a TEXT, b TEXT, FOREIGN KEY (a, b) REFERENCES pairs ON DELETE CASCADE);
      INSERT INTO parents VALUES ('p1'), ('p2');
      INSERT INTO children VALUES ('c1', 'p1'), ('c2', 'p2');
      INSERT INTO grandchildren VALUES ('g1', 'c1'), ('g2', 'c2');
      INSERT INTO notes VALUES ('n1', 'p1'), ('n2', 'p2'), ('n3', NULL);
      INSERT INTO guarded VALUES ('r1', 'p1');
      INSERT INTO pairs VALUES ('x', 'y'), ('x', 'z');
      INSERT INTO pair_links VALUES ('l1', 'x', 'y'), ('l2', 'x', 'z');
    `);
  });

  it("base cohérente : aucune écriture", async () => {
    expect(await repairOrphanRows(database, ALL)).toEqual({ deleted: {}, nulled: {}, unrepaired: 0 });
  });

  // Les petits-enfants partent par la cascade native (clés étrangères actives pendant la réparation).
  it("hors des tables désignées : rien n'est touché", async () => {
    await database.execAsync("PRAGMA foreign_keys = OFF");
    await database.execAsync("DELETE FROM parents WHERE id = 'p1'");
    await database.execAsync("PRAGMA foreign_keys = ON");
    expect(await repairOrphanRows(database, ["grandchildren"])).toEqual({ deleted: {}, nulled: {}, unrepaired: 0 });
    expect(await count("SELECT COUNT(*) AS n FROM children")).toBe(2);
    expect(await count("SELECT COUNT(*) AS n FROM notes WHERE parent_id = 'p1'")).toBe(1);
  });

  it("applique CASCADE en chaîne et SET NULL, compte RESTRICT sans le toucher", async () => {
    await database.execAsync("PRAGMA foreign_keys = OFF");
    await database.execAsync("DELETE FROM parents WHERE id = 'p1'; DELETE FROM pairs WHERE b = 'z'");
    await database.execAsync("PRAGMA foreign_keys = ON");

    expect(await repairOrphanRows(database, ALL)).toEqual({
      deleted: { children: 1, pair_links: 1 },
      nulled: { notes: 1 },
      unrepaired: 1,
    });
    expect(await database.getAllAsync("SELECT id FROM children")).toEqual([{ id: "c2" }]);
    expect(await database.getAllAsync("SELECT id FROM grandchildren")).toEqual([{ id: "g2" }]);
    expect(await database.getAllAsync("SELECT id, parent_id FROM notes ORDER BY id")).toEqual([
      { id: "n1", parent_id: null },
      { id: "n2", parent_id: "p2" },
      { id: "n3", parent_id: null },
    ]);
    expect(await database.getAllAsync("SELECT id FROM guarded")).toEqual([{ id: "r1" }]);
    expect(await database.getAllAsync("SELECT id FROM pair_links")).toEqual([{ id: "l1" }]);
  });
});

describe("repairOrphanRows — Séance supprimée sans cascade (schéma réel)", () => {
  const exercise = (id: string): StructureExerciseInput => ({
    id,
    type: "EXERCISE",
    executionParameters: durationParameters(30),
    postActivityRecoverySeconds: 0,
    sourceMovementId: "mv-squat",
  });
  const input = (name: string): StructuredSessionInput => ({
    name,
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    structure: {
      elements: [
        { kind: "EXERCISE", exercise: exercise(`${name}-e0`) },
        { kind: "CYCLE", cycle: { id: `${name}-cy`, repeatCount: 2, members: [{ kind: "CIRCUIT" as const, circuit: { id: `${name}-c1`, repeatCount: 3, nature: "TOURS" as const, exercises: [exercise(`${name}-e1`), exercise(`${name}-e2`)] } }] } },
      ],
      stopPoints: [],
    },
  });

  it("le démarrage retire les Exercices orphelins ; le Mouvement archivé redevient supprimable", async () => {
    await migrateDatabase(database);
    await database.runAsync(
      `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
       VALUES ('mv-squat', 'Squat', 'squat', NULL, 'cardio', 1, ?, ?)`,
      [clock, clock],
    );
    await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-squat', 'dos')");
    const sessions = new SqliteSessionRepository(database as never, () => `gen-${++sequence}`, () => clock);
    const kept = await sessions.createStructured(input("gardée"));
    const removed = await sessions.createStructured(input("supprimée"));
    const movements = new SqliteMovementRepository(database as never, () => `mv-${++sequence}`, () => clock);

    // Suppression telle que l'appareil la faisait : clés étrangères inactives, aucune cascade.
    await database.execAsync("PRAGMA foreign_keys = OFF");
    await database.runAsync("DELETE FROM sessions WHERE id = ?", [removed.id]);
    await database.execAsync("PRAGMA foreign_keys = ON");
    expect(await count(`SELECT COUNT(*) AS n FROM activities WHERE session_id = '${removed.id}'`)).toBe(3);
    expect(await movements.countOccurrences("mv-squat")).toBe(6);

    await migrateDatabase(database);

    expect(await count(`SELECT COUNT(*) AS n FROM activities WHERE session_id = '${removed.id}'`)).toBe(0);
    expect(await count(`SELECT COUNT(*) AS n FROM tours WHERE session_id = '${removed.id}'`)).toBe(0);
    expect(await count(`SELECT COUNT(*) AS n FROM cycles WHERE session_id = '${removed.id}'`)).toBe(0);
    expect(await count(`SELECT COUNT(*) AS n FROM activities WHERE session_id = '${kept.id}'`)).toBe(3);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    expect(SESSION_TREE_TABLES).toEqual(["cycles", "tours", "activities", "session_stop_points"]);
    expect(await movements.countOccurrences("mv-squat")).toBe(3);

    // Une fois la Séance gardée supprimée normalement (cascade), le Mouvement archivé se supprime.
    await sessions.archive(kept.id);
    await sessions.deleteArchived(kept.id);
    expect(await movements.archive("mv-squat")).toEqual({ status: "ARCHIVED" });
    expect(await movements.deleteArchived("mv-squat")).toEqual({ status: "DELETED" });
  });
});
