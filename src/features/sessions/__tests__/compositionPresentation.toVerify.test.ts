import { describe, expect, it } from "@jest/globals";

import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  formatExerciseRowSummary,
  formatOccurrenceSummary,
  isIncompleteSummary,
  isToVerifySummary,
} from "@/features/sessions/compositionPresentation";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026, constat e : « avec le texte « Paramètre à vérifier » à
 * la place de « Paramètre à compléter ». S'il y a à la fois des paramètre à vérifier et à compléter,
 * la codification des paramètres à compléter est prioritaire. »
 */

function withPhases(durations: readonly number[]): ExecutionParameters {
  const base = durationParameters(30, 3, 10);
  return {
    ...base,
    series: {
      ...base.series,
      workPhases: durations.map((durationSeconds, index) => ({ id: index + 1, label: `P${index + 1}`, durationSeconds })),
    },
  } as ExecutionParameters;
}

describe("constat e — synthèse « Paramètre à vérifier »", () => {
  it("phase marquée et renseignée : « Paramètre à vérifier » (texte exact de Hermann), carte et Catalogue", () => {
    const facts = { executionParameters: withPhases([6, 4]), phasesToVerify: [2] };
    expect(formatOccurrenceSummary(facts)).toBe("Paramètre à vérifier");
    expect(formatExerciseRowSummary(facts)).toBe("Paramètre à vérifier");
    expect(isToVerifySummary(formatOccurrenceSummary(facts))).toBe(true);
    expect(isIncompleteSummary(formatOccurrenceSummary(facts))).toBe(false);
  });

  it("« à compléter » prioritaire : une durée manque encore → « Paramètres à compléter »", () => {
    const facts = { executionParameters: withPhases([0, 4]), phasesToVerify: [2] };
    expect(formatOccurrenceSummary(facts)).toBe("Paramètres à compléter");
    expect(formatExerciseRowSummary(facts)).toBe("Paramètres à compléter");
  });

  it("sans marque, marque vide ou sur une phase disparue : synthèse d'avant", () => {
    const parameters = withPhases([6, 4]);
    const before = formatOccurrenceSummary({ executionParameters: parameters });
    expect(isToVerifySummary(before)).toBe(false);
    expect(formatOccurrenceSummary({ executionParameters: parameters, phasesToVerify: [] })).toBe(before);
    expect(formatOccurrenceSummary({ executionParameters: parameters, phasesToVerify: [9] })).toBe(before);
  });
});
