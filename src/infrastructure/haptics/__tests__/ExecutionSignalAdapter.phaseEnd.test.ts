import { describe, expect, it } from "@jest/globals";

import type { ExecutionSignal } from "@/features/execution/ExecutionService";

import { ExecutionSignalAdapter } from "../ExecutionSignalAdapter";

/** Recette du 13/11/2026 (Hermann : « Annoncer les changements de phase jusqu'à la fin, oui »). */
describe("ExecutionSignalAdapter — phase sur un bip des dernières secondes", () => {
  const countdown = (phaseChange: boolean): ExecutionSignal => ({ kind: "COUNTDOWN", atMs: 14_000, phase: "ACTIVITY", exerciseName: "Rotule dos assis", sideRank: 1, timed: true, next: null, phaseLabel: "Relâcher", phaseChange });

  function run(signal: ExecutionSignal): string[] {
    const said: string[] = [];
    const adapter = new ExecutionSignalAdapter({ vibrate: () => undefined }, { play: () => undefined }, { say: (text) => void said.push(text) }, (fn) => fn());
    adapter.play(signal);
    return said;
  }

  it("le bip qui tombe sur un changement de phase annonce la phase", () => {
    expect(run(countdown(true))).toEqual(["Relâcher"]);
  });

  it("un bip des dernières secondes ordinaire n'annonce rien", () => {
    expect(run(countdown(false))).toEqual([]);
  });
});
