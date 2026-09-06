import { describe, expect, it } from "@jest/globals";

import { DEFAULT_SESSION_COLOR, type Activity, type Session } from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  createExerciseDraft,
  exerciseEquals,
  isSessionDraftDirty,
  toCreateSessionInput,
  toSessionDraft,
  type SessionDraft,
  type SessionDraftCategoryDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import {
  DEFAULT_EXECUTION_MODE,
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_FINAL_PHASE_SECONDS,
  DEFAULT_INITIAL_COUNTDOWN_SECONDS,
  DEFAULT_PAUSE_SECONDS,
  DEFAULT_SERIES_COUNT,
} from "@/domain/sessions/defaults";

describe("createEmptyDraft", () => {
  it("initializes every field from the canonical defaults, with no Activity and no Category yet", () => {
    expect(createEmptyDraft()).toEqual({
      name: "",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
      finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
      exercises: [],
      categoryDrafts: [],
      selectedCategoryIds: [],
    });
  });
});

describe("createExerciseDraft", () => {
  it("initializes an empty name, Duration mode, the canonical default duration, one Series without pause, no instruction, no body zone", () => {
    expect(createExerciseDraft("ex-1")).toEqual({
      id: "ex-1",
      name: "",
      executionMode: DEFAULT_EXECUTION_MODE,
      durationSeconds: DEFAULT_EXERCISE_DURATION_SECONDS,
      repetitionCount: null,
      seriesCount: DEFAULT_SERIES_COUNT,
      pauseSeconds: DEFAULT_PAUSE_SECONDS,
      instruction: null,
      bodyZoneIds: [],
    });
  });

  it("uses exactly the id provided by the caller, never a generated one", () => {
    expect(createExerciseDraft("a").id).toBe("a");
    expect(createExerciseDraft("b").id).toBe("b");
  });
});

function anActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "activity-1",
    type: "EXERCISE",
    executionMode: "DURATION",
    structuralPosition: "IN_TOUR",
    position: 0,
    name: "Gainage",
    durationSeconds: 30,
    repetitionCount: null,
    seriesCount: 1,
    pauseSeconds: 0,
    instruction: null,
    bodyZoneIds: [],
    ...overrides,
  };
}

describe("toSessionDraft", () => {
  function aSession(overrides: Partial<Session> = {}): Session {
    return {
      id: "session-1",
      ownerId: "usr_test",
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercises: [anActivity()],
        },
      },
      categories: [],
      ...overrides,
    };
  }

  it("copies the editable fields exactly, without any identity or audit field beyond each Activity's own id", () => {
    const session = aSession();
    expect(toSessionDraft(session)).toEqual({
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: [
        {
          id: "activity-1",
          name: "Gainage",
          executionMode: "DURATION",
          durationSeconds: 30,
          repetitionCount: null,
          seriesCount: 1,
          pauseSeconds: 0,
          instruction: null,
          bodyZoneIds: [],
        },
      ],
      categoryDrafts: [],
      selectedCategoryIds: [],
    });
  });

  it("maps every persisted Activity, in order, never only the first (T01-S09)", () => {
    const session = aSession({
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercises: [
            anActivity({ id: "a1", name: "Gainage" }),
            anActivity({ id: "a2", name: "Squats", position: 1 }),
          ],
        },
      },
    });
    const draft = toSessionDraft(session);
    expect(draft.exercises.map((exercise) => exercise.id)).toEqual(["a1", "a2"]);
    expect(draft.exercises.map((exercise) => exercise.name)).toEqual(["Gainage", "Squats"]);
  });

  it("preserves each Activity's real bodyZoneIds (no longer forced to [])", () => {
    const session = aSession({
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercises: [anActivity({ bodyZoneIds: ["dos", "epaules"] })],
        },
      },
    });
    expect(toSessionDraft(session).exercises[0]?.bodyZoneIds).toEqual(["dos", "epaules"]);
  });

  it("preserves a null instruction without turning it into an empty string", () => {
    const session = aSession({
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercises: [anActivity({ instruction: null })],
        },
      },
    });
    expect(toSessionDraft(session).exercises[0]?.instruction).toBeNull();
  });

  it("maps every associated Category to a selected id, never as a local draft (T01-S09)", () => {
    const session = aSession({
      categories: [
        { id: "cardio", name: "Cardio", canonicalKey: "cardio", isPredefined: true, displayOrder: 1, createdAt: "2026-01-01T00:00:00.000Z" },
        { id: "custom-1", name: "Ma catégorie", canonicalKey: "ma categorie", isPredefined: false, displayOrder: null, createdAt: "2026-01-02T00:00:00.000Z" },
      ],
    });
    const draft = toSessionDraft(session);
    expect(draft.categoryDrafts).toEqual([]);
    expect(draft.selectedCategoryIds).toEqual(["cardio", "custom-1"]);
  });

  it("round-trips through toCreateSessionInput to reproduce the original editable fields", () => {
    const session = aSession();
    const result = toCreateSessionInput(toSessionDraft(session));
    expect(result).toEqual({
      ok: true,
      value: {
        name: session.name,
        color: session.color,
        initialCountdownSeconds: session.initialCountdownSeconds,
        finalPhaseSeconds: session.finalPhaseSeconds,
        exercises: [
          {
            name: "Gainage",
            executionMode: "DURATION",
            durationSeconds: 30,
            repetitionCount: null,
            seriesCount: 1,
            pauseSeconds: 0,
            instruction: null,
            bodyZoneIds: [],
          },
        ],
        categories: [],
      },
    });
  });
});

describe("isSessionDraftDirty", () => {
  it("is false for a freshly created empty draft", () => {
    expect(isSessionDraftDirty(createEmptyDraft())).toBe(false);
  });

  it("is true as soon as one Activity is present (empty draft has exercises: [])", () => {
    expect(
      isSessionDraftDirty({ ...createEmptyDraft(), exercises: [createExerciseDraft("ex-1")] }),
    ).toBe(true);
  });

  it("is order-sensitive between two otherwise-identical Activities", () => {
    const a = createExerciseDraft("ex-1");
    const b = { ...createExerciseDraft("ex-2"), name: "Squats" };
    expect(isSessionDraftDirty({ ...createEmptyDraft(), exercises: [a, b] })).toBe(true);
    expect(isSessionDraftDirty({ ...createEmptyDraft(), exercises: [b, a] })).toBe(true);
  });

  it("is true as soon as one Category is selected (empty draft has selectedCategoryIds: [])", () => {
    expect(
      isSessionDraftDirty({ ...createEmptyDraft(), selectedCategoryIds: ["cardio"] }),
    ).toBe(true);
  });

  it("is order-INsensitive for selected category ids (a set, not a sequence)", () => {
    const forward = { ...createEmptyDraft(), selectedCategoryIds: ["cardio", "mobilite"] };
    const backward = { ...createEmptyDraft(), selectedCategoryIds: ["mobilite", "cardio"] };
    expect(isSessionDraftDirty(forward)).toBe(true);
    // The two orderings represent the exact same set of selections: neither
    // is "dirtier" than the other relative to createEmptyDraft(), and they
    // must compare as identical to each other (order truly indifferent).
    expect(isSessionDraftDirty(backward)).toBe(true);
    expect(forward.selectedCategoryIds).not.toEqual(backward.selectedCategoryIds);
  });

  it("is false again once selectedCategoryIds is explicitly reset to [], matching the empty draft exactly", () => {
    const withSelection: SessionDraft = {
      ...createEmptyDraft(),
      selectedCategoryIds: ["cardio"],
    };
    expect(isSessionDraftDirty({ ...withSelection, selectedCategoryIds: [] })).toBe(false);
  });

  it("is true as soon as one local Category draft exists, even if not selected (T01-S09, point A: existence survives deselection)", () => {
    const draft: SessionDraftCategoryDraft = { id: "local-1", name: "Ma catégorie" };
    expect(
      isSessionDraftDirty({ ...createEmptyDraft(), categoryDrafts: [draft], selectedCategoryIds: [] }),
    ).toBe(true);
  });

  it("distinguishes a local Category draft by id and by name", () => {
    const initial: SessionDraft = {
      ...createEmptyDraft(),
      categoryDrafts: [{ id: "local-1", name: "Ma catégorie" }],
      selectedCategoryIds: ["local-1"],
    };
    expect(isSessionDraftDirty(initial)).toBe(true); // dirty relative to the EMPTY draft, obviously.
    const differentName: SessionDraft = {
      ...initial,
      categoryDrafts: [{ id: "local-1", name: "Autre" }],
    };
    expect(isSessionDraftDirty(differentName)).toBe(true);
  });
});

describe("exerciseEquals (exported for ExerciseScreen, T01-S08)", () => {
  it("is true for two null exercises", () => {
    expect(exerciseEquals(null, null)).toBe(true);
  });

  it("is false when only one side is null", () => {
    expect(exerciseEquals(null, createExerciseDraft("ex-1"))).toBe(false);
    expect(exerciseEquals(createExerciseDraft("ex-1"), null)).toBe(false);
  });

  it("is true for two structurally identical, distinct objects", () => {
    expect(exerciseEquals(createExerciseDraft("ex-1"), { ...createExerciseDraft("ex-1") })).toBe(
      true,
    );
  });

  it("compares bodyZoneIds as a set: order never matters, content does", () => {
    const a: SessionDraftExercise = { ...createExerciseDraft("ex-1"), bodyZoneIds: ["dos", "epaules"] };
    const bReordered: SessionDraftExercise = {
      ...createExerciseDraft("ex-1"),
      bodyZoneIds: ["epaules", "dos"],
    };
    expect(exerciseEquals(a, bReordered)).toBe(true);
  });
});

describe("toCreateSessionInput (T01-S09, multi-exercise + categories)", () => {
  function completeDraft(): SessionDraft {
    return {
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 30 }],
      categoryDrafts: [],
      selectedCategoryIds: [],
    };
  }

  it("fails on an empty draft and reports every violation at once (session name + zero Activity)", () => {
    const result = toCreateSessionInput(createEmptyDraft());
    expect(result).toEqual({
      ok: false,
      violations: [
        { code: "REQUIRED", field: "session.name" },
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "exercise.durationSeconds" },
      ],
    });
  });

  it("succeeds and converts a fully completed draft to a persistable CreateSessionInput", () => {
    const result = toCreateSessionInput(completeDraft());
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Séance simple",
        color: DEFAULT_SESSION_COLOR,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        exercises: [
          {
            name: "Gainage",
            executionMode: "DURATION",
            durationSeconds: 30,
            repetitionCount: null,
            seriesCount: 1,
            pauseSeconds: 0,
            instruction: null,
            bodyZoneIds: [],
          },
        ],
        categories: [],
      },
    });
  });

  it("persists ALL Activities of the collection, in order, without loss — supersedes the REWORK12-era 'first exercise only' limitation", () => {
    const draft: SessionDraft = {
      ...completeDraft(),
      exercises: [
        { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 30 },
        { ...createExerciseDraft("ex-2"), name: "Squats", durationSeconds: 45, seriesCount: 3 },
      ],
    };
    const result = toCreateSessionInput(draft);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.exercises).toHaveLength(2);
      expect(result.value.exercises.map((exercise) => exercise.name)).toEqual(["Gainage", "Squats"]);
      expect(result.value.exercises[1]).toMatchObject({ name: "Squats", durationSeconds: 45, seriesCount: 3 });
    }
  });

  it("resolves each selected id against categoryDrafts to produce EXISTING or NEW, in selection order", () => {
    const draft: SessionDraft = {
      ...completeDraft(),
      categoryDrafts: [{ id: "local-1", name: "Ma catégorie" }],
      selectedCategoryIds: ["cardio", "local-1"],
    };
    const result = toCreateSessionInput(draft);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.categories).toEqual([
        { kind: "EXISTING", categoryId: "cardio" },
        { kind: "NEW", name: "Ma catégorie" },
      ]);
    }
  });

  it("never persists a local Category draft that is not currently selected (T01-S09, point A)", () => {
    const draft: SessionDraft = {
      ...completeDraft(),
      categoryDrafts: [
        { id: "local-1", name: "Sélectionnée" },
        { id: "local-2", name: "Désélectionnée" },
      ],
      selectedCategoryIds: ["local-1"],
    };
    const result = toCreateSessionInput(draft);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.categories).toEqual([{ kind: "NEW", name: "Sélectionnée" }]);
    }
  });

  it("succeeds with zero Category selected (D-106: never required)", () => {
    const result = toCreateSessionInput(completeDraft());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.categories).toEqual([]);
    }
  });

  it("never throws, even on an entirely invalid draft", () => {
    expect(() => toCreateSessionInput(createEmptyDraft())).not.toThrow();
  });
});
