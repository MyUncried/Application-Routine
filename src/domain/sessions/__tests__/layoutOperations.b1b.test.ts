import { describe, expect, it } from "@jest/globals";

import { durationParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { seriesCountOf } from "@/domain/activities/ExecutionParameters";
import {
  applyLayoutNatureChange,
  containerLetters,
  designationLetter,
  prepareLayoutNatureChange,
  setLayoutCircuitCount,
  setLayoutCycleCount,
} from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, createExerciseDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { structureCircuits, type StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 (story B.1b, D-451, COMP §2, §4, ARB-13) — opérations par Circuit et par Cycle sur une
 * disposition générale ; lettres de désignation.
 */

const exercise = (id: string, parameters = durationParameters(30, 3)) => ({ ...createExerciseDraft(id), name: id, executionParameters: parameters });

function draftOf(elements: readonly StructureElement<string>[], exercises = ["a", "b", "c", "d"].map((id) => exercise(id))): SessionDraft {
  return { ...createEmptyDraft(), exercises, structure: { elements, stopPoints: [] } };
}

const twoCircuitsInCycle = (): SessionDraft =>
  draftOf([
    { kind: "EXERCISE", exercise: "a" },
    {
      kind: "CYCLE",
      cycle: {
        id: "y1",
        repeatCount: 2,
        members: [
          { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 3, nature: "TOURS", exercises: ["b"] } },
          { kind: "CIRCUIT", circuit: { id: "c2", repeatCount: 2, nature: "SERIES", exercises: ["c"] } },
        ],
      },
    },
    { kind: "CYCLE", cycle: { id: "y2", repeatCount: 1, members: [{ kind: "EXERCISE", exercise: "d" }] } },
  ]);

describe("PRE-9 B.1b — lettres de désignation (COMP §4, ARB-13)", () => {
  it("A…Z puis AA, AB…", () => {
    expect([0, 1, 25, 26, 27, 51, 52, 701, 702].map(designationLetter)).toEqual(["A", "B", "Z", "AA", "AB", "AZ", "BA", "ZZ", "AAA"]);
  });

  it("Circuits lettrés à l'échelle de la Séance, Cycles de même ; aucune lettre pour un conteneur seul de sa nature", () => {
    expect(Object.fromEntries(containerLetters(twoCircuitsInCycle().structure!))).toEqual({ c1: "A", c2: "B", y1: "A", y2: "B" });
    const single = draftOf([
      { kind: "CYCLE", cycle: { id: "y", repeatCount: 2, members: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 1, nature: "TOURS", exercises: ["a"] } }] } },
      { kind: "EXERCISE", exercise: "b" },
    ]);
    expect(containerLetters(single.structure!).size).toBe(0);
  });
});

describe("PRE-9 B.1b — compte et nature d'un Circuit, compte d'un Cycle", () => {
  it("compte d'un Circuit groupé : seul le compte change, les autres conteneurs et les Exercices sont inchangés", () => {
    const draft = twoCircuitsInCycle();
    const next = setLayoutCircuitCount(draft, "c1", 5);
    expect(structureCircuits(next.structure!).map((circuit) => circuit.repeatCount)).toEqual([5, 2]);
    expect(next.exercises).toBe(draft.exercises);
    expect(setLayoutCircuitCount(next, "c1", 5)).toBe(next);
    expect(structureCircuits(setLayoutCircuitCount(draft, "c1", 120).structure!)[0]!.repeatCount).toBe(99);
  });

  it("compte d'un Circuit alterné : ses Exercices suivent N avec réserve, ceux des autres Circuits non (AD-38)", () => {
    const draft = draftOf(
      [
        { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 3, nature: "SERIES", exercises: ["a"] } },
        { kind: "CIRCUIT", circuit: { id: "c2", repeatCount: 3, nature: "SERIES", exercises: ["b"] } },
      ],
      [exercise("a", variableParameters({ rows: [[10, 0], [20, 0], [30, 0]] })), exercise("b", variableParameters({ rows: [[10, 0], [20, 0], [30, 0]] }))],
    );
    const down = setLayoutCircuitCount(draft, "c1", 1);
    expect(seriesCountOf(down.exercises[0]!.executionParameters)).toBe(1);
    expect(seriesCountOf(down.exercises[1]!.executionParameters)).toBe(3);
    expect(down.circuitSeriesReserve?.a).toHaveLength(2);
    const up = setLayoutCircuitCount(down, "c1", 3);
    expect(up.exercises[0]!.executionParameters).toEqual(draft.exercises[0]!.executionParameters);
    expect(up.circuitSeriesReserve).toBeUndefined();
  });

  it("nature : groupées → alternées annonce la perte puis adapte à N ; alternées → groupées ne change que la nature (COMP §2)", () => {
    const draft = draftOf([{ kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 2, nature: "TOURS", exercises: ["a", "b"] } }], [
      exercise("a", durationParameters(30, 3)),
      exercise("b", durationParameters(30, 1)),
    ]);
    expect(prepareLayoutNatureChange(draft, "c1", "SERIES")).toEqual({ losses: [{ occurrenceId: "a", lostSeriesCount: 1 }] });
    const alternated = applyLayoutNatureChange(draft, "c1", "SERIES");
    expect(structureCircuits(alternated.structure!)[0]!.nature).toBe("SERIES");
    expect(alternated.exercises.map((item) => seriesCountOf(item.executionParameters))).toEqual([2, 2]);
    expect(prepareLayoutNatureChange(alternated, "c1", "TOURS")).toEqual({ losses: [] });
    const back = applyLayoutNatureChange(alternated, "c1", "TOURS");
    expect(back.exercises).toBe(alternated.exercises);
    expect(structureCircuits(back.structure!)[0]!.nature).toBe("TOURS");
  });

  it("compte d'un Cycle borné 1..99 (D-451)", () => {
    const draft = twoCircuitsInCycle();
    const cycleCount = (next: SessionDraft) => next.structure!.elements.flatMap((element) => (element.kind === "CYCLE" ? [element.cycle.repeatCount] : []));
    expect(cycleCount(setLayoutCycleCount(draft, "y1", 4))).toEqual([4, 1]);
    expect(cycleCount(setLayoutCycleCount(draft, "y2", 0))).toEqual([2, 1]);
    expect(cycleCount(setLayoutCycleCount(draft, "y2", 150))).toEqual([2, 99]);
    expect(setLayoutCycleCount(draft, "y1", 2)).toBe(draft);
  });
});
