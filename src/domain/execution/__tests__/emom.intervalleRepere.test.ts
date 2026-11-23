import { describe, expect, it } from "@jest/globals";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";

import { executionEnv } from "../policies";
import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * Constat e) de la recette du 18/11/2026 (Hermann, ligne n° 50, Circuit EMOM « dans chaque intervalle », A puis B dans la même minute :
 * « Il faut qu'on passe d'une série +1 à chaque changement de mouvement, par intervalle, le total de série = nombre de mouvements par
 * intervalle » ; « pendant le repos le nombre de tours disparait. Il faut le nombre de tours visible »).
 */

const S = 1000;

function emom(id: string, count: number) {
  return exerciseActivity(id, repetitionParameters(10, count, 0), { format: { key: "EMOM", settings: {} } });
}

function run(count: number) {
  const circuit = { id: "c", repeatCount: count, nature: "TOURS", format: { key: "EMOM", settings: { windowSeconds: 60 } }, exercises: [emom("A", count), emom("B", count)] };
  const plan = planOf(structuredSession({ elements: [{ kind: "CIRCUIT", circuit } as never], stopPoints: [] }));
  const sim = new Simulation(executionEnv(plan));
  sim.send({ type: "START" }, 0);
  const label = (c: { series: { current: number; total: number } | null; tour: { current: number; total: number } | null } | null) =>
    c === null ? "rien" : `S${c.series?.current ?? "-"}/${c.series?.total ?? "-"}T${c.tour?.current ?? "-"}/${c.tour?.total ?? "-"}`;
  const work: string[] = [];
  const rest: string[] = [];
  let at = 0;
  for (let guard = 0; guard < 60 && sim.state.status !== "FINISHED"; guard += 1) {
    const spec = sim.state.leaf?.spec;
    const view = projectExecution(plan, sim.state, at * S);
    if (spec?.kind === "ACTIVITY") {
      work.push(`${spec.exerciseId}:${label(view)}`);
      at += 5;
      sim.send({ type: "NEXT", validated: true, target: sim.target }, at * S);
    } else {
      if (spec?.kind !== "SESSION_END") rest.push(`${spec?.kind}:${label(view.previousCounters ?? view)}`);
      at = (Math.floor(at / 60) + 1) * 60;
      sim.at(at);
    }
  }
  return { work, rest };
}

describe("Constat e) du 18/11/2026 — Circuit EMOM « dans chaque intervalle », deux mouvements", () => {
  it("la série avance de 1 à chaque changement de mouvement dans l'intervalle ; total = nombre de mouvements", () => {
    expect(run(3).work).toEqual(["A:S1/2T1/3", "B:S2/2T1/3", "A:S1/2T2/3", "B:S2/2T2/3", "A:S1/2T3/3", "B:S2/2T3/3"]);
  });

  it("pendant le repos de l'intervalle, le tour reste affiché", () => {
    const { rest } = run(3);
    expect(rest.length).toBeGreaterThan(0);
    for (const shown of rest) expect(shown).toMatch(/T[123]\/3$/);
  });
});
