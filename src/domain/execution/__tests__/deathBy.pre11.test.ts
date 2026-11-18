import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import type { ElementFormat } from "@/domain/sessions/formats";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";

import { launchabilityOf } from "../plan";
import { executionEnv } from "../policies";
import type { DeathByResult } from "../policies/deathBy";
import { estimatedDuration, projectExecution } from "../projection";
import { stepSignalsBetween } from "../signals";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * PRE-11 (T4) — politique Death by (conception consolidée §12.4, §12.5, complément du 5 novembre ; FMT-33 à FMT-38 ; D2, D3, Q2, Q4 ;
 * cas T16, T17, T18) et arbitrages de Hermann du 18/11/2026 (spec PRE-11 §5 point 30).
 */

const S = 1000;

function deathBy(id: string, parameters: ExecutionParameters, intervalSeconds = 60, incrementPerRound = 1, extra: { postActivityRecoverySeconds?: number } = {}) {
  return exerciseActivity(id, parameters, { format: { key: "DEATH_BY", settings: { intervalSeconds, incrementPerRound } }, ...extra });
}

function simOf(session: ReturnType<typeof structuredSession>) {
  const plan = planOf(session);
  return { plan, sim: new Simulation(executionEnv(plan)) };
}

/** Death by autonome (départ 3, + 2 / rang, 60 s), puis un Exercice libre. */
function single(parameters: ExecutionParameters = repetitionParameters(3, 1, 0), intervalSeconds = 60, increment = 2) {
  return simOf(
    structuredSession({
      elements: [
        { kind: "EXERCISE", exercise: deathBy("D", parameters, intervalSeconds, increment) },
        { kind: "EXERCISE", exercise: exerciseActivity("after", repetitionParameters(5, 1, 0)) },
      ],
      stopPoints: [],
    }),
  );
}

function results(sim: Simulation): DeathByResult[] {
  return [...sim.results.values()].flatMap((change) =>
    change.type === "SCOPE" && (change.result as { format?: string }).format === "DEATH_BY" ? [change.result as DeathByResult] : [],
  );
}

function targetOf(sim: Simulation): number | null {
  const target = sim.state.leaf?.spec.target;
  return target !== undefined && target.kind === "NUMBER" ? target.value : null;
}

describe("PRE-11 T4 — Death by", () => {
  it("lançable ; une portée DEATH_BY ; durée de séance donnée comme un minimum (régime ouvert)", () => {
    const session = structuredSession({ elements: [{ kind: "EXERCISE", exercise: deathBy("D", repetitionParameters(3, 1, 0)) }], stopPoints: [] });
    expect(launchabilityOf(createSessionSnapshot(session))).toEqual({ status: "launchable" });
    const plan = planOf(session);
    const scope = plan.items.find((item) => item.type === "SCOPE");
    expect(scope?.type === "SCOPE" && scope.scope.pilot).toBe("DEATH_BY");
    expect(estimatedDuration(plan).kind).toBe("lowerBound");
  });

  it("FMT-33 / FMT-35 : rang déduit de l'horloge, objectif = départ + incrément × (rang − 1) ; Suivant acquiert et révèle le repos", () => {
    const { plan, sim } = single();
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "D", windowStart: true, context: { circuit: { tour: 1, count: 0 } } });
    expect(targetOf(sim)).toBe(3);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 20 * S);
    expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
    const resting = projectExecution(plan, sim.state, 30 * S);
    expect(resting.format).toMatchObject({ kind: "DEATH_BY", deathBy: { rank: 1, acquiredRanks: 1 }, emom: { window: 1, resting: true, workEndedMs: 20 * S, remainingMs: 30 * S } });
    expect(resting.timer).toEqual({ kind: "COUNTDOWN", remainingMs: 30 * S, totalMs: 60 * S, elapsedMs: 30 * S });
    expect(resting.commands.reset).toBe(false);
    sim.at(60);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", windowStart: true, context: { circuit: { tour: 2 } } });
    expect(targetOf(sim)).toBe(5);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 90 * S);
    sim.at(120);
    expect(targetOf(sim)).toBe(7);
  });

  it("FMT-36 / T10 : un appui répété dans la même fenêtre n'acquiert pas deux rangs", () => {
    const { plan, sim } = single();
    sim.send({ type: "START" }, 0);
    const target = sim.target;
    sim.send({ type: "NEXT", validated: true, target }, 10 * S);
    expect(sim.send({ type: "NEXT", validated: true, target }, 11 * S).outcome).not.toBe("APPLIED");
    expect(projectExecution(plan, sim.state, 12 * S).format?.deathBy).toEqual({ rank: 1, acquiredRanks: 1 });
  });

  it("Q4 : confirmation pile à l'échéance — rang acquis, le rang suivant s'ouvre", () => {
    const { sim } = single();
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 60 * S);
    sim.at(60);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", context: { circuit: { tour: 2 } } });
    expect(results(sim)).toEqual([]);
  });

  it("D2 en Répétitions : fenêtre manquée — feuille de fin (répétitions faites), défi arrêté, la Séance enchaîne (D3)", () => {
    const { plan, sim } = single();
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 30 * S);
    sim.at(60);
    sim.at(120); // rang 2 manqué
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    const closing = projectExecution(plan, sim.state, 121 * S);
    expect(closing.format).toMatchObject({ kind: "DEATH_BY", phase: "CLOSURE", interrupted: { name: "Mouvement D", target: { kind: "NUMBER", value: 5 } } });
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 4 }, target: sim.target }, 130 * S);
    expect(results(sim)[0]).toMatchObject({
      acquiredRanks: 1,
      rankReached: 2,
      reason: "WINDOW_MISSED",
      failedExerciseId: "D",
      partialRepetitions: 4,
      partialDurationMs: null,
      completion: "INCOMPLETE",
    });
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "after" });
  });

  it("D2 en Durée (fenêtre commune) : le membre en Durée interrompu déclare sa durée tenue", () => {
    const { sim } = simOf(
      structuredSession({
        elements: [
          {
            kind: "CIRCUIT",
            circuit: {
              id: "c",
              repeatCount: 1,
              nature: "TOURS",
              format: { key: "DEATH_BY", settings: { windowSeconds: 60 } },
              exercises: [
                exerciseActivity("A", repetitionParameters(5, 1, 0), { format: { key: "DEATH_BY", settings: { incrementPerRound: 1 } } }),
                exerciseActivity("B", durationParameters(10, 1, 0), { format: { key: "DEATH_BY", settings: { incrementPerRound: 10 } } }),
              ],
            },
          },
        ],
        stopPoints: [],
      }),
    );
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 45 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "B", end: "TIMED", plannedMs: 10 * S });
    expect(sim.send({ type: "NEXT", validated: true, target: sim.target }, 46 * S).outcome).toBe("REJECTED");
    sim.at(55);
    expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
    sim.at(60);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 115 * S); // A au rang 2 : 6 répétitions
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "B", plannedMs: 20 * S });
    sim.at(120); // B interrompu après 5 s
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    sim.send({ type: "SUBMIT", payload: { partialDurationMs: 5 * S }, target: sim.target }, 125 * S);
    expect(results(sim)[0]).toMatchObject({ acquiredRanks: 1, rankReached: 2, reason: "WINDOW_MISSED", failedExerciseId: "B", partialDurationMs: 5 * S, partialRepetitions: null });
  });

  it("limite de l'intervalle (complément du 5 novembre) : 10 s + 10 s / 60 s — cinq rangs, arrêt avant le rang 6, sans saisie", () => {
    const { sim } = single(durationParameters(10, 1, 0), 60, 10);
    sim.send({ type: "START" }, 0);
    for (let rank = 1; rank <= 5; rank += 1) {
      expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", plannedMs: rank * 10 * S });
      sim.at((rank - 1) * 60 + rank * 10);
      expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
      sim.at(rank * 60);
    }
    expect(results(sim)[0]).toMatchObject({ acquiredRanks: 5, rankReached: 5, reason: "INTERVAL_LIMIT_REACHED", interruptedKey: null, partialRepetitions: null, partialDurationMs: null });
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "after" });
  });

  it("limite de l'intervalle dès le premier rang : aucun rang lancé", () => {
    const { sim } = single(durationParameters(60, 1, 0), 60, 10);
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "after" });
    expect(results(sim)[0]).toMatchObject({ acquiredRanks: 0, rankReached: 0, reason: "INTERVAL_LIMIT_REACHED" });
  });

  it("limite de l'intervalle : deux côtés et pause entre côtés comptés (10 s × 2 + 5 s, + 10 s / 60 s : arrêt avant le rang 3)", () => {
    const { sim } = single(durationParameters(10, 1, 0, { sideMode: "LEFT_RIGHT", sideRecoverySeconds: 5 }), 60, 10);
    sim.send({ type: "START" }, 0);
    sim.at(25);
    expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
    sim.at(60);
    sim.at(105); // 2 × 20 s + 5 s
    sim.at(120);
    expect(results(sim)[0]).toMatchObject({ acquiredRanks: 2, reason: "INTERVAL_LIMIT_REACHED" });
  });

  it("T18 : objectif calculé non plafonné par les bornes de saisie (99 + 1 / rang)", () => {
    const { sim } = single(repetitionParameters(99, 1, 0), 60, 1);
    sim.send({ type: "START" }, 0);
    for (let rank = 1; rank <= 2; rank += 1) {
      sim.send({ type: "NEXT", validated: true, target: sim.target }, ((rank - 1) * 60 + 10) * S);
      sim.at(rank * 60);
    }
    expect(targetOf(sim)).toBe(101);
  });

  it("T16 : Death by dans un Circuit standard groupé — fin locale, le Circuit continue, redémarrage au départ au passage suivant", () => {
    const { sim } = simOf(
      structuredSession({
        elements: [
          {
            kind: "CIRCUIT",
            circuit: {
              id: "c",
              repeatCount: 2,
              nature: "TOURS",
              exercises: [deathBy("D", repetitionParameters(3, 1, 0), 60, 2), exerciseActivity("R", repetitionParameters(8, 1, 0))],
            },
          },
        ],
        stopPoints: [],
      }),
    );
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 10 * S);
    sim.at(60);
    expect(targetOf(sim)).toBe(5);
    sim.at(120); // rang 2 manqué
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 2 }, target: sim.target }, 121 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "R" });
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 130 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "D", windowStart: true });
    expect(targetOf(sim)).toBe(3);
  });

  it("T17 : Death by alterné 60 s / 90 s — fenêtres locales successives, rangs par mouvement, premier échec collectif", () => {
    const { sim } = simOf(
      structuredSession({
        elements: [
          {
            kind: "CIRCUIT",
            circuit: {
              id: "c",
              repeatCount: 1,
              nature: "SERIES",
              format: { key: "DEATH_BY", settings: {} } as ElementFormat,
              exercises: [deathBy("A", repetitionParameters(2, 1, 0), 60, 1), deathBy("B", repetitionParameters(3, 1, 0), 90, 1)],
            },
          },
          { kind: "EXERCISE", exercise: exerciseActivity("after", repetitionParameters(5, 1, 0)) },
        ],
        stopPoints: [],
      }),
    );
    sim.send({ type: "START" }, 0);
    const played: string[] = [];
    played.push(`${sim.state.leaf!.spec.exerciseId}:${targetOf(sim)}`);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 10 * S);
    sim.at(60);
    played.push(`${sim.state.leaf!.spec.exerciseId}:${targetOf(sim)}`);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 70 * S);
    sim.at(149);
    expect(sim.state.leaf?.spec.kind).toBe("WINDOW_REST");
    sim.at(150);
    played.push(`${sim.state.leaf!.spec.exerciseId}:${targetOf(sim)}`);
    expect(played).toEqual(["A:2", "B:3", "A:3"]);
    sim.at(210); // A manque son rang 2 : le Circuit s'arrête
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 1 }, target: sim.target }, 211 * S);
    expect(results(sim)[0]).toMatchObject({ acquiredRanks: 1, acquired: { A: 1, B: 1 }, rankReached: 2, failedExerciseId: "A", reason: "WINDOW_MISSED" });
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "after" });
  });

  it("Arrêt (abandon, arbitrage du 18/11/2026) : répétitions saisies de la fenêtre en cours ; Réinitialiser refusé (Q2)", () => {
    const { sim } = single();
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", validated: true, target: sim.target }, 20 * S);
    sim.at(70);
    expect(sim.send({ type: "RESET", target: sim.target }, 71 * S).outcome).toBe("REJECTED");
    sim.send({ type: "STOP", payload: { partialRepetitions: 3 }, atMs: 72 * S }, 75 * S);
    expect(sim.state.status).toBe("FINISHED");
    expect(results(sim)[0]).toMatchObject({ acquiredRanks: 1, rankReached: 2, reason: "ABANDONED", partialRepetitions: 3, completion: "INCOMPLETE" });
  });

  it("signaux : 3 bips avant l'échéance de chaque fenêtre", () => {
    const { sim } = single();
    sim.send({ type: "START" }, 0);
    expect(stepSignalsBetween(sim.state, 50 * S, 60 * S).filter((signal) => signal.kind === "COUNTDOWN").map((signal) => signal.atMs)).toEqual([57 * S, 58 * S, 59 * S]);
  });
});
