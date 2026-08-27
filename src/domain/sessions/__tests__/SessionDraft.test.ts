import { describe, expect, it } from "@jest/globals";

import { DEFAULT_SESSION_COLOR, type Session } from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  createExerciseDraft,
  isSessionDraftDirty,
  toCreateSessionInput,
  toSessionDraft,
  type SessionDraft,
} from "@/domain/sessions/SessionDraft";
import {
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_FINAL_PHASE_SECONDS,
  DEFAULT_INITIAL_COUNTDOWN_SECONDS,
} from "@/domain/sessions/defaults";

describe("createEmptyDraft", () => {
  it("initializes every field from the canonical defaults, with no exercise yet", () => {
    expect(createEmptyDraft()).toEqual({
      name: "",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
      finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
      exercise: null,
    });
  });
});

describe("createExerciseDraft", () => {
  it("initializes an empty name, the canonical default duration and no instruction", () => {
    expect(createExerciseDraft()).toEqual({
      name: "",
      durationSeconds: DEFAULT_EXERCISE_DURATION_SECONDS,
      instruction: null,
    });
  });

  it("really uses DEFAULT_EXERCISE_DURATION_SECONDS (30 s), not a duplicated literal", () => {
    expect(createExerciseDraft().durationSeconds).toBe(30);
    expect(createExerciseDraft().durationSeconds).toBe(DEFAULT_EXERCISE_DURATION_SECONDS);
  });
});

describe("toSessionDraft", () => {
  function aSession(instruction: string | null = "Respirer profondément"): Session {
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
          exercise: {
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
            instruction,
          },
        },
      },
    };
  }

  it("copies the seven editable fields exactly, without any identity or audit field", () => {
    const session = aSession();
    expect(toSessionDraft(session)).toEqual({
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercise: { name: "Gainage", durationSeconds: 30, instruction: "Respirer profondément" },
    });
  });

  it("preserves a null instruction without turning it into an empty string", () => {
    const draft = toSessionDraft(aSession(null));
    expect(draft.exercise?.instruction).toBeNull();
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
        exercise: {
          name: session.cycle.tour.exercise.name,
          durationSeconds: session.cycle.tour.exercise.durationSeconds,
          instruction: session.cycle.tour.exercise.instruction,
        },
      },
    });
  });
});

describe("isSessionDraftDirty", () => {
  it("is false for a freshly created empty draft", () => {
    expect(isSessionDraftDirty(createEmptyDraft())).toBe(false);
  });

  it("is false for a draft structurally equal to createEmptyDraft(), even as a distinct object", () => {
    const draft: SessionDraft = {
      name: "",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
      finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
      exercise: null,
    };
    expect(isSessionDraftDirty(draft)).toBe(false);
  });

  it("is true when only the name differs from the empty draft", () => {
    expect(isSessionDraftDirty({ ...createEmptyDraft(), name: "Séance simple" })).toBe(true);
  });

  it("is true when only the color differs from the empty draft", () => {
    expect(isSessionDraftDirty({ ...createEmptyDraft(), color: "#E5484D" })).toBe(true);
  });

  it("is true when only initialCountdownSeconds differs from the empty draft", () => {
    expect(
      isSessionDraftDirty({
        ...createEmptyDraft(),
        initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS + 1,
      }),
    ).toBe(true);
  });

  it("is true when only finalPhaseSeconds differs from the empty draft", () => {
    expect(
      isSessionDraftDirty({
        ...createEmptyDraft(),
        finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS + 1,
      }),
    ).toBe(true);
  });

  it("is true as soon as an exercise is present (empty draft has exercise: null)", () => {
    expect(
      isSessionDraftDirty({ ...createEmptyDraft(), exercise: createExerciseDraft() }),
    ).toBe(true);
  });

  it("is false again once the exercise is explicitly reset to null, matching the empty draft exactly", () => {
    const withExercise: SessionDraft = { ...createEmptyDraft(), exercise: createExerciseDraft() };
    expect(isSessionDraftDirty({ ...withExercise, exercise: null })).toBe(false);
  });

  it("is false again once every scalar field is individually modified then restored to its exact initial value", () => {
    const initial = createEmptyDraft();

    // Each field modified (proving detection), then restored on its own
    // (proving the round trip back to false) — one at a time, not only the
    // one already covered above (exercise).
    const nameModified: SessionDraft = { ...initial, name: "Séance simple" };
    expect(isSessionDraftDirty(nameModified)).toBe(true);
    expect(isSessionDraftDirty({ ...nameModified, name: initial.name })).toBe(false);

    const colorModified: SessionDraft = { ...initial, color: "#E5484D" };
    expect(isSessionDraftDirty(colorModified)).toBe(true);
    expect(isSessionDraftDirty({ ...colorModified, color: initial.color })).toBe(false);

    const countdownModified: SessionDraft = {
      ...initial,
      initialCountdownSeconds: initial.initialCountdownSeconds + 30,
    };
    expect(isSessionDraftDirty(countdownModified)).toBe(true);
    expect(
      isSessionDraftDirty({
        ...countdownModified,
        initialCountdownSeconds: initial.initialCountdownSeconds,
      }),
    ).toBe(false);

    const finalPhaseModified: SessionDraft = {
      ...initial,
      finalPhaseSeconds: initial.finalPhaseSeconds + 30,
    };
    expect(isSessionDraftDirty(finalPhaseModified)).toBe(true);
    expect(
      isSessionDraftDirty({ ...finalPhaseModified, finalPhaseSeconds: initial.finalPhaseSeconds }),
    ).toBe(false);
  });

  it("is false again after every field is modified simultaneously, then all restored to their initial values at once", () => {
    const initial = createEmptyDraft();
    const modified: SessionDraft = {
      name: "Séance simple",
      color: "#E5484D",
      initialCountdownSeconds: initial.initialCountdownSeconds + 30,
      finalPhaseSeconds: initial.finalPhaseSeconds + 30,
      exercise: createExerciseDraft(),
    };
    expect(isSessionDraftDirty(modified)).toBe(true);

    const restored: SessionDraft = { ...modified, ...initial };
    expect(isSessionDraftDirty(restored)).toBe(false);
  });

  it("is true when several fields differ simultaneously", () => {
    expect(
      isSessionDraftDirty({
        name: "Séance simple",
        color: "#E5484D",
        initialCountdownSeconds: 20,
        finalPhaseSeconds: 15,
        exercise: { name: "Gainage", durationSeconds: 30, instruction: null },
      }),
    ).toBe(true);
  });
});

describe("toCreateSessionInput (structured result contract, full aggregation)", () => {
  function completeDraft(): SessionDraft {
    return {
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercise: { name: "Gainage", durationSeconds: 30, instruction: null },
    };
  }

  it("fails on an empty draft and reports every violation at once (session name + exercise absence)", () => {
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

  it("fails when the exercise is missing but name and color are set, reporting only the exercise violations", () => {
    const draft: SessionDraft = { ...createEmptyDraft(), name: "Séance simple" };
    expect(toCreateSessionInput(draft)).toEqual({
      ok: false,
      violations: [
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "exercise.durationSeconds" },
      ],
    });
  });

  it("fails when the exercise has no duration yet", () => {
    const draft: SessionDraft = {
      ...completeDraft(),
      exercise: { name: "Gainage", durationSeconds: null, instruction: null },
    };
    expect(toCreateSessionInput(draft)).toEqual({
      ok: false,
      violations: [{ code: "REQUIRED", field: "exercise.durationSeconds" }],
    });
  });

  it("aggregates an invalid session name together with a fully absent exercise, simultaneously", () => {
    const draft: SessionDraft = { ...completeDraft(), name: "A".repeat(81), exercise: null };
    expect(toCreateSessionInput(draft)).toEqual({
      ok: false,
      violations: [
        { code: "TOO_LONG", field: "session.name", details: { max: 80 } },
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "exercise.durationSeconds" },
      ],
    });
  });

  it("aggregates an invalid exercise name together with a missing duration, simultaneously", () => {
    const draft: SessionDraft = {
      ...completeDraft(),
      exercise: { name: "A".repeat(81), durationSeconds: null, instruction: null },
    };
    expect(toCreateSessionInput(draft)).toEqual({
      ok: false,
      violations: [
        { code: "TOO_LONG", field: "exercise.name", details: { max: 80 } },
        { code: "REQUIRED", field: "exercise.durationSeconds" },
      ],
    });
  });

  it("never stops at the first category of defect: every field-level violation is reported", () => {
    const draft: SessionDraft = {
      name: "",
      color: "#000000" as never,
      initialCountdownSeconds: -1,
      finalPhaseSeconds: -1,
      exercise: { name: "", durationSeconds: 0, instruction: "A".repeat(1001) },
    };
    const result = toCreateSessionInput(draft);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toEqual([
        { code: "REQUIRED", field: "session.name" },
        { code: "INVALID_COLOR", field: "session.color" },
        { code: "OUT_OF_RANGE", field: "session.initialCountdownSeconds", details: { min: 0 } },
        { code: "OUT_OF_RANGE", field: "session.finalPhaseSeconds", details: { min: 0 } },
        { code: "REQUIRED", field: "exercise.name" },
        {
          code: "OUT_OF_RANGE",
          field: "exercise.durationSeconds",
          details: { min: 1, max: 5999 },
        },
        { code: "TOO_LONG", field: "exercise.instruction", details: { max: 1000 } },
      ]);
    }
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
        exercise: { name: "Gainage", durationSeconds: 30, instruction: null },
      },
    });
  });

  it("fails on a structurally complete draft whose name is invalid after normalization", () => {
    const draft: SessionDraft = { ...completeDraft(), name: "A".repeat(81) };
    expect(toCreateSessionInput(draft)).toEqual({
      ok: false,
      violations: [{ code: "TOO_LONG", field: "session.name", details: { max: 80 } }],
    });
  });

  it("never throws, even on an entirely invalid draft", () => {
    expect(() =>
      toCreateSessionInput({
        name: "",
        color: DEFAULT_SESSION_COLOR,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        exercise: null,
      }),
    ).not.toThrow();
  });
});
