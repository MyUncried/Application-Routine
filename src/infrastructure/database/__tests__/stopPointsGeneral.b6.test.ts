import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { moveLayoutStopPoint } from "@/domain/sessions/layoutMoves";
import { createEmptyDraft, createExerciseDraft, toSessionDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import type { StructureElement, StructureStopPointLocation } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 (story B.6, ARB-02a/b, ARB-06 ; colonne `session_stop_points.cycle_id` de la migration 016,
 * A.1) — aller-retour SQLite réelle des Points d'arrêt d'une disposition générale : niveau Séance,
 * dans un Cycle (`cycle_id`), dans un Circuit d'un Cycle (`tour_id`) ; création, ouverture,
 * modification (déplacement d'un Point dans le Cycle), relecture. Aucune migration nouvelle.
 */

let database: NodeSqliteDatabase;
let sequence = 0;
const repository = () => new SqliteSessionRepository(database, () => `gen-${++sequence}`, () => "2026-10-31T09:00:00.000Z");
const service = () => new SessionService(repository(), undefined, () => `container-${++sequence}`);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

const exercise = (id: string) => ({ ...createExerciseDraft(id), name: id, executionParameters: durationParameters(30, 1) });

function generalDraft(): SessionDraft {
  const elements: StructureElement<string>[] = [
    { kind: "EXERCISE", exercise: "e0" },
    {
      kind: "CYCLE",
      cycle: {
        id: "cy",
        repeatCount: 2,
        members: [
          { kind: "EXERCISE", exercise: "c0" },
          { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1", "b2"] } },
        ],
      },
    },
    { kind: "EXERCISE", exercise: "e9" },
  ];
  const stopPoints: (StructureStopPointLocation & { readonly id: string })[] = [
    { id: "p-session", circuitId: null, position: 1 },
    { id: "p-cycle", circuitId: null, cycleId: "cy", position: 1 },
    { id: "p-circuit", circuitId: "cb", position: 1 },
  ];
  return withLocalMovements({
    ...createEmptyDraft(),
    name: "Points partout",
    exercises: ["e0", "c0", "b1", "b2", "e9"].map(exercise),
    structure: { elements, stopPoints },
  });
}

const locations = (draft: SessionDraft) =>
  (draft.structure?.stopPoints ?? []).map((point) => [point.circuitId, point.cycleId ?? null, point.position]);

describe("PRE-9 B.6 — Points d'arrêt d'une disposition générale, persistés et relus (cycle_id)", () => {
  it("création, ouverture, déplacement d'un Point dans le Cycle, modification, relecture", async () => {
    const created = await service().createSession(generalDraft());
    if (!created.ok) throw new Error(JSON.stringify(created.violations));
    expect(await database.getAllAsync("SELECT tour_id, cycle_id, position FROM session_stop_points ORDER BY position, tour_id")).toEqual([
      { tour_id: null, cycle_id: null, position: 1 },
      { tour_id: null, cycle_id: "cy", position: 1 },
      { tour_id: "cb", cycle_id: null, position: 1 },
    ]);

    const opened = await service().getSessionForEdit(created.value.id);
    if (opened.status !== "OK") throw new Error(opened.status);
    const draft = toSessionDraft(opened.session);
    expect(locations(draft)).toEqual([
      [null, null, 1],
      [null, "cy", 1],
      ["cb", null, 1],
    ]);

    // Le Point du Cycle passe en fin du Cycle (fin de répétition, ARB-02b).
    const cyclePoint = draft.structure!.stopPoints.find((point) => point.cycleId === "cy") as unknown as { readonly id: string };
    const moved = moveLayoutStopPoint(draft, cyclePoint.id, { circuitId: null, cycleId: "cy", position: 2 }, () => "unused");
    if (moved.status !== "APPLIED") throw new Error(moved.status);
    const saved = await service().updateSession(created.value.id, moved.draft);
    expect(saved.status).toBe("UPDATED");

    const reread = (await repository().findStructuredById(created.value.id))!;
    expect(reread.structure.stopPoints.map((point) => [point.circuitId, point.cycleId ?? null, point.position])).toEqual([
      [null, null, 1],
      [null, "cy", 2],
      ["cb", null, 1],
    ]);
  });

  it("RM-219 à l'écriture : un Point juste avant la Fin, hors répétition, est refusé sans écriture", async () => {
    const draft = generalDraft();
    const invalid = { ...draft, structure: { ...draft.structure!, stopPoints: [{ id: "end", circuitId: null, position: 3 }] } };
    const created = await service().createSession(invalid);
    expect(created).toEqual({ ok: false, violations: [{ code: "FORBIDDEN_PLACEMENT", field: "session.stopPoints" }] });
    expect(await database.getAllAsync("SELECT COUNT(*) AS count FROM sessions")).toEqual([{ count: 0 }]);
  });
});
