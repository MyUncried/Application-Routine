import { describe, expect, it, jest } from "@jest/globals";

import { createDefaultProfile, type Profile } from "@/domain/preferences/Profile";
import type { ProfileRepository } from "@/domain/preferences/ProfileRepository";
import { ProfileService } from "../ProfileService";

function aProfile(overrides: Partial<Profile> = {}): Profile {
  return { ...createDefaultProfile("singleton", "2026-01-01T00:00:00.000Z"), ...overrides };
}

class FakeProfileRepository implements ProfileRepository {
  profile: Profile = aProfile();
  get = jest.fn(async () => this.profile);
  updateDefault = jest.fn(async (setting: Parameters<ProfileRepository["updateDefault"]>[0], value: number) => {
    this.profile = { ...this.profile, [setting]: value };
    return this.profile;
  });
  updatePreference = jest.fn(
    async (preference: Parameters<ProfileRepository["updatePreference"]>[0], value: boolean) => {
      this.profile = { ...this.profile, [preference]: value };
      return this.profile;
    },
  );
  updateIdentity = jest.fn(async (input: Parameters<ProfileRepository["updateIdentity"]>[0]) => {
    this.profile = { ...this.profile, ...input };
    return this.profile;
  });
}

describe("ProfileService.getProfile", () => {
  it("delegates straight to the Repository", async () => {
    const repository = new FakeProfileRepository();
    const service = new ProfileService(repository);
    const profile = await service.getProfile();
    expect(profile).toBe(repository.profile);
  });
});

describe("ProfileService.setDefault (bounds enforcement, T1/T2/D1/D-089)", () => {
  it("passes a within-bounds value through unchanged", async () => {
    const repository = new FakeProfileRepository();
    const service = new ProfileService(repository);
    await service.setDefault("exerciseCountdownSecondsDefault", 20);
    expect(repository.updateDefault).toHaveBeenCalledWith("exerciseCountdownSecondsDefault", 20);
  });

  it("clamps a value above the upper bound (Exercise phases, 0..60 s)", async () => {
    const repository = new FakeProfileRepository();
    const service = new ProfileService(repository);
    await service.setDefault("exerciseEndSecondsDefault", 999);
    expect(repository.updateDefault).toHaveBeenCalledWith("exerciseEndSecondsDefault", 60);
  });

  it("clamps a value below the lower bound to 0", async () => {
    const repository = new FakeProfileRepository();
    const service = new ProfileService(repository);
    await service.setDefault("sessionInitialCountdownSecondsDefault", -5);
    expect(repository.updateDefault).toHaveBeenCalledWith("sessionInitialCountdownSecondsDefault", 0);
  });

  it("clamps a value above the upper bound (Session defaults, 0..60 s, D-265)", async () => {
    const repository = new FakeProfileRepository();
    const service = new ProfileService(repository);
    await service.setDefault("sessionFinalPhaseSecondsDefault", 9999);
    expect(repository.updateDefault).toHaveBeenCalledWith("sessionFinalPhaseSecondsDefault", 60);
  });

  it("clamps a pause value above the upper bound (0..300 s)", async () => {
    const repository = new FakeProfileRepository();
    const service = new ProfileService(repository);
    await service.setDefault("postActivityRecoverySecondsDefault", 400);
    expect(repository.updateDefault).toHaveBeenCalledWith("postActivityRecoverySecondsDefault", 300);
  });
});

describe("ProfileService.setPreference", () => {
  it("delegates straight to the Repository", async () => {
    const repository = new FakeProfileRepository();
    const service = new ProfileService(repository);
    await service.setPreference("notificationsEnabled", true);
    expect(repository.updatePreference).toHaveBeenCalledWith("notificationsEnabled", true);
  });
});

describe("ProfileService.saveIdentity (T8)", () => {
  it("rejects an empty display name without attempting any write", async () => {
    const repository = new FakeProfileRepository();
    const service = new ProfileService(repository);
    const result = await service.saveIdentity({ displayName: "", photoUri: null, silhouette: null });

    expect(result).toEqual({ ok: false, code: "REQUIRED" });
    expect(repository.updateIdentity).not.toHaveBeenCalled();
  });

  it("rejects a display name longer than 80 code points without attempting any write", async () => {
    const repository = new FakeProfileRepository();
    const service = new ProfileService(repository);
    const result = await service.saveIdentity({
      displayName: "A".repeat(81),
      photoUri: null,
      silhouette: null,
    });

    expect(result).toEqual({ ok: false, code: "TOO_LONG" });
    expect(repository.updateIdentity).not.toHaveBeenCalled();
  });

  it("persists name, photo and silhouette together on success", async () => {
    const repository = new FakeProfileRepository();
    const service = new ProfileService(repository);
    const result = await service.saveIdentity({
      displayName: "  Jean   Dupont  ",
      photoUri: "file:///profile-photo.jpg",
      silhouette: "femme",
    });

    expect(result.ok).toBe(true);
    expect(repository.updateIdentity).toHaveBeenCalledWith({
      displayName: "Jean Dupont",
      photoUri: "file:///profile-photo.jpg",
      silhouette: "femme",
    });
  });
});
