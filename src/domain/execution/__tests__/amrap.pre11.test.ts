import { describe, expect, it } from "@jest/globals";

import { allFailureParameters, durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import type { ElementFormat } from "@/domain/sessions/formats";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";

import { launchabilityOf, type AmrapScopeConfig } from "../plan";
import { executionEnv } from "../policies";
import { amrapRoundValue, type AmrapResult } from "../policies/amrap";
import { estimatedDuration, projectExecution } from "../projection";
import { stepSignalsBetween } from "../signals";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * PRE-11 (T3) — politique AMRAP (conception consolidée §12.1, §12.5, complément du 5 novembre ; FMT-26, FMT-27 ; D-19, D-20 ; D1, D3,
 * Q3, Q4 ; cas T12, T13, T14, T25) et arbitrages de Hermann du 18/11/2026 (spec PRE-11 §5 point 30).
 */

const S = 1000;
const MIN = 60 * S;

function loopMember(id: string, parameters: ExecutionParameters, increment = 0, extra: { postActivityRecoverySeconds?: number } = {}) {
  return exerciseActivity(id, parameters, { format: { key: "AMRAP", settings: { incrementPerRound: increment } }, ...extra });
}

function buyInMember(id: string, parameters: ExecutionParameters) {
  return exerciseActivity(id, parameters, { format: { key: "AMRAP", settings: { incrementPerRound: 0, circuitRole: 1 } } });
}

function carrier(blocks: number, blockSeconds: number, restSeconds: number, exercises: ReturnType<typeof exerciseActivity>[]) {
  const format: ElementFormat = { key: "AMRAP", settings: { blockSeconds, restBetweenBlocksSeconds: restSeconds } };
  return { kind: "CIRCUIT" as const, circuit: { id: "c", repeatCount: blocks, nature: "TOURS" as const, format, exercises } };
}

function simOf(session: ReturnType<typeof structuredSession>) {
  const plan = planOf(session);
  return { plan, sim: new Simulation(executionEnv(plan)) };
}

/** AMRAP autonome de `seconds`, 10 répétitions (+ incrément), puis un Exercice libre. */
function single(seconds = 12 * 60, increment = 0, parameters: ExecutionParameters = repetitionParameters(10, 1, 0)) {
  return simOf(
    structuredSession({
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("E", parameters, { format: { key: "AMRAP", settings: { durationSeconds: seconds, incrementPerRound: increment } } }) },
        { kind: "EXERCISE", exercise: exerciseActivity("after", repetitionParameters(5, 1, 0)) },
      ],
      stopPoints: [],
    }),
  );
}

function blockResults(sim: Simulation): AmrapResult[] {
  return [...sim.results.values()]
    .flatMap((change) => (change.type === "SCOPE" && (change.result as { format?: string }).format === "AMRAP" ? [change.result as AmrapResult] : []))
    .sort((a, b) => a.block - b.block);
}

function next(sim: Simulation, atMs: number, advance?: "ROUND" | "DURATION") {
  return sim.send({ type: "NEXT", validated: true, target: sim.target, ...(advance !== undefined ? { advance } : {}) }, atMs);
}

describe("PRE-11 T3 — AMRAP", () => {
  it("lançable ; une portée AMRAP par bloc ; durée estimée = durée du bloc", () => {
    const { plan } = single(10 * 60);
    expect(launchabilityOf(createSessionSnapshot(structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("E", repetitionParameters(10, 1, 0), { format: { key: "AMRAP", settings: { durationSeconds: 600, incrementPerRound: 0 } } }) }], stopPoints: [] })))).toEqual({ status: "launchable" });
    const scope = plan.items.find((item) => item.type === "SCOPE");
    expect(scope?.type === "SCOPE" && scope.scope.pilot).toBe("AMRAP");
    const config = (scope?.type === "SCOPE" ? scope.scope.config : null) as AmrapScopeConfig;
    expect(config.blockMs).toBe(10 * MIN);
    expect(config.loop.map((item) => item.leaf.kind)).toEqual(["ACTIVITY"]);
    // Durée estimée : le bloc (exact) ; l'Exercice libre qui suit, en Répétitions sans cadence, est une composante inconnue.
    expect(estimatedDuration(plan)).toEqual({ kind: "lowerBound", ms: 10 * MIN });
  });

  it("D-19 : un appui acquiert un tour ; la boucle recommence ; le grand chrono décompte le bloc ; « + Tour » au dernier exercice", () => {
    const { plan, sim } = single(10 * 60);
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", windowStart: true, context: { circuit: { tour: 1, count: 0 } } });
    const view = projectExecution(plan, sim.state, 30 * S);
    expect(view.timer).toEqual({ kind: "COUNTDOWN", remainingMs: 10 * MIN - 30 * S, totalMs: 10 * MIN, elapsedMs: 30 * S });
    expect(view.format).toMatchObject({ kind: "AMRAP", phase: "WORK", command: { kind: "ROUND", advance: "ROUND", duration: false }, amrap: { round: 1, completedRounds: 0, block: 1, blocks: 1 } });
    expect(view.commands.reset).toBe(false);
    next(sim, 40 * S, "ROUND");
    // T10 analogue : une seconde confirmation de la même étape n'acquiert rien.
    const again = sim.send({ type: "NEXT", validated: true, target: `${sim.state.leaf?.spec.key ?? ""}#0` }, 41 * S);
    expect(again.outcome).not.toBe("APPLIED");
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", context: { circuit: { tour: 2 } } });
    expect(projectExecution(plan, sim.state, 50 * S).format?.amrap).toMatchObject({ round: 2, completedRounds: 1 });
    expect(projectExecution(plan, sim.state, 50 * S).next).toMatchObject({ kind: "ACTIVITY", name: "Mouvement E" });
  });

  it("incrément signé : objectif recalculé à chaque tour, borné à 1, sans fin de la boucle (complément du 5 novembre)", () => {
    expect([1, 2, 3, 4, 5].map((round) => amrapRoundValue(5, -2, round))).toEqual([5, 3, 1, 1, 1]);
    expect([1, 2, 3].map((round) => amrapRoundValue(10, 2, round))).toEqual([10, 12, 14]);
    const { sim } = single(10 * 60, -4);
    sim.send({ type: "START" }, 0);
    const targets: number[] = [];
    for (let round = 1; round <= 4; round += 1) {
      const target = sim.state.leaf?.spec.target;
      targets.push(target?.kind === "NUMBER" ? target.value : -1);
      next(sim, round * 10 * S, "ROUND");
    }
    expect(targets).toEqual([10, 6, 2, 1]);
  });

  it("D1, D-20 : l'échéance pendant une Série arrête net — Clôture « Fin du bloc », partiel de l'exercice en cours, puis la Séance continue (D3)", () => {
    const { plan, sim } = single(2 * 60);
    sim.send({ type: "START" }, 0);
    next(sim, 30 * S, "ROUND");
    next(sim, 70 * S, "ROUND");
    sim.at(120);
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    const closure = projectExecution(plan, sim.state, 121 * S);
    expect(closure.format).toMatchObject({ kind: "AMRAP", phase: "CLOSURE", interrupted: { name: "Mouvement E", target: { kind: "NUMBER", value: 10 }, mode: "REPETITIONS" } });
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 6 }, target: sim.target }, 130 * S);
    expect(blockResults(sim)[0]).toMatchObject({ completedRounds: 2, partialRepetitions: 6, interruptedKey: expect.stringContaining("/r3/"), stopped: false });
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "after" });
  });

  it("Q4 : confirmation pile à l'échéance acquise — aucune saisie, le bloc se ferme sans Clôture", () => {
    const { sim } = single(60);
    sim.send({ type: "START" }, 0);
    next(sim, 60 * S, "ROUND");
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "after" });
    expect(blockResults(sim)[0]).toMatchObject({ completedRounds: 1, interruptedKey: null, partialRepetitions: null });
  });

  it("T14, Q3, D1 : Récupération à chaque tour dans le temps du bloc ; « Suivant » la passe ; l'échéance pendant la Récupération ne demande rien", () => {
    const { plan, sim } = simOf(
      structuredSession({
        elements: [carrier(1, 60, 0, [loopMember("A", repetitionParameters(10, 1, 0)), loopMember("B", repetitionParameters(5, 1, 0), 0, { postActivityRecoverySeconds: 30 })])],
        stopPoints: [],
      }),
    );
    sim.send({ type: "START" }, 0);
    expect(projectExecution(plan, sim.state, 1 * S).format?.command).toMatchObject({ kind: "NEXT", advance: "NEXT" });
    next(sim, 10 * S);
    expect(projectExecution(plan, sim.state, 11 * S).format?.command).toMatchObject({ kind: "ROUND" });
    next(sim, 20 * S, "ROUND");
    expect(sim.state.leaf?.spec.kind).toBe("POST_ACTIVITY_RECOVERY");
    expect(projectExecution(plan, sim.state, 21 * S).format).toMatchObject({ command: { kind: "NEXT" }, amrap: { completedRounds: 1 } });
    // Q3 : « Suivant » pendant la Récupération ; l'échéance continue.
    next(sim, 25 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "A", context: { circuit: { tour: 2 } } });
    next(sim, 30 * S);
    next(sim, 35 * S, "ROUND");
    expect(sim.state.leaf?.spec.kind).toBe("POST_ACTIVITY_RECOVERY");
    sim.at(60); // échéance pendant la Récupération : rien à saisir, le bloc se ferme (dernier élément : fin de la Séance)
    expect(sim.state.status).toBe("FINISHED");
    expect(blockResults(sim)[0]).toMatchObject({ completedRounds: 2, interruptedKey: null });
  });

  it("T12 : un exercice en durée commencé avant l'échéance est fermé par la borne ; sa durée tenue se saisit à la Clôture", () => {
    const { plan, sim } = simOf(
      structuredSession({
        elements: [carrier(1, 60, 0, [loopMember("A", repetitionParameters(10, 1, 0)), loopMember("P", durationParameters(60, 1, 0))])],
        stopPoints: [],
      }),
    );
    sim.send({ type: "START" }, 0);
    expect(projectExecution(plan, sim.state, 1 * S).format?.duration).toMatchObject({ state: "PENDING", name: "Mouvement P", totalMs: 60 * S });
    // « Suivant » avant un exercice en durée le lance (advance DURATION, comme le For time).
    next(sim, 10 * S, "DURATION");
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "P", end: "TIMED" });
    expect(projectExecution(plan, sim.state, 11 * S).format).toMatchObject({ duration: { state: "RUNNING" }, command: { kind: "ROUND", duration: true } });
    // Retenue et reprise : la durée s'arrête, le bloc continue.
    expect(sim.send({ type: "HOLD", target: sim.target }, 20 * S).outcome).toBe("APPLIED");
    expect(projectExecution(plan, sim.state, 25 * S).format?.duration).toMatchObject({ state: "HELD" });
    sim.send({ type: "RELEASE", target: sim.target }, 30 * S);
    sim.at(60);
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    expect(projectExecution(plan, sim.state, 61 * S).format?.interrupted).toMatchObject({ name: "Mouvement P", mode: "DURATION" });
    sim.send({ type: "SUBMIT", payload: { partialDurationMs: 20 * S }, target: sim.target }, 62 * S);
    expect(blockResults(sim)[0]).toMatchObject({ completedRounds: 0, partialRepetitions: null, partialDurationMs: 20 * S });
  });

  it("T13 : buy-in une seule fois dans le premier bloc, dans sa borne ; repos entre les blocs ; bloc 2 réinitialisé (objectifs, tours)", () => {
    const { plan, sim } = simOf(
      structuredSession({
        elements: [carrier(2, 60, 30, [buyInMember("IN", repetitionParameters(20, 1, 0)), loopMember("L", repetitionParameters(10, 1, 0), 2)])],
        stopPoints: [],
      }),
    );
    expect(estimatedDuration(plan)).toEqual({ kind: "exact", ms: (60 + 30 + 60) * S });
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "IN", windowStart: true });
    expect(projectExecution(plan, sim.state, 1 * S).format?.command).toMatchObject({ kind: "NEXT", segment: "BUY_IN" });
    next(sim, 20 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "L", target: { kind: "NUMBER", value: 10 } });
    next(sim, 30 * S, "ROUND");
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "L", target: { kind: "NUMBER", value: 12 } });
    sim.at(60);
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 4 }, target: sim.target }, 61 * S);
    expect(sim.state.leaf?.spec.kind).toBe("POST_ACTIVITY_RECOVERY");
    sim.at(91);
    // Bloc 2 : pas de buy-in, objectifs et tours réinitialisés, bip long au départ.
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "L", windowStart: true, target: { kind: "NUMBER", value: 10 } });
    expect(projectExecution(plan, sim.state, 92 * S).format?.amrap).toMatchObject({ round: 1, completedRounds: 0, block: 2, blocks: 2 });
    sim.at(151);
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 3 }, target: sim.target }, 152 * S);
    const [first, second] = blockResults(sim);
    expect(first).toMatchObject({ block: 1, completedRounds: 1, partialRepetitions: 4 });
    expect(second).toMatchObject({ block: 2, completedRounds: 0, partialRepetitions: 3 });
  });

  it("FMT-26 : buy-in À l'échec — « Suivant » lance la boucle sans saisie ; répétitions demandées à la Clôture du bloc, après le partiel", () => {
    const { plan, sim } = simOf(
      structuredSession({
        elements: [carrier(1, 60, 0, [buyInMember("MAX", allFailureParameters(1, 0)), loopMember("L", repetitionParameters(10, 1, 0))])],
        stopPoints: [],
      }),
    );
    sim.send({ type: "START" }, 0);
    next(sim, 15 * S);
    expect(sim.state.leaf?.spec).toMatchObject({ exerciseId: "L" });
    sim.at(60);
    expect(projectExecution(plan, sim.state, 61 * S).format?.interrupted).toMatchObject({ name: "Mouvement L" });
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 5 }, target: sim.target }, 62 * S);
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    expect(projectExecution(plan, sim.state, 63 * S).format?.interrupted).toMatchObject({ name: "Mouvement MAX", target: { kind: "FAILURE" } });
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 32 }, target: sim.target }, 64 * S);
    expect(blockResults(sim)[0]).toMatchObject({ completedRounds: 0, partialRepetitions: 5, buyIn: [{ partialRepetitions: 32 }] });
  });

  it("T25 : retour au premier plan après l'échéance — l'étape en attente de Suivant est fermée non validée, la Clôture est présentée", () => {
    const { sim } = single(60);
    sim.send({ type: "START" }, 0);
    sim.at(200);
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    const step = sim.stepResults().find((result) => result.exerciseId === "E");
    expect(step?.completion).not.toBe("COMPLETED");
  });

  it("Arrêt sans Pause (arbitrage du 18/11/2026) : répétitions saisies de l'exercice en cours ; Réinitialiser refusé", () => {
    const { sim } = single(10 * 60);
    sim.send({ type: "START" }, 0);
    next(sim, 20 * S, "ROUND");
    expect(sim.send({ type: "RESET", target: sim.target }, 25 * S).outcome).not.toBe("APPLIED");
    sim.send({ type: "STOP", payload: { partialRepetitions: 7 } }, 30 * S);
    expect(sim.state.status).toBe("FINISHED");
    expect(blockResults(sim)[0]).toMatchObject({ completedRounds: 1, partialRepetitions: 7, stopped: true });
  });

  it("sons : bip long au début du bloc (première étape), 3 bips avant l'échéance du bloc", () => {
    const { sim } = single(60);
    sim.send({ type: "START" }, 0);
    const signals = stepSignalsBetween(sim.state, 0, 60 * S);
    expect(signals.filter((signal) => signal.kind === "COUNTDOWN").map((signal) => signal.atMs)).toEqual(expect.arrayContaining([57 * S, 58 * S, 59 * S]));
  });
});
