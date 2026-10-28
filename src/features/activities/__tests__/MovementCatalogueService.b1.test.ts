import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-8 (story B.1, CE-MVT-01, DSF Mouvements, recette MVT-01, 02, 05 à 09) — services du
 * Mouvement autonome sur SQLite réelle (`node:sqlite`).
 */

const NOW = "2026-10-27T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const repository = () => new SqliteMovementRepository(database, () => `gen-${++sequence}`, () => NOW);
const service = () => new MovementCatalogueService(repository());

const movement = (id: string, name: string, overrides: Partial<Movement> = {}): Movement => ({
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
  ...overrides,
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

describe("PRE-8 B.1 — Mouvement autonome depuis le Catalogue", () => {
  it("MVT-01 : crée un Mouvement indépendant, sans groupe ni Exercice, retrouvé à la réouverture", async () => {
    const result = await service().createIndependent(movement("m1", "Squats", { phases: [{ id: 1, label: "Descente" }], nextPhaseId: 2 }));
    expect(result).toMatchObject({ status: "SAVED", movement: { id: "m1", levelGroup: null } });
    expect(await service().findMovement("m1")).toMatchObject({ name: "Squats", phases: [{ id: 1, label: "Descente" }] });
    expect(await count("activity_definitions")).toBe(0);
    expect(await count("activities")).toBe(0);
    expect(await service().listEntries()).toEqual([expect.objectContaining({ level: null, exerciseCount: 0 })]);
  });

  it("MVT-02 : refuse un nom déjà utilisé (casse, accents, espaces), identité éditée exclue", async () => {
    await service().createIndependent(movement("m1", "Fentes avant"));
    expect(await service().createIndependent(movement("m2", "  FENTES   AVÂNT "))).toEqual({ status: "DUPLICATE_NAME" });
    // Renommer le même Mouvement vers son propre nom normalisé reste permis.
    expect(await service().update(movement("m1", "fentes avant"))).toMatchObject({ status: "SAVED" });
    expect(await count("movements")).toBe(1);
  });

  it("MVT-05 : variante plus facile ou plus difficile — nouvelle identité, groupe au deuxième membre, rangs dérivés", async () => {
    await service().createIndependent(movement("squat", "Squats"));
    expect(await service().createVariant(movement("assisted", "Squats assistés"), "squat", "EASIER")).toMatchObject({ status: "SAVED" });
    expect(await service().createVariant(movement("jump", "Squats sautés"), "squat", "HARDER")).toMatchObject({ status: "SAVED" });
    const families = await service().listFamilies();
    expect(families).toHaveLength(1);
    expect(families[0]!.members.map((entry) => [entry.movement.id, entry.level])).toEqual([
      ["assisted", { rank: 1, total: 3 }],
      ["squat", { rank: 2, total: 3 }],
      ["jump", { rank: 3, total: 3 }],
    ]);
  });

  it("MVT-05 : une variante refusée (origine inconnue ou nom pris) ne laisse ni Mouvement ni groupe", async () => {
    await service().createIndependent(movement("squat", "Squats"));
    expect(await service().createVariant(movement("v", "Variante"), "inconnu", "HARDER")).toEqual({ status: "NOT_FOUND" });
    expect(await service().createVariant(movement("v", "squats"), "squat", "HARDER")).toEqual({ status: "DUPLICATE_NAME" });
    expect(await count("movements")).toBe(1);
    expect((await service().findMovement("squat"))!.levelGroup).toBeNull();
  });

  it("MVT-06 : table C03 depuis le Catalogue — renommage sans usage, contenu sans usage, contenu avec Exercices, aucun changement", async () => {
    await service().createIndependent(movement("m1", "Pompes"));
    const assess = async (draft: Movement) => {
      const result = await service().assessSave(draft);
      return result.status === "ASSESSED" ? result.decision : result;
    };
    // Nom modifié : toujours le choix, même à zéro Exercice.
    expect(await assess(movement("m1", "Pompes larges"))).toEqual({ kind: "CHOICE", otherCount: 0 });
    // Contenu modifié, aucun Exercice ni exécution : mise à jour silencieuse.
    expect(await assess(movement("m1", "Pompes", { description: "Dos plat" }))).toEqual({ kind: "SILENT" });
    expect(await assess(movement("m1", "Pompes"))).toEqual({ kind: "NONE" });

    // Un Exercice de Séance référence le Mouvement : confirmation, compté une fois.
    await new SqliteSessionRepository(database, () => `ses-${++sequence}`, () => NOW).create({
      name: "Séance",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 3,
      exercises: [
        { type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30, 4), postActivityRecoverySeconds: 0, sourceMovementId: "m1" },
      ],
    });
    expect(await assess(movement("m1", "Pompes", { description: "Dos plat" }))).toEqual({ kind: "CONFIRM", otherCount: 1 });
    expect(await assess(movement("m1", "Pompes larges"))).toEqual({ kind: "CHOICE", otherCount: 1 });
  });

  it("MVT-07 et MVT-08 : créer un nouveau mouvement laisse l'original et ses Exercices intacts ; mettre à jour garde l'identité et les paramètres locaux", async () => {
    await service().createIndependent(movement("m1", "Pompes", { phases: [{ id: 1, label: "Descente" }], nextPhaseId: 2 }));
    const sessions = new SqliteSessionRepository(database, () => `ses-${++sequence}`, () => NOW);
    const session = await sessions.create({
      name: "Séance",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [
        { type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30, 2, 15), postActivityRecoverySeconds: 20, sourceMovementId: "m1" },
      ],
    });
    const paramsBefore = await database.getAllAsync("SELECT execution_parameters, post_activity_recovery_seconds, source_movement_id FROM activities");

    expect(await service().createAsNew(movement("m1", "Pompes diamant"), "m2")).toMatchObject({ status: "SAVED", movement: { id: "m2", levelGroup: null } });
    expect(await service().findMovement("m1")).toMatchObject({ name: "Pompes" });
    expect(await database.getAllAsync("SELECT execution_parameters, post_activity_recovery_seconds, source_movement_id FROM activities")).toEqual(paramsBefore);

    // Correction partagée : contenu courant visible dans la Séance, paramètres locaux conservés.
    expect(await service().update(movement("m1", "Pompes", { description: "Gainage serré", phases: [{ id: 1, label: "Descente lente" }], nextPhaseId: 2 }))).toMatchObject({
      status: "SAVED",
    });
    const reread = (await sessions.findById(session.id))!;
    expect(reread.cycle.tour.exercises[0]).toMatchObject({ instruction: "Gainage serré", postActivityRecoverySeconds: 20 });
    expect(await database.getAllAsync("SELECT execution_parameters, post_activity_recovery_seconds, source_movement_id FROM activities")).toEqual(paramsBefore);
  });

  it("MVT-09 : phases à identité stable au déplacement, compteur monotone, aucune durée sur le Mouvement", async () => {
    await service().createIndependent(movement("m1", "Burpees", { phases: [{ id: 1, label: "Descente" }, { id: 2, label: "Saut" }], nextPhaseId: 3 }));
    await service().update(movement("m1", "Burpees", { phases: [{ id: 2, label: "Saut" }, { id: 1, label: "Descente" }, { id: 3, label: "Réception" }], nextPhaseId: 4 }));
    const reread = (await service().findMovement("m1"))!;
    expect(reread.phases).toEqual([
      { id: 2, label: "Saut" },
      { id: 1, label: "Descente" },
      { id: 3, label: "Réception" },
    ]);
    expect(Object.keys(reread.phases[0]!)).toEqual(["id", "label"]);
    expect(reread.nextPhaseId).toBe(4);
  });

  it("le rang reste celui de la famille complète, et un Mouvement sans Exercice reste listé", async () => {
    await service().createIndependent(movement("a", "Gainage"));
    await service().createVariant(movement("b", "Gainage genoux"), "a", "EASIER");
    await service().createIndependent(movement("c", "Mobilisation du genou"));
    const entries = await service().listEntries();
    // Filtrer la vue (ici : seulement « Gainage ») ne recalcule pas les rangs.
    const filtered = entries.filter((entry) => entry.movement.id === "a");
    expect(filtered[0]!.level).toEqual({ rank: 2, total: 2 });
    expect(entries.find((entry) => entry.movement.id === "c")).toMatchObject({ level: null, exerciseCount: 0 });
  });
});
