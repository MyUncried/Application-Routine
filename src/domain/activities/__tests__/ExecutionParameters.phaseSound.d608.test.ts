import { describe, expect, it } from "@jest/globals";

import {
  cloneExecutionParameters,
  executionParametersEqual,
  readExecutionParameters,
  serializeExecutionParameters,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import { effectiveParameters, openSheetDraft, toggleWorkPhaseSound } from "@/domain/activities/ExecutionParametersDraft";
import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { stepSignalsBetween } from "@/domain/execution/signals";
import { exerciseActivity, planOf, Simulation, structuredSession } from "@/domain/execution/testing/simulation";

/**
 * D-608 (D-573 point 6 de la branche de documentation, Hermann, 26/11/2026 ; Formats § 9.10) : « les sons et images d'une phase
 * peuvent être désactivés ». Le modèle ne portait rien par phase : clé facultative `soundOff` (vraie seulement) sur une phase de
 * l'Exercice, écrite seulement si le son est coupé — les paramètres existants sont relus et réécrits à l'identique. À l'exécution,
 * une phase au son coupé ne produit aucun signal `PHASE` (bip et annonce) à son début. Images : À CLARIFIER (aucune image par phase).
 */

const S = 1000;

function phased(soundOff: readonly boolean[]): ExecutionParameters {
  const base = durationParameters(9, 3, 15);
  if (base.series.kind !== "UNIFORM") throw new Error("fixture");
  return {
    ...base,
    series: {
      ...base.series,
      workPhases: [
        { id: 1, label: "Descente", durationSeconds: 6, ...(soundOff[0] === true ? { soundOff: true as const } : {}) },
        { id: 2, label: "Maintien", durationSeconds: 3, ...(soundOff[1] === true ? { soundOff: true as const } : {}) },
      ],
    },
  };
}

describe("D-608 — son d'une phase désactivable (modèle)", () => {
  it("son actif partout : aucune clé écrite, sérialisation inchangée", () => {
    const json = serializeExecutionParameters(phased([false, false]));
    expect(json).not.toContain("soundOff");
    expect(readExecutionParameters(json).series.workPhases.map((phase) => "soundOff" in phase)).toEqual([false, false]);
  });

  it("son coupé : écrit sur la seule phase concernée, relu, copié ; l'égalité en tient compte", () => {
    const parameters = phased([false, true]);
    const json = serializeExecutionParameters(parameters);
    expect(json).toContain(`{"id":2,"label":"Maintien","durationSeconds":3,"soundOff":true}`);
    const read = readExecutionParameters(json);
    expect(read.series.workPhases[1]).toEqual({ id: 2, label: "Maintien", durationSeconds: 3, soundOff: true });
    expect(cloneExecutionParameters(read).series.workPhases[1]?.soundOff).toBe(true);
    expect(executionParametersEqual(read, phased([false, false]))).toBe(false);
    expect(executionParametersEqual(read, parameters)).toBe(true);
  });

  it("valeur mal formée : erreur de lecture", () => {
    const json = serializeExecutionParameters(phased([false, false])).replace(`"durationSeconds":3}`, `"durationSeconds":3,"soundOff":false}`);
    expect(() => readExecutionParameters(json)).toThrow();
  });

  it("brouillon de la feuille : coupé puis rétabli ; transmis par les paramètres effectifs ; phase inconnue sans effet", () => {
    const opened = openSheetDraft(phased([false, false]));
    const muted = toggleWorkPhaseSound(opened, 2);
    expect(effectiveParameters(muted).series.workPhases[1]?.soundOff).toBe(true);
    expect(openSheetDraft(effectiveParameters(muted)).workPhases[1]?.soundOff).toBe(true);
    expect("soundOff" in effectiveParameters(toggleWorkPhaseSound(muted, 2)).series.workPhases[1]!).toBe(false);
    expect(toggleWorkPhaseSound(opened, 9)).toBe(opened);
  });
});

describe("D-608 — son d'une phase désactivable (signaux d'exécution)", () => {
  function run() {
    const session = structuredSession({ elements: [{ kind: "EXERCISE", exercise: exerciseActivity("A", repetitionParameters(2)) }], stopPoints: [] });
    const sim = Simulation.libre(planOf(session));
    sim.send({ type: "START" }, 0);
    return sim;
  }
  const phaseSignals = (silent?: readonly boolean[]) =>
    stepSignalsBetween(run().state, 0, 10 * S, { durationsMs: [2 * S, 1 * S], limitMs: 6 * S, ...(silent !== undefined ? { silent } : {}) })
      .filter((signal) => signal.kind === "PHASE")
      .map((signal) => signal.atMs);

  it("motif 2 s + 1 s : la phase 2 coupée ne sonne plus à son début ; la phase 1 garde le sien", () => {
    expect(phaseSignals()).toEqual([2 * S, 3 * S, 5 * S]);
    expect(phaseSignals([false, true])).toEqual([3 * S]);
    expect(phaseSignals([true, false])).toEqual([2 * S, 5 * S]);
    expect(phaseSignals([true, true])).toEqual([]);
  });
});
