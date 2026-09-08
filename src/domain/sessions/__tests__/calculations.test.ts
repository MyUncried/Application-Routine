import { describe, expect, it } from "@jest/globals";

import {
  computeActivityCount,
  computeActivityDurationSeconds,
  computeEstimatedDurationSeconds,
  computeTotalActivitiesToExecute,
  isLowerBoundExecutionMode,
  toActivityCountFacts,
  toEstimatedDurationFacts,
  type ActivityCountFacts,
  type EstimatedDurationFacts,
} from "@/domain/sessions/calculations";
import { DEFAULT_SESSION_COLOR, type Activity, type Session } from "@/domain/sessions/Session";

/**
 * T02-S01 (CE-T02-01 « Calculs », AC-10/AC-11, et clarifications
 * autoritatives du verdict `PLAN_REVIEW_APPROVED` de la tranche) : les Facts
 * décrivent désormais les TROIS zones structurelles, seule la zone `IN_TOUR`
 * étant multipliée par `tourRepeatCount` ; le Compte à rebours initial et la
 * Fin de séance sont exclus de la durée affichée et ne figurent donc plus
 * dans ces Facts.
 */
describe("computeEstimatedDurationSeconds (Facts only, no SQL/infra type)", () => {
  it("counts the out-of-Tour zones once and multiplies only the Tour zone by the tour repeat count", () => {
    const facts: EstimatedDurationFacts = {
      beforeTourDurationSeconds: 10,
      inTourDurationSeconds: 20,
      afterTourDurationSeconds: 5,
      tourRepeatCount: 3,
      isLowerBoundEstimate: false,
    };
    expect(computeEstimatedDurationSeconds(facts)).toBe(75);
  });

  it("is unchanged by the tour repeat count when the Tour zone is empty", () => {
    const facts: EstimatedDurationFacts = {
      beforeTourDurationSeconds: 30,
      inTourDurationSeconds: 0,
      afterTourDurationSeconds: 12,
      tourRepeatCount: 99,
      isLowerBoundEstimate: false,
    };
    expect(computeEstimatedDurationSeconds(facts)).toBe(42);
  });

  it("reproduces the T01 total exactly for a single-Tour Session (non-regression)", () => {
    expect(
      computeEstimatedDurationSeconds({
        beforeTourDurationSeconds: 0,
        inTourDurationSeconds: 30,
        afterTourDurationSeconds: 0,
        tourRepeatCount: 1,
        isLowerBoundEstimate: false,
      }),
    ).toBe(30);
  });
});

describe("computeActivityDurationSeconds (une seule Activité)", () => {
  it("multiplies both the target duration and the pause by the series count (RM-036/RM-037)", () => {
    expect(
      computeActivityDurationSeconds({
        type: "EXERCISE",
        executionMode: "DURATION",
        durationSeconds: 30,
        seriesCount: 2,
        pauseSeconds: 5,
      }),
    ).toBe(70);
  });

  it("gives no conventional duration to REPETITIONS nor TO_FAILURE, but still counts their pauses (RM-072/D-112)", () => {
    for (const mode of ["REPETITIONS", "TO_FAILURE"] as const) {
      expect(
        computeActivityDurationSeconds({
          type: "EXERCISE",
          executionMode: mode,
          durationSeconds: null,
          seriesCount: 3,
          pauseSeconds: 10,
        }),
      ).toBe(30);
      expect(isLowerBoundExecutionMode(mode)).toBe(true);
    }
    expect(isLowerBoundExecutionMode("DURATION")).toBe(false);
    expect(isLowerBoundExecutionMode(null)).toBe(false);
  });

  it("counts a RECOVERY's own duration once, without series multiplication nor pause (D-041)", () => {
    expect(
      computeActivityDurationSeconds({
        type: "RECOVERY",
        executionMode: null,
        durationSeconds: 20,
        seriesCount: null,
        pauseSeconds: 0,
      }),
    ).toBe(20);
  });
});

describe("computeActivityCount / computeTotalActivitiesToExecute (Facts only)", () => {
  function facts(overrides: Partial<ActivityCountFacts> = {}): ActivityCountFacts {
    return {
      beforeTourActivityCount: 0,
      inTourActivityCount: 1,
      afterTourActivityCount: 0,
      tourRepeatCount: 1,
      ...overrides,
    };
  }

  it("returns the composition activity count as-is", () => {
    expect(computeActivityCount(facts())).toBe(1);
  });

  it("sums the three zones for the composition count (T02-S01)", () => {
    expect(
      computeActivityCount(
        facts({ beforeTourActivityCount: 1, inTourActivityCount: 3, afterTourActivityCount: 2 }),
      ),
    ).toBe(6);
  });

  it("NEVER multiplies the composition count by the tour repeat count — it is not a number of executions", () => {
    expect(
      computeActivityCount(
        facts({ beforeTourActivityCount: 1, inTourActivityCount: 3, tourRepeatCount: 9 }),
      ),
    ).toBe(4);
  });

  it("multiplies only the Tour zone for the total to execute (RM-075)", () => {
    expect(
      computeTotalActivitiesToExecute(
        facts({
          beforeTourActivityCount: 1,
          inTourActivityCount: 3,
          afterTourActivityCount: 2,
          tourRepeatCount: 4,
        }),
      ),
    ).toBe(15);
    expect(computeTotalActivitiesToExecute(facts())).toBe(1);
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

  function aSession(
    exercises: readonly Activity[] = [anActivity()],
    cycleOverrides: Partial<Session["cycle"]> = {},
  ): Session {
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
        ...cycleOverrides,
      },
      categories: [],
    };
  }

  it("projects a Session aggregate to EstimatedDurationFacts without any extra query", () => {
    expect(toEstimatedDurationFacts(aSession())).toEqual({
      beforeTourDurationSeconds: 0,
      inTourDurationSeconds: 30,
      afterTourDurationSeconds: 0,
      tourRepeatCount: 1,
      isLowerBoundEstimate: false,
    });
  });

  it("projects a Session aggregate to ActivityCountFacts without any extra query", () => {
    expect(toActivityCountFacts(aSession())).toEqual({
      beforeTourActivityCount: 0,
      inTourActivityCount: 1,
      afterTourActivityCount: 0,
      tourRepeatCount: 1,
    });
  });

  it("chains the projection into the calculation and matches the aggregate's own figures", () => {
    const session = aSession();
    expect(computeEstimatedDurationSeconds(toEstimatedDurationFacts(session))).toBe(30);
    expect(computeActivityCount(toActivityCountFacts(session))).toBe(1);
  });

  it("sums seriesCount × duration + seriesCount × pause across several DURATION Activities (T01-S09)", () => {
    const session = aSession([
      anActivity({ id: "a1", durationSeconds: 30, seriesCount: 2, pauseSeconds: 5 }),
      anActivity({ id: "a2", name: "Squats", durationSeconds: 20, seriesCount: 1, pauseSeconds: 0 }),
    ]);
    // a1: 2×30 + 2×5 = 70 ; a2: 1×20 + 0 = 20 ; total 90.
    expect(toEstimatedDurationFacts(session)).toEqual({
      beforeTourDurationSeconds: 0,
      inTourDurationSeconds: 90,
      afterTourDurationSeconds: 0,
      tourRepeatCount: 1,
      isLowerBoundEstimate: false,
    });
    expect(computeActivityCount(toActivityCountFacts(session))).toBe(2);
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
    expect(toEstimatedDurationFacts(session)).toMatchObject({
      inTourDurationSeconds: 30,
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
    expect(toEstimatedDurationFacts(session)).toMatchObject({
      inTourDurationSeconds: 30,
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
      inTourDurationSeconds: 90,
      isLowerBoundEstimate: false,
    });
  });

  /**
   * T02-S01 (AC-10) : les Activités hors Tour ne sont jamais développées par
   * `tourRepeatCount`, celles du Tour le sont toujours — et le NOMBRE
   * d'Activités composées reste celui des Activités réelles.
   */
  it("projects the three structural zones separately, and only the Tour zone is repeated", () => {
    const session = aSession(
      [anActivity({ id: "core", durationSeconds: 20, structuralPosition: "IN_TOUR" })],
      {
        beforeTour: [
          anActivity({ id: "warmup", durationSeconds: 10, structuralPosition: "BEFORE_TOUR" }),
        ],
        afterTour: [
          anActivity({ id: "stretch", durationSeconds: 5, structuralPosition: "AFTER_TOUR" }),
        ],
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 3,
          exercises: [anActivity({ id: "core", durationSeconds: 20 })],
        },
      },
    );

    expect(toEstimatedDurationFacts(session)).toEqual({
      beforeTourDurationSeconds: 10,
      inTourDurationSeconds: 20,
      afterTourDurationSeconds: 5,
      tourRepeatCount: 3,
      isLowerBoundEstimate: false,
    });
    expect(computeEstimatedDurationSeconds(toEstimatedDurationFacts(session))).toBe(75);

    expect(toActivityCountFacts(session)).toEqual({
      beforeTourActivityCount: 1,
      inTourActivityCount: 1,
      afterTourActivityCount: 1,
      tourRepeatCount: 3,
    });
    expect(computeActivityCount(toActivityCountFacts(session))).toBe(3);
    expect(computeTotalActivitiesToExecute(toActivityCountFacts(session))).toBe(5);
  });

  it("flags a lower bound raised by an out-of-Tour Activity too (D-112)", () => {
    const session = aSession([anActivity({ id: "core" })], {
      afterTour: [
        anActivity({
          id: "finisher",
          structuralPosition: "AFTER_TOUR",
          executionMode: "TO_FAILURE",
          durationSeconds: null,
          repetitionCount: null,
        }),
      ],
    });
    expect(toEstimatedDurationFacts(session).isLowerBoundEstimate).toBe(true);
  });
});
