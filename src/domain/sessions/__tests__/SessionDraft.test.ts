import { describe, expect, it } from "@jest/globals";

import { DEFAULT_SESSION_COLOR, type Session } from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  createExerciseDraft,
  exerciseEquals,
  isSessionDraftDirty,
  toCreateSessionInput,
  toSessionDraft,
  type SessionDraft,
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
  it("initializes every field from the canonical defaults, with no Activity yet", () => {
    expect(createEmptyDraft()).toEqual({
      name: "",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
      finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
      exercises: [],
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

  it("really uses DEFAULT_EXERCISE_DURATION_SECONDS (30 s), not a duplicated literal", () => {
    expect(createExerciseDraft("ex-1").durationSeconds).toBe(30);
    expect(createExerciseDraft("ex-1").durationSeconds).toBe(DEFAULT_EXERCISE_DURATION_SECONDS);
  });

  it("really uses DEFAULT_EXECUTION_MODE/DEFAULT_SERIES_COUNT/DEFAULT_PAUSE_SECONDS, not duplicated literals", () => {
    expect(createExerciseDraft("ex-1").executionMode).toBe("DURATION");
    expect(createExerciseDraft("ex-1").executionMode).toBe(DEFAULT_EXECUTION_MODE);
    expect(createExerciseDraft("ex-1").seriesCount).toBe(1);
    expect(createExerciseDraft("ex-1").seriesCount).toBe(DEFAULT_SERIES_COUNT);
    expect(createExerciseDraft("ex-1").pauseSeconds).toBe(0);
    expect(createExerciseDraft("ex-1").pauseSeconds).toBe(DEFAULT_PAUSE_SECONDS);
  });

  /** Complétion REWORK12 : `id` est un paramètre obligatoire, fourni par l'appelant — jamais généré ici (fonction pure). */
  it("uses exactly the id provided by the caller, never a generated one", () => {
    expect(createExerciseDraft("a").id).toBe("a");
    expect(createExerciseDraft("b").id).toBe("b");
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

  it("copies the editable fields exactly, without any identity or audit field beyond the Activity's own id", () => {
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
          instruction: "Respirer profondément",
          bodyZoneIds: [],
        },
      ],
    });
  });

  /**
   * Complétion REWORK12 : `Session`/`Cycle`/`Tour` modélisent toujours une
   * seule Activité persistée (`cycle.tour.exercise`, jamais un tableau) —
   * cette fonction produit donc systématiquement une collection à un seul
   * élément, jamais davantage.
   */
  it("always produces a single-element exercises collection: Session/Cycle/Tour do not model several persisted Activities yet", () => {
    const draft = toSessionDraft(aSession());
    expect(draft.exercises).toHaveLength(1);
  });

  it("always maps bodyZoneIds to an empty array: Session/DurationExercise do not model body zones yet", () => {
    const draft = toSessionDraft(aSession());
    expect(draft.exercises[0]?.bodyZoneIds).toEqual([]);
  });

  it("preserves a null instruction without turning it into an empty string", () => {
    const draft = toSessionDraft(aSession(null));
    expect(draft.exercises[0]?.instruction).toBeNull();
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
      exercises: [],
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

  it("is true as soon as one Activity is present (empty draft has exercises: [])", () => {
    expect(
      isSessionDraftDirty({ ...createEmptyDraft(), exercises: [createExerciseDraft("ex-1")] }),
    ).toBe(true);
  });

  it("is false again once the exercises collection is explicitly reset to [], matching the empty draft exactly", () => {
    const withExercise: SessionDraft = {
      ...createEmptyDraft(),
      exercises: [createExerciseDraft("ex-1")],
    };
    expect(isSessionDraftDirty({ ...withExercise, exercises: [] })).toBe(false);
  });

  /** Complétion REWORK12 (« Plusieurs activités et bouton persistant ») : la collection compare chaque élément dans l'ordre, pas seulement sa longueur. */
  it("is true when several Activities are present, and is order-sensitive between two otherwise-identical Activities", () => {
    const a = createExerciseDraft("ex-1");
    const b = { ...createExerciseDraft("ex-2"), name: "Squats" };
    expect(isSessionDraftDirty({ ...createEmptyDraft(), exercises: [a, b] })).toBe(true);
    // Le contenu de `b` diffère de `a` (nom) : l'ordre importe, [a, b] ≠ [b, a].
    expect(
      isSessionDraftDirty({ ...createEmptyDraft(), exercises: [b, a] }),
    ).toBe(true);
  });

  it("is false again once every scalar field is individually modified then restored to its exact initial value", () => {
    const initial = createEmptyDraft();

    // Each field modified (proving detection), then restored on its own
    // (proving the round trip back to false) — one at a time, not only the
    // one already covered above (exercises).
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
      exercises: [createExerciseDraft("ex-1")],
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
        exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage" }],
      }),
    ).toBe(true);
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

  it("is false when only the id differs, all other fields equal (complétion REWORK12)", () => {
    expect(exerciseEquals(createExerciseDraft("ex-1"), createExerciseDraft("ex-2"))).toBe(false);
  });

  it("is false when any scalar field differs (name, mode, duration, repetitions, series, pause, instruction)", () => {
    const base = createExerciseDraft("ex-1");
    expect(exerciseEquals(base, { ...base, name: "Gainage" })).toBe(false);
    expect(
      exerciseEquals(base, { ...base, executionMode: "REPETITIONS", durationSeconds: null, repetitionCount: 12 }),
    ).toBe(false);
    expect(exerciseEquals(base, { ...base, seriesCount: 3 })).toBe(false);
    expect(exerciseEquals(base, { ...base, pauseSeconds: 15 })).toBe(false);
    expect(exerciseEquals(base, { ...base, instruction: "Respirer" })).toBe(false);
  });

  it("compares bodyZoneIds as a set: order never matters, content does", () => {
    const a: SessionDraftExercise = { ...createExerciseDraft("ex-1"), bodyZoneIds: ["NECK", "BACK"] };
    const bSameOrder: SessionDraftExercise = {
      ...createExerciseDraft("ex-1"),
      bodyZoneIds: ["NECK", "BACK"],
    };
    const bReordered: SessionDraftExercise = {
      ...createExerciseDraft("ex-1"),
      bodyZoneIds: ["BACK", "NECK"],
    };
    const cDifferentContent: SessionDraftExercise = {
      ...createExerciseDraft("ex-1"),
      bodyZoneIds: ["NECK", "ARMS"],
    };
    const dDifferentLength: SessionDraftExercise = {
      ...createExerciseDraft("ex-1"),
      bodyZoneIds: ["NECK"],
    };

    expect(exerciseEquals(a, bSameOrder)).toBe(true);
    expect(exerciseEquals(a, bReordered)).toBe(true);
    expect(exerciseEquals(a, cDifferentContent)).toBe(false);
    expect(exerciseEquals(a, dDifferentLength)).toBe(false);
  });
});

describe("toCreateSessionInput (structured result contract, full aggregation)", () => {
  function completeDraft(): SessionDraft {
    return {
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 30 }],
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

  it("fails when the exercises collection is empty but name and color are set, reporting only the exercise violations", () => {
    const draft: SessionDraft = { ...createEmptyDraft(), name: "Séance simple" };
    expect(toCreateSessionInput(draft)).toEqual({
      ok: false,
      violations: [
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "exercise.durationSeconds" },
      ],
    });
  });

  it("fails when the first exercise has no duration yet", () => {
    const draft: SessionDraft = {
      ...completeDraft(),
      exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: null }],
    };
    expect(toCreateSessionInput(draft)).toEqual({
      ok: false,
      violations: [{ code: "REQUIRED", field: "exercise.durationSeconds" }],
    });
  });

  it("aggregates an invalid session name together with a fully empty exercises collection, simultaneously", () => {
    const draft: SessionDraft = { ...completeDraft(), name: "A".repeat(81), exercises: [] };
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
      exercises: [{ ...createExerciseDraft("ex-1"), name: "A".repeat(81), durationSeconds: null }],
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
      exercises: [
        {
          ...createExerciseDraft("ex-1"),
          name: "",
          durationSeconds: 0,
          instruction: "A".repeat(1001),
        },
      ],
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
        exercises: [],
      }),
    ).not.toThrow();
  });

  /**
   * Limite disclosée (complétion REWORK12) : `CreateSessionInput`/`Session`
   * modélisent toujours une seule Activité — seule la PREMIÈRE de
   * `draft.exercises` est validée/assemblée ; une éventuelle seconde
   * Activité est silencieusement ignorée par cette fonction (jamais
   * invoquée par un parcours réellement câblé en T01-S08).
   */
  it("only validates/assembles the FIRST exercise of the collection when several are present", () => {
    const draft: SessionDraft = {
      ...completeDraft(),
      exercises: [
        { ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 30 },
        { ...createExerciseDraft("ex-2"), name: "Squats", durationSeconds: 45 },
      ],
    };
    const result = toCreateSessionInput(draft);
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
});
