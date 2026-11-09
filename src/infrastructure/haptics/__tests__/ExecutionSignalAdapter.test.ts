import { describe, expect, it, jest } from "@jest/globals";
import * as Haptics from "expo-haptics";

import type { ExecutionSignal } from "@/features/execution/ExecutionService";
import type { BeepTone } from "@/infrastructure/audio/ExecutionSounds";
import { bestFrenchVoice } from "@/infrastructure/speech/ExecutionVoice";

import { announcementOf, ExecutionSignalAdapter } from "../ExecutionSignalAdapter";

/** Guidage sonore défini par Hermann le 10/11/2026 (formulaire « Guidage sonore KODJO ») : son, volume, annonce, vibration. */

function setup() {
  const beeps: [BeepTone, number][] = [];
  const said: string[] = [];
  const delays: number[] = [];
  const impactAsync = jest.fn(async (_style?: Haptics.ImpactFeedbackStyle) => undefined);
  const adapter = new ExecutionSignalAdapter(
    { impactAsync },
    { play: (tone, volume = 1) => beeps.push([tone, volume]) },
    { say: (text) => said.push(text) },
    (run, delayMs = 0) => {
      delays.push(delayMs);
      run();
    },
  );
  return { adapter, beeps, said, delays, impactAsync };
}

const signal = (overrides: Partial<ExecutionSignal>): ExecutionSignal => ({ kind: "TRANSITION", atMs: 0, phase: "ACTIVITY", exerciseName: "Gainage", sideRank: null, timed: true, next: null, ...overrides });
const nextExercise = (exerciseName: string) => ({ phase: "ACTIVITY" as const, exerciseName });

describe("ExecutionSignalAdapter — guidage sonore du 10/11/2026", () => {
  it("Compte à rebours : « Préparez-vous. Prochain exercice : … » ; au départ, sifflet roulé seul (nom déjà annoncé)", () => {
    const { adapter, beeps, said, impactAsync } = setup();
    adapter.play(signal({ phase: "INITIAL_COUNTDOWN", exerciseName: null, timed: true, next: nextExercise("Gainage") }));
    adapter.play(signal({}));
    expect(said).toEqual(["Préparez-vous. Prochain exercice : Gainage"]);
    expect(beeps).toEqual([["SIFFLET_ROULE", 1]]);
    expect(impactAsync).toHaveBeenNthCalledWith(1, Haptics.ImpactFeedbackStyle.Heavy);
  });

  it("récupération avant un autre exercice : annonce du prochain ; départ en chronomètre : sifflet pur à 55 %", () => {
    const { adapter, beeps, said } = setup();
    adapter.play(signal({ phase: "POST_ACTIVITY_RECOVERY", exerciseName: "Gainage", next: nextExercise("Pompes") }));
    adapter.play(signal({ exerciseName: "Pompes", timed: false }));
    expect(said).toEqual(["Récupération. Prochain exercice : Pompes"]);
    expect(beeps).toEqual([["SIFFLET_PUR", 0.55]]);
  });

  it("nom non annoncé avant : annoncé au départ, après le son ; Pause entre séries du même exercice : « Pause » seul", () => {
    const { adapter, beeps, said, delays } = setup();
    adapter.play(signal({}));
    adapter.play(signal({ phase: "SERIES_PAUSE", next: nextExercise("Gainage") }));
    expect(said).toEqual(["Gainage", "Pause"]);
    expect(beeps).toEqual([["SIFFLET_ROULE", 1]]);
    expect(delays).toEqual([500, 0]);
  });

  it("bilatéral : côté 1 au départ, double bip à 55 % et « …, côté 2 » au changement de côté", () => {
    const { adapter, beeps, said } = setup();
    adapter.play(signal({ phase: "INITIAL_COUNTDOWN", exerciseName: null, next: nextExercise("Fente") }));
    adapter.play(signal({ exerciseName: "Fente", sideRank: 1 }));
    adapter.play(signal({ phase: "SIDE_RECOVERY", exerciseName: "Fente", next: nextExercise("Fente") }));
    adapter.play(signal({ exerciseName: "Fente", sideRank: 2 }));
    expect(said).toEqual(["Préparez-vous. Prochain exercice : Fente", "Côté 1", "Récupération", "Fente, côté 2"]);
    expect(beeps).toEqual([["SIFFLET_ROULE", 1], ["BIP_DOUBLE", 0.55]]);
  });

  it("dernières secondes : bip grave ; cadence : clic doux à 35 % ; minute : ding à 15 % ; Point d'arrêt : double bip ; fin : bip long", () => {
    const { adapter, beeps, said, impactAsync } = setup();
    adapter.play(signal({ kind: "COUNTDOWN" }));
    adapter.play(signal({ kind: "CADENCE" }));
    adapter.play(signal({ kind: "MINUTE" }));
    adapter.play(signal({ phase: "STOP_POINT", exerciseName: null }));
    adapter.play(signal({ phase: "SESSION_END", exerciseName: null }));
    expect(beeps).toEqual([["BIP_GRAVE", 1], ["CLIC_DOUX", 0.35], ["DING", 0.15], ["BIP_DOUBLE", 1], ["BIP_LONG", 1]]);
    expect(said).toEqual([]);
    expect(impactAsync.mock.calls.map(([style]) => style)).toEqual([
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Medium,
    ]);
  });

  it("voix coupée : une étape sans son défini reçoit un bip grave (S5) ; le nom n'est pas tenu pour annoncé", () => {
    const { adapter, beeps, said } = setup();
    adapter.setAudible(true, false);
    adapter.play(signal({ phase: "INITIAL_COUNTDOWN", exerciseName: null, next: nextExercise("Gainage") }));
    adapter.setAudible(true, true);
    adapter.play(signal({}));
    expect(beeps).toEqual([["BIP_GRAVE", 1], ["SIFFLET_ROULE", 1]]);
    expect(said).toEqual(["Gainage"]);
  });

  it("sons coupés : annonce immédiate, aucun son ; vibration indépendante", () => {
    const { adapter, beeps, said, delays, impactAsync } = setup();
    adapter.setAudible(false, true);
    adapter.play(signal({ kind: "COUNTDOWN" }));
    adapter.play(signal({}));
    expect(beeps).toEqual([]);
    expect(said).toEqual(["Gainage"]);
    expect(delays).toEqual([0]);
    adapter.setVibrationEnabled(false);
    adapter.play(signal({}));
    expect(impactAsync).toHaveBeenCalledTimes(2);
  });

  it("annonce sans contexte : nom vide → aucune annonce ; récupération → « Récupération »", () => {
    expect(announcementOf({ phase: "ACTIVITY", exerciseName: "  ", sideRank: null })).toBeNull();
    expect(announcementOf({ phase: "BLOCK_REST", exerciseName: null, sideRank: null })).toBe("Récupération");
  });

  it("voix : Premium, puis Améliorée, puis voix fr-FR par défaut (S2)", () => {
    const v = (identifier: string, quality: string, language = "fr-FR") => ({ identifier, quality, language });
    expect(bestFrenchVoice([v("thomas", "Default"), v("amelie-ca", "Enhanced", "fr-CA"), v("audrey", "Enhanced")])).toBe("audrey");
    expect(bestFrenchVoice([v("audrey", "Enhanced"), v("com.apple.voice.premium.fr-FR.Thomas", "Enhanced")])).toBe("com.apple.voice.premium.fr-FR.Thomas");
    expect(bestFrenchVoice([v("anna", "Enhanced", "de-DE")])).toBeNull();
  });
});
