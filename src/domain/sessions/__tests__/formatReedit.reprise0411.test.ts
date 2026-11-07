import { describe, expect, it } from "@jest/globals";

import { repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import { duplicateLayoutCircuit, removeLayoutCircuit, renameLayoutCircuit } from "@/domain/sessions/circuitActions";
import { appendModelToDraft, buildModelElements, initialAnswers, initialMovementValues, type ModelAnswers, type ModelMovement } from "@/domain/sessions/formatModels";
import { applyModelReedit, modelStateOfCircuit } from "@/domain/sessions/formatReedit";
import { createEmptyDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits, type StructureCircuit } from "@/domain/sessions/structure";

/**
 * Reprise du 04/11/2026 — « Modifier le format » (mise à jour consolidée §6 sexies) et actions du Circuit replié
 * (§6 quinquies) : préremplissage depuis l'état actuel, « variable », Avec / Sans charge effectif, mise à jour en
 * place des seuls champs modifiés, identifiants, nom et position conservés ; renommer, dupliquer, supprimer.
 */

const base = (id: string): SessionDraftExercise => ({
  id,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  name: `Mouvement ${id}`,
  executionParameters: repetitionParameters(10, 3, 45),
  postActivityRecoverySeconds: 90,
  instruction: null,
  bodyZoneIds: [],
  sideMode: "UNILATERAL",
  sourceMovementId: `mv-${id}`,
});

let next = 0;
const newId = () => `n${++next}`;

function draftWith(model: "TABATA" | "PROGRESSION", answers: ModelAnswers): SessionDraft {
  const movements: ModelMovement[] = ["a", "b"].map((id) => ({ exercise: base(id), values: initialMovementValues(model, answers, base(id)) }));
  return appendModelToDraft({ ...createEmptyDraft(), name: "Séance" }, buildModelElements(model, answers, movements, newId), newId);
}

const circuitOf = (draft: SessionDraft): StructureCircuit<SessionDraftExercise> => {
  const [circuit] = structureCircuits(draft.structure!);
  return { ...circuit!, exercises: circuit!.exercises.map((id) => draft.exercises.find((exercise) => exercise.id === id)!) };
};

describe("Modifier le format — réédition en place (MAJ 04/11 §6 sexies)", () => {
  const answers: ModelAnswers = { ...initialAnswers("TABATA"), execution: "ALTERNATED" };

  it("préremplissage depuis l'état actuel ; une valeur personnalisée dans la modale rend le réglage commun « variable »", () => {
    const draft = draftWith("TABATA", answers);
    const circuit = circuitOf(draft);
    // Travail personnalisé de B dans sa modale : 25 s.
    const custom = draft.exercises.map((exercise) =>
      exercise.id === circuit.exercises[1]!.id ? { ...exercise, executionParameters: { ...exercise.executionParameters, series: { ...exercise.executionParameters.series, target: { kind: "NUMBER" as const, value: 25 } } } } : exercise,
    );
    const state = modelStateOfCircuit("TABATA", circuitOf({ ...draft, exercises: custom as SessionDraftExercise[] }));
    expect(state.answers).toMatchObject({ seriesCount: 8, pauseSeconds: 10, execution: "ALTERNATED" });
    expect(state.variable.has("workSeconds")).toBe(true);
    expect(state.answers).not.toHaveProperty("workSeconds");
  });

  it("enregistrer : seule la Pause modifiée change ; identifiants, nom, position et travail personnalisé conservés", () => {
    const original = draftWith("TABATA", answers);
    const id = structureCircuits(original.structure!)[0]!.id;
    const named = renameLayoutCircuit(original, id, "Mon Tabata", newId);
    const custom = {
      ...named,
      exercises: named.exercises.map((exercise, index) =>
        index === 1 ? { ...exercise, executionParameters: { ...exercise.executionParameters, series: { ...exercise.executionParameters.series, target: { kind: "NUMBER" as const, value: 25 } } } } : exercise,
      ) as SessionDraftExercise[],
    };
    const opened = modelStateOfCircuit("TABATA", circuitOf(custom));
    const edited = { ...opened, answers: { ...opened.answers, pauseSeconds: 15 } };
    const saved = applyModelReedit(custom, id, opened, edited, newId);
    const circuit = structureCircuits(saved.structure!)[0]!;
    expect(circuit.id).toBe(id);
    expect(circuit.name).toBe("Mon Tabata");
    expect(circuit.exercises).toEqual(structureCircuits(custom.structure!)[0]!.exercises);
    const rows = (index: number) => seriesRowsOf(saved.exercises[index]!.executionParameters);
    expect(rows(0)[0]).toMatchObject({ target: { kind: "NUMBER", value: 20 }, pauseSeconds: 15 });
    expect(rows(1)[0]).toMatchObject({ target: { kind: "NUMBER", value: 25 }, pauseSeconds: 15 });
  });

  it("fermer sans enregistrer : état d'ouverture inchangé, aucune modification", () => {
    const draft = draftWith("TABATA", answers);
    const id = structureCircuits(draft.structure!)[0]!.id;
    const opened = modelStateOfCircuit("TABATA", circuitOf(draft));
    const saved = applyModelReedit(draft, id, opened, opened, newId);
    expect(saved.exercises).toEqual(draft.exercises);
  });

  it("Avec / Sans charge : état effectif — charges conservées sous « Sans » ne réactivent pas l'interrupteur", () => {
    const draft = draftWith("PROGRESSION", { ...initialAnswers("PROGRESSION"), execution: "ALTERNATED" });
    const kept = { ...draft, exercises: draft.exercises.map((exercise) => ({ ...exercise, executionParameters: { ...exercise.executionParameters, loadEnabled: false } })) };
    expect(modelStateOfCircuit("PROGRESSION", circuitOf(kept)).answers.withLoad).toBe(false);
    const loaded = { ...draft, exercises: draft.exercises.map((exercise, index) => (index === 0 ? { ...exercise, executionParameters: { ...exercise.executionParameters, loadEnabled: true } } : exercise)) };
    expect(modelStateOfCircuit("PROGRESSION", circuitOf(loaded)).answers.withLoad).toBe(true);
  });
});

describe("Circuit replié : Renommer, Dupliquer, Supprimer (MAJ 04/11 §6 quinquies)", () => {
  const answers: ModelAnswers = { ...initialAnswers("TABATA"), execution: "ALTERNATED" };

  it("renommer ; un nom vide reprend le nom par défaut", () => {
    const draft = draftWith("TABATA", answers);
    const id = structureCircuits(draft.structure!)[0]!.id;
    expect(structureCircuits(renameLayoutCircuit(draft, id, "  Fin de séance ", newId).structure!)[0]!.name).toBe("Fin de séance");
    expect(structureCircuits(renameLayoutCircuit(draft, id, "  ", newId).structure!)[0]!).not.toHaveProperty("name");
  });

  it("dupliquer : copie juste après, indépendante, Modèle d'origine conservé, nom « (C) »", () => {
    const draft = draftWith("TABATA", answers);
    const id = structureCircuits(draft.structure!)[0]!.id;
    const duplicated = duplicateLayoutCircuit(draft, id, "Tabata", newId)!;
    const [original, copy] = structureCircuits(duplicated.draft.structure!);
    expect(copy!.id).toBe(duplicated.copyId);
    expect(copy).toMatchObject({ originModel: "TABATA", name: "Tabata (C)", nature: "SERIES", repeatCount: 8 });
    expect(copy!.exercises).toHaveLength(2);
    expect(copy!.exercises.some((exercise) => original!.exercises.includes(exercise))).toBe(false);
    expect(duplicated.draft.exercises).toHaveLength(4);
  });

  it("supprimer : le Circuit et ses Exercices quittent la Séance", () => {
    const draft = draftWith("TABATA", answers);
    const id = structureCircuits(draft.structure!)[0]!.id;
    const removed = removeLayoutCircuit(draft, id, newId)!;
    expect(removed.exercises).toHaveLength(0);
    expect(structureCircuits(removed.structure ?? { elements: [], stopPoints: [] })).toHaveLength(0);
  });
});
