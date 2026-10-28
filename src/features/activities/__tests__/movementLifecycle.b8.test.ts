import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-8 (story B.8, arbitrages de Hermann du 27/10/2026, Q5 à Q8) — cycle de vie du Mouvement sur
 * SQLite réelle : archivage refusé tant qu'un Exercice persisté le référence (Séance active ou
 * archivée), aucune suppression d'Exercice ni de Séance, famille et rangs inchangés, restauration
 * à l'identique, suppression définitive depuis les Archives seulement, sans cascade ; Q6 : un
 * Mouvement archivé n'est plus proposé pour créer un Exercice.
 */

const NOW = "2026-10-27T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const repository = () => new SqliteMovementRepository(database, () => `gen-${++sequence}`, () => NOW);
const catalogue = () => new MovementCatalogueService(repository());
const definitions = () =>
  new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database, () => `def-${++sequence}`, () => NOW),
    undefined,
    undefined,
    undefined,
    undefined,
    repository(),
  );

const movement = (id: string, name: string): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["dos"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
});

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

async function count(table: string): Promise<number> {
  return (await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`))!.count;
}

async function sessionUsing(movementId: string): Promise<string> {
  const session = await new SqliteSessionRepository(database, () => `ses-${++sequence}`, () => NOW).create({
    name: "Séance",
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    tourRepeatCount: 3,
    exercises: [
      { type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30, 4), postActivityRecoverySeconds: 0, sourceMovementId: movementId },
    ],
  });
  return session.id;
}

/** Famille Squats assistés (1) / Squats (2) / Squats sautés (3). */
async function family(): Promise<void> {
  await repository().create(movement("squat", "Squats"));
  await repository().createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
  await repository().createVariant(movement("jump", "Squats sautés"), "squat", "AFTER_ORIGIN");
}

const ranks = async () =>
  Object.fromEntries((await catalogue().listEntries()).map((entry) => [entry.movement.id, [entry.level?.rank, entry.level?.total, entry.archived]]));

describe("PRE-8 B.8 — archivage, restauration et suppression du Mouvement", () => {
  it("refuse l'archivage d'un Mouvement utilisé par un Exercice de Séance active ou archivée, sans rien écrire", async () => {
    await repository().create(movement("m1", "Pompes"));
    const sessionId = await sessionUsing("m1");
    expect(await catalogue().archive("m1")).toEqual({ status: "REFERENCED", exerciseCount: 1 });
    await database.runAsync("UPDATE sessions SET status = 'ARCHIVED', archived_at = ? WHERE id = ?", [NOW, sessionId]);
    expect(await catalogue().archive("m1")).toEqual({ status: "REFERENCED", exerciseCount: 1 });
    await sessionUsing("m1");
    expect(await catalogue().archive("m1")).toEqual({ status: "REFERENCED", exerciseCount: 2 });
    expect(await repository().listArchivedIds()).toEqual(new Set());
    expect(await count("sessions")).toBe(2);
    expect(await count("activities")).toBe(2);
  });

  it("refuse aussi l'archivage d'un Mouvement référencé par un Exercice du Catalogue (définition persistée)", async () => {
    await repository().create(movement("gainage", "Gainage"));
    await database.runAsync(
      "INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at) VALUES ('def', 'gainage', '{}', ?, ?)",
      [NOW, NOW],
    );
    expect(await catalogue().archive("gainage")).toEqual({ status: "REFERENCED", exerciseCount: 1 });
    expect(await count("activity_definitions")).toBe(1);
  });

  it("archive un Mouvement inutilisé : rangs affichés des actifs recalculés (b8-3), famille et ordre intacts", async () => {
    await family();
    expect(await catalogue().archive("squat")).toEqual({ status: "DONE" });
    // Recette A/B du 27/10 (b8-3) : les actifs sont renumérotés ; l'archivé garde son rang complet.
    expect(await ranks()).toEqual({
      assist: [1, 2, false],
      squat: [2, 3, true],
      jump: [2, 2, false],
    });
    const positions = Object.fromEntries(
      (await catalogue().listEntries()).map((entry) => [entry.movement.id, entry.familyPosition?.rank]),
    );
    expect(positions).toEqual({ assist: 1, squat: 2, jump: 3 });
    expect((await repository().findById("squat"))!.levelGroup).not.toBeNull();
    expect(await catalogue().archive("squat")).toEqual({ status: "STALE" });
  });

  it("restaure à l'identique : identité, contenu, famille et position (Q7) ; un actif ne se restaure pas", async () => {
    await family();
    const before = await repository().findById("squat");
    await catalogue().archive("squat");
    expect(await catalogue().restore("squat")).toEqual({ status: "DONE" });
    expect(await repository().findById("squat")).toEqual(before);
    expect(await ranks()).toEqual({ assist: [1, 3, false], squat: [2, 3, false], jump: [3, 3, false] });
    expect(await catalogue().restore("squat")).toEqual({ status: "STALE" });
    expect(await count("movements")).toBe(3);
  });

  it("clôture FAM (cas 2) : le restant seul à l'écran après archivage garde son appartenance, sans pastille ; restaurer l'autre retrouve la famille", async () => {
    await repository().create(movement("squat", "Squats"));
    await repository().createVariant(movement("assist", "Squats assistés"), "squat", "BEFORE_ORIGIN");
    const group = (await repository().findById("squat"))!.levelGroup!.groupId;
    expect(await catalogue().archive("assist")).toEqual({ status: "DONE" });
    // Un seul actif : aucune pastille (b8-3), mais l'appartenance et la clé sont conservées.
    expect(await ranks()).toEqual({ squat: [undefined, undefined, false], assist: [1, 2, true] });
    expect((await repository().findById("squat"))!.levelGroup?.groupId).toBe(group);
    expect((await repository().findById("assist"))!.levelGroup?.groupId).toBe(group);
    expect(await catalogue().restore("assist")).toEqual({ status: "DONE" });
    expect(await ranks()).toEqual({ squat: [2, 2, false], assist: [1, 2, false] });
    expect((await repository().listGroup(group)).map((member) => member.id)).toEqual(["assist", "squat"]);
  });

  it("supprime définitivement depuis les Archives seulement, sans cascade ; la famille restante garde son ordre (Q8)", async () => {
    await family();
    expect(await catalogue().deleteArchived("squat")).toEqual({ status: "STALE" });
    await catalogue().archive("squat");
    expect(await catalogue().deleteArchived("squat")).toEqual({ status: "DONE" });
    expect(await repository().findById("squat")).toBeNull();
    expect(await ranks()).toEqual({ assist: [1, 2, false], jump: [2, 2, false] });
  });

  it("refuse la suppression définitive d'un archivé encore référencé (cas défensif, aucune cascade)", async () => {
    await repository().create(movement("m1", "Pompes"));
    await catalogue().archive("m1");
    // Référence posée directement en base, hors parcours (l'application ne propose pas un archivé).
    await sessionUsing("m1");
    expect(await catalogue().deleteArchived("m1")).toEqual({ status: "REFERENCED", exerciseCount: 1 });
    expect(await count("movements")).toBe(1);
    expect(await count("activities")).toBe(1);
  });

  it("Q6 : un Mouvement archivé est marqué dans les choix de création et dans les Niveaux, rangs inchangés", async () => {
    await family();
    await catalogue().archive("jump");
    const choices = await definitions().listMovementChoices();
    expect(Object.fromEntries(choices.map((choice) => [choice.movement.id, choice.archived]))).toEqual({
      assist: false,
      squat: false,
      jump: true,
    });
    const levels = await definitions().getMovementLevels("squat");
    expect(levels!.levels.map((entry) => [entry.movement.id, entry.rank, entry.archived])).toEqual([
      ["assist", 1, false],
      ["squat", 2, false],
      ["jump", 3, true],
    ]);
  });
});
