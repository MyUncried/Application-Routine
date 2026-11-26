import { describe, expect, it } from "@jest/globals";

import { executionParametersEqual, readExecutionParameters, serializeExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { effectiveParameters, openSheetDraft, setRepetitionsGoal } from "@/domain/activities/ExecutionParametersDraft";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";

/**
 * D-607 (D-572 point 3 de la branche de documentation, Hermann, 25/11/2026 ; Formats § 9.9) : Tabata, 30/30 et HIIT — objectif de
 * répétitions facultatif, distinct de la Cible de durée. Le modèle ne le portait pas : clé facultative `repetitionsGoal`, écrite seulement
 * si elle est renseignée (les paramètres existants sont relus et réécrits à l'identique).
 */
describe("D-607 — objectif de répétitions facultatif d'un exercice en Durée", () => {
  it("absent : sérialisation inchangée, aucune clé écrite ; relu sans objectif", () => {
    const parameters = durationParameters(20, 8);
    const json = serializeExecutionParameters(parameters);
    expect(json).not.toContain("repetitionsGoal");
    expect(readExecutionParameters(json).repetitionsGoal).toBeUndefined();
  });

  it("renseigné : écrit après loadEnabled, relu, distinct de la Cible de durée ; l'égalité en tient compte", () => {
    const parameters = { ...durationParameters(20, 8), repetitionsGoal: 12 };
    const json = serializeExecutionParameters(parameters);
    expect(json.endsWith(`"loadEnabled":false,"repetitionsGoal":12}`)).toBe(true);
    const read = readExecutionParameters(json);
    expect(read.repetitionsGoal).toBe(12);
    expect(read.series).toEqual(durationParameters(20, 8).series);
    expect(executionParametersEqual(read, durationParameters(20, 8))).toBe(false);
    expect(executionParametersEqual(read, parameters)).toBe(true);
  });

  it("valeur mal formée : erreur de lecture", () => {
    const json = serializeExecutionParameters(durationParameters(20, 8)).replace(/}$/, ',"repetitionsGoal":0}');
    expect(() => readExecutionParameters(json)).toThrow();
  });

  it("brouillon de la modale : ouvert, réglé, retiré ; transmis par les paramètres effectifs", () => {
    const opened = openSheetDraft(durationParameters(20, 8));
    expect(effectiveParameters(opened).repetitionsGoal).toBeUndefined();
    const set = setRepetitionsGoal(opened, 15);
    expect(effectiveParameters(set).repetitionsGoal).toBe(15);
    expect(openSheetDraft(effectiveParameters(set)).repetitionsGoal).toBe(15);
    expect(effectiveParameters(setRepetitionsGoal(set, null)).repetitionsGoal).toBeUndefined();
  });
});
