import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { seriesCountOf, seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { configurationValidity } from "@/domain/sessions/configurationValidity";
import {
  allowedModes,
  appendModelToDraft,
  buildModelElements,
  executionOptions,
  FORMAT_MODEL_KEYS,
  initialAnswers,
  initialMovementValues,
  isFormatModelKey,
  modelDuration,
  summaryIssues,
  type ModelAnswers,
  type ModelMovement,
} from "@/domain/sessions/formatModels";
import { modelStateOfCircuit } from "@/domain/sessions/formatReedit";
import { PRECONFIGURATION_KEYS, QUICK_START_KEYS, SESSION_ORIGINS } from "@/domain/sessions/formats";
import { modelTimeline } from "@/domain/sessions/formatTimeline";
import { createEmptyDraft, toStructuredSessionInput, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, type StructureElement } from "@/domain/sessions/structure";

/**
 * D-608 (D-573 de la branche de documentation, point 3, Hermann, 26/11/2026 ; Formats § 9.10) — HIIT, nouveau format préconfiguré
 * modifiable, sur le modèle du 30/30 : Mode Durée, 6 séries identiques, objectif 40 s, pause 20 s, Durée de l'exercice 6 min,
 * Récupération 0 s ; Figma « HIIT — Récapitulatif » : 2 mouvements, 12 min. Une suite verte ne vaut pas recette sur iPhone.
 */

const base = (id: string): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: durationParameters(30, 3, 45),
  postActivityRecoverySeconds: 90,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
});

const movementsOf = (answers: ModelAnswers, ids: readonly string[]): ModelMovement[] =>
  ids.map((id) => {
    const exercise = base(id);
    return { exercise, values: initialMovementValues("HIIT", answers, exercise) };
  });

let next = 0;
const newId = () => `c${++next}`;
const seconds = (elements: readonly StructureElement<SessionDraftExercise>[]) => modelDuration(elements)?.seconds;

describe("D-608 — HIIT, préconfiguration du modèle du 30/30", () => {
  it("clé de modèle de premier rang : départ rapide, préconfiguration, origine de Séance ; exécution À la suite ou En alternance, Durée seule", () => {
    expect(FORMAT_MODEL_KEYS).toContain("HIIT");
    expect(isFormatModelKey("HIIT")).toBe(true);
    expect(QUICK_START_KEYS).toContain("HIIT");
    expect(PRECONFIGURATION_KEYS).toContain("HIIT");
    expect(SESSION_ORIGINS).toContain("HIIT");
    expect(executionOptions("HIIT")).toEqual(executionOptions("INTERVALS_30_30"));
    expect(allowedModes("HIIT", [], 0)).toEqual(["DURATION"]);
  });

  it("valeurs initiales : 6 séries, 40 s d'effort, 20 s de pause, sans charge, À la suite", () => {
    expect(initialAnswers("HIIT")).toEqual({ seriesCount: 6, workSeconds: 40, pauseSeconds: 20, withLoad: false, execution: "SEQUENCE" });
  });

  it("un mouvement : 1 Exercice standard en Durée, 6 séries identiques de 40 s / 20 s, Récupération 0 s, sans Format : 6 min", () => {
    const answers = initialAnswers("HIIT");
    const elements = buildModelElements("HIIT", answers, movementsOf(answers, ["a"]), newId);
    expect(elements).toHaveLength(1);
    const exercise = elements[0]!.kind === "EXERCISE" ? elements[0]!.exercise : null;
    expect(exercise).not.toHaveProperty("format");
    expect(exercise!.executionParameters.mode).toBe("DURATION");
    expect(seriesCountOf(exercise!.executionParameters)).toBe(6);
    expect(seriesRowsOf(exercise!.executionParameters).map((row) => [row.target, row.pauseSeconds])).toEqual(
      Array.from({ length: 6 }, () => [{ kind: "NUMBER", value: 40 }, 20]),
    );
    expect(exercise!.postActivityRecoverySeconds).toBe(0);
    expect(seconds(elements)).toBe(360);
  });

  it("deux mouvements (Figma « HIIT — Récapitulatif ») : À la suite, Circuit « HIIT » groupé à 1 tour, 12 min ; En alternance, 6 tours alternés, 12 min", () => {
    const answers = initialAnswers("HIIT");
    const sequence = buildModelElements("HIIT", answers, movementsOf(answers, ["a", "b"]), newId);
    const grouped = sequence[0]!.kind === "CIRCUIT" ? sequence[0]!.circuit : null;
    expect(grouped).toMatchObject({ nature: "TOURS", repeatCount: 1, originModel: "HIIT" });
    expect(grouped).not.toHaveProperty("format");
    expect(grouped!.exercises.map((exercise) => exercise.postActivityRecoverySeconds)).toEqual([0, 0]);
    expect(seconds(sequence)).toBe(720);
    const alternated = buildModelElements("HIIT", { ...answers, execution: "ALTERNATED" }, movementsOf(answers, ["a", "b"]), newId);
    const circuit = alternated[0]!.kind === "CIRCUIT" ? alternated[0]!.circuit : null;
    expect(circuit).toMatchObject({ nature: "SERIES", repeatCount: 6, originModel: "HIIT" });
    expect(seconds(alternated)).toBe(720);
  });

  it("modifiable : 4 séries de 30 s / 15 s → 3 min par mouvement ; aucun verrouillage", () => {
    const answers = { ...initialAnswers("HIIT"), seriesCount: 4, workSeconds: 30, pauseSeconds: 15 };
    expect(seconds(buildModelElements("HIIT", answers, movementsOf(answers, ["a"]), newId))).toBe(180);
  });

  it("récapitulatif complet, Déroulé de 12 blocs ; composition : Séance d'origine HIIT, structure valide, réouverture avec les mêmes réglages", () => {
    const answers = initialAnswers("HIIT");
    const movements = movementsOf(answers, ["a", "b"]);
    expect(summaryIssues("HIIT", answers, movements)).toEqual([]);
    expect(modelTimeline("HIIT", answers, movements).blocks.filter((block) => block.kind === "WORK")).toHaveLength(12);
    const built = buildModelElements("HIIT", answers, movements, newId);
    const draft = { ...appendModelToDraft(createEmptyDraft(), built, newId), name: "HIIT", origin: "HIIT" as const };
    const result = toStructuredSessionInput(draft, newId);
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    expect(result.value.origin).toBe("HIIT");
    expect(configurationValidity(result.value.structure).status).toBe("valid");
    const circuit = structureCircuits({ elements: built as StructureElement<SessionDraftExercise>[] })[0]!;
    const reopened = modelStateOfCircuit("HIIT", circuit);
    expect(reopened.answers).toMatchObject({ seriesCount: 6, workSeconds: 40, pauseSeconds: 20, execution: "SEQUENCE" });
    expect(reopened.movements).toHaveLength(2);
  });
});
