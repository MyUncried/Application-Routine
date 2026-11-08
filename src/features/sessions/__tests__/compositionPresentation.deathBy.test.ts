import { describe, expect, it } from "@jest/globals";

import { createEmptyExecutionParameters, failureTarget, numberTarget, type SeriesTarget } from "@/domain/activities/ExecutionParameters";
import type { ElementFormat } from "@/domain/sessions/formats/elementFormat";
import { formatOccurrencePrescription, formatOccurrenceSummary } from "@/features/sessions/compositionPresentation";
import { strings } from "@/shared/i18n";

/**
 * Demande de Hermann du 08/11/2026 (carte « DSF / Cards / Exercice — Composition », D-511) : prescription de la carte
 * d'exercice — nombre de séries et cible uniquement ; départ et incrément avec son unité pour un exercice à incrément ;
 * durées au format `formatPrimeDuration` (« Partout veut bien dire partout »). [Death by « 1 / +1 rép. » (contre-recette
 * n° 3 ter du 03/11/2026) — remplacé le 08/11/2026.]
 */
const base = createEmptyExecutionParameters({ countdownSeconds: 0, endSeconds: 0 });

function uniform(mode: "REPETITIONS" | "DURATION", count: number, target: SeriesTarget) {
  return { ...base, mode, series: { kind: "UNIFORM" as const, count, target, pauseSeconds: 0, loadKg: 0, workPhases: base.series.workPhases } };
}

function variable(values: readonly number[]) {
  return {
    ...base,
    mode: "REPETITIONS" as const,
    series: {
      kind: "VARIABLE" as const,
      rows: values.map((value) => ({ target: numberTarget(value), pauseSeconds: 0, loadKg: 0 })),
      workPhases: base.series.workPhases,
    },
  };
}

const prescription = (executionParameters: ReturnType<typeof uniform> | ReturnType<typeof variable>, format?: ElementFormat, carrierIntervalSeconds?: number) =>
  formatOccurrencePrescription({ executionParameters, format: format ?? null }, carrierIntervalSeconds === undefined ? {} : { carrierIntervalSeconds });

describe("formatOccurrencePrescription — carte d'exercice de la Composition (08/11/2026)", () => {
  it("séries identiques : « 6 × 10 rép. »", () => {
    expect(prescription(uniform("REPETITIONS", 6, numberTarget(10)))).toBe("6 × 10 rép.");
  });

  it("séries variables explicitement saisies : « 10 · 12 · 14 rép. »", () => {
    expect(prescription(variable([10, 12, 14]))).toBe("10 · 12 · 14 rép.");
  });

  it("AMRAP « Volume croissant » : « 10 rép. +2/tour » ; incrément négatif « 10 rép. −1/tour » ; sans incrément : la cible seule", () => {
    const parameters = uniform("REPETITIONS", 1, numberTarget(10));
    expect(prescription(parameters, { key: "AMRAP", settings: { incrementPerRound: 2 } })).toBe("10 rép. +2/tour");
    expect(prescription(parameters, { key: "AMRAP", settings: { incrementPerRound: -1 } })).toBe("10 rép. −1/tour");
    expect(prescription(parameters, { key: "AMRAP", settings: { incrementPerRound: 0 } })).toBe("10 rép.");
    // Durée : « 30″ +5″/tour ».
    expect(prescription(uniform("DURATION", 1, numberTarget(30)), { key: "AMRAP", settings: { incrementPerRound: 5 } })).toBe("30″ +5″/tour");
  });

  it("Death by : « 1 rép. +1/min » (intervalle de l'Exercice ou du Circuit porteur, une minute par défaut)", () => {
    const parameters = uniform("REPETITIONS", 1, numberTarget(1));
    expect(prescription(parameters, { key: "DEATH_BY", settings: { incrementPerRound: 1, intervalSeconds: 60 } })).toBe("1 rép. +1/min");
    expect(prescription(parameters, { key: "DEATH_BY", settings: { incrementPerRound: 2 } }, 60)).toBe("1 rép. +2/min");
    expect(prescription(parameters, { key: "DEATH_BY", settings: { incrementPerRound: 1 } })).toBe("1 rép. +1/min");
    // Intervalle différent d'une minute (À CLARIFIER) : la période est la durée de l'intervalle.
    expect(prescription(parameters, { key: "DEATH_BY", settings: { incrementPerRound: 1 } }, 30)).toBe("1 rép. +1/30″");
    // Synthèse brute partagée (Catalogue, signalements) : même forme pour le Death by.
    expect(formatOccurrenceSummary({ executionParameters: parameters, format: { key: "DEATH_BY", settings: { incrementPerRound: 1 } } })).toBe("1 rép. +1/min");
    expect(formatOccurrenceSummary({ executionParameters: parameters })).toBe("1 rép.");
  });

  it("cible de durée prescrite : « 3 × 1′30″ » (jamais « 1 min 30 »)", () => {
    expect(prescription(uniform("DURATION", 3, numberTarget(90)))).toBe("3 × 1′30″");
    expect(prescription(uniform("DURATION", 1, numberTarget(45)))).toBe("45″");
  });

  it("condition d'arrêt à l'échec : « à l'échec », sans durée ; plusieurs séries : « 3 séries à l'échec »", () => {
    expect(prescription(uniform("REPETITIONS", 1, failureTarget()))).toBe("à l’échec");
    expect(prescription(uniform("DURATION", 1, failureTarget()))).toBe("à l’échec");
    expect(prescription(uniform("REPETITIONS", 3, failureTarget()))).toBe("3 séries à l’échec");
    // AMRAP « Max » : à l'échec, l'incrément n'est pas affiché.
    expect(prescription(uniform("REPETITIONS", 1, failureTarget()), { key: "AMRAP", settings: { incrementPerRound: 2 } })).toBe("à l’échec");
  });

  it("jamais d'estimation « ≈ » ni « ≥ » sur la carte", () => {
    for (const value of [
      prescription(uniform("REPETITIONS", 3, numberTarget(12))),
      prescription(variable([10, 12, 14, 16])),
      prescription(uniform("DURATION", 2, numberTarget(4000))),
    ]) {
      expect(value).not.toMatch(/[≈≥]/u);
    }
  });

  it("Death by sans objectif de départ : paramètres à compléter (inchangé)", () => {
    expect(prescription(uniform("REPETITIONS", 1, failureTarget()), { key: "DEATH_BY", settings: { incrementPerRound: 1 } })).toBe(
      strings.executionParameters.card.incomplete,
    );
  });
});
