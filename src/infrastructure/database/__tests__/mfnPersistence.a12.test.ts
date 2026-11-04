import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters, WorkPhase } from "@/domain/activities/ExecutionParameters";
import { durationParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import { duplicateActivity } from "@/domain/sessions/composition";
import type { Session } from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  createExerciseDraft,
  toCreateSessionInput,
  toSessionDraft,
  toUpdateSessionInput,
  type SessionDraft,
} from "@/domain/sessions/SessionDraft";
import { SessionValidationError } from "@/domain/sessions/errors";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { createTestMovement } from "@/infrastructure/database/testing/createTestMovement";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-7 (A1.2, D-437, D-438, MFN-02 à MFN-04, MFN-08) — persistance MFN des
 * définitions et des copies sur SQLite RÉELLE (`node:sqlite`, schéma 012) :
 * Mouvement créé avec l'Exercice, identités de phases allouées par le compteur,
 * exercice frère incomplet relu, filiation des occurrences (copie du Catalogue,
 * duplication, création locale), « déjà utilisé » au succès de l'enregistrement.
 *
 * PRE-7 (R-3, `migration013`, D-445 C01, C03, C05) : l'occurrence référence son
 * Mouvement par clé étrangère RESTRICT et en relit le contenu ; l'indicateur
 * « déjà utilisé » est remplacé par le comptage des occurrences persistées
 * (`countOccurrences`) ; le nom de Mouvement est unique.
 *
 * [A.3 du 04/11/2026 : les anciennes définitions du Catalogue sont supprimées (migration 021, décision de
 * Hermann du 04/11/2026 : « Hermann abandonne la conversion sans perte prévue par A.4 : les anciens
 * exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. ») et leur dépôt
 * retiré : les cas de création, correction partagée et relecture d'une définition sont supprimés ; la
 * « définition » copiée dans une Séance est un Mouvement créé seul, vu en mémoire.]
 */

const NOW = "2026-10-24T08:00:00.000Z";

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

const photo = (id: string): MediaAsset => ({
  id,
  uri: `kodjo-media/${id}.jpg`,
  createdAt: "2026-10-24T07:00:00.000Z",
  kind: "PHOTO",
  mimeType: "image/jpeg",
  fileName: null,
  sizeBytes: 10,
  durationMs: null,
  width: 1,
  height: 1,
});

describe("PRE-7 A1.2 — persistance MFN des définitions et des copies (NodeSqliteDatabase REAL)", () => {
  let database: NodeSqliteDatabase;
  let sequence = 0;
  const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
  /** Mouvement créé seul, vu comme la définition dont la copie est faite (A.3). */
  const definitions = () => ({
    async create(value: CreateActivityDefinitionInput): Promise<ActivityDefinition> {
      const { movementId } = await createTestMovement(database, value, { kind: "INDEPENDENT" }, ids("def"), () => NOW);
      return {
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
    },
  });
  const sessions = () => new SqliteSessionRepository(database, ids("ses"), () => NOW);
  const movements = () => new SqliteMovementRepository(database, ids("mov"), () => NOW);

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  function input(parameters: ExecutionParameters, overrides: Partial<CreateActivityDefinitionInput> = {}): CreateActivityDefinitionInput {
    const validated = validateActivityDefinitionInput({
      name: "Squat",
      description: "Buste droit",
      category: { kind: "EXISTING", categoryId: "cardio" },
      bodyZoneIds: ["cuisses"],
      executionParameters: parameters,
      ...overrides,
    });
    if (!validated.ok) {
      throw new Error(JSON.stringify(validated.violations));
    }
    return validated.value;
  }

  // PRE-7 (R-3, C05) : un Exercice créé dans la Séance est une création locale terminée
  // (Mouvement NEW à son identifiant, comme l'éditeur d'occurrence) — `withLocalMovements`.
  async function save(draft: SessionDraft): Promise<Session> {
    const created = toCreateSessionInput(withLocalMovements(draft));
    if (!created.ok) {
      throw new Error(JSON.stringify(created.violations));
    }
    return (await sessions().findById((await sessions().create(created.value)).id))!;
  }

  async function update(session: Session, mutate: (draft: SessionDraft) => SessionDraft): Promise<Session> {
    const updated = toUpdateSessionInput(withLocalMovements(mutate(toSessionDraft(session))));
    if (!updated.ok) {
      throw new Error(JSON.stringify(updated.violations));
    }
    const outcome = await sessions().update(session.id, updated.value);
    if (outcome.status !== "UPDATED") {
      throw new Error(outcome.status);
    }
    return outcome.session;
  }

  const occurrencesOf = (session: Session) => [...(session.cycle.beforeTour ?? []), ...session.cycle.tour.exercises, ...(session.cycle.afterTour ?? [])];

  // [A.3 du 04/11/2026 : cas de création, correction partagée (frères, compteur de phases) et relecture
  // d'une ancienne définition du Catalogue retirés avec leur dépôt.]
  it("copie du Catalogue et duplication : référence portée écrite telle quelle, conservée à la mise à jour ; occurrences comptées au succès seulement (C03)", async () => {
    const definition = await definitions().create(input(phased(phases(6, 3))));
    const copy = activityDefinitionToDraftExercise(definition, "occ-1", null);
    expect(copy.sourceMovementId).toBe(definition.movementId);
    // Brouillon abandonné : aucune écriture, aucune occurrence comptée.
    expect(await movements().countOccurrences(definition.movementId)).toBe(0);

    const session = await save({ ...createEmptyDraft(), name: "Jambes", exercises: [copy] });
    expect(occurrencesOf(session).map((item) => item.sourceMovementId)).toEqual([definition.movementId]);
    expect(await movements().countOccurrences(definition.movementId)).toBe(1);
    // Aucun Mouvement local pour une copie du Catalogue.
    expect(await database.getAllAsync("SELECT id FROM movements")).toEqual([{ id: definition.movementId }]);

    // Duplication (D-124, par étalement) et réécriture des occurrences à la mise à jour.
    const duplicated = await update(session, (draft) => ({ ...draft, exercises: duplicateActivity(draft.exercises, "occ-1", "occ-2") }));
    // PRE-7 (R-3, Q3) : la copie porte son numéro de copie, le nom reste celui du Mouvement.
    expect(occurrencesOf(duplicated).map((item) => [item.id, item.sourceMovementId, item.copyNumber, item.name])).toEqual([
      ["occ-1", definition.movementId, null, "Squat"],
      ["occ-2", definition.movementId, 1, "Squat"],
    ]);
    // Immuable : une entrée qui tenterait de la changer sur une occurrence existante est sans effet.
    const tampered = toUpdateSessionInput(toSessionDraft(duplicated));
    if (!tampered.ok) throw new Error("expected a valid input");
    const outcome = await sessions().update(duplicated.id, {
      ...tampered.value,
      activities: tampered.value.activities.map((activity) => ({ ...activity, sourceMovementId: "autre-geste" })),
    });
    expect(outcome.status === "UPDATED" && occurrencesOf(outcome.session).map((item) => item.sourceMovementId)).toEqual([
      definition.movementId,
      definition.movementId,
    ]);
    // PRE-7 (R-3, D-445) : référence active avec clé étrangère RESTRICT — le Mouvement encore référencé
    // par les occurrences n'est jamais supprimé ; la Séance se relit intacte.
    expect(await movements().delete(definition.movementId)).toEqual({ status: "REFERENCED", occurrenceCount: 2 });
    const kept = (await sessions().findById(session.id))!;
    expect(occurrencesOf(kept).map((item) => item.sourceMovementId)).toEqual([definition.movementId, definition.movementId]);
    expect(occurrencesOf(kept)[0]!.executionParameters).toEqual(phased(phases(6, 3)));
  });

  it("création locale en Séance : Mouvement local créé dans la transaction de la Séance, filiation = son identifiant, sans définition Catalogue ; aucun identifiant consommé", async () => {
    const local = {
      ...createExerciseDraft("occ-local"),
      name: "Gainage",
      instruction: "Dos plat",
      bodyZoneIds: ["dos"],
      categoryId: "cardio",
      executionParameters: phased(phases(20, 10)),
      media: [{ assetId: "p1", asset: photo("p1") }],
    };
    const before = sequence;
    const session = await save({ ...createEmptyDraft(), name: "Gainage", exercises: [local] });
    // Séance et Circuit (PRE-8, A.4 : plus de Cycle technique) : aucun identifiant pour le Mouvement
    // local ni ses liens (PRE-7, R-3 : plus aucun lien de média propre à l'occurrence).
    expect(sequence - before).toBe(2);
    expect(occurrencesOf(session).map((item) => item.sourceMovementId)).toEqual(["occ-local"]);
    expect(await movements().findById("occ-local")).toEqual({
      id: "occ-local",
      name: "Gainage",
      description: "Dos plat",
      media: [{ assetId: "p1", asset: photo("p1") }],
      categoryId: "cardio",
      bodyZoneIds: ["dos"],
      phases: [
        { id: 1, label: "Phase 1" },
        { id: 2, label: "Phase 2" },
      ],
      nextPhaseId: 3,
      aliases: [],
      levelGroup: null,
    });
    // Recherche : le geste local est proposé (MFN-04).
    expect((await movements().search("gainage")).map((item) => item.id)).toEqual(["occ-local"]);

    // Une création annulée (échec de la Séance) ne laisse ni Mouvement ni média orphelin.
    const broken = { ...local, id: "occ-broken", media: [{ assetId: "p2", asset: photo("p2") }, { assetId: "bad", asset: { ...photo("bad"), uri: " " } }] };
    await expect(save({ ...createEmptyDraft(), name: "Échec", exercises: [broken] })).rejects.toThrow();
    expect(await movements().findById("occ-broken")).toBeNull();
    expect(await database.getAllAsync("SELECT id FROM media_assets WHERE id = 'p2'")).toEqual([]);
  });

  // PRE-7 (R-3, D-445 C05) : plus d'occurrence orpheline — le Mouvement est obligatoire, et un
  // Mouvement nouveau exige une Catégorie et au moins une Zone ; rien n'est écrit.
  it("occurrence sans Mouvement, ou Mouvement nouveau sans Catégorie ou sans Zone (entrée hors interface) : refusée, rien n'est écrit", async () => {
    const bare = {
      id: "occ-bare",
      type: "EXERCISE" as const,
      structuralPosition: "IN_TOUR" as const,
      executionParameters: durationParameters(30, 2, 10),
      postActivityRecoverySeconds: null,
    };
    const base = { name: "Séance", initialCountdownSeconds: 10, finalPhaseSeconds: 5, tourRepeatCount: 1 };
    await expect(sessions().create({ ...base, exercises: [bare] })).rejects.toMatchObject({
      violations: [{ code: "REQUIRED", field: "activity.sourceMovementId" }],
    });
    const movement = {
      id: "occ-bare",
      change: "NEW" as const,
      name: "Gainage",
      description: null,
      categoryId: "",
      bodyZoneIds: [],
      media: [],
      phases: [],
      nextPhaseId: 1,
      aliases: [],
    };
    await expect(
      sessions().create({ ...base, exercises: [{ ...bare, sourceMovementId: "occ-bare" }], movements: [movement] }),
    ).rejects.toMatchObject({
      violations: [
        { code: "REQUIRED", field: "movement.category" },
        { code: "REQUIRED", field: "movement.bodyZoneIds" },
      ],
    });
    expect(await database.getAllAsync("SELECT id FROM movements")).toEqual([]);
    expect(await database.getAllAsync("SELECT id FROM sessions")).toEqual([]);
  });

  it("AC2 — créer au Catalogue, insérer dans une Séance, créer un Exercice local, enregistrer : tout se relit à l'identique, références non nulles, occurrences comptées", async () => {
    const definition: ActivityDefinition = await definitions().create(
      input(phased(phases(6, 3)), { media: [{ assetId: "p1", asset: photo("p1") }] }),
    );
    const local = {
      ...createExerciseDraft("occ-local"),
      name: "Gainage",
      bodyZoneIds: ["dos"],
      categoryId: "renforcement",
      executionParameters: durationParameters(45, 2, 15),
    };
    const draft: SessionDraft = {
      ...createEmptyDraft(),
      name: "Mixte",
      exercises: [activityDefinitionToDraftExercise(definition, "occ-copy", null), local],
    };
    const session = await save(draft);
    const reread = (await sessions().findById(session.id))!;
    expect(reread).toEqual(session);
    expect(occurrencesOf(reread).map((item) => [item.id, item.sourceMovementId])).toEqual([
      ["occ-copy", definition.movementId],
      ["occ-local", "occ-local"],
    ]);
    expect(occurrencesOf(reread).every((item) => typeof item.sourceMovementId === "string" && item.sourceMovementId.length > 0)).toBe(true);
    expect(occurrencesOf(reread).map((item) => item.executionParameters)).toEqual([phased(phases(6, 3)), durationParameters(45, 2, 15)]);
    expect(await movements().countOccurrences(definition.movementId)).toBe(1);
    expect(await movements().countOccurrences("occ-local")).toBe(1);
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("P39 sur le schéma 012 — Séance sans occurrence : listée à 0 exercice et 0 s, ouverte avec une composition vide ; vide refusée à l'enregistrement, complétée enregistrée", async () => {
    const definition = await definitions().create(input(durationParameters(30, 2, 10)));
    const session = await save({ ...createEmptyDraft(), name: "Vidée", exercises: [activityDefinitionToDraftExercise(definition, "occ-1", null)] });
    // Occurrences retirées hors repository (cas d'une Séance vidée).
    await database.runAsync("DELETE FROM activities WHERE session_id = ?", [session.id]);

    const listed = (await sessions().listActive()).find((summary) => summary.id === session.id);
    expect(listed).toMatchObject({ activityCount: 0, estimatedDurationSeconds: 0, durationKind: "exact", bodyZoneNames: [] });
    const opened = (await sessions().findById(session.id))!;
    expect(occurrencesOf(opened)).toEqual([]);
    expect(toSessionDraft(opened).exercises).toEqual([]);

    const base = {
      sourceSessionId: opened.id,
      name: opened.name,
      labelId: opened.labelId,
      initialCountdownSeconds: opened.initialCountdownSeconds,
      finalPhaseSeconds: opened.finalPhaseSeconds,
      tourRepeatCount: opened.cycle.tour.repeatCount,
    };
    await expect(sessions().update(opened.id, { ...base, activities: [] })).rejects.toBeInstanceOf(SessionValidationError);
    const outcome = await sessions().update(opened.id, {
      ...base,
      activities: [
        {
          id: "occ-new",
          type: "EXERCISE",
          structuralPosition: "IN_TOUR",
          position: 0,
          executionParameters: durationParameters(30, 3, 10),
          postActivityRecoverySeconds: 0,
          sourceMovementId: definition.movementId,
        },
      ],
    });
    expect(outcome.status === "UPDATED" && occurrencesOf(outcome.session).map((item) => [item.id, item.sourceMovementId])).toEqual([
      ["occ-new", definition.movementId],
    ]);
  });

  it("occurrence locale ajoutée à une Séance EXISTANTE (update) : son Mouvement local est créé, son occurrence comptée, référence = son identifiant", async () => {
    const definition = await definitions().create(input(durationParameters(30, 2, 10)));
    const session = await save({ ...createEmptyDraft(), name: "Base", exercises: [activityDefinitionToDraftExercise(definition, "occ-1", null)] });
    const local = {
      ...createExerciseDraft("occ-added"),
      name: "Pompes",
      bodyZoneIds: ["bras"],
      categoryId: "renforcement",
      executionParameters: durationParameters(20, 3, 15),
    };
    const updated = await update(session, (draft) => ({ ...draft, exercises: [...draft.exercises, local] }));
    expect(occurrencesOf(updated).map((item) => [item.id, item.sourceMovementId])).toEqual([
      ["occ-1", definition.movementId],
      ["occ-added", "occ-added"],
    ]);
    expect(await movements().findById("occ-added")).toMatchObject({ id: "occ-added", name: "Pompes", categoryId: "renforcement", bodyZoneIds: ["bras"] });
    expect(await movements().countOccurrences("occ-added")).toBe(1);
  });

  it("définition B non utilisée ajoutée à une Séance EXISTANTE (update) : son Mouvement est utilisé par une occurrence persistée (C03)", async () => {
    const definitionA = await definitions().create(input(durationParameters(30, 2, 10)));
    const definitionB = await definitions().create(input(durationParameters(45, 3, 15), { name: "Fentes" }));
    const session = await save({ ...createEmptyDraft(), name: "Base", exercises: [activityDefinitionToDraftExercise(definitionA, "occ-a", null)] });
    expect(await movements().countOccurrences(definitionB.movementId)).toBe(0);

    const updated = await update(session, (draft) => ({
      ...draft,
      exercises: [...draft.exercises, activityDefinitionToDraftExercise(definitionB, "occ-b", null)],
    }));
    expect(occurrencesOf(updated).map((item) => item.sourceMovementId)).toEqual([definitionA.movementId, definitionB.movementId]);
    expect(await movements().countOccurrences(definitionB.movementId)).toBe(1);
  });
});
