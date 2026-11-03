import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { appendModelToDraft, buildModelElements, type ModelMovement } from "@/domain/sessions/formatModels";
import type { ElementFormat } from "@/domain/sessions/formats";
import { breaksFixedPassage, moveLayoutItem, stepLayoutItem, type LayoutItemRef } from "@/domain/sessions/layoutMoves";
import { applyLayoutNatureChange, setLayoutCircuitCount } from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, toStructuredSessionInput, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { legacyFromStructure, structureCircuits, type StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 — recette iPhone n° 3 du 03/11/2026 (autres constats, Composition de séance) :
 * - point 1 (Hermann : « il faut que le nom du circuit soit "Tabata", idem pour tous les formats ») :
 *   modèle d'origine (`originModel`) posé par chaque modèle sur ses Circuits, conservé par les opérations
 *   de la Composition et par l'enregistrement ;
 * - point 5 (Hermann : « La carte d'exercice Buy-In ne doit pas pouvoir être déplacée dans le circuit ») ;
 *   référence Formats §6 point 4 : buy-in en tête, buy-out en fin, sortie permise.
 */

const exercise = (id: string, parameters = repetitionParameters(12, 3, 30), format?: ElementFormat): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: parameters,
  postActivityRecoverySeconds: 0,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
  ...(format !== undefined ? { format } : {}),
});

const movement = (id: string): ModelMovement => ({ exercise: exercise(id, durationParameters(30)), values: {} }) as ModelMovement;

let counter = 0;
const newId = () => `id-${++counter}`;

describe("point 1 — modèle d'origine du Circuit (nom affiché)", () => {
  it("chaque modèle qui produit un Circuit, standard ou porteur, y pose sa clé", () => {
    const tabata = buildModelElements("TABATA", { seriesCount: 8, workSeconds: 20, pauseSeconds: 10, execution: "ALTERNATED" }, [movement("a"), movement("b")], newId);
    expect(tabata).toHaveLength(1);
    expect(tabata[0]!.kind === "CIRCUIT" && tabata[0]!.circuit.originModel).toBe("TABATA");
    const superset = buildModelElements("SUPERSET", { roundCount: 3 }, [movement("a"), movement("b")], newId);
    expect(superset[0]!.kind === "CIRCUIT" && superset[0]!.circuit.originModel).toBe("SUPERSET");
    const strength = buildModelElements("STRENGTH", { seriesCount: 4, repetitions: 8, execution: "ALTERNATED" }, [movement("a"), movement("b")], newId);
    expect(strength[0]!.kind === "CIRCUIT" && strength[0]!.circuit.originModel).toBe("STRENGTH");
    const amrap = buildModelElements("AMRAP", { durationSeconds: 600 }, [movement("a"), movement("b")], newId);
    expect(amrap[0]!.kind === "CIRCUIT" && amrap[0]!.circuit).toMatchObject({ originModel: "AMRAP", format: { key: "AMRAP" } });
    // Exercices successifs : aucun Circuit, aucun modèle d'origine.
    const sequence = buildModelElements("TABATA", { seriesCount: 8, workSeconds: 20, pauseSeconds: 10, execution: "SEQUENCE" }, [movement("a"), movement("b")], newId);
    expect(sequence.every((element) => element.kind === "EXERCISE")).toBe(true);
  });

  it("un Circuit nommé n'est pas représentable dans l'ancien modèle : il garde son nom dans le brouillon et à l'enregistrement", () => {
    const built = buildModelElements("TABATA", { seriesCount: 8, workSeconds: 20, pauseSeconds: 10, execution: "ALTERNATED" }, [movement("a"), movement("b")], newId);
    const draft = appendModelToDraft({ ...createEmptyDraft(), name: "Tabata" }, built, newId);
    expect(legacyFromStructure(draft.structure!)).toBeNull();
    expect(structureCircuits(draft.structure!)[0]!.originModel).toBe("TABATA");
    const input = toStructuredSessionInput(draft, newId);
    expect(input.ok).toBe(true);
    if (!input.ok) return;
    expect(structureCircuits(input.value.structure)[0]!.originModel).toBe("TABATA");
  });

  it("compte et nature modifiés, Circuit enveloppé ou déplacé : le nom d'origine est conservé", () => {
    const built = buildModelElements("PROGRESSION", { seriesCount: 3, execution: "ALTERNATED" }, [movement("a"), movement("b")], newId);
    let draft = appendModelToDraft({ ...createEmptyDraft(), exercises: [exercise("x")], structure: { elements: [{ kind: "EXERCISE", exercise: "x" }], stopPoints: [] } }, built, newId);
    const circuitId = structureCircuits(draft.structure!)[0]!.id;
    draft = setLayoutCircuitCount(draft, circuitId, 4);
    draft = applyLayoutNatureChange(draft, circuitId, "TOURS");
    const moved = moveLayoutItem(draft, { kind: "CIRCUIT", id: circuitId }, { container: { kind: "SESSION" }, index: 0 }, newId);
    expect(moved.status).toBe("APPLIED");
    if (moved.status !== "APPLIED") return;
    expect(structureCircuits(moved.draft.structure!)[0]).toMatchObject({ id: circuitId, repeatCount: 4, nature: "TOURS", originModel: "PROGRESSION" });
  });
});

describe("point 5 — buy-in et buy-out fixés dans leur Circuit porteur (§6 point 4)", () => {
  const AMRAP: ElementFormat = { key: "AMRAP", settings: { blockSeconds: 600, restBetweenBlocksSeconds: 0 } };
  const FOR_TIME: ElementFormat = { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0 } };
  const member = (id: string, key: "AMRAP" | "FOR_TIME", once = false) =>
    exercise(id, repetitionParameters(10), { key, settings: key === "AMRAP" ? { incrementPerRound: 0, ...(once ? { passageOnce: 1 } : {}) } : once ? { passageOnce: 1 } : {} });
  const draftOf = (elements: readonly StructureElement<string>[], exercises: readonly SessionDraftExercise[]): SessionDraft => ({
    ...createEmptyDraft(),
    exercises,
    structure: { elements, stopPoints: [] },
  });
  /** x, AMRAP [in (buy-in), a, b], For time [f1, f2, out (buy-out)]. */
  const draft = () =>
    draftOf(
      [
        { kind: "EXERCISE", exercise: "x" },
        { kind: "CIRCUIT", circuit: { id: "am", nature: "TOURS", repeatCount: 2, format: AMRAP, exercises: ["in", "a", "b"] } },
        { kind: "CIRCUIT", circuit: { id: "ft", nature: "SERIES", repeatCount: 1, format: FOR_TIME, exercises: ["f1", "f2", "out"] } },
      ],
      [exercise("x"), member("in", "AMRAP", true), member("a", "AMRAP"), member("b", "AMRAP"), member("f1", "FOR_TIME"), member("f2", "FOR_TIME"), member("out", "FOR_TIME", true)],
    );
  const once = (id: string) => id === "in" || id === "out";
  const layout = () => draft().structure!;
  const ref = (id: string): LayoutItemRef => ({ kind: "EXERCISE", id });
  const inCircuit = (id: string, index: number) => ({ container: { kind: "CIRCUIT" as const, id }, index });

  it("règle pure : buy-in seulement en tête, buy-out seulement en fin ; rien avant le buy-in ni après le buy-out ; sortie permise", () => {
    expect(breaksFixedPassage(layout(), once, ref("in"), inCircuit("am", 0))).toBe(false);
    expect(breaksFixedPassage(layout(), once, ref("in"), inCircuit("am", 1))).toBe(true);
    expect(breaksFixedPassage(layout(), once, ref("in"), inCircuit("am", 2))).toBe(true);
    expect(breaksFixedPassage(layout(), once, ref("in"), { container: { kind: "SESSION" }, index: 0 })).toBe(false);
    expect(breaksFixedPassage(layout(), once, ref("b"), inCircuit("am", 0))).toBe(true);
    expect(breaksFixedPassage(layout(), once, ref("b"), inCircuit("am", 1))).toBe(false);
    expect(breaksFixedPassage(layout(), once, ref("x"), inCircuit("am", 0))).toBe(true);
    expect(breaksFixedPassage(layout(), once, ref("x"), inCircuit("am", 3))).toBe(false);
    expect(breaksFixedPassage(layout(), once, ref("out"), inCircuit("ft", 2))).toBe(false);
    expect(breaksFixedPassage(layout(), once, ref("out"), inCircuit("ft", 0))).toBe(true);
    expect(breaksFixedPassage(layout(), once, ref("f1"), inCircuit("ft", 2))).toBe(true);
    expect(breaksFixedPassage(layout(), once, ref("x"), inCircuit("ft", 3))).toBe(true);
    expect(breaksFixedPassage(layout(), once, ref("x"), inCircuit("ft", 2))).toBe(false);
  });

  it("dépose refusée sans mutation ; le buy-in peut sortir du Circuit (libre d'office)", () => {
    const before = draft();
    expect(moveLayoutItem(before, ref("in"), inCircuit("am", 2), newId)).toEqual({ status: "REFUSED", reason: "PASSAGE_FIXED" });
    expect(moveLayoutItem(before, ref("b"), inCircuit("am", 0), newId)).toEqual({ status: "REFUSED", reason: "PASSAGE_FIXED" });
    expect(moveLayoutItem(before, ref("out"), inCircuit("ft", 0), newId)).toEqual({ status: "REFUSED", reason: "PASSAGE_FIXED" });
    const exit = moveLayoutItem(before, ref("in"), { container: { kind: "SESSION" }, index: 1 }, newId);
    expect(exit.status).toBe("APPLIED");
    // Réordonnancement de la boucle, après le buy-in : permis.
    const swap = moveLayoutItem(before, ref("b"), inCircuit("am", 1), newId);
    expect(swap.status).toBe("APPLIED");
    expect(swap.status === "APPLIED" && structureCircuits(swap.draft.structure!)[0]!.exercises).toEqual(["in", "b", "a"]);
  });

  it("VoiceOver « Monter » / « Descendre » : les emplacements interdits sont franchis, jamais refusés", () => {
    // a monte : il ne passe pas avant le buy-in — il sort au-dessus du Circuit (choix de sortie §13).
    const up = stepLayoutItem(draft(), ref("a"), "UP", newId);
    expect(up.status).toBe("FORMAT_EXIT_CHOICE");
    // Le buy-in monte : il sort au-dessus du Circuit, libre.
    const inUp = stepLayoutItem(draft(), ref("in"), "UP", newId);
    expect(inUp.status === "APPLIED" && inUp.draft.structure!.elements.map((element) => (element.kind === "EXERCISE" ? element.exercise : element.kind))).toEqual([
      "x",
      "in",
      "CIRCUIT",
      "CIRCUIT",
    ]);
    // Le buy-in descend : aucune place dans la boucle ; il sort sous le Circuit.
    const inDown = stepLayoutItem(draft(), ref("in"), "DOWN", newId);
    expect(inDown.status).toBe("APPLIED");
    expect(inDown.status === "APPLIED" && structureCircuits(inDown.draft.structure!)[0]!.exercises).toEqual(["a", "b"]);
    // f2 descend : il ne passe pas après le buy-out ; il sort sous le Circuit.
    expect(stepLayoutItem(draft(), ref("f2"), "DOWN", newId).status).toBe("FORMAT_EXIT_CHOICE");
  });
});
