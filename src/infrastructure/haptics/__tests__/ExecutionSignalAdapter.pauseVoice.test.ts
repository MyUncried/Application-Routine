import { describe, expect, it } from "@jest/globals";

import type { ExecutionSignal } from "@/features/execution/ExecutionService";

import { ExecutionSignalAdapter } from "../ExecutionSignalAdapter";

/**
 * Recette du 12/11/2026 (Hermann, e1e : « L'annonce doit s'arrêter net à la pause, et reprendre au début lorsqu'on
 * recommence l'exercice »).
 */
function setup() {
  const said: string[] = [];
  let speaking: string | null = null;
  const deferred: (() => void)[] = [];
  const adapter = new ExecutionSignalAdapter(
    { vibrate: () => undefined },
    { play: () => undefined },
    {
      say: (text) => {
        said.push(text);
        speaking = text;
      },
      interrupt: () => {
        const text = speaking;
        speaking = null;
        return text;
      },
    },
    (run) => void deferred.push(run),
  );
  return { adapter, said, deferred, finish: () => (speaking = null) };
}

const phase = (atMs: number, label: string): ExecutionSignal => ({ kind: "PHASE", atMs, phase: "ACTIVITY", exerciseName: "Squat", sideRank: null, timed: true, next: null, phaseLabel: label });

describe("ExecutionSignalAdapter — annonce et Pause", () => {
  it("annonce en cours coupée à la Pause, redite au début à la reprise de la même étape", () => {
    const { adapter, said, deferred } = setup();
    adapter.play(phase(1000, "Contracter"));
    deferred.shift()!();
    adapter.pauseVoice("squat#1");
    adapter.resumeVoice("squat#1");
    expect(said).toEqual(["Contracter", "Contracter"]);
  });

  it("annonce pas encore partie à la Pause : dite à la reprise, pas pendant la Pause", () => {
    const { adapter, said, deferred } = setup();
    adapter.play(phase(1000, "Relâcher"));
    adapter.pauseVoice("squat#1");
    deferred.shift()!();
    expect(said).toEqual([]);
    adapter.resumeVoice("squat#1");
    expect(said).toEqual(["Relâcher"]);
  });

  it("reprise sur une autre étape (Réinitialiser, Suivant) ou annonce terminée : rien n'est redit", () => {
    const { adapter, said, deferred, finish } = setup();
    adapter.play(phase(1000, "Contracter"));
    deferred.shift()!();
    adapter.pauseVoice("squat#1");
    adapter.resumeVoice("squat#2");
    finish();
    adapter.play(phase(3000, "Relâcher"));
    deferred.shift()!();
    finish();
    adapter.pauseVoice("squat#2");
    adapter.resumeVoice("squat#2");
    expect(said).toEqual(["Contracter", "Relâcher"]);
  });
});
