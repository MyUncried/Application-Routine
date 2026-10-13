import { describe, expect, it } from "@jest/globals";

import { invertTotalDuration } from "@/domain/activities/executionCalculations";
import {
  computeActivityCount,
  computeActivityDurationResult,
  computeActivityDurationSeconds,
  computeEstimatedDurationSeconds,
  computeStructuredSessionDuration,
  computeTotalActivitiesToExecute,
  computeZoneDurationFacts,
  toActivityCountFacts,
  toEstimatedDurationFacts,
  toSessionDurationResult,
  type ActivityCountFacts,
  type ActivityDurationFacts,
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

/**
 * **T02-S02 (règle métier confirmée) — la Récupération REMPLACE la dernière
 * Pause.** Sans Récupération, la Pause est développée `C` fois ; avec
 * Récupération, `C − 1` fois. Les deux ne se cumulent jamais, et le repos qui
 * suit la dernière Série ne disparaît jamais : il change simplement de
 * porteur.
 */
/**
 * PRE-3 (révisé aux sources courantes, Bip v2 §3) : l'ancienne fonction
 * `computePauseOccurrences` est retirée au profit de l'autorité unique
 * (`executionCalculations.ts`), dont le registre d'événements PROUVE la même
 * règle T02-S02 conservée : une Récupération positive remplace UNIQUEMENT la
 * toute dernière Pause, jamais cumulée.
 */
describe("Pause terminale et Récupération (règle conservée, autorité unique PRE-3)", () => {
  const facts = (recovery: number, seriesCount: number | null = 3): ActivityDurationFacts => ({
    type: "EXERCISE",
    executionMode: "DURATION",
    durationSeconds: 30,
    seriesCount,
    pauseSeconds: 10,
    postActivityRecoverySeconds: recovery,
  });
  const pauses = (recovery: number, seriesCount?: number | null) =>
    computeActivityDurationResult(facts(recovery, seriesCount)).events.filter((event) => event.kind === "SERIES_PAUSE");

  it("counts ONE pause per series when there is no Récupération", () => {
    expect(pauses(0)).toHaveLength(3);
  });

  it("drops exactly the last pause when a Récupération exists — it replaces it", () => {
    expect(pauses(20)).toHaveLength(2);
    expect(computeActivityDurationResult(facts(20)).events.at(-1)).toEqual({ kind: "RECOVERY", seconds: 20 });
  });

  it("keeps a single Series' only pause without Récupération (an absent count reads as one Series)", () => {
    expect(pauses(0, 1)).toHaveLength(1);
    expect(pauses(0, null)).toHaveLength(1);
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
      postActivityRecoverySeconds: 0,
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
    expect(computeActivityDurationSeconds(durationFacts({ postActivityRecoverySeconds: 20 }))).toBe(85);
    // Séries portées à 3 : la Récupération reste comptée UNE fois.
    expect(
      computeActivityDurationSeconds(durationFacts({ seriesCount: 3, postActivityRecoverySeconds: 20 })),
    ).toBe(120);
  });

  it("makes the last rest period always exist: a single series keeps its pause without Récupération, and its Récupération instead of that pause", () => {
    // `C = 1`, `R = 0` : la seule Pause est celle qui suit l'unique Série.
    expect(computeActivityDurationSeconds(durationFacts({ seriesCount: 1 }))).toBe(35);
    // `C = 1`, `R = 20` : la Récupération remplace cette Pause.
    expect(
      computeActivityDurationSeconds(durationFacts({ seriesCount: 1, postActivityRecoverySeconds: 20 })),
    ).toBe(50);
  });

  it("gives no conventional duration to REPETITIONS nor TO_FAILURE (omitted), but still counts their pauses and Récupération as known contributions", () => {
    for (const mode of ["REPETITIONS", "TO_FAILURE"] as const) {
      const withoutRecovery = computeActivityDurationResult(
        durationFacts({ executionMode: mode, durationSeconds: null, repetitionCount: mode === "REPETITIONS" ? 12 : null, seriesCount: 3, pauseSeconds: 10 }),
      );
      // Sans Récupération : 3 × 10 = 30 de pauses connues, aucune durée d'Exercice.
      expect(withoutRecovery).toEqual(expect.objectContaining({ kind: "omitted", knownSeconds: 30 }));
      expect(withoutRecovery.seconds).toBeUndefined();
      // Avec Récupération : 2 × 10 + 15 = 35 (R remplace la Pause terminale).
      expect(
        computeActivityDurationSeconds(
          durationFacts({
            executionMode: mode,
            durationSeconds: null,
            repetitionCount: mode === "REPETITIONS" ? 12 : null,
            seriesCount: 3,
            pauseSeconds: 10,
            postActivityRecoverySeconds: 15,
          }),
        ),
      ).toBe(35);
    }
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
        postActivityRecoverySeconds: 0,
      }),
    ).toBe(20);
  });
});

/**
 * PRE-3 (révisé aux sources courantes, v13 §5) : l'ancienne inversion par
 * formule fermée (`computeSeriesCountForTotalDuration`/
 * `applyTargetTotalDuration`) est remplacée par l'énumération N = 1..99 de
 * l'autorité unique — total réalisable le plus proche, égalité vers le N le
 * plus grand, ajustement signalé seulement si le total diffère.
 */
describe("Inversion Durée totale → Séries (autorité unique PRE-3)", () => {
  const uniform = (count: number, overrides: Record<string, unknown> = {}) => ({
    version: 1 as const,
    mode: "DURATION" as const,
    series: { kind: "UNIFORM" as const, count, target: 30, pauseSeconds: 10 },
    sideMode: "UNILATERAL" as const,
    sideOrder: "BY_SIDE" as const,
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    ...overrides,
  });

  it("reports no adjustment when the target is exactly reachable", () => {
    expect(invertTotalDuration(uniform(1), 120)).toEqual({ seriesCount: 3, totalSeconds: 120, adjusted: false });
  });

  it("reports the adjusted duration when the target is not exactly reachable (tie → higher N)", () => {
    expect(invertTotalDuration(uniform(1), 100)).toEqual({ seriesCount: 3, totalSeconds: 120, adjusted: true });
  });

  it("clamps to the reachable extremes [1, 99]", () => {
    expect(invertTotalDuration(uniform(5), 1)).toEqual({ seriesCount: 1, totalSeconds: 40, adjusted: true });
    expect(invertTotalDuration(uniform(5), 1_000_000)).toEqual({ seriesCount: 99, totalSeconds: 3960, adjusted: true });
  });

  it("is a true round trip: inverting a reachable total returns its series count", () => {
    for (const count of [1, 2, 5, 12, 99]) {
      const total = (30 + 10) * count;
      expect(invertTotalDuration(uniform(1), total).seriesCount).toBe(count);
    }
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
        postActivityRecoverySeconds: 10,
      },
      {
        type: "EXERCISE",
        executionMode: "REPETITIONS",
        durationSeconds: null,
        seriesCount: 3,
        pauseSeconds: 10,
        postActivityRecoverySeconds: 0,
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
      postActivityRecoverySeconds: 0,
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
      labelId: null,
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
      anActivity({ id: "a1", durationSeconds: 30, seriesCount: 2, pauseSeconds: 5, postActivityRecoverySeconds: 20 }),
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
   * V2-PRE-1 (plan §3.3) : le Circuit (Tour) n'a plus aucune influence
   * fonctionnelle — `BEFORE_TOUR`/`IN_TOUR`/`AFTER_TOUR` utilisent toujours
   * la direction PROPRE de chaque Activité, jamais celle du Tour.
   */
  it("multiplies each zone strictly by each Activity's own direction — the Tour carries no direction of its own", () => {
    const session = aSession(
      [
        anActivity({
          id: "core",
          durationSeconds: 20,
          seriesCount: 1,
          pauseSeconds: 0,
          sideMode: "LEFT_RIGHT",
        }),
      ],
      {
        beforeTour: [
          anActivity({
            id: "warmup",
            durationSeconds: 10,
            structuralPosition: "BEFORE_TOUR",
            sideMode: "RIGHT_LEFT",
          }),
        ],
      },
    );
    // BEFORE_TOUR : direction propre `RIGHT_LEFT`, `Li = 2` → 10 × 2 = 20.
    // IN_TOUR : direction propre `LEFT_RIGHT`, `Li = 2` → 20 × 2 = 40.
    expect(toEstimatedDurationFacts(session)).toMatchObject({
      beforeTourDurationSeconds: 20,
      inTourDurationSeconds: 40,
    });
  });
});

/**
 * V2-PRE-1 (plan §3.3) — `computeZoneDurationFacts` ne dépend plus que de la
 * direction PROPRE de chaque Activité ; la récupération post-exercice n'est
 * jamais multipliée par côté (le Circuit n'a plus de direction).
 */
describe("computeZoneDurationFacts — side mode (V2-PRE-1)", () => {
  function activity(overrides: Partial<ActivityDurationFacts> = {}): ActivityDurationFacts {
    return {
      type: "EXERCISE",
      executionMode: "DURATION",
      durationSeconds: 30,
      seriesCount: 2,
      pauseSeconds: 5,
      postActivityRecoverySeconds: 20,
      sideMode: "UNILATERAL",
      ...overrides,
    };
  }

  it("unilateral Activity: Li = 1, unchanged from T02-S02", () => {
    // 2×30 + 1×5 + 20 = 85 (formule T02-S02, L = 1).
    expect(computeZoneDurationFacts([activity()])).toEqual({
      seconds: 85,
      isLowerBoundEstimate: false,
    });
  });

  it("bilateral Activity: both sides counted, Ri counted only once after both sides", () => {
    // PRE-3 (Bip v2 §3) : 2 × Σ(T + P) = 2 × (2×30 + 2×5) = 140 ; PC absent
    // d'une ancienne occurrence = 0 ; R(20) remplace la seule Pause terminale
    // (5) : 140 − 5 + 20 = 155 (jamais doublée).
    expect(computeZoneDurationFacts([activity({ sideMode: "RIGHT_LEFT" })])).toEqual({
      seconds: 155,
      isLowerBoundEstimate: false,
    });
  });

  it("treats a Facts item with no sideMode field as UNILATERAL — non-regression for every caller predating this tranche", () => {
    const legacyFacts: ActivityDurationFacts = {
      type: "EXERCISE",
      executionMode: "DURATION",
      durationSeconds: 30,
      seriesCount: 2,
      pauseSeconds: 5,
      postActivityRecoverySeconds: 20,
    };
    expect(computeZoneDurationFacts([legacyFacts])).toEqual({ seconds: 85, isLowerBoundEstimate: false });
  });
});

/**
 * PRE-3 (révisé aux sources courantes, v13 §5) : l'occurrence bilatérale
 * isolée suit l'ordre des côtés et inclut la Pause entre les côtés ;
 * l'inversion énumère N = 1..99 (N = 1 normalisé par côté). La Récupération
 * appartient à l'occurrence et n'entre jamais dans l'inversion intrinsèque.
 */
describe("Durée bilatérale et inversion — ordre des côtés et Pause entre les côtés (PRE-3)", () => {
  const bilateral = (order: "BY_SIDE" | "BY_SERIES") => ({
    version: 1 as const,
    mode: "DURATION" as const,
    series: { kind: "UNIFORM" as const, count: 3, target: 30, pauseSeconds: 10 },
    sideMode: "RIGHT_LEFT" as const,
    sideOrder: order,
    sideRecoverySeconds: 5,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
  });

  it("counts both sides, the Pause between sides once (by side) or N times (by series), R once", () => {
    const facts = (order: "BY_SIDE" | "BY_SERIES", recovery: number): ActivityDurationFacts => ({
      type: "EXERCISE",
      executionMode: "DURATION",
      durationSeconds: 30,
      seriesCount: 3,
      pauseSeconds: 10,
      postActivityRecoverySeconds: recovery,
      sideMode: "RIGHT_LEFT",
      executionParameters: bilateral(order),
    });
    // Par côté : 2 × 3 × (30 + 10) + 5 = 245 ; avec R20 : 245 − 10 + 20 = 255.
    expect(computeActivityDurationSeconds(facts("BY_SIDE", 0))).toBe(245);
    expect(computeActivityDurationSeconds(facts("BY_SIDE", 20))).toBe(255);
    // Par paire : 2 × 90 + 30 + 3 × 5 = 225.
    expect(computeActivityDurationSeconds(facts("BY_SERIES", 0))).toBe(225);
  });

  it("inverts the bilateral total exactly, by enumeration", () => {
    for (const count of [2, 5, 12, 99]) {
      const total = count * (2 * 30 + 10 + 5);
      expect(invertTotalDuration({ ...bilateral("BY_SERIES"), series: { ...bilateral("BY_SERIES").series, count: 1 } }, total)).toEqual({
        seriesCount: count,
        totalSeconds: total,
        adjusted: false,
      });
    }
  });
});

describe("P3-13/tours-cycles-list — une seule autorité pour la lecture complète et la liste", () => {
  it("développe les répétitions du Circuit sur la seule zone IN_TOUR et type le total exact/≈/≥", () => {
    const exact: ActivityDurationFacts = { type: "EXERCISE", executionMode: "DURATION", durationSeconds: 30, seriesCount: 2, pauseSeconds: 10, postActivityRecoverySeconds: 0 };
    const unknown: ActivityDurationFacts = { type: "EXERCISE", executionMode: "TO_FAILURE", durationSeconds: null, seriesCount: 2, pauseSeconds: 15, postActivityRecoverySeconds: 0 };
    expect(computeStructuredSessionDuration({ beforeTour: [exact], inTour: [exact], afterTour: [], tourRepeatCount: 99 })).toEqual({
      kind: "exact",
      seconds: 80 + 99 * 80,
    });
    expect(computeStructuredSessionDuration({ beforeTour: [], inTour: [exact], afterTour: [unknown], tourRepeatCount: 1 })).toEqual({
      kind: "lowerBound",
      seconds: 80 + 30,
    });
  });

  it("toSessionDurationResult lit l'agrégat complet sans requête supplémentaire", () => {
    const session = {
      id: "s",
      ownerId: "o",
      name: "S",
      color: "#3B82F6",
      status: "ACTIVE",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      createdAt: "now",
      updatedAt: "now",
      cycle: {
        id: "c",
        position: 1,
        repeatCount: 1,
        tour: {
          id: "t",
          position: 1,
          repeatCount: 2,
          exercises: [
            {
              id: "a",
              type: "EXERCISE",
              executionMode: "DURATION",
              structuralPosition: "IN_TOUR",
              position: 0,
              name: "A",
              durationSeconds: 30,
              repetitionCount: null,
              seriesCount: 1,
              pauseSeconds: 0,
              postActivityRecoverySeconds: 0,
              instruction: null,
              bodyZoneIds: [],
            },
          ],
        },
      },
    } as unknown as Session;
    expect(toSessionDurationResult(session)).toEqual({ kind: "exact", seconds: 60 });
  });
});
