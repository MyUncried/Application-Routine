import { describe, expect, it, jest } from "@jest/globals";

import type { ExecutionSignal } from "@/features/execution/ExecutionService";
import type { BeepTone } from "@/infrastructure/audio/ExecutionSounds";

import { announcementOf, ExecutionSignalAdapter } from "../ExecutionSignalAdapter";

/** Lot PRE-10 son et voix (décision de Hermann du 09/11/2026, `q-son`) : choix du canal, du bip et du texte. */

function setup() {
  const beeps: BeepTone[] = [];
  const said: string[] = [];
  const impactAsync = jest.fn(async () => undefined);
  const adapter = new ExecutionSignalAdapter({ impactAsync }, { play: (tone) => beeps.push(tone) }, { say: (text) => said.push(text) });
  return { adapter, beeps, said, impactAsync };
}

const signal = (overrides: Partial<ExecutionSignal>): ExecutionSignal => ({ kind: "TRANSITION", atMs: 0, phase: "ACTIVITY", exerciseName: "Gainage", sideRank: null, ...overrides });

describe("ExecutionSignalAdapter — sons et annonces vocales", () => {
  it("début d'un Exercice : nom annoncé, sans bip ; bilatéral : « côté 1 » / « côté 2 » (RM-243)", () => {
    const { adapter, beeps, said } = setup();
    adapter.play(signal({}));
    adapter.play(signal({ exerciseName: "Fente", sideRank: 2 }));
    expect(said).toEqual(["Gainage", "Fente, côté 2"]);
    expect(beeps).toEqual([]);
  });

  it("récupérations : « Récupération » ; étapes sans annonce : bip grave", () => {
    const { adapter, beeps, said } = setup();
    adapter.play(signal({ phase: "SIDE_RECOVERY" }));
    adapter.play(signal({ phase: "POST_ACTIVITY_RECOVERY", exerciseName: null }));
    for (const phase of ["INITIAL_COUNTDOWN", "SERIES_PAUSE", "SESSION_END", "STOP_POINT"] as const) adapter.play(signal({ phase, exerciseName: null }));
    expect(said).toEqual(["Récupération", "Récupération"]);
    expect(beeps).toEqual(["LOW", "LOW", "LOW", "LOW"]);
  });

  it("trois dernières secondes : bip aigu ; cadence et minute : bip grave ; jamais d'annonce", () => {
    const { adapter, beeps, said } = setup();
    adapter.play(signal({ kind: "COUNTDOWN" }));
    adapter.play(signal({ kind: "CADENCE" }));
    adapter.play(signal({ kind: "MINUTE" }));
    expect(beeps).toEqual(["HIGH", "LOW", "LOW"]);
    expect(said).toEqual([]);
  });

  it("interrupteurs : voix coupée → bip grave à la place de l'annonce ; sons coupés → aucun bip ; vibration indépendante", () => {
    const { adapter, beeps, said, impactAsync } = setup();
    adapter.setAudible(true, false);
    adapter.play(signal({}));
    expect(said).toEqual([]);
    expect(beeps).toEqual(["LOW"]);
    adapter.setAudible(false, true);
    adapter.play(signal({ kind: "COUNTDOWN" }));
    adapter.play(signal({}));
    expect(beeps).toEqual(["LOW"]);
    expect(said).toEqual(["Gainage"]);
    adapter.setAudible(false, false);
    adapter.play(signal({}));
    expect(impactAsync).toHaveBeenCalledTimes(4);
    adapter.setVibrationEnabled(false);
    adapter.play(signal({}));
    expect(impactAsync).toHaveBeenCalledTimes(4);
  });

  it("annonce : nom vide → aucune annonce", () => {
    expect(announcementOf({ phase: "ACTIVITY", exerciseName: "  ", sideRank: null })).toBeNull();
  });
});
