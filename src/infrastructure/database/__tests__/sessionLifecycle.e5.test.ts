import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { StructureExerciseInput, StructuredSessionInput } from "@/domain/sessions/structuredInput";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { failOnWrite } from "@/infrastructure/database/testing/failOnWrite";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-8 (epic E, story E.5) — cycle de vie d'une Séance sur SQLite réelle, sans migration :
 * ACTIVE ↔ ARCHIVED, suppression définitive transactionnelle depuis les archives, Mouvements
 * conservés, échec atomique, double action sans effet.
 */

let database: NodeSqliteDatabase;
let clock = "2026-10-28T08:00:00.000Z";
let sequence = 0;
const repository = (db = database) => new SqliteSessionRepository(db as never, () => `gen-${++sequence}`, () => clock);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  await database.runAsync(
    `INSERT INTO movements (id, name, normalized_name, description, category_id, next_phase_id, created_at, updated_at)
     VALUES ('mv-squat', 'Squat', 'squat', NULL, 'cardio', 1, ?, ?)`,
    [clock, clock],
  );
  await database.runAsync("INSERT INTO movement_body_zones (movement_id, body_zone_id) VALUES ('mv-squat', 'dos')");
});

afterEach(() => {
  database.close();
});

const exercise = (id: string): StructureExerciseInput => ({
  id,
  type: "EXERCISE",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: 0,
  sourceMovementId: "mv-squat",
});

const input = (): StructuredSessionInput => ({
  name: "Séance à cycles",
  labelId: null,
  initialCountdownSeconds: 10,
  finalPhaseSeconds: 5,
  structure: {
    elements: [
      { kind: "EXERCISE", exercise: exercise("e0") },
      { kind: "CYCLE", cycle: { id: "cy", repeatCount: 2, circuits: [{ id: "c1", repeatCount: 3, nature: "TOURS", exercises: [exercise("e1"), exercise("e2")] }] } },
    ],
    stopPoints: [],
  },
});

const count = async (sql: string, parameters: readonly string[] = []) =>
  (await database.getFirstAsync<{ n: number }>(sql, parameters as never))!.n;

describe("PRE-8 E.5 — transitions", () => {
  it("archive une Séance active, la restaure à l'identique ; contenu et date de modification inchangés", async () => {
    const created = await repository().createStructured(input());
    clock = "2026-10-28T09:00:00.000Z";
    expect(await repository().archive(created.id)).toEqual({ status: "DONE" });
    expect(await database.getFirstAsync("SELECT status, archived_at, updated_at FROM sessions WHERE id = ?", [created.id])).toEqual({
      status: "ARCHIVED",
      archived_at: "2026-10-28T09:00:00.000Z",
      updated_at: "2026-10-28T08:00:00.000Z",
    });
    expect((await repository().listActive()).map((summary) => summary.id)).toEqual([]);
    expect(await repository().restore(created.id)).toEqual({ status: "DONE" });
    expect(await database.getFirstAsync("SELECT status, archived_at FROM sessions WHERE id = ?", [created.id])).toEqual({
      status: "ACTIVE",
      archived_at: null,
    });
    expect((await repository().findStructuredById(created.id))!.structure).toEqual(created.structure);
  });

  it("double action ou état inattendu : rien n'est écrit", async () => {
    const created = await repository().createStructured(input());
    expect(await repository().restore(created.id)).toEqual({ status: "INVALID_STATE" });
    expect(await repository().deleteArchived(created.id)).toEqual({ status: "INVALID_STATE" });
    expect(await repository().archive(created.id)).toEqual({ status: "DONE" });
    expect(await repository().archive(created.id)).toEqual({ status: "INVALID_STATE" });
    expect(await repository().archive("inconnue")).toEqual({ status: "NOT_FOUND" });
    expect(await count("SELECT COUNT(*) AS n FROM sessions")).toBe(1);
  });

  it("une Séance archivée n'est ni modifiable ni dupliquée (règles existantes)", async () => {
    const created = await repository().createStructured(input());
    await repository().archive(created.id);
    const service = new SessionService(repository());
    expect(await service.getSessionForEdit(created.id)).toEqual({ status: "ARCHIVED" });
    expect(await service.duplicateSession(created.id, () => "copy")).toEqual({ status: "NOT_FOUND" });
  });

  it("recette du 28/10 (e5-12) : une Séance archivée se relit pour la Composition en lecture seule, sans écriture", async () => {
    const created = await repository().createStructured({
      ...input(),
      name: "Séance à un Circuit",
      structure: {
        elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 3, nature: "TOURS", exercises: [exercise("e1"), exercise("e2")] } }],
        stopPoints: [],
      },
    });
    await repository().archive(created.id);
    const before = await database.getFirstAsync("SELECT status, archived_at, updated_at FROM sessions WHERE id = ?", [created.id]);
    const service = new SessionService(repository());
    const session = await service.getSessionForConsultation(created.id);
    expect(session).toMatchObject({ id: created.id, name: "Séance à un Circuit" });
    expect(session?.cycle.tour.repeatCount).toBe(3);
    expect(await service.getSessionForConsultation("inconnue")).toBeNull();
    expect(await database.getFirstAsync("SELECT status, archived_at, updated_at FROM sessions WHERE id = ?", [created.id])).toEqual(before);
  });

  it("R-E6 : une Séance archivée plus riche que l'ancien modèle n'est pas tronquée (erreur explicite)", async () => {
    const created = await repository().createStructured(input());
    await repository().archive(created.id);
    await expect(new SessionService(repository()).getSessionForConsultation(created.id)).rejects.toThrow("cannot represent");
  });
});

describe("PRE-8 E.5 — suppression définitive", () => {
  // Schéma courant : seules `cycles`, `tours`, `activities` et `session_stop_points` référencent la
  // Séance, toutes en ON DELETE CASCADE (médias et catégories d'occurrence retirés depuis PRE-7, R-3).
  it("retire la Séance et toute sa composition, jamais le Mouvement référencé", async () => {
    const created = await repository().createStructured(input());
    const other = await repository().createStructured({ ...input(), name: "Autre", structure: { elements: [{ kind: "EXERCISE", exercise: exercise("o1") }], stopPoints: [] } });
    await repository().archive(created.id);

    expect(await repository().deleteArchived(created.id)).toEqual({ status: "DONE" });

    expect(await count("SELECT COUNT(*) AS n FROM sessions WHERE id = ?", [created.id])).toBe(0);
    for (const table of ["cycles", "tours", "activities", "session_stop_points"]) {
      expect(await count(`SELECT COUNT(*) AS n FROM ${table} WHERE session_id = ?`, [created.id])).toBe(0);
    }
    expect(await count("SELECT COUNT(*) AS n FROM movements WHERE id = 'mv-squat'")).toBe(1);
    expect(await count("SELECT COUNT(*) AS n FROM activities WHERE session_id = ?", [other.id])).toBe(1);
  });

  it("échec en cours d'écriture : annulation complète, Séance intacte", async () => {
    const created = await repository().createStructured(input());
    await repository().archive(created.id);
    const failing = failOnWrite(database, /^DELETE FROM sessions/);
    await expect(repository(failing.database as never).deleteArchived(created.id)).rejects.toThrow("Injected failure");
    expect(await count("SELECT COUNT(*) AS n FROM activities WHERE session_id = ?", [created.id])).toBe(3);
    expect(await database.getFirstAsync("SELECT status FROM sessions WHERE id = ?", [created.id])).toEqual({ status: "ARCHIVED" });
  });

  it("échec de l'archivage : statut inchangé", async () => {
    const created = await repository().createStructured(input());
    const failing = failOnWrite(database, /^UPDATE sessions/);
    await expect(repository(failing.database as never).archive(created.id)).rejects.toThrow("Injected failure");
    expect(await database.getFirstAsync("SELECT status, archived_at FROM sessions WHERE id = ?", [created.id])).toEqual({
      status: "ACTIVE",
      archived_at: null,
    });
  });
});
