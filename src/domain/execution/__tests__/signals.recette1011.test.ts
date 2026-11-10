import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";

import { stepSignalsBetween } from "../signals";
import { exerciseActivity, planOf, Simulation, structuredSession } from "../testing/simulation";

/**
 * Recette iPhone du 10/11/2026 (« Guidage sonore — 2 ») : cadence calée sur le temps actif (t1, constat b),
 * aucun clic pendant les trois dernières secondes (h1), signal minute avec ou sans cadence (G7, h6).
 */

const S = 1000;

function run(parameters: Parameters<typeof exerciseActivity>[1]) {
  const session = structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("A", parameters) }], stopPoints: [] });
  const sim = Simulation.libre(planOf(session));
  sim.send({ type: "START" }, 0);
  return sim;
}

const kinds = (signals: readonly { kind: string; atMs: number }[], kind: string) => signals.filter((signal) => signal.kind === kind).map((signal) => signal.atMs);

describe("signaux — recette du 10/11/2026", () => {
  it("exercice en Durée avec cadence : aucun clic pendant les trois dernières secondes, qui gardent leurs bips", () => {
    const sim = run(durationParameters(10, 1, 0, { cadenceBeepIntervalSeconds: 1 }));
    const signals = stepSignalsBetween(sim.state, 0, 10 * S);
    expect(kinds(signals, "COUNTDOWN")).toEqual([7 * S, 8 * S, 9 * S]);
    expect(kinds(signals, "CADENCE")).toEqual([1 * S, 2 * S, 3 * S, 4 * S, 5 * S, 6 * S]);
  });

  it("après une Pause, les clics restent calés sur le temps actif affiché par le chronomètre", () => {
    const sim = run(repetitionParameters(20, 1, 0, { cadenceBeepIntervalSeconds: 2 }));
    sim.send({ type: "PAUSE" }, 3.4 * S);
    sim.send({ type: "RESUME" }, 10 * S);
    // Temps actif 3,4 s à la reprise : prochains clics à 4 s et 6 s de temps actif, soit 10,6 s et 12,6 s.
    expect(kinds(stepSignalsBetween(sim.state, 10 * S, 13 * S), "CADENCE")).toEqual([10.6 * S, 12.6 * S]);
  });

  it("signal minute d'une Série en Répétitions, avec cadence (il remplace le clic de cet instant) ou sans", () => {
    const withCadence = run(repetitionParameters(20, 1, 0, { cadenceBeepIntervalSeconds: 2 }));
    const signals = stepSignalsBetween(withCadence.state, 59 * S, 61 * S);
    expect(signals.map((signal) => [signal.kind, signal.atMs])).toEqual([["MINUTE", 60 * S]]);
    const without = run(repetitionParameters(20));
    expect(kinds(stepSignalsBetween(without.state, 0, 121 * S), "MINUTE")).toEqual([60 * S, 120 * S]);
  });
});
