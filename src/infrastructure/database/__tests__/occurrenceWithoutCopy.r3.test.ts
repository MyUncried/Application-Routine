import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { hasMissingPhaseDuration, numberTarget } from "@/domain/activities/ExecutionParameters";
import type { Movement } from "@/domain/activities/Movement";
import { DuplicateMovementNameError, MovementNotFoundError } from "@/domain/activities/MovementRepository";
import { durationParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { CreateSessionInput } from "@/domain/sessions/Session";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository, updateMovementContent } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { newMovementInput } from "@/infrastructure/database/testing/sessionMovements";

/**
 * PRE-7 (R-3, D-445 C05, arbitrage Q1 de Hermann du 26/10/2026) — l'occurrence de Séance ne
 * copie aucun contenu : elle référence son Mouvement (clé étrangère RESTRICT) et relit à chaque
 * lecture son nom, sa description, ses Zones et la structure de ses phases ; elle ne garde que
 * ses paramètres (durées par `phaseId`), sa position, sa récupération et son numéro de copie.
 */

const NOW = "2026-10-26T10:00:00.000Z";

function movement(overrides: Partial<Movement> = {}): Movement {
  return {
    id: "mov-squat",
    name: "Squat",
    description: "Dos droit",
    media: [],
    categoryId: "renforcement",
    bodyZoneIds: ["cuisses"],
    phases: [],
    nextPhaseId: 1,
    aliases: [],
    levelGroup: null,
    ...overrides,
  };
}

function session(exercises: CreateSessionInput["exercises"], movements: CreateSessionInput["movements"] = []): CreateSessionInput {
  return { name: "Jambes", initialCountdownSeconds: 10, finalPhaseSeconds: 5, tourRepeatCount: 1, exercises, movements };
}

describe("PRE7-R3 — occurrence sans copie de contenu (SqliteSessionRepository, SQLite réelle)", () => {
  let database: NodeSqliteDatabase;
  let sequence = 0;
  const ids = () => `id-${++sequence}`;
  const sessions = () => new SqliteSessionRepository(database, ids, () => NOW);
  const movements = () => new SqliteMovementRepository(database, ids, () => NOW);

  /** Réécrit le contenu d'un Mouvement persisté (correction partagée, même chemin que le Catalogue et la Séance). */
  async function correct(content: Movement): Promise<void> {
    await database.withExclusiveTransactionAsync((transaction) =>
      updateMovementContent(transaction, content, NOW, (position) => `link-${position}`),
    );
  }

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("deux occurrences du même Mouvement (original et copie 1) : le Mouvement corrigé est relu sur les deux, chacune avec ses propres paramètres", async () => {
    await movements().create(movement());
    const created = await sessions().create(
      session([
        { id: "occ-1", type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30), postActivityRecoverySeconds: 0, sourceMovementId: "mov-squat" },
        {
          id: "occ-2",
          type: "EXERCISE",
          structuralPosition: "IN_TOUR",
          executionParameters: durationParameters(45, 2, 10),
          postActivityRecoverySeconds: 20,
          sourceMovementId: "mov-squat",
          copyNumber: 1,
        },
      ]),
    );
    expect(created.cycle.tour.exercises.map((occurrence) => [occurrence.name, occurrence.copyNumber])).toEqual([
      ["Squat", null],
      ["Squat", 1],
    ]);

    await correct(movement({ name: "Squat bulgare", description: "Pied arrière surélevé", bodyZoneIds: ["hanches-bassin"] }));

    const reread = (await sessions().findById(created.id))!.cycle.tour.exercises;
    expect(
      reread.map((occurrence) => ({
        id: occurrence.id,
        name: occurrence.name,
        instruction: occurrence.instruction,
        bodyZoneIds: occurrence.bodyZoneIds,
        categoryId: occurrence.categoryId,
        sourceMovementId: occurrence.sourceMovementId,
        copyNumber: occurrence.copyNumber,
        parameters: occurrence.executionParameters,
        recovery: occurrence.postActivityRecoverySeconds,
      })),
    ).toEqual([
      {
        id: "occ-1",
        name: "Squat bulgare",
        instruction: "Pied arrière surélevé",
        bodyZoneIds: ["hanches-bassin"],
        categoryId: "renforcement",
        sourceMovementId: "mov-squat",
        copyNumber: null,
        parameters: durationParameters(30),
        recovery: 0,
      },
      {
        id: "occ-2",
        name: "Squat bulgare",
        instruction: "Pied arrière surélevé",
        bodyZoneIds: ["hanches-bassin"],
        categoryId: "renforcement",
        sourceMovementId: "mov-squat",
        copyNumber: 1,
        parameters: durationParameters(45, 2, 10),
        recovery: 20,
      },
    ]);
    // Aucun contenu dans l'occurrence : ni colonne de nom, de description ni de Catégorie.
    const columns = (await database.getAllAsync<{ name: string }>("PRAGMA table_info(activities)")).map((column) => column.name);
    expect(columns).not.toEqual(expect.arrayContaining(["name"]));
    expect(columns.filter((name) => ["name", "instruction", "category_id"].includes(name))).toEqual([]);
    expect(columns).toEqual(expect.arrayContaining(["source_movement_id", "copy_number"]));
  });

  it("phase ajoutée au Mouvement après l'enregistrement : relue à 0, manquante ; phase retirée : ignorée", async () => {
    await movements().create(
      movement({
        phases: [
          { id: 1, label: "Descente" },
          { id: 2, label: "Montée" },
        ],
        nextPhaseId: 3,
      }),
    );
    const parameters = uniformParameters({
      count: 3,
      target: 9,
      pauseSeconds: 10,
      workPhases: [
        { id: 1, label: "Descente", durationSeconds: 6 },
        { id: 2, label: "Montée", durationSeconds: 3 },
      ],
    });
    const created = await sessions().create(
      session([{ id: "occ-1", type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: parameters, postActivityRecoverySeconds: null, sourceMovementId: "mov-squat" }]),
    );
    expect(hasMissingPhaseDuration(created.cycle.tour.exercises[0]!.executionParameters)).toBe(false);

    // Phase 3 ajoutée au Mouvement : l'occurrence n'a aucune durée pour elle.
    await correct(
      movement({
        phases: [
          { id: 1, label: "Descente" },
          { id: 2, label: "Montée" },
          { id: 3, label: "Pause basse" },
        ],
        nextPhaseId: 4,
      }),
    );
    const withAdded = (await sessions().findById(created.id))!.cycle.tour.exercises[0]!.executionParameters;
    expect(withAdded.series.workPhases).toEqual([
      { id: 1, label: "Descente", durationSeconds: 6 },
      { id: 2, label: "Montée", durationSeconds: 3 },
      { id: 3, label: "Pause basse", durationSeconds: 0 },
    ]);
    expect(hasMissingPhaseDuration(withAdded)).toBe(true);
    expect(withAdded.series.kind === "UNIFORM" && withAdded.series.target).toEqual(numberTarget(9));
    // La liste relit la même structure, sans lever.
    expect((await sessions().listActive()).map((summary) => summary.id)).toEqual([created.id]);

    // Phase 2 retirée (et 3 supprimée) : sa durée persistée est ignorée, jamais réassociée.
    await correct(movement({ phases: [{ id: 1, label: "Descente lente" }], nextPhaseId: 4 }));
    const withRemoved = (await sessions().findById(created.id))!.cycle.tour.exercises[0]!.executionParameters;
    expect(withRemoved.series.workPhases).toEqual([{ id: 1, label: "Descente lente", durationSeconds: 6 }]);
    expect(hasMissingPhaseDuration(withRemoved)).toBe(false);
  });

  it("Mouvement NEW « Squat » alors que « squat » existe : DuplicateMovementNameError, rien d'écrit ; Mouvement inconnu : MovementNotFoundError", async () => {
    await movements().create(movement({ id: "mov-existing", name: "squat" }));
    const snapshot = async () => ({
      sessions: await database.getAllAsync("SELECT * FROM sessions"),
      activities: await database.getAllAsync("SELECT * FROM activities"),
      movements: await database.getAllAsync("SELECT * FROM movements ORDER BY id"),
      zones: await database.getAllAsync("SELECT * FROM movement_body_zones ORDER BY movement_id"),
    });
    const before = await snapshot();

    await expect(
      sessions().create(
        session(
          [{ id: "occ-new", type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30), postActivityRecoverySeconds: 0, sourceMovementId: "occ-new" }],
          [newMovementInput("occ-new", { name: "Squat" })],
        ),
      ),
    ).rejects.toBeInstanceOf(DuplicateMovementNameError);
    expect(await snapshot()).toEqual(before);

    await expect(
      sessions().create(
        session([{ id: "occ-x", type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30), postActivityRecoverySeconds: 0, sourceMovementId: "mov-inconnu" }]),
      ),
    ).rejects.toBeInstanceOf(MovementNotFoundError);
    expect(await snapshot()).toEqual(before);
  });

  it("suppression d'un Mouvement référencé par une seule occurrence : REFERENCED (occurrenceCount 1), rien n'est supprimé ; dernière occurrence retirée : le Mouvement reste", async () => {
    await movements().create(movement());
    const created = await sessions().create(
      session([{ id: "occ-1", type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30), postActivityRecoverySeconds: 0, sourceMovementId: "mov-squat" }]),
    );
    expect(await movements().countOccurrences("mov-squat")).toBe(1);
    expect(await movements().delete("mov-squat")).toEqual({ status: "REFERENCED", definitionCount: 0, occurrenceCount: 1 });
    expect(await movements().findById("mov-squat")).not.toBeNull();
    // Le RESTRICT de la clé étrangère protège aussi une suppression directe.
    await expect(database.runAsync("DELETE FROM movements WHERE id = 'mov-squat'")).rejects.toThrow(/FOREIGN KEY/i);

    // v7 §2 : supprimer la dernière occurrence ne supprime jamais le Mouvement.
    await database.runAsync("DELETE FROM sessions WHERE id = ?", [created.id]);
    expect(await movements().countOccurrences("mov-squat")).toBe(0);
    expect(await movements().findById("mov-squat")).not.toBeNull();
    expect(await movements().delete("mov-squat")).toEqual({ status: "DELETED" });
  });

  // PRE-7 (R-4, D-445 C04) : décompte vu depuis le brouillon d'une Séance — ses propres
  // occurrences en sont exclues, celles des autres Séances comptent.
  it("countOccurrences(id, excludingSessionId) : occurrences de deux Séances, l'exclusion de A rend le nombre de B", async () => {
    await movements().create(movement());
    const occurrence = (id: string) => ({
      id,
      type: "EXERCISE" as const,
      structuralPosition: "IN_TOUR" as const,
      executionParameters: durationParameters(30),
      postActivityRecoverySeconds: 0,
      sourceMovementId: "mov-squat",
    });
    const a = await sessions().create(session([occurrence("occ-a1"), occurrence("occ-a2")]));
    const b = await sessions().create({ ...session([occurrence("occ-b1")]), name: "Jambes B" });
    expect(await movements().countOccurrences("mov-squat")).toBe(3);
    expect(await movements().countOccurrences("mov-squat", a.id)).toBe(1);
    expect(await movements().countOccurrences("mov-squat", b.id)).toBe(2);
    expect(await movements().countOccurrences("mov-squat", "inconnue")).toBe(3);
  });
});
