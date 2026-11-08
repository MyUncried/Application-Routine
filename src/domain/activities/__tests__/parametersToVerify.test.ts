import { describe, expect, it } from "@jest/globals";

import type { CatalogExecutionParameters, ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { splitResolvedParameters } from "@/domain/activities/Movement";
import {
  addedPhaseDefaults,
  decodePhasesToVerify,
  encodePhasesToVerify,
  fillEmptyPhaseDurations,
  mergePhasesToVerify,
  phasesToVerifyField,
  phasesToVerifyIn,
} from "@/domain/activities/parametersToVerify";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026, constat e (Hermann : « Ajouter une valeur par défaut
 * doit mettre à jour les exercices […] identifiés en orange, avec le texte « Paramètre à vérifier » » ;
 * « Champs vides seulement (Recommandé) »).
 */

function withPhases(durations: readonly number[]): ExecutionParameters {
  const base = durationParameters(30);
  return {
    ...base,
    series: {
      ...base.series,
      workPhases: durations.map((durationSeconds, index) => ({ id: index + 1, label: `P${index + 1}`, durationSeconds })),
    },
  } as ExecutionParameters;
}

const catalog = (durations: readonly number[]): CatalogExecutionParameters => splitResolvedParameters(withPhases(durations)).parameters;
const durationsOf = (parameters: CatalogExecutionParameters) =>
  parameters.series.phaseDurations.map((entry) => [entry.phaseId, entry.durationSeconds]);

describe("constat e — marque « à vérifier »", () => {
  it("codage : liste triée sans doublon, `null` si vide ; lecture stricte", () => {
    expect(encodePhasesToVerify([3, 1, 3])).toBe("[1,3]");
    expect(encodePhasesToVerify([])).toBeNull();
    expect(encodePhasesToVerify(undefined)).toBeNull();
    expect(decodePhasesToVerify(null)).toEqual([]);
    expect(decodePhasesToVerify("[2,1]")).toEqual([1, 2]);
    for (const malformed of ["oups", "{}", "[0]", "[1,1]", "[1.5]", '["1"]']) {
      expect(() => decodePhasesToVerify(malformed)).toThrow(/phases to verify/);
      expect(phasesToVerifyField(malformed)).toEqual({});
    }
    expect(phasesToVerifyField("[4]")).toEqual({ phasesToVerify: [4] });
    expect(phasesToVerifyField(null)).toEqual({});
    expect(mergePhasesToVerify([2], [1, 2])).toEqual([1, 2]);
  });

  it("valeurs par défaut ajoutées : nombre nouveau ou changé seulement ; retirée (`null`) ou non transmise : rien", () => {
    const stored = new Map<number, number | null>([
      [1, 3],
      [2, null],
      [3, 2],
      [4, 7],
    ]);
    expect(
      addedPhaseDefaults(stored, [
        { id: 1, durationSeconds: 5 },
        { id: 2, durationSeconds: 4 },
        { id: 3, durationSeconds: 2 },
        { id: 4, durationSeconds: null },
        { id: 5 },
        { id: 6, durationSeconds: 9 },
      ]),
    ).toEqual(
      new Map([
        [1, 5],
        [2, 4],
        [6, 9],
      ]),
    );
  });

  it("« Champs vides seulement » : une durée vide (`null` ou sans entrée) reçoit la valeur, jamais une durée renseignée ; hors structure : rien", () => {
    const result = fillEmptyPhaseDurations(
      catalog([6, 0, 0]),
      new Map([
        [1, 5],
        [2, 4],
        [4, 8],
        [9, 1],
      ]),
      [1, 2, 3, 4],
    );
    expect(result).not.toBeNull();
    expect(durationsOf(result!.parameters)).toEqual([
      [1, 6],
      [2, 4],
      [3, null],
      [4, 8],
    ]);
    expect(result!.filled).toEqual([2, 4]);
  });

  it("rien à remplir, ou motif hors bornes (Σ > 3535 s, D-430) : `null`, l'Exercice reste tel quel", () => {
    expect(fillEmptyPhaseDurations(catalog([6, 4]), new Map([[1, 5]]), [1, 2])).toBeNull();
    expect(
      fillEmptyPhaseDurations(
        catalog([0, 0, 2]),
        new Map([
          [1, 3000],
          [2, 600],
        ]),
        [1, 2, 3],
      ),
    ).toBeNull();
  });

  it("phases réellement à vérifier : présentes et renseignées seulement (une phase vidée est « à compléter »)", () => {
    expect(phasesToVerifyIn(withPhases([6, 0, 2]), [1, 2, 5])).toEqual([1]);
    expect(phasesToVerifyIn(withPhases([6, 4]), undefined)).toEqual([]);
  });
});
