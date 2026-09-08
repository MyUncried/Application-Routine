import { describe, expect, it } from "@jest/globals";

import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import type { UpdateSessionActivityInput, UpdateSessionInput } from "@/domain/sessions/Session";
import {
  normalizeInstruction,
  normalizeName,
  validateCreateSessionInput,
  validateExecutionMode,
  validateExerciseDurationSeconds,
  validateExerciseName,
  validateFinalPhaseSeconds,
  validateInitialCountdownSeconds,
  validateInstruction,
  validatePauseSeconds,
  validateRepetitionCount,
  validateSeriesCount,
  validateSessionColor,
  validateSessionName,
  validateTourRepeatCount,
  validateUpdateSessionInput,
} from "@/domain/sessions/validation";

describe("validateSessionName / validateExerciseName", () => {
  it("accepts 1 character after normalization", () => {
    expect(validateSessionName("A")).toEqual({ ok: true, value: "A" });
  });

  it("accepts exactly 80 characters after normalization", () => {
    const name = "A".repeat(80);
    expect(validateSessionName(name)).toEqual({ ok: true, value: name });
  });

  it("rejects an empty or whitespace-only string with REQUIRED", () => {
    expect(validateSessionName("   ")).toEqual({
      ok: false,
      violations: [{ code: "REQUIRED", field: "session.name" }],
    });
  });

  it("rejects 81 characters after normalization with TOO_LONG", () => {
    const name = "A".repeat(81);
    expect(validateSessionName(name)).toEqual({
      ok: false,
      violations: [{ code: "TOO_LONG", field: "session.name", details: { max: 80 } }],
    });
  });

  it("uses the exercise.name field for exercise names", () => {
    expect(validateExerciseName("   ")).toEqual({
      ok: false,
      violations: [{ code: "REQUIRED", field: "exercise.name" }],
    });
  });

  it("trims leading and trailing whitespace, tabs and newlines", () => {
    expect(normalizeName("  \tGainage\n  ")).toBe("Gainage");
  });

  it("collapses internal runs of spaces, tabs and newlines to a single space", () => {
    expect(normalizeName("Gainage   dos\tfacile")).toBe("Gainage dos facile");
  });

  it("preserves case, accents and punctuation", () => {
    expect(normalizeName("Étirement  —  dos")).toBe("Étirement — dos");
  });

  it("checks the length after normalization, not before", () => {
    const raw = `${"A".repeat(40)}${" ".repeat(10)}${"B".repeat(39)}`;
    const result = validateSessionName(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(80);
    }
  });

  it("counts an emoji made of a surrogate pair as a single Unicode code point", () => {
    // U+1F600 (GRINNING FACE) is one Unicode code point but two UTF-16 code
    // units, so `string.length` would count it as 2 and wrongly push this
    // 80-code-point name over the limit. Array.from(...).length counts it
    // correctly as 1, matching SQLite's character-based length().
    const name = `${"A".repeat(79)}😀`;
    const jsLength = name.length;
    const codePointLength = Array.from(name).length;

    expect(codePointLength).toBe(80);
    expect(jsLength).toBe(81);
    expect(validateSessionName(name)).toEqual({ ok: true, value: name });
  });
});

describe("validateSessionColor", () => {
  it("accepts every canonical color", () => {
    const colors = [
      "#E5484D",
      "#F47B20",
      "#F7D154",
      "#2E9B62",
      "#20B2AA",
      "#32B8D8",
      "#3B82F6",
      "#5A5BD7",
      "#7B61D1",
      "#A34AB7",
      "#E45C9A",
      "#8E8E93",
    ];
    for (const color of colors) {
      expect(validateSessionColor(color)).toEqual({ ok: true, value: color });
    }
  });

  it("rejects a color outside the palette", () => {
    expect(validateSessionColor("#000000")).toEqual({
      ok: false,
      violations: [{ code: "INVALID_COLOR", field: "session.color" }],
    });
  });
});

describe("validateExerciseDurationSeconds", () => {
  it("accepts the bounds 1 and 5999", () => {
    expect(validateExerciseDurationSeconds(1)).toEqual({ ok: true, value: 1 });
    expect(validateExerciseDurationSeconds(5999)).toEqual({ ok: true, value: 5999 });
  });

  it("rejects 0 and 6000 with OUT_OF_RANGE", () => {
    expect(validateExerciseDurationSeconds(0)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "exercise.durationSeconds", details: { min: 1, max: 5999 } },
      ],
    });
    expect(validateExerciseDurationSeconds(6000)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "exercise.durationSeconds", details: { min: 1, max: 5999 } },
      ],
    });
  });

  it("rejects a non-integer value with NOT_INTEGER", () => {
    expect(validateExerciseDurationSeconds(30.5)).toEqual({
      ok: false,
      violations: [{ code: "NOT_INTEGER", field: "exercise.durationSeconds" }],
    });
  });
});

describe("validateRepetitionCount (T01-S08, D-092)", () => {
  it("accepts the bounds 1 and 99", () => {
    expect(validateRepetitionCount(1)).toEqual({ ok: true, value: 1 });
    expect(validateRepetitionCount(99)).toEqual({ ok: true, value: 99 });
  });

  it("rejects 0 and 100 with OUT_OF_RANGE", () => {
    expect(validateRepetitionCount(0)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "exercise.repetitionCount", details: { min: 1, max: 99 } },
      ],
    });
    expect(validateRepetitionCount(100)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "exercise.repetitionCount", details: { min: 1, max: 99 } },
      ],
    });
  });

  it("rejects a non-integer value with NOT_INTEGER", () => {
    expect(validateRepetitionCount(12.5)).toEqual({
      ok: false,
      violations: [{ code: "NOT_INTEGER", field: "exercise.repetitionCount" }],
    });
  });
});

describe("validateSeriesCount (T01-S08, D-092)", () => {
  it("accepts the bounds 1 and 99", () => {
    expect(validateSeriesCount(1)).toEqual({ ok: true, value: 1 });
    expect(validateSeriesCount(99)).toEqual({ ok: true, value: 99 });
  });

  it("rejects 0 and 100 with OUT_OF_RANGE", () => {
    expect(validateSeriesCount(0)).toEqual({
      ok: false,
      violations: [{ code: "OUT_OF_RANGE", field: "exercise.seriesCount", details: { min: 1, max: 99 } }],
    });
    expect(validateSeriesCount(100)).toEqual({
      ok: false,
      violations: [{ code: "OUT_OF_RANGE", field: "exercise.seriesCount", details: { min: 1, max: 99 } }],
    });
  });

  it("rejects a non-integer value with NOT_INTEGER", () => {
    expect(validateSeriesCount(2.5)).toEqual({
      ok: false,
      violations: [{ code: "NOT_INTEGER", field: "exercise.seriesCount" }],
    });
  });
});

describe("validatePauseSeconds (T01-S08)", () => {
  it("accepts the bounds 0 and 5999", () => {
    expect(validatePauseSeconds(0)).toEqual({ ok: true, value: 0 });
    expect(validatePauseSeconds(5999)).toEqual({ ok: true, value: 5999 });
  });

  it("rejects a negative value and 6000 with OUT_OF_RANGE", () => {
    expect(validatePauseSeconds(-1)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "exercise.pauseSeconds", details: { min: 0, max: 5999 } },
      ],
    });
    expect(validatePauseSeconds(6000)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "exercise.pauseSeconds", details: { min: 0, max: 5999 } },
      ],
    });
  });

  it("rejects a non-integer value with NOT_INTEGER", () => {
    expect(validatePauseSeconds(1.5)).toEqual({
      ok: false,
      violations: [{ code: "NOT_INTEGER", field: "exercise.pauseSeconds" }],
    });
  });
});

describe("validateInstruction (normalization distinct from name)", () => {
  it("normalizes undefined to null without error", () => {
    expect(normalizeInstruction(undefined)).toBeNull();
    expect(validateInstruction(undefined)).toEqual({ ok: true, value: null });
  });

  it("normalizes null to null without error", () => {
    expect(normalizeInstruction(null)).toBeNull();
    expect(validateInstruction(null)).toEqual({ ok: true, value: null });
  });

  it("normalizes a whitespace-only string to null", () => {
    expect(normalizeInstruction("   \n\t  ")).toBeNull();
  });

  it("trims only the external whitespace", () => {
    expect(normalizeInstruction("  Respirer profondément  ")).toBe("Respirer profondément");
  });

  it("preserves internal newlines and spaces of a multiline instruction", () => {
    const raw = "Ligne 1\n\nLigne 2   avec   espaces";
    expect(normalizeInstruction(raw)).toBe(raw);
  });

  it("accepts exactly 1000 characters after normalization", () => {
    const instruction = "A".repeat(1000);
    expect(validateInstruction(instruction)).toEqual({ ok: true, value: instruction });
  });

  it("rejects 1001 characters with TOO_LONG", () => {
    const instruction = "A".repeat(1001);
    expect(validateInstruction(instruction)).toEqual({
      ok: false,
      violations: [{ code: "TOO_LONG", field: "exercise.instruction", details: { max: 1000 } }],
    });
  });

  it("counts an emoji made of a surrogate pair as a single character at the boundary", () => {
    const instruction = `${"A".repeat(999)}😀`;
    expect(Array.from(instruction)).toHaveLength(1000);
    expect(validateInstruction(instruction)).toEqual({ ok: true, value: instruction });
  });
});

describe("validateInitialCountdownSeconds / validateFinalPhaseSeconds", () => {
  it("accepts 0 and any positive integer", () => {
    expect(validateInitialCountdownSeconds(0)).toEqual({ ok: true, value: 0 });
    expect(validateInitialCountdownSeconds(10)).toEqual({ ok: true, value: 10 });
    expect(validateFinalPhaseSeconds(0)).toEqual({ ok: true, value: 0 });
    expect(validateFinalPhaseSeconds(5)).toEqual({ ok: true, value: 5 });
  });

  it("rejects a negative value with the matching field", () => {
    expect(validateInitialCountdownSeconds(-1)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "session.initialCountdownSeconds", details: { min: 0 } },
      ],
    });
    expect(validateFinalPhaseSeconds(-1)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "session.finalPhaseSeconds", details: { min: 0 } },
      ],
    });
  });

  it("rejects a non-integer value with NOT_INTEGER", () => {
    expect(validateInitialCountdownSeconds(1.5)).toEqual({
      ok: false,
      violations: [{ code: "NOT_INTEGER", field: "session.initialCountdownSeconds" }],
    });
  });
});

describe("validateCreateSessionInput (aggregated structured result, T01-S09)", () => {
  // T02-S01 : le DTO de création porte désormais le type et la position
  // structurelle réels de l'Activité (`CreateSessionActivityInput`).
  function durationExercise() {
    return {
      type: "EXERCISE" as const,
      structuralPosition: "IN_TOUR" as const,
      name: "Gainage",
      executionMode: "DURATION" as const,
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
      instruction: null,
      bodyZoneIds: [],
    };
  }

  function validInput() {
    return {
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [durationExercise()],
      categories: [],
    };
  }

  it("returns a success with the fully normalized input", () => {
    const result = validateCreateSessionInput(validInput());
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Séance simple",
        color: DEFAULT_SESSION_COLOR,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        tourRepeatCount: 1,
        exercises: [durationExercise()],
        categories: [],
      },
    });
  });

  // T02-S01 (AC-08/AC-12) : le chemin de création transporte la répétition
  // réelle du Tour et la rejette hors bornes, exactement comme la
  // modification (D-058).
  it("carries a real tour repeat count through creation, and rejects an out-of-range one", () => {
    const accepted = validateCreateSessionInput({ ...validInput(), tourRepeatCount: 99 });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) {
      expect(accepted.value.tourRepeatCount).toBe(99);
    }

    const rejected = validateCreateSessionInput({ ...validInput(), tourRepeatCount: 100 });
    expect(rejected).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "session.tourRepeatCount", details: { min: 1, max: 99 } },
      ],
    });
  });

  // T02-S01 (AC-01/AC-12) : les trois zones structurelles et les
  // Récupérations traversent désormais le chemin de création sans perte —
  // il ne produisait auparavant que des Exercices `IN_TOUR`.
  it("carries each Activity's own type and structural position through creation, Recoveries included", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      exercises: [
        { ...durationExercise(), name: "Échauffement", structuralPosition: "BEFORE_TOUR" as const },
        durationExercise(),
        {
          type: "RECOVERY" as const,
          structuralPosition: "AFTER_TOUR" as const,
          name: "Récupération",
          executionMode: null,
          durationSeconds: 45,
          repetitionCount: null,
          seriesCount: null,
          pauseSeconds: 0,
          instruction: null,
          bodyZoneIds: [],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.value.exercises.map((exercise) => [exercise.type, exercise.structuralPosition]),
      ).toEqual([
        ["EXERCISE", "BEFORE_TOUR"],
        ["EXERCISE", "IN_TOUR"],
        ["RECOVERY", "AFTER_TOUR"],
      ]);
    }
  });

  it("rejects an unrecognized activity type or structural position at creation", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      exercises: [
        {
          ...durationExercise(),
          type: "CIRCUIT" as never,
          structuralPosition: "AROUND_TOUR" as never,
        },
      ],
    });
    expect(result).toEqual({
      ok: false,
      violations: [
        { code: "UNRECOGNIZED", field: "activity.type" },
        { code: "UNRECOGNIZED", field: "activity.structuralPosition" },
      ],
    });
  });

  it("keeps the draft identifier of an Activity when one is provided, and rejects duplicates", () => {
    const kept = validateCreateSessionInput({
      ...validInput(),
      exercises: [{ ...durationExercise(), id: "  act-1  " }],
    });
    expect(kept.ok).toBe(true);
    if (kept.ok) {
      expect(kept.value.exercises[0]?.id).toBe("act-1");
    }

    const duplicated = validateCreateSessionInput({
      ...validInput(),
      exercises: [
        { ...durationExercise(), id: "act-1" },
        { ...durationExercise(), id: "act-1", name: "Squats" },
      ],
    });
    expect(duplicated.ok).toBe(false);
    if (!duplicated.ok) {
      expect(duplicated.violations).toEqual([{ code: "DUPLICATE", field: "activity.id" }]);
    }
  });

  it("fails with exactly the two historical violations when exercises is empty (zero Activity remains invalid)", () => {
    const result = validateCreateSessionInput({ ...validInput(), exercises: [] });
    expect(result).toEqual({
      ok: false,
      violations: [
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "exercise.durationSeconds" },
      ],
    });
  });

  it("validates and assembles every exercise of the collection, in order, never only the first", () => {
    const second = {
      ...durationExercise(),
      name: "Squats",
      durationSeconds: 45,
      seriesCount: 3,
      pauseSeconds: 15,
    };
    const result = validateCreateSessionInput({
      ...validInput(),
      exercises: [durationExercise(), second],
    });
    expect(result).toEqual({
      ok: true,
      value: {
        ...validInput(),
        exercises: [durationExercise(), second],
      },
    });
  });

  it("validates a REPETITIONS-mode exercise (no durationSeconds required, repetitionCount required instead)", () => {
    const repetitionExercise = {
      ...durationExercise(),
      executionMode: "REPETITIONS" as const,
      durationSeconds: null,
      repetitionCount: 12,
    };
    const result = validateCreateSessionInput({ ...validInput(), exercises: [repetitionExercise] });
    expect(result).toEqual({ ok: true, value: { ...validInput(), exercises: [repetitionExercise] } });
  });

  it("requires repetitionCount in REPETITIONS mode", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      exercises: [
        { ...durationExercise(), executionMode: "REPETITIONS", durationSeconds: null, repetitionCount: null },
      ],
    });
    expect(result).toEqual({
      ok: false,
      violations: [{ code: "REQUIRED", field: "exercise.repetitionCount" }],
    });
  });

  it("aggregates violations across every invalid exercise of the collection, not just one", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      exercises: [
        { ...durationExercise(), name: "" },
        { ...durationExercise(), name: "", durationSeconds: 0 },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toEqual([
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "exercise.name" },
        {
          code: "OUT_OF_RANGE",
          field: "exercise.durationSeconds",
          details: { min: 1, max: 5999 },
        },
      ]);
    }
  });

  it("aggregates every violation across multiple invalid fields at once", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      name: "   ",
      color: "#000000" as never,
      exercises: [{ ...durationExercise(), name: "Exercice", durationSeconds: 0 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toEqual(
        expect.arrayContaining([
          { code: "REQUIRED", field: "session.name" },
          { code: "INVALID_COLOR", field: "session.color" },
          {
            code: "OUT_OF_RANGE",
            field: "exercise.durationSeconds",
            details: { min: 1, max: 5999 },
          },
        ]),
      );
      expect(result.violations).toHaveLength(3);
    }
  });

  it("passes an EXISTING category input through unchanged", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      categories: [{ kind: "EXISTING", categoryId: "cardio" }],
    });
    expect(result).toEqual({
      ok: true,
      value: { ...validInput(), categories: [{ kind: "EXISTING", categoryId: "cardio" }] },
    });
  });

  it("normalizes a NEW category's name and rejects an invalid one with category.name", () => {
    const ok = validateCreateSessionInput({
      ...validInput(),
      categories: [{ kind: "NEW", name: "  Cardio   Intense  " }],
    });
    expect(ok).toEqual({
      ok: true,
      value: { ...validInput(), categories: [{ kind: "NEW", name: "Cardio Intense" }] },
    });

    const invalid = validateCreateSessionInput({
      ...validInput(),
      categories: [{ kind: "NEW", name: "A".repeat(41) }],
    });
    expect(invalid).toEqual({
      ok: false,
      violations: [{ code: "TOO_LONG", field: "category.name", details: { max: 40 } }],
    });
  });

  it("never throws, even on a fully invalid input", () => {
    expect(() =>
      validateCreateSessionInput({
        name: "",
        color: "#000000" as never,
        initialCountdownSeconds: -1,
        finalPhaseSeconds: -1,
        tourRepeatCount: 0,
        exercises: [
          { ...durationExercise(), name: "", durationSeconds: 0, instruction: "A".repeat(1001) },
        ],
        categories: [{ kind: "NEW", name: "" }],
      }),
    ).not.toThrow();
  });
});

describe("validateTourRepeatCount (T01-S10, D-058)", () => {
  it("accepts the bounds 1 and 99", () => {
    expect(validateTourRepeatCount(1)).toEqual({ ok: true, value: 1 });
    expect(validateTourRepeatCount(99)).toEqual({ ok: true, value: 99 });
  });

  it("rejects 0 and 100 with OUT_OF_RANGE on session.tourRepeatCount", () => {
    expect(validateTourRepeatCount(0)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "session.tourRepeatCount", details: { min: 1, max: 99 } },
      ],
    });
    expect(validateTourRepeatCount(100)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "session.tourRepeatCount", details: { min: 1, max: 99 } },
      ],
    });
  });

  it("rejects a non-integer with NOT_INTEGER", () => {
    expect(validateTourRepeatCount(2.5)).toEqual({
      ok: false,
      violations: [{ code: "NOT_INTEGER", field: "session.tourRepeatCount" }],
    });
  });
});

describe("validateExecutionMode (T01-S10, D-111)", () => {
  it("accepts the three MVP modes", () => {
    expect(validateExecutionMode("DURATION")).toEqual({ ok: true, value: "DURATION" });
    expect(validateExecutionMode("REPETITIONS")).toEqual({ ok: true, value: "REPETITIONS" });
    expect(validateExecutionMode("TO_FAILURE")).toEqual({ ok: true, value: "TO_FAILURE" });
  });

  it("rejects an unknown mode with UNRECOGNIZED", () => {
    expect(validateExecutionMode("AMRAP")).toEqual({
      ok: false,
      violations: [{ code: "UNRECOGNIZED", field: "exercise.executionMode" }],
    });
  });
});

describe("validateCreateSessionInput — mode À l'échec (T01-S10, D-111)", () => {
  function toFailureExercise() {
    return {
      type: "EXERCISE" as const,
      structuralPosition: "IN_TOUR" as const,
      name: "Tractions",
      executionMode: "TO_FAILURE" as const,
      durationSeconds: null,
      repetitionCount: null,
      seriesCount: 3,
      pauseSeconds: 30,
      instruction: null,
      bodyZoneIds: [],
    };
  }

  function validInput() {
    return {
      name: "Séance à l'échec",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [toFailureExercise()],
      categories: [],
    };
  }

  it("accepts a TO_FAILURE exercise with no duration nor repetition target", () => {
    expect(validateCreateSessionInput(validInput())).toEqual({
      ok: true,
      value: { ...validInput(), exercises: [toFailureExercise()] },
    });
  });

  it("rejects a TO_FAILURE exercise carrying a duration or a repetition target (MUST_BE_ABSENT)", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      exercises: [{ ...toFailureExercise(), durationSeconds: 30, repetitionCount: 12 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toEqual([
        { code: "MUST_BE_ABSENT", field: "exercise.durationSeconds" },
        { code: "MUST_BE_ABSENT", field: "exercise.repetitionCount" },
      ]);
    }
  });
});

describe("validateUpdateSessionInput (T01-S10, plan §6.2)", () => {
  function exerciseActivity(
    overrides: Partial<UpdateSessionActivityInput> = {},
  ): UpdateSessionActivityInput {
    return {
      id: "act-1",
      type: "EXERCISE",
      structuralPosition: "IN_TOUR",
      position: 0,
      name: "Gainage",
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
      instruction: null,
      bodyZoneIds: [],
      ...overrides,
    };
  }

  function validInput(overrides: Partial<UpdateSessionInput> = {}): UpdateSessionInput {
    return {
      sourceSessionId: "session-1",
      name: "Séance modifiée",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 2,
      activities: [exerciseActivity()],
      categories: [],
      ...overrides,
    };
  }

  it("accepts a well-formed edit aggregate and echoes it normalized", () => {
    const result = validateUpdateSessionInput(validInput());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sourceSessionId).toBe("session-1");
      expect(result.value.tourRepeatCount).toBe(2);
      expect(result.value.activities).toHaveLength(1);
    }
  });

  it("rejects a missing source session id", () => {
    const result = validateUpdateSessionInput(validInput({ sourceSessionId: "  " }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({
        code: "REQUIRED",
        field: "session.sourceSessionId",
      });
    }
  });

  it("rejects duplicate Activity identifiers", () => {
    const result = validateUpdateSessionInput(
      validInput({
        activities: [exerciseActivity({ id: "dup" }), exerciseActivity({ id: "dup", position: 1 })],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({ code: "DUPLICATE", field: "activity.id" });
    }
  });

  it("rejects an empty activity list (a Session without Activity stays invalid)", () => {
    const result = validateUpdateSessionInput(validInput({ activities: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({ code: "REQUIRED", field: "activity.id" });
    }
  });

  it("validates a RECOVERY Activity as always-timed, with no mode / series / pause / body zones", () => {
    const okResult = validateUpdateSessionInput(
      validInput({
        activities: [
          exerciseActivity({
            id: "rec-1",
            type: "RECOVERY",
            name: "Récupération",
            executionMode: null,
            durationSeconds: 60,
            repetitionCount: null,
            seriesCount: null,
            pauseSeconds: 0,
            bodyZoneIds: [],
          }),
        ],
      }),
    );
    expect(okResult.ok).toBe(true);

    const badResult = validateUpdateSessionInput(
      validInput({
        activities: [
          exerciseActivity({
            id: "rec-2",
            type: "RECOVERY",
            name: "Récupération",
            executionMode: "DURATION",
            durationSeconds: null,
            seriesCount: 2,
            pauseSeconds: 10,
            bodyZoneIds: ["dos"],
          }),
        ],
      }),
    );
    expect(badResult.ok).toBe(false);
    if (!badResult.ok) {
      expect(badResult.violations).toEqual(
        expect.arrayContaining([
          { code: "MUST_BE_ABSENT", field: "exercise.executionMode" },
          { code: "MUST_BE_ABSENT", field: "exercise.seriesCount" },
          { code: "MUST_BE_ABSENT", field: "exercise.pauseSeconds" },
          { code: "MUST_BE_ABSENT", field: "activity.bodyZoneIds" },
          { code: "REQUIRED", field: "recovery.durationSeconds" },
        ]),
      );
    }
  });

  it("never throws on a fully invalid edit aggregate", () => {
    expect(() =>
      validateUpdateSessionInput({
        sourceSessionId: "",
        name: "",
        color: "#000000" as never,
        initialCountdownSeconds: -1,
        finalPhaseSeconds: -1,
        tourRepeatCount: 0,
        activities: [],
        categories: [{ kind: "NEW", name: "" }],
      }),
    ).not.toThrow();
  });
});
