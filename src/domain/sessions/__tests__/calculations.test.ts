import { describe, expect, it } from "@jest/globals";

import {
  applyTargetTotalDuration,
  computeActivityCount,
  computeActivityDurationSeconds,
  computeEstimatedDurationSeconds,
  computePauseOccurrences,
  computeSeriesCountForTotalDuration,
  computeTotalActivitiesToExecute,
  computeTotalDurationSeconds,
  computeZoneDurationFacts,
  isLowerBoundExecutionMode,
  SERIES_COUNT_MAX,
  SERIES_COUNT_MIN,
  toActivityCountFacts,
  toEstimatedDurationFacts,
  type ActivityCountFacts,
  type ActivityDurationFacts,
  type EstimatedDurationFacts,
  type TotalDurationFacts,
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

/**
 * T02-S02 (RM-129) : la Pause n'est développée que `max(C − 1, 0)` fois — une
 * Pause ne s'exécute qu'ENTRE deux Séries, jamais après la dernière. Les
 * attendus de ce bloc, écrits sous l'ancienne formule `C × B`, sont donc
 * recalculés ; les écarts constatés sont exactement une Pause de trop dans
 * chaque cas.
 */
describe("computePauseOccurrences (RM-129)", () => {
  it("never counts a pause after the last series", () => {
    expect(computePauseOccurrences(3)).toBe(2);
    expect(computePauseOccurrences(2)).toBe(1);
  });

  it("returns zero for a single series, zero series, or an absent series count", () => {
    expect(computePauseOccurrences(1)).toBe(0);
    expect(computePauseOccurrences(0)).toBe(0);
    expect(computePauseOccurrences(null)).toBe(0);
  });
});

describe("computeActivityDurationSeconds (une seule Activité)", () => {
  function durationFacts(
    overrides: Partial<ActivityDurationFacts> = {},
  ): ActivityDurationFacts {
    return {
      type: "EXERCISE",
      executionMode: "DURATION",
      durationSeconds: 30,
      seriesCount: 2,
      pauseSeconds: 5,
      recoverySeconds: 0,
      ...overrides,
    };
  }

  it("applies D = C × A + (C − 1) × B + R — the pause is developed C − 1 times, never C (RM-129)", () => {
    // 2 × 30 + 1 × 5 = 65 — l'ancienne formule (`C × B`) rendait 70 en
    // comptant une Pause finale qui ne s'exécute jamais.
    expect(computeActivityDurationSeconds(durationFacts())).toBe(65);
  });

  it("adds the attached Récupération exactly once, after all the series (T02-S02)", () => {
    expect(computeActivityDurationSeconds(durationFacts({ recoverySeconds: 20 }))).toBe(85);
    // Séries portées à 3 : la Récupération reste comptée UNE fois.
    expect(
      computeActivityDurationSeconds(durationFacts({ seriesCount: 3, recoverySeconds: 20 })),
    ).toBe(120);
  });

  it("counts no pause at all for a single series, but still counts the Récupération", () => {
    expect(
      computeActivityDurationSeconds(durationFacts({ seriesCount: 1, recoverySeconds: 20 })),
    ).toBe(50);
  });

  it("gives no conventional duration to REPETITIONS nor TO_FAILURE, but still counts their pauses and Récupération (RM-072/RM-132/D-112)", () => {
    for (const mode of ["REPETITIONS", "TO_FAILURE"] as const) {
      expect(
        computeActivityDurationSeconds(
          durationFacts({ executionMode: mode, durationSeconds: null, seriesCount: 3, pauseSeconds: 10 }),
        ),
      ).toBe(20);
      expect(
        computeActivityDurationSeconds(
          durationFacts({
            executionMode: mode,
            durationSeconds: null,
            seriesCount: 3,
            pauseSeconds: 10,
            recoverySeconds: 15,
          }),
        ),
      ).toBe(35);
      expect(isLowerBoundExecutionMode(mode)).toBe(true);
    }
    expect(isLowerBoundExecutionMode("DURATION")).toBe(false);
    expect(isLowerBoundExecutionMode(null)).toBe(false);
  });

  it("counts a legacy standalone RECOVERY's own duration once, without series multiplication nor pause (D-041)", () => {
    // Chemin défensif : `migration004` a converti et supprimé ces lignes ;
    // le Domaine n'en produit plus jamais (`validateCreatableActivityType`).
    expect(
      computeActivityDurationSeconds({
        type: "RECOVERY",
        executionMode: null,
        durationSeconds: 20,
        seriesCount: null,
        pauseSeconds: 0,
        recoverySeconds: 0,
      }),
    ).toBe(20);
  });
});

/**
 * T02-S02 — dépendance bidirectionnelle `Séries ↔ Durée totale` (RM-129/
 * RM-130, `06` §« Dépendance Séries / Durée totale »).
 */
describe("computeTotalDurationSeconds / computeSeriesCountForTotalDuration (formule canonique et son inverse)", () => {
  function facts(overrides: Partial<TotalDurationFacts> = {}): TotalDurationFacts {
    return { durationSeconds: 30, pauseSeconds: 10, recoverySeconds: 0, ...overrides };
  }

  it("computes D = C × A + (C − 1) × B + R", () => {
    expect(computeTotalDurationSeconds(3, facts())).toBe(110);
    expect(computeTotalDurationSeconds(3, facts({ recoverySeconds: 20 }))).toBe(130);
    expect(computeTotalDurationSeconds(1, facts())).toBe(30);
  });

  it("inverts exactly when the target is reachable: Cth = (D − R + B) / (A + B)", () => {
    expect(computeSeriesCountForTotalDuration(110, facts())).toBe(3);
    expect(computeSeriesCountForTotalDuration(130, facts({ recoverySeconds: 20 }))).toBe(3);
    expect(computeSeriesCountForTotalDuration(30, facts())).toBe(1);
  });

  it("rounds a .5 theoretical series count UP (D-092)", () => {
    // A + B = 40 ; cible 130 → (130 + 10) / 40 = 3.5 → 4, jamais 3.
    expect(computeSeriesCountForTotalDuration(130, facts())).toBe(4);
    // Contrôle du voisinage immédiat : 3.49 → 3, 3.51 → 4.
    expect(computeSeriesCountForTotalDuration(129, facts())).toBe(3);
    expect(computeSeriesCountForTotalDuration(131, facts())).toBe(4);
  });

  it("clamps the inverted series count to [1, 99]", () => {
    expect(computeSeriesCountForTotalDuration(0, facts())).toBe(SERIES_COUNT_MIN);
    expect(computeSeriesCountForTotalDuration(-1000, facts())).toBe(SERIES_COUNT_MIN);
    expect(computeSeriesCountForTotalDuration(1_000_000, facts())).toBe(SERIES_COUNT_MAX);
  });

  it("falls back to the minimum series count when A + B is zero — the target carries no information about C", () => {
    expect(
      computeSeriesCountForTotalDuration(600, facts({ durationSeconds: 0, pauseSeconds: 0 })),
    ).toBe(SERIES_COUNT_MIN);
  });

  it("is a true round trip: inverting then recomputing returns the original duration for reachable targets", () => {
    for (const seriesCount of [1, 2, 5, 12, 99]) {
      const total = computeTotalDurationSeconds(seriesCount, facts({ recoverySeconds: 20 }));
      expect(computeSeriesCountForTotalDuration(total, facts({ recoverySeconds: 20 }))).toBe(
        seriesCount,
      );
    }
  });
});

describe("applyTargetTotalDuration (RM-130) — pilote Séries, jamais la durée elle-même", () => {
  const facts: TotalDurationFacts = { durationSeconds: 30, pauseSeconds: 10, recoverySeconds: 0 };

  it("reports no adjustment when the target is exactly reachable", () => {
    expect(applyTargetTotalDuration(110, facts)).toEqual({
      seriesCount: 3,
      totalDurationSeconds: 110,
      wasAdjusted: false,
    });
  });

  it("reports the adjusted duration when rounding changed the reachable total", () => {
    // 130 → 3.5 Séries → 4 Séries → 4 × 30 + 3 × 10 = 150.
    expect(applyTargetTotalDuration(130, facts)).toEqual({
      seriesCount: 4,
      totalDurationSeconds: 150,
      wasAdjusted: true,
    });
  });

  it("reports the adjusted duration when the bounds [1, 99] clamped the series count", () => {
    expect(applyTargetTotalDuration(1_000_000, facts)).toMatchObject({
      seriesCount: SERIES_COUNT_MAX,
      wasAdjusted: true,
    });
    expect(applyTargetTotalDuration(0, facts)).toMatchObject({
      seriesCount: SERIES_COUNT_MIN,
      totalDurationSeconds: 30,
      wasAdjusted: true,
    });
  });
});

describe("computeZoneDurationFacts (collection d'Activités)", () => {
  it("sums the collection with the canonical formula and flags the lower bound", () => {
    const activities: readonly ActivityDurationFacts[] = [
      {
        type: "EXERCISE",
        executionMode: "DURATION",
        durationSeconds: 30,
        seriesCount: 2,
        pauseSeconds: 5,
        recoverySeconds: 10,
      },
      {
        type: "EXERCISE",
        executionMode: "REPETITIONS",
        durationSeconds: null,
        seriesCount: 3,
        pauseSeconds: 10,
        recoverySeconds: 0,
      },
    ];
    // 1re : 2×30 + 1×5 + 10 = 75 ; 2e : 2×10 = 20 → 95, borne minimale.
    expect(computeZoneDurationFacts(activities)).toEqual({
      seconds: 95,
      isLowerBoundEstimate: true,
    });
  });

  it("returns a neutral, exact result for an empty collection", () => {
    expect(computeZoneDurationFacts([])).toEqual({ seconds: 0, isLowerBoundEstimate: false });
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
      // T02-S02 : champ obligatoire de l'agrégat — `0` est la valeur neutre
      // (aucune Récupération attachée), pas une absence.
      recoverySeconds: 0,
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

  it("sums the canonical formula across several DURATION Activities (T01-S09, corrigé RM-129)", () => {
    const session = aSession([
      anActivity({ id: "a1", durationSeconds: 30, seriesCount: 2, pauseSeconds: 5 }),
      anActivity({ id: "a2", name: "Squats", durationSeconds: 20, seriesCount: 1, pauseSeconds: 0 }),
    ]);
    // a1: 2×30 + 1×5 = 65 ; a2: 1×20 + 0 = 20 ; total 85.
    expect(toEstimatedDurationFacts(session)).toEqual({
      beforeTourDurationSeconds: 0,
      inTourDurationSeconds: 85,
      afterTourDurationSeconds: 0,
      tourRepeatCount: 1,
      isLowerBoundEstimate: false,
    });
    expect(computeActivityCount(toActivityCountFacts(session))).toBe(2);
  });

  it("propagates the attached Récupération of each Activity into the zone duration (T02-S02)", () => {
    const session = aSession([
      anActivity({ id: "a1", durationSeconds: 30, seriesCount: 2, pauseSeconds: 5, recoverySeconds: 20 }),
    ]);
    // 2×30 + 1×5 + 20 = 85.
    expect(toEstimatedDurationFacts(session)).toMatchObject({ inTourDurationSeconds: 85 });
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
    // Repetitions: no nominal duration, only (3 − 1) × 10 = 20 of pause.
    expect(toEstimatedDurationFacts(session)).toMatchObject({
      inTourDurationSeconds: 20,
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
      inTourDurationSeconds: 20,
      isLowerBoundEstimate: true,
    });
  });

  it("counts a legacy standalone RECOVERY Activity's own duration once, without series multiplication nor pause (D-041)", () => {
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
    // a1: 2×30 + 1×5 = 65 ; recovery: 20 ; total 85.
    expect(toEstimatedDurationFacts(session)).toMatchObject({
      inTourDurationSeconds: 85,
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
