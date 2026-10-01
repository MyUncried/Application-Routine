import { describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  activityDefinitionToInput,
  createEmptyActivityDefinitionDraft,
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";

function baseInput(): CreateActivityDefinitionInput {
  return {
    name: "Squat",
    description: "Descente lente",
    executionMode: "DURATION",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 3,
    pauseSeconds: 10,
    category: { kind: "EXISTING", categoryId: "cardio" },
    bodyZoneIds: ["cuisses"],
    sideRecoverySeconds: 0,
  };
}

const PERSISTED: ActivityDefinition = {
  id: "def-1",
  name: "Squat",
  description: "Descente lente",
  executionMode: "DURATION",
  durationSeconds: 30,
  repetitionCount: null,
  seriesCount: 3,
  pauseSeconds: 10,
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  sideMode: "UNILATERAL",
  sideRecoverySeconds: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("validateActivityDefinitionInput", () => {
  it("accepts a valid DURATION input", () => {
    const result = validateActivityDefinitionInput(baseInput());
    expect(result.ok).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = validateActivityDefinitionInput({ ...baseInput(), name: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({
        code: "REQUIRED",
        field: "activityDefinition.name",
      });
    }
  });

  it("requires durationSeconds in DURATION mode", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      durationSeconds: null,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects durationSeconds present in REPETITIONS mode", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      executionMode: "REPETITIONS",
      durationSeconds: 30,
      repetitionCount: 10,
    });
    expect(result.ok).toBe(false);
  });

  it("accepts TO_FAILURE without any target", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      executionMode: "TO_FAILURE",
      durationSeconds: null,
      repetitionCount: null,
    });
    expect(result.ok).toBe(true);
  });

  it("aggregates every violation rather than stopping at the first", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      name: "",
      seriesCount: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    }
  });

  /** V2-PRE-1 (plan §4) : « Catégorie exactement unique ... sans affectation automatique » — un identifiant vide échoue explicitement. */
  it("requires a Category — an empty EXISTING categoryId fails", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      category: { kind: "EXISTING", categoryId: "" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({
        code: "REQUIRED",
        field: "activityDefinition.category",
      });
    }
  });

  it("accepts creating a NEW Category with a valid name and color", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      category: { kind: "NEW", name: "Étirements du soir", color: "#3B82F6" },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a NEW Category with an invalid color", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      category: { kind: "NEW", name: "Étirements du soir", color: "#000000" as never },
    });
    expect(result.ok).toBe(false);
  });

  /** V2-PRE-1 (plan §4) : « Zones non vides, distinctes et valides ». */
  it("requires at least one body zone", () => {
    const result = validateActivityDefinitionInput({ ...baseInput(), bodyZoneIds: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({
        code: "REQUIRED",
        field: "activityDefinition.bodyZoneIds",
      });
    }
  });

  it("rejects a duplicate body zone", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      bodyZoneIds: ["cuisses", "cuisses"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({
        code: "DUPLICATE",
        field: "activityDefinition.bodyZoneIds",
      });
    }
  });

  it("validates sideRecoverySeconds within 0..5999", () => {
    const result = validateActivityDefinitionInput({ ...baseInput(), sideRecoverySeconds: -1 });
    expect(result.ok).toBe(false);
  });
});

describe("createEmptyActivityDefinitionDraft", () => {
  it("produces a valid draft with defaults, without any Category preselected", () => {
    const draft = createEmptyActivityDefinitionDraft();
    expect(draft.name).toBe("");
    expect(draft.seriesCount).toBeGreaterThanOrEqual(1);
    expect(draft.bodyZoneIds).toEqual([]);
    expect(draft).not.toHaveProperty("category");
  });
});

describe("activityDefinitionToInput", () => {
  it("round-trips every editable field for exact re-opening", () => {
    const input = activityDefinitionToInput(PERSISTED);
    expect(input).toEqual({
      name: PERSISTED.name,
      description: PERSISTED.description,
      executionMode: PERSISTED.executionMode,
      durationSeconds: PERSISTED.durationSeconds,
      repetitionCount: PERSISTED.repetitionCount,
      seriesCount: PERSISTED.seriesCount,
      pauseSeconds: PERSISTED.pauseSeconds,
      category: { kind: "EXISTING", categoryId: PERSISTED.categoryId },
      bodyZoneIds: PERSISTED.bodyZoneIds,
      sideMode: PERSISTED.sideMode,
      sideRecoverySeconds: PERSISTED.sideRecoverySeconds,
    });
  });
});

describe("activityDefinitionToDraftExercise", () => {
  it("creates an independent copy with a new id, an explicit postActivityRecoverySeconds, and all business fields copied", () => {
    const copy = activityDefinitionToDraftExercise(PERSISTED, "new-id", 30);
    expect(copy.id).toBe("new-id");
    expect(copy.name).toBe(PERSISTED.name);
    expect(copy.instruction).toBe(PERSISTED.description);
    expect(copy.durationSeconds).toBe(PERSISTED.durationSeconds);
    expect(copy.seriesCount).toBe(PERSISTED.seriesCount);
    expect(copy.pauseSeconds).toBe(PERSISTED.pauseSeconds);
    // V2-PRE-1 (plan §3.1/§3.2) : ActivityDefinition ne porte plus aucune
    // récupération — la valeur de l'occurrence est un paramètre EXPLICITE,
    // jamais dérivé de la définition source.
    expect(copy.postActivityRecoverySeconds).toBe(30);
    expect(copy.bodyZoneIds).toEqual(PERSISTED.bodyZoneIds);
    expect(copy.bodyZoneIds).not.toBe(PERSISTED.bodyZoneIds);
    expect(copy.sideMode).toBe(PERSISTED.sideMode);
  });
});
