import { describe, expect, it } from "@jest/globals";

import type { ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import { expandComposition } from "@/domain/sessions/circuit";
import type { SessionMovementInput, UpdateSessionActivityInput, UpdateSessionInput } from "@/domain/sessions/Session";
import {
  normalizeInstruction,
  normalizeName,
  normalizeSideMode,
  validateCreatableActivityType,
  validateCreateSessionInput,
  validateExecutionMode,
  validateExerciseDurationSeconds,
  validateExerciseName,
  validateFinalPhaseSeconds,
  validateInitialCountdownSeconds,
  validateInstruction,
  validatePauseSeconds,
  validatePostActivityRecoverySeconds,
  validateRepetitionCount,
  validateSeriesCount,
  validateSessionName,
  validateTourRepeatCount,
  validateUpdateSessionInput,
  validateCircuitNature,
} from "@/domain/sessions/validation";
import { clampSessionBoundarySeconds } from "@/domain/sessions/defaults";

/** PRE-7 (R-3) : Mouvement nouveau du brouillon, complet par défaut. */
function movementInput(id: string, overrides: Partial<Omit<SessionMovementInput, "id">> = {}): SessionMovementInput {
  return {
    id,
    change: "NEW",
    name: "Gainage",
    description: null,
    categoryId: "cardio",
    bodyZoneIds: ["dos"],
    media: [],
    phases: [],
    nextPhaseId: 1,
    aliases: [],
    ...overrides,
  };
}

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

  it("story 7.8 — clampSessionBoundarySeconds: 0..60, integer, non-finite → 0", () => {
    expect(clampSessionBoundarySeconds(600)).toBe(60);
    expect(clampSessionBoundarySeconds(60)).toBe(60);
    expect(clampSessionBoundarySeconds(0)).toBe(0);
    expect(clampSessionBoundarySeconds(-5)).toBe(0);
    expect(clampSessionBoundarySeconds(30.4)).toBe(30);
    expect(clampSessionBoundarySeconds(Number.NaN)).toBe(0);
  });

  // PRE-6 story 7.8 (D-443) : bornes de séance limitées à 0..60 s à l'écriture.
  it("story 7.8 — accepts 60, rejects 61 and beyond with OUT_OF_RANGE 0..60", () => {
    expect(validateInitialCountdownSeconds(60)).toEqual({ ok: true, value: 60 });
    expect(validateFinalPhaseSeconds(60)).toEqual({ ok: true, value: 60 });
    expect(validateInitialCountdownSeconds(61)).toEqual({
      ok: false,
      violations: [{ code: "OUT_OF_RANGE", field: "session.initialCountdownSeconds", details: { min: 0, max: 60 } }],
    });
    expect(validateFinalPhaseSeconds(3599)).toEqual({
      ok: false,
      violations: [{ code: "OUT_OF_RANGE", field: "session.finalPhaseSeconds", details: { min: 0, max: 60 } }],
    });
  });
});

describe("validateCreateSessionInput (aggregated structured result, T01-S09)", () => {
  // T02-S01 : le DTO de création porte désormais le type et la position
  // structurelle réels de l'Activité (`CreateSessionActivityInput`).
  function durationExercise(parameters: ExecutionParametersInput = durationParameters(30)) {
    return {
      type: "EXERCISE" as const,
      structuralPosition: "IN_TOUR" as const,
      sourceMovementId: "mov-1",
      // PRE-4 (story 1.1, AD-3) : paramètres typés obligatoires, aucun champ scalaire.
      executionParameters: parameters,
      postActivityRecoverySeconds: 0,
      copyNumber: null,
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
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [durationExercise()],
      // V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : présent explicitement
      // ici pour que chaque `{...validInput(), ...}` ci-dessous construise
      // directement la sortie normalisée attendue, jamais retrié ou recalculé.
      movements: [],
      stopPoints: [] as const,
    };
  }

  it("returns a success with the fully normalized input", () => {
    const result = validateCreateSessionInput(validInput());
    expect(result).toEqual({
      ok: true,
      value: validInput(),
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
        { ...durationExercise(), structuralPosition: "BEFORE_TOUR" as const },
        durationExercise(),
        {
          ...durationExercise(),
          structuralPosition: "AFTER_TOUR" as const,
          executionParameters: durationParameters(45),
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
          executionParameters: durationParameters(45),
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
        exercises: [{ ...durationExercise(), postActivityRecoverySeconds: 90 }],
      }),
    ).toMatchObject({ ok: true });

    for (const invalid of [-1, 6000, 1.5]) {
      const result = validateCreateSessionInput({
        ...validInput(),
        exercises: [{ ...durationExercise(), postActivityRecoverySeconds: invalid }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(
          result.violations.some(
            (violation) => violation.field === "exercise.postActivityRecoverySeconds",
          ),
        ).toBe(true);
      }
    }
  });

  it("accepts a Récupération in every execution mode — it is attached to the Activity, not to the Durée mode (T02-S02)", () => {
    for (const exercise of [
      { ...durationExercise(), postActivityRecoverySeconds: 30 },
      { ...durationExercise(repetitionParameters(12)), postActivityRecoverySeconds: 30 },
      { ...durationExercise(allFailureParameters()), postActivityRecoverySeconds: 30 },
    ]) {
      const result = validateCreateSessionInput({ ...validInput(), exercises: [exercise] });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.exercises[0]).toMatchObject({ postActivityRecoverySeconds: 30 });
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
        { ...durationExercise(), id: "act-1", sourceMovementId: "mov-2" },
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
      ...durationExercise(durationParameters(45, 3, 15)),
      sourceMovementId: "mov-2",
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

  it("validates a REPETITIONS-mode exercise (a typed NUMBER repetitions target)", () => {
    const repetitionExercise = durationExercise(repetitionParameters(12));
    const result = validateCreateSessionInput({ ...validInput(), exercises: [repetitionExercise] });
    expect(result).toEqual({ ok: true, value: { ...validInput(), exercises: [repetitionExercise] } });
  });

  it("requires a target in REPETITIONS mode (a UNSET target is reported on exercise.repetitionCount)", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      exercises: [durationExercise(repetitionParameters("UNSET"))],
    });
    expect(result).toEqual({
      ok: false,
      violations: [{ code: "REQUIRED", field: "exercise.repetitionCount" }],
    });
  });

  // PRE-7 (R-3, C05) : le nom appartient au Mouvement (champ historique `exercise.name`) ; les
  // violations des Mouvements du brouillon précèdent celles des occurrences.
  it("aggregates violations across every invalid exercise of the collection, not just one", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      exercises: [
        { ...durationExercise(), sourceMovementId: "m-1" },
        { ...durationExercise(durationParameters(0)), sourceMovementId: "m-2" },
      ],
      movements: [movementInput("m-1", { name: "" }), movementInput("m-2", { name: "" })],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // PRE-4 (AD-13) : niveau structurel — une Cible NUMBER doit valoir au
      // moins 1 ; aucune borne haute à ce niveau.
      expect(result.violations).toEqual([
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "exercise.name" },
        expect.objectContaining({
          code: "OUT_OF_RANGE",
          field: "exercise.durationSeconds",
        }),
      ]);
    }
  });

  it("aggregates every violation across multiple invalid fields at once", () => {
    const result = validateCreateSessionInput({
      ...validInput(),
      name: "   ",
      exercises: [durationExercise(durationParameters(0))],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toEqual(
        expect.arrayContaining([
          { code: "REQUIRED", field: "session.name" },
          expect.objectContaining({ code: "OUT_OF_RANGE", field: "exercise.durationSeconds" }),
        ]),
      );
      expect(result.violations).toHaveLength(2);
    }
  });

  it("never throws, even on a fully invalid input", () => {
    expect(() =>
      validateCreateSessionInput({
        name: "",
        initialCountdownSeconds: -1,
        finalPhaseSeconds: -1,
        tourRepeatCount: 0,
        exercises: [{ ...durationExercise(durationParameters(0)), sourceMovementId: "  " }],
        movements: [
          movementInput("", { name: "", description: "A".repeat(1001), categoryId: "", bodyZoneIds: [], phases: [{ id: 0, label: "" }], aliases: [""] }),
        ],
      }),
    ).not.toThrow();
  });
});

/**
 * PRE-7 (R-3, D-445 C01, C05, Q3) : l'occurrence d'Exercice référence obligatoirement un
 * Mouvement et porte un numéro de copie facultatif ; les Mouvements nouveaux ou corrigés du
 * brouillon sont validés (nom, description, Catégorie, Zones, phases, alias) et leurs noms
 * normalisés sont distincts.
 */
describe("PRE7-R3 — référence au Mouvement, numéro de copie et Mouvements du brouillon", () => {
  const occurrence = (overrides: Record<string, unknown> = {}) => ({
    type: "EXERCISE" as const,
    structuralPosition: "IN_TOUR" as const,
    executionParameters: durationParameters(30),
    postActivityRecoverySeconds: 0,
    sourceMovementId: "m-1",
    ...overrides,
  });
  const input = (exercises: readonly unknown[], movements: readonly SessionMovementInput[] = []) =>
    ({
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises,
      movements,
    }) as Parameters<typeof validateCreateSessionInput>[0];

  it("Mouvement obligatoire pour un Exercice (absent ou vide : REQUIRED activity.sourceMovementId), rogné sinon", () => {
    for (const sourceMovementId of [undefined, "", "   "]) {
      expect(validateCreateSessionInput(input([occurrence({ sourceMovementId })]))).toEqual({
        ok: false,
        violations: [{ code: "REQUIRED", field: "activity.sourceMovementId" }],
      });
    }
    const trimmed = validateCreateSessionInput(input([occurrence({ sourceMovementId: "  m-1 " })]));
    expect(trimmed.ok && trimmed.value.exercises[0]?.sourceMovementId).toBe("m-1");
  });

  it("numéro de copie : entier ≥ 1 ou absent (null) ; 0, négatif ou fractionnaire refusés", () => {
    const accepted = validateCreateSessionInput(input([occurrence(), occurrence({ copyNumber: 1 }), occurrence({ copyNumber: 3 })]));
    expect(accepted.ok && accepted.value.exercises.map((exercise) => exercise.copyNumber)).toEqual([null, 1, 3]);
    for (const copyNumber of [0, -1, 1.5]) {
      expect(validateCreateSessionInput(input([occurrence({ copyNumber })]))).toEqual({
        ok: false,
        violations: [{ code: "OUT_OF_RANGE", field: "activity.copyNumber" }],
      });
    }
  });

  it("Mouvements du brouillon : normalisés (nom, description, alias rognés) ; deux noms identiques après normalisation : DUPLICATE", () => {
    const accepted = validateCreateSessionInput(
      input([occurrence(), occurrence({ sourceMovementId: "m-2" })], [
        movementInput("m-1", { name: "  Squat ", aliases: [" Flexion "] }),
        movementInput("m-2", { name: "Fentes" }),
      ]),
    );
    expect(accepted.ok && accepted.value.movements?.map((movement) => [movement.id, movement.name, movement.aliases])).toEqual([
      ["m-1", "Squat", ["Flexion"]],
      ["m-2", "Fentes", []],
    ]);
    expect(
      validateCreateSessionInput(input([occurrence()], [movementInput("m-1", { name: "Squat" }), movementInput("m-2", { name: "  SQUAT" })])),
    ).toEqual({ ok: false, violations: [{ code: "DUPLICATE", field: "exercise.name" }] });
    expect(validateCreateSessionInput(input([occurrence()], [movementInput("m-1"), movementInput("m-1", { name: "Autre" })]))).toEqual({
      ok: false,
      violations: [{ code: "DUPLICATE", field: "movement.id" }],
    });
  });

  it("Mouvement du brouillon : Catégorie et Zones obligatoires, structure de phases et compteur cohérents, alias distincts", () => {
    const violations = (overrides: Partial<SessionMovementInput>) => {
      const result = validateCreateSessionInput(input([occurrence()], [movementInput("m-1", overrides)]));
      return result.ok ? [] : result.violations;
    };
    expect(violations({ categoryId: " " })).toEqual([{ code: "REQUIRED", field: "movement.category" }]);
    expect(violations({ bodyZoneIds: [] })).toEqual([{ code: "REQUIRED", field: "movement.bodyZoneIds" }]);
    expect(violations({ phases: [{ id: 1, label: "Descente" }], nextPhaseId: 1 })).toEqual([{ code: "UNRECOGNIZED", field: "movement.phases" }]);
    expect(violations({ phases: [{ id: 1, label: "Descente" }], nextPhaseId: 2 })).toEqual([]);
    expect(violations({ aliases: ["Flexion", "flexion"] })).toEqual([{ code: "DUPLICATE", field: "movement.aliases" }]);
    expect(violations({ description: "A".repeat(1001) })).toEqual([
      { code: "TOO_LONG", field: "exercise.instruction", details: { max: 1000 } },
    ]);
  });

  it("modification : mêmes règles sur UpdateSessionInput", () => {
    const result = validateUpdateSessionInput({
      sourceSessionId: "session-1",
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      activities: [{ ...occurrence({ sourceMovementId: undefined, copyNumber: 0 }), id: "act-1", position: 0 }],
      movements: [movementInput("m-1", { name: "" })],
    });
    expect(result).toEqual({
      ok: false,
      violations: [
        { code: "REQUIRED", field: "exercise.name" },
        { code: "REQUIRED", field: "activity.sourceMovementId" },
        { code: "OUT_OF_RANGE", field: "activity.copyNumber" },
      ],
    });
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
describe("normalizeSideMode (V2-BILAT-01)", () => {
  it("passes an explicit BILATERAL direction through unchanged", () => {
    expect(normalizeSideMode("RIGHT_LEFT")).toBe("RIGHT_LEFT");
    expect(normalizeSideMode("LEFT_RIGHT")).toBe("LEFT_RIGHT");
  });

  it("collapses the neutral UNILATERAL direction to undefined, whether explicit or absent", () => {
    expect(normalizeSideMode("UNILATERAL")).toBeUndefined();
    expect(normalizeSideMode(undefined)).toBeUndefined();
  });

  it("collapses any value outside the enumeration to undefined too — never a failure, never a materialized default", () => {
    expect(normalizeSideMode("BILATERAL")).toBeUndefined();
    expect(normalizeSideMode(null)).toBeUndefined();
  });
});

describe("validateCreateSessionInput / validateUpdateSessionInput — side mode (V2-BILAT-01, V2-PRE-1)", () => {
  /**
   * PRE-4 (AD-3) : la direction écrite est celle des paramètres. Une
   * direction bilatérale valide y est donc portée ; une direction neutre ou
   * hors énumération laisse les paramètres `UNILATERAL` et ne vit que dans
   * le champ de transition `sideMode` de l'entrée.
   */
  function durationExercise(sideMode?: unknown) {
    const bilateral = sideMode === "RIGHT_LEFT" || sideMode === "LEFT_RIGHT";
    return {
      type: "EXERCISE" as const,
      structuralPosition: "IN_TOUR" as const,
      sourceMovementId: "mov-1",
      executionParameters: durationParameters(30, 1, 0, bilateral ? { sideMode } : {}),
      postActivityRecoverySeconds: 0,
      copyNumber: null,
      sideMode: sideMode as never,
    };
  }

  it("carries a valid Activity side mode through creation unchanged", () => {
    const result = validateCreateSessionInput({
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [durationExercise("LEFT_RIGHT")],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
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
    for (const rawExerciseSideMode of [undefined, "UNILATERAL", "BILATERAL"] as const) {
      const result = validateCreateSessionInput({
        name: "Séance",
        labelId: null,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        tourRepeatCount: 1,
        exercises: [durationExercise(rawExerciseSideMode)],
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.exercises[0]?.sideMode).toBeUndefined();
      }
    }
  });

  it("carries a valid Activity side mode through an update, and collapses an invalid one to undefined", () => {
    const okResult = validateUpdateSessionInput({
      sourceSessionId: "session-1",
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      activities: [{ ...durationExercise("RIGHT_LEFT"), id: "act-1", position: 0 }],
    });
    expect(okResult.ok).toBe(true);
    if (okResult.ok) {
      expect(okResult.value.activities[0]?.sideMode).toBe("RIGHT_LEFT");
    }

    const invalidResult = validateUpdateSessionInput({
      sourceSessionId: "session-1",
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      activities: [{ ...durationExercise(undefined), id: "act-1", position: 0 }],
    });
    expect(invalidResult.ok).toBe(true);
    if (invalidResult.ok) {
      expect(invalidResult.value.activities[0]?.sideMode).toBeUndefined();
    }
  });

  /**
   * Preuve directe de la régression corrigée : un agrégat entièrement
   * UNILATÉRAL (le cas historique) est `toEqual` à sa forme dépourvue de
   * `sideMode` — exactement ce qu'un appelant existant, qui n'a jamais connu
   * ce champ, continue de recevoir.
   */
  it("is toEqual a legacy aggregate shape (no sideMode key) when every direction stays UNILATERAL", () => {
    const withExplicitUnilateral = validateCreateSessionInput({
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [durationExercise("UNILATERAL")],
    });
    const withoutSideMode = validateCreateSessionInput({
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [durationExercise(undefined)],
    });
    expect(withExplicitUnilateral).toEqual(withoutSideMode);
    expect(withoutSideMode).toEqual({
      ok: true,
      value: {
        name: "Séance",
        labelId: null,
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        tourRepeatCount: 1,
        exercises: [
          {
            type: "EXERCISE",
            structuralPosition: "IN_TOUR",
            sourceMovementId: "mov-1",
            executionParameters: durationParameters(30),
            postActivityRecoverySeconds: 0,
            copyNumber: null,
          },
        ],
        movements: [],
        stopPoints: [],
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

describe("validatePostActivityRecoverySeconds (V2-PRE-1) — récupération post-exercice de l'occurrence", () => {
  it("accepts zero: no récupération is the neutral, valid value", () => {
    expect(validatePostActivityRecoverySeconds(0)).toEqual({ ok: true, value: 0 });
  });

  it("accepts the documented upper bound 99 min 59 s (5999 s), same contract as Durée and Pause (CE-T01-14)", () => {
    expect(validatePostActivityRecoverySeconds(5999)).toEqual({ ok: true, value: 5999 });
  });

  it("rejects a negative or out-of-range value with OUT_OF_RANGE and its bounds", () => {
    expect(validatePostActivityRecoverySeconds(-1)).toEqual({
      ok: false,
      violations: [
        { code: "OUT_OF_RANGE", field: "exercise.postActivityRecoverySeconds", details: { min: 0, max: 5999 } },
      ],
    });
    expect(validatePostActivityRecoverySeconds(6000)).toMatchObject({ ok: false });
  });

  it("rejects a non-integer number of seconds", () => {
    expect(validatePostActivityRecoverySeconds(30.5)).toEqual({
      ok: false,
      violations: [{ code: "NOT_INTEGER", field: "exercise.postActivityRecoverySeconds" }],
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

describe("validateExecutionMode (PRE-4, AD-1 : deux Modes)", () => {
  it("accepts the two Modes of the domain", () => {
    expect(validateExecutionMode("DURATION")).toEqual({ ok: true, value: "DURATION" });
    expect(validateExecutionMode("REPETITIONS")).toEqual({ ok: true, value: "REPETITIONS" });
  });

  it("rejects an unknown mode with UNRECOGNIZED", () => {
    expect(validateExecutionMode("AMRAP")).toEqual({
      ok: false,
      violations: [{ code: "UNRECOGNIZED", field: "exercise.executionMode" }],
    });
  });
});

describe("validateCreateSessionInput — Cibles à l'échec (PRE-4, ancien mode « à l'échec » migré)", () => {
  function toFailureExercise() {
    return {
      type: "EXERCISE" as const,
      structuralPosition: "IN_TOUR" as const,
      sourceMovementId: "mov-1",
      executionParameters: allFailureParameters(3, 30),
      postActivityRecoverySeconds: 0,
      copyNumber: null,
      // V2-BILAT-01 : `sideMode` OMIS délibérément — voir la note de tête de
      // `durationExercise` dans `validateCreateSessionInput / validateUpdateSessionInput — side mode`.
    };
  }

  function validInput() {
    return {
      name: "Séance à l'échec",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [toFailureExercise()],
      movements: [],
      stopPoints: [] as const,
    };
  }

  it("accepts a Repetitions exercise whose targets are all FAILURE, with no numeric target", () => {
    expect(validateCreateSessionInput(validInput())).toEqual({
      ok: true,
      value: { ...validInput(), exercises: [toFailureExercise()] },
    });
  });
});

/**
 * PRE-4 (story 1.1, AD-13) — validation de Séance au `Continuer` : niveau
 * STRUCTUREL seul (`validateForSave(…, "STORAGE")`), sans les bornes de saisie.
 */
describe("PRE4-1.1 — validation de Séance au Continuer (niveau structurel)", () => {
  function copy(parameters: ExecutionParametersInput) {
    return {
      type: "EXERCISE" as const,
      structuralPosition: "IN_TOUR" as const,
      sourceMovementId: "mov-1",
      executionParameters: parameters,
      postActivityRecoverySeconds: 0,
      copyNumber: null,
    };
  }
  const session = (parameters: ExecutionParametersInput) => ({
    name: "Séance",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    tourRepeatCount: 1,
    exercises: [copy(parameters)],
  });
  const update = (parameters: ExecutionParametersInput) => ({
    sourceSessionId: "session-1",
    name: "Séance",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    tourRepeatCount: 1,
    activities: [{ ...copy(parameters), id: "act-1", position: 0 }],
  });

  it("PRE4-1.1/AC8 — le Continuer (création et modification) refuse une Copie dont une Cible est UNSET, un kind inconnu, une valeur négative ou non entière", () => {
    const refused: readonly [ExecutionParametersInput, object][] = [
      [variableParameters({ rows: [[30, 10], ["UNSET", 10]] }), { code: "REQUIRED", field: "exercise.durationSeconds" }],
      [
        uniformParameters({ target: { kind: "MAYBE" } as never }),
        { code: "UNRECOGNIZED", field: "exercise.durationSeconds" },
      ],
      [durationParameters(7.5), { code: "NOT_INTEGER", field: "exercise.durationSeconds" }],
      [repetitionParameters(-3), expect.objectContaining({ code: "OUT_OF_RANGE", field: "exercise.repetitionCount" })],
      [durationParameters(30, 2, -5), expect.objectContaining({ code: "OUT_OF_RANGE", field: "exercise.pauseSeconds" })],
      [durationParameters(30, 2, 2.5), { code: "NOT_INTEGER", field: "exercise.pauseSeconds" }],
      [
        durationParameters(30, 1, 0, { cadenceBeepIntervalSeconds: -1 }),
        expect.objectContaining({ code: "OUT_OF_RANGE", field: "exercise.executionMode" }),
      ],
      [{ ...durationParameters(30), mode: "SPRINT" as never }, { code: "UNRECOGNIZED", field: "exercise.executionMode" }],
    ];
    for (const [parameters, violation] of refused) {
      const created = validateCreateSessionInput(session(parameters));
      expect(created.ok).toBe(false);
      if (!created.ok) {
        expect(created.violations).toContainEqual(violation);
      }
      const updated = validateUpdateSessionInput(update(parameters));
      expect(updated.ok).toBe(false);
      if (!updated.ok) {
        expect(updated.violations).toContainEqual(violation);
      }
    }
  });

  it("PRE4-1.1/AC5 — le niveau structurel accepte les valeurs héritées positives hors bornes de saisie (Durée 5999, Répétitions 150, Bip 11, Pause 400)", () => {
    for (const parameters of [
      durationParameters(5999),
      repetitionParameters(150),
      repetitionParameters(12, 3, 10, { cadenceBeepIntervalSeconds: 11 }),
      durationParameters(30, 3, 400),
    ]) {
      const created = validateCreateSessionInput(session(parameters));
      expect(created.ok).toBe(true);
      if (created.ok) {
        expect(created.value.exercises[0]?.executionParameters).toEqual(parameters);
      }
      expect(validateUpdateSessionInput(update(parameters)).ok).toBe(true);
    }
  });

  it("PRE4-1.1/AC20 — une Copie tout à l'échec (ancien mode migré) passe le Continuer telle quelle, Cibles typées conservées", () => {
    const result = validateCreateSessionInput(session(allFailureParameters(3, 10, { cadenceBeepIntervalSeconds: 2 })));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.exercises[0]?.executionParameters).toEqual(
        allFailureParameters(3, 10, { cadenceBeepIntervalSeconds: 2 }),
      );
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
      sourceMovementId: "mov-1",
      executionParameters: durationParameters(30),
      postActivityRecoverySeconds: 0,
      copyNumber: null,
      // V2-BILAT-01 : `sideMode` OMIS délibérément — voir la note de tête de
      // `durationExercise` dans `validateCreateSessionInput / validateUpdateSessionInput — side mode`.
      ...overrides,
    };
  }

  function validInput(overrides: Partial<UpdateSessionInput> = {}): UpdateSessionInput {
    return {
      sourceSessionId: "session-1",
      name: "Séance modifiée",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 2,
      activities: [exerciseActivity()],
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
            executionParameters: durationParameters(60),
            copyNumber: null,
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
      validInput({ activities: [exerciseActivity({ postActivityRecoverySeconds: 120 })] }),
    );
    expect(okResult.ok).toBe(true);
    if (okResult.ok) {
      expect(okResult.value.activities[0]).toMatchObject({ postActivityRecoverySeconds: 120 });
    }

    const badResult = validateUpdateSessionInput(
      validInput({ activities: [exerciseActivity({ postActivityRecoverySeconds: 6000 })] }),
    );
    expect(badResult.ok).toBe(false);
    if (!badResult.ok) {
      expect(badResult.violations).toContainEqual({
        code: "OUT_OF_RANGE",
        field: "exercise.postActivityRecoverySeconds",
        details: { min: 0, max: 5999 },
      });
    }
  });

  it("never throws on a fully invalid edit aggregate", () => {
    expect(() =>
      validateUpdateSessionInput({
        sourceSessionId: "",
        name: "",
        initialCountdownSeconds: -1,
        finalPhaseSeconds: -1,
        tourRepeatCount: 0,
        activities: [],
      }),
    ).not.toThrow();
  });
});

/**
 * PRE-6 story 1.1 (AD-34, AD-35) : nature du Circuit validée et récupération
 * à trois états (absente `null`, présente à 0, positive).
 */
describe("PRE6-1.1 — nature du Circuit et récupération nullable", () => {
  type CreateInput = Parameters<typeof validateCreateSessionInput>[0];
  const exercise = (postActivityRecoverySeconds: number | null) => ({
    id: "ex-1",
    type: "EXERCISE" as const,
    structuralPosition: "IN_TOUR" as const,
    sourceMovementId: "mov-1",
    executionParameters: durationParameters(30),
    postActivityRecoverySeconds,
    copyNumber: null,
  });
  const createInput = (overrides: Record<string, unknown> = {}): CreateInput =>
    ({
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 4,
      exercises: [exercise(null)],
      ...overrides,
    }) as CreateInput;
  const updateInput = (overrides: Record<string, unknown> = {}): UpdateSessionInput =>
    ({
      sourceSessionId: "s-1",
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 4,
      activities: [{ ...exercise(null), position: 0 }],
      ...overrides,
    }) as UpdateSessionInput;

  it("validateCircuitNature : TOURS et SERIES reconnus ; absent = TOURS ; toute autre valeur UNRECOGNIZED", () => {
    expect(validateCircuitNature("TOURS")).toEqual({ ok: true, value: "TOURS" });
    expect(validateCircuitNature("SERIES")).toEqual({ ok: true, value: "SERIES" });
    expect(validateCircuitNature(undefined)).toEqual({ ok: true, value: "TOURS" });
    for (const raw of ["FOO", "", null, 1]) {
      expect(validateCircuitNature(raw)).toEqual({ ok: false, violations: [{ code: "UNRECOGNIZED", field: "session.circuitNature" }] });
    }
  });

  it("une nature invalide fait échouer la création et la modification sur session.circuitNature", () => {
    expect(validateCreateSessionInput(createInput({ circuitNature: "FOO" }))).toEqual({
      ok: false,
      violations: [{ code: "UNRECOGNIZED", field: "session.circuitNature" }],
    });
    expect(validateUpdateSessionInput(updateInput({ circuitNature: "FOO" }))).toEqual({
      ok: false,
      violations: [{ code: "UNRECOGNIZED", field: "session.circuitNature" }],
    });
  });

  it("une nature valide est transmise par les deux agrégats ; absente, elle reste absente (Tours implicite)", () => {
    const created = validateCreateSessionInput(createInput({ circuitNature: "SERIES" }));
    expect(created.ok && created.value.circuitNature).toBe("SERIES");
    const updated = validateUpdateSessionInput(updateInput({ circuitNature: "SERIES" }));
    expect(updated.ok && updated.value.circuitNature).toBe("SERIES");
    const implicit = validateCreateSessionInput(createInput());
    expect(implicit.ok && "circuitNature" in implicit.value).toBe(false);
  });

  it.each([null, 0, 30])("validatePostActivityRecoverySeconds(%p) est conservée telle quelle", (value) => {
    expect(validatePostActivityRecoverySeconds(value)).toEqual({ ok: true, value });
  });

  it("récupération null, 0 et 30 : identiques après validation (création et modification)", () => {
    for (const value of [null, 0, 30]) {
      const created = validateCreateSessionInput(createInput({ exercises: [exercise(value)] }));
      expect(created.ok && created.value.exercises[0]?.postActivityRecoverySeconds).toBe(value);
      const updated = validateUpdateSessionInput(updateInput({ activities: [{ ...exercise(value), position: 0 }] }));
      expect(updated.ok && updated.value.activities[0]?.postActivityRecoverySeconds).toBe(value);
    }
  });

  it("récupération -1 et 1,5 : violations existantes OUT_OF_RANGE et NOT_INTEGER", () => {
    expect(validateCreateSessionInput(createInput({ exercises: [exercise(-1)] }))).toEqual({
      ok: false,
      violations: [{ code: "OUT_OF_RANGE", field: "exercise.postActivityRecoverySeconds", details: { min: 0, max: 5999 } }],
    });
    expect(validateCreateSessionInput(createInput({ exercises: [exercise(1.5)] }))).toEqual({
      ok: false,
      violations: [{ code: "NOT_INTEGER", field: "exercise.postActivityRecoverySeconds" }],
    });
  });
});

describe("PRE6-1.2 — Points d'arrêt à l'enregistrement (AD-36, RM-219)", () => {
  type CreateInput = Parameters<typeof validateCreateSessionInput>[0];
  const exercise = (id: string, structuralPosition: "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR") => ({
    id,
    type: "EXERCISE" as const,
    structuralPosition,
    sourceMovementId: "mov-1",
    executionParameters: durationParameters(30),
    postActivityRecoverySeconds: null,
    copyNumber: null,
  });
  /** Avant : P ; Circuit : A, B. */
  const occurrences = [exercise("P", "BEFORE_TOUR"), exercise("A", "IN_TOUR"), exercise("B", "IN_TOUR")];
  const createInput = (stopPoints: unknown): CreateInput =>
    ({
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: occurrences,
      stopPoints,
    }) as CreateInput;
  const updateInput = (stopPoints: unknown): UpdateSessionInput =>
    ({
      sourceSessionId: "s-1",
      name: "Séance",
      labelId: null,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      activities: occurrences.map((item, index) => ({ ...item, position: index === 0 ? 0 : index - 1 })),
      stopPoints,
    }) as UpdateSessionInput;

  it("des emplacements autorisés et uniques sont transmis tels quels (création et modification)", () => {
    const points = [
      { scope: "BEFORE_TOUR", position: 1 },
      { scope: "IN_TOUR", position: 0 },
      { scope: "IN_TOUR", position: 1 },
    ];
    const created = validateCreateSessionInput(createInput(points));
    expect(created.ok && created.value.stopPoints).toEqual(points);
    const updated = validateUpdateSessionInput(updateInput(points));
    expect(updated.ok && updated.value.stopPoints).toEqual(points);
  });

  // Story 6.1 (revue, D-441) : RM-251 n'est pas contrôlée à l'enregistrement — une Séance
  // héritée portant deux points consécutifs reste enregistrable ; le développement n'en
  // exécute qu'un.
  it("RM-251 : deux points consécutifs hérités restent enregistrables ; le plan ne porte qu'un arrêt", () => {
    const points = [
      { scope: "BEFORE_TOUR" as const, position: 1 },
      { scope: "IN_TOUR" as const, position: 0 },
    ];
    expect(validateCreateSessionInput(createInput(points)).ok).toBe(true);
    expect(validateUpdateSessionInput(updateInput(points)).ok).toBe(true);
    const steps = expandComposition({
      exercises: occurrences,
      stopPoints: points.map((point, index) => ({ id: `s${index}`, ...point })),
      tourRepeatCount: 1,
    });
    expect(steps.filter((step) => step.kind === "STOP_POINT")).toHaveLength(1);
  });

  it.each([
    ["BEFORE_TOUR p=0 (juste après le compte à rebours)", { scope: "BEFORE_TOUR", position: 0 }, "FORBIDDEN_PLACEMENT"],
    ["IN_TOUR p=2 (juste avant la Fin)", { scope: "IN_TOUR", position: 2 }, "FORBIDDEN_PLACEMENT"],
    ["AFTER_TOUR p=0 sans rien après", { scope: "AFTER_TOUR", position: 0 }, "FORBIDDEN_PLACEMENT"],
    ["p hors bornes", { scope: "IN_TOUR", position: 3 }, "OUT_OF_RANGE"],
    ["p négative", { scope: "IN_TOUR", position: -1 }, "OUT_OF_RANGE"],
    ["p non entière", { scope: "IN_TOUR", position: 0.5 }, "NOT_INTEGER"],
    ["portée inconnue", { scope: "AILLEURS", position: 0 }, "UNRECOGNIZED"],
  ])("%s : violation %s sur session.stopPoints", (_label, point, code) => {
    for (const result of [validateCreateSessionInput(createInput([point])), validateUpdateSessionInput(updateInput([point]))]) {
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.violations.map((violation) => [violation.code, violation.field])).toEqual([[code, "session.stopPoints"]]);
      }
    }
  });

  // Story 7.1 (D-442) : à N ≥ 2, la fin de Tour en clôture de Séance (IN p=2 ici) est acceptée, et un
  // conflit de Tour (début et fin) reste enregistrable ; l'exécution n'en fait qu'un arrêt.
  it("D-442 — N ≥ 2 : fin de Tour juste avant la Fin acceptée ; conflit début + fin enregistrable", () => {
    const points = [
      { scope: "IN_TOUR" as const, position: 0 },
      { scope: "IN_TOUR" as const, position: 2 },
    ];
    const created = validateCreateSessionInput({ ...createInput(points), tourRepeatCount: 2 });
    expect(created.ok && created.value.stopPoints).toEqual(points);
    const updated = validateUpdateSessionInput({ ...updateInput(points), tourRepeatCount: 3 });
    expect(updated.ok).toBe(true);
    // N = 1 : la fin de Tour juste avant la Fin reste interdite.
    expect(validateCreateSessionInput(createInput(points)).ok).toBe(false);
    // N invalide : défaut 1, la règle ne s'assouplit pas (seule la violation de N est en plus).
    const invalid = validateCreateSessionInput({ ...createInput(points), tourRepeatCount: 0 });
    expect(!invalid.ok && invalid.violations.some((violation) => violation.code === "FORBIDDEN_PLACEMENT")).toBe(true);
  });

  it("un doublon (scope, position) : violation DUPLICATE", () => {
    const result = validateCreateSessionInput(
      createInput([
        { scope: "IN_TOUR", position: 1 },
        { scope: "IN_TOUR", position: 1 },
      ]),
    );
    expect(result).toEqual({ ok: false, violations: [{ code: "DUPLICATE", field: "session.stopPoints" }] });
  });

  it("hors bornes : détails min 0 / max = nombre d'occurrences de la portée", () => {
    expect(validateCreateSessionInput(createInput([{ scope: "IN_TOUR", position: 3 }]))).toEqual({
      ok: false,
      violations: [{ code: "OUT_OF_RANGE", field: "session.stopPoints", details: { min: 0, max: 2 } }],
    });
  });
});
