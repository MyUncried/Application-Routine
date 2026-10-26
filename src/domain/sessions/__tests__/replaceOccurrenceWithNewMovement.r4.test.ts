import { describe, expect, it } from "@jest/globals";

import type { WorkPhase } from "@/domain/activities/ExecutionParameters";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  createEmptyDraft,
  createExerciseDraft,
  draftMovementOf,
  movementContentOfDraft,
  replaceOccurrenceWithNewMovement,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";

/**
 * PRE-7 story R-4 (D-445 C03, C04, Q10) — « Créer un nouveau mouvement » depuis le crayon d'une
 * occurrence de Séance : occurrence remplacée à la même place par une nouvelle occurrence d'un
 * Mouvement `NEW`, paramètres conservés par identité de phase, autres occurrences inchangées.
 */

const phases = (...durations: number[]): WorkPhase[] =>
  durations.map((durationSeconds, index) => ({ id: index + 1, label: `Phase ${index + 1}`, durationSeconds }));

const occurrence = (id: string, overrides: Partial<SessionDraftExercise> = {}): SessionDraftExercise => ({
  ...createExerciseDraft(id, null),
  name: "Squat",
  instruction: "Buste droit",
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  executionParameters: uniformParameters({ mode: "DURATION", count: 3, target: 9, pauseSeconds: 10, workPhases: phases(6, 3) }),
  sourceMovementId: "mov-squat",
  ...overrides,
});

const draftOf = (exercises: readonly SessionDraftExercise[], extra: Partial<SessionDraft> = {}): SessionDraft => ({
  ...createEmptyDraft(),
  exercises,
  ...extra,
});

describe("replaceOccurrenceWithNewMovement", () => {
  it("même place, nouvel identifiant, nouveau Mouvement NEW sans alias ; les autres occurrences gardent l'ancien Mouvement", () => {
    const draft = draftOf([occurrence("occ-0", { sourceMovementId: "mov-other", name: "Fentes" }), occurrence("occ-1", { copyNumber: 2 }), occurrence("occ-2")]);
    const edited: SessionDraftExercise = {
      ...occurrence("occ-1", { copyNumber: 2 }),
      name: "Squat sumo",
      executionParameters: uniformParameters({
        mode: "DURATION",
        count: 3,
        target: 9,
        pauseSeconds: 10,
        workPhases: [...phases(6, 3), { id: 4, label: "Maintien", durationSeconds: 2 }],
      }),
    };
    const result = replaceOccurrenceWithNewMovement(draft, edited, { occurrenceId: "occ-new", movementId: "mov-new" }, { nextPhaseId: 6 });

    expect(result.exercises.map((exercise) => exercise.id)).toEqual(["occ-0", "occ-new", "occ-2"]);
    const replaced = result.exercises[1]!;
    expect(replaced).toMatchObject({ name: "Squat sumo", sourceMovementId: "mov-new", copyNumber: null });
    expect(replaced.executionParameters).toEqual(edited.executionParameters);
    expect(result.exercises[0]).toBe(draft.exercises[0]);
    expect(result.exercises[2]).toBe(draft.exercises[2]);
    expect(result.movements?.["mov-new"]).toMatchObject({
      id: "mov-new",
      change: "NEW",
      name: "Squat sumo",
      aliases: [],
      nextPhaseId: 6,
      phases: [
        { id: 1, label: "Phase 1" },
        { id: 2, label: "Phase 2" },
        { id: 4, label: "Maintien" },
      ],
    });
    expect(result.movements?.["mov-squat"]).toBeUndefined();
  });

  it("table existante conservée ; l'entrée de réserve du Circuit suit l'occurrence", () => {
    const existing = draftMovementOf(occurrence("occ-x", { sourceMovementId: "mov-x", name: "Gainage" }), "NEW");
    const draft = draftOf([occurrence("occ-1"), occurrence("occ-2")], {
      movements: { "mov-x": existing },
      circuitSeriesReserve: { "occ-1": [], "occ-2": [] },
    });
    const result = replaceOccurrenceWithNewMovement(draft, occurrence("occ-1", { name: "Squat sumo" }), { occurrenceId: "occ-new", movementId: "mov-new" });
    expect(result.movements?.["mov-x"]).toBe(existing);
    expect(Object.keys(result.circuitSeriesReserve ?? {}).sort()).toEqual(["occ-2", "occ-new"]);
  });

  it("occurrence absente du brouillon : entrée invalide, lève", () => {
    expect(() =>
      replaceOccurrenceWithNewMovement(draftOf([occurrence("occ-1")]), occurrence("inconnue"), { occurrenceId: "n", movementId: "m" }),
    ).toThrow();
  });
});

describe("movementContentOfDraft", () => {
  it("contenu comparé par la décision C03 : nom et description normalisés comme à l'enregistrement, phases sans durées", () => {
    const movement = draftMovementOf(occurrence("occ-1", { name: "  Squat   sumo ", instruction: " Dos droit " }), "EDITED", { aliases: ["Sumo"] });
    expect(movementContentOfDraft(movement)).toEqual({
      name: "Squat sumo",
      aliases: ["Sumo"],
      description: "Dos droit",
      mediaAssetIds: [],
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      phases: [
        { id: 1, label: "Phase 1" },
        { id: 2, label: "Phase 2" },
      ],
    });
  });
});
