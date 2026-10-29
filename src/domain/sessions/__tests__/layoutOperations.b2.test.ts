import { describe, expect, it } from "@jest/globals";

import {
  currentLayout,
  envelopeCandidates,
  insertExerciseInLayout,
  wrapInContainer,
} from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, createExerciseDraft, toStructuredSessionInput, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { legacyFromStructure, mapStructure, type StructureElement } from "@/domain/sessions/structure";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";

/**
 * PRE-9 (story B.2, D-451, COMP §1, ARB-06, ARB-07) — Séance sans Circuit, création d'un Circuit
 * ou d'un Cycle posé sur un premier contenu, insertion d'un nouvel Exercice.
 */

const named = (id: string, structuralPosition: "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR" = "BEFORE_TOUR") => ({
  ...createExerciseDraft(id),
  name: id,
  structuralPosition,
});

const withoutCircuit = (stopPoints: SessionDraft["stopPoints"] = undefined): SessionDraft => ({
  ...createEmptyDraft(),
  name: "Sans Circuit",
  exercises: [named("a"), named("b"), named("c")],
  ...(stopPoints !== undefined ? { stopPoints } : {}),
});

let next = 0;
const newId = () => `new-${++next}`;

const shape = (draft: SessionDraft) => currentLayout(draft, () => "fresh").elements;

describe("PRE-9 B.2 — Séance sans Circuit (D-451, COMP §1)", () => {
  it("enregistrée sans Circuit, Points d'arrêt à leur place", () => {
    const draft = withLocalMovements(withoutCircuit([{ id: "p", scope: "BEFORE_TOUR", position: 1 }]));
    const result = toStructuredSessionInput(draft, newId);
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    expect(mapStructure(result.value.structure, (item) => item.id)).toEqual({
      elements: [
        { kind: "EXERCISE", exercise: "a" },
        { kind: "EXERCISE", exercise: "b" },
        { kind: "EXERCISE", exercise: "c" },
      ],
      stopPoints: [{ circuitId: null, position: 1 }],
    });
  });

  it("Circuit vidé : il disparaît à l'enregistrement ; un Point d'après le Circuit recule d'un rang", () => {
    const draft = withLocalMovements({
      ...withoutCircuit([{ id: "p", scope: "AFTER_TOUR", position: 0 }]),
      exercises: [named("a"), named("c", "AFTER_TOUR")],
      structure: {
        elements: [
          { kind: "EXERCISE", exercise: "a" },
          { kind: "CIRCUIT", circuit: { id: "old", repeatCount: 2, nature: "TOURS", exercises: [] } },
          { kind: "EXERCISE", exercise: "c" },
        ],
        stopPoints: [],
      },
    });
    const result = toStructuredSessionInput(draft, newId);
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    expect(result.value.structure.elements.map((element) => element.kind)).toEqual(["EXERCISE", "EXERCISE"]);
    expect(result.value.structure.stopPoints).toEqual([{ circuitId: null, position: 1 }]);
  });
});

describe("PRE-9 B.2 — conteneur posé sur un premier contenu (ARB-06)", () => {
  it("Circuit posé sur un Exercice d'une Séance sans Circuit : ancien modèle, zones et Points réécrits", () => {
    const draft = withoutCircuit([
      { id: "p1", scope: "BEFORE_TOUR", position: 1 },
      { id: "p2", scope: "BEFORE_TOUR", position: 2 },
    ]);
    expect(envelopeCandidates(draft, "CIRCUIT").map((target) => target.id)).toEqual(["a", "b", "c"]);
    const wrapped = wrapInContainer(draft, { kind: "EXERCISE", id: "b" }, "CIRCUIT", () => "circuit-b");
    expect(wrapped.exercises.map((item) => [item.id, item.structuralPosition])).toEqual([
      ["a", "BEFORE_TOUR"],
      ["b", "IN_TOUR"],
      ["c", "AFTER_TOUR"],
    ]);
    expect(wrapped.tourRepeatCount).toBe(1);
    expect(wrapped.circuitNature).toBe("TOURS");
    // Même séquence : le Point après a reste avant le Circuit, celui après b passe après le Circuit.
    expect(wrapped.stopPoints).toEqual([
      { id: "p1", scope: "BEFORE_TOUR", position: 1 },
      { id: "p2", scope: "AFTER_TOUR", position: 0 },
    ]);
    expect(legacyFromStructure(wrapped.structure!)?.composition.tour.id).toBe("circuit-b");
    // L'enregistrement garde l'identité du Circuit créé.
    const saved = toStructuredSessionInput(withLocalMovements(wrapped), newId);
    if (!saved.ok) throw new Error(JSON.stringify(saved.violations));
    expect(saved.value.structure.elements[1]).toMatchObject({ kind: "CIRCUIT", circuit: { id: "circuit-b" } });
  });

  it("second Circuit, puis Cycle autour d'un Circuit : structure générale ; Circuit posable sur un Exercice direct de Cycle", () => {
    const one = wrapInContainer(withoutCircuit(), { kind: "EXERCISE", id: "a" }, "CIRCUIT", () => "c1");
    const two = wrapInContainer(one, { kind: "EXERCISE", id: "c" }, "CIRCUIT", () => "c2");
    expect(legacyFromStructure(two.structure!)).toBeNull();
    expect(shape(two)).toEqual([
      { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 1, nature: "TOURS", exercises: ["a"] } },
      { kind: "EXERCISE", exercise: "b" },
      { kind: "CIRCUIT", circuit: { id: "c2", repeatCount: 1, nature: "TOURS", exercises: ["c"] } },
    ]);
    expect(envelopeCandidates(two, "CYCLE")).toEqual([
      { kind: "CIRCUIT", id: "c1" },
      { kind: "EXERCISE", id: "b" },
      { kind: "CIRCUIT", id: "c2" },
    ]);
    const cycle = wrapInContainer(two, { kind: "EXERCISE", id: "b" }, "CYCLE", () => "y1");
    expect(shape(cycle)[1]).toEqual({ kind: "CYCLE", cycle: { id: "y1", repeatCount: 1, members: [{ kind: "EXERCISE", exercise: "b" }] } });
    // Un Circuit peut être posé sur un Exercice direct de Cycle ; un Cycle n'est jamais posé dans un Cycle.
    expect(envelopeCandidates(cycle, "CIRCUIT")).toEqual([{ kind: "EXERCISE", id: "b" }]);
    expect(envelopeCandidates(cycle, "CYCLE").map((target) => target.id)).toEqual(["c1", "c2"]);
    const nested = wrapInContainer(cycle, { kind: "EXERCISE", id: "b" }, "CIRCUIT", () => "c3");
    expect(shape(nested)[1]).toEqual({
      kind: "CYCLE",
      cycle: { id: "y1", repeatCount: 1, members: [{ kind: "CIRCUIT", circuit: { id: "c3", repeatCount: 1, nature: "TOURS", exercises: ["b"] } }] },
    });
  });

  it("non éligible : Exercice formaté (ARB-27), Exercice d'un Circuit, conteneur hors ancien modèle tant que la Séance a des Points (B.6)", () => {
    const formatted: SessionDraft = { ...withoutCircuit(), exercises: [{ ...named("a"), format: { key: "EMOM", settings: {} } }, named("b")] };
    expect(envelopeCandidates(formatted, "CIRCUIT").map((target) => target.id)).toEqual(["b"]);
    expect(wrapInContainer(formatted, { kind: "EXERCISE", id: "a" }, "CIRCUIT", newId)).toBe(formatted);

    const withPoint = wrapInContainer(withoutCircuit([{ id: "p", scope: "BEFORE_TOUR", position: 1 }]), { kind: "EXERCISE", id: "a" }, "CIRCUIT", () => "c1");
    expect(envelopeCandidates(withPoint, "CIRCUIT")).toEqual([]);
    expect(envelopeCandidates(withPoint, "CYCLE")).toEqual([]);
    expect(envelopeCandidates(withPoint, "CIRCUIT").some((target) => target.id === "a")).toBe(false);
  });
});

describe("PRE-9 B.2 — nouvel Exercice après le dernier Exercice entré, dans son conteneur (ARB-07)", () => {
  const rich = (): SessionDraft => {
    const elements: StructureElement<string>[] = [
      { kind: "EXERCISE", exercise: "a" },
      { kind: "CYCLE", cycle: { id: "y", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: "b" }, { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 1, nature: "TOURS", exercises: ["c"] } }] } },
    ];
    return { ...withoutCircuit(), structure: { elements, stopPoints: [] } };
  };

  it("dans un Circuit de Cycle, comme Exercice direct de Cycle, au niveau Séance ; sans repère, en fin de niveau principal", () => {
    const fresh = named("n");
    expect(shape(insertExerciseInLayout(rich(), fresh, "c"))[1]).toMatchObject({
      cycle: { members: [{ kind: "EXERCISE", exercise: "b" }, { kind: "CIRCUIT", circuit: { exercises: ["c", "n"] } }] },
    });
    expect(shape(insertExerciseInLayout(rich(), fresh, "b"))[1]).toMatchObject({
      cycle: { members: [{ exercise: "b" }, { kind: "EXERCISE", exercise: "n" }, { kind: "CIRCUIT" }] },
    });
    expect(shape(insertExerciseInLayout(rich(), fresh, "a")).map((element) => element.kind)).toEqual(["EXERCISE", "EXERCISE", "CYCLE"]);
    const appended = insertExerciseInLayout(rich(), fresh, null);
    expect(shape(appended).at(-1)).toEqual({ kind: "EXERCISE", exercise: "n" });
    expect(appended.exercises.at(-1)).toBe(fresh);
  });
});
