import { describe, expect, it } from "@jest/globals";

import type { WorkPhase } from "@/domain/activities/ExecutionParameters";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  createEmptyDraft,
  createExerciseDraft,
  replaceOccurrence,
  withOccurrenceMovement,
  type OccurrenceMovementContent,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";

/**
 * PRE-7 story R-6 (D-445 C05, C09 ; MFN-09 l.412 et l.418 ; CE-UI-NIV-01 §4) — changement de niveau
 * d'une occurrence de Séance : vue du mouvement choisi avec paramètres transférés par rang
 * (`withOccurrenceMovement`), puis remplacement à la même place par une nouvelle identité
 * d'occurrence (`replaceOccurrence`).
 */

const phases = (...durations: number[]): WorkPhase[] =>
  durations.map((durationSeconds, index) => ({ id: index + 1, label: `Phase ${index + 1}`, durationSeconds }));

const occurrence = (id: string, overrides: Partial<SessionDraftExercise> = {}): SessionDraftExercise => ({
  ...createExerciseDraft(id, 20),
  name: "Squats",
  instruction: "Buste droit",
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  structuralPosition: "IN_TOUR",
  executionParameters: uniformParameters({ mode: "DURATION", count: 3, target: 45, pauseSeconds: 10, workPhases: phases(5, 2) }),
  sourceMovementId: "mov-squats",
  copyNumber: 2,
  ...overrides,
});

const assisted: OccurrenceMovementContent = {
  id: "mov-assisted",
  name: "Squats assistés",
  description: "Avec appui",
  categoryId: "renfo",
  bodyZoneIds: ["cuisses", "fessiers"],
  media: [],
  phases: [
    { id: 7, label: "Montée" },
    { id: 8, label: "Maintien" },
    { id: 9, label: "Descente" },
  ],
};

const draftOf = (exercises: readonly SessionDraftExercise[], extra: Partial<SessionDraft> = {}): SessionDraft => ({
  ...createEmptyDraft(),
  exercises,
  ...extra,
});

describe("PRE-7 R-6 — withOccurrenceMovement", () => {
  it("contenu du mouvement choisi, référence au mouvement ; paramètres transférés par rang, le reste conservé", () => {
    const before = occurrence("occ-1");
    const next = withOccurrenceMovement(before, assisted);
    expect(next).toMatchObject({
      id: "occ-1",
      name: "Squats assistés",
      instruction: "Avec appui",
      categoryId: "renfo",
      bodyZoneIds: ["cuisses", "fessiers"],
      sourceMovementId: "mov-assisted",
      postActivityRecoverySeconds: 20,
      structuralPosition: "IN_TOUR",
      copyNumber: 2,
    });
    expect(next.executionParameters.series.workPhases).toEqual([
      { id: 7, label: "Montée", durationSeconds: 5 },
      { id: 8, label: "Maintien", durationSeconds: 2 },
      { id: 9, label: "Descente", durationSeconds: 0 },
    ]);
    expect(next.executionParameters.series).toMatchObject({ count: 3, target: { kind: "NUMBER", value: 45 }, pauseSeconds: 10 });
    // Entrée intacte.
    expect(before.sourceMovementId).toBe("mov-squats");
  });

  it("vers un mouvement sans phases : cible conservée, aucune phase", () => {
    const next = withOccurrenceMovement(occurrence("occ-1"), { ...assisted, phases: [] });
    expect(next.executionParameters.series.workPhases).toEqual([]);
    expect(next.executionParameters.series).toMatchObject({ target: { kind: "NUMBER", value: 45 } });
  });
});

describe("PRE-7 R-6 — replaceOccurrence", () => {
  it("même place, nouvelle identité ; les autres occurrences et la table des Mouvements sont inchangées", () => {
    const movements = { "mov-new": { id: "mov-new" } } as unknown as SessionDraft["movements"];
    const draft = draftOf([occurrence("occ-0", { sourceMovementId: "mov-other" }), occurrence("occ-1"), occurrence("occ-2")], { movements });
    const replacement = { ...withOccurrenceMovement(occurrence("occ-1"), assisted), id: "occ-new", copyNumber: null };
    const result = replaceOccurrence(draft, "occ-1", replacement);
    expect(result.exercises.map((exercise) => exercise.id)).toEqual(["occ-0", "occ-new", "occ-2"]);
    expect(result.exercises[1]).toBe(replacement);
    expect(result.exercises[0]).toBe(draft.exercises[0]);
    expect(result.exercises[2]).toBe(draft.exercises[2]);
    expect(result).not.toHaveProperty("movements");
    expect(result.circuitSeriesReserve).toBeUndefined();
  });

  it("l'entrée de réserve de Circuit suit l'occurrence remplacée ; les autres entrées restent", () => {
    const rows = [{ target: { kind: "NUMBER" as const, value: 30 }, pauseSeconds: 10, loadKg: 0 }];
    const draft = draftOf([occurrence("occ-1"), occurrence("occ-2")], {
      circuitSeriesReserve: { "occ-1": rows, "occ-2": [] },
    });
    const result = replaceOccurrence(draft, "occ-1", { ...occurrence("occ-1"), id: "occ-new" });
    expect(result.circuitSeriesReserve).toEqual({ "occ-new": rows, "occ-2": [] });
  });

  it("occurrence absente du brouillon : entrée invalide, lève", () => {
    expect(() => replaceOccurrence(draftOf([occurrence("occ-1")]), "inconnue", occurrence("occ-new"))).toThrow();
  });
});
