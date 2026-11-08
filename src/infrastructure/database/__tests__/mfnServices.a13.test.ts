import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters, WorkPhase } from "@/domain/activities/ExecutionParameters";
import { durationParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { duplicateActivity } from "@/domain/sessions/composition";
import type { StructuredSession } from "@/domain/sessions/SessionRepository";
import { occurrencesOf } from "@/domain/sessions/testing/structuredSession";
import {
  createEmptyDraft,
  createExerciseDraft,
  draftMovementOf,
  toSessionDraft,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { SessionService } from "@/features/sessions/SessionService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { createTestMovement, type TestMovementOrigin } from "@/infrastructure/database/testing/createTestMovement";
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
 *
 * [A.3 du 04/11/2026 : les anciennes définitions du Catalogue sont supprimées (migration 021, décision de
 * Hermann du 04/11/2026 : « Hermann abandonne la conversion sans perte prévue par A.4 : les anciens
 * exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. ») et leurs
 * opérations retirées du service : les cas « même geste », correction partagée des frères, évaluation et
 * rollback d'une correction de définition sont supprimés. Restent les variantes (groupe de niveaux), la
 * filiation des occurrences et la duplication de Séance.]
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

describe("PRE-7 A1.3 — services MFN (NodeSqliteDatabase REAL)", () => {
  let database: NodeSqliteDatabase;
  let sequence = 0;
  const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
  const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
  /**
   * [A.3 du 04/11/2026 : plus d'ancienne définition du Catalogue — le Mouvement est créé seul
   * (`createTestMovement`, variante rattachée au groupe d'origine comprise) et vu en mémoire comme la
   * définition dont la copie est faite.]
   */
  async function seedMovement(value: CreateActivityDefinitionInput, origin: TestMovementOrigin) {
    const { movementId } = await createTestMovement(database, value, origin, ids("def"), () => NOW);
    const definition: ActivityDefinition = {
      id: `def-${movementId}`,
      movementId,
      name: value.name,
      description: value.description,
      executionParameters: value.executionParameters,
      categoryId: value.category.kind === "EXISTING" ? value.category.categoryId : undefined,
      bodyZoneIds: value.bodyZoneIds,
      sideMode: value.executionParameters.sideMode,
      createdAt: NOW,
      updatedAt: NOW,
    };
    return { status: "CREATED" as const, value: definition };
  }
  const sessionService = () => new SessionService(new SqliteSessionRepository(database, ids("ses"), () => NOW));

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  async function created(result: Awaited<ReturnType<typeof seedMovement>>) {
    return result.value;
  }

  // PRE-7 (R-3, C05) : Exercices créés dans la Séance = créations locales terminées (Mouvements NEW).
  async function save(draft: SessionDraft): Promise<StructuredSession> {
    const result = await sessionService().createSession(withLocalMovements(draft));
    if (!result.ok) {
      throw new Error(JSON.stringify(result.violations));
    }
    return result.value;
  }



  it("variante : nouveau Mouvement, original intact ; rattachée → insérée juste après l'origine (groupe créé au besoin) ; non rattachée → sans groupe", async () => {
    const origin = await created(await seedMovement(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    const last = await created(
      await seedMovement(input(durationParameters(30, 3, 10), { name: "Pompes déclinées" }), {
        kind: "VARIANT",
        originMovementId: origin.movementId,
        joinOriginGroup: true,
      }),
    );
    const middle = await created(
      await seedMovement(input(durationParameters(30, 3, 10), { name: "Pompes inclinées" }), {
        kind: "VARIANT",
        originMovementId: origin.movementId,
        joinOriginGroup: true,
      }),
    );
    const alone = await created(
      await seedMovement(input(durationParameters(30, 3, 10), { name: "Pompes genoux" }), {
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

  it("PRE-7 R-5 (C02, MFN-07 l.371) : Plus facile → insérée juste AVANT l'origine ; première variante = groupe de deux", async () => {
    const origin = await created(await seedMovement(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    const easier = await created(
      await seedMovement(input(durationParameters(30, 3, 10), { name: "Squat assisté" }), {
        kind: "VARIANT",
        originMovementId: origin.movementId,
        joinOriginGroup: true,
        placement: "BEFORE_ORIGIN",
      }),
    );
    const harder = await created(
      await seedMovement(input(durationParameters(30, 3, 10), { name: "Squat sauté" }), {
        kind: "VARIANT",
        originMovementId: origin.movementId,
        joinOriginGroup: true,
        placement: "AFTER_ORIGIN",
      }),
    );
    const easiest = await created(
      await seedMovement(input(durationParameters(30, 3, 10), { name: "Squat chaise" }), {
        kind: "VARIANT",
        originMovementId: easier.movementId,
        joinOriginGroup: true,
        placement: "BEFORE_ORIGIN",
      }),
    );
    const group = await movements().listGroup((await movements().findById(origin.movementId))!.levelGroup!.groupId);
    expect(group.map((movement) => movement.id)).toEqual([easiest.movementId, easier.movementId, origin.movementId, harder.movementId]);
  });

  it("PRE-7 R-5 (C02) : variante créée en Séance — le Mouvement NEW rejoint le groupe de l'origine à l'enregistrement, avant ou après", async () => {
    const origin = await created(await seedMovement(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    const occurrence = (id: string, name: string): SessionDraftExercise => ({
      ...createExerciseDraft(id, null),
      name,
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      executionParameters: durationParameters(30, 3, 10),
      sourceMovementId: id,
    });
    const easy = occurrence("occ-easy", "Squat assisté");
    const hard = occurrence("occ-hard", "Squat sauté");
    const result = await sessionService().createSession({
      ...createEmptyDraft(),
      name: "Jambes",
      exercises: [easy, hard],
      movements: {
        "occ-easy": draftMovementOf(easy, "NEW", { levelOrigin: { movementId: origin.movementId, placement: "BEFORE_ORIGIN" } }),
        "occ-hard": draftMovementOf(hard, "NEW", { levelOrigin: { movementId: origin.movementId, placement: "AFTER_ORIGIN" } }),
      },
    });
    if (!result.ok) throw new Error(JSON.stringify(result.violations));
    const group = await movements().listGroup((await movements().findById(origin.movementId))!.levelGroup!.groupId);
    expect(group.map((movement) => movement.id)).toEqual(["occ-easy", origin.movementId, "occ-hard"]);

    // Origine disparue entre-temps : la Séance entière est refusée, rien n'est écrit.
    const orphan = occurrence("occ-orphan", "Squat lent");
    const before = await database.getAllAsync("SELECT id FROM movements ORDER BY id");
    await expect(
      sessionService().createSession({
        ...createEmptyDraft(),
        name: "Jambes 2",
        exercises: [orphan],
        movements: {
          "occ-orphan": draftMovementOf(orphan, "NEW", { levelOrigin: { movementId: "inconnu", placement: "AFTER_ORIGIN" } }),
        },
      }),
    ).rejects.toThrow();
    expect(await database.getAllAsync("SELECT id FROM movements ORDER BY id")).toEqual(before);
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
    const definition = await created(await seedMovement(input(phased(phases(6, 3))), { kind: "INDEPENDENT" }));
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

  it("copie en attente ajoutée à une Séance déjà enregistrée (mise à jour) : Mouvement créé par la source même placée après ; source retirée → créé par la copie", async () => {
    const definition = await created(await seedMovement(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
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
    const definition = await created(await seedMovement(input(durationParameters(30, 3, 10)), { kind: "INDEPENDENT" }));
    const source = await save({ ...createEmptyDraft(), name: "Ancienne", exercises: [activityDefinitionToDraftExercise(definition, "occ-old", null)] });
    await database.runAsync("UPDATE sessions SET status = 'ARCHIVED', archived_at = ? WHERE id = ?", [NOW, source.id]);
    const count = await database.getFirstAsync("SELECT COUNT(*) AS count FROM sessions");
    expect(await sessionService().duplicateSession(source.id, () => "dup-x")).toEqual({ status: "NOT_FOUND" });
    expect(await database.getFirstAsync("SELECT COUNT(*) AS count FROM sessions")).toEqual(count);
  });
});
