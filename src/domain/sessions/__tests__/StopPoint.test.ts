import { describe, expect, it } from "@jest/globals";

import type { StructuralPosition } from "../Session";
import {
  areStopPointsNonConsecutive,
  consecutiveStopPointPairs,
  hasTourBoundaryConflict,
  hasUniquePositionPerScope,
  isStopPointAllowed,
  isStopPointPlacementAllowed,
  isStopPointPlacementValid,
  isStopPointPositionInRange,
  isStopPointProposable,
  orderStopPointsByScope,
  positionInSequence,
  repeatsCircuit,
  scopeSequence,
  stopPointNeighbors,
  structuralSequence,
  tourBoundaryConflict,
  tourBoundaryOf,
  tourBoundaryPoints,
  withoutStopPoint,
  withoutStopPoints,
  wouldBeConsecutive,
  type SequenceItem,
  type StopPoint,
} from "../StopPoint";

function occ(id: string, structuralPosition: StructuralPosition, type: "EXERCISE" | "RECOVERY" = "EXERCISE") {
  return { id, structuralPosition, type };
}

/** Séquence lisible : identifiant de l'occurrence, ou `P:id` pour un point. */
function labels(items: readonly SequenceItem<{ readonly id: string }, StopPoint>[]): string[] {
  return items.map((item) => (item.kind === "OCCURRENCE" ? item.occurrence.id : `P:${item.point.id}`));
}

describe("isStopPointPlacementValid", () => {
  it("rejects a placement immediately after the initial countdown", () => {
    expect(
      isStopPointPlacementValid({
        isImmediatelyAfterInitialCountdown: true,
        isImmediatelyBeforeSessionEnd: false,
      }),
    ).toBe(false);
  });

  it("rejects a placement immediately before the session end", () => {
    expect(
      isStopPointPlacementValid({
        isImmediatelyAfterInitialCountdown: false,
        isImmediatelyBeforeSessionEnd: true,
      }),
    ).toBe(false);
  });

  it("accepts any other placement", () => {
    expect(
      isStopPointPlacementValid({
        isImmediatelyAfterInitialCountdown: false,
        isImmediatelyBeforeSessionEnd: false,
      }),
    ).toBe(true);
  });
});

describe("stopPointNeighbors (liste affichée, sans répétition)", () => {
  const occurrences = [occ("b1", "BEFORE_TOUR"), occ("i1", "IN_TOUR"), occ("i2", "IN_TOUR")];

  it("BEFORE_TOUR p=0 directly follows the initial countdown", () => {
    expect(stopPointNeighbors(occurrences, { scope: "BEFORE_TOUR", position: 0 })).toEqual({
      isImmediatelyAfterInitialCountdown: true,
      isImmediatelyBeforeSessionEnd: false,
    });
  });

  it("IN_TOUR p=0 is preceded by the BEFORE_TOUR occurrence", () => {
    expect(stopPointNeighbors(occurrences, { scope: "IN_TOUR", position: 0 })).toEqual({
      isImmediatelyAfterInitialCountdown: false,
      isImmediatelyBeforeSessionEnd: false,
    });
  });

  it("the last IN_TOUR slot with nothing after directly precedes the end", () => {
    expect(stopPointNeighbors(occurrences, { scope: "IN_TOUR", position: 2 })).toEqual({
      isImmediatelyAfterInitialCountdown: false,
      isImmediatelyBeforeSessionEnd: true,
    });
  });

  it("AFTER_TOUR p=0 with no AFTER_TOUR occurrence directly precedes the end", () => {
    expect(stopPointNeighbors(occurrences, { scope: "AFTER_TOUR", position: 0 }).isImmediatelyBeforeSessionEnd).toBe(
      true,
    );
  });
});

describe("isStopPointPositionInRange / isStopPointAllowed", () => {
  const occurrences = [occ("i1", "IN_TOUR"), occ("i2", "IN_TOUR")];

  it("accepts 0..n integers only", () => {
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 0 })).toBe(true);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 2 })).toBe(true);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 3 })).toBe(false);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: -1 })).toBe(false);
    expect(isStopPointPositionInRange(occurrences, { scope: "IN_TOUR", position: 0.5 })).toBe(false);
  });

  it("allows only the slot between the two occurrences", () => {
    expect([0, 1, 2].map((position) => isStopPointAllowed(occurrences, { scope: "IN_TOUR", position }))).toEqual([
      false,
      true,
      false,
    ]);
  });
});

describe("hasUniquePositionPerScope", () => {
  it("rejects a duplicate position within the same scope", () => {
    const points: readonly StopPoint[] = [
      { id: "s1", scope: "IN_TOUR", position: 1 },
      { id: "s2", scope: "IN_TOUR", position: 1 },
    ];
    expect(hasUniquePositionPerScope(points)).toBe(false);
  });

  it("allows the same position across two distinct scopes", () => {
    const points: readonly StopPoint[] = [
      { id: "s1", scope: "BEFORE_TOUR", position: 0 },
      { id: "s2", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(hasUniquePositionPerScope(points)).toBe(true);
  });
});

describe("orderStopPointsByScope", () => {
  it("orders by ascending position within the requested scope only", () => {
    const points: readonly StopPoint[] = [
      { id: "s2", scope: "IN_TOUR", position: 2 },
      { id: "s1", scope: "IN_TOUR", position: 1 },
      { id: "s3", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(orderStopPointsByScope(points, "IN_TOUR").map((point) => point.id)).toEqual(["s1", "s2"]);
  });
});

/**
 * Story 6.1 (D-441, remplace ARB-3) : le point est un élément autonome de la
 * séquence mêlée de sa portée ; plus de rattachement à une occurrence.
 */
describe("séquence mêlée (D-441)", () => {
  const occurrences = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("B", "IN_TOUR"), occ("Z", "AFTER_TOUR")];

  it("scopeSequence : [pt(s,0)?, occ1, pt(s,1)?, …, occn, pt(s,n)?]", () => {
    const points: StopPoint[] = [
      { id: "end", scope: "IN_TOUR", position: 2 },
      { id: "head", scope: "IN_TOUR", position: 0 },
      { id: "mid", scope: "IN_TOUR", position: 1 },
      { id: "out", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(labels(scopeSequence(occurrences, points, "IN_TOUR"))).toEqual(["P:head", "A", "P:mid", "B", "P:end"]);
  });

  it("structuralSequence : BEFORE_TOUR, puis IN_TOUR, puis AFTER_TOUR", () => {
    const points: StopPoint[] = [
      { id: "w", scope: "BEFORE_TOUR", position: 1 },
      { id: "c", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(labels(structuralSequence(occurrences, points))).toEqual(["W", "P:w", "A", "B", "P:c", "Z"]);
  });

  it("un point hors bornes est ramené à la borne la plus proche", () => {
    const points: StopPoint[] = [
      { id: "far", scope: "IN_TOUR", position: 9 },
      { id: "neg", scope: "IN_TOUR", position: -1 },
    ];
    expect(labels(scopeSequence(occurrences, points, "IN_TOUR"))).toEqual(["P:neg", "A", "B", "P:far"]);
  });

  it("positionInSequence : nombre d'occurrences qui précèdent un rang de la séquence", () => {
    const items = scopeSequence(occurrences, [{ id: "mid", scope: "IN_TOUR", position: 1 }], "IN_TOUR");
    expect([0, 1, 2, 3].map((index) => positionInSequence(items, index))).toEqual([0, 1, 1, 2]);
  });
});

describe("RM-251 : non-consécutivité (D-441)", () => {
  const point = (id: string, scope: StructuralPosition, position: number): StopPoint => ({ id, scope, position });
  const pairIds = (pairs: readonly (readonly [StopPoint, StopPoint])[]) => pairs.map(([a, b]) => `${a.id}+${b.id}`);

  it("deux points séparés par un Exercice ne sont pas consécutifs", () => {
    const occurrences = [occ("A", "IN_TOUR"), occ("B", "IN_TOUR"), occ("C", "IN_TOUR")];
    expect(areStopPointsNonConsecutive(occurrences, [point("p", "IN_TOUR", 1), point("q", "IN_TOUR", 2)])).toBe(true);
  });

  it("une ancienne Récupération autonome ne sépare pas deux points", () => {
    const occurrences = [occ("A", "IN_TOUR"), occ("R", "IN_TOUR", "RECOVERY"), occ("C", "IN_TOUR")];
    const pairs = consecutiveStopPointPairs(occurrences, [point("p", "IN_TOUR", 1), point("q", "IN_TOUR", 2)]);
    expect(pairIds(pairs)).toEqual(["p+q"]);
  });

  it("un type absent est lu EXERCISE (sépare)", () => {
    const occurrences = [{ structuralPosition: "IN_TOUR" as const }, { structuralPosition: "IN_TOUR" as const }, { structuralPosition: "IN_TOUR" as const }];
    expect(areStopPointsNonConsecutive(occurrences, [point("p", "IN_TOUR", 1), point("q", "IN_TOUR", 2)])).toBe(true);
  });

  it("frontière : (BEFORE, nB) + (IN, 0)", () => {
    const occurrences = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("Z", "AFTER_TOUR")];
    expect(pairIds(consecutiveStopPointPairs(occurrences, [point("b", "BEFORE_TOUR", 1), point("h", "IN_TOUR", 0)]))).toEqual([
      "b+h",
    ]);
  });

  it("frontière : (IN, nI) + (AFTER, 0) — « après le dernier Exercice du Circuit » et « après le Circuit »", () => {
    const occurrences = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("B", "IN_TOUR"), occ("Z", "AFTER_TOUR")];
    expect(pairIds(consecutiveStopPointPairs(occurrences, [point("c", "AFTER_TOUR", 0), point("l", "IN_TOUR", 2)]))).toEqual([
      "l+c",
    ]);
  });

  it("frontière, Circuit vide : (BEFORE, nB) + (AFTER, 0)", () => {
    const occurrences = [occ("W", "BEFORE_TOUR"), occ("Z", "AFTER_TOUR")];
    expect(areStopPointsNonConsecutive(occurrences, [point("b", "BEFORE_TOUR", 1), point("c", "AFTER_TOUR", 0)])).toBe(false);
  });

  it("trois points consécutifs donnent deux paires, dans l'ordre de la séquence", () => {
    const occurrences = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("Z", "AFTER_TOUR")];
    const pairs = consecutiveStopPointPairs(occurrences, [
      point("c", "AFTER_TOUR", 0),
      point("b", "BEFORE_TOUR", 1),
      point("h", "IN_TOUR", 0),
      point("l", "IN_TOUR", 1),
    ]);
    expect(pairIds(pairs)).toEqual(["b+h", "l+c"]);
  });

  it("wouldBeConsecutive : candidat jugé contre les autres points, emplacement identique ignoré", () => {
    const occurrences = [occ("A", "IN_TOUR"), occ("B", "IN_TOUR"), occ("C", "IN_TOUR"), occ("Z", "AFTER_TOUR")];
    const existing = [point("p", "IN_TOUR", 1)];
    expect(wouldBeConsecutive(occurrences, existing, { scope: "IN_TOUR", position: 2 })).toBe(false);
    expect(wouldBeConsecutive(occurrences, [point("q", "IN_TOUR", 3)], { scope: "AFTER_TOUR", position: 0 })).toBe(true);
    expect(wouldBeConsecutive(occurrences, existing, { scope: "IN_TOUR", position: 1 })).toBe(false);
  });
});

describe("isStopPointProposable (story 7.1, D-442 : tête de Circuit proposée)", () => {
  const occurrences = [occ("W", "BEFORE_TOUR"), occ("A", "IN_TOUR"), occ("Z", "AFTER_TOUR")];

  it("propose la tête de Circuit quand RM-219 l'autorise (remplace la non-proposition de D-441)", () => {
    expect(isStopPointAllowed(occurrences, { scope: "IN_TOUR", position: 0 })).toBe(true);
    expect(isStopPointProposable(occurrences, { scope: "IN_TOUR", position: 0 })).toBe(true);
  });

  it("suit isStopPointAllowed ailleurs", () => {
    expect(isStopPointProposable(occurrences, { scope: "IN_TOUR", position: 1 })).toBe(true);
    expect(isStopPointProposable(occurrences, { scope: "BEFORE_TOUR", position: 0 })).toBe(false);
    expect(isStopPointProposable(occurrences, { scope: "AFTER_TOUR", position: 1 })).toBe(false);
  });
});

describe("withoutStopPoint (PRE-6 story 4.2)", () => {
  const points: StopPoint[] = [
    { id: "a", scope: "BEFORE_TOUR", position: 1 },
    { id: "b", scope: "IN_TOUR", position: 1 },
  ];

  it("removes the point by id", () => {
    expect(withoutStopPoint(points, "a")).toEqual([points[1]]);
  });

  it("returns the same list (identity) for an unknown id", () => {
    expect(withoutStopPoint(points, "zz")).toBe(points);
  });
});

/** PRE-6 story 7.1 (D-442) : début et fin de Tour, N du Circuit, conflit de Tour. */
describe("début et fin de Tour (story 7.1, D-442)", () => {
  /** Circuit seul [A, B] : il ouvre et clôt la Séance. */
  const circuitOnly = [occ("A", "IN_TOUR"), occ("B", "IN_TOUR")];
  const head = { scope: "IN_TOUR" as const, position: 0 };
  const tail = { scope: "IN_TOUR" as const, position: 2 };

  it("repeatsCircuit : N ≥ 2 seulement (absent : 1)", () => {
    expect(repeatsCircuit()).toBe(false);
    expect(repeatsCircuit({ tourRepeatCount: 1 })).toBe(false);
    expect(repeatsCircuit({ tourRepeatCount: 2 })).toBe(true);
    expect(repeatsCircuit({ tourRepeatCount: Number.NaN })).toBe(false);
  });

  it("tourBoundaryOf : début, fin ou ni l'un ni l'autre ; seuls les Exercices comptent", () => {
    expect(tourBoundaryOf(circuitOnly, head)).toBe("HEAD");
    expect(tourBoundaryOf(circuitOnly, tail)).toBe("TAIL");
    expect(tourBoundaryOf(circuitOnly, { scope: "IN_TOUR", position: 1 })).toBeNull();
    expect(tourBoundaryOf(circuitOnly, { scope: "AFTER_TOUR", position: 0 })).toBeNull();
    // Une ancienne Récupération autonome en tête ne sépare pas : (IN, 1) reste un début de Tour.
    const legacy = [occ("R", "IN_TOUR", "RECOVERY"), occ("A", "IN_TOUR")];
    expect(tourBoundaryOf(legacy, { scope: "IN_TOUR", position: 1 })).toBe("HEAD");
    // Circuit sans Exercice : rien n'est répété, aucune limite de Tour.
    expect(tourBoundaryOf([occ("R", "IN_TOUR", "RECOVERY")], head)).toBeNull();
    expect(tourBoundaryOf([], head)).toBeNull();
  });

  it("N = 1 : RM-219 telle quelle ; N ≥ 2 : début et fin de Tour autorisés même en ouverture ou clôture de Séance", () => {
    expect(isStopPointAllowed(circuitOnly, head)).toBe(false);
    expect(isStopPointAllowed(circuitOnly, tail)).toBe(false);
    expect(isStopPointPlacementAllowed(circuitOnly, head, { tourRepeatCount: 1 })).toBe(false);
    expect(isStopPointAllowed(circuitOnly, head, { tourRepeatCount: 2 })).toBe(true);
    expect(isStopPointAllowed(circuitOnly, tail, { tourRepeatCount: 2 })).toBe(true);
    expect(isStopPointProposable(circuitOnly, head, { tourRepeatCount: 2 })).toBe(true);
    // Hors Circuit, RM-219 n'est jamais levée.
    const withOutside = [occ("W", "BEFORE_TOUR"), ...circuitOnly];
    expect(isStopPointAllowed(withOutside, { scope: "BEFORE_TOUR", position: 0 }, { tourRepeatCount: 5 })).toBe(false);
    // Hors bornes : refusé quel que soit N.
    expect(isStopPointAllowed(circuitOnly, { scope: "IN_TOUR", position: 3 }, { tourRepeatCount: 2 })).toBe(false);
  });

  it("tourBoundaryConflict : début et fin à N ≥ 2 seulement ; premier début, dernier fin", () => {
    const h: StopPoint = { id: "h", ...head };
    const t: StopPoint = { id: "t", ...tail };
    expect(tourBoundaryConflict(circuitOnly, [h, t])).toBeNull();
    expect(tourBoundaryConflict(circuitOnly, [t, h], { tourRepeatCount: 2 })).toEqual({ head: h, tail: t });
    expect(hasTourBoundaryConflict(circuitOnly, [h, t], { tourRepeatCount: 2 })).toBe(true);
    expect(hasTourBoundaryConflict(circuitOnly, [h], { tourRepeatCount: 2 })).toBe(false);
    expect(hasTourBoundaryConflict(circuitOnly, [h, { id: "m", scope: "IN_TOUR", position: 1 }], { tourRepeatCount: 2 })).toBe(false);
    // Plusieurs débuts (ancienne Récupération en tête) : le premier ; plusieurs fins : la dernière.
    const legacy = [occ("R", "IN_TOUR", "RECOVERY"), occ("A", "IN_TOUR"), occ("S", "IN_TOUR", "RECOVERY")];
    const h0: StopPoint = { id: "h0", scope: "IN_TOUR", position: 0 };
    const h1: StopPoint = { id: "h1", scope: "IN_TOUR", position: 1 };
    const t2: StopPoint = { id: "t2", scope: "IN_TOUR", position: 2 };
    const t3: StopPoint = { id: "t3", scope: "IN_TOUR", position: 3 };
    expect(tourBoundaryConflict(legacy, [h1, t3, h0, t2], { tourRepeatCount: 2 })).toEqual({ head: h0, tail: t3 });
  });

  it("withoutStopPoints : retire par identifiants ; aucun visé : même liste", () => {
    const points: StopPoint[] = [
      { id: "a", scope: "BEFORE_TOUR", position: 1 },
      { id: "b", scope: "IN_TOUR", position: 1 },
      { id: "c", scope: "AFTER_TOUR", position: 0 },
    ];
    expect(withoutStopPoints(points, ["a", "c"])).toEqual([points[1]]);
    expect(withoutStopPoints(points, ["x"])).toBe(points);
    expect(withoutStopPoints(points, [])).toBe(points);
  });
});

describe("tourBoundaryOf — revue 7.1 : positions invalides", () => {
  it("un point hors bornes, non entier ou NaN n'est jamais une limite de Tour (aucun faux conflit)", () => {
    const circuit = [occ("A", "IN_TOUR"), occ("B", "IN_TOUR")];
    for (const position of [Number.NaN, Number.NEGATIVE_INFINITY, -1, 0.5, 3]) {
      expect(tourBoundaryOf(circuit, { scope: "IN_TOUR", position })).toBeNull();
    }
    const points: StopPoint[] = [
      { id: "p", scope: "IN_TOUR", position: Number.NaN },
      { id: "t", scope: "IN_TOUR", position: 2 },
    ];
    expect(tourBoundaryConflict(circuit, points, { tourRepeatCount: 2 })).toBeNull();
    expect(tourBoundaryPoints(circuit, points, "TAIL")).toEqual([points[1]]);
  });
});
