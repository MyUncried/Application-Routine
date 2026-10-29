import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters, variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { configurationValidity, engineAvailability, type ValidityExercise } from "@/domain/sessions/configurationValidity";
import type { ElementFormat } from "@/domain/sessions/formats";
import type { SessionStructure, StructureElement } from "@/domain/sessions/structure";

/**
 * PRE-9 (story D.4, ARB-21) — validité de configuration par élément et pour la Séance, motifs
 * lisibles, aucune réparation ; disponibilité du moteur distincte.
 */

const exercise = (id: string, parameters = durationParameters(30), format?: ElementFormat): ValidityExercise => ({
  id,
  type: "EXERCISE",
  executionParameters: parameters,
  ...(format !== undefined ? { format } : {}),
});

const of = (elements: readonly StructureElement<ValidityExercise>[]): SessionStructure<ValidityExercise> => ({ elements, stopPoints: [] });

const TABATA: ElementFormat = { key: "TABATA", settings: {} };
const tabataExercise = (id: string) => exercise(id, durationParameters(20, 8, 10));

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

  it("Tabata : constantes respectées → valide ; série, durée, pause ou mode modifiés → constante modifiée (CE-FMT-04 §14), sans réparation", () => {
    const circuit = (exercises: readonly ValidityExercise[], repeatCount = 8, nature: "TOURS" | "SERIES" = "SERIES"): StructureElement<ValidityExercise> => ({
      kind: "CIRCUIT",
      circuit: { id: "t", repeatCount, nature, exercises, format: TABATA },
    });
    expect(configurationValidity(of([circuit([tabataExercise("a"), tabataExercise("b")])]))).toEqual({ status: "valid" });
    expect(configurationValidity(of([circuit([tabataExercise("a"), tabataExercise("b")], 1, "TOURS")]))).toEqual({ status: "valid" });
    const broken = [
      exercise("count", durationParameters(20, 7, 10)),
      exercise("work", durationParameters(25, 8, 10)),
      exercise("pause", durationParameters(20, 8, 15)),
      exercise("mode", repetitionParameters(20, 8, 10)),
    ];
    const structure = of([circuit(broken)]);
    const before = JSON.stringify(structure);
    expect(configurationValidity(structure)).toEqual({
      status: "invalid",
      issues: broken.map((item) => ({ elementId: item.id, reason: "LOCKED_CONSTANT_CHANGED" })),
    });
    expect(JSON.stringify(structure)).toBe(before);
    // Tabata porté par un Exercice unique.
    expect(configurationValidity(of([{ kind: "EXERCISE", exercise: exercise("solo", durationParameters(20, 8, 10), TABATA) }]))).toEqual({ status: "valid" });
  });

  it("organisation et compte du Circuit porteur gouvernés par le Format (FMT-12/13, FMT-31) : structure invalide", () => {
    const tabataWrongCount: StructureElement<ValidityExercise> = {
      kind: "CIRCUIT",
      circuit: { id: "t", repeatCount: 3, nature: "SERIES", exercises: [tabataExercise("a")], format: TABATA },
    };
    const forTimeAlternated: StructureElement<ValidityExercise> = {
      kind: "CIRCUIT",
      circuit: { id: "f", repeatCount: 3, nature: "SERIES", exercises: [exercise("b")], format: { key: "FOR_TIME", settings: { volumePerRound: [21, 15, 9] } } },
    };
    expect(configurationValidity(of([tabataWrongCount, forTimeAlternated]))).toEqual({
      status: "invalid",
      issues: [
        { elementId: "t", reason: "INVALID_STRUCTURE" },
        { elementId: "f", reason: "INVALID_STRUCTURE" },
      ],
    });
  });

  it("réglage non renseigné ; échelle For time entièrement nulle (ARB-18b) ; zéro admis dans une position", () => {
    const emom: ElementFormat = { key: "EMOM", settings: { windowSeconds: 60 } };
    const zeroLadder: ElementFormat = { key: "FOR_TIME", settings: { volumePerRound: [0, 0] } };
    const partialZero: ElementFormat = { key: "FOR_TIME", settings: { volumePerRound: [21, 0, 9] } };
    expect(
      configurationValidity(
        of([
          { kind: "EXERCISE", exercise: exercise("e", durationParameters(30), emom) },
          { kind: "EXERCISE", exercise: exercise("z", durationParameters(30), zeroLadder) },
          { kind: "EXERCISE", exercise: exercise("p", durationParameters(30), partialZero) },
        ]),
      ),
    ).toEqual({
      status: "invalid",
      issues: [
        { elementId: "e", reason: "MISSING_SETTING" },
        { elementId: "z", reason: "ZERO_VOLUME" },
      ],
    });
  });

  it("disponibilité du moteur distincte de la validité : aucune en PRE-9, même pour une configuration valide (ARB-21)", () => {
    expect(configurationValidity(of([{ kind: "EXERCISE", exercise: exercise("a", durationParameters(20, 8, 10), TABATA) }])).status).toBe("valid");
    expect(engineAvailability(TABATA)).toBe(false);
    expect(engineAvailability(null)).toBe(false);
  });
});
