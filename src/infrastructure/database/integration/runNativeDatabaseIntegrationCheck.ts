import * as SQLite from "expo-sqlite";

import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import { ExpoDatabase, openExpoDatabase } from "@/infrastructure/database/ExpoDatabase";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";

const INTEGRATION_DATABASE_NAME = "kodjo-t01-s01-integration.db";

export async function runNativeDatabaseIntegrationCheck(): Promise<void> {
  await SQLite.deleteDatabaseAsync(INTEGRATION_DATABASE_NAME).catch(() => undefined);
  const opened = await openExpoDatabase(INTEGRATION_DATABASE_NAME);

  try {
    await migrateDatabase(opened.database);
    const repository = new SqliteSessionRepository(opened.database);
    const created = await repository.create({
      name: "Contrôle SQLite natif",
      color: DEFAULT_SESSION_COLOR,
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      exercises: [
        {
          name: "Exercice chronométré",
          executionMode: "DURATION",
          durationSeconds: 30,
          repetitionCount: null,
          seriesCount: 1,
          pauseSeconds: 0,
          instruction: null,
          bodyZoneIds: [],
        },
      ],
      categories: [],
    });

    const reopened = await repository.findById(created.id);
    const listed = await repository.listActive();

    if (!reopened || listed.length !== 1 || listed[0].id !== created.id) {
      throw new Error("Native SQLite integration check failed.");
    }

    if (![created.id, created.cycle.id, created.cycle.tour.id, created.cycle.tour.exercises[0]!.id].every(
      (identifier) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier),
    )) {
      throw new Error("Crypto.randomUUID() identifiers are invalid.");
    }
  } finally {
    await opened.closeAsync();
  }

  const verificationDatabase = await SQLite.openDatabaseAsync(INTEGRATION_DATABASE_NAME);
  try {
    const database = new ExpoDatabase(verificationDatabase);
    const userCount = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM users",
    );
    if (userCount?.count !== 1) {
      throw new Error("Stable local user was not persisted.");
    }
  } finally {
    await verificationDatabase.closeAsync();
    await SQLite.deleteDatabaseAsync(INTEGRATION_DATABASE_NAME);
  }
}
