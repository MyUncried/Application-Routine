import { describe, expect, it } from "@jest/globals";

import {
  CIRCUIT_NATURES,
  DEFAULT_CIRCUIT_NATURE,
  applyNatureChange,
  circuitBoundCount,
  circuitBoundOf,
  circuitCountOutcome,
  circuitVolumes,
  enterCircuit,
  exitCircuit,
  expandComposition,
  isCircuitNature,
  prepareEnterCircuit,
  prepareNatureChange,
  setCircuitCount,
  type CircuitBound,
  type CircuitNature,
  type CompositionStep,
  type ExpandableOccurrence,
} from "@/domain/sessions/circuit";
import { numberTarget, type ExecutionParametersInput, type SeriesRow } from "@/domain/activities/ExecutionParameters";
import {
  durationParameters,
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import {
  createEmptyDraft,
  createExerciseDraft,
  sessionDraftsEqual,
  toCreateSessionInput,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";

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
      exercises: [occurrence("W", "BEFORE_TOUR", 1), occurrence("A", "IN_TOUR", 2)],
      stopPoints: [{ id: "h", scope: "IN_TOUR" as const, position: 0 }],
      tourRepeatCount: 2,
    };
    expect(expandComposition({ ...input, circuitNature: "SERIES" }).map(label)).toEqual(["W", "P:h", "A1", "P:h", "A2"]);
    expect(expandComposition({ ...input, circuitNature: "TOURS" }).map(label)).toEqual(["W", "P:h", "A", "P:h", "A"]);
  });

  // PRE-6 story 7.1 (D-437) : début et fin de Tour en ouverture ou clôture de Séance, conflit hérité.
  it("D-437 — Circuit seul, N = 3 : le début de Tour n'est pas joué après le compte à rebours, la fin pas avant la Fin", () => {
    const exercises = [occurrence("A", "IN_TOUR"), occurrence("B", "IN_TOUR")];
    const head = expandComposition({ exercises, stopPoints: [{ id: "h", scope: "IN_TOUR", position: 0 }], tourRepeatCount: 3 });
    expect(head.map(label)).toEqual(["A", "B", "P:h", "A", "B", "P:h", "A", "B"]);
    const tail = expandComposition({ exercises, stopPoints: [{ id: "t", scope: "IN_TOUR", position: 2 }], tourRepeatCount: 3 });
    expect(tail.map(label)).toEqual(["A", "B", "P:t", "A", "B", "P:t", "A", "B"]);
  });

  it("D-437 — conflit de Tour hérité (début et fin, N ≥ 2) : un seul arrêt entre deux Tours, jamais en tête ni en fin", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR"), occurrence("B", "IN_TOUR")],
      stopPoints: [
        { id: "h", scope: "IN_TOUR", position: 0 },
        { id: "t", scope: "IN_TOUR", position: 2 },
      ],
      tourRepeatCount: 3,
    });
    expect(steps.map(label)).toEqual(["A", "B", "P:t", "A", "B", "P:t", "A", "B"]);
    const kinds = steps.map((step) => step.kind);
    expect(kinds.some((kind, index) => kind === "STOP_POINT" && kinds[index + 1] === "STOP_POINT")).toBe(false);
    // Avec un Exercice avant le Circuit : le début du Tour 1 est joué.
    const opened = expandComposition({
      exercises: [occurrence("W", "BEFORE_TOUR"), occurrence("A", "IN_TOUR"), occurrence("B", "IN_TOUR")],
      stopPoints: [
        { id: "h", scope: "IN_TOUR", position: 0 },
        { id: "t", scope: "IN_TOUR", position: 2 },
      ],
      tourRepeatCount: 2,
      circuitNature: "SERIES",
    });
    expect(opened.map(label)).toEqual(["W", "P:h", "A1", "B1", "P:t", "A2", "B2"]);
  });

  it("D-437 — Séries, Circuit seul, N = 3, début et fin de Tour : ni en tête, ni en fin, jamais deux arrêts de suite", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR", 3), occurrence("B", "IN_TOUR", 3)],
      stopPoints: [
        { id: "h", scope: "IN_TOUR", position: 0 },
        { id: "t", scope: "IN_TOUR", position: 2 },
      ],
      circuitNature: "SERIES",
      tourRepeatCount: 3,
    });
    expect(steps.map(label)).toEqual(["A1", "B1", "P:t", "A2", "B2", "P:t", "A3", "B3"]);
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
      exercises: [occurrence("W", "BEFORE_TOUR", 1), occurrence("A", "IN_TOUR", 1)],
      stopPoints: [{ id: "h", scope: "IN_TOUR", position: 0 }],
      circuitNature: "SERIES",
      tourRepeatCount: 3,
    });
    expect(steps.map(label)).toEqual(["W", "P:h", "A1"]);
  });

  // PRE-6 story 6.1 (D-436, RM-251, arbitrage du 22/10/2026).
  it("Séries partielles : dernier exercice sans série au passage N, points avant et après → un seul point", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR", 2), occurrence("B", "IN_TOUR", 1), occurrence("Z", "AFTER_TOUR")],
      stopPoints: [
        { id: "p", scope: "IN_TOUR", position: 1 },
        { id: "q", scope: "IN_TOUR", position: 2 },
      ],
      circuitNature: "SERIES",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["A1", "P:p", "B1", "P:q", "A2", "P:p", "Z"]);
  });

  it("D-436 : un point est produit à sa place même si l'occurrence qui le précède ne joue pas", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR", 1), occurrence("B", "IN_TOUR", 2), occurrence("Z", "AFTER_TOUR")],
      stopPoints: [{ id: "p", scope: "IN_TOUR", position: 1 }],
      circuitNature: "SERIES",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["A1", "P:p", "B1", "P:p", "B2", "Z"]);
  });

  it("RM-251 : jamais deux étapes STOP_POINT successives, une récupération ne sépare pas", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR", 2, 15), occurrence("B", "IN_TOUR", 1), occurrence("Z", "AFTER_TOUR")],
      stopPoints: [
        { id: "p", scope: "IN_TOUR", position: 1 },
        { id: "q", scope: "IN_TOUR", position: 2 },
      ],
      circuitNature: "SERIES",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["A1", "R:A", "P:p", "B1", "P:q", "A2", "R:A", "P:p", "Z"]);
    const kinds = steps.map((step) => step.kind).filter((kind) => kind !== "RECOVERY");
    expect(kinds.some((kind, index) => kind === "STOP_POINT" && kinds[index + 1] === "STOP_POINT")).toBe(false);
  });

  it("Tours : inchangés pour des points non consécutifs", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR"), occurrence("B", "IN_TOUR"), occurrence("Z", "AFTER_TOUR")],
      stopPoints: [
        { id: "p", scope: "IN_TOUR", position: 1 },
        { id: "q", scope: "IN_TOUR", position: 2 },
      ],
      circuitNature: "TOURS",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["A", "P:p", "B", "P:q", "A", "P:p", "B", "P:q", "Z"]);
  });

  // Revue de la story 6.1 (arbitrage de Hermann « supprimer le point en trop »).
  it("un point qui serait en tête (après le compte à rebours) ou en fin (avant la Fin) est omis", () => {
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR", 2), occurrence("B", "IN_TOUR", 1)],
      stopPoints: [
        { id: "h", scope: "IN_TOUR", position: 0 },
        { id: "q", scope: "IN_TOUR", position: 2 },
      ],
      circuitNature: "SERIES",
      tourRepeatCount: 2,
    });
    // h en tête de Séance (omis) ; au passage 2, h suit q (omis) ; B ne joue pas, q précéderait la Fin (omis).
    expect(steps.map(label)).toEqual(["A1", "B1", "P:q", "A2"]);
  });

  it("une ancienne Récupération autonome ne sépare pas : un point précédé d'elle seule est omis (tête de Séance)", () => {
    const legacy: ExpandableOccurrence = { ...occurrence("L", "BEFORE_TOUR", 1), type: "RECOVERY" };
    const steps = expandComposition({
      exercises: [legacy, occurrence("A", "IN_TOUR", 1), occurrence("Z", "AFTER_TOUR", 1)],
      stopPoints: [{ id: "p", scope: "BEFORE_TOUR", position: 1 }],
      circuitNature: "TOURS",
      tourRepeatCount: 1,
    });
    expect(steps.map(label)).toEqual(["L", "A", "Z"]);
  });

  it("Séries : un passage où ne jouent que d'anciennes Récupérations autonomes est omis comme un passage vide", () => {
    const legacy: ExpandableOccurrence = { ...occurrence("R", "IN_TOUR", 1), type: "RECOVERY" };
    const steps = expandComposition({
      exercises: [occurrence("A", "IN_TOUR", 1), legacy, occurrence("Z", "AFTER_TOUR", 1)],
      circuitNature: "SERIES",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["A1", "R", "Z"]);
  });

  it("Tours : un point de tête hérité suit le point de fin du Tour précédent — fusionné, joué au Tour 1 seulement", () => {
    const steps = expandComposition({
      exercises: [occurrence("W", "BEFORE_TOUR"), occurrence("A", "IN_TOUR"), occurrence("B", "IN_TOUR"), occurrence("Z", "AFTER_TOUR")],
      stopPoints: [
        { id: "h", scope: "IN_TOUR", position: 0 },
        { id: "e", scope: "IN_TOUR", position: 2 },
      ],
      circuitNature: "TOURS",
      tourRepeatCount: 2,
    });
    expect(steps.map(label)).toEqual(["W", "P:h", "A", "B", "P:e", "A", "B", "P:e", "Z"]);
  });
});

// --- Opérations de Circuit (story 1.4, AD-37, AD-38, AD-39) ------------------

/** Exercice du brouillon, dans le Circuit par défaut. */
function exercise(
  id: string,
  executionParameters: ExecutionParametersInput,
  extra: Partial<SessionDraftExercise> = {},
): SessionDraftExercise {
  return { ...createExerciseDraft(id), structuralPosition: "IN_TOUR", name: id, executionParameters, ...extra };
}

function draftOf(nature: CircuitNature, count: number, exercises: readonly SessionDraftExercise[]): SessionDraft {
  return { ...createEmptyDraft(), name: "Séance", circuitNature: nature, tourRepeatCount: count, exercises };
}

/** Gel profond : toute mutation du brouillon d'entrée lèverait (mode strict des modules). */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

function rowsOf(draft: SessionDraft, id: string): readonly SeriesRow[] {
  const series = draft.exercises.find((item) => item.id === id)!.executionParameters.series;
  if (series.kind !== "VARIABLE") {
    throw new Error("séries variables attendues");
  }
  return series.rows;
}

function countOfExercise(draft: SessionDraft, id: string): number {
  const series = draft.exercises.find((item) => item.id === id)!.executionParameters.series;
  return series.kind === "UNIFORM" ? series.count : series.rows.length;
}

const row = (seconds: number, pauseSeconds = 0, loadKg = 0): SeriesRow => ({
  target: numberTarget(seconds),
  pauseSeconds,
  loadKg,
});

describe("circuit — changement de nature (PRE-6, story 1.4, AD-39)", () => {
  it("Tours → Séries sans perte : identiques count = N, variables étendues par la dernière ligne", () => {
    const a = exercise("A", uniformParameters({ count: 3, target: 30, pauseSeconds: 10 }));
    const b = exercise("B", variableParameters({ rows: [[20, 5, 0], [25, 15, 7.5]] }));
    const draft = deepFreeze(draftOf("TOURS", 4, [a, b]));

    expect(prepareNatureChange(draft, "SERIES")).toEqual({ losses: [] });
    const next = applyNatureChange(draft, "SERIES");

    expect(next.circuitNature).toBe("SERIES");
    expect(next.exercises[0]!.executionParameters).toEqual(uniformParameters({ count: 4, target: 30, pauseSeconds: 10 }));
    expect(rowsOf(next, "B")).toEqual([row(20, 5), row(25, 15, 7.5), row(25, 15, 7.5), row(25, 15, 7.5)]);
    expect(rowsOf(next, "B")[2]!.target).not.toBe(rowsOf(next, "B")[1]!.target);
    // Le régime et les autres paramètres ne changent jamais.
    expect(next.exercises[1]!.executionParameters.series.kind).toBe("VARIABLE");
    expect({ ...next.exercises[1]!.executionParameters, series: null }).toEqual({ ...b.executionParameters, series: null });
    expect(next.circuitSeriesReserve).toBeUndefined();
  });

  it("Tours → Séries avec perte : pertes calculées avant mutation, troncature définitive, réserve vide", () => {
    const a = exercise("A", variableParameters({ rows: [[10, 0], [20, 0], [30, 0]] }));
    const draft = deepFreeze(draftOf("TOURS", 2, [a]));

    expect(prepareNatureChange(draft, "SERIES")).toEqual({ losses: [{ occurrenceId: "A", lostSeriesCount: 1 }] });
    expect(rowsOf(draft, "A")).toHaveLength(3);

    const next = applyNatureChange(draft, "SERIES");
    expect(rowsOf(next, "A")).toEqual([row(10), row(20)]);
    expect(next.circuitSeriesReserve).toBeUndefined();
    // Troncature définitive : une augmentation copie la dernière ligne active.
    expect(rowsOf(setCircuitCount(next, 3), "A")).toEqual([row(10), row(20), row(20)]);
  });

  it("pertes par exercice, occurrences hors Circuit et anciennes Récupérations ignorées", () => {
    const draft = draftOf("TOURS", 2, [
      exercise("X", durationParameters(30, 5), { structuralPosition: "BEFORE_TOUR" }),
      exercise("A", durationParameters(30, 4)),
      exercise("R", durationParameters(30, 3), { type: "RECOVERY" }),
      exercise("B", durationParameters(30, 2)),
      exercise("C", durationParameters(30, 3)),
    ]);
    expect(prepareNatureChange(draft, "SERIES").losses).toEqual([
      { occurrenceId: "A", lostSeriesCount: 2 },
      { occurrenceId: "C", lostSeriesCount: 1 },
    ]);
    const next = applyNatureChange(draft, "SERIES");
    expect(next.exercises[0]).toBe(draft.exercises[0]);
    expect(next.exercises[2]).toBe(draft.exercises[2]);
    expect(next.exercises[3]).toBe(draft.exercises[3]);
    expect(countOfExercise(next, "A")).toBe(2);
    expect(countOfExercise(next, "C")).toBe(2);
  });

  it("Séries → Tours : seule la nature change, comptes et valeurs conservés, aucune perte", () => {
    const draft = deepFreeze(
      draftOf("SERIES", 3, [
        exercise("A", uniformParameters({ count: 3, target: 30 })),
        exercise("B", variableParameters({ rows: [[10, 0], [20, 0], [30, 0]] })),
      ]),
    );
    expect(prepareNatureChange(draft, "TOURS")).toEqual({ losses: [] });
    const next = applyNatureChange(draft, "TOURS");
    expect(next).toEqual({ ...draft, circuitNature: "TOURS" });
    expect(next.exercises).toBe(draft.exercises);
  });

  it("même nature : aucune perte, brouillon inchangé (même référence)", () => {
    const draft = draftOf("SERIES", 2, [exercise("A", durationParameters(30, 5))]);
    expect(prepareNatureChange(draft, "SERIES")).toEqual({ losses: [] });
    expect(applyNatureChange(draft, "SERIES")).toBe(draft);
    const tours = { ...createEmptyDraft(), exercises: [exercise("A", durationParameters(30, 5))] };
    expect(applyNatureChange(tours, "TOURS")).toBe(tours);
  });
});

describe("circuit — compte et réserve (PRE-6, story 1.4, AD-38)", () => {
  it("Tours : seul tourRepeatCount change, borné 1..99", () => {
    const draft = deepFreeze(draftOf("TOURS", 2, [exercise("A", variableParameters({ rows: [[10, 0], [20, 0], [30, 0]] }))]));
    const next = setCircuitCount(draft, 1);
    expect(next).toEqual({ ...draft, tourRepeatCount: 1 });
    expect(next.exercises).toBe(draft.exercises);
    expect(setCircuitCount(draft, 0).tourRepeatCount).toBe(1);
    expect(setCircuitCount(draft, 150).tourRepeatCount).toBe(99);
    expect(setCircuitCount(draft, 2)).toBe(draft);
  });

  describe("story 7.1 (D-437) : N et Points d'arrêt de début et de fin de Tour", () => {
    const circuitOnly = () => [exercise("A", durationParameters(30, 2)), exercise("B", durationParameters(30, 2))];
    const head = { id: "h", scope: "IN_TOUR" as const, position: 0 };
    const tail = { id: "t", scope: "IN_TOUR" as const, position: 2 };

    it("N ≥ 2 → 1 : un point devenu interdit (Circuit qui ouvre la Séance) est retiré sans message", () => {
      const draft = deepFreeze({ ...draftOf("TOURS", 3, circuitOnly()), stopPoints: [head] });
      const outcome = circuitCountOutcome(draft, 1);
      expect(outcome).toEqual({
        status: "APPLIED",
        draft: { ...draft, tourRepeatCount: 1, stopPoints: [] },
        removedStopPointIds: ["h"],
      });
      expect(setCircuitCount(draft, 1).stopPoints).toEqual([]);
    });

    it("N ≥ 2 → 1 : une fin de Tour en clôture de Séance est retirée", () => {
      const draft = { ...draftOf("TOURS", 2, circuitOnly()), stopPoints: [tail] };
      expect(circuitCountOutcome(draft, 1)).toMatchObject({ status: "APPLIED", removedStopPointIds: ["t"] });
    });

    it("N ≥ 2 → 1 : un point qui reste autorisé est conservé (même liste)", () => {
      const draft = { ...draftOf("TOURS", 2, [exercise("W", durationParameters(30, 1), { structuralPosition: "BEFORE_TOUR" }), ...circuitOnly()]), stopPoints: [head] };
      const outcome = circuitCountOutcome(draft, 1);
      expect(outcome).toMatchObject({ status: "APPLIED", removedStopPointIds: [] });
      expect(outcome.status === "APPLIED" && outcome.draft.stopPoints).toBe(draft.stopPoints);
    });

    it("1 → N ≥ 2 avec début et fin de Tour : choix requis ; chaque résolution applique N", () => {
      const before = exercise("W", durationParameters(30, 1), { structuralPosition: "BEFORE_TOUR" });
      const after = exercise("Z", durationParameters(30, 1), { structuralPosition: "AFTER_TOUR" });
      const draft = deepFreeze({ ...draftOf("SERIES", 1, [before, ...circuitOnly(), after]), stopPoints: [head, tail] });
      const outcome = circuitCountOutcome(draft, 2);
      expect(outcome.status).toBe("CHOICE_REQUIRED");
      if (outcome.status !== "CHOICE_REQUIRED") return;
      expect(outcome.conflict).toEqual({ headStopPointId: "h", tailStopPointId: "t" });
      expect(outcome.resolutions.HEAD.draft.stopPoints).toEqual([head]);
      expect(outcome.resolutions.HEAD.removedStopPointIds).toEqual(["t"]);
      expect(outcome.resolutions.TAIL.draft.stopPoints).toEqual([tail]);
      expect(outcome.resolutions.TAIL.draft.tourRepeatCount).toBe(2);
      // Séries : les exercices du Circuit suivent N dans chaque résolution.
      expect(outcome.resolutions.HEAD.draft.exercises).toBe(outcome.unresolved.exercises);
      // Forme historique : N appliqué, les deux points conservés (conflit laissé à l'état hérité).
      expect(setCircuitCount(draft, 2)).toEqual(outcome.unresolved);
      expect(outcome.unresolved.stopPoints).toEqual([head, tail]);
    });

    it("conflit déjà présent (N ≥ 2 → N ≥ 2) : pas de nouveau choix ; même N : l'entrée elle-même", () => {
      const draft = { ...draftOf("TOURS", 2, circuitOnly()), stopPoints: [head, tail] };
      expect(circuitCountOutcome(draft, 4)).toMatchObject({ status: "APPLIED", removedStopPointIds: [] });
      expect(circuitCountOutcome(draft, 2)).toEqual({ status: "APPLIED", draft, removedStopPointIds: [] });
      expect(circuitCountOutcome(draft, Number.NaN)).toEqual({ status: "APPLIED", draft, removedStopPointIds: [] });
    });
  });

  it("Séries 4 → 3 → 4 : la ligne 4 passe en réserve puis est restaurée à l'identique", () => {
    const b = exercise("B", variableParameters({ rows: [[10, 5, 1], [20, 6, 2], [30, 7, 3], [40, 8, 4]] }));
    const draft = deepFreeze(draftOf("SERIES", 4, [b]));

    const at3 = deepFreeze(setCircuitCount(draft, 3));
    expect(at3.tourRepeatCount).toBe(3);
    expect(rowsOf(at3, "B")).toEqual([row(10, 5, 1), row(20, 6, 2), row(30, 7, 3)]);
    expect(at3.circuitSeriesReserve).toEqual({ B: [row(40, 8, 4)] });

    const at4 = setCircuitCount(at3, 4);
    expect(rowsOf(at4, "B")).toEqual(rowsOf(draft, "B"));
    expect(at4.circuitSeriesReserve).toBeUndefined();
  });

  it("Séries : diminutions successives empilées dans l'ordre, puis restauration avant copie", () => {
    const draft = draftOf("SERIES", 4, [exercise("B", variableParameters({ rows: [[10, 0], [20, 0], [30, 0], [40, 0]] }))]);
    const at2 = setCircuitCount(setCircuitCount(draft, 3), 2);
    expect(at2.circuitSeriesReserve).toEqual({ B: [row(30), row(40)] });
    const at5 = setCircuitCount(at2, 5);
    expect(rowsOf(at5, "B")).toEqual([row(10), row(20), row(30), row(40), row(40)]);
    expect(at5.circuitSeriesReserve).toBeUndefined();
  });

  it("enregistrement à 3 puis augmentation : brouillon relu sans réserve, copie de la 3e ligne", () => {
    const draft = draftOf("SERIES", 4, [exercise("B", variableParameters({ rows: [[10, 0], [20, 0], [30, 0], [40, 0]] }))]);
    const at3 = setCircuitCount(draft, 3);
    // La réserve n'est jamais transmise : l'entrée persistable est la même sans elle.
    const { circuitSeriesReserve: _reserve, ...reread } = at3;
    expect(toCreateSessionInput(at3)).toEqual(toCreateSessionInput(reread));
    expect(JSON.stringify(toCreateSessionInput(at3))).not.toContain("circuitSeriesReserve");

    const at4 = setCircuitCount(reread, 4);
    expect(rowsOf(at4, "B")).toEqual([row(10), row(20), row(30), row(30)]);
  });

  it("Séries, identiques : seul count suit N ; occurrences hors Circuit inchangées", () => {
    const outside = exercise("X", durationParameters(30, 5), { structuralPosition: "AFTER_TOUR" });
    const draft = draftOf("SERIES", 3, [exercise("A", uniformParameters({ count: 3, target: 30, pauseSeconds: 10 })), outside]);
    const at1 = setCircuitCount(draft, 1);
    expect(at1.exercises[0]!.executionParameters).toEqual(uniformParameters({ count: 1, target: 30, pauseSeconds: 10 }));
    expect(at1.exercises[1]).toBe(outside);
    expect(at1.circuitSeriesReserve).toBeUndefined();
    expect(setCircuitCount(at1, 3).exercises[0]!.executionParameters).toEqual(draft.exercises[0]!.executionParameters);
  });

  it("réserve vidée : clé présente à undefined, pour qu'un correctif fusionné efface l'ancienne réserve", () => {
    const draft = draftOf("SERIES", 4, [exercise("B", variableParameters({ rows: [[10, 0], [20, 0], [30, 0], [40, 0]] }))]);
    const at3 = setCircuitCount(draft, 3);
    const at4 = setCircuitCount(at3, 4);
    expect(at4).toHaveProperty("circuitSeriesReserve", undefined);
    expect({ ...at3, ...at4 }.circuitSeriesReserve).toBeUndefined();
    const exited = exitCircuit(at3, at3.exercises[0]!);
    expect({ ...at3, ...exited }.circuitSeriesReserve).toBeUndefined();
  });

  it("même N effectif ou requête non finie : brouillon inchangé (même référence)", () => {
    const { tourRepeatCount: _count, ...implicit } = draftOf("SERIES", 1, [exercise("A", durationParameters(30, 1))]);
    expect(setCircuitCount(implicit, 1)).toBe(implicit);
    const draft = draftOf("SERIES", 3, [exercise("A", durationParameters(30, 3))]);
    expect(setCircuitCount(draft, Number.NaN)).toBe(draft);
    expect(setCircuitCount(draft, Number.POSITIVE_INFINITY)).toBe(draft);
  });

  describe("une entrée de réserve ne survit pas à sa raison d'être", () => {
    const rows4 = variableParameters({ rows: [[10, 0], [20, 0], [30, 0], [40, 0]] });
    const at3 = setCircuitCount(draftOf("SERIES", 4, [exercise("B", rows4)]), 3);

    it("occurrence supprimée : réserve abandonnée au changement de N suivant", () => {
      const other = exercise("C", variableParameters({ rows: [[1, 0], [2, 0], [3, 0]] }));
      const removed = { ...at3, exercises: [other] };
      const at4 = setCircuitCount(removed, 4);
      expect(at4.circuitSeriesReserve).toBeUndefined();
      expect(rowsOf(at4, "C")).toEqual([row(1), row(2), row(3), row(3)]);
    });

    it("occurrence sortie du Circuit : réserve abandonnée", () => {
      const moved = { ...at3, exercises: [{ ...at3.exercises[0]!, structuralPosition: "AFTER_TOUR" as const }] };
      const at4 = setCircuitCount(moved, 4);
      expect(at4.circuitSeriesReserve).toBeUndefined();
      expect(rowsOf(at4, "B")).toHaveLength(3);
    });

    it("occurrence passée en identiques puis revenue en variables : copie de la dernière ligne, pas de restauration", () => {
      const uniform = { ...at3, exercises: [exercise("B", uniformParameters({ count: 3, target: 50 }))] };
      const at2 = setCircuitCount(uniform, 2);
      expect(at2.circuitSeriesReserve).toBeUndefined();
      const variable = { ...at2, exercises: [exercise("B", variableParameters({ rows: [[50, 0], [60, 0]] }))] };
      expect(rowsOf(setCircuitCount(variable, 4), "B")).toEqual([row(50), row(60), row(60), row(60)]);
    });
  });

  it("la réserve est ignorée par sessionDraftsEqual", () => {
    const draft = draftOf("SERIES", 4, [exercise("B", variableParameters({ rows: [[10, 0], [20, 0], [30, 0], [40, 0]] }))]);
    const at3 = setCircuitCount(draft, 3);
    expect(sessionDraftsEqual(at3, { ...at3, circuitSeriesReserve: { B: [row(99)] } })).toBe(true);
    expect(sessionDraftsEqual(setCircuitCount(at3, 4), draft)).toBe(true);
  });
});

describe("circuit — entrée et sortie (PRE-6, story 1.4, AD-39)", () => {
  it("entrée avec perte en Séries : pertes avant mutation, puis exercice ramené à N", () => {
    const draft = deepFreeze(draftOf("SERIES", 2, []));
    const incoming = deepFreeze(exercise("E", variableParameters({ rows: [[10, 0], [20, 0], [30, 0]] }), { structuralPosition: "BEFORE_TOUR" }));
    expect(prepareEnterCircuit(draft, incoming)).toEqual({ losses: [{ occurrenceId: "E", lostSeriesCount: 1 }] });
    const entered = enterCircuit(draft, incoming);
    expect(entered.executionParameters.series).toEqual({ kind: "VARIABLE", rows: [row(10), row(20)] });
    expect(rowsOf({ ...draft, exercises: [incoming] }, "E")).toHaveLength(3);
  });

  it("entrée d'une ancienne Récupération en Séries, N inférieur à ses séries : aucune perte, même référence", () => {
    const recovery = exercise("R", durationParameters(30, 3), { type: "RECOVERY" });
    const draft = draftOf("SERIES", 2, []);
    expect(prepareEnterCircuit(draft, recovery).losses).toEqual([]);
    expect(enterCircuit(draft, recovery)).toBe(recovery);
  });

  it("entrée en Séries sans perte : identiques étendues à N ; en Tours : inchangé", () => {
    const incoming = exercise("E", uniformParameters({ count: 1, target: 30 }));
    expect(prepareEnterCircuit(draftOf("SERIES", 3, []), incoming)).toEqual({ losses: [] });
    expect(enterCircuit(draftOf("SERIES", 3, []), incoming).executionParameters).toEqual(uniformParameters({ count: 3, target: 30 }));

    const long = exercise("L", durationParameters(30, 5));
    expect(prepareEnterCircuit(draftOf("TOURS", 2, []), long)).toEqual({ losses: [] });
    expect(enterCircuit(draftOf("TOURS", 2, []), long)).toBe(long);
  });

  it("sortie : paramètres inchangés, réserve de l'occurrence retirée", () => {
    const draft = draftOf("SERIES", 4, [
      exercise("A", variableParameters({ rows: [[1, 0], [2, 0], [3, 0], [4, 0]] })),
      exercise("B", variableParameters({ rows: [[10, 0], [20, 0], [30, 0], [40, 0]] })),
    ]);
    const at3 = deepFreeze(setCircuitCount(draft, 3));
    const exiting = at3.exercises[1]!;
    const after = exitCircuit(at3, exiting);
    expect(after.circuitSeriesReserve).toEqual({ A: [row(4)] });
    expect(after.exercises).toBe(at3.exercises);
    expect(rowsOf(after, "B")).toHaveLength(3);
    const afterAll = exitCircuit(after, at3.exercises[0]!);
    expect(afterAll.circuitSeriesReserve).toBeUndefined();
    expect(exitCircuit(afterAll, exiting)).toBe(afterAll);
  });
});

describe("circuit — volumes (PRE-6, story 1.4, AD-39)", () => {
  it("colonnes S1..Smax, cellule null si la série n'existe pas, ordre et identité des exercices", () => {
    const draft = draftOf("TOURS", 1, [
      exercise("X", durationParameters(99, 6), { structuralPosition: "BEFORE_TOUR" }),
      exercise("A", uniformParameters({ count: 3, target: 30 }), { name: "Pompes", sideMode: "RIGHT_LEFT" }),
      exercise("B", variableParameters({ mode: "REPETITIONS", rows: [[10, 0], ["FAILURE", 0]] })),
    ]);
    const volumes = circuitVolumes(deepFreeze(draft));
    expect(volumes.seriesColumnCount).toBe(3);
    expect(volumes.rows).toEqual([
      {
        occurrenceId: "A",
        name: "Pompes",
        mode: "DURATION",
        sideMode: "RIGHT_LEFT",
        cells: [numberTarget(30), numberTarget(30), numberTarget(30)],
      },
      {
        occurrenceId: "B",
        name: "B",
        mode: "REPETITIONS",
        sideMode: "UNILATERAL",
        cells: [numberTarget(10), { kind: "FAILURE" }, null],
      },
    ]);
  });

  it("Tours, Smax > N : colonnes = Smax, cellules null au-delà des séries de chaque exercice", () => {
    const draft = draftOf("TOURS", 2, [
      exercise("A", durationParameters(30, 5)),
      exercise("B", variableParameters({ rows: [[10, 0], [20, 0], [30, 0]] })),
    ]);
    const volumes = circuitVolumes(draft);
    expect(volumes.seriesColumnCount).toBe(5);
    expect(volumes.rows[0]!.cells).toEqual(Array.from({ length: 5 }, () => numberTarget(30)));
    expect(volumes.rows[1]!.cells).toEqual([numberTarget(10), numberTarget(20), numberTarget(30), null, null]);
  });

  it("réserve exclue ; Circuit vide", () => {
    const draft = draftOf("SERIES", 4, [exercise("B", variableParameters({ rows: [[10, 0], [20, 0], [30, 0], [40, 0]] }))]);
    const at3 = setCircuitCount(draft, 3);
    expect(circuitVolumes(at3).seriesColumnCount).toBe(3);
    expect(circuitVolumes(at3).rows[0]!.cells).toEqual([numberTarget(10), numberTarget(20), numberTarget(30)]);
    expect(circuitVolumes(createEmptyDraft())).toEqual({ seriesColumnCount: 0, rows: [] });
  });
});
