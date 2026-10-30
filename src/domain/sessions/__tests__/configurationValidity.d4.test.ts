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
const tabataExercise = (id: string) => exercise(id, durationParameters(20, 8, 10), TABATA);

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
      circuit: { id: "t", repeatCount, nature, exercises },
    });
    expect(configurationValidity(of([circuit([tabataExercise("a"), tabataExercise("b")])]))).toEqual({ status: "valid" });
    // Groupées : admises quel que soit le compte (D-15) — l'ancien « Circuit d'un tour » n'est plus exigé.
    expect(configurationValidity(of([circuit([tabataExercise("a"), tabataExercise("b")], 1, "TOURS")]))).toEqual({ status: "valid" });
    expect(configurationValidity(of([circuit([tabataExercise("a"), tabataExercise("b")], 3, "TOURS")]))).toEqual({ status: "valid" });
    const broken = [
      exercise("count", durationParameters(20, 7, 10), TABATA),
      exercise("work", durationParameters(25, 8, 10), TABATA),
      exercise("pause", durationParameters(20, 8, 15), TABATA),
      exercise("mode", repetitionParameters(20, 8, 10), TABATA),
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

  it("aucune transmission (D-26, D-27) : un Exercice libre membre d'un Circuit n'hérite d'aucune constante d'un membre formaté", () => {
    const mixed = of([
      { kind: "CIRCUIT", circuit: { id: "c", repeatCount: 8, nature: "SERIES", exercises: [tabataExercise("a"), exercise("libre", durationParameters(45, 3, 15))] } },
    ]);
    expect(configurationValidity(mixed)).toEqual({ status: "valid" });
  });

  it("chaque Exercice formaté contrôlé contre l'organisation et le compte de son propre Circuit (matrice §2.2) : refus explicite", () => {
    const amrap: ElementFormat = { key: "AMRAP", settings: { durationSeconds: 720 } };
    const intervals: ElementFormat = { key: "INTERVALS_30_30", settings: { seriesCount: 6 } };
    const result = configurationValidity(
      of([
        // Tabata alterné, N ≠ 8 (D-16).
        { kind: "CIRCUIT", circuit: { id: "t", repeatCount: 3, nature: "SERIES", exercises: [tabataExercise("a")] } },
        // AMRAP et 30/30 alternés refusés (D-16) ; l'Exercice libre voisin n'est pas concerné.
        {
          kind: "CIRCUIT",
          circuit: { id: "x", repeatCount: 6, nature: "SERIES", exercises: [exercise("amrap", durationParameters(30), amrap), exercise("i", durationParameters(30, 6, 30), intervals), exercise("libre")] },
        },
        // Groupées : admises pour tous (D-15).
        { kind: "CIRCUIT", circuit: { id: "g", repeatCount: 3, nature: "TOURS", exercises: [exercise("amrap2", durationParameters(30), amrap)] } },
      ]),
    );
    expect(result).toEqual({
      status: "invalid",
      issues: [
        { elementId: "a", reason: "INCOMPATIBLE_CIRCUIT" },
        { elementId: "amrap", reason: "INCOMPATIBLE_CIRCUIT" },
        { elementId: "i", reason: "INCOMPATIBLE_CIRCUIT" },
      ],
    });
  });

  it("For time alterné : non décidé (main / branche non fusionnée) — jamais bloquant, signalé comme question ouverte", () => {
    const forTime: ElementFormat = { key: "FOR_TIME", settings: { volumePerRound: [21, 15, 9] } };
    const result = configurationValidity(
      of([{ kind: "CIRCUIT", circuit: { id: "f", repeatCount: 3, nature: "SERIES", exercises: [exercise("b", durationParameters(30), forTime), exercise("c")] } }]),
    );
    expect(result.status).toBe("valid");
    expect(result.openQuestions).toEqual([{ elementId: "b", circuitId: "f", question: expect.stringContaining("À CLARIFIER") }]);
    // Groupé : admis, sans question.
    expect(
      configurationValidity(of([{ kind: "CIRCUIT", circuit: { id: "f", repeatCount: 3, nature: "TOURS", exercises: [exercise("b", durationParameters(30), forTime)] } }])),
    ).toEqual({ status: "valid" });
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
