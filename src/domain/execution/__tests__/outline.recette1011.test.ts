import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";

import { projectExecution } from "../projection";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * Essai du 10/11/2026 (besoins de Hermann) : liste des étapes pendant l'Exécution — séries, pauses,
 * récupérations, Compte à rebours, Fin de séance ; en cours en gras, la précédente en gris, puis effacée.
 */
function session() {
  return structuredSession(
    {
      elements: [
        { kind: "EXERCISE", exercise: exerciseActivity("A", durationParameters(20, 2, 10), { postActivityRecoverySeconds: 30 }) },
        { kind: "EXERCISE", exercise: exerciseActivity("B", durationParameters(20)) },
      ],
      stopPoints: [],
    },
    { initialCountdownSeconds: 10 },
  );
}

describe("liste des étapes pendant l'Exécution (essai du 10/11/2026)", () => {
  it("toutes les étapes, en cours, précédente passée puis retirée, durées des étapes chronométrées", () => {
    const plan = planOf(session());
    const sim = Simulation.libre(plan);
    const outline = () => projectExecution(plan, sim.state, sim.now).outline.map((item) => [item.kind, item.name, item.series?.current ?? null, item.status]);
    sim.send({ type: "START" }, 0);
    expect(outline()).toEqual([
      ["INITIAL_COUNTDOWN", null, null, "current"],
      ["ACTIVITY", "Mouvement A", 1, "upcoming"],
      ["SERIES_PAUSE", "Mouvement A", null, "upcoming"],
      ["ACTIVITY", "Mouvement A", 2, "upcoming"],
      ["POST_ACTIVITY_RECOVERY", "Mouvement A", null, "upcoming"],
      ["ACTIVITY", "Mouvement B", null, "upcoming"],
      ["SESSION_END", null, null, "upcoming"],
    ]);
    sim.at(35); // Pause entre séries de A
    expect(outline().slice(0, 3)).toEqual([
      ["ACTIVITY", "Mouvement A", 1, "past"],
      ["SERIES_PAUSE", "Mouvement A", null, "current"],
      ["ACTIVITY", "Mouvement A", 2, "upcoming"],
    ]);
    sim.at(65); // Récupération après A
    expect(outline()).toEqual([
      ["ACTIVITY", "Mouvement A", 2, "past"],
      ["POST_ACTIVITY_RECOVERY", "Mouvement A", null, "current"],
      ["ACTIVITY", "Mouvement B", null, "upcoming"],
      ["SESSION_END", null, null, "upcoming"],
    ]);
    const recovery = projectExecution(plan, sim.state, sim.now).outline[1]!;
    expect(recovery.plannedMs).toBe(30_000);
    sim.at(10_000);
    expect(projectExecution(plan, sim.state, sim.now).outline).toEqual([]);
  });
});
