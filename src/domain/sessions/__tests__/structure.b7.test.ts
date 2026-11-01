import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  AMRAP_INITIAL_DURATION_SECONDS,
  computeActivityDurationResult,
  computeStructuredSessionDuration,
  type ActivityDurationFacts,
} from "@/domain/sessions/calculations";
import type { ElementFormat } from "@/domain/sessions/formats";
import { computeStructureDuration, type StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 B.7 (epics § B.7 : « vérification ciblée de l'existant, pas réécriture du calcul ») — seul
 * écart démontré : la durée d'un Exercice AMRAP ou Death by était lue sur ses paramètres d'exécution,
 * alors que le plan développé (D.1) en fait un segment progressif sans séries ni récupération.
 */

type Facts = ActivityDurationFacts & { readonly id: string };
const amrap = (durationSeconds?: number): ElementFormat => ({
  key: "AMRAP",
  settings: durationSeconds === undefined ? {} : { durationSeconds },
});
const deathBy: ElementFormat = { key: "DEATH_BY", settings: { startRepetitions: 1, incrementRepetitions: 1, windowSeconds: 60 } };
const exercise = (id: string, format: ElementFormat | null = null, recovery = 0): Facts => ({
  id,
  type: "EXERCISE",
  // Paramètres d'un Exercice ordinaire (3 × 10 répétitions) : ignorés pour un Format progressif.
  executionParameters: format === null ? durationParameters(30) : repetitionParameters(10, 3),
  postActivityRecoverySeconds: recovery,
  format,
});
const direct = (item: Facts): StructureElement<Facts> => ({ kind: "EXERCISE", exercise: item });

describe("B.7 — Exercice AMRAP", () => {
  it("contribue par sa durée configurée, exacte, sans récupération propre (segment progressif, D.1)", () => {
    expect(computeActivityDurationResult(exercise("a", amrap(600), 45))).toMatchObject({ kind: "exact", seconds: 600, knownSeconds: 600 });
  });

  it("réglage non renseigné : durée initiale 12:00 (« AMRAP durée 12:00 réglable »)", () => {
    expect(AMRAP_INITIAL_DURATION_SECONDS).toBe(720);
    expect(computeActivityDurationResult(exercise("a", amrap()))).toMatchObject({ kind: "exact", seconds: 720 });
  });

  it("Cycle × 2 : le bloc est répété une fois par répétition (ARB-25), sans autre facteur", () => {
    const result = computeStructureDuration<Facts>({
      elements: [{ kind: "CYCLE", cycle: { id: "k", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: exercise("a", amrap(600)) }] } }],
    });
    expect(result).toEqual({ kind: "exact", seconds: 1200 });
  });

  it("Circuit groupé × 3 : une borne complète à chaque passage (D-15, D-30)", () => {
    const result = computeStructureDuration<Facts>({
      elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 3, nature: "TOURS", exercises: [exercise("a", amrap(300))] } }],
    });
    expect(result).toEqual({ kind: "exact", seconds: 900 });
  });
});

describe("B.7 — Exercice Death by", () => {
  it("sans durée calculable : traité comme un Exercice sans durée conventionnelle, borne minimale ≥ (D-070)", () => {
    expect(computeActivityDurationResult(exercise("d", deathBy))).toMatchObject({ kind: "lowerBound", knownSeconds: 0 });
    const total = computeStructureDuration<Facts>({ elements: [direct(exercise("x")), direct(exercise("d", deathBy))] });
    expect(total.kind).toBe("lowerBound");
    expect(total.seconds).toBe(computeStructureDuration<Facts>({ elements: [direct(exercise("x"))] }).seconds);
  });

  it("Circuit alterné : un segment à chaque tour, sans série propre (D-16, D-29) — total ≥", () => {
    const result = computeStructureDuration<Facts>({
      elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 4, nature: "SERIES", exercises: [exercise("d", deathBy)] } }],
    });
    expect(result).toEqual({ kind: "lowerBound", seconds: 0 });
  });
});

describe("B.7 — Exercice EMOM (FMT-21 : N × E × W)", () => {
  const emom: ElementFormat = { key: "EMOM", settings: { windowSeconds: 60, roundCount: 6 } };

  it("deux Exercices EMOM à la suite : 6 × 2 × 60 s, exact, sans récupération propre", () => {
    const result = computeStructureDuration<Facts>({ elements: [direct(exercise("a", emom, 30)), direct(exercise("b", emom))] });
    expect(result).toEqual({ kind: "exact", seconds: 720 });
  });

  it("Circuit alterné × 6 (N adapté) : une fenêtre par tour et par Exercice — même total, sans double multiplication", () => {
    const result = computeStructureDuration<Facts>({
      elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 6, nature: "SERIES", exercises: [exercise("a", emom), exercise("b", emom)] } }],
    });
    expect(result).toEqual({ kind: "exact", seconds: 720 });
  });
});

describe("B.7 — non-régression", () => {
  it("Exercice libre et Format fini : durée lue sur les paramètres d'exécution, inchangée", () => {
    const free = exercise("x");
    const tabata: Facts = { ...exercise("t"), format: { key: "TABATA", settings: {} } };
    expect(computeActivityDurationResult(tabata)).toEqual(computeActivityDurationResult(free));
  });

  it("ancien modèle (Circuit unique) : même lecture du Format", () => {
    const result = computeStructuredSessionDuration({
      beforeTour: [exercise("a", amrap(600))],
      inTour: [],
      afterTour: [],
      tourRepeatCount: 1,
    });
    expect(result).toEqual({ kind: "exact", seconds: 600 });
  });
});
