import { describe, expect, it } from "@jest/globals";

import { computeExercisePlanDuration, computeIntrinsicDuration } from "@/domain/activities/executionCalculations";
import {
  formatLoadKg,
  normalizeLoad,
  parseLoadText,
  reactivateLoad,
  roundLoadUp,
} from "@/domain/activities/exerciseLoad";
import { projectScalars, stopConditionOf, validateForSave } from "@/domain/activities/ExecutionParameters";
import { uniformParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";

/**
 * PRE-5 (story 1.1, AC7, AD-19, FR-14, Δ16 à Δ20, Δ48) — module unique de la
 * charge : arrondi, règles du zéro, réactivation, format et analyse du texte.
 */

describe("PRE5-1.1/AC7 — roundLoadUp (multiple de 0,25 supérieur)", () => {
  it("1,3 → 1,5 ; 0,01 → 0,25 ; 1,25 → 1,25 ; 0 → 0", () => {
    expect(roundLoadUp(1.3)).toBe(1.5);
    expect(roundLoadUp(0.01)).toBe(0.25);
    expect(roundLoadUp(1.25)).toBe(1.25);
    expect(roundLoadUp(0)).toBe(0);
  });

  it("valeurs usuelles du clavier décimal, sans erreur binaire ; négatif ou non fini → 0", () => {
    expect(roundLoadUp(1.1)).toBe(1.25);
    expect(roundLoadUp(2.5)).toBe(2.5);
    expect(roundLoadUp(20)).toBe(20);
    expect(roundLoadUp(12.76)).toBe(13);
    expect(roundLoadUp(-1)).toBe(0);
    expect(roundLoadUp(Number.NaN)).toBe(0);
  });
});

describe("PRE5-1.1/AC7 — normalizeLoad (règles du zéro, FR-14)", () => {
  it("identiques : une charge commune à 0 fait passer à Sans ; positive, la charge reste active", () => {
    expect(normalizeLoad(uniformParameters({ target: 30, loadKg: 0, loadEnabled: true })).loadEnabled).toBe(false);
    expect(normalizeLoad(uniformParameters({ target: 30, loadKg: 2.5, loadEnabled: true }))).toEqual(
      uniformParameters({ target: 30, loadKg: 2.5, loadEnabled: true }),
    );
  });

  it("variables : une ligne à 0 vaut « sans charge » pour cette Série seulement ; toutes à 0 → Sans ; aucune valeur remplacée", () => {
    const partial = variableParameters({ rows: [[30, 10, 20], [30, 10, 0], [30, 10, 13]], loadEnabled: true });
    expect(normalizeLoad(partial)).toEqual(partial);
    const allZero = variableParameters({ rows: [[30, 10, 0], [30, 10, 0]], loadEnabled: true });
    expect(normalizeLoad(allZero)).toEqual({ ...allZero, loadEnabled: false });
    // Un zéro n'est jamais remplacé par une ancienne charge positive.
    expect(normalizeLoad(allZero).series).toEqual(allZero.series);
  });

  it("déjà Sans : inchangé, valeurs conservées", () => {
    const sans = uniformParameters({ target: 30, loadKg: 7.5, loadEnabled: false });
    expect(normalizeLoad(sans)).toBe(sans);
  });

  it("lue sur l'état effectif : N = 1 en variables vaut identiques", () => {
    expect(normalizeLoad(variableParameters({ rows: [[30, 10, 0]], loadEnabled: true })).loadEnabled).toBe(false);
  });
});

describe("PRE5-1.1/AC7 — reactivateLoad (FR-14, Δ20)", () => {
  it("aucune valeur mémorisée, ou toutes nulles → 0,25 kg sur l'uniforme et sur chaque ligne", () => {
    expect(reactivateLoad(uniformParameters({ target: 30, loadKg: 0 }))).toEqual(uniformParameters({ target: 30, loadKg: 0.25, loadEnabled: true }));
    expect(reactivateLoad(variableParameters({ rows: [[30, 10, 0], [30, 10, 0], [30, 10, 0]] }))).toEqual(
      variableParameters({ rows: [[30, 10, 0.25], [30, 10, 0.25], [30, 10, 0.25]], loadEnabled: true }),
    );
  });

  it("sinon les valeurs conservées sous Sans sont restaurées telles quelles, zéros compris", () => {
    expect(reactivateLoad(uniformParameters({ target: 30, loadKg: 20 }))).toEqual(uniformParameters({ target: 30, loadKg: 20, loadEnabled: true }));
    expect(reactivateLoad(variableParameters({ rows: [[30, 10, 20], [30, 10, 0], [30, 10, 12.5]] }))).toEqual(
      variableParameters({ rows: [[30, 10, 20], [30, 10, 0], [30, 10, 12.5]], loadEnabled: true }),
    );
  });
});

describe("PRE5-1.1/AC7 — formatLoadKg (seul formateur de kg)", () => {
  it("séparateur décimal du français, sans zéro inutile", () => {
    expect(formatLoadKg(1.5)).toBe("1,5 kg");
    expect(formatLoadKg(20)).toBe("20 kg");
    expect(formatLoadKg(1.25)).toBe("1,25 kg");
    expect(formatLoadKg(0.25)).toBe("0,25 kg");
    expect(formatLoadKg(0)).toBe("0 kg");
  });
});

describe("PRE5-1.1/AC7 — parseLoadText", () => {
  it("accepte « , » et « . » ; retourne la valeur lue sans arrondi", () => {
    expect(parseLoadText("1,5")).toEqual({ kind: "value", kg: 1.5 });
    expect(parseLoadText("1.5")).toEqual({ kind: "value", kg: 1.5 });
    expect(parseLoadText("1,3")).toEqual({ kind: "value", kg: 1.3 });
    expect(parseLoadText("20")).toEqual({ kind: "value", kg: 20 });
    expect(parseLoadText(" 12,75 ")).toEqual({ kind: "value", kg: 12.75 });
    expect(parseLoadText(",5")).toEqual({ kind: "value", kg: 0.5 });
    expect(parseLoadText("3,")).toEqual({ kind: "value", kg: 3 });
    expect(parseLoadText("0")).toEqual({ kind: "value", kg: 0 });
  });

  it("champ vide → empty ; texte illisible ou négatif → invalid", () => {
    expect(parseLoadText("")).toEqual({ kind: "empty" });
    expect(parseLoadText("   ")).toEqual({ kind: "empty" });
    for (const text of ["-1", "-0,5", "abc", "1,2,3", "1.2.3", "1,,2", ",", ".", "1e3", "12 kg", "Infinity"]) {
      expect({ text, parsed: parseLoadText(text) }).toEqual({ text, parsed: { kind: "invalid" } });
    }
  });
});

describe("PRE5-1.1/AC7 — Δ48 : aucune différence par Mode ni par Condition d'arrêt", () => {
  const cases = [
    {
      name: "Répétitions × Identiques",
      without: uniformParameters({ mode: "REPETITIONS", count: 3, target: 12, pauseSeconds: 10, cadenceBeepIntervalSeconds: 2 }),
      withLoad: uniformParameters({ mode: "REPETITIONS", count: 3, target: 12, pauseSeconds: 10, cadenceBeepIntervalSeconds: 2, loadKg: 20, loadEnabled: true }),
    },
    {
      name: "Répétitions × Variables",
      without: variableParameters({ mode: "REPETITIONS", rows: [[12, 10], [10, 10], [8, 10]] }),
      withLoad: variableParameters({ mode: "REPETITIONS", rows: [[12, 10, 20], [10, 10, 12], [8, 10, 13]], loadEnabled: true }),
    },
    {
      name: "Cible À l'échec avec charge",
      without: uniformParameters({ mode: "REPETITIONS", count: 3, target: "FAILURE", pauseSeconds: 10 }),
      withLoad: uniformParameters({ mode: "REPETITIONS", count: 3, target: "FAILURE", pauseSeconds: 10, loadKg: 20, loadEnabled: true }),
    },
    {
      name: "Mode Durée",
      without: uniformParameters({ mode: "DURATION", count: 3, target: 30, pauseSeconds: 10 }),
      withLoad: uniformParameters({ mode: "DURATION", count: 3, target: 30, pauseSeconds: 10, loadKg: 20, loadEnabled: true }),
    },
  ];

  it.each(cases)("$name : mêmes calculs, même projection, même Condition d'arrêt, même validation, mêmes règles de charge", ({ without, withLoad }) => {
    expect(computeIntrinsicDuration(withLoad)).toEqual(computeIntrinsicDuration(without));
    expect(computeExercisePlanDuration(withLoad, 20)).toEqual(computeExercisePlanDuration(without, 20));
    expect(projectScalars(withLoad)).toEqual(projectScalars(without));
    expect(stopConditionOf(withLoad)).toBe(stopConditionOf(without));
    expect(validateForSave(withLoad, null).ok).toBe(validateForSave(without, null).ok);
    // Mêmes règles de charge quel que soit le Mode : la charge positive reste active, la réactivation restaure.
    expect(normalizeLoad(withLoad).loadEnabled).toBe(true);
    expect(reactivateLoad({ ...withLoad, loadEnabled: false })).toEqual(withLoad);
  });
});
