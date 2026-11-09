import { describe, expect, it, jest } from "@jest/globals";

import type { ExecutionSignal } from "@/features/execution/ExecutionService";
import type { BeepTone } from "@/infrastructure/audio/ExecutionSounds";
import { bestFrenchVoice } from "@/infrastructure/speech/ExecutionVoice";

import { announcementOf, ExecutionSignalAdapter } from "../ExecutionSignalAdapter";

/** Lot PRE-10 son et voix (décision de Hermann du 09/11/2026, `q-son`, puis recette « Son et voix ») : canal, son et texte. */

function setup() {
  const beeps: BeepTone[] = [];
  const said: string[] = [];
  const delays: number[] = [];
  const impactAsync = jest.fn(async () => undefined);
  const adapter = new ExecutionSignalAdapter(
    { impactAsync },
    { play: (tone) => beeps.push(tone) },
    { say: (text) => said.push(text) },
    (run, delayMs = 0) => {
      delays.push(delayMs);
      run();
    },
  );
  return { adapter, beeps, said, delays, impactAsync };
}

const signal = (overrides: Partial<ExecutionSignal>): ExecutionSignal => ({ kind: "TRANSITION", atMs: 0, phase: "ACTIVITY", exerciseName: "Gainage", sideRank: null, ...overrides });

describe("ExecutionSignalAdapter — sons et annonces vocales", () => {
  it("début d'un Exercice : sifflet, puis nom annoncé après le sifflet ; bilatéral : « côté 1 » / « côté 2 » (RM-243, S2)", () => {
    const { adapter, beeps, said, delays } = setup();
    adapter.play(signal({}));
    adapter.play(signal({ exerciseName: "Fente", sideRank: 2 }));
    expect(said).toEqual(["Gainage", "Fente, côté 2"]);
    expect(beeps).toEqual(["WHISTLE", "WHISTLE"]);
    expect(delays).toEqual([500, 500]);
  });

  it("récupérations : « Récupération » ; Pause entre séries : « Pause » ; Point d'arrêt : son spécifique ; autres : bip grave (S3, S5)", () => {
    const { adapter, beeps, said } = setup();
    adapter.play(signal({ phase: "SIDE_RECOVERY" }));
    adapter.play(signal({ phase: "POST_ACTIVITY_RECOVERY", exerciseName: null }));
    adapter.play(signal({ phase: "BLOCK_REST", exerciseName: null }));
    adapter.play(signal({ phase: "SERIES_PAUSE", exerciseName: null }));
    adapter.play(signal({ phase: "STOP_POINT", exerciseName: null }));
    adapter.play(signal({ phase: "INITIAL_COUNTDOWN", exerciseName: null }));
    adapter.play(signal({ phase: "SESSION_END", exerciseName: null }));
    expect(said).toEqual(["Récupération", "Récupération", "Récupération", "Pause", "Préparez-vous"]);
    expect(beeps).toEqual(["STOP_POINT", "LOW"]);
  });

  it("trois dernières secondes : bip aigu ; cadence : un seul son grave (« tac ») ; minute : bip grave ; jamais d'annonce (S6)", () => {
    const { adapter, beeps, said } = setup();
    adapter.play(signal({ kind: "COUNTDOWN" }));
    for (let i = 0; i < 3; i += 1) adapter.play(signal({ kind: "CADENCE" }));
    adapter.play(signal({ kind: "MINUTE" }));
    adapter.play(signal({ kind: "CADENCE" }));
    expect(beeps).toEqual(["HIGH", "TAC", "TAC", "TAC", "LOW", "TAC"]);
    expect(said).toEqual([]);
  });

  it("interrupteurs : voix coupée → sifflet seul ; sons coupés → annonce immédiate, aucun son ; vibration indépendante", () => {
    const { adapter, beeps, said, delays, impactAsync } = setup();
    adapter.setAudible(true, false);
    adapter.play(signal({}));
    adapter.play(signal({ phase: "SERIES_PAUSE" }));
    expect(said).toEqual([]);
    expect(beeps).toEqual(["WHISTLE", "LOW"]);
    adapter.setAudible(false, true);
    delays.length = 0;
    adapter.play(signal({ kind: "COUNTDOWN" }));
    adapter.play(signal({}));
    adapter.play(signal({ phase: "STOP_POINT" }));
    expect(beeps).toEqual(["WHISTLE", "LOW"]);
    expect(said).toEqual(["Gainage"]);
    expect(delays).toEqual([0]);
    adapter.setAudible(false, false);
    adapter.play(signal({}));
    expect(impactAsync).toHaveBeenCalledTimes(6);
    adapter.setVibrationEnabled(false);
    adapter.play(signal({}));
    expect(impactAsync).toHaveBeenCalledTimes(6);
  });

  it("annonce : nom vide → aucune annonce", () => {
    expect(announcementOf({ phase: "ACTIVITY", exerciseName: "  ", sideRank: null })).toBeNull();
  });

  it("voix : Premium, puis Améliorée, puis voix fr-FR par défaut (S2)", () => {
    const v = (identifier: string, quality: string, language = "fr-FR") => ({ identifier, quality, language });
    expect(bestFrenchVoice([v("thomas", "Default"), v("amelie-ca", "Enhanced", "fr-CA"), v("audrey", "Enhanced")])).toBe("audrey");
    expect(bestFrenchVoice([v("audrey", "Enhanced"), v("com.apple.voice.premium.fr-FR.Thomas", "Enhanced")])).toBe("com.apple.voice.premium.fr-FR.Thomas");
    expect(bestFrenchVoice([v("anna", "Enhanced", "de-DE")])).toBeNull();
  });
});
