import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import { type ExecutionParameters, type WorkPhase } from "@/domain/activities/ExecutionParameters";
import {
  durationParameters,
  repetitionParameters,
  uniformParameters,
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

  async function save(draft: SessionDraft): Promise<Session> {
    const result = await sessionService().createSession(draft);
    if (!result.ok) {
      throw new Error(JSON.stringify(result.violations));
    }
    return result.value;
  }

  const occurrencesOf = (session: Session) => [...(session.cycle.beforeTour ?? []), ...session.cycle.tour.exercises, ...(session.cycle.afterTour ?? [])];

  /** Deux Exercices du même geste à phases [6, 3] et [8, 4]. */
  async function twoSharing() {
    const first = await created(await service().createActivityDefinitionWithOrigin(input(phased(phases(6, 3))), { kind: "INDEPENDENT" }));
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

  it("correction structurelle : sans complétion → SIBLING_COMPLETION_REQUIRED sans écriture ; complétion passée → frère INCOMPLET par phaseId, édité exécutable ; copies de Séance inchangées", async () => {
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
    expect(seriesOf(siblingRead).target).toEqual({ kind: "UNSET" });
    expect(seriesOf(siblingRead).workPhases.map((phase) => [phase.id, phase.label, phase.durationSeconds])).toEqual([
      [1, "Phase 1", 8],
      [2, "Phase 2", 4],
      [3, "Remontée", 0],
    ]);
    // La copie déjà posée n'est jamais synchronisée (MFN-03, MFN-08).
    const reread = await sessionService().getSession(session.id);
    expect(occurrencesOf(reread!)[0]!.executionParameters).toEqual(copyBefore);

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

  it("complétion fournie : frère complet ; Avec → Sans : durée de série = somme des durées du frère ; liste regroupée par geste", async () => {
    const { first, second } = await twoSharing();
    const added = await service().updateActivityDefinition(first.id, input(phased(phases(6, 3, 2))), [
      { definitionId: second.id, phaseDurations: [{ phaseId: 3, durationSeconds: 1 }] },
    ]);
    expect(added.status).toBe("UPDATED");
    expect(seriesOf(await service().getActivityDefinition(second.id)).target).toEqual({ kind: "NUMBER", value: 13 });

    const removed = await service().updateActivityDefinition(first.id, input(durationParameters(40, 3, 10)));
    expect(removed.status).toBe("UPDATED");
    const sibling = seriesOf(await service().getActivityDefinition(second.id));
    expect(sibling.workPhases).toEqual([]);
    expect(sibling.target).toEqual({ kind: "NUMBER", value: 13 });
    expect(await database.getAllAsync("SELECT * FROM movement_phases")).toEqual([]);

    const independent = await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    const groups = await service().listActivityDefinitionsByMovement();
    expect(groups.map((group) => [group.movementId, group.definitions.map((definition) => definition.id).sort()])).toEqual(
      expect.arrayContaining([
        [first.movementId, [first.id, second.id].sort()],
        [independent.movementId, [independent.id]],
      ]),
    );
    expect(groups).toHaveLength(2);
  });

  it("frère inéligible (Répétitions) à l'ajout de phases → INELIGIBLE_SIBLINGS ; durée fournie invalide → INVALID_SIBLING_COMPLETION ; rien écrit", async () => {
    const first = await created(await service().createActivityDefinitionWithOrigin(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    const reps = await created(
      await service().createActivityDefinitionWithOrigin(input(repetitionParameters(10, 3, 10)), { kind: "SAME_MOVEMENT", movementId: first.movementId }),
    );
    const before = await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id");
    expect(await service().updateActivityDefinition(first.id, input(phased(phases(6, 3))))).toEqual({
      status: "INELIGIBLE_SIBLINGS",
      definitionIds: [reps.id],
    });
    expect(await database.getAllAsync("SELECT * FROM activity_definitions ORDER BY id")).toEqual(before);

    const { first: a, second: b } = await twoSharing();
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

  it("occurrence locale dupliquée avant le premier enregistrement : un seul Mouvement, filiations égales ; source retirée → Mouvement créé depuis la copie à l'identifiant pré-alloué", async () => {
    const local: SessionDraftExercise = {
      ...createExerciseDraft("occ-local"),
      name: "Gainage",
      bodyZoneIds: ["dos"],
      categoryId: "cardio",
      executionParameters: phased(phases(20, 10)),
    };
    const exercises = duplicateActivity([local], "occ-local", "occ-copy");
    const session = await save({ ...createEmptyDraft(), name: "Gainage", exercises });
    expect(occurrencesOf(session).map((item) => [item.id, item.sourceMovementId])).toEqual([
      ["occ-local", "occ-local"],
      ["occ-copy", "occ-local"],
    ]);
    expect(await database.getAllAsync("SELECT id, name, used FROM movements")).toEqual([{ id: "occ-local", name: "Gainage", used: 1 }]);

    // Copie déplacée avant la source : même résultat (la source crée son Mouvement).
    const other: SessionDraftExercise = { ...local, id: "occ-b" };
    const reversed = [...duplicateActivity([other], "occ-b", "occ-b2")].reverse();
    await save({ ...createEmptyDraft(), name: "Inverse", exercises: reversed });
    expect(await database.getFirstAsync("SELECT id, name FROM movements WHERE id = 'occ-b'")).toEqual({ id: "occ-b", name: "Gainage" });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM movements WHERE id = 'occ-b2'")).toEqual({ count: 0 });

    // Source retirée du brouillon avant l'enregistrement : la copie crée le Mouvement pré-alloué.
    const lone: SessionDraftExercise = { ...local, id: "occ-c" };
    const onlyCopy = duplicateActivity([lone], "occ-c", "occ-c2").filter((item) => item.id !== "occ-c");
    const saved = await save({ ...createEmptyDraft(), name: "Seule", exercises: onlyCopy });
    expect(occurrencesOf(saved).map((item) => item.sourceMovementId)).toEqual(["occ-c"]);
    expect(await database.getFirstAsync("SELECT id, name, used FROM movements WHERE id = 'occ-c'")).toEqual({
      id: "occ-c",
      name: "Gainage (copie)",
      used: 1,
    });
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
    expect(seriesOf(await service().getActivityDefinition(first.id)).target).toEqual({ kind: "NUMBER", value: 10 });
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

  it("Avec → Sans avec un frère incomplet : durée de série à compléter ; passée → relu INCOMPLETE sans phase manquante, Cible UNSET, jamais copiable en Séance", async () => {
    const { first, second } = await twoSharing();
    expect(
      (
        await service().updateActivityDefinition(first.id, input(phased(phases(6, 3, 2))), [
          { definitionId: second.id, phaseDurations: [{ phaseId: 3, durationSeconds: null }] },
        ])
      ).status,
    ).toBe("UPDATED");
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
    const reversed = [...duplicateActivity([local], "occ-new", "occ-new-copy")].reverse();
    const base = toSessionDraft(session);
    expect((await sessionService().updateSession(session.id, { ...base, exercises: [...base.exercises, ...reversed] })).status).toBe("UPDATED");
    expect(await database.getFirstAsync("SELECT id, name, used FROM movements WHERE id = 'occ-new'")).toEqual({ id: "occ-new", name: "Planche", used: 1 });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM movements WHERE id = 'occ-new-copy'")).toEqual({ count: 0 });

    const lone: SessionDraftExercise = { ...local, id: "occ-lone" };
    const onlyCopy = duplicateActivity([lone], "occ-lone", "occ-lone-copy").filter((item) => item.id !== "occ-lone");
    const again = toSessionDraft((await sessionService().getSession(session.id))!);
    expect((await sessionService().updateSession(session.id, { ...again, exercises: [...again.exercises, ...onlyCopy] })).status).toBe("UPDATED");
    expect(await database.getFirstAsync("SELECT id, name FROM movements WHERE id = 'occ-lone'")).toEqual({ id: "occ-lone", name: "Planche (copie)" });
    const final = await sessionService().getSession(session.id);
    expect(occurrencesOf(final!).find((item) => item.id === "occ-lone-copy")?.sourceMovementId).toBe("occ-lone");
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
