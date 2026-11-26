import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { carrierCircuitDuration, progressiveFormatDuration } from "@/domain/sessions/calculations";
import { configurationValidity } from "@/domain/sessions/configurationValidity";
import { emomIntervalsOf, emomIntervalsTotal, withEmomIntervalAt, withEmomIntervals } from "@/domain/sessions/emomIntervals";
import {
  appendModelToDraft,
  buildModelElements,
  emomDurationOverflow,
  initialAnswers,
  initialMovementValues,
  withAnswer,
  type ModelAnswers,
  type ModelMovement,
} from "@/domain/sessions/formatModels";
import { modelStateOfCircuit } from "@/domain/sessions/formatReedit";
import { elementFormatViolations } from "@/domain/sessions/formats";
import { setLayoutCircuitFormatSetting } from "@/domain/sessions/layoutOperations";
import { createEmptyDraft, toStructuredSessionInput, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits } from "@/domain/sessions/structure";
import { formatSheetContextOf } from "@/features/sessions/formatSheetContext";

/**
 * D-607 (D-572 point 6 et D-573 point 1 de la branche de documentation, Hermann, 25-26/11/2026 ; Formats § 9.9, § 9.10) — EMOM :
 * l'intervalle est propre à chaque mouvement et à chaque tour ; « Dans chaque intervalle », l'intervalle de chaque tour est partagé
 * par les mouvements : le modifier pour l'un le modifie pour les autres. Jest ne prouve que le modèle : rendu réel sur iPhone.
 */

const base = (id: string, parameters = repetitionParameters(10, 3, 0)): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: parameters,
  postActivityRecoverySeconds: 0,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
});

let next = 0;
const newId = () => `c${++next}`;
const movementsOf = (answers: ModelAnswers, ids: readonly string[]): ModelMovement[] =>
  ids.map((id) => {
    const exercise = base(id);
    const values = initialMovementValues("EMOM", answers, exercise);
    return { exercise, values: { ...values, cells: Array.from({ length: answers.seriesCount ?? 1 }, () => ({ repetitions: 10, loadKg: null })) } };
  });
const elementsOf = (answers: ModelAnswers, movements: readonly ModelMovement[]) => buildModelElements("EMOM", answers, movements, newId);
const draftOf = (answers: ModelAnswers, movements: readonly ModelMovement[]): SessionDraft => appendModelToDraft(createEmptyDraft(), elementsOf(answers, movements), newId);
const emomOverflowIn = (elements: ReturnType<typeof elementsOf>) => {
  const validity = configurationValidity({ elements, stopPoints: [] });
  return validity.status === "invalid" && validity.issues.some((issue) => issue.reason === "EMOM_DURATION");
};
const builtCircuit = (answers: ModelAnswers, movements: readonly ModelMovement[]) => structureCircuits({ elements: elementsOf(answers, movements) })[0]!;

describe("Stockage des intervalles par série ou par tour (compatibilité avec les séances existantes)", () => {
  it("liste absente : l'intervalle unique pour chaque série ; liste écrite seulement si les valeurs diffèrent", () => {
    expect(emomIntervalsOf({ intervalSeconds: 45 }, "intervalSeconds", 3)).toEqual([45, 45, 45]);
    expect(emomIntervalsOf({}, "windowSeconds", 2)).toEqual([60, 60]);
    expect(withEmomIntervals({ intervalSeconds: 60 }, "intervalSeconds", [60, 60, 60])).toEqual({ intervalSeconds: 60 });
    const varied = withEmomIntervals({ intervalSeconds: 60 }, "intervalSeconds", [60, 90, 75]);
    expect(varied).toEqual({ intervalSeconds: 60, intervalsSeconds: [60, 90, 75] });
    expect(emomIntervalsOf(varied, "intervalSeconds", 3)).toEqual([60, 90, 75]);
    expect(emomIntervalsTotal(varied, "intervalSeconds", 3)).toBe(225);
    // Série ajoutée : complétée par l'intervalle unique ; remise à l'identique : la liste disparaît.
    expect(emomIntervalsOf(varied, "intervalSeconds", 4)).toEqual([60, 90, 75, 60]);
    expect(withEmomIntervalAt(withEmomIntervalAt(varied, "intervalSeconds", 3, 1, 60), "intervalSeconds", 3, 2, 60)).toEqual({ intervalSeconds: 60 });
  });

  it("intervalle unique réécrit seul par un autre chemin (durée de tour du Circuit) : la liste périmée est ignorée", () => {
    expect(emomIntervalsOf({ windowSeconds: 50, windowsSeconds: [60, 45, 60] }, "windowSeconds", 3)).toEqual([50, 50, 50]);
  });

  it("réglages valides pour l'Exercice et le Circuit porteur ; liste invalide refusée", () => {
    expect(elementFormatViolations({ key: "EMOM", settings: { intervalSeconds: 60, intervalsSeconds: [60, 90] } })).toEqual([]);
    expect(elementFormatViolations({ key: "EMOM", settings: { windowSeconds: 60, windowsSeconds: [60, 45] } }, { kind: "CIRCUIT", nature: "TOURS" })).toEqual([]);
    expect(elementFormatViolations({ key: "EMOM", settings: { intervalSeconds: 60, intervalsSeconds: [60, 0] } })).toEqual(["FORMAT_SETTING_INVALID"]);
    expect(elementFormatViolations({ key: "EMOM", settings: { intervalSeconds: 60, intervalsSeconds: 90 } })).toEqual(["FORMAT_SETTING_INVALID"]);
  });
});

describe("Point 7 / D-573 point 1 — « Dans chaque intervalle » : intervalle partagé du circuit, modifié depuis un mouvement", () => {
  const answers: ModelAnswers = { ...initialAnswers("EMOM"), seriesCount: 3, intervalSeconds: 60, execution: "EACH_INTERVAL" };

  it("la modale d'un membre affiche l'intervalle partagé et le reporte au Circuit : les autres mouvements le voient modifié", () => {
    const draft = draftOf(answers, movementsOf(answers, ["a", "b"]));
    const a = formatSheetContextOf(draft, "a", () => undefined)!;
    expect(a.rows).toContain("interval");
    expect(a.emom?.sharedIntervals).toEqual([60, 60, 60]);
    let updated = draft;
    const context = formatSheetContextOf(draft, "a", (change) => {
      updated = change(updated);
    })!;
    context.onApply(context.settings, null, [60, 45, 60]);
    const circuit = structureCircuits(updated.structure!)[0]!;
    expect(circuit.format?.settings).toEqual({ windowSeconds: 60, windowsSeconds: [60, 45, 60] });
    // Membres sans intervalle propre ; l'autre mouvement lit l'intervalle partagé modifié.
    expect(updated.exercises.find((exercise) => exercise.id === "a")?.format?.settings).toEqual({});
    expect(formatSheetContextOf(updated, "b", () => undefined)!.emom?.sharedIntervals).toEqual([60, 45, 60]);
    // Un seul intervalle (un tour, ou tous égaux) : le premier tour modifié change la valeur de tous.
    let single = updated;
    formatSheetContextOf(updated, "b", (change) => {
      single = change(single);
    })!.onApply({}, null, [75, 75, 75]);
    expect(structureCircuits(single.structure!)[0]!.format?.settings).toEqual({ windowSeconds: 75 });
    expect(formatSheetContextOf(single, "a", () => undefined)!.emom?.sharedIntervals).toEqual([75, 75, 75]);
  });

  it("durée du Circuit = somme des tours ; contrôle de dépassement au tour concerné ; la séance reste valide", () => {
    const settings = withEmomIntervals({ windowSeconds: 60 }, "windowSeconds", [60, 30, 60]);
    expect(carrierCircuitDuration({ repeatCount: 3, format: { key: "EMOM", settings } })?.seconds).toBe(150);
    const draft = draftOf({ ...answers, intervalsSeconds: [60, 30, 60] }, movementsOf(answers, ["a", "b"]));
    expect(structureCircuits(draft.structure!)[0]!.format?.settings).toEqual({ windowSeconds: 60, windowsSeconds: [60, 30, 60] });
    expect(toStructuredSessionInput({ ...draft, name: "EMOM" }, newId).ok).toBe(true);
    // 20 s + 20 s au tour 2 (30 s) : dépassement de ce tour seulement.
    const timed = elementsOf({ ...answers, intervalsSeconds: [60, 30, 60] }, ["a", "b"].map((id) => ({
      exercise: base(id, durationParameters(20)),
      values: { mode: "DURATION" as const, cells: [20, 20, 20].map((repetitions) => ({ repetitions, loadKg: null })) },
    })));
    expect(emomOverflowIn(timed)).toBe(true);
    // Mêmes durées, tours de 60 s : aucun dépassement.
    const fitting = elementsOf(answers, ["a", "b"].map((id) => ({
      exercise: base(id, durationParameters(20)),
      values: { mode: "DURATION" as const, cells: [20, 20, 20].map((repetitions) => ({ repetitions, loadKg: null })) },
    })));
    expect(emomOverflowIn(fitting)).toBe(false);
    expect(emomDurationOverflow({ ...answers, intervalsSeconds: [60, 30, 60] }, ["a", "b"].map((id) => ({
      exercise: base(id, durationParameters(20)),
      values: { mode: "DURATION" as const, cells: [20, 20, 20].map((repetitions) => ({ repetitions, loadKg: null })) },
    })))).toEqual([{ index: 0, column: 1 }, { index: 1, column: 1 }]);
  });

  it("réouverture du format : intervalles des tours repris ; l'Intervalle du questionnaire les règle de nouveau tous", () => {
    const reopened = modelStateOfCircuit("EMOM", builtCircuit({ ...answers, intervalsSeconds: [60, 45, 60] }, movementsOf(answers, ["a", "b"])));
    expect(reopened.answers.intervalsSeconds).toEqual([60, 45, 60]);
    expect(withAnswer(reopened.answers, "intervalSeconds", 90).intervalsSeconds).toBeUndefined();
  });

  it("durée de chaque tour réglée sur le Circuit (Composition) : tous les tours suivent", () => {
    const draft = draftOf({ ...answers, intervalsSeconds: [60, 45, 60] }, movementsOf(answers, ["a", "b"]));
    const circuitId = structureCircuits(draft.structure!)[0]!.id;
    const edited = setLayoutCircuitFormatSetting(draft, circuitId, "windowSeconds", 50);
    expect(formatSheetContextOf(edited, "a", () => undefined)!.emom?.sharedIntervals).toEqual([50, 50, 50]);
  });
});

describe("Point 21 — EMOM seul, À la suite, En alternance : intervalle propre à chaque mouvement et à chaque série", () => {
  const answers: ModelAnswers = { ...initialAnswers("EMOM"), seriesCount: 3, intervalSeconds: 60, execution: "ALTERNATED" };

  it("chaque mouvement garde ses intervalles ; durée = somme des séries ; réouverture sans perte", () => {
    const movements = movementsOf(answers, ["a", "b"]);
    const own = [{ ...movements[0]!, values: { ...movements[0]!.values, intervals: [60, 90, 75] } }, movements[1]!];
    const draft = draftOf(answers, own);
    const a = draft.exercises.find((exercise) => exercise.id === "a")!;
    const b = draft.exercises.find((exercise) => exercise.id === "b")!;
    expect(a.format?.settings).toEqual({ intervalSeconds: 60, intervalsSeconds: [60, 90, 75] });
    expect(b.format?.settings).toEqual({ intervalSeconds: 60 });
    expect(progressiveFormatDuration({ ...a, format: a.format! })?.seconds).toBe(225);
    const reopened = modelStateOfCircuit("EMOM", builtCircuit(answers, own));
    expect(reopened.movements.map((movement) => movement.values.intervals)).toEqual([[60, 90, 75], undefined]);
  });

  it("un mouvement seul (une série) : un seul intervalle, sans liste", () => {
    const one: ModelAnswers = { ...answers, seriesCount: 1 };
    const draft = draftOf(one, movementsOf(one, ["a"]));
    expect(draft.exercises[0]!.format?.settings).toEqual({ intervalSeconds: 60 });
  });
});
