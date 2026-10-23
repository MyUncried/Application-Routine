import { describe, expect, it } from "@jest/globals";

import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import { circuitVolumes, type CircuitNature } from "@/domain/sessions/circuit";
import { createEmptyDraft, createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SideMode } from "@/domain/sessions/sideMode";
import {
  formatCircuitVolumes,
  formatVolumeCell,
  formatVolumeDuration,
  formatVolumeUnit,
} from "@/features/sessions/circuitVolumesPresentation";

function exercise(
  id: string,
  executionParameters: ExecutionParameters,
  options: { readonly name?: string; readonly sideMode?: SideMode; readonly inCircuit?: boolean } = {},
): SessionDraftExercise {
  return {
    ...createExerciseDraft(id),
    name: options.name ?? id,
    structuralPosition: options.inCircuit === false ? "BEFORE_TOUR" : "IN_TOUR",
    executionParameters,
    sideMode: options.sideMode ?? "UNILATERAL",
  };
}

function present(exercises: readonly SessionDraftExercise[], circuitNature: CircuitNature = "TOURS", tourRepeatCount = 1) {
  return formatCircuitVolumes(circuitVolumes({ ...createEmptyDraft(), exercises, circuitNature, tourRepeatCount }));
}

const texts = (row: { readonly cells: readonly { readonly text: string }[] }) => row.cells.map((cell) => cell.text);

describe("circuitVolumesPresentation (PRE-6 story 3.4, CE-CIR-03)", () => {
  it("formats a duration as m:ss", () => {
    expect(formatVolumeDuration(45)).toBe("0:45");
    expect(formatVolumeDuration(60)).toBe("1:00");
    expect(formatVolumeDuration(90)).toBe("1:30");
    expect(formatVolumeDuration(5)).toBe("0:05");
    expect(formatVolumeDuration(600)).toBe("10:00");
  });

  it("A 2 series / B 4 series: 4 columns, A's S3 and S4 are « — » announced « pas de série » (never 0)", () => {
    const view = present([
      exercise("A", repetitionParameters(10, 2), { name: "Squat" }),
      exercise("B", repetitionParameters(8, 4), { name: "Fentes" }),
    ]);
    expect(view.seriesColumns).toEqual(["S1", "S2", "S3", "S4"]);
    expect(texts(view.rows[0]!)).toEqual(["10", "10", "—", "—"]);
    expect(texts(view.rows[1]!)).toEqual(["8", "8", "8", "8"]);
    expect(view.rows[0]!.cells[2]!.spoken).toBe("pas de série");
    expect(view.rows[0]!.accessibilityLabel).toBe(
      "Squat, série 1 : 10 répétitions, série 2 : 10 répétitions, série 3 : pas de série, série 4 : pas de série",
    );
  });

  it("durations: « 0:45 », « 1:00 », « 1:30 », unit « durée »", () => {
    const view = present([
      exercise("A", variableParameters({ mode: "DURATION", rows: [[45, 0], [60, 0], [90, 0]] }), { name: "Gainage" }),
    ]);
    expect(texts(view.rows[0]!)).toEqual(["0:45", "1:00", "1:30"]);
    expect(view.rows[0]!.unit).toBe("durée");
    expect(view.rows[0]!.accessibilityLabel).toBe("Gainage, série 1 : 45 s, série 2 : 1 min, série 3 : 1 min 30 s");
  });

  it("repetitions: « 10 », « 12 », « 14 », unit « rép. »", () => {
    const view = present([
      exercise("A", variableParameters({ mode: "REPETITIONS", rows: [[10, 0], [12, 0], [14, 0]] })),
    ]);
    expect(texts(view.rows[0]!)).toEqual(["10", "12", "14"]);
    expect(view.rows[0]!.unit).toBe("rép.");
  });

  it("all targets to failure: « ✓ » everywhere, announced « à l’échec », unit « À l’échec »", () => {
    const view = present([exercise("A", allFailureParameters(3), { name: "Pompes" })]);
    expect(texts(view.rows[0]!)).toEqual(["✓", "✓", "✓"]);
    expect(view.rows[0]!.unit).toBe("À l’échec");
    expect(view.rows[0]!.accessibilityLabel).toBe(
      "Pompes, série 1 : à l’échec, série 2 : à l’échec, série 3 : à l’échec",
    );
  });

  it("mixed: « 10 », « ✓ », unit « rép. »", () => {
    const view = present([exercise("A", variableParameters({ mode: "REPETITIONS", rows: [[10, 0], ["FAILURE", 0]] }))]);
    expect(texts(view.rows[0]!)).toEqual(["10", "✓"]);
    expect(view.rows[0]!.unit).toBe("rép.");
  });

  it("an unset target is « — » announced « à renseigner »", () => {
    const view = present([exercise("A", variableParameters({ mode: "REPETITIONS", rows: [[10, 0], ["UNSET", 0]] }))]);
    expect(texts(view.rows[0]!)).toEqual(["10", "—"]);
    expect(view.rows[0]!.cells[1]!.spoken).toBe("à renseigner");
  });

  it("bilateral: value per side, never doubled, side change flagged and announced without direction", () => {
    const view = present([exercise("A", repetitionParameters(10, 2), { name: "Fentes", sideMode: "LEFT_RIGHT" })]);
    expect(texts(view.rows[0]!)).toEqual(["10", "10"]);
    expect(view.rows[0]!.isBilateral).toBe(true);
    expect(view.rows[0]!.accessibilityLabel).toBe(
      "Fentes, changement de côté, série 1 : 10 répétitions, série 2 : 10 répétitions",
    );
    expect(view.rows[0]!.accessibilityLabel).not.toMatch(/droite|gauche/);
    expect(present([exercise("B", repetitionParameters(10, 2))]).rows[0]!.isBilateral).toBe(false);
  });

  it("Tours N = 3: same grid (each exercise's own series), Circuit occurrences only, in order", () => {
    const view = present(
      [
        exercise("out", repetitionParameters(5, 6), { inCircuit: false }),
        exercise("A", durationParameters(30, 2), { name: "Planche" }),
        exercise("B", repetitionParameters(12, 1), { name: "Burpees" }),
      ],
      "TOURS",
      3,
    );
    expect(view.seriesColumns).toEqual(["S1", "S2"]);
    expect(view.rows.map((row) => row.name)).toEqual(["Planche", "Burpees"]);
    expect(texts(view.rows[0]!)).toEqual(["0:30", "0:30"]);
    expect(texts(view.rows[1]!)).toEqual(["12", "—"]);
  });

  it("empty Circuit: no column, no row", () => {
    expect(present([])).toEqual({ seriesColumns: [], rows: [] });
  });

  it("12 series: 12 columns", () => {
    expect(present([exercise("A", repetitionParameters(10, 12))]).seriesColumns).toHaveLength(12);
  });

  it("cells and unit without mode", () => {
    expect(formatVolumeCell(null, { kind: "NUMBER", value: 7 })).toEqual({ text: "7", spoken: "7" });
    expect(formatVolumeCell("REPETITIONS", { kind: "NUMBER", value: 1 })).toEqual({ text: "1", spoken: "1 répétition" });
    expect(formatVolumeUnit({ mode: null, cells: [{ kind: "UNSET" }] })).toBe("—");
    expect(formatVolumeUnit({ mode: "DURATION", cells: [null] })).toBe("durée");
  });
});
