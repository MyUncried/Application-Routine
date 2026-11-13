import { describe, expect, it, jest } from "@jest/globals";

import type { ExecutionSignal } from "@/features/execution/ExecutionService";
import type { BeepTone } from "@/infrastructure/audio/ExecutionSounds";

import type { VibrationLevel } from "../ExecutionVibration";
import { ExecutionSignalAdapter } from "../ExecutionSignalAdapter";

/**
 * Fin de PRE-10, sons programmés à l'avance (spec `spec-guidage-reglages` §8, étape 3 ; Hermann, 12/11/2026 : « Sons
 * programmés à l’avance ») : le son est programmé sur l'horloge audio ; à son instant, vibration et annonce seulement.
 */
function setup(ready = true) {
  const played: [BeepTone, number][] = [];
  const scheduled: [BeepTone, number, number][] = [];
  const cancel = jest.fn(() => undefined);
  const vibrate = jest.fn((_level: VibrationLevel) => undefined);
  const said: string[] = [];
  const timers = new Map<number, { run: () => void; delayMs: number }>();
  let nextHandle = 0;
  const fire = () => {
    const due = [...timers.values()];
    timers.clear();
    for (const timer of due) timer.run();
  };
  const adapter = new ExecutionSignalAdapter(
    { vibrate },
    {
      play: (tone, volume = 1) => played.push([tone, volume]),
      schedule: (tone, volume, delayMs) => {
        if (ready) scheduled.push([tone, volume, delayMs]);
        return ready;
      },
      cancelScheduled: cancel,
    },
    { say: (text) => said.push(text) },
    (run) => run(),
    {
      set: (run, delayMs) => {
        nextHandle += 1;
        timers.set(nextHandle, { run, delayMs });
        return nextHandle;
      },
      clear: (handle) => void timers.delete(handle as number),
    },
  );
  return { adapter, played, scheduled, cancel, vibrate, said, timers, fire };
}

const at = (kind: ExecutionSignal["kind"], atMs: number, overrides: Partial<ExecutionSignal> = {}): ExecutionSignal => ({
  kind,
  atMs,
  phase: "ACTIVITY",
  exerciseName: "Squat",
  sideRank: null,
  timed: true,
  next: null,
  ...overrides,
});

describe("ExecutionSignalAdapter — sons programmés à l'avance", () => {
  it("cadence programmée d'avance : jouée une seule fois, pas à son instant", () => {
    const { adapter, played, scheduled, vibrate } = setup();
    adapter.schedule(at("CADENCE", 2000), 800);
    adapter.schedule(at("CADENCE", 2000), 400); // déjà programmée
    expect(scheduled).toEqual([["CLIC_DOUX", 0.35, 800]]);
    expect(vibrate).not.toHaveBeenCalled();
    adapter.play(at("CADENCE", 2000));
    expect(played).toEqual([]);
    expect(vibrate).not.toHaveBeenCalled(); // cadence : sans vibration par défaut
  });

  it("bips des dernières secondes et phase : son et vibration programmés ensemble ; annonce de la phase à son instant", () => {
    const { adapter, played, scheduled, said, vibrate, timers, fire } = setup();
    adapter.schedule(at("COUNTDOWN", 3000), 1000);
    adapter.schedule(at("PHASE", 4000, { phaseLabel: "Descente" }), 1400);
    expect(scheduled.map(([tone]) => tone)).toEqual(["BIP_GRAVE", "BIP_COURT"]);
    // Recette du 13/11/2026 (« Les vibrations sont légèrement en retard par rapport au bip ») : même délai que le son.
    expect([...timers.values()].map((timer) => timer.delayMs)).toEqual([1000, 1400]);
    fire();
    expect(vibrate.mock.calls).toEqual([["MEDIUM"], ["LIGHT"]]);
    adapter.play(at("COUNTDOWN", 3000));
    adapter.play(at("PHASE", 4000, { phaseLabel: "Descente" }));
    expect(played).toEqual([]);
    expect(said).toEqual(["Descente"]);
    expect(vibrate).toHaveBeenCalledTimes(2); // pas de seconde vibration à l'instant du signal
  });

  it("annulation : les vibrations programmées ne tombent pas ; le signal rejoué vibre à son instant", () => {
    const { adapter, vibrate, timers } = setup();
    adapter.schedule(at("COUNTDOWN", 3000), 1000);
    adapter.cancelScheduled();
    expect(timers.size).toBe(0);
    adapter.play(at("COUNTDOWN", 3000));
    expect(vibrate.mock.calls).toEqual([["MEDIUM"]]);
  });

  it("Vibrations coupées entre-temps : la vibration programmée ne vibre pas", () => {
    const { adapter, vibrate, fire } = setup();
    adapter.schedule(at("COUNTDOWN", 3000), 1000);
    adapter.setVibrationEnabled(false);
    fire();
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("bibliothèque non prête : rien de programmé, le son est joué à son instant comme avant", () => {
    const { adapter, played, scheduled } = setup(false);
    adapter.schedule(at("CADENCE", 2000), 800);
    adapter.play(at("CADENCE", 2000));
    expect(scheduled).toEqual([]);
    expect(played).toEqual([["CLIC_DOUX", 0.35]]);
  });

  it("annulation (Pause, étape suivante) : les sons programmés sont annulés ; un signal rejoué ensuite sonne à son instant", () => {
    const { adapter, played, cancel } = setup();
    adapter.schedule(at("CADENCE", 2000), 800);
    adapter.cancelScheduled();
    expect(cancel).toHaveBeenCalledTimes(1);
    adapter.play(at("CADENCE", 2000));
    expect(played).toEqual([["CLIC_DOUX", 0.35]]);
  });

  it("Sons coupés : rien n'est programmé et les sons en attente sont annulés", () => {
    const { adapter, scheduled, cancel } = setup();
    adapter.schedule(at("CADENCE", 2000), 800);
    adapter.setAudible(false, true);
    expect(cancel).toHaveBeenCalledTimes(1);
    adapter.schedule(at("CADENCE", 3000), 800);
    expect(scheduled).toHaveLength(1);
  });

  it("pas de bip de cadence juste après un bip programmé (recette h2) ; les transitions ne sont jamais programmées", () => {
    const { adapter, scheduled } = setup();
    adapter.schedule(at("COUNTDOWN", 3000), 1000);
    adapter.schedule(at("CADENCE", 3200), 1200);
    adapter.schedule(at("TRANSITION", 4000), 1400);
    expect(scheduled.map(([tone]) => tone)).toEqual(["BIP_GRAVE"]);
  });
});
