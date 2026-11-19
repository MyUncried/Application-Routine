import { describe, expect, it } from "@jest/globals";

import { allFailureParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ElementFormat } from "@/domain/sessions/formats";

import { executionEnv } from "../policies";
import { isAmrapMax, type AmrapResult } from "../policies/amrap";
import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";
import type { AmrapScopeConfig } from "../plan";

/**
 * D-531 / RM-270 à RM-272 (Hermann, 19/11/2026) — « Max » (À l'échec) : AMRAP à un seul mouvement en Max. Le chronomètre du bloc
 * continue ; à chaque échec, « Suivant » puis saisie de la série ; séries additionnées, score cumulé ; ni « + Tour », ni annonce de tour,
 * ni compteur de tours. Buy-in À l'échec : règle existante (saisie à la clôture du bloc), inchangée.
 */

const S = 1000;

function simOf(session: ReturnType<typeof structuredSession>) {
  const plan = planOf(session);
  return { plan, sim: new Simulation(executionEnv(plan)) };
}

/** AMRAP autonome de `seconds`, un seul mouvement à l'échec, puis un Exercice libre. */
function maxSingle(seconds = 120) {
  return simOf(
    structuredSession({
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("E", allFailureParameters(1, 0), { format: { key: "AMRAP", settings: { durationSeconds: seconds, incrementPerRound: 0 } } }) },
        { kind: "EXERCISE", exercise: exerciseActivity("after", repetitionParameters(5, 1, 0)) },
      ],
      stopPoints: [],
    }),
  );
}

function blockResult(sim: Simulation): AmrapResult | undefined {
  return [...sim.results.values()].flatMap((change) => (change.type === "SCOPE" && (change.result as { format?: string }).format === "AMRAP" ? [change.result as AmrapResult] : []))[0];
}

function next(sim: Simulation, atMs: number) {
  return sim.send({ type: "NEXT", validated: true, target: sim.target }, atMs);
}

function declare(sim: Simulation, atMs: number, key: string, repetitions: number) {
  return sim.send({ type: "DECLARE", payload: { amrapMax: { key, repetitions } } }, atMs);
}

describe("D-531 — AMRAP à un seul mouvement en Max", () => {
  it("reconnu : une seule boucle d'un mouvement à l'échec ; un mouvement à l'objectif ne l'est pas", () => {
    const { plan } = maxSingle();
    const scope = plan.items.find((item) => item.type === "SCOPE");
    expect(scope?.type === "SCOPE" && isAmrapMax(scope.scope.config as AmrapScopeConfig)).toBe(true);
    const target = simOf(
      structuredSession({
        elements: [{ kind: "EXERCISE", exercise: exerciseActivity("E", repetitionParameters(10, 1, 0), { format: { key: "AMRAP", settings: { durationSeconds: 120, incrementPerRound: 0 } } }) }],
        stopPoints: [],
      }),
    );
    const other = target.plan.items.find((item) => item.type === "SCOPE");
    expect(other?.type === "SCOPE" && isAmrapMax(other.scope.config as AmrapScopeConfig)).toBe(false);
  });

  it("« Suivant » (jamais « + Tour »), aucune annonce de tour, aucun compteur de tours ; le chrono du bloc continue", () => {
    const { plan, sim } = maxSingle();
    sim.send({ type: "START" }, 0);
    const view = projectExecution(plan, sim.state, 10 * S);
    expect(view.format).toMatchObject({ kind: "AMRAP", phase: "WORK", command: { kind: "NEXT", advance: "NEXT" }, roundStart: null, amrap: { max: { score: 0, toDeclare: null } } });
    expect(view.tour).toBeNull();
    expect(view.timer).toMatchObject({ kind: "COUNTDOWN", remainingMs: 110 * S });
  });

  it("chaque échec : « Suivant » puis saisie ; les séries s'additionnent (score cumulé) ; total = score", () => {
    const { plan, sim } = maxSingle();
    sim.send({ type: "START" }, 0);
    next(sim, 20 * S);
    const first = projectExecution(plan, sim.state, 21 * S).format?.amrap?.max;
    expect(first?.toDeclare).toEqual(expect.stringContaining("/r1/"));
    // La série suivante a déjà commencé : le chrono du bloc ne s'arrête pas pendant la saisie.
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "E" });
    expect(declare(sim, 25 * S, first!.toDeclare!, 12).outcome).toBe("APPLIED");
    expect(projectExecution(plan, sim.state, 26 * S).format?.amrap?.max).toEqual({ score: 12, toDeclare: null });
    next(sim, 50 * S);
    const second = projectExecution(plan, sim.state, 51 * S).format?.amrap?.max?.toDeclare;
    declare(sim, 55 * S, second!, 9);
    expect(projectExecution(plan, sim.state, 56 * S).format?.amrap?.max?.score).toBe(21);
    // Échéance pendant la troisième série : partiel saisi à la Clôture (règle existante), puis la Séance continue.
    sim.at(120);
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 4 }, target: sim.target }, 125 * S);
    const result = blockResult(sim)!;
    expect(result.maxSeries).toEqual([
      { key: expect.stringContaining("/r1/"), repetitions: 12 },
      { key: expect.stringContaining("/r2/"), repetitions: 9 },
    ]);
    expect(result).toMatchObject({ partialRepetitions: 4, interruptedKey: expect.stringContaining("/r3/") });
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "after" });
  });

  it("saisie refermée (croix) ou non faite : redemandée à la Clôture du bloc, après le partiel", () => {
    const { plan, sim } = maxSingle(60);
    sim.send({ type: "START" }, 0);
    next(sim, 20 * S);
    const key = projectExecution(plan, sim.state, 21 * S).format?.amrap?.max?.toDeclare ?? "";
    expect(sim.send({ type: "DECLARE", payload: { amrapMax: { key, skip: true } } }, 22 * S).outcome).toBe("APPLIED");
    expect(projectExecution(plan, sim.state, 23 * S).format?.amrap?.max).toEqual({ score: 0, toDeclare: null });
    sim.at(60);
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 3 }, target: sim.target }, 61 * S);
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 11 }, target: sim.target }, 62 * S);
    expect(blockResult(sim)!.maxSeries).toEqual([{ key, repetitions: 11 }]);
  });

  it("une saisie hors Max ou d'une série inconnue est refusée ; l'AMRAP à l'objectif garde « + Tour »", () => {
    const { sim } = maxSingle();
    sim.send({ type: "START" }, 0);
    expect(declare(sim, 5 * S, "inconnue", 3).outcome).not.toBe("APPLIED");
    const objective = simOf(
      structuredSession({
        elements: [{ kind: "EXERCISE", exercise: exerciseActivity("E", repetitionParameters(10, 1, 0), { format: { key: "AMRAP", settings: { durationSeconds: 120, incrementPerRound: 0 } } }) }],
        stopPoints: [],
      }),
    );
    objective.sim.send({ type: "START" }, 0);
    const view = projectExecution(objective.plan, objective.sim.state, 5 * S);
    expect(view.format).toMatchObject({ command: { kind: "ROUND" }, amrap: { max: null } });
    expect(view.format?.roundStart).toMatchObject({ rank: 1 });
  });

  it("buy-in À l'échec (règle existante) : inchangé — enchaînement sans saisie, répétitions à la clôture du bloc", () => {
    const format: ElementFormat = { key: "AMRAP", settings: { blockSeconds: 60, restBetweenBlocksSeconds: 0 } };
    const { plan, sim } = simOf(
      structuredSession({
        elements: [
          {
            kind: "CIRCUIT",
            circuit: {
              id: "c",
              repeatCount: 1,
              nature: "TOURS",
              format,
              exercises: [
                exerciseActivity("B", allFailureParameters(1, 0), { format: { key: "AMRAP", settings: { incrementPerRound: 0, circuitRole: 1 } } }),
                exerciseActivity("E", repetitionParameters(10, 1, 0), { format: { key: "AMRAP", settings: { incrementPerRound: 0 } } }),
              ],
            },
          },
        ],
        stopPoints: [],
      }),
    );
    sim.send({ type: "START" }, 0);
    next(sim, 10 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "E" });
    expect(projectExecution(plan, sim.state, 11 * S).format?.amrap?.max).toBeNull();
    sim.at(60);
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 2 }, target: sim.target }, 61 * S);
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 30 }, target: sim.target }, 62 * S);
    expect(blockResult(sim)).toMatchObject({ buyIn: [{ partialRepetitions: 30 }] });
    expect(blockResult(sim)?.maxSeries).toBeUndefined();
  });
});
