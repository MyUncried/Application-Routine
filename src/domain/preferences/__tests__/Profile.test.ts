import { describe, expect, it } from "@jest/globals";

import {
  createDefaultProfile,
  DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
  DEFAULT_EXERCISE_END_SECONDS,
  DEFAULT_NOTIFICATIONS_ENABLED,
  DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS,
  DEFAULT_SESSION_FINAL_PHASE_SECONDS,
  DEFAULT_SESSION_INITIAL_COUNTDOWN_SECONDS,
  DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
  DEFAULT_SOUNDS_ENABLED,
  DEFAULT_VIBRATION_ENABLED,
  DEFAULT_VOICE_ANNOUNCEMENTS_ENABLED,
  isGridBasedSetting,
  nextGridValue,
  previousGridValue,
  profileDurationBounds,
  resolveSilhouette,
  validateDisplayName,
} from "../Profile";

describe("createDefaultProfile", () => {
  it("uses the normative default side-change recovery of 10 seconds", () => {
    const profile = createDefaultProfile("singleton", "2026-01-01T00:00:00.000Z");
    expect(profile.sideChangeRecoverySecondsDefault).toBe(10);
    expect(DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS).toBe(10);
  });

  it("uses the normative default post-activity recovery of 30 seconds", () => {
    const profile = createDefaultProfile("singleton", "2026-01-01T00:00:00.000Z");
    expect(profile.postActivityRecoverySecondsDefault).toBe(30);
    expect(DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS).toBe(30);
  });

  it("uses the D-240 normative default Exercise countdown of 10 seconds", () => {
    const profile = createDefaultProfile("singleton", "2026-01-01T00:00:00.000Z");
    expect(profile.exerciseCountdownSecondsDefault).toBe(10);
    expect(DEFAULT_EXERCISE_COUNTDOWN_SECONDS).toBe(10);
  });

  it("uses the D-240 normative default Exercise end of 5 seconds", () => {
    const profile = createDefaultProfile("singleton", "2026-01-01T00:00:00.000Z");
    expect(profile.exerciseEndSecondsDefault).toBe(5);
    expect(DEFAULT_EXERCISE_END_SECONDS).toBe(5);
  });

  it("carries the provided identity and timestamp without alteration", () => {
    const profile = createDefaultProfile("singleton", "2026-01-01T00:00:00.000Z");
    expect(profile.id).toBe("singleton");
    expect(profile.updatedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("uses the two new normative Session defaults (D-004) — 10 s / 5 s (plan §7, CE-UI-07 L2519)", () => {
    const profile = createDefaultProfile("singleton", "2026-01-01T00:00:00.000Z");
    expect(profile.sessionInitialCountdownSecondsDefault).toBe(10);
    expect(profile.sessionFinalPhaseSecondsDefault).toBe(5);
    expect(DEFAULT_SESSION_INITIAL_COUNTDOWN_SECONDS).toBe(10);
    expect(DEFAULT_SESSION_FINAL_PHASE_SECONDS).toBe(5);
  });

  it("defaults Sons/Annonces vocales/Vibration to enabled and Notifications to disabled (CE-UI-07 L2515/L2519/L2573)", () => {
    const profile = createDefaultProfile("singleton", "2026-01-01T00:00:00.000Z");
    expect(profile.soundsEnabled).toBe(true);
    expect(profile.voiceAnnouncementsEnabled).toBe(true);
    expect(profile.vibrationEnabled).toBe(true);
    expect(profile.notificationsEnabled).toBe(false);
    expect(DEFAULT_SOUNDS_ENABLED).toBe(true);
    expect(DEFAULT_VOICE_ANNOUNCEMENTS_ENABLED).toBe(true);
    expect(DEFAULT_VIBRATION_ENABLED).toBe(true);
    expect(DEFAULT_NOTIFICATIONS_ENABLED).toBe(false);
  });

  it("has no identity (null displayName/photoUri/silhouette) before Modifier le profil is ever used (T8)", () => {
    const profile = createDefaultProfile("singleton", "2026-01-01T00:00:00.000Z");
    expect(profile.displayName).toBeNull();
    expect(profile.photoUri).toBeNull();
    expect(profile.silhouette).toBeNull();
  });
});

describe("profileDurationBounds", () => {
  it("bounds Session defaults (Compte à rebours initial, Fin de séance) to 0..60 s (D-265)", () => {
    expect(profileDurationBounds("sessionInitialCountdownSecondsDefault")).toEqual({ min: 0, max: 60 });
    expect(profileDurationBounds("sessionFinalPhaseSecondsDefault")).toEqual({ min: 0, max: 60 });
  });

  it("bounds Exercise phases (Compte à rebours d'exercice, Fin d'exercice) to 0..60 s (D1)", () => {
    expect(profileDurationBounds("exerciseCountdownSecondsDefault")).toEqual({ min: 0, max: 60 });
    expect(profileDurationBounds("exerciseEndSecondsDefault")).toEqual({ min: 0, max: 60 });
  });

  it("bounds the pauses (Pause entre les côtés, Récupération après exercice) to 0..300 s (T2)", () => {
    expect(profileDurationBounds("sideChangeRecoverySecondsDefault")).toEqual({ min: 0, max: 300 });
    expect(profileDurationBounds("postActivityRecoverySecondsDefault")).toEqual({ min: 0, max: 300 });
  });
});

describe("isGridBasedSetting", () => {
  it("is true only for the two pauses, never for the four phases", () => {
    expect(isGridBasedSetting("sideChangeRecoverySecondsDefault")).toBe(true);
    expect(isGridBasedSetting("postActivityRecoverySecondsDefault")).toBe(true);
    expect(isGridBasedSetting("sessionInitialCountdownSecondsDefault")).toBe(false);
    expect(isGridBasedSetting("sessionFinalPhaseSecondsDefault")).toBe(false);
    expect(isGridBasedSetting("exerciseCountdownSecondsDefault")).toBe(false);
    expect(isGridBasedSetting("exerciseEndSecondsDefault")).toBe(false);
  });
});

describe("nextGridValue / previousGridValue (v12 L93-100)", () => {
  it("steps by 1 s up to 5 s", () => {
    expect(nextGridValue(0)).toBe(1);
    expect(nextGridValue(4)).toBe(5);
    expect(previousGridValue(5)).toBe(4);
    expect(previousGridValue(1)).toBe(0);
  });

  it("steps by 5 s from 5 s to 120 s", () => {
    expect(nextGridValue(5)).toBe(10);
    expect(nextGridValue(115)).toBe(120);
    expect(previousGridValue(10)).toBe(5);
    expect(previousGridValue(120)).toBe(115);
  });

  it("steps by 30 s from 120 s to 300 s", () => {
    expect(nextGridValue(120)).toBe(150);
    expect(nextGridValue(270)).toBe(300);
    expect(previousGridValue(150)).toBe(120);
    expect(previousGridValue(300)).toBe(270);
  });

  it("never rounds a stored off-grid value when reading it — + moves to the strictly higher grid value, − to the strictly lower one (T3)", () => {
    expect(nextGridValue(7)).toBe(10);
    expect(previousGridValue(7)).toBe(5);
    expect(nextGridValue(133)).toBe(150);
    expect(previousGridValue(133)).toBe(120);
  });

  it("clamps at the grid boundaries (0 and 300)", () => {
    expect(previousGridValue(0)).toBe(0);
    expect(nextGridValue(300)).toBe(300);
  });
});

describe("validateDisplayName (T8, CE-UI-01 L2021/L2033)", () => {
  it("rejects an empty name as REQUIRED", () => {
    expect(validateDisplayName("")).toEqual({ ok: false, code: "REQUIRED" });
    expect(validateDisplayName("   ")).toEqual({ ok: false, code: "REQUIRED" });
  });

  it("accepts a name of exactly 1 code point", () => {
    expect(validateDisplayName("A")).toEqual({ ok: true, value: "A" });
  });

  it("accepts a name of exactly 80 code points", () => {
    const name = "A".repeat(80);
    expect(validateDisplayName(name)).toEqual({ ok: true, value: name });
  });

  it("rejects a name of 81 code points as TOO_LONG", () => {
    const name = "A".repeat(81);
    expect(validateDisplayName(name)).toEqual({ ok: false, code: "TOO_LONG" });
  });

  it("trims and collapses internal whitespace, preserving case and diacritics", () => {
    expect(validateDisplayName("  Jean   Dupont  ")).toEqual({ ok: true, value: "Jean Dupont" });
  });
});

describe("resolveSilhouette (T13, CE-UI-01 L1985/L2029)", () => {
  it("resolves an absent silhouette to homme", () => {
    expect(resolveSilhouette(null)).toBe("homme");
  });

  it("resolves a chosen silhouette unchanged", () => {
    expect(resolveSilhouette("femme")).toBe("femme");
    expect(resolveSilhouette("homme")).toBe("homme");
  });
});
