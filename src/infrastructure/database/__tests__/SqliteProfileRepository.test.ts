import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

describe("SqliteProfileRepository", () => {
  let database: NodeSqliteDatabase;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
  });

  afterEach(() => {
    database.close();
  });

  it("returns the singleton Profile with the four normative defaults (plan §3.2, decision D-240)", async () => {
    const repository = new SqliteProfileRepository(database);
    const profile = await repository.get();

    expect(profile.sideChangeRecoverySecondsDefault).toBe(10);
    expect(profile.postActivityRecoverySecondsDefault).toBe(30);
    expect(profile.exerciseCountdownSecondsDefault).toBe(10);
    expect(profile.exerciseEndSecondsDefault).toBe(5);
  });

  it("never fabricates a second row — the singleton stays unique", async () => {
    const repository = new SqliteProfileRepository(database);
    await repository.get();
    await repository.get();

    const count = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM profiles",
    );
    expect(count?.count).toBe(1);
  });

  it("returns the two new normative Session defaults (10 s / 5 s, D-004) and the four preferences (V2-PRE-2, migration008)", async () => {
    const repository = new SqliteProfileRepository(database);
    const profile = await repository.get();

    expect(profile.sessionInitialCountdownSecondsDefault).toBe(10);
    expect(profile.sessionFinalPhaseSecondsDefault).toBe(5);
    expect(profile.soundsEnabled).toBe(true);
    expect(profile.voiceAnnouncementsEnabled).toBe(true);
    expect(profile.vibrationEnabled).toBe(true);
    expect(profile.notificationsEnabled).toBe(false);
    expect(profile.displayName).toBeNull();
    expect(profile.photoUri).toBeNull();
    expect(profile.silhouette).toBeNull();
  });

  describe("updateDefault", () => {
    it("updates a single duration setting, leaving the other five unchanged", async () => {
      const repository = new SqliteProfileRepository(database);
      const updated = await repository.updateDefault("exerciseCountdownSecondsDefault", 20);

      expect(updated.exerciseCountdownSecondsDefault).toBe(20);
      expect(updated.exerciseEndSecondsDefault).toBe(5);
      expect(updated.sideChangeRecoverySecondsDefault).toBe(10);
      expect(updated.postActivityRecoverySecondsDefault).toBe(30);
      expect(updated.sessionInitialCountdownSecondsDefault).toBe(10);
      expect(updated.sessionFinalPhaseSecondsDefault).toBe(5);
    });

    it("persists the change — re-reading the Profile reflects it", async () => {
      const repository = new SqliteProfileRepository(database);
      await repository.updateDefault("sessionFinalPhaseSecondsDefault", 30);

      const reread = await repository.get();
      expect(reread.sessionFinalPhaseSecondsDefault).toBe(30);
    });
  });

  describe("updatePreference", () => {
    it("toggles a single preference, leaving the other three unchanged", async () => {
      const repository = new SqliteProfileRepository(database);
      const updated = await repository.updatePreference("notificationsEnabled", true);

      expect(updated.notificationsEnabled).toBe(true);
      expect(updated.soundsEnabled).toBe(true);
      expect(updated.voiceAnnouncementsEnabled).toBe(true);
      expect(updated.vibrationEnabled).toBe(true);
    });

    it("persists the change — re-reading the Profile reflects it", async () => {
      const repository = new SqliteProfileRepository(database);
      await repository.updatePreference("soundsEnabled", false);

      const reread = await repository.get();
      expect(reread.soundsEnabled).toBe(false);
    });
  });

  describe("updateIdentity", () => {
    it("persists name, photo and silhouette together, atomically", async () => {
      const repository = new SqliteProfileRepository(database);
      const updated = await repository.updateIdentity({
        displayName: "Jean Dupont",
        photoUri: "file:///profile-photo.jpg",
        silhouette: "femme",
      });

      expect(updated.displayName).toBe("Jean Dupont");
      expect(updated.photoUri).toBe("file:///profile-photo.jpg");
      expect(updated.silhouette).toBe("femme");
    });

    it("persists a null photoUri/silhouette (never chosen)", async () => {
      const repository = new SqliteProfileRepository(database);
      const updated = await repository.updateIdentity({
        displayName: "Jean Dupont",
        photoUri: null,
        silhouette: null,
      });

      expect(updated.photoUri).toBeNull();
      expect(updated.silhouette).toBeNull();
    });

    it("never changes the six duration defaults or the four preferences", async () => {
      const repository = new SqliteProfileRepository(database);
      await repository.updateIdentity({ displayName: "Jean", photoUri: null, silhouette: "homme" });
      const reread = await repository.get();

      expect(reread.sideChangeRecoverySecondsDefault).toBe(10);
      expect(reread.notificationsEnabled).toBe(false);
    });
  });
});
