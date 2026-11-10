import { describe, expect, it, jest } from "@jest/globals";

import type { ExecutionSignal, SignalObjective } from "@/features/execution/ExecutionService";
import type { BeepTone } from "@/infrastructure/audio/ExecutionSounds";
import { bestFrenchVoice } from "@/infrastructure/speech/ExecutionVoice";

import type { VibrationLevel } from "../ExecutionVibration";
import { ALL_ANNOUNCEMENTS, announcementOf, ExecutionSignalAdapter, objectiveText } from "../ExecutionSignalAdapter";

/**
 * Guidage sonore défini par Hermann le 10/11/2026 (formulaire « Guidage sonore KODJO »), mis à jour après la
 * recette du 10/11/2026 (G2 à G10, constats) : son, volume, annonce, vibration.
 */

function setup() {
  const beeps: [BeepTone, number][] = [];
  const said: string[] = [];
  const delays: number[] = [];
  const vibrate = jest.fn((_level: VibrationLevel) => undefined);
  const adapter = new ExecutionSignalAdapter(
    { vibrate },
    { play: (tone, volume = 1) => beeps.push([tone, volume]) },
    { say: (text) => said.push(text) },
    (run, delayMs = 0) => {
      delays.push(delayMs);
      run();
    },
  );
  let clock = 0;
  const play = (overrides: Partial<ExecutionSignal>) => adapter.play(signal({ atMs: (clock += 1000), ...overrides }));
  return { adapter, play, beeps, said, delays, vibrate };
}

const reps = (value: number) => ({ mode: "REPETITIONS" as const, target: { kind: "NUMBER" as const, value } });
const signal = (overrides: Partial<ExecutionSignal>): ExecutionSignal => ({ kind: "TRANSITION", atMs: 0, phase: "ACTIVITY", exerciseName: "Gainage", sideRank: null, timed: true, next: null, ...overrides });
const nextExercise = (exerciseName: string, objective: SignalObjective = reps(12)) => ({ phase: "ACTIVITY" as const, exerciseName, objective });

describe("ExecutionSignalAdapter — guidage sonore du 10/11/2026", () => {
  it("Compte à rebours : « Préparez-vous. À suivre : … » ; au départ, sifflet roulé à 55 %, puis l'objectif", () => {
    const { play, beeps, said, vibrate } = setup();
    play({ phase: "INITIAL_COUNTDOWN", exerciseName: null, timed: true, next: nextExercise("Gainage", { mode: "DURATION", target: { kind: "NUMBER", value: 45 } }) });
    play({ objective: { mode: "DURATION", target: { kind: "NUMBER", value: 45 } } });
    expect(said).toEqual(["Préparez-vous. À suivre : Gainage", "45 secondes"]);
    expect(beeps).toEqual([["SIFFLET_ROULE", 0.55]]);
    expect(vibrate).toHaveBeenNthCalledWith(1, "HEAVY");
  });

  it("récupération après une étape chronométrée : double bip au zéro puis annonce ; départ en chronomètre : sifflet pur à 55 %", () => {
    const { play, beeps, said, delays } = setup();
    play({ exerciseName: "Gainage", timed: true });
    play({ phase: "POST_ACTIVITY_RECOVERY", exerciseName: "Gainage", next: nextExercise("Pompes") });
    play({ exerciseName: "Pompes", timed: false });
    expect(said).toEqual(["Gainage", "Récupération. À suivre : Pompes"]);
    expect(beeps).toEqual([["SIFFLET_ROULE", 0.55], ["BIP_DOUBLE", 1], ["SIFFLET_PUR", 0.55]]);
    expect(delays).toEqual([500, 500]);
  });

  it("nom non annoncé avant : annoncé au départ avec l'objectif, après le son ; Pause du même exercice : « Pause » seul", () => {
    const { play, said } = setup();
    play({ objective: reps(10), timed: false });
    play({ phase: "SERIES_PAUSE", next: nextExercise("Gainage") });
    expect(said).toEqual(["Gainage, 10 répétitions", "Pause"]);
  });

  it("bilatéral : « Premier côté, 12 répétitions » au départ, sifflet court à 55 % et « Changez de côté » au changement", () => {
    const { play, beeps, said } = setup();
    play({ phase: "INITIAL_COUNTDOWN", exerciseName: null, timed: false, next: nextExercise("Fente") });
    play({ exerciseName: "Fente", sideRank: 1, timed: false, objective: reps(12) });
    play({ phase: "SIDE_RECOVERY", exerciseName: "Fente", timed: false, next: nextExercise("Fente") });
    play({ exerciseName: "Fente", sideRank: 2, timed: false });
    expect(said).toEqual(["Préparez-vous. À suivre : Fente", "Premier côté, 12 répétitions", "Récupération", "Changez de côté"]);
    expect(beeps).toEqual([["SIFFLET_PUR", 0.55], ["BIP_DOUBLE", 1], ["SIFFLET_COURT", 0.55]]);
  });

  it("dernières secondes : bip grave ; cadence : clic doux à 35 % ; minute : ding à 15 % ; Point d'arrêt et Pause : double bip ; achèvement : fanfare courte à 60 %", () => {
    const { play, beeps, said, vibrate } = setup();
    play({ kind: "COUNTDOWN" });
    play({ kind: "CADENCE" });
    play({ kind: "MINUTE" });
    play({ phase: "STOP_POINT", exerciseName: null, timed: false });
    play({ kind: "FINISH", phase: null, exerciseName: null });
    expect(beeps).toEqual([["BIP_GRAVE", 1], ["CLIC_DOUX", 0.35], ["DING", 0.15], ["BIP_DOUBLE", 1], ["FANFARE_COURTE", 0.6]]);
    expect(said).toEqual([]);
    expect(vibrate.mock.calls.map(([style]) => style)).toEqual([
      "MEDIUM",
      "LIGHT",
      "LIGHT",
      "HEAVY",
      "MEDIUM",
    ]);
  });

  it("Fin de séance après une étape chronométrée : double bip au zéro, puis fanfare à l'achèvement", () => {
    const { play, beeps } = setup();
    play({ timed: true });
    play({ phase: "SESSION_END", exerciseName: null, timed: true });
    play({ kind: "FINISH", phase: null, exerciseName: null });
    expect(beeps).toEqual([["SIFFLET_ROULE", 0.55], ["BIP_DOUBLE", 1], ["FANFARE_COURTE", 0.6]]);
  });

  it("arrivée sur une Pause après Suivant (étape non chronométrée) : double bip, puis l'annonce", () => {
    const { play, beeps, said, delays } = setup();
    play({ timed: false });
    play({ phase: "SERIES_PAUSE", next: nextExercise("Gainage") });
    expect(beeps).toEqual([["SIFFLET_PUR", 0.55], ["BIP_DOUBLE", 1]]);
    expect(said).toEqual(["Gainage", "Pause"]);
    expect(delays).toEqual([500, 500]);
  });

  it("Pause demandée par l'utilisateur : double bip et vibration forte, sans annonce", () => {
    const { play, beeps, said, vibrate } = setup();
    play({ kind: "PAUSE" });
    expect(beeps).toEqual([["BIP_DOUBLE", 1]]);
    expect(said).toEqual([]);
    expect(vibrate).toHaveBeenCalledWith("HEAVY");
  });

  it("nouvelle Exécution : aucun bip au début du Compte à rebours, même après une étape chronométrée de la précédente", () => {
    const { play, beeps } = setup();
    play({ phase: "SESSION_END", exerciseName: null, timed: true });
    play({ phase: "INITIAL_COUNTDOWN", exerciseName: null, timed: true, next: nextExercise("Gainage") });
    expect(beeps).toEqual([["BIP_GRAVE", 1]]);
  });

  it("pas de clic de cadence juste après un autre son ; ensuite, le clic reprend", () => {
    const { adapter, beeps } = setup();
    adapter.play(signal({ atMs: 10_000, timed: false }));
    adapter.play(signal({ kind: "CADENCE", atMs: 10_300 }));
    adapter.play(signal({ kind: "CADENCE", atMs: 11_300 }));
    expect(beeps).toEqual([["SIFFLET_PUR", 0.55], ["CLIC_DOUX", 0.35]]);
  });

  it("un même signal reçu deux fois n'est restitué qu'une fois", () => {
    const { adapter, beeps, vibrate } = setup();
    adapter.play(signal({ kind: "COUNTDOWN", atMs: 5000 }));
    adapter.play(signal({ kind: "COUNTDOWN", atMs: 5000 }));
    expect(beeps).toEqual([["BIP_GRAVE", 1]]);
    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  it("voix coupée : une étape sans son défini reçoit un bip grave (S5) ; le nom n'est pas tenu pour annoncé", () => {
    const { adapter, play, beeps, said } = setup();
    adapter.setAudible(true, false);
    play({ phase: "INITIAL_COUNTDOWN", exerciseName: null, timed: false, next: nextExercise("Gainage") });
    adapter.setAudible(true, true);
    play({});
    expect(beeps).toEqual([["BIP_GRAVE", 1], ["SIFFLET_ROULE", 0.55]]);
    expect(said).toEqual(["Gainage"]);
  });

  it("sons coupés : annonce immédiate, aucun son ; vibration indépendante", () => {
    const { adapter, play, beeps, said, delays, vibrate } = setup();
    adapter.setAudible(false, true);
    play({ kind: "COUNTDOWN" });
    play({});
    expect(beeps).toEqual([]);
    expect(said).toEqual(["Gainage"]);
    expect(delays).toEqual([0]);
    adapter.setVibrationEnabled(false);
    play({});
    expect(vibrate).toHaveBeenCalledTimes(2);
  });

  it("catégories séparées : sans l'objectif, le nom et le côté restent annoncés", () => {
    const { adapter, play, said } = setup();
    adapter.setAnnouncements({ ...ALL_ANNOUNCEMENTS, objective: false });
    play({ objective: reps(10), timed: false });
    play({ phase: "SERIES_PAUSE", next: nextExercise("Gainage") });
    play({ exerciseName: "Gainage", sideRank: 1, objective: reps(10), timed: false });
    expect(said).toEqual(["Gainage", "Pause", "Gainage, premier côté"]);
  });

  it("catégories séparées : sans les noms, l'objectif, les pauses et le début de séance restent annoncés (KO p3)", () => {
    const { adapter, play, said } = setup();
    adapter.setAnnouncements({ ...ALL_ANNOUNCEMENTS, names: false });
    play({ phase: "INITIAL_COUNTDOWN", exerciseName: null, timed: true, next: nextExercise("Pompes") });
    play({ exerciseName: "Pompes", objective: reps(12), timed: false });
    play({ phase: "POST_ACTIVITY_RECOVERY", exerciseName: "Pompes", next: nextExercise("Gainage") });
    expect(said).toEqual(["Préparez-vous", "12 répétitions", "Récupération"]);
  });

  it("catégories séparées : pauses, début de séance et côtés coupés indépendamment", () => {
    const { adapter, play, said, beeps } = setup();
    adapter.setAnnouncements({ ...ALL_ANNOUNCEMENTS, pauses: false, session: false, sides: false });
    play({ phase: "INITIAL_COUNTDOWN", exerciseName: null, timed: false, next: nextExercise("Fente") });
    play({ exerciseName: "Fente", sideRank: 1, objective: reps(8), timed: false });
    play({ phase: "SIDE_RECOVERY", exerciseName: "Fente", timed: false, next: nextExercise("Fente") });
    play({ exerciseName: "Fente", sideRank: 2, timed: false });
    expect(said).toEqual(["À suivre : Fente", "8 répétitions"]);
    // Changement de côté sans annonce : son propre son (sifflet court), pas de bip de repli.
    expect(beeps).toEqual([["SIFFLET_PUR", 0.55], ["BIP_DOUBLE", 1], ["SIFFLET_COURT", 0.55]]);
  });

  it("objectif annoncé : répétitions, durée en minutes, À l'échec ; rien sans cible", () => {
    expect(objectiveText(reps(1))).toBe("1 répétition");
    expect(objectiveText({ mode: "DURATION", target: { kind: "NUMBER", value: 90 } })).toBe("1 minute 30");
    expect(objectiveText({ mode: "DURATION", target: { kind: "NUMBER", value: 120 } })).toBe("2 minutes");
    expect(objectiveText({ mode: "REPETITIONS", target: { kind: "FAILURE" } })).toBe("jusqu'à l'échec");
    expect(objectiveText({ mode: "REPETITIONS", target: { kind: "UNSET" } })).toBeNull();
    expect(objectiveText(undefined)).toBeNull();
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
