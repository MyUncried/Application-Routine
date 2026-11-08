import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { durationParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { applyLayoutNatureChange, setLayoutCircuitCount } from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, createExerciseDraft, toSessionDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, structureExercises } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (story B.3, COMP §2 et §3, ch10 « Nombre imposé et diminution », ARB-10) — aller-retour en
 * base (SQLite réelle, `node:sqlite`) d'une Séance à deux Circuits de natures différentes : nature et
 * N de chaque Circuit, séries actives seulement (la réserve du brouillon n'est jamais enregistrée),
 * Cible 0 conservée ; Exercice de volume nul refusé sans écriture. Aucune migration.
 */

const NOW = "2026-10-31T09:00:00.000Z";

let database: NodeSqliteDatabase;
let sequence = 0;
const repository = () => new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => NOW);
const service = () => new SessionService(repository(), undefined, () => `container-${++sequence}`);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

const exercise = (id: string, executionParameters: SessionDraftExercise["executionParameters"]): SessionDraftExercise => ({
  ...createExerciseDraft(id),
  name: `Exercice ${id}`,
  executionParameters,
});

/** E0, Circuit A alterné × 3 [a1 (12 · 0 · 15 rép.), a2 (3 × 30 s)], Cycle × 2 [Circuit B groupé × 2 [b1 (5 × 30 s)]], E9. */
function twoNaturesDraft(): SessionDraft {
  return withLocalMovements({
    ...createEmptyDraft(),
    name: "Deux Circuits",
    exercises: [
      exercise("e0", durationParameters(30, 1)),
      exercise("a1", variableParameters({ mode: "REPETITIONS", rows: [[12, 10], [0, 10], [15, 10]] })),
      exercise("a2", durationParameters(30, 3)),
      exercise("b1", durationParameters(30, 5)),
      exercise("e9", durationParameters(45, 1)),
    ],
    structure: {
      elements: [
        { kind: "EXERCISE", exercise: "e0" },
        { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 3, nature: "SERIES", exercises: ["a1", "a2"] } },
        {
          kind: "CYCLE",
          cycle: { id: "cy", repeatCount: 2, members: [{ kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "TOURS", exercises: ["b1"] } }] },
        },
        { kind: "EXERCISE", exercise: "e9" },
      ],
      stopPoints: [],
    },
  });
}

const targetsOf = (exercises: readonly { readonly id: string; readonly executionParameters: SessionDraftExercise["executionParameters"] }[], id: string) =>
  seriesRowsOf(exercises.find((item) => item.id === id)!.executionParameters).map((row) => (row.target.kind === "NUMBER" ? row.target.value : row.target.kind));

describe("PRE-9 B.3 — séries par Circuit en base", () => {
  it("nature et N de chaque Circuit, Cible 0 et séries actives : enregistrés et relus ; la réserve n'est pas enregistrée", async () => {
    // N du Circuit A ramené à 2 : la série 3 de a1 passe en réserve de brouillon.
    const reduced = setLayoutCircuitCount(twoNaturesDraft(), "ca", 2);
    expect(reduced.circuitSeriesReserve).toBeDefined();
    const created = await service().createSession(reduced);
    if (!created.ok) throw new Error(JSON.stringify(created.violations));

    const reread = (await repository().findStructuredById(created.value.id))!;
    expect(structureCircuits(reread.structure).map(({ id, nature, repeatCount }) => ({ id, nature, repeatCount }))).toEqual([
      { id: "ca", nature: "SERIES", repeatCount: 2 },
      { id: "cb", nature: "TOURS", repeatCount: 2 },
    ]);
    const exercises = structureExercises(reread.structure);
    expect(targetsOf(exercises, "a1")).toEqual([12, 0]);
    expect(targetsOf(exercises, "a2")).toEqual([30, 30]);
    expect(targetsOf(exercises, "b1")).toEqual([30, 30, 30, 30, 30]);
    // Colonnes des Circuits (`tours`, migration 014 / 016) : nature et compte propres à chacun.
    expect(await database.getAllAsync("SELECT id, nature, repeat_count FROM tours ORDER BY id")).toEqual([
      { id: "ca", nature: "SERIES", repeat_count: 2 },
      { id: "cb", nature: "TOURS", repeat_count: 2 },
    ]);

    // Rouverte : brouillon sans réserve ; une augmentation copie la dernière ligne enregistrée (ch10).
    const opened = await service().getSessionForEdit(created.value.id);
    if (opened.status !== "OK") throw new Error(opened.status);
    const draft = toSessionDraft(opened.session);
    expect(draft.circuitSeriesReserve).toBeUndefined();
    expect(targetsOf(setLayoutCircuitCount(draft, "ca", 3).exercises, "a1")).toEqual([12, 0, 0]);
  });

  it("conversion du Circuit B en alternées confirmée : troncature enregistrée ; Circuit A inchangé", async () => {
    const created = await service().createSession(twoNaturesDraft());
    if (!created.ok) throw new Error(JSON.stringify(created.violations));
    const opened = await service().getSessionForEdit(created.value.id);
    if (opened.status !== "OK") throw new Error(opened.status);
    const converted = applyLayoutNatureChange(toSessionDraft(opened.session), "cb", "SERIES");
    expect((await service().updateSession(created.value.id, converted)).status).toBe("UPDATED");
    const reread = (await repository().findStructuredById(created.value.id))!;
    const exercises = structureExercises(reread.structure);
    expect(targetsOf(exercises, "b1")).toEqual([30, 30]);
    expect(targetsOf(exercises, "a1")).toEqual([12, 0, 15]);
    expect(await database.getAllAsync("SELECT id, nature FROM tours ORDER BY id")).toEqual([
      { id: "ca", nature: "SERIES" },
      { id: "cb", nature: "SERIES" },
    ]);
  });

  it("première Cible 0 : colonne historique NULL, Cible relue à 0 ; Exercice de volume nul refusé sans écriture (ARB-10)", async () => {
    const zeroFirst = { ...twoNaturesDraft() };
    const draft = {
      ...zeroFirst,
      exercises: zeroFirst.exercises.map((item) =>
        item.id === "a1" ? { ...item, executionParameters: variableParameters({ mode: "REPETITIONS", rows: [[0, 10], [12, 10], [15, 10]] }) } : item,
      ),
    };
    const created = await service().createSession(draft);
    if (!created.ok) throw new Error(JSON.stringify(created.violations));
    expect(await database.getAllAsync("SELECT repetition_count FROM activities WHERE id = 'a1'")).toEqual([{ repetition_count: null }]);
    const reread = (await repository().findStructuredById(created.value.id))!;
    expect(targetsOf(structureExercises(reread.structure), "a1")).toEqual([0, 12, 15]);

    const before = await database.getAllAsync("SELECT COUNT(*) AS count FROM sessions");
    const allZero = {
      ...draft,
      exercises: draft.exercises.map((item) =>
        item.id === "a2" ? { ...item, executionParameters: variableParameters({ rows: [[0, 10], [0, 10], [0, 10]] }) } : item,
      ),
    };
    const refused = await service().createSession(allZero);
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.violations).toEqual(expect.arrayContaining([expect.objectContaining({ code: "ZERO_VOLUME" })]));
    }
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM sessions")).toEqual(before);
  });
});
