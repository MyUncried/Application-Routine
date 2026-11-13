import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";

import { launchabilityOf } from "../plan";
import { executionEnv } from "../policies";
import type { ForTimeResult } from "../policies/forTime";
import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * PRE-11 (T1) — politique For time (conception consolidée §12.3, §12.5 ; FMT-30 à FMT-32 ; D3, D6, Q4 ; cas T15).
 */

const S = 1000;

function forTimeSession(capSeconds: number | null, extra: { readonly recovery?: number } = {}) {
  return structuredSession({
    elements: [
      {
        kind: "EXERCISE",
        exercise: exerciseActivity("F", repetitionParameters(21, 3, 10), {
          format: { key: "FOR_TIME", settings: capSeconds === null ? {} : { timeCapSeconds: capSeconds } },
          ...(extra.recovery !== undefined ? { postActivityRecoverySeconds: extra.recovery } : {}),
        }),
      },
      { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(30, 1, 0)) },
    ],
    stopPoints: [],
  });
}

function simOf(capSeconds: number | null, extra: { readonly recovery?: number } = {}) {
  const plan = planOf(forTimeSession(capSeconds, extra));
  return { plan, sim: new Simulation(executionEnv(plan)) };
}

function forTimeResult(sim: Simulation): ForTimeResult | undefined {
  const change = [...sim.results.values()].find((candidate) => candidate.type === "SCOPE" && (candidate.result as { format?: string }).format === "FOR_TIME");
  return change?.result as ForTimeResult | undefined;
}

describe("PRE-11 T1 — For time", () => {
  it("lançable (Exercice autonome) ; ses Séries et pauses forment une portée, la récupération reste après", () => {
    const session = forTimeSession(600, { recovery: 60 });
    expect(launchabilityOf(createSessionSnapshot(session))).toEqual({ status: "launchable" });
    const plan = planOf(session);
    const scope = plan.items.find((item) => item.type === "SCOPE");
    expect(scope?.type === "SCOPE" && scope.scope.pilot).toBe("FOR_TIME");
    const config = scope?.type === "SCOPE" ? (scope.scope.config as { capMs: number; items: { type: string; leaf?: { kind: string } }[] }) : null;
    expect(config?.capMs).toBe(600 * S);
    expect(config?.items.map((item) => item.leaf?.kind)).toEqual(["ACTIVITY", "SERIES_PAUSE", "ACTIVITY", "SERIES_PAUSE", "ACTIVITY"]);
    const after = plan.items[plan.items.indexOf(scope!) + 1];
    expect(after?.type === "LEAF" && after.leaf.kind).toBe("POST_ACTIVITY_RECOVERY");
  });

  it("fin normale : temps réalisé lu sur le chronomètre (Pause exclue), Clôture bloquante, puis enchaînement automatique (D3)", () => {
    const { plan, sim } = simOf(600);
    sim.send({ type: "START" }, 0);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "F", series: 1 });
    sim.send({ type: "NEXT", target: sim.target }, 40 * S); // S1 en 40 s
    sim.at(50); // pause de série 10 s
    sim.send({ type: "PAUSE" }, 60 * S);
    sim.send({ type: "RESUME" }, 90 * S); // 30 s de Pause, hors temps réalisé
    sim.send({ type: "NEXT", target: sim.target }, 120 * S); // S2
    sim.at(130);
    // Pendant le travail : le grand chrono compte le temps réalisé de l'élément, l'anneau va jusqu'à la borne.
    const during = projectExecution(plan, sim.state, 135 * S);
    expect(during.format).toMatchObject({ kind: "FOR_TIME", phase: "WORK", capMs: 600 * S, completedActivities: 2, totalActivities: 3 });
    expect(during.timer).toEqual({ kind: "STOPWATCH", elapsedMs: 105 * S, nominalMs: 600 * S });
    sim.send({ type: "NEXT", target: sim.target }, 160 * S); // S3 : fin du travail
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "CLOSURE", end: "INTERACTION" });
    // Aucune référence ne court pendant la saisie : rien ne se passe en attendant.
    sim.at(1000);
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    const closure = projectExecution(plan, sim.state, 1000 * S);
    expect(closure.format).toMatchObject({ phase: "CLOSURE", elapsedMs: 130 * S, capReached: false, interrupted: null });
    expect(closure.timer).toEqual({ kind: "NONE" });
    expect(closure.commands.next).toBe(false);
    sim.send({ type: "SUBMIT", payload: {} }, 1000 * S);
    // La pause qui suit la dernière Série reste après l'élément (hors temps réalisé), puis l'Exercice suivant.
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "SERIES_PAUSE", exerciseId: "F" });
    sim.at(1010);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", exerciseId: "B" });
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 130 * S, capReached: false, completedActivities: 3, totalActivities: 3, partialRepetitions: null });
  });

  it("borne atteinte : l'étape en cours est fermée, temps réalisé = borne, Clôture avec le partiel du travail interrompu", () => {
    const { plan, sim } = simOf(100);
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", target: sim.target }, 50 * S); // S1
    sim.at(60); // pause 10 s ; S2 ouverte à 60 s
    sim.at(100); // borne
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    const closure = projectExecution(plan, sim.state, 100 * S);
    expect(closure.format).toMatchObject({ phase: "CLOSURE", elapsedMs: 100 * S, capReached: true, completedActivities: 1, interrupted: { name: expect.any(String), mode: "REPETITIONS" } });
    sim.send({ type: "SUBMIT", payload: { partialRepetitions: 12 } }, 105 * S);
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 100 * S, capReached: true, completedActivities: 1, partialRepetitions: 12 });
    const s2 = sim.stepResults().find((step) => step.exerciseId === "F" && step.series === 2);
    expect(s2?.completion).toBe("CLOSED_BY_PARENT");
    expect(sim.state.leaf?.spec.kind).toBe("SERIES_PAUSE");
  });

  it("Q4 : travail confirmé pile à la borne, acquis (fin normale, pas de partiel)", () => {
    const { sim } = simOf(40);
    sim.send({ type: "START" }, 0);
    sim.send({ type: "NEXT", target: sim.target }, 10 * S);
    sim.at(20);
    sim.send({ type: "NEXT", target: sim.target }, 25 * S);
    sim.at(35);
    sim.send({ type: "NEXT", target: sim.target }, 40 * S); // pile à la borne : la commande passe avant l'échéance
    expect(sim.state.leaf?.spec.kind).toBe("CLOSURE");
    sim.send({ type: "SUBMIT", payload: {} }, 41 * S);
    expect(forTimeResult(sim)).toMatchObject({ measuredMs: 40 * S, capReached: false, completedActivities: 3, interruptedKey: null });
  });

  it("sans borne (D6) : aucune échéance d'élément ; le travail se termine à Suivant", () => {
    const { plan, sim } = simOf(null);
    sim.send({ type: "START" }, 0);
    expect(projectExecution(plan, sim.state, 0).format).toMatchObject({ capMs: null });
    expect(sim.state.refs.some((ref) => ref.name === "cap")).toBe(false);
    sim.at(3600);
    expect(sim.state.leaf?.spec).toMatchObject({ kind: "ACTIVITY", series: 1 });
  });
});
