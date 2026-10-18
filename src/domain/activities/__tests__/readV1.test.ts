import { describe, expect, it } from "@jest/globals";

import {
  ExecutionParametersDataError,
  validateForSave,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import { readV1 } from "@/domain/activities/readV1";
import {
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";

/**
 * PRE-4 (story 1.1, AD-3) — lecteur des formes anciennes (JSON v1 de PRE-3,
 * scalaires seuls). Module de tests de `readV1`, seul autorisé à nommer
 * l'ancien troisième mode avec lui (garde de cantonnement, AC4).
 */

function v1(overrides: Record<string, unknown> = {}, series: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: 1,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: 30, pauseSeconds: 10, ...series },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    ...overrides,
  });
}

describe("PRE4-1.1/AC3 — lecteur v1", () => {
  it("JSON v1 TO_FAILURE à 3 Séries → Répétitions, 3 Cibles FAILURE ; Pauses, côtés et Bip inchangés", () => {
    const json = v1(
      {
        mode: "TO_FAILURE",
        sideMode: "RIGHT_LEFT",
        sideOrder: "BY_SERIES",
        sideRecoverySeconds: 5,
        cadenceBeepIntervalSeconds: 2,
        countdownSeconds: 3,
        endSeconds: 4,
      },
      { count: 3, target: null, pauseSeconds: 10 },
    );
    expect(readV1(json)).toEqual(
      uniformParameters({
        mode: "REPETITIONS",
        count: 3,
        target: "FAILURE",
        pauseSeconds: 10,
        sideMode: "RIGHT_LEFT",
        sideOrder: "BY_SERIES",
        sideRecoverySeconds: 5,
        cadenceBeepIntervalSeconds: 2,
        countdownSeconds: 3,
        endSeconds: 4,
      }),
    );
  });

  it("JSON v1 TO_FAILURE variable : chaque ligne devient FAILURE, Pauses et ordre conservés", () => {
    const json = v1(
      { mode: "TO_FAILURE" },
      { kind: "VARIABLE", rows: [{ target: null, pauseSeconds: 10 }, { target: null, pauseSeconds: 20 }] },
    );
    expect(readV1(json)).toEqual(variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 10], ["FAILURE", 20]] }));
  });

  it("scalaires sans JSON et sans Bip : Régime identiques, Un côté après l'autre, Bip 0, CR et Fin 0, N = max(N, 1)", () => {
    expect(
      readV1({
        executionMode: "REPETITIONS",
        durationSeconds: null,
        repetitionCount: 12,
        seriesCount: 3,
        pauseSeconds: 15,
        sideMode: "LEFT_RIGHT",
        sideRecoverySeconds: 7,
      }),
    ).toEqual(
      uniformParameters({
        mode: "REPETITIONS",
        count: 3,
        target: 12,
        pauseSeconds: 15,
        sideMode: "LEFT_RIGHT",
        sideOrder: "BY_SIDE",
        sideRecoverySeconds: 7,
      }),
    );
    expect(
      readV1({ executionMode: "DURATION", durationSeconds: 45, repetitionCount: null, seriesCount: 0, pauseSeconds: 0 }),
    ).toEqual(uniformParameters({ mode: "DURATION", count: 1, target: 45, pauseSeconds: 0 }));
    expect(
      readV1({ executionMode: "TO_FAILURE", durationSeconds: null, repetitionCount: null, seriesCount: 3, pauseSeconds: 10 }),
    ).toEqual(uniformParameters({ mode: "REPETITIONS", count: 3, target: "FAILURE", pauseSeconds: 10 }));
  });

  it("Cible absente, null ou 0 → UNSET (H7), jamais FAILURE ; valeur positive hors bornes conservée telle quelle", () => {
    expect(readV1(v1({}, { target: null }))).toEqual(uniformParameters({ count: 3, target: "UNSET", pauseSeconds: 10 }));
    expect(readV1(v1({}, { target: 0 }))).toEqual(uniformParameters({ count: 3, target: "UNSET", pauseSeconds: 10 }));
    expect(readV1(v1({}, { target: undefined }))).toEqual(uniformParameters({ count: 3, target: "UNSET", pauseSeconds: 10 }));
    expect(
      readV1({ executionMode: "REPETITIONS", durationSeconds: null, repetitionCount: null, seriesCount: 2, pauseSeconds: 0 }),
    ).toEqual(uniformParameters({ mode: "REPETITIONS", count: 2, target: "UNSET" }));
    expect(readV1(v1({ cadenceBeepIntervalSeconds: 11 }, { target: 5999, pauseSeconds: 400 }))).toEqual(
      uniformParameters({ count: 3, target: 5999, pauseSeconds: 400, cadenceBeepIntervalSeconds: 11 }),
    );
  });

  it("prédicat d'illisibilité fermé : chaque cas lève ExecutionParametersDataError", () => {
    const unreadable: readonly [string, Parameters<typeof readV1>[0]][] = [
      ["(a) JSON non analysable", "{not json"],
      ["(b) version 2", v1({ version: 2 })],
      ["(b) version 7", v1({ version: 7 })],
      ["(c1) racine tableau", "[]"],
      ["(c1) racine nombre", "3"],
      ["(c2) clé requise absente", JSON.stringify({ ...JSON.parse(v1()), endSeconds: undefined })],
      ["(c3) chaîne à la place d'un nombre", v1({ countdownSeconds: "3" })],
      ["(c3) booléen à la place d'un nombre", v1({ cadenceBeepIntervalSeconds: true })],
      ["(c3) objet à la place d'une Cible", v1({}, { target: { value: 30 } })],
      ["(c3) tableau à la place d'une Pause", v1({}, { pauseSeconds: [10] })],
      ["(c4) Mode inconnu", v1({ mode: "SPRINT" })],
      ["(c5) côté inconnu", v1({ sideMode: "BOTH" })],
      ["(c5) ordre inconnu", v1({ sideOrder: "RANDOM" })],
      ["(c6) series.kind inconnu", v1({}, { kind: "MIXED" })],
      ["(c7) count < 1", v1({}, { count: 0 })],
      ["(c8) rows vide", v1({}, { kind: "VARIABLE", rows: [] })],
      ["(c8) rows non tableau", v1({}, { kind: "VARIABLE", rows: "x" })],
      ["(c9) count non entier", v1({}, { count: 2.5 })],
      ["(c11) Cible négative", v1({}, { target: -3 })],
      ["(c11) Cible non entière", v1({}, { target: 7.5 })],
      ["(c11) Pause négative", v1({}, { pauseSeconds: -5 })],
      ["(c11) Pause non entière ligne 2", v1({}, { kind: "VARIABLE", rows: [{ target: 30, pauseSeconds: 10 }, { target: 30, pauseSeconds: 2.5 }] })],
      ["(c11) Pause au changement de côté non entière", v1({ sideRecoverySeconds: 2.5 })],
      ["(c11) Bip négatif", v1({ cadenceBeepIntervalSeconds: -1 })],
      ["(c11) Compte à rebours négatif", v1({ countdownSeconds: -3 })],
      ["(c11) Fin non entière", v1({ endSeconds: 1.5 })],
      ["(c9) series_count non entier sans JSON", { executionMode: "DURATION", durationSeconds: 30, repetitionCount: null, seriesCount: 2.5, pauseSeconds: 0 }],
      ["(c11) pause_seconds négative sans JSON", { executionMode: "DURATION", durationSeconds: 30, repetitionCount: null, seriesCount: 2, pauseSeconds: -5 }],
      ["(c11) side_recovery_seconds non entière sans JSON", { executionMode: "DURATION", durationSeconds: 30, repetitionCount: null, seriesCount: 2, pauseSeconds: 0, sideRecoverySeconds: 2.5 }],
      ["(c11) cible scalaire négative sans JSON", { executionMode: "REPETITIONS", durationSeconds: null, repetitionCount: -3, seriesCount: 2, pauseSeconds: 0 }],
      ["(c11) series_count négatif sans JSON", { executionMode: "DURATION", durationSeconds: 30, repetitionCount: null, seriesCount: -2, pauseSeconds: 0 }],
      ["(c11) colonne de cible inactive négative sans JSON", { executionMode: "DURATION", durationSeconds: 30, repetitionCount: -4, seriesCount: 2, pauseSeconds: 0 }],
      ["(c11) cible non entière d'un ancien mode à l'échec sans JSON", { executionMode: "TO_FAILURE", durationSeconds: 2.5, repetitionCount: null, seriesCount: 2, pauseSeconds: 0 }],
    ];
    for (const [label, source] of unreadable) {
      expect({ label, thrown: (() => { try { readV1(source); return null; } catch (error) { return error instanceof ExecutionParametersDataError; } })() }).toEqual({ label, thrown: true });
    }
  });

  it("les scalaires ne sont jamais lus quand un JSON v1 est lu (seule la chaîne compte)", () => {
    expect(readV1(v1({}, { target: 45 }))).toEqual(uniformParameters({ count: 3, target: 45, pauseSeconds: 10 }));
  });
});

describe("PRE4-1.1/AC5 — le Mode historique TO_FAILURE n'est jamais enregistrable", () => {
  it("validateForSave refuse le Mode TO_FAILURE au niveau structurel, avec ou sans ligne de base", () => {
    const legacy = { ...uniformParameters({ mode: "REPETITIONS", count: 3, target: "FAILURE" }), mode: "TO_FAILURE" } as unknown as ExecutionParametersInput;
    for (const baseline of ["STORAGE", null] as const) {
      const result = validateForSave(legacy, baseline);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.violations).toEqual([
        expect.objectContaining({ code: "UNRECOGNIZED", field: "mode", level: "STRUCTURE" }),
      ]);
    }
  });
});

describe("PRE4-1.3/AC9 — clé Bip absente : Instantané seulement", () => {
  it("sans option, l'absence de clé Bip reste illisible (prédicat de migration010) ; avec l'option d'Instantané, Bip 0", () => {
    const withoutBeep = JSON.stringify({ ...JSON.parse(v1({ cadenceBeepIntervalSeconds: 3 })), cadenceBeepIntervalSeconds: undefined });
    expect(withoutBeep).not.toContain("cadenceBeepIntervalSeconds");
    expect(() => readV1(withoutBeep)).toThrow(ExecutionParametersDataError);
    expect(readV1(withoutBeep, { absentBeepAsZero: true })).toEqual(uniformParameters({ count: 3, target: 30, pauseSeconds: 10 }));
    // Bip présent mais `null` : traité comme absent avec l'option ; illisible sans elle (parité migration010).
    const nullBeep = v1({ cadenceBeepIntervalSeconds: null });
    expect(() => readV1(nullBeep)).toThrow(ExecutionParametersDataError);
    expect(readV1(nullBeep, { absentBeepAsZero: true })).toEqual(uniformParameters({ count: 3, target: 30, pauseSeconds: 10 }));
    // Une clé présente n'est jamais remplacée par l'option.
    expect(readV1(v1({ cadenceBeepIntervalSeconds: 3 }), { absentBeepAsZero: true }).cadenceBeepIntervalSeconds).toBe(3);
  });
});
