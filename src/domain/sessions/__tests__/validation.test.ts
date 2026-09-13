import { describe, expect, it } from "@jest/globals";

import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import type { UpdateSessionActivityInput, UpdateSessionInput } from "@/domain/sessions/Session";
import {
  normalizeInstruction,
  normalizeName,
  normalizeSideMode,
  normalizeTourSideMode,
  validateCreatableActivityType,
  validateCreateSessionInput,
  validateExecutionMode,
  validateExerciseDurationSeconds,
  validateExerciseName,
  validateFinalPhaseSeconds,
  validateInitialCountdownSeconds,
  validateInstruction,
  validatePauseSeconds,
  validateRecoverySeconds,
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
      recoverySeconds: 0,
      instruction: null,
      bodyZoneIds: [],
      // V2-BILAT-01 : `sideMode` OMIS délibérément — la direction neutre
      // (`UNILATERAL`, explicite ou par défaut) reste ABSENTE de l'agrégat
      // validé (`normalizeSideMode`), pour que ce fixture, structurellement
      // identique à un appelant antérieur à cette tranche, continue de
      // produire exactement la même sortie normalisée (aucun champ
      // supplémentaire matérialisé).
    };
  }

  function validInput() {
    return {
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      // V2-BILAT-01 : `tourSideMode` OMIS délibérément — voir `durationExercise` ci-dessus.
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

  // T02-S01 (AC-01/AC-12) : les trois zones structurelles traversent le
  // chemin de création sans perte — il ne produisait auparavant que des
  // Exercices `IN_TOUR`.
  it("carries each Activity's own type and structural position through creation", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      exercises: [
        { ...durationExercise(), name: "Échauffement", structuralPosition: "BEFORE_TOUR" as const },
        durationExercise(),
        {
          ...durationExercise(),
          structuralPosition: "AFTER_TOUR" as const,
          name: "Étirements",
          durationSeconds: 45,
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
        ["EXERCISE", "AFTER_TOUR"],
      ]);
    }
  });

  /**
   * T02-S02 — verrou de Domaine sur le type `RECOVERY`.
   *
   * `migration001` est IMMUABLE : son CHECK `type IN ('EXERCISE',
   * 'RECOVERY')` connaît toujours la valeur, et d'anciennes bases peuvent
   * encore la contenir jusqu'à `migration004`. Le verrou est donc posé au
   * niveau du DOMAINE — `validateCreatableActivityType` — plutôt qu'en base :
   * la valeur reste RECONNUE en lecture, mais n'est plus CRÉABLE.
   */
  it("refuses a standalone RECOVERY Activity at creation, while still recognizing the value (T02-S02)", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      exercises: [
        {
          ...durationExercise(),
          type: "RECOVERY" as const,
          name: "Récupération",
          executionMode: null,
          durationSeconds: 45,
          seriesCount: null,
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({
        code: "MUST_BE_ABSENT",
        field: "activity.type",
      });
      // Distinct d'un type INCONNU, qui reste rejeté par `UNRECOGNIZED`.
      expect(result.violations).not.toContainEqual({
        code: "UNRECOGNIZED",
        field: "activity.type",
      });
    }
  });

  it("validates the attached Récupération at creation: bounds and integrality (T02-S02)", () => {
    expect(
      validateCreateSessionInput({
        ...validInput(),
        exercises: [{ ...durationExercise(), recoverySeconds: 90 }],
      }),
    ).toMatchObject({ ok: true });

    for (const invalid of [-1, 6000, 1.5]) {
      const result = validateCreateSessionInput({
        ...validInput(),
        exercises: [{ ...durationExercise(), recoverySeconds: invalid }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(
          result.violations.some(
            (violation) => violation.field === "exercise.recoverySeconds",
          ),
        ).toBe(true);
      }
    }
  });

  it("accepts a Récupération in every execution mode — it is attached to the Activity, not to the Durée mode (T02-S02)", () => {
    for (const exercise of [
      { ...durationExercise(), recoverySeconds: 30 },
      {
        ...durationExercise(),
        executionMode: "REPETITIONS" as const,
        durationSeconds: null,
        repetitionCount: 12,
        recoverySeconds: 30,
      },
      {
        ...durationExercise(),
        executionMode: "TO_FAILURE" as const,
        durationSeconds: null,
        repetitionCount: null,
        recoverySeconds: 30,
      },
    ]) {
      const result = validateCreateSessionInput({ ...validInput(), exercises: [exercise] });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.exercises[0]).toMatchObject({ recoverySeconds: 30 });
      }
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

/**
 * V2-BILAT-01 : `SideMode` est un enum entièrement gouverné par l'interface
 * (contrôle cyclique à trois états) — `errors.ts` restant hors périmètre
 * (bornes opposables de la mission), une valeur hors énumération à
 * l'exécution ne fait jamais échouer la validation complète d'un agrégat par
 * ailleurs valide (voir `normalizeSideMode`, `validation.ts`).
 *
 * **Compatibilité rétroactive.** La direction NEUTRE (`UNILATERAL` —
 * explicite, absente ou issue d'une valeur hors énumération) est
 * délibérément ABSENTE (`undefined`) de la sortie normalisée : un agrégat
 * dont aucune Activité/Tour n'exprime de bilatéralité reste ainsi
 * structurellement identique à un agrégat antérieur à cette tranche, qui
 * n'a jamais connu ce champ — un appelant existant comparant l'agrégat par
 * égalité stricte n'est donc jamais affecté par cette tranche. Seule une
 * direction BILATÉRALE explicite (`RIGHT_LEFT`/`LEFT_RIGHT`) traverse la
 * normalisation.
 */
describe("normalizeSideMode / normalizeTourSideMode (V2-BILAT-01)", () => {
  it("passes an explicit BILATERAL direction through unchanged", () => {
    expect(normalizeSideMode("RIGHT_LEFT")).toBe("RIGHT_LEFT");
    expect(normalizeSideMode("LEFT_RIGHT")).toBe("LEFT_RIGHT");
    expect(normalizeTourSideMode("RIGHT_LEFT")).toBe("RIGHT_LEFT");
    expect(normalizeTourSideMode("LEFT_RIGHT")).toBe("LEFT_RIGHT");
  });

  it("collapses the neutral UNILATERAL direction to undefined, whether explicit or absent", () => {
    expect(normalizeSideMode("UNILATERAL")).toBeUndefined();
    expect(normalizeSideMode(undefined)).toBeUndefined();
    expect(normalizeTourSideMode("UNILATERAL")).toBeUndefined();
    expect(normalizeTourSideMode(undefined)).toBeUndefined();
  });

  it("collapses any value outside the enumeration to undefined too — never a failure, never a materialized default", () => {
    expect(normalizeSideMode("BILATERAL")).toBeUndefined();
    expect(normalizeSideMode(null)).toBeUndefined();
    expect(normalizeTourSideMode("BILATERAL")).toBeUndefined();
  });
});

describe("validateCreateSessionInput / validateUpdateSessionInput — side mode (V2-BILAT-01)", () => {
  function durationExercise(sideMode?: unknown) {
    return {
      type: "EXERCISE" as const,
      structuralPosition: "IN_TOUR" as const,
      name: "Gainage",
      executionMode: "DURATION" as const,
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 1,
      pauseSeconds: 0,
      recoverySeconds: 0,
      instruction: null,
      bodyZoneIds: [],
      sideMode: sideMode as never,
    };
  }

  it("carries a valid Activity/Tour side mode through creation unchanged", () => {
    const result = validateCreateSessionInput({
      name: "Séance",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      tourSideMode: "RIGHT_LEFT" as never,
      exercises: [durationExercise("LEFT_RIGHT")],
      categories: [],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tourSideMode).toBe("RIGHT_LEFT");
      expect(result.value.exercises[0]?.sideMode).toBe("LEFT_RIGHT");
    }
  });

  /**
   * Compatibilité rétroactive (retry V2-BILAT-01) : une direction OMISE, une
   * direction explicitement `UNILATERAL`, et une direction hors énumération
   * produisent toutes la MÊME sortie — `undefined`, jamais une chaîne
   * `"UNILATERAL"` matérialisée — pour ne jamais faire diverger un agrégat
   * validé de sa forme antérieure à cette tranche.
   */
  it("collapses an omitted, explicit UNILATERAL, or invalid side mode to undefined, without ever failing validation", () => {
    for (const rawTourSideMode of [undefined, "UNILATERAL", "BILATERAL"] as const) {
      for (const rawExerciseSideMode of [undefined, "UNILATERAL", "BILATERAL"] as const) {
        const result = validateCreateSessionInput({
          name: "Séance",
          color: DEFAULT_SESSION_COLOR,
          initialCountdownSeconds: 10,
          finalPhaseSeconds: 5,
          tourRepeatCount: 1,
          tourSideMode: rawTourSideMode as never,
          exercises: [durationExercise(rawExerciseSideMode)],
          categories: [],
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.tourSideMode).toBeUndefined();
          expect(result.value.exercises[0]?.sideMode).toBeUndefined();
        }
      }
    }
  });

  it("carries a valid Activity/Tour side mode through an update, and collapses an invalid one to undefined", () => {
    const okResult = validateUpdateSessionInput({
      sourceSessionId: "session-1",
      name: "Séance",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      tourSideMode: "LEFT_RIGHT" as never,
      activities: [{ ...durationExercise("RIGHT_LEFT"), id: "act-1", position: 0 }],
      categories: [],
    });
    expect(okResult.ok).toBe(true);
    if (okResult.ok) {
      expect(okResult.value.tourSideMode).toBe("LEFT_RIGHT");
      expect(okResult.value.activities[0]?.sideMode).toBe("RIGHT_LEFT");
    }

    const invalidResult = validateUpdateSessionInput({
      sourceSessionId: "session-1",
      name: "Séance",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      tourSideMode: "NOT_A_SIDE_MODE" as never,
      activities: [{ ...durationExercise(undefined), id: "act-1", position: 0 }],
      categories: [],
    });
    expect(invalidResult.ok).toBe(true);
    if (invalidResult.ok) {
      expect(invalidResult.value.tourSideMode).toBeUndefined();
      expect(invalidResult.value.activities[0]?.sideMode).toBeUndefined();
    }
  });

  /**
   * Preuve directe de la régression corrigée : un agrégat entièrement
   * UNILATÉRAL (le cas historique) est `toEqual` à sa forme dépourvue de
   * `sideMode`/`tourSideMode` — exactement ce qu'un appelant existant, qui
   * n'a jamais connu ce champ, continue de recevoir.
   */
  it("is toEqual a legacy aggregate shape (no sideMode/tourSideMode keys) when every direction stays UNILATERAL", () => {
    const withExplicitUnilateral = validateCreateSessionInput({
      name: "Séance",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      tourSideMode: "UNILATERAL" as never,
      exercises: [durationExercise("UNILATERAL")],
      categories: [],
    });
    const withoutSideMode = validateCreateSessionInput({
      name: "Séance",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [durationExercise(undefined)],
      categories: [],
    });
    expect(withExplicitUnilateral).toEqual(withoutSideMode);
    expect(withoutSideMode).toEqual({
      ok: true,
      value: {
        name: "Séance",
        color: DEFAULT_SESSION_COLOR,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        tourRepeatCount: 1,
        exercises: [
          {
            type: "EXERCISE",
            structuralPosition: "IN_TOUR",
            name: "Gainage",
            executionMode: "DURATION",
            durationSeconds: 30,
            repetitionCount: null,
            seriesCount: 1,
            pauseSeconds: 0,
            recoverySeconds: 0,
            instruction: null,
            bodyZoneIds: [],
          },
        ],
        categories: [],
      },
    });
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

describe("validateRecoverySeconds (T02-S02) — Récupération ATTACHÉE", () => {
  it("accepts zero: no Récupération is the neutral, valid value", () => {
    expect(validateRecoverySeconds(0)).toEqual({ ok: true, value: 0 });
  });

  it("accepts the documented upper bound 99 min 59 s (5999 s), same contract as Durée and Pause (CE-T01-14)", () => {
    expect(validateRecoverySeconds(5999)).toEqual({ ok: true, value: 5999 });
  });

  it("rejects a negative or out-of-range value with OUT_OF_RANGE and its bounds", () => {
    expect(validateRecoverySeconds(-1)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "exercise.recoverySeconds", details: { min: 0, max: 5999 } },
      ],
    });
    expect(validateRecoverySeconds(6000)).toMatchObject({ ok: false });
  });

  it("rejects a non-integer number of seconds", () => {
    expect(validateRecoverySeconds(30.5)).toEqual({
      ok: false,
      violations: [{ code: "NOT_INTEGER", field: "exercise.recoverySeconds" }],
    });
  });
});

describe("validateCreatableActivityType (T02-S02) — verrou d'écriture du type RECOVERY", () => {
  it("accepts EXERCISE, the only creatable type", () => {
    expect(validateCreatableActivityType("EXERCISE")).toEqual({ ok: true, value: "EXERCISE" });
  });

  it("refuses RECOVERY with MUST_BE_ABSENT — recognized in reading, never creatable", () => {
    expect(validateCreatableActivityType("RECOVERY")).toEqual({
      ok: false,
      violations: [{ code: "MUST_BE_ABSENT", field: "activity.type" }],
    });
  });

  it("still reports an entirely unknown type as UNRECOGNIZED, never as MUST_BE_ABSENT", () => {
    expect(validateCreatableActivityType("WARMUP")).toEqual({
      ok: false,
      violations: [{ code: "UNRECOGNIZED", field: "activity.type" }],
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
      recoverySeconds: 0,
      instruction: null,
      bodyZoneIds: [],
      // V2-BILAT-01 : `sideMode` OMIS délibérément — voir la note de tête de
      // `durationExercise` dans `validateCreateSessionInput / validateUpdateSessionInput — side mode`.
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
      recoverySeconds: 0,
      instruction: null,
      bodyZoneIds: [],
      // V2-BILAT-01 : `sideMode` OMIS délibérément — voir la note de tête de
      // `durationExercise` dans `validateCreateSessionInput / validateUpdateSessionInput — side mode`.
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
      // V2-BILAT-01 : `tourSideMode` OMIS délibérément — voir la note de tête
      // de `durationExercise` dans `validateCreateSessionInput / validateUpdateSessionInput — side mode`.
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

  /**
   * T02-S02 — le verrou de Domaine s'applique aussi au chemin de
   * MODIFICATION : une Séance ancienne ne peut pas être réenregistrée avec
   * une Récupération autonome. Ce test remplace l'ancien « valide une
   * Activité RECOVERY toujours chronométrée », qui prouvait précisément le
   * comportement désormais interdit.
   */
  it("refuses a standalone RECOVERY Activity on the update path too (T02-S02)", () => {
    const result = validateUpdateSessionInput(
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
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toContainEqual({
        code: "MUST_BE_ABSENT",
        field: "activity.type",
      });
    }
  });

  it("validates the attached Récupération on the update path (T02-S02)", () => {
    const okResult = validateUpdateSessionInput(
      validInput({ activities: [exerciseActivity({ recoverySeconds: 120 })] }),
    );
    expect(okResult.ok).toBe(true);
    if (okResult.ok) {
      expect(okResult.value.activities[0]).toMatchObject({ recoverySeconds: 120 });
    }

    const badResult = validateUpdateSessionInput(
      validInput({ activities: [exerciseActivity({ recoverySeconds: 6000 })] }),
    );
    expect(badResult.ok).toBe(false);
    if (!badResult.ok) {
      expect(badResult.violations).toContainEqual({
        code: "OUT_OF_RANGE",
        field: "exercise.recoverySeconds",
        details: { min: 0, max: 5999 },
      });
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
