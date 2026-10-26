import { describe, expect, it } from "@jest/globals";

import { groupDefinitionsByMovement, type ActivityDefinition } from "@/domain/activities/ActivityDefinition";
import {
  CATALOG_EXECUTION_PARAMETERS_VERSION,
  failureTarget,
  numberTarget,
  unsetTarget,
  type ExecutionParameters,
  type SeriesTarget,
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

/** PRE-7 (D-446) : Cible indépendante de la somme des phases. */
const withTarget = (parameters: ExecutionParameters, target: SeriesTarget): ExecutionParameters => ({
  ...parameters,
  series: { ...(parameters.series as Extract<ExecutionParameters["series"], { kind: "UNIFORM" }>), target },
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
  aliases: [],
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

  it("phase ajoutée sans complétion → NEEDS_COMPLETION (phase 3) ; durée fournie → complet ; null → incomplet ; PRE-7 (D-446) : Cible du frère conservée", () => {
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
    // D-446 : la Cible n'est plus la somme des phases (8 + 4 + 5) ; elle reste celle du frère.
    expect(uniformOf(completed.parameters).target).toEqual({ kind: "NUMBER", value: 12 });
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
    // D-446 : Cible conservée (plus d'`UNSET` forcé) ; l'incomplétude vient de la durée manquante.
    expect(uniformOf(skipped.parameters).target).toEqual({ kind: "NUMBER", value: 12 });
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
    // PRE-7 (D-446) : Cible du frère conservée (11 s), jamais recalculée sur les phases restantes.
    expect(uniformOf(plan.parameters).target).toEqual({ kind: "NUMBER", value: 11 });
  });

  it("Avec → Sans (PRE-7, D-446) : Cible du frère conservée, complet ou non ; Cible à renseigner → durée de série à compléter, null → Cible UNSET", () => {
    const independent = phased(phases(6, 3));
    const complete = planSiblingCorrection(structure(1, 2), [], sibling(withTarget(independent, numberTarget(120))));
    expect(complete.status).toBe("READY");
    if (complete.status !== "READY") return;
    expect(uniformOf(complete.parameters)).toEqual(expect.objectContaining({ target: { kind: "NUMBER", value: 120 }, phaseDurations: [] }));

    // Frère incomplet (durée 0 de la représentation résolue = manquante) à Cible chiffrée : conservée.
    const partial = phased([{ id: 1, label: "a", durationSeconds: 6 }, { id: 2, label: "b", durationSeconds: 0 }]);
    const kept = planSiblingCorrection(structure(1, 2), [], sibling(partial));
    expect(kept.status === "READY" && uniformOf(kept.parameters).target).toEqual({ kind: "NUMBER", value: 6 });
    // À l'échec : conservée aussi.
    const failure = planSiblingCorrection(structure(1, 2), [], sibling(withTarget(independent, failureTarget())));
    expect(failure.status === "READY" && uniformOf(failure.parameters).target).toEqual(failureTarget());

    // Frère à durée de série à renseigner (Cible UNSET) : seule cette Cible demande la complétion.
    const incomplete = sibling(withTarget(partial, unsetTarget()));
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

  it("Sans → Avec (PRE-7, D-446 ; complément du 26/10/2026) : un frère en séries variables suit la même règle ; Répétitions et à l'échec éligibles, Cible conservée", () => {
    // D-446 (complément du 26/10/2026) : compatibilité phases + séries variables, motif commun aux lignes.
    const variable = variableParameters({ mode: "DURATION", rows: [[30, 10], [45, 10], ["FAILURE", 10]] });
    expect(planSiblingCorrection([], structure(1, 2), sibling(variable))).toEqual({
      status: "NEEDS_COMPLETION",
      gap: { definitionId: "def-2", missingPhaseIds: [1, 2], missingSeriesDuration: false },
    });
    const variableCompleted = planSiblingCorrection([], structure(1, 2), sibling(variable), {
      definitionId: "def-2",
      phaseDurations: [
        { phaseId: 1, durationSeconds: 5 },
        { phaseId: 2, durationSeconds: 2 },
      ],
    });
    expect(variableCompleted.status).toBe("READY");
    if (variableCompleted.status !== "READY") return;
    expect(variableCompleted.incomplete).toBe(false);
    expect(variableCompleted.parameters.series).toEqual({
      kind: "VARIABLE",
      rows: variable.series.kind === "VARIABLE" ? variable.series.rows : [],
      phaseDurations: [
        { phaseId: 1, durationSeconds: 5 },
        { phaseId: 2, durationSeconds: 2 },
      ],
    });
    // Avec → Sans : le motif est retiré, les lignes restent celles du frère.
    const withPattern = variableParameters({
      mode: "DURATION",
      rows: [[30, 10], [45, 10]],
      workPhases: [
        { id: 1, label: "Phase 1", durationSeconds: 5 },
        { id: 2, label: "Phase 2", durationSeconds: 2 },
      ],
    });
    const removed = planSiblingCorrection(structure(1, 2), [], sibling(withPattern));
    expect(removed.status === "READY" && removed.parameters.series).toEqual({
      kind: "VARIABLE",
      rows: withPattern.series.kind === "VARIABLE" ? withPattern.series.rows : [],
      phaseDurations: [],
    });
    // Séries identiques, tout Mode, toute Cible : éligible, toutes ses phases sont à compléter.
    const eligible: readonly ExecutionParameters[] = [
      durationParameters(30, 3, 10),
      repetitionParameters(10, 3, 10),
      uniformParameters({ mode: "DURATION", count: 3, target: "FAILURE", pauseSeconds: 10 }),
      uniformParameters({ mode: "REPETITIONS", count: 3, target: "FAILURE", pauseSeconds: 10 }),
    ];
    for (const parameters of eligible) {
      expect(planSiblingCorrection([], structure(1, 2), sibling(parameters))).toEqual({
        status: "NEEDS_COMPLETION",
        gap: { definitionId: "def-2", missingPhaseIds: [1, 2], missingSeriesDuration: false },
      });
      const completed = planSiblingCorrection([], structure(1, 2), sibling(parameters), {
        definitionId: "def-2",
        phaseDurations: [
          { phaseId: 1, durationSeconds: 5 },
          { phaseId: 2, durationSeconds: 2 },
        ],
      });
      expect(completed.status).toBe("READY");
      if (completed.status !== "READY") return;
      expect(completed.incomplete).toBe(false);
      expect(completed.parameters.mode).toBe(parameters.mode);
      expect(uniformOf(completed.parameters).target).toEqual((parameters.series as { readonly target: unknown }).target);
    }
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

  it("plan des frères : refus par priorité (complétion invalide, puis complétions manquantes, séries variables comprises) ; complétion d'un non-frère ignorée", () => {
    const ok = { definitionId: "def-ok", parameters: phased(phases(8, 4)) };
    const missing = { definitionId: "def-missing", parameters: phased(phases(5, 5)) };
    // PRE-7 (D-446, complément du 26/10/2026) : un frère en séries variables n'est plus inéligible ;
    // comme un frère identique, ses phases nouvelles sont à compléter.
    const variable = { definitionId: "def-reps", parameters: variableParameters({ mode: "REPETITIONS", rows: [[10, 10], [12, 10]] }) };
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
    expect(planSiblingsCorrection([], structure(1), [variable, { definitionId: "def-d", parameters: durationParameters(30, 3, 10) }])).toEqual({
      status: "REFUSED",
      refusal: {
        kind: "SIBLING_COMPLETION_REQUIRED",
        siblings: [
          { definitionId: "def-reps", missingPhaseIds: [1], missingSeriesDuration: false },
          { definitionId: "def-d", missingPhaseIds: [1], missingSeriesDuration: false },
        ],
      },
    });
    const ready = planSiblingsCorrection(structure(1, 2), structure(1, 2, 3), [ok], [completion, { definitionId: "ailleurs", seriesDurationSeconds: 9 }]);
    expect(ready.status === "READY" && ready.updates.map((update) => update.definitionId)).toEqual(["def-ok"]);
    // Ensemble inchangé : aucun frère réécrit.
    expect(planSiblingsCorrection(structure(1, 2), structure(2, 1), [ok, variable])).toEqual({ status: "READY", updates: [] });
  });
});

describe("PRE-7 A1.3 — évaluation avant enregistrement (MFN-08, ch11 « Enregistrer une correction »)", () => {
  const edit = (overrides: Partial<Parameters<typeof assessSharedCorrection>[1]> = {}) => ({
    name: "Squat",
    description: null,
    phases: structure(1, 2),
    ...overrides,
  });

  // PRE-7 (R-3, D-445 C03) : « utilisé » = au moins un AUTRE exercice (définitions et occurrences
  // persistées) — dernier argument —, plus l'indicateur irréversible `used`.
  it("question d'identité : seulement si utilisé par un autre exercice (C03) ET nom, description, médias ou structure modifiés", () => {
    expect(assessSharedCorrection(movement(), edit({ name: "Squat sauté" }), [], 1, 1).requiresIdentityDecision).toBe(true);
    expect(assessSharedCorrection(movement(), edit({ name: "Squat sauté" }), [], 1, 0)).toEqual(
      expect.objectContaining({ sensitiveChange: true, requiresIdentityDecision: false }),
    );
    expect(assessSharedCorrection(movement(), edit({ description: "Dos droit" }), [], 1, 1).requiresIdentityDecision).toBe(true);
    expect(assessSharedCorrection(movement(), edit({ mediaAssetIds: ["p1"] }), [], 1, 1).requiresIdentityDecision).toBe(true);
    // Libellé de phase : sensible (structure du geste) sans changement d'ensemble.
    const relabeled = assessSharedCorrection(movement(), edit({ phases: [{ id: 1, label: "Descente" }, { id: 2, label: "Phase 2" }] }), [], 1, 1);
    expect(relabeled).toEqual(expect.objectContaining({ requiresIdentityDecision: true, structuralChange: false }));
    // Paramètres, Catégorie ou Zones seuls (absents de l'édition comparée) : aucune question.
    expect(assessSharedCorrection(movement(), edit(), [], 1, 1)).toEqual(
      expect.objectContaining({ sensitiveChange: false, requiresIdentityDecision: false, structuralChange: false }),
    );
    // Médias non transmis : inchangés.
    expect(assessSharedCorrection(movement({ media: [{ assetId: "p1" }] as unknown as Movement["media"] }), edit(), [], 1, 1).sensitiveChange).toBe(false);
  });

  it("portée : nombre de définitions, frères à compléter et frères inéligibles", () => {
    const assessment = assessSharedCorrection(
      movement(),
      edit({ phases: structure(1, 2, 3) }),
      [
        { definitionId: "def-2", parameters: phased(phases(6, 3)) },
        { definitionId: "def-3", parameters: phased(phases(5, 5)) },
      ],
      3,
      2,
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
  // PRE-7 (R-3, C05) : une création locale terminée référence son Mouvement NEW, à son identifiant.
  const local: SessionDraftExercise = {
    ...createExerciseDraft("occ-local"),
    sourceMovementId: "occ-local",
    name: "Gainage",
    categoryId: "cardio",
    bodyZoneIds: ["dos"],
  };

  // PRE-7 (R-3, Q3) : `pendingLocalMovement` est retiré ; la copie référence le même Mouvement
  // (NEW du brouillon) et reçoit un numéro de copie, jamais un nom suffixé.
  it("occurrence locale non enregistrée : la copie référence le même Mouvement, même nom, numéro de copie 1 ; la source est inchangée", () => {
    const [source, copy] = duplicateActivity([local], "occ-local", "occ-copy");
    expect(source).toBe(local);
    expect(copy).toEqual(expect.objectContaining({ id: "occ-copy", name: "Gainage", sourceMovementId: "occ-local", copyNumber: 1 }));
    expect(copy).not.toHaveProperty("pendingLocalMovement");
    // Copie de la copie : même Mouvement, numéro suivant.
    const again = duplicateActivity([local, copy!], "occ-copy", "occ-copy-2")[2];
    expect(again).toEqual(expect.objectContaining({ sourceMovementId: "occ-local", copyNumber: 2 }));
  });

  it("occurrence à filiation : conservée à l'identique ; Récupération : aucune filiation inventée", () => {
    const copied = duplicateActivity([{ ...local, sourceMovementId: "mov-cat" }], "occ-local", "occ-copy")[1];
    expect(copied?.sourceMovementId).toBe("mov-cat");
    expect(copied?.copyNumber).toBe(1);
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
    // PRE-7 (D-446, complément du 26/10/2026) : séries variables à motif incomplet (durée 0) → même refus.
    const variableMotif = (seconds: number) =>
      variableParameters({
        mode: "DURATION",
        rows: [[30, 10], [45, 10]],
        workPhases: [
          { id: 1, label: "a", durationSeconds: 5 },
          { id: 2, label: "b", durationSeconds: seconds },
        ],
      });
    expect(() => createExerciseSnapshot({ ...source, executionParameters: variableMotif(0) })).toThrow(ExerciseSnapshotDataError);
    expect(createExerciseSnapshot({ ...source, executionParameters: variableMotif(2) }).executionParameters).toEqual(variableMotif(2));
  });
});
