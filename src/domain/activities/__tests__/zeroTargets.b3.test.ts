import { describe, expect, it } from "@jest/globals";

import {
  computeIntrinsicDuration,
  computeOccurrenceDuration,
  computeSeriesCircuitOccurrenceDuration,
} from "@/domain/activities/executionCalculations";
import {
  EXECUTION_BOUNDS,
  projectScalars,
  readResolvedExecutionParameters,
  selectorOpeningPosition,
  serializeResolvedExecutionParameters,
  stepTarget,
  unsetTarget,
  validateForSave,
  WORK_PATTERN_DURATION_BOUNDS,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import { durationParameters, repetitionParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";

/**
 * PRE-9 (story B.3, COMP §3 du 28/10, ARB-10, ARB-10b) — cibles à 0 : « Une cible de série peut être
 * 0 s ou 0 répétition, à toute position […] L'étape correspondante et sa pause sont sautées » ; le
 * tiret bloque l'enregistrement ; « Un exercice dont toutes les cibles numériques sont nulles est
 * refusé » ; bornes 0..100 répétitions et 0..3535 s ; phases du Mouvement inchangées.
 */

const codes = (parameters: unknown, baseline: ExecutionParameters | null | "STORAGE" = null) => {
  const result = validateForSave(parameters as ExecutionParameters, baseline);
  return result.ok ? [] : result.violations.map((violation) => `${violation.code}:${violation.field}:${violation.seriesNumber ?? "-"}`);
};

describe("PRE-9 B.3 — bornes du 28/10 (COMP §3)", () => {
  it("Cible 0..3535 s et 0..100 répétitions ; nombre de séries 1..99 et pauses inchangés ; phases 1..3535 s", () => {
    expect(EXECUTION_BOUNDS.durationTarget).toEqual({ min: 0, max: 3535 });
    expect(EXECUTION_BOUNDS.repetitionTarget).toEqual({ min: 0, max: 100 });
    expect(EXECUTION_BOUNDS.seriesCount).toEqual({ min: 1, max: 99 });
    expect(EXECUTION_BOUNDS.pauseSeconds).toEqual({ min: 0, max: 300 });
    expect(WORK_PATTERN_DURATION_BOUNDS).toEqual({ min: 1, max: 3535 });
    expect(codes(variableParameters({ rows: [[3536, 0], [10, 0]] }))).toEqual(["OUT_OF_RANGE:target:1"]);
    expect(codes(variableParameters({ mode: "REPETITIONS", rows: [[101, 0], [0, 0]] }))).toEqual(["OUT_OF_RANGE:target:1"]);
  });

  it("« — » s'ouvre et s'incrémente sur la plus petite Cible POSITIVE ; − depuis 1 donne 0", () => {
    expect(selectorOpeningPosition("DURATION", unsetTarget())).toEqual({ kind: "NUMBER", value: 1 });
    expect(selectorOpeningPosition("REPETITIONS", unsetTarget())).toEqual({ kind: "NUMBER", value: 1 });
    expect(stepTarget("REPETITIONS", unsetTarget(), 1)).toEqual({ kind: "NUMBER", value: 1 });
    expect(stepTarget("REPETITIONS", { kind: "NUMBER", value: 1 }, -1)).toEqual({ kind: "NUMBER", value: 0 });
  });
});

describe("PRE-9 B.3 — zéro, tiret et volume total (COMP §3 l.40, ARB-10)", () => {
  it("une série à 0 parmi des séries positives : admise, à toute position, aux deux niveaux de validation", () => {
    for (const rows of [
      [[0, 10], [12, 10], [15, 10]],
      [[12, 10], [0, 10], [15, 10]],
      [[12, 10], [15, 10], [0, 10]],
    ] as const) {
      const parameters = variableParameters({ mode: "REPETITIONS", rows });
      expect(codes(parameters)).toEqual([]);
      expect(codes(parameters, "STORAGE")).toEqual([]);
    }
  });

  it("toutes les Cibles à 0 : refus `ZERO_VOLUME`, une violation par série en variables, une seule en identiques", () => {
    expect(codes(variableParameters({ rows: [[0, 10], [0, 10]] }))).toEqual(["ZERO_VOLUME:target:1", "ZERO_VOLUME:target:2"]);
    expect(codes(variableParameters({ rows: [[0, 10], [0, 10]] }), "STORAGE")).toEqual(["ZERO_VOLUME:target:1", "ZERO_VOLUME:target:2"]);
    expect(codes(durationParameters(0, 3))).toEqual(["ZERO_VOLUME:target:-"]);
    expect(codes(repetitionParameters(0, 1), "STORAGE")).toEqual(["ZERO_VOLUME:target:-"]);
  });

  it("une Cible à l'échec n'est pas un volume nul (COMP §3) : [0, à l'échec] admis", () => {
    expect(codes(variableParameters({ mode: "REPETITIONS", rows: [[0, 10], ["FAILURE", 10]] }))).toEqual([]);
  });

  it("le tiret bloque l'enregistrement ; le zéro est renseigné", () => {
    expect(codes(variableParameters({ rows: [["UNSET", 10], [0, 10], [20, 10]] }))).toEqual(["REQUIRED:target:1"]);
    expect(codes(variableParameters({ rows: [["UNSET", 10], [20, 10]] }), "STORAGE")).toEqual(["REQUIRED:target:1"]);
  });

  it("persistance : la Cible 0 est relue telle quelle ; la projection scalaire historique écrit NULL (CHECK de la base)", () => {
    const parameters = variableParameters({ mode: "REPETITIONS", rows: [[0, 10], [12, 20]] });
    const validated = validateForSave(parameters, "STORAGE");
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(readResolvedExecutionParameters(serializeResolvedExecutionParameters(validated.value))).toEqual(validated.value);
    expect(projectScalars(validated.value)).toMatchObject({ repetitionCount: null, seriesCount: 2, pauseSeconds: 10 });
    expect(projectScalars(validateOk(durationParameters(30, 2)))).toMatchObject({ durationSeconds: 30 });
  });
});

function validateOk(parameters: ExecutionParameters): ExecutionParameters {
  const result = validateForSave(parameters, "STORAGE");
  if (!result.ok) throw new Error("invalid fixture");
  return result.value;
}

describe("PRE-9 B.3 — durées : série nulle sautée avec sa pause (COMP §3, ARB-10b)", () => {
  it("Exercice seul : ni travail ni pause pour la série 0 ; la Récupération remplace la dernière pause jouée", () => {
    // 30 + 10 (série 1) ; série 2 nulle sautée avec sa pause de 10 ; 40 + 10 (série 3).
    const parameters = variableParameters({ rows: [[30, 10], [0, 10], [40, 10]] });
    expect(computeIntrinsicDuration(parameters)).toMatchObject({ kind: "exact", seconds: 90 });
    expect(computeOccurrenceDuration(parameters, 60)).toMatchObject({ kind: "exact", seconds: 30 + 10 + 40 + 60 });
    // Dernière série nulle : la Récupération remplace la pause de la série 2, dernière jouée.
    const lastZero = variableParameters({ rows: [[30, 10], [40, 15], [0, 20]] });
    expect(computeOccurrenceDuration(lastZero, 60)).toMatchObject({ kind: "exact", seconds: 30 + 10 + 40 + 60 });
  });

  it("bilatéral par côté : la série nulle ne produit ni travail ni pause sur aucun côté", () => {
    const parameters = variableParameters({ rows: [[30, 10], [0, 10]], sideMode: "RIGHT_LEFT", sideOrder: "BY_SIDE", sideRecoverySeconds: 5 });
    // Droite : 30 + 10 ; changement de côté 5 ; gauche : 30 + 10.
    expect(computeIntrinsicDuration(parameters)).toMatchObject({ kind: "exact", seconds: 85 });
  });

  it("Circuit alterné : le passage d'une série nulle est sauté, sa Récupération directement associée n'est pas exécutée (ARB-10b)", () => {
    const parameters = variableParameters({ rows: [[30, 10], [0, 10], [40, 10]] });
    // Passages 1 et 3 : travail + Récupération 20 (remplace la pause) ; passage 2 : rien.
    expect(computeSeriesCircuitOccurrenceDuration(parameters, 20, 3)).toMatchObject({ kind: "exact", seconds: 30 + 20 + 40 + 20 });
  });
});
