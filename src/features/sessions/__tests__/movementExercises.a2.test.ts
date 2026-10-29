import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { SessionStructure, StructureStopPointLocation } from "@/domain/sessions/structure";
import {
  exerciseOfMovement,
  handMovementsToComposition,
  inheritsCircuitSeriesCount,
  isExerciseParametersIncomplete,
  isPersistedMovementOccurrence,
  takeMovementsHandedToComposition,
  withMovementExercises,
} from "@/features/sessions/movementExercises";

/**
 * PRE-9 A.2 (ARB-22a, ARB-07, D-449) — Exercices créés depuis des Mouvements : contenu et
 * paramètres de départ, insertion après le dernier Exercice entré dans son conteneur (ancien modèle
 * et disposition générale), remise à usage unique ; garde : plus aucun parcours des anciennes
 * définitions depuis la Composition.
 */

const movement = (id: string, overrides: Partial<Movement> = {}): Movement => ({
  id,
  name: `Mouvement ${id}`,
  description: "Étape 1",
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
  ...overrides,
});

const existing = (id: string, structuralPosition: SessionDraftExercise["structuralPosition"] = "BEFORE_TOUR"): SessionDraftExercise => ({
  ...createExerciseDraft(id, 0),
  name: id,
  structuralPosition,
  executionParameters: durationParameters(30),
});

const DEFAULTS = { countdownSeconds: 7, endSeconds: 3 };

describe("PRE-9 A.2 — exerciseOfMovement", () => {
  it("occurrence du Mouvement : contenu repris, filiation, paramètres vierges avec Compte à rebours et Fin du Profil, sans Récupération", () => {
    const created = exerciseOfMovement(movement("m1"), "occ", DEFAULTS);
    expect(created).toMatchObject({
      id: "occ",
      type: "EXERCISE",
      name: "Mouvement m1",
      instruction: "Étape 1",
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      sourceMovementId: "m1",
      postActivityRecoverySeconds: null,
    });
    // Recette iPhone du 29/10/2026 : Durée et changement de côté Sans présélectionnés, Cible à renseigner.
    expect(created.executionParameters).toMatchObject({ mode: "DURATION", sideMode: "UNILATERAL", countdownSeconds: 7, endSeconds: 3 });
    expect(created.executionParameters.series).toMatchObject({ kind: "UNIFORM", count: 1, target: { kind: "UNSET" } });
  });

  it("Mouvement à phases : phases reprises, durées vides (MFN-09, `repriseExecutionParameters`)", () => {
    const created = exerciseOfMovement(
      movement("m2", { phases: [{ id: 1, label: "Descente" }, { id: 2, label: "Saut" }], nextPhaseId: 3 }),
      "occ",
      DEFAULTS,
    );
    expect(created.executionParameters.mode).toBe("DURATION");
    expect(created.executionParameters.series.kind === "UNIFORM" ? created.executionParameters.series.workPhases : null).toEqual([
      { id: 1, label: "Descente", durationSeconds: 0 },
      { id: 2, label: "Saut", durationSeconds: 0 },
    ]);
  });
});

describe("PRE-9 A.2 — withMovementExercises (ARB-07)", () => {
  it("ancien modèle : après le dernier Exercice affiché, dans sa zone (Circuit), dans l'ordre remis", () => {
    const draft: SessionDraft = { ...createEmptyDraft(), exercises: [existing("a"), existing("b", "IN_TOUR"), existing("c", "AFTER_TOUR")] };
    // Dernier Exercice affiché : c, après le Circuit.
    const additions = [exerciseOfMovement(movement("m1"), "n1", DEFAULTS), exerciseOfMovement(movement("m2"), "n2", DEFAULTS)];
    const result = withMovementExercises(draft, additions);
    expect(result.exercises.map((item) => item.id)).toEqual(["a", "b", "c", "n1", "n2"]);
    expect(result.exercises.slice(3).map((item) => item.structuralPosition)).toEqual(["AFTER_TOUR", "AFTER_TOUR"]);
    expect(result.structure).toBeUndefined();

    const inCircuit: SessionDraft = { ...createEmptyDraft(), exercises: [existing("a"), existing("b", "IN_TOUR")] };
    const entered = withMovementExercises(inCircuit, [exerciseOfMovement(movement("m1"), "n1", DEFAULTS)]);
    expect(entered.exercises.map((item) => [item.id, item.structuralPosition])).toEqual([
      ["a", "BEFORE_TOUR"],
      ["b", "IN_TOUR"],
      ["n1", "IN_TOUR"],
    ]);
  });

  it("disposition générale : après le dernier Exercice entré, dans son conteneur (Circuit d'un Cycle)", () => {
    const structure: SessionStructure<string, StructureStopPointLocation> = {
      elements: [
        { kind: "EXERCISE", exercise: "e0" },
        { kind: "CIRCUIT", circuit: { id: "ca", repeatCount: 1, nature: "TOURS", exercises: ["a1"] } },
        {
          kind: "CYCLE",
          cycle: { id: "cy", repeatCount: 2, members: [{ kind: "CIRCUIT", circuit: { id: "cb", repeatCount: 1, nature: "TOURS", exercises: ["b1"] } }] },
        },
      ],
      stopPoints: [],
    };
    const draft: SessionDraft = { ...createEmptyDraft(), exercises: ["e0", "a1", "b1"].map((id) => existing(id)), structure };
    const result = withMovementExercises(draft, [exerciseOfMovement(movement("m1"), "n1", DEFAULTS), exerciseOfMovement(movement("m2"), "n2", DEFAULTS)]);
    const cycle = result.structure?.elements[2];
    expect(cycle?.kind === "CYCLE" && cycle.cycle.members[0]?.kind === "CIRCUIT" ? cycle.cycle.members[0].circuit.exercises : null).toEqual([
      "b1",
      "n1",
      "n2",
    ]);
    expect(result.exercises.map((item) => item.id)).toEqual(["e0", "a1", "b1", "n1", "n2"]);
  });
});

describe("PRE-9 A.2 — remise des Mouvements à la Composition", () => {
  it("à usage unique ; une remise vide n'est rien", () => {
    handMovementsToComposition([movement("m1"), movement("m2")]);
    expect(takeMovementsHandedToComposition()?.map((item) => item.id)).toEqual(["m1", "m2"]);
    expect(takeMovementsHandedToComposition()).toBeNull();
    handMovementsToComposition([]);
    expect(takeMovementsHandedToComposition()).toBeNull();
  });
});

describe("Demande de Hermann du 29/10/2026 — carte « Paramètres à compléter » : feuille de paramètres au toucher", () => {
  it("un Exercice tout juste créé depuis un Mouvement est à compléter ; réglé, il ne l'est plus", () => {
    const created = exerciseOfMovement(movement("m1"), "new-1", DEFAULTS);
    expect(isExerciseParametersIncomplete(created)).toBe(true);
    expect(isExerciseParametersIncomplete(existing("a"))).toBe(false);
  });

  it("une Récupération n'ouvre jamais la feuille d'un Exercice", () => {
    expect(isExerciseParametersIncomplete({ ...exerciseOfMovement(movement("m1"), "r", DEFAULTS), type: "RECOVERY" })).toBe(false);
  });

  it("N hérité : Circuit unique de Séries (ancien modèle) ; Circuit de Séries d'une disposition générale", () => {
    const legacy: SessionDraft = { ...createEmptyDraft(), circuitNature: "SERIES", exercises: [existing("a"), existing("b", "IN_TOUR")] };
    expect(inheritsCircuitSeriesCount(legacy, legacy.exercises[1]!)).toBe(true);
    expect(inheritsCircuitSeriesCount(legacy, legacy.exercises[0]!)).toBe(false);
    expect(inheritsCircuitSeriesCount({ ...legacy, circuitNature: "TOURS" }, legacy.exercises[1]!)).toBe(false);
    const structure: SessionStructure<string, StructureStopPointLocation> = {
      elements: [
        { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 2, nature: "TOURS", exercises: ["a"] } },
        { kind: "CIRCUIT", circuit: { id: "c2", repeatCount: 3, nature: "SERIES", exercises: ["b"] } },
      ],
      stopPoints: [],
    };
    const rich: SessionDraft = { ...createEmptyDraft(), exercises: [existing("a"), existing("b")], structure };
    expect(inheritsCircuitSeriesCount(rich, rich.exercises[0]!)).toBe(false);
    expect(inheritsCircuitSeriesCount(rich, rich.exercises[1]!)).toBe(true);
  });

  it("structure des phases verrouillée pour l'occurrence d'un Mouvement enregistré, pas d'un Mouvement nouveau du brouillon", () => {
    expect(isPersistedMovementOccurrence({ sourceMovementId: "m1" }, undefined)).toBe(true);
    expect(isPersistedMovementOccurrence({ sourceMovementId: undefined }, undefined)).toBe(false);
    const fresh = { id: "m1", change: "NEW" as const, name: "M", description: null, categoryId: null, bodyZoneIds: [], media: [], phases: [], nextPhaseId: 1, aliases: [] };
    expect(isPersistedMovementOccurrence({ sourceMovementId: "m1" }, { m1: fresh })).toBe(false);
  });
});

describe("PRE-9 A.2 — garde : plus d'anciennes définitions depuis la Composition (ARB-22a, D-449)", () => {
  const root = join(__dirname, "..", "..", "..", "..");
  const files = [
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/movementExercises.ts",
    "src/features/sessions/useMovementExerciseIntake.tsx",
    "src/features/sessions/CreateMenu.tsx",
    "src/features/activities/MovementSelectionScreen.tsx",
    "app/(creation)/movement-selection.tsx",
  ];
  it.each(files)("%s ne référence ni l'ancienne sélection, ni les définitions du Catalogue autonome", (file) => {
    const source = readFileSync(join(root, file), "utf8");
    expect(source).not.toMatch(/ActivitySelection|activity-selection|catalogueDefinitionId|useActivityCatalogue|listDefinitions/);
  });
});
