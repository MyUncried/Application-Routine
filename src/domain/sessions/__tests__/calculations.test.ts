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
import { DEFAULT_SESSION_COLOR, type Activity, type Session } from "@/domain/sessions/Session";

describe("computeEstimatedDurationSeconds (Facts only, no SQL/infra type)", () => {
  it("sums initial countdown, activity duration and final phase", () => {
    const facts: EstimatedDurationFacts = {
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      activityDurationSeconds: 30,
      isLowerBoundEstimate: false,
    };
    expect(computeEstimatedDurationSeconds(facts)).toBe(45);
  });

  it("supports an instantaneous initial countdown and final phase (0 s)", () => {
    expect(
      computeEstimatedDurationSeconds({
        initialCountdownSeconds: 0,
        finalPhaseSeconds: 0,
        activityDurationSeconds: 12,
        isLowerBoundEstimate: false,
      }),
    ).toBe(12);
  });
});

describe("computeActivityCount / computeTotalActivitiesToExecute (Facts only)", () => {
  it("returns the composition activity count as-is", () => {
    const facts: ActivityCountFacts = { compositionActivityCount: 1, tourRepeatCount: 1 };
    expect(computeActivityCount(facts)).toBe(1);
  });

  it("returns a composition activity count greater than one for several Activities (T01-S09)", () => {
    const facts: ActivityCountFacts = { compositionActivityCount: 3, tourRepeatCount: 1 };
    expect(computeActivityCount(facts)).toBe(3);
  });

  it("multiplies the composition count by the tour repeat count for the total to execute", () => {
    const facts: ActivityCountFacts = { compositionActivityCount: 1, tourRepeatCount: 1 };
    expect(computeTotalActivitiesToExecute(facts)).toBe(1);
  });
});

describe("toEstimatedDurationFacts / toActivityCountFacts (projection from a Session aggregate)", () => {
  function anActivity(overrides: Partial<Activity> = {}): Activity {
    return {
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
      bodyZoneIds: [],
      ...overrides,
    };
  }

  function aSession(exercises: readonly Activity[] = [anActivity()]): Session {
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
          exercises,
        },
      },
      categories: [],
    };
  }

  it("projects a Session aggregate to EstimatedDurationFacts without any extra query", () => {
    expect(toEstimatedDurationFacts(aSession())).toEqual({
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      activityDurationSeconds: 30,
      isLowerBoundEstimate: false,
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

  it("sums seriesCount × duration + seriesCount × pause across several DURATION Activities (T01-S09)", () => {
    const session = aSession([
      anActivity({ id: "a1", durationSeconds: 30, seriesCount: 2, pauseSeconds: 5 }),
      anActivity({ id: "a2", name: "Squats", durationSeconds: 20, seriesCount: 1, pauseSeconds: 0 }),
    ]);
    // a1: 2×30 + 2×5 = 70 ; a2: 1×20 + 0 = 20 ; total 90.
    expect(toEstimatedDurationFacts(session)).toEqual({
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      activityDurationSeconds: 90,
      isLowerBoundEstimate: false,
    });
    expect(toActivityCountFacts(session)).toEqual({ compositionActivityCount: 2, tourRepeatCount: 1 });
  });

  it("excludes the Exercise's own duration for a REPETITIONS Activity but still counts its pause, and flags the estimate as a lower bound (RM-072)", () => {
    const session = aSession([
      anActivity({
        id: "a1",
        executionMode: "REPETITIONS",
        durationSeconds: null,
        repetitionCount: 12,
        seriesCount: 3,
        pauseSeconds: 10,
      }),
    ]);
    // Repetitions: no nominal duration, only 3×10 = 30 of pause.
    expect(toEstimatedDurationFacts(session)).toEqual({
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      activityDurationSeconds: 30,
      isLowerBoundEstimate: true,
    });
  });

  it("flags the estimate as a lower bound as soon as ANY Activity is in REPETITIONS mode, even alongside DURATION Activities", () => {
    const session = aSession([
      anActivity({ id: "a1", durationSeconds: 30 }),
      anActivity({
        id: "a2",
        executionMode: "REPETITIONS",
        durationSeconds: null,
        repetitionCount: 12,
      }),
    ]);
    expect(toEstimatedDurationFacts(session).isLowerBoundEstimate).toBe(true);
  });

  it("treats a TO_FAILURE Activity like REPETITIONS: no nominal duration, still counts its pause, flags a lower bound (D-111/D-112)", () => {
    const session = aSession([
      anActivity({
        id: "a1",
        executionMode: "TO_FAILURE",
        durationSeconds: null,
        repetitionCount: null,
        seriesCount: 3,
        pauseSeconds: 10,
      }),
    ]);
    expect(toEstimatedDurationFacts(session)).toEqual({
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      activityDurationSeconds: 30,
      isLowerBoundEstimate: true,
    });
  });

  it("counts a RECOVERY Activity's own duration once, without series multiplication nor pause (D-041)", () => {
    const session = aSession([
      anActivity({ id: "a1", durationSeconds: 30, seriesCount: 2, pauseSeconds: 5 }),
      anActivity({
        id: "rec",
        type: "RECOVERY",
        name: "Récupération",
        executionMode: null,
        durationSeconds: 20,
        repetitionCount: null,
        seriesCount: null,
        pauseSeconds: 0,
        bodyZoneIds: [],
      }),
    ]);
    // a1: 2×30 + 2×5 = 70 ; recovery: 20 ; total 90.
    expect(toEstimatedDurationFacts(session)).toMatchObject({
      activityDurationSeconds: 90,
      isLowerBoundEstimate: false,
    });
  });
});
