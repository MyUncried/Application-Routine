import { describe, expect, it } from "@jest/globals";

import {
  computeActivityCount,
  computeEstimatedDurationSeconds,
  computeTotalActivitiesToExecute,
  toActivityCountFacts,
  toEstimatedDurationFacts,
  type ActivityCountFacts,
  type EstimatedDurationFacts,
} from "@/domain/sessions/calculations";
import { DEFAULT_SESSION_COLOR, type Session } from "@/domain/sessions/Session";

describe("computeEstimatedDurationSeconds (Facts only, no SQL/infra type)", () => {
  it("sums initial countdown, activity duration and final phase", () => {
    const facts: EstimatedDurationFacts = {
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      activityDurationSeconds: 30,
    };
    expect(computeEstimatedDurationSeconds(facts)).toBe(45);
  });

  it("supports an instantaneous initial countdown and final phase (0 s)", () => {
    expect(
      computeEstimatedDurationSeconds({
        initialCountdownSeconds: 0,
        finalPhaseSeconds: 0,
        activityDurationSeconds: 12,
      }),
    ).toBe(12);
  });

  it("matches the value produced today by SqliteSessionRepository.listActive for the same figures", () => {
    // Same values as the repository's summary test fixture (10 / 30 / 5 => 45).
    const facts: EstimatedDurationFacts = {
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      activityDurationSeconds: 30,
    };
    expect(computeEstimatedDurationSeconds(facts)).toBe(45);
  });
});

describe("computeActivityCount / computeTotalActivitiesToExecute (Facts only)", () => {
  it("returns the composition activity count as-is for this tranche (always 1)", () => {
    const facts: ActivityCountFacts = { compositionActivityCount: 1, tourRepeatCount: 1 };
    expect(computeActivityCount(facts)).toBe(1);
  });

  it("multiplies the composition count by the tour repeat count for the total to execute", () => {
    const facts: ActivityCountFacts = { compositionActivityCount: 1, tourRepeatCount: 1 };
    expect(computeTotalActivitiesToExecute(facts)).toBe(1);
  });
});

describe("toEstimatedDurationFacts / toActivityCountFacts (projection from a Session aggregate)", () => {
  function aSession(): Session {
    return {
      id: "session-1",
      ownerId: "usr_test",
      name: "Séance simple",
      color: DEFAULT_SESSION_COLOR,
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      cycle: {
        id: "cycle-1",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          exercise: {
            id: "activity-1",
            type: "EXERCISE",
            executionMode: "DURATION",
            structuralPosition: "IN_TOUR",
            position: 0,
            name: "Gainage",
            durationSeconds: 30,
            repetitionCount: null,
            seriesCount: 1,
            pauseSeconds: 0,
            instruction: null,
          },
        },
      },
    };
  }

  it("projects a Session aggregate to EstimatedDurationFacts without any extra query", () => {
    expect(toEstimatedDurationFacts(aSession())).toEqual({
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      activityDurationSeconds: 30,
    });
  });

  it("projects a Session aggregate to ActivityCountFacts without any extra query", () => {
    expect(toActivityCountFacts(aSession())).toEqual({
      compositionActivityCount: 1,
      tourRepeatCount: 1,
    });
  });

  it("chains the projection into the calculation and matches the aggregate's own figures", () => {
    const session = aSession();
    expect(computeEstimatedDurationSeconds(toEstimatedDurationFacts(session))).toBe(45);
    expect(computeActivityCount(toActivityCountFacts(session))).toBe(1);
  });
});
