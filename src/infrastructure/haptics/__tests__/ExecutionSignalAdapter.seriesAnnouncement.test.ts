import { describe, expect, it } from "@jest/globals";

import type { ExecutionSignal } from "@/features/execution/ExecutionService";

import { ExecutionSignalAdapter } from "../ExecutionSignalAdapter";

/**
 * Recette du 13/11/2026 (Hermann : « ne pas répéter ce qui ne change pas (le nom de l'exercice, le côté) ; annoncer
 * deuxième série, troisième série, etc. »).
 */
function announcements(steps: readonly { side: 1 | 2; series: number }[], total = 2): string[] {
  const said: string[] = [];
  const adapter = new ExecutionSignalAdapter({ vibrate: () => undefined }, { play: () => undefined }, { say: (text) => void said.push(text) }, (fn) => fn());
  steps.forEach((step, index) => {
    const signal: ExecutionSignal = {
      kind: "TRANSITION",
      atMs: index * 20_000,
      phase: "ACTIVITY",
      exerciseName: "Rotule dos assis",
      sideRank: step.side,
      timed: true,
      next: null,
      objective: { mode: "DURATION", target: { kind: "NUMBER", value: 16 } },
      series: { current: step.series, total },
    };
    adapter.play(signal);
  });
  return said;
}

describe("ExecutionSignalAdapter — Séries suivantes d'un même exercice", () => {
  it("côté par côté : la Série suivante est annoncée seule, puis le changement de côté", () => {
    expect(
      announcements([
        { side: 1, series: 1 },
        { side: 1, series: 2 },
        { side: 2, series: 1 },
        { side: 2, series: 2 },
      ]),
    ).toEqual(["Rotule dos assis, premier côté, 16 secondes", "Deuxième série", "Changez de côté, première série", "Deuxième série"]);
  });

  it("en alternance : changement de côté sans Série, puis premier côté et Série suivante", () => {
    expect(
      announcements([
        { side: 1, series: 1 },
        { side: 2, series: 1 },
        { side: 1, series: 2 },
      ]),
    ).toEqual(["Rotule dos assis, premier côté, 16 secondes", "Changez de côté", "Premier côté, deuxième série"]);
  });

  it("troisième Série et au-delà", () => {
    expect(announcements([{ side: 1, series: 2 }, { side: 1, series: 3 }], 3).slice(1)).toEqual(["Troisième série"]);
  });
});
