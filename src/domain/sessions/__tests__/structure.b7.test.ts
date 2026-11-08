import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import {
  AMRAP_INITIAL_DURATION_SECONDS,
  carrierCircuitDuration,
  computeActivityDurationResult,
  computeStructuredSessionDuration,
  type ActivityDurationFacts,
} from "@/domain/sessions/calculations";
import type { ElementFormat } from "@/domain/sessions/formats";
import { computeStructureDuration, type StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 B.7 (vérification ciblée de l'existant) et réalignement du 02/11/2026 (référence Formats §2.1,
 * §3, §9.1, §10, §11, §12 ; FMT-12, FMT-21, CE-FMT-02 critères d'acceptation) — durées des Formats.
 */

type Facts = ActivityDurationFacts & { readonly id: string };
const amrap = (durationSeconds?: number): ElementFormat => ({
  key: "AMRAP",
  settings: durationSeconds === undefined ? {} : { durationSeconds },
});
const deathBy: ElementFormat = { key: "DEATH_BY", settings: { intervalSeconds: 60, incrementPerRound: 1 } };
const exercise = (id: string, format: ElementFormat | null = null, recovery = 0, parameters = format === null ? durationParameters(30) : repetitionParameters(10, 6)): Facts => ({
  id,
  type: "EXERCISE",
  executionParameters: parameters,
  postActivityRecoverySeconds: recovery,
  format,
});
const direct = (item: Facts): StructureElement<Facts> => ({ kind: "EXERCISE", exercise: item });

describe("Exercice AMRAP autonome", () => {
  it("contribue par sa Durée de l'exercice, exacte, puis sa récupération", () => {
    expect(computeActivityDurationResult(exercise("a", amrap(600), 45))).toMatchObject({ kind: "exact", seconds: 645, knownSeconds: 645 });
  });

  it("durée initiale 12 min ; sans Durée propre (membre d'un Circuit porteur), un passage lu sur ses paramètres, la durée étant celle du Circuit", () => {
    expect(AMRAP_INITIAL_DURATION_SECONDS).toBe(720);
    expect(computeActivityDurationResult(exercise("a", amrap(0)))).toMatchObject({ kind: "exact", seconds: 720 });
    expect(computeActivityDurationResult(exercise("m", amrap()))).toEqual(computeActivityDurationResult(exercise("m", null, 0, repetitionParameters(10, 6))));
  });

  it("Cycle × 2, Circuit standard groupé × 3 : un bloc complet à chaque exécution (§6.1)", () => {
    expect(
      computeStructureDuration<Facts>({
        elements: [{ kind: "CYCLE", cycle: { id: "k", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: exercise("a", amrap(600)) }] } }],
      }),
    ).toEqual({ kind: "exact", seconds: 1200 });
    expect(
      computeStructureDuration<Facts>({
        elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 3, nature: "TOURS", exercises: [exercise("a", amrap(300))] } }],
      }),
    ).toEqual({ kind: "exact", seconds: 900 });
  });
});

describe("Circuit porteur AMRAP (§2.1)", () => {
  const carrier = (blocks: number): StructureElement<Facts> => ({
    kind: "CIRCUIT",
    circuit: {
      id: "c",
      repeatCount: blocks,
      nature: "TOURS",
      format: { key: "AMRAP", settings: { blockSeconds: 720, restBetweenBlocksSeconds: 120 } },
      exercises: [exercise("a", { key: "AMRAP", settings: { incrementPerRound: 0 } }, 30), exercise("b", { key: "AMRAP", settings: { incrementPerRound: 0 } })],
    },
  });

  it("3 blocs de 12 min séparés par 2 repos de 2 min : 40 min ; la récupération de boucle est comprise dans le bloc", () => {
    expect(computeStructureDuration<Facts>({ elements: [carrier(3)] })).toEqual({ kind: "exact", seconds: 2400 });
    expect(computeStructureDuration<Facts>({ elements: [carrier(1)] })).toEqual({ kind: "exact", seconds: 720 });
  });
});

describe("Death by et For time : jusqu'à l'échec, temps mesuré (§11, §12)", () => {
  it("Death by autonome : borne minimale ≥, seule sa récupération connue", () => {
    expect(computeActivityDurationResult(exercise("d", deathBy))).toMatchObject({ kind: "lowerBound", knownSeconds: 0 });
    const total = computeStructureDuration<Facts>({ elements: [direct(exercise("x")), direct(exercise("d", deathBy))] });
    expect(total.kind).toBe("lowerBound");
    expect(total.seconds).toBe(computeStructureDuration<Facts>({ elements: [direct(exercise("x"))] }).seconds);
  });

  it("For time autonome : temps mesuré, ≥ ; la cadence n'entre dans aucune estimation (§3)", () => {
    expect(computeActivityDurationResult(exercise("f", { key: "FOR_TIME", settings: {} }))).toMatchObject({ kind: "lowerBound", knownSeconds: 0 });
  });

  it("Circuits porteurs Death by et For time : ≥", () => {
    expect(carrierCircuitDuration({ repeatCount: 1, format: { key: "DEATH_BY", settings: {} } })).toMatchObject({ kind: "lowerBound" });
    expect(carrierCircuitDuration({ repeatCount: 3, format: { key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0 } } })).toMatchObject({ kind: "lowerBound" });
    expect(carrierCircuitDuration({ repeatCount: 3 })).toBeNull();
  });
});

describe("EMOM (FMT-21, §10) : 2 mouvements, 6 séries, intervalle 1 min", () => {
  const emom: ElementFormat = { key: "EMOM", settings: { intervalSeconds: 60 } };

  it("un seul mouvement : 6 min ; À la suite avec 1 min de récupération : 13 min ; en alternance (Circuit standard × 6) : 12 min", () => {
    expect(computeStructureDuration<Facts>({ elements: [direct(exercise("a", emom))] })).toEqual({ kind: "exact", seconds: 360 });
    expect(computeStructureDuration<Facts>({ elements: [direct(exercise("a", emom, 60)), direct(exercise("b", emom))] })).toEqual({ kind: "exact", seconds: 780 });
    expect(
      computeStructureDuration<Facts>({
        elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 6, nature: "SERIES", exercises: [exercise("a", emom), exercise("b", emom)] } }],
      }),
    ).toEqual({ kind: "exact", seconds: 720 });
  });

  it("dans chaque intervalle (Circuit porteur, 6 tours de 1 min) : 6 min", () => {
    const member: ElementFormat = { key: "EMOM", settings: {} };
    expect(
      computeStructureDuration<Facts>({
        elements: [
          {
            kind: "CIRCUIT",
            circuit: { id: "c", repeatCount: 6, nature: "TOURS", format: { key: "EMOM", settings: { windowSeconds: 60 } }, exercises: [exercise("a", member), exercise("b", member)] },
          },
        ],
      }),
    ).toEqual({ kind: "exact", seconds: 360 });
  });
});

describe("Tabata, préconfiguration standard (FMT-12, §9, §9.1)", () => {
  const tabata = (id: string, recovery: number): Facts => exercise(id, null, recovery, durationParameters(20, 8, 10));

  it("un mouvement : 4 min ; À la suite (1 min de récupération après le premier, qui remplace sa dernière Pause) : 530 s ; en alternance : 8 min", () => {
    expect(computeStructureDuration<Facts>({ elements: [direct(tabata("a", 0))] })).toEqual({ kind: "exact", seconds: 240 });
    expect(computeStructureDuration<Facts>({ elements: [direct(tabata("a", 60)), direct(tabata("b", 0))] })).toEqual({ kind: "exact", seconds: 530 });
    expect(
      computeStructureDuration<Facts>({
        elements: [{ kind: "CIRCUIT", circuit: { id: "c", repeatCount: 8, nature: "SERIES", exercises: [tabata("a", 0), tabata("b", 0)] } }],
      }),
    ).toEqual({ kind: "exact", seconds: 480 });
  });
});

describe("non-régression", () => {
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
