import { describe, expect, it } from "@jest/globals";

import {
  ExecutionParametersDataError,
  RESOLVED_EXECUTION_PARAMETERS_VERSION,
  readExecutionParameters,
  readResolvedExecutionParameters,
  serializeCatalogExecutionParameters,
  serializeExecutionParameters,
  serializeResolvedExecutionParameters,
  type ExecutionParameters,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import { activityDefinitionToDraftExercise, type ActivityDefinition } from "@/domain/activities/ActivityDefinition";
import { allocatePhaseIdentities, normalizeMovementName, splitResolvedParameters, type Movement } from "@/domain/activities/Movement";
import { uniformParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { duplicateActivity } from "@/domain/sessions/composition";
import { createEmptyDraft, toCreateSessionInput, toSessionDraft, toUpdateSessionInput } from "@/domain/sessions/SessionDraft";
import type { Session } from "@/domain/sessions/Session";

/**
 * PRE-7 (A1.2, D-437, D-440, MFN-02, MFN-03) — ajouts du domaine pour la
 * persistance : forme résolue v4 des copies, allocation des phases par le
 * compteur du Mouvement, clé de recherche et transport de la filiation.
 */

const phased = (workPhases: readonly WorkPhase[]): ExecutionParameters =>
  uniformParameters({
    mode: "DURATION",
    count: 2,
    target: workPhases.reduce((sum, phase) => sum + phase.durationSeconds, 0),
    pauseSeconds: 10,
    workPhases: [...workPhases],
  });

function movement(overrides: Partial<Movement> = {}): Movement {
  return {
    id: "mov-1",
    name: "Squat",
    description: null,
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases: [
      { id: 1, label: "Descente" },
      { id: 2, label: "Montée" },
    ],
    nextPhaseId: 4,
    used: false,
    levelGroup: null,
    ...overrides,
  };
}

describe("PRE-7 A1.2 — forme résolue v4 des copies", () => {
  it("même grammaire que la v3, version 4 ; relue à l'identique (représentation en mémoire v3)", () => {
    const parameters = phased([
      { id: 3, label: "Descente", durationSeconds: 6 },
      { id: 1, label: "Maintien", durationSeconds: 3 },
    ]);
    const json = serializeResolvedExecutionParameters(parameters);
    expect(JSON.parse(json).version).toBe(RESOLVED_EXECUTION_PARAMETERS_VERSION);
    expect(json).toBe(serializeExecutionParameters(parameters).replace('"version":3', '"version":4'));
    expect(readResolvedExecutionParameters(json)).toEqual(parameters);
    const variable = variableParameters({ mode: "REPETITIONS", rows: [[12, 10], ["FAILURE", 0]] });
    expect(readResolvedExecutionParameters(serializeResolvedExecutionParameters(variable))).toEqual(variable);
  });

  it("strict : v2, v3, Catalogue v4, version inconnue, NULL ou JSON corrompu → ExecutionParametersDataError ; jamais un repli", () => {
    const parameters = phased([{ id: 1, label: "Descente", durationSeconds: 6 }]);
    const catalog = serializeCatalogExecutionParameters(splitResolvedParameters(parameters).parameters);
    const v2 = serializeExecutionParameters(variableParameters({ mode: "DURATION", rows: [[30, 10]] })).replace('"version":3', '"version":2');
    for (const json of [v2, serializeExecutionParameters(parameters), catalog, '{"version":5}', null, "{"]) {
      expect(() => readResolvedExecutionParameters(json)).toThrow(ExecutionParametersDataError);
    }
    // Le lecteur v2/v3 du domaine (Instantané, preuves historiques) refuse la v4.
    expect(() => readExecutionParameters(serializeResolvedExecutionParameters(parameters))).toThrow(ExecutionParametersDataError);
  });

  it("l'écrivain refuse une durée de phase manquante : un frère incomplet ne devient jamais une copie (D-438)", () => {
    const incomplete = phased([
      { id: 1, label: "Descente", durationSeconds: 6 },
      { id: 2, label: "Maintien", durationSeconds: 0 },
    ]);
    expect(() => serializeResolvedExecutionParameters(incomplete)).toThrow("MFN-02");
  });
});

describe("PRE-7 A1.2 — allocation des phases par le compteur du Mouvement (MFN-02, MFN/AC30)", () => {
  it("garde les identités présentes dans la structure ; alloue les autres par le compteur, jamais par max + 1", () => {
    // Structure [1, 2], compteur 4 (la phase 3 a été retirée) ; le Brouillon propose 3 = max + 1.
    const allocation = allocatePhaseIdentities(
      movement(),
      phased([
        { id: 2, label: "Montée", durationSeconds: 4 },
        { id: 1, label: "Descente lente", durationSeconds: 5 },
        { id: 3, label: "Pause", durationSeconds: 2 },
      ]),
    );
    expect(allocation.movement.phases).toEqual([
      { id: 2, label: "Montée" },
      { id: 1, label: "Descente lente" },
      { id: 4, label: "Pause" },
    ]);
    expect(allocation.movement.nextPhaseId).toBe(5);
    expect(allocation.parameters.series.kind === "UNIFORM" && allocation.parameters.series.workPhases).toEqual([
      { id: 2, label: "Montée", durationSeconds: 4 },
      { id: 1, label: "Descente lente", durationSeconds: 5 },
      { id: 4, label: "Pause", durationSeconds: 2 },
    ]);
  });

  it("retrait : l'identité retirée reste consommée ; deux phases de même identité : la seconde est allouée", () => {
    const removed = allocatePhaseIdentities(movement(), phased([{ id: 1, label: "Descente", durationSeconds: 5 }]));
    expect(removed.movement.phases).toEqual([{ id: 1, label: "Descente" }]);
    expect(removed.movement.nextPhaseId).toBe(4);
    const duplicated = allocatePhaseIdentities(
      movement(),
      phased([
        { id: 1, label: "A", durationSeconds: 5 },
        { id: 1, label: "B", durationSeconds: 5 },
      ]),
    );
    expect(duplicated.movement.phases.map((phase) => phase.id)).toEqual([1, 4]);
  });

  it("série variable : structure vide, compteur conservé, paramètres inchangés", () => {
    const variable = variableParameters({ mode: "DURATION", rows: [[30, 10], [40, 10]] });
    const allocation = allocatePhaseIdentities(movement(), variable);
    expect(allocation.movement.phases).toEqual([]);
    expect(allocation.movement.nextPhaseId).toBe(4);
    expect(allocation.parameters).toBe(variable);
  });
});

describe("PRE-7 A1.2 — clé de recherche et filiation", () => {
  it("normalizeMovementName : espaces réduits, casse et accents neutralisés", () => {
    expect(normalizeMovementName("  Élévation   LATÉRALE ")).toBe("elevation laterale");
  });

  it("la filiation part de la définition, traverse le brouillon, la duplication et les entrées de Séance (création et modification)", () => {
    const definition: ActivityDefinition = {
      id: "def-1",
      movementId: "mov-1",
      name: "Squat",
      description: null,
      executionParameters: phased([{ id: 1, label: "Descente", durationSeconds: 6 }]),
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      sideMode: "UNILATERAL",
      createdAt: "now",
      updatedAt: "now",
    };
    const copy = activityDefinitionToDraftExercise(definition, "occ-1", null);
    expect(copy.sourceMovementId).toBe("mov-1");
    const exercises = duplicateActivity([copy], "occ-1", "occ-2");
    expect(exercises.map((exercise) => exercise.sourceMovementId)).toEqual(["mov-1", "mov-1"]);
    const created = toCreateSessionInput({ ...createEmptyDraft(), name: "Jambes", exercises });
    expect(created.ok && created.value.exercises.map((exercise) => exercise.sourceMovementId)).toEqual(["mov-1", "mov-1"]);

    // Relecture → brouillon → entrée de modification : la filiation n'est jamais perdue.
    const session = {
      id: "s",
      ownerId: "u",
      name: "Jambes",
      color: "#3B82F6",
      labelId: null,
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      createdAt: "now",
      updatedAt: "now",
      cycle: {
        id: "c",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "t",
          position: 1,
          repeatCount: 1,
          exercises: [
            {
              ...copy,
              position: 0,
              structuralPosition: "IN_TOUR",
              sourceMovementId: "mov-1",
              media: [],
            },
          ],
        },
      },
    } as Session;
    const draft = toSessionDraft(session);
    expect(draft.exercises[0]?.sourceMovementId).toBe("mov-1");
    const updated = toUpdateSessionInput(draft);
    expect(updated.ok && updated.value.activities[0]?.sourceMovementId).toBe("mov-1");
  });
});
