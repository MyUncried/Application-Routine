import { describe, expect, it } from "@jest/globals";

import { DEFAULT_GUIDANCE_EVENTS } from "@/domain/preferences/guidanceSettings";
import type { ExecutionSignal } from "@/features/execution/ExecutionService";

import { ALL_ANNOUNCEMENTS, ExecutionSignalAdapter } from "../ExecutionSignalAdapter";

/**
 * Recette du 18/11/2026 (Hermann, amrap-1 : « Appui sur +Tour - Annonce : ne pas répéter le nom du mouvement s'il ne change pas,
 * seulement le nombre de répétition / durée ») — cas que l'annonce des tours (D-530) ne couvre pas : objectif du tour non unique ou en
 * durée. Le tour d'un AMRAP à un mouvement garde la Série 1 : seul l'objectif est annoncé.
 */
function harness() {
  const said: string[] = [];
  const adapter = new ExecutionSignalAdapter({ vibrate: () => undefined }, { play: () => undefined }, { say: (text) => void said.push(text) }, (fn) => fn());
  adapter.setGuidance({ announcements: ALL_ANNOUNCEMENTS, events: DEFAULT_GUIDANCE_EVENTS });
  return { adapter, said };
}

function amrapRound(atMs: number, rank: number, objective: ExecutionSignal["objective"], repetitions: number | null, name = "Gainage"): ExecutionSignal {
  return { kind: "TRANSITION", atMs, phase: "ACTIVITY", exerciseName: name, sideRank: null, timed: true, next: null, objective, series: { current: 1, total: 1 }, round: { rank, repetitions } };
}

describe("ExecutionSignalAdapter — amrap-1 : nom non répété à « + Tour »", () => {
  it("AMRAP à un mouvement en durée : nom au premier tour, puis la durée seule", () => {
    const { adapter, said } = harness();
    const objective = { mode: "DURATION" as const, target: { kind: "NUMBER" as const, value: 30 } };
    adapter.play(amrapRound(10_000, 1, objective, null));
    adapter.play(amrapRound(40_000, 2, objective, null));
    expect(said[0]).toContain("Gainage");
    expect(said).toHaveLength(2);
    expect(said[1]).not.toContain("Gainage");
    expect(said[1]!.length).toBeGreaterThan(0);
  });

  it("un autre mouvement au début du tour : le nom est dit", () => {
    const { adapter, said } = harness();
    const objective = { mode: "DURATION" as const, target: { kind: "NUMBER" as const, value: 30 } };
    adapter.play(amrapRound(10_000, 1, objective, null, "Gainage"));
    adapter.play(amrapRound(40_000, 2, objective, null, "Planche"));
    expect(said[1]).toContain("Planche");
  });
});
