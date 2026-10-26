import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import { hasMissingPhaseDuration, type ExecutionParameters, type WorkPhase } from "@/domain/activities/ExecutionParameters";
import {
  durationParameters,
  repetitionParameters,
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import { duplicateActivity } from "@/domain/sessions/composition";
import type { Session } from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  createExerciseDraft,
  toCreateSessionInput,
  toSessionDraft,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-7 (A1.3, D-437, D-438, MFN-03 à MFN-10, API-SEA-05) — services MFN sur
 * SQLite RÉELLE (`node:sqlite`, schéma 012) : création avec origine (même
 * geste, variante rattachée ou non), correction partagée atomique (contenu,
 * durées par `phaseId`, frères incomplets explicitement acceptés, refus sans
 * écriture, échec au milieu), évaluation avant enregistrement, liste
 * regroupée, filiation d'une occurrence locale dupliquée avant le premier
 * enregistrement, duplication de Séance.
 *
 * PRE-7 (R-3, D-445 C05) : les occurrences de Séance relisent le contenu et la
 * structure de leur Mouvement ; une copie d'une création locale référence le
 * même Mouvement NEW du brouillon (`withLocalMovements`, comme l'éditeur).
 */

const NOW = "2026-10-24T09:00:00.000Z";

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

const input = (parameters: ExecutionParameters, overrides: Partial<CreateActivityDefinitionInput> = {}): CreateActivityDefinitionInput => ({
  name: "Squat",
  description: "Buste droit",
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: parameters,
  ...overrides,
});

function seriesOf(definition: ActivityDefinition | null) {
  const series = definition?.executionParameters.series;
  if (!series || series.kind !== "UNIFORM") {
    throw new Error("uniform series expected");
  }
  return series;
}

describe("PRE-7 A1.3 — services MFN (NodeSqliteDatabase REAL)", () => {
  let database: NodeSqliteDatabase;
  let sequence = 0;
  const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
  const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
  const service = () =>
    new ActivityDefinitionService(
      new SqliteActivityDefinitionRepository(database, ids("def"), () => NOW),
      undefined,
      undefined,
      undefined,
      undefined,
      movements(),
    );
  const sessionService = () => new SessionService(new SqliteSessionRepository(database, ids("ses"), () => NOW));

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  async function created(result: Awaited<ReturnType<ActivityDefinitionService["createActivityDefinitionWithOrigin"]>>) {
    if (result.status !== "CREATED") {
      throw new Error(result.status);
    }
    return result.value;
  }

  // PRE-7 (R-3, C05) : Exercices créés dans la Séance = créations locales terminées (Mouvements NEW).
  async function save(draft: SessionDraft): Promise<Session> {
    const result = await sessionService().createSession(withLocalMovements(draft));
    if (!result.ok) {
      throw new Error(JSON.stringify(result.violations));
    }
    return result.value;
  }

  const occurrencesOf = (session: Session) => [...(session.cycle.beforeTour ?? []), ...session.cycle.tour.exercises, ...(session.cycle.afterTour ?? [])];

  /** Deux Exercices du même geste à phases [6, 3] et [8, 4]. */
  async function twoSharing(name = "Squat") {
    const first = await created(await service().createActivityDefinitionWithOrigin(input(phased(phases(6, 3)), { name }), { kind: "INDEPENDENT" }));
    const second = await created(
      await service().createActivityDefinitionWithOrigin(input(phased(phases(8, 4)), { name: first.name }), {
        kind: "SAME_MOVEMENT",
        movementId: first.movementId,
      }),
    );
    return { first, second };
  }

  it("même geste : nouvelle définition sur le même Mouvement ; le contenu saisi est appliqué au geste partagé ; Mouvement inconnu → MOVEMENT_NOT_FOUND", async () => {
    const { first, second } = await twoSharing();
    expect(second.movementId).toBe(first.movementId);
    expect(second.id).not.toBe(first.id);
    expect(await database.getAllAsync("SELECT id FROM movements")).toEqual([{ id: first.movementId }]);

    // « Corriger ce geste » en création : le nom saisi vaut pour les deux Exercices.
    const third = await created(
      await service().createActivityDefinitionWithOrigin(input(phased(phases(2, 2)), { name: "Squat lent" }), {
        kind: "SAME_MOVEMENT",
        movementId: first.movementId,
      }),
    );
    expect(third.movementId).toBe(first.movementId);
    expect((await service().getActivityDefinition(first.id))?.name).toBe("Squat lent");
    expect(seriesOf(await service().getActivityDefinition(first.id)).workPhases.map((phase) => phase.durationSeconds)).toEqual([6, 3]);

    expect(
      await service().createActivityDefinitionWithOrigin(input(phased(phases(6, 3))), { kind: "SAME_MOVEMENT", movementId: "inconnu" }),
    ).toEqual({ status: "MOVEMENT_NOT_FOUND" });
    expect(
      await service().createActivityDefinitionWithOrigin(input(phased(phases(6, 3))), {
        kind: "VARIANT",
        originMovementId: "inconnu",
        joinOriginGroup: true,
      }),
    ).toEqual({ status: "MOVEMENT_NOT_FOUND" });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM activity_definitions")).toEqual({ count: 3 });
  });

  it("variante : nouveau Mouvement, original intact ; rattachée → insérée juste après l'origine (groupe créé au besoin) ; non rattachée → sans groupe", async () => {
    const origin = await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    const last = await created(
      await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10), { name: "Pompes déclinées" }), {
        kind: "VARIANT",
        originMovementId: origin.movementId,
        joinOriginGroup: true,
      }),
    );
    const middle = await created(
      await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10), { name: "Pompes inclinées" }), {
        kind: "VARIANT",
        originMovementId: origin.movementId,
        joinOriginGroup: true,
      }),
    );
    const alone = await created(
      await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10), { name: "Pompes genoux" }), {
        kind: "VARIANT",
        originMovementId: origin.movementId,
        joinOriginGroup: false,
      }),
    );
    for (const variant of [last, middle, alone]) {
      expect(variant.movementId).not.toBe(origin.movementId);
    }
    const originMovement = await movements().findById(origin.movementId);
    expect(originMovement?.name).toBe("Squat");
    const group = await movements().listGroup(originMovement!.levelGroup!.groupId);
    expect(group.map((movement) => movement.id)).toEqual([origin.movementId, middle.movementId, last.movementId]);
    expect((await movements().findById(alone.movementId))?.levelGroup).toBeNull();
  });

  it("correction structurelle : sans complétion → SIBLING_COMPLETION_REQUIRED sans écriture ; complétion passée → frère INCOMPLET par phaseId, édité exécutable ; occurrence de Séance : nouvelle phase manquante (R-3)", async () => {
    const { first, second } = await twoSharing();
    const session = await save({ ...createEmptyDraft(), name: "Jambes", exercises: [activityDefinitionToDraftExercise(second, "occ-1", null)] });
    const copyBefore = occurrencesOf(session)[0]!.executionParameters;
    const definitionsBefore = await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id");
    const phasesBefore = await database.getAllAsync("SELECT * FROM movement_phases ORDER BY position");

    const edited = input(phased([...phases(6, 3), { id: 3, label: "Remontée", durationSeconds: 2 }]));
    const assessed = await service().assessActivityDefinitionCorrection({ kind: "UPDATE", definitionId: first.id }, edited);
    expect(assessed).toEqual({
      status: "ASSESSED",
      assessment: expect.objectContaining({
        movementUsed: true,
        requiresIdentityDecision: true,
        structuralChange: true,
        affectedDefinitionCount: 2,
        siblingGaps: [{ definitionId: second.id, missingPhaseIds: [3], missingSeriesDuration: false }],
      }),
      // PRE-7 A2.2 : structure allouée rendue pour l'étape de complétion (libellés par `phaseId`).
      phases: [
        { id: 1, label: "Phase 1" },
        { id: 2, label: "Phase 2" },
        { id: 3, label: "Remontée" },
      ],
    });

    expect(await service().updateActivityDefinition(first.id, edited)).toEqual({
      status: "SIBLING_COMPLETION_REQUIRED",
      siblings: [{ definitionId: second.id, missingPhaseIds: [3], missingSeriesDuration: false }],
    });
    expect(await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id")).toEqual(definitionsBefore);
    expect(await database.getAllAsync("SELECT * FROM movement_phases ORDER BY position")).toEqual(phasesBefore);

    const result = await service().updateActivityDefinition(first.id, edited, [
      { definitionId: second.id, phaseDurations: [{ phaseId: 3, durationSeconds: null }] },
    ]);
    expect(result.status).toBe("UPDATED");
    const editedRead = await service().getActivityDefinition(first.id);
    expect(editedRead?.missingPhaseIds).toBeUndefined();
    expect(seriesOf(editedRead).workPhases.map((phase) => [phase.id, phase.label, phase.durationSeconds])).toEqual([
      [1, "Phase 1", 6],
      [2, "Phase 2", 3],
      [3, "Remontée", 2],
    ]);
    const siblingRead = await service().getActivityDefinition(second.id);
    expect(siblingRead?.missingPhaseIds).toEqual([3]);
    // PRE-7 (D-446) : la Cible du frère est conservée (plus d'`UNSET` forcé) ; l'incomplétude vient de la phase 3.
    expect(seriesOf(siblingRead).target).toEqual({ kind: "NUMBER", value: 12 });
    expect(seriesOf(siblingRead).workPhases.map((phase) => [phase.id, phase.label, phase.durationSeconds])).toEqual([
      [1, "Phase 1", 8],
      [2, "Phase 2", 4],
      [3, "Remontée", 0],
    ]);
    // PRE-7 (R-3, D-445 C05, v7 §2) : l'occurrence relit la structure du Mouvement — ses propres durées
    // sont conservées par identité, la phase 3 ajoutée est manquante (0, signalée), aucune durée inventée.
    const reread = await sessionService().getSession(session.id);
    const rereadParameters = occurrencesOf(reread!)[0]!.executionParameters;
    expect(rereadParameters).toEqual({
      ...copyBefore,
      series: { ...copyBefore.series, workPhases: [...copyBefore.series.workPhases, { id: 3, label: "Remontée", durationSeconds: 0 }] },
    });
    expect(hasMissingPhaseDuration(rereadParameters)).toBe(true);

    // Un frère incomplet ne devient jamais une copie de Séance enregistrable.
    const draft = { ...createEmptyDraft(), name: "Essai", exercises: [activityDefinitionToDraftExercise(siblingRead!, "occ-x", null)] };
    expect(toCreateSessionInput(draft).ok).toBe(false);

    // Complétion ultérieure du frère : exécutable, Cible = somme.
    const completed = await service().updateActivityDefinition(second.id, input(phased([...phases(8, 4), { id: 3, label: "Remontée", durationSeconds: 5 }])));
    expect(completed.status).toBe("UPDATED");
    const completedRead = await service().getActivityDefinition(second.id);
    expect(completedRead?.missingPhaseIds).toBeUndefined();
    expect(seriesOf(completedRead).target).toEqual({ kind: "NUMBER", value: 17 });
  });

  it("complétion fournie : frère complet ; PRE-7 (D-446) : Cible du frère conservée à l'ajout comme à Avec → Sans ; liste regroupée par geste", async () => {
    const { first, second } = await twoSharing();
    const added = await service().updateActivityDefinition(first.id, input(phased(phases(6, 3, 2))), [
      { definitionId: second.id, phaseDurations: [{ phaseId: 3, durationSeconds: 1 }] },
    ]);
    expect(added.status).toBe("UPDATED");
    // D-446 : 12 s (Cible du frère), non la somme 8 + 4 + 1.
    expect(seriesOf(await service().getActivityDefinition(second.id)).target).toEqual({ kind: "NUMBER", value: 12 });

    const removed = await service().updateActivityDefinition(first.id, input(durationParameters(40, 3, 10)));
    expect(removed.status).toBe("UPDATED");
    const sibling = seriesOf(await service().getActivityDefinition(second.id));
    expect(sibling.workPhases).toEqual([]);
    expect(sibling.target).toEqual({ kind: "NUMBER", value: 12 });
    expect(await database.getAllAsync("SELECT * FROM movement_phases")).toEqual([]);

    // PRE-7 (R-3, C01) : un Exercice indépendant crée un Mouvement de nom distinct.
    const independent = await created(
      await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10), { name: "Squat indépendant" }), { kind: "INDEPENDENT" }),
    );
    const groups = await service().listActivityDefinitionsByMovement();
    expect(groups.map((group) => [group.movementId, group.definitions.map((definition) => definition.id).sort()])).toEqual(
      expect.arrayContaining([
        [first.movementId, [first.id, second.id].sort()],
        [independent.movementId, [independent.id]],
      ]),
    );
    expect(groups).toHaveLength(2);
  });

  it("PRE-7 (D-446 ; complément du 26/10/2026) — frère en séries variables éligible à l'ajout de phases (complétion requise, puis lignes conservées) ; frère en Répétitions éligible, Cible conservée ; durée fournie invalide → INVALID_SIBLING_COMPLETION ; rien écrit", async () => {
    const first = await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    const varied = await created(
      await service().createActivityDefinitionWithOrigin(input(variableParameters({ mode: "REPETITIONS", rows: [[10, 10], [12, 10]] })), {
        kind: "SAME_MOVEMENT",
        movementId: first.movementId,
      }),
    );
    const before = await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id");
    // D-446 (complément du 26/10/2026) : compatibilité phases + séries variables ; le frère variable
    // n'est plus inéligible, ses durées de phases sont à compléter comme celles d'un frère identique.
    expect(await service().updateActivityDefinition(first.id, input(phased(phases(6, 3))))).toEqual({
      status: "SIBLING_COMPLETION_REQUIRED",
      siblings: [{ definitionId: varied.id, missingPhaseIds: [1, 2], missingSeriesDuration: false }],
    });
    expect(await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id")).toEqual(before);
    const variedCompleted = await service().updateActivityDefinition(first.id, input(phased(phases(6, 3))), [
      { definitionId: varied.id, phaseDurations: [{ phaseId: 1, durationSeconds: 5 }, { phaseId: 2, durationSeconds: 2 }] },
    ]);
    expect(variedCompleted.status).toBe("UPDATED");
    const variedRead = await service().getActivityDefinition(varied.id);
    expect(variedRead?.missingPhaseIds).toBeUndefined();
    const variedSeries = variedRead?.executionParameters.series;
    expect(variedSeries?.kind).toBe("VARIABLE");
    expect(variedSeries?.kind === "VARIABLE" && variedSeries.rows.map((row) => row.target)).toEqual([
      { kind: "NUMBER", value: 10 },
      { kind: "NUMBER", value: 12 },
    ]);
    expect(variedSeries?.workPhases.map((phase) => phase.durationSeconds)).toEqual([5, 2]);

    // Frère en Répétitions : éligible (D-446), ses durées sont à compléter ; complété, il garde Mode et Cible.
    const lone = await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10), { name: "Fente" }), { kind: "INDEPENDENT" }));
    const reps = await created(
      await service().createActivityDefinitionWithOrigin(input(repetitionParameters(10, 3, 10), { name: "Fente" }), { kind: "SAME_MOVEMENT", movementId: lone.movementId }),
    );
    expect(await service().updateActivityDefinition(lone.id, input(phased(phases(6, 3)), { name: "Fente" }))).toEqual({
      status: "SIBLING_COMPLETION_REQUIRED",
      siblings: [{ definitionId: reps.id, missingPhaseIds: [1, 2], missingSeriesDuration: false }],
    });
    const completed = await service().updateActivityDefinition(lone.id, input(phased(phases(6, 3)), { name: "Fente" }), [
      { definitionId: reps.id, phaseDurations: [{ phaseId: 1, durationSeconds: 5 }, { phaseId: 2, durationSeconds: 2 }] },
    ]);
    expect(completed.status).toBe("UPDATED");
    const repsRead = await service().getActivityDefinition(reps.id);
    expect(repsRead?.missingPhaseIds).toBeUndefined();
    expect(repsRead?.executionParameters.mode).toBe("REPETITIONS");
    expect(seriesOf(repsRead).target).toEqual({ kind: "NUMBER", value: 10 });
    expect(seriesOf(repsRead).workPhases.map((phase) => phase.durationSeconds)).toEqual([5, 2]);

    const { first: a, second: b } = await twoSharing("Squat partagé");
    expect(
      await service().updateActivityDefinition(a.id, input(phased(phases(6, 3, 2))), [
        { definitionId: b.id, phaseDurations: [{ phaseId: 3, durationSeconds: 0 }] },
      ]),
    ).toEqual({ status: "INVALID_SIBLING_COMPLETION", definitionIds: [b.id] });
    expect((await service().getActivityDefinition(b.id))?.missingPhaseIds).toBeUndefined();
  });

  it("échec au milieu de la correction partagée (écriture du frère) → rollback complet : Mouvement, structure et définitions intacts", async () => {
    const { first, second } = await twoSharing();
    await database.execAsync(
      `CREATE TRIGGER fail_sibling BEFORE UPDATE ON activity_definitions WHEN NEW.id = '${second.id}'
       BEGIN SELECT RAISE(ABORT, 'injected failure'); END;`,
    );
    const snapshot = async () => ({
      movements: await database.getAllAsync("SELECT * FROM movements"),
      phases: await database.getAllAsync("SELECT * FROM movement_phases ORDER BY position"),
      definitions: await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id"),
    });
    const before = await snapshot();
    await expect(
      service().updateActivityDefinition(first.id, input(phased(phases(6, 3, 2)), { name: "Squat corrigé" }), [
        { definitionId: second.id, phaseDurations: [{ phaseId: 3, durationSeconds: 1 }] },
      ]),
    ).rejects.toThrow(/injected failure/);
    expect(await snapshot()).toEqual(before);
  });

  /** PRE-7 (R-3) : brouillon dont `exercise` est une création locale terminée, puis dupliquée. */
  function localWithCopy(exercise: SessionDraftExercise, copyId: string, name: string): SessionDraft {
    const draft = withLocalMovements({ ...createEmptyDraft(), name, exercises: [exercise] });
    return { ...draft, exercises: duplicateActivity(draft.exercises, exercise.id, copyId) };
  }

  it("occurrence locale dupliquée avant le premier enregistrement : un seul Mouvement, références égales, numéro de copie ; source retirée → Mouvement du brouillon créé pour la copie", async () => {
    const local: SessionDraftExercise = {
      ...createExerciseDraft("occ-local"),
      name: "Gainage",
      bodyZoneIds: ["dos"],
      categoryId: "cardio",
      executionParameters: phased(phases(20, 10)),
    };
    const session = await save(localWithCopy(local, "occ-copy", "Gainage"));
    expect(occurrencesOf(session).map((item) => [item.id, item.sourceMovementId, item.copyNumber, item.name])).toEqual([
      ["occ-local", "occ-local", null, "Gainage"],
      ["occ-copy", "occ-local", 1, "Gainage"],
    ]);
    expect(await database.getAllAsync("SELECT id, name FROM movements")).toEqual([{ id: "occ-local", name: "Gainage" }]);

    // Copie déplacée avant la source : même résultat (un seul Mouvement, celui du brouillon).
    const other: SessionDraftExercise = { ...local, id: "occ-b", name: "Gainage latéral" };
    const withCopy = localWithCopy(other, "occ-b2", "Inverse");
    await save({ ...withCopy, exercises: [...withCopy.exercises].reverse() });
    expect(await database.getFirstAsync("SELECT id, name FROM movements WHERE id = 'occ-b'")).toEqual({ id: "occ-b", name: "Gainage latéral" });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM movements WHERE id = 'occ-b2'")).toEqual({ count: 0 });

    // Source retirée du brouillon avant l'enregistrement : le Mouvement du brouillon, encore référencé par
    // la copie, est créé ; son nom n'est jamais suffixé (le suffixe est le numéro de copie).
    const lone: SessionDraftExercise = { ...local, id: "occ-c", name: "Gainage lent" };
    const loneDraft = localWithCopy(lone, "occ-c2", "Seule");
    const saved = await save({ ...loneDraft, exercises: loneDraft.exercises.filter((item) => item.id !== "occ-c") });
    expect(occurrencesOf(saved).map((item) => [item.sourceMovementId, item.copyNumber])).toEqual([["occ-c", 1]]);
    expect(await database.getFirstAsync("SELECT id, name FROM movements WHERE id = 'occ-c'")).toEqual({ id: "occ-c", name: "Gainage lent" });
  });

  it("duplication de Séance : nouvelle Séance « (copie) » puis « (copie 2) », nouveaux identifiants, filiations identiques ; inconnue → NOT_FOUND", async () => {
    const definition = await created(await service().createActivityDefinitionWithOrigin(input(phased(phases(6, 3))), { kind: "INDEPENDENT" }));
    const local: SessionDraftExercise = {
      ...createExerciseDraft("occ-local"),
      name: "Gainage",
      bodyZoneIds: ["dos"],
      categoryId: "cardio",
      executionParameters: durationParameters(30, 2, 10),
    };
    const source = await save({
      ...createEmptyDraft(),
      name: "Jambes",
      exercises: [activityDefinitionToDraftExercise(definition, "occ-cat", null), local],
    });
    let next = 0;
    const newId = () => `dup-${++next}`;
    const duplicated = await sessionService().duplicateSession(source.id, newId);
    expect(duplicated.status).toBe("DUPLICATED");
    if (duplicated.status !== "DUPLICATED") return;
    expect(duplicated.session.id).not.toBe(source.id);
    expect(duplicated.session.name).toBe("Jambes (copie)");
    expect(occurrencesOf(duplicated.session).map((item) => [item.id, item.sourceMovementId, item.name])).toEqual([
      ["dup-1", definition.movementId, "Squat"],
      ["dup-2", "occ-local", "Gainage"],
    ]);
    // Aucun Mouvement nouveau : la filiation n'est ni relue ni réécrite.
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM movements")).toEqual({ count: 2 });

    const again = await sessionService().duplicateSession(source.id, newId);
    expect(again.status === "DUPLICATED" && again.session.name).toBe("Jambes (copie 2)");
    expect(await sessionService().duplicateSession("inconnue", newId)).toEqual({ status: "NOT_FOUND" });
    // La Séance source reste inchangée.
    expect(occurrencesOf((await sessionService().getSession(source.id))!).map((item) => item.id)).toEqual(["occ-cat", "occ-local"]);
  });

  it("même geste qui change la structure : sans complétion → refus sans définition créée ; avec complétion → frères réassociés par phaseId ; évaluation SAME_MOVEMENT et NOT_FOUND", async () => {
    const { first, second } = await twoSharing();
    const added = input(phased(phases(6, 3, 2)));
    const assessed = await service().assessActivityDefinitionCorrection({ kind: "SAME_MOVEMENT", movementId: first.movementId }, added);
    expect(assessed.status === "ASSESSED" && assessed.assessment).toEqual(
      expect.objectContaining({
        affectedDefinitionCount: 2,
        structuralChange: true,
        siblingGaps: expect.arrayContaining([
          { definitionId: first.id, missingPhaseIds: [3], missingSeriesDuration: false },
          { definitionId: second.id, missingPhaseIds: [3], missingSeriesDuration: false },
        ]),
      }),
    );
    expect(await service().assessActivityDefinitionCorrection({ kind: "SAME_MOVEMENT", movementId: "inconnu" }, added)).toEqual({ status: "NOT_FOUND" });
    expect(await service().assessActivityDefinitionCorrection({ kind: "UPDATE", definitionId: "inconnue" }, added)).toEqual({ status: "NOT_FOUND" });

    const before = await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id");
    const refused = await service().createActivityDefinitionWithOrigin(added, { kind: "SAME_MOVEMENT", movementId: first.movementId });
    expect(refused.status).toBe("SIBLING_COMPLETION_REQUIRED");
    expect(await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id")).toEqual(before);

    const third = await created(
      await service().createActivityDefinitionWithOrigin(added, {
        kind: "SAME_MOVEMENT",
        movementId: first.movementId,
        siblingCompletions: [
          { definitionId: first.id, phaseDurations: [{ phaseId: 3, durationSeconds: 1 }] },
          { definitionId: second.id, phaseDurations: [{ phaseId: 3, durationSeconds: null }] },
        ],
      }),
    );
    expect(third.movementId).toBe(first.movementId);
    // PRE-7 (D-446) : Cible du frère conservée (9 s), non la somme 6 + 3 + 1.
    expect(seriesOf(await service().getActivityDefinition(first.id)).target).toEqual({ kind: "NUMBER", value: 9 });
    expect((await service().getActivityDefinition(second.id))?.missingPhaseIds).toEqual([3]);
  });

  it("même geste sans médias transmis : les médias du geste partagé sont conservés", async () => {
    const asset = {
      id: "p1",
      uri: "kodjo-media/p1.jpg",
      createdAt: NOW,
      kind: "PHOTO" as const,
      mimeType: "image/jpeg",
      fileName: null,
      sizeBytes: 10,
      durationMs: null,
      width: 1,
      height: 1,
    };
    const first = await created(
      await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10), { media: [{ assetId: "p1", asset }] }), {
        kind: "INDEPENDENT",
      }),
    );
    await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(45, 3, 10)), { kind: "SAME_MOVEMENT", movementId: first.movementId }));
    expect(await database.getAllAsync("SELECT movement_id, asset_id FROM movement_media")).toEqual([{ movement_id: first.movementId, asset_id: "p1" }]);
  });

  it("PRE-7 (D-446) — Avec → Sans avec un frère incomplet à Cible chiffrée : Cible conservée, aucune complétion demandée ; relu sans phase, exécutable", async () => {
    const { first, second } = await twoSharing();
    expect(
      (
        await service().updateActivityDefinition(first.id, input(phased(phases(6, 3, 2))), [
          { definitionId: second.id, phaseDurations: [{ phaseId: 3, durationSeconds: null }] },
        ])
      ).status,
    ).toBe("UPDATED");
    // La durée de série n'est demandée que pour une Cible à renseigner (couvert par sharedCorrection.a13).
    expect((await service().updateActivityDefinition(first.id, input(durationParameters(40, 3, 10)))).status).toBe("UPDATED");
    const sibling = await service().getActivityDefinition(second.id);
    expect(sibling?.missingPhaseIds).toBeUndefined();
    expect(seriesOf(sibling).target).toEqual({ kind: "NUMBER", value: 12 });
    expect(seriesOf(sibling).workPhases).toEqual([]);
  });

  it("Avec → Sans avec un frère incomplet à Cible à renseigner (donnée antérieure à D-446) : durée de série à compléter, rien écrit ; passée → relu INCOMPLETE sans phase manquante, Cible UNSET, jamais copiable en Séance", async () => {
    const { first, second } = await twoSharing();
    expect(
      (
        await service().updateActivityDefinition(first.id, input(phased(phases(6, 3, 2))), [
          { definitionId: second.id, phaseDurations: [{ phaseId: 3, durationSeconds: null }] },
        ])
      ).status,
    ).toBe("UPDATED");
    // Frère incomplet enregistré avant D-446 : sa Cible était alors forcée à `UNSET`.
    const stored = await database.getFirstAsync<{ execution_parameters: string }>(
      "SELECT execution_parameters FROM activity_definitions WHERE id = ?",
      [second.id],
    );
    const legacy = JSON.parse(stored!.execution_parameters) as { series: { target: unknown } };
    legacy.series.target = { kind: "UNSET" };
    await database.runAsync("UPDATE activity_definitions SET execution_parameters = ? WHERE id = ?", [JSON.stringify(legacy), second.id]);
    expect(seriesOf(await service().getActivityDefinition(second.id)).target).toEqual({ kind: "UNSET" });

    const before = await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id");
    expect(await service().updateActivityDefinition(first.id, input(durationParameters(40, 3, 10)))).toEqual({
      status: "SIBLING_COMPLETION_REQUIRED",
      siblings: [{ definitionId: second.id, missingPhaseIds: [], missingSeriesDuration: true }],
    });
    expect(await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id")).toEqual(before);

    expect(
      (await service().updateActivityDefinition(first.id, input(durationParameters(40, 3, 10)), [{ definitionId: second.id, seriesDurationSeconds: null }]))
        .status,
    ).toBe("UPDATED");
    const sibling = await service().getActivityDefinition(second.id);
    expect(sibling?.missingPhaseIds).toEqual([]);
    expect(seriesOf(sibling).target).toEqual({ kind: "UNSET" });
    expect(seriesOf(sibling).workPhases).toEqual([]);
    const draft = { ...createEmptyDraft(), name: "Essai", exercises: [activityDefinitionToDraftExercise(sibling!, "occ-y", null)] };
    expect(toCreateSessionInput(draft).ok).toBe(false);
  });

  it("copie en attente ajoutée à une Séance déjà enregistrée (mise à jour) : Mouvement créé par la source même placée après ; source retirée → créé par la copie", async () => {
    const definition = await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    const session = await save({ ...createEmptyDraft(), name: "Base", exercises: [activityDefinitionToDraftExercise(definition, "occ-cat", null)] });
    const local: SessionDraftExercise = {
      ...createExerciseDraft("occ-new"),
      name: "Planche",
      bodyZoneIds: ["dos"],
      categoryId: "cardio",
      executionParameters: durationParameters(30, 2, 10),
    };
    // PRE-7 (R-3) : création locale et sa copie, la copie placée avant ; un seul Mouvement NEW.
    const withCopy = localWithCopy(local, "occ-new-copy", "Base");
    const base = toSessionDraft(session);
    const added = { ...base, exercises: [...base.exercises, ...[...withCopy.exercises].reverse()], movements: withCopy.movements };
    expect((await sessionService().updateSession(session.id, added)).status).toBe("UPDATED");
    expect(await database.getFirstAsync("SELECT id, name FROM movements WHERE id = 'occ-new'")).toEqual({ id: "occ-new", name: "Planche" });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM movements WHERE id = 'occ-new-copy'")).toEqual({ count: 0 });

    const lone: SessionDraftExercise = { ...local, id: "occ-lone", name: "Planche latérale" };
    const loneDraft = localWithCopy(lone, "occ-lone-copy", "Base");
    const again = toSessionDraft((await sessionService().getSession(session.id))!);
    const onlyCopy = {
      ...again,
      exercises: [...again.exercises, ...loneDraft.exercises.filter((item) => item.id !== "occ-lone")],
      movements: loneDraft.movements,
    };
    expect((await sessionService().updateSession(session.id, onlyCopy)).status).toBe("UPDATED");
    expect(await database.getFirstAsync("SELECT id, name FROM movements WHERE id = 'occ-lone'")).toEqual({ id: "occ-lone", name: "Planche latérale" });
    const final = await sessionService().getSession(session.id);
    const copy = occurrencesOf(final!).find((item) => item.id === "occ-lone-copy");
    expect([copy?.sourceMovementId, copy?.copyNumber, copy?.name]).toEqual(["occ-lone", 1, "Planche latérale"]);
  });

  it("duplication d'une Séance archivée → NOT_FOUND, rien créé", async () => {
    const definition = await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    const source = await save({ ...createEmptyDraft(), name: "Ancienne", exercises: [activityDefinitionToDraftExercise(definition, "occ-old", null)] });
    await database.runAsync("UPDATE sessions SET status = 'ARCHIVED', archived_at = ? WHERE id = ?", [NOW, source.id]);
    const count = await database.getFirstAsync("SELECT COUNT(*) AS count FROM sessions");
    expect(await sessionService().duplicateSession(source.id, () => "dup-x")).toEqual({ status: "NOT_FOUND" });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM sessions")).toEqual(count);
  });
});
