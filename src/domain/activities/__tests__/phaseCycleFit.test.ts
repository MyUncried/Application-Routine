import { describe, expect, it } from "@jest/globals";

import { numberTarget, unsetTarget, type ExecutionSeries } from "../ExecutionParameters";
import { phaseCycleFit, phaseCycleIssues } from "../phaseCycleFit";

/** Décision de Hermann du 09/11/2026 (recette PRE-10, constat d) : durée de série et motif des phases. */
describe("phaseCycleFit — durée de série et motif des phases", () => {
  it("inférieure au motif : BELOW ; multiple : OK ; sinon les deux multiples encadrants", () => {
    expect(phaseCycleFit(20, 30)).toEqual({ status: "BELOW", cycleSeconds: 30 });
    expect(phaseCycleFit(30, 30)).toEqual({ status: "OK" });
    expect(phaseCycleFit(90, 30)).toEqual({ status: "OK" });
    expect(phaseCycleFit(70, 30)).toEqual({ status: "NOT_MULTIPLE", cycleSeconds: 30, lowerSeconds: 60, upperSeconds: 90 });
  });

  it("multiple supérieur au-delà de 58′55″ : seul l'arrondi inférieur", () => {
    expect(phaseCycleFit(3530, 1000)).toEqual({ status: "NOT_MULTIPLE", cycleSeconds: 1000, lowerSeconds: 3000, upperSeconds: null });
  });
});

const phases = (...seconds: number[]) => seconds.map((durationSeconds, index) => ({ id: index + 1, label: `P${index + 1}`, durationSeconds }));

describe("phaseCycleIssues — séries de l'exercice", () => {
  it("séries variables : rangs inférieurs et non multiples ; cibles non chiffrées ignorées", () => {
    const series: ExecutionSeries = {
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(20), pauseSeconds: 0, loadKg: 0 },
        { target: numberTarget(70), pauseSeconds: 0, loadKg: 0 },
        { target: numberTarget(60), pauseSeconds: 0, loadKg: 0 },
        { target: unsetTarget(), pauseSeconds: 0, loadKg: 0 },
      ],
      workPhases: phases(20, 10),
    } as unknown as ExecutionSeries;
    expect(phaseCycleIssues({ mode: "DURATION", series })).toEqual({
      cycleSeconds: 30,
      belowRanks: [0],
      notMultiple: [{ rank: 1, targetSeconds: 70, lowerSeconds: 60, upperSeconds: 90 }],
    });
  });

  it("aucun contrôle : Répétitions, sans phases, phase incomplète, motif hors bornes", () => {
    const uniform = (workPhases: ReturnType<typeof phases>) =>
      ({ kind: "UNIFORM", count: 2, target: numberTarget(70), pauseSeconds: 0, loadKg: 0, workPhases }) as unknown as ExecutionSeries;
    const none = { cycleSeconds: null, belowRanks: [], notMultiple: [] };
    expect(phaseCycleIssues({ mode: "REPETITIONS", series: uniform(phases(20, 10)) })).toEqual(none);
    expect(phaseCycleIssues({ mode: "DURATION", series: uniform([]) })).toEqual(none);
    expect(phaseCycleIssues({ mode: "DURATION", series: uniform(phases(20, 0)) })).toEqual(none);
    expect(phaseCycleIssues({ mode: "DURATION", series: uniform(phases(3000, 1000)) })).toEqual(none);
  });
});
