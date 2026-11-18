import { describe, expect, it } from "@jest/globals";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { forTimeDurationRefused } from "@/domain/sessions/circuitRoles";
import type { ElementFormat } from "@/domain/sessions/formats";
import { createEmptyDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructureElement } from "@/domain/sessions/structure";

/**
 * Recette du 17/11/2026 (Hermann, autres remarques, a : « je suis capable de créer un for time avec deux exercices en durée si j'entre
 * les paramètres dans la composition de séance ») : la Durée est refusée au seul Exercice de la boucle encore en Répétitions.
 */

const BUY_IN = 1;
const exercise = (id: string, parameters: SessionDraftExercise["executionParameters"], role?: number, format: ElementFormat = { key: "FOR_TIME", settings: role === undefined ? {} : { circuitRole: role } }): SessionDraftExercise => ({
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
  format,
});

function circuitDraft(exercises: readonly SessionDraftExercise[]): SessionDraft {
  const elements: StructureElement<string>[] = [
    { kind: "CIRCUIT", circuit: { id: "f", nature: "SERIES", repeatCount: 3, format: { key: "FOR_TIME", settings: {} }, exercises: exercises.map((item) => item.id) } },
  ];
  return { ...createEmptyDraft(), exercises: [...exercises], structure: { elements, stopPoints: [] } };
}

describe("For time — Durée refusée au dernier exercice de la boucle en Répétitions", () => {
  it("boucle : squat (Répétitions) et planche (Durée) — Durée refusée au squat, pas à la planche", () => {
    const draft = circuitDraft([exercise("squat", repetitionParameters(10, 3, 0)), exercise("planche", durationParameters(30, 3, 0))]);
    expect(forTimeDurationRefused(draft, draft.structure, "squat")).toBe(true);
    expect(forTimeDurationRefused(draft, draft.structure, "planche")).toBe(false);
  });

  // Recette du 17/11/2026 (captures « For time a changer ») : séance déjà enregistrée sans Répétitions dans la boucle.
  it("boucle déjà toute en Durée (séance antérieure) : chaque exercice de la boucle est concerné", () => {
    const draft = circuitDraft([exercise("bird", durationParameters(10, 3, 0)), exercise("burpee", durationParameters(10, 3, 0))]);
    expect(forTimeDurationRefused(draft, draft.structure, "bird")).toBe(true);
    expect(forTimeDurationRefused(draft, draft.structure, "burpee")).toBe(true);
  });

  it("deux exercices en Répétitions dans la boucle : Durée permise à chacun", () => {
    const draft = circuitDraft([exercise("a", repetitionParameters(10, 3, 0)), exercise("b", repetitionParameters(12, 3, 0))]);
    expect(forTimeDurationRefused(draft, draft.structure, "a")).toBe(false);
  });

  it("le buy-in en Répétitions ne compte pas : seul exercice de boucle en Répétitions — refusée ; au buy-in lui-même — permise", () => {
    const draft = circuitDraft([exercise("bi", repetitionParameters(5, 1, 0), BUY_IN), exercise("a", repetitionParameters(10, 3, 0)), exercise("p", durationParameters(30, 3, 0))]);
    expect(forTimeDurationRefused(draft, draft.structure, "a")).toBe(true);
    expect(forTimeDurationRefused(draft, draft.structure, "bi")).toBe(false);
  });

  it("seul membre du Circuit : refusée ; exercice For time hors Circuit : non concerné (buy-in seul à l'écran du Format, 15/11)", () => {
    const single = circuitDraft([exercise("a", repetitionParameters(10, 3, 0))]);
    expect(forTimeDurationRefused(single, single.structure, "a")).toBe(true);
    const alone: SessionDraft = { ...createEmptyDraft(), exercises: [exercise("x", repetitionParameters(21, 3, 0))], structure: { elements: [{ kind: "EXERCISE", exerciseId: "x" } as never], stopPoints: [] } };
    expect(forTimeDurationRefused(alone, alone.structure, "x")).toBe(false);
  });
});
