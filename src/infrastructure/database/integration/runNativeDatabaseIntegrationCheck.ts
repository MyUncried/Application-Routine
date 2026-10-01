import * as SQLite from "expo-sqlite";

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
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [
        {
          type: "EXERCISE",
          structuralPosition: "IN_TOUR",
          name: "Exercice chronométré",
          executionMode: "DURATION",
          durationSeconds: 30,
          repetitionCount: null,
          seriesCount: 3,
          pauseSeconds: 15,
          // T02-S02 / V2-PRE-1 : la récupération post-exercice traverse le
          // contrôle natif — colonne `post_activity_recovery_seconds`
          // (renommée depuis `recovery_seconds`, `migration007`).
          postActivityRecoverySeconds: 20,
          instruction: null,
          bodyZoneIds: [],
        },
      ],
    });

    const reopened = await repository.findById(created.id);
    const listed = await repository.listActive();

    if (!reopened || listed.length !== 1 || listed[0].id !== created.id) {
      throw new Error("Native SQLite integration check failed.");
    }

    // T02-S02 : aller-retour réel de `recovery_seconds` et parité de la durée
    // agrégée par SQL avec la formule du Domaine
    // `D = C × A + (C − 1) × B + R` = 3 × 30 + 2 × 15 + 20 = 140 s. Un
    // contrôle natif qui ne relirait que l'identifiant ne prouverait ni la
    // nouvelle colonne, ni la suppression de la Pause finale.
    const roundTripped = reopened.cycle.tour.exercises[0]!;
    if (roundTripped.postActivityRecoverySeconds !== 20 || roundTripped.pauseSeconds !== 15) {
      throw new Error("Attached recovery was not persisted natively.");
    }
    if (listed[0].estimatedDurationSeconds !== 140) {
      throw new Error("Native SQL duration does not match the domain formula.");
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
