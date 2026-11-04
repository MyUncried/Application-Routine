import { describe, expect, it } from "@jest/globals";

import { createEmptyExecutionParameters, numberTarget } from "@/domain/activities/ExecutionParameters";
import { formatOccurrenceSummary } from "@/features/sessions/compositionPresentation";

/** Contre-recette n° 3 ter du 03/11/2026 (f3-deathby, Hermann : « l'information du chrono devrait être 1 / +1 rép. »). */
describe("formatOccurrenceSummary — Death by", () => {
  const base = createEmptyExecutionParameters({ countdownSeconds: 0, endSeconds: 0 });
  const parameters = {
    ...base,
    mode: "REPETITIONS" as const,
    series: { kind: "UNIFORM" as const, count: 1, target: numberTarget(1), pauseSeconds: 0, loadKg: 0, workPhases: base.series.workPhases },
  };

  it("départ / incrément : « 1 / +1 rép. »", () => {
    expect(formatOccurrenceSummary({ executionParameters: parameters, format: { key: "DEATH_BY", settings: { incrementPerRound: 1, intervalSeconds: 60 } } })).toBe("1 / +1 rép.");
  });

  it("incrément de 2 : « 1 / +2 rép. » ; sans Format : synthèse des séries", () => {
    expect(formatOccurrenceSummary({ executionParameters: parameters, format: { key: "DEATH_BY", settings: { incrementPerRound: 2 } } })).toBe("1 / +2 rép.");
    expect(formatOccurrenceSummary({ executionParameters: parameters })).toBe("1 rép.");
  });
});
