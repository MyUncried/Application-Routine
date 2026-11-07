import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { CreateActivityDefinitionInput } from "@/domain/activities/ActivityDefinition";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { withLevelSuffix } from "@/features/activities/movementChoicePresentation";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { createTestMovement, type TestMovementOrigin } from "@/infrastructure/database/testing/createTestMovement";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-7 story R-6 (D-445 C06, v7 l.69, MFN-10 l.426 ; relevé du 25/10 §6 « Squat assisté - N1 ») —
 * suffixe dérivé « - Nn » des cartes sans pastille (Catalogue, choix d'exercices), sur les VRAIS
 * services et une base SQLite réelle : présent pour un mouvement groupé, absent sans groupe ou en
 * groupe singleton, jamais stocké dans le nom. Rappel : ces tests ne valent pas recette sur iPhone.
 *
 * [PRE-9 A.3 du 04/11/2026 : les cartes du Catalogue des Exercices et du choix d'exercices (anciennes
 * définitions) sont retirées avec les anciennes définitions du Catalogue ; les Mouvements sont créés
 * directement (`createTestMovement`).]
 */

let database: NodeSqliteDatabase;
let sequence = 0;
let tick = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const clock = () => new Date(Date.UTC(2026, 9, 26, 9, 0, ++tick)).toISOString();
const movements = () => new SqliteMovementRepository(database, ids("grp"), clock);
const service = () =>
  new ActivityDefinitionService(
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    undefined,
    undefined,
    movements(),
  );

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

const input = (name: string): CreateActivityDefinitionInput => ({
  name,
  description: null,
  category: { kind: "EXISTING", categoryId: "cardio" },
  bodyZoneIds: ["cuisses"],
  executionParameters: durationParameters(30, 3, 10),
});

async function create(name: string, origin: TestMovementOrigin = { kind: "INDEPENDENT" }) {
  return createTestMovement(database, input(name), origin, ids("mov"), clock);
}

/** « Squats assistés » (1 sur 2) → « Squats » (2 sur 2) ; « Pompes » sans groupe. */
async function fixtures() {
  const assisted = await create("Squats assistés");
  const squats = await create("Squats", { kind: "VARIANT", originMovementId: assisted.movementId, joinOriginGroup: true });
  const pushUps = await create("Pompes");
  return { assisted, squats, pushUps };
}

describe("PRE-7 R-6 — withLevelSuffix", () => {
  it("« nom - Nn » avec une position ; nom seul sans position", () => {
    expect(withLevelSuffix("Squat assisté", { rank: 1, total: 3 })).toBe("Squat assisté - N1");
    expect(withLevelSuffix("Squats", { rank: 12, total: 12 })).toBe("Squats - N12");
    expect(withLevelSuffix("Pompes", null)).toBe("Pompes");
    expect(withLevelSuffix("Pompes", undefined)).toBe("Pompes");
    // Un nom contenant un motif de remplacement reste littéral.
    expect(withLevelSuffix("A $& B", { rank: 2, total: 2 })).toBe("A $& B - N2");
  });
});

describe("PRE-7 R-6 — listMovementLevelPositions", () => {
  it("positions des mouvements groupés seulement ; singleton et mouvement sans groupe absents", async () => {
    const { assisted, squats, pushUps } = await fixtures();
    const positions = await service().listMovementLevelPositions();
    expect(positions.get(assisted.movementId)).toEqual({ rank: 1, total: 2 });
    expect(positions.get(squats.movementId)).toEqual({ rank: 2, total: 2 });
    expect(positions.has(pushUps.movementId)).toBe(false);
    await movements().detachFromGroup(squats.movementId);
    const after = await service().listMovementLevelPositions();
    expect(after.has(assisted.movementId)).toBe(false);
    expect(after.has(squats.movementId)).toBe(false);
  });
});

// [PRE-9 A.3 du 04/11/2026 : cartes du Catalogue des Exercices et du choix d'exercices retirées avec les
// anciennes définitions du Catalogue.]
