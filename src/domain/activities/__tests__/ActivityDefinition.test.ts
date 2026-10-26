import { describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  activityDefinitionToInput,
  createEmptyActivityDefinitionDraft,
  sideRecoveryOnSideModeChange,
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import { unsetTarget, type ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import {
  allFailureParameters,
  durationParameters,
  uniformParameters,
} from "@/domain/activities/testing/executionParametersFixtures";

function baseInput(): CreateActivityDefinitionInput {
  return {
    name: "Squat",
    description: "Descente lente",
    executionParameters: durationParameters(30, 3, 10),
    category: { kind: "EXISTING", categoryId: "cardio" },
    bodyZoneIds: ["cuisses"],
  };
}

const PERSISTED: ActivityDefinition = {
  id: "def-1",
  movementId: "mov-1",
  name: "Squat",
  description: "Descente lente",
  executionParameters: durationParameters(30, 3, 10),
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

  /**
   * V2-PRE-1 (plan §3.3/§13, REQ-001108DC7F67664C) : les médias sont
   * transmis tels quels, dans l'ordre du tableau (position stable) — jamais
   * retriés, jamais une validation ou une résolution d'`assetId` dupliquée
   * ici (laissée au Repository, même patron que `category`/`bodyZoneIds`).
   */
  it("passes the ordered media list through unchanged when provided", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      media: [{ assetId: "asset-2" }, { assetId: "asset-1" }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.media).toEqual([{ assetId: "asset-2" }, { assetId: "asset-1" }]);
    }
  });

  it("defaults media to an empty list when omitted — never undefined", () => {
    const result = validateActivityDefinitionInput(baseInput());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.media).toEqual([]);
    }
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

  it("refuse une Cible à renseigner (UNSET) en mode Durée", () => {
    const parameters: ExecutionParameters = { ...durationParameters(30, 3, 10), series: { kind: "UNIFORM", count: 3, target: unsetTarget(), pauseSeconds: 10, loadKg: 0, workPhases: [] } };
    const result = validateActivityDefinitionInput({ ...baseInput(), executionParameters: parameters });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual(
        expect.objectContaining({ code: "OUT_OF_RANGE", field: "activityDefinition.executionParameters" }),
      );
    }
  });

  it("accepte un Exercice en Répétitions dont toutes les Cibles sont à l'échec", () => {
    const result = validateActivityDefinitionInput({ ...baseInput(), executionParameters: allFailureParameters(3, 10) });
    expect(result.ok).toBe(true);
  });

  it("aggregates every violation rather than stopping at the first", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      name: "",
      executionParameters: uniformParameters({ count: 0, target: 30 }),
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

  it("refuse une Pause entre les côtés négative (niveau structurel, Q28)", () => {
    const result = validateActivityDefinitionInput({
      ...baseInput(),
      executionParameters: durationParameters(30, 3, 10, { sideMode: "RIGHT_LEFT", sideRecoverySeconds: -1 }),
    });
    expect(result.ok).toBe(false);
  });
});

describe("createEmptyActivityDefinitionDraft", () => {
  it("produces a valid draft with defaults, without any Category preselected", () => {
    const draft = createEmptyActivityDefinitionDraft();
    expect(draft.name).toBe("");
    expect(draft.executionParameters.series).toEqual(
      expect.objectContaining({ kind: "UNIFORM", count: 1, target: { kind: "NUMBER", value: 30 } }),
    );
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
      category: { kind: "EXISTING", categoryId: PERSISTED.categoryId },
      bodyZoneIds: PERSISTED.bodyZoneIds,
      executionParameters: PERSISTED.executionParameters,
    });
    expect(input.executionParameters).not.toBe(PERSISTED.executionParameters);
  });
});

describe("activityDefinitionToDraftExercise", () => {
  it("creates an independent copy with a new id, an explicit postActivityRecoverySeconds, and all business fields copied", () => {
    const copy = activityDefinitionToDraftExercise(PERSISTED, "new-id", 30);
    expect(copy.id).toBe("new-id");
    expect(copy.name).toBe(PERSISTED.name);
    expect(copy.instruction).toBe(PERSISTED.description);
    expect(copy.executionParameters).toEqual(PERSISTED.executionParameters);
    expect(copy.executionParameters).not.toBe(PERSISTED.executionParameters);
    // V2-PRE-1 (plan §3.1/§3.2) : ActivityDefinition ne porte plus aucune
    // récupération — la valeur de l'occurrence est un paramètre EXPLICITE,
    // jamais dérivé de la définition source.
    expect(copy.postActivityRecoverySeconds).toBe(30);
    expect(copy.bodyZoneIds).toEqual(PERSISTED.bodyZoneIds);
    expect(copy.bodyZoneIds).not.toBe(PERSISTED.bodyZoneIds);
    expect(copy.sideMode).toBe(PERSISTED.sideMode);
  });
});

describe("sideRecoveryOnSideModeChange (V2-PRE-2, T21, D-213)", () => {
  it("copies the Profile's current value when activating bilaterality from Sans changement (UNILATERAL) to D→G", () => {
    expect(sideRecoveryOnSideModeChange("UNILATERAL", "RIGHT_LEFT", 0, 10)).toBe(10);
  });

  it("copies the Profile's current value when activating bilaterality from Sans changement (UNILATERAL) to G→D", () => {
    expect(sideRecoveryOnSideModeChange("UNILATERAL", "LEFT_RIGHT", 0, 10)).toBe(10);
  });

  it("never copies the Profile's value for a unilateral creation (no transition — previous equals next)", () => {
    expect(sideRecoveryOnSideModeChange("UNILATERAL", "UNILATERAL", 0, 10)).toBe(0);
  });

  it("keeps the current value unchanged when switching between the two bilateral directions (D→G ↔ G→D)", () => {
    expect(sideRecoveryOnSideModeChange("RIGHT_LEFT", "LEFT_RIGHT", 15, 10)).toBe(15);
    expect(sideRecoveryOnSideModeChange("LEFT_RIGHT", "RIGHT_LEFT", 15, 10)).toBe(15);
  });

  it("keeps the current value unchanged when returning to Sans changement — the value becomes irrelevant but is never reset", () => {
    expect(sideRecoveryOnSideModeChange("RIGHT_LEFT", "UNILATERAL", 15, 10)).toBe(15);
  });

  it("keeps an already-bilateral Exercise's stored value unchanged (no-op transition)", () => {
    expect(sideRecoveryOnSideModeChange("RIGHT_LEFT", "RIGHT_LEFT", 15, 10)).toBe(15);
  });
});
