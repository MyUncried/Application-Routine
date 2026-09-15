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
 * **T02-S02 (règle métier confirmée) — la Récupération REMPLACE la dernière
 * Pause.** Sans Récupération, la Pause est développée `C` fois ; avec
 * Récupération, `C − 1` fois. Les deux ne se cumulent jamais, et le repos qui
 * suit la dernière Série ne disparaît jamais : il change simplement de
 * porteur.
 */
describe("computePauseOccurrences (règle conditionnelle T02-S02)", () => {
  it("counts ONE pause per series when there is no Récupération", () => {
    expect(computePauseOccurrences(3, 0)).toBe(3);
    expect(computePauseOccurrences(2, 0)).toBe(2);
    expect(computePauseOccurrences(1, 0)).toBe(1);
  });

  it("drops exactly the last pause when a Récupération exists — it replaces it", () => {
    expect(computePauseOccurrences(3, 20)).toBe(2);
    expect(computePauseOccurrences(2, 20)).toBe(1);
    expect(computePauseOccurrences(1, 20)).toBe(0);
  });

  it("returns zero for zero series or an absent series count, in both branches", () => {
    expect(computePauseOccurrences(0, 0)).toBe(0);
    expect(computePauseOccurrences(0, 20)).toBe(0);
    expect(computePauseOccurrences(null, 0)).toBe(0);
    expect(computePauseOccurrences(null, 20)).toBe(0);
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

  it("applies D = C × A + C × B when there is no Récupération", () => {
    // 2 × 30 + 2 × 5 = 70 : la Pause suit CHAQUE Série, y compris la
    // dernière, tant qu'aucune Récupération ne vient la remplacer.
    expect(computeActivityDurationSeconds(durationFacts())).toBe(70);
  });

  it("applies D = C × A + (C − 1) × B + R as soon as a Récupération exists — it REPLACES the last pause", () => {
    // 2 × 30 + 1 × 5 + 20 = 85 (et non `2 × 5 + 20 = 90` : la dernière Pause
    // est remplacée, jamais cumulée avec la Récupération).
    expect(computeActivityDurationSeconds(durationFacts({ recoverySeconds: 20 }))).toBe(85);
    // Séries portées à 3 : la Récupération reste comptée UNE fois.
    expect(
      computeActivityDurationSeconds(durationFacts({ seriesCount: 3, recoverySeconds: 20 })),
    ).toBe(120);
  });

  it("makes the last rest period always exist: a single series keeps its pause without Récupération, and its Récupération instead of that pause", () => {
    // `C = 1`, `R = 0` : la seule Pause est celle qui suit l'unique Série.
    expect(computeActivityDurationSeconds(durationFacts({ seriesCount: 1 }))).toBe(35);
    // `C = 1`, `R = 20` : la Récupération remplace cette Pause.
    expect(
      computeActivityDurationSeconds(durationFacts({ seriesCount: 1, recoverySeconds: 20 })),
    ).toBe(50);
  });

  it("gives no conventional duration to REPETITIONS nor TO_FAILURE, but still counts their pauses and Récupération (RM-072/RM-132/D-112)", () => {
    for (const mode of ["REPETITIONS", "TO_FAILURE"] as const) {
      // Sans Récupération : 3 × 10 = 30.
      expect(
        computeActivityDurationSeconds(
          durationFacts({ executionMode: mode, durationSeconds: null, seriesCount: 3, pauseSeconds: 10 }),
        ),
      ).toBe(30);
      // Avec Récupération : 2 × 10 + 15 = 35.
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

  it("computes D = C × A + C × B without Récupération", () => {
    // `A + B = 40` : sans Récupération, la durée est un multiple exact de 40.
    expect(computeTotalDurationSeconds(3, facts())).toBe(120);
    expect(computeTotalDurationSeconds(1, facts())).toBe(40);
  });

  it("computes D = C × A + (C − 1) × B + R with a Récupération, which replaces the last pause", () => {
    expect(computeTotalDurationSeconds(3, facts({ recoverySeconds: 20 }))).toBe(130);
    expect(computeTotalDurationSeconds(1, facts({ recoverySeconds: 20 }))).toBe(50);
  });

  it("inverts exactly, branch by branch: Cth = D / (A + B) without R, (D − R + B) / (A + B) with R", () => {
    expect(computeSeriesCountForTotalDuration(120, facts())).toBe(3);
    expect(computeSeriesCountForTotalDuration(40, facts())).toBe(1);
    expect(computeSeriesCountForTotalDuration(130, facts({ recoverySeconds: 20 }))).toBe(3);
  });

  it("never applies the '+ B' numerator term when there is no Récupération — that term belongs to the Récupération branch only", () => {
    // Cible `59`, `A + B = 40`. Sans Récupération : `59 / 40 = 1,475 → 1`.
    // Avec une Récupération (même minuscule) : `(59 − 1 + 10) / 40 = 1,7 → 2`.
    // Le numérateur `+ B` appliqué inconditionnellement — règle précédente —
    // aurait rendu `2` dans les DEUX cas, surestimant `C` d'une Série
    // entière en l'absence de Récupération.
    expect(computeSeriesCountForTotalDuration(59, facts())).toBe(1);
    expect(computeSeriesCountForTotalDuration(59, facts({ recoverySeconds: 1 }))).toBe(2);
  });

  it("rounds a .5 theoretical series count UP (D-092)", () => {
    // A + B = 40 ; sans Récupération, cible 100 → 100 / 40 = 2.5 → 3.
    expect(computeSeriesCountForTotalDuration(100, facts())).toBe(3);
    // Contrôle du voisinage immédiat : 2.475 → 2, 2.525 → 3.
    expect(computeSeriesCountForTotalDuration(99, facts())).toBe(2);
    expect(computeSeriesCountForTotalDuration(101, facts())).toBe(3);
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

  it("is a true round trip in BOTH branches: inverting then recomputing returns the original series count", () => {
    for (const seriesCount of [1, 2, 5, 12, 99]) {
      const withoutRecovery = computeTotalDurationSeconds(seriesCount, facts());
      expect(computeSeriesCountForTotalDuration(withoutRecovery, facts())).toBe(seriesCount);

      const withRecovery = computeTotalDurationSeconds(seriesCount, facts({ recoverySeconds: 20 }));
      expect(computeSeriesCountForTotalDuration(withRecovery, facts({ recoverySeconds: 20 }))).toBe(
        seriesCount,
      );
    }
  });
});

describe("applyTargetTotalDuration (RM-130) — pilote Séries, jamais la durée elle-même", () => {
  const facts: TotalDurationFacts = { durationSeconds: 30, pauseSeconds: 10, recoverySeconds: 0 };

  it("reports no adjustment when the target is exactly reachable", () => {
    expect(applyTargetTotalDuration(120, facts)).toEqual({
      seriesCount: 3,
      totalDurationSeconds: 120,
      wasAdjusted: false,
    });
  });

  it("reports the adjusted duration when rounding changed the reachable total", () => {
    // 100 → 2.5 Séries → 3 Séries → 3 × 30 + 3 × 10 = 120.
    expect(applyTargetTotalDuration(100, facts)).toEqual({
      seriesCount: 3,
      totalDurationSeconds: 120,
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
      // `1 × 30 + 1 × 10 = 40` : sans Récupération, l'unique Série garde sa
      // Pause.
      totalDurationSeconds: 40,
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
    // 1re (avec Récupération) : 2×30 + 1×5 + 10 = 75 ;
    // 2e (sans Récupération) : 3×10 = 30 → 105, borne minimale.
    expect(computeZoneDurationFacts(activities)).toEqual({
      seconds: 105,
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
    // Aucune Récupération : a1 = 2×30 + 2×5 = 70 ; a2 = 1×20 + 1×0 = 20 ;
    // total 90.
    expect(toEstimatedDurationFacts(session)).toEqual({
      beforeTourDurationSeconds: 0,
      inTourDurationSeconds: 90,
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
    // Repetitions sans Récupération : aucune durée nominale, seulement
    // 3 × 10 = 30 de Pause.
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
    // a1 (sans Récupération attachée) : 2×30 + 2×5 = 70 ; ligne `RECOVERY`
    // héritée : 20 ; total 90.
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

  /**
   * V2-BILAT-01 : `Session.cycle.tour.sideMode` gouverne la zone `IN_TOUR`
   * uniquement — `BEFORE_TOUR`/`AFTER_TOUR` utilisent toujours leur propre
   * direction, jamais celle du Tour.
   */
  it("multiplies only the IN_TOUR zone by the Tour's own bilateral direction — BEFORE/AFTER keep using their own side", () => {
    const session = aSession(
      [anActivity({ id: "core", durationSeconds: 20, seriesCount: 1, pauseSeconds: 0 })],
      {
        beforeTour: [
          anActivity({
            id: "warmup",
            durationSeconds: 10,
            structuralPosition: "BEFORE_TOUR",
            sideMode: "RIGHT_LEFT",
          }),
        ],
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 1,
          sideMode: "LEFT_RIGHT",
          exercises: [anActivity({ id: "core", durationSeconds: 20, seriesCount: 1, pauseSeconds: 0 })],
        },
      },
    );
    // BEFORE_TOUR : direction propre `RIGHT_LEFT`, `Li = 2` → 10 × 2 = 20.
    // IN_TOUR : direction du Tour `LEFT_RIGHT` prévaut → 20 × 2 = 40.
    expect(toEstimatedDurationFacts(session)).toMatchObject({
      beforeTourDurationSeconds: 20,
      inTourDurationSeconds: 40,
    });
  });
});

/**
 * V2-BILAT-01 (plan `## Calculs`) — les trois scénarios canoniques de
 * `computeZoneDurationFacts`, `contextSideMode` étant la direction du Tour
 * lui-même (`UNILATERAL` par défaut pour une zone hors Tour).
 */
describe("computeZoneDurationFacts — V2-BILAT-01 side mode", () => {
  function activity(overrides: Partial<ActivityDurationFacts> = {}): ActivityDurationFacts {
    return {
      type: "EXERCISE",
      executionMode: "DURATION",
      durationSeconds: 30,
      seriesCount: 2,
      pauseSeconds: 5,
      recoverySeconds: 20,
      sideMode: "UNILATERAL",
      ...overrides,
    };
  }

  it("Tour et Activité unilatéraux : Li = 1, aucun changement par rapport à T02-S02", () => {
    // 2×30 + 1×5 + 20 = 85 (formule T02-S02, L = 1).
    expect(computeZoneDurationFacts([activity()], "UNILATERAL")).toEqual({
      seconds: 85,
      isLowerBoundEstimate: false,
    });
  });

  it("Tour unilatéral + Activité bilatérale : Li = 2 pour cette Activité, Ri comptée une seule fois après ses deux côtés", () => {
    // perPass = 2×30 + 1×5 = 65 ; × L(2) = 130 ; + R(20, jamais doublée) = 150.
    expect(
      computeZoneDurationFacts([activity({ sideMode: "RIGHT_LEFT" })], "UNILATERAL"),
    ).toEqual({ seconds: 150, isLowerBoundEstimate: false });
  });

  it("Tour bilatéral : la direction du Tour prévaut pour toute Activité IN_TOUR, Ri comptée une fois par passage de côté", () => {
    // Le Tour est bilatéral : chaque Activité — même déjà remise
    // UNILATERAL par la transition atomique — prend Li = 2 ; la
    // Récupération est ELLE AUSSI doublée (un passage par côté).
    // perPass = 65 ; × 2 = 130 ; + R(20) × 2 = 40 → 170.
    expect(
      computeZoneDurationFacts([activity({ sideMode: "UNILATERAL" })], "RIGHT_LEFT"),
    ).toEqual({ seconds: 170, isLowerBoundEstimate: false });
  });

  it("Tour bilatéral : la direction du Tour prévaut même si l'Activité porte encore une direction propre différente", () => {
    // Même résultat que ci-dessus : la direction propre de l'Activité
    // (ici encore `LEFT_RIGHT`) est sans effet dès que le Tour est
    // bilatéral — jamais un double multiplicateur.
    expect(
      computeZoneDurationFacts([activity({ sideMode: "LEFT_RIGHT" })], "RIGHT_LEFT"),
    ).toEqual({ seconds: 170, isLowerBoundEstimate: false });
  });

  it("never applies a double multiplier: Tour and Activity both bilateral never yields a factor greater than 2", () => {
    const bilateralTour = computeZoneDurationFacts(
      [activity({ sideMode: "RIGHT_LEFT" })],
      "RIGHT_LEFT",
    ).seconds;
    const unilateralTour = computeZoneDurationFacts(
      [activity({ sideMode: "RIGHT_LEFT" })],
      "UNILATERAL",
    ).seconds;
    // Le Tour bilatéral double AUSSI la Récupération (170), l'Activité
    // bilatérale seule ne double que la part Séries + Pauses (150) — les
    // deux restent strictement inférieurs à un double comptage naïf
    // (`2 × 150 = 300`), preuve qu'aucun double multiplicateur n'est
    // jamais appliqué.
    expect(bilateralTour).toBe(170);
    expect(unilateralTour).toBe(150);
    expect(bilateralTour).toBeLessThan(2 * unilateralTour);
  });

  it("treats a Facts item with no sideMode field as UNILATERAL — non-regression for every caller predating this tranche", () => {
    const legacyFacts: ActivityDurationFacts = {
      type: "EXERCISE",
      executionMode: "DURATION",
      durationSeconds: 30,
      seriesCount: 2,
      pauseSeconds: 5,
      recoverySeconds: 20,
    };
    expect(computeZoneDurationFacts([legacyFacts])).toEqual({ seconds: 85, isLowerBoundEstimate: false });
  });
});

/**
 * V2-BILAT-01 — formule « autonome » (`D = L × [C × A + occurrences × B] +
 * R`) : une occurrence d'Activité isolée (`ExerciseScreen`), la Récupération
 * n'est jamais multipliée.
 */
describe("computeTotalDurationSeconds / computeSeriesCountForTotalDuration / applyTargetTotalDuration — V2-BILAT-01 side mode", () => {
  const facts: TotalDurationFacts = { durationSeconds: 30, pauseSeconds: 10, recoverySeconds: 0 };
  const facts20R: TotalDurationFacts = { durationSeconds: 30, pauseSeconds: 10, recoverySeconds: 20 };

  it("multiplies the Series + Pauses part by L, without ever multiplying the Récupération (R = 0 branch)", () => {
    // Sans multiplicateur : 3 × 30 + 3 × 10 = 120 (T02-S02, inchangé).
    expect(computeTotalDurationSeconds(3, facts, 1)).toBe(120);
    // Bilatéral : (3 × 30 + 3 × 10) × 2 = 240.
    expect(computeTotalDurationSeconds(3, facts, 2)).toBe(240);
  });

  it("multiplies the Series + Pauses part by L, R staying outside (R > 0 branch)", () => {
    // Sans multiplicateur : 3 × 30 + 2 × 10 + 20 = 130 (T02-S02, inchangé).
    expect(computeTotalDurationSeconds(3, facts20R, 1)).toBe(130);
    // Bilatéral : (3 × 30 + 2 × 10) × 2 + 20 = 240.
    expect(computeTotalDurationSeconds(3, facts20R, 2)).toBe(240);
  });

  it("defaults L to 1 — non-regression for every caller predating this tranche", () => {
    expect(computeTotalDurationSeconds(3, facts)).toBe(120);
  });

  it("inverts exactly the bilateral formula, in both branches", () => {
    for (const seriesCount of [1, 2, 5, 12, 99]) {
      const withoutRecovery = computeTotalDurationSeconds(seriesCount, facts, 2);
      expect(computeSeriesCountForTotalDuration(withoutRecovery, facts, 2)).toBe(seriesCount);

      const withRecovery = computeTotalDurationSeconds(seriesCount, facts20R, 2);
      expect(computeSeriesCountForTotalDuration(withRecovery, facts20R, 2)).toBe(seriesCount);
    }
  });

  it("applyTargetTotalDuration propagates the side multiplier to both the inverse and the recomputed duration", () => {
    // Cible atteignable exactement : 3 Séries bilatérales, `(3×30+3×10)×2 = 240`.
    expect(applyTargetTotalDuration(240, facts, 2)).toEqual({
      seriesCount: 3,
      totalDurationSeconds: 240,
      wasAdjusted: false,
    });
  });
});
