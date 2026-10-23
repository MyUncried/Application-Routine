import { describe, expect, it } from "@jest/globals";

import { computeIntrinsicDuration, invertTotalDuration } from "@/domain/activities/executionCalculations";
import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import {
  computeActivityCount,
  computeActivityDurationResult,
  computeActivityDurationSeconds,
  computeEstimatedDurationSeconds,
  computeSessionExecutionDuration,
  computeStructuredSessionDuration,
  computeTotalActivitiesToExecute,
  computeZoneDurationFacts,
  toActivityCountFacts,
  toEstimatedDurationFacts,
  toSessionDurationResult,
  toSessionExecutionDurationResult,
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
  const facts = (recovery: number, seriesCount = 3): ActivityDurationFacts => ({
    type: "EXERCISE",
    executionParameters: durationParameters(30, seriesCount, 10),
    postActivityRecoverySeconds: recovery,
  });
  const pauses = (recovery: number, seriesCount?: number) =>
    computeActivityDurationResult(facts(recovery, seriesCount)).events.filter((event) => event.kind === "SERIES_PAUSE");

  it("counts ONE pause per series when there is no Récupération", () => {
    expect(pauses(0)).toHaveLength(3);
  });

  it("drops exactly the last pause when a Récupération exists — it replaces it", () => {
    expect(pauses(20)).toHaveLength(2);
    expect(computeActivityDurationResult(facts(20)).events.at(-1)).toEqual({ kind: "RECOVERY", seconds: 20 });
  });

  it("keeps a single Series' only pause without Récupération", () => {
    expect(pauses(0, 1)).toHaveLength(1);
  });
});

describe("computeActivityDurationSeconds (une seule Activité)", () => {
  function durationFacts(
    overrides: Partial<ActivityDurationFacts> & { readonly seriesCount?: number } = {},
  ): ActivityDurationFacts {
    const { seriesCount = 2, ...rest } = overrides;
    return {
      type: "EXERCISE",
      executionParameters: durationParameters(30, seriesCount, 5),
      postActivityRecoverySeconds: 0,
      ...rest,
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

  it("gives no conventional duration to REPETITIONS nor to all-FAILURE targets (omitted), but still counts their pauses and Récupération as known contributions", () => {
    for (const parameters of [repetitionParameters(12, 3, 10), allFailureParameters(3, 10)]) {
      const withoutRecovery = computeActivityDurationResult(
        durationFacts({ executionParameters: parameters }),
      );
      // Sans Récupération : 3 × 10 = 30 de pauses connues, aucune durée d'Exercice.
      expect(withoutRecovery).toEqual(expect.objectContaining({ kind: "omitted", knownSeconds: 30 }));
      expect(withoutRecovery.seconds).toBeUndefined();
      // Avec Récupération : 2 × 10 + 15 = 35 (R remplace la Pause terminale).
      expect(
        computeActivityDurationSeconds(
          durationFacts({ executionParameters: parameters, postActivityRecoverySeconds: 15 }),
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
        executionParameters: durationParameters(20),
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
  const uniform = (count: number) => durationParameters(30, count, 10);

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
        executionParameters: durationParameters(30, 2, 5),
        postActivityRecoverySeconds: 10,
      },
      {
        type: "EXERCISE",
        executionParameters: repetitionParameters(12, 3, 10),
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
      structuralPosition: "IN_TOUR",
      position: 0,
      name: "Gainage",
      executionParameters: durationParameters(30),
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
      anActivity({ id: "a1", executionParameters: durationParameters(30, 2, 5) }),
      anActivity({ id: "a2", name: "Squats", executionParameters: durationParameters(20, 1, 0) }),
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
      anActivity({ id: "a1", executionParameters: durationParameters(30, 2, 5), postActivityRecoverySeconds: 20 }),
    ]);
    // 2×30 + 1×5 + 20 = 85.
    expect(toEstimatedDurationFacts(session)).toMatchObject({ inTourDurationSeconds: 85 });
  });

  it("excludes the Exercise's own duration for a REPETITIONS Activity but still counts its pause, and flags the estimate as a lower bound (RM-072)", () => {
    const session = aSession([
      anActivity({ id: "a1", executionParameters: repetitionParameters(12, 3, 10) }),
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
      anActivity({ id: "a1", executionParameters: durationParameters(30) }),
      anActivity({ id: "a2", executionParameters: repetitionParameters(12) }),
    ]);
    expect(toEstimatedDurationFacts(session).isLowerBoundEstimate).toBe(true);
  });

  it("treats an all-FAILURE Activity (former failure mode, migrated) like REPETITIONS: no nominal duration, still counts its pause, flags a lower bound (D-111/D-112)", () => {
    const session = aSession([anActivity({ id: "a1", executionParameters: allFailureParameters(3, 10) })]);
    expect(toEstimatedDurationFacts(session)).toMatchObject({
      inTourDurationSeconds: 30,
      isLowerBoundEstimate: true,
    });
  });

  it("counts a legacy standalone RECOVERY Activity's own duration once, without series multiplication nor pause (D-041)", () => {
    const session = aSession([
      anActivity({ id: "a1", executionParameters: durationParameters(30, 2, 5) }),
      anActivity({
        id: "rec",
        type: "RECOVERY",
        name: "Récupération",
        executionParameters: durationParameters(20),
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
      [anActivity({ id: "core", executionParameters: durationParameters(20), structuralPosition: "IN_TOUR" })],
      {
        beforeTour: [
          anActivity({ id: "warmup", executionParameters: durationParameters(10), structuralPosition: "BEFORE_TOUR" }),
        ],
        afterTour: [
          anActivity({ id: "stretch", executionParameters: durationParameters(5), structuralPosition: "AFTER_TOUR" }),
        ],
        tour: {
          id: "tour-1",
          position: 1,
          repeatCount: 3,
          exercises: [anActivity({ id: "core", executionParameters: durationParameters(20) })],
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
          executionParameters: allFailureParameters(),
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
          executionParameters: durationParameters(20, 1, 0, { sideMode: "LEFT_RIGHT" }),
          sideMode: "LEFT_RIGHT",
        }),
      ],
      {
        beforeTour: [
          anActivity({
            id: "warmup",
            executionParameters: durationParameters(10, 1, 0, { sideMode: "RIGHT_LEFT" }),
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
    const sideMode = overrides.sideMode ?? "UNILATERAL";
    return {
      type: "EXERCISE",
      executionParameters: durationParameters(30, 2, 5, { sideMode }),
      postActivityRecoverySeconds: 20,
      sideMode,
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
      executionParameters: durationParameters(30, 2, 5),
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
  const bilateral = (order: "BY_SIDE" | "BY_SERIES", count = 3) =>
    durationParameters(30, count, 10, { sideMode: "RIGHT_LEFT", sideOrder: order, sideRecoverySeconds: 5 });

  it("counts both sides, the Pause between sides once (by side) or N times (by series), R once", () => {
    const facts = (order: "BY_SIDE" | "BY_SERIES", recovery: number): ActivityDurationFacts => ({
      type: "EXERCISE",
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
      expect(invertTotalDuration(bilateral("BY_SERIES", 1), total)).toEqual({
        seriesCount: count,
        totalSeconds: total,
        adjusted: false,
      });
    }
  });
});

describe("P3-13/tours-cycles-list — une seule autorité pour la lecture complète et la liste", () => {
  it("développe les répétitions du Circuit sur la seule zone IN_TOUR et type le total exact/≈/≥", () => {
    const exact: ActivityDurationFacts = { type: "EXERCISE", executionParameters: durationParameters(30, 2, 10), postActivityRecoverySeconds: 0 };
    const unknown: ActivityDurationFacts = { type: "EXERCISE", executionParameters: allFailureParameters(2, 15), postActivityRecoverySeconds: 0 };
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
              structuralPosition: "IN_TOUR",
              position: 0,
              name: "A",
              executionParameters: durationParameters(30),
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

describe("PRE4-1.1/AC20 — Cible FAILURE : contribution identique à l'ancien mode « à l'échec »", () => {
  it("un Exercice dont une Cible est FAILURE est omis, ses Pauses connues comptent et la Séance devient une borne minimale", () => {
    const failure: ActivityDurationFacts = {
      type: "EXERCISE",
      executionParameters: uniformParameters({ mode: "DURATION", count: 3, target: "FAILURE", pauseSeconds: 10 }),
      postActivityRecoverySeconds: 0,
    };
    const result = computeActivityDurationResult(failure);
    expect(result.kind).toBe("omitted");
    expect(result.seconds).toBeUndefined();
    expect(result.knownSeconds).toBe(30);
    const exact: ActivityDurationFacts = { type: "EXERCISE", executionParameters: durationParameters(30, 2, 10), postActivityRecoverySeconds: 0 };
    expect(computeStructuredSessionDuration({ beforeTour: [exact], inTour: [failure], afterTour: [], tourRepeatCount: 2 })).toEqual({
      kind: "lowerBound",
      seconds: 80 + 2 * 30,
    });
  });
});

describe("PRE-4 story 2.1 — agrégation de Séance pendant la transition", () => {
  const exercise = (executionParameters: ActivityDurationFacts["executionParameters"]): ActivityDurationFacts => ({
    type: "EXERCISE",
    executionParameters,
    postActivityRecoverySeconds: 0,
  });
  const exact = exercise(durationParameters(60));
  const partial = exercise(variableParameters({ rows: [[30, 10], [45, 10], ["FAILURE", 10]] }));
  const incomplete = exercise(variableParameters({ rows: [[30, 10], ["UNSET", 10], [45, 10]] }));

  it("PRE4-2.1/AC9 — une Séance contenant un `lowerBound` ou un `incomplete` est partielle (≥), contributions connues comprises", () => {
    expect(computeActivityDurationResult(partial).kind).toBe("lowerBound");
    expect(computeActivityDurationResult(incomplete).kind).toBe("incomplete");
    for (const other of [partial, incomplete]) {
      // 60 + (30 + 45 + 3 × 10).
      expect(
        computeStructuredSessionDuration({ beforeTour: [], inTour: [exact, other], afterTour: [], tourRepeatCount: 1 }),
      ).toEqual({ kind: "lowerBound", seconds: 60 + 105 });
      expect(computeZoneDurationFacts([exact, other])).toEqual({ seconds: 165, isLowerBoundEstimate: true });
    }
    expect(computeStructuredSessionDuration({ beforeTour: [], inTour: [exact], afterTour: [], tourRepeatCount: 2 })).toEqual({
      kind: "exact",
      seconds: 120,
    });
  });

  it("PRE4-2.1/AC9 — Circuit répété : contributions connues d'un `lowerBound` et d'un `incomplete` multipliées", () => {
    // Circuit × 3 : 3 × (105 + 105) ; avant le Circuit : 60 exact.
    expect(
      computeStructuredSessionDuration({ beforeTour: [exact], inTour: [partial, incomplete], afterTour: [], tourRepeatCount: 3 }),
    ).toEqual({ kind: "lowerBound", seconds: 60 + 3 * (105 + 105) });
  });

  it("PRE4-2.1/AC9 — multiplicité 0 : un Circuit vide de passages ne rend pas la Séance partielle", () => {
    expect(
      computeStructuredSessionDuration({ beforeTour: [exact], inTour: [partial, incomplete], afterTour: [], tourRepeatCount: 0 }),
    ).toEqual({ kind: "exact", seconds: 60 });
  });

  it("PRE4-2.1/AC9 — Séance mêlant `estimated` et `lowerBound` : ≥ prime sur ≈", () => {
    // Répétitions 4 × 15, Bip 4 s, Pause 15 s : 4 × (60 + 15) = 300 s estimé.
    const estimated = exercise(uniformParameters({ mode: "REPETITIONS", count: 4, target: 15, pauseSeconds: 15, cadenceBeepIntervalSeconds: 4 }));
    expect(computeActivityDurationResult(estimated).kind).toBe("estimated");
    expect(
      computeStructuredSessionDuration({ beforeTour: [], inTour: [estimated, partial], afterTour: [], tourRepeatCount: 1 }),
    ).toEqual({ kind: "lowerBound", seconds: 300 + 105 });
    expect(
      computeStructuredSessionDuration({ beforeTour: [], inTour: [estimated, exact], afterTour: [], tourRepeatCount: 1 }),
    ).toEqual({ kind: "estimated", seconds: 300 + 60 });
  });
});

describe("PRE-4 story 2.2 — agrégation de Séance et Durée estimée d'exécution", () => {
  const exercise = (
    executionParameters: ActivityDurationFacts["executionParameters"],
    postActivityRecoverySeconds = 0,
  ): ActivityDurationFacts => ({ type: "EXERCISE", executionParameters, postActivityRecoverySeconds });
  const session = (inTour: readonly ActivityDurationFacts[], tourRepeatCount = 1) =>
    computeStructuredSessionDuration({ beforeTour: [], inTour, afterTour: [], tourRepeatCount });
  // Exercices seuls de référence (montants écrits dans le test).
  const exact165 = exercise(variableParameters({ rows: [[30, 10], [45, 10], [60, 10]] }));
  const estimated104 = exercise(
    variableParameters({ mode: "REPETITIONS", rows: [[10, 10], [12, 10], [15, 10]], cadenceBeepIntervalSeconds: 2 }),
  );
  const r01 = (recovery = 0) => exercise(variableParameters({ rows: [[30, 10], [45, 10], ["FAILURE", 10]] }), recovery);

  it("PRE4-2.2/AC4 — deux Exercices seuls, sans Récupération : 269 s ≈ ; 270 s ≥ ; 195 s ≥ avec Répétitions Bip 0", () => {
    expect(session([exact165, estimated104])).toEqual({ kind: "estimated", seconds: 165 + 104 });
    expect(session([exact165, r01()])).toEqual({ kind: "lowerBound", seconds: 165 + 105 });
    const beepless = exercise(repetitionParameters(12, 3, 10));
    expect(computeActivityDurationResult(beepless).kind).toBe("omitted");
    expect(session([exact165, beepless])).toEqual({ kind: "lowerBound", seconds: 165 + 30 });
  });

  it("PRE4-2.2/AC4 — Copie dont une Cible héritée est à renseigner (Q30) : 165 + (30 + 45) + 3 × 10 = 270 s ≥, sans omission", () => {
    const copy = exercise(variableParameters({ rows: [[30, 10], ["UNSET", 10], [45, 10]] }));
    expect(computeActivityDurationResult(copy).kind).toBe("incomplete");
    expect(computeActivityDurationResult(copy).knownSeconds).toBe(30 + 45 + 10 + 10 + 10);
    expect(session([exact165, copy])).toEqual({ kind: "lowerBound", seconds: 270 });
  });

  it("PRE4-2.2/AC4 — Circuit répété 2 fois contenant R01 (105 s ≥) → 210 s ≥ ; Récupération interne comptée à chaque répétition, une fois", () => {
    expect(session([r01()], 2)).toEqual({ kind: "lowerBound", seconds: 210 });
    // Avec R 40 dans le Circuit : 2 × (105 − 10 + 40).
    expect(session([r01(40)], 2)).toEqual({ kind: "lowerBound", seconds: 2 * 135 });
  });

  it("PRE4-2.2/AC4 — l'omission reste propre à l'Exercice : les autres contributions sont entières", () => {
    const omitted = exercise(allFailureParameters(3, 10));
    expect(session([exact165, omitted, estimated104])).toEqual({ kind: "lowerBound", seconds: 165 + 30 + 104 });
  });

  it("PRE4-2.2/AC5 — P31 : Durée estimée d'exécution = occurrence 135 + Compte à rebours initial 10 + Fin de séance 5 = 150 s ≥", () => {
    // Compte à rebours et Fin propres de l'Exercice : ni exécutés ni comptés dans la Séance.
    const withOwnPhases = exercise(
      { ...variableParameters({ rows: [[30, 10], [45, 10], ["FAILURE", 10]] }), countdownSeconds: 7, endSeconds: 3 },
      40,
    );
    const structure = { beforeTour: [], inTour: [withOwnPhases], afterTour: [], tourRepeatCount: 1 };
    const execution = computeSessionExecutionDuration(structure, { initialCountdownSeconds: 10, finalPhaseSeconds: 5 });
    expect(execution).toEqual({ kind: "lowerBound", seconds: 135 + 10 + 5 });
    // Le montant de base est l'occurrence (135 s), pas l'intrinsèque (105 s).
    expect(execution.seconds).not.toBe(105 + 10 + 5);
    // Mesures intrinsèque et d'occurrence : distinctes, sans Compte à rebours initial ni Fin de séance.
    expect(computeIntrinsicDuration(withOwnPhases.executionParameters)).toEqual(
      expect.objectContaining({ kind: "lowerBound", seconds: 105 }),
    );
    expect(computeStructuredSessionDuration(structure)).toEqual({ kind: "lowerBound", seconds: 135 });
  });

  it("PRE4-2.2/AC5 — P31 sur une Séance persistée : Circuit développé, phases de la Séance une seule fois, nature agrégée conservée", () => {
    const activity = (position: number, overrides: Partial<Activity>): Activity => ({
      id: `a${position}`,
      type: "EXERCISE",
      structuralPosition: "IN_TOUR",
      position,
      name: "A",
      executionParameters: durationParameters(30),
      postActivityRecoverySeconds: 0,
      instruction: null,
      bodyZoneIds: [],
      ...overrides,
    });
    const persisted = {
      id: "s",
      ownerId: "o",
      name: "S",
      color: DEFAULT_SESSION_COLOR,
      labelId: null,
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
          repeatCount: 3,
          exercises: [activity(0, { executionParameters: durationParameters(30, 2, 10, { countdownSeconds: 7, endSeconds: 3 }) })],
        },
      },
    } as Session;
    // Circuit × 3 de (2 × (30 + 10)) exact + 10 + 5.
    expect(toSessionDurationResult(persisted)).toEqual({ kind: "exact", seconds: 3 * 80 });
    expect(toSessionExecutionDurationResult(persisted)).toEqual({ kind: "exact", seconds: 3 * 80 + 10 + 5 });
    const estimated = {
      ...persisted,
      cycle: {
        ...persisted.cycle,
        tour: { ...persisted.cycle.tour, exercises: [activity(0, { executionParameters: variableParameters({ mode: "REPETITIONS", rows: [[10, 10], [12, 10], [15, 10]], cadenceBeepIntervalSeconds: 2 }) })] },
      },
    } as Session;
    expect(toSessionExecutionDurationResult(estimated)).toEqual({ kind: "estimated", seconds: 3 * 104 + 15 });
    // Attendu de l'AC5 : l'Exercice de l'AC2 (occurrence 135 s), seul, Circuit × 1, CR initial 10 s, Fin 5 s → 150 s ≥.
    const lowerBound = {
      ...persisted,
      cycle: {
        ...persisted.cycle,
        tour: {
          ...persisted.cycle.tour,
          repeatCount: 1,
          exercises: [
            activity(0, {
              executionParameters: {
                ...variableParameters({ rows: [[30, 10], [45, 10], ["FAILURE", 10]] }),
                countdownSeconds: 7,
                endSeconds: 3,
              },
              postActivityRecoverySeconds: 40,
            }),
          ],
        },
      },
    } as Session;
    expect(toSessionExecutionDurationResult(lowerBound)).toEqual({ kind: "lowerBound", seconds: 135 + 10 + 5 });
  });
});

/** PRE-6 (story 1.3, AD-40) : durée de Séance selon la nature du Circuit. */
describe("PRE6-1.3 — computeStructuredSessionDuration selon la nature du Circuit", () => {
  const bilateral: ActivityDurationFacts = {
    type: "EXERCISE",
    executionParameters: uniformParameters({
      mode: "DURATION",
      count: 3,
      target: 30,
      pauseSeconds: 10,
      sideMode: "LEFT_RIGHT",
      sideRecoverySeconds: 5,
    }),
    postActivityRecoverySeconds: 0,
  };
  const outside: ActivityDurationFacts = { type: "EXERCISE", executionParameters: durationParameters(60), postActivityRecoverySeconds: null };

  it("Séries : chaque exercice du Circuit contribue ses passages (225 s ; 255 s avec R 20), hors Circuit une fois", () => {
    expect(
      computeStructuredSessionDuration({ beforeTour: [outside], inTour: [bilateral], afterTour: [], tourRepeatCount: 3, circuitNature: "SERIES" }),
    ).toEqual({ kind: "exact", seconds: 60 + 225 });
    expect(
      computeStructuredSessionDuration({
        beforeTour: [],
        inTour: [{ ...bilateral, postActivityRecoverySeconds: 20 }],
        afterTour: [],
        tourRepeatCount: 3,
        circuitNature: "SERIES",
      }),
    ).toEqual({ kind: "exact", seconds: 255 });
  });

  it("Tours : inchangé (contenu interne × N), nature absente lue Tours", () => {
    const occurrence = computeActivityDurationResult(bilateral).knownSeconds;
    const tours = { beforeTour: [outside], inTour: [bilateral], afterTour: [], tourRepeatCount: 2 };
    expect(computeStructuredSessionDuration(tours)).toEqual({ kind: "exact", seconds: 60 + 2 * occurrence });
    expect(computeStructuredSessionDuration({ ...tours, circuitNature: "TOURS" })).toEqual(computeStructuredSessionDuration(tours));
  });

  it("nature du total : ≥ l'emporte sur ≈, qui l'emporte sur exact", () => {
    const failure: ActivityDurationFacts = { type: "EXERCISE", executionParameters: allFailureParameters(2, 15), postActivityRecoverySeconds: 0 };
    const beep: ActivityDurationFacts = {
      type: "EXERCISE",
      executionParameters: uniformParameters({ mode: "REPETITIONS", count: 2, target: 10, pauseSeconds: 10, cadenceBeepIntervalSeconds: 2 }),
      postActivityRecoverySeconds: 0,
    };
    const series = { beforeTour: [], afterTour: [], tourRepeatCount: 2, circuitNature: "SERIES" as const };
    expect(computeStructuredSessionDuration({ ...series, inTour: [bilateral, beep] }).kind).toBe("estimated");
    expect(computeStructuredSessionDuration({ ...series, inTour: [bilateral, beep, failure] }).kind).toBe("lowerBound");
  });

  it("Séries : un exercice au Mode inconnu ne lève pas, rend le total ≥ et laisse le total connu des passages", () => {
    const unknownMode: ActivityDurationFacts = {
      type: "EXERCISE",
      executionParameters: { ...durationParameters(30, 2, 10), mode: null },
      postActivityRecoverySeconds: 0,
    };
    expect(
      computeStructuredSessionDuration({ beforeTour: [], inTour: [bilateral, unknownMode], afterTour: [], tourRepeatCount: 3, circuitNature: "SERIES" }),
    ).toEqual({ kind: "lowerBound", seconds: 225 });
  });

  it("Séries : une ancienne Récupération autonome est comptée N fois, en entier", () => {
    const legacy: ActivityDurationFacts = { type: "RECOVERY", executionParameters: durationParameters(45), postActivityRecoverySeconds: 0 };
    expect(
      computeStructuredSessionDuration({ beforeTour: [], inTour: [bilateral, legacy], afterTour: [], tourRepeatCount: 3, circuitNature: "SERIES" }),
    ).toEqual({ kind: "exact", seconds: 225 + 3 * 45 });
  });

  it("la durée d'exécution (P31) garde son ajout du compte à rebours et de la Fin", () => {
    const structure = { beforeTour: [], inTour: [bilateral], afterTour: [], tourRepeatCount: 3, circuitNature: "SERIES" as const };
    expect(computeSessionExecutionDuration(structure, { initialCountdownSeconds: 10, finalPhaseSeconds: 5 })).toEqual({
      kind: "exact",
      seconds: 225 + 15,
    });
  });

  it("toSessionDurationResult lit cycle.tour.nature", () => {
    const session = {
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      cycle: {
        tour: {
          repeatCount: 3,
          nature: "SERIES",
          exercises: [{ ...bilateral, id: "a", structuralPosition: "IN_TOUR", position: 0 }],
        },
      },
    } as unknown as Session;
    expect(toSessionDurationResult(session)).toEqual({ kind: "exact", seconds: 225 });
    expect(toSessionExecutionDurationResult(session)).toEqual({ kind: "exact", seconds: 240 });
  });
});
