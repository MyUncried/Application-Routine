import { describe, expect, it } from "@jest/globals";

import { DEFAULT_GUIDANCE_EVENTS } from "@/domain/preferences/guidanceSettings";
import type { ExecutionSignal } from "@/features/execution/ExecutionService";

import { ALL_ANNOUNCEMENTS, ExecutionSignalAdapter } from "../ExecutionSignalAdapter";

/**
 * D-530 / RM-269 (Hermann, 18/11/2026) — annonce des tours en AMRAP et en For time : « Premier tour, 21 répétitions »… ; un seul
 * signal par appui — interrupteur « Annonce des tours » activé : annonce seule, sans son ; coupé : son seul, sans annonce.
 */
function harness(rounds = true, chosenSound = false) {
  const said: string[] = [];
  const sounds: string[] = [];
  const adapter = new ExecutionSignalAdapter({ vibrate: () => undefined }, { play: (tone) => void sounds.push(tone) }, { say: (text) => void said.push(text) }, (fn) => fn());
  adapter.setGuidance({
    announcements: { ...ALL_ANNOUNCEMENTS, rounds },
    events: chosenSound ? { ...DEFAULT_GUIDANCE_EVENTS, EXERCISE_START: { sound: "DING", vibration: true } } : DEFAULT_GUIDANCE_EVENTS,
  });
  return { adapter, said, sounds };
}

function roundStart(atMs: number, rank: number, repetitions: number | null, name = "Thrusters", extra: Partial<ExecutionSignal> = {}): ExecutionSignal {
  return {
    kind: "TRANSITION",
    atMs,
    phase: "ACTIVITY",
    exerciseName: name,
    sideRank: null,
    timed: false,
    next: null,
    objective: repetitions === null ? undefined : { mode: "REPETITIONS", target: { kind: "NUMBER", value: repetitions } },
    series: { current: rank, total: 3 },
    round: { rank, repetitions },
    ...extra,
  };
}

const countdown: ExecutionSignal = { kind: "TRANSITION", atMs: 0, phase: "INITIAL_COUNTDOWN", exerciseName: null, sideRank: null, timed: true, next: { phase: "ACTIVITY", exerciseName: "Thrusters" }, exerciseCount: 1 };

describe("ExecutionSignalAdapter — annonce des tours (D-530)", () => {
  it("interrupteur activé : chaque début de tour, y compris le premier au départ, est annoncé sans aucun son", () => {
    const { adapter, said, sounds } = harness();
    adapter.play(countdown);
    sounds.length = 0;
    said.length = 0;
    adapter.play(roundStart(10_000, 1, 21));
    adapter.play(roundStart(40_000, 2, 15));
    adapter.play(roundStart(70_000, 3, 9));
    expect(said).toEqual(["Premier tour, 21 répétitions", "Deuxième tour, 15 répétitions", "Troisième tour, 9 répétitions"]);
    expect(sounds).toEqual([]);
  });

  it("« 1 répétition » au singulier", () => {
    const { adapter, said } = harness();
    adapter.play(roundStart(10_000, 4, 1));
    expect(said).toEqual(["Quatrième tour, Thrusters, 1 répétition"]);
  });

  it("interrupteur activé : un son choisi pour le départ d'exercice n'est pas joué non plus (jamais les deux)", () => {
    const { adapter, said, sounds } = harness(true, true);
    adapter.play(roundStart(10_000, 2, 15));
    expect(said).toHaveLength(1);
    expect(sounds).toEqual([]);
  });

  it("interrupteur coupé : son seul du départ d'exercice (réglage Son et Vibration), aucune annonce", () => {
    const { adapter, said, sounds } = harness(false);
    adapter.play(roundStart(10_000, 1, 21));
    adapter.play(roundStart(40_000, 2, 15));
    expect(said).toEqual([]);
    expect(sounds).toEqual(["SIFFLET_PUR", "SIFFLET_PUR"]);
  });

  it("interrupteur coupé, son choisi : ce son seul", () => {
    const { adapter, said, sounds } = harness(false, true);
    adapter.play(roundStart(10_000, 2, 15));
    expect(said).toEqual([]);
    expect(sounds).toEqual(["DING"]);
  });

  it("appui répété (même signal) : un seul signal", () => {
    const { adapter, said, sounds } = harness();
    adapter.play(roundStart(40_000, 2, 15));
    adapter.play(roundStart(40_000, 2, 15));
    expect(said).toEqual(["Deuxième tour, Thrusters, 15 répétitions"]);
    expect(sounds).toEqual([]);
  });

  it("le nom n'est dit que s'il change (exercice suivi d'un autre) ; même exercice d'un tour à l'autre, ordinal et objectif seuls", () => {
    const { adapter, said } = harness();
    adapter.play(roundStart(10_000, 1, 21, "Thrusters"));
    adapter.play({ kind: "TRANSITION", atMs: 20_000, phase: "ACTIVITY", exerciseName: "Tractions", sideRank: null, timed: false, next: null, objective: { mode: "REPETITIONS", target: { kind: "NUMBER", value: 21 } }, series: null, round: null });
    adapter.play(roundStart(40_000, 2, 15, "Thrusters"));
    expect(said).toEqual(["Premier tour, Thrusters, 21 répétitions", "Tractions, 21 répétitions", "Deuxième tour, Thrusters, 15 répétitions"]);
  });

  it("objectif du tour non unique (`repetitions` null) : annonce d'avant, inchangée (cas non tranché)", () => {
    const { adapter, said, sounds } = harness();
    adapter.play(roundStart(10_000, 1, null));
    expect(said).toEqual(["Thrusters"]);
    expect(sounds).toEqual(["SIFFLET_PUR"]);
  });

  it("étape qui n'ouvre pas de tour (dernier appui du For time, fin de séance) : aucune annonce de tour", () => {
    const { adapter, said } = harness();
    adapter.play({ kind: "FINISH", atMs: 90_000, phase: null, exerciseName: null, sideRank: null });
    expect(said).toEqual(["Bravo, séance terminée"]);
    expect(said.some((text) => text.includes("tour"))).toBe(false);
  });

  it("voix de la séance coupée : son seul, même interrupteur activé", () => {
    const { adapter, said, sounds } = harness();
    adapter.setAudible(true, false);
    adapter.play(roundStart(10_000, 1, 21));
    expect(said).toEqual([]);
    expect(sounds).toEqual(["SIFFLET_PUR"]);
  });
});
