import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { formatLayoutDuration, resolveRichLayout } from "@/features/sessions/compositionLayout";
import { formatSessionDurationEstimate } from "@/features/sessions/compositionPresentation";

/** PRE-9 B.1b — disposition générale résolue pour la Composition (mêmes règles que l'enregistrement). */

const exercise = (id: string): SessionDraftExercise => ({
  ...createExerciseDraft(id, 0),
  name: id,
  executionParameters: durationParameters(30),
});

type Layout = SessionStructure<string, StructureStopPointLocation>;
const twoCircuits: Layout = {
  elements: [
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 2, nature: "TOURS", exercises: ["a", "gone"] } },
    { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b"] } },
  ],
  stopPoints: [],
};

describe("resolveRichLayout", () => {
  it("brouillon sans structure ou sans Circuit : null ; Circuit unique composé à la main : disposition générale (10/11/2026)", () => {
    expect(resolveRichLayout({ exercises: [exercise("a")] })).toBeNull();
    expect(resolveRichLayout({ exercises: [exercise("a")], structure: { elements: [{ kind: "EXERCISE", exercise: "a" }], stopPoints: [] } })).toBeNull();
    // Décision de Hermann du 10/11/2026 : un seul rendu des Circuits (options, cadre, glissement identiques).
    expect(
      resolveRichLayout({
        exercises: [exercise("a")],
        structure: { elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 1, nature: "TOURS", exercises: ["a"] } }], stopPoints: [] },
      })?.elements.map((element) => element.kind),
    ).toEqual(["CIRCUIT"]);
  });

  it("identifiant absent du brouillon ignoré ; Exercice ajouté rendu à la fin, au niveau de la Séance", () => {
    const resolved = resolveRichLayout({ exercises: [exercise("new"), exercise("b"), exercise("a")], structure: twoCircuits });
    expect(resolved?.elements.map((element) => (element.kind === "CIRCUIT" ? element.circuit.exercises.map((item) => item.id) : element.kind === "EXERCISE" ? element.exercise.id : null))).toEqual([
      ["a"],
      ["b"],
      "new",
    ]);
  });

  it("durée d'un Circuit et d'un Cycle (RM-252), formateur de la Séance", () => {
    const a = exercise("a");
    expect(formatLayoutDuration([{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 3, nature: "TOURS", exercises: [a] } }])).toBe(
      formatSessionDurationEstimate({ kind: "exact", seconds: 90 }),
    );
    expect(
      formatLayoutDuration([
        {
          kind: "CYCLE",
          cycle: {
            id: "y",
            repeatCount: 2,
            members: [
              { kind: "EXERCISE", exercise: a },
              { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 3, nature: "TOURS", exercises: [a] } },
            ],
          },
        },
      ]),
    ).toBe(formatSessionDurationEstimate({ kind: "exact", seconds: 240 }));
  });
});
