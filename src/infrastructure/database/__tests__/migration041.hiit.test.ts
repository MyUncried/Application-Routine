import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { structureCircuits } from "@/domain/sessions/structure";
import type { StructureExerciseInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import type { Database } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * D-608 (D-573 de la branche de documentation, point 3, Hermann, 26/11/2026) — migration 041 : la clé `HIIT` est admise par
 * `sessions.origin` et `tours.origin_model`, comme les clés des autres modèles. Valeurs existantes conservées, aucune ligne perdue,
 * clés étrangères intactes, clé inconnue toujours refusée, second passage sans effet. Une suite verte ne vaut pas recette.
 */

const T = "2026-11-26T08:00:00.000Z";

async function version(database: Database): Promise<number> {
  return (await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? -1;
}

const exercise = (id: string): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(40, 6, 20),
  postActivityRecoverySeconds: 0,
  sourceMovementId: "mv-squat",
});

const input = (originModel: "HIIT" | "SUPERSET", origin: "HIIT" | "SUPERSET"): StructuredSessionInput => ({
  name: "HIIT",
  labelId: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  origin,
  structure: {
    elements: [{ kind: "CIRCUIT", circuit: { id: `c-${originModel}`, repeatCount: 6, nature: "SERIES", originModel, exercises: [exercise(`a-${originModel}`), exercise(`b-${originModel}`)] } }],
    stopPoints: [],
  },
});

async function seedMovement(database: Database): Promise<void> {
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
     VALUES ('mv-squat', 'Squat', 'squat', NULL, 'cardio', 1, ?, ?)`,
    [T, T],
  );
  await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-squat', 'dos')");
}

describe("D-608 — migration 041 (HIIT admis par le stockage)", () => {
  it("depuis la version 40 (recette : 040 du marquage des photos) : origine et modèle d'origine existants conservés ; HIIT écrit et relu ; clé inconnue refusée ; version 41", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, () => T, 40);
    await seedMovement(database);
    let sequence = 0;
    const before = await new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => T).createStructured(input("SUPERSET", "SUPERSET"));
    // Avant la 041, HIIT est refusé par le CHECK.
    await expect(database.runAsync("UPDATE tours SET origin_model = 'HIIT'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE sessions SET origin = 'HIIT'")).rejects.toThrow();
    const counts = async () => ({
      sessions: (await database.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM sessions"))?.n,
      tours: (await database.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM tours"))?.n,
      activities: (await database.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM activities"))?.n,
    });
    const countsBefore = await counts();

    await migrateDatabase(database, () => T);
    expect(DATABASE_VERSION).toBe(44);
    expect(await version(database)).toBe(44);
    expect(await counts()).toEqual(countsBefore);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    expect(await database.getFirstAsync("SELECT origin FROM sessions WHERE id = ?", [before.id])).toEqual({ origin: "SUPERSET" });
    expect(await database.getAllAsync("SELECT origin_model FROM tours")).toEqual([{ origin_model: "SUPERSET" }]);
    const columns = async (table: string) => (await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map((row) => row.name);
    expect(await columns("sessions")).toContain("origin");
    expect(await columns("tours")).toContain("origin_model");
    expect((await columns("tours")).some((name) => name.endsWith("_v41"))).toBe(false);

    const created = await new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => T).createStructured(input("HIIT", "HIIT"));
    const relu = await new SqliteSessionRepository(database).findStructuredById(created.id);
    expect(relu?.origin).toBe("HIIT");
    expect(structureCircuits(relu!.structure).map((circuit) => circuit.originModel)).toEqual(["HIIT"]);
    await expect(database.runAsync("UPDATE tours SET origin_model = 'CIRCUIT'")).rejects.toThrow();
    await expect(database.runAsync("UPDATE sessions SET origin = 'LIBRE'")).rejects.toThrow();

    // Second démarrage : sans effet.
    await migrateDatabase(database, () => T);
    expect(await version(database)).toBe(44);
    expect(await database.getFirstAsync("SELECT origin FROM sessions WHERE id = ?", [created.id])).toEqual({ origin: "HIIT" });
  });

  it("installation neuve : HIIT admis", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, () => T);
    await seedMovement(database);
    const created = await new SqliteSessionRepository(database, () => "gen-x", () => T).createStructured(input("HIIT", "HIIT"));
    expect((await new SqliteSessionRepository(database).findStructuredById(created.id))?.origin).toBe("HIIT");
  });
});
