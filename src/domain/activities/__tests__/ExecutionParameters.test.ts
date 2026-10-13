import { describe, expect, it } from "@jest/globals";

import {
  createEmptyExecutionParameters,
  ExecutionParametersDataError,
  executionParametersEqual,
  legacyExecutionParameters,
  normalizeEffective,
  parseExecutionParameters,
  projectLegacyScalars,
  serializeExecutionParameters,
  validateExecutionParameters,
  type ExecutionParameters,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";

function uniform(overrides: Partial<ExecutionParametersInput> = {}, target: number | null = 30, pause = 10, count = 3) {
  return {
    version: 1,
    mode: "DURATION",
    series: { kind: "UNIFORM", count, target, pauseSeconds: pause },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    ...overrides,
  } as ExecutionParametersInput;
}

function violationsOf(input: ExecutionParametersInput) {
  const result = validateExecutionParameters(input);
  return result.ok ? [] : result.violations;
}

describe("P3-04/bounds — validation des paramètres actifs", () => {
  it.each([
    ["DURATION", 1, true],
    ["DURATION", 5999, true],
    ["DURATION", 0, false],
    ["DURATION", 6000, false],
    ["REPETITIONS", 1, true],
    ["REPETITIONS", 100, true],
    ["REPETITIONS", 0, false],
    ["REPETITIONS", 101, false],
  ] as [ "DURATION" | "REPETITIONS", number, boolean][])("cible %s = %i acceptée : %s", (mode, target, accepted) => {
    const result = validateExecutionParameters(uniform({ mode }, target));
    expect(result.ok).toBe(accepted);
    if (!accepted && !result.ok) {
      expect(result.violations).toEqual([
        expect.objectContaining({ code: "OUT_OF_RANGE", field: "target" }),
      ]);
    }
  });

  it("borne N = 1..99 exactement", () => {
    expect(validateExecutionParameters(uniform({}, 30, 10, 1)).ok).toBe(true);
    expect(validateExecutionParameters(uniform({}, 30, 10, 99)).ok).toBe(true);
    expect(violationsOf(uniform({}, 30, 10, 100))).toEqual([
      expect.objectContaining({ field: "seriesCount", code: "OUT_OF_RANGE" }),
    ]);
  });

  it("Pause et Pause entre les côtés 0..300, bip 0..10, CR/Fin 0..60", () => {
    expect(validateExecutionParameters(uniform({}, 30, 0)).ok).toBe(true);
    expect(validateExecutionParameters(uniform({}, 30, 300)).ok).toBe(true);
    expect(violationsOf(uniform({}, 30, 301))).toEqual([expect.objectContaining({ field: "pauseSeconds" })]);
    expect(validateExecutionParameters(uniform({ sideRecoverySeconds: 300 })).ok).toBe(true);
    expect(violationsOf(uniform({ sideRecoverySeconds: 301 }))).toEqual([
      expect.objectContaining({ field: "sideRecoverySeconds" }),
    ]);
    for (const beep of [0, 1, 10]) {
      expect(validateExecutionParameters(uniform({ cadenceBeepIntervalSeconds: beep })).ok).toBe(true);
    }
    for (const field of ["countdownSeconds", "endSeconds"] as const) {
      expect(validateExecutionParameters(uniform({ [field]: 0 })).ok).toBe(true);
      expect(validateExecutionParameters(uniform({ [field]: 60 })).ok).toBe(true);
      expect(violationsOf(uniform({ [field]: 61 }))).toEqual([expect.objectContaining({ field })]);
    }
  });

  it("valeurs fractionnaires refusées sans correction silencieuse", () => {
    expect(violationsOf(uniform({}, 30.5))).toEqual([expect.objectContaining({ field: "target", code: "NOT_INTEGER" })]);
    expect(violationsOf(uniform({ cadenceBeepIntervalSeconds: 2.5 }))).toEqual([
      expect.objectContaining({ field: "cadenceBeepIntervalSeconds", code: "NOT_INTEGER" }),
    ]);
  });

  it("une cible nulle est incomplète et identifie la Série en variable", () => {
    const input = uniform({
      series: {
        kind: "VARIABLE",
        rows: [
          { target: 30, pauseSeconds: 10 },
          { target: null, pauseSeconds: 20 },
          { target: 6000, pauseSeconds: 30 },
        ],
      },
    });
    expect(violationsOf(input)).toEqual([
      { code: "REQUIRED", field: "target", seriesNumber: 2 },
      { code: "OUT_OF_RANGE", field: "target", seriesNumber: 3, details: { min: 1, max: 5999 } },
    ]);
    expect(violationsOf(uniform({}, null))).toEqual([{ code: "REQUIRED", field: "target" }]);
  });

  it("mode non renseigné : incomplet ; côté non renseigné normalisé Sans changement", () => {
    expect(violationsOf(uniform({ mode: null }))).toEqual([{ code: "REQUIRED", field: "mode" }]);
    const result = validateExecutionParameters(uniform({ sideMode: null }));
    expect(result.ok && result.value.sideMode).toBe("UNILATERAL");
  });
});

describe("P3-11/all-modes-bip — bip commun aux trois modes", () => {
  it.each(["DURATION", "REPETITIONS", "TO_FAILURE"] as const)("%s accepte 0/1/10 et refuse −1/11/fraction", (mode) => {
    const target = mode === "TO_FAILURE" ? null : 12;
    for (const beep of [0, 1, 10]) {
      const result = validateExecutionParameters(uniform({ mode, cadenceBeepIntervalSeconds: beep }, target));
      expect(result.ok && result.value.cadenceBeepIntervalSeconds).toBe(beep);
    }
    for (const beep of [-1, 11, 0.5]) {
      expect(violationsOf(uniform({ mode, cadenceBeepIntervalSeconds: beep }, target))).toEqual([
        expect.objectContaining({ field: "cadenceBeepIntervalSeconds" }),
      ]);
    }
  });

  it("À l'échec : aucune cible numérique admise", () => {
    expect(violationsOf(uniform({ mode: "TO_FAILURE" }, 12))).toEqual([
      { code: "MUST_BE_ABSENT", field: "target" },
    ]);
  });
});

describe("P3-08 — normalisation effective N=1", () => {
  it("variable et par paire à N=1 deviennent uniforme et par côté", () => {
    const normalized = normalizeEffective(
      uniform({
        series: { kind: "VARIABLE", rows: [{ target: 90, pauseSeconds: 15 }] },
        sideMode: "RIGHT_LEFT",
        sideOrder: "BY_SERIES",
      }),
    );
    expect(normalized.series).toEqual({ kind: "UNIFORM", count: 1, target: 90, pauseSeconds: 15 });
    expect(normalized.sideOrder).toBe("BY_SIDE");
  });

  it("l'état variable reste explicite à N≥2 même avec des valeurs égales (P3-05/equal-variable)", () => {
    const rows = [1, 2, 3].map(() => ({ target: 30, pauseSeconds: 10 }));
    const result = validateExecutionParameters(uniform({ series: { kind: "VARIABLE", rows } }));
    expect(result.ok && result.value.series).toEqual({ kind: "VARIABLE", rows });
  });
});

describe("Sérialisation canonique et lecture (P3-17)", () => {
  const variable: ExecutionParameters = {
    version: 1,
    mode: "REPETITIONS",
    series: {
      kind: "VARIABLE",
      rows: [
        { target: 100, pauseSeconds: 300 },
        { target: 1, pauseSeconds: 0 },
      ],
    },
    sideMode: "LEFT_RIGHT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 15,
    cadenceBeepIntervalSeconds: 4,
    countdownSeconds: 3,
    endSeconds: 2,
  };

  it("aller-retour exact, aucune phrase ni total ni segment", () => {
    const json = serializeExecutionParameters(variable);
    expect(parseExecutionParameters(json)).toEqual(variable);
    expect(json).not.toMatch(/phrase|segment|total|texte/i);
  });

  it.each([
    ["JSON corrompu", "{not json"],
    ["version inconnue", JSON.stringify({ ...JSON.parse(serializeExecutionParameters(variable)), version: 2 })],
    ["cible incompatible avec À l'échec", serializeExecutionParameters({ ...variable, mode: "TO_FAILURE" })],
    ["mode inconnu", JSON.stringify({ ...JSON.parse(serializeExecutionParameters(variable)), mode: "SPRINT" })],
  ])("%s → erreur de données typée, jamais un repli scalaire", (_label, json) => {
    expect(() => parseExecutionParameters(json)).toThrow(ExecutionParametersDataError);
  });

  it("une ancienne valeur hors nouvelles bornes reste lisible sans clamp", () => {
    const legacyOutOfBounds = serializeExecutionParameters({
      ...variable,
      mode: "DURATION",
      series: { kind: "UNIFORM", count: 3, target: 60, pauseSeconds: 900 },
    });
    expect(parseExecutionParameters(legacyOutOfBounds).series).toEqual({
      kind: "UNIFORM",
      count: 3,
      target: 60,
      pauseSeconds: 900,
    });
  });
});

describe("P3-10/legacy-neutral-proposal — adaptateur des objets anciens", () => {
  it("conserve cibles, N, Pause, direction ; uniforme/par côté/bip0 ; CR/Fin neutres 0 sans Profil", () => {
    expect(
      legacyExecutionParameters({
        executionMode: "DURATION",
        durationSeconds: 45,
        repetitionCount: null,
        seriesCount: 4,
        pauseSeconds: 900,
        sideMode: "RIGHT_LEFT",
        sideRecoverySeconds: 7,
      }),
    ).toEqual({
      version: 1,
      mode: "DURATION",
      series: { kind: "UNIFORM", count: 4, target: 45, pauseSeconds: 900 },
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 7,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 0,
      endSeconds: 0,
    });
  });

  it("une copie historique sans colonne PC garde l'absence explicite (0)", () => {
    expect(
      legacyExecutionParameters({
        executionMode: "REPETITIONS",
        durationSeconds: null,
        repetitionCount: 12,
        seriesCount: 3,
        pauseSeconds: 30,
      }).sideRecoverySeconds,
    ).toBe(0);
  });
});

describe("Projections scalaires dérivées", () => {
  it("première cible/Pause EFFECTIVE, N, mode, direction — jamais une moyenne", () => {
    expect(
      projectLegacyScalars({
        version: 1,
        mode: "DURATION",
        series: {
          kind: "VARIABLE",
          rows: [
            { target: 30, pauseSeconds: 10 },
            { target: 45, pauseSeconds: 20 },
          ],
        },
        sideMode: "RIGHT_LEFT",
        sideOrder: "BY_SERIES",
        sideRecoverySeconds: 15,
        cadenceBeepIntervalSeconds: 4,
        countdownSeconds: 10,
        endSeconds: 5,
      }),
    ).toEqual({
      executionMode: "DURATION",
      durationSeconds: 30,
      repetitionCount: null,
      seriesCount: 2,
      pauseSeconds: 10,
      sideMode: "RIGHT_LEFT",
      sideRecoverySeconds: 15,
    });
  });
});

describe("Création et égalité", () => {
  it("création : mode/côté non renseignés, Série 1, Pause 0, bip 0, CR/Fin copiés du Profil", () => {
    expect(createEmptyExecutionParameters({ countdownSeconds: 10, endSeconds: 5 })).toEqual({
      version: 1,
      mode: null,
      series: { kind: "UNIFORM", count: 1, target: null, pauseSeconds: 0 },
      sideMode: null,
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 10,
      endSeconds: 5,
    });
  });

  it("égalité structurelle sensible à l'ordre des lignes et à l'état variable", () => {
    const a = uniform({
      series: {
        kind: "VARIABLE",
        rows: [
          { target: 30, pauseSeconds: 10 },
          { target: 45, pauseSeconds: 20 },
        ],
      },
    });
    const reordered = uniform({
      series: {
        kind: "VARIABLE",
        rows: [
          { target: 45, pauseSeconds: 20 },
          { target: 30, pauseSeconds: 10 },
        ],
      },
    });
    expect(executionParametersEqual(a, { ...a })).toBe(true);
    expect(executionParametersEqual(a, reordered)).toBe(false);
    expect(executionParametersEqual(uniform({}, 30, 10, 2), a)).toBe(false);
  });
});
