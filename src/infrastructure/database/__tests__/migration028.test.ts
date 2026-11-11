import { describe, expect, it } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft, toSessionDraft, toStructuredSessionInput } from "@/domain/sessions/SessionDraft";
import { createSessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
import { DATABASE_VERSION } from "@/infrastructure/database/constants";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * Fin de PRE-10 — migration 028 : guidage propre à une Séance (spec `spec-guidage-reglages` §3.2), trois colonnes
 * nullables ; `NULL` = comme le Profil.
 */
let counter = 0;
const newId = () => `id-${++counter}`;

function draft(guidance?: { soundsEnabled: boolean | null; voiceEnabled: boolean | null; announceObjective: boolean | null }) {
  return withLocalMovements({
    ...createEmptyDraft(),
    name: "Guidage",
    exercises: [{ ...createExerciseDraft("a"), name: "Squat", executionParameters: durationParameters(30, 1, 0) }],
    ...(guidance !== undefined ? { guidance } : {}),
  });
}

describe("migration028 — guidage propre à une Séance", () => {
  it("depuis la version 27 : Séance existante sans réglage propre (comme le Profil), version 28", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database, undefined, 27);
    const repository = new SqliteSessionRepository(database, newId, () => "2026-11-11T10:00:00.000Z");
    const input = toStructuredSessionInput(draft(), newId);
    if (!input.ok) throw new Error("invalid");
    const created = await repository.createStructured(input.value).catch(() => null);
    // À la version 27 la colonne n'existe pas encore : la Séance est écrite par SQL brut.
    expect(created).toBeNull();
    await database.runAsync(
      "INSERT INTO sessions (id, owner_id, name, status, initial_countdown_seconds, final_phase_seconds, created_at, updated_at) SELECT 's-old', id, 'Ancienne', 'ACTIVE', 10, 5, 't', 't' FROM users LIMIT 1",
    );
    await migrateDatabase(database);
    expect(DATABASE_VERSION).toBe(28);
    expect(await database.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 28 });
    expect(
      await database.getFirstAsync("SELECT guidance_sounds_enabled, guidance_voice_enabled, guidance_announce_objective FROM sessions WHERE id = 's-old'"),
    ).toEqual({ guidance_sounds_enabled: null, guidance_voice_enabled: null, guidance_announce_objective: null });
    await expect(database.runAsync("UPDATE sessions SET guidance_sounds_enabled = 2 WHERE id = 's-old'")).rejects.toThrow();
  });

  it("aller-retour : réglages propres enregistrés, relus, modifiés, remis « comme le Profil » ; copiés dans l'instantané", async () => {
    const database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    const repository = new SqliteSessionRepository(database, newId, () => "2026-11-11T10:00:00.000Z");
    const own = { soundsEnabled: false, voiceEnabled: null, announceObjective: true };
    const input = toStructuredSessionInput(draft(own), newId);
    if (!input.ok) throw new Error("invalid");
    const created = await repository.createStructured(input.value);
    expect(created.guidance).toEqual(own);
    const reread = (await repository.findStructuredById(created.id))!;
    expect(reread.guidance).toEqual(own);
    expect(toSessionDraft(reread).guidance).toEqual(own);
    expect(createSessionSnapshot(reread).guidance).toEqual(own);

    const back = toStructuredSessionInput({ ...toSessionDraft(reread), guidance: { soundsEnabled: null, voiceEnabled: null, announceObjective: null } }, newId);
    if (!back.ok) throw new Error("invalid");
    const updated = await repository.updateStructured(created.id, { ...back.value, persistedActivityIds: ["a"] });
    expect(updated.status).toBe("UPDATED");
    const profile = (await repository.findStructuredById(created.id))!;
    expect(profile.guidance).toBeUndefined();
    expect(toSessionDraft(profile).guidance).toBeUndefined();
    expect(createSessionSnapshot(profile).guidance).toBeUndefined();
  });
});
