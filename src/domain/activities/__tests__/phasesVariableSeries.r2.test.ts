/**
 * PRE-7 (R-2, D-446, complément de Hermann du 26/10/2026 ; PHC-20261026 ;
 * arbitrage Q1-Q11 du 26/10/2026) — compatibilité phases + séries variables :
 * le motif des phases est commun à toutes les séries, identiques comme
 * variables. Domaine (validation, normalisation, formes v5 Catalogue et
 * résolue, calculs) et Brouillon de Feuille (transitions sans perte).
 */

import { describe, expect, it } from "@jest/globals";

import {
  CATALOG_EXECUTION_PARAMETERS_VERSION,
  normalizeEffective,
  numberTarget,
  readCatalogExecutionParameters,
  readExecutionParameters,
  readResolvedExecutionParameters,
  RESOLVED_EXECUTION_PARAMETERS_VERSION,
  serializeCatalogExecutionParameters,
  serializeExecutionParameters,
  serializeResolvedExecutionParameters,
  validateForSave,
  type ExecutionParameters,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import { computeIntrinsicDuration, isWorkEstimable } from "@/domain/activities/executionCalculations";
import {
  effectiveParameters,
  openSheetDraft,
  requestedParameters,
  setLoadValue,
  setRowPause,
  setSeriesCount,
  setVariable,
  setWorkPhaseDuration,
  setWorkPhasesEnabled,
  sheetDraftResult,
} from "@/domain/activities/ExecutionParametersDraft";
import { resolveCatalogParameters, splitResolvedParameters } from "@/domain/activities/Movement";
import { uniformParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";

/** Motif [5 s, 2 s] (durée 7 s). */
const pattern: readonly WorkPhase[] = [
  { id: 1, label: "Descente", durationSeconds: 5 },
  { id: 2, label: "Montée", durationSeconds: 2 },
];
const phaseLabel = (position: number) => `Phase ${position}`;

/** Durée : 30 s / 45 s / à l'échec ; Pauses 10, 20, 0 ; charges 20, 15, 0 kg. */
const durationVariable = (): ExecutionParameters =>
  variableParameters({ mode: "DURATION", rows: [[30, 10, 20], [45, 20, 15], ["FAILURE", 0, 0]], loadEnabled: true, workPhases: [...pattern] });
/** Répétitions : 10 / 12 / à l'échec, Pauses 0 (calculs). */
const repetitionVariable = (): ExecutionParameters =>
  variableParameters({ mode: "REPETITIONS", rows: [[10, 0], [12, 0], ["FAILURE", 0]], workPhases: [...pattern] });

describe("PRE-7 R-2 — domaine : phases et séries variables (D-446, complément du 26/10/2026)", () => {
  it("variables Durée 30 s / 45 s / échec et Répétitions 10 / 12 / échec avec [5, 2] : valides", () => {
    for (const parameters of [durationVariable(), repetitionVariable()]) {
      const result = validateForSave(parameters, null);
      expect(result.ok).toBe(true);
      expect(validateForSave(parameters, "STORAGE").ok).toBe(true);
      if (result.ok) {
        expect(result.value.series.workPhases).toEqual(pattern);
      }
    }
  });

  it("une durée de phase manquante en variables est refusée par phase, la phase conservée (D-438)", () => {
    const missing = variableParameters({
      mode: "DURATION",
      rows: [[30, 10], [45, 10]],
      workPhases: [pattern[0]!, { ...pattern[1]!, durationSeconds: 0 }],
    });
    const result = validateForSave(missing, null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toEqual([expect.objectContaining({ code: "REQUIRED", field: "workPhases", phaseId: 2 })]);
    }
  });

  it("N = 1 en variable demandé : la normalisation (uniforme, première ligne) conserve le motif", () => {
    const single = variableParameters({ mode: "DURATION", rows: [[30, 10, 20]], loadEnabled: true, workPhases: [...pattern] });
    expect(normalizeEffective(single).series).toEqual({
      kind: "UNIFORM",
      count: 1,
      target: numberTarget(30),
      pauseSeconds: 10,
      loadKg: 20,
      workPhases: pattern,
    });
  });

  it("aller-retour canonique v5, résolu v5 et Catalogue v5 pour des variables à phases ; charges et pauses variables conservées", () => {
    for (const parameters of [durationVariable(), repetitionVariable()]) {
      const canonical = serializeExecutionParameters(parameters);
      expect(JSON.parse(canonical).version).toBe(5);
      expect(readExecutionParameters(canonical)).toEqual(parameters);

      const resolved = serializeResolvedExecutionParameters(parameters);
      expect(JSON.parse(resolved).version).toBe(RESOLVED_EXECUTION_PARAMETERS_VERSION);
      expect(readResolvedExecutionParameters(resolved)).toEqual(parameters);

      const split = splitResolvedParameters(parameters);
      expect(split.phases).toEqual([
        { id: 1, label: "Descente" },
        { id: 2, label: "Montée" },
      ]);
      const catalog = serializeCatalogExecutionParameters(split.parameters);
      expect(JSON.parse(catalog)).toEqual(
        expect.objectContaining({
          version: CATALOG_EXECUTION_PARAMETERS_VERSION,
          series: expect.objectContaining({
            kind: "VARIABLE",
            phaseDurations: [
              { phaseId: 1, durationSeconds: 5 },
              { phaseId: 2, durationSeconds: 2 },
            ],
          }),
        }),
      );
      expect(catalog).not.toContain("label");
      const relu = readCatalogExecutionParameters(catalog);
      expect(relu).toEqual(split.parameters);
      expect(resolveCatalogParameters(split.phases, relu)).toEqual({ status: "EXECUTABLE", parameters });
    }
    const { series } = durationVariable();
    const rows = series.kind === "VARIABLE" ? series.rows : [];
    expect(rows.map((row) => [row.pauseSeconds, row.loadKg])).toEqual([
      [10, 20],
      [20, 15],
      [0, 0],
    ]);
  });

  it("résolution Catalogue (PRE-4 AC8) : ligne variable à renseigner et motif complet → EXECUTABLE ; durée null → INCOMPLETE avec missingPhaseIds", () => {
    const withUnsetRow = variableParameters({ mode: "DURATION", rows: [[30, 10], ["UNSET", 10]], workPhases: [...pattern] });
    const split = splitResolvedParameters(withUnsetRow);
    expect(resolveCatalogParameters(split.phases, split.parameters)).toEqual({ status: "EXECUTABLE", parameters: withUnsetRow });
    const complete = splitResolvedParameters(durationVariable());
    const incomplete = {
      ...complete.parameters,
      series: { ...complete.parameters.series, phaseDurations: [{ phaseId: 1, durationSeconds: 5 }, { phaseId: 2, durationSeconds: null }] },
    };
    const resolution = resolveCatalogParameters(complete.phases, incomplete);
    expect(resolution.status).toBe("INCOMPLETE");
    expect(resolution.status === "INCOMPLETE" && resolution.missingPhaseIds).toEqual([2]);
    expect(resolution.parameters.series.kind).toBe("VARIABLE");
  });

  it("calculs (D-446 §4) : 3 × 10 rép. avec [5, 2] = 210 s « estimated », prioritaire sur la cadence ; variables 10 / 12 / échec = « lowerBound » 154 s", () => {
    const uniform = uniformParameters({ mode: "REPETITIONS", count: 3, target: 10, workPhases: [...pattern] });
    expect(isWorkEstimable(uniform)).toBe(true);
    expect(computeIntrinsicDuration(uniform)).toEqual(expect.objectContaining({ kind: "estimated", seconds: 210 }));
    expect(computeIntrinsicDuration({ ...uniform, cadenceBeepIntervalSeconds: 4 })).toEqual(
      expect.objectContaining({ kind: "estimated", seconds: 210 }),
    );
    const variable = repetitionVariable();
    expect(isWorkEstimable(variable)).toBe(true);
    expect(computeIntrinsicDuration(variable)).toEqual(expect.objectContaining({ kind: "lowerBound", seconds: 154 }));
    // Sans motif ni cadence : travail non estimable, durée omise.
    const without = variableParameters({ mode: "REPETITIONS", rows: [[10, 0], [12, 0]] });
    expect(isWorkEstimable(without)).toBe(false);
    expect(computeIntrinsicDuration(without).kind).toBe("omitted");
    // Motif incomplet : non estimable par le motif.
    expect(isWorkEstimable({ ...without, series: { ...without.series, workPhases: [{ ...pattern[0]!, durationSeconds: 0 }] } })).toBe(false);
    // Durée : le travail reste la cible, indépendant du motif (30 + 45 + Pauses 10 + 20).
    const duration = variableParameters({ mode: "DURATION", rows: [[30, 10], [45, 20]], workPhases: [...pattern] });
    expect(computeIntrinsicDuration(duration)).toEqual(expect.objectContaining({ kind: "exact", seconds: 105 }));
  });
});

describe("PRE-7 R-2 — Brouillon : phases et séries variables (D-446, complément du 26/10/2026)", () => {
  it("ouverture d'une Feuille variable à phases : motif lu, ✓ sans modification inchangé (Durée et Répétitions)", () => {
    for (const parent of [durationVariable(), repetitionVariable()]) {
      const draft = openSheetDraft(parent);
      expect(draft.variable).toBe(true);
      expect(draft.workPhases).toEqual(pattern);
      expect(sheetDraftResult(draft, phaseLabel, parent)).toEqual({ ok: true, value: parent });
    }
  });

  it("Identiques ↔ Variables : ni phase ni durée perdue, dans les deux sens ; ✓ valide", () => {
    const uniform = uniformParameters({ mode: "DURATION", count: 3, target: 30, pauseSeconds: 15, workPhases: [...pattern] });
    const opened = openSheetDraft(uniform);
    const variables = setVariable(opened, true);
    expect(variables.variable).toBe(true);
    expect(variables.workPhases).toEqual(opened.workPhases);
    const asVariable = sheetDraftResult(variables, phaseLabel);
    expect(asVariable.ok).toBe(true);
    if (asVariable.ok) {
      expect(asVariable.value.series.kind).toBe("VARIABLE");
      expect(asVariable.value.series.workPhases).toEqual(pattern);
    }
    const back = setVariable(variables, false);
    expect(back.variable).toBe(false);
    expect(back.workPhases).toEqual(opened.workPhases);
    const asUniform = sheetDraftResult(back, phaseLabel);
    expect(asUniform.ok && asUniform.value).toEqual(uniform);
    // Depuis des variables à phases : identiques puis retour, motif et lignes intacts.
    const fromVariable = openSheetDraft(durationVariable());
    const roundTrip = setVariable(setVariable(fromVariable, false), true);
    expect(roundTrip.workPhases).toEqual(pattern);
    expect(roundTrip.rows).toEqual(fromVariable.rows);
  });

  it("Avec sur des variables N ≥ 2 : deux phases à renseigner (Q5), lignes intactes ; ✓ une fois les durées saisies", () => {
    const parent = variableParameters({ mode: "REPETITIONS", rows: [[10, 10], [12, 10], ["FAILURE", 0]] });
    const opened = openSheetDraft(parent);
    const phased = setWorkPhasesEnabled(opened, true);
    expect(phased.workPhases.map((phase) => phase.durationSeconds)).toEqual([null, null]);
    expect(phased.rows).toEqual(opened.rows);
    expect(sheetDraftResult(phased, phaseLabel).ok).toBe(false);
    const [first, second] = phased.workPhases.map((phase) => phase.id);
    const filled = setWorkPhaseDuration(setWorkPhaseDuration(phased, first!, 5), second!, 2);
    const result = sheetDraftResult(filled, phaseLabel);
    expect(result.ok).toBe(true);
    if (result.ok && result.value.series.kind === "VARIABLE") {
      expect(result.value.series.rows).toEqual(parent.series.kind === "VARIABLE" ? parent.series.rows : []);
      expect(result.value.series.workPhases).toEqual([
        { id: first, label: "Phase 1", durationSeconds: 5 },
        { id: second, label: "Phase 2", durationSeconds: 2 },
      ]);
    }
  });

  it("charges et pauses variables modifiées avec des phases : conservées au ✓, motif inchangé", () => {
    const draft = openSheetDraft(durationVariable());
    const edited = setLoadValue(setRowPause(draft, 1, 25), { rowId: draft.rowIds[2]! }, 7.5);
    const result = sheetDraftResult(edited, phaseLabel);
    expect(result.ok).toBe(true);
    if (result.ok && result.value.series.kind === "VARIABLE") {
      expect(result.value.series.rows.map((row) => [row.pauseSeconds, row.loadKg])).toEqual([
        [10, 20],
        [25, 15],
        [0, 7.5],
      ]);
      expect(result.value.series.workPhases).toEqual(pattern);
    }
  });

  it("N = 1 en variable demandé : phases conservées ; retour à N = 3 : motif et lignes restitués", () => {
    const draft = openSheetDraft(durationVariable());
    const single = setSeriesCount(draft, 1);
    expect(single.workPhases).toEqual(pattern);
    expect(requestedParameters(single).series.workPhases).toEqual(pattern);
    expect(effectiveParameters(single).series).toEqual(expect.objectContaining({ kind: "UNIFORM", count: 1, workPhases: pattern }));
    const regrown = setSeriesCount(single, 3);
    expect(regrown.workPhases).toEqual(pattern);
    expect(regrown.rows).toEqual(draft.rows);
  });
});
