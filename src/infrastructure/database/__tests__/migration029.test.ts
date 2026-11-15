import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { DEFAULT_GUIDANCE_EVENTS, type GuidanceSettings } from "@/domain/preferences/guidanceSettings";
import { profileGuidance } from "@/domain/preferences/Profile";
import { createEmptyDraft, createExerciseDraft, toSessionDraft, toStructuredSessionInput } from "@/domain/sessions/SessionDraft";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Migration 029 — guidage sonore par événement (documentation de main `ebe72f76`, RM-087 ; demande de Hermann du
 * 11/11/2026, cahier, constat d) : son et vibration des neuf événements du Profil, réglages validés pour une Séance.
 */
let counter = 0;
const newId = () => `id-${++counter}`;

function draft(guidance?: GuidanceSettings, exerciseName = "Squat", exerciseId = "a") {
  return withLocalMovements({
    ...createEmptyDraft(),
    name: "Guidage",
    exercises: [{ ...createExerciseDraft(exerciseId), name: exerciseName, executionParameters: durationParameters(30, 1, 0) }],
    ...(guidance !== undefined ? { guidance } : {}),
  });
}

describe("migration029 — guidage sonore par événement", () => {
  it("depuis la version 28 : Profil aux valeurs par défaut du design, Séances comme le Profil, version 29", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 28);
    await database.runAsync(
      "INSERT INTO sessions (id, owner_id, name, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at) SELECT 's-old', id, 'Ancienne', 'ACTIVE', 10, 5, 't', 't' FROM users LIMIT 1",
    );
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(29);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 29 });
    expect(await database.getFirstAsync("SELECT guidance_settings FROM sessions WHERE id = 's-old'")).toEqual({ guidance_settings: null });
    const profile = await new SqliteProfileRepository(database).get();
    expect(profile.guidanceEvents).toEqual(DEFAULT_GUIDANCE_EVENTS);
    expect(profile.guidanceEvents.EVERY_MINUTES).toEqual({ sound: "NONE", vibration: false });
    expect(profile.guidanceEvents.CADENCE).toEqual({ sound: "DEFAULT", vibration: false });
  });

  it("Profil : un événement modifié, les huit autres et les annonces inchangés ; relu après réouverture", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    const repository = new SqliteProfileRepository(database);
    await repository.updateGuidanceEvent("HALF_TIME", { sound: "NONE", vibration: true });
    await repository.updateGuidanceEvent("CADENCE", { sound: "DING", vibration: true });
    const reread = await new SqliteProfileRepository(database).get();
    expect(reread.guidanceEvents.HALF_TIME).toEqual({ sound: "NONE", vibration: true });
    expect(reread.guidanceEvents.CADENCE).toEqual({ sound: "DING", vibration: true });
    expect(reread.guidanceEvents.COUNTDOWN).toEqual(DEFAULT_GUIDANCE_EVENTS.COUNTDOWN);
    expect(profileGuidance(reread).announcements).toEqual({ session: true, names: true, phases: true, objective: true, pauses: true, sides: true });
  });

  it("Séance : réglages validés enregistrés, relus, copiés dans l'instantané ; le Profil n'est pas modifié", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    const repository = new SqliteSessionRepository(database, newId, () => "2026-11-11T10:00:00.000Z");
    const profileBefore = await new SqliteProfileRepository(database).get();
    const own: GuidanceSettings = {
      announcements: { session: true, names: true, phases: true, objective: true, pauses: true, sides: false },
      events: { ...DEFAULT_GUIDANCE_EVENTS, HALF_TIME: { sound: "NONE", vibration: true } },
    };
    const input = toStructuredSessionInput(draft(own), newId);
    if (!input.ok) throw new Error("invalid");
    const created = await repository.createStructured(input.value);
    expect(created.guidance).toEqual(own);
    const reread = (await repository.findStructuredById(created.id))!;
    expect(reread.guidance).toEqual(own);
    expect(toSessionDraft(reread).guidance).toEqual(own);
    expect(createSessionSnapshot(reread).guidance).toEqual(own);
    expect(await new SqliteProfileRepository(database).get()).toEqual(profileBefore);

    const other = toStructuredSessionInput(draft(undefined, "Fente", "b"), newId);
    if (!other.ok) throw new Error("invalid");
    const b = await repository.createStructured(other.value);
    expect((await repository.findStructuredById(b.id))!.guidance).toBeUndefined();
  });
});
