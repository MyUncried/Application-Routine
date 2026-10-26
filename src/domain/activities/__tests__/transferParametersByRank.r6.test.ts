import { describe, expect, it } from "@jest/globals";

import type { WorkPhase } from "@/domain/activities/ExecutionParameters";
import { hasMissingPhaseDuration } from "@/domain/activities/ExecutionParameters";
import { transferParametersByRank, type MovementPhase } from "@/domain/activities/Movement";
import { uniformParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";

/**
 * PRE-7 story R-6 (D-445 C09, v7 §4 l.59, MFN-09 l.418 ; ch07 l.936 annoté par PHC-20261026) —
 * transfert des paramètres PAR RANG lors d'un changement de mouvement ou de niveau : matrice
 * sans→sans, sans→phases, phases→sans, phases→phases, jamais par égalité d'identifiants de phase
 * entre mouvements ; tout le reste des paramètres conservé.
 */

const sourcePhases = (...durations: number[]): WorkPhase[] =>
  durations.map((durationSeconds, index) => ({ id: index + 1, label: `Source ${index + 1}`, durationSeconds }));

/** Structure du mouvement choisi : identités volontairement différentes de celles de la source. */
const targetStructure = (...labels: string[]): MovementPhase[] => labels.map((label, index) => ({ id: 10 + index, label }));

const base = (workPhases: readonly WorkPhase[] = []) =>
  uniformParameters({
    mode: "DURATION",
    count: 3,
    target: 45,
    pauseSeconds: 15,
    loadKg: 12,
    loadEnabled: true,
    sideMode: "RIGHT_LEFT",
    sideRecoverySeconds: 8,
    cadenceBeepIntervalSeconds: 2,
    countdownSeconds: 5,
    endSeconds: 3,
    workPhases,
  });

describe("PRE-7 R-6 — transferParametersByRank", () => {
  it("sans → sans : paramètres repris à l'identique, cible comprise", () => {
    const parameters = base();
    expect(transferParametersByRank(parameters, [])).toEqual(parameters);
  });

  it("sans → phases : phases du mouvement choisi, durées vides (à compléter) ; cible conservée, jamais recopiée en durée", () => {
    const result = transferParametersByRank(base(), targetStructure("Montée", "Descente"));
    expect(result.series.workPhases).toEqual([
      { id: 10, label: "Montée", durationSeconds: 0 },
      { id: 11, label: "Descente", durationSeconds: 0 },
    ]);
    expect(result.series).toMatchObject({ kind: "UNIFORM", count: 3, target: { kind: "NUMBER", value: 45 } });
    expect(hasMissingPhaseDuration(result)).toBe(true);
  });

  it("phases → sans : phases retirées, cible de série conservée (jamais remplacée par la somme, PHC)", () => {
    const result = transferParametersByRank(base(sourcePhases(5, 2)), []);
    expect(result.series.workPhases).toEqual([]);
    expect(result.series).toMatchObject({ target: { kind: "NUMBER", value: 45 } });
  });

  it("phases → phases, moins de phases : rangs communs repris, surplus source abandonné", () => {
    const result = transferParametersByRank(base(sourcePhases(5, 2, 3)), targetStructure("Montée", "Descente"));
    expect(result.series.workPhases).toEqual([
      { id: 10, label: "Montée", durationSeconds: 5 },
      { id: 11, label: "Descente", durationSeconds: 2 },
    ]);
    expect(hasMissingPhaseDuration(result)).toBe(false);
  });

  it("phases → phases, plus de phases : rangs communs repris, surplus cible à compléter", () => {
    const result = transferParametersByRank(base(sourcePhases(5, 2)), targetStructure("Montée", "Maintien", "Descente"));
    expect(result.series.workPhases.map((phase) => phase.durationSeconds)).toEqual([5, 2, 0]);
    expect(result.series.workPhases.map((phase) => phase.label)).toEqual(["Montée", "Maintien", "Descente"]);
  });

  it("par RANG, jamais par identifiant : une phase de même identité à un autre rang ne garde pas sa durée", () => {
    const source: WorkPhase[] = [
      { id: 2, label: "A", durationSeconds: 7 },
      { id: 1, label: "B", durationSeconds: 4 },
    ];
    const result = transferParametersByRank(base(source), [
      { id: 1, label: "X" },
      { id: 2, label: "Y" },
    ]);
    expect(result.series.workPhases).toEqual([
      { id: 1, label: "X", durationSeconds: 7 },
      { id: 2, label: "Y", durationSeconds: 4 },
    ]);
  });

  it("mode, séries, pauses, charges, côtés, cadence, Compte à rebours et Fin conservés ; séries variables comprises (D-446)", () => {
    const parameters = base(sourcePhases(5, 2));
    const result = transferParametersByRank(parameters, targetStructure("Montée"));
    expect({ ...result, series: { ...result.series, workPhases: [] } }).toEqual({
      ...parameters,
      series: { ...parameters.series, workPhases: [] },
    });

    const variable = variableParameters({
      mode: "REPETITIONS",
      rows: [
        [10, 30, 20],
        [12, 30, 20],
        ["FAILURE", 0, 15],
      ],
      workPhases: sourcePhases(5, 2),
    });
    const transferred = transferParametersByRank(variable, targetStructure("Montée", "Pause", "Descente"));
    expect(transferred.series.kind).toBe("VARIABLE");
    expect(transferred.series.kind === "VARIABLE" ? transferred.series.rows : null).toEqual(
      variable.series.kind === "VARIABLE" ? variable.series.rows : null,
    );
    expect(transferred.mode).toBe("REPETITIONS");
    expect(transferred.series.workPhases.map((phase) => phase.durationSeconds)).toEqual([5, 2, 0]);
  });

  it("fonction pure : l'entrée n'est pas modifiée", () => {
    const parameters = base(sourcePhases(5, 2));
    const before = JSON.stringify(parameters);
    transferParametersByRank(parameters, targetStructure("Montée"));
    expect(JSON.stringify(parameters)).toBe(before);
  });
});
