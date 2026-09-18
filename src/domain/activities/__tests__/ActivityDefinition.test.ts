import { describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  activityDefinitionToInput,
  createEmptyActivityDefinitionDraft,
  validateActivityDefinitionInput,
  type ActivityDefinition,
} from "@/domain/activities/ActivityDefinition";

function baseInput() {
  return {
    name: "Squat",
    description: "Descente lente",
    executionMode: "DURATION" as const,
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 3,
    pauseSeconds: 10,
    recoverySeconds: 0,
    bodyZoneIds: ["cuisses"],
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
  recoverySeconds: 0,
  bodyZoneIds: ["cuisses"],
  sideMode: "UNILATERAL",
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
});

describe("createEmptyActivityDefinitionDraft", () => {
  it("produces a valid draft with defaults", () => {
    const draft = createEmptyActivityDefinitionDraft();
    expect(draft.name).toBe("");
    expect(draft.seriesCount).toBeGreaterThanOrEqual(1);
    expect(draft.bodyZoneIds).toEqual([]);
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
      recoverySeconds: PERSISTED.recoverySeconds,
      bodyZoneIds: PERSISTED.bodyZoneIds,
      sideMode: PERSISTED.sideMode,
    });
  });
});

describe("activityDefinitionToDraftExercise", () => {
  it("creates an independent copy with a new id and all business fields copied", () => {
    const copy = activityDefinitionToDraftExercise(PERSISTED, "new-id");
    expect(copy.id).toBe("new-id");
    expect(copy.name).toBe(PERSISTED.name);
    expect(copy.instruction).toBe(PERSISTED.description);
    expect(copy.durationSeconds).toBe(PERSISTED.durationSeconds);
    expect(copy.seriesCount).toBe(PERSISTED.seriesCount);
    expect(copy.pauseSeconds).toBe(PERSISTED.pauseSeconds);
    expect(copy.recoverySeconds).toBe(PERSISTED.recoverySeconds);
    expect(copy.bodyZoneIds).toEqual(PERSISTED.bodyZoneIds);
    expect(copy.bodyZoneIds).not.toBe(PERSISTED.bodyZoneIds);
    expect(copy.sideMode).toBe(PERSISTED.sideMode);
  });
});
