import { describe, expect, it } from "@jest/globals";

import {
  CATALOG_EXECUTION_PARAMETERS_VERSION,
  ExecutionParametersDataError,
  numberTarget,
  phaseDurationsProblem,
  readCatalogExecutionParameters,
  readExecutionParameters,
  serializeCatalogExecutionParameters,
  serializeExecutionParameters,
  unsetTarget,
  type CatalogExecutionParameters,
  type PhaseDuration,
} from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";

/**
 * PRE-7 (A1.1, D-437, D-438, MFN-02) — forme Catalogue v4 des paramètres
 * d'exécution : couples `{ phaseId, durationSeconds | null }` sans libellé,
 * sérialiseur et lecteur stricts (ch09 : « une version inconnue ne doit jamais
 * être rabattue silencieusement sur une durée scalaire »).
 */

function catalog(phaseDurations: readonly PhaseDuration[], overrides: Partial<CatalogExecutionParameters> = {}): CatalogExecutionParameters {
  const known = phaseDurations.map((entry) => entry.durationSeconds);
  const target = known.some((value) => value === null)
    ? unsetTarget()
    : numberTarget(known.reduce<number>((sum, value) => sum + (value ?? 0), 0));
  return {
    version: CATALOG_EXECUTION_PARAMETERS_VERSION,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target, pauseSeconds: 15, loadKg: 2.5, phaseDurations },
    sideMode: "RIGHT_LEFT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 8,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: true,
    ...overrides,
  };
}

const complete = catalog([
  { phaseId: 1, durationSeconds: 6 },
  { phaseId: 2, durationSeconds: 3 },
]);
const incomplete = catalog([
  { phaseId: 1, durationSeconds: 6 },
  { phaseId: 2, durationSeconds: 3 },
  { phaseId: 3, durationSeconds: null },
]);

/** JSON d'un Catalogue complet, modifiable clé par clé pour les cas refusés. */
function rawComplete(): Record<string, unknown> {
  return JSON.parse(serializeCatalogExecutionParameters(complete)) as Record<string, unknown>;
}

function withSeries(patch: Record<string, unknown>, root: Record<string, unknown> = {}): string {
  const raw = rawComplete();
  return JSON.stringify({ ...raw, ...root, series: { ...(raw.series as Record<string, unknown>), ...patch } });
}

describe("PRE7-A1.1 — sérialiseur v4 (MFN-02)", () => {
  it("forme exacte : clés et ordre de la v3, phaseDurations à la place de workPhases, sans libellé", () => {
    expect(serializeCatalogExecutionParameters(complete)).toBe(
      '{"version":4,"mode":"DURATION","series":{"kind":"UNIFORM","count":3,"target":{"kind":"NUMBER","value":9},"pauseSeconds":15,"loadKg":2.5,"phaseDurations":[{"phaseId":1,"durationSeconds":6},{"phaseId":2,"durationSeconds":3}]},"sideMode":"RIGHT_LEFT","sideOrder":"BY_SERIES","sideRecoverySeconds":8,"cadenceBeepIntervalSeconds":0,"countdownSeconds":10,"endSeconds":5,"loadEnabled":true}',
    );
    expect(serializeCatalogExecutionParameters(complete)).not.toContain("label");
  });

  it("une durée non renseignée s'écrit null (seule absence) ; séries variables : lignes de la v3", () => {
    expect(serializeCatalogExecutionParameters(incomplete)).toContain('"target":{"kind":"UNSET"}');
    expect(serializeCatalogExecutionParameters(incomplete)).toContain('{"phaseId":3,"durationSeconds":null}');
    const variable: CatalogExecutionParameters = {
      ...complete,
      series: { kind: "VARIABLE", rows: [{ target: numberTarget(30), pauseSeconds: 10, loadKg: 1 }, { target: { kind: "FAILURE" }, pauseSeconds: 0, loadKg: 0 }] },
    };
    expect(serializeCatalogExecutionParameters(variable)).toContain(
      '"series":{"kind":"VARIABLE","rows":[{"target":{"kind":"NUMBER","value":30},"pauseSeconds":10,"loadKg":1},{"target":{"kind":"FAILURE"},"pauseSeconds":0,"loadKg":0}]}',
    );
    expect(readCatalogExecutionParameters(serializeCatalogExecutionParameters(variable))).toEqual(variable);
  });

  it("refuse d'écrire une durée 0 ou une identité dupliquée ; PRE-7 (D-446) : une Cible indépendante de Σ s'écrit", () => {
    const zero = catalog([{ phaseId: 1, durationSeconds: 0 }, { phaseId: 2, durationSeconds: 3 }]);
    expect(() => serializeCatalogExecutionParameters(zero)).toThrow();
    const duplicated = catalog([{ phaseId: 1, durationSeconds: 6 }, { phaseId: 1, durationSeconds: 3 }]);
    expect(() => serializeCatalogExecutionParameters(duplicated)).toThrow();
    // D-446 : la Cible n'est plus liée aux phases (une liste incomplète garde une Cible chiffrée).
    const series = incomplete.series as Extract<CatalogExecutionParameters["series"], { kind: "UNIFORM" }>;
    const chiffre = { ...incomplete, series: { ...series, target: numberTarget(9) } };
    expect(readCatalogExecutionParameters(serializeCatalogExecutionParameters(chiffre))).toEqual(chiffre);
  });
});

describe("PRE7-A1.1 — lecteur v4 strict (MFN-02, ch09)", () => {
  it("aller-retour exact, complet et incomplet ; sans phases", () => {
    expect(readCatalogExecutionParameters(serializeCatalogExecutionParameters(complete))).toEqual(complete);
    expect(readCatalogExecutionParameters(serializeCatalogExecutionParameters(incomplete))).toEqual(incomplete);
    const none = catalog([], { series: { kind: "UNIFORM", count: 2, target: numberTarget(30), pauseSeconds: 0, loadKg: 0, phaseDurations: [] } });
    expect(readCatalogExecutionParameters(serializeCatalogExecutionParameters(none))).toEqual(none);
  });

  it("JSON v3, v5, NULL, absent ou corrompu → ExecutionParametersDataError, jamais de repli", () => {
    const refused: readonly (string | null | undefined)[] = [
      serializeExecutionParameters(durationParameters(30, 3, 10)),
      JSON.stringify({ ...rawComplete(), version: 5 }),
      JSON.stringify({ ...rawComplete(), version: "4" }),
      null,
      undefined,
      "{",
      "[]",
    ];
    for (const json of refused) {
      expect(() => readCatalogExecutionParameters(json)).toThrow(ExecutionParametersDataError);
    }
    // Le lecteur v3 ne lit pas la v4 non plus (aucune lecture croisée).
    expect(() => readExecutionParameters(serializeCatalogExecutionParameters(complete))).toThrow(ExecutionParametersDataError);
  });

  it("durée 0, phase dupliquée, durée non entière, Cible incohérente, clé absente → ExecutionParametersDataError", () => {
    const refused: readonly [string, string][] = [
      ["durée 0", withSeries({ phaseDurations: [{ phaseId: 1, durationSeconds: 0 }, { phaseId: 2, durationSeconds: 9 }] })],
      ["phase dupliquée", withSeries({ phaseDurations: [{ phaseId: 1, durationSeconds: 6 }, { phaseId: 1, durationSeconds: 3 }] })],
      ["identité 0", withSeries({ phaseDurations: [{ phaseId: 0, durationSeconds: 6 }, { phaseId: 1, durationSeconds: 3 }] })],
      ["durée non entière", withSeries({ phaseDurations: [{ phaseId: 1, durationSeconds: 4.5 }, { phaseId: 2, durationSeconds: 4.5 }] })],
      ["durée absente", withSeries({ phaseDurations: [{ phaseId: 1 }, { phaseId: 2, durationSeconds: 3 }] })],
      // PRE-7 (D-446) : « somme ≠ Cible », « complète à renseigner », « incomplète chiffrée » et
      // « Mode Répétitions » ne sont plus des écarts (test « D-446 » ci-dessous).
      ["sept phases", withSeries({ phaseDurations: [1, 2, 3, 4, 5, 6, 7].map((phaseId) => ({ phaseId, durationSeconds: 1 })), target: { kind: "NUMBER", value: 7 } })],
      ["somme de 3 536 s", withSeries({ phaseDurations: [{ phaseId: 1, durationSeconds: 3000 }, { phaseId: 2, durationSeconds: 536 }], target: { kind: "NUMBER", value: 3536 } })],
      ["phaseDurations absent", withSeries({ phaseDurations: undefined })],
      ["workPhases v3 à la place", withSeries({ phaseDurations: undefined, workPhases: [{ id: 1, label: "a", durationSeconds: 9 }] })],
      ["loadKg absent", withSeries({ loadKg: undefined })],
      ["loadEnabled absent", withSeries({}, { loadEnabled: undefined })],
      ["variables sans ligne", JSON.stringify({ ...rawComplete(), series: { kind: "VARIABLE", rows: [] } })],
      [
        "ligne variable sans loadKg",
        JSON.stringify({
          ...rawComplete(),
          series: { kind: "VARIABLE", rows: [{ target: { kind: "NUMBER", value: 30 }, pauseSeconds: 10, loadKg: 0 }, { target: { kind: "NUMBER", value: 30 }, pauseSeconds: 10 }] },
        }),
      ],
      ["genre de séries inconnu", withSeries({ kind: "OTHER" })],
    ];
    for (const [label, json] of refused) {
      let error: unknown = null;
      try {
        readCatalogExecutionParameters(json);
      } catch (caught) {
        error = caught;
      }
      expect({ label, dataError: error instanceof ExecutionParametersDataError }).toEqual({ label, dataError: true });
    }
  });

  it("phaseDurationsProblem : liste vide toujours valide ; PRE-7 (D-446) : Cible indépendante des phases, tout Mode ; Σ bornée à 1..3535", () => {
    expect(phaseDurationsProblem(numberTarget(12), [])).toBeNull();
    expect(phaseDurationsProblem(unsetTarget(), [{ phaseId: 1, durationSeconds: null }])).toBeNull();
    expect(phaseDurationsProblem(numberTarget(5), [{ phaseId: 1, durationSeconds: 5 }])).toBeNull();
    // D-446 : une Cible chiffrée avec une durée manquante, une Cible à renseigner avec des durées
    // complètes, une Cible ≠ Σ, le Mode Répétitions et À l'échec sont admis.
    expect(phaseDurationsProblem(numberTarget(5), [{ phaseId: 1, durationSeconds: null }])).toBeNull();
    expect(phaseDurationsProblem(unsetTarget(), [{ phaseId: 1, durationSeconds: 5 }])).toBeNull();
    expect(phaseDurationsProblem(numberTarget(120), [{ phaseId: 1, durationSeconds: 5 }, { phaseId: 2, durationSeconds: 2 }])).toBeNull();
    expect(phaseDurationsProblem(numberTarget(10), [{ phaseId: 1, durationSeconds: 5 }, { phaseId: 2, durationSeconds: 2 }])).toBeNull();
    expect(phaseDurationsProblem({ kind: "FAILURE" }, [{ phaseId: 1, durationSeconds: 5 }, { phaseId: 2, durationSeconds: 2 }])).toBeNull();
    // Σ (durée du motif) reste bornée ; la Cible reste un objet.
    expect(phaseDurationsProblem(numberTarget(10), [{ phaseId: 1, durationSeconds: 3000 }, { phaseId: 2, durationSeconds: 536 }])).not.toBeNull();
    expect(phaseDurationsProblem(null, [{ phaseId: 1, durationSeconds: 5 }])).not.toBeNull();
  });

  it("PRE-7 (D-446) — aller-retour v4 identique : Répétitions et à l'échec avec phases, Cible ≠ Σ ; donnée antérieure (Cible = Σ) inchangée", () => {
    const series = complete.series as Extract<CatalogExecutionParameters["series"], { kind: "UNIFORM" }>;
    const cases: readonly CatalogExecutionParameters[] = [
      complete,
      { ...complete, series: { ...series, target: numberTarget(120) } },
      { ...complete, series: { ...series, target: { kind: "FAILURE" } } },
      { ...complete, mode: "REPETITIONS", series: { ...series, target: numberTarget(10) } },
      { ...complete, mode: "REPETITIONS", series: { ...series, target: { kind: "FAILURE" } } },
    ];
    for (const parameters of cases) {
      expect(readCatalogExecutionParameters(serializeCatalogExecutionParameters(parameters))).toEqual(parameters);
    }
  });
});
