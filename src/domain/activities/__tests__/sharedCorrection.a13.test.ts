import { describe, expect, it } from "@jest/globals";

import { groupDefinitionsByMovement, type ActivityDefinition } from "@/domain/activities/ActivityDefinition";
import {
  CATALOG_EXECUTION_PARAMETERS_VERSION,
  unsetTarget,
  type ExecutionParameters,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import {
  createExerciseSnapshot,
  ExerciseSnapshotDataError,
  parseExerciseSnapshot,
  serializeExerciseSnapshot,
} from "@/domain/activities/exerciseSnapshot";
import { resolveCatalogParameters, type Movement, type MovementPhase } from "@/domain/activities/Movement";
import {
  assessSharedCorrection,
  phaseSetChanged,
  planSiblingCorrection,
  planSiblingsCorrection,
} from "@/domain/activities/sharedCorrection";
import {
  durationParameters,
  repetitionParameters,
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import { duplicateActivity } from "@/domain/sessions/composition";
import type { Activity, Session } from "@/domain/sessions/Session";
import { createExerciseDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { toDuplicateSessionDraft } from "@/domain/sessions/sessionDuplication";

/**
 * PRE-7 (A1.3, D-437, D-438, MFN-02, MFN-03, MFN-08 à MFN-10, API-SEA-05) —
 * domaine pur de la correction partagée (plan des frères par `phaseId`,
 * frères incomplets explicitement acceptés, évaluation avant enregistrement),
 * regroupement par geste, filiation des duplications et de l'Instantané.
 */

const phases = (...durations: number[]): WorkPhase[] =>
  durations.map((durationSeconds, index) => ({ id: index + 1, label: `Phase ${index + 1}`, durationSeconds }));

const phased = (workPhases: readonly WorkPhase[]): ExecutionParameters =>
  uniformParameters({
    mode: "DURATION",
    count: 3,
    target: workPhases.reduce((sum, phase) => sum + phase.durationSeconds, 0),
    pauseSeconds: 10,
    workPhases: [...workPhases],
  });

const structure = (...ids: number[]): MovementPhase[] => ids.map((id) => ({ id, label: `Phase ${id}` }));

const sibling = (parameters: ExecutionParameters) => ({ definitionId: "def-2", parameters });

function uniformOf(parameters: { readonly series: unknown }) {
  const series = parameters.series as { kind: string };
  if (series.kind !== "UNIFORM") {
    throw new Error("uniform series expected");
  }
  return parameters.series as {
    readonly target: { readonly kind: string; readonly value?: number };
    readonly phaseDurations: readonly { readonly phaseId: number; readonly durationSeconds: number | null }[];
  };
}

const movement = (overrides: Partial<Movement> = {}): Movement => ({
  id: "mov-1",
  name: "Squat",
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: structure(1, 2),
  nextPhaseId: 3,
  used: false,
  levelGroup: null,
  ...overrides,
});

describe("PRE-7 A1.3 — plan d'un Exercice frère (MFN-08, durées par phaseId)", () => {
  it("ensemble inchangé (renommage, déplacement) → UNCHANGED ; phaseSetChanged ignore ordre et libellés", () => {
    const moved: MovementPhase[] = [{ id: 2, label: "x" }, { id: 1, label: "y" }];
    expect(phaseSetChanged(structure(1, 2), moved)).toBe(false);
    expect(planSiblingCorrection(structure(1, 2), [{ id: 2, label: "B" }, { id: 1, label: "A" }], sibling(phased(phases(6, 3))))).toEqual({
      status: "UNCHANGED",
    });
  });

  it("phase ajoutée sans complétion → NEEDS_COMPLETION (phase 3) ; durée fournie → complet, Cible = somme ; null → incomplet, Cible UNSET", () => {
    const own = sibling(phased(phases(8, 4)));
    expect(planSiblingCorrection(structure(1, 2), structure(1, 2, 3), own)).toEqual({
      status: "NEEDS_COMPLETION",
      gap: { definitionId: "def-2", missingPhaseIds: [3], missingSeriesDuration: false },
    });

    const completed = planSiblingCorrection(structure(1, 2), structure(1, 2, 3), own, {
      definitionId: "def-2",
      phaseDurations: [{ phaseId: 3, durationSeconds: 5 }],
    });
    expect(completed.status).toBe("READY");
    if (completed.status !== "READY") return;
    expect(completed.incomplete).toBe(false);
    expect(completed.parameters.version).toBe(CATALOG_EXECUTION_PARAMETERS_VERSION);
    expect(uniformOf(completed.parameters).target).toEqual({ kind: "NUMBER", value: 17 });
    // Valeurs déjà présentes conservées par identifiant, jamais inventées.
    expect(uniformOf(completed.parameters).phaseDurations).toEqual([
      { phaseId: 1, durationSeconds: 8 },
      { phaseId: 2, durationSeconds: 4 },
      { phaseId: 3, durationSeconds: 5 },
    ]);

    const skipped = planSiblingCorrection(structure(1, 2), structure(1, 2, 3), own, {
      definitionId: "def-2",
      phaseDurations: [{ phaseId: 3, durationSeconds: null }],
    });
    expect(skipped.status).toBe("READY");
    if (skipped.status !== "READY") return;
    expect(skipped.incomplete).toBe(true);
    expect(uniformOf(skipped.parameters).target).toEqual(unsetTarget());
    expect(uniformOf(skipped.parameters).phaseDurations.map((entry) => entry.durationSeconds)).toEqual([8, 4, null]);
  });

  it("phase retirée : durées restantes conservées par identifiant, aucune complétion ; déplacement suivi par l'ordre de la nouvelle structure", () => {
    const plan = planSiblingCorrection(structure(1, 2, 3), [{ id: 3, label: "C" }, { id: 1, label: "A" }], sibling(phased(phases(6, 3, 2))));
    expect(plan.status).toBe("READY");
    if (plan.status !== "READY") return;
    expect(uniformOf(plan.parameters).phaseDurations).toEqual([
      { phaseId: 3, durationSeconds: 2 },
      { phaseId: 1, durationSeconds: 6 },
    ]);
    expect(uniformOf(plan.parameters).target).toEqual({ kind: "NUMBER", value: 8 });
  });

  it("Avec → Sans : frère complet → durée de série = somme (proposition conservatrice) ; frère incomplet → durée de série à compléter, null → Cible UNSET", () => {
    const complete = planSiblingCorrection(structure(1, 2), [], sibling(phased(phases(6, 3))));
    expect(complete.status).toBe("READY");
    if (complete.status !== "READY") return;
    expect(uniformOf(complete.parameters)).toEqual(expect.objectContaining({ target: { kind: "NUMBER", value: 9 }, phaseDurations: [] }));

    // Frère déjà incomplet (durée 0 de la représentation résolue = manquante).
    const incomplete = sibling(phased([{ id: 1, label: "a", durationSeconds: 6 }, { id: 2, label: "b", durationSeconds: 0 }]));
    expect(planSiblingCorrection(structure(1, 2), [], incomplete)).toEqual({
      status: "NEEDS_COMPLETION",
      gap: { definitionId: "def-2", missingPhaseIds: [], missingSeriesDuration: true },
    });
    const filled = planSiblingCorrection(structure(1, 2), [], incomplete, { definitionId: "def-2", seriesDurationSeconds: 40 });
    expect(filled.status === "READY" && uniformOf(filled.parameters).target).toEqual({ kind: "NUMBER", value: 40 });

    const skipped = planSiblingCorrection(structure(1, 2), [], incomplete, { definitionId: "def-2", seriesDurationSeconds: null });
    expect(skipped.status).toBe("READY");
    if (skipped.status !== "READY") return;
    expect(skipped.incomplete).toBe(true);
    // Relu : INCOMPLETE sans phase manquante, durée de série à renseigner.
    const resolution = resolveCatalogParameters([], skipped.parameters);
    expect(resolution).toEqual(expect.objectContaining({ status: "INCOMPLETE", missingPhaseIds: [] }));
  });

  it("Sans → Avec : frère en Répétitions, à l'échec ou en séries variables → INELIGIBLE (MFN-02, éligibilité conservée)", () => {
    for (const parameters of [
      repetitionParameters(10, 3, 10),
      uniformParameters({ mode: "DURATION", count: 3, target: "FAILURE", pauseSeconds: 10 }),
      variableParameters({ mode: "DURATION", rows: [[30, 10], [45, 10]] }),
    ]) {
      expect(planSiblingCorrection([], structure(1, 2), sibling(parameters))).toEqual({ status: "INELIGIBLE" });
    }
    // Un frère en Durée à séries identiques est éligible : toutes ses phases sont à compléter.
    expect(planSiblingCorrection([], structure(1, 2), sibling(durationParameters(30, 3, 10)))).toEqual({
      status: "NEEDS_COMPLETION",
      gap: { definitionId: "def-2", missingPhaseIds: [1, 2], missingSeriesDuration: false },
    });
  });

  it("durée fournie invalide (0 s, somme > 3 535 s) → INVALID_COMPLETION", () => {
    const own = sibling(phased(phases(8, 4)));
    for (const durationSeconds of [0, 3600]) {
      expect(
        planSiblingCorrection(structure(1, 2), structure(1, 2, 3), own, {
          definitionId: "def-2",
          phaseDurations: [{ phaseId: 3, durationSeconds }],
        }),
      ).toEqual({ status: "INVALID_COMPLETION" });
    }
  });

  it("plan des frères : refus par priorité (inéligible, puis complétion invalide, puis complétions manquantes) ; complétion d'un non-frère ignorée", () => {
    const ok = { definitionId: "def-ok", parameters: phased(phases(8, 4)) };
    const missing = { definitionId: "def-missing", parameters: phased(phases(5, 5)) };
    const ineligible = { definitionId: "def-reps", parameters: repetitionParameters(10, 3, 10) };
    const completion = { definitionId: "def-ok", phaseDurations: [{ phaseId: 3, durationSeconds: 2 }] };
    expect(planSiblingsCorrection(structure(1, 2), structure(1, 2, 3), [ok, missing], [completion])).toEqual({
      status: "REFUSED",
      refusal: { kind: "SIBLING_COMPLETION_REQUIRED", siblings: [{ definitionId: "def-missing", missingPhaseIds: [3], missingSeriesDuration: false }] },
    });
    expect(
      planSiblingsCorrection(structure(1, 2), structure(1, 2, 3), [ok, missing], [
        { ...completion, phaseDurations: [{ phaseId: 3, durationSeconds: 0 }] },
      ]),
    ).toEqual({ status: "REFUSED", refusal: { kind: "INVALID_SIBLING_COMPLETION", definitionIds: ["def-ok"] } });
    expect(planSiblingsCorrection([], structure(1), [ineligible, { definitionId: "def-d", parameters: durationParameters(30, 3, 10) }])).toEqual({
      status: "REFUSED",
      refusal: { kind: "INELIGIBLE_SIBLINGS", definitionIds: ["def-reps"] },
    });
    const ready = planSiblingsCorrection(structure(1, 2), structure(1, 2, 3), [ok], [completion, { definitionId: "ailleurs", seriesDurationSeconds: 9 }]);
    expect(ready.status === "READY" && ready.updates.map((update) => update.definitionId)).toEqual(["def-ok"]);
    // Ensemble inchangé : aucun frère réécrit.
    expect(planSiblingsCorrection(structure(1, 2), structure(2, 1), [ok, ineligible])).toEqual({ status: "READY", updates: [] });
  });
});

describe("PRE-7 A1.3 — évaluation avant enregistrement (MFN-08, ch11 « Enregistrer une correction »)", () => {
  const edit = (overrides: Partial<Parameters<typeof assessSharedCorrection>[1]> = {}) => ({
    name: "Squat",
    description: null,
    phases: structure(1, 2),
    ...overrides,
  });

  it("question d'identité : seulement si « déjà utilisé » ET nom, description, médias ou structure modifiés", () => {
    expect(assessSharedCorrection(movement({ used: true }), edit({ name: "Squat sauté" }), [], 1).requiresIdentityDecision).toBe(true);
    expect(assessSharedCorrection(movement({ used: false }), edit({ name: "Squat sauté" }), [], 1)).toEqual(
      expect.objectContaining({ sensitiveChange: true, requiresIdentityDecision: false }),
    );
    expect(assessSharedCorrection(movement({ used: true }), edit({ description: "Dos droit" }), [], 1).requiresIdentityDecision).toBe(true);
    expect(assessSharedCorrection(movement({ used: true }), edit({ mediaAssetIds: ["p1"] }), [], 1).requiresIdentityDecision).toBe(true);
    // Libellé de phase : sensible (structure du geste) sans changement d'ensemble.
    const relabeled = assessSharedCorrection(movement({ used: true }), edit({ phases: [{ id: 1, label: "Descente" }, { id: 2, label: "Phase 2" }] }), [], 1);
    expect(relabeled).toEqual(expect.objectContaining({ requiresIdentityDecision: true, structuralChange: false }));
    // Paramètres, Catégorie ou Zones seuls (absents de l'édition comparée) : aucune question.
    expect(assessSharedCorrection(movement({ used: true }), edit(), [], 1)).toEqual(
      expect.objectContaining({ sensitiveChange: false, requiresIdentityDecision: false, structuralChange: false }),
    );
    // Médias non transmis : inchangés.
    expect(assessSharedCorrection(movement({ used: true, media: [{ assetId: "p1" }] as unknown as Movement["media"] }), edit(), [], 1).sensitiveChange).toBe(false);
  });

  it("portée : nombre de définitions, frères à compléter et frères inéligibles", () => {
    const assessment = assessSharedCorrection(
      movement({ used: true }),
      edit({ phases: structure(1, 2, 3) }),
      [
        { definitionId: "def-2", parameters: phased(phases(6, 3)) },
        { definitionId: "def-3", parameters: phased(phases(5, 5)) },
      ],
      3,
    );
    expect(assessment).toEqual({
      movementUsed: true,
      sensitiveChange: true,
      structuralChange: true,
      requiresIdentityDecision: true,
      affectedDefinitionCount: 3,
      siblingGaps: [
        { definitionId: "def-2", missingPhaseIds: [3], missingSeriesDuration: false },
        { definitionId: "def-3", missingPhaseIds: [3], missingSeriesDuration: false },
      ],
      ineligibleDefinitionIds: [],
    });
  });
});

describe("PRE-7 A1.3 — liste regroupée par geste (MFN-10)", () => {
  it("groupes dans l'ordre de première apparition, définitions dans l'ordre de la liste ; aucun alias", () => {
    const definition = (id: string, movementId: string) => ({ id, movementId }) as ActivityDefinition;
    const groups = groupDefinitionsByMovement([definition("d1", "m1"), definition("d2", "m2"), definition("d3", "m1")]);
    expect(groups.map((group) => [group.movementId, group.definitions.map((item) => item.id)])).toEqual([
      ["m1", ["d1", "d3"]],
      ["m2", ["d2"]],
    ]);
    expect(groupDefinitionsByMovement([])).toEqual([]);
  });
});

describe("PRE-7 A1.3 — filiation des duplications (MFN-03, MFN-09, MFN/AC32, MFN/AC04)", () => {
  const local: SessionDraftExercise = {
    ...createExerciseDraft("occ-local"),
    name: "Gainage",
    categoryId: "cardio",
    bodyZoneIds: ["dos"],
  };

  it("occurrence locale non enregistrée : la copie reçoit la filiation pré-allouée (identifiant de la source) et pendingLocalMovement ; la source est inchangée", () => {
    const [source, copy] = duplicateActivity([local], "occ-local", "occ-copy");
    expect(source).toBe(local);
    expect(copy).toEqual(expect.objectContaining({ id: "occ-copy", name: "Gainage (copie)", sourceMovementId: "occ-local", pendingLocalMovement: true }));
    // Copie de la copie : même filiation, toujours en attente.
    const again = duplicateActivity([local, copy!], "occ-copy", "occ-copy-2")[2];
    expect(again).toEqual(expect.objectContaining({ sourceMovementId: "occ-local", pendingLocalMovement: true }));
  });

  it("occurrence à filiation : conservée à l'identique, sans attente ; Récupération : aucune filiation inventée", () => {
    const copied = duplicateActivity([{ ...local, sourceMovementId: "mov-cat" }], "occ-local", "occ-copy")[1];
    expect(copied?.sourceMovementId).toBe("mov-cat");
    expect(copied).not.toHaveProperty("pendingLocalMovement");
    const recovery: SessionDraftExercise = { ...createExerciseDraft("rec-1"), type: "RECOVERY", name: "Récupération" };
    expect(duplicateActivity([recovery], "rec-1", "rec-2")[1]).not.toHaveProperty("sourceMovementId");
  });

  it("duplication de Séance : brouillon de création, `{nom} (copie)` libre, nouveaux identifiants, filiations identiques, Étiquette et Points d'arrêt copiés", () => {
    const occurrence = (id: string, sourceMovementId: string): Activity => ({
      id,
      sessionId: "ses-1",
      cycleId: "cyc-1",
      tourId: "tour-1",
      type: "EXERCISE",
      structuralPosition: "IN_TOUR",
      position: 0,
      name: `Exercice ${id}`,
      executionParameters: durationParameters(30, 3, 10),
      postActivityRecoverySeconds: null,
      instruction: null,
      bodyZoneIds: ["dos"],
      sideMode: "UNILATERAL",
      categoryId: "cardio",
      sourceMovementId,
      createdAt: "2026-10-24T08:00:00.000Z",
      updatedAt: "2026-10-24T08:00:00.000Z",
    }) as Activity;
    const session = {
      id: "ses-1",
      name: "Jambes",
      labelId: "lab-1",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      stopPoints: [{ id: "sp-1", scope: "SESSION", position: 1 }],
      cycle: { tour: { repeatCount: 2, exercises: [occurrence("occ-1", "mov-a"), occurrence("occ-2", "mov-b")] } },
    } as unknown as Session;
    let next = 0;
    const draft = toDuplicateSessionDraft(session, () => `new-${++next}`, ["Jambes", "Jambes (copie)"]);
    expect(draft.sourceSessionId).toBeNull();
    expect(draft).not.toHaveProperty("persistedExerciseIds");
    expect(draft.name).toBe("Jambes (copie 2)");
    expect(draft.labelId).toBe("lab-1");
    expect(draft.tourRepeatCount).toBe(2);
    expect(draft.stopPoints).toEqual([{ id: "sp-1", scope: "SESSION", position: 1 }]);
    expect(draft.exercises.map((exercise) => [exercise.id, exercise.sourceMovementId])).toEqual([
      ["new-1", "mov-a"],
      ["new-2", "mov-b"],
    ]);
  });
});

describe("PRE-7 A1.3 — Instantané avec filiation (MFN-03, MFN-11)", () => {
  const source = {
    sourceMovementId: "mov-1",
    name: "Gainage",
    categoryId: null,
    bodyZoneIds: [],
    executionParameters: phased(phases(20, 10)),
    recoverySeconds: 0,
    media: [],
  };

  it("filiation copiée, sérialisée et relue ; aucun champ de rang ni de total", () => {
    const snapshot = createExerciseSnapshot(source);
    expect(snapshot.sourceMovementId).toBe("mov-1");
    const json = serializeExerciseSnapshot(snapshot);
    expect(JSON.parse(json).sourceMovementId).toBe("mov-1");
    expect(json).not.toMatch(/rank|levelGroup|total/i);
    expect(parseExerciseSnapshot(json)).toEqual(snapshot);
    // Enveloppe antérieure sans filiation : relue avec `null`, jamais inventée.
    const { sourceMovementId: _filiation, ...legacy } = JSON.parse(json) as Record<string, unknown>;
    expect(parseExerciseSnapshot(JSON.stringify(legacy)).sourceMovementId).toBeNull();
  });

  it("entrée invalide : filiation vide, Exercice frère incomplet (durée de phase manquante, Cible à renseigner) → erreur", () => {
    expect(() => createExerciseSnapshot({ ...source, sourceMovementId: " " })).toThrow(ExerciseSnapshotDataError);
    expect(() =>
      createExerciseSnapshot({ ...source, executionParameters: phased([{ id: 1, label: "a", durationSeconds: 0 }, { id: 2, label: "b", durationSeconds: 5 }]) }),
    ).toThrow(ExerciseSnapshotDataError);
    expect(() =>
      createExerciseSnapshot({ ...source, executionParameters: uniformParameters({ mode: "DURATION", count: 3, target: "UNSET", pauseSeconds: 10 }) }),
    ).toThrow(ExerciseSnapshotDataError);
  });
});
