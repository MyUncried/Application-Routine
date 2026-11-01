import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { seriesCountOf, seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { computeActivityDurationResult } from "@/domain/sessions/calculations";
import {
  initialModelSettings,
  modelArrangement,
  modelDraftPatch,
  modelExecutionParameters,
  modelFormat,
  proposesOrganisation,
  withModelSetting,
} from "@/domain/sessions/sessionModels";

/**
 * PRE-9 C.3 (CE-FMT-02 ; ch07 « Défauts validés » ; D-02, D-13, D-16, D-24, ARB-18b) — réglages des
 * modèles et Exercices produits.
 */

const base = durationParameters(45, 2, 15);
const member = { executionParameters: base };

describe("valeurs initiales validées", () => {
  it("Formats et départs rapides : seules les valeurs décidées", () => {
    expect(initialModelSettings("INTERVALS_30_30")).toMatchObject({ seriesCount: 6 });
    expect(initialModelSettings("EMOM")).toEqual({ roundCount: 6, windowSeconds: 60 });
    expect(initialModelSettings("AMRAP")).toEqual({ durationSeconds: 720 });
    expect(initialModelSettings("FOR_TIME")).toEqual({ volumePerRound: [21, 15, 9] });
    expect(initialModelSettings("DEATH_BY")).toEqual({ startRepetitions: 1, incrementRepetitions: 1, windowSeconds: 60 });
    expect(initialModelSettings("STRENGTH")).toEqual({ seriesCount: 3, repetitions: 15 });
    expect(initialModelSettings("PROGRESSION")).toEqual({ repetitionsPerSeries: [10, 12, 14] });
    expect(initialModelSettings("UNTIL_FAILURE")).toEqual({ seriesCount: 3 });
    expect(initialModelSettings("SUPERSET")).toEqual({ passages: 1 });
  });
});

describe("Format porté par l'Exercice (D-02)", () => {
  it("Tabata : 8 × 20 s / 10 s imposés, Format sans réglage", () => {
    const parameters = modelExecutionParameters("TABATA", initialModelSettings("TABATA"), base);
    expect(parameters.mode).toBe("DURATION");
    expect(seriesCountOf(parameters)).toBe(8);
    expect(seriesRowsOf(parameters)[0]).toMatchObject({ target: { kind: "NUMBER", value: 20 }, pauseSeconds: 10 });
    expect(modelFormat("TABATA", initialModelSettings("TABATA"))).toEqual({ key: "TABATA", settings: {} });
  });

  it("une constante n'est jamais réglable", () => {
    const settings = initialModelSettings("TABATA");
    expect(withModelSetting("TABATA", settings, "workSeconds", 30)).toBe(settings);
  });

  it("EMOM : N séries (une par fenêtre), réglages du Format, durée N × W", () => {
    const settings = withModelSetting("EMOM", initialModelSettings("EMOM"), "roundCount", 8);
    const parameters = modelExecutionParameters("EMOM", settings, base);
    expect(seriesCountOf(parameters)).toBe(8);
    const format = modelFormat("EMOM", settings)!;
    expect(format).toEqual({ key: "EMOM", settings: { roundCount: 8, windowSeconds: 60 } });
    expect(computeActivityDurationResult({ type: "EXERCISE", executionParameters: parameters, format })).toMatchObject({ seconds: 480 });
  });

  it("For time : zéro admis dans une position, jamais un volume total nul (ARB-18b)", () => {
    const settings = initialModelSettings("FOR_TIME");
    expect(withModelSetting("FOR_TIME", settings, "volumePerRound", [21, 0, 9]).volumePerRound).toEqual([21, 0, 9]);
    expect(withModelSetting("FOR_TIME", settings, "volumePerRound", [0, 0, 0])).toBe(settings);
  });

  it("départ rapide : aucun Format ; Progression 10/12/14 répétitions", () => {
    expect(modelFormat("PROGRESSION", initialModelSettings("PROGRESSION"))).toBeNull();
    const parameters = modelExecutionParameters("PROGRESSION", initialModelSettings("PROGRESSION"), base);
    expect(parameters.mode).toBe("REPETITIONS");
    expect(seriesRowsOf(parameters).map((row) => row.target)).toEqual([10, 12, 14].map((value) => ({ kind: "NUMBER", value })));
  });
});

describe("organisation (D-13, D-16, D-24)", () => {
  it("proposée à partir du deuxième Exercice pour Tabata, EMOM et Progression seulement", () => {
    expect(proposesOrganisation("TABATA", 1)).toBe(false);
    expect(proposesOrganisation("TABATA", 2)).toBe(true);
    expect(proposesOrganisation("EMOM", 2)).toBe(true);
    expect(proposesOrganisation("PROGRESSION", 2)).toBe(true);
    expect(proposesOrganisation("FOR_TIME", 2)).toBe(false);
    expect(proposesOrganisation("AMRAP", 2)).toBe(false);
  });

  it("En alternance : Circuit alterné de N = séries des membres (Tabata : 8) ; À la suite : Exercices enchaînés", () => {
    const tabata = { executionParameters: modelExecutionParameters("TABATA", initialModelSettings("TABATA"), base) };
    expect(modelArrangement("TABATA", initialModelSettings("TABATA"), "ALTERNATED", [tabata, tabata])).toEqual({
      kind: "CIRCUIT",
      nature: "SERIES",
      repeatCount: 8,
    });
    expect(modelArrangement("TABATA", initialModelSettings("TABATA"), "SEQUENCE", [tabata, tabata])).toEqual({ kind: "SEQUENCE" });
  });

  it("Superset : Circuit groupé d'un passage (D-24)", () => {
    expect(modelArrangement("SUPERSET", initialModelSettings("SUPERSET"), "SEQUENCE", [member, member])).toEqual({
      kind: "CIRCUIT",
      nature: "TOURS",
      repeatCount: 1,
    });
  });

  it("brouillon : Exercices avant le Circuit, ou membres du Circuit avec sa nature et son compte", () => {
    const exercises = [{ id: "a", structuralPosition: "AFTER_TOUR" as const }];
    expect(modelDraftPatch(exercises, { kind: "SEQUENCE" }).exercises[0]!.structuralPosition).toBe("BEFORE_TOUR");
    expect(modelDraftPatch(exercises, { kind: "CIRCUIT", nature: "SERIES", repeatCount: 8 })).toEqual({
      exercises: [{ id: "a", structuralPosition: "IN_TOUR" }],
      tourRepeatCount: 8,
      circuitNature: "SERIES",
    });
  });
});
