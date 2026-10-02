import { describe, expect, it } from "@jest/globals";

import {
  createDefaultProfile,
  DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
  DEFAULT_EXERCISE_END_SECONDS,
  DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS,
  DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
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
});
