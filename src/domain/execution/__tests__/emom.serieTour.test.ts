import { describe, expect, it } from "@jest/globals";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";

import { executionEnv } from "../policies";
import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * Constat a) de la recette du 18/11/2026 (Hermann, « Concept série / tour de l'EMOM à plusieurs mouvements ») : compteurs Série et Tour
 * de l'écran d'exécution (projection). « À la suite » : le tour est le rang du mouvement, la série repart à 1 à chaque mouvement ;
 * « Dans chaque intervalle » et « En alternance » : la série est la position du mouvement dans le tour, le tour avance après le dernier
 * mouvement. Circuits construits comme par le modèle EMOM (`buildModelElements`, formatModels.ts).
 */

const S = 1000;
const IDS = ["A", "B", "C"];

function emom(id: string, settings: Record<string, number>, count: number) {
  return exerciseActivity(id, repetitionParameters(10, count, 0), { format: { key: "EMOM", settings } });
}

function circuitOf(mode: "EACH_INTERVAL" | "ALTERNATED" | "SEQUENCE", movements: number, count: number) {
  const ids = IDS.slice(0, movements);
  switch (mode) {
    case "EACH_INTERVAL":
      return { id: "c", repeatCount: count, nature: "TOURS", format: { key: "EMOM", settings: { windowSeconds: 60 } }, exercises: ids.map((id) => emom(id, {}, count)) };
    case "ALTERNATED":
      return { id: "c", repeatCount: count, nature: "SERIES", exercises: ids.map((id) => emom(id, { intervalSeconds: 60 }, count)) };
    case "SEQUENCE":
      return { id: "c", repeatCount: 1, nature: "TOURS", exercises: ids.map((id) => emom(id, { intervalSeconds: 60 }, count)) };
  }
}

/** Compteurs « S<série>T<tour> » de chaque Série jouée, avec ceux affichés pendant le repos qui la suit. */
function played(mode: "EACH_INTERVAL" | "ALTERNATED" | "SEQUENCE", movements: number, count: number) {
  const plan = planOf(structuredSession({ elements: [{ kind: "CIRCUIT", circuit: circuitOf(mode, movements, count) } as never], stopPoints: [] }));
  const sim = new Simulation(executionEnv(plan));
  sim.send({ type: "START" }, 0);
  const label = (counters: { series: { current: number; total: number } | null; tour: { current: number; total: number } | null }) =>
    `S${counters.series?.current}/${counters.series?.total}T${counters.tour?.current}/${counters.tour?.total}`;
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
      if (spec?.kind === "WINDOW_REST" && view.previousCounters !== null) rest.push(label(view.previousCounters));
      at = (Math.floor(at / 60) + 1) * 60;
      sim.at(at);
    }
  }
  return { work, rest };
}

describe("Constat a) du 18/11/2026 — compteurs série / tour de l'EMOM à plusieurs mouvements", () => {
  it("À la suite, M = 3, N = 3 : S1T1, S2T1, S3T1 puis S1T2… — le tour est le rang du mouvement", () => {
    expect(played("SEQUENCE", 3, 3).work).toEqual([
      "A:S1/3T1/3", "A:S2/3T1/3", "A:S3/3T1/3",
      "B:S1/3T2/3", "B:S2/3T2/3", "B:S3/3T2/3",
      "C:S1/3T3/3", "C:S2/3T3/3", "C:S3/3T3/3",
    ]);
  });

  it("À la suite, M = 2, N = 3 : le tour va de 1 à 2, la série de 1 à 3 à chaque mouvement", () => {
    expect(played("SEQUENCE", 2, 3).work).toEqual(["A:S1/3T1/2", "A:S2/3T1/2", "A:S3/3T1/2", "B:S1/3T2/2", "B:S2/3T2/2", "B:S3/3T2/2"]);
  });

  it.each(["EACH_INTERVAL", "ALTERNATED"] as const)("%s, M = 3, N = 3 : la série avance à chaque Suivant, le tour après le dernier mouvement", (mode) => {
    const { work, rest } = played(mode, 3, 3);
    expect(work).toEqual([
      "A:S1/3T1/3", "B:S2/3T1/3", "C:S3/3T1/3",
      "A:S1/3T2/3", "B:S2/3T2/3", "C:S3/3T2/3",
      "A:S1/3T3/3", "B:S2/3T3/3", "C:S3/3T3/3",
    ]);
    // Repos : compteurs de la Série qui vient de se terminer (règle du 13/11/2026), avec la nouvelle définition.
    expect(rest.length).toBeGreaterThan(0);
    for (const shown of rest) expect(shown).toMatch(/^S[123]\/3T[123]\/3$/);
  });

  it("EMOM à un seul mouvement : compteurs inchangés (série k / N, sans tour)", () => {
    const plan = planOf(structuredSession({ elements: [{ kind: "EXERCISE", exercise: emom("A", { intervalSeconds: 60 }, 3) }], stopPoints: [] }));
    const sim = new Simulation(executionEnv(plan));
    sim.send({ type: "START" }, 0);
    const view = projectExecution(plan, sim.state, 0);
    expect(view.series).toEqual({ current: 1, total: 3 });
    expect(view.tour).toBeNull();
  });
});
