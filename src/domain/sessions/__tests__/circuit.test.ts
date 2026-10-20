import { describe, expect, it } from "@jest/globals";

import {
  CIRCUIT_NATURES,
  DEFAULT_CIRCUIT_NATURE,
  circuitBoundCount,
  circuitBoundOf,
  expandComposition,
  isCircuitNature,
  type CircuitBound,
  type CompositionStep,
  type ExpandableOccurrence,
} from "@/domain/sessions/circuit";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft } from "@/domain/sessions/SessionDraft";

/** PRE-6 story 1.1 (AC1, AD-34) : nature du Circuit et borne `COUNT` dérivée du compte existant. */
describe("circuit — nature et borne (PRE-6, AD-34)", () => {
  it("connaît exactement deux natures, Tours par défaut", () => {
    expect(CIRCUIT_NATURES).toEqual(["TOURS", "SERIES"]);
    expect(DEFAULT_CIRCUIT_NATURE).toBe("TOURS");
  });

  it.each([
    ["TOURS", true],
    ["SERIES", true],
    ["FOO", false],
    ["tours", false],
    ["", false],
    [undefined, false],
    [null, false],
    [2, false],
  ])("isCircuitNature(%p) = %p", (value, expected) => {
    expect(isCircuitNature(value)).toBe(expected);
  });

  it("la borne COUNT EST le compte du Circuit (tourRepeatCount), sans second compte", () => {
    expect(circuitBoundOf({ tourRepeatCount: 4 })).toEqual({ kind: "COUNT", count: 4 });
    expect(circuitBoundOf({ tourRepeatCount: 99 })).toEqual({ kind: "COUNT", count: 99 });
  });

  it("un brouillon sans compte explicite a la borne COUNT par défaut (1)", () => {
    expect(circuitBoundOf({})).toEqual({ kind: "COUNT", count: 1 });
    expect(circuitBoundOf(createEmptyDraft())).toEqual({ kind: "COUNT", count: 1 });
  });

  it("circuitBoundCount lit le nombre de passages de la borne", () => {
    const bound: CircuitBound = { kind: "COUNT", count: 7 };
    expect(circuitBoundCount(bound)).toBe(7);
    expect(circuitBoundCount(circuitBoundOf({ tourRepeatCount: 3 }))).toBe(3);
  });

  it("la nature ne change pas la borne : Tours et Séries partagent le même compte", () => {
    const tours = { ...createEmptyDraft(), tourRepeatCount: 4, circuitNature: "TOURS" as const };
    const series = { ...tours, circuitNature: "SERIES" as const };
    expect(circuitBoundOf(series)).toEqual(circuitBoundOf(tours));
  });
});

/** PRE-6 story 1.3 (AD-40) : développement pur de la Composition selon la nature. */
describe("expandComposition (PRE-6, AD-40)", () => {
  const occurrence = (
    id: string,
    structuralPosition: "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR",
    count = 2,
    postActivityRecoverySeconds: number | null = 0,
  ): ExpandableOccurrence => ({
    id,
    type: "EXERCISE",
    structuralPosition,
    postActivityRecoverySeconds,
    executionParameters: durationParameters(30, count, 10),
  });
  const label = (step: CompositionStep): string => {
    switch (step.kind) {
      case "OCCURRENCE":
        return `${step.occurrenceId}${step.series ?? ""}`;
      case "RECOVERY":
        return `R:${step.occurrenceId}`;
      case "STOP_POINT":
        return `P:${step.stopPointId}`;
    }
  };

  it("Tours : contenu interne × N, R positive répétée à chaque Tour, externe une fois", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR", 2, 20), occurrence("B", "IN_TOUR"), occurrence("C", "AFTER_TOUR")],
      circuitNature: "TOURS",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["A", "R:A", "B", "A", "R:A", "B", "C"]);
    expect(steps.map((step) => step.pass)).toEqual([1, 1, 1, 2, 2, 2, null]);
  });

  it("nature absente : lue Tours", () => {
    const input = { exercises: [occurrence("A", "IN_TOUR"), occurrence("B", "IN_TOUR")], tourRepeatCount: 2 };
    expect(expandComposition(input)).toEqual(expandComposition({ ...input, circuitNature: "TOURS" }));
  });

  it("Séries : série i de chaque exercice au passage i, point interne répété après son exercice", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR"), occurrence("B", "IN_TOUR")],
      stopPoints: [{ id: "p", scope: "IN_TOUR", position: 1 }],
      circuitNature: "SERIES",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["A1", "P:p", "B1", "A2", "P:p", "B2"]);
  });

  it("ordre à un emplacement : Exercice → R positive → Point d'arrêt ; R = 0 ou absente ne produit rien", () => {
    const steps = expandComposition({
      exercises: [
        occurrence("W", "BEFORE_TOUR", 1, 0),
        occurrence("A", "IN_TOUR", 1, 15),
        occurrence("B", "IN_TOUR", 1, null),
        occurrence("Z", "AFTER_TOUR", 1, 0),
      ],
      stopPoints: [
        { id: "out", scope: "BEFORE_TOUR", position: 1 },
        { id: "in", scope: "IN_TOUR", position: 1 },
      ],
      circuitNature: "SERIES",
      tourRepeatCount: 1,
    });
    expect(steps.map(label)).toEqual(["W", "P:out", "A1", "R:A", "P:in", "B1", "Z"]);
  });

  it("externes une seule fois, internes à chaque passage ; un exercice à moins de N séries ne contribue que ses séries", () => {
    const steps = expandComposition({
      exercises: [occurrence("W", "BEFORE_TOUR", 3), occurrence("A", "IN_TOUR", 3), occurrence("B", "IN_TOUR", 1)],
      stopPoints: [{ id: "w", scope: "BEFORE_TOUR", position: 1 }],
      circuitNature: "SERIES",
      tourRepeatCount: 3,
    });
    expect(steps.map(label)).toEqual(["W", "P:w", "A1", "B1", "A2", "A3"]);
  });

  it("point IN_TOUR en position 0 : en tête de chaque passage (Séries) et de chaque Tour (Tours)", () => {
    const input = {
      exercises: [occurrence("A", "IN_TOUR", 2)],
      stopPoints: [{ id: "h", scope: "IN_TOUR" as const, position: 0 }],
      tourRepeatCount: 2,
    };
    expect(expandComposition({ ...input, circuitNature: "SERIES" }).map(label)).toEqual(["P:h", "A1", "P:h", "A2"]);
    expect(expandComposition({ ...input, circuitNature: "TOURS" }).map(label)).toEqual(["P:h", "A", "P:h", "A"]);
  });

  it("Tours, N = 2 : un point IN_TOUR en position 1 apparaît dans chaque Tour, après son exercice", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR"), occurrence("B", "IN_TOUR")],
      stopPoints: [{ id: "p", scope: "IN_TOUR", position: 1 }],
      circuitNature: "TOURS",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["A", "P:p", "B", "A", "P:p", "B"]);
    expect(steps.filter((step) => step.kind === "STOP_POINT").map((step) => step.pass)).toEqual([1, 2]);
  });

  it("point AFTER_TOUR : une seule fois, après son exercice", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR"), occurrence("Y", "AFTER_TOUR"), occurrence("Z", "AFTER_TOUR")],
      stopPoints: [{ id: "a", scope: "AFTER_TOUR", position: 1 }],
      circuitNature: "SERIES",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["A1", "A2", "Y", "P:a", "Z"]);
    expect(steps.find((step) => step.kind === "STOP_POINT")?.pass).toBeNull();
  });

  it("Séries : une ancienne Récupération autonome ou un Mode inconnu est joué en entier à chaque passage (comme la durée)", () => {
    const legacy: ExpandableOccurrence = { ...occurrence("R", "IN_TOUR", 1), type: "RECOVERY" };
    const unknown: ExpandableOccurrence = {
      ...occurrence("U", "IN_TOUR", 1),
      executionParameters: { ...durationParameters(30, 1, 10), mode: null },
    };
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR", 1), legacy, unknown],
      circuitNature: "SERIES",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["A1", "R", "U", "R", "U"]);
  });

  it("un passage où aucune occurrence ne joue est omis en entier, point de tête compris", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR", 1)],
      stopPoints: [{ id: "h", scope: "IN_TOUR", position: 0 }],
      circuitNature: "SERIES",
      tourRepeatCount: 3,
    });
    expect(steps.map(label)).toEqual(["P:h", "A1"]);
  });
});
