import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { failureTarget } from "@/domain/activities/ExecutionParameters";
import { configurationValidity, engineAvailability, type ValidityExercise } from "@/domain/sessions/configurationValidity";
import type { ElementFormat } from "@/domain/sessions/formats";
import type { SessionStructure, StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 (story D.4, ARB-21 ; réalignement du 02/11/2026, référence Formats §3, §6, §6.1, §11, §12) —
 * validité de configuration par élément et pour la Séance, motifs lisibles, aucune réparation ;
 * disponibilité du moteur distincte.
 */

const exercise = (id: string, parameters = durationParameters(30), format?: ElementFormat): ValidityExercise => ({
  id,
  type: "EXERCISE",
  executionParameters: parameters,
  ...(format !== undefined ? { format } : {}),
});

const of = (elements: readonly StructureElement<ValidityExercise>[]): SessionStructure<ValidityExercise> => ({ elements, stopPoints: [] });

const AMRAP_CIRCUIT: ElementFormat = { key: "AMRAP", settings: { blockSeconds: 720, restBetweenBlocksSeconds: 120 } };
const LOOP: ElementFormat = { key: "AMRAP", settings: { incrementPerRound: 0 } };
const BUY_IN: ElementFormat = { key: "AMRAP", settings: { incrementPerRound: 0, passageOnce: 1 } };

describe("PRE-9 D.4 — validité de configuration", () => {
  it("Séance libre complète : valide", () => {
    expect(configurationValidity(of([{ kind: "EXERCISE", exercise: exercise("a") }]))).toEqual({ status: "valid" });
  });

  it("cible à renseigner, volume nul, Séance sans Exercice : motifs par élément et pour la Séance", () => {
    const result = configurationValidity(
      of([
        { kind: "EXERCISE", exercise: exercise("tiret", durationParameters("UNSET")) },
        { kind: "EXERCISE", exercise: exercise("nul", variableParameters({ mode: "REPETITIONS", rows: [[0, 0], [0, 0]] })) },
        { kind: "EXERCISE", exercise: exercise("partiel", variableParameters({ mode: "REPETITIONS", rows: [[0, 0], [8, 0]] })) },
      ]),
    );
    expect(result).toEqual({
      status: "invalid",
      issues: [
        { elementId: "tiret", reason: "MISSING_TARGET" },
        { elementId: "nul", reason: "ZERO_VOLUME" },
      ],
    });
    expect(configurationValidity(of([]))).toEqual({ status: "invalid", issues: [{ elementId: null, reason: "INVALID_STRUCTURE" }] });
  });

  it("Tabata et 30/30 sont des Exercices standards : aucune constante, toute modification admise (FMT-10, FMT-19, CE-FMT-04)", () => {
    const circuit: StructureElement<ValidityExercise> = {
      kind: "CIRCUIT",
      circuit: { id: "t", repeatCount: 4, nature: "SERIES", exercises: [exercise("a", durationParameters(25, 4, 15)), exercise("b", repetitionParameters(12, 4, 10))] },
    };
    expect(configurationValidity(of([circuit]))).toEqual({ status: "valid" });
  });

  it("Circuit porteur AMRAP : buy-in et boucle valides ; boucle sans membre « À chaque tour » invalide (§6.1, R09), sans réparation", () => {
    const carrier = (exercises: readonly ValidityExercise[]): StructureElement<ValidityExercise> => ({
      kind: "CIRCUIT",
      circuit: { id: "c", repeatCount: 3, nature: "TOURS", format: AMRAP_CIRCUIT, exercises },
    });
    expect(configurationValidity(of([carrier([exercise("in", repetitionParameters(50), BUY_IN), exercise("l", durationParameters(30), LOOP)])]))).toEqual({
      status: "valid",
    });
    const structure = of([carrier([exercise("in", repetitionParameters(50), BUY_IN)])]);
    const before = JSON.stringify(structure);
    expect(configurationValidity(structure)).toEqual({ status: "invalid", issues: [{ elementId: "c", reason: "EMPTY_LOOP" }] });
    expect(JSON.stringify(structure)).toBe(before);
  });

  // [« buy-in en Répétitions à l'objectif » — remplacé le 04/11/2026 (MAJ §6 bis 2) : buy-in en Répétitions ou en
  // Durée, À l'échec admis pour un buy-in AMRAP ; For time toujours à l'objectif.]
  // [Complément du 5 novembre 2026 (§13) : le Death by admet Répétitions ou Durée — « Death by autonome en Répétitions » remplacé.]
  it("valeurs imposées : buy-in AMRAP en Durée admis ; Death by en Durée admis ; For time sans À l'échec (§3, §11, §12)", () => {
    const deathBy: ElementFormat = { key: "DEATH_BY", settings: { intervalSeconds: 60, incrementPerRound: 1 } };
    const forTime: ElementFormat = { key: "FOR_TIME", settings: {} };
    const failure = repetitionParameters(21, 3);
    const withFailure = { ...failure, series: { ...failure.series, target: failureTarget() } } as typeof failure;
    const result = configurationValidity(
      of([
        { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 2, nature: "TOURS", format: AMRAP_CIRCUIT, exercises: [exercise("in", durationParameters(30), BUY_IN), exercise("l", durationParameters(30), LOOP)] } },
        { kind: "EXERCISE", exercise: exercise("d", durationParameters(30), deathBy) },
        { kind: "EXERCISE", exercise: exercise("ok", repetitionParameters(1), deathBy) },
        { kind: "EXERCISE", exercise: exercise("f", withFailure, forTime) },
        { kind: "EXERCISE", exercise: exercise("e", withFailure, { key: "EMOM", settings: { intervalSeconds: 60 } }) },
      ]),
    );
    expect(result).toEqual({
      status: "invalid",
      issues: [{ elementId: "f", reason: "LOCKED_CONSTANT_CHANGED" }, { elementId: "e", reason: "LOCKED_CONSTANT_CHANGED" }],
    });
  });

  it("Exercice formaté autonome dans un Circuit standard (§6.1) : AMRAP, For time et Death by alternés refusés ; EMOM admis ; groupées admises", () => {
    const amrap: ElementFormat = { key: "AMRAP", settings: { durationSeconds: 720, incrementPerRound: 0 } };
    const deathBy: ElementFormat = { key: "DEATH_BY", settings: { intervalSeconds: 60, incrementPerRound: 1 } };
    const emom: ElementFormat = { key: "EMOM", settings: { intervalSeconds: 60 } };
    const result = configurationValidity(
      of([
        {
          kind: "CIRCUIT",
          circuit: {
            id: "x",
            repeatCount: 6,
            nature: "SERIES",
            exercises: [exercise("amrap", repetitionParameters(10), amrap), exercise("death", repetitionParameters(1), deathBy), exercise("emom", repetitionParameters(10, 6), emom)],
          },
        },
        { kind: "CIRCUIT", circuit: { id: "g", repeatCount: 3, nature: "TOURS", exercises: [exercise("amrap2", repetitionParameters(10), amrap), exercise("death2", repetitionParameters(1), deathBy)] } },
      ]),
    );
    expect(result).toEqual({
      status: "invalid",
      issues: [
        { elementId: "amrap", reason: "INCOMPATIBLE_CIRCUIT" },
        { elementId: "death", reason: "INCOMPATIBLE_CIRCUIT" },
      ],
    });
  });

  it("membre d'un Circuit porteur : sans réglage de membre ou d'une autre clé → refusé ; réglage obligatoire manquant signalé", () => {
    const deathByCircuit: ElementFormat = { key: "DEATH_BY", settings: {} };
    const result = configurationValidity(
      of([
        { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 2, nature: "TOURS", format: AMRAP_CIRCUIT, exercises: [exercise("libre"), exercise("autre", durationParameters(30), { key: "EMOM", settings: {} })] } },
        // Death by alterné : intervalle local à chaque membre (A2) ; manquant → réglage à renseigner.
        { kind: "CIRCUIT", circuit: { id: "d", repeatCount: 1, nature: "SERIES", format: deathByCircuit, exercises: [exercise("m", repetitionParameters(1), { key: "DEATH_BY", settings: { incrementPerRound: 1 } })] } },
        { kind: "EXERCISE", exercise: exercise("e", repetitionParameters(10), { key: "EMOM", settings: {} }) },
      ]),
    );
    expect(result).toEqual({
      status: "invalid",
      issues: [
        { elementId: "libre", reason: "MISSING_SETTING" },
        { elementId: "autre", reason: "INVALID_STRUCTURE" },
        { elementId: "m", reason: "MISSING_SETTING" },
        { elementId: "e", reason: "MISSING_SETTING" },
      ],
    });
  });

  it("disponibilité du moteur distincte de la validité : aucune en PRE-9, même pour une configuration valide (ARB-21)", () => {
    expect(configurationValidity(of([{ kind: "EXERCISE", exercise: exercise("a") }])).status).toBe("valid");
    expect(engineAvailability({ key: "EMOM", settings: { intervalSeconds: 60 } })).toBe(false);
    expect(engineAvailability(null)).toBe(false);
  });
});
