import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import { insertIntoRichLayout } from "@/features/sessions/compositionLayout";

/**
 * PRE-9 B.2 (ARB-07 : « Nouvel Exercice inséré après le dernier Exercice entré, dans son conteneur,
 * comme actuellement ») — ajout à une disposition générale ; l'ancien modèle garde son insertion.
 */

const exercise = (id: string): SessionDraftExercise => ({
  ...createExerciseDraft(id, 0),
  name: id,
  executionParameters: durationParameters(30),
});

type Layout = SessionStructure<string, StructureStopPointLocation>;

const draftOf = (structure: Layout | undefined, ids: readonly string[]): SessionDraft => ({
  ...createEmptyDraft(),
  exercises: ids.map(exercise),
  ...(structure !== undefined ? { structure } : {}),
});

/** [e0, Circuit A (a1), Cycle [Circuit B (b1, b2)]] : dernier Exercice affiché b2, dans le Circuit B du Cycle. */
const lastInCircuitOfCycle: Layout = {
  elements: [
    { kind: "EXERCISE", exercise: "e0" },
    { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1"] } },
    { kind: "CYCLE", cycle: { id: "cy", repeatCount: 2, members: [{ kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1", "b2"] } }] } },
  ],
  stopPoints: [],
};

describe("insertIntoRichLayout", () => {
  it("ancien modèle (sans structure, ou Circuit unique) : null — l'insertion existante s'applique", () => {
    expect(insertIntoRichLayout(draftOf(undefined, ["a"]), [exercise("n")])).toBeNull();
    expect(
      insertIntoRichLayout(
        draftOf({ elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 1, nature: "TOURS", exercises: ["a"] } }], stopPoints: [] }, ["a"]),
        [exercise("n")],
      ),
    ).toBeNull();
  });

  it("après le dernier Exercice affiché, dans son conteneur (Circuit d'un Cycle)", () => {
    const result = insertIntoRichLayout(draftOf(lastInCircuitOfCycle, ["e0", "a1", "b1", "b2"]), [exercise("n")]);
    const cycle = result?.structure?.elements[2];
    expect(cycle?.kind === "CYCLE" && cycle.cycle.members[0]?.kind === "CIRCUIT" ? cycle.cycle.members[0].circuit.exercises : null).toEqual([
      "b1",
      "b2",
      "n",
    ]);
    expect(result?.exercises.map((item) => item.id)).toEqual(["e0", "a1", "b1", "b2", "n"]);
  });

  it("plusieurs ajouts : chacun à la suite du précédent ; dernier Exercice direct de la Séance → niveau de la Séance", () => {
    const layout: Layout = {
      elements: [
        { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1"] } },
        { kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } },
        { kind: "EXERCISE", exercise: "e2" },
      ],
      stopPoints: [],
    };
    const result = insertIntoRichLayout(draftOf(layout, ["a1", "b1", "e2"]), [exercise("n1"), exercise("n2")]);
    expect(result?.structure?.elements.map((element) => (element.kind === "EXERCISE" ? element.exercise : element.kind))).toEqual([
      "CIRCUIT",
      "CIRCUIT",
      "e2",
      "n1",
      "n2",
    ]);
  });
});
