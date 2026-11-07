import { describe, expect, it } from "@jest/globals";

import { createEmptyExecutionParameters, numberTarget } from "@/domain/activities/ExecutionParameters";
import { formatOccurrenceSummary } from "@/features/sessions/compositionPresentation";

describe("formatOccurrenceSummary — exercices à incrément", () => {
  const base = createEmptyExecutionParameters({ countdownSeconds: 0, endSeconds: 0 });
  const parameters = {
    ...base,
    mode: "REPETITIONS" as const,
    series: { kind: "UNIFORM" as const, count: 1, target: numberTarget(1), pauseSeconds: 0, loadKg: 0, workPhases: base.series.workPhases },
  };

  it("affiche le départ et le pas du Death by selon la fenêtre effective", () => {
    const format = { key: "DEATH_BY" as const, settings: { incrementPerRound: 1 } };
    expect(formatOccurrenceSummary({ executionParameters: parameters, format })).toBe("1 rép. +1/min");
    expect(formatOccurrenceSummary({ executionParameters: parameters, format }, 30)).toBe("1 rép. +1/30 s");
    const local = { ...format, settings: { incrementPerRound: 2, intervalSeconds: 60 } };
    expect(formatOccurrenceSummary({ executionParameters: parameters, format: local }, 30)).toBe("1 rép. +2/min");
  });

  it("affiche le pas signé de l’AMRAP et omet un pas nul", () => {
    const executionParameters = { ...parameters, series: { ...parameters.series, target: numberTarget(10) } };
    const summary = (incrementPerRound: number) => formatOccurrenceSummary({
      executionParameters, format: { key: "AMRAP", settings: { incrementPerRound } },
    });
    expect(summary(2)).toBe("10 rép. +2/tour");
    expect(summary(-2)).toBe("10 rép. −2/tour");
    expect(summary(0)).toBe("10 rép.");
    expect(formatOccurrenceSummary({
      executionParameters: { ...executionParameters, mode: "DURATION" },
      format: { key: "AMRAP", settings: { incrementPerRound: 2 } },
    })).toBe("10 s +2 s/tour");
  });

  it("conserve les valeurs des séries variables saisies, même régulièrement espacées", () => {
    const rows = [10, 12, 14].map(value => ({ target: numberTarget(value), pauseSeconds: 0, loadKg: 0 }));
    expect(formatOccurrenceSummary({ executionParameters: {
      ...parameters, series: { kind: "VARIABLE", rows, workPhases: [] },
    } })).toBe("10 · 12 · 14 rép.");
  });
});
