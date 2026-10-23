import { describe, expect, it } from "@jest/globals";

import { numberTarget, type ExecutionParametersInput, type SeriesRow } from "@/domain/activities/ExecutionParameters";
import { uniformParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { setCircuitCount, type CircuitNature } from "@/domain/sessions/circuit";
import { copyCircuitReserveEntry, settleCircuitMembership } from "@/domain/sessions/circuitMembership";
import { appendActivityAfterLastDisplayed, moveActivity, removeActivity } from "@/domain/sessions/composition";
import type { StructuralPosition } from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  createExerciseDraft,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";

function exercise(
  id: string,
  zone: StructuralPosition,
  executionParameters: ExecutionParametersInput,
): SessionDraftExercise {
  return { ...createExerciseDraft(id), structuralPosition: zone, name: id, executionParameters };
}

function draftOf(nature: CircuitNature, count: number, exercises: readonly SessionDraftExercise[]): SessionDraft {
  return { ...createEmptyDraft(), name: "Séance", circuitNature: nature, tourRepeatCount: count, exercises };
}

const row = (seconds: number): SeriesRow => ({ target: numberTarget(seconds), pauseSeconds: 0, loadKg: 0 });

function seriesCount(exercises: readonly SessionDraftExercise[], id: string): number {
  const series = exercises.find((item) => item.id === id)!.executionParameters.series;
  return series.kind === "UNIFORM" ? series.count : series.rows.length;
}

/** PRE-6 story 2.3 : entrée / sortie de Circuit des opérations d'organisation. */
describe("settleCircuitMembership (PRE-6, story 2.3)", () => {
  const threeSeries = () => variableParameters({ rows: [[10, 0], [20, 0], [30, 0]] });

  it("ajout en Séries sans perte (N = 4, exercice 3 séries) : adapté à 4, aucune perte", () => {
    const draft = draftOf("SERIES", 4, [exercise("A", "IN_TOUR", uniformParameters({ count: 4, target: 30 }))]);
    const next = appendActivityAfterLastDisplayed(draft.exercises, exercise("N", "BEFORE_TOUR", threeSeries()));
    const settled = settleCircuitMembership(draft, next);
    expect(settled.losses).toEqual([]);
    expect(seriesCount(settled.exercises, "N")).toBe(4);
    expect(settled.exercises.find((item) => item.id === "A")).toBe(draft.exercises[0]);
  });

  it("ajout en Séries avec perte (N = 2, exercice 3 séries) : perte annoncée, exercice ramené à 2", () => {
    const draft = draftOf("SERIES", 2, [exercise("A", "IN_TOUR", uniformParameters({ count: 2, target: 30 }))]);
    const next = appendActivityAfterLastDisplayed(draft.exercises, exercise("N", "BEFORE_TOUR", threeSeries()));
    const settled = settleCircuitMembership(draft, next);
    expect(settled.losses).toEqual([{ occurrenceId: "N", lostSeriesCount: 1 }]);
    expect(seriesCount(settled.exercises, "N")).toBe(2);
    // Aucune mutation de l'entrée.
    expect(seriesCount(next, "N")).toBe(3);
  });

  it("ajout en Tours : inchangé (même référence)", () => {
    const draft = draftOf("TOURS", 2, [exercise("A", "IN_TOUR", uniformParameters({ count: 2, target: 30 }))]);
    const next = appendActivityAfterLastDisplayed(draft.exercises, exercise("N", "BEFORE_TOUR", threeSeries()));
    const settled = settleCircuitMembership(draft, next);
    expect(settled).toEqual({ targetCount: 2, exercises: next, losses: [], reservePatch: {} });
    expect(settled.exercises).toBe(next);
  });

  it("ajout hors Circuit : jamais adapté", () => {
    const draft = draftOf("SERIES", 2, [exercise("A", "BEFORE_TOUR", uniformParameters({ count: 2, target: 30 }))]);
    const next = appendActivityAfterLastDisplayed(draft.exercises, exercise("N", "IN_TOUR", threeSeries()));
    const settled = settleCircuitMembership(draft, next);
    expect(settled.losses).toEqual([]);
    expect(settled.exercises).toBe(next);
  });

  it("déplacement dans le Circuit : adapté ; occurrence déjà dans le Circuit : jamais réévaluée", () => {
    const inside = exercise("A", "IN_TOUR", variableParameters({ rows: [[1, 0], [2, 0], [3, 0]] }));
    const draft = draftOf("SERIES", 2, [exercise("B", "BEFORE_TOUR", threeSeries()), inside]);
    const moved = moveActivity(draft.exercises, "B", "IN_TOUR", 1);
    const settled = settleCircuitMembership(draft, moved);
    expect(settled.losses).toEqual([{ occurrenceId: "B", lostSeriesCount: 1 }]);
    expect(seriesCount(settled.exercises, "B")).toBe(2);
    expect(settled.exercises.find((item) => item.id === "A")).toBe(inside);

    const reordered = moveActivity(draft.exercises, "A", "IN_TOUR", 0);
    expect(settleCircuitMembership(draft, reordered).losses).toEqual([]);
  });

  it("sortie du Circuit : nombre et paramètres conservés, réserve retirée, sans perte", () => {
    const base = draftOf("SERIES", 4, [
      exercise("A", "IN_TOUR", variableParameters({ rows: [[1, 0], [2, 0], [3, 0], [4, 0]] })),
      exercise("B", "IN_TOUR", variableParameters({ rows: [[10, 0], [20, 0], [30, 0], [40, 0]] })),
    ]);
    const at3 = setCircuitCount(base, 3);
    const moved = moveActivity(at3.exercises, "B", "AFTER_TOUR", 0);
    const settled = settleCircuitMembership(at3, moved);
    expect(settled.losses).toEqual([]);
    expect(settled.exercises).toBe(moved);
    expect(settled.exercises.find((item) => item.id === "B")!.executionParameters).toEqual(
      at3.exercises[1]!.executionParameters,
    );
    expect(settled.reservePatch).toEqual({ circuitSeriesReserve: { A: [row(4)] } });
  });

  it("suppression d'une occurrence du Circuit : sa réserve part avec elle (clé présente à undefined si vide)", () => {
    const base = draftOf("SERIES", 2, [
      exercise("A", "IN_TOUR", variableParameters({ rows: [[1, 0], [2, 0]] })),
    ]);
    const at1 = setCircuitCount(base, 1);
    expect(at1.circuitSeriesReserve).toEqual({ A: [row(2)] });
    const settled = settleCircuitMembership(at1, removeActivity(at1.exercises, "A"));
    expect(settled.reservePatch).toHaveProperty("circuitSeriesReserve", undefined);
    expect({ ...at1, ...settled.reservePatch }.circuitSeriesReserve).toBeUndefined();
  });

  it("sans réserve : aucun champ de réserve à écrire", () => {
    const draft = draftOf("SERIES", 2, [exercise("A", "IN_TOUR", uniformParameters({ count: 2, target: 30 }))]);
    expect(settleCircuitMembership(draft, removeActivity(draft.exercises, "A")).reservePatch).toEqual({});
  });
});

describe("settleCircuitMembership — N du dialogue / copyCircuitReserveEntry (PRE-6, story 2.3)", () => {
  it("retourne le N auquel les occurrences entrantes sont adaptées", () => {
    const draft = draftOf("SERIES", 3, []);
    const next = [exercise("N", "IN_TOUR", variableParameters({ rows: [[1, 0], [2, 0], [3, 0], [4, 0]] }))];
    expect(settleCircuitMembership(draft, next).targetCount).toBe(3);
  });

  it("la copie reçoit une copie profonde de la réserve de sa source", () => {
    const base = draftOf("SERIES", 2, [exercise("A", "IN_TOUR", variableParameters({ rows: [[1, 0], [2, 0]] }))]);
    const at1 = setCircuitCount(base, 1);
    const patch = copyCircuitReserveEntry(at1, "A", "A2");
    expect(patch).toEqual({ circuitSeriesReserve: { A: [row(2)], A2: [row(2)] } });
    const reserve = (patch as { circuitSeriesReserve: Record<string, readonly SeriesRow[]> }).circuitSeriesReserve;
    expect(reserve.A2![0]).not.toBe(reserve.A![0]);
    expect(reserve.A2![0]!.target).not.toBe(reserve.A![0]!.target);
    // Une augmentation de N restaure les mêmes lignes pour la source et sa copie.
    const withCopy: SessionDraft = {
      ...at1,
      exercises: [...at1.exercises, { ...at1.exercises[0]!, id: "A2" }],
      ...patch,
    };
    const at2 = setCircuitCount(withCopy, 2);
    expect(at2.exercises.map((item) => item.executionParameters.series)).toEqual([
      { kind: "VARIABLE", rows: [row(1), row(2)] },
      { kind: "VARIABLE", rows: [row(1), row(2)] },
    ]);
  });

  it("aucune réserve pour la source : rien à écrire", () => {
    expect(copyCircuitReserveEntry(draftOf("SERIES", 2, []), "A", "A2")).toEqual({});
  });
});
