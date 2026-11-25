import { describe, expect, it } from "@jest/globals";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { StructureElement } from "@/domain/sessions/structure";
import { formatSheetContextOf, quickFormatOf } from "@/features/sessions/formatSheetContext";

/**
 * D-604 (Hermann, 25/11/2026 ; Formats § 9.7 ; D-569 sur la branche de documentation) : contexte de la modale « Paramètres
 * d'exécution » d'un exercice déjà dans la séance, ouverte depuis la Composition. Départ rapide (membre d'un Circuit sans format
 * porteur dont le modèle d'origine est un départ rapide) : Charge et De chaque côté, Mode si l'unité est libre. Format porteur : contexte
 * de format (`formatSheetContextOf`, champs du format). Exercice libre : aucun des deux (tous les champs).
 */
const exercise = (id: string, format?: SessionDraftExercise["format"]): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: repetitionParameters(10, 1, 0),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  ...(format !== undefined ? { format } : {}),
});

const draftOf = (elements: readonly StructureElement<string>[], exercises: readonly SessionDraftExercise[]): SessionDraft => ({
  ...createEmptyDraft(),
  exercises,
  structure: { elements, stopPoints: [] },
});

const circuit = (id: string, originModel: string | null, members: readonly string[], format?: object): StructureElement<string> =>
  ({ kind: "CIRCUIT", circuit: { id, nature: "SERIES", repeatCount: 2, originModel, exercises: [...members], ...(format !== undefined ? { format } : {}) } }) as never;

describe("D-604 — contexte de la modale depuis la Composition", () => {
  it.each([
    ["TABATA", "Tabata", false],
    ["INTERVALS_30_30", "30/30", false],
    ["STRENGTH", null, true],
    ["PROGRESSION", null, true],
    ["UNTIL_FAILURE", null, true],
    ["SUPERSET", null, true],
  ] as [string, string | null, boolean][])("membre d'un Circuit %s : départ rapide (unité libre : %s)", (model, name, unitOpen) => {
    const draft = draftOf([circuit("c", model, ["a", "b"])], [exercise("a"), exercise("b")]);
    const quick = quickFormatOf(draft, "a");
    expect(quick).toBeDefined();
    if (name !== null) expect(quick!.name).toBe(name);
    expect(quick!.unitOpen).toBe(unitOpen);
    expect(formatSheetContextOf(draft, "a", () => undefined)).toBeUndefined();
  });

  it("Circuit standard sans modèle d'origine, exercice seul : exercice libre (tous les champs)", () => {
    const draft = draftOf([circuit("c", null, ["a", "b"]), { kind: "EXERCISE", exercise: "x" }], [exercise("a"), exercise("b"), exercise("x")]);
    expect(quickFormatOf(draft, "a")).toBeUndefined();
    expect(quickFormatOf(draft, "x")).toBeUndefined();
    expect(formatSheetContextOf(draft, "x", () => undefined)).toBeUndefined();
  });

  it("membre d'un Circuit porteur (EMOM) : contexte de format, pas de départ rapide", () => {
    const draft = draftOf([circuit("e", "EMOM", ["a"], { key: "EMOM", settings: { windowSeconds: 60 } })], [exercise("a", { key: "EMOM", settings: {} })]);
    expect(quickFormatOf(draft, "a")).toBeUndefined();
    expect(formatSheetContextOf(draft, "a", () => undefined)?.key).toBe("EMOM");
  });
});
