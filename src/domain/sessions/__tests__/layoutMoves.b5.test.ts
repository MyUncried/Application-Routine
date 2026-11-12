import { describe, expect, it } from "@jest/globals";

import { seriesCountOf } from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import * as layoutMoves from "@/domain/sessions/layoutMoves";
import { duplicateLayoutExercise, removeLayoutExercise, type LayoutExerciseEditOutcome } from "@/domain/sessions/layoutMoves";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 (story B.5 ; COMP §1 « Il disparaît lorsque son dernier membre en sort » ; D-441 ; ARB-08 ;
 * ARB-17 ; correction C.1 du 30/10 : Format porté par l'Exercice seul) — suppression et duplication
 * d'un Exercice dans la structure générale.
 */

const exercise = (id: string, seriesCount = 3): SessionDraftExercise => ({
  ...createExerciseDraft(id),
  name: id,
  executionParameters: durationParameters(30, seriesCount),
});

const ids = () => "new-container";

/** e0, Circuit A groupé × 2 [a1, a2], Cycle × 2 [b0, Circuit B alterné × 2 [b1]], Circuit C [c1], Cycle Z [z0], e9. */
function sample(overrides: Partial<Record<string, SessionDraftExercise>> = {}, reserve?: SessionDraft["circuitSeriesReserve"]): SessionDraft {
  const elements: StructureElement<string>[] = [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 2, nature: "TOURS", exercises: ["a1", "a2"] } },
    {
      kind: "CYCLE",
      cycle: {
        id: "cy",
        repeatCount: 2,
        members: [
          { kind: "EXERCISE", exercise: "b0" },
          { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 2, nature: "SERIES", exercises: ["b1"] } },
        ],
      },
    },
    { kind: "CIRCUIT", circuit: { id: "cc", repeatCount: 1, nature: "TOURS", exercises: ["c1"] } },
    { kind: "CYCLE", cycle: { id: "cz", repeatCount: 3, members: [{ kind: "CIRCUIT", circuit: { id: "cd", repeatCount: 1, nature: "TOURS", exercises: ["d1"] } }] } },
    { kind: "EXERCISE", exercise: "e9" },
  ];
  const exercises = ["e0", "a1", "a2", "b0", "b1", "c1", "d1", "e9"].map((id) => overrides[id] ?? exercise(id, id === "b1" ? 2 : 3));
  return {
    ...createEmptyDraft(),
    exercises,
    structure: { elements, stopPoints: [] },
    ...(reserve !== undefined ? { circuitSeriesReserve: reserve } : {}),
  };
}

function applied(outcome: LayoutExerciseEditOutcome): Extract<LayoutExerciseEditOutcome, { status: "APPLIED" }> {
  if (outcome.status !== "APPLIED") throw new Error(`issue ${outcome.status}`);
  return outcome;
}

/** Forme compacte : « e0 ca[a1,a2] cy{b0 cb[b1]} … ». */
function shape(draft: SessionDraft): string {
  const circuitOf = (c: { id: string; exercises: readonly string[] }) => `${c.id}[${c.exercises.join(",")}]`;
  return (draft.structure?.elements ?? [])
    .map((element) =>
      element.kind === "EXERCISE"
        ? element.exercise
        : element.kind === "CIRCUIT"
          ? circuitOf(element.circuit)
          : `${element.cycle.id}{${element.cycle.members.map((m) => (m.kind === "EXERCISE" ? m.exercise : circuitOf(m.circuit))).join(" ")}}`,
    )
    .join(" ");
}

describe("PRE-9 B.5 — suppression d'un Exercice", () => {
  it("membre d'un Circuit (non dernier) : retiré, Circuit conservé, aucun conteneur retiré", () => {
    const out = applied(removeLayoutExercise(sample(), "a1", ids));
    expect(shape(out.draft)).toBe("e0 ca[a2] cy{b0 cb[b1]} cc[c1] cz{cd[d1]} e9");
    expect(out.removedContainers).toEqual([]);
    expect(out.draft.exercises.map((item) => item.id)).not.toContain("a1");
  });

  it("Exercice direct de la Séance et d'un Cycle : retiré, voisins resserrés", () => {
    expect(shape(applied(removeLayoutExercise(sample(), "e0", ids)).draft)).toBe("ca[a1,a2] cy{b0 cb[b1]} cc[c1] cz{cd[d1]} e9");
    const out = applied(removeLayoutExercise(sample(), "b0", ids));
    expect(shape(out.draft)).toBe("e0 ca[a1,a2] cy{cb[b1]} cc[c1] cz{cd[d1]} e9");
    expect(out.removedContainers).toEqual([]);
  });

  it("dernier membre d'un Circuit de la Séance : Circuit retiré, signalé", () => {
    const out = applied(removeLayoutExercise(sample(), "c1", ids));
    expect(shape(out.draft)).toBe("e0 ca[a1,a2] cy{b0 cb[b1]} cz{cd[d1]} e9");
    expect(out.removedContainers).toEqual([{ kind: "CIRCUIT", id: "cc" }]);
  });

  it("dernier membre d'un Circuit de Cycle, le Cycle gardant d'autres membres : seul le Circuit est retiré", () => {
    const out = applied(removeLayoutExercise(sample(), "b1", ids));
    expect(shape(out.draft)).toBe("e0 ca[a1,a2] cy{b0} cc[c1] cz{cd[d1]} e9");
    expect(out.removedContainers).toEqual([{ kind: "CIRCUIT", id: "cb" }]);
  });

  it("dernier membre du seul Circuit d'un Cycle : Circuit puis Cycle vidé retirés", () => {
    const out = applied(removeLayoutExercise(sample(), "d1", ids));
    expect(shape(out.draft)).toBe("e0 ca[a1,a2] cy{b0 cb[b1]} cc[c1] e9");
    expect(out.removedContainers).toEqual([
      { kind: "CIRCUIT", id: "cd" },
      { kind: "CYCLE", id: "cz" },
    ]);
  });

  it("dernier Exercice direct d'un Cycle sans autre membre : Cycle retiré", () => {
    const draft = sample();
    const structure = {
      ...draft.structure!,
      elements: [...draft.structure!.elements, { kind: "CYCLE" as const, cycle: { id: "cw", repeatCount: 2, members: [{ kind: "EXERCISE" as const, exercise: "w0" }] } }],
    };
    const out = applied(removeLayoutExercise({ ...draft, exercises: [...draft.exercises, exercise("w0")], structure }, "w0", ids));
    expect(out.removedContainers).toEqual([{ kind: "CYCLE", id: "cw" }]);
    expect(shape(out.draft)).toBe("e0 ca[a1,a2] cy{b0 cb[b1]} cc[c1] cz{cd[d1]} e9");
  });

  it("la réserve de séries du Circuit quitté part avec l'Exercice ; les autres Exercices sont inchangés (aucun Format transmis ni retiré)", () => {
    const amrap: SessionDraftExercise = { ...exercise("a2", 1), format: { key: "AMRAP", settings: { durationSeconds: 600 } } };
    const reserve = { b1: [], a1: [] };
    const before = sample({ a2: amrap }, reserve);
    const out = applied(removeLayoutExercise(before, "b1", ids));
    expect(out.draft.circuitSeriesReserve).toEqual({ a1: [] });
    for (const item of out.draft.exercises) expect(item).toBe(before.exercises.find((source) => source.id === item.id));
  });

  // [Remplacé le 10/11/2026 — modèle unique des Circuits, décision de Hermann : plus de retour aux zones de l'ancien modèle.]
  it("un seul Circuit restant : la structure générale fait foi, le Circuit vidé est retiré", () => {
    // Deux Circuits au niveau Séance : retirer le seul membre du second rend l'ancien modèle.
    const elements: StructureElement<string>[] = [
      { kind: "EXERCISE", exercise: "e0" },
      { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 2, nature: "TOURS", exercises: ["a1"] } },
      { kind: "CIRCUIT", circuit: { id: "cc", repeatCount: 1, nature: "TOURS", exercises: ["c1"] } },
      { kind: "EXERCISE", exercise: "e9" },
    ];
    const draft: SessionDraft = { ...createEmptyDraft(), exercises: ["e0", "a1", "c1", "e9"].map((id) => exercise(id)), structure: { elements, stopPoints: [] } };
    const out = applied(removeLayoutExercise(draft, "c1", ids));
    expect(out.removedContainers).toEqual([{ kind: "CIRCUIT", id: "cc" }]);
    expect(out.draft.structure?.elements).toEqual([
      { kind: "EXERCISE", exercise: "e0" },
      { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 2, nature: "TOURS", exercises: ["a1"] } },
      { kind: "EXERCISE", exercise: "e9" },
    ]);
  });

  it("Exercice inconnu : refus", () => {
    expect(removeLayoutExercise(sample(), "inconnu", ids)).toEqual({ status: "REFUSED", reason: "NOT_FOUND" });
  });

  // [B.5 : « Points d'arrêt (ancien modèle seulement avant B.6) : refus, les opérations historiques
  // s'appliquent » (refus `STOP_POINTS`) — remplacé le 31/10/2026 par B.6 : D-441 / D-442 appliqués.]
  it("Points d'arrêt (B.6) : suppression appliquée, Point devenu interdit retiré sans message ; copie insérée avant le Point", () => {
    const draft: SessionDraft = {
      ...createEmptyDraft(),
      exercises: [{ ...exercise("x1"), structuralPosition: "BEFORE_TOUR" }, { ...exercise("x2"), structuralPosition: "BEFORE_TOUR" }],
      stopPoints: [{ id: "p", scope: "BEFORE_TOUR", position: 1 }],
    };
    const removed = removeLayoutExercise(draft, "x1", ids);
    expect(removed.status === "APPLIED" && removed.removedStopPointIds).toEqual(["p"]);
    const duplicated = applied(duplicateLayoutExercise(draft, "x1", "copy", ids));
    expect(duplicated.draft.stopPoints).toEqual([{ id: "p", scope: "BEFORE_TOUR", position: 2 }]);
  });
});

describe("PRE-9 B.5 — duplication d'un Exercice (D-441, ARB-17)", () => {
  it("dans un Circuit groupé : copie juste après la source, même Circuit", () => {
    const out = applied(duplicateLayoutExercise(sample(), "a1", "a1-copy", ids));
    expect(shape(out.draft)).toBe("e0 ca[a1,a1-copy,a2] cy{b0 cb[b1]} cc[c1] cz{cd[d1]} e9");
    expect(out.removedContainers).toEqual([]);
  });

  it("au niveau de la Séance et Exercice direct d'un Cycle : copie juste après, même niveau", () => {
    expect(shape(applied(duplicateLayoutExercise(sample(), "e9", "e9-copy", ids)).draft)).toBe("e0 ca[a1,a2] cy{b0 cb[b1]} cc[c1] cz{cd[d1]} e9 e9-copy");
    expect(shape(applied(duplicateLayoutExercise(sample(), "b0", "b0-copy", ids)).draft)).toBe("e0 ca[a1,a2] cy{b0 b0-copy cb[b1]} cc[c1] cz{cd[d1]} e9");
  });

  it("dans un Circuit alterné d'un Cycle : la copie garde N et reçoit la réserve de sa source", () => {
    const reserve = { b1: [{ target: { kind: "DURATION", seconds: 30 }, pauseSeconds: 0, loadKg: 0 }] } as unknown as SessionDraft["circuitSeriesReserve"];
    const out = applied(duplicateLayoutExercise(sample({}, reserve), "b1", "b1-copy", ids));
    expect(shape(out.draft)).toBe("e0 ca[a1,a2] cy{b0 cb[b1,b1-copy]} cc[c1] cz{cd[d1]} e9");
    const copy = out.draft.exercises.find((item) => item.id === "b1-copy")!;
    expect(seriesCountOf(copy.executionParameters)).toBe(2);
    expect(out.draft.circuitSeriesReserve?.["b1-copy"]).toEqual(reserve!.b1);
    expect(out.draft.circuitSeriesReserve?.["b1-copy"]).not.toBe(reserve!.b1);
  });

  it("Exercice formaté : Format et réglages conservés par la copie ; rien transmis aux autres éléments", () => {
    const amrap: SessionDraftExercise = { ...exercise("a1", 1), format: { key: "AMRAP", settings: { durationSeconds: 720 } } };
    const before = sample({ a1: amrap });
    const out = applied(duplicateLayoutExercise(before, "a1", "a1-copy", ids));
    const copy = out.draft.exercises.find((item) => item.id === "a1-copy")!;
    expect(copy.format).toEqual({ key: "AMRAP", settings: { durationSeconds: 720 } });
    expect(out.draft.exercises.filter((item) => (item.format ?? null) !== null).map((item) => item.id).sort()).toEqual(["a1", "a1-copy"]);
    for (const item of out.draft.exercises) {
      if (item.id !== "a1-copy") expect(item).toBe(before.exercises.find((source) => source.id === item.id));
    }
    // Paramètres indépendants de la source.
    expect(copy.executionParameters).toEqual(amrap.executionParameters);
    expect(copy.executionParameters).not.toBe(amrap.executionParameters);
  });

  it("source inconnue : refus ; identifiant de copie déjà pris : exception", () => {
    expect(duplicateLayoutExercise(sample(), "inconnu", "x", ids)).toEqual({ status: "REFUSED", reason: "NOT_FOUND" });
    expect(() => duplicateLayoutExercise(sample(), "a1", "a2", ids)).toThrow();
  });

  it("ARB-08 : aucune opération de duplication de Circuit ni de Cycle n'est offerte par le Domaine", () => {
    const names = Object.keys(layoutMoves);
    expect(names.filter((name) => /duplicate/i.test(name))).toEqual(["duplicateLayoutExercise"]);
    // Un identifiant de Circuit ou de Cycle n'est pas un Exercice : rien n'est dupliqué.
    expect(duplicateLayoutExercise(sample(), "ca", "x", ids)).toEqual({ status: "REFUSED", reason: "NOT_FOUND" });
    expect(duplicateLayoutExercise(sample(), "cy", "x", ids)).toEqual({ status: "REFUSED", reason: "NOT_FOUND" });
  });
});
