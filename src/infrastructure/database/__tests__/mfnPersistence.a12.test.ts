import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  activityDefinitionToInput,
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import {
  ExecutionParametersDataError,
  ExecutionParametersValidationError,
  readCatalogExecutionParameters,
  serializeCatalogExecutionParameters,
  type ExecutionParameters,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import { SharedCorrectionRefusedError } from "@/domain/activities/sharedCorrection";
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
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
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
  const definitions = () => new SqliteActivityDefinitionRepository(database, ids("def"), () => NOW);
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

  async function storedCatalogJson(id: string) {
    const row = await database.getFirstAsync<{ execution_parameters: string }>(
      "SELECT execution_parameters FROM activity_definitions WHERE id = ?",
      [id],
    );
    return readCatalogExecutionParameters(row!.execution_parameters);
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

  it("création Catalogue à phases [6, 3] : un Mouvement (contenu, structure, compteur 3) et une définition v4 ; relue identique", async () => {
    const parameters = phased(phases(6, 3));
    const created = await definitions().create(input(parameters, { media: [{ assetId: "p1", asset: photo("p1") }] }));

    const movement = await movements().findById(created.movementId);
    expect(movement).toEqual({
      id: created.movementId,
      name: "Squat",
      description: "Buste droit",
      media: [{ assetId: "p1", asset: photo("p1") }],
      categoryId: "cardio",
      bodyZoneIds: ["cuisses"],
      phases: [
        { id: 1, label: "Phase 1" },
        { id: 2, label: "Phase 2" },
      ],
      nextPhaseId: 3,
      aliases: [],
      levelGroup: null,
    });
    // Forme Catalogue v4 : durées par `phaseId`, sans libellé.
    const catalog = await storedCatalogJson(created.id);
    expect(catalog.series.kind === "UNIFORM" && catalog.series.phaseDurations).toEqual([
      { phaseId: 1, durationSeconds: 6 },
      { phaseId: 2, durationSeconds: 3 },
    ]);
    expect(created.executionParameters).toEqual(parameters);
    expect(created.missingPhaseIds).toBeUndefined();
    expect(await definitions().findById(created.id)).toEqual(created);
    expect((await definitions().listAll()).map((item) => item.id)).toEqual([created.id]);
  });

  it("Catégorie inconnue : rollback complet, ni Mouvement, ni définition, ni média", async () => {
    await expect(
      definitions().create(
        input(phased(phases(6, 3)), {
          category: { kind: "EXISTING", categoryId: "inconnue" },
          media: [{ assetId: "p1", asset: photo("p1") }],
        }),
      ),
    ).rejects.toThrow();
    for (const table of ["activity_definitions", "movements", "movement_phases", "movement_body_zones", "movement_media", "media_assets"]) {
      expect({ table, rows: await database.getAllAsync(`SELECT * FROM ${table}`) }).toEqual({ table, rows: [] });
    }
  });

  it("phase retirée puis ajoutée : [1,2,3] → [1,2] → [1,2,+] ; la phase ajoutée reçoit 4, jamais 3 (compteur monotone)", async () => {
    const created = await definitions().create(input(phased(phases(4, 5, 6))));
    const removed = await definitions().update(created.id, input(phased(phases(4, 5))));
    expect((await movements().findById(created.movementId))?.nextPhaseId).toBe(4);
    // PRE-7 A2.1 (MFN/AC30) : la définition relue expose ce compteur, que l'éditeur transmet à la Feuille.
    expect((await definitions().findById(created.id))?.movementNextPhaseId).toBe(4);
    expect((await definitions().listAll()).find((definition) => definition.id === created.id)?.movementNextPhaseId).toBe(4);
    // Une identité de brouillon déjà retirée (3, ancien max + 1) n'est de toute façon pas réallouée : le Mouvement alloue 4.
    const added = await definitions().update(
      created.id,
      input(phased([...phases(4, 5), { id: 3, label: "Nouvelle", durationSeconds: 7 }])),
    );
    expect(removed?.executionParameters.series.kind === "UNIFORM" && removed.executionParameters.series.workPhases.map((p) => p.id)).toEqual([1, 2]);
    expect(added?.executionParameters.series.kind === "UNIFORM" && added.executionParameters.series.workPhases).toEqual([
      { id: 1, label: "Phase 1", durationSeconds: 4 },
      { id: 2, label: "Phase 2", durationSeconds: 5 },
      { id: 4, label: "Nouvelle", durationSeconds: 7 },
    ]);
    const movement = await movements().findById(created.movementId);
    expect(movement?.phases.map((phase) => phase.id)).toEqual([1, 2, 4]);
    expect(movement?.nextPhaseId).toBe(5);
    expect((await definitions().findById(created.id))?.movementNextPhaseId).toBe(5);
    // Déplacement et renommage : identités conservées, compteur inchangé.
    const moved = await definitions().update(
      created.id,
      input(
        phased([
          { id: 4, label: "Nouvelle", durationSeconds: 7 },
          { id: 1, label: "Descente", durationSeconds: 4 },
          { id: 2, label: "Phase 2", durationSeconds: 5 },
        ]),
      ),
    );
    expect(moved?.executionParameters.series.kind === "UNIFORM" && moved.executionParameters.series.workPhases.map((p) => [p.id, p.label])).toEqual([
      [4, "Nouvelle"],
      [1, "Descente"],
      [2, "Phase 2"],
    ]);
    expect((await movements().findById(created.movementId))?.nextPhaseId).toBe(5);
  });

  it("exercice frère incomplet relu : durée null → missingPhaseIds renseigné, Cible UNSET ; phase retirée du Mouvement → ignorée (R-3) ; durées corrompues → ExecutionParametersDataError", async () => {
    const created = await definitions().create(input(phased(phases(6, 3))));
    const catalog = await storedCatalogJson(created.id);
    if (catalog.series.kind !== "UNIFORM") throw new Error("uniform expected");
    const incomplete = serializeCatalogExecutionParameters({
      ...catalog,
      series: {
        ...catalog.series,
        target: { kind: "UNSET" },
        phaseDurations: [
          { phaseId: 1, durationSeconds: 6 },
          { phaseId: 2, durationSeconds: null },
        ],
      },
    });
    await database.runAsync("UPDATE activity_definitions SET execution_parameters = ? WHERE id = ?", [incomplete, created.id]);
    const sibling = await definitions().findById(created.id);
    expect(sibling?.missingPhaseIds).toEqual([2]);
    expect(sibling?.executionParameters.series).toMatchObject({
      kind: "UNIFORM",
      target: { kind: "UNSET" },
      workPhases: [
        { id: 1, label: "Phase 1", durationSeconds: 6 },
        { id: 2, label: "Phase 2", durationSeconds: 0 },
      ],
    });
    // L'Exercice édité doit être complet : réenregistré tel quel, il est refusé sans écriture (D-438).
    await expect(definitions().update(created.id, activityDefinitionToInput(sibling!))).rejects.toThrow(ExecutionParametersValidationError);
    // Copie de Séance d'un frère incomplet : refusée (aucune copie exécutable inventée).
    const copy = activityDefinitionToDraftExercise(sibling!, "occ-1", null);
    expect(toCreateSessionInput({ ...createEmptyDraft(), name: "Jambes", exercises: [copy] }).ok).toBe(false);

    // PRE-7 (R-3, v7 §2) : phase retirée du Mouvement — sa durée (manquante) est ignorée, jamais réassociée.
    await database.runAsync("DELETE FROM movement_phases WHERE movement_id = ? AND phase_id = 2", [created.movementId]);
    const pruned = await definitions().findById(created.id);
    expect(pruned?.executionParameters.series.workPhases).toEqual([{ id: 1, label: "Phase 1", durationSeconds: 6 }]);
    expect(pruned?.missingPhaseIds ?? []).toEqual([]);
    // Durées corrompues (identité dupliquée) : donnée corrompue, jamais une association approchée.
    const corrupt = incomplete.replace('"phaseId":2', '"phaseId":1');
    expect(corrupt).not.toBe(incomplete);
    await database.runAsync("UPDATE activity_definitions SET execution_parameters = ? WHERE id = ?", [corrupt, created.id]);
    await expect(definitions().findById(created.id)).rejects.toThrow(ExecutionParametersDataError);
  });

  // PRE-7 (A1.3) : la garde provisoire d'A1.2 (`SharedMovementStructureError`) est levée au profit de la
  // correction partagée explicite ; sans complétion du frère, le changement de structure reste refusé sans écriture.
  it("Mouvement partagé : changer l'ensemble de ses phases sans complétion du frère est refusé sans écriture (SharedCorrectionRefusedError) ; le contenu partagé reste modifiable", async () => {
    const created = await definitions().create(input(phased(phases(6, 3))));
    // PRE-7 (R-3, C01) : nom distinct à la création (le Mouvement provisoire du frère est supprimé ci-dessous).
    const sibling = await definitions().create(input(phased(phases(6, 3)), { name: "Squat frère" }));
    // Rattachement direct en base (les services d'origine « même geste » sont livrés en A1.3).
    await database.runAsync("UPDATE activity_definitions SET movement_id = ? WHERE id = ?", [created.movementId, sibling.id]);
    await database.runAsync("DELETE FROM movements WHERE id = ?", [sibling.movementId]);
    const before = await database.getAllAsync("SELECT * FROM movement_phases ORDER BY rowid");

    // Phase ajoutée : la durée du frère manque, sa complétion n'est pas fournie.
    await expect(definitions().update(created.id, input(phased(phases(6, 3, 4))))).rejects.toThrow(SharedCorrectionRefusedError);
    expect(await database.getAllAsync("SELECT * FROM movement_phases ORDER BY rowid")).toEqual(before);

    const renamed = await definitions().update(created.id, input(phased(phases(6, 3)), { name: "Squat partagé" }));
    expect(renamed?.name).toBe("Squat partagé");
    expect((await definitions().findById(sibling.id))?.name).toBe("Squat partagé");
  });

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
    // PRE-7 (R-3, D-445) : référence active avec clé étrangère RESTRICT — sans définition, le Mouvement
    // encore référencé par les occurrences n'est jamais supprimé ; la Séance se relit intacte.
    await database.runAsync("DELETE FROM activity_definitions");
    expect(await movements().delete(definition.movementId)).toEqual({ status: "REFERENCED", definitionCount: 0, occurrenceCount: 2 });
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
    expect(await database.getAllAsync("SELECT id FROM activity_definitions")).toEqual([]);
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
    expect(await definitions().findById(definition.id)).toEqual(definition);
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
    expect(await database.getAllAsync("SELECT id FROM activity_definitions")).toEqual([{ id: definition.id }]);
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
